// „Was ist neu“ für Testerinnen und Tester: damit sie wissen, was sie sich seit dem letzten Besuch ansehen können.
// Von Hand gepflegt: bei größeren Neuerungen oben einen Eintrag ergänzen (neuestes zuerst, Datum JJJJ-MM-TT).
// Pfad muss eine bestehende Seite sein (Test prüft das).

export interface Neuigkeit { datum: string; titel: string; text: string; pfad: string }

export const NEUIGKEITEN: Neuigkeit[] = [
  { datum: '2026-11-20', titel: 'Ein Wissenstrainer statt neun', text: 'Anatomie, Arzneimittel, Normwerte, Labor, Hygiene, Notfall, Expertenstandards, Recht und Grundlagen liegen jetzt in einem Trainer. Neu: eigene Runde aus mehreren Fachgebieten zusammenstellen und alle Schwachstellen auf einmal üben. Dein Stand, das Fehlerheft und alte Links bleiben erhalten.', pfad: '/lernen/wissen' },
  { datum: '2026-11-16', titel: 'Zwei neue Testaufträge', text: 'Gesprächssimulator und Praxiseinsatz gehören jetzt zum Rundgang. Auch Physiologie-Modelle und Praxiseinsatz zeigen unten „Passt dazu“.', pfad: '/system/test' },
  { datum: '2026-11-16', titel: 'Physiologie-Modelle', text: 'An Reglern drehen und die Folge sehen: Herz und Kreislauf mit Betablocker, ACE-Hemmer und Diuretikum, Haut und Dekubitus (Druck mal Zeit), Lunge und Lagerung, Blutzucker mit Mahlzeit, Insulin und Bewegung. Mit kleinen Aufträgen zum Ausprobieren.', pfad: '/lernen/physiologie' },
  { datum: '2026-11-16', titel: '5-Minuten-Einheit und Themen-Netz', text: 'Auf jeder Themenseite: „5-Minuten-Einheit“ mit kurz erklärten Fachbegriffen, drei Fragen aus dem passenden Trainer und einer Karte zum Mitnehmen. Darunter das Themen-Netz: Welche Themen über ein Krankheitsbild oder als Voraussetzung zusammenhängen.', pfad: '/lernen/themen' },
  { datum: '2026-11-16', titel: 'Gesprächssimulator', text: 'Aufgebrachte Angehörige, abgelehntes Medikament, Demenz am Abend, Angst vor der OP: mit festen Antworten offline und Rückmeldung zu jeder Antwort (Technik, Wirkung, Begründung) oder frei mit Claude in der Rolle des Gegenübers, auch per Sprache.', pfad: '/lernen/gespraech' },
  { datum: '2026-11-16', titel: 'CE mit Lehrplan-Stunden und Kompetenzen', text: 'Jede curriculare Einheit zeigt jetzt die Unterrichtsstunden je Ausbildungsdrittel und die Kompetenzen aus Anlage 1 und 2 PflAPrV, die der Landeslehrplan Baden-Württemberg ihr zuordnet.', pfad: '/lernen/ce' },
  { datum: '2026-11-16', titel: 'Ablauf-Werkbank', text: 's.c.-Injektion, Medikamente richten, aseptischer Verbandwechsel und Blasenkatheter bei der Frau Schritt für Schritt: selbst durchführen, jeder Fehlgriff zeigt sofort Fehler und Folge. Oder im vorgeführten Ablauf die Fehler finden. Offline, zählt im Lernplan.', pfad: '/lernen/ablauf' },
  { datum: '2026-11-16', titel: 'Dienstplan einlesen und Schonregeln', text: 'Im Lernplan unter Lernzeit: Dienstplan für 2, 4 oder 6 Wochen, als Kalenderdatei (.ics) aus der Dienstplan-App oder als Kürzel („F F S S N N X X“) einlesen. Nach Nachtdiensten, bei Spät auf Früh und ab dem 6. Arbeitstag in Folge plant die App nur kurze Blöcke.', pfad: '/lernen/plan' },
  { datum: '2026-11-16', titel: 'Ausbildungsnachweis vorbereiten', text: 'Im Praxiseinsatz unter „Nachweis“: Tätigkeiten mit gesehen, unter Anleitung oder selbstständig abhaken, Erst-, Zwischen- und Abschlussgespräch aus Lernzielen und offenen Fragen vorbereiten, von der Praxisanleitung auf dem Gerät abzeichnen lassen und als PDF drucken. Ersetzt nicht den offiziellen Nachweis der Schule.', pfad: '/lernen/einsatz' },
  { datum: '2026-11-16', titel: 'Praxiseinsatz und Praxistagebuch', text: 'Einsätze eintragen (z. B. Pädiatrie ab März): Der Lernplan zieht die passenden Themen vor, ein Bereit-Check mit vier Stationen zeigt, was schon sitzt. Auf Station schnell notieren, auch per Sprache, zu Hause im Praxistagebuch Themen zuordnen, Karteikarten daraus machen und Situationen nach Gibbs reflektieren.', pfad: '/lernen/einsatz' },
  { datum: '2026-11-16', titel: 'Kompetenz-Radar auf Fortschritt und Heute', text: 'Stärke je Kompetenzbereich I bis V, heute und vor vier Wochen im Vergleich, mit der größten Lücke und einem Weg zum gezielten Abfragen.', pfad: '/lernen/fortschritt' },
  { datum: '2026-11-15', titel: 'Quellen und Aktualität', text: 'Neue Seite unter System: alle Gesetze, Expertenstandards und Leitlinien mit Stand in der App, neuester Fassung, Datum der letzten Prüfung und Erinnerung „erneut nachsehen“. Fälle mit veralteter Quelle zeigen das am Start. Sepsis-Inhalte folgen jetzt der Surviving Sepsis Campaign 2026.', pfad: '/system/quellen' },
  { datum: '2026-11-13', titel: 'Frage melden und Inhaltsqualität', text: 'Unter jeder Trainer- und Simulationsfrage: „Frage melden“, wenn etwas unklar oder falsch ist. Neue Seite Inhaltsqualität mit Überarbeitungsliste, Lücken je Thema und Prüfstand. Der Reanimationsablauf folgt jetzt den ERC-Leitlinien 2025.', pfad: '/system/qualitaet' },
  { datum: '2026-11-13', titel: 'Themenbaum mit Fortschritt je Bereich', text: 'Fach, Bereich und Thema aufklappbar, je Ebene ein Balken (sicher, unsicher, bearbeitet, offen), Filter „Fällig“ und „Eingeplant“, Vorschlag „Als Nächstes“. Eigene Themen anlegen und umhängen.', pfad: '/lernen/themen' },
  { datum: '2026-11-13', titel: 'Fokus-Modus', text: 'Taste F oder Profilmenü: Menüs verschwinden, dazu ein Lernzeit-Timer (15, 25 oder 45 Minuten) und ein Knopf für Hell/Dunkel. Esc beendet.', pfad: '/lernen/karten' },
  { datum: '2026-11-13', titel: 'Einfügen statt abtippen', text: 'Text aus Webseite, Word oder PDF direkt als Dokument übernehmen (Überschriften bleiben Kapitel), Dateien aufs Upload-Feld ziehen und unter Karteikarten → Eigene Karten viele Karten auf einmal einfügen.', pfad: '/material/dokumente' },
  { datum: '2026-11-13', titel: 'Üben mit Wiederholungsplan', text: 'Fehler kommen in wachsenden Abständen wieder (morgen, 3, 7, 14 Tage …), nach jeder Antwort zeigt die App die passende Stelle im Skript. Neu: „Wie sicher?“ vor dem Prüfen, falsche Aufgaben gleich noch einmal, begonnene Runden fortsetzen, Nachprüfung schwacher Themen.', pfad: '/lernen/fehler' },
  { datum: '2026-11-13', titel: 'Wege zwischen den Seiten', text: '„Passt dazu“ jetzt auch unter Karteikarten, Skript, Expertenstandards, CE, Fortschritt und Dokumenten. Aus einer Übung führt ein Knopf zurück zum Thema, von dem du kamst.', pfad: '/lernen/karten' },
  { datum: '2026-11-13', titel: 'Krankheitsbilder: sechs neue Steckbriefe', text: 'Mit Fallaufgaben zum direkten Anwenden.', pfad: '/lernen/krankheitsbilder' },
  { datum: '2026-11-13', titel: 'Kinder und Säuglinge', text: 'Eigener Bereich im Notfall- und im Labor-Trainer, dazu neue Probefälle und Praxisfälle mit Säuglingen und Jugendlichen.', pfad: '/lernen/wissen?fach=notfall' },
  { datum: '2026-11-13', titel: 'Fallakte', text: 'Ein Fall durchgehend von der SIS bis zur Übergabe, jetzt auch ambulant (Herr Albers mit COPD).', pfad: '/lernen/fallakte' },
  { datum: '2026-11-13', titel: 'Wissenstrainer Grundlagen', text: 'Fachsprache, Kommunikation, Pflegemodelle, Qualität und Versorgung.', pfad: '/lernen/wissen?fach=grundlagen' },
  { datum: '2026-11-13', titel: 'Pflegeplanung mit Musterlösung', text: 'Deine Planung neben einer geprüften Musterlösung vergleichen.', pfad: '/lernen/pflegeplanung' },
  { datum: '2026-11-13', titel: 'Rechentrainer und Fachbegriff-Duell ausgebaut', text: 'Mehr Aufgaben und Begriffe.', pfad: '/lernen/rechnen' },
  { datum: '2026-11-13', titel: 'Examen: Fahrplan über alle CE', text: 'Für Neue mit einem einfachen Start in den Lernplan.', pfad: '/lernen/examen' },
  { datum: '2026-11-13', titel: 'Skript ohne KI', text: 'Eigene Dokumente als Skript lesen und selbst geschriebene Skripte weitergeben.', pfad: '/lernen/skript' },
  { datum: '2026-11-13', titel: 'So lernst du hier', text: 'Ein Wegweiser durch alle Seiten und Begriffe, dazu eine Kurzhilfe auf den Lernseiten.', pfad: '/lernen/wegweiser' },
  { datum: '2026-11-13', titel: 'Testphase', text: 'Einstieg, Testaufträge und Rückmeldung an einem Ort.', pfad: '/system/test' },
];

const KEY = 'lernstoff.testphase.neuGesehen';

/** Datum des neuesten Eintrags, den man schon gesehen hat (leer = noch nie). */
export function zuletztGesehen(): string {
  try { return localStorage.getItem(KEY) ?? ''; } catch { return ''; }
}
export function alsGesehenMerken(liste: Neuigkeit[] = NEUIGKEITEN) {
  try { if (liste[0]) localStorage.setItem(KEY, liste[0].datum); } catch { /* privater Modus */ }
}
/** Einträge, die neuer sind als der letzte Besuch. Beim allerersten Besuch zählt alles als bekannt. */
export function ungesehen(gesehen: string, liste: Neuigkeit[] = NEUIGKEITEN): Neuigkeit[] {
  return gesehen ? liste.filter((n) => n.datum > gesehen) : [];
}
