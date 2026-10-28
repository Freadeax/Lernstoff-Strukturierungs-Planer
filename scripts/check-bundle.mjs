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
