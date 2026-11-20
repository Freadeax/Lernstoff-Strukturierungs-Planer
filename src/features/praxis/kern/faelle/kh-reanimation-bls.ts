// Fallwelle P16b (CE06) · Krankenhaus, Nachtdienst: innerklinischer Herz-Kreislauf-Stillstand, Basismaßnahmen mit AED
// Entwurf, fachlich UNGEPRÜFT. Inhalte fiktiv/didaktisch. Werte entstehen im Modell (Rhythmus-Modul der Spur-B-Hülle).
// Altfall: keiner (neu nach FALLPLAN-CE.md, CE06 „Reanimation BLS im Zimmer“).

import { KATALOG } from '../katalog';
import type { Bedingung, FallV2, MassnahmeDefinition } from '../typen';

const aus = (id: string, mehr: Partial<MassnahmeDefinition>): MassnahmeDefinition => ({ ...KATALOG[id]!, ...mehr });

/** Spontankreislauf zurück: erst nach Schock und weiteren zwei Minuten Herzdruckmassage */
const ROSC: Bedingung = { getan: 'bls-weiter' };
/** Das Reanimationsteam ist da (frühestens 4 Min. nach Fallbeginn, nur wenn alarmiert) */
const TEAM_DA: Bedingung = { alle: [{ getan: 'rea-team-alarmieren' }, { ab: 240 }] };
const KEIN_KREISLAUF: Bedingung = { wert: 'hf', vergleich: '<', grenze: 10 };

