// Grundlagen-Trainer, Teil Pflegeberuf: Kommunikation, Pflegemodelle, Qualität und Forschung, Versorgungsstrukturen.
// Übliches Lehrbuchwissen (Watzlawick, Schulz von Thun, Rogers; Juchli, Krohwinkel, Orem, Roper/Logan/Tierney;
// Donabedian, PDCA; Evidence-based Nursing; SGB V/XI). Für die Prüfung gilt dein Unterrichtsmaterial.
// Themen als Text, damit aufgaben.ts diese Datei ohne Zyklus einbinden kann.

import type { Aufgabe, AuswahlAufgabe } from '../quiz/quiz';

const KOM = 'thema.kom.grundlagen';
const KULTUR = 'thema.kom.kultur';
const SELBST = 'thema.kom.selbstpflege';
const MODELLE = 'thema.pp.modelle';
const QM = 'thema.qw.qm';
const EBN = 'thema.qw.ebn';
const VERSORGUNG = 'thema.re.versorgung';

export type PflegeBereich = 'kommunikation' | 'modelle' | 'qualitaet' | 'versorgung';

function frage(id: string, thema: string, titel: string, f: string, optionen: string[], erklaerung: string[], richtig = [0], mehrfach = false): AuswahlAufgabe {
  return { id, art: 'auswahl', topicIds: [thema], titel, frage: f, optionen, richtig, mehrfach, erklaerung };
}

// ---------------------------------------------------------------- Kommunikation

