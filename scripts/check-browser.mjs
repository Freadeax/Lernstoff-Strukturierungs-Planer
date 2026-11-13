// Alle Menüseiten in den Browser-Engines außer Chromium: WebKit (Kern von Safari auf iPhone, iPad und Mac) und Firefox.
//   • keine Laufzeitfehler, keine leere Seite, kein Absturzhinweis
//   • kein waagerechtes Verschieben der Seite (iPhone 390 px und iPad 820 px)
//   • kein Hinweis „Browser zu alt“ (public/browser-pruefung.js)
// Die Engines einmalig holen:  npx playwright install webkit firefox
// Fehlt eine Engine, wird sie übersprungen (Hinweis statt Fehler). Nur eine Engine:  BROWSER=webkit node scripts/check-browser.mjs
// Läuft gegen den gebauten Stand: UI_BASE_URL (Standard http://127.0.0.1:5173/). Teil von npm run check.
import * as pw from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const base = (process.env.UI_BASE_URL || 'http://127.0.0.1:5173/').replace(/\/?$/, '/');
const routes = [...new Set([...fs.readFileSync('src/ui/shell/nav.ts', 'utf8').matchAll(/path: '([^']+)'/g)].map((m) => m[1]))];
assert(routes.length > 20, 'Menüpfade aus nav.ts gelesen');

const engines = (process.env.BROWSER || 'webkit,firefox').split(',').map((s) => s.trim()).filter(Boolean);
const groessen = [
  { name: 'iPhone', viewport: { width: 390, height: 844 } },
  { name: 'iPad', viewport: { width: 820, height: 1180 } },
];
const fehler = [];
let gelaufen = 0;

for (const name of engines) {
  let browser;
  try {
    browser = await pw[name].launch({
      headless: true,
      ...(name === 'chromium' && process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}),
    });
  } catch (e) {
    console.log(`(${name} ist nicht installiert: übersprungen. Holen mit „npx playwright install ${name}“.)`);
    if (process.env.BROWSER_PFLICHT) fehler.push(`${name}: startet nicht (${String(e.message).split('\n')[0]})`);
    continue;
  }
  gelaufen++;
  try {
    for (const g of groessen) {
      // Firefox kennt isMobile nicht; die Breite reicht für das Handy-Layout.
      const ctx = await browser.newContext({ viewport: g.viewport, hasTouch: name !== 'firefox', locale: 'de-DE', timezoneId: 'Europe/Berlin' });
      const page = await ctx.newPage();
      page.setDefaultTimeout(10000);
      const laufzeit = [];
      page.on('pageerror', (e) => laufzeit.push(e.message));
      await page.goto(base, { waitUntil: 'load' });
      await page.locator('main').first().waitFor();
      assert.equal(await page.locator('#browser-hinweis').count(), 0, `${name}: Hinweis „Browser zu alt“ erscheint`);
      for (const route of routes) {
        laufzeit.length = 0;
        await page.evaluate((r) => { location.hash = r; }, route);
        // Seitenwechsel mit Übergang: Inhalt steht einen Bildaufbau später, nachgeladene Teile etwas danach.
        await page.waitForFunction(() => (document.querySelector('main')?.textContent ?? '').trim().length > 40, null, { timeout: 10000 }).catch(() => {});
        // Einblendungen (transform) erst auslaufen lassen, sonst zählt ein Bild mitten im Hereinschieben als Überstand.
        await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity), null, { timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(250);
        const r = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          text: (document.querySelector('main')?.textContent ?? '').trim().length,
          absturz: (document.querySelector('main')?.textContent ?? '').includes('Dieser Bereich hat gerade einen Fehler'),
        }));
        const wo = `${name} ${g.name} ${route}`;
        if (r.overflow > 0) fehler.push(`${wo}: Seite ${r.overflow} px zu breit`);
        if (r.text < 40) fehler.push(`${wo}: Seite bleibt leer`);
        if (r.absturz) fehler.push(`${wo}: Absturzhinweis`);
        if (laufzeit.length) fehler.push(`${wo}: ${laufzeit[0]}`);
      }
      await ctx.close();
    }
    console.log(`✓ ${name}: ${routes.length} Seiten × ${groessen.length} Größen`);
  } finally {
    await browser.close();
  }
}

if (fehler.length) {
  console.error(`\n${fehler.length} Auffälligkeit(en):\n  ${fehler.join('\n  ')}`);
  process.exit(1);
}
console.log(gelaufen ? 'Andere Browser-Engines: alles in Ordnung.' : 'Keine weitere Browser-Engine installiert: nichts geprüft.');
