// Wegweiser für Neue: was die Seiten zur Lernorganisation tun, wie sie zusammenhängen und was die Begriffe bedeuten.
// Nur Text und Pfade, kein React und keine DB: Die Seite „So lernst du hier“ und die kleinen Seitenhilfen lesen von hier.
// Zahlen zu „sicher“ kommen aus den echten Regeln (MASTERY_RULES), damit Erklärung und Rechnung nie auseinanderlaufen.

import { MASTERY_RULES } from '../lernplan/progress';

export const WEGWEISER_PFAD = '/lernen/wegweiser';

export interface Link { label: string; path: string }

/** Kurzhilfe je Seite: wozu sie da ist, wann man sie nimmt und wohin es danach geht. */
export interface SeitenInfo {
  path: string;
  name: string;
  /** Ein Satz: wozu die Seite da ist. */
  wozu: string;
  /** Wann man sie öffnet. */
  wann: string;
  /** Zwei bis drei Handgriffe auf der Seite. */
  soGehts: string[];
  /** Sinnvoller nächster Schritt. */
  weiter?: Link;
}

export const SEITEN: SeitenInfo[] = [
  {
    path: '/', name: 'Heute',
    wozu: 'Startpunkt jeden Tag: zeigt dir genau eine nächste Aufgabe und was sonst ansteht.',
    wann: 'Immer, wenn du die App öffnest und nicht weißt, womit du anfangen sollst.',
    soGehts: ['Oben steht die nächste Aufgabe aus deinem Lernplan. Tippe sie an und leg los.', 'Hinweise darunter melden fällige Fehler, Prüfungstermine und Sicherungen.'],
    weiter: { label: 'Lernplan öffnen', path: '/lernen/plan' },
  },
  {
    path: '/lernen/plan', name: 'Lernplan',
    wozu: 'Verteilt deine Themen auf die Tage bis zur Prüfung und holt sie zur Wiederholung zurück, bevor du sie vergisst.',
    wann: 'Zum Einrichten (Prüfungstermin, Lernzeit) und jeden Tag für die heutigen Einheiten.',
    soGehts: [
      'Unter „Prüfungen“ einen Termin mit Themen anlegen, unter „Lernzeit“ eintragen, wann du lernen kannst.',
      '„Heute“ zeigt die Einheiten: Erarbeiten (neu lernen), Abfrage (testen), Wiederholung.',
      '„Wissensstand“ zeigt je Thema, ob es offen, bearbeitet, unsicher oder sicher ist.',
    ],
    weiter: { label: 'Prüfung anlegen', path: '/lernen/plan?ansicht=pruefungen&neu=1' },
  },
  {
    path: '/lernen/ce', name: 'Curriculare Einheiten',
    wozu: 'Ordnet den Stoff so, wie er im Unterricht drankommt (CE 01 bis CE 11), mit einem geführten Lernpfad je Thema.',
    wann: 'Wenn in der Schule eine neue CE beginnt oder eine CE-Klausur ansteht.',
    soGehts: [
      'CE antippen: Du siehst ihre Themen, deinen Stand und den Lernpfad (Lesen, Karten, Steckbrief, Fall, Üben, Selbsttest).',
      'In der CE einen Klausurtermin eintragen: Der Lernplan übernimmt alle Themen der CE.',
    ],
    weiter: { label: 'Zur CE-Übersicht', path: '/lernen/ce' },
  },
  {
    path: '/lernen/themen', name: 'Themen',
    wozu: 'Die vollständige Liste aller Themen als Tabelle, zum Suchen, Filtern und Ändern mehrerer Themen auf einmal.',
    wann: 'Wenn du ein bestimmtes Thema suchst oder viele Themen gleichzeitig verschieben willst.',
    soGehts: ['Thema antippen öffnet die Themenseite mit allem Material.', 'Mehrere Zeilen auswählen und den Arbeitsstand gemeinsam ändern.'],
    weiter: { label: 'Themen als Board sehen', path: '/lernen/board' },
  },
  {
    path: '/lernen/board', name: 'Mein Themenboard',
    wozu: 'Deine Arbeitsliste: Welche Themen nimmst du dir vor, welche bearbeitest du gerade, welche hast du durchgearbeitet?',
    wann: 'Am Wochenanfang zum Planen und wenn du ein Thema fertig erarbeitet hast.',
    soGehts: [
      'Karten von „Themenpool“ nach „Diese Woche“ ziehen: Der Lernplan zieht diese Themen vor.',
      '„Erarbeitet“ heißt durchgearbeitet, nicht gekonnt. Ob du es kannst, zeigen erst Abfragen.',
    ],
    weiter: { label: 'Wissensstand ansehen', path: '/lernen/plan?ansicht=wissensstand' },
  },
  {
    path: '/lernen/landkarte', name: 'Themen-Landkarte',
    wozu: 'Zeigt, welche Themen aufeinander aufbauen, damit du in einer sinnvollen Reihenfolge lernst.',
    wann: 'Wenn du nicht weißt, welches Thema du als Nächstes nehmen sollst, oder ein Thema schwer fällt.',
    soGehts: ['Pfeile zeigen „erst das, dann das“. Die Farbe zeigt deinen Arbeitsstand.', '„Bereit“ heißt: Alle Voraussetzungen sind erarbeitet, du kannst gut einsteigen.'],
    weiter: { label: 'Themen auf dem Board planen', path: '/lernen/board' },
  },
  {
    path: '/lernen/karten', name: 'Karteikarten',
    wozu: 'Kurze Abfragen mit Wiederholung im richtigen Abstand: Karten, die du gut kannst, kommen seltener.',
    wann: 'Jeden Tag ein paar Minuten, am besten, wenn Karten fällig sind.',
    soGehts: ['Fällige Karten starten, Antwort überlegen, dann aufdecken und ehrlich bewerten.', 'Das Ergebnis zählt im Lernplan: Viele wackelige Karten machen ein Thema wieder „unsicher“.'],
    weiter: { label: 'Fehlerheft öffnen', path: '/lernen/fehler' },
  },
  {
    path: '/lernen/fortschritt', name: 'Fortschritt',
    wozu: 'Zeigt Lerntage, Wochenziele und deinen Wissensstand über alle Module, ehrlich gezählt.',
    wann: 'Am Wochenende für den Rückblick oder wenn du sehen willst, wo du je CE stehst.',
    soGehts: ['„Wochenrückblick“: Was hast du diese Woche geschafft?', '„CE & Kompetenzen“: Wo stehst du je CE und Kompetenzbereich?'],
    weiter: { label: 'Examen-Überblick', path: '/lernen/examen' },
  },
  {
    path: '/lernen/faecher', name: 'Fächer',
    wozu: 'Dein Wissensstand nach Wissensgebiet, zum Beispiel Anatomie oder Arzneimittellehre.',
    wann: 'Wenn du wissen willst, in welchem Fach du die meisten Lücken hast.',
    soGehts: ['Der Balken je Fach zeigt offen, bearbeitet, unsicher und sicher.'],
    weiter: { label: 'Passende Übungen', path: '/lernen/ueben?gruppe=fachwissen' },
  },
  {
    path: '/lernen/fehler', name: 'Fehlerheft',
    wozu: 'Sammelt automatisch alles, was du in Trainern, Simulationen und Fällen falsch beantwortet hast.',
    wann: 'Wenn Fehler fällig sind (Hinweis auf Heute), mindestens zweimal pro Woche.',
    soGehts: ['Fällige Fehler wiederholen. Behoben ist ein Fehler nach zwei richtigen Antworten an verschiedenen Tagen.', 'Das Fehlerheft zählt nicht als Abfrage im Lernplan, es trainiert nur Schwächen.'],
    weiter: { label: 'Prüfungssimulation', path: '/lernen/simulation' },
  },
  {
    path: '/lernen/simulation', name: 'Prüfungssimulation',
    wozu: 'Schriftliche Probeprüfung mit Zeitlimit aus allen Übungstrainern und deinem Material.',
    wann: 'Wenn eine Klausur oder das Examen näher rückt, ab etwa sechs Wochen vorher regelmäßig.',
    soGehts: ['Eine Vorlage wählen, zum Beispiel Kurztest oder Aufsichtsarbeit, bei Bedarf nach Kompetenzbereichen filtern und starten.', 'Das Ergebnis geht je Thema an den Lernplan, Fehler ins Fehlerheft.'],
    weiter: { label: 'Examen-Überblick', path: '/lernen/examen' },
  },
  {
    path: '/lernen/examen', name: 'Examen',
    wozu: 'Vorbereitung auf die staatliche Prüfung: Stärken und Baustellen je Kompetenzbereich, mündlich üben, praktische Prüfung planen.',
    wann: 'Im letzten Ausbildungsjahr, spätestens wenn die Prüfungstermine feststehen.',
    soGehts: [
      '„Überblick“: Schwächen-Radar je Kompetenzbereich und Prüfungsteil, mit Link zu den schwächsten Themen.',
      '„Fahrplan alle CE“: deine Phase bis zum Examen, ein Wochenpensum und je CE der nächste Schritt.',
      '„Mündlich üben“: Fälle laut beantworten. „Praktisch planen“: Etappen rückwärts vom Termin.',
    ],
    weiter: { label: 'Prüfungssimulation starten', path: '/lernen/simulation' },
  },
];

