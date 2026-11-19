// Pilotfall Spur A · Krankenhaus (Akut/Klinik): Pneumonie mit beginnender Sepsis auf der Normalstation
// Entwurf, fachlich UNGEPRÜFT. Inhalte fiktiv/didaktisch. Muster: amb-sturz-exsikkose.ts (Paket P6).

import { KATALOG } from '../katalog';
import type { ArztRegel, Bedingung, FallV2, MassnahmeDefinition } from '../typen';

/** Katalog-Maßnahme mit fallspezifischen Angaben (Name, Wirkung), Befugnis und Nachweis bleiben. */
const aus = (id: string, mehr: Partial<MassnahmeDefinition>): MassnahmeDefinition => ({ ...KATALOG[id]!, ...mehr });

const ATMUNG_ERHOBEN: Bedingung = { eine: [{ getan: 'af-zaehlen' }, { getan: 'atmung-beobachten' }] };
const SPO2_BEKANNT: Bedingung = { eine: [{ getan: 'pulsoxy-anlegen' }, { getan: 'monitor-anlegen' }] };
const RR_BEKANNT: Bedingung = { eine: [{ getan: 'rr-messen' }, { getan: 'monitor-anlegen' }] };

// Runde 2 (P14a): Sepsis-Antwort der Ärztin, auch als Folge der Rückfrage nach dem Blutdruck
const SEPSIS_ANTWORT = '„Danke, das klingt nach Sepsis. Ich komme sofort. Sauerstoff über die Brille nach Ziel 92 bis 96 Prozent, 500 ml Vollelektrolyt jetzt anhängen, Monitor dran. Blutkulturen und Laktat nehme ich selbst ab, danach ziehen wir das Antibiotikum vor. Messen Sie bitte zehn Minuten nach Infusionsstart den Blutdruck und schicken Sie ihn mir über den Messenger.“';
const SEPSIS_REGEL: ArztRegel = {
  id: 'r-sepsis', wenn: { gemeldet: ['a-verwirrt-neu', 'a-af-hoch'] }, antwort: SEPSIS_ANTWORT,
  anordnungen: ['an-o2', 'an-infusion', 'an-abx'], kommtNachSek: 300, setzt: ['arzt-kommt'], auftraege: ['af-rr-kontrolle'],
};