const kommunikation: Aufgabe[] = [
  {
    id: 'kom.zu.ohren', art: 'zuordnen', topicIds: [KOM], titel: 'Vier Seiten einer Nachricht',
    frage: 'Eine Patientin sagt: „Die Klingel geht schon seit zehn Minuten.“ Ordne jede Deutung der Seite nach Schulz von Thun zu.',
    paare: [
      { links: 'Seit zehn Minuten hat niemand auf die Klingel reagiert', rechts: 'Sachinhalt' },
      { links: 'Ich bin ungeduldig und fühle mich allein gelassen', rechts: 'Selbstkundgabe' },
      { links: 'Ihr kümmert euch nicht richtig um mich', rechts: 'Beziehung' },
      { links: 'Komm bitte sofort', rechts: 'Appell' },
    ],
    erklaerung: ['Jede Nachricht hat vier Seiten. Wer vor allem mit dem Beziehungsohr hört, fühlt sich schnell angegriffen. Hilfreich ist, auf den Appell und die Selbstkundgabe zu antworten.'],
  },
  frage('kom.watzlawick', KOM, 'Watzlawick', 'Ein Bewohner dreht sich wortlos zur Wand, als du ins Zimmer kommst. Was sagt Watzlawicks erstes Axiom dazu?',
    ['Man kann nicht nicht kommunizieren: Auch sein Schweigen ist eine Mitteilung', 'Er kommuniziert gerade nicht, deshalb ist keine Reaktion nötig', 'Nur Worte sind Kommunikation', 'Kommunikation gibt es nur zwischen gleichberechtigten Partnern'],
    ['Verhalten hat keinen Gegensatz. Sich abwenden kann heißen: Ich will meine Ruhe, ich schäme mich, ich habe Schmerzen. Nachfragen statt deuten.']),
  frage('kom.rogers', KOM, 'Rogers', 'Welche drei Grundhaltungen beschreibt Carl Rogers für eine hilfreiche Gesprächsbeziehung?',
    ['Empathie, Wertschätzung und Echtheit (Kongruenz)', 'Strenge, Distanz und Kontrolle', 'Ratschläge, Lob und Kritik', 'Schnelligkeit, Klarheit und Ergebnisorientierung'],
    ['Empathie heißt einfühlendes Verstehen, Wertschätzung bedingungslose Annahme der Person, Echtheit, dass Gesagtes und Gefühltes übereinstimmen.']),
  frage('kom.aktiv', KOM, 'Aktives Zuhören', 'Ein Patient sagt vor der Operation: „Ich habe Angst, nicht mehr aufzuwachen.“ Welche Antwort ist aktives Zuhören?',
    ['„Sie machen sich große Sorgen wegen der Narkose.“', '„Da brauchen Sie keine Angst zu haben.“', '„Das passiert fast nie, denken Sie an etwas Schönes.“', '„Fragen Sie das am besten den Arzt.“'],
    ['Aktives Zuhören spiegelt Inhalt und Gefühl in eigenen Worten. So fühlt sich der Mensch verstanden und kann weitersprechen. Beschwichtigen schließt das Gespräch.']),
  frage('kom.ich', KOM, 'Ich-Botschaften', 'Eine Kollegin kommt zum dritten Mal zu spät zur Übergabe. Welche Rückmeldung ist eine Ich-Botschaft?',
    ['„Ich werde unruhig, wenn die Übergabe später beginnt, weil ich dann meinen Bus verpasse.“', '„Du kommst immer zu spät.“', '„Man sollte pünktlich sein.“', '„Alle ärgern sich über dich.“'],
    ['Ich-Botschaften beschreiben die eigene Wahrnehmung, das eigene Gefühl und die Folge. Du-Botschaften und Verallgemeinerungen wie „immer“ wirken als Vorwurf.']),
  frage('kom.kultur', KULTUR, 'Kultursensible Pflege', 'Was gehört zu kultursensibler Pflege? Wähle alle zutreffenden.',
    ['Nach Gewohnheiten und Wünschen fragen, statt aus der Herkunft auf sie zu schließen', 'Bei Sprachbarrieren eine qualifizierte Dolmetscherin einbeziehen', 'Wünsche zu gleichgeschlechtlicher Pflege berücksichtigen, wenn möglich', 'Kinder der Familie als Dolmetscher für Diagnosen nutzen', 'Alle Menschen einer Religion gleich behandeln'],
    ['Kultur ist individuell: Nicht jede Muslima möchte dasselbe, nicht jeder Deutsche isst Schweinefleisch. Fragen schützt vor Stereotypen.', 'Kinder als Dolmetscher überfordert sie und gefährdet die Genauigkeit, besonders bei schweren Nachrichten.'],
    [0, 1, 2], true),
  frage('kom.stress', SELBST, 'Stress und Selbstpflege', 'Woran erkennst du früh, dass du selbst in ein Burn-out geraten könntest? Wähle alle zutreffenden.',
    ['Dauerhafte Erschöpfung, auch nach freien Tagen', 'Zunehmend zynische oder gleichgültige Haltung gegenüber Patienten', 'Gefühl, nichts mehr zu schaffen', 'Freude auf den nächsten Dienst'],
    ['Erschöpfung, Distanzierung (Depersonalisation) und verringerte Leistungsfähigkeit sind die drei Kernzeichen.', 'Hilfe: Pausen einhalten, Supervision und kollegiale Beratung nutzen, Grenzen ansprechen, Betriebsarzt oder Beratungsstelle.'],
    [0, 1, 2], true),
  frage('kom.kultur.schmerz', KULTUR, 'Schmerz und Kultur', 'Ein Patient äußert nach der Operation laut und häufig Schmerzen, ein anderer klagt nie. Was folgt daraus für die Schmerzeinschätzung?',
    ['Beide nach ihren Schmerzen fragen und eine Skala nutzen, weil der Ausdruck von Schmerz kulturell und persönlich verschieden ist', 'Der laute Patient übertreibt, der stille hat keine Schmerzen', 'Nur beim lauten Patienten die Schmerzen einschätzen', 'Schmerz lässt sich nur an Vitalzeichen erkennen'],
    ['Wie Schmerz gezeigt wird, lernen Menschen in Familie und Kultur. Wie stark er ist, sagt das nicht. Maßgeblich ist die Selbstauskunft, ergänzt durch Beobachtung.']),
  frage('kom.kultur.fasten', KULTUR, 'Religiöse Bedürfnisse', 'Ein Patient mit Diabetes möchte im Fastenmonat Ramadan tagsüber nichts essen und trinken. Was ist der beste Weg?',
    ['Den Wunsch respektieren, ärztlich besprechen lassen, wie Medikamente und Insulin angepasst werden, und Blutzucker engmaschig messen', 'Das Fasten verbieten, weil es medizinisch gefährlich ist', 'Nichts unternehmen, Religion ist Privatsache', 'Insulin heimlich ins Essen am Abend geben'],
    ['Viele Religionen kennen Ausnahmen für Kranke. Ob jemand sie nutzt, entscheidet er selbst. Pflegende sorgen dafür, dass die Entscheidung informiert und medizinisch begleitet ist.']),
  frage('kom.naehe', SELBST, 'Nähe und Distanz', 'Eine Bewohnerin bittet dich, ihr privat deine Handynummer zu geben, damit sie dich anrufen kann. Was ist professionell?',
    ['Freundlich ablehnen, die Grenze erklären und Wege über die Einrichtung anbieten', 'Die Nummer geben, damit sie sich nicht abgewiesen fühlt', 'Sie ab jetzt meiden', 'Ihr sagen, dass solche Wünsche unangemessen sind, und das Gespräch beenden'],
    ['Professionelle Nähe heißt: zugewandt sein, aber die Rolle klar halten. Private Kontakte überfordern auf Dauer beide Seiten und können Abhängigkeiten schaffen.']),
  {
    id: 'kom.fall.angehoerige', art: 'fall', topicIds: [KOM, SELBST], titel: 'Fall: Aufgebrachter Angehöriger', stufe: 3,
    frage: 'Bleibst du im Gespräch handlungsfähig?',
    einstieg: 'Herr D. besucht seine Mutter. Er kommt auf den Flur und sagt laut: „Meine Mutter liegt schon wieder nass im Bett! Was machen Sie hier eigentlich den ganzen Tag?“',
    schritte: [
      {
        lage: 'Andere Besucher schauen herüber.',
        frage: 'Was tust du zuerst?', optionen: ['Ruhig bleiben, ihn ansprechen und in einen ruhigen Raum oder ins Zimmer bitten', 'Sofort erklären, wie viele Patienten du heute hast', 'Zurückweisen: „So lasse ich nicht mit mir reden.“ und gehen', 'Ihm recht geben und die Kolleginnen beschuldigen'],
        richtig: [0], mehrfach: false,
        warum: 'Ein ruhiger Ort nimmt Druck aus der Situation und schützt die Privatsphäre der Mutter. Rechtfertigungen wirken in diesem Moment oft wie ein Gegenangriff.',
      },
      {
        lage: 'Im Zimmer sagt er: „Ich komme jeden Tag, und jedes Mal ist etwas.“',
        frage: 'Welche Antwort passt nach Rogers am besten?', optionen: ['„Sie sorgen sich sehr um Ihre Mutter und sind enttäuscht, wenn Sie sie so vorfinden.“', '„Das stimmt so nicht, heute Morgen war alles in Ordnung.“', '„Dafür bin ich nicht zuständig.“', '„Beruhigen Sie sich erst mal.“'],
        richtig: [0], mehrfach: false,
        warum: 'Hinter dem Vorwurf steht meist Sorge. Wer sie anspricht, öffnet das Gespräch für Lösungen.',
      },
      {
        lage: 'Er wird ruhiger. Du versorgst die Mutter gleich mit ihm gemeinsam.',
        frage: 'Was gehört zum Abschluss? Wähle alle zutreffenden.', optionen: ['Gemeinsam besprechen, was ihm wichtig ist, und was die Station leisten kann', 'Ein Gespräch mit Bezugspflegekraft oder Leitung anbieten', 'Das Gespräch sachlich dokumentieren', 'Ihm versprechen, dass so etwas nie wieder vorkommt'],
        richtig: [0, 1, 2], mehrfach: true,
        warum: 'Klare Absprachen schaffen Vertrauen. Versprechen, die niemand halten kann, führen beim nächsten Mal zu mehr Enttäuschung.',
      },
      {
        lage: 'Nach dem Dienst merkst du, dass dich das Gespräch noch beschäftigt.',
        frage: 'Was hilft dir?', optionen: ['Mit Kolleginnen oder in der Supervision darüber sprechen', 'Es für dich behalten, das gehört zum Beruf', 'Herrn D. künftig aus dem Weg gehen', 'Beim nächsten Besuch das Gespräch mit ihm neu aufrollen und ihm Vorwürfe machen'],
        richtig: [0], mehrfach: false,
        warum: 'Belastende Gespräche zu besprechen ist Teil professioneller Selbstpflege und beugt Überlastung vor.',
      },
    ],
    erklaerung: ['Bei Vorwürfen: ruhigen Ort suchen, die Sorge hinter dem Vorwurf ansprechen, Lösungen vereinbaren, dokumentieren.', 'Eigene Belastung ernst nehmen und teilen.'],
  },
];

