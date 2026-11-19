// Erster Spur-B-Fall · Schockraum: septischer Schock bei Harnwegsinfekt mit Dauerkatheter (Entwurf, fachlich UNGEPRÜFT)
// Paket P1b. Rolle wählbar: Azubi 3. Drittel oder Pflegefachperson (E11). Ärztliche Handlungen bleiben ärztlich.
// Inhalte fiktiv/didaktisch. Werte entstehen im Modell (Basis P1 + Spur-B-Hülle), nicht als feste Zahlen.

import { KATALOG } from '../katalog';
import type { ArztRegel, Bedingung, FallV2, MassnahmeDefinition } from '../typen';

const VOLUMEN_GEGEBEN: Bedingung = { getan: 'infusion-anhaengen' };
const PENICILLIN_GEGEBEN: Bedingung = { eine: [{ getan: 'piptaz-iv' }, { getan: 'piptaz-richten' }] };
const ANTIBIOTIKUM: Bedingung = { eine: [{ getan: 'meropenem-iv' }, { getan: 'meropenem-richten' }, PENICILLIN_GEGEBEN] };

/** Fallspezifische Fassung einer Katalog-Maßnahme: Befugnis und Lehrplan-Beleg bleiben aus P3. */
const aus = (id: string, mehr: Partial<MassnahmeDefinition>): MassnahmeDefinition => ({ ...KATALOG[id]!, ...mehr });
const EINFUHR_100: MassnahmeDefinition['wirkung'] = [{ groesse: 'einfuhrMl', delta: 100, beginnSek: 0, spitzeSek: 900, dauerSek: 'dauerhaft' }];

// Runde 2 (P14a): Schock-Antwort auch als Folge der Laktat-Rückmeldung
const SCHOCK_REGEL: ArztRegel = {
  id: 'r-schock', wenn: { alle: [{ gemeldet: ['a-map-nach-volumen'] }, VOLUMEN_GEGEBEN] },
  antwort: '„Septischer Schock. Wir starten Noradrenalin, Ziel MAP über 65. Ich lege eine Arterie, bereiten Sie bitte alles vor. Die Intensiv ist informiert. Sagen Sie mir den MAP, sobald die Arterie genullt ist.“',
  anordnungen: ['an-noradrenalin', 'an-na-titrieren', 'an-arterie', 'an-intensiv'], setzt: ['schock-gemeldet'], auftraege: ['af-map'],
};
const LAKTAT_AUFTRAG = ' Sagen Sie mir das Laktat, sobald die BGA durch ist.';

