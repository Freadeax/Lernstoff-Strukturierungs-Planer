// Fallwelle P19 (CE 11) · Krankenhaus: postoperatives Delir in der Nacht (Hüft-OP, Harnverhalt, Schmerz)
// Entwurf, fachlich UNGEPRÜFT. Inhalte fiktiv/didaktisch. Migriert und neu geschrieben aus Altfall „delir“ (scenarios.json).

import { KATALOG } from '../katalog';
import type { Bedingung, FallV2, MassnahmeDefinition } from '../typen';

const aus = (id: string, mehr: Partial<MassnahmeDefinition>): MassnahmeDefinition => ({ ...KATALOG[id]!, ...mehr });

const BLASE_VOLL: Bedingung = { nicht: { getan: 'einmalkatheter' } };
const UNRUHIG: Bedingung = { wert: 'unruhe', vergleich: '>=', grenze: 0.4 };

const ANTWORT = '„Klingt nach einem Delir, und die volle Blase und der Schmerz halten es am Laufen. Machen Sie bitte einen Einmalkatheter mit Ihrer Anleitung, geben Sie Metamizol 1 g als Tablette und für die Nacht Lorazepam 1 mg, damit er schläft. Melden Sie mir in einer halben Stunde, wie viel Urin kam und wie er ist.“';
const R_ANORDNUNG = { id: 'r-anordnung', antwort: ANTWORT, anordnungen: ['an-katheter', 'an-metamizol', 'an-lorazepam'], setzt: ['arzt-informiert'], auftraege: ['af-verlauf'] };