// ---------------------------------------------------------------- Pflegemodelle

const modelle: Aufgabe[] = [
  {
    id: 'mod.zu.autoren', art: 'zuordnen', topicIds: [MODELLE], titel: 'Modelle und Autorinnen',
    frage: 'Ordne jedem Modell die Person zu, die es entwickelt hat.',
    paare: [
      { links: '12 Aktivitäten des täglichen Lebens (ATL)', rechts: 'Liliane Juchli' },
      { links: '13 AEDL, später ABEDL', rechts: 'Monika Krohwinkel' },
      { links: 'Selbstpflegedefizit-Theorie', rechts: 'Dorothea Orem' },
      { links: 'Lebensaktivitäten-Modell (Roper, Logan, Tierney)', rechts: 'Nancy Roper' },
      { links: '14 Grundbedürfnisse und Definition von Pflege', rechts: 'Virginia Henderson' },
    ],
    erklaerung: ['Juchli und Krohwinkel haben die Pflege im deutschsprachigen Raum geprägt. Roper und Henderson lieferten wichtige Vorbilder, Orem stellt die Selbstpflege in den Mittelpunkt.'],
  },
  frage('mod.orem', MODELLE, 'Orem', 'Nach Orem wird Pflege nötig, wenn …',
    ['die Selbstpflegefähigkeiten eines Menschen nicht ausreichen, um seinen Selbstpflegebedarf zu decken', 'ein Arzt eine Diagnose stellt', 'ein Mensch älter als 65 Jahre ist', 'Angehörige es wünschen'],
    ['Orem beschreibt drei Pflegesysteme: vollständig kompensatorisch (Pflege übernimmt), teilweise kompensatorisch (Pflege und Person teilen sich die Aufgaben) und unterstützend-erziehend (Beratung, Anleitung).']),
  frage('mod.orem.system', MODELLE, 'Orem anwenden', 'Eine Patientin mit neuem Diabetes lernt, sich selbst Insulin zu spritzen. Welches Pflegesystem nach Orem liegt vor?',
    ['Unterstützend-erziehendes System', 'Vollständig kompensatorisches System', 'Teilweise kompensatorisches System', 'Kein Pflegesystem, weil sie selbst handelt'],
    ['Sie kann es grundsätzlich selbst, braucht aber Wissen, Anleitung und Sicherheit. Die Pflege berät und leitet an.']),
  frage('mod.krohwinkel', MODELLE, 'Krohwinkel', 'Was unterscheidet die ABEDL nach Krohwinkel von früheren Modellen besonders?',
    ['Sie beziehen existenzielle Erfahrungen des Lebens und soziale Beziehungen ausdrücklich ein', 'Sie zählen nur körperliche Bedürfnisse', 'Sie gelten nur für Kinder', 'Sie ersetzen den Pflegeprozess'],
    ['Krohwinkel nennt „mit existenziellen Erfahrungen des Lebens umgehen“ als eigenen Bereich: Angst, Hoffnung, Sterben, aber auch Freude. Ziel ist fördernde Prozesspflege.']),
  frage('mod.nutzen', MODELLE, 'Wozu Modelle?', 'Wozu dienen Pflegemodelle im Alltag? Wähle alle zutreffenden.',
    ['Sie geben der Pflegeanamnese eine Struktur, damit nichts Wichtiges vergessen wird', 'Sie schaffen eine gemeinsame Sprache im Team', 'Sie machen das Pflegeverständnis einer Einrichtung sichtbar', 'Sie schreiben jede einzelne Pflegehandlung genau vor'],
    ['Modelle sind Denkgerüste, keine Handlungsanweisungen. Wie gepflegt wird, legen Pflegeplanung, Standards und die Situation des Menschen fest.'],
    [0, 1, 2], true),
  {
    id: 'mod.fall.anamnese', art: 'fall', topicIds: [MODELLE], titel: 'Fall: Anamnese nach Modell', stufe: 3,
    frage: 'Nutzt du ein Modell, um eine Situation vollständig zu erfassen?',
    einstieg: 'Frau V., 84 Jahre, zieht nach dem Tod ihres Mannes ins Pflegeheim. Du führst das Aufnahmegespräch nach den ABEDL.',
    schritte: [
      {
        lage: 'Sie erzählt, sie esse kaum noch, weil sie allein am Tisch keinen Appetit habe, und weine abends oft.',
        frage: 'Welche Bereiche berührt das? Wähle alle zutreffenden.', optionen: ['Essen und trinken', 'Mit existenziellen Erfahrungen des Lebens umgehen', 'Soziale Bereiche des Lebens sichern', 'Sich bewegen'],
        richtig: [0, 1, 2], mehrfach: true,
        warum: 'Ein Problem betrifft meist mehrere Bereiche. Die Trauer zeigt sich im Essen und im Rückzug. Wer nur das Essen behandelt, übersieht die Ursache.',
      },
      {
        lage: 'Du planst die ersten Maßnahmen.',
        frage: 'Welche passen zur fördernden Prozesspflege nach Krohwinkel?', optionen: ['Gemeinsame Mahlzeiten in einer kleinen Tischgruppe anbieten und nach ihren Lieblingsspeisen fragen', 'Sofort hochkalorische Trinknahrung ohne Rücksprache geben', 'Sie im Zimmer essen lassen, damit sie ihre Ruhe hat', 'Abwarten, bis sie sich von allein eingewöhnt'],
        richtig: [0], mehrfach: false,
        warum: 'Fördernd heißt: an Fähigkeiten und Bedürfnissen anknüpfen und die Person beteiligen. Gesellschaft beim Essen kann Appetit und Kontakt zugleich fördern.',
      },
    ],
    erklaerung: ['Ein Modell hilft, alle Lebensbereiche anzusprechen und Zusammenhänge zu erkennen.', 'Maßnahmen setzen an Ursachen und Ressourcen an, nicht nur am Symptom.'],
  },
];