export const KH_PNEUMONIE_SEPSIS: FallV2 = {
  schema: 2,
  id: 'kh-pneumonie-sepsis',
  version: '0.2.0',
  spur: 'A',
  setting: 'krankenhaus',
  altersgruppe: 'erwachsen',
  titel: '„Die Mama ist heute so anders“',
  kurz: 'Innere Station, Spätdienst: 74-Jährige mit Lungenentzündung atmet schnell, ist neu verwirrt, der Blutdruck sinkt.',
  rahmen: 'Du übernimmst mit deiner Praxisanleitung im Spätdienst das Zimmer von Frau Albrecht auf der internistischen Station.',
  lernziele: [
    'Eine Verschlechterung bei Pneumonie früh erkennen: Atemfrequenz, Bewusstsein und Blutdruck gehören zusammen.',
    'Mit einem Frühwarnwert (NEWS2) die Dringlichkeit begründen und rechtzeitig handeln.',
    'Den Verdacht auf Sepsis der Ärztin mit SBAR so melden, dass sie sofort kommt.',
    'Anordnungen (O₂, Infusion) rücklesen und im Rahmen der eigenen Befugnis umsetzen.',
    'Grenzen kennen: i. v.-Antibiotikum vorziehen ist für Auszubildende gesperrt.',
  ],
  lehrplan: { ce: ['ce.05'], abschnitt: ['ad12', 'ad3'], themen: ['thema.kl.atmung', 'thema.kl.infektion', 'thema.beo.vitalzeichen', 'thema.re.schweigepflicht', 'thema.pp.uebergabe'] },
  geeignet: { rollen: [1, 2, 3], stufen: [1, 2, 3] },
  dauerMin: [12, 18],
  freigabe: {
    status: 'entwurf',
    pruefpunkte: [
      'Ablauf (Erkennen, NEWS2, Melden, O₂ nach Zielbereich, Volumen, Blutkulturen vor Antibiotikum) gegen S3-Leitlinie Sepsis und SSC 2021 prüfen',
      'NEWS2-Schwellen (5–6 dringlich, ≥ 7 Notfall) und Reaktion der Station prüfen',
      'O₂-Zielbereich 92–96 % (ohne COPD) gegen BTS-Leitlinie bzw. S3-Leitlinie Sauerstofftherapie prüfen',
      'Befugnis Infusion anhängen (1. Drittel gesperrt, 2./3. Drittel mit Anleitung) und i. v.-Antibiotikum (gesperrt) bestätigen',
      'Verlauf im Lernmodell plausibel? (Start etwa RR 106/79, HF um 130, AF 24, SpO₂ 91 %; Diastole im Modell für eine Sepsis eher hoch)',
    ],
  },
  quellen: [
    { id: 's3-cap', titel: 'S3-Leitlinie Behandlung von erwachsenen Patienten mit ambulant erworbener Pneumonie (AWMF 020-020), 2021' },
    { id: 's3-sepsis', titel: 'S3-Leitlinie Sepsis – Prävention, Diagnose, Therapie und Nachsorge (AWMF 079-001), 2018', fundstelle: 'Aktualisierung in Arbeit, Fassung prüfen' },
    { id: 'ssc-2021', titel: 'Surviving Sepsis Campaign: International Guidelines 2021', fundstelle: 'Evans L. et al., Crit Care Med 2021;49(11):e1063–e1143' },
    { id: 'news2', titel: 'Royal College of Physicians: National Early Warning Score (NEWS) 2, 2017' },
    { id: 's3-o2', titel: 'S3-Leitlinie Sauerstoff in der Akuttherapie beim Erwachsenen (AWMF 020-021), 2021' },
  ],

  person: {
    name: 'Frau Albrecht',
    alter: { jahre: 74 },
    geschlecht: 'w',
    biografie: ['verwitwet, lebt allein in einer Wohnung, Tochter kommt täglich', 'früher Verkäuferin in einer Bäckerei', 'macht gern Kreuzworträtsel'],
    diagnosenBekannt: ['ambulant erworbene Pneumonie rechts (Aufnahme gestern)', 'Diabetes mellitus Typ 2', 'arterielle Hypertonie'],
    medikamentePlan: ['Ampicillin/Sulbactam 3 g i. v. alle 8 h (8, 16, 24 Uhr)', 'Metformin pausiert', 'Ramipril 5 mg 1-0-0', 'Insulin nach Korrekturschema'],
    allergien: ['keine bekannt'],
    hilfsmittel: ['Brille'],
    gewichtKg: 68,
  },
  medien: {
    raum: '30b_station_zimmer_frau_sepsis_ohne_monitor',
    raumVarianten: [{ wenn: { getan: 'monitor-anlegen' }, raum: '30b_station_zimmer_frau_sepsis_sensor_an' }],
  },
  uebernahme: 'Frau Albrecht, 74, liegt seit gestern mit einer Lungenentzündung rechts bei uns, Antibiotikum i. v. läuft, peripherer Zugang links. Am Morgen war sie ganz klar und hat Rätsel gemacht. Mittags hat sie kaum gegessen. Die Vitalzeichen von heute früh waren in Ordnung. Ihre Tochter ist gerade gekommen und sitzt bei ihr.',
  startUhrzeit: '14:20',

  start: {
    // Pneumonie als Ausgangslage (Gasaustausch, Atemarbeit), Sepsis setzt den Gefäßtonus weiter herab.
    // Modell zu Beginn etwa: HF 130, RR 106/79, AF 24, SpO₂ 91 % (Test in pilot-a.test.ts); nach 30 Min. ohne Hilfe RR unter 95.
    grund: {
      gasaustausch: 0.5, atemarbeit: 1.3, gefaesstonus: 0.72, volumen: 0.9, hydratation: 0.88, temperatur: 38.8,
      orientierung: 0.6, delir: 0.3, unruhe: 0.2, angst: 0.25, schmerz: 3, blutzucker: 172,
    },
    treiber: [
      { art: 'sepsis_verlauf', tempo: 1.4 },
      { art: 'delir_trigger', ausloeser: ['infekt'] },
    ],
    bild: { haltung: 'liegt', haut: 'gerötet-heiss', mimik: 'verwirrt' },
    flags: ['zugang-liegt'],
    // Normalstation: kein Monitor ab Beginn, Werte werden selbst erhoben (Lernziel Atemfrequenz zählen)
    sichtbar: [],
    anordnungen: ['an-bedarf'],
  },

  massnahmen: [
    // Gespräch
    'ansprechen-orientierung', 'beschwerden-erfragen', 'beruhigen-zusprechen',
    // Beobachten
    'ersteindruck-abcde', 'atmung-beobachten', 'atemgeraeusche-hoeren', 'haut-beobachten', 'rekap-pruefen', 'bewusstsein-avpu',
    'schmerz-nrs', 'urin-beobachten', 'news2-berechnen',
    // Akut
    'oberkoerper-hoch', 'flachlagern-beine-hoch', 'o2-geben', 'hilfe-holen', 'rea-team-alarmieren',
    // Messen (Station: Geräte im Zimmer)
    'af-zaehlen', 'pulsoxy-anlegen', 'rr-messen', 'puls-zaehlen', 'temperatur-ohr', 'bz-messen', 'kurve-lesen', 'monitor-anlegen', 'bilanz-fuehren',
    // Versorgen
    'infusion-anhaengen', 'infusion-ueberwachen', 'abx-iv-vorziehen', 'paracetamol-geben', 'wadenwickel', 'mundpflege',
    // Melden
    'pflegefachperson-informieren', 'tochter-informieren', 'pflegebericht',
  ],
  massnahmenZusatz: [
    aus('o2-geben', { name: 'Sauerstoff über Nasenbrille, 2–4 l/min nach Zielbereich (nach Anordnung)', wirkung: [{ groesse: 'sauerstoff', delta: 3, beginnSek: 0, spitzeSek: 30, dauerSek: 'dauerhaft' }] }),
    aus('infusion-anhaengen', {
      name: 'Infusion anhängen: 500 ml Vollelektrolytlösung (nach Anordnung)', setzt: ['infusion-laeuft'],
      // Kristalloide verteilen sich, bei Kapillarleck bleibt nur ein Teil im Gefäß
      wirkung: [{ groesse: 'volumen', delta: 0.1, beginnSek: 0, spitzeSek: 900, dauerSek: 'dauerhaft' }],
    }),
    aus('iv-medikament-geben', { id: 'abx-iv-vorziehen', name: 'Antibiotikum i. v. vorziehen (Ampicillin/Sulbactam)', setzt: ['antibiotikum-vorgezogen'] }),
    aus('bedarfsmedikation-oral', {
      id: 'paracetamol-geben', name: 'Paracetamol 1 g oral bei Fieber (Bedarfsplan)',
      treiber: [{ art: 'wirkstoff', id: 'paracetamol', dosisMg: 1000, weg: 'oral' }],   // G1
    }),
  ],

  // Runde 2 (P14a): vollständige Akte nach dem Muster Lindner (Klinik: Kurve seit Aufnahme, i. v.-Antibiotikum, Bedarfsplan)
  akte: {
    aufnahmegrund: 'Aufnahme gestern 13:40 über die Notaufnahme mit ambulant erworbener Pneumonie rechts (Fieber, Husten, Atemnot seit 3 Tagen). CRB-65: 1 Punkt (Alter), stationär wegen Sauerstoffbedarf und Diabetes.',
    anamnese: [
      'Lebt allein in einer Wohnung im Erdgeschoss, versorgt sich selbst. Tochter Petra Albrecht kommt täglich vorbei.',
      'Röntgen-Thorax gestern: Infiltrat im rechten Unterlappen, kein Erguss.',
      'Bei Aufnahme wach und voll orientiert, macht im Bett Kreuzworträtsel.',
      'Raucht nicht, kein Alkohol. Keine COPD bekannt.',
    ],
    diagnosen: [
      { text: 'Ambulant erworbene Pneumonie rechter Unterlappen', icd: 'J18.1', seit: 'gestern' },
      { text: 'Diabetes mellitus Typ 2, nicht insulinpflichtig', icd: 'E11.90', seit: '2012' },
      { text: 'Arterielle Hypertonie', icd: 'I10.90', seit: '2008' },
      { text: 'Gonarthrose links', icd: 'M17.1', seit: '2019' },
    ],
    medikation: [
      { id: 'mp-ampisulb', wirkstoff: 'Ampicillin/Sulbactam', staerke: '3 g', form: 'i. v. (Kurzinfusion)', schema: '1-1-0-1', massnahme: 'abx-iv-vorziehen', zuletzt: 'heute 08:00',
        hinweis: 'Um 8, 16 und 24 Uhr. Gabe durch Pflegefachperson oder Ärztin. Vor der ersten Gabe Blutkulturen (bei Aufnahme abgenommen).', geaendertDurch: 'an-abx' },
      { id: 'mp-ramipril', wirkstoff: 'Ramipril', staerke: '5 mg', form: 'Tbl.', schema: '1-0-0-0', zuletzt: 'heute 08:00',
        hinweis: 'Vor Gabe RR messen; bei RR systolisch unter 100 nicht geben, Rücksprache.' },
      { id: 'mp-metformin', wirkstoff: 'Metformin', staerke: '1000 mg', form: 'Tbl.', schema: '0-0-0-0', hinweis: 'PAUSIERT seit Aufnahme (akute Infektion, Gefahr Laktatazidose).' },
      { id: 'mp-insulin', wirkstoff: 'Insulin glulisin', staerke: 'nach Schema', form: 's. c.', hinweis: 'Korrekturschema zu den Mahlzeiten: BZ 200–250 → 2 IE, 251–300 → 4 IE, über 300 Ärztin informieren.' },
      { id: 'mp-enoxaparin', wirkstoff: 'Enoxaparin', staerke: '40 mg', form: 's. c.', schema: '0-0-1-0', zuletzt: 'gestern 18:00', hinweis: 'Thromboseprophylaxe.' },
      { id: 'mp-paracetamol', wirkstoff: 'Paracetamol', staerke: '1 g', form: 'Tbl.', massnahme: 'paracetamol-geben', zuletzt: 'heute 11:30',
        bedarf: { indikation: 'Fieber über 38,5 °C oder Schmerzen', einzeldosis: '1 g', maxProTag: '4 Gaben', abstandH: 6 },
        hinweis: 'Höchstens 4 g am Tag. Fieber senken ändert nichts an der Ursache: Atemfrequenz, RR und Bewusstsein mitbeurteilen.' },
    ],
    vorwerte: [
      { zeit: 'gestern 14:00 (Aufnahme)', vorH: 24.3, werte: { rrSys: 142, rrDia: 84, hf: 96, af: 20, spo2: 93, temp: 38.4, bz: 188 }, kuerzel: 'NA' },
      { zeit: 'gestern 20:00', vorH: 18.3, werte: { rrSys: 136, rrDia: 80, hf: 92, af: 19, spo2: 94, temp: 38.1, bz: 164 }, kuerzel: 'TK' },
      { zeit: 'heute 06:00', vorH: 8.3, werte: { rrSys: 138, rrDia: 82, hf: 88, af: 18, spo2: 95, temp: 37.9, bz: 142, schmerz: 2 }, kuerzel: 'TK' },
      { zeit: 'heute 11:30', vorH: 2.8, werte: { temp: 38.6, schmerz: 3 }, kuerzel: 'MS' },
    ],
    pflegebericht: [
      { zeit: 'gestern 15:10', wer: 'NA', text: 'Aufnahme aus der Notaufnahme. Wach, orientiert, mobil mit Begleitung. PVK 20 G Unterarm links. Ampicillin/Sulbactam 1. Gabe 16 Uhr nach Blutkulturen. Tochter war dabei, Schweigepflichtentbindung für die Tochter unterschrieben.' },
      { zeit: 'gestern 22:30', wer: 'TK', text: 'Hustet produktiv, Sekret gelblich. Schläft mit erhöhtem Oberkörper. Trinkt etwa 800 ml, Ausfuhr nicht gemessen.' },
      { zeit: 'heute 06:20', wer: 'TK', text: 'Ruhige Nacht. Vitalzeichen stabil (NEWS2 1). Zum Frühstück einen halben Brei gegessen, Kreuzworträtsel gemacht.' },
      { zeit: 'heute 11:45', wer: 'MS', text: 'Fieber 38,6 °C, fröstelt. Paracetamol 1 g aus dem Bedarfsplan um 11:30 gegeben. Mittagessen kaum angerührt, wirkt müde. Kontrolle im Spätdienst.' },
    ],
    aerztlicheAnordnungen: [
      { zeit: 'gestern 14:30', wer: 'Dr. Brandt', text: 'Ampicillin/Sulbactam 3 g i. v. alle 8 h nach Blutkulturen. Metformin pausieren. BZ vor den Mahlzeiten, Insulin nach Korrekturschema.' },
      { zeit: 'gestern 14:30', wer: 'Dr. Brandt', text: 'Vitalzeichen und NEWS2 zweimal pro Schicht. Ab NEWS2 5 oder 3 Punkten in einem Wert sofort ärztlich informieren.' },
      { zeit: 'gestern 14:30', wer: 'Dr. Brandt', text: 'Bedarf: Paracetamol 1 g bei Fieber über 38,5 °C, Abstand 6 h, max. 4 g am Tag. Enoxaparin 40 mg s. c. abends.' },
    ],
    assessments: [
      { name: 'NEWS2', wert: '1 Punkt (heute 06:00)', datum: 'heute 06:00', hinweis: 'gestern 20:00: 3 Punkte' },
      { name: 'Sturzrisiko', wert: 'erhöht', datum: 'gestern', hinweis: 'Alter, Fieber, Infusion, neue Umgebung.' },
      { name: 'Braden-Skala', wert: '18 Punkte (geringes Risiko)', datum: 'gestern' },
      { name: 'Delir-Screening (4AT) bei Aufnahme', wert: '0 Punkte (unauffällig)', datum: 'gestern', hinweis: 'Ausgangswert für Vergleiche.' },
    ],
    labor: [
      { name: 'CRP', wert: '148', einheit: 'mg/l', norm: 'unter 5', datum: 'gestern (Aufnahme)', auffaellig: true },
      { name: 'Leukozyten', wert: '15,8', einheit: '/nl', norm: '4–10', datum: 'gestern (Aufnahme)', auffaellig: true },
      { name: 'Procalcitonin', wert: '0,8', einheit: 'ng/ml', norm: 'unter 0,1', datum: 'gestern (Aufnahme)', auffaellig: true },
      { name: 'Kreatinin', wert: '1,0', einheit: 'mg/dl', norm: '0,5–1,0', datum: 'gestern (Aufnahme)' },
      { name: 'Natrium', wert: '137', einheit: 'mmol/l', norm: '135–145', datum: 'gestern (Aufnahme)' },
      { name: 'Laktat', wert: 'nicht bestimmt', datum: '–' },
    ],
    bilanzVortag: { einfuhrMl: 1100, ausfuhrMl: 650 },
    pflegeplanung: [
      { problem: 'Beeinträchtigte Atmung bei Pneumonie, Sekretverhalt', ziel: 'SpO₂ ab 92 %, kann abhusten', massnahmen: ['Oberkörper hoch lagern', 'Atemübungen und Abhusten anleiten', 'Vitalzeichen und NEWS2 zweimal pro Schicht'] },
      { problem: 'Fieber, Flüssigkeitsbedarf erhöht', ziel: 'Trinkt mindestens 1,5 l am Tag', massnahmen: ['Getränke in Reichweite', 'Trinkmenge erfassen', 'Bedarfsmedikation nach Plan'] },
      { problem: 'Sturzgefahr (Fieber, Infusion, neue Umgebung)', ziel: 'Bleibt sturzfrei', massnahmen: ['Klingel in Reichweite', 'Bett tief', 'Begleitung zur Toilette'] },
    ],
    rechtliches: [
      'Schweigepflichtentbindung bei Aufnahme unterschrieben: Auskunft an die Tochter Petra Albrecht erlaubt.',
      'Keine Patientenverfügung, keine Vorsorgevollmacht. Volle Therapie gewünscht.',
    ],
  },

  befunde: [
    { massnahme: 'ansprechen-orientierung', varianten: [
      { text: '„Wo bin ich denn hier? Ich muss doch den Laden aufmachen.“ Sie weiß den Wochentag nicht und zupft an der Bettdecke. Heute Morgen war sie laut Kurve voll orientiert.' },
    ] },
    { massnahme: 'beschwerden-erfragen', varianten: [{ text: '„Mir ist so heiß und dann wieder kalt. Ich krieg schlecht Luft.“ Seit dem Mittag habe sie gefröstelt.' }] },
    { massnahme: 'ersteindruck-abcde', varianten: [
      { text: 'A frei. B: atmet schnell und flach, spricht in kurzen Sätzen. C: Haut warm, Hände kühl. D: schläfrig-verwirrt, auf Ansprache wach. E: Fieber, Zugang links unauffällig.' },
    ] },
    { massnahme: 'atmung-beobachten', varianten: [{ text: 'Schnelle, flache Atmung, Nasenflügel bewegen sich mit. Sie atmet {af}-mal pro Minute.', zeigt: ['af'] }] },
    { massnahme: 'af-zaehlen', varianten: [{ text: 'Atemfrequenz {af}/min.', zeigt: ['af'] }] },
    { massnahme: 'atemgeraeusche-hoeren', varianten: [{ text: 'Rechts unten feinblasige Rasselgeräusche, links vesikulär.', ton: 'atem-rg' }] },
    { massnahme: 'haut-beobachten', varianten: [{ text: 'Gesicht gerötet und heiß, Hände und Füße kühl und leicht marmoriert an den Knien.' }] },
    { massnahme: 'rekap-pruefen', varianten: [{ text: 'Rekapillarisierung am Fingernagel {rekapSek} Sekunden.', zeigt: ['rekapSek'] }] },
    { massnahme: 'bewusstsein-avpu', varianten: [{ text: 'AVPU: {avpu}, GCS {gcs}. Neu verwirrt gegenüber heute Morgen.', zeigt: ['avpu', 'gcs'] }] },
    { massnahme: 'schmerz-nrs', varianten: [{ text: 'Stechen rechts beim tiefen Einatmen, NRS 3.' }] },
    { massnahme: 'urin-beobachten', varianten: [{ text: 'Seit dem Morgen erst einmal Wasser gelassen, wenig und dunkel.' }] },
    { massnahme: 'pulsoxy-anlegen', varianten: [{ text: 'SpO₂ {spo2} %, Puls {hf}/min.', zeigt: ['spo2', 'hf'] }] },
    { massnahme: 'rr-messen', varianten: [{ text: 'RR {rrSys}/{rrDia} mmHg. Heute Morgen laut Kurve deutlich höher.', zeigt: ['rrSys', 'rrDia'] }] },
    { massnahme: 'puls-zaehlen', varianten: [{ text: 'Puls {hf}/min, regelmäßig, eher flach.', zeigt: ['hf'] }] },
    { massnahme: 'temperatur-ohr', varianten: [{ text: '{temp} °C.', zeigt: ['temp'] }] },
    { massnahme: 'bz-messen', varianten: [{ text: 'BZ {bz} mg/dl.', zeigt: ['bz'] }] },
    { massnahme: 'kurve-lesen', varianten: [{ text: 'Kurve heute 6 Uhr: RR 138/82, Puls 88, AF 18, SpO₂ 95 %, 37,9 °C, wach und orientiert. Paracetamol 1 g um 11:30 aus dem Bedarfsplan. Ein- und Ausfuhr nicht geführt. Aufnahmebogen: Auskunft an die Tochter Petra Albrecht erlaubt (gestern unterschrieben).' }] },
    { massnahme: 'monitor-anlegen', varianten: [{ text: 'Monitor läuft: HF {hf}/min, RR {rrSys}/{rrDia}, SpO₂ {spo2} %, AF {af}/min.', zeigt: ['hf', 'rrSys', 'rrDia', 'spo2', 'af'] }] },
    { massnahme: 'news2-berechnen', varianten: [
      { wenn: { nicht: { alle: [ATMUNG_ERHOBEN, SPO2_BEKANNT, RR_BEKANNT] } }, text: 'Für den NEWS2 fehlen dir noch Werte (Atemfrequenz, SpO₂, Blutdruck, Puls, Temperatur, Bewusstsein).' },
      { text: 'NEWS2 aus deinen Werten: Atemfrequenz, Sättigung, Blutdruck, Puls, Temperatur und die neue Verwirrtheit (C = 3 Punkte) ergeben einen Wert im roten Bereich. Das heißt: sofort ärztlich einschätzen lassen.' },
    ] },
    { massnahme: 'infusion-anhaengen', varianten: [{ text: '500 ml Vollelektrolytlösung laufen über den Zugang links, Tropfrate eingestellt, Einstichstelle reizlos.' }] },
    { massnahme: 'infusion-ueberwachen', varianten: [{ text: 'Infusion läuft, Einstichstelle reizlos, kein Paravasat.' }] },
  ],

  gespraech: [
    { id: 'g-luft', frage: 'Wie geht es Ihnen mit dem Atmen?', an: 'patient', kompetenzbereiche: ['I', 'II'],
      antwort: [{ text: '„Ich krieg nicht genug Luft … und mir ist so kalt.“' }], fakten: ['Atemnot seit Mittag', 'Schüttelfrost'] },
    { id: 'g-beruhigen', frage: 'Erklären, was du tust, und dass du Hilfe holst', an: 'patient', kompetenzbereiche: ['II'],
      antwort: [{ text: 'Sie nickt und hält deinen Arm fest.' }],
      wirkung: [{ groesse: 'angst', delta: -0.15, beginnSek: 0, spitzeSek: 60, dauerSek: 'dauerhaft' }] },
    // Runde 2 (P14a): Tochter (Fremdanamnese, Auskunft nur mit Schweigepflichtentbindung)
    { id: 'g-einwilligung', frage: 'Frau Albrecht fragen, ob du ihrer Tochter Auskunft geben darfst', an: 'patient', kompetenzbereiche: ['II', 'IV'],
      antwort: [{ text: '„Wer? … Die Petra? Ja … ja.“ Sie schaut dabei an dir vorbei und zupft an der Decke. Ob sie die Frage verstanden hat, bleibt unklar.' }] },
    { id: 'g-tochter-frueher', frage: 'Tochter fragen, wie ihre Mutter sonst ist und seit wann sie sich verändert hat', an: 'angehoerige', kompetenzbereiche: ['I', 'II'],
      antwort: [{ text: '„Gestern Abend hat sie noch Rätsel gemacht und mich nach den Enkeln gefragt. Heute Mittag am Telefon hat sie mich Mama genannt. So kenne ich sie gar nicht.“' }],
      fakten: ['gestern Abend klar', 'seit heute Mittag verändert', 'Tochter heißt Petra'] },
    { id: 'g-tochter-lage', frage: 'Tochter sagen, was los ist: Verdacht auf Verschlechterung, die Ärztin kommt', an: 'angehoerige', kompetenzbereiche: ['II', 'IV'],
      schweigepflicht: { erlaubtWenn: { getan: 'kurve-lesen' },
        fehlerText: 'Du hast der Tochter Auskunft gegeben, ohne zu prüfen, ob du darfst. Frau Albrecht ist gerade verwirrt und kann nicht sicher einwilligen. Im Aufnahmebogen steht, dass sie gestern eine Schweigepflichtentbindung für die Tochter unterschrieben hat: erst nachsehen, dann informieren.' },
      antwort: [
        { wenn: { flag: 'arzt-kommt' }, text: '„Danke, dass Sie es mir so offen sagen. Ich bleibe bei ihr und halte ihre Hand.“', setzt: ['tochter-informiert'] },
        { text: '„Und was passiert jetzt? Kommt denn ein Arzt?“', setzt: ['tochter-informiert'] },
      ],
      wirkung: [{ groesse: 'unruhe', delta: -0.1, beginnSek: 0, spitzeSek: 120, dauerSek: 'dauerhaft' }],
      fakten: ['Ärztin kommt', 'mögliche Verlegung auf die IMC'] },
  ],

  sbar: [
    { id: 's-verschlechtert', teil: 'S', text: 'Frau Albrecht, 74, Zimmer 3, Pneumonie rechts: seit Mittag zunehmend verwirrt und atmet schnell.', art: 'kern' },
    { id: 's-fieber', teil: 'S', text: 'Frau Albrecht hat Fieber.', art: 'hilfreich' },
    { id: 'b-pneumonie', teil: 'B', text: 'Seit gestern ambulant erworbene Pneumonie, Ampicillin/Sulbactam i. v., Diabetes Typ 2, Ramipril. Heute früh noch orientiert und stabil.', art: 'kern' },
    { id: 'b-baeckerei', teil: 'B', text: 'Sie war früher Verkäuferin in einer Bäckerei.', art: 'ablenker' },
    { id: 'a-af-hoch', teil: 'A', text: 'Atemfrequenz deutlich erhöht, flache Atmung, Rasselgeräusche rechts.', art: 'kern', bekanntWenn: ATMUNG_ERHOBEN },
    { id: 'a-spo2', teil: 'A', text: 'Sättigung unter Raumluft unter 94 %.', art: 'kern', bekanntWenn: SPO2_BEKANNT },
    { id: 'a-rr-niedrig', teil: 'A', text: 'Blutdruck deutlich unter dem Wert von heute früh, Puls schnell, Hände kühl.', art: 'kern', bekanntWenn: RR_BEKANNT },
    { id: 'a-verwirrt-neu', teil: 'A', text: 'Seit Mittag neu verwirrt, heute früh voll orientiert.', art: 'kern' },
    { id: 'a-news2', teil: 'A', text: 'NEWS2 im roten Bereich, ich vermute eine Sepsis bei Pneumonie.', art: 'kern', bekanntWenn: { getan: 'news2-berechnen' } },
    { id: 'a-alter', teil: 'A', text: 'Sie ist wohl einfach durcheinander, weil sie im Krankenhaus ist.', art: 'falsch' },
    { id: 'r-kommen', teil: 'R', text: 'Bitte kommen Sie jetzt zur Einschätzung. Brauchen wir Sauerstoff, Infusion, Blutkulturen und Laktat?', art: 'kern' },
    { id: 'r-paracetamol', teil: 'R', text: 'Darf ich ihr etwas gegen das Fieber geben?', art: 'hilfreich' },
    // Runde 2 (P14a): Übergabe an die IMC
    { id: 'r-imc-laeuft', teil: 'R', text: 'Sauerstoff über die Nasenbrille nach Zielbereich, Infusion läuft, Blutkulturen und Laktat abgenommen, Antibiotikum vorgezogen. Bitte engmaschig RR, Atemfrequenz und Bewusstsein überwachen.', art: 'hilfreich',
      bekanntWenn: { alle: [{ getan: 'o2-geben' }, { getan: 'infusion-anhaengen' }] } },
  ],

  anordnungen: [
    { id: 'an-o2', massnahme: 'o2-geben', text: 'Sauerstoff über Nasenbrille, Ziel-SpO₂ 92–96 %, zunächst 3 l/min.' },
    { id: 'an-infusion', massnahme: 'infusion-anhaengen', text: '500 ml Vollelektrolytlösung jetzt zügig über den liegenden Zugang.' },
    { id: 'an-paracetamol', massnahme: 'paracetamol-geben', text: 'Paracetamol 1 g oral bei Fieber über 38,5 °C, höchstens 4 g am Tag.' },
    { id: 'an-abx', massnahme: 'abx-iv-vorziehen', text: 'Die nächste Antibiotikagabe jetzt vorziehen.' },
    { id: 'an-bedarf', massnahme: 'paracetamol-geben', text: 'Bedarfsplan: Paracetamol 1 g oral bei Fieber über 38,5 °C, Abstand mind. 6 h, max. 4 g am Tag.' },
  ],

  arzt: {
    name: 'Stationsärztin Dr. Brandt',
    erreichbar: 'telefon',
    // Runde 2 (P14a): genau → allgemein. Ohne Blutdruck fragt die Ärztin zurück; Rückauftrag RR nach Infusionsstart.
    regeln: [
      { ...SEPSIS_REGEL, wenn: { alle: [{ gemeldet: ['a-verwirrt-neu', 'a-af-hoch'] }, { eine: [{ gemeldet: ['a-rr-niedrig'] }, { gemeldet: ['a-news2'] }, { gemeldet: ['wert:rrSys'] }] }] } },
      { id: 'r-rr-frage', wenn: { gemeldet: ['a-verwirrt-neu', 'a-af-hoch'] },
        antwort: '„Neu verwirrt und schnelle Atmung bei Pneumonie, da muss ich an eine Sepsis denken.“',
        rueckfrage: { text: '„Wie ist der Blutdruck?“', erwartet: ['wert:rrSys'], auftrag: 'af-rr' } },
      { wenn: { gemeldet: ['a-verwirrt-neu'] },
        antwort: '„Verwirrt allein sagt mir zu wenig. Wie atmet sie, wie ist der Blutdruck? Messen Sie bitte alles und rufen Sie mich gleich wieder an.“' },
      { wenn: { eine: [{ gemeldet: ['s-fieber'] }, { gemeldet: ['a-alter'] }] },
        antwort: '„Fieber bei Pneumonie ist erst mal zu erwarten. Geben Sie Paracetamol nach Plan, ich schaue nach der Aufnahme vorbei.“',
        anordnungen: ['an-paracetamol'], setzt: ['arzt-beruhigt'] },
    ],
    auftraege: [
      { id: 'af-rr', text: 'Blutdruck messen und der Stationsärztin melden', erledigt: { getan: 'rr-messen' }, meldung: ['wert:rrSys'], meldenBinnenSek: 300,
        folge: [SEPSIS_REGEL] },
      { id: 'af-rr-kontrolle', text: 'Zehn Minuten nach Infusionsstart Blutdruck messen und der Ärztin schicken', erledigt: { alle: [{ getan: 'infusion-anhaengen' }, { getan: 'rr-messen' }] },
        meldung: ['wert:rrSys'], meldenBinnenSek: 1200,
        folge: [
          { wenn: { wert: 'rrSys', vergleich: '>=', grenze: 100 }, antwort: '„Danke, das reicht fürs Erste. Infusion weiterlaufen lassen, ich bin gleich bei Ihnen.“', setzt: ['rr-rueckmeldung'] },
          { wenn: { ab: 0 }, antwort: '„Noch zu niedrig. Infusion zügig weiterlaufen lassen, Oberkörper wegen der Atmung nicht flach legen. Ich bin in zwei Minuten da.“', setzt: ['rr-rueckmeldung'] },
        ] },
    ],
  },

  ereignisse: [
    { id: 'e-imc', art: 'telefon', wann: { alle: [{ flag: 'arzt-kommt' }, { ab: 960 }] },
      text: 'Das Stationstelefon: „Hier die IMC, Pflegefachfrau Lena. Wir haben das Bett für Frau Albrecht frei. Gibst du mir bitte die Übergabe?“' },
    { id: 'e-kollegin', art: 'team', wann: { ab: 240 },
      text: 'Pflegefachmann Jonas schaut herein: „Brauchst du was? Ich bin nebenan bei der Aufnahme.“' },
    { id: 'e-aerztin-da', art: 'visite', wann: { alle: [{ flag: 'arzt-kommt' }, { getan: 'anruf-aerztin' }, { ab: 900 }] },
      text: 'Dr. Brandt ist da, nimmt zwei Paar Blutkulturen und eine venöse BGA mit Laktat ab und zieht danach das Antibiotikum selbst vor. „Wir verlegen sie zur Überwachung auf die IMC.“' },
    { id: 'e-aufstehen', art: 'patient', wann: { alle: [{ ab: 600 }, { nicht: { flag: 'arzt-kommt' } }] },
      text: 'Frau Albrecht schiebt die Decke weg: „Ich muss jetzt nach Hause, der Laden!“ Sie versucht, sich an die Bettkante zu setzen, und schwankt.',
      bild: { haltung: 'unruhig', mimik: 'verwirrt' },
      entscheidung: [
        { id: 'w-bleiben', text: 'Ruhig ansprechen, Bett tief, mit Klingel Hilfe holen und bei ihr bleiben, dann sofort die Ärztin rufen', wertung: 'gut', warum: 'Neue Unruhe ist ein weiteres Warnzeichen (Delir bei Sepsis). Sicherheit zuerst, dann melden.' },
        { id: 'w-gitter', text: 'Bettgitter hochziehen, damit sie liegen bleibt, und weiterarbeiten', wertung: 'gefaehrlich', warum: 'Ein Bettgitter ohne Einwilligung oder Genehmigung ist eine freiheitsentziehende Maßnahme und erhöht das Sturzrisiko. Die Ursache (Sepsis) bleibt unbehandelt.' },
        { id: 'w-spaeter', text: 'Sie ist halt verwirrt, gleich nach der Runde nochmal schauen', wertung: 'falsch', warum: 'Akute Verwirrtheit bei Infekt ist ein Sepsis-Zeichen (qSOFA). Warten verschenkt Zeit.' },
      ] },
  ],

  pa: {
    name: 'Praxisanleiterin Frau Weber',
    hilfen: [
      { wenn: { nicht: ATMUNG_ERHOBEN }, impuls: 'Welcher Vitalwert verändert sich bei einer Verschlechterung meist als Erstes?', tipp: 'Zähl ihre Atemfrequenz eine volle Minute lang.' },
      { wenn: { nicht: { getan: 'news2-berechnen' } }, impuls: 'Wie kannst du begründen, wie dringend das ist?', tipp: 'Rechne den NEWS2 aus und denk an die neue Verwirrtheit.' },
      { wenn: { nicht: { flag: 'arzt-kommt' } }, impuls: 'Was braucht die Ärztin von dir, damit sie sofort kommt?', tipp: 'Verwirrtheit, Atemfrequenz und Blutdruck gehören zusammen in deine Meldung.' },
      { wenn: { auftrag: 'af-rr', status: 'offen' }, impuls: 'Was wollte die Ärztin noch von dir wissen?', tipp: 'Blutdruck messen und ihr den Wert schicken.' },
      { wenn: { alle: [{ auftrag: 'af-rr-kontrolle', status: 'offen' }, { nicht: { auftrag: 'af-rr-kontrolle', status: 'gemeldet' } }] }, impuls: 'Hat dir die Ärztin noch etwas aufgetragen?', tipp: 'Zehn Minuten nach Infusionsstart den Blutdruck messen und über den Messenger schicken.' },
      { impuls: 'Wie geht es Frau Albrecht jetzt, und was hast du schon dokumentiert?', tipp: 'Bilanz beginnen, Werte engmaschig kontrollieren, Pflegebericht schreiben.' },
    ],
  },
  team: { kollegin: 'Pflegefachmann Jonas (Schichtleitung)', weitere: { angehoerige: 'Tochter Petra Albrecht', 'aufnehmende-station': 'IMC, Pflegefachfrau Lena' } },

  bewertung: {
    pflicht: [
      { id: 'p-atmung', text: 'Atemfrequenz gezählt bzw. Atmung beobachtet', gewicht: 3, kompetenzbereiche: ['I'], erfuellt: ATMUNG_ERHOBEN,
        warum: 'Die Atemfrequenz ist der früheste und am häufigsten übersehene Warnwert.' },
      { id: 'p-vitalzeichen', text: 'SpO₂, Blutdruck und Temperatur erhoben', gewicht: 2, kompetenzbereiche: ['I'],
        erfuellt: { alle: [SPO2_BEKANNT, RR_BEKANNT, { getan: 'temperatur-ohr' }] }, warum: 'Ohne vollständige Werte keine begründete Einschätzung.' },
      { id: 'p-bewusstsein', text: 'Neue Verwirrtheit erkannt (Orientierung oder AVPU)', gewicht: 2, kompetenzbereiche: ['I'],
        erfuellt: { eine: [{ getan: 'ansprechen-orientierung' }, { getan: 'bewusstsein-avpu' }] }, warum: 'Neue Verwirrtheit zählt im NEWS2 drei Punkte und ist ein Sepsis-Zeichen.' },
      { id: 'p-news2', text: 'Frühwarnwert NEWS2 berechnet', gewicht: 1, kompetenzbereiche: ['I', 'V'], erfuellt: { getan: 'news2-berechnen' },
        warum: 'Der Score macht die Dringlichkeit für alle nachvollziehbar.' },
      { id: 'p-arzt-sbar', text: 'Ärztin rechtzeitig mit vollständiger SBAR informiert', gewicht: 3, kompetenzbereiche: ['II', 'III'],
        erfuellt: { alle: [{ flag: 'arzt-kommt' }, { getan: 'anruf-aerztin', bis: 900 }] }, warum: 'Bei Sepsis zählt jede Stunde bis zum Antibiotikum und zur Kreislauftherapie.' },
      { id: 'p-rueckgelesen', text: 'Anordnungen O₂ und Infusion rückgelesen', gewicht: 2, kompetenzbereiche: ['III'],
        erfuellt: { alle: [{ anordnung: 'an-o2', rueckgelesen: true }, { anordnung: 'an-infusion', rueckgelesen: true }] }, warum: 'Closed Loop verhindert Verwechslungen bei Menge und Ziel.' },
      { id: 'p-o2', text: 'Sauerstoff nach Zielbereich gegeben', gewicht: 2, kompetenzbereiche: ['I', 'V'], erfuellt: { getan: 'o2-geben' },
        warum: 'Hypoxie verstärkt Verwirrtheit und Organschaden; Ziel 92–96 %.' },
      { id: 'p-infusion', text: 'Infusion angehängt (mit Praxisanleitung)', gewicht: 2, kompetenzbereiche: ['I', 'III'], erfuellt: { getan: 'infusion-anhaengen' },
        warum: 'Volumen stabilisiert den Kreislauf bei beginnender Sepsis.' },
      { id: 'p-lagerung', text: 'Oberkörper hoch gelagert', gewicht: 1, kompetenzbereiche: ['I'], erfuellt: { getan: 'oberkoerper-hoch' },
        warum: 'Erleichtert die Atmung bei Pneumonie.' },
      { id: 'p-team', text: 'Schichtleitung informiert', gewicht: 1, kompetenzbereiche: ['III'], erfuellt: { getan: 'pflegefachperson-informieren' },
        warum: 'Die verantwortliche Pflegefachperson muss von der Verschlechterung wissen.' },
      { id: 'p-rueckauftrag', text: 'Rückauftrag der Ärztin erledigt und gemeldet (RR nach Infusionsstart)', gewicht: 2, kompetenzbereiche: ['II', 'III'],
        erfuellt: { auftrag: 'af-rr-kontrolle', status: 'gemeldet' }, warum: 'Die Ärztin plant mit deiner Kontrolle, ob das Volumen wirkt (Closed Loop).' },
      { id: 'p-tochter', text: 'Tochter einbezogen, Auskunft erst nach Blick auf die Schweigepflichtentbindung', gewicht: 1, kompetenzbereiche: ['II', 'IV'],
        erfuellt: { alle: [{ getan: 'frage:g-tochter-lage' }, { getan: 'kurve-lesen' }] },
        warum: 'Die Tochter kennt den Normalzustand und braucht Information. Frau Albrecht kann gerade nicht sicher einwilligen, die unterschriebene Entbindung von gestern gilt.' },
      { id: 'p-uebergabe-imc', text: 'Strukturierte Übergabe an die IMC (Lage und laufende Therapie)', gewicht: 2, kompetenzbereiche: ['II', 'III'],
        erfuellt: { alle: [{ gesagt: 's-verschlechtert', an: 'aufnehmende-station' }, { gesagt: 'r-imc-laeuft', an: 'aufnehmende-station' }] },
        warum: 'Bei der Verlegung gehen sonst Sauerstoff, Infusion und Zeitpunkt der Antibiotikagabe verloren.' },
      { id: 'p-doku', text: 'Pflegebericht mit Werten und mündlichen Anordnungen geschrieben', gewicht: 1, kompetenzbereiche: ['I', 'IV'],
        erfuellt: { alle: [{ getan: 'pflegebericht' }, { dokumentiert: 'anordnung:an-o2' }, { dokumentiert: 'wert:rrSys' }] },
        warum: 'Mündliche Anordnungen (Sauerstoff, Infusion) und die Werte dazu müssen mit Uhrzeit nachvollziehbar sein.' },
    ],
    fehler: [
      { id: 'f-flach', text: 'Bei Atemnot flach gelagert, Beine hoch', schwere: 'mittel', kompetenzbereiche: ['I', 'V'], wenn: { getan: 'flachlagern-beine-hoch' },
        folge: { text: 'Frau Albrecht ringt nach Luft und wird unruhig.', wirkung: [{ groesse: 'atemarbeit', delta: 0.3, beginnSek: 0, spitzeSek: 30, dauerSek: 600 }] },
        warum: 'Flachlage verschlechtert die Atmung bei Pneumonie. Sie hilft nur beim Kollaps ohne Atemnot.' },
      { id: 'f-wickel', text: 'Wadenwickel trotz kühler, marmorierter Beine', schwere: 'leicht', kompetenzbereiche: ['I', 'V'], wenn: { getan: 'wadenwickel' },
        folge: { text: 'Sie fängt an zu zittern.' },
        warum: 'Bei Zentralisation (kalte Extremitäten, Schüttelfrost) sind Wadenwickel nicht angezeigt.' },
      { id: 'f-nur-fieber', text: 'Nur „Fieber“ gemeldet, Warnzeichen verschwiegen', schwere: 'mittel', kompetenzbereiche: ['II', 'III'], wenn: { flag: 'arzt-beruhigt' },
        warum: 'Die Ärztin entscheidet nach dem, was sie hört. Ohne Atemfrequenz, Blutdruck und Verwirrtheit erkennt sie die Sepsis nicht.' },
      { id: 'f-spaet', text: 'Bis 15 Minuten nach Übernahme niemanden informiert', schwere: 'schwer', kompetenzbereiche: ['I', 'III'],
        wenn: { alle: [{ ab: 900 }, { nicht: { flag: 'arzt-kommt' } }] },
        warum: 'Neue Verwirrtheit, schnelle Atmung und sinkender Blutdruck bei Infekt verlangen eine sofortige ärztliche Einschätzung.' },
    ],
    ende: [
      { wenn: { alle: [{ flag: 'arzt-kommt' }, { ab: 900 }, { getan: 'infusion-anhaengen' }, { getan: 'pflegebericht' }, { flag: 'rr-rueckmeldung' }, { gesagt: 'r-imc-laeuft', an: 'aufnehmende-station' }] },
        text: 'Dr. Brandt hat Blutkulturen und Laktat abgenommen und das Antibiotikum vorgezogen. Frau Albrecht wird mit Sauerstoff und Infusion zur Überwachung auf die IMC verlegt.', ausgang: 'verlegt' },
      { wenn: { ab: 2400 }, text: 'Frau Albrecht ist kaum noch erweckbar, der Blutdruck fällt weiter. Das Notfallteam übernimmt.', ausgang: 'verschlechtert' },
    ],
  },

  pflegebedarf: {
    probleme: [
      { id: 'pb-atmung', text: 'Beeinträchtigte Atmung (Pneumonie, erhöhte Atemarbeit, Sauerstoffbedarf)', richtig: true, prioritaet: 1, warum: 'Unmittelbar lebenswichtig, bestimmt O₂-Gabe und Lagerung.' },
      { id: 'pb-kreislauf', text: 'Kreislaufinstabilität bei Verdacht auf Sepsis', richtig: true, prioritaet: 1, warum: 'Sinkender Blutdruck und kühle Haut zeigen eine Minderdurchblutung.' },
      { id: 'pb-delir', text: 'Akute Verwirrtheit (Delir bei Infekt), Sturz- und Selbstgefährdung', richtig: true, prioritaet: 2, warum: 'Sie will aufstehen und schwankt; Ursache behandeln, Sicherheit schaffen.' },
      { id: 'pb-fluessigkeit', text: 'Flüssigkeitsdefizit (Fieber, wenig getrunken, wenig Urin)', richtig: true, prioritaet: 2, warum: 'Bilanz führen, Trinken und Infusion nach Anordnung.' },
      { id: 'pb-obstipation', text: 'Obstipation', richtig: false, warum: 'Dafür gibt es keinen Hinweis.' },
      { id: 'pb-wissen', text: 'Wissensdefizit zur Inhalationstechnik', richtig: false, warum: 'Hat mit der akuten Lage nichts zu tun.' },
    ],
    ziele: [
      { id: 'z-spo2', text: 'SpO₂ liegt unter Sauerstoff zwischen 92 und 96 %.', passtZu: ['pb-atmung'], richtig: true },
      { id: 'z-kreislauf', text: 'Der Blutdruck stabilisiert sich, sie scheidet mindestens 0,5 ml/kg/h Urin aus.', passtZu: ['pb-kreislauf', 'pb-fluessigkeit'], richtig: true },
      { id: 'z-sicher', text: 'Frau Albrecht stürzt nicht und ist innerhalb von 48 h wieder orientiert.', passtZu: ['pb-delir'], richtig: true },
      { id: 'z-gitter', text: 'Frau Albrecht bleibt mit Bettgitter im Bett.', passtZu: ['pb-delir'], richtig: false },
    ],
  },

  leitfaden: [
    { titel: 'Was im Körper passiert', text: 'Bei einer Sepsis reagiert der Körper auf eine Infektion so stark, dass Organe Schaden nehmen. Die Gefäße werden weit und durchlässig, der Blutdruck sinkt, das Gehirn wird schlechter versorgt (Verwirrtheit), die Atmung wird schnell. Fieber allein ist nicht das Problem, die Kombination der Zeichen ist es.', quellen: ['s3-sepsis', 'ssc-2021'] },
    { titel: 'Früh erkennen', text: 'Atemfrequenz ab 22/min, neue Verwirrtheit und ein systolischer Blutdruck bis 100 mmHg (qSOFA) sind Warnzeichen. NEWS2 fasst alle Vitalzeichen zusammen; ab 7 Punkten (oder 3 Punkten in einem einzigen Wert) ist eine sofortige ärztliche Einschätzung nötig.', quellen: ['news2', 's3-sepsis'] },
    { titel: 'Melden mit SBAR', text: 'Die Ärztin reagiert auf das, was sie hört. „Hat Fieber“ führt zu Paracetamol. „Neu verwirrt, atmet schnell, Blutdruck deutlich niedriger als heute früh, NEWS2 rot“ führt dazu, dass sie sofort kommt.', quellen: ['ssc-2021'] },
    { titel: 'Sauerstoff mit Ziel', text: 'Sauerstoff ist ein Medikament und braucht eine Anordnung mit Zielbereich. Ohne COPD gilt meist 92–96 %. Zu viel Sauerstoff schadet ebenfalls.', quellen: ['s3-o2'] },
    { titel: 'Deine Grenzen', text: 'Infusion ohne Zusatz anhängen: im 1. Drittel nicht, im 2. und 3. Drittel mit Anleitung. Ein i. v.-Antibiotikum gibt eine Pflegefachperson oder die Ärztin. Blutkulturen werden vor der nächsten Antibiotikagabe abgenommen.', quellen: ['s3-sepsis'] },
  ],

  pruefwege: {
    muster: [
      { art: 'massnahme', id: 'ansprechen-orientierung' },
      { art: 'massnahme', id: 'ersteindruck-abcde' },
      { art: 'frage', id: 'g-tochter-frueher' },
      { art: 'massnahme', id: 'af-zaehlen' },
      { art: 'massnahme', id: 'pulsoxy-anlegen' },
      { art: 'massnahme', id: 'rr-messen' },
      { art: 'massnahme', id: 'temperatur-ohr' },
      { art: 'massnahme', id: 'oberkoerper-hoch' },
      { art: 'massnahme', id: 'news2-berechnen' },
      { art: 'anruf', an: 'aerztin', sbar: ['s-verschlechtert', 'b-pneumonie', 'a-af-hoch', 'a-spo2', 'a-rr-niedrig', 'a-verwirrt-neu', 'a-news2', 'r-kommen'] },
      { art: 'rueckmelden', anordnung: 'an-o2', rueckgelesen: true },
      { art: 'rueckmelden', anordnung: 'an-infusion', rueckgelesen: true },
      { art: 'massnahme', id: 'o2-geben' },
      { art: 'massnahme', id: 'infusion-anhaengen' },
      { art: 'massnahme', id: 'monitor-anlegen' },
      { art: 'massnahme', id: 'pflegefachperson-informieren' },
      { art: 'massnahme', id: 'kurve-lesen' },
      { art: 'frage', id: 'g-tochter-lage' },
      { art: 'massnahme', id: 'bilanz-fuehren' },
      { art: 'warten', sek: 180 },
      { art: 'massnahme', id: 'rr-messen' },
      { art: 'nachricht', an: 'aerztin', kanal: 'messenger', bausteine: ['wert:rrSys'] },
      { art: 'dokumentieren', bausteine: ['wert:af', 'wert:spo2', 'wert:rrSys', 'wert:temp', 'a-verwirrt-neu', 'a-news2', 'anordnung:an-o2', 'anordnung:an-infusion'] },
      { art: 'warten', sek: 240 },
      { art: 'nachricht', an: 'aufnehmende-station', kanal: 'telefon', bausteine: ['s-verschlechtert', 'b-pneumonie', 'a-verwirrt-neu', 'a-news2', 'wert:rrSys', 'r-imc-laeuft'] },
      { art: 'abschluss', probleme: ['pb-atmung', 'pb-kreislauf', 'pb-delir', 'pb-fluessigkeit'], ziele: ['z-spo2', 'z-kreislauf', 'z-sicher'],
        sbar: ['s-verschlechtert', 'b-pneumonie', 'a-af-hoch', 'a-spo2', 'a-rr-niedrig', 'a-verwirrt-neu', 'a-news2'] },
    ],
    unterlassung: { bisSek: 1800, erwartet: { wert: 'rrSys', vergleich: '<', grenze: 95 } },
    grenze: { rolle: 1, events: [{ art: 'massnahme', id: 'abx-iv-vorziehen' }], erwartet: 'pa-eingriff' },
  },
};
