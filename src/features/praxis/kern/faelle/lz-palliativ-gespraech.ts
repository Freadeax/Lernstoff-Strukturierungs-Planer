// P18 · CE08 · stationäre Langzeitpflege, Spätdienst: Bewohnerin mit metastasiertem Brustkrebs, zunehmende Atemnot
// und Schmerz, Tochter (Vorsorgebevollmächtigte) will den Notarzt. Patientenverfügung, Symptomlinderung,
// Bedarfsmedikation Morphin (G1) und ein schwieriges Gespräch. Migriert aus Altfall „palliativ“ und neu geschrieben.
// Entwurf, fachlich UNGEPRÜFT. Inhalte fiktiv/didaktisch.

import { KATALOG } from '../katalog';
import type { ArztRegel, Bedingung, FallV2, MassnahmeDefinition } from '../typen';

const aus = (id: string, mehr: Partial<MassnahmeDefinition>): MassnahmeDefinition => ({ ...KATALOG[id]!, ...mehr });

const SYMPTOME: Bedingung = { getan: 'symptome-erfassen-palliativ' };
const LINDERUNG: Bedingung = { flag: 'atemnot-gelindert' };

const ANTWORT = 'Danke, das ist eine klare Meldung. Frau Roth ist opioidnaiv, oder? Dann geben Sie Morphin-Lösung 10 mg oral jetzt, bei Bedarf alle vier Stunden wieder. Dazu die nichtmedikamentösen Maßnahmen, die Sie schon machen. Ich faxe die Anordnung. Bitte melden Sie mir in einer halben Stunde Atemfrequenz und wie sie die Atemnot selbst einschätzt.';
const REGEL_VOLL: ArztRegel = {
  id: 'r-voll', wenn: { gemeldet: ['a-atemnot', 'a-schmerz', 'b-verfuegung', 'wert:af'] },
  antwort: `„${ANTWORT}“`, anordnungen: ['an-morphin-10', 'an-palliativ'], setzt: ['arzt-informiert'], auftraege: ['af-wirkung'],
};

