// P18 · CE09/CE04 · stationäre Langzeitpflege: Unruhe vor dem Mittagessen = Unterzucker bei Insulintherapie.
// Lebenswelt: Mahlzeitenzeiten des Heims passen nicht zu ihren Gewohnheiten. Migriert aus Altfall „pflegeheim“, fachlich neu.
// Entwurf, fachlich UNGEPRÜFT. Inhalte fiktiv/didaktisch.

import { KATALOG } from '../katalog';
import type { ArztRegel, Bedingung, FallV2, MassnahmeDefinition } from '../typen';

const aus = (id: string, mehr: Partial<MassnahmeDefinition>): MassnahmeDefinition => ({ ...KATALOG[id]!, ...mehr });

const BZ_BEKANNT: Bedingung = { getan: 'bz-messen' };
const ZUCKER_GEGEBEN: Bedingung = { getan: 'glukose-oral' };
const BZ_GUT: Bedingung = { wert: 'blutzucker', vergleich: '>=', grenze: 80 };

const ANTWORT = 'Gut, dass Sie gleich gemessen und Traubenzucker gegeben haben. Dann geben Sie ihr gleich das Mittagessen, und das Mittagsinsulin spritzen Sie ganz normal, sie isst ja jetzt. Messen Sie eine Viertelstunde nach dem Traubenzucker noch einmal und schicken Sie mir den Wert.';
const REGEL_VOLL: ArztRegel = {
  id: 'r-voll', wenn: { gemeldet: ['a-zeichen', 'wert:bz', 'a-behandelt', 'b-insulin'] },
  antwort: `„${ANTWORT}“`, anordnungen: ['an-insulin-mittag', 'an-mahlzeit'], setzt: ['arzt-informiert'], auftraege: ['af-bz15'],
};

