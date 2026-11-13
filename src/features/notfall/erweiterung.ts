// Notfall-Trainer, Ausbau: Anwenden (Zuordnen, Ordnen) und Transfer (Fälle in mehreren Schritten).
// Grundlage wie aufgaben.ts: ERC-Leitlinien 2021 (BLS Erwachsene), ABCDE-Schema, gängige Lehrbuchinhalte.
// Der Notfallstandard der Einrichtung geht vor. Themen als Text (kein Importzyklus mit aufgaben.ts).

import type { Aufgabe } from '../quiz/quiz';

const NOTFALL = 'thema.beo.notfall';
const VITAL = 'thema.beo.vitalzeichen';
const DIABETES = 'thema.kl.diabetes';
const SCHLAGANFALL = 'thema.kl.neuro.schlaganfall';
const UEBERGABE = 'thema.pp.uebergabe';

export const ERWEITERUNG: Partial<Record<'bls' | 'abcde' | 'situationen', Aufgabe[]>> = {
  bls: [
    {
      id: 'bls.zu.rollen', art: 'zuordnen', topicIds: [NOTFALL], titel: 'Reanimation im Team', stufe: 2,
      frage: 'Ihr seid zu dritt im Zimmer. Ordne jeder Aufgabe zu, wann sie dran ist.',
      paare: [
        { links: 'Bewusstsein und Atmung prüfen', rechts: 'Sofort, vor allem anderen' },
        { links: 'Reanimationsteam alarmieren', rechts: 'Sofort, sobald keine normale Atmung feststeht' },
        { links: 'Thoraxkompressionen', rechts: 'Sofort, sobald keine normale Atmung feststeht' },
        { links: 'AED anschließen', rechts: 'Sobald er da ist, ohne die Kompressionen lange zu unterbrechen' },
        { links: 'Helfer an der Herzdruckmassage wechseln', rechts: 'Etwa alle 2 Minuten' },
        { links: 'Ablauf und Uhrzeiten dokumentieren', rechts: 'Nebenbei durch eine freie Person, ausführlich danach' },
      ],
      erklaerung: ['Prüfen, Alarm und Kompressionen laufen fast gleichzeitig. Wer gerade nicht drückt, holt Material, dokumentiert oder übernimmt den nächsten Wechsel.'],
    },
    {
      id: 'bls.fall.zimmer', art: 'fall', topicIds: [NOTFALL], titel: 'Fall: Leblos im Zimmer', stufe: 3,
      frage: 'Führst du die Reanimation bis zum Eintreffen des Teams sicher?',
      einstieg: 'Spätdienst. Du betrittst das Zimmer von Herrn B., 81 Jahre, und findest ihn zusammengesunken im Sessel. Er reagiert nicht auf lautes Ansprechen.',
      schritte: [
        {
          lage: 'Du rüttelst an den Schultern, keine Reaktion. Kopf überstreckt, du siehst, hörst und fühlst 10 Sekunden: einmal eine tiefe, schnappende Bewegung, sonst nichts.',
          frage: 'Was folgt jetzt?', optionen: ['Laut um Hilfe rufen, Reanimationsteam alarmieren lassen und mit Kompressionen beginnen', 'Weitere 30 Sekunden beobachten, ob er wieder normal atmet', 'Stabile Seitenlage, weil er noch atmet', 'Zuerst den Blutdruck messen'],
          richtig: [0], mehrfach: false,
          warum: 'Schnappatmung ist keine normale Atmung. Ohne normale Atmung wird reanimiert, jede Minute ohne Kompression senkt die Überlebenschance.',
        },
        {
          lage: 'Eine Kollegin kommt dazu. Herr B. sitzt noch im Sessel.',
          frage: 'Wie geht es weiter? Wähle alle zutreffenden.', optionen: ['Gemeinsam auf den Boden legen, flach auf harter Unterlage', 'Kollegin alarmiert das Team und bringt AED und Notfallwagen', '30 Kompressionen, 2 Beatmungen mit Beutel und Maske, sobald vorhanden', 'Erst den Patienten zurück ins Bett tragen und die Matratze aufpumpen'],
          richtig: [0, 1, 2], mehrfach: true,
          warum: 'Im Sessel oder auf weicher Matratze ist keine wirksame Kompression möglich. Der Boden ist die schnellste harte Unterlage.',
        },
        {
          lage: 'Der AED ist da. Die Elektroden kleben, das Gerät sagt: „Analyse läuft, Patienten nicht berühren.“ Danach: „Schock empfohlen.“',
          frage: 'Was ist richtig?', optionen: ['Alle weg vom Patienten, Schock auslösen, danach sofort mit Kompressionen weitermachen', 'Nach dem Schock zuerst 10 Sekunden den Puls tasten', 'Während der Analyse weiterdrücken, damit keine Pause entsteht', 'Keinen Schock geben, weil er alt ist'],
          richtig: [0], mehrfach: false,
          warum: 'Nach dem Schock sofort 2 Minuten weiterdrücken. Der AED analysiert danach erneut. Eine Pulskontrolle direkt nach dem Schock kostet Zeit und Durchblutung.',
        },
        {
          lage: 'Das Reanimationsteam übernimmt. Die Ärztin fragt: „Was wissen wir?“',
          frage: 'Was sagst du in der Übergabe? Wähle alle zutreffenden.', optionen: ['Uhrzeit des Auffindens und Beginn der Reanimation', 'Anzahl der Schocks', 'Was über den Patienten bekannt ist, z. B. Diagnosen und eine Patientenverfügung', 'Was er gestern zu Abend gegessen hat'],
          richtig: [0, 1, 2], mehrfach: true,
          warum: 'Zeiten und Schocks bestimmen das weitere Vorgehen. Eine Patientenverfügung oder ein dokumentierter Verzicht auf Reanimation muss das Team sofort erfahren.',
        },
      ],
      erklaerung: ['Prüfen, Alarm, drücken. Pausen so kurz wie möglich, nach dem Schock sofort weiter.', 'Strukturiert übergeben: Zeiten, Maßnahmen, Vorgeschichte, Patientenwille.'],
    },
  ],
  abcde: [
    {
      id: 'abcde.zu.befunde', art: 'zuordnen', topicIds: [NOTFALL, VITAL], titel: 'Befund und Buchstabe', stufe: 2,
      frage: 'Ordne jeden Befund dem Buchstaben des ABCDE-Schemas zu, unter dem du ihn erhebst.',
      paare: [
        { links: 'Pfeifendes Geräusch beim Einatmen (Stridor)', rechts: 'A – Atemweg' },
        { links: 'Atemfrequenz 30/min, Einsatz der Atemhilfsmuskulatur', rechts: 'B – Atmung' },
        { links: 'Rekapillarisierungszeit 4 Sekunden', rechts: 'C – Kreislauf' },
        { links: 'Reagiert nur auf Schmerzreiz', rechts: 'D – Neurologie' },
        { links: 'Blutzucker 42 mg/dl', rechts: 'D – Neurologie' },
        { links: 'Großer Bluterguss am Oberschenkel nach Sturz', rechts: 'E – Untersuchung und Umgebung' },
      ],
      erklaerung: ['Atemweg vor Atmung vor Kreislauf. Unter D stehen Bewusstsein (AVPU), Pupillen und der Blutzucker. Unter E wird der ganze Körper angesehen.'],
    },
    {
      id: 'abcde.fall.nacht', art: 'fall', topicIds: [NOTFALL, VITAL, UEBERGABE], titel: 'Fall: Nachtdienst, Patientin verschlechtert sich', stufe: 3,
      frage: 'Schätzt du nach ABCDE ein und meldest du richtig?',
      einstieg: 'Nachtdienst, 2 Uhr. Frau S., 68 Jahre, zweiter Tag nach einer Darmoperation, klingelt. Sie sagt, sie bekomme schlecht Luft und fühle sich elend.',
      schritte: [
        {
          lage: 'Sie spricht in ganzen Sätzen, keine auffälligen Atemgeräusche. Atemfrequenz 26/min, SpO2 91 % ohne Sauerstoff.',
          frage: 'Wie bewertest du A und B?', optionen: ['A frei, weil sie in ganzen Sätzen spricht. B auffällig: zu schnelle Atmung und niedrige Sättigung', 'A und B unauffällig, sie kann ja sprechen', 'A gestört, weil sie über Luftnot klagt', 'B ist erst auffällig, wenn die Sättigung unter 80 % fällt'],
          richtig: [0], mehrfach: false,
          warum: 'Wer in ganzen Sätzen spricht, hat einen freien Atemweg. Atemfrequenz über 20 und SpO2 unter 95 % sind beim Erwachsenen ohne Lungenvorerkrankung Warnzeichen.',
        },
        {
          lage: 'Du setzt sie mit erhöhtem Oberkörper hin. Puls 118/min, RR 96/58 mmHg (sonst um 130/80), Haut kühl und marmoriert, Temperatur 38,9 °C.',
          frage: 'Was bedeutet der Befund unter C?', optionen: ['Kreislauf instabil: schneller Puls, niedriger Blutdruck und schlechte Durchblutung der Haut', 'Normale Reaktion auf Fieber, nichts weiter zu tun', 'Nur der Blutdruck ist auffällig', 'Ein Messfehler, weil nachts der Blutdruck immer sinkt'],
          richtig: [0], mehrfach: false,
          warum: 'Tachykardie, Blutdruckabfall, marmorierte Haut und Fieber nach einer Operation sprechen für eine Sepsis, etwa durch eine Undichtigkeit an der Darmnaht.',
        },
        {
          lage: 'Sie ist wach, aber langsamer als am Abend. Blutzucker 132 mg/dl.',
          frage: 'Was tust du jetzt? Wähle alle zutreffenden.', optionen: ['Sofort ärztlichen Dienst rufen, nicht bis zur Visite warten', 'Sauerstoff nach Hausstandard beziehungsweise ärztlicher Anordnung', 'Bei ihr bleiben oder eine Kollegin bleiben lassen und in kurzen Abständen neu einschätzen', 'Eine Schlaftablette geben, damit sie zur Ruhe kommt'],
          richtig: [0, 1, 2], mehrfach: true,
          warum: 'Eine neu verlangsamte Patientin mit instabilem Kreislauf ist ein Notfall. Beruhigungsmittel würden Atmung und Bewusstsein zusätzlich dämpfen und die Verschlechterung verdecken.',
        },
        {
          lage: 'Der Arzt ist am Telefon.',
          frage: 'Welche Meldung ist nach SBAR aufgebaut?', optionen: ['„Frau S., Zimmer 12, zweiter Tag nach Darm-OP, ist seit 2 Uhr kurzatmig. AF 26, SpO2 91 %, Puls 118, RR 96/58, 38,9 °C, neu verlangsamt. Ich vermute eine Sepsis. Bitte kommen Sie sofort.“', '„Frau S. geht es nicht gut, können Sie mal vorbeischauen?“', '„Frau S. wurde vorgestern operiert, hat gestern gut gegessen, war heute Mittag mobilisiert, abends hatte sie Besuch …“', '„Der Blutdruck ist niedrig. Was soll ich geben?“'],
          richtig: [0], mehrfach: false,
          warum: 'Situation, Hintergrund, Einschätzung, Empfehlung. Eine klare Einschätzung und eine klare Bitte („sofort kommen“) verkürzen die Zeit bis zur Behandlung.',
        },
      ],
      erklaerung: ['ABCDE der Reihe nach, jedes Problem sofort behandeln, dann neu beginnen.', 'Mehrere leicht veränderte Werte zusammen können eine Sepsis anzeigen. Melden mit SBAR und einer klaren Einschätzung.'],
    },
  ],
  situationen: [
    {
      id: 'situation.zu.lagerung', art: 'zuordnen', topicIds: [NOTFALL], titel: 'Lagerung im Notfall', stufe: 2,
      frage: 'Ordne jeder Situation die passende Lagerung zu.',
      paare: [
        { links: 'Bewusstlos, atmet normal', rechts: 'Stabile Seitenlage' },
        { links: 'Kein Puls, keine normale Atmung', rechts: 'Flach auf harter Unterlage' },
        { links: 'Atemnot bei Herzinsuffizienz', rechts: 'Oberkörper hoch, Beine tief' },
        { links: 'Volumenmangel nach starkem Blutverlust, wach', rechts: 'Flach, Beine hoch' },
        { links: 'Asthmaanfall', rechts: 'Sitzend, Arme aufgestützt' },
        { links: 'Starke Bauchschmerzen, wach', rechts: 'Rückenlage mit Knierolle' },
      ],
      erklaerung: ['Die Lagerung folgt dem Problem: Atemweg schützen, Herz entlasten, Blut zum Kopf bringen oder die Atemhilfsmuskulatur einsetzen. Schocklage nie bei Atemnot oder Herzversagen.'],
    },
    {
      id: 'situation.fall.hypo', art: 'fall', topicIds: [NOTFALL, DIABETES], titel: 'Fall: Bewohner morgens nicht weckbar', stufe: 3,
      frage: 'Erkennst du die Ursache und handelst du sicher?',
      einstieg: 'Pflegeheim, 6:30 Uhr. Herr M., 79 Jahre, Typ-2-Diabetes mit Basalinsulin am Abend, lässt sich nicht richtig wecken. Er ist kaltschweißig und stöhnt nur.',
      schritte: [
        {
          lage: 'Er atmet normal, der Puls ist schnell und kräftig.',
          frage: 'Was misst du als Erstes, weil es schnell eine behandelbare Ursache zeigt?', optionen: ['Blutzucker', 'Körpergewicht', 'Bauchumfang', 'Urinmenge der Nacht'],
          richtig: [0], mehrfach: false,
          warum: 'Bei jeder Bewusstseinsstörung den Blutzucker messen (D im ABCDE). Kaltschweißigkeit und Unruhe sind typisch für eine Unterzuckerung.',
        },
        {
          lage: 'Der Blutzucker liegt bei 34 mg/dl. Er schluckt nicht sicher.',
          frage: 'Was ist richtig? Wähle alle zutreffenden.', optionen: ['Notruf beziehungsweise Arzt: Glukose i. v. oder Glukagon nach ärztlicher Anordnung', 'Nichts in den Mund geben', 'Stabile Seitenlage und bei ihm bleiben', 'Saft mit dem Löffel einflößen'],
          richtig: [0, 1, 2], mehrfach: true,
          warum: 'Bei gestörtem Schlucken droht Aspiration. Glukagon darf nur nach ärztlicher Anordnung oder hinterlegtem Notfallplan gegeben werden.',
        },
        {
          lage: 'Nach Glukose i. v. ist er wach und isst ein Frühstück. Der Wert liegt bei 140 mg/dl.',
          frage: 'Was ist jetzt wichtig? Wähle alle zutreffenden.', optionen: ['Blutzucker in kurzen Abständen weiter kontrollieren', 'Mit dem Arzt die Insulindosis und mögliche Ursachen besprechen', 'Ereignis dokumentieren und an Früh- und Spätdienst übergeben', 'Das Abendinsulin heute wie gewohnt geben, ohne Rücksprache'],
          richtig: [0, 1, 2], mehrfach: true,
          warum: 'Ein langwirksames Insulin wirkt weiter, eine erneute Unterzuckerung ist möglich. Ursachen wie wenig Essen, Infekt oder nachlassende Nierenfunktion gehören geklärt.',
        },
      ],
      erklaerung: ['Bewusstseinsstörung: immer Blutzucker messen. Bewusstlos: nichts in den Mund.', 'Nach der Akutbehandlung engmaschig nachkontrollieren und die Ursache klären.'],
    },
    {
      id: 'situation.fall.schlaganfall', art: 'fall', topicIds: [NOTFALL, SCHLAGANFALL], titel: 'Fall: Plötzlich verwaschene Sprache', stufe: 3,
      frage: 'Gehst du beim Verdacht auf Schlaganfall richtig vor?',
      einstieg: 'Frau T., 72 Jahre, liegt wegen einer Lungenentzündung auf Station. Beim Mittagessen fällt ihr der Löffel aus der rechten Hand, sie spricht verwaschen.',
      schritte: [
        {
          lage: 'Du bittest sie zu lächeln: Der rechte Mundwinkel hängt. Beide Arme vorhalten: Der rechte sinkt ab.',
          frage: 'Was ist jetzt am wichtigsten?', optionen: ['Sofort ärztlich melden beziehungsweise Notfallteam, Verdacht auf Schlaganfall', 'Abwarten, ob es nach dem Essen besser wird', 'Erst die Mahlzeit beenden lassen', 'Ihr eine Kopfschmerztablette geben'],
          richtig: [0], mehrfach: false,
          warum: 'FAST: Gesicht, Arme und Sprache sind betroffen. Eine Lyse oder Thrombektomie ist nur in einem Zeitfenster möglich, also zählt jede Minute.',
        },
        {
          lage: 'Der Arzt ist unterwegs.',
          frage: 'Was tust du bis dahin? Wähle alle zutreffenden.', optionen: ['Zeitpunkt des Beginns notieren beziehungsweise wann sie zuletzt sicher unauffällig war', 'Essen und Trinken stoppen', 'Blutzucker, Blutdruck, Puls und Sättigung messen', 'Den Blutdruck mit einer Tablette aus dem Stationsvorrat senken'],
          richtig: [0, 1, 2], mehrfach: true,
          warum: 'Der Beginn entscheidet über die Behandlung. Eine Unterzuckerung kann einen Schlaganfall nachahmen. Den Blutdruck senkt man nur nach ärztlicher Anordnung, weil das Gehirn den Druck gerade braucht.',
        },
        {
          lage: 'Sie wird zur Bildgebung verlegt. Auf dem Bett liegt noch ihr halb voller Teller.',
          frage: 'Warum darf sie bis zur Schluckprüfung nichts essen oder trinken?', optionen: ['Eine Schluckstörung ist nach Schlaganfall häufig und kann zu einer Aspirationspneumonie führen', 'Weil sie für die Bildgebung nüchtern sein muss, sonst gibt es keinen Grund', 'Weil Essen den Blutdruck steigert', 'Weil das nach jedem Krankenhausaufenthalt so ist'],
          richtig: [0], mehrfach: false,
          warum: 'Eine stille Aspiration fällt oft nicht auf und verschlechtert die Prognose. Erst nach einem Schluckscreening wird mit angepasster Kost begonnen.',
        },
      ],
      erklaerung: ['FAST prüfen, Zeit notieren, sofort melden.', 'Bis zum Schluckscreening nichts oral, Blutzucker messen, Blutdruck nur nach Anordnung senken.'],
    },
  ],
};

