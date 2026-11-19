// Fallwelle P19 (CE 11) · Krankenhaus: Alkoholentzug nach Unfall-OP (Unterschenkelfraktur), symptomgesteuerte Behandlung
// Entwurf, fachlich UNGEPRÜFT. Inhalte fiktiv/didaktisch. Neuer Fall (Fallplan N, CIWA, G1-Wirkstoffe).

import { KATALOG } from '../katalog';
import type { Bedingung, FallV2, MassnahmeDefinition } from '../typen';

const aus = (id: string, mehr: Partial<MassnahmeDefinition>): MassnahmeDefinition => ({ ...KATALOG[id]!, ...mehr });

const BEHANDELT: Bedingung = { getan: 'lorazepam-geben' };
const STARK: Bedingung = { wert: 'ciwa', vergleich: '>=', grenze: 30 };   // mit Halluzinationen
const GESUNKEN: Bedingung = { wert: 'ciwa', vergleich: '<', grenze: 25 };

const ANTWORT = '„Klingt nach Entzug. Geben Sie ihm Lorazepam 2 mg, und dann jede Stunde wieder 2 mg, bis er schläft. Und hängen Sie Thiamin 100 mg als Kurzinfusion an. In einer halben Stunde will ich wissen, wie der Score ist.“';
const R_ANORDNUNG = { id: 'r-anordnung', antwort: ANTWORT, anordnungen: ['an-lorazepam-starr', 'an-thiamin'], kommtNachSek: 1200, setzt: ['arzt-informiert'], auftraege: ['af-score'] };

