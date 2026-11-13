// Anatomie-Trainer: Abbildungen beschriften, Wege in die richtige Reihenfolge bringen, Funktionen zuordnen.
// Inhalte sind Grundlagenwissen aus Anatomie und Physiologie (Lehrbuchstand), schematisch vereinfacht.

import { ergaenze, mitVertiefung, type Aufgabe, type AuswahlAufgabe } from '../quiz/quiz';
import { VERTIEFUNG } from './vertiefung';
import { ERWEITERUNG } from './erweiterung';

export type BereichId = 'zelle' | 'herz' | 'atmung' | 'niere' | 'verdauung' | 'bewegung' | 'nerven' | 'sinne' | 'haut' | 'hormone' | 'fortpflanzung';
export interface Bereich { id: BereichId; label: string; kurz: string; wissen: string[] }

export const THEMA: Record<BereichId, string> = {
  zelle: 'thema.ap.zelle', fortpflanzung: 'thema.ap.fortpflanzung',
  herz: 'thema.ap.herz', atmung: 'thema.ap.atmung', niere: 'thema.ap.niere', verdauung: 'thema.ap.verdauung',
  bewegung: 'thema.ap.bewegung', nerven: 'thema.ap.nerven', sinne: 'thema.ap.nerven', haut: 'thema.ap.haut', hormone: 'thema.ap.hormone',
};

const TITEL: Record<BereichId, string> = {
  zelle: 'Zelle und Gewebe', fortpflanzung: 'Fortpflanzung und Entwicklung',
  herz: 'Herz und Kreislauf', atmung: 'Atmung', niere: 'Niere und Harnwege', verdauung: 'Verdauung',
  bewegung: 'Bewegungsapparat', nerven: 'Nervensystem', sinne: 'Auge und Ohr', haut: 'Haut', hormone: 'Hormonsystem',
};

function frage(bereich: BereichId, id: string, f: string, optionen: string[], erklaerung: string[], richtig = [0], mehrfach = false): AuswahlAufgabe {
  return { id: `${bereich}.${id}`, art: 'auswahl', topicIds: [THEMA[bereich]], titel: TITEL[bereich], frage: f, optionen, richtig, mehrfach, erklaerung };
}

// ---------------------------------------------------------------- Zelle und Gewebe

const zelle: Aufgabe[] = [
  {
    id: 'zelle.beschriften', art: 'beschriften', figur: 'zelle', topicIds: [THEMA.zelle], titel: 'Zelle beschriften',
    frage: 'Beschrifte die Bestandteile der Zelle.',
    marken: [
      { nr: 1, x: 150, y: 13, label: 'Zellmembran', hinweis: 'Hülle aus einer Doppelschicht von Fetten, lässt Stoffe nur gezielt hinein und hinaus.' },
      { nr: 2, x: 132, y: 124, label: 'Zellkern', hinweis: 'Größtes Organell, enthält die Erbinformation (DNA) und steuert die Zelle.' },
      { nr: 3, x: 160, y: 104, label: 'Kernkörperchen (Nukleolus)', hinweis: 'Dunkler Bereich im Inneren des Kerns, hier entstehen Bausteine der Ribosomen.' },
      { nr: 4, x: 70, y: 70, label: 'Mitochondrium', hinweis: 'Kraftwerk der Zelle mit gefalteter Innenmembran, gewinnt Energie (ATP) mit Sauerstoff.' },
      { nr: 5, x: 218, y: 92, label: 'Raues endoplasmatisches Retikulum', hinweis: 'Membransystem mit aufgelagerten Ribosomen, an dem Eiweiße gebildet werden.' },
      { nr: 6, x: 96, y: 160, label: 'Golgi-Apparat', hinweis: 'Gestapelte Membransäckchen, die Eiweiße verpacken und versenden.' },
      { nr: 7, x: 236, y: 52, label: 'Lysosom', hinweis: 'Bläschen mit Verdauungsenzymen, baut verbrauchte Bestandteile und Fremdstoffe ab.' },
      { nr: 8, x: 180, y: 178, label: 'Zytoplasma', hinweis: 'Zellflüssigkeit, in der alle Organellen schwimmen.' },
    ],
    erklaerung: ['Die Zelle ist die kleinste lebensfähige Einheit. Jedes Organell hat eine Aufgabe, ähnlich wie Organe im Körper.', 'Rote Blutkörperchen haben als Ausnahme keinen Zellkern und keine Mitochondrien.'],
  },
  {
    id: 'zelle.ebenen', art: 'reihenfolge', topicIds: [THEMA.zelle], titel: 'Vom Kleinen zum Großen',
    frage: 'Ordne die Ebenen des Körpers vom Kleinsten zum Größten.',
    schritte: ['Organell', 'Zelle', 'Gewebe', 'Organ', 'Organsystem', 'Organismus'],
    erklaerung: ['Gleichartige Zellen bilden ein Gewebe, verschiedene Gewebe ein Organ, zusammenarbeitende Organe ein Organsystem, alle Systeme den Organismus.'],
  },
  {
    id: 'zelle.zu.gewebe', art: 'zuordnen', topicIds: [THEMA.zelle], titel: 'Vier Grundgewebe',
    frage: 'Ordne jedem Beispiel das Grundgewebe zu.',
    paare: [
      { links: 'Oberhaut und Schleimhaut des Darms', rechts: 'Epithelgewebe' },
      { links: 'Knochen, Knorpel, Sehnen, Fettgewebe', rechts: 'Binde- und Stützgewebe' },
      { links: 'Herzwand, Oberschenkel, Wand des Magens', rechts: 'Muskelgewebe' },
      { links: 'Gehirn, Rückenmark, Nerven', rechts: 'Nervengewebe' },
      { links: 'Drüsen wie die Schweißdrüse', rechts: 'Epithelgewebe' },
    ],
    erklaerung: ['Epithel bedeckt und kleidet aus, Bindegewebe verbindet und stützt, Muskelgewebe bewegt, Nervengewebe leitet Signale. Auch Blut zählt zum Binde- und Stützgewebe.'],
  },
  frage('zelle', 'osmose', 'Wasser strömt durch eine Membran zur Seite mit mehr gelösten Teilchen. Wie heißt dieser Vorgang?',
    ['Osmose', 'Diffusion von Gasen', 'Phagozytose', 'Mitose'],
    ['Bei der Osmose wandert Wasser dorthin, wo mehr Teilchen gelöst sind. Deshalb werden Infusionen meist isoton gegeben: Zu salzarme Lösungen lassen Zellen anschwellen, zu salzreiche schrumpfen.']),
  frage('zelle', 'mitose', 'Was ist das Ergebnis einer Mitose (Zellteilung von Körperzellen)?',
    ['Zwei gleiche Tochterzellen mit vollständigem Chromosomensatz', 'Vier Keimzellen mit halbem Chromosomensatz', 'Eine größere Zelle mit doppeltem Kern', 'Eine Zelle ohne Zellkern'],
    ['Die Mitose dient Wachstum und Erneuerung. Keimzellen (Ei- und Samenzellen) entstehen durch die Meiose mit halbem Chromosomensatz (23 statt 46).']),
  frage('zelle', 'regeneration', 'Welche Gewebe erneuern sich beim Erwachsenen gut? Wähle alle zutreffenden.',
    ['Oberhaut', 'Darmschleimhaut', 'Blutzellen im Knochenmark', 'Herzmuskelzellen', 'Nervenzellen im Gehirn'],
    ['Haut, Schleimhäute und Blutzellen teilen sich ständig. Herzmuskel- und Nervenzellen teilen sich kaum noch: Zerstörtes Gewebe wird durch Narbe ersetzt.'],
    [0, 1, 2], true),
  {
    id: 'zelle.fall.heilung', art: 'fall', topicIds: [THEMA.zelle], titel: 'Fall: Was heilt, was vernarbt?', stufe: 3,
    frage: 'Kannst du aus dem Gewebe ableiten, wie eine Verletzung heilt?',
    einstieg: 'Auf deiner Station liegen drei Menschen: Frau C. mit einer Schürfwunde am Knie, Herr I. nach einem Herzinfarkt und Herr T. nach einem Schlaganfall.',
    schritte: [
      {
        lage: 'Frau C. fragt, ob ihre Schürfwunde eine Narbe hinterlässt. Nur die oberste Hautschicht ist abgeschürft.',
        frage: 'Was antwortest du?', optionen: ['Wahrscheinlich nicht: Die Oberhaut erneuert sich aus den tieferen Zellen vollständig', 'Ja, jede Wunde hinterlässt eine Narbe', 'Das hängt nur von der Salbe ab', 'Die Haut wächst gar nicht nach'],
        richtig: [0], mehrfach: false,
        warum: 'Epithel regeneriert sich gut. Narben entstehen, wenn die Lederhaut tief verletzt ist und Bindegewebe die Lücke füllt.',
      },
      {
        lage: 'Herr I. fragt, ob sich sein Herzmuskel wieder erholt.',
        frage: 'Was trifft zu?', optionen: ['Abgestorbener Herzmuskel wird durch eine Bindegewebsnarbe ersetzt, die nicht mitpumpt', 'Der Herzmuskel wächst innerhalb weniger Wochen vollständig nach', 'Herzmuskel ist Epithel und erneuert sich ständig', 'Das Herz hat keine Muskelzellen'],
        richtig: [0], mehrfach: false,
        warum: 'Herzmuskelzellen teilen sich kaum. Die Narbe ist fest, aber nicht kontraktil. Deshalb kann nach einem großen Infarkt eine Herzschwäche entstehen.',
      },
      {
        lage: 'Herr T. hat eine Lähmung des rechten Arms. Nach Wochen Therapie kann er die Hand wieder öffnen.',
        frage: 'Wie ist das möglich, obwohl Nervenzellen sich kaum teilen?', optionen: ['Andere Hirnbereiche übernehmen durch Übung neue Aufgaben (Plastizität)', 'Die zerstörten Nervenzellen sind nachgewachsen', 'Die Lähmung war nur eingebildet', 'Muskelzellen haben die Steuerung übernommen'],
        richtig: [0], mehrfach: false,
        warum: 'Das Gehirn kann Verbindungen neu knüpfen. Aktivierende Pflege und Therapie nutzen diese Plastizität, deshalb lohnt sich tägliches Üben.',
      },
    ],
    erklaerung: ['Wie gut Gewebe heilt, hängt von der Teilungsfähigkeit seiner Zellen ab: Epithel gut, Herzmuskel und Nervenzellen kaum.', 'Wo Zellen nicht nachwachsen, entsteht eine Narbe oder andere Bereiche übernehmen Funktionen.'],
  },
];

