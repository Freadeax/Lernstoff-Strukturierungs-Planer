// Fallwelle P19 (CE 10) · Pädiatrie: Bronchiolitis (RSV) beim Säugling im Nachtdienst
// Entwurf, fachlich UNGEPRÜFT. Inhalte fiktiv/didaktisch. Migriert und neu geschrieben aus Altfall „bronchiolitis“ (scenarios.json).

import { KATALOG } from '../katalog';
import type { Bedingung, FallV2, MassnahmeDefinition } from '../typen';

const aus = (id: string, mehr: Partial<MassnahmeDefinition>): MassnahmeDefinition => ({ ...KATALOG[id]!, ...mehr });

const ABGESAUGT: Bedingung = { getan: 'nase-absaugen' };
const TRINKMENGE_BEKANNT: Bedingung = { eine: [{ getan: 'frage:g-mutter-trinken' }, { getan: 'kurve-lesen' }, { getan: 'bilanz-fuehren' }] };

const KOMMT = '„Danke. Klingt nach einer typischen RSV-Bronchiolitis mit Trinkschwäche. Sauerstoff über die Nasenbrille, wenn die Sättigung unter 92 Prozent fällt. Vor jedem Trinken Nase absaugen, Nasentropfen Xylometazolin 0,1 Prozent, je zwei Tropfen. Kleine Mahlzeiten, Kopfteil hoch, Monitor dranlassen. Ich komme nach der Notaufnahme, etwa in zwanzig Minuten. Schreiben Sie mir nach dem nächsten Trinkversuch, wie viel sie geschafft hat und wie die Sättigung ist.“';
const R_KOMMT = { id: 'r-kommt', antwort: KOMMT, anordnungen: ['an-o2', 'an-xylo'], kommtNachSek: 1200, setzt: ['arzt-kommt'], auftraege: ['af-trinkversuch'] };

