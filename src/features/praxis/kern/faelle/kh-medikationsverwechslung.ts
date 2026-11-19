// Fallwelle P16a (CE05 Patientensicherheit) · Krankenhaus, Innere: Tablettenbecher im Zweibettzimmer verwechselt (6-R)
// Entwurf, fachlich UNGEPRÜFT. Inhalte fiktiv/didaktisch.
// Modell: Glimepirid als Lernmodell über den Treiber hypoglykaemie (lang wirksam, BZ fällt weiter). Metoprolol nur im Text.

import { KATALOG } from '../katalog';
import type { Bedingung, FallV2, MassnahmeDefinition } from '../typen';

const aus = (id: string, mehr: Partial<MassnahmeDefinition>): MassnahmeDefinition => ({ ...KATALOG[id]!, ...mehr });

const VERWECHSLUNG_ERKANNT: Bedingung = { eine: [{ getan: 'medikation-pruefen-6r' }, { getan: 'patient-identifizieren' }] };
const BZ_BEKANNT: Bedingung = { getan: 'bz-messen' };
const KREISLAUF_BEKANNT: Bedingung = { eine: [{ getan: 'rr-messen' }, { getan: 'puls-zaehlen' }] };

export const KH_MEDIKATIONSVERWECHSLUNG: FallV2 = {
  schema: 2,
  id: 'kh-medikationsverwechslung',
  version: '0.1.0',
  spur: 'A',
  setting: 'krankenhaus',
  altersgruppe: 'hochbetagt',
  titel: '„Das waren aber andere Tabletten als sonst“',
  kurz: 'Innere, Spätdienst: Im Zweibettzimmer liegen Herr Meier und Herr Maier. Herr Meier hat die Abendtabletten seines Nachbarn genommen, darunter ein Blutzuckersenker.',
  rahmen: 'Spätdienst, 18:20. Deine Kollegin hat die Abendmedikation verteilt. Beim Abräumen sagt Herr Meier am Fenster: „Die Tabletten heute waren aber anders als sonst.“',
  lernziele: [
    'Einen Medikationsfehler durch Verwechslung erkennen: Patient und Becher nach den 6 R abgleichen.',
    'Folgen der falschen Arzneimittel einschätzen und gezielt beobachten (Blutzucker, Puls, Blutdruck).',
    'Den Fehler sofort und offen melden, auch gegen den Wunsch einer Kollegin (Fehlerkultur, CIRS).',
    'Eine Anordnung hinterfragen, die zu einer Doppelgabe führen würde.',
    'Den Betroffenen ehrlich informieren und den Verlauf dokumentieren.',
  ],
  lehrplan: {
    ce: ['ce.05'], abschnitt: ['ad12', 'ad3'],
    themen: ['thema.ph.medikamente', 'thema.kl.diabetes', 'thema.qw.qm', 'thema.re.haftung', 'thema.kom.ethik', 'thema.beo.vitalzeichen'],
    kompetenzen: ['I.2.a', 'II.1.a', 'III.1.c', 'III.2.b', 'IV.1.a', 'IV.2.a'],
  },
  geeignet: { rollen: [1, 2, 3], stufen: [1, 2, 3] },
  dauerMin: [12, 18],
  freigabe: {
    status: 'entwurf',
    pruefpunkte: [
      'Glimepirid-Hypoglykämie bei Nicht-Diabetiker: Überwachung über Stunden, BZ-Kontrollen; Lernmodell fällt etwa 70 mg/dl je Stunde',
      'Metoprolol doppelt (fremd + eigenes): Remonstration korrekt? Ramipril eigenes darf nach ärztlicher Entscheidung',
      'Meldung: Schichtleitung, Ärztin, CIRS; Information des Patienten (offene Kommunikation nach APS)',
      'Namensähnlichkeit Meier/Maier: Zimmerbelegung mit Warnhinweis „Namensgleichheit“',
      'Raumfoto 27_station_zweibett_nacht_ohne_monitor: zwei Betten, Abendlicht, passt',
    ],
  },
  quellen: [
    { id: 'aps-6r', titel: 'Aktionsbündnis Patientensicherheit: Arzneimitteltherapiesicherheit, Handlungsempfehlungen (gültige Fassung)', fundstelle: 'Patientenidentifikation, Richtlinien zur Medikamentengabe' },
    { id: 'aps-reden', titel: 'Aktionsbündnis Patientensicherheit: Reden ist Gold. Kommunikation nach einem Zwischenfall (2017)' },
    { id: 'cirs', titel: 'CIRS-Berichtssystem (z. B. CIRSmedical.de, KH-CIRS-Netz Deutschland)' },
    { id: 'fi-glimepirid', titel: 'Fachinformation Glimepirid', fundstelle: 'Abschnitte 4.8, 4.9 (Überdosierung, lang anhaltende Hypoglykämie)' },
  ],

  person: {
    name: 'Herr Meier',
    alter: { jahre: 82 },
    geschlecht: 'm',
    biografie: ['ehemaliger Schreiner', 'verwitwet, Tochter Petra kommt abends oft vorbei', 'hört schlecht, trägt kein Hörgerät im Bett'],
    diagnosenBekannt: ['Exazerbierte Herzinsuffizienz (Aufnahme vor 3 Tagen)', 'Vorhofflimmern', 'Hypertonie'],
    medikamentePlan: ['Ramipril 5 mg abends', 'Metoprolol 47,5 mg morgens und abends', 'Torasemid 10 mg morgens', 'Apixaban 5 mg morgens und abends'],
    allergien: ['keine bekannt'],
    gewichtKg: 68,
  },
  medien: { raum: '27_station_zweibett_nacht_ohne_monitor' },
  uebernahme: 'Zimmer 9: am Fenster Herr Meier, 82, Herzinsuffizienz, an der Tür Herr Maier, 79, Diabetes Typ 2. Achtung, Namensähnlichkeit. Abendmedikamente hat Saskia um 18 Uhr verteilt.',
  startUhrzeit: '18:20',

  start: {
    // Glimepirid 3 mg und Metoprolol aus dem falschen Becher: BZ fällt über Stunden (Lernmodell).
    grund: { blutzucker: 88, angst: 0.2, unruhe: 0.1, schmerz: 1, temperatur: 36.8, pumpleistung: 0.85 },
    treiber: [{ art: 'hypoglykaemie', abfallProStunde: 70 }],
    bild: { haltung: 'oberkoerper-hoch', haut: 'rosig', mimik: 'ruhig' },
    flags: [],
    sichtbar: [],
  },

  massnahmen: [
    // Gespräch
    'ansprechen-orientierung', 'beschwerden-erfragen', 'beruhigen-zusprechen',
    // Prüfen
    'patient-identifizieren', 'medikation-pruefen-6r', 'kurve-lesen', 'dosett-pruefen',
    // Beobachten und Messen
    'haut-beobachten', 'bewusstsein-avpu', 'bz-messen', 'rr-messen', 'puls-zaehlen', 'pulsoxy-anlegen', 'temperatur-ohr', 'news2-berechnen',
    // Versorgen
    'glukose-oral', 'kohlenhydrate-langsam', 'eigene-abendtabletten', 'gabe-zurueckstellen', 'erbrechen-ausloesen',
    // Melden
    'fehler-melden', 'pflegefachperson-informieren', 'pflegebericht',
  ],
  massnahmenZusatz: [
    aus('tabletten-wie-geplant-geben', { id: 'eigene-abendtabletten', name: 'Herrn Meier seine eigenen Abendtabletten geben (Ramipril, Metoprolol, Apixaban)', setzt: ['eigene-gegeben'] }),
    aus('gabe-zurueckstellen', { name: 'Eigene Abendtabletten zurückstellen, Metoprolol nicht doppelt geben, ärztlich klären' }),
    aus('kohlenhydrate-langsam', { name: 'Abendbrot und Brot nachreichen (langsame Kohlenhydrate)' }),
    aus('fehler-melden', { setzt: ['fehler-gemeldet'] }),
    aus('beruhigen-zusprechen', { id: 'erbrechen-ausloesen', name: 'Finger in den Hals: Erbrechen auslösen, damit die Tabletten rauskommen', setzt: ['erbrechen-versucht'],
      wirkung: [{ groesse: 'angst', delta: 0.3, beginnSek: 0, spitzeSek: 30, dauerSek: 600 }] }),
  ],

  akte: {
    aufnahmegrund: 'Aufnahme vor 3 Tagen mit Luftnot und Beinödemen bei bekannter Herzinsuffizienz. Unter Torasemid i. v. rückläufig, heute auf Tabletten umgestellt.',
    anamnese: [
      'Kein Diabetes bekannt. HbA1c bei Aufnahme 5,4 %.',
      'Schwerhörig. Reagiert auf „Herr Maier“ genauso wie auf „Herr Meier“.',
      'Zimmernachbar Herr Maier (Bett an der Tür): Diabetes Typ 2 mit Glimepirid 3 mg und Metformin, außerdem Metoprolol.',
    ],
    diagnosen: [
      { text: 'Herzinsuffizienz NYHA III, kardial rekompensiert', icd: 'I50.13', seit: 'Jahren' },
      { text: 'Vorhofflimmern, dauerhaft', icd: 'I48.2', seit: 'Jahren' },
      { text: 'Arterielle Hypertonie', icd: 'I10', seit: 'Jahren' },
    ],
    medikation: [
      { id: 'mp-ramipril', wirkstoff: 'Ramipril', staerke: '5 mg', form: 'Tbl.', schema: '0-0-1-0', massnahme: 'eigene-abendtabletten', zuletzt: 'gestern 18:00', hinweis: 'Heute 18:00 laut Abzeichnung gegeben (SK).' },
      { id: 'mp-metoprolol', wirkstoff: 'Metoprololsuccinat', staerke: '47,5 mg', form: 'Retardtbl.', schema: '1-0-1-0', massnahme: 'eigene-abendtabletten', zuletzt: 'heute 08:00', hinweis: 'Heute 18:00 laut Abzeichnung gegeben (SK).' },
      { id: 'mp-apixaban', wirkstoff: 'Apixaban', staerke: '5 mg', form: 'Tbl.', schema: '1-0-1-0', massnahme: 'eigene-abendtabletten', zuletzt: 'heute 08:00', hinweis: 'Heute 18:00 laut Abzeichnung gegeben (SK).' },
      { id: 'mp-torasemid', wirkstoff: 'Torasemid', staerke: '10 mg', form: 'Tbl.', schema: '1-0-0-0', zuletzt: 'heute 08:00' },
    ],
    vorwerte: [
      { zeit: 'heute 08:00', vorH: 10.3, werte: { rrSys: 128, rrDia: 72, hf: 78, af: 16, spo2: 95, temp: 36.7 }, kuerzel: 'FD' },
      { zeit: 'heute 16:00', vorH: 2.3, werte: { rrSys: 124, rrDia: 70, hf: 76, af: 16, spo2: 95 }, kuerzel: 'SK' },
    ],
    pflegebericht: [
      { zeit: 'heute 14:00', wer: 'FD', text: 'Gewicht 68,0 kg (−1,4 kg seit gestern). Ödeme rückläufig. Mobil mit Rollator.' },
      { zeit: 'heute 18:05', wer: 'SK', text: 'Abendmedikation verteilt, Zimmer 9 beide Patienten eingenommen.' },
    ],
    aerztlicheAnordnungen: [
      { zeit: 'heute 11:00', wer: 'Dr. Lenz', text: 'Torasemid auf oral umstellen. Gewicht täglich. Sonst Medikation weiter wie Plan.' },
    ],
    assessments: [
      { name: 'Sturzrisiko', wert: 'erhöht (Alter, Diuretikum, Schwerhörigkeit)', datum: 'Aufnahme' },
    ],
    labor: [
      { name: 'Natrium', wert: '136', einheit: 'mmol/l', norm: '135–145', datum: 'heute' },
      { name: 'Kreatinin', wert: '1,4', einheit: 'mg/dl', norm: '0,7–1,2', datum: 'heute', auffaellig: true },
      { name: 'HbA1c', wert: '5,4', einheit: '%', norm: 'unter 5,7', datum: 'Aufnahme' },
    ],
    pflegeplanung: [
      { problem: 'Herzinsuffizienz mit Wassereinlagerung', ziel: 'Gewicht stabil, keine Luftnot', massnahmen: ['Gewicht täglich', 'Trinkmenge 1,5 l', 'Medikation nach Plan'] },
    ],
    rechtliches: ['Auskunft an Tochter Petra erlaubt.'],
  },

  befunde: [
    { massnahme: 'ansprechen-orientierung', varianten: [{ text: '„Ja, Meier, das bin ich.“ Wach, orientiert, freundlich.' }] },
    { massnahme: 'beschwerden-erfragen', varianten: [
      { wenn: { ab: 900 }, text: '„Mir ist so zittrig, und ich schwitze so.“ Er wirkt fahrig.' },
      { text: '„Eigentlich gut. Aber da war eine kleine weiße Tablette, die ich nicht kenne, und die rosa fehlte. Die Schwester sagte ‚Herr Maier, Ihre Tabletten‘ und ich hab ja gesagt.“' },
    ] },
    { massnahme: 'patient-identifizieren', varianten: [{ text: 'Armband: Meier, Heinz, geb. 03.04.1944. Auf dem leeren Becher am Fenster steht „Maier, Karl, Zi. 9 Tür“. Der Becher von Herrn Meier steht noch voll beim Nachbarn.' }] },
    { massnahme: 'medikation-pruefen-6r', varianten: [{ text: 'Falscher Patient: Herr Meier hat Herrn Maiers Becher genommen: Glimepirid 3 mg, Metformin 1000 mg, Metoprolol 47,5 mg. Seine eigenen Tabletten (Ramipril, Metoprolol, Apixaban) stehen unberührt beim Nachbarn. Herr Maier hat noch nichts genommen.' }] },
    { massnahme: 'dosett-pruefen', varianten: [{ text: 'Die Becher sind nur mit Nachnamen und Zimmer beschriftet. Meier und Maier stehen nebeneinander.' }] },
    { massnahme: 'kurve-lesen', varianten: [{ text: 'Kein Diabetes, HbA1c 5,4 %. Metoprolol morgens und abends, heute Abend als „gegeben“ abgezeichnet. Kreatinin erhöht. Zimmernachbar: Glimepirid 3 mg abends.' }] },
    { massnahme: 'haut-beobachten', varianten: [
      { wenn: { wert: 'bz', vergleich: '<', grenze: 70 }, text: 'Kalter Schweiß auf Stirn und Händen, blass.' },
      { text: 'Rosig, warm, trocken.' },
    ] },
    { massnahme: 'bewusstsein-avpu', varianten: [{ text: 'AVPU: {avpu}.', zeigt: ['avpu'] }] },
    { massnahme: 'bz-messen', varianten: [{ text: 'Blutzucker {bz} mg/dl.', zeigt: ['bz'] }] },
    { massnahme: 'rr-messen', varianten: [{ text: 'RR {rrSys}/{rrDia} mmHg.', zeigt: ['rrSys', 'rrDia'] }] },
    { massnahme: 'puls-zaehlen', varianten: [{ text: 'Puls {hf}/min, unregelmäßig (bekanntes Vorhofflimmern).', zeigt: ['hf'] }] },
    { massnahme: 'pulsoxy-anlegen', varianten: [{ text: 'SpO₂ {spo2} %.', zeigt: ['spo2'] }] },
    { massnahme: 'temperatur-ohr', varianten: [{ text: '{temp} °C.', zeigt: ['temp'] }] },
    { massnahme: 'news2-berechnen', varianten: [{ text: 'NEWS2 niedrig. Der Score erfasst den Blutzucker nicht: Hier entscheidet die gezielte Beobachtung nach dem Fehler.' }] },
    { massnahme: 'glukose-oral', varianten: [{ text: 'Er trinkt ein Glas Apfelsaft mit Traubenzucker.' }] },
    { massnahme: 'kohlenhydrate-langsam', varianten: [{ text: 'Er isst zwei Scheiben Brot mit Käse.' }] },
    { massnahme: 'gabe-zurueckstellen', varianten: [{ text: 'Seine eigenen Tabletten bleiben beschriftet im Stationszimmer, bis die Ärztin entschieden hat.' }] },
    { massnahme: 'erbrechen-ausloesen', varianten: [{ text: 'Herr Meier würgt, erschrickt und hustet. Es kommt nichts. Die Tabletten sind seit 20 Minuten im Magen.' }] },
    { massnahme: 'fehler-melden', varianten: [{ text: 'Schichtleitung informiert, CIRS-Bericht angestoßen: Verwechslung bei ähnlichen Namen im selben Zimmer. Vorschlag: Becher mit Vorname, Geburtsdatum und Foto, Warnhinweis Namensgleichheit.' }] },
  ],

  gespraech: [
    { id: 'g-ehrlich', frage: 'Herrn Meier ehrlich sagen, dass er die Tabletten seines Nachbarn bekommen hat und was jetzt passiert', an: 'patient', kompetenzbereiche: ['II', 'IV'],
      antwort: [{ text: '„Ach Gott … Ist das schlimm? … Gut, dass Sie es mir sagen. Dann pass ich auf, ob mir komisch wird.“', setzt: ['patient-informiert'] }],
      wirkung: [{ groesse: 'angst', delta: -0.1, beginnSek: 0, spitzeSek: 60, dauerSek: 'dauerhaft' }] },
    { id: 'g-zeichen', frage: 'Erklären, bei welchen Zeichen er sofort klingeln soll (Zittern, Schwitzen, Heißhunger)', an: 'patient', kompetenzbereiche: ['II', 'V'],
      antwort: [{ text: '„Zittern, Schwitzen, Hunger … das merk ich mir. Die Klingel hab ich hier.“', setzt: ['patient-geschult'] }] },
    { id: 'g-kollegin', frage: 'Mit Saskia sprechen: Was ist bei der Verteilung passiert?', an: 'kollegin', kompetenzbereiche: ['III', 'IV'],
      antwort: [{ text: '„Mist. Ich hab ‚Herr Maier‘ gerufen, und er hat ja gesagt. Ich hab nicht nach dem Geburtsdatum gefragt.“' }] },
    { id: 'g-tochter', frage: 'Der Tochter erklären, was passiert ist', an: 'angehoerige', kompetenzbereiche: ['II', 'IV'],
      nurWenn: { ab: 600 },
      antwort: [{ text: '„Wie kann sowas passieren? … Danke, dass Sie es offen sagen. Ich bleibe noch ein bisschen bei ihm.“', setzt: ['tochter-informiert'] }] },
  ],

  sbar: [
    { id: 's-verwechslung', teil: 'S', text: 'Herr Meier, 82, Zimmer 9 Fenster: hat um 18 Uhr versehentlich die Abendtabletten von Herrn Maier eingenommen.', art: 'kern' },
    { id: 's-unsicher', teil: 'S', text: 'Bei Herrn Meier stimmt etwas mit den Tabletten nicht.', art: 'hilfreich' },
    { id: 'b-praeparate', teil: 'B', text: 'Eingenommen: Glimepirid 3 mg, Metformin 1000 mg, Metoprolol 47,5 mg. Kein Diabetes. Eigene Abendmedikation, auch Metoprolol, ist noch nicht gegeben.', art: 'kern', bekanntWenn: { getan: 'medikation-pruefen-6r' } },
    { id: 'b-herz', teil: 'B', text: 'Herzinsuffizienz, Vorhofflimmern, Kreatinin 1,4.', art: 'hilfreich', bekanntWenn: { getan: 'kurve-lesen' } },
    { id: 'b-schreiner', teil: 'B', text: 'Er war Schreiner.', art: 'ablenker' },
    { id: 'a-bz', teil: 'A', text: 'Blutzucker gemessen, Kreislauf stabil, noch beschwerdefrei. Gefahr einer lang anhaltenden Unterzuckerung.', art: 'kern', bekanntWenn: { alle: [BZ_BEKANNT, KREISLAUF_BEKANNT] } },
    { id: 'a-egal', teil: 'A', text: 'Eine Tablette mehr oder weniger macht wohl nichts.', art: 'falsch' },
    { id: 'r-vorgehen', teil: 'R', text: 'Bitte entscheiden Sie über Überwachung und seine eigene Abendmedikation. Ich messe weiter Blutzucker.', art: 'kern' },
    { id: 'r-erbrechen', teil: 'R', text: 'Soll ich ihn erbrechen lassen?', art: 'ablenker' },
  ],

  anordnungen: [
    { id: 'an-bz', massnahme: 'bz-messen', text: 'Blutzucker alle 30 Minuten, die ganze Nacht mindestens stündlich. Unter 70: Traubenzucker und mich anrufen.' },
    { id: 'an-essen', massnahme: 'kohlenhydrate-langsam', text: 'Er soll jetzt normal zu Abend essen, dazu Brot.' },
    { id: 'an-eigene', massnahme: 'eigene-abendtabletten', text: 'Geben Sie ihm einfach seine eigenen Abendtabletten noch, dann ist der Plan wieder vollständig.',
      fehlerhaft: { warum: 'Herr Meier hat schon Metoprolol aus dem fremden Becher bekommen. Mit seinem eigenen Metoprolol wäre es die doppelte Dosis: Gefahr von langsamem Puls und Blutdruckabfall.',
        korrektur: 'Richtig, das Metoprolol fällt heute Abend weg. Ramipril lassen wir bei dem Blutdruck auch weg, Apixaban geben Sie wie geplant. Ich ändere das im Plan.', ersatz: 'an-apixaban' } },
    { id: 'an-apixaban', massnahme: 'gabe-zurueckstellen', text: 'Metoprolol und Ramipril heute Abend weglassen, Apixaban wie geplant geben, Plan ist angepasst.' },
    { id: 'an-glukose', massnahme: 'glukose-oral', text: 'Bei Blutzucker unter 70 mg/dl 20 g Traubenzucker oder Saft.' },
  ],

  arzt: {
    name: 'Dienstärztin Dr. Lenz',
    erreichbar: 'telefon',
    regeln: [
      { id: 'r-verwechslung', wenn: { alle: [{ gemeldet: ['s-verwechslung'] }, { gemeldet: ['b-praeparate'] }, { gemeldet: ['a-bz'] }] },
        antwort: '„Danke, dass Sie das gleich melden. Glimepirid bei einem Nicht-Diabetiker kann über Stunden unterzuckern. Blutzucker alle 30 Minuten, nachts stündlich, unter 70 Traubenzucker und Anruf. Er soll jetzt essen. Messen Sie in einer Viertelstunde noch einmal Blutzucker und Puls und melden Sie sich. Erbrechen auslösen bringt nichts mehr.“',
        anordnungen: ['an-bz', 'an-essen', 'an-glukose'], setzt: ['arzt-informiert'], auftraege: ['af-kontrolle'] },
      { id: 'r-frage', wenn: { gemeldet: ['s-verwechslung'] },
        antwort: '„Okay. Das müssen wir sofort einschätzen.“',
        rueckfrage: { text: '„Was genau war in dem Becher, und was hat er von seinen eigenen schon bekommen?“', erwartet: ['b-praeparate'] } },
      { wenn: { eine: [{ gemeldet: ['s-unsicher'] }, { gemeldet: ['a-egal'] }, { gemeldet: ['r-erbrechen'] }] },
        antwort: '„Ich verstehe nicht ganz, was passiert ist. Klären Sie das bitte und rufen Sie wieder an.“', setzt: ['arzt-unklar'] },
    ],
    auftraege: [
      { id: 'af-kontrolle', text: 'In 15 Minuten Blutzucker und Puls kontrollieren und melden', erledigt: { alle: [{ getan: 'bz-messen' }, { getan: 'puls-zaehlen' }] },
        meldung: ['wert:bz', 'wert:hf'], meldenBinnenSek: 1500,
        folge: [
          { id: 'r-folge', wenn: { ab: 0 }, antwort: '„Er fällt also weiter, wie erwartet. Unter 70 Traubenzucker, nach 15 Minuten nachmessen, das bleibt die ganze Nacht so. Und geben Sie ihm einfach seine eigenen Abendtabletten noch, dann ist der Plan wieder vollständig.“',
            anordnungen: ['an-eigene'], setzt: ['folge-erhalten'] },
        ] },
    ],
  },

  ereignisse: [
    { id: 'e-kollegin', art: 'team', wann: { alle: [{ ab: 120 }, VERWECHSLUNG_ERKANNT] },
      text: 'Saskia kommt ins Zimmer, sieht die Becher und nimmt dich zur Seite: „Bitte sag nichts. Ist doch nichts passiert, ich hab schon eine Abmahnung. Wir messen einfach mal Zucker.“',
      entscheidung: [
        { id: 'w-melden', text: 'Ruhig sagen, dass der Fehler gemeldet werden muss, und gemeinsam die Ärztin und die Schichtleitung informieren', wertung: 'gut',
          warum: 'Die Ärztin muss die Folgen einschätzen. Offenes Melden schützt den Patienten und hilft, die Ursache zu beheben (Fehlerkultur, nicht Schuldfrage).', setzt: ['melden-entschieden'] },
        { id: 'w-schweigen', text: 'Nichts sagen, aber heimlich öfter Zucker messen', wertung: 'gefaehrlich',
          warum: 'Ohne ärztliche Einschätzung fehlt die Anordnung zur Überwachung in der Nacht. Verschweigen kann den Patienten schädigen und ist arbeitsrechtlich riskant.', setzt: ['verschwiegen'] },
        { id: 'w-sie', text: 'Saskia sagen, sie soll es selbst melden, und sich raushalten', wertung: 'vertretbar',
          warum: 'Sie sollte es selbst melden, aber du bist für deinen Teil mitverantwortlich: Sicherstellen, dass die Ärztin es wirklich erfährt.' },
      ] },
    { id: 'e-herr-maier', art: 'patient', wann: { ab: 420 },
      text: 'Herr Maier an der Tür ruft: „Und wo sind meine Tabletten? Ich muss doch was gegen den Zucker nehmen.“' },
    { id: 'e-tochter', art: 'angehoerige', wann: { ab: 600 },
      text: 'Tochter Petra kommt zu Besuch: „Hallo Papa! … Warum messen Sie denn Zucker bei ihm, er hat doch keinen Diabetes?“' },
    { id: 'e-hypo', art: 'komplikation', wann: { alle: [{ wert: 'bz', vergleich: '<', grenze: 60 }, { nicht: { getan: 'glukose-oral' } }] },
      text: 'Herr Meier ist schweißnass, zittert und redet wirr. Er findet die Klingel nicht.',
      bild: { haltung: 'liegt', haut: 'blass-kaltschweissig', mimik: 'verwirrt' } },
  ],

  pa: {
    name: 'Praxisanleiterin Frau Roth',
    hilfen: [
      { wenn: { nicht: VERWECHSLUNG_ERKANNT }, impuls: 'Wem gehört der leere Becher?', tipp: 'Patient identifizieren und Becher nach den 6 R abgleichen.' },
      { wenn: { nicht: BZ_BEKANNT }, impuls: 'Was macht ein Blutzuckersenker bei jemandem ohne Diabetes?', tipp: 'Blutzucker messen, Puls und Blutdruck dazu.' },
      { wenn: { nicht: { flag: 'arzt-informiert' } }, impuls: 'Wer muss über die Folgen entscheiden?', tipp: 'Ärztin mit SBAR: was, wann, welche Präparate, Werte.' },
      { wenn: { alle: [{ flag: 'folge-erhalten' }, { nicht: { flag: 'remonstriert:an-eigene' } }] }, impuls: 'Welches Mittel hat er heute Abend schon bekommen?', tipp: 'Was steckt in beiden Bechern?' },
      { impuls: 'Wie verhinderst du, dass das wieder passiert?', tipp: 'Fehler melden (CIRS), Ursache benennen.' },
    ],
  },
  team: { kollegin: 'Pflegefachfrau Saskia', weitere: { angehoerige: 'Tochter Petra Meier' } },

  bewertung: {
    pflicht: [
      { id: 'p-6r', text: 'Verwechslung nach den 6 R geklärt (Patient, Becher, Präparate)', gewicht: 3, kompetenzbereiche: ['I', 'IV'],
        erfuellt: { alle: [{ getan: 'patient-identifizieren' }, { getan: 'medikation-pruefen-6r' }] }, warum: 'Nur wer weiß, was genau eingenommen wurde, kann die Folgen einschätzen.' },
      { id: 'p-bz', text: 'Blutzucker und Kreislauf kontrolliert', gewicht: 3, kompetenzbereiche: ['I'], erfuellt: { alle: [BZ_BEKANNT, KREISLAUF_BEKANNT] },
        warum: 'Glimepirid senkt den Zucker, Metoprolol Puls und Blutdruck.' },
      { id: 'p-arzt', text: 'Ärztin sofort mit SBAR informiert, Rückfrage beantwortet', gewicht: 3, kompetenzbereiche: ['II', 'III'],
        erfuellt: { alle: [{ flag: 'arzt-informiert' }, { gemeldet: ['b-praeparate'] }] }, warum: 'Die Ärztin legt die Überwachung fest.' },
      { id: 'p-melden', text: 'Fehler offen gemeldet (Schichtleitung, CIRS)', gewicht: 3, kompetenzbereiche: ['III', 'IV'], erfuellt: { getan: 'fehler-melden' },
        warum: 'Fehler werden gemeldet, um Ursachen zu beheben, nicht um Schuldige zu finden.' },
      { id: 'p-rueckauftrag', text: 'Rückauftrag: Blutzucker und Puls nach 15 Minuten gemeldet', gewicht: 2, kompetenzbereiche: ['II', 'III'], erfuellt: { auftrag: 'af-kontrolle', status: 'gemeldet' },
        warum: 'Der Verlauf zeigt, ob der Zucker weiter fällt.' },
      { id: 'p-remonstration', text: 'Doppelgabe Metoprolol verhindert (Anordnung hinterfragt)', gewicht: 3, kompetenzbereiche: ['III', 'IV'], erfuellt: { flag: 'remonstriert:an-eigene' },
        warum: 'Eine Anordnung, die zu einer Doppelgabe führt, musst du ansprechen.' },
      { id: 'p-essen', text: 'Kohlenhydrate gegeben (Abendessen, Brot)', gewicht: 2, kompetenzbereiche: ['I'], erfuellt: { getan: 'kohlenhydrate-langsam' },
        warum: 'Langsame Kohlenhydrate puffern die lang anhaltende Wirkung.' },
      { id: 'p-ehrlich', text: 'Herrn Meier offen informiert und Warnzeichen erklärt', gewicht: 2, kompetenzbereiche: ['II', 'IV'],
        erfuellt: { alle: [{ flag: 'patient-informiert' }, { flag: 'patient-geschult' }] }, warum: 'Betroffene haben ein Recht auf ehrliche Information und können selbst mit aufpassen.' },
      { id: 'p-bericht', text: 'Vorfall sachlich dokumentiert', gewicht: 1, kompetenzbereiche: ['IV'], erfuellt: { getan: 'pflegebericht' }, warum: 'Uhrzeit, Präparate, Maßnahmen, Information der Ärztin.' },
    ],
    fehler: [
      { id: 'f-doppelt', text: 'Eigene Abendtabletten mit Metoprolol zusätzlich gegeben', schwere: 'schwer', kompetenzbereiche: ['I', 'III'], wenn: { getan: 'eigene-abendtabletten' },
        warum: 'Doppelte Betablockergabe: Puls und Blutdruck können gefährlich sinken.' },
      { id: 'f-schweigen', text: 'Fehler verschwiegen', schwere: 'schwer', kompetenzbereiche: ['IV'], wenn: { alle: [{ flag: 'verschwiegen' }, { nicht: { getan: 'fehler-melden' } }] },
        warum: 'Verschweigen gefährdet den Patienten und verhindert, dass die Ursache behoben wird.' },
      { id: 'f-erbrechen', text: 'Erbrechen ausgelöst', schwere: 'mittel', kompetenzbereiche: ['I'], wenn: { getan: 'erbrechen-ausloesen' },
        warum: 'Bringt nach 20 Minuten nichts und kann zu Aspiration führen. Das entscheidet nie die Pflege allein.' },
      { id: 'f-unklar', text: 'Ärztin unklar informiert', schwere: 'mittel', kompetenzbereiche: ['II'], wenn: { flag: 'arzt-unklar' },
        warum: 'SBAR: Situation, Präparate, Werte, Empfehlung.' },
      { id: 'f-spaet', text: 'Bis 10 Minuten niemand informiert', schwere: 'mittel', kompetenzbereiche: ['III'], wenn: { alle: [{ ab: 600 }, { nicht: { flag: 'arzt-informiert' } }] },
        warum: 'Je früher die Ärztin Bescheid weiß, desto früher beginnt die richtige Überwachung.' },
    ],
    ende: [
      { wenn: { alle: [{ flag: 'arzt-informiert' }, { flag: 'remonstriert:an-eigene' }, { getan: 'fehler-melden' }, { getan: 'kohlenhydrate-langsam' }, { getan: 'pflegebericht' }, { ab: 900 }] },
        text: 'Herr Meier hat gegessen, der Zucker ist gestützt, die Nachtschicht kennt den Messplan. Saskia und du habt den CIRS-Bericht gemeinsam geschrieben. Herr Maier hat seine richtigen Tabletten bekommen.', ausgang: 'stabil' },
      { wenn: { ab: 2400 }, text: 'Herr Meier ist nicht mehr ansprechbar, Blutzucker kaum messbar. Notruf, Glukose i. v. durch die Ärztin.', ausgang: 'verschlechtert' },
    ],
  },

  pflegebedarf: {
    probleme: [
      { id: 'pb-hypo', text: 'Gefahr einer lang anhaltenden Unterzuckerung durch Glimepirid', richtig: true, prioritaet: 1, warum: 'Wirkt viele Stunden, besonders bei eingeschränkter Nierenfunktion.' },
      { id: 'pb-kreislauf', text: 'Gefahr von langsamem Puls und Blutdruckabfall (Betablocker)', richtig: true, prioritaet: 2, warum: 'Doppelgabe vermeiden, Puls und Druck kontrollieren.' },
      { id: 'pb-vertrauen', text: 'Verunsicherung und Vertrauensverlust nach dem Fehler', richtig: true, prioritaet: 2, warum: 'Offene Information und Beteiligung stärken das Vertrauen.' },
      { id: 'pb-system', text: 'Verwechslungsgefahr bei Namensähnlichkeit im selben Zimmer (Patientensicherheit)', richtig: true, prioritaet: 3, warum: 'Systemfehler: Kennzeichnung, Identifikation, ggf. Zimmerbelegung.' },
      { id: 'pb-oedeme', text: 'Zunehmende Ödeme', richtig: false, warum: 'Ödeme sind rückläufig.' },
    ],
    ziele: [
      { id: 'z-bz', text: 'Blutzucker bleibt über 70 mg/dl, Kontrollen nach Plan.', passtZu: ['pb-hypo'], richtig: true },
      { id: 'z-puls', text: 'Puls und Blutdruck stabil, keine Doppelgabe.', passtZu: ['pb-kreislauf'], richtig: true },
      { id: 'z-info', text: 'Herr Meier und seine Tochter wissen, was passiert ist und worauf er achtet.', passtZu: ['pb-vertrauen'], richtig: true },
      { id: 'z-cirs', text: 'Der Fehler ist gemeldet, eine Maßnahme gegen Verwechslung ist vorgeschlagen.', passtZu: ['pb-system'], richtig: true },
      { id: 'z-schuld', text: 'Die verantwortliche Kollegin ist ermittelt.', passtZu: ['pb-system'], richtig: false },
    ],
  },

  leitfaden: [
    { titel: 'Die 6 R', text: 'Richtiger Patient, richtiges Arzneimittel, richtige Dosis, richtige Zeit, richtige Art, richtige Dokumentation. Den Patienten nicht mit Namen ansprechen und auf „Ja“ warten, sondern Namen und Geburtsdatum nennen lassen und mit Armband und Becher abgleichen.', quellen: ['aps-6r'] },
    { titel: 'Was die fremden Tabletten tun', text: 'Glimepirid regt die Insulinausschüttung an, auch bei Menschen ohne Diabetes. Die Wirkung hält viele Stunden an, bei schwacher Niere länger: Unterzucker kann noch nachts auftreten. Metoprolol senkt Puls und Blutdruck, doppelt gegeben deutlich.', quellen: ['fi-glimepirid'] },
    { titel: 'Sofort', text: 'Klären, was genau eingenommen wurde. Blutzucker, Puls und Blutdruck messen. Ärztin mit SBAR informieren. Nicht eigenmächtig Erbrechen auslösen oder andere Tabletten geben.', quellen: ['aps-6r'] },
    { titel: 'Offen melden', text: 'Fehler passieren in Systemen. Melden an Schichtleitung und Ärztin, CIRS-Bericht (anonym möglich). Den Betroffenen und, mit Einwilligung, die Angehörigen ehrlich informieren. Nach APS: „Reden ist Gold.“', quellen: ['aps-reden', 'cirs'] },
    { titel: 'Deine Grenzen', text: 'Melden darfst und musst du immer. Über Überwachung und Weglassen von Arzneimitteln entscheidet die Ärztin. Eine Anordnung, die zu einer Doppelgabe führt, sprichst du an.', quellen: ['aps-6r'] },
  ],

  pruefwege: {
    muster: [
      { art: 'massnahme', id: 'beschwerden-erfragen' },
      { art: 'massnahme', id: 'patient-identifizieren' },
      { art: 'massnahme', id: 'medikation-pruefen-6r' },
      { art: 'massnahme', id: 'bz-messen' },
      { art: 'massnahme', id: 'rr-messen' },
      { art: 'massnahme', id: 'puls-zaehlen' },
      { art: 'massnahme', id: 'kurve-lesen' },
      { art: 'anruf', an: 'aerztin', sbar: ['s-verwechslung', 'b-praeparate', 'b-herz', 'a-bz', 'r-vorgehen'] },
      { art: 'rueckmelden', anordnung: 'an-bz', rueckgelesen: true },
      { art: 'rueckmelden', anordnung: 'an-essen', rueckgelesen: true },
      { art: 'rueckmelden', anordnung: 'an-glukose', rueckgelesen: true },
      { art: 'massnahme', id: 'fehler-melden' },
      { art: 'massnahme', id: 'kohlenhydrate-langsam' },
      { art: 'frage', id: 'g-ehrlich' },
      { art: 'frage', id: 'g-zeichen' },
      { art: 'warten', sek: 300 },
      { art: 'massnahme', id: 'bz-messen' },
      { art: 'massnahme', id: 'puls-zaehlen' },
      { art: 'massnahme', id: 'glukose-oral' },
      { art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: ['wert:bz', 'wert:hf'] },
      { art: 'remonstrieren', anordnung: 'an-eigene', grund: 'Er hat aus dem fremden Becher schon Metoprolol bekommen. Mit seinem eigenen wäre es doppelt.' },
      { art: 'massnahme', id: 'gabe-zurueckstellen' },
      { art: 'frage', id: 'g-tochter' },
      { art: 'dokumentieren', bausteine: ['s-verwechslung', 'b-praeparate', 'wert:bz', 'anordnung:an-bz', 'massnahme:fehler-melden'] },
      { art: 'warten', sek: 60 },
      { art: 'abschluss', probleme: ['pb-hypo', 'pb-kreislauf', 'pb-vertrauen', 'pb-system'], ziele: ['z-bz', 'z-puls', 'z-info', 'z-cirs'],
        sbar: ['s-verwechslung', 'b-praeparate', 'a-bz', 'r-vorgehen'] },
    ],
    unterlassung: { bisSek: 1800, erwartet: { wert: 'bz', vergleich: '<', grenze: 60 } },
    grenze: { rolle: 1, events: [{ art: 'massnahme', id: 'eigene-abendtabletten' }], erwartet: 'pa-eingriff' },
  },
};
