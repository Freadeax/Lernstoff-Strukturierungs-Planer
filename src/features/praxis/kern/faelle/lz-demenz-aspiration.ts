// P18 · CE09/CE08 · stationäre Langzeitpflege: Bewohner mit fortgeschrittener Demenz isst nicht mehr,
// Verdacht auf Aspirationspneumonie, Patientenverfügung und Betreuer. Migriert aus Altfall „demenz“ und fachlich neu geschrieben.
// Entwurf, fachlich UNGEPRÜFT. Inhalte fiktiv/didaktisch. Muster: lz-demenz-schmerz.ts (Runde 2).

import { KATALOG } from '../katalog';
import type { ArztRegel, Bedingung, FallV2, MassnahmeDefinition } from '../typen';

const aus = (id: string, mehr: Partial<MassnahmeDefinition>): MassnahmeDefinition => ({ ...KATALOG[id]!, ...mehr });

const AUFRECHT: Bedingung = { getan: 'oberkoerper-hoch' };
const ATMUNG_GEZAEHLT: Bedingung = { eine: [{ getan: 'af-zaehlen' }, { getan: 'atmung-beobachten' }] };

const ANTWORT_VOLL = 'Danke, das ist eine klare Meldung. Das klingt nach einer Aspirationspneumonie. Nach der Verfügung und dem, was der Sohn sagt, behandeln wir im Heim. Ich schreibe an: Amoxicillin/Clavulansäure 875 mg als Tablette morgens und abends, Paracetamol 500 mg als Zäpfchen bis dreimal am Tag bei Fieber oder Schmerz, Sauerstoff 2 l über die Brille bei Atemnot, Oberkörper hoch, Kost und Getränke angedickt. Ich komme nach der Sprechstunde gegen 13 Uhr. Messen Sie in einer halben Stunde noch einmal Temperatur und Atemfrequenz und schicken Sie mir die Werte.';
const REGEL_VOLL: ArztRegel = {
  id: 'r-voll', wenn: { gemeldet: ['a-rasseln', 'wert:temp', 'wert:spo2', 'b-verfuegung'] },
  antwort: `„${ANTWORT_VOLL}“`, anordnungen: ['an-abx-tablette', 'an-paracetamol', 'an-o2', 'an-kost'], setzt: ['arzt-informiert'], auftraege: ['af-verlauf'],
};