export const SR_SEPTISCHER_SCHOCK: FallV2 = {
  schema: 2,
  id: 'sr-septischer-schock',
  version: '0.2.0',
  spur: 'B',
  setting: 'schockraum',
  altersgruppe: 'hochbetagt',
  titel: '„Seit heute Mittag nicht mehr er selbst“',
  kurz: 'Schockraum, Nacht: 81-Jähriger aus dem Pflegeheim mit Fieber, Verwirrtheit und niedrigem Blutdruck.',
  rahmen: 'Du arbeitest im Nachtdienst in der Notaufnahme. Der Rettungsdienst bringt einen Bewohner aus dem Pflegeheim in den Schockraum.',
  lernziele: [
    'Sepsis früh erkennen (qSOFA, Laktat) und der Ärztin strukturiert mit SBAR melden.',
    'Die erste Stunde der Sepsis-Versorgung im Team umsetzen: Blutkulturen vor dem Antibiotikum, Volumen, Laktat.',
    'Eine Anordnung trotz dokumentierter Allergie erkennen und hinterfragen (Remonstration).',
    'Die Laufrate eines Noradrenalin-Perfusors sicher berechnen und nach Zielvorgabe anpassen.',
    'Arterielle Druckmessung führen: Nullabgleich, gedämpfte Kurve erkennen.',
    'Ausscheidung über den Dauerkatheter stündlich messen und die Bilanz führen.',
  ],
  geeignet: { rollen: [3, 'pflegefachperson'], stufen: [2, 3] },
  dauerMin: [12, 18],
  freigabe: {
    status: 'entwurf',
    pruefpunkte: [
      'Ablauf gegen Surviving Sepsis Campaign 2021 und S3-Leitlinie Sepsis prüfen (Reihenfolge Blutkulturen/Antibiotikum, Volumenmenge, MAP-Ziel)',
      'Befugnisse (Blutkulturen delegiert, Infusion, Noradrenalin-Perfusor: 3. Drittel nur mit Anleitung, Pflegefachperson nach Anordnung) gegen BW-Lehrplan 3BFP belegen (P3)',
      'Remonstration Penicillinallergie: Ersatz Meropenem und Beobachtung auf Kreuzreaktion fachlich prüfen',
      'Laufratenrechnung Noradrenalin (5 mg/50 ml, 0,1 µg/kg/min, 75 kg → 4,5 ml/h) und Titrationsschritte prüfen',
      'Verlauf von MAP, Laktat und Urinmenge im Lernmodell plausibel?',
    ],
  },
  quellen: [
    { id: 'ssc-2021', titel: 'Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock 2021', fundstelle: 'Evans L. et al., Crit Care Med 2021;49(11):e1063–e1143' },
    { id: 'sepsis-3', titel: 'Third International Consensus Definitions for Sepsis and Septic Shock (Sepsis-3)', fundstelle: 'Singer M. et al., JAMA 2016;315(8):801–810' },
    { id: 's3-sepsis', titel: 'S3-Leitlinie Sepsis – Prävention, Diagnose, Therapie und Nachsorge (AWMF 079-001), Fassung 2018', fundstelle: 'Aktualisierung in Arbeit, Fassung prüfen' },
  ],

  person: {
    name: 'Herr Kranz',
    alter: { jahre: 81 },
    geschlecht: 'm',
    biografie: ['lebt seit zwei Jahren im Pflegeheim', 'früher Schreiner, erzählt gern von seiner Werkstatt', 'Sohn wohnt im Ort'],
    diagnosenBekannt: ['Prostatahyperplasie mit transurethralem Dauerkatheter', 'Diabetes mellitus Typ 2', 'arterielle Hypertonie', 'leichte Demenz'],
    medikamentePlan: ['Metformin 1000 mg 1-0-1', 'Ramipril 5 mg 1-0-0', 'Tamsulosin 0,4 mg 0-0-1'],
    allergien: ['Penicillin (2019 Hautausschlag und Luftnot, im Notfallprotokoll vermerkt)'],
    hilfsmittel: ['Rollator', 'Hörgerät links'],
    gewichtKg: 75,
  },
  medien: {
    raum: '18_notaufnahme_schockraum_nacht',
    raumVarianten: [{ wenn: { getan: 'monitor-anlegen' }, raum: '18_notaufnahme_schockraum_nacht_sensor_an' }],
  },
  uebernahme: 'Rettungsdienst bringt Herrn Kranz, 81, aus dem Pflegeheim. Seit dem Mittag zunehmend verwirrt, Fieber, kaum getrunken. Dauerkatheter, Urin trüb. Im Wagen Blutdruck um 90 systolisch, ein Zugang links, 500 ml Vollelektrolyt sind gelaufen.',
  startUhrzeit: '23:40',

  start: {
    grund: {
      volumen: 0.8, gefaesstonus: 0.5, temperatur: 39.2, vigilanz: 0.72, orientierung: 0.45, delir: 0.35, unruhe: 0.25,
      gasaustausch: 0.9, angst: 0.4, schmerz: 3, blutzucker: 168, hydratation: 0.85,
      laktat: 4.1, kalium: 4.6, einfuhrMl: 0, ausfuhrMl: 0, sedierung: 0,
    },
    treiber: [
      // fulminanter Verlauf: im Fall auf Minuten verdichtet (tempo 2 = Gefäßtonus −0,5/h, Kapillarleck)
      { art: 'sepsis_verlauf', tempo: 2 },
      { art: 'delir_trigger', ausloeser: ['infekt'] },
    ],
    module: { bilanz: true },
    bild: { haltung: 'liegt', haut: 'gerötet-heiss', mimik: 'verwirrt', geraete: ['venenzugang'] },
    // Der Rettungsdienst hat das Pulsoxymeter noch am Finger (Transportmonitor): HF und SpO₂ laufen, RR/AF erst am Schockraum-Monitor
    sichtbar: ['hf', 'spo2'],
    flags: ['zugang-liegt'],
    anordnungen: ['an-o2-standard'],
  },

  massnahmen: [
    // Gespräch & Beobachten
    'ansprechen-orientierung', 'beruhigen-zusprechen', 'ersteindruck-abcde', 'qsofa-erheben', 'rekap-pruefen', 'haut-beobachten',
    'bewusstsein-avpu', 'schmerz-nrs', 'urin-beobachten',
    // Akut & Sicherheit
    'o2-geben', 'flachlagern-beine-hoch', 'oberkoerper-hoch',
    // Messen & Diagnostik
    'monitor-anlegen', 'temperatur-ohr', 'bz-messen', 'ekg-12-kanal', 'etco2-anschliessen', 'blutkulturen-abnehmen',
    'bga-venoes-abnehmen', 'bga-abnehmen-arteriell', 'bga-messen-lesen', 'arterie-nullabgleich', 'art-system-pruefen', 'bilanz-fuehren',
    // Versorgen
    'infusion-anhaengen', 'meropenem-richten', 'meropenem-iv', 'piptaz-richten', 'piptaz-iv', 'paracetamol-iv',
    'perfusor-vorbereiten', 'katecholamin-anpassen', 'katecholamin-schenkel-spuelen', 'arterie-assistieren',
    // Melden
    'uebergabe-rd-annehmen', 'verlegung-uebergabe', 'pflegebericht',
  ],
  // Fallspezifische Fassungen (Menge, Wirkstoff, Modul); Befugnisse bleiben die des Katalogs (P3)
  massnahmenZusatz: [
    aus('o2-geben', { name: 'O₂ über Maske mit Reservoir, 10 l/min (Notfallstandard)', wirkung: [{ groesse: 'sauerstoff', delta: 10, beginnSek: 0, spitzeSek: 30, dauerSek: 'dauerhaft' }] }),
    aus('infusion-anhaengen', {
      name: 'Infusion: 1000 ml balancierte Vollelektrolytlösung rasch', setzt: ['infusion-laeuft', 'volumen'],
      wirkung: [
        // Kristalloide verteilen sich, bei Kapillarleck bleibt nur ein Teil im Gefäß (etwa ein Drittel)
        { groesse: 'volumen', delta: 0.07, beginnSek: 0, spitzeSek: 900, dauerSek: 'dauerhaft' },
        { groesse: 'einfuhrMl', delta: 1000, beginnSek: 0, spitzeSek: 900, dauerSek: 'dauerhaft' },
      ],
    }),
    aus('iv-medikament-vorbereiten', { id: 'meropenem-richten', name: 'Meropenem 1 g richten, mit der Praxisanleitung als Kurzinfusion anhängen', setzt: ['antibiotikum'], wirkung: EINFUHR_100 }),
    aus('iv-medikament-geben', { id: 'meropenem-iv', name: 'Meropenem 1 g i. v. als Kurzinfusion geben', setzt: ['antibiotikum'], wirkung: EINFUHR_100 }),
    aus('iv-medikament-vorbereiten', { id: 'piptaz-richten', name: 'Piperacillin/Tazobactam 4,5 g richten, mit der Praxisanleitung anhängen', setzt: ['antibiotikum'] }),
    aus('iv-medikament-geben', { id: 'piptaz-iv', name: 'Piperacillin/Tazobactam 4,5 g i. v. geben', setzt: ['antibiotikum'] }),
    aus('iv-medikament-geben', { id: 'paracetamol-iv', name: 'Paracetamol 1 g i. v. als Kurzinfusion', wirkung: EINFUHR_100 }),
    aus('perfusor-vorbereiten', {
      name: 'Noradrenalin-Perfusor (5 mg/50 ml) vorbereiten und anschließen',
      // Laufrate kommt aus der Entscheidung (rechnen); bis dahin 0 ml/h. Nur einmal, sonst stünde die laufende Pumpe wieder auf 0.
      voraussetzung: { nicht: { getan: 'perfusor-vorbereiten' } },
      modul: { perfusor: { id: 'na', wirkstoff: 'noradrenalin', konzentration: '5 mg/50 ml', mgProMl: 0.1, mlProH: 0 } },
    }),
    aus('katecholamin-anpassen', { name: 'Noradrenalin um 1 ml/h steigern (nach Zielvorgabe)', modul: { perfusor: { id: 'na', mlProHDelta: 1 } }, wirkung: [] }),
    aus('verlegung-uebergabe', { name: 'Verlegung: strukturierte Übergabe an die Intensivstation', voraussetzung: { anordnung: 'an-intensiv' }, setzt: ['auf-intensiv'] }),
  ],

  // Runde 2 (P14a): Akte aus Überleitungsbogen des Pflegeheims, Notfallprotokoll des Rettungsdienstes und Vorbefunden
  akte: {
    aufnahmegrund: 'Einweisung durch den Notarzt aus dem Pflegeheim: Fieber, akute Verwirrtheit, Hypotonie bei transurethralem Dauerkatheter. Verdacht auf Urosepsis.',
    anamnese: [
      'Lebt seit zwei Jahren im Pflegeheim (Pflegegrad 3), geht mit Rollator, leichte Demenz, sonst zeitlich unsicher, örtlich orientiert.',
      'Transurethraler Dauerkatheter seit 5 Wochen wegen Harnverhalt bei Prostatahyperplasie, Wechsel geplant in einer Woche.',
      'Heim: seit Mittag zunehmend verwirrt, Fieber 38,4 °C um 14 Uhr, abends 39 °C, kaum getrunken. Hausarzt nicht erreicht, Notruf 22:40.',
      'Rettungsdienst: 500 ml Vollelektrolyt über Zugang 18 G links gelaufen, O₂ 2 l/min über Nasenbrille.',
    ],
    diagnosen: [
      { text: 'Benigne Prostatahyperplasie mit Harnverhalt, Dauerkatheter', icd: 'N40', seit: '2025' },
      { text: 'Diabetes mellitus Typ 2', icd: 'E11.90', seit: '2010' },
      { text: 'Arterielle Hypertonie', icd: 'I10.90', seit: '2006' },
      { text: 'Leichte Alzheimer-Demenz', icd: 'G30.1', seit: '2023' },
    ],
    medikation: [
      { id: 'mp-metformin', wirkstoff: 'Metformin', staerke: '1000 mg', form: 'Tbl.', schema: '1-0-1-0', zuletzt: 'heute 18:00',
        hinweis: 'Bei Sepsis, Schock oder Kontrastmittel pausieren (Laktatazidose), ärztlich entscheiden.' },
      { id: 'mp-ramipril', wirkstoff: 'Ramipril', staerke: '5 mg', form: 'Tbl.', schema: '1-0-0-0', zuletzt: 'heute 08:00', hinweis: 'Bei Hypotonie nicht geben.' },
      { id: 'mp-tamsulosin', wirkstoff: 'Tamsulosin', staerke: '0,4 mg', form: 'Kps.', schema: '0-0-1-0', zuletzt: 'gestern 20:00', hinweis: 'Heute Abend im Heim nicht mehr gegeben.' },
      { id: 'mp-paracetamol', wirkstoff: 'Paracetamol', staerke: '500 mg', form: 'Tbl. (Heim)', massnahme: 'paracetamol-iv', zuletzt: 'heute 21:00',
        bedarf: { indikation: 'Fieber über 38,5 °C oder Schmerzen', einzeldosis: '500 mg', maxProTag: '4 Gaben', abstandH: 6 },
        hinweis: 'Im Heim um 21 Uhr gegeben (Überleitungsbogen). Vor einer weiteren Gabe Abstand beachten.' },
    ],
    vorwerte: [
      { zeit: 'vor 3 Tagen (Heim)', vorH: 72, werte: { rrSys: 138, rrDia: 76, hf: 78, temp: 36.8, bz: 142 }, kuerzel: 'Heim' },
      { zeit: 'heute 14:00 (Heim)', vorH: 9.7, werte: { rrSys: 124, rrDia: 70, hf: 96, temp: 38.4 }, kuerzel: 'Heim' },
      { zeit: 'heute 22:50 (Rettungsdienst)', vorH: 0.8, werte: { rrSys: 92, rrDia: 50, hf: 118, af: 26, spo2: 92, temp: 39.0, bz: 176 }, kuerzel: 'RD' },
    ],
    pflegebericht: [
      { zeit: 'heute 14:10', wer: 'Heim, Pflegefachkraft', text: 'Bewohner wirkt verlangsamt, verwechselt die Pflegekräfte. 38,4 °C. Urin im Beutel trüb und flockig. Hausarztpraxis angerufen, Rückruf zugesagt.' },
      { zeit: 'heute 21:00', wer: 'Heim, Nachtdienst', text: '39 °C, fröstelt. Paracetamol 500 mg aus dem Bedarf gegeben. Trinkt nur wenige Schlucke. Hausarzt nicht erreicht.' },
      { zeit: 'heute 22:40', wer: 'Heim, Nachtdienst', text: 'Kaum noch ansprechbar, RR 90/55. Notruf 112. Sohn informiert (Vorsorgevollmacht), er kommt in die Klinik.' },
      { zeit: 'heute 23:30', wer: 'Rettungsdienst', text: 'Notfallprotokoll: GCS 13, RR 92/50, HF 118, AF 26, SpO₂ 92 % unter Raumluft, 39,0 °C, BZ 176. 500 ml VEL i. v. Penicillinallergie laut Notfallbogen.' },
    ],
    aerztlicheAnordnungen: [
      { zeit: 'heute 23:40', wer: 'Notaufnahme (Standard)', text: 'Schockraum-Standard: Monitoring, O₂ bei SpO₂ unter 94 %, Ziel 94–98 %. Ärztin wird gerufen.' },
      { zeit: 'vor 5 Wochen', wer: 'Urologie', text: 'Transurethraler Dauerkatheter 14 Ch, Wechsel alle 6 Wochen; Tamsulosin weiter.' },
    ],
    assessments: [
      { name: 'Barthel-Index (Heim)', wert: '45 von 100', datum: 'vor 2 Monaten' },
      { name: 'Braden-Skala (Heim)', wert: '14 Punkte (mittleres Risiko)', datum: 'vor 2 Monaten', hinweis: 'Steiß heute laut Heim gerötet.' },
      { name: 'Sturzrisiko (Heim)', wert: 'hoch', datum: 'vor 2 Monaten', hinweis: 'Demenz, Rollator, Tamsulosin.' },
    ],
    labor: [
      { name: 'Urin-Stix (Heim)', wert: 'Leukozyten +++, Nitrit positiv', datum: 'heute 14:30', auffaellig: true },
      { name: 'Kreatinin', wert: '1,3', einheit: 'mg/dl', norm: '0,7–1,2', datum: 'vor 4 Wochen (Hausarzt)', auffaellig: true },
      { name: 'HbA1c', wert: '7,4', einheit: '%', norm: 'unter 6,5', datum: 'vor 4 Wochen (Hausarzt)', auffaellig: true },
      { name: 'Kalium', wert: '4,5', einheit: 'mmol/l', norm: '3,5–5,0', datum: 'vor 4 Wochen (Hausarzt)' },
    ],
    pflegeplanung: [
      { problem: 'Infektionsgefahr durch Dauerkatheter', ziel: 'Keine Harnwegsinfektion, geschlossenes System', massnahmen: ['Katheterpflege 1× täglich', 'Beutel unter Blasenniveau', 'Trinkmenge mind. 1,5 l'] },
      { problem: 'Sturzgefahr (Demenz, Rollator)', ziel: 'Bleibt sturzfrei', massnahmen: ['Rollator in Reichweite', 'Nachtlicht', 'Hüftprotektoren'] },
      { problem: 'Dekubitusgefahr', ziel: 'Haut intakt', massnahmen: ['Hautinspektion täglich', 'Positionswechsel nachts'] },
    ],
    rechtliches: [
      'Vorsorgevollmacht (Gesundheit, Aufenthalt) für den Sohn Thomas Kranz, Kopie im Überleitungsbogen.',
      'Keine Patientenverfügung. Laut Sohn wünscht der Vater „alles, was hilft“.',
      'Allergie: Penicillin (2019 Hautausschlag und Luftnot), im Notfallbogen rot markiert.',
    ],
  },

  befunde: [
    { massnahme: 'uebergabe-rd-annehmen', varianten: [{ text: 'Notfallsanitäter: „Herr Kranz, 81, Pflegeheim. Seit Mittag verwirrt, Fieber 39 im Heim, Dauerkatheter mit trübem Urin. RR im Wagen 92/50, Puls 118, AF 26. Zugang 18 G links, 500 ml Vollelektrolyt gelaufen. Allergie: Penicillin, steht im Notfallbogen. Medikamentenplan und Überleitungsbogen liegen bei. Der Sohn hat eine Vorsorgevollmacht und kommt nach.“' }] },
    { massnahme: 'ansprechen-orientierung', varianten: [{ text: '„Wo bin ich denn hier … in der Werkstatt?“ Er öffnet die Augen auf Ansprache, ist zeitlich und örtlich nicht orientiert. Der Sohn sagt am Telefon, gestern sei er noch klar gewesen.' }] },
    { massnahme: 'ersteindruck-abcde', varianten: [{ text: 'A frei, spricht. B: schnelle, flache Atmung. C: Haut an Armen und Beinen kühl, am Rumpf heiß, Puls schnell und schwach. D: schläfrig, verwirrt. E: 39 °C laut Heim, Dauerkatheter mit trübem, dunklem Urin, Steiß gerötet.' }] },
    { massnahme: 'monitor-anlegen', varianten: [{ text: 'Monitor läuft: HF {hf}/min, RR {rrSys}/{rrDia} mmHg (MAP {map}), AF {af}/min, SpO₂ {spo2} %.', zeigt: ['hf', 'rrSys', 'rrDia', 'map', 'af', 'spo2', 'rhythmus'] }] },
    { massnahme: 'qsofa-erheben', varianten: [{ text: 'qSOFA: Atemfrequenz {af}/min (≥ 22), systolischer Blutdruck {rrSys} mmHg (≤ 100), Bewusstsein verändert. 3 von 3 Punkten → hohes Risiko, an Sepsis denken.' }] },
    { massnahme: 'rekap-pruefen', varianten: [{ text: 'Rekapillarisierung {rekapSek} s.' }] },
    { massnahme: 'haut-beobachten', varianten: [
      { wenn: { wert: 'map', vergleich: '>=', grenze: 65 }, text: 'Rumpf warm, Knie nur noch leicht marmoriert.' },
      { text: 'Rumpf heiß, Arme und Beine kühl, Knie marmoriert.' },
    ] },
    { massnahme: 'bewusstsein-avpu', varianten: [{ text: 'AVPU {avpu}, GCS {gcs}. Zeitlich und örtlich nicht orientiert.', zeigt: ['avpu'] }] },
    { massnahme: 'urin-beobachten', varianten: [{ text: 'Dauerkatheter: Urin trüb und flockig, riecht stark, Beutel fast leer. Katheter laut Heim seit 5 Wochen.' }] },
    { massnahme: 'etco2-anschliessen', varianten: [{ text: 'Nasale Kapnografie: etCO₂ {etco2} mmHg.', zeigt: ['etco2'] }] },
    { massnahme: 'schmerz-nrs', varianten: [{ text: 'Er zeigt auf den Unterbauch: „Da brennt’s.“ Schätzt NRS 3–4.' }] },
    { massnahme: 'temperatur-ohr', varianten: [{ text: '{temp} °C.', zeigt: ['temp'] }] },
    { massnahme: 'bz-messen', varianten: [{ text: 'BZ {bz} mg/dl.', zeigt: ['bz'] }] },
    { massnahme: 'ekg-12-kanal', varianten: [
      { wenn: { nichtGetan: 'infusion-anhaengen', bis: 600 }, text: 'Absolute Arrhythmie ohne P-Wellen, Frequenz um {hf}/min: neu aufgetretenes Vorhofflimmern. Ärztin informieren.', zeigt: ['rhythmus'] },
      { text: 'Sinustachykardie {hf}/min, keine Zeichen einer Ischämie (Befund durch die Ärztin).', zeigt: ['rhythmus'] },
    ] },
    { massnahme: 'blutkulturen-abnehmen', varianten: [{ text: 'Zwei Paare Blutkulturen aus zwei getrennten Punktionen abgenommen (aerob/anaerob), beschriftet, Uhrzeit notiert, ins Labor geschickt.' }] },
    { massnahme: 'bga-venoes-abnehmen', varianten: [{ text: 'Venöse BGA mit Laktat luftfrei abgenommen.' }] },
    { massnahme: 'bga-abnehmen-arteriell', varianten: [{ text: 'Arterielle BGA aus der Kanüle abgenommen, System wieder gespült.' }] },
    { massnahme: 'bga-messen-lesen', varianten: [{ text: 'BGA: pH {ph}, pCO₂ {paco2} mmHg, HCO₃⁻ {hco3} mmol/l, BE {be}, Laktat {laktat} mmol/l, K⁺ {kalium} mmol/l. Werte an die Ärztin weitergeben.', zeigt: ['ph', 'paco2', 'pao2', 'hco3', 'be', 'laktat', 'kalium'] }] },
    { massnahme: 'bilanz-fuehren', varianten: [{ text: 'Urin zuletzt {urinMlH} ml/h (Ziel mindestens 0,5 ml/kg/h = 38 ml/h). Bilanz seit Aufnahme {bilanzMl} ml.', zeigt: ['urinMlH', 'bilanzMl'] }] },
    { massnahme: 'arterie-assistieren', varianten: [{ text: 'Dr. Aydin legt die Kanüle in die A. radialis rechts. Druckaufnehmer gespült und angeschlossen, Kurve läuft. Angezeigt: {artSys}/{artDia} mmHg, MAP {map}. Noch nicht genullt.', zeigt: ['artSys', 'artDia', 'map'] }] },
    { massnahme: 'arterie-nullabgleich', varianten: [{ text: 'Druckaufnehmer auf Herzhöhe (Phlebostatische Achse), zur Luft geöffnet, Null bestätigt. Jetzt {artSys}/{artDia} mmHg, MAP {map}.', zeigt: ['artSys', 'artDia', 'map'] }] },
    { massnahme: 'art-system-pruefen', varianten: [{ text: 'Kleine Luftblase am Dreiwegehahn entfernt, Spülbeutel auf 300 mmHg, Leitung nicht abgeknickt. Kurve wieder spitz mit Inzisur: {artSys}/{artDia} mmHg, MAP {map}.', zeigt: ['artSys', 'artDia', 'map'] }] },
    { massnahme: 'katecholamin-schenkel-spuelen', varianten: [{ text: 'Du spülst mit 10 ml NaCl über den Schenkel, an dem das Noradrenalin läuft.' }] },
  ],

  gespraech: [
    { id: 'g-allergie', frage: 'Haben Sie Allergien gegen Medikamente?', an: 'patient', kompetenzbereiche: ['I', 'IV'],
      antwort: [{ text: '„Penizillin … da hab ich keine Luft mehr gekriegt, ganz rot war ich.“' }],
      fakten: ['Penicillinallergie mit Luftnot und Hautrötung 2019'] },
    { id: 'g-beschwerden', frage: 'Was tut Ihnen gerade weh?', an: 'patient', kompetenzbereiche: ['I', 'II'],
      antwort: [{ text: '„Unten am Bauch brennt’s … und kalt ist mir.“ Er zittert.' }], fakten: ['Unterbauch brennt', 'Schüttelfrost'] },
    { id: 'g-beruhigen', frage: 'Mit Namen ansprechen, erklären, wo er ist und was passiert', an: 'patient', kompetenzbereiche: ['II'],
      antwort: [{ text: 'Er hält deine Hand und wird etwas ruhiger.' }],
      wirkung: [{ groesse: 'angst', delta: -0.2, beginnSek: 0, spitzeSek: 60, dauerSek: 'dauerhaft' }] },
    // Runde 2 (P14a): Rettungsdienst nachfragen, Sohn (Vorsorgevollmacht) informieren
    { id: 'g-rd-nachfragen', frage: 'Nachfragen: Letzte Medikamente, Patientenverfügung, Ansprechpartner?', an: 'rettungsdienst', kompetenzbereiche: ['II', 'IV'],
      antwort: [{ text: '„Metformin heute um 18 Uhr, Paracetamol 500 mg um 21 Uhr im Heim. Patientenverfügung gibt es keine. Ansprechpartner ist der Sohn mit Vorsorgevollmacht, die Nummer steht im Überleitungsbogen.“' }],
      fakten: ['Metformin 18 Uhr', 'Paracetamol 500 mg 21 Uhr', 'keine Patientenverfügung', 'Sohn mit Vorsorgevollmacht'] },
    { id: 'g-sohn-info', frage: 'Sohn anrufen: Lage im Schockraum, Verdacht auf Sepsis, Verlegung auf die Intensivstation', an: 'angehoerige', kanal: 'telefon', kompetenzbereiche: ['II', 'IV'],
      schweigepflicht: { erlaubtWenn: { eine: [{ getan: 'uebergabe-rd-annehmen' }, { getan: 'frage:g-rd-nachfragen' }] },
        fehlerText: 'Du hast den Sohn informiert, bevor du wusstest, ob er Auskunft bekommen darf. Herr Kranz kann gerade nicht einwilligen. Der Rettungsdienst und der Überleitungsbogen nennen die Vorsorgevollmacht: erst klären, dann informieren.' },
      antwort: [{ text: '„Danke, dass Sie anrufen. Ich bin in einer Viertelstunde da. Er wollte immer, dass man alles macht, was hilft.“', setzt: ['sohn-informiert'] }],
      fakten: ['Sohn kommt in 15 Minuten', 'Vater wünscht volle Therapie'] },
  ],

  sbar: [
    { id: 's-sepsis-verdacht', teil: 'S', text: 'Herr Kranz, 81, aus dem Pflegeheim: Verdacht auf Sepsis, qSOFA 3 von 3.', art: 'kern', bekanntWenn: { getan: 'qsofa-erheben' } },
    { id: 's-fieber', teil: 'S', text: 'Herr Kranz hat Fieber.', art: 'hilfreich' },
    { id: 'b-dk-harnweg', teil: 'B', text: 'Dauerkatheter seit 5 Wochen, Urin trüb, Diabetes, seit Mittag zunehmend verwirrt.', art: 'kern' },
    { id: 'b-penicillin-allergie', teil: 'B', text: 'Penicillinallergie mit Luftnot im Notfallbogen.', art: 'kern',
      bekanntWenn: { eine: [{ getan: 'uebergabe-rd-annehmen' }, { getan: 'frage:g-allergie' }] } },
    { id: 'b-schreiner', teil: 'B', text: 'Er war früher Schreiner.', art: 'ablenker' },
    { id: 'a-hypotonie', teil: 'A', text: 'RR um 90 systolisch, MAP unter 65, Puls um 120.', art: 'kern', bekanntWenn: { getan: 'monitor-anlegen' } },
    { id: 'a-tachypnoe', teil: 'A', text: 'Atemfrequenz über 22, SpO₂ knapp.', art: 'kern', bekanntWenn: { getan: 'monitor-anlegen' } },
    { id: 'a-verwirrt', teil: 'A', text: 'Akut verwirrt, GCS 13.', art: 'kern' },
    { id: 'a-laktat-hoch', teil: 'A', text: 'Laktat in der BGA über 2 mmol/l.', art: 'kern', bekanntWenn: { getan: 'bga-messen-lesen' } },
    { id: 'a-map-nach-volumen', teil: 'A', text: 'Nach 1000 ml Volumen MAP weiter unter 65 mmHg.', art: 'kern', bekanntWenn: VOLUMEN_GEGEBEN },
    { id: 'a-nur-unruhig', teil: 'A', text: 'Er ist etwas unruhig, sonst stabil.', art: 'falsch' },
    { id: 'r-sofort', teil: 'R', text: 'Bitte kommen Sie sofort in den Schockraum.', art: 'kern' },
    { id: 'r-noradrenalin', teil: 'R', text: 'Brauchen wir Noradrenalin und eine arterielle Druckmessung?', art: 'hilfreich' },
    { id: 'r-abwarten', teil: 'R', text: 'Ich messe in einer Stunde noch einmal.', art: 'falsch' },
    // Runde 2 (P14a): Übergabe an die Intensivstation
    { id: 'r-its-laeuft', teil: 'R', text: 'Noradrenalin läuft nach Zielvorgabe MAP über 65, Arterie genullt, Meropenem nach den Blutkulturen gegeben, Bilanz läuft. Bitte weiter auf allergische Reaktion achten.', art: 'hilfreich',
      bekanntWenn: { alle: [{ getan: 'perfusor-vorbereiten' }, { getan: 'arterie-nullabgleich' }] } },
  ],

  anordnungen: [
    { id: 'an-o2-standard', massnahme: 'o2-geben', text: 'Notfallstandard der Notaufnahme: O₂ bei SpO₂ unter 94 %, Ziel 94–98 %.' },
    { id: 'an-bk', massnahme: 'blutkulturen-abnehmen', text: 'Zwei Paare Blutkulturen, vor dem Antibiotikum.' },
    { id: 'an-bga', massnahme: 'bga-venoes-abnehmen', auchFuer: ['bga-abnehmen-arteriell'], text: 'BGA mit Laktat, jetzt und nach einer Stunde.' },
    { id: 'an-ringer', massnahme: 'infusion-anhaengen', text: '1000 ml balancierte Vollelektrolytlösung rasch i. v., danach neu beurteilen.' },
    { id: 'an-piptaz', massnahme: 'piptaz-iv', auchFuer: ['piptaz-richten'], text: 'Piperacillin/Tazobactam 4,5 g i. v. sofort nach den Blutkulturen.',
      fehlerhaft: {
        warum: 'Piperacillin ist ein Penicillin. Herr Kranz hat eine dokumentierte Penicillinallergie mit Luftnot (Anaphylaxie-Verdacht).',
        korrektur: 'Dann Meropenem 1 g i. v. als Kurzinfusion. Bitte in der ersten halben Stunde auf eine allergische Reaktion achten.',
        ersatz: 'an-meropenem',
      } },
    { id: 'an-meropenem', massnahme: 'meropenem-iv', auchFuer: ['meropenem-richten'], text: 'Meropenem 1 g i. v. als Kurzinfusion nach den Blutkulturen, auf allergische Reaktion achten.' },
    { id: 'an-paracetamol', massnahme: 'paracetamol-iv', text: 'Paracetamol 1 g i. v. als Kurzinfusion.' },
    { id: 'an-noradrenalin', massnahme: 'perfusor-vorbereiten', text: 'Noradrenalin-Perfusor 5 mg/50 ml (0,1 mg/ml), Start 0,1 µg/kg/min, Ziel MAP ≥ 65 mmHg.' },
    { id: 'an-na-titrieren', massnahme: 'katecholamin-anpassen', text: 'Noradrenalin in 1-ml/h-Schritten alle 5 Minuten anpassen, Ziel MAP 65–75 mmHg.' },
    { id: 'an-arterie', massnahme: 'arterie-assistieren', text: 'Ich lege eine arterielle Kanüle, bitte vorbereiten.' },
    { id: 'an-intensiv', massnahme: 'verlegung-uebergabe', text: 'Verlegung auf die Intensivstation, Bett ist angefragt.' },
  ],

  arzt: {
    name: 'Dr. Aydin',
    erreichbar: 'vor-ort',
    // Runde 2 (P14a): genau → allgemein. Rückaufträge Laktat und MAP nach Nullabgleich; ohne Verdacht fragt die Ärztin zurück.
    regeln: [
      SCHOCK_REGEL,
      { wenn: { gemeldet: ['s-sepsis-verdacht', 'a-hypotonie', 'b-penicillin-allergie'] },
        antwort: `„Danke, ich komme. Blutkulturen, BGA mit Laktat, 1000 ml Volumen rasch. Wegen der Penicillinallergie nehmen wir Meropenem, nach den Kulturen.${LAKTAT_AUFTRAG}“`,
        anordnungen: ['an-bk', 'an-bga', 'an-ringer', 'an-meropenem'], setzt: ['sepsis-gemeldet', 'allergie-gemeldet'], auftraege: ['af-laktat'] },
      { wenn: { gemeldet: ['s-sepsis-verdacht', 'a-hypotonie'] },
        antwort: `„Danke, ich komme. Blutkulturen, BGA mit Laktat, 1000 ml Volumen rasch und Piperacillin/Tazobactam 4,5 g nach den Kulturen.${LAKTAT_AUFTRAG}“`,
        anordnungen: ['an-bk', 'an-bga', 'an-ringer', 'an-piptaz'], setzt: ['sepsis-gemeldet'], auftraege: ['af-laktat'] },
      { id: 'r-qsofa-frage', wenn: { gemeldet: ['a-hypotonie'] },
        antwort: '„Ich bin noch im anderen Raum. Niedriger Blutdruck allein sagt mir noch nicht, woran Sie denken.“',
        rueckfrage: { text: '„Was ergibt der qSOFA, und gibt es einen Infektfokus?“', erwartet: ['s-sepsis-verdacht'] } },
      { wenn: { eine: [{ gemeldet: ['s-fieber'] }, { gemeldet: ['a-nur-unruhig'] }] },
        antwort: '„Dann geben Sie erst einmal 1 g Paracetamol. Ich schaue in einer halben Stunde vorbei.“', anordnungen: ['an-paracetamol'], setzt: ['arzt-verzoegert'] },
    ],
    auftraege: [
      { id: 'af-laktat', text: 'Laktat aus der BGA der Ärztin sagen', erledigt: { getan: 'bga-messen-lesen' }, meldung: ['wert:laktat'], meldenBinnenSek: 1200,
        folge: [
          SCHOCK_REGEL,
          { wenn: { wert: 'laktat', vergleich: '>=', grenze: 4 }, antwort: '„Laktat über 4, das ist ernst. Volumen weiterlaufen lassen und sagen Sie mir sofort, wie der MAP nach dem Liter ist.“' },
          { wenn: { ab: 0 }, antwort: '„Danke. Volumen weiter, wir beurteilen nach dem Liter neu.“' },
        ] },
      { id: 'af-map', text: 'MAP nach dem Nullabgleich der Arterie der Ärztin sagen', erledigt: { getan: 'arterie-nullabgleich' }, meldung: ['wert:map'], meldenBinnenSek: 900,
        folge: [
          { wenn: { wert: 'map', vergleich: '>=', grenze: 65 }, antwort: '„Gut, MAP im Ziel. So halten, die Intensiv erwartet ihn.“', setzt: ['map-rueckmeldung'] },
          { wenn: { ab: 0 }, antwort: '„Noch unter 65. Weiter in 1-ml/h-Schritten alle fünf Minuten nach Schema, ich bleibe dabei.“', setzt: ['map-rueckmeldung'] },
        ] },
    ],
  },
  team: { weitere: { rettungsdienst: 'Notfallsanitäter Herr Wolf', angehoerige: 'Sohn Thomas Kranz (Vorsorgevollmacht)', 'aufnehmende-station': 'Intensivstation, Pfleger Malte' } },

  ereignisse: [
    { id: 'e-vhf', art: 'geraet', wann: { nichtGetan: 'infusion-anhaengen', bis: 600 },
      text: 'Der Monitor alarmiert: unregelmäßige Tachykardie um 150/min. Herr Kranz wird blasser.',
      modul: { rhythmus: 'vorhofflimmern' }, bild: { haut: 'blass-kaltschweissig' } },
    { id: 'e-laufrate', art: 'team', wann: { getan: 'perfusor-vorbereiten' },
      text: 'Die Spritze ist aufgezogen: Noradrenalin 5 mg auf 50 ml (0,1 mg/ml). Angeordnet sind 0,1 µg/kg/min, Herr Kranz wiegt 75 kg. Welche Laufrate stellst du ein?',
      entscheidung: [
        { id: 'w-4-5', text: '4,5 ml/h', wertung: 'gut', setzt: ['laufrate-richtig'], modul: { perfusor: { id: 'na', mlProH: 4.5 } },
          warum: '0,1 µg × 75 kg = 7,5 µg/min · 60 = 450 µg/h = 0,45 mg/h. Bei 0,1 mg/ml sind das 4,5 ml/h.' },
        { id: 'w-45', text: '45 ml/h', wertung: 'gefaehrlich', modul: { perfusor: { id: 'na', mlProH: 45 } },
          warum: 'Kommafehler um den Faktor 10: Das entspricht 1 µg/kg/min und führt zu einer gefährlichen Blutdruckkrise.' },
        { id: 'w-7-5', text: '7,5 ml/h', wertung: 'falsch', modul: { perfusor: { id: 'na', mlProH: 7.5 } },
          warum: '7,5 ist die Dosis in µg/min, nicht die Laufrate. Umrechnen in mg/h und durch die Konzentration teilen.' },
        { id: 'w-0-45', text: '0,45 ml/h', wertung: 'falsch', modul: { perfusor: { id: 'na', mlProH: 0.45 } },
          warum: 'Das ist die Menge in mg/h. Sie muss noch durch 0,1 mg/ml geteilt werden.' },
      ] },
    { id: 'e-gedaempft', art: 'geraet', wann: { alle: [{ flag: 'art-genullt' }, { ab: 1800 }] },
      text: 'Die arterielle Kurve wird flach und rundlich, die Systole sinkt, die Diastole steigt. Der Mitteldruck ändert sich kaum.',
      modul: { stoerungAn: ['art-gedaempft'] } },
  ],

  pa: {
    name: 'Praxisanleiterin Jana Roth (Fachpflege Notfall)',
    hilfen: [
      { wenn: { nicht: { getan: 'monitor-anlegen' } }, impuls: 'Was brauchst du, um seinen Zustand überhaupt beurteilen zu können?', tipp: 'Schließ zuerst den Monitor an und lass dir die Übergabe vom Rettungsdienst geben.' },
      { wenn: { nicht: { flag: 'sepsis-gemeldet' } }, impuls: 'Fieber, niedriger Blutdruck, schnelle Atmung, neu verwirrt: Woran denkst du?', tipp: 'Erhebe den qSOFA und melde der Ärztin mit SBAR den Verdacht auf Sepsis. Denk an die Allergie im Notfallbogen.' },
      { wenn: { auftrag: 'af-laktat', status: 'offen' }, impuls: 'Worauf wartet die Ärztin noch von dir?', tipp: 'BGA mit Laktat abnehmen, messen und ihr den Wert sagen.' },
      { wenn: { alle: [{ flag: 'sepsis-gemeldet' }, { nicht: { getan: 'blutkulturen-abnehmen' } }] }, impuls: 'In welcher Reihenfolge laufen Blutkulturen und Antibiotikum?', tipp: 'Erst die Blutkulturen, dann sofort das Antibiotikum. Das Volumen kann parallel laufen.' },
      { wenn: { alle: [{ flag: 'arterie-liegt' }, { nicht: { flag: 'art-genullt' } }] }, impuls: 'Kannst du dem arteriellen Wert schon trauen?', tipp: 'Ohne Nullabgleich auf Herzhöhe ist der Wert verschoben. Erst nullen, dann titrieren.' },
      { impuls: 'Erreicht ihr das Ziel? Woran misst du das außer am Monitor?', tipp: 'MAP, Haut, Bewusstsein und die Urin-Stundenmenge zeigen dir, ob die Organe wieder durchblutet werden.' },
    ],
  },

  bewertung: {
    pflicht: [
      { id: 'p-monitor', text: 'Monitor in den ersten 2 Minuten angeschlossen', gewicht: 2, kompetenzbereiche: ['I'], klinisch: ['abcde', 'zeit'],
        erfuellt: { getan: 'monitor-anlegen', bis: 120 }, warum: 'Im Schockraum braucht es sofort kontinuierliche Überwachung von Rhythmus, Blutdruck und Sauerstoffsättigung.' },
      { id: 'p-qsofa', text: 'Sepsis-Risiko mit qSOFA eingeschätzt', gewicht: 2, kompetenzbereiche: ['I', 'V'], klinisch: ['abcde'],
        erfuellt: { getan: 'qsofa-erheben' }, warum: 'qSOFA (AF ≥ 22, RR sys ≤ 100, verändertes Bewusstsein) ist ein schneller Hinweis außerhalb der Intensivstation.' },
      { id: 'p-sepsis-gemeldet', text: 'Verdacht auf Sepsis mit SBAR gemeldet', gewicht: 3, kompetenzbereiche: ['II', 'III'], klinisch: ['team'],
        erfuellt: { flag: 'sepsis-gemeldet' }, warum: 'Sepsis ist ein Notfall. Jede Stunde Verzögerung der Therapie verschlechtert die Prognose.' },
      { id: 'p-allergie', text: 'Penicillinallergie berücksichtigt (gemeldet oder remonstriert), kein Penicillin gegeben', gewicht: 3, kompetenzbereiche: ['III', 'IV'], klinisch: ['medikamente'],
        erfuellt: { alle: [{ eine: [{ flag: 'allergie-gemeldet' }, { flag: 'remonstriert:an-piptaz' }] }, { nicht: PENICILLIN_GEGEBEN }] },
        warum: 'Die Durchführungsverantwortung liegt bei dir. Eine Anordnung trotz dokumentierter Allergie musst du hinterfragen.' },
      { id: 'p-blutkulturen', text: 'Blutkulturen vor dem Antibiotikum abgenommen', gewicht: 2, kompetenzbereiche: ['I', 'V'], klinisch: ['medikamente'],
        erfuellt: { getan: 'blutkulturen-abnehmen' }, warum: 'Blutkulturen vor der ersten Antibiotikagabe erhöhen die Chance, den Erreger zu finden.' },
      { id: 'p-antibiotikum', text: 'Antibiotikum innerhalb der ersten Stunde gegeben', gewicht: 3, kompetenzbereiche: ['I', 'III'], klinisch: ['medikamente', 'zeit'],
        erfuellt: { eine: [{ getan: 'meropenem-iv', bis: 3600 }, { getan: 'meropenem-richten', bis: 3600 }] }, warum: 'Bei septischem Schock soll das Antibiotikum möglichst innerhalb einer Stunde laufen (SSC 2021).' },
      { id: 'p-volumen', text: 'Volumen nach Anordnung rasch gegeben', gewicht: 3, kompetenzbereiche: ['I', 'III'], klinisch: ['abcde'],
        erfuellt: { getan: 'infusion-anhaengen', bis: 900 }, warum: 'Bei Sepsis mit Hypotonie oder Laktat ≥ 4 mmol/l ist rasche Volumengabe die erste Kreislaufmaßnahme.' },
      { id: 'p-laktat', text: 'Laktat bestimmt und gemeldet', gewicht: 2, kompetenzbereiche: ['I', 'II'], klinisch: ['abcde'],
        erfuellt: { getan: 'bga-messen-lesen' }, warum: 'Laktat zeigt die Minderdurchblutung der Gewebe und hilft, den Verlauf zu beurteilen.' },
      { id: 'p-laufrate', text: 'Laufrate des Noradrenalin-Perfusors richtig berechnet', gewicht: 3, kompetenzbereiche: ['I', 'V'], klinisch: ['medikamente'],
        erfuellt: { flag: 'laufrate-richtig' }, warum: 'Rechenfehler bei Katecholaminen sind gefährlich. Rechenweg: µg/kg/min → µg/h → mg/h → ml/h.' },
      { id: 'p-nullabgleich', text: 'Arterielle Messung vor dem Titrieren genullt', gewicht: 2, kompetenzbereiche: ['I', 'V'], klinisch: ['geraete'],
        erfuellt: { getan: 'arterie-nullabgleich' }, warum: 'Ohne Nullabgleich ist der angezeigte Druck verschoben, das Titrieren richtet sich dann nach falschen Werten.' },
      { id: 'p-gedaempft', text: 'Gedämpfte arterielle Kurve erkannt und behoben', gewicht: 2, kompetenzbereiche: ['I'], klinisch: ['geraete'],
        erfuellt: { getan: 'art-system-pruefen' }, warum: 'Eine gedämpfte Kurve unterschätzt die Systole. Wer danach titriert, gibt zu viel Noradrenalin.' },
      { id: 'p-map-ziel', text: 'Ziel-MAP ≥ 65 mmHg bei Verlegung erreicht', gewicht: 2, kompetenzbereiche: ['I'], klinisch: ['abcde'],
        erfuellt: { wert: 'map', vergleich: '>=', grenze: 65 }, warum: 'MAP ≥ 65 mmHg ist das Startziel bei septischem Schock (SSC 2021).' },
      { id: 'p-urin', text: 'Urin-Stundenmenge gemessen und Bilanz geführt', gewicht: 1, kompetenzbereiche: ['I'], klinisch: ['abcde'],
        erfuellt: { getan: 'bilanz-fuehren' }, warum: 'Die Urinmenge zeigt, ob die Nieren wieder durchblutet werden (Ziel ≥ 0,5 ml/kg/h).' },
      { id: 'p-uebergabe', text: 'Strukturierte Übergabe an die Intensivstation (mit Allergie und laufender Therapie)', gewicht: 2, kompetenzbereiche: ['II', 'III'], klinisch: ['team'],
        erfuellt: { alle: [{ getan: 'verlegung-uebergabe' }, { gesagt: 'b-penicillin-allergie', an: 'aufnehmende-station' }, { gesagt: 'r-its-laeuft', an: 'aufnehmende-station' }] },
        warum: 'Bei der Verlegung gehen sonst Laufraten, Allergie und Zeitpunkte verloren.' },
      { id: 'p-rueckauftrag', text: 'Rückaufträge der Ärztin gemeldet (Laktat, MAP nach Nullabgleich)', gewicht: 2, kompetenzbereiche: ['II', 'III'], klinisch: ['team'],
        erfuellt: { alle: [{ auftrag: 'af-laktat', status: 'gemeldet' }, { auftrag: 'af-map', status: 'gemeldet' }] },
        warum: 'Die Ärztin entscheidet über Noradrenalin und Titration nach deinen Werten (Closed Loop).' },
      { id: 'p-sohn', text: 'Sohn (Vorsorgevollmacht) informiert, nachdem die Vollmacht geklärt war', gewicht: 1, kompetenzbereiche: ['II', 'IV'],
        erfuellt: { flag: 'sohn-informiert' }, warum: 'Der Bevollmächtigte entscheidet mit, wenn Herr Kranz nicht einwilligen kann, und kennt seinen Willen.' },
      { id: 'p-doku', text: 'Zeitpunkte von Blutkulturen und Antibiotikum dokumentiert', gewicht: 1, kompetenzbereiche: ['I', 'IV'], klinisch: ['medikamente'],
        erfuellt: { alle: [{ dokumentiert: 'befund:blutkulturen-abnehmen' }, { dokumentiert: 'massnahme:meropenem-richten' }] },
        warum: 'Die Zeit bis zum Antibiotikum ist ein Qualitätsmerkmal der Sepsisversorgung und muss nachvollziehbar sein.' },
    ],
    fehler: [
      { id: 'f-penicillin', text: 'Penicillin trotz dokumentierter Allergie gegeben', wenn: PENICILLIN_GEGEBEN, schwere: 'schwer', kompetenzbereiche: ['III', 'IV'],
        folge: { text: 'Wenige Minuten nach der Gabe: Quaddeln am Hals, pfeifende Atmung, der Blutdruck fällt weiter. Anaphylaxie!',
          treiber: [{ art: 'bronchospasmus', staerke: 0.6 }],
          wirkung: [{ groesse: 'gefaesstonus', delta: -0.2, beginnSek: 60, spitzeSek: 300, dauerSek: 'dauerhaft' }] },
        warum: 'Bei einer Anordnung trotz bekannter Allergie musst du remonstrieren. Blind ausführen ist ein schwerer Durchführungsfehler.' },
      { id: 'f-ab-vor-bk', text: 'Antibiotikum vor den Blutkulturen gegeben', wenn: { alle: [ANTIBIOTIKUM, { nicht: { getan: 'blutkulturen-abnehmen' } }] },
        schwere: 'mittel', kompetenzbereiche: ['I', 'V'], warum: 'Nach dem Antibiotikum wachsen Erreger in der Blutkultur oft nicht mehr an.' },
      { id: 'f-volumen-spaet', text: 'Volumen nicht innerhalb von 10 Minuten begonnen', wenn: { nichtGetan: 'infusion-anhaengen', bis: 600 },
        schwere: 'mittel', kompetenzbereiche: ['I', 'III'], warum: 'Der Kreislauf bricht ohne Volumen weiter ein, es kommt zu Rhythmusstörungen.' },
      { id: 'f-laufrate-10fach', text: 'Noradrenalin zehnfach überdosiert (45 ml/h)', wenn: { getan: 'wahl:e-laufrate:w-45' }, schwere: 'schwer', kompetenzbereiche: ['I', 'V'],
        folge: { text: 'Der Blutdruck schießt hoch, Herr Kranz klagt über Kopfschmerzen, die Finger werden weiß. Jana stoppt die Pumpe.' }, warum: 'Kommafehler bei Katecholaminen sind lebensgefährlich. Immer zu zweit rechnen und kontrollieren.' },
      { id: 'f-laufrate-falsch', text: 'Noradrenalin-Laufrate falsch berechnet', wenn: { eine: [{ getan: 'wahl:e-laufrate:w-7-5' }, { getan: 'wahl:e-laufrate:w-0-45' }] }, schwere: 'mittel', kompetenzbereiche: ['I', 'V'],
        warum: 'Mit falscher Laufrate wird das Ziel verfehlt oder überschritten. Rechenweg: µg/kg/min → mg/h → ml/h.' },
      { id: 'f-na-bolus', text: 'Über den Noradrenalin-Schenkel gespült (Bolus)', wenn: { getan: 'katecholamin-schenkel-spuelen' }, schwere: 'schwer', kompetenzbereiche: ['I', 'V'],
        folge: { text: 'Der Blutdruck steigt für eine Minute steil an, der Monitor alarmiert, Herr Kranz wird unruhig.',
          wirkung: [{ groesse: 'gefaesstonus', delta: 0.7, beginnSek: 0, spitzeSek: 10, dauerSek: 60 }] },
        warum: 'Katecholamine laufen über einen eigenen Schenkel, der nie gespült wird. Sonst bekommt der Patient einen Bolus.' },
      { id: 'f-oberkoerper-hoch', text: 'Oberkörper im Schock hoch aufgerichtet', wenn: { getan: 'oberkoerper-hoch' }, schwere: 'leicht', kompetenzbereiche: ['I'],
        folge: { text: 'Herr Kranz wird schwindelig und blass.', wirkung: [{ groesse: 'volumen', delta: -0.04, beginnSek: 0, spitzeSek: 30, dauerSek: 300 }] },
        warum: 'Bei Hypotonie verstärkt das Aufrichten den Blutdruckabfall. Flach lagern, Beine hoch.' },
    ],
    ende: [
      { wenn: { flag: 'auf-intensiv' }, text: 'Herr Kranz wird mit laufendem Noradrenalin und arterieller Messung auf die Intensivstation verlegt.', ausgang: 'verlegt' },
      { wenn: { wert: 'map', vergleich: '<', grenze: 40 }, text: 'Der Kreislauf bricht zusammen. Das Reanimationsteam übernimmt.', ausgang: 'verschlechtert' },
    ],
  },

  pflegebedarf: {
    probleme: [
      { id: 'pb-kreislauf', text: 'Kreislaufinstabilität mit Minderdurchblutung der Organe (septischer Schock)', richtig: true, prioritaet: 1, warum: 'Lebensbedrohlich, bestimmt alle weiteren Maßnahmen.' },
      { id: 'pb-infekt', text: 'Infektion mit Sepsis, vermutlich aus den Harnwegen (Dauerkatheter)', richtig: true, prioritaet: 1, warum: 'Quelle muss saniert werden (Katheterwechsel nach Anordnung), Antibiotikum zeitgerecht.' },
      { id: 'pb-allergie', text: 'Gefahr einer allergischen Reaktion (Penicillinallergie)', richtig: true, prioritaet: 2, warum: 'Bei jeder neuen Anordnung prüfen, nach Meropenem beobachten.' },
      { id: 'pb-delir', text: 'Akute Verwirrtheit, Delir bei Sepsis', richtig: true, prioritaet: 2, warum: 'Orientierung geben, Sicherheit, Angehörige einbeziehen, Sturz- und Entfernungsgefahr von Zugängen.' },
      { id: 'pb-dekubitus', text: 'Dekubitusrisiko durch Minderdurchblutung und Immobilität (Steiß gerötet)', richtig: true, prioritaet: 3, warum: 'Hautinspektion und Druckentlastung nach Stabilisierung.' },
      { id: 'pb-obstipation', text: 'Obstipation', richtig: false, warum: 'Es gibt im Fall keine Hinweise darauf.' },
    ],
    ziele: [
      { id: 'z-map', text: 'MAP ≥ 65 mmHg, Urin ≥ 0,5 ml/kg/h, Laktat fallend', passtZu: ['pb-kreislauf'], richtig: true },
      { id: 'z-orientierung', text: 'Herr Kranz fühlt sich sicher, wird regelmäßig orientiert, der Sohn ist informiert', passtZu: ['pb-delir'], richtig: true },
      { id: 'z-keine-reaktion', text: 'Keine allergische Reaktion, Allergie bei Übergabe genannt', passtZu: ['pb-allergie'], richtig: true },
      { id: 'z-mobil', text: 'Herr Kranz geht heute Nacht mit dem Rollator zur Toilette', passtZu: ['pb-kreislauf'], richtig: false },
    ],
  },
  verdacht: {
    optionen: [
      { id: 'v-septischer-schock', text: 'Septischer Schock bei Harnwegsinfekt (Urosepsis)', richtig: true },
      { id: 'v-exsikkose', text: 'Exsikkose durch zu wenig Trinken', richtig: false },
      { id: 'v-kardiogen', text: 'Kardiogener Schock', richtig: false },
    ],
    begruendungen: [
      { id: 'bg-infekt', text: 'Fieber, trüber Urin bei Dauerkatheter', stuetzt: ['v-septischer-schock'] },
      { id: 'bg-map-trotz-volumen', text: 'MAP trotz 1000 ml Volumen unter 65 mmHg, Noradrenalin nötig', stuetzt: ['v-septischer-schock'] },
      { id: 'bg-laktat', text: 'Laktat über 2 mmol/l', stuetzt: ['v-septischer-schock'] },
      { id: 'bg-trinkt-wenig', text: 'Hat seit Mittag kaum getrunken', stuetzt: ['v-exsikkose'] },
    ],
  },
  leitfaden: [
    { titel: 'Sepsis und septischer Schock', quellen: ['sepsis-3'],
      text: 'Sepsis ist eine lebensbedrohliche Organfunktionsstörung durch eine fehlregulierte Antwort des Körpers auf eine Infektion. Septischer Schock: trotz ausreichend Volumen braucht es Vasopressoren für einen MAP ≥ 65 mmHg, und das Laktat liegt über 2 mmol/l. qSOFA (AF ≥ 22/min, systolischer RR ≤ 100 mmHg, verändertes Bewusstsein) ist ein schneller Hinweis; er ersetzt keine Diagnose.' },
    { titel: 'Die erste Stunde', quellen: ['ssc-2021', 's3-sepsis'],
      text: 'Laktat messen, Blutkulturen vor dem Antibiotikum, Antibiotikum bei Schock möglichst innerhalb einer Stunde, balancierte Kristalloide bei Hypotonie oder Laktat ≥ 4 mmol/l, Vasopressor (Noradrenalin als erste Wahl), wenn der MAP trotz Volumen unter 65 mmHg bleibt. Die Pflege erkennt, meldet, bereitet vor, führt nach Anordnung durch und überwacht.' },
    { titel: 'Allergie und Remonstration',
      text: 'Wer ein Medikament gibt, trägt die Durchführungsverantwortung. Passt eine Anordnung nicht zu einer dokumentierten Allergie, wird sie nicht ausgeführt, sondern mit der Ärztin geklärt (Remonstration). Bei Penicillinallergie sind andere Betalaktame nicht automatisch verboten; die Ärztin entscheidet, die Pflege beobachtet nach der ersten Gabe besonders auf Reaktionen.' },
    { titel: 'Noradrenalin-Perfusor sicher führen',
      text: 'Laufrate = Dosis (µg/kg/min) × Gewicht × 60 ÷ (Konzentration in mg/ml × 1000). Katecholamine laufen über einen eigenen Zugang bzw. Schenkel, der nicht gespült und nicht für Boli benutzt wird. Spritzenwechsel vorbereitet ohne Pause. Titrieren nur nach ärztlich vorgegebenem Ziel und nach einem verlässlichen Messwert.' },
    { titel: 'Arterielle Druckmessung',
      text: 'Nullabgleich auf Herzhöhe (4. Interkostalraum, mittlere Axillarlinie) vor der ersten Messung und nach Lageänderung. Eine gedämpfte Kurve (flach, ohne Inzisur) entsteht durch Luft, Gerinnsel oder Knick: Systole zu niedrig, Diastole zu hoch, MAP meist verlässlich. Spülsystem mit 300 mmHg.' },
    { titel: 'Ausscheidung und Bilanz',
      text: 'Bei Sepsis zeigt die Urin-Stundenmenge die Nierendurchblutung. Ziel mindestens 0,5 ml/kg/h. Einfuhr (Infusionen, Perfusoren) und Ausfuhr werden stündlich bilanziert und bei der Übergabe genannt.' },
  ],

  pruefwege: {
    // Musterweg für das 3. Drittel (Stufe 2, Praxisanleitung kommt bei „mit Anleitung“ dazu)
    muster: [
      { art: 'massnahme', id: 'uebergabe-rd-annehmen' },
      { art: 'massnahme', id: 'monitor-anlegen' },
      { art: 'frage', id: 'g-rd-nachfragen' },
      { art: 'massnahme', id: 'ersteindruck-abcde' },
      { art: 'massnahme', id: 'qsofa-erheben' },
      { art: 'massnahme', id: 'o2-geben' },
      { art: 'massnahme', id: 'flachlagern-beine-hoch' },
      { art: 'anruf', an: 'aerztin', sbar: ['s-sepsis-verdacht', 'b-dk-harnweg', 'b-penicillin-allergie', 'a-hypotonie', 'a-tachypnoe', 'a-verwirrt', 'r-sofort'] },
      { art: 'rueckmelden', anordnung: 'an-ringer', rueckgelesen: true },
      { art: 'rueckmelden', anordnung: 'an-bk', rueckgelesen: true },
      { art: 'rueckmelden', anordnung: 'an-bga', rueckgelesen: true },
      { art: 'rueckmelden', anordnung: 'an-meropenem', rueckgelesen: true },
      { art: 'massnahme', id: 'infusion-anhaengen' },
      { art: 'massnahme', id: 'blutkulturen-abnehmen' },
      { art: 'massnahme', id: 'meropenem-richten' },
      { art: 'massnahme', id: 'bga-venoes-abnehmen' },
      { art: 'massnahme', id: 'bga-messen-lesen' },
      { art: 'massnahme', id: 'temperatur-ohr' },
      { art: 'massnahme', id: 'beruhigen-zusprechen' },
      { art: 'dokumentieren', bausteine: ['befund:blutkulturen-abnehmen', 'massnahme:meropenem-richten', 'anordnung:an-meropenem', 'wert:laktat', 'b-penicillin-allergie'] },
      { art: 'massnahme', id: 'bilanz-fuehren' },
      { art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: ['wert:laktat', 'a-laktat-hoch', 'a-map-nach-volumen', 'wert:map', 'r-noradrenalin'] },
      { art: 'rueckmelden', anordnung: 'an-noradrenalin', rueckgelesen: true },
      { art: 'rueckmelden', anordnung: 'an-na-titrieren', rueckgelesen: true },
      { art: 'rueckmelden', anordnung: 'an-arterie', rueckgelesen: true },
      { art: 'rueckmelden', anordnung: 'an-intensiv', rueckgelesen: true },
      { art: 'massnahme', id: 'perfusor-vorbereiten' },
      { art: 'massnahme', id: 'arterie-assistieren' },
      { art: 'massnahme', id: 'arterie-nullabgleich' },
      { art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: ['wert:map'] },
      { art: 'frage', id: 'g-sohn-info' },
      { art: 'massnahme', id: 'art-system-pruefen' },
      { art: 'massnahme', id: 'bilanz-fuehren' },
      { art: 'nachricht', an: 'aufnehmende-station', kanal: 'telefon', bausteine: ['s-sepsis-verdacht', 'b-dk-harnweg', 'b-penicillin-allergie', 'a-map-nach-volumen', 'a-laktat-hoch', 'r-its-laeuft'] },
      { art: 'massnahme', id: 'verlegung-uebergabe' },
      { art: 'abschluss', probleme: ['pb-kreislauf', 'pb-infekt', 'pb-allergie', 'pb-delir'], ziele: ['z-map', 'z-orientierung', 'z-keine-reaktion'],
        verdacht: 'v-septischer-schock', begruendung: ['bg-infekt', 'bg-map-trotz-volumen', 'bg-laktat'],
        sbar: ['s-sepsis-verdacht', 'b-dk-harnweg', 'b-penicillin-allergie', 'a-hypotonie', 'a-tachypnoe', 'a-verwirrt', 'a-laktat-hoch', 'a-map-nach-volumen'] },
    ],
    unterlassung: { bisSek: 900, erwartet: { alle: [{ wert: 'map', vergleich: '<', grenze: 60 }, { wert: 'laktat', vergleich: '>', grenze: 4.1 }] } },
    // 3. Drittel startet den Perfusor ohne Anleitung (mit Anordnung): Stufe 2 PA unterstützt, Stufe 3 Grenzüberschreitung + Abbruch
    grenze: {
      rolle: 3,
      events: [
        { art: 'massnahme', id: 'monitor-anlegen' },
        { art: 'massnahme', id: 'qsofa-erheben' },
        { art: 'anruf', an: 'aerztin', sbar: ['s-sepsis-verdacht', 'b-penicillin-allergie', 'a-hypotonie'] },
        { art: 'rueckmelden', anordnung: 'an-ringer', rueckgelesen: true },
        { art: 'anleitung-anfordern', massnahme: 'infusion-anhaengen' },
        { art: 'massnahme', id: 'infusion-anhaengen' },
        { art: 'warten', sek: 300 },
        { art: 'anruf', an: 'aerztin', sbar: ['a-map-nach-volumen'] },
        { art: 'rueckmelden', anordnung: 'an-noradrenalin', rueckgelesen: true },
        { art: 'massnahme', id: 'perfusor-vorbereiten' },
      ],
      erwartet: 'pa-eingriff',
    },
  },
};