// ---------------------------------------------------------------- Fortpflanzung und Entwicklung

const fortpflanzung: Aufgabe[] = [
  {
    id: 'fortpflanzung.zu.organe', art: 'zuordnen', topicIds: [THEMA.fortpflanzung], titel: 'Organe und Aufgaben',
    frage: 'Ordne jedem Organ seine Hauptaufgabe zu.',
    paare: [
      { links: 'Eierstock', rechts: 'Reift Eizellen heran und bildet Östrogen und Progesteron' },
      { links: 'Eileiter', rechts: 'Ort der Befruchtung und Weg zur Gebärmutter' },
      { links: 'Gebärmutter', rechts: 'Nimmt die befruchtete Eizelle auf, hier wächst das Kind' },
      { links: 'Hoden', rechts: 'Bildet Samenzellen und Testosteron' },
      { links: 'Prostata', rechts: 'Bildet einen Teil der Samenflüssigkeit und umgibt die Harnröhre' },
    ],
    erklaerung: ['Eierstöcke und Hoden sind die Keimdrüsen: Sie bilden Keimzellen und Geschlechtshormone. Die übrigen Organe leiten, ernähren oder schützen.'],
  },
  {
    id: 'fortpflanzung.zyklus', art: 'reihenfolge', topicIds: [THEMA.fortpflanzung], titel: 'Weiblicher Zyklus',
    frage: 'Bringe die Abschnitte des weiblichen Zyklus in die richtige Reihenfolge, beginnend mit dem ersten Tag der Blutung.',
    schritte: ['Menstruation: Abstoßen der Gebärmutterschleimhaut', 'Aufbauphase: Schleimhaut wächst unter Östrogen', 'Eisprung etwa in der Zyklusmitte', 'Gelbkörperphase: Progesteron bereitet die Schleimhaut auf die Einnistung vor'],
    erklaerung: ['Ein Zyklus dauert meist etwa 28 Tage, schwankt aber. Ohne Befruchtung bildet sich der Gelbkörper zurück, das Progesteron fällt und die Blutung beginnt.'],
  },
  {
    id: 'fortpflanzung.zu.hormone', art: 'zuordnen', topicIds: [THEMA.fortpflanzung, THEMA.hormone], titel: 'Geschlechtshormone',
    frage: 'Ordne jedem Hormon zu, wo es vor allem gebildet wird.',
    paare: [
      { links: 'FSH und LH', rechts: 'Hirnanhangsdrüse (Hypophyse)' },
      { links: 'Östrogen', rechts: 'Eierstock' },
      { links: 'Progesteron', rechts: 'Gelbkörper im Eierstock' },
      { links: 'Testosteron', rechts: 'Hoden' },
      { links: 'hCG (Schwangerschaftshormon)', rechts: 'Plazenta beziehungsweise Keimling' },
    ],
    erklaerung: ['Die Hypophyse steuert die Keimdrüsen über FSH und LH. Schwangerschaftstests weisen hCG im Urin nach.'],
  },
  frage('fortpflanzung', 'befruchtung', 'Wo findet die Befruchtung der Eizelle normalerweise statt?',
    ['Im Eileiter', 'In der Gebärmutter', 'Im Eierstock', 'In der Scheide'],
    ['Die befruchtete Eizelle wandert in einigen Tagen zur Gebärmutter und nistet sich dort ein. Nistet sie sich im Eileiter ein, entsteht eine Eileiterschwangerschaft, ein Notfall.']),
  frage('fortpflanzung', 'dauer', 'Wie lange dauert eine Schwangerschaft, gerechnet ab dem ersten Tag der letzten Regelblutung?',
    ['Etwa 40 Wochen', 'Etwa 30 Wochen', 'Genau 9 Kalendermonate ab der Befruchtung', 'Etwa 52 Wochen'],
    ['Gerechnet wird ab der letzten Regel (post menstruationem), etwa 280 Tage. Ab der 37. vollendeten Woche gilt ein Kind als reif geboren.']),
  frage('fortpflanzung', 'wechseljahre', 'Was verändert sich in den Wechseljahren der Frau? Wähle alle zutreffenden.',
    ['Die Eierstöcke bilden weniger Östrogen', 'Das Osteoporose-Risiko steigt', 'Schleimhäute von Scheide und Harnwegen werden dünner', 'Die Zahl der Eizellen nimmt wieder zu'],
    ['Östrogen schützt Knochen und Schleimhäute. Mit dem Abfall steigen Osteoporose, Harnwegsinfekte und Trockenheit der Scheide.'],
    [0, 1, 2], true),
  {
    id: 'fortpflanzung.fall.prostata', art: 'fall', topicIds: [THEMA.fortpflanzung, THEMA.niere], titel: 'Fall: Die Prostata und das Wasserlassen', stufe: 3,
    frage: 'Verstehst du die Beschwerden aus der Anatomie heraus?',
    einstieg: 'Herr E., 76 Jahre, steht nachts drei- bis viermal zum Wasserlassen auf. Der Harnstrahl ist schwach, er muss pressen und hat danach das Gefühl, die Blase sei nicht leer.',
    schritte: [
      {
        lage: 'Bekannt ist eine gutartige Vergrößerung der Prostata.',
        frage: 'Warum führt das zu diesen Beschwerden?', optionen: ['Die Prostata umschließt die Harnröhre direkt unter der Blase und engt sie ein, wenn sie wächst', 'Die Prostata bildet zu viel Urin', 'Die Prostata drückt auf die Nieren', 'Die Prostata liegt im Hoden und hat mit dem Wasserlassen nichts zu tun'],
        richtig: [0], mehrfach: false,
        warum: 'Weil die Harnröhre mitten durch die Prostata läuft, behindert schon eine mäßige Vergrößerung den Abfluss. Restharn bleibt zurück.',
      },
      {
        lage: 'Die Ärztin vermutet viel Restharn.',
        frage: 'Welche Folgen hat Restharn? Wähle alle zutreffenden.', optionen: ['Höheres Risiko für Harnwegsinfekte', 'Bei vollständigem Verschluss akuter Harnverhalt', 'Rückstau bis zur Niere möglich', 'Bessere Nierenfunktion'],
        richtig: [0, 1, 2], mehrfach: true,
        warum: 'Stehender Urin ist ein Nährboden für Keime. Staut sich der Urin dauerhaft zurück, kann die Niere Schaden nehmen.',
      },
      {
        lage: 'Er soll einen Blasenkatheter bekommen. Die Kollegin hat beim Einführen einen Widerstand gespürt.',
        frage: 'Was ist richtig?', optionen: ['Nicht mit Kraft weiterschieben, ärztlich melden; bei Prostatavergrößerung kann ein anderer Katheter nötig sein', 'Fester drücken, bis der Widerstand nachgibt', 'Mehr Gleitmittel und ruckartig weiterschieben', 'Den Katheter kürzen'],
        richtig: [0], mehrfach: false,
        warum: 'Gewalt kann die Harnröhre verletzen und einen falschen Weg schaffen. Oft legt dann die Urologie einen speziellen Katheter oder einen suprapubischen Katheter.',
      },
    ],
    erklaerung: ['Die Prostata liegt unter der Blase und umschließt die Harnröhre. Ihre Vergrößerung erklärt schwachen Strahl, Restharn, Nykturie und Schwierigkeiten beim Katheterisieren.'],
  },
];

