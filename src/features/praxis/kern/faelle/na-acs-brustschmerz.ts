// Fallwelle P16b (CE06) · Spur B Notaufnahme: Brustschmerz mit ST-Hebungen (STEMI), Ersteinschätzung bis Herzkatheterlabor
// Entwurf, fachlich UNGEPRÜFT. Inhalte fiktiv/didaktisch. Migriert und neu geschrieben aus dem Altfall „zna“ (scenarios.json).
// Rolle wählbar: Azubi 3. Drittel oder Pflegefachperson (E11). Ärztliche Handlungen bleiben ärztlich.

import { KATALOG } from '../katalog';
import type { ArztRegel, Bedingung, FallV2, MassnahmeDefinition } from '../typen';

const aus = (id: string, mehr: Partial<MassnahmeDefinition>): MassnahmeDefinition => ({ ...KATALOG[id]!, ...mehr });

const EKG_GESCHRIEBEN: Bedingung = { getan: 'ekg-12-kanal' };
const SILDENAFIL_BEKANNT: Bedingung = { getan: 'frage:g-medikamente' };
const NITRO_GEGEBEN: Bedingung = { getan: 'nitro-spray' };
const KEIN_KREISLAUF: Bedingung = { wert: 'hf', vergleich: '<', grenze: 10 };
const STEMI_ANORDNUNG = 'Hebungen in II, III und aVF: Das ist ein Hinterwandinfarkt. Ich komme, das Katheterlabor wird alarmiert. ASS 250 mg i. v. und Heparin 5000 IE i. v., venöse Blutentnahme mit Troponin. Defi-Elektroden kleben.';
const KONTROLLE = ' Sagen Sie mir in zehn Minuten Blutdruck und Schmerz.';

const KATHETER_REGEL: ArztRegel = {
  id: 'r-hkl', wenn: { ab: 0 },
  antwort: '„Danke. Das Katheterlabor ist bereit. Bringen Sie ihn bitte mit Monitor und Defi rüber, ich komme mit.“',
  anordnungen: ['an-hkl'], setzt: ['hkl-bereit'],
};

