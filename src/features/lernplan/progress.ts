// Fortschrittsstatus je Thema: offen / bearbeitet / unsicher / sicher.
// Grundsatz: Nur echte Abfrageergebnisse heben ein Thema über „bearbeitet“ hinaus.

import { addDays, daysBetween, type ISODate } from './dates';
import { evidenceRating, nextIntervalDays, replay, retrievability, type MemoryState } from './fsrs';
import {
  topicMinutes,
  type MasteryStatus,
  type PlannerSettings,
  type Rating,
  type ReviewLog,
  type StudyLog,
  type Topic,
} from './types';

/** Schwellen für „sicher beherrscht“. */
export const MASTERY_RULES = {
  /** Mindestens so viele erfolgreiche Abfragen (Bewertung ≥ gut) an verschiedenen Tagen. */
  minSuccessfulDays: 2,
  /** Gedächtnisstabilität in Tagen. */
  minStability: 7,
  /** Aktuelle Abrufwahrscheinlichkeit. */
  minRetrievability: 0.85,
} as const;

export interface TopicProgress {
  topicId: string;
  status: MasteryStatus;
  studiedMinutes: number;
  remainingStudyMinutes: number;
  /** Anzahl echter Abfragen (ohne Selbsteinschätzung). */
  testCount: number;
  lastRating?: Rating;
  memory?: MemoryState;
  /** Geschätzte Abrufwahrscheinlichkeit heute (nur mit Testdaten). */
  retrievabilityToday?: number;
  /** Nächste fällige Abfrage laut FSRS bzw. sofort, wenn noch nie abgefragt. */
  nextReview?: ISODate;
  /** Begründungen für den Status, für die Anzeige. */
  reasons: string[];
}

export function computeProgress(
  topic: Topic,
  studyLogs: StudyLog[],
  reviewLogs: ReviewLog[],
  today: ISODate,
  settings: PlannerSettings,
): TopicProgress {
  const studiedMinutes = studyLogs
    .filter((l) => l.topicId === topic.id && l.date <= today)
    .reduce((sum, l) => sum + l.minutes, 0);
  const remainingStudyMinutes = Math.max(0, topicMinutes(topic, settings) - studiedMinutes);
  const ownLogs = reviewLogs.filter((l) => l.topicId === topic.id && l.date <= today);
  const tests = ownLogs
    .map((log) => ({ log, rating: evidenceRating(log) }))
    .filter((t): t is { log: ReviewLog; rating: Rating } => t.rating !== undefined)
    .sort((a, b) => a.log.date.localeCompare(b.log.date));
  const base = { topicId: topic.id, studiedMinutes, remainingStudyMinutes, testCount: tests.length };

  if (tests.length === 0) {
    if (studiedMinutes === 0) {
      return { ...base, status: 'offen', reasons: ['Noch nicht bearbeitet.'] };
    }
    const reasons = ['Noch nicht abgefragt: gelesener Stoff gilt nicht automatisch als verstanden.'];
    if (ownLogs.length > 0) reasons.push('Selbsteinschätzungen zählen nicht als Wissensnachweis.');
    return {
      ...base,
      status: 'bearbeitet',
      nextReview: remainingStudyMinutes === 0 ? today : undefined,
      reasons,
    };
  }

  const memory = replay(tests.map((t) => t.log)) as MemoryState;
  const r = retrievability(daysBetween(memory.lastReview, today), memory.stability);
  const lastRating = tests[tests.length - 1]!.rating;
  const successfulDays = new Set(tests.filter((t) => t.rating >= 3).map((t) => t.log.date)).size;
  const nextReview = addDays(memory.lastReview, nextIntervalDays(memory.stability, settings.desiredRetention));

  const reasons: string[] = [];
  if (lastRating < 3) reasons.push('Letzte Abfrage nicht bestanden oder nur mit Mühe gelöst.');
  if (successfulDays < MASTERY_RULES.minSuccessfulDays)
    reasons.push(
      `Erst ${successfulDays} von ${MASTERY_RULES.minSuccessfulDays} erfolgreichen Abfragen an verschiedenen Tagen.`,
    );
  if (memory.stability < MASTERY_RULES.minStability)
    reasons.push(`Wissen noch nicht gefestigt (Stabilität ${memory.stability.toFixed(1)} Tage).`);
  if (r < MASTERY_RULES.minRetrievability)
    reasons.push(`Wahrscheinlich teilweise vergessen (Abruf heute ca. ${Math.round(r * 100)} %).`);

  const status: MasteryStatus = reasons.length === 0 ? 'sicher' : 'unsicher';
  if (status === 'sicher') reasons.push('Mehrfach erfolgreich abgefragt und aktuell gut abrufbar.');
  return { ...base, status, lastRating, memory, retrievabilityToday: r, nextReview, reasons };
}

export function computeAllProgress(
  topics: Topic[],
  studyLogs: StudyLog[],
  reviewLogs: ReviewLog[],
  today: ISODate,
  settings: PlannerSettings,
): Map<string, TopicProgress> {
  return new Map(topics.map((t) => [t.id, computeProgress(t, studyLogs, reviewLogs, today, settings)]));
}
