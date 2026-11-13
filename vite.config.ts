/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import fs from 'node:fs';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { execSync } from 'node:child_process';

/** Sichtbare Build-ID: Commit (kurz) und Build-Datum, z. B. „83ad59d · 2026-11-08“. „+“ = mit lokalen Änderungen. */
function buildId(): string {
  const datum = new Date().toISOString().slice(0, 10);
  // Cloudflare Pages liefert den Commit als Umgebungsvariable (das Klonen dort ist flach, git geht trotzdem)
  if (process.env.CF_PAGES_COMMIT_SHA) return `${process.env.CF_PAGES_COMMIT_SHA.slice(0, 7)} · ${datum}`;
  try {
    const sha = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    const dirty = execSync('git status --porcelain', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() ? '+' : '';
    return `${sha}${dirty} · ${datum}`;
  } catch { return `lokal · ${datum}`; }
}

/**
 * Fachmodul-JSON in zwei Teile schneiden, damit die Startgröße klein bleibt:
 *   `…json?kern`  alles außer den großen Nachschlage-Listen (startet sofort),
 *   `…json?gross` nur Glossar und Steckbriefe (per import() nachgeladen, siehe modules/registry.ts).
 * Die JSON-Datei selbst bleibt unverändert (build-module.py, Schema, Prüfskripte lesen sie wie bisher).
 */
const NACHGELADENE_LISTEN = ['glossary', 'diseaseProfiles', 'drugProfiles'];
function fachmodulTeilen(): Plugin {
  const praefix = '\0fachmodul:';
  return {
    name: 'fachmodul-teilen',
    enforce: 'pre',
    async resolveId(source, importer) {
      const m = /^(.*\.json)\?(kern|gross)$/.exec(source);
      if (!m) return null;
      const r = await this.resolve(m[1]!, importer, { skipSelf: true });
      // Endung .js, sonst greift Vites eingebautes JSON-Plugin auf die erzeugte Datei zu.
      return r ? `${praefix}${m[2]}:${r.id}.teil.js` : null;
    },
    load(id) {
      if (!id.startsWith(praefix)) return null;
      const [teil, ...rest] = id.slice(praefix.length).split(':');
      const datei = rest.join(':').replace(/\.teil\.js$/, '');
      this.addWatchFile(datei);
      const alles = JSON.parse(fs.readFileSync(datei, 'utf8')) as Record<string, unknown>;
      const auswahl = Object.fromEntries(Object.entries(alles).filter(([k]) => NACHGELADENE_LISTEN.includes(k) === (teil === 'gross')));
      // JSON.parse auf einem String ist bei großen Objekten schneller als ein JS-Objektliteral.
      return `export default JSON.parse(${JSON.stringify(JSON.stringify(auswahl))});`;
    },
  };
}

export default defineConfig({
  base: './',
  test: {
    // Einzelne Tests (OCR, Diagnostik-Phantome, Prüfungssimulation, Fehlerheft) brauchen auf langsamen Rechnern
    // oder bei vielen parallelen Workern mehr als die 5 s Standard. 20 s ist das im Audit stabil getestete Profil.
    testTimeout: 20_000,
    hookTimeout: 20_000,
    // Glossar und Steckbriefe der Fachmodule vor jedem Test laden (in der App übernimmt das PageBoundary).
    setupFiles: ['src/test-setup.ts'],
  },
  define: { __BUILD_ID__: JSON.stringify(process.env.LERNSTOFF_BUILD_ID || buildId()) },
  plugins: [
    fachmodulTeilen(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      workbox: {
        // Lokal gebündelte Schriften bleiben auch ohne Verbindung verfügbar.
        // Titelbilder vorab laden (zusammen rund 430 KB); Raumfotos und Videos der Simulatoren bleiben beim Laufzeit-Cache.
        globPatterns: ['**/*.{js,wasm,css,html,svg,png,woff2}', 'titelbilder/*.webp'],
        // Texterkennung (ca. 13 MB) nicht vorab laden, sondern beim ersten Gebrauch zwischenspeichern.
        globIgnores: ['tesseract/**', 'bildgebung/**'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        runtimeCaching: [{
          urlPattern: ({ url }) => url.pathname.includes('/tesseract/'),
          handler: 'CacheFirst',
          options: { cacheName: 'tesseract', expiration: { maxEntries: 10 } },
        }, {
          // Handlungsvideos des Simulators erst beim Ansehen laden, danach offline verfügbar.
          urlPattern: ({ url }) => url.pathname.includes('/sim-videos/'),
          handler: 'CacheFirst',
          options: { cacheName: 'sim-videos', expiration: { maxEntries: 30 } },
        }, {
          // Echte Röntgen-/CT-Bilder erst beim Ansehen laden, danach offline verfügbar.
          urlPattern: ({ url }) => url.pathname.includes('/bildgebung/'),
          handler: 'CacheFirst',
          options: { cacheName: 'bildgebung', expiration: { maxEntries: 200 } },
        }, {
          // Raumfotos der Simulatoren (je ca. 50–110 KB): beim ersten Ansehen laden, danach offline.
          urlPattern: ({ url }) => url.pathname.includes('/raeume/'),
          handler: 'CacheFirst',
          options: { cacheName: 'raeume', expiration: { maxEntries: 150 } },
        }, {
          // Patientenporträts (512 px, je ca. 15 KB): beim ersten Ansehen laden, danach offline.
          urlPattern: ({ url }) => url.pathname.includes('/personen/'),
          handler: 'CacheFirst',
          options: { cacheName: 'personen', expiration: { maxEntries: 120 } },
        }],
      },
      manifest: {
        name: 'Lernstoff-Planer',
        short_name: 'Lernstoff',
        description: 'Lernstoff planen, quellengetreu zusammenfassen und Prüfungen vorbereiten',
        lang: 'de',
        start_url: '.',
        display: 'standalone',
        background_color: '#fbf6ec',
        theme_color: '#123f39',
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
