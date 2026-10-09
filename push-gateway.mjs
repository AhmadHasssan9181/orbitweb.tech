/**
 * Orbit Matrix Push Gateway
 * 
 * Implements the Matrix Push Gateway Specification:
 * POST /_matrix/push/v1/notify
 * 
 * Forwards Matrix push notifications to Google Firebase Cloud Messaging (FCM v1 API)
 * for project orbit-296fd (or custom project configured via service account).
 * 
 * Zero external dependencies: uses Node.js standard libraries (crypto, https, fs, path).
 */

import crypto from 'crypto';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Load Firebase Service Account credentials.
 * Checks in order:
 * 1. FIREBASE_SERVICE_ACCOUNT environment variable (inline JSON string or base64)
 * 2. GOOGLE_APPLICATION_CREDENTIALS environment variable (file path)
 * 3. ./serviceAccountKey.json
 * 4. ./firebase-service-account.json
 * 5. ./orbit-service-account.json
 */
export function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const raw = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
      const jsonStr = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error('[PushGateway] Failed to parse FIREBASE_SERVICE_ACCOUNT env var:', e.message);
    }
  }

  const candidatePaths = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    path.join(__dirname, 'serviceAccountKey.json'),
    path.join(__dirname, 'firebase-service-account.json'),
    path.join(__dirname, 'orbit-service-account.json'),
    path.join(__dirname, '..', 'serviceAccountKey.json'),
  ].filter(Boolean);

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try {
        const content = fs.readFileSync(p, 'utf8');
        const creds = JSON.parse(content);
        if (creds.client_email && creds.private_key) {
          console.log(`[PushGateway] Loaded service account from ${p} (project: ${creds.project_id || 'unknown'})`);
          return creds;
        }
      } catch (e) {
        console.error(`[PushGateway] Error reading ${p}:`, e.message);
      }
    }
  }

  return null;
}

/**
 * Generate a Google OAuth2 Access Token using RS256 JWT assertion.
 */
export async function getGoogleAccessToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && now < tokenExpiresAt - 60) {
    return cachedToken;
  }

  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const claimSet = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const base64UrlEncode = (str) =>
    Buffer.from(str)
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedClaim = base64UrlEncode(JSON.stringify(claimSet));
  const signInput = `${encodedHeader}.${encodedClaim}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signInput);
  const signature = signer.sign(serviceAccount.private_key, 'base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const assertion = `${signInput}.${signature}`;
  const postData = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${encodeURIComponent(assertion)}`;

  return new Promise((resolve, reject) => {
    const req = https.request(
      'https://oauth2.googleapis.com/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsed = JSON.parse(body);
              cachedToken = parsed.access_token;
              tokenExpiresAt = now + (parsed.expires_in || 3600);
              resolve(cachedToken);
            } catch (err) {
              reject(new Error(`Failed to parse OAuth response: ${err.message}`));
            }
          } else {
            reject(new Error(`OAuth token request failed (${res.statusCode}): ${body}`));
          }
        });
      }
    );

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Send an FCM message using the FCM v1 HTTP API.
 */
export async function sendFcmMessage(serviceAccount, accessToken, pushKey, dataPayload) {
  const projectId = serviceAccount.project_id || 'orbit-296fd';
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

  const payload = {
    message: {
      token: pushKey,
      data: dataPayload,
      android: {
        priority: 'HIGH',
      },
    },
  };

  const bodyData = JSON.stringify(payload);

  return new Promise((resolve) => {
    const req = https.request(
      url,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json; UTF-8',
          'Content-Length': Buffer.byteLength(bodyData),
        },
      },
      (res) => {
        let respBody = '';
        res.on('data', (chunk) => (respBody += chunk));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true });
          } else {
            console.warn(`[PushGateway] FCM error (${res.statusCode}) for token ${pushKey.slice(0, 15)}...: ${respBody}`);
            let errorDetails = {};
            try {
              errorDetails = JSON.parse(respBody);
            } catch (_) {}
            const errorCode = errorDetails?.error?.details?.[0]?.errorCode || errorDetails?.error?.status;
            const isUnregistered =
              errorCode === 'UNREGISTERED' ||
              res.statusCode === 404 ||
              (errorDetails?.error?.message && errorDetails.error.message.includes('not a valid FCM registration token'));
            resolve({ success: false, isUnregistered, status: res.statusCode, error: respBody });
          }
        });
      }
    );

    req.on('error', (err) => {
      console.error(`[PushGateway] FCM network error:`, err.message);
      resolve({ success: false, error: err.message });
    });

    req.write(bodyData);
    req.end();
  });
}

/**
 * Handle POST /_matrix/push/v1/notify
 */
export async function handleMatrixPushNotify(req, res) {
  let rawBody = '';
  req.on('data', (chunk) => (rawBody += chunk));
  req.on('end', async () => {
    let parsedBody;
    try {
      parsedBody = JSON.parse(rawBody || '{}');
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Expected valid JSON request body' }));
    }

    const notification = parsedBody.notification;
    if (!notification || !Array.isArray(notification.devices) || notification.devices.length === 0) {
      console.log('[PushGateway] Received notify request with no devices');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ rejected: [] }));
    }

    const serviceAccount = loadServiceAccount();
    if (!serviceAccount) {
      console.error('[PushGateway] ERROR: No Firebase service account configured! Cannot forward to FCM.');
      // Return 200 with empty rejected to avoid homeserver permanently deleting pushers while setup is completed
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        rejected: [],
        warning: 'No Firebase service account configured on push gateway',
      }));
    }

    let accessToken;
    try {
      accessToken = await getGoogleAccessToken(serviceAccount);
    } catch (err) {
      console.error('[PushGateway] Failed to get Google OAuth token:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Failed to authenticate with Firebase' }));
    }

    const rejected = [];
    const eventId = notification.event_id || '';
    const roomId = notification.room_id || '';
    const unread = String(notification.counts?.unread ?? 1);

    console.log(`[PushGateway] Dispatching push for room=${roomId}, event=${eventId} to ${notification.devices.length} device(s)`);

    for (const device of notification.devices) {
      const pushKey = device.pushkey;
      if (!pushKey) continue;

      const clientSecret = device.data?.default_payload?.cs || '';
      const dataPayload = {
        event_id: eventId,
        room_id: roomId,
        unread: unread,
        prio: 'high',
      };
      if (clientSecret) {
        dataPayload.cs = clientSecret;
      }

      const fcmResult = await sendFcmMessage(serviceAccount, accessToken, pushKey, dataPayload);
      if (!fcmResult.success) {
        if (fcmResult.isUnregistered) {
          rejected.push(pushKey);
        }
      } else {
        console.log(`[PushGateway] Successfully delivered push to ${pushKey.slice(0, 20)}...`);
      }
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ rejected }));
  });
}
