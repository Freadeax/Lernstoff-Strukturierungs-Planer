// Planer-eigene Typen. Kernentitäten (Topic, Exam, MasteryStatus) kommen aus dem
// gemeinsamen Datenvertrag und werden hier nur re-exportiert.

import type { Exam, ID, MasteryStatus, Topic } from '../../core/types';
import type { ISODate } from './dates';

export type { Exam, ID, MasteryStatus, Topic, ISODate };

/** FSRS-Bewertung: 1 = vergessen, 2 = schwer, 3 = gut, 4 = leicht. */
export type Rating = 1 | 2 | 3 | 4;

/**
 * Herkunft eines Abfrageergebnisses. 'selbsteinschaetzung' („ich glaube, ich kann das“)
 * zählt bewusst NICHT als Wissensnachweis: Gelesen heißt nicht verstanden.
 */
export type EvidenceSource =
  | 'quiz'
  | 'karteikarten'
  | 'offene_frage'
  | 'pruefungssimulation'
  | 'trainer'
  | 'selbsteinschaetzung';

/** Stand eines Lernversuchs. Nur abgeschlossene Versuche zählen als Nachweis. */
export type VersuchStatus = 'abgeschlossen' | 'offen' | 'abgebrochen';

/**
 * Aussagekraft eines Ergebnisses:
 * - abruf: aus dem Gedächtnis beantwortet (Karten, Quiz, Prüfungsfragen)
 * - anwendung: in einem Fall oder Trainer bewertet angewendet
 * - uebung: mit Hilfen, im Lernmodus oder als Wiederholung am selben Tag; wird protokolliert, zählt nicht
 */
export type Aussagekraft = 'abruf' | 'anwendung' | 'uebung';

/** Woher ein Ergebnis stammt: Modul (Trainer, Karten, Simulation …), Fall/Karte/Fragensatz und bewertete Kriterien. */
export interface Herkunft {
  modul: string;
  ref?: string;
  kriterien?: Array<{ id: string; label?: string; erfuellt: boolean }>;
}

/** Ergebnis einer Abfrage zu einem Thema. Entweder `rating` oder `scorePercent` angeben. */
export interface ReviewLog {
  topicId: ID;
  date: ISODate;
  source: EvidenceSource;
  rating?: Rating;
  /** 0–100, z. B. Anteil richtiger Antworten im Quiz. */
  scorePercent?: number;
  /** Einheitliches Ergebnisformat (siehe ergebnis.ts). Fehlt bei älteren Einträgen: dann abgeschlossen. */
  versuchId?: string;
  herkunft?: Herkunft;
  status?: VersuchStatus;
  aussagekraft?: Aussagekraft;
}

/** Erarbeitungszeit, die tatsächlich in ein Thema geflossen ist (Lesen, Zusammenfassen, Üben). */
export interface StudyLog {
  topicId: ID;
  date: ISODate;
  minutes: number;
}

/** Verfügbare Netto-Lernzeit. Ausnahmen (Krankheit, Schicht, Urlaub) überschreiben den Wochentag. */
export interface Availability {
  /** Index 0 = Sonntag … 6 = Samstag, jeweils Minuten. */
  minutesByWeekday: [number, number, number, number, number, number, number];
  exceptions?: Record<ISODate, number>;
}

export type Relevance = 'hoch' | 'mittel' | 'niedrig';

export interface PlannerSettings {
  /** Maximale Länge eines Lernblocks in Minuten. */
  blockMinutes: number;
  /** Pause nach jedem Block (wird nicht von der Lernzeit abgezogen, nur ausgewiesen). */
  breakMinutes: number;
  /** Dauer einer Wiederholung/Abfrage pro Thema. */
  reviewMinutes: number;
  /** Ziel-Abrufwahrscheinlichkeit für FSRS (0.9 = 90 %). */
  desiredRetention: number;
  /** Anteil der Tageszeit, der als Puffer frei bleibt (0.1 = 10 %). */
  bufferRatio: number;
  /** Höchstens so viele Erarbeitungsblöcke pro Thema und Tag (verteiltes Lernen). */
  maxBlocksPerTopicPerDay: number;
  /** Höchstanteil der Tageszeit für Wiederholungen (außer am Tag vor einer Prüfung). */
  maxReviewShare: number;
  /** Kürzester sinnvoller Block, wenn ein Restzeitfenster gefüllt wird. */
  minBlockMinutes: number;
  /** Standardwerte, falls ein Thema keine Schätzung hat. */
  defaultEstimatedMinutes: number;
  defaultDifficulty: 1 | 2 | 3 | 4 | 5;
}

export const DEFAULT_SETTINGS: PlannerSettings = {
  blockMinutes: 45,
  breakMinutes: 10,
  reviewMinutes: 15,
  desiredRetention: 0.9,
  bufferRatio: 0.1,
  maxBlocksPerTopicPerDay: 2,
  maxReviewShare: 0.5,
  minBlockMinutes: 15,
  defaultEstimatedMinutes: 90,
  defaultDifficulty: 3,
};

/**
 * Lernstand einer einzelnen Karteikarte zu einem Thema (FSRS je Karte, siehe karteikarten/planung.ts).
 * Das Thema erbt daraus den Zustand: Karten können ein Thema nur abwerten, nie aufwerten.
 */
export interface CardEvidence {
  stability: number;
  lastReview: ISODate;
}

export interface PlannerInput {
  today: ISODate;
  topics: Topic[];
  exams: Exam[];
  studyLogs: StudyLog[];
  reviewLogs: ReviewLog[];
  availability: Availability;
  /** Prüfungsrelevanz je Thema, sofern aus Materialien/Lernzielen ableitbar. Standard: 'mittel'. */
  relevance?: Record<ID, Relevance>;
  /** Gewichtung je Prüfung (z. B. Abschlussprüfung 2, Klausur 1). Standard: 1. */
  examWeights?: Record<ID, number>;
  settings?: Partial<PlannerSettings>;
  /** Abgefragte Karteikarten je Thema (ohne pausierte). */
  cardEvidence?: Record<ID, CardEvidence[]>;
}

export function resolveSettings(input: Pick<PlannerInput, 'settings'>): PlannerSettings {
  return { ...DEFAULT_SETTINGS, ...input.settings };
}

export function topicDifficulty(topic: Topic, settings: PlannerSettings): 1 | 2 | 3 | 4 | 5 {
  return topic.difficulty ?? settings.defaultDifficulty;
}

export function topicMinutes(topic: Topic, settings: PlannerSettings): number {
  return topic.estimatedMinutes ?? settings.defaultEstimatedMinutes;
}
