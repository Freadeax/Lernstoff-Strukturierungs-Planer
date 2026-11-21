// Läuft die App mit den Sicherheitsheadern aus public/_headers ohne Verstoß?
//   • Header kommen an (CSP, frame-ancestors, nosniff, Referrer-, Permissions-Policy)
//   • alle Menüseiten ohne CSP-Verstoß
//   • echter Import eines PDFs mit Scan-Seite: pdf.js-Worker und Tesseract (WASM im Blob-Worker)
//   • Service Worker registriert sich
// Läuft gegen scripts/serve-dist.mjs (UI_BASE_URL), nicht gegen vite preview, weil nur der die Header setzt.
import { chromium } from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const base = (process.env.UI_BASE_URL || 'http://127.0.0.1:4173/').replace(/\/?$/, '/');
const routes = [...fs.readFileSync('src/ui/shell/nav.ts', 'utf8').matchAll(/path: '([^']+)'/g)].map((m) => m[1]);
assert(routes.length > 20, 'Menüpfade aus nav.ts gelesen');

const kopf = (await fetch(base)).headers;
const csp = kopf.get('content-security-policy') ?? '';
assert(csp.includes("frame-ancestors 'none'"), `CSP mit frame-ancestors (UI_BASE_URL muss serve-dist.mjs sein): ${csp || 'fehlt'}`);
for (const [k, v] of [['x-content-type-options', 'nosniff'], ['x-frame-options', 'DENY'], ['referrer-policy', 'no-referrer']]) assert.equal(kopf.get(k), v, k);
const rechte = kopf.get('permissions-policy') ?? '';
assert(rechte.includes('geolocation=()') && rechte.includes('camera=()') && rechte.includes('microphone=(self)'),
  `Permissions-Policy (Kamera aus, Mikrofon nur eigene Adresse): ${rechte || 'fehlt'}`);
// Nicht nur das Hauptdokument: Service Worker und Manifest brauchen dieselben Schutzheader und no-cache für Updates
for (const pfad of ['sw.js', 'manifest.webmanifest']) {
  const h = (await fetch(base + pfad)).headers;
  assert.equal(h.get('x-content-type-options'), 'nosniff', `${pfad}: nosniff`);
  assert(h.get('content-security-policy')?.includes("frame-ancestors 'none'"), `${pfad}: CSP`);
  assert(/no-cache/.test(h.get('cache-control') ?? ''), `${pfad}: Cache-Control no-cache (${h.get('cache-control')})`);
}

const browser = await chromium.launch({ ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}), headless: true });
const verstoesse = [];
try {
  const ctx = await browser.newContext({ locale: 'de-DE' });
  // Verstöße aus Seite und Workern einsammeln
  await ctx.addInitScript(() => {
    addEventListener('securitypolicyviolation', (e) => console.error(`CSP-Verstoß: ${e.violatedDirective} ${e.blockedURI}`));
  });
  const page = await ctx.newPage();
  page.setDefaultTimeout(15000);
  let route = '';
  page.on('console', (m) => { if (/Content Security Policy|CSP-Verstoß/.test(m.text())) verstoesse.push(`${route}: ${m.text()}`); });
  page.on('pageerror', (e) => verstoesse.push(`${route}: Laufzeitfehler ${e.message}`));

  for (route of routes) {
    await page.goto(base + '#' + route, { waitUntil: 'networkidle' });
    await page.waitForTimeout(150);
  }
  route = 'service-worker';
  await page.evaluate(() => navigator.serviceWorker.ready);

  // Echter Import mit pdf.js und Texterkennung
  route = '/material/dokumente (PDF mit Scan)';
  await page.goto(base + '#/material/dokumente', { waitUntil: 'networkidle' });
  await page.locator('main input[type=file]').setInputFiles('src/features/dokumente/import/__fixtures__/scan.pdf');
  try { await page.getByText(/per Texterkennung/).first().waitFor({ timeout: 120000 }); }
  catch { verstoesse.push(`${route}: Texterkennung lief nicht durch (Worker oder WASM blockiert?)`); }
  await ctx.close();

  // Wie auf GitHub Pages: ohne Sicherheitsheader. Dann muss die CSP aus dem <meta> in index.html greifen (Audit D-1).
  const gh = await browser.newContext({ locale: 'de-DE' });
  await gh.route('**/*', async (r) => {
    const antwort = await r.fetch();
    const h = { ...antwort.headers() };
    for (const k of ['content-security-policy', 'x-frame-options', 'referrer-policy', 'permissions-policy', 'cross-origin-opener-policy']) delete h[k];
    await r.fulfill({ response: antwort, headers: h });
  });
  await gh.addInitScript(() => {
    addEventListener('securitypolicyviolation', (e) => console.error(`CSP-Verstoß: ${e.violatedDirective} ${e.blockedURI}`));
  });
  const gp = await gh.newPage();
  gp.setDefaultTimeout(15000);
  route = 'ohne Header';
  const metaVerstoesse = [];
  gp.on('console', (m) => { if (/Content Security Policy|CSP-Verstoß/.test(m.text())) metaVerstoesse.push(`${route}: ${m.text()}`); });
  gp.on('pageerror', (e) => verstoesse.push(`ohne Header ${route}: Laufzeitfehler ${e.message}`));
  for (route of routes) {
    await gp.goto(base + '#' + route, { waitUntil: 'networkidle' });
    await gp.waitForTimeout(100);
  }
  for (const v of metaVerstoesse) verstoesse.push(`ohne Header ${v}`);
  // Wirkt die CSP aus dem <meta> wirklich? Ein eingeschleustes Inline-Skript muss blockiert werden.
  const meta = await gp.evaluate(() => document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.getAttribute('content') ?? '');
  if (!/script-src 'self'/.test(meta) || /frame-ancestors/.test(meta)) verstoesse.push(`ohne Header: <meta>-CSP fehlt oder falsch: ${meta || 'fehlt'}`);
  const blockiert = await gp.evaluate(() => new Promise((ok) => {
    addEventListener('securitypolicyviolation', () => ok(true), { once: true });
    const s = document.createElement('script'); s.textContent = 'window.__eingeschleust = 1'; document.head.appendChild(s);
    setTimeout(() => ok(!(window).__eingeschleust), 500);
  }));
  if (!blockiert) verstoesse.push('ohne Header: eingeschleustes Inline-Skript lief trotz <meta>-CSP');
  // Eingebettet in eine fremde Seite: die App startet nicht, sondern zeigt einen Hinweis.
  const rahmen = await gh.newPage();
  await rahmen.setContent(`<iframe src="${base}" width="400" height="300"></iframe>`);
  const f = rahmen.frames().find((x) => x !== rahmen.mainFrame());
  try {
    await f.waitForSelector('#rahmen-hinweis', { timeout: 10000 });
    if (await f.locator('#root *').count()) verstoesse.push('eingebettet: App startet trotz fremdem Rahmen');
  } catch { verstoesse.push('eingebettet: kein Hinweis „nicht eingebettet“'); }
  await gh.close();
} finally {
  await browser.close();
}
if (verstoesse.length) { console.error([...new Set(verstoesse)].join('\n')); process.exit(1); }
console.log(`CSP ok: ${routes.length} Seiten und ein PDF-Scan-Import ohne Verstoß; ohne Header (wie GitHub Pages) greift die CSP aus index.html, Einbetten in fremde Seiten wird abgewiesen.`);
