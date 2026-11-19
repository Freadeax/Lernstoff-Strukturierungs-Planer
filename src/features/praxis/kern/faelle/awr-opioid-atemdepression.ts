// Fallwelle P16a (CE05 Patientensicherheit) · Spur B, Aufwachraum: Atemdepression nach Opioid bei Schlafapnoe
// Entwurf, fachlich UNGEPRÜFT. Inhalte fiktiv/didaktisch. Neu geschrieben aus Altfall „aufwachraum“ (scenarios.json).
// Wirkstoffe über G1 (Piritramid, Naloxon). Rolle: 3. Drittel oder Pflegefachperson (E11).

import { KATALOG } from '../katalog';
import type { ArztRegel, Bedingung, FallV2, MassnahmeDefinition } from '../typen';

const aus = (id: string, mehr: Partial<MassnahmeDefinition>): MassnahmeDefinition => ({ ...KATALOG[id]!, ...mehr });

const ATMUNG_ERHOBEN: Bedingung = { eine: [{ getan: 'af-zaehlen' }, { getan: 'atmung-beobachten' }] };
const WACHHEIT: Bedingung = { eine: [{ getan: 'bewusstsein-avpu' }, { getan: 'rass-einschaetzen' }] };
/** Naloxon gegeben: durch die Anästhesistin (Ereignis e-aerztin-da, gleiche Bedingung) oder als Pflegefachperson selbst */
const NALOXON_DA: Bedingung = { eine: [{ flag: 'naloxon-gegeben' }, { alle: [{ flag: 'arzt-kommt' }, { getan: 'notfallmedikament-vorbereiten' }] }] };

const ANAESTHESIE_ANTWORT = '„Das ist eine Opioid-Atemdepression. Ich komme sofort. Weckreize, Kopf überstrecken, Oberkörper hoch, Sauerstoff nicht weiter hochdrehen. Ziehen Sie mir 0,4 mg Naloxon auf 10 ml auf, ich titriere selbst. Danach bitte zehn Minuten nach der Gabe Atemfrequenz und etCO₂ melden.“';
const ANAESTHESIE_REGEL: ArztRegel = {
  id: 'r-opioid', wenn: { gemeldet: ['a-af-niedrig', 'a-vigilanz'] }, antwort: ANAESTHESIE_ANTWORT,
  anordnungen: ['an-naloxon-richten'], kommtNachSek: 90, setzt: ['arzt-kommt'], auftraege: ['af-nach-naloxon'],
};

