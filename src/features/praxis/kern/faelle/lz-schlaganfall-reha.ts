// Fallwelle P17b (CE 07) · Kurzzeitpflege nach Schlaganfall: Frühstück mit Schluckstörung, Neglect, Positionierung,
// Anleitung zur Selbstpflege und der Ehefrau vor der Rückkehr nach Hause. Neuer Fall (FALLPLAN-CE.md).
// Entwurf, fachlich UNGEPRÜFT. Inhalte fiktiv/didaktisch.

import { KATALOG } from '../katalog';
import type { ArztRegel, FallV2, MassnahmeDefinition } from '../typen';

const aus = (id: string, mehr: Partial<MassnahmeDefinition>): MassnahmeDefinition => ({ ...KATALOG[id]!, ...mehr });

const ANTWORT: ArztRegel = {
  id: 'r-antwort',
  wenn: { gemeldet: ['a-husten-trinken', 'a-tabletten', 'wert:temp', 'wert:spo2'] },
  antwort: '„Danke. Kein Fieber, Sättigung gut, das beruhigt mich. Bleiben Sie bei der angedickten Kost, bis die Logopädin ihn heute Mittag sieht. Die Tabletten mörsern Sie bitte alle und geben sie in Joghurt. Kontrollieren Sie nach dem Frühstück noch einmal Sättigung und Temperatur und schicken Sie mir die Werte.“',
  anordnungen: ['an-moersern', 'an-kost'],
  setzt: ['arzt-informiert'],
  auftraege: ['af-kontrolle'],
};