export function seitenInfo(path: string): SeitenInfo | undefined {
  return SEITEN.find((s) => s.path === path);
}

/** Der Lernkreislauf: vier Schritte, die sich bis zur Prüfung wiederholen. */
export const KREISLAUF: Array<{ titel: string; text: string; links: Link[] }> = [
  {
    titel: 'Planen',
    text: 'Trag deine Prüfungstermine und deine freie Lernzeit ein. Der Lernplan verteilt daraus die Themen auf deine Tage. Du musst nichts selbst ausrechnen.',
    links: [{ label: 'Prüfung anlegen', path: '/lernen/plan?ansicht=pruefungen&neu=1' }, { label: 'Lernzeit eintragen', path: '/lernen/plan?ansicht=zeit' }],
  },
  {
    titel: 'Erarbeiten',
    text: 'Lies ein Thema im Skript, in der CE oder in deinem Material und erfasse die Lernzeit. Danach ist das Thema „bearbeitet“, aber noch nicht gekonnt.',
    links: [{ label: 'Curriculare Einheiten', path: '/lernen/ce' }, { label: 'Skript', path: '/lernen/skript' }],
  },
  {
    titel: 'Abfragen',
    text: 'Teste dich mit Karteikarten oder einem Übungstrainer. Nur echte Abfragen zählen für deinen Wissensstand. Ein Gefühl wie „hab ich verstanden“ zählt nie.',
    links: [{ label: 'Karteikarten', path: '/lernen/karten' }, { label: 'Alle Übungen', path: '/lernen/ueben' }],
  },
  {
    titel: 'Wiederholen und prüfen',
    text: 'Der Lernplan holt Themen zurück, kurz bevor du sie vergessen würdest. Falsche Antworten sammelt das Fehlerheft. Vor Klausur und Examen übst du unter echten Bedingungen.',
    links: [{ label: 'Fehlerheft', path: '/lernen/fehler' }, { label: 'Prüfungssimulation', path: '/lernen/simulation' }],
  },
];

