// Fallwelle P17b (CE 04) · ambulant: dekompensierte Herzinsuffizienz nach ausgelassenem Diuretikum, Schulung Selbstkontrolle.
// Migriert aus dem Altfall „herzschwaeche“ (scenarios.json) und fachlich neu geschrieben. Entwurf, fachlich UNGEPRÜFT.

import { KATALOG } from '../katalog';
import type { ArztRegel, FallV2, MassnahmeDefinition } from '../typen';

const aus = (id: string, mehr: Partial<MassnahmeDefinition>): MassnahmeDefinition => ({ ...KATALOG[id]!, ...mehr });

const HAUSBESUCH: ArztRegel = {
  id: 'r-hausbesuch',
  wenn: { gemeldet: ['a-atemnot', 'a-gewicht', 'wert:spo2'] },
  antwort: '„Danke, das klingt nach Wassereinlagerung, weil das Torasemid am Wochenende gefehlt hat. Er soll jetzt die Tablette von heute nehmen und zusätzlich noch einmal 10 mg Torasemid. Oberkörper hoch, Beine tief. Und ziehen Sie ihm die Kompressionsstrümpfe wie immer an, wegen der dicken Beine. Ich komme um 12 Uhr. Schicken Sie mir bitte in 20 Minuten Sättigung und Atemfrequenz.“',
  anordnungen: ['an-torasemid-zusatz', 'an-herzbett', 'an-kompression'],
  setzt: ['arzt-informiert'],
  auftraege: ['af-kontrolle'],
};

