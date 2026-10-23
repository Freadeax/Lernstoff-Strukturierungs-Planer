// Priorisierung: Dringlichkeit, Wissenslücke, Schwierigkeit, Umfang und Prüfungsrelevanz.
// Jede Gewichtung wird als Begründung ausgegeben, damit der Plan nachvollziehbar bleibt.

import { daysBetween, type ISODate } from './dates';
import type { TopicProgress } from './progress';
import {
  topicDifficulty,
  topicMinutes,
  type Exam,
  type PlannerSettings,
  type Relevance,
  type Topic,
} from './types';

export const PRIORITY_WEIGHTS = {
  urgency: 0.35,
  gap: 0.3,
  difficulty: 0.15,
  size: 0.05,
  relevance: 0.15,
} as const;

const RELEVANCE_VALUE: Record<Relevance, number> = { hoch: 1, mittel: 0.6, niedrig: 0.3 };

export interface Priority {
  topicId: string;
  examId: string;
  /** 0 … examWeight; höher = wichtiger. */
  score: number;
  urgent: boolean;
  reasons: string[];
}

/** Wie groß ist die Lücke zwischen aktuellem und sicherem Wissensstand? 0 … 1 */
export function knowledgeGap(progress: TopicProgress): number {
  switch (progress.status) {
    case 'offen':
      return 1;
    case 'bearbeitet':
      return 0.8;
    case 'unsicher':
      return 0.5 + 0.5 * (1 - (progress.retrievabilityToday ?? 0));
    case 'sicher':
      return 0.1;
  }
}

export function topicPriority(
  topic: Topic,
  progress: TopicProgress,
  exam: Exam,
  today: ISODate,
  settings: PlannerSettings,
  relevance: Relevance = 'mittel',
  examWeight = 1,
): Priority {
  const daysLeft = Math.max(0, daysBetween(today, exam.date));
  const urgency = 1 / (1 + daysLeft / 7);
  const gap = knowledgeGap(progress);
  const difficulty = (topicDifficulty(topic, settings) - 1) / 4;
  const size = Math.min(1, topicMinutes(topic, settings) / 300);
  const rel = RELEVANCE_VALUE[relevance];

  const score =
    examWeight *
    (PRIORITY_WEIGHTS.urgency * urgency +
      PRIORITY_WEIGHTS.gap * gap +
      PRIORITY_WEIGHTS.difficulty * difficulty +
      PRIORITY_WEIGHTS.size * size +
      PRIORITY_WEIGHTS.relevance * rel);

  const reasons: string[] = [`Prüfung „${exam.name}“ in ${daysLeft} Tagen.`];
  if (progress.status === 'offen') reasons.push('Thema noch nicht begonnen.');
  if (progress.status === 'bearbeitet') reasons.push('Bearbeitet, aber noch nicht abgefragt.');
  if (progress.status === 'unsicher') reasons.push('Bei Abfragen noch unsicher.');
  if (difficulty >= 0.75) reasons.push('Schwieriges Thema.');
  if (relevance === 'hoch') reasons.push('Laut Materialien besonders prüfungsrelevant.');

  const urgent = daysLeft <= 7 && progress.status !== 'sicher';
  return { topicId: topic.id, examId: exam.id, score, urgent, reasons };
}
