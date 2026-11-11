// Arzneimittel-Trainer: sicherer Umgang (6-R-Regel, Richten, BtM), Applikationsformen,
// Wirkstoffgruppen an der Endung erkennen und typische Nebenwirkungen beobachten.
// Lehrbuchwissen für die Pflege. Verordnung, Beipackzettel und Hausstandard gehen vor.

import { ergaenze, mitVertiefung, type Aufgabe, type AuswahlAufgabe } from '../quiz/quiz';
import { VERTIEFUNG } from './vertiefung';
import { ERWEITERUNG } from './erweiterung';

export const AM_THEMA = 'thema.ph.medikamente';

export type BereichId = 'sicherheit' | 'applikation' | 'gruppen' | 'beobachtung';
export interface Bereich { id: BereichId; label: string; kurz: string; wissen: string[] }

function frage(id: string, titel: string, f: string, optionen: string[], erklaerung: string[], richtig = [0], mehrfach = false): AuswahlAufgabe {
  return { id, art: 'auswahl', topicIds: [AM_THEMA], titel, frage: f, optionen, richtig, mehrfach, erklaerung };
}

// ---------------------------------------------------------------- Sicherheit

const sicherheit: Aufgabe[] = [
  frage('sicherheit.6r', '6-R-Regel', 'Was gehört zur 6-R-Regel? Wähle alle zutreffenden.',
    ['Richtiger Patient', 'Richtiges Arzneimittel', 'Richtige Dosierung', 'Richtige Applikationsart', 'Richtiger Zeitpunkt', 'Richtige Dokumentation', 'Richtiger Preis'],
    ['Die 6-R-Regel wird vor jeder Gabe geprüft. Manche Lehrbücher erweitern sie (z. B. richtige Aufbewahrung, richtige Information).'],
    [0, 1, 2, 3, 4, 5], true),
  {
    id: 'sicherheit.richten', art: 'reihenfolge', topicIds: [AM_THEMA], titel: 'Medikamente richten und verabreichen',
    frage: 'Bring die Schritte beim Richten und Verabreichen von Tabletten in eine sinnvolle Reihenfolge.',
    schritte: ['Aktuelle ärztliche Anordnung prüfen', 'Hände desinfizieren', 'Medikament nach Plan richten: Name, Stärke, Verfallsdatum prüfen', 'Gerichtete Medikamente kontrollieren (Vier-Augen-Prinzip, wenn vorgesehen)', 'Beim Patienten die Identität prüfen', 'Einnahme ermöglichen und beobachten', 'Gabe dokumentieren'],
    erklaerung: ['Dokumentiert wird erst nach der Gabe, nie im Voraus.', 'Einzelne Schritte regelt der Hausstandard, die Grundidee bleibt: prüfen, richten, kontrollieren, geben, dokumentieren.'],
  },
  frage('sicherheit.retard', 'Darreichungsform', 'Eine Patientin kann ihre Retardtablette schlecht schlucken. Darfst du sie mörsern?',
    ['Nein, nicht ohne Rücksprache: Die verzögerte Freisetzung geht verloren, die ganze Dosis wirkt auf einmal', 'Ja, Mörsern ist immer erlaubt', 'Ja, wenn man sie in Saft auflöst', 'Ja, aber nur zur Hälfte'],
    ['Auch magensaftresistente Tabletten nicht teilen oder mörsern. Ob es eine andere Darreichungsform gibt, klärt die Ärztin oder die Apotheke.']),
  frage('sicherheit.btm', 'Betäubungsmittel', 'Was gilt für Betäubungsmittel (BtM) wie Morphin auf Station? Wähle alle zutreffenden.',
    ['Aufbewahrung in einem gesonderten, verschlossenen Fach', 'Jeder Zu- und Abgang wird lückenlos nachgewiesen', 'Bestände werden regelmäßig gezählt und abgezeichnet', 'Reste dürfen für andere Patienten weiterverwendet werden'],
    ['Grundlage sind das Betäubungsmittelgesetz und die Betäubungsmittel-Verschreibungsverordnung. Verworfene Reste werden nach Hausregel unter Zeugen dokumentiert.'],
    [0, 1, 2], true),
  frage('sicherheit.unklar', 'Anordnung', 'Die Dosis auf dem Medikamentenplan kommt dir ungewöhnlich hoch vor. Was tust du?',
    ['Vor der Gabe bei der verordnenden Ärztin nachfragen', 'Trotzdem geben, die Ärztin wird es wissen', 'Selbst die übliche Dosis geben', 'Gar nicht geben und nichts sagen'],
    ['Wer ein Medikament verabreicht, trägt die Durchführungsverantwortung. Zweifel immer vorher klären und dokumentieren.']),
];