// ---------------------------------------------------------------- Qualität und Forschung

const qualitaet: Aufgabe[] = [
  {
    id: 'qm.zu.donabedian', art: 'zuordnen', topicIds: [QM], titel: 'Struktur, Prozess, Ergebnis',
    frage: 'Ordne jedes Beispiel der Qualitätsdimension nach Donabedian zu.',
    paare: [
      { links: 'Auf jeder Etage gibt es Wechseldruckmatratzen', rechts: 'Strukturqualität' },
      { links: 'Zwei examinierte Pflegefachpersonen pro Nachtdienst', rechts: 'Strukturqualität' },
      { links: 'Das Dekubitusrisiko wird bei Aufnahme eingeschätzt und dokumentiert', rechts: 'Prozessqualität' },
      { links: 'Positionswechsel nach individuellem Plan', rechts: 'Prozessqualität' },
      { links: 'Kein Bewohner hat einen neu entstandenen Dekubitus', rechts: 'Ergebnisqualität' },
      { links: 'Die Bewohnerin fühlt sich gut informiert', rechts: 'Ergebnisqualität' },
    ],
    erklaerung: ['Struktur: was vorhanden ist (Personal, Räume, Material). Prozess: was getan wird und wie. Ergebnis: was beim Menschen ankommt, auch seine Zufriedenheit.'],
  },
  {
    id: 'qm.pdca', art: 'reihenfolge', topicIds: [QM], titel: 'PDCA-Zyklus',
    frage: 'Auf deiner Station sollen Stürze nachts seltener werden. Bringe die Schritte des PDCA-Zyklus in die richtige Reihenfolge.',
    schritte: ['Plan: Ursachen analysieren und Maßnahmen planen', 'Do: Maßnahmen in kleinem Rahmen umsetzen', 'Check: Wirkung prüfen, z. B. Sturzzahlen vergleichen', 'Act: Bewährtes als Standard festlegen, sonst neu planen'],
    erklaerung: ['Der PDCA-Zyklus nach Deming beginnt danach von vorn. So verbessert sich Qualität schrittweise und fortlaufend.'],
  },
  frage('qm.cirs', QM, 'Fehlerkultur', 'Wozu dient ein Fehlermeldesystem wie CIRS?',
    ['Aus Fehlern und Beinahe-Fehlern zu lernen, ohne Schuldige zu suchen', 'Mitarbeitende mit vielen Fehlern abzumahnen', 'Patienten über Fehler anderer zu informieren', 'Die Haftpflichtversicherung zu entlasten'],
    ['CIRS steht für Critical Incident Reporting System. Meldungen sind meist anonym. Entscheidend ist, dass sich Abläufe danach ändern.']),
  {
    id: 'ebn.schritte', art: 'reihenfolge', topicIds: [EBN], titel: 'Schritte von Evidence-based Nursing',
    frage: 'Bringe die Schritte von Evidence-based Nursing in die richtige Reihenfolge.',
    schritte: ['Aus einem Pflegeproblem eine beantwortbare Frage formulieren', 'Nach Studien und Leitlinien suchen', 'Gefundene Studien kritisch bewerten', 'Ergebnisse mit Erfahrung und Wünschen der Person zusammen anwenden', 'Wirkung bei der Person überprüfen'],
    erklaerung: ['EBN verbindet die beste verfügbare Forschung mit der Erfahrung der Pflegenden, den Wünschen der pflegebedürftigen Person und den Gegebenheiten vor Ort.'],
  },
  frage('ebn.pico', EBN, 'Fragen formulieren', 'Welche Frage ist nach dem PICO-Schema aufgebaut?',
    ['„Haben ältere Menschen im Heim (P), die Hüftprotektoren tragen (I), im Vergleich zu denen ohne (C) weniger Hüftbrüche (O)?“', '„Was hilft gegen Stürze?“', '„Sind Hüftprotektoren gut?“', '„Warum stürzen alte Menschen?“'],
    ['P = Person oder Problem, I = Intervention, C = Vergleich (Comparison), O = Ergebnis (Outcome). Eine genaue Frage macht die Literatursuche gezielt.']),
  frage('ebn.evidenz', EBN, 'Evidenzstufen', 'Welche Quelle hat in der Regel die höchste Aussagekraft für die Wirksamkeit einer Maßnahme?',
    ['Systematische Übersichtsarbeit mehrerer randomisierter kontrollierter Studien', 'Meinung einer erfahrenen Kollegin', 'Ein einzelner Fallbericht', 'Ein Artikel in einer Publikumszeitschrift'],
    ['Randomisiert heißt: Zufall entscheidet, wer die Maßnahme bekommt. Das verhindert, dass andere Unterschiede das Ergebnis verfälschen. Erfahrung bleibt wichtig, ersetzt aber keine Studien.']),
  {
    id: 'qm.fall.sturz', art: 'fall', topicIds: [QM, EBN], titel: 'Fall: Mehr Stürze in der Nacht', stufe: 3,
    frage: 'Verbindest du Qualitätsmanagement und Forschung in einem Projekt?',
    einstieg: 'Im Wohnbereich gab es in drei Monaten neun nächtliche Stürze. Die Leitung bittet dich, im Qualitätszirkel mitzuarbeiten.',
    schritte: [
      {
        lage: 'Eine Kollegin schlägt vor, nachts alle Bettgitter hochzuziehen.',
        frage: 'Was sagt die Studienlage dazu?', optionen: ['Bettgitter verhindern Stürze nicht sicher und können zu schwereren Verletzungen führen; außerdem sind sie freiheitsentziehend', 'Bettgitter sind die wirksamste Maßnahme', 'Dazu gibt es keine Erkenntnisse', 'Bettgitter sind nur bei jüngeren Menschen gefährlich'],
        richtig: [0], mehrfach: false,
        warum: 'Menschen klettern über das Gitter und stürzen aus größerer Höhe. Rechtlich brauchen Bettgitter bei nicht einwilligungsfähigen Menschen eine richterliche Genehmigung.',
      },
      {
        lage: 'Ihr analysiert die Sturzprotokolle.',
        frage: 'Welche Fragen helfen bei der Ursachensuche? Wähle alle zutreffenden.', optionen: ['Zu welcher Uhrzeit und auf welchem Weg passierten die Stürze?', 'Welche Medikamente erhalten die Betroffenen, etwa Schlafmittel oder Diuretika?', 'Waren Licht, Schuhe und Hilfsmittel vorhanden?', 'Wer hatte Dienst, damit man ihn abmahnen kann?'],
        richtig: [0, 1, 2], mehrfach: true,
        warum: 'Systematische Analyse sucht nach Mustern in Abläufen und Umgebung, nicht nach Schuldigen. Häufige Muster: nächtlicher Toilettengang, Schlafmittel, schlechtes Licht.',
      },
      {
        lage: 'Ihr führt Nachtlichter, Toilettenrundgänge und eine Medikamentenprüfung ein.',
        frage: 'Wie prüft ihr, ob es wirkt?', optionen: ['Sturzzahlen und -umstände über die nächsten Monate mit den Monaten davor vergleichen', 'Die Kolleginnen fragen, ob sie ein gutes Gefühl haben', 'Gar nicht, die Maßnahmen sind sinnvoll', 'Nach einer Woche ohne Sturz das Projekt beenden'],
        richtig: [0], mehrfach: false,
        warum: 'Das ist der Check-Schritt im PDCA-Zyklus. Eine Woche ist zu kurz, weil Stürze unregelmäßig auftreten.',
      },
    ],
    erklaerung: ['Qualitätsmanagement fragt nach Ursachen im System, Evidence-based Nursing nach wirksamen Maßnahmen.', 'Danach wird gemessen, ob sich etwas verbessert hat.'],
  },
];