export const KH_ALKOHOLENTZUG: FallV2 = {
  schema: 2,
  id: 'kh-alkoholentzug',
  version: '0.2.0',
  spur: 'A',
  setting: 'krankenhaus',
  altersgruppe: 'erwachsen',
  titel: '„Da krabbelt was an der Wand“',
  kurz: 'Unfallchirurgie, Frühdienst: 56-Jähriger zwei Tage nach Unterschenkel-OP zittert, schwitzt und sieht Käfer.',
  rahmen: 'Du bist im Frühdienst auf der Unfallchirurgie. Bei der Übergabe heißt es, Herr Krüger habe nachts kaum geschlafen. Du gehst als Erste zu ihm.',
  lernziele: [
    'Zeichen eines Alkoholentzugs erkennen und mit einem Score (CIWA-Ar oder AESB) einschätzen.',
    'Eine Anordnung „starr jede Stunde bis zum Schlaf“ als Überdosierungsgefahr erkennen und eine symptomgesteuerte Gabe einfordern.',
    'Vitalzeichen, Vigilanz und Atmung nach Benzodiazepin-Gabe überwachen.',
    'Wertschätzend über Alkohol sprechen und die Ehefrau mit Einwilligung einbeziehen.',
  ],
  lehrplan: {
    ce: ['ce.11', 'ce.05'], abschnitt: ['ad3'],
    themen: ['thema.kl.psych', 'thema.ph.medikamente', 'thema.beo.vitalzeichen', 'thema.kom.gespraech', 'thema.re.schweigepflicht'],
    kompetenzen: ['I.1.e', 'I.3.b', 'II.1.b', 'III.2.a', 'IV.1.b'],
  },
  geeignet: { rollen: [3], stufen: [1, 2, 3] },
  dauerMin: [15, 22],
  freigabe: {
    status: 'entwurf',
    pruefpunkte: [
      'Entzugsbehandlung gegen S3-Leitlinie alkoholbezogene Störungen (AWMF 076-001, 2021) prüfen: symptomgesteuert nach Score, Benzodiazepine, Thiamin vor Glukose',
      'Score: CIWA-Ar aus dem Modell (unter 10 leicht, 10–15 mittel, über 15 schwer); AESB in BW-Einrichtungen?',
      'Remonstrationspunkt: starre stündliche Gabe „bis er schläft“ (Übersedierung, Atemdepression) gegenüber symptomgesteuerter Gabe',
      'Befugnis: Entzug einschätzen ab 3. Drittel selbst, Lorazepam oral nach Anordnung im 3. Drittel selbst (Lehrplan sucht3 S. 190)',
      'Modell: Treiber alkoholentzug (schwere 0,65, letzter Konsum vor 34 h): vegetatives Syndrom, Halluzinationen, Krampfbereitschaft bis 48 h; Lorazepam dämpft über entzugsschutz, Thiamin verhindert Wernicke. CIWA-Ar aus dem Modell',
    ],
  },
  quellen: [
    { id: 's3-alkohol', titel: 'S3-Leitlinie Screening, Diagnose und Behandlung alkoholbezogener Störungen (AWMF 076-001), 2021, Kapitel Entzug' },
    { id: 'ciwa', titel: 'CIWA-Ar – Clinical Institute Withdrawal Assessment for Alcohol, revised (Sullivan et al. 1989), deutsche Fassung' },
    { id: 'aesb', titel: 'AESB – Alkoholentzugssyndrom-Skala nach Banger (Wetterling et al. 1997)' },
    { id: 'fi-lorazepam', titel: 'Fachinformation Lorazepam (Tavor), aktuelle Fassung' },
    { id: 'stgb-203', titel: 'StGB § 203 Verletzung von Privatgeheimnissen (Schweigepflicht)' },
  ],

  person: {
    name: 'Rainer Krüger',
    alter: { jahre: 56 },
    geschlecht: 'm',
    biografie: ['Lkw-Fahrer, verheiratet, zwei erwachsene Kinder', 'ist vom Gerüst seines Gartenhauses gestürzt', 'raucht 20 Zigaretten am Tag'],
    diagnosenBekannt: ['Unterschenkelfraktur links, Plattenosteosynthese vor zwei Tagen', 'Bluthochdruck', 'Fettleber'],
    medikamentePlan: ['Amlodipin 5 mg 1-0-0', 'Enoxaparin 40 mg s. c. 0-0-1', 'Ibuprofen 400 mg 1-1-1', 'Bedarf: Lorazepam nach ärztlicher Anordnung'],
    allergien: ['keine bekannt'],
    gewichtKg: 92,
  },
  medien: { raum: '13_station_postop' },
  uebernahme: 'Herr Krüger, 56, zweiter Tag nach Plattenosteosynthese am linken Unterschenkel. Hat nachts kaum geschlafen, war schweißnass, Bettwäsche gewechselt. Beim Aufnahmegespräch hat er „ab und zu ein Feierabendbier“ angegeben. Zugang rechts liegt. Seine Frau will heute Vormittag kommen.',
  startUhrzeit: '06:40',

  start: {
    // Alkoholentzug (Treiber, physiologie/entzug.ts): letzter Konsum vorgestern Abend vor dem Sturz, etwa 34 h vor Fallbeginn.
    grund: { angst: 0.5, unruhe: 0.55, delir: 0.15, orientierung: 0.85, schmerz: 3, temperatur: 37.7, hydratation: 0.9, blutzucker: 102 },
    treiber: [
      { art: 'alkoholentzug', schwere: 0.65, letzterKonsumVorStd: 34 },
      { art: 'delir_trigger', ausloeser: ['umgebung'] },
    ],
    bild: { haltung: 'unruhig', haut: 'gerötet-heiss', mimik: 'angst' },
    flags: ['zugang-liegt'],
    sichtbar: [],
  },

  massnahmen: [
    // Gespräch
    'vorstellen-einverstaendnis', 'ansprechen-orientierung', 'beruhigen-zusprechen', 'beschwerden-erfragen', 'reorientieren',
    // Beobachten
    'entzug-einschaetzen', 'delir-screening-4at', 'haut-beobachten', 'bewusstsein-avpu', 'schmerz-nrs', 'wunde-beurteilen', 'sturzrisiko-einschaetzen',
    // Akut
    'hilfe-holen', 'reizarm-gestalten', 'sturzprophylaxe-bett', 'fem-anlegen', 'umgebung-sichern',
    // Messen
    'rr-messen', 'puls-zaehlen', 'temperatur-ohr', 'af-zaehlen', 'pulsoxy-anlegen', 'bz-messen', 'kurve-lesen',
    // Versorgen
    'lorazepam-geben', 'thiamin-geben', 'trinken-anbieten',
    // Melden
    'pflegefachperson-informieren', 'pflegebericht',
  ],
  massnahmenZusatz: [
    aus('lorazepam-geben', { name: 'Lorazepam 2 mg als Tablette geben (nach Anordnung, symptomgesteuert)', treiber: [{ art: 'wirkstoff', id: 'lorazepam', dosisMg: 2, weg: 'oral' }] }),
    aus('thiamin-geben', { name: 'Thiamin 100 mg als Kurzinfusion über den liegenden Zugang (nach Anordnung, vor Glukose)' }),
  ],

  akte: {
    aufnahmegrund: 'Sturz vom Gartenhaus-Gerüst vorgestern Abend, distale Unterschenkelfraktur links. Plattenosteosynthese gestern Vormittag in Vollnarkose.',
    anamnese: [
      'Bluthochdruck, Fettleber (Sonografie vor einem Jahr beim Hausarzt).',
      'Alkohol laut Aufnahmegespräch: „ab und zu ein Feierabendbier“. Raucht 20 Zigaretten pro Tag.',
      'Keine Krampfanfälle bekannt.',
      'Einwilligung zur Auskunft an die Ehefrau: noch nicht erfragt (Aufnahme in der Nacht).',
    ],
    diagnosen: [
      { text: 'Distale Unterschenkelfraktur links, Plattenosteosynthese', icd: 'S82.3', seit: 'vor 2 Tagen' },
      { text: 'Arterielle Hypertonie', icd: 'I10', seit: 'bekannt' },
      { text: 'Nichtalkoholische/alkoholische Fettleber, unklar', icd: 'K76.0', seit: 'bekannt' },
    ],
    medikation: [
      { id: 'mp-amlodipin', wirkstoff: 'Amlodipin', staerke: '5 mg', form: 'Tbl.', schema: '1-0-0-0', zuletzt: 'gestern 08:00' },
      { id: 'mp-ibuprofen', wirkstoff: 'Ibuprofen', staerke: '400 mg', form: 'Tbl.', schema: '1-1-1-0', zuletzt: 'gestern 18:00' },
      { id: 'mp-enoxaparin', wirkstoff: 'Enoxaparin', staerke: '40 mg', form: 's. c.', schema: '0-0-1-0', zuletzt: 'gestern 20:00' },
    ],
    vorwerte: [
      { zeit: 'gestern 20:00', vorH: 11, werte: { rrSys: 148, rrDia: 90, hf: 92, af: 16, spo2: 96, temp: 37.3 }, kuerzel: 'SD' },
      { zeit: 'heute 02:00', vorH: 5, werte: { rrSys: 162, rrDia: 98, hf: 108, temp: 37.6 }, kuerzel: 'ND' },
    ],
    pflegebericht: [
      { zeit: '23:30', wer: 'ND', text: 'Unruhig, schläft nicht, fragt mehrmals nach der Uhrzeit. Hände zittern beim Trinken.' },
      { zeit: '03:00', wer: 'ND', text: 'Stark geschwitzt, Bettwäsche gewechselt. Sagt, es seien „Fäden“ an der Decke. RR 162/98.' },
    ],
    aerztlicheAnordnungen: [
      { zeit: 'gestern', wer: 'Dr. Schulte', text: 'Teilbelastung 20 kg links. Ibuprofen 400 mg 1-1-1. Vitalzeichen 2× täglich.' },
    ],
    assessments: [{ name: 'AUDIT-C', wert: 'nicht erhoben', datum: 'Aufnahme' }],
    labor: [
      { name: 'GGT', wert: '214', einheit: 'U/l', norm: '< 60', datum: 'Aufnahme', auffaellig: true },
      { name: 'MCV', wert: '101', einheit: 'fl', norm: '80–96', datum: 'Aufnahme', auffaellig: true },
      { name: 'Natrium', wert: '134', einheit: 'mmol/l', norm: '135–145', datum: 'Aufnahme', auffaellig: true },
      { name: 'Thrombozyten', wert: '118', einheit: '/nl', norm: '150–400', datum: 'Aufnahme', auffaellig: true },
    ],
    rechtliches: ['Keine Einwilligung zur Auskunft an Angehörige dokumentiert.'],
  },

  befunde: [
    { massnahme: 'vorstellen-einverstaendnis', varianten: [{ text: 'Er sitzt auf der Bettkante, die Hände zittern: „Morgen. Ich muss hier raus, ich hab so viel zu tun.“' }] },
    { massnahme: 'ansprechen-orientierung', varianten: [{ text: 'Name und Ort weiß er. Das Datum nicht sicher. Er schaut immer wieder zur Wand.' }] },
    { massnahme: 'beschwerden-erfragen', varianten: [
      { wenn: STARK, text: '„Ich schwitz wie verrückt und mir ist schlecht. Und da an der Wand, sehen Sie die Käfer nicht?“' },
      { text: '„Besser. Das Zittern lässt nach. Die Käfer sind weg.“' },
    ] },
    { massnahme: 'entzug-einschaetzen', varianten: [
      { wenn: { wert: 'ciwa', vergleich: '>', grenze: 15 }, text: 'Tremor {tremor}, Schwitzen {schwitzen}, Halluzinationen: {halluzinationen}. Übelkeit, Unruhe, Orientierung leicht gestört. CIWA-Ar {ciwa}: schwerer Entzug.' },
      { wenn: { wert: 'ciwa', vergleich: '>=', grenze: 10 }, text: 'Tremor {tremor}, Schwitzen {schwitzen}, Halluzinationen: {halluzinationen}. CIWA-Ar {ciwa}: mittelschwerer Entzug.' },
      { text: 'Tremor {tremor}, Schwitzen {schwitzen}, Halluzinationen: {halluzinationen}. CIWA-Ar {ciwa}: leichter Entzug.' },
    ] },
    { massnahme: 'delir-screening-4at', varianten: [{ text: '4AT: wach, AMT4 ein Fehler, Monate rückwärts mit Mühe. Grenzwertig. Achtung: Übergang in ein Entzugsdelir möglich.' }] },
    { massnahme: 'haut-beobachten', varianten: [{ text: 'Schweißnass, gerötetes Gesicht, warm.' }] },
    { massnahme: 'bewusstsein-avpu', varianten: [{ text: 'AVPU {avpu}.', zeigt: ['avpu'] }] },
    { massnahme: 'schmerz-nrs', varianten: [{ text: 'NRS {nrs} am Unterschenkel.' }] },
    { massnahme: 'wunde-beurteilen', varianten: [{ text: 'Verband trocken, Zehen warm und beweglich.' }] },
    { massnahme: 'sturzrisiko-einschaetzen', varianten: [{ text: 'Hohes Sturzrisiko: Teilbelastung, Unruhe, Zittern, Halluzinationen.' }] },
    { massnahme: 'rr-messen', varianten: [{ text: 'RR {rrSys}/{rrDia} mmHg.', zeigt: ['rrSys', 'rrDia'] }] },
    { massnahme: 'puls-zaehlen', varianten: [{ text: 'Puls {hf}/min, regelmäßig.', zeigt: ['hf'] }] },
    { massnahme: 'temperatur-ohr', varianten: [{ text: '{temp} °C.', zeigt: ['temp'] }] },
    { massnahme: 'af-zaehlen', varianten: [{ text: 'AF {af}/min.', zeigt: ['af'] }] },
    { massnahme: 'pulsoxy-anlegen', varianten: [{ text: 'SpO₂ {spo2} %.', zeigt: ['spo2'] }] },
    { massnahme: 'bz-messen', varianten: [{ text: 'BZ {bz} mg/dl.', zeigt: ['bz'] }] },
    { massnahme: 'kurve-lesen', varianten: [{ text: 'Nachts RR 162/98, Puls 108, Zittern, „Fäden an der Decke“. Labor: GGT 214, MCV 101, Thrombozyten 118. Keine Bedarfsmedikation gegen Entzug angesetzt. Keine Einwilligung zur Auskunft an Angehörige.' }] },
    { massnahme: 'lorazepam-geben', varianten: [{ text: 'Er schluckt die Tablette mit zitternder Hand. Du notierst Uhrzeit und Score.' }] },
    { massnahme: 'trinken-anbieten', varianten: [{ text: 'Er trinkt hastig ein Glas Wasser.' }] },
    { massnahme: 'reizarm-gestalten', varianten: [{ text: 'Du machst das grelle Deckenlicht aus, ziehst den Vorhang auf, damit Tageslicht hereinkommt, und stellst das Radio des Nachbarn leiser.' }] },
    { massnahme: 'sturzprophylaxe-bett', varianten: [{ text: 'Bett tief, Klingel und Urinflasche in Reichweite, Gehstützen neben dem Bett.' }] },
    { massnahme: 'fem-anlegen', varianten: [{ text: 'Du ziehst die Bettgitter hoch. Herr Krüger rüttelt daran und will darüber steigen.' }] },
  ],

  gespraech: [
    { id: 'g-alkohol', frage: 'Herrn Krüger offen und ohne Vorwurf fragen, wie viel er sonst trinkt und wann zuletzt', an: 'patient', kompetenzbereiche: ['II'],
      antwort: [{ text: 'Er schaut weg. „Na ja … schon jeden Tag. Abends ein paar Bier, und mal einen Schnaps. Das letzte war vorgestern vor dem Sturz.“', setzt: ['alkohol-angegeben'] }],
      fakten: ['täglicher Konsum', 'letzter Konsum vor etwa 36 Stunden'] },
    { id: 'g-einwilligung', frage: 'Herrn Krüger fragen, ob du mit seiner Frau über seinen Zustand sprechen darfst', an: 'patient', kompetenzbereiche: ['II', 'IV'],
      antwort: [{ text: '„Ja. Die weiß das eh besser als ich.“', setzt: ['einwilligung-frau'] }] },
    { id: 'g-frau', frage: 'Mit Frau Krüger sprechen: Lage erklären und nach seinem Trinkverhalten fragen', an: 'angehoerige', kompetenzbereiche: ['II', 'IV'],
      nurWenn: { ab: 900 },
      schweigepflicht: { erlaubtWenn: { flag: 'einwilligung-frau' },
        fehlerText: 'Herr Krüger hat noch nicht eingewilligt, dass seine Frau Auskunft bekommt. Frag ihn zuerst.' },
      antwort: [{ text: '„Ehrlich gesagt eine Flasche Korn am Tag, seit Jahren. Er hat schon mal versucht aufzuhören, da hat er gezittert und einen Anfall gehabt.“', setzt: ['fremdanamnese'] }],
      fakten: ['etwa 0,7 l Schnaps täglich', 'früher Entzugskrampf'] },
    { id: 'g-kollege', frage: 'Kollegen Murat bitten, kurz bei Herrn Krüger zu bleiben', an: 'kollegin', kompetenzbereiche: ['III'],
      antwort: [{ text: '„Klar, ich bleib bei ihm, bis du telefoniert hast.“', setzt: ['kollege-da'] }] },
  ],

  sbar: [
    { id: 's-entzug', teil: 'S', text: 'Rainer Krüger, 56, Zimmer 4, zweiter Tag nach Unterschenkel-OP: Zittern, Schwitzen, Unruhe und optische Halluzinationen.', art: 'kern' },
    { id: 'b-alkohol', teil: 'B', text: 'Trinkt täglich, letzter Konsum vor etwa 36 Stunden. GGT und MCV erhöht.', art: 'kern', bekanntWenn: { eine: [{ flag: 'alkohol-angegeben' }, { getan: 'kurve-lesen' }] } },
    { id: 'b-lkw', teil: 'B', text: 'Er ist Lkw-Fahrer.', art: 'ablenker' },
    { id: 'a-score', teil: 'A', text: 'CIWA-Ar deutlich über 15: schwerer Entzug mit Halluzinationen, wach und ansprechbar.', art: 'kern', bekanntWenn: { getan: 'entzug-einschaetzen' } },
    { id: 'a-score-besser', teil: 'A', text: 'CIWA-Ar nach Lorazepam deutlich gesunken, keine Halluzinationen mehr, wach, Atmung ruhig.', art: 'hilfreich',
      bekanntWenn: { alle: [BEHANDELT, { getan: 'entzug-einschaetzen' }, GESUNKEN] } },
    { id: 'a-krampf', teil: 'A', text: 'Laut Ehefrau früher ein Krampfanfall im Entzug, trinkt etwa eine Flasche Schnaps am Tag.', art: 'hilfreich', bekanntWenn: { flag: 'fremdanamnese' } },
    { id: 'a-nervoes', teil: 'A', text: 'Er ist halt nervös wegen der OP.', art: 'falsch' },
    { id: 'r-anordnung', teil: 'R', text: 'Bitte um Anordnung zur Entzugsbehandlung nach Score und Thiamin.', art: 'kern' },
  ],

  anordnungen: [
    { id: 'an-lorazepam-starr', massnahme: 'lorazepam-geben', text: 'Lorazepam 2 mg p. o., danach stündlich 2 mg bis zum Schlaf.',
      fehlerhaft: {
        warum: 'Eine starre stündliche Gabe „bis er schläft“ führt zur Anhäufung (lange Halbwertszeit) mit Übersedierung, Atemdepression und Sturzgefahr. Die Leitlinie empfiehlt eine symptomgesteuerte Gabe nach Score mit Kontrolle von Vigilanz und Atmung.',
        korrektur: '„Sie haben recht, symptomgesteuert ist besser. Lorazepam 2 mg jetzt, dann nach Score, frühestens nach einer Stunde wieder, nicht wenn er schläfrig ist.“',
        ersatz: 'an-lorazepam-score',
      } },
    { id: 'an-thiamin', massnahme: 'thiamin-geben', text: 'Thiamin 100 mg als Kurzinfusion i. v., vor jeder Glukosegabe.' },
    { id: 'an-lorazepam-score', massnahme: 'lorazepam-geben', text: 'Lorazepam 2 mg p. o. jetzt (CIWA-Ar über 15), danach nach Score (1 mg ab 10, 2 mg über 15), frühestens nach 1 h, nicht bei Schläfrigkeit.' },
  ],

  arzt: {
    name: 'Stationsarzt Dr. Schulte',
    erreichbar: 'telefon',
    regeln: [
      { ...R_ANORDNUNG, wenn: { gemeldet: ['a-score', 'wert:hf'] } },
      { id: 'r-vital-frage', wenn: { gemeldet: ['a-score'] },
        antwort: '„Verdacht auf Alkoholentzug, verstanden.“',
        rueckfrage: { text: '„Wie sind Puls und Temperatur?“', erwartet: ['wert:hf', 'wert:temp'], auftrag: 'af-vital' } },
      { wenn: { gemeldet: ['a-nervoes'] }, antwort: '„Nervös schwitzt man nicht nachts die Bettwäsche durch. Haben Sie an einen Entzug gedacht? Machen Sie einen Score.“' },
    ],
    auftraege: [
      { id: 'af-vital', text: 'Puls und Temperatur messen und melden', erledigt: { alle: [{ getan: 'puls-zaehlen' }, { getan: 'temperatur-ohr' }] }, meldung: ['wert:hf', 'wert:temp'], meldenBinnenSek: 300,
        folge: [{ ...R_ANORDNUNG, wenn: { gemeldet: ['a-score'] } }] },
      { id: 'af-score', text: 'Nach der Gabe den Entzugsscore erneut erheben und melden', meldenBinnenSek: 2400,
        erledigt: { alle: [BEHANDELT, { getan: 'entzug-einschaetzen' }, { ab: 900 }] },
        meldung: ['a-score-besser'],
        folge: [{ wenn: { ab: 0 }, antwort: '„Gut. Dann weiter nach Score, in einer Stunde erneut erheben; über 15 noch einmal 2 mg. Thiamin weiter täglich, und wir sprechen später mit ihm über eine qualifizierte Entzugsbehandlung.“', setzt: ['score-gemeldet'] }] },
    ],
  },

  ereignisse: [
    { id: 'e-gehen', art: 'komplikation', wann: { ab: 420 },
      text: 'Herr Krüger steht auf, ohne Gehstützen, und hält sich am Infusionsständer fest: „Ich geh jetzt heim, ich hab keine Zeit für so was.“',
      entscheidung: [
        { id: 'w-begleiten', text: 'Ruhig zu ihm gehen, stützen, ihn mit Namen ansprechen, ihn zum Bett zurück begleiten und Hilfe holen', wertung: 'gut', warum: 'Er ist nicht voll orientiert und darf das Bein nur teilbelasten. Begleiten statt zwingen.' },
        { id: 'w-gehen-lassen', text: 'Er ist erwachsen, er darf gehen. Ihn gehen lassen.', wertung: 'gefaehrlich', warum: 'Im Entzug mit Halluzinationen ist er gerade nicht sicher einwilligungsfähig. Sturz- und Krampfgefahr.' },
      ] },
    { id: 'e-halluzination', art: 'komplikation', wann: { ab: 1300 }, verhindertDurch: BEHANDELT,
      text: 'Herr Krüger zittert am ganzen Körper, schlägt nach etwas an der Wand und reißt am Zugang. Er erkennt dich nicht mehr.',
      bild: { haltung: 'unruhig', haut: 'gerötet-heiss', mimik: 'verwirrt' } },
    { id: 'e-frau', art: 'angehoerige', wann: { ab: 900 }, text: 'Frau Krüger klopft an die Tür: „Wie geht es meinem Mann? Er hat gestern am Telefon so komisch geredet.“' },
    { id: 'e-arzt', art: 'visite', wann: { alle: [{ flag: 'arzt-informiert' }, { ab: 1800 }] },
      text: 'Dr. Schulte schaut nach Herrn Krüger und spricht mit Herrn Krüger über die Entzugsbehandlung.' },
  ],

  pa: {
    name: 'Praxisanleiter Herr Sommer',
    hilfen: [
      { wenn: { nicht: { getan: 'entzug-einschaetzen' } }, impuls: 'Zittern, Schwitzen, Käfer an der Wand, zwei Tage nach dem Unfall. Woran denkst du?', tipp: 'Alkoholentzug. Schätze ihn mit einem Score ein.' },
      { wenn: { nicht: { flag: 'alkohol-angegeben' } }, impuls: 'Wie fragst du nach Alkohol, ohne dass er sich angegriffen fühlt?', tipp: 'Offen, sachlich, ohne Vorwurf: wie viel, wie oft, wann zuletzt.' },
      { wenn: { alle: [{ flag: 'arzt-informiert' }, { nicht: { flag: 'remonstriert:an-lorazepam-starr' } }] }, impuls: 'Jede Stunde 2 mg, bis er schläft. Was passiert nach vier Stunden?', tipp: 'Lorazepam reichert sich an: Übersedierung, Atemdepression. Frag nach einer Gabe nach Score.' },
      { impuls: 'Was darfst du seiner Frau sagen?', tipp: 'Erst, wenn er eingewilligt hat.' },
    ],
  },
  team: { kollegin: 'Kollege Murat (Frühdienst)', weitere: { angehoerige: 'Ehefrau Frau Krüger' } },

  bewertung: {
    pflicht: [
      { id: 'p-score', text: 'Entzug mit Score eingeschätzt', gewicht: 3, kompetenzbereiche: ['I', 'V'], erfuellt: { getan: 'entzug-einschaetzen', bis: 600 },
        warum: 'Der Score macht die Schwere messbar und steuert die Behandlung.' },
      { id: 'p-vital', text: 'Puls, Blutdruck und Temperatur gemessen', gewicht: 2, kompetenzbereiche: ['I'], erfuellt: { alle: [{ getan: 'puls-zaehlen' }, { getan: 'rr-messen' }, { getan: 'temperatur-ohr' }] },
        warum: 'Tachykardie, Hypertonie und Fieber gehören zum vegetativen Entzugssyndrom.' },
      { id: 'p-anamnese', text: 'Wertschätzend nach Alkohol gefragt', gewicht: 2, kompetenzbereiche: ['II'], erfuellt: { flag: 'alkohol-angegeben' },
        warum: 'Menge und letzter Konsum entscheiden über die Gefahr. Vorwürfe verhindern ehrliche Antworten.' },
      { id: 'p-arzt', text: 'Arzt informiert', gewicht: 3, kompetenzbereiche: ['II', 'III'], erfuellt: { flag: 'arzt-informiert' },
        warum: 'Ein Entzug mit Halluzinationen kann in ein Delir oder einen Krampfanfall übergehen.' },
      { id: 'p-remonstration', text: 'Starre Gabe „bis er schläft“ hinterfragt', gewicht: 3, kompetenzbereiche: ['III', 'IV'], erfuellt: { flag: 'remonstriert:an-lorazepam-starr' },
        warum: 'Symptomgesteuerte Gabe nach Score verhindert Übersedierung (S3 alkoholbezogene Störungen).' },
      { id: 'p-gabe', text: 'Lorazepam nach Anordnung gegeben', gewicht: 2, kompetenzbereiche: ['I', 'III'], erfuellt: BEHANDELT,
        warum: 'Benzodiazepine verhindern Krampfanfälle und Delir im Entzug.' },
      { id: 'p-rueckauftrag', text: 'Score nach der Gabe erneut erhoben und gemeldet', gewicht: 2, kompetenzbereiche: ['II', 'III'], erfuellt: { auftrag: 'af-score', status: 'gemeldet' },
        warum: 'Die nächste Gabe richtet sich nach dem Score (Closed Loop).' },
      { id: 'p-frau', text: 'Einwilligung eingeholt und Ehefrau einbezogen', gewicht: 1, kompetenzbereiche: ['II', 'IV'],
        erfuellt: { alle: [{ flag: 'einwilligung-frau' }, { flag: 'fremdanamnese' }] },
        warum: 'Die Fremdanamnese (Menge, früherer Krampf) ist wichtig. Auskunft nur mit Einwilligung.' },
      { id: 'p-doku', text: 'Score, Gabe und Verlauf dokumentiert', gewicht: 2, kompetenzbereiche: ['I', 'IV'], erfuellt: { dokumentiert: 'a-score' },
        warum: 'Der Score-Verlauf steuert die weitere Behandlung über den Tag.' },
    ],
    fehler: [
      { id: 'f-gehen', text: 'Ihn im Entzug allein gehen lassen', schwere: 'schwer', kompetenzbereiche: ['I', 'IV'],
        wenn: { getan: 'wahl:e-gehen:w-gehen-lassen' },
        folge: { text: 'Herr Krüger stürzt auf dem Flur und belastet das operierte Bein voll.', wirkung: [{ groesse: 'schmerz', delta: 3, beginnSek: 0, spitzeSek: 60, dauerSek: 'dauerhaft' }] },
        warum: 'Mit Halluzinationen und Teilbelastung ist er nicht sicher; Sturz- und Krampfgefahr.' },
      { id: 'f-gitter', text: 'Bettgitter ohne Einwilligung oder Genehmigung hochgezogen', schwere: 'mittel', kompetenzbereiche: ['IV'],
        wenn: { getan: 'fem-anlegen' }, warum: 'Freiheitsentziehende Maßnahme; im Entzug steigert sie die Unruhe.' },
      { id: 'f-auskunft', text: 'Der Ehefrau ohne Einwilligung Auskunft gegeben', schwere: 'mittel', kompetenzbereiche: ['IV'],
        wenn: { alle: [{ getan: 'frage:g-frau' }, { nicht: { flag: 'einwilligung-frau' } }] }, warum: 'Schweigepflicht auch gegenüber Ehepartnern.' },
    ],
    ende: [
      { wenn: { alle: [{ flag: 'score-gemeldet' }, { getan: 'pflegebericht' }, { flag: 'fremdanamnese' }] },
        text: 'Herr Krüger liegt ruhiger im Bett, die Hände zittern kaum noch. Seine Frau sitzt bei ihm. Der Score wird stündlich erhoben.', ausgang: 'stabil' },
      { wenn: { ab: 3000 }, text: 'Herr Krüger hat ein Entzugsdelir entwickelt und wird auf die Intensivstation verlegt.', ausgang: 'verschlechtert' },
    ],
  },

  pflegebedarf: {
    probleme: [
      { id: 'pb-entzug', text: 'Alkoholentzugssyndrom mit Gefahr von Delir und Krampfanfall', richtig: true, prioritaet: 1, warum: 'Score erhöht, Halluzinationen, früher Entzugskrampf.' },
      { id: 'pb-sturz', text: 'Hohe Sturzgefahr', richtig: true, prioritaet: 2, warum: 'Unruhe, Zittern, Teilbelastung, Benzodiazepin.' },
      { id: 'pb-fluessigkeit', text: 'Flüssigkeitsverlust durch Schwitzen', richtig: true, prioritaet: 3, warum: 'Nachts schweißnass, Natrium niedrig-normal.' },
      { id: 'pb-charakter', text: 'Mangelnde Willensstärke', richtig: false, warum: 'Abhängigkeit ist eine Erkrankung, keine Charakterschwäche.' },
    ],
    ziele: [
      { id: 'z-score', text: 'Der Entzugsscore sinkt in den leichten Bereich, ohne dass Herr Krüger übersediert ist.', passtZu: ['pb-entzug'], richtig: true },
      { id: 'z-sturz', text: 'Herr Krüger steht nur mit Begleitung und Gehstützen auf und stürzt nicht.', passtZu: ['pb-sturz'], richtig: true },
      { id: 'z-trinken', text: 'Herr Krüger trinkt bis zum Abend mindestens 2 Liter.', passtZu: ['pb-fluessigkeit'], richtig: true },
      { id: 'z-schlafen', text: 'Herr Krüger schläft bis zum Mittag durch.', passtZu: ['pb-entzug'], richtig: false },
    ],
  },

  leitfaden: [
    { titel: 'Entzug erkennen', text: 'Zittern, Schwitzen, Unruhe, Übelkeit, Puls und Blutdruck hoch, Schlafstörung, Halluzinationen. Beginn meist 6 bis 24 Stunden nach dem letzten Konsum, Delir oft nach 48 bis 72 Stunden.', quellen: ['s3-alkohol'] },
    { titel: 'Einschätzen mit Score', text: 'CIWA-Ar oder AESB regelmäßig erheben. Der Score steuert die Medikamentengabe.', quellen: ['ciwa', 'aesb'] },
    { titel: 'Symptomgesteuert behandeln', text: 'Benzodiazepine nach Score, nicht starr „bis zum Schlaf“. Nach jeder Gabe Vigilanz und Atmung prüfen. Thiamin vor Glukose (Wernicke-Prophylaxe) gibt die Ärztin.', quellen: ['s3-alkohol', 'fi-lorazepam'] },
    { titel: 'Gespräch', text: 'Offen und ohne Vorwurf nach Menge und letztem Konsum fragen. Angehörige nur mit Einwilligung einbeziehen; ihre Angaben sind oft genauer.', quellen: ['s3-alkohol', 'stgb-203'] },
  ],

  pruefwege: {
    muster: [
      { art: 'massnahme', id: 'vorstellen-einverstaendnis' },
      { art: 'massnahme', id: 'beschwerden-erfragen' },
      { art: 'massnahme', id: 'entzug-einschaetzen' },
      { art: 'massnahme', id: 'puls-zaehlen' },
      { art: 'massnahme', id: 'rr-messen' },
      { art: 'massnahme', id: 'temperatur-ohr' },
      { art: 'frage', id: 'g-alkohol' },
      { art: 'massnahme', id: 'kurve-lesen' },
      { art: 'frage', id: 'g-kollege' },
      { art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: ['s-entzug', 'b-alkohol', 'a-score', 'wert:hf', 'wert:rrSys', 'wert:temp', 'r-anordnung'] },
      { art: 'remonstrieren', anordnung: 'an-lorazepam-starr', grund: 'Starr jede Stunde bis zum Schlaf reichert sich an. Bitte symptomgesteuert nach Score.' },
      { art: 'rueckmelden', anordnung: 'an-lorazepam-score', rueckgelesen: true },
      { art: 'rueckmelden', anordnung: 'an-thiamin', rueckgelesen: true },
      { art: 'auflegen', an: 'aerztin' },
      { art: 'massnahme', id: 'lorazepam-geben' },
      { art: 'massnahme', id: 'thiamin-geben' },
      { art: 'massnahme', id: 'sturzprophylaxe-bett' },
      { art: 'massnahme', id: 'reizarm-gestalten' },
      { art: 'massnahme', id: 'trinken-anbieten' },
      { art: 'frage', id: 'g-einwilligung' },
      { art: 'warten', sek: 120 },
      { art: 'frage', id: 'g-frau' },
      { art: 'warten', sek: 240 },
      { art: 'massnahme', id: 'entzug-einschaetzen' },
      { art: 'massnahme', id: 'bewusstsein-avpu' },
      { art: 'nachricht', an: 'aerztin', kanal: 'messenger', bausteine: ['a-score-besser', 'a-krampf'] },
      { art: 'dokumentieren', bausteine: ['a-score', 'a-score-besser', 'anordnung:an-lorazepam-score'] },
      { art: 'abschluss', probleme: ['pb-entzug', 'pb-sturz', 'pb-fluessigkeit'], ziele: ['z-score', 'z-sturz', 'z-trinken'],
        sbar: ['s-entzug', 'b-alkohol', 'a-score', 'a-krampf'] },
    ],
    unterlassung: { bisSek: 1800, erwartet: { wert: 'angst', vergleich: '>', grenze: 0.85 } },
    grenze: { rolle: 2, events: [{ art: 'massnahme', id: 'entzug-einschaetzen' }], erwartet: 'pa-eingriff' },
  },
};