export const PAED_BRONCHIOLITIS_SAEUGLING: FallV2 = {
  schema: 2,
  id: 'paed-bronchiolitis-saeugling',
  version: '0.2.0',
  spur: 'A',
  setting: 'paediatrie',
  altersgruppe: 'saeugling',
  titel: '„Sie trinkt nur noch die Hälfte“',
  kurz: 'Kinderstation, Nachtdienst: vier Monate alter Säugling mit RSV atmet angestrengt und trinkt schlecht.',
  rahmen: 'Du bist im Nachtdienst auf der Kinderstation und betreust mit deiner Praxisanleitung Mila und ihre Mutter.',
  lernziele: [
    'Atemnot beim Säugling erkennen: Atemfrequenz, Einziehungen, Nasenflügeln, Sättigung, Trinkverhalten.',
    'Freie Nasenatmung herstellen (absaugen vor dem Trinken), lagern und kleine Mahlzeiten anbieten.',
    'Trinkmenge und nasse Windeln erheben und der Ärztin mit Sättigung melden.',
    'Eine für Säuglinge ungeeignete Arzneimittel-Anordnung erkennen und hinterfragen.',
    'Infektionsschutz (RSV) umsetzen und die erschöpfte Mutter einbeziehen.',
  ],
  lehrplan: {
    ce: ['ce.10', 'ce.05'], abschnitt: ['ad12', 'ad3'],
    themen: ['thema.kl.paediatrie', 'thema.kl.atmung', 'thema.fa.paediatrie', 'thema.ph.hygiene', 'thema.pro.dehydratation'],
    kompetenzen: ['I.1.d', 'I.5.a', 'II.1.b', 'III.2.a'],
  },
  geeignet: { rollen: [1, 2, 3], stufen: [1, 2, 3] },
  dauerMin: [12, 18],
  freigabe: {
    status: 'entwurf',
    pruefpunkte: [
      'Vorgehen gegen AWMF-Leitlinie Bronchiolitis (S2k, GPP/DGPI, aktuelle Fassung) und NICE NG9 (Fassung 2021, erstmals 2015) prüfen: supportiv, keine Bronchodilatatoren routinemäßig',
      'O₂-Grenze: NICE NG9 SpO₂ unter 92 % (ab 6 Wochen); Stationsstandard abgleichen',
      'Remonstrationspunkt: Xylometazolin 0,1 % (Erwachsenenstärke) beim Säugling kontraindiziert; NaCl 0,9 % als Ersatz plausibel?',
      'Trinkmenge: unter 50–75 % der üblichen Menge als Aufnahme-/Eskalationskriterium (NICE) prüfen',
      'Isolierung RSV: Kontakt- und Tröpfchenschutz nach KRINKO/Hygieneplan; Kohortierung',
      'Befugnis Nase absaugen beim Säugling im 1./2. Drittel mit Anleitung (Lehrplan CE 10 S. 169) bestätigen',
      'Modell: Säuglingsprofil, Atemfrequenz um 60, SpO₂ 92–94 %; ohne Absaugen nach 15 Minuten Sekretstau',
    ],
  },
  quellen: [
    { id: 'nice-ng9', titel: 'NICE NG9: Bronchiolitis in children – diagnosis and management (Fassung 2021, erstmals 2015)' },
    { id: 'krinko-rsv', titel: 'RKI-Ratgeber RSV-Infektionen; KRINKO: Infektionsprävention im Rahmen der Pflege und Behandlung von Patienten mit übertragbaren Krankheiten (2015)' },
    { id: 'fi-xylometazolin', titel: 'Fachinformation Xylometazolin-Nasentropfen 0,1 % (Erwachsene, Schulkinder) und 0,025 % (Säuglinge)' },
    { id: 'stiko-rsv', titel: 'STIKO-Empfehlung zur RSV-Prophylaxe mit Nirsevimab für Neugeborene und Säuglinge (2024)' },
  ],

  person: {
    name: 'Mila Hoffmann',
    alter: { monate: 4 },
    geschlecht: 'w',
    biografie: ['erstes Kind, die Mutter ist seit zwei Nächten mit im Zimmer', 'wird mit der Flasche gefüttert (Pre-Nahrung), sonst etwa 150 ml alle 3–4 Stunden', 'großer Bruder? nein, aber Krippe ab Januar geplant'],
    diagnosenBekannt: ['akute Bronchiolitis, RSV-Schnelltest positiv', 'Aufnahme gestern Abend wegen Trinkschwäche'],
    medikamentePlan: ['Paracetamol-Zäpfchen 75 mg bei Fieber (Bedarf)'],
    allergien: ['keine bekannt'],
    gewichtKg: 6.2,
  },
  medien: {
    raum: '20n_paediatrie_kleinkind_nacht_fall_bronchiolitis_ohne_monitor',
    raumVarianten: [
      { wenn: { getan: 'pulsoxy-anlegen' }, raum: '20n_paediatrie_kleinkind_nacht_fall_bronchiolitis_sensor_an' },
    ],
  },
  uebernahme: 'Mila, 4 Monate, 6,2 kg, RSV-Bronchiolitis, gestern Abend aufgenommen. Sie trinkt schlecht, die 22-Uhr-Flasche kam halb voll zurück. Das Pulsoxymeter hatte ständig Fehlalarm, die Mutter hat den Sensor beim Wickeln abgemacht. Paracetamol hat sie um 21 Uhr bekommen.',
  startUhrzeit: '01:00',

  start: {
    // Säugling: Obstruktion (bronchospasmus als Modell für Schleimhautschwellung/Sekret) + leicht gestörter Gasaustausch, Fieber, Trinkschwäche.
    grund: { gasaustausch: 0.84, temperatur: 38.3, hydratation: 0.9, volumen: 0.96, angst: 0.2, unruhe: 0.25 },
    treiber: [{ art: 'bronchospasmus', staerke: 0.5 }, { art: 'exsikkose_progressiv', verlustProStunde: 0.04 }, { art: 'atemerschoepfung', tempo: 6 }],
    bild: { haltung: 'liegt', haut: 'blass', mimik: 'schmerz' },
    sichtbar: [],
  },

  massnahmen: [
    // Gespräch
    'vorstellen-einverstaendnis', 'eltern-einbeziehen', 'beruhigen-zusprechen',
    // Beobachten
    'ersteindruck-abcde', 'atmung-beobachten', 'atemgeraeusche-hoeren', 'haut-beobachten', 'rekap-pruefen', 'bewusstsein-avpu', 'schleimhaut-pruefen', 'ausscheidung-beobachten', 'news2-berechnen',
    // Akut
    'oberkoerper-hoch', 'o2-geben', 'hilfe-holen', 'rea-team-alarmieren',
    // Messen
    'pulsoxy-anlegen', 'af-zaehlen', 'puls-zaehlen', 'temperatur-ohr', 'gewicht-messen', 'bilanz-fuehren', 'kurve-lesen',
    // Versorgen
    'nase-absaugen', 'nasentropfen-nacl', 'nasentropfen-xylo', 'flasche-anbieten', 'isolation-einrichten', 'paracetamol-supp',
    // Melden
    'pflegefachperson-informieren', 'pflegebericht',
  ],
  massnahmenZusatz: [
    aus('o2-geben', { name: 'Sauerstoff über Nasenbrille für Säuglinge (nach Anordnung, Ziel SpO₂ ab 92 %)', wirkung: [{ groesse: 'sauerstoff', delta: 1, beginnSek: 0, spitzeSek: 30, dauerSek: 'dauerhaft' }] }),
    aus('oberkoerper-hoch', { name: 'Kopfteil leicht hochstellen (etwa 30°), Kopf in Mittelstellung' }),
    aus('bedarfsmedikation-oral', {
      id: 'nasentropfen-nacl', name: 'Kochsalz-Nasentropfen 0,9 % geben (nach Anordnung)',
      wirkung: [{ groesse: 'atemarbeit', delta: -0.15, beginnSek: 0, spitzeSek: 60, dauerSek: 1800 }],
    }),
    aus('bedarfsmedikation-oral', { id: 'nasentropfen-xylo', name: 'Xylometazolin-Nasentropfen 0,1 % geben (nach Anordnung)' }),
    aus('trinken-anbieten', {
      id: 'flasche-anbieten', name: 'Flasche in kleiner Portion anbieten (aufrecht, Pausen), Trinkmenge aufschreiben',
      wirkung: [
        { groesse: 'hydratation', delta: 0.06, beginnSek: 300, spitzeSek: 2400, dauerSek: 'dauerhaft' },
        { groesse: 'volumen', delta: 0.04, beginnSek: 300, spitzeSek: 2400, dauerSek: 'dauerhaft' },
      ],
    }),
    aus('bedarfsmedikation-oral', { id: 'paracetamol-supp', name: 'Paracetamol-Zäpfchen 75 mg geben (Bedarfsplan)' }),
  ],

  akte: {
    aufnahmegrund: 'Aufnahme gestern 19:30 über die Kindernotaufnahme: seit drei Tagen Schnupfen und Husten, seit gestern schnelle Atmung und nur noch halbe Trinkmengen. RSV-Schnelltest positiv.',
    anamnese: [
      'Reif geboren (39. SSW), Geburtsgewicht 3400 g, bisher gesund. U4 unauffällig.',
      'Keine RSV-Prophylaxe erhalten (vor der Empfehlung geboren, laut Mutter nicht angeboten).',
      'Vater hatte letzte Woche eine Erkältung.',
      'Flaschennahrung: sonst 5 × 150 ml am Tag, seit gestern je 60–80 ml.',
    ],
    diagnosen: [
      { text: 'Akute Bronchiolitis durch RS-Viren', icd: 'J21.0', seit: 'gestern' },
      { text: 'Verminderte Trinkmenge', icd: 'R63.8', seit: 'gestern' },
    ],
    medikation: [
      { id: 'mp-paracetamol', wirkstoff: 'Paracetamol', staerke: '75 mg', form: 'Zäpfchen', massnahme: 'paracetamol-supp', zuletzt: '21:00',
        bedarf: { indikation: 'Fieber über 38,5 °C oder Unwohlsein', einzeldosis: '75 mg', maxProTag: '4 Gaben', abstandH: 6 },
        hinweis: 'Etwa 12 mg/kg. Höchstens 4 Gaben am Tag.' },
    ],
    vorwerte: [
      { zeit: 'Aufnahme 19:30', vorH: 5.5, werte: { hf: 158, af: 56, spo2: 94, temp: 38.4, gewicht: 6.2 }, kuerzel: 'JS' },
      { zeit: '22:00', vorH: 3, werte: { hf: 152, af: 54, spo2: 95, temp: 37.9 }, kuerzel: 'JS' },
    ],
    pflegebericht: [
      { zeit: '20:00', wer: 'JS', text: 'Aufnahme mit Mutter, Einzelzimmer war belegt, vorerst im Zweibettzimmer ohne Mitpatient. Atmet schnell mit leichten Einziehungen, Nase verlegt. Pulsoxymeter angelegt.' },
      { zeit: '22:15', wer: 'JS', text: '70 ml getrunken, nach dem Absaugen besser. Windel nass. Mutter sehr müde, möchte schlafen.' },
      { zeit: '00:30', wer: 'Mutter (mündlich)', text: 'Sensor beim Wickeln abgemacht, weil er dauernd piepte.' },
    ],
    aerztlicheAnordnungen: [
      { zeit: '19:45', wer: 'Dr. Weiß', text: 'Supportiv: Nase freihalten, kleine Mahlzeiten, Kopfteil hoch, Pulsoxymetrie kontinuierlich. Trinkprotokoll. Paracetamol 75 mg Supp bei Bedarf, max. 4 × täglich.' },
      { zeit: '19:45', wer: 'Dr. Weiß', text: 'Isolierung nach Hygieneplan (RSV). Bei Trinkmenge unter 50 % Magensonde erwägen, ärztlich informieren.' },
    ],
    assessments: [
      { name: 'Trinkprotokoll', wert: '150 ml seit Aufnahme', datum: 'heute 00:30', hinweis: 'Bedarf etwa 150 ml/kg am Tag, also etwa 900 ml.' },
      { name: 'Windeln', wert: '2 nasse seit Aufnahme', datum: 'heute 00:30' },
      { name: 'PEWS', wert: '3 Punkte', datum: 'gestern 22:00', hinweis: 'Atemfrequenz und Einziehungen.' },
    ],
    labor: [
      { name: 'RSV-Schnelltest (Nasensekret)', wert: 'positiv', datum: 'gestern 19:40', auffaellig: true },
      { name: 'Blutzucker (kapillär)', wert: '84', einheit: 'mg/dl', norm: '60–100', datum: 'gestern 19:40' },
    ],
    pflegeplanung: [
      { problem: 'Beeinträchtigte Atmung durch Schleimhautschwellung und Sekret', ziel: 'Freie Nasenatmung beim Trinken, SpO₂ ab 92 %', massnahmen: ['Vor jeder Mahlzeit Nasensekret absaugen', 'Kopfteil 30°', 'Pulsoxymetrie kontinuierlich'] },
      { problem: 'Gefahr eines Flüssigkeitsdefizits', ziel: 'Trinkt mindestens 75 % der üblichen Menge, mindestens 4 nasse Windeln in 24 h', massnahmen: ['Kleine Mahlzeiten alle 2–3 Stunden', 'Trinkprotokoll, Windeln wiegen'] },
    ],
    rechtliches: ['Sorgeberechtigt: beide Eltern (verheiratet). Mutter, Frau Hoffmann, als Begleitperson aufgenommen.'],
  },

  befunde: [
    { massnahme: 'vorstellen-einverstaendnis', varianten: [{ text: 'Du stellst dich der Mutter leise vor. Sie sitzt erschöpft auf dem Klappbett. Mila liegt im Gitterbett und atmet hörbar.' }] },
    { massnahme: 'ersteindruck-abcde', varianten: [
      { text: 'A: Nase mit Sekret verlegt, schnorchelnde Atmung. B: schnell, Einziehungen unter dem Rippenbogen, Nasenflügeln. C: blass, Hände kühl. D: wach, quengelt kraftlos. E: warm.' },
    ] },
    { massnahme: 'atmung-beobachten', varianten: [
      { wenn: ABGESAUGT, text: 'Atemfrequenz {af}/min, weniger Nasenflügeln, leichte Einziehungen.', zeigt: ['af'] },
      { text: 'Atemfrequenz {af}/min, Einziehungen unter dem Rippenbogen und zwischen den Rippen, Nasenflügeln, Kopfnicken bei jedem Atemzug.', zeigt: ['af'] },
    ] },
    { massnahme: 'af-zaehlen', varianten: [{ text: 'Atemfrequenz {af}/min (eine Minute gezählt).', zeigt: ['af'] }] },
    { massnahme: 'atemgeraeusche-hoeren', varianten: [{ text: 'Feines Knistern beidseits, leises Giemen beim Ausatmen.' }] },
    { massnahme: 'haut-beobachten', varianten: [{ text: 'Blass, um den Mund kein Blauschimmer, Hände etwas kühl.' }] },
    { massnahme: 'rekap-pruefen', varianten: [{ text: 'Rekapillarisierung {rekapSek} Sekunden am Brustbein.', zeigt: ['rekapSek'] }] },
    { massnahme: 'bewusstsein-avpu', varianten: [{ text: 'Wach, folgt dir mit den Augen, quengelt schwach (AVPU {avpu}).', zeigt: ['avpu'] }] },
    { massnahme: 'schleimhaut-pruefen', varianten: [{ text: 'Mundschleimhaut etwas trocken, Fontanelle im Niveau.' }] },
    { massnahme: 'ausscheidung-beobachten', varianten: [{ text: 'Die Windel seit 22 Uhr ist nur leicht nass, sie wiegt 18 g. Kein Stuhl, kein Erbrechen.' }] },
    { massnahme: 'news2-berechnen', varianten: [{ text: 'PEWS 4 Punkte (Atemfrequenz, Einziehungen, Sättigung). Ärztin informieren.' }] },
    { massnahme: 'oberkoerper-hoch', varianten: [{ text: 'Das Kopfteil steht leicht erhöht, Milas Kopf liegt gerade. Sie atmet etwas ruhiger.' }] },
    { massnahme: 'pulsoxy-anlegen', varianten: [{ text: 'Sensor am Fuß neu angelegt, Alarmgrenzen geprüft: SpO₂ {spo2} %, Puls {hf}/min.', zeigt: ['spo2', 'hf'] }] },
    { massnahme: 'puls-zaehlen', varianten: [{ text: 'Puls {hf}/min.', zeigt: ['hf'] }] },
    { massnahme: 'temperatur-ohr', varianten: [{ text: '{temp} °C.', zeigt: ['temp'] }] },
    { massnahme: 'gewicht-messen', varianten: [{ text: '6,08 kg nackt gewogen, gestern 6,2 kg.' }] },
    { massnahme: 'bilanz-fuehren', varianten: [{ text: 'Seit Aufnahme 150 ml getrunken, Bedarf bis jetzt etwa 200 ml. Zwei nasse Windeln.' }] },
    { massnahme: 'kurve-lesen', varianten: [{ text: 'RSV positiv. Trinkprotokoll: 150 ml seit Aufnahme, zwei nasse Windeln. Anordnung: Pulsoxymetrie kontinuierlich, Isolierung nach Hygieneplan, bei Trinkmenge unter 50 % Ärztin informieren.' }] },
    { massnahme: 'nase-absaugen', varianten: [{ text: 'Du saugst mit dem Nasensauger vorsichtig aus beiden Nasenlöchern zähes, gelbliches Sekret ab. Mila protestiert kurz, danach atmet sie leiser durch die Nase.' }] },
    { massnahme: 'nasentropfen-nacl', varianten: [{ text: 'Je ein Tropfen Kochsalzlösung in jedes Nasenloch, kurz gewartet.' }] },
    { massnahme: 'flasche-anbieten', varianten: [
      { wenn: ABGESAUGT, text: 'Mit freier Nase trinkt Mila 70 ml in kleinen Portionen mit Pausen. Sie schläft danach ein.' },
      { text: 'Mila saugt zwei-, dreimal, lässt dann los und ringt nach Luft. Nach 15 ml gibt sie auf.' },
    ] },
    { massnahme: 'isolation-einrichten', varianten: [{ text: 'Isolierschild an der Tür, Schutzkittel und Handschuhe liegen bereit, Händedesinfektion vor und nach jedem Kontakt. Die Mutter weiß Bescheid.' }] },
    { massnahme: 'paracetamol-supp', varianten: [{ text: 'Zäpfchen gegeben.' }] },
  ],

  gespraech: [
    { id: 'g-mutter-trinken', frage: 'Mutter fragen, wie viel Mila seit dem Abend getrunken hat und wie die Windeln waren', an: 'eltern', kompetenzbereiche: ['I', 'II'],
      antwort: [{ text: '„Um zehn hat sie vielleicht 60 Milliliter geschafft, dann ist sie eingeschlafen. Die letzte Windel war fast trocken.“', setzt: ['trinkmenge-erfragt'] }],
      fakten: ['22 Uhr etwa 60 ml', 'letzte Windel fast trocken'] },
    { id: 'g-mutter-sensor', frage: 'Mutter erklären, warum der Sensor dranbleiben muss, und mit ihr die Alarmgrenzen besprechen', an: 'eltern', kompetenzbereiche: ['II'],
      antwort: [{ text: '„Entschuldigung, das wusste ich nicht. Das Piepen hat mich so erschreckt. Wenn Sie mir sagen, wann es wichtig ist, lasse ich ihn dran.“', setzt: ['mutter-sensor'] }] },
    { id: 'g-mutter-erschoepft', frage: 'Mutter fragen, wie es ihr geht, und Entlastung anbieten', an: 'eltern', kompetenzbereiche: ['II'],
      antwort: [{ text: '„Ich habe seit zwei Nächten kaum geschlafen. Mein Mann kommt morgen früh und übernimmt.“ Du bietest an, beim nächsten Trinken zu helfen, damit sie sich hinlegen kann.', setzt: ['mutter-entlastet'] }] },
    { id: 'g-sara-zimmer', frage: 'Kollegin Sara fragen, ob ein Einzelzimmer frei geworden ist (Isolierung)', an: 'kollegin', kompetenzbereiche: ['I', 'III'],
      antwort: [{ text: '„Zimmer 4 ist seit heute Abend frei, aber das Zimmer hier ist ja ohne Mitpatient. Lass sie heute Nacht hier, Schild an die Tür, und wir sagen es der Frühschicht.“', setzt: ['zimmer-geklaert'] }] },
    { id: 'g-sara-bleiben', frage: 'Sara bitten, kurz bei Mila zu bleiben', an: 'kollegin', kompetenzbereiche: ['III'],
      antwort: [{ text: '„Mach ich.“' }] },
  ],

  sbar: [
    { id: 's-atemnot', teil: 'S', text: 'Mila Hoffmann, 4 Monate, Zimmer 3: zunehmende Atemnot und Trinkschwäche bei RSV-Bronchiolitis.', art: 'kern' },
    { id: 'b-rsv', teil: 'B', text: 'Aufnahme gestern Abend, RSV positiv, 6,2 kg, reif geboren, keine Vorerkrankungen.', art: 'kern' },
    { id: 'b-erstes-kind', teil: 'B', text: 'Es ist das erste Kind der Familie.', art: 'ablenker' },
    { id: 'a-atemnot', teil: 'A', text: 'Atmet schnell mit Einziehungen und Nasenflügeln, Nase mit Sekret verlegt.', art: 'kern', bekanntWenn: { eine: [{ getan: 'atmung-beobachten' }, { getan: 'ersteindruck-abcde' }] } },
    { id: 'a-trinkmenge', teil: 'A', text: 'Trinkt nur etwa die Hälfte der üblichen Menge, die letzte Windel war fast trocken.', art: 'kern', bekanntWenn: TRINKMENGE_BEKANNT },
    { id: 'a-trinkt-besser', teil: 'A', text: 'Nach dem Absaugen hat sie 70 ml in kleinen Portionen getrunken und schläft.', art: 'hilfreich',
      bekanntWenn: { alle: [ABGESAUGT, { getan: 'flasche-anbieten' }] } },
    { id: 'a-schlaeft', teil: 'A', text: 'Sie schläft viel, das ist bestimmt gut.', art: 'falsch' },
    { id: 'r-ansehen', teil: 'R', text: 'Bitte schauen Sie sie an. Braucht sie Sauerstoff oder eine Magensonde?', art: 'kern' },
  ],

  anordnungen: [
    { id: 'an-o2', massnahme: 'o2-geben', text: 'Sauerstoff über Nasenbrille, wenn SpO₂ unter 92 %.' },
    { id: 'an-xylo', massnahme: 'nasentropfen-xylo', text: 'Xylometazolin-Nasentropfen 0,1 %, je 2 Tropfen.',
      fehlerhaft: {
        warum: 'Xylometazolin 0,1 % ist für Erwachsene und Schulkinder. Bei Säuglingen kann es Herzrhythmus und Atmung stören (Bradykardie, Apnoe); unter einem Jahr gibt es höchstens die Säuglingsstärke nach strenger Abwägung. Bei Bronchiolitis reicht Kochsalzlösung.',
        korrektur: '„Stimmt, das war die falsche Stärke, und eigentlich brauchen wir es gar nicht. Nehmen Sie Kochsalz-Nasentropfen vor jedem Trinken.“',
        ersatz: 'an-nacl',
      } },
    { id: 'an-nacl', massnahme: 'nasentropfen-nacl', text: 'Kochsalz-Nasentropfen 0,9 %, je 1 Tropfen vor jeder Mahlzeit.' },
  ],

  arzt: {
    name: 'Diensthabende Ärztin Dr. Weiß',
    erreichbar: 'telefon',
    regeln: [
      { ...R_KOMMT, wenn: { gemeldet: ['a-atemnot', 'a-trinkmenge', 'wert:spo2'] } },
      { id: 'r-trink-frage', wenn: { gemeldet: ['a-atemnot', 'wert:spo2'] },
        antwort: '„Die Sättigung habe ich. Und das Trinken?“',
        rueckfrage: { text: '„Wie viel hat sie seit dem Abend getrunken, und wie sind die Windeln?“', erwartet: ['a-trinkmenge'], auftrag: 'af-trinkmenge' } },
      { id: 'r-spo2-frage', wenn: { gemeldet: ['a-atemnot'] },
        antwort: '„Angestrengte Atmung bei RSV, verstanden. Hängt sie am Monitor?“',
        rueckfrage: { text: '„Wie ist die Sättigung?“', erwartet: ['wert:spo2'], auftrag: 'af-spo2' } },
      { wenn: { gemeldet: ['a-schlaeft'] }, antwort: '„Säuglinge mit Bronchiolitis schlafen oft aus Erschöpfung. Wie atmet sie denn?“' },
    ],
    auftraege: [
      { id: 'af-spo2', text: 'Sättigung messen und der Ärztin melden', erledigt: { getan: 'pulsoxy-anlegen' }, meldung: ['wert:spo2'], meldenBinnenSek: 300,
        folge: [{ ...R_KOMMT, wenn: { gemeldet: ['a-trinkmenge'] } }, { id: 'r-trink-frage-2', wenn: { ab: 0 }, antwort: '„Danke. Und wie viel trinkt sie?“', rueckfrage: { text: '„Trinkmenge und Windeln?“', erwartet: ['a-trinkmenge'], auftrag: 'af-trinkmenge' } }] },
      { id: 'af-trinkmenge', text: 'Trinkmenge und Windeln erheben und der Ärztin melden', erledigt: TRINKMENGE_BEKANNT, meldung: ['a-trinkmenge'], meldenBinnenSek: 300,
        folge: [{ ...R_KOMMT, wenn: { ab: 0 } }] },
      { id: 'af-trinkversuch', text: 'Nach dem nächsten Trinkversuch Trinkmenge und Sättigung schreiben', meldenBinnenSek: 1500,
        erledigt: { alle: [{ getan: 'flasche-anbieten' }, { getan: 'pulsoxy-anlegen' }] },
        meldung: ['wert:spo2'],
        folge: [
          { wenn: { gemeldet: ['a-trinkt-besser'] }, antwort: '„Gut, dann keine Sonde heute Nacht. Weiter so mit Absaugen und kleinen Portionen. Ich komme gleich vorbei.“', setzt: ['trinkversuch-gemeldet'] },
          { wenn: { ab: 0 }, antwort: '„Danke. Wie viel hat sie getrunken? Unter der Hälfte legen wir eine Magensonde. Ich komme gleich.“', setzt: ['trinkversuch-gemeldet'] },
        ] },
    ],
  },

  ereignisse: [
    { id: 'e-sekretstau', art: 'komplikation', wann: { ab: 900 }, verhindertDurch: ABGESAUGT,
      text: 'Mila wird unruhig, die Nase ist komplett verlegt, sie zieht bei jedem Atemzug tief ein und wird um den Mund grau.',
      treiber: [{ art: 'bronchospasmus', staerke: 0.55 }],
      bild: { haltung: 'liegt', haut: 'zyanotisch', mimik: 'angst' },
      entscheidung: [
        { id: 'w-absaugen', text: 'Klingeln, Nase absaugen, Kopfteil hoch, Sättigung prüfen und die Ärztin sofort rufen', wertung: 'gut', warum: 'Säuglinge atmen vor allem durch die Nase. Freie Nase und Hilfe zuerst.' },
        { id: 'w-flasche', text: 'Flasche geben, damit sie sich beruhigt', wertung: 'gefaehrlich', warum: 'Mit verlegter Nase und Atemnot kann sie nicht trinken und atmen zugleich: Aspiration und Erschöpfung.' },
      ] },
    // Spätzeichen ohne Hilfe (Treiber atemerschoepfung): Erschöpfung mit Atempausen, dann Bradykardie über die Hypoxie.
    { id: 'e-erschoepfung', art: 'komplikation', wann: { wert: 'erschoepfung', vergleich: '>=', grenze: 0.5 },
      text: 'Mila wird plötzlich still und schlapp. Sie macht Atempausen von mehreren Sekunden, die Haut ist grau-marmoriert. Die Mutter ruft: „Sie atmet nicht richtig!“',
      bild: { haltung: 'liegt', haut: 'zyanotisch', mimik: 'schlaefrig' } },
    { id: 'e-alarm', art: 'geraet', wann: { alle: [{ getan: 'pulsoxy-anlegen' }, { wert: 'spo2', vergleich: '<', grenze: 92 }] },
      text: 'Der Monitor piept: Sättigung unter 92 %. Die Mutter schreckt hoch.' },
    { id: 'e-sara', art: 'team', wann: { getan: 'hilfe-holen' }, text: 'Kinderkrankenschwester Sara kommt: „Was ist los?“' },
    { id: 'e-aerztin-da', art: 'visite', wann: { alle: [{ flag: 'arzt-kommt' }, { eine: [{ flag: 'trinkversuch-gemeldet' }, { ab: 2400 }] }] },
      text: 'Dr. Weiß hört Mila ab: „Typischer Verlauf, Tag drei bis vier ist meist der schlimmste. Wir bleiben supportiv.“' },
  ],

  pa: {
    name: 'Praxisanleiterin Frau Becker',
    hilfen: [
      { wenn: { nicht: ABGESAUGT }, impuls: 'Wodurch atmet ein Säugling vor allem, und was heißt das fürs Trinken?', tipp: 'Säuglinge atmen durch die Nase. Vor dem Trinken das Sekret absaugen.' },
      { wenn: { nicht: { getan: 'pulsoxy-anlegen' } }, impuls: 'Was war laut Anordnung kontinuierlich vorgesehen?', tipp: 'Pulsoxymetrie. Den Sensor neu anlegen und die Alarmgrenzen prüfen.' },
      { wenn: { alle: [{ flag: 'arzt-kommt' }, { nicht: { flag: 'remonstriert:an-xylo' } }] }, impuls: 'Passt die Stärke der Nasentropfen zu einem vier Monate alten Kind?', tipp: '0,1 % ist für Erwachsene und Schulkinder. Bei Säuglingen frag nach, Kochsalz reicht meist.' },
      { wenn: { auftrag: 'af-trinkmenge', status: 'offen' }, impuls: 'Was wollte die Ärztin noch wissen?', tipp: 'Trinkmenge und Windeln: Mutter fragen oder ins Trinkprotokoll schauen.' },
      { wenn: { nicht: { getan: 'isolation-einrichten' } }, impuls: 'Wie schützt du die anderen Kinder auf Station?', tipp: 'Isolierung nach Hygieneplan: Schild, Kittel, Handschuhe, Händedesinfektion.' },
      { impuls: 'Wie geht es der Mutter?', tipp: 'Sie ist erschöpft. Frag nach und biete Entlastung an.' },
    ],
  },
  team: { kollegin: 'Kinderkrankenschwester Sara (Nachtdienst)', weitere: { eltern: 'Mutter Frau Hoffmann' } },

  bewertung: {
    pflicht: [
      { id: 'p-atmung', text: 'Atmung eingeschätzt (Frequenz, Einziehungen, Nasenflügeln)', gewicht: 2, kompetenzbereiche: ['I'],
        erfuellt: { eine: [{ getan: 'atmung-beobachten' }, { getan: 'ersteindruck-abcde' }] }, warum: 'Einziehungen, Nasenflügeln und Kopfnicken zeigen beim Säugling Atemnot früh an.' },
      { id: 'p-spo2', text: 'Pulsoxymeter wieder angelegt', gewicht: 3, kompetenzbereiche: ['I', 'III'], erfuellt: { getan: 'pulsoxy-anlegen', bis: 600 },
        warum: 'Bei RSV können junge Säuglinge plötzlich Atempausen und Sättigungsabfälle haben. Die Überwachung war angeordnet.' },
      { id: 'p-absaugen', text: 'Nase vor dem Trinken abgesaugt', gewicht: 3, kompetenzbereiche: ['I'], erfuellt: { getan: 'nase-absaugen', bis: 900 },
        warum: 'Säuglinge atmen durch die Nase. Mit verlegter Nase können sie nicht trinken und erschöpfen sich.' },
      { id: 'p-lagerung', text: 'Kopfteil leicht hoch gelagert', gewicht: 1, kompetenzbereiche: ['I'], erfuellt: { getan: 'oberkoerper-hoch' },
        warum: 'Erleichtert die Atmung und das Abfließen von Sekret.' },
      { id: 'p-trinkmenge', text: 'Trinkmenge und Windeln erhoben', gewicht: 2, kompetenzbereiche: ['I'], erfuellt: TRINKMENGE_BEKANNT,
        warum: 'Weniger als die Hälfte der üblichen Trinkmenge oder trockene Windeln sind Zeichen für eine drohende Austrocknung.' },
      { id: 'p-arzt', text: 'Ärztin mit Atmung, Sättigung und Trinkmenge informiert', gewicht: 3, kompetenzbereiche: ['II', 'III'], erfuellt: { flag: 'arzt-kommt' },
        warum: 'Sättigung und Trinkmenge entscheiden über Sauerstoff und Magensonde.' },
      { id: 'p-remonstration', text: 'Nasentropfen in Erwachsenenstärke hinterfragt', gewicht: 3, kompetenzbereiche: ['III', 'IV'], erfuellt: { flag: 'remonstriert:an-xylo' },
        warum: 'Arzneimittel und Stärke müssen zum Alter passen (R-Regeln). Du trägst die Durchführungsverantwortung.' },
      { id: 'p-isolation', text: 'Isolierung nach Hygieneplan umgesetzt', gewicht: 2, kompetenzbereiche: ['I', 'III'], erfuellt: { getan: 'isolation-einrichten' },
        warum: 'RSV wird über Hände, Flächen und Tröpfchen übertragen und ist für andere Säuglinge gefährlich.' },
      { id: 'p-rueckauftrag', text: 'Trinkversuch und Sättigung der Ärztin geschrieben', gewicht: 2, kompetenzbereiche: ['II', 'III'],
        erfuellt: { auftrag: 'af-trinkversuch', status: 'gemeldet' }, warum: 'Danach entscheidet die Ärztin über eine Magensonde (Closed Loop).' },
      { id: 'p-mutter', text: 'Mutter einbezogen (Sensor, Entlastung)', gewicht: 1, kompetenzbereiche: ['II'],
        erfuellt: { eine: [{ flag: 'mutter-sensor' }, { flag: 'mutter-entlastet' }] }, warum: 'Eltern brauchen Erklärung und Entlastung, damit sie gut mitwirken können.' },
      { id: 'p-doku', text: 'Atmung und Trinkmenge dokumentiert', gewicht: 2, kompetenzbereiche: ['I', 'IV'],
        erfuellt: { alle: [{ dokumentiert: 'a-atemnot' }, { dokumentiert: 'a-trinkmenge' }] }, warum: 'Trinkprotokoll und Atembeobachtung zeigen den Verlauf über die Nacht.' },
    ],
    fehler: [
      { id: 'f-xylo', text: 'Xylometazolin 0,1 % beim Säugling gegeben', schwere: 'schwer', kompetenzbereiche: ['I', 'III', 'IV'],
        wenn: { getan: 'nasentropfen-xylo' },
        folge: { text: 'Mila wird blass, ihr Puls wird langsamer, sie macht eine kurze Atempause.', wirkung: [{ groesse: 'atemantrieb', delta: -0.3, beginnSek: 300, spitzeSek: 900, dauerSek: 2400 }] },
        warum: 'Erwachsenenstärke kann bei Säuglingen Bradykardie und Apnoen auslösen.' },
      { id: 'f-trinken-verlegt', text: 'Flasche mit verlegter Nase gegeben', schwere: 'mittel', kompetenzbereiche: ['I'],
        wenn: { eine: [{ alle: [{ getan: 'flasche-anbieten' }, { nicht: ABGESAUGT }] }, { getan: 'wahl:e-sekretstau:w-flasche' }] },
        warum: 'Mit verlegter Nase kann ein Säugling nicht trinken und atmen zugleich: Erschöpfung und Aspirationsgefahr.' },
    ],
    ende: [
      { wenn: { alle: [{ flag: 'arzt-kommt' }, { flag: 'trinkversuch-gemeldet' }, ABGESAUGT, { getan: 'pflegebericht' }] },
        text: 'Mila schläft mit freier Nase und laufendem Pulsoxymeter. Sie hat getrunken, die Ärztin ist zufrieden. Die Mutter hat sich hingelegt.', ausgang: 'stabil' },
      { wenn: { ab: 2700 }, text: 'Mila ist erschöpft und braucht eine Atemunterstützung auf der Intensivstation.', ausgang: 'verschlechtert' },
    ],
  },

  pflegebedarf: {
    probleme: [
      { id: 'pb-atmung', text: 'Beeinträchtigte Atmung durch Sekret und Schleimhautschwellung', richtig: true, prioritaet: 1, warum: 'Einziehungen, Nasenflügeln und niedrige Sättigung.' },
      { id: 'pb-fluessigkeit', text: 'Gefahr eines Flüssigkeitsdefizits durch Trinkschwäche', richtig: true, prioritaet: 1, warum: 'Nur die Hälfte der Trinkmenge, kaum nasse Windeln.' },
      { id: 'pb-infektion', text: 'Gefahr der Übertragung von RSV auf andere', richtig: true, prioritaet: 2, warum: 'RSV ist sehr ansteckend, besonders für junge Säuglinge.' },
      { id: 'pb-mutter', text: 'Erschöpfung der Mutter', richtig: true, prioritaet: 3, warum: 'Zwei Nächte kaum Schlaf; sie braucht Entlastung.' },
      { id: 'pb-schlaf', text: 'Schlafstörung des Säuglings', richtig: false, warum: 'Viel Schlaf ist hier eher Erschöpfung; das Kernproblem ist die Atmung.' },
    ],
    ziele: [
      { id: 'z-atmung', text: 'Mila atmet mit freier Nase, SpO₂ ab 92 %.', passtZu: ['pb-atmung'], richtig: true },
      { id: 'z-trinken', text: 'Mila trinkt mindestens 75 % der üblichen Menge, mindestens 4 nasse Windeln am Tag.', passtZu: ['pb-fluessigkeit'], richtig: true },
      { id: 'z-hygiene', text: 'Alle halten die Isolierung und die Händedesinfektion ein.', passtZu: ['pb-infektion'], richtig: true },
      { id: 'z-xylo', text: 'Die Nase ist mit abschwellenden Tropfen dauerhaft frei.', passtZu: ['pb-atmung'], richtig: false },
    ],
  },

  leitfaden: [
    { titel: 'Bronchiolitis erkennen', text: 'Meist RSV, Säuglinge bis zwölf Monate, Gipfel um Tag drei bis fünf. Zeichen: Schnupfen, Husten, schnelle Atmung, Einziehungen, Nasenflügeln, Knistern und Giemen, Trinkschwäche. Junge Säuglinge können Atempausen haben.', quellen: ['nice-ng9'] },
    { titel: 'Pflege ist die Therapie', text: 'Nase vor dem Trinken absaugen (Kochsalztropfen), kleine häufige Mahlzeiten, Kopfteil leicht hoch, Sauerstoff nach Anordnung bei SpO₂ unter 92 %, Trinkprotokoll und Windeln. Bronchodilatatoren, Kortison und Antibiotika helfen bei Bronchiolitis nicht routinemäßig.', quellen: ['nice-ng9'] },
    { titel: 'Wann eskalieren?', text: 'Trinkmenge unter 50–75 %, trockene Windeln, Atempausen, SpO₂ dauerhaft unter 92 %, Erschöpfung oder schnell steigende Atemfrequenz: Ärztin sofort informieren.', quellen: ['nice-ng9'] },
    { titel: 'Arzneimittel beim Säugling', text: 'Abschwellende Nasentropfen in Erwachsenenstärke sind für Säuglinge gefährlich (Bradykardie, Apnoe). Stärke und Dosis immer zum Alter und Gewicht prüfen und im Zweifel nachfragen.', quellen: ['fi-xylometazolin'] },
    { titel: 'Infektionsschutz', text: 'Isolierung oder Kohortierung, Schutzkittel und Handschuhe bei Kontakt, Händedesinfektion vor und nach jedem Kontakt, Flächen desinfizieren. Seit 2024 empfiehlt die STIKO eine RSV-Prophylaxe für alle Säuglinge in ihrer ersten Saison.', quellen: ['krinko-rsv', 'stiko-rsv'] },
  ],

  pruefwege: {
    muster: [
      { art: 'massnahme', id: 'vorstellen-einverstaendnis' },
      { art: 'massnahme', id: 'isolation-einrichten' },
      { art: 'massnahme', id: 'ersteindruck-abcde' },
      { art: 'massnahme', id: 'pulsoxy-anlegen' },
      { art: 'frage', id: 'g-mutter-sensor' },
      { art: 'massnahme', id: 'nase-absaugen' },
      { art: 'massnahme', id: 'oberkoerper-hoch' },
      { art: 'massnahme', id: 'atmung-beobachten' },
      { art: 'frage', id: 'g-mutter-trinken' },
      { art: 'massnahme', id: 'kurve-lesen' },
      { art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: ['s-atemnot', 'b-rsv', 'a-atemnot', 'a-trinkmenge', 'wert:spo2', 'r-ansehen'] },
      { art: 'rueckmelden', anordnung: 'an-o2', rueckgelesen: true },
      { art: 'remonstrieren', anordnung: 'an-xylo', grund: '0,1 % ist Erwachsenenstärke, für einen Säugling mit 4 Monaten nicht geeignet.' },
      { art: 'rueckmelden', anordnung: 'an-nacl', rueckgelesen: true },
      { art: 'auflegen', an: 'aerztin' },
      { art: 'frage', id: 'g-sara-zimmer' },
      { art: 'massnahme', id: 'nasentropfen-nacl' },
      { art: 'massnahme', id: 'nase-absaugen' },
      { art: 'massnahme', id: 'flasche-anbieten' },
      { art: 'massnahme', id: 'pulsoxy-anlegen' },
      { art: 'nachricht', an: 'aerztin', kanal: 'messenger', bausteine: ['wert:spo2', 'a-trinkt-besser'] },
      { art: 'frage', id: 'g-mutter-erschoepft' },
      { art: 'dokumentieren', bausteine: ['a-atemnot', 'a-trinkmenge', 'a-trinkt-besser', 'wert:spo2', 'anordnung:an-nacl'] },
      { art: 'warten', sek: 120 },
      { art: 'abschluss', probleme: ['pb-atmung', 'pb-fluessigkeit', 'pb-infektion', 'pb-mutter'], ziele: ['z-atmung', 'z-trinken', 'z-hygiene'],
        sbar: ['s-atemnot', 'b-rsv', 'a-atemnot', 'a-trinkmenge', 'a-trinkt-besser'] },
    ],
    unterlassung: { bisSek: 2400, erwartet: { alle: [{ wert: 'spo2', vergleich: '<', grenze: 80 }, { wert: 'hf', vergleich: '<', grenze: 120 }] } },
    grenze: { rolle: 2, events: [{ art: 'massnahme', id: 'o2-geben' }], erwartet: 'pa-eingriff' },
  },
};
