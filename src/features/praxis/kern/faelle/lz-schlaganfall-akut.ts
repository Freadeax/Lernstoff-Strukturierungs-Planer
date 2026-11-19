// Fallwelle P16b (CE06) · Pflegeheim, Frühdienst: akuter Schlaganfall beim Frühstück (BE-FAST, Notruf, Übergabe an den Rettungsdienst)
// Entwurf, fachlich UNGEPRÜFT. Inhalte fiktiv/didaktisch. Migriert und neu geschrieben aus dem Altfall „schlaganfall“ (scenarios.json).

import { KATALOG } from '../katalog';
import type { ArztRegel, Bedingung, FallV2, MassnahmeDefinition } from '../typen';

const aus = (id: string, mehr: Partial<MassnahmeDefinition>): MassnahmeDefinition => ({ ...KATALOG[id]!, ...mehr });

const NOTRUF: Bedingung = { getan: 'notruf-112' };
/** Rettungsdienst vor Ort: früher Notruf → nach 14 Min. Spielzeit, später Notruf → frühestens nach 25 Min. */
const RD_DA: Bedingung = { eine: [{ alle: [{ getan: 'notruf-112', bis: 420 }, { ab: 840 }] }, { alle: [NOTRUF, { ab: 1500 }] }] };
const BZ_BEKANNT: Bedingung = { getan: 'bz-messen' };
const PLAN_GELESEN: Bedingung = { getan: 'kurve-lesen' };
const GESCHLUCKT: Bedingung = { eine: [{ getan: 'trinken-anbieten' }, { getan: 'morgenmedikation-geben' }] };

const HAUSAERZTIN: ArztRegel = {
  id: 'r-hausaerztin', wenn: { ab: 0 },
  antwort: '„Gut, dass der Rettungsdienst schon unterwegs ist. Der Blutdruck ist hoch, geben Sie ihm doch noch seine Morgentabletten aus dem Dosett, Ramipril und Apixaban, dann ist er wenigstens versorgt. Und messen Sie mir bitte den Blutdruck noch einmal, bevor er abgeholt wird.“',
  anordnungen: ['an-morgenmedikation'], setzt: ['hausaerztin-informiert'], auftraege: ['af-rr'],
};