export const AWR_OPIOID_ATEMDEPRESSION: FallV2 = {
  schema: 2,
  id: 'awr-opioid-atemdepression',
  version: '0.1.0',
  spur: 'B',
  setting: 'aufwachraum',
  altersgruppe: 'erwachsen',
  titel: '„Er schläft so tief“',
  kurz: 'Aufwachraum: 71-Jähriger mit Schlafapnoe nach Gallen-OP schnarcht, atmet langsam, ist kaum weckbar; die Sättigung hält nur der Sauerstoff.',
  rahmen: 'Du übernimmst im Aufwachraum Herrn Vogt von einer Kollegin, die in den OP muss. Die Anästhesistin ist im Nachbarsaal erreichbar.',
  lernziele: [
    'Eine Atemdepression nach Opioid erkennen: Atemfrequenz, Vigilanz, Pupillen, etCO₂ statt nur SpO₂.',
    'Verstehen, warum mehr Sauerstoff eine Hypoventilation verdeckt.',
    'Sofortmaßnahmen einleiten (Weckreize, Atemweg, Lagerung, CPAP) und die Anästhesie mit SBAR rufen.',
    'Naloxon vorbereiten (Closed Loop) und die Renarkotisierung kennen: Überwachung verlängern.',
    'Verlegungskriterien (Aldrete) vertreten, auch gegen Druck von der Station, und eine weitere Opioidgabe hinterfragen.',
  ],
  lehrplan: {
    ce: ['ce.05'], abschnitt: ['ad3'],
    themen: ['thema.ph.periop', 'thema.ph.medikamente', 'thema.kl.atmung', 'thema.beo.bewusstsein', 'thema.beo.vitalzeichen', 'thema.pp.uebergabe'],
    kompetenzen: ['I.2.a', 'I.2.e', 'II.2.b', 'III.2.c', 'III.2.f', 'IV.1.a'],
  },
  geeignet: { rollen: [3, 'pflegefachperson'], stufen: [2, 3] },
  dauerMin: [15, 22],
  freigabe: {
    status: 'entwurf',
    pruefpunkte: [
      'Ablauf (Weckreiz, Atemweg, Oberkörper hoch, Anästhesie rufen, Naloxon titriert durch Ärztin, CPAP) gegen DGAI-Empfehlung Aufwachraum prüfen',
      'Aldrete-Score als Verlegungskriterium (ab 9 Punkten, Freigabe Anästhesie) und Überwachung 60 Min. nach letzter Naloxongabe prüfen',
      'Remonstration Piritramid nach Naloxon bei OSAS fachlich passend? Alternative Metamizol-Kurzinfusion',
      'Befugnis: Naloxon aufziehen 3. Drittel mit Anleitung, i. v. geben nur Pflegefachperson nach Anordnung bzw. Ärztin',
      'Lernmodell: nach 5 Min. AF 8, SpO₂ 92 % mit 2 l O₂, etCO₂ um 50, AVPU V; ohne Hilfe bleibt etCO₂ über 50 (Test). Nach Naloxon AF 11–14, A. OSAS-Empfindlichkeit über höhere Modelldosis (24 mg statt 15 mg) und verminderten Gasaustausch (Atelektasen bei Adipositas) abgebildet',
      'Kein Aufwachraum-Foto: Beispielbild 12_station_kardiologie_monitoring_sensor_an (Material-Bedarf 2.3)',
    ],
  },
  quellen: [
    { id: 'dgai-awr', titel: 'DGAI/BDA: Empfehlung zur Überwachung nach Anästhesieverfahren (Aufwachraum), 2009/Revision 2021', fundstelle: 'Verlegungskriterien, Überwachung' },
    { id: 'aldrete', titel: 'Aldrete JA: The post-anesthesia recovery score revisited. J Clin Anesth 1995;7:89–91' },
    { id: 'fi-naloxon', titel: 'Fachinformation Naloxon', fundstelle: 'Abschnitt 4.2 (Titration), 4.4 (Wirkdauer kürzer als Opioid)' },
    { id: 'fi-piritramid', titel: 'Fachinformation Piritramid (Dipidolor)', fundstelle: 'Abschnitte 4.4, 4.8 (Atemdepression)' },
    { id: 's3-osa', titel: 'S3-Leitlinie Nicht erholsamer Schlaf/Schlafstörungen, Kapitel Schlafbezogene Atmungsstörungen (AWMF 063-001), 2017/2020', fundstelle: 'Perioperatives Vorgehen bei OSA, eigenes CPAP-Gerät' },
  ],

  person: {
    name: 'Herr Vogt',
    alter: { jahre: 71 },
    geschlecht: 'm',
    biografie: ['verheiratet, Ehefrau Renate wartet zu Hause', 'früher Busfahrer', 'schläft zu Hause mit CPAP-Maske'],
    diagnosenBekannt: ['laparoskopische Cholezystektomie heute (Vollnarkose)', 'obstruktive Schlafapnoe mit CPAP', 'Adipositas (BMI 37)', 'arterielle Hypertonie'],
    medikamentePlan: ['Piritramid insgesamt 15 mg im OP und Aufwachraum', 'Metamizol 1 g i. v. im OP', 'Candesartan 8 mg 1-0-0'],
    allergien: ['keine bekannt'],
    hilfsmittel: ['eigenes CPAP-Gerät (mitgebracht, im Schrank)'],
    gewichtKg: 112,
  },
  medien: { raum: '12_station_kardiologie_monitoring_sensor_an' },
  uebernahme: 'Herr Vogt, 71, laparoskopische Galle, Narkose seit 40 Minuten aus. Bekannte Schlafapnoe, sein CPAP-Gerät ist im Schrank. Er hatte deutliche Schmerzen, insgesamt 15 mg Piritramid, die letzten 7,5 mg vor einer Viertelstunde. 2 Liter Sauerstoff über die Brille. Ich muss rüber, der nächste Patient kommt.',
  startUhrzeit: '11:20',

  start: {
    // Opioid (G1) plus Schlafapnoe. Lernmodell: OSAS-Empfindlichkeit als höhere Modelldosis, Atelektasen als Gasaustausch 0,45.
    // Nach 5 Min. etwa AF 8, SpO₂ 92 % mit 2 l O₂, etCO₂ um 50 (O₂ verdeckt die Hypoventilation).
    grund: { atemantrieb: 0.9, vigilanz: 0.95, gasaustausch: 0.45, schmerz: 2, temperatur: 35.9, blutzucker: 146, sauerstoff: 2, uebelkeit: 0.2 },
    treiber: [{ art: 'wirkstoff', id: 'piritramid', dosisMg: 24, weg: 'iv' }],
    module: {},
    bild: { haltung: 'liegt', haut: 'rosig', mimik: 'schlaefrig', geraete: ['pulsoxy', 'rr-manschette', 'o2-brille'] },
    flags: ['zugang-liegt', 'o2-laeuft'],
    anordnungen: ['an-cpap'],
    sichtbar: ['hf', 'spo2', 'rrSys', 'rrDia'],
  },

  massnahmen: [
    // Gespräch
    'ansprechen-orientierung', 'beruhigen-zusprechen',
    // Beobachten
    'ersteindruck-abcde', 'atmung-beobachten', 'atemgeraeusche-hoeren', 'bewusstsein-avpu', 'rass-einschaetzen', 'pupillen-pruefen', 'haut-beobachten',
    'schmerz-nrs', 'verlegungskriterien-pruefen', 'news2-berechnen',
    // Akut
    'weckreiz-geben', 'atemwege-freimachen', 'oberkoerper-hoch', 'o2-hochdrehen', 'cpap-anlegen', 'absaugen-oral', 'notfallmedikament-vorbereiten', 'beutel-maske-beatmen', 'hilfe-holen',
    // Messen
    'af-zaehlen', 'etco2-anschliessen', 'temperatur-ohr', 'bz-messen', 'kurve-lesen', 'monitor-anlegen',
    // Versorgen
    'naloxon-iv', 'piritramid-iv', 'metamizol-kurzinfusion', 'infusion-ueberwachen',
    // Melden
    'pflegebericht', 'verlegung-uebergabe',
  ],
  massnahmenZusatz: [
    aus('beruhigen-zusprechen', {
      id: 'weckreiz-geben', name: 'Laut ansprechen, zum tiefen Durchatmen auffordern (Weckreiz)', reiter: 'akut', zeitbedarfSekunden: 30,
      wirkung: [{ groesse: 'atemantrieb', delta: 0.25, beginnSek: 0, spitzeSek: 15, dauerSek: 120 }, { groesse: 'vigilanz', delta: 0.2, beginnSek: 0, spitzeSek: 10, dauerSek: 120 }],
    }),
    aus('atemwege-freimachen', { name: 'Atemweg freimachen: Kopf überstrecken, Unterkiefer vorziehen (Esmarch)',
      wirkung: [{ groesse: 'gasaustausch', delta: 0.08, beginnSek: 0, spitzeSek: 10, dauerSek: 300 }] }),
    aus('oberkoerper-hoch', { name: 'Oberkörper 30–45° hoch (Schlafapnoe, Adipositas)',
      wirkung: [{ groesse: 'gasaustausch', delta: 0.05, beginnSek: 0, spitzeSek: 30, dauerSek: 'dauerhaft' }] }),
    aus('o2-geben', { id: 'o2-hochdrehen', name: 'Sauerstoff auf 6 l/min hochdrehen',
      wirkung: [{ groesse: 'sauerstoff', delta: 4, beginnSek: 0, spitzeSek: 30, dauerSek: 'dauerhaft' }] }),
    aus('cpap-anlegen', { name: 'Eigenes CPAP-Gerät anlegen, Sauerstoff einleiten (nach Anordnung)',
      wirkung: [{ groesse: 'gasaustausch', delta: 0.12, beginnSek: 0, spitzeSek: 60, dauerSek: 'dauerhaft' }, { groesse: 'atemarbeit', delta: -0.1, beginnSek: 0, spitzeSek: 60, dauerSek: 'dauerhaft' }] }),
    aus('notfallmedikament-vorbereiten', { name: 'Naloxon 0,4 mg auf 10 ml aufziehen und beschriften (Closed Loop)', setzt: ['naloxon-gerichtet'] }),
    aus('iv-medikament-geben', { id: 'naloxon-iv', name: 'Naloxon i. v. geben (titriert, nach Anordnung)', setzt: ['naloxon-gegeben'],
      treiber: [{ art: 'wirkstoff', id: 'naloxon', dosisMg: 0.4, weg: 'iv' }] }),
    aus('iv-medikament-geben', { id: 'piritramid-iv', name: 'Piritramid 3,75 mg i. v. gegen Schmerzen',
      treiber: [{ art: 'wirkstoff', id: 'piritramid', dosisMg: 3.75, weg: 'iv' }] }),
    aus('infusion-anhaengen', { id: 'metamizol-kurzinfusion', name: 'Metamizol 1 g als Kurzinfusion über 15 Min. anhängen (nach Anordnung)', setzt: ['infusion-laeuft'],
      treiber: [{ art: 'wirkstoff', id: 'metamizol', dosisMg: 1000, weg: 'iv' }] }),
  ],

  akte: {
    aufnahmegrund: 'Elektive laparoskopische Cholezystektomie bei symptomatischer Cholezystolithiasis. OP 09:45–10:35 in Vollnarkose (Propofol, Remifentanil, Rocuronium), Extubation 10:40 problemlos.',
    anamnese: [
      'Obstruktive Schlafapnoe seit 2019, AHI 34/h, nutzt CPAP jede Nacht (Druck 10 cmH₂O). Gerät mitgebracht.',
      'Adipositas Grad II (112 kg, 1,74 m). Belastbarkeit 2 Etagen.',
      'Anästhesie-Aufklärung: erhöhtes Risiko für Atemwegsprobleme nach Opioiden; CPAP im Aufwachraum empfohlen.',
    ],
    diagnosen: [
      { text: 'Symptomatische Cholezystolithiasis, Z. n. lap. Cholezystektomie (heute)', icd: 'K80.20', seit: 'heute' },
      { text: 'Obstruktive Schlafapnoe, CPAP-Therapie', icd: 'G47.31', seit: '2019' },
      { text: 'Adipositas Grad II', icd: 'E66.01', seit: '–' },
      { text: 'Arterielle Hypertonie', icd: 'I10.90', seit: '2012' },
    ],
    medikation: [
      { id: 'mp-piritramid', wirkstoff: 'Piritramid', staerke: '3,75–7,5 mg', form: 'i. v.', massnahme: 'piritramid-iv', zuletzt: 'heute 11:05',
        bedarf: { indikation: 'Schmerz NRS ab 4 im Aufwachraum', einzeldosis: '3,75 mg', maxProTag: '15 mg', abstandH: 0.25 },
        hinweis: 'Bisher 15 mg (OP 7,5 mg, AWR 10:50 und 11:05). Vor jeder Gabe AF, SpO₂, Vigilanz. OSAS: Opioide sparsam.' },
      { id: 'mp-metamizol', wirkstoff: 'Metamizol', staerke: '1 g', form: 'i. v. (Kurzinfusion)', massnahme: 'metamizol-kurzinfusion', zuletzt: 'heute 09:50', schema: '1-1-1-1',
        hinweis: 'Langsam über 15 Min. (RR-Abfall). Nächste Gabe ab 13:50, vorziehen nur nach Anordnung.', geaendertDurch: 'an-metamizol' },
      { id: 'mp-ondansetron', wirkstoff: 'Ondansetron', staerke: '4 mg', form: 'i. v.', zuletzt: 'heute 10:30', bedarf: { indikation: 'PONV', einzeldosis: '4 mg', maxProTag: '2 Gaben', abstandH: 8 } },
      { id: 'mp-candesartan', wirkstoff: 'Candesartan', staerke: '8 mg', form: 'Tbl.', schema: '1-0-0-0', zuletzt: 'heute 06:30', hinweis: 'Mit einem Schluck Wasser vor der OP gegeben.' },
    ],
    vorwerte: [
      { zeit: 'heute 06:30 (Station)', vorH: 4.8, werte: { rrSys: 152, rrDia: 90, hf: 76, af: 16, spo2: 95, temp: 36.7 }, kuerzel: 'FD' },
      { zeit: '10:45 (AWR-Aufnahme)', vorH: 0.6, werte: { rrSys: 146, rrDia: 84, hf: 82, af: 14, spo2: 96, schmerz: 7 }, kuerzel: 'MK' },
      { zeit: '11:00', vorH: 0.3, werte: { rrSys: 138, rrDia: 80, hf: 74, af: 12, spo2: 94, schmerz: 5 }, kuerzel: 'MK' },
    ],
    pflegebericht: [
      { zeit: '10:45', wer: 'MK', text: 'Übernahme aus dem OP, wach, Schmerz NRS 7. O₂ 2 l/min über Brille. Piritramid 3,75 mg i. v. 10:50 nach Anordnung.' },
      { zeit: '11:05', wer: 'MK', text: 'Weiter NRS 5, Piritramid 3,75 mg i. v. 11:05. Wird schläfrig, schnarcht. CPAP-Gerät liegt im Schrank, noch nicht angelegt.' },
    ],
    aerztlicheAnordnungen: [
      { zeit: '10:40', wer: 'Dr. Lorenz (Anästhesie)', text: 'Piritramid 3,75 mg i. v. bei NRS ≥ 4, Abstand 15 Min., max. 15 mg im AWR. O₂ nach SpO₂-Ziel 92–96 %.' },
      { zeit: '10:40', wer: 'Dr. Lorenz (Anästhesie)', text: 'OSAS: eigenes CPAP-Gerät bei Schläfrigkeit anlegen. Verlegung erst nach Freigabe Anästhesie (Aldrete ≥ 9).' },
    ],
    assessments: [
      { name: 'Aldrete-Score', wert: '9/10 bei Aufnahme', datum: '10:45' },
      { name: 'STOP-BANG', wert: '6 Punkte (hohes OSA-Risiko)', datum: 'Prämedikation' },
      { name: 'PONV-Risiko (Apfel)', wert: '1 Punkt', datum: 'Prämedikation' },
    ],
    labor: [
      { name: 'Hämoglobin', wert: '14,1', einheit: 'g/dl', norm: '13,5–17,5', datum: 'vor 5 Tagen' },
      { name: 'Kreatinin', wert: '1,1', einheit: 'mg/dl', norm: '0,7–1,2', datum: 'vor 5 Tagen' },
    ],
    pflegeplanung: [
      { problem: 'Gefahr der Atemdepression (Opioide, OSAS)', ziel: 'AF ≥ 10, SpO₂ ≥ 92 %, wach auf Ansprache', massnahmen: ['AF, SpO₂, Vigilanz alle 5–15 Min.', 'Oberkörper hoch', 'CPAP anlegen'] },
    ],
    rechtliches: ['Ehefrau Renate Vogt: Auskunft erlaubt (Aufnahmebogen).'],
  },

  befunde: [
    { massnahme: 'ansprechen-orientierung', varianten: [
      { wenn: NALOXON_DA, text: 'Er öffnet die Augen: „Wo bin ich … ach so, die Galle.“ Er ist wach und orientiert.' },
      { text: 'Er murmelt mit geschlossenen Augen: „Lass mich schlafen … tut nicht weh.“ Schläft sofort wieder ein.' },
    ] },
    { massnahme: 'ersteindruck-abcde', varianten: [
      { text: 'A: schnarchendes Atemgeräusch mit Pausen. B: kaum Brustkorbbewegung, langsam. C: Puls kräftig, Haut warm. D: nur auf laute Ansprache kurz wach, Pupillen eng. E: Verbände trocken.' },
    ] },
    { massnahme: 'atmung-beobachten', varianten: [{ text: 'Flache, langsame Atmung, {af}/min, schnarchend mit Pausen von einigen Sekunden.', zeigt: ['af'] }] },
    { massnahme: 'af-zaehlen', varianten: [{ text: 'Atemfrequenz {af}/min.', zeigt: ['af'] }] },
    { massnahme: 'atemgeraeusche-hoeren', varianten: [{ text: 'Beidseits leise, abgeschwächt durch die flache Atmung, kein Rasseln, kein Giemen.' }] },
    { massnahme: 'bewusstsein-avpu', varianten: [{ text: 'AVPU: {avpu}, GCS {gcs}.', zeigt: ['avpu', 'gcs'] }] },
    { massnahme: 'rass-einschaetzen', varianten: [
      { wenn: NALOXON_DA, text: 'RASS 0: wach, ruhig, folgt Aufforderungen.' },
      { text: 'RASS −3: öffnet auf laute Ansprache kurz die Augen, kein Blickkontakt.' },
    ] },
    { massnahme: 'pupillen-pruefen', varianten: [{ wenn: NALOXON_DA, text: 'Pupillen mittelweit, seitengleich, reagieren.' }, { text: 'Beide Pupillen stecknadelkopfgroß, seitengleich, träge.' }] },
    { massnahme: 'haut-beobachten', varianten: [{ text: 'Haut warm und trocken, Lippen rosig. Die Hautfarbe zeigt das Problem nicht: Der Sauerstoff hält die Sättigung noch.' }] },
    { massnahme: 'schmerz-nrs', varianten: [{ wenn: NALOXON_DA, text: 'Jetzt wach: „Der Bauch tut weh, so 5.“' }, { text: 'Kaum einzuschätzen, er schläft dabei ein.' }] },
    { massnahme: 'etco2-anschliessen', varianten: [{ text: 'Kapnografie über die Sauerstoffbrille: etCO₂ {etco2} mmHg, flache Kurve mit Pausen.', zeigt: ['etco2', 'af'] }] },
    { massnahme: 'verlegungskriterien-pruefen', varianten: [
      { wenn: { alle: [NALOXON_DA, { getan: 'cpap-anlegen' }] }, text: 'Aldrete jetzt 8 von 10 (Sättigung nur mit CPAP und Sauerstoff). Nach Naloxon mindestens 60 Minuten weiter überwachen: Renarkotisierung möglich.' },
      { text: 'Aldrete 6 von 10: Atmung flach, nur auf Ansprache wach, Sättigung über 90 % nur mit Sauerstoff. Keine Verlegung.' },
    ] },
    { massnahme: 'news2-berechnen', varianten: [{ text: 'NEWS2 im roten Bereich (Atemfrequenz, Sauerstoffbedarf, Bewusstsein). Im Aufwachraum gilt zusätzlich: AF unter 10 und Vigilanz sind der Alarm.' }] },
    { massnahme: 'temperatur-ohr', varianten: [{ text: '{temp} °C.', zeigt: ['temp'] }] },
    { massnahme: 'bz-messen', varianten: [{ text: 'BZ {bz} mg/dl.', zeigt: ['bz'] }] },
    { massnahme: 'kurve-lesen', varianten: [{ text: 'AWR-Protokoll: Piritramid 10:50 und 11:05 je 3,75 mg, im OP 7,5 mg, zusammen 15 mg. AF 14 → 12 seit Aufnahme, SpO₂ 96 → 94 %. Anordnung: bei Schläfrigkeit CPAP; Verlegung erst ab Aldrete 9 mit Freigabe.' }] },
    { massnahme: 'monitor-anlegen', varianten: [{ text: 'Monitor: HF {hf}/min, RR {rrSys}/{rrDia}, SpO₂ {spo2} %, AF {af}/min.', zeigt: ['hf', 'rrSys', 'rrDia', 'spo2', 'af'] }] },
    { massnahme: 'cpap-anlegen', varianten: [{ text: 'Seine Maske sitzt, CPAP 10 cmH₂O, Sauerstoff über den Anschluss. Das Schnarchen hört auf, die Kurve wird gleichmäßig.' }] },
    { massnahme: 'o2-hochdrehen', varianten: [{ text: 'Die Sättigung steigt. Die Atemfrequenz bleibt gleich: mehr Sauerstoff behebt nicht die zu flache Atmung, das Kohlendioxid steigt weiter.' }] },
    { massnahme: 'weckreiz-geben', varianten: [{ text: 'Er atmet ein paarmal tief durch, die Sättigung steigt kurz. Sobald du aufhörst, schläft er wieder ein und schnarcht.' }] },
    { massnahme: 'absaugen-oral', varianten: [{ text: 'Kaum Sekret im Mund. Das Schnarchen kommt von der Zunge und den Weichteilen, nicht von Sekret.' }] },
    { massnahme: 'beutel-maske-beatmen', varianten: [{ text: 'Er atmet selbst, wenn auch langsam. Beutel-Masken-Beatmung ist bereit, aber jetzt nicht nötig.' }] },
    { massnahme: 'metamizol-kurzinfusion', varianten: [{ text: 'Metamizol 1 g läuft als Kurzinfusion über 15 Minuten. RR im Blick behalten.' }] },
    { massnahme: 'naloxon-iv', varianten: [{ text: 'Naloxon titriert gegeben. Er öffnet die Augen und atmet tiefer.' }] },
  ],

  gespraech: [
    { id: 'g-erklaeren', frage: 'Erklären, was gerade passiert und warum du ihn weckst', an: 'patient', kompetenzbereiche: ['II'],
      antwort: [{ wenn: NALOXON_DA, text: '„Ich war wohl ganz weg. Danke, dass Sie aufgepasst haben.“' }, { text: 'Er brummt etwas und schläft wieder ein.' }],
      wirkung: [{ groesse: 'angst', delta: -0.1, beginnSek: 0, spitzeSek: 60, dauerSek: 'dauerhaft' }] },
    { id: 'g-station-nein', frage: 'Der Station erklären, dass Herr Vogt noch nicht verlegt werden kann', an: 'aufnehmende-station', kanal: 'telefon', kompetenzbereiche: ['II', 'III'],
      nurWenn: { flag: 'station-hat-angerufen' },
      antwort: [{ text: '„Verstehe, dann warten wir. Ruft ihr an, wenn die Anästhesie ihn freigibt?“', setzt: ['station-vertroestet'] }] },
  ],

  sbar: [
    { id: 's-atemdepression', teil: 'S', text: 'Herr Vogt, Platz 3, nach lap. Galle: Verdacht auf Atemdepression nach Opioid, kaum weckbar.', art: 'kern' },
    { id: 's-schlaeft', teil: 'S', text: 'Herr Vogt schläft noch tief.', art: 'ablenker' },
    { id: 'b-osas-opioid', teil: 'B', text: 'Bekannte Schlafapnoe mit CPAP, Adipositas. Insgesamt 15 mg Piritramid, die letzten 3,75 mg vor einer Viertelstunde. 2 l Sauerstoff.', art: 'kern' },
    { id: 'b-busfahrer', teil: 'B', text: 'Er war früher Busfahrer.', art: 'ablenker' },
    { id: 'a-af-niedrig', teil: 'A', text: 'Atemfrequenz deutlich unter 10, schnarchend mit Atempausen.', art: 'kern', bekanntWenn: ATMUNG_ERHOBEN },
    { id: 'a-vigilanz', teil: 'A', text: 'Nur auf laute Ansprache kurz wach, Pupillen eng.', art: 'kern', bekanntWenn: WACHHEIT },
    { id: 'a-etco2', teil: 'A', text: 'etCO₂ deutlich erhöht, die Sättigung hält sich nur mit Sauerstoff.', art: 'kern', bekanntWenn: { getan: 'etco2-anschliessen' } },
    { id: 'a-spo2-gut', teil: 'A', text: 'Die Sättigung ist mit mehr Sauerstoff wieder gut, also kein Problem.', art: 'falsch' },
    { id: 'r-kommen', teil: 'R', text: 'Bitte kommen Sie sofort. Soll ich Naloxon vorbereiten und sein CPAP anlegen?', art: 'kern' },
    { id: 'r-verlegen', teil: 'R', text: 'Können wir ihn auf die Station verlegen?', art: 'falsch' },
    { id: 'r-uebergabe-laeuft', teil: 'R', text: 'Nach Naloxon wach, CPAP läuft, kein weiteres Opioid. Wegen Renarkotisierung mindestens 60 Minuten nach der letzten Gabe überwachen, AF und Vigilanz engmaschig.', art: 'hilfreich',
      bekanntWenn: { alle: [NALOXON_DA, { getan: 'cpap-anlegen' }] } },
  ],

  anordnungen: [
    { id: 'an-naloxon-richten', massnahme: 'notfallmedikament-vorbereiten', auchFuer: ['naloxon-iv'], text: 'Naloxon 0,4 mg auf 10 ml NaCl 0,9 % aufziehen, beschriften, bereitlegen.' },
    { id: 'an-cpap', massnahme: 'cpap-anlegen', text: 'Anästhesie 10:40: bei Schläfrigkeit eigenes CPAP-Gerät anlegen, Sauerstoff über den Anschluss, Ziel-SpO₂ 92–96 %.' },
    { id: 'an-piritramid-nach', massnahme: 'piritramid-iv', text: 'Wenn er Schmerzen hat, geben Sie nochmal 3,75 mg Piritramid.',
      fehlerhaft: { warum: 'Er war gerade opioidbedingt kaum weckbar, hat Schlafapnoe und Naloxon wirkt kürzer als Piritramid. Ein weiteres Opioid kann die Atemdepression sofort zurückbringen.',
        korrektur: 'Kein Opioid mehr. Ziehen Sie die Metamizol-Gabe als Kurzinfusion vor.', ersatz: 'an-metamizol' } },
    { id: 'an-metamizol', massnahme: 'metamizol-kurzinfusion', text: 'Metamizol 1 g als Kurzinfusion über 15 Minuten, jetzt.' },
  ],

  arzt: {
    name: 'Dr. Lorenz (Anästhesie)',
    erreichbar: 'vor-ort',
    regeln: [
      { ...ANAESTHESIE_REGEL, wenn: { alle: [{ gemeldet: ['a-af-niedrig', 'a-vigilanz'] }, { eine: [{ gemeldet: ['b-osas-opioid'] }, { gemeldet: ['a-etco2'] }] }] } },
      { id: 'r-frage-opioid', wenn: { gemeldet: ['a-af-niedrig', 'a-vigilanz'] },
        antwort: '„Langsam und kaum weckbar …“',
        rueckfrage: { text: '„Wie viel Opioid hat er bekommen, und hat er Vorerkrankungen der Atmung?“', erwartet: ['b-osas-opioid'] } },
      { wenn: { eine: [{ gemeldet: ['s-schlaeft'] }, { gemeldet: ['a-spo2-gut'] }, { gemeldet: ['r-verlegen'] }] },
        antwort: '„Wenn die Sättigung passt, lassen Sie ihn schlafen. Ich schaue nach dem nächsten Saal.“', setzt: ['arzt-beruhigt'] },
    ],
    auftraege: [
      { id: 'af-nach-naloxon', text: 'Zehn Minuten nach Naloxon Atemfrequenz und etCO₂ an die Anästhesistin melden',
        erledigt: { alle: [NALOXON_DA, { getan: 'af-zaehlen' }] }, meldung: ['wert:af'], meldenBinnenSek: 1200,
        folge: [
          { id: 'r-folge', wenn: { ab: 0 }, antwort: '„Gut. CPAP weiter, er bleibt mindestens eine Stunde nach dem Naloxon bei Ihnen. Und wenn er Schmerzen hat, geben Sie nochmal 3,75 mg Piritramid.“',
            anordnungen: ['an-piritramid-nach'], setzt: ['folge-erhalten'] },
        ] },
    ],
    kanaele: ['vor-ort', 'telefon'],
  },

  ereignisse: [
    { id: 'e-alarm', art: 'geraet', wann: { ab: 150 },
      text: 'Der Monitor piept: Sättigung fällt, trotz 2 Litern Sauerstoff. Herr Vogt schnarcht, dann ist es mehrere Sekunden still.',
      bild: { haltung: 'liegt', mimik: 'schlaefrig' },
      entscheidung: [
        { id: 'w-wecken', text: 'Laut ansprechen, Kopf überstrecken, Atmung zählen und die Anästhesie rufen', wertung: 'gut', warum: 'Ursache ist die zu flache Atmung. Weckreiz und Atemweg helfen sofort, die Anästhesie behandelt die Ursache.' },
        { id: 'w-o2', text: 'Sauerstoff auf 6 Liter hochdrehen und den Alarm leiser stellen', wertung: 'gefaehrlich', warum: 'Mehr Sauerstoff hebt die Sättigung, aber das CO₂ steigt weiter und er dämmert weg. Der Alarm verliert seine Warnfunktion.' },
        { id: 'w-abwarten', text: 'Fingerclip neu kleben, wahrscheinlich ein Messfehler', wertung: 'falsch', warum: 'Schnarchen, Pausen und Schläfrigkeit passen zur Messung. Erst den Menschen ansehen.' },
      ] },
    { id: 'e-aerztin-da', art: 'visite', wann: { alle: [{ flag: 'arzt-kommt' }, { getan: 'notfallmedikament-vorbereiten' }] },
      text: 'Dr. Lorenz ist da, liest die aufgezogene Spritze laut zurück („Naloxon 0,4 mg auf 10 ml“) und gibt es in 1-ml-Schritten, bis Herr Vogt die Augen öffnet und tiefer atmet.',
      treiber: [{ art: 'wirkstoff', id: 'naloxon', dosisMg: 0.4, weg: 'iv' }] },
    { id: 'e-station', art: 'telefon', wann: { alle: [NALOXON_DA, { ab: 660 }] },
      text: 'Die Chirurgie ruft an: „Wir hätten das Bett für Herrn Vogt jetzt frei. Können wir ihn holen? Ihr braucht den Platz doch auch.“',
      entscheidung: [
        { id: 'w-nein', text: 'Nein: nach Naloxon mindestens 60 Minuten Überwachung, Verlegung erst nach Freigabe der Anästhesie', wertung: 'gut', warum: 'Naloxon wirkt kürzer als Piritramid. Auf Station ohne Monitor käme eine Renarkotisierung unbemerkt.', setzt: ['station-hat-angerufen', 'verlegung-abgelehnt'] },
        { id: 'w-ja', text: 'Ja, er ist ja jetzt wach', wertung: 'gefaehrlich', warum: 'Wach nach Naloxon heißt nicht sicher. Verlegungskriterien und Freigabe fehlen.', setzt: ['station-hat-angerufen', 'zu-frueh-verlegt'] },
      ] },
  ],

  pa: {
    name: 'Fachpflegerin Anästhesie Frau Demir',
    hilfen: [
      { wenn: { nicht: ATMUNG_ERHOBEN }, impuls: 'Was verrät dir mehr über seine Atmung als die Sättigung?', tipp: 'Zähl die Atemfrequenz eine volle Minute.' },
      { wenn: { nicht: { getan: 'etco2-anschliessen' } }, impuls: 'Wie siehst du, ob genug CO₂ abgeatmet wird?', tipp: 'Kapnografie über die Sauerstoffbrille anschließen.' },
      { wenn: { nicht: { flag: 'arzt-kommt' } }, impuls: 'Wen brauchst du jetzt, und was muss sie wissen?', tipp: 'Anästhesie rufen: langsame Atmung, kaum weckbar, Opioidmenge, Schlafapnoe.' },
      { wenn: { nicht: { getan: 'cpap-anlegen' } }, impuls: 'Was nutzt Herr Vogt zu Hause jede Nacht?', tipp: 'Sein CPAP-Gerät liegt im Schrank.' },
      { wenn: { alle: [{ flag: 'folge-erhalten' }, { nicht: { flag: 'remonstriert:an-piritramid-nach' } }] }, impuls: 'Passt die letzte Anordnung zu dem, was gerade passiert ist?', tipp: 'Denk an die Wirkdauer von Naloxon.' },
      { impuls: 'Was gehört in die Übergabe und ins Protokoll?', tipp: 'Uhrzeiten von Opioid und Naloxon, Überwachungsdauer, CPAP.' },
    ],
  },
  team: { kollegin: 'Fachpflegerin Anästhesie Frau Demir', weitere: { 'aufnehmende-station': 'Allgemeinchirurgie, Station 4' } },

  bewertung: {
    pflicht: [
      { id: 'p-atmung', text: 'Atemfrequenz gezählt und Wachheit eingeschätzt', gewicht: 3, kompetenzbereiche: ['I'], klinisch: ['abcde'], erfuellt: { alle: [ATMUNG_ERHOBEN, WACHHEIT] },
        warum: 'Atemfrequenz und Vigilanz zeigen die Opioidwirkung früher als die Sättigung.' },
      { id: 'p-etco2', text: 'Ventilation mit Kapnografie geprüft', gewicht: 2, kompetenzbereiche: ['I'], klinisch: ['geraete'], erfuellt: { getan: 'etco2-anschliessen' },
        warum: 'Unter Sauerstoff zeigt nur das CO₂ die Hypoventilation.' },
      { id: 'p-sofort', text: 'Sofortmaßnahmen: Weckreiz und Atemweg frei', gewicht: 3, kompetenzbereiche: ['I'], klinisch: ['abcde', 'zeit'],
        erfuellt: { alle: [{ getan: 'weckreiz-geben' }, { getan: 'atemwege-freimachen' }] }, warum: 'Überbrückt die Zeit, bis die Anästhesie da ist.' },
      { id: 'p-lagerung', text: 'Oberkörper hochgelagert', gewicht: 1, kompetenzbereiche: ['I'], klinisch: ['abcde'], erfuellt: { getan: 'oberkoerper-hoch' },
        warum: 'Bei Adipositas und Schlafapnoe verbessert die Lagerung die Atmung.' },
      { id: 'p-anaesthesie', text: 'Anästhesie rechtzeitig mit SBAR gerufen', gewicht: 3, kompetenzbereiche: ['II', 'III'], klinisch: ['team', 'zeit'],
        erfuellt: { alle: [{ flag: 'arzt-kommt' }, { getan: 'anruf-aerztin', bis: 480 }] }, warum: 'Die Atemdepression braucht ärztliche Behandlung (Naloxon) innerhalb von Minuten.' },
      { id: 'p-naloxon', text: 'Naloxon nach Anordnung vorbereitet und beschriftet (Closed Loop)', gewicht: 2, kompetenzbereiche: ['I', 'III'], klinisch: ['medikamente'],
        erfuellt: { alle: [{ getan: 'notfallmedikament-vorbereiten' }, { anordnung: 'an-naloxon-richten', rueckgelesen: true }] }, warum: 'Richtige Verdünnung und Beschriftung verhindern Verwechslung und Überdosierung.' },
      { id: 'p-cpap', text: 'Eigenes CPAP-Gerät angelegt', gewicht: 2, kompetenzbereiche: ['I'], klinisch: ['geraete'], erfuellt: { getan: 'cpap-anlegen' },
        warum: 'CPAP hält die oberen Atemwege offen; die Anordnung bestand schon seit der Aufnahme.' },
      { id: 'p-remonstration', text: 'Anordnung „nochmal Piritramid“ hinterfragt', gewicht: 3, kompetenzbereiche: ['III', 'IV'], klinisch: ['medikamente'],
        erfuellt: { flag: 'remonstriert:an-piritramid-nach' }, warum: 'Kurz nach Naloxon mit Schlafapnoe kann ein Opioid die Atemdepression sofort zurückbringen.' },
      { id: 'p-rueckauftrag', text: 'Rückauftrag erledigt: Atemfrequenz nach Naloxon gemeldet', gewicht: 2, kompetenzbereiche: ['II', 'III'], klinisch: ['team'],
        erfuellt: { auftrag: 'af-nach-naloxon', status: 'gemeldet' }, warum: 'Die Anästhesistin entscheidet mit deiner Rückmeldung über weitere Gaben.' },
      { id: 'p-verlegung', text: 'Verlegungskriterien geprüft und vorzeitige Verlegung abgelehnt', gewicht: 2, kompetenzbereiche: ['III', 'IV'], klinisch: ['team'],
        erfuellt: { alle: [{ getan: 'verlegungskriterien-pruefen' }, { flag: 'verlegung-abgelehnt' }] }, warum: 'Renarkotisierung: Überwachung mindestens 60 Minuten nach der letzten Naloxongabe.' },
      { id: 'p-doku', text: 'Protokoll mit Uhrzeiten (Naloxon, CPAP, Werte)', gewicht: 1, kompetenzbereiche: ['I', 'IV'], klinisch: ['medikamente'],
        erfuellt: { alle: [{ getan: 'pflegebericht' }, { dokumentiert: 'anordnung:an-naloxon-richten' }] }, warum: 'Die Station muss wissen, wann Naloxon gegeben wurde, um die Renarkotisierung abzuschätzen.' },
    ],
    fehler: [
      { id: 'f-o2', text: 'Sauerstoff hochgedreht statt die Ursache anzugehen', schwere: 'mittel', kompetenzbereiche: ['I', 'V'], wenn: { alle: [{ getan: 'o2-hochdrehen' }, { nicht: NALOXON_DA }] },
        warum: 'Mehr Sauerstoff verdeckt die Hypoventilation: SpO₂ gut, CO₂ steigt, er dämmert weg.' },
      { id: 'f-opioid', text: 'Weiteres Opioid gegeben', schwere: 'schwer', kompetenzbereiche: ['I', 'III'], wenn: { getan: 'piritramid-iv' },
        folge: { text: 'Herr Vogt atmet wieder flacher, die Pausen werden länger.' },
        warum: 'Nach Naloxon und bei Schlafapnoe kein weiteres Opioid ohne ärztliche Neubewertung am Bett.' },
      { id: 'f-beruhigt', text: 'Nur „schläft“ oder „Sättigung gut“ gemeldet', schwere: 'mittel', kompetenzbereiche: ['II', 'III'], wenn: { flag: 'arzt-beruhigt' },
        warum: 'Ohne Atemfrequenz und Vigilanz erkennt die Anästhesistin die Gefahr nicht.' },
      { id: 'f-verlegt', text: 'Verlegung trotz fehlender Freigabe zugesagt', schwere: 'schwer', kompetenzbereiche: ['III', 'IV'], wenn: { flag: 'zu-frueh-verlegt' },
        warum: 'Auf der Station fehlt die Überwachung, wenn das Naloxon nachlässt.' },
      { id: 'f-spaet', text: 'Bis 8 Minuten niemanden gerufen', schwere: 'schwer', kompetenzbereiche: ['I', 'III'], wenn: { alle: [{ ab: 480 }, { nicht: { flag: 'arzt-kommt' } }] },
        warum: 'Atemfrequenz unter 10 mit Bewusstseinsminderung nach Opioid ist ein Notfall.' },
    ],
    ende: [
      { wenn: { alle: [NALOXON_DA, { getan: 'cpap-anlegen' }, { flag: 'verlegung-abgelehnt' }, { getan: 'pflegebericht' }, { auftrag: 'af-nach-naloxon', status: 'gemeldet' }, { ab: 1080 }] },
        text: 'Herr Vogt ist wach, atmet ruhig mit CPAP und bleibt zur Überwachung im Aufwachraum. Dr. Lorenz gibt ihn frühestens eine Stunde nach dem Naloxon frei.', ausgang: 'stabil' },
      { wenn: { ab: 2100 }, text: 'Herr Vogt ist nicht mehr weckbar, die Atmung setzt aus. Die Anästhesie beatmet mit Beutel und Maske.', ausgang: 'verschlechtert' },
    ],
  },

  pflegebedarf: {
    probleme: [
      { id: 'pb-atmung', text: 'Beeinträchtigte Atmung durch Opioid und Schlafapnoe (Hypoventilation)', richtig: true, prioritaet: 1, warum: 'Unmittelbar lebensbedrohlich.' },
      { id: 'pb-renarkose', text: 'Gefahr der Renarkotisierung nach Naloxon', richtig: true, prioritaet: 1, warum: 'Naloxon wirkt kürzer als Piritramid; Überwachung verlängern.' },
      { id: 'pb-schmerz', text: 'Akuter postoperativer Schmerz ohne weitere Opioide', richtig: true, prioritaet: 2, warum: 'Nach Naloxon kehrt der Schmerz zurück; Nicht-Opioide und Lagerung nutzen.' },
      { id: 'pb-hypothermie', text: 'Leichte Unterkühlung nach der OP', richtig: true, prioritaet: 3, warum: 'Wärmen fördert das Aufwachen und den Komfort.' },
      { id: 'pb-sturz', text: 'Sturzgefahr beim Gehen zur Toilette', richtig: false, warum: 'Er liegt im Aufwachraum und mobilisiert noch nicht.' },
    ],
    ziele: [
      { id: 'z-atmung', text: 'AF mindestens 10/min, etCO₂ im Normbereich, wach auf Ansprache.', passtZu: ['pb-atmung', 'pb-renarkose'], richtig: true },
      { id: 'z-schmerz', text: 'Schmerz NRS höchstens 4 ohne weiteres Opioid.', passtZu: ['pb-schmerz'], richtig: true },
      { id: 'z-waerme', text: 'Körpertemperatur über 36 °C.', passtZu: ['pb-hypothermie'], richtig: true },
      { id: 'z-verlegt', text: 'Herr Vogt ist in 10 Minuten auf Station.', passtZu: ['pb-atmung'], richtig: false },
    ],
  },
  verdacht: {
    optionen: [
      { id: 'v-opioid', text: 'Atemdepression durch Opioid bei Schlafapnoe (Hypoventilation)', richtig: true },
      { id: 'v-nachblutung', text: 'Nachblutung mit Volumenmangel', richtig: false },
      { id: 'v-lungenembolie', text: 'Lungenembolie', richtig: false },
    ],
    begruendungen: [
      { id: 'bg-af', text: 'Atemfrequenz unter 10, Atempausen, enge Pupillen', stuetzt: ['v-opioid'] },
      { id: 'bg-etco2', text: 'etCO₂ erhöht, SpO₂ nur mit Sauerstoff gehalten', stuetzt: ['v-opioid'] },
      { id: 'bg-naloxon', text: 'Prompte Besserung nach Naloxon', stuetzt: ['v-opioid'] },
      { id: 'bg-puls', text: 'Puls schnell, Haut blass und kalt', stuetzt: ['v-nachblutung'] },
    ],
  },

  leitfaden: [
    { titel: 'Was im Körper passiert', text: 'Opioide dämpfen den Atemantrieb im Hirnstamm: Die Atmung wird langsam und flach, CO₂ steigt, man wird schläfrig. Bei Schlafapnoe fallen im Schlaf zusätzlich die oberen Atemwege zusammen. Pupillen eng, Schnarchen mit Pausen und schwere Weckbarkeit sind typisch.', quellen: ['fi-piritramid', 's3-osa'] },
    { titel: 'Sauerstoff verdeckt das Problem', text: 'Mit Sauerstoff kann die Sättigung lange gut aussehen, obwohl kaum geatmet wird. Darum zählen Atemfrequenz, Wachheit und etCO₂. Mehr Sauerstoff behebt keine Hypoventilation.', quellen: ['dgai-awr'] },
    { titel: 'Sofort handeln', text: 'Laut ansprechen, zum Atmen auffordern, Kopf überstrecken, Oberkörper hoch, eigenes CPAP anlegen. Anästhesie sofort rufen. Naloxon wird verdünnt und in kleinen Schritten gegeben, bis die Atmung reicht, nicht bis zur vollen Wachheit (Schmerz, Entzug).', quellen: ['fi-naloxon', 'dgai-awr'] },
    { titel: 'Renarkotisierung', text: 'Naloxon wirkt etwa 30–90 Minuten, Piritramid deutlich länger. Nach der letzten Naloxongabe mindestens 60 Minuten überwachen. Verlegung erst mit Verlegungskriterien (Aldrete) und Freigabe der Anästhesie. Weitere Schmerzmittel ohne Opioid.', quellen: ['fi-naloxon', 'aldrete', 'dgai-awr'] },
    { titel: 'Deine Rolle', text: 'Im 3. Drittel ziehst du Notfallmedikamente nur mit Anleitung auf. Naloxon i. v. gibt die Ärztin oder eine Pflegefachperson nach Anordnung. Eine Anordnung, die zur Lage nicht passt (Opioid kurz nach Naloxon), hinterfragst du.', quellen: ['dgai-awr'] },
  ],

  pruefwege: {
    muster: [
      { art: 'massnahme', id: 'ersteindruck-abcde' },
      { art: 'massnahme', id: 'af-zaehlen' },
      { art: 'massnahme', id: 'bewusstsein-avpu' },
      { art: 'massnahme', id: 'weckreiz-geben' },
      { art: 'massnahme', id: 'atemwege-freimachen' },
      { art: 'massnahme', id: 'etco2-anschliessen' },
      { art: 'anruf', an: 'aerztin', sbar: ['s-atemdepression', 'b-osas-opioid', 'a-af-niedrig', 'a-vigilanz', 'a-etco2', 'r-kommen'] },
      { art: 'rueckmelden', anordnung: 'an-naloxon-richten', rueckgelesen: true },
      { art: 'massnahme', id: 'oberkoerper-hoch' },
      { art: 'anleitung-anfordern', massnahme: 'notfallmedikament-vorbereiten' },
      { art: 'massnahme', id: 'notfallmedikament-vorbereiten' },
      { art: 'massnahme', id: 'weckreiz-geben' },
      { art: 'massnahme', id: 'kurve-lesen' },
      { art: 'warten', sek: 300 },
      { art: 'massnahme', id: 'af-zaehlen' },
      { art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: ['wert:af'] },
      { art: 'remonstrieren', anordnung: 'an-piritramid-nach', grund: 'Er war eben noch kaum weckbar, hat Schlafapnoe, und Naloxon wirkt kürzer als Piritramid.' },
      { art: 'anleitung-anfordern', massnahme: 'cpap-anlegen' },
      { art: 'massnahme', id: 'cpap-anlegen' },
      { art: 'frage', id: 'g-erklaeren' },
      { art: 'massnahme', id: 'verlegungskriterien-pruefen' },
      { art: 'frage', id: 'g-station-nein' },
      { art: 'dokumentieren', bausteine: ['wert:af', 'anordnung:an-naloxon-richten', 'massnahme:cpap-anlegen', 'a-vigilanz'] },
      { art: 'warten', sek: 120 },
      { art: 'abschluss', probleme: ['pb-atmung', 'pb-renarkose', 'pb-schmerz', 'pb-hypothermie'], ziele: ['z-atmung', 'z-schmerz', 'z-waerme'],
        verdacht: 'v-opioid', begruendung: ['bg-af', 'bg-etco2', 'bg-naloxon'],
        sbar: ['s-atemdepression', 'b-osas-opioid', 'a-af-niedrig', 'a-vigilanz', 'a-etco2'] },
    ],
    unterlassung: { bisSek: 1200, erwartet: { wert: 'etco2', vergleich: '>', grenze: 50 } },
    grenze: { rolle: 3, events: [{ art: 'massnahme', id: 'naloxon-iv' }], erwartet: 'pa-eingriff' },
  },
};
