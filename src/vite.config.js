// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: false }, // ← disable PWA in dev
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/icon-192x192.png', 'icons/icon-512x512.png'],
      manifest: {
        name: 'Contact Manager PWA',
        short_name: 'Contacts',
        description: 'A simple contact manager Progressive Web App',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: 'icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
        ],
      },
    }),
  ],
});



