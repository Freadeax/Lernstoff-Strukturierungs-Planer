// Fallwelle P19 (CE 10) · Pädiatrie: Gastroenteritis mit beginnender Austrocknung beim Kleinkind
// Entwurf, fachlich UNGEPRÜFT. Inhalte fiktiv/didaktisch. Migriert und neu geschrieben aus Altfall „kind“ (scenarios.json).

import { KATALOG } from '../katalog';
import type { Bedingung, FallV2, MassnahmeDefinition } from '../typen';

const aus = (id: string, mehr: Partial<MassnahmeDefinition>): MassnahmeDefinition => ({ ...KATALOG[id]!, ...mehr });

const ZEICHEN_ERHOBEN: Bedingung = { eine: [{ getan: 'schleimhaut-pruefen' }, { getan: 'hautturgor-pruefen' }, { getan: 'rekap-pruefen' }] };
/** Die Kita-Leiterin ruft an (Ereignis e-kita); erst dann gibt es das Gespräch mit ihr. */
const KITA_RUFT: Bedingung = { ab: 1000 };

const KOMMT = '„Danke, das klingt nach einer Gastroenteritis mit leichter bis mittlerer Austrocknung. Wir versuchen es zuerst über den Mund: orale Rehydratationslösung, 5 ml alle zwei bis fünf Minuten mit Löffel oder Spritze. Ondansetron 4 mg als Schmelztablette gegen das Erbrechen. Isolieren, Stuhl und Erbrechen aufschreiben. In einer halben Stunde schreiben Sie mir bitte, ob er die Lösung behält, und messen den Zucker noch einmal.“';
const R_KOMMT = { id: 'r-kommt', antwort: KOMMT, anordnungen: ['an-orl', 'an-ondansetron-4'], kommtNachSek: 1500, setzt: ['arzt-kommt'], auftraege: ['af-orl'] };

