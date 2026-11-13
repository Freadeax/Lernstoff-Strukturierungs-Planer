// Notfall-Trainer, Bereich „Kinder und Säuglinge“ (Ausbau 2026-11-13, passend zu den Kinderfällen in
// Praxis- und Fallsimulator). Grundlage: ERC-Leitlinien 2021 (Paediatric Life Support, Fremdkörperaspiration),
// gängige Lehrbuchinhalte der Kinderkrankenpflege, Normwertbereiche nach APLS. Fachlich ungeprüft;
// der Notfallstandard der Einrichtung geht vor. Themen als Text (kein Importzyklus mit aufgaben.ts).

import type { Aufgabe } from '../quiz/quiz';

const NOTFALL = 'thema.beo.notfall';
const KINDER = 'thema.kl.paediatrie';
const VITAL = 'thema.beo.vitalzeichen';
const DEHYDRATATION = 'thema.pro.dehydratation';

export const KINDER_AUFGABEN: Aufgabe[] = [
  {
    id: 'kinder.bls.start', art: 'auswahl', topicIds: [NOTFALL, KINDER], titel: 'Reanimation beim Kind', stufe: 1,
    frage: 'Ein 3-jähriges Kind reagiert nicht und atmet nicht normal. Womit beginnst du als Pflegefachperson nach ERC?',
    optionen: ['Mit 5 Beatmungen, danach 15 Kompressionen und 2 Beatmungen im Wechsel', 'Mit 30 Kompressionen und 2 Beatmungen wie bei Erwachsenen', 'Mit 2 Minuten Kompressionen ohne Beatmung', 'Mit stabiler Seitenlage und Abwarten bis zum Eintreffen der Ärztin'],
    richtig: [0], mehrfach: false,
    erklaerung: ['Bei Kindern entsteht ein Kreislaufstillstand meist durch Sauerstoffmangel. Deshalb zuerst 5 Beatmungen, danach 15 : 2 für professionelle Helfer.', 'Wer allein und ungeübt in der Beatmung ist, beginnt mit Kompressionen. Hauptsache, es wird angefangen.'],
  },
  {
    id: 'kinder.bls.technik', art: 'zuordnen', topicIds: [NOTFALL, KINDER], titel: 'Kompression nach Alter', stufe: 2,
    frage: 'Ordne jeder Angabe zur Thoraxkompression beim Säugling (unter 1 Jahr) die richtige Ausführung zu.',
    paare: [
      { links: 'Druckpunkt', rechts: 'Untere Hälfte des Brustbeins' },
      { links: 'Technik allein', rechts: 'Zwei Finger oder umgreifende Daumen' },
      { links: 'Technik zu zweit', rechts: 'Zwei Daumen, Hände umgreifen den Brustkorb' },
      { links: 'Tiefe', rechts: 'Mindestens ein Drittel des Brustkorbs, etwa 4 cm' },
      { links: 'Frequenz', rechts: '100 bis 120 pro Minute' },
    ],
    erklaerung: ['Beim Säugling reichen Finger oder Daumen. Ab dem Kindesalter drückt man mit dem Handballen einer Hand, bei größeren Kindern mit beiden Händen, etwa 5 cm tief.', 'Nach jeder Kompression vollständig entlasten, Pausen kurz halten.'],
  },
  {
    id: 'kinder.fremdkoerper.saeugling', art: 'reihenfolge', topicIds: [NOTFALL, KINDER], titel: 'Verschluckt beim Säugling', stufe: 2,
    frage: 'Ein 8 Monate alter Säugling hat etwas verschluckt, hustet nicht mehr wirksam, ist aber noch wach. In welcher Reihenfolge gehst du vor?',
    schritte: ['Laut um Hilfe rufen lassen', 'Säugling bäuchlings auf den Unterarm legen, Kopf tiefer als der Körper', 'Bis zu 5 Schläge zwischen die Schulterblätter', 'Auf den Rücken drehen, bis zu 5 Brustkompressionen', 'Im Wechsel wiederholen, solange er wach ist und der Fremdkörper nicht draußen ist', 'Wird er bewusstlos: 5 Beatmungen und Reanimation beginnen'],
    erklaerung: ['Bei Säuglingen keine Oberbauchkompressionen (Heimlich), weil Leber und Milz leicht verletzt werden. Stattdessen Brustkompressionen wie bei der Reanimation, nur langsamer und kräftiger.', 'Solange ein Kind wirksam hustet: zum Husten ermutigen und nicht eingreifen.'],
  },
  {
    id: 'kinder.normwerte', art: 'zuordnen', topicIds: [NOTFALL, VITAL, KINDER], titel: 'Normwerte nach Alter', stufe: 2,
    frage: 'Ordne jeder Altersgruppe ihre ungefähren Normbereiche in Ruhe zu (Atemfrequenz pro Minute, Puls pro Minute).',
    paare: [
      { links: 'Säugling (unter 1 Jahr)', rechts: 'AF 30–40 · Puls 110–160' },
      { links: 'Kleinkind (2–5 Jahre)', rechts: 'AF 25–30 · Puls 95–140' },
      { links: 'Schulkind (5–12 Jahre)', rechts: 'AF 20–25 · Puls 80–120' },
      { links: 'Jugendliche (über 12 Jahre)', rechts: 'AF 15–20 · Puls 60–100' },
    ],
    erklaerung: ['Je jünger das Kind, desto schneller Atmung und Herzschlag. Erwachsenenwerte und der NEWS2 gelten für Kinder nicht.', 'Kinderstationen nutzen eigene Frühwarnscores mit Alarmgrenzen je Altersgruppe (hausintern).'],
  },
  {
    id: 'kinder.atemnot.zeichen', art: 'auswahl', topicIds: [NOTFALL, KINDER], titel: 'Atemnot beim Säugling', stufe: 1,
    frage: 'Welche Zeichen sprechen beim Säugling für eine schwere Atemnot? (mehrere richtig)',
    optionen: ['Einziehungen zwischen den Rippen und am Hals', 'Nasenflügeln und Stöhnen beim Ausatmen', 'Kopfnicken im Atemrhythmus', 'Atempausen und Trinkschwäche', 'Kräftiges Schreien mit rosiger Haut', 'Ruhiger Schlaf mit regelmäßiger Atmung'],
    richtig: [0, 1, 2, 3], mehrfach: true,
    erklaerung: ['Säuglinge zeigen Atemnot vor allem über die Atemarbeit. Stöhnen, Kopfnicken und Atempausen sind Zeichen der Erschöpfung und brauchen sofort ärztliche Beurteilung.', 'Kräftiges Schreien mit rosiger Haut zeigt eher, dass genug Luft da ist.'],
  },
  {
    id: 'kinder.krupp', art: 'auswahl', topicIds: [NOTFALL, KINDER], titel: 'Pseudokrupp', stufe: 1,
    frage: 'Ein 2-jähriges Kind wacht nachts mit bellendem Husten und pfeifendem Einatmen auf. Was tust du zuerst?',
    optionen: ['Kind beruhigen, aufrecht auf dem Arm der Eltern lassen, nicht mit dem Spatel in den Rachen schauen und ärztlich vorstellen', 'Mit dem Spatel in den Rachen schauen, um die Ursache zu finden', 'Flach hinlegen, damit es zur Ruhe kommt', 'Heiße Dampfinhalation über einem Topf vorbereiten'],
    richtig: [0], mehrfach: false,
    erklaerung: ['Aufregung verstärkt die Atemnot, Ruhe und aufrechte Haltung helfen. Ein Spatel kann bei einer Kehldeckelentzündung (Epiglottitis) einen völligen Verschluss auslösen.', 'Heißer Dampf ist wegen Verbrühungsgefahr nicht empfohlen. Kortison oder Inhalation nach ärztlicher Anordnung.'],
  },
  {
    id: 'kinder.fieberkrampf', art: 'auswahl', topicIds: [NOTFALL, KINDER], titel: 'Fieberkrampf', stufe: 2,
    frage: 'Ein Kleinkind krampft mit hohem Fieber. Was ist richtig? (mehrere richtig)',
    optionen: ['Uhrzeit festhalten und Dauer messen', 'Vor Verletzungen schützen, nicht festhalten', 'Nach dem Krampf in Seitenlage bringen und Atemwege frei halten', 'Etwas zwischen die Zähne schieben, damit es sich nicht auf die Zunge beißt', 'Sofort etwas zu trinken geben', 'Kalt abduschen, um das Fieber schnell zu senken'],
    richtig: [0, 1, 2], mehrfach: true,
    erklaerung: ['Die Krampfdauer entscheidet: Dauert er etwa 5 Minuten oder länger, wird nach Standard ein Notfallmedikament gegeben. Deshalb Uhrzeit sofort festhalten.', 'Nichts in den Mund, nichts zu trinken, solange das Kind nicht wach ist. Kaltes Abduschen kühlt gefährlich aus.'],
  },
  {
    id: 'kinder.dehydratation', art: 'auswahl', topicIds: [NOTFALL, KINDER, DEHYDRATATION], titel: 'Flüssigkeitsmangel beim Säugling', stufe: 1,
    frage: 'Welche Zeichen weisen beim Säugling auf einen Flüssigkeitsmangel hin? (mehrere richtig)',
    optionen: ['Eingesunkene Fontanelle', 'Trockene Schleimhäute, weinen ohne Tränen', 'Deutlich weniger nasse Windeln', 'Schlapp und schläfrig, kaum zu wecken', 'Gespannte, vorgewölbte Fontanelle', 'Mehr nasse Windeln als sonst'],
    richtig: [0, 1, 2, 3], mehrfach: true,
    erklaerung: ['Säuglinge haben wenig Reserven und trocknen bei Durchfall, Erbrechen oder Trinkschwäche schnell aus. Nasse Windeln zählen ist eine einfache, aussagekräftige Kontrolle.', 'Eine vorgewölbte Fontanelle spricht eher für erhöhten Hirndruck, etwa bei einer Hirnhautentzündung, und ist ebenfalls ein Alarmzeichen.'],
  },
  {
    id: 'kinder.fall.atempause', art: 'fall', topicIds: [NOTFALL, KINDER], titel: 'Fall: Atempause in der Nacht', stufe: 3,
    frage: 'Erkennst du die Gefahr und handelst richtig?',
    einstieg: 'Nachtdienst, Kinderstation. Mila, 4 Monate, liegt mit RSV-Bronchiolitis im Gitterbett. Die Mutter ruft: „Sie hat eben gar nicht geatmet!“',
    schritte: [
      {
        lage: 'Mila atmet wieder, aber flach und unregelmäßig. Die Lippen sind blass. Sie liegt auf dem Bauch.',
        frage: 'Was tust du zuerst?', optionen: ['Auf den Rücken drehen, sanft stimulieren, Atmung und Hautfarbe beurteilen, nach Hilfe klingeln', 'Kräftig rütteln, damit sie richtig wach wird', 'Die Mutter beruhigen, Säuglinge atmen im Schlaf unregelmäßig', 'Zuerst die Temperatur messen'],
        richtig: [0], mehrfach: false,
        warum: 'Atempausen bei einem jungen Säugling mit RSV sind ein Alarmzeichen. Nur sanft stimulieren, Schütteln kann schwere Hirnverletzungen verursachen.',
      },
      {
        lage: 'Mila atmet nach sanfter Berührung regelmäßiger, Sättigung 89 %, Atemfrequenz 66, tiefe Einziehungen. Die Kollegin ist da.',
        frage: 'Was folgt jetzt? (mehrere richtig)', optionen: ['Ärztin sofort informieren, mit Werten und der beobachteten Atempause', 'Monitor mit Apnoealarm anschließen', 'Nase freimachen und Oberkörper leicht erhöht lagern', 'Flasche geben, damit sie zu Kräften kommt', 'Zurück auf den Bauch legen, dann atmet sie leichter'],
        richtig: [0, 1, 2], mehrfach: true,
        warum: 'Eskalieren, überwachen und die Atmung erleichtern. Trinken bei dieser Atemnot erschöpft und kann zum Verschlucken führen. Säuglinge schlafen ohne Anordnung in Rückenlage.',
      },
      {
        lage: 'Die Ärztin ordnet Sauerstoff, Magensonde und Infusion an. Mila schläft mit Nasenbrille ein.',
        frage: 'Worauf achtest du in der Nacht besonders?', optionen: ['Alarme hörbar lassen, Atmung, Sättigung, Sondenmengen und Windeln engmaschig kontrollieren und dokumentieren', 'Alarme leiser stellen, damit Mutter und Kind schlafen', 'Erst morgens wieder messen, sie ist jetzt behandelt', 'Die Infusion schneller laufen lassen, damit sie schneller trinkt'],
        richtig: [0], mehrfach: false,
        warum: 'Die Gefahr erneuter Atempausen bleibt in der Nacht bestehen. Laufraten gelten nach Anordnung.',
      },
    ],
    erklaerung: ['Beim Säugling sind Atempausen, Stöhnen und Trinkschwäche frühe Warnzeichen. Sanft stimulieren, sofort eskalieren, überwachen und dokumentieren.'],
  },
  {
    id: 'kinder.fall.erdnuss', art: 'fall', topicIds: [NOTFALL, KINDER], titel: 'Fall: Erdnuss im Spielzimmer', stufe: 3,
    frage: 'Entfernst du den Fremdkörper sicher?',
    einstieg: 'Spielzimmer der Kinderstation. Paul, 2 Jahre, hat sich eine Erdnuss in den Mund gesteckt und hustet plötzlich heftig.',
    schritte: [
      {
        lage: 'Paul hustet kräftig und laut, wird rot im Gesicht, kann zwischendurch weinen.',
        frage: 'Was tust du?', optionen: ['Zum Husten ermutigen, bei ihm bleiben und beobachten', 'Sofort Rückenschläge geben', 'Mit dem Finger blind im Mund nach der Erdnuss suchen', 'Ihm schnell etwas zu trinken geben'],
        richtig: [0], mehrfach: false,
        warum: 'Wirksamer Husten ist die beste Hilfe. Eingreifen erst, wenn der Husten unwirksam wird. Blindes Suchen schiebt den Fremdkörper tiefer.',
      },
      {
        lage: 'Der Husten wird leise und tonlos, Paul greift sich an den Hals, die Lippen werden blau. Er ist noch wach.',
        frage: 'Was jetzt?', optionen: ['Hilfe rufen lassen, bis zu 5 Rückenschläge, dann bis zu 5 Oberbauchkompressionen, im Wechsel', 'Bis zu 5 Rückenschläge, dann Brustkompressionen wie beim Säugling', 'Kopf überstrecken und beatmen', 'Hinlegen und Atmung 10 Sekunden prüfen'],
        richtig: [0], mehrfach: false,
        warum: 'Ab dem ersten Lebensjahr folgen auf die Rückenschläge Oberbauchkompressionen. Beim Säugling stattdessen Brustkompressionen.',
      },
      {
        lage: 'Paul wird schlaff und reagiert nicht mehr.',
        frage: 'Wie geht es weiter?', optionen: ['Hinlegen, Reanimationsteam alarmieren, Mund ansehen und nur sichtbaren Fremdkörper entfernen, 5 Beatmungen, dann Reanimation 15 : 2', 'Weiter Oberbauchkompressionen im Stehen', 'Stabile Seitenlage und warten', 'Mit der Zange tief im Rachen suchen'],
        richtig: [0], mehrfach: false,
        warum: 'Bei Bewusstlosigkeit beginnt die Reanimation. Die Kompressionen erhöhen den Druck im Brustkorb und können den Fremdkörper lösen. Nur sichtbare Fremdkörper entfernen.',
      },
    ],
    erklaerung: ['Wirksamer Husten: ermutigen. Unwirksamer Husten bei Bewusstsein: Rückenschläge und Oberbauch- bzw. beim Säugling Brustkompressionen. Bewusstlos: Reanimation.'],
  },
];

