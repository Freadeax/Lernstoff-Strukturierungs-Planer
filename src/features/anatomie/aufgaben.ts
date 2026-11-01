// Anatomie-Trainer: Abbildungen beschriften, Wege in die richtige Reihenfolge bringen, Funktionen zuordnen.
// Inhalte sind Grundlagenwissen aus Anatomie und Physiologie (Lehrbuchstand), schematisch vereinfacht.

import type { Aufgabe, AuswahlAufgabe } from '../quiz/quiz';

export type BereichId = 'herz' | 'atmung' | 'niere' | 'verdauung';
export interface Bereich { id: BereichId; label: string; kurz: string; wissen: string[] }

export const THEMA: Record<BereichId, string> = {
  herz: 'thema.ap.herz', atmung: 'thema.ap.atmung', niere: 'thema.ap.niere', verdauung: 'thema.ap.verdauung',
};

const TITEL: Record<BereichId, string> = { herz: 'Herz und Kreislauf', atmung: 'Atmung', niere: 'Niere und Harnwege', verdauung: 'Verdauung' };

function frage(bereich: BereichId, id: string, f: string, optionen: string[], erklaerung: string[], richtig = [0], mehrfach = false): AuswahlAufgabe {
  return { id: `${bereich}.${id}`, art: 'auswahl', topicIds: [THEMA[bereich]], titel: TITEL[bereich], frage: f, optionen, richtig, mehrfach, erklaerung };
}

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

export const BEREICHE: Bereich[] = [
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
];

export const AUFGABEN: Record<BereichId, Aufgabe[]> = { herz, atmung, niere, verdauung };
export const ALLE_AUFGABEN: Aufgabe[] = Object.values(AUFGABEN).flat();
