// Fallwelle P17a · CE 01 Ausbildungsstart · Krankenhaus (Innere): erster Praxistag, Morgenrunde, Schwindel beim Aufstehen.
// Entwurf, fachlich UNGEPRÜFT. Inhalte fiktiv/didaktisch. Muster: amb-sturz-exsikkose.ts (Runde 2).
// Tiefe 1. Drittel (FALLPLAN-CE.md 2): wahrnehmen, Hygiene, Vitalzeichen, melden; eine langsame Komplikation; PA hilft viel.

import { KATALOG } from '../katalog';
import type { ArztRegel, Bedingung, FallV2, MassnahmeDefinition } from '../typen';

const aus = (id: string, mehr: Partial<MassnahmeDefinition>): MassnahmeDefinition => ({ ...KATALOG[id]!, ...mehr });

/** Patientennahe Tätigkeiten: davor gehört die Händedesinfektion (WHO-Moment 1). */
const KONTAKT: Bedingung = { eine: ['rr-messen', 'puls-zaehlen', 'temperatur-ohr', 'pulsoxy-anlegen', 'haut-beobachten', 'schleimhaut-pruefen', 'koerperpflege', 'bettkante-sitzen'].map((getan) => ({ getan })) };
const NACHBARIN_RUFT = 420;

const ANTWORT_VOLL = '„Danke, gut beobachtet. Das klingt nach zu wenig Flüssigkeit bei Fieber. Ramipril heute pausieren, 500 ml Ringer über die Braunüle in zwei Stunden, und Trinken mit Protokoll. Ich schaue nach der Visite bei ihr vorbei. Messen Sie bitte in einer Viertelstunde noch einmal Blutdruck und Puls und schreiben Sie mir die Werte.“';
const REGEL_VOLL: ArztRegel = {
  id: 'r-voll', wenn: { gemeldet: ['s-schwindel', 'a-rr-niedriger', 'a-trinkt-wenig'] }, antwort: ANTWORT_VOLL,
  anordnungen: ['an-ramipril-pause', 'an-infusion', 'an-trinken'], setzt: ['arzt-informiert'], auftraege: ['af-rr-kontrolle'],
};

