// Übungsfälle für den Pflegebericht-Trainer. Alle Personen und Angaben sind frei erfunden.
//
// Zwei Aufgabenarten:
// - 'umschreiben': Ein wertender, ungenauer Eintrag liegt vor und wird sachlich neu geschrieben.
// - 'schreiben': Aus einer beobachteten Situation entsteht ein neuer Eintrag.
// Muster für die Prüfung per Code wie im Übergabe-Trainer (siehe ../uebergabe/faelle.ts).

export type Art = 'umschreiben' | 'schreiben';
export type Bereich = 'langzeit' | 'akut' | 'ambulant';
/** Bausteine eines guten Eintrags (Reihenfolge = Anzeige). */
export type Baustein = 'zeit' | 'beobachtung' | 'aussage' | 'massnahme' | 'wirkung' | 'weitergabe';

export const BAUSTEINE: Baustein[] = ['zeit', 'beobachtung', 'aussage', 'massnahme', 'wirkung', 'weitergabe'];
export const BAUSTEIN_LABEL: Record<Baustein, string> = {
  zeit: 'Wann', beobachtung: 'Was du beobachtet oder gemessen hast', aussage: 'Was die Person sagt',
  massnahme: 'Was du getan hast', wirkung: 'Wie die Person reagiert hat', weitergabe: 'Wen du informiert hast',
};
export const BAUSTEIN_KURZ: Record<Baustein, string> = {
  zeit: 'Zeit', beobachtung: 'Beobachtung', aussage: 'Aussage', massnahme: 'Maßnahme', wirkung: 'Wirkung', weitergabe: 'Weitergabe',
};
export const BEREICH_LABEL: Record<Bereich, string> = { langzeit: 'Pflegeheim', akut: 'Krankenhaus', ambulant: 'Ambulant' };

export interface Kernpunkt {
  id: string;
  baustein: Baustein;
  text: string;
  muster: string[];
  pflicht: boolean;
}

export interface BerichtFall {
  id: string;
  titel: string;
  art: Art;
  bereich: Bereich;
  person: string;
  szene: string[];        // was geschehen ist, in der Reihenfolge
  vorlage?: string;       // nur bei 'umschreiben': der schlechte Eintrag
  kernpunkte: Kernpunkt[];
  muster: string;         // Beispiel-Eintrag, erfüllt alle Kernpunkte
}

