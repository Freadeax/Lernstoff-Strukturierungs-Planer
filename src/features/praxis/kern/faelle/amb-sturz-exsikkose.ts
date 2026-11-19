// Pilotfall Spur A · ambulant: Sturz, Exsikkose, beginnendes Delir (Entwurf, fachlich UNGEPRÜFT)
// Erster Fall auf dem neuen Kern (Pilotstaffel E6). Inhalte fiktiv/didaktisch.

import type { Bedingung, FallV2 } from '../typen';

const ZEICHEN_EXSIKKOSE: Bedingung = { alle: [{ getan: 'schleimhaut-pruefen' }, { getan: 'rr-messen' }] };
const HAUSBESUCH = '„Danke, der Zucker ist in Ordnung. Das klingt nach zu wenig Flüssigkeit. Torasemid heute weglassen, Trinken fördern und Protokoll führen. Ich komme um 11 Uhr vorbei. Messen Sie bitte in einer Viertelstunde noch einmal den Blutdruck und schicken Sie mir den Wert.“';

export const PILOT_AMBULANT: FallV2 = {
  schema: 2,
  id: 'amb-sturz-exsikkose',
  version: '0.2.0',
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
    anordnungen: ['an-plan'],
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
    'trinken-anbieten', 'tabletten-wie-geplant-geben', 'lorazepam-geben', 'torasemid-zurueckhalten', 'kompression-anziehen', 'umgebung-sichern',
    // Melden
    'pflegebericht', 'pdl-informieren',
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
    // Runde 2 (P11): Angehörige mit Schweigepflicht
    { id: 'g-einwilligung', frage: 'Fragen, ob du ihre Tochter informieren darfst', an: 'patient', kompetenzbereiche: ['II', 'IV'],
      antwort: [{ text: '„Die Anke? Ja, rufen Sie sie ruhig an. Die macht sich sonst Sorgen.“', setzt: ['einwilligung-tochter'] }],
      fakten: ['Tochter heißt Anke', 'Frau Lindner ist einverstanden'] },
    { id: 'g-tochter-lage', frage: 'Tochter anrufen: Lage, Befunde und Arztbesuch mitteilen', an: 'angehoerige', kanal: 'telefon', kompetenzbereiche: ['II', 'IV'],
      schweigepflicht: { erlaubtWenn: { flag: 'einwilligung-tochter' },
        fehlerText: 'Du hast der Tochter Befunde mitgeteilt, ohne Frau Lindner vorher zu fragen. Auch nahe Angehörige brauchen eine Einwilligung (oder eine Vorsorgevollmacht). Frau Lindner ist trotz Verwirrtheit ansprechbar und kann gefragt werden.' },
      antwort: [
        { wenn: { flag: 'arzt-kommt' }, text: '„Danke, dass Sie Bescheid geben. Ich fahre gleich los und bin gegen zehn bei ihr.“', setzt: ['tochter-kommt'] },
        { text: '„Oh je. Soll ich kommen? Was sagt denn die Hausärztin?“' },
      ],
      fakten: ['Tochter wohnt 20 km entfernt', 'gestern Abend am Telefon noch klar', 'Mutter trinkt wenig wegen der Wassertablette'] },
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
    { id: 'an-torasemid-pause', massnahme: 'torasemid-zurueckhalten', text: 'Torasemid heute nicht geben.' },
    { id: 'an-trinken', massnahme: 'trinken-anbieten', text: 'Trinken fördern, Ziel heute mind. 1,5 l, Trinkprotokoll.' },
    { id: 'an-lorazepam', massnahme: 'lorazepam-geben', text: 'Geben Sie ihr gegen die Unruhe 1 mg Lorazepam aus der Hausapotheke.',
      fehlerhaft: { warum: 'Benzodiazepine können ein Delir bei älteren Menschen verstärken und erhöhen das Sturzrisiko (PRISCUS 2.0). Zudem ist Lorazepam für Frau Lindner nicht verordnet.', korrektur: 'Kein Lorazepam. Reizarm halten, Tochter dazuholen, Arzt kommt um 11 Uhr.' } },
  ],

  arzt: {
    name: 'Hausärztin Dr. Sommer',
    erreichbar: 'hausarzt-praxis',
    // Runde 2 (P11): Rückfrage nach dem Zucker, Rückauftrag RR-Kontrolle. Nach dem ersten Kontakt geht auch der Praxis-Messenger.
    regeln: [
      { id: 'r-hausbesuch', wenn: { gemeldet: ['a-verwirrt-neu', 'a-rr-niedrig', 'b-herz-diuretikum', 'wert:bz'] },
        antwort: HAUSBESUCH, anordnungen: ['an-torasemid-pause', 'an-trinken'], setzt: ['arzt-kommt'], auftraege: ['af-rr-kontrolle'] },
      { id: 'r-bz-frage', wenn: { gemeldet: ['a-verwirrt-neu', 'a-rr-niedrig', 'b-herz-diuretikum'] },
        antwort: '„Danke. Bei einer akuten Verwirrtheit muss ich zuerst eine Unterzuckerung ausschließen.“',
        rueckfrage: { text: '„Wie hoch ist der Zucker?“', erwartet: ['wert:bz'], auftrag: 'af-bz' } },
      { wenn: { gemeldet: ['a-verwirrt-neu'] },
        antwort: '„Ist sie verletzt? Haben Sie Blutdruck gemessen? Rufen Sie mich mit den Werten noch einmal an.“' },
      { wenn: { eine: [{ gemeldet: ['a-demenz'] }, { gemeldet: ['s-nur-sturz'] }] },
        antwort: '„Wenn sie nicht verletzt ist, helfen Sie ihr hoch. Ich schaue nächste Woche mal vorbei.“', setzt: ['arzt-beruhigt'] },
      { wenn: { flag: 'zweiter-anruf-unruhe' },
        antwort: '„Dann geben Sie ihr 1 mg Lorazepam aus der Hausapotheke, damit sie zur Ruhe kommt.“', anordnungen: ['an-lorazepam'] },
    ],
    auftraege: [
      { id: 'af-bz', text: 'Blutzucker messen und der Hausärztin melden', erledigt: { getan: 'bz-messen' }, meldung: ['wert:bz'], meldenBinnenSek: 600,
        folge: [{ id: 'r-hausbesuch', wenn: { gemeldet: ['a-verwirrt-neu'] }, antwort: HAUSBESUCH,
          anordnungen: ['an-torasemid-pause', 'an-trinken'], setzt: ['arzt-kommt'], auftraege: ['af-rr-kontrolle'] }] },
      { id: 'af-rr-kontrolle', text: 'In einer Viertelstunde Blutdruck nachmessen und der Hausärztin melden', erledigt: { getan: 'rr-messen' },
        meldung: ['wert:rrSys'], meldenBinnenSek: 1500,
        folge: [
          { wenn: { wert: 'rrSys', vergleich: '>=', grenze: 105 }, antwort: '„Danke, das geht in die richtige Richtung. Weiter trinken lassen, ich bin um 11 bei ihr.“', setzt: ['rr-rueckmeldung'] },
          { wenn: { ab: 0 }, antwort: '„Immer noch niedrig. Sie soll sitzen bleiben und weiter trinken. Wird sie schläfriger oder kaltschweißig, rufen Sie sofort den Rettungsdienst.“', setzt: ['rr-rueckmeldung'] },
        ] },
    ],
  },

  team: { weitere: { angehoerige: 'Tochter Anke Lindner' } },

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
      { wenn: { auftrag: 'af-bz', status: 'offen' }, impuls: 'Was wollte die Hausärztin noch von dir wissen?', tipp: 'Blutzucker messen und ihr den Wert schicken.' },
      { wenn: { alle: [{ auftrag: 'af-rr-kontrolle', status: 'offen' }, { nicht: { auftrag: 'af-rr-kontrolle', status: 'gemeldet' } }] }, impuls: 'Hat die Hausärztin dir noch etwas aufgetragen?', tipp: 'Blutdruck in einer Viertelstunde nachmessen und ihr den Wert schicken.' },
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
        erfuellt: { gesagt: 'a-verwirrt-neu', an: 'aerztin' }, warum: 'Ein Delir ist ein Notfall mit Ursache; „wird halt dement“ übersieht sie.' },
      { id: 'p-bz', text: 'Blutzucker bei akuter Verwirrtheit gemessen', gewicht: 2, kompetenzbereiche: ['I'],
        erfuellt: { getan: 'bz-messen' }, warum: 'Eine Unterzuckerung ist eine häufige, schnell behebbare Ursache akuter Verwirrtheit und muss früh ausgeschlossen werden.' },
      { id: 'p-arzt-sbar', text: 'Hausärztin mit vollständiger SBAR informiert', gewicht: 3, kompetenzbereiche: ['II', 'III'],
        erfuellt: { flag: 'arzt-kommt' }, warum: 'Nur mit RR, Trinkmenge und Diuretikum kann die Ärztin richtig entscheiden.' },
      { id: 'p-rueckgelesen', text: 'Anordnungen rückgelesen', gewicht: 2, kompetenzbereiche: ['III'],
        erfuellt: { anordnung: 'an-torasemid-pause', rueckgelesen: true }, warum: 'Closed-Loop-Kommunikation verhindert Missverständnisse.' },
      { id: 'p-trinken', text: 'Trinken angeboten und Protokoll begonnen', gewicht: 2, kompetenzbereiche: ['I', 'V'],
        erfuellt: { getan: 'trinken-anbieten' }, warum: 'Expertenstandard Ernährungsmanagement: Flüssigkeit aktiv anbieten und dokumentieren.' },
      { id: 'p-rueckauftrag', text: 'Rückauftrag der Hausärztin erledigt und gemeldet (RR-Kontrolle)', gewicht: 2, kompetenzbereiche: ['II', 'III'],
        erfuellt: { auftrag: 'af-rr-kontrolle', status: 'gemeldet' }, warum: 'Die Ärztin entscheidet aus der Ferne. Sie braucht die Kontrolle, um den Verlauf einzuschätzen (Closed Loop).' },
      { id: 'p-tochter', text: 'Tochter einbezogen (mit Einverständnis)', gewicht: 1, kompetenzbereiche: ['II', 'IV'],
        erfuellt: { eine: [{ getan: 'tochter-informieren' }, { alle: [{ getan: 'frage:g-tochter-lage' }, { flag: 'einwilligung-tochter' }] }] },
        warum: 'Die Tochter kennt den Normalzustand und kann bei Delir beruhigen und begleiten. Vorher Frau Lindner fragen (Schweigepflicht).' },
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
      { wenn: { alle: [{ flag: 'arzt-kommt' }, { getan: 'pflegebericht' }, { flag: 'rr-rueckmeldung' }] }, text: 'Die Hausärztin kommt um 11 Uhr. Frau Lindner sitzt im Sessel mit einem Glas Wasser, die Tochter ist auf dem Weg.', ausgang: 'stabil' },
      { wenn: { ab: 2700 }, text: 'Die Tour muss weiter. Die Lage ist nicht geklärt.', ausgang: 'verschlechtert' },
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
      { art: 'pflegetasche', geraet: 'bz-geraet' },
      { art: 'massnahme', id: 'bz-messen' },
      { art: 'massnahme', id: 'delir-screening-4at' },
      { art: 'massnahme', id: 'aufhelfen-stuhltechnik' },
      { art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: ['s-sturz', 'b-herz-diuretikum', 'a-rr-niedrig', 'a-exsikkose', 'a-verwirrt-neu', 'a-verletzung', 'wert:bz', 'r-hausbesuch'] },
      { art: 'rueckmelden', anordnung: 'an-torasemid-pause', rueckgelesen: true },
      { art: 'rueckmelden', anordnung: 'an-trinken', rueckgelesen: true },
      { art: 'auflegen', an: 'aerztin' },
      { art: 'massnahme', id: 'torasemid-zurueckhalten' },
      { art: 'frage', id: 'g-einwilligung' },
      { art: 'frage', id: 'g-tochter-lage' },
      { art: 'massnahme', id: 'pflegebericht' },
      { art: 'warten', sek: 600 },
      { art: 'massnahme', id: 'rr-messen' },
      { art: 'nachricht', an: 'aerztin', kanal: 'messenger', bausteine: ['wert:rrSys'] },
      { art: 'warten', sek: 120 },
      { art: 'abschluss', probleme: ['pb-fluessigkeit', 'pb-verwirrtheit', 'pb-sturzrisiko', 'pb-schmerz'], ziele: ['z-trinken', 'z-orientiert', 'z-notruf'],
        sbar: ['s-sturz', 'b-herz-diuretikum', 'a-rr-niedrig', 'a-exsikkose', 'a-verwirrt-neu', 'a-verletzung'] },
    ],
    unterlassung: { bisSek: 1800, erwartet: { wert: 'delir', vergleich: '>', grenze: 0.5 } },
    grenze: { rolle: 1, events: [{ art: 'massnahme', id: 'tabletten-wie-geplant-geben' }], erwartet: 'pa-eingriff' },
  },
};