export const PAED_GASTROENTERITIS_KLEINKIND: FallV2 = {
  schema: 2,
  id: 'paed-gastroenteritis-kleinkind',
  version: '0.1.0',
  spur: 'A',
  setting: 'paediatrie',
  altersgruppe: 'kleinkind',
  titel: '„Er will gar nichts mehr trinken“',
  kurz: 'Kinderstation: Dreijähriger mit Brechdurchfall liegt still auf dem Schoß der Mutter und schiebt den Becher weg.',
  rahmen: 'Du bist im Frühdienst auf der Kinderstation und nimmst mit deiner Praxisanleitung Emil und seine Mutter auf.',
  lernziele: [
    'Zeichen einer Austrocknung beim Kleinkind erkennen (Schleimhäute, Hautspannung, Rekapillarisierung, Gewicht, Windeln, Verhalten).',
    'An eine Unterzuckerung bei Gastroenteritis denken und den Blutzucker messen.',
    'Orale Rehydratation in kleinen Mengen anleiten und die Ausscheidung dokumentieren.',
    'Eine Kinderdosis nach Gewicht nachrechnen und eine zu hohe Anordnung hinterfragen.',
    'Hygiene bei Brechdurchfall umsetzen und keine Auskunft an Unbefugte geben.',
  ],
  lehrplan: {
    ce: ['ce.10', 'ce.05'], abschnitt: ['ad12', 'ad3'],
    themen: ['thema.kl.paediatrie', 'thema.kl.verdauung', 'thema.pro.dehydratation', 'thema.ph.hygiene', 'thema.re.schweigepflicht'],
    kompetenzen: ['I.1.d', 'I.5.a', 'II.1.b', 'III.2.a', 'IV.1.b'],
  },
  geeignet: { rollen: [1, 2, 3], stufen: [1, 2, 3] },
  dauerMin: [12, 18],
  freigabe: {
    status: 'entwurf',
    pruefpunkte: [
      'Einschätzung der Dehydratation (leicht/mittel/schwer) und orale Rehydratation (ORL, kleine Mengen) gegen S2k-Leitlinie GPGE und ESPGHAN 2014 prüfen',
      'Ondansetron 0,15 mg/kg (14 kg ≈ 2 mg, Schmelztablette) und Remonstrationspunkt 4 mg prüfen',
      'Ketotische Hypoglykämie bei Kleinkindern mit Gastroenteritis: BZ-Grenze und Vorgehen (ORL enthält Glukose) prüfen',
      'Isolierung bei Verdacht auf Noro-/Rotavirus nach KRINKO, viruzides Händedesinfektionsmittel',
      'Meldepflicht nach IfSG liegt bei Ärztin/Labor; keine Auskunft an Kita – Formulierung für die Pflege prüfen',
      'Gewichtsverlust 14,0 → 13,2 kg (etwa 6 %) als mittlere Dehydratation plausibel?',
    ],
  },
  quellen: [
    { id: 'gpge-gastro', titel: 'S2k-Leitlinie Akute infektiöse Gastroenteritis im Säuglings-, Kindes- und Jugendalter (GPGE, AWMF 068-003), Fassung 2024' },
    { id: 'espghan-2014', titel: 'ESPGHAN/ESPID: Evidence-based Guidelines for the Management of Acute Gastroenteritis in Children in Europe (2014)' },
    { id: 'krinko-noro', titel: 'RKI-Ratgeber Norovirus-Gastroenteritis; KRINKO-Empfehlung Infektionsprävention bei übertragbaren Krankheiten' },
    { id: 'fi-ondansetron', titel: 'Fachinformation Ondansetron Schmelztabletten (Kinder: Dosierung nach Körpergewicht)' },
    { id: 'ifsg', titel: 'Infektionsschutzgesetz (IfSG) §§ 6–9 Meldepflicht, § 34 Gemeinschaftseinrichtungen' },
  ],

  person: {
    name: 'Emil Kaya',
    alter: { jahre: 3 },
    geschlecht: 'm',
    biografie: ['geht in die Kita „Sonnenblume“, dort sind mehrere Kinder krank', 'Mutter Frau Kaya ist Erzieherin, spricht gut Deutsch', 'Lieblingskuscheltier: ein Dino'],
    diagnosenBekannt: ['Brechdurchfall seit gestern Abend', 'sonst gesund'],
    medikamentePlan: ['keine Dauermedikation'],
    allergien: ['keine bekannt'],
    gewichtKg: 14,
  },
  medien: { raum: '20_paediatrie_kleinkind' },
  uebernahme: 'Emil, 3 Jahre, kommt gerade aus der Notaufnahme: seit gestern Abend sechsmal erbrochen und viermal wässriger Durchfall. Er trinkt nichts mehr. Beim Kinderarzt wog er vor zwei Wochen 14 Kilo. Zugang hat er noch keinen.',
  startUhrzeit: '09:20',

  start: {
    // Austrocknung schreitet fort (Erbrechen, Durchfall); ketotische Hypoglykämie: BZ sinkt langsam.
    grund: { hydratation: 0.86, volumen: 0.9, blutzucker: 72, temperatur: 38.1, uebelkeit: 0.6, angst: 0.25, schmerz: 3, vigilanz: 0.85 },
    treiber: [{ art: 'exsikkose_progressiv', verlustProStunde: 0.12 }, { art: 'hypoglykaemie', abfallProStunde: 30 }],
    bild: { haltung: 'liegt', haut: 'blass', mimik: 'schlaefrig' },
    sichtbar: [],
  },

  massnahmen: [
    // Gespräch
    'vorstellen-einverstaendnis', 'eltern-einbeziehen', 'beruhigen-zusprechen', 'trinkmenge-erfragen',
    // Beobachten
    'ersteindruck-abcde', 'schleimhaut-pruefen', 'hautturgor-pruefen', 'rekap-pruefen', 'bewusstsein-avpu', 'ausscheidung-beobachten', 'schmerz-kinderskala',
    // Akut
    'hilfe-holen', 'stabile-seitenlage', 'glukose-oral',
    // Messen
    'gewicht-messen', 'bz-messen', 'puls-zaehlen', 'temperatur-ohr', 'af-zaehlen', 'bilanz-fuehren', 'kurve-lesen',
    // Versorgen
    'isolation-einrichten', 'orale-rehydratation', 'cola-anbieten', 'ondansetron-geben', 'mundpflege',
    // Melden
    'pflegefachperson-informieren', 'pflegebericht',
  ],
  massnahmenZusatz: [
    aus('orale-rehydratation', {
      anordnungspflichtig: true,
      treiber: [{ art: 'kohlenhydrate', gramm: 4, schnell: true }],   // ORL enthält etwas Glukose
    }),
    aus('trinken-anbieten', { id: 'cola-anbieten', name: 'Cola und Salzstangen anbieten (Hausmittel)', wirkung: [], setzt: [] }),
    aus('bedarfsmedikation-oral', {
      id: 'ondansetron-geben', name: 'Ondansetron als Schmelztablette geben (nach Anordnung)',
      treiber: [{ art: 'wirkstoff', id: 'ondansetron', dosisMg: 2, weg: 'oral' }],   // G1, 14 kg: 2 mg nach Remonstration
    }),
  ],

  akte: {
    aufnahmegrund: 'Aufnahme heute 09:00 über die Kindernotaufnahme: Erbrechen seit gestern 20 Uhr (sechsmal), wässrige Durchfälle (viermal), trinkt seit dem Morgen nichts. Mehrere Kita-Kinder mit Brechdurchfall.',
    anamnese: [
      'Termingeboren, bisher gesund, geimpft nach STIKO (inkl. Rotavirus).',
      'Letzte nasse Windel heute 05:00 (trägt nachts Windel).',
      'Kein Blut im Stuhl, keine Bauchschmerzen außer Krämpfen vor dem Durchfall.',
      'Gewicht bei der U7a vor zwei Wochen 14,0 kg.',
    ],
    diagnosen: [{ text: 'Akute Gastroenteritis, vermutlich viral', icd: 'A08.4', seit: 'gestern' }, { text: 'Dehydratation', icd: 'E86', seit: 'heute' }],
    medikation: [
      { id: 'mp-paracetamol', wirkstoff: 'Paracetamol', staerke: '250 mg', form: 'Supp.',
        bedarf: { indikation: 'Fieber über 38,5 °C oder Schmerzen', einzeldosis: '1 Supp. (250 mg)', maxProTag: '3 Supp. (750 mg)', abstandH: 6 },
        hinweis: 'Für 14 kg nachgerechnet (etwa 15 mg/kg je Gabe, höchstens 60 mg/kg am Tag). Bei Durchfall wirkt ein Zäpfchen unsicher.' },
    ],
    vorwerte: [
      { zeit: 'U7a vor 2 Wochen', vorH: 336, werte: { gewicht: 14 }, kuerzel: 'Praxis' },
      { zeit: 'Notaufnahme 08:30', vorH: 0.8, werte: { hf: 138, af: 28, temp: 38.2 }, kuerzel: 'ZNA' },
    ],
    pflegebericht: [
      { zeit: '08:40', wer: 'ZNA', text: 'Kommt mit Mutter, liegt schlapp auf ihrem Arm, weint ohne Tränen. Einmal erbrochen in der Notaufnahme. Stuhlprobe asserviert.' },
    ],
    aerztlicheAnordnungen: [
      { zeit: '08:50', wer: 'Dr. Lenz (ZNA)', text: 'Stationäre Aufnahme. Stuhl auf Noro-/Rota-/Adenoviren. Weiteres durch Stationsärztin.' },
    ],
    assessments: [{ name: 'Clinical Dehydration Scale (Notaufnahme)', wert: '4 Punkte', datum: 'heute 08:40', hinweis: 'Mittlere Dehydratation (5–8 Punkte = schwer).' }],
    labor: [{ name: 'Stuhl Noro/Rota/Adeno', wert: 'ausstehend', datum: 'heute 08:45' }],
    pflegeplanung: [],
    rechtliches: ['Sorgeberechtigt: beide Eltern. Mutter, Frau Kaya, als Begleitperson aufgenommen.', 'Keine Einwilligung zur Auskunft an Dritte (z. B. Kita).'],
  },

  befunde: [
    { massnahme: 'vorstellen-einverstaendnis', varianten: [{ text: 'Du stellst dich vor und gehst in die Hocke. Emil liegt still auf dem Schoß der Mutter und schaut dich nur kurz an.' }] },
    { massnahme: 'ersteindruck-abcde', varianten: [
      { text: 'A frei. B: atmet etwas schnell, sonst unauffällig. C: blass, Hände kühl. D: schläfrig, aber weckbar, weint schwach. E: warm, Windel trocken.' },
    ] },
    { massnahme: 'schleimhaut-pruefen', varianten: [{ text: 'Lippen rissig, Zunge trocken, er weint ohne Tränen.' }] },
    { massnahme: 'hautturgor-pruefen', varianten: [{ text: 'Eine Hautfalte am Bauch bleibt kurz stehen, bevor sie verstreicht. Die Augen liegen etwas tief.' }] },
    { massnahme: 'rekap-pruefen', varianten: [{ text: 'Rekapillarisierung {rekapSek} Sekunden.', zeigt: ['rekapSek'] }] },
    { massnahme: 'bewusstsein-avpu', varianten: [
      { wenn: { wert: 'blutzucker', vergleich: '<', grenze: 55 }, text: 'Er ist kaum zu wecken, reagiert nur auf Berührung (AVPU {avpu}).', zeigt: ['avpu'] },
      { text: 'Schläfrig, öffnet die Augen auf Ansprache, quengelt (AVPU {avpu}).', zeigt: ['avpu'] },
    ] },
    { massnahme: 'ausscheidung-beobachten', varianten: [{ text: 'In der Windel wässriger, gelblicher Stuhl ohne Blut, kein Urin. Die Mutter zeigt dir eine Nierenschale mit wenig Erbrochenem.' }] },
    { massnahme: 'schmerz-kinderskala', varianten: [{ text: 'KUSS 3: zieht ab und zu die Beine an, sonst ruhig.' }] },
    { massnahme: 'gewicht-messen', varianten: [{ text: '13,2 kg. Vor zwei Wochen 14,0 kg: etwa 6 % weniger.' }] },
    { massnahme: 'bz-messen', varianten: [
      { wenn: { wert: 'blutzucker', vergleich: '<', grenze: 60 }, text: 'BZ {bz} mg/dl, niedrig.', zeigt: ['bz'] },
      { text: 'BZ {bz} mg/dl, niedrig-normal.', zeigt: ['bz'] },
    ] },
    { massnahme: 'puls-zaehlen', varianten: [{ text: 'Puls {hf}/min, eher schwach tastbar.', zeigt: ['hf'] }] },
    { massnahme: 'temperatur-ohr', varianten: [{ text: '{temp} °C.', zeigt: ['temp'] }] },
    { massnahme: 'af-zaehlen', varianten: [{ text: 'Atemfrequenz {af}/min.', zeigt: ['af'] }] },
    { massnahme: 'bilanz-fuehren', varianten: [{ text: 'Ein- und Ausfuhrprotokoll angelegt: ORL in ml, Erbrechen und Stuhl gewogen bzw. geschätzt, Windeln gewogen.' }] },
    { massnahme: 'kurve-lesen', varianten: [{ text: 'Gewicht U7a 14,0 kg. Clinical Dehydration Scale 4 Punkte. Stuhlprobe läuft. Rechtliches: keine Einwilligung zur Auskunft an Dritte.' }] },
    { massnahme: 'isolation-einrichten', varianten: [{ text: 'Einzelzimmer mit eigener Toilette, Schild an der Tür, Schutzkittel und Handschuhe, viruzides Händedesinfektionsmittel. Du erklärst der Mutter, warum sie sich nach jedem Wickeln die Hände desinfiziert.' }] },
    { massnahme: 'orale-rehydratation', varianten: [
      { wenn: { getan: 'ondansetron-geben' }, text: 'Mit dem Löffel alle zwei bis drei Minuten 5 ml. Emil behält alles, nach einer Viertelstunde greift er selbst nach dem Becher.' },
      { text: 'Die Mutter gibt mit der Spritze alle zwei bis drei Minuten 5 ml in die Wangentasche. Emil schluckt, einmal würgt er, behält aber das meiste.' },
    ] },
    { massnahme: 'cola-anbieten', varianten: [{ text: 'Emil trinkt drei große Schlucke Cola und erbricht kurz darauf im Schwall.' }] },
    { massnahme: 'ondansetron-geben', varianten: [{ text: 'Die Schmelztablette zergeht auf der Zunge. Uhrzeit und Dosis dokumentiert.' }] },
    { massnahme: 'mundpflege', varianten: [{ text: 'Du befeuchtest die Lippen mit Pflegestift, die Mutter gibt ihm einen feuchten Tupfer zum Lutschen.' }] },
  ],

  gespraech: [
    { id: 'g-mutter-verlauf', frage: 'Mutter fragen, seit wann, wie oft und wann die letzte nasse Windel war', an: 'eltern', kompetenzbereiche: ['I', 'II'],
      antwort: [{ text: '„Seit gestern Abend um acht. Sechsmal gebrochen, viermal Durchfall, ganz wässrig. Die letzte nasse Windel war heute Nacht um fünf.“', setzt: ['verlauf-erfragt'] }],
      fakten: ['seit 20 Uhr gestern', '6× Erbrechen, 4× Durchfall', 'letzte nasse Windel 05:00'] },
    { id: 'g-mutter-orl', frage: 'Mutter anleiten, die Lösung in kleinen Mengen mit Spritze oder Löffel zu geben', an: 'eltern', kompetenzbereiche: ['II'],
      antwort: [{ text: '„Nur fünf Milliliter? Das dauert ja ewig. Aber gut, wenn er sonst wieder bricht … Ich mache das.“', setzt: ['mutter-angeleitet'] }] },
    { id: 'g-mutter-cola', frage: 'Mutter fragen, was sie zu Hause gegen den Durchfall gegeben hat', an: 'eltern', kompetenzbereiche: ['I', 'II'],
      antwort: [{ text: '„Cola und Salzstangen, das hat meine Mutter immer gemacht. Ist das nicht gut?“' }] },
    { id: 'g-kita-lage', frage: 'Kita-Leiterin am Telefon: sagen, was Emil hat', an: 'angehoerige', kanal: 'telefon', kompetenzbereiche: ['II', 'IV'],
      nurWenn: KITA_RUFT,
      schweigepflicht: { erlaubtWenn: { flag: 'nie' },
        fehlerText: 'Du hast der Kita Auskunft über Emil gegeben. Die Kita ist kein Angehöriger und hat keine Einwilligung der Eltern. Meldungen nach dem Infektionsschutzgesetz macht die Ärztin oder das Labor ans Gesundheitsamt, die Eltern informieren die Kita.' },
      antwort: [{ text: '„Danke, dann weiß ich Bescheid.“' }] },
    { id: 'g-kita-verweis', frage: 'Kita-Leiterin am Telefon: freundlich keine Auskunft, an die Eltern verweisen', an: 'angehoerige', kanal: 'telefon', kompetenzbereiche: ['II', 'IV'],
      nurWenn: KITA_RUFT,
      antwort: [{ text: '„Verstehe ich. Dann rufe ich Frau Kaya später selbst an. Wir haben eben mehrere kranke Kinder und müssen ans Gesundheitsamt melden.“', setzt: ['kita-verwiesen'] }] },
    { id: 'g-jonas-zimmer', frage: 'Kollegen Jonas bitten, das Einzelzimmer mit Toilette zu richten', an: 'kollegin', kompetenzbereiche: ['III'],
      antwort: [{ text: '„Zimmer 2 ist frei, ich mache das Schild dran und stelle Kittel und Desinfektionsmittel hin.“', setzt: ['zimmer-gerichtet'] }] },
  ],

  sbar: [
    { id: 's-austrocknung', teil: 'S', text: 'Emil Kaya, 3 Jahre, Zimmer 2: Brechdurchfall mit Zeichen der Austrocknung, trinkt nichts.', art: 'kern' },
    { id: 'b-verlauf', teil: 'B', text: 'Seit gestern Abend sechsmal Erbrechen, viermal wässriger Durchfall, letzte nasse Windel heute 5 Uhr, sonst gesund.', art: 'kern' },
    { id: 'b-kita', teil: 'B', text: 'In seiner Kita sind mehrere Kinder krank.', art: 'hilfreich' },
    { id: 'b-dino', teil: 'B', text: 'Er hat sein Kuscheltier dabei.', art: 'ablenker' },
    { id: 'a-exsikkose', teil: 'A', text: 'Schleimhäute trocken, weint ohne Tränen, Hautfalte verstreicht verzögert, schläfrig, Gewicht etwa 6 % unter dem Ausgangsgewicht.', art: 'kern',
      bekanntWenn: { alle: [ZEICHEN_ERHOBEN, { getan: 'gewicht-messen' }] } },
    { id: 'a-orl-vertragen', teil: 'A', text: 'Nimmt die Lösung löffelweise und behält sie, kein Erbrechen seitdem.', art: 'hilfreich',
      bekanntWenn: { alle: [{ getan: 'orale-rehydratation' }, { getan: 'ondansetron-geben' }] } },
    { id: 'a-nur-muede', teil: 'A', text: 'Er ist halt müde von der Nacht.', art: 'falsch' },
    { id: 'r-plan', teil: 'R', text: 'Bitte schauen Sie ihn an. Sollen wir es mit Trinklösung versuchen oder braucht er eine Infusion?', art: 'kern' },
  ],

  anordnungen: [
    { id: 'an-orl', massnahme: 'orale-rehydratation', text: 'Orale Rehydratationslösung 5 ml alle 2–5 Minuten, Ziel etwa 50 ml/kg in 4 Stunden.' },
    { id: 'an-ondansetron-4', massnahme: 'ondansetron-geben', text: 'Ondansetron 4 mg als Schmelztablette.',
      fehlerhaft: {
        warum: 'Für Kinder sind etwa 0,15 mg/kg üblich, bei 14 kg also rund 2 mg. 4 mg wären fast das Doppelte (Herzrhythmus, QT-Zeit). Dosis immer nach Gewicht nachrechnen.',
        korrektur: '„Richtig, bei 14 Kilo nehmen wir 2 mg. Danke fürs Nachrechnen.“',
        ersatz: 'an-ondansetron-2',
      } },
    { id: 'an-ondansetron-2', massnahme: 'ondansetron-geben', text: 'Ondansetron 2 mg als Schmelztablette, einmalig.' },
  ],

  arzt: {
    name: 'Stationsärztin Dr. Aydın',
    erreichbar: 'telefon',
    regeln: [
      { ...R_KOMMT, wenn: { gemeldet: ['a-exsikkose', 'wert:bz'] } },
      { id: 'r-bz-frage', wenn: { gemeldet: ['a-exsikkose'] },
        antwort: '„Klingt nach einer mittleren Austrocknung. Kleine Kinder unterzuckern dabei leicht.“',
        rueckfrage: { text: '„Wie hoch ist der Blutzucker?“', erwartet: ['wert:bz'], auftrag: 'af-bz' } },
      { wenn: { gemeldet: ['a-nur-muede'] }, antwort: '„Schläfrigkeit bei Brechdurchfall kann Austrocknung oder Unterzucker sein. Schauen Sie bitte genau hin und melden Sie sich mit den Zeichen.“' },
    ],
    auftraege: [
      { id: 'af-bz', text: 'Blutzucker messen und der Ärztin melden', erledigt: { getan: 'bz-messen' }, meldung: ['wert:bz'], meldenBinnenSek: 300,
        folge: [{ ...R_KOMMT, wenn: { gemeldet: ['a-exsikkose'] } }] },
      { id: 'af-orl', text: 'Nach etwa einer halben Stunde melden, ob er die Lösung behält, und den Blutzucker nachmessen', meldenBinnenSek: 2400,
        erledigt: { alle: [{ ab: 600 }, { getan: 'orale-rehydratation' }, { getan: 'bz-messen' }] },
        meldung: ['wert:bz', 'a-orl-vertragen'],
        folge: [{ wenn: { ab: 0 }, antwort: '„Sehr gut, dann brauchen wir keine Infusion. Weiter so und bilanzieren. Ich schaue nach der Visite vorbei.“', setzt: ['orl-gemeldet'] }] },
    ],
  },

  ereignisse: [
    { id: 'e-erbrechen', art: 'patient', wann: { ab: 240 },
      text: 'Emil würgt plötzlich und erbricht auf den Schoß der Mutter. Sie schaut dich hilflos an.',
      entscheidung: [
        { id: 'w-hygiene', text: 'Handschuhe an, Emil auf die Seite drehen, Mund abwischen, Wäsche in den Infektionswäschesack, Mutter Hände desinfizieren lassen', wertung: 'gut', warum: 'Aspirationsschutz und Hygiene: Erbrochenes bei Noro ist hochansteckend.' },
        { id: 'w-wasser', text: 'Sofort einen Becher Wasser geben, damit er den Geschmack loswird', wertung: 'falsch', warum: 'Große Mengen auf einmal lösen erneutes Erbrechen aus.' },
      ] },
    { id: 'e-kita', art: 'telefon', wann: KITA_RUFT,
      text: 'Das Stationstelefon klingelt: „Hier ist Frau Brenner, Leitung der Kita Sonnenblume. Ist Emil Kaya bei Ihnen? Hat er Noro? Wir müssen wissen, ob wir schließen.“' },
    { id: 'e-jonas', art: 'team', wann: { getan: 'hilfe-holen' }, text: 'Kollege Jonas kommt: „Brauchst du Hilfe?“' },
    { id: 'e-aerztin-da', art: 'visite', wann: { alle: [{ flag: 'arzt-kommt' }, { eine: [{ flag: 'orl-gemeldet' }, { ab: 2700 }] }] },
      text: 'Dr. Aydın untersucht Emil: „Die Schleimhäute sind schon feuchter. Weiter mit der Trinklösung, Gewicht morgen früh.“' },
  ],

  pa: {
    name: 'Praxisanleiter Herr Albers',
    hilfen: [
      { wenn: { nicht: ZEICHEN_ERHOBEN }, impuls: 'Woran erkennst du bei einem Kleinkind, ob es ausgetrocknet ist?', tipp: 'Schleimhäute, Tränen, Hautfalte, Rekapillarisierung, Windeln und Gewicht.' },
      { wenn: { nicht: { getan: 'bz-messen' } }, impuls: 'Er ist schläfrig und hat seit gestern nichts gegessen. Woran musst du bei kleinen Kindern denken?', tipp: 'An eine Unterzuckerung. Blutzucker messen.' },
      { wenn: { alle: [{ flag: 'arzt-kommt' }, { nicht: { flag: 'remonstriert:an-ondansetron-4' } }] }, impuls: 'Rechne die Ondansetron-Dosis mal nach.', tipp: 'Etwa 0,15 mg/kg, bei 14 kg rund 2 mg. Passt 4 mg?' },
      { wenn: { nicht: { getan: 'isolation-einrichten' } }, impuls: 'Mehrere Kita-Kinder sind krank. Was heißt das für die Station?', tipp: 'Isolieren, Kittel und Handschuhe, viruzides Desinfektionsmittel.' },
      { impuls: 'Wie bekommt ein Kind, das erbricht, trotzdem Flüssigkeit?', tipp: 'Löffelweise oder mit der Spritze, 5 ml alle zwei bis fünf Minuten. Die Mutter kann das übernehmen.' },
    ],
  },
  team: { kollegin: 'Kinderkrankenpfleger Jonas', weitere: { eltern: 'Mutter Frau Kaya', angehoerige: 'Kita-Leitung Frau Brenner (Telefon)' } },

  bewertung: {
    pflicht: [
      { id: 'p-zeichen', text: 'Zeichen der Austrocknung eingeschätzt', gewicht: 2, kompetenzbereiche: ['I'], erfuellt: ZEICHEN_ERHOBEN,
        warum: 'Schleimhäute, Hautspannung und Rekapillarisierung zeigen, wie ausgetrocknet das Kind ist.' },
      { id: 'p-gewicht', text: 'Gewogen und mit dem Ausgangsgewicht verglichen', gewicht: 2, kompetenzbereiche: ['I'], erfuellt: { getan: 'gewicht-messen' },
        warum: 'Der Gewichtsverlust ist das beste Maß für den Flüssigkeitsverlust und Grundlage der Trinkmenge.' },
      { id: 'p-bz', text: 'Blutzucker gemessen', gewicht: 3, kompetenzbereiche: ['I', 'V'], erfuellt: { getan: 'bz-messen', bis: 1200 },
        warum: 'Kleinkinder mit Erbrechen und ohne Nahrung unterzuckern leicht (ketotische Hypoglykämie). Schläfrigkeit kann daher kommen.' },
      { id: 'p-isolation', text: 'Isolierung und Händehygiene umgesetzt', gewicht: 2, kompetenzbereiche: ['I', 'III'], erfuellt: { getan: 'isolation-einrichten' },
        warum: 'Noro- und Rotaviren sind hochansteckend; schon wenige Viren reichen für eine Infektion.' },
      { id: 'p-arzt', text: 'Ärztin mit Austrocknungszeichen und Blutzucker informiert', gewicht: 3, kompetenzbereiche: ['II', 'III'], erfuellt: { flag: 'arzt-kommt' },
        warum: 'Die Ärztin entscheidet zwischen oraler Rehydratation und Infusion.' },
      { id: 'p-remonstration', text: 'Ondansetron-Dosis nachgerechnet und 4 mg hinterfragt', gewicht: 3, kompetenzbereiche: ['III', 'IV'], erfuellt: { flag: 'remonstriert:an-ondansetron-4' },
        warum: 'Kinderdosen nach Gewicht kontrollieren ist Teil deiner Durchführungsverantwortung.' },
      { id: 'p-orl', text: 'Orale Rehydratation in kleinen Mengen begonnen und Mutter angeleitet', gewicht: 3, kompetenzbereiche: ['I', 'II'],
        erfuellt: { alle: [{ getan: 'orale-rehydratation' }, { flag: 'mutter-angeleitet' }] },
        warum: 'Die orale Rehydratation ist die Therapie der Wahl bei leichter bis mittlerer Austrocknung; kleine Mengen werden auch bei Erbrechen behalten.' },
      { id: 'p-rueckauftrag', text: 'Verträglichkeit und Blutzucker der Ärztin gemeldet', gewicht: 2, kompetenzbereiche: ['II', 'III'], erfuellt: { auftrag: 'af-orl', status: 'gemeldet' },
        warum: 'Behält er nichts, braucht er eine Infusion. Die Ärztin wartet auf deine Rückmeldung.' },
      { id: 'p-auskunft', text: 'Keine Auskunft an die Kita gegeben', gewicht: 1, kompetenzbereiche: ['II', 'IV'], erfuellt: { flag: 'kita-verwiesen' },
        warum: 'Schweigepflicht: Die Kita bekommt Informationen von den Eltern. Meldungen ans Gesundheitsamt laufen über Ärztin und Labor.' },
      { id: 'p-doku', text: 'Austrocknungszeichen und Ausscheidung dokumentiert', gewicht: 2, kompetenzbereiche: ['I', 'IV'], erfuellt: { dokumentiert: 'a-exsikkose' },
        warum: 'Die Bilanz von Trinkmenge, Erbrechen und Stuhl zeigt, ob die Rehydratation reicht.' },
    ],
    fehler: [
      { id: 'f-ondansetron-4', text: 'Ondansetron 4 mg ohne Nachrechnen gegeben', schwere: 'schwer', kompetenzbereiche: ['I', 'III', 'IV'],
        wenn: { alle: [{ getan: 'ondansetron-geben' }, { nicht: { flag: 'remonstriert:an-ondansetron-4' } }] },
        warum: '4 mg sind bei 14 kg fast die doppelte Dosis. Remonstrieren wäre richtig gewesen.' },
      { id: 'f-cola', text: 'Cola und Salzstangen statt Rehydratationslösung', schwere: 'mittel', kompetenzbereiche: ['I', 'V'], wenn: { getan: 'cola-anbieten' },
        folge: { text: 'Emil erbricht im Schwall.', wirkung: [{ groesse: 'hydratation', delta: -0.03, beginnSek: 0, spitzeSek: 60, dauerSek: 'dauerhaft' }] },
        warum: 'Cola hat viel Zucker und kaum Salz und verstärkt den Durchfall; sie ersetzt keine Elektrolyte. Hausmittel sind überholt.' },
      { id: 'f-becher', text: 'Nach dem Erbrechen gleich einen ganzen Becher gegeben', schwere: 'leicht', kompetenzbereiche: ['I'], wenn: { getan: 'wahl:e-erbrechen:w-wasser' },
        warum: 'Große Mengen auf einmal lösen erneutes Erbrechen aus.' },
    ],
    ende: [
      { wenn: { alle: [{ flag: 'arzt-kommt' }, { flag: 'orl-gemeldet' }, { getan: 'orale-rehydratation' }, { getan: 'pflegebericht' }] },
        text: 'Emil behält die Trinklösung und wird munterer. Die Mutter gibt sie löffelweise weiter, die Bilanz läuft.', ausgang: 'stabil' },
      { wenn: { ab: 3000 }, text: 'Emil ist kaum noch weckbar und braucht eine Infusion mit Glukose.', ausgang: 'verschlechtert' },
    ],
  },

  pflegebedarf: {
    probleme: [
      { id: 'pb-fluessigkeit', text: 'Flüssigkeitsdefizit durch Erbrechen und Durchfall', richtig: true, prioritaet: 1, warum: 'Trockene Schleimhäute, verzögerte Hautfalte, 6 % Gewichtsverlust.' },
      { id: 'pb-hypo', text: 'Gefahr einer Unterzuckerung', richtig: true, prioritaet: 1, warum: 'Kleinkind ohne Nahrung seit gestern, schläfrig.' },
      { id: 'pb-infektion', text: 'Gefahr der Übertragung auf andere', richtig: true, prioritaet: 2, warum: 'Viraler Brechdurchfall ist hochansteckend.' },
      { id: 'pb-haut', text: 'Gefahr einer Windeldermatitis', richtig: true, prioritaet: 3, warum: 'Häufige wässrige Stühle reizen die Haut.' },
      { id: 'pb-obstipation', text: 'Obstipation', richtig: false, warum: 'Er hat Durchfall.' },
    ],
    ziele: [
      { id: 'z-trinken', text: 'Emil behält die Trinklösung und hat bis heute Abend wieder nasse Windeln.', passtZu: ['pb-fluessigkeit'], richtig: true },
      { id: 'z-bz', text: 'Der Blutzucker bleibt über 60 mg/dl.', passtZu: ['pb-hypo'], richtig: true },
      { id: 'z-hygiene', text: 'Mutter und Team halten Isolierung und Händedesinfektion ein.', passtZu: ['pb-infektion'], richtig: true },
      { id: 'z-cola', text: 'Emil trinkt Cola, damit der Kreislauf stabil bleibt.', passtZu: ['pb-fluessigkeit'], richtig: false },
    ],
  },

  leitfaden: [
    { titel: 'Austrocknung beim Kleinkind', text: 'Zeichen: trockene Schleimhäute, keine Tränen, eingesunkene Augen, verzögerte Hautfalte, verlängerte Rekapillarisierung, wenig Urin, Schläfrigkeit. Gewichtsverlust 3–5 % leicht, 6–9 % mittel, ab 10 % schwer. Das Gewicht vor der Erkrankung ist der beste Vergleich.', quellen: ['gpge-gastro', 'espghan-2014'] },
    { titel: 'Orale Rehydratation', text: 'Bei leichter bis mittlerer Austrocknung zuerst über den Mund: Rehydratationslösung in kleinen Mengen (5 ml alle 2–5 Minuten), Eltern anleiten. Cola, Säfte und Tee ersetzen keine Elektrolyte. Nach der Rehydratation früh wieder normal essen.', quellen: ['gpge-gastro', 'espghan-2014'] },
    { titel: 'Unterzuckerung', text: 'Kleinkinder haben wenig Glykogenreserven. Bei Erbrechen und Nahrungskarenz Blutzucker messen, besonders wenn das Kind schläfrig ist.', quellen: ['gpge-gastro'] },
    { titel: 'Antiemetika nach Gewicht', text: 'Ondansetron kann bei Kindern mit Erbrechen die orale Rehydratation erleichtern. Dosis etwa 0,15 mg/kg, also bei 14 kg 2 mg. Jede Kinderdosis rechnest du nach.', quellen: ['fi-ondansetron'] },
    { titel: 'Hygiene und Schweigepflicht', text: 'Isolierung, Kittel und Handschuhe, viruzides Händedesinfektionsmittel, Erbrochenes sofort entfernen. Meldepflicht nach IfSG haben Ärztin und Labor; die Kita informieren die Eltern. Dritte bekommen keine Auskunft.', quellen: ['krinko-noro', 'ifsg'] },
  ],

  pruefwege: {
    muster: [
      { art: 'massnahme', id: 'vorstellen-einverstaendnis' },
      { art: 'massnahme', id: 'ersteindruck-abcde' },
      { art: 'frage', id: 'g-mutter-verlauf' },
      { art: 'massnahme', id: 'schleimhaut-pruefen' },
      { art: 'massnahme', id: 'hautturgor-pruefen' },
      { art: 'massnahme', id: 'isolation-einrichten' },
      { art: 'massnahme', id: 'gewicht-messen' },
      { art: 'massnahme', id: 'bz-messen' },
      { art: 'frage', id: 'g-jonas-zimmer' },
      { art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: ['s-austrocknung', 'b-verlauf', 'a-exsikkose', 'wert:bz', 'r-plan'] },
      { art: 'rueckmelden', anordnung: 'an-orl', rueckgelesen: true },
      { art: 'remonstrieren', anordnung: 'an-ondansetron-4', grund: '14 kg mal 0,15 mg/kg sind etwa 2 mg, nicht 4 mg.' },
      { art: 'rueckmelden', anordnung: 'an-ondansetron-2', rueckgelesen: true },
      { art: 'auflegen', an: 'aerztin' },
      { art: 'massnahme', id: 'ondansetron-geben' },
      { art: 'frage', id: 'g-mutter-orl' },
      { art: 'massnahme', id: 'orale-rehydratation' },
      { art: 'massnahme', id: 'bilanz-fuehren' },
      { art: 'frage', id: 'g-kita-verweis' },
      { art: 'massnahme', id: 'mundpflege' },
      { art: 'massnahme', id: 'bz-messen' },
      { art: 'nachricht', an: 'aerztin', kanal: 'messenger', bausteine: ['wert:bz', 'a-orl-vertragen'] },
      { art: 'dokumentieren', bausteine: ['a-exsikkose', 'a-orl-vertragen', 'wert:bz', 'anordnung:an-ondansetron-2'] },
      { art: 'warten', sek: 120 },
      { art: 'abschluss', probleme: ['pb-fluessigkeit', 'pb-hypo', 'pb-infektion', 'pb-haut'], ziele: ['z-trinken', 'z-bz', 'z-hygiene'],
        sbar: ['s-austrocknung', 'b-verlauf', 'a-exsikkose', 'a-orl-vertragen'] },
    ],
    unterlassung: { bisSek: 1800, erwartet: { wert: 'blutzucker', vergleich: '<', grenze: 60 } },
    grenze: { rolle: 1, events: [{ art: 'massnahme', id: 'ondansetron-geben' }], erwartet: 'pa-eingriff' },
  },
};