// ---------------------------------------------------------------- Herz

const herz: Aufgabe[] = [
  {
    id: 'herz.beschriften', art: 'beschriften', figur: 'herz', topicIds: [THEMA.herz], titel: 'Herz beschriften',
    frage: 'Beschrifte das Herz. Blau ist sauerstoffarmes, rot sauerstoffreiches Blut. Die rechte Herzseite liegt in der Abbildung links.',
    marken: [
      { nr: 1, x: 80, y: 100, label: 'Rechter Vorhof', hinweis: 'Nimmt das sauerstoffarme Blut aus dem Körper auf.' },
      { nr: 2, x: 95, y: 215, label: 'Rechte Kammer', hinweis: 'Pumpt sauerstoffarmes Blut in den Lungenkreislauf.' },
      { nr: 3, x: 220, y: 100, label: 'Linker Vorhof', hinweis: 'Nimmt das sauerstoffreiche Blut aus der Lunge auf.' },
      { nr: 4, x: 205, y: 215, label: 'Linke Kammer', hinweis: 'Pumpt sauerstoffreiches Blut in den Körper und hat die dickste Wand.' },
      { nr: 5, x: 81, y: 172, label: 'Trikuspidalklappe', hinweis: 'Segelklappe mit drei Segeln zwischen rechtem Vorhof und rechter Kammer.' },
      { nr: 6, x: 220, y: 172, label: 'Mitralklappe', hinweis: 'Segelklappe mit zwei Segeln zwischen linkem Vorhof und linker Kammer.' },
      { nr: 7, x: 136, y: 132, label: 'Pulmonalklappe', hinweis: 'Taschenklappe am Ausgang der rechten Kammer.' },
      { nr: 8, x: 164, y: 132, label: 'Aortenklappe', hinweis: 'Taschenklappe am Ausgang der linken Kammer.' },
      { nr: 9, x: 90, y: 41, label: 'Truncus pulmonalis (Lungenarterie)', hinweis: 'Gefäß, das sauerstoffarmes Blut zur Lunge bringt.' },
      { nr: 10, x: 215, y: 17, label: 'Aorta', hinweis: 'Größte Schlagader, verteilt sauerstoffreiches Blut in den Körper.' },
      { nr: 11, x: 22, y: 95, label: 'Obere Hohlvene', hinweis: 'Bringt sauerstoffarmes Blut aus Kopf und Armen zum Herzen.' },
      { nr: 12, x: 22, y: 143, label: 'Untere Hohlvene', hinweis: 'Bringt sauerstoffarmes Blut aus Bauch und Beinen zum Herzen.' },
      { nr: 13, x: 276, y: 119, label: 'Lungenvenen', hinweis: 'Bringen sauerstoffreiches Blut aus der Lunge zum Herzen.' },
      { nr: 14, x: 150, y: 240, label: 'Kammerscheidewand (Septum)', hinweis: 'Trennt rechte und linke Kammer.' },
    ],
    erklaerung: ['Merkhilfe: Die rechte Herzhälfte führt sauerstoffarmes Blut zur Lunge, die linke sauerstoffreiches Blut in den Körper.', 'Segelklappen (Trikuspidal-, Mitralklappe) liegen zwischen Vorhof und Kammer, Taschenklappen (Pulmonal-, Aortenklappe) am Ausgang der Kammern.'],
  },
  {
    id: 'herz.blutfluss', art: 'reihenfolge', topicIds: [THEMA.herz], titel: 'Weg des Blutes',
    frage: 'Bring den Weg des Blutes von den Hohlvenen bis in die Aorta in die richtige Reihenfolge.',
    schritte: ['Hohlvenen', 'Rechter Vorhof', 'Trikuspidalklappe', 'Rechte Kammer', 'Pulmonalklappe', 'Lungenarterie', 'Lungenkapillaren (Gasaustausch)', 'Lungenvenen', 'Linker Vorhof', 'Mitralklappe', 'Linke Kammer', 'Aortenklappe', 'Aorta'],
    erklaerung: ['Erst der kleine Kreislauf (Lungenkreislauf) über das rechte Herz, dann der große Kreislauf (Körperkreislauf) über das linke Herz.', 'Arterien führen vom Herzen weg, Venen zum Herzen hin, unabhängig vom Sauerstoffgehalt.'],
  },
  {
    id: 'herz.erregung', art: 'reihenfolge', topicIds: [THEMA.herz], titel: 'Erregungsleitung',
    frage: 'Wie breitet sich die elektrische Erregung im Herzen aus?',
    schritte: ['Sinusknoten', 'Vorhofmuskulatur', 'AV-Knoten', 'His-Bündel', 'Tawara-Schenkel', 'Purkinje-Fasern'],
    erklaerung: ['Der Sinusknoten ist der Taktgeber (etwa 60 bis 80 Schläge pro Minute). Der AV-Knoten verzögert die Weiterleitung, damit sich die Kammern füllen können.', 'Fällt der Sinusknoten aus, übernimmt der AV-Knoten mit etwa 40 bis 60 Schlägen pro Minute.'],
  },
  frage('herz', 'koerperkreislauf', 'Welcher Herzabschnitt pumpt das Blut in den Körperkreislauf?',
    ['Linke Kammer', 'Rechte Kammer', 'Linker Vorhof', 'Rechter Vorhof'],
    ['Die linke Kammer muss gegen den hohen Druck im Körperkreislauf arbeiten, deshalb ist ihre Muskelwand etwa dreimal so dick wie die der rechten.']),
  frage('herz', 'lungenvenen', 'Welche Gefäße führen sauerstoffreiches Blut, obwohl sie Venen heißen?',
    ['Lungenvenen', 'Hohlvenen', 'Pfortader', 'Halsvenen'],
    ['Venen heißen so, weil sie zum Herzen führen. Die Lungenvenen bringen das in der Lunge mit Sauerstoff angereicherte Blut zum linken Vorhof.']),
  frage('herz', 'koronar', 'Wie wird der Herzmuskel selbst mit Blut versorgt?',
    ['Über die Herzkranzgefäße (Koronararterien), die direkt hinter der Aortenklappe abgehen', 'Direkt aus dem Blut in den Herzkammern', 'Über die Lungenvenen', 'Über die Hohlvenen'],
    ['Die Koronararterien entspringen der Aorta kurz hinter der Aortenklappe. Ein Verschluss führt zum Herzinfarkt.']),
  frage('herz', 'systole', 'Was passiert in der Systole?',
    ['Die Kammern ziehen sich zusammen und werfen Blut aus', 'Die Kammern erschlaffen und füllen sich', 'Nur die Vorhöfe ziehen sich zusammen', 'Alle Herzklappen sind gleichzeitig offen'],
    ['Systole = Anspannungs- und Austreibungsphase der Kammern. Diastole = Entspannungs- und Füllungsphase.', 'Der obere Blutdruckwert ist der systolische, der untere der diastolische.']),
];

// ---------------------------------------------------------------- Atmung

