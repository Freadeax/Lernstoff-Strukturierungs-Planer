import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
const base = process.env.UI_BASE_URL || 'http://127.0.0.1:5175/';
const out = path.resolve('.ui-check/material');
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) });
try {
  for (const width of [1280, 390, 820]) {
    const context = await browser.newContext({ viewport: { width, height: 950 }, locale: 'de-DE' });
    const page = await context.newPage(); page.setDefaultTimeout(8000);
    const errors = []; page.on('pageerror', (e) => errors.push(e.message));
    const go = async (route) => { await page.goto(base + '#' + route); await page.locator('main').waitFor(); };
    await go('/material/dokumente');
    await page.locator('main input[type=file]').setInputFiles({ name: 'Mobilitaet im Alltag.txt', mimeType: 'text/plain', buffer: Buffer.from('Ein neues eigenes Lernthema. Bewegung im Alltag trainieren und auf sichere Umgebung achten.') });
    await page.getByRole('link', { name: 'Wichtigste Inhalte zusammenfassen' }).waitFor();
    await page.getByText('Themen zuordnen ·', { exact: false }).click();
    await page.getByRole('button', { name: 'Übernehmen', exact: true }).click();
    await page.getByText('Themen zuordnen · 1 verknüpft', { exact: false }).waitFor();
    await page.screenshot({ path: path.join(out, `dokumente-${width}.png`), fullPage: true });
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    assert.equal(axe.violations.length, 0, JSON.stringify(axe.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.html) }))));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Dokumente: Überlauf');
    await page.getByRole('link', { name: 'Wichtigste Inhalte zusammenfassen' }).click();
    await page.getByText('Aus Quellen wird Lernstoff.', { exact: true }).waitFor();
    assert(await page.locator('main input[name=sources]').first().isChecked());
    assert.equal(await page.locator('select[name=length]').inputValue(), 'kurz');
    await go('/lernen/themen');
    await page.getByPlaceholder('Themen durchsuchen').fill('Mobilitaet im Alltag');
    await page.getByText('Mobilitaet im Alltag', { exact: true }).waitFor();
    await go('/lernen/board');
    const pool = page.locator('[data-col=pool] [data-scroll-root]');
    for (let i = 0; i < 40 && !await page.getByText('Mobilitaet im Alltag', { exact: true }).isVisible(); i++) { await pool.evaluate((e) => { e.scrollTop = e.scrollHeight; }); await page.waitForTimeout(100); }
    await page.getByText('Mobilitaet im Alltag', { exact: true }).waitFor();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Board: Überlauf');
    // Privates Material-Repo simulieren; keine echten Tokens oder externen Schreibzugriffe.
    const payload = Buffer.from('Wichtiger Quelltext zur Mobilitaet. Eine sichere Umgebung erleichtert Bewegung im Alltag.');
    const manifest = { format: 'lernstoff-ablage/1', name: 'Repo Skript.txt', groesse: payload.length, typ: 'text/plain', hochgeladen: '2026-10-26T12:00:00Z', teile: [{ datei: 'repo-skript.txt', groesse: payload.length, sha256: createHash('sha256').update(payload).digest('hex') }] };
    let writes = 0;
    await page.route('https://api.github.com/**', async (route) => {
      const req = route.request(); const url = new URL(req.url()); const p = url.pathname.replace('/repos/test/material','');
      const json = (obj, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(obj) });
      if (req.method() === 'HEAD') return route.fulfill({ status: 200 });
      if (p === '') return json({ private: true, default_branch: 'main', full_name: 'test/material', permissions: { push: true } });
      if (p === '/git/ref/heads/main') return json({ object: { sha: 'a'.repeat(40) } });
      if (p.startsWith('/git/commits/')) return json({ tree: { sha: 'b'.repeat(40) } });
      if (p === '/contents/dateien') return json([{ name: 'repo-skript', type: 'dir' }]);
      if (p.endsWith('/manifest.json')) return json(manifest);
      if (p.endsWith('/repo-skript.txt')) return route.fulfill({ body: payload, contentType: 'text/plain' });
      if (req.method() === 'POST') {
        writes++;
        const data = req.postDataJSON();
        if (p === '/git/blobs') { const bytes = Buffer.from(data.content, 'base64'); return json({ sha: createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex') }); }
        return json({ sha: 'c'.repeat(40) });
      }
      if (req.method() === 'PATCH') return json({ object: { sha: 'c'.repeat(40) } });
      return json({ message: 'Not found' }, 404);
    });
    await page.evaluate(() => localStorage.setItem('lernstoff.ablage', JSON.stringify({ owner: 'test', repo: 'material', token: 'test-only' })));
    await go('/material/ablage');
    await page.getByRole('button', { name: width === 820 ? 'Neue Dateien einlesen (1)' : 'Als Dokument einlesen / Themen abgleichen' }).click();
    await page.getByRole('link', { name: 'Wichtigste Inhalte zusammenfassen' }).waitFor();
    await page.getByText('Als Dokument verfügbar', { exact: true }).waitFor();
    assert.equal(writes, 0, 'Repo-Datei wurde erneut hochgeladen');
    await page.screenshot({ path: path.join(out, `repo-${width}.png`), fullPage: true });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Repo: Überlauf');
    await go('/material/import');
    await page.getByRole('button', { name: 'Weiter', exact: true }).click();
    await page.locator('main input[type=file]').setInputFiles({ name: 'Assistent Sicherung.txt', mimeType: 'text/plain', buffer: Buffer.from('Weiterer Lernstoff aus dem Import-Assistenten.') });
    await page.getByRole('button', { name: 'Weiter', exact: true }).click();
    assert(await page.getByLabel('Originale auch im privaten Material-Repo speichern', { exact: false }).isChecked());
    await page.getByRole('button', { name: '1 Datei importieren', exact: true }).click();
    await page.getByText('Original im privaten Material-Repo gespeichert.', { exact: true }).waitFor();
    assert(writes > 0);
    assert.deepEqual(errors, []);
    console.log(`Materialablauf ${width}px: Browserimport, Themenpool, Zusammenfassen, Repo-Abruf und Assistent-Sicherung bestanden.`);
    await context.close();
  }
} finally { await browser.close(); }