export const LZ_UNTERZUCKER_MITTAG: FallV2 = {
  schema: 2,
  id: 'lz-unterzucker-mittag',
  version: '0.1.0',
  spur: 'A',
  setting: 'langzeit',
  altersgruppe: 'hochbetagt',
  titel: 'Unruhe vor dem Mittagessen',
  kurz: 'Pflegeheim, späterer Vormittag: 83-jährige Bewohnerin mit Insulin wird unruhig, zittrig und schwitzt. Das Mittagessen kommt erst in einer halben Stunde.',
  rahmen: 'Du bist im Frühdienst im Wohnbereich 3 eines Pflegeheims eingeteilt, deine Praxisanleiterin arbeitet im Nachbarflur. Der Hausarzt ist über Telefon und Praxis-Messenger erreichbar.',
  lernziele: [
    'Unruhe, Zittern und Schwitzen bei Insulintherapie als mögliche Unterzuckerung erkennen und sofort den Blutzucker messen.',
    'Vor der Gabe von Traubenzucker Bewusstsein und Schlucken prüfen und danach langsam wirksame Kohlenhydrate nachgeben.',
    'Eine geplante Insulingabe bei Unterzucker zurückstellen und eine unpassende Anordnung hinterfragen.',
    'Gewohnheiten (Essenszeiten, Vorlieben) als Ursache erkennen und in die Pflegeplanung einbringen.',
    'Die Schweigepflicht auch gegenüber Mitbewohnenden wahren.',
  ],
  lehrplan: {
    ce: ['ce.09', 'ce.04'], abschnitt: ['ad12'],
    themen: ['thema.kl.diabetes', 'thema.ph.medikamente', 'thema.beo.bewusstsein', 'thema.ph.ernaehrung'],
    kompetenzen: ['I.5.a', 'I.6.d', 'II.1.b'],
  },
  geeignet: { rollen: [1, 2, 3], stufen: [1, 2, 3] },
  dauerMin: [10, 15],
  freigabe: {
    status: 'entwurf',
    pruefpunkte: [
      'Hypoglykämie-Schwellen und Menge schnell wirksamer Kohlenhydrate (15–20 g) gegen NVL Typ-2-Diabetes und Haus-SOP prüfen',
      'Mischinsulin morgens + Normalinsulin mittags als Schema für eine 83-Jährige plausibel? (Ziel-BZ im Alter höher ansetzen)',
      'Remonstration „Mittagsinsulin ganz normal“ fachlich prüfen (BZ unter 70 vor dem Essen → Rücksprache, meist weglassen/anpassen)',
      'Verlauf des Blutzuckers im Lernmodell (Abfall, Anstieg nach 20 g, erneuter Abfall ohne Mahlzeit) plausibel?',
    ],
  },
  quellen: [
    { id: 'nvl-diabetes', titel: 'Nationale VersorgungsLeitlinie Typ-2-Diabetes, Version 3.0, 2023' },
    { id: 'ddg-alter', titel: 'S2k-Leitlinie Diagnostik, Therapie und Verlaufskontrolle des Diabetes mellitus im Alter (DDG), 2. Auflage 2018' },
    { id: 'dnqp-ernaehrung', titel: 'DNQP: Expertenstandard Ernährungsmanagement zur Sicherung und Förderung der oralen Ernährung in der Pflege, 1. Aktualisierung 2017' },
    { id: 'stgb-203', titel: 'StGB § 203 Verletzung von Privatgeheimnissen; Berufsordnung Pflege' },
  ],

  person: {
    name: 'Frau Winter',
    alter: { jahre: 83 },
    geschlecht: 'w',
    biografie: ['war Bäckereiverkäuferin, stand jahrzehntelang ab 5 Uhr im Laden', 'frühstückt seit jeher erst gegen 9 Uhr: Kaffee mit Milch und ein Brötchen mit Honig', 'seit drei Wochen im Heim, vorher allein in der eigenen Wohnung', 'Tochter Karin hat Vorsorgevollmacht'],
    diagnosenBekannt: ['Diabetes mellitus Typ 2 mit Insulintherapie', 'leichte kognitive Störung', 'arterielle Hypertonie', 'Pflegegrad 3'],
    medikamentePlan: ['Mischinsulin 14 IE morgens', 'Normalinsulin 6 IE vor dem Mittagessen', 'Amlodipin 5 mg 1-0-0'],
    allergien: ['keine bekannt'],
    hilfsmittel: ['Rollator', 'Lesebrille'],
    gewichtKg: 64,
  },
  medien: {
    raum: '26h_pflegeheim_zimmer_hypoglykaemie',
    raumVarianten: [{ wenn: { getan: 'kohlenhydrate-langsam' }, raum: '26_pflegeheim_zimmer_tag' }],
  },
  uebernahme: 'Frau Winter, 83, seit drei Wochen bei uns, Diabetes mit Insulin. Morgens um 7:15 hat sie ihr Mischinsulin bekommen, vom Frühstück um halb acht hat sie nur einen Schluck Kaffee getrunken. Sie klingelt gerade zum dritten Mal und sagt, ihr sei „so komisch“. Die Kollegin meint, sie sei halt noch nicht eingewöhnt.',
  startUhrzeit: '11:10',

  start: {
    // Unterzucker durch Mischinsulin ohne Frühstück: BZ fällt weiter, bis Kohlenhydrate kommen
    grund: { blutzucker: 58, angst: 0.45, unruhe: 0.45, orientierung: 0.65, temperatur: 36.6, hydratation: 0.95, volumen: 0.97 },
    treiber: [{ art: 'hypoglykaemie', abfallProStunde: 24 }],
    bild: { haltung: 'unruhig', haut: 'blass-kaltschweissig', mimik: 'angst' },
    sichtbar: [],
    anordnungen: ['an-plan'],
  },

  massnahmen: [
    // Gespräch
    'vorstellen-einverstaendnis', 'ansprechen-orientierung', 'beruhigen-zusprechen', 'biografie-erfragen',
    // Beobachten
    'bewusstsein-avpu', 'haut-beobachten', 'schlucken-pruefen', 'spritzstellen-pruefen',
    // Akut
    'glukose-oral', 'hilfe-holen', 'notruf-112', 'sitzend-sichern',
    // Messen (Pflegetasche)
    'bz-messen', 'puls-zaehlen', 'rr-messen', 'temperatur-ohr', 'kurve-lesen',
    // Versorgen
    'kohlenhydrate-langsam', 'gabe-zurueckstellen', 'insulin-sc', 'tabletten-wie-geplant-geben',
    // Melden
    'pflegefachperson-informieren', 'pflegebericht', 'pflegeplanung-anpassen',
  ],
  massnahmenZusatz: [
    aus('glukose-oral', { name: 'Traubenzucker (4 Plättchen = 20 g) oder 200 ml Saft geben, im Sitzen' }),
    aus('kohlenhydrate-langsam', { name: 'Ein halbes Brötchen mit Honig und ein Glas Milch anbieten (langsame Kohlenhydrate)' }),
    aus('gabe-zurueckstellen', { name: 'Mittagsinsulin zurückstellen und sofort Rücksprache halten' }),
    aus('insulin-sc', { name: 'Normalinsulin 6 IE vor dem Mittagessen spritzen (laut Plan)', treiber: [{ art: 'insulin', ie: 6 }] }),
  ],

  akte: {
    aufnahmegrund: 'Einzug vor drei Wochen aus der eigenen Wohnung, nachdem sie zweimal Insulin doppelt gespritzt hatte. Vollstationäre Pflege, Pflegegrad 3.',
    anamnese: [
      'War 40 Jahre Bäckereiverkäuferin, stand um 5 Uhr auf und frühstückte erst gegen 9 Uhr im Laden. Das ist bis heute ihr Rhythmus.',
      'Mag zum Frühstück Kaffee mit Milch und ein Brötchen mit Honig, kein Schwarzbrot.',
      'Leichte kognitive Störung: vergisst, ob sie gespritzt hat, ist sonst orientiert.',
      'Tochter Karin Winter hat eine Vorsorgevollmacht (Gesundheit), wohnt in der Nähe.',
    ],
    diagnosen: [
      { text: 'Diabetes mellitus Typ 2, insulinpflichtig', icd: 'E11.90', seit: '2009' },
      { text: 'Leichte kognitive Störung', icd: 'F06.7', seit: '2025' },
      { text: 'Arterielle Hypertonie', icd: 'I10.90', seit: '2002' },
    ],
    medikation: [
      { id: 'mp-mischinsulin', wirkstoff: 'Mischinsulin 30/70', staerke: '14 IE', form: 's. c.', schema: '1-0-0-0', zuletzt: 'heute 07:15', hinweis: 'Vor dem Frühstück. Frühstück heute kaum gegessen.' },
      { id: 'mp-normalinsulin', wirkstoff: 'Normalinsulin', staerke: '6 IE', form: 's. c.', schema: '0-1-0-0', massnahme: 'insulin-sc', zuletzt: 'gestern 11:45', hinweis: 'Um 11:45 vor dem Mittagessen. Nur nach BZ-Messung.' },
      { id: 'mp-amlodipin', wirkstoff: 'Amlodipin', staerke: '5 mg', form: 'Tbl.', schema: '1-0-0-0', massnahme: 'tabletten-wie-geplant-geben', zuletzt: 'heute 08:00' },
    ],
    vorwerte: [
      { zeit: 'gestern 07:10', vorH: 28, werte: { bz: 142 }, kuerzel: 'JS' },
      { zeit: 'gestern 11:40', vorH: 23.5, werte: { bz: 96 }, kuerzel: 'JS' },
      { zeit: 'gestern 17:30', vorH: 17.6, werte: { bz: 188, rrSys: 138, rrDia: 80, hf: 76 }, kuerzel: 'MK' },
      { zeit: 'heute 07:10', vorH: 4, werte: { bz: 131 }, kuerzel: 'ND' },
    ],
    pflegebericht: [
      { zeit: 'vorgestern 08:00', wer: 'JS', text: 'Frühstück abgelehnt: „So früh krieg ich nichts runter.“ Um 10 Uhr Kekse aus der Nachttischschublade gegessen.' },
      { zeit: 'gestern 11:30', wer: 'JS', text: 'Vor dem Mittagessen zittrig, BZ 96. Mittagessen gut gegessen.' },
      { zeit: 'heute 07:30', wer: 'FD', text: 'Insulin 07:15 gegeben. Frühstück stehen gelassen, nur Kaffee schwarz. Kekse in der Schublade sind aufgebraucht.' },
    ],
    aerztlicheAnordnungen: [
      { zeit: 'vor 3 Wochen', wer: 'Dr. Okafor', text: 'Mischinsulin 30/70 14 IE vor dem Frühstück, Normalinsulin 6 IE vor dem Mittagessen. BZ vor jeder Insulingabe. Unterzucker unter 70 mg/dl: 20 g Traubenzucker nach Haus-SOP, danach Rücksprache.' },
    ],
    assessments: [
      { name: 'MNA-SF', wert: '10 Punkte (Risiko für Mangelernährung)', datum: 'vor 3 Wochen' },
      { name: 'Sturzrisiko', wert: 'erhöht', datum: 'vor 3 Wochen', hinweis: 'Rollator, Unterzucker möglich.' },
    ],
    labor: [
      { name: 'HbA1c', wert: '6,4', einheit: '%', norm: 'Ziel im Alter 7–8 %', datum: 'vor 4 Wochen (Hausarzt)', auffaellig: true },
      { name: 'Kreatinin', wert: '1,3', einheit: 'mg/dl', norm: '0,5–1,0', datum: 'vor 4 Wochen (Hausarzt)', auffaellig: true },
    ],
    pflegeplanung: [
      { problem: 'Gefahr von Unterzucker bei Insulintherapie', ziel: 'BZ zwischen 100 und 200 mg/dl', massnahmen: ['BZ vor jeder Insulingabe', 'Mahlzeiten sichern', 'Traubenzucker im Nachttisch'] },
    ],
    rechtliches: [
      'Vorsorgevollmacht (Gesundheitssorge): Tochter Karin Winter. Auskunft an die Tochter erlaubt.',
      'Keine Einwilligung zur Auskunft an andere Bewohnende oder Bekannte.',
    ],
  },

  befunde: [
    { massnahme: 'vorstellen-einverstaendnis', varianten: [{ text: 'Sie hält sich an der Bettkante fest und schaut dich an: „Mir ist so komisch, so zittrig.“' }] },
    { massnahme: 'ansprechen-orientierung', varianten: [
      { wenn: BZ_GUT, text: 'Sie weiß, wo sie ist und welcher Tag ist. „Jetzt geht’s wieder.“' },
      { text: 'Sie weiß, dass sie im Heim ist, fragt aber zweimal, ob schon Mittag ist. Spricht hastig.' },
    ] },
    { massnahme: 'bewusstsein-avpu', varianten: [{ text: 'Wach, reagiert auf Ansprache, etwas verlangsamt.' }] },
    { massnahme: 'haut-beobachten', varianten: [
      { wenn: BZ_GUT, text: 'Haut wieder trocken, Gesichtsfarbe rosiger.' },
      { text: 'Blass, Stirn und Hände kaltschweißig, feines Zittern der Hände.' },
    ] },
    { massnahme: 'schlucken-pruefen', varianten: [{ text: 'Sie schluckt Speichel sicher und trinkt einen kleinen Schluck Wasser ohne Husten. Orale Gabe ist möglich.' }] },
    { massnahme: 'spritzstellen-pruefen', varianten: [{ text: 'Bauchhaut: Spritzstellen wechseln gut, keine Verhärtungen.' }] },
    { massnahme: 'bz-messen', varianten: [{ text: 'BZ {bz} mg/dl.', zeigt: ['bz'] }] },
    { massnahme: 'puls-zaehlen', varianten: [{ text: 'Puls {hf}/min, regelmäßig.', zeigt: ['hf'] }] },
    { massnahme: 'rr-messen', varianten: [{ text: 'RR {rrSys}/{rrDia} mmHg.', zeigt: ['rrSys', 'rrDia'] }] },
    { massnahme: 'temperatur-ohr', varianten: [{ text: '{temp} °C.', zeigt: ['temp'] }] },
    { massnahme: 'kurve-lesen', varianten: [{ text: 'Mischinsulin 14 IE um 07:15. Frühstück nicht gegessen. Für 11:45 Normalinsulin 6 IE geplant. Haus-SOP: unter 70 mg/dl 20 g Traubenzucker, nach 15 Min. nachmessen, dann Mahlzeit, Rücksprache. Pflegebericht: frühstückt seit Tagen nicht, isst sonst um 10 Uhr Kekse.' }] },
    { massnahme: 'glukose-oral', varianten: [{ text: 'Sie sitzt aufrecht und kaut vier Plättchen Traubenzucker, danach einen Schluck Wasser.' }] },
    { massnahme: 'kohlenhydrate-langsam', varianten: [{ text: 'Sie isst das halbe Brötchen mit Honig und trinkt die Milch. „Das ist mein Frühstück, so wie früher im Laden.“' }] },
    { massnahme: 'gabe-zurueckstellen', varianten: [{ text: 'Du legst den Insulinpen zurück und markierst im Plan: „Mittagsinsulin zurückgestellt wegen Unterzucker, Rücksprache Hausarzt.“' }] },
    { massnahme: 'insulin-sc', varianten: [{ text: 'Du spritzt 6 IE Normalinsulin in die Bauchhaut.' }] },
  ],

  gespraech: [
    { id: 'g-fruehstueck', frage: 'Fragen, wann und was sie früher gefrühstückt hat', an: 'patient', kompetenzbereiche: ['I', 'II'],
      antwort: [{ text: '„Um halb acht krieg ich nichts runter, das war nie so. Im Laden hab ich um neun gefrühstückt, Kaffee mit Milch und ein Brötchen mit Honig. Euer Schwarzbrot mag ich nicht.“', setzt: ['gewohnheit-bekannt'] }],
      wirkung: [{ groesse: 'angst', delta: -0.1, beginnSek: 0, spitzeSek: 60, dauerSek: 'dauerhaft' }],
      fakten: ['frühstückt seit jeher um 9 Uhr', 'Brötchen mit Honig, Kaffee mit Milch', 'mag kein Schwarzbrot'] },
    { id: 'g-tochter', frage: 'Tochter Karin (Vorsorgevollmacht) anrufen: Unterzucker, was getan wurde, Frühstückszeiten', an: 'angehoerige', kanal: 'telefon', kompetenzbereiche: ['II'],
      antwort: [{ text: '„Ach, das mit dem Frühstück hätte ich Ihnen sagen sollen. Zu Hause hat sie um neun gegessen. Ich bringe morgen Honig mit. Danke, dass Sie anrufen.“', setzt: ['tochter-informiert'] }],
      fakten: ['Tochter hat Vorsorgevollmacht'] },
    { id: 'g-graf-auskunft', frage: 'Frau Graf erzählen, dass Frau Winter einen Unterzucker hatte', an: 'angehoerige', nurWenn: { ab: 900 }, kompetenzbereiche: ['II', 'IV'],
      schweigepflicht: { erlaubtWenn: { flag: 'graf-auskunftsberechtigt' },
        fehlerText: 'Frau Graf ist Mitbewohnerin, keine Bevollmächtigte. Diagnosen und Vorfälle gehören nicht in Gespräche mit anderen Bewohnenden, auch wenn sie es gut meinen.' },
      antwort: [{ text: '„Ach Gott, Zucker! Das sag ich gleich beim Essen den anderen, damit sie aufpassen.“' }] },
    { id: 'g-graf-verweisen', frage: 'Frau Graf freundlich danken und sagen, dass es Frau Winter besser geht, ohne Einzelheiten', an: 'angehoerige', nurWenn: { ab: 900 }, kompetenzbereiche: ['II', 'IV'],
      antwort: [{ text: '„Na, dann ist ja gut. Ich hab mir Sorgen gemacht, sie hat so gezittert.“', setzt: ['graf-verwiesen'] }] },
  ],

  sbar: [
    { id: 's-winter', teil: 'S', text: 'Frau Winter, 83, Diabetes mit Insulin: seit einer halben Stunde unruhig, zittrig, kaltschweißig.', art: 'kern' },
    { id: 's-eingewoehnt', teil: 'S', text: 'Frau Winter ist noch nicht eingewöhnt und klingelt dauernd.', art: 'ablenker' },
    { id: 'b-insulin', teil: 'B', text: 'Um 07:15 Mischinsulin 14 IE, Frühstück nicht gegessen. Um 11:45 sind 6 IE Normalinsulin geplant.', art: 'kern', bekanntWenn: { getan: 'kurve-lesen' } },
    { id: 'b-baeckerin', teil: 'B', text: 'Sie war früher Bäckereiverkäuferin.', art: 'ablenker' },
    { id: 'a-zeichen', teil: 'A', text: 'Unterzucker-Zeichen: blass, kaltschweißig, Zittern, unruhig. Wach, schluckt sicher.', art: 'kern', bekanntWenn: { eine: [{ getan: 'haut-beobachten' }, { getan: 'schlucken-pruefen' }] } },
    { id: 'a-behandelt', teil: 'A', text: '20 g Traubenzucker im Sitzen gegeben.', art: 'kern', bekanntWenn: ZUCKER_GEGEBEN },
    { id: 'a-fruehstueck', teil: 'A', text: 'Sie frühstückt seit Tagen nicht, weil sie gewohnt ist, erst um 9 Uhr zu essen.', art: 'hilfreich', bekanntWenn: { flag: 'gewohnheit-bekannt' } },
    { id: 'a-eingewoehnung', teil: 'A', text: 'Das ist die Eingewöhnung, sie ist psychisch unruhig.', art: 'falsch' },
    { id: 'r-insulin', teil: 'R', text: 'Mittagsinsulin habe ich zurückgestellt. Wie soll ich heute mit dem Insulin verfahren? Bitte das Schema an ihre Essenszeiten anpassen.', art: 'kern' },
  ],

  anordnungen: [
    { id: 'an-plan', massnahme: 'tabletten-wie-geplant-geben', text: 'Medikamente laut Plan.' },
    { id: 'an-insulin-mittag', massnahme: 'insulin-sc', text: 'Normalinsulin 6 IE vor dem Mittagessen wie geplant spritzen.',
      fehlerhaft: {
        warum: 'Sie hatte eben einen Unterzucker, der Zucker ist noch nicht stabil, und ob sie das Mittagessen ganz isst, ist unsicher. Normalinsulin kann den nächsten Unterzucker auslösen. Bei BZ unter 70 vor dem Essen gilt: Rücksprache, Dosis anpassen oder weglassen.',
        korrektur: 'Stimmt, da haben Sie recht. Mittagsinsulin heute weglassen, BZ vor dem Abendessen und um 22 Uhr messen. Ich passe morgen das Schema an.',
        ersatz: 'an-insulin-pause',
      } },
    { id: 'an-insulin-pause', massnahme: 'gabe-zurueckstellen', text: 'Mittagsinsulin heute weglassen. BZ vor dem Abendessen und um 22 Uhr. Schema wird morgen an die Essenszeiten angepasst.' },
    { id: 'an-mahlzeit', massnahme: 'kohlenhydrate-langsam', text: 'Nach dem Traubenzucker langsam wirksame Kohlenhydrate, dann Mittagessen.' },
  ],

  arzt: {
    name: 'Hausarzt Dr. Okafor',
    erreichbar: 'hausarzt-praxis',
    regeln: [
      REGEL_VOLL,
      { id: 'r-ohne-insulin', wenn: { gemeldet: ['a-zeichen', 'wert:bz', 'a-behandelt'] },
        antwort: '„Gut reagiert. Bevor ich etwas zum Mittag sage:“',
        rueckfrage: { text: '„Wann und wie viel Insulin hat sie heute bekommen, und was ist für mittags geplant?“', erwartet: ['b-insulin'], auftrag: 'af-plan' } },
      { id: 'r-bz-frage', wenn: { gemeldet: ['a-zeichen'] },
        antwort: '„Das klingt nach einem Unterzucker.“',
        rueckfrage: { text: '„Wie hoch ist der Zucker? Messen Sie bitte sofort und geben Sie nach SOP Traubenzucker, wenn sie sicher schluckt.“', erwartet: ['wert:bz', 'a-behandelt'], auftrag: 'af-bz' } },
      { wenn: { gemeldet: ['a-eingewoehnung'] }, antwort: '„Dann lassen Sie sie zur Ruhe kommen. Ich schaue am Donnerstag nach ihr.“', setzt: ['arzt-beruhigt'] },
      { wenn: { gemeldet: ['s-winter'] }, antwort: '„Zittrig und kaltschweißig unter Insulin? Messen Sie den Zucker und melden Sie sich mit dem Wert.“' },
    ],
    auftraege: [
      { id: 'af-bz', text: 'Blutzucker messen, nach SOP Traubenzucker geben und dem Hausarzt melden', erledigt: { alle: [{ getan: 'bz-messen' }, ZUCKER_GEGEBEN] },
        meldung: ['wert:bz', 'a-behandelt'], meldenBinnenSek: 600, folge: [REGEL_VOLL,
          { wenn: { ab: 0 }, antwort: '„Gut.“', rueckfrage: { text: '„Wann hat sie heute Insulin bekommen, und was ist für mittags geplant?“', erwartet: ['b-insulin'], auftrag: 'af-plan' } }] },
      { id: 'af-plan', text: 'Insulinplan nachlesen und dem Hausarzt schicken', erledigt: { getan: 'kurve-lesen' }, meldung: ['b-insulin'], meldenBinnenSek: 600, folge: [REGEL_VOLL] },
      { id: 'af-bz15', text: 'Eine Viertelstunde nach dem Traubenzucker den Blutzucker nachmessen und dem Hausarzt schicken', erledigt: { getan: 'bz-messen' },
        meldung: ['wert:bz'], meldenBinnenSek: 1500,
        folge: [
          { wenn: BZ_GUT, antwort: '„Sehr gut. Jetzt Mittagessen, und vor dem Abendessen noch einmal messen.“', setzt: ['bz-rueckmeldung'] },
          { wenn: { ab: 0 }, antwort: '„Noch zu niedrig. Noch einmal 20 g Traubenzucker, dann Brot oder Brötchen, in einer Viertelstunde wieder messen und melden.“', setzt: ['bz-rueckmeldung'] },
        ] },
    ],
  },

  ereignisse: [
    { id: 'e-kollegin', art: 'team', wann: { ab: 240 },
      text: 'Kollegin Jana steckt den Kopf herein, den Insulinpen in der Hand: „Soll ich ihr schon mal das Mittagsinsulin spritzen? Steht ja für Viertel vor zwölf im Plan.“',
      entscheidung: [
        { id: 'w-zurueck', text: '„Nein, bitte zurückstellen. Sie hat einen Unterzucker, ich kläre das mit dem Hausarzt.“', wertung: 'gut', warum: 'Bei Unterzucker verstärkt Insulin die Gefahr. Eine Abweichung vom Plan wird begründet, dokumentiert und ärztlich abgestimmt.', setzt: ['kollegin-gestoppt'] },
        { id: 'w-spritzen', text: '„Ja, Plan ist Plan.“', wertung: 'gefaehrlich', warum: 'Ein Plan ersetzt keine aktuelle Einschätzung. Insulin bei Unterzucker kann zur Bewusstlosigkeit führen.', setzt: ['kollegin-spritzt'] },
        { id: 'w-egal', text: '„Mach, wie du denkst.“', wertung: 'falsch', warum: 'Unklare Absprachen verschieben Verantwortung. Im Team braucht es eine klare Ansage mit Rückmeldung (Closed Loop).' },
      ] },
    { id: 'e-kollegin-spritzt', art: 'komplikation', wann: { flag: 'kollegin-spritzt' },
      text: 'Jana hat 6 IE Normalinsulin gespritzt.', treiber: [{ art: 'insulin', ie: 6 }] },
    { id: 'e-eintruebung', art: 'komplikation', wann: { alle: [{ wert: 'blutzucker', vergleich: '<', grenze: 45 }, { nicht: ZUCKER_GEGEBEN }] },
      text: 'Frau Winter sackt im Bett zusammen und öffnet die Augen nur noch auf lautes Ansprechen. Jetzt nichts mehr in den Mund geben: Hilfe holen, Notruf nach SOP.',
      bild: { haltung: 'liegt', mimik: 'schlaefrig' } },
    { id: 'e-graf', art: 'angehoerige', wann: { ab: 900 },
      text: 'Frau Graf, die Bewohnerin von nebenan, steht in der Tür: „Was hat denn die Winter? Die hat so gezittert. Ist das was Schlimmes?“' },
  ],

  pa: {
    name: 'Praxisanleiterin Frau Yilmaz',
    hilfen: [
      { wenn: { nicht: BZ_BEKANNT }, impuls: 'Zittern, Schwitzen, Unruhe, Insulin am Morgen. Was willst du als Erstes wissen?', tipp: 'Blutzucker messen, das Gerät ist in der Pflegetasche.' },
      { wenn: { alle: [BZ_BEKANNT, { nicht: ZUCKER_GEGEBEN }] }, impuls: 'Was braucht sie jetzt, und was prüfst du vorher?', tipp: 'Wach und schluckt sicher? Dann 20 g Traubenzucker im Sitzen.' },
      { wenn: { alle: [ZUCKER_GEGEBEN, { nicht: { getan: 'kohlenhydrate-langsam' } }] }, impuls: 'Wie lange hält Traubenzucker vor?', tipp: 'Nur kurz. Danach langsame Kohlenhydrate, z. B. Brötchen und Milch.' },
      { wenn: { auftrag: 'af-plan', status: 'offen' }, impuls: 'Der Hausarzt wollte etwas über den Insulinplan wissen.', tipp: 'Lies in der Akte nach, wann wie viel gespritzt wurde und was mittags geplant ist.' },
      { wenn: { alle: [{ auftrag: 'af-bz15', status: 'offen' }, { nicht: { auftrag: 'af-bz15', status: 'gemeldet' } }] }, impuls: 'Hat der Hausarzt dir noch etwas aufgetragen?', tipp: 'Eine Viertelstunde nach dem Traubenzucker nachmessen und den Wert schicken.' },
      { wenn: { nicht: { flag: 'gewohnheit-bekannt' } }, impuls: 'Warum frühstückt sie eigentlich nicht?', tipp: 'Frag sie nach ihren Gewohnheiten von früher.' },
      { impuls: 'Wer muss jetzt noch Bescheid wissen?', tipp: 'Schichtleitung, Tochter mit Vollmacht, und alles in den Pflegebericht und die Planung.' },
    ],
  },
  team: { kollegin: 'Pflegefachfrau Jana (Schichtleitung)', weitere: { angehoerige: 'Tochter Karin Winter (Vorsorgevollmacht), Mitbewohnerin Frau Graf' } },

  bewertung: {
    pflicht: [
      { id: 'p-bz', text: 'Blutzucker sofort gemessen', gewicht: 3, kompetenzbereiche: ['I'], erfuellt: { getan: 'bz-messen', bis: 600 },
        warum: 'Unruhe, Zittern und Schwitzen unter Insulin sind Unterzucker, bis das Gegenteil gemessen ist.' },
      { id: 'p-schlucken', text: 'Vor der oralen Gabe Bewusstsein und Schlucken geprüft', gewicht: 2, kompetenzbereiche: ['I', 'V'], erfuellt: { eine: [{ getan: 'schlucken-pruefen' }, { getan: 'bewusstsein-avpu' }] },
        warum: 'Nur wer wach ist und sicher schluckt, darf etwas in den Mund bekommen (Aspiration).' },
      { id: 'p-zucker', text: 'Schnell wirksame Kohlenhydrate gegeben', gewicht: 3, kompetenzbereiche: ['I'], erfuellt: ZUCKER_GEGEBEN,
        warum: 'Je länger der Unterzucker dauert, desto größer die Gefahr von Bewusstlosigkeit, Sturz und Krampf.' },
      { id: 'p-langsam', text: 'Danach langsam wirksame Kohlenhydrate', gewicht: 2, kompetenzbereiche: ['I', 'V'], erfuellt: { getan: 'kohlenhydrate-langsam' },
        warum: 'Traubenzucker wirkt nur kurz; das Mischinsulin wirkt noch Stunden.' },
      { id: 'p-zurueck', text: 'Mittagsinsulin zurückgestellt', gewicht: 3, kompetenzbereiche: ['I', 'III'], erfuellt: { eine: [{ getan: 'gabe-zurueckstellen' }, { flag: 'kollegin-gestoppt' }] },
        warum: 'Insulin bei Unterzucker ist eine gefährliche Fehlhandlung.' },
      { id: 'p-arzt', text: 'Hausarzt mit Zeichen, BZ, Behandlung und Insulinplan informiert', gewicht: 3, kompetenzbereiche: ['II', 'III'], erfuellt: { flag: 'arzt-informiert' },
        warum: 'Der Hausarzt muss das Schema anpassen; dazu braucht er Wert, Behandlung und Insulinzeiten.' },
      { id: 'p-remonstration', text: 'Anordnung „Mittagsinsulin wie geplant“ hinterfragt', gewicht: 3, kompetenzbereiche: ['III', 'IV'], erfuellt: { flag: 'remonstriert:an-insulin-mittag' },
        warum: 'Wer ausführt, trägt Durchführungsverantwortung. Eine Anordnung, die einen erneuten Unterzucker auslösen kann, wird nachgefragt.' },
      { id: 'p-rueckauftrag', text: 'BZ-Kontrolle nach 15 Minuten gemessen und gemeldet', gewicht: 2, kompetenzbereiche: ['I', 'II'], erfuellt: { auftrag: 'af-bz15', status: 'gemeldet' },
        warum: 'Nur die Nachmessung zeigt, ob die Behandlung reicht (Closed Loop).' },
      { id: 'p-gewohnheit', text: 'Gewohnheiten erfragt (Frühstückszeit, Vorlieben)', gewicht: 2, kompetenzbereiche: ['I', 'II'], erfuellt: { flag: 'gewohnheit-bekannt' },
        warum: 'Die Ursache liegt in ihrer Lebenswelt: Die Heim-Essenszeiten passen nicht zu ihrem Rhythmus.' },
      { id: 'p-tochter', text: 'Tochter (Vorsorgevollmacht) informiert', gewicht: 1, kompetenzbereiche: ['II'], erfuellt: { eine: [{ flag: 'tochter-informiert' }, { getan: 'tochter-informieren' }] },
        warum: 'Die Bevollmächtigte entscheidet mit und kennt die Gewohnheiten.' },
      { id: 'p-graf', text: 'Mitbewohnerin ohne Einzelheiten beruhigt (Schweigepflicht)', gewicht: 1, kompetenzbereiche: ['II', 'IV'], erfuellt: { flag: 'graf-verwiesen' },
        warum: 'Auch Mitbewohnende erhalten keine Gesundheitsinformationen; freundlich und ohne Details antworten.' },
      { id: 'p-doku', text: 'Pflegebericht mit BZ-Werten und hinterfragter Anordnung', gewicht: 1, kompetenzbereiche: ['I', 'IV'],
        erfuellt: { alle: [{ getan: 'pflegebericht' }, { dokumentiert: 'wert:bz' }, { dokumentiert: 'anordnung:an-insulin-mittag' }] },
        warum: 'Unterzucker, Behandlung, Werte und die Abweichung vom Insulinplan müssen nachvollziehbar sein.' },
    ],
    fehler: [
      { id: 'f-insulin', text: 'Insulin bei Unterzucker gespritzt', schwere: 'schwer', kompetenzbereiche: ['I', 'III'], wenn: { eine: [{ getan: 'insulin-sc' }, { flag: 'kollegin-spritzt' }] },
        warum: 'Insulin senkt den Zucker weiter und kann zur Bewusstlosigkeit führen.' },
      { id: 'f-eingewoehnung', text: 'Zeichen als „Eingewöhnung“ abgetan', schwere: 'mittel', kompetenzbereiche: ['I', 'II'], wenn: { flag: 'arzt-beruhigt' },
        warum: 'Neue Unruhe mit Schwitzen und Zittern hat eine körperliche Ursache, bis das Gegenteil gezeigt ist.' },
      { id: 'f-112', text: 'Rettungsdienst gerufen, obwohl sie wach ist und schlucken kann', schwere: 'leicht', kompetenzbereiche: ['III'],
        wenn: { alle: [{ getan: 'notruf-112' }, { nicht: { wert: 'vigilanz', vergleich: '<', grenze: 0.6 } }] },
        warum: 'Eine wache Person mit Unterzucker wird nach SOP mit Traubenzucker behandelt. Notruf, wenn sie nicht mehr schlucken kann.' },
    ],
    ende: [
      { wenn: { alle: [{ flag: 'arzt-informiert' }, { getan: 'kohlenhydrate-langsam' }, { getan: 'pflegebericht' }, { flag: 'bz-rueckmeldung' }] },
        text: 'Frau Winter sitzt mit Brötchen und Milch am Tisch und erzählt von der Bäckerei. Das Mittagsinsulin bleibt heute weg, der Hausarzt passt morgen das Schema an.', ausgang: 'stabil' },
      { wenn: { wert: 'vigilanz', vergleich: '<', grenze: 0.35 }, text: 'Frau Winter ist nicht mehr erweckbar. Der Notarzt ist unterwegs.', ausgang: 'verschlechtert' },
      { wenn: { ab: 2700 }, text: 'Die Mittagszeit ist vorbei. Frau Winter ist erschöpft und verwirrt.', ausgang: 'verschlechtert' },
    ],
  },

  pflegebedarf: {
    probleme: [
      { id: 'pb-hypo', text: 'Gefahr erneuter Unterzuckerung bei Insulintherapie', richtig: true, prioritaet: 1, warum: 'Mischinsulin wirkt weiter, Mahlzeiten unsicher.' },
      { id: 'pb-gewohnheit', text: 'Essenszeiten im Heim passen nicht zu ihren Gewohnheiten', richtig: true, prioritaet: 1, warum: 'Frühstückt seit jeher um 9 Uhr und lässt das frühe Frühstück stehen.' },
      { id: 'pb-sturz', text: 'Sturzgefahr bei Unterzucker und Rollator', richtig: true, prioritaet: 2, warum: 'Zittern, Schwindel, Unruhe.' },
      { id: 'pb-eingewoehnung', text: 'Anpassungsstörung mit Unruhe', richtig: false, warum: 'Die Unruhe hatte eine körperliche Ursache.' },
    ],
    ziele: [
      { id: 'z-bz', text: 'Frau Winters Blutzucker liegt vor den Mahlzeiten zwischen 100 und 200 mg/dl.', passtZu: ['pb-hypo'], richtig: true },
      { id: 'z-fruehstueck', text: 'Frau Winter frühstückt täglich gegen 9 Uhr, was sie mag; das Insulin ist darauf abgestimmt.', passtZu: ['pb-gewohnheit', 'pb-hypo'], richtig: true },
      { id: 'z-sturz', text: 'Frau Winter stürzt nicht.', passtZu: ['pb-sturz'], richtig: true },
      { id: 'z-anpassen', text: 'Frau Winter hält sich an die Essenszeiten des Hauses.', passtZu: ['pb-gewohnheit'], richtig: false },
    ],
  },

  leitfaden: [
    { titel: 'Unterzucker erkennen', text: 'Zittern, Schwitzen, Blässe, Herzklopfen, Heißhunger, Unruhe, Verwirrtheit. Im Alter oft untypisch („komisch“, verwirrt, gereizt). Bei Insulin oder Sulfonylharnstoffen immer zuerst den Blutzucker messen. Unter 70 mg/dl gilt als Unterzucker.', quellen: ['nvl-diabetes', 'ddg-alter'] },
    { titel: 'Handeln nach SOP', text: 'Wach und schluckt sicher: 15–20 g schnell wirksame Kohlenhydrate (Traubenzucker, Saft) im Sitzen, nach 15 Minuten nachmessen, danach langsam wirksame Kohlenhydrate. Nicht mehr sicher wach: nichts in den Mund, Seitenlage, Notruf, ärztliche Hilfe (Glukose i. v., Glukagon). Geplantes Insulin zurückstellen und Rücksprache halten.', quellen: ['nvl-diabetes'] },
    { titel: 'Lebenswelt und Gewohnheiten', text: 'Wer jahrzehntelang um 9 Uhr gefrühstückt hat, isst um 7:30 nichts. Biografie und Gewohnheiten gehören in die Pflegeplanung; Insulin und Mahlzeiten werden an den Menschen angepasst, nicht umgekehrt.', quellen: ['dnqp-ernaehrung'] },
    { titel: 'Schweigepflicht im Heim', text: 'Auskunft nur an Bevollmächtigte, Betreuer oder mit Einwilligung. Mitbewohnende dürfen hören, dass es jemandem besser geht, aber keine Diagnose oder Einzelheiten.', quellen: ['stgb-203'] },
  ],

  pruefwege: {
    muster: [
      { art: 'massnahme', id: 'vorstellen-einverstaendnis' },
      { art: 'pflegetasche', geraet: 'bz-geraet' },
      { art: 'massnahme', id: 'bz-messen' },
      { art: 'massnahme', id: 'bewusstsein-avpu' },
      { art: 'massnahme', id: 'schlucken-pruefen' },
      { art: 'massnahme', id: 'glukose-oral' },
      { art: 'massnahme', id: 'haut-beobachten' },
      { art: 'massnahme', id: 'gabe-zurueckstellen' },
      { art: 'massnahme', id: 'kurve-lesen' },
      { art: 'nachricht', an: 'aerztin', kanal: 'telefon', bausteine: ['s-winter', 'b-insulin', 'a-zeichen', 'wert:bz', 'a-behandelt', 'r-insulin'] },
      { art: 'remonstrieren', anordnung: 'an-insulin-mittag', grund: 'Sie hatte gerade einen Unterzucker, und ob sie das Mittagessen schafft, ist unsicher. Soll das Mittagsinsulin heute nicht besser wegfallen?' },
      { art: 'rueckmelden', anordnung: 'an-insulin-pause', rueckgelesen: true },
      { art: 'rueckmelden', anordnung: 'an-mahlzeit', rueckgelesen: true },
      { art: 'auflegen', an: 'aerztin' },
      { art: 'frage', id: 'g-fruehstueck' },
      { art: 'massnahme', id: 'kohlenhydrate-langsam' },
      { art: 'warten', sek: 600 },
      { art: 'massnahme', id: 'bz-messen' },
      { art: 'nachricht', an: 'aerztin', kanal: 'messenger', bausteine: ['wert:bz'] },
      { art: 'frage', id: 'g-tochter' },
      { art: 'warten', sek: 120 },
      { art: 'frage', id: 'g-graf-verweisen' },
      { art: 'massnahme', id: 'pflegeplanung-anpassen' },
      { art: 'dokumentieren', bausteine: ['wert:bz', 'a-zeichen', 'a-behandelt', 'anordnung:an-insulin-mittag', 'anordnung:an-insulin-pause'] },
      { art: 'warten', sek: 120 },
      { art: 'abschluss', probleme: ['pb-hypo', 'pb-gewohnheit', 'pb-sturz'], ziele: ['z-bz', 'z-fruehstueck', 'z-sturz'],
        sbar: ['s-winter', 'b-insulin', 'a-zeichen', 'a-behandelt'] },
    ],
    unterlassung: { bisSek: 1500, erwartet: { wert: 'blutzucker', vergleich: '<', grenze: 50 } },
    grenze: { rolle: 1, events: [{ art: 'massnahme', id: 'insulin-sc' }], erwartet: 'pa-eingriff' },
  },
};