export const KH_REANIMATION_BLS: FallV2 = {
  schema: 2,
  id: 'kh-reanimation-bls',
  version: '0.1.0',
  spur: 'A',
  setting: 'krankenhaus',
  altersgruppe: 'erwachsen',
  titel: '„Mein Nachbar atmet so komisch“',
  kurz: 'Kardiologie, Nachtdienst: Der Zimmernachbar klingelt, Herr Becker reagiert nicht und atmet nicht normal.',
  rahmen: 'Du bist im Nachtdienst auf der kardiologischen Normalstation. Um 03:10 Uhr klingelt es in Zimmer 12.',
  lernziele: [
    'Einen Herz-Kreislauf-Stillstand in Sekunden erkennen: keine Reaktion, keine normale Atmung (Schnappatmung zählt nicht).',
    'Hilfe holen, das Reanimationsteam alarmieren und ohne Verzögerung mit hochwertiger Herzdruckmassage beginnen.',
    'Den AED sicher einsetzen: Elektroden, Analyse, „Alle weg!“, nach dem Schock sofort weiterdrücken.',
    'Bei der Ankunft des Teams strukturiert übergeben, mit Zeitpunkten, und die Reanimation dokumentieren.',
    'Unsicherheit über den Patientenwillen in der Akutsituation richtig einordnen.',
  ],
  lehrplan: {
    ce: ['ce.06'], abschnitt: ['ad12', 'ad3'],
    themen: ['thema.beo.notfall', 'thema.beo.bewusstsein', 'thema.kl.herz.khk', 'thema.pp.uebergabe', 'thema.kom.ethik'],
    kompetenzen: ['I.4.a', 'I.4.b', 'I.4.c', 'II.3.c', 'III.2.b'],
  },
  geeignet: { rollen: [2, 3], stufen: [1, 2, 3] },
  dauerMin: [8, 12],
  freigabe: {
    status: 'entwurf',
    pruefpunkte: [
      'Ablauf gegen ERC-Leitlinien 2025 (BLS/AED innerklinisch) prüfen: Erkennen ≤ 10 s, 30:2, Frequenz 100–120/min, Tiefe 5–6 cm, Schock ohne Pause, weiter 2 min',
      'Beutel-Masken-Beatmung durch Auszubildende im 2. Drittel (Katalog: selbst) gegen Hausstandard prüfen',
      'Ethik-Ereignis „Nachbar sagt, er wolle nicht wiederbelebt werden“: Einordnung (ohne schriftliche Verfügung weiter, Ärztin klärt) fachlich und rechtlich prüfen',
      'Hypokaliämie unter Diuretikum als Auslöser (4 H und HITS) didaktisch passend?',
      'Modell: Kammerflimmern ohne Auswurf, nach ROSC Sinusrhythmus mit reduziertem Bewusstsein plausibel?',
    ],
  },
  quellen: [
    { id: 'erc-2025', titel: 'European Resuscitation Council: Leitlinien Reanimation 2025 (deutsche Fassung GRC)', fundstelle: 'Basismaßnahmen (BLS) und AED; innerklinische Reanimation' },
    { id: 'grc-innerklinisch', titel: 'German Resuscitation Council: Eckpunktepapier innerklinische Notfallversorgung', fundstelle: 'Alarmierung, Ausstattung, Schulung' },
    { id: 'dnr-bgb', titel: 'BGB § 1827 (Patientenverfügung) und § 630d (Einwilligung)', fundstelle: 'mutmaßlicher Wille, Notfall ohne schriftliche Verfügung' },
  ],

  person: {
    name: 'Herr Becker',
    alter: { jahre: 71 },
    geschlecht: 'm',
    biografie: ['verheiratet, zwei erwachsene Kinder', 'früher Busfahrer', 'geht jeden Morgen mit dem Hund'],
    diagnosenBekannt: ['instabile Angina pectoris (Aufnahme gestern, Koronarangiografie für heute geplant)', 'koronare Herzkrankheit, Stent 2022', 'Herzinsuffizienz', 'arterielle Hypertonie'],
    medikamentePlan: ['ASS 100 mg 1-0-0', 'Bisoprolol 5 mg 1-0-0', 'Furosemid 40 mg 1-1-0', 'Atorvastatin 40 mg 0-0-1', 'Enoxaparin 80 mg s. c. 1-0-1'],
    allergien: ['keine bekannt'],
    gewichtKg: 82,
  },
  medien: {
    raum: '27_station_zweibett_nacht_ohne_monitor',
    raumVarianten: [{ wenn: { getan: 'monitor-anlegen' }, raum: '27_station_zweibett_nacht_sensor_an' }],
  },
  uebernahme: 'Nachtdienst, Zimmer 12: Herr Becker, 71, gestern mit instabiler Angina aufgenommen, heute Herzkatheter geplant. Um Mitternacht beschwerdefrei, schlief. Kalium gestern niedrig, Kontrolle steht für heute früh an. Jetzt klingelt sein Zimmernachbar.',
  startUhrzeit: '03:10',

  start: {
    // Kammerflimmern ohne Auswurf (Modul Rhythmus). Nach ROSC: Sinusrhythmus, Bewusstsein noch deutlich getrübt.
    grund: { pumpleistung: 0.8, vigilanz: 0.4, orientierung: 0.3, laktat: 1.5, kalium: 3.1, angst: 0, schmerz: 0 },
    treiber: [],
    module: { rhythmus: 'kammerflimmern' },
    bild: { haltung: 'liegt', haut: 'zyanotisch', mimik: 'schlaefrig' },
  },

  massnahmen: [
    // Gespräch & Beobachten
    'ansprechen-orientierung', 'bewusstsein-avpu', 'atmung-beobachten', 'pupillen-pruefen', 'haut-beobachten', 'ersteindruck-abcde',
    // Akut
    'hilfe-holen', 'rea-team-alarmieren', 'atemwege-freimachen', 'bls-herzdruckmassage', 'bls-weiter', 'beutel-maske-beatmen', 'aed-anlegen',
    'defibrillation-manuell', 'stabile-seitenlage', 'o2-geben', 'oberkoerper-hoch',
    // Messen
    'puls-zaehlen', 'pulsoxy-anlegen', 'monitor-anlegen', 'bz-messen', 'ekg-12-kanal', 'kurve-lesen',
    // Melden
    'verlegung-uebergabe', 'pflegebericht',
  ],
  massnahmenZusatz: [
    aus('bls-herzdruckmassage', { name: 'Herzdruckmassage beginnen: Brustmitte, 5–6 cm, 100–120/min, harte Unterlage' }),
    aus('bls-herzdruckmassage', {
      id: 'bls-weiter', name: 'Nach dem Schock sofort zwei Minuten weiter 30:2, dann Helferwechsel und Analyse',
      voraussetzung: { flag: 'geschockt' }, setzt: ['bls-weiter'],
    }),
    aus('beutel-maske-beatmen', { name: 'Mit Beutel und Maske beatmen (30:2, je 1 s, sichtbare Thoraxhebung)', setzt: ['beatmet-30-2'] }),
    aus('o2-geben', { name: 'O₂ über Maske mit Reservoir geben (nach ROSC, Ziel SpO₂ 94–98 %)', wirkung: [{ groesse: 'sauerstoff', delta: 10, beginnSek: 0, spitzeSek: 30, dauerSek: 'dauerhaft' }] }),
    aus('verlegung-uebergabe', { name: 'Übergabe an die Intensivstation (Transport mit dem Reanimationsteam)', voraussetzung: { anordnung: 'an-intensiv' }, setzt: ['auf-intensiv'] }),
  ],

  akte: {
    aufnahmegrund: 'Gestern 16 Uhr über die Notaufnahme: Brustschmerz in Ruhe, Troponin grenzwertig, EKG ohne Hebungen. Instabile Angina pectoris, Koronarangiografie für heute 9 Uhr geplant.',
    anamnese: ['KHK, Stent RIVA 2022', 'Herzinsuffizienz mit reduzierter Pumpfunktion (HFrEF, LVEF 40 %)', 'Raucher bis 2022'],
    diagnosen: [
      { text: 'Instabile Angina pectoris', icd: 'I20.0', seit: 'gestern' },
      { text: 'Koronare Dreigefäßerkrankung, Stent RIVA', icd: 'I25.13', seit: '2022' },
      { text: 'Herzinsuffizienz NYHA II', icd: 'I50.12', seit: '2022' },
      { text: 'Hypokaliämie', icd: 'E87.6', seit: 'gestern' },
    ],
    medikation: [
      { id: 'mp-ass', wirkstoff: 'Acetylsalicylsäure', staerke: '100 mg', form: 'Tbl.', schema: '1-0-0-0', zuletzt: 'gestern 08:00' },
      { id: 'mp-bisoprolol', wirkstoff: 'Bisoprolol', staerke: '5 mg', form: 'Tbl.', schema: '1-0-0-0', zuletzt: 'gestern 08:00' },
      { id: 'mp-furosemid', wirkstoff: 'Furosemid', staerke: '40 mg', form: 'Tbl.', schema: '1-1-0-0', zuletzt: 'gestern 12:00', hinweis: 'Kalium kontrollieren.' },
      { id: 'mp-enoxaparin', wirkstoff: 'Enoxaparin', staerke: '80 mg', form: 's. c.', schema: '1-0-1-0', zuletzt: 'gestern 20:00' },
      { id: 'mp-kalium', wirkstoff: 'Kaliumchlorid', staerke: '20 mmol', form: 'Brausetbl.', schema: '1-1-1-0', zuletzt: 'gestern 18:00', hinweis: 'Neu seit gestern (Kalium 3,1).' },
    ],
    vorwerte: [
      { zeit: 'gestern 16:30 (ZNA)', vorH: 10.7, werte: { rrSys: 148, rrDia: 88, hf: 84, spo2: 96, af: 16, temp: 36.7 }, kuerzel: 'ZNA' },
      { zeit: 'gestern 22:00', vorH: 5.2, werte: { rrSys: 132, rrDia: 78, hf: 72, spo2: 96, af: 15 }, kuerzel: 'SH' },
      { zeit: 'heute 00:10', vorH: 3, werte: { hf: 76, spo2: 95 }, kuerzel: 'ND' },
    ],
    pflegebericht: [
      { zeit: 'gestern 22:00', wer: 'Spätdienst', text: 'Beschwerdefrei, mobil auf Station. Kalium-Brausetablette eingenommen. Ehefrau bis 20 Uhr zu Besuch.' },
      { zeit: 'heute 00:10', wer: 'Nachtdienst', text: 'Schläft. Atmung ruhig. Keine Beschwerden geäußert.' },
    ],
    aerztlicheAnordnungen: [
      { zeit: 'gestern 17:00', wer: 'Dr. Haas', text: 'Nüchtern ab 0 Uhr für Koronarangiografie. Kaliumchlorid 20 mmol 1-1-1, Kontrolle morgen früh. Reanimationsstatus: volle Therapie.' },
    ],
    labor: [
      { name: 'Kalium', wert: '3,1', einheit: 'mmol/l', norm: '3,5–5,0', datum: 'gestern 16:30', auffaellig: true },
      { name: 'Troponin T hs', wert: '18', einheit: 'ng/l', norm: 'unter 14', datum: 'gestern 16:30', auffaellig: true },
      { name: 'Kreatinin', wert: '1,1', einheit: 'mg/dl', norm: '0,7–1,2', datum: 'gestern 16:30' },
    ],
    rechtliches: [
      'Keine Patientenverfügung. Im Aufnahmegespräch: wünscht alle Maßnahmen, „ich will wieder mit dem Hund laufen“.',
      'Reanimationsstatus laut Arztbrief der Aufnahme: volle Therapie.',
      'Ehefrau Gisela Becker: Auskunft erlaubt (Einwilligung bei Aufnahme).',
    ],
  },

  befunde: [
    { massnahme: 'ansprechen-orientierung', varianten: [
      { wenn: ROSC, text: 'Er stöhnt auf lautes Ansprechen, öffnet die Augen nicht.' },
      { text: 'Keine Reaktion auf lautes Ansprechen und Rütteln an den Schultern.' },
    ] },
    { massnahme: 'bewusstsein-avpu', varianten: [
      { wenn: ROSC, text: 'Reagiert nur auf Schmerzreiz mit Abwehrbewegung. AVPU {avpu}.', zeigt: ['avpu'] },
      { text: 'Keine Reaktion auf Ansprache und Schmerzreiz. AVPU U.', zeigt: ['avpu'] },
    ] },
    { massnahme: 'atmung-beobachten', varianten: [
      { wenn: ROSC, text: 'Er atmet selbst, etwas schnell, Thorax hebt sich beidseits. Atemfrequenz {af}/min.', zeigt: ['af'] },
      { text: 'Kopf überstreckt, sehen, hören, fühlen (höchstens 10 Sekunden): nur zwei langsame, schnappende Atemzüge. Das ist keine normale Atmung.' },
    ] },
    { massnahme: 'atemwege-freimachen', varianten: [{ text: 'Kopf überstreckt, Kinn angehoben. Im Mund nichts zu sehen, die Zahnprothese sitzt fest.' }] },
    { massnahme: 'pupillen-pruefen', varianten: [
      { wenn: ROSC, text: 'Pupillen mittelweit, beidseits lichtreagibel.' },
      { text: 'Pupillen weit, träge. Kein Grund, mit der Herzdruckmassage zu warten.' },
    ] },
    { massnahme: 'haut-beobachten', varianten: [
      { wenn: ROSC, text: 'Lippen werden wieder rosig, Haut noch blass und kühl.' },
      { text: 'Gesicht und Lippen blau-grau, Haut kühl.' },
    ] },
    { massnahme: 'ersteindruck-abcde', varianten: [
      { wenn: ROSC, text: 'A frei. B: atmet selbst, SpO₂ noch nicht gemessen. C: Puls an der Halsschlagader tastbar, schnell. D: reagiert nur auf Schmerz. E: keine Verletzungen.' },
      { text: 'Kein ABCDE jetzt: keine Reaktion, keine normale Atmung. Das ist ein Kreislaufstillstand. Hilfe holen und drücken!' },
    ] },
    { massnahme: 'puls-zaehlen', varianten: [
      { wenn: ROSC, text: 'Puls an der Halsschlagader kräftig, um {hf}/min.', zeigt: ['hf'] },
      { text: 'Du tastest an der Halsschlagader und bist dir nicht sicher. Die Pulskontrolle durch Laien und Ungeübte ist unzuverlässig, sie verzögert nur den Beginn.' },
    ] },
    { massnahme: 'bls-herzdruckmassage', varianten: [{ text: 'Bett flach, Reanimationsbrett unter den Rücken. Du drückst in der Brustmitte, laut zählend. Die Kollegin bringt Notfallwagen und AED.' }] },
    { massnahme: 'bls-weiter', varianten: [{ text: 'Du drückst sofort weiter, zwei Minuten 30:2. Danach wechselt ihr: Lena drückt, du übernimmst den Beutel.' }] },
    { massnahme: 'beutel-maske-beatmen', varianten: [{ text: 'C-Griff, Maske dicht. Zwei Beatmungen je etwa eine Sekunde, der Brustkorb hebt sich sichtbar. Weiter 30:2.' }] },
    { massnahme: 'aed-anlegen', varianten: [{ text: 'Elektroden rechts unter dem Schlüsselbein und links seitlich unter der Achsel. Der AED sagt: „Analyse läuft. Patient nicht berühren.“' }] },
    { massnahme: 'pulsoxy-anlegen', varianten: [
      { wenn: KEIN_KREISLAUF, text: 'Kein Signal. Ohne Kreislauf misst das Pulsoxymeter nichts.' },
      { text: 'SpO₂ {spo2} %, Puls {hf}/min.', zeigt: ['spo2', 'hf'] },
    ] },
    { massnahme: 'monitor-anlegen', varianten: [{ text: 'Defi-Monitor des Teams: Sinusrhythmus {hf}/min, RR {rrSys}/{rrDia} mmHg, SpO₂ {spo2} %, AF {af}/min.', zeigt: ['hf', 'rrSys', 'rrDia', 'spo2', 'af', 'rhythmus'] }] },
    { massnahme: 'bz-messen', varianten: [{ text: 'BZ {bz} mg/dl.', zeigt: ['bz'] }] },
    { massnahme: 'ekg-12-kanal', varianten: [{ text: 'Sinusrhythmus {hf}/min, flache T-Wellen, U-Wellen (passt zu niedrigem Kalium). Keine ST-Hebungen. Befund durch die Ärztin.', zeigt: ['rhythmus'] }] },
    { massnahme: 'kurve-lesen', varianten: [{ text: 'Kurve: Kalium gestern 3,1 mmol/l, Kalium-Ersatz angesetzt. Reanimationsstatus „volle Therapie“, keine Patientenverfügung. Ehefrau darf Auskunft bekommen.' }] },
  ],

  gespraech: [
    { id: 'g-nachbar-was', frage: 'Was haben Sie bemerkt, und wann?', an: 'patient', kompetenzbereiche: ['I', 'II'],
      antwort: [{ text: 'Der Zimmernachbar, Herr Kühn: „Er hat so laut geschnarcht, dann so komisch gegurgelt, seit ein, zwei Minuten. Dann war es ganz still. Ich hab sofort geklingelt.“', setzt: ['zeit-geklaert'] }],
      fakten: ['Nachbar hörte Gurgeln seit 1–2 Minuten', 'sofort geklingelt'] },
    { id: 'g-nachbar-beruhigen', frage: 'Herrn Kühn kurz erklären, was passiert, und ihn bitten, im Bad zu warten', an: 'patient', kompetenzbereiche: ['II'],
      nurWenn: { getan: 'bls-herzdruckmassage' },
      antwort: [{ text: '„Ja, ja, ich geh raus. Helfen Sie ihm!“ Herr Kühn setzt sich im Flur auf einen Stuhl, Lena bleibt kurz bei ihm.' }] },
    { id: 'g-kollegin-drucken', frage: 'Kollegin: „Übernimm die Druckmassage, ich beatme. Wechsel alle zwei Minuten.“', an: 'kollegin', kompetenzbereiche: ['II', 'III'],
      nurWenn: { getan: 'bls-herzdruckmassage' },
      antwort: [{ text: 'Lena: „Okay, ich zähle laut mit. Nächster Wechsel bei der Analyse.“', setzt: ['helferwechsel-abgesprochen'] }] },
    { id: 'g-ehefrau', frage: 'Ehefrau anrufen: Herr Becker ist auf die Intensivstation verlegt worden, die Ärztin meldet sich', an: 'angehoerige', kanal: 'telefon', kompetenzbereiche: ['II', 'IV'],
      nurWenn: ROSC,
      schweigepflicht: { erlaubtWenn: { getan: 'kurve-lesen' }, fehlerText: 'Du hast der Ehefrau Auskunft gegeben, ohne zu prüfen, ob Herr Becker das erlaubt hat. Er kann gerade nicht einwilligen. In der Akte steht, ob sie Auskunft bekommen darf: erst nachsehen, dann informieren.' },
      antwort: [{ text: '„Oh Gott … ich komme sofort. Danke, dass Sie anrufen.“ Sie fragt, ob er Schmerzen hatte. Du sagst ehrlich, dass er bewusstlos war, und dass die Ärztin gleich mit ihr spricht.', setzt: ['ehefrau-informiert'] }],
      fakten: ['Ehefrau kommt in die Klinik', 'Ärztin führt das ausführliche Gespräch'] },
  ],

  sbar: [
    { id: 's-rea', teil: 'S', text: 'Herr Becker, 71, um 03:10 bewusstlos ohne normale Atmung gefunden, Reanimation läuft.', art: 'kern' },
    { id: 's-schlecht', teil: 'S', text: 'Herrn Becker geht es schlecht.', art: 'falsch' },
    { id: 'b-zeit', teil: 'B', text: 'Herzdruckmassage ab 03:11, AED: ein Schock gegen 03:15, danach zwei Minuten weiter.', art: 'kern', bekanntWenn: { flag: 'geschockt' } },
    { id: 'b-khk', teil: 'B', text: 'Gestern mit instabiler Angina aufgenommen, KHK mit Stent, Herzkatheter für heute geplant.', art: 'kern' },
    { id: 'b-kalium', teil: 'B', text: 'Kalium gestern 3,1 mmol/l unter Furosemid.', art: 'hilfreich', bekanntWenn: { getan: 'kurve-lesen' } },
    { id: 'b-hund', teil: 'B', text: 'Er geht jeden Morgen mit dem Hund.', art: 'ablenker' },
    { id: 'a-rosc', teil: 'A', text: 'Nach dem Schock wieder Puls tastbar, atmet selbst.', art: 'kern', bekanntWenn: ROSC },
    { id: 'a-bewusstlos', teil: 'A', text: 'Reagiert nur auf Schmerzreiz.', art: 'kern', bekanntWenn: { alle: [ROSC, { getan: 'bewusstsein-avpu' }] } },
    { id: 'a-stabil', teil: 'A', text: 'Er ist wieder stabil, alles gut.', art: 'falsch' },
    { id: 'r-uebernahme', teil: 'R', text: 'Bitte übernehmen Sie, ich bereite O₂, Monitor und 12-Kanal-EKG vor.', art: 'kern' },
    { id: 'r-intensiv', teil: 'R', text: 'Reanimiert nach Kammerflimmern, ein Schock, ROSC nach etwa 5 Minuten. Bewusstsein getrübt, O₂ über Maske. Kalium niedrig, Ehefrau ist informiert.', art: 'hilfreich',
      bekanntWenn: { alle: [ROSC, { getan: 'kurve-lesen' }] } },
  ],

  anordnungen: [
    { id: 'an-o2', massnahme: 'o2-geben', text: 'O₂ 10 l/min über Maske mit Reservoir, dann nach SpO₂ 94–98 % reduzieren.' },
    { id: 'an-ekg', massnahme: 'ekg-12-kanal', auchFuer: ['monitor-anlegen'], text: 'Monitor und 12-Kanal-EKG sofort.' },
    { id: 'an-intensiv', massnahme: 'verlegung-uebergabe', text: 'Verlegung auf die Intensivstation, Bett ist frei.' },
  ],

  arzt: {
    name: 'Dr. Haas (Reanimationsteam)',
    erreichbar: 'vor-ort',
    regeln: [
      { id: 'r-uebernahme', wenn: { alle: [{ gemeldet: ['s-rea', 'b-zeit', 'a-rosc'] }, TEAM_DA] },
        antwort: '„Danke, sehr gut gemacht. Ich übernehme. O₂ über Maske, Monitor dran und ein 12-Kanal-EKG. Er kommt auf die Intensiv. Messen Sie mir bitte den Blutzucker und sagen Sie ihn mir.“',
        anordnungen: ['an-o2', 'an-ekg', 'an-intensiv'], setzt: ['team-uebernimmt'], auftraege: ['af-bz'] },
      { id: 'r-zeit', wenn: { alle: [{ gemeldet: ['s-rea'] }, TEAM_DA] },
        antwort: '„Okay, wir sind da.“',
        rueckfrage: { text: '„Seit wann wird gedrückt, wie oft hat der AED geschockt, und hat er jetzt wieder einen Puls?“', erwartet: ['b-zeit', 'a-rosc'] } },
      { wenn: { nicht: TEAM_DA }, antwort: 'Niemand antwortet. Das Reanimationsteam ist noch nicht da. Drück weiter, bis es kommt.' },
    ],
    auftraege: [
      { id: 'af-bz', text: 'Blutzucker messen und Dr. Haas sagen', erledigt: { getan: 'bz-messen' }, meldung: ['wert:bz'], meldenBinnenSek: 600,
        folge: [{ wenn: { ab: 0 }, antwort: '„Danke, der Zucker ist es nicht. Dann Abfahrt auf die Intensiv.“', setzt: ['bz-gemeldet'] }] },
    ],
  },
  team: { kollegin: 'Lena (Pflegefachfrau, Nachtdienst)', weitere: { angehoerige: 'Ehefrau Gisela Becker', 'aufnehmende-station': 'Intensivstation, Pfleger Tom' } },

  ereignisse: [
    { id: 'e-team-kommt', art: 'team', wann: TEAM_DA,
      text: 'Das Reanimationsteam kommt mit dem Defi-Monitor ins Zimmer. Dr. Haas: „Was haben wir?“' },
    { id: 'e-analyse', art: 'geraet', wann: { alle: [{ getan: 'aed-anlegen' }, { getan: 'bls-herzdruckmassage' }] },
      text: 'Der AED: „Schock empfohlen. Laden. Patient nicht berühren.“ Lena hält noch den Beutel in der Hand.',
      entscheidung: [
        { id: 'w-alle-weg', text: '„Alle weg vom Patienten!“ Sichtkontrolle, Schock auslösen, sofort weiterdrücken', wertung: 'gut', setzt: ['geschockt'],
          warum: 'Niemand berührt den Patienten, die Pause vor und nach dem Schock bleibt unter fünf Sekunden. Die Herzdruckmassage geht ohne Pulskontrolle weiter (ERC 2025).' },
        { id: 'w-puls-zuerst', text: 'Erst Puls tasten, dann schocken', wertung: 'falsch', setzt: ['geschockt', 'pause-zu-lang'],
          warum: 'Bei „Schock empfohlen“ hat der AED Kammerflimmern erkannt. Pulstasten verlängert nur die Pause ohne Kreislauf.' },
        { id: 'w-schock-beruehrt', text: 'Schock auslösen, Lena beatmet weiter', wertung: 'gefaehrlich', setzt: ['geschockt', 'helfer-beruehrt'],
          warum: 'Wer den Patienten beim Schock berührt, kann selbst einen Stromschlag bekommen. Vor dem Auslösen laut warnen und schauen.' },
      ] },
    { id: 'e-nachbar-wille', art: 'patient', wann: { alle: [{ getan: 'bls-herzdruckmassage' }, { ab: 200 }] },
      text: 'Herr Kühn steht in der Tür: „Er hat gestern gesagt, er will nicht an Maschinen hängen. Hören Sie lieber auf!“',
      entscheidung: [
        { id: 'w-weiter', text: 'Weiterdrücken, kurz antworten: „Wir klären das gleich mit der Ärztin.“', wertung: 'gut', setzt: ['wille-eingeordnet'],
          warum: 'Ohne schriftliche Verfügung oder dokumentierten Verzicht wird reanimiert. Eine mündliche Äußerung gegenüber dem Zimmernachbarn reicht nicht. Die Ärztin klärt später den Willen, in der Akte steht „volle Therapie“.' },
        { id: 'w-akte-holen', text: 'Kurz aufhören und im Dienstzimmer die Akte holen', wertung: 'falsch', setzt: ['pause-zu-lang'],
          warum: 'Jede Pause ohne Herzdruckmassage verschlechtert die Überlebenschance. Klären kann man das, wenn das Team da ist.' },
        { id: 'w-aufhoeren', text: 'Aufhören, weil er es so wollte', wertung: 'gefaehrlich',
          warum: 'Ein Behandlungsverzicht muss eindeutig belegt sein (Patientenverfügung, ärztlich dokumentierter Reanimationsverzicht). Im Zweifel wird reanimiert.' },
      ] },
    { id: 'e-rosc', art: 'patient', wann: ROSC,
      text: 'Zweite Analyse: „Kein Schock empfohlen.“ Herr Becker hustet, bewegt einen Arm und atmet selbst. An der Halsschlagader ist ein kräftiger Puls zu tasten.',
      modul: { rhythmus: null }, bild: { haut: 'blass', mimik: 'schlaefrig' } },
  ],

  pa: {
    name: 'Praxisanleiterin Sandra Hofer (Nachtdienst)',
    hilfen: [
      { wenn: { nicht: { getan: 'bls-herzdruckmassage' } }, impuls: 'Reagiert er? Atmet er normal? Was heißt das?', tipp: 'Keine Reaktion und keine normale Atmung: Reanimationsteam alarmieren und sofort mit der Herzdruckmassage beginnen.' },
      { wenn: { nicht: { getan: 'aed-anlegen' } }, impuls: 'Was hilft bei Kammerflimmern am meisten?', tipp: 'Der AED. Lass ihn bringen und kleb die Elektroden, ohne die Herzdruckmassage lange zu unterbrechen.' },
      { wenn: { alle: [ROSC, { nicht: { flag: 'team-uebernimmt' } }] }, impuls: 'Was braucht das Team von dir?', tipp: 'Eine kurze Übergabe mit Zeitpunkten: gefunden, Beginn Herzdruckmassage, Schocks, jetzt Puls und Atmung.' },
      { impuls: 'Was gehört nach einer Reanimation in die Dokumentation?', tipp: 'Zeitpunkte, Rhythmus, Schocks, wer was gemacht hat. Am besten gleich, solange alles frisch ist.' },
    ],
  },

  bewertung: {
    pflicht: [
      { id: 'p-erkennen', text: 'Stillstand erkannt: Bewusstsein und Atmung in kurzer Zeit geprüft', gewicht: 2, kompetenzbereiche: ['I'],
        erfuellt: { alle: [{ getan: 'bewusstsein-avpu', bis: 60 }, { getan: 'atmung-beobachten', bis: 90 }] }, warum: 'Keine Reaktion und keine normale Atmung reichen für die Diagnose. Mehr Prüfen kostet nur Zeit.' },
      { id: 'p-alarm', text: 'Reanimationsteam in der ersten Minute alarmiert', gewicht: 3, kompetenzbereiche: ['II', 'III'],
        erfuellt: { getan: 'rea-team-alarmieren', bis: 90 }, warum: 'Das Team bringt Defibrillator, Medikamente und ärztliche Hilfe. Jede Minute zählt.' },
      { id: 'p-hdm', text: 'Herzdruckmassage innerhalb von zwei Minuten begonnen', gewicht: 3, kompetenzbereiche: ['I'],
        erfuellt: { getan: 'bls-herzdruckmassage', bis: 120 }, warum: 'Ohne Herzdruckmassage sinkt die Überlebenschance je Minute um etwa zehn Prozent.' },
      { id: 'p-aed', text: 'AED angelegt und Schock sicher abgegeben', gewicht: 3, kompetenzbereiche: ['I'],
        erfuellt: { alle: [{ getan: 'aed-anlegen', bis: 360 }, { getan: 'wahl:e-analyse:w-alle-weg' }] }, warum: 'Bei Kammerflimmern ist die frühe Defibrillation die wirksamste Maßnahme.' },
      { id: 'p-weiter', text: 'Nach dem Schock sofort weitergedrückt', gewicht: 2, kompetenzbereiche: ['I'],
        erfuellt: { getan: 'bls-weiter' }, warum: 'Auch nach erfolgreichem Schock pumpt das Herz anfangs schwach. Zwei Minuten weiter, dann Analyse.' },
      { id: 'p-beatmen', text: 'Beatmet 30:2', gewicht: 1, kompetenzbereiche: ['I'],
        erfuellt: { getan: 'beutel-maske-beatmen' }, warum: 'Mit Beutel und Maske versorgt ihr ihn mit Sauerstoff, sobald zwei Helfende da sind.' },
      { id: 'p-wille', text: 'Patientenwillen in der Akutsituation richtig eingeordnet', gewicht: 2, kompetenzbereiche: ['IV', 'II'],
        erfuellt: { getan: 'wahl:e-nachbar-wille:w-weiter' }, warum: 'Ohne eindeutigen, dokumentierten Verzicht gilt: reanimieren. Der Wille wird danach geklärt.' },
      { id: 'p-uebergabe', text: 'Übergabe an das Team mit Zeitpunkten', gewicht: 2, kompetenzbereiche: ['II', 'III'],
        erfuellt: { flag: 'team-uebernimmt' }, warum: 'Das Team entscheidet nach Dauer, Rhythmus und Schocks über die weitere Therapie.' },
      { id: 'p-bz', text: 'Rückauftrag Blutzucker gemeldet', gewicht: 1, kompetenzbereiche: ['II'],
        erfuellt: { auftrag: 'af-bz', status: 'gemeldet' }, warum: 'Nach ROSC sollen Unterzucker und andere behebbare Ursachen schnell ausgeschlossen werden.' },
      { id: 'p-doku', text: 'Reanimation mit Zeitpunkten dokumentiert', gewicht: 1, kompetenzbereiche: ['I', 'IV'],
        erfuellt: { alle: [{ dokumentiert: 'befund:bls-herzdruckmassage' }, { dokumentiert: 'befund:aed-anlegen' }, { dokumentiert: 'a-rosc' }] }, warum: 'Das Reanimationsprotokoll ist Grundlage für Weiterbehandlung, Qualitätssicherung und Nachbesprechung.' },
      { id: 'p-intensiv', text: 'Übergabe an die Intensivstation', gewicht: 1, kompetenzbereiche: ['II'],
        erfuellt: { alle: [{ getan: 'verlegung-uebergabe' }, { gesagt: 'b-zeit', an: 'aufnehmende-station' }] }, warum: 'Die Intensivstation braucht Dauer, Ursache und Verlauf für die Weiterversorgung.' },
    ],
    fehler: [
      { id: 'f-helfer-beruehrt', text: 'Geschockt, während jemand den Patienten berührte', wenn: { flag: 'helfer-beruehrt' }, schwere: 'schwer', kompetenzbereiche: ['I', 'III'],
        folge: { text: 'Lena zuckt zusammen und lässt den Beutel fallen: „Au! Das ging durch den Arm!“' }, warum: 'Vor jedem Schock „Alle weg!“ und Sichtkontrolle. Eigenschutz geht vor.' },
      { id: 'f-pause', text: 'Herzdruckmassage unnötig unterbrochen', wenn: { flag: 'pause-zu-lang' }, schwere: 'mittel', kompetenzbereiche: ['I'],
        warum: 'Pausen ohne Herzdruckmassage senken den Druck in den Herzkranzgefäßen sofort. Unterbrechungen kurz halten (unter 10 s).' },
      { id: 'f-aufgehoert', text: 'Reanimation ohne gültigen Verzicht abgebrochen', wenn: { getan: 'wahl:e-nachbar-wille:w-aufhoeren' }, schwere: 'schwer', kompetenzbereiche: ['IV', 'I'],
        folge: { text: 'Sandra übernimmt sofort: „Weiter! Es gibt keine Verfügung, in der Akte steht volle Therapie.“' }, warum: 'Ein Reanimationsverzicht muss eindeutig vorliegen. Hörensagen reicht nicht.' },
      { id: 'f-seitenlage', text: 'Bewusstlosen ohne normale Atmung in die Seitenlage gebracht', wenn: { alle: [{ getan: 'stabile-seitenlage' }, { nicht: ROSC }] }, schwere: 'schwer', kompetenzbereiche: ['I'],
        warum: 'Die Seitenlage ist für Bewusstlose mit normaler Atmung. Schnappatmung ist ein Zeichen des Stillstands: drücken!' },
      { id: 'f-spaet', text: 'Herzdruckmassage nicht in den ersten zwei Minuten begonnen', wenn: { nichtGetan: 'bls-herzdruckmassage', bis: 120 }, schwere: 'mittel', kompetenzbereiche: ['I'],
        warum: 'Jede Minute ohne Herzdruckmassage verschlechtert das Überleben und das neurologische Ergebnis.' },
    ],
    ende: [
      { wenn: { flag: 'auf-intensiv' }, text: 'Herr Becker wird mit eigenem Kreislauf und Sauerstoff vom Reanimationsteam auf die Intensivstation gebracht.', ausgang: 'verlegt' },
      { wenn: { alle: [KEIN_KREISLAUF, { nichtGetan: 'bls-herzdruckmassage', bis: 480 }] }, text: 'Acht Minuten ohne Herzdruckmassage. Das Team übernimmt, die Aussichten sind jetzt sehr schlecht.', ausgang: 'verschlechtert' },
      { wenn: { getan: 'wahl:e-nachbar-wille:w-aufhoeren' }, text: 'Die Reanimation wurde unterbrochen. Sandra und das Team übernehmen.', ausgang: 'verschlechtert' },
    ],
  },

  pflegebedarf: {
    probleme: [
      { id: 'pb-postrea', text: 'Nach Reanimation: Kreislauf und Atmung instabil gefährdet, erneuter Stillstand möglich', richtig: true, prioritaet: 1, warum: 'In den ersten Stunden nach ROSC kommt es häufig zu erneuten Rhythmusstörungen.' },
      { id: 'pb-bewusstsein', text: 'Bewusstsein getrübt: Atemwege und Schutzreflexe gefährdet', richtig: true, prioritaet: 1, warum: 'Aspiration und Verlegung der Atemwege drohen, Überwachung und Lagerung nötig.' },
      { id: 'pb-kalium', text: 'Rhythmusgefahr durch niedriges Kalium', richtig: true, prioritaet: 2, warum: 'Behebbare Ursache (4 H und HITS): Ausgleich nach Anordnung, Kontrolle.' },
      { id: 'pb-angehoerige', text: 'Angst und Unsicherheit der Ehefrau', richtig: true, prioritaet: 3, warum: 'Information, Begleitung, Gespräch mit der Ärztin.' },
      { id: 'pb-mobilitaet', text: 'Eingeschränkte Mobilität beim Gassigehen', richtig: false, warum: 'Hat jetzt keine Bedeutung.' },
    ],
    ziele: [
      { id: 'z-kreislauf', text: 'Stabiler Rhythmus und Kreislauf, SpO₂ 94–98 %, lückenlos überwacht', passtZu: ['pb-postrea'], richtig: true },
      { id: 'z-atemweg', text: 'Atemweg frei, keine Aspiration', passtZu: ['pb-bewusstsein'], richtig: true },
      { id: 'z-kalium', text: 'Kalium im Normbereich nach Ausgleich', passtZu: ['pb-kalium'], richtig: true },
      { id: 'z-hund', text: 'Herr Becker geht morgen mit dem Hund', passtZu: ['pb-mobilitaet'], richtig: false },
    ],
  },
  leitfaden: [
    { titel: 'Erkennen in Sekunden', quellen: ['erc-2025'],
      text: 'Keine Reaktion und keine normale Atmung bedeuten Kreislaufstillstand. Schnappatmung ist kein Lebenszeichen, sondern ein typisches Zeichen der ersten Minuten. Die Pulskontrolle ist für Ungeübte unzuverlässig und wird nicht verlangt.' },
    { titel: 'Hochwertige Herzdruckmassage', quellen: ['erc-2025'],
      text: 'Harte Unterlage, Brustmitte, 5–6 cm tief, 100–120/min, vollständig entlasten. 30:2 mit Beutel und Maske, sobald zwei Helfende da sind. Helferwechsel alle zwei Minuten, Pausen unter zehn Sekunden.' },
    { titel: 'AED und Schock', quellen: ['erc-2025'],
      text: 'AED so früh wie möglich. Während des Ladens wird weitergedrückt. Vor dem Auslösen laut „Alle weg!“ und schauen. Nach dem Schock sofort zwei Minuten weiter, ohne Pulskontrolle.' },
    { titel: 'Innerklinisch: Alarm, Übergabe, Dokumentation', quellen: ['grc-innerklinisch'],
      text: 'Notrufnummer des Reanimationsteams kennen, Notfallwagen und AED holen lassen. Bei Ankunft kurze Übergabe: Wer, wann gefunden, seit wann Herzdruckmassage, Schocks, Verlauf. Danach Protokoll mit Zeitpunkten.' },
    { titel: 'Patientenwille', quellen: ['dnr-bgb'],
      text: 'Ein Verzicht auf Reanimation muss eindeutig dokumentiert sein (Patientenverfügung, ärztliche Festlegung des Behandlungsumfangs). Ohne das wird reanimiert. Angehörige oder Mitpatienten geben Hinweise auf den mutmaßlichen Willen, die die Ärztin danach prüft.' },
    { titel: 'Behebbare Ursachen (4 H und HITS)',
      text: 'Hypoxie, Hypovolämie, Hypo-/Hyperkaliämie, Hypothermie; Herzbeuteltamponade, Intoxikation, Thrombose (Herz, Lunge), Spannungspneumothorax. Hier: Kalium 3,1 mmol/l unter Furosemid bei KHK.' },
  ],

  pruefwege: {
    muster: [
      { art: 'massnahme', id: 'bewusstsein-avpu' },
      { art: 'massnahme', id: 'atmung-beobachten' },
      { art: 'massnahme', id: 'rea-team-alarmieren' },
      { art: 'massnahme', id: 'bls-herzdruckmassage' },
      { art: 'frage', id: 'g-kollegin-drucken' },
      { art: 'massnahme', id: 'beutel-maske-beatmen' },
      { art: 'massnahme', id: 'aed-anlegen' },
      { art: 'massnahme', id: 'bls-weiter' },
      { art: 'massnahme', id: 'puls-zaehlen' },
      { art: 'massnahme', id: 'bewusstsein-avpu' },
      { art: 'massnahme', id: 'kurve-lesen' },
      { art: 'warten', sek: 30 },
      { art: 'anruf', an: 'aerztin', sbar: ['s-rea', 'b-zeit', 'b-khk', 'b-kalium', 'a-rosc', 'a-bewusstlos', 'r-uebernahme'] },
      { art: 'rueckmelden', anordnung: 'an-o2', rueckgelesen: true },
      { art: 'rueckmelden', anordnung: 'an-ekg', rueckgelesen: true },
      { art: 'rueckmelden', anordnung: 'an-intensiv', rueckgelesen: true },
      { art: 'massnahme', id: 'o2-geben' },
      { art: 'massnahme', id: 'monitor-anlegen' },
      { art: 'massnahme', id: 'bz-messen' },
      { art: 'nachricht', an: 'aerztin', kanal: 'vor-ort', bausteine: ['wert:bz'] },
      { art: 'anleitung-anfordern', massnahme: 'ekg-12-kanal' },
      { art: 'massnahme', id: 'ekg-12-kanal' },
      { art: 'dokumentieren', bausteine: ['befund:bls-herzdruckmassage', 'befund:aed-anlegen', 'a-rosc', 'a-bewusstlos', 'wert:bz'] },
      { art: 'frage', id: 'g-ehefrau' },
      { art: 'nachricht', an: 'aufnehmende-station', kanal: 'telefon', bausteine: ['s-rea', 'b-zeit', 'b-khk', 'a-rosc', 'a-bewusstlos', 'r-intensiv'] },
      { art: 'massnahme', id: 'verlegung-uebergabe' },
      { art: 'abschluss', probleme: ['pb-postrea', 'pb-bewusstsein', 'pb-kalium', 'pb-angehoerige'], ziele: ['z-kreislauf', 'z-atemweg', 'z-kalium'],
        sbar: ['s-rea', 'b-zeit', 'b-khk', 'b-kalium', 'a-rosc', 'a-bewusstlos', 'r-uebernahme'] },
    ],
    unterlassung: { bisSek: 600, erwartet: { alle: [KEIN_KREISLAUF, { wert: 'laktat', vergleich: '>', grenze: 4 }] } },
    // 2. Drittel will selbst manuell defibrillieren: ärztliche Aufgabe (Stufe 2 PA warnt, Stufe 3 Grenzüberschreitung + Abbruch)
    grenze: {
      rolle: 2,
      events: [
        { art: 'massnahme', id: 'bewusstsein-avpu' },
        { art: 'massnahme', id: 'rea-team-alarmieren' },
        { art: 'massnahme', id: 'bls-herzdruckmassage' },
        { art: 'massnahme', id: 'defibrillation-manuell' },
      ],
      erwartet: 'pa-eingriff',
    },
  },
};
