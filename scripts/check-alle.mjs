// Alle Prüfungen mit einem Befehl, ohne GitHub Actions:  npm run check
//
//   1. Typprüfung und Unit-Tests (vitest)
//   2. Fachmodul-JSON passt zu den YAML-Dateien (scripts/build-module.py --pruefen, falls Python da ist)
//   3. Produktions-Build und Startgrößen-Budget (scripts/check-bundle.mjs)
//   4. Browser-Prüfungen gegen den gebauten Stand (check-ui, -material, -wissensstand, -praxis)
//
// Optionen:  --schnell  nur 1–3, ohne Browser.
// Der Browser kommt aus Playwright; ein anderer Chromium über PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH.
// Jede Stufe läuft auch nach einem Fehler weiter; am Ende steht eine Übersicht, Exit 1 bei Fehlern.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';

const schnell = process.argv.includes('--schnell');
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const ergebnisse = [];

function schritt(name, befehl, args, env = {}) {
  console.log(`\n▶ ${name}`);
  const start = Date.now();
  const r = spawnSync(befehl, args, { stdio: 'inherit', env: { ...process.env, ...env }, shell: process.platform === 'win32' });
  const ok = r.status === 0;
  ergebnisse.push({ name, ok, s: ((Date.now() - start) / 1000).toFixed(0) });
  return ok;
}

function python() {
  for (const p of ['python3', 'python', 'py']) {
    const r = spawnSync(p, ['-c', 'import yaml, jsonschema'], { stdio: 'ignore', shell: process.platform === 'win32' });
    if (r.status === 0) return p;
  }
  return null;
}

const freierPort = () => new Promise((res, rej) => {
  const s = net.createServer().listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => res(port)); });
  s.on('error', rej);
});

async function wartenAuf(url, ms = 20000) {
  const bis = Date.now() + ms;
  while (Date.now() < bis) {
    try { if ((await fetch(url)).ok) return; } catch { /* startet noch */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Vorschau unter ${url} startet nicht.`);
}

schritt('Typprüfung', npx, ['tsc', '-b', '--noEmit']);
schritt('Unit-Tests', npx, ['vitest', 'run']);

const py = python();
const module = fs.readdirSync('src/modules', { withFileTypes: true })
  .filter((d) => d.isDirectory() && fs.existsSync(path.join('src/modules', d.name, 'katalog')));
if (py) for (const m of module) schritt(`Katalog ${m.name} aktuell`, py, ['scripts/build-module.py', path.join('src/modules', m.name), '--pruefen']);
else console.log('\n(Python mit pyyaml und jsonschema fehlt: Katalog-Abgleich übersprungen, `npm test` prüft die Verweise trotzdem.)');

const gebaut = schritt('Build', 'npm', ['run', 'build']);
if (gebaut) schritt('Startgröße', 'node', ['scripts/check-bundle.mjs']);

if (!schnell && gebaut) {
  const port = await freierPort();
  const base = `http://127.0.0.1:${port}/`;
  // vite direkt über node starten (nicht über npx), damit kill() den Server selbst beendet
  const vorschau = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: 'ignore' });
  try {
    await wartenAuf(base);
    for (const s of ['check-ui', 'check-material', 'check-wissensstand', 'check-praxis']) {
      schritt(`Browser: ${s}`, 'node', [`scripts/${s}.mjs`], { UI_BASE_URL: base });
    }
  } finally {
    vorschau.kill();
  }
}

console.log('\nÜbersicht');
for (const e of ergebnisse) console.log(`  ${e.ok ? '✓' : '✗'} ${e.name} (${e.s} s)`);
const fehler = ergebnisse.filter((e) => !e.ok).length;
console.log(fehler ? `\n${fehler} Prüfung(en) fehlgeschlagen.` : '\nAlles grün.');
process.exit(fehler ? 1 : 0);
