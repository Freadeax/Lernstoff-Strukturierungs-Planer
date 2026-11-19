// Fallwelle P17a · CE 03 Erste Pflegeerfahrungen reflektieren · stationäre Langzeitpflege: Bewohner lehnt die Körperpflege ab.
// Entwurf, fachlich UNGEPRÜFT. Inhalte fiktiv/didaktisch. Muster: lz-demenz-schmerz.ts (Runde 2).
// Schwerpunkt Kommunikation, Selbstbestimmung, Scham; dahinter ein neuer Harnwegsinfekt, der die Inkontinenz erklärt.

import { KATALOG } from '../katalog';
import type { ArztRegel, Bedingung, FallV2, MassnahmeDefinition } from '../typen';

const aus = (id: string, mehr: Partial<MassnahmeDefinition>): MassnahmeDefinition => ({ ...KATALOG[id]!, ...mehr });

const EINVERSTANDEN: Bedingung = { flag: 'einverstanden-pflege' };
const TOCHTER_RUFT = 600;
const WBL_KOMMT = 480;

const ANTWORT_HWI = 'Danke, gut, dass Sie nicht einfach von Inkontinenz im Alter ausgehen. Das spricht für einen Harnwegsinfekt. Ich komme um 12 Uhr vorbei und nehme Urin für eine Kultur mit, bis dahin bitte Trinken fördern mit Protokoll.';
const REGEL_HWI: ArztRegel = {
  id: 'r-hwi', wenn: { gemeldet: ['s-inkontinenz-neu', 'a-urinstix', 'wert:temp'] },
  antwort: `„${ANTWORT_HWI} Und damit er nachts trocken bleibt, legen Sie ihm einen Dauerkatheter, das schreibe ich an. Schicken Sie mir in einer Viertelstunde noch einmal die Temperatur.“`,
  anordnungen: ['an-trinken', 'an-dk'], setzt: ['arzt-informiert'], auftraege: ['af-temp'],
};