// ---------------------------------------------------------------- Versorgungsstrukturen

const versorgung: Aufgabe[] = [
  {
    id: 'vers.zu.sektoren', art: 'zuordnen', topicIds: [VERSORGUNG], titel: 'Wo wird versorgt?',
    frage: 'Ordne jeder Situation die passende Versorgungsform zu.',
    paare: [
      { links: 'Akute Lungenentzündung mit Sauerstoffbedarf', rechts: 'Krankenhaus' },
      { links: 'Täglicher Verbandwechsel zu Hause nach ärztlicher Verordnung', rechts: 'Ambulanter Pflegedienst' },
      { links: 'Dauerhafter Pflegebedarf rund um die Uhr, Versorgung zu Hause nicht möglich', rechts: 'Vollstationäre Pflegeeinrichtung' },
      { links: 'Tagsüber betreut, abends und nachts bei der Familie', rechts: 'Tagespflege' },
      { links: 'Die pflegende Tochter fährt drei Wochen in Urlaub', rechts: 'Kurzzeitpflege oder Verhinderungspflege' },
      { links: 'Letzte Lebensphase, Linderung steht im Vordergrund', rechts: 'Hospiz oder Palliativversorgung' },
    ],
    erklaerung: ['Grundsatz: ambulant vor stationär. Teilstationäre Angebote und Kurzzeitpflege entlasten Angehörige und ermöglichen, länger zu Hause zu leben.'],
  },
  frage('vers.kosten', VERSORGUNG, 'Wer bezahlt?', 'Wer trägt die Kosten für die ärztlich verordnete Behandlungspflege (z. B. Insulin spritzen) durch einen ambulanten Dienst zu Hause?',
    ['In der Regel die Krankenkasse nach SGB V (häusliche Krankenpflege)', 'Immer die Pflegekasse nach SGB XI', 'Immer die Person selbst', 'Das Sozialamt'],
    ['Behandlungspflege nach ärztlicher Verordnung zahlt die Krankenkasse. Grundpflege und hauswirtschaftliche Hilfe laufen über die Pflegekasse, wenn ein Pflegegrad vorliegt.']),
  frage('vers.entlassung', VERSORGUNG, 'Übergänge', 'Warum sind Übergänge zwischen Krankenhaus, Heim und ambulanter Pflege besonders riskant?',
    ['Informationen gehen verloren, etwa zu Medikamenten, Wunden oder Hilfsmitteln', 'Weil Patienten dabei immer ihre Pflegekasse wechseln', 'Weil Übergänge rechtlich verboten sind', 'Weil im Krankenhaus andere Krankheiten gelten'],
    ['Deshalb gibt es das Entlassmanagement im Krankenhaus und den Expertenstandard Entlassungsmanagement. Eine vollständige Pflegeüberleitung gehört dazu.']),
  {
    id: 'vers.fall.entlassung', art: 'fall', topicIds: [VERSORGUNG], titel: 'Fall: Entlassung nach Hause', stufe: 3,
    frage: 'Planst du die Versorgung nach dem Krankenhaus mit?',
    einstieg: 'Herr J., 80 Jahre, lebt allein. Nach einem Schlaganfall mit leichter Lähmung rechts soll er in fünf Tagen nach Hause. Er möchte auf keinen Fall ins Heim.',
    schritte: [
      {
        lage: 'Er kann mit Rollator kurze Strecken gehen, braucht aber Hilfe beim Duschen und beim Anziehen der Kompressionsstrümpfe.',
        frage: 'Was organisiert das Entlassmanagement? Wähle alle zutreffenden.', optionen: ['Kontakt zu einem ambulanten Pflegedienst', 'Antrag auf einen Pflegegrad bei der Pflegekasse', 'Hilfsmittel wie Duschstuhl und Haltegriffe', 'Einen Heimplatz gegen seinen Willen'],
        richtig: [0, 1, 2], mehrfach: true,
        warum: 'Sein Wunsch, zu Hause zu leben, steht im Mittelpunkt. Mit Pflegedienst, Hilfsmitteln und Pflegegrad ist das oft möglich.',
      },
      {
        lage: 'Er fragt, wer das Anziehen der Strümpfe bezahlt.',
        frage: 'Was trifft zu?', optionen: ['Das An- und Ausziehen ärztlich verordneter Kompressionsstrümpfe ist häusliche Krankenpflege und wird von der Krankenkasse übernommen', 'Das zahlt er immer selbst', 'Das ist Grundpflege und nur mit Pflegegrad möglich', 'Das darf ein Pflegedienst nicht übernehmen'],
        richtig: [0], mehrfach: false,
        warum: 'Kompressionsstrümpfe an- und ausziehen ist eine Leistung der Behandlungspflege nach SGB V, wenn sie ärztlich verordnet ist.',
      },
      {
        lage: 'Am Entlasstag kommt er nach Hause.',
        frage: 'Was sollte er mitbekommen? Wähle alle zutreffenden.', optionen: ['Arztbrief und aktuellen Medikamentenplan', 'Pflegeüberleitungsbogen für den Pflegedienst', 'Medikamente für die Zeit bis zum Hausarztbesuch, nach Hausregel', 'Nur einen mündlichen Hinweis, sich beim Hausarzt zu melden'],
        richtig: [0, 1, 2], mehrfach: true,
        warum: 'Schriftliche Informationen sichern die Weiterversorgung. Viele Krankenhäuser geben Medikamente für die ersten Tage mit, bis ein Rezept vorliegt.',
      },
    ],
    erklaerung: ['Gute Entlassung beginnt früh: Wünsche klären, Dienste und Hilfsmittel organisieren, Kostenträger kennen, Informationen schriftlich weitergeben.'],
  },
];