export const LZ_SCHLAGANFALL_AKUT: FallV2 = {
  schema: 2,
  id: 'lz-schlaganfall-akut',
  version: '0.1.0',
  spur: 'A',
  setting: 'langzeit',
  altersgruppe: 'hochbetagt',
  titel: '„Der Kaffee läuft aus dem Mundwinkel“',
  kurz: 'Pflegeheim, Frühstück: Herrn Albers läuft der Kaffee aus dem Mund, er spricht verwaschen, die rechte Hand ist schwach.',
  rahmen: 'Du bist im Frühdienst im Wohnbereich 2. Beim Frühstück im Zimmer fällt dir bei Herrn Albers etwas auf.',
  lernziele: [
    'Schlaganfallzeichen mit BE-FAST erkennen und als Notfall einordnen („Zeit ist Hirn“).',
    'Sofort den Notruf 112 absetzen und den Zeitpunkt „zuletzt gesund gesehen“ sichern.',
    'Andere Ursachen bedenken: Blutzucker messen. Bis zur Abklärung nichts essen, trinken oder schlucken lassen.',
    'Eine ungeeignete telefonische Anordnung (Tabletten bei Schluckstörung, Blutverdünner vor der Bildgebung) erkennen und hinterfragen.',
    'Strukturiert an den Rettungsdienst übergeben: Zeitpunkt, Blutverdünner, Verfügung, Ansprechpartner.',
  ],
  lehrplan: {
    ce: ['ce.06', 'ce.09'], abschnitt: ['ad12', 'ad3'],
    themen: ['thema.kl.neuro.schlaganfall', 'thema.beo.notfall', 'thema.beo.bewusstsein', 'thema.fa.langzeit', 'thema.pp.uebergabe'],
    kompetenzen: ['I.4.a', 'I.4.b', 'II.1.c', 'II.3.c', 'III.2.b'],
  },
  geeignet: { rollen: [2, 3], stufen: [1, 2, 3] },
  dauerMin: [12, 18],
  freigabe: {
    status: 'entwurf',
    pruefpunkte: [
      'Ablauf gegen S2e-Leitlinie Akuttherapie des ischämischen Schlaganfalls (DGN 2021/2022) und Rettungsdienst-Algorithmus prüfen: Notruf vor Hausarzt, Symptombeginn, BZ',
      'Blutdruck in der Akutphase nicht senken (erst über 220/120 ärztlich), Text der Hausärztin-Folge prüfen',
      'Remonstration: Apixaban/Ramipril per os vor Bildgebung und Schluckprüfung – fachlich korrekt formuliert?',
      'Befugnisse Heim (BZ, RR selbst ab 2. Drittel; O₂ nur nach Anordnung) prüfen',
      'Modell: Verschlechterung der Vigilanz bei verzögertem Notruf als didaktische Fallvorgabe (kein Hirnmodell) kennzeichnen',
    ],
  },
  quellen: [
    { id: 's2e-schlaganfall', titel: 'S2e-Leitlinie Akuttherapie des ischämischen Schlaganfalls (DGN, AWMF 030-046), 2022', fundstelle: 'Prähospitale Versorgung, Blutdruck, Blutzucker' },
    { id: 'befast', titel: 'BE-FAST (Balance, Eyes, Face, Arms, Speech, Time)', fundstelle: 'Aroor S. et al., Stroke 2017;48:479–481' },
    { id: 'dsg-sprechstunde', titel: 'Deutsche Schlaganfall-Gesellschaft: Stroke-Unit und Zeitfenster', fundstelle: 'Lyse bis 4,5 h, Thrombektomie bis 24 h nach Auswahl' },
    { id: 'fi-apixaban', titel: 'Fachinformation Apixaban', fundstelle: 'Letzte Einnahme entscheidet mit über die Lysetherapie' },
  ],

  person: {
    name: 'Herr Albers',
    alter: { jahre: 82 },
    geschlecht: 'm',
    biografie: ['seit einem Jahr im Pflegeheim nach dem Tod seiner Frau', 'früher Postbote', 'liest morgens die Zeitung beim Kaffee'],
    diagnosenBekannt: ['Vorhofflimmern', 'arterielle Hypertonie', 'Diabetes mellitus Typ 2 (diätetisch)', 'Gonarthrose beidseits'],
    medikamentePlan: ['Apixaban 5 mg 1-0-1', 'Ramipril 5 mg 1-0-0', 'Bisoprolol 2,5 mg 1-0-0'],
    allergien: ['keine bekannt'],
    hilfsmittel: ['Rollator', 'Lesebrille'],
    gewichtKg: 78,
  },
  medien: { raum: '26a_pflegeheim_zimmer_schlaganfall' },
  uebernahme: 'Herr Albers, 82, frühstückt wie jeden Morgen im Sessel am Fenster. Du hast ihn um 7:40 Uhr geweckt, da war er wie immer und hat über das Wetter geschimpft. Jetzt, um 8:15 Uhr, läuft ihm Kaffee aus dem rechten Mundwinkel. Er sagt etwas, aber du verstehst ihn nicht.',
  startUhrzeit: '08:15',

  start: {
    // Hoher Blutdruck (Schlaganfall, Stress), wach, Sprache gestört. Defizit über G5 (Treiber schlaganfall), Verschlechterung zusätzlich über Fallfehler (Notruf verzögert)
    grund: { gefaesstonus: 1.25, vigilanz: 0.9, orientierung: 0.7, angst: 0.55, schmerz: 1, blutzucker: 132, neuroDefizit: 0.45 },
    // G5: linke Hirnhälfte (rechte Körperseite, Aphasie), zuletzt gesund 7:40 Uhr = 35 min vor Fallstart (8:15 Uhr)
    treiber: [{ art: 'schlaganfall', seite: 'rechts', schwere: 0.45, beginnVorMin: 35 }],
    bild: { haltung: 'sitzt', haut: 'rosig', mimik: 'angst' },
  },

  massnahmen: [
    // Gespräch & Beobachten
    'ansprechen-orientierung', 'beruhigen-zusprechen', 'fast-test', 'bewusstsein-avpu', 'pupillen-pruefen', 'schlucken-pruefen', 'haut-beobachten',
    // Akut
    'notruf-112', 'hilfe-holen', 'nuechtern-lassen', 'oberkoerper-hoch', 'o2-geben', 'stabile-seitenlage',
    // Messen
    'rr-messen', 'pulsoxy-anlegen', 'bz-messen', 'temperatur-ohr', 'lkw-klaeren', 'kurve-lesen',
    // Versorgen
    'trinken-anbieten', 'morgenmedikation-geben', 'unterlagen-bereitlegen',
    // Melden
    'uebergabe-rettungsdienst', 'pflegebericht',
  ],
  massnahmenZusatz: [
    aus('sitzend-sichern', { id: 'nuechtern-lassen', name: 'Frühstück wegstellen: nichts essen, trinken oder schlucken lassen, bei ihm bleiben', setzt: ['nuechtern'],
      wirkung: [{ groesse: 'angst', delta: -0.1, beginnSek: 0, spitzeSek: 60, dauerSek: 'dauerhaft' }] }),
    aus('trinken-anbieten', { name: 'Kaffee nachschenken, weiter frühstücken lassen' }),
    aus('tabletten-wie-geplant-geben', { id: 'morgenmedikation-geben', name: 'Morgentabletten aus dem Dosett geben (Ramipril, Apixaban, Bisoprolol)' }),
    aus('kurve-lesen', { name: 'Medikamentenplan, Verfügung und Vollmacht in der Dokumentation lesen' }),
    aus('kurve-lesen', { id: 'lkw-klaeren', name: 'Zeitpunkt „zuletzt gesund gesehen“ klären (Nachtdienst-Bericht, eigene Beobachtung)', zeitbedarfSekunden: 45, setzt: ['lkw-geklaert'] }),
    aus('kurve-lesen', { id: 'unterlagen-bereitlegen', name: 'Für den Rettungsdienst bereitlegen: Medikamentenplan, Verfügung, Versichertenkarte, Kontakt der Tochter', setzt: ['unterlagen-bereit'] }),
    aus('uebergabe-rettungsdienst', { voraussetzung: RD_DA, setzt: ['rd-uebergeben'] }),
  ],

  akte: {
    aufnahmegrund: 'Heimeinzug vor einem Jahr nach dem Tod der Ehefrau; zunehmende Unsicherheit beim Gehen, Vorhofflimmern mit Antikoagulation.',
    anamnese: ['Vorhofflimmern seit 2019, Apixaban', 'Hypertonie, gut eingestellt', 'Diabetes Typ 2 ohne Medikamente', 'Gonarthrose, geht mit Rollator'],
    diagnosen: [
      { text: 'Vorhofflimmern, permanent', icd: 'I48.2', seit: '2019' },
      { text: 'Arterielle Hypertonie', icd: 'I10.90', seit: '2008' },
      { text: 'Diabetes mellitus Typ 2, diätetisch', icd: 'E11.90', seit: '2015' },
      { text: 'Gonarthrose beidseits', icd: 'M17.0', seit: '2012' },
    ],
    medikation: [
      { id: 'mp-apixaban', wirkstoff: 'Apixaban', staerke: '5 mg', form: 'Tbl.', schema: '1-0-1-0', massnahme: 'morgenmedikation-geben', zuletzt: 'gestern 18:00', hinweis: 'Blutverdünner. Letzte Einnahme bei Notfall immer weitergeben.' },
      { id: 'mp-ramipril', wirkstoff: 'Ramipril', staerke: '5 mg', form: 'Tbl.', schema: '1-0-0-0', zuletzt: 'gestern 08:00' },
      { id: 'mp-bisoprolol', wirkstoff: 'Bisoprolol', staerke: '2,5 mg', form: 'Tbl.', schema: '1-0-0-0', zuletzt: 'gestern 08:00' },
    ],
    vorwerte: [
      { zeit: 'vor 3 Tagen', vorH: 72, werte: { rrSys: 142, rrDia: 84, hf: 76, bz: 128 }, kuerzel: 'FD' },
      { zeit: 'gestern 08:00', vorH: 24, werte: { rrSys: 138, rrDia: 82, hf: 72 }, kuerzel: 'FD' },
    ],
    pflegebericht: [
      { zeit: 'gestern 14:00', wer: 'Frühdienst', text: 'Hat mit Herrn Weiß Karten gespielt, guter Laune. Isst und trinkt selbstständig.' },
      { zeit: 'heute 05:30', wer: 'Nachtdienst', text: 'Durchgeschlafen, beim Rundgang um 5:30 Uhr kurz wach, wollte zur Toilette, mit Rollator sicher, sprach normal.' },
    ],
    aerztlicheAnordnungen: [
      { zeit: 'vor 2 Monaten', wer: 'Dr. Sommer (Hausärztin)', text: 'Apixaban 5 mg 1-0-1 weiter. RR-Kontrolle 2× pro Woche.' },
    ],
    assessments: [
      { name: 'Barthel-Index', wert: '75 von 100', datum: 'vor 1 Monat' },
      { name: 'Sturzrisiko', wert: 'erhöht', datum: 'vor 1 Monat', hinweis: 'Gonarthrose, Rollator' },
    ],
    rechtliches: [
      'Patientenverfügung (2023): wünscht Krankenhausbehandlung und alle Maßnahmen bei guter Aussicht auf Besserung, keine Dauerbeatmung.',
      'Vorsorgevollmacht Gesundheit: Tochter Anke Albers, Auskunft an sie erlaubt.',
    ],
  },

  befunde: [
    { massnahme: 'ansprechen-orientierung', varianten: [{ text: '„Wa… was is… los?“ Die Sprache ist verwaschen, er findet Wörter nicht, versteht dich aber und nickt.' }] },
    { massnahme: 'fast-test', varianten: [{ text: 'Balance: sitzt sicher. Eyes: schaut nach links, bemerkt dich rechts erst spät. Face: rechter Mundwinkel hängt. Arms: rechter Arm sinkt im Halteversuch ab. Speech: verwaschen, Wortfindung gestört. Time: Zeitpunkt sichern und sofort 112.' }] },
    { massnahme: 'bewusstsein-avpu', varianten: [
      { wenn: { wert: 'vigilanz', vergleich: '<', grenze: 0.6 }, text: 'Öffnet die Augen nur auf Ansprache, schläft immer wieder ein. AVPU {avpu}.', zeigt: ['avpu'] },
      { text: 'Wach, schaut dich an. AVPU {avpu}.', zeigt: ['avpu'] },
    ] },
    { massnahme: 'pupillen-pruefen', varianten: [{ text: 'Pupillen gleich groß, reagieren auf Licht. Blick eher nach links gerichtet.' }] },
    { massnahme: 'schlucken-pruefen', varianten: [{ text: 'Er hustet schon beim ersten Teelöffel Wasser, die Stimme klingt danach gurgelnd. Schluckstörung: nichts mehr per os.' }] },
    { massnahme: 'haut-beobachten', varianten: [{ text: 'Rosig, warm, nicht schweißig.' }] },
    { massnahme: 'rr-messen', varianten: [{ text: 'RR {rrSys}/{rrDia} mmHg, Puls {hf}/min, unregelmäßig.', zeigt: ['rrSys', 'rrDia', 'hf'] }] },
    { massnahme: 'pulsoxy-anlegen', varianten: [{ text: 'SpO₂ {spo2} %, Puls {hf}/min.', zeigt: ['spo2', 'hf'] }] },
    { massnahme: 'bz-messen', varianten: [{ text: 'BZ {bz} mg/dl. Kein Unterzucker.', zeigt: ['bz'] }] },
    { massnahme: 'temperatur-ohr', varianten: [{ text: '{temp} °C.', zeigt: ['temp'] }] },
    { massnahme: 'lkw-klaeren', varianten: [{ text: 'Nachtdienst: um 5:30 Uhr normal gesprochen. Du selbst: um 7:40 Uhr beim Wecken unauffällig. Zuletzt sicher gesund gesehen: 7:40 Uhr, also vor gut einer halben Stunde. Beginn bemerkt: 8:15 Uhr.' }] },
    { massnahme: 'kurve-lesen', varianten: [{ text: 'Medikamentenplan: Apixaban 5 mg 1-0-1, zuletzt gestern 18 Uhr, Morgendosis noch im Dosett. Patientenverfügung: Krankenhausbehandlung gewünscht. Vorsorgevollmacht: Tochter Anke.' }] },
    { massnahme: 'unterlagen-bereitlegen', varianten: [{ text: 'Medikamentenplan (mit Apixaban, letzte Einnahme gestern 18 Uhr), Kopie der Verfügung und Vollmacht, Versichertenkarte und Telefonnummer der Tochter liegen in einer Mappe bereit.' }] },
    { massnahme: 'notruf-112', varianten: [{ text: 'Leitstelle: „Wo genau? Was ist passiert? Seit wann?“ Du nennst Adresse, Wohnbereich, Verdacht auf Schlaganfall, Beginn. „Der Rettungsdienst ist unterwegs. Bleiben Sie bei ihm, geben Sie ihm nichts zu essen oder zu trinken.“' }] },
    { massnahme: 'trinken-anbieten', varianten: [{ text: 'Du schenkst nach. Er trinkt, hustet heftig und verschluckt sich.' }] },
    { massnahme: 'morgenmedikation-geben', varianten: [{ text: 'Er versucht die Tabletten zu schlucken, hustet, eine Tablette fällt ihm aus dem Mund.' }] },
  ],

  gespraech: [
    { id: 'g-beruhigen', frage: 'In einfachen Sätzen erklären, dass Hilfe kommt, seine Hand halten', an: 'patient', kompetenzbereiche: ['II'],
      antwort: [{ text: 'Er drückt deine Hand mit der linken und nickt. Er wirkt etwas ruhiger.' }],
      wirkung: [{ groesse: 'angst', delta: -0.2, beginnSek: 0, spitzeSek: 60, dauerSek: 'dauerhaft' }] },
    { id: 'g-kollegin-dosett', frage: 'Kollegin bitten, die Morgentabletten von Herrn Albers zurückzustellen und den Rettungsdienst am Eingang abzuholen', an: 'kollegin', kompetenzbereiche: ['II', 'III'],
      antwort: [{ text: 'Melanie: „Mach ich. Ich stell das Dosett ins Dienstzimmer und warte unten an der Tür.“', setzt: ['kollegin-hilft'] }] },
    { id: 'g-tochter', frage: 'Tochter am Telefon informieren: Verdacht auf Schlaganfall, Rettungsdienst ist da oder unterwegs, Zielklinik folgt', an: 'angehoerige', kanal: 'telefon', kompetenzbereiche: ['II', 'IV'],
      nurWenn: { ab: 600 },
      schweigepflicht: { erlaubtWenn: PLAN_GELESEN, fehlerText: 'Du hast Auskunft gegeben, ohne zu wissen, ob die Tochter sie bekommen darf. Herr Albers kann sich gerade kaum äußern. In der Dokumentation steht die Vorsorgevollmacht: erst nachsehen.' },
      antwort: [{ text: 'Anke Albers: „Oh nein. Ich fahre sofort los. Welche Klinik? Bitte geben Sie ihm sein Handy mit, dann kann ich ihn erreichen.“', setzt: ['tochter-informiert'] }],
      fakten: ['Tochter fährt los', 'Zielklinik mit Stroke Unit', 'Vollmacht liegt vor'] },
  ],

  sbar: [
    { id: 's-schlaganfall', teil: 'S', text: 'Herr Albers, 82, Wohnbereich 2: Verdacht auf Schlaganfall, Mundwinkel und Arm rechts, Sprache verwaschen.', art: 'kern', bekanntWenn: { getan: 'fast-test' } },
    { id: 's-komisch', teil: 'S', text: 'Herr Albers ist heute komisch.', art: 'falsch' },
    { id: 'b-lkw', teil: 'B', text: 'Zuletzt gesund gesehen um 7:40 Uhr, Beginn bemerkt um 8:15 Uhr.', art: 'kern', bekanntWenn: { getan: 'lkw-klaeren' } },
    { id: 'b-apixaban', teil: 'B', text: 'Vorhofflimmern mit Apixaban, letzte Einnahme gestern 18 Uhr.', art: 'kern', bekanntWenn: PLAN_GELESEN },
    { id: 'b-verfuegung', teil: 'B', text: 'Patientenverfügung: Krankenhausbehandlung gewünscht. Tochter hat Vorsorgevollmacht.', art: 'hilfreich', bekanntWenn: PLAN_GELESEN },
    { id: 'b-zeitung', teil: 'B', text: 'Er liest morgens gern Zeitung.', art: 'ablenker' },
    { id: 'a-schlucken', teil: 'A', text: 'Hustet beim Schlucken, nüchtern gelassen.', art: 'hilfreich', bekanntWenn: { eine: [{ getan: 'schlucken-pruefen' }, { getan: 'nuechtern-lassen' }] } },
    { id: 'a-wach', teil: 'A', text: 'Wach, versteht, Sprache gestört.', art: 'kern', bekanntWenn: { getan: 'ansprechen-orientierung' } },
    { id: 'r-112', teil: 'R', text: 'Der Rettungsdienst ist alarmiert.', art: 'kern', bekanntWenn: NOTRUF },
    { id: 'r-abwarten', teil: 'R', text: 'Ich lege ihn erst einmal hin, vielleicht wird es besser.', art: 'falsch' },
  ],

  anordnungen: [
    { id: 'an-morgenmedikation', massnahme: 'morgenmedikation-geben', text: 'Morgentabletten aus dem Dosett geben (Ramipril, Apixaban, Bisoprolol).',
      fehlerhaft: {
        warum: 'Herr Albers hat eine Schluckstörung (Aspirationsgefahr). Apixaban vor der Bildgebung erschwert oder verhindert eine Lysetherapie. Den Blutdruck senkt man beim akuten Schlaganfall nicht ohne ärztliche Untersuchung.',
        korrektur: 'Gar nichts per os, auch keine Tabletten. Geben Sie dem Rettungsdienst den Plan mit der letzten Apixaban-Einnahme mit.',
      } },
  ],

  arzt: {
    name: 'Dr. Sommer (Hausärztin)',
    erreichbar: 'hausarzt-praxis',
    kanaele: ['telefon'],
    // genau → allgemein: erst mit Notruf, Zeitpunkt und BZ die (fehlerhafte) Anordnung; ohne Notruf: sofort 112; ohne BZ: Rückfrage
    regeln: [
      { ...HAUSAERZTIN, wenn: { alle: [{ gemeldet: ['s-schlaganfall', 'b-lkw', 'wert:bz'] }, NOTRUF] } },
      { id: 'r-sofort-112', wenn: { alle: [{ gemeldet: ['s-schlaganfall'] }, { nicht: NOTRUF }] },
        antwort: '„Warum rufen Sie mich an? Das ist ein Notfall. Legen Sie auf und rufen Sie sofort die 112. Ich bin in der Sprechstunde, ich kann nicht schneller da sein als der Rettungsdienst.“',
        setzt: ['arzt-112'] },
      { id: 'r-bz-frage', wenn: { gemeldet: ['s-schlaganfall'] },
        antwort: '„Gut, dass Sie anrufen.“',
        rueckfrage: { text: '„Und wie hoch ist der Zucker? Ein Unterzucker kann genauso aussehen.“', erwartet: ['b-lkw', 'wert:bz'], auftrag: 'af-bz' } },
      { wenn: { eine: [{ gemeldet: ['s-komisch'] }, { gemeldet: ['r-abwarten'] }] },
        antwort: '„Was heißt komisch? Schauen Sie sich Gesicht, Arme und Sprache an und melden Sie sich noch einmal.“' },
    ],
    auftraege: [
      { id: 'af-bz', text: 'Blutzucker messen und der Hausärztin melden', erledigt: BZ_BEKANNT, meldung: ['wert:bz', 'b-lkw'], meldenBinnenSek: 600, folge: [HAUSAERZTIN] },
      { id: 'af-rr', text: 'Blutdruck vor der Abholung noch einmal messen und melden', erledigt: { getan: 'rr-messen' }, meldung: ['wert:rrSys'], meldenBinnenSek: 900,
        folge: [{ wenn: { ab: 0 }, antwort: '„Danke. Nicht senken, das macht die Klinik. Melden Sie sich, wenn Sie wissen, wohin er kommt.“', setzt: ['rr-gemeldet'] }] },
    ],
  },
  team: { kollegin: 'Melanie (Pflegefachfrau, Frühdienst)', weitere: { rettungsdienst: 'Notfallsanitäterin Frau Yıldız', angehoerige: 'Tochter Anke Albers (Vorsorgevollmacht)' } },

  ereignisse: [
    { id: 'e-kollegin-rat', art: 'team', wann: { ab: 90 },
      text: 'Melanie schaut ins Zimmer: „Ist was? Ruf doch erst mal die Hausärztin an, vielleicht ist es nur der Kreislauf. Oder leg ihn kurz hin.“',
      verhindertDurch: NOTRUF,
      entscheidung: [
        { id: 'w-112', text: '„Nein, das sieht nach Schlaganfall aus. Ich rufe jetzt 112, kannst du bei ihm bleiben?“', wertung: 'gut', setzt: ['112-entschieden'],
          warum: 'Bei Schlaganfallzeichen ist der Notruf 112 der erste Anruf. Die Hausärztin wird danach informiert.' },
        { id: 'w-hausaerztin', text: 'Erst die Hausärztin anrufen', wertung: 'falsch',
          warum: 'Die Hausarztpraxis verliert Zeit. Lyse und Thrombektomie sind nur in einem Zeitfenster möglich.' },
        { id: 'w-hinlegen', text: 'Ihn ins Bett bringen und in einer halben Stunde nachsehen', wertung: 'gefaehrlich', setzt: ['abgewartet'],
          warum: 'Auch schwankende oder rasch bessere Zeichen sind ein Notfall (mögliche TIA). Jede Minute ohne Behandlung kostet Nervenzellen.' },
      ] },
    { id: 'e-tochter-ruft', art: 'telefon', wann: { ab: 600 },
      text: 'Das Telefon im Dienstzimmer klingelt: Die Tochter, Frau Albers, will wissen, ob ihr Vater heute zum Arzttermin um elf fahren kann.' },
    { id: 'e-rd-da', art: 'team', wann: RD_DA,
      text: 'Der Rettungsdienst ist da. Notfallsanitäterin Frau Yıldız: „Wann genau war er zuletzt unauffällig? Nimmt er Blutverdünner? Gibt es eine Verfügung?“' },
  ],

  pa: {
    name: 'Praxisanleiterin Karin Lutz (Wohnbereichsleitung)',
    hilfen: [
      { wenn: { nicht: { getan: 'fast-test' } }, impuls: 'Mundwinkel, Arm, Sprache: Wie prüfst du das schnell und vollständig?', tipp: 'Mit BE-FAST: Balance, Augen, Gesicht, Arme, Sprache, Zeit.' },
      { wenn: { nicht: NOTRUF }, impuls: 'Wen rufst du bei Schlaganfallzeichen als Erstes an?', tipp: 'Sofort die 112. Die Hausärztin informierst du danach.' },
      { wenn: { nicht: { getan: 'lkw-klaeren' } }, impuls: 'Was will die Klinik als Erstes wissen?', tipp: 'Wann er zuletzt sicher gesund war. Das entscheidet über Lyse und Thrombektomie.' },
      { wenn: { nicht: BZ_BEKANNT }, impuls: 'Was kann genauso aussehen wie ein Schlaganfall und lässt sich hier sofort prüfen?', tipp: 'Ein Unterzucker. Blutzucker messen.' },
      { impuls: 'Was braucht der Rettungsdienst von dir in der Hand?', tipp: 'Medikamentenplan mit letzter Apixaban-Einnahme, Verfügung, Versichertenkarte und die Nummer der Tochter.' },
    ],
  },

  bewertung: {
    pflicht: [
      { id: 'p-befast', text: 'Schlaganfallzeichen mit BE-FAST geprüft', gewicht: 2, kompetenzbereiche: ['I'],
        erfuellt: { getan: 'fast-test', bis: 240 }, warum: 'BE-FAST erkennt die meisten Schlaganfälle schnell und strukturiert.' },
      { id: 'p-notruf', text: 'Notruf 112 innerhalb von 6 Minuten', gewicht: 3, kompetenzbereiche: ['II', 'III'],
        erfuellt: { getan: 'notruf-112', bis: 360 }, warum: 'Zeit ist Hirn: Pro Minute ohne Durchblutung gehen etwa zwei Millionen Nervenzellen zugrunde.' },
      { id: 'p-lkw', text: 'Zeitpunkt „zuletzt gesund gesehen“ gesichert', gewicht: 3, kompetenzbereiche: ['I', 'IV'],
        erfuellt: { getan: 'lkw-klaeren' }, warum: 'Der Zeitpunkt entscheidet über Lyse (bis 4,5 h) und Thrombektomie. Unbekannt heißt oft: keine Lyse.' },
      { id: 'p-bz', text: 'Blutzucker gemessen', gewicht: 2, kompetenzbereiche: ['I', 'V'],
        erfuellt: BZ_BEKANNT, warum: 'Unterzucker ist die häufigste behandelbare Ursache, die einen Schlaganfall nachahmt.' },
      { id: 'p-nuechtern', text: 'Nichts per os gegeben (Aspirationsschutz)', gewicht: 3, kompetenzbereiche: ['I', 'III'],
        erfuellt: { alle: [{ getan: 'nuechtern-lassen' }, { nicht: GESCHLUCKT }] }, warum: 'Schluckstörungen sind beim Schlaganfall häufig. Aspiration führt zur Lungenentzündung.' },
      { id: 'p-remonstration', text: 'Telefonische Anordnung „Morgentabletten geben“ hinterfragt', gewicht: 3, kompetenzbereiche: ['III', 'IV'],
        erfuellt: { flag: 'remonstriert:an-morgenmedikation' }, warum: 'Tabletten bei Schluckstörung und Apixaban vor der Bildgebung schaden. Durchführungsverantwortung heißt: nachfragen.' },
      { id: 'p-unterlagen', text: 'Unterlagen für den Rettungsdienst bereitgelegt', gewicht: 1, kompetenzbereiche: ['II', 'IV'],
        erfuellt: { getan: 'unterlagen-bereitlegen' }, warum: 'Medikamentenplan und Verfügung sparen in der Klinik wertvolle Minuten.' },
      { id: 'p-uebergabe', text: 'Übergabe an den Rettungsdienst mit Zeitpunkt und Blutverdünner', gewicht: 2, kompetenzbereiche: ['II', 'III'],
        erfuellt: { alle: [{ getan: 'uebergabe-rettungsdienst' }, { gesagt: 'b-lkw', an: 'rettungsdienst' }, { gesagt: 'b-apixaban', an: 'rettungsdienst' }] },
        warum: 'Ohne Zeitpunkt und letzte Apixaban-Einnahme kann die Klinik nicht sicher über eine Lyse entscheiden.' },
      { id: 'p-hausaerztin', text: 'Hausärztin informiert und Blutdruck-Rückauftrag gemeldet', gewicht: 1, kompetenzbereiche: ['II'],
        erfuellt: { auftrag: 'af-rr', status: 'gemeldet' }, warum: 'Die Hausärztin bleibt verantwortlich für die Weiterbehandlung im Heim.' },
      { id: 'p-tochter', text: 'Tochter (Vorsorgevollmacht) informiert', gewicht: 1, kompetenzbereiche: ['II', 'IV'],
        erfuellt: { flag: 'tochter-informiert' }, warum: 'Die Bevollmächtigte entscheidet mit, wenn er sich nicht äußern kann.' },
      { id: 'p-doku', text: 'BE-FAST, Zeitpunkt und Blutzucker dokumentiert', gewicht: 1, kompetenzbereiche: ['I', 'IV'],
        erfuellt: { alle: [{ dokumentiert: 'befund:fast-test' }, { dokumentiert: 'befund:lkw-klaeren' }, { dokumentiert: 'wert:bz' }] }, warum: 'Die Dokumentation sichert die Zeitpunkte für Klinik, Hausärztin und Angehörige.' },
    ],
    fehler: [
      { id: 'f-aspiration', text: 'Bei Schlaganfallverdacht trinken oder schlucken lassen', wenn: GESCHLUCKT, schwere: 'schwer', kompetenzbereiche: ['I', 'III'],
        folge: { text: 'Herr Albers hustet, die Atmung wird schnell und brodelnd.', treiber: [{ art: 'pneumonie', staerke: 0.25 }] },
        warum: 'Beim Schlaganfall ist das Schlucken oft gestört. Bis zur Schluckprüfung nichts per os.' },
      { id: 'f-notruf-spaet', text: 'Notruf nicht in den ersten 10 Minuten', wenn: { nichtGetan: 'notruf-112', bis: 600 }, schwere: 'schwer', kompetenzbereiche: ['II', 'III'],
        folge: { text: 'Herr Albers spricht nicht mehr, der rechte Arm ist schlaff, er wird schläfrig.',
          wirkung: [{ groesse: 'vigilanz', delta: -0.4, beginnSek: 0, spitzeSek: 300, dauerSek: 'dauerhaft' }] },
        warum: 'Der Schlaganfall schreitet fort. Die Chance auf eine Behandlung, die Nervenzellen rettet, wird kleiner (didaktische Fallvorgabe).' },
      { id: 'f-hausaerztin-zuerst', text: 'Hausärztin vor dem Notruf angerufen', wenn: { flag: 'arzt-112' }, schwere: 'leicht', kompetenzbereiche: ['III'],
        warum: 'Bei Schlaganfallverdacht gilt: erst 112, dann alle anderen.' },
      { id: 'f-abgewartet', text: 'Bei Schlaganfallzeichen abgewartet', wenn: { flag: 'abgewartet' }, schwere: 'mittel', kompetenzbereiche: ['I', 'III'],
        warum: 'Auch wenn die Zeichen schwanken: sofort handeln. Eine TIA ist ein Warnzeichen für einen großen Schlaganfall.' },
      { id: 'f-seitenlage', text: 'Wachen Bewohner in die Seitenlage gebracht', wenn: { alle: [{ getan: 'stabile-seitenlage' }, { wert: 'vigilanz', vergleich: '>', grenze: 0.6 }] }, schwere: 'leicht', kompetenzbereiche: ['I'],
        warum: 'Wach und mit freien Atemwegen: Oberkörper 30° hoch. Die Seitenlage ist für Bewusstlose mit normaler Atmung.' },
    ],
    ende: [
      { wenn: { getan: 'uebergabe-rettungsdienst' }, text: 'Herr Albers fährt mit Zeitpunkt, Medikamentenplan und Verfügung in die Klinik mit Stroke Unit.', ausgang: 'verlegt' },
    ],
  },

  pflegebedarf: {
    probleme: [
      { id: 'pb-zeit', text: 'Akute Durchblutungsstörung des Gehirns, Behandlung nur im Zeitfenster möglich', richtig: true, prioritaet: 1, warum: 'Bestimmt alles: Notruf, Zeitpunkt, schnelle Übergabe.' },
      { id: 'pb-aspiration', text: 'Aspirationsgefahr durch Schluckstörung', richtig: true, prioritaet: 1, warum: 'Nichts per os, Oberkörper hoch, bei Bewusstseinsminderung Atemwege sichern.' },
      { id: 'pb-kommunikation', text: 'Sprachstörung mit Angst', richtig: true, prioritaet: 2, warum: 'Einfache Sätze, Ja/Nein-Fragen, Nähe geben.' },
      { id: 'pb-blutung', text: 'Blutungsrisiko unter Apixaban', richtig: true, prioritaet: 2, warum: 'Für die Klinik entscheidend, bei der Übergabe nennen.' },
      { id: 'pb-sturz', text: 'Sturzgefahr beim Gang zur Toilette', richtig: false, warum: 'Er bleibt jetzt sitzen und wird abgeholt. Später (Reha, CE07) wichtig.' },
    ],
    ziele: [
      { id: 'z-klinik', text: 'Innerhalb des Zeitfensters in einer Klinik mit Stroke Unit, Zeitpunkt und Blutverdünner bekannt', passtZu: ['pb-zeit', 'pb-blutung'], richtig: true },
      { id: 'z-keine-aspiration', text: 'Keine Aspiration bis zur Schluckprüfung', passtZu: ['pb-aspiration'], richtig: true },
      { id: 'z-sicher', text: 'Herr Albers fühlt sich begleitet und versteht, was passiert', passtZu: ['pb-kommunikation'], richtig: true },
      { id: 'z-fruehstueck', text: 'Herr Albers isst sein Frühstück zu Ende', passtZu: ['pb-aspiration'], richtig: false },
    ],
  },
  leitfaden: [
    { titel: 'BE-FAST', quellen: ['befast'],
      text: 'Balance (plötzlicher Schwindel, Gangstörung), Eyes (Sehstörung, Blickwendung), Face (hängender Mundwinkel), Arms (Arm sinkt ab), Speech (verwaschen, Wortfindung), Time (Zeitpunkt sichern, sofort 112). Ein auffälliges Zeichen reicht.' },
    { titel: 'Zeit ist Hirn', quellen: ['s2e-schlaganfall', 'dsg-sprechstunde'],
      text: 'Lyse ist bis 4,5 Stunden nach Symptombeginn möglich, eine Thrombektomie bei großem Gefäßverschluss auch später. Gerechnet wird ab „zuletzt gesund gesehen“, nicht ab dem Bemerken. Darum den Zeitpunkt aus Dokumentation und Kolleginnen sichern.' },
    { titel: 'Was die Pflege bis zum Rettungsdienst tut', quellen: ['s2e-schlaganfall'],
      text: 'Notruf, bei der Person bleiben, Oberkörper 30° hoch, nichts essen, trinken oder schlucken lassen, Blutzucker messen, Vitalzeichen, Unterlagen bereitlegen. Blutdruck nicht selbst senken: Erhöhter Druck hält die Durchblutung des gefährdeten Gewebes aufrecht.' },
    { titel: 'Blutverdünner und Anordnungen',
      text: 'Die letzte Einnahme eines Blutverdünners (hier Apixaban) entscheidet mit, ob eine Lyse möglich ist. Eine telefonische Anordnung, Tabletten zu geben, passt nicht zu Schluckstörung und Notfall: nachfragen und remonstrieren.' },
    { titel: 'Übergabe an den Rettungsdienst',
      text: 'Kurz und vollständig: Wer, was beobachtet, Zeitpunkt zuletzt gesund, Vitalwerte und Blutzucker, Blutverdünner mit Uhrzeit, Verfügung und Vollmacht, Ansprechpartner. Unterlagen mitgeben.' },
  ],

  pruefwege: {
    muster: [
      { art: 'massnahme', id: 'ansprechen-orientierung' },
      { art: 'massnahme', id: 'fast-test' },
      { art: 'massnahme', id: 'nuechtern-lassen' },
      { art: 'massnahme', id: 'notruf-112' },
      { art: 'massnahme', id: 'lkw-klaeren' },
      { art: 'pflegetasche', geraet: 'bz-geraet' },
      { art: 'massnahme', id: 'bz-messen' },
      { art: 'pflegetasche', geraet: 'rr-geraet' },
      { art: 'massnahme', id: 'rr-messen' },
      { art: 'massnahme', id: 'oberkoerper-hoch' },
      { art: 'frage', id: 'g-kollegin-dosett' },
      { art: 'massnahme', id: 'kurve-lesen' },
      { art: 'anruf', an: 'aerztin', sbar: ['s-schlaganfall', 'b-lkw', 'b-apixaban', 'a-wach', 'a-schlucken', 'r-112'] },
      { art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: ['wert:bz'] },
      { art: 'remonstrieren', anordnung: 'an-morgenmedikation', grund: 'Schluckstörung, Apixaban vor der Bildgebung' },
      { art: 'auflegen', an: 'aerztin' },
      { art: 'massnahme', id: 'unterlagen-bereitlegen' },
      { art: 'frage', id: 'g-beruhigen' },
      { art: 'frage', id: 'g-tochter' },
      { art: 'massnahme', id: 'rr-messen' },
      { art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: ['wert:rrSys'] },
      { art: 'auflegen', an: 'aerztin' },
      { art: 'dokumentieren', bausteine: ['befund:fast-test', 'befund:lkw-klaeren', 'wert:bz', 'wert:rrSys', 'a-wach'] },
      { art: 'warten', sek: 60 },
      { art: 'nachricht', an: 'rettungsdienst', kanal: 'vor-ort', bausteine: ['s-schlaganfall', 'b-lkw', 'b-apixaban', 'b-verfuegung', 'a-wach', 'a-schlucken', 'wert:bz', 'wert:rrSys'] },
      { art: 'massnahme', id: 'uebergabe-rettungsdienst' },
      { art: 'abschluss', probleme: ['pb-zeit', 'pb-aspiration', 'pb-kommunikation', 'pb-blutung'], ziele: ['z-klinik', 'z-keine-aspiration', 'z-sicher'],
        sbar: ['s-schlaganfall', 'b-lkw', 'b-apixaban', 'a-wach', 'a-schlucken', 'r-112'] },
    ],
    unterlassung: { bisSek: 900, erwartet: { wert: 'vigilanz', vergleich: '<', grenze: 0.65 } },
    // 2. Drittel gibt O₂ ohne Anordnung (SpO₂ normal): Stufe 2 PA warnt, Stufe 3 Grenzüberschreitung
    grenze: {
      rolle: 2,
      events: [
        { art: 'massnahme', id: 'fast-test' },
        { art: 'massnahme', id: 'notruf-112' },
        { art: 'massnahme', id: 'o2-geben' },
      ],
      erwartet: 'pa-eingriff',
    },
  },
};
