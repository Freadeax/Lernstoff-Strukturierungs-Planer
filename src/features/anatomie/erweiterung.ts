// Anatomie-Trainer, Ausbau: Zuordnungen und Fälle, die Bau und Funktion auf Beobachtungen am Menschen übertragen.
// Themen als Text (aufgaben.ts importiert diese Datei, kein Zyklus). Übliches Lehrbuchwissen ohne Beleg aus eigenem Material.

import type { Aufgabe } from '../quiz/quiz';

type B = 'herz' | 'atmung' | 'niere' | 'verdauung' | 'bewegung' | 'nerven' | 'sinne' | 'haut' | 'hormone';

export const ERWEITERUNG: Partial<Record<B, Aufgabe[]>> = {
  herz: [
    {
      id: 'zu.herz', art: 'zuordnen', topicIds: ['thema.ap.herz'], titel: 'Herz: Bau und Aufgabe', stufe: 2,
      frage: 'Ordne jeder Struktur ihre Aufgabe zu.',
      paare: [
        { links: 'Sinusknoten', rechts: 'Gibt den Takt vor' },
        { links: 'AV-Knoten', rechts: 'Verzögert die Weiterleitung zu den Kammern' },
        { links: 'Mitralklappe', rechts: 'Verhindert Rückfluss in den linken Vorhof' },
        { links: 'Koronararterien', rechts: 'Versorgen den Herzmuskel' },
        { links: 'Linke Kammer', rechts: 'Pumpt Blut in den Körperkreislauf' },
      ],
      erklaerung: ['Bau und Funktion gehören zusammen: Wer weiß, was eine Struktur tut, kann ableiten, was bei ihrem Ausfall passiert.'],
    },
    {
      id: 'fall.herzschwaeche', art: 'fall', topicIds: ['thema.ap.herz', 'thema.kl.herz'], titel: 'Fall: Wenn das Herz schwächer wird', stufe: 3,
      frage: 'Welche Beobachtung passt zu welcher Herzseite?',
      einstieg: 'Herr T., 79 Jahre, ist seit Tagen schneller außer Atem. Er schläft nur noch mit drei Kissen.',
      schritte: [
        { lage: 'Beim Abhören hört die Ärztin feuchte Rasselgeräusche über beiden Lungen.', frage: 'Welche Herzseite pumpt hier am ehesten zu schwach?', optionen: ['Die linke, Blut staut sich in die Lunge zurück', 'Die rechte, Blut staut sich in die Lunge zurück', 'Keine, das ist eine reine Lungenerkrankung'], richtig: [0], mehrfach: false, warum: 'Vor der linken Kammer liegt der Lungenkreislauf. Pumpt sie zu schwach, staut sich Blut in die Lungenvenen und Flüssigkeit tritt in die Alveolen aus.' },
        { lage: 'Am Abend sind beide Unterschenkel geschwollen, eine Delle bleibt nach Fingerdruck stehen.', frage: 'Was erklärt die Beinödeme am besten?', optionen: ['Stau vor dem rechten Herzen im Körperkreislauf', 'Zu viel Sauerstoff im Blut', 'Ein verengtes Gefäß in der Lunge'], richtig: [0], mehrfach: false, warum: 'Vor dem rechten Herzen liegen die Körpervenen. Staut sich dort Blut, wird Flüssigkeit ins Gewebe gedrückt, zuerst an den tiefsten Stellen.' },
        { lage: 'Herr T. soll Furosemid bekommen und täglich gewogen werden.', frage: 'Was beobachtest du zusätzlich?', optionen: ['Ein- und Ausfuhr', 'Zeichen von Kaliummangel wie Muskelschwäche', 'Schwindel beim Aufstehen', 'Die Haarfarbe'], richtig: [0, 1, 2], mehrfach: true, warum: 'Das Diuretikum schwemmt Wasser und Kalium aus und kann den Blutdruck senken. Gewicht und Bilanz zeigen, ob die Ödeme zurückgehen.' },
      ],
      erklaerung: ['Linksherzschwäche zeigt sich an der Lunge, Rechtsherzschwäche am Körper. Oft sind beide Seiten betroffen.'],
    },
  ],
  atmung: [
    {
      id: 'fall.atmung', art: 'fall', topicIds: ['thema.ap.atmung'], titel: 'Fall: Atemnot nach dem Essen', stufe: 3,
      frage: 'Wie hängen Bau der Atemwege und Beobachtung zusammen?',
      einstieg: 'Frau L., 82 Jahre, hatte vor zwei Wochen einen Schlaganfall. Beim Mittagessen hustet sie oft, ihre Stimme klingt danach gurgelnd.',
      schritte: [
        { lage: 'Du vermutest, dass Nahrung in die Atemwege gelangt.', frage: 'Welcher Schutzmechanismus ist am ehesten gestört?', optionen: ['Der Verschluss des Kehlkopfeingangs durch den Kehldeckel beim Schlucken', 'Der Gasaustausch in den Alveolen', 'Die Arbeit des Zwerchfells'], richtig: [0], mehrfach: false, warum: 'Nach einem Schlaganfall ist der fein abgestimmte Schluckreflex oft gestört. Husten beim Essen ist ein Warnzeichen.' },
        { lage: 'Zwei Tage später hat sie Fieber, das Röntgenbild zeigt eine Lungenentzündung.', frage: 'Wo ist eine Aspirationspneumonie im Sitzen am wahrscheinlichsten?', optionen: ['Im rechten Unterlappen', 'In der linken Lungenspitze', 'Gleich verteilt auf beide Lungen'], richtig: [0], mehrfach: false, warum: 'Der rechte Hauptbronchus verläuft steiler und ist weiter. Aspiriertes Material folgt der Schwerkraft nach unten.' },
        { lage: 'Frau L. soll wieder essen.', frage: 'Was hilft beim Essen?', optionen: ['Aufrecht sitzen, Kopf leicht nach vorn geneigt', 'Kleine Bissen und Zeit lassen', 'Konsistenz nach logopädischer Einschätzung anpassen', 'Im Liegen essen, damit sie sich nicht anstrengt'], richtig: [0, 1, 2], mehrfach: true, warum: 'Aufrechte Haltung und Kinn leicht zur Brust verengen den Weg in die Luftröhre. Die Logopädie legt fest, welche Konsistenz sicher ist.' },
      ],
      erklaerung: ['Wer den Weg von Luft und Nahrung kennt, versteht Aspiration und kann gezielt vorbeugen.'],
    },
  ],
  niere: [
    {
      id: 'zu.niere', art: 'zuordnen', topicIds: ['thema.ap.niere'], titel: 'Niere: Hormone und Wirkung', stufe: 2,
      frage: 'Ordne jedem Hormon seine Hauptwirkung zu.',
      paare: [
        { links: 'ADH', rechts: 'Wasser wird zurückgehalten' },
        { links: 'Aldosteron', rechts: 'Natrium wird zurückgehalten, Kalium ausgeschieden' },
        { links: 'Renin', rechts: 'Startet die Blutdruckerhöhung über Angiotensin' },
        { links: 'Erythropoetin', rechts: 'Regt die Bildung roter Blutkörperchen an' },
      ],
      erklaerung: ['Die Niere ist nicht nur Filter, sondern auch Hormondrüse und Blutdruckregler.'],
    },
  ],
  verdauung: [
    {
      id: 'zu.verdauung', art: 'zuordnen', topicIds: ['thema.ap.verdauung'], titel: 'Verdauung: Wo passiert was?', stufe: 2,
      frage: 'Ordne jede Aufgabe dem Organ zu.',
      paare: [
        { links: 'Bildet Galle', rechts: 'Leber' },
        { links: 'Speichert und dickt Galle ein', rechts: 'Gallenblase' },
        { links: 'Bildet Insulin und Verdauungsenzyme', rechts: 'Bauchspeicheldrüse' },
        { links: 'Nimmt die meisten Nährstoffe auf', rechts: 'Dünndarm' },
        { links: 'Entzieht dem Stuhl Wasser', rechts: 'Dickdarm' },
        { links: 'Bildet Salzsäure und Intrinsic Factor', rechts: 'Magen' },
      ],
      erklaerung: ['Fällt ein Organ aus, fehlt genau diese Aufgabe: ohne Galle keine gute Fettverdauung, ohne Intrinsic Factor kein Vitamin B12.'],
    },
  ],
  nerven: [
    {
      id: 'fall.schlaganfall-anatomie', art: 'fall', topicIds: ['thema.ap.nerven'], titel: 'Fall: Ausfälle verstehen', stufe: 3,
      frage: 'Welche Hirnregion erklärt die Beobachtung?',
      einstieg: 'Herr M., 71 Jahre, Rechtshänder, hat einen Schlaganfall in der linken Großhirnhälfte.',
      schritte: [
        { lage: 'Er kann den rechten Arm kaum bewegen.', frage: 'Warum ist die rechte Seite betroffen?', optionen: ['Die Bewegungsbahnen kreuzen im Hirnstamm auf die Gegenseite', 'Die rechte Hirnhälfte steuert die rechte Seite', 'Das Kleinhirn ist ausgefallen'], richtig: [0], mehrfach: false, warum: 'Die Pyramidenbahn kreuzt im verlängerten Mark. Ein Schaden links zeigt sich rechts.' },
        { lage: 'Er versteht, was du sagst, findet aber kaum Worte.', frage: 'Wie heißt diese Störung?', optionen: ['Aphasie', 'Ataxie', 'Dysphagie'], richtig: [0], mehrfach: false, warum: 'Bei den meisten Rechtshändern liegt das Sprachzentrum links. Aphasie ist eine Sprachstörung, keine Störung des Denkens.' },
        { lage: 'Du möchtest mit ihm sprechen und ihn unterstützen.', frage: 'Was hilft in der Kommunikation?', optionen: ['Kurze, klare Sätze und Zeit zum Antworten', 'Ja-Nein-Fragen und Gesten oder Bildkarten', 'Lauter sprechen, damit er besser versteht', 'Für ihn die Sätze zu Ende sprechen, um ihn zu entlasten'], richtig: [0, 1], mehrfach: true, warum: 'Er hört gut, also hilft Lautstärke nicht. Sätze zu beenden nimmt ihm die Übung und kann ihn kränken.' },
      ],
      erklaerung: ['Aus dem Ort eines Schadens lassen sich die Ausfälle ableiten und umgekehrt.'],
    },
  ],
  hormone: [
    {
      id: 'zu.hormone', art: 'zuordnen', topicIds: ['thema.ap.hormone'], titel: 'Hormone und ihre Drüse', stufe: 2,
      frage: 'Ordne jedem Hormon die bildende Drüse zu.',
      paare: [
        { links: 'Insulin', rechts: 'Bauchspeicheldrüse' },
        { links: 'Cortisol', rechts: 'Nebennierenrinde' },
        { links: 'Adrenalin', rechts: 'Nebennierenmark' },
        { links: 'Thyroxin (T4)', rechts: 'Schilddrüse' },
        { links: 'TSH', rechts: 'Hypophyse' },
      ],
      erklaerung: ['Die Nebenniere besteht aus zwei Drüsen: Die Rinde bildet Cortisol und Aldosteron, das Mark Adrenalin und Noradrenalin.'],
    },
  ],
};

