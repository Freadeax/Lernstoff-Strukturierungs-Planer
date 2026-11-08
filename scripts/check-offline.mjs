// Offline-Start der PWA gegen den gebauten Stand (UI_BASE_URL, Standard http://127.0.0.1:5173/):
//   • Service Worker installiert sich und übernimmt die Seite
//   • ohne Netz: Neuladen und kalter Start (neuer Tab) zeigen die App, alle Menüseiten laden ihre Teile aus dem Cache
//   • die Build-ID ist sichtbar (Datensicherung) und nicht der Entwicklungs-Platzhalter
// Gedacht nach jedem Update von vite-plugin-pwa/Workbox.
import { chromium } from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const base = (process.env.UI_BASE_URL || 'http://127.0.0.1:5173/').replace(/\/?$/, '/');
const routes = [...fs.readFileSync('src/ui/shell/nav.ts', 'utf8').matchAll(/path: '([^']+)'/g)].map((m) => m[1]);
assert(routes.length > 20, 'Menüpfade aus nav.ts gelesen');

const browser = await chromium.launch({ ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}), headless: true });
const fehler = [];
try {
  const ctx = await browser.newContext({ locale: 'de-DE', timezoneId: 'Europe/Berlin' });
  const page = await ctx.newPage();
  page.setDefaultTimeout(15000);
  const laufzeit = [];
  page.on('pageerror', (e) => laufzeit.push(e.message));
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.evaluate(() => navigator.serviceWorker.ready);
  if (!(await page.evaluate(() => !!navigator.serviceWorker.controller))) await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  // Vorab-Cache vollständig? (Workbox legt die Liste in einem Cache „workbox-precache…“ ab)
  const imCache = await page.evaluate(async () => {
    const namen = await caches.keys();
    const pre = namen.find((n) => n.includes('precache'));
    return pre ? (await (await caches.open(pre)).keys()).length : 0;
  });
  assert(imCache > 20, `Vorab-Cache enthält ${imCache} Dateien`);

  await page.goto(base + '#/system/sicherung', { waitUntil: 'networkidle' });
  const version = await page.locator('text=App-Version').first().textContent();
  assert(version && !/Entwicklung/.test(version) && /\d{4}-\d{2}-\d{2}/.test(version), `Build-ID sichtbar: ${version}`);

  await ctx.setOffline(true);
  await page.reload({ waitUntil: 'load' });
  await page.locator('main').first().waitFor();
  for (const route of routes) {
    laufzeit.length = 0;
    await page.goto(base + '#' + route, { waitUntil: 'load' });
    await page.waitForTimeout(200);
    const text = await page.locator('main').first().innerText().catch(() => '');
    if (!text.trim()) fehler.push(`offline ${route}: leere Seite`);
    if (/Dieser Bereich hat gerade einen Fehler|Neue Version verfügbar/.test(text)) fehler.push(`offline ${route}: Fehlerseite`);
    for (const e of laufzeit) fehler.push(`offline ${route}: ${e}`);
  }
  // kalter Start ohne Netz
  const neu = await ctx.newPage();
  await neu.goto(base, { waitUntil: 'load' });
  await neu.locator('main').first().waitFor();
  assert((await neu.locator('main').first().innerText()).trim().length > 20, 'kalter Offline-Start zeigt die Startseite');
  await ctx.close();
} finally {
  await browser.close();
}
if (fehler.length) { console.error(fehler.join('\n')); process.exit(1); }
console.log(`Offline-Start ok: ${routes.length} Seiten ohne Netz geladen.`);
