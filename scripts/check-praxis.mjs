import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const base = (process.env.UI_BASE_URL || 'http://127.0.0.1:5187/').replace(/\/?$/, '/');
const output = path.resolve(process.env.UI_ARTIFACT_DIR || '.ui-check/praxis');
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}), headless: true });
const errors = []; const audits = [];
try {
  for (const width of [390, 820, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 1050 }, locale: 'de-DE', colorScheme: 'light', acceptDownloads: true });
    const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message));
    await page.goto(base + '#/lernen/praxis', { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Praxissimulator', exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Schicht übernehmen', exact: true }).count(), 17);
    assert.equal(await page.locator('.praxis-scenario__tiefe').count(), 17, 'Falltiefe vor dem Start auf jeder Karte');
    assert.match(await page.locator('.praxis-scenario', { hasText: 'Atemnot in der Nacht' }).locator('.praxis-scenario__tiefe').textContent(), /Bewertungskriteri/);
    const audit = async name => {
      await page.waitForTimeout(350); // Wait for the shared theme/button color transitions to settle.
      assert(!(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)), `${name} overflow @${width}`);
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      audits.push({ width, name, violations: axe.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ html: n.html, summary: n.failureSummary })) })) });
    };
    await audit('Fallauswahl'); await page.screenshot({ path: path.join(output, `auswahl-${width}.png`), fullPage: true });
    await page.getByLabel('Einrichtung').selectOption('kern');
    assert.equal(await page.locator('.praxis-kernmarke').count(), 3, 'drei Kernfälle');
    await page.getByLabel('Einrichtung').selectOption('station');
    await page.locator('.praxis-scenario', { hasText: 'Atemnot in der Nacht' }).getByRole('button', { name: 'Schicht übernehmen', exact: true }).click();
    assert(await page.getByText('Noch keine Messung', { exact: true }).isVisible());
    // Raumelemente: Antippen zeigt den ersten Blick (ohne Zeitverbrauch) und die Handlungen dort.
    assert(await page.locator('.praxis-element .praxis-blick').textContent().then(t => /Erster Blick: wach und ansprechbar, atmet sichtbar schnell/.test(t ?? '')));
    assert.equal(await page.locator('.praxis-clock strong').textContent(), '00:00:00', 'Hinsehen kostet keine Zeit');
    // Fotoansicht (Standard): Raumfoto zum Fall, ohne Monitoring die Variante ohne Gerät, Hotspots und Atemring.
    await page.locator('.szene--foto .raum-buehne__bild').waitFor();
    assert(/12a_station_kardiologie_ohne_monitor/.test(await page.locator('.szene--foto .raum-buehne__bild').getAttribute('src') ?? ''), 'Raum ohne Monitor vor dem Anschließen');
    assert.equal(await page.locator('.szene--foto .raum-hotspot').count(), 4);
    assert.equal(await page.locator('.szene__orte .praxis-hotspot').count(), 4);
    assert.equal(await page.locator('.szene--foto .foto__atem').count(), 1, 'Atemring am Patienten');
    await page.getByRole('button', { name: /^Monitor und Messgeräte/ }).click();
    await page.getByRole('button', { name: /Vitalparameter einschließlich BZ messen/ }).click();
    assert(await page.getByText('Letzte Messung · 00:01:00', { exact: true }).isVisible());
    assert.equal(await page.locator('.foto__taetigkeit').count(), 1, 'Messen zeigt die Tätigkeit im Foto');
    // Dein Auftrag: erster Schritt erledigt, Handlung ist der aktuelle Schritt.
    assert(await page.locator('.praxis-auftrag li.is-erledigt', { hasText: 'Erster Blick' }).isVisible(), 'Auftrag: erster Blick erledigt');
    assert(await page.locator('.praxis-auftrag li[aria-current="step"]', { hasText: 'Handlung auswählen' }).isVisible(), 'Auftrag: nächster Schritt');
    // Zeichnung: Patient, Pflegekraft und Orte als Knöpfe; Handlungen bewegen die Pflegekraft.
    await page.getByRole('button', { name: 'Zeichnung', exact: true }).click();
    assert(await page.locator('.szene .szene__pflege').count() === 1, 'Pflegekraft in der Szene');
    assert(await page.locator('.szene .szene__brust').count() >= 1, 'Patient atmet');
    assert.equal(await page.locator('.szene__arbeit').count(), 1, 'Messen zeigt die Arbeitsanimation');
    await audit('Zeichnung');
    await page.getByRole('button', { name: 'Foto', exact: true }).click();
    // Lernclip am Materialwagen: Dialog mit Video/Phasen, verändert den Fall nicht.
    const uhrVorClip = await page.locator('.praxis-clock strong').textContent();
    await page.getByRole('button', { name: /^Materialwagen/ }).click();
    await page.locator('.praxis-lernclips button', { hasText: 'Kompressionsstrumpf' }).click();
    await page.locator('dialog.hvideo[open]').waitFor();
    assert(await page.locator('dialog.hvideo video, dialog.hvideo img').count() >= 1, 'Clip zeigt Video oder Phasenbild');
    // Medienstart nur auf Knopfdruck, Fortschritt getrennt von der Handlung im Fall.
    if (await page.locator('dialog.hvideo video').count()) {
      assert(await page.locator('dialog.hvideo video').evaluate(v => v.paused && !v.autoplay), 'Video startet nicht von selbst');
      assert(await page.locator('dialog.hvideo').getByRole('button', { name: 'Video abspielen' }).isVisible(), 'eigener Startknopf');
    }
    assert(await page.locator('dialog.hvideo .hvideo__nur').isVisible(), 'Lernclip ohne Fallhandlung');
    assert(await page.locator('dialog.hvideo .freigabe-ort').isVisible(), 'Prüfstatus am Clip');
    await page.getByRole('button', { name: /Zwischenzustand/ }).click();
    assert(await page.locator('dialog.hvideo img[alt^="Phase 3 von 4"]').isVisible(), 'Phasenbild 3');
    assert.match(await page.locator('dialog.hvideo .hvideo__status').textContent(), /Schritt 3 von 4/);
    await page.locator('dialog.hvideo').getByRole('button', { name: 'Weiter', exact: true }).click();
    assert.match(await page.locator('dialog.hvideo .hvideo__text h3').textContent(), /Endzustand/);
    await audit('Lernclip');
    await page.locator('dialog.hvideo').getByRole('button', { name: 'Schließen', exact: true }).click();
    assert.equal(await page.locator('dialog.hvideo[open]').count(), 0);
    assert.equal(await page.locator('.praxis-clock strong').textContent(), uhrVorClip, 'Clip kostet keine Zeit');
    await page.getByRole('button', { name: /^Stationstelefon/ }).click();
    await page.getByRole('button', { name: /Qualifiziertes Team hinzuziehen/ }).click();
    await page.getByRole('button', { name: /Ärztliche Rücksprache und Anordnung/ }).click();
    // Gleichwertige Liste: alle vier Elemente mit denselben Handlungen.
    await page.getByRole('button', { name: 'Liste', exact: true }).click();
    assert.equal(await page.locator('.praxis-liste h4').count(), 4);
    assert.equal(await page.locator('.praxis-liste .praxis-actions button').count(), await page.evaluate(() => JSON.parse(localStorage.getItem('lernstoff.praxis.aktuell')).scenario.actions.length));
    await audit('Raumliste');
    await page.getByRole('button', { name: 'Foto', exact: true }).click();
    await page.getByRole('button', { name: '+5 Minuten', exact: true }).click();
    assert(await page.locator('.praxis-news2 strong').first().textContent().then(t => /NEWS2 \d+/.test(t ?? '')));
    await page.getByRole('button', { name: 'Vitalkurve', exact: true }).click();
    assert(await page.getByRole('heading', { name: 'Verlauf der Messungen' }).isVisible());
    await audit('Vitalkurve');
    await page.getByRole('button', { name: 'Patientenzimmer', exact: true }).click();
    await audit('Patientenzimmer'); await page.screenshot({ path: path.join(output, `zimmer-${width}.png`), fullPage: true });
    await page.getByRole('button', { name: 'Medikation', exact: true }).click();
    await page.getByLabel('Dosis (mg)', { exact: true }).fill('40');
    await page.getByLabel('Aufzuziehendes Volumen (ml)', { exact: true }).fill('40');
    await page.locator('.praxis-med select').nth(0).selectOption('i.v.');
    await page.getByLabel('Applikationsdauer (Minuten)', { exact: true }).fill('10');
    await page.getByLabel('Zubehör').selectOption('Spritze und i.v.-Zugang');
    const med = page.locator('.praxis-med'); for (const box of await med.getByRole('checkbox').all()) await box.check();
    await page.getByRole('button', { name: 'Geprüfte Gabe durchführen', exact: true }).click();
    assert(await page.getByText('Medikationsfehler abgefangen', { exact: true }).isVisible());
    await page.getByLabel('Aufzuziehendes Volumen (ml)', { exact: true }).fill('4');
    await page.getByRole('button', { name: 'Geprüfte Gabe durchführen', exact: true }).click();
    assert(await page.getByText('Furosemid verabreicht', { exact: true }).isVisible());
    await audit('Medikation');
    // Während der Gabe kommt der Entscheidungsmoment „Zimmernachbar klingelt“: Uhr steht, bis gewählt ist.
    await page.locator('.praxis-decision').waitFor();
    await audit('Entscheidung'); await page.screenshot({ path: path.join(output, `entscheidung-${width}.png`), fullPage: true });
    await page.getByRole('button', { name: /Nachbarn kurz ansprechen/ }).click();
    assert.equal(await page.locator('.praxis-decision').count(), 0);
    await page.getByRole('button', { name: 'Patientenzimmer', exact: true }).click();
    await page.getByRole('button', { name: /^Monitor und Messgeräte/ }).click();
    await page.getByRole('button', { name: /Kontinuierliches Monitoring anschließen/ }).click();
    await page.locator('.szene--foto .raum-monitor .sim-monitor').waitFor();
    assert(/12_station_kardiologie_monitoring/.test(await page.locator('.szene--foto .raum-buehne__bild').getAttribute('src') ?? ''), 'Monitor im Foto nach dem Anschließen');
    assert(await page.locator('.praxis-monitor .sim-monitor').count() === 1, 'Live-Monitor bei Monitoring');
    await page.getByRole('button', { name: 'Dokumentation', exact: true }).click();
    await page.getByLabel('Verlaufsdokumentation', { exact: true }).fill('Patient mit Atemnot. Aufrechte Position unterstützt, ärztliches Team hinzugezogen. Wirkung weiter kontrollieren.');
    await page.getByRole('button', { name: 'Pflegebericht speichern · 1 min', exact: true }).click();
    const fields = page.locator('.praxis-documentation form').last().locator('textarea');
    for (const [index, value] of ['Akute Atemnot', 'Bekannte Herzinsuffizienz', 'Tachypnoe beobachtet', 'Erneute ärztliche Beurteilung erbeten'].entries()) await fields.nth(index).fill(value);
    await page.getByRole('button', { name: 'SBAR übergeben · 1 min', exact: true }).click();
    await page.reload({ waitUntil: 'networkidle' });
    assert(await page.getByRole('button', { name: 'Uhr starten', exact: true }).isVisible());
    await page.getByRole('button', { name: 'Patientenakte', exact: true }).click();
    assert(await page.getByText('Penicillin', { exact: true }).isVisible());
    await audit('Patientenakte');
    const requests = []; await page.route('**/*', route => { requests.push(route.request().url()); return route.abort(); });
    await page.getByRole('button', { name: '+5 Minuten', exact: true }).click();
    assert.equal(requests.length, 0, 'Engine arbeitet ohne Netzwerk'); await page.unroute('**/*');
    await page.getByRole('button', { name: 'Fall abschließen', exact: true }).click();
    assert(await page.getByRole('heading', { name: 'Deine Entscheidungen im Rückblick' }).isVisible());
    assert(await page.getByRole('heading', { name: 'Klinischer Verlauf' }).isVisible());
    assert(await page.getByRole('heading', { name: 'Deine Entscheidungen', exact: true }).isVisible());
    assert(await page.getByRole('heading', { name: 'Weiterlernen zu diesem Fall' }).isVisible());
    assert(await page.getByRole('heading', { name: 'Beobachtung → Entscheidung' }).isVisible());
    assert(await page.getByRole('heading', { name: 'SBAR-Inhalt' }).isVisible());
    assert(await page.locator('.praxis-criteria .praxis-pruefart', { hasText: 'Geprüft: nur Vorliegen' }).first().isVisible());
    await page.getByRole('button', { name: 'Replay prüfen', exact: true }).click();
    assert(await page.getByText('Replay geprüft: Zustand und Verlauf stimmen vollständig überein.', { exact: true }).isVisible());
    await audit('Debriefing'); await page.screenshot({ path: path.join(output, `debrief-${width}.png`), fullPage: true });
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Verlauf exportieren', exact: true }).click();
    const downloaded = await downloadPromise; const file = path.join(output, `verlauf-${width}.json`); await downloaded.saveAs(file);
    assert.equal(JSON.parse(fs.readFileSync(file, 'utf8')).phase, 'finished');
    await page.getByRole('button', { name: 'Zur Fallauswahl', exact: true }).click();
    // Schichtmodus: zwei Kinder, eine Uhr.
    await page.locator('.praxis-schichtwahl__eintrag', { hasText: 'Kinderstation' }).getByRole('button', { name: 'Schicht beginnen', exact: true }).click();
    await page.getByRole('heading', { name: 'Kinderstation am Nachmittag', exact: true }).waitFor();
    await page.getByRole('button', { name: /^Monitor und Messgeräte/ }).click();
    await page.getByRole('button', { name: /Vitalparameter einschließlich BZ messen/ }).click();
    await page.locator('.praxis-patient').nth(1).click();
    assert.equal(await page.getByText('Du bist hier', { exact: true }).count(), 1);
    assert(await page.locator('.praxis-clock strong').textContent().then(t => t === '00:01:45'), 'Wegezeit zählt');
    await page.getByRole('button', { name: '+5 Minuten', exact: true }).click();
    await page.locator('.praxis-decision').waitFor();
    await audit('Schicht'); await page.screenshot({ path: path.join(output, `schicht-${width}.png`), fullPage: true });
    await page.getByRole('button', { name: /Das Spray wirkt heute nicht genug/ }).click();
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Kinderstation am Nachmittag', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Schicht beenden', exact: true }).click();
    await page.getByRole('heading', { name: 'Wie lief deine Schicht?' }).waitFor();
    await audit('Schichtauswertung'); await page.screenshot({ path: path.join(output, `schicht-auswertung-${width}.png`), fullPage: true });
    await page.getByRole('button', { name: 'Zur Fallauswahl', exact: true }).click();
    await page.locator('.praxis-editor summary').click();
    await page.getByLabel('Vorlage').selectOption('hausbesuch');
    await page.getByRole('button', { name: 'Eigenes Szenario testen', exact: true }).click();
    assert(await page.getByRole('heading', { name: 'Die Wohnung ist heute ungewohnt still', exact: true }).isVisible());
    await page.emulateMedia({ colorScheme: 'dark' }); await audit('Dunkler Modus');
    await page.screenshot({ path: path.join(output, `dark-${width}.png`), fullPage: true });
    await page.goto(base + '#/lernen/fall', { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Fallbeispiel-Simulator', exact: true }).waitFor();
    // Probefall ohne KI: Szene und Monitor laufen, eine Entscheidung bewegt Figur und Werte
    // Offline-Paket: erst Ersatzansicht, nach dem Laden vollständig
    const ersterProbefall = page.locator('.fall__probe-liste li').first();
    await ersterProbefall.getByText('Offline mit Ersatzansicht').waitFor();
    await ersterProbefall.getByRole('button', { name: 'Für offline laden' }).click();
    await ersterProbefall.getByText('Offline vollständig').waitFor({ timeout: 20000 });
    await page.getByRole('button', { name: 'Probefall starten: Atemnot in der Nacht', exact: true }).click();
    await page.locator('.fall__option').first().waitFor();
    // Fotoraum (Kardiologie): vor der Messung Variante ohne Monitor, danach Live-Monitor im Bild
    await page.locator('.fall__foto img[src*="12a_station"]').waitFor();
    assert(await page.locator('.fall__buehne > .sim-monitor.is-aus').isVisible());
    await page.getByRole('button', { name: /messe Blutdruck/ }).click();
    await page.locator('.fall__buehne > .sim-monitor:not(.is-aus)').waitFor();
    await page.locator('.fall__foto img[src*="12_station_kardiologie_monitoring"]').waitFor();
    assert(await page.locator('.fall__foto .raum-monitor .sim-monitor').isVisible());
    await page.locator('.fall__option').first().waitFor();
    await page.getByRole('button', { name: '1: Herr K. ansehen' }).click();
    await page.getByRole('region', { name: /^1: Patient/ }).waitFor();
    assert(await page.getByRole('button', { name: 'Lunge abhören' }).isVisible(), 'Abhören am Patienten');
    await page.getByRole('button', { name: 'Übergabe', exact: true }).click();
    assert(await page.getByRole('button', { name: /^Ich übergebe nach SBAR/ }).isVisible());
    await page.waitForTimeout(3000); // Untertitel blendet Wort für Wort ein, erst danach Kontrast messen
    await audit('Fallsimulator Probefall'); await page.screenshot({ path: path.join(output, `fall-probe-${width}.png`), fullPage: true });
    // Umschalten auf die gezeichnete Szene und zurück
    await page.getByRole('button', { name: 'Gezeichnete Ansicht', exact: true }).click();
    assert(await page.locator('.szene svg').isVisible());
    await page.getByRole('button', { name: 'Fotoansicht', exact: true }).click();
    await page.locator('.fall__foto img').waitFor();
    // Zweiter Probefall mit Verzweigung bis zur Auswertung und zum Rückblick
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: 'Abbrechen', exact: true }).click();
    await page.getByRole('button', { name: 'Probefall starten: Der Verband wird rot', exact: true }).click();
    await page.locator('.fall__foto img[src*="13_station_postop"]').waitFor();
    await page.getByRole('button', { name: /zweite Decke/ }).click();
    await page.getByText(/kaltschweißig/).first().waitFor();
    for (let i = 0; i < 6; i++) {
      if (await page.getByRole('button', { name: 'Auswertung ansehen', exact: true }).isVisible()) break;
      await page.locator('.fall__option').first().click();
      await page.waitForFunction(() => !document.querySelector('.fall__laedt'));
    }
    await page.getByRole('button', { name: 'Auswertung ansehen', exact: true }).click();
    await page.getByRole('heading', { name: 'Rückblick: Szene für Szene' }).waitFor();
    await page.getByRole('button', { name: /^Szene 2,/ }).click();
    assert(await page.locator('.fall__rueckblick .fall__rb-eingabe').isVisible(), 'Rückblick zeigt Entscheidung');
    await page.waitForTimeout(600);
    await audit('Fallsimulator Rückblick'); await page.screenshot({ path: path.join(output, `fall-rueckblick-${width}.png`), fullPage: true });
    assert(await page.getByRole('heading', { name: 'Weiterlernen' }).isVisible(), 'Rückweg zu Theorie');
    await context.close();
    // Fehlendes Medium: Raumfoto blockiert (ohne Service Worker, damit die Sperre greift) → gezeichnete Ersatzansicht
    {
      const ctx = await browser.newContext({ viewport: { width, height: 1050 }, locale: 'de-DE', colorScheme: 'light', serviceWorkers: 'block' });
      const p2 = await ctx.newPage(); p2.on('pageerror', e => errors.push(e.message));
      await p2.route('**/raeume/21*', (r) => r.abort());
      await p2.goto(base + '#/lernen/fall', { waitUntil: 'networkidle' });
      await p2.getByRole('button', { name: 'Probefall starten: Das Spray hilft heute nicht', exact: true }).click();
      await p2.locator('.szene svg').waitFor();
      await p2.getByText(/gezeichnete Ersatzansicht/).waitFor();
      // Freigabe (SIM-02): Lernziele am Start, Kennzeichnung am Entscheidungsort, Kinder-Monitor ohne Alarmwertung
      await p2.getByRole('region', { name: 'Lernziele und fachlicher Prüfstand' }).waitFor();
      await p2.locator('.fall__eingabe .freigabe-ort', { hasText: 'Fachlich ungeprüft' }).waitFor();
      assert.equal(await p2.locator('.sim-monitor.is-alarm-rot').count(), 0);
      await ctx.close();
    }
    // Notfall-Trainer: Reanimationsübung mit künstlicher Uhr (Zyklus 30 s ohne Warten).
    {
      const ctx = await browser.newContext({ viewport: { width, height: 1050 }, locale: 'de-DE', colorScheme: 'light' });
      const rea = await ctx.newPage(); rea.on('pageerror', e => errors.push(e.message));
      await rea.clock.install();
      await rea.goto(base + '#/lernen/notfall?modus=rea', { waitUntil: 'networkidle' });
      await rea.getByRole('button', { name: 'Übung starten', exact: true }).click();
      for (const l of [/^Laut ansprechen/, /^Laut um Hilfe/, /^Atemwege frei/, /^Reanimationsteam/]) await rea.getByRole('button', { name: l }).click();
      await rea.getByRole('button', { name: /^Blutdruck messen/ }).click();
      assert(await rea.locator('.rea__meldung.is-falsch').isVisible(), 'Umweg wird erklärt');
      await rea.getByRole('button', { name: /^Sofort mit Thorax/ }).click();
      const druck = rea.getByRole('button', { name: /^Drücken/ });
      for (let i = 0; i < 30; i++) { await druck.click(); await rea.clock.runFor(545); }
      assert(await rea.locator('.rea__rate.is-gut').isVisible(), 'Rate im Zielbereich');
      await rea.getByRole('button', { name: '2 Beatmungen geben', exact: true }).click();
      await rea.clock.runFor(31000);
      await rea.getByRole('button', { name: /^Schockbar/ }).waitFor();
      assert(await rea.locator('.rea-defi canvas').isVisible(), 'Defibrillator im Bild');
      const axe = await new AxeBuilder({ page: rea }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      audits.push({ width, name: 'Reanimation', violations: axe.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ html: n.html, summary: n.failureSummary })) })) });
      await rea.getByRole('button', { name: /^Schockbar/ }).click();
      await rea.clock.runFor(3500);
      await rea.getByRole('button', { name: /Schock auslösen/ }).click();
      assert(await rea.getByText(/Schock 1 abgegeben/).isVisible());
      await rea.getByRole('button', { name: 'Übung beenden', exact: true }).click();
      await rea.locator('.rea__ergebnis').waitFor();
      await rea.screenshot({ path: path.join(output, `rea-${width}.png`), fullPage: true });
      await ctx.close();
    }
  }
  fs.writeFileSync(path.join(output, 'audit.json'), JSON.stringify({ audits, errors }, null, 2));
  console.log(JSON.stringify({ audits: audits.map(x => ({ width: x.width, name: x.name, violations: x.violations.map(v => v.id) })), errors }, null, 2));
  assert.deepEqual(errors, []); assert.deepEqual(audits.flatMap(a => a.violations), []);
} finally { await browser.close(); }