const atmung: Aufgabe[] = [
  {
    id: 'atmung.beschriften', art: 'beschriften', figur: 'atmung', topicIds: [THEMA.atmung], titel: 'Atemwege beschriften',
    frage: 'Beschrifte die Atemwege und Lungen. Die rechte Körperseite liegt in der Abbildung links.',
    marken: [
      { nr: 1, x: 150, y: 24, label: 'Nasenhöhle', hinweis: 'Wärmt, befeuchtet und reinigt die Einatemluft.' },
      { nr: 2, x: 150, y: 60, label: 'Rachen (Pharynx)', hinweis: 'Gemeinsamer Abschnitt von Atemweg und Speiseweg.' },
      { nr: 3, x: 150, y: 92, label: 'Kehlkopf (Larynx)', hinweis: 'Enthält die Stimmlippen und wird beim Schlucken vom Kehldeckel verschlossen.' },
      { nr: 4, x: 150, y: 138, label: 'Luftröhre (Trachea)', hinweis: 'Von Knorpelspangen offen gehaltenes Rohr bis zur Gabelung.' },
      { nr: 5, x: 133, y: 189, label: 'Rechter Hauptbronchus', hinweis: 'Steiler und kürzer als die Gegenseite: Aspiriertes landet hier häufiger.' },
      { nr: 6, x: 169, y: 181, label: 'Linker Hauptbronchus', hinweis: 'Verläuft flacher, weil das Herz Platz braucht.' },
      { nr: 7, x: 85, y: 229, label: 'Bronchiolen', hinweis: 'Feinste Verzweigungen des Bronchialbaums ohne Knorpel.' },
      { nr: 8, x: 226, y: 261, label: 'Lungenbläschen (Alveolen)', hinweis: 'Hier findet der Gasaustausch statt.' },
      { nr: 9, x: 72, y: 165, label: 'Rechter Lungenflügel', hinweis: 'Hat drei Lappen.' },
      { nr: 10, x: 232, y: 168, label: 'Linker Lungenflügel', hinweis: 'Hat zwei Lappen und eine Einbuchtung für das Herz.' },
      { nr: 11, x: 150, y: 300, label: 'Zwerchfell', hinweis: 'Wichtigster Atemmuskel, flacht sich bei der Einatmung ab.' },
    ],
    erklaerung: ['Obere Atemwege: Nase, Nasennebenhöhlen, Rachen. Untere Atemwege: ab dem Kehlkopf.', 'Rechts drei, links zwei Lungenlappen: Links braucht das Herz Platz.'],
  },
  {
    id: 'atmung.luftweg', art: 'reihenfolge', topicIds: [THEMA.atmung], titel: 'Weg der Einatemluft',
    frage: 'Welchen Weg nimmt die Einatemluft bis zum Gasaustausch?',
    schritte: ['Nasenhöhle', 'Rachen', 'Kehlkopf', 'Luftröhre', 'Hauptbronchien', 'Bronchiolen', 'Lungenbläschen'],
    erklaerung: ['Bis zu den Bronchiolen wird die Luft nur geleitet (Totraum), erst in den Lungenbläschen findet der Gasaustausch statt.'],
  },
  frage('atmung', 'gasaustausch', 'Wo findet der Gasaustausch zwischen Luft und Blut statt?',
    ['In den Lungenbläschen (Alveolen)', 'In der Luftröhre', 'In den Hauptbronchien', 'Im Rachen'],
    ['Die Wand der Alveolen und der Kapillaren ist zusammen nur etwa einen Mikrometer dick, Sauerstoff und Kohlendioxid diffundieren hindurch.']),
  frage('atmung', 'aspiration', 'Warum gelangen aspirierte Fremdkörper häufiger in die rechte Lunge?',
    ['Der rechte Hauptbronchus verläuft steiler und ist weiter', 'Die rechte Lunge ist kleiner', 'Der linke Hauptbronchus hat eine Klappe', 'Die rechte Lunge wird stärker belüftet, weil dort das Herz liegt'],
    ['Der rechte Hauptbronchus setzt die Richtung der Luftröhre fast gerade fort. Deshalb Aspirationspneumonien oft rechts.']),
  frage('atmung', 'atemmuskel', 'Welcher Muskel ist der wichtigste Atemmuskel?',
    ['Zwerchfell', 'Großer Brustmuskel', 'Kopfwender', 'Bauchmuskulatur'],
    ['Das Zwerchfell flacht sich bei der Einatmung ab, der Brustraum wird größer und Luft strömt ein. Brust-, Hals- und Bauchmuskeln sind Atemhilfsmuskeln.']),
  frage('atmung', 'kehldeckel', 'Was verhindert beim Schlucken, dass Nahrung in die Luftröhre gelangt?',
    ['Der Kehldeckel (Epiglottis) verschließt den Kehlkopfeingang', 'Die Stimmlippen öffnen sich weit', 'Das Zwerchfell zieht sich zusammen', 'Die Luftröhre klappt zusammen'],
    ['Bei Schluckstörungen, etwa nach einem Schlaganfall, funktioniert dieser Schutz nicht sicher: Aspirationsgefahr.']),
  frage('atmung', 'atemzentrum', 'Wo liegt das Atemzentrum?',
    ['Im Hirnstamm (verlängertes Mark)', 'Im Kleinhirn', 'In der Lunge', 'Im Rückenmark auf Höhe der Brustwirbel'],
    ['Der stärkste Atemantrieb ist ein Anstieg des Kohlendioxids im Blut. Opioide dämpfen das Atemzentrum.']),
];

// ---------------------------------------------------------------- Niere und Harnwege

const niere: Aufgabe[] = [
  {
    id: 'niere.beschriften', art: 'beschriften', figur: 'niere', topicIds: [THEMA.niere], titel: 'Niere und Harnwege beschriften',
    frage: 'Beschrifte Niere und ableitende Harnwege.',
    marken: [
      { nr: 1, x: 81, y: 35, label: 'Nebenniere', hinweis: 'Hormondrüse, die wie eine Kappe auf dem oberen Pol sitzt (Cortisol, Adrenalin).' },
      { nr: 2, x: 47, y: 120, label: 'Nierenrinde', hinweis: 'Äußere Schicht mit den Nierenkörperchen, in denen der Primärharn entsteht.' },
      { nr: 3, x: 67, y: 96, label: 'Nierenmark (Pyramiden)', hinweis: 'Innere Schicht aus kegelförmigen Abschnitten, in denen der Harn konzentriert wird.' },
      { nr: 4, x: 101, y: 104, label: 'Nierenbecken', hinweis: 'Sammelt den fertigen Harn, bevor er die Niere verlässt.' },
      { nr: 5, x: 121, y: 166, label: 'Harnleiter (Ureter)', hinweis: 'Etwa 25 bis 30 cm langer Schlauch, transportiert den Harn mit wellenförmigen Bewegungen abwärts.' },
      { nr: 6, x: 150, y: 238, label: 'Harnblase', hinweis: 'Speichert den Harn, Harndrang meist ab etwa 300 bis 400 ml.' },
      { nr: 7, x: 150, y: 285, label: 'Harnröhre (Urethra)', hinweis: 'Leitet den Harn nach außen, bei Frauen deutlich kürzer.' },
    ],
    erklaerung: ['Die Nieren liegen hinter dem Bauchfell (retroperitoneal), die rechte etwas tiefer, weil die Leber darüber liegt.', 'Die kurze weibliche Harnröhre erklärt, warum Frauen häufiger Harnwegsinfektionen bekommen.'],
  },
  {
    id: 'niere.harnweg', art: 'reihenfolge', topicIds: [THEMA.niere], titel: 'Weg des Harns',
    frage: 'Bring den Weg des Harns von der Entstehung bis nach außen in die richtige Reihenfolge.',
    schritte: ['Nierenkörperchen (Glomerulus)', 'Nierenkanälchen (Tubulus)', 'Sammelrohr', 'Nierenbecken', 'Harnleiter', 'Harnblase', 'Harnröhre'],
    erklaerung: ['Im Glomerulus wird Primärharn abgefiltert, in Tubulus und Sammelrohr wird das meiste Wasser zurückgeholt. Vom Nierenbecken an wird der Harn nur noch abgeleitet.'],
  },
  frage('niere', 'nephron', 'Wie heißt die kleinste Funktionseinheit der Niere?',
    ['Nephron', 'Alveole', 'Neuron', 'Lobulus'],
    ['Jede Niere hat rund eine Million Nephrone. Ein Nephron besteht aus Nierenkörperchen und Nierenkanälchen.']),
  frage('niere', 'primaerharn', 'Wie viel Primärharn bilden die Nieren eines Erwachsenen ungefähr am Tag, und wie viel Endharn bleibt übrig?',
    ['Etwa 150 bis 180 Liter Primärharn, etwa 1,5 Liter Endharn', 'Etwa 1,5 Liter Primärharn, etwa 1,5 Liter Endharn', 'Etwa 15 Liter Primärharn, etwa 5 Liter Endharn', 'Etwa 500 Liter Primärharn, etwa 50 Liter Endharn'],
    ['Rund 99 % des Primärharns werden in den Tubuli zurückgewonnen. Deshalb ist die Ausfuhr ein empfindlicher Hinweis auf die Nierenfunktion.']),
  frage('niere', 'hormone', 'Welche Hormone bildet die Niere? Wähle alle zutreffenden.',
    ['Erythropoetin (regt die Bildung roter Blutkörperchen an)', 'Renin (Blutdruckregulation)', 'Aktives Vitamin D (Calcitriol)', 'Insulin', 'Adrenalin'],
    ['Erythropoetin fehlt bei chronischer Niereninsuffizienz, es kommt zur renalen Anämie.', 'Adrenalin bildet das Nebennierenmark, Insulin die Bauchspeicheldrüse.'],
    [0, 1, 2], true),
];

// ---------------------------------------------------------------- Verdauung

