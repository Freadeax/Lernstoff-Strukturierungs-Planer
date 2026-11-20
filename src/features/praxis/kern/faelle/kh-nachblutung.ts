// Fallwelle P16a (CE05 Patientensicherheit) · Krankenhaus, Unfallchirurgie: Nachblutung nach Knie-TEP mit beginnendem Schock
// Entwurf, fachlich UNGEPRÜFT. Inhalte fiktiv/didaktisch. Neu geschrieben aus Altfall „nachblutung“ (scenarios.json).
// Muster: kh-pneumonie-sepsis.ts (Runde 2: Rückfrage, Rückauftrag, Messenger, Angehörige, Akte, Doku-Pflicht).

import { KATALOG } from '../katalog';
import type { ArztRegel, Bedingung, FallV2, MassnahmeDefinition } from '../typen';

const aus = (id: string, mehr: Partial<MassnahmeDefinition>): MassnahmeDefinition => ({ ...KATALOG[id]!, ...mehr });

const RR_BEKANNT: Bedingung = { eine: [{ getan: 'rr-messen' }, { getan: 'monitor-anlegen' }] };
const PULS_BEKANNT: Bedingung = { eine: [{ getan: 'puls-zaehlen' }, { getan: 'pulsoxy-anlegen' }, { getan: 'monitor-anlegen' }] };
const BLUTUNG_GESEHEN: Bedingung = { alle: [{ getan: 'wunde-beurteilen' }, { getan: 'drainagen-beobachten' }] };

const BLUTUNG_ANTWORT = '„Das klingt nach einer Nachblutung mit beginnendem Volumenmangel. Ich komme sofort. Flach hinlegen, Verband mit Druck verstärken und markieren, 500 ml Vollelektrolyt über den liegenden Zugang, ab jetzt nüchtern. Blutbild und Kreuzblut nehme ich selbst ab und rufe den Oberarzt an. Und die Thromboseprophylaxe heute Abend geben Sie ihm bitte noch. Messen Sie zehn Minuten nach Infusionsstart Puls und Blutdruck und schicken Sie mir die Werte über den Messenger.“';
const BLUTUNG_REGEL: ArztRegel = {
  id: 'r-blutung', wenn: { gemeldet: ['a-verband-drainage'] }, antwort: BLUTUNG_ANTWORT,
  anordnungen: ['an-infusion', 'an-nuechtern', 'an-enoxa'], kommtNachSek: 360, setzt: ['arzt-kommt'], auftraege: ['af-kontrolle'],
};

