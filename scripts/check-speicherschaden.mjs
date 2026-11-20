// Browser-Prüfung „beschädigte Speicherstände“ (Audit R-1/R-2): Alle Geräteschlüssel, die der Code kennt
// (lernstoff.* und duell.*), werden mit falschen Formen gefüllt: Zahl, kaputtes JSON, fremdes Objekt, Liste, null.
// Danach muss jede Menüseite ohne Fehlerseite und ohne Seitenfehler öffnen. So kann ein alter oder beschädigter
// Stand (z. B. aus einer Sicherung einer anderen Version) die App nie lahmlegen.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const base = (process.env.UI_BASE_URL || 'http://127.0.0.1:5191/').replace(/\/?$/, '/');
const nav = fs.readFileSync(new URL('../src/ui/shell/nav.ts', import.meta.url), 'utf8');
const routes = [...new Set([...nav.matchAll(/path: '([^']+)'/g)].map((m) => m[1]))];

function quellen(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) quellen(p, out);
    else if (/\.(ts|tsx)$/.test(e.name) && !/\.test\./.test(e.name)) out.push(p);
  }
  return out;
}
const keys = [...new Set(quellen('src').flatMap((f) => [...fs.readFileSync(f, 'utf8').matchAll(/['"`]((?:lernstoff|duell)\.[A-Za-z0-9.]+)['"`]/g)].map((m) => m[1])))];
// Laufende Shell-Einstellung bleibt gültig, sonst prüft jede Seite nur die Ersatzdarstellung der Shell.
const WERTE = { zahl: '42', kaputt: '{"a":', objekt: '{"x":{"y":[1,null,"z"]}}', liste: '[1,"a",null,{"id":5}]', null: 'null' };

const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) });
const fehler = [];
try {
  for (const [name, wert] of Object.entries(WERTE)) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'de-DE', timezoneId: 'Europe/Berlin', serviceWorkers: 'block' });
    await ctx.addInitScript(({ keys, wert }) => {
      if (sessionStorage.getItem('__gefuellt')) return;
      for (const k of keys) { try { localStorage.setItem(k, wert); } catch { /* voll */ } }
      sessionStorage.setItem('__gefuellt', '1');
    }, { keys, wert });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => fehler.push(`${name} ${page.url().split('#')[1] ?? ''}: Seitenfehler ${e.message.slice(0, 160)}`));
    for (const r of routes) {
      await page.goto(base + '#' + r, { waitUntil: 'networkidle' });
      await page.locator('main').waitFor();
      await page.waitForTimeout(120);
      const text = await page.locator('main').innerText();
      if (/Dieser Bereich hat gerade einen Fehler/.test(text)) fehler.push(`${name} ${r}: Fehlerseite`);
    }
    await ctx.close();
  }
} finally {
  await browser.close();
}
if (fehler.length) {
  console.error(`Beschädigte Speicherstände: ${fehler.length} Probleme\n- ${fehler.join('\n- ')}`);
  process.exit(1);
}
console.log(`Speicherschaden ok: ${keys.length} Geräteschlüssel × ${Object.keys(WERTE).length} kaputte Formen, ${routes.length} Seiten ohne Fehlerseite.`);