export const LZ_KOERPERPFLEGE_ABGELEHNT: FallV2 = {
  schema: 2,
  id: 'lz-koerperpflege-abgelehnt',
  version: '0.1.0',
  spur: 'A',
  setting: 'langzeit',
  altersgruppe: 'hochbetagt',
  titel: '„Ich bin doch kein Kleinkind!“',
  kurz: 'Pflegeheim, Frühdienst: Ein 82-jähriger Bewohner lehnt das Waschen ab. Sein Bett ist nass, und das ist neu.',
  rahmen: 'Du bist im 1. Ausbildungsdrittel im Frühdienst eines Pflegeheims und sollst Herrn Schäfer bei der Körperpflege unterstützen. Deine Praxisanleiterin ist auf dem Wohnbereich und kommt, wenn du sie rufst.',
  lernziele: [
    'Ablehnung als Botschaft verstehen: Gründe erfragen, statt zu überreden oder zu übergehen.',
    'Selbstbestimmung wahren und Pflege gemeinsam aushandeln (Zeitpunkt, Ort, Person, was er selbst macht).',
    'Scham und Intimsphäre schützen; Druck aus dem Team sachlich begegnen.',
    'Neu aufgetretene Inkontinenz als Warnzeichen erkennen, Urinstix und Temperatur melden, eine ungeeignete Anordnung (Dauerkatheter) hinterfragen.',
    'Das eigene Erleben (Ungeduld, Ekel, Unsicherheit) mit der Praxisanleitung reflektieren.',
  ],
  lehrplan: {
    ce: ['ce.03', 'ce.02'], abschnitt: ['ad12'],
    themen: ['thema.kom.gespraech', 'thema.kom.grundlagen', 'thema.ph.koerperpflege', 'thema.kom.ethik', 'thema.ph.ausscheidung', 'thema.pro.zystitis'],
    kompetenzen: ['II.1.a', 'II.1.c', 'II.1.e', 'V.2.c'],
  },
  geeignet: { rollen: [1, 2], stufen: [1, 2, 3] },
  dauerMin: [10, 15],
  freigabe: {
    status: 'entwurf',
    pruefpunkte: [
      'Gesprächsverlauf (Ablehnung, Scham, Aushandeln) mit Lehrkraft CE 03 abstimmen',
      'Dauerkatheter bei Inkontinenz als fehlerhafte Anordnung: KRINKO-Empfehlung Prävention katheterassoziierter Harnwegsinfektionen (2015) prüfen',
      'Inkontinenzassoziierte Dermatitis (IAD) und Hautschutz: Formulierung gegen Expertenstandard Kontinenzförderung (2024) prüfen',
      'Druck durch die Wohnbereichsleitung: realistisch und fair dargestellt?',
    ],
  },
  quellen: [
    { id: 'dnqp-kontinenz', titel: 'DNQP: Expertenstandard Kontinenzförderung in der Pflege (2024)' },
    { id: 'dnqp-demenz', titel: 'DNQP: Expertenstandard Beziehungsgestaltung in der Pflege von Menschen mit Demenz (2019)' },
    { id: 'krinko-cauti', titel: 'KRINKO: Prävention und Kontrolle katheterassoziierter Harnwegsinfektionen (Bundesgesundheitsblatt 2015)' },
    { id: 'charta', titel: 'Charta der Rechte hilfe- und pflegebedürftiger Menschen (BMFSFJ/BMG), Artikel 1–3' },
    { id: 'lehrplan-ce03', titel: 'Landeslehrplan BW 3BFP, CE 03 Erste Pflegeerfahrungen reflektieren (S. 22–25)' },
  ],

  person: {
    name: 'Herr Schäfer',
    alter: { jahre: 82 },
    geschlecht: 'm',
    biografie: ['seit drei Wochen im Heim, nach dem Tod seiner Frau', 'war Schreinermeister, hat immer abends geduscht', 'Tochter Frau Weber kommt mittwochs und sonntags'],
    diagnosenBekannt: ['leichte kognitive Beeinträchtigung', 'Herzinsuffizienz NYHA II', 'benigne Prostatahyperplasie', 'Pflegegrad 2'],
    medikamentePlan: ['Ramipril 2,5 mg 1-0-0', 'Torasemid 5 mg 1-0-0', 'Tamsulosin 0,4 mg 0-0-1'],
    allergien: ['keine bekannt'],
    hilfsmittel: ['Rollator', 'Lesebrille'],
    gewichtKg: 78,
  },
  medien: { raum: '26_pflegeheim_zimmer_tag' },
  uebernahme: 'Herr Schäfer, Zimmer 12, 82 Jahre, seit drei Wochen bei uns. Selbstständig mit Rollator, braucht Hilfe beim Waschen von Rücken und Beinen. Die Nachtwache sagt: seit drei Nächten nass, heute wieder, er hat sie weggeschickt.',
  startUhrzeit: '07:20',

  start: {
    // Leichter Infekt: Temperatur 38,2 °C, Unruhe und Angst (Scham), langsam steigendes Delirrisiko durch den Infekt
    grund: { temperatur: 38.2, unruhe: 0.45, angst: 0.5, schmerz: 2, hydratation: 0.92, orientierung: 0.85 },
    treiber: [{ art: 'delir_trigger', ausloeser: ['infekt'] }],
    bild: { haltung: 'liegt', haut: 'rosig', mimik: 'angst' },
    sichtbar: [],
    anordnungen: ['an-plan'],
  },

  massnahmen: [
    // Gespräch
    'vorstellen-einverstaendnis', 'ansprechen-orientierung', 'wuensche-aushandeln', 'biografie-erfragen', 'beschwerden-erfragen', 'validierend-sprechen', 'trinkmenge-erfragen',
    // Beobachten
    'haut-beobachten', 'schmerz-nrs', 'urin-beobachten', 'delir-screening-4at', 'dekubitusrisiko-einschaetzen',
    // Akut
    'fem-anlegen',
    // Messen
    'kurve-lesen', 'temperatur-ohr', 'rr-messen', 'puls-zaehlen', 'urinstix',
    // Versorgen
    'haendedesinfektion', 'privatsphaere-wahren', 'koerperpflege', 'koerperpflege-trotzdem', 'inkontinenz-versorgen', 'trinken-anbieten', 'blasenkatheter-legen',
    // Melden
    'pflegefachperson-informieren', 'reflexion-pa', 'pflegebericht', 'pflegeplanung-anpassen',
  ],
  massnahmenZusatz: [
    aus('koerperpflege', { name: 'Bei der Körperpflege am Waschbecken unterstützen (er wäscht vorn selbst)', voraussetzung: EINVERSTANDEN, setzt: ['gewaschen'] }),
    {
      id: 'koerperpflege-trotzdem', name: 'Trotzdem waschen: „Das muss jetzt sein, das geht ganz schnell.“', reiter: 'versorgen', spur: 'A', zeitbedarfSekunden: 300,
      befugnis: { 1: 'selbst', 2: 'selbst', 3: 'selbst', pflegefachperson: 'selbst' }, setzt: ['gegen-willen'], kompetenzbereiche: ['II', 'IV'],
    },
    aus('inkontinenz-versorgen', { name: 'Zur Toilette begleiten, Urin auffangen, Bett frisch beziehen, Haut schützen', voraussetzung: EINVERSTANDEN, setzt: ['urin-gewonnen', 'bett-frisch'] }),
    aus('urinstix', { voraussetzung: { flag: 'urin-gewonnen' } }),
    aus('haut-beobachten', { name: 'Haut an Gesäß und Leiste ansehen', voraussetzung: EINVERSTANDEN }),
    aus('pflegefachperson-informieren', { name: 'Wohnbereichsleitung Sabine informieren', setzt: ['wbl-informiert'] }),
    aus('fem-anlegen', { name: 'Bettgitter hochziehen, damit er nicht allein aufsteht' }),
  ],

  akte: {
    aufnahmegrund: 'Einzug vor drei Wochen nach dem Tod der Ehefrau; allein zu Hause nicht mehr sicher (zwei Stürze, vergessene Herdplatte).',
    anamnese: [
      'Bis zum Einzug kontinent, nachts einmal zur Toilette (Prostata).',
      'Hat jahrzehntelang abends geduscht, morgens nur rasiert und Zähne geputzt.',
      'Wird ungern von Frauen im Intimbereich versorgt („das hat nur meine Frau gesehen“). Pfleger Mehmet kommt gut mit ihm aus.',
      'Liest gern Zeitung, fragt nach der Werkstatt, wenn er unruhig ist.',
    ],
    diagnosen: [
      { text: 'Leichte kognitive Beeinträchtigung', icd: 'F06.7', seit: '2025' },
      { text: 'Herzinsuffizienz NYHA II', icd: 'I50.12', seit: '2021' },
      { text: 'Benigne Prostatahyperplasie', icd: 'N40', seit: '2018' },
    ],
    medikation: [
      { id: 'mp-ramipril', wirkstoff: 'Ramipril', staerke: '2,5 mg', form: 'Tbl.', schema: '1-0-0-0', massnahme: 'tabletten-wie-geplant-geben', zuletzt: 'gestern 08:00' },
      { id: 'mp-torasemid', wirkstoff: 'Torasemid', staerke: '5 mg', form: 'Tbl.', schema: '1-0-0-0', zuletzt: 'gestern 08:00', hinweis: 'Morgens, damit er nachts nicht so oft muss.' },
      { id: 'mp-tamsulosin', wirkstoff: 'Tamsulosin', staerke: '0,4 mg', form: 'Kps.', schema: '0-0-1-0', zuletzt: 'gestern 20:00', hinweis: 'Nach dem Abendessen; kann Schwindel beim Aufstehen machen.' },
    ],
    vorwerte: [
      { zeit: 'vor 7 Tagen', vorH: 168, werte: { rrSys: 134, rrDia: 80, hf: 74, temp: 36.6, gewicht: 78.4 }, kuerzel: 'SB' },
      { zeit: 'vor 2 Tagen', vorH: 48, werte: { rrSys: 130, rrDia: 78, hf: 78, temp: 36.9 }, kuerzel: 'MK' },
    ],
    pflegebericht: [
      { zeit: 'vor 3 Tagen 05:40', wer: 'Nachtwache', text: 'Bett nass, Bewohner sehr beschämt („das ist mir noch nie passiert“). Bett frisch bezogen.' },
      { zeit: 'gestern 06:10', wer: 'Nachtwache', text: 'Erneut eingenässt. Lässt sich nicht helfen, schickt mich weg. Inkontinenzvorlage abgelehnt.' },
      { zeit: 'gestern 07:30', wer: 'MK (Frühdienst)', text: 'Körperpflege abgelehnt („Lassen Sie mich in Ruhe“). Nach dem Frühstück am Waschbecken allein gewaschen. Klagt über Brennen beim Wasserlassen?' },
    ],
    assessments: [
      { name: 'Kontinenzprofil (Expertenstandard)', wert: 'bis vor 3 Tagen kontinent', datum: 'bei Einzug' },
      { name: 'Braden-Skala', wert: '19 Punkte (kein erhöhtes Risiko)', datum: 'bei Einzug' },
      { name: 'Sturzrisiko', wert: 'erhöht', datum: 'bei Einzug', hinweis: 'zwei Stürze zu Hause, Rollator, Tamsulosin.' },
      { name: 'Barthel-Index', wert: '70 von 100', datum: 'bei Einzug' },
    ],
    labor: [
      { name: 'Kreatinin', wert: '1,0', einheit: 'mg/dl', norm: '0,7–1,2', datum: 'vor 2 Monaten (Hausarzt)' },
      { name: 'PSA', wert: '3,1', einheit: 'ng/ml', norm: 'unter 4', datum: 'vor 6 Monaten (Urologe)' },
    ],
    pflegeplanung: [
      { problem: 'Braucht Unterstützung beim Waschen von Rücken und Beinen; Ressource: wäscht Oberkörper und Intimbereich selbst', ziel: 'Behält die Selbstständigkeit bei der Körperpflege', massnahmen: ['Waschbecken, Hocker, Utensilien bereitstellen', 'Rücken und Beine übernehmen'] },
      { problem: 'Eingewöhnung nach Umzug und Verlust der Ehefrau', ziel: 'Fühlt sich im Wohnbereich sicher', massnahmen: ['feste Bezugspflegende (Mehmet)', 'Gespräche über die Werkstatt anbieten'] },
    ],
    rechtliches: [
      'Schweigepflichtentbindung: Auskunft an die Tochter, Frau Weber, erlaubt.',
      'Keine Betreuung, keine Vorsorgevollmacht. Herr Schäfer entscheidet selbst.',
    ],
  },

  befunde: [
    { massnahme: 'haendedesinfektion', varianten: [{ text: 'Du desinfizierst die Hände, 30 Sekunden.' }] },
    { massnahme: 'vorstellen-einverstaendnis', varianten: [{ text: 'Du klopfst, stellst dich vor und sagst, dass du ihn beim Waschen unterstützen sollst. Er zieht die Decke bis zum Kinn: „Nein. Lassen Sie mich in Ruhe. Ich bin doch kein Kleinkind!“' }] },
    { massnahme: 'ansprechen-orientierung', varianten: [{ text: 'Er weiß, wo er ist und welcher Tag ist, sucht kurz nach dem Monat. Er schaut dich nicht an.' }] },
    { massnahme: 'wuensche-aushandeln', varianten: [
      { wenn: { flag: 'grund-scham' }, text: 'Du bietest ihm drei Wege an: allein am Waschbecken, du reichst nur an; später nach dem Frühstück; oder Pfleger Mehmet übernimmt den Rücken. Er überlegt: „Am Waschbecken. Allein. Und den Rücken soll der Mehmet machen.“' },
      { text: 'Du fragst, wie er es gern hätte. „Gar nicht. Gehen Sie!“ Ohne zu wissen, was ihn stört, findet ihr keinen Weg.' },
    ] },
    { massnahme: 'biografie-erfragen', varianten: [{ text: '„Ich hab mein Leben lang abends geduscht. Morgens rasiert, fertig. Und mich hat nur meine Frau so gesehen.“' }] },
    { massnahme: 'beschwerden-erfragen', varianten: [{ text: '„Beim Wasserlassen brennt es seit ein paar Tagen. Und nachts komm ich nicht mehr rechtzeitig.“ Er schaut weg.' }] },
    { massnahme: 'validierend-sprechen', varianten: [{ text: 'Du sprichst aus, was du siehst: „Das ist Ihnen unangenehm.“ Er nickt. „Peinlich ist das.“' }] },
    { massnahme: 'trinkmenge-erfragen', varianten: [{ text: '„Abends trink ich nichts mehr, damit nichts passiert.“' }] },
    { massnahme: 'kurve-lesen', varianten: [{ text: 'Pflegebericht: seit drei Nächten nass, bis dahin kontinent. Gestern Brennen beim Wasserlassen erwähnt (mit Fragezeichen). Pflegeplanung: wäscht Oberkörper und Intimbereich selbst, Mehmet als Bezugspflegender. Schweigepflichtentbindung für die Tochter liegt vor.' }] },
    { massnahme: 'temperatur-ohr', varianten: [{ text: '{temp} °C (vor zwei Tagen 36,9 °C).', zeigt: ['temp'] }] },
    { massnahme: 'rr-messen', varianten: [{ text: 'RR {rrSys}/{rrDia} mmHg, Puls {hf}/min.', zeigt: ['rrSys', 'rrDia', 'hf'] }] },
    { massnahme: 'puls-zaehlen', varianten: [{ text: 'Puls {hf}/min, regelmäßig.', zeigt: ['hf'] }] },
    { massnahme: 'schmerz-nrs', varianten: [{ text: 'Brennen beim Wasserlassen NRS 3, sonst keine Schmerzen.' }] },
    { massnahme: 'urin-beobachten', varianten: [{ text: 'Laken und Hose nass, Urin trüb und riecht streng.' }] },
    { massnahme: 'haut-beobachten', varianten: [{ text: 'Gesäß und Leisten gerötet und feucht, Haut intakt, die Rötung lässt sich wegdrücken. Zeichen einer beginnenden inkontinenzassoziierten Dermatitis, kein Dekubitus.' }] },
    { massnahme: 'urinstix', varianten: [{ text: 'Urinstix: Leukozyten +++, Nitrit positiv, Blut +.' }] },
    { massnahme: 'delir-screening-4at', varianten: [{ text: '4AT: wach (0), AMT4 ein Fehler (1), Monate rückwärts mit Mühe (1), akute Veränderung nicht sicher (0) = 2 Punkte. Kein Delir, aber kognitive Einschränkung; weiter beobachten.' }] },
    { massnahme: 'dekubitusrisiko-einschaetzen', varianten: [{ text: 'Mobil mit Rollator, wechselt selbst die Lage. Kein erhöhtes Dekubitusrisiko; die Haut ist durch die Nässe gefährdet.' }] },
    { massnahme: 'koerperpflege', varianten: [{ text: 'Am Waschbecken wäscht er Gesicht, Oberkörper und Intimbereich selbst, du reichst Waschlappen und Handtücher und drehst dich weg, wenn er es möchte. Er rasiert sich sorgfältig. „So. Jetzt fühl ich mich wieder wie ein Mensch.“' }] },
    { massnahme: 'inkontinenz-versorgen', varianten: [{ text: 'Er geht mit dem Rollator zur Toilette, du fängst Urin für den Stix auf. Danach beziehst du das Bett frisch und trägst nach dem Waschen eine Hautschutzcreme auf.' }] },
    { massnahme: 'reflexion-pa', varianten: [{ text: 'Frau Yıldız fragt: „Wie ging es dir, als er dich weggeschickt hat? Was hat dir geholfen? Was nimmst du mit?“ Ihr sprecht über Ungeduld, den Druck um neun Uhr und darüber, dass „Nein“ ein Recht ist und oft einen Grund hat.' }] },
  ],

  gespraech: [
    { id: 'g-was-stoert', frage: 'Ruhig fragen, was ihn stört', an: 'patient', kompetenzbereiche: ['I', 'II'],
      antwort: [
        { wenn: { getan: 'vorstellen-einverstaendnis' }, text: 'Lange Pause. „Das Bett ist nass. Schon wieder. Das ist mir noch nie passiert. Und jetzt soll mich eine junge Frau waschen.“', setzt: ['grund-scham'] },
        { text: '„Wer sind Sie überhaupt? Raus!“' },
      ],
      wirkung: [{ groesse: 'angst', delta: -0.1, beginnSek: 0, spitzeSek: 30, dauerSek: 'dauerhaft' }],
      fakten: ['Bett nass, schämt sich', 'möchte nicht von einer jungen Frau gewaschen werden'] },
    { id: 'g-entlasten', frage: 'Ohne Vorwurf sagen, dass das nasse Bett oft eine behandelbare Ursache hat', an: 'patient', kompetenzbereiche: ['II'],
      nurWenn: { flag: 'grund-scham' },
      antwort: [{ text: '„Meinen Sie? Ich dachte, jetzt geht’s bergab.“ Er lässt die Decke etwas los.', setzt: ['entlastet'] }],
      wirkung: [{ groesse: 'angst', delta: -0.2, beginnSek: 0, spitzeSek: 60, dauerSek: 'dauerhaft' }, { groesse: 'unruhe', delta: -0.2, beginnSek: 0, spitzeSek: 60, dauerSek: 'dauerhaft' }] },
    { id: 'g-einverstanden', frage: 'Den vereinbarten Weg zusammenfassen und fragen, ob er so einverstanden ist', an: 'patient', kompetenzbereiche: ['II', 'IV'],
      nurWenn: { getan: 'wuensche-aushandeln' },
      antwort: [
        { wenn: { flag: 'grund-scham' }, text: '„Ja. So machen wir das.“ Er setzt sich auf.', setzt: ['einverstanden-pflege'] },
        { text: '„Ich hab doch gesagt: nein.“' },
      ],
      wirkung: [{ groesse: 'unruhe', delta: -0.1, beginnSek: 0, spitzeSek: 30, dauerSek: 'dauerhaft' }] },
    { id: 'g-mehmet', frage: 'Pfleger Mehmet bitten, den Rücken zu übernehmen', an: 'kollegin', kompetenzbereiche: ['II', 'III'],
      nurWenn: { flag: 'einverstanden-pflege' },
      antwort: [{ text: 'Mehmet: „Klar, ich komm in fünf Minuten. Gut, dass du gefragt hast, er mag das nicht von Frauen.“', setzt: ['mehmet-hilft'] }] },
    { id: 'g-tochter', frage: 'Mit der Tochter sprechen: Lage schildern, nach Gewohnheiten fragen', an: 'angehoerige', kanal: 'telefon', kompetenzbereiche: ['II', 'IV'],
      nurWenn: { ab: TOCHTER_RUFT },
      schweigepflicht: { erlaubtWenn: { getan: 'kurve-lesen' },
        fehlerText: 'Du hast der Anruferin Auskunft gegeben, ohne zu prüfen, ob Herr Schäfer das erlaubt hat. Er entscheidet selbst (keine Betreuung). Erst nachsehen, ob eine Schweigepflichtentbindung vorliegt, sonst ihn fragen.' },
      antwort: [{ text: 'Frau Weber: „Oh, das tut mir leid für ihn. Er hat sich immer abends geduscht, morgens nie. Und er schämt sich schnell. Bitte sagen Sie dem Arzt Bescheid, wegen dem Brennen hat er mir am Sonntag auch was erzählt.“', setzt: ['tochter-gesprochen'] }],
      fakten: ['duschte abends', 'schämt sich schnell', 'erwähnte Brennen am Sonntag'] },
  ],

  sbar: [
    { id: 's-inkontinenz-neu', teil: 'S', text: 'Herr Schäfer, 82, Zimmer 12: seit drei Nächten neu eingenässt, Brennen beim Wasserlassen.', art: 'kern' },
    { id: 's-verweigert', teil: 'S', text: 'Herr Schäfer verweigert die Pflege.', art: 'falsch' },
    { id: 'b-heim', teil: 'B', text: 'Seit drei Wochen bei uns, leichte kognitive Einschränkung, Prostatavergrößerung, bisher kontinent.', art: 'kern' },
    { id: 'b-schreiner', teil: 'B', text: 'Er war Schreinermeister.', art: 'ablenker' },
    { id: 'a-urinstix', teil: 'A', text: 'Urinstix: Leukozyten und Nitrit positiv, Urin trüb.', art: 'kern', bekanntWenn: { getan: 'urinstix' } },
    { id: 'a-haut', teil: 'A', text: 'Haut an Gesäß und Leiste gerötet, intakt.', art: 'hilfreich', bekanntWenn: { getan: 'haut-beobachten' } },
    { id: 'a-alter', teil: 'A', text: 'Wahrscheinlich einfach das Alter.', art: 'falsch' },
    { id: 'r-abklaeren', teil: 'R', text: 'Bitte klären Sie einen Harnwegsinfekt ab. Wie sollen wir bis dahin vorgehen?', art: 'kern' },
    { id: 'r-dk', teil: 'R', text: 'Sollen wir ihm einen Dauerkatheter legen?', art: 'ablenker' },
  ],

  anordnungen: [
    { id: 'an-plan', massnahme: 'trinken-anbieten', text: 'Pflegeplanung: Getränke bereitstellen, Trinkmenge beobachten.' },
    { id: 'an-trinken', massnahme: 'trinken-anbieten', text: 'Trinken fördern, Ziel 1,5 l bis zum Abend, Trinkprotokoll.' },
    { id: 'an-dk', massnahme: 'blasenkatheter-legen', text: 'Transurethralen Dauerkatheter legen, damit er nachts trocken bleibt.',
      fehlerhaft: { warum: 'Inkontinenz ist keine Indikation für einen Dauerkatheter (KRINKO). Der Katheter erhöht das Infektionsrisiko, schränkt ein und nimmt Herrn Schäfer die Kontrolle. Er hat außerdem nicht eingewilligt.',
        korrektur: 'Kein Dauerkatheter. Toilettengang vor dem Schlafen, Urinflasche in Reichweite, nachts eine aufsaugende Vorlage anbieten, wenn er möchte. Erst die Ursache behandeln.' } },
  ],

  arzt: {
    name: 'Hausarzt Dr. Lorenz',
    erreichbar: 'hausarzt-praxis',
    regeln: [
      REGEL_HWI,
      { id: 'r-stix-frage', wenn: { gemeldet: ['s-inkontinenz-neu', 'wert:temp'] },
        antwort: '„Danke. Neu eingenässt mit Brennen, da muss ich an einen Infekt denken.“',
        rueckfrage: { text: '„Haben Sie einen Urinstix gemacht?“', erwartet: ['a-urinstix'], auftrag: 'af-stix' } },
      { wenn: { gemeldet: ['s-inkontinenz-neu'] },
        antwort: '„Hat er Fieber? Messen Sie bitte die Temperatur und machen Sie einen Urinstix, dann melden Sie sich wieder.“' },
      { wenn: { eine: [{ gemeldet: ['s-verweigert'] }, { gemeldet: ['a-alter'] }] },
        antwort: '„Wenn er nicht will, dann lassen Sie ihn eben. Ich komme nächste Woche zur Visite.“', setzt: ['arzt-beruhigt'] },
    ],
    auftraege: [
      { id: 'af-stix', text: 'Urinstix machen und dem Hausarzt melden', erledigt: { getan: 'urinstix' }, meldung: ['a-urinstix'], meldenBinnenSek: 900,
        folge: [{ ...REGEL_HWI, wenn: { ab: 0 } }] },
      { id: 'af-temp', text: 'In einer Viertelstunde Temperatur messen und dem Hausarzt schicken', erledigt: { getan: 'temperatur-ohr' },
        meldung: ['wert:temp'], meldenBinnenSek: 1500,
        folge: [{ wenn: { ab: 0 }, antwort: '„Danke. Dann bleibt es bei 12 Uhr. Wenn er verwirrter wird oder über 38,5 °C kommt, rufen Sie mich sofort an.“', setzt: ['temp-rueckmeldung'] }] },
    ],
  },

  team: { kollegin: 'Pfleger Mehmet (Bezugspflegender)', weitere: { angehoerige: 'Tochter Frau Weber (Telefon)' } },

  ereignisse: [
    { id: 'e-wbl', art: 'team', wann: { ab: WBL_KOMMT },
      text: 'Wohnbereichsleitung Sabine schaut herein: „Ist der Herr Schäfer immer noch nicht gewaschen? Um neun kommt die Fußpflege. Mach einfach schnell, der beruhigt sich dann schon.“',
      entscheidung: [
        { id: 'w-sachlich', text: 'Sachlich erklären, dass er ablehnt, warum, und welchen Weg ihr vereinbart habt', wertung: 'gut', setzt: ['wbl-informiert'],
          warum: 'Selbstbestimmung gilt auch unter Zeitdruck. Wer den Grund kennt, kann den Ablauf anpassen. Die Fußpflege lässt sich verschieben.' },
        { id: 'w-verschieben', text: 'Nur sagen: „Ich mach das später“, ohne Begründung', wertung: 'vertretbar',
          warum: 'Du schützt ihn, aber das Team erfährt nichts von Scham, Infektzeichen und Vereinbarung.' },
        { id: 'w-schnell', text: 'Gemeinsam mit Sabine schnell waschen, auch wenn er sich wehrt', wertung: 'gefaehrlich', setzt: ['gegen-willen'],
          warum: 'Pflege gegen den erklärten Willen eines einwilligungsfähigen Menschen ist eine Grenzüberschreitung (Charta Art. 1–3) und kann Gewalt sein.' },
      ] },
    { id: 'e-tochter', art: 'telefon', wann: { ab: TOCHTER_RUFT },
      text: 'Das Telefon im Dienstzimmer klingelt, Mehmet reicht es dir: „Weber hier, die Tochter von Herrn Schäfer. Die Nachtwache hat gestern was angedeutet. Was ist denn mit meinem Vater?“' },
  ],

  pa: {
    name: 'Praxisanleiterin Frau Yıldız',
    hilfen: [
      { wenn: { nicht: { flag: 'grund-scham' } }, impuls: 'Er sagt Nein. Was könnte dahinterstecken?', tipp: 'Frag ruhig, was ihn stört, bevor du überzeugst. Schau dir auch den Pflegebericht der Nacht an.' },
      { wenn: { nicht: { flag: 'einverstanden-pflege' } }, impuls: 'Was kann er selbst entscheiden?', tipp: 'Biete ihm eine Wahl an: wann, wo, wer, was er selbst macht. Dann frag, ob er einverstanden ist.' },
      { wenn: { nicht: { getan: 'urinstix' } }, impuls: 'Er war bis vor drei Tagen kontinent. Was heißt das?', tipp: 'Neue Inkontinenz hat oft eine Ursache. Temperatur und Urinstix, dann den Hausarzt informieren.' },
      { wenn: { auftrag: 'af-stix', status: 'offen' }, impuls: 'Was wollte der Hausarzt noch wissen?', tipp: 'Den Urinstix. Mach ihn und schick ihm das Ergebnis.' },
      { wenn: { alle: [{ flag: 'arzt-informiert' }, { nicht: { flag: 'remonstriert:an-dk' } }] }, impuls: 'Passt die Anordnung mit dem Katheter zu Herrn Schäfer?', tipp: 'Inkontinenz ist keine Indikation für einen Dauerkatheter. Sag das dem Hausarzt.' },
      { wenn: { nicht: { getan: 'reflexion-pa' } }, impuls: 'Wie geht es dir gerade mit der Situation?', tipp: 'Lass uns kurz reflektieren: Was hast du erlebt, was hat geholfen, was nimmst du mit?' },
      { impuls: 'Was braucht Herr Schäfer heute, damit er sich nicht ausgeliefert fühlt?', tipp: 'Intimsphäre schützen, er macht so viel wie möglich selbst, Mehmet für den Rücken.' },
    ],
  },

  bewertung: {
    pflicht: [
      { id: 'p-haende', text: 'Hände vor dem Kontakt desinfiziert', gewicht: 1, kompetenzbereiche: ['I'], erfuellt: { getan: 'haendedesinfektion' }, warum: 'Vor jeder Pflegehandlung, gerade bei Ausscheidungen.' },
      { id: 'p-grund', text: 'Grund der Ablehnung erfragt (Scham über das nasse Bett)', gewicht: 3, kompetenzbereiche: ['II'], erfuellt: { flag: 'grund-scham' },
        warum: 'Eine Ablehnung ist eine Botschaft. Ohne den Grund bleibt nur Überreden oder Übergehen.' },
      { id: 'p-aushandeln', text: 'Pflege gemeinsam ausgehandelt, Einverständnis eingeholt', gewicht: 3, kompetenzbereiche: ['II', 'IV'], erfuellt: EINVERSTANDEN,
        warum: 'Herr Schäfer entscheidet selbst. Wahlmöglichkeiten (wann, wo, wer) geben ihm die Kontrolle zurück.' },
      { id: 'p-intimsphaere', text: 'Intimsphäre geschützt', gewicht: 2, kompetenzbereiche: ['I', 'II'], erfuellt: { getan: 'privatsphaere-wahren' },
        warum: 'Scham ist der Grund der Ablehnung. Tür zu, Sichtschutz, nur aufdecken, was nötig ist.' },
      { id: 'p-gewaschen', text: 'Körperpflege nach seinen Wünschen durchgeführt', gewicht: 2, kompetenzbereiche: ['I'], erfuellt: { getan: 'koerperpflege' },
        warum: 'Die Vereinbarung wird umgesetzt: er wäscht vorn selbst, Mehmet übernimmt den Rücken.' },
      { id: 'p-ursache', text: 'Neue Inkontinenz abgeklärt (Temperatur, Urinstix)', gewicht: 2, kompetenzbereiche: ['I'],
        erfuellt: { alle: [{ getan: 'temperatur-ohr' }, { getan: 'urinstix' }] }, warum: 'Neu aufgetretene Inkontinenz ist kein „Alter“, sondern ein Warnzeichen (z. B. Harnwegsinfekt).' },
      { id: 'p-arzt', text: 'Hausarzt strukturiert informiert', gewicht: 2, kompetenzbereiche: ['II', 'III'], erfuellt: { flag: 'arzt-informiert' },
        warum: 'Ein Harnwegsinfekt braucht ärztliche Abklärung, bei kognitiver Einschränkung droht ein Delir.' },
      { id: 'p-remonstriert', text: 'Dauerkatheter-Anordnung hinterfragt', gewicht: 2, kompetenzbereiche: ['III', 'IV'], erfuellt: { flag: 'remonstriert:an-dk' },
        warum: 'Inkontinenz ist keine Indikation für einen Dauerkatheter (KRINKO). Wer durchführt, trägt Verantwortung und darf hinterfragen.' },
      { id: 'p-rueckauftrag', text: 'Temperatur-Kontrolle gemessen und gemeldet', gewicht: 1, kompetenzbereiche: ['II', 'III'], erfuellt: { auftrag: 'af-temp', status: 'gemeldet' },
        warum: 'Der Hausarzt entscheidet aus der Praxis. Er braucht den Verlauf.' },
      { id: 'p-team', text: 'Team über Ablehnung, Grund und Vereinbarung informiert', gewicht: 1, kompetenzbereiche: ['II', 'III'], erfuellt: { flag: 'wbl-informiert' },
        warum: 'Damit nicht die nächste Kollegin wieder „schnell waschen“ will.' },
      { id: 'p-reflexion', text: 'Mit der Praxisanleitung reflektiert', gewicht: 2, kompetenzbereiche: ['V'], erfuellt: { getan: 'reflexion-pa' },
        warum: 'CE 03: Eigene Gefühle wie Ungeduld, Unsicherheit oder Ekel wahrnehmen und besprechen schützt dich und die Bewohner.' },
      { id: 'p-doku', text: 'Ablehnung, Vereinbarung und Befunde dokumentiert', gewicht: 1, kompetenzbereiche: ['I', 'IV'], erfuellt: { dokumentiert: 'a-urinstix' },
        warum: 'Die Ablehnung und der vereinbarte Weg gehören in den Bericht, damit das Team einheitlich handelt.' },
    ],
    fehler: [
      { id: 'f-gegen-willen', text: 'Gegen seinen erklärten Willen gewaschen', schwere: 'schwer', kompetenzbereiche: ['II', 'IV'], wenn: { flag: 'gegen-willen' },
        folge: { text: 'Herr Schäfer schlägt deine Hand weg, schreit „Hilfe!“ und zittert. Danach redet er nicht mehr mit dir.',
          wirkung: [{ groesse: 'angst', delta: 0.4, beginnSek: 0, spitzeSek: 10, dauerSek: 1800 }, { groesse: 'unruhe', delta: 0.35, beginnSek: 0, spitzeSek: 10, dauerSek: 1800 }] },
        warum: 'Pflege gegen den Willen eines einwilligungsfähigen Menschen verletzt seine Selbstbestimmung und kann Gewalt sein.' },
      { id: 'f-gitter', text: 'Bettgitter ohne Einwilligung und Genehmigung hochgezogen', schwere: 'schwer', kompetenzbereiche: ['IV'], wenn: { getan: 'fem-anlegen' },
        warum: 'Ein Bettgitter gegen den Willen ist eine freiheitsentziehende Maßnahme (BGB § 1831) und erhöht das Sturzrisiko.' },
      { id: 'f-dk', text: 'Dauerkatheter trotz fehlender Indikation gelegt', schwere: 'schwer', kompetenzbereiche: ['III', 'IV'], wenn: { getan: 'blasenkatheter-legen' },
        warum: 'Kein Katheter bei Inkontinenz; er hatte zudem nicht eingewilligt.' },
    ],
    ende: [
      { wenn: { alle: [{ getan: 'koerperpflege' }, { flag: 'temp-rueckmeldung' }, { getan: 'reflexion-pa' }] },
        text: 'Herr Schäfer sitzt rasiert am Fenster und liest Zeitung. Der Hausarzt kommt um 12 Uhr, Mehmet übernimmt ab morgen früh die Körperpflege.', ausgang: 'stabil' },
      { wenn: { ab: 2700 }, text: 'Der Vormittag ist um. Herr Schäfer liegt noch im nassen Bett.', ausgang: 'verschlechtert' },
    ],
  },

  pflegebedarf: {
    probleme: [
      { id: 'pb-inkontinenz', text: 'Neu aufgetretene Harninkontinenz bei Verdacht auf Harnwegsinfekt', richtig: true, prioritaet: 1, warum: 'Ursache klären, Haut schützen, Trinken fördern.' },
      { id: 'pb-scham', text: 'Scham und Rückzug, lehnt Hilfe im Intimbereich durch Frauen ab', richtig: true, prioritaet: 1, warum: 'Grund der Ablehnung, bestimmt, wie Pflege gelingt.' },
      { id: 'pb-haut', text: 'Gefährdete Haut (Feuchtigkeit, beginnende IAD)', richtig: true, prioritaet: 2, warum: 'Feuchtigkeit schädigt die Haut schnell.' },
      { id: 'pb-trinken', text: 'Trinkt abends bewusst wenig', richtig: true, prioritaet: 3, warum: 'Verschlechtert den Infekt.' },
      { id: 'pb-uneinsichtig', text: 'Uneinsichtigkeit, verweigert die Pflege', richtig: false, warum: 'Er hat einen nachvollziehbaren Grund. Die Formulierung macht aus einer Botschaft einen Charakterfehler.' },
      { id: 'pb-dekubitus', text: 'Dekubitus Kategorie 1', richtig: false, warum: 'Die Rötung ist wegdrückbar und durch Nässe entstanden (IAD), kein Druckschaden.' },
    ],
    ziele: [
      { id: 'z-selbst', text: 'Herr Schäfer wäscht Oberkörper und Intimbereich selbst, Rücken übernimmt ein Pfleger.', passtZu: ['pb-scham'], richtig: true },
      { id: 'z-trocken', text: 'Herr Schäfer erreicht nachts rechtzeitig die Toilette oder die Urinflasche.', passtZu: ['pb-inkontinenz'], richtig: true },
      { id: 'z-haut', text: 'Die Haut an Gesäß und Leiste ist in drei Tagen ohne Rötung.', passtZu: ['pb-haut'], richtig: true },
      { id: 'z-dk', text: 'Herr Schäfer ist mit Dauerkatheter nachts trocken.', passtZu: ['pb-inkontinenz'], richtig: false },
    ],
  },

  leitfaden: [
    { titel: 'Ablehnung ist eine Botschaft', text: 'Wer Pflege ablehnt, hat meist einen Grund: Scham, Schmerz, Angst, andere Gewohnheiten, das Gefühl, ausgeliefert zu sein. Erst fragen, dann aushandeln: Zeitpunkt, Ort, Person und was er selbst macht. Ein einwilligungsfähiger Mensch darf Nein sagen.', quellen: ['charta', 'lehrplan-ce03'] },
    { titel: 'Scham und Intimsphäre', text: 'Tür zu, Sichtschutz, nur aufdecken, was gerade gewaschen wird. Selbst machen lassen, was er kann. Wünsche zum Geschlecht der Pflegeperson ernst nehmen, wenn es möglich ist.', quellen: ['lehrplan-ce03'] },
    { titel: 'Neu aufgetretene Inkontinenz', text: 'Plötzliche Inkontinenz hat oft eine behandelbare Ursache, z. B. einen Harnwegsinfekt. Temperatur, Urinstix, Trinkmenge, Haut beobachten und ärztlich abklären lassen. Ein Dauerkatheter ist bei Inkontinenz nicht indiziert.', quellen: ['dnqp-kontinenz', 'krinko-cauti'] },
    { titel: 'Druck im Team', text: 'Zeitpläne sind wichtig, aber kein Grund für Pflege gegen den Willen. Sachlich erklären, was der Bewohner möchte und warum; dann den Ablauf anpassen.' },
    { titel: 'Reflexion', text: 'Ungeduld, Unsicherheit, Ekel oder Ärger sind normale Reaktionen. Benenne sie mit der Praxisanleitung: Was ist passiert? Was habe ich gefühlt? Was hat geholfen? Was mache ich nächstes Mal?', quellen: ['lehrplan-ce03'] },
  ],

  pruefwege: {
    muster: [
      { art: 'massnahme', id: 'haendedesinfektion' },
      { art: 'massnahme', id: 'vorstellen-einverstaendnis' },
      { art: 'frage', id: 'g-was-stoert' },
      { art: 'frage', id: 'g-entlasten' },
      { art: 'massnahme', id: 'wuensche-aushandeln' },
      { art: 'frage', id: 'g-einverstanden' },
      { art: 'massnahme', id: 'kurve-lesen' },
      { art: 'massnahme', id: 'beschwerden-erfragen' },
      { art: 'massnahme', id: 'privatsphaere-wahren' },
      { art: 'pflegetasche', geraet: 'thermometer' },
      { art: 'massnahme', id: 'temperatur-ohr' },
      { art: 'massnahme', id: 'inkontinenz-versorgen' },
      { art: 'pflegetasche', geraet: 'urinstix' },
      { art: 'massnahme', id: 'urinstix' },
      { art: 'frage', id: 'g-tochter' },
      { art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: ['s-inkontinenz-neu', 'b-heim', 'a-urinstix', 'wert:temp', 'r-abklaeren'] },
      { art: 'rueckmelden', anordnung: 'an-trinken', rueckgelesen: true },
      { art: 'remonstrieren', anordnung: 'an-dk', grund: 'Inkontinenz ist keine Indikation, er hat nicht eingewilligt.' },
      { art: 'auflegen', an: 'aerztin' },
      { art: 'frage', id: 'g-mehmet' },
      { art: 'massnahme', id: 'koerperpflege' },
      { art: 'massnahme', id: 'trinken-anbieten' },
      { art: 'massnahme', id: 'haendedesinfektion' },
      { art: 'dokumentieren', bausteine: ['wert:temp', 'a-urinstix', 'massnahme:koerperpflege'], freitext: 'Lehnt Waschen durch Frauen im Intimbereich ab (Scham). Vereinbart: wäscht vorn selbst am Waschbecken, Rücken Pfleger Mehmet.' },
      { art: 'warten', sek: 300 },
      { art: 'massnahme', id: 'temperatur-ohr' },
      { art: 'nachricht', an: 'aerztin', kanal: 'messenger', bausteine: ['wert:temp'] },
      { art: 'massnahme', id: 'reflexion-pa' },
      { art: 'abschluss', probleme: ['pb-inkontinenz', 'pb-scham', 'pb-haut', 'pb-trinken'], ziele: ['z-selbst', 'z-trocken', 'z-haut'],
        sbar: ['s-inkontinenz-neu', 'b-heim', 'a-urinstix'] },
    ],
    unterlassung: { bisSek: 1800, erwartet: { wert: 'delir', vergleich: '>', grenze: 0.08 } },
    grenze: { rolle: 1, events: [{ art: 'massnahme', id: 'blasenkatheter-legen' }], erwartet: 'pa-eingriff' },
  },
};
