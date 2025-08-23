import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  server: {
    port: 5174,   // 👈 set your default port
  },
  plugins: [VitePWA()],
});


