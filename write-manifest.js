// write-manifest.js  (ESM)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const manifest = {
  name: "Contact Manager PWA",
  short_name: "Contacts",
  description: "A simple, offline-capable contact manager",
  start_url: "/",
  scope: "/",
  display: "standalone",
  background_color: "#ffffff",
  theme_color: "#ffffff",
  icons: [
    { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
    { src: "/icons/icon-256x256.png", sizes: "256x256", type: "image/png", purpose: "any maskable" },
    { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
  ]
};

const outPath = path.join(__dirname, 'public', 'manifest.webmanifest');
fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2), 'utf8');
console.log('✅ wrote', outPath);
