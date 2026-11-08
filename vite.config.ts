import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { execSync } from 'node:child_process';

/** Sichtbare Build-ID: Commit (kurz) und Build-Datum, z. B. „83ad59d · 2026-11-08“. „+“ = mit lokalen Änderungen. */
function buildId(): string {
  const datum = new Date().toISOString().slice(0, 10);
  try {
    const sha = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    const dirty = execSync('git status --porcelain', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() ? '+' : '';
    return `${sha}${dirty} · ${datum}`;
  } catch { return `lokal · ${datum}`; }
}

export default defineConfig({
  base: './',
  define: { __BUILD_ID__: JSON.stringify(process.env.LERNSTOFF_BUILD_ID || buildId()) },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      workbox: {
        // Lokal gebündelte Schriften bleiben auch ohne Verbindung verfügbar.
        globPatterns: ['**/*.{js,wasm,css,html,svg,png,woff2}'],
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
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
});
