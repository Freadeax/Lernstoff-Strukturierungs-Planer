// Fallwelle P19 (CE 10) · Pädiatrie: Asthmaanfall beim Schulkind, Elternschulung, Sedierung hinterfragen
// Entwurf, fachlich UNGEPRÜFT. Inhalte fiktiv/didaktisch. Migriert und neu geschrieben aus Altfall „asthma“ (scenarios.json).

import { KATALOG } from '../katalog';
import type { Bedingung, FallV2, MassnahmeDefinition } from '../typen';

const aus = (id: string, mehr: Partial<MassnahmeDefinition>): MassnahmeDefinition => ({ ...KATALOG[id]!, ...mehr });

/** Der Vater ruft an (Ereignis e-vater); erst dann gibt es das Gespräch mit ihm. */
const VATER_RUFT: Bedingung = { alle: [{ ab: 900 }, { getan: 'salbu-inhalation' }] };
const INHALIERT: Bedingung = { getan: 'salbu-inhalation' };

const KOMMT = '„Danke, das ist ein mittelschwerer Asthmaanfall. Salbutamol dürfen Sie nach dem Bedarfsplan alle 20 Minuten wiederholen, bis zu dreimal. Sauerstoff, wenn die Sättigung unter 92 Prozent fällt, dann nicht über 95 Prozent. Prednisolon 40 mg als Tablette jetzt. Und geben Sie ihm ein Diazepam-Zäpfchen 5 mg, damit er ruhiger wird. Ich bin in zehn Minuten da. Messen Sie nach der Inhalation Sättigung und Peak-Flow und schreiben Sie mir.“';
const R_KOMMT = { id: 'r-kommt', antwort: KOMMT, anordnungen: ['an-o2', 'an-prednisolon', 'an-diazepam'], kommtNachSek: 600, setzt: ['arzt-kommt'], auftraege: ['af-kontrolle'] };