export const KH_ERSTER_TAG: FallV2 = {
  schema: 2,
  id: 'kh-erster-tag',
  version: '0.1.0',
  spur: 'A',
  setting: 'krankenhaus',
  altersgruppe: 'hochbetagt',
  titel: '„Sind Sie die Neue?“',
  kurz: 'Erster Praxistag auf der Inneren: Morgenrunde bei einer 78-Jährigen mit Harnwegsinfekt, die beim Aufsetzen schwindelig wird.',
  rahmen: 'Dein erster Praxistag im 1. Ausbildungsdrittel auf einer internistischen Station. Deine Praxisanleiterin nimmt dich zur Morgenrunde mit: Vitalzeichen messen und bei der Körperpflege am Waschbecken unterstützen.',
  lernziele: [
    'Hände vor und nach dem Kontakt mit der Patientin desinfizieren (5 Momente der Händehygiene).',
    'Sich vorstellen, Einverständnis einholen und die Identität der Patientin sicher prüfen.',
    'Vitalzeichen messen, mit den Vorwerten in der Kurve vergleichen und Abweichungen melden.',
    'Schwindel beim Aufsetzen ernst nehmen: sichern, messen, Hilfe holen.',
    'Schweigepflicht am Telefon wahren und die eigenen Grenzen im 1. Drittel kennen (Pflegefachperson einbeziehen).',
  ],
  lehrplan: {
    ce: ['ce.01', 'ce.02'], abschnitt: ['ad12'],
    themen: ['thema.ph.hygiene', 'thema.beo.vitalzeichen', 'thema.re.schweigepflicht', 'thema.re.berufsrecht', 'thema.pro.sturz', 'thema.kom.selbstpflege'],
    kompetenzen: ['I.6.a', 'II.1.d', 'III.1.e', 'IV.2.a'],
  },
  geeignet: { rollen: [1, 2], stufen: [1, 2, 3] },
  dauerMin: [8, 12],
  freigabe: {
    status: 'entwurf',
    pruefpunkte: [
      'Händehygiene: Ablauf und Zeitpunkte gegen KRINKO 2016 / WHO 5 Momente prüfen',
      'Befugnis 1. Drittel: Infusion anhängen gesperrt, Tabletten nur mit Anleitung – passt das zur Einrichtung?',
      'Ramipril-Pause und Volumengabe bei Fieber und Hypotonie fachlich plausibel?',
      'Schweigepflicht: Umgang mit Anrufen von Nachbarn (§ 203 StGB) im Leitfaden korrekt?',
      'Quellenfassungen (KRINKO 2016, DNQP Sturz 2022, S3 Harnwegsinfektionen) am Quellenregister prüfen',
    ],
  },
  quellen: [
    { id: 'krinko-haende', titel: 'KRINKO: Händehygiene in Einrichtungen des Gesundheitswesens, Änderung 2026 (Epid. Bull. 32/2026) der Fassung 2016' },
    { id: 'who-5-momente', titel: 'WHO: Guidelines on Hand Hygiene in Health Care, 5 Momente der Händehygiene (2009)' },
    { id: 'aps-identifikation', titel: 'Aktionsbündnis Patientensicherheit: Handlungsempfehlung sichere Patientenidentifikation (2018)' },
    { id: 'dnqp-sturz', titel: 'DNQP Expertenstandard Sturzprophylaxe in der Pflege, 2. Aktualisierung 2022' },
    { id: 'stgb-203', titel: 'StGB § 203 Verletzung von Privatgeheimnissen; Berufsordnung Pflege' },
    { id: 'pflbg', titel: 'Pflegeberufegesetz (PflBG): Ausbildungsziel, Aufsicht durch Pflegefachpersonen' },
  ],

  person: {
    name: 'Frau Hoffmann',
    alter: { jahre: 78 },
    geschlecht: 'w',
    biografie: ['verwitwet, lebt allein in einer Erdgeschosswohnung', 'Sohn Thomas wohnt im Nachbarort', 'war Verkäuferin in einer Bäckerei, plaudert gern'],
    diagnosenBekannt: ['Harnwegsinfektion mit Fieber (V. a. Pyelonephritis links)', 'arterielle Hypertonie', 'Schwerhörigkeit (Hörgerät links)'],
    medikamentePlan: ['Cefpodoxim 200 mg 1-0-1', 'Ramipril 5 mg 1-0-0', 'Enoxaparin 40 mg s. c. 0-0-1', 'Paracetamol 500 mg bei Bedarf'],
    allergien: ['keine bekannt'],
    hilfsmittel: ['Hörgerät links', 'Brille'],
    gewichtKg: 64,
  },
  medien: { raum: '30a_station_zimmer_frau_ohne_monitor' },
  uebernahme: 'Zimmer 4, Frau Hoffmann, 78. Seit gestern Mittag bei uns mit Harnwegsinfekt und Fieber, bekommt Cefpodoxim. Nachts 38,7 °C, um halb drei Paracetamol. Trinkt wenig, weil es beim Wasserlassen brennt. Braunüle links. Sie ist orientiert und freut sich über Gesellschaft.',
  startUhrzeit: '07:10',

  start: {
    // volumen 0.84 (Fieber, wenig getrunken), gefaesstonus 0.93 (Fieber, Ramipril): Modell zeigt etwa RR 100–110 syst., HF um 100
    grund: { volumen: 0.84, gefaesstonus: 0.93, hydratation: 0.84, temperatur: 38.3, schmerz: 2, angst: 0.2, blutzucker: 118 },
    treiber: [{ art: 'exsikkose_progressiv', verlustProStunde: 0.03 }],
    bild: { haltung: 'liegt', haut: 'gerötet-heiss', mimik: 'ruhig' },
    flags: ['zugang-liegt'],
    anordnungen: ['an-plan', 'an-bedarf'],
  },

  massnahmen: [
    // Gespräch
    'vorstellen-einverstaendnis', 'ansprechen-orientierung', 'trinkmenge-erfragen', 'beschwerden-erfragen', 'kommunikationshilfe',
    // Beobachten
    'patient-identifizieren', 'haut-beobachten', 'schleimhaut-pruefen', 'urin-beobachten', 'schmerz-nrs', 'sturzrisiko-einschaetzen',
    // Akut
    'hilfe-holen', 'sturzprophylaxe-bett',
    // Messen
    'kurve-lesen', 'temperatur-ohr', 'rr-messen', 'puls-zaehlen', 'af-zaehlen', 'pulsoxy-anlegen',
    // Versorgen
    'haendedesinfektion', 'privatsphaere-wahren', 'bettkante-sitzen', 'koerperpflege', 'trinken-anbieten', 'tabletten-wie-geplant-geben',
    'ramipril-zurueckhalten', 'bedarfsmedikation-oral', 'infusion-anhaengen', 'infusion-ueberwachen', 'wadenwickel',
    // Melden
    'pflegefachperson-informieren', 'pflegebericht', 'tochter-informieren',
  ],
  massnahmenZusatz: [
    aus('tabletten-wie-geplant-geben', { name: 'Morgentabletten vom Tablett geben (Cefpodoxim, Ramipril)' }),
    aus('torasemid-zurueckhalten', { id: 'ramipril-zurueckhalten', name: 'Ramipril heute zurückhalten' }),
    aus('bedarfsmedikation-oral', { name: 'Paracetamol 500 mg aus dem Bedarfsplan geben', treiber: [{ art: 'wirkstoff', id: 'paracetamol', dosisMg: 500, weg: 'oral' }] }),
    aus('urin-beobachten', { name: 'Urin im Bilanzbogen und im Toilettenstuhl ansehen' }),
    aus('pflegefachperson-informieren', { name: 'Pflegefachfrau Jana (zuständig für Zimmer 4) informieren', setzt: ['jana-informiert'] }),
  ],

  akte: {
    aufnahmegrund: 'Seit drei Tagen Brennen beim Wasserlassen, seit gestern Fieber bis 39 °C und Flankenschmerz links. Einweisung durch die Hausärztin.',
    anamnese: [
      'Lebt allein, versorgt sich selbst, geht ohne Hilfsmittel. Sohn Thomas kauft samstags ein.',
      'Trinkt nach eigener Aussage „nie viel“, seit dem Brennen noch weniger.',
      'Hört links mit Hörgerät, rechts gut. Liest mit Brille.',
      'Kein Sturz in den letzten zwölf Monaten.',
    ],
    diagnosen: [
      { text: 'Harnwegsinfektion mit Fieber, V. a. Pyelonephritis links', icd: 'N10', seit: 'gestern' },
      { text: 'Arterielle Hypertonie', icd: 'I10.90', seit: '2012' },
      { text: 'Schwerhörigkeit links', icd: 'H90.4', seit: '2019' },
    ],
    medikation: [
      { id: 'mp-cefpodoxim', wirkstoff: 'Cefpodoxim', staerke: '200 mg', form: 'Tbl.', schema: '1-0-1-0', massnahme: 'tabletten-wie-geplant-geben', zuletzt: 'gestern 18:00',
        hinweis: 'Antibiotikum seit gestern, Urinkultur abgenommen. Morgens um 8 Uhr.' },
      { id: 'mp-ramipril', wirkstoff: 'Ramipril', staerke: '5 mg', form: 'Tbl.', schema: '1-0-0-0', massnahme: 'tabletten-wie-geplant-geben', zuletzt: 'gestern 08:00',
        hinweis: 'Vor Gabe RR messen; bei RR systolisch unter 110 Rücksprache mit der Stationsärztin.', geaendertDurch: 'an-ramipril-pause' },
      { id: 'mp-enoxaparin', wirkstoff: 'Enoxaparin', staerke: '40 mg', form: 's. c.', schema: '0-0-1-0', zuletzt: 'gestern 18:00', hinweis: 'Thromboseprophylaxe.' },
      { id: 'mp-paracetamol', wirkstoff: 'Paracetamol', staerke: '500 mg', form: 'Tbl.', massnahme: 'bedarfsmedikation-oral', zuletzt: 'heute 02:30',
        bedarf: { indikation: 'Fieber über 38,5 °C oder Schmerzen', einzeldosis: '500 mg', maxProTag: '4 Gaben', abstandH: 6 } },
    ],
    vorwerte: [
      { zeit: 'gestern 13:30 (Aufnahme)', vorH: 17.7, werte: { rrSys: 146, rrDia: 84, hf: 88, temp: 38.9, af: 16, spo2: 96, schmerz: 3 }, kuerzel: 'JM' },
      { zeit: 'gestern 18:00', vorH: 13.2, werte: { rrSys: 138, rrDia: 82, hf: 92, temp: 38.4 }, kuerzel: 'JM' },
      { zeit: 'heute 02:30', vorH: 4.7, werte: { temp: 38.7, hf: 96 }, kuerzel: 'ND' },
    ],
    pflegebericht: [
      { zeit: 'gestern 14:00', wer: 'JM', text: 'Aufnahme über die Notaufnahme. Orientiert, mobil ohne Hilfsmittel. Braunüle links Handrücken. Urinkultur abgenommen. Einfuhr bisher etwa 300 ml.' },
      { zeit: 'heute 02:30', wer: 'ND', text: 'Klingelt, friert, 38,7 °C. Paracetamol 500 mg gegeben. Trinkt wenig („dann brennt es wieder“). Urin seit 18 Uhr etwa 300 ml, dunkel. Einfuhr gestern gesamt etwa 700 ml.' },
    ],
    aerztlicheAnordnungen: [
      { zeit: 'gestern 13:45', wer: 'Dr. Aydin', text: 'Cefpodoxim 200 mg 1-0-1 nach Abnahme der Urinkultur. Vitalzeichen 2× täglich, bei Fieber zusätzlich. Ein- und Ausfuhr bilanzieren.' },
      { zeit: 'gestern 13:45', wer: 'Dr. Aydin', text: 'Paracetamol 500 mg bei Fieber über 38,5 °C oder Schmerzen, max. 4×/Tag, Abstand mind. 6 h.' },
    ],
    assessments: [
      { name: 'Sturzrisiko (Risikofaktoren nach Expertenstandard)', wert: 'erhöht', datum: 'gestern', hinweis: 'Alter, akuter Infekt mit Fieber, Hörminderung, ungewohnte Umgebung.' },
      { name: 'Braden-Skala', wert: '20 Punkte (kein erhöhtes Risiko)', datum: 'gestern' },
      { name: 'Barthel-Index', wert: '85 von 100', datum: 'gestern' },
    ],
    labor: [
      { name: 'CRP', wert: '86', einheit: 'mg/l', norm: 'unter 5', datum: 'gestern', auffaellig: true },
      { name: 'Leukozyten', wert: '13,2', einheit: '/nl', norm: '4–10', datum: 'gestern', auffaellig: true },
      { name: 'Kreatinin', wert: '1,1', einheit: 'mg/dl', norm: '0,5–1,0', datum: 'gestern', auffaellig: true },
      { name: 'Urinstatus', wert: 'Leukozyten +++, Nitrit positiv', datum: 'gestern', auffaellig: true },
    ],
    bilanzVortag: { einfuhrMl: 700, ausfuhrMl: 650 },
    pflegeplanung: [
      { problem: 'Erhöhte Körpertemperatur bei Harnwegsinfekt', ziel: 'Fühlt sich wohl, Fieber wird früh erkannt', massnahmen: ['Temperatur 2× täglich und bei Frösteln', 'leichte Bettwäsche, Getränke bereitstellen'] },
      { problem: 'Gefahr eines Flüssigkeitsdefizits (trinkt wenig wegen Brennen)', ziel: 'Trinkt mindestens 1,5 l am Tag', massnahmen: ['Getränke anbieten, Trinkprotokoll', 'erklären, dass Trinken das Brennen lindert'] },
    ],
    rechtliches: [
      'Einwilligung in die Auskunft: nur an den Sohn, Herrn Thomas Hoffmann (bei Aufnahme unterschrieben).',
      'Keine Patientenverfügung, keine Vorsorgevollmacht.',
    ],
  },

  befunde: [
    { massnahme: 'haendedesinfektion', varianten: [{ text: 'Du nimmst eine Hohlhand voll Desinfektionsmittel und reibst 30 Sekunden ein, Fingerkuppen und Daumen zuletzt. Ringe und Uhr hast du schon in der Umkleide abgelegt.' }] },
    { massnahme: 'vorstellen-einverstaendnis', varianten: [{ text: 'Du stellst dich mit Namen und als Auszubildende im ersten Jahr vor. Frau Hoffmann lächelt: „Sind Sie die Neue? Na, dann üben Sie mal an mir.“ Sie ist mit dem Messen einverstanden.' }] },
    { massnahme: 'patient-identifizieren', varianten: [{ text: 'Sie nennt Namen und Geburtsdatum: Gertrud Hoffmann, 3. Mai 1948. Das Armband stimmt mit Kurve und Tablett überein.' }] },
    { massnahme: 'ansprechen-orientierung', varianten: [{ text: 'Wach und orientiert. „Ich fühl mich wie durch den Wolf gedreht.“ Links hört sie schlecht, du sprichst sie von rechts an.' }] },
    { massnahme: 'kommunikationshilfe', varianten: [{ text: 'Du reichst ihr Hörgerät und Brille vom Nachttisch und sprichst langsam von der rechten Seite. Sie versteht dich jetzt gut.' }] },
    { massnahme: 'kurve-lesen', varianten: [{ text: 'Kurve: gestern 18 Uhr RR 138/82, Puls 92, 38,4 °C; heute 02:30 38,7 °C, Paracetamol gegeben. Einfuhr gestern nur etwa 700 ml. Ramipril morgens: bei RR systolisch unter 110 Rücksprache.' }] },
    { massnahme: 'temperatur-ohr', varianten: [{ text: '{temp} °C.', zeigt: ['temp'] }] },
    { massnahme: 'rr-messen', varianten: [
      { wenn: { wert: 'rrSys', vergleich: '>=', grenze: 115 }, text: 'RR {rrSys}/{rrDia} mmHg, Puls {hf}/min (gestern Abend 138/82).', zeigt: ['rrSys', 'rrDia', 'hf'] },
      { text: 'RR {rrSys}/{rrDia} mmHg, Puls {hf}/min. Deutlich niedriger als gestern Abend (138/82), der Puls schneller.', zeigt: ['rrSys', 'rrDia', 'hf'] },
    ] },
    { massnahme: 'puls-zaehlen', varianten: [{ text: 'Puls {hf}/min, regelmäßig, eher flach tastbar.', zeigt: ['hf'] }] },
    { massnahme: 'af-zaehlen', varianten: [{ text: 'Atemfrequenz {af}/min, ruhig, ohne Anstrengung.', zeigt: ['af'] }] },
    { massnahme: 'pulsoxy-anlegen', varianten: [{ text: 'SpO₂ {spo2} %.', zeigt: ['spo2'] }] },
    { massnahme: 'schmerz-nrs', varianten: [{ text: '„Es brennt beim Wasserlassen, und links im Rücken zieht es.“ NRS 2 in Ruhe.' }] },
    { massnahme: 'haut-beobachten', varianten: [{ text: 'Gesicht gerötet, Haut warm und trocken, kein Schweiß, keine Zyanose.' }] },
    { massnahme: 'schleimhaut-pruefen', varianten: [{ text: 'Zunge trocken, Lippen spröde.' }] },
    { massnahme: 'trinkmenge-erfragen', varianten: [{ text: '„Ich trink lieber nicht so viel, sonst muss ich dauernd, und das brennt so.“ Die Wasserflasche vom Abend ist fast voll.' }] },
    { massnahme: 'urin-beobachten', varianten: [{ text: 'Bilanzbogen: seit 18 Uhr etwa 300 ml Urin. Im Toilettenstuhl wenig, dunkler, trüber Urin.' }] },
    { massnahme: 'sturzrisiko-einschaetzen', varianten: [{ text: 'Fieber, Schwindel, fremde Umgebung, Hörminderung: Sturzrisiko heute deutlich erhöht. Nur mit Begleitung aufstehen.' }] },
    { massnahme: 'bettkante-sitzen', varianten: [{ text: 'Sie sitzt an der Bettkante, die Füße auf dem Boden. Nach einer Minute: „Jetzt geht es, aber langsam.“' }] },
    { massnahme: 'koerperpflege', varianten: [{ text: 'Sie wäscht Gesicht, Arme und Oberkörper im Sitzen selbst, du übernimmst Rücken und Beine. Sie möchte so viel wie möglich selbst machen.' }] },
    { massnahme: 'tabletten-wie-geplant-geben', varianten: [{ text: 'Du gibst die Tabletten vom Tablett mit einem Glas Wasser.' }] },
    { massnahme: 'bedarfsmedikation-oral', varianten: [{ text: 'Du gibst eine Tablette Paracetamol 500 mg.' }] },
  ],

  gespraech: [
    { id: 'g-wie-gehts', frage: 'Fragen, wie die Nacht war und wie es ihr geht', an: 'patient', kompetenzbereiche: ['I', 'II'],
      antwort: [{ text: '„Schlecht geschlafen, dauernd gefroren. Und jetzt ist mir warm.“' }], fakten: ['nachts gefroren', 'schlecht geschlafen'] },
    { id: 'g-jana-infusion', frage: 'Jana bitten, die angeordnete Infusion anzuhängen (du schaust zu)', an: 'kollegin', kompetenzbereiche: ['III'],
      nurWenn: { anordnung: 'an-infusion' },
      antwort: [{ text: 'Jana: „Gut, dass du mich holst. Die Infusion hänge ich an, du schaust zu und kontrollierst nachher die Tropfgeschwindigkeit mit mir.“', setzt: ['infusion-durch-jana', 'infusion-laeuft'] }],
      wirkung: [
        { groesse: 'volumen', delta: 0.1, beginnSek: 60, spitzeSek: 1800, dauerSek: 'dauerhaft' },
        { groesse: 'hydratation', delta: 0.08, beginnSek: 60, spitzeSek: 1800, dauerSek: 'dauerhaft' },
      ] },
    { id: 'g-nachbarin-auskunft', frage: 'Der Anruferin sagen, dass Frau Hoffmann Fieber hat und schwach ist', an: 'angehoerige', kanal: 'telefon', kompetenzbereiche: ['II', 'IV'],
      nurWenn: { ab: NACHBARIN_RUFT },
      schweigepflicht: { erlaubtWenn: { flag: 'einwilligung-nachbarin' },
        fehlerText: 'Du hast einer Anruferin Auskunft gegeben. Am Telefon weißt du nicht, wer spricht, und Frau Hoffmann hat nur ihrem Sohn Auskunft erlaubt (Akte, Rechtliches). Auch „harmlose“ Angaben wie „sie hat Fieber“ fallen unter die Schweigepflicht.' },
      antwort: [{ text: 'Frau Berger: „Ach je, Fieber! Dann sag ich das gleich den anderen im Haus.“' }] },
    { id: 'g-nachbarin-verweisen', frage: 'Freundlich erklären, dass du keine Auskunft geben darfst, und anbieten, dass Frau Hoffmann zurückruft', an: 'angehoerige', kanal: 'telefon',
      kompetenzbereiche: ['II', 'IV'], nurWenn: { ab: NACHBARIN_RUFT },
      antwort: [{ text: 'Frau Berger: „Ach so, ja, verstehe. Dann soll sie mich anrufen, wenn sie mag. Die Nummer hat sie.“', setzt: ['nachbarin-verwiesen'] }] },
    { id: 'g-rueckruf', frage: 'Frau Hoffmann fragen, ob sie die Nachbarin zurückrufen möchte', an: 'patient', kompetenzbereiche: ['II', 'IV'],
      nurWenn: { flag: 'nachbarin-verwiesen' },
      antwort: [{ text: '„Die Inge! Ja, ich ruf sie nachher selbst an. Gut, dass Sie nichts gesagt haben, die erzählt sonst alles im ganzen Haus.“', setzt: ['rueckruf-geklaert'] }] },
  ],

  sbar: [
    { id: 's-schwindel', teil: 'S', text: 'Frau Hoffmann, 78, Zimmer 4: beim Aufsetzen schwindelig, hat weiter Fieber.', art: 'kern', bekanntWenn: { flag: 'schwindel-erlebt' } },
    { id: 's-nur-fieber', teil: 'S', text: 'Frau Hoffmann hat Fieber.', art: 'hilfreich' },
    { id: 'b-hwi', teil: 'B', text: 'Seit gestern bei uns mit Harnwegsinfekt und Fieber, bekommt Cefpodoxim und morgens Ramipril.', art: 'kern' },
    { id: 'b-hoergeraet', teil: 'B', text: 'Sie trägt links ein Hörgerät.', art: 'ablenker' },
    { id: 'a-rr-niedriger', teil: 'A', text: 'Blutdruck deutlich niedriger als gestern Abend (138 systolisch), Puls schneller.', art: 'kern', bekanntWenn: { getan: 'rr-messen' } },
    { id: 'a-trinkt-wenig', teil: 'A', text: 'Seit gestern kaum getrunken (Einfuhr etwa 700 ml), Urin wenig und dunkel, Zunge trocken.', art: 'kern',
      bekanntWenn: { eine: [{ getan: 'trinkmenge-erfragen' }, { getan: 'urin-beobachten' }, { getan: 'kurve-lesen' }] } },
    { id: 'a-normal', teil: 'A', text: 'Sonst ist alles in Ordnung, das ist bei Fieber halt so.', art: 'falsch' },
    { id: 'r-anschauen', teil: 'R', text: 'Können Sie bitte nach ihr schauen? Sollen wir das Ramipril heute geben?', art: 'kern' },
  ],

  anordnungen: [
    { id: 'an-plan', massnahme: 'tabletten-wie-geplant-geben', text: 'Medikationsplan: Cefpodoxim 200 mg 1-0-1, Ramipril 5 mg morgens (bei RR systolisch unter 110 Rücksprache).' },
    { id: 'an-bedarf', massnahme: 'bedarfsmedikation-oral', text: 'Paracetamol 500 mg bei Fieber über 38,5 °C oder Schmerzen, Abstand mind. 6 h, max. 4 Gaben am Tag.' },
    { id: 'an-ramipril-pause', massnahme: 'ramipril-zurueckhalten', text: 'Ramipril heute nicht geben.' },
    { id: 'an-infusion', massnahme: 'infusion-anhaengen', text: '500 ml Ringer-Lösung i. v. über 2 Stunden.' },
    { id: 'an-trinken', massnahme: 'trinken-anbieten', text: 'Trinken fördern, Ziel 1,5 l bis zum Abend, Trinkprotokoll.' },
  ],

  arzt: {
    name: 'Stationsärztin Dr. Aydin',
    erreichbar: 'telefon',
    regeln: [
      REGEL_VOLL,
      { id: 'r-trinkfrage', wenn: { gemeldet: ['s-schwindel', 'a-rr-niedriger'] },
        antwort: '„Danke. Fieber und niedriger Blutdruck, da denke ich zuerst an zu wenig Flüssigkeit.“',
        rueckfrage: { text: '„Wie viel hat sie seit gestern getrunken, und wie sieht der Urin aus?“', erwartet: ['a-trinkt-wenig'], auftrag: 'af-trinkmenge' } },
      { wenn: { gemeldet: ['s-schwindel'] },
        antwort: '„Haben Sie Blutdruck und Puls gemessen? Lassen Sie sie liegen und melden Sie sich mit den Werten noch einmal.“' },
      { wenn: { eine: [{ gemeldet: ['a-normal'] }, { gemeldet: ['s-nur-fieber'] }] },
        antwort: '„Fieber hat sie ja seit gestern, das Antibiotikum braucht Zeit. Ich schaue bei der Visite um zehn.“', setzt: ['arzt-beruhigt'] },
    ],
    auftraege: [
      { id: 'af-trinkmenge', text: 'Trinkmenge und Urin ansehen und der Ärztin melden', erledigt: { eine: [{ getan: 'trinkmenge-erfragen' }, { getan: 'urin-beobachten' }, { getan: 'kurve-lesen' }] },
        meldung: ['a-trinkt-wenig'], meldenBinnenSek: 600,
        folge: [{ ...REGEL_VOLL, wenn: { ab: 0 } }] },
      { id: 'af-rr-kontrolle', text: 'In einer Viertelstunde Blutdruck und Puls messen und der Ärztin schreiben', erledigt: { getan: 'rr-messen' },
        meldung: ['wert:rrSys', 'wert:hf'], meldenBinnenSek: 1500,
        folge: [
          { wenn: { wert: 'rrSys', vergleich: '>=', grenze: 108 }, antwort: '„Danke, das geht in die richtige Richtung. Infusion weiterlaufen lassen, nur mit Begleitung aufstehen. Ich komme nach der Visite.“', setzt: ['rr-rueckmeldung'] },
          { wenn: { ab: 0 }, antwort: '„Noch niedrig. Sie soll liegen bleiben, ich komme gleich vorbei.“', setzt: ['rr-rueckmeldung'], kommtNachSek: 300 },
        ] },
    ],
  },

  team: { kollegin: 'Pflegefachfrau Jana (Zimmer 4–8)', weitere: { angehoerige: 'Frau Berger, Nachbarin (Telefon)' } },

  ereignisse: [
    { id: 'e-aufsetzen', art: 'patient', wann: { ab: 240 },
      text: 'Frau Hoffmann will zum Waschbecken und setzt sich schwungvoll auf. „Huch, mir wird ganz schummrig.“ Sie hält sich am Bettrand fest.',
      bild: { haltung: 'sitzt', mimik: 'schmerz' },
      entscheidung: [
        { id: 'w-sichern', text: 'Sie sitzen lassen, Bett tief stellen, bei ihr bleiben und gleich Blutdruck und Puls messen', wertung: 'gut', setzt: ['schwindel-erlebt'],
          warum: 'Schwindel beim Aufsetzen ist ein Warnzeichen. Sichern, nicht allein lassen und messen; erst dann über das Aufstehen entscheiden.' },
        { id: 'w-hinlegen', text: 'Sie wieder hinlegen und die Waschschüssel ans Bett holen', wertung: 'vertretbar', setzt: ['schwindel-erlebt'],
          warum: 'Sicher, aber ohne Messung bleibt unklar, warum ihr schwindelig ist.' },
        { id: 'w-weiter', text: 'Sie zum Waschbecken begleiten: „Das geht gleich vorbei.“', wertung: 'gefaehrlich', setzt: ['schwindel-erlebt', 'trotzdem-gelaufen'],
          warum: 'Mit Schwindel aufzustehen ist die typische Sturzsituation, gerade bei Fieber und wenig Flüssigkeit.' },
      ] },
    { id: 'e-nachbarin', art: 'telefon', wann: { ab: NACHBARIN_RUFT },
      text: 'Das Zimmertelefon klingelt. Frau Krüger nickt dir zu, du gehst ran: „Berger hier, ich bin die Nachbarin von Frau Hoffmann. Wie geht es ihr denn?“' },
  ],

  pa: {
    name: 'Praxisanleiterin Frau Krüger',
    hilfen: [
      { wenn: { nicht: { getan: 'haendedesinfektion' } }, impuls: 'Bevor du ans Bett gehst: Was machst du mit deinen Händen?', tipp: 'Hände desinfizieren, 30 Sekunden einreiben, vor jedem Kontakt mit der Patientin.' },
      { wenn: { nicht: { getan: 'patient-identifizieren' } }, impuls: 'Woher weißt du sicher, dass das Frau Hoffmann ist?', tipp: 'Lass sie Namen und Geburtsdatum nennen und vergleiche mit dem Armband.' },
      { wenn: { nicht: { getan: 'kurve-lesen' } }, impuls: 'Wie waren ihre Werte gestern?', tipp: 'Schau in die Kurve: Vorwerte und Hinweise im Medikationsplan.' },
      { wenn: { auftrag: 'af-trinkmenge', status: 'offen' }, impuls: 'Was wollte die Ärztin noch wissen?', tipp: 'Frag nach der Trinkmenge und schau dir den Urin an, dann schreib es ihr.' },
      { wenn: { alle: [{ anordnung: 'an-infusion' }, { nicht: { flag: 'infusion-laeuft' } }] }, impuls: 'Wer hängt bei uns im ersten Drittel die Infusion an?', tipp: 'Hol Jana, sie ist für Zimmer 4 verantwortlich. Du schaust zu.' },
      { wenn: { alle: [{ auftrag: 'af-rr-kontrolle', status: 'offen' }, { nicht: { auftrag: 'af-rr-kontrolle', status: 'gemeldet' } }] }, impuls: 'Hat die Ärztin dir noch etwas aufgetragen?', tipp: 'In einer Viertelstunde Blutdruck und Puls messen und ihr schreiben.' },
      { impuls: 'Was ist heute anders als gestern Abend?', tipp: 'Vergleiche Blutdruck, Puls und Trinkmenge mit der Kurve.' },
    ],
  },

  bewertung: {
    pflicht: [
      { id: 'p-haende', text: 'Hände vor dem Kontakt desinfiziert', gewicht: 2, kompetenzbereiche: ['I', 'III'], erfuellt: { getan: 'haendedesinfektion' },
        warum: 'Händehygiene ist die wichtigste Maßnahme gegen Krankenhausinfektionen (KRINKO). Erst desinfizieren, dann anfassen.' },
      { id: 'p-vorstellen', text: 'Vorgestellt und Einverständnis eingeholt', gewicht: 1, kompetenzbereiche: ['II', 'IV'], erfuellt: { getan: 'vorstellen-einverstaendnis' },
        warum: 'Wer Frau Hoffmann ist, weißt du; wer du bist, muss sie erst erfahren. Einverständnis gehört vor jede Pflegehandlung.' },
      { id: 'p-identitaet', text: 'Identität geprüft', gewicht: 1, kompetenzbereiche: ['I', 'IV'], erfuellt: { getan: 'patient-identifizieren' },
        warum: 'Verwechslungen sind ein häufiger Fehler. Name und Geburtsdatum nennen lassen und mit dem Armband vergleichen.' },
      { id: 'p-vitalzeichen', text: 'Temperatur, Blutdruck und Puls gemessen', gewicht: 2, kompetenzbereiche: ['I'],
        erfuellt: { alle: [{ getan: 'temperatur-ohr' }, { getan: 'rr-messen' }] }, warum: 'Morgenrunde und Schwindel: Kreislauf und Fieber müssen eingeschätzt werden.' },
      { id: 'p-vorwerte', text: 'Mit den Vorwerten in der Kurve verglichen', gewicht: 1, kompetenzbereiche: ['I'], erfuellt: { getan: 'kurve-lesen' },
        warum: 'Ein Wert sagt erst im Vergleich etwas: 105 systolisch ist für Frau Hoffmann (sonst um 140) deutlich niedrig.' },
      { id: 'p-trinkmenge', text: 'Trinkmenge und Urin eingeschätzt', gewicht: 2, kompetenzbereiche: ['I'],
        erfuellt: { eine: [{ getan: 'trinkmenge-erfragen' }, { getan: 'urin-beobachten' }] }, warum: 'Fieber und wenig Trinken führen zu Flüssigkeitsmangel, der den Schwindel erklärt.' },
      { id: 'p-arzt', text: 'Stationsärztin strukturiert informiert', gewicht: 3, kompetenzbereiche: ['II', 'III'], erfuellt: { flag: 'arzt-informiert' },
        warum: 'Niedriger Blutdruck mit Schwindel bei Fieber braucht eine ärztliche Entscheidung (Ramipril, Flüssigkeit).' },
      { id: 'p-jana', text: 'Verantwortliche Pflegefachperson einbezogen', gewicht: 2, kompetenzbereiche: ['III'],
        erfuellt: { eine: [{ flag: 'jana-informiert' }, { flag: 'infusion-durch-jana' }] },
        warum: 'Im 1. Drittel arbeitest du unter Aufsicht. Jana trägt die Verantwortung für Zimmer 4 und muss Bescheid wissen.' },
      { id: 'p-rueckgelesen', text: 'Anordnungen rückgelesen', gewicht: 2, kompetenzbereiche: ['III'], erfuellt: { anordnung: 'an-infusion', rueckgelesen: true },
        warum: 'Mündliche Anordnungen am Telefon immer wiederholen (Closed Loop).' },
      { id: 'p-infusion', text: 'Infusion läuft (durch die Pflegefachperson oder mit Anleitung)', gewicht: 2, kompetenzbereiche: ['I', 'III'],
        erfuellt: { eine: [{ getan: 'infusion-anhaengen' }, { flag: 'infusion-durch-jana' }] }, warum: 'Die angeordnete Flüssigkeit hebt den Blutdruck. Wer sie anhängt, hängt vom Ausbildungsstand ab.' },
      { id: 'p-rueckauftrag', text: 'Kontrolle gemessen und der Ärztin gemeldet', gewicht: 2, kompetenzbereiche: ['II', 'III'], erfuellt: { auftrag: 'af-rr-kontrolle', status: 'gemeldet' },
        warum: 'Die Ärztin entscheidet aus der Ferne. Ohne Rückmeldung weiß sie nicht, ob die Maßnahme wirkt.' },
      { id: 'p-schweigepflicht', text: 'Am Telefon keine Auskunft gegeben, Rückruf angeboten', gewicht: 2, kompetenzbereiche: ['II', 'IV'], erfuellt: { flag: 'nachbarin-verwiesen' },
        warum: 'Die Schweigepflicht gilt auch für Auszubildende und auch für Nachbarn. Frau Hoffmann entscheidet selbst, wem sie was erzählt.' },
      { id: 'p-doku', text: 'Niedrigen Blutdruck und Maßnahmen dokumentiert', gewicht: 1, kompetenzbereiche: ['I', 'IV'], erfuellt: { dokumentiert: 'a-rr-niedriger' },
        warum: 'Was nicht dokumentiert ist, kann die nächste Schicht nicht weiterverfolgen.' },
    ],
    fehler: [
      { id: 'f-haende-vergessen', text: 'Patientin angefasst, ohne vorher die Hände zu desinfizieren', schwere: 'mittel', kompetenzbereiche: ['I', 'III'],
        wenn: { alle: [KONTAKT, { nicht: { getan: 'haendedesinfektion' } }] },
        warum: 'Hände übertragen Erreger von Patientin zu Patientin. Vor dem Kontakt desinfizieren, nicht erst danach.' },
      { id: 'f-ramipril', text: 'Ramipril trotz niedrigem Blutdruck ohne Rücksprache gegeben', schwere: 'mittel', kompetenzbereiche: ['I', 'III'],
        wenn: { alle: [{ getan: 'tabletten-wie-geplant-geben' }, { nicht: { anordnung: 'an-ramipril-pause' } }] },
        folge: { text: 'Eine Stunde später ist ihr beim Aufsetzen wieder schwarz vor Augen.', wirkung: [{ groesse: 'gefaesstonus', delta: -0.05, beginnSek: 900, spitzeSek: 2700, dauerSek: 'dauerhaft' }] },
        warum: 'Im Medikationsplan steht: bei RR unter 110 Rücksprache. Ein Blutdrucksenker verstärkt Schwindel und Sturzgefahr.' },
      { id: 'f-trotzdem-gelaufen', text: 'Mit Schwindel zum Waschbecken gegangen', schwere: 'schwer', kompetenzbereiche: ['I', 'V'], wenn: { flag: 'trotzdem-gelaufen' },
        folge: { text: 'Am Waschbecken sackt sie in die Knie. Du kannst sie gerade noch auf den Stuhl setzen. Sie ist blass und erschrocken.',
          wirkung: [{ groesse: 'angst', delta: 0.3, beginnSek: 0, spitzeSek: 10, dauerSek: 900 }] },
        warum: 'Erst sichern und messen, dann aufstehen. Ein Beinahe-Sturz ist ein Sturzereignis und muss gemeldet werden.' },
    ],
    ende: [
      { wenn: { alle: [{ flag: 'arzt-informiert' }, { flag: 'rr-rueckmeldung' }, { dokumentiert: 'a-rr-niedriger' }] },
        text: 'Die Infusion läuft, Frau Hoffmann trinkt ein Glas Tee und erzählt dir von ihrer Bäckerei. Die Ärztin kommt nach der Visite.', ausgang: 'stabil' },
      { wenn: { ab: 1800 }, text: 'Die Visite steht vor der Tür. Der Schwindel ist nicht geklärt.', ausgang: 'verschlechtert' },
    ],
  },

  pflegebedarf: {
    probleme: [
      { id: 'pb-fluessigkeit', text: 'Flüssigkeitsdefizit (trinkt wenig wegen Brennen, Fieber)', richtig: true, prioritaet: 1, warum: 'Erklärt niedrigen Blutdruck, schnellen Puls und Schwindel.' },
      { id: 'pb-sturz', text: 'Erhöhtes Sturzrisiko (Schwindel beim Aufsetzen, Fieber)', richtig: true, prioritaet: 1, warum: 'Sie will selbstständig aufstehen, der Kreislauf trägt das heute nicht sicher.' },
      { id: 'pb-fieber', text: 'Erhöhte Körpertemperatur bei Harnwegsinfekt', richtig: true, prioritaet: 2, warum: 'Beobachten, Wohlbefinden fördern, Antibiotikum läuft.' },
      { id: 'pb-schmerz', text: 'Brennen beim Wasserlassen, Flankenschmerz', richtig: true, prioritaet: 3, warum: 'Leicht, aber Grund, warum sie wenig trinkt.' },
      { id: 'pb-verwirrt', text: 'Akute Verwirrtheit', richtig: false, warum: 'Frau Hoffmann ist voll orientiert.' },
      { id: 'pb-dekubitus', text: 'Dekubitusgefahr', richtig: false, warum: 'Braden 20, mobil: kein erhöhtes Risiko.' },
    ],
    ziele: [
      { id: 'z-trinken', text: 'Frau Hoffmann trinkt bis 18 Uhr mindestens 1,5 l (Protokoll).', passtZu: ['pb-fluessigkeit'], richtig: true },
      { id: 'z-begleitet', text: 'Frau Hoffmann steht heute nur mit Begleitung auf und bleibt sturzfrei.', passtZu: ['pb-sturz'], richtig: true },
      { id: 'z-wohl', text: 'Frau Hoffmann fühlt sich trotz Fieber wohl (leichte Bettwäsche, Getränke in Reichweite).', passtZu: ['pb-fieber'], richtig: true },
      { id: 'z-bettruhe', text: 'Frau Hoffmann bleibt bis zur Entlassung im Bett.', passtZu: ['pb-sturz'], richtig: false },
    ],
  },

  leitfaden: [
    { titel: 'Händehygiene', text: 'Hände desinfizieren vor dem Kontakt, vor aseptischen Tätigkeiten, nach Kontakt mit Körperflüssigkeiten, nach dem Kontakt und nach Berührung der Umgebung (5 Momente). 30 Sekunden einreiben, keine Ringe, Uhren oder künstlichen Nägel. Handschuhe ersetzen die Desinfektion nicht.', quellen: ['krinko-haende', 'who-5-momente'] },
    { titel: 'Die erste Begegnung', text: 'Anklopfen, vorstellen (Name, Ausbildungsjahr), erklären, was du vorhast, Einverständnis einholen. Identität prüfen: Die Patientin nennt Namen und Geburtsdatum, du vergleichst mit Armband und Kurve. Bei Hörminderung Hilfsmittel reichen und von der guten Seite sprechen.', quellen: ['aps-identifikation'] },
    { titel: 'Werte vergleichen', text: 'Ein Blutdruck von 105/65 ist für eine junge Frau normal, für Frau Hoffmann (sonst um 140) deutlich niedrig. Fieber und wenig Trinken führen zu Flüssigkeitsmangel: Der Puls steigt, der Blutdruck fällt, beim Aufsetzen wird es schwindelig. Ein Blutdrucksenker verstärkt das.' },
    { titel: 'Schwindel beim Aufsetzen', text: 'Sitzen lassen, Bett tief, nicht allein lassen, messen. Erst an der Bettkante sitzen lassen und nachfragen, dann mit Begleitung aufstehen. Ein Beinahe-Sturz wird gemeldet.', quellen: ['dnqp-sturz'] },
    { titel: 'Schweigepflicht', text: 'Am Telefon weißt du nicht, wer spricht. Auskunft nur an Personen, denen die Patientin sie erlaubt hat (steht in der Akte). Freundlich bleiben und einen Rückruf durch die Patientin anbieten. Die Schweigepflicht gilt ab dem ersten Ausbildungstag.', quellen: ['stgb-203'] },
    { titel: 'Deine Rolle im 1. Drittel', text: 'Du arbeitest unter Aufsicht einer Pflegefachperson. Was du noch nicht gelernt hast (z. B. Infusion anhängen), übernimmt sie, du schaust zu. Melden ist keine Schwäche, sondern Teil der Verantwortung.', quellen: ['pflbg'] },
  ],

  pruefwege: {
    muster: [
      { art: 'massnahme', id: 'haendedesinfektion' },
      { art: 'massnahme', id: 'vorstellen-einverstaendnis' },
      { art: 'massnahme', id: 'patient-identifizieren' },
      { art: 'massnahme', id: 'kommunikationshilfe' },
      { art: 'massnahme', id: 'kurve-lesen' },
      { art: 'massnahme', id: 'temperatur-ohr' },
      { art: 'massnahme', id: 'rr-messen' },
      { art: 'massnahme', id: 'af-zaehlen' },
      { art: 'massnahme', id: 'trinkmenge-erfragen' },
      { art: 'massnahme', id: 'urin-beobachten' },
      { art: 'massnahme', id: 'sturzprophylaxe-bett' },
      { art: 'massnahme', id: 'pflegefachperson-informieren' },
      { art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: ['s-schwindel', 'b-hwi', 'a-rr-niedriger', 'a-trinkt-wenig', 'r-anschauen'] },
      { art: 'rueckmelden', anordnung: 'an-ramipril-pause', rueckgelesen: true },
      { art: 'rueckmelden', anordnung: 'an-infusion', rueckgelesen: true },
      { art: 'rueckmelden', anordnung: 'an-trinken', rueckgelesen: true },
      { art: 'auflegen', an: 'aerztin' },
      { art: 'massnahme', id: 'ramipril-zurueckhalten' },
      { art: 'frage', id: 'g-jana-infusion' },
      { art: 'massnahme', id: 'trinken-anbieten' },
      { art: 'frage', id: 'g-nachbarin-verweisen' },
      { art: 'frage', id: 'g-rueckruf' },
      { art: 'massnahme', id: 'haendedesinfektion' },
      { art: 'dokumentieren', bausteine: ['wert:temp', 'wert:rrSys', 'a-rr-niedriger', 'a-trinkt-wenig'] },
      { art: 'warten', sek: 300 },
      { art: 'massnahme', id: 'rr-messen' },
      { art: 'nachricht', an: 'aerztin', kanal: 'messenger', bausteine: ['wert:rrSys', 'wert:hf'] },
      { art: 'warten', sek: 120 },
      { art: 'abschluss', probleme: ['pb-fluessigkeit', 'pb-sturz', 'pb-fieber', 'pb-schmerz'], ziele: ['z-trinken', 'z-begleitet', 'z-wohl'],
        sbar: ['s-schwindel', 'b-hwi', 'a-rr-niedriger', 'a-trinkt-wenig'] },
    ],
    unterlassung: { bisSek: 1800, erwartet: { wert: 'hydratation', vergleich: '<', grenze: 0.83 } },
    grenze: { rolle: 1, events: [{ art: 'massnahme', id: 'infusion-anhaengen' }], erwartet: 'pa-eingriff' },
  },
};
