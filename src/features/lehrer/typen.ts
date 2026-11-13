// Lehrermodus: Klassen führen, Klassenfälle zuordnen, Abgaben sammeln, bewerten und Rückmeldungen
// zurückgeben. Wie der Klassenmodus ohne Server und ohne Konten: Alles liegt nur in diesem Browser
// (localStorage „lernstoff.lehrer.*“) und kommt in die Datensicherung dieses Geräts.

export interface Klasse {
  id: string;
  name: string;
  /** Namen oder Kürzel, wie sie in den Abgaben stehen sollen. Optional. */
  lernende: string[];
  /** Klassenfälle (ids aus „Verteilte Fälle“), die diese Klasse bearbeitet. */
  faelle: string[];
  erstellt: string; // ISO
}

/** Bewertung einer Abgabe durch die Lehrkraft. Schlüssel: Fall + Name (ohne Groß/Klein). */
export interface Bewertung {
  fallId: string;
  name: string;
  /** aufgabeId → vergebene Punkte. */
  punkte: Record<string, number>;
  /** aufgabeId → Kommentar. */
  kommentare: Record<string, string>;
  kommentar: string;
  /** Zeitpunkt der bewerteten Abgabe. Kommt später eine neuere, ist die Bewertung veraltet. */
  abgabeVom: string;
  bewertet: string; // ISO
  /** Zuletzt als Rückmeldelink geteilt oder kopiert. */
  gesendet?: string;
}

/** Notenschlüssel: Stufen absteigend, jeweils „ab x Prozent“. */
export interface Notenstufe { note: string; ab: number }

export type Status = 'offen' | 'ueberfaellig' | 'abgegeben' | 'verspaetet' | 'bewertet' | 'neu';

export const STATUS_LABEL: Record<Status, string> = {
  offen: 'offen',
  ueberfaellig: 'fehlt (Frist vorbei)',
  abgegeben: 'abgegeben',
  verspaetet: 'abgegeben (nach Frist)',
  bewertet: 'bewertet',
  neu: 'neue Abgabe seit Bewertung',
};

/** Gleicher Mensch trotz anderer Schreibweise: Groß/Klein, doppelte Leerzeichen, Punkt am Ende. */
export const nameSchluessel = (name: string) => name.normalize('NFC').trim().toLowerCase().replace(/\s+/g, ' ').replace(/\.$/, '');
