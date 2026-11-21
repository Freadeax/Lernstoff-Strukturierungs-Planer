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
    // Genau eine Hauptüberschrift je Seite: Screenreader springen per Überschrift zum Seitentitel (Audit A-1).
    const h1 = await page.locator('h1').count();
    if (h1 !== 1) fehler.push(`${r}: ${h1} Hauptüberschriften (h1) statt genau einer`);

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

  // Übungsabläufe: nicht nur der Startzustand, auch Frage, Antwort und Rückmeldung (Audit A-4).
  const ablauf = async (name) => {
    const a = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    for (const v of a.violations) fehler.push(`Ablauf ${name}: ${v.id} (${v.nodes.length}×) ${v.nodes[0]?.html.slice(0, 120)}`);
  };
  await page.goto(base + '#/lernen/karten', { waitUntil: 'networkidle' });
  await page.locator('main button.primary').first().click();
  await page.getByRole('button', { name: 'Antwort zeigen' }).waitFor();
  await ablauf('Karteikarten, Frage');
  await page.getByRole('button', { name: 'Antwort zeigen' }).click();
  await page.waitForTimeout(200);
  await ablauf('Karteikarten, Antwort');
  await page.goto(base + '#/lernen/wissen', { waitUntil: 'networkidle' });
  await page.locator('main input[type=checkbox]').first().check();
  await page.getByRole('button', { name: /Runde starten/ }).click();
  await page.getByRole('button', { name: 'Prüfen' }).waitFor();
  await ablauf('Wissenstrainer, Frage');
  // Irgendeine Antwort geben, je nach Aufgabenart (Auswahl, Zuordnen, Freitext), dann Sicherheit wählen und prüfen.
  if (await page.locator('main .qz__option').count()) await page.locator('main .qz__option').first().click();
  for (const sel of await page.locator('main select').all()) await sel.selectOption({ index: 1 }).catch(() => undefined);
  for (const t of await page.locator('main textarea, main input[type=text]').all()) await t.fill('Test').catch(() => undefined);
  await page.getByRole('button', { name: 'Sicher' }).click().catch(() => undefined);
  const pruefen = page.getByRole('button', { name: 'Prüfen' });
  assert.ok(await pruefen.isEnabled(), 'Wissenstrainer: Prüfen bleibt nach einer Antwort gesperrt');
  await pruefen.click();
  await page.waitForTimeout(300);
  await ablauf('Wissenstrainer, Rückmeldung');
  await page.goto(base + '#/lernen/diagnostik', { waitUntil: 'networkidle' });
  await page.locator('main button.primary').first().click();
  await page.getByRole('button', { name: 'Fall starten' }).click();
  await page.waitForTimeout(500);
  await ablauf('Labor und Bildgebung, Fall');
  await page.goto(base + '#/lernen/gespraech', { waitUntil: 'networkidle' });
  await page.locator('main button.primary').first().click();
  await page.waitForTimeout(600);
  await ablauf('Gesprächssimulator, Gespräch');
  await page.goto(base + '#/lernen/praxis?art=kurz', { waitUntil: 'networkidle' });
  await page.locator('main button', { hasText: /^Starten$/ }).first().click();
  await page.waitForTimeout(800);
  await ablauf('Praxissimulator, Kurzfall');
  await page.goto(base + '#/lernen/krankheitsbilder', { waitUntil: 'networkidle' });
  await page.locator('main button', { hasText: /^Fallaufgaben/ }).first().click();
  await page.waitForTimeout(400);
  await ablauf('Krankheitsbilder, Fallaufgaben');
  await page.goto(base + '#/lernen/examen', { waitUntil: 'networkidle' });
  await page.locator('main button, main a', { hasText: /^Probeprüfung zu I$/ }).first().click();
  await page.waitForTimeout(600);
  await ablauf('Examen, Probeprüfung');

  // Dunkler Modus: axe auf allen Seiten (Kontraste kippen sonst unbemerkt).
  const dunkel = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'dark', locale: 'de-DE', timezoneId: 'Europe/Berlin' });
  await dunkel.addInitScript(() => localStorage.setItem('lernstoff.shell', JSON.stringify({ theme: 'dunkel' })));
  const dp = await dunkel.newPage();
  for (const r of routes) {
    await dp.goto(base + '#' + r, { waitUntil: 'networkidle' });
    await dp.locator('main').waitFor();
    await dp.waitForTimeout(150);
    const audit = await new AxeBuilder({ page: dp }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).disableRules(AUSNAHMEN[r] ?? []).analyze();
    for (const v of audit.violations) fehler.push(`dunkel ${r}: ${v.id} (${v.nodes.length}×) ${v.nodes[0]?.html.slice(0, 120)}`);
  }
  await dunkel.close();

  // Umbruch bei 320 px (entspricht 400 % Zoom, WCAG 1.4.10): keine Seite darf seitlich überstehen.
  const schmal = await browser.newContext({ viewport: { width: 320, height: 640 }, locale: 'de-DE', timezoneId: 'Europe/Berlin', reducedMotion: 'reduce' });
  const sp = await schmal.newPage();
  for (const r of routes) {
    await sp.goto(base + '#' + r, { waitUntil: 'networkidle' });
    await sp.locator('main').waitFor();
    await sp.waitForTimeout(150);
    const w = await sp.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
    if (w.s > w.c + 1) fehler.push(`320 px ${r}: Seite ${w.s} px breit, steht seitlich über`);
  }
  await schmal.close();
} finally { await browser.close(); }
assert.deepEqual([...new Set(fehler)], [], 'Barrierefreiheit');
console.log(`Barrierefreiheit: ${routes.length} Seiten bei sehr großer Schrift, axe WCAG 2.2 AA hell und dunkel, genau eine h1, Umbruch bei 320 px, Tastaturfokus (${TABS} Schritte) und Grafik-Alternativen bestanden.`);
