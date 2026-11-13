#!/usr/bin/env node
// Prüft eine entpackte Materiallieferung, bevor sie verteilt wird:
//   npm run material:pruefen -- <ordner> [--bericht bericht.md]
// Regeln: docs/MATERIAL-BEDARF.md Abschnitt 0 (Namen, 16:9 ab 1280 px, Porträts quadratisch ab 512 px,
// Video mit vier Phasenbildern, ASSET_KATALOG.json mit Lizenz, Urheber und Fall-IDs).
// Liest die Dateien nur, ändert nichts. Exit-Code 1 bei Fehlern.
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { berichtMarkdown, bestellteIds, bildMasse, pruefeLieferung } from './lieferung-lib.mjs';

const args = process.argv.slice(2);
const ordner = args.find((a) => !a.startsWith('--'));
const bi = args.indexOf('--bericht');
if (!ordner) { console.error('Aufruf: npm run material:pruefen -- <ordner> [--bericht bericht.md]'); process.exit(1); }

const dateien = [];
let katalog;
(function lauf(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== '__MACOSX') lauf(p); continue; }
    if (e.name === 'ASSET_KATALOG.json') { try { katalog = JSON.parse(readFileSync(p, 'utf8')); } catch (err) { console.error(`ASSET_KATALOG.json nicht lesbar: ${err.message}`); process.exit(1); } }
    const groesse = statSync(p).size;
    const kopf = /\.(png|jpe?g|webp)$/i.test(e.name) ? readFileSync(p).subarray(0, 256 * 1024) : Buffer.alloc(0);
    dateien.push({ pfad: relative(ordner, p), groesse, masse: kopf.length ? bildMasse(kopf) : null });
  }
})(ordner);

const katalogTs = readFileSync('src/ui/sim/raeume/katalog.ts', 'utf8');
const vorhandeneIds = [...katalogTs.matchAll(/'(\d{2}[a-z]?_[a-z0-9_]+)'/g)].map((m) => m[1]);
const bedarf = readFileSync('docs/MATERIAL-BEDARF.md', 'utf8');
const ergebnis = pruefeLieferung(dateien, { katalog, vorhandeneIds, bestellteIds: bestellteIds(bedarf) });
const bericht = berichtMarkdown(ergebnis, ordner.split('/').filter(Boolean).pop());
if (bi >= 0 && args[bi + 1]) writeFileSync(args[bi + 1], bericht);
console.log(bericht);
process.exit(ergebnis.some((e) => e.stufe === 'fehler') ? 1 : 0);
