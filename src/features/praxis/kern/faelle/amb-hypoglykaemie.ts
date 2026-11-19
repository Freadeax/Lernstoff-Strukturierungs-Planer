// Fallwelle P17b (CE 04) · ambulant: Unterzucker vor der abendlichen Insulingabe, Schulung Klient und Ehefrau.
// Neuer Fall (FALLPLAN-CE.md). Entwurf, fachlich UNGEPRÜFT. Inhalte fiktiv/didaktisch.

import { KATALOG } from '../katalog';
import type { ArztRegel, FallV2, MassnahmeDefinition } from '../typen';

const aus = (id: string, mehr: Partial<MassnahmeDefinition>): MassnahmeDefinition => ({ ...KATALOG[id]!, ...mehr });

const ERSTE_ANTWORT: ArztRegel = {
  id: 'r-erst',
  wenn: { gemeldet: ['a-hypo', 'b-insulin', 'wert:bz'] },
  antwort: '„Gut, dass Sie gleich Traubenzucker gegeben haben. Er soll jetzt zu Abend essen, und dann spritzen Sie die 14 Einheiten wie immer, sonst ist er morgen früh zu hoch. Messen Sie in einer Viertelstunde noch einmal und melden Sie mir den Wert.“',
  anordnungen: ['an-insulin-voll'],
  setzt: ['arzt-informiert'],
  auftraege: ['af-bz-kontrolle'],
};

