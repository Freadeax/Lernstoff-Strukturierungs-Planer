// Fallwelle P19 (CE 10) · Pädiatrie: Alkoholintoxikation bei einer Jugendlichen im Nachtdienst
// Entwurf, fachlich UNGEPRÜFT. Inhalte fiktiv/didaktisch. Migriert und neu geschrieben aus Altfall „rausch“ (scenarios.json).

import { KATALOG } from '../katalog';
import type { Bedingung, FallV2, MassnahmeDefinition } from '../typen';

const aus = (id: string, mehr: Partial<MassnahmeDefinition>): MassnahmeDefinition => ({ ...KATALOG[id]!, ...mehr });

const SEITE: Bedingung = { getan: 'stabile-seitenlage' };
const SCHLAEFRIG: Bedingung = { wert: 'vigilanz', vergleich: '<', grenze: 0.7 };
const MUTTER_DA: Bedingung = { ab: 1100 };

const KOMMT = '„Danke. Ich bin gerade im Kreißsaal gebunden, in etwa einer Viertelstunde bei Ihnen. Seitenlage, Monitor, warm zudecken. Hängen Sie die Infusion mit Glukose an, Vollelektrolyt mit 5 % Glukose, 60 ml pro Stunde, der Zugang aus der Notaufnahme liegt ja. Und geben Sie ihr gleich Traubenzucker-Gel in den Mund. In zwanzig Minuten messen Sie bitte Zucker und Temperatur nach und schreiben mir.“';
const R_KOMMT = { id: 'r-kommt', antwort: KOMMT, anordnungen: ['an-glukose-infusion', 'an-gel'], kommtNachSek: 900, setzt: ['arzt-kommt'], auftraege: ['af-kontrolle'] };

