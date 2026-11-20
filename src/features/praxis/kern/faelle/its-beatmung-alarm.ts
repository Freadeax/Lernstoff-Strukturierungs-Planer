// Fallwelle P16b (CE06) · Spur B Intensivstation: Beatmungsalarm während der Übergabe, Sekretverlegung, leerer Sedierungsperfusor
// Entwurf, fachlich UNGEPRÜFT. Inhalte fiktiv/didaktisch. Migriert und neu geschrieben aus dem Altfall „its“ (scenarios.json).
// Rolle wählbar: Azubi 3. Drittel oder Pflegefachperson (E11). Ärztliche Handlungen bleiben ärztlich.

import { KATALOG } from '../katalog';
import type { Bedingung, FallV2, MassnahmeDefinition } from '../typen';

const aus = (id: string, mehr: Partial<MassnahmeDefinition>): MassnahmeDefinition => ({ ...KATALOG[id]!, ...mehr });

const BEHOBEN: Bedingung = { getan: 'beatmung-diskonnektion-beheben' };
const ABGESAUGT: Bedingung = { getan: 'geschlossen-absaugen' };
const SPRITZE_NEU: Bedingung = { getan: 'perfusor-wechseln' };
const PROPOFOL_ZU_HOCH: Bedingung = { getan: 'propofol-40' };
/** Gerätestörungen und Perfusoralarm kommen als Fallereignisse; dieselben Bedingungen steuern Befunde und PA-Hilfen. */
const DISKONNEKTIERT: Bedingung = { ab: 5 };
const HANDBEATMET: Bedingung = { getan: 'handbeatmung' };
/** Beatmung nach Zusammenstecken bzw. mit dem Beutel wieder dicht */
const DICHT = { beatmung: { fio2: 0.4, peep: 8, af: 16, vt: 480 }, stoerungAus: ['diskonnektion' as const] };
const SEKRET_DA: Bedingung = { alle: [BEHOBEN, { ab: 480 }] };
const SPRITZE_LEER: Bedingung = { alle: [ABGESAUGT, { ab: 840 }] };
/** Propofol 2 % (20 mg/ml), 80 kg: 4 ml/h = 1 mg/kg/h */
const PROPOFOL = { id: 'propofol', wirkstoff: 'propofol', konzentration: '1000 mg/50 ml (2 %)', mgProMl: 20 };