const verdauung: Aufgabe[] = [
  {
    id: 'verdauung.weg', art: 'reihenfolge', topicIds: [THEMA.verdauung], titel: 'Weg der Nahrung',
    frage: 'Welchen Weg nimmt die Nahrung durch den Verdauungstrakt?',
    schritte: ['Mundhöhle', 'Rachen', 'Speiseröhre', 'Magen', 'Zwölffingerdarm (Duodenum)', 'Leerdarm (Jejunum)', 'Krummdarm (Ileum)', 'Dickdarm (Kolon)', 'Mastdarm (Rektum)', 'After'],
    erklaerung: ['Dünndarm = Zwölffingerdarm, Leerdarm und Krummdarm. Am Übergang vom Krummdarm zum Dickdarm liegt die Bauhin-Klappe.'],
  },
  {
    id: 'verdauung.fett', art: 'reihenfolge', topicIds: [THEMA.verdauung], titel: 'Weg der Galle',
    frage: 'Welchen Weg nimmt die Galle von der Bildung bis in den Darm?',
    schritte: ['Leberzellen bilden die Galle', 'Gallengänge in der Leber', 'Gallenblase (Speicher)', 'Hauptgallengang', 'Zwölffingerdarm'],
    erklaerung: ['Die Gallenblase speichert und dickt die Galle ein. Nach einer fettreichen Mahlzeit zieht sie sich zusammen.', 'Ein Stein im Hauptgallengang staut die Galle: Gelbsucht (Ikterus) möglich.'],
  },
  frage('verdauung', 'resorption', 'Wo werden die meisten Nährstoffe ins Blut aufgenommen?',
    ['Im Dünndarm', 'Im Magen', 'Im Dickdarm', 'In der Speiseröhre'],
    ['Zotten und Mikrovilli vergrößern die Oberfläche des Dünndarms auf etwa 200 Quadratmeter.']),
  frage('verdauung', 'galle', 'Wo wird die Galle gebildet?',
    ['In der Leber', 'In der Gallenblase', 'In der Bauchspeicheldrüse', 'Im Zwölffingerdarm'],
    ['Gebildet in der Leber, gespeichert in der Gallenblase. Gallensäuren helfen bei der Fettverdauung.']),
  frage('verdauung', 'pankreas', 'Was bildet die Bauchspeicheldrüse (Pankreas)? Wähle alle zutreffenden.',
    ['Verdauungsenzyme für Eiweiß, Fett und Kohlenhydrate', 'Insulin', 'Glukagon', 'Galle', 'Salzsäure'],
    ['Exokriner Teil: Verdauungssaft mit Enzymen. Endokriner Teil (Langerhans-Inseln): Insulin und Glukagon.', 'Salzsäure bildet der Magen, Galle die Leber.'],
    [0, 1, 2], true),
  frage('verdauung', 'magen', 'Welche Aufgabe hat die Salzsäure im Magen?',
    ['Sie tötet viele Keime ab und aktiviert die Eiweißverdauung', 'Sie spaltet Fette', 'Sie nimmt Zucker ins Blut auf', 'Sie bildet Vitamin K'],
    ['Die Säure macht aus Pepsinogen das eiweißspaltende Pepsin. Die Magenschleimhaut schützt sich mit Schleim.']),
];

// ---------------------------------------------------------------- Bewegungsapparat

const bewegung: Aufgabe[] = [
  {
    id: 'bewegung.beschriften', art: 'beschriften', figur: 'skelett', topicIds: [THEMA.bewegung], titel: 'Skelett beschriften',
    frage: 'Beschrifte das Skelett. Die rechte Körperseite liegt in der Abbildung links.',
    marken: [
      { nr: 1, x: 110, y: 28, label: 'Schädel', hinweis: 'Knöcherne Kapsel, die das Gehirn schützt.' },
      { nr: 2, x: 110, y: 66, label: 'Unterkiefer', hinweis: 'Einziger beweglicher Knochen des Kopfes.' },
      { nr: 3, x: 80, y: 80, label: 'Schlüsselbein', hinweis: 'S-förmiger Knochen zwischen Brustbein und Schulterblatt, bricht häufig beim Sturz auf die Schulter.' },
      { nr: 4, x: 110, y: 118, label: 'Brustbein (Sternum)', hinweis: 'Platter Knochen vorn in der Mitte des Brustkorbs, Druckpunkt bei der Herzdruckmassage.' },
      { nr: 5, x: 146, y: 136, label: 'Rippen', hinweis: '12 Paare, bilden mit Brustbein und Brustwirbeln den Brustkorb.' },
      { nr: 6, x: 110, y: 210, label: 'Wirbelsäule', hinweis: 'Achse des Körpers aus Wirbeln und Bandscheiben, umschließt das Rückenmark.' },
      { nr: 7, x: 55, y: 126, label: 'Oberarmknochen (Humerus)', hinweis: 'Langer Knochen zwischen Schulter- und Ellenbogengelenk.' },
      { nr: 8, x: 33, y: 210, label: 'Speiche (Radius)', hinweis: 'Unterarmknochen auf der Daumenseite.' },
      { nr: 9, x: 56, y: 222, label: 'Elle (Ulna)', hinweis: 'Unterarmknochen auf der Kleinfingerseite.' },
      { nr: 10, x: 84, y: 254, label: 'Becken', hinweis: 'Knochenring, der die Last des Rumpfes auf die Beine überträgt.' },
      { nr: 11, x: 88, y: 306, label: 'Oberschenkelknochen (Femur)', hinweis: 'Längster Knochen des Körpers, sein Hals bricht bei älteren Menschen oft nach Stürzen.' },
      { nr: 12, x: 93, y: 352, label: 'Kniescheibe (Patella)', hinweis: 'In die Sehne des vorderen Oberschenkelmuskels eingelagerter Knochen.' },
      { nr: 13, x: 98, y: 410, label: 'Schienbein (Tibia)', hinweis: 'Kräftiger Unterschenkelknochen auf der Innenseite, vorn direkt unter der Haut tastbar.' },
      { nr: 14, x: 76, y: 384, label: 'Wadenbein (Fibula)', hinweis: 'Schlanker Unterschenkelknochen auf der Außenseite.' },
    ],
    erklaerung: ['Speiche liegt am Daumen, Elle am kleinen Finger. Schienbein innen, Wadenbein außen.', 'Der Schenkelhals (Teil des Oberschenkelknochens) ist die typische Bruchstelle nach Stürzen im Alter.'],
  },
  {
    id: 'bewegung.wirbelsaeule', art: 'reihenfolge', topicIds: [THEMA.bewegung], titel: 'Abschnitte der Wirbelsäule',
    frage: 'Ordne die Abschnitte der Wirbelsäule von oben nach unten.',
    schritte: ['Halswirbelsäule (7 Wirbel)', 'Brustwirbelsäule (12 Wirbel)', 'Lendenwirbelsäule (5 Wirbel)', 'Kreuzbein', 'Steißbein'],
    erklaerung: ['7 Hals-, 12 Brust-, 5 Lendenwirbel. Kreuz- und Steißbein bestehen aus verschmolzenen Wirbeln.', 'Die Brustwirbel tragen die 12 Rippenpaare.'],
  },
  frage('bewegung', 'gelenke', 'Welches Gelenk ist ein Kugelgelenk?',
    ['Schultergelenk', 'Ellenbogengelenk (Oberarm-Elle)', 'Fingermittelgelenk', 'Oberes Sprunggelenk'],
    ['Kugelgelenke (Schulter, Hüfte) erlauben Bewegungen in alle Richtungen. Finger- und Sprunggelenke sind Scharniergelenke.', 'Das Schultergelenk ist sehr beweglich, aber wenig knöchern gesichert: Es renkt sich am häufigsten aus.']),
  frage('bewegung', 'knochenanzahl', 'Wie viele Knochen hat das Skelett eines Erwachsenen ungefähr?',
    ['Etwa 206', 'Etwa 106', 'Etwa 306', 'Etwa 56'],
    ['Neugeborene haben mehr Knochen, einige verwachsen im Laufe der Entwicklung (z. B. am Schädel und Kreuzbein).']),
  frage('bewegung', 'kontraktur', 'Was ist eine Kontraktur?',
    ['Eine dauerhafte Bewegungseinschränkung eines Gelenks durch Verkürzung von Muskeln, Sehnen oder Kapsel', 'Ein Muskelkrampf, der nach wenigen Minuten vergeht', 'Ein Knochenbruch in Gelenknähe', 'Eine Entzündung der Gelenkinnenhaut'],
    ['Kontrakturen entstehen vor allem durch Bewegungsmangel und Schonhaltungen. Vorbeugung: Bewegen, Mobilisieren, Lagern in wechselnden Positionen.']),
  frage('bewegung', 'muskel', 'Wie arbeiten Beuger und Strecker an einem Gelenk zusammen?',
    ['Als Gegenspieler: Zieht sich der eine zusammen, entspannt sich der andere', 'Beide ziehen sich immer gleichzeitig zusammen', 'Der Beuger arbeitet nur im Liegen', 'Strecker sind Sehnen, keine Muskeln'],
    ['Agonist und Antagonist: Beim Beugen des Ellenbogens arbeitet der Bizeps, der Trizeps entspannt sich.']),
];