/** Seiten nach Zweck gebündelt, damit Neue nicht elf Menüpunkte auf einmal lesen müssen. */
export const BUENDEL: Array<{ titel: string; text: string; pfade: string[] }> = [
  { titel: 'Jeden Tag', text: 'Mehr brauchst du im Alltag nicht.', pfade: ['/', '/lernen/plan', '/lernen/karten', '/lernen/fehler'] },
  { titel: 'Stoff überblicken und auswählen', text: 'Derselbe Stoff, unterschiedlich sortiert. Nimm die Sicht, die dir gerade hilft.', pfade: ['/lernen/ce', '/lernen/board', '/lernen/landkarte', '/lernen/themen'] },
  { titel: 'Stand ansehen', text: 'Für den Rückblick, nicht für jeden Tag.', pfade: ['/lernen/fortschritt', '/lernen/faecher'] },
  { titel: 'Auf Prüfungen vorbereiten', text: 'Für Klausuren und das Examen.', pfade: ['/lernen/simulation', '/lernen/examen'] },
];

/** Die vier Stufen des Wissensstands, in der Reihenfolge, in der ein Thema sie erreicht. */
export const WISSENSSTUFEN: Array<{ name: string; text: string }> = [
  { name: 'Offen', text: 'Noch nicht angefangen.' },
  { name: 'Bearbeitet', text: 'Du hast Lernzeit erfasst, aber noch keine Abfrage gemacht.' },
  { name: 'Unsicher', text: 'Abgefragt, aber noch nicht oft oder gut genug. Kommt bald wieder dran.' },
  {
    name: 'Sicher',
    text: `Mindestens ${MASTERY_RULES.minSuccessfulDays} gute Abfragen an verschiedenen Tagen, und du erinnerst dich heute mit mindestens ${Math.round(MASTERY_RULES.minRetrievability * 100)} % Wahrscheinlichkeit daran. Auch „sicher“ kann wieder kippen, wenn du lange nicht wiederholst.`,
  },
];

