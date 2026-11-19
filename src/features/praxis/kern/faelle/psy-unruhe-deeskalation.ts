// Fallwelle P19 (CE 11) · Psychiatrie: akute Unruhe bei Psychose, Deeskalation statt Zwang
// Entwurf, fachlich UNGEPRÜFT. Inhalte fiktiv/didaktisch. Migriert und neu geschrieben aus Altfall „psychiatrie“ (scenarios.json).

import { KATALOG } from '../katalog';
import type { Bedingung, FallV2, MassnahmeDefinition } from '../typen';

const aus = (id: string, mehr: Partial<MassnahmeDefinition>): MassnahmeDefinition => ({ ...KATALOG[id]!, ...mehr });

const ANGESPANNT: Bedingung = { wert: 'angst', vergleich: '>=', grenze: 0.5 };

const ANTWORT = '„Danke für die Meldung. Ich bin gerade in der Aufnahme. Wenn er nicht runterkommt, fixieren Sie ihn, ich zeichne das nachher ab. Melden Sie sich in einer Viertelstunde, wie es läuft.“';
const R_ANORDNUNG = { id: 'r-anordnung', antwort: ANTWORT, anordnungen: ['an-fixierung'], setzt: ['arzt-informiert'], auftraege: ['af-verlauf'] };

