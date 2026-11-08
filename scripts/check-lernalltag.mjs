// Browser-Prüfung für den Lernalltag: Dienstplan mit Vorschau, liegen gebliebene Blöcke,
// Kompetenzbereiche vor der Prüfung und Kalenderexport. Nur synthetische Daten.
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const base = (process.env.UI_BASE_URL || 'http://127.0.0.1:5180/').replace(/\/?$/, '/');
const out = path.resolve('.ui-check/lernalltag');
fs.mkdirSync(out, { recursive: true });
const catalog = JSON.parse(fs.readFileSync(new URL('../src/modules/pflege/pflege-generalistisch.json', import.meta.url), 'utf8'));
const eltern = new Set(catalog.topics.map((t) => t.parentId).filter(Boolean));
const blaetter = catalog.topics.filter((t) => !eltern.has(t.id)).slice(0, 12).map((t) => t.id);
const tag = (offset) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(new Date(Date.now() + offset * 864e5));
const axe = async (page, wo) => {
  const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  assert.deepEqual(audit.violations.map((v) => `${wo}: ${v.id}`), []);
};

const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) });
try {
  for (const width of [390, 1180]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, locale: 'de-DE', timezoneId: 'Europe/Berlin', hasTouch: width < 1000, acceptDownloads: true });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(base + '#/lernen/plan', { waitUntil: 'networkidle' });
    await page.evaluate(async ({ blaetter, heute, gestern, pruefung }) => {
      const open = indexedDB.open('lernstoff-planer');
      const db = await new Promise((resolve, reject) => { open.onsuccess = () => resolve(open.result); open.onerror = () => reject(open.error); });
      const tx = db.transaction(['exams', 'reviewLogs'], 'readwrite');
      tx.objectStore('exams').put({ id: 'test.pruefung', name: 'Testklausur Alltag', date: pruefung, subjectIds: [], topicIds: blaetter });
      const at = new Date().toISOString();
      for (const d of [gestern, heute]) tx.objectStore('reviewLogs').add({ topicId: blaetter[0], date: d, source: 'quiz', scorePercent: 95, at });
      await new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); });
      db.close();
      localStorage.setItem('lernstoff.lernplan.stand', JSON.stringify({ date: gestern, bloecke: [{ topicId: blaetter[3], kind: 'erarbeiten', minutes: 45 }], fertig: { [blaetter[3]]: gestern } }));
    }, { blaetter, heute: tag(0), gestern: tag(-1), pruefung: tag(10) });

    // Heute: liegen gebliebener Block mit Grund
    await page.reload({ waitUntil: 'networkidle' });
    const verpasst = page.locator('.verpasst');
    await verpasst.waitFor();
    assert.match(await verpasst.innerText(), /Nicht erledigt/);
    await page.screenshot({ path: path.join(out, `heute-${width}.png`), fullPage: true });
    await axe(page, 'Heute');
    await verpasst.getByRole('button', { name: 'Verstanden', exact: true }).click();
    await verpasst.waitFor({ state: 'detached' });
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('.heute__kopf').waitFor();
    assert.equal(await page.locator('.verpasst').count(), 0, 'Hinweis kommt nach „Verstanden“ nicht wieder');

    // Lernzeit: Dienstplan mit Vorschau
    await page.goto(base + '#/lernen/plan?ansicht=zeit', { waitUntil: 'networkidle' });
    const dienst = page.locator('.dienstplan');
    for (let i = 0; i < 5; i++) await dienst.locator('select').nth(i).selectOption('nacht');
    await dienst.locator('.vorschau').waitFor();
    assert.match(await dienst.innerText(), /5 Tage geändert/);
    await page.screenshot({ path: path.join(out, `zeit-${width}.png`), fullPage: true });
    await axe(page, 'Lernzeit');
    await dienst.getByRole('button', { name: 'Dienstplan speichern', exact: true }).click();
    await page.getByText('Dienstplan gespeichert', { exact: false }).first().waitFor();
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('.dienstplan select').first().inputValue(), 'nacht');
    assert.match(await page.locator('.ausnahme-form').innerText(), /Frühdienst/);

    // Prüfungen: Kompetenzbereiche und Kalenderexport
    await page.goto(base + '#/lernen/plan?ansicht=pruefungen', { waitUntil: 'networkidle' });
    await page.getByText('Stand nach Kompetenzbereich', { exact: true }).click();
    const tabelle = page.locator('.kompetenzen__liste');
    await tabelle.waitFor();
    assert((await tabelle.locator('li').count()) >= 1);
    await page.screenshot({ path: path.join(out, `pruefungen-${width}.png`), fullPage: true });
    await axe(page, 'Prüfungen');
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'In den Kalender (.ics)', exact: true }).click()]);
    const ics = fs.readFileSync(await download.path(), 'utf8');
    assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
    assert.match(ics, /SUMMARY:Prüfung: Testklausur Alltag/);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Überlauf bei ${width}px`);
    assert.deepEqual(errors, []);
    console.log(`Lernalltag ${width}px: liegen gebliebene Blöcke, Dienstplan mit Vorschau, Kompetenzbereiche, Kalenderexport und WCAG bestanden.`);
    await context.close();
  }
} finally { await browser.close(); }
