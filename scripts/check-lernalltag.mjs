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
    // Mit Uhrzeit: Lernbeginn setzen, erneut exportieren, Zeitzone und SEQUENCE prüfen
    await page.getByRole('button', { name: 'Mit Uhrzeiten?' }).click();
    await page.getByLabel('Normaler Tag').fill('18:00');
    const [download2] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'In den Kalender (.ics)', exact: true }).click()]);
    const ics2 = fs.readFileSync(await download2.path(), 'utf8');
    assert.match(ics2, /BEGIN:VTIMEZONE\r\nTZID:Europe\/Berlin/);
    assert.match(ics2, /DTSTART;TZID=Europe\/Berlin:\d{8}T180000/);
    await axe(page, 'Kalenderexport mit Uhrzeit');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Überlauf bei ${width}px`);

    // CE-Matrix: Materialstand je Ausbildungsabschnitt, CE 10 mit Weg Quelle → Abfrage
    await page.goto(base + '#/lernen/ce?ansicht=matrix', { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: '3. Ausbildungsdrittel' }).waitFor();
    assert.match(await page.locator('.ce-matrix__tabelle').first().innerText(), /CE 01/);
    await axe(page, 'CE-Matrix');
    await page.screenshot({ path: path.join(out, `ce-matrix-${width}.png`), fullPage: true });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Überlauf CE-Matrix bei ${width}px`);
    await page.goto(base + '#/lernen/ce?ce=ce.10', { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Materialstand' }).waitFor();
    await page.getByText(/Alle \d+ Themen einzeln/).click();
    const ce10 = await page.locator('.ce-matrix__themen').innerText();
    assert.match(ce10, /Neugeborenes und Wochenbett/);
    assert.match(ce10, /Keine Quelle/);
    await axe(page, 'CE 10 Materialstand');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Überlauf CE 10 bei ${width}px`);

    // Themenpflege: falsche Zuordnung lösen, eigenes Thema umbenennen und mit Dublette zusammenführen
    const fachId = catalog.topics.find((t) => t.id === blaetter[0]).subjectId;
    await page.evaluate(async ({ fachId, katalogThema }) => {
      const open = indexedDB.open('lernstoff-planer');
      const db = await new Promise((resolve, reject) => { open.onsuccess = () => resolve(open.result); open.onerror = () => reject(open.error); });
      const tx = db.transaction(['topics', 'documents', 'exams', 'reviewLogs'], 'readwrite');
      tx.objectStore('topics').put({ id: 'thema.eigen.test-a', subjectId: fachId, name: 'Testthema Verband', prerequisites: [] });
      tx.objectStore('topics').put({ id: 'thema.eigen.test-b', subjectId: fachId, name: 'Testthema Verbände', prerequisites: [] });
      tx.objectStore('documents').put({ id: 'test.pflege', title: 'Testdokument Pflege', kind: 'pdf', subjectIds: [fachId], topicIds: ['thema.eigen.test-a', katalogThema], version: 1, contentHash: 'c-pflege', importedAt: new Date().toISOString() });
      tx.objectStore('exams').put({ id: 'test.pflege.e', name: 'Testprüfung Pflege', date: '2099-01-01', subjectIds: [], topicIds: ['thema.eigen.test-a'] });
      tx.objectStore('reviewLogs').add({ topicId: 'thema.eigen.test-a', date: new Date().toISOString().slice(0, 10), source: 'trainer', scorePercent: 80, at: new Date().toISOString() });
      await new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); });
    }, { fachId, katalogThema: blaetter[0] });
    await page.goto(base + `#/lernen/thema?id=${encodeURIComponent(blaetter[0])}`, { waitUntil: 'networkidle' });
    const zeile = page.locator('.thema__liste li', { hasText: 'Testdokument Pflege' });
    await zeile.getByText('Falsch zugeordnet?').click();
    await zeile.getByRole('button', { name: 'Nicht zu diesem Thema' }).click();
    await page.locator('.thema__liste li', { hasText: 'Testdokument Pflege' }).waitFor({ state: 'detached' });
    await page.goto(base + '#/lernen/thema?id=thema.eigen.test-a', { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Eigenes Thema verwalten' }).waitFor();
    await axe(page, 'Themenpflege');
    await page.getByLabel('Name', { exact: true }).fill('Testthema Verbandwechsel');
    await page.getByRole('button', { name: 'Umbenennen' }).click();
    await page.getByRole('heading', { name: 'Testthema Verbandwechsel' }).waitFor();
    await page.getByLabel('Zusammenführen mit').selectOption('thema.eigen.test-b');
    assert.match(await page.locator('.thema__verwalten').innerText(), /1 Prüfung, 1 Abfrage/);
    await page.getByRole('button', { name: 'Zusammenführen', exact: true }).click();
    await page.getByRole('heading', { name: 'Testthema Verbände' }).waitFor();
    const nachher = await page.evaluate(async () => {
      const open = indexedDB.open('lernstoff-planer');
      const db = await new Promise((resolve) => { open.onsuccess = () => resolve(open.result); });
      const get = (store, key) => new Promise((resolve) => { const r = db.transaction(store).objectStore(store).get(key); r.onsuccess = () => resolve(r.result); });
      const all = (store) => new Promise((resolve) => { const r = db.transaction(store).objectStore(store).getAll(); r.onsuccess = () => resolve(r.result); });
      return { a: await get('topics', 'thema.eigen.test-a'), exam: await get('exams', 'test.pflege.e'), logs: (await all('reviewLogs')).filter((l) => l.topicId.startsWith('thema.eigen.test')).map((l) => l.topicId) };
    });
    assert.equal(nachher.a, undefined);
    assert.deepEqual(nachher.exam.topicIds, ['thema.eigen.test-b']);
    assert.deepEqual(nachher.logs, ['thema.eigen.test-b']);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Überlauf Themenpflege bei ${width}px`);

    // Material: schwer lesbare Seiten, Dubletten, Sprung zur Fundstelle, Original neben der Zusammenfassung
    const thema = blaetter[1];
    await page.evaluate(async ({ thema }) => {
      const open = indexedDB.open('lernstoff-planer');
      const db = await new Promise((resolve, reject) => { open.onsuccess = () => resolve(open.result); open.onerror = () => reject(open.error); });
      const tx = db.transaction(['documents', 'chunks', 'fingerprints', 'summaries'], 'readwrite');
      const doc = (id, title) => ({ id, title, kind: 'pdf', subjectIds: [], topicIds: [thema], version: 1, contentHash: 'c-' + id, importedAt: new Date().toISOString() });
      tx.objectStore('documents').put(doc('test.scan', 'Testscan Kreislauf'));
      tx.objectStore('documents').put(doc('test.kopie', 'Testscan Kreislauf Kopie'));
      const text = 'Der Blutdruck wird in mmHg gemessen. Normal sind etwa 120 zu 80 mmHg. Werte über 140 zu 90 gelten als erhöht.';
      tx.objectStore('chunks').put({ id: 'test.scan#1', documentId: 'test.scan', page: 1, text, ocrConfidence: 0.95 });
      tx.objectStore('chunks').put({ id: 'test.scan#2', documentId: 'test.scan', page: 2, text: 'Schlecht lesbarer ⟦?⟧ Abschnitt.', ocrConfidence: 0.45 });
      const fp = (id) => ({ documentId: id, title: id, fileHash: 'gleich', contentHash: 'gleich', minhash: Array(128).fill(1), paragraphHashes: [], meta: {}, importedAt: '' });
      tx.objectStore('fingerprints').put(fp('test.scan'));
      tx.objectStore('fingerprints').put(fp('test.kopie'));
      const start = text.indexOf('Normal');
      tx.objectStore('summaries').put({ id: 'test.zf', mode: 'originalgetreu', length: 'kurz', topicIds: [thema], sourceDocumentIds: ['test.scan'], createdAt: new Date().toISOString(), needsReview: false,
        claims: [{ id: 'k1', text: 'Normal sind etwa 120 zu 80 mmHg.', status: 'belegt', isSupplementary: false, citations: [{ chunkId: 'test.scan#1', documentId: 'test.scan', page: 1, quote: 'Normal sind etwa 120 zu 80 mmHg.', charStart: start, charEnd: start + 32 }] }] });
      await new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); });
      db.close();
      localStorage.setItem('lernstoff.fehlerheft', JSON.stringify([{ id: 'simulation:test', quelle: 'simulation', topicIds: [thema], titel: 'Testfrage Blutdruck', frage: 'Normwert?', deineAntwort: '160/100', loesung: '120/80', erklaerung: [], wiederholung: { art: 'auswahl', optionen: ['120/80', '160/100'], richtig: [0], mehrfach: false }, erfasst: '2026-11-01', letzterFehler: '2026-11-01', fehlerAnzahl: 1, treffer: [], aktualisiert: new Date().toISOString() }]));
    }, { thema });
    await page.goto(base + '#/material/zusammenfassen', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /Originalgetreu · kurz/ }).click();
    await page.getByText('Normal sind etwa 120 zu 80 mmHg.', { exact: true }).click();
    const original = page.getByRole('link', { name: /Fundstelle im Dokument öffnen/ });
    await original.waitFor();
    if (width >= 1000) {
      const [zf, src] = await Promise.all([page.locator('.zf-split > .summary').boundingBox(), page.locator('.zf-split > .source').boundingBox()]);
      assert(src.x > zf.x + zf.width - 1, 'Original steht auf dem iPad quer neben der Zusammenfassung');
    }
    await page.screenshot({ path: path.join(out, `zusammenfassung-${width}.png`), fullPage: true });
    await axe(page, 'Zusammenfassung');
    await original.click();
    await page.locator('.chunk--ziel mark').waitFor();
    assert.equal(await page.locator('.chunk--ziel mark').innerText(), 'Normal sind etwa 120 zu 80 mmHg.');
    assert.match(await page.locator('.lesehinweise').innerText(), /1 Seite schwer lesbar/);
    assert.equal(await page.locator('.dokument__dublette').count(), 2);
    await page.screenshot({ path: path.join(out, `dokument-${width}.png`), fullPage: true });
    await axe(page, 'Dokumente');

    // Fehlerheft: zurück zum Stoff
    await page.goto(base + '#/lernen/fehler', { waitUntil: 'networkidle' });
    const wege = page.locator('.fehlerheft__rueckwege').first();
    await wege.getByRole('link', { name: 'Thema mit Karteikarten wiederholen' }).waitFor();
    await wege.getByRole('link', { name: /Original: Testscan Kreislauf/ }).first().waitFor();
    await axe(page, 'Fehlerheft');

    // Fortschritt: Lernstufen
    await page.goto(base + '#/lernen/fortschritt', { waitUntil: 'networkidle' });
    const stufen = page.locator('.fs-stufen');
    await stufen.waitFor();
    assert.match(await stufen.innerText(), /Abgerufen\s*1 von/);
    await axe(page, 'Fortschritt');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Überlauf bei ${width}px`);
    assert.deepEqual(errors, []);
    console.log(`Lernalltag ${width}px: liegen gebliebene Blöcke, Dienstplan mit Vorschau, Kompetenzbereiche, Kalenderexport, CE-Matrix, Themenpflege, Fundstelle, Original nebeneinander, Lese-/Dublettenhinweise, Fehlerheft-Rückwege, Lernstufen und WCAG bestanden.`);
    await context.close();
  }
} finally { await browser.close(); }