export const KH_DELIR_NACHT: FallV2 = {
  schema: 2,
  id: 'kh-delir-nacht',
  version: '0.1.0',
  spur: 'A',
  setting: 'krankenhaus',
  altersgruppe: 'hochbetagt',
  titel: '„Ich muss nach Hause, die Kühe!“',
  kurz: 'Unfallchirurgie, 02:00 Uhr: 84-Jähriger zwei Tage nach Hüft-OP ist plötzlich verwirrt und will aus dem Bett.',
  rahmen: 'Du bist im Nachtdienst auf der Unfallchirurgie, deine Praxisanleiterin ist auf Station. Die Klingel aus Zimmer 12 läutet: Der Mitpatient ruft.',
  lernziele: [
    'Ein Delir erkennen und mit dem 4AT einschätzen, statt die Unruhe als „Demenz“ oder „Schlafproblem“ abzutun.',
    'Behandelbare Auslöser suchen: Schmerz, volle Blase, Flüssigkeit, fremde Umgebung, fehlende Brille und Hörgerät.',
    'Orientierung geben und Sturzgefahr ohne Bettgitter oder Fixierung verringern.',
    'Ein Benzodiazepin bei einem hochbetagten Menschen mit Delir hinterfragen.',
    'Angehörige mit Vorsorgevollmacht einbeziehen und den Verlauf übergeben.',
  ],
  lehrplan: {
    ce: ['ce.11', 'ce.05'], abschnitt: ['ad12', 'ad3'],
    themen: ['thema.pro.delir', 'thema.pro.sturz', 'thema.re.fem', 'thema.ph.ausscheidung', 'thema.ph.medikamente'],
    kompetenzen: ['I.1.e', 'I.3.b', 'II.1.b', 'III.2.a', 'IV.1.b'],
  },
  geeignet: { rollen: [2, 3], stufen: [1, 2, 3] },
  dauerMin: [15, 22],
  freigabe: {
    status: 'entwurf',
    pruefpunkte: [
      'Delir-Erkennung mit dem 4AT und Ursachensuche gegen die S3-Leitlinie Delir im höheren Lebensalter (AWMF 109-001, 2025) und den NICE-Standard CG103 prüfen',
      'Remonstrationspunkt: Lorazepam bei hochbetagtem Menschen mit Delir (PRISCUS 2.0, Delir-Leitlinien: Benzodiazepine nur bei Alkoholentzug)',
      'Einmalkatheter bei Harnverhalt nach Anordnung, Befugnis 2. Drittel mit Anleitung',
      'Bettgitter als freiheitsentziehende Maßnahme (§ 1831 BGB): Bevollmächtigter allein reicht nicht, Genehmigung des Betreuungsgerichts nötig, außer Einwilligung des einwilligungsfähigen Patienten',
      'Modell: Delir steigt mit Schmerz, Harnverhalt und fremder Umgebung; Metamizol und Katheter nehmen die Auslöser weg, Reorientierung senkt Angst',
    ],
  },
  quellen: [
    { id: 's3-delir', titel: 'S3-Leitlinie Analgesie, Sedierung und Delirmanagement (AWMF 001-012), 2020' },
    { id: 's3-delir-alter', titel: 'S3-Leitlinie Delir im höheren Lebensalter (AWMF 109-001), Version 1.0, 2025' },
    { id: 'nice-delir', titel: 'NICE CG103: Delirium – prevention, diagnosis and management in hospital and long-term care (Update 2023)' },
    { id: '4at', titel: '4AT – Rapid clinical test for delirium (www.the4at.com), deutsche Fassung' },
    { id: 'priscus', titel: 'PRISCUS 2.0 Liste potenziell inadäquater Medikation für ältere Menschen (2023)' },
    { id: 'dnqp-sturz', titel: 'DNQP Expertenstandard Sturzprophylaxe in der Pflege, 2. Aktualisierung 2022' },
    { id: 'bgb-1831', titel: 'BGB § 1831 Freiheitsentziehende Unterbringung und freiheitsentziehende Maßnahmen (seit 2023)' },
  ],

  person: {
    name: 'Walter Vogt',
    alter: { jahre: 84 },
    geschlecht: 'm',
    biografie: ['war Landwirt, hat den Hof an den Sohn übergeben', 'lebt mit der Ehefrau im eigenen Haus, geht sonst mit Stock', 'trägt Brille und ein Hörgerät rechts'],
    diagnosenBekannt: ['Schenkelhalsfraktur rechts, Hüft-TEP vor zwei Tagen', 'Bluthochdruck', 'Prostatavergrößerung', 'leichte kognitive Einschränkung (laut Sohn „manchmal vergesslich“)'],
    medikamentePlan: ['Ramipril 5 mg morgens', 'Tamsulosin 0,4 mg abends', 'Enoxaparin 40 mg s. c. abends', 'Metamizol 1 g bei Bedarf bis 4× täglich'],
    allergien: ['keine bekannt'],
    gewichtKg: 72,
  },
  medien: {
    raum: '27_station_zweibett_nacht_ohne_monitor',
    raumVarianten: [{ wenn: { getan: 'sturzprophylaxe-bett' }, raum: '27a_station_zweibett_nacht_niedrigbett_sturzmatte' }],
  },
  uebernahme: 'Herr Vogt, 84, zweiter Tag nach Hüft-TEP rechts. Tagsüber freundlich und orientiert, hat mit der Physiotherapie am Rollator gestanden. Blasenkatheter wurde gestern früh gezogen. Hat abends wenig getrunken, letzte Bedarfsmedikation gegen Schmerzen um 16 Uhr. Seit Mitternacht klingelt er häufig.',
  startUhrzeit: '02:05',

  start: {
    // Akutes Delir: Auslöser Schmerz, Harnverhalt nach Katheterentfernung, fremde Umgebung (Brille, Hörgerät fehlen), gestörter Nachtschlaf (G7).
    grund: { schmerz: 5, schlafdefizit: 0.2, delir: 0.35, orientierung: 0.4, unruhe: 0.5, angst: 0.45, vigilanz: 0.9, hydratation: 0.87, volumen: 0.92, temperatur: 37.2, blutzucker: 118 },
    treiber: [
      { art: 'delir_trigger', ausloeser: ['schmerz', 'harnverhalt', 'umgebung'] },
      { art: 'harnverhalt' },
      { art: 'schlafstoerung', staerke: 0.4 },   // G7: Mehrbettzimmer, Klingel, Harndrang
    ],
    bild: { haltung: 'sitzt', haut: 'rosig', mimik: 'verwirrt' },
    sichtbar: [],
  },

  massnahmen: [
    // Gespräch
    'vorstellen-einverstaendnis', 'ansprechen-orientierung', 'reorientieren', 'kommunikationshilfe', 'beruhigen-zusprechen', 'beschwerden-erfragen',
    // Beobachten
    'delir-screening-4at', 'schmerz-nrs', 'blase-tasten', 'urin-beobachten', 'sturzrisiko-einschaetzen', 'haut-beobachten', 'wunde-beurteilen',
    // Akut & Sicherheit
    'sturzprophylaxe-bett', 'fem-anlegen', 'sitzwache', 'reizarm-gestalten', 'hilfe-holen', 'umgebung-sichern',
    // Messen
    'rr-messen', 'puls-zaehlen', 'temperatur-ohr', 'bz-messen', 'af-zaehlen', 'pulsoxy-anlegen', 'bilanz-fuehren', 'kurve-lesen',
    // Versorgen
    'einmalkatheter', 'schmerzmittel-geben', 'lorazepam-geben', 'trinken-anbieten',
    // Melden
    'pflegefachperson-informieren', 'pflegebericht',
  ],
  massnahmenZusatz: [
    {
      id: 'blase-tasten', name: 'Blase abtasten und Blasenscan (Restharn)', reiter: 'beobachten', spur: 'A', zeitbedarfSekunden: 120,
      befugnis: { 1: 'selbst', 2: 'selbst', 3: 'selbst', pflegefachperson: 'selbst' }, kompetenzbereiche: ['I'], setzt: ['blase-geprueft'],
    },
    aus('blasenkatheter-legen', { id: 'einmalkatheter', name: 'Einmalkatheter legen (nach Anordnung, aseptisch)', setzt: ['katheterisiert'], zeitbedarfSekunden: 420 }),
    aus('bedarfsmedikation-oral', {
      id: 'schmerzmittel-geben', name: 'Metamizol 1 g als Tablette geben (nach Anordnung)',
      treiber: [{ art: 'wirkstoff', id: 'metamizol', dosisMg: 1000, weg: 'oral' }],
    }),
    aus('kommunikationshilfe', { name: 'Brille aufsetzen und Hörgerät einsetzen (liegen im Nachtschrank)', setzt: ['brille-hoergeraet'],
      wirkung: [{ groesse: 'angst', delta: -0.1, beginnSek: 0, spitzeSek: 120, dauerSek: 'dauerhaft' }, { groesse: 'orientierung', delta: 0.1, beginnSek: 0, spitzeSek: 300, dauerSek: 'dauerhaft' }] }),
  ],

  akte: {
    aufnahmegrund: 'Sturz im Stall vor drei Tagen, mediale Schenkelhalsfraktur rechts. Hüft-TEP vorgestern in Spinalanästhesie. Postoperativ unauffällig, mobilisiert mit Rollator.',
    anamnese: [
      'Lebt mit der Ehefrau (82) im eigenen Haus. Sohn Thomas bewirtschaftet den Hof, hat Vorsorgevollmacht für Gesundheit und Aufenthalt.',
      'Prostatavergrößerung, nimmt Tamsulosin. Nachts sonst ein- bis zweimal Wasserlassen.',
      'Brille für die Ferne, Hörgerät rechts. Laut Sohn manchmal vergesslich, kein bekanntes Delir.',
    ],
    diagnosen: [
      { text: 'Mediale Schenkelhalsfraktur rechts, Hüft-TEP', icd: 'S72.00', seit: 'vor 2 Tagen' },
      { text: 'Benigne Prostatahyperplasie', icd: 'N40', seit: 'bekannt' },
      { text: 'Arterielle Hypertonie', icd: 'I10', seit: 'bekannt' },
    ],
    medikation: [
      { id: 'mp-metamizol', wirkstoff: 'Metamizol', staerke: '1 g', form: 'Tbl.', bedarf: { indikation: 'Schmerz NRS ≥ 4', einzeldosis: '1 g', maxProTag: '4 g', abstandH: 6 }, massnahme: 'schmerzmittel-geben', zuletzt: '16:00' },
      { id: 'mp-enoxaparin', wirkstoff: 'Enoxaparin', staerke: '40 mg', form: 's. c.', schema: '0-0-1-0', zuletzt: '20:00' },
      { id: 'mp-tamsulosin', wirkstoff: 'Tamsulosin', staerke: '0,4 mg', form: 'Kps.', schema: '0-0-1-0', zuletzt: '20:00' },
      { id: 'mp-ramipril', wirkstoff: 'Ramipril', staerke: '5 mg', form: 'Tbl.', schema: '1-0-0-0', zuletzt: '08:00' },
    ],
    vorwerte: [
      { zeit: 'gestern 18:00', vorH: 8, werte: { rrSys: 142, rrDia: 80, hf: 78, af: 15, spo2: 95, temp: 37.0 }, kuerzel: 'SD' },
    ],
    pflegebericht: [
      { zeit: '06:30 (gestern)', wer: 'ND', text: 'Dauerkatheter nach Anordnung entfernt.' },
      { zeit: '20:30', wer: 'SD', text: 'Freundlich, orientiert. Kein Wasserlassen seit dem Nachmittag dokumentiert, Trinkmenge bis 20 Uhr 900 ml. Hörgerät abends herausgenommen, Brille im Nachtschrank.' },
      { zeit: '00:40', wer: 'ND', text: 'Klingelt mehrfach, fragt nach seiner Frau. Beruhigt.' },
    ],
    aerztlicheAnordnungen: [
      { zeit: 'gestern', wer: 'Dr. Yilmaz', text: 'Vollbelastung nach Maßgabe Physio. Bedarfsmedikation Metamizol 1 g bis 4× täglich. Bei Harnverhalt (Restharn über 400 ml) Einmalkatheter nach Rücksprache.' },
    ],
    assessments: [
      { name: '4AT (Aufnahme)', wert: '0', datum: 'vor 3 Tagen' },
      { name: 'Sturzrisiko', wert: 'erhöht', datum: 'vor 2 Tagen' },
    ],
    labor: [
      { name: 'Hämoglobin', wert: '10,8', einheit: 'g/dl', norm: '13,5–17,5', datum: 'gestern', auffaellig: true },
      { name: 'Natrium', wert: '137', einheit: 'mmol/l', norm: '135–145', datum: 'gestern' },
      { name: 'CRP', wert: '38', einheit: 'mg/l', norm: '< 5', datum: 'gestern', auffaellig: true },
    ],
    rechtliches: ['Vorsorgevollmacht (Gesundheit, Aufenthalt): Sohn Thomas Vogt.', 'Keine Genehmigung für freiheitsentziehende Maßnahmen.'],
  },

  befunde: [
    { massnahme: 'vorstellen-einverstaendnis', varianten: [{ text: 'Er schaut an dir vorbei: „Wer sind Sie? Ich muss heim, die Kühe müssen gemolken werden.“' }] },
    { massnahme: 'ansprechen-orientierung', varianten: [
      { wenn: { wert: 'orientierung', vergleich: '<', grenze: 0.5 }, text: 'Er weiß seinen Namen, glaubt aber, er sei zu Hause im Stall. Es sei „Morgen“. Er zupft an der Bettdecke.' },
      { text: 'Er weiß, dass er im Krankenhaus ist, „wegen der Hüfte“. Die Uhrzeit schätzt er falsch.' },
    ] },
    { massnahme: 'reorientieren', varianten: [{ text: 'Du machst das kleine Licht an, sagst deinen Namen, das Krankenhaus, dass es Nacht ist und seine Frau morgen kommt. Er hört zu und wird etwas ruhiger.' }] },
    { massnahme: 'kommunikationshilfe', varianten: [{ text: 'Mit Brille und Hörgerät schaut er dich zum ersten Mal richtig an: „Ach, Sie sind das.“' }] },
    { massnahme: 'beschwerden-erfragen', varianten: [{ text: '„Mir tut alles weh. Und ich muss so dringend, aber es kommt nichts.“' }] },
    { massnahme: 'delir-screening-4at', varianten: [
      { wenn: UNRUHIG, text: '4AT: Wachheit normal, AMT4 zwei Fehler, Monate rückwärts nicht möglich, akuter Beginn laut Bericht. Summe deutlich über 4: Delir wahrscheinlich.' },
      { text: '4AT: wacher und ruhiger, nennt Ort und Jahr, Monate rückwärts mit Hilfe bis Juli. Weiterhin auffällig, aber besser.' },
    ] },
    { massnahme: 'schmerz-nrs', varianten: [{ text: 'Schmerz NRS {nrs} in der rechten Hüfte und im Unterbauch.' }] },
    { massnahme: 'blase-tasten', varianten: [
      { wenn: BLASE_VOLL, text: 'Unterbauch prall, Druckschmerz über der Symphyse. Blasenscan: etwa 750 ml.' },
      { text: 'Unterbauch weich, Blase nicht mehr tastbar.' },
    ] },
    { massnahme: 'urin-beobachten', varianten: [
      { wenn: BLASE_VOLL, text: 'Urinflasche leer. Seit 15 Uhr ist kein Wasserlassen dokumentiert.' },
      { text: 'Über den Einmalkatheter kamen 720 ml konzentrierter Urin.' },
    ] },
    { massnahme: 'bilanz-fuehren', varianten: [{ text: 'Einfuhr seit 6 Uhr etwa 1.300 ml, Ausfuhr dokumentiert 400 ml bis 15 Uhr.' }] },
    { massnahme: 'sturzrisiko-einschaetzen', varianten: [{ text: 'Hohes Sturzrisiko: frisch operiert, Delir, Harndrang, nachts, ohne Brille. Bett steht hoch, Rollator in der Ecke.' }] },
    { massnahme: 'wunde-beurteilen', varianten: [{ text: 'Verband an der Hüfte trocken, Rand reizlos, keine Schwellung.' }] },
    { massnahme: 'haut-beobachten', varianten: [{ text: 'Rosig, warm, Mundschleimhaut etwas trocken.' }] },
    { massnahme: 'sturzprophylaxe-bett', varianten: [{ text: 'Niedrigbett ganz unten, Sturzmatte davor, Klingel und Urinflasche in Reichweite, Nachtlicht an. Rollator neben dem Bett.' }] },
    { massnahme: 'umgebung-sichern', varianten: [{ text: 'Stolperfallen weg, Nachtlicht an, Weg zur Toilette frei.' }] },
    { massnahme: 'reizarm-gestalten', varianten: [{ text: 'Du ziehst den Vorhang zum Mitpatienten zu, stellst das Deckenlicht aus und das Nachtlicht an und sprichst leise.' }] },
    { massnahme: 'rr-messen', varianten: [{ text: 'RR {rrSys}/{rrDia} mmHg.', zeigt: ['rrSys', 'rrDia'] }] },
    { massnahme: 'puls-zaehlen', varianten: [{ text: 'Puls {hf}/min, regelmäßig.', zeigt: ['hf'] }] },
    { massnahme: 'af-zaehlen', varianten: [{ text: 'AF {af}/min.', zeigt: ['af'] }] },
    { massnahme: 'pulsoxy-anlegen', varianten: [{ text: 'SpO₂ {spo2} %.', zeigt: ['spo2'] }] },
    { massnahme: 'temperatur-ohr', varianten: [{ text: '{temp} °C.', zeigt: ['temp'] }] },
    { massnahme: 'bz-messen', varianten: [{ text: 'BZ {bz} mg/dl.', zeigt: ['bz'] }] },
    { massnahme: 'kurve-lesen', varianten: [{ text: 'DK gestern früh gezogen, seitdem 400 ml Urin bis 15 Uhr dokumentiert. Metamizol zuletzt 16 Uhr. Anordnung: bei Restharn über 400 ml Einmalkatheter nach Rücksprache. Vorsorgevollmacht: Sohn. Keine FEM-Genehmigung.' }] },
    { massnahme: 'einmalkatheter', varianten: [{ text: 'Mit Anleitung aseptisch katheterisiert. Es laufen 720 ml konzentrierter Urin ab. Herr Vogt seufzt: „Ah, das tut gut.“' }] },
    { massnahme: 'schmerzmittel-geben', varianten: [{ text: 'Er schluckt die Tablette mit etwas Wasser.' }] },
    { massnahme: 'lorazepam-geben', varianten: [{ text: 'Er nimmt die Tablette. Nach einer Weile wird er schläfrig, nestelt aber weiter und versucht aufzustehen.' }] },
    { massnahme: 'trinken-anbieten', varianten: [{ text: 'Er trinkt ein halbes Glas Wasser.' }] },
    { massnahme: 'fem-anlegen', varianten: [{ text: 'Du ziehst beide Bettgitter hoch. Herr Vogt rüttelt daran und versucht, darüber zu steigen.' }] },
  ],

  gespraech: [
    { id: 'g-mitpatient', frage: 'Mitpatienten Herrn Ahrens fragen, was er bemerkt hat', an: 'patient', kompetenzbereiche: ['I', 'II'],
      antwort: [{ text: '„Seit Mitternacht redet er mit seiner Frau, die nicht da ist. Vorhin wollte er aufstehen, ich hab geklingelt. Und er war dauernd an der Flasche, aber es kommt nichts.“', setzt: ['mitpatient-info'] }],
      fakten: ['Unruhe seit Mitternacht', 'Harndrang ohne Wasserlassen'] },
    { id: 'g-kollegin', frage: 'Kollegin Sabine bitten, kurz bei Herrn Vogt zu bleiben, während du das Material holst', an: 'kollegin', kompetenzbereiche: ['III'],
      antwort: [{ text: '„Mach ich, ich setz mich zu ihm. Bring gleich das Kathetermaterial mit.“', setzt: ['kollegin-da'] }] },
    { id: 'g-sohn', frage: 'Sohn (Vorsorgevollmacht) anrufen: Lage schildern, fragen, was sonst hilft', an: 'angehoerige', kompetenzbereiche: ['II', 'IV'],
      nurWenn: { getan: 'kurve-lesen' },
      antwort: [{ text: '„So kenn ich ihn gar nicht. Er hört schlecht, ohne Hörgerät versteht er nichts. Morgen früh komm ich mit Mama. Machen Sie halt die Gitter hoch, sonst fällt er raus.“', setzt: ['sohn-informiert'] }],
      fakten: ['Hörgerät wichtig', 'Besuch morgen früh', 'wünscht Bettgitter'] },
    { id: 'g-sohn-gitter', frage: 'Dem Sohn erklären, warum ihr kein Bettgitter hochmacht und was ihr stattdessen tut', an: 'angehoerige', kompetenzbereiche: ['II', 'IV'],
      nurWenn: { flag: 'sohn-informiert' },
      antwort: [{ text: '„Ach so, er klettert dann drüber? Das wusste ich nicht. Gut, dann so. Danke, dass Sie angerufen haben.“', setzt: ['sohn-fem-erklaert'] }] },
  ],

  sbar: [
    { id: 's-delir', teil: 'S', text: 'Walter Vogt, 84, Zimmer 12, zweiter Tag nach Hüft-TEP rechts: seit Mitternacht akut verwirrt, will aufstehen.', art: 'kern' },
    { id: 'b-op', teil: 'B', text: 'Tagsüber orientiert. Dauerkatheter gestern gezogen, Prostatavergrößerung. Metamizol zuletzt 16 Uhr.', art: 'kern' },
    { id: 'b-hof', teil: 'B', text: 'Er war Landwirt und spricht von seinen Kühen.', art: 'ablenker' },
    { id: 'a-4at', teil: 'A', text: '4AT deutlich auffällig: Delir wahrscheinlich, akuter Beginn.', art: 'kern', bekanntWenn: { getan: 'delir-screening-4at' } },
    { id: 'a-blase', teil: 'A', text: 'Blase prall, Blasenscan etwa 750 ml, seit 15 Uhr kein Urin.', art: 'kern', bekanntWenn: { getan: 'blase-tasten' } },
    { id: 'a-schmerz', teil: 'A', text: 'Schmerz in Hüfte und Unterbauch.', art: 'hilfreich', bekanntWenn: { getan: 'schmerz-nrs' } },
    { id: 'a-ruhiger', teil: 'A', text: 'Seit Katheter und Schmerzmittel deutlich ruhiger, schläft zwischendurch, orientiert sich mit Brille und Hörgerät.', art: 'hilfreich',
      bekanntWenn: { alle: [{ getan: 'einmalkatheter' }, { getan: 'delir-screening-4at' }, { nicht: UNRUHIG }] } },
    { id: 'a-demenz', teil: 'A', text: 'Wahrscheinlich eine Demenz, die nachts schlimmer wird.', art: 'falsch' },
    { id: 'r-katheter', teil: 'R', text: 'Bitte um Anordnung Einmalkatheter und Schmerzmittel, und dass Sie ihn sich anschauen.', art: 'kern' },
  ],

  anordnungen: [
    { id: 'an-katheter', massnahme: 'einmalkatheter', text: 'Einmalkatheter, Urinmenge dokumentieren.' },
    { id: 'an-metamizol', massnahme: 'schmerzmittel-geben', text: 'Metamizol 1 g p. o. jetzt.' },
    { id: 'an-lorazepam', massnahme: 'lorazepam-geben', text: 'Lorazepam 1 mg p. o. zur Nacht.',
      fehlerhaft: {
        warum: 'Benzodiazepine stehen bei Hochbetagten auf der PRISCUS-Liste. Bei einem Delir verstärken sie Verwirrtheit und Sturzgefahr. Erst die Auslöser behandeln.',
        korrektur: '„Sie haben recht, das lassen wir. Erst Blase und Schmerz. Wenn er sich oder andere gefährdet, rufen Sie mich wieder an.“',
      } },
  ],

  arzt: {
    name: 'Dienstarzt Unfallchirurgie Dr. Yilmaz',
    erreichbar: 'telefon',
    regeln: [
      { ...R_ANORDNUNG, wenn: { gemeldet: ['a-4at', 'a-blase'] } },
      { id: 'r-blase-frage', wenn: { gemeldet: ['a-4at'] },
        antwort: '„Ein Delir, verstanden. Wir suchen den Auslöser.“',
        rueckfrage: { text: '„Hat er Wasser gelassen, seit der Katheter raus ist? Haben Sie die Blase getastet?“', erwartet: ['a-blase'], auftrag: 'af-blase' } },
      { wenn: { gemeldet: ['a-demenz'] }, antwort: '„Tagsüber war er orientiert. Ein akuter Beginn spricht eher für ein Delir. Haben Sie ein Screening gemacht, und was sagt die Blase?“' },
    ],
    auftraege: [
      { id: 'af-blase', text: 'Blase tasten oder scannen und dem Arzt melden', erledigt: { getan: 'blase-tasten' }, meldung: ['a-blase'], meldenBinnenSek: 600,
        folge: [{ ...R_ANORDNUNG, wenn: { gemeldet: ['a-4at'] } }] },
      { id: 'af-verlauf', text: 'Nach einer halben Stunde Urinmenge, Schmerz und 4AT melden', meldenBinnenSek: 2400,
        erledigt: { alle: [{ getan: 'einmalkatheter' }, { getan: 'schmerz-nrs' }, { getan: 'delir-screening-4at' }, { ab: 1200 }] },
        meldung: ['a-ruhiger', 'wert:schmerz'],
        folge: [{ wenn: { ab: 0 }, antwort: '„Gut. Wir schauen morgen bei der Visite nach Ursachen wie Hb und Infekt. Bitte weiter Trinken anbieten und Bilanz.“', setzt: ['verlauf-gemeldet'] }] },
    ],
  },

  ereignisse: [
    { id: 'e-aufstehen', art: 'komplikation', wann: { ab: 600 },
      text: 'Herr Vogt hat ein Bein über der Bettkante und zieht am Verband: „Lassen Sie mich, ich muss in den Stall!“',
      entscheidung: [
        { id: 'w-begleiten', text: 'Ruhig dazugehen, ihn mit Namen ansprechen, beim Sitzen an der Bettkante sichern, Urinflasche anbieten, dann Bett tief stellen', wertung: 'gut', warum: 'Begleiten statt festhalten. Sein Bedürfnis (Wasserlassen) ist echt.' },
        { id: 'w-gitter', text: 'Beide Bettgitter hochziehen, damit er liegen bleibt', wertung: 'gefaehrlich', warum: 'Bettgitter sind eine freiheitsentziehende Maßnahme ohne Genehmigung. Delirante Menschen steigen darüber und stürzen tiefer.' },
      ] },
    { id: 'e-kollegin', art: 'team', wann: { getan: 'hilfe-holen' }, text: 'Kollegin Sabine kommt aus dem Nachbarzimmer: „Brauchst du mich?“' },
  ],

  pa: {
    name: 'Praxisanleiterin Frau Neumann',
    hilfen: [
      { wenn: { nicht: { getan: 'delir-screening-4at' } }, impuls: 'Tagsüber orientiert, jetzt verwirrt. Wie nennt man das, und wie prüfst du es?', tipp: 'Akuter Beginn spricht für ein Delir. Mach den 4AT.' },
      { wenn: { nicht: { getan: 'blase-tasten' } }, impuls: 'Der Katheter ist gestern rausgekommen, er hat eine große Prostata. Woran denkst du?', tipp: 'Harnverhalt: Blase tasten oder scannen.' },
      { wenn: { nicht: { getan: 'kommunikationshilfe' } }, impuls: 'Wie soll er sich orientieren, wenn er nichts sieht und hört?', tipp: 'Brille und Hörgerät liegen im Nachtschrank.' },
      { wenn: { alle: [{ flag: 'arzt-informiert' }, { nicht: { flag: 'remonstriert:an-lorazepam' } }] }, impuls: 'Lorazepam bei 84 Jahren und Delir. Was meinst du dazu?', tipp: 'PRISCUS-Liste: Benzodiazepine verschlimmern Delir und Sturzgefahr. Frag nach.' },
      { impuls: 'Er will aufstehen. Wie schützt du ihn, ohne ihn festzuhalten?', tipp: 'Niedrigbett, Sturzmatte, Klingel, Licht, begleiten. Bettgitter sind eine FEM.' },
    ],
  },
  team: { kollegin: 'Kollegin Sabine (Nachtdienst)', weitere: { angehoerige: 'Sohn Thomas Vogt (Vorsorgevollmacht, telefonisch)' } },

  bewertung: {
    pflicht: [
      { id: 'p-4at', text: 'Delir-Screening (4AT) durchgeführt', gewicht: 2, kompetenzbereiche: ['I'], erfuellt: { getan: 'delir-screening-4at' },
        warum: 'Ein Delir ist ein Notfall mit erhöhter Sterblichkeit. Ein Screening macht es sichtbar und vergleichbar.' },
      { id: 'p-blase', text: 'Blase geprüft (Harnverhalt erkannt)', gewicht: 3, kompetenzbereiche: ['I', 'V'], erfuellt: { getan: 'blase-tasten', bis: 900 },
        warum: 'Nach Katheterentfernung und bei Prostatavergrößerung ist der Harnverhalt ein häufiger, gut behandelbarer Delir-Auslöser.' },
      { id: 'p-schmerz', text: 'Schmerz eingeschätzt', gewicht: 2, kompetenzbereiche: ['I'], erfuellt: { getan: 'schmerz-nrs' },
        warum: 'Schmerz ist ein Delir-Auslöser; die letzte Gabe war vor zehn Stunden.' },
      { id: 'p-orient', text: 'Orientierung gegeben, Brille und Hörgerät eingesetzt', gewicht: 2, kompetenzbereiche: ['I', 'II'],
        erfuellt: { alle: [{ getan: 'reorientieren' }, { getan: 'kommunikationshilfe' }] },
        warum: 'Sinneshilfen und Orientierung sind die wirksamsten nicht-medikamentösen Maßnahmen.' },
      { id: 'p-sturz', text: 'Sturzprophylaxe ohne Freiheitsentzug', gewicht: 2, kompetenzbereiche: ['I', 'IV'],
        erfuellt: { alle: [{ getan: 'sturzprophylaxe-bett' }, { nicht: { getan: 'fem-anlegen' } }] },
        warum: 'Niedrigbett und Sturzmatte schützen, ohne die Freiheit zu entziehen.' },
      { id: 'p-arzt', text: 'Arzt mit 4AT und Blasenbefund informiert', gewicht: 3, kompetenzbereiche: ['II', 'III'], erfuellt: { flag: 'arzt-informiert' },
        warum: 'Ein Delir braucht ärztliche Ursachensuche; der Katheter braucht eine Anordnung.' },
      { id: 'p-remonstration', text: 'Lorazepam beim hochbetagten Delirpatienten hinterfragt', gewicht: 3, kompetenzbereiche: ['III', 'IV'], erfuellt: { flag: 'remonstriert:an-lorazepam' },
        warum: 'Benzodiazepine verschlimmern ein Delir und erhöhen die Sturzgefahr (PRISCUS).' },
      { id: 'p-katheter', text: 'Einmalkatheter nach Anordnung gelegt', gewicht: 2, kompetenzbereiche: ['I', 'III'], erfuellt: { getan: 'einmalkatheter' },
        warum: 'Die volle Blase ist Schmerz und Delir-Auslöser zugleich.' },
      { id: 'p-rueckauftrag', text: 'Verlauf nach einer halben Stunde gemeldet', gewicht: 2, kompetenzbereiche: ['II', 'III'], erfuellt: { auftrag: 'af-verlauf', status: 'gemeldet' },
        warum: 'Der Arzt braucht die Rückmeldung, ob die Maßnahmen wirken (Closed Loop).' },
      { id: 'p-sohn', text: 'Sohn mit Vorsorgevollmacht informiert, Bettgitter erklärt', gewicht: 1, kompetenzbereiche: ['II', 'IV'], erfuellt: { flag: 'sohn-fem-erklaert' },
        warum: 'Der Bevollmächtigte entscheidet mit. Ein Bettgitter bräuchte zusätzlich die Genehmigung des Betreuungsgerichts.' },
      { id: 'p-doku', text: '4AT, Urinmenge und Verlauf dokumentiert', gewicht: 2, kompetenzbereiche: ['I', 'IV'], erfuellt: { dokumentiert: 'a-4at' },
        warum: 'Der Tagdienst braucht den Verlauf, um das Delir weiter zu beobachten.' },
    ],
    fehler: [
      { id: 'f-gitter', text: 'Bettgitter ohne Genehmigung hochgezogen', schwere: 'schwer', kompetenzbereiche: ['IV', 'I'],
        wenn: { eine: [{ getan: 'fem-anlegen' }, { getan: 'wahl:e-aufstehen:w-gitter' }] },
        folge: { text: 'Herr Vogt rüttelt am Gitter, wird immer unruhiger und versucht, darüber zu klettern.', wirkung: [{ groesse: 'unruhe', delta: 0.3, beginnSek: 0, spitzeSek: 120, dauerSek: 'dauerhaft' }, { groesse: 'angst', delta: 0.2, beginnSek: 0, spitzeSek: 120, dauerSek: 'dauerhaft' }] },
        warum: 'Bettgitter sind eine freiheitsentziehende Maßnahme (§ 1831 BGB). Bei Delir erhöhen sie Unruhe und Sturzhöhe.' },
      { id: 'f-lorazepam', text: 'Lorazepam beim hochbetagten Delirpatienten gegeben', schwere: 'mittel', kompetenzbereiche: ['I', 'III'],
        wenn: { getan: 'lorazepam-geben' }, warum: 'Benzodiazepine verstärken das Delir und die Sturzgefahr.' },
    ],
    ende: [
      { wenn: { alle: [{ flag: 'verlauf-gemeldet' }, { getan: 'sturzprophylaxe-bett' }, { getan: 'pflegebericht' }, { flag: 'sohn-fem-erklaert' }] },
        text: 'Herr Vogt schläft im Niedrigbett, Brille auf dem Nachttisch, Hörgerät in der Dose. Das Nachtlicht brennt. Die Übergabe an den Frühdienst ist vorbereitet.', ausgang: 'stabil' },
      { wenn: { ab: 3000 }, text: 'Herr Vogt ist schwer verwirrt, hat den Verband abgerissen und ist am Bett gestürzt.', ausgang: 'verschlechtert' },
    ],
  },

  pflegebedarf: {
    probleme: [
      { id: 'pb-delir', text: 'Akute Verwirrtheit (Delir) durch Harnverhalt, Schmerz und fremde Umgebung', richtig: true, prioritaet: 1, warum: 'Akuter Beginn, 4AT auffällig, behandelbare Auslöser.' },
      { id: 'pb-harnverhalt', text: 'Harnverhalt nach Katheterentfernung', richtig: true, prioritaet: 1, warum: 'Blasenscan 750 ml, seit 15 Uhr kein Urin.' },
      { id: 'pb-sturz', text: 'Hohe Sturzgefahr', richtig: true, prioritaet: 2, warum: 'Delir, frische Hüft-OP, Harndrang, Nacht.' },
      { id: 'pb-schmerz', text: 'Akuter Schmerz nach Operation', richtig: true, prioritaet: 2, warum: 'NRS 5, letzte Gabe vor zehn Stunden.' },
      { id: 'pb-demenz', text: 'Fortgeschrittene Demenz', richtig: false, warum: 'Tagsüber war er orientiert. Das akute Bild ist ein Delir, keine Demenz.' },
    ],
    ziele: [
      { id: 'z-orient', text: 'Herr Vogt ist am Morgen zu Ort und Person orientiert (4AT unter 4).', passtZu: ['pb-delir'], richtig: true },
      { id: 'z-blase', text: 'Die Blase ist entleert, Restharn unter 150 ml, Ausfuhr wird bilanziert.', passtZu: ['pb-harnverhalt'], richtig: true },
      { id: 'z-sturz', text: 'Herr Vogt stürzt in der Nacht nicht, ohne dass Bettgitter oder Gurte nötig sind.', passtZu: ['pb-sturz'], richtig: true },
      { id: 'z-ruhig', text: 'Herr Vogt schläft durch ein Beruhigungsmittel bis zum Morgen.', passtZu: ['pb-delir'], richtig: false },
    ],
  },

  leitfaden: [
    { titel: 'Delir erkennen', text: 'Akuter Beginn, wechselnde Aufmerksamkeit und Orientierung. Mit dem 4AT einschätzen und den Verlauf dokumentieren. Ein Delir ist ein Notfall, keine „Altersverwirrtheit“.', quellen: ['4at', 'nice-delir'] },
    { titel: 'Auslöser suchen', text: 'An Schmerz, Harnverhalt, Verstopfung, Flüssigkeitsmangel, Infekt, Sauerstoffmangel, Blutzucker und neue Medikamente denken. Viele Auslöser kann die Pflege selbst finden.', quellen: ['nice-delir', 's3-delir-alter', 's3-delir'] },
    { titel: 'Nicht-medikamentöse Maßnahmen', text: 'Brille und Hörgerät, Licht, Uhr, ruhige Ansprache, eine Bezugsperson, vertraute Dinge, Schlaf schützen, früh mobilisieren.', quellen: ['nice-delir'] },
    { titel: 'Medikamente prüfen', text: 'Benzodiazepine verschlimmern ein Delir und erhöhen die Sturzgefahr; Ausnahme ist der Alkoholentzug. Eine solche Anordnung hinterfragst du.', quellen: ['priscus', 's3-delir-alter', 's3-delir'] },
    { titel: 'Sturz verhindern ohne Freiheitsentzug', text: 'Niedrigbett, Sturzmatte, Klingel, Begleitung. Bettgitter sind freiheitsentziehend und brauchen die Einwilligung der Person oder eine gerichtliche Genehmigung.', quellen: ['dnqp-sturz', 'bgb-1831'] },
  ],

  pruefwege: {
    muster: [
      { art: 'massnahme', id: 'vorstellen-einverstaendnis' },
      { art: 'massnahme', id: 'kommunikationshilfe' },
      { art: 'massnahme', id: 'reorientieren' },
      { art: 'massnahme', id: 'sturzprophylaxe-bett' },
      { art: 'massnahme', id: 'beschwerden-erfragen' },
      { art: 'massnahme', id: 'delir-screening-4at' },
      { art: 'massnahme', id: 'schmerz-nrs' },
      { art: 'massnahme', id: 'blase-tasten' },
      { art: 'massnahme', id: 'kurve-lesen' },
      { art: 'frage', id: 'g-mitpatient' },
      { art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: ['s-delir', 'b-op', 'a-4at', 'a-blase', 'a-schmerz', 'r-katheter'] },
      { art: 'rueckmelden', anordnung: 'an-katheter', rueckgelesen: true },
      { art: 'rueckmelden', anordnung: 'an-metamizol', rueckgelesen: true },
      { art: 'remonstrieren', anordnung: 'an-lorazepam', grund: '84 Jahre und Delir: Benzodiazepine stehen auf der PRISCUS-Liste und erhöhen die Sturzgefahr.' },
      { art: 'auflegen', an: 'aerztin' },
      { art: 'frage', id: 'g-kollegin' },
      { art: 'massnahme', id: 'schmerzmittel-geben' },
      { art: 'massnahme', id: 'einmalkatheter' },
      { art: 'massnahme', id: 'reizarm-gestalten' },
      { art: 'massnahme', id: 'trinken-anbieten' },
      { art: 'frage', id: 'g-sohn' },
      { art: 'frage', id: 'g-sohn-gitter' },
      { art: 'warten', sek: 300 },
      { art: 'massnahme', id: 'schmerz-nrs' },
      { art: 'massnahme', id: 'delir-screening-4at' },
      { art: 'nachricht', an: 'aerztin', kanal: 'messenger', bausteine: ['a-ruhiger', 'wert:schmerz'] },
      { art: 'dokumentieren', bausteine: ['a-4at', 'a-blase', 'a-ruhiger', 'anordnung:an-katheter', 'anordnung:an-metamizol'] },
      { art: 'abschluss', probleme: ['pb-delir', 'pb-harnverhalt', 'pb-sturz', 'pb-schmerz'], ziele: ['z-orient', 'z-blase', 'z-sturz'],
        sbar: ['s-delir', 'b-op', 'a-4at', 'a-blase', 'a-ruhiger'] },
    ],
    unterlassung: { bisSek: 2100, erwartet: { wert: 'delir', vergleich: '>', grenze: 0.6 } },
    grenze: { rolle: 2, events: [{ art: 'massnahme', id: 'einmalkatheter' }], erwartet: 'pa-eingriff' },
  },
};
