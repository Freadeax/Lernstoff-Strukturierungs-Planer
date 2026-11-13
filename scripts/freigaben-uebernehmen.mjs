#!/usr/bin/env node
// Übernimmt einen Export aus System → Bildprüfung in src/ui/sim/bildfreigaben.ts
// und erzeugt docs/ASSET-STATUS.md neu. Aufruf: npm run assets:freigaben -- <bildpruefung-….json>
// Neuere Einträge ersetzen ältere desselben Schlüssels; die Prüfung der Felder macht der Vitest-Lauf.
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const datei = process.argv[2];
if (!datei) { console.error('Aufruf: npm run assets:freigaben -- <export.json>'); process.exit(1); }
const exp = JSON.parse(readFileSync(datei, 'utf8'));
if (exp.format !== 'lernstoff-bildpruefung/1' || !exp.eintraege || typeof exp.eintraege !== 'object') {
  console.error('Keine Exportdatei der Bildprüfung (format lernstoff-bildpruefung/1).'); process.exit(1);
}
const ziel = 'src/ui/sim/bildfreigaben.ts';
const ts = readFileSync(ziel, 'utf8');
const muster = /export const FREIGABEN: Record<string, BildFreigabe> = \{[\s\S]*?\n?\};\n/;
if (!muster.test(ts)) { console.error(`${ziel}: FREIGABEN-Block nicht gefunden`); process.exit(1); }
const alt = Function(`return (${ts.match(muster)[0].replace(/^export const FREIGABEN: Record<string, BildFreigabe> = /, '').replace(/;\n$/, '')})`)();
const neu = { ...alt };
let n = 0;
for (const [k, f] of Object.entries(exp.eintraege)) {
  if (!f || (f.status !== 'freigegeben' && f.status !== 'mangel')) continue;
  if (neu[k] && neu[k].am > f.am) continue;
  neu[k] = f; n++;
}
const sortiert = Object.fromEntries(Object.entries(neu).sort(([a], [b]) => a.localeCompare(b)));
const block = Object.keys(sortiert).length
  ? `export const FREIGABEN: Record<string, BildFreigabe> = {\n${Object.entries(sortiert).map(([k, f]) => `  ${JSON.stringify(k)}: ${JSON.stringify(f)},`).join('\n')}\n};\n`
  : 'export const FREIGABEN: Record<string, BildFreigabe> = {};\n';
writeFileSync(ziel, ts.replace(muster, block));
console.log(`${n} Einträge übernommen (${Object.keys(sortiert).length} insgesamt).`);
execSync('npm run -s assets:status', { stdio: 'inherit' });
