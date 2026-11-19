// Praxissimulator Stufe 1 (geführt) auf dem neuen Kern (P21, #/lernen/praxis?gefuehrt=<fall>): bei 390 (iPhone),
// 820 (iPad hoch, „Bewegung reduzieren“) und 1180 px (iPad quer) einen Spur-A-Fall vollständig durchspielen,
// zuerst je Schritt eine falsche Möglichkeit, dann die richtige; Entscheidungsmomente, Auswertung, Fortsetzen; axe WCAG 2.2 AA.
// Bei 1180 px zusätzlich ein Spur-B-Fall (Verdacht vor dem Pflegebedarf).
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const base = (process.env.UI_BASE_URL || 'http://127.0.0.1:5187/').replace(/\/?$/, '/');
const output = path.resolve(process.env.UI_ARTIFACT_DIR || '.ui-check/stufe1');
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}), headless: true });
const fehler = [];
try {
  for (const [w, h] of [[390, 844], [820, 1180], [1180, 820]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, locale: 'de-DE', colorScheme: 'light', reducedMotion: w === 820 ? 'reduce' : 'no-preference' });
    const p = await ctx.newPage();
    p.on('pageerror', (e) => fehler.push(`${w}: ${e.message}`));
    const axe = async (name, voll = false) => {
      const a = await new AxeBuilder({ page: p }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      for (const v of a.violations) fehler.push(`${w} ${name}: ${v.id} (${v.nodes.length}×) ${v.nodes[0]?.html.slice(0, 120)}`);
      assert(!(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth)), `${w} ${name}: waagerecht verrutscht`);
      await p.screenshot({ path: path.join(output, `${w}-${name}.png`), fullPage: voll });
    };

    await p.goto(base + '#/lernen/praxis', { waitUntil: 'networkidle' });
    // Einstieg aus der Fallauswahl: Kernfall mit „Geführt üben“
    await p.locator('.praxis-fall', { hasText: 'Ich bin nur kurz hingesessen' }).first().getByRole('button', { name: 'Geführt üben' }).click();
    await p.getByRole('radio', { name: /2\. Drittel/ }).check();
    await axe('briefing');
    await p.getByRole('button', { name: 'Geführt beginnen' }).click();
    await p.locator('.s1-frage h3').first().waitFor();
    assert.match(await p.locator('.s1-werte').innerText(), /—/, 'zu Beginn nichts gemessen');
    const anzahl = await p.locator('.s1-optionen button').count();
    assert.ok(anzahl >= 3 && anzahl <= 4, `${w}: 3–4 Möglichkeiten (${anzahl})`);
    await axe('schritt');

    let schritte = 0, falschGezeigt = false;
    for (let i = 0; i < 160 && !(await p.locator('.s1-ende').count()); i++) {
      if (await p.locator('.s1-frage--ereignis').count()) { await p.locator('.s1-frage--ereignis .s1-optionen button').first().click(); continue; }
      if (await p.locator('.s1-weiter button').count()) { await p.locator('.s1-weiter button').click(); schritte++; continue; }
      const offen = p.locator('.s1-optionen button:not([disabled])');
      // Erster Versuch je Schritt: eine Möglichkeit, die nicht richtig ist (Reihenfolge in der App gemischt)
      if (!(await p.locator('.s1-rueck').count()) && (await offen.count()) > 1) {
        await offen.nth(1).click();
        await p.locator('.s1-rueck').first().waitFor();
        if (!falschGezeigt && await p.locator('.s1-rueck.is-falsch, .s1-rueck.is-gefaehrlich, .s1-rueck.is-vertretbar').count()) {
          falschGezeigt = true;
          assert.match(await p.locator('.s1-rueck').first().innerText(), /„/, 'Praxisanleitung erklärt');
          await axe('rueckmeldung');
        }
        continue;
      }
      await offen.first().click();
    }
    await p.locator('.s1-ende').waitFor();
    assert.ok(schritte >= 15, `${w}: mindestens 15 Schritte (${schritte})`);
    assert.match(await p.locator('.s1-bilanz').innerText(), /Schritten im ersten Versuch richtig/);
    assert.ok(await p.locator('.ap-ende').count(), 'Auswertung wie in Stufe 2');
    await axe('auswertung', true);
    // Weiter zu Stufe 2 mit demselben Fall
    await p.getByRole('button', { name: 'Diesen Fall frei üben (Stufe 2)' }).click();
    await p.getByRole('button', { name: 'Fall beginnen' }).waitFor();

    // Fortsetzen nach dem Neuladen
    await p.goto(base + '#/lernen/praxis?gefuehrt=kh-pneumonie-sepsis', { waitUntil: 'networkidle' });
    await p.getByRole('button', { name: 'Geführt beginnen' }).click();
    await p.locator('.s1-optionen button').first().click();
    await p.reload({ waitUntil: 'networkidle' });
    await p.getByRole('button', { name: 'Fortsetzen' }).click();
    assert.ok(await p.locator('.s1-rueck').count(), `${w}: Fortsetzen stellt die Wahl wieder her`);

    if (w === 1180) {
      await p.goto(base + '#/lernen/praxis?gefuehrt=sr-septischer-schock', { waitUntil: 'networkidle' });
      await p.getByRole('button', { name: 'Geführt beginnen' }).click();
      let verdacht = false;
      for (let i = 0; i < 160 && !(await p.locator('.s1-ende').count()); i++) {
        if (await p.locator('.s1-frage--ereignis').count()) { await p.locator('.s1-frage--ereignis .s1-optionen button').first().click(); continue; }
        if (await p.locator('.s1-weiter button').count()) { await p.locator('.s1-weiter button').click(); continue; }
        if (!verdacht && /Verdacht/.test(await p.locator('.s1-frage h3').innerText())) { verdacht = true; await axe('spur-b-verdacht'); }
        // Richtig wählen: nacheinander, bis „Weiter“ erscheint
        await p.locator('.s1-optionen button:not([disabled])').first().click();
      }
      assert.ok(verdacht, 'Spur B: Verdacht vor dem Pflegebedarf');
      await p.locator('.s1-ende').waitFor();
      await axe('spur-b-auswertung', true);
    }
    await ctx.close();
  }
} finally { await browser.close(); }
assert.deepEqual(fehler, [], 'Stufe 1');
console.log('Stufe 1 (geführt): Pilotfall bei 390, 820 und 1180 px mit Irrwegen durchgespielt, Fortsetzen, Spur B mit Verdacht; axe WCAG 2.2 AA ohne Befund.');
