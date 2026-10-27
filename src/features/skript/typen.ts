// Skript: belegte Lernzusammenfassungen (Markdown) offline lesen.
// Die Texte stammen aus eigenem Unterrichtsmaterial und liegen deshalb NIE im öffentlichen App-Repo.
// Sie kommen aus dem privaten Material-Repo (Ordner skripte/) oder als Datei auf das Gerät.

import type { ID } from '../../core/types';

/** Ein Quellenkürzel aus dem Kopf der Zusammenfassung, z. B. [D] → „Komplett CE 09 … .pdf (118 S.)“. */
export interface SkriptQuelle { kuerzel: string; text: string }

/** Ein Beleg im Text, z. B. [D, S. 18–20] → { kuerzel: 'D', stelle: 'S. 18–20' }. */
export interface SkriptBeleg { kuerzel: string; stelle?: string }

/** Abschnitt = eine ##-Überschrift samt Inhalt (###-Unterabschnitte bleiben darin). */
export interface Abschnitt {
  id: string;          // a1, a2 … in Reihenfolge, stabil solange die Gliederung gleich bleibt
  titel: string;       // ohne Nummer-Präfix und ohne Beleg
  nummer?: string;     // „1“, „2.3“ aus „## 1 · …“
  markdown: string;    // Inhalt ohne Überschriftzeile
  belege: SkriptBeleg[];
  /** Belege direkt in der ##-Überschrift; gelten für alle Punkte ohne eigenen Beleg. */
  kopfBelege?: SkriptBeleg[];
  /** Enthält Stellen, die nicht durch Material belegt sind (⚠). */
  luecken: number;
  woerter: number;
}

export interface Skript {
  id: ID;              // aus dem Dateinamen, z. B. 'ce09-demenz'
  datei: string;       // Originaldateiname
  /** Gruppe für die Gliederung, z. B. 'CE 09' oder 'LEB 5'. */
  gruppe: string;
  titel: string;       // ohne Gruppen-Präfix
  einleitung: string;  // Markdown zwischen Titel und erstem Abschnitt (ohne Quellenliste)
  quellen: SkriptQuelle[];
  abschnitte: Abschnitt[];
  /** Zugeordnete Katalogthemen. Aus dem Kopf der Datei (themen: …) oder vom Nutzer gesetzt. */
  topicIds: ID[];
  /** true, wenn der Nutzer die Themen von Hand geändert hat (dann überschreibt ein Neuimport sie nicht). */
  themenManuell?: boolean;
  hash: string;
  herkunft: 'repo' | 'datei';
  importiert: string;
  geaendert: string;
}

/** Lesefortschritt je Skript (localStorage, wandert mit der Datensicherung). */
export interface Lesestand {
  gelesen: string[];       // Abschnitt-IDs
  zuletzt?: string;        // zuletzt geöffneter Abschnitt
  geaendert: string;
}