export const KINDER_VERTIEFUNG: Record<string, string[]> = {
  'kinder.bls.start': [
    'Erwachsene haben meist ein Herzproblem und noch Sauerstoff im Blut, deshalb beginnt man dort mit Kompressionen. Kinder haben meist erst ein Atemproblem, dann bleibt das Herz stehen. Die 5 Beatmungen bringen zuerst Sauerstoff.',
    'Beatmung beim Kind mit Beutel und passender Maske: Kopf in Neutralstellung (Säugling) bzw. leicht überstreckt (Kind), so viel Luft, dass sich der Brustkorb sichtbar hebt.',
  ],
  'kinder.bls.technik': [
    'Die umgreifende Zwei-Daumen-Technik erzeugt beim Säugling mehr Druck als zwei Finger und ermüdet weniger. Sie geht aber nur, wenn eine zweite Person beatmet.',
    'Ein Drittel des Brustkorbs ist beim Säugling etwa 4 cm, beim Kind etwa 5 cm. Zu flach drücken ist der häufigste Fehler.',
  ],
  'kinder.fremdkoerper.saeugling': [
    'Kopf tief und Bauchlage nutzen die Schwerkraft. Der Kopf wird am Unterkiefer gestützt, ohne den Hals zusammenzudrücken.',
    'Nach erfolgreicher Entfernung ärztlich untersuchen lassen: Rückenschläge und Kompressionen können verletzen, und Reste können in den Bronchien bleiben.',
  ],
  'kinder.normwerte': [
    'Die Bereiche sind Orientierungswerte (Advanced Paediatric Life Support). Fieber, Schreien und Schmerz erhöhen Atmung und Puls. Wichtiger als ein Einzelwert ist der Verlauf.',
    'Ein langsamer Puls beim Säugling ist ein spätes und sehr ernstes Zeichen, oft durch Sauerstoffmangel. Er kündigt den Kreislaufstillstand an.',
  ],
  'kinder.atemnot.zeichen': [
    'Säuglinge atmen vor allem durch die Nase. Eine verstopfte Nase kann deshalb Atmen und Trinken stark behindern, Nase freimachen hilft oft sofort.',
    'Die Sättigung fällt bei Kindern oft erst spät. Bis dahin kompensieren sie über mehr Atemarbeit, und genau die sieht man an Einziehungen und Nasenflügeln.',
  ],
  'kinder.krupp': [
    'Pseudokrupp ist meist eine Virusinfektion, die den Kehlkopf unter den Stimmbändern anschwellen lässt. Die Enge macht den bellenden Husten und das Pfeifen beim Einatmen (Stridor).',
    'Warnzeichen für einen Notfall: Stridor in Ruhe, Unruhe, Blässe, Speichelfluss mit hohem Fieber und kloßiger Sprache (Verdacht Epiglottitis).',
  ],
  'kinder.fieberkrampf': [
    'Fieberkrämpfe treten meist zwischen 6 Monaten und 5 Jahren auf und hören oft von selbst nach wenigen Minuten auf. Für Eltern sind sie erschreckend.',
    'Nach dem Krampf ist das Kind oft lange schläfrig. Atmung, Sättigung und Bewusstsein engmaschig kontrollieren, Ablauf genau dokumentieren.',
  ],
  'kinder.dehydratation': [
    'Je kleiner das Kind, desto größer ist sein Wasseranteil und sein Umsatz. Ein Säugling braucht pro Kilogramm viel mehr Flüssigkeit als ein Erwachsener.',
    'Gewicht ist das genaueste Maß: Ein Verlust von 5 % des Körpergewichts zeigt einen deutlichen Mangel. Deshalb werden Säuglinge bei Aufnahme gewogen.',
  ],
  'kinder.fall.atempause': [
    'Ehemalige Frühgeborene und Säuglinge in den ersten Lebensmonaten haben bei RSV ein besonders hohes Risiko für Atempausen.',
    'RSV ist hoch ansteckend. Kontaktisolierung und Händehygiene schützen andere Kinder auf Station, vor allem abwehrgeschwächte.',
  ],
  'kinder.fall.erdnuss': [
    'Nüsse, Trauben und kleine Spielzeugteile gehören zu den häufigsten Ursachen. Kleinkinder unter 4 Jahren sollten keine ganzen Nüsse bekommen.',
    'Auch wenn der Husten aufhört, kann ein Teil in die Bronchien gerutscht sein. Anhaltender Husten oder Pfeifen danach muss ärztlich abgeklärt werden.',
  ],
};
