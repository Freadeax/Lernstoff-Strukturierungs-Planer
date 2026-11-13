// Browser-Prüfung „Struktur und Oberfläche“: Themenbaum (Fortschritt je Bereich, Filter, eigenes Thema anlegen
// und umhängen), Fokus-Modus mit Lernzeit-Timer, Text einfügen als Dokument, viele Karteikarten auf einmal
// sowie Tippflächen am Handy. Nur synthetische Daten, keine Netzanfragen nach außen.
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const base = (process.env.UI_BASE_URL || 'http://127.0.0.1:5199/').replace(/\/?$/, '/');
const out = path.resolve('.ui-check/struktur');
fs.mkdirSync(out, { recursive: true });
const axe = async (page, wo) => {
  const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  assert.deepEqual(audit.violations.map((v) => `${wo}: ${v.id} ${v.nodes[0]?.html ?? ''}`), []);
};

const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) });
try {
  for (const width of [390, 1280]) {
    const handy = width < 600;
    const context = await browser.newContext({ viewport: { width, height: 900 }, locale: 'de-DE', timezoneId: 'Europe/Berlin', hasTouch: handy, isMobile: handy });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const ueberlauf = () => page.evaluate(() => document.documentElement.scrollWidth > innerWidth);

    // --- Themenbaum
    await page.goto(base + '#/lernen/themen', { waitUntil: 'networkidle' });
    await page.locator('.baum').waitFor();
    assert.equal(await page.getByRole('button', { name: 'Baum', exact: true }).getAttribute('aria-pressed'), 'true', 'Baum ist die Standardansicht');
    assert(await page.locator('.themenbaum__weiter a').isVisible(), '„Als Nächstes“ schlägt ein Thema vor');
    assert(await page.locator('.baum > .baum__knoten > .baum__zeile .baum-balken').first().isVisible(), 'Balken je Fach');
    assert.match(await page.locator('.baum > .baum__knoten .baum__zahl').first().textContent(), /^\d+\/\d+ sicher$/);
    await page.getByRole('button', { name: 'Alle aufklappen' }).click();
    const blattLinks = page.locator('.baum a.baum__auf--blatt');
    assert((await blattLinks.count()) > 20, 'Alle aufklappen zeigt die Themen');
    // Tastatur: Pfeil runter springt zur nächsten Zeile
    const erste = page.locator('.baum [data-baum-fokus]').first();
    await erste.focus();
    await page.keyboard.press('ArrowDown');
    assert.equal(await page.evaluate(() => document.activeElement === document.querySelectorAll('.baum [data-baum-fokus]')[1]), true, 'Pfeil runter');
    await page.getByPlaceholder('Themen durchsuchen').fill('atmungs');
    await page.locator('.baum a.baum__auf--blatt', { hasText: 'Atmungssystem' }).first().waitFor();
    assert((await blattLinks.count()) < 10, 'Suche grenzt den Baum ein');
    await page.getByPlaceholder('Themen durchsuchen').fill('');
    await page.getByRole('button', { name: /^Sicher/ }).click();
    assert(await page.getByText('Keine Themen passen zu Suche und Filter.').isVisible(), 'Filter „Sicher“ ohne Abfragen ist leer');
    await page.getByRole('button', { name: /^Alle\b/ }).first().click();
    if (!handy) await axe(page, 'Themenbaum');
    assert(!(await ueberlauf()), 'Themenbaum: Überlauf');
    await page.screenshot({ path: path.join(out, `themenbaum-${width}.png`) });

    // Eigenes Thema anlegen und umhängen (nur einmal, Daten bleiben im Kontext)
    await page.getByText('Eigenes Thema anlegen').click();
    const form = page.locator('.themenbaum__anlegen');
    await form.getByLabel('Name des Themas').fill(`Prüfthema Baum ${width}`);
    await form.getByRole('button', { name: 'Anlegen' }).click();
    const neu = page.locator('.baum__knoten.is-markiert');
    await neu.waitFor();
    assert.match(await neu.textContent(), new RegExp(`Prüfthema Baum ${width}`));
    assert.match(await neu.textContent(), /eigenes/);
    // Umhängen per Menü (Tastatur-/Touch-Alternative zum Ziehen)
    await neu.getByRole('button', { name: /umhängen$/ }).click();
    const ziel = page.getByRole('menuitem').first();
    const zielName = (await ziel.textContent()).trim();
    await ziel.click();
    await page.getByText('Thema umgehängt', { exact: true }).first().waitFor();
    assert.match(await page.locator('.toast, [role=status]').filter({ hasText: 'Thema umgehängt' }).first().textContent(), new RegExp(zielName.replace(/[()]/g, '.')));

    // --- Fokus-Modus
    await page.goto(base + '#/lernen/karten', { waitUntil: 'networkidle' });
    await page.locator('main h2, main h1').first().waitFor();
    await page.locator('main').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('f');
    await page.locator('.fokusleiste').waitFor();
    assert(!(await page.locator('.shell__header').isVisible()), 'Kopfleiste im Fokus ausgeblendet');
    assert(!(await page.locator('.shell__tabbar').isVisible()), 'Handy-Leiste im Fokus ausgeblendet');
    assert(!(await page.locator('.shell__sidebar').isVisible()) || handy, 'Menü im Fokus ausgeblendet');
    await page.getByRole('button', { name: '25 Minuten Lernzeit starten' }).click();
    assert.match(await page.locator('.fokusleiste__uhr').textContent(), /2[45]:\d\d/);
    await page.getByRole('button', { name: 'Anhalten' }).click();
    await page.getByRole('button', { name: 'Stopp' }).click();
    await axe(page, 'Fokus-Modus');
    assert(!(await ueberlauf()), 'Fokus: Überlauf');
    await page.screenshot({ path: path.join(out, `fokus-${width}.png`) });
    await page.keyboard.press('Escape');
    await page.locator('.shell__header').waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.hasAttribute('data-fokus')), false);

    // --- Viele Karteikarten einfügen
    await page.getByRole('tab', { name: 'Eigene Karten' }).click();
    await page.getByText('Viele Karten auf einmal einfügen').click();
    await page.locator('.karten__einfuegen textarea').fill(`Dekubitus ${width}\tDruckgeschwür\nTachykardie ${width} :: Puls über 100/min\nDer [[Fingertest]] prüft Rötung ${width}.`);
    assert.match(await page.locator('.karten__einfuegen-vorschau').textContent(), /3 neue Karten/);
    await page.getByRole('button', { name: '3 Karten anlegen' }).click();
    await page.waitForFunction(() => /\((\d+)\)/.test(document.querySelector('.karten__liste-kopf h3')?.textContent ?? '') && Number(/\((\d+)\)/.exec(document.querySelector('.karten__liste-kopf h3').textContent)[1]) >= 3);
    await page.locator('.karten__einfuegen textarea').fill(`Dekubitus ${width}\tDruckgeschwür`);
    assert.match(await page.locator('.karten__einfuegen-vorschau').textContent(), /1 schon vorhanden/, 'Dubletten erkannt');

    // --- Text einfügen als Dokument (Formatierung aus der Zwischenablage bleibt erhalten)
    await page.goto(base + '#/material/dokumente', { waitUntil: 'networkidle' });
    await page.getByText('Text einfügen statt Datei').click();
    const ta = page.locator('.text-einfuegen textarea');
    await ta.focus();
    await ta.evaluate((el) => {
      const dt = new DataTransfer();
      dt.setData('text/html', '<h1>Herzinsuffizienz Prüftext</h1><p>Die <b>Herzinsuffizienz</b> ist eine Pumpschwäche des Herzens.</p><h2>Symptome</h2><ul><li>Dyspnoe</li><li>Ödeme</li></ul>');
      dt.setData('text/plain', 'Herzinsuffizienz');
      el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
    });
    assert.match(await ta.inputValue(), /^# Herzinsuffizienz Prüftext\n\nDie \*\*Herzinsuffizienz\*\*.*\n\n## Symptome\n\n- Dyspnoe\n- Ödeme$/s);
    await page.getByRole('button', { name: 'Als Dokument übernehmen' }).click();
    await page.getByText('Herzinsuffizienz Prüftext', { exact: false }).nth(0).waitFor();
    await page.waitForFunction(() => !document.querySelector('.text-einfuegen textarea')?.value);
    assert(!(await ueberlauf()), 'Dokumente: Überlauf');

    // --- Tippflächen am Handy: Kurzhilfe-Links und Textknöpfe mindestens 40 px hoch
    if (handy) {
      await page.goto(base + '#/lernen/plan', { waitUntil: 'networkidle' });
      await page.getByText('Wozu ist diese Seite da?').click();
      const h = await page.locator('.seitenhilfe__links a').first().evaluate((a) => a.getBoundingClientRect().height);
      assert(h >= 40, `Kurzhilfe-Link zu klein: ${h}px`);
    }

    assert.deepEqual(errors, [], `Seitenfehler bei ${width}px`);
    await context.close();
  }
  console.log('Struktur und Oberfläche: Themenbaum, Fokus-Modus, Einfügen-Import und Tippflächen in Ordnung.');
} finally {
  await browser.close();
}