export const LZ_PALLIATIV_GESPRAECH: FallV2 = {
  schema: 2,
  id: 'lz-palliativ-gespraech',
  version: '0.1.0',
  spur: 'A',
  setting: 'langzeit',
  altersgruppe: 'hochbetagt',
  titel: '„Sie kriegt keine Luft, rufen Sie den Notarzt!“',
  kurz: 'Pflegeheim, Spätdienst: 88-Jährige mit Brustkrebs und Lungenmetastasen hat zunehmend Atemnot und Schmerzen, die Tochter steht aufgelöst im Zimmer.',
  rahmen: 'Du arbeitest im Spätdienst im Wohnbereich 2. Die Hausarztpraxis ist geschlossen, erreichbar ist der ärztliche Bereitschaftsdienst. Deine Praxisanleiterin ist im Haus.',
  lernziele: [
    'Symptome am Lebensende strukturiert erfassen (IPOS: Atemnot, Schmerz, Angst, Mundtrockenheit) und die Selbsteinschätzung der Bewohnerin ernst nehmen.',
    'Atemnot zuerst ohne Medikament lindern: aufrecht, kühler Luftzug, Fenster, ruhig dableiben, Mund befeuchten.',
    'Eine zu hohe Opioid-Startdosis bei einer opioidnaiven Hochbetagten erkennen und nachfragen (Remonstration).',
    'Mit der Tochter ein schwieriges Gespräch führen: Patientenverfügung, Wille der Mutter, warum Notarzt und Krankenhaus hier nicht lindern.',
    'Palliativdienst (SAPV) einbinden, Wirkung der Bedarfsmedikation kontrollieren und melden.',
  ],
  lehrplan: {
    ce: ['ce.08', 'ce.09'], abschnitt: ['ad12', 'ad3'],
    themen: ['thema.ph.palliativ', 'thema.kl.atmung', 'thema.ph.medikamente', 'thema.re.betreuung'],
    kompetenzen: ['I.3.a', 'I.3.b', 'II.1.e', 'III.3.a'],
  },
  geeignet: { rollen: [2, 3], stufen: [2, 3] },
  dauerMin: [12, 18],
  freigabe: {
    status: 'entwurf',
    pruefpunkte: [
      'Morphin-Startdosis bei opioidnaiver Hochbetagter (S3 Palliativmedizin 2026: niedrig beginnen, z. B. 2,5 mg oral) und Formulierung der Remonstration prüfen',
      'Rolle der Vorsorgebevollmächtigten und Ablauf Notarzt/Einweisung gegen Patientenverfügung (§ 1827 BGB) prüfen',
      'IPOS-Auszug und nichtmedikamentöse Atemnotlinderung (Handventilator) mit S3-Leitlinie abgleichen',
      'SAPV-Zugang im Pflegeheim (§ 37b SGB V) aktuell?',
    ],
  },
  quellen: [
    { id: 's3-palliativ', titel: 'S3-Leitlinie Palliativmedizin für Patienten mit einer nicht-heilbaren Krebserkrankung (AWMF 128-001OL), aktualisierte Fassung 2026 (Kapitel Atemnot, Tumorschmerz, Sterbephase, neu: Angehörige)' },
    { id: 'ipos', titel: 'IPOS – Integrated Palliative care Outcome Scale, deutsche Fassung (Cicely Saunders Institute / DGP)' },
    { id: 'bgb-1827', titel: 'BGB § 1827 Patientenverfügung, § 1828 Gespräch zur Feststellung des Patientenwillens (seit 1.1.2023)' },
    { id: 'sgb-v-37b', titel: 'SGB V § 37b Spezialisierte ambulante Palliativversorgung (auch im Pflegeheim)' },
    { id: 'fi-morphin', titel: 'Fachinformation Morphin-Lösung (Rote Liste / Fachinfo-Service)' },
  ],

  person: {
    name: 'Frau Roth',
    alter: { jahre: 88 },
    geschlecht: 'w',
    biografie: ['war Grundschullehrerin, liest gern Gedichte', 'verwitwet, eine Tochter (Petra, Vorsorgebevollmächtigte)', 'hat vor einem Jahr gesagt: „Ich will nicht mehr ins Krankenhaus.“', 'mag kalten Pfefferminztee'],
    diagnosenBekannt: ['Mammakarzinom links mit Lungen- und Knochenmetastasen (keine Tumortherapie mehr, auf eigenen Wunsch)', 'Herzinsuffizienz', 'Pflegegrad 4'],
    medikamentePlan: ['Metamizol 500 mg 1-1-1-1', 'Torasemid 5 mg 1-0-0', 'Macrogol 1-0-0'],
    allergien: ['keine bekannt'],
    hilfsmittel: ['Pflegebett', 'Handventilator (von der Tochter mitgebracht)'],
    gewichtKg: 52,
  },
  medien: {
    raum: '26_pflegeheim_zimmer_tag',   // Beispielbild: Bewohnerin im Bett
    raumVarianten: [],
  },
  uebernahme: 'Frau Roth, 88, Brustkrebs mit Metastasen in Lunge und Knochen, keine Tumortherapie mehr, auf eigenen Wunsch. Patientenverfügung liegt vor: keine Krankenhauseinweisung, keine Wiederbelebung, Linderung im Heim. Tochter Petra hat Vorsorgevollmacht. Seit heute Mittag atmet sie schwerer und sagt, der Rücken tut mehr weh. Opioide hatte sie bisher keine. Die Tochter ist gerade gekommen und ziemlich aufgelöst.',
  startUhrzeit: '17:30',

  start: {
    // Lungenmetastasen: Atemarbeit erhöht, Gasaustausch leicht gestört, Knochenschmerz; Angst schaukelt Atemnot auf
    grund: {
      gasaustausch: 0.84, atemarbeit: 1.7, hydratation: 0.86, volumen: 0.94, temperatur: 37.2,
      orientierung: 0.95, angst: 0.5, unruhe: 0.25, schmerz: 6, blutzucker: 104,
    },
    treiber: [
      { art: 'panik_eskaliert', tempo: 0.55 },
    ],
    bild: { haltung: 'liegt', haut: 'blass', mimik: 'angst' },
    sichtbar: [],
  },

  massnahmen: [
    // Gespräch
    'vorstellen-einverstaendnis', 'beschwerden-erfragen', 'beruhigen-zusprechen', 'biografie-erfragen',
    // Beobachten
    'symptome-erfassen-palliativ', 'schmerz-nrs', 'atmung-beobachten', 'haut-beobachten', 'schleimhaut-pruefen', 'kurve-lesen',
    // Akut
    'oberkoerper-hoch', 'atemnot-lindern', 'o2-geben', 'notruf-112',
    // Messen
    'af-zaehlen', 'pulsoxy-anlegen', 'rr-messen', 'puls-zaehlen', 'temperatur-ohr',
    // Versorgen
    'mundbefeuchtung', 'morphin-10-geben', 'morphin-25-geben',
    // Melden
    'palliativdienst-informieren', 'pflegefachperson-informieren', 'pflegebericht', 'pflegeplanung-anpassen',
  ],
  massnahmenZusatz: [
    aus('bedarfsmedikation-oral', {
      id: 'morphin-10-geben', name: 'Morphin-Lösung 10 mg oral geben', setzt: ['morphin-gegeben'],
      treiber: [{ art: 'wirkstoff', id: 'morphin', dosisMg: 10, weg: 'oral' }],   // G1
    }),
    aus('bedarfsmedikation-oral', {
      id: 'morphin-25-geben', name: 'Morphin-Lösung 2,5 mg oral geben (nach geänderter Anordnung)', setzt: ['morphin-gegeben'],
      treiber: [{ art: 'wirkstoff', id: 'morphin', dosisMg: 2.5, weg: 'oral' }],   // G1
    }),
    aus('o2-geben', { name: 'Sauerstoff über Nasenbrille geben' }),
    // Luftzug, aufrecht und Dabeibleiben unterbrechen die Spirale aus Atemnot und Angst
    aus('atemnot-lindern', { beendet: ['panik_eskaliert'] }),
  ],

  akte: {
    aufnahmegrund: 'Einzug vor zwei Jahren, als die Versorgung zu Hause nicht mehr reichte. Seit drei Monaten Lungenmetastasen bekannt, Tumortherapie auf eigenen Wunsch beendet.',
    anamnese: [
      'War Grundschullehrerin, verwitwet. Liest gern Gedichte, mag kalten Pfefferminztee.',
      'Hat beim letzten Krankenhausaufenthalt gesagt: „Nie wieder. Ich will hier bei meinen Sachen sterben.“',
      'Tochter Petra Roth wohnt in der Stadt, hat Vorsorgevollmacht für Gesundheit. Hat Angst, „dass Mama erstickt“.',
      'Bisher keine Opioide, Schmerzen mit Metamizol gut beherrscht.',
    ],
    diagnosen: [
      { text: 'Mammakarzinom links, Lungen- und Knochenmetastasen', icd: 'C50.9', seit: '2023' },
      { text: 'Herzinsuffizienz NYHA II', icd: 'I50.12', seit: '2019' },
      { text: 'Chronische Obstipation', icd: 'K59.09', seit: '2024' },
    ],
    medikation: [
      { id: 'mp-metamizol', wirkstoff: 'Metamizol', staerke: '500 mg', form: 'Tbl.', schema: '1-1-1-1', zuletzt: 'heute 14:00' },
      { id: 'mp-torasemid', wirkstoff: 'Torasemid', staerke: '5 mg', form: 'Tbl.', schema: '1-0-0-0', zuletzt: 'heute 08:00' },
      { id: 'mp-macrogol', wirkstoff: 'Macrogol', staerke: '13,1 g', form: 'Btl.', schema: '1-0-0-0', zuletzt: 'heute 08:00' },
      { id: 'mp-morphin', wirkstoff: 'Morphin-Lösung', staerke: '2,5 mg', form: 'oral', massnahme: 'morphin-25-geben', ab: 'an-morphin-25',
        bedarf: { indikation: 'Atemnot oder Schmerz', einzeldosis: '2,5 mg', maxProTag: '6×', abstandH: 4 } },
    ],
    vorwerte: [
      { zeit: 'vor 1 Woche', vorH: 168, werte: { rrSys: 118, rrDia: 70, hf: 84, af: 18, spo2: 93, gewicht: 52.5 }, kuerzel: 'BK' },
      { zeit: 'heute 08:00', vorH: 9.5, werte: { rrSys: 112, rrDia: 68, hf: 92, af: 22 }, kuerzel: 'FD' },
    ],
    pflegebericht: [
      { zeit: 'gestern 20:00', wer: 'SD', text: 'Abendessen kaum angerührt. Schläft unruhig, sagt „die Luft ist so dick“.' },
      { zeit: 'heute 12:30', wer: 'FD', text: 'Atmet schwerer, Rückenschmerz NRS 5. Metamizol gegeben. Tochter informiert, kommt nach der Arbeit.' },
    ],
    aerztlicheAnordnungen: [
      { zeit: 'vor 3 Monaten', wer: 'Dr. Sander (Hausärztin)', text: 'Therapieziel Linderung. Keine Einweisung, keine Reanimation laut Patientenverfügung. Bei Atemnot oder Schmerz Bereitschaftsdienst oder SAPV.' },
    ],
    assessments: [
      { name: 'IPOS (Pflegeeinschätzung)', wert: 'Atemnot 2, Schmerz 2, Angst 2', datum: 'vor 1 Woche', hinweis: 'Skala 0–4 je Symptom' },
    ],
    pflegeplanung: [
      { problem: 'Belastende Atemnot durch Lungenmetastasen', ziel: 'Frau Roth erlebt Atemnot als erträglich', massnahmen: ['Oberkörper hoch', 'Handventilator', 'Fenster öffnen'] },
    ],
    rechtliches: [
      'Patientenverfügung (2024): keine Krankenhauseinweisung, keine Reanimation, keine künstliche Ernährung; Linderung von Schmerz und Atemnot ausdrücklich gewünscht.',
      'Vorsorgevollmacht Gesundheit: Tochter Petra Roth.',
    ],
  },

  befunde: [
    { massnahme: 'vorstellen-einverstaendnis', varianten: [{ text: 'Sie nickt, spricht in kurzen Sätzen: „Gut, dass Sie da sind. Die Luft …“' }] },
    { massnahme: 'beschwerden-erfragen', varianten: [{ text: '„Ich krieg so schlecht Luft. Und der Rücken. Und ich hab Angst, dass ich ersticke.“' }] },
    { massnahme: 'symptome-erfassen-palliativ', varianten: [
      { wenn: LINDERUNG, text: 'IPOS mit ihr gemeinsam: Atemnot 3 von 4, Schmerz 3, Angst 3, Mundtrockenheit 3, Übelkeit 0. Seit sie aufrecht sitzt und der Ventilator läuft, sagt sie: „Ein bisschen besser.“' },
      { text: 'IPOS mit ihr gemeinsam: Atemnot 3 von 4 (stark), Schmerz 3, Angst 3, Mundtrockenheit 3, Übelkeit 0. Sie sagt: „Am schlimmsten ist die Luft.“' },
    ] },
    { massnahme: 'schmerz-nrs', varianten: [
      { wenn: { flag: 'morphin-gegeben' }, text: 'Rückenschmerz jetzt NRS 3 von 10. „Viel besser, das kann ich aushalten.“' },
      { text: 'Rückenschmerz NRS 6 von 10, im Liegen schlimmer.' },
    ] },
    { massnahme: 'atmung-beobachten', varianten: [{ text: 'Atmet flach und schnell, AF {af}/min, setzt die Halsmuskeln ein, spricht in kurzen Sätzen.', zeigt: ['af'] }] },
    { massnahme: 'af-zaehlen', varianten: [{ text: 'AF {af}/min.', zeigt: ['af'] }] },
    { massnahme: 'pulsoxy-anlegen', varianten: [{ text: 'SpO₂ {spo2} %. Am Lebensende ist die Sättigung kein Ziel; entscheidend ist, wie sie die Atemnot erlebt.', zeigt: ['spo2'] }] },
    { massnahme: 'rr-messen', varianten: [{ text: 'RR {rrSys}/{rrDia} mmHg.', zeigt: ['rrSys', 'rrDia'] }] },
    { massnahme: 'puls-zaehlen', varianten: [{ text: 'Puls {hf}/min.', zeigt: ['hf'] }] },
    { massnahme: 'temperatur-ohr', varianten: [{ text: '{temp} °C.', zeigt: ['temp'] }] },
    { massnahme: 'haut-beobachten', varianten: [{ text: 'Haut blass, Lippen trocken, keine Zyanose.' }] },
    { massnahme: 'schleimhaut-pruefen', varianten: [{ text: 'Mund sehr trocken, Zunge belegt. Sie atmet mit offenem Mund.' }] },
    { massnahme: 'oberkoerper-hoch', varianten: [{ text: 'Du setzt sie aufrecht, Arme auf Kissen abgestützt. Sie atmet etwas tiefer.' }] },
    { massnahme: 'atemnot-lindern', varianten: [{ text: 'Fenster gekippt, Handventilator auf ihr Gesicht gerichtet, du setzt dich zu ihr und atmest ruhig mit ihr. „Das tut gut, der Wind.“' }] },
    { massnahme: 'mundbefeuchtung', varianten: [{ text: 'Du tupfst ihr kalten Pfefferminztee auf die Lippen und pflegst sie mit Lippenbalsam. Sie lächelt kurz.' }] },
    { massnahme: 'o2-geben', varianten: [{ text: 'Die Nasenbrille stört sie, sie zieht daran. Die Atemnot wird dadurch nicht spürbar besser.' }] },
    { massnahme: 'morphin-25-geben', varianten: [{ text: 'Du gibst 2,5 mg Morphin-Lösung (Doppelkontrolle mit der Praxisanleiterin, BtM-Buch). Sie schluckt gut.' }] },
    { massnahme: 'morphin-10-geben', varianten: [{ text: 'Du gibst 10 mg Morphin-Lösung.' }] },
    { massnahme: 'kurve-lesen', varianten: [{ text: 'Seit heute Morgen AF und Puls gestiegen. Metamizol zuletzt 14 Uhr. Keine Opioide bisher.' }] },
  ],

  gespraech: [
    { id: 'g-wunsch', frage: 'Frau Roth fragen, was ihr jetzt am wichtigsten ist und wo sie sein möchte', an: 'patient', kompetenzbereiche: ['II'],
      antwort: [{ text: '„Dass ich Luft kriege und keine Angst habe. Und dass ich hierbleibe. Nicht ins Krankenhaus. Das hab ich doch aufgeschrieben.“', setzt: ['wille-erfragt'] }],
      wirkung: [{ groesse: 'angst', delta: -0.05, beginnSek: 0, spitzeSek: 60, dauerSek: 'dauerhaft' }],
      fakten: ['will im Heim bleiben', 'Angst vor dem Ersticken'] },
    { id: 'g-tochter', frage: 'Mit Tochter Petra sprechen: Was sie sieht, was ihre Mutter will und was jetzt hilft', an: 'angehoerige', nurWenn: { ab: 90 }, kompetenzbereiche: ['II', 'IV'],
      antwort: [
        { wenn: { flag: 'wille-erfragt' }, text: 'Petra weint. „Ich weiß ja, was sie aufgeschrieben hat. Ich halte es nur nicht aus, sie so zu sehen.“ Du erklärst, was ihr gerade tut und dass auch Medikamente gegen Atemnot möglich sind. Sie setzt sich ans Bett und hält den Ventilator.', setzt: ['tochter-begleitet'] },
        { text: '„Sie wissen doch gar nicht, was sie will, sie kriegt ja kaum Luft!“ Frag zuerst Frau Roth selbst, was ihr wichtig ist, und sprich dann mit Petra darüber.' },
      ] },
    { id: 'g-gedicht', frage: 'Fragen, ob die Tochter ihr ein Gedicht vorlesen möchte', an: 'angehoerige', nurWenn: { flag: 'tochter-begleitet' }, kompetenzbereiche: ['II'],
      antwort: [{ text: 'Petra liest leise „Herbsttag“ von Rilke. Frau Roth schließt die Augen, ihre Atmung wird ruhiger.' }],
      wirkung: [{ groesse: 'angst', delta: -0.08, beginnSek: 0, spitzeSek: 120, dauerSek: 'dauerhaft' }] },
  ],

  sbar: [
    { id: 's-roth', teil: 'S', text: 'Frau Roth, 88, Pflegeheim: seit Mittag zunehmende Atemnot und Rückenschmerz, große Angst.', art: 'kern' },
    { id: 's-tochter', teil: 'S', text: 'Die Tochter ist sehr aufgeregt.', art: 'ablenker' },
    { id: 'b-krebs', teil: 'B', text: 'Brustkrebs mit Lungen- und Knochenmetastasen, Therapieziel Linderung. Opioidnaiv, Metamizol 4× 500 mg, letzte Gabe 14 Uhr. 52 kg.', art: 'kern' },
    { id: 'b-verfuegung', teil: 'B', text: 'Patientenverfügung: keine Einweisung, keine Reanimation, Linderung im Heim. Sie bestätigt das heute selbst.', art: 'kern' },
    { id: 'a-atemnot', teil: 'A', text: 'Atemnot im IPOS 3 von 4, spricht in kurzen Sätzen, setzt Atemhilfsmuskeln ein.', art: 'kern', bekanntWenn: SYMPTOME },
    { id: 'a-schmerz', teil: 'A', text: 'Rückenschmerz NRS 6 trotz Metamizol.', art: 'kern', bekanntWenn: { eine: [SYMPTOME, { getan: 'schmerz-nrs' }] } },
    { id: 'a-angst', teil: 'A', text: 'Große Angst zu ersticken; aufrecht und mit Ventilator etwas besser.', art: 'hilfreich', bekanntWenn: LINDERUNG },
    { id: 'a-wirkung', teil: 'A', text: 'Eine halbe Stunde nach 2,5 mg Morphin: Atemnot im IPOS 1 bis 2, sie atmet ruhiger, ist wach und ansprechbar.', art: 'kern',
      bekanntWenn: { alle: [{ flag: 'morphin-gegeben' }, { ab: 1500 }, SYMPTOME] } },
    { id: 'a-spo2', teil: 'A', text: 'Sättigung niedrig, wir brauchen Sauerstoff und ein Krankenhaus.', art: 'falsch' },
    { id: 'r-bedarf', teil: 'R', text: 'Bitte eine Bedarfsmedikation gegen Atemnot und Schmerz anordnen und den Palliativdienst einbinden.', art: 'kern' },
  ],

  anordnungen: [
    { id: 'an-morphin-10', massnahme: 'morphin-10-geben', text: 'Morphin-Lösung 10 mg oral jetzt, bei Bedarf alle 4 h.',
      fehlerhaft: {
        warum: 'Frau Roth ist 88, wiegt 52 kg und hatte noch nie Opioide. Bei opioidnaiven Hochbetagten beginnt man niedrig (z. B. 2,5 mg oral) und steigert nach Wirkung. 10 mg können sie stark sedieren und die Atmung dämpfen.',
        korrektur: 'Da haben Sie recht, das war die Dosis für jemanden, der schon Opioide bekommt. 2,5 mg oral, bei Bedarf alle vier Stunden, maximal sechsmal am Tag.',
        ersatz: 'an-morphin-25',
      } },
    { id: 'an-morphin-25', massnahme: 'morphin-25-geben', text: 'Morphin-Lösung 2,5 mg oral bei Atemnot oder Schmerz, frühestens alle 4 h, max. 6× täglich.' },
    { id: 'an-palliativ', massnahme: 'palliativdienst-informieren', text: 'SAPV-Team heute noch informieren, Verordnung folgt.' },
  ],

  arzt: {
    name: 'Bereitschaftsärztin Dr. Feld',
    erreichbar: 'bereitschaft',
    regeln: [
      REGEL_VOLL,
      { id: 'r-wille', wenn: { gemeldet: ['a-atemnot', 'a-schmerz', 'wert:af'] },
        antwort: '„Das klingt belastend. Bevor ich etwas anordne: Was ist mit dem Therapieziel?“',
        rueckfrage: { text: '„Gibt es eine Patientenverfügung, und was sagt Frau Roth selbst? Soll sie ins Krankenhaus?“', erwartet: ['b-verfuegung'] } },
      { wenn: { gemeldet: ['a-spo2'] }, antwort: '„Wenn Sie meinen, dann rufen Sie den Rettungsdienst.“', setzt: ['arzt-rtw'] },
      { wenn: { gemeldet: ['s-roth'] }, antwort: '„Wie stark ist die Atemnot, wie schnell atmet sie, wie stark ist der Schmerz? Rufen Sie mit genauen Beobachtungen wieder an.“' },
    ],
    auftraege: [
      { id: 'af-wirkung', text: '30 Minuten nach der ersten Morphin-Gabe Atemfrequenz und Atemnot (Selbsteinschätzung) melden',
        erledigt: { alle: [{ flag: 'morphin-gegeben' }, { ab: 1500 }] }, meldung: ['wert:af', 'a-wirkung'], meldenBinnenSek: 3000,
        folge: [{ wenn: { ab: 0 }, antwort: '„Gut, dann bleibt es so. Der SAPV-Arzt kommt morgen früh und stellt die Medikation ein.“', setzt: ['wirkung-gemeldet'] }] },
    ],
  },

  ereignisse: [
    { id: 'e-tochter-112', art: 'angehoerige', wann: { ab: 150 },
      text: 'Petra hält schon das Handy: „Sie kriegt keine Luft! Ich ruf jetzt den Notarzt, die muss ins Krankenhaus!“',
      entscheidung: [
        { id: 'w-gespraech', text: 'Ruhig bleiben, mit ihr ans Bett setzen: Was will die Mutter, was steht in der Verfügung, was tun wir jetzt gegen die Atemnot? Ärztlichen Bereitschaftsdienst anbieten', wertung: 'gut', setzt: ['gespraech-angeboten'],
          warum: 'Die Tochter handelt aus Angst. Als Bevollmächtigte muss sie den Willen ihrer Mutter vertreten (§ 1827 BGB). Ein ruhiges Gespräch und sichtbare Linderung helfen mehr als ein Notarzt, der nach Verfügung nicht einweisen soll.' },
        { id: 'w-112', text: 'Selbst den Notruf 112 wählen, damit Ruhe ist', wertung: 'falsch', warum: 'Der Rettungsdienst muss im Zweifel lebenserhaltend handeln, die Verfügung sieht Linderung im Heim vor. Frau Roth hat klar gesagt, dass sie nicht ins Krankenhaus will.' },
        { id: 'w-recht', text: '„Das dürfen Sie nicht, das steht in der Verfügung“', wertung: 'vertretbar', warum: 'Inhaltlich richtig, aber ohne Gespräch fühlt sich Petra allein gelassen. Sie braucht Erklärung und Beteiligung.' },
      ] },
    { id: 'e-frage-sterben', art: 'patient', wann: { alle: [{ flag: 'tochter-begleitet' }, { ab: 600 }] },
      text: 'Als Petra kurz rausgeht, fragt Frau Roth dich leise: „Sterbe ich jetzt?“',
      entscheidung: [
        { id: 'w-offen', text: 'Bei ihr bleiben, zurückfragen, was sie spürt und was ihr Angst macht. Ehrlich sagen, dass die Krankheit fortschreitet und du alles tust, damit sie keine Atemnot und keine Angst haben muss', wertung: 'gut', setzt: ['frage-aufgenommen'],
          warum: 'Offene Fragen am Lebensende brauchen Raum, keine Ausflüchte und keine Prognose, die Pflege nicht stellen kann. Zurückfragen hilft zu verstehen, was sie wirklich wissen will.' },
        { id: 'w-ausweichen', text: '„Ach was, so schnell stirbt man nicht“', wertung: 'falsch', warum: 'Beschwichtigen lässt sie mit ihrer Angst allein.' },
        { id: 'w-arzt', text: '„Das kann Ihnen nur die Ärztin sagen“', wertung: 'vertretbar', warum: 'Eine Prognose stellt die Ärztin, aber zuhören und nachfragen gehört zur Pflege.' },
      ] },
    { id: 'e-panik', art: 'komplikation', wann: { ab: 1200 }, verhindertDurch: LINDERUNG,
      text: 'Frau Roth reißt die Augen auf, greift nach deinem Arm und ringt nach Luft: „Ich ersticke!“',
      treiber: [{ art: 'panik_eskaliert', tempo: 0.5 }], bild: { haltung: 'sitzt', mimik: 'angst' } },
  ],

  pa: {
    name: 'Praxisanleiterin Frau Hartmann',
    hilfen: [
      { wenn: { nicht: SYMPTOME }, impuls: 'Wie stark ist die Atemnot für Frau Roth selbst?', tipp: 'Erfasse die Symptomlast gemeinsam mit ihr (IPOS): Atemnot, Schmerz, Angst, Mund.' },
      { wenn: { nicht: LINDERUNG }, impuls: 'Was hilft gegen Atemnot, bevor ein Medikament da ist?', tipp: 'Aufrecht setzen, Fenster auf, Handventilator ins Gesicht, ruhig bei ihr bleiben.' },
      { wenn: { nicht: { flag: 'wille-erfragt' } }, impuls: 'Sie kann noch sprechen. Was will sie selbst?', tipp: 'Frag Frau Roth, was ihr jetzt wichtig ist und wo sie sein möchte.' },
      { wenn: { nicht: { flag: 'arzt-informiert' } }, impuls: 'Wer kann jetzt etwas gegen Atemnot und Schmerz anordnen?', tipp: 'Bereitschaftsdienst mit SBAR: Symptome, Therapieziel, Verfügung, opioidnaiv, Gewicht.' },
      { wenn: { auftrag: 'af-wirkung', status: 'offen' }, impuls: 'Die Ärztin wollte nach einer halben Stunde wissen, ob das Morphin hilft.', tipp: 'Atemfrequenz zählen, Frau Roth nach der Atemnot fragen und melden.' },
      { impuls: 'Wer begleitet Frau Roth in den nächsten Tagen?', tipp: 'SAPV-Team informieren, Pflegeplanung anpassen, Bericht schreiben.' },
    ],
  },
  team: { kollegin: 'Pflegefachfrau Anja (Schichtleitung)', weitere: { angehoerige: 'Tochter Petra Roth (Vorsorgebevollmächtigte)' } },

  bewertung: {
    pflicht: [
      { id: 'p-symptome', text: 'Symptomlast gemeinsam mit ihr erfasst (IPOS)', gewicht: 3, kompetenzbereiche: ['I'], erfuellt: SYMPTOME,
        warum: 'Am Lebensende zählt die Selbsteinschätzung. Atemnot ist, was die Betroffene als Atemnot erlebt.' },
      { id: 'p-lindern', text: 'Atemnot ohne Medikament gelindert (aufrecht, Luftzug, dableiben)', gewicht: 3, kompetenzbereiche: ['I', 'II'],
        erfuellt: { alle: [LINDERUNG, { getan: 'oberkoerper-hoch' }] },
        warum: 'Nichtmedikamentöse Maßnahmen wirken sofort und nehmen Angst.' },
      { id: 'p-mund', text: 'Mund befeuchtet', gewicht: 1, kompetenzbereiche: ['I'], erfuellt: { flag: 'mund-befeuchtet' },
        warum: 'Mundtrockenheit quält bei Mundatmung zusätzlich.' },
      { id: 'p-wille', text: 'Frau Roth selbst nach ihrem Willen gefragt', gewicht: 3, kompetenzbereiche: ['II', 'IV'], erfuellt: { flag: 'wille-erfragt' },
        warum: 'Sie ist einwilligungsfähig. Ihr aktueller Wille geht vor, die Verfügung bestätigt ihn.' },
      { id: 'p-tochter', text: 'Tochter begleitet und einbezogen', gewicht: 2, kompetenzbereiche: ['II'], erfuellt: { flag: 'tochter-begleitet' },
        warum: 'Angehörige brauchen Erklärung und eine Aufgabe am Bett.' },
      { id: 'p-arzt', text: 'Bereitschaftsdienst mit Symptomen, Therapieziel und Verfügung informiert', gewicht: 3, kompetenzbereiche: ['II', 'III'], erfuellt: { flag: 'arzt-informiert' },
        warum: 'Bedarfsmedikation gegen Atemnot und Schmerz braucht eine ärztliche Anordnung, die zum Therapieziel passt.' },
      { id: 'p-remonstration', text: 'Zu hohe Morphin-Startdosis hinterfragt', gewicht: 3, kompetenzbereiche: ['III', 'IV'], erfuellt: { flag: 'remonstriert:an-morphin-10' },
        warum: 'Opioidnaiv, hochbetagt, 52 kg: niedrig beginnen, nach Wirkung steigern.' },
      { id: 'p-morphin', text: 'Morphin 2,5 mg nach geänderter Anordnung gegeben', gewicht: 2, kompetenzbereiche: ['I', 'III'], erfuellt: { getan: 'morphin-25-geben' },
        warum: 'Morphin lindert Atemnot und Schmerz am Lebensende wirksam.' },
      { id: 'p-rueckauftrag', text: 'Wirkung nach 30 Minuten kontrolliert und gemeldet', gewicht: 2, kompetenzbereiche: ['I', 'II'], erfuellt: { auftrag: 'af-wirkung', status: 'gemeldet' },
        warum: 'Nach jeder Bedarfsgabe Wirkung und Nebenwirkung prüfen, damit die Ärztin die Dosis anpassen kann.' },
      { id: 'p-sapv', text: 'Palliativdienst (SAPV) informiert', gewicht: 2, kompetenzbereiche: ['III'], erfuellt: { flag: 'palliativdienst-informiert' },
        warum: 'SAPV stellt die Symptomkontrolle sicher, rund um die Uhr erreichbar, auch im Heim.' },
      { id: 'p-doku', text: 'Pflegebericht mit Symptomen, Wille und hinterfragter Anordnung', gewicht: 1, kompetenzbereiche: ['I', 'IV'],
        erfuellt: { alle: [{ getan: 'pflegebericht' }, { dokumentiert: 'a-atemnot' }, { dokumentiert: 'anordnung:an-morphin-10' }] },
        warum: 'Symptomverlauf, Gespräch und Medikation müssen für die Nacht nachvollziehbar sein.' },
    ],
    fehler: [
      { id: 'f-morphin10', text: '10 mg Morphin bei opioidnaiver Hochbetagter gegeben', schwere: 'schwer', kompetenzbereiche: ['I', 'III'], wenn: { getan: 'morphin-10-geben' },
        warum: 'Zu hohe Startdosis: Sedierung, Atemdepression, Sturzgefahr.' },
      { id: 'f-112', text: 'Rettungsdienst gegen die Patientenverfügung gerufen', schwere: 'schwer', kompetenzbereiche: ['II', 'IV'], wenn: { eine: [{ getan: 'notruf-112' }, { flag: 'arzt-rtw' }] },
        warum: 'Frau Roth will im Heim bleiben. Einweisung und Notfallmaßnahmen widersprechen ihrem Willen.' },
      { id: 'f-o2', text: 'Sauerstoff statt Linderung', schwere: 'leicht', kompetenzbereiche: ['I'], wenn: { alle: [{ getan: 'o2-geben' }, { nicht: LINDERUNG }] },
        warum: 'Ohne deutliche Sauerstoffnot lindert O₂ Atemnot nicht besser als ein Luftzug; die Nasenbrille stört eher.' },
    ],
    ende: [
      { wenn: { alle: [{ flag: 'arzt-informiert' }, { flag: 'palliativdienst-informiert' }, { getan: 'pflegebericht' }, { flag: 'wirkung-gemeldet' }] },
        text: 'Frau Roth sitzt aufrecht, der Ventilator surrt, ihre Atmung ist ruhiger. Petra hält ihre Hand und liest. Der SAPV-Arzt kommt morgen früh.', ausgang: 'stabil' },
      { wenn: { ab: 3000 }, text: 'Die Atemnot ist nicht gelindert, Frau Roth ist erschöpft und voller Angst. Petra hat doch den Notarzt gerufen.', ausgang: 'verschlechtert' },
    ],
  },

  pflegebedarf: {
    probleme: [
      { id: 'pb-atemnot', text: 'Belastende Atemnot mit Angst zu ersticken', richtig: true, prioritaet: 1, warum: 'IPOS Atemnot 3, Angst 3, Atemhilfsmuskulatur.' },
      { id: 'pb-schmerz', text: 'Tumorschmerz im Rücken (Knochenmetastasen)', richtig: true, prioritaet: 1, warum: 'NRS 6 trotz Metamizol.' },
      { id: 'pb-mund', text: 'Mundtrockenheit durch Mundatmung', richtig: true, prioritaet: 2, warum: 'Zunge belegt, Lippen trocken.' },
      { id: 'pb-tochter', text: 'Überforderte Angehörige', richtig: true, prioritaet: 2, warum: 'Tochter will aus Angst den Notarzt rufen.' },
      { id: 'pb-ernaehrung', text: 'Mangelernährung, Kalorienzufuhr steigern', richtig: false, warum: 'Am Lebensende stehen Wohlbefinden und Wunsch im Vordergrund, nicht Kalorienziele.' },
    ],
    ziele: [
      { id: 'z-atemnot', text: 'Frau Roth erlebt ihre Atemnot als erträglich (IPOS höchstens 1) und hat weniger Angst.', passtZu: ['pb-atemnot'], richtig: true },
      { id: 'z-schmerz', text: 'Frau Roth gibt einen für sie erträglichen Schmerz an.', passtZu: ['pb-schmerz'], richtig: true },
      { id: 'z-tochter', text: 'Petra kennt die Maßnahmen und kann ihre Mutter begleiten.', passtZu: ['pb-tochter'], richtig: true },
      { id: 'z-spo2', text: 'SpO₂ über 94 %.', passtZu: ['pb-atemnot'], richtig: false },
    ],
  },

  leitfaden: [
    { titel: 'Symptome erfassen', text: 'Am Lebensende zählt die Selbsteinschätzung. Mit IPOS werden Atemnot, Schmerz, Angst, Mundtrockenheit und weitere Symptome gemeinsam mit der Person eingeschätzt und im Verlauf verglichen.', quellen: ['ipos'] },
    { titel: 'Atemnot lindern', text: 'Zuerst ohne Medikament: aufrecht sitzen, Arme abstützen, kühler Luftzug ins Gesicht (Handventilator, Fenster), Ruhe ausstrahlen, dableiben. Sauerstoff nur bei deutlicher Hypoxämie und wenn er subjektiv hilft.', quellen: ['s3-palliativ'] },
    { titel: 'Opioide gegen Atemnot', text: 'Morphin lindert Atemnot und Schmerz. Bei opioidnaiven, älteren Menschen niedrig beginnen (z. B. 2,5 mg oral) und nach Wirkung steigern. Nach 30 Minuten Wirkung, Atemfrequenz und Vigilanz prüfen. Betäubungsmittel mit Doppelkontrolle und BtM-Dokumentation.', quellen: ['s3-palliativ', 'fi-morphin'] },
    { titel: 'Das schwierige Gespräch', text: 'Zuerst die Person selbst fragen, was ihr wichtig ist. Angehörige handeln oft aus Angst: zuhören, erklären, was ihr tut, und eine Aufgabe am Bett anbieten. Die Bevollmächtigte vertritt den Willen der Mutter, nicht ihren eigenen (§ 1827 BGB).', quellen: ['bgb-1827'] },
    { titel: 'Palliativnetz', text: 'SAPV kann auch im Pflegeheim verordnet werden (§ 37b SGB V) und ist rund um die Uhr erreichbar. Sie stellt Bedarfsmedikation ein und begleitet Team und Angehörige.', quellen: ['sgb-v-37b'] },
  ],

  pruefwege: {
    muster: [
      { art: 'massnahme', id: 'vorstellen-einverstaendnis' },
      { art: 'massnahme', id: 'oberkoerper-hoch' },
      { art: 'massnahme', id: 'atemnot-lindern' },
      { art: 'massnahme', id: 'symptome-erfassen-palliativ' },
      { art: 'frage', id: 'g-wunsch' },
      { art: 'frage', id: 'g-tochter' },
      { art: 'massnahme', id: 'af-zaehlen' },
      { art: 'massnahme', id: 'mundbefeuchtung' },
      { art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: ['s-roth', 'b-krebs', 'b-verfuegung', 'a-atemnot', 'a-schmerz', 'a-angst', 'wert:af', 'r-bedarf'] },
      { art: 'remonstrieren', anordnung: 'an-morphin-10', grund: 'Sie ist opioidnaiv, 88 Jahre und wiegt 52 kg. Sind 10 mg als Startdosis richtig?' },
      { art: 'rueckmelden', anordnung: 'an-morphin-25', rueckgelesen: true },
      { art: 'rueckmelden', anordnung: 'an-palliativ', rueckgelesen: true },
      { art: 'auflegen', an: 'aerztin' },
      { art: 'massnahme', id: 'morphin-25-geben' },
      { art: 'massnahme', id: 'palliativdienst-informieren' },
      { art: 'frage', id: 'g-gedicht' },
      { art: 'warten', sek: 600 },
      { art: 'warten', sek: 900 },
      { art: 'massnahme', id: 'af-zaehlen' },
      { art: 'massnahme', id: 'symptome-erfassen-palliativ' },
      { art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: ['wert:af', 'a-wirkung'] },
      { art: 'auflegen', an: 'aerztin' },
      { art: 'dokumentieren', bausteine: ['a-atemnot', 'a-schmerz', 'a-angst', 'b-verfuegung', 'anordnung:an-morphin-10', 'anordnung:an-morphin-25'] },
      { art: 'massnahme', id: 'pflegeplanung-anpassen' },
      { art: 'abschluss', probleme: ['pb-atemnot', 'pb-schmerz', 'pb-mund', 'pb-tochter'], ziele: ['z-atemnot', 'z-schmerz', 'z-tochter'],
        sbar: ['s-roth', 'b-krebs', 'b-verfuegung', 'a-atemnot', 'a-schmerz'] },
    ],
    unterlassung: { bisSek: 1800, erwartet: { wert: 'angst', vergleich: '>', grenze: 0.8 } },
    grenze: { rolle: 2, events: [{ art: 'massnahme', id: 'morphin-10-geben' }], erwartet: 'pa-eingriff' },
  },
};