export const BOARD_SPALTEN: Array<{ name: string; text: string }> = [
  { name: 'Themenpool', text: 'Alles, was noch irgendwann dran ist.' },
  { name: 'Diese Woche', text: 'Das nimmst du dir vor. Der Lernplan zieht es vor.' },
  { name: 'In Arbeit', text: 'Gerade angefangen.' },
  { name: 'Erarbeitet', text: 'Einmal durchgearbeitet. Jetzt folgen Abfragen.' },
];

export const BEGRIFFE: Array<{ wort: string; text: string; link?: Link }> = [
  { wort: 'Curriculare Einheit (CE)', text: 'Ein Unterrichtsblock der generalistischen Pflegeausbildung, sortiert nach Pflegesituationen (CE 01 bis CE 11). Ein Thema kann in mehreren CE vorkommen.', link: { label: 'CE-Übersicht', path: '/lernen/ce' } },
  { wort: 'Thema', text: 'Die kleinste Lerneinheit, zum Beispiel „Dekubitusprophylaxe“. Plan, Wissensstand und Abfragen beziehen sich immer auf Themen.' },
  { wort: 'Fach', text: 'Sortiert Themen nach Wissensgebiet, zum Beispiel Anatomie. Jedes Thema gehört zu genau einem Fach.', link: { label: 'Fächer', path: '/lernen/faecher' } },
  { wort: 'Kompetenzbereich', text: 'Die fünf Bereiche I bis V aus der Ausbildungs- und Prüfungsverordnung (PflAPrV). Sie sagen, was in der staatlichen Prüfung verlangt wird.', link: { label: 'Examen', path: '/lernen/examen' } },
  { wort: 'Erarbeiten', text: 'Ein Thema zum ersten Mal lernen: lesen, verstehen, Notizen machen.' },
  { wort: 'Abfrage', text: 'Ein Test, der zählt: Karteikarten, Übungstrainer, Selbsttest oder Prüfungssimulation. Die erste Runde eines Trainers am Tag zählt.' },
  { wort: 'Fällig', text: 'Heute dran. Der Lernplan berechnet, wann du ein Thema oder eine Karte wiederholen solltest, damit es hängen bleibt.' },
  { wort: 'Lernpfad', text: 'Die empfohlenen Schritte für ein Thema einer CE: Lesen, Karteikarten, Steckbrief, Fall, Üben, Selbsttest.' },
  { wort: 'Arbeitsstand', text: 'Was du mit einem Thema gemacht hast (Themenboard). Setzt du selbst.' },
  { wort: 'Wissensstand', text: 'Was du von einem Thema kannst. Berechnet die App aus deinen Abfragen, du kannst ihn nicht von Hand setzen.' },
];

/** Prüfungsvorbereitung über alle CE: Phasen rückwärts vom Prüfungstermin. */
export const PRUEFUNGSPHASEN: Array<{ wann: string; titel: string; schritte: Array<{ text: string; link?: Link }> }> = [
  {
    wann: 'Während der ganzen Ausbildung', titel: 'Laufend mitlernen',
    schritte: [
      { text: 'Zu jeder CE einen Klausurtermin eintragen, dann plant der Lernplan die Themen rechtzeitig ein.', link: { label: 'CE öffnen', path: '/lernen/ce' } },
      { text: 'Jeden Tag die fälligen Karteikarten. Fünf bis zehn Minuten reichen.', link: { label: 'Karteikarten', path: '/lernen/karten' } },
      { text: 'Fertige CE nicht abhaken: Ihre Themen kommen über Wiederholungen automatisch zurück.' },
    ],
  },
  {
    wann: 'Etwa 6 Monate vor dem Examen', titel: 'Überblick über alle CE',
    schritte: [
      { text: 'Die drei Examenstermine (schriftlich, praktisch, mündlich) eintragen.', link: { label: 'Examen', path: '/lernen/examen' } },
      { text: 'Eine Prüfung mit allen Themen anlegen, damit der Lernplan bis zum Examen über alle CE plant.', link: { label: 'Prüfung anlegen', path: '/lernen/plan?ansicht=pruefungen&neu=1' } },
      { text: 'Der Fahrplan zeigt je CE, was noch offen ist, und wie viele Themen du pro Woche schaffen solltest.', link: { label: 'Fahrplan alle CE', path: '/lernen/examen?ansicht=fahrplan' } },
    ],
  },
  {
    wann: 'Etwa 6 Wochen vorher', titel: 'Lücken schließen',
    schritte: [
      { text: 'Im Schwächen-Radar die Baustellen ansehen und gezielt diese Themen üben.', link: { label: 'Schwächen-Radar', path: '/lernen/examen' } },
      { text: 'Einmal pro Woche eine Prüfungssimulation mit Zeitlimit.', link: { label: 'Prüfungssimulation', path: '/lernen/simulation' } },
      { text: 'Fehlerheft leer arbeiten.', link: { label: 'Fehlerheft', path: '/lernen/fehler' } },
      { text: 'Mündliche Prüfung laut üben, mindestens einmal pro Woche.', link: { label: 'Mündlich üben', path: '/lernen/examen?ansicht=muendlich' } },
    ],
  },
  {
    wann: 'Letzte Woche', titel: 'Festigen statt Neues',
    schritte: [
      { text: 'Nur noch wiederholen, was der Lernplan als fällig zeigt. Keine neuen Themen mehr.', link: { label: 'Lernplan heute', path: '/lernen/plan' } },
      { text: 'Fehlerheft und fällige Karten, dann früh schlafen.' },
    ],
  },
];