// ---------------------------------------------------------------- Nervensystem

const nerven: Aufgabe[] = [
  {
    id: 'nerven.beschriften', art: 'beschriften', figur: 'gehirn', topicIds: [THEMA.nerven], titel: 'Gehirn beschriften',
    frage: 'Beschrifte das Gehirn. Ansicht von links, die Stirn zeigt nach links.',
    marken: [
      { nr: 1, x: 84, y: 82, label: 'Stirnlappen', hinweis: 'Vorderster Großhirnlappen: Planen, Persönlichkeit, Bewegungssteuerung, motorisches Sprachzentrum.' },
      { nr: 2, x: 202, y: 52, label: 'Scheitellappen', hinweis: 'Großhirnlappen hinter der Zentralfurche: Körperempfinden wie Berührung und Temperatur.' },
      { nr: 3, x: 256, y: 100, label: 'Hinterhauptslappen', hinweis: 'Hinterster Großhirnlappen mit der Sehrinde.' },
      { nr: 4, x: 132, y: 152, label: 'Schläfenlappen', hinweis: 'Großhirnlappen unterhalb der seitlichen Furche: Hören, Gedächtnis, Sprachverständnis.' },
      { nr: 5, x: 240, y: 190, label: 'Kleinhirn', hinweis: 'Liegt hinten unten: Gleichgewicht, Koordination und Feinabstimmung von Bewegungen.' },
      { nr: 6, x: 170, y: 184, label: 'Brücke (Pons)', hinweis: 'Vorgewölbter Teil des Hirnstamms, verbindet Großhirn und Kleinhirn.' },
      { nr: 7, x: 174, y: 216, label: 'Verlängertes Mark (Medulla oblongata)', hinweis: 'Unterster Teil des Hirnstamms mit Atem- und Kreislaufzentrum.' },
      { nr: 8, x: 173, y: 243, label: 'Rückenmark', hinweis: 'Setzt den Hirnstamm im Wirbelkanal fort und leitet Signale zwischen Gehirn und Körper.' },
    ],
    erklaerung: ['Die Zentralfurche trennt Stirn- und Scheitellappen, die seitliche Furche den Schläfenlappen.', 'Hirnstamm mit Atem- und Kreislaufzentrum: Schäden hier sind lebensbedrohlich.'],
  },
  {
    id: 'nerven.reflex', art: 'reihenfolge', topicIds: [THEMA.nerven], titel: 'Reflexbogen',
    frage: 'Bring den Ablauf eines Reflexes (z. B. Kniesehnenreflex) in die richtige Reihenfolge.',
    schritte: ['Reiz trifft auf einen Rezeptor', 'Sensible (afferente) Nervenfaser leitet zum Rückenmark', 'Umschaltung im Rückenmark', 'Motorische (efferente) Nervenfaser leitet zum Muskel', 'Muskel zieht sich zusammen'],
    erklaerung: ['Reflexe laufen über das Rückenmark, ohne dass das Gehirn erst entscheiden muss. Deshalb sind sie so schnell.', 'Afferent = zum zentralen Nervensystem hin, efferent = davon weg.'],
  },
  frage('nerven', 'zns', 'Was gehört zum zentralen Nervensystem (ZNS)?',
    ['Gehirn und Rückenmark', 'Nur das Gehirn', 'Alle Nerven in Armen und Beinen', 'Sympathikus und Parasympathikus'],
    ['Alles außerhalb von Gehirn und Rückenmark ist peripheres Nervensystem. Sympathikus und Parasympathikus bilden das vegetative Nervensystem.']),
  frage('nerven', 'sympathikus', 'Was bewirkt der Sympathikus? Wähle alle zutreffenden.',
    ['Herzfrequenz steigt', 'Pupillen werden weit', 'Bronchien weiten sich', 'Verdauung wird angeregt', 'Speichelfluss nimmt stark zu'],
    ['Sympathikus = Kampf oder Flucht: Herz, Atmung und Muskeln bekommen Vorrang, die Verdauung wird gebremst.', 'Der Parasympathikus (Ruhe und Verdauung) wirkt entgegengesetzt.'],
    [0, 1, 2], true),
  frage('nerven', 'kreuzung', 'Eine Patientin hat einen Schlaganfall in der linken Großhirnhälfte. Welche Körperseite ist meist gelähmt?',
    ['Die rechte', 'Die linke', 'Beide Beine', 'Keine, nur das Sprechen ist gestört'],
    ['Die Bahnen für die Bewegung kreuzen im Hirnstamm auf die Gegenseite. Bei Rechtshändern liegt links auch das Sprachzentrum, deshalb oft zusätzlich eine Aphasie.']),
  frage('nerven', 'kleinhirn', 'Ein Patient geht breitbeinig und schwankend, seine Bewegungen schießen über das Ziel hinaus. Welcher Hirnabschnitt ist am ehesten betroffen?',
    ['Kleinhirn', 'Hinterhauptslappen', 'Schläfenlappen', 'Rückenmark im Lendenbereich'],
    ['Das Kleinhirn stimmt Bewegungen fein ab. Typisch bei Störung: Gang- und Standunsicherheit (Ataxie), Zittern bei Zielbewegungen. Auch Alkohol wirkt hier.']),
];

// ---------------------------------------------------------------- Auge und Ohr

const sinne: Aufgabe[] = [
  {
    id: 'sinne.auge', art: 'beschriften', figur: 'auge', topicIds: [THEMA.sinne], titel: 'Auge beschriften',
    frage: 'Beschrifte das Auge im waagerechten Schnitt. Das Licht fällt von links ein.',
    marken: [
      { nr: 1, x: 89, y: 80, label: 'Hornhaut', hinweis: 'Durchsichtige, gewölbte Vorderwand, bricht das Licht am stärksten.' },
      { nr: 2, x: 104, y: 110, label: 'Pupille', hinweis: 'Öffnung in der Mitte, wird bei Dunkelheit weit.' },
      { nr: 3, x: 104, y: 139, label: 'Regenbogenhaut (Iris)', hinweis: 'Farbiger Ring, der die Lichtmenge regelt.' },
      { nr: 4, x: 124, y: 90, label: 'Linse', hinweis: 'Elastischer Körper hinter der Pupille, ändert ihre Wölbung zum Scharfstellen.' },
      { nr: 5, x: 128, y: 164, label: 'Ziliarkörper', hinweis: 'Ring mit Muskel, an dem die Linse aufgehängt ist.' },
      { nr: 6, x: 175, y: 110, label: 'Glaskörper', hinweis: 'Gallertige Füllung des Augapfels.' },
      { nr: 7, x: 170, y: 30, label: 'Lederhaut', hinweis: 'Feste, weiße Außenhülle des Augapfels.' },
      { nr: 8, x: 226, y: 162, label: 'Netzhaut', hinweis: 'Innere Schicht mit Stäbchen und Zapfen, wandelt Licht in Nervensignale.' },
      { nr: 9, x: 236, y: 76, label: 'Gelber Fleck (Makula)', hinweis: 'Stelle des schärfsten Sehens mit den meisten Zapfen.' },
      { nr: 10, x: 284, y: 111, label: 'Sehnerv', hinweis: 'Leitet die Signale der Netzhaut zum Gehirn.' },
    ],
    erklaerung: ['Licht: Hornhaut, Pupille, Linse, Glaskörper, Netzhaut. Die Netzhaut leitet über den Sehnerv weiter.', 'Wo der Sehnerv austritt, gibt es keine Sinneszellen (blinder Fleck).'],
  },
  {
    id: 'sinne.licht', art: 'reihenfolge', topicIds: [THEMA.sinne], titel: 'Weg des Lichts',
    frage: 'Welchen Weg nimmt das Licht durch das Auge bis ins Gehirn?',
    schritte: ['Hornhaut', 'Vordere Augenkammer', 'Pupille', 'Linse', 'Glaskörper', 'Netzhaut', 'Sehnerv'],
    erklaerung: ['Hornhaut und Linse bündeln das Licht auf die Netzhaut. Eine getrübte Linse (Katarakt, grauer Star) macht das Bild unscharf und blass.'],
  },
  {
    id: 'sinne.schall', art: 'reihenfolge', topicIds: [THEMA.sinne], titel: 'Weg des Schalls',
    frage: 'Welchen Weg nimmt der Schall im Ohr?',
    schritte: ['Ohrmuschel', 'Äußerer Gehörgang', 'Trommelfell', 'Hammer', 'Amboss', 'Steigbügel', 'Ovales Fenster', 'Hörschnecke', 'Hörnerv'],
    erklaerung: ['Die drei Gehörknöchelchen im Mittelohr übertragen die Schwingung des Trommelfells auf das Innenohr.', 'Ein Ohrschmalzpfropf im äußeren Gehörgang ist eine häufige, leicht behebbare Ursache für Schwerhörigkeit im Alter.'],
  },
  frage('sinne', 'akkommodation', 'Wie stellt das Auge auf nahe Gegenstände scharf?',
    ['Der Ziliarmuskel zieht sich zusammen, die Linse wird runder', 'Die Hornhaut wird flacher', 'Die Pupille wird weit', 'Der Augapfel wird länger'],
    ['Mit dem Alter verliert die Linse ihre Elastizität: Altersweitsichtigkeit, Lesebrille ab etwa 45 Jahren.']),
  frage('sinne', 'zapfen', 'Welche Sinneszellen der Netzhaut sind für das Farbensehen zuständig?',
    ['Zapfen', 'Stäbchen', 'Haarzellen', 'Ganglienzellen'],
    ['Zapfen: Farbe und scharfes Sehen bei Helligkeit, vor allem im gelben Fleck. Stäbchen: Hell-Dunkel-Sehen in der Dämmerung.']),
  frage('sinne', 'glaukom', 'Was schädigt beim Glaukom (grüner Star) das Sehen?',
    ['Meist ein erhöhter Augeninnendruck, der den Sehnerv schädigt', 'Eine Trübung der Linse', 'Eine Entzündung der Bindehaut', 'Ein Riss im Trommelfell'],
    ['Ein akuter Glaukomanfall (harter Augapfel, starke Schmerzen, Übelkeit, rotes Auge) ist ein Notfall.']),
];