export const AMB_HERZSCHWAECHE: FallV2 = {
  schema: 2,
  id: 'amb-herzschwaeche',
  version: '0.1.0',
  spur: 'A',
  setting: 'ambulant',
  altersgruppe: 'hochbetagt',
  titel: '„Die Schuhe passen nicht mehr“',
  kurz: 'Hausbesuch: 81-Jähriger mit Herzschwäche hat im Sessel geschlafen, Beine dick, Atemnot beim Sprechen.',
  rahmen: 'Montagmorgen, ambulanter Pflegedienst. Du kommst mit deiner Praxisanleitung zu Herrn Petersen (Kompressionsstrümpfe, Wochendosett richten).',
  lernziele: [
    'Zeichen einer Verschlechterung bei Herzinsuffizienz erkennen (Gewicht, Ödeme, Atemnot im Liegen).',
    'Gewicht mit dem Gewichtsprotokoll vergleichen und die Ursache (ausgelassenes Diuretikum) erfragen.',
    'Sofortmaßnahmen ohne Schaden wählen: Herzbettlage, keine Kompression, keine zusätzliche Trinkmenge.',
    'Die Hausärztin strukturiert informieren und eine ungeeignete Anordnung (Kompression bei Dekompensation) hinterfragen.',
    'Zu täglicher Gewichtskontrolle und Warnzeichen schulen und den Willen des Patienten achten.',
  ],
  lehrplan: {
    ce: ['ce.04', 'ce.02'],
    abschnitt: ['ad12', 'ad3'],
    themen: ['thema.kl.herz.insuffizienz', 'thema.kom.beratung', 'thema.fa.ambulant', 'thema.beo.vitalzeichen'],
    kompetenzen: ['I.2.a', 'II.2.a', 'II.2.b', 'II.2.c', 'III.2.f'],
  },
  geeignet: { rollen: [2, 3], stufen: [1, 2, 3] },
  dauerMin: [12, 18],
  freigabe: {
    status: 'entwurf',
    pruefpunkte: [
      'Zusätzliche Torasemid-Dosis als telefonische Anordnung: Ablauf (schriftlich nachreichen) und Dosis plausibel?',
      'Kompression bei dekompensierter Herzinsuffizienz als Remonstrationspunkt fachlich prüfen (AWMF S2k Kompressionstherapie)',
      'Warnzeichen und Gewichtsgrenze (> 2 kg in 3 Tagen) gegen NVL Chronische Herzinsuffizienz prüfen',
      'Patientenwille: Ablehnung Krankenhaus bei Einwilligungsfähigkeit, Notfallplan',
    ],
  },
  quellen: [
    { id: 'nvl-hi', titel: 'Nationale VersorgungsLeitlinie Chronische Herzinsuffizienz, 4. Auflage 2023 (Version 1)', fundstelle: 'Kapitel Selbstmanagement, Gewichtskontrolle, Warnzeichen' },
    { id: 'esc-hi', titel: 'ESC Guidelines for the management of heart failure, 2026', fundstelle: 'Patientenschulung und Selbstpflege; Gewichtsgrenze aus NVL Herzinsuffizienz und ESC 2021/2023 beibehalten' },
    { id: 'awmf-kompression', titel: 'AWMF S2k-Leitlinie Kompressionstherapie der Extremitäten (037-005), Version 5.0, 2026', fundstelle: 'Kontraindikationen: dekompensierte Herzinsuffizienz' },
    { id: 'dnqp-mobilitaet', titel: 'DNQP Expertenstandard Mobilität: Erhaltung und Förderung der Mobilität in der Pflege, Aktualisierung 2020 (nie in Kraft gesetzt, fachlicher Hintergrund)' },
  ],

  person: {
    name: 'Herr Petersen',
    alter: { jahre: 81 },
    geschlecht: 'm',
    biografie: ['lebt allein im 2. Stock, Tochter wohnt 40 km entfernt', 'früher Busfahrer', 'war am Wochenende auf dem 18. Geburtstag seiner Enkelin'],
    diagnosenBekannt: ['Herzinsuffizienz (HFrEF, NYHA II–III)', 'Vorhofflimmern', 'arterielle Hypertonie', 'chronische Nierenkrankheit Stadium 3a', 'Pflegegrad 2'],
    medikamentePlan: ['Torasemid 10 mg 1-0-0', 'Bisoprolol 2,5 mg 1-0-0', 'Ramipril 5 mg 1-0-0', 'Apixaban 5 mg 1-0-1'],
    allergien: ['Penicillin (Ausschlag)'],
    hilfsmittel: ['Personenwaage', 'Gewichtsprotokoll', 'Kompressionsstrümpfe AD Kl. II'],
    gewichtKg: 84,
  },
  medien: {
    raum: '09_ambulant_kueche_diabetes',   // Beispielbild Küche; eigenes Foto „Küche, älterer Mann mit Atemnot, dicke Beine“ bestellt
    raumVarianten: [],
  },
  uebernahme: 'Herr Petersen, 81, Herzinsuffizienz und Vorhofflimmern. Wir kommen Montag, Mittwoch und Freitag: Kompressionsstrümpfe, Dosett für die Woche richten. Am Wochenende nimmt er seine Tabletten selbst. Gewichtsprotokoll liegt auf dem Küchentisch.',
  startUhrzeit: '07:45',

  start: {
    // pumpleistung 0.72 (HFrEF), volumen 1.18 (Wassereinlagerung), gasaustausch 0.87 (Stauung): Modell etwa SpO₂ 92, AF 26, HF um 90 (Betablocker)
    grund: { pumpleistung: 0.72, volumen: 1.18, gefaesstonus: 1.08, gasaustausch: 0.56, atemarbeit: 1.5, angst: 0.45, schmerz: 1, temperatur: 36.7, blutzucker: 118, orientierung: 1 },
    treiber: [],
    bild: { haltung: 'sitzt-ringt', haut: 'blass', mimik: 'angst' },
    sichtbar: [],
    anordnungen: ['an-plan'],
  },

  massnahmen: [
    // Gespräch
    'vorstellen-einverstaendnis', 'beschwerden-erfragen', 'trinkmenge-erfragen', 'beruhigen-zusprechen', 'patientenwille-erfragen', 'schulung-hi',
    // Beobachten
    'ersteindruck-abcde', 'atmung-beobachten', 'atemgeraeusche-hoeren', 'oedeme-pruefen', 'haut-beobachten', 'bewusstsein-avpu',
    // Akut
    'herzbettlage', 'flachlagern-beine-hoch', 'notruf-112',
    // Messen
    'pulsoxy-anlegen', 'af-zaehlen', 'rr-messen', 'puls-zaehlen', 'temperatur-ohr', 'gewicht-messen', 'dosett-pruefen',
    // Versorgen
    'kompression-anziehen', 'kompression-ausziehen', 'viel-trinken', 'tabletten-wie-geplant-geben', 'torasemid-zusatz',
    // Melden
    // Angehörige nur über das Gespräch g-tochter-lage (mit Einwilligung), keine zweite Abkürzung (Review #282)
    'pflegebericht', 'pdl-informieren',
  ],
  massnahmenZusatz: [
    aus('oberkoerper-hoch', { id: 'herzbettlage', name: 'Herzbettlage: Oberkörper hoch, Beine tief (im Sessel/Stuhl)', setzt: ['herzbett'] }),
    aus('trinken-anbieten', {
      id: 'viel-trinken', name: 'Viel trinken lassen, „damit die Nieren besser arbeiten“',
      wirkung: [{ groesse: 'volumen', delta: 0.03, beginnSek: 60, spitzeSek: 900, dauerSek: 'dauerhaft' }],
    }),
    aus('schulen-selbstmanagement', {
      id: 'schulung-hi', name: 'Gewichtstagebuch und Warnzeichen besprechen (täglich wiegen, mehr als 2 kg in 3 Tagen melden)',
      voraussetzung: { getan: 'gewicht-messen' },
    }),
    aus('bedarfsmedikation-oral', {
      id: 'torasemid-zusatz', name: 'Torasemid 10 mg von heute plus 10 mg zusätzlich geben (nach Anordnung)',
      treiber: [{ art: 'wirkstoff', id: 'torasemid', dosisMg: 20, weg: 'oral' }],   // G1: Diurese → Volumen sinkt verzögert
      wirkung: [{ groesse: 'gasaustausch', delta: 0.05, beginnSek: 1500, spitzeSek: 5400, dauerSek: 'dauerhaft' }],
    }),
  ],

  akte: {
    aufnahmegrund: 'Häusliche Versorgung seit 01/2026 nach stationärer Behandlung wegen kardialer Dekompensation: Kompressionsstrümpfe Mo/Mi/Fr, Wochendosett richten, Gewichtskontrolle.',
    anamnese: [
      'Lebt allein im 2. Stock mit Aufzug. Tochter (Frau Berg) wohnt 40 km entfernt, Nachbar schaut täglich vorbei.',
      'Nimmt die Tabletten am Wochenende selbst aus dem Dosett. Wiegt sich laut Protokoll „wenn er dran denkt“.',
      'Letzter Krankenhausaufenthalt 12/2025 (3 Wochen, kardiale Dekompensation). Möchte „nie wieder so lange ins Krankenhaus“.',
    ],
    diagnosen: [
      { text: 'Chronische Herzinsuffizienz mit reduzierter Ejektionsfraktion (EF 35 %)', icd: 'I50.13', seit: '2020' },
      { text: 'Vorhofflimmern, permanent', icd: 'I48.2', seit: '2019' },
      { text: 'Arterielle Hypertonie', icd: 'I10.90', seit: '2005' },
      { text: 'Chronische Nierenkrankheit Stadium 3a', icd: 'N18.3', seit: '2023' },
    ],
    medikation: [
      { id: 'mp-torasemid', wirkstoff: 'Torasemid', staerke: '10 mg', form: 'Tbl.', schema: '1-0-0-0', massnahme: 'tabletten-wie-geplant-geben', zuletzt: 'Donnerstag (laut Dosett)',
        hinweis: 'Diuretikum. Nicht weglassen, ohne Rücksprache. Bei Gewichtszunahme über 2 kg in 3 Tagen Hausärztin informieren.', geaendertDurch: 'an-torasemid-zusatz' },
      { id: 'mp-bisoprolol', wirkstoff: 'Bisoprolol', staerke: '2,5 mg', form: 'Tbl.', schema: '1-0-0-0', massnahme: 'tabletten-wie-geplant-geben', zuletzt: 'gestern früh (laut Dosett)',
        hinweis: 'Betablocker. Bei Puls unter 55 Rücksprache.' },
      { id: 'mp-ramipril', wirkstoff: 'Ramipril', staerke: '5 mg', form: 'Tbl.', schema: '1-0-0-0', massnahme: 'tabletten-wie-geplant-geben', zuletzt: 'gestern früh (laut Dosett)' },
      { id: 'mp-apixaban', wirkstoff: 'Apixaban', staerke: '5 mg', form: 'Tbl.', schema: '1-0-1-0', massnahme: 'tabletten-wie-geplant-geben', zuletzt: 'gestern abend (laut Dosett)',
        hinweis: 'Gerinnungshemmer bei Vorhofflimmern. Auf Blutungszeichen achten.' },
    ],
    vorwerte: [
      { zeit: 'vor 12 Tagen', vorH: 288, werte: { gewicht: 80.2, rrSys: 132, rrDia: 78, hf: 76 }, kuerzel: 'MH' },
      { zeit: 'vor 5 Tagen (Mittwoch)', vorH: 120, werte: { gewicht: 80.5, rrSys: 128, rrDia: 76, hf: 78, spo2: 96 }, kuerzel: 'SK' },
      { zeit: 'Freitag', vorH: 72, werte: { gewicht: 81.4, rrSys: 134, rrDia: 80, hf: 82 }, kuerzel: 'SK' },
    ],
    pflegebericht: [
      { zeit: 'Mittwoch 08:10', wer: 'SK', text: 'Kompressionsstrümpfe angezogen, Haut intakt. Gewicht 80,5 kg. Freut sich auf den Geburtstag der Enkelin am Samstag.' },
      { zeit: 'Freitag 08:05', wer: 'SK', text: 'Gewicht 81,4 kg (+0,9). Knöchel abends etwas dicker laut Klient. Auf tägliches Wiegen hingewiesen. Dosett für das Wochenende gerichtet.' },
    ],
    aerztlicheAnordnungen: [
      { zeit: '15.01.', wer: 'Dr. Keller', text: 'Medikationsplan (Torasemid, Bisoprolol, Ramipril morgens; Apixaban 1-0-1). Kompressionsstrümpfe AD Kl. II morgens an, abends aus.' },
      { zeit: '15.01.', wer: 'Dr. Keller', text: 'Tägliches Wiegen morgens nach dem Toilettengang. Zunahme über 2 kg in 3 Tagen, Atemnot oder neue Ödeme sofort melden. Trinkmenge etwa 1,5 l.' },
    ],
    assessments: [
      { name: 'NYHA-Klasse (Hausärztin)', wert: 'II', datum: 'vor 6 Wochen' },
      { name: 'Barthel-Index', wert: '80 von 100', datum: 'vor 6 Wochen' },
      { name: 'Sturzrisiko', wert: 'leicht erhöht', datum: 'vor 6 Wochen', hinweis: 'Diuretikum, nächtliche Toilettengänge.' },
    ],
    labor: [
      { name: 'Kreatinin', wert: '1,4', einheit: 'mg/dl', norm: '0,7–1,2', datum: 'vor 4 Wochen', auffaellig: true },
      { name: 'Kalium', wert: '4,3', einheit: 'mmol/l', norm: '3,5–5,0', datum: 'vor 4 Wochen' },
      { name: 'NT-proBNP', wert: '1850', einheit: 'pg/ml', norm: 'unter 300', datum: 'vor 4 Wochen', auffaellig: true },
    ],
    pflegeplanung: [
      { problem: 'Gefahr der kardialen Dekompensation (Herzinsuffizienz, unregelmäßige Gewichtskontrolle)', ziel: 'Wiegt sich täglich und meldet Zunahme über 2 kg in 3 Tagen', massnahmen: ['Gewichtsprotokoll an jedem Besuchstag prüfen', 'Warnzeichen wiederholt besprechen'] },
      { problem: 'Chronische Ödeme der Unterschenkel', ziel: 'Haut intakt, Ödeme nicht zunehmend', massnahmen: ['Kompressionsstrümpfe AD Kl. II', 'Hautinspektion beim An- und Ausziehen'] },
    ],
    rechtliches: [
      'Einwilligungsfähig. Keine Vorsorgevollmacht.',
      'Auskunft an Angehörige: nicht schriftlich geregelt, vorher fragen.',
      'Patientenverfügung: keine Intensivbehandlung bei aussichtsloser Prognose; Krankenhaus nur, wenn es „wirklich sein muss“.',
    ],
  },

  befunde: [
    { massnahme: 'beschwerden-erfragen', varianten: [{ text: '„Seit Samstag … krieg ich schlecht Luft. Im Bett … ging gar nicht. Hab im Sessel geschlafen.“ Er spricht in kurzen Sätzen.' }] },
    { massnahme: 'atmung-beobachten', varianten: [{ text: 'Sitzt vornübergebeugt, stützt die Arme auf. Atmung schnell und flach, Atemhilfsmuskulatur arbeitet. Flach hinlegen will er nicht.' }] },
    { massnahme: 'atemgeraeusche-hoeren', varianten: [{ text: 'Feuchte, feinblasige Rasselgeräusche über beiden Lungenunterfeldern.' }] },
    { massnahme: 'oedeme-pruefen', varianten: [{ text: 'Beide Unterschenkel und Knöchel deutlich geschwollen. Der Daumendruck am Schienbein hinterlässt eine tiefe Delle. Die Hausschuhe sind hinten heruntergetreten.' }] },
    { massnahme: 'haut-beobachten', varianten: [{ text: 'Blass, Lippen leicht bläulich, Hände kühl.' }] },
    { massnahme: 'gewicht-messen', varianten: [{ text: '84,0 kg. Im Protokoll stehen Mittwoch 80,5 kg und Freitag 81,4 kg: plus 3,5 kg in fünf Tagen.' }] },
    { massnahme: 'dosett-pruefen', varianten: [{ text: 'Die Torasemid-Fächer von Freitag bis Sonntag sind noch voll, die anderen Tabletten hat er genommen.' }] },
    { massnahme: 'trinkmenge-erfragen', varianten: [{ text: '„Auf der Feier … Bier und Kaffee. Gestern auch viel, ich hatte Durst.“ Auf dem Tisch stehen zwei leere Wasserflaschen.' }] },
    { massnahme: 'pulsoxy-anlegen', varianten: [
      { wenn: { wert: 'spo2', vergleich: '<', grenze: 90 }, text: 'SpO₂ {spo2} % – deutlich zu niedrig. Puls {hf}.', zeigt: ['spo2', 'hf'] },
      { text: 'SpO₂ {spo2} %, Puls {hf} (Kurve unregelmäßig).', zeigt: ['spo2', 'hf'] },
    ] },
    { massnahme: 'af-zaehlen', varianten: [{ text: 'Atemfrequenz {af}/min.', zeigt: ['af'] }] },
    { massnahme: 'rr-messen', varianten: [{ text: 'RR {rrSys}/{rrDia} mmHg.', zeigt: ['rrSys', 'rrDia'] }] },
    { massnahme: 'puls-zaehlen', varianten: [{ text: 'Puls {hf}/min, unregelmäßig (Vorhofflimmern bekannt).', zeigt: ['hf'] }] },
    { massnahme: 'temperatur-ohr', varianten: [{ text: '{temp} °C.', zeigt: ['temp'] }] },
    { massnahme: 'kompression-anziehen', varianten: [{ text: 'Die Strümpfe gehen nur mit viel Mühe über die geschwollenen Beine.' }] },
    { massnahme: 'kompression-ausziehen', varianten: [{ text: 'Die Strümpfe bleiben heute weg. Die Beine liegen locker, die Haut ist gespannt, aber intakt.' }] },
    { massnahme: 'schulung-hi', varianten: [{ text: 'Ihr schaut euch das Protokoll an: Er wiegt sich ab heute jeden Morgen nach dem Toilettengang und schreibt es auf. Bei mehr als 2 kg in 3 Tagen, Atemnot im Liegen oder dicken Beinen ruft er die Praxis an. Die Wassertablette nimmt er an Feiertagen lieber morgens früh, statt sie wegzulassen.' }] },
  ],

  gespraech: [
    { id: 'g-tabletten-grund', frage: 'Warum ist das Torasemid noch im Dosett?', an: 'patient', kompetenzbereiche: ['I', 'II'],
      nurWenn: { getan: 'dosett-pruefen' },
      antwort: [{ text: '„Auf der Feier wollte ich nicht dauernd aufs Klo. Hab gedacht, drei Tage ist egal.“' }],
      fakten: ['Torasemid Freitag bis Sonntag nicht genommen', 'Grund: Toilettengänge auf der Feier'] },
    { id: 'g-einwilligung', frage: 'Fragen, ob du seiner Tochter Auskunft geben darfst', an: 'patient', kompetenzbereiche: ['II', 'IV'],
      antwort: [{ text: 'Er nickt: „Sag’s ihr ruhig. Sonst macht sie sich verrückt.“', setzt: ['einwilligung-tochter'] }] },
    { id: 'g-tochter-lage', frage: 'Tochter: Lage und weiteres Vorgehen mitteilen', an: 'angehoerige', kanal: 'telefon', kompetenzbereiche: ['II', 'IV'],
      nurWenn: { ab: 300 },
      schweigepflicht: { erlaubtWenn: { flag: 'einwilligung-tochter' },
        fehlerText: 'Du hast der Tochter Auskunft gegeben, ohne Herrn Petersen zu fragen. Er ist einwilligungsfähig und sitzt neben dir. Verwandtschaft allein erlaubt keine Auskunft.' },
      antwort: [
        { wenn: { flag: 'arzt-informiert' }, text: '„Gut, dass die Ärztin kommt. Ich rufe ihn heute Abend an und frage nach dem Gewicht.“', setzt: ['tochter-unterstuetzt'] },
        { text: '„Muss er ins Krankenhaus? Was sagt denn die Ärztin?“' },
      ],
      fakten: ['Tochter wohnt 40 km entfernt', 'hat vom Nachbarn gehört, dass es ihm schlecht geht'] },
  ],

  sbar: [
    { id: 's-atemnot', teil: 'S', text: 'Herr Petersen, 81, Herzinsuffizienz: Atemnot seit dem Wochenende, hat heute Nacht im Sessel geschlafen.', art: 'kern' },
    { id: 'b-herz', teil: 'B', text: 'Herzinsuffizienz (EF 35 %) und Vorhofflimmern; Torasemid, Bisoprolol, Ramipril, Apixaban.', art: 'kern' },
    { id: 'b-torasemid-weg', teil: 'B', text: 'Hat das Torasemid von Freitag bis Sonntag nicht genommen und am Wochenende viel getrunken.', art: 'kern', bekanntWenn: { getan: 'dosett-pruefen' } },
    { id: 'b-busfahrer', teil: 'B', text: 'Er war früher Busfahrer.', art: 'ablenker' },
    { id: 'a-atemnot', teil: 'A', text: 'Atemnot schon beim Sprechen, kann nicht flach liegen.', art: 'kern' },
    { id: 'a-gewicht', teil: 'A', text: 'Gewicht 84,0 kg, das sind 3,5 kg mehr als am Mittwoch.', art: 'kern', bekanntWenn: { getan: 'gewicht-messen' } },
    { id: 'a-oedeme', teil: 'A', text: 'Deutliche, eindrückbare Ödeme an beiden Unterschenkeln.', art: 'kern', bekanntWenn: { getan: 'oedeme-pruefen' } },
    { id: 'a-rasseln', teil: 'A', text: 'Feuchte Rasselgeräusche über beiden Unterfeldern.', art: 'hilfreich', bekanntWenn: { getan: 'atemgeraeusche-hoeren' } },
    { id: 'a-erkaeltung', teil: 'A', text: 'Er hat sich auf der Feier wohl erkältet.', art: 'falsch' },
    { id: 'r-hausbesuch', teil: 'R', text: 'Bitte kommen Sie heute vorbei. Soll er zusätzlich Torasemid nehmen?', art: 'kern' },
    { id: 'r-kh', teil: 'R', text: 'Soll ich den Rettungsdienst rufen?', art: 'hilfreich' },
  ],

  anordnungen: [
    { id: 'an-plan', massnahme: 'tabletten-wie-geplant-geben', text: 'Medikationsplan der Hausärztin (Torasemid, Bisoprolol, Ramipril morgens; Apixaban 1-0-1).' },
    { id: 'an-torasemid-zusatz', massnahme: 'torasemid-zusatz', text: 'Torasemid heute 10 mg wie geplant plus einmalig 10 mg zusätzlich (telefonisch, wird schriftlich nachgereicht).' },
    { id: 'an-herzbett', massnahme: 'herzbettlage', text: 'Oberkörper hoch, Beine tief lagern.' },
    { id: 'an-kompression', massnahme: 'kompression-anziehen', text: 'Kompressionsstrümpfe wie immer anziehen.',
      fehlerhaft: { warum: 'Bei dekompensierter Herzinsuffizienz sind Kompressionsstrümpfe kontraindiziert: Sie drücken zusätzliches Volumen zum Herzen und verstärken die Atemnot (AWMF S2k Kompressionstherapie).',
        korrektur: 'Stimmt, heute keine Strümpfe. Erst wieder, wenn er entwässert ist.', ersatz: 'an-kompression-weg' } },
    { id: 'an-kompression-weg', massnahme: 'kompression-ausziehen', text: 'Kompressionsstrümpfe heute weglassen, bis er entwässert ist.' },
  ],

  arzt: {
    name: 'Hausärztin Dr. Keller',
    erreichbar: 'hausarzt-praxis',
    regeln: [
      HAUSBESUCH,
      { id: 'r-rueckfrage', wenn: { gemeldet: ['a-atemnot', 'a-oedeme'] },
        antwort: '„Das klingt nach Wasser. Ich brauche Zahlen, bevor ich entscheide.“',
        rueckfrage: { text: '„Wie viel wiegt er heute im Vergleich zum Protokoll, und wie ist die Sättigung?“', erwartet: ['a-gewicht', 'wert:spo2'], auftrag: 'af-werte' } },
      { wenn: { gemeldet: ['a-atemnot'] },
        antwort: '„Hat er dicke Beine? Wie viel wiegt er? Wie ist die Sättigung? Melden Sie sich bitte mit Gewicht und Sättigung.“' },
      { wenn: { gemeldet: ['a-erkaeltung'] },
        antwort: '„Dann Tee und Ruhe, ich schaue Mittwoch vorbei.“', setzt: ['arzt-beruhigt'] },
    ],
    auftraege: [
      { id: 'af-werte', text: 'Gewicht und Sättigung messen und der Hausärztin melden', erledigt: { alle: [{ getan: 'gewicht-messen' }, { getan: 'pulsoxy-anlegen' }] },
        meldung: ['a-gewicht', 'wert:spo2'], meldenBinnenSek: 600, folge: [{ ...HAUSBESUCH, wenn: { gemeldet: ['a-gewicht'] } }] },
      { id: 'af-kontrolle', text: 'In 20 Minuten Sättigung und Atemfrequenz kontrollieren und der Hausärztin schicken', erledigt: { alle: [{ getan: 'pulsoxy-anlegen' }, { getan: 'af-zaehlen' }] },
        meldung: ['wert:spo2', 'wert:af'], meldenBinnenSek: 1800,
        folge: [
          { wenn: { wert: 'spo2', vergleich: '>=', grenze: 90 }, antwort: '„Danke, das ist stabil. Bleiben Sie bei der Herzbettlage, ich bin um 12 bei ihm. Wird es schlechter, sofort 112.“', setzt: ['kontrolle-gemeldet'] },
          { wenn: { ab: 0 }, antwort: '„Das ist zu wenig. Rufen Sie bitte den Rettungsdienst, ich melde ihn in der Klinik an.“', setzt: ['kontrolle-gemeldet'] },
        ] },
    ],
  },

  team: { weitere: { angehoerige: 'Tochter Frau Berg (Telefon)' } },

  ereignisse: [
    { id: 'e-tochter', art: 'telefon', wann: { ab: 300 },
      text: 'Das Diensthandy klingelt. Die Tochter: „Der Nachbar sagt, Papa geht es schlecht. Was hat er denn?“' },
    { id: 'e-wille', art: 'patient', wann: { alle: [{ ab: 900 }, { flag: 'arzt-informiert' }] },
      text: 'Herr Petersen wird energisch: „Ins Krankenhaus geh ich nicht. Da war ich im Dezember drei Wochen.“',
      entscheidung: [
        { id: 'w-aufklaeren', text: 'Gründe erfragen, Warnzeichen erklären und mit ihm vereinbaren, wann der Notruf nötig ist', wertung: 'gut', setzt: ['notfallplan'],
          warum: 'Ein einwilligungsfähiger Mensch darf eine Krankenhausaufnahme ablehnen. Aufgabe der Pflege: aufklären, die Ärztin einbinden und einen sicheren Plan vereinbaren.' },
        { id: 'w-zwang', text: 'Den Rettungsdienst trotzdem rufen, er weiß nicht, was gut für ihn ist', wertung: 'gefaehrlich',
          warum: 'Den Willen eines einwilligungsfähigen Menschen zu übergehen, ist nicht gedeckt und zerstört Vertrauen. Anders nur bei akuter Lebensgefahr und fehlender Einwilligungsfähigkeit.' },
        { id: 'w-gehen', text: '„Ist Ihre Entscheidung“ sagen und zum nächsten Einsatz fahren', wertung: 'falsch',
          warum: 'Selbstbestimmung heißt nicht allein lassen: Ohne Aufklärung und Notfallplan bleibt die Gefahr unbehandelt.' },
      ] },
    { id: 'e-brodeln', art: 'komplikation', wann: { alle: [{ ab: 1320 }, { nicht: { flag: 'arzt-informiert' } }] },
      text: 'Herr Petersen hustet schaumigen Auswurf, die Atmung brodelt hörbar. Er ist kaltschweißig und unruhig.',
      bild: { haltung: 'sitzt-ringt', haut: 'blass-kaltschweissig', mimik: 'angst' } },
  ],

  pa: {
    name: 'Praxisanleiter Herr Doğan',
    hilfen: [
      { wenn: { nicht: { getan: 'pulsoxy-anlegen' } }, impuls: 'Er spricht in kurzen Sätzen. Was musst du jetzt zuerst wissen?', tipp: 'Atmung einschätzen: Atemfrequenz zählen und Sättigung messen.' },
      { wenn: { nicht: { getan: 'gewicht-messen' } }, impuls: 'Was sagen dir die Hausschuhe und das Protokoll auf dem Tisch?', tipp: 'Wiegen und mit dem Gewichtsprotokoll vergleichen.' },
      { wenn: { nicht: { getan: 'dosett-pruefen' } }, impuls: 'Warum könnte es gerade jetzt schlechter sein?', tipp: 'Schau ins Dosett: Hat er alles genommen?' },
      { wenn: { auftrag: 'af-kontrolle', status: 'offen' }, impuls: 'Was wollte die Hausärztin noch von dir?', tipp: 'Sättigung und Atemfrequenz kontrollieren und ihr schicken.' },
      { impuls: 'Woran merkt Herr Petersen selbst, dass sich Wasser einlagert?', tipp: 'Gewichtstagebuch und Warnzeichen mit ihm besprechen.' },
    ],
  },

  bewertung: {
    pflicht: [
      { id: 'p-atmung', text: 'Atmung früh eingeschätzt (Atemfrequenz und Sättigung)', gewicht: 3, kompetenzbereiche: ['I'],
        erfuellt: { alle: [{ getan: 'pulsoxy-anlegen', bis: 600 }, { getan: 'af-zaehlen', bis: 600 }] }, warum: 'Atemnot beim Sprechen: Wie schlimm es ist, zeigen Atemfrequenz und Sättigung.' },
      { id: 'p-herzbett', text: 'Herzbettlage hergestellt', gewicht: 2, kompetenzbereiche: ['I'],
        erfuellt: { getan: 'herzbettlage', bis: 600 }, warum: 'Oberkörper hoch und Beine tief entlastet das Herz und erleichtert die Atmung.' },
      { id: 'p-gewicht', text: 'Gewogen und mit dem Protokoll verglichen', gewicht: 3, kompetenzbereiche: ['I', 'V'],
        erfuellt: { getan: 'gewicht-messen' }, warum: 'Die Gewichtszunahme ist das wichtigste Zeichen für Wassereinlagerung bei Herzinsuffizienz.' },
      { id: 'p-ursache', text: 'Ursache gesucht (Dosett)', gewicht: 2, kompetenzbereiche: ['I'],
        erfuellt: { getan: 'dosett-pruefen' }, warum: 'Ausgelassene Diuretika sind ein häufiger Auslöser einer Dekompensation.' },
      { id: 'p-oedeme', text: 'Ödeme eingeschätzt', gewicht: 1, kompetenzbereiche: ['I'], erfuellt: { getan: 'oedeme-pruefen' }, warum: 'Ödeme gehören zur Beurteilung der Wassereinlagerung.' },
      { id: 'p-arzt', text: 'Hausärztin mit Gewicht, Atemnot und Sättigung informiert', gewicht: 3, kompetenzbereiche: ['II', 'III'],
        erfuellt: { flag: 'arzt-informiert' }, warum: 'Die Behandlung (Diuretikum) entscheidet die Ärztin. Sie braucht die Zahlen.' },
      { id: 'p-rueckgelesen', text: 'Anordnung Torasemid rückgelesen', gewicht: 2, kompetenzbereiche: ['III'],
        erfuellt: { anordnung: 'an-torasemid-zusatz', rueckgelesen: true }, warum: 'Eine telefonische Anordnung muss zurückgelesen werden (Closed Loop).' },
      { id: 'p-keine-kompression', text: 'Keine Kompressionsstrümpfe bei Dekompensation', gewicht: 2, kompetenzbereiche: ['I', 'III'],
        erfuellt: { nicht: { getan: 'kompression-anziehen' } }, warum: 'Kompression ist bei dekompensierter Herzinsuffizienz kontraindiziert, auch wenn sie sonst verordnet ist.' },
      { id: 'p-rueckauftrag', text: 'Kontrolle (Sättigung, Atemfrequenz) erledigt und gemeldet', gewicht: 2, kompetenzbereiche: ['II', 'III'],
        erfuellt: { auftrag: 'af-kontrolle', status: 'gemeldet' }, warum: 'Die Ärztin entscheidet aus der Ferne und braucht den Verlauf.' },
      { id: 'p-schulung', text: 'Zu täglichem Wiegen und Warnzeichen geschult', gewicht: 2, kompetenzbereiche: ['II', 'V'],
        erfuellt: { getan: 'schulung-hi' }, warum: 'Selbstkontrolle (Gewicht, Warnzeichen) verhindert die nächste Dekompensation (NVL Herzinsuffizienz).' },
      { id: 'p-tochter', text: 'Tochter mit Einverständnis einbezogen', gewicht: 1, kompetenzbereiche: ['II', 'IV'],
        erfuellt: { alle: [{ getan: 'frage:g-tochter-lage' }, { flag: 'einwilligung-tochter' }] }, warum: 'Angehörige unterstützen die Selbstkontrolle, brauchen aber sein Einverständnis.' },
      { id: 'p-doku', text: 'Gewicht und Verlauf dokumentiert', gewicht: 1, kompetenzbereiche: ['I', 'IV'],
        erfuellt: { dokumentiert: 'a-gewicht' }, warum: 'Gewicht, Anordnung und Maßnahmen müssen für das Team und die Ärztin nachvollziehbar sein.' },
    ],
    fehler: [
      { id: 'f-kompression', text: 'Kompressionsstrümpfe trotz Dekompensation angezogen', schwere: 'mittel', kompetenzbereiche: ['I', 'III'],
        wenn: { getan: 'kompression-anziehen' },
        folge: { text: 'Kurz danach ringt Herr Petersen stärker nach Luft und hustet.', wirkung: [{ groesse: 'gasaustausch', delta: -0.05, beginnSek: 60, spitzeSek: 600, dauerSek: 'dauerhaft' }] },
        warum: 'Mehr Rückstrom zum geschwächten Herzen verstärkt die Stauung in der Lunge.' },
      { id: 'f-trinken', text: 'Zum vielen Trinken aufgefordert', schwere: 'mittel', kompetenzbereiche: ['I', 'V'],
        wenn: { getan: 'viel-trinken' }, warum: 'Bei Wassereinlagerung verschlechtert zusätzliche Flüssigkeit die Lage. Trinkmenge nur nach ärztlicher Vorgabe.' },
      { id: 'f-flach', text: 'Flach gelagert mit Beinen hoch', schwere: 'mittel', kompetenzbereiche: ['I'],
        wenn: { getan: 'flachlagern-beine-hoch' },
        folge: { text: 'Herr Petersen bekommt im Liegen kaum Luft und richtet sich panisch auf.', wirkung: [{ groesse: 'gasaustausch', delta: -0.06, beginnSek: 0, spitzeSek: 60, dauerSek: 300 }, { groesse: 'angst', delta: 0.3, beginnSek: 0, spitzeSek: 30, dauerSek: 600 }] },
        warum: 'Beine hoch bringt noch mehr Volumen zum Herzen: bei Herzinsuffizienz falsch.' },
      { id: 'f-nicht-gemeldet', text: 'Verschlechterung 20 Minuten lang nicht ärztlich gemeldet', schwere: 'schwer', kompetenzbereiche: ['I', 'III'],
        wenn: { alle: [{ ab: 1200 }, { nicht: { flag: 'arzt-informiert' } }] },
        folge: { text: 'Die Stauung nimmt zu.', wirkung: [{ groesse: 'gasaustausch', delta: -0.2, beginnSek: 0, spitzeSek: 500, dauerSek: 'dauerhaft' }, { groesse: 'atemarbeit', delta: 0.3, beginnSek: 0, spitzeSek: 600, dauerSek: 'dauerhaft' }] },
        warum: 'Zunehmende Atemnot mit Gewichtszunahme braucht heute eine ärztliche Entscheidung, sonst droht ein Lungenödem.' },
    ],
    ende: [
      { wenn: { alle: [{ flag: 'arzt-informiert' }, { flag: 'kontrolle-gemeldet' }, { flag: 'notfallplan' }, { getan: 'pflegebericht' }] },
        text: 'Herr Petersen sitzt in Herzbettlage, die Tabletten sind genommen, die Hausärztin kommt um 12 Uhr. Er weiß, wann er 112 rufen soll.', ausgang: 'stabil' },
      { wenn: { ab: 2700 }, text: 'Die Tour muss weiter. Die Lage ist nicht geklärt.', ausgang: 'verschlechtert' },
    ],
  },

  pflegebedarf: {
    probleme: [
      { id: 'pb-atemnot', text: 'Atemnot durch Wassereinlagerung (kardiale Dekompensation)', richtig: true, prioritaet: 1, warum: 'Akute Gefährdung, braucht heute eine Behandlung.' },
      { id: 'pb-selbstmanagement', text: 'Unzureichendes Selbstmanagement der Herzinsuffizienz (Diuretikum ausgelassen, Gewicht nicht kontrolliert)', richtig: true, prioritaet: 2, warum: 'Ursache der Verschlechterung; mit Schulung beeinflussbar.' },
      { id: 'pb-oedeme', text: 'Gefährdete Hautintegrität durch Ödeme', richtig: true, prioritaet: 3, warum: 'Gespannte Haut verletzt sich leicht; beim Ausziehen und Pflegen beobachten.' },
      { id: 'pb-exsikkose', text: 'Flüssigkeitsdefizit', richtig: false, warum: 'Er hat eher zu viel Flüssigkeit im Körper.' },
      { id: 'pb-infekt', text: 'Atemwegsinfekt', richtig: false, warum: 'Kein Fieber, keine Infektzeichen. Die Atemnot kommt von der Stauung.' },
    ],
    ziele: [
      { id: 'z-wiegen', text: 'Herr Petersen wiegt sich täglich und meldet eine Zunahme über 2 kg in 3 Tagen.', passtZu: ['pb-selbstmanagement'], richtig: true },
      { id: 'z-atem', text: 'Herr Petersen kann bis morgen wieder im Bett mit erhöhtem Oberkörper schlafen.', passtZu: ['pb-atemnot'], richtig: true },
      { id: 'z-haut', text: 'Die Haut der Unterschenkel bleibt intakt.', passtZu: ['pb-oedeme'], richtig: true },
      { id: 'z-trinken', text: 'Herr Petersen trinkt mindestens 3 Liter am Tag.', passtZu: ['pb-atemnot'], richtig: false },
    ],
  },

  leitfaden: [
    { titel: 'Was im Körper passiert', text: 'Das geschwächte Herz pumpt zu wenig. Die Niere hält Salz und Wasser zurück, Diuretika gleichen das aus. Fehlen sie ein paar Tage, staut sich das Wasser zurück: in die Beine (Ödeme) und in die Lunge (Atemnot im Liegen, feuchte Rasselgeräusche). Das Gewicht steigt, bevor es schlimm wird.', quellen: ['nvl-hi'] },
    { titel: 'Was hilft, was schadet', text: 'Herzbettlage (Oberkörper hoch, Beine tief) entlastet. Schädlich sind flach Lagern mit Beinen hoch, zusätzliche Trinkmenge und Kompressionsstrümpfe bei Dekompensation, weil sie mehr Volumen zum Herzen bringen.', quellen: ['nvl-hi', 'awmf-kompression'] },
    { titel: 'Selbstmanagement schulen', text: 'Täglich zur gleichen Zeit wiegen und aufschreiben. Mehr als 2 kg in 3 Tagen, neue Atemnot im Liegen oder dickere Beine sind Warnzeichen: Praxis anrufen. Diuretika nicht weglassen, sondern die Einnahmezeit planen.', quellen: ['nvl-hi', 'esc-hi'] },
    { titel: 'Selbstbestimmung', text: 'Wer einwilligungsfähig ist, entscheidet selbst über ein Krankenhaus. Pflegende klären auf, binden die Ärztin ein und vereinbaren einen Notfallplan.' },
  ],

  pruefwege: {
    muster: [
      { art: 'massnahme', id: 'vorstellen-einverstaendnis' },
      { art: 'massnahme', id: 'beschwerden-erfragen' },
      { art: 'massnahme', id: 'herzbettlage' },
      { art: 'pflegetasche', geraet: 'pulsoxy' },
      { art: 'massnahme', id: 'pulsoxy-anlegen' },
      { art: 'massnahme', id: 'af-zaehlen' },
      { art: 'massnahme', id: 'oedeme-pruefen' },
      { art: 'massnahme', id: 'gewicht-messen' },
      { art: 'massnahme', id: 'dosett-pruefen' },
      { art: 'frage', id: 'g-tabletten-grund' },
      { art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: ['s-atemnot', 'b-herz', 'b-torasemid-weg', 'a-atemnot', 'a-oedeme', 'a-gewicht', 'wert:spo2', 'r-hausbesuch'] },
      { art: 'rueckmelden', anordnung: 'an-torasemid-zusatz', rueckgelesen: true },
      { art: 'rueckmelden', anordnung: 'an-herzbett', rueckgelesen: true },
      { art: 'remonstrieren', anordnung: 'an-kompression', grund: 'Kompression ist bei dekompensierter Herzinsuffizienz kontraindiziert.' },
      { art: 'rueckmelden', anordnung: 'an-kompression-weg', rueckgelesen: true },
      { art: 'auflegen', an: 'aerztin' },
      { art: 'massnahme', id: 'torasemid-zusatz' },
      { art: 'massnahme', id: 'kompression-ausziehen' },
      { art: 'frage', id: 'g-einwilligung' },
      { art: 'frage', id: 'g-tochter-lage' },
      { art: 'massnahme', id: 'schulung-hi' },
      { art: 'dokumentieren', bausteine: ['a-gewicht', 'b-torasemid-weg', 'anordnung:an-torasemid-zusatz'] },
      { art: 'warten', sek: 300 },
      { art: 'massnahme', id: 'pulsoxy-anlegen' },
      { art: 'massnahme', id: 'af-zaehlen' },
      { art: 'nachricht', an: 'aerztin', kanal: 'messenger', bausteine: ['wert:spo2', 'wert:af'] },
      { art: 'warten', sek: 120 },
      { art: 'abschluss', probleme: ['pb-atemnot', 'pb-selbstmanagement', 'pb-oedeme'], ziele: ['z-atem', 'z-wiegen', 'z-haut'],
        sbar: ['s-atemnot', 'b-herz', 'b-torasemid-weg', 'a-atemnot', 'a-gewicht', 'a-oedeme'] },
    ],
    unterlassung: { bisSek: 1800, erwartet: { wert: 'spo2', vergleich: '<', grenze: 88 } },
    grenze: { rolle: 2, events: [{ art: 'massnahme', id: 'torasemid-zusatz' }], erwartet: 'pa-eingriff' },
  },
};