// ---------------------------------------------------------------- Applikation

const applikation: Aufgabe[] = [
  frage('applikation.sc', 'Applikationsformen', 'Welche Medikamente werden typischerweise subkutan (s. c.) gespritzt?',
    ['Insulin und niedermolekulares Heparin', 'Antibiotika-Kurzinfusionen', 'Kaliumchlorid-Konzentrat', 'Nitrospray'],
    ['Subkutan = ins Unterhautfettgewebe. Typische Stellen: Bauch, Oberschenkel, Oberarm. Stellen wechseln, um Verhärtungen (Lipodystrophie) zu vermeiden.']),
  frage('applikation.sublingual', 'Applikationsformen', 'Warum wirkt ein Nitro-Spray unter die Zunge (sublingual) so schnell?',
    ['Der Wirkstoff gelangt über die Mundschleimhaut direkt ins Blut, ohne erst durch Magen und Leber zu gehen', 'Weil es geschluckt wird', 'Weil es in der Lunge wirkt', 'Weil es eine Retardform ist'],
    ['Über die Mundschleimhaut wird die Leber zunächst umgangen (kein First-Pass-Effekt). Vorher Blutdruck beachten: Nitro senkt ihn.']),
  frage('applikation.pflaster', 'Applikationsformen', 'Was beachtest du bei einem Fentanyl-Schmerzpflaster? Wähle alle zutreffenden.',
    ['Klebestelle wechseln und Datum dokumentieren', 'Keine Wärme auf das Pflaster (Wärmflasche, Heizdecke, Sauna)', 'Altes Pflaster entfernen, bevor das neue geklebt wird', 'Pflaster bei Bedarf zerschneiden, um die Dosis zu halbieren'],
    ['Wärme steigert die Aufnahme, es droht eine Überdosierung mit Atemdepression. Auch Fieber kann die Aufnahme erhöhen.'],
    [0, 1, 2], true),
  {
    id: 'applikation.wirkeintritt', art: 'reihenfolge', topicIds: [AM_THEMA], titel: 'Wirkungseintritt',
    frage: 'Ordne die Applikationswege nach dem Wirkungseintritt, vom schnellsten zum langsamsten.',
    schritte: ['Intravenös (i. v.)', 'Intramuskulär (i. m.)', 'Subkutan (s. c.)', 'Oral als Tablette', 'Transdermal als Pflaster'],
    erklaerung: ['I. v. wirkt sofort, weil der Wirkstoff direkt im Blut ist. Pflaster wirken erst nach Stunden, dafür gleichmäßig über Tage.', 'Die Reihenfolge ist eine Faustregel, einzelne Präparate können abweichen.'],
  },
  frage('applikation.augentropfen', 'Applikationsformen', 'Wie gibst du Augentropfen richtig?',
    ['Unteres Lid leicht herunterziehen, in den Bindehautsack tropfen, Flasche berührt das Auge nicht', 'Direkt auf die Hornhaut tropfen', 'Ins obere Lid tropfen und kräftig reiben', 'Flaschenspitze auf das Auge setzen, damit nichts danebengeht'],
    ['Danach Augen schließen lassen und leicht auf den inneren Lidwinkel drücken. Mehrere Präparate mit etwa 5 Minuten Abstand.']),
];