export const PFLEGEBERUF: Record<PflegeBereich, Aufgabe[]> = { kommunikation, modelle, qualitaet, versorgung };

export const PFLEGEBERUF_BEREICHE: Array<{ id: PflegeBereich; label: string; kurz: string; wissen: string[] }> = [
  {
    id: 'kommunikation', label: 'Kommunikation', kurz: 'Watzlawick, Schulz von Thun, Rogers, Kultur, Selbstpflege',
    wissen: [
      'Man kann nicht nicht kommunizieren (Watzlawick).',
      'Vier Seiten: Sachinhalt, Selbstkundgabe, Beziehung, Appell (Schulz von Thun).',
      'Empathie, Wertschätzung, Echtheit (Rogers). Aktiv zuhören, Ich-Botschaften.',
    ],
  },
  {
    id: 'modelle', label: 'Pflegemodelle', kurz: 'Juchli, Krohwinkel, Orem, Roper, Henderson',
    wissen: [
      'ATL nach Juchli, ABEDL nach Krohwinkel mit existenziellen Erfahrungen.',
      'Orem: Selbstpflegedefizit, drei Pflegesysteme.',
      'Modelle strukturieren Anamnese und Planung, sie schreiben keine Handgriffe vor.',
    ],
  },
  {
    id: 'qualitaet', label: 'Qualität und Forschung', kurz: 'Struktur, Prozess, Ergebnis, PDCA, EBN, PICO',
    wissen: [
      'Donabedian: Struktur-, Prozess-, Ergebnisqualität.',
      'PDCA: Plan, Do, Check, Act.',
      'EBN: Frage (PICO), Suche, Bewertung, Anwendung mit der Person, Überprüfung.',
    ],
  },
  {
    id: 'versorgung', label: 'Versorgungsstrukturen', kurz: 'Krankenhaus, Heim, ambulant, teilstationär, Übergänge',
    wissen: [
      'Ambulant vor stationär.',
      'Behandlungspflege meist Krankenkasse (SGB V), Pflegeleistungen mit Pflegegrad Pflegekasse (SGB XI).',
      'Übergänge sind riskant: Entlassmanagement und Pflegeüberleitung.',
    ],
  },
];

export const PFLEGEBERUF_THEMEN: Record<string, PflegeBereich> = {
  [KOM]: 'kommunikation', [KULTUR]: 'kommunikation', [SELBST]: 'kommunikation',
  [MODELLE]: 'modelle', [QM]: 'qualitaet', [EBN]: 'qualitaet', [VERSORGUNG]: 'versorgung',
};