export const AMB_HYPOGLYKAEMIE: FallV2 = {
  schema: 2,
  id: 'amb-hypoglykaemie',
  version: '0.1.0',
  spur: 'A',
  setting: 'ambulant',
  altersgruppe: 'erwachsen',
  titel: '„Ich bin doch nicht betrunken“',
  kurz: 'Abendtour: 74-Jähriger mit Insulin ist zittrig, schwitzt und gereizt. Das Insulin steht schon bereit.',
  rahmen: 'Abendtour des ambulanten Pflegedienstes. Ihr kommt zu Herrn Becker, um das Abendinsulin zu geben und mit ihm und seiner Frau das Spritzen zu üben.',
  lernziele: [
    'Vor jeder Insulingabe den Blutzucker messen und eine Unterzuckerung an Zeichen und Wert erkennen.',
    'Bei Unterzucker richtig handeln: schnelle Kohlenhydrate, nach 15 Minuten nachmessen, dann langsame Kohlenhydrate.',
    'Eine geplante Insulingabe zurückstellen und eine ungeeignete Anordnung (volle Dosis nach Unterzucker) hinterfragen.',
    'Ursachen suchen (wenig gegessen, Bewegung, Spritzstellen) und Klient und Ehefrau zu Unterzucker schulen.',
  ],
  lehrplan: {
    ce: ['ce.04', 'ce.05'],
    abschnitt: ['ad12', 'ad3'],
    themen: ['thema.kl.diabetes', 'thema.kom.beratung', 'thema.fa.ambulant', 'thema.beo.bewusstsein'],
    kompetenzen: ['I.2.a', 'II.2.a', 'II.2.b', 'III.2.b'],
  },
  geeignet: { rollen: [2, 3], stufen: [1, 2, 3] },
  dauerMin: [12, 18],
  freigabe: {
    status: 'entwurf',
    pruefpunkte: [
      'Vorgehen Hypoglykämie (15 g bzw. 20 g schnelle KH, nach 15 Min. nachmessen) gegen NVL Typ-2-Diabetes und DDG-Praxisempfehlung prüfen',
      'Remonstrationspunkt „volle Insulindosis nach Unterzucker“ und Ersatzanordnung fachlich prüfen',
      'Befugnis Insulin s. c. im 2. Drittel (mit Anleitung) gegen Lehrplan und Einrichtung',
      'Spritzstellen/Lipohypertrophie als Ursache didaktisch passend?',
    ],
  },
  quellen: [
    { id: 'nvl-diabetes', titel: 'Nationale VersorgungsLeitlinie Typ-2-Diabetes, Version 3.0 (2023)', fundstelle: 'Hypoglykämie, Schulung' },
    { id: 'ddg-hypo', titel: 'DDG Praxisempfehlungen: Therapie des Typ-2-Diabetes und Diabetes im Alter (Diabetologie und Stoffwechsel, Supplement, aktuelle Fassung 2024)' },
    { id: 'ddg-injektion', titel: 'Forum Injektionstechnik/DDG: Empfehlungen zur Injektionstechnik (Spritzstellenwechsel, Lipohypertrophie)' },
    { id: 'dnqp-ernaehrung', titel: 'DNQP: Expertenstandard Ernährungsmanagement, 1. Aktualisierung 2017' },
  ],

  person: {
    name: 'Herr Becker',
    alter: { jahre: 74 },
    geschlecht: 'm',
    biografie: ['lebt mit seiner Frau im Reihenhaus', 'früher Elektromeister', 'spielt dienstags Boule im Verein'],
    diagnosenBekannt: ['Diabetes mellitus Typ 2, seit 3 Wochen Mischinsulin', 'arterielle Hypertonie', 'diabetische Polyneuropathie', 'Pflegegrad 1'],
    medikamentePlan: ['Mischinsulin 30/70: 16 IE morgens, 14 IE abends vor dem Essen', 'Metformin 1000 mg 1-0-1', 'Ramipril 5 mg 1-0-0'],
    allergien: ['keine bekannt'],
    hilfsmittel: ['Blutzuckermessgerät', 'Insulinpen', 'Lesebrille'],
    gewichtKg: 80,
  },
  medien: {
    raum: '09_ambulant_kueche_diabetes_nacht',
    raumVarianten: [],
  },
  uebernahme: 'Herr Becker, 74, Typ-2-Diabetes, seit drei Wochen Mischinsulin. Wir geben das Insulin morgens und abends und üben mit ihm und seiner Frau, damit sie es bald selbst können. Heute war Boule-Tag.',
  startUhrzeit: '18:30',

  start: {
    // blutzucker 58: Unterzucker; Morgeninsulin wirkt bei wenig Essen nach (Treiber hypoglykaemie, endet mit der Mahlzeit).
    grund: { blutzucker: 58, angst: 0.35, unruhe: 0.3, orientierung: 0.85, schmerz: 0, temperatur: 36.6 },
    treiber: [{ art: 'hypoglykaemie', abfallProStunde: 15 }],
    bild: { haltung: 'sitzt', haut: 'blass-kaltschweissig', mimik: 'angst' },
    sichtbar: [],
    anordnungen: ['an-plan'],
  },

  massnahmen: [
    // Gespräch
    'vorstellen-einverstaendnis', 'ansprechen-orientierung', 'beschwerden-erfragen', 'beruhigen-zusprechen', 'schulung-hypo', 'ehefrau-anleiten',
    // Beobachten
    'haut-beobachten', 'bewusstsein-avpu', 'schlucken-pruefen', 'spritzstellen-pruefen', 'fast-test',
    // Akut
    'glukose-oral', 'stabile-seitenlage', 'notruf-112',
    // Messen
    'bz-messen', 'rr-messen', 'puls-zaehlen', 'temperatur-ohr', 'kurve-lesen',
    // Versorgen
    'kohlenhydrate-langsam', 'gabe-zurueckstellen', 'insulin-abend', 'insulin-reduziert', 'tabletten-wie-geplant-geben',
    // Melden
    'pflegebericht', 'pdl-informieren',
  ],
  massnahmenZusatz: [
    aus('glukose-oral', { name: 'Traubenzucker (20 g) kauen und ein kleines Glas Saft trinken lassen', treiber: [{ art: 'kohlenhydrate', gramm: 30, schnell: true }] }),
    aus('kohlenhydrate-langsam', { name: 'Abendbrot mit Vollkornbrot essen lassen (etwa 2 Broteinheiten)', setzt: ['gegessen'], beendet: ['hypoglykaemie'] }),
    aus('insulin-sc', {
      id: 'insulin-abend', name: 'Mischinsulin 14 IE wie im Plan spritzen',
      treiber: [{ art: 'insulin', ie: 14 }],
    }),
    aus('insulin-sc', {
      id: 'insulin-reduziert', name: 'Mischinsulin 8 IE nach dem Essen spritzen (geänderte Anordnung)',
      treiber: [{ art: 'insulin', ie: 8 }], voraussetzung: { getan: 'kohlenhydrate-langsam' },
    }),
    aus('schulen-selbstmanagement', {
      id: 'schulung-hypo', name: 'Unterzucker besprechen: Zeichen, 15-Minuten-Regel, Traubenzucker immer dabei, an Bewegungstagen mehr essen',
    }),
    aus('bezugsperson-anleiten', {
      id: 'ehefrau-anleiten', name: 'Frau Becker anleiten: Zucker messen, Unterzucker erkennen, Traubenzucker geben',
    }),
  ],

  akte: {
    aufnahmegrund: 'Seit drei Wochen Mischinsulin (HbA1c 9,1 %). Pflegedienst gibt Insulin morgens und abends und schult Herrn und Frau Becker, Ziel: selbstständige Gabe in 4 Wochen.',
    anamnese: [
      'Lebt mit seiner Frau (72) im Reihenhaus, beide rüstig. Frau Becker kocht, hat aber Angst vor dem Pen.',
      'Spritzt laut eigener Aussage „immer an derselben Stelle am Bauch, da tut es nicht weh“.',
      'Dienstags Boule im Verein (2–3 Stunden). Zahnprothese drückt seit einigen Tagen.',
      'Bisher keine Unterzuckerung bekannt.',
    ],
    diagnosen: [
      { text: 'Diabetes mellitus Typ 2 mit Insulintherapie', icd: 'E11.90', seit: '2011' },
      { text: 'Diabetische Polyneuropathie', icd: 'E11.40', seit: '2022' },
      { text: 'Arterielle Hypertonie', icd: 'I10.90', seit: '2008' },
    ],
    medikation: [
      { id: 'mp-insulin', wirkstoff: 'Mischinsulin 30/70 (Humaninsulin)', staerke: '100 IE/ml', form: 'Pen s. c.', schema: '16-0-14-0', massnahme: 'insulin-abend', zuletzt: 'heute 07:30',
        hinweis: 'Morgens 16 IE, abends 14 IE, jeweils 20–30 Min. vor dem Essen. Vorher BZ messen. Bei BZ unter 100 nicht spritzen, Rücksprache.', geaendertDurch: 'an-insulin-reduziert' },
      { id: 'mp-metformin', wirkstoff: 'Metformin', staerke: '1000 mg', form: 'Tbl.', schema: '1-0-1-0', massnahme: 'tabletten-wie-geplant-geben', zuletzt: 'heute 07:30', hinweis: 'Zum Essen.' },
      { id: 'mp-ramipril', wirkstoff: 'Ramipril', staerke: '5 mg', form: 'Tbl.', schema: '1-0-0-0', massnahme: 'tabletten-wie-geplant-geben', zuletzt: 'heute 07:30' },
    ],
    vorwerte: [
      { zeit: 'gestern 07:25', vorH: 35, werte: { bz: 168, rrSys: 142, rrDia: 84 }, kuerzel: 'MH' },
      { zeit: 'gestern 18:20', vorH: 24, werte: { bz: 142 }, kuerzel: 'SK' },
      { zeit: 'heute 07:25', vorH: 11, werte: { bz: 131 }, kuerzel: 'MH' },
    ],
    pflegebericht: [
      { zeit: 'gestern 18:30', wer: 'SK', text: 'BZ 142, Insulin 14 IE Bauch links gespritzt. Frau Becker schaut zu, traut sich noch nicht. Herr Becker klagt über die Prothese.' },
      { zeit: 'heute 07:35', wer: 'MH', text: 'BZ 131, 16 IE gespritzt. Klient will heute zum Boule, Frühstück nur halb gegessen (Prothese drückt). Hinweis: Traubenzucker mitnehmen.' },
    ],
    aerztlicheAnordnungen: [
      { zeit: 'vor 3 Wochen', wer: 'Dr. Lang', text: 'Mischinsulin 30/70: 16-0-14 IE vor dem Frühstück bzw. Abendessen. BZ vor jeder Gabe. Unter 100 mg/dl nicht spritzen, Rücksprache. Unter 70: Traubenzucker nach Standard.' },
      { zeit: 'vor 3 Wochen', wer: 'Dr. Lang', text: 'Schulung Insulintherapie (Pen, Spritzstellen, Hypoglykämie) für Klient und Ehefrau.' },
    ],
    assessments: [
      { name: 'Schulungsstand Pen (Klient)', wert: 'braucht noch Anleitung', datum: 'gestern' },
      { name: 'Schulungsstand Pen (Ehefrau)', wert: 'schaut zu, noch unsicher', datum: 'gestern' },
    ],
    labor: [
      { name: 'HbA1c', wert: '9,1', einheit: '%', norm: 'Ziel individuell 7,0–8,0', datum: 'vor 4 Wochen', auffaellig: true },
      { name: 'eGFR', wert: '58', einheit: 'ml/min', norm: 'über 60', datum: 'vor 4 Wochen', auffaellig: true },
    ],
    pflegeplanung: [
      { problem: 'Wissensdefizit Insulintherapie (neu eingestellt)', ziel: 'Herr und Frau Becker geben das Insulin in 4 Wochen selbst und richtig', massnahmen: ['Pen-Handhabung üben', 'Spritzstellen wechseln', 'Unterzucker-Zeichen besprechen'] },
    ],
    rechtliches: ['Einwilligungsfähig. Auskunft an die Ehefrau erlaubt (schriftlich in der Pflegemappe).'],
  },

  befunde: [
    { massnahme: 'ansprechen-orientierung', varianten: [{ text: '„Was wollt ihr denn schon? Ich bin doch nicht betrunken!“ Er ist gereizt, weiß aber, wo er ist und welcher Tag ist.' }] },
    { massnahme: 'beschwerden-erfragen', varianten: [{ text: '„Mir ist so zittrig, und ich hab Heißhunger. Beim Boule hab ich nur eine Brezel gegessen, die Prothese drückt.“' }] },
    { massnahme: 'haut-beobachten', varianten: [
      { wenn: { wert: 'blutzucker', vergleich: '<', grenze: 70 }, text: 'Blass, kalter Schweiß auf Stirn und Händen, die Hände zittern.' },
      { text: 'Die Haut ist wieder rosig und trocken.' },
    ] },
    { massnahme: 'bz-messen', varianten: [
      { wenn: { wert: 'bz', vergleich: '<', grenze: 70 }, text: 'BZ {bz} mg/dl – Unterzuckerung!', zeigt: ['bz'] },
      { wenn: { wert: 'bz', vergleich: '<', grenze: 100 }, text: 'BZ {bz} mg/dl – über 70, aber noch niedrig.', zeigt: ['bz'] },
      { text: 'BZ {bz} mg/dl.', zeigt: ['bz'] },
    ] },
    { massnahme: 'schlucken-pruefen', varianten: [{ text: 'Wach, versteht dich, schluckt einen Schluck Wasser ohne Husten. Traubenzucker kann er sicher kauen.' }] },
    { massnahme: 'spritzstellen-pruefen', varianten: [{ text: 'Links neben dem Bauchnabel eine weiche, handtellergroße Verdickung (Lipohypertrophie). Dort spritzt er laut eigener Aussage immer, weil es nicht weh tut.' }] },
    { massnahme: 'rr-messen', varianten: [{ text: 'RR {rrSys}/{rrDia} mmHg.', zeigt: ['rrSys', 'rrDia'] }] },
    { massnahme: 'puls-zaehlen', varianten: [{ text: 'Puls {hf}/min, regelmäßig.', zeigt: ['hf'] }] },
    { massnahme: 'temperatur-ohr', varianten: [{ text: '{temp} °C.', zeigt: ['temp'] }] },
    { massnahme: 'kurve-lesen', varianten: [{ text: 'Plan: Mischinsulin 16-0-14 IE, BZ vor jeder Gabe; unter 100 nicht spritzen, Rücksprache. Heute früh BZ 131, Frühstück halb gegessen.' }] },
    { massnahme: 'schulung-hypo', varianten: [{ text: 'Ihr besprecht: Zittern, Schwitzen, Heißhunger, Gereiztheit sind Warnzeichen. Dann messen, 20 g Traubenzucker, nach 15 Minuten wieder messen, danach etwas essen. Traubenzucker kommt in die Boule-Tasche, an Bewegungstagen isst er vorher mehr. Herr Becker: „Und ich hab gedacht, ich bin einfach müde.“' }] },
    { massnahme: 'ehefrau-anleiten', varianten: [{ text: 'Frau Becker misst unter deiner Anleitung selbst den Zucker. Du zeigst ihr, wo der Traubenzucker liegt und wann sie 112 rufen muss (wenn er nicht mehr schlucken kann oder nicht wach wird). „Das trau ich mir zu.“' }] },
  ],

  gespraech: [
    { id: 'g-ehefrau', frage: 'Frau Becker fragen, wie ihr Mann heute war', an: 'angehoerige', kanal: 'vor-ort', kompetenzbereiche: ['I', 'II'],
      antwort: [{ text: '„Seit er vom Boule zurück ist, ist er so komisch. Patzig, und er schwitzt. Ich dachte, er hat zu viel Bier getrunken. Gegessen hat er fast nichts, die Prothese.“' }],
      fakten: ['vom Boule zurück seit 17 Uhr', 'wenig gegessen', 'ein kleines Bier'] },
    { id: 'g-spritzstelle', frage: 'Fragen, wo er das Insulin meistens spritzt', an: 'patient', kompetenzbereiche: ['I', 'II'],
      antwort: [{ text: '„Immer da links am Bauch. Da merk ich nix.“' }], fakten: ['spritzt immer an derselben Stelle'] },
  ],

  sbar: [
    { id: 's-hypo', teil: 'S', text: 'Herr Becker, 74, Typ-2-Diabetes mit Mischinsulin: Unterzucker vor der Abendgabe.', art: 'kern' },
    { id: 'b-insulin', teil: 'B', text: 'Seit drei Wochen Mischinsulin 16-0-14 IE, heute früh 16 IE. Danach wenig gegessen (Prothese drückt) und nachmittags drei Stunden Boule.', art: 'kern' },
    { id: 'b-elektro', teil: 'B', text: 'Er war Elektromeister.', art: 'ablenker' },
    { id: 'a-hypo', teil: 'A', text: 'Zittrig, kaltschweißig, gereizt, wach und schluckt sicher. Blutzucker unter 70.', art: 'kern', bekanntWenn: { getan: 'bz-messen' } },
    { id: 'a-traubenzucker', teil: 'A', text: 'Hat 20 g Traubenzucker bekommen.', art: 'hilfreich', bekanntWenn: { getan: 'glukose-oral' } },
    { id: 'a-lipo', teil: 'A', text: 'Lipohypertrophie am Bauch links, spritzt immer dort.', art: 'hilfreich', bekanntWenn: { getan: 'spritzstellen-pruefen' } },
    { id: 'a-bier', teil: 'A', text: 'Er ist wohl betrunken.', art: 'falsch' },
    { id: 'r-insulin', teil: 'R', text: 'Wie viel Insulin soll er heute Abend bekommen?', art: 'kern' },
  ],

  anordnungen: [
    { id: 'an-plan', massnahme: 'tabletten-wie-geplant-geben', auchFuer: ['insulin-abend'], text: 'Medikationsplan: Mischinsulin 16-0-14 IE (BZ vorher, unter 100 Rücksprache), Metformin 1-0-1, Ramipril 1-0-0.' },
    { id: 'an-insulin-voll', massnahme: 'insulin-abend', text: 'Nach dem Essen die üblichen 14 IE spritzen.',
      fehlerhaft: { warum: 'Nach einer Unterzuckerung mit noch niedrigem, gerade erst steigendem Zucker ist die volle Abenddosis gefährlich: Das Mischinsulin wirkt bis in die Nacht, dann droht eine nächtliche Unterzuckerung. Laut Plan wird unter 100 mg/dl nicht gespritzt.',
        korrektur: 'Richtig. Erst nachmessen und essen, dann entscheiden wir die Dosis neu. Bis dahin kein Insulin.', ersatz: 'an-insulin-warten' } },
    { id: 'an-insulin-warten', massnahme: 'gabe-zurueckstellen', text: 'Insulin zurückstellen bis zur Rückmeldung nach dem Nachmessen.' },
    { id: 'an-insulin-reduziert', massnahme: 'insulin-reduziert', text: 'Heute Abend nur 8 IE Mischinsulin, direkt nach dem Essen. Spritzstelle wechseln (nicht in die Verhärtung).' },
  ],

  arzt: {
    name: 'Hausarzt Dr. Lang',
    erreichbar: 'hausarzt-praxis',
    regeln: [
      ERSTE_ANTWORT,
      { id: 'r-bz-frage', wenn: { gemeldet: ['a-hypo', 'b-insulin'] },
        antwort: '„Unterzucker, verstehe.“',
        rueckfrage: { text: '„Wie hoch ist der Zucker genau?“', erwartet: ['wert:bz'], auftrag: 'af-bz' } },
      { wenn: { gemeldet: ['s-hypo'] },
        antwort: '„Wie hoch ist der Zucker, was hat er heute gespritzt und gegessen? Rufen Sie bitte mit dem Wert noch einmal an.“' },
      { wenn: { gemeldet: ['a-bier'] },
        antwort: '„Dann soll er seinen Rausch ausschlafen. Insulin wie immer.“', setzt: ['arzt-beruhigt'] },
    ],
    auftraege: [
      { id: 'af-bz', text: 'Blutzucker messen und dem Hausarzt melden', erledigt: { getan: 'bz-messen' }, meldung: ['wert:bz'], meldenBinnenSek: 600,
        folge: [{ ...ERSTE_ANTWORT, wenn: { gemeldet: ['wert:bz'] } }] },
      { id: 'af-bz-kontrolle', text: 'In 15 Minuten Blutzucker nachmessen und dem Hausarzt melden', erledigt: { getan: 'bz-messen' },
        meldung: ['wert:bz'], meldenBinnenSek: 1500,
        folge: [
          { wenn: { wert: 'bz', vergleich: '>=', grenze: 75 }, antwort: '„Gut, über 70. Er soll jetzt essen. Danach heute nur 8 Einheiten, und eine andere Spritzstelle. Vor dem Schlafen noch einmal messen lassen, unter 100 soll er eine Scheibe Brot essen.“',
            anordnungen: ['an-insulin-reduziert'], setzt: ['bz-rueckmeldung'] },
          // Zu früh oder zu niedrig nachgemessen: noch keine Dosis, sondern noch einmal nach 15 Minuten (Review #282)
          { wenn: { ab: 0 }, antwort: '„Noch unter 75. Bitte noch einmal Traubenzucker und nach einer Viertelstunde wieder messen, dann entscheide ich die Dosis.“',
            auftraege: ['af-bz-kontrolle2'] },
        ] },
      { id: 'af-bz-kontrolle2', text: 'Nach weiteren 15 Minuten Blutzucker messen und dem Hausarzt melden', erledigt: { alle: [{ ab: 600 }, { getan: 'bz-messen' }] },
        meldung: ['wert:bz'], meldenBinnenSek: 1500,
        folge: [
          { wenn: { wert: 'bz', vergleich: '>=', grenze: 75 }, antwort: '„Gut, jetzt passt es. Er soll essen, danach nur 8 Einheiten an einer anderen Stelle. Vor dem Schlafen noch einmal messen.“',
            anordnungen: ['an-insulin-reduziert'], setzt: ['bz-rueckmeldung'] },
          { wenn: { ab: 0 }, antwort: '„Immer noch niedrig. Er soll jetzt essen, Insulin heute nur 8 Einheiten nach dem Essen. Vor dem Schlafen messen, ich rufe später noch einmal an.“',
            anordnungen: ['an-insulin-reduziert'], setzt: ['bz-rueckmeldung'] },
        ] },
    ],
  },

  team: { weitere: { angehoerige: 'Ehefrau Frau Becker' } },

  ereignisse: [
    { id: 'e-weglassen', art: 'patient', wann: { alle: [{ ab: 600 }, { getan: 'glukose-oral' }] },
      text: 'Herr Becker, schon ruhiger: „Dann lass ich das Insulin heute ganz weg. Sicher ist sicher.“',
      entscheidung: [
        { id: 'w-erklaeren', text: 'Erklären, warum er Insulin braucht, und dass der Arzt die Dosis heute anpasst', wertung: 'gut', setzt: ['erklaert'],
          warum: 'Ganz weglassen führt in der Nacht zu hohem Zucker. Die richtige Antwort ist eine angepasste Dosis nach ärztlicher Absprache.' },
        { id: 'w-zustimmen', text: '„Gute Idee, heute lassen wir es weg.“', wertung: 'falsch',
          warum: 'Über das Weglassen entscheidet der Arzt. Ohne Insulin steigt der Zucker über Nacht stark.' },
        { id: 'w-trotzdem', text: '„Nein, Plan ist Plan“ und die 14 IE vorbereiten', wertung: 'gefaehrlich',
          warum: 'Die volle Dosis nach einer Unterzuckerung gefährdet ihn in der Nacht.' },
      ] },
    { id: 'e-schlaefrig', art: 'komplikation', wann: { alle: [{ ab: 900 }, { nicht: { getan: 'glukose-oral' } }] },
      text: 'Herr Becker wird still, starrt vor sich hin und antwortet nur noch langsam. Frau Becker: „Hans? Hans!“',
      bild: { haltung: 'sitzt', haut: 'blass-kaltschweissig', mimik: 'schlaefrig' } },
  ],

  pa: {
    name: 'Praxisanleiterin Frau Haas',
    hilfen: [
      { wenn: { nicht: { getan: 'bz-messen' } }, impuls: 'Zittern, Schwitzen, gereizt, und gleich soll er Insulin bekommen. Was prüfst du zuerst?', tipp: 'Blutzucker messen, bevor irgendetwas gespritzt wird.' },
      { wenn: { alle: [{ getan: 'bz-messen' }, { nicht: { getan: 'glukose-oral' } }] }, impuls: 'Er ist wach und kann schlucken. Was hilft jetzt am schnellsten?', tipp: 'Traubenzucker geben, nicht erst Brot.' },
      { wenn: { auftrag: 'af-bz-kontrolle', status: 'offen' }, impuls: 'Woran musst du nach dem Traubenzucker denken?', tipp: 'Nach einer Viertelstunde nachmessen und dem Arzt den Wert schicken.' },
      { wenn: { nicht: { getan: 'spritzstellen-pruefen' } }, impuls: 'Warum könnte das Insulin bei ihm so unberechenbar wirken?', tipp: 'Schau dir die Spritzstellen am Bauch an.' },
      { impuls: 'Wer ist heute Nacht bei ihm, wenn es wieder passiert?', tipp: 'Frau Becker anleiten: Zucker messen, Zeichen erkennen, Traubenzucker geben.' },
    ],
  },

  bewertung: {
    pflicht: [
      { id: 'p-bz', text: 'Blutzucker vor der Insulingabe gemessen', gewicht: 3, kompetenzbereiche: ['I'],
        erfuellt: { getan: 'bz-messen', bis: 300 }, warum: 'Zittern, Schwitzen und Gereiztheit vor dem Insulin: Ohne Messung wird eine Unterzuckerung verstärkt.' },
      { id: 'p-glukose', text: 'Schnell wirksame Kohlenhydrate gegeben', gewicht: 3, kompetenzbereiche: ['I', 'V'],
        erfuellt: { getan: 'glukose-oral', bis: 480 }, warum: 'Traubenzucker hebt den Zucker in Minuten. Brot wirkt zu langsam.' },
      { id: 'p-zurueck', text: 'Insulingabe zurückgestellt', gewicht: 3, kompetenzbereiche: ['I', 'III'],
        erfuellt: { getan: 'gabe-zurueckstellen' }, warum: 'Insulin bei Unterzucker ist lebensgefährlich. Zurückstellen und den Arzt fragen.' },
      { id: 'p-arzt', text: 'Hausarzt mit Wert und Insulinplan informiert', gewicht: 2, kompetenzbereiche: ['II', 'III'],
        erfuellt: { flag: 'arzt-informiert' }, warum: 'Die Dosis heute Abend entscheidet der Arzt.' },
      { id: 'p-nachmessen', text: 'Nach 15 Minuten nachgemessen und gemeldet', gewicht: 2, kompetenzbereiche: ['I', 'II'],
        erfuellt: { flag: 'bz-rueckmeldung' }, warum: 'Erst der zweite Wert zeigt, ob der Traubenzucker gereicht hat.' },
      { id: 'p-essen', text: 'Danach langsam wirksame Kohlenhydrate (Abendbrot)', gewicht: 2, kompetenzbereiche: ['I'],
        erfuellt: { getan: 'kohlenhydrate-langsam' }, warum: 'Traubenzucker wirkt kurz; ohne Mahlzeit sinkt der Zucker wieder.' },
      { id: 'p-rueckgelesen', text: 'Geänderte Insulindosis rückgelesen', gewicht: 2, kompetenzbereiche: ['III'],
        erfuellt: { anordnung: 'an-insulin-reduziert', rueckgelesen: true }, warum: 'Insulindosen am Telefon immer zurücklesen (Closed Loop).' },
      { id: 'p-spritzstellen', text: 'Spritzstellen angesehen', gewicht: 1, kompetenzbereiche: ['I', 'V'],
        erfuellt: { getan: 'spritzstellen-pruefen' }, warum: 'Verhärtungen (Lipohypertrophie) machen die Insulinwirkung unberechenbar.' },
      { id: 'p-schulung', text: 'Zu Unterzucker geschult', gewicht: 2, kompetenzbereiche: ['II', 'V'],
        erfuellt: { getan: 'schulung-hypo' }, warum: 'Wer die Zeichen kennt und Traubenzucker dabei hat, verhindert schwere Unterzuckerungen.' },
      { id: 'p-ehefrau', text: 'Ehefrau angeleitet', gewicht: 1, kompetenzbereiche: ['II'],
        erfuellt: { getan: 'ehefrau-anleiten' }, warum: 'Nachts ist Frau Becker da. Sie muss Zeichen erkennen und handeln können.' },
      { id: 'p-doku', text: 'BZ-Werte und Anordnung dokumentiert', gewicht: 1, kompetenzbereiche: ['I', 'IV'],
        erfuellt: { dokumentiert: 'wert:bz' }, warum: 'Unterzucker, Maßnahmen und Dosisänderung müssen für die Morgentour nachvollziehbar sein.' },
    ],
    fehler: [
      { id: 'f-insulin-voll', text: 'Volle Insulindosis gespritzt', schwere: 'schwer', kompetenzbereiche: ['I', 'III', 'IV'],
        wenn: { getan: 'insulin-abend' },
        folge: { text: 'Das Insulin ist gespritzt. Der Zucker wird in den nächsten Stunden erneut fallen.' },
        warum: 'Nach einer Unterzuckerung (oder ohne Messung) ist die volle Dosis gefährlich. Laut Plan unter 100 nicht spritzen, Rücksprache.' },
      { id: 'f-unbehandelt', text: 'Unterzucker zehn Minuten lang nicht behandelt', schwere: 'schwer', kompetenzbereiche: ['I'],
        wenn: { alle: [{ ab: 600 }, { nicht: { getan: 'glukose-oral' } }] },
        folge: { text: 'Der Zucker fällt weiter.', treiber: [{ art: 'hypoglykaemie', abfallProStunde: 40 }] },
        warum: 'Ein wacher Mensch mit Unterzucker braucht sofort schnelle Kohlenhydrate, bevor er nicht mehr schlucken kann.' },
      { id: 'f-brot-zuerst', text: 'Bei Unterzucker zuerst Brot statt Traubenzucker', schwere: 'leicht', kompetenzbereiche: ['I'],
        wenn: { alle: [{ getan: 'kohlenhydrate-langsam' }, { nicht: { getan: 'glukose-oral' } }] },
        warum: 'Langsame Kohlenhydrate heben den Zucker erst nach 30–60 Minuten.' },
    ],
    ende: [
      { wenn: { alle: [{ flag: 'bz-rueckmeldung' }, { getan: 'insulin-reduziert' }, { getan: 'pflegebericht' }] },
        text: 'Herr Becker hat gegessen, der Zucker ist gestiegen, 8 IE sind gespritzt. Frau Becker misst vor dem Schlafen noch einmal.', ausgang: 'stabil' },
      { wenn: { ab: 2400 }, text: 'Die Tour muss weiter. Die Lage ist nicht geklärt.', ausgang: 'verschlechtert' },
    ],
  },

  pflegebedarf: {
    probleme: [
      { id: 'pb-hypo', text: 'Unterzucker (Hypoglykämie) unter Insulintherapie', richtig: true, prioritaet: 1, warum: 'Akut gefährlich, kann bis zur Bewusstlosigkeit führen.' },
      { id: 'pb-wissen', text: 'Wissensdefizit: Unterzucker erkennen und handeln, Spritzstellen wechseln', richtig: true, prioritaet: 2, warum: 'Ursache und Schutz zugleich; mit Schulung beeinflussbar.' },
      { id: 'pb-ernaehrung', text: 'Eingeschränkte Nahrungsaufnahme (drückende Zahnprothese)', richtig: true, prioritaet: 3, warum: 'Er isst weniger als geplant, die Insulindosis passt dann nicht.' },
      { id: 'pb-alkohol', text: 'Alkoholmissbrauch', richtig: false, warum: 'Ein kleines Bier erklärt die Zeichen nicht. Der Zucker schon.' },
      { id: 'pb-hyper', text: 'Überzuckerung', richtig: false, warum: 'Der Zucker ist zu niedrig.' },
    ],
    ziele: [
      { id: 'z-bz', text: 'Herr Becker hat heute Nacht keine Unterzuckerung (BZ vor dem Schlafen über 100).', passtZu: ['pb-hypo'], richtig: true },
      { id: 'z-schulung', text: 'Herr und Frau Becker nennen drei Unterzucker-Zeichen und die 15-Minuten-Regel.', passtZu: ['pb-wissen'], richtig: true },
      { id: 'z-zahnarzt', text: 'Herr Becker hat diese Woche einen Termin beim Zahnarzt.', passtZu: ['pb-ernaehrung'], richtig: true },
      { id: 'z-insulin-weg', text: 'Herr Becker kommt ohne Insulin aus.', passtZu: ['pb-hypo'], richtig: false },
    ],
  },

  leitfaden: [
    { titel: 'Was im Körper passiert', text: 'Mischinsulin wirkt über viele Stunden. Isst jemand weniger als geplant und bewegt sich mehr, fällt der Zucker. Unter etwa 70 mg/dl schüttet der Körper Stresshormone aus: Zittern, Schwitzen, Herzklopfen, Heißhunger, Gereiztheit. Bekommt das Gehirn zu wenig Zucker, folgen Verwirrtheit, Schläfrigkeit bis Bewusstlosigkeit.', quellen: ['nvl-diabetes'] },
    { titel: 'Handeln bei Unterzucker', text: 'Wach und kann schlucken: 15–20 g schnelle Kohlenhydrate (Traubenzucker, Saft). Nach 15 Minuten nachmessen, wenn nötig wiederholen. Danach langsame Kohlenhydrate (Brot). Nicht wach oder kann nicht schlucken: nichts in den Mund, stabile Seitenlage, 112.', quellen: ['nvl-diabetes', 'ddg-hypo'] },
    { titel: 'Insulin nur nach Messung', text: 'Vor jeder Insulingabe Blutzucker messen. Ist er zu niedrig, die Gabe zurückstellen und ärztlich klären. Eine Anordnung „volle Dosis“ direkt nach einer Unterzuckerung hinterfragen.', quellen: ['ddg-hypo'] },
    { titel: 'Spritzstellen', text: 'Immer dieselbe Stelle führt zu Verhärtungen (Lipohypertrophie). Insulin wird dort unregelmäßig aufgenommen. Spritzstellen systematisch wechseln und regelmäßig abtasten.', quellen: ['ddg-injektion'] },
  ],

  pruefwege: {
    muster: [
      { art: 'massnahme', id: 'ansprechen-orientierung' },
      { art: 'massnahme', id: 'haut-beobachten' },
      { art: 'pflegetasche', geraet: 'bz-geraet' },
      { art: 'massnahme', id: 'bz-messen' },
      { art: 'massnahme', id: 'glukose-oral' },
      { art: 'massnahme', id: 'gabe-zurueckstellen' },
      { art: 'frage', id: 'g-ehefrau' },
      { art: 'massnahme', id: 'beschwerden-erfragen' },
      { art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: ['s-hypo', 'b-insulin', 'a-hypo', 'a-traubenzucker', 'wert:bz', 'r-insulin'] },
      { art: 'remonstrieren', anordnung: 'an-insulin-voll', grund: 'Nach dem Unterzucker und unter 100 mg/dl nicht die volle Dosis.' },
      { art: 'rueckmelden', anordnung: 'an-insulin-warten', rueckgelesen: true },
      { art: 'auflegen', an: 'aerztin' },
      { art: 'massnahme', id: 'spritzstellen-pruefen' },
      { art: 'warten', sek: 540 },
      { art: 'warten', sek: 300 },
      { art: 'massnahme', id: 'bz-messen' },
      { art: 'nachricht', an: 'aerztin', kanal: 'messenger', bausteine: ['wert:bz'] },
      { art: 'massnahme', id: 'kohlenhydrate-langsam' },
      { art: 'massnahme', id: 'schulung-hypo' },
      { art: 'rueckmelden', anordnung: 'an-insulin-reduziert', rueckgelesen: true },
      { art: 'massnahme', id: 'ehefrau-anleiten' },
      { art: 'massnahme', id: 'insulin-reduziert' },
      { art: 'dokumentieren', bausteine: ['wert:bz', 'a-hypo', 'a-lipo', 'anordnung:an-insulin-reduziert'] },
      { art: 'abschluss', probleme: ['pb-hypo', 'pb-wissen', 'pb-ernaehrung'], ziele: ['z-bz', 'z-schulung', 'z-zahnarzt'],
        sbar: ['s-hypo', 'b-insulin', 'a-hypo', 'a-traubenzucker', 'a-lipo'] },
    ],
    unterlassung: { bisSek: 1500, erwartet: { wert: 'blutzucker', vergleich: '<', grenze: 45 } },
    grenze: { rolle: 2, events: [{ art: 'massnahme', id: 'insulin-abend' }], erwartet: 'pa-eingriff' },
  },
};
