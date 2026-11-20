// Startgröße der App begrenzen: Summe aller JS/CSS-Dateien, die index.html sofort lädt
// (Einstieg und modulepreload), gzip-komprimiert. Auf dem iPhone im Mobilnetz zählt jedes KB.
// Aufruf nach `npm run build`:  node scripts/check-bundle.mjs
// Wird das Budget bewusst überschritten (z. B. großes neues Fachmodul), Grenze hier anheben
// und im PR begründen.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const BUDGET_KB = 320; // Stand 2026-10-28: rund 257 KB, davon ~100 KB Pflege-Katalog
const dist = path.resolve('dist');
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const dateien = [...html.matchAll(/(?:src|href)="\.?\/?(assets\/[^"]+\.(?:js|css))"/g)].map((m) => m[1]);
if (!dateien.length) throw new Error('dist/index.html lädt keine Assets – zuerst `npm run build` ausführen.');

const zeilen = dateien.map((d) => {
  const roh = fs.readFileSync(path.join(dist, d));
  return { datei: d, kb: zlib.gzipSync(roh, { level: 9 }).length / 1024 };
}).sort((a, b) => b.kb - a.kb);
const summe = zeilen.reduce((s, z) => s + z.kb, 0);

for (const z of zeilen.slice(0, 5)) console.log(`  ${z.kb.toFixed(1).padStart(7)} KB  ${z.datei}`);
console.log(`Startgröße (gzip): ${summe.toFixed(1)} KB von ${BUDGET_KB} KB Budget, ${zeilen.length} Dateien.`);
if (summe > BUDGET_KB) {
  console.error('Budget überschritten: Große Teile per import() erst bei Bedarf laden (siehe docs/ENTWICKLUNG.md).');
  process.exit(1);
}

// Vorab-Cache (Audit L-1): Was der Service Worker beim ersten Besuch im Hintergrund lädt, gzip-komprimiert
// (so geht es übers Netz). Seltene Teile stehen in NICHT_VORAB_PAKETE in vite.config.ts.
const VORAB_BUDGET_KB = 2650; // Stand 2026-11-20: rund 2.560 KB gzip (vorher 2.680 KB; ohne PDF-Leser und Claude-SDK)
const sw = fs.readFileSync(path.join(dist, 'sw.js'), 'utf8');
const vorab = [...sw.matchAll(/url:"([^"]+)"/g)].map((m) => m[1]).filter((u) => fs.existsSync(path.join(dist, u)));
if (vorab.length < 20) throw new Error('dist/sw.js: Vorab-Cache-Liste nicht gefunden.');
const vorabKb = vorab.reduce((s, u) => s + zlib.gzipSync(fs.readFileSync(path.join(dist, u)), { level: 6 }).length, 0) / 1024;
console.log(`Vorab-Cache (gzip): ${vorabKb.toFixed(0)} KB von ${VORAB_BUDGET_KB} KB Budget, ${vorab.length} Dateien.`);
if (vorabKb > VORAB_BUDGET_KB) {
  console.error('Vorab-Cache zu groß: Teile, die nur bei einer Handlung gebraucht werden, in NICHT_VORAB_PAKETE (vite.config.ts) aufnehmen.');
  process.exit(1);
}
