# Orbit Landing Page (`orbitweb.tech`)

The official landing page and web portal for the **Orbit** Matrix ecosystem.

- **Domain:** [https://orbitweb.tech](https://orbitweb.tech)
- **Hosted on:** GitHub Pages
- **Technology:** Vanilla HTML5, CSS3 (Modern Light Theme), Modular SVG Graphics, Vanilla JavaScript (E2EE Megolm Simulator)

---

## DNS Configuration (for `orbitweb.tech`)

The domain nameservers are managed via:
```text
cont603385.earth.orderbox-dns.com
cont603385.mars.orderbox-dns.com
cont603385.mercury.orderbox-dns.com
cont603385.venus.orderbox-dns.com
```

### Required DNS Records in your DNS Management Console:

| Type | Host / Name | Target / Points To | Purpose |
|------|-------------|-------------------|---------|
| **A** | `@` (or `orbitweb.tech`) | `185.199.108.153` | GitHub Pages Apex IP |
| **A** | `@` (or `orbitweb.tech`) | `185.199.109.153` | GitHub Pages Apex IP |
| **A** | `@` (or `orbitweb.tech`) | `185.199.110.153` | GitHub Pages Apex IP |
| **A** | `@` (or `orbitweb.tech`) | `185.199.111.153` | GitHub Pages Apex IP |
| **CNAME** | `www` | `ahmadhasssan9181.github.io.` | Canonical WWW redirect |

> **Note on HTTPS:** Once DNS records propagate, GitHub automatically requests a free Let's Encrypt TLS/SSL certificate. Enable **"Enforce HTTPS"** in GitHub repository settings under **Settings -> Pages**.

---

## Features

- **Futuristic Sovereign Clean Aesthetic:** Crisp typography, modern card layout, soft ambient glows, and clean borders.
- **Custom Precision Vector SVGs:**
  - Animated underline headline accent on *"you're sovereign"*
  - Decentralized Matrix Federation Mesh Network with animated packets
  - Audited Rust Cryptography Megolm Double Ratchet pipeline diagram
  - MatrixRTC MSC4195 & LiveKit SFU calling topology
  - Orbit brand logo mark & icon suite
- **Interactive E2EE Simulator:** Real-time demonstration showing plaintext encrypting into opaque ciphertext before transmission to homeservers.
- **Comprehensive Comparison Table:** Orbit vs Discord, Slack, and WhatsApp.
- **Self-Hosting Guide:** One-click copyable Docker Compose configuration.

---

## Repositories in the Orbit Ecosystem

- **Orbit Web Client:** [AhmadHasssan9181/orbit-web](https://github.com/AhmadHasssan9181/orbit-web)
- **Orbit Android & Desktop Client:** [AhmadHasssan9181/orbit](https://github.com/AhmadHasssan9181/orbit)
- **Orbit Website:** [AhmadHasssan9181/orbitweb.tech](https://github.com/AhmadHasssan9181/orbitweb.tech)
