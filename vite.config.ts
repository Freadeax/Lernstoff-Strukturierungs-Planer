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

/**
 * Sicherheitsregeln auch dort, wo keine Header gesetzt werden können (GitHub Pages ignoriert public/_headers, Audit D-1):
 * dieselbe Content Security Policy wie in _headers als <meta> in index.html. Ohne frame-ancestors (im <meta> wirkungslos,
 * dafür prüft browser-pruefung.js, ob die Seite in einem fremden Rahmen läuft) und ohne upgrade-insecure-requests
 * (die echten Adressen sind https; lokal würde Safari sonst 127.0.0.1 auf https umschreiben). Nur im Build,
 * damit der Entwicklungsserver mit Hot Reload weiter läuft. Auf Cloudflare gelten Header und <meta> zusammen.
 */
export function cspAusHeaders(headers: string): string {
  const zeile = headers.split('\n').find((z) => /^\s+Content-Security-Policy:/.test(z));
  if (!zeile) throw new Error('public/_headers: keine Content-Security-Policy gefunden');
  return zeile.slice(zeile.indexOf(':') + 1).split(';').map((t) => t.trim())
    .filter((t) => t && !/^(frame-ancestors|upgrade-insecure-requests|report-uri|sandbox)\b/.test(t)).join('; ');
}
function sicherheitImHtml(): Plugin {
  return {
    name: 'sicherheit-im-html',
    apply: 'build',
    transformIndexHtml() {
      const csp = cspAusHeaders(fs.readFileSync('public/_headers', 'utf8'));
      return [
        { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: csp }, injectTo: 'head-prepend' },
        { tag: 'meta', attrs: { name: 'referrer', content: 'no-referrer' }, injectTo: 'head-prepend' },
      ];
    },
  };
}

/** Eine Build-ID für den ganzen Build: im Code (__BUILD_ID__) und in version.json müssen sie gleich sein. */
const BUILD_ID = process.env.LERNSTOFF_BUILD_ID || buildId();

/**
 * `version.json` neben index.html: die laufende App fragt sie regelmäßig ab (src/ui/shell/aktualisierung.ts)
 * und erkennt so eine neue Veröffentlichung, auch wenn der Browser den Service Worker selten prüft (iPhone).
 * Nicht im Vorab-Cache (kein .json in globPatterns), der Service Worker reicht die Anfrage ans Netz durch.
 */
function versionsDatei(): Plugin {
  return {
    name: 'versions-datei',
    apply: 'build',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ build: BUILD_ID }) + '\n' });
    },
  };
}

/**
 * Teile, die nur bei einer bestimmten Handlung gebraucht werden, nicht in den Vorab-Cache legen (Audit L-1):
 * der PDF-Leser (nur beim Einlesen einer PDF) und die Claude-Anbindung (braucht ohnehin Netz).
 * Sie werden beim ersten Gebrauch geladen und landen über die Laufzeitregel „nachgeladen“ im Cache.
 * Ausgenommen wird ein Teil nur, wenn ihn kein anderer Teil fest importiert: Sonst bräche die Seite offline,
 * die ihn fest einbindet. Dann bleibt er im Vorab-Cache und der Build sagt es (siehe NICHT_VORAB_PAKETE).
 */
const NICHT_VORAB_PAKETE = ['/node_modules/pdfjs-dist/', '/node_modules/@anthropic-ai/sdk/'];
const nichtVorab = new Set<string>();
function vorabCacheAuswahl(): Plugin {
  return {
    name: 'vorab-cache-auswahl',
    apply: 'build',
    generateBundle(_opts, bundle) {
      nichtVorab.clear();
      const chunks = Object.values(bundle).filter((b) => b.type === 'chunk');
      const kandidat = new Set(chunks.filter((c) => !c.isEntry
        && Object.keys(c.modules).some((id) => NICHT_VORAB_PAKETE.some((p) => id.includes(p)))).map((c) => c.fileName));
      // Bis nichts mehr wegfällt: Kandidaten, die ein Teil im Vorab-Cache fest importiert, bleiben drin.
      for (let geaendert = true; geaendert;) {
        geaendert = false;
        for (const c of chunks) {
          if (kandidat.has(c.fileName)) continue;
          for (const i of c.imports) if (kandidat.delete(i)) {
            geaendert = true;
            this.warn(`${i} wird von ${c.fileName} fest importiert und bleibt im Vorab-Cache (für Offline-Seiten nötig).`);
          }
        }
      }
      for (const k of kandidat) nichtVorab.add(k);
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
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
  plugins: [
    fachmodulTeilen(),
    versionsDatei(),
    sicherheitImHtml(),
    vorabCacheAuswahl(),
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
        // PDF-Leser und Claude-Anbindung erst bei Gebrauch (siehe vorabCacheAuswahl).
        manifestTransforms: [async (eintraege) => ({ manifest: eintraege.filter((e) => !nichtVorab.has(e.url)), warnings: [] })],
        // Seitenaufrufe (Start, Neuladen) zuerst übers Netz: so bringt schon EIN Neuladen die neue Version,
        // auch wenn der neue Service Worker noch nicht fertig ist (Safari/iPhone prüft ihn nur selten).
        // Ohne Netz oder nach 2 s ohne Antwort kommt index.html aus dem Vorab-Cache, passend zu dessen Dateien
        // (Audit L-2: bei schwachem Netz, z. B. Klinikkeller oder Bahn, nicht länger warten).
        // Ersetzt den Standard „index.html immer aus dem Cache“, der auf dem iPhone alte Stände festhielt.
        navigateFallback: null,
        // Sonst beantwortet der Vorab-Cache „/“ selbst mit index.html, bevor die Regel unten greift.
        directoryIndex: null as unknown as string,
        runtimeCaching: [{
          urlPattern: ({ request }) => request.mode === 'navigate',
          handler: 'NetworkFirst',
          options: {
            cacheName: 'seitenaufrufe',
            networkTimeoutSeconds: 2,
            // Nichts speichern: eine zwischengespeicherte neuere Startseite könnte offline auf Dateien zeigen,
            // die noch nicht im Vorab-Cache liegen. Stattdessen die Startseite aus dem Vorab-Cache nehmen
            // (Workbox speichert sie dort als „index.html?__WB_REVISION__=…“, daher ignoreSearch).
            // Die Funktion wird als Text in sw.js übernommen und läuft dort, nicht in Node.
            cacheableResponse: { statuses: [] },
            plugins: [{
              cachedResponseWillBeUsed: async ({ cachedResponse }) => cachedResponse
                ?? (await caches.match(new URL('index.html', (globalThis as unknown as { location: Location }).location.href).href, { ignoreSearch: true }))
                ?? null,
            }],
          },
        }, {
          // Programmteile außerhalb des Vorab-Cache (PDF-Leser, Claude-Anbindung, PDF-Worker): beim ersten Gebrauch
          // laden, danach offline. Die Dateinamen tragen einen Inhalts-Hash, ein Treffer ist also immer aktuell.
          // Vorab-Cache-Dateien beantwortet Workbox vorher selbst, diese Regel greift nur für den Rest.
          urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.includes('/assets/'),
          handler: 'CacheFirst',
          options: { cacheName: 'nachgeladen', expiration: { maxEntries: 40, purgeOnQuotaError: true } },
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
