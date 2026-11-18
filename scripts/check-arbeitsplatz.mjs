// Neuer Arbeitsplatz des Praxissimulators (Paket P2, #/lernen/praxis?neu=<fall>): Pilotfall einmal durchspielen
// bei 390 (iPhone), 820 (iPad hoch, „Bewegung reduzieren“) und 1180 px (iPad quer), axe WCAG 2.2 AA je Zustand.
// Prüft: Briefing mit Rolle, Pflegetasche (Gerät holen kostet Zeit, Werte erst nach dem Messen), Befugnis-Abzeichen,
// SBAR → Anordnung → Rücklesen, Abschluss mit Pflegebedarf und Übersicht der Pflichthandlungen.
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const base = (process.env.UI_BASE_URL || 'http://127.0.0.1:5187/').replace(/\/?$/, '/');
const output = path.resolve(process.env.UI_ARTIFACT_DIR || '.ui-check/arbeitsplatz');
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}), headless: true });
const fehler = [];
try {
  for (const [w, h] of [[390, 844], [820, 1180], [1180, 820]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, locale: 'de-DE', colorScheme: 'light', reducedMotion: w === 820 ? 'reduce' : 'no-preference' });
    const p = await ctx.newPage();
    p.on('pageerror', (e) => fehler.push(`${w}: ${e.message}`));
    const axe = async (name) => {
      const a = await new AxeBuilder({ page: p }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      for (const v of a.violations) fehler.push(`${w} ${name}: ${v.id} (${v.nodes.length}×) ${v.nodes[0]?.html.slice(0, 120)}`);
      await p.screenshot({ path: path.join(output, `${w}-${name}.png`) });
    };
    const suche = p.getByRole('searchbox', { name: 'Was willst du tun?' });
    const tu = async (name) => { await suche.fill(name); await p.getByRole('button', { name: new RegExp(name) }).first().click(); if (await suche.count()) await suche.fill(''); };

    await p.goto(base + '#/lernen/praxis', { waitUntil: 'networkidle' });
    await p.getByRole('button', { name: 'Neu üben' }).first().click();
    await p.getByRole('radio', { name: /2\. Drittel/ }).check();
    for (const box of await p.locator('.ap-briefing__rolle label').all()) {
      const [r, l] = [await box.locator('input').boundingBox(), await box.boundingBox()];
      assert.ok(r && l && r.width <= 26 && r.x - l.x < 4, `${w}: Radio-Knopf steht links im Rahmen`);
    }
    await axe('briefing');
    await p.getByRole('button', { name: 'Fall beginnen' }).click();
    await p.getByRole('button', { name: 'Pause' }).click();
    assert.equal(await p.getByRole('tab').count(), 6, 'sechs Reiter');
    assert.match(await p.locator('.ap-wert').first().innerText(), /—/, 'ambulant: zu Beginn nichts gemessen');
    assert.equal(await p.locator('.passt-dazu').isVisible(), false, '„Passt dazu“ im laufenden Fall ausgeblendet');
    if (w < 768) assert.equal(await p.locator('.shell__tabbar').isVisible(), false, 'iPhone: nur die Reiterleiste unten');
    await axe('start');

    await tu('Nach Sturz auf Verletzungen');
    await tu('Mundschleimhaut');
    await tu('Nach Trinkmenge');
    await tu('Sitzend sichern');
    // Gerät fehlt: Zeile öffnet die Pflegetasche statt zu messen
    await suche.fill('Blutdruck messen');
    await p.getByRole('button', { name: /Blutdruck messen.*erst aus der Pflegetasche/ }).click();
    const tasche = p.getByRole('dialog', { name: 'Pflegetasche' });
    await tasche.waitFor();
    await axe('pflegetasche');
    await tasche.getByRole('button', { name: 'Herausholen' }).first().click();
    await tasche.getByRole('button', { name: 'Herausholen' }).first().click();
    await tasche.getByRole('button', { name: 'Schließen' }).click();
    await suche.fill('');
    await tu('Pulsoxymeter anlegen');
    await tu('Blutdruck messen');
    assert.match(await p.locator('.ap-bett').innerText(), /SpO₂ \d+ · P \d+/, 'Pulsoxy-Anzeige am Bett');
    assert.doesNotMatch(await p.locator('.ap-wert').nth(2).innerText(), /—/, 'RR nach dem Messen sichtbar');

    await p.getByRole('tab', { name: /Melden/ }).click();
    for (const t of [/am Boden sitzend/, /Herzinsuffizienz, nimmt/, /RR 98\/58/, /Zeitlich und örtlich/, /Bitte kommen Sie/]) await p.getByRole('checkbox', { name: t }).check();
    await p.getByRole('button', { name: /anrufen$/ }).click();
    await p.getByRole('button', { name: 'Rücklesen und bestätigen' }).first().waitFor();
    await axe('anordnung');
    while (await p.getByRole('button', { name: 'Rücklesen und bestätigen' }).count()) await p.getByRole('button', { name: 'Rücklesen und bestätigen' }).first().click();
    if (await p.getByText('Entscheidungsmoment').count()) { await axe('entscheidung'); await p.getByRole('button', { name: /Ruhig auf sie eingehen/ }).click(); }
    await tu('Trinken anbieten');
    await tu('Pflegebericht');

    await p.getByRole('heading', { name: 'Pflegebedarf festhalten' }).waitFor();
    await axe('abschluss');
    await p.getByRole('checkbox', { name: /Flüssigkeitsdefizit/ }).check();
    await p.getByRole('button', { name: 'Abschließen' }).click();
    await p.getByRole('heading', { name: 'Pflichthandlungen' }).waitFor();
    assert.ok(await p.locator('.ap-ende__liste li.is-ok').count() >= 7, 'Musterweg erfüllt die meisten Pflichthandlungen');
    await axe('ende');
    await ctx.close();
  }
} finally { await browser.close(); }
assert.deepEqual(fehler, [], 'Arbeitsplatz');
console.log('Arbeitsplatz: Pilotfall bei 390, 820 und 1180 px durchgespielt, axe WCAG 2.2 AA in 7 Zuständen ohne Befund.');