// ---------------------------------------------------------------- Wirkstoffgruppen

const GRUPPEN = ['ACE-Hemmer (Blutdruck, Herzinsuffizienz)', 'Betablocker (Blutdruck, Herzfrequenz)', 'Sartane (AT1-Blocker, Blutdruck)', 'Statine (Cholesterinsenker)', 'Protonenpumpenhemmer (Magenschutz)', 'Penicilline (Antibiotika)'];

function endung(id: string, wirkstoff: string, richtig: number, hinweis: string): AuswahlAufgabe {
  return {
    id: `gruppen.${id}`, art: 'auswahl', topicIds: [AM_THEMA], titel: 'Wirkstoffgruppen',
    frage: `Zu welcher Gruppe gehört ${wirkstoff}?`,
    optionen: GRUPPEN, richtig: [richtig], mehrfach: false,
    erklaerung: ['Endungen: -pril ACE-Hemmer, -olol Betablocker, -sartan Sartane, -statin Statine, -prazol Protonenpumpenhemmer, -cillin Penicilline.', hinweis],
  };
}

const gruppen: Aufgabe[] = [
  endung('ramipril', 'Ramipril', 0, 'Typische Nebenwirkung von ACE-Hemmern ist ein trockener Reizhusten.'),
  endung('metoprolol', 'Metoprolol', 1, 'Betablocker senken die Herzfrequenz: Puls vor der Gabe prüfen, bei Bradykardie Rücksprache.'),
  endung('candesartan', 'Candesartan', 2, 'Sartane wirken ähnlich wie ACE-Hemmer, verursachen aber kaum Reizhusten.'),
  endung('simvastatin', 'Simvastatin', 3, 'Muskelschmerzen unter Statinen melden, sie können auf eine seltene Muskelschädigung hinweisen.'),
  endung('pantoprazol', 'Pantoprazol', 4, 'Protonenpumpenhemmer werden meist vor dem Frühstück gegeben.'),
  endung('amoxicillin', 'Amoxicillin', 5, 'Vor der ersten Gabe nach einer Penicillinallergie fragen.'),
  endung('bisoprolol', 'Bisoprolol', 1, 'Betablocker nicht abrupt absetzen, es drohen Blutdruckspitzen und Herzrasen.'),
  endung('enalapril', 'Enalapril', 0, 'Unter ACE-Hemmern kann das Kalium steigen.'),
];

// ---------------------------------------------------------------- Beobachtung

