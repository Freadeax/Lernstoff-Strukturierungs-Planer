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
assert(kopf.get('permissions-policy')?.includes('geolocation=()'), 'Permissions-Policy');

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
} finally {
  await browser.close();
}
if (verstoesse.length) { console.error([...new Set(verstoesse)].join('\n')); process.exit(1); }
console.log(`CSP ok: ${routes.length} Seiten und ein PDF-Scan-Import ohne Verstoß.`);