export const ITS_BEATMUNG_ALARM: FallV2 = {
  schema: 2,
  id: 'its-beatmung-alarm',
  version: '0.1.0',
  spur: 'B',
  setting: 'intensiv',
  altersgruppe: 'erwachsen',
  titel: '„Ein Alarm während der Übergabe“',
  kurz: 'Intensivstation, Frühdienst: Während der Übergabe alarmiert die Beatmung, die Sättigung fällt. Später brodelt es im Tubus.',
  rahmen: 'Du übernimmst im Frühdienst mit deiner Praxisanleitung Bettplatz 4 auf der operativen Intensivstation. Pfleger Ben aus dem Nachtdienst übergibt am Bett.',
  lernziele: [
    'Bei einem Beatmungsalarm zuerst den Patienten ansehen, dann das System nach DOPES prüfen (Dislokation, Obstruktion, Pneumothorax, Equipment, Stacking).',
    'Einen Alarm nie ohne Ursache stummschalten; Alarmgrenzen und Werte am Patienten prüfen.',
    'Sekretverlegung erkennen (Spitzendruck, Brodeln, Sättigung) und geschlossen absaugen.',
    'Sedierung und Schmerz mit RASS und BPS einschätzen, einen leeren Perfusor ohne Unterbrechung wechseln und eine unplausible Laufrate hinterfragen.',
    'Angehörige am Telefon im Rahmen der Schweigepflicht informieren und das Ereignis dokumentieren.',
  ],
  lehrplan: {
    ce: ['ce.06', 'ce.05'], abschnitt: ['ad3'],
    themen: ['thema.beo.notfall', 'thema.kl.atmung', 'thema.ph.medikamente', 'thema.pp.uebergabe', 'thema.re.schweigepflicht'],
    kompetenzen: ['I.4.a', 'I.4.b', 'I.4.c', 'II.3.b', 'III.2.b'],
  },
  geeignet: { rollen: [3, 'pflegefachperson'], stufen: [2, 3] },
  dauerMin: [15, 25],
  freigabe: {
    status: 'entwurf',
    pruefpunkte: [
      'DOPES-Vorgehen und Handbeatmung mit Beutel bei unklarer Ursache gegen S3-Leitlinie Invasive Beatmung (AWMF 001-021, 2025) und Hausstandard prüfen',
      'Geschlossenes Absaugen durch Auszubildende im 3. Drittel mit Anleitung (Katalog P3) bestätigen',
      'Propofol-Dosis (2 %, 80 kg, 4 ml/h = 1 mg/kg/h; Höchstdosis 4 mg/kg/h) und die Remonstration bei 40 ml/h prüfen',
      'Sedierungsziel RASS 0 bis −1 und Analgesie zuerst (S3-Leitlinie DAS 2020) im Text korrekt?',
      'Modell: Abfall der SpO₂ bei Diskonnektion, Spitzendruck bei Sekret und Aufwachen nach leerem Perfusor plausibel?',
    ],
  },
  quellen: [
    { id: 's3-beatmung', titel: 'S3-Leitlinie Invasive Beatmung und Einsatz extrakorporaler Verfahren bei akuter respiratorischer Insuffizienz (AWMF 001-021), 2025', fundstelle: 'Überarbeitete Fassung 2025; Alarmvorgehen (DOPES) ist Lehrbuch- und Hausstandard' },
    { id: 's3-das', titel: 'S3-Leitlinie Analgesie, Sedierung und Delirmanagement in der Intensivmedizin (DAS-Leitlinie 2020, AWMF 001-012)', fundstelle: 'Zielsedierung RASS 0/−1, Analgesie vor Sedierung' },
    { id: 'krinko-vap', titel: 'KRINKO: Prävention der nosokomialen beatmungsassoziierten Pneumonie (2013)', fundstelle: 'Geschlossenes Absaugen, Oberkörperhochlagerung' },
    { id: 'fi-propofol', titel: 'Fachinformation Propofol 2 %', fundstelle: 'Sedierung beatmeter Patienten: bis 4 mg/kg/h' },
  ],

  person: {
    name: 'Herr Fuchs',
    alter: { jahre: 67 },
    geschlecht: 'm',
    biografie: ['verheiratet, die Ehefrau ist Lehrerin', 'Hobbygärtner, züchtet Tomaten'],
    diagnosenBekannt: ['Peritonitis nach Darmperforation, Laparotomie vorgestern', 'COPD GOLD 2', 'arterielle Hypertonie'],
    medikamentePlan: ['Propofol 2 % 4 ml/h', 'Sufentanil 5 µg/ml 5 ml/h', 'Noradrenalin 0,1 mg/ml 3 ml/h', 'Piperacillin/Tazobactam 4,5 g i. v. alle 8 h'],
    allergien: ['keine bekannt'],
    gewichtKg: 80,
  },
  medien: { raum: '15_intensiv_beatmung' },
  uebernahme: 'Pfleger Ben: „Herr Fuchs, 67, vorgestern Laparotomie bei Peritonitis, seitdem beatmet, Tubus 8,0 bei 23 cm Zahnreihe. Druckkontrolliert, FiO₂ 40 %, PEEP 8. Propofol 4 und Sufentanil 5 ml/h, Noradrenalin 3 ml/h, MAP über 65. Er war heute Nacht ruhig, RASS minus eins. Die Propofol-Spritze ist bald leer, ich hab die neue noch nicht aufgezogen …“',
  startUhrzeit: '06:10',

  start: {
    grund: { gefaesstonus: 0.8, gasaustausch: 0.85, atemarbeit: 1.1, temperatur: 38.1, sedierung: 0.26, schmerz: 2, angst: 0.1, laktat: 1.8, kalium: 4.0, einfuhrMl: 0, ausfuhrMl: 0 },
    treiber: [],
    module: {
      beatmung: { fio2: 0.4, peep: 8, af: 16, vt: 480 },
      perfusoren: [
        { ...PROPOFOL, mlProH: 4 },
        { id: 'sufentanil', wirkstoff: 'sufentanil', konzentration: '250 µg/50 ml', mgProMl: 0.005, mlProH: 5 },
        { id: 'na', wirkstoff: 'noradrenalin', konzentration: '5 mg/50 ml', mgProMl: 0.1, mlProH: 3 },
      ],
      arteriell: true, bilanz: true,
    },
    bild: { haltung: 'liegt', haut: 'rosig', mimik: 'schlaefrig', geraete: ['beatmung', 'arterie', 'zvk', 'monitor'] },
    sichtbar: ['hf', 'spo2', 'artSys', 'artDia', 'map', 'etco2', 'af', 'ppeak', 'rhythmus'],
    anordnungen: ['an-sedierung'],
    flags: ['beatmet', 'arterie-liegt', 'perfusor-laeuft', 'zugang-liegt', 'zvk-liegt'],
  },

  massnahmen: [
    // Gespräch & Beobachten
    'kommunikation-tubus', 'beatmung-beobachten', 'dopes-pruefen', 'atemgeraeusche-hoeren', 'rass-einschaetzen', 'schmerz-bps', 'delir-cam-icu', 'haut-beobachten',
    // Akut
    'hilfe-holen', 'beatmung-diskonnektion-beheben', 'handbeatmung', 'alarm-stummschalten', 'haende-fixieren', 'oberkoerper-hoch',
    // Messen
    'bga-abnehmen-arteriell', 'bga-messen-lesen', 'cuffdruck-messen', 'kurve-lesen', 'bilanz-fuehren',
    // Versorgen
    'geschlossen-absaugen', 'perfusor-wechseln', 'sufentanil-7', 'propofol-40', 'mundpflege-beatmet',
    // Melden
    'pflegebericht',
  ],
  massnahmenZusatz: [
    aus('beatmung-beobachten', { id: 'dopes-pruefen', name: 'Systematisch prüfen (DOPES): Tubuslage, Verlegung, Pneumothorax, Gerät, Luftfalle', zeitbedarfSekunden: 45 }),
    aus('beutel-maske-beatmen', { id: 'handbeatmung', name: 'Vom Gerät nehmen und mit dem Beatmungsbeutel (O₂, PEEP-Ventil) über den Tubus beatmen', spur: 'B',
      modul: { beatmung: { fio2: 1, peep: 5, af: 14, vt: 500 }, stoerungAus: ['diskonnektion'] }, setzt: ['handbeatmet'] }),
    aus('beatmung-diskonnektion-beheben', { modul: DICHT }),
    aus('beatmung-beobachten', { id: 'alarm-stummschalten', name: 'Alarm stummschalten und die Übergabe fortsetzen', zeitbedarfSekunden: 10, setzt: ['alarm-stumm'] }),
    aus('fem-anlegen', { id: 'haende-fixieren', name: 'Beide Hände am Bett fixieren, damit er den Tubus nicht zieht' }),
    aus('perfusor-wechseln', { name: 'Neue Propofol-Spritze aufziehen und ohne Unterbrechung wechseln (4 ml/h)', modul: { perfusor: { ...PROPOFOL, mlProH: 4 } }, setzt: ['spritze-neu'] }),
    aus('perfusor-wechseln', { id: 'sufentanil-7', name: 'Sufentanil-Laufrate auf 7 ml/h stellen', zeitbedarfSekunden: 30, modul: { perfusor: { id: 'sufentanil', mlProH: 7 } } }),
    aus('perfusor-wechseln', { id: 'propofol-40', name: 'Propofol-Laufrate auf 40 ml/h stellen', zeitbedarfSekunden: 30, modul: { perfusor: { id: 'propofol', mlProH: 40 } } }),
    aus('geschlossen-absaugen', { voraussetzung: undefined }),
  ],

  akte: {
    aufnahmegrund: 'Übernahme aus dem OP vorgestern: Laparotomie mit Übernähung einer Sigmaperforation bei Divertikulitis, kotige Peritonitis, Hartmann-Situation. Postoperativ beatmet, Katecholaminbedarf.',
    anamnese: ['COPD GOLD 2, Ex-Raucher seit 5 Jahren', 'Hypertonie', 'Divertikulitis 2024 konservativ behandelt'],
    diagnosen: [
      { text: 'Kotige Peritonitis bei Sigmaperforation, Hartmann-OP', icd: 'K57.22', seit: 'vorgestern' },
      { text: 'Septischer Schock, rückläufig', icd: 'R57.2', seit: 'vorgestern' },
      { text: 'COPD GOLD 2', icd: 'J44.89', seit: '2019' },
    ],
    medikation: [
      { id: 'mp-propofol', wirkstoff: 'Propofol 2 %', staerke: '1000 mg/50 ml', form: 'Perfusor', schema: 'kontinuierlich', hinweis: 'Ziel RASS 0 bis −1, Laufrate nach Anordnung 2–8 ml/h.' },
      { id: 'mp-sufentanil', wirkstoff: 'Sufentanil', staerke: '250 µg/50 ml', form: 'Perfusor', schema: 'kontinuierlich', hinweis: 'Ziel BPS ≤ 5.' },
      { id: 'mp-noradrenalin', wirkstoff: 'Noradrenalin', staerke: '5 mg/50 ml', form: 'Perfusor', schema: 'kontinuierlich', hinweis: 'Ziel MAP ≥ 65 mmHg.' },
      { id: 'mp-piptaz', wirkstoff: 'Piperacillin/Tazobactam', staerke: '4,5 g', form: 'i. v.', schema: '1-1-1-0', zuletzt: 'heute 06:00', hinweis: '6, 14, 22 Uhr.' },
    ],
    vorwerte: [
      { zeit: 'gestern 18:00', vorH: 12, werte: { rrSys: 112, rrDia: 58, hf: 92, spo2: 96, temp: 38.4 }, kuerzel: 'SD' },
      { zeit: 'heute 02:00', vorH: 4, werte: { rrSys: 118, rrDia: 60, hf: 88, spo2: 96, temp: 38.0 }, kuerzel: 'ND' },
    ],
    pflegebericht: [
      { zeit: 'heute 02:00', wer: 'Nachtdienst', text: 'RASS −1, BPS 4. Endotracheal abgesaugt, wenig weißliches Sekret. Lagerung 30° rechts. Ehefrau hat um 22 Uhr angerufen, Auskunft gegeben.' },
      { zeit: 'heute 05:30', wer: 'Nachtdienst', text: 'Noradrenalin von 4 auf 3 ml/h reduziert (MAP 72). Propofol-Spritze zu etwa 90 % leer, Wechsel bei Übergabe.' },
    ],
    aerztlicheAnordnungen: [
      { zeit: 'gestern 08:00', wer: 'Dr. Lorenz', text: 'Propofol 2 % 2–8 ml/h, Sufentanil 3–10 ml/h nach RASS/BPS. Ziel RASS 0 bis −1, BPS ≤ 5. Analgesie vor Sedierung. Spritzenwechsel durch Pflege.' },
      { zeit: 'gestern 08:00', wer: 'Dr. Lorenz', text: 'Beatmung PCV, FiO₂ nach SpO₂ 92–96 %, PEEP 8. Absaugen nach Bedarf geschlossen.' },
    ],
    labor: [
      { name: 'Leukozyten', wert: '16,2', einheit: '/nl', norm: '4–10', datum: 'heute 04:00', auffaellig: true },
      { name: 'CRP', wert: '212', einheit: 'mg/l', norm: 'unter 5', datum: 'heute 04:00', auffaellig: true },
      { name: 'Laktat', wert: '1,9', einheit: 'mmol/l', norm: 'unter 2', datum: 'heute 04:00' },
    ],
    assessments: [
      { name: 'RASS', wert: '−1', datum: 'heute 02:00' },
      { name: 'BPS', wert: '4', datum: 'heute 02:00' },
      { name: 'CAM-ICU', wert: 'negativ (RASS −1)', datum: 'heute 02:00' },
    ],
    rechtliches: ['Vorsorgevollmacht für die Ehefrau Martina Fuchs, Auskunft erlaubt.', 'Keine Patientenverfügung.'],
  },

  befunde: [
    { massnahme: 'beatmung-beobachten', varianten: [
      { wenn: { alle: [SEKRET_DA, { nicht: ABGESAUGT }] }, text: 'Brodeln im Tubus, Spitzendruck {ppeak} cmH₂O, die Kurve zeigt Zacken in der Ausatmung. SpO₂ {spo2} %.', zeigt: ['ppeak', 'spo2'] },
      { wenn: { nicht: BEHOBEN }, text: 'Der Brustkorb hebt sich nur wenig, das Gerät meldet „Minutenvolumen niedrig, Leckage“, etCO₂ {etco2} mmHg, SpO₂ {spo2} %. Am Y-Stück zischt es.', zeigt: ['etco2', 'spo2'] },
      { text: 'Thorax hebt sich beidseits gleichmäßig, Spitzendruck {ppeak} cmH₂O, SpO₂ {spo2} %, etCO₂ {etco2} mmHg.', zeigt: ['ppeak', 'spo2', 'etco2'] },
    ] },
    { massnahme: 'dopes-pruefen', varianten: [
      { wenn: { nicht: BEHOBEN }, text: 'D: Tubus bei 23 cm, Cuff geblockt. O: keine Verlegung. P: beidseits Atemgeräusch, aber leise. E: Verbindung zwischen Gänsegurgel und Y-Stück gelockert, es zischt. S: keine Luftfalle.' },
      { wenn: { alle: [SEKRET_DA, { nicht: ABGESAUGT }] }, text: 'D: Tubus bei 23 cm. O: Brodeln, Sekret im Tubus. P: beidseits Atemgeräusch mit Rasseln. E: System dicht. S: keine Luftfalle.' },
      { text: 'Tubus bei 23 cm, kein Sekret, beidseits Atemgeräusch, System dicht.' },
    ] },
    { massnahme: 'atemgeraeusche-hoeren', varianten: [
      { wenn: { alle: [SEKRET_DA, { nicht: ABGESAUGT }] }, text: 'Grobblasige Rasselgeräusche beidseits, zentral betont.' },
      { text: 'Beidseits belüftet, basal etwas leiser.' },
    ] },
    { massnahme: 'beatmung-diskonnektion-beheben', varianten: [{ text: 'Mit der Praxisanleitung: Verbindung am Y-Stück fest zusammengesteckt, Dichtigkeit geprüft. Das Gerät beatmet wieder, die Kurve ist normal.' }] },
    { massnahme: 'handbeatmung', varianten: [{ text: 'Mit dem Beutel und 100 % O₂ über den Tubus beatmet. Der Brustkorb hebt sich, die Sättigung steigt.' }] },
    { massnahme: 'geschlossen-absaugen', varianten: [{ text: 'Mit der Praxisanleitung geschlossen abgesaugt: reichlich zähes, gelbliches Sekret. Danach ruhige Kurve, Spitzendruck {ppeak} cmH₂O.', zeigt: ['ppeak', 'spo2'] }] },
    { massnahme: 'rass-einschaetzen', varianten: [
      { wenn: { wert: 'rass', vergleich: '>=', grenze: 1 }, text: 'RASS {rass}: Augen offen, unruhig, greift zum Tubus, presst gegen das Gerät.', zeigt: ['rass'] },
      { text: 'RASS {rass}.', zeigt: ['rass'] },
    ] },
    { massnahme: 'schmerz-bps', varianten: [
      { wenn: { wert: 'rass', vergleich: '>=', grenze: 1 }, text: 'BPS: Gesicht angespannt (3), Arme gebeugt (3), hustet gegen das Gerät (2). BPS 8, Schmerz und Unruhe zu stark.' },
      { wenn: { alle: [SPRITZE_LEER, { nicht: { getan: 'sufentanil-7' } }] }, text: 'BPS: Stirn gerunzelt (2), Arme zeitweise gebeugt (2), hustet immer wieder gegen das Gerät (2). BPS 6, Schmerz nicht ausreichend behandelt.' },
      { text: 'BPS: Gesicht entspannt, Arme ruhig, toleriert die Beatmung. BPS 4.' },
    ] },
    { massnahme: 'delir-cam-icu', varianten: [{ text: 'Mit RASS −2 und tiefer nicht beurteilbar; ab RASS −1 erneut prüfen.' }] },
    { massnahme: 'haut-beobachten', varianten: [{ text: 'Warm, leicht feucht, Lippen rosig.' }] },
    { massnahme: 'kommunikation-tubus', varianten: [{ text: 'Du sprichst ihn an, erklärst, dass er beatmet wird und der Schlauch hilft. Er nickt auf Ja/Nein-Fragen, hat aber Angst.' }] },
    { massnahme: 'bga-abnehmen-arteriell', varianten: [{ text: 'BGA aus der Arterie luftfrei abgenommen, System gespült.' }] },
    { massnahme: 'bga-messen-lesen', varianten: [{ text: 'BGA: pH {ph}, paCO₂ {paco2} mmHg, paO₂ {pao2} mmHg, HCO₃⁻ {hco3}, Laktat {laktat} mmol/l.', zeigt: ['ph', 'paco2', 'pao2', 'hco3', 'laktat'] }] },
    { massnahme: 'cuffdruck-messen', varianten: [{ text: 'Cuffdruck 26 cmH₂O (Ziel 20–30).' }] },
    { massnahme: 'kurve-lesen', varianten: [{ text: 'Anordnung: Propofol 2 % 2–8 ml/h, Sufentanil 3–10 ml/h nach RASS/BPS, Ziel RASS 0 bis −1, Analgesie zuerst. Vorsorgevollmacht: Ehefrau, Auskunft erlaubt.' }] },
    { massnahme: 'bilanz-fuehren', varianten: [{ text: 'Urin {urinMlH} ml/h, Bilanz seit Dienstbeginn {bilanzMl} ml.', zeigt: ['urinMlH', 'bilanzMl'] }] },
    { massnahme: 'perfusor-wechseln', varianten: [{ text: 'Mit der Praxisanleitung neue Spritze Propofol 2 % beschriftet, Leitung entlüftet, gewechselt, 4 ml/h. Pause unter einer Minute.' }] },
    { massnahme: 'mundpflege-beatmet', varianten: [{ text: 'Mundpflege mit Zahnbürste, Mundhöhle feucht, Lippen gepflegt.' }] },
  ],

  gespraech: [
    { id: 'g-ben-ursache', frage: 'Ben, hilf mir: Was war an der Beatmung zuletzt? Wurde umgelagert?', an: 'kollegin', kompetenzbereiche: ['II'],
      antwort: [{ text: 'Ben: „Ich hab ihn um halb sechs auf die rechte Seite gedreht. Kann sein, dass dabei am Y-Stück was gezogen hat.“' }],
      fakten: ['umgelagert 05:30'] },
    { id: 'g-ehefrau', frage: 'Ehefrau am Telefon: Wie geht es ihm? Sie habe heute Nacht schlecht geschlafen.', an: 'angehoerige', kanal: 'telefon', kompetenzbereiche: ['II', 'IV'],
      nurWenn: { ab: 1200 },
      schweigepflicht: { erlaubtWenn: { getan: 'kurve-lesen' }, fehlerText: 'Du hast am Telefon Auskunft gegeben, ohne die Berechtigung zu prüfen. Herr Fuchs kann nicht einwilligen. Erst in der Akte die Vollmacht prüfen und die Anruferin identifizieren (Rückruf, Kennwort).' },
      antwort: [{ text: 'Frau Fuchs: „Danke, dass Sie so offen sind. Ich komme um zehn. Darf ich ihm dann etwas vorlesen?“', setzt: ['ehefrau-informiert'] }],
      fakten: ['nachts stabil', 'kurz Alarm, sofort behoben', 'Ärztin spricht bei der Visite mit ihr'] },
  ],

  sbar: [
    { id: 's-unruhig', teil: 'S', text: 'Herr Fuchs, Bett 4, beatmet, war eben wach, hat gegen das Gerät gepresst und zum Tubus gegriffen.', art: 'kern', bekanntWenn: { getan: 'rass-einschaetzen' } },
    { id: 'b-propofol-leer', teil: 'B', text: 'Die Propofol-Spritze ist leer gelaufen, die neue läuft wieder mit 4 ml/h.', art: 'kern', bekanntWenn: SPRITZE_NEU },
    { id: 'b-laparotomie', teil: 'B', text: 'Tag 2 nach Laparotomie bei Peritonitis, Noradrenalin 3 ml/h.', art: 'hilfreich' },
    { id: 'b-tomaten', teil: 'B', text: 'Er züchtet Tomaten.', art: 'ablenker' },
    { id: 'a-rass-bps', teil: 'A', text: 'Jetzt wieder ruhiger, aber BPS 6, er hustet immer wieder gegen das Gerät.', art: 'kern', bekanntWenn: { alle: [{ getan: 'rass-einschaetzen' }, { getan: 'schmerz-bps' }] } },
    { id: 'a-alarm', teil: 'A', text: 'Diskonnektion bei der Übergabe und Sekretverlegung, beides behoben.', art: 'hilfreich', bekanntWenn: { alle: [BEHOBEN, ABGESAUGT] } },
    { id: 'a-rass-ziel', teil: 'A', text: 'Nach der Anpassung RASS −1, BPS 4, toleriert die Beatmung.', art: 'kern', bekanntWenn: { alle: [{ getan: 'sufentanil-7' }, { getan: 'schmerz-bps' }] } },
    { id: 'a-alles-gut', teil: 'A', text: 'Sonst alles unauffällig.', art: 'falsch' },
    { id: 'r-analgesie', teil: 'R', text: 'Brauchen wir mehr Analgesie und Sedierung? Bitte kommen Sie.', art: 'kern' },
  ],

  anordnungen: [
    { id: 'an-sedierung', massnahme: 'perfusor-wechseln', text: 'Sedierung laut Plan: Propofol 2 % 2–8 ml/h nach RASS, Spritzenwechsel durch die Pflege.' },
    { id: 'an-propofol-40', massnahme: 'propofol-40', text: 'Propofol auf 40 ml/h.',
      fehlerhaft: {
        warum: '40 ml/h Propofol 2 % sind 800 mg/h, bei 80 kg also 10 mg/kg/h. Das ist mehr als das Doppelte der Höchstdosis (4 mg/kg/h) und senkt den Blutdruck gefährlich. Wahrscheinlich ein Hör- oder Kommafehler.',
        korrektur: 'Propofol bleibt bei 4, er hustet ja vor Schmerz gegen das Gerät. Stellen Sie Sufentanil auf 7 ml/h, den Bolus gebe ich selbst. Sagen Sie mir in zehn Minuten RASS und BPS.',
        ersatz: 'an-sufentanil-7',
      } },
    { id: 'an-sufentanil-7', massnahme: 'sufentanil-7', text: 'Sufentanil auf 7 ml/h (Analgesie zuerst), Propofol bleibt bei 4 ml/h. RASS und BPS nach zehn Minuten melden.' },
  ],

  arzt: {
    name: 'Dr. Lorenz (Intensivstation)',
    erreichbar: 'vor-ort',
    kanaele: ['telefon', 'messenger'],
    regeln: [
      { id: 'r-sedierung', wenn: { gemeldet: ['s-unruhig', 'a-rass-bps', 'b-propofol-leer'] },
        antwort: '„Ich bin noch im Schockraum. Er ist zu flach. Stellen Sie Propofol auf vierzig.“',
        anordnungen: ['an-propofol-40'], setzt: ['sedierung-gemeldet'], auftraege: ['af-rass'] },
      { id: 'r-rass-frage', wenn: { gemeldet: ['s-unruhig'] },
        antwort: '„Okay.“',
        rueckfrage: { text: '„Wie sind RASS und BPS, und läuft die Sedierung überhaupt?“', erwartet: ['a-rass-bps', 'b-propofol-leer'] } },
      { wenn: { gemeldet: ['a-alles-gut'] }, antwort: '„Gut. Dann bis zur Visite.“' },
    ],
    auftraege: [
      { id: 'af-rass', text: 'RASS und BPS zehn Minuten nach der Anpassung melden', erledigt: { alle: [{ getan: 'rass-einschaetzen' }, { getan: 'schmerz-bps' }] },
        meldung: ['a-rass-ziel'], meldenBinnenSek: 1200,
        folge: [{ wenn: { ab: 0 }, antwort: '„Sehr gut. So lassen. Ich schaue nach der Visite noch mal nach der Beatmung.“', setzt: ['rass-gemeldet'] }] },
    ],
  },
  team: { kollegin: 'Ben (Nachtdienst, übergibt)', weitere: { angehoerige: 'Ehefrau Martina Fuchs (Vorsorgevollmacht)' } },

  ereignisse: [
    // Leck am Y-Stück nach der Lagerung, wird ohne Eingreifen größer (das Lernmodell kennt keinen O₂-Speicher, darum in Stufen)
    { id: 'e-diskonnektion', art: 'geraet', wann: DISKONNEKTIERT,
      text: 'Mitten in der Übergabe: Das Beatmungsgerät piept laut, „Minutenvolumen niedrig, Leckage“. Das etCO₂ steigt.',
      modul: { beatmung: { vt: 220, fio2: 0.3 } } },
    { id: 'e-leck-2', art: 'geraet', wann: { ab: 90 }, verhindertDurch: { eine: [BEHOBEN, HANDBEATMET] },
      text: 'Die Sättigung fällt, der Monitor alarmiert gelb.', modul: { beatmung: { vt: 160 } } },
    { id: 'e-leck-3', art: 'geraet', wann: { ab: 150 }, verhindertDurch: { eine: [BEHOBEN, HANDBEATMET] },
      text: 'Sättigung deutlich unter 90 %, Herr Fuchs wird grau im Gesicht.', modul: { beatmung: { vt: 130 } }, bild: { haut: 'zyanotisch' } },
    { id: 'e-leck-4', art: 'geraet', wann: { ab: 240 }, verhindertDurch: { eine: [BEHOBEN, HANDBEATMET] },
      text: 'Die Verbindung rutscht ganz ab. Kein Atemzug mehr am Gerät, der Puls wird langsam.', modul: { stoerungAn: ['diskonnektion'] } },
    { id: 'e-sekret', art: 'geraet', wann: SEKRET_DA,
      text: 'Der Spitzendruck steigt, die Beatmung alarmiert „Druck hoch“. Herr Fuchs hustet, im Tubus brodelt es.',
      modul: { stoerungAn: ['sekret'] } },
    { id: 'e-spritze-leer', art: 'geraet', wann: SPRITZE_LEER,
      text: 'Die Propofol-Pumpe piept: „Spritze leer“. Kurz darauf öffnet Herr Fuchs die Augen, wird unruhig und greift zum Tubus.',
      modul: { perfusor: { id: 'propofol', mlProH: 0 } },
      entscheidung: [
        { id: 'w-halten', text: 'Seine Hand halten, ihn mit Namen ansprechen, erklären, Hilfe rufen', wertung: 'gut', setzt: ['hand-gehalten'],
          warum: 'Orientierung und Nähe beruhigen oft schon. Eine Hand hält den Arm, die Kollegin holt die neue Spritze. Fixieren braucht eine Anordnung und ist das letzte Mittel.' },
        { id: 'w-fixieren', text: 'Sofort beide Hände fixieren', wertung: 'falsch',
          warum: 'Eine Fixierung ist eine freiheitsentziehende Maßnahme und braucht ärztliche Anordnung und Begründung. Sie ersetzt keine Analgesie und Sedierung.' },
        { id: 'w-bolus', text: 'Propofol per Bolus aus der alten Spritze geben', wertung: 'gefaehrlich',
          warum: 'Ein Bolus ohne Anordnung kann den Blutdruck stark senken. Die Pflege wechselt die Spritze und meldet.' },
      ] },
  ],

  pa: {
    name: 'Praxisanleiterin Svenja Kraus (Fachpflege Intensiv)',
    hilfen: [
      { wenn: { nicht: BEHOBEN }, impuls: 'Was schaust du dir bei einem Beatmungsalarm zuerst an?', tipp: 'Den Patienten: hebt sich der Brustkorb? Dann das System mit DOPES von Patient zu Gerät.' },
      { wenn: { alle: [SEKRET_DA, { nicht: ABGESAUGT }] }, impuls: 'Druck hoch, Brodeln, Sättigung sinkt: woran denkst du?', tipp: 'An Sekret im Tubus. Geschlossen absaugen, ich bin dabei.' },
      { wenn: { alle: [SPRITZE_LEER, { nicht: SPRITZE_NEU }] }, impuls: 'Warum wird er gerade wach?', tipp: 'Die Propofol-Spritze ist leer. Neue Spritze nach Anordnung ohne Pause wechseln.' },
      { wenn: { auftrag: 'af-rass', status: 'offen' }, impuls: 'Was wollte Dr. Lorenz noch von dir wissen?', tipp: 'RASS und BPS zehn Minuten nach der Anpassung.' },
      { impuls: 'Stimmen die Laufraten mit der Anordnung überein?', tipp: 'Rechne nach: ml/h × mg/ml ÷ kg = mg/kg/h. Propofol höchstens 4 mg/kg/h.' },
    ],
  },

  bewertung: {
    pflicht: [
      { id: 'p-patient-zuerst', text: 'Beim Alarm zuerst den Patienten und die Beatmung angesehen', gewicht: 2, kompetenzbereiche: ['I'], klinisch: ['abcde', 'geraete'],
        erfuellt: { getan: 'beatmung-beobachten', bis: 120 }, warum: 'Der Alarm sagt nur, dass etwas nicht stimmt. Thoraxbewegung, Sättigung und Kurve zeigen, wie dringend es ist.' },
      { id: 'p-dopes', text: 'Ursache systematisch gesucht (DOPES)', gewicht: 2, kompetenzbereiche: ['I', 'V'], klinisch: ['geraete'],
        erfuellt: { getan: 'dopes-pruefen' }, warum: 'Systematisch von Patient zu Gerät findet man die Ursache, ohne etwas zu übersehen.' },
      { id: 'p-diskonnektion', text: 'Diskonnektion innerhalb von 3 Minuten behoben', gewicht: 3, kompetenzbereiche: ['I'], klinisch: ['geraete', 'zeit'],
        erfuellt: { getan: 'beatmung-diskonnektion-beheben', bis: 180 }, warum: 'Ohne Beatmung fällt die Sättigung binnen Minuten, Hypoxie bremst das Herz.' },
      { id: 'p-absaugen', text: 'Sekretverlegung erkannt und geschlossen abgesaugt', gewicht: 3, kompetenzbereiche: ['I'], klinisch: ['abcde', 'geraete'],
        erfuellt: ABGESAUGT, warum: 'Sekret verlegt den Tubus teilweise: Spitzendruck steigt, Volumen sinkt, Sättigung fällt.' },
      { id: 'p-spritze', text: 'Leere Propofol-Spritze nach Anordnung gewechselt', gewicht: 2, kompetenzbereiche: ['I'], klinisch: ['medikamente'],
        erfuellt: SPRITZE_NEU, warum: 'Unterbrechungen der Sedierung führen zu Aufwachen, Stress, Tubusgefahr.' },
      { id: 'p-einschaetzen', text: 'Sedierung und Schmerz mit RASS und BPS eingeschätzt', gewicht: 2, kompetenzbereiche: ['I', 'V'], klinisch: ['abcde'],
        erfuellt: { alle: [{ getan: 'rass-einschaetzen' }, { getan: 'schmerz-bps' }] }, warum: 'Erst einschätzen, dann anpassen: Analgesie vor Sedierung (DAS-Leitlinie).' },
      { id: 'p-remonstration', text: 'Unplausible Propofol-Laufrate (40 ml/h) hinterfragt', gewicht: 3, kompetenzbereiche: ['III', 'IV'], klinisch: ['medikamente'],
        erfuellt: { alle: [{ flag: 'remonstriert:an-propofol-40' }, { nicht: PROPOFOL_ZU_HOCH }] }, warum: 'Laufraten immer in Dosis umrechnen. 40 ml/h wären mehr als das Doppelte der Höchstdosis.' },
      { id: 'p-rueckmeldung', text: 'Rückauftrag RASS/BPS gemeldet', gewicht: 2, kompetenzbereiche: ['II'], klinisch: ['team'],
        erfuellt: { auftrag: 'af-rass', status: 'gemeldet' }, warum: 'Die Ärztin steuert die Sedierung nach deiner Einschätzung.' },
      { id: 'p-ehefrau', text: 'Ehefrau nach Prüfung der Vollmacht informiert', gewicht: 1, kompetenzbereiche: ['II', 'IV'],
        erfuellt: { flag: 'ehefrau-informiert' }, warum: 'Telefonauskunft nur an Berechtigte, ehrlich und ohne ärztliche Befunde vorwegzunehmen.' },
      { id: 'p-doku', text: 'Alarmereignisse und Maßnahmen dokumentiert', gewicht: 1, kompetenzbereiche: ['I', 'IV'], klinisch: ['geraete'],
        erfuellt: { alle: [{ dokumentiert: 'befund:beatmung-diskonnektion-beheben' }, { eine: [{ dokumentiert: 'massnahme:geschlossen-absaugen' }, { dokumentiert: 'a-alarm' }] }] }, warum: 'Gerätestörungen und Absaugbefunde gehören in die Dokumentation (Medizinproduktesicherheit, Verlauf).' },
    ],
    fehler: [
      { id: 'f-stumm', text: 'Alarm ohne Ursachenklärung stummgeschaltet', wenn: { flag: 'alarm-stumm' }, schwere: 'schwer', kompetenzbereiche: ['I', 'III'],
        warum: 'Ein stummgeschalteter Alarm behebt nichts. Die Sättigung fällt weiter, ohne dass es jemand hört.' },
      { id: 'f-propofol-40', text: 'Propofol auf 40 ml/h gestellt', wenn: PROPOFOL_ZU_HOCH, schwere: 'schwer', kompetenzbereiche: ['I', 'III', 'IV'],
        folge: { text: 'Der arterielle Druck fällt binnen Minuten, MAP unter 55. Svenja stellt die Pumpe sofort zurück.' },
        warum: '10 mg/kg/h Propofol: weit über der Höchstdosis. Laufraten immer umrechnen und bei Zweifel nachfragen.' },
      { id: 'f-fixiert', text: 'Ohne Anordnung fixiert', wenn: { eine: [{ getan: 'haende-fixieren' }, { getan: 'wahl:e-spritze-leer:w-fixieren' }] }, schwere: 'mittel', kompetenzbereiche: ['IV', 'II'],
        warum: 'Fixierung ist eine freiheitsentziehende Maßnahme (§ 1831 BGB): ärztliche Anordnung, Begründung, Überwachung.' },
      { id: 'f-bolus', text: 'Propofol-Bolus ohne Anordnung', wenn: { getan: 'wahl:e-spritze-leer:w-bolus' }, schwere: 'schwer', kompetenzbereiche: ['I', 'III'],
        folge: { text: 'Der Blutdruck sackt ab, der Monitor alarmiert rot.' }, warum: 'Boli nur nach ärztlicher Anordnung.' },
      { id: 'f-spaet', text: 'Diskonnektion nicht in 3 Minuten behoben', wenn: { nichtGetan: 'beatmung-diskonnektion-beheben', bis: 180 }, schwere: 'mittel', kompetenzbereiche: ['I'],
        warum: 'Bei Beatmungsalarm mit fallender Sättigung zählt jede Minute. Unklare Ursache: vom Gerät nehmen und mit dem Beutel beatmen.' },
    ],
    ende: [
      { wenn: { alle: [{ flag: 'rass-gemeldet' }, ABGESAUGT, BEHOBEN] }, text: 'Herr Fuchs liegt ruhig, toleriert die Beatmung, die Werte sind stabil. Die Übergabe geht weiter.', ausgang: 'stabil' },
      { wenn: { alle: [{ wert: 'spo2', vergleich: '<', grenze: 60 }, { nichtGetan: 'beatmung-diskonnektion-beheben', bis: 360 }, { nicht: HANDBEATMET }] }, text: 'Schwere Hypoxie. Die Ärztin und das Team übernehmen.', ausgang: 'verschlechtert' },
    ],
  },

  pflegebedarf: {
    probleme: [
      { id: 'pb-beatmung', text: 'Beatmungspflicht mit Gefahr der Diskonnektion und Sekretverlegung', richtig: true, prioritaet: 1, warum: 'Lebensnotwendig: Alarmgrenzen, Beutel und Absaugung am Bett.' },
      { id: 'pb-sedierung', text: 'Unzureichende Analgesie und Sedierung mit Gefahr der Selbstextubation', richtig: true, prioritaet: 1, warum: 'RASS/BPS regelmäßig, Perfusoren lückenlos.' },
      { id: 'pb-vap', text: 'Infektionsgefahr: beatmungsassoziierte Pneumonie', richtig: true, prioritaet: 2, warum: 'Geschlossenes Absaugen, Oberkörper 30°, Mundpflege (KRINKO).' },
      { id: 'pb-angehoerige', text: 'Sorge der Ehefrau', richtig: true, prioritaet: 3, warum: 'Information, Besuch, Einbeziehen.' },
      { id: 'pb-obstipation', text: 'Obstipation durch Opioide', richtig: false, warum: 'Hat ein Stoma nach Hartmann-OP, jetzt nicht das Problem.' },
    ],
    ziele: [
      { id: 'z-beatmung', text: 'Beatmung dicht und wirksam, SpO₂ 92–96 %, Spitzendruck stabil', passtZu: ['pb-beatmung'], richtig: true },
      { id: 'z-rass', text: 'RASS 0 bis −1, BPS ≤ 5, kein Ziehen am Tubus', passtZu: ['pb-sedierung'], richtig: true },
      { id: 'z-vap', text: 'Keine Pneumonie unter Beatmung', passtZu: ['pb-vap'], richtig: true },
      { id: 'z-extubiert', text: 'Herr Fuchs ist heute Mittag extubiert', passtZu: ['pb-beatmung'], richtig: false },
    ],
  },
  verdacht: {
    optionen: [
      { id: 'v-sekret', text: 'Sekretverlegung des Tubus nach Diskonnektion bei der Lagerung, dann Unruhe durch leeren Sedierungsperfusor', richtig: true },
      { id: 'v-pneu', text: 'Spannungspneumothorax', richtig: false },
      { id: 'v-dislokation', text: 'Tubus disloziert', richtig: false },
    ],
    begruendungen: [
      { id: 'bg-zischen', text: 'Zischen am Y-Stück, nach Zusammenstecken sofort normale Kurve', stuetzt: ['v-sekret'] },
      { id: 'bg-brodeln', text: 'Brodeln, Spitzendruck hoch, nach Absaugen normal', stuetzt: ['v-sekret'] },
      { id: 'bg-spritze', text: 'Spritze leer, dann wach und unruhig', stuetzt: ['v-sekret'] },
      { id: 'bg-tubus', text: 'Tubus bei 23 cm, unverändert', stuetzt: [] },
    ],
  },
  leitfaden: [
    { titel: 'Beatmungsalarm: Patient vor Gerät', quellen: ['s3-beatmung'],
      text: 'Zuerst den Patienten ansehen (Thoraxbewegung, Hautfarbe, Sättigung, etCO₂), dann von Patient zu Gerät prüfen. DOPES: Dislokation des Tubus, Obstruktion (Sekret, Abknicken), Pneumothorax, Equipment (Diskonnektion, Gerät), Stacking (Luftfalle bei COPD). Bei unklarer Ursache und fallender Sättigung: vom Gerät nehmen, mit Beutel und 100 % O₂ beatmen, Hilfe holen.' },
    { titel: 'Alarme',
      text: 'Alarme nie ohne Ursachenklärung stummschalten. Alarmgrenzen individuell und sinnvoll einstellen, Alarmmüdigkeit vermeiden. Übergaben am Bett schließen den Blick auf Monitor und Beatmung ein.' },
    { titel: 'Geschlossenes Absaugen', quellen: ['krinko-vap'],
      text: 'Nach Bedarf (Brodeln, Druckanstieg, Sägezahn in der Kurve, Sättigungsabfall), nicht nach Uhr. Geschlossenes System senkt Kontamination und PEEP-Verlust. Danach Wirkung prüfen (Druck, Kurve, Sättigung).' },
    { titel: 'Analgesie, Sedierung, Delir', quellen: ['s3-das'],
      text: 'Ziel ist meist RASS 0 bis −1. Tiefer nur mit ärztlicher Begründung. Analgesie vor Sedierung: Schmerz und Husten gegen das Gerät zuerst mit dem Opioid behandeln, nicht mit mehr Hypnotikum, Schmerz mit BPS einschätzen. Leere Perfusoren vorausschauend wechseln (Spritze rechtzeitig aufziehen), Laufrate gegen Anordnung und Dosis prüfen.' },
    { titel: 'Laufrate in Dosis umrechnen', quellen: ['fi-propofol'],
      text: 'Dosis = Laufrate (ml/h) × Konzentration (mg/ml) ÷ Gewicht (kg). Propofol 2 % = 20 mg/ml: 4 ml/h bei 80 kg = 1 mg/kg/h; 40 ml/h = 10 mg/kg/h, weit über der Höchstdosis von 4 mg/kg/h.' },
  ],

  pruefwege: {
    muster: [
      { art: 'warten', sek: 20 },
      { art: 'massnahme', id: 'beatmung-beobachten' },
      { art: 'massnahme', id: 'dopes-pruefen' },
      { art: 'massnahme', id: 'beatmung-diskonnektion-beheben' },
      { art: 'frage', id: 'g-ben-ursache' },
      { art: 'massnahme', id: 'beatmung-beobachten' },
      { art: 'massnahme', id: 'kurve-lesen' },
      { art: 'massnahme', id: 'cuffdruck-messen' },
      { art: 'massnahme', id: 'bilanz-fuehren' },
      { art: 'warten', sek: 120 },
      { art: 'massnahme', id: 'beatmung-beobachten' },
      { art: 'massnahme', id: 'atemgeraeusche-hoeren' },
      { art: 'massnahme', id: 'geschlossen-absaugen' },
      { art: 'massnahme', id: 'mundpflege-beatmet' },
      { art: 'warten', sek: 30 },
      { art: 'massnahme', id: 'perfusor-wechseln' },
      { art: 'massnahme', id: 'rass-einschaetzen' },
      { art: 'massnahme', id: 'schmerz-bps' },
      { art: 'anruf', an: 'aerztin', sbar: ['s-unruhig', 'b-propofol-leer', 'b-laparotomie', 'a-rass-bps', 'a-alarm', 'r-analgesie'] },
      { art: 'remonstrieren', anordnung: 'an-propofol-40', grund: '40 ml/h sind 10 mg/kg/h, über der Höchstdosis' },
      { art: 'rueckmelden', anordnung: 'an-sufentanil-7', rueckgelesen: true },
      { art: 'massnahme', id: 'sufentanil-7' },
      { art: 'massnahme', id: 'kommunikation-tubus' },
      { art: 'warten', sek: 420 },
      { art: 'massnahme', id: 'rass-einschaetzen' },
      { art: 'massnahme', id: 'schmerz-bps' },
      { art: 'dokumentieren', bausteine: ['befund:beatmung-diskonnektion-beheben', 'massnahme:geschlossen-absaugen', 'befund:perfusor-wechseln', 'a-alarm', 'a-rass-ziel'] },
      { art: 'frage', id: 'g-ehefrau' },
      { art: 'nachricht', an: 'aerztin', kanal: 'messenger', bausteine: ['a-rass-ziel'] },
      { art: 'warten', sek: 120 },
      { art: 'abschluss', probleme: ['pb-beatmung', 'pb-sedierung', 'pb-vap', 'pb-angehoerige'], ziele: ['z-beatmung', 'z-rass', 'z-vap'],
        verdacht: 'v-sekret', begruendung: ['bg-zischen', 'bg-brodeln', 'bg-spritze'],
        sbar: ['s-unruhig', 'b-propofol-leer', 'b-laparotomie', 'a-rass-bps', 'a-alarm', 'r-analgesie'] },
    ],
    unterlassung: { bisSek: 300, erwartet: { wert: 'spo2', vergleich: '<', grenze: 85 } },
    // 3. Drittel saugt ohne Anleitung ab: Stufe 2 PA unterstützt, Stufe 3 Grenzüberschreitung (Patientenschaden möglich)
    grenze: {
      rolle: 3,
      events: [
        { art: 'warten', sek: 20 },
        { art: 'massnahme', id: 'beatmung-beobachten' },
        { art: 'massnahme', id: 'geschlossen-absaugen' },
      ],
      erwartet: 'pa-eingriff',
    },
  },
};
