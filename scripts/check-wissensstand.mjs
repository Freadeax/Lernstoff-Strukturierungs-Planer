import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const base = (process.env.UI_BASE_URL || 'http://127.0.0.1:5180/').replace(/\/?$/, '/');
const out = path.resolve('.ui-check/wissensstand');
fs.mkdirSync(out, { recursive: true });
const catalog = JSON.parse(fs.readFileSync(new URL('../src/modules/pflege/pflege-generalistisch.json', import.meta.url), 'utf8'));
const routes = ['rechnen', 'fall', 'duell', 'simulation', 'pflegeplanung', 'sis', 'bericht', 'mindmap', 'assessment', 'uebergabe', 'karten', 'klasse', 'landkarte'];
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) });
try {
  for (const width of [390, 820, 1440]) {
    // Ausschließlich synthetische Daten in einem neuen, isolierten Browserkontext.
    const context = await browser.newContext({ viewport: { width, height: 1000 }, locale: 'de-DE', timezoneId: 'Europe/Berlin', hasTouch: width < 1000 });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const go = async (route) => { await page.goto(base + '#' + route, { waitUntil: 'networkidle' }); };
    await go('/lernen/plan');
    await page.getByRole('button', { name: 'Wissensstand ohne Prüfung prüfen', exact: true }).click();
    await page.getByRole('heading', { name: 'Was kannst du schon abrufen?' }).waitFor();
    await page.getByRole('button', { name: 'Weitere Themen anzeigen', exact: true }).click();
    assert.equal(await page.locator('.wissensstand .block').count(), 40);
    const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(new Date());
    await page.evaluate(async ({ today, subjectId }) => {
      const open = indexedDB.open('lernstoff-planer');
      const db = await new Promise((resolve, reject) => { open.onsuccess = () => resolve(open.result); open.onerror = () => reject(open.error); });
      const tx = db.transaction(['topics', 'studyLogs', 'reviewLogs'], 'readwrite');
      tx.objectStore('topics').put({ id: 'test.wissen', subjectId, name: 'Eigenes Testthema Wissen', prerequisites: [], estimatedMinutes: 30 });
      tx.objectStore('studyLogs').add({ topicId: 'test.wissen', date: today, minutes: 30, at: new Date().toISOString() });
      tx.objectStore('reviewLogs').add({ topicId: 'test.wissen', date: today, source: 'selbsteinschaetzung', rating: 4, at: new Date().toISOString() });
      await new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); });
      db.close();
    }, { today, subjectId: catalog.subjects[0].id });
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByLabel('Themen suchen', { exact: true }).fill('Eigenes Testthema');
    const card = page.locator('.wissensstand .block');
    await card.getByText('Bearbeitet', { exact: true }).waitFor();
    assert.match(await card.innerText(), /0 echte Abfragen/);
    await page.getByRole('button', { name: 'Jetzt abfragen (1)', exact: true }).click();
    await card.getByRole('button', { name: 'Ergebnis eintragen', exact: true }).click();
    await card.getByRole('button', { name: 'Gut', exact: true }).click();
    // Eine bestandene Abfrage reicht nicht für „sicher“ und ist heute nicht erneut fällig.
    await page.getByText('Keine Themen für diese Auswahl.', { exact: false }).waitFor();
    await page.getByRole('button', { name: 'Unsicher (1)', exact: true }).click();
    await card.getByText('Unsicher', { exact: true }).waitFor();
    assert.match(await card.innerText(), /1 echte Abfrage/);
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByLabel('Themen suchen', { exact: true }).fill('Eigenes Testthema');
    await card.getByText('Unsicher', { exact: true }).waitFor();
    await page.screenshot({ path: path.join(out, `wissen-${width}.png`), fullPage: true });
    const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.deepEqual(audit.violations.map((v) => v.id), []);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Wissensstand: Überlauf');
    await page.getByLabel('Themen suchen', { exact: true }).fill('Arzneimittel');
    await page.getByRole('button', { name: 'Prüfungsrunde im Rechentrainer', exact: true }).click();
    // Weitere Rechenarten (z. B. insulin) dürfen hinzukommen; geprüft wird der Sprung in die Prüfungsrunde.
    await page.waitForURL(/#\/lernen\/rechnen\?modus=pruefung&typen=einheiten,dosis,mgkg,prozent(,|$)/);
    for (const route of routes) {
      await go('/lernen/' + route);
      assert(await page.locator('main').isVisible());
      assert(!await page.getByText('Dieser Bereich konnte nicht geladen werden', { exact: false }).count());
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route}: Überlauf bei ${width}px`);
    }
    assert.deepEqual(errors, []);
    console.log(`Wissensstand ${width}px: eigene Themen ohne Prüfung, Fälligkeit, Selbsteinschätzung, Abfrage, Persistenz, Übungssprung, WCAG und ${routes.length} Modul-Einstiege bestanden.`);
    await context.close();
  }
} finally { await browser.close(); }