export const PAED_RAUSCH_JUGENDLICHE: FallV2 = {
  schema: 2,
  id: 'paed-rausch-jugendliche',
  version: '0.1.0',
  spur: 'A',
  setting: 'paediatrie',
  altersgruppe: 'jugendlich',
  titel: '„Nach der Party nicht richtig wach“',
  kurz: 'Kinderstation, Mitternacht: 15-Jährige nach Alkoholvergiftung aus der Notaufnahme übernommen, reagiert kaum.',
  rahmen: 'Du bist im Nachtdienst auf der Kinderstation und übernimmst mit deiner Praxisanleitung Lea aus der Notaufnahme.',
  lernziele: [
    'Bewusstsein, Atmung, Temperatur und Blutzucker bei einer Alkoholvergiftung überwachen.',
    'Atemwege schützen: Seitenlage, Absaugbereitschaft, nichts in den Mund bei Bewusstseinstrübung.',
    'Eine Anordnung, die bei Bewusstseinstrübung zur Aspiration führen kann, hinterfragen.',
    'Mit der Jugendlichen respektvoll sprechen und die sorgeberechtigte Mutter informieren und einbeziehen.',
    'Keine Auskunft an Freundinnen geben, aber ihre Informationen nutzen.',
  ],
  lehrplan: {
    ce: ['ce.10', 'ce.06'], abschnitt: ['ad12', 'ad3'],
    themen: ['thema.kl.paediatrie', 'thema.beo.bewusstsein', 'thema.pro.aspiration', 'thema.re.schweigepflicht', 'thema.kom.gespraech'],
    kompetenzen: ['I.1.e', 'II.1.b', 'III.2.a', 'IV.1.b'],
  },
  geeignet: { rollen: [2, 3], stufen: [1, 2, 3] },
  dauerMin: [14, 20],
  freigabe: {
    status: 'entwurf',
    pruefpunkte: [
      'Überwachung bei Alkoholintoxikation im Jugendalter (Bewusstsein, Atmung, Hypothermie, Hypoglykämie, Aspiration) gegen aktuelle pädiatrische Empfehlungen und das HaLT-Konzept prüfen',
      'Hypoglykämie bei Jugendlichen nach Alkohol: Grenzwert und Glukose-Infusion (Vollelektrolyt mit 5 % Glukose) prüfen',
      'Remonstrationspunkt: kein Traubenzucker oral bei Bewusstseinstrübung (Aspiration)',
      'Information der Sorgeberechtigten bei 15-Jähriger, Umgang mit dem Wunsch „sagen Sie meinen Eltern nichts“ (Einsichtsfähigkeit, § 1626 BGB) prüfen',
      'Befugnis Infusion anhängen im 2. Drittel mit Anleitung, Zugang liegt aus der Notaufnahme',
      'Modell: Alkoholwirkung als niedrige Grundvigilanz, BZ sinkt etwa 40 mg/dl pro Stunde; ohne Glukose nach 25 Minuten unter 60',
    ],
  },
  quellen: [
    { id: 'halt', titel: 'HaLT – Hart am Limit: Alkoholprävention bei Kindern und Jugendlichen (Bundesmodellprojekt, Villa Schöpflin), Handbuch klinischer Teil' },
    { id: 's3-alkohol', titel: 'S3-Leitlinie Screening, Diagnose und Behandlung alkoholbezogener Störungen (AWMF 076-001), 2021, Kapitel Kinder und Jugendliche' },
    { id: 'erc-kinder', titel: 'ERC Leitlinien 2025: Erste Hilfe und lebensrettende Maßnahmen bei Kindern (Seitenlage, Atemwege)' },
    { id: 'bgb-1626', titel: 'BGB § 1626 Elterliche Sorge; Schweigepflicht gegenüber Dritten (§ 203 StGB)' },
  ],

  person: {
    name: 'Lea Brandt',
    alter: { jahre: 15 },
    geschlecht: 'w',
    biografie: ['geht in die 9. Klasse, Handball im Verein', 'war auf einer Geburtstagsparty, die Freundin Jana hat den Rettungsdienst gerufen', 'lebt bei der Mutter, Vater lebt im Ausland'],
    diagnosenBekannt: ['Alkoholintoxikation, Blutalkohol in der Notaufnahme 1,9 Promille', 'sonst gesund'],
    medikamentePlan: ['keine Dauermedikation'],
    allergien: ['keine bekannt'],
    gewichtKg: 52,
  },
  medien: { raum: '21_paediatrie_schulkind_fall_rausch_sensor_an' },
  uebernahme: 'Lea, 15 Jahre, 52 kg, kam um 23 Uhr mit dem Rettungsdienst von einer Party, Blutalkohol 1,9 Promille. In der Notaufnahme einmal erbrochen, Zugang links liegt, Pulsoxymeter läuft. Blutzucker war um 23:15 bei 82. Die Mutter ist informiert und auf dem Weg. Die Freundin Jana sitzt noch auf dem Flur.',
  startUhrzeit: '00:15',

  start: {
    // Alkohol: niedrige Grundvigilanz und gedämpfter Atemantrieb; BZ fällt (gehemmte Glukoneogenese), Unterkühlung.
    grund: { vigilanz: 0.45, orientierung: 0.4, atemantrieb: 0.85, blutzucker: 74, temperatur: 35.7, uebelkeit: 0.6, hydratation: 0.92, angst: 0.1 },
    treiber: [{ art: 'hypoglykaemie', abfallProStunde: 40 }],
    bild: { haltung: 'liegt', haut: 'blass', mimik: 'schlaefrig' },
    flags: ['zugang-liegt'],
    sichtbar: ['hf', 'spo2'],
  },

  massnahmen: [
    // Gespräch
    'vorstellen-einverstaendnis', 'ansprechen-orientierung', 'beruhigen-zusprechen',
    // Beobachten
    'ersteindruck-abcde', 'bewusstsein-avpu', 'pupillen-pruefen', 'atmung-beobachten', 'haut-beobachten', 'kopf-pruefen',
    // Akut
    'stabile-seitenlage', 'absaugen-oral', 'hilfe-holen', 'glukose-oral', 'zudecken-waermen', 'rea-team-alarmieren',
    // Messen
    'bz-messen', 'temperatur-ohr', 'rr-messen', 'af-zaehlen', 'puls-zaehlen', 'kurve-lesen',
    // Versorgen
    'glukose-infusion', 'trinken-anbieten', 'infusion-ueberwachen',
    // Melden
    'pflegefachperson-informieren', 'pflegebericht',
  ],
  massnahmenZusatz: [
    {
      id: 'zudecken-waermen', name: 'Warm zudecken, Wärmedecke, Raum nicht auskühlen lassen', reiter: 'akut', spur: 'A', zeitbedarfSekunden: 60,
      befugnis: { 1: 'selbst', 2: 'selbst', 3: 'selbst', pflegefachperson: 'selbst' }, kompetenzbereiche: ['I'], setzt: ['gewaermt'],
      wirkung: [{ groesse: 'temperatur', delta: 0.6, beginnSek: 120, spitzeSek: 2400, dauerSek: 'dauerhaft' }],
    },
    aus('glukose-oral', { name: 'Traubenzucker-Gel in den Mund geben', anordnungspflichtig: true }),
    aus('infusion-anhaengen', {
      id: 'glukose-infusion', name: 'Infusion Vollelektrolyt mit 5 % Glukose anhängen (nach Anordnung)',
      treiber: [{ art: 'kohlenhydrate', gramm: 12, schnell: false }],
      beendet: ['hypoglykaemie'],
      wirkung: [{ groesse: 'vigilanz', delta: 0.15, beginnSek: 300, spitzeSek: 1200, dauerSek: 'dauerhaft' }],
    }),
  ],

  akte: {
    aufnahmegrund: 'Übernahme 00:10 aus der Kindernotaufnahme: Alkoholintoxikation nach Geburtstagsparty (Wodka-Mischgetränke laut Freundin), Blutalkohol 1,9 ‰. Bewusstseinsgetrübt, einmal erbrochen. Kein Hinweis auf Sturz oder weitere Substanzen.',
    anamnese: [
      'Bisher gesund, keine Medikamente, keine Allergien.',
      'Erster bekannter Alkoholrausch laut Mutter (telefonisch).',
      'Tetanus-Impfung aktuell.',
    ],
    diagnosen: [{ text: 'Akute Alkoholintoxikation', icd: 'F10.0', seit: 'heute' }],
    medikation: [
      { id: 'mp-ondansetron', wirkstoff: 'Ondansetron', staerke: '4 mg', form: 'i. v.',
        bedarf: { indikation: 'Übelkeit, erneutes Erbrechen', einzeldosis: '4 mg langsam i. v.', maxProTag: '8 mg', abstandH: 8 },
        hinweis: 'Aus der Kindernotaufnahme, bisher nicht gegeben. Ersetzt nicht Seitenlage und Absaugbereitschaft.' },
    ],
    vorwerte: [
      { zeit: 'Notaufnahme 23:15', vorH: 1, werte: { rrSys: 108, rrDia: 64, hf: 96, af: 14, spo2: 97, temp: 35.9, bz: 82 }, kuerzel: 'ZNA' },
    ],
    pflegebericht: [
      { zeit: '23:20', wer: 'ZNA', text: 'Kommt mit RD, reagiert auf lautes Ansprechen mit Murmeln, einmal erbrochen (Seitenlage). Kleidung nass vom Regen, Wärmedecke. Zugang Handrücken links. Freundin Jana begleitet.' },
    ],
    aerztlicheAnordnungen: [
      { zeit: '23:40', wer: 'Dr. Lenz (ZNA)', text: 'Übernahme auf Kinderstation zur Überwachung: Pulsoxymetrie, Vitalzeichen und Bewusstsein stündlich, BZ zweistündlich. Bei BZ unter 70 Stationsärztin informieren. HaLT-Gespräch morgen.' },
    ],
    assessments: [{ name: 'GCS (Notaufnahme)', wert: '12', datum: 'heute 23:15' }],
    labor: [
      { name: 'Blutalkohol', wert: '1,9', einheit: '‰', datum: 'heute 23:20', auffaellig: true },
      { name: 'Blutzucker', wert: '82', einheit: 'mg/dl', norm: '70–100', datum: 'heute 23:15' },
      { name: 'Drogenscreening Urin', wert: 'negativ', datum: 'heute 23:50' },
    ],
    rechtliches: ['Sorgeberechtigt: Mutter, Frau Brandt (alleiniges Sorgerecht). Telefonisch informiert, kommt.', 'Keine Einwilligung zur Auskunft an Dritte.'],
  },

  befunde: [
    { massnahme: 'vorstellen-einverstaendnis', varianten: [{ text: 'Du stellst dich mit Namen vor. Lea öffnet kurz die Augen, murmelt etwas und dreht den Kopf weg.' }] },
    { massnahme: 'ansprechen-orientierung', varianten: [
      { wenn: SCHLAEFRIG, text: 'Auf lautes Ansprechen murmelt sie „lass mich“. Wo sie ist, weiß sie nicht.' },
      { text: 'Sie schaut dich an: „Wo bin ich? … Oh nein. Ist meine Mutter da?“' },
    ] },
    { massnahme: 'ersteindruck-abcde', varianten: [
      { text: 'A: frei, leises Schnarchen, Geruch nach Alkohol und Erbrochenem. B: langsam und flach. C: blass, kühl. D: reagiert nur auf lautes Ansprechen. E: kalte Haut, nasse Haare, Prellmarke am Knie.' },
    ] },
    { massnahme: 'bewusstsein-avpu', varianten: [
      { wenn: SCHLAEFRIG, text: 'Öffnet die Augen nur auf lautes Ansprechen (AVPU {avpu}), Schutzreflexe vorhanden, aber träge.', zeigt: ['avpu'] },
      { text: 'Wach, antwortet langsam (AVPU {avpu}).', zeigt: ['avpu'] },
    ] },
    { massnahme: 'pupillen-pruefen', varianten: [{ text: 'Pupillen mittelweit, gleich, reagieren auf Licht.' }] },
    { massnahme: 'atmung-beobachten', varianten: [{ text: 'Atemfrequenz {af}/min, flach, regelmäßig, kein Rasseln.', zeigt: ['af'] }] },
    { massnahme: 'af-zaehlen', varianten: [{ text: 'Atemfrequenz {af}/min.', zeigt: ['af'] }] },
    { massnahme: 'haut-beobachten', varianten: [{ text: 'Blass und kühl, Arme mit Gänsehaut, kein Schweiß.' }] },
    { massnahme: 'kopf-pruefen', varianten: [{ text: 'Keine Beule, keine Wunde am Kopf. Prellmarke am rechten Knie.' }] },
    { massnahme: 'stabile-seitenlage', varianten: [{ text: 'Lea liegt in stabiler Seitenlage, der Mund zeigt nach unten, eine Nierenschale und die Absaugung liegen bereit.' }] },
    { massnahme: 'absaugen-oral', varianten: [{ text: 'Du saugst Reste von Erbrochenem aus dem Mund ab. Sie hustet kräftig.' }] },
    { massnahme: 'zudecken-waermen', varianten: [{ text: 'Nasse Kleidung ist schon weg. Du legst eine Wärmedecke auf und schließt das Fenster.' }] },
    { massnahme: 'bz-messen', varianten: [
      { wenn: { wert: 'blutzucker', vergleich: '<', grenze: 70 }, text: 'BZ {bz} mg/dl, niedrig.', zeigt: ['bz'] },
      { text: 'BZ {bz} mg/dl.', zeigt: ['bz'] },
    ] },
    { massnahme: 'temperatur-ohr', varianten: [
      { wenn: { wert: 'temperatur', vergleich: '<', grenze: 36 }, text: '{temp} °C, unterkühlt.', zeigt: ['temp'] },
      { text: '{temp} °C.', zeigt: ['temp'] },
    ] },
    { massnahme: 'rr-messen', varianten: [{ text: 'RR {rrSys}/{rrDia} mmHg.', zeigt: ['rrSys', 'rrDia'] }] },
    { massnahme: 'puls-zaehlen', varianten: [{ text: 'Puls {hf}/min.', zeigt: ['hf'] }] },
    { massnahme: 'kurve-lesen', varianten: [{ text: 'Blutalkohol 1,9 ‰, BZ 23:15 bei 82. Anordnung: BZ zweistündlich, bei unter 70 Ärztin informieren. Sorgerecht: Mutter allein. Keine Einwilligung zur Auskunft an Dritte.' }] },
    { massnahme: 'glukose-infusion', varianten: [{ text: 'Infusion angehängt, Tropfgeschwindigkeit eingestellt, Einstichstelle reizlos, Uhrzeit notiert.' }] },
    { massnahme: 'infusion-ueberwachen', varianten: [{ text: 'Infusion läuft, Einstichstelle reizlos.' }] },
    { massnahme: 'trinken-anbieten', varianten: [
      { wenn: SCHLAEFRIG, text: 'Sie verschluckt sich und hustet heftig, Wasser läuft aus dem Mundwinkel.' },
      { text: 'Sie trinkt ein paar Schlucke Wasser.' },
    ] },
    { massnahme: 'glukose-oral', varianten: [
      { wenn: SCHLAEFRIG, text: 'Sie schluckt nicht richtig, das Gel bleibt in der Wange, sie würgt.' },
      { text: 'Sie lutscht das Gel.' },
    ] },
  ],

  gespraech: [
    { id: 'g-jana-fragen', frage: 'Freundin Jana fragen, was und wie viel Lea getrunken hat und ob sie etwas anderes genommen hat', an: 'angehoerige', kompetenzbereiche: ['I', 'II'],
      antwort: [{ text: '„Wodka mit Energy, so ab neun. Keine Ahnung wie viel, viel. Drogen nicht, echt nicht. Sie ist draußen im Regen eingeschlafen, da hab ich 112 angerufen.“', setzt: ['anamnese-jana'] }],
      fakten: ['Wodka-Mischgetränke ab 21 Uhr', 'keine Drogen laut Jana', 'lag draußen im Regen'] },
    { id: 'g-jana-auskunft', frage: 'Jana erzählen, wie es Lea geht und was die Werte sind', an: 'angehoerige', kompetenzbereiche: ['II', 'IV'],
      schweigepflicht: { erlaubtWenn: { flag: 'nie' },
        fehlerText: 'Du hast Jana über Leas Zustand informiert. Freundinnen sind keine Angehörigen und Lea hat nicht eingewilligt. Du darfst Jana zuhören und danken, aber keine Auskunft geben.' },
      antwort: [{ text: '„Okay … danke. Ich schreib das gleich in die Gruppe.“' }] },
    { id: 'g-jana-danken', frage: 'Jana danken, dass sie Hilfe geholt hat, und sie bitten, sich abholen zu lassen', an: 'angehoerige', kompetenzbereiche: ['II', 'IV'],
      antwort: [{ text: '„Mein Vater holt mich gleich. Sagen Sie Lea, dass ich sie lieb hab?“', setzt: ['jana-verabschiedet'] }] },
    { id: 'g-lea-eltern', frage: 'Lea ehrlich sagen, dass ihre Mutter kommt, und fragen, was sie gerade braucht', an: 'patient', kompetenzbereiche: ['II'],
      nurWenn: { wert: 'vigilanz', vergleich: '>=', grenze: 0.55 },
      antwort: [{ text: '„Bitte sagen Sie ihr nichts … Die bringt mich um.“ Du erklärst ruhig, dass die Mutter informiert ist, weil sie für Lea sorgt, und dass ihr niemand Vorwürfe machen soll. Lea weint leise.', setzt: ['lea-gespraech'] }] },
    { id: 'g-mutter', frage: 'Mutter informieren: Zustand, Überwachung, Gesprächsangebot morgen', an: 'eltern', kompetenzbereiche: ['II', 'IV'],
      nurWenn: MUTTER_DA,
      antwort: [{ text: '„Ich hab mir solche Sorgen gemacht. Ich bin nicht böse, ich will nur wissen, dass sie okay ist. Darf ich bei ihr bleiben?“', setzt: ['mutter-informiert'] }],
      fakten: ['Mutter alleinsorgeberechtigt', 'möchte bleiben'] },
    { id: 'g-tom-hilfe', frage: 'Kollegen Tom bitten, beim Lagern zu helfen und die Absaugung zu prüfen', an: 'kollegin', kompetenzbereiche: ['III'],
      antwort: [{ text: '„Bin da. Absaugung funktioniert, Nierenschale steht bereit.“', setzt: ['absaugung-bereit'] }] },
  ],

  sbar: [
    { id: 's-intox', teil: 'S', text: 'Lea Brandt, 15 Jahre, Zimmer 7: Alkoholvergiftung, reagiert nur auf lautes Ansprechen.', art: 'kern' },
    { id: 'b-party', teil: 'B', text: 'Aus der Notaufnahme übernommen, Blutalkohol 1,9 Promille, einmal erbrochen, Zugang liegt, sonst gesund, 52 kg.', art: 'kern' },
    { id: 'b-handball', teil: 'B', text: 'Sie spielt Handball im Verein.', art: 'ablenker' },
    { id: 'a-bewusstsein', teil: 'A', text: 'Bewusstsein getrübt, öffnet die Augen nur auf lautes Ansprechen, liegt in Seitenlage, atmet frei, aber flach.', art: 'kern',
      bekanntWenn: { eine: [{ getan: 'bewusstsein-avpu' }, { getan: 'ersteindruck-abcde' }] } },
    { id: 'a-unterkuehlt', teil: 'A', text: 'Unterkühlt, Haut kalt, Wärmedecke liegt.', art: 'hilfreich', bekanntWenn: { getan: 'temperatur-ohr' } },
    { id: 'a-bz-faellt', teil: 'A', text: 'Blutzucker niedriger als in der Notaufnahme.', art: 'hilfreich', bekanntWenn: { getan: 'bz-messen' } },
    { id: 'a-besser', teil: 'A', text: 'Sie wird wacher, antwortet auf Fragen, Schutzreflexe gut.', art: 'hilfreich',
      bekanntWenn: { alle: [{ getan: 'bewusstsein-avpu' }, { wert: 'vigilanz', vergleich: '>=', grenze: 0.55 }] } },
    { id: 'a-ausschlafen', teil: 'A', text: 'Sie muss halt ihren Rausch ausschlafen.', art: 'falsch' },
    { id: 'r-ansehen', teil: 'R', text: 'Bitte schauen Sie sie an. Was tun wir gegen den sinkenden Zucker?', art: 'kern' },
  ],

  anordnungen: [
    { id: 'an-glukose-infusion', massnahme: 'glukose-infusion', text: 'Vollelektrolyt mit 5 % Glukose, 60 ml/h über den liegenden Zugang.' },
    { id: 'an-gel', massnahme: 'glukose-oral', text: 'Traubenzucker-Gel in den Mund.',
      fehlerhaft: {
        warum: 'Lea ist bewusstseinsgetrübt, ihre Schutzreflexe sind träge. Etwas in den Mund zu geben, kann zur Aspiration führen. Glukose bekommt sie über die Infusion.',
        korrektur: '„Stimmt, sie ist zu schläfrig. Nichts in den Mund, nur die Glukose-Infusion. Danke.“',
      } },
  ],

  arzt: {
    name: 'Diensthabende Ärztin Dr. Weiß',
    erreichbar: 'telefon',
    regeln: [
      { ...R_KOMMT, wenn: { gemeldet: ['a-bewusstsein', 'wert:bz'] } },
      { id: 'r-bz-frage', wenn: { gemeldet: ['a-bewusstsein'] },
        antwort: '„Bewusstseinsgetrübt nach Alkohol, verstanden. Seitenlage, gut.“',
        rueckfrage: { text: '„Wie hoch ist der Zucker? Jugendliche unterzuckern nach Alkohol leicht.“', erwartet: ['wert:bz'], auftrag: 'af-bz' } },
      { wenn: { gemeldet: ['a-ausschlafen'] }, antwort: '„Ausschlafen lassen ja, aber gut überwacht. Wie wach ist sie, und wie ist der Zucker?“' },
    ],
    auftraege: [
      { id: 'af-bz', text: 'Blutzucker messen und der Ärztin melden', erledigt: { getan: 'bz-messen' }, meldung: ['wert:bz'], meldenBinnenSek: 300,
        folge: [{ ...R_KOMMT, wenn: { gemeldet: ['a-bewusstsein'] } }] },
      { id: 'af-kontrolle', text: 'In 20 Minuten Blutzucker und Temperatur nachmessen und der Ärztin schreiben', meldenBinnenSek: 1800,
        erledigt: { alle: [{ ab: 600 }, { getan: 'bz-messen' }, { getan: 'temperatur-ohr' }] },
        meldung: ['wert:bz', 'wert:temp'],
        folge: [{ wenn: { ab: 0 }, antwort: '„Danke, der Zucker steigt. Weiter so, Bewusstsein stündlich. Ich komme jetzt.“', setzt: ['kontrolle-gemeldet'] }] },
    ],
  },

  ereignisse: [
    { id: 'e-erbrechen', art: 'komplikation', wann: { ab: 420 },
      text: 'Lea würgt plötzlich und erbricht. Sie hustet, Erbrochenes läuft aus dem Mund.',
      entscheidung: [
        { id: 'w-seite', text: 'Sofort auf die Seite drehen (falls nicht schon), Mund ausräumen, absaugen, bei ihr bleiben und klingeln', wertung: 'gut', warum: 'Bei getrübtem Bewusstsein schützt nur die Seitenlage vor Aspiration.' },
        { id: 'w-aufsetzen', text: 'Aufsetzen und Wasser zum Ausspülen geben', wertung: 'gefaehrlich', warum: 'Aufsitzen bei Bewusstseinstrübung und Flüssigkeit im Mund begünstigen die Aspiration.' },
      ] },
    { id: 'e-tom', art: 'team', wann: { getan: 'hilfe-holen' }, text: 'Kollege Tom kommt herein: „Was brauchst du?“' },
    { id: 'e-mutter', art: 'angehoerige', wann: MUTTER_DA, text: 'Frau Brandt kommt außer Atem ins Zimmer: „Lea! Was ist mit ihr?“' },
    { id: 'e-aerztin-da', art: 'visite', wann: { alle: [{ flag: 'arzt-kommt' }, { eine: [{ flag: 'kontrolle-gemeldet' }, { ab: 2100 }] }] },
      text: 'Dr. Weiß untersucht Lea: „Sie wird wacher, der Zucker ist gut. Wir überwachen sie bis morgen, dann kommt das HaLT-Team.“' },
  ],

  pa: {
    name: 'Praxisanleiterin Frau Becker',
    hilfen: [
      { wenn: { nicht: SEITE }, impuls: 'Sie hat schon einmal erbrochen und ist kaum wach. Wie schützt du ihre Atemwege?', tipp: 'Stabile Seitenlage, Absaugung bereit, nie allein auf dem Rücken liegen lassen.' },
      { wenn: { nicht: { getan: 'bz-messen' } }, impuls: 'Was macht Alkohol bei Jugendlichen mit dem Blutzucker?', tipp: 'Er kann stark fallen. Miss den Blutzucker.' },
      { wenn: { alle: [{ flag: 'arzt-kommt' }, { nicht: { flag: 'remonstriert:an-gel' } }] }, impuls: 'Darf jemand, der nur auf lautes Ansprechen reagiert, etwas in den Mund bekommen?', tipp: 'Nein, Aspirationsgefahr. Frag nach, die Infusion reicht.' },
      { wenn: { nicht: { getan: 'temperatur-ohr' } }, impuls: 'Sie lag im Regen. Woran denkst du noch?', tipp: 'Unterkühlung: Temperatur messen, warm zudecken.' },
      { impuls: 'Wer muss bei einer 15-Jährigen informiert werden, und wer nicht?', tipp: 'Die sorgeberechtigte Mutter ja, die Freundin nicht.' },
    ],
  },
  team: { kollegin: 'Kinderkrankenpfleger Tom (Nachtdienst)', weitere: { eltern: 'Mutter Frau Brandt', angehoerige: 'Freundin Jana (auf dem Flur)' } },

  bewertung: {
    pflicht: [
      { id: 'p-seitenlage', text: 'Stabile Seitenlage vor dem Erbrechen', gewicht: 3, kompetenzbereiche: ['I'], erfuellt: { getan: 'stabile-seitenlage', bis: 420 },
        warum: 'Bei Bewusstseinstrübung und Übelkeit schützt die Seitenlage vor Aspiration.' },
      { id: 'p-bewusstsein', text: 'Bewusstsein eingeschätzt', gewicht: 2, kompetenzbereiche: ['I'], erfuellt: { eine: [{ getan: 'bewusstsein-avpu' }, { getan: 'ersteindruck-abcde' }] },
        warum: 'Eine Verschlechterung des Bewusstseins ist ein Alarmzeichen (Atemdepression, Hypoglykämie, Kopfverletzung).' },
      { id: 'p-bz', text: 'Blutzucker gemessen', gewicht: 3, kompetenzbereiche: ['I', 'V'], erfuellt: { getan: 'bz-messen', bis: 900 },
        warum: 'Alkohol hemmt die Zuckerneubildung in der Leber; Jugendliche unterzuckern leicht.' },
      { id: 'p-temp', text: 'Temperatur gemessen und gewärmt', gewicht: 2, kompetenzbereiche: ['I'], erfuellt: { alle: [{ getan: 'temperatur-ohr' }, { getan: 'zudecken-waermen' }] },
        warum: 'Alkohol erweitert die Hautgefäße; nach Regen und Kälte droht eine Unterkühlung.' },
      { id: 'p-arzt', text: 'Ärztin mit Bewusstsein und Blutzucker informiert', gewicht: 3, kompetenzbereiche: ['II', 'III'], erfuellt: { flag: 'arzt-kommt' },
        warum: 'Sinkender Zucker bei Bewusstseinstrübung braucht eine ärztliche Anordnung (Glukose i. v.).' },
      { id: 'p-remonstration', text: 'Traubenzucker in den Mund bei Bewusstseinstrübung hinterfragt', gewicht: 3, kompetenzbereiche: ['III', 'IV'], erfuellt: { flag: 'remonstriert:an-gel' },
        warum: 'Mit trägen Schutzreflexen droht Aspiration. Du trägst die Durchführungsverantwortung.' },
      { id: 'p-infusion', text: 'Glukose-Infusion nach Anordnung angehängt', gewicht: 2, kompetenzbereiche: ['I', 'III'], erfuellt: { getan: 'glukose-infusion' },
        warum: 'So bekommt sie Glukose ohne Aspirationsgefahr.' },
      { id: 'p-rueckauftrag', text: 'Blutzucker und Temperatur nachgemessen und gemeldet', gewicht: 2, kompetenzbereiche: ['II', 'III'], erfuellt: { auftrag: 'af-kontrolle', status: 'gemeldet' },
        warum: 'Die Ärztin entscheidet nach deiner Rückmeldung über die Infusionsmenge (Closed Loop).' },
      { id: 'p-jana', text: 'Jana befragt, aber keine Auskunft gegeben', gewicht: 1, kompetenzbereiche: ['II', 'IV'],
        erfuellt: { alle: [{ flag: 'anamnese-jana' }, { nicht: { getan: 'frage:g-jana-auskunft' } }] },
        warum: 'Janas Wissen hilft (was, wie viel, Drogen?). Auskunft bekommt sie nicht: Schweigepflicht.' },
      { id: 'p-mutter', text: 'Mutter informiert und einbezogen', gewicht: 1, kompetenzbereiche: ['II'], erfuellt: { flag: 'mutter-informiert' },
        warum: 'Die Mutter ist sorgeberechtigt. Ein ruhiges Gespräch ohne Vorwürfe ist der Beginn der Prävention.' },
      { id: 'p-doku', text: 'Bewusstsein und Blutzucker dokumentiert', gewicht: 2, kompetenzbereiche: ['I', 'IV'], erfuellt: { dokumentiert: 'a-bewusstsein' },
        warum: 'Der Verlauf von Bewusstsein, Zucker und Temperatur ist die Grundlage der Überwachung über die Nacht.' },
    ],
    fehler: [
      { id: 'f-gel', text: 'Traubenzucker-Gel bei Bewusstseinstrübung gegeben', schwere: 'schwer', kompetenzbereiche: ['I', 'III', 'IV'],
        wenn: { alle: [{ getan: 'glukose-oral' }, SCHLAEFRIG] },
        folge: { text: 'Lea verschluckt sich, hustet und atmet danach rasselnd.', wirkung: [{ groesse: 'gasaustausch', delta: -0.15, beginnSek: 60, spitzeSek: 600, dauerSek: 'dauerhaft' }] },
        warum: 'Bei getrübtem Bewusstsein nichts in den Mund: Aspirationsgefahr.' },
      { id: 'f-trinken', text: 'Der schläfrigen Jugendlichen zu trinken gegeben', schwere: 'mittel', kompetenzbereiche: ['I'],
        wenn: { alle: [{ getan: 'trinken-anbieten' }, SCHLAEFRIG] }, warum: 'Aspirationsgefahr bei Bewusstseinstrübung.' },
      { id: 'f-aspiration', text: 'Beim Erbrechen auf dem Rücken gelegen', schwere: 'schwer', kompetenzbereiche: ['I', 'V'],
        wenn: { eine: [{ alle: [{ ab: 425 }, { nichtGetan: 'stabile-seitenlage', bis: 420 }] }, { getan: 'wahl:e-erbrechen:w-aufsetzen' }] },
        folge: { text: 'Lea hat Erbrochenes eingeatmet, sie hustet und die Sättigung fällt.', wirkung: [{ groesse: 'gasaustausch', delta: -0.2, beginnSek: 0, spitzeSek: 600, dauerSek: 'dauerhaft' }] },
        warum: 'Ohne Seitenlage gelangt Erbrochenes in die Atemwege (Aspirationspneumonie).' },
    ],
    ende: [
      { wenn: { alle: [{ flag: 'arzt-kommt' }, { flag: 'kontrolle-gemeldet' }, SEITE, { getan: 'pflegebericht' }, { flag: 'mutter-informiert' }] },
        text: 'Lea schläft in Seitenlage, die Mutter sitzt neben ihr. Der Zucker ist stabil, die Temperatur steigt langsam, die Überwachung läuft weiter.', ausgang: 'stabil' },
      { wenn: { ab: 2700 }, text: 'Lea ist kaum noch weckbar, der Zucker ist sehr niedrig. Sie wird auf die Intensivstation verlegt.', ausgang: 'verschlechtert' },
    ],
  },

  pflegebedarf: {
    probleme: [
      { id: 'pb-aspiration', text: 'Aspirationsgefahr bei Bewusstseinstrübung und Erbrechen', richtig: true, prioritaet: 1, warum: 'Träge Schutzreflexe und Übelkeit.' },
      { id: 'pb-hypo', text: 'Gefahr einer Unterzuckerung', richtig: true, prioritaet: 1, warum: 'Alkohol hemmt die Glukoneogenese, BZ sinkt.' },
      { id: 'pb-kaelte', text: 'Unterkühlung', richtig: true, prioritaet: 2, warum: 'Temperatur unter 36 °C nach Regen und Alkohol.' },
      { id: 'pb-familie', text: 'Belastete Beziehung zwischen Lea und Mutter (Angst vor Vorwürfen)', richtig: true, prioritaet: 3, warum: 'Lea fürchtet die Reaktion der Mutter; ein gutes Gespräch ist Prävention.' },
      { id: 'pb-sucht', text: 'Alkoholabhängigkeit', richtig: false, warum: 'Ein einzelner Rausch ist keine Abhängigkeit; das wäre eine ärztliche Diagnose.' },
    ],
    ziele: [
      { id: 'z-atemweg', text: 'Lea hat freie Atemwege und aspiriert nicht, bis sie wieder wach ist.', passtZu: ['pb-aspiration'], richtig: true },
      { id: 'z-bz', text: 'Der Blutzucker bleibt über 70 mg/dl.', passtZu: ['pb-hypo'], richtig: true },
      { id: 'z-temp', text: 'Die Körpertemperatur steigt über 36,5 °C.', passtZu: ['pb-kaelte'], richtig: true },
      { id: 'z-strafe', text: 'Lea versteht durch klare Vorwürfe, dass sie falsch gehandelt hat.', passtZu: ['pb-familie'], richtig: false },
    ],
  },

  leitfaden: [
    { titel: 'Gefahren der Alkoholvergiftung im Jugendalter', text: 'Bewusstseinstrübung mit Aspirationsgefahr, Atemdepression, Unterkühlung und Unterzuckerung (Alkohol hemmt die Zuckerneubildung). Kopfverletzungen und andere Substanzen ausschließen.', quellen: ['s3-alkohol'] },
    { titel: 'Überwachung', text: 'Seitenlage, Absaugbereitschaft, Pulsoxymetrie, Bewusstsein, Atmung, Temperatur und Blutzucker engmaschig. Wärmen. Nichts in den Mund, solange sie nicht sicher wach ist.', quellen: ['erc-kinder'] },
    { titel: 'Anordnungen prüfen', text: 'Orale Glukose ist nur bei wachen, schluckfähigen Menschen erlaubt. Bei Bewusstseinstrübung Glukose i. v. nach ärztlicher Anordnung. Eine unpassende Anordnung hinterfragst du.', quellen: ['erc-kinder'] },
    { titel: 'Gespräch und Prävention', text: 'Respektvoll und ohne Vorwürfe mit der Jugendlichen sprechen. Die Sorgeberechtigten werden informiert. Am nächsten Tag ein Gespräch nach dem HaLT-Konzept anbieten.', quellen: ['halt'] },
    { titel: 'Schweigepflicht', text: 'Freundinnen sind wichtige Informationsquellen, bekommen aber keine Auskunft. Die Mutter als Sorgeberechtigte schon.', quellen: ['bgb-1626'] },
  ],

  pruefwege: {
    muster: [
      { art: 'massnahme', id: 'vorstellen-einverstaendnis' },
      { art: 'massnahme', id: 'stabile-seitenlage' },
      { art: 'massnahme', id: 'ersteindruck-abcde' },
      { art: 'massnahme', id: 'bewusstsein-avpu' },
      { art: 'massnahme', id: 'zudecken-waermen' },
      { art: 'massnahme', id: 'temperatur-ohr' },
      { art: 'massnahme', id: 'bz-messen' },
      { art: 'frage', id: 'g-tom-hilfe' },
      { art: 'massnahme', id: 'kurve-lesen' },
      { art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: ['s-intox', 'b-party', 'a-bewusstsein', 'wert:bz', 'a-bz-faellt', 'a-unterkuehlt', 'r-ansehen'] },
      { art: 'rueckmelden', anordnung: 'an-glukose-infusion', rueckgelesen: true },
      { art: 'remonstrieren', anordnung: 'an-gel', grund: 'Sie reagiert nur auf lautes Ansprechen, Aspirationsgefahr.' },
      { art: 'auflegen', an: 'aerztin' },
      { art: 'massnahme', id: 'glukose-infusion' },
      { art: 'massnahme', id: 'absaugen-oral' },
      { art: 'frage', id: 'g-jana-fragen' },
      { art: 'frage', id: 'g-jana-danken' },
      { art: 'warten', sek: 300 },
      { art: 'frage', id: 'g-mutter' },
      { art: 'massnahme', id: 'bz-messen' },
      { art: 'massnahme', id: 'temperatur-ohr' },
      { art: 'massnahme', id: 'bewusstsein-avpu' },
      { art: 'nachricht', an: 'aerztin', kanal: 'messenger', bausteine: ['wert:bz', 'wert:temp'] },
      { art: 'dokumentieren', bausteine: ['a-bewusstsein', 'wert:bz', 'wert:temp', 'anordnung:an-glukose-infusion'] },
      { art: 'warten', sek: 120 },
      { art: 'abschluss', probleme: ['pb-aspiration', 'pb-hypo', 'pb-kaelte', 'pb-familie'], ziele: ['z-atemweg', 'z-bz', 'z-temp'],
        sbar: ['s-intox', 'b-party', 'a-bewusstsein', 'a-bz-faellt', 'a-unterkuehlt'] },
    ],
    unterlassung: { bisSek: 1500, erwartet: { wert: 'blutzucker', vergleich: '<', grenze: 60 } },
    grenze: { rolle: 2, events: [{ art: 'massnahme', id: 'glukose-infusion' }], erwartet: 'pa-eingriff' },
  },
};
