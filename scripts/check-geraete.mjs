// Alle Seiten aus dem Menü auf iPhone und iPad (hoch und quer), mit Fingerbedienung:
//   • kein waagerechtes Scrollen der ganzen Seite
//   • keine Laufzeitfehler
//   • Eingabefelder mindestens 16 px Schrift (sonst zoomt Safari beim Antippen hinein)
//   • untere Leiste macht beim Tippen der Tastatur Platz
//   • Home-Bildschirm-Symbol als PNG (iOS nimmt kein SVG), Manifest mit PNG-Symbolen
// Läuft gegen den gebauten Stand: UI_BASE_URL (Standard http://127.0.0.1:5173/).
import { chromium } from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const base = (process.env.UI_BASE_URL || 'http://127.0.0.1:5173/').replace(/\/?$/, '/');
const routes = [...fs.readFileSync('src/ui/shell/nav.ts', 'utf8').matchAll(/path: '([^']+)'/g)].map((m) => m[1]);
assert(routes.length > 20, 'Menüpfade aus nav.ts gelesen');

const geraete = [
  { name: 'iPhone', viewport: { width: 390, height: 844 } },
  { name: 'iPad hoch', viewport: { width: 820, height: 1180 } },
  { name: 'iPad quer', viewport: { width: 1180, height: 820 } },
  { name: 'iPhone, Schrift sehr groß', viewport: { width: 390, height: 844 }, schrift: 'sehrgross' },
];
const fehler = [];
const browser = await chromium.launch({ ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}), headless: true });
try {
  // Symbole und Manifest
  const res = await fetch(base);
  const html = await res.text();
  const touch = html.match(/rel="apple-touch-icon" href="\.\/([^"]+)"/)?.[1];
  assert(touch?.endsWith('.png'), 'apple-touch-icon ist ein PNG');
  assert((await fetch(base + touch)).ok, 'apple-touch-icon erreichbar');
  const manifest = await (await fetch(base + 'manifest.webmanifest')).json();
  for (const s of ['192x192', '512x512']) assert(manifest.icons.some((i) => i.type === 'image/png' && i.sizes === s), `Manifest-Symbol ${s} PNG`);
  assert(manifest.icons.some((i) => i.purpose === 'maskable'), 'Manifest-Symbol maskierbar');

  for (const g of geraete) {
    const ctx = await browser.newContext({ viewport: g.viewport, isMobile: true, hasTouch: true, locale: 'de-DE', timezoneId: 'Europe/Berlin' });
    if (g.schrift) await ctx.addInitScript((schrift) => localStorage.setItem('lernstoff.shell', JSON.stringify({ schrift })), g.schrift);
    const page = await ctx.newPage();
    page.setDefaultTimeout(8000);
    const laufzeit = [];
    page.on('pageerror', (e) => laufzeit.push(e.message));
    for (const route of routes) {
      laufzeit.length = 0;
      await page.goto(base + '#' + route, { waitUntil: 'networkidle' });
      await page.waitForTimeout(150);
      const r = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - innerWidth,
        klein: [...document.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=file]):not([type=color]), select, textarea')]
          .filter((e) => parseFloat(getComputedStyle(e).fontSize) < 16)
          .map((e) => e.getAttribute('aria-label') || e.name || e.id || e.tagName),
      }));
      if (r.overflow > 0) fehler.push(`${g.name} ${route}: Seite ${r.overflow} px zu breit`);
      if (r.klein.length) fehler.push(`${g.name} ${route}: Schrift unter 16 px in ${r.klein.slice(0, 3).join(', ')}`);
      if (laufzeit.length) fehler.push(`${g.name} ${route}: ${laufzeit[0]}`);
    }
    if (g.schrift) {
      assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).fontSize), '20px', 'Schrift sehr groß wirkt');
    }
    if (g.name === 'iPad quer') {
      // Tastenkürzel: Wahltaste + Ziffer, „/“ für die Suche, „?“ für die Übersicht
      await page.goto(base + '#/', { waitUntil: 'networkidle' });
      await page.keyboard.press('Alt+Digit2');
      await page.waitForFunction(() => location.hash === '#/lernen/plan');
      await page.keyboard.press('Slash');
      assert(await page.locator('dialog.omnibar[open]').isVisible(), 'Suche mit /');
      await page.keyboard.press('Escape');
      await page.keyboard.press('Shift+Slash');
      assert(await page.getByRole('dialog', { name: 'Tastenkürzel' }).isVisible(), 'Übersicht mit ?');
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('dialog[open]').count(), 0, 'Esc schließt');
    }
    if (g.name === 'iPhone') {
      await page.goto(base + '#/lernen/themen', { waitUntil: 'networkidle' });
      const leiste = page.locator('.shell__tabbar');
      assert(await leiste.isVisible(), 'Untere Leiste sichtbar');
      await page.locator('main input[type=search]').first().focus();
      assert(!(await leiste.isVisible()), 'Untere Leiste beim Tippen ausgeblendet');
      await page.locator('main input[type=search]').first().blur();
      assert(await leiste.isVisible(), 'Untere Leiste nach dem Tippen wieder da');

      // Zurück in der installierten App: nur wenn es innerhalb der App zurückgeht
      const neu = await ctx.newPage();
      await neu.goto(base + '#/', { waitUntil: 'networkidle' });
      assert.equal(await neu.locator('.shell__back').count(), 0, 'Kein Zurück auf der Einstiegsseite');
      await neu.locator('.shell__tabbar a', { hasText: 'Lernplan' }).click();
      await neu.locator('.shell__tabbar a', { hasText: 'Karteikarten' }).click();
      await neu.waitForFunction(() => location.hash === '#/lernen/karten');
      assert.equal(await neu.locator('.shell__back').count(), 1, 'Zurück nach Seitenwechsel');
      await neu.locator('.shell__back').evaluate((b) => b.click()); // im Browser per CSS verborgen
      await neu.waitForFunction(() => location.hash === '#/lernen/plan');
      await neu.locator('.shell__back').evaluate((b) => b.click());
      await neu.waitForFunction(() => location.hash === '#/');
      assert.equal(await neu.locator('.shell__back').count(), 0, 'Zurück verschwindet am Einstieg');

      // Offline-Hinweis
      await ctx.setOffline(true);
      await neu.locator('.shell__offline').waitFor();
      await ctx.setOffline(false);
      await neu.locator('.shell__offline').waitFor({ state: 'detached' });
      await neu.close();
    }
    await ctx.close();
  }
} finally {
  await browser.close();
}
console.log(`${routes.length} Seiten × ${geraete.length} Geräte geprüft.`);
assert.deepEqual(fehler, [], 'iPhone/iPad');
