// Pilotfall Spur A · ambulant: Sturz, Exsikkose, beginnendes Delir (Entwurf, fachlich UNGEPRÜFT)
// Erster Fall auf dem neuen Kern (Pilotstaffel E6). Inhalte fiktiv/didaktisch.

import type { Bedingung, FallV2 } from '../typen';

const ZEICHEN_EXSIKKOSE: Bedingung = { alle: [{ getan: 'schleimhaut-pruefen' }, { getan: 'rr-messen' }] };

export const PILOT_AMBULANT: FallV2 = {
  schema: 2,
  id: 'amb-sturz-exsikkose',
  version: '0.1.0',
  spur: 'A',
  setting: 'ambulant',
  altersgruppe: 'hochbetagt',
  titel: '„Ich bin nur kurz hingesessen“',
  kurz: 'Hausbesuch: 84-Jährige sitzt am Boden, wirkt verwirrt, trinkt seit Tagen wenig.',
  rahmen: 'Du bist mit deiner Praxisanleitung auf der Morgentour des ambulanten Pflegedienstes (Kompressionsstrümpfe, Medikamente aus dem Wochendosett).',
  lernziele: [
    'Nach einem Sturz zuerst sichern und Verletzungen einschätzen, erst dann aufhelfen.',
    'Zeichen einer Exsikkose im Alter erkennen und richtig deuten.',
    'Akute Verwirrtheit als Warnzeichen (Delir) erkennen und nicht als „Demenz“ abtun.',
    'Den Hausarzt strukturiert (SBAR) informieren und Anordnungen rücklesen.',
    'Eine potenziell gefährliche Anordnung (Benzodiazepin bei Delir im Alter) hinterfragen.',
  ],
  geeignet: { rollen: [1, 2, 3], stufen: [1, 2, 3] },
  dauerMin: [10, 15],
  freigabe: {
    status: 'entwurf',
    pruefpunkte: [
      'Befugnis Blutzucker/Orale Medikamente/s. c.-Infusion je Drittel gegen BW-Lehrplan 3BFP belegen',
      'Ablauf Aufhelfen nach Sturz gegen Expertenstandard Sturzprophylaxe prüfen',
      'Vitalwerte und Verlauf der Exsikkose plausibel?',
      'Remonstrationspunkt Lorazepam fachlich und rechtlich prüfen',
    ],
  },
  quellen: [
    { id: 'dnqp-sturz', titel: 'DNQP: Expertenstandard Sturzprophylaxe in der Pflege, 2. Aktualisierung 2022' },
    { id: 'dnqp-ernaehrung', titel: 'DNQP: Expertenstandard Ernährungsmanagement zur Sicherung und Förderung der oralen Ernährung in der Pflege, 1. Aktualisierung 2017' },
    { id: 'nice-delir', titel: 'NICE CG103: Delirium – prevention, diagnosis and management (aktualisierte Fassung 2023)' },
    { id: 'priscus', titel: 'PRISCUS 2.0 – potenziell inadäquate Medikation für ältere Menschen (2023)' },
  ],

  person: {
    name: 'Frau Lindner',
    alter: { jahre: 84 },
    geschlecht: 'w',
    biografie: ['lebt allein im 2. Stock, Tochter wohnt 20 km entfernt', 'ehemalige Grundschullehrerin', 'liest gern Zeitung, legt Wert auf Ordnung'],
    diagnosenBekannt: ['Herzinsuffizienz (NYHA II)', 'arterielle Hypertonie', 'chronisches Venenleiden', 'Pflegegrad 2'],
    medikamentePlan: ['Torasemid 10 mg 1-0-0', 'Ramipril 5 mg 1-0-0', 'Pantoprazol 20 mg 1-0-0'],
    allergien: ['keine bekannt'],
    hilfsmittel: ['Rollator', 'Hausnotruf (nicht getragen)'],
    gewichtKg: 58,
  },
  medien: {
    raum: '07_ambulant_wohnzimmer_kompression',   // Platzhalter: Foto „Wohnzimmer, Frau sitzt am Boden neben Sessel“ bestellen
    raumVarianten: [],
  },
  uebernahme: 'Frau Lindner, 84, Pflegegrad 2. Wir ziehen morgens die Kompressionsstrümpfe an und geben die Tabletten aus dem Dosett. Die Tochter hat gestern angerufen: Ihre Mutter trinke „wegen der Wassertablette“ kaum, damit sie nachts nicht so oft raus muss.',
  startUhrzeit: '08:10',

  start: {
    // volumen 0.8 (Exsikkose, Torasemid), gefaesstonus 0.92 (Ramipril): Modell zeigt etwa RR 98/62, HF 109 wie in den Befundtexten
    grund: { volumen: 0.8, gefaesstonus: 0.92, hydratation: 0.78, orientierung: 0.55, delir: 0.35, unruhe: 0.2, schmerz: 3, angst: 0.4, temperatur: 37.4, blutzucker: 128 },
    treiber: [
      { art: 'exsikkose_progressiv', verlustProStunde: 0.01 },
      { art: 'delir_trigger', ausloeser: ['exsikkose', 'schmerz'] },
    ],
    bild: { haltung: 'am-boden', haut: 'trocken', mimik: 'verwirrt' },
    sichtbar: [],                                   // ambulant: nichts gemessen, Geräte aus der Pflegetasche
    anordnungen: ['an-plan', 'an-bedarf'],
  },

  massnahmen: [
    // Gespräch & Beobachten
    'ansprechen-orientierung', 'ersteindruck-abcde', 'verletzung-pruefen-sturz', 'kopf-pruefen', 'schmerz-nrs',
    'schleimhaut-pruefen', 'hautturgor-pruefen', 'urin-beobachten', 'trinkmenge-erfragen', 'delir-screening-4at',
    // Akut & Sicherheit
    'sitzend-sichern', 'aufhelfen-stuhltechnik', 'sofort-hochziehen', 'notruf-112', 'hausnotruf-anlegen',
    // Messen (Pflegetasche)
    'pulsoxy-anlegen', 'rr-messen', 'puls-zaehlen', 'temperatur-ohr', 'bz-messen', 'dosett-pruefen',
    // Versorgen
    'trinken-anbieten', 'tabletten-wie-geplant-geben', 'bedarfsmedikation-oral', 'lorazepam-geben', 'torasemid-zurueckhalten', 'kompression-anziehen', 'umgebung-sichern',
    // Melden
    'tochter-informieren', 'pflegebericht', 'pdl-informieren',
  ],
  massnahmenZusatz: [
    {
      id: 'sofort-hochziehen', name: 'Sofort unter den Armen hochziehen', reiter: 'akut', spur: 'A', zeitbedarfSekunden: 30,
      befugnis: { 1: 'selbst', 2: 'selbst', 3: 'selbst', pflegefachperson: 'selbst' },
      kompetenzbereiche: ['I', 'V'],
    },
    {
      id: 'aufhelfen-stuhltechnik', name: 'Aufhelfen über Vierfüßlerstand und Stuhl', reiter: 'akut', spur: 'A', zeitbedarfSekunden: 120,
      befugnis: { 1: 'mit-anleitung', 2: 'selbst', 3: 'selbst', pflegefachperson: 'selbst' },
      voraussetzung: { getan: 'verletzung-pruefen-sturz' },
      setzt: ['sitzt-im-sessel'],
      kompetenzbereiche: ['I', 'V'],
      quellen: [{ id: 'dnqp-sturz', titel: 'DNQP Sturzprophylaxe' }],
    },
  ],

  akte: {
    aufnahmegrund: 'Häusliche Versorgung seit 03/2025 nach Krankenhausaufenthalt (kardiale Dekompensation): Kompressionsstrümpfe morgens, Medikamente aus dem Wochendosett, Unterstützung bei der Körperpflege 2×/Woche.',
    anamnese: [
      'Lebt allein im 2. Stock ohne Aufzug, Tochter (Frau Brandt) wohnt 20 km entfernt und kommt am Wochenende.',
      'Geht in der Wohnung mit Rollator, draußen nur in Begleitung. Ein Sturz im Februar ohne Verletzung.',
      'Trinkt laut eigener Aussage „wegen der Wassertablette“ wenig, damit sie nachts nicht raus muss.',
      'Bisher zu Zeit, Ort und Person orientiert, liest täglich Zeitung.',
    ],
    diagnosen: [
      { text: 'Herzinsuffizienz NYHA II', icd: 'I50.12', seit: '2024' },
      { text: 'Arterielle Hypertonie', icd: 'I10.90', seit: '2009' },
      { text: 'Chronische venöse Insuffizienz', icd: 'I87.2', seit: '2016' },
      { text: 'Refluxkrankheit', icd: 'K21.9', seit: '2019' },
      { text: 'Chronische Nierenkrankheit Stadium 3a', icd: 'N18.3', seit: '2024' },
    ],
    medikation: [
      { id: 'mp-torasemid', wirkstoff: 'Torasemid', staerke: '10 mg', form: 'Tbl.', schema: '1-0-0-0', massnahme: 'tabletten-wie-geplant-geben', zuletzt: 'gestern 08:10',
        hinweis: 'Diuretikum. Bei Schwindel, niedrigem RR oder wenig Trinken Rücksprache mit der Hausärztin.', geaendertDurch: 'an-torasemid-pause' },
      { id: 'mp-ramipril', wirkstoff: 'Ramipril', staerke: '5 mg', form: 'Tbl.', schema: '1-0-0-0', massnahme: 'tabletten-wie-geplant-geben', zuletzt: 'gestern 08:10',
        hinweis: 'Vor Gabe RR messen; bei RR systolisch unter 100 Rücksprache.' },
      { id: 'mp-pantoprazol', wirkstoff: 'Pantoprazol', staerke: '20 mg', form: 'Tbl.', schema: '1-0-0-0', massnahme: 'tabletten-wie-geplant-geben', zuletzt: 'gestern 08:10',
        hinweis: 'Vor dem Frühstück.' },
      { id: 'mp-paracetamol', wirkstoff: 'Paracetamol', staerke: '500 mg', form: 'Tbl.', massnahme: 'bedarfsmedikation-oral', zuletzt: 'gestern 21:00',
        bedarf: { indikation: 'Schmerzen (z. B. Gelenke, Kopf)', einzeldosis: '500 mg', maxProTag: '4 Gaben', abstandH: 6 },
        hinweis: 'Nimmt sie abends selbst aus der Hausapotheke; letzte Einnahme laut Tochter.' },
    ],
    vorwerte: [
      { zeit: 'vor 7 Tagen', vorH: 168, werte: { rrSys: 142, rrDia: 86, hf: 72, temp: 36.5, gewicht: 59.4 }, kuerzel: 'MH' },
      { zeit: 'vor 3 Tagen', vorH: 72, werte: { rrSys: 138, rrDia: 84, hf: 76, gewicht: 58.6 }, kuerzel: 'SK' },
      { zeit: 'gestern 08:15', vorH: 24, werte: { rrSys: 128, rrDia: 78, hf: 84, temp: 36.8, schmerz: 1 }, kuerzel: 'SK' },
    ],
    pflegebericht: [
      { zeit: 'vor 3 Tagen 08:30', wer: 'SK', text: 'Kompressionsstrümpfe angezogen, Haut an den Unterschenkeln intakt. Klientin gut gelaunt, erzählt von ihrer Enkelin.' },
      { zeit: 'gestern 08:20', wer: 'SK', text: 'Medikamente aus dem Dosett gegeben. Klientin wirkt müde, sagt, sie habe schlecht geschlafen. Trinkflasche vom Vortag kaum angerührt. Auf Trinken hingewiesen, sie lehnt ab („sonst muss ich nachts raus“). RR 128/78.' },
      { zeit: 'gestern 17:40', wer: 'Tochter (Telefon)', text: 'Tochter ruft im Büro an: Mutter trinke seit Tagen kaum, sei aber am Telefon klar. Bitte morgen darauf achten. Info an Frühtour weitergegeben (PDL).' },
    ],
    aerztlicheAnordnungen: [
      { zeit: '12.03.', wer: 'Dr. Sommer', text: 'Medikationsplan (Torasemid, Ramipril, Pantoprazol morgens; Paracetamol bei Bedarf). Behandlungspflege: Medikamentengabe, Kompressionsstrümpfe AD Kl. II morgens an, abends aus.' },
      { zeit: '12.03.', wer: 'Dr. Sommer', text: 'Gewicht 1×/Woche; Zunahme über 2 kg in 3 Tagen oder Atemnot melden.' },
    ],
    assessments: [
      { name: 'Sturzrisiko (Risikofaktoren nach Expertenstandard)', wert: 'erhöht', datum: 'vor 4 Wochen', hinweis: 'Sturz in der Vorgeschichte, Diuretikum, Gangunsicherheit, Hausnotruf wird nicht getragen.' },
      { name: 'Barthel-Index', wert: '70 von 100', datum: 'vor 4 Wochen' },
      { name: 'Braden-Skala', wert: '19 Punkte (kein erhöhtes Risiko)', datum: 'vor 4 Wochen' },
      { name: 'MNA-SF (Ernährung)', wert: '10 Punkte (Risiko für Mangelernährung)', datum: 'vor 4 Wochen', hinweis: 'Trinkmenge geschätzt unter 1 l am Tag.' },
    ],
    labor: [
      { name: 'Natrium', wert: '136', einheit: 'mmol/l', norm: '135–145', datum: 'vor 3 Wochen (Hausärztin)' },
      { name: 'Kalium', wert: '4,1', einheit: 'mmol/l', norm: '3,5–5,0', datum: 'vor 3 Wochen (Hausärztin)' },
      { name: 'Kreatinin', wert: '1,2', einheit: 'mg/dl', norm: '0,5–1,0', datum: 'vor 3 Wochen (Hausärztin)', auffaellig: true },
      { name: 'eGFR', wert: '44', einheit: 'ml/min', norm: 'über 60', datum: 'vor 3 Wochen (Hausärztin)', auffaellig: true },
    ],
    pflegeplanung: [
      { problem: 'Gefahr eines Flüssigkeitsdefizits: trinkt bewusst wenig wegen nächtlicher Toilettengänge', ziel: 'Trinkt tagsüber mindestens 1,3 l, abends weniger', massnahmen: ['Getränke morgens bereitstellen', 'Trinkplan mit Schwerpunkt vormittags besprechen', 'Tochter einbeziehen'] },
      { problem: 'Erhöhtes Sturzrisiko (Diuretikum, Gangunsicherheit)', ziel: 'Bleibt sturzfrei, trägt den Hausnotruf', massnahmen: ['Hausnotruf an das Tragen erinnern', 'Wege frei halten, Rollator in Reichweite', 'Nachtlicht'] },
      { problem: 'Chronische venöse Insuffizienz', ziel: 'Haut der Unterschenkel bleibt intakt', massnahmen: ['Kompressionsstrümpfe AD Kl. II morgens', 'Hautinspektion beim An- und Ausziehen'] },
    ],
    rechtliches: [
      'Vorsorgevollmacht für Gesundheit und Aufenthalt: Tochter, Frau Brandt (liegt in Kopie in der Pflegemappe).',
      'Schweigepflichtentbindung: Auskunft an die Tochter erlaubt.',
      'Patientenverfügung vorhanden: keine Wiederbelebung im Endstadium einer schweren Erkrankung; Krankenhausbehandlung grundsätzlich erwünscht.',
    ],
  },

  befunde: [
    { massnahme: 'ansprechen-orientierung', varianten: [
      { text: '„Ach, Sie sind schon da? Ich wollte nur kurz … ich bin nur hingesessen.“ Sie weiß nicht, welcher Tag ist, und hält dich für ihre Enkelin.' },
    ] },
    { massnahme: 'verletzung-pruefen-sturz', varianten: [
      { text: 'Keine sichtbare Wunde. Schmerzen rechte Hüfte bei Bewegung (NRS 3). Beine gleich lang, nicht nach außen gedreht, kann das rechte Bein anheben. Kopfanprall wird verneint, kein Hämatom am Kopf.' },
    ] },
    { massnahme: 'schleimhaut-pruefen', varianten: [{ text: 'Zunge trocken und borkig, Lippen rissig. Achselhöhlen trocken.' }] },
    { massnahme: 'hautturgor-pruefen', varianten: [{ text: 'Hautfalte am Handrücken bleibt kurz stehen. Achtung: im Alter wenig aussagekräftig, zusammen mit anderen Zeichen deuten.' }] },
    { massnahme: 'trinkmenge-erfragen', varianten: [{ text: '„Ein Tässchen Kaffee am Morgen, sonst muss ich ja dauernd …“ Auf dem Tisch steht eine volle Wasserflasche von gestern.' }] },
    { massnahme: 'urin-beobachten', varianten: [{ text: 'Im Toiletteneimer wenig, sehr dunkler, konzentrierter Urin.' }] },
    { massnahme: 'rr-messen', varianten: [
      { wenn: { wert: 'rrSys', vergleich: '>=', grenze: 125 }, text: 'RR {rrSys}/{rrDia} mmHg (laut Dokumentation sonst um 140/85).', zeigt: ['rrSys', 'rrDia'] },
      { text: 'RR {rrSys}/{rrDia} mmHg – deutlich unter ihren üblichen Werten um 140/85.', zeigt: ['rrSys', 'rrDia'] },
    ] },
    { massnahme: 'puls-zaehlen', varianten: [{ text: 'Puls {hf}/min, regelmäßig, eher schwach tastbar.', zeigt: ['hf'] }] },
    { massnahme: 'pulsoxy-anlegen', varianten: [{ text: 'SpO₂ {spo2} %, Puls {hf}.', zeigt: ['spo2', 'hf'] }] },
    { massnahme: 'temperatur-ohr', varianten: [{ text: '{temp} °C.', zeigt: ['temp'] }] },
    { massnahme: 'bz-messen', varianten: [
      { wenn: { wert: 'bz', vergleich: '<', grenze: 70 }, text: 'BZ {bz} mg/dl – Unterzuckerung!', zeigt: ['bz'] },
      { text: 'BZ {bz} mg/dl – keine Unterzuckerung.', zeigt: ['bz'] },
    ] },
    { massnahme: 'delir-screening-4at', varianten: [{ text: '4AT: Wachheit normal (0), AMT4 zwei Fehler (2), Monate rückwärts nicht möglich (2), akuter Beginn laut Tochter ja (4) = 8 Punkte → Delir wahrscheinlich.' }] },
    { massnahme: 'bedarfsmedikation-oral', varianten: [{ text: 'Du gibst eine Tablette Paracetamol 500 mg mit einem Glas Wasser.' }] },
    { massnahme: 'dosett-pruefen', varianten: [{ text: 'Dosett: Gestern und vorgestern Morgen wurden alle Tabletten genommen, Mittag/Abend leer wie vorgesehen.' }] },
  ],

  gespraech: [
    { id: 'g-wie-passiert', frage: 'Was ist passiert?', an: 'patient', kompetenzbereiche: ['I', 'II'],
      antwort: [{ text: '„Mir war so schwummrig beim Aufstehen, da hab ich mich lieber hingesetzt.“ Wie lange sie schon sitzt, weiß sie nicht.' }],
      fakten: ['Schwindel beim Aufstehen', 'Zeitpunkt unklar', 'kein Bewusstseinsverlust erinnerlich'] },
    { id: 'g-schmerz', frage: 'Haben Sie irgendwo Schmerzen?', an: 'patient', kompetenzbereiche: ['I'],
      antwort: [{ text: '„Die rechte Hüfte tut ein bisschen weh, wenn ich mich bewege.“' }], fakten: ['Hüfte rechts NRS 3'] },
    { id: 'g-beruhigen', frage: 'Ruhig erklären, dass du bleibst und hilfst', an: 'patient', kompetenzbereiche: ['II'],
      antwort: [{ text: 'Sie wirkt etwas ruhiger und hält deine Hand.' }],
      wirkung: [{ groesse: 'angst', delta: -0.2, beginnSek: 0, spitzeSek: 60, dauerSek: 'dauerhaft' }] },
  ],

  sbar: [
    { id: 's-sturz', teil: 'S', text: 'Frau Lindner, 84, heute Morgen am Boden sitzend vorgefunden, akut verwirrt.', art: 'kern' },
    { id: 's-nur-sturz', teil: 'S', text: 'Frau Lindner ist gestürzt.', art: 'hilfreich' },
    { id: 'b-herz-diuretikum', teil: 'B', text: 'Herzinsuffizienz, nimmt Torasemid und Ramipril, trinkt laut Tochter seit Tagen kaum.', art: 'kern' },
    { id: 'b-lehrerin', teil: 'B', text: 'Sie war früher Grundschullehrerin.', art: 'ablenker' },
    { id: 'a-rr-niedrig', teil: 'A', text: 'RR deutlich unter ihren üblichen Werten (sonst um 140 systolisch), Puls erhöht.', art: 'kern', bekanntWenn: { alle: [{ getan: 'rr-messen' }] } },
    { id: 'a-exsikkose', teil: 'A', text: 'Trockene Schleimhäute, wenig dunkler Urin – ich vermute eine Exsikkose.', art: 'kern', bekanntWenn: ZEICHEN_EXSIKKOSE },
    { id: 'a-verwirrt-neu', teil: 'A', text: 'Zeitlich und örtlich nicht orientiert, laut Tochter gestern noch klar – Verdacht auf Delir.', art: 'kern' },
    { id: 'a-verletzung', teil: 'A', text: 'Keine Zeichen einer Hüftfraktur, kein Kopfanprall, Schmerz Hüfte NRS 3.', art: 'kern', bekanntWenn: { getan: 'verletzung-pruefen-sturz' } },
    { id: 'a-demenz', teil: 'A', text: 'Sie ist wohl einfach dement geworden.', art: 'falsch' },
    { id: 'r-hausbesuch', teil: 'R', text: 'Bitte kommen Sie heute zum Hausbesuch. Soll das Torasemid heute pausiert werden?', art: 'kern' },
    { id: 'r-kh', teil: 'R', text: 'Soll ich einen Krankentransport bestellen?', art: 'hilfreich' },
  ],

  anordnungen: [
    { id: 'an-plan', massnahme: 'tabletten-wie-geplant-geben', text: 'Medikamentenplan der Hausärztin (Torasemid, Ramipril, Pantoprazol morgens).' },
    { id: 'an-bedarf', massnahme: 'bedarfsmedikation-oral', text: 'Bedarfsmedikation laut Medikationsplan: Paracetamol 500 mg bei Schmerzen, Abstand mind. 6 h, max. 4 Gaben am Tag.' },
    { id: 'an-torasemid-pause', massnahme: 'torasemid-zurueckhalten', text: 'Torasemid heute nicht geben.' },
    { id: 'an-trinken', massnahme: 'trinken-anbieten', text: 'Trinken fördern, Ziel heute mind. 1,5 l, Trinkprotokoll.' },
    { id: 'an-lorazepam', massnahme: 'lorazepam-geben', text: 'Geben Sie ihr gegen die Unruhe 1 mg Lorazepam aus der Hausapotheke.',
      fehlerhaft: { warum: 'Benzodiazepine können ein Delir bei älteren Menschen verstärken und erhöhen das Sturzrisiko (PRISCUS 2.0). Zudem ist Lorazepam für Frau Lindner nicht verordnet.', korrektur: 'Kein Lorazepam. Reizarm halten, Tochter dazuholen, Arzt kommt um 11 Uhr.' } },
  ],

  arzt: {
    name: 'Hausärztin Dr. Sommer',
    erreichbar: 'hausarzt-praxis',
    regeln: [
      { wenn: { gemeldet: ['a-verwirrt-neu', 'a-rr-niedrig', 'b-herz-diuretikum'] },
        antwort: '„Danke, das klingt nach zu wenig Flüssigkeit. Torasemid heute weglassen, Trinken fördern und Protokoll führen. Ich komme um 11 Uhr vorbei.“',
        anordnungen: ['an-torasemid-pause', 'an-trinken'], setzt: ['arzt-kommt'] },
      { wenn: { gemeldet: ['a-verwirrt-neu'] },
        antwort: '„Ist sie verletzt? Haben Sie Blutdruck gemessen? Rufen Sie mich mit den Werten noch einmal an.“' },
      { wenn: { eine: [{ gemeldet: ['a-demenz'] }, { gemeldet: ['s-nur-sturz'] }] },
        antwort: '„Wenn sie nicht verletzt ist, helfen Sie ihr hoch. Ich schaue nächste Woche mal vorbei.“', setzt: ['arzt-beruhigt'] },
      { wenn: { flag: 'zweiter-anruf-unruhe' },
        antwort: '„Dann geben Sie ihr 1 mg Lorazepam aus der Hausapotheke, damit sie zur Ruhe kommt.“', anordnungen: ['an-lorazepam'] },
    ],
  },

  ereignisse: [
    { id: 'e-tochter', art: 'telefon', wann: { ab: 300 },
      text: 'Die Tochter ruft an: „Ist alles in Ordnung? Gestern Abend war sie am Telefon noch ganz klar.“' },
    { id: 'e-unruhe', art: 'patient', wann: { alle: [{ ab: 600 }, { nicht: { getan: 'trinken-anbieten' } }] },
      text: 'Frau Lindner nestelt an ihrer Bluse und will „zur Schule, die Kinder warten“. Sie versucht aufzustehen.',
      bild: { haltung: 'unruhig', mimik: 'verwirrt' },
      entscheidung: [
        { id: 'w-validieren', text: 'Ruhig auf sie eingehen, Situation erklären, Rollator bereitstellen und bei ihr bleiben', wertung: 'gut', warum: 'Validierende, reizarme Begleitung ist die erste Maßnahme bei Unruhe im Delir; sie senkt Angst und Sturzrisiko.' },
        { id: 'w-festhalten', text: 'Sie an den Schultern zurück in den Sessel drücken', wertung: 'gefaehrlich', warum: 'Körperlicher Zwang verstärkt Angst und Abwehr und ist eine freiheitsentziehende Handlung ohne Grundlage.' },
        { id: 'w-arzt-medis', text: 'Hausärztin erneut anrufen und um ein Beruhigungsmittel bitten', wertung: 'vertretbar', warum: 'Erneut zu informieren ist richtig. Ein Beruhigungsmittel ist aber nicht die erste Wahl.', setzt: ['zweiter-anruf-unruhe'], loestAnrufAus: true },
      ] },
  ],

  pa: {
    name: 'Praxisanleiterin Frau Haas',
    hilfen: [
      { wenn: { nicht: { getan: 'verletzung-pruefen-sturz' } }, impuls: 'Bevor du irgendwas bewegst: Was musst du nach einem Sturz zuerst wissen?', tipp: 'Schau dir Hüfte, Beine und Kopf an, bevor du sie aufhebst.' },
      { wenn: { nicht: { getan: 'trinkmenge-erfragen' } }, impuls: 'Was hat die Tochter gestern am Telefon erzählt?', tipp: 'Frag nach, wie viel sie getrunken hat, und schau dir Zunge und Urin an.' },
      { impuls: 'Ist diese Verwirrtheit neu oder kennst du sie so?', tipp: 'Akut neue Verwirrtheit ist ein Warnzeichen. Ein Screening (z. B. 4AT) hilft dir, das zu begründen.' },
    ],
  },

  bewertung: {
    pflicht: [
      { id: 'p-verletzung-vor-aufhelfen', text: 'Verletzungen geprüft, bevor aufgeholfen wurde', gewicht: 3, kompetenzbereiche: ['I', 'V'],
        erfuellt: { nicht: { getan: 'sofort-hochziehen' } }, warum: 'Eine Hüftfraktur oder Kopfverletzung muss vor dem Aufhelfen ausgeschlossen werden.' },
      { id: 'p-vitalzeichen', text: 'RR und Puls gemessen', gewicht: 2, kompetenzbereiche: ['I'], erfuellt: { alle: [{ getan: 'rr-messen', bis: 420 }, { eine: [{ getan: 'puls-zaehlen' }, { getan: 'pulsoxy-anlegen' }] }] },
        warum: 'Schwindel beim Aufstehen und Sturz: Kreislauf muss eingeschätzt werden.' },
      { id: 'p-exsikkose-zeichen', text: 'Hydratation eingeschätzt (Schleimhäute, Urin, Trinkmenge)', gewicht: 2, kompetenzbereiche: ['I', 'V'],
        erfuellt: { alle: [{ getan: 'schleimhaut-pruefen' }, { eine: [{ getan: 'urin-beobachten' }, { getan: 'trinkmenge-erfragen' }] }] }, warum: 'Hautfalte allein ist im Alter unzuverlässig.' },
      { id: 'p-delir-erkannt', text: 'Akute Verwirrtheit als neu erkannt und gemeldet', gewicht: 3, kompetenzbereiche: ['I', 'III'],
        erfuellt: { gemeldet: ['a-verwirrt-neu'] }, warum: 'Ein Delir ist ein Notfall mit Ursache; „wird halt dement“ übersieht sie.' },
      { id: 'p-arzt-sbar', text: 'Hausärztin mit vollständiger SBAR informiert', gewicht: 3, kompetenzbereiche: ['II', 'III'],
        erfuellt: { flag: 'arzt-kommt' }, warum: 'Nur mit RR, Trinkmenge und Diuretikum kann die Ärztin richtig entscheiden.' },
      { id: 'p-rueckgelesen', text: 'Anordnungen rückgelesen', gewicht: 2, kompetenzbereiche: ['III'],
        erfuellt: { anordnung: 'an-torasemid-pause', rueckgelesen: true }, warum: 'Closed-Loop-Kommunikation verhindert Missverständnisse.' },
      { id: 'p-trinken', text: 'Trinken angeboten und Protokoll begonnen', gewicht: 2, kompetenzbereiche: ['I', 'V'],
        erfuellt: { getan: 'trinken-anbieten' }, warum: 'Expertenstandard Ernährungsmanagement: Flüssigkeit aktiv anbieten und dokumentieren.' },
      { id: 'p-tochter', text: 'Tochter einbezogen', gewicht: 1, kompetenzbereiche: ['II'], erfuellt: { getan: 'tochter-informieren' },
        warum: 'Die Tochter kennt den Normalzustand und kann bei Delir beruhigen und begleiten.' },
      { id: 'p-doku', text: 'Pflegebericht geschrieben', gewicht: 1, kompetenzbereiche: ['I', 'IV'], erfuellt: { getan: 'pflegebericht' }, warum: 'Sturz, Befunde, Anordnungen und Maßnahmen müssen nachvollziehbar sein.' },
    ],
    fehler: [
      { id: 'f-hochziehen', text: 'Ohne Verletzungscheck hochgezogen', schwere: 'schwer', kompetenzbereiche: ['I', 'V'], wenn: { getan: 'sofort-hochziehen' },
        folge: { text: 'Frau Lindner schreit vor Schmerz auf, ihr wird schwarz vor Augen.', wirkung: [{ groesse: 'schmerz', delta: 4, beginnSek: 0, spitzeSek: 5, dauerSek: 600 }] },
        warum: 'Unter den Armen hochziehen gefährdet Patientin (Fraktur, Schulter) und dich (Rücken).' },
      { id: 'f-torasemid', text: 'Torasemid trotz Exsikkose-Zeichen ohne Rücksprache gegeben', schwere: 'mittel', kompetenzbereiche: ['I', 'III'],
        wenn: { alle: [{ getan: 'tabletten-wie-geplant-geben' }, { nicht: { anordnung: 'an-torasemid-pause' } }] },
        folge: { text: 'Der Blutdruck sinkt weiter, ihr wird beim Aufsetzen schwindelig.', wirkung: [{ groesse: 'volumen', delta: -0.06, beginnSek: 900, spitzeSek: 2700, dauerSek: 'dauerhaft' }] },
        warum: 'Ein Diuretikum bei Exsikkose und niedrigem Blutdruck verschlimmert beides. Vorher Rücksprache halten.' },
      { id: 'f-lorazepam', text: 'Lorazepam ohne Nachfrage gegeben', schwere: 'schwer', kompetenzbereiche: ['III', 'IV', 'V'],
        wenn: { getan: 'lorazepam-geben' },
        folge: { text: 'Frau Lindner wird schläfrig, später noch verwirrter.', wirkung: [{ groesse: 'vigilanz', delta: -0.3, beginnSek: 600, spitzeSek: 1800, dauerSek: 14400 }, { groesse: 'delir', delta: 0.3, beginnSek: 1800, spitzeSek: 3600, dauerSek: 'dauerhaft' }] },
        warum: 'Remonstrieren wäre richtig gewesen: Benzodiazepine sind bei Delir im Alter potenziell gefährlich, und das Medikament ist nicht verordnet.' },
      { id: 'f-allein', text: 'Patientin am Boden allein gelassen (z. B. zum Telefonieren in den Flur)', schwere: 'mittel', kompetenzbereiche: ['I'],
        wenn: { alle: [{ getan: 'anruf-aerztin' }, { nicht: { eine: [{ getan: 'sitzend-sichern' }, { flag: 'sitzt-im-sessel' }] } }] },
        warum: 'Vor dem Telefonat sichern: bequem sitzend, warm, Hilfe in Reichweite.' },
    ],
    ende: [
      { wenn: { alle: [{ flag: 'arzt-kommt' }, { getan: 'pflegebericht' }] }, text: 'Die Hausärztin kommt um 11 Uhr. Frau Lindner sitzt im Sessel mit einem Glas Wasser, die Tochter ist auf dem Weg.', ausgang: 'stabil' },
      { wenn: { ab: 1800 }, text: 'Die Tour muss weiter. Die Lage ist nicht geklärt.', ausgang: 'verschlechtert' },
    ],
  },

  pflegebedarf: {
    probleme: [
      { id: 'pb-fluessigkeit', text: 'Flüssigkeitsdefizit (zu geringe Trinkmenge, Diuretikum)', richtig: true, prioritaet: 1, warum: 'Ursache für Schwindel, Sturz und Verwirrtheit.' },
      { id: 'pb-verwirrtheit', text: 'Akute Verwirrtheit (Verdacht auf Delir)', richtig: true, prioritaet: 1, warum: 'Neu aufgetreten, gefährdet Sicherheit und Selbstversorgung.' },
      { id: 'pb-sturzrisiko', text: 'Erhöhtes Sturzrisiko (Schwindel, Hausnotruf nicht getragen)', richtig: true, prioritaet: 2, warum: 'Erneuter Sturz wahrscheinlich, solange Ursachen bestehen.' },
      { id: 'pb-schmerz', text: 'Akuter Schmerz rechte Hüfte', richtig: true, prioritaet: 3, warum: 'Beobachten, bei Zunahme ärztlich abklären.' },
      { id: 'pb-obstipation', text: 'Obstipation', richtig: false, warum: 'Dafür gibt es in dieser Situation keinen Hinweis.' },
      { id: 'pb-dekubitus', text: 'Dekubitus Kategorie 2', richtig: false, warum: 'Kein Befund an der Haut; Risiko höchstens nach langem Liegen zu prüfen.' },
    ],
    ziele: [
      { id: 'z-trinken', text: 'Frau Lindner trinkt heute mindestens 1,5 l (Protokoll).', passtZu: ['pb-fluessigkeit'], richtig: true },
      { id: 'z-orientiert', text: 'Frau Lindner ist innerhalb von 48 h wieder zu Ort und Zeit orientiert.', passtZu: ['pb-verwirrtheit'], richtig: true },
      { id: 'z-notruf', text: 'Frau Lindner trägt den Hausnotruf am Handgelenk.', passtZu: ['pb-sturzrisiko'], richtig: true },
      { id: 'z-bettruhe', text: 'Frau Lindner bleibt bis auf Weiteres im Bett.', passtZu: ['pb-sturzrisiko'], richtig: false },
    ],
  },

  leitfaden: [
    { titel: 'Was im Körper passiert', text: 'Im Alter lässt das Durstgefühl nach. Wer aus Angst vor nächtlichen Toilettengängen wenig trinkt und zugleich ein Diuretikum nimmt, verliert Volumen. Der Blutdruck sinkt, beim Aufstehen fehlt Blut im Gehirn (Schwindel, Sturz). Flüssigkeitsmangel ist eine häufige Ursache für ein Delir.', quellen: ['dnqp-ernaehrung', 'nice-delir'] },
    { titel: 'Nach dem Sturz', text: 'Ansprechen, Ruhe bewahren, Verletzungen (Hüfte, Kopf, Handgelenke) prüfen, Vitalzeichen. Erst dann rückenschonend über Vierfüßlerstand und Stuhl aufhelfen. Sturzereignis dokumentieren und Ursachen suchen.', quellen: ['dnqp-sturz'] },
    { titel: 'Delir erkennen', text: 'Akuter Beginn, schwankender Verlauf, gestörte Aufmerksamkeit. Angehörige kennen den Normalzustand. Screening (4AT, Nu-DESC) macht die Beobachtung begründbar. Delir ist ein Notfall mit Ursache.', quellen: ['nice-delir'] },
    { titel: 'Remonstration', text: 'Pflegende tragen die Durchführungsverantwortung. Eine Anordnung, die du für gefährlich hältst, musst du hinterfragen. Benzodiazepine gehören bei älteren Menschen auf die PRISCUS-Liste.', quellen: ['priscus'] },
  ],

  pruefwege: {
    muster: [
      { art: 'massnahme', id: 'ansprechen-orientierung' },
      { art: 'frage', id: 'g-beruhigen' },
      { art: 'massnahme', id: 'verletzung-pruefen-sturz' },
      { art: 'massnahme', id: 'sitzend-sichern' },
      { art: 'pflegetasche', geraet: 'rr-geraet' },
      { art: 'massnahme', id: 'rr-messen' },
      { art: 'massnahme', id: 'puls-zaehlen' },
      { art: 'massnahme', id: 'schleimhaut-pruefen' },
      { art: 'massnahme', id: 'trinkmenge-erfragen' },
      { art: 'massnahme', id: 'trinken-anbieten' },
      { art: 'massnahme', id: 'delir-screening-4at' },
      { art: 'massnahme', id: 'aufhelfen-stuhltechnik' },
      { art: 'anruf', an: 'aerztin', sbar: ['s-sturz', 'b-herz-diuretikum', 'a-rr-niedrig', 'a-exsikkose', 'a-verwirrt-neu', 'a-verletzung', 'r-hausbesuch'] },
      { art: 'rueckmelden', anordnung: 'an-torasemid-pause', rueckgelesen: true },
      { art: 'rueckmelden', anordnung: 'an-trinken', rueckgelesen: true },
      { art: 'massnahme', id: 'torasemid-zurueckhalten' },
      { art: 'massnahme', id: 'tochter-informieren' },
      { art: 'massnahme', id: 'pflegebericht' },
      { art: 'abschluss', probleme: ['pb-fluessigkeit', 'pb-verwirrtheit', 'pb-sturzrisiko', 'pb-schmerz'], ziele: ['z-trinken', 'z-orientiert', 'z-notruf'],
        sbar: ['s-sturz', 'b-herz-diuretikum', 'a-rr-niedrig', 'a-exsikkose', 'a-verwirrt-neu', 'a-verletzung'] },
    ],
    unterlassung: { bisSek: 1800, erwartet: { wert: 'delir', vergleich: '>', grenze: 0.5 } },
    grenze: { rolle: 1, events: [{ art: 'massnahme', id: 'tabletten-wie-geplant-geben' }], erwartet: 'pa-eingriff' },
  },
};