/** Häufige Fragen von Neuen. Antworten beschreiben das echte Verhalten von Lernplan, Board und Fehlerheft. */
export const FRAGEN: Array<{ frage: string; antwort: string; link?: Link }> = [
  {
    frage: 'Ich hatte 100 %, warum ist das Thema trotzdem nicht „sicher“?',
    antwort: `Eine einzelne gute Abfrage zeigt nur, dass du es heute weißt. „Sicher“ verlangt mindestens ${MASTERY_RULES.minSuccessfulDays} gute Abfragen an verschiedenen Tagen und ein Gedächtnis, das mindestens ${MASTERY_RULES.minStability} Tage hält. Frag das Thema an einem anderen Tag noch einmal ab, wenn der Plan es vorschlägt.`,
    link: { label: 'Wissensstand mit Begründung je Thema', path: '/lernen/plan?ansicht=wissensstand' },
  },
  {
    frage: 'Auf dem Board steht „Erarbeitet“, im Lernplan aber nur „Bearbeitet“. Was stimmt?',
    antwort: 'Beides. Das Board zeigt, was du getan hast (durchgearbeitet), der Lernplan, was du nachweislich kannst. Nach der ersten guten Abfrage rückt der Wissensstand nach.',
  },
  {
    frage: 'Warum kommt ein Thema wieder, das ich schon konnte?',
    antwort: 'Wissen verblasst. Der Lernplan rechnet für jedes Thema aus, wann du dich nur noch unsicher erinnern würdest, und holt es kurz davor zurück. Jede gelungene Wiederholung macht den Abstand bis zur nächsten länger.',
  },
  {
    frage: 'Ich habe einen Tag ausgelassen. Ist jetzt alles durcheinander?',
    antwort: 'Nein. Der Plan wird jeden Tag aus deinem echten Stand neu berechnet. „Heute“ zeigt oben, was liegen geblieben ist und auf welchen Tag es gerutscht ist. Du musst nichts von Hand umplanen.',
    link: { label: 'Lernplan heute', path: '/lernen/plan' },
  },
  {
    frage: 'Der Lernplan warnt, die Zeit reicht nicht. Was tun?',
    antwort: 'Trag mehr Lernzeit ein, nimm Themen mit geringer Prüfungsrelevanz aus der Prüfung oder setze die wichtigsten Themen auf dem Board auf „Diese Woche“, dann kommen sie zuerst.',
    link: { label: 'Lernzeit ändern', path: '/lernen/plan?ansicht=zeit' },
  },
  {
    frage: 'Zählt es, wenn ich „verstanden“ ankreuze oder das Fehlerheft wiederhole?',
    antwort: 'Für den Wissensstand nicht. Selbsteinschätzungen werden gespeichert, aber nur echte Abfragen zählen. Das Fehlerheft trainiert gezielt Schwächen und würde den Stand sonst schönrechnen. Bei Trainern zählt die erste Runde am Tag.',
  },
  {
    frage: 'Wo sind meine Daten, und was passiert, wenn ich das Handy wechsle?',
    antwort: 'Alles bleibt auf diesem Gerät. Mit der Datensicherung erstellst du eine Datei, die du auf einem anderen Gerät wieder einspielst.',
    link: { label: 'Datensicherung', path: '/system/sicherung' },
  },
];