export const ERWEITERUNG_VERTIEFUNG: Record<string, string[]> = {
  'zu.herz': [
    'Das Reizleitungssystem ist eine Kette: Fällt ein Glied aus, übernimmt das nächste mit langsamerem Takt (Ersatzrhythmus). Deshalb sind Blockierungen im AV-Knoten oft mit einem langsamen Puls verbunden.',
    'Die Klappen öffnen und schließen sich passiv durch Druckunterschiede. Ihre Schließgeräusche sind die Herztöne, die man mit dem Stethoskop hört.',
  ],
  'fall.herzschwaeche': [
    'Atemnot im Liegen (Orthopnoe) entsteht, weil im Liegen mehr Blut aus den Beinen zum Herzen zurückfließt. Ein schwaches Herz kann diese Menge nicht weiterpumpen.',
    'Nächtliches Wasserlassen (Nykturie) ist typisch: Im Liegen werden Ödeme ausgeschwemmt und über die Niere ausgeschieden.',
  ],
  'fall.atmung': [
    'Eine Schluckstörung wird mit Screenings (z. B. Wasserschlucktest nach Hausstandard) und durch die Logopädie genauer untersucht, manchmal mit einer Videoendoskopie.',
    'Mundpflege senkt das Risiko einer Aspirationspneumonie, weil weniger Keime aus dem Mund in die Lunge gelangen.',
  ],
  'zu.niere': [
    'Das Renin-Angiotensin-Aldosteron-System springt an, wenn die Niere zu wenig durchblutet wird, etwa bei Blutverlust oder Flüssigkeitsmangel. Es hält Wasser und Salz zurück und verengt die Gefäße.',
    'Medikamente greifen genau hier an: ACE-Hemmer und Sartane bremsen das System, Aldosteronantagonisten (z. B. Spironolacton) blockieren Aldosteron.',
  ],
  'zu.verdauung': [
    'Leber, Gallenblase und Bauchspeicheldrüse geben ihre Säfte gemeinsam in den Zwölffingerdarm ab. Ein Stein an der Mündung kann deshalb Gallenstau und Bauchspeicheldrüsenentzündung gleichzeitig auslösen.',
    'Die Leber hat noch viele weitere Aufgaben: Sie speichert Zucker, bildet Gerinnungsfaktoren und Eiweiße wie Albumin und baut Medikamente und Giftstoffe ab.',
  ],
  'fall.schlaganfall-anatomie': [
    'Bei einem Schaden in der rechten Hirnhälfte kann statt Aphasie ein Neglect auftreten: Die linke Seite des Körpers und des Raumes wird nicht beachtet. Betroffene essen dann nur die rechte Tellerhälfte.',
    'In der Frühphase nach einem Schlaganfall ist die Rehabilitation am wirksamsten. Pflege fördert sie durch aktivierende Pflege im Alltag, etwa nach dem Bobath-Konzept.',
  ],
  'zu.hormone': [
    'Hypothalamus und Hypophyse steuern viele Hormondrüsen über Steuerhormone (z. B. TSH für die Schilddrüse, ACTH für die Nebennierenrinde). Insulin und Adrenalin werden dagegen direkt über Blutzucker bzw. Nervensignale gesteuert.',
    'Hormone wirken langsamer als Nerven, dafür länger und im ganzen Körper. Beide Systeme arbeiten zusammen, etwa bei Stress.',
  ],
};