export const LZ_DEMENZ_ASPIRATION: FallV2 = {
  schema: 2,
  id: 'lz-demenz-aspiration',
  version: '0.1.0',
  spur: 'A',
  setting: 'langzeit',
  altersgruppe: 'hochbetagt',
  titel: '„Herr Kühn isst seit gestern nichts“',
  kurz: 'Pflegeheim, Frühdienst: 89-Jähriger mit fortgeschrittener Demenz dreht beim Essen den Kopf weg, hustet beim Trinken und atmet schnell.',
  rahmen: 'Du arbeitest im Frühdienst im Wohnbereich 1 eines Pflegeheims. Deine Praxisanleiterin ist im Haus, die Hausärztin erreichst du über Telefon und Praxis-Messenger.',
  lernziele: [
    'Hinter „isst nicht“ bei Demenz eine körperliche Ursache suchen: Schluckstörung, Aspiration, Fieber, Atemnot, Schmerz (BESD).',
    'Aspirationsprophylaxe umsetzen: aufrecht lagern, Mund reinigen, Kost und Getränke andicken, nie im Liegen anreichen.',
    'Patientenverfügung und Betreuer kennen und einbringen: Behandlung im Heim statt Einweisung, wenn das dem Willen entspricht.',
    'Eine nicht passende Arzneiform (große Tablette bei Schluckstörung) erkennen und nachfragen.',
    'Die Hausärztin strukturiert informieren, Rückauftrag erledigen und dokumentieren.',
  ],
  lehrplan: {
    ce: ['ce.09', 'ce.08'], abschnitt: ['ad12', 'ad3'],
    themen: ['thema.kl.demenz', 'thema.pro.aspiration', 'thema.kl.atmung', 'thema.re.betreuung', 'thema.pro.pneumonie'],
    kompetenzen: ['I.6.a', 'II.1.e', 'I.3.a'],
  },
  geeignet: { rollen: [2, 3], stufen: [1, 2, 3] },
  dauerMin: [12, 18],
  freigabe: {
    status: 'entwurf',
    pruefpunkte: [
      'Amoxicillin/Clavulansäure: als Saft verfügbar, Tablette teilbar/mörserbar? Formulierung der Remonstration gegen Fachinformation prüfen',
      'Sauerstoff im Pflegeheim nur nach Anordnung und zur Linderung: Formulierung mit Leitlinie prüfen',
      'Ablauf Behandlung im Heim nach Patientenverfügung, Rolle des Betreuers (§ 1827, § 1828 BGB) prüfen',
      'Verlauf Pneumonie/Atemnot im Lernmodell plausibel (SpO₂ zu Beginn um 90 %)?',
    ],
  },
  quellen: [
    { id: 'dnqp-ernaehrung', titel: 'DNQP: Expertenstandard Ernährungsmanagement zur Sicherung und Förderung der oralen Ernährung in der Pflege, 1. Aktualisierung 2017' },
    { id: 'dnqp-demenz', titel: 'DNQP: Expertenstandard Beziehungsgestaltung in der Pflege von Menschen mit Demenz, 2018' },
    { id: 'besd', titel: 'BESD – Beurteilung von Schmerzen bei Demenz (deutsche Fassung der PAINAD), Basler M. et al. 2006' },
    { id: 's3-demenz', titel: 'S3-Leitlinie Demenzen (DGN/DGPPN, AWMF 038-013), 2023' },
    { id: 's3-pneumonie-ambulant', titel: 'S3-Leitlinie Behandlung von erwachsenen Patienten mit ambulant erworbener Pneumonie (AWMF 020-020), 2021' },
    { id: 'bgb-1827', titel: 'BGB § 1827 Patientenverfügung, § 1828 Gespräch zur Feststellung des Patientenwillens (seit 1.1.2023)' },
  ],

  person: {
    name: 'Herr Kühn',
    alter: { jahre: 89 },
    geschlecht: 'm',
    biografie: ['war Schreinermeister, hat die Möbel seiner Wohnung selbst gebaut', 'Witwer seit acht Jahren', 'Sohn Thomas ist gesetzlicher Betreuer (Gesundheitssorge)', 'mag Blasmusik und Kirschkuchen'],
    diagnosenBekannt: ['Alzheimer-Demenz, schwer', 'Dysphagie (bekannt, Kost angedickt empfohlen)', 'Herzinsuffizienz', 'Pflegegrad 5'],
    medikamentePlan: ['Bisoprolol 2,5 mg 1-0-0', 'Torasemid 5 mg 1-0-0', 'Macrogol bei Bedarf'],
    allergien: ['keine bekannt'],
    hilfsmittel: ['Pflegerollstuhl', 'Lagerungskissen'],
    gewichtKg: 61,
  },
  medien: {
    raum: '26p_pflegeheim_zimmer_pneumonie',
    raumVarianten: [],
  },
  uebernahme: 'Herr Kühn, 89, schwere Alzheimer-Demenz, Pflegegrad 5, spricht nur noch einzelne Worte. Bekannte Schluckstörung, die Logopädin hat vor zwei Monaten angedickte Getränke empfohlen. Gestern Abend hat er sich beim Tee mehrmals verschluckt, heute früh dreht er beim Frühstück den Kopf weg. Er wirkt matter als sonst. Der Nachtdienst hat ihn flach liegen lassen, weil er sonst immer herunterrutscht.',
  startUhrzeit: '08:45',

  start: {
    // Beginnende Aspirationspneumonie rechts: Gasaustausch gestört, Fieber, schnelle Atmung, Delir auf die Demenz
    grund: {
      gasaustausch: 0.66, atemarbeit: 1.3, hydratation: 0.86, volumen: 0.92, temperatur: 38.3,
      orientierung: 0.1, delir: 0.3, unruhe: 0.3, angst: 0.35, schmerz: 4, blutzucker: 118,
    },
    treiber: [
      { art: 'pneumonie', staerke: 0.45 },
      { art: 'exsikkose_progressiv', verlustProStunde: 0.008 },
      { art: 'delir_trigger', ausloeser: ['infekt'] },
    ],
    bild: { haltung: 'liegt', haut: 'gerötet-heiss', mimik: 'schlaefrig' },
    sichtbar: [],
  },

  massnahmen: [
    // Gespräch
    'vorstellen-einverstaendnis', 'validierend-sprechen',
    // Beobachten
    'bewusstsein-avpu', 'atmung-beobachten', 'atemgeraeusche-hoeren', 'haut-beobachten', 'schmerz-besd', 'schmerz-nrs',
    'schleimhaut-pruefen', 'schlucken-pruefen', 'dekubitusrisiko-einschaetzen', 'delir-screening-4at',
    // Akut
    'oberkoerper-hoch', 'o2-geben', 'absaugen-oral', 'notruf-112',
    // Messen (Pflegetasche)
    'af-zaehlen', 'pulsoxy-anlegen', 'rr-messen', 'puls-zaehlen', 'temperatur-ohr', 'bz-messen', 'kurve-lesen',
    // Versorgen
    'mundpflege', 'kost-anpassen', 'trinken-anbieten', 'essen-anreichen', 'positionieren-druckentlastung',
    'abx-tablette-geben', 'abx-saft-geben', 'paracetamol-zaepfchen',
    // Melden
    'pflegefachperson-informieren', 'pflegebericht', 'pflegeplanung-anpassen',
  ],
  massnahmenZusatz: [
    aus('mundpflege', {
      name: 'Mund inspizieren und reinigen, Speisereste aus den Wangentaschen entfernen', setzt: ['mund-sauber'],
      wirkung: [{ groesse: 'atemarbeit', faktor: 0.97, beginnSek: 0, spitzeSek: 120, dauerSek: 'dauerhaft' }],
    }),
    aus('trinken-anbieten', {
      name: 'Getränk anbieten (Tee aus dem Schnabelbecher)',
      wirkung: [{ groesse: 'hydratation', delta: 0.03, beginnSek: 0, spitzeSek: 1800, dauerSek: 'dauerhaft' }],
    }),
    aus('o2-geben', { name: 'Sauerstoff 2 l/min über Nasenbrille vom Konzentrator (nach Anordnung, zur Linderung)', wirkung: [{ groesse: 'sauerstoff', delta: 2, beginnSek: 0, spitzeSek: 30, dauerSek: 'dauerhaft' }] }),
    aus('bedarfsmedikation-oral', { id: 'abx-tablette-geben', name: 'Amoxicillin/Clavulansäure 875 mg als Tablette mit Wasser geben', setzt: ['antibiotikum'] }),
    aus('bedarfsmedikation-oral', { id: 'abx-saft-geben', name: 'Amoxicillin/Clavulansäure als Saft, angedickt, aufrecht sitzend geben', setzt: ['antibiotikum'] }),
    aus('bedarfsmedikation-oral', {
      id: 'paracetamol-zaepfchen', name: 'Paracetamol 500 mg als Zäpfchen geben (nach Anordnung)',
      treiber: [{ art: 'wirkstoff', id: 'paracetamol', dosisMg: 500, weg: 'rektal' }],   // G1
    }),
  ],

  akte: {
    aufnahmegrund: 'Einzug vor vier Jahren nach mehreren Stürzen und nächtlichem Umherlaufen. Vollstationäre Pflege, seit einem Jahr Pflegegrad 5.',
    anamnese: [
      'War Schreinermeister, Witwer. Spricht nur noch einzelne Worte, erkennt den Sohn meist noch an der Stimme.',
      'Schluckstörung seit etwa einem Jahr. Logopädie vor zwei Monaten: Getränke angedickt (Stufe „sirupartig“), weiche Kost, aufrecht sitzend anreichen.',
      'Rutscht im Bett oft nach unten, wird vom Nachtdienst dann flach gelegt.',
      'Sohn Thomas Kühn ist gesetzlicher Betreuer (Gesundheitssorge), wohnt im Ort, kommt jeden Sonntag.',
    ],
    diagnosen: [
      { text: 'Alzheimer-Demenz, schwer', icd: 'G30.1', seit: '2018' },
      { text: 'Oropharyngeale Dysphagie', icd: 'R13.1', seit: '2025' },
      { text: 'Herzinsuffizienz NYHA II', icd: 'I50.12', seit: '2020' },
      { text: 'Chronische Obstipation', icd: 'K59.09', seit: '2022' },
    ],
    medikation: [
      { id: 'mp-bisoprolol', wirkstoff: 'Bisoprolol', staerke: '2,5 mg', form: 'Tbl. (gemörsert in Apfelmus)', schema: '1-0-0-0', zuletzt: 'heute 08:00', hinweis: 'Heute früh mit Apfelmus gegeben, viel wieder herausgelaufen.' },
      { id: 'mp-torasemid', wirkstoff: 'Torasemid', staerke: '5 mg', form: 'Tbl. (gemörsert in Apfelmus)', schema: '1-0-0-0', zuletzt: 'heute 08:00' },
      { id: 'mp-macrogol', wirkstoff: 'Macrogol', staerke: '13,1 g', form: 'Btl.', bedarf: { indikation: 'kein Stuhlgang seit 3 Tagen', einzeldosis: '1 Beutel', maxProTag: '2 Gaben' }, zuletzt: 'vor 2 Tagen' },
      { id: 'mp-paracetamol', wirkstoff: 'Paracetamol', staerke: '500 mg', form: 'Supp.', massnahme: 'paracetamol-zaepfchen',
        bedarf: { indikation: 'Fieber über 38,5 °C oder Schmerz (BESD ab 2)', einzeldosis: '500 mg', maxProTag: '3 Gaben', abstandH: 6 },
        hinweis: 'Neu nach Anordnung der Hausärztin. Zäpfchen wegen Schluckstörung.', geaendertDurch: 'an-paracetamol' },
    ],
    vorwerte: [
      { zeit: 'vor 2 Wochen', vorH: 336, werte: { rrSys: 128, rrDia: 72, hf: 68, af: 16, temp: 36.7, spo2: 95, gewicht: 61.8 }, kuerzel: 'MB' },
      { zeit: 'vorgestern', vorH: 49, werte: { rrSys: 124, rrDia: 70, hf: 72, temp: 36.9 }, kuerzel: 'MB' },
      { zeit: 'gestern 19:30', vorH: 13, werte: { temp: 37.6 }, kuerzel: 'SD' },
    ],
    pflegebericht: [
      { zeit: 'gestern 18:15', wer: 'SD', text: 'Beim Abendessen Tee aus dem Schnabelbecher gegeben (nicht angedickt, Andickungspulver war leer). Mehrfach verschluckt und gehustet. Danach rasch müde.' },
      { zeit: 'heute 02:30', wer: 'ND', text: 'Unruhig, zupft an der Decke, Atmung etwas schneller. Ins Bett zurückgerutscht, flach gelagert.' },
      { zeit: 'heute 08:05', wer: 'FD', text: 'Frühstück abgelehnt, dreht den Kopf weg. Medikamente in Apfelmus, läuft zum Teil aus dem Mundwinkel. Wirkt matt.' },
    ],
    aerztlicheAnordnungen: [
      { zeit: 'vor 2 Monaten', wer: 'Dr. Sander', text: 'Logopädische Empfehlung umsetzen: Getränke angedickt, weiche Kost, aufrecht anreichen. Gewicht einmal pro Woche.' },
    ],
    assessments: [
      { name: 'BESD (Ruhe)', wert: '1 von 10', datum: 'vor 2 Wochen' },
      { name: 'Braden-Skala', wert: '12 Punkte (hohes Risiko)', datum: 'vor 1 Monat' },
      { name: 'Schluckscreening (Logopädie)', wert: 'Aspirationsgefahr bei dünnen Flüssigkeiten', datum: 'vor 2 Monaten' },
      { name: 'MNA-SF', wert: '6 Punkte (Mangelernährung)', datum: 'vor 1 Monat' },
    ],
    labor: [
      { name: 'CRP', wert: '4', einheit: 'mg/l', norm: '< 5', datum: 'vor 3 Monaten (Hausärztin)' },
      { name: 'Kreatinin', wert: '1,1', einheit: 'mg/dl', norm: '0,7–1,2', datum: 'vor 3 Monaten (Hausärztin)' },
    ],
    bilanzVortag: { einfuhrMl: 900, ausfuhrMl: 700 },
    pflegeplanung: [
      { problem: 'Aspirationsgefahr bei Schluckstörung', ziel: 'Isst und trinkt ohne Verschlucken', massnahmen: ['Getränke angedickt', 'aufrecht (mind. 60°) anreichen, 30 Min. danach aufrecht lassen', 'Mundpflege nach jeder Mahlzeit'] },
      { problem: 'Hohes Dekubitusrisiko (Braden 12)', ziel: 'Haut intakt', massnahmen: ['Positionswechsel nach Bewegungsplan', 'Weichlagerungsmatratze'] },
    ],
    rechtliches: [
      'Patientenverfügung (2019, unterschrieben): keine Wiederbelebung, keine Intensivtherapie, keine Ernährung über eine Sonde. Krankenhaus nur, wenn Beschwerden dort besser gelindert werden können. Antibiotika und Linderung ausdrücklich erwünscht.',
      'Gesetzlicher Betreuer: Sohn Thomas Kühn (Gesundheitssorge). Auskunft an den Betreuer.',
    ],
  },

  befunde: [
    { massnahme: 'vorstellen-einverstaendnis', varianten: [{ text: 'Du sprichst ihn mit Namen an und legst die Hand auf seine Schulter. Er öffnet kurz die Augen und murmelt „Nein … nein“.' }] },
    { massnahme: 'bewusstsein-avpu', varianten: [{ text: 'Augen öffnen sich auf Ansprache, er schläft aber immer wieder ein. Schläfriger als sonst.' }] },
    { massnahme: 'atmung-beobachten', varianten: [
      { wenn: AUFRECHT, text: 'Halb sitzend atmet er etwas ruhiger, noch flach und schnell. Husten feucht, kraftlos.' },
      { text: 'Flache, schnelle Atmung, leichte Einziehungen zwischen den Rippen. Feuchter, kraftloser Husten.' },
    ] },
    { massnahme: 'atemgeraeusche-hoeren', varianten: [{ text: 'Rechts unten deutliche feuchte Rasselgeräusche, links fast frei. Pflegerische Beobachtung, die Befundung macht die Ärztin.' }] },
    { massnahme: 'haut-beobachten', varianten: [{ text: 'Gesicht gerötet, Haut heiß und trocken. Lippen nicht bläulich. Steiß gerötet, beim Fingertest wegdrückbar.' }] },
    { massnahme: 'schmerz-besd', varianten: [
      { wenn: { getan: 'paracetamol-zaepfchen' }, text: 'BESD jetzt 2 von 10: Atmung noch etwas angestrengt, Gesicht entspannter, lässt sich berühren.' },
      { text: 'BESD 5 von 10: angestrengte Atmung (1), stöhnt beim Drehen (1), gequälter Gesichtsausdruck (1), zieht sich bei Berührung rechts am Brustkorb zusammen (1), lässt sich kaum ablenken (1). Schmerz wahrscheinlich.' },
    ] },
    { massnahme: 'schmerz-nrs', varianten: [{ text: 'Auf die Frage nach einer Zahl schaut er dich nur an. Eine Selbsteinschätzung gelingt bei schwerer Demenz nicht.' }] },
    { massnahme: 'schleimhaut-pruefen', varianten: [
      { wenn: { flag: 'mund-sauber' }, text: 'Mund jetzt sauber, Schleimhaut trocken, keine Druckstellen.' },
      { text: 'Reste von Apfelmus und Tablettenbrei in der rechten Wangentasche. Zunge trocken, belegt.' },
    ] },
    { massnahme: 'schlucken-pruefen', varianten: [{ text: 'Ein Teelöffel angedickter Tee: verzögerter Schluckreflex, danach Räuspern, die Stimme klingt „gurgelnd“. Bei dünner Flüssigkeit droht erneutes Verschlucken.' }] },
    { massnahme: 'dekubitusrisiko-einschaetzen', varianten: [{ text: 'Braden um 11 Punkte: liegt viel, rutscht, schwitzt. Steiß gerötet, wegdrückbar (noch kein Dekubitus).' }] },
    { massnahme: 'delir-screening-4at', varianten: [{ text: 'Bei schwerer Demenz kaum auswertbar. Laut Team seit gestern deutlich schläfriger und unruhiger als sonst: akute Veränderung, Delir bei Infekt möglich.' }] },
    { massnahme: 'oberkoerper-hoch', varianten: [{ text: 'Ihr zieht ihn zu zweit mit Laken im Bett nach oben, Kopfteil auf etwa 45–60 Grad, Knierolle gegen Herunterrutschen.' }] },
    { massnahme: 'absaugen-oral', varianten: [{ text: 'Du saugst im Mund ab. Er würgt und wehrt sich, es kommt wenig Sekret. Die Speisereste in der Wangentasche bleiben liegen.' }] },
    { massnahme: 'af-zaehlen', varianten: [{ text: 'AF {af}/min.', zeigt: ['af'] }] },
    { massnahme: 'pulsoxy-anlegen', varianten: [{ text: 'SpO₂ {spo2} %.', zeigt: ['spo2'] }] },
    { massnahme: 'rr-messen', varianten: [{ text: 'RR {rrSys}/{rrDia} mmHg.', zeigt: ['rrSys', 'rrDia'] }] },
    { massnahme: 'puls-zaehlen', varianten: [{ text: 'Puls {hf}/min, regelmäßig.', zeigt: ['hf'] }] },
    { massnahme: 'temperatur-ohr', varianten: [{ text: '{temp} °C.', zeigt: ['temp'] }] },
    { massnahme: 'bz-messen', varianten: [{ text: 'BZ {bz} mg/dl.', zeigt: ['bz'] }] },
    { massnahme: 'kurve-lesen', varianten: [{ text: 'Patientenverfügung (2019): keine Wiederbelebung, keine Intensivtherapie, keine Sonde; Krankenhaus nur, wenn Beschwerden dort besser gelindert werden; Antibiotika und Linderung erwünscht. Betreuer: Sohn Thomas. Gestern Abend Tee nicht angedickt (Pulver leer), mehrfach verschluckt.' }] },
    { massnahme: 'mundpflege', varianten: [{ text: 'Du entfernst Apfelmus- und Tablettenreste aus der rechten Wangentasche und reinigst Zunge und Zähne mit einem feuchten Tupfer.' }] },
    { massnahme: 'kost-anpassen', varianten: [{ text: 'Du holst neues Andickungspulver aus dem Lager und dickst Tee und Wasser „sirupartig“ an. Info an die Küche: weiche Kost.' }] },
    { massnahme: 'trinken-anbieten', varianten: [
      { wenn: { alle: [{ flag: 'kost-angepasst' }, AUFRECHT] }, text: 'Aufrecht sitzend nimmt er vom angedickten Tee ein paar Teelöffel, ohne zu husten.' },
      { text: 'Er trinkt einen Schluck dünnen Tee, hustet heftig und läuft rot an.' },
    ] },
    { massnahme: 'essen-anreichen', varianten: [
      { wenn: { alle: [{ flag: 'kost-angepasst' }, AUFRECHT] }, text: 'Er nimmt zwei Löffel Grießbrei, dann dreht er den Kopf weg. Du hörst auf und bietest später wieder an.' },
      { text: 'Im Liegen schiebst du einen Löffel Brei in den Mund. Er hustet, würgt, die Atmung brodelt.' },
    ] },
    { massnahme: 'positionieren-druckentlastung', varianten: [{ text: 'Steiß frei gelagert, 30°-Schräglage links mit Kissen, Oberkörper bleibt erhöht.' }] },
    { massnahme: 'abx-saft-geben', varianten: [{ text: 'Aufrecht sitzend schluckt er den angedickten Saft löffelweise. Abgezeichnet.' }] },
    { massnahme: 'abx-tablette-geben', varianten: [{ text: 'Die große Tablette bleibt im Mund liegen, er hustet. Du holst sie wieder heraus.' }] },
    { massnahme: 'paracetamol-zaepfchen', varianten: [{ text: 'Du erklärst ihm in einfachen Worten, was du tust, und gibst das Zäpfchen in Seitenlage. Abgezeichnet.' }] },
  ],

  gespraech: [
    { id: 'g-schreiner', frage: 'Mit ruhiger Stimme über seine Werkstatt sprechen (Biografie)', an: 'patient', kompetenzbereiche: ['II'],
      antwort: [{ text: 'Er schaut dich kurz an und bewegt die Hand, als würde er hobeln. „Holz …“' }],
      wirkung: [{ groesse: 'angst', delta: -0.15, beginnSek: 0, spitzeSek: 60, dauerSek: 'dauerhaft' }], fakten: ['Schreinermeister'] },
    { id: 'g-sohn', frage: 'Sohn Thomas (Betreuer) anrufen: Lage schildern, Willen seines Vaters und Behandlung im Heim besprechen', an: 'betreuer', kanal: 'telefon', kompetenzbereiche: ['II', 'IV'],
      antwort: [
        { wenn: { flag: 'arzt-informiert' }, text: '„Danke, dass Sie anrufen. Vater wollte nie an Schläuche, aber er soll nicht leiden. Wenn die Ärztin sagt, es geht im Heim mit Antibiotikum, dann so. Ich komme heute Mittag und bin bei der Visite dabei.“', setzt: ['betreuer-einbezogen'] },
        { text: '„Danke, dass Sie anrufen. Vater wollte nie an Schläuche und nie mehr ins Krankenhaus, wenn es sich vermeiden lässt. Er soll aber nicht leiden. Bitte sprechen Sie das mit der Ärztin ab, ich komme heute Mittag.“', setzt: ['betreuer-einbezogen'] },
      ],
      fakten: ['Sohn ist Betreuer', 'Wille: keine Schläuche, möglichst kein Krankenhaus', 'kommt heute Mittag'] },
    { id: 'g-wbl', frage: 'Pflegefachfrau Melanie (Schichtleitung) informieren: Andickungspulver war leer, Herr Kühn hat sich verschluckt', an: 'kollegin', kompetenzbereiche: ['III'],
      antwort: [{ text: '„Gut, dass du es sagst. Ich bestelle sofort nach und schreibe es in die Übergabe. Und ab jetzt lagert ihn keiner mehr flach.“', setzt: ['schichtleitung-informiert'] }] },
  ],

  sbar: [
    { id: 's-kuehn', teil: 'S', text: 'Herr Kühn, 89, Pflegegrad 5: seit gestern Abend verschluckt er sich, isst heute nichts, atmet schnell und ist schläfriger als sonst.', art: 'kern' },
    { id: 's-schwierig', teil: 'S', text: 'Herr Kühn verweigert heute das Essen.', art: 'ablenker' },
    { id: 'b-demenz', teil: 'B', text: 'Schwere Alzheimer-Demenz, bekannte Schluckstörung. Gestern Tee nicht angedickt, mehrfach verschluckt.', art: 'kern' },
    { id: 'b-verfuegung', teil: 'B', text: 'Patientenverfügung: keine Intensivtherapie, keine Sonde, Krankenhaus nur zur besseren Linderung. Antibiotika erwünscht. Betreuer ist der Sohn.', art: 'kern', bekanntWenn: { getan: 'kurve-lesen' } },
    { id: 'b-schreiner', teil: 'B', text: 'Er war früher Schreinermeister.', art: 'ablenker' },
    { id: 'a-rasseln', teil: 'A', text: 'Rechts unten feuchte Rasselgeräusche, schnelle flache Atmung, feuchter Husten: Verdacht auf Aspiration.', art: 'kern', bekanntWenn: { getan: 'atemgeraeusche-hoeren' } },
    { id: 'a-besd', teil: 'A', text: 'BESD erhöht, Schmerzzeichen beim Drehen auf die rechte Seite.', art: 'hilfreich', bekanntWenn: { getan: 'schmerz-besd' } },
    { id: 'a-alter', teil: 'A', text: 'Er will halt nicht mehr essen, das gehört zum Ende der Demenz.', art: 'falsch' },
    { id: 'r-heim', teil: 'R', text: 'Bitte schauen Sie ihn heute an. Ist eine Behandlung hier im Heim möglich, wie es seinem Willen entspricht?', art: 'kern' },
    { id: 'r-einweisen', teil: 'R', text: 'Er muss sofort ins Krankenhaus.', art: 'falsch' },
  ],

  anordnungen: [
    { id: 'an-abx-tablette', massnahme: 'abx-tablette-geben', text: 'Amoxicillin/Clavulansäure 875/125 mg Tablette 1-0-1 mit reichlich Wasser.',
      fehlerhaft: {
        warum: 'Bei bekannter Schluckstörung kann er eine große Tablette nicht sicher schlucken, und dünnes Wasser ist gerade die Ursache der Aspiration. Die Arzneiform muss zum Schluckvermögen passen.',
        korrektur: 'Dann als Saft, angedickt und aufrecht sitzend. Gut, dass Sie nachfragen.',
        ersatz: 'an-abx-saft',
      } },
    { id: 'an-abx-saft', massnahme: 'abx-saft-geben', text: 'Amoxicillin/Clavulansäure als Saft 1-0-1, angedickt, aufrecht sitzend geben.' },
    { id: 'an-paracetamol', massnahme: 'paracetamol-zaepfchen', text: 'Paracetamol 500 mg Zäpfchen bis 3× täglich bei Fieber über 38,5 °C oder Schmerz (BESD ab 2), Abstand mindestens 6 h.' },
    { id: 'an-o2', massnahme: 'o2-geben', text: 'Sauerstoff 2 l/min über Nasenbrille bei Atemnot, Ziel: Erleichterung, nicht ein bestimmter Sättigungswert.' },
    { id: 'an-kost', massnahme: 'kost-anpassen', text: 'Kost weich, alle Getränke angedickt, nur aufrecht sitzend anreichen.' },
  ],

  arzt: {
    name: 'Hausärztin Dr. Sander',
    erreichbar: 'hausarzt-praxis',
    // genau → allgemein. Ohne Fieber/Sättigung fragt sie nach Werten; ohne Verfügung fragt sie nach dem Willen.
    regeln: [
      REGEL_VOLL,
      { id: 'r-wille', wenn: { gemeldet: ['a-rasseln', 'wert:temp', 'wert:spo2'] },
        antwort: '„Das klingt nach einer Lungenentzündung durch Verschlucken. Bevor ich entscheide, ob er ins Krankenhaus muss:“',
        rueckfrage: { text: '„Was steht in seiner Patientenverfügung, und wer ist der Betreuer?“', erwartet: ['b-verfuegung'], auftrag: 'af-verfuegung' } },
      { id: 'r-werte', wenn: { gemeldet: ['a-rasseln'] },
        antwort: '„Rasseln rechts bei Schluckstörung, das nehme ich ernst.“',
        rueckfrage: { text: '„Hat er Fieber, und wie ist die Sättigung?“', erwartet: ['wert:temp', 'wert:spo2'], auftrag: 'af-werte' } },
      { wenn: { gemeldet: ['a-alter'] },
        antwort: '„Das kann am Ende einer Demenz so sein. Bieten Sie weiter an, ich komme Donnerstag.“', setzt: ['arzt-beruhigt'] },
      { wenn: { gemeldet: ['s-kuehn'] },
        antwort: '„Was genau sehen Sie? Wie atmet er, haben Sie abgehört, hat er Fieber? Melden Sie sich mit Beobachtungen wieder.“' },
    ],
    auftraege: [
      { id: 'af-werte', text: 'Temperatur und Sättigung messen und der Hausärztin melden', erledigt: { alle: [{ getan: 'temperatur-ohr' }, { getan: 'pulsoxy-anlegen' }] },
        meldung: ['wert:temp', 'wert:spo2'], meldenBinnenSek: 600, folge: [REGEL_VOLL,
          { wenn: { ab: 0 }, antwort: '„Danke. Was steht in seiner Patientenverfügung? Das brauche ich, bevor ich entscheide.“', rueckfrage: { text: '„Was hat er verfügt?“', erwartet: ['b-verfuegung'], auftrag: 'af-verfuegung' } }] },
      { id: 'af-verfuegung', text: 'Patientenverfügung nachlesen und der Hausärztin schicken', erledigt: { getan: 'kurve-lesen' },
        meldung: ['b-verfuegung'], meldenBinnenSek: 600, folge: [REGEL_VOLL] },
      { id: 'af-verlauf', text: 'In einer halben Stunde Temperatur und Atemfrequenz messen und der Hausärztin schicken', erledigt: { alle: [{ getan: 'temperatur-ohr' }, { getan: 'af-zaehlen' }] },
        meldung: ['wert:temp', 'wert:af'], meldenBinnenSek: 2400,
        folge: [{ wenn: { ab: 0 }, antwort: '„Danke. Oberkörper weiter hoch, Antibiotikum wie besprochen. Ich bin gegen 13 Uhr bei Ihnen, der Sohn kommt dazu.“', setzt: ['verlauf-gemeldet'] }] },
    ],
  },

  ereignisse: [
    { id: 'e-sohn-112', art: 'angehoerige', wann: { ab: 600 },
      text: 'Der Sohn ruft zurück, aufgeregt: „Die Nachbarin meiner Mutter sagt, bei Lungenentzündung muss man sofort ins Krankenhaus. Rufen Sie einen Krankenwagen?“',
      entscheidung: [
        { id: 'w-wille', text: 'Ruhig erklären: Die Hausärztin ist informiert, die Verfügung sieht Behandlung und Linderung im Heim vor, Krankenhaus nur, wenn es dort besser gelindert werden kann. Gemeinsames Gespräch bei der Visite anbieten', wertung: 'gut', warum: 'Der Betreuer entscheidet auf Grundlage des Patientenwillens mit (§ 1827 BGB). Pflege bringt Beobachtungen und Verfügung ein, die Entscheidung über eine Einweisung trifft die Ärztin mit dem Betreuer.' },
        { id: 'w-rtw', text: 'Zusagen, sofort einen Krankenwagen zu rufen', wertung: 'falsch', warum: 'Eine Einweisung ohne ärztliche Einschätzung und gegen den verfügten Willen kann belastende Maßnahmen auslösen, die Herr Kühn nicht wollte.' },
        { id: 'w-abwimmeln', text: '„Das entscheidet die Ärztin“ sagen und auflegen', wertung: 'vertretbar', warum: 'Stimmt, aber der Betreuer braucht Information und ein Gesprächsangebot.' },
      ] },
    { id: 'e-atemnot', art: 'komplikation', wann: { ab: 1200 }, verhindertDurch: AUFRECHT,
      text: 'Herr Kühn ist ins Bett heruntergerutscht, liegt fast flach und atmet angestrengt, er zupft an der Decke.',
      treiber: [{ art: 'pneumonie', staerke: 0.15 }], bild: { haltung: 'liegt', mimik: 'angst' } },
  ],

  pa: {
    name: 'Praxisanleiterin Frau Lehmann',
    hilfen: [
      { wenn: { nicht: AUFRECHT }, impuls: 'Wie liegt er gerade, und was bedeutet das für Atmung und Verschlucken?', tipp: 'Oberkörper hoch, zu zweit hochziehen, Knierolle gegen Herunterrutschen.' },
      { wenn: { nicht: { getan: 'atemgeraeusche-hoeren' } }, impuls: 'Er hat sich gestern verschluckt und hustet feucht. Was willst du über seine Lunge wissen?', tipp: 'Hör beide Seiten ab, vor allem unten rechts.' },
      { wenn: { nicht: { getan: 'kurve-lesen' } }, impuls: 'Wer entscheidet, ob er ins Krankenhaus kommt, und worauf stützt sich das?', tipp: 'Lies die Patientenverfügung in der Akte und wer Betreuer ist.' },
      { wenn: { auftrag: 'af-werte', status: 'offen' }, impuls: 'Was wollte die Hausärztin noch wissen?', tipp: 'Temperatur und Sättigung messen und ihr schicken.' },
      { wenn: { auftrag: 'af-verfuegung', status: 'offen' }, impuls: 'Die Ärztin hat nach etwas gefragt, das in der Akte steht.', tipp: 'Patientenverfügung nachlesen und ihr schicken.' },
      { wenn: { alle: [{ auftrag: 'af-verlauf', status: 'offen' }, { nicht: { auftrag: 'af-verlauf', status: 'gemeldet' } }] }, impuls: 'Was hat dir die Ärztin noch aufgetragen?', tipp: 'Temperatur und Atemfrequenz nach einer halben Stunde messen und schicken.' },
      { impuls: 'Wer muss von deinen Beobachtungen wissen?', tipp: 'Hausärztin, Sohn als Betreuer, Schichtleitung (Andickungspulver), und alles in den Pflegebericht.' },
    ],
  },
  team: { kollegin: 'Pflegefachfrau Melanie (Schichtleitung)', weitere: { betreuer: 'Sohn Thomas Kühn (Betreuer)' } },

  bewertung: {
    pflicht: [
      { id: 'p-aufrecht', text: 'Oberkörper hochgelagert', gewicht: 3, kompetenzbereiche: ['I'], erfuellt: AUFRECHT,
        warum: 'Aufrechte Lagerung erleichtert die Atmung und senkt die Gefahr, erneut zu aspirieren.' },
      { id: 'p-atmung', text: 'Atmung beobachtet bzw. Atemfrequenz gezählt', gewicht: 3, kompetenzbereiche: ['I'], erfuellt: ATMUNG_GEZAEHLT,
        warum: 'Eine schnelle Atmung ist oft das erste Zeichen einer Pneumonie bei alten Menschen.' },
      { id: 'p-abhoeren', text: 'Atemgeräusche gehört', gewicht: 2, kompetenzbereiche: ['I'], erfuellt: { getan: 'atemgeraeusche-hoeren' },
        warum: 'Rasseln auf einer Seite nach Verschlucken ist ein wichtiger Hinweis für die Ärztin.' },
      { id: 'p-temp', text: 'Temperatur und Sättigung gemessen', gewicht: 2, kompetenzbereiche: ['I'], erfuellt: { alle: [{ getan: 'temperatur-ohr' }, { getan: 'pulsoxy-anlegen' }] },
        warum: 'Fieber und Sättigung gehören in jede Meldung bei Verdacht auf Pneumonie.' },
      { id: 'p-besd', text: 'Schmerz mit BESD eingeschätzt', gewicht: 2, kompetenzbereiche: ['I', 'V'], erfuellt: { getan: 'schmerz-besd' },
        warum: 'Er kann Schmerz nicht benennen. Atemabhängiger Schmerz bei Pneumonie zeigt sich als Stöhnen, Abwehr, Unruhe.' },
      { id: 'p-mund', text: 'Mund gereinigt (Speisereste in der Wangentasche)', gewicht: 2, kompetenzbereiche: ['I'], erfuellt: { flag: 'mund-sauber' },
        warum: 'Speisereste im Mund können erneut aspiriert werden; Mundpflege senkt die Keimlast.' },
      { id: 'p-verfuegung', text: 'Patientenverfügung und Betreuung nachgelesen', gewicht: 3, kompetenzbereiche: ['IV'], erfuellt: { getan: 'kurve-lesen' },
        warum: 'Ob behandelt, eingewiesen oder nur gelindert wird, richtet sich nach dem Willen von Herrn Kühn.' },
      { id: 'p-arzt', text: 'Hausärztin mit Atmung, Fieber, Sättigung und Verfügung informiert', gewicht: 3, kompetenzbereiche: ['II', 'III'], erfuellt: { flag: 'arzt-informiert' },
        warum: 'Mit konkreten Beobachtungen und dem Willen kann die Ärztin die Behandlung im Heim verantworten.' },
      { id: 'p-remonstration', text: 'Tablette bei Schluckstörung hinterfragt', gewicht: 3, kompetenzbereiche: ['III', 'IV'], erfuellt: { flag: 'remonstriert:an-abx-tablette' },
        warum: 'Die Arzneiform muss zum Schluckvermögen passen. Durchführungsverantwortung heißt: nachfragen, bevor es zur Aspiration kommt.' },
      { id: 'p-kost', text: 'Getränke angedickt, Kost angepasst', gewicht: 2, kompetenzbereiche: ['I', 'V'], erfuellt: { getan: 'kost-anpassen' },
        warum: 'Angedickte Flüssigkeit fließt langsamer und lässt dem verzögerten Schluckreflex Zeit.' },
      { id: 'p-abx', text: 'Antibiotikum als angedickter Saft gegeben', gewicht: 2, kompetenzbereiche: ['I', 'III'], erfuellt: { alle: [{ anordnung: 'an-abx-saft', rueckgelesen: true }, { getan: 'abx-saft-geben' }] },
        warum: 'So bekommt er das Medikament, ohne sich erneut zu verschlucken.' },
      { id: 'p-sohn', text: 'Sohn (Betreuer) einbezogen', gewicht: 2, kompetenzbereiche: ['II', 'IV'], erfuellt: { flag: 'betreuer-einbezogen' },
        warum: 'Der Betreuer vertritt den Willen seines Vaters und muss bei der Entscheidung über eine Einweisung einbezogen werden.' },
      { id: 'p-rueckauftrag', text: 'Rückauftrag erledigt und gemeldet (Temperatur und Atemfrequenz)', gewicht: 2, kompetenzbereiche: ['II', 'III'], erfuellt: { auftrag: 'af-verlauf', status: 'gemeldet' },
        warum: 'Die Ärztin entscheidet aus der Ferne; sie braucht den Verlauf.' },
      { id: 'p-schichtleitung', text: 'Schichtleitung über das fehlende Andickungspulver informiert', gewicht: 1, kompetenzbereiche: ['III'], erfuellt: { eine: [{ flag: 'schichtleitung-informiert' }, { getan: 'pflegefachperson-informieren' }] },
        warum: 'Ein Systemfehler (Pulver leer, flach gelagert) muss behoben werden, sonst passiert es wieder.' },
      { id: 'p-doku', text: 'Pflegebericht mit Atemfrequenz und hinterfragter Anordnung', gewicht: 1, kompetenzbereiche: ['I', 'IV'],
        erfuellt: { alle: [{ getan: 'pflegebericht' }, { dokumentiert: 'wert:af' }, { dokumentiert: 'anordnung:an-abx-tablette' }] },
        warum: 'Beobachtungen, Anordnungen und die Rückfrage zur Arzneiform müssen nachvollziehbar sein.' },
    ],
    fehler: [
      { id: 'f-essen-liegen', text: 'Im Liegen bzw. mit dünner Kost angereicht', schwere: 'schwer', kompetenzbereiche: ['I', 'V'],
        wenn: { alle: [{ getan: 'essen-anreichen' }, { nicht: { alle: [AUFRECHT, { flag: 'kost-angepasst' }] } }] },
        folge: { text: 'Er verschluckt sich erneut, die Atmung brodelt.', treiber: [{ art: 'pneumonie', staerke: 0.15 }] },
        warum: 'Bei Schluckstörung nur aufrecht und mit angepasster Kost anreichen, sonst droht die nächste Aspiration.' },
      { id: 'f-duenn', text: 'Dünnen Tee angeboten trotz bekannter Schluckstörung', schwere: 'mittel', kompetenzbereiche: ['I', 'V'],
        wenn: { alle: [{ getan: 'trinken-anbieten' }, { nicht: { flag: 'kost-angepasst' } }] },
        folge: { text: 'Er hustet heftig nach dem Schluck.', treiber: [{ art: 'pneumonie', staerke: 0.1 }] },
        warum: 'Dünne Flüssigkeit fließt schneller als der verzögerte Schluckreflex. Die Empfehlung der Logopädie gilt.' },
      { id: 'f-112', text: 'Rettungsdienst gerufen, ohne ärztliche Einschätzung und gegen die Verfügung', schwere: 'schwer', kompetenzbereiche: ['IV'], wenn: { getan: 'notruf-112' },
        warum: 'Es liegt kein lebensbedrohlicher Notfall vor, der den verfügten Willen übergeht. Erst Hausärztin und Betreuer.' },
      { id: 'f-alter', text: 'Veränderung als „Ende der Demenz“ gemeldet', schwere: 'mittel', kompetenzbereiche: ['I', 'II'], wenn: { flag: 'arzt-beruhigt' },
        warum: 'Eine plötzliche Veränderung mit Fieber und schneller Atmung hat eine behandelbare Ursache.' },
      { id: 'f-tablette', text: 'Große Tablette trotz Schluckstörung gegeben', schwere: 'mittel', kompetenzbereiche: ['I', 'III'], wenn: { getan: 'abx-tablette-geben' },
        warum: 'Die Tablette kann er nicht sicher schlucken; das Risiko einer erneuten Aspiration steigt.' },
    ],
    ende: [
      { wenn: { alle: [{ flag: 'arzt-informiert' }, AUFRECHT, { getan: 'pflegebericht' }, { flag: 'verlauf-gemeldet' }] },
        text: 'Herr Kühn liegt halb sitzend, der Mund ist sauber, er hat das erste Antibiotikum als Saft bekommen. Die Hausärztin kommt um 13 Uhr, der Sohn ist dabei.', ausgang: 'stabil' },
      { wenn: { ab: 3000 }, text: 'Der Vormittag ist vorbei. Herr Kühn atmet schwerer und ist kaum noch erweckbar.', ausgang: 'verschlechtert' },
    ],
  },

  pflegebedarf: {
    probleme: [
      { id: 'pb-aspiration', text: 'Aspirationsgefahr bei Schluckstörung, Verdacht auf Aspirationspneumonie', richtig: true, prioritaet: 1, warum: 'Verschlucken, Rasseln rechts, Fieber.' },
      { id: 'pb-atmung', text: 'Beeinträchtigte Atmung (schnell, flach, feuchter Husten)', richtig: true, prioritaet: 1, warum: 'Pneumonie und flache Lagerung.' },
      { id: 'pb-schmerz', text: 'Schmerz, zeigt sich als Stöhnen und Abwehr (BESD erhöht)', richtig: true, prioritaet: 2, warum: 'Atemabhängiger Schmerz bei Pneumonie.' },
      { id: 'pb-dekubitus', text: 'Hohes Dekubitusrisiko (Steiß gerötet, wegdrückbar)', richtig: true, prioritaet: 3, warum: 'Braden um 11, Fieber, Schwitzen, liegt viel.' },
      { id: 'pb-verweigerung', text: 'Nahrungsverweigerung als Ausdruck seines Sterbewunsches', richtig: false, warum: 'Er dreht den Kopf weg, weil Schlucken nicht gelingt und er krank ist. Das ist keine Willensäußerung zum Sterben.' },
    ],
    ziele: [
      { id: 'z-schlucken', text: 'Herr Kühn isst und trinkt angedickt und aufrecht, ohne sich zu verschlucken.', passtZu: ['pb-aspiration'], richtig: true },
      { id: 'z-atmung', text: 'Herr Kühn atmet ruhiger und ohne sichtbare Anstrengung.', passtZu: ['pb-atmung'], richtig: true },
      { id: 'z-besd', text: 'BESD liegt in Ruhe und bei der Pflege unter 2.', passtZu: ['pb-schmerz'], richtig: true },
      { id: 'z-sonde', text: 'Herr Kühn wird über eine Magensonde ausreichend ernährt.', passtZu: ['pb-aspiration'], richtig: false },
    ],
  },

  leitfaden: [
    { titel: 'Isst nicht: an Schlucken und Lunge denken', text: 'Bei Menschen mit fortgeschrittener Demenz ist „isst nicht“ oft ein Zeichen für Schluckprobleme, Schmerz oder einen Infekt. Verschlucken, feuchter Husten, schnelle Atmung, Fieber und neue Schläfrigkeit weisen auf eine Aspirationspneumonie hin.', quellen: ['s3-pneumonie-ambulant', 's3-demenz'] },
    { titel: 'Aspirationsprophylaxe', text: 'Aufrecht (mindestens 60°) anreichen und 30 Minuten danach aufrecht lassen, Getränke nach logopädischer Empfehlung andicken, kleine Mengen, Zeit lassen, Mund nach dem Essen inspizieren und reinigen. Medikamente in einer Form, die geschluckt werden kann; Tabletten nur nach Rücksprache mörsern.', quellen: ['dnqp-ernaehrung'] },
    { titel: 'Schmerz bei Demenz', text: 'Wer Schmerz nicht benennen kann, zeigt ihn über Atmung, Laute, Gesicht, Körpersprache. BESD ab 2 von 10 weist auf Schmerz hin.', quellen: ['besd'] },
    { titel: 'Wille, Verfügung, Betreuer', text: 'Eine Patientenverfügung bindet auch dann, wenn Angehörige anders wollen. Der Betreuer prüft, ob sie auf die Lage passt, und setzt den Willen durch (§ 1827 BGB). Behandlung im Heim mit Antibiotikum und Linderung ist oft genau das, was gewünscht ist. Pflege bringt Beobachtungen und Kenntnis der Verfügung in das Gespräch mit Ärztin und Betreuer ein.', quellen: ['bgb-1827', 'dnqp-demenz'] },
  ],

  pruefwege: {
    muster: [
      { art: 'massnahme', id: 'vorstellen-einverstaendnis' },
      { art: 'massnahme', id: 'oberkoerper-hoch' },
      { art: 'frage', id: 'g-schreiner' },
      { art: 'massnahme', id: 'atmung-beobachten' },
      { art: 'massnahme', id: 'af-zaehlen' },
      { art: 'pflegetasche', geraet: 'stethoskop' },
      { art: 'massnahme', id: 'atemgeraeusche-hoeren' },
      { art: 'pflegetasche', geraet: 'pulsoxy' },
      { art: 'massnahme', id: 'pulsoxy-anlegen' },
      { art: 'pflegetasche', geraet: 'thermometer' },
      { art: 'massnahme', id: 'temperatur-ohr' },
      { art: 'massnahme', id: 'schmerz-besd' },
      { art: 'massnahme', id: 'schleimhaut-pruefen' },
      { art: 'massnahme', id: 'mundpflege' },
      { art: 'massnahme', id: 'kurve-lesen' },
      { art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: ['s-kuehn', 'b-demenz', 'b-verfuegung', 'a-rasseln', 'a-besd', 'wert:temp', 'wert:spo2', 'wert:af', 'r-heim'] },
      { art: 'remonstrieren', anordnung: 'an-abx-tablette', grund: 'Er hat eine Schluckstörung und kann die große Tablette nicht sicher schlucken. Gibt es das als Saft?' },
      { art: 'rueckmelden', anordnung: 'an-abx-saft', rueckgelesen: true },
      { art: 'rueckmelden', anordnung: 'an-paracetamol', rueckgelesen: true },
      { art: 'rueckmelden', anordnung: 'an-o2', rueckgelesen: true },
      { art: 'rueckmelden', anordnung: 'an-kost', rueckgelesen: true },
      { art: 'auflegen', an: 'aerztin' },
      { art: 'frage', id: 'g-sohn' },
      { art: 'massnahme', id: 'kost-anpassen' },
      { art: 'massnahme', id: 'o2-geben' },
      { art: 'massnahme', id: 'paracetamol-zaepfchen' },
      { art: 'massnahme', id: 'abx-saft-geben' },
      { art: 'massnahme', id: 'positionieren-druckentlastung' },
      { art: 'frage', id: 'g-wbl' },
      { art: 'warten', sek: 900 },
      { art: 'massnahme', id: 'temperatur-ohr' },
      { art: 'massnahme', id: 'af-zaehlen' },
      { art: 'nachricht', an: 'aerztin', kanal: 'messenger', bausteine: ['wert:temp', 'wert:af'] },
      { art: 'dokumentieren', bausteine: ['wert:af', 'wert:temp', 'a-rasseln', 'anordnung:an-abx-tablette', 'anordnung:an-abx-saft'] },
      { art: 'warten', sek: 120 },
      { art: 'abschluss', probleme: ['pb-aspiration', 'pb-atmung', 'pb-schmerz', 'pb-dekubitus'], ziele: ['z-schlucken', 'z-atmung', 'z-besd'],
        sbar: ['s-kuehn', 'b-demenz', 'b-verfuegung', 'a-rasseln'] },
    ],
    unterlassung: { bisSek: 2400, erwartet: { wert: 'spo2', vergleich: '<=', grenze: 90 } },
    grenze: { rolle: 2, events: [{ art: 'massnahme', id: 'abx-tablette-geben' }], erwartet: 'pa-eingriff' },
  },
};