export const LZ_SCHLAGANFALL_REHA: FallV2 = {
  schema: 2,
  id: 'lz-schlaganfall-reha',
  version: '0.1.0',
  spur: 'A',
  setting: 'langzeit',
  altersgruppe: 'hochbetagt',
  titel: '„Die linke Seite gibt es nicht mehr“',
  kurz: 'Kurzzeitpflege nach Schlaganfall: Frühstück mit Schluckstörung und Neglect, die Ehefrau will helfen lernen.',
  rahmen: 'Frühdienst in der Kurzzeitpflege. Herr Wagner ist seit einer Woche nach der Reha-Klinik bei euch und soll in zwei Wochen nach Hause. Heute kommt seine Frau zum Üben.',
  lernziele: [
    'Schluckfähigkeit vor dem Essen prüfen und die Kost nach der Empfehlung der Logopädie anpassen.',
    'Nach Schlaganfall sicher positionieren und die betroffene Seite (Schulter, Neglect) einbeziehen.',
    'Zur Selbstpflege anleiten, statt abzunehmen, und die Ehefrau für zu Hause anleiten.',
    'Mit Ärztin und Therapieteam zusammenarbeiten und eine ungeeignete Anordnung (alle Tabletten mörsern) hinterfragen.',
  ],
  lehrplan: {
    ce: ['ce.07', 'ce.02'],
    abschnitt: ['ad12', 'ad3'],
    themen: ['thema.kl.neuro.schlaganfall', 'thema.pro.aspiration', 'thema.ph.mobilisation', 'thema.kom.beratung'],
    kompetenzen: ['I.6.b', 'I.6.c', 'II.2.a', 'III.3.a', 'III.3.c'],
  },
  geeignet: { rollen: [2, 3], stufen: [1, 2, 3] },
  dauerMin: [15, 25],
  freigabe: {
    status: 'entwurf',
    pruefpunkte: [
      'Schluckscreening durch Pflege (Wasserschluck-Test nach Standard der Einrichtung) und Befugnis 2. Drittel mit Anleitung prüfen',
      'Positionierung bei Hemiparese/Schulter (Expertenstandard Mobilität, Leitlinie Schlaganfall-Reha) prüfen',
      'Remonstrationspunkt „alle Tabletten mörsern“ (Pantoprazol magensaftresistent) fachlich prüfen',
      'Rolle der Logopädie, Kostform-Bezeichnungen (IDDSI) passend?',
    ],
  },
  quellen: [
    { id: 'dgn-dysphagie', titel: 'DGN/DGG S1-Leitlinie Neurogene Dysphagie (030-111), Fassung 2020', fundstelle: 'Screening, Kostanpassung' },
    { id: 'dgnr-reha', titel: 'DGNR S2e-Leitlinie Rehabilitation der Mobilität nach Schlaganfall (ReMoS), 2020/2021' },
    { id: 'dnqp-mobilitaet', titel: 'DNQP: Expertenstandard Erhaltung und Förderung der Mobilität in der Pflege, Aktualisierung 2020' },
    { id: 'iddsi', titel: 'IDDSI Framework: International Dysphagia Diet Standardisation Initiative (2019)' },
    { id: 'adka-teilbar', titel: 'Fachinformation Pantoprazol (magensaftresistente Tablette, nicht zerkleinern)' },
  ],

  person: {
    name: 'Herr Wagner',
    alter: { jahre: 79 },
    geschlecht: 'm',
    biografie: ['verheiratet, wohnt mit seiner Frau in einer Erdgeschosswohnung', 'früher Schreiner', 'trinkt morgens gern starken Kaffee'],
    diagnosenBekannt: ['Ischämischer Schlaganfall rechts (vor 5 Wochen) mit Hemiparese links und Neglect links', 'Dysphagie (leicht)', 'arterielle Hypertonie', 'Pflegegrad 3 (beantragt)'],
    medikamentePlan: ['ASS 100 mg 1-0-0', 'Atorvastatin 40 mg 0-0-1', 'Ramipril 5 mg 1-0-0', 'Pantoprazol 20 mg 1-0-0 (magensaftresistent)'],
    allergien: ['keine bekannt'],
    hilfsmittel: ['Rollstuhl', 'Vierpunktstock (mit Physio)', 'Antirutschbrett', 'Andickungsmittel'],
    gewichtKg: 78,
  },
  medien: {
    raum: '26a_pflegeheim_zimmer_schlaganfall',
    raumVarianten: [],
  },
  uebernahme: 'Herr Wagner, 79, Schlaganfall rechts vor fünf Wochen, Lähmung und Neglect links, leichte Schluckstörung. Logopädie: Getränke leicht angedickt, weiche Kost. Er sitzt schon im Sessel. Seine Frau kommt gleich zum Frühstück, sie will lernen, wie sie ihm zu Hause hilft.',
  startUhrzeit: '08:00',

  start: {
    // G5 Neurologie: Restdefizit nach Infarkt rechts, linke Körperseite betroffen (neuroSeite 1)
    grund: { gefaesstonus: 1.12, schmerz: 2, angst: 0.2, orientierung: 0.95, temperatur: 36.8, blutzucker: 112, neuroDefizit: 0.4, neuroSeite: 1 },
    treiber: [],
    bild: { haltung: 'sitzt', haut: 'rosig', mimik: 'ruhig' },
    sichtbar: [],
    anordnungen: ['an-plan', 'an-kost-reha'],
  },

  massnahmen: [
    // Gespräch
    'vorstellen-einverstaendnis', 'ansprechen-orientierung', 'beschwerden-erfragen', 'biografie-erfragen', 'ehefrau-anleiten',
    // Beobachten
    'schlucken-pruefen', 'atmung-beobachten', 'atemgeraeusche-hoeren', 'schmerz-nrs', 'fast-test', 'dekubitusrisiko-einschaetzen', 'haut-beobachten',
    // Akut
    'am-arm-hochziehen',
    // Messen
    'pulsoxy-anlegen', 'temperatur-ohr', 'rr-messen', 'puls-zaehlen', 'kurve-lesen',
    // Versorgen
    'positionieren-hemiplegie', 'anleiten-fruehstueck', 'essen-anreichen', 'kost-anpassen', 'mundpflege', 'tabletten-wie-geplant-geben', 'tabletten-moersern', 'tabletten-angepasst', 'mobilisieren-transfer',
    // Melden
    'therapieteam-informieren', 'pflegefachperson-informieren', 'pflegebericht', 'pflegeplanung-anpassen',
  ],
  massnahmenZusatz: [
    aus('anleiten-selbstpflege', {
      id: 'anleiten-fruehstueck', name: 'Frühstück zum Selbstessen anleiten: Teller in die Mitte, von links ansprechen, kleine Bissen, Kinn zur Brust',
      voraussetzung: { getan: 'schlucken-pruefen' }, setzt: ['isst-selbst'],
    }),
    aus('essen-anreichen', { name: 'Frühstück komplett anreichen (schneller)' }),
    aus('mundpflege', { name: 'Nach dem Essen Mundkontrolle (Reste in der linken Wange) und Mundpflege', setzt: ['mund-kontrolliert'] }),
    aus('bezugsperson-anleiten', {
      id: 'ehefrau-anleiten', name: 'Frau Wagner anleiten: Getränke andicken, von links ansprechen, Transfer über die gesunde Seite',
    }),
    {
      id: 'am-arm-hochziehen', name: 'Am linken Arm im Sessel hochziehen', reiter: 'akut', spur: 'A', zeitbedarfSekunden: 20,
      befugnis: { 1: 'selbst', 2: 'selbst', 3: 'selbst', pflegefachperson: 'selbst' }, kompetenzbereiche: ['I', 'V'],
    },
    aus('tabletten-wie-geplant-geben', {
      id: 'tabletten-moersern', name: 'Alle Morgentabletten mörsern und in Joghurt geben',
    }),
    aus('tabletten-wie-geplant-geben', {
      id: 'tabletten-angepasst', name: 'ASS und Ramipril gemörsert in angedicktem Joghurt, Pantoprazol ganz (nach Rücksprache)',
    }),
  ],

  akte: {
    aufnahmegrund: 'Kurzzeitpflege nach stationärer neurologischer Rehabilitation (Phase C). Ziel: Rückkehr nach Hause in etwa zwei Wochen mit Unterstützung der Ehefrau und ambulantem Pflegedienst.',
    anamnese: [
      'Ischämischer Schlaganfall rechts vor fünf Wochen. Hemiparese links (Arm stärker als Bein), Neglect nach links. Spricht verwaschen, aber verständlich.',
      'Isst mit der rechten Hand selbst, wenn das Essen richtig steht. Lässt Speisen auf der linken Tellerseite liegen.',
      'Transfer Bett–Rollstuhl mit einer Person über die rechte Seite. Linke Schulter schmerzt bei Zug.',
      'Ehefrau (76) möchte ihn zu Hause versorgen, ist unsicher beim Essen und beim Transfer.',
    ],
    diagnosen: [
      { text: 'Hirninfarkt im Versorgungsgebiet der A. cerebri media rechts', icd: 'I63.5', seit: 'vor 5 Wochen' },
      { text: 'Hemiparese links, Neglect links', icd: 'G81.9', seit: 'vor 5 Wochen' },
      { text: 'Neurogene Dysphagie, leicht', icd: 'R13.1', seit: 'vor 5 Wochen' },
      { text: 'Arterielle Hypertonie', icd: 'I10.90', seit: '2010' },
    ],
    medikation: [
      { id: 'mp-ass', wirkstoff: 'Acetylsalicylsäure', staerke: '100 mg', form: 'Tbl.', schema: '1-0-0-0', massnahme: 'tabletten-angepasst', zuletzt: 'gestern 08:15', geaendertDurch: 'an-tabletten-geprueft' },
      { id: 'mp-ramipril', wirkstoff: 'Ramipril', staerke: '5 mg', form: 'Tbl.', schema: '1-0-0-0', massnahme: 'tabletten-angepasst', zuletzt: 'gestern 08:15', geaendertDurch: 'an-tabletten-geprueft' },
      { id: 'mp-pantoprazol', wirkstoff: 'Pantoprazol', staerke: '20 mg', form: 'Tbl. magensaftresistent', schema: '1-0-0-0', massnahme: 'tabletten-angepasst', zuletzt: 'gestern 08:15',
        hinweis: 'Magensaftresistent: nicht teilen, nicht mörsern.', geaendertDurch: 'an-tabletten-geprueft' },
      { id: 'mp-atorvastatin', wirkstoff: 'Atorvastatin', staerke: '40 mg', form: 'Tbl.', schema: '0-0-1-0', zuletzt: 'gestern 18:00' },
    ],
    vorwerte: [
      { zeit: 'gestern 08:00', vorH: 24, werte: { rrSys: 148, rrDia: 84, hf: 74, temp: 36.7, spo2: 96 }, kuerzel: 'AK' },
      { zeit: 'gestern 18:00', vorH: 14, werte: { rrSys: 142, rrDia: 82, temp: 36.9 }, kuerzel: 'TS' },
    ],
    pflegebericht: [
      { zeit: 'gestern 08:30', wer: 'AK', text: 'Frühstück selbst gegessen, nachdem der Teller nach rechts gedreht wurde. Beim Kaffee (nicht angedickt, von Besuch mitgebracht) zweimal gehustet. Logopädie informiert.' },
      { zeit: 'gestern 19:00', wer: 'TS', text: 'Tabletten am Abend nur mit viel Mühe geschluckt, hustet danach. Klagt über Schmerz in der linken Schulter beim Hochrutschen.' },
    ],
    aerztlicheAnordnungen: [
      { zeit: 'Aufnahme', wer: 'Dr. Roth', text: 'Medikationsplan laut Entlassbrief Reha-Klinik. Physio- und Ergotherapie 5×/Woche, Logopädie 3×/Woche.' },
      { zeit: 'Aufnahme', wer: 'Logopädie (Frau Kern)', text: 'Weiche Kost, Getränke leicht angedickt (IDDSI Stufe 2). Aufrecht 90°, Kinn zur Brust, kleine Schlucke, nur unter Aufsicht. Mundkontrolle nach dem Essen.' },
    ],
    assessments: [
      { name: 'Wasserschluck-Test (Logopädie)', wert: 'auffällig bei dünnflüssig, unauffällig bei leicht angedickt', datum: 'vor 5 Tagen' },
      { name: 'Barthel-Index', wert: '45 von 100', datum: 'vor 5 Tagen', hinweis: 'Ziel für zu Hause: 60.' },
      { name: 'Braden-Skala', wert: '17 Punkte (geringes Risiko)', datum: 'vor 5 Tagen' },
      { name: 'Schmerz linke Schulter (NRS)', wert: '2 in Ruhe, 6 bei Zug', datum: 'gestern' },
    ],
    pflegeplanung: [
      { problem: 'Aspirationsgefahr bei Schluckstörung', ziel: 'Isst und trinkt ohne Verschlucken', massnahmen: ['Kost nach Logopädie', 'Aufrecht sitzen', 'Mundkontrolle nach dem Essen'] },
      { problem: 'Selbstversorgung Essen eingeschränkt (Hemiparese, Neglect links)', ziel: 'Isst selbstständig mit Hilfsmitteln', massnahmen: ['Teller in die Mitte bzw. rechts', 'von links ansprechen', 'Antirutschbrett'] },
      { problem: 'Gefahr der Schulterverletzung links', ziel: 'Schulter schmerzarm, kein Zug am Arm', massnahmen: ['Arm unterlagern', 'Transfer über die rechte Seite, nie am Arm ziehen'] },
    ],
    rechtliches: ['Einwilligungsfähig. Ehefrau hat Vorsorgevollmacht (Gesundheit), Auskunft erlaubt.'],
  },

  befunde: [
    { massnahme: 'ansprechen-orientierung', varianten: [{ text: 'Du sprichst ihn von links an. Er reagiert erst, als du nach rechts gehst: „Ach, da sind Sie.“ Orientiert, spricht etwas verwaschen.' }] },
    { massnahme: 'beschwerden-erfragen', varianten: [{ text: '„Die Schulter tut weh, wenn man mich hochzieht. Und gestern Abend die Tabletten … die bleiben hängen.“' }] },
    { massnahme: 'schlucken-pruefen', varianten: [{ text: 'Aufrecht sitzend: Teelöffel leicht angedicktes Wasser ohne Auffälligkeit. Beim Schluck dünnflüssigen Wassers hustet er, die Stimme klingt danach kurz „gurgelnd“. Ergebnis wie bei der Logopädie: dünnflüssig nicht sicher.' }] },
    { massnahme: 'atmung-beobachten', varianten: [{ text: 'Atmet ruhig und gleichmäßig, kein Rasseln hörbar.' }] },
    { massnahme: 'atemgeraeusche-hoeren', varianten: [
      { wenn: { flag: 'aspiriert' }, text: 'Rechts basal feine Rasselgeräusche.' },
      { text: 'Vesikuläres Atemgeräusch beidseits, keine Nebengeräusche.' },
    ] },
    { massnahme: 'schmerz-nrs', varianten: [{ text: 'Linke Schulter: in Ruhe 2, beim Hochziehen 6 von 10.' }] },
    { massnahme: 'fast-test', varianten: [{ text: 'Bekannte Lähmung links und hängender Mundwinkel links, unverändert zum Aufnahmebefund. Keine neuen Ausfälle.' }] },
    { massnahme: 'dekubitusrisiko-einschaetzen', varianten: [{ text: 'Haut am Steiß und an den Fersen intakt, keine Rötung. Braden 17.' }] },
    { massnahme: 'haut-beobachten', varianten: [{ text: 'Rosig, warm, trocken.' }] },
    { massnahme: 'pulsoxy-anlegen', varianten: [{ text: 'SpO₂ {spo2} %, Puls {hf}.', zeigt: ['spo2', 'hf'] }] },
    { massnahme: 'temperatur-ohr', varianten: [{ text: '{temp} °C (rechtes Ohr).', zeigt: ['temp'] }] },
    { massnahme: 'rr-messen', varianten: [{ text: 'RR {rrSys}/{rrDia} mmHg am rechten Arm.', zeigt: ['rrSys', 'rrDia'] }] },
    { massnahme: 'puls-zaehlen', varianten: [{ text: 'Puls {hf}/min, regelmäßig.', zeigt: ['hf'] }] },
    { massnahme: 'kurve-lesen', varianten: [{ text: 'Logopädie: weiche Kost, Getränke leicht angedickt, aufrecht, Kinn zur Brust, nur unter Aufsicht. Pantoprazol ist magensaftresistent. Gestern Husten beim Kaffee und bei den Abendtabletten.' }] },
    { massnahme: 'positionieren-hemiplegie', varianten: [{ text: 'Er sitzt aufrecht im Sessel, das Becken hinten, der linke Arm liegt auf einem Kissen vor ihm auf dem Tisch. „So zieht die Schulter nicht.“' }] },
    { massnahme: 'anleiten-fruehstueck', varianten: [{ text: 'Teller mittig auf dem Antirutschbrett, du erinnerst ihn an die linke Seite. Er isst das weiche Brot selbst mit der rechten Hand, Kinn zur Brust, kleine Bissen. „Das schmeckt, wenn man es selbst macht.“' }] },
    { massnahme: 'essen-anreichen', varianten: [{ text: 'Du reichst alles an. Es geht schneller, aber Herr Wagner schaut weg: „Ich bin doch kein Kind.“' }] },
    { massnahme: 'mundpflege', varianten: [{ text: 'In der linken Wangentasche liegen noch Brotreste, er spürt sie nicht. Du entfernst sie und machst Mundpflege.' }] },
    { massnahme: 'ehefrau-anleiten', varianten: [{ text: 'Du zeigst Frau Wagner, wie sie den Kaffee andickt, ihn von links anspricht und beim Transfer über die rechte Seite hilft, ohne am Arm zu ziehen. Sie probiert es selbst: „Das kann ich mir merken. Und den Kaffee mag er so auch.“' }] },
  ],

  gespraech: [
    { id: 'g-ehefrau-sorgen', frage: 'Frau Wagner fragen, was ihr für zu Hause Sorgen macht', an: 'angehoerige', kanal: 'vor-ort', kompetenzbereiche: ['II'],
      nurWenn: { ab: 180 },
      antwort: [{ text: '„Dass er sich verschluckt und ich nichts merke. Und dass ich ihm wehtue, wenn ich ihn hochhebe.“', setzt: ['sorgen-gehoert'] }],
      fakten: ['Angst vor Verschlucken', 'Angst, ihm beim Transfer wehzutun', 'Ehefrau 76 Jahre'] },
    { id: 'g-ziele', frage: 'Herrn Wagner fragen, was er zu Hause wieder selbst können möchte', an: 'patient', kompetenzbereiche: ['I', 'II'],
      antwort: [{ text: '„Allein essen. Und in meiner Werkstatt sitzen, auch wenn ich nichts mehr bauen kann.“', setzt: ['ziele-erfragt'] }] },
    { id: 'g-kollegin-logo', frage: 'Kollegin Aylin fragen, wann die Logopädin heute kommt', an: 'kollegin', kompetenzbereiche: ['III'],
      antwort: [{ text: '„Frau Kern kommt um 12. Schreib ihr eine Notiz, dann schaut sie sich die Tabletten mit an.“' }] },
  ],

  sbar: [
    { id: 's-schlucken', teil: 'S', text: 'Herr Wagner, 79, Kurzzeitpflege nach Schlaganfall rechts: hustet beim Trinken und bei Tabletten.', art: 'kern' },
    { id: 'b-schlaganfall', teil: 'B', text: 'Hemiparese und Neglect links, leichte Dysphagie; Logopädie: Getränke leicht angedickt, weiche Kost.', art: 'kern' },
    { id: 'b-schreiner', teil: 'B', text: 'Er war Schreiner.', art: 'ablenker' },
    { id: 'a-husten-trinken', teil: 'A', text: 'Bei dünnflüssigem Wasser Husten und gurgelnde Stimme, bei angedickt unauffällig.', art: 'kern', bekanntWenn: { getan: 'schlucken-pruefen' } },
    { id: 'a-tabletten', teil: 'A', text: 'Ganze Tabletten bleiben hängen, gestern Abend Husten danach.', art: 'kern' },
    { id: 'a-schulter', teil: 'A', text: 'Schulterschmerz links bei Zug, NRS 6.', art: 'hilfreich', bekanntWenn: { getan: 'schmerz-nrs' } },
    { id: 'a-neu-schlaganfall', teil: 'A', text: 'Ich glaube, er hat einen neuen Schlaganfall.', art: 'falsch' },
    { id: 'r-tabletten', teil: 'R', text: 'Können die Tabletten in anderer Form gegeben werden?', art: 'kern' },
  ],

  anordnungen: [
    { id: 'an-plan', massnahme: 'tabletten-wie-geplant-geben', text: 'Medikationsplan laut Entlassbrief (ASS, Ramipril, Pantoprazol morgens, Atorvastatin abends).' },
    { id: 'an-kost-reha', massnahme: 'kost-anpassen', text: 'Logopädie: weiche Kost, Getränke leicht angedickt (IDDSI 2), nur unter Aufsicht.' },
    { id: 'an-kost', massnahme: 'kost-anpassen', text: 'Angedickte Kost beibehalten, bis die Logopädie ihn sieht.' },
    { id: 'an-moersern', massnahme: 'tabletten-moersern', text: 'Alle Morgentabletten mörsern und in Joghurt geben.',
      fehlerhaft: { warum: 'Pantoprazol ist magensaftresistent. Gemörsert wird es von der Magensäure zerstört und wirkt nicht. Retard- und magensaftresistente Arzneiformen nicht zerkleinern; im Zweifel Apotheke fragen.',
        korrektur: 'Stimmt. ASS und Ramipril dürfen gemörsert werden, Pantoprazol bitte ganz in angedicktem Joghurt. Ich lasse die Apotheke eine Alternative prüfen.', ersatz: 'an-tabletten-geprueft' } },
    { id: 'an-tabletten-geprueft', massnahme: 'tabletten-angepasst', text: 'ASS und Ramipril gemörsert in angedicktem Joghurt, Pantoprazol ganz. Apotheke prüft Alternative.' },
  ],

  arzt: {
    name: 'Hausärztin Dr. Roth',
    erreichbar: 'telefon',
    kanaele: ['messenger', 'telefon'],
    regeln: [
      ANTWORT,
      { id: 'r-rueckfrage', wenn: { gemeldet: ['a-husten-trinken', 'a-tabletten'] },
        antwort: '„Danke. Bei Husten beim Schlucken denke ich zuerst an eine Aspiration.“',
        rueckfrage: { text: '„Hat er Fieber, und wie ist die Sättigung?“', erwartet: ['wert:temp', 'wert:spo2'], auftrag: 'af-werte' } },
      { wenn: { gemeldet: ['s-schlucken'] },
        antwort: '„Was genau ist beim Schlucken auffällig? Melden Sie sich bitte mit Ihrer Einschätzung und den Werten.“', },
      { wenn: { gemeldet: ['a-neu-schlaganfall'] },
        antwort: '„Welche neuen Ausfälle sehen Sie? Wenn neue Ausfälle da sind, sofort 112.“' },
    ],
    auftraege: [
      { id: 'af-werte', text: 'Temperatur und Sättigung messen und der Ärztin melden', erledigt: { alle: [{ getan: 'temperatur-ohr' }, { getan: 'pulsoxy-anlegen' }] },
        meldung: ['wert:temp', 'wert:spo2'], meldenBinnenSek: 900, folge: [{ ...ANTWORT, wenn: { gemeldet: ['wert:temp', 'wert:spo2'] } }] },
      { id: 'af-kontrolle', text: 'Nach dem Frühstück Sättigung und Temperatur kontrollieren und der Ärztin schicken', erledigt: { alle: [{ getan: 'pulsoxy-anlegen' }, { getan: 'temperatur-ohr' }] },
        meldung: ['wert:spo2', 'wert:temp'], meldenBinnenSek: 2100,
        folge: [
          { wenn: { wert: 'spo2', vergleich: '>=', grenze: 94 }, antwort: '„Danke, unauffällig. Weiter so, die Logopädin übernimmt ab Mittag.“', setzt: ['kontrolle-gemeldet'] },
          { wenn: { ab: 0 }, antwort: '„Die Sättigung gefällt mir nicht. Oberkörper hoch, nichts mehr zu trinken geben, ich komme in einer halben Stunde.“', setzt: ['kontrolle-gemeldet'], kommtNachSek: 1800 },
        ] },
    ],
  },

  team: { kollegin: 'Pflegefachfrau Aylin (Schichtleitung)', weitere: { angehoerige: 'Ehefrau Frau Wagner' } },

  ereignisse: [
    { id: 'e-kaffee', art: 'angehoerige', wann: { ab: 240 },
      text: 'Frau Wagner kommt mit einer Thermoskanne: „Ich hab ihm seinen Kaffee mitgebracht, schwarz, wie er ihn mag. Den aus der Küche trinkt er ja nicht.“',
      entscheidung: [
        { id: 'w-erklaeren', text: 'Freundlich erklären, warum Getränke angedickt sein müssen, und den Kaffee gemeinsam andicken', wertung: 'gut', setzt: ['kaffee-angedickt'],
          warum: 'So bekommt er seinen Kaffee sicher, und Frau Wagner lernt gleich etwas für zu Hause.' },
        { id: 'w-lassen', text: 'Ist ja nur ein Kaffee, sie soll ihn ihm geben', wertung: 'gefaehrlich', setzt: ['kaffee-duenn'],
          warum: 'Dünnflüssiges ist für ihn nicht sicher: Er verschluckt sich und kann eine Lungenentzündung bekommen.' },
        { id: 'w-wegstellen', text: 'Kaffee kommentarlos wegstellen', wertung: 'vertretbar',
          warum: 'Sicher, aber Frau Wagner versteht nicht warum und macht es zu Hause wieder.' },
      ] },
    { id: 'e-verschluckt', art: 'komplikation', wann: { eine: [{ flag: 'kaffee-duenn' }, { alle: [{ ab: 720 }, { nicht: { flag: 'kost-angepasst' } }] }] },
      text: 'Herr Wagner trinkt einen großen Schluck, hustet heftig und ringt nach Luft. Die Stimme klingt nass.',
      bild: { haltung: 'sitzt-ringt', haut: 'blass', mimik: 'angst' } },
  ],

  pa: {
    name: 'Praxisanleiterin Frau Yilmaz',
    hilfen: [
      { wenn: { nicht: { getan: 'schlucken-pruefen' } }, impuls: 'Gleich gibt es Frühstück. Was weißt du über sein Schlucken?', tipp: 'Lies die Empfehlung der Logopädie und prüfe das Schlucken, bevor er isst.' },
      { wenn: { nicht: { getan: 'positionieren-hemiplegie' } }, impuls: 'Wie sitzt er gerade, und wo ist sein linker Arm?', tipp: 'Aufrecht positionieren, den linken Arm unterlagern.' },
      { wenn: { nicht: { getan: 'anleiten-fruehstueck' } }, impuls: 'Was kann er beim Essen schon selbst?', tipp: 'Teller richtig hinstellen und ihn selbst essen lassen, statt anzureichen.' },
      { wenn: { auftrag: 'af-kontrolle', status: 'offen' }, impuls: 'Was wollte die Ärztin nach dem Frühstück noch wissen?', tipp: 'Sättigung und Temperatur messen und ihr schicken.' },
      { impuls: 'Wer hilft ihm in zwei Wochen beim Frühstück?', tipp: 'Frau Wagner anleiten: andicken, von links ansprechen, Transfer über die gesunde Seite.' },
    ],
  },

  bewertung: {
    pflicht: [
      { id: 'p-schlucken', text: 'Schlucken vor dem Essen geprüft', gewicht: 3, kompetenzbereiche: ['I', 'V'],
        erfuellt: { getan: 'schlucken-pruefen', bis: 600 }, warum: 'Bei Dysphagie vor jeder Mahlzeit sicherstellen, was er schlucken kann (Aspirationsprophylaxe).' },
      { id: 'p-kost', text: 'Kost und Getränke nach Logopädie angepasst', gewicht: 3, kompetenzbereiche: ['I', 'III'],
        erfuellt: { flag: 'kost-angepasst' }, warum: 'Leicht angedickte Getränke verhindern das Verschlucken.' },
      { id: 'p-position', text: 'Sicher positioniert, linker Arm unterlagert', gewicht: 2, kompetenzbereiche: ['I', 'V'],
        erfuellt: { getan: 'positionieren-hemiplegie', bis: 600 }, warum: 'Aufrecht sitzen schützt vor Aspiration, der unterlagerte Arm schützt die Schulter.' },
      { id: 'p-selbst', text: 'Zum Selbstessen angeleitet statt angereicht', gewicht: 2, kompetenzbereiche: ['I', 'II'],
        erfuellt: { alle: [{ getan: 'anleiten-fruehstueck' }, { nicht: { getan: 'essen-anreichen' } }] }, warum: 'Rehabilitative Pflege fördert, was er selbst kann. Abnehmen nimmt Übung und Würde.' },
      { id: 'p-mund', text: 'Mundkontrolle nach dem Essen', gewicht: 2, kompetenzbereiche: ['I'],
        erfuellt: { getan: 'mundpflege' }, warum: 'Reste in der gelähmten Wange werden nicht gespürt und können später aspiriert werden.' },
      { id: 'p-arzt', text: 'Ärztin mit Schluckbefund und Werten informiert', gewicht: 2, kompetenzbereiche: ['II', 'III'],
        erfuellt: { flag: 'arzt-informiert' }, warum: 'Husten beim Schlucken kann eine Aspiration sein; Tabletten brauchen eine andere Form.' },
      { id: 'p-tabletten', text: 'Tabletten in sicherer Form gegeben (Pantoprazol ganz)', gewicht: 2, kompetenzbereiche: ['I', 'III'],
        erfuellt: { getan: 'tabletten-angepasst' }, warum: 'Magensaftresistente Tabletten nicht mörsern.' },
      { id: 'p-rueckauftrag', text: 'Kontrolle nach dem Frühstück gemeldet', gewicht: 2, kompetenzbereiche: ['II', 'III'],
        erfuellt: { auftrag: 'af-kontrolle', status: 'gemeldet' }, warum: 'Eine stille Aspiration zeigt sich oft erst danach (Sättigung, Temperatur).' },
      { id: 'p-ehefrau', text: 'Ehefrau für zu Hause angeleitet', gewicht: 2, kompetenzbereiche: ['II'],
        erfuellt: { getan: 'ehefrau-anleiten' }, warum: 'Rehabilitation geht zu Hause weiter. Frau Wagner braucht Übung, nicht nur Erklärungen.' },
      { id: 'p-team', text: 'Therapieteam einbezogen', gewicht: 1, kompetenzbereiche: ['III'],
        erfuellt: { getan: 'therapieteam-informieren' }, warum: 'Logopädie und Physio passen ihre Ziele an, wenn die Pflege berichtet, was im Alltag passiert.' },
      { id: 'p-doku', text: 'Schluckbefund dokumentiert', gewicht: 1, kompetenzbereiche: ['I', 'IV'],
        erfuellt: { dokumentiert: 'befund:schlucken-pruefen' }, warum: 'Das Team (und später der Pflegedienst) muss wissen, was er sicher schlucken kann.' },
    ],
    fehler: [
      { id: 'f-arm', text: 'Am gelähmten Arm hochgezogen', schwere: 'schwer', kompetenzbereiche: ['I', 'V'],
        wenn: { getan: 'am-arm-hochziehen' },
        folge: { text: 'Herr Wagner schreit auf, die linke Schulter schmerzt stark.', wirkung: [{ groesse: 'schmerz', delta: 5, beginnSek: 0, spitzeSek: 5, dauerSek: 900 }] },
        warum: 'Zug am gelähmten Arm verletzt die instabile Schulter (Subluxation, Schulter-Hand-Syndrom).' },
      { id: 'f-anreichen', text: 'Alles angereicht, obwohl er selbst essen kann', schwere: 'leicht', kompetenzbereiche: ['I', 'II'],
        wenn: { getan: 'essen-anreichen' }, warum: 'Abnehmen verhindert Übung. Rehabilitative Pflege leitet an.' },
      { id: 'f-essen-ohne-pruefung', text: 'Essen ohne Schluckprüfung', schwere: 'mittel', kompetenzbereiche: ['I', 'V'],
        wenn: { alle: [{ eine: [{ getan: 'essen-anreichen' }, { getan: 'anleiten-fruehstueck' }] }, { nicht: { getan: 'schlucken-pruefen' } }] },
        warum: 'Bei bekannter Dysphagie vor dem Essen prüfen.' },
      { id: 'f-aspiration', text: 'Dünnflüssiges getrunken: verschluckt', schwere: 'schwer', kompetenzbereiche: ['I', 'V'],
        wenn: { eine: [{ flag: 'kaffee-duenn' }, { alle: [{ ab: 720 }, { nicht: { flag: 'kost-angepasst' } }] }] },
        folge: { text: 'Herr Wagner hustet lange, die Sättigung fällt.',
          wirkung: [{ groesse: 'gasaustausch', delta: -0.45, beginnSek: 0, spitzeSek: 180, dauerSek: 'dauerhaft' }, { groesse: 'angst', delta: 0.3, beginnSek: 0, spitzeSek: 30, dauerSek: 900 }] },
        warum: 'Dünnflüssige Getränke sind bei seiner Schluckstörung nicht sicher. Aspiration kann zur Lungenentzündung führen.' },
      { id: 'f-gemoersert', text: 'Magensaftresistente Tablette gemörsert', schwere: 'mittel', kompetenzbereiche: ['I', 'III'],
        wenn: { getan: 'tabletten-moersern' }, warum: 'Remonstrieren wäre richtig gewesen: Pantoprazol wirkt gemörsert nicht.' },
    ],
    ende: [
      { wenn: { alle: [{ flag: 'kontrolle-gemeldet' }, { getan: 'ehefrau-anleiten' }, { getan: 'pflegebericht' }] },
        text: 'Herr Wagner hat selbst gefrühstückt, ohne sich zu verschlucken. Frau Wagner weiß, wie sie den Kaffee andickt. Die Logopädin kommt um 12.', ausgang: 'stabil' },
      { wenn: { ab: 2700 }, text: 'Der Frühdienst geht weiter. Vieles ist offen geblieben.', ausgang: 'verschlechtert' },
    ],
  },

  pflegebedarf: {
    probleme: [
      { id: 'pb-aspiration', text: 'Aspirationsgefahr bei Schluckstörung', richtig: true, prioritaet: 1, warum: 'Gefahr einer Lungenentzündung, die häufigste Komplikation nach Schlaganfall.' },
      { id: 'pb-selbstversorgung', text: 'Eingeschränkte Selbstversorgung beim Essen (Hemiparese, Neglect links)', richtig: true, prioritaet: 2, warum: 'Mit Anleitung und Hilfsmitteln trainierbar.' },
      { id: 'pb-schulter', text: 'Gefahr der Schulterverletzung links', richtig: true, prioritaet: 2, warum: 'Schmerzhafte Schulter bei Zug; Transfer anpassen.' },
      { id: 'pb-angehoerige', text: 'Unsicherheit der Ehefrau bei der häuslichen Versorgung', richtig: true, prioritaet: 3, warum: 'Voraussetzung für die Rückkehr nach Hause.' },
      { id: 'pb-dekubitus', text: 'Dekubitus Kategorie 1 am Steiß', richtig: false, warum: 'Die Haut ist intakt (Braden 17).' },
      { id: 'pb-desorientiert', text: 'Desorientierung', richtig: false, warum: 'Er ist orientiert. Er übersieht die linke Seite (Neglect).' },
    ],
    ziele: [
      { id: 'z-schlucken', text: 'Herr Wagner isst und trinkt angedickte Kost ohne Husten.', passtZu: ['pb-aspiration'], richtig: true },
      { id: 'z-selbst', text: 'Herr Wagner isst sein Frühstück selbstständig, wenn der Teller richtig steht.', passtZu: ['pb-selbstversorgung'], richtig: true },
      { id: 'z-ehefrau', text: 'Frau Wagner dickt Getränke selbst an und hilft beim Transfer über die rechte Seite.', passtZu: ['pb-angehoerige', 'pb-schulter'], richtig: true },
      { id: 'z-anreichen', text: 'Alle Mahlzeiten werden angereicht, damit es schneller geht.', passtZu: ['pb-selbstversorgung'], richtig: false },
    ],
  },

  leitfaden: [
    { titel: 'Schlucken nach Schlaganfall', text: 'Viele Menschen haben nach einem Schlaganfall eine Schluckstörung. Dünnflüssiges fließt zu schnell und gelangt leicht in die Luftröhre, oft ohne kräftigen Husten (stille Aspiration). Angedickte Getränke, aufrechtes Sitzen, Kinn zur Brust und kleine Schlucke helfen. Nach dem Essen die Wangentaschen kontrollieren.', quellen: ['dgn-dysphagie', 'iddsi'] },
    { titel: 'Neglect und gelähmte Seite', text: 'Bei Neglect wird eine Seite nicht beachtet. Teller und Ansprache zunächst so, dass er alles sieht, dann gezielt die linke Seite einbeziehen. Den gelähmten Arm immer unterlagern und nie daran ziehen.', quellen: ['dgnr-reha', 'dnqp-mobilitaet'] },
    { titel: 'Rehabilitativ pflegen', text: 'Anleiten statt abnehmen: vormachen, selbst tun lassen, loben. Angehörige üben lassen, nicht nur erklären. Das Team (Logopädie, Physio, Ergo) über Beobachtungen im Alltag informieren.', quellen: ['dgnr-reha'] },
    { titel: 'Tabletten bei Schluckstörung', text: 'Nicht jede Tablette darf zerkleinert werden: Retard- und magensaftresistente Formen verlieren ihre Wirkung oder werden gefährlich. Anordnung hinterfragen, Apotheke fragen.', quellen: ['adka-teilbar'] },
  ],

  pruefwege: {
    muster: [
      { art: 'massnahme', id: 'vorstellen-einverstaendnis' },
      { art: 'massnahme', id: 'kurve-lesen' },
      { art: 'massnahme', id: 'positionieren-hemiplegie' },
      { art: 'anleitung-anfordern', massnahme: 'schlucken-pruefen' },
      { art: 'massnahme', id: 'schlucken-pruefen' },
      { art: 'massnahme', id: 'kost-anpassen' },
      { art: 'massnahme', id: 'anleiten-fruehstueck' },
      { art: 'frage', id: 'g-ziele' },
      { art: 'pflegetasche', geraet: 'thermometer' },
      { art: 'massnahme', id: 'temperatur-ohr' },
      { art: 'pflegetasche', geraet: 'pulsoxy' },
      { art: 'massnahme', id: 'pulsoxy-anlegen' },
      { art: 'nachricht', an: 'aerztin', kanal: 'messenger', bausteine: ['s-schlucken', 'b-schlaganfall', 'a-husten-trinken', 'a-tabletten', 'wert:temp', 'wert:spo2', 'r-tabletten'] },
      { art: 'massnahme', id: 'mundpflege' },
      { art: 'remonstrieren', anordnung: 'an-moersern', grund: 'Pantoprazol ist magensaftresistent und darf nicht gemörsert werden.' },
      { art: 'rueckmelden', anordnung: 'an-tabletten-geprueft', rueckgelesen: true },
      { art: 'rueckmelden', anordnung: 'an-kost', rueckgelesen: true },
      { art: 'massnahme', id: 'tabletten-angepasst' },
      { art: 'frage', id: 'g-ehefrau-sorgen' },
      { art: 'massnahme', id: 'ehefrau-anleiten' },
      { art: 'massnahme', id: 'therapieteam-informieren' },
      { art: 'dokumentieren', bausteine: ['befund:schlucken-pruefen', 'a-husten-trinken', 'anordnung:an-tabletten-geprueft'] },
      { art: 'massnahme', id: 'pulsoxy-anlegen' },
      { art: 'massnahme', id: 'temperatur-ohr' },
      { art: 'nachricht', an: 'aerztin', kanal: 'messenger', bausteine: ['wert:spo2', 'wert:temp'] },
      { art: 'warten', sek: 120 },
      { art: 'abschluss', probleme: ['pb-aspiration', 'pb-selbstversorgung', 'pb-schulter', 'pb-angehoerige'], ziele: ['z-schlucken', 'z-selbst', 'z-ehefrau'],
        sbar: ['s-schlucken', 'b-schlaganfall', 'a-husten-trinken', 'a-tabletten'] },
    ],
    unterlassung: { bisSek: 1500, erwartet: { wert: 'spo2', vergleich: '<', grenze: 92 } },
    grenze: { rolle: 2, events: [{ art: 'massnahme', id: 'schlucken-pruefen' }], erwartet: 'pa-eingriff' },
  },
};
