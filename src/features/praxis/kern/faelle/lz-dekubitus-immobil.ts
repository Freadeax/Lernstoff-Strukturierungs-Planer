// Fallwelle P17a · CE 02 Menschen in der Mobilität und Selbstversorgung unterstützen · stationäre Langzeitpflege:
// Dekubitusgefahr bei Immobilität. Entwurf, fachlich UNGEPRÜFT. Inhalte fiktiv/didaktisch.
// Physiologie G3 (haut-mobilitaet.ts): Treiber `immobil` baut Druckbelastung auf; ohne Entlastung entsteht in gut
// 20 Minuten eine Kategorie 1. Positionieren setzt die Auflagestelle zurück (Katalog-Wirkkurve druckLast faktor 0).

import { KATALOG } from '../katalog';
import type { ArztRegel, FallV2, MassnahmeDefinition } from '../typen';

const aus = (id: string, mehr: Partial<MassnahmeDefinition>): MassnahmeDefinition => ({ ...KATALOG[id]!, ...mehr });

const KOLLEGIN_KOMMT = 660;

const REGEL_VOLL: ArztRegel = {
  id: 'r-voll', wenn: { gemeldet: ['s-schmerz-lagern', 'a-besd', 'a-trinkt-wenig'] },
  antwort: '„Danke, das ist eine gute Beobachtung. Geben Sie ihr Paracetamol 500 mg, jeweils eine halbe Stunde vor dem Lagern, höchstens viermal am Tag. Und bitte Trinken anbieten mit Protokoll, Ziel 1,2 Liter. Schätzen Sie den Schmerz nach dem nächsten Lagern noch einmal ein und schreiben Sie mir den Wert.“',
  anordnungen: ['an-paracetamol', 'an-trinken'], setzt: ['arzt-informiert'], auftraege: ['af-besd'],
};