export const PFLEGEBERUF_VERTIEFUNG: Record<string, string[]> = {
  'kom.kultur.schmerz': [
    'Ältere Menschen und Menschen mit Demenz äußern Schmerzen oft nicht von sich aus. Für sie gibt es Beobachtungsinstrumente wie BESD oder BISAD.',
    'Der Expertenstandard Schmerzmanagement betont die systematische Einschätzung mit einem passenden Instrument, unabhängig davon, wie jemand seinen Schmerz zeigt.',
  ],
  'kom.kultur.fasten': [
    'Im Islam sind Kranke, Schwangere, Reisende und Ältere vom Fasten befreit. Manche Menschen möchten trotzdem fasten, weil es ihnen wichtig ist.',
    'Auch andere Religionen kennen Speisevorschriften oder Rituale, etwa koschere Ernährung, Fastenzeiten oder Gebetszeiten. Fragen ist besser als vermuten.',
  ],
  'kom.naehe': [
    'Das Nähe-Distanz-Verhältnis ist ein Kernthema professioneller Pflege: Pflegende kommen Menschen körperlich und emotional sehr nah und müssen trotzdem ihre Rolle wahren.',
    'Geschenke, private Kontakte und Erbschaften regeln viele Einrichtungen in einer Dienstanweisung. Bei Heimen schränkt das Heimrecht Zuwendungen an Mitarbeitende ein.',
  ],
  'kom.zu.ohren': [
    'Schulz von Thun spricht auch von vier Schnäbeln beim Sender. Missverständnisse entstehen, wenn Sender und Empfänger unterschiedliche Seiten betonen.',
    'In der Pflege hilft es, den Appell bewusst zu hören und zu beantworten: „Ich komme jetzt zu Ihnen.“ Die Beziehungsseite lässt sich danach in Ruhe klären.',
  ],
  'kom.watzlawick': [
    'Watzlawick beschreibt fünf Axiome, darunter: Jede Kommunikation hat einen Inhalts- und einen Beziehungsaspekt, und Beziehungen sind entweder symmetrisch oder komplementär.',
    'Bei Menschen mit Demenz oder Aphasie wird die nonverbale Seite besonders wichtig: Mimik, Haltung, Berührung und Tonfall tragen oft mehr als Worte.',
  ],
  'kom.rogers': [
    'Rogers entwickelte die klientenzentrierte Gesprächsführung. Der Mensch gilt darin als Experte für sich selbst, die helfende Person begleitet und lenkt nicht.',
    'Echtheit heißt nicht, alles auszusprechen, was man denkt. Es heißt, keine Fassade aufzubauen und nichts vorzuspielen.',
  ],
  'kom.aktiv': [
    'Zum aktiven Zuhören gehören Blickkontakt, zugewandte Haltung, kurze Bestätigungen, Paraphrasieren (Inhalt wiedergeben) und Verbalisieren (Gefühl benennen).',
    'Wer verbalisiert, liegt nicht immer richtig. Das ist nicht schlimm: Die Person korrigiert und erklärt dann oft genauer, was sie bewegt.',
  ],
  'kom.ich': [
    'Eine Ich-Botschaft hat meist drei Teile: das Verhalten beschreiben, die eigene Wirkung oder das Gefühl nennen, die Folge oder den Wunsch formulieren.',
    'Rückmeldungen gelingen besser unter vier Augen und zeitnah. Vor anderen fühlen sich Menschen schnell bloßgestellt.',
  ],
  'kom.kultur': [
    'Nach dem Patientenrechtegesetz muss eine Aufklärung verständlich sein. Bei Sprachbarrieren sind qualifizierte Dolmetscherdienste oder Videodolmetschen der sichere Weg.',
    'Auch Pflegende bringen eine eigene Kultur mit. Kultursensibel heißt deshalb auch, die eigenen Selbstverständlichkeiten zu bemerken und zu hinterfragen.',
  ],
  'kom.stress': [
    'Der Begriff Burn-out wurde in den 1970er-Jahren gerade an helfenden Berufen beschrieben. Hohe Ansprüche an sich selbst und wenig Einfluss auf die Arbeitsbedingungen erhöhen das Risiko.',
    'Selbstpflege ist keine Privatsache: Arbeitgeber müssen psychische Belastungen in der Gefährdungsbeurteilung berücksichtigen (Arbeitsschutzgesetz).',
  ],
  'kom.fall.angehoerige': [
    'Deeskalation beginnt bei der eigenen Haltung: ruhige Stimme, offene Körperhaltung, Abstand halten, nicht unterbrechen. Wird es bedrohlich, Hilfe holen und den Raum verlassen dürfen.',
    'Angehörige erleben oft Schuldgefühle, weil sie die Pflege nicht selbst leisten können. Vorwürfe an die Pflege sind manchmal ein Ausdruck davon.',
  ],
  'mod.zu.autoren': [
    'Henderson definierte Pflege als Unterstützung des Menschen bei Aktivitäten, die er ohne Hilfe selbst ausführen würde, wenn er die Kraft, den Willen oder das Wissen hätte.',
    'Juchli entwickelte ihre ATL aus dem Modell von Roper, Logan und Tierney. Daher die Ähnlichkeit der Aufzählungen.',
  ],
  'mod.orem': [
    'Orem unterscheidet allgemeine Selbstpflegeerfordernisse (Luft, Wasser, Nahrung …), entwicklungsbedingte (z. B. im Alter) und gesundheitsbedingte (z. B. nach einer Operation).',
    'Selbstpflege kann auch stellvertretend durch Angehörige geleistet werden. Orem nennt das Dependenzpflege.',
  ],
  'mod.orem.system': [
    'Ziel ist meist, vom vollständig kompensatorischen über das teilweise kompensatorische zum unterstützend-erziehenden System zu kommen. Das stärkt Selbstständigkeit.',
    'Beratung und Schulung sind eigene pflegerische Aufgaben. Im Pflegeberufegesetz gehören sie zu den Kernaufgaben der Pflege.',
  ],
  'mod.krohwinkel': [
    'Krohwinkel entwickelte ihr Modell aus Forschung zur Pflege von Menschen nach Schlaganfall. Fördernde Prozesspflege fragt nach Fähigkeiten und Bedürfnissen, nicht nur nach Defiziten.',
    'In Deutschland ist das Modell in vielen Pflegedokumentationen verankert, wird aber zunehmend durch das Strukturmodell mit der SIS ergänzt oder ersetzt.',
  ],
  'mod.nutzen': [
    'Man unterscheidet große Theorien (sehr allgemein), Theorien mittlerer Reichweite (für bestimmte Situationen, z. B. Schmerz) und praxisnahe Theorien.',
    'Ein Modell passt nicht auf jede Situation. Fachpersonen wählen bewusst aus, was hilft, die Lage eines Menschen zu verstehen.',
  ],
  'mod.fall.anamnese': [
    'Trauer kann sich bei älteren Menschen wie eine Depression zeigen: Appetitlosigkeit, Schlafstörungen, Rückzug. Hält sie lange an, ist eine ärztliche Abklärung sinnvoll.',
    'Biografisches Arbeiten hilft beim Einzug: Gewohnheiten, Lieblingsspeisen, frühere Tagesabläufe geben Halt in der neuen Umgebung.',
  ],
  'qm.zu.donabedian': [
    'Avedis Donabedian beschrieb die drei Dimensionen in den 1960er-Jahren für die Medizin. Heute bilden sie den Kern vieler Qualitätsprüfungen, auch der Prüfungen in Pflegeeinrichtungen.',
    'Expertenstandards nutzen dieselbe Gliederung: Zu jedem Kriterium gibt es eine Struktur-, eine Prozess- und eine Ergebnisebene.',
  ],
  'qm.pdca': [
    'Der Zyklus wird auch Deming-Kreis genannt. Viele Qualitätsmanagementsysteme wie DIN EN ISO 9001 bauen auf ihm auf.',
    'Wichtig ist der kleine Rahmen bei „Do“: Erst testen, dann ausrollen. So bleibt der Schaden gering, wenn eine Maßnahme nicht wirkt.',
  ],
  'qm.cirs': [
    'Ein Beinahe-Fehler ist ein Fehler, der bemerkt wurde, bevor er Schaden anrichten konnte. Gerade diese Meldungen sind wertvoll, weil sie zeigen, wo das System anfällig ist.',
    'Krankenhäuser sind in Deutschland verpflichtet, ein Fehlermeldesystem zu betreiben. Meldungen werden ausgewertet und die Ergebnisse dem Team zurückgemeldet.',
  ],
  'ebn.schritte': [
    'Der Begriff kommt aus der evidenzbasierten Medizin. Evidence heißt im Englischen Beleg oder Nachweis.',
    'Für den Alltag sind Leitlinien und Expertenstandards eine wichtige Abkürzung: Dort haben Fachleute die Studienlage schon zusammengefasst und bewertet.',
  ],
  'ebn.pico': [
    'Für Fragen nach Erleben und Bedeutung (z. B. „Wie erleben Angehörige den Heimeinzug?“) eignen sich eher qualitative Studien mit Interviews.',
    'Datenbanken wie PubMed, CINAHL oder die Cochrane Library durchsucht man mit Schlüsselbegriffen aus der PICO-Frage, meist auf Englisch.',
  ],
  'ebn.evidenz': [
    'Evidenzstufen sind ein Hinweis, kein Urteil: Eine schlecht gemachte randomisierte Studie kann weniger aussagen als eine sorgfältige Beobachtungsstudie.',
    'Bei einer Studie fragt man: Wer wurde untersucht, passt das zu meinen Patienten, wie groß ist der Effekt, und wer hat die Studie bezahlt?',
  ],
  'qm.fall.sturz': [
    'Nach dem Expertenstandard Sturzprophylaxe werden Sturzrisikofaktoren individuell eingeschätzt. Pauschale Skalen allein sagen Stürze nicht zuverlässig voraus.',
    'Der Werdenfelser Weg ist ein Verfahren, um freiheitsentziehende Maßnahmen zu vermeiden. Er wird in vielen Regionen Deutschlands bei Genehmigungsverfahren angewandt.',
  ],
  'vers.zu.sektoren': [
    'Die Sektoren (ambulant, stationär, Rehabilitation, Langzeitpflege) sind in Deutschland unterschiedlich finanziert. Das erschwert eine nahtlose Versorgung.',
    'Verhinderungspflege springt ein, wenn die private Pflegeperson verhindert ist; Kurzzeitpflege bietet einen Platz in einer Einrichtung für eine begrenzte Zeit.',
  ],
  'vers.kosten': [
    'Häusliche Krankenpflege nach § 37 SGB V umfasst unter anderem Medikamentengabe, Injektionen, Verbandwechsel und Kompressionsstrümpfe. Der Hausarzt verordnet sie auf einem eigenen Formular.',
    'Ein Pflegegrad ist keine Voraussetzung für Behandlungspflege. Umgekehrt zahlt die Pflegekasse keine ärztlich verordneten Leistungen.',
  ],
  'vers.entlassung': [
    'Häufige Probleme nach Entlassung sind fehlende Medikamente am Wochenende, nicht gelieferte Hilfsmittel und unklare Wundversorgung. Viele Wiederaufnahmen lassen sich so erklären.',
    'Seit 2017 sind Krankenhäuser zu einem strukturierten Entlassmanagement verpflichtet. Sie dürfen dafür auch Verordnungen für kurze Zeit nach der Entlassung ausstellen.',
  ],
  'vers.fall.entlassung': [
    'Eine Einweisung ins Heim gegen den Willen eines einwilligungsfähigen Menschen ist nicht zulässig. Auch riskante Entscheidungen gehören zur Selbstbestimmung.',
    'Hausnotrufsysteme und Essen auf Rädern ergänzen die Versorgung allein lebender Menschen. Mit Pflegegrad beteiligt sich die Pflegekasse an manchen dieser Kosten.',
  ],
};
