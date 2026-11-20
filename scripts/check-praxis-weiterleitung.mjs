// Ablösung des alten Praxissimulators (P10): Fallauswahl nur noch mit Fällen auf dem neuen Kern, alte Links
// (?fall=, ?gefuehrt=<alt>, ?neu=<alt>) landen beim Nachfolgefall, Krankheitsbild- und Themen-Sprünge finden neue Fälle,
// das alte Archiv bleibt lesbar und alte Weitergabe-Links (Übergabe, Bericht, Pflegeplanung) zeigen auf den Nachfolger.
// Bei 390 und 1180 px, axe WCAG 2.2 AA auf Fallauswahl und Archiv.
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const base = (process.env.UI_BASE_URL || 'http://127.0.0.1:5187/').replace(/\/?$/, '/');
const output = path.resolve(process.env.UI_ARTIFACT_DIR || '.ui-check/praxis-weiterleitung');
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}), headless: true });
const fehler = [];
// Stichprobe aus altfaelle.ts (ALT_ZU_NEU); die vollständige Tabelle prüft altfaelle.test.ts.
const UMLEITUNG = [
  ['?fall=asthma', '?neu=paed-asthma-schulkind', 'Fall beginnen'],
  ['?fall=kh-delir-nacht', '?neu=kh-delir-nacht', 'Fall beginnen'],
  ['?neu=hausbesuch', '?neu=amb-hausbesuch-still', 'Fall beginnen'],
  ['?gefuehrt=nachtwache', '?gefuehrt=kh-pneumonie-sepsis', 'Geführt beginnen'],
  ['?gefuehrt=aufwachraum', '?gefuehrt=awr-opioid-atemdepression', 'Geführt beginnen'],
];
const ARCHIV = [{ id: 'alt-sitzung-1', time: 754, phase: 'finished', scenario: { id: 'sepsis', title: 'Gestern war sie noch klar' } }];
try {
  for (const [w, h] of [[390, 844], [1180, 820]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, locale: 'de-DE', colorScheme: 'light' });
    const p = await ctx.newPage();
    p.on('pageerror', (e) => fehler.push(`${w}: ${e.message}`));
    const axe = async (name) => {
      const a = await new AxeBuilder({ page: p }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      for (const v of a.violations) fehler.push(`${w} ${name}: ${v.id} (${v.nodes.length}×) ${v.nodes[0]?.html.slice(0, 120)}`);
      assert(!(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth)), `${w} ${name}: waagerecht verrutscht`);
      await p.screenshot({ path: path.join(output, `${w}-${name}.png`), fullPage: false });
    };

    // Fallauswahl: nur Kernfälle, keine alten Knöpfe und Markierungen
    await p.goto(base + '#/lernen/praxis', { waitUntil: 'networkidle' });
    await p.getByRole('heading', { name: 'Praxissimulator', exact: true }).waitFor();
    assert.equal(await p.getByRole('button', { name: 'Frei üben', exact: true }).count(), 0, 'kein alter „Frei üben“-Knopf');
    assert.equal(await p.getByRole('button', { name: 'Geführt', exact: true }).count(), 0, 'kein alter Leitfall-Knopf');
    assert.equal(await p.locator('.praxis-marke', { hasText: /^alt$/ }).count(), 0, 'keine Altfälle');
    assert.ok(await p.getByRole('button', { name: 'Neu üben' }).count() >= 30, 'Kernfälle in der Fallauswahl');
    assert.equal(await p.getByRole('button', { name: 'Neu üben' }).count(), await p.getByRole('button', { name: 'Geführt üben' }).count(), 'jeder Fall auch geführt');
    await axe('auswahl');

    // Alte Links → Nachfolgefall (Adresse wird ersetzt)
    for (const [von, nach, knopf] of UMLEITUNG) {
      await p.goto(base + `#/lernen/praxis${von}`, { waitUntil: 'networkidle' });
      await p.getByRole('button', { name: knopf }).waitFor();
      assert.ok(p.url().endsWith(`#/lernen/praxis${nach}`), `${von} → ${nach} (ist ${p.url()})`);
    }
    await p.goto(base + '#/lernen/praxis?fall=gibtsnicht', { waitUntil: 'networkidle' });
    await p.getByRole('heading', { name: 'Praxissimulator', exact: true }).waitFor();

    // Sprünge aus Krankheitsbild und Lernthema
    await p.goto(base + '#/lernen/praxis?kb=kh.schlaganfall', { waitUntil: 'networkidle' });
    assert.equal(await p.locator('.praxis-fall').count(), 2, 'zwei Schlaganfall-Fälle');
    await p.goto(base + '#/lernen/praxis?thema=thema.pro.thrombose', { waitUntil: 'networkidle' });
    assert.ok(await p.locator('.praxis-fall').count() >= 1, 'Fall zum Thema Thrombose');

    // Altes Archiv: lesbar, Nachfolger erreichbar; alte Weitergabe-Links zeigen auf den Nachfolger
    await p.evaluate((a) => localStorage.setItem('lernstoff.praxis.archiv', JSON.stringify(a)), ARCHIV);
    await p.goto(base + '#/lernen/praxis', { waitUntil: 'networkidle' });
    await p.getByText(/Abgeschlossene Übungen im bisherigen Simulator/).click();
    assert.match(await p.locator('.praxis-archiv').innerText(), /Gestern war sie noch klar/);
    await axe('archiv');
    await p.locator('.praxis-archiv').getByRole('button', { name: /Nachfolger/ }).click();
    await p.getByRole('button', { name: 'Fall beginnen' }).waitFor();
    assert.ok(p.url().endsWith('?neu=kh-pneumonie-sepsis'), 'Archiv → Nachfolger');
    for (const ziel of ['uebergabe', 'bericht', 'pflegeplanung']) {
      await p.goto(base + `#/lernen/${ziel}?aus=praxis&sitzung=alt-sitzung-1`, { waitUntil: 'networkidle' });
      const link = p.getByRole('link', { name: 'Den Nachfolgefall spielen' });
      await link.waitFor();
      assert.equal(await link.getAttribute('href'), '#/lernen/praxis?neu=kh-pneumonie-sepsis', `${ziel}: Weitergabe-Link`);
    }

    // Kurzfälle (Audit U-2): der frühere Fallsimulator ist eine Fallart im Praxissimulator; alte Adressen leiten mit allen Angaben weiter.
    await p.goto(base + '#/lernen/fall?thema=thema.pro.thrombose', { waitUntil: 'networkidle' });
    await p.getByRole('heading', { name: 'Praxissimulator', exact: true }).waitFor();
    await p.getByText('Probefälle ohne KI').waitFor();
    assert.ok(p.url().endsWith('#/lernen/praxis?art=kurz&thema=thema.pro.thrombose'), `#/lernen/fall → Kurzfälle (ist ${p.url()})`);
    assert.equal(await p.getByRole('group', { name: 'Fallart' }).getByRole('button', { name: 'Kurzfälle' }).getAttribute('aria-pressed'), 'true', 'Fallart Kurzfälle gewählt');
    await axe('kurzfaelle');
    await p.getByRole('button', { name: /^Probefall starten:/ }).first().click();
    await p.getByRole('button', { name: 'Abbrechen' }).waitFor();
    await p.getByRole('group', { name: 'Fallart' }).getByRole('button', { name: 'Praxisfälle' }).click();
    await p.getByRole('button', { name: 'Weiter im Kurzfall' }).click();
    await p.getByRole('button', { name: 'Abbrechen' }).waitFor();
    assert.ok(p.url().endsWith('#/lernen/praxis?art=kurz'), 'offener Kurzfall wird fortgesetzt');
    await ctx.close();
  }
} finally { await browser.close(); }
assert.deepEqual(fehler, [], 'Praxis-Weiterleitung');
console.log('Praxissimulator nach P10: Fallauswahl nur Kernfälle, alte Links (?fall/?neu/?gefuehrt) beim Nachfolger, Krankheitsbild/Thema, altes Archiv, alte Weitergabe-Links und Kurzfälle (früher #/lernen/fall) bei 390 und 1180 px geprüft; axe WCAG 2.2 AA ohne Befund.');