export const KH_NACHBLUTUNG: FallV2 = {
  schema: 2,
  id: 'kh-nachblutung',
  version: '0.1.0',
  spur: 'A',
  setting: 'krankenhaus',
  altersgruppe: 'erwachsen',
  titel: '„Der Verband wird rot“',
  kurz: 'Unfallchirurgie, Spätdienst: 58-Jähriger nach Knie-TEP friert, ihm ist übel, der Verband färbt durch, der Puls steigt.',
  rahmen: 'Du betreust mit deiner Praxisanleitung im Spätdienst Herrn Wendt, der heute Mittag ein neues Kniegelenk bekommen hat.',
  lernziele: [
    'Zeichen einer Nachblutung und eines beginnenden Volumenmangels erkennen (Verband, Drainage, Puls, Haut, Schockindex).',
    'Den Verlauf mit Vorwerten vergleichen und die Dringlichkeit begründen.',
    'Die Ärztin mit SBAR so informieren, dass sie sofort kommt, und Anordnungen rücklesen.',
    'Eine fehlerhafte Anordnung erkennen: Die Thromboseprophylaxe ist heute schon gegeben, eine zweite Gabe bei Blutung gefährdet den Patienten.',
    'Sicher handeln: flach lagern, nicht mobilisieren, Schmerzmittel nicht als Ersatz für das Melden.',
  ],
  lehrplan: {
    ce: ['ce.05'], abschnitt: ['ad12', 'ad3'],
    themen: ['thema.ph.periop', 'thema.ph.wunde', 'thema.beo.vitalzeichen', 'thema.beo.notfall', 'thema.pro.thrombose', 'thema.pp.uebergabe'],
    kompetenzen: ['I.2.a', 'I.2.c', 'II.1.d', 'III.2.b', 'III.2.c', 'IV.1.a'],
  },
  geeignet: { rollen: [1, 2, 3], stufen: [1, 2, 3] },
  dauerMin: [12, 18],
  freigabe: {
    status: 'entwurf',
    pruefpunkte: [
      'Ablauf (Verband/Drainage, Vitalzeichen, Schockindex, Flachlage, Druckverband, Melden, Volumen, nüchtern) gegen Stationsstandard Unfallchirurgie prüfen',
      'Schockindex (Puls/RR systolisch über 1) als Lernhilfe angemessen? Trend wichtiger als Einzelwert',
      'Remonstration Enoxaparin (schon 18 Uhr gegeben, jetzt Blutung) fachlich passend? Fachinformation Enoxaparin 4.4',
      'Befugnis Infusion anhängen (1. Drittel gesperrt, 2./3. mit Anleitung) bestätigen',
      'Lernmodell: Start etwa HF 100–110, RR um 115 systolisch; ohne Hilfe nach 30 Min. RR unter 95 (Test)',
      'Raumfoto 13_station_postop passt (Drainage, Infusionsständer); Verband am Knie ist im Foto nicht zu sehen',
    ],
  },
  quellen: [
    { id: 's3-vte', titel: 'S3-Leitlinie Prophylaxe der venösen Thromboembolie (VTE) (AWMF 003-001), Version 4.0, 2026', fundstelle: 'Medikamentöse Prophylaxe nach Gelenkersatz, Blutungsrisiko' },
    { id: 'fi-enoxaparin', titel: 'Fachinformation Enoxaparin (Clexane)', fundstelle: 'Abschnitte 4.2, 4.4 (Blutungsrisiko)' },
    { id: 'ats-schock', titel: 'S3-Leitlinie Polytrauma/Schwerverletzten-Behandlung (AWMF 187-023), Version 5.0, 2025', fundstelle: 'Schockzeichen, Schockindex als Hilfsgröße' },
    { id: 'news2', titel: 'Royal College of Physicians: National Early Warning Score (NEWS) 2, 2017' },
    { id: 'aps-mündlich', titel: 'AHRQ TeamSTEPPS 3.0: Check-back (Closed Loop) bei mündlichen Anordnungen, 2023' },
  ],

  person: {
    name: 'Herr Wendt',
    alter: { jahre: 58 },
    geschlecht: 'm',
    biografie: ['verheiratet, Ehefrau Karin', 'Schreiner, will bald wieder arbeiten', 'fährt gern Rad und will das bald wieder können'],
    diagnosenBekannt: ['Knie-Totalendoprothese rechts heute 10:30–12:15 (Spinalanästhesie)', 'Gonarthrose rechts', 'arterielle Hypertonie'],
    medikamentePlan: ['Enoxaparin 40 mg s. c. 0-0-1-0 (heute 18:00 gegeben)', 'Ramipril 5 mg 1-0-0-0', 'Metamizol 1 g 1-1-1-1', 'Piritramid 3,75 mg s. c. bei Bedarf'],
    allergien: ['keine bekannt'],
    gewichtKg: 88,
  },
  medien: { raum: '13_station_postop' },
  uebernahme: 'Herr Wendt, 58, hat heute Mittag eine Knie-TEP rechts bekommen, Spinalanästhesie, seit 13:30 wieder bei uns. Eine Redon-Drainage liegt, bei der Runde um 18 Uhr war der Verband trocken. Enoxaparin um 18 Uhr ist gegeben, Piritramid hat er um 18:30 bekommen. Gerade hat er geklingelt.',
  startUhrzeit: '19:40',

  start: {
    // Nachblutung: schon etwa 15 % Volumenverlust, blutet weiter. Modell zu Beginn etwa HF 105, RR 115/80.
    grund: { volumen: 0.85, schmerz: 6, angst: 0.35, uebelkeit: 0.5, unruhe: 0.2, temperatur: 36.3, blutzucker: 118 },
    treiber: [{ art: 'blutung', mlProMin: 40 }],
    bild: { haltung: 'liegt', haut: 'blass', mimik: 'angst' },
    flags: ['zugang-liegt'],
    sichtbar: [],
  },

  massnahmen: [
    // Gespräch
    'ansprechen-orientierung', 'beschwerden-erfragen', 'beruhigen-zusprechen',
    // Beobachten
    'ersteindruck-abcde', 'haut-beobachten', 'rekap-pruefen', 'bewusstsein-avpu', 'schmerz-nrs', 'wunde-beurteilen', 'drainagen-beobachten',
    'schockindex-berechnen', 'news2-berechnen', 'beine-vergleichen',
    // Akut
    'flachlagern-beine-hoch', 'oberkoerper-hoch', 'blutung-stillen', 'hilfe-holen', 'rea-team-alarmieren',
    // Messen
    'af-zaehlen', 'pulsoxy-anlegen', 'rr-messen', 'puls-zaehlen', 'temperatur-ohr', 'kurve-lesen', 'monitor-anlegen', 'bilanz-fuehren',
    // Versorgen
    'infusion-anhaengen', 'infusion-ueberwachen', 'nuechtern-lassen', 'piritramid-sc', 'enoxaparin-sc', 'mobilisieren-transfer', 'haendedesinfektion',
    // Melden
    'pflegefachperson-informieren', 'tochter-informieren', 'pflegebericht',
  ],
  massnahmenZusatz: [
    aus('blutung-stillen', {
      name: 'Verband mit Druck verstärken (nicht öffnen), Durchblutungsrand markieren',
      // Druck von außen bremst die Blutung, stoppt sie aber nicht (Ursache im Gelenk)
      beendet: ['blutung'], treiber: [{ art: 'blutung', mlProMin: 15 }],
    }),
    aus('flachlagern-beine-hoch', { name: 'Flach lagern, operiertes Bein leicht hoch (Schocklage ohne Atemnot)',
      wirkung: [{ groesse: 'volumen', delta: 0.04, beginnSek: 0, spitzeSek: 60, dauerSek: 'dauerhaft' }] }),
    aus('infusion-anhaengen', {
      name: 'Infusion anhängen: 500 ml Vollelektrolytlösung (nach Anordnung)', setzt: ['infusion-laeuft'],
      wirkung: [{ groesse: 'volumen', delta: 0.08, beginnSek: 0, spitzeSek: 900, dauerSek: 'dauerhaft' }],
    }),
    aus('sc-injektion', {
      id: 'piritramid-sc', name: 'Piritramid 3,75 mg s. c. (Bedarfsplan Schmerz)',
      treiber: [{ art: 'wirkstoff', id: 'piritramid', dosisMg: 3.75, weg: 'sc' }],   // G1
    }),
    aus('sc-injektion', { id: 'enoxaparin-sc', name: 'Enoxaparin 40 mg s. c. (Thromboseprophylaxe)', setzt: ['enoxaparin-gegeben'] }),
    aus('mobilisieren-transfer', { name: 'An die Bettkante mobilisieren (er will zur Toilette)',
      wirkung: [{ groesse: 'volumen', delta: -0.05, beginnSek: 0, spitzeSek: 30, dauerSek: 300 }] }),
  ],

  akte: {
    aufnahmegrund: 'Elektive Aufnahme heute 07:00 zur Knie-Totalendoprothese rechts bei fortgeschrittener Gonarthrose. OP 10:30–12:15 in Spinalanästhesie, Blutverlust laut OP-Bericht etwa 300 ml, Redon-Drainage intraartikulär.',
    anamnese: [
      'Schreiner, lebt mit Ehefrau im Einfamilienhaus, bisher selbstständig.',
      'ASS 100 wurde sieben Tage vor der OP abgesetzt (Absprache Hausarzt).',
      'Hb vor der OP 14,6 g/dl. Keine Blutungsneigung bekannt.',
      'Raucht nicht, Alkohol gelegentlich.',
    ],
    diagnosen: [
      { text: 'Knie-Totalendoprothese rechts (heute)', icd: 'Z96.651', seit: 'heute' },
      { text: 'Primäre Gonarthrose rechts', icd: 'M17.1', seit: '2021' },
      { text: 'Arterielle Hypertonie', icd: 'I10.90', seit: '2016' },
    ],
    medikation: [
      { id: 'mp-enoxaparin', wirkstoff: 'Enoxaparin', staerke: '40 mg', form: 's. c.', schema: '0-0-1-0', massnahme: 'enoxaparin-sc', zuletzt: 'heute 18:00',
        hinweis: 'Erste Gabe 6 h nach OP (heute 18:00, Kürzel SB). Bei Blutungszeichen nicht geben, ärztlich Rücksprache.' },
      { id: 'mp-ramipril', wirkstoff: 'Ramipril', staerke: '5 mg', form: 'Tbl.', schema: '1-0-0-0', zuletzt: 'heute 06:00', hinweis: 'Vor Gabe RR messen; unter 100 systolisch nicht geben.' },
      { id: 'mp-metamizol', wirkstoff: 'Metamizol', staerke: '1 g', form: 'Tbl.', schema: '1-1-1-1', zuletzt: 'heute 18:00', hinweis: 'Um 6, 12, 18, 24 Uhr. i. v. nur langsam (RR-Abfall).' },
      { id: 'mp-piritramid', wirkstoff: 'Piritramid', staerke: '3,75 mg', form: 's. c.', massnahme: 'piritramid-sc', zuletzt: 'heute 18:30',
        bedarf: { indikation: 'Schmerz NRS ab 5 trotz Basismedikation', einzeldosis: '3,75 mg', maxProTag: '4 Gaben', abstandH: 4 },
        hinweis: 'Vor Gabe Atemfrequenz und Vigilanz. Neue, andersartige Schmerzen erst ärztlich abklären.' },
      { id: 'mp-ondansetron', wirkstoff: 'Ondansetron', staerke: '4 mg', form: 'i. v.', bedarf: { indikation: 'Übelkeit', einzeldosis: '4 mg', maxProTag: '2 Gaben', abstandH: 8 },
        hinweis: 'Gabe durch Pflegefachperson.' },
    ],
    vorwerte: [
      { zeit: 'heute 06:00 (präop.)', vorH: 13.7, werte: { rrSys: 148, rrDia: 88, hf: 72, af: 14, spo2: 98, temp: 36.6 }, kuerzel: 'ND' },
      { zeit: 'heute 13:30 (Rückkehr)', vorH: 6.2, werte: { rrSys: 132, rrDia: 78, hf: 78, af: 14, spo2: 97, temp: 36.2, schmerz: 2 }, kuerzel: 'SB' },
      { zeit: 'heute 16:00', vorH: 3.7, werte: { rrSys: 134, rrDia: 80, hf: 80, af: 16, spo2: 97, schmerz: 3 }, kuerzel: 'SB' },
      { zeit: 'heute 18:00', vorH: 1.7, werte: { rrSys: 128, rrDia: 78, hf: 86, af: 16, spo2: 97, temp: 36.5, schmerz: 5 }, kuerzel: 'SB' },
    ],
    pflegebericht: [
      { zeit: 'heute 13:40', wer: 'SB', text: 'Rückkehr aus dem Aufwachraum. Wach, orientiert, Beine noch taub (Spinalanästhesie). Verband trocken, Redon-Drainage mit Sog, 40 ml. PVK links Handrücken.' },
      { zeit: 'heute 16:10', wer: 'SB', text: 'Beine wieder beweglich. Erstes Trinken gut vertragen. Drainage 120 ml. Bisher nicht mobilisiert, Physio morgen früh.' },
      { zeit: 'heute 18:20', wer: 'SB', text: 'Enoxaparin 40 mg s. c. 18:00 gegeben. Verband trocken, Drainage gesamt 180 ml. Puls etwas höher als mittags, Schmerz NRS 5: Piritramid 3,75 mg s. c. um 18:30.' },
    ],
    aerztlicheAnordnungen: [
      { zeit: 'heute 12:30', wer: 'Dr. Yilmaz', text: 'Enoxaparin 40 mg s. c. ab 18:00 täglich. Metamizol 1 g 4×/Tag. Bedarf Piritramid 3,75 mg s. c., Abstand 4 h.' },
      { zeit: 'heute 12:30', wer: 'Dr. Yilmaz', text: 'Vitalzeichen, Verband und Drainage 4-stündlich, am OP-Tag zusätzlich 18 Uhr. Drainage über 300 ml oder Schockzeichen: sofort ärztlich informieren.' },
    ],
    assessments: [
      { name: 'NEWS2', wert: '1 Punkt (heute 18:00)', datum: 'heute 18:00' },
      { name: 'Thromboserisiko', wert: 'hoch (Gelenkersatz untere Extremität)', datum: 'heute', hinweis: 'Medikamentöse und physikalische Prophylaxe.' },
      { name: 'Sturzrisiko', wert: 'erhöht', datum: 'heute', hinweis: 'Erste Mobilisation nur mit Physio/Pflege.' },
    ],
    labor: [
      { name: 'Hämoglobin', wert: '14,6', einheit: 'g/dl', norm: '13,5–17,5', datum: 'vor 3 Tagen (präop.)' },
      { name: 'Thrombozyten', wert: '245', einheit: '/nl', norm: '150–400', datum: 'vor 3 Tagen (präop.)' },
      { name: 'Quick/INR', wert: '98 % / 1,0', datum: 'vor 3 Tagen (präop.)' },
      { name: 'Blutgruppe', wert: 'A Rh positiv, Antikörpersuche negativ', datum: 'vor 3 Tagen' },
    ],
    bilanzVortag: { einfuhrMl: 1800, ausfuhrMl: 1500 },
    pflegeplanung: [
      { problem: 'Gefahr einer Nachblutung nach Gelenkersatz', ziel: 'Blutung wird früh erkannt', massnahmen: ['Verband und Drainage mit Uhrzeit kontrollieren', 'Puls, RR, Haut im Verlauf vergleichen'] },
      { problem: 'Akuter Schmerz nach OP', ziel: 'Schmerz NRS höchstens 3 in Ruhe', massnahmen: ['Schmerz einschätzen', 'Medikation nach Plan', 'Kühlen nach Standard'] },
      { problem: 'Thrombosegefahr', ziel: 'Keine Thrombose', massnahmen: ['Enoxaparin nach Plan', 'Fußgymnastik', 'Frühmobilisation ab morgen'] },
    ],
    rechtliches: ['Auskunft an die Ehefrau Karin Wendt erlaubt (Aufnahmebogen, heute unterschrieben).', 'Einwilligung in Bluttransfusion liegt vor.'],
  },

  befunde: [
    { massnahme: 'ansprechen-orientierung', varianten: [{ text: 'Er ist wach und orientiert, wirkt aber fahrig: „Mir ist so komisch. Ist das normal nach der OP?“' }] },
    { massnahme: 'beschwerden-erfragen', varianten: [{ text: '„Mir ist übel, und ich friere. Das Knie drückt anders als vorhin, so prall.“ Seit etwa einer halben Stunde.' }] },
    { massnahme: 'ersteindruck-abcde', varianten: [
      { text: 'A frei. B: atmet etwas schneller, ohne Atemnot. C: blass, Stirn feucht, Hände kühl, Puls schnell. D: wach, unruhig. E: Verband am Knie an einer Stelle rot durchgefärbt.' },
    ] },
    { massnahme: 'haut-beobachten', varianten: [{ text: 'Gesicht und Lippen blass, Stirn kaltschweißig, Hände und Füße kühl.' }] },
    { massnahme: 'rekap-pruefen', varianten: [{ text: 'Rekapillarisierung am Fingernagel {rekapSek} Sekunden.', zeigt: ['rekapSek'] }] },
    { massnahme: 'bewusstsein-avpu', varianten: [{ text: 'AVPU: {avpu}, GCS {gcs}. Wach, aber unruhig.', zeigt: ['avpu', 'gcs'] }] },
    { massnahme: 'schmerz-nrs', varianten: [{ text: 'NRS 6. Drückend, prall im ganzen Knie, „anders als vorhin“.' }] },
    { massnahme: 'wunde-beurteilen', varianten: [
      { wenn: { getan: 'blutung-stillen' }, text: 'Der verstärkte Verband ist markiert. Der rote Fleck wächst langsamer, aber er wächst.' },
      { text: 'Verband an der Innenseite des Knies handtellergroß frisch rot durchgefärbt. Das Knie ist prall geschwollen. Nicht öffnen: verstärken, markieren, melden.' },
    ] },
    { massnahme: 'drainagen-beobachten', varianten: [{ text: 'Redon-Flasche voll mit frisch hellrotem Blut, Sog noch vorhanden. Seit 18 Uhr fast 300 ml dazu, insgesamt etwa 470 ml.' }] },
    { massnahme: 'schockindex-berechnen', varianten: [
      { wenn: { nicht: { alle: [RR_BEKANNT, PULS_BEKANNT] } }, text: 'Dafür brauchst du Puls und systolischen Blutdruck.' },
      { text: 'Puls {hf} geteilt durch systolischen RR {rrSys}: der Schockindex liegt um 1 (Puls fast so hoch wie der Blutdruck). Um 18 Uhr lag er deutlich darunter. Trend: Volumenmangel.' },
    ] },
    { massnahme: 'news2-berechnen', varianten: [
      { wenn: { nicht: { alle: [RR_BEKANNT, PULS_BEKANNT] } }, text: 'Für den NEWS2 fehlen dir noch Werte.' },
      { text: 'NEWS2 aus deinen Werten im mittleren Bereich, vor allem durch den Puls. Der Score unterschätzt eine Blutung: Drainage, Verband und Schockindex gehören dazu.' },
    ] },
    { massnahme: 'beine-vergleichen', varianten: [{ text: 'Rechtes Knie prall geschwollen und warm unter dem Verband. Unterschenkel und Fuß rechts warm, gut durchblutet, Wade weich. Links unauffällig.' }] },
    { massnahme: 'af-zaehlen', varianten: [{ text: 'Atemfrequenz {af}/min.', zeigt: ['af'] }] },
    { massnahme: 'pulsoxy-anlegen', varianten: [{ text: 'SpO₂ {spo2} %, Puls {hf}/min.', zeigt: ['spo2', 'hf'] }] },
    { massnahme: 'rr-messen', varianten: [{ text: 'RR {rrSys}/{rrDia} mmHg. Um 18 Uhr lag er laut Kurve höher.', zeigt: ['rrSys', 'rrDia'] }] },
    { massnahme: 'puls-zaehlen', varianten: [{ text: 'Puls {hf}/min, regelmäßig, schwach tastbar.', zeigt: ['hf'] }] },
    { massnahme: 'temperatur-ohr', varianten: [{ text: '{temp} °C.', zeigt: ['temp'] }] },
    { massnahme: 'kurve-lesen', varianten: [{ text: 'Kurve: Puls 78 → 80 → 86 seit Mittag, RR 132 → 128. Enoxaparin 40 mg um 18:00 gegeben (SB), Piritramid um 18:30. Drainage 18 Uhr gesamt 180 ml. Anordnung: ab 300 ml oder Schockzeichen sofort melden. Aufnahmebogen: Auskunft an Ehefrau Karin erlaubt.' }] },
    { massnahme: 'monitor-anlegen', varianten: [{ text: 'Monitor läuft: HF {hf}/min, RR {rrSys}/{rrDia}, SpO₂ {spo2} %, AF {af}/min.', zeigt: ['hf', 'rrSys', 'rrDia', 'spo2', 'af'] }] },
    { massnahme: 'infusion-anhaengen', varianten: [{ text: '500 ml Vollelektrolytlösung laufen zügig über den Zugang links, Einstichstelle reizlos.' }] },
    { massnahme: 'infusion-ueberwachen', varianten: [{ text: 'Infusion läuft, Einstichstelle reizlos.' }] },
    { massnahme: 'nuechtern-lassen', varianten: [{ text: 'Getränk weggestellt, Schild „nüchtern“ am Bett. Herr Wendt fragt: „Muss ich nochmal operiert werden?“' }] },
    { massnahme: 'mobilisieren-transfer', varianten: [{ text: 'Beim Aufsetzen wird ihm schwarz vor Augen, er sackt zurück ins Kissen. Mit Schockzeichen ist Aufsetzen gefährlich.' }] },
    { massnahme: 'piritramid-sc', varianten: [{ text: 'Piritramid gespritzt. Der Schmerz wird dumpfer, an der Blutung ändert das nichts.' }] },
  ],

  gespraech: [
    { id: 'g-angst', frage: 'Was macht Ihnen gerade am meisten Sorgen?', an: 'patient', kompetenzbereiche: ['II'],
      antwort: [{ text: '„Dass da was schiefgegangen ist. Das sieht nach viel Blut aus.“' }], fakten: ['Angst vor Komplikation'] },
    { id: 'g-erklaeren', frage: 'Erklären, was du siehst, was du tust und dass die Ärztin kommt', an: 'patient', kompetenzbereiche: ['II'],
      antwort: [{ text: 'Er atmet durch: „Gut, dass Sie bei mir bleiben.“' }],
      wirkung: [{ groesse: 'angst', delta: -0.15, beginnSek: 0, spitzeSek: 60, dauerSek: 'dauerhaft' }] },
    { id: 'g-ehefrau', frage: 'Die Ehefrau am Telefon über die Lage informieren', an: 'angehoerige', kanal: 'telefon', kompetenzbereiche: ['II', 'IV'],
      nurWenn: { ab: 420 },
      schweigepflicht: { erlaubtWenn: { getan: 'kurve-lesen' },
        fehlerText: 'Am Telefon kann sich jeder als Ehefrau ausgeben. Erst prüfen, ob Auskunft erlaubt ist (Aufnahmebogen in der Akte) und nur das Nötige sagen. Herr Wendt könnte auch selbst einwilligen.' },
      antwort: [
        { wenn: { flag: 'arzt-kommt' }, text: '„Danke, dass Sie mich anrufen. Ich komme ins Krankenhaus. Sagen Sie ihm, dass ich unterwegs bin.“', setzt: ['ehefrau-informiert'] },
        { text: '„Und was passiert jetzt? Weiß der Arzt Bescheid?“', setzt: ['ehefrau-informiert'] },
      ],
      fakten: ['Ärztin kommt', 'mögliche Revision'] },
  ],

  sbar: [
    { id: 's-blutung', teil: 'S', text: 'Herr Wendt, 58, Zimmer 7, Knie-TEP rechts heute: Verdacht auf Nachblutung, er wird blass und kaltschweißig.', art: 'kern' },
    { id: 's-uebel', teil: 'S', text: 'Herrn Wendt ist übel, und er hat Schmerzen.', art: 'hilfreich' },
    { id: 'b-op', teil: 'B', text: 'Knie-TEP rechts heute 10:30 bis 12:15 in Spinalanästhesie, Redon-Drainage. Enoxaparin 40 mg um 18 Uhr gegeben, Piritramid um 18:30.', art: 'kern' },
    { id: 'b-schreiner', teil: 'B', text: 'Er ist Schreiner und will bald wieder arbeiten.', art: 'ablenker' },
    { id: 'a-verband-drainage', teil: 'A', text: 'Verband frisch rot durchgefärbt, Knie prall, Drainage seit 18 Uhr fast 300 ml frisches Blut.', art: 'kern', bekanntWenn: BLUTUNG_GESEHEN },
    { id: 'a-schock', teil: 'A', text: 'Puls deutlich höher als um 18 Uhr, Blutdruck niedriger, blass, kaltschweißig, kühle Hände.', art: 'kern', bekanntWenn: { alle: [RR_BEKANNT, PULS_BEKANNT] } },
    { id: 'a-schockindex', teil: 'A', text: 'Schockindex um 1, deutlich gestiegen.', art: 'hilfreich', bekanntWenn: { getan: 'schockindex-berechnen' } },
    { id: 'a-normal', teil: 'A', text: 'Das ist wohl der normale Wundschmerz nach der OP.', art: 'falsch' },
    { id: 'r-kommen', teil: 'R', text: 'Bitte kommen Sie sofort. Braucht er Volumen, Blutbild und Kreuzblut, soll er nüchtern bleiben?', art: 'kern' },
    { id: 'r-schmerzmittel', teil: 'R', text: 'Darf ich ihm nochmal etwas gegen die Schmerzen geben?', art: 'ablenker' },
    { id: 'r-op-laeuft', teil: 'R', text: 'Liegt flach, Druckverband markiert, Infusion läuft, nüchtern, Blutbild und Kreuzblut sind abgenommen. Enoxaparin heute 18 Uhr gegeben, die zweite Gabe ist ausgesetzt.', art: 'hilfreich',
      bekanntWenn: { alle: [{ getan: 'infusion-anhaengen' }, { getan: 'nuechtern-lassen' }] } },
  ],

  anordnungen: [
    { id: 'an-infusion', massnahme: 'infusion-anhaengen', text: '500 ml Vollelektrolytlösung jetzt zügig über den liegenden Zugang.' },
    { id: 'an-nuechtern', massnahme: 'nuechtern-lassen', text: 'Ab sofort nüchtern, OP-Bereitschaft vorbereiten.' },
    { id: 'an-enoxa', massnahme: 'enoxaparin-sc', text: 'Enoxaparin 40 mg s. c. heute Abend geben.',
      fehlerhaft: { warum: 'Enoxaparin wurde um 18 Uhr schon gegeben (Doppelgabe), und bei einer aktiven Nachblutung verstärkt ein Gerinnungshemmer die Blutung.',
        korrektur: 'Kein Enoxaparin mehr heute, wir pausieren die Prophylaxe bis zur Entscheidung über die Revision. Danke fürs Nachsehen.', ersatz: 'an-enoxa-pause' } },
    { id: 'an-enoxa-pause', massnahme: 'enoxaparin-sc', text: 'Enoxaparin pausieren bis zur Entscheidung über die Revision.' },
    { id: 'an-piritramid', massnahme: 'piritramid-sc', text: 'Piritramid 3,75 mg s. c. nach Bedarfsplan.' },
  ],

  arzt: {
    name: 'Dr. Yilmaz (Dienstärztin Unfallchirurgie)',
    erreichbar: 'telefon',
    regeln: [
      { ...BLUTUNG_REGEL, wenn: { alle: [{ gemeldet: ['a-verband-drainage'] }, { eine: [{ gemeldet: ['a-schock'] }, { gemeldet: ['wert:hf'] }, { gemeldet: ['a-schockindex'] }] }] } },
      { id: 'r-vital-frage', wenn: { gemeldet: ['a-verband-drainage'] },
        antwort: '„Durchgeblutet und viel in der Drainage, das muss ich wissen.“',
        rueckfrage: { text: '„Wie sind Puls und Blutdruck im Vergleich zu 18 Uhr?“', erwartet: ['wert:hf'], auftrag: 'af-vital' } },
      { wenn: { eine: [{ gemeldet: ['s-uebel'] }, { gemeldet: ['a-normal'] }, { gemeldet: ['r-schmerzmittel'] }] },
        antwort: '„Schmerzen und Übelkeit am OP-Abend sind häufig. Geben Sie das Piritramid aus dem Bedarfsplan, ich schaue später rein.“',
        anordnungen: ['an-piritramid'], setzt: ['arzt-beruhigt'] },
    ],
    auftraege: [
      { id: 'af-vital', text: 'Puls und Blutdruck messen und der Dienstärztin melden', erledigt: { alle: [PULS_BEKANNT, RR_BEKANNT] }, meldung: ['wert:hf'], meldenBinnenSek: 300,
        folge: [BLUTUNG_REGEL] },
      { id: 'af-kontrolle', text: 'Zehn Minuten nach Infusionsstart Puls und Blutdruck messen und der Ärztin schicken',
        erledigt: { alle: [{ getan: 'infusion-anhaengen' }, { getan: 'rr-messen' }, { getan: 'puls-zaehlen' }] }, meldung: ['wert:rrSys', 'wert:hf'], meldenBinnenSek: 1200,
        folge: [
          { wenn: { wert: 'rrSys', vergleich: '>=', grenze: 105 }, antwort: '„Danke. Das hält erst mal. Ich bin gleich da, der Oberarzt sieht ihn sich mit an.“', setzt: ['vital-rueckmeldung'] },
          { wenn: { ab: 0 }, antwort: '„Noch zu niedrig. Infusion weiterlaufen lassen, flach liegen lassen, ich bin in einer Minute da.“', setzt: ['vital-rueckmeldung'] },
        ] },
    ],
  },

  ereignisse: [
    { id: 'e-toilette', art: 'patient', wann: { alle: [{ ab: 300 }, { nicht: { getan: 'flachlagern-beine-hoch' } }] },
      text: 'Herr Wendt schiebt die Decke weg: „Ich muss mal. Helfen Sie mir zur Toilette?“ Er will sich aufsetzen.',
      bild: { haltung: 'sitzt', mimik: 'angst' },
      entscheidung: [
        { id: 'w-flach', text: 'Liegen bleiben lassen, Urinflasche anbieten, flach lagern und erklären, warum', wertung: 'gut', warum: 'Mit Schockzeichen kann er beim Aufsetzen kollabieren. Urinflasche im Liegen ist sicher.' },
        { id: 'w-bettkante', text: 'Erst an die Bettkante setzen und schauen, ob es geht', wertung: 'gefaehrlich', warum: 'Aufsetzen verschiebt Blut in die Beine; bei Volumenmangel droht der Kollaps.' },
        { id: 'w-spaeter', text: 'Sagen, er solle noch etwas warten, und erst die Runde fertig machen', wertung: 'falsch', warum: 'Er bleibt mit Schockzeichen allein und steht womöglich selbst auf.' },
      ] },
    { id: 'e-ehefrau', art: 'telefon', wann: { ab: 420 },
      text: 'Das Stationstelefon: „Hier Karin Wendt. Mein Mann hat mir geschrieben, dass er friert und ihm übel ist. Was ist denn los?“' },
    { id: 'e-kollegin', art: 'team', wann: { ab: 180 },
      text: 'Pflegefachfrau Sandra schaut herein: „Ich bin im Nachbarzimmer. Ruf, wenn du mich brauchst.“' },
    { id: 'e-aerztin-da', art: 'visite', wann: { alle: [{ flag: 'arzt-kommt' }, { ab: 960 }] },
      text: 'Dr. Yilmaz ist da, sieht sich Verband und Drainage an, nimmt Blutbild und Kreuzblut ab und telefoniert mit dem Oberarzt: „Wir revidieren heute noch. Bitte melde ihn im OP an und übergib an die Anästhesiepflege.“' },
  ],

  pa: {
    name: 'Praxisanleiter Herr Kaiser',
    hilfen: [
      { wenn: { nicht: BLUTUNG_GESEHEN }, impuls: 'Wo würdest du nach einer OP am Knie als Erstes hinschauen?', tipp: 'Verband und Drainage ansehen und mit der Menge von 18 Uhr vergleichen.' },
      { wenn: { nicht: { alle: [RR_BEKANNT, PULS_BEKANNT] } }, impuls: 'Wie verrät der Kreislauf einen Blutverlust?', tipp: 'Puls und Blutdruck messen und mit der Kurve vergleichen.' },
      { wenn: { nicht: { getan: 'flachlagern-beine-hoch' } }, impuls: 'Wie lagerst du jemanden, der blass und kaltschweißig wird, aber gut Luft bekommt?', tipp: 'Flach hinlegen, Beine leicht hoch.' },
      { wenn: { nicht: { flag: 'arzt-kommt' } }, impuls: 'Was braucht die Ärztin, damit sie sofort kommt?', tipp: 'Verband/Drainage und die Kreislaufzeichen zusammen melden.' },
      { wenn: { alle: [{ flag: 'arzt-kommt' }, { nicht: { flag: 'remonstriert:an-enoxa' } }] }, impuls: 'Passen alle Anordnungen zu dem, was in der Akte steht?', tipp: 'Wann hat er Enoxaparin zuletzt bekommen?' },
      { wenn: { auftrag: 'af-kontrolle', status: 'offen' }, impuls: 'Was hat dir die Ärztin noch aufgetragen?', tipp: 'Zehn Minuten nach Infusionsstart Puls und Blutdruck schicken.' },
      { impuls: 'Was gehört jetzt in die Dokumentation?', tipp: 'Uhrzeit, Drainagemenge, Werte und die mündlichen Anordnungen.' },
    ],
  },
  team: { kollegin: 'Pflegefachfrau Sandra (Schichtleitung)', weitere: { angehoerige: 'Ehefrau Karin Wendt', 'aufnehmende-station': 'OP, Anästhesiepflege' } },

  bewertung: {
    pflicht: [
      { id: 'p-verband', text: 'Verband und Drainage kontrolliert und mit 18 Uhr verglichen', gewicht: 3, kompetenzbereiche: ['I'], erfuellt: BLUTUNG_GESEHEN,
        warum: 'Die Blutung zeigt sich zuerst im Verband und in der Drainage, lange bevor der Blutdruck fällt.' },
      { id: 'p-kreislauf', text: 'Puls und Blutdruck gemessen, Haut beobachtet', gewicht: 3, kompetenzbereiche: ['I'],
        erfuellt: { alle: [RR_BEKANNT, PULS_BEKANNT, { eine: [{ getan: 'haut-beobachten' }, { getan: 'ersteindruck-abcde' }] }] },
        warum: 'Steigender Puls, kühle feuchte Haut und fallender Blutdruck zeigen den Volumenmangel.' },
      { id: 'p-schockindex', text: 'Schockindex gebildet oder Verlauf mit der Kurve verglichen', gewicht: 1, kompetenzbereiche: ['I', 'V'],
        erfuellt: { eine: [{ getan: 'schockindex-berechnen' }, { getan: 'kurve-lesen' }] }, warum: 'Der Trend zeigt die Gefahr früher als ein einzelner Wert.' },
      { id: 'p-flach', text: 'Flach gelagert, nicht mobilisiert', gewicht: 2, kompetenzbereiche: ['I'],
        erfuellt: { alle: [{ getan: 'flachlagern-beine-hoch' }, { nicht: { getan: 'mobilisieren-transfer' } }] }, warum: 'Flachlage hält das Blut zentral, Aufsetzen kann zum Kollaps führen.' },
      { id: 'p-druck', text: 'Verband mit Druck verstärkt und markiert (nicht geöffnet)', gewicht: 2, kompetenzbereiche: ['I'], erfuellt: { getan: 'blutung-stillen' },
        warum: 'Druck bremst die Blutung, die Markierung zeigt, ob sie weitergeht.' },
      { id: 'p-arzt', text: 'Ärztin rechtzeitig mit SBAR informiert', gewicht: 3, kompetenzbereiche: ['II', 'III'],
        erfuellt: { alle: [{ flag: 'arzt-kommt' }, { getan: 'anruf-aerztin', bis: 720 }] }, warum: 'Eine Nachblutung braucht eine schnelle ärztliche Entscheidung (Volumen, Labor, Revision).' },
      { id: 'p-remonstration', text: 'Anordnung „Enoxaparin heute Abend“ hinterfragt', gewicht: 3, kompetenzbereiche: ['III', 'IV'], erfuellt: { flag: 'remonstriert:an-enoxa' },
        warum: 'Enoxaparin ist um 18 Uhr schon gegeben, und bei aktiver Blutung verstärkt eine zweite Gabe die Blutung.' },
      { id: 'p-rueckgelesen', text: 'Anordnungen Infusion und nüchtern rückgelesen', gewicht: 1, kompetenzbereiche: ['III'],
        erfuellt: { alle: [{ anordnung: 'an-infusion', rueckgelesen: true }, { anordnung: 'an-nuechtern', rueckgelesen: true }] }, warum: 'Closed Loop bei mündlichen Anordnungen.' },
      { id: 'p-infusion', text: 'Infusion nach Anordnung angehängt (mit Praxisanleitung)', gewicht: 2, kompetenzbereiche: ['I', 'III'], erfuellt: { getan: 'infusion-anhaengen' },
        warum: 'Volumen überbrückt bis zur Ursachenbehandlung.' },
      { id: 'p-nuechtern', text: 'Nüchternheit für eine mögliche Revision gesichert', gewicht: 1, kompetenzbereiche: ['I', 'III'], erfuellt: { getan: 'nuechtern-lassen' },
        warum: 'Eine Revision in Narkose ist sonst gefährlicher (Aspiration).' },
      { id: 'p-rueckauftrag', text: 'Rückauftrag der Ärztin erledigt und gemeldet (Puls und RR nach Infusionsstart)', gewicht: 2, kompetenzbereiche: ['II', 'III'],
        erfuellt: { auftrag: 'af-kontrolle', status: 'gemeldet' }, warum: 'Die Ärztin entscheidet mit deinen Werten, wie dringend die Revision ist.' },
      { id: 'p-team', text: 'Schichtleitung informiert', gewicht: 1, kompetenzbereiche: ['III'], erfuellt: { getan: 'pflegefachperson-informieren' },
        warum: 'Die verantwortliche Pflegefachperson muss Bescheid wissen und ggf. unterstützen.' },
      { id: 'p-uebergabe', text: 'Strukturierte Übergabe an die Anästhesiepflege (Lage und laufende Therapie)', gewicht: 2, kompetenzbereiche: ['II', 'III'],
        erfuellt: { alle: [{ gesagt: 's-blutung', an: 'aufnehmende-station' }, { gesagt: 'r-op-laeuft', an: 'aufnehmende-station' }] },
        warum: 'Im OP müssen Blutverlust, Volumen, Nüchternheit und die Enoxaparin-Gabe bekannt sein.' },
      { id: 'p-doku', text: 'Pflegebericht mit Drainagemenge, Werten und mündlichen Anordnungen', gewicht: 1, kompetenzbereiche: ['I', 'IV'],
        erfuellt: { alle: [{ getan: 'pflegebericht' }, { dokumentiert: 'befund:drainagen-beobachten' }, { dokumentiert: 'anordnung:an-infusion' }] },
        warum: 'Menge und Zeitpunkt der Blutung und die mündlichen Anordnungen müssen nachvollziehbar sein.' },
    ],
    fehler: [
      { id: 'f-mobil', text: 'Trotz Schockzeichen mobilisiert', schwere: 'schwer', kompetenzbereiche: ['I', 'V'], wenn: { getan: 'mobilisieren-transfer' },
        folge: { text: 'Herr Wendt kollabiert halb an der Bettkante, du hältst ihn gerade noch.' },
        warum: 'Bei Volumenmangel führt Aufsetzen zum Blutdruckabfall und Sturz.' },
      { id: 'f-enoxa', text: 'Enoxaparin trotz Blutung und Gabe um 18 Uhr gespritzt', schwere: 'schwer', kompetenzbereiche: ['III', 'IV'],
        wenn: { alle: [{ getan: 'enoxaparin-sc' }, { nicht: { flag: 'remonstriert:an-enoxa' } }] },
        folge: { text: 'Der Verband färbt schneller durch.', treiber: [{ art: 'blutung', mlProMin: 15 }] },
        warum: 'Doppelte Gerinnungshemmung bei aktiver Blutung. Anordnung gegen die Akte prüfen und hinterfragen.' },
      { id: 'f-maskiert', text: 'Schmerzmittel gegeben statt die neue Schmerzqualität zu melden', schwere: 'mittel', kompetenzbereiche: ['I', 'III'],
        wenn: { alle: [{ getan: 'piritramid-sc' }, { nicht: { flag: 'arzt-kommt' } }] },
        warum: 'Neue, pralle Schmerzen nach Gelenkersatz sind ein Warnzeichen. Ein Opioid verdeckt sie und senkt zusätzlich den Blutdruck.' },
      { id: 'f-nur-schmerz', text: 'Nur Schmerz und Übelkeit gemeldet, Blutungszeichen verschwiegen', schwere: 'mittel', kompetenzbereiche: ['II', 'III'], wenn: { flag: 'arzt-beruhigt' },
        warum: 'Die Ärztin entscheidet nach dem, was sie hört. Ohne Verband, Drainage und Kreislauf erkennt sie die Nachblutung nicht.' },
      { id: 'f-spaet', text: 'Bis 12 Minuten nach dem Klingeln niemanden informiert', schwere: 'schwer', kompetenzbereiche: ['I', 'III'],
        wenn: { alle: [{ ab: 720 }, { nicht: { flag: 'arzt-kommt' } }] },
        warum: 'Durchgefärbter Verband, volle Drainage und steigender Puls verlangen sofort eine ärztliche Einschätzung.' },
    ],
    ende: [
      { wenn: { alle: [{ flag: 'arzt-kommt' }, { ab: 960 }, { getan: 'infusion-anhaengen' }, { getan: 'pflegebericht' }, { flag: 'vital-rueckmeldung' }, { gesagt: 'r-op-laeuft', an: 'aufnehmende-station' }] },
        text: 'Herr Wendt wird mit laufender Infusion, nüchtern und mit Kreuzblut zur Revision in den OP gebracht. Die Anästhesiepflege hat deine Übergabe.', ausgang: 'verlegt' },
      { wenn: { ab: 2400 }, text: 'Herr Wendt wird kaum noch ansprechbar, der Blutdruck fällt weiter. Das Notfallteam übernimmt.', ausgang: 'verschlechtert' },
    ],
  },

  pflegebedarf: {
    probleme: [
      { id: 'pb-blutung', text: 'Nachblutung mit Volumenmangel (Schockgefahr)', richtig: true, prioritaet: 1, warum: 'Lebensbedrohlich, bestimmt Lagerung, Volumen und Revision.' },
      { id: 'pb-angst', text: 'Angst vor einer Komplikation und erneuter OP', richtig: true, prioritaet: 2, warum: 'Angst steigert Puls und Unruhe; Information und Dabeibleiben helfen.' },
      { id: 'pb-schmerz', text: 'Akuter Schmerz durch Schwellung im Gelenk', richtig: true, prioritaet: 2, warum: 'Erst nach ärztlicher Einschätzung behandeln, nicht als Ersatz fürs Melden.' },
      { id: 'pb-sturz', text: 'Sturzgefahr beim Aufstehen (Kreislauf, Bein)', richtig: true, prioritaet: 2, warum: 'Er will zur Toilette; im Liegen versorgen.' },
      { id: 'pb-obstipation', text: 'Obstipation durch Opioide', richtig: false, warum: 'Möglich, aber jetzt nicht vorrangig.' },
      { id: 'pb-wissen', text: 'Wissensdefizit zur Gehstützen-Technik', richtig: false, warum: 'Hat mit der akuten Lage nichts zu tun.' },
    ],
    ziele: [
      { id: 'z-kreislauf', text: 'Puls und Blutdruck stabilisieren sich bis zur Revision, Blutung ist gestoppt.', passtZu: ['pb-blutung'], richtig: true },
      { id: 'z-info', text: 'Herr Wendt weiß, was passiert, und fühlt sich begleitet.', passtZu: ['pb-angst'], richtig: true },
      { id: 'z-sicher', text: 'Herr Wendt bleibt sturzfrei und mobilisiert erst nach ärztlicher Freigabe.', passtZu: ['pb-sturz'], richtig: true },
      { id: 'z-schmerzfrei', text: 'Herr Wendt ist sofort schmerzfrei.', passtZu: ['pb-schmerz'], richtig: false },
    ],
  },

  leitfaden: [
    { titel: 'Was im Körper passiert', text: 'Nach einem Gelenkersatz kann es ins Gelenk und durch die Wunde nachbluten. Der Körper gleicht einen Blutverlust erst aus: Die Gefäße der Haut ziehen sich zusammen (blass, kühl, feucht), das Herz schlägt schneller. Der Blutdruck fällt oft erst spät. Übelkeit, Frieren und Unruhe sind frühe Zeichen.', quellen: ['ats-schock'] },
    { titel: 'Erkennen und vergleichen', text: 'Verband markieren, Drainagemenge mit Uhrzeit ablesen und mit der letzten Kontrolle vergleichen. Puls und Blutdruck gegen die Kurve legen. Der Schockindex (Puls geteilt durch systolischen RR) über 1 weist auf einen Volumenmangel hin; der Trend zählt mehr als ein Wert.', quellen: ['ats-schock', 'news2'] },
    { titel: 'Handeln', text: 'Flach lagern, Bein leicht hoch, nicht aufsetzen. Verband nicht öffnen, sondern mit Druck verstärken und markieren. Sofort ärztlich melden, nüchtern lassen, Zugang sichern. Schmerzmittel ersetzen das Melden nicht.', quellen: ['ats-schock'] },
    { titel: 'Anordnungen prüfen', text: 'Auch eine Ärztin kann sich irren. Eine Anordnung, die zu dem nicht passt, was du in der Akte siehst (Enoxaparin schon gegeben, aktive Blutung), musst du hinterfragen (remonstrieren). Mündliche Anordnungen rücklesen und dokumentieren.', quellen: ['fi-enoxaparin', 'aps-mündlich', 's3-vte'] },
    { titel: 'Deine Grenzen', text: 'Infusion ohne Zusatz anhängen: im 1. Drittel nicht, im 2. und 3. Drittel mit Anleitung. Blut abnehmen, Kreuzblut und Zugang legen sind ärztliche Aufgaben bzw. im 3. Drittel nur mit Anleitung.', quellen: ['s3-vte'] },
  ],

  pruefwege: {
    muster: [
      { art: 'massnahme', id: 'beschwerden-erfragen' },
      { art: 'massnahme', id: 'ersteindruck-abcde' },
      { art: 'massnahme', id: 'wunde-beurteilen' },
      { art: 'massnahme', id: 'drainagen-beobachten' },
      { art: 'massnahme', id: 'puls-zaehlen' },
      { art: 'massnahme', id: 'rr-messen' },
      { art: 'massnahme', id: 'flachlagern-beine-hoch' },
      { art: 'massnahme', id: 'blutung-stillen' },
      { art: 'massnahme', id: 'schockindex-berechnen' },
      { art: 'anruf', an: 'aerztin', sbar: ['s-blutung', 'b-op', 'a-verband-drainage', 'a-schock', 'a-schockindex', 'r-kommen'] },
      { art: 'rueckmelden', anordnung: 'an-infusion', rueckgelesen: true },
      { art: 'rueckmelden', anordnung: 'an-nuechtern', rueckgelesen: true },
      { art: 'remonstrieren', anordnung: 'an-enoxa', grund: 'Enoxaparin hat er um 18 Uhr schon bekommen, und er blutet gerade nach.' },
      { art: 'massnahme', id: 'infusion-anhaengen' },
      { art: 'massnahme', id: 'nuechtern-lassen' },
      { art: 'frage', id: 'g-erklaeren' },
      { art: 'massnahme', id: 'pflegefachperson-informieren' },
      { art: 'massnahme', id: 'kurve-lesen' },
      { art: 'warten', sek: 300 },
      { art: 'massnahme', id: 'rr-messen' },
      { art: 'massnahme', id: 'puls-zaehlen' },
      { art: 'nachricht', an: 'aerztin', kanal: 'messenger', bausteine: ['wert:rrSys', 'wert:hf'] },
      { art: 'frage', id: 'g-ehefrau' },
      { art: 'dokumentieren', bausteine: ['befund:drainagen-beobachten', 'wert:hf', 'wert:rrSys', 'anordnung:an-infusion', 'anordnung:an-nuechtern'] },
      { art: 'warten', sek: 120 },
      { art: 'nachricht', an: 'aufnehmende-station', kanal: 'telefon', bausteine: ['s-blutung', 'b-op', 'a-verband-drainage', 'wert:rrSys', 'r-op-laeuft'] },
      { art: 'abschluss', probleme: ['pb-blutung', 'pb-angst', 'pb-schmerz', 'pb-sturz'], ziele: ['z-kreislauf', 'z-info', 'z-sicher'],
        sbar: ['s-blutung', 'b-op', 'a-verband-drainage', 'a-schock', 'a-schockindex'] },
    ],
    unterlassung: { bisSek: 1800, erwartet: { wert: 'rrSys', vergleich: '<', grenze: 95 } },
    grenze: { rolle: 1, events: [{ art: 'massnahme', id: 'infusion-anhaengen' }], erwartet: 'pa-eingriff' },
  },
};