export const PAED_ASTHMA_SCHULKIND: FallV2 = {
  schema: 2,
  id: 'paed-asthma-schulkind',
  version: '0.1.0',
  spur: 'A',
  setting: 'paediatrie',
  altersgruppe: 'schulkind',
  titel: '„Das Spray hilft heute nicht“',
  kurz: 'Kinderstation: Siebenjähriger mit bekanntem Asthma bekommt am Abend einen Anfall, die Mutter ist bei ihm.',
  rahmen: 'Du bist im Spätdienst auf der Kinderstation und betreust mit deiner Praxisanleitung Ben und seine Mutter.',
  lernziele: [
    'Einen Asthmaanfall beim Kind an Sprechen, Atemarbeit, Sättigung und Peak-Flow einschätzen.',
    'Nach Bedarfsplan Salbutamol mit Spacer geben, atemerleichternd lagern und die Wirkung kontrollieren.',
    'Die Ärztin strukturiert informieren und den Rückauftrag „Sättigung und Peak-Flow melden“ erfüllen.',
    'Eine Beruhigungsmittel-Anordnung im Asthmaanfall als gefährlich erkennen und hinterfragen.',
    'Kind und Mutter beruhigen, die Inhalationstechnik schulen und Auskunft nur an Sorgeberechtigte geben.',
  ],
  lehrplan: {
    ce: ['ce.10', 'ce.06'], abschnitt: ['ad12', 'ad3'],
    themen: ['thema.kl.paediatrie', 'thema.kl.atmung', 'thema.fa.paediatrie', 'thema.kom.beratung', 'thema.re.schweigepflicht'],
    kompetenzen: ['I.2.c', 'II.2.b', 'III.2.a', 'IV.1.b'],
  },
  geeignet: { rollen: [2, 3], stufen: [1, 2, 3] },
  dauerMin: [12, 20],
  freigabe: {
    status: 'entwurf',
    pruefpunkte: [
      'Schweregrad-Zeichen (spricht nur Halbsätze, Einziehungen, SpO₂ 90–94 %) und Vorgehen gegen NVL Asthma 5. Auflage und GINA 2026 (6–11 Jahre) prüfen',
      'Salbutamol 4 Hübe à 100 µg mit Spacer, Wiederholung alle 20 Minuten in der ersten Stunde: Bedarfsplan und Höchstmenge fachlich prüfen',
      'Prednisolon 40 mg bei 24 kg (1–2 mg/kg, höchstens 40 mg) prüfen',
      'Remonstrationspunkt: kein Diazepam/keine Sedierung im akuten Asthmaanfall (Atemdepression) gegen Leitlinie bestätigen',
      'Befugnis Inhalation und Peak-Flow im 2. Drittel mit Anleitung (Lehrplan CE 10 S. 170: ausdrücklich 3. Drittel)',
      'Auskunft an den getrennt lebenden Vater: gemeinsames Sorgerecht laut Akte, Identität am Telefon prüfen (Rückruf über bekannte Nummer) – Stationsregel abgleichen',
      'Modell: Bronchospasmus 0,6 ergibt SpO₂ um 92–94 % und AF über 30; ohne Salbutamol nach 10 Minuten Verschlechterung',
    ],
  },
  quellen: [
    { id: 'nvl-asthma', titel: 'Nationale VersorgungsLeitlinie Asthma, 5. Auflage (2024), Kapitel Asthmaanfall bei Kindern und Jugendlichen', url: 'https://www.leitlinien.de/themen/asthma' },
    { id: 'gina-2026', titel: 'GINA (Global Initiative for Asthma): Global Strategy for Asthma Management and Prevention, 2026 (Kinder 6–11 Jahre)' },
    { id: 'gpp-schulung', titel: 'Arbeitsgemeinschaft Asthmaschulung im Kindes- und Jugendalter: Qualitätsmanagement Asthmaschulung' },
    { id: 'fi-salbutamol', titel: 'Fachinformation Salbutamol Dosieraerosol 100 µg (Kinder)' },
    { id: 'bgb-1687', titel: 'BGB § 1687 Gemeinsame elterliche Sorge bei Getrenntleben (Auskunft an sorgeberechtigte Eltern)' },
  ],

  person: {
    name: 'Ben Schäfer',
    alter: { jahre: 7 },
    geschlecht: 'm',
    biografie: ['geht in die 2. Klasse, spielt Fußball im Verein', 'Eltern leben getrennt, Ben wohnt bei der Mutter', 'hat einen Asthma-Notfallplan, den Spacer aber oft vergessen'],
    diagnosenBekannt: ['Asthma bronchiale seit dem 4. Lebensjahr', 'Aufnahme heute Mittag mit Atemwegsinfekt und vermehrter Atemnot'],
    medikamentePlan: ['Budesonid 200 µg 1-0-1-0 (Dauertherapie)', 'Salbutamol 100 µg Dosieraerosol mit Spacer bei Atemnot (Bedarfsplan)'],
    allergien: ['Hausstaubmilbe', 'keine Arzneimittelallergie bekannt'],
    gewichtKg: 24,
    hilfsmittel: ['Spacer mit Mundstück'],
  },
  medien: {
    raum: '21a_paediatrie_schulkind_ohne_monitor',
    raumVarianten: [
      { wenn: { getan: 'salbu-inhalation' }, raum: '21b_paediatrie_schulkind_spacer' },
      { wenn: { getan: 'pulsoxy-anlegen' }, raum: '21m_paediatrie_schulkind_monitor_verbunden' },
    ],
  },
  uebernahme: 'Ben, 7 Jahre, 24 kg, bekanntes Asthma, kam heute Mittag mit Infekt und mehr Atemnot. Er hat um 14 Uhr seine Bedarfsinhalation bekommen, danach ging es. Die Mutter hat gerade geklingelt, er huste wieder und bekomme schlecht Luft.',
  startUhrzeit: '17:30',

  start: {
    // Bronchospasmus 0,6: Atemarbeit hoch, Giemen, SpO₂ knapp unter 95 %. Ohne Salbutamol kommt nach 10 Minuten eine Verschlechterung.
    grund: { angst: 0.45, unruhe: 0.3, temperatur: 37.9, hydratation: 0.95, gasaustausch: 0.8 },
    treiber: [{ art: 'bronchospasmus', staerke: 0.8 }],
    bild: { haltung: 'sitzt-ringt', haut: 'blass', mimik: 'angst' },
    anordnungen: ['an-salbu-bedarf'],
    sichtbar: [],
  },

  massnahmen: [
    // Gespräch
    'vorstellen-einverstaendnis', 'beruhigen-zusprechen', 'eltern-einbeziehen', 'beschwerden-erfragen',
    // Beobachten
    'ersteindruck-abcde', 'atmung-beobachten', 'atemgeraeusche-hoeren', 'haut-beobachten', 'bewusstsein-avpu', 'news2-berechnen',
    // Akut
    'oberkoerper-hoch', 'flachlagern-beine-hoch', 'hilfe-holen', 'o2-geben', 'rea-team-alarmieren',
    // Messen
    'pulsoxy-anlegen', 'af-zaehlen', 'puls-zaehlen', 'temperatur-ohr', 'peak-flow', 'kurve-lesen',
    // Versorgen
    'salbu-inhalation', 'lippenbremse-anleiten', 'prednisolon-geben', 'diazepam-supp', 'trinken-anbieten',
    // Melden
    'pflegefachperson-informieren', 'pflegebericht',
  ],
  massnahmenZusatz: [
    aus('inhalation-geben', {
      id: 'salbu-inhalation', name: 'Salbutamol 4 Hübe mit Spacer geben (Bedarfsplan)',
      treiber: [{ art: 'wirkstoff', id: 'salbutamol', dosisMg: 0.4, weg: 'inhalativ' }],   // G1
      beendet: ['bronchospasmus'],
      wirkung: [
        { groesse: 'atemarbeit', delta: -0.6, beginnSek: 60, spitzeSek: 600, dauerSek: 'dauerhaft' },
        { groesse: 'gasaustausch', delta: 0.12, beginnSek: 60, spitzeSek: 600, dauerSek: 'dauerhaft' },
      ],
    }),
    aus('o2-geben', { name: 'Sauerstoff über Maske geben (nach Anordnung, ab SpO₂ unter 92 %, nicht über 95 %)', wirkung: [{ groesse: 'sauerstoff', delta: 4, beginnSek: 0, spitzeSek: 30, dauerSek: 'dauerhaft' }] }),
    aus('bedarfsmedikation-oral', {
      id: 'prednisolon-geben', name: 'Prednisolon 40 mg als Tablette geben (nach Anordnung)',
      treiber: [{ art: 'wirkstoff', id: 'prednisolon', dosisMg: 40, weg: 'oral' }],
    }),
    aus('bedarfsmedikation-oral', { id: 'diazepam-supp', name: 'Diazepam-Zäpfchen 5 mg zur Beruhigung geben (nach Anordnung)' }),
    aus('lippenbremse-anleiten', { name: 'Lippenbremse und Kutschersitz mit Ben üben' }),
  ],

  akte: {
    aufnahmegrund: 'Aufnahme heute 12:30 über die Kinderarztpraxis: seit zwei Tagen Schnupfen und Husten, seit der Nacht vermehrt Atemnot, Bedarfsspray zu Hause viermal gebraucht.',
    anamnese: [
      'Asthma bronchiale seit dem 4. Lebensjahr, Sensibilisierung gegen Hausstaubmilbe. Letzter stationärer Aufenthalt vor einem Jahr.',
      'Dauertherapie Budesonid 200 µg morgens und abends; laut Mutter „vergisst er es oft am Wochenende“.',
      'Persönlicher Peak-Flow-Bestwert 250 l/min (Asthmatagebuch).',
      'Eltern getrennt lebend, gemeinsames Sorgerecht. Ben wohnt bei der Mutter.',
    ],
    diagnosen: [
      { text: 'Asthma bronchiale, teilweise kontrolliert', icd: 'J45.9', seit: '2023' },
      { text: 'Akuter Infekt der oberen Atemwege', icd: 'J06.9', seit: 'vorgestern' },
    ],
    medikation: [
      { id: 'mp-budesonid', wirkstoff: 'Budesonid', staerke: '200 µg', form: 'Dosieraerosol mit Spacer', schema: '1-0-1-0', zuletzt: '08:00',
        hinweis: 'Abendgabe 19:00. Danach Mund ausspülen (Soor).' },
      { id: 'mp-salbutamol', wirkstoff: 'Salbutamol', staerke: '100 µg je Hub', form: 'Dosieraerosol mit Spacer', massnahme: 'salbu-inhalation', zuletzt: '14:00',
        bedarf: { indikation: 'Atemnot, Giemen (Notfallplan)', einzeldosis: '4 Hübe', maxProTag: '8 Gaben', abstandH: 0.3 },
        hinweis: 'In der ersten Stunde alle 20 Minuten möglich; bei Bedarf öfter als 4-stündlich Ärztin informieren.' },
    ],
    vorwerte: [
      { zeit: 'Aufnahme 12:30', vorH: 5, werte: { hf: 118, af: 30, spo2: 94, temp: 38.1, gewicht: 24 }, kuerzel: 'AK' },
      { zeit: '14:30', vorH: 3, werte: { hf: 112, af: 24, spo2: 97, temp: 37.8 }, kuerzel: 'AK' },
    ],
    pflegebericht: [
      { zeit: '13:00', wer: 'AK', text: 'Aufnahme mit Mutter. Ben sitzt aufrecht, hustet, Giemen hörbar, spricht in ganzen Sätzen. Spacer mitgebracht. Peak-Flow 170 l/min (Bestwert 250).' },
      { zeit: '14:30', wer: 'AK', text: 'Nach Salbutamol 4 Hüben um 14:00 deutlich besser, Peak-Flow 220 l/min, SpO₂ 97 %. Spielt Karten mit der Mutter.' },
    ],
    aerztlicheAnordnungen: [
      { zeit: '12:45', wer: 'Dr. Brandl', text: 'Salbutamol 4 Hübe mit Spacer bei Bedarf, in der ersten Stunde bis zu dreimal alle 20 Min. Budesonid weiter. Vitalzeichen 4-stündlich, Peak-Flow morgens und abends.' },
    ],
    assessments: [
      { name: 'Peak-Flow', wert: '220 l/min', datum: 'heute 14:30', hinweis: 'Persönlicher Bestwert 250 l/min.' },
      { name: 'PEWS', wert: '1 Punkt', datum: 'heute 14:30' },
    ],
    labor: [
      { name: 'CRP', wert: '9', einheit: 'mg/l', norm: 'unter 5', datum: 'heute 12:45', auffaellig: true },
    ],
    pflegeplanung: [
      { problem: 'Beeinträchtigte Atmung durch Asthma bei Infekt', ziel: 'Ben spricht in ganzen Sätzen, SpO₂ ab 94 %, Peak-Flow über 80 % des Bestwerts', massnahmen: ['Atmung, SpO₂ und Peak-Flow beobachten', 'Bedarfsinhalation nach Plan', 'Oberkörper hoch, Kutschersitz'] },
      { problem: 'Wissensdefizit Inhalationstechnik und Dauertherapie', ziel: 'Ben und Mutter zeigen die Spacer-Technik richtig', massnahmen: ['Inhalation gemeinsam üben', 'Asthmatagebuch besprechen'] },
    ],
    rechtliches: [
      'Gemeinsames Sorgerecht beider Eltern (getrennt lebend). Mutter, Frau Schäfer, ist Begleitperson.',
      'Vater: Herr Schäfer, Telefonnummer im Aufnahmebogen hinterlegt. Auskunft an beide Eltern erlaubt.',
    ],
  },

  befunde: [
    { massnahme: 'vorstellen-einverstaendnis', varianten: [{ text: 'Du stellst dich vor. Ben sitzt vornübergebeugt im Bett, die Arme auf die Knie gestützt. Er nickt nur.' }] },
    { massnahme: 'ersteindruck-abcde', varianten: [
      { wenn: INHALIERT, text: 'A frei. B: atmet ruhiger, leises Giemen, kaum Einziehungen. C: rosig. D: wach, spricht in ganzen Sätzen. E: warm.' },
      { text: 'A frei. B: angestrengt, verlängerte Ausatmung mit Pfeifen, Einziehungen zwischen den Rippen. C: blass, Lippen rosig. D: wach, ängstlich, spricht nur in kurzen Satzteilen. E: leicht warm.' },
    ] },
    { massnahme: 'atmung-beobachten', varianten: [
      { wenn: INHALIERT, text: 'Atemfrequenz {af}/min, kaum noch Einziehungen, die Ausatmung ist kürzer.', zeigt: ['af'] },
      { text: 'Atemfrequenz {af}/min, Einziehungen am Rippenbogen und in der Drosselgrube, er setzt die Schultern ein.', zeigt: ['af'] },
    ] },
    { massnahme: 'af-zaehlen', varianten: [{ text: 'Atemfrequenz {af}/min.', zeigt: ['af'] }] },
    { massnahme: 'atemgeraeusche-hoeren', varianten: [
      { wenn: INHALIERT, text: 'Leises Giemen am Ende der Ausatmung, Luft kommt überall an.' },
      { text: 'Giemen und Brummen über beiden Lungen, Ausatmung deutlich verlängert.' },
    ] },
    { massnahme: 'haut-beobachten', varianten: [{ text: 'Blass, etwas verschwitzt, Lippen und Fingernägel rosig.' }] },
    { massnahme: 'bewusstsein-avpu', varianten: [{ text: 'Wach und ängstlich (AVPU {avpu}).', zeigt: ['avpu'] }] },
    { massnahme: 'news2-berechnen', varianten: [{ text: 'PEWS erhöht: Atmung und Herzfrequenz auffällig. Ärztin informieren.' }] },
    { massnahme: 'pulsoxy-anlegen', varianten: [{ text: 'SpO₂ {spo2} %, Puls {hf}/min.', zeigt: ['spo2', 'hf'] }] },
    { massnahme: 'puls-zaehlen', varianten: [{ text: 'Puls {hf}/min, kräftig.', zeigt: ['hf'] }] },
    { massnahme: 'temperatur-ohr', varianten: [{ text: '{temp} °C.', zeigt: ['temp'] }] },
    { massnahme: 'peak-flow', varianten: [
      { wenn: INHALIERT, text: 'Peak-Flow 195 l/min, knapp 80 % seines Bestwerts von 250. Deutlich besser als vorhin.' },
      { text: 'Peak-Flow 120 l/min, etwa die Hälfte seines Bestwerts von 250. Er muss nach dem Blasen husten.' },
    ] },
    { massnahme: 'kurve-lesen', varianten: [{ text: 'Bedarfsplan: Salbutamol 4 Hübe mit Spacer, in der ersten Stunde bis zu dreimal alle 20 Minuten, zuletzt 14:00. Bestwert Peak-Flow 250 l/min. Rechtliches: gemeinsames Sorgerecht, Vater Herr Schäfer mit Telefonnummer.' }] },
    { massnahme: 'oberkoerper-hoch', varianten: [{ text: 'Ben sitzt aufrecht im Bett, die Arme auf dem Nachttisch-Kissen aufgestützt (Kutschersitz). Das Atmen geht etwas leichter.' }] },
    { massnahme: 'salbu-inhalation', varianten: [{ text: 'Du schüttelst das Spray, steckst es auf den Spacer, Ben atmet nach jedem Hub fünfmal ruhig ein und aus. Vier Hübe, Uhrzeit notiert.' }] },
    { massnahme: 'lippenbremse-anleiten', varianten: [{ text: 'Ihr übt zusammen: durch die Nase ein, durch die locker aufeinanderliegenden Lippen langsam aus, „wie beim Kerze auspusten, aber ganz sanft“.' }] },
    { massnahme: 'prednisolon-geben', varianten: [{ text: 'Ben schluckt die Tablette mit etwas Wasser. Uhrzeit und Dosis dokumentiert.' }] },
    { massnahme: 'trinken-anbieten', varianten: [{ text: 'Er trinkt ein paar Schlucke Wasser in kleinen Zügen.' }] },
  ],

  gespraech: [
    { id: 'g-ben', frage: 'Ben fragen, wie es ihm geht (kurze Ja/Nein-Fragen)', an: 'patient', kompetenzbereiche: ['I', 'II'],
      antwort: [
        { wenn: INHALIERT, text: '„Geht … schon besser. Kann ich … wieder Fußball spielen?“' },
        { text: 'Er schüttelt den Kopf: „Krieg … keine Luft … Brust … eng.“' },
      ], fakten: ['Engegefühl in der Brust', 'spricht nur in Satzteilen'] },
    { id: 'g-mutter-ausloeser', frage: 'Mutter fragen, was vorher war und wie das Spray zu Hause genommen wird', an: 'eltern', kompetenzbereiche: ['I', 'II'],
      antwort: [{ text: '„Er hat vorhin mit dem Nachbarjungen getobt und viel gehustet. Zu Hause nimmt er das Spray oft ohne den Aufsatz, das Kortisonspray vergessen wir am Wochenende manchmal.“', setzt: ['ausloeser-bekannt'] }],
      fakten: ['Toben und Husten vor dem Anfall', 'Spray zu Hause oft ohne Spacer', 'Dauertherapie unregelmäßig'] },
    { id: 'g-mutter-schulung', frage: 'Mit Mutter und Ben die Spacer-Technik und den Notfallplan durchgehen', an: 'eltern', kompetenzbereiche: ['II'],
      nurWenn: INHALIERT,
      antwort: [{ text: 'Ben zeigt dir stolz, wie er den Spacer benutzt. Die Mutter: „Ach, deshalb hat das zu Hause nicht so gewirkt. Und das Kortison ist für jeden Tag, nicht nur für den Notfall?“', setzt: ['geschult'] }],
      fakten: ['Spacer verbessert die Wirkung', 'Dauertherapie täglich'] },
    { id: 'g-einwilligung-vater', frage: 'Mutter fragen, ob sie einverstanden ist, dass du den Vater informierst', an: 'eltern', kompetenzbereiche: ['II', 'IV'],
      nurWenn: VATER_RUFT,
      antwort: [{ text: '„Ja, natürlich, er hat ja auch das Sorgerecht. Sagen Sie ihm ruhig, wie es ist.“', setzt: ['einwilligung-vater'] }] },
    { id: 'g-vater-lage', frage: 'Vater am Telefon: Anfall und jetzigen Zustand schildern', an: 'angehoerige', kanal: 'telefon', kompetenzbereiche: ['II', 'IV'],
      nurWenn: VATER_RUFT,
      schweigepflicht: { erlaubtWenn: { eine: [{ getan: 'kurve-lesen' }, { flag: 'einwilligung-vater' }] },
        fehlerText: 'Du hast am Telefon Auskunft gegeben, ohne zu prüfen, ob der Anrufer sorgeberechtigt ist. Ein Blick in die Akte (Rechtliches) oder die Frage an die Mutter hätte das geklärt. Bei getrennten Eltern ist das nicht selbstverständlich.' },
      antwort: [{ text: '„Danke, dass Sie mir Bescheid sagen. Ich komme nach der Arbeit vorbei und bringe sein Lieblingsbuch mit.“', setzt: ['vater-informiert'] }],
      fakten: ['Vater hat gemeinsames Sorgerecht', 'Vater kommt am Abend'] },
    { id: 'g-vater-rueckruf', frage: 'Vater am Telefon: um Geduld bitten, Rückruf anbieten', an: 'angehoerige', kanal: 'telefon', kompetenzbereiche: ['II', 'IV'],
      nurWenn: VATER_RUFT,
      antwort: [{ text: '„In Ordnung, ich warte auf Ihren Anruf.“', setzt: ['vater-rueckruf'] }] },
    { id: 'g-anna-bleiben', frage: 'Kollegin Anna bitten, bei Ben zu bleiben, während du die Ärztin informierst', an: 'kollegin', kompetenzbereiche: ['III'],
      antwort: [{ text: '„Klar, ich bleibe bei ihm und schaue auf die Sättigung.“', setzt: ['anna-da'] }] },
  ],

  sbar: [
    { id: 's-anfall', teil: 'S', text: 'Ben Schäfer, 7 Jahre, Zimmer 12: akuter Asthmaanfall, spricht nur in Satzteilen.', art: 'kern' },
    { id: 's-husten', teil: 'S', text: 'Ben hustet wieder mehr.', art: 'hilfreich' },
    { id: 'b-asthma', teil: 'B', text: 'Bekanntes Asthma, Aufnahme heute mit Infekt, 24 kg, Salbutamol zuletzt um 14 Uhr, Budesonid als Dauertherapie.', art: 'kern' },
    { id: 'b-fussball', teil: 'B', text: 'Er spielt Fußball im Verein.', art: 'ablenker' },
    { id: 'a-atemnot', teil: 'A', text: 'Einziehungen, verlängerte Ausatmung mit Giemen, Atemfrequenz deutlich erhöht, ängstlich.', art: 'kern', bekanntWenn: { eine: [{ getan: 'atmung-beobachten' }, { getan: 'ersteindruck-abcde' }] } },
    { id: 'a-salbu-gegeben', teil: 'A', text: 'Salbutamol 4 Hübe mit Spacer nach Bedarfsplan gegeben, sitzt im Kutschersitz.', art: 'kern', bekanntWenn: INHALIERT },
    { id: 'a-pef-niedrig', teil: 'A', text: 'Peak-Flow etwa die Hälfte des Bestwerts.', art: 'hilfreich', bekanntWenn: { getan: 'peak-flow' } },
    { id: 'a-pef-besser', teil: 'A', text: 'Nach der Inhalation Peak-Flow knapp 80 % des Bestwerts, spricht wieder in ganzen Sätzen.', art: 'hilfreich',
      bekanntWenn: { alle: [INHALIERT, { getan: 'peak-flow' }] } },
    { id: 'a-nur-angst', teil: 'A', text: 'Ich glaube, er hat vor allem Angst und steigert sich hinein.', art: 'falsch' },
    { id: 'r-kommen', teil: 'R', text: 'Bitte kommen Sie und schauen Sie ihn an. Brauchen wir Sauerstoff oder ein weiteres Medikament?', art: 'kern' },
  ],

  anordnungen: [
    { id: 'an-salbu-bedarf', massnahme: 'salbu-inhalation', text: 'Salbutamol 4 Hübe mit Spacer bei Atemnot, in der ersten Stunde bis zu dreimal alle 20 Minuten.' },
    { id: 'an-o2', massnahme: 'o2-geben', text: 'Sauerstoff über Maske, wenn SpO₂ unter 92 %, Obergrenze 95 %.' },
    { id: 'an-prednisolon', massnahme: 'prednisolon-geben', text: 'Prednisolon 40 mg oral, einmalig jetzt.' },
    { id: 'an-diazepam', massnahme: 'diazepam-supp', text: 'Diazepam-Zäpfchen 5 mg zur Beruhigung.',
      fehlerhaft: {
        warum: 'Beruhigungsmittel dämpfen den Atemantrieb. Im Asthmaanfall ist die Unruhe ein Zeichen der Atemnot; Sedierung kann die Atmung lebensgefährlich verschlechtern und ist kontraindiziert.',
        korrektur: '„Sie haben recht, das lassen wir weg. Die Unruhe kommt von der Luftnot. Beruhigen Sie ihn mit der Mutter, die Inhalation wirkt gleich.“',
      } },
  ],

  arzt: {
    name: 'Stationsärztin Dr. Brandl',
    erreichbar: 'telefon',
    regeln: [
      { ...R_KOMMT, wenn: { alle: [{ gemeldet: ['a-atemnot', 'wert:spo2'] }, { eine: [{ gemeldet: ['a-salbu-gegeben'] }, { gemeldet: ['b-asthma'] }] }] } },
      { id: 'r-werte-frage', wenn: { gemeldet: ['a-atemnot'] },
        antwort: '„Ein Asthmaanfall, verstanden. Hat er schon Salbutamol bekommen?“',
        rueckfrage: { text: '„Wie ist die Sättigung?“', erwartet: ['wert:spo2'], auftrag: 'af-werte' } },
      { wenn: { gemeldet: ['a-nur-angst'] },
        antwort: '„Angst haben Kinder im Asthmaanfall immer, weil sie keine Luft bekommen. Beschreiben Sie mir bitte die Atmung.“' },
    ],
    auftraege: [
      { id: 'af-werte', text: 'Sättigung messen und der Ärztin melden', erledigt: { getan: 'pulsoxy-anlegen' },
        meldung: ['wert:spo2'], meldenBinnenSek: 300,
        folge: [{ ...R_KOMMT, wenn: { gemeldet: ['a-atemnot'] } }] },
      { id: 'af-kontrolle', text: 'Nach der Inhalation Sättigung und Peak-Flow messen und der Ärztin schreiben', meldenBinnenSek: 900,
        erledigt: { alle: [{ ab: 240 }, { getan: 'peak-flow' }, { getan: 'pulsoxy-anlegen' }] },
        meldung: ['wert:spo2'],
        folge: [
          { wenn: { gemeldet: ['a-pef-besser'] }, antwort: '„Gut, das spricht für eine Besserung. Erst einmal keine weitere Inhalation, in einer Stunde nochmal Peak-Flow. Ich komme gleich vorbei.“', setzt: ['kontrolle-gemeldet'] },
          { wenn: { ab: 0 }, antwort: '„Danke. Wie ist der Peak-Flow? Ist er nicht besser, wiederholen Sie die Inhalation. Ich bin gleich da.“', setzt: ['kontrolle-gemeldet'] },
        ] },
    ],
  },

  ereignisse: [
    { id: 'e-verschlechterung', art: 'komplikation', wann: { ab: 600 }, verhindertDurch: INHALIERT,
      text: 'Ben wird stiller. Er sitzt zusammengesunken, die Lippen sind bläulich, das Giemen ist kaum noch zu hören. Die Mutter: „Er sagt gar nichts mehr!“',
      treiber: [{ art: 'bronchospasmus', staerke: 1 }],
      bild: { haltung: 'sitzt-ringt', haut: 'zyanotisch', mimik: 'schlaefrig' },
      entscheidung: [
        { id: 'w-hilfe', text: 'Klingeln, Hilfe holen, sofort Salbutamol nach Bedarfsplan geben und die Ärztin als Notfall rufen', wertung: 'gut', warum: 'Ein „stiller Thorax“ mit Erschöpfung ist ein lebensbedrohlicher Anfall. Sofort behandeln und ärztliche Hilfe holen.' },
        { id: 'w-schlafen', text: 'Er wird ruhiger, das Medikament scheint zu wirken. Schlafen lassen.', wertung: 'gefaehrlich', warum: 'Leises Giemen und Schläfrigkeit sind hier Zeichen der Erschöpfung, nicht der Besserung.' },
      ] },
    { id: 'e-anna', art: 'team', wann: { getan: 'hilfe-holen' }, text: 'Kinderkrankenschwester Anna kommt ins Zimmer: „Was brauchst du?“' },
    { id: 'e-vater', art: 'telefon', wann: VATER_RUFT,
      text: 'Das Stationstelefon klingelt: „Hier ist Schäfer, Bens Vater. Meine Ex-Frau hat mir geschrieben, er hat einen Anfall? Wie geht es ihm?“' },
    { id: 'e-aerztin-da', art: 'visite', wann: { alle: [{ flag: 'arzt-kommt' }, { eine: [{ flag: 'kontrolle-gemeldet' }, { ab: 1800 }] }] },
      text: 'Dr. Brandl hört Ben ab: „Schon deutlich besser. Wir bleiben beim Plan: Peak-Flow in einer Stunde, Prednisolon für drei Tage.“' },
  ],

  pa: {
    name: 'Praxisanleiterin Frau Kühn',
    hilfen: [
      { wenn: { nicht: INHALIERT }, impuls: 'Was steht für so eine Situation in Bens Bedarfsplan?', tipp: 'Salbutamol 4 Hübe mit Spacer darfst du nach dem Bedarfsplan geben. Danach die Ärztin informieren.' },
      { wenn: { alle: [{ flag: 'arzt-kommt' }, { nicht: { flag: 'remonstriert:an-diazepam' } }] }, impuls: 'Was passiert mit der Atmung, wenn man ein Kind im Asthmaanfall beruhigt?', tipp: 'Diazepam dämpft den Atemantrieb. Im Asthmaanfall ist das gefährlich. Frag nach.' },
      { wenn: { auftrag: 'af-werte', status: 'offen' }, impuls: 'Welchen Wert wollte die Ärztin noch wissen?', tipp: 'Die Sättigung. Pulsoxymeter anlegen und ihr den Wert schicken.' },
      { wenn: { alle: [{ auftrag: 'af-kontrolle', status: 'offen' }, { nicht: { auftrag: 'af-kontrolle', status: 'gemeldet' } }] }, impuls: 'Was solltest du nach der Inhalation kontrollieren?', tipp: 'Sättigung und Peak-Flow messen und der Ärztin im Messenger schreiben.' },
      { impuls: 'Wie kann Ben gerade am leichtesten atmen?', tipp: 'Aufrecht sitzen, Arme aufstützen (Kutschersitz), Lippenbremse, Mutter bleibt bei ihm.' },
    ],
  },
  team: { kollegin: 'Kinderkrankenschwester Anna', weitere: { eltern: 'Mutter Frau Schäfer', angehoerige: 'Vater Herr Schäfer (Telefon)' } },

  bewertung: {
    pflicht: [
      { id: 'p-einschaetzen', text: 'Atmung eingeschätzt (Einziehungen, Atemfrequenz, Sprechen)', gewicht: 2, kompetenzbereiche: ['I'],
        erfuellt: { eine: [{ getan: 'atmung-beobachten' }, { getan: 'ersteindruck-abcde' }] }, warum: 'Sprechen, Einziehungen und Atemfrequenz zeigen, wie schwer der Anfall ist.' },
      { id: 'p-spo2', text: 'Sättigung gemessen', gewicht: 2, kompetenzbereiche: ['I'], erfuellt: { getan: 'pulsoxy-anlegen' },
        warum: 'Die Sättigung zeigt die Schwere des Anfalls. Unter 92 % ist der Anfall schwer und braucht Sauerstoff (GINA 2026).' },
      { id: 'p-salbu', text: 'Salbutamol nach Bedarfsplan mit Spacer gegeben', gewicht: 3, kompetenzbereiche: ['I', 'III'], erfuellt: { getan: 'salbu-inhalation', bis: 600 },
        warum: 'Kurz wirksame Beta-2-Sympathomimetika sind das erste Mittel im Anfall. Der Bedarfsplan erlaubt die Gabe ohne neuen Anruf; wer wartet, riskiert Erschöpfung.' },
      { id: 'p-lagerung', text: 'Atemerleichternd gelagert (Oberkörper hoch, Kutschersitz)', gewicht: 1, kompetenzbereiche: ['I'], erfuellt: { getan: 'oberkoerper-hoch' },
        warum: 'Aufrechte Haltung und Abstützen der Arme helfen der Atemhilfsmuskulatur.' },
      { id: 'p-arzt', text: 'Ärztin strukturiert informiert', gewicht: 3, kompetenzbereiche: ['II', 'III'], erfuellt: { flag: 'arzt-kommt' },
        warum: 'Ein Anfall trotz Bedarfsinhalation braucht ärztliche Beurteilung und meist Kortison.' },
      { id: 'p-remonstration', text: 'Beruhigungsmittel im Asthmaanfall hinterfragt', gewicht: 3, kompetenzbereiche: ['III', 'IV'], erfuellt: { flag: 'remonstriert:an-diazepam' },
        warum: 'Sedierung dämpft den Atemantrieb. Du trägst die Durchführungsverantwortung und musst die Anordnung hinterfragen.' },
      { id: 'p-rueckauftrag', text: 'Nach der Inhalation Sättigung und Peak-Flow gemessen und gemeldet', gewicht: 2, kompetenzbereiche: ['II', 'III'],
        erfuellt: { auftrag: 'af-kontrolle', status: 'gemeldet' }, warum: 'Die Ärztin entscheidet nach deiner Rückmeldung, ob weiter inhaliert wird (Closed Loop).' },
      { id: 'p-schulung', text: 'Spacer-Technik und Notfallplan mit Mutter und Ben besprochen', gewicht: 1, kompetenzbereiche: ['II'],
        erfuellt: { flag: 'geschult' }, warum: 'Ohne Spacer kommt viel weniger Wirkstoff in der Lunge an. Schulung beugt dem nächsten Anfall vor.' },
      { id: 'p-auskunft', text: 'Vater erst nach Prüfung des Sorgerechts informiert', gewicht: 1, kompetenzbereiche: ['II', 'IV'],
        erfuellt: { eine: [{ alle: [{ getan: 'frage:g-vater-lage' }, { eine: [{ getan: 'kurve-lesen' }, { flag: 'einwilligung-vater' }] }] }, { getan: 'frage:g-vater-rueckruf' }] },
        warum: 'Auskunft bekommen sorgeberechtigte Eltern. Bei getrennten Eltern steht das in der Akte oder du fragst den anwesenden Elternteil.' },
      { id: 'p-doku', text: 'Anfall, Inhalation und Wirkung dokumentiert', gewicht: 2, kompetenzbereiche: ['I', 'IV'],
        erfuellt: { alle: [{ dokumentiert: 'a-atemnot' }, { dokumentiert: 'a-salbu-gegeben' }] },
        warum: 'Uhrzeit und Anzahl der Inhalationen braucht die Ärztin, um die Höchstmenge und den Verlauf zu beurteilen.' },
    ],
    fehler: [
      { id: 'f-diazepam', text: 'Diazepam im Asthmaanfall gegeben', schwere: 'schwer', kompetenzbereiche: ['I', 'III', 'IV'],
        wenn: { getan: 'diazepam-supp' },
        folge: { text: 'Ben wird schläfrig, seine Atmung wird flacher, die Sättigung fällt.', wirkung: [{ groesse: 'atemantrieb', delta: -0.3, beginnSek: 300, spitzeSek: 1200, dauerSek: 3600 }] },
        warum: 'Beruhigungsmittel dämpfen den Atemantrieb und verschleiern die Erschöpfung.' },
      { id: 'f-flach', text: 'Kind mit Atemnot flach gelagert', schwere: 'mittel', kompetenzbereiche: ['I'], wenn: { getan: 'flachlagern-beine-hoch' },
        folge: { text: 'Ben ringt im Liegen noch mehr nach Luft und richtet sich panisch wieder auf.', wirkung: [{ groesse: 'atemarbeit', delta: 0.3, beginnSek: 0, spitzeSek: 30, dauerSek: 300 }] },
        warum: 'Flaches Liegen erschwert die Atmung; bei Atemnot immer aufrecht.' },
      { id: 'f-schlafen', text: 'Erschöpfung als Besserung verkannt', schwere: 'schwer', kompetenzbereiche: ['I', 'V'], wenn: { getan: 'wahl:e-verschlechterung:w-schlafen' },
        warum: 'Leiser werdendes Giemen mit Schläfrigkeit ist ein Alarmzeichen (stiller Thorax).' },
    ],
    ende: [
      { wenn: { alle: [{ flag: 'arzt-kommt' }, { flag: 'kontrolle-gemeldet' }, INHALIERT, { getan: 'pflegebericht' }] },
        text: 'Ben atmet ruhiger und fragt nach seinem Kartenspiel. Die Ärztin hat ihn untersucht, der Anfall bessert sich.', ausgang: 'stabil' },
      { wenn: { ab: 2400 }, text: 'Ben ist erschöpft und muss auf die Intensivstation verlegt werden.', ausgang: 'verschlechtert' },
    ],
  },

  pflegebedarf: {
    probleme: [
      { id: 'pb-atmung', text: 'Beeinträchtigte Atmung durch Bronchialobstruktion', richtig: true, prioritaet: 1, warum: 'Einziehungen, Giemen und niedrige Sättigung zeigen einen akuten Anfall.' },
      { id: 'pb-angst', text: 'Angst bei Atemnot (Kind und Mutter)', richtig: true, prioritaet: 2, warum: 'Luftnot macht Angst, Angst verstärkt die Atemnot.' },
      { id: 'pb-wissen', text: 'Wissensdefizit zur Inhalationstechnik und Dauertherapie', richtig: true, prioritaet: 2, warum: 'Zu Hause ohne Spacer und unregelmäßige Kortisongabe.' },
      { id: 'pb-fluessigkeit', text: 'Gefahr eines Flüssigkeitsdefizits (schnelle Atmung, Infekt)', richtig: true, prioritaet: 3, warum: 'Schnelles Atmen und Fieber erhöhen den Flüssigkeitsbedarf.' },
      { id: 'pb-verhalten', text: 'Verhaltensauffälligkeit mit Unruhe', richtig: false, warum: 'Die Unruhe kommt von der Atemnot, nicht vom Verhalten.' },
    ],
    ziele: [
      { id: 'z-atmung', text: 'Ben spricht in ganzen Sätzen, SpO₂ ab 94 %, Peak-Flow über 80 % des Bestwerts.', passtZu: ['pb-atmung'], richtig: true },
      { id: 'z-technik', text: 'Ben und seine Mutter zeigen die Spacer-Technik richtig und erklären den Notfallplan.', passtZu: ['pb-wissen'], richtig: true },
      { id: 'z-ruhe', text: 'Ben fühlt sich sicher, die Mutter bleibt bei ihm und weiß, was sie tun kann.', passtZu: ['pb-angst'], richtig: true },
      { id: 'z-sediert', text: 'Ben schläft ruhig nach einem Beruhigungsmittel.', passtZu: ['pb-angst'], richtig: false },
    ],
  },

  leitfaden: [
    { titel: 'Schwere eines Asthmaanfalls beim Kind', text: 'Achte auf Sprechen (ganze Sätze, Satzteile, einzelne Worte), Einziehungen, Atemfrequenz, Sättigung und Peak-Flow im Vergleich zum Bestwert. SpO₂ unter 92 %, Erschöpfung, Zyanose oder ein „stiller Thorax“ bedeuten Lebensgefahr.', quellen: ['nvl-asthma', 'gina-2026'] },
    { titel: 'Erste Maßnahmen', text: 'Aufrecht sitzen lassen, Arme aufstützen, Lippenbremse, beruhigen. Kurz wirksames Beta-2-Sympathomimetikum mit Spacer nach Bedarfs- oder Notfallplan, in der ersten Stunde wiederholbar. Nach der ersten Gabe die Wirkung prüfen, bevor wiederholt wird. Sauerstoff nach Anordnung erst bei SpO₂ unter 92 %, dabei nicht über 95 %. Ärztlich: systemisches Kortison.', quellen: ['nvl-asthma', 'gina-2026', 'fi-salbutamol'] },
    { titel: 'Keine Beruhigungsmittel', text: 'Unruhe ist im Asthmaanfall ein Zeichen der Atemnot. Sedativa dämpfen den Atemantrieb und sind kontraindiziert. Eine solche Anordnung hinterfragst du.', quellen: ['nvl-asthma'] },
    { titel: 'Schulung', text: 'Spacer immer benutzen, nach jedem Hub mehrmals ruhig atmen, Kortison täglich und danach Mund ausspülen, Asthmatagebuch und Notfallplan. Eltern und Kind gemeinsam schulen.', quellen: ['gpp-schulung'] },
    { titel: 'Auskunft an Eltern', text: 'Sorgeberechtigte Eltern haben Anspruch auf Auskunft, auch wenn sie getrennt leben. Prüfe in der Akte, wer sorgeberechtigt ist, und frage im Zweifel den anwesenden Elternteil.', quellen: ['bgb-1687'] },
  ],

  pruefwege: {
    muster: [
      { art: 'massnahme', id: 'vorstellen-einverstaendnis' },
      { art: 'massnahme', id: 'ersteindruck-abcde' },
      { art: 'massnahme', id: 'oberkoerper-hoch' },
      { art: 'massnahme', id: 'pulsoxy-anlegen' },
      { art: 'massnahme', id: 'kurve-lesen' },
      { art: 'massnahme', id: 'salbu-inhalation' },
      { art: 'massnahme', id: 'lippenbremse-anleiten' },
      { art: 'massnahme', id: 'atmung-beobachten' },
      { art: 'frage', id: 'g-mutter-ausloeser' },
      { art: 'frage', id: 'g-anna-bleiben' },
      { art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: ['s-anfall', 'b-asthma', 'a-atemnot', 'a-salbu-gegeben', 'wert:spo2', 'r-kommen'] },
      { art: 'rueckmelden', anordnung: 'an-o2', rueckgelesen: true },
      { art: 'rueckmelden', anordnung: 'an-prednisolon', rueckgelesen: true },
      { art: 'remonstrieren', anordnung: 'an-diazepam', grund: 'Diazepam dämpft den Atemantrieb, im Asthmaanfall ist das gefährlich.' },
      { art: 'auflegen', an: 'aerztin' },
      { art: 'massnahme', id: 'prednisolon-geben' },
      { art: 'warten', sek: 180 },
      { art: 'massnahme', id: 'pulsoxy-anlegen' },
      { art: 'massnahme', id: 'peak-flow' },
      { art: 'nachricht', an: 'aerztin', kanal: 'messenger', bausteine: ['wert:spo2', 'a-pef-besser'] },
      { art: 'frage', id: 'g-einwilligung-vater' },
      { art: 'frage', id: 'g-vater-lage' },
      { art: 'frage', id: 'g-mutter-schulung' },
      { art: 'dokumentieren', bausteine: ['a-atemnot', 'a-salbu-gegeben', 'wert:spo2', 'a-pef-besser', 'anordnung:an-prednisolon'] },
      { art: 'warten', sek: 60 },
      { art: 'abschluss', probleme: ['pb-atmung', 'pb-angst', 'pb-wissen', 'pb-fluessigkeit'], ziele: ['z-atmung', 'z-technik', 'z-ruhe'],
        sbar: ['s-anfall', 'b-asthma', 'a-atemnot', 'a-salbu-gegeben', 'a-pef-besser'] },
    ],
    unterlassung: { bisSek: 1200, erwartet: { wert: 'spo2', vergleich: '<', grenze: 92 } },
    grenze: { rolle: 2, events: [{ art: 'massnahme', id: 'prednisolon-geben' }], erwartet: 'pa-eingriff' },
  },
};