// ---------------------------------------------------------------- Haut

const hautAufgaben: Aufgabe[] = [
  {
    id: 'haut.beschriften', art: 'beschriften', figur: 'haut', topicIds: [THEMA.haut], titel: 'Haut beschriften',
    frage: 'Beschrifte den Querschnitt der Haut.',
    marken: [
      { nr: 1, x: 40, y: 38, label: 'Oberhaut (Epidermis)', hinweis: 'Äußerste Schicht aus verhornendem Plattenepithel, ohne Blutgefäße.' },
      { nr: 2, x: 40, y: 78, label: 'Lederhaut (Dermis)', hinweis: 'Mittlere Schicht aus festem Bindegewebe mit Gefäßen, Nerven und Drüsen.' },
      { nr: 3, x: 110, y: 168, label: 'Unterhaut (Subkutis)', hinweis: 'Tiefste Schicht mit Fettgewebe: Polster, Wärmeschutz und Energiespeicher.' },
      { nr: 4, x: 112, y: 14, label: 'Haar', hinweis: 'Hornfaden, der aus der Haut herausragt.' },
      { nr: 5, x: 104, y: 112, label: 'Haarwurzel', hinweis: 'Verdickter Teil in der Tiefe, aus dem das Haar wächst.' },
      { nr: 6, x: 156, y: 78, label: 'Talgdrüse', hinweis: 'Mündet am Haar und fettet Haut und Haar ein.' },
      { nr: 7, x: 244, y: 140, label: 'Schweißdrüse', hinweis: 'Knäuel in der Tiefe, Ausführungsgang zur Oberfläche: Kühlung durch Verdunstung.' },
      { nr: 8, x: 186, y: 110, label: 'Blutgefäß', hinweis: 'Versorgt die Haut, weitet oder verengt sich zur Temperaturregelung.' },
    ],
    erklaerung: ['Drei Schichten: Oberhaut, Lederhaut, Unterhaut. Die Oberhaut wird aus der Lederhaut ernährt, sie hat selbst keine Gefäße.', 'Bei Dekubitus und Wunden sagt die betroffene Schicht viel über den Schweregrad aus.'],
  },
  frage('haut', 'funktionen', 'Welche Aufgaben hat die Haut? Wähle alle zutreffenden.',
    ['Schutz vor Keimen, Austrocknung und UV-Licht', 'Temperaturregelung', 'Sinnesorgan für Druck, Schmerz und Temperatur', 'Bildung von Vitamin D mit Sonnenlicht', 'Bildung von Insulin'],
    ['Insulin bildet die Bauchspeicheldrüse. Die Haut ist mit etwa 2 Quadratmetern das größte Organ.'],
    [0, 1, 2, 3], true),
  frage('haut', 'saeureschutz', 'Was ist der Säureschutzmantel der Haut?',
    ['Ein leicht saurer Film (pH etwa 5,5) auf der Oberfläche, der Keime hemmt', 'Eine Hornschicht in der Unterhaut', 'Ein Schutzfilm aus Schweiß mit pH 9', 'Eine Creme, die man nach dem Waschen aufträgt'],
    ['Häufiges Waschen mit alkalischer Seife stört ihn. Deshalb in der Körperpflege pH-hautneutrale Waschzusätze und sparsam.']),
  frage('haut', 'dekubitus', 'Warum entsteht ein Dekubitus besonders über Knochenvorsprüngen wie Kreuzbein und Ferse?',
    ['Dort liegt wenig Unterhautfett zwischen Haut und Knochen, Druck drückt die Gefäße zu', 'Dort hat die Haut besonders viele Schweißdrüsen', 'Dort ist die Oberhaut dicker', 'Dort fehlen die Haare'],
    ['Druck über längere Zeit unterbricht die Durchblutung, das Gewebe stirbt ab. Entlastung und Bewegung sind die wichtigste Vorbeugung.']),
  {
    id: 'haut.schichten', art: 'reihenfolge', topicIds: [THEMA.haut], titel: 'Schichten der Haut',
    frage: 'Ordne die Schichten von außen nach innen.',
    schritte: ['Oberhaut', 'Lederhaut', 'Unterhaut', 'Muskelfaszie'],
    erklaerung: ['Oberhaut und Lederhaut bilden zusammen die Cutis. Darunter liegt die Unterhaut (Subkutis), dann die Faszie des Muskels.'],
  },
];

// ---------------------------------------------------------------- Hormonsystem

