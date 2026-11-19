// Pilotfall Spur A · Pädiatrie: Fieberkrampf beim Kleinkind mit Elterngespräch
// Entwurf, fachlich UNGEPRÜFT. Inhalte fiktiv/didaktisch. Muster: amb-sturz-exsikkose.ts (Paket P6).
// Runde 2 (P14b): Rückfrage der Ärztin nach SpO₂/BZ, Rückauftrag Kontrolle per Messenger, Großmutter mit Schweigepflicht,
// Kollege Tim, vollständige Akte, Dokumentationspflicht.

import { KATALOG } from '../katalog';
import type { Bedingung, FallV2, MassnahmeDefinition } from '../typen';

const aus = (id: string, mehr: Partial<MassnahmeDefinition>): MassnahmeDefinition => ({ ...KATALOG[id]!, ...mehr });

const KRAMPFT: Bedingung = { wert: 'krampf', vergleich: '>', grenze: 0 };
/** krampf < 0: nach dem Anfall (postiktal), nähert sich 0, erreicht es im Modell nie */
const NACH_ANFALL: Bedingung = { wert: 'krampf', vergleich: '<', grenze: 0 };
const ANFALL_ERLEBT: Bedingung = { eine: [KRAMPFT, NACH_ANFALL] };
/** Die Großmutter ruft an (Ereignis e-oma); erst dann gibt es das Gespräch mit ihr. */
const OMA_RUFT: Bedingung = { alle: [NACH_ANFALL, { ab: 900 }] };

const KOMMT = '„Danke, das klingt nach einem Fieberkrampf. Ich bin noch in der Notaufnahme und in etwa einer Viertelstunde bei Ihnen. Seitenlage lassen, Sättigung beobachten, bei unter 94 Prozent Sauerstoff vorhalten. Wenn er wieder krampft, sofort Notruf und Uhr. Gegen das Fieber ein Paracetamol-Zäpfchen 500 mg. In zehn Minuten messen Sie bitte noch einmal Temperatur und Bewusstsein und schreiben mir, wie es ihm geht.“';
/** Hauptantwort der Ärztin (Telefon oder nach der Rückfrage); id: antwortet nur einmal im Fall */
const R_KOMMT = { id: 'r-kommt', antwort: KOMMT, anordnungen: ['an-o2', 'an-para-500'], kommtNachSek: 900, setzt: ['arzt-kommt'], auftraege: ['af-kontrolle'] };

