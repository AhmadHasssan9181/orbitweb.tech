import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleMatrixPushNotify, loadServiceAccount } from './push-gateway.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // Matrix Push Gateway endpoints
  if (urlPath === '/_matrix/push/v1/notify' || urlPath === '/push/v1/notify') {
    if (req.method === 'POST') {
      return handleMatrixPushNotify(req, res);
    }
    if (req.method === 'GET') {
      const creds = loadServiceAccount();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        gateway: 'matrix',
        service: 'Orbit Push Gateway',
        status: 'ok',
        fcm_configured: Boolean(creds),
        project_id: creds?.project_id || null,
      }));
    }
  }

  // Health check endpoint
  if (urlPath === '/health') {
    const creds = loadServiceAccount();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      status: 'healthy',
      service: 'orbitweb.tech',
      push_gateway: {
        configured: Boolean(creds),
        project_id: creds?.project_id || null,
      },
      time: new Date().toISOString(),
    }));
  }

  // Static files
  let reqPath = urlPath;
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  const filePath = path.join(__dirname, reqPath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found: ' + reqPath);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  });
});

const creds = loadServiceAccount();
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Orbit Web & Push Gateway running at http://0.0.0.0:${PORT}/`);
  console.log(`Push Gateway endpoint: http://0.0.0.0:${PORT}/_matrix/push/v1/notify`);
  console.log(`Firebase FCM status: ${creds ? `Configured (project: ${creds.project_id})` : 'Awaiting serviceAccountKey.json'}`);
});
