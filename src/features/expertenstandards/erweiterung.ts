// Expertenstandards-Trainer, Ausbau: Fälle, die den Pflegeprozess eines Standards durchspielen, und Zuordnungen.
// Grundlage: Expertenstandards des DNQP in ihrer aktuellen Fassung. Thema als Text (kein Importzyklus mit aufgaben.ts).

import type { Aufgabe } from '../quiz/quiz';

const T = ['thema.qw.expertenstandards'];

export const ERWEITERUNG: Partial<Record<'aufbau' | 'prophylaxe' | 'versorgung', Aufgabe[]>> = {
  aufbau: [
    {
      id: 'zu.spe', art: 'zuordnen', topicIds: T, titel: 'Struktur, Prozess oder Ergebnis?', stufe: 2,
      frage: 'Ordne jede Aussage der Kriterienebene zu.',
      paare: [
        { links: 'Die Einrichtung hält Hüftprotektoren vor.', rechts: 'Struktur' },
        { links: 'Die Pflegefachkraft passt die Umgebung an die Risikofaktoren an.', rechts: 'Prozess' },
        { links: 'Der Patient kennt seine Sturzrisikofaktoren.', rechts: 'Ergebnis' },
        { links: 'Die Pflegefachkraft verfügt über Wissen zur Schmerzeinschätzung.', rechts: 'Struktur' },
        { links: 'Die Pflegefachkraft überprüft die Wirkung der Maßnahmen.', rechts: 'Prozess' },
        { links: 'Ein individueller Maßnahmenplan liegt vor.', rechts: 'Ergebnis' },
      ],
      erklaerung: ['Struktur: Was vorhanden ist. Prozess: Was die Pflegefachkraft tut. Ergebnis: Was erreicht oder nachweisbar ist.'],
    },
    {
      id: 'zu.standards', art: 'zuordnen', topicIds: T, titel: 'Welcher Standard passt?', stufe: 2,
      frage: 'Ordne jedem Instrument oder Begriff den Expertenstandard zu, in dem er eine Rolle spielt.',
      paare: [
        { links: 'Kontinenzprofile', rechts: 'Kontinenzförderung' },
        { links: 'Fingertest bei Rötung', rechts: 'Dekubitusprophylaxe' },
        { links: 'Initiales Assessment kurz nach Aufnahme', rechts: 'Entlassungsmanagement' },
        { links: 'Person-zentrierte Haltung nach Kitwood', rechts: 'Beziehungsgestaltung bei Demenz' },
        { links: 'Numerische Rating-Skala', rechts: 'Schmerzmanagement' },
      ],
      erklaerung: ['Jeder Standard hat seine typischen Instrumente. Sie helfen, die Einschätzung systematisch zu machen.'],
    },
    {
      id: 'fall.einfuehrung', art: 'fall', topicIds: T, titel: 'Fall: Ein Standard kommt auf Station', stufe: 3,
      frage: 'Weißt du, wie ein Expertenstandard in den Alltag kommt?',
      einstieg: 'Deine Station soll den aktualisierten Expertenstandard Sturzprophylaxe einführen. Die Stationsleitung bittet dich, in der Projektgruppe mitzuarbeiten.',
      schritte: [
        {
          lage: 'In der ersten Sitzung fragt eine Kollegin: „Können wir den Standard nicht einfach ausdrucken und aufhängen?“',
          frage: 'Was antwortest du?', optionen: ['Der Standard muss an die Station angepasst werden, zum Beispiel als Verfahrensanweisung mit klaren Zuständigkeiten', 'Ja, Aushängen reicht, weil der Standard verbindlich ist', 'Nein, Expertenstandards gelten nur in Pflegeheimen', 'Wir sollten ihn nur lesen, wenn es Probleme gibt'],
          richtig: [0], mehrfach: false,
          warum: 'Expertenstandards beschreiben ein Qualitätsniveau, nicht jeden Handgriff. Wie es auf einer Station erreicht wird, legt die Einrichtung selbst fest.',
        },
        {
          lage: 'Die Gruppe plant die Einführung.',
          frage: 'Was gehört zu einer guten Einführung? Wähle alle zutreffenden.', optionen: ['Schulungen für alle Pflegenden', 'Benötigtes Material prüfen und beschaffen, zum Beispiel Niedrigbetten oder Hüftprotektoren', 'Festlegen, wie und wo dokumentiert wird', 'Den Standard ohne Absprache mit anderen Berufsgruppen einführen'],
          richtig: [0, 1, 2], mehrfach: true,
          warum: 'Strukturkriterien beschreiben, was die Einrichtung bereitstellt: Wissen, Material, Regeln. Sturzprophylaxe braucht außerdem Ärztinnen, Physiotherapie und Hauswirtschaft.',
        },
        {
          lage: 'Nach sechs Monaten will die Leitung wissen, ob der Standard wirkt.',
          frage: 'Wie prüft ihr das?', optionen: ['Mit einem Audit: Stichprobe von Pflegedokumentationen und Befragungen anhand der Ergebniskriterien', 'Nur die Zahl der Stürze vom letzten Monat ansehen', 'Gar nicht, eingeführt ist eingeführt', 'Die Patientinnen fragen, ob sie den Standard kennen'],
          richtig: [0], mehrfach: false,
          warum: 'Das DNQP stellt zu jedem Standard ein Auditinstrument bereit. Es fragt die Ergebniskriterien ab, etwa ob das Sturzrisiko eingeschätzt und dokumentiert wurde.',
        },
      ],
      erklaerung: ['Einführen heißt: anpassen, schulen, ausstatten, dokumentieren und danach mit einem Audit prüfen.', 'Struktur-, Prozess- und Ergebniskriterien greifen ineinander.'],
    },
  ],
  prophylaxe: [
    {
      id: 'fall.dekubitus', art: 'fall', topicIds: T, titel: 'Fall: Dekubitusprophylaxe im Pflegeprozess', stufe: 3,
      frage: 'Wie gehst du nach dem Expertenstandard vor?',
      einstieg: 'Frau H., 88 Jahre, wird nach einem Oberschenkelhalsbruch operiert und kommt auf deine Station. Sie bewegt sich kaum selbst im Bett.',
      schritte: [
        { lage: 'Bei der Aufnahme fällt dir die eingeschränkte Bewegung auf.', frage: 'Was ist der erste Schritt nach dem Standard?', optionen: ['Ein Screening und bei Hinweisen eine differenzierte Einschätzung des Dekubitusrisikos', 'Sofort eine Wechseldruckmatratze bestellen, ohne Einschätzung', 'Abwarten, ob eine Rötung entsteht'], richtig: [0], mehrfach: false, warum: 'Der Standard beginnt mit der Einschätzung. Maßnahmen folgen daraus und passen dann zur Person.' },
        { lage: 'Die Einschätzung zeigt ein Risiko. Frau H. kann sich mit Anleitung etwas zur Seite drehen.', frage: 'Welche Maßnahmen planst du?', optionen: ['Eigenbewegung fördern und anleiten', 'Individuellen Bewegungsplan für Positionswechsel', 'Fersen frei lagern', 'Gerötete Stellen kräftig massieren'], richtig: [0, 1, 2], mehrfach: true, warum: 'Bewegung und Druckentlastung stehen im Mittelpunkt. Massage schädigt gefährdetes Gewebe.' },
        { lage: 'Am dritten Tag ist über dem Kreuzbein eine Rötung, die beim Fingertest rot bleibt.', frage: 'Was bedeutet das für die Evaluation?', optionen: ['Ein Dekubitus Kategorie 1 ist entstanden: Plan anpassen, Stelle konsequent entlasten, dokumentieren', 'Alles in Ordnung, weiter wie bisher', 'Nur dokumentieren, Maßnahmen ändern sich nicht'], richtig: [0], mehrfach: false, warum: 'Die Evaluation prüft, ob die Maßnahmen wirken. Ein neu entstandener Dekubitus heißt, der Plan reicht nicht aus.' },
      ],
      erklaerung: ['Expertenstandards folgen dem Pflegeprozess: einschätzen, planen, durchführen, evaluieren und anpassen.'],
    },
    {
      id: 'fall.sturz', art: 'fall', topicIds: T, titel: 'Fall: Nach dem Sturz', stufe: 3,
      frage: 'Wie gehst du nach dem Expertenstandard Sturzprophylaxe vor?',
      einstieg: 'Herr R., 83 Jahre, ist nachts auf dem Weg zur Toilette gestürzt. Er hat sich nicht verletzt, ist aber verunsichert.',
      schritte: [
        { lage: 'Am Morgen besprichst du den Sturz im Team.', frage: 'Was gehört zur Sturzanalyse?', optionen: ['Uhrzeit, Ort und Hergang', 'Was Herr R. selbst über den Sturz sagt', 'Folgen und Begleitumstände wie Licht oder Schuhe', 'Die Schuldfrage im Team'], richtig: [0, 1, 2], mehrfach: true, warum: 'Die Analyse soll Ursachen finden, nicht Schuld verteilen. Nur so werden Stürze ehrlich gemeldet.' },
        { lage: 'Er nimmt abends ein Schlafmittel und hat nachts häufig Harndrang.', frage: 'Welche Maßnahmen passen?', optionen: ['Ärztlich die Schlafmedikation überprüfen lassen', 'Nachtlicht und freier Weg zur Toilette', 'Toilettengang vor dem Schlafen anbieten, Urinflasche in Reichweite', 'Bettgitter hochziehen, ohne ihn zu fragen'], richtig: [0, 1, 2], mehrfach: true, warum: 'Die Maßnahmen setzen an seinen Risikofaktoren an. Ein Bettgitter ohne Einwilligung ist eine freiheitsentziehende Maßnahme und erhöht die Verletzungsgefahr.' },
        { lage: 'Herr R. traut sich seit dem Sturz kaum noch allein zu gehen.', frage: 'Wie gehst du mit seiner Sturzangst um?', optionen: ['Ansprechen und ernst nehmen, begleitetes Gehen und Kraft- und Balanceübungen anbieten', 'Ihn im Bett lassen, damit nichts mehr passiert', 'Die Angst ignorieren, sie vergeht von allein'], richtig: [0], mehrfach: false, warum: 'Sturzangst führt zu Bewegungsmangel und erhöht so das Sturzrisiko weiter. Begleitung und Training geben Sicherheit zurück.' },
      ],
      erklaerung: ['Nach einem Sturz wird nicht nur dokumentiert, sondern analysiert und der Maßnahmenplan angepasst.'],
    },
  ],
  versorgung: [
    {
      id: 'fall.schmerz', art: 'fall', topicIds: T, titel: 'Fall: Schmerzmanagement bei Demenz', stufe: 3,
      frage: 'Wie schätzt du Schmerzen ein, wenn die Selbstauskunft fehlt?',
      einstieg: 'Frau W., 90 Jahre, mit fortgeschrittener Demenz, ruft seit dem Morgen immer wieder laut und wehrt sich bei der Körperpflege.',
      schritte: [
        { lage: 'Auf die Frage „Haben Sie Schmerzen?“ antwortet sie nicht verständlich.', frage: 'Wie schätzt du die Schmerzen ein?', optionen: ['Mit einer Fremdeinschätzung wie BESD, durch Beobachtung von Atmung, Lauten, Gesicht, Körpersprache und Trost', 'Gar nicht, ohne Selbstauskunft geht es nicht', 'Mit der Numerischen Rating-Skala 0 bis 10'], richtig: [0], mehrfach: false, warum: 'Wenn eine Selbstauskunft nicht möglich ist, kommt eine strukturierte Fremdeinschätzung zum Einsatz. Die NRS setzt Verständnis voraus.' },
        { lage: 'Die Beobachtung zeigt deutliche Schmerzzeichen, vor allem beim Bewegen des rechten Beins.', frage: 'Was folgt?', optionen: ['Ärztin informieren, Ursache abklären lassen und Schmerztherapie anregen', 'Beruhigungsmittel anfordern, damit sie ruhiger wird', 'Abwarten bis morgen'], richtig: [0], mehrfach: false, warum: 'Unruhe und Abwehr können Schmerzausdruck sein. Ein Beruhigungsmittel würde den Schmerz verdecken statt behandeln.' },
        { lage: 'Sie bekommt ein Schmerzmittel nach Anordnung.', frage: 'Was gehört danach dazu?', optionen: ['Nach angemessener Zeit erneut mit demselben Instrument einschätzen', 'Nebenwirkungen beobachten', 'Ergebnis dokumentieren und Plan anpassen', 'Nichts mehr, das Mittel wirkt sicher'], richtig: [0, 1, 2], mehrfach: true, warum: 'Verlaufskontrolle mit demselben Instrument macht die Wirkung vergleichbar.' },
      ],
      erklaerung: ['Bei Menschen mit Demenz werden Schmerzen oft übersehen und als Verhalten fehlgedeutet. Strukturierte Beobachtung schützt davor.'],
    },
    {
      id: 'zu.kontinenz', art: 'zuordnen', topicIds: T, titel: 'Kontinenzprofile zuordnen', stufe: 2,
      frage: 'Ordne jede Situation dem Kontinenzprofil zu.',
      paare: [
        { links: 'Geht nach eigenem Plan zur Toilette und bleibt trocken', rechts: 'Unabhängig erreichte Kontinenz' },
        { links: 'Wird zu festen Zeiten zur Toilette begleitet und bleibt trocken', rechts: 'Abhängig erreichte Kontinenz' },
        { links: 'Verliert Urin, wechselt Vorlagen selbst', rechts: 'Unabhängig kompensierte Inkontinenz' },
        { links: 'Verliert Urin, Pflege wechselt das Inkontinenzmaterial', rechts: 'Abhängig kompensierte Inkontinenz' },
        { links: 'Verliert Urin, kein Hilfsmittel, Kleidung oft nass', rechts: 'Nicht kompensierte Inkontinenz' },
      ],
      erklaerung: ['Erreicht = kontinent mit Maßnahmen. Kompensiert = Harn- oder Stuhlverlust wird aufgefangen. Unabhängig oder abhängig = mit oder ohne Hilfe anderer.', 'Seit der Aktualisierung 2024 gelten die Profile für Harn- und Stuhlkontinenz (Expertenstandard Kontinenzförderung, Präambel).'],
    },
  ],
};