export const BERICHT_FAELLE: BerichtFall[] = [
  {
    id: 'nacht',
    titel: 'Unruhige Nacht',
    art: 'umschreiben',
    bereich: 'langzeit',
    person: 'Erna Kaiser, 79 Jahre, Demenz vom Alzheimer-Typ',
    vorlage: 'Frau K. war die ganze Nacht wieder total unruhig und aggressiv, hat wie immer nicht geschlafen. Uneinsichtig, wollte ständig raus.',
    szene: [
      'Um 2:15 Uhr steht Frau Kaiser im Nachthemd an der Ausgangstür des Wohnbereichs und rüttelt an der Klinke.',
      'Sie sagt: „Ich muss zu meiner Mutter, die wartet auf mich.“ Als du ihren Arm nimmst, schiebt sie deine Hand weg und ruft laut „Lass mich!“.',
      'Du gehst neben ihr her in die Wohnküche, bietest warme Milch an und fragst nach ihrer Mutter. Sie erzählt von der Bäckerei der Eltern.',
      'Um 2:40 Uhr hat sie die Milch getrunken und geht mit dir ins Zimmer. Beim Kontrollgang um 3:10 Uhr schläft sie.',
    ],
    kernpunkte: [
      { id: 'zeit', baustein: 'zeit', pflicht: true, text: 'Uhrzeit (2:15 Uhr)', muster: ['2:15', '2,15', '02:15', '2,15'] },
      { id: 'ort', baustein: 'beobachtung', pflicht: true, text: 'Stand an der Ausgangstür und rüttelte an der Klinke', muster: ['tuer', 'ausgang', 'klinke'] },
      { id: 'hand', baustein: 'beobachtung', pflicht: true, text: 'Schob die Hand weg und rief laut (statt „aggressiv“)', muster: ['hand weg', 'weggeschoben', 'schob', 'rief', 'laut'] },
      { id: 'mutter', baustein: 'aussage', pflicht: true, text: 'Aussage zur Mutter wörtlich', muster: ['mutter'] },
      { id: 'milch', baustein: 'massnahme', pflicht: true, text: 'Begleitung in die Küche, warme Milch, Gespräch über die Mutter', muster: ['milch', 'kueche', 'gespraech', 'begleitet'] },
      { id: 'schlaf', baustein: 'wirkung', pflicht: true, text: 'Ging ins Zimmer, schläft um 3:10 Uhr', muster: ['schlaeft', 'schlief', 'schlafend', 'geschlafen', 'eingeschlafen', '3:10', '3,10'] },
    ],
    muster: '2:15 Uhr: Frau Kaiser steht im Nachthemd an der Ausgangstür des Wohnbereichs und rüttelt an der Klinke. Sie sagt: „Ich muss zu meiner Mutter, die wartet auf mich.“ Beim Berühren am Arm schiebt sie meine Hand weg und ruft laut „Lass mich!“. Begleitet in die Wohnküche, warme Milch angeboten, Gespräch über ihre Mutter (Bäckerei der Eltern). 2:40 Uhr Milch getrunken, geht mit ins Zimmer. 3:10 Uhr beim Kontrollgang schlafend.',
  },
  {
    id: 'essen',
    titel: 'Mittagessen stehen gelassen',
    art: 'umschreiben',
    bereich: 'langzeit',
    person: 'Walter Brandt, 86 Jahre',
    vorlage: 'Herr B. hat mal wieder das Essen verweigert, ist halt stur. Isst schlecht.',
    szene: [
      'Beim Mittagessen um 12:30 Uhr isst Herr Brandt zwei Löffel Suppe und schiebt den Teller weg.',
      'Er sagt: „Das schmeckt nach nichts, und der Zahn tut weh.“ Dabei hält er sich die rechte Wange.',
      'Du bietest ihm einen Joghurt an. Er isst den ganzen Becher (150 g) und trinkt 200 ml Tee.',
      'Du informierst die Wohnbereichsleitung und bittest, einen Zahnarzttermin zu vereinbaren.',
    ],
    kernpunkte: [
      { id: 'zeit', baustein: 'zeit', pflicht: true, text: 'Uhrzeit oder Mahlzeit (12:30 Uhr, Mittagessen)', muster: ['12:30', '12,30', 'mittag'] },
      { id: 'menge', baustein: 'beobachtung', pflicht: true, text: 'Menge: zwei Löffel Suppe', muster: ['2 loeffel', 'zwei loeffel', 'loeffel'] },
      { id: 'wange', baustein: 'beobachtung', pflicht: true, text: 'Hält sich die rechte Wange', muster: ['wange'] },
      { id: 'zahn', baustein: 'aussage', pflicht: true, text: 'Aussage: schmeckt nach nichts, Zahn tut weh', muster: ['zahn'] },
      { id: 'joghurt', baustein: 'massnahme', pflicht: true, text: 'Joghurt angeboten', muster: ['joghurt'] },
      { id: 'gegessen', baustein: 'wirkung', pflicht: true, text: 'Ganzen Becher (150 g) gegessen, 200 ml getrunken', muster: ['150', 'ganzen becher', 'ganz gegessen', 'aufgegessen', '200 ml', '200'] },
      { id: 'info', baustein: 'weitergabe', pflicht: true, text: 'Wohnbereichsleitung informiert, Zahnarzttermin', muster: ['wohnbereichsleitung', 'wbl', 'zahnarzt'] },
    ],
    muster: '12:30 Uhr Mittagessen: Herr Brandt isst 2 Löffel Suppe und schiebt den Teller weg. Er sagt: „Das schmeckt nach nichts, und der Zahn tut weh.“ Hält sich dabei die rechte Wange. Joghurt angeboten, ganzen Becher (150 g) gegessen, 200 ml Tee getrunken. Wohnbereichsleitung informiert, sie vereinbart einen Zahnarzttermin.',
  },
  {
    id: 'sturz',
    titel: 'Im Bad gefunden',
    art: 'schreiben',
    bereich: 'langzeit',
    person: 'Heinz Mertens, 82 Jahre, geht mit Rollator',
    szene: [
      'Um 7:45 Uhr findest du Herrn Mertens im Bad auf dem Boden sitzend.',
      'Er sagt: „Ich bin ausgerutscht und auf den Po gefallen. Den Kopf habe ich mir nicht gestoßen.“',
      'Er ist wach und orientiert. Er gibt Schmerzen an der linken Hüfte an, Stärke 3 von 10. Du siehst keine Verletzung, beide Beine sind gleich lang und nicht nach außen gedreht. Blutdruck 135/80 mmHg, Puls 84/min.',
      'Mit einer Kollegin hilfst du ihm auf. Er geht mit dem Rollator zum Bett.',
      'Um 8:05 Uhr informierst du telefonisch den Hausarzt Dr. Weber und füllst das Sturzprotokoll aus. Ihr vereinbart eine Kontrolle in einer Stunde.',
    ],
    kernpunkte: [
      { id: 'zeit', baustein: 'zeit', pflicht: true, text: 'Uhrzeit (7:45 Uhr)', muster: ['7:45', '07:45', '7,45'] },
      { id: 'ort', baustein: 'beobachtung', pflicht: true, text: 'Im Bad auf dem Boden sitzend aufgefunden', muster: ['bad', 'boden'] },
      { id: 'zitat', baustein: 'aussage', pflicht: true, text: 'Eigene Schilderung: ausgerutscht, kein Kopfanprall', muster: ['ausgerutscht', 'kopf'] },
      { id: 'schmerz', baustein: 'beobachtung', pflicht: true, text: 'Schmerz linke Hüfte, NRS 3', muster: ['hueft'] },
      { id: 'befund', baustein: 'beobachtung', pflicht: false, text: 'Keine sichtbare Verletzung, Beine gleich lang, nicht außenrotiert', muster: ['verletzung', 'gleich lang', 'aussenrot', 'nach aussen'] },
      { id: 'vital', baustein: 'beobachtung', pflicht: true, text: 'Vitalzeichen (RR 135/80, Puls 84)', muster: ['135/80', '84'] },
      { id: 'orient', baustein: 'beobachtung', pflicht: false, text: 'Wach und orientiert', muster: ['orientiert', 'wach'] },
      { id: 'hilfe', baustein: 'massnahme', pflicht: true, text: 'Zu zweit aufgeholfen, Rollator', muster: ['aufgeholfen', 'aufhelfen', 'zu zweit', 'kollegin', 'rollator'] },
      { id: 'arzt', baustein: 'weitergabe', pflicht: true, text: 'Hausarzt Dr. Weber um 8:05 Uhr informiert', muster: ['weber', 'hausarzt', 'arzt'] },
      { id: 'protokoll', baustein: 'massnahme', pflicht: true, text: 'Sturzprotokoll, Kontrolle in 1 Stunde', muster: ['sturzprotokoll', 'protokoll', 'kontrolle'] },
    ],
    muster: '7:45 Uhr: Herr Mertens im Bad auf dem Boden sitzend vorgefunden. Er sagt: „Ich bin ausgerutscht und auf den Po gefallen. Den Kopf habe ich mir nicht gestoßen.“ Wach und orientiert, Schmerz linke Hüfte NRS 3, keine sichtbare Verletzung, Beine gleich lang, nicht außenrotiert. RR 135/80 mmHg, Puls 84/min. Mit Kollegin aufgeholfen, geht mit Rollator zum Bett. 8:05 Uhr Hausarzt Dr. Weber telefonisch informiert, Sturzprotokoll ausgefüllt, Kontrolle in 1 Stunde vereinbart.',
  },
  {
    id: 'schmerz',
    titel: 'Schmerzen bei der Mobilisation',
    art: 'schreiben',
    bereich: 'akut',
    person: 'Gisela Albers, 68 Jahre, 1. Tag nach Knie-TEP rechts',
    szene: [
      'Um 14:00 Uhr willst du Frau Albers an die Bettkante mobilisieren. Sie verzieht das Gesicht, stöhnt und sagt: „Das Knie tut so weh, das ist eine 7.“',
      'Nach ärztlicher Anordnung gibt es bei Bedarf Metamizol 1 g als Kurzinfusion. Du gibst es um 14:05 Uhr.',
      'Um 14:35 Uhr gibt sie Schmerzstärke 3 an. Die Mobilisation an die Bettkante gelingt, sie sitzt 10 Minuten.',
    ],
    kernpunkte: [
      { id: 'zeit', baustein: 'zeit', pflicht: true, text: 'Uhrzeit (14:00 Uhr)', muster: ['14:00', '14 uhr', '14,00'] },
      { id: 'mimik', baustein: 'beobachtung', pflicht: true, text: 'Verzieht das Gesicht, stöhnt', muster: ['gesicht', 'stoehnt', 'mimik'] },
      { id: 'nrs7', baustein: 'aussage', pflicht: true, text: 'Schmerzstärke 7 im rechten Knie (eigene Angabe)', muster: ['nrs 7', '7/10', '7 von 10', 'eine 7', 'staerke 7', 'schmerzstaerke 7', 'nrs: 7', 'nrs7'] },
      { id: 'medi', baustein: 'massnahme', pflicht: true, text: 'Metamizol 1 g i. v. nach Bedarfsanordnung um 14:05 Uhr', muster: ['metamizol'] },
      { id: 'nrs3', baustein: 'wirkung', pflicht: true, text: 'Nach 30 Minuten Schmerzstärke 3', muster: ['nrs 3', '3/10', '3 von 10', 'staerke 3', 'schmerzstaerke 3', 'nrs: 3', 'nrs3'] },
      { id: 'mobil', baustein: 'wirkung', pflicht: true, text: 'Mobilisation an die Bettkante gelungen, 10 Minuten', muster: ['bettkante', '10 min'] },
    ],
    muster: '14:00 Uhr: Bei der Mobilisation verzieht Frau Albers das Gesicht und stöhnt. Sie sagt: „Das Knie tut so weh, das ist eine 7.“ (rechtes Knie, NRS 7). 14:05 Uhr Metamizol 1 g als Kurzinfusion nach Bedarfsanordnung gegeben. 14:35 Uhr NRS 3, Mobilisation an die Bettkante gelingt, sitzt 10 Minuten.',
  },
  {
    id: 'wunde',
    titel: 'Verbandwechsel am Unterschenkel',
    art: 'umschreiben',
    bereich: 'ambulant',
    person: 'Ruth Becker, 74 Jahre, Ulcus cruris venosum rechts',
    vorlage: 'VW gemacht. Wunde sieht schlecht aus, eklig. Pat. jammert.',
    szene: [
      'Beim Hausbesuch um 10:00 Uhr machst du den Verbandwechsel am rechten Unterschenkel nach Wundplan.',
      'Die Wunde ist 3 × 2 cm groß, mit gelblichem Belag. Der Wundrand ist etwa 1 cm breit gerötet. Es riecht süßlich, das Exsudat ist mäßig.',
      'Frau Becker sagt beim Abnehmen des Verbandes: „Au, das brennt“ und gibt Schmerzstärke 4 an.',
      'Du fotografierst die Wunde für die Wunddokumentation und rufst die Wundexpertin des Pflegedienstes an. Sie kommt morgen mit.',
    ],
    kernpunkte: [
      { id: 'zeit', baustein: 'zeit', pflicht: true, text: 'Uhrzeit (10:00 Uhr)', muster: ['10:00', '10 uhr', '10,00'] },
      { id: 'groesse', baustein: 'beobachtung', pflicht: true, text: 'Größe 3 × 2 cm', muster: ['3 x 2', '3x2', '3 2 cm', '3 mal 2'] },
      { id: 'belag', baustein: 'beobachtung', pflicht: true, text: 'Gelblicher Belag', muster: ['belag', 'gelb'] },
      { id: 'rand', baustein: 'beobachtung', pflicht: true, text: 'Wundrand gerötet (1 cm)', muster: ['geroetet', 'roetung', 'rand'] },
      { id: 'geruch', baustein: 'beobachtung', pflicht: false, text: 'Süßlicher Geruch, mäßiges Exsudat', muster: ['geruch', 'riecht', 'exsudat', 'suesslich'] },
      { id: 'brennt', baustein: 'aussage', pflicht: true, text: 'Aussage „Au, das brennt“, Schmerzstärke 4', muster: ['brennt', 'nrs 4', '4/10', '4 von 10', 'staerke 4', 'schmerzstaerke 4', 'schmerz'] },
      { id: 'vw', baustein: 'massnahme', pflicht: true, text: 'Verbandwechsel nach Wundplan, Foto', muster: ['wundplan', 'foto', 'verbandwechsel'] },
      { id: 'expertin', baustein: 'weitergabe', pflicht: true, text: 'Wundexpertin informiert', muster: ['wundexpert', 'wundmanag', 'experti'] },
    ],
    muster: '10:00 Uhr Verbandwechsel rechter Unterschenkel nach Wundplan. Wunde 3 x 2 cm, gelblicher Belag, Wundrand ca. 1 cm gerötet, riecht süßlich, mäßig Exsudat. Frau Becker sagt beim Abnehmen des Verbandes: „Au, das brennt“, NRS 4. Foto für die Wunddokumentation gemacht. Wundexpertin telefonisch informiert, kommt morgen mit.',
  },
  {
    id: 'tochter',
    titel: 'Beschwerde der Tochter',
    art: 'umschreiben',
    bereich: 'langzeit',
    person: 'Margarete Lindner, 88 Jahre, Harninkontinenz',
    vorlage: 'Tochter wieder total nervig, hat sich beschwert und rumgemeckert. Mutter war angeblich nass.',
    szene: [
      'Um 16:20 Uhr kommt die Tochter von Frau Lindner ins Dienstzimmer und sagt laut: „Meine Mutter sitzt seit Stunden in nassen Sachen!“',
      'Du siehst nach: Die Einlage ist nass, die Kleidung ist trocken. Laut Plan war die letzte Versorgung um 13:30 Uhr.',
      'Um 16:30 Uhr wechselst du die Einlage. Danach sprichst du mit der Tochter. Ihr vereinbart, dass Frau Lindner wie im Plan alle 3 Stunden zur Toilette begleitet wird.',
      'Die Tochter sagt: „Gut, dass wir darüber gesprochen haben.“ Du gibst das Gespräch an die Wohnbereichsleitung weiter.',
    ],
    kernpunkte: [
      { id: 'zeit', baustein: 'zeit', pflicht: true, text: 'Uhrzeit (16:20 Uhr)', muster: ['16:20', '16,20'] },
      { id: 'zitat', baustein: 'aussage', pflicht: true, text: 'Anliegen der Tochter wörtlich oder sinngemäß', muster: ['nassen sachen', 'seit stunden', 'nass'] },
      { id: 'befund', baustein: 'beobachtung', pflicht: true, text: 'Einlage nass, Kleidung trocken', muster: ['einlage', 'kleidung trocken', 'trocken'] },
      { id: 'letzte', baustein: 'beobachtung', pflicht: false, text: 'Letzte Versorgung 13:30 Uhr', muster: ['13:30', '13,30'] },
      { id: 'wechsel', baustein: 'massnahme', pflicht: true, text: 'Einlage gewechselt, Gespräch mit der Tochter', muster: ['gewechselt', 'versorgt', 'wechsel', 'gespraech'] },
      { id: 'vereinbart', baustein: 'massnahme', pflicht: true, text: 'Vereinbart: Toilettengang alle 3 Stunden', muster: ['3 stunden', 'drei stunden', '3 h', 'alle 3', 'toilettengang'] },
      { id: 'reaktion', baustein: 'wirkung', pflicht: false, text: 'Tochter: „Gut, dass wir darüber gesprochen haben.“', muster: ['gut, dass', 'gut dass', 'gesprochen haben', 'zufrieden'] },
      { id: 'wbl', baustein: 'weitergabe', pflicht: true, text: 'Wohnbereichsleitung informiert', muster: ['wohnbereichsleitung', 'wbl', 'leitung'] },
    ],
    muster: '16:20 Uhr: Die Tochter von Frau Lindner sagt im Dienstzimmer: „Meine Mutter sitzt seit Stunden in nassen Sachen!“ Nachgesehen: Einlage nass, Kleidung trocken, letzte Versorgung laut Plan 13:30 Uhr. 16:30 Uhr Einlage gewechselt, Gespräch mit der Tochter. Vereinbart: Toilettengang alle 3 Stunden wie im Plan. Tochter: „Gut, dass wir darüber gesprochen haben.“ Wohnbereichsleitung informiert.',
  },
];
