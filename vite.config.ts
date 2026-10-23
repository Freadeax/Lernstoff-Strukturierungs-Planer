import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      workbox: {
        // Texterkennung (ca. 13 MB) nicht vorab laden, sondern beim ersten Gebrauch zwischenspeichern.
        globIgnores: ['tesseract/**'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        runtimeCaching: [{
          urlPattern: ({ url }) => url.pathname.includes('/tesseract/'),
          handler: 'CacheFirst',
          options: { cacheName: 'tesseract', expiration: { maxEntries: 10 } },
        }],
      },
      manifest: {
        name: 'Lernstoff-Planer',
        short_name: 'Lernstoff',
        description: 'Lernstoff planen, quellengetreu zusammenfassen und Prüfungen vorbereiten',
        lang: 'de',
        start_url: '.',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#2563eb',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
    }),
  ],
});