export const ERWEITERUNG_VERTIEFUNG: Record<string, string[]> = {
  'zu.spe': [
    'In Prüfungen wird oft eine Aussage vorgegeben, die man einordnen soll. Das Verb verrät die Ebene: „verfügt über“ und „stellt bereit“ ist Struktur, „schätzt ein“ und „berät“ ist Prozess, „liegt vor“ und „ist gelindert“ ist Ergebnis.',
    'Die drei Ebenen hängen zusammen: Ohne Hüftprotektoren (Struktur) kann die Pflegefachkraft sie nicht anbieten (Prozess), und das Ergebnis bleibt aus.',
  ],
  'zu.standards': [
    'Alle Standards haben einen ähnlichen Aufbau: Präambel, Standardaussage, Begründung und die Kriterien in S, P und E. Dazu kommen Kommentare und eine Literaturstudie.',
    'Neuere Standards sind Mundgesundheit (2023) und Hautintegrität (2024). Der Standard zur Mobilität wurde für den früheren § 113a SGB XI entwickelt, aber nie in Kraft gesetzt und steht nicht in der DNQP-Übersicht. § 113a wurde zum 1. Juli 2023 aufgehoben.',
  ],
  'fall.dekubitus': [
    'Gefährdet sind vor allem Menschen mit eingeschränkter Mobilität, schlechter Durchblutung, Feuchtigkeit der Haut und Mangelernährung. Nach Operationen kommen Schmerzen und Narkosefolgen dazu.',
    'Hilfsmittel wie Weichlagerungs- oder Wechseldruckmatratzen unterstützen, ersetzen aber nicht die Bewegungsförderung. Auch auf ihnen werden Positionen gewechselt.',
  ],
  'fall.sturz': [
    'Viele Einrichtungen nutzen ein Sturzprotokoll. Es hilft, Muster zu erkennen: Wiederholen sich Stürze zur selben Uhrzeit, am selben Ort oder nach bestimmten Medikamenten?',
    'Schlafmittel aus der Gruppe der Benzodiazepine und Z-Substanzen erhöhen das Sturzrisiko älterer Menschen deutlich. Sie stehen auf der PRISCUS-Liste.',
  ],
  'fall.schmerz': [
    'BESD (Beurteilung von Schmerzen bei Demenz) bewertet fünf Bereiche mit je 0 bis 2 Punkten. Ab einem bestimmten Wert sind Schmerzen wahrscheinlich, die genaue Bewertung steht in der Anleitung des Instruments.',
    'Typische Schmerzursachen bei Menschen mit Demenz sind unentdeckte Brüche nach Stürzen, Zahnprobleme, Verstopfung, Harnverhalt und Druckstellen.',
  ],
  'zu.kontinenz': [
    'Zwischen den Profilen kann man sich bewegen. Ziel der Pflege ist, die Person in ein selbstständigeres Profil zu bringen, etwa durch Blasentraining, Hilfsmittel zum Toilettengang oder Beckenbodentraining.',
    'Zur Einschätzung gehören ein Miktionsprotokoll, die Frage nach Ursachen (Infekt, Medikamente, Mobilität) und die Wünsche der Person.',
  ],
  'fall.einfuehrung': [
    'Das DNQP führt neue Standards modellhaft in mehreren Einrichtungen ein, bevor sie veröffentlicht werden. Die Erfahrungen fließen in den Abschlussbericht ein.',
    'Eine gesetzliche Einführung über den früheren § 113a SGB XI gab es nie, der Paragraf ist seit 1. Juli 2023 aufgehoben. Pflegeeinrichtungen müssen aber nach dem allgemein anerkannten Stand pflegen (§ 11 Abs. 1 SGB XI), und dafür gelten Expertenstandards auch vor Gericht als wichtiger Maßstab.',
  ],
};
