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
    // SIM-07: einheitliche Zustandstafel zeigt den angeschlossenen Monitor und alle fünf Bereiche.
    await page.locator('.sim-zustand summary').click();
    assert.equal(await page.locator('.sim-zustand__bereich').count(), 5, 'Zustandstafel mit fünf Bereichen');
    assert.match(await page.locator('.sim-zustand__bereich[aria-label="Geräte"]').textContent(), /Monitor\s*läuft/);
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
      // Freigabe (SIM-02): Lernziele am Start, Kennzeichnung am Entscheidungsort, Monitor mit Kinderprofil
      await p2.getByRole('region', { name: 'Lernziele und fachlicher Prüfstand' }).waitFor();
      await p2.locator('.fall__eingabe .freigabe-ort', { hasText: 'Fachlich ungeprüft' }).waitFor();
      await p2.locator('.sim-monitor__profil', { hasText: 'Kind 6–13' }).first().waitFor();
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
      // Profil Neugeborene: eigener Ablauf (Wärme, Blähen, Beatmen), 3:1 im Takt, Herzfrequenz statt Defi.
      await rea.getByRole('button', { name: 'Anderes Szenario', exact: true }).click();
      await rea.getByRole('radio', { name: /^Neugeborene/ }).check();
      assert(await rea.getByRole('region', { name: 'Lernziele und fachlicher Prüfstand' }).isVisible(), 'Freigabe je Profil am Start');
      assert.match(await rea.locator('.rea__leitlinie').textContent(), /Newborn.*2021/);
      await rea.getByRole('button', { name: 'Übung starten', exact: true }).click();
      await rea.getByRole('button', { name: /^Sofort mit Kompressionen/ }).click();
      assert(await rea.locator('.rea__meldung.is-falsch').isVisible(), 'Neugeborenes: erst beatmen');
      for (const l of [/^Abtrocknen/, /^Muskeltonus/, /^Kopf in Neutral/, /^5 Blähbeatmungen/, /^Brustkorbhebung/, /^Thoraxkompressionen 3:1/]) await rea.getByRole('button', { name: l }).click();
      assert(await rea.locator('.rea-nls').isVisible(), 'Reanimationseinheit als Zeichnung');
      for (let z = 0; z < 6; z++) {
        for (let i = 0; i < 3; i++) { await rea.getByRole('button', { name: /^Drücken/ }).click(); await rea.clock.runFor(500); }
        await rea.getByRole('button', { name: 'Beatmen', exact: true }).click(); await rea.clock.runFor(500);
      }
      assert(await rea.locator('.rea__rate.is-gut').isVisible(), '3:1 mit etwa 120 Ereignissen/min im Ziel');
      await rea.clock.runFor(31000);
      await rea.getByRole('button', { name: /^Unter 60\/min/ }).waitFor();
      assert(await rea.locator('.rea-defi.is-monitor').isVisible(), 'Monitor zeigt Herzfrequenz');
      assert(await rea.locator('.rea__schritte .freigabe-ort').isVisible(), 'Prüfstatus am Entscheidungsort');
      const axeNeu = await new AxeBuilder({ page: rea }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      audits.push({ width, name: 'Reanimation Neugeborene', violations: axeNeu.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ html: n.html, summary: n.failureSummary })) })) });
      await rea.getByRole('button', { name: /^Unter 60\/min/ }).click();
      assert(await rea.getByText(/Adrenalin 20 µg\/kg/).count() === 0, 'Adrenalin erst nach der zweiten Kontrolle');
      await ctx.close();
    }
    // Assessment: Steckbrief, fehlende Angaben, Score getrennt von der pflegerischen Beurteilung.
    {
      const ctx = await browser.newContext({ viewport: { width, height: 1050 }, locale: 'de-DE', colorScheme: 'light' });
      const as = await ctx.newPage(); as.on('pageerror', e => errors.push(e.message));
      await as.goto(base + '#/lernen/assessment?gruppe=braden&modus=rechner', { waitUntil: 'networkidle' });
      await as.locator('.as__steckbrief summary').click();
      assert.match(await as.locator('.as__steckbrief').textContent(), /Bergstrom.*1987/);
      assert.match(await as.locator('.as__fehlend').textContent(), /Fehlende Angaben \(6\)/);
      for (const g of await as.getByRole('radiogroup').all()) { await g.getByRole('radio').first().focus(); await as.keyboard.press('Space'); } // Tastatur: die Schnellleiste liegt am Telefon über dem Formular
      assert.match(await as.locator('.as__ergebnis .note').first().textContent(), /Sehr hohes Risiko.*Einstufung laut Skala/);
      assert.match(await as.locator('.as__ergebnis .as__beurteilung').textContent(), /Pflegerische Beurteilung.*Vorschlag, fachlich prüfen/);
      const axe = await new AxeBuilder({ page: as }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      audits.push({ width, name: 'Assessment', violations: axe.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ html: n.html, summary: n.failureSummary })) })) });
      await ctx.close();
    }
    // Pflegebericht: Grundkriterien und Warnung bei echten Personendaten direkt am Feld.
    {
      const ctx = await browser.newContext({ viewport: { width, height: 1050 }, locale: 'de-DE', colorScheme: 'light' });
      const pb = await ctx.newPage(); pb.on('pageerror', e => errors.push(e.message));
      await pb.goto(base + '#/lernen/bericht', { waitUntil: 'networkidle' });
      const feld = pb.getByRole('textbox', { name: 'Berichtseintrag' });
      await feld.fill('Frau Schulze, Zimmer 12, war unruhig.');
      assert.match(await pb.locator('.bericht__eingabe .personen-warnung').textContent(), /Zimmer 12/);
      await feld.fill('2:15 Uhr: steht an der Tür und sagt: „Ich muss nach Hause.“ Warme Milch angeboten. 2:40 Uhr Milch getrunken, geht ins Zimmer.');
      assert.equal(await pb.locator('.bericht__eingabe .personen-warnung').count(), 0, 'Übungstext ohne Warnung');
      await pb.getByRole('button', { name: 'Prüfen', exact: true }).click();
      await pb.locator('.bericht__grund').waitFor();
      assert.equal(await pb.locator('.bericht__grund .is-ok').count(), 4, 'Zeit, Fakten, Maßnahme, Wirkung erkannt');
      const axe = await new AxeBuilder({ page: pb }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      audits.push({ width, name: 'Pflegebericht', violations: axe.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ html: n.html, summary: n.failureSummary })) })) });
      await ctx.close();
    }
    // SIS: Versorgungsbereich und Formularfassung, Eigenperspektive getrennt von Fallinformation, Personendaten-Warnung.
    {
      const ctx = await browser.newContext({ viewport: { width, height: 1050 }, locale: 'de-DE', colorScheme: 'light' });
      const sis = await ctx.newPage(); sis.on('pageerror', e => errors.push(e.message));
      await sis.goto(base + '#/lernen/sis', { waitUntil: 'networkidle' });
      assert.match(await sis.locator('.sis__fassung').textContent(), /Versorgungsbereich.*Formular.*SIS® (stationär|ambulant)/);
      assert(await sis.locator('.sis__block--eigen summary', { hasText: 'Eigenperspektive' }).isVisible());
      assert(await sis.locator('.sis__block--fall summary', { hasText: 'Fallinformation' }).first().isVisible());
      await sis.locator('.sis__panel textarea').first().fill('„Ich will nach Hause.“ Frau Petersen, Zimmer 4');
      assert.match(await sis.locator('.personen-warnung').first().textContent(), /Zimmer 4/);
      const axe = await new AxeBuilder({ page: sis }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      audits.push({ width, name: 'SIS', violations: axe.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ html: n.html, summary: n.failureSummary })) })) });
      await ctx.close();
    }
    // Pflegeplanung: Raster vor der Prüfung und im Ergebnis, Personendaten-Warnung am Feld, KI getrennt.
    {
      const ctx = await browser.newContext({ viewport: { width, height: 1050 }, locale: 'de-DE', colorScheme: 'light' });
      const pp = await ctx.newPage(); pp.on('pageerror', e => errors.push(e.message));
      await pp.goto(base + '#/lernen/pflegeplanung', { waitUntil: 'networkidle' });
      await pp.locator('.pp__rastervorab summary').click();
      assert.match(await pp.locator('.pp__rastervorab').textContent(), /Problem.*Ressourcen.*Ziel.*Maßnahme.*Evaluation/s);
      await pp.locator('.pp__eingabe textarea').first().fill('Herr Krause aus Zimmer 4 sagt, er hat Schmerzen.');
      assert.match(await pp.locator('.pp__eingabe .personen-warnung').textContent(), /Zimmer 4/);
      await pp.getByRole('button', { name: 'Jetzt auswerten' }).click();
      await pp.locator('.pp__raster').waitFor();
      assert.equal(await pp.locator('.pp__rasterzeile').count(), 5);
      assert.match(await pp.locator('.pp__ergebnis h3').textContent(), /Code-Prüfung/);
      const axe = await new AxeBuilder({ page: pp }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      audits.push({ width, name: 'Pflegeplanung', violations: axe.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ html: n.html, summary: n.failureSummary })) })) });
      await ctx.close();
    }
    // Übergabe: gemeinsame SBAR-Grundkriterien mit Rufanlass aus den Fallereignissen.
    {
      const ctx = await browser.newContext({ viewport: { width, height: 1050 }, locale: 'de-DE', colorScheme: 'light' });
      const ue = await ctx.newPage(); ue.on('pageerror', e => errors.push(e.message));
      await ue.goto(base + '#/lernen/uebergabe', { waitUntil: 'networkidle' });
      const felder = ue.locator('.sbar__feld textarea');
      const texte = ['Hier ist Mara, Station 4B, Herr Berger ist neu verwirrt und hat Fieber.', 'Hemikolektomie vor 2 Tagen, Penicillin-Allergie.', 'Temperatur 38,9, Puls 118, RR 92/55. Ich vermute eine Sepsis.', 'Bitte kommen Sie sofort. Soll ich Blutkulturen vorbereiten?'];
      for (let i = 0; i < 4; i++) await felder.nth(i).fill(texte[i]);
      await ue.getByRole('button', { name: 'Prüfen', exact: true }).click();
      await ue.locator('.sbar-grund').waitFor();
      assert.equal(await ue.locator('.sbar-grund__liste li').count(), 6);
      assert.match(await ue.locator('.sbar-grund__anlass').textContent(), /Priorität\s*sofort/);
      const axe = await new AxeBuilder({ page: ue }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      audits.push({ width, name: 'Übergabe', violations: axe.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ html: n.html, summary: n.failureSummary })) })) });
      await ctx.close();
    }
    // Notfall-Trainer: ABCDE-Übung (deterministisch, Zeit nur durch Handlungen).
    {
      const ctx = await browser.newContext({ viewport: { width, height: 1050 }, locale: 'de-DE', colorScheme: 'light' });
      const ab = await ctx.newPage(); ab.on('pageerror', e => errors.push(e.message));
      await ab.goto(base + '#/lernen/notfall?modus=abcde', { waitUntil: 'networkidle' });
      await ab.getByRole('region', { name: 'Lernziele und fachlicher Prüfstand' }).waitFor();
      await ab.getByRole('button', { name: 'Übung starten', exact: true }).click();
      await ab.locator('.abcde__buehne img').first().waitFor();
      await ab.getByRole('button', { name: /^Adrenalin/ }).click();
      assert.match(await ab.locator('.abcde .rea__meldung').textContent(), /Noch nicht möglich/, 'Adrenalin erst nach Alarm');
      await ab.getByRole('button', { name: /^Atemwege/ }).click();
      assert.match(await ab.locator('.abcde .rea__meldung').textContent(), /Stridor/);
      assert.match(await ab.locator('.abcde .rea__chip').first().textContent(), /00:20/, 'Befund kostet Zeit');
      await ab.getByRole('button', { name: /^Notfallteam/ }).click();
      await ab.getByRole('button', { name: /^Infusion sofort stoppen/ }).click();
      assert(await ab.locator('.abcde .freigabe-ort').isVisible(), 'Prüfstatus beim Handeln');
      const axe = await new AxeBuilder({ page: ab }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      audits.push({ width, name: 'ABCDE', violations: axe.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ html: n.html, summary: n.failureSummary })) })) });
      // Auslöser gestoppt, Alarm, Adrenalin: stabilisiert, Auswertung erscheint.
      await ab.getByRole('button', { name: /^Adrenalin/ }).click();
      await ab.locator('.abcde__ergebnis').waitFor();
      assert.match(await ab.locator('.abcde__ergebnis h4').textContent(), /Stabilisiert/);
      assert(await ab.locator('.abcde__bewertung .is-offen').count() >= 1, 'Fehlende Einschätzung wird bewertet');
      await ctx.close();
    }
  }
  fs.writeFileSync(path.join(output, 'audit.json'), JSON.stringify({ audits, errors }, null, 2));
  console.log(JSON.stringify({ audits: audits.map(x => ({ width: x.width, name: x.name, violations: x.violations.map(v => v.id) })), errors }, null, 2));
  assert.deepEqual(errors, []); assert.deepEqual(audits.flatMap(a => a.violations), []);
} finally { await browser.close(); }