export const LZ_DEKUBITUS_IMMOBIL: FallV2 = {
  schema: 2,
  id: 'lz-dekubitus-immobil',
  version: '0.1.0',
  spur: 'A',
  setting: 'langzeit',
  altersgruppe: 'hochbetagt',
  titel: 'Die ganze Nacht auf dem Rücken',
  kurz: 'Pflegeheim, Frühdienst: Eine 87-jährige Bewohnerin liegt seit einer Woche fast nur im Bett. Am Kreuzbein ist die Haut rot.',
  rahmen: 'Du bist im Frühdienst eines Pflegeheims und übernimmst Frau Berger. Sie hat eine Demenz, Schmerzen beim Bewegen und hat sich in der Nacht nicht drehen lassen. Deine Praxisanleiterin ist auf dem Wohnbereich und kommt, wenn du sie rufst.',
  lernziele: [
    'Dekubitusgefahr erkennen: Haut an Kreuzbein und Fersen ansehen, Fingertest, Risiko einschätzen (Braden).',
    'Druck entlasten: Bewegung ankündigen, schmerzarm positionieren (30°-Seitenlage, Fersen frei), Bewegungsplan festlegen.',
    'Schmerz bei Demenz einschätzen (BESD) und Schmerzmittel vor dem Lagern mit der Hausärztin klären.',
    'Feuchtigkeit und Flüssigkeitsmangel als Verstärker sehen: Haut trocken halten, Trinken fördern.',
    'Überholte Hausmittel (Franzbranntwein, Föhnen, Massage) sachlich ablehnen.',
  ],
  lehrplan: {
    ce: ['ce.02'], abschnitt: ['ad12'],
    themen: ['thema.pro.dekubitus', 'thema.ph.mobilisation', 'thema.beo.haut', 'thema.pro.dehydratation', 'thema.kl.demenz'],
    kompetenzen: ['I.1.d', 'I.2.a', 'II.2.a', 'III.1.d'],
  },
  geeignet: { rollen: [1, 2], stufen: [1, 2, 3] },
  dauerMin: [10, 15],
  freigabe: {
    status: 'entwurf',
    pruefpunkte: [
      'Positionierung (30°-Seitenlage, Fersen frei, Kopfteil höchstens 30°) gegen DNQP Expertenstandard Dekubitusprophylaxe (2. Aktualisierung 2017) prüfen',
      'Fingertest und Kategorie 1 (nicht wegdrückbare Rötung) nach NPIAP/EPUAP-Leitlinie 2019 formuliert?',
      'Braden-Wert 12 passend zum Zustand (Modellregel G4 braden())?',
      'Paracetamol vor dem Lagern: mit Hausärztin/Pharmazie abstimmen (Dosis, Abstand)',
    ],
  },
  quellen: [
    { id: 'dnqp-dekubitus', titel: 'DNQP: Expertenstandard Dekubitusprophylaxe in der Pflege (2. Aktualisierung 2017)' },
    { id: 'npiap', titel: 'EPUAP/NPIAP/PPPIA: Prevention and Treatment of Pressure Ulcers/Injuries, Clinical Practice Guideline (2019)' },
    { id: 'dnqp-schmerz', titel: 'DNQP: Expertenstandard Schmerzmanagement in der Pflege (2020)' },
    { id: 'lehrplan-ce02', titel: 'Landeslehrplan BW 3BFP, CE 02 Zu pflegende Menschen in der Bewegung und Selbstversorgung unterstützen' },
  ],

  person: {
    name: 'Frau Berger',
    alter: { jahre: 87 },
    geschlecht: 'w',
    biografie: ['seit zwei Jahren im Heim', 'war Schneiderin, hört gern Operettenmusik', 'Sohn kommt sonntags'],
    diagnosenBekannt: ['Alzheimer-Demenz, mittelgradig', 'Arthrose beider Hüften', 'Harnwegsinfekt vor 10 Tagen (behandelt)', 'Pflegegrad 4'],
    medikamentePlan: ['Donepezil 10 mg 0-0-1', 'Macrogol 1 Btl. 1-0-0'],
    allergien: ['keine bekannt'],
    hilfsmittel: ['Pflegerollstuhl', 'Hörgerät rechts'],
    gewichtKg: 52,
  },
  medien: { raum: '26_pflegeheim_zimmer_tag' },
  uebernahme: 'Frau Berger, Zimmer 7, 87 Jahre. Seit dem Infekt letzte Woche fast nur im Bett, isst und trinkt wenig. Die Nachtwache sagt: Sie hat beim Drehen so geschrien, da haben wir sie seit zehn Uhr auf dem Rücken liegen lassen. Die Vorlage war um vier nass.',
  startUhrzeit: '06:40',

  start: {
    // Liegt seit 8 h auf dem Rücken: Druckbelastung knapp unter Kategorie 1; Vorlage feucht, leichter Flüssigkeitsmangel
    grund: { druckLast: 12, hydratation: 0.86, schmerz: 4, unruhe: 0.35, angst: 0.35, orientierung: 0.4 },
    treiber: [{ art: 'immobil', druckMmHg: 55, feucht: true }],
    bild: { haltung: 'liegt', haut: 'blass', mimik: 'schmerz' },
    sichtbar: [],
    anordnungen: [],
  },

  massnahmen: [
    // Gespräch
    'vorstellen-einverstaendnis', 'ansprechen-orientierung', 'validierend-sprechen',
    // Beobachten
    'haut-beobachten', 'dekubitusrisiko-einschaetzen', 'schmerz-besd', 'schmerz-nrs', 'hautturgor-pruefen', 'schleimhaut-pruefen', 'urin-beobachten',
    // Messen
    'kurve-lesen', 'temperatur-ohr',
    // Versorgen
    'haendedesinfektion', 'privatsphaere-wahren', 'inkontinenz-versorgen', 'positionieren-druckentlastung', 'mobilisieren-transfer',
    'franzbranntwein-einreiben', 'trinken-anbieten', 'bedarfsmedikation-oral',
    // Melden
    'pflegefachperson-informieren', 'pflegeplanung-anpassen', 'pflegebericht', 'reflexion-pa',
  ],
  massnahmenZusatz: [
    aus('haut-beobachten', { name: 'Haut an Kreuzbein, Fersen und Hüften ansehen, Fingertest' }),
    aus('positionieren-druckentlastung', { name: '30°-Seitenlage rechts, Fersen frei lagern, Kopfteil höchstens 30°', setzt: ['gelagert'] }),
    aus('mobilisieren-transfer', { name: 'In den Pflegerollstuhl mobilisieren' }),
    aus('inkontinenz-versorgen', { name: 'Vorlage wechseln, Haut sanft reinigen und trocknen, Hautschutz auftragen', setzt: ['haut-trocken'] }),
    aus('bedarfsmedikation-oral', { name: 'Paracetamol 500 mg geben (Anordnung Hausärztin)',
      // Nur eine Gabe im Fall (Abstand 6 h); die Medikationsprüfung kennt nur Planeinträge, und der Plan hat zu Beginn kein Paracetamol
      voraussetzung: { nicht: { getan: 'bedarfsmedikation-oral' } }, treiber: [{ art: 'wirkstoff', id: 'paracetamol', dosisMg: 500, weg: 'oral' }] }),
    aus('pflegefachperson-informieren', { name: 'Wohnbereichsleitung Frau Petrović informieren', setzt: ['wbl-informiert'] }),
    aus('pflegeplanung-anpassen', { name: 'Bewegungsplan festlegen (Positionswechsel, Mikrolagerung) und Pflegeplanung anpassen', setzt: ['bewegungsplan'] }),
    {
      id: 'franzbranntwein-einreiben', name: 'Gerötete Stelle mit Franzbranntwein einreiben und trockenföhnen', reiter: 'versorgen', spur: 'A', zeitbedarfSekunden: 120,
      befugnis: { 1: 'selbst', 2: 'selbst', 3: 'selbst', pflegefachperson: 'selbst' }, setzt: ['franz-eingerieben'], kompetenzbereiche: ['I'],
    },
  ],

  akte: {
    aufnahmegrund: 'Einzug vor zwei Jahren bei fortschreitender Demenz; zu Hause nicht mehr versorgbar.',
    anamnese: [
      'Bis vor zwei Wochen mit Hilfe im Rollstuhl am Gemeinschaftstisch, kurze Strecken mit zwei Personen gegangen.',
      'Nach Harnwegsinfekt (Antibiose bis vor 3 Tagen) geschwächt, liegt fast nur im Bett.',
      'Äußert Schmerzen nicht klar; stöhnt und verzieht das Gesicht beim Bewegen der Hüften.',
      'Beruhigt sich bei Operettenmusik und wenn man ihre Hand hält.',
    ],
    diagnosen: [
      { text: 'Alzheimer-Demenz, mittelgradig', icd: 'G30.1', seit: '2022' },
      { text: 'Koxarthrose beidseits', icd: 'M16.0', seit: '2015' },
      { text: 'Harnwegsinfekt, behandelt', icd: 'N39.0', seit: 'vor 10 Tagen' },
    ],
    medikation: [
      { id: 'mp-donepezil', wirkstoff: 'Donepezil', staerke: '10 mg', form: 'Tbl.', schema: '0-0-1-0', zuletzt: 'gestern 20:00' },
      { id: 'mp-macrogol', wirkstoff: 'Macrogol', staerke: '13,1 g', form: 'Btl.', schema: '1-0-0-0', zuletzt: 'gestern 08:00' },
    ],
    vorwerte: [
      { zeit: 'vor 7 Tagen', vorH: 168, werte: { rrSys: 128, rrDia: 72, hf: 84, temp: 38.1, gewicht: 53.5 }, kuerzel: 'SB' },
      { zeit: 'vor 2 Tagen', vorH: 48, werte: { rrSys: 118, rrDia: 68, hf: 82, temp: 36.8, gewicht: 52.0 }, kuerzel: 'MK' },
    ],
    pflegebericht: [
      { zeit: 'gestern 14:00', wer: 'MK (Frühdienst)', text: 'Isst nur wenige Löffel, Trinkmenge bis 14 Uhr 450 ml. Wollte nicht in den Rollstuhl.' },
      { zeit: 'gestern 21:30', wer: 'Spätdienst', text: 'Trinkmenge gesamt ca. 800 ml. Rötung am Steiß bemerkt, Vorlage gewechselt.' },
      { zeit: 'heute 04:00', wer: 'Nachtwache', text: 'Vorlage nass, gewechselt. Beim Drehen geschrien, deshalb auf dem Rücken gelassen, Kopfteil hoch, damit sie besser schläft.' },
    ],
    assessments: [
      { name: 'Braden-Skala', wert: '16 Punkte (Risiko)', datum: 'vor 3 Wochen', hinweis: 'Seitdem nicht neu eingeschätzt.' },
      { name: 'BESD', wert: '2 von 10 in Ruhe', datum: 'vor 3 Wochen' },
      { name: 'Barthel-Index', wert: '15 von 100', datum: 'vor 3 Wochen' },
    ],
    pflegeplanung: [
      { problem: 'Eingeschränkte Mobilität bei Koxarthrose und Demenz; Ressource: beruhigt sich mit Musik und Berührung', ziel: 'Sitzt täglich zu den Mahlzeiten im Rollstuhl', massnahmen: ['Transfer mit zwei Personen', 'Mahlzeiten am Gemeinschaftstisch'] },
    ],
    rechtliches: ['Betreuung für Gesundheitssorge: Sohn, Herr Berger.', 'Patientenverfügung: keine Krankenhauseinweisung bei schwerer Erkrankung, Schmerzlinderung gewünscht.'],
  },

  befunde: [
    { massnahme: 'haendedesinfektion', varianten: [{ text: 'Du desinfizierst die Hände, 30 Sekunden.' }] },
    { massnahme: 'vorstellen-einverstaendnis', varianten: [{ text: 'Du klopfst, sprichst sie auf der Seite mit dem Hörgerät an und sagst, wer du bist. Sie schaut dich an, sagt „Ja, ja“ und stöhnt leise.' }] },
    { massnahme: 'ansprechen-orientierung', varianten: [{ text: 'Sie kennt ihren Namen, hält dich für ihre Schwester. Ort und Tag weiß sie nicht. Wach, aber matt.' }] },
    { massnahme: 'validierend-sprechen', varianten: [{ text: 'Du nimmst ihre Hand: „Ihnen tut was weh.“ Sie drückt fest zu: „Alles tut weh.“' }] },
    { massnahme: 'kurve-lesen', varianten: [{ text: 'Pflegebericht: seit Tagen wenig gegessen, Trinkmenge gestern etwa 800 ml, Rötung am Steiß gestern Abend bemerkt. Nachts auf dem Rücken mit hohem Kopfteil. Braden zuletzt vor drei Wochen: 16 Punkte. Keine Bedarfsmedikation gegen Schmerzen angeordnet.' }] },
    { massnahme: 'haut-beobachten', varianten: [
      { wenn: { wert: 'dekubitusKat', vergleich: '>=', grenze: 1 }, text: 'Am Kreuzbein eine handtellergroße Rötung, die beim Fingerdruck rot bleibt. Haut intakt, warm. Das ist ein Dekubitus Kategorie 1.' },
      { wenn: { flag: 'gelagert' }, text: 'Die Rötung am Kreuzbein blasst ab, sie lässt sich wegdrücken. Fersen frei, Haut intakt.' },
      { text: 'Am Kreuzbein eine handtellergroße Rötung. Beim Fingerdruck wird sie weiß und kommt wieder (Fingertest negativ): noch kein Dekubitus, aber die Haut ist am Limit. Fersen blass, intakt. Gesäßhaut feucht.' },
    ] },
    { massnahme: 'dekubitusrisiko-einschaetzen', varianten: [{ text: 'Braden-Skala: Wahrnehmung 3, Feuchtigkeit 2, Aktivität 1, Mobilität 1, Ernährung 3, Reibung und Scherkräfte 2 = 12 Punkte. Hohes Dekubitusrisiko (vor drei Wochen 16).' }] },
    { massnahme: 'schmerz-besd', varianten: [
      { wenn: { wert: 'besd', vergleich: '>=', grenze: 2 }, text: 'BESD in Ruhe {besd} von 10. Beim Anheben der Decke stöhnt sie, verzieht das Gesicht und hält die Hüfte fest. Beim Drehen wäre der Wert deutlich höher.', zeigt: ['besd'] },
      { text: 'BESD {besd} von 10. Sie atmet ruhig, das Gesicht ist entspannt, sie summt mit.', zeigt: ['besd'] },
    ] },
    { massnahme: 'schmerz-nrs', varianten: [{ text: 'Du fragst nach einer Zahl von 0 bis 10. Sie sagt „Fünf … nein, zehn … ich weiß nicht.“ Die Zahlenskala passt bei ihr nicht mehr.' }] },
    { massnahme: 'hautturgor-pruefen', varianten: [{ text: 'Hautfalte am Handrücken bleibt kurz stehen.' }] },
    { massnahme: 'schleimhaut-pruefen', varianten: [{ text: 'Zunge trocken, Lippen rissig.' }] },
    { massnahme: 'urin-beobachten', varianten: [{ text: 'Vorlage nass, Urin dunkelgelb, riecht konzentriert.' }] },
    { massnahme: 'temperatur-ohr', varianten: [{ text: '{temp} °C.', zeigt: ['temp'] }] },
    { massnahme: 'privatsphaere-wahren', varianten: [{ text: 'Tür zu, Vorhang vor, du deckst nur auf, was gerade nötig ist.' }] },
    { massnahme: 'inkontinenz-versorgen', varianten: [{ text: 'Du wechselst die Vorlage, reinigst die Haut mit pH-neutraler Lotion, tupfst trocken und trägst Hautschutz auf. Keine Reibung auf der geröteten Stelle.' }] },
    { massnahme: 'positionieren-druckentlastung', varianten: [
      { wenn: { flag: 'angekuendigt' }, text: 'Du sagst jeden Schritt an. Mit der Praxisanleiterin drehst du sie langsam in die 30°-Seitenlage rechts, ein Kissen im Rücken, die Fersen frei. Kopfteil auf 30°. Sie stöhnt kurz und entspannt sich dann.' },
      { text: 'Du drehst sie zügig auf die Seite. Sie schreit auf und klammert sich an das Bettgitter.' },
    ] },
    { massnahme: 'mobilisieren-transfer', varianten: [{ text: 'Zu zweit setzt ihr sie in den Pflegerollstuhl. Sie stöhnt beim Transfer und sackt nach wenigen Minuten zur Seite. Heute schafft sie das nicht lange.' }] },
    { massnahme: 'trinken-anbieten', varianten: [{ text: 'Du reichst ihr Tee mit der Schnabeltasse. In kleinen Schlucken trinkt sie 150 ml. Trinkprotokoll angelegt.' }] },
    { massnahme: 'bedarfsmedikation-oral', varianten: [{ text: 'Du gibst Paracetamol 500 mg als Brausetablette in Tee aufgelöst. Sie trinkt es mit.' }] },
    { massnahme: 'franzbranntwein-einreiben', varianten: [{ text: 'Du reibst die gerötete Stelle mit Franzbranntwein ein. Sie zuckt und stöhnt. Die Haut wird noch röter und trockener.' }] },
    { massnahme: 'reflexion-pa', varianten: [{ text: 'Frau Yıldız fragt: „Was hat dir geholfen, sie trotz Schmerzen zu lagern? Was hättest du der Nachtwache gesagt?“ Ihr sprecht darüber, dass Schonung bei Schmerz verständlich ist und trotzdem schadet.' }] },
  ],

  gespraech: [
    { id: 'g-ankuendigen', frage: 'Bewegung ankündigen, Hand an die Schulter, langsam und in kleinen Schritten', an: 'patient', kompetenzbereiche: ['I', 'II'],
      antwort: [{ text: 'Sie schaut dich an. „Langsam, ja?“ Sie hält deine Hand.', setzt: ['angekuendigt'] }],
      wirkung: [{ groesse: 'angst', delta: -0.15, beginnSek: 0, spitzeSek: 30, dauerSek: 'dauerhaft' }] },
    { id: 'g-musik', frage: 'Operettenmusik anmachen und fragen, ob es so gut ist', an: 'patient', kompetenzbereiche: ['II'],
      antwort: [{ text: 'Sie summt leise mit. „Schön.“' }],
      wirkung: [{ groesse: 'unruhe', delta: -0.1, beginnSek: 0, spitzeSek: 60, dauerSek: 'dauerhaft' }] },
    { id: 'g-matratze', frage: 'Wohnbereichsleitung um eine Wechseldruckmatratze bitten', an: 'kollegin', kompetenzbereiche: ['III'],
      nurWenn: { getan: 'dekubitusrisiko-einschaetzen' },
      antwort: [{ text: 'Frau Petrović: „Braden 12? Gut, dass du nachgemessen hast. Ich bestelle die Matratze, die kommt heute Mittag. Bis dahin bleibt es beim Lagern nach Plan.“', setzt: ['matratze-angefordert', 'wbl-informiert'] }] },
  ],

  sbar: [
    { id: 's-schmerz-lagern', teil: 'S', text: 'Frau Berger, 87, Zimmer 7: hat Schmerzen bei jeder Bewegung und konnte nachts nicht gelagert werden. Am Kreuzbein ist die Haut gerötet.', art: 'kern' },
    { id: 's-dekubitus', teil: 'S', text: 'Frau Berger hat einen Dekubitus.', art: 'falsch' },
    { id: 'b-heim', teil: 'B', text: 'Mittelgradige Demenz, Arthrose beider Hüften, seit dem Harnwegsinfekt vor zehn Tagen bettlägerig. Keine Bedarfsmedikation gegen Schmerzen.', art: 'kern' },
    { id: 'b-schneiderin', teil: 'B', text: 'Sie war Schneiderin.', art: 'ablenker' },
    { id: 'a-besd', teil: 'A', text: 'BESD in Ruhe auffällig, beim Bewegen deutlich mehr; sie hält die Hüfte fest.', art: 'kern', bekanntWenn: { getan: 'schmerz-besd' } },
    { id: 'a-braden', teil: 'A', text: 'Braden 12 Punkte, hohes Risiko. Rötung am Kreuzbein noch wegdrückbar.', art: 'hilfreich', bekanntWenn: { getan: 'dekubitusrisiko-einschaetzen' } },
    { id: 'a-trinkt-wenig', teil: 'A', text: 'Trinkt seit Tagen unter einem Liter, Zunge trocken.', art: 'kern', bekanntWenn: { getan: 'kurve-lesen' } },
    { id: 'r-schmerzmittel', teil: 'R', text: 'Bitte verordnen Sie ihr ein Schmerzmittel, das wir vor dem Lagern geben können.', art: 'kern' },
    { id: 'r-liegen', teil: 'R', text: 'Sollen wir sie einfach liegen lassen, bis die Schmerzen weg sind?', art: 'falsch' },
  ],

  anordnungen: [
    { id: 'an-paracetamol', massnahme: 'bedarfsmedikation-oral', text: 'Paracetamol 500 mg oral, 30 Minuten vor dem Lagern, höchstens 4 Gaben am Tag, Abstand mind. 6 h.' },
    { id: 'an-trinken', massnahme: 'trinken-anbieten', text: 'Trinken anbieten, Ziel 1,2 l am Tag, Trinkprotokoll.' },
  ],

  arzt: {
    name: 'Hausärztin Dr. Brandt',
    erreichbar: 'hausarzt-praxis',
    regeln: [
      REGEL_VOLL,
      { id: 'r-trinkfrage', wenn: { gemeldet: ['s-schmerz-lagern', 'a-besd'] },
        antwort: '„Danke. Dann braucht sie ein Schmerzmittel vor dem Lagern.“',
        rueckfrage: { text: '„Wie viel trinkt sie gerade? Sehen Sie bitte im Protokoll nach.“', erwartet: ['a-trinkt-wenig'], auftrag: 'af-trinkmenge' } },
      { wenn: { gemeldet: ['s-schmerz-lagern'] },
        antwort: '„Wie stark sind die Schmerzen? Schätzen Sie das bitte mit der BESD ein und melden Sie sich wieder.“' },
      { wenn: { eine: [{ gemeldet: ['r-liegen'] }, { gemeldet: ['s-dekubitus'] }] },
        antwort: '„Liegen lassen geht bei der Haut nicht. Ich komme morgen zur Visite und schaue es mir an.“', setzt: ['arzt-vertroestet'] },
    ],
    auftraege: [
      { id: 'af-trinkmenge', text: 'Trinkmenge im Protokoll nachsehen und der Hausärztin melden', erledigt: { getan: 'kurve-lesen' }, meldung: ['a-trinkt-wenig'], meldenBinnenSek: 900,
        folge: [{ ...REGEL_VOLL, wenn: { ab: 0 } }] },
      { id: 'af-besd', text: 'Nach dem Lagern den Schmerz mit BESD erneut einschätzen und den Wert schicken', erledigt: { getan: 'schmerz-besd' },
        meldung: ['wert:besd'], meldenBinnenSek: 1800,
        folge: [{ wenn: { ab: 0 }, antwort: '„Danke, so bleibt es. Wenn sie trotz Paracetamol beim Lagern über 5 liegt, melden Sie sich, dann stellen wir um.“', setzt: ['besd-rueckmeldung'] }] },
    ],
  },

  team: { kollegin: 'Wohnbereichsleitung Frau Petrović' },

  ereignisse: [
    { id: 'e-franzbranntwein', art: 'team', wann: { ab: KOLLEGIN_KOMMT },
      text: 'Pflegehelferin Anni schaut herein: „Ist der Steiß rot? Reib ihn mit Franzbranntwein ein und föhn ihn trocken, das regt die Durchblutung an. Haben wir immer so gemacht.“',
      entscheidung: [
        { id: 'w-erklaeren', text: 'Freundlich ablehnen: Druck wegnehmen hilft, Einreiben und Föhnen schaden der Haut', wertung: 'gut', setzt: ['franz-abgelehnt'],
          warum: 'Alkohol trocknet die Haut aus, Reiben und Wärme schädigen das vorbelastete Gewebe. Der Expertenstandard empfiehlt Druckentlastung und Hautschutz.' },
        { id: 'w-nicken', text: 'Nicken und es einfach nicht machen', wertung: 'vertretbar',
          warum: 'Frau Berger ist geschützt, aber Anni macht es beim nächsten Mal selbst.' },
        { id: 'w-einreiben', text: 'Machen, Anni hat Erfahrung', wertung: 'gefaehrlich', setzt: ['franz-eingerieben'],
          warum: 'Einreiben mit Franzbranntwein, Föhnen und Massieren geröteter Haut gelten als schädlich und sind überholt.' },
      ] },
  ],

  pa: {
    name: 'Praxisanleiterin Frau Yıldız',
    hilfen: [
      { wenn: { nicht: { getan: 'haut-beobachten' } }, impuls: 'Sie lag die ganze Nacht auf dem Rücken. Wo schaust du zuerst hin?', tipp: 'Kreuzbein und Fersen ansehen und den Fingertest machen: Wird die Rötung beim Drücken weiß?' },
      { wenn: { nicht: { getan: 'schmerz-besd' } }, impuls: 'Wie findest du heraus, wie stark ihre Schmerzen sind?', tipp: 'Bei Demenz passt die Zahlenskala oft nicht. Nimm die BESD.' },
      { wenn: { auftrag: 'af-trinkmenge', status: 'offen' }, impuls: 'Was wollte die Hausärztin noch wissen?', tipp: 'Die Trinkmenge. Sieh im Pflegebericht nach und schick sie ihr.' },
      { wenn: { nicht: { getan: 'positionieren-druckentlastung' } }, impuls: 'Was braucht die Haut am Kreuzbein jetzt am dringendsten?', tipp: 'Druck weg. Kündige jede Bewegung an und lagere sie in die 30°-Seitenlage, Fersen frei.' },
      { wenn: { nicht: { flag: 'bewegungsplan' } }, impuls: 'Wie geht es nach dir weiter, damit die Nacht nicht wieder so läuft?', tipp: 'Leg einen Bewegungsplan fest und pass die Pflegeplanung an.' },
      { impuls: 'Was macht ihre Haut zusätzlich verletzlich?', tipp: 'Feuchtigkeit und zu wenig Trinken. Haut trocken halten, Trinken anbieten.' },
    ],
  },

  bewertung: {
    pflicht: [
      { id: 'p-haende', text: 'Hände vor dem Kontakt desinfiziert', gewicht: 1, kompetenzbereiche: ['I'], erfuellt: { getan: 'haendedesinfektion' }, warum: 'Vor jeder Pflegehandlung.' },
      { id: 'p-haut', text: 'Haut an Druckstellen angesehen, Fingertest', gewicht: 3, kompetenzbereiche: ['I'], erfuellt: { getan: 'haut-beobachten' },
        warum: 'Nach einer Nacht in Rückenlage muss die Haut an Kreuzbein und Fersen sofort angesehen werden. Der Fingertest unterscheidet Rötung von Kategorie 1.' },
      { id: 'p-risiko', text: 'Dekubitusrisiko neu eingeschätzt', gewicht: 2, kompetenzbereiche: ['I'], erfuellt: { getan: 'dekubitusrisiko-einschaetzen' },
        warum: 'Ihr Zustand hat sich verändert. Die letzte Einschätzung ist drei Wochen alt.' },
      { id: 'p-schmerz', text: 'Schmerz mit BESD eingeschätzt', gewicht: 2, kompetenzbereiche: ['I'], erfuellt: { getan: 'schmerz-besd' },
        warum: 'Schmerz ist der Grund, warum sie sich nicht lagern lässt. Bei Demenz braucht es eine Fremdeinschätzung.' },
      { id: 'p-entlastet', text: 'Druck entlastet (30°-Seitenlage, Fersen frei)', gewicht: 3, kompetenzbereiche: ['I'], erfuellt: { getan: 'positionieren-druckentlastung' },
        warum: 'Druck mal Zeit macht den Dekubitus. Entlastung ist die wichtigste Prophylaxe.' },
      { id: 'p-ankuendigen', text: 'Bewegung angekündigt, schmerzarm gelagert', gewicht: 2, kompetenzbereiche: ['II'], erfuellt: { flag: 'angekuendigt' },
        warum: 'Angekündigte, langsame Bewegung nimmt Angst und Schmerz.' },
      { id: 'p-haut-trocken', text: 'Haut trocken gehalten, Hautschutz', gewicht: 1, kompetenzbereiche: ['I'], erfuellt: { flag: 'haut-trocken' },
        warum: 'Feuchtigkeit macht die Haut empfindlicher gegen Druck.' },
      { id: 'p-trinken', text: 'Trinken angeboten', gewicht: 1, kompetenzbereiche: ['I'], erfuellt: { getan: 'trinken-anbieten' },
        warum: 'Flüssigkeitsmangel verschlechtert die Durchblutung der Haut.' },
      { id: 'p-arzt', text: 'Hausärztin strukturiert informiert', gewicht: 2, kompetenzbereiche: ['II', 'III'], erfuellt: { flag: 'arzt-informiert' },
        warum: 'Ohne Schmerzmittel vor dem Lagern bleibt jeder Positionswechsel eine Qual.' },
      { id: 'p-rueckauftrag', text: 'Schmerz nach dem Lagern erneut eingeschätzt und gemeldet', gewicht: 1, kompetenzbereiche: ['II', 'III'], erfuellt: { auftrag: 'af-besd', status: 'gemeldet' },
        warum: 'Die Hausärztin entscheidet aus der Praxis. Sie braucht die Wirkung.' },
      { id: 'p-plan', text: 'Bewegungsplan festgelegt, Pflegeplanung angepasst', gewicht: 2, kompetenzbereiche: ['I', 'III'], erfuellt: { flag: 'bewegungsplan' },
        warum: 'Damit jede Schicht weiß, wann und wie gelagert wird.' },
      { id: 'p-matratze', text: 'Druckverteilende Matratze angefordert', gewicht: 1, kompetenzbereiche: ['III'], erfuellt: { flag: 'matratze-angefordert' },
        warum: 'Bei hohem Risiko und wenig Eigenbewegung ergänzt eine Wechseldruckmatratze die Positionswechsel.' },
      { id: 'p-doku', text: 'Haut und Risiko dokumentiert', gewicht: 1, kompetenzbereiche: ['I', 'IV'], erfuellt: { dokumentiert: 'a-braden' },
        warum: 'Hautbefund und Braden-Wert gehören in den Bericht, damit der Verlauf sichtbar wird.' },
    ],
    fehler: [
      { id: 'f-kategorie1', text: 'Dekubitus Kategorie 1 entstanden', schwere: 'mittel', kompetenzbereiche: ['I'], wenn: { wert: 'dekubitusKat', vergleich: '>=', grenze: 1 },
        warum: 'Die Rötung am Kreuzbein ist nicht mehr wegdrückbar. Der Druck wurde zu spät entlastet.' },
      { id: 'f-ohne-ankuendigen', text: 'Ohne Ankündigung gelagert', schwere: 'leicht', kompetenzbereiche: ['II'],
        wenn: { alle: [{ getan: 'positionieren-druckentlastung' }, { nicht: { flag: 'angekuendigt' } }] },
        folge: { text: 'Frau Berger schreit auf und hält sich am Bettgitter fest.', wirkung: [{ groesse: 'angst', delta: 0.3, beginnSek: 0, spitzeSek: 10, dauerSek: 900 }] },
        warum: 'Menschen mit Demenz erschrecken bei unangekündigter Berührung. Angst verstärkt den Schmerz.' },
      { id: 'f-franzbranntwein', text: 'Gerötete Haut mit Franzbranntwein eingerieben', schwere: 'mittel', kompetenzbereiche: ['I', 'IV'],
        wenn: { eine: [{ getan: 'franzbranntwein-einreiben' }, { flag: 'franz-eingerieben' }] },
        warum: 'Alkohol trocknet aus, Reiben und Föhnen schädigen die vorbelastete Haut. Das ist überholt.' },
    ],
    ende: [
      { wenn: { alle: [{ getan: 'positionieren-druckentlastung' }, { flag: 'bewegungsplan' }, { flag: 'besd-rueckmeldung' }] },
        text: 'Frau Berger liegt entspannt in der Seitenlage, die Musik läuft. Die Rötung am Kreuzbein blasst ab. Ab Mittag liegt sie auf einer Wechseldruckmatratze.', ausgang: 'stabil' },
      { wenn: { alle: [{ ab: 2400 }, { wert: 'dekubitusKat', vergleich: '>=', grenze: 1 }] }, text: 'Der Vormittag ist um. Die Rötung am Kreuzbein ist nicht mehr wegzudrücken.', ausgang: 'verschlechtert' },
      { wenn: { ab: 2400 }, text: 'Der Vormittag ist um. Die Haut am Kreuzbein ist noch intakt, aber Bewegungsplan oder Rückmeldung an die Hausärztin fehlen.', ausgang: 'stabil' },
    ],
  },

  pflegebedarf: {
    probleme: [
      { id: 'pb-dekubitus', text: 'Hohes Dekubitusrisiko (Braden 12) bei Immobilität, Rötung am Kreuzbein', richtig: true, prioritaet: 1, warum: 'Die Haut ist am Limit. Entlastung hat Vorrang.' },
      { id: 'pb-schmerz', text: 'Schmerzen bei Bewegung (Koxarthrose), kann sie nicht in Zahlen äußern', richtig: true, prioritaet: 1, warum: 'Schmerz verhindert Lagerung und Mobilisation.' },
      { id: 'pb-trinken', text: 'Trinkt zu wenig (unter 1 Liter)', richtig: true, prioritaet: 2, warum: 'Flüssigkeitsmangel verschlechtert die Hautdurchblutung.' },
      { id: 'pb-feucht', text: 'Haut durch Inkontinenz feucht', richtig: true, prioritaet: 2, warum: 'Feuchtigkeit verstärkt die Druckschädigung.' },
      { id: 'pb-kat2', text: 'Dekubitus Kategorie 2 am Kreuzbein', richtig: false, warum: 'Die Haut ist intakt und die Rötung wegdrückbar: noch kein Dekubitus.' },
      { id: 'pb-unkooperativ', text: 'Lehnt Lagerung ab, unkooperativ', richtig: false, warum: 'Sie hat Schmerzen. Die Formulierung übersieht die Ursache.' },
    ],
    ziele: [
      { id: 'z-haut', text: 'Die Haut an Kreuzbein und Fersen bleibt intakt, die Rötung ist morgen weg.', passtZu: ['pb-dekubitus', 'pb-feucht'], richtig: true },
      { id: 'z-schmerz', text: 'Frau Berger zeigt beim Lagern eine BESD unter 5.', passtZu: ['pb-schmerz'], richtig: true },
      { id: 'z-trinken', text: 'Frau Berger trinkt täglich 1,2 Liter.', passtZu: ['pb-trinken'], richtig: true },
      { id: 'z-ruhe', text: 'Frau Berger wird nachts nicht gestört.', passtZu: ['pb-dekubitus'], richtig: false },
    ],
  },

  leitfaden: [
    { titel: 'Druck mal Zeit', text: 'Ein Dekubitus entsteht, wenn Druck die kleinen Gefäße länger zusammendrückt. Kreuzbein, Fersen und Hüften sind am stärksten gefährdet. Feuchtigkeit, Scherkräfte (hohes Kopfteil, Rutschen) und Flüssigkeitsmangel verstärken die Wirkung.', quellen: ['dnqp-dekubitus'] },
    { titel: 'Fingertest', text: 'Rötung kurz mit dem Finger eindrücken. Wird sie weiß und kommt dann zurück, ist es noch kein Dekubitus. Bleibt sie rot, ist es eine Kategorie 1: sofort entlasten und dokumentieren.', quellen: ['npiap'] },
    { titel: 'Entlasten', text: '30°-Seitenlage mit Kissen im Rücken, Fersen frei lagern, Kopfteil höchstens 30°. Zeitabstände nach Hautbefund festlegen (Bewegungsplan), dazwischen Mikrolagerung. Bei hohem Risiko eine druckverteilende Matratze.', quellen: ['dnqp-dekubitus'] },
    { titel: 'Schmerz vor Bewegung', text: 'Wer bei Bewegung Schmerzen hat, lässt sich ungern lagern. Schmerz bei Demenz mit BESD einschätzen und mit der Ärztin ein Schmerzmittel rechtzeitig vor dem Lagern klären.', quellen: ['dnqp-schmerz'] },
    { titel: 'Überholt', text: 'Franzbranntwein, Föhnen, Eisen und Massieren geröteter Haut schaden. Auch Fell und Wasserkissen sind keine Druckentlastung.', quellen: ['dnqp-dekubitus'] },
  ],

  pruefwege: {
    muster: [
      { art: 'massnahme', id: 'haendedesinfektion' },
      { art: 'massnahme', id: 'vorstellen-einverstaendnis' },
      { art: 'massnahme', id: 'kurve-lesen' },
      { art: 'massnahme', id: 'privatsphaere-wahren' },
      { art: 'massnahme', id: 'haut-beobachten' },
      { art: 'massnahme', id: 'dekubitusrisiko-einschaetzen' },
      { art: 'massnahme', id: 'schmerz-besd' },
      { art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: ['s-schmerz-lagern', 'b-heim', 'a-besd', 'a-trinkt-wenig', 'r-schmerzmittel'] },
      { art: 'rueckmelden', anordnung: 'an-paracetamol', rueckgelesen: true },
      { art: 'rueckmelden', anordnung: 'an-trinken', rueckgelesen: true },
      { art: 'auflegen', an: 'aerztin' },
      { art: 'massnahme', id: 'bedarfsmedikation-oral' },
      { art: 'massnahme', id: 'trinken-anbieten' },
      { art: 'massnahme', id: 'inkontinenz-versorgen' },
      { art: 'frage', id: 'g-ankuendigen' },
      { art: 'massnahme', id: 'positionieren-druckentlastung' },
      { art: 'massnahme', id: 'haendedesinfektion' },
      { art: 'frage', id: 'g-musik' },
      { art: 'frage', id: 'g-matratze' },
      { art: 'massnahme', id: 'pflegeplanung-anpassen' },
      { art: 'dokumentieren', bausteine: ['a-braden', 'a-besd', 'massnahme:positionieren-druckentlastung'], freitext: 'Rötung Kreuzbein ca. handtellergroß, Fingertest negativ. 30°-Seitenlage rechts, Fersen frei. Bewegungsplan angelegt, Wechseldruckmatratze angefordert.' },
      { art: 'massnahme', id: 'schmerz-besd' },
      { art: 'nachricht', an: 'aerztin', kanal: 'messenger', bausteine: ['wert:besd'] },
      { art: 'warten', sek: 120 },
      { art: 'abschluss', probleme: ['pb-dekubitus', 'pb-schmerz', 'pb-trinken', 'pb-feucht'], ziele: ['z-haut', 'z-schmerz', 'z-trinken'],
        sbar: ['s-schmerz-lagern', 'b-heim', 'a-besd'] },
    ],
    unterlassung: { bisSek: 1800, erwartet: { wert: 'dekubitusKat', vergleich: '>=', grenze: 1 } },
    grenze: { rolle: 1, events: [{ art: 'massnahme', id: 'bedarfsmedikation-oral' }], erwartet: 'pa-eingriff' },
  },
};