const hormone: Aufgabe[] = [
  {
    id: 'hormone.beschriften', art: 'beschriften', figur: 'hormone', topicIds: [THEMA.hormone], titel: 'Hormondrüsen beschriften',
    frage: 'Beschrifte die Hormondrüsen.',
    marken: [
      { nr: 1, x: 114, y: 26, label: 'Zirbeldrüse', hinweis: 'Kleine Drüse im Gehirn, bildet Melatonin für den Schlaf-wach-Rhythmus.' },
      { nr: 2, x: 92, y: 62, label: 'Hypophyse (Hirnanhangsdrüse)', hinweis: 'Übergeordnete Drüse an der Schädelbasis, steuert viele andere Hormondrüsen.' },
      { nr: 3, x: 100, y: 96, label: 'Schilddrüse', hinweis: 'Schmetterlingsförmig am Hals, ihre Hormone T3 und T4 regeln den Grundumsatz.' },
      { nr: 4, x: 80, y: 184, label: 'Nebenniere', hinweis: 'Sitzt der Niere auf: Rinde bildet Cortisol und Aldosteron, Mark Adrenalin.' },
      { nr: 5, x: 126, y: 160, label: 'Bauchspeicheldrüse (Pankreas)', hinweis: 'Ihre Inselzellen bilden Insulin und Glukagon.' },
      { nr: 6, x: 78, y: 256, label: 'Keimdrüsen (Eierstöcke bzw. Hoden)', hinweis: 'Bilden Geschlechtshormone wie Östrogen, Progesteron und Testosteron.' },
    ],
    erklaerung: ['Hypothalamus und Hypophyse steuern als Zentrale Schilddrüse, Nebennierenrinde und Keimdrüsen.', 'Die Nieren sind in der Zeichnung nur zur Orientierung eingezeichnet.'],
  },
  {
    id: 'hormone.regelkreis', art: 'reihenfolge', topicIds: [THEMA.hormone], titel: 'Regelkreis der Schilddrüse',
    frage: 'Bring den Regelkreis der Schilddrüsenhormone in die richtige Reihenfolge.',
    schritte: ['Hypothalamus schüttet TRH aus', 'Hypophyse schüttet TSH aus', 'Schilddrüse bildet T3 und T4', 'T3 und T4 steigern den Stoffwechsel', 'Hoher Hormonspiegel hemmt Hypothalamus und Hypophyse'],
    erklaerung: ['Negative Rückkopplung: Steigt der Spiegel, wird weniger nachgesteuert. So bleibt der Hormonspiegel stabil.', 'Deshalb ist bei einer Unterfunktion der Schilddrüse das TSH meist erhöht.'],
  },
  frage('hormone', 'insulin', 'Was bewirkt Insulin?',
    ['Es senkt den Blutzucker, indem Zellen Glukose aufnehmen', 'Es erhöht den Blutzucker', 'Es steigert die Herzfrequenz', 'Es lässt die Niere Wasser zurückhalten'],
    ['Glukagon ist der Gegenspieler und erhöht den Blutzucker. Beide stammen aus den Inselzellen der Bauchspeicheldrüse.']),
  frage('hormone', 'adh', 'Welches Hormon sorgt dafür, dass die Niere Wasser zurückhält?',
    ['ADH (antidiuretisches Hormon)', 'Insulin', 'Melatonin', 'TSH'],
    ['ADH wird im Hypothalamus gebildet und aus dem Hypophysenhinterlappen freigesetzt. Alkohol hemmt ADH, deshalb muss man mehr Wasser lassen.']),
  frage('hormone', 'cortison', 'Welche Folgen kann eine Langzeittherapie mit Cortison haben? Wähle alle zutreffenden.',
    ['Erhöhter Blutzucker', 'Höhere Infektanfälligkeit', 'Osteoporose', 'Dünne, verletzliche Haut', 'Dauerhaft niedriger Blutdruck'],
    ['Cortisol wirkt entzündungshemmend und immunsuppressiv, steigert den Blutzucker und baut Knochen und Haut ab. Blutdruck eher erhöht.'],
    [0, 1, 2, 3], true),
  frage('hormone', 'ueberfunktion', 'Welche Zeichen passen zu einer Schilddrüsenüberfunktion? Wähle alle zutreffenden.',
    ['Herzrasen', 'Gewichtsverlust trotz Appetit', 'Unruhe und Schwitzen', 'Ständiges Frieren', 'Verlangsamung und Müdigkeit'],
    ['Überfunktion: alles läuft schneller. Frieren, Verlangsamung und Gewichtszunahme sprechen eher für eine Unterfunktion.'],
    [0, 1, 2], true),
];

export const BEREICHE: Bereich[] = [
  {
    id: 'zelle', label: 'Zelle und Gewebe', kurz: 'Zelle beschriften, Grundgewebe, Osmose, Zellteilung',
    wissen: [
      'Zellmembran, Zellkern, Mitochondrien (Energie), raues ER (Eiweiße), Golgi-Apparat (Verpacken), Lysosomen (Abbau).',
      'Vier Grundgewebe: Epithel-, Binde- und Stütz-, Muskel-, Nervengewebe.',
      'Mitose: zwei gleiche Körperzellen. Meiose: Keimzellen mit halbem Chromosomensatz.',
    ],
  },
  {
    id: 'herz', label: 'Herz und Kreislauf', kurz: 'Herz beschriften, Weg des Blutes, Erregungsleitung',
    wissen: [
      'Rechtes Herz: sauerstoffarm zur Lunge. Linkes Herz: sauerstoffreich in den Körper.',
      'Segelklappen zwischen Vorhof und Kammer (rechts Trikuspidal-, links Mitralklappe), Taschenklappen am Ausgang (Pulmonal-, Aortenklappe).',
      'Erregung: Sinusknoten, AV-Knoten, His-Bündel, Tawara-Schenkel, Purkinje-Fasern.',
    ],
  },
  {
    id: 'atmung', label: 'Atmung', kurz: 'Atemwege beschriften, Weg der Luft, Gasaustausch',
    wissen: [
      'Luftweg: Nase, Rachen, Kehlkopf, Luftröhre, Hauptbronchien, Bronchiolen, Alveolen.',
      'Rechte Lunge drei Lappen, linke zwei. Rechter Hauptbronchus steiler.',
      'Wichtigster Atemmuskel ist das Zwerchfell, das Atemzentrum liegt im Hirnstamm.',
    ],
  },
  {
    id: 'niere', label: 'Niere und Harnwege', kurz: 'Niere beschriften, Weg des Harns, Hormone',
    wissen: [
      'Nephron = Nierenkörperchen + Nierenkanälchen. Etwa 150 bis 180 l Primärharn, 1,5 l Endharn am Tag.',
      'Harnweg: Nierenbecken, Harnleiter, Harnblase, Harnröhre.',
      'Hormone der Niere: Erythropoetin, Renin, aktives Vitamin D.',
    ],
  },
  {
    id: 'verdauung', label: 'Verdauung', kurz: 'Weg der Nahrung und der Galle, Verdauungsorgane',
    wissen: [
      'Dünndarm: Zwölffingerdarm, Leerdarm, Krummdarm. Hier werden die meisten Nährstoffe aufgenommen.',
      'Galle: gebildet in der Leber, gespeichert in der Gallenblase.',
      'Pankreas: Verdauungsenzyme sowie Insulin und Glukagon.',
    ],
  },
  {
    id: 'bewegung', label: 'Skelett und Bewegung', kurz: 'Skelett beschriften, Wirbelsäule, Gelenke',
    wissen: [
      'Speiche am Daumen, Elle am kleinen Finger. Schienbein innen, Wadenbein außen.',
      'Wirbelsäule: 7 Hals-, 12 Brust-, 5 Lendenwirbel, Kreuzbein, Steißbein.',
      'Kugelgelenke: Schulter und Hüfte. Scharniergelenke: Finger, oberes Sprunggelenk.',
    ],
  },
  {
    id: 'nerven', label: 'Nervensystem', kurz: 'Gehirn beschriften, Reflexbogen, Sympathikus',
    wissen: [
      'Großhirn: Stirn-, Scheitel-, Schläfen- und Hinterhauptslappen. Kleinhirn: Koordination. Hirnstamm: Atmung und Kreislauf.',
      'Bewegungsbahnen kreuzen: Schlaganfall links, Lähmung rechts.',
      'Reflex: Rezeptor, afferente Faser, Rückenmark, efferente Faser, Muskel.',
    ],
  },
  {
    id: 'sinne', label: 'Auge und Ohr', kurz: 'Auge beschriften, Weg des Lichts und des Schalls',
    wissen: [
      'Licht: Hornhaut, vordere Augenkammer, Pupille, Linse, Glaskörper, Netzhaut, Sehnerv.',
      'Zapfen sehen Farbe (gelber Fleck), Stäbchen hell und dunkel.',
      'Schall: Ohrmuschel, Gehörgang, Trommelfell, Hammer, Amboss, Steigbügel, Schnecke, Hörnerv.',
    ],
  },
  {
    id: 'haut', label: 'Haut', kurz: 'Schichten beschriften, Aufgaben der Haut',
    wissen: [
      'Oberhaut (ohne Gefäße), Lederhaut (Gefäße, Nerven, Drüsen), Unterhaut (Fett).',
      'Aufgaben: Schutz, Temperatur, Sinnesorgan, Vitamin D.',
      'Säureschutzmantel pH etwa 5,5.',
    ],
  },
  {
    id: 'hormone', label: 'Hormonsystem', kurz: 'Hormondrüsen beschriften, Regelkreis, Insulin, Cortison',
    wissen: [
      'Hypothalamus und Hypophyse steuern Schilddrüse, Nebennierenrinde und Keimdrüsen über Regelkreise.',
      'Insulin senkt, Glukagon erhöht den Blutzucker. ADH lässt die Niere Wasser zurückhalten.',
      'Nebenniere: Cortisol, Aldosteron (Rinde), Adrenalin (Mark).',
    ],
  },
  {
    id: 'fortpflanzung', label: 'Fortpflanzung und Entwicklung', kurz: 'Geschlechtsorgane, Zyklus, Hormone, Schwangerschaft',
    wissen: [
      'Keimdrüsen: Eierstöcke und Hoden bilden Keimzellen und Hormone.',
      'Befruchtung im Eileiter, Einnistung in der Gebärmutter, Schwangerschaft etwa 40 Wochen ab letzter Regel.',
      'Die Prostata umschließt die Harnröhre unter der Blase.',
    ],
  },
];

export const AUFGABEN: Record<BereichId, Aufgabe[]> = mitVertiefung(ergaenze<BereichId>({ zelle, herz, atmung, niere, verdauung, bewegung, nerven, sinne, haut: hautAufgaben, hormone, fortpflanzung }, ERWEITERUNG), VERTIEFUNG);
export const ALLE_AUFGABEN: Aufgabe[] = Object.values(AUFGABEN).flat();