export const PAED_FIEBERKRAMPF: FallV2 = {
  schema: 2,
  id: 'paed-fieberkrampf',
  version: '0.2.0',
  spur: 'A',
  setting: 'paediatrie',
  altersgruppe: 'kleinkind',
  titel: '„Er ist plötzlich ganz steif geworden“',
  kurz: 'Kinderstation: 18 Monate alter Junge mit hohem Fieber krampft vor den Augen der Mutter.',
  rahmen: 'Du bist im Spätdienst auf der Kinderstation und übernimmst mit deiner Praxisanleitung das Zimmer von Leon und seiner Mutter.',
  lernziele: [
    'Im Krampfanfall richtig handeln: Zeit merken, Hilfe rufen, schützen, nicht festhalten, nichts in den Mund.',
    'Nach dem Anfall Atemwege sichern (Seitenlage), Sättigung, Bewusstsein und Blutzucker überwachen.',
    'Die Ärztin mit Krampfdauer und Zustand nach dem Anfall informieren.',
    'Eine Dosis für ein Kind nach Gewicht nachrechnen und eine falsche Anordnung hinterfragen.',
    'Eltern in der Krise beruhigen, einbeziehen und verständlich informieren.',
  ],
  lehrplan: { ce: ['ce.10', 'ce.06'], abschnitt: ['ad12', 'ad3'], themen: ['thema.kl.neuro.epilepsie', 'thema.kl.paediatrie', 'thema.re.schweigepflicht'] },
  geeignet: { rollen: [1, 2, 3], stufen: [1, 2, 3] },
  dauerMin: [12, 18],
  freigabe: {
    status: 'entwurf',
    pruefpunkte: [
      'Ablauf im Anfall und danach gegen aktuelle pädiatrische Empfehlungen prüfen (ab 3–5 Minuten Notfallmedikament nach ärztlicher Anordnung, Seitenlage, SpO₂, BZ)',
      'Aussage „Fiebersenkung verhindert Fieberkrämpfe nicht“ gegen NICE NG143 und Fachliteratur prüfen',
      'Paracetamol-Dosis 15 mg/kg (11 kg → 125-mg-Zäpfchen), Höchstdosis pro Tag und Remonstrationspunkt 500 mg prüfen',
      'Befugnis Zäpfchen geben (1./2. Drittel mit Anleitung) und O₂-Gabe beim Kind gegen BW-Lehrplan (CE 10) belegen',
      'Kinder-Physiologie: Krampf 3 Minuten, danach Schläfrigkeit über 10–20 Minuten plausibel?',
      'Runde 2: Auskunft an die Großmutter nur mit Einverständnis der sorgeberechtigten Mutter; Rückauftrag Kontrolle nach 10 Minuten per Klinik-Messenger plausibel?',
      'Kein Monitor ab Beginn: Aufnahme zur Beobachtung wegen Trinkschwäche, Pulsoxymeter erst nach dem Anfall (Pflichthandlung). Mit Stationsstandard abgleichen.',
      'Akte: Amoxicillin-Saft 3× täglich nach Gewicht (ca. 50 mg/kg/Tag) und Laborwerte fiktiv, fachlich prüfen',
    ],
  },
  quellen: [
    { id: 'nice-fieber', titel: 'NICE NG143: Fever in under 5s – assessment and initial management (2019, aktualisiert 2021)' },
    { id: 'aap-fieberkrampf', titel: 'American Academy of Pediatrics: Febrile Seizures – Clinical Practice Guideline (2008) und Neurodiagnostic Evaluation (2011)' },
    { id: 'erc-kinder', titel: 'ERC Leitlinien Reanimation 2025: Lebensrettende Maßnahmen bei Kindern (Paediatric Life Support)' },
    { id: 'gnp-fieberkrampf', titel: 'Gesellschaft für Neuropädiatrie: Elterninformation Fieberkrampf', fundstelle: 'aktuelle Fassung prüfen' },
    { id: 'fi-paracetamol', titel: 'Fachinformation Paracetamol-Zäpfchen für Kinder (Dosierung nach Körpergewicht)' },
  ],

  person: {
    name: 'Leon',
    alter: { monate: 18 },
    geschlecht: 'm',
    biografie: ['Mutter Frau Berger ist bei ihm, Vater auf dem Weg', 'besucht seit zwei Monaten die Krippe', 'Kuscheltier: ein blauer Hase'],
    diagnosenBekannt: ['akute Mittelohrentzündung rechts', 'Aufnahme heute Mittag zur Beobachtung, weil er wenig trinkt'],
    medikamentePlan: ['Bedarfsmedikation: noch nichts angesetzt'],
    allergien: ['keine bekannt'],
    gewichtKg: 11,
  },
  medien: {
    raum: '20a_paediatrie_kleinkind_ohne_monitor',
    raumVarianten: [
      { wenn: { alle: [ANFALL_ERLEBT, { getan: 'pulsoxy-anlegen' }] }, raum: '20f_paediatrie_kleinkind_fieberkrampf_sensor_an' },
      { wenn: ANFALL_ERLEBT, raum: '20f_paediatrie_kleinkind_fieberkrampf_ohne_monitor' },
      { wenn: { getan: 'pulsoxy-anlegen' }, raum: '20m_paediatrie_kleinkind_monitor_verbunden' },
    ],
  },
  uebernahme: 'Leon, 18 Monate, 11 kg, kam heute Mittag mit Mittelohrentzündung rechts und hohem Fieber, er trinkt schlecht. Die Mutter ist bei ihm. Bedarfsmedikation ist noch nicht angesetzt, die Ärztin wollte nach der Aufnahme schauen.',
  startUhrzeit: '15:40',

  start: {
    // Fieber steigt; ab 39,4 °C kommt im Modell ein Anfall (fieberkrampf_kind, ein Anfall je Fall, etwa 3 Minuten).
    // Fiebersenkung wirkt erst nach 20 Minuten und verhindert den Anfall nicht (wie in der Wirklichkeit).
    // Modell: Start HF um 163, AF 37, SpO₂ 98 %; Anfall nach etwa 6–7 Minuten (Test in pilot-a.test.ts).
    grund: { temperatur: 39.3, hydratation: 0.92, volumen: 0.95, angst: 0.15, schmerz: 2, unruhe: 0.15 },
    treiber: [{ art: 'fieberkrampf_kind', temperaturSchwelle: 39.4 }],
    bild: { haltung: 'sitzt', haut: 'gerötet-heiss', mimik: 'schmerz' },
    sichtbar: [],
  },

  massnahmen: [
    // Gespräch
    'vorstellen-einverstaendnis', 'eltern-einbeziehen', 'beruhigen-zusprechen',
    // Beobachten
    'ersteindruck-abcde', 'atmung-beobachten', 'haut-beobachten', 'rekap-pruefen', 'bewusstsein-avpu', 'pupillen-pruefen', 'schmerz-kinderskala',
    // Akut
    'krampf-schuetzen', 'kind-festhalten', 'beisskeil', 'hilfe-holen', 'stabile-seitenlage', 'atemwege-freimachen', 'absaugen-oral', 'o2-geben', 'rea-team-alarmieren',
    // Messen
    'temperatur-ohr', 'pulsoxy-anlegen', 'puls-zaehlen', 'af-zaehlen', 'bz-messen', 'kurve-lesen',
    // Versorgen
    'paracetamol-supp', 'wadenwickel', 'trinken-anbieten',
    // Melden
    'pflegefachperson-informieren', 'pflegebericht',
  ],
  massnahmenZusatz: [
    {
      id: 'kind-festhalten', name: 'Arme und Beine festhalten, damit der Krampf aufhört', reiter: 'akut', spur: 'A', zeitbedarfSekunden: 30,
      befugnis: { 1: 'selbst', 2: 'selbst', 3: 'selbst', pflegefachperson: 'selbst' }, kompetenzbereiche: ['I', 'V'],
    },
    {
      id: 'beisskeil', name: 'Etwas zwischen die Zähne schieben (gegen Zungenbiss)', reiter: 'akut', spur: 'A', zeitbedarfSekunden: 20,
      befugnis: { 1: 'selbst', 2: 'selbst', 3: 'selbst', pflegefachperson: 'selbst' }, kompetenzbereiche: ['I', 'V'],
    },
    aus('o2-geben', { name: 'Sauerstoff über Kindermaske vorhalten (nach Anordnung)', wirkung: [{ groesse: 'sauerstoff', delta: 4, beginnSek: 0, spitzeSek: 30, dauerSek: 'dauerhaft' }] }),
    aus('bedarfsmedikation-oral', {
      id: 'paracetamol-supp', name: 'Paracetamol-Zäpfchen geben (nach Anordnung, Dosis nach Gewicht prüfen)',
      wirkung: [{ groesse: 'temperatur', delta: -0.8, beginnSek: 1200, spitzeSek: 3000, dauerSek: 14400 }, { groesse: 'schmerz', delta: -2, beginnSek: 900, spitzeSek: 2400, dauerSek: 14400 }],
    }),
  ],

  akte: {
    aufnahmegrund: 'Stationäre Aufnahme heute 12:00 über die Kinderarztpraxis: akute Mittelohrentzündung rechts, Fieber seit dem Morgen, trinkt seit gestern Abend schlecht. Zur Beobachtung und Flüssigkeitsgabe nach Bedarf.',
    anamnese: [
      'Termingeboren, bisher gesund. Vorsorgeuntersuchungen bis U6 unauffällig, geimpft nach STIKO.',
      'Besucht seit zwei Monaten die Krippe, seitdem häufig Infekte.',
      'Mutter hat heute um 07:30 zu Hause Paracetamol-Saft gegeben (Menge unklar, „ein Messlöffel“).',
      'Keine Krampfanfälle bekannt. Familienanamnese: Onkel mütterlicherseits als Kind Fieberkrämpfe (laut Mutter, unsicher).',
      'Trinkt sonst gut aus der eigenen Flasche (Tee, Wasser), heute laut Mutter etwa 150 ml.',
    ],
    diagnosen: [
      { text: 'Akute Otitis media rechts', icd: 'H66.9', seit: 'heute' },
      { text: 'Fieber', icd: 'R50.9', seit: 'heute' },
      { text: 'Verminderte Trinkmenge', icd: 'R63.1', seit: 'gestern' },
    ],
    medikation: [
      { id: 'mp-amoxicillin', wirkstoff: 'Amoxicillin', staerke: '250 mg/5 ml', form: 'Saft', schema: '1-1-1-0', zuletzt: '12:30',
        hinweis: 'Je 3,5 ml (ca. 175 mg) nach Gewicht, nächste Gabe 18:00. Saft im Kühlschrank.' },
      { id: 'mp-nasentropfen', wirkstoff: 'Xylometazolin 0,025 %', staerke: '1 Hub', form: 'Nasenspray (Kleinkind)', schema: '1-0-1-0', zuletzt: '12:30',
        hinweis: 'Höchstens 5 Tage.' },
    ],
    vorwerte: [
      { zeit: 'Aufnahme 12:00', vorH: 3.7, werte: { temp: 38.9, hf: 152, af: 34, spo2: 98, gewicht: 11 }, kuerzel: 'TS' },
      { zeit: '14:00', vorH: 1.7, werte: { temp: 39.1, hf: 158, af: 36 }, kuerzel: 'TS' },
    ],
    pflegebericht: [
      { zeit: '12:15', wer: 'TS', text: 'Aufnahme mit Mutter. Leon quengelig, greift ans rechte Ohr, Schleimhäute feucht, Windel heute zweimal nass. Gewicht 11,0 kg. Mutter bleibt als Begleitperson, Bett im Zimmer gerichtet.' },
      { zeit: '14:00', wer: 'TS', text: 'Hat 60 ml Tee getrunken, Rest verweigert. Schläft unruhig auf dem Arm der Mutter. Temp. 39,1 °C. Ärztin informiert, sie kommt nach den Aufnahmen. Trinkprotokoll begonnen.' },
    ],
    aerztlicheAnordnungen: [
      { zeit: '12:30', wer: 'Dr. Nowak', text: 'Amoxicillin-Saft 250 mg/5 ml, 3 × 3,5 ml. Nasenspray für Kleinkinder 2 × täglich.' },
      { zeit: '12:30', wer: 'Dr. Nowak', text: 'Vitalzeichen und Temperatur 4-stündlich, Trinkprotokoll. Bedarfsmedikation gegen Fieber nach Untersuchung (noch offen).' },
    ],
    assessments: [
      { name: 'KUSS-Skala (Schmerz Kleinkind)', wert: '4 von 10', datum: 'heute 12:15', hinweis: 'Weint, greift ans Ohr.' },
      { name: 'Trinkprotokoll', wert: '60 ml seit Aufnahme', datum: 'heute 14:00', hinweis: 'Bedarf bei 11 kg etwa 1100 ml am Tag.' },
      { name: 'Paediatric Early Warning Score (PEWS)', wert: '2 Punkte', datum: 'heute 14:00', hinweis: 'Herzfrequenz und Temperatur erhöht.' },
    ],
    labor: [
      { name: 'CRP', wert: '18', einheit: 'mg/l', norm: 'unter 5', datum: 'heute 12:20', auffaellig: true },
      { name: 'Leukozyten', wert: '13,8', einheit: '/nl', norm: '6–17,5 (Kleinkind)', datum: 'heute 12:20' },
      { name: 'Natrium', wert: '138', einheit: 'mmol/l', norm: '135–145', datum: 'heute 12:20' },
      { name: 'Blutzucker (Kapillar)', wert: '92', einheit: 'mg/dl', norm: '60–100', datum: 'heute 12:20' },
    ],
    pflegeplanung: [
      { problem: 'Gefahr eines Flüssigkeitsdefizits bei Fieber und Trinkschwäche', ziel: 'Trinkt bis morgen früh mindestens 800 ml, Windel mindestens 4-mal nass', massnahmen: ['Lieblingsgetränk in der eigenen Flasche anbieten, kleine Mengen häufig', 'Trinkprotokoll mit der Mutter führen', 'Windeln wiegen'] },
      { problem: 'Schmerzen rechtes Ohr', ziel: 'Leon wirkt entspannt, KUSS unter 4', massnahmen: ['KUSS-Skala 4-stündlich und bei Bedarf', 'Nähe der Mutter ermöglichen, Kuscheltier'] },
    ],
    rechtliches: [
      'Sorgeberechtigt: beide Eltern (verheiratet). Mutter, Frau Berger, ist als Begleitperson aufgenommen.',
      'Auskunft an weitere Angehörige (z. B. Großeltern) nur mit Einverständnis der Eltern.',
    ],
  },

  befunde: [
    { massnahme: 'vorstellen-einverstaendnis', varianten: [{ text: 'Du stellst dich der Mutter vor und gehst in die Hocke. Leon sitzt auf ihrem Schoß, quengelt und drückt das Gesicht an ihre Schulter.' }] },
    { massnahme: 'ersteindruck-abcde', varianten: [
      { wenn: KRAMPFT, text: 'A: Speichel vor dem Mund. B: unregelmäßige, schnappende Atmung. C: blass. D: reagiert nicht, rhythmische Zuckungen. E: heiß.' },
      { wenn: NACH_ANFALL, text: 'A: frei, schnarchende Atmung. B: atmet regelmäßig. C: rosig. D: schläft tief, reagiert kaum. E: heiß.' },
      { text: 'A frei. B: atmet etwas schnell, keine Einziehungen. C: rosig, Hände warm. D: quengelig, aber wach, schaut dich an. E: heiß, greift sich ans rechte Ohr.' },
    ] },
    { massnahme: 'atmung-beobachten', varianten: [
      { wenn: KRAMPFT, text: 'Unregelmäßige, schnappende Atmung während des Anfalls.' },
      { text: 'Atemfrequenz {af}/min, keine Einziehungen, kein Nasenflügeln.', zeigt: ['af'] },
    ] },
    { massnahme: 'af-zaehlen', varianten: [{ text: 'Atemfrequenz {af}/min.', zeigt: ['af'] }] },
    { massnahme: 'haut-beobachten', varianten: [
      { wenn: KRAMPFT, text: 'Gesicht blass, Speichel vor dem Mund.' },
      { text: 'Gesicht gerötet und heiß, Hände und Füße warm.' },
    ] },
    { massnahme: 'rekap-pruefen', varianten: [{ text: 'Rekapillarisierung {rekapSek} Sekunden.', zeigt: ['rekapSek'] }] },
    { massnahme: 'bewusstsein-avpu', varianten: [
      { wenn: KRAMPFT, text: 'Reagiert nicht (AVPU {avpu}), Augen nach oben verdreht.', zeigt: ['avpu'] },
      { wenn: NACH_ANFALL, text: 'Schläft tief, öffnet die Augen kurz auf Ansprache oder Berührung (AVPU {avpu}). Nach einem Anfall ist das typisch, es muss aber besser werden.', zeigt: ['avpu'] },
      { text: 'Wach, schaut dich an, weint bei Berührung (AVPU {avpu}).', zeigt: ['avpu'] },
    ] },
    { massnahme: 'pupillen-pruefen', varianten: [{ text: 'Pupillen beidseits gleich groß, reagieren auf Licht.' }] },
    { massnahme: 'schmerz-kinderskala', varianten: [{ text: 'KUSS-Skala: weint, verzieht das Gesicht, greift ans Ohr. Mittlere Schmerzen.' }] },
    { massnahme: 'krampf-schuetzen', varianten: [
      { wenn: KRAMPFT, text: 'Du merkst dir die Uhrzeit, nimmst Spielzeug aus dem Bett, polsterst mit der Hand den Kopf und lässt die Zuckungen zu. Arme und Beine zucken rhythmisch, die Augen sind verdreht.' },
      { wenn: NACH_ANFALL, text: 'Der Anfall ist vorbei, er hat etwa drei Minuten gedauert. Jetzt Atemwege sichern.' },
      { text: 'Gerade krampft er nicht. Du legst Spielzeug mit harten Kanten aus dem Bett.' },
    ] },
    { massnahme: 'stabile-seitenlage', varianten: [
      { wenn: KRAMPFT, text: 'Während der Zuckungen lässt er sich nicht lagern. Schützen und warten, bis der Anfall aufhört.' },
      { text: 'Leon liegt in Seitenlage, der Mund zeigt nach unten, Speichel kann abfließen. Er atmet hörbar, aber frei.' },
    ] },
    { massnahme: 'temperatur-ohr', varianten: [{ text: '{temp} °C (Ohr links).', zeigt: ['temp'] }] },
    { massnahme: 'pulsoxy-anlegen', varianten: [{ text: 'SpO₂ {spo2} %, Puls {hf}/min.', zeigt: ['spo2', 'hf'] }] },
    { massnahme: 'puls-zaehlen', varianten: [{ text: 'Puls {hf}/min.', zeigt: ['hf'] }] },
    { massnahme: 'bz-messen', varianten: [{ text: 'BZ {bz} mg/dl, keine Unterzuckerung.', zeigt: ['bz'] }] },
    { massnahme: 'kurve-lesen', varianten: [{ text: 'Aufnahme 12 Uhr: 38,9 °C, trinkt wenig, Otitis rechts. Gewicht 11 kg. Keine Krampfanfälle bekannt. Bedarfsmedikation: nicht angesetzt.' }] },
    { massnahme: 'paracetamol-supp', varianten: [{ text: 'Zäpfchen gegeben, Uhrzeit und Dosis dokumentiert.' }] },
    { massnahme: 'trinken-anbieten', varianten: [
      { wenn: { wert: 'vigilanz', vergleich: '<', grenze: 0.8 }, text: 'Er ist noch zu schläfrig, das Wasser läuft aus dem Mundwinkel, er hustet.' },
      { text: 'Er trinkt ein paar Schlucke Tee aus seiner Flasche.' },
    ] },
  ],

  gespraech: [
    { id: 'g-beobachtet', frage: 'Mutter fragen, was ihr aufgefallen ist', an: 'eltern', kompetenzbereiche: ['I', 'II'],
      antwort: [
        { wenn: ANFALL_ERLEBT, text: '„Er ist plötzlich ganz steif geworden, dann hat er gezuckt, bestimmt fünf Minuten! Ich dachte, er stirbt.“' },
        { text: '„Seit heute früh ist er so heiß und will nichts trinken. Er greift dauernd an sein Ohr.“' },
      ], fakten: ['Fieber seit dem Morgen', 'trinkt wenig', 'Paracetamol-Saft um 07:30 zu Hause'] },
    { id: 'g-familie', frage: 'Fragen, ob es in der Familie Krampfanfälle gab', an: 'eltern', kompetenzbereiche: ['I'],
      antwort: [{ text: '„Mein Bruder hatte als Kind auch Fieberkrämpfe, glaube ich.“' }], fakten: ['Familienanamnese Fieberkrampf'] },
    { id: 'g-erklaeren', frage: 'Mutter erklären, was ein Fieberkrampf ist und was jetzt passiert', an: 'eltern', kompetenzbereiche: ['II'],
      antwort: [
        { wenn: ANFALL_ERLEBT, text: 'Sie hört zu, weint und nickt: „Also ist das nicht gefährlich für sein Gehirn?“ Sie bleibt bei Leon und hält seine Hand.' },
        { text: '„Kann das gefährlich werden mit dem Fieber?“' },
      ] },
    // Runde 2 (P14b): Großmutter mit Schweigepflicht, Kollege Tim
    { id: 'g-einwilligung-oma', frage: 'Mutter fragen, ob du der Großmutter Auskunft geben darfst', an: 'eltern', kompetenzbereiche: ['II', 'IV'],
      nurWenn: ANFALL_ERLEBT,
      antwort: [{ text: '„Das ist meine Mutter. Ja, sagen Sie ihr bitte, was passiert ist. Ich schaffe das gerade nicht.“', setzt: ['einwilligung-oma'] }],
      fakten: ['Großmutter ist die Mutter von Frau Berger', 'Frau Berger ist einverstanden'] },
    { id: 'g-oma-lage', frage: 'Großmutter am Telefon: Anfall und jetzigen Zustand schildern', an: 'angehoerige', kanal: 'telefon', kompetenzbereiche: ['II', 'IV'],
      nurWenn: OMA_RUFT,
      schweigepflicht: { erlaubtWenn: { flag: 'einwilligung-oma' },
        fehlerText: 'Du hast der Großmutter Auskunft über Leon gegeben, ohne die Mutter zu fragen. Großeltern sind nicht sorgeberechtigt; Auskunft geben nur die Eltern oder du mit ihrem Einverständnis. Die Mutter sitzt neben dir und kann gefragt werden.' },
      antwort: [
        { wenn: { flag: 'arzt-kommt' }, text: '„Oh Gott, der arme Kleine. Gut, dass die Ärztin gleich kommt. Ich rufe meinen Schwiegersohn an, damit er sich beeilt.“', setzt: ['oma-informiert'] },
        { text: '„Oh Gott! Und was sagt die Ärztin? Ich rufe meinen Schwiegersohn an.“', setzt: ['oma-informiert'] },
      ],
      fakten: ['Großmutter wohnt in der Nähe', 'Vater ist auf dem Weg'] },
    { id: 'g-oma-rueckruf', frage: 'Großmutter am Telefon: keine Auskunft ohne Einverständnis, Rückruf der Mutter anbieten', an: 'angehoerige', kanal: 'telefon', kompetenzbereiche: ['II', 'IV'],
      nurWenn: OMA_RUFT,
      antwort: [{ text: '„Ach so, ja … natürlich. Dann soll sie mich bitte zurückrufen, wenn sie kann.“', setzt: ['oma-rueckruf'] }] },
    { id: 'g-tim-notfall', frage: 'Tim bitten, Notfallmedikament und Absaugung für einen erneuten Anfall bereitzulegen', an: 'kollegin', kompetenzbereiche: ['I', 'III'],
      nurWenn: ANFALL_ERLEBT,
      antwort: [{ text: '„Mach ich. Midazolam für die Wangentasche nach Gewicht liegt im Notfallwagen, ich lege es mit der Absaugung ins Zimmer. Gegeben wird es nur auf ärztliche Anordnung.“', setzt: ['notfall-bereit'] }],
      fakten: ['Notfallmedikament nur nach ärztlicher Anordnung'] },
    { id: 'g-tim-bleiben', frage: 'Tim bitten, kurz bei Leon zu bleiben', an: 'kollegin', kompetenzbereiche: ['III'],
      antwort: [{ text: '„Klar, ich bin hier. Sag Bescheid, wenn du fertig bist.“' }] },
  ],

  sbar: [
    { id: 's-krampf', teil: 'S', text: 'Leon, 18 Monate, Zimmer 5: hatte gerade einen generalisierten Krampfanfall bei Fieber.', art: 'kern', bekanntWenn: ANFALL_ERLEBT },
    { id: 's-fieber', teil: 'S', text: 'Leon, 18 Monate, hat hohes Fieber und quengelt.', art: 'hilfreich' },
    { id: 'b-otitis', teil: 'B', text: 'Aufnahme heute Mittag mit Otitis media rechts, trinkt wenig, 11 kg, bisher keine Anfälle, keine Bedarfsmedikation angesetzt.', art: 'kern' },
    { id: 'b-krippe', teil: 'B', text: 'Er geht seit zwei Monaten in die Krippe.', art: 'ablenker' },
    { id: 'a-krampf-dauer', teil: 'A', text: 'Anfall mit Steifwerden und rhythmischen Zuckungen an Armen und Beinen, etwa drei Minuten, von selbst aufgehört.', art: 'kern', bekanntWenn: NACH_ANFALL },
    { id: 'a-postiktal', teil: 'A', text: 'Jetzt in Seitenlage, schläft tief, reagiert auf Ansprache, atmet frei, Sättigung und Blutzucker gemessen.', art: 'kern', bekanntWenn: { alle: [NACH_ANFALL, { getan: 'pulsoxy-anlegen' }, { getan: 'bz-messen' }] } },
    { id: 'a-fieber', teil: 'A', text: 'Hohes Fieber, über 39 °C.', art: 'kern', bekanntWenn: { getan: 'temperatur-ohr' } },
    { id: 'a-epilepsie', teil: 'A', text: 'Ich glaube, er hat Epilepsie.', art: 'falsch' },
    { id: 'r-kommen', teil: 'R', text: 'Bitte kommen Sie und schauen Sie ihn an. Was sollen wir gegen das Fieber geben, und was tun wir, wenn er wieder krampft?', art: 'kern' },
    // Runde 2: Rückmeldung zur Kontrolle (Rückauftrag) – nur, was man sieht
    { id: 'a-wird-wacher', teil: 'A', text: 'Er wird wacher, öffnet die Augen auf Ansprache und sucht seine Mutter, atmet frei.', art: 'hilfreich',
      bekanntWenn: { alle: [{ getan: 'bewusstsein-avpu' }, { wert: 'vigilanz', vergleich: '>=', grenze: 0.6 }] } },
  ],

  anordnungen: [
    { id: 'an-para-500', massnahme: 'paracetamol-supp', text: 'Paracetamol-Zäpfchen 500 mg rektal.',
      fehlerhaft: {
        warum: 'Für ein Kind mit 11 kg sind etwa 15 mg/kg üblich, also rund 165 mg; 500 mg wären etwa 45 mg/kg und damit eine Überdosis (Leberschaden). Dosis immer nach Gewicht nachrechnen.',
        korrektur: 'Natürlich, ein 125-mg-Zäpfchen. Bei 11 kg höchstens 4 Gaben am Tag mit mindestens 6 Stunden Abstand.',
        ersatz: 'an-para-125',
      } },
    { id: 'an-para-125', massnahme: 'paracetamol-supp', text: 'Paracetamol-Zäpfchen 125 mg rektal, frühestens nach 6 h wiederholen, höchstens 4-mal am Tag.' },
    { id: 'an-o2', massnahme: 'o2-geben', text: 'Sauerstoff über Kindermaske vorhalten, wenn SpO₂ unter 94 %.' },
  ],

  arzt: {
    name: 'Stationsärztin Dr. Nowak',
    erreichbar: 'telefon',
    // Runde 2 (P14b): Regeln von genau nach allgemein. Ohne SpO₂/BZ fragt die Ärztin zurück; danach Rückauftrag
    // „in 10 Minuten Temperatur und Bewusstsein, per Messenger melden“. Messenger nach dem ersten Kontakt.
    regeln: [
      { ...R_KOMMT, wenn: { alle: [{ gemeldet: ['a-krampf-dauer'] }, { eine: [{ gemeldet: ['a-postiktal'] }, { gemeldet: ['wert:spo2', 'wert:bz'] }] }] } },
      { id: 'r-werte-frage', wenn: { gemeldet: ['a-krampf-dauer'] },
        antwort: '„Ein Krampfanfall von etwa drei Minuten, verstanden. Ist er jetzt in Seitenlage?“',
        rueckfrage: { text: '„Wie ist die Sättigung, und wie hoch ist der Blutzucker?“', erwartet: ['wert:spo2', 'wert:bz'], auftrag: 'af-werte' } },
      { wenn: { gemeldet: ['a-epilepsie'] },
        antwort: '„Woran machen Sie das fest? Beschreiben Sie mir bitte, was Sie gesehen haben.“' },
      { wenn: { gemeldet: ['a-fieber'] },
        antwort: '„Geben Sie ein Paracetamol-Zäpfchen 500 mg, ich schaue nach der Aufnahme vorbei.“', anordnungen: ['an-para-500'], setzt: ['arzt-fieber'] },
    ],
    auftraege: [
      { id: 'af-werte', text: 'Sättigung und Blutzucker messen und der Ärztin melden', erledigt: { alle: [{ getan: 'bz-messen' }] },
        meldung: ['wert:spo2', 'wert:bz'], meldenBinnenSek: 300,
        folge: [{ ...R_KOMMT, wenn: { gemeldet: ['a-krampf-dauer'] } }] },
      { id: 'af-kontrolle', text: 'In 10 Minuten Temperatur und Bewusstsein kontrollieren und der Ärztin schreiben', meldenBinnenSek: 900,
        erledigt: { alle: [{ ab: 480 }, { getan: 'temperatur-ohr' }, { getan: 'bewusstsein-avpu' }] },
        meldung: ['wert:temp'],
        folge: [
          { wenn: { gemeldet: ['a-wird-wacher'] }, antwort: '„Danke, das ist der erwartete Verlauf. Trinken erst, wenn er richtig wach ist. Ich bin gleich bei Ihnen.“', setzt: ['kontrolle-gemeldet'] },
          { wenn: { ab: 0 }, antwort: '„Danke für den Wert. Wie wach ist er? Bleibt er so schläfrig oder krampft er wieder, rufen Sie sofort an. Ich bin gleich da.“', setzt: ['kontrolle-gemeldet'] },
        ] },
    ],
  },

  ereignisse: [
    { id: 'e-krampf', art: 'komplikation', wann: KRAMPFT,
      text: 'Leon wird plötzlich steif, dann zucken Arme und Beine rhythmisch, die Augen sind verdreht, er reagiert nicht. Die Mutter schreit: „Er stirbt! Tun Sie doch was!“',
      bild: { haltung: 'liegt', haut: 'blass', mimik: 'schlaefrig' },
      entscheidung: [
        { id: 'w-schuetzen', text: 'Uhrzeit merken, mit der Klingel Hilfe rufen, Kopf schützen, harte Gegenstände weg, bei ihm bleiben und die Mutter ansprechen', wertung: 'gut', warum: 'Im Anfall schützen und beobachten, Hilfe rufen, ohne den Raum zu verlassen. Die Dauer entscheidet über die weitere Behandlung.' },
        { id: 'w-festhalten', text: 'Arme und Beine festhalten und etwas zwischen die Zähne schieben', wertung: 'gefaehrlich', warum: 'Festhalten kann Knochen und Gelenke verletzen; Gegenstände im Mund verletzen Zähne und Atemwege.' },
        { id: 'w-weg', text: 'Ins Dienstzimmer laufen und die Ärztin anrufen', wertung: 'falsch', warum: 'Du lässt Kind und Mutter allein und verpasst Beginn und Verlauf. Hilfe holst du mit der Klingel.' },
      ] },
    { id: 'e-postiktal', art: 'patient', wann: NACH_ANFALL,
      text: 'Die Zuckungen hören auf. Leon ist schlaff und schläft tief, er atmet schnarchend, Speichel läuft aus dem Mundwinkel.',
      bild: { haltung: 'liegt', haut: 'rosig', mimik: 'schlaefrig' } },
    { id: 'e-tim', art: 'team', wann: { getan: 'hilfe-holen' },
      text: 'Tim kommt ins Zimmer: „Ich bin da. Was brauchst du?“' },
    { id: 'e-oma', art: 'telefon', wann: OMA_RUFT,
      text: 'Das Stationstelefon klingelt. Die Großmutter: „Meine Tochter hat mir geschrieben, Leon hatte einen Anfall? Was ist denn mit ihm?“' },
    { id: 'e-aerztin-da', art: 'visite', wann: { alle: [{ flag: 'arzt-kommt' }, { eine: [{ flag: 'kontrolle-gemeldet' }, { ab: 2100 }] }] },
      text: 'Dr. Nowak untersucht Leon. Er wird langsam wacher und sucht seine Mutter. „Ein einfacher Fieberkrampf. Wir beobachten ihn heute Nacht mit Pulsoxymeter.“' },
  ],

  pa: {
    name: 'Praxisanleiterin Frau Yilmaz',
    hilfen: [
      { wenn: KRAMPFT, impuls: 'Was ist im Anfall wichtiger: ihn ruhig halten oder ihn schützen?', tipp: 'Uhr ansehen, Kopf schützen, nicht festhalten, nichts in den Mund, Hilfe klingeln.' },
      { wenn: { alle: [NACH_ANFALL, { nicht: { getan: 'stabile-seitenlage' } }] }, impuls: 'Er schläft tief und schnarcht. Worauf musst du jetzt achten?', tipp: 'Seitenlage für freie Atemwege, dann Sättigung und Blutzucker messen.' },
      { wenn: { alle: [{ eine: [{ flag: 'arzt-kommt' }, { flag: 'arzt-fieber' }] }, { nicht: { flag: 'remonstriert:an-para-500' } }] }, impuls: 'Rechne mal mit: Wie viel Paracetamol bekommt ein Kind pro Kilogramm?', tipp: 'Etwa 15 mg/kg, bei 11 kg also rund 165 mg. Passt die Anordnung dazu?' },
      { wenn: { auftrag: 'af-werte', status: 'offen' }, impuls: 'Was wollte die Ärztin noch von dir wissen?', tipp: 'Sättigung und Blutzucker messen und ihr die Werte schicken.' },
      { wenn: { alle: [{ auftrag: 'af-kontrolle', status: 'offen' }, { nicht: { auftrag: 'af-kontrolle', status: 'gemeldet' } }] }, impuls: 'Was hat dir die Ärztin für die nächsten Minuten aufgetragen?', tipp: 'Nach zehn Minuten Temperatur und Bewusstsein prüfen und ihr im Messenger schreiben.' },
      { impuls: 'Wie geht es der Mutter gerade?', tipp: 'Erkläre ihr in einfachen Worten, was passiert ist, und bezieh sie ein.' },
    ],
  },
  team: { kollegin: 'Kinderkrankenpfleger Tim (Schichtleitung)', weitere: { eltern: 'Mutter Frau Berger', angehoerige: 'Großmutter (Telefon)' } },

  bewertung: {
    pflicht: [
      { id: 'p-temp', text: 'Temperatur gemessen', gewicht: 1, kompetenzbereiche: ['I'], erfuellt: { getan: 'temperatur-ohr' },
        warum: 'Hohes Fieber gehört in jede Meldung und begründet die Fiebermittelgabe.' },
      { id: 'p-schuetzen', text: 'Im Anfall geschützt, Zeit gemerkt, Hilfe gerufen', gewicht: 3, kompetenzbereiche: ['I', 'V'],
        erfuellt: { eine: [{ getan: 'wahl:e-krampf:w-schuetzen' }, { getan: 'krampf-schuetzen' }] }, warum: 'Die Dauer entscheidet, ob ein Notfallmedikament nötig wird; Schutz verhindert Verletzungen.' },
      { id: 'p-seitenlage', text: 'Nach dem Anfall in Seitenlage gebracht', gewicht: 3, kompetenzbereiche: ['I'], erfuellt: { getan: 'stabile-seitenlage' },
        warum: 'Nach dem Anfall ist der Schutzreflex vermindert; Seitenlage hält die Atemwege frei.' },
      { id: 'p-spo2', text: 'Sättigung überwacht', gewicht: 2, kompetenzbereiche: ['I'], erfuellt: { getan: 'pulsoxy-anlegen' },
        warum: 'Bei Atemstörung nach dem Anfall früh erkennen, ob Sauerstoff nötig ist.' },
      { id: 'p-bz', text: 'Blutzucker gemessen', gewicht: 1, kompetenzbereiche: ['I', 'V'], erfuellt: { getan: 'bz-messen' },
        warum: 'Eine Unterzuckerung kann Krämpfe auslösen und muss ausgeschlossen werden.' },
      { id: 'p-arzt', text: 'Ärztin mit Anfallsbeschreibung und Zustand danach informiert', gewicht: 3, kompetenzbereiche: ['II', 'III'], erfuellt: { flag: 'arzt-kommt' },
        warum: 'Dauer, Art und Erholung entscheiden, ob es ein einfacher Fieberkrampf ist.' },
      { id: 'p-remonstration', text: 'Dosis nachgerechnet und 500 mg hinterfragt', gewicht: 3, kompetenzbereiche: ['III', 'IV'], erfuellt: { flag: 'remonstriert:an-para-500' },
        warum: 'Kinderdosen nach Gewicht kontrollieren ist Teil deiner Durchführungsverantwortung.' },
      { id: 'p-eltern', text: 'Mutter einbezogen und informiert', gewicht: 2, kompetenzbereiche: ['II'],
        erfuellt: { eine: [{ getan: 'eltern-einbeziehen' }, { getan: 'frage:g-erklaeren' }] }, warum: 'Eltern erleben einen Fieberkrampf oft als Todesangst. Information und Beteiligung entlasten.' },
      { id: 'p-doku', text: 'Anfall im Pflegebericht dokumentiert (Ablauf und Dauer)', gewicht: 2, kompetenzbereiche: ['I', 'IV'], erfuellt: { dokumentiert: 'a-krampf-dauer' },
        warum: 'Die Beschreibung ist für die ärztliche Einordnung und spätere Anfälle wichtig. Eine Dokumentation ohne Dauer und Ablauf hilft niemandem.' },
      { id: 'p-rueckauftrag', text: 'Kontrolle nach 10 Minuten gemacht und der Ärztin gemeldet', gewicht: 2, kompetenzbereiche: ['II', 'III'],
        erfuellt: { auftrag: 'af-kontrolle', status: 'gemeldet' }, warum: 'Die Ärztin ist noch gebunden und entscheidet nach deiner Rückmeldung (Closed Loop).' },
      { id: 'p-auskunft', text: 'Großmutter nur mit Einverständnis der Mutter informiert', gewicht: 1, kompetenzbereiche: ['II', 'IV'],
        erfuellt: { eine: [{ alle: [{ getan: 'frage:g-oma-lage' }, { flag: 'einwilligung-oma' }] }, { getan: 'frage:g-oma-rueckruf' }] },
        warum: 'Großeltern sind nicht sorgeberechtigt. Auskunft nur mit Einverständnis der Eltern (Schweigepflicht).' },
      { id: 'p-vorbereitet', text: 'Für einen erneuten Anfall vorbereitet (Notfallmedikament, Absaugung)', gewicht: 1, kompetenzbereiche: ['I', 'III'],
        erfuellt: { flag: 'notfall-bereit' }, warum: 'Ein zweiter Anfall in den ersten 24 Stunden ist möglich; dann zählt jede Minute.' },
    ],
    fehler: [
      { id: 'f-festhalten', text: 'Kind im Anfall festgehalten', schwere: 'schwer', kompetenzbereiche: ['I', 'V'],
        wenn: { eine: [{ getan: 'kind-festhalten' }, { getan: 'wahl:e-krampf:w-festhalten' }] },
        warum: 'Festhalten stoppt keinen Anfall und kann Knochen und Gelenke verletzen.' },
      { id: 'f-mund', text: 'Gegenstand zwischen die Zähne geschoben', schwere: 'schwer', kompetenzbereiche: ['I', 'V'], wenn: { getan: 'beisskeil' },
        folge: { text: 'Ein Milchzahn bricht ab, Leon würgt.', wirkung: [{ groesse: 'atemarbeit', delta: 0.4, beginnSek: 0, spitzeSek: 10, dauerSek: 300 }] },
        warum: 'Gegenstände im Mund verletzen Zähne und Mundschleimhaut und können die Atemwege verlegen.' },
      { id: 'f-allein', text: 'Kind und Mutter im Anfall allein gelassen', schwere: 'mittel', kompetenzbereiche: ['I', 'III'], wenn: { getan: 'wahl:e-krampf:w-weg' },
        warum: 'Hilfe holst du über die Klingel; du bleibst beim Kind.' },
      { id: 'f-para-500', text: 'Paracetamol 500 mg ohne Nachrechnen gegeben', schwere: 'schwer', kompetenzbereiche: ['I', 'III', 'IV'],
        wenn: { alle: [{ getan: 'paracetamol-supp' }, { nicht: { flag: 'remonstriert:an-para-500' } }] },
        warum: '500 mg entsprechen bei 11 kg etwa 45 mg/kg, das ist eine Überdosis. Remonstrieren wäre richtig gewesen.' },
      { id: 'f-trinken', text: 'Dem schläfrigen Kind zu trinken gegeben', schwere: 'mittel', kompetenzbereiche: ['I'],
        wenn: { alle: [{ getan: 'trinken-anbieten' }, { wert: 'vigilanz', vergleich: '<', grenze: 0.8 }] },
        warum: 'Nach dem Anfall sind die Schutzreflexe vermindert: Aspirationsgefahr. Erst trinken, wenn er richtig wach ist.' },
    ],
    ende: [
      { wenn: { alle: [{ flag: 'arzt-kommt' }, { flag: 'kontrolle-gemeldet' }, { getan: 'stabile-seitenlage' }, { getan: 'pflegebericht' }] },
        text: 'Leon wird wacher und kuschelt sich an seine Mutter. Die Ärztin hat ihn untersucht: einfacher Fieberkrampf. Er bleibt über Nacht mit Pulsoxymeter.', ausgang: 'stabil' },
      { wenn: { ab: 2700 }, text: 'Die Ärztin kommt erst jetzt. Niemand weiß genau, wie lange der Anfall gedauert hat.', ausgang: 'verschlechtert' },
    ],
  },

  pflegebedarf: {
    probleme: [
      { id: 'pb-atemweg', text: 'Gefahr der Atemwegsverlegung und Aspiration nach dem Anfall', richtig: true, prioritaet: 1, warum: 'Er ist schläfrig, die Schutzreflexe sind vermindert.' },
      { id: 'pb-krampf', text: 'Gefahr eines erneuten Anfalls und von Verletzungen bei Fieber', richtig: true, prioritaet: 1, warum: 'Ein Wiederholungsanfall in den ersten 24 Stunden ist möglich.' },
      { id: 'pb-eltern', text: 'Angst und Informationsbedarf der Mutter', richtig: true, prioritaet: 2, warum: 'Sie hat Todesangst erlebt und braucht Information und Anleitung.' },
      { id: 'pb-fluessigkeit', text: 'Gefahr eines Flüssigkeitsdefizits (Fieber, trinkt wenig)', richtig: true, prioritaet: 2, warum: 'Kleinkinder trocknen bei Fieber schnell aus.' },
      { id: 'pb-epilepsie', text: 'Epilepsie', richtig: false, warum: 'Das ist eine ärztliche Diagnose und hier nicht gesichert; ein einfacher Fieberkrampf ist keine Epilepsie.' },
      { id: 'pb-obstipation', text: 'Obstipation', richtig: false, warum: 'Dafür gibt es keinen Hinweis.' },
    ],
    ziele: [
      { id: 'z-atemweg', text: 'Leon hat freie Atemwege und SpO₂ ab 94 %, bis er wieder wach ist.', passtZu: ['pb-atemweg'], richtig: true },
      { id: 'z-eltern', text: 'Die Mutter kann sagen, was ein Fieberkrampf ist und was sie bei einem neuen Anfall tut.', passtZu: ['pb-eltern', 'pb-krampf'], richtig: true },
      { id: 'z-trinken', text: 'Leon trinkt, sobald er wach ist, regelmäßig kleine Mengen (Trinkprotokoll).', passtZu: ['pb-fluessigkeit'], richtig: true },
      { id: 'z-fieberfrei', text: 'Leon wird durch konsequente Fiebersenkung vor weiteren Krämpfen geschützt.', passtZu: ['pb-krampf'], richtig: false },
    ],
  },

  leitfaden: [
    { titel: 'Was ein Fieberkrampf ist', text: 'Fieberkrämpfe treten bei etwa 2–5 % der Kinder zwischen 6 Monaten und 5 Jahren auf, meist bei schnell steigendem Fieber. Ein einfacher Fieberkrampf ist generalisiert, dauert unter 15 Minuten und kommt nicht wieder innerhalb von 24 Stunden. Er schadet dem Gehirn nicht. Fiebersenkung verhindert Fieberkrämpfe nicht; Fiebermittel gibt man für das Wohlbefinden.', quellen: ['aap-fieberkrampf', 'nice-fieber'] },
    { titel: 'Im Anfall', text: 'Uhrzeit merken, Hilfe über die Klingel rufen, beim Kind bleiben, Kopf schützen, harte Gegenstände entfernen. Nicht festhalten, nichts in den Mund. Dauert der Anfall länger als 3–5 Minuten, gibt die Ärztin ein Notfallmedikament (z. B. Midazolam bukkal); das bereitest du nach Anordnung vor.', quellen: ['erc-kinder', 'gnp-fieberkrampf'] },
    { titel: 'Nach dem Anfall', text: 'Seitenlage, Atemwege frei halten, Sättigung messen, Sauerstoff nach Anordnung, Blutzucker messen, Bewusstsein beobachten, bis das Kind wieder wach ist. Erst trinken lassen, wenn es sicher schlucken kann. Beginn, Dauer und Ablauf dokumentieren.', quellen: ['erc-kinder'] },
    { titel: 'Dosis nach Gewicht', text: 'Paracetamol für Kinder: etwa 15 mg/kg je Gabe, mindestens 6 Stunden Abstand, Tageshöchstdosis beachten. Bei 11 kg ist ein 125-mg-Zäpfchen passend. Jede Kinderdosis rechnest du nach; passt sie nicht, hinterfragst du die Anordnung.', quellen: ['fi-paracetamol'] },
    { titel: 'Eltern', text: 'Eltern erleben den ersten Fieberkrampf oft als Todesangst. Ruhig erklären, was passiert ist, beteiligen (Hand halten, beim Kind bleiben), schriftliche Information mitgeben und besprechen, was bei einem neuen Anfall zu tun ist.', quellen: ['gnp-fieberkrampf'] },
  ],

  pruefwege: {
    muster: [
      { art: 'massnahme', id: 'vorstellen-einverstaendnis' },
      { art: 'massnahme', id: 'ersteindruck-abcde' },
      { art: 'massnahme', id: 'temperatur-ohr' },
      { art: 'frage', id: 'g-beobachtet' },
      { art: 'massnahme', id: 'kurve-lesen' },
      { art: 'warten', sek: 300 },
      { art: 'massnahme', id: 'krampf-schuetzen' },
      { art: 'massnahme', id: 'hilfe-holen' },
      { art: 'warten', sek: 180 },
      { art: 'massnahme', id: 'stabile-seitenlage' },
      { art: 'massnahme', id: 'pulsoxy-anlegen' },
      { art: 'massnahme', id: 'bz-messen' },
      { art: 'frage', id: 'g-tim-bleiben' },
      { art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: ['s-krampf', 'b-otitis', 'a-krampf-dauer', 'a-postiktal', 'wert:spo2', 'wert:bz', 'a-fieber', 'r-kommen'] },
      { art: 'rueckmelden', anordnung: 'an-o2', rueckgelesen: true },
      { art: 'remonstrieren', anordnung: 'an-para-500', grund: '11 kg mal 15 mg/kg sind etwa 165 mg, nicht 500 mg.' },
      { art: 'rueckmelden', anordnung: 'an-para-125', rueckgelesen: true },
      { art: 'auflegen', an: 'aerztin' },
      { art: 'massnahme', id: 'paracetamol-supp' },
      { art: 'frage', id: 'g-tim-notfall' },
      { art: 'frage', id: 'g-erklaeren' },
      { art: 'massnahme', id: 'eltern-einbeziehen' },
      { art: 'frage', id: 'g-einwilligung-oma' },
      { art: 'frage', id: 'g-oma-lage' },
      { art: 'dokumentieren', bausteine: ['a-krampf-dauer', 'a-postiktal', 'wert:spo2', 'wert:bz', 'anordnung:an-para-125'] },
      { art: 'massnahme', id: 'temperatur-ohr' },
      { art: 'massnahme', id: 'bewusstsein-avpu' },
      { art: 'nachricht', an: 'aerztin', kanal: 'messenger', bausteine: ['wert:temp', 'a-wird-wacher'] },
      { art: 'warten', sek: 120 },
      { art: 'abschluss', probleme: ['pb-atemweg', 'pb-krampf', 'pb-eltern', 'pb-fluessigkeit'], ziele: ['z-atemweg', 'z-eltern', 'z-trinken'],
        sbar: ['s-krampf', 'b-otitis', 'a-krampf-dauer', 'a-postiktal', 'a-fieber'] },
    ],
    unterlassung: { bisSek: 1500, erwartet: { alle: [NACH_ANFALL, { wert: 'temperatur', vergleich: '>=', grenze: 39.5 }] } },
    grenze: { rolle: 1, events: [{ art: 'massnahme', id: 'paracetamol-supp' }], erwartet: 'pa-eingriff' },
  },
};
