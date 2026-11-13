// „Was ist neu“ für Testerinnen und Tester: damit sie wissen, was sie sich seit dem letzten Besuch ansehen können.
// Von Hand gepflegt: bei größeren Neuerungen oben einen Eintrag ergänzen (neuestes zuerst, Datum JJJJ-MM-TT).
// Pfad muss eine bestehende Seite sein (Test prüft das).

export interface Neuigkeit { datum: string; titel: string; text: string; pfad: string }

export const NEUIGKEITEN: Neuigkeit[] = [
  { datum: '2026-11-13', titel: 'Frage melden und Inhaltsqualität', text: 'Unter jeder Trainer- und Simulationsfrage: „Frage melden“, wenn etwas unklar oder falsch ist. Neue Seite Inhaltsqualität mit Überarbeitungsliste, Lücken je Thema und Prüfstand. Der Reanimationsablauf folgt jetzt den ERC-Leitlinien 2025.', pfad: '/system/qualitaet' },
  { datum: '2026-11-13', titel: 'Themenbaum mit Fortschritt je Bereich', text: 'Fach, Bereich und Thema aufklappbar, je Ebene ein Balken (sicher, unsicher, bearbeitet, offen), Filter „Fällig“ und „Eingeplant“, Vorschlag „Als Nächstes“. Eigene Themen anlegen und umhängen.', pfad: '/lernen/themen' },
  { datum: '2026-11-13', titel: 'Fokus-Modus', text: 'Taste F oder Profilmenü: Menüs verschwinden, dazu ein Lernzeit-Timer (15, 25 oder 45 Minuten) und ein Knopf für Hell/Dunkel. Esc beendet.', pfad: '/lernen/karten' },
  { datum: '2026-11-13', titel: 'Einfügen statt abtippen', text: 'Text aus Webseite, Word oder PDF direkt als Dokument übernehmen (Überschriften bleiben Kapitel), Dateien aufs Upload-Feld ziehen und unter Karteikarten → Eigene Karten viele Karten auf einmal einfügen.', pfad: '/material/dokumente' },
  { datum: '2026-11-13', titel: 'Üben mit Wiederholungsplan', text: 'Fehler kommen in wachsenden Abständen wieder (morgen, 3, 7, 14 Tage …), nach jeder Antwort zeigt die App die passende Stelle im Skript. Neu: „Wie sicher?“ vor dem Prüfen, falsche Aufgaben gleich noch einmal, begonnene Runden fortsetzen, Nachprüfung schwacher Themen.', pfad: '/lernen/fehler' },
  { datum: '2026-11-13', titel: 'Wege zwischen den Seiten', text: '„Passt dazu“ jetzt auch unter Karteikarten, Skript, Expertenstandards, CE, Fortschritt und Dokumenten. Aus einer Übung führt ein Knopf zurück zum Thema, von dem du kamst.', pfad: '/lernen/karten' },
  { datum: '2026-11-13', titel: 'Krankheitsbilder: sechs neue Steckbriefe', text: 'Mit Fallaufgaben zum direkten Anwenden.', pfad: '/lernen/krankheitsbilder' },
  { datum: '2026-11-13', titel: 'Kinder und Säuglinge', text: 'Eigener Bereich im Notfall- und im Labor-Trainer, dazu neue Probefälle und Praxisfälle mit Säuglingen und Jugendlichen.', pfad: '/lernen/notfall' },
  { datum: '2026-11-13', titel: 'Fallakte', text: 'Ein Fall durchgehend von der SIS bis zur Übergabe, jetzt auch ambulant (Herr Albers mit COPD).', pfad: '/lernen/fallakte' },
  { datum: '2026-11-13', titel: 'Grundlagen-Trainer', text: 'Fachsprache, Kommunikation, Pflegemodelle, Qualität und Versorgung.', pfad: '/lernen/grundlagen' },
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