export const ERWEITERUNG_VERTIEFUNG: Record<string, string[]> = {
  'bls.zu.rollen': [
    'Im Krankenhaus gibt es meist eine interne Notrufnummer für das Reanimationsteam. Ein klarer Satz wie „Reanimation, Zimmer 12, Station 4“ reicht, damit alle wissen, was und wohin.',
    'Eine Person führt, die anderen sagen laut, was sie tun („Ich drücke“, „AED ist dran“). Diese geschlossene Kommunikation verhindert, dass Aufgaben doppelt oder gar nicht erledigt werden.',
  ],
  'bls.fall.zimmer': [
    'Die Wahrscheinlichkeit, einen Kreislaufstillstand zu überleben, sinkt mit jeder Minute ohne Herzdruckmassage deutlich. Laienreanimation und früher AED-Einsatz sind die wichtigsten Faktoren.',
    'Eine Patientenverfügung oder ein dokumentierter Verzicht auf Wiederbelebung ist bindend. Liegt im Moment des Auffindens nichts vor, wird reanimiert, bis das ärztliche Team entscheidet.',
  ],
  'abcde.zu.befunde': [
    'Das Schema ordnet nach Dringlichkeit: Ein verlegter Atemweg tötet in Minuten, eine Blutung oft später. Deshalb wird jedes Problem sofort behandelt, bevor man zum nächsten Buchstaben geht.',
    'AVPU teilt das Bewusstsein grob ein: Alert (wach), Voice (reagiert auf Ansprache), Pain (reagiert nur auf Schmerz), Unresponsive (reagiert nicht). Ab P ist der Atemweg in Gefahr.',
  ],
  'abcde.fall.nacht': [
    'Nach Bauchoperationen ist eine Undichtigkeit der Darmnaht (Anastomoseninsuffizienz) eine gefürchtete Ursache für eine Sepsis, typischerweise einige Tage nach dem Eingriff.',
    'Beim Verdacht auf Sepsis zählt Zeit: Blutkulturen, Antibiotika und Flüssigkeit sollen ärztlich schnell beginnen. Pflegende erkennen die Verschlechterung oft zuerst, weil sie am Bett sind.',
  ],
  'situation.zu.lagerung': [
    'Bei Atemnot hilft der Kutschersitz oder das Sitzen mit aufgestützten Armen: Die Schultern werden fixiert, und die Atemhilfsmuskulatur kann den Brustkorb besser weiten.',
    'Die Knierolle bei Bauchschmerzen entspannt die Bauchdecke. Bei Verdacht auf Wirbelsäulenverletzung wird möglichst wenig bewegt, bis Hilfe da ist.',
  ],
  'situation.fall.hypo': [
    'Langwirksames Insulin am Abend kann nachts Unterzuckerungen auslösen, vor allem wenn wenig gegessen wurde, ein Infekt besteht oder die Niere schlechter arbeitet, weil Insulin dann langsamer abgebaut wird.',
    'Glukagon setzt Zucker aus den Leberspeichern frei. Bei Mangelernährung oder Alkohol sind diese Speicher oft leer, dann wirkt es schwach. Glukose i. v. wirkt sicher.',
  ],
  'situation.fall.schlaganfall': [
    'Rund vier von fünf Schlaganfällen entstehen durch ein verschlossenes Gefäß (Ischämie), die übrigen durch eine Blutung. Erst die Bildgebung unterscheidet beides, deshalb gibt es vorher keine blutverdünnende Behandlung.',
    'Typische Nachahmer eines Schlaganfalls sind Unterzuckerung, Krampfanfall mit anschließender Lähmung und Migräne mit Aura. Der Blutzucker ist deshalb Pflicht.',
  ],
};
