// Fortschrittsstatus je Thema: offen / bearbeitet / unsicher / sicher.
// Grundsatz: Nur echte Abfrageergebnisse heben ein Thema über „bearbeitet“ hinaus.
// Karteikarten: Hat ein Thema mindestens CARD_RULES.minCards abgefragte Karten, erbt es deren Zustand.
// Ein Thema ist nur sicher, wenn die Karten im Schnitt gut abrufbar sind und kaum eine wackelt; sonst wird
// es „unsicher“ und heute wieder abgefragt. Karten werten nie auf (die Sitzung meldet ihr Ergebnis ohnehin
// als normale Abfrage über logReview).

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
  type CardEvidence,
} from './types';

/** Schwellen für die Karteikarten eines Themas. */
export const CARD_RULES = {
  /** Erst ab so vielen abgefragten Karten zählt der Kartenstand mit. */
  minCards: 3,
  /** Karte gilt als wackelig unter dieser Abrufwahrscheinlichkeit. */
  weakRetrievability: 0.7,
  /** Höchstens dieser Anteil wackeliger Karten für „sicher“. */
  maxWeakShare: 0.2,
} as const;

export interface CardSummary {
  total: number;
  weak: number;
  /** Mittlere Abrufwahrscheinlichkeit heute. */
  meanRetrievability: number;
}

/** Kartenstand eines Themas heute; undefined bei zu wenigen abgefragten Karten. */
export function summarizeCards(cards: CardEvidence[] | undefined, today: ISODate): CardSummary | undefined {
  const seen = (cards ?? []).filter((c) => c.lastReview && c.lastReview <= today && c.stability > 0);
  if (seen.length < CARD_RULES.minCards) return undefined;
  const rs = seen.map((c) => retrievability(daysBetween(c.lastReview, today), c.stability));
  return {
    total: seen.length,
    weak: rs.filter((r) => r < CARD_RULES.weakRetrievability).length,
    meanRetrievability: rs.reduce((a, b) => a + b, 0) / rs.length,
  };
}

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
  /** Zustand der Karteikarten dieses Themas, falls genug abgefragt. */
  cards?: CardSummary;
}

export function computeProgress(
  topic: Topic,
  studyLogs: StudyLog[],
  reviewLogs: ReviewLog[],
  today: ISODate,
  settings: PlannerSettings,
  cardEvidence?: CardEvidence[],
): TopicProgress {
  const p = progressFromLogs(topic, studyLogs, reviewLogs, today, settings);
  const cards = summarizeCards(cardEvidence, today);
  if (!cards || p.testCount === 0) return cards ? { ...p, cards } : p;
  const reasons = [...p.reasons];
  const tooWeak = cards.weak / cards.total > CARD_RULES.maxWeakShare;
  const tooLow = cards.meanRetrievability < MASTERY_RULES.minRetrievability;
  if (tooWeak) reasons.push(`${cards.weak} von ${cards.total} Karteikarten zu diesem Thema wackeln.`);
  if (tooLow) reasons.push(`Karteikarten im Schnitt nur zu ca. ${Math.round(cards.meanRetrievability * 100)} % abrufbar.`);
  if (!tooWeak && !tooLow) return { ...p, cards };
  if (p.status === 'sicher') {
    return { ...p, cards, status: 'unsicher', nextReview: today, reasons: reasons.filter((r) => !r.startsWith('Mehrfach erfolgreich')) };
  }
  return { ...p, cards, reasons };
}

function progressFromLogs(
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
  cardEvidence?: Record<string, CardEvidence[]>,
): Map<string, TopicProgress> {
  return new Map(topics.map((t) => [t.id, computeProgress(t, studyLogs, reviewLogs, today, settings, cardEvidence?.[t.id])]));
}
