// Karteikarten: Typen. Fachneutral, Inhalte kommen aus dem Fachmodul (Glossar, Katalog)
// oder aus eigenem Material (Zusammenfassungen, Prüfungsfragen, selbst geschriebene Karten).

import type { ID } from '../../core/types';
import type { Rating } from '../lernplan/types';

export type KartenQuelle = 'glossar' | 'katalog' | 'zusammenfassung' | 'pruefungsfragen' | 'eigen';

export const QUELLE_LABEL: Record<KartenQuelle, string> = {
  glossar: 'Glossar',
  katalog: 'Themenkatalog',
  zusammenfassung: 'Zusammenfassung',
  pruefungsfragen: 'Prüfungsfrage',
  eigen: 'Eigene Karte',
};

/** Fundstelle im eigenen Material, damit die Rückseite nachprüfbar bleibt. */
export interface KartenBeleg { documentId: ID; page: number; printedPage?: string; quote: string }

export interface Karte {
  /**
   * Stabile ID, damit der Lernstand beim Neuaufbau aus dem Katalog erhalten bleibt:
   * gl:<glossarId>, glr:<glossarId> (rückwärts), gla:<glossarId> (Abkürzung),
   * kat:<referenz-, format- oder operatorId>, sum:<summaryId>:<blockId>[:teil], def:<summaryId>:<claimId>,
   * pf:<fragensatzId>:<frageId>, eigen:<uuid>.
   */
  id: ID;
  quelle: KartenQuelle;
  /** Kurzer Hinweis über der Frage, z. B. „Begriff → Definition“. */
  art: string;
  vorne: string;
  hinten: string;
  /** Rückseite als Aufzählung anzeigen (Zusammenfassungen, Aufgabenformate). */
  liste?: string[];
  /** Antwort eintippen statt nur aufdecken (z. B. Definition → Begriff). */
  eingabe?: boolean;
  /** Weitere richtige Antworten beim Eintippen (Abkürzung, Synonyme). */
  alternativen?: string[];
  topicIds: ID[];
  subjectIds: ID[];
  belege?: KartenBeleg[];
  /** Woraus die Karte entstanden ist (Summary-ID, Glossar-ID …). */
  ref?: ID;
  erstellt?: string;
  geaendert?: string;
}

/** Lernstand einer Karte nach FSRS. Fehlt er, ist die Karte neu. */
export interface KartenStand {
  cardId: ID;
  stability: number;
  difficulty: number;
  lastReview: string;   // YYYY-MM-DD
  due: string;          // YYYY-MM-DD
  reps: number;
  lapses: number;       // wie oft „Vergessen“ nach mindestens einer erfolgreichen Abfrage
  erstmals: string;     // Tag der ersten Abfrage (für das Tageslimit neuer Karten)
  ausgesetzt?: boolean; // vom Nutzer pausiert, kommt nicht in Sitzungen
}

export interface KartenLog {
  id?: number;
  cardId: ID;
  date: string;
  at: string;
  rating: Rating;
  topicIds: ID[];
}

export type Richtung = 'vorwaerts' | 'rueckwaerts' | 'abkuerzung';

export interface KartenConfig {
  id: 'standard';
  /** Fächer, deren Glossar- und Katalogkarten aktiv sind. Leer = alle. */
  faecher: ID[];
  richtungen: Richtung[];
  katalog: boolean;
  neueProTag: number;
  /** Höchstzahl Karten pro Sitzung (fällige zuerst). */
  sitzungsGroesse: number;
  /** Ziel-Abrufwahrscheinlichkeit für FSRS. */
  retention: number;
}

export const STANDARD_CONFIG: KartenConfig = {
  id: 'standard',
  faecher: [],
  richtungen: ['vorwaerts', 'abkuerzung'],
  katalog: true,
  neueProTag: 15,
  sitzungsGroesse: 40,
  retention: 0.9,
};
