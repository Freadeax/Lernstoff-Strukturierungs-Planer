// Barrierefreiheit aller Menüseiten: axe (WCAG 2.2 AA) bei sehr großer Schrift auf dem iPhone,
// sichtbarer Tastaturfokus für die ersten Tab-Schritte und Textalternativen für Grafiken.
// Neue Seiten aus src/ui/shell/nav.ts sind automatisch dabei.
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const base = (process.env.UI_BASE_URL || 'http://127.0.0.1:5180/').replace(/\/?$/, '/');
const nav = fs.readFileSync(new URL('../src/ui/shell/nav.ts', import.meta.url), 'utf8');
const routes = [...new Set([...nav.matchAll(/path: '([^']+)'/g)].map((m) => m[1]))];
// Landkarte: Die Knoten der Gesamtansicht sind klein, lassen sich aber zoomen und über die Suche
// gleichwertig auswählen (Ausnahme „Equivalent“ in WCAG 2.5.8).
const AUSNAHMEN = { '/lernen/landkarte': ['target-size'] };
const TABS = 20;

const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) });
const fehler = [];
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'de-DE', timezoneId: 'Europe/Berlin' });
  await context.addInitScript(() => localStorage.setItem('lernstoff.shell', JSON.stringify({ schrift: 'sehrgross' })));
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));
  for (const r of routes) {
    await page.goto(base + '#' + r, { waitUntil: 'networkidle' });
    await page.locator('main').waitFor();
    await page.waitForTimeout(200);
    const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).disableRules(AUSNAHMEN[r] ?? []).analyze();
    for (const v of audit.violations) fehler.push(`${r}: ${v.id} (${v.nodes.length}×) ${v.nodes[0]?.html.slice(0, 120)}`);

    const grafik = await page.evaluate(() => [...document.querySelectorAll('main svg, main canvas')].filter((s) =>
      !s.closest('button, a, [role=img][aria-label], [aria-hidden=true]') && s.getAttribute('aria-hidden') !== 'true'
      && !(s.getAttribute('aria-label') || s.getAttribute('aria-labelledby') || s.querySelector('title'))).map((s) => s.outerHTML.slice(0, 80)));
    for (const g of grafik) fehler.push(`${r}: Grafik ohne Textalternative ${g}`);

    await page.evaluate(() => { (document.activeElement)?.blur?.(); window.scrollTo(0, 0); });
    for (let i = 0; i < TABS; i++) {
      await page.keyboard.press('Tab');
      const ohne = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body || !el.matches(':focus')) return '';
        const sichtbar = (e) => { const cs = getComputedStyle(e); return (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || (cs.boxShadow && cs.boxShadow !== 'none'); };
        // Der Fokus darf auch am umgebenden Element sichtbar sein (z. B. Datei-Feld in der Ablagefläche).
        for (let e = el, n = 0; e && n < 3; e = e.parentElement, n++) if (sichtbar(e)) return '';
        return `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)} „${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30)}“`;
      });
      if (ohne) fehler.push(`${r}: Fokus nicht sichtbar an ${ohne}`);
    }
  }
  assert.deepEqual(pageErrors, []);
} finally { await browser.close(); }
assert.deepEqual([...new Set(fehler)], [], 'Barrierefreiheit');
console.log(`Barrierefreiheit: ${routes.length} Seiten bei sehr großer Schrift, axe WCAG 2.2 AA, Tastaturfokus (${TABS} Schritte) und Grafik-Alternativen bestanden.`);
