// Offline-Start der PWA gegen den gebauten Stand (UI_BASE_URL, Standard http://127.0.0.1:5173/):
//   • Service Worker installiert sich und übernimmt die Seite
//   • ohne Netz: Neuladen und kalter Start (neuer Tab) zeigen die App, alle Menüseiten laden ihre Teile aus dem Cache
//   • die Build-ID ist sichtbar (Datensicherung) und nicht der Entwicklungs-Platzhalter
//   • neuere Datenbank aus einem anderen Fenster: Upgrade wird nicht blockiert, alter Tab zeigt „neu laden“
//   • neue Veröffentlichung (dist/version.json + index.html kurz geändert): EIN Neuladen holt die neue Startseite
//     am Service Worker vorbei, die App erkennt die neue Version und zeigt den Hinweis (iPhone-Problem)
// Gedacht nach jedem Update von vite-plugin-pwa/Workbox.
import { chromium } from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const base = (process.env.UI_BASE_URL || 'http://127.0.0.1:5173/').replace(/\/?$/, '/');
const routes = [...fs.readFileSync('src/ui/shell/nav.ts', 'utf8').matchAll(/path: '([^']+)'/g)].map((m) => m[1]);
assert(routes.length > 20, 'Menüpfade aus nav.ts gelesen');

const browser = await chromium.launch({ ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}), headless: true });
const fehler = [];
try {
  const ctx = await browser.newContext({ locale: 'de-DE', timezoneId: 'Europe/Berlin' });
  const page = await ctx.newPage();
  page.setDefaultTimeout(15000);
  const laufzeit = [];
  page.on('pageerror', (e) => laufzeit.push(e.message));
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.evaluate(() => navigator.serviceWorker.ready);
  if (!(await page.evaluate(() => !!navigator.serviceWorker.controller))) await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  // Vorab-Cache vollständig? (Workbox legt die Liste in einem Cache „workbox-precache…“ ab)
  const imCache = await page.evaluate(async () => {
    const namen = await caches.keys();
    const pre = namen.find((n) => n.includes('precache'));
    return pre ? (await (await caches.open(pre)).keys()).length : 0;
  });
  assert(imCache > 20, `Vorab-Cache enthält ${imCache} Dateien`);

  await page.goto(base + '#/system/sicherung', { waitUntil: 'networkidle' });
  const version = await page.locator('text=App-Version').first().textContent();
  assert(version && !/Entwicklung/.test(version) && /\d{4}-\d{2}-\d{2}/.test(version), `Build-ID sichtbar: ${version}`);

  // Neue Veröffentlichung simulieren: Der Server liefert eine andere version.json und eine geänderte Startseite.
  const versionDatei = 'dist/version.json';
  const startDatei = 'dist/index.html';
  const alteVersion = fs.readFileSync(versionDatei, 'utf8');
  const alteStart = fs.readFileSync(startDatei, 'utf8');
  try {
    fs.writeFileSync(versionDatei, JSON.stringify({ build: 'neu · Prüfung' }));
    fs.writeFileSync(startDatei, alteStart.replace('</head>', '<meta name="pruef-marke" content="neu"></head>'));
    await page.reload({ waitUntil: 'load' });
    const marke = await page.evaluate(() => document.querySelector('meta[name="pruef-marke"]')?.getAttribute('content'));
    if (marke !== 'neu') fehler.push('Neuladen zeigt die alte Startseite aus dem Cache statt der neuen vom Server');
    await page.locator('.shell__aktualisierung').waitFor({ timeout: 10000 })
      .catch(() => fehler.push('Neue Version auf dem Server: kein Hinweis „Jetzt neu laden“'));
  } finally {
    fs.writeFileSync(versionDatei, alteVersion);
    fs.writeFileSync(startDatei, alteStart);
  }
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  if (await page.locator('.shell__aktualisierung').count()) fehler.push('Gleiche Version auf dem Server, trotzdem Hinweis auf neue Version');

  await ctx.setOffline(true);
  await page.reload({ waitUntil: 'load' });
  await page.locator('main').first().waitFor();
  for (const route of routes) {
    laufzeit.length = 0;
    await page.goto(base + '#' + route, { waitUntil: 'load' });
    await page.waitForTimeout(200);
    const text = await page.locator('main').first().innerText().catch(() => '');
    if (!text.trim()) fehler.push(`offline ${route}: leere Seite`);
    if (/Dieser Bereich hat gerade einen Fehler|Neue Version verfügbar/.test(text)) fehler.push(`offline ${route}: Fehlerseite`);
    for (const e of laufzeit) fehler.push(`offline ${route}: ${e}`);
  }
  // kalter Start ohne Netz
  const neu = await ctx.newPage();
  await neu.goto(base, { waitUntil: 'load' });
  await neu.locator('main').first().waitFor();
  // Seiten warten auf Glossar und Steckbriefe (nachgeladener Teil des Fachmoduls), deshalb auf die Überschrift warten.
  await neu.locator('main h1').first().waitFor({ timeout: 10000 }).catch(() => undefined);
  assert((await neu.locator('main').first().innerText()).trim().length > 20, 'kalter Offline-Start zeigt die Startseite');
  await ctx.close();

  // Ein anderes Fenster bringt eine neuere Datenbankversion mit (Update in zweitem Tab):
  // Dieses Fenster darf nicht stumm kaputtgehen, sondern zeigt den Hinweis zum Neuladen.
  const ctx2 = await browser.newContext({ locale: 'de-DE', timezoneId: 'Europe/Berlin' });
  const alt = await ctx2.newPage();
  await alt.goto(base, { waitUntil: 'networkidle' });
  await alt.locator('main').first().waitFor();
  const anderes = await ctx2.newPage();
  await anderes.goto(base + 'manifest.webmanifest');
  await anderes.evaluate(async () => {
    const info = (await indexedDB.databases()).find((d) => d.name === 'lernstoff-planer');
    await new Promise((resolve, reject) => {
      const r = indexedDB.open('lernstoff-planer', (info?.version ?? 1) + 10);
      r.onsuccess = () => { r.result.close(); resolve(); };
      r.onerror = () => reject(r.error);
      r.onblocked = () => reject(new Error('Upgrade blockiert: das alte Fenster gibt die Datenbank nicht frei'));
    });
  });
  await alt.bringToFront();
  await alt.locator('.shell__aktualisierung').waitFor({ timeout: 10000 })
    .catch(() => fehler.push('Neuere Datenbank in anderem Fenster: kein Hinweis zum Neuladen'));
  await ctx2.close();
} finally {
  await browser.close();
}
if (fehler.length) { console.error(fehler.join('\n')); process.exit(1); }
console.log(`Offline-Start ok: ${routes.length} Seiten ohne Netz geladen; neue Version kommt mit einem Neuladen; neuere Datenbank in anderem Fenster zeigt den Hinweis.`);