const beobachtung: Aufgabe[] = [
  frage('beobachtung.opioid', 'Opioide', 'Welche Nebenwirkung von Opioiden wie Morphin hält während der ganzen Therapie an und braucht fast immer eine Vorbeugung?',
    ['Verstopfung (Obstipation)', 'Übelkeit', 'Müdigkeit', 'Juckreiz'],
    ['Übelkeit und Müdigkeit lassen meist nach einigen Tagen nach, die Verstopfung nicht. Deshalb wird oft gleich ein Abführmittel mit angeordnet.', 'Gefährlichste Nebenwirkung ist die Atemdepression: Atemfrequenz und Wachheit beobachten.']),
  frage('beobachtung.antikoag', 'Gerinnungshemmer', 'Ein Patient nimmt einen Gerinnungshemmer. Welche Beobachtungen meldest du? Wähle alle zutreffenden.',
    ['Neue blaue Flecken ohne Grund', 'Schwarzer, teerartiger Stuhl', 'Zahnfleisch- oder Nasenbluten', 'Leicht erhöhte Trinkmenge'],
    ['Teerstuhl kann auf eine Blutung im Magen-Darm-Trakt hinweisen. Unter Gerinnungshemmern keine i. m.-Injektionen, weiche Zahnbürste, Sturzprophylaxe.'],
    [0, 1, 2], true),
  frage('beobachtung.diuretika', 'Diuretika', 'Warum werden Diuretika wie Furosemid meist morgens gegeben?',
    ['Damit die vermehrte Urinausscheidung nicht in die Nacht fällt: weniger nächtliche Toilettengänge und Stürze', 'Weil sie abends nicht wirken', 'Weil sie auf nüchternen Magen giftig sind', 'Weil sie den Schlaf fördern'],
    ['Unter Diuretika täglich wiegen, Ein- und Ausfuhr beobachten und auf Zeichen von Kaliummangel (Muskelschwäche) und Austrocknung achten.']),
  frage('beobachtung.nsar', 'Schmerzmittel', 'Welche Risiken haben NSAR wie Ibuprofen und Diclofenac bei älteren Menschen? Wähle alle zutreffenden.',
    ['Magengeschwüre und Magenblutungen', 'Verschlechterung der Nierenfunktion', 'Blutdruckanstieg und Wassereinlagerungen', 'Abhängigkeit wie bei Opioiden'],
    ['Deshalb oft nur kurz und mit Magenschutz. Bei Paracetamol droht in Überdosis ein Leberschaden.'],
    [0, 1, 2], true),
  frage('beobachtung.insulin', 'Insulin', 'Du hast kurz wirksames Insulin zum Essen gegeben, der Patient isst dann aber kaum etwas. Worauf achtest du?',
    ['Auf Zeichen einer Unterzuckerung (Schwitzen, Zittern, Unruhe) und Blutzucker kontrollieren, ärztlich melden', 'Auf eine Überzuckerung', 'Auf Verstopfung', 'Auf nichts Besonderes'],
    ['Kurz wirksames Insulin braucht die Mahlzeit. Bei unsicherer Nahrungsaufnahme wird es manchmal erst nach dem Essen nach gegessener Menge gegeben, wenn so angeordnet.']),
];

export const BEREICHE: Bereich[] = [
  {
    id: 'sicherheit', label: 'Sicherer Umgang', kurz: '6-R-Regel, Richten, Retardformen, BtM',
    wissen: ['6 R: Patient, Arzneimittel, Dosierung, Applikationsart, Zeitpunkt, Dokumentation.', 'Retard- und magensaftresistente Tabletten nicht teilen oder mörsern.', 'BtM verschlossen aufbewahren, jeden Zu- und Abgang nachweisen.'],
  },
  {
    id: 'applikation', label: 'Applikation', kurz: 's. c., sublingual, Pflaster, Augentropfen, Wirkeintritt',
    wissen: ['i. v. wirkt sofort, Pflaster erst nach Stunden.', 'Sublingual umgeht zunächst die Leber.', 'Schmerzpflaster: keine Wärme, Stelle wechseln, Datum notieren.'],
  },
  {
    id: 'gruppen', label: 'Wirkstoffgruppen', kurz: 'An der Endung erkennen: -pril, -olol, -sartan, -statin, -prazol, -cillin',
    wissen: ['-pril ACE-Hemmer, -olol Betablocker, -sartan Sartane.', '-statin Cholesterinsenker, -prazol Magenschutz, -cillin Penicilline.'],
  },
  {
    id: 'beobachtung', label: 'Wirkung beobachten', kurz: 'Opioide, Gerinnungshemmer, Diuretika, NSAR, Insulin',
    wissen: ['Opioide: Verstopfung bleibt, Atemdepression beobachten.', 'Gerinnungshemmer: Blutungszeichen melden.', 'Diuretika morgens, täglich wiegen.'],
  },
];

export const AUFGABEN: Record<BereichId, Aufgabe[]> = mitVertiefung(ergaenze({ sicherheit, applikation, gruppen, beobachtung }, ERWEITERUNG), VERTIEFUNG);
export const ALLE_AUFGABEN: Aufgabe[] = Object.values(AUFGABEN).flat();