export const NA_ACS_BRUSTSCHMERZ: FallV2 = {
  schema: 2,
  id: 'na-acs-brustschmerz',
  version: '0.1.0',
  spur: 'B',
  setting: 'notaufnahme',
  altersgruppe: 'erwachsen',
  titel: '„Wie ein Elefant auf der Brust“',
  kurz: 'Notaufnahme, Vormittag: 59-Jähriger kommt zu Fuß mit Brustdruck, kaltschweißig. Das EKG zeigt Hebungen.',
  rahmen: 'Du arbeitest in der Zentralen Notaufnahme an der Ersteinschätzung. Ein Mann tritt an den Tresen und hält sich die Brust.',
  lernziele: [
    'Brustschmerz als Leitsymptom mit höchster Dringlichkeit einschätzen und den Patienten nicht mehr laufen lassen.',
    'Innerhalb von zehn Minuten nach Erstkontakt ein 12-Kanal-EKG schreiben und es der Ärztin zeigen.',
    'Gezielt nach Risikofaktoren und Medikamenten fragen (Potenzmittel und Nitrat) und eine gefährliche Anordnung hinterfragen.',
    'Eine Rhythmusstörung am Monitor erkennen und richtig reagieren (Patient ansehen, Hilfe, Defi bereit).',
    'Strukturiert an das Herzkatheterlabor übergeben und Zeitpunkte dokumentieren.',
  ],
  lehrplan: {
    ce: ['ce.06', 'ce.05'], abschnitt: ['ad3'],
    themen: ['thema.kl.herz.khk', 'thema.beo.notfall', 'thema.beo.vitalzeichen', 'thema.ph.medikamente', 'thema.pp.uebergabe'],
    kompetenzen: ['I.4.a', 'I.4.b', 'II.3.b', 'II.3.c', 'III.2.b'],
  },
  geeignet: { rollen: [3, 'pflegefachperson'], stufen: [2, 3] },
  dauerMin: [18, 28],
  freigabe: {
    status: 'entwurf',
    pruefpunkte: [
      'Ablauf gegen ESC-Leitlinie Akutes Koronarsyndrom 2023 prüfen (EKG ≤ 10 min, ASS-Dosis, Heparin, O₂ nur bei SpO₂ < 90 %, Nitrat-Kontraindikationen)',
      'Nitrat nach PDE-5-Hemmer: Sildenafil innerhalb 24 h (Tadalafil 48 h) als Kontraindikation korrekt dargestellt?',
      'Befugnisse: Triage im 3. Drittel mit Anleitung, Blutentnahme und i. v.-Medikamente richten mit Anleitung (Katalog P3) prüfen',
      'Ersteinschätzung nach MTS: Brustschmerz mit Kaltschweißigkeit „rot/sofort“ (Hausstandard) prüfen',
      'Raumfoto: 16 Triage passt; Behandlungsplatz 17 zeigt einen jüngeren Patienten (Beispielbild)',
      'Modell: Ausgangswerte (RR um 130/90, HF um 100) und Morphinwirkung (G1) plausibel?',
    ],
  },
  quellen: [
    { id: 'esc-acs-2023', titel: 'ESC Guidelines for the management of acute coronary syndromes 2023', fundstelle: 'Byrne R. A. et al., Eur Heart J 2023;44:3720–3826' },
    { id: 'dgk-pocket-acs', titel: 'DGK Pocket-Leitlinie Akutes Koronarsyndrom (deutsche Fassung der ESC 2023)', fundstelle: 'Deutsche Gesellschaft für Kardiologie, 2024' },
    { id: 'mts', titel: 'Manchester-Triage-System (deutsche Fassung)', fundstelle: 'Indikator Brustschmerz' },
    { id: 'fi-gtn', titel: 'Fachinformation Glyceroltrinitrat-Spray', fundstelle: 'Gegenanzeigen: PDE-5-Hemmer, systolischer RR < 90 mmHg' },
  ],

  person: {
    name: 'Herr Brandt',
    alter: { jahre: 59 },
    geschlecht: 'm',
    biografie: ['Elektromeister mit eigenem Betrieb', 'verheiratet, die Ehefrau parkt gerade das Auto', 'raucht seit 40 Jahren'],
    diagnosenBekannt: ['arterielle Hypertonie', 'Hypercholesterinämie', 'Nikotinabusus'],
    medikamentePlan: ['Amlodipin 5 mg 1-0-0', 'Atorvastatin 20 mg 0-0-1'],
    allergien: ['keine bekannt'],
    gewichtKg: 91,
  },
  medien: {
    raum: '16_notaufnahme_triage',
    raumVarianten: [{ wenn: { getan: 'monitor-anlegen' }, raum: '17_notaufnahme_untersuchung_sensor_an' }],
  },
  uebernahme: 'Ein Mann, etwa 60, kommt zu Fuß an den Tresen: „Ich hab so einen Druck auf der Brust, seit einer halben Stunde.“ Er ist blass, auf der Stirn steht Schweiß. Im Wartebereich sitzen zwölf Menschen.',
  startUhrzeit: '10:05',

  start: {
    // Ischämie: Pumpleistung leicht gemindert, Sympathikus (Angst, Schmerz) hebt Puls und Druck
    grund: { pumpleistung: 0.9, gefaesstonus: 0.94, schmerz: 8, angst: 0.6, uebelkeit: 0.4, gasaustausch: 0.97, laktat: 1.6, kalium: 4.2 },
    treiber: [],
    module: {},
    bild: { haltung: 'sitzt', haut: 'blass-kaltschweissig', mimik: 'schmerz' },
  },

  massnahmen: [
    // Gespräch & Beobachten
    'beschwerden-erfragen', 'beruhigen-zusprechen', 'ersteindruck-abcde', 'triage-ersteinschaetzung', 'haut-beobachten', 'schmerz-nrs', 'bewusstsein-avpu',
    // Akut
    'ueberwachungsplatz', 'zum-roentgen-laufen', 'o2-geben', 'defi-vorbereiten', 'rea-team-alarmieren', 'bls-herzdruckmassage',
    // Messen
    'monitor-anlegen', 'rr-messen', 'ekg-12-kanal', 'blutentnahme-venoes', 'bz-messen', 'kurve-lesen',
    // Versorgen
    'ass-richten', 'heparin-richten', 'morphin-richten', 'nitro-spray',
    // Melden
    'verlegung-uebergabe', 'pflegebericht',
  ],
  massnahmenZusatz: [
    aus('oberkoerper-hoch', { id: 'ueberwachungsplatz', name: 'Liegend auf der Trage zum Überwachungsplatz bringen, Oberkörper leicht hoch', setzt: ['liegt-ueberwacht'], wirkung: [{ groesse: 'angst', delta: -0.1, beginnSek: 0, spitzeSek: 60, dauerSek: 'dauerhaft' }] }),
    aus('mobilisieren-transfer', { id: 'zum-roentgen-laufen', name: 'Selbst zum Röntgen gehen lassen, bis ein Platz frei ist', zeitbedarfSekunden: 60, setzt: ['gelaufen'] }),
    aus('rr-messen', { name: 'Blutdruck am Monitor neu messen (NIBP)', geraet: undefined }),
    aus('iv-medikament-vorbereiten', { id: 'ass-richten', name: 'ASS 250 mg i. v. richten und mit der Praxisanleitung geben', setzt: ['ass'] }),
    aus('iv-medikament-vorbereiten', { id: 'heparin-richten', name: 'Heparin 5000 IE i. v. richten und mit der Praxisanleitung geben', setzt: ['heparin'] }),
    aus('iv-medikament-vorbereiten', {
      id: 'morphin-richten', name: 'Morphin 3 mg i. v. richten und mit der Praxisanleitung langsam geben', setzt: ['morphin'],
      treiber: [{ art: 'wirkstoff', id: 'morphin', dosisMg: 3, weg: 'iv' }],
      wirkung: [{ groesse: 'angst', delta: -0.2, beginnSek: 60, spitzeSek: 300, dauerSek: 'dauerhaft' }],
    }),
    aus('bedarfsmedikation-oral', {
      id: 'nitro-spray', name: 'Glyceroltrinitrat 2 Hübe sublingual geben', setzt: ['nitro'],
      wirkung: [{ groesse: 'gefaesstonus', delta: -0.12, beginnSek: 30, spitzeSek: 180, dauerSek: 1200 }],
    }),
    aus('verlegung-uebergabe', { name: 'Übergabe an das Herzkatheterlabor (mit Monitor und Defi begleiten)', voraussetzung: { anordnung: 'an-hkl' }, setzt: ['im-hkl'] }),
  ],

  akte: {
    aufnahmegrund: 'Selbstvorstellung 10:05 Uhr: retrosternaler Druck seit etwa 09:30 Uhr, in Ruhe begonnen, Ausstrahlung in den linken Arm und Kiefer, Übelkeit, Kaltschweißigkeit.',
    anamnese: ['Hypertonie seit 10 Jahren, Hypercholesterinämie', 'Raucher, etwa 30 Zigaretten am Tag', 'Vater mit 62 an einem Herzinfarkt verstorben', 'Bisher keine Herzbeschwerden bekannt'],
    diagnosen: [
      { text: 'Arterielle Hypertonie', icd: 'I10.90', seit: '2016' },
      { text: 'Hypercholesterinämie', icd: 'E78.0', seit: '2019' },
    ],
    medikation: [
      { id: 'mp-amlodipin', wirkstoff: 'Amlodipin', staerke: '5 mg', form: 'Tbl.', schema: '1-0-0-0', zuletzt: 'heute 07:00' },
      { id: 'mp-atorvastatin', wirkstoff: 'Atorvastatin', staerke: '20 mg', form: 'Tbl.', schema: '0-0-1-0', zuletzt: 'gestern 20:00' },
    ],
    vorwerte: [
      { zeit: 'vor 3 Monaten (Hausarzt)', vorH: 2200, werte: { rrSys: 152, rrDia: 94, hf: 78 }, kuerzel: 'HA' },
    ],
    pflegebericht: [
      { zeit: 'heute 10:05', wer: 'Anmeldung', text: 'Selbstvorstellung, zu Fuß. Leitsymptom Brustschmerz. Medikamentenplan vom Hausarzt (Amlodipin, Atorvastatin) liegt vor.' },
    ],
    aerztlicheAnordnungen: [
      { zeit: 'Standard', wer: 'ZNA', text: 'Brustschmerz: 12-Kanal-EKG innerhalb von 10 Minuten nach Erstkontakt, sofort der diensthabenden Ärztin zeigen. O₂ nur bei SpO₂ unter 90 %.' },
    ],
    labor: [
      { name: 'LDL-Cholesterin', wert: '168', einheit: 'mg/dl', norm: 'unter 116', datum: 'vor 3 Monaten (Hausarzt)', auffaellig: true },
    ],
    rechtliches: ['Keine Patientenverfügung. Einwilligungsfähig, wach und orientiert.', 'Ehefrau ist auf dem Weg, Auskunft nur mit seinem Einverständnis.'],
  },

  befunde: [
    { massnahme: 'beschwerden-erfragen', varianten: [{ text: '„Seit halb zehn, im Sitzen am Schreibtisch. Ein Druck wie ein Elefant auf der Brust, zieht in den linken Arm und in den Kiefer. Mir ist schlecht.“ Kein Fieber, kein Husten.' }] },
    { massnahme: 'ersteindruck-abcde', varianten: [{ text: 'A frei, spricht in kurzen Sätzen. B: etwas schnell, keine Zyanose. C: blass, kaltschweißig, Puls schnell und regelmäßig. D: wach, ängstlich, orientiert. E: hält sich die Brust, Druckschmerz nicht auslösbar.' }] },
    { massnahme: 'triage-ersteinschaetzung', varianten: [{ text: 'Leitsymptom Brustschmerz, starker Schmerz und Kaltschweißigkeit: höchste Dringlichkeit, sofortige ärztliche Sichtung. Nicht zurück in den Wartebereich.' }] },
    { massnahme: 'haut-beobachten', varianten: [{ text: 'Blass, Stirn und Oberlippe kaltschweißig, Hände kühl.' }] },
    { massnahme: 'schmerz-nrs', varianten: [
      { wenn: { flag: 'morphin' }, text: '„Besser. Vielleicht noch sechs von zehn.“' },
      { text: '„Acht von zehn, mindestens.“' },
    ] },
    { massnahme: 'bewusstsein-avpu', varianten: [{ text: 'AVPU {avpu}, orientiert.', zeigt: ['avpu'] }] },
    { massnahme: 'monitor-anlegen', varianten: [{ text: 'Monitor: Sinustachykardie {hf}/min, RR {rrSys}/{rrDia} mmHg, SpO₂ {spo2} %, AF {af}/min.', zeigt: ['hf', 'rrSys', 'rrDia', 'spo2', 'af', 'rhythmus'] }] },
    { massnahme: 'rr-messen', varianten: [{ text: 'NIBP: {rrSys}/{rrDia} mmHg, HF {hf}/min.', zeigt: ['rrSys', 'rrDia', 'hf'] }] },
    { massnahme: 'ekg-12-kanal', varianten: [{ text: 'Sinusrhythmus {hf}/min. Deutliche Hebungen der ST-Strecke in II, III und aVF, Senkungen in I und aVL. Sofort der Ärztin zeigen (Befund durch die Ärztin).', zeigt: ['rhythmus'] }] },
    { massnahme: 'blutentnahme-venoes', varianten: [{ text: 'Mit der Praxisanleitung abgenommen: Blutbild, Elektrolyte, Gerinnung, Kreatinin, Troponin T hs. Ins Labor als Notfall.' }] },
    { massnahme: 'bz-messen', varianten: [{ text: 'BZ {bz} mg/dl.', zeigt: ['bz'] }] },
    { massnahme: 'kurve-lesen', varianten: [{ text: 'Medikamentenplan vom Hausarzt: Amlodipin, Atorvastatin. Ein Potenzmittel steht nicht darauf.' }] },
    { massnahme: 'defi-vorbereiten', varianten: [{ text: 'Defi-Elektroden geklebt, Notfallwagen steht am Platz.' }] },
    { massnahme: 'ass-richten', varianten: [{ text: 'ASS 250 mg i. v. mit der Praxisanleitung kontrolliert (6 R) und gegeben, Uhrzeit notiert.' }] },
    { massnahme: 'heparin-richten', varianten: [{ text: 'Heparin 5000 IE i. v. mit der Praxisanleitung kontrolliert und gegeben.' }] },
    { massnahme: 'morphin-richten', varianten: [{ text: 'Morphin 3 mg i. v. langsam gegeben. Atemfrequenz und Bewusstsein im Blick behalten.' }] },
    { massnahme: 'nitro-spray', varianten: [{ text: 'Zwei Hübe unter die Zunge.' }] },
    { massnahme: 'zum-roentgen-laufen', varianten: [{ text: 'Er steht auf und geht langsam los. Nach ein paar Schritten bleibt er stehen und stützt sich an der Wand ab.' }] },
  ],

  gespraech: [
    { id: 'g-medikamente', frage: 'Welche Medikamente nehmen Sie, auch frei gekaufte oder Potenzmittel?', an: 'patient', kompetenzbereiche: ['I', 'IV'],
      antwort: [{ text: 'Er zögert: „Blutdrucktabletten, Cholesterin … und gestern Abend hab ich so eine blaue genommen. Sildenafil. Muss das jemand wissen?“' }],
      fakten: ['Sildenafil gestern Abend gegen 22 Uhr', 'Amlodipin, Atorvastatin'] },
    { id: 'g-einwilligung', frage: 'Ihre Frau kommt gleich. Darf ich ihr sagen, was los ist?', an: 'patient', kompetenzbereiche: ['II', 'IV'],
      antwort: [{ text: '„Ja, natürlich. Aber das mit der Tablette, das bitte nicht.“', setzt: ['einwilligung-ehefrau'] }] },
    { id: 'g-beruhigen', frage: 'Erklären, was passiert, und dass er nicht allein ist', an: 'patient', kompetenzbereiche: ['II'],
      antwort: [{ text: 'Er atmet etwas ruhiger: „Okay. Bleiben Sie hier?“' }],
      wirkung: [{ groesse: 'angst', delta: -0.15, beginnSek: 0, spitzeSek: 60, dauerSek: 'dauerhaft' }] },
    { id: 'g-ehefrau', frage: 'Ehefrau informieren: Verdacht auf Herzinfarkt, gleich Herzkatheter, sie kann mitkommen', an: 'angehoerige', kompetenzbereiche: ['II', 'IV'],
      nurWenn: { ab: 480 },
      schweigepflicht: { erlaubtWenn: { flag: 'einwilligung-ehefrau' }, fehlerText: 'Herr Brandt ist wach und kann selbst entscheiden. Erst fragen, ob seine Frau informiert werden darf.' },
      antwort: [{ text: 'Frau Brandt: „Ich hab’s geahnt, er wollte nicht fahren lassen. Kann ich mit?“ Sie setzt sich ans Kopfende und hält seine Hand.', setzt: ['ehefrau-informiert'] }],
      fakten: ['Verdacht auf Herzinfarkt', 'Herzkatheter gleich', 'Sildenafil nur mit seiner Zustimmung erwähnen'] },
  ],

  sbar: [
    { id: 's-acs', teil: 'S', text: 'Herr Brandt, 59, Brustdruck seit 30 Minuten, kaltschweißig: Verdacht auf akutes Koronarsyndrom.', art: 'kern' },
    { id: 's-magen', teil: 'S', text: 'Ein Mann mit Magenbeschwerden.', art: 'falsch' },
    { id: 'b-risiko', teil: 'B', text: 'Hypertonie, hohes Cholesterin, Raucher, Vater mit Infarkt.', art: 'kern' },
    { id: 'b-sildenafil', teil: 'B', text: 'Hat gestern Abend Sildenafil genommen.', art: 'kern', bekanntWenn: SILDENAFIL_BEKANNT },
    { id: 'b-betrieb', teil: 'B', text: 'Er hat einen eigenen Elektrobetrieb.', art: 'ablenker' },
    { id: 'a-ekg-hebung', teil: 'A', text: 'EKG: Hebungen in II, III und aVF.', art: 'kern', bekanntWenn: EKG_GESCHRIEBEN },
    { id: 'a-schmerz', teil: 'A', text: 'Schmerz NRS 8, Ausstrahlung linker Arm und Kiefer, Übelkeit.', art: 'kern' },
    { id: 'a-kreislauf', teil: 'A', text: 'Puls um 100, Blutdruck um 130 systolisch, SpO₂ ausreichend.', art: 'hilfreich', bekanntWenn: { getan: 'monitor-anlegen' } },
    { id: 'r-sofort', teil: 'R', text: 'Bitte kommen Sie sofort, ich schicke Ihnen das EKG.', art: 'kern' },
    { id: 'r-o2', teil: 'R', text: 'Soll ich ihm Sauerstoff geben?', art: 'ablenker' },
    { id: 'r-hkl-uebergabe', teil: 'R', text: 'ASS und Heparin gegen Viertel nach zehn gegeben, Morphin 3 mg, kein Nitro wegen Sildenafil. Defi-Elektroden kleben, eine kurze VT-Salve um 10:17.', art: 'hilfreich',
      bekanntWenn: { alle: [{ getan: 'ass-richten' }, { getan: 'heparin-richten' }] } },
  ],

  anordnungen: [
    { id: 'an-ass', massnahme: 'ass-richten', text: 'ASS 250 mg i. v.' },
    { id: 'an-heparin', massnahme: 'heparin-richten', text: 'Heparin 5000 IE i. v.' },
    { id: 'an-labor', massnahme: 'blutentnahme-venoes', text: 'Venöse Blutentnahme: Blutbild, Elektrolyte, Gerinnung, Kreatinin, Troponin.' },
    { id: 'an-nitro', massnahme: 'nitro-spray', text: 'Glyceroltrinitrat 2 Hübe sublingual gegen den Schmerz.',
      fehlerhaft: {
        warum: 'Herr Brandt hat gestern Abend Sildenafil genommen. Nitrat und PDE-5-Hemmer zusammen können den Blutdruck gefährlich stark senken. Bei Hinterwandinfarkt mit möglicher Beteiligung der rechten Kammer ist Nitrat zusätzlich riskant.',
        korrektur: 'Gut, dass Sie fragen. Dann kein Nitro. Morphin 3 mg i. v. langsam, Atmung beobachten.',
        ersatz: 'an-morphin',
      } },
    { id: 'an-morphin', massnahme: 'morphin-richten', text: 'Morphin 3 mg i. v. langsam, bei Bedarf nach Rücksprache wiederholen.' },
    { id: 'an-hkl', massnahme: 'verlegung-uebergabe', text: 'Sofort ins Herzkatheterlabor, mit Monitor und Defi.' },
  ],

  arzt: {
    name: 'Dr. Engel (Notaufnahme)',
    erreichbar: 'vor-ort',
    // genau → allgemein: mit Sildenafil gleich ohne Nitro, ohne EKG Rückfrage
    regeln: [
      { id: 'r-stemi-sildenafil', wenn: { alle: [{ gemeldet: ['s-acs', 'a-ekg-hebung', 'b-sildenafil'] }] },
        antwort: `„${STEMI_ANORDNUNG} Wegen des Sildenafils kein Nitro, gegen den Schmerz Morphin 3 mg i. v.${KONTROLLE}“`,
        anordnungen: ['an-ass', 'an-heparin', 'an-labor', 'an-morphin'], setzt: ['stemi-gemeldet', 'nitro-vermieden'], auftraege: ['af-kontrolle'] },
      { id: 'r-stemi', wenn: { gemeldet: ['s-acs', 'a-ekg-hebung'] },
        antwort: `„${STEMI_ANORDNUNG} Gegen den Schmerz zwei Hübe Nitro.${KONTROLLE}“`,
        anordnungen: ['an-ass', 'an-heparin', 'an-labor', 'an-nitro'], setzt: ['stemi-gemeldet'], auftraege: ['af-kontrolle'] },
      { id: 'r-ekg-frage', wenn: { gemeldet: ['s-acs'] },
        antwort: '„Ich bin im Schockraum. Brustschmerz und kaltschweißig, das klingt ernst.“',
        rueckfrage: { text: '„Haben Sie schon ein 12-Kanal-EKG? Was zeigt es?“', erwartet: ['a-ekg-hebung'] } },
      { wenn: { eine: [{ gemeldet: ['s-magen'] }, { gemeldet: ['r-o2'] }] },
        antwort: '„Sauerstoff nur, wenn die Sättigung unter 90 % liegt. Schreiben Sie erst ein EKG und melden Sie sich dann richtig.“', setzt: ['arzt-verzoegert'] },
    ],
    auftraege: [
      { id: 'af-kontrolle', text: 'Blutdruck und Schmerz nach etwa zehn Minuten der Ärztin melden', erledigt: { alle: [{ getan: 'rr-messen' }, { getan: 'schmerz-nrs' }] },
        meldung: ['wert:rrSys', 'wert:schmerz'], meldenBinnenSek: 900, folge: [KATHETER_REGEL] },
    ],
  },
  team: { kollegin: 'Kai (Pflegefachmann, Notaufnahme)', weitere: { angehoerige: 'Ehefrau Petra Brandt', 'aufnehmende-station': 'Herzkatheterlabor, Pflegefachfrau Ines' } },

  ereignisse: [
    { id: 'e-ehefrau', art: 'angehoerige', wann: { ab: 480 },
      text: 'Frau Brandt kommt aufgeregt an den Platz: „Was ist mit ihm? Ist es das Herz?“' },
    { id: 'e-vt-salve', art: 'geraet', wann: { alle: [{ getan: 'monitor-anlegen' }, { ab: 720 }] },
      text: 'Der Monitor alarmiert rot: breite Kammerkomplexe, sehr schnell. Herr Brandt sagt: „Mir wird ganz komisch.“',
      modul: { rhythmus: 'vt' },
      entscheidung: [
        { id: 'w-ansehen', text: 'Ihn ansehen und ansprechen, Puls tasten, Hilfe rufen, Defi bereit', wertung: 'gut', setzt: ['vt-erkannt'], modul: { rhythmus: null },
          warum: 'Erst der Patient, dann der Monitor: Er ist wach, der Puls tastbar. Die Salve hört nach wenigen Sekunden auf. Ärztin informieren, Defi bleibt geklebt.' },
        { id: 'w-quittieren', text: 'Alarm quittieren, das ist sicher ein Artefakt', wertung: 'gefaehrlich', modul: { rhythmus: null }, setzt: ['vt-ignoriert'],
          warum: 'Ventrikuläre Salven beim Infarkt können in Kammerflimmern übergehen. Ein Alarm wird nie ohne Blick auf den Patienten quittiert.' },
        { id: 'w-druecken', text: 'Sofort mit der Herzdruckmassage beginnen', wertung: 'falsch', modul: { rhythmus: null },
          warum: 'Er ist wach und hat Puls. Herzdruckmassage nur ohne Lebenszeichen.' },
      ] },
    // Unterlassung: ohne Monitor bleibt er im Wartebereich
    { id: 'e-kammerflimmern', art: 'komplikation', wann: { nichtGetan: 'monitor-anlegen', bis: 540 },
      text: 'Im Wartebereich ruft jemand: Herr Brandt ist vom Stuhl gerutscht, reagiert nicht und schnappt nach Luft.',
      modul: { rhythmus: 'kammerflimmern' }, bild: { haltung: 'am-boden', haut: 'zyanotisch' } },
    { id: 'e-defibrilliert', art: 'team', wann: { alle: [KEIN_KREISLAUF, { getan: 'bls-herzdruckmassage' }, { getan: 'defi-vorbereiten' }, { getan: 'rea-team-alarmieren' }] },
      text: 'Dr. Engel defibrilliert. Nach zwei Minuten Herzdruckmassage hat Herr Brandt wieder einen Puls und stöhnt.',
      modul: { rhythmus: null } },
  ],

  pa: {
    name: 'Praxisanleiter Jonas Weber (Fachpflege Notfall)',
    hilfen: [
      { wenn: { nicht: { getan: 'ekg-12-kanal' } }, impuls: 'Was ist bei Brustschmerz die wichtigste Untersuchung in den ersten zehn Minuten?', tipp: 'Ein 12-Kanal-EKG schreiben und es sofort der Ärztin zeigen.' },
      { wenn: { nicht: { getan: 'monitor-anlegen' } }, impuls: 'Wo ist er am sichersten, bis die Ärztin kommt?', tipp: 'Liegend an einen Überwachungsplatz, Monitor dran. Nicht mehr laufen lassen.' },
      { wenn: { nicht: SILDENAFIL_BEKANNT }, impuls: 'Weißt du alles über seine Medikamente, bevor jemand Nitro anordnet?', tipp: 'Frag ausdrücklich nach Potenzmitteln. Nitro nach Sildenafil ist gefährlich.' },
      { wenn: { auftrag: 'af-kontrolle', status: 'offen' }, impuls: 'Worauf wartet Dr. Engel noch?', tipp: 'Blutdruck neu messen, Schmerz erfragen und beides melden.' },
      { impuls: 'Was braucht das Katheterlabor von dir?', tipp: 'Zeitpunkte (Schmerzbeginn, EKG, Medikamente), Allergien, Sildenafil, Rhythmusereignisse.' },
    ],
  },

  bewertung: {
    pflicht: [
      { id: 'p-triage', text: 'Höchste Dringlichkeit erkannt, liegend an einen Überwachungsplatz', gewicht: 2, kompetenzbereiche: ['I', 'III'], klinisch: ['abcde'],
        erfuellt: { alle: [{ getan: 'triage-ersteinschaetzung' }, { getan: 'ueberwachungsplatz', bis: 300 }] }, warum: 'Brustschmerz mit Kaltschweißigkeit gehört nicht in den Wartebereich.' },
      { id: 'p-monitor', text: 'Monitor in den ersten fünf Minuten', gewicht: 2, kompetenzbereiche: ['I'], klinisch: ['geraete', 'zeit'],
        erfuellt: { getan: 'monitor-anlegen', bis: 300 }, warum: 'Beim Infarkt drohen jederzeit Rhythmusstörungen. Nur am Monitor werden sie sofort bemerkt.' },
      { id: 'p-ekg', text: '12-Kanal-EKG innerhalb von 10 Minuten', gewicht: 3, kompetenzbereiche: ['I'], klinisch: ['abcde', 'zeit'],
        erfuellt: { getan: 'ekg-12-kanal', bis: 600 }, warum: 'Das EKG entscheidet über den Weg ins Katheterlabor. Zielzeit: 10 Minuten nach Erstkontakt (ESC 2023).' },
      { id: 'p-gemeldet', text: 'STEMI-Verdacht mit EKG-Befund gemeldet', gewicht: 3, kompetenzbereiche: ['II', 'III'], klinisch: ['team'],
        erfuellt: { flag: 'stemi-gemeldet' }, warum: 'Zeit ist Herzmuskel. Die Ärztin alarmiert das Katheterlabor nach deiner Meldung.' },
      { id: 'p-nitro', text: 'Kein Nitrat nach Sildenafil (gemeldet oder remonstriert)', gewicht: 3, kompetenzbereiche: ['III', 'IV'], klinisch: ['medikamente'],
        erfuellt: { alle: [{ eine: [{ flag: 'nitro-vermieden' }, { flag: 'remonstriert:an-nitro' }] }, { nicht: NITRO_GEGEBEN }] },
        warum: 'Wer ein Medikament gibt, trägt die Durchführungsverantwortung. Nitrat nach PDE-5-Hemmer kann einen schweren Blutdruckabfall auslösen.' },
      { id: 'p-defi', text: 'Defi-Elektroden geklebt', gewicht: 2, kompetenzbereiche: ['I'], klinisch: ['geraete'],
        erfuellt: { getan: 'defi-vorbereiten' }, warum: 'Kammerflimmern ist die häufigste Todesursache in der ersten Stunde des Infarkts.' },
      { id: 'p-medikamente', text: 'ASS und Heparin nach Anordnung mit Anleitung gegeben', gewicht: 2, kompetenzbereiche: ['I'], klinisch: ['medikamente'],
        erfuellt: { alle: [{ getan: 'ass-richten' }, { getan: 'heparin-richten' }] }, warum: 'Plättchenhemmung und Antikoagulation gehören zur Erstversorgung des STEMI.' },
      { id: 'p-labor', text: 'Blut mit Troponin abgenommen', gewicht: 1, kompetenzbereiche: ['I'], klinisch: ['abcde'],
        erfuellt: { getan: 'blutentnahme-venoes' }, warum: 'Troponin, Gerinnung und Nierenwerte braucht das Katheterteam. Beim STEMI wird darauf nicht gewartet.' },
      { id: 'p-vt', text: 'VT-Salve am Patienten geprüft, nicht weggedrückt', gewicht: 2, kompetenzbereiche: ['I', 'III'], klinisch: ['geraete'],
        erfuellt: { flag: 'vt-erkannt' }, warum: 'Erst der Patient, dann das Gerät. Salven sind Warnzeichen.' },
      { id: 'p-kontrolle', text: 'Rückauftrag Blutdruck und Schmerz gemeldet', gewicht: 2, kompetenzbereiche: ['II'], klinisch: ['team'],
        erfuellt: { auftrag: 'af-kontrolle', status: 'gemeldet' }, warum: 'Nach Morphin können Blutdruck und Atmung sinken. Die Ärztin braucht die Werte vor dem Transport.' },
      { id: 'p-ehefrau', text: 'Ehefrau mit Einverständnis informiert', gewicht: 1, kompetenzbereiche: ['II', 'IV'],
        erfuellt: { flag: 'ehefrau-informiert' }, warum: 'Angehörige beruhigen sich, wenn sie wissen, was passiert. Er ist einwilligungsfähig und entscheidet selbst.' },
      { id: 'p-doku', text: 'EKG-Zeitpunkt und Medikamente dokumentiert', gewicht: 1, kompetenzbereiche: ['I', 'IV'], klinisch: ['zeit'],
        erfuellt: { alle: [{ dokumentiert: 'befund:ekg-12-kanal' }, { dokumentiert: 'befund:ass-richten' }] }, warum: 'Erstkontakt bis EKG und bis Katheter sind Qualitätszeiten der Infarktversorgung.' },
      { id: 'p-uebergabe', text: 'Übergabe an das Katheterlabor mit Medikamenten und Sildenafil', gewicht: 2, kompetenzbereiche: ['II', 'III'], klinisch: ['team'],
        erfuellt: { alle: [{ getan: 'verlegung-uebergabe' }, { gesagt: 'b-sildenafil', an: 'aufnehmende-station' }, { gesagt: 'r-hkl-uebergabe', an: 'aufnehmende-station' }] },
        warum: 'Im Katheterlabor werden Nitrate oft gespritzt. Wer das Sildenafil nicht weitergibt, gefährdet ihn dort.' },
    ],
    fehler: [
      { id: 'f-nitro', text: 'Nitrat trotz Sildenafil gegeben', wenn: { alle: [NITRO_GEGEBEN, SILDENAFIL_BEKANNT] }, schwere: 'schwer', kompetenzbereiche: ['III', 'IV'],
        folge: { text: 'Fünf Minuten später: Herr Brandt wird grau, ihm wird schwarz vor Augen. Der Blutdruck fällt steil ab.',
          wirkung: [{ groesse: 'gefaesstonus', delta: -0.3, beginnSek: 0, spitzeSek: 240, dauerSek: 1500 }] },
        warum: 'Die Wechselwirkung war bekannt. Bei einer Anordnung, die nicht zum Patienten passt, musst du remonstrieren.' },
      { id: 'f-nitro-ungefragt', text: 'Nitrat gegeben, ohne nach Potenzmitteln zu fragen', wenn: { alle: [NITRO_GEGEBEN, { nicht: SILDENAFIL_BEKANNT }] }, schwere: 'mittel', kompetenzbereiche: ['I', 'III'],
        folge: { text: 'Der Blutdruck fällt deutlich, Herr Brandt wird schwindelig. Erst jetzt erzählt er von der blauen Tablette.',
          wirkung: [{ groesse: 'gefaesstonus', delta: -0.3, beginnSek: 0, spitzeSek: 240, dauerSek: 1500 }] },
        warum: 'Vor Nitrat gehört die Frage nach PDE-5-Hemmern zur Sicherheitsprüfung, auch wenn sie unangenehm ist.' },
      { id: 'f-laufen', text: 'Mit Infarktverdacht selbst laufen lassen', wenn: { getan: 'zum-roentgen-laufen' }, schwere: 'mittel', kompetenzbereiche: ['I', 'III'],
        folge: { text: 'Auf dem Gang wird ihm schwarz vor Augen, Kai fängt ihn ab.', wirkung: [{ groesse: 'pumpleistung', delta: -0.08, beginnSek: 0, spitzeSek: 60, dauerSek: 600 }] },
        warum: 'Belastung erhöht den Sauerstoffbedarf des Herzmuskels. Liegend transportieren.' },
      { id: 'f-o2-ohne-indikation', text: 'Sauerstoff ohne Hypoxämie gegeben', wenn: { alle: [{ getan: 'o2-geben' }, { wert: 'spo2', vergleich: '>=', grenze: 90 }] }, schwere: 'leicht', kompetenzbereiche: ['I', 'V'],
        warum: 'Bei SpO₂ ≥ 90 % bringt Sauerstoff beim Infarkt keinen Nutzen (ESC 2023).' },
      { id: 'f-vt-quittiert', text: 'Rhythmusalarm ohne Blick auf den Patienten quittiert', wenn: { flag: 'vt-ignoriert' }, schwere: 'schwer', kompetenzbereiche: ['I', 'III'],
        warum: 'Alarme werden am Patienten geprüft. Eine VT kann pulslos werden.' },
    ],
    ende: [
      { wenn: { flag: 'im-hkl' }, text: 'Herr Brandt liegt im Herzkatheterlabor. Das verschlossene Gefäß wird eröffnet.', ausgang: 'verlegt' },
      { wenn: { alle: [KEIN_KREISLAUF, { nichtGetan: 'bls-herzdruckmassage', bis: 840 }] }, text: 'Kammerflimmern ohne Herzdruckmassage. Das Reanimationsteam übernimmt, die Aussichten sind schlecht.', ausgang: 'verschlechtert' },
    ],
  },

  pflegebedarf: {
    probleme: [
      { id: 'pb-ischaemie', text: 'Herzmuskel-Minderdurchblutung mit Gefahr von Rhythmusstörungen und Pumpversagen', richtig: true, prioritaet: 1, warum: 'Lebensbedrohlich: Monitor, Defi, rascher Transport ins Katheterlabor.' },
      { id: 'pb-schmerz', text: 'Starker Brustschmerz mit Angst', richtig: true, prioritaet: 1, warum: 'Schmerz und Angst erhöhen den Sauerstoffbedarf des Herzens.' },
      { id: 'pb-blutung', text: 'Blutungsgefahr unter ASS und Heparin', richtig: true, prioritaet: 2, warum: 'Punktionsstellen beobachten, keine i. m.-Injektionen.' },
      { id: 'pb-wechselwirkung', text: 'Gefahr eines Blutdruckabfalls durch Nitrat nach Sildenafil', richtig: true, prioritaet: 2, warum: 'Muss bei jeder Übergabe genannt werden.' },
      { id: 'pb-rauchen', text: 'Rauchentwöhnung', richtig: false, warum: 'Wichtig für später (CE04), aber nicht jetzt.' },
    ],
    ziele: [
      { id: 'z-hkl', text: 'Innerhalb der Zielzeit im Katheterlabor, ohne Rhythmusereignis unbemerkt', passtZu: ['pb-ischaemie'], richtig: true },
      { id: 'z-schmerz', text: 'Schmerz NRS unter 4, Herr Brandt fühlt sich begleitet', passtZu: ['pb-schmerz'], richtig: true },
      { id: 'z-kein-nitro', text: 'Kein Nitrat, Sildenafil bei der Übergabe genannt', passtZu: ['pb-wechselwirkung'], richtig: true },
      { id: 'z-rauchfrei', text: 'Herr Brandt raucht ab heute nicht mehr', passtZu: ['pb-rauchen'], richtig: false },
    ],
  },
  verdacht: {
    optionen: [
      { id: 'v-stemi', text: 'Akutes Koronarsyndrom: ST-Hebungsinfarkt der Hinterwand', richtig: true },
      { id: 'v-magen', text: 'Reflux oder Magenschleimhautentzündung', richtig: false },
      { id: 'v-le', text: 'Lungenembolie', richtig: false },
    ],
    begruendungen: [
      { id: 'bg-ekg', text: 'ST-Hebungen in II, III, aVF', stuetzt: ['v-stemi'] },
      { id: 'bg-schmerz', text: 'Drückender Schmerz in Ruhe mit Ausstrahlung in Arm und Kiefer, Kaltschweißigkeit', stuetzt: ['v-stemi'] },
      { id: 'bg-risiko', text: 'Rauchen, Hypertonie, Cholesterin, Vater mit Infarkt', stuetzt: ['v-stemi'] },
      { id: 'bg-uebel', text: 'Übelkeit', stuetzt: ['v-magen'] },
    ],
  },
  leitfaden: [
    { titel: 'Brustschmerz in der Notaufnahme', quellen: ['mts', 'esc-acs-2023'],
      text: 'Brustschmerz mit Kaltschweißigkeit, Übelkeit oder Atemnot hat höchste Dringlichkeit. Den Patienten nicht mehr laufen lassen, liegend an einen Überwachungsplatz, Monitor, 12-Kanal-EKG innerhalb von 10 Minuten nach Erstkontakt, sofort der Ärztin zeigen.' },
    { titel: 'STEMI: Zeit ist Herzmuskel', quellen: ['esc-acs-2023', 'dgk-pocket-acs'],
      text: 'ST-Hebungen in zwei benachbarten Ableitungen bei passenden Beschwerden: Katheterlabor sofort alarmieren, Ziel Wiedereröffnung innerhalb von 120 Minuten nach Diagnose (in der Klinik deutlich schneller). ASS und Heparin nach Anordnung. Sauerstoff nur bei SpO₂ unter 90 %.' },
    { titel: 'Nitrat: Gegenanzeigen prüfen', quellen: ['fi-gtn', 'esc-acs-2023'],
      text: 'Kein Nitrat bei systolischem Blutdruck unter 90 mmHg, nach PDE-5-Hemmern (Sildenafil 24 h, Tadalafil 48 h) und Vorsicht bei Rechtsherzbeteiligung (Hinterwandinfarkt). Immer gezielt nach Potenzmitteln fragen. Passt eine Anordnung nicht, wird remonstriert.' },
    { titel: 'Rhythmusstörungen in der ersten Stunde',
      text: 'Kammerflimmern ist die häufigste Todesursache in der Frühphase. Darum Monitor und Defi-Elektroden. Bei Alarm zuerst den Patienten ansehen: wach mit Puls → Ärztin, Defi bereit; ohne Lebenszeichen → Reanimation.' },
    { titel: 'Morphin beobachten',
      text: 'Morphin lindert Schmerz und Angst, kann aber Atmung und Blutdruck senken und Übelkeit verstärken. Nach der Gabe Atemfrequenz, Bewusstsein, Blutdruck und Schmerz neu einschätzen.' },
  ],

  pruefwege: {
    muster: [
      { art: 'massnahme', id: 'triage-ersteinschaetzung' },
      { art: 'massnahme', id: 'ueberwachungsplatz' },
      { art: 'massnahme', id: 'monitor-anlegen' },
      { art: 'massnahme', id: 'ekg-12-kanal' },
      { art: 'frage', id: 'g-medikamente' },
      { art: 'anruf', an: 'aerztin', sbar: ['s-acs', 'b-risiko', 'b-sildenafil', 'a-ekg-hebung', 'a-schmerz', 'a-kreislauf', 'r-sofort'] },
      { art: 'rueckmelden', anordnung: 'an-ass', rueckgelesen: true },
      { art: 'rueckmelden', anordnung: 'an-heparin', rueckgelesen: true },
      { art: 'rueckmelden', anordnung: 'an-labor', rueckgelesen: true },
      { art: 'rueckmelden', anordnung: 'an-morphin', rueckgelesen: true },
      { art: 'massnahme', id: 'defi-vorbereiten' },
      { art: 'massnahme', id: 'ass-richten' },
      { art: 'massnahme', id: 'heparin-richten' },
      { art: 'massnahme', id: 'morphin-richten' },
      { art: 'massnahme', id: 'rr-messen' },
      { art: 'massnahme', id: 'schmerz-nrs' },
      { art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: ['wert:rrSys', 'wert:schmerz'] },
      { art: 'rueckmelden', anordnung: 'an-hkl', rueckgelesen: true },
      { art: 'massnahme', id: 'blutentnahme-venoes' },
      { art: 'frage', id: 'g-einwilligung' },
      { art: 'frage', id: 'g-ehefrau' },
      { art: 'dokumentieren', bausteine: ['befund:ekg-12-kanal', 'befund:ass-richten', 'befund:heparin-richten', 'befund:morphin-richten', 'wert:rrSys'] },
      { art: 'nachricht', an: 'aufnehmende-station', kanal: 'telefon', bausteine: ['s-acs', 'b-risiko', 'b-sildenafil', 'a-ekg-hebung', 'r-hkl-uebergabe'] },
      { art: 'massnahme', id: 'verlegung-uebergabe' },
      { art: 'abschluss', probleme: ['pb-ischaemie', 'pb-schmerz', 'pb-blutung', 'pb-wechselwirkung'], ziele: ['z-hkl', 'z-schmerz', 'z-kein-nitro'],
        verdacht: 'v-stemi', begruendung: ['bg-ekg', 'bg-schmerz', 'bg-risiko'],
        sbar: ['s-acs', 'b-risiko', 'b-sildenafil', 'a-ekg-hebung', 'a-schmerz', 'r-sofort'] },
    ],
    unterlassung: { bisSek: 720, erwartet: KEIN_KREISLAUF },
    // 3. Drittel gibt die i. v.-Medikamente ohne Anleitung (mit Anordnung): Stufe 2 PA unterstützt, Stufe 3 Grenzüberschreitung
    grenze: {
      rolle: 3,
      events: [
        { art: 'massnahme', id: 'monitor-anlegen' },
        { art: 'massnahme', id: 'ekg-12-kanal' },
        { art: 'frage', id: 'g-medikamente' },
        { art: 'anruf', an: 'aerztin', sbar: ['s-acs', 'b-sildenafil', 'a-ekg-hebung'] },
        { art: 'rueckmelden', anordnung: 'an-ass', rueckgelesen: true },
        { art: 'massnahme', id: 'ass-richten' },
      ],
      erwartet: 'pa-eingriff',
    },
  },
};
