// Neuer Arbeitsplatz des Praxissimulators (Paket P2, #/lernen/praxis?neu=<fall>): Pilotfall einmal durchspielen
// bei 390 (iPhone), 820 (iPad hoch, „Bewegung reduzieren“) und 1180 px (iPad quer), axe WCAG 2.2 AA je Zustand.
// Prüft: Briefing mit Rolle, Verlauf (P12: Kurve + Journal), Patientenakte (P13: Kurve, Medikation, Anordnungen, Pflegebericht schreiben), Pflegetasche (Gerät holen kostet Zeit, Werte erst nach dem Messen), Befugnis-Abzeichen,
// SBAR → Anordnung → Rücklesen, Abschluss (Pflegebedarf priorisieren, Übergabe) und Auswertung (P5) inkl. Weitergabe
// in den Übergabetrainer; bei 1180 px zusätzlich Spur B (Verdacht, klinische Bereiche).
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
      await p.screenshot({ path: path.join(output, `${w}-${name}.png`), fullPage: name.startsWith('auswertung') });
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
    for (const t of [/am Boden sitzend/, /Herzinsuffizienz, nimmt/, /RR deutlich unter/, /Zeitlich und örtlich/, /Bitte kommen Sie/]) await p.getByRole('checkbox', { name: t }).check();
    await p.getByRole('button', { name: /anrufen$/ }).click();
    await p.getByRole('button', { name: 'Rücklesen und bestätigen' }).first().waitFor();
    await axe('anordnung');
    while (await p.getByRole('button', { name: 'Rücklesen und bestätigen' }).count()) await p.getByRole('button', { name: 'Rücklesen und bestätigen' }).first().click();
    if (await p.getByText('Entscheidungsmoment').count()) { await axe('entscheidung'); await p.getByRole('button', { name: /Ruhig auf sie eingehen/ }).click(); }
    await tu('Trinken anbieten');
    // P12: Verlauf aus der Werteleiste – Kurve mit eigenen Messungen, Journal mit Filter, iPhone als Vollbild
    await p.getByRole('button', { name: /Verlauf: Kurve/ }).click();
    const verlauf = p.getByRole('dialog', { name: /Verlauf/ });
    await verlauf.waitFor();
    assert.ok(await verlauf.locator('.kb-rr').count() >= 1, `${w}: RR als Pfeil in der Kurve`);
    assert.ok(await verlauf.locator('.vl-journal li').count() >= 8, `${w}: Journal mit Einträgen`);
    if (w < 768) { await p.waitForTimeout(400); const b = await verlauf.boundingBox(); assert.ok(b && b.width >= w - 20 && b.height >= 800, `${w}: Verlauf als Vollbild ${JSON.stringify(b)}`); }
    await verlauf.getByRole('button', { name: /Meine Handlungen/ }).click();
    assert.equal(await verlauf.locator('.vl-journal li:not(.is-handlung)').count(), 0, `${w}: Filter Meine Handlungen`);
    await verlauf.getByRole('button', { name: /^Alles/ }).click();
    await axe('verlauf');
    await verlauf.getByRole('button', { name: 'Schließen' }).click();
    await verlauf.waitFor({ state: 'hidden' });

    // Patientenakte (P13): Kopfzeilen-Knopf, Uhr steht, Kurve mit Vorwerten + eigener Messung, Medikation geändert, Anordnung rückgelesen
    await p.getByRole('button', w === 820 ? { name: 'Patientenakte öffnen' } : { name: 'Patientenakte', exact: true }).click();   // iPad hoch: über den Hotspot im Foto
    const akte = p.getByRole('dialog', { name: /Frau Lindner/ });
    await akte.waitFor();
    await axe('akte-ueberblick');
    await akte.getByRole('tab', { name: 'Kurve' }).click();
    assert.ok(await akte.locator('.akte-kurve thead th').count() >= 5, `${w}: Kurve mit Vorwerten und eigener Messung`);
    await axe('akte-kurve');
    await akte.getByRole('tab', { name: 'Medikation' }).click();
    assert.match(await akte.locator('.akte-med tr.is-geaendert').innerText(), /Torasemid/, `${w}: Torasemid durch Anordnung geändert`);
    await axe('akte-medikation');
    await akte.getByRole('tab', { name: 'Anordnungen' }).click();
    assert.match(await akte.innerText(), /vorgelesen und bestätigt/, `${w}: mündliche Anordnung mit Rücklese-Vermerk`);
    await akte.getByRole('button', { name: 'Schließen' }).click();
    // „Pflegebericht schreiben“ öffnet die Akte beim Bericht; Eintrag aus Bausteinen beendet den Fall wie bisher
    await suche.fill('Pflegebericht');
    await p.getByRole('button', { name: /Pflegebericht/ }).first().click();
    await akte.getByRole('heading', { name: 'Eintrag schreiben' }).waitFor();
    await akte.getByRole('checkbox', { name: /^RR \d+\/\d+ mmHg/ }).check();
    await akte.getByRole('checkbox', { name: /Exsikkose/ }).check();
    await axe('akte-bericht');
    await akte.getByRole('button', { name: 'Eintrag speichern' }).click();

    await p.getByRole('heading', { name: 'Fall abschließen' }).waitFor();
    for (const t of [/Erhöhtes Sturzrisiko/, /Flüssigkeitsdefizit/, /Akute Verwirrtheit/]) await p.getByRole('checkbox', { name: t }).check();
    // Priorisieren: Sturzrisiko (Prio 2) steht oben und wird zweimal nach unten geschoben
    await p.getByRole('button', { name: /Erhöhtes Sturzrisiko.* nach unten/ }).click();
    await p.getByRole('button', { name: /Erhöhtes Sturzrisiko.* nach unten/ }).click();
    assert.match(await p.locator('.ap-reihenfolge li').last().innerText(), /Sturzrisiko/, 'Reihenfolge änderbar');
    for (const t of [/mindestens 1,5 l/, /Hausnotruf am Handgelenk/]) await p.getByRole('checkbox', { name: t }).check();
    for (const t of [/am Boden sitzend/, /Herzinsuffizienz, nimmt/, /Zeitlich und örtlich/]) await p.locator('.ap-uebergabe').getByRole('checkbox', { name: t }).check();
    await axe('abschluss');
    await p.getByRole('button', { name: 'Abschließen und auswerten' }).click();
    await p.getByRole('heading', { name: 'Kompetenzbereiche (PflAPrV)' }).waitFor();
    assert.equal(await p.locator('.ap-bereiche li').count(), 5, 'fünf Kompetenzbereiche');
    assert.match(await p.locator('.ap-gesamt__zahl').innerText(), /\d+ %/, 'Gesamtwert');
    assert.ok(await p.locator('.sim-auswertung__punkte li').count() >= 8, 'AuswertungsKarte mit Punkten');
    assert.ok(await p.locator('.ap-zl__reihe').count() >= 5, 'Zeitleiste mit Handlungen und Werten');
    assert.equal(await p.locator('.ap-leitfaden details').count(), 5, 'Leitfaden (4 Abschnitte + Quellen)');
    await axe('auswertung');
    if (w === 1180) {
      // Weitergabe: Übergabetrainer übernimmt den gespielten Fall
      await p.getByRole('link', { name: 'Übergabe an den Folgedienst' }).click();
      await p.locator('option[value="praxis-neu-amb-sturz-exsikkose"]').waitFor({ state: 'attached' });
      assert.equal(await p.getByText('nicht mehr gespeichert').count(), 0, 'Fall für die Übergabe gefunden');
      await p.goBack();
      // Spur B: sofort abschließen, Verdacht wählen, klinische Bereiche und verpasste kritische Pflichthandlungen
      await p.goto(base + '#/lernen/praxis?neu=sr-septischer-schock', { waitUntil: 'networkidle' });
      await p.getByRole('button', { name: /Neu beginnen|Fall beginnen/ }).click();
      await p.getByRole('button', { name: 'Pause' }).click();
      await p.getByRole('tab', { name: /Melden/ }).click();
      await p.getByRole('button', { name: /Fall abschließen/ }).click();
      await p.getByRole('radio', { name: /Septischer Schock/ }).check();
      await p.getByRole('checkbox', { name: /trüber Urin/ }).check();
      await axe('abschluss-b');
      await p.getByRole('button', { name: 'Abschließen und auswerten' }).click();
      await p.getByRole('heading', { name: 'Klinische Bereiche (Spur B)' }).waitFor();
      assert.ok(await p.locator('.ap-kritisch li').count() >= 3, 'verpasste kritische Pflichthandlungen deutlich');
      await axe('auswertung-b');
    }

    // Pilotstaffel Spur A (P6): jeder Fall startet, Team-Leiste zeigt die Kollegin, Raumfoto da, axe ohne Befund
    for (const [id, kollegin] of [['kh-pneumonie-sepsis', /Jonas/], ['lz-demenz-schmerz', /Sabine/], ['paed-fieberkrampf', /Tim/], ['psy-panik-suizidalitaet', /Deniz/]]) {
      await p.goto(base + `#/lernen/praxis?neu=${id}`, { waitUntil: 'networkidle' });
      await p.getByRole('button', { name: 'Fall beginnen' }).click();
      await p.getByRole('button', { name: 'Pause' }).click();
      assert.match(await p.locator('.ap-team').innerText(), kollegin, `${w} ${id}: Kollegin in der Team-Leiste`);
      assert.equal(await p.getByRole('tab').count(), 6, `${w} ${id}: sechs Reiter`);
      await axe(`start-${id}`);
    }
    await ctx.close();
  }
} finally { await browser.close(); }
assert.deepEqual(fehler, [], 'Arbeitsplatz');
console.log('Arbeitsplatz: Pilotfall bei 390, 820 und 1180 px durchgespielt, Pilotstaffel Spur A gestartet, axe WCAG 2.2 AA ohne Befund (inkl. Abschluss, Auswertung, Spur B).');