export const PSY_UNRUHE_DEESKALATION: FallV2 = {
  schema: 2,
  id: 'psy-unruhe-deeskalation',
  version: '0.1.0',
  spur: 'A',
  setting: 'psychiatrie',
  altersgruppe: 'erwachsen',
  titel: '„Ihr steckt doch alle mit drin!“',
  kurz: 'Akutpsychiatrie, später Nachmittag: Ein Patient mit Psychose wird im Aufenthaltsraum laut und bedrohlich.',
  rahmen: 'Du bist im Spätdienst auf der allgemeinpsychiatrischen Akutstation, deine Praxisanleiterin ist im Dienstzimmer. Aus dem Aufenthaltsraum hörst du lautes Rufen.',
  lernziele: [
    'Frühe Zeichen einer Eskalation erkennen und die eigene Sicherheit wahren (Abstand, Fluchtweg, Team).',
    'Deeskalierend sprechen: ruhig, kurz, wertschätzend, Wahlmöglichkeiten anbieten.',
    'Die Situation reizarm gestalten und Mitpatientinnen schützen.',
    'Eine telefonische Fixierungsanordnung als unzulässig erkennen und remonstrieren.',
    'Schweigepflicht gegenüber Angehörigen ohne Entbindung wahren.',
  ],
  lehrplan: {
    ce: ['ce.11', 'ce.06'], abschnitt: ['ad12', 'ad3'],
    themen: ['thema.fa.psychiatrie', 'thema.kl.psych', 'thema.re.fem', 'thema.re.schweigepflicht', 'thema.kom.gespraech'],
    kompetenzen: ['I.6.a', 'II.1.b', 'II.1.d', 'III.2.a', 'IV.1.b'],
  },
  geeignet: { rollen: [2, 3], stufen: [1, 2, 3] },
  dauerMin: [12, 18],
  freigabe: {
    status: 'entwurf',
    pruefpunkte: [
      'Deeskalation gegen S3-Leitlinie „Verhinderung von Zwang: Prävention und Therapie aggressiven Verhaltens bei Erwachsenen“ (DGPPN 2018, AWMF 038-022) prüfen',
      'Remonstrationspunkt: Fixierung nur nach persönlicher ärztlicher Untersuchung und Anordnung, 1:1-Betreuung, ab 30 Minuten richterliche Genehmigung (BVerfG 2 BvR 309/15, 24.07.2018; PsychKHG BW)',
      'Deeskalation erst im 3. Drittel ausdrücklich im Lehrplan (CE 11); im 2. Drittel mit Anleitung',
      'Bedarfsmedikation Lorazepam als freiwilliges Angebot; ärztliche Verantwortung',
      'Modell: Unruhe über panik_eskaliert (Angst steigt), deeskalierendes Gespräch beendet den Anstieg. Kein eigenes Psychose-Modell.',
      'Foto: Aufenthaltsraum Psychiatrie fehlt, vorläufig Speiseraum als Beispielbild (MATERIAL-BEDARF.md)',
    ],
  },
  quellen: [
    { id: 's3-zwang', titel: 'S3-Leitlinie Verhinderung von Zwang: Prävention und Therapie aggressiven Verhaltens bei Erwachsenen (DGPPN, AWMF 038-022), 2018, Überarbeitung angekündigt' },
    { id: 's3-schizo', titel: 'S3-Leitlinie Schizophrenie (DGPPN, AWMF 038-009), 2019, Update 2025' },
    { id: 'bverfg-fix', titel: 'BVerfG, Urteil vom 24.07.2018 – 2 BvR 309/15 und 2 BvR 502/16 (Fixierung)' },
    { id: 'psychkhg-bw', titel: 'Gesetz über Hilfen und Schutzmaßnahmen bei psychischen Krankheiten Baden-Württemberg (PsychKHG BW), § 25' },
    { id: 'stgb-203', titel: 'StGB § 203 Verletzung von Privatgeheimnissen (Schweigepflicht)' },
  ],

  person: {
    name: 'Daniel Weber',
    alter: { jahre: 32 },
    geschlecht: 'm',
    biografie: ['gelernter Mechatroniker, zurzeit arbeitslos', 'wohnt allein, Kontakt zur Mutter', 'spielt Gitarre, hört gern laute Musik'],
    diagnosenBekannt: ['Paranoide Schizophrenie seit dem 23. Lebensjahr', 'Cannabiskonsum'],
    medikamentePlan: ['Aripiprazol 15 mg 1-0-0 (hat er vor drei Wochen selbst abgesetzt, seit Aufnahme wieder)', 'Bedarf: Lorazepam 1 mg bei Unruhe bis 3× täglich'],
    allergien: ['keine bekannt'],
    gewichtKg: 78,
  },
  medien: {
    raum: '11_pflegeheim_speiseraum',   // Beispielbild: Aufenthaltsraum Psychiatrie fehlt (MATERIAL-BEDARF.md)
  },
  uebernahme: 'Herr Weber, 32, seit zwei Tagen freiwillig bei uns, paranoide Psychose nach Absetzen der Medikamente. Schläft schlecht, misstrauisch gegenüber Mitpatienten, heute Mittag die Tablette nur nach langem Zureden genommen. Bedarf Lorazepam ist angesetzt, heute noch nichts bekommen.',
  startUhrzeit: '16:40',

  start: {
    // Angespannt-misstrauisch; ohne Deeskalation steigt die Anspannung (panik_eskaliert als Näherung).
    grund: { angst: 0.55, unruhe: 0.6, orientierung: 0.9, schmerz: 0, temperatur: 36.9 },
    treiber: [{ art: 'panik_eskaliert', tempo: 1 }],
    bild: { haltung: 'unruhig', haut: 'rosig', mimik: 'angst' },
    sichtbar: [],
  },

  massnahmen: [
    // Gespräch
    'vorstellen-einverstaendnis', 'deeskalierend-sprechen', 'beruhigen-zusprechen', 'beschwerden-erfragen', 'suizidalitaet-ansprechen',
    // Beobachten
    'ersteindruck-abcde', 'haut-beobachten', 'atmung-beobachten', 'bewusstsein-avpu',
    // Akut
    'hilfe-holen', 'reizarm-gestalten', 'gefaehrliche-gegenstaende-sichern', 'sitzwache', 'fem-anlegen', 'festhalten',
    // Messen
    'puls-zaehlen', 'rr-messen', 'kurve-lesen',
    // Versorgen
    'lorazepam-angebot', 'trinken-anbieten',
    // Melden
    'pflegefachperson-informieren', 'pflegebericht',
  ],
  massnahmenZusatz: [
    aus('deeskalierend-sprechen', { beendet: ['panik_eskaliert'] }),
    aus('bedarfsmedikation-oral', {
      id: 'lorazepam-angebot', name: 'Lorazepam 1 mg als Schmelztablette anbieten (Bedarf, freiwillig)',
      treiber: [{ art: 'wirkstoff', id: 'lorazepam', dosisMg: 1, weg: 'sublingual' }],
    }),
    {
      id: 'festhalten', name: 'Ihn am Arm festhalten und in sein Zimmer bringen', reiter: 'akut', spur: 'A', zeitbedarfSekunden: 30,
      befugnis: { 1: 'gesperrt', 2: 'gesperrt', 3: 'gesperrt', pflegefachperson: 'gesperrt' }, kompetenzbereiche: ['IV'], setzt: ['festgehalten'],
      risikoBeiUeberschreitung: 'patientenschaden',
      wirkung: [{ groesse: 'angst', delta: 0.3, beginnSek: 0, spitzeSek: 60, dauerSek: 'dauerhaft' }],
    },
  ],

  akte: {
    aufnahmegrund: 'Freiwillige Aufnahme vor zwei Tagen über die Institutsambulanz: zunehmendes Misstrauen, fühlt sich von Nachbarn abgehört, schläft kaum. Aripiprazol vor drei Wochen selbst abgesetzt.',
    anamnese: [
      'Dritte stationäre Behandlung. Bisher nie fremdaggressiv, einmal Sachbeschädigung (Tür) vor vier Jahren.',
      'Cannabiskonsum am Wochenende, Drogenscreening bei Aufnahme positiv für THC.',
      'Krisenplan aus der letzten Behandlung: hilft, wenn man ihm Zeit lässt, nicht anfasst und eine Person mit ihm spricht; Musik über Kopfhörer.',
      'Keine Schweigepflichtentbindung gegenüber Angehörigen. Mutter ruft häufig an.',
    ],
    diagnosen: [
      { text: 'Paranoide Schizophrenie, akute Episode', icd: 'F20.0', seit: '2017' },
      { text: 'Schädlicher Gebrauch von Cannabinoiden', icd: 'F12.1', seit: '2019' },
    ],
    medikation: [
      { id: 'mp-aripiprazol', wirkstoff: 'Aripiprazol', staerke: '15 mg', form: 'Tbl.', schema: '1-0-0-0', zuletzt: '12:30', hinweis: 'nach langem Zureden genommen' },
      { id: 'mp-lorazepam', wirkstoff: 'Lorazepam', staerke: '1 mg', form: 'Schmelztbl.', bedarf: { indikation: 'Unruhe, Anspannung', einzeldosis: '1 mg', maxProTag: '3 mg', abstandH: 4 }, massnahme: 'lorazepam-angebot' },
    ],
    vorwerte: [
      { zeit: 'heute 08:00', vorH: 9, werte: { rrSys: 128, rrDia: 78, hf: 84, af: 16, spo2: 98, temp: 36.7 }, kuerzel: 'FD' },
    ],
    pflegebericht: [
      { zeit: '13:00', wer: 'FD', text: 'Medikament nach längerem Gespräch genommen. Isst allein im Zimmer, fühlt sich von Herrn Kunz beobachtet. Kein Ausgang.' },
      { zeit: '15:30', wer: 'SD', text: 'Läuft viel auf dem Flur, Kopfhörer auf, reagiert gereizt auf Ansprache durch Mitpatienten.' },
    ],
    aerztlicheAnordnungen: [
      { zeit: 'Aufnahme', wer: 'Dr. Brandl', text: 'Aripiprazol 15 mg morgens. Bedarf: Lorazepam 1 mg bei Unruhe bis 3× tgl., Abstand 4 h. Krisenplan beachten.' },
    ],
    assessments: [{ name: 'Brøset-Gewaltcheckliste (BVC)', wert: '2', datum: 'heute 08:00' }],
    labor: [{ name: 'Drogenscreening Urin', wert: 'THC positiv', datum: 'Aufnahme', auffaellig: true }],
    rechtliches: ['Freiwillige Behandlung, keine Unterbringung, keine Betreuung.', 'Keine Schweigepflichtentbindung gegenüber der Mutter.'],
  },

  befunde: [
    { massnahme: 'vorstellen-einverstaendnis', varianten: [
      { wenn: ANGESPANNT, text: 'Er dreht sich zu dir: „Was willst du? Hat der dich geschickt?“ Er zeigt auf Herrn Kunz am Fenster.' },
      { text: 'Er nickt knapp: „Ja. Okay.“' },
    ] },
    { massnahme: 'ersteindruck-abcde', varianten: [{ text: 'Steht zwischen Tisch und Fenster, Fäuste geballt, laute schnelle Sprache, schwitzt. Ein Stuhl liegt umgekippt. Die Tür hinter dir ist frei. Zwei Mitpatientinnen sitzen ängstlich am Tisch.' }] },
    { massnahme: 'haut-beobachten', varianten: [{ text: 'Gerötetes Gesicht, Schweiß auf der Stirn.' }] },
    { massnahme: 'atmung-beobachten', varianten: [{ text: 'Atmet schnell und flach, spricht in kurzen Stößen.' }] },
    { massnahme: 'bewusstsein-avpu', varianten: [{ text: 'Wach, aufmerksam, misstrauisch (AVPU {avpu}).', zeigt: ['avpu'] }] },
    { massnahme: 'beschwerden-erfragen', varianten: [
      { wenn: ANGESPANNT, text: '„Der da filmt mich mit seiner Uhr! Die wollen wissen, was ich denke.“' },
      { text: '„Ich hab seit drei Nächten kaum geschlafen. Der Kunz macht mich fertig. Ich will einfach nur Ruhe.“' },
    ] },
    { massnahme: 'deeskalierend-sprechen', varianten: [
      { text: 'Du bleibst zwei Armlängen entfernt, seitlich, die Tür im Rücken. Ruhig: „Herr Weber, ich sehe, dass Sie sich bedroht fühlen. Ich bin da, um zu helfen. Wollen wir in Ihr Zimmer oder auf den Flur gehen, wo es ruhiger ist?“ Er atmet aus: „Flur. Aber der kommt nicht mit.“' },
    ] },
    { massnahme: 'beruhigen-zusprechen', varianten: [{ text: 'Er hört zu, schaut aber immer wieder zu Herrn Kunz.' }] },
    { massnahme: 'reizarm-gestalten', varianten: [{ text: 'Du bittest die Mitpatientinnen und Herrn Kunz freundlich, kurz in den Gruppenraum zu gehen, und machst den Fernseher aus. Nur du sprichst mit Herrn Weber.' }] },
    { massnahme: 'gefaehrliche-gegenstaende-sichern', varianten: [{ text: 'Mit deiner Anleiterin stellst du den umgekippten Stuhl weg und räumst Tassen und Besteck vom Tisch.' }] },
    { massnahme: 'sitzwache', varianten: [{ text: 'Eine Kollegin bleibt in Sichtweite auf dem Flur, ohne sich einzumischen.' }] },
    { massnahme: 'suizidalitaet-ansprechen', varianten: [{ text: '„Nein, ich will mir nichts tun. Ich will, dass die mich in Ruhe lassen.“' }] },
    { massnahme: 'puls-zaehlen', varianten: [{ text: 'Puls {hf}/min.', zeigt: ['hf'] }] },
    { massnahme: 'rr-messen', varianten: [{ text: 'RR {rrSys}/{rrDia} mmHg.', zeigt: ['rrSys', 'rrDia'] }] },
    { massnahme: 'kurve-lesen', varianten: [{ text: 'Krisenplan: nicht anfassen, Zeit lassen, eine Person spricht, Musik. Bedarf Lorazepam 1 mg bis 3× täglich, heute noch nicht gegeben. Aripiprazol 12:30 nach Zureden. Keine Schweigepflichtentbindung für die Mutter.' }] },
    { massnahme: 'lorazepam-angebot', varianten: [{ text: 'Er überlegt, dann nimmt er die Schmelztablette: „Aber nur, weil Sie fragen.“' }] },
    { massnahme: 'trinken-anbieten', varianten: [{ text: 'Er trinkt ein Glas Wasser in einem Zug.' }] },
    { massnahme: 'fem-anlegen', varianten: [{ text: 'Mehrere Kolleginnen kommen dazu. Herr Weber wehrt sich heftig und schreit.' }] },
    { massnahme: 'festhalten', varianten: [{ text: 'Er reißt sich los, stößt dich weg und schreit: „Fass mich nicht an!“' }] },
  ],

  gespraech: [
    { id: 'g-krisenplan', frage: 'Herrn Weber fragen, was ihm in solchen Momenten hilft', an: 'patient', kompetenzbereiche: ['II'],
      nurWenn: { getan: 'deeskalierend-sprechen' },
      antwort: [{ text: '„Musik. Und dass mich keiner anfasst. Ich will in mein Zimmer, mit Kopfhörern.“', setzt: ['hilfe-erfragt'] }] },
    { id: 'g-mitpatientin', frage: 'Mitpatientin Frau Sommer fragen, wie es ihr geht, und ihr den ruhigen Raum anbieten', an: 'patient', kompetenzbereiche: ['II'],
      antwort: [{ text: '„Ich hab mich echt erschrocken. Danke, dass Sie gekommen sind. Ich geh rüber in den Gruppenraum.“', setzt: ['mitpatienten-versorgt'] }] },
    { id: 'g-pa-team', frage: 'Praxisanleiterin dazuholen und Rollen absprechen (eine spricht, eine sichert ab)', an: 'pa', kompetenzbereiche: ['III'],
      antwort: [{ text: '„Gut, du sprichst, ich bleibe an der Tür. Kein Anfassen, wir haben Zeit.“', setzt: ['team-abgesprochen'] }] },
    { id: 'g-mutter-auskunft', frage: 'Der Mutter am Telefon sagen, wie es ihrem Sohn geht', an: 'angehoerige', kompetenzbereiche: ['II', 'IV'],
      nurWenn: { ab: 600 },
      schweigepflicht: { erlaubtWenn: { flag: 'entbindung-mutter' },
        fehlerText: 'Herr Weber hat die Mutter nicht von der Schweigepflicht entbunden. Du darfst nicht einmal bestätigen, dass er hier ist. Du kannst ihr anbieten, ihm etwas auszurichten.' },
      antwort: [{ text: '„Also ist es wieder so schlimm … Danke, dass Sie mir das sagen.“' }] },
    { id: 'g-mutter-verweis', frage: 'Der Mutter erklären, dass du keine Auskunft geben darfst, und anbieten, eine Nachricht auszurichten', an: 'angehoerige', kompetenzbereiche: ['II', 'IV'],
      nurWenn: { ab: 600 },
      antwort: [{ text: '„Das versteh ich. Sagen Sie ihm bitte, ich hab ihn lieb und er kann mich anrufen.“', setzt: ['mutter-verwiesen'] }] },
  ],

  sbar: [
    { id: 's-unruhe', teil: 'S', text: 'Daniel Weber, 32, Akutstation: seit einer Viertelstunde stark angespannt und laut, hat im Aufenthaltsraum einen Stuhl umgeworfen.', art: 'kern' },
    { id: 'b-psychose', teil: 'B', text: 'Paranoide Psychose, Medikamente vor drei Wochen abgesetzt, seit zwei Tagen freiwillig hier. Aripiprazol heute Mittag genommen.', art: 'kern' },
    { id: 'b-medikamente', teil: 'B', text: 'Bedarf Lorazepam heute noch nicht gegeben.', art: 'kern', bekanntWenn: { getan: 'kurve-lesen' } },
    { id: 'b-gitarre', teil: 'B', text: 'Er spielt Gitarre.', art: 'ablenker' },
    { id: 'a-deeskaliert', teil: 'A', text: 'Fühlt sich von einem Mitpatienten verfolgt. Im Gespräch etwas ruhiger, kein Hinweis auf Eigengefährdung, Mitpatienten in Sicherheit.', art: 'kern',
      bekanntWenn: { alle: [{ getan: 'deeskalierend-sprechen' }, { getan: 'reizarm-gestalten' }] } },
    { id: 'a-ruhig', teil: 'A', text: 'Hat Lorazepam freiwillig genommen, sitzt mit Kopfhörern in seinem Zimmer, ruhig.', art: 'hilfreich',
      bekanntWenn: { alle: [{ getan: 'lorazepam-angebot' }, { nicht: ANGESPANNT }] } },
    { id: 'a-gefaehrlich', teil: 'A', text: 'Er ist gefährlich und muss fixiert werden.', art: 'falsch' },
    { id: 'r-kommen', teil: 'R', text: 'Bitte kommen Sie ihn ansehen. Dürfen wir ihm das Lorazepam anbieten?', art: 'kern' },
  ],

  anordnungen: [
    { id: 'an-fixierung', massnahme: 'fem-anlegen', text: 'Bei weiterer Unruhe 5-Punkt-Fixierung, Abzeichnung später.',
      fehlerhaft: {
        warum: 'Eine Fixierung darf nur bei gegenwärtiger erheblicher Gefahr, nach persönlicher ärztlicher Untersuchung und Anordnung und mit 1:1-Betreuung erfolgen; ab 30 Minuten braucht sie eine richterliche Genehmigung. Eine telefonische „Vorratsanordnung“ ist unzulässig, und Herr Weber lässt sich gerade deeskalieren.',
        korrektur: '„Sie haben recht, das war vorschnell. Keine Fixierung. Bieten Sie ihm das Lorazepam aus dem Bedarf an, freiwillig. Ich komme nach der Aufnahme vorbei.“',
        ersatz: 'an-lorazepam',
      } },
    { id: 'an-lorazepam', massnahme: 'lorazepam-angebot', text: 'Lorazepam 1 mg Schmelztablette anbieten, freiwillig.' },
  ],

  arzt: {
    name: 'Stationsärztin Dr. Brandl',
    erreichbar: 'telefon',
    regeln: [
      { ...R_ANORDNUNG, wenn: { gemeldet: ['a-deeskaliert', 'b-medikamente'] } },
      { id: 'r-med-frage', wenn: { gemeldet: ['a-deeskaliert'] },
        antwort: '„Gut, dass er sich ansprechen lässt.“',
        rueckfrage: { text: '„Hat er heute schon etwas aus dem Bedarf bekommen?“', erwartet: ['b-medikamente'], auftrag: 'af-bedarf' } },
      { wenn: { gemeldet: ['a-gefaehrlich'] }, antwort: '„Was genau macht er gerade? Lässt er sich ansprechen? Eine Fixierung ist das allerletzte Mittel.“' },
    ],
    auftraege: [
      { id: 'af-bedarf', text: 'In der Kurve nachsehen, ob er heute Bedarf bekommen hat, und melden', erledigt: { getan: 'kurve-lesen' }, meldung: ['b-medikamente'], meldenBinnenSek: 300,
        folge: [{ ...R_ANORDNUNG, wenn: { gemeldet: ['a-deeskaliert'] } }] },
      { id: 'af-verlauf', text: 'In einer Viertelstunde melden, wie es ihm geht', meldenBinnenSek: 1800,
        erledigt: { alle: [{ getan: 'lorazepam-angebot' }, { ab: 840 }] },
        meldung: ['a-ruhig'],
        folge: [{ wenn: { ab: 0 }, antwort: '„Sehr gut, danke. Ich schaue nachher bei ihm vorbei. Bitte heute Abend engmaschig im Blick behalten.“', setzt: ['verlauf-gemeldet'] }] },
    ],
  },

  ereignisse: [
    { id: 'e-naehe', art: 'komplikation', wann: { ab: 240 },
      text: 'Herr Weber macht zwei schnelle Schritte auf dich zu und schreit: „Du bist auch einer von denen!“',
      entscheidung: [
        { id: 'w-abstand', text: 'Einen Schritt zurück zur Tür, Hände offen und sichtbar, ruhig seinen Namen sagen und ihm Raum geben', wertung: 'gut', warum: 'Abstand und Fluchtweg schützen dich, offene Haltung signalisiert keine Bedrohung.' },
        { id: 'w-greifen', text: 'Seinen Arm greifen, damit er stehen bleibt', wertung: 'gefaehrlich', warum: 'Körperkontakt wird als Angriff erlebt und eskaliert. Er steht nicht unter Unterbringung und hat nichts angeordnet bekommen.' },
      ] },
    { id: 'e-mutter', art: 'angehoerige', wann: { ab: 600 }, text: 'Das Stationstelefon klingelt: Frau Weber, die Mutter, fragt, ob ihr Sohn auf Station ist und wie es ihm geht.' },
    { id: 'e-aerztin', art: 'visite', wann: { alle: [{ flag: 'verlauf-gemeldet' }, { ab: 1200 }] },
      text: 'Dr. Brandl spricht mit Herrn Weber in seinem Zimmer. Er ist einverstanden, heute Abend früher schlafen zu gehen.' },
  ],

  pa: {
    name: 'Praxisanleiterin Frau Yıldız',
    hilfen: [
      { wenn: { nicht: { getan: 'deeskalierend-sprechen' } }, impuls: 'Wo stehst du, und wie sprichst du ihn an?', tipp: 'Seitlich, zwei Armlängen Abstand, Tür im Rücken, ruhig und kurz, Wahlmöglichkeiten.' },
      { wenn: { nicht: { getan: 'reizarm-gestalten' } }, impuls: 'Wer ist noch im Raum, und was regt ihn auf?', tipp: 'Mitpatienten hinausbitten, Fernseher aus, nur eine Person spricht.' },
      { wenn: { nicht: { getan: 'kurve-lesen' } }, impuls: 'Gibt es einen Krisenplan von ihm?', tipp: 'Kurve lesen: Was hilft ihm, was ist als Bedarf angesetzt?' },
      { wenn: { alle: [{ flag: 'arzt-informiert' }, { nicht: { flag: 'remonstriert:an-fixierung' } }] }, impuls: 'Darf man am Telefon eine Fixierung „auf Vorrat“ anordnen?', tipp: 'Nein. Persönliche ärztliche Untersuchung, 1:1-Betreuung, ab 30 Minuten Richter. Frag nach.' },
      { impuls: 'Was darfst du der Mutter sagen?', tipp: 'Nichts, auch nicht, dass er hier ist. Nachricht ausrichten ist erlaubt.' },
    ],
  },
  team: { kollegin: 'Kollege Jonas (Spätdienst)', weitere: { angehoerige: 'Mutter Frau Weber (am Telefon)' } },

  bewertung: {
    pflicht: [
      { id: 'p-deeskalation', text: 'Früh deeskalierend gesprochen', gewicht: 3, kompetenzbereiche: ['II', 'III'], erfuellt: { getan: 'deeskalierend-sprechen', bis: 300 },
        warum: 'Je früher die Deeskalation, desto seltener wird Zwang nötig (S3 Verhinderung von Zwang).' },
      { id: 'p-team', text: 'Team dazugeholt und Rollen abgesprochen', gewicht: 2, kompetenzbereiche: ['III'], erfuellt: { flag: 'team-abgesprochen' },
        warum: 'Allein in eine Eskalation zu gehen, gefährdet dich. Eine spricht, eine sichert.' },
      { id: 'p-reizarm', text: 'Reize verringert, Mitpatienten geschützt', gewicht: 2, kompetenzbereiche: ['I', 'II'], erfuellt: { alle: [{ getan: 'reizarm-gestalten' }, { flag: 'mitpatienten-versorgt' }] },
        warum: 'Weniger Reize senken die Anspannung; die Mitpatientinnen haben auch ein Recht auf Schutz.' },
      { id: 'p-krisenplan', text: 'Krisenplan gelesen und nach Hilfreichem gefragt', gewicht: 2, kompetenzbereiche: ['I', 'II'], erfuellt: { alle: [{ getan: 'kurve-lesen' }, { flag: 'hilfe-erfragt' }] },
        warum: 'Er weiß selbst am besten, was ihm hilft. Das stärkt seine Selbstbestimmung.' },
      { id: 'p-arzt', text: 'Ärztin informiert', gewicht: 2, kompetenzbereiche: ['II', 'III'], erfuellt: { flag: 'arzt-informiert' },
        warum: 'Akute Psychose mit Anspannung braucht ärztliche Einschätzung und Bedarfsmedikation.' },
      { id: 'p-remonstration', text: 'Telefonische Fixierungsanordnung zurückgewiesen', gewicht: 3, kompetenzbereiche: ['III', 'IV'], erfuellt: { flag: 'remonstriert:an-fixierung' },
        warum: 'Fixierung ist ein schwerer Grundrechtseingriff mit strengen Voraussetzungen (BVerfG 2018).' },
      { id: 'p-angebot', text: 'Bedarfsmedikation freiwillig angeboten', gewicht: 2, kompetenzbereiche: ['I', 'III'], erfuellt: { getan: 'lorazepam-angebot' },
        warum: 'Ein freiwilliges Angebot respektiert die Autonomie und senkt die Anspannung.' },
      { id: 'p-rueckauftrag', text: 'Verlauf an die Ärztin gemeldet', gewicht: 2, kompetenzbereiche: ['II', 'III'], erfuellt: { auftrag: 'af-verlauf', status: 'gemeldet' },
        warum: 'Die Ärztin braucht die Rückmeldung (Closed Loop).' },
      { id: 'p-schweigepflicht', text: 'Der Mutter keine Auskunft gegeben, Nachricht angeboten', gewicht: 2, kompetenzbereiche: ['II', 'IV'],
        erfuellt: { alle: [{ flag: 'mutter-verwiesen' }, { nicht: { getan: 'frage:g-mutter-auskunft' } }] },
        warum: 'Ohne Entbindung gilt die Schweigepflicht auch gegenüber Eltern erwachsener Patienten.' },
      { id: 'p-doku', text: 'Situation und Deeskalation dokumentiert', gewicht: 2, kompetenzbereiche: ['I', 'IV'], erfuellt: { dokumentiert: 'a-deeskaliert' },
        warum: 'Die Dokumentation hilft, den Krisenplan weiterzuentwickeln.' },
    ],
    fehler: [
      { id: 'f-festhalten', text: 'Ihn ohne Notwehrlage körperlich festgehalten', schwere: 'schwer', kompetenzbereiche: ['IV', 'II'],
        wenn: { eine: [{ getan: 'festhalten' }, { getan: 'wahl:e-naehe:w-greifen' }] },
        folge: { text: 'Herr Weber reißt sich los, schreit und stößt einen Stuhl gegen die Wand.', wirkung: [{ groesse: 'angst', delta: 0.3, beginnSek: 0, spitzeSek: 60, dauerSek: 'dauerhaft' }] },
        warum: 'Körperkontakt eskaliert und ist ohne Gefahr oder Anordnung ein Eingriff in seine Freiheit.' },
      { id: 'f-fixierung', text: 'Fixierung ohne ärztliche Untersuchung durchgeführt', schwere: 'schwer', kompetenzbereiche: ['IV', 'III'],
        wenn: { getan: 'fem-anlegen' }, warum: 'Unzulässig ohne persönliche ärztliche Anordnung, 1:1-Betreuung und ggf. richterliche Genehmigung.' },
    ],
    ende: [
      { wenn: { alle: [{ flag: 'verlauf-gemeldet' }, { getan: 'pflegebericht' }, { flag: 'mutter-verwiesen' }] },
        text: 'Herr Weber liegt mit Kopfhörern auf seinem Bett. Er hat dir gesagt, dass er der Mutter morgen selbst anrufen will.', ausgang: 'stabil' },
      { wenn: { ab: 2400 }, text: 'Herr Weber ist eskaliert, ein Mitpatient wurde verletzt. Es kam zu einer Zwangsmaßnahme.', ausgang: 'verschlechtert' },
    ],
  },

  pflegebedarf: {
    probleme: [
      { id: 'pb-anspannung', text: 'Hohe Anspannung mit Gefahr fremdaggressiven Verhaltens durch Verfolgungserleben', richtig: true, prioritaet: 1, warum: 'Fühlt sich verfolgt, laut, Stuhl umgeworfen.' },
      { id: 'pb-schlaf', text: 'Schlafmangel', richtig: true, prioritaet: 2, warum: 'Seit drei Nächten kaum geschlafen, verstärkt die Psychose.' },
      { id: 'pb-adhaerenz', text: 'Unsichere Medikamenteneinnahme', richtig: true, prioritaet: 2, warum: 'Hat abgesetzt, nimmt nur nach Zureden.' },
      { id: 'pb-gefaehrlich', text: 'Gefährlicher Patient', richtig: false, warum: 'Etikett statt Pflegeproblem. Beschreibe Verhalten und Ursache.' },
    ],
    ziele: [
      { id: 'z-ruhig', text: 'Herr Weber kann seine Anspannung äußern und nimmt Hilfsangebote an, ohne dass Zwang nötig wird.', passtZu: ['pb-anspannung'], richtig: true },
      { id: 'z-schlaf', text: 'Herr Weber schläft heute Nacht mindestens fünf Stunden.', passtZu: ['pb-schlaf'], richtig: true },
      { id: 'z-plan', text: 'Herr Weber nimmt die Medikamente nach Absprache und benennt einen Grund dafür.', passtZu: ['pb-adhaerenz'], richtig: true },
      { id: 'z-fix', text: 'Herr Weber wird bei der nächsten Unruhe sofort fixiert.', passtZu: ['pb-anspannung'], richtig: false },
    ],
  },

  leitfaden: [
    { titel: 'Eigenschutz und Team', text: 'Abstand von zwei Armlängen, seitlich stehen, Fluchtweg frei. Nicht allein: eine Person spricht, eine sichert ab.', quellen: ['s3-zwang'] },
    { titel: 'Deeskalierend sprechen', text: 'Ruhig, langsam, kurze Sätze. Gefühle benennen, nicht diskutieren über Wahninhalte. Wahlmöglichkeiten anbieten, Zeit lassen.', quellen: ['s3-zwang', 's3-schizo'] },
    { titel: 'Milieu', text: 'Reize verringern, Mitpatienten schützen, auf den Krisenplan zurückgreifen.', quellen: ['s3-zwang'] },
    { titel: 'Zwang nur als letztes Mittel', text: 'Fixierung nur bei gegenwärtiger erheblicher Gefahr, nach persönlicher ärztlicher Untersuchung und Anordnung, mit 1:1-Betreuung; ab 30 Minuten richterliche Genehmigung. Eine Anordnung „auf Vorrat“ ist unzulässig.', quellen: ['bverfg-fix', 'psychkhg-bw'] },
    { titel: 'Schweigepflicht', text: 'Ohne Entbindung keine Auskunft an Angehörige, auch nicht, ob jemand auf Station ist. Nachrichten ausrichten ist erlaubt.', quellen: ['stgb-203'] },
  ],

  pruefwege: {
    muster: [
      { art: 'frage', id: 'g-pa-team' },
      { art: 'massnahme', id: 'ersteindruck-abcde' },
      { art: 'massnahme', id: 'deeskalierend-sprechen' },
      { art: 'massnahme', id: 'reizarm-gestalten' },
      { art: 'frage', id: 'g-mitpatientin' },
      { art: 'frage', id: 'g-krisenplan' },
      { art: 'massnahme', id: 'kurve-lesen' },
      { art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: ['s-unruhe', 'b-psychose', 'b-medikamente', 'a-deeskaliert', 'r-kommen'] },
      { art: 'remonstrieren', anordnung: 'an-fixierung', grund: 'Er lässt sich ansprechen, es gibt keine gegenwärtige Gefahr, und eine Fixierung braucht Ihre persönliche Untersuchung.' },
      { art: 'rueckmelden', anordnung: 'an-lorazepam', rueckgelesen: true },
      { art: 'auflegen', an: 'aerztin' },
      { art: 'massnahme', id: 'lorazepam-angebot' },
      { art: 'massnahme', id: 'trinken-anbieten' },
      { art: 'massnahme', id: 'puls-zaehlen' },
      { art: 'frage', id: 'g-mutter-verweis' },
      { art: 'warten', sek: 480 },
      { art: 'massnahme', id: 'beschwerden-erfragen' },
      { art: 'nachricht', an: 'aerztin', kanal: 'messenger', bausteine: ['a-ruhig'] },
      { art: 'dokumentieren', bausteine: ['a-deeskaliert', 'a-ruhig', 'anordnung:an-lorazepam'] },
      { art: 'abschluss', probleme: ['pb-anspannung', 'pb-schlaf', 'pb-adhaerenz'], ziele: ['z-ruhig', 'z-schlaf', 'z-plan'],
        sbar: ['s-unruhe', 'b-psychose', 'b-medikamente', 'a-deeskaliert', 'a-ruhig'] },
    ],
    unterlassung: { bisSek: 1200, erwartet: { wert: 'angst', vergleich: '>', grenze: 0.85 } },
    grenze: { rolle: 2, events: [{ art: 'massnahme', id: 'gefaehrliche-gegenstaende-sichern' }], erwartet: 'pa-eingriff' },
  },
};
