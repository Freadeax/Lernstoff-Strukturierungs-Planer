// Stoffverteilung und Zeitplanung.
// Der Plan wird immer vollständig aus dem aktuellen Stand neu berechnet (Lernzeit-Logs,
// Abfrageergebnisse, Verfügbarkeit). Dadurch sind Neuplanungen bei Krankheit, Zeitmangel,
// verpassten Blöcken oder neuen Prüfungen nur ein erneuter Aufruf mit geänderten Eingaben.

import { addDays, daysBetween, eachDay, weekday, type ISODate } from './dates';
import { initState, nextIntervalDays, updateState, type MemoryState } from './fsrs';
import { topicPriority, type Priority } from './priority';
import { computeAllProgress, type TopicProgress } from './progress';
import {
  resolveSettings,
  type Availability,
  type Exam,
  type ID,
  type PlannerInput,
  type PlannerSettings,
  type Topic,
} from './types';

export type BlockKind = 'erarbeiten' | 'wiederholen' | 'pruefungsvorbereitung';

export interface PlanBlock {
  kind: BlockKind;
  topicId: ID;
  examId: ID;
  minutes: number;
  label: string;
  /** Nur bei 'erarbeiten': Teil x von y der verbleibenden Erarbeitung. */
  part?: number;
  parts?: number;
}

export interface DayPlan {
  date: ISODate;
  capacityMinutes: number;
  plannedMinutes: number;
  /** Empfohlene Pausen zwischen den Blöcken (zusätzlich zur Lernzeit). */
  pauseMinutes: number;
  blocks: PlanBlock[];
}

export type WarningKind = 'zeitmangel' | 'zyklus' | 'fehlende_voraussetzung' | 'unbekanntes_thema';

export interface PlanWarning {
  kind: WarningKind;
  message: string;
  examId?: ID;
  topicId?: ID;
  minutes?: number;
}

export interface UnscheduledWork {
  topicId: ID;
  examId: ID;
  minutes: number;
}

export interface StudyPlan {
  today: ISODate;
  days: DayPlan[];
  warnings: PlanWarning[];
  unscheduled: UnscheduledWork[];
  progress: Record<ID, TopicProgress>;
  priorities: Record<ID, Priority>;
}

export function availableMinutes(availability: Availability, date: ISODate): number {
  const exception = availability.exceptions?.[date];
  if (exception !== undefined) return Math.max(0, exception);
  return Math.max(0, availability.minutesByWeekday[weekday(date)] ?? 0);
}

/** Planbare Netto-Lernzeit nach Abzug des Puffers. */
export function dayCapacity(availability: Availability, date: ISODate, settings: PlannerSettings): number {
  return Math.floor(availableMinutes(availability, date) * (1 - settings.bufferRatio));
}

/** Verbleibende Erarbeitung in möglichst gleich große Blöcke ≤ blockMinutes teilen. */
export function splitIntoUnits(minutes: number, blockMinutes: number): number[] {
  if (minutes <= 0) return [];
  const count = Math.ceil(minutes / blockMinutes);
  const base = Math.floor(minutes / count);
  const units = Array.from({ length: count }, () => base);
  for (let i = 0; i < minutes - base * count; i++) units[i]! += 1;
  return units;
}

interface TopicState {
  topic: Topic;
  /** Alle noch anstehenden Prüfungstermine des Themas, aufsteigend. */
  exams: Exam[];
  units: number[];
  totalParts: number;
  doneParts: number;
  prerequisites: ID[];
  priority: Priority;
  reviewDue?: ISODate;
  memory?: MemoryState;
  everTested: boolean;
}

function nextExam(state: TopicState, day: ISODate): Exam | undefined {
  return state.exams.find((e) => e.date > day);
}

/** Wiederholung spätestens am Tag vor der nächsten Prüfung; nach der letzten Prüfung keine mehr. */
function capDue(state: TopicState, due: ISODate, from: ISODate): ISODate | undefined {
  for (const exam of state.exams) {
    if (exam.date <= from) continue;
    const lastDay = addDays(exam.date, -1);
    if (due <= lastDay) return due;
    if (from < lastDay) return lastDay;
    // `from` ist der Vortag dieser Prüfung: die nächste Prüfung entscheidet.
  }
  return undefined;
}

/** Topologische Ordnung; Themen in Zyklen verlieren ihre zyklischen Voraussetzungen. */
function resolvePrerequisites(states: Map<ID, TopicState>, warnings: PlanWarning[]): void {
  const indegree = new Map<ID, number>();
  for (const [id, s] of states) {
    s.prerequisites = s.prerequisites.filter((p) => states.has(p));
    indegree.set(id, s.prerequisites.length);
  }
  const queue = [...indegree].filter(([, d]) => d === 0).map(([id]) => id);
  const seen = new Set<ID>();
  while (queue.length) {
    const id = queue.shift()!;
    seen.add(id);
    for (const [other, s] of states) {
      if (s.prerequisites.includes(id)) {
        const d = indegree.get(other)! - 1;
        indegree.set(other, d);
        if (d === 0) queue.push(other);
      }
    }
  }
  for (const [id, s] of states) {
    if (seen.has(id)) continue;
    const cyclic = s.prerequisites.filter((p) => !seen.has(p));
    s.prerequisites = s.prerequisites.filter((p) => seen.has(p));
    warnings.push({
      kind: 'zyklus',
      topicId: id,
      message: `„${s.topic.name}“ hat zirkuläre Voraussetzungen (${cyclic.join(', ')}); diese werden ignoriert.`,
    });
  }
}

export function buildPlan(input: PlannerInput): StudyPlan {
  const settings = resolveSettings(input);
  const { today } = input;
  const warnings: PlanWarning[] = [];
  const topicsById = new Map(input.topics.map((t) => [t.id, t]));
  const progress = computeAllProgress(input.topics, input.studyLogs, input.reviewLogs, today, settings);

  const upcoming = input.exams.filter((e) => e.date > today).sort((a, b) => (a.date < b.date ? -1 : 1));
  const examsByTopic = new Map<ID, Exam[]>();
  for (const exam of upcoming) {
    for (const topicId of exam.topicIds) {
      if (!topicsById.has(topicId)) {
        warnings.push({
          kind: 'unbekanntes_thema',
          examId: exam.id,
          topicId,
          message: `Prüfung „${exam.name}“ verweist auf ein unbekanntes Thema (${topicId}).`,
        });
        continue;
      }
      const list = examsByTopic.get(topicId) ?? [];
      if (!list.includes(exam)) list.push(exam);
      examsByTopic.set(topicId, list);
    }
  }

  const states = new Map<ID, TopicState>();
  const priorities: Record<ID, Priority> = {};
  for (const [topicId, exams] of examsByTopic) {
    const topic = topicsById.get(topicId)!;
    const p = progress.get(topicId)!;
    const first = exams[0]!;
    const priority = topicPriority(
      topic,
      p,
      first,
      today,
      settings,
      input.relevance?.[topicId],
      input.examWeights?.[first.id] ?? 1,
    );
    priorities[topicId] = priority;
    const units = splitIntoUnits(p.remainingStudyMinutes, settings.blockMinutes);
    const state: TopicState = {
      topic,
      exams,
      units,
      totalParts: units.length,
      doneParts: 0,
      prerequisites: [...topic.prerequisites],
      priority,
      memory: p.memory,
      everTested: p.testCount > 0,
    };
    if (p.nextReview) state.reviewDue = capDue(state, p.nextReview < today ? today : p.nextReview, today);
    states.set(topicId, state);

    for (const pre of topic.prerequisites) {
      const preProgress = progress.get(pre);
      if (!examsByTopic.has(pre) && preProgress && preProgress.status === 'offen') {
        warnings.push({
          kind: 'fehlende_voraussetzung',
          topicId,
          message: `Voraussetzung „${topicsById.get(pre)!.name}“ für „${topic.name}“ ist noch offen und keiner Prüfung zugeordnet.`,
        });
      }
    }
  }
  resolvePrerequisites(states, warnings);

  const lastExam = upcoming[upcoming.length - 1];
  const planDays = lastExam ? eachDay(today, lastExam.date) : [];
  const capacities = new Map(planDays.map((d) => [d, dayCapacity(input.availability, d, settings)]));

  const remainingMinutes = (s: TopicState) => s.units.reduce((a, b) => a + b, 0);

  /** Verhältnis benötigter zu verfügbarer Zeit bis zu einem Termin (> 1 = zu knapp). */
  const pressure = (deadline: ISODate, from: ISODate, usedToday: number): number => {
    let needed = 0;
    for (const s of states.values()) if (s.exams[0]!.date <= deadline) needed += remainingMinutes(s);
    let avail = -usedToday;
    for (const d of planDays) if (d >= from && d < deadline) avail += capacities.get(d)!;
    return avail <= 0 ? (needed > 0 ? Infinity : 0) : needed / avail;
  };

  const days: DayPlan[] = [];
  for (const day of planDays) {
    const capacity = capacities.get(day)!;
    const blocks: PlanBlock[] = [];
    let used = 0;

    // 1. Fällige Wiederholungen: vor der neuen Erarbeitung, damit Gelerntes nicht verfällt.
    const examEve = upcoming.some((e) => addDays(e.date, -1) === day);
    const reviewBudget = examEve ? capacity : Math.floor(capacity * settings.maxReviewShare);
    const dueReviews = [...states.values()]
      .filter((s) => s.reviewDue !== undefined && s.reviewDue <= day && nextExam(s, day))
      .sort((a, b) =>
        a.reviewDue !== b.reviewDue ? (a.reviewDue! < b.reviewDue! ? -1 : 1) : b.priority.score - a.priority.score,
      );
    for (const s of dueReviews) {
      if (used + settings.reviewMinutes > reviewBudget) break;
      const exam = nextExam(s, day)!;
      const eve = addDays(exam.date, -1) === day;
      blocks.push({
        kind: eve ? 'pruefungsvorbereitung' : 'wiederholen',
        topicId: s.topic.id,
        examId: exam.id,
        minutes: settings.reviewMinutes,
        label: eve
          ? `Letzte Abfrage vor „${exam.name}“: ${s.topic.name}`
          : s.everTested
            ? `Wiederholung: ${s.topic.name}`
            : `Erste Abfrage: ${s.topic.name}`,
      });
      used += settings.reviewMinutes;
      // Planung der Folgewiederholung unter der Annahme „gut“; echte Ergebnisse korrigieren das.
      s.memory = s.memory ? updateState(s.memory, 3, day) : initState(3, day);
      s.everTested = true;
      s.reviewDue = capDue(s, addDays(day, nextIntervalDays(s.memory.stability, settings.desiredRetention)), day);
    }

    // 2. Neue Erarbeitung nach Zeitdruck und Priorität, unter Beachtung der Voraussetzungen.
    const blocksToday = new Map<ID, number>();
    for (;;) {
      const free = capacity - used;
      if (free < settings.minBlockMinutes) break;
      const candidates = [...states.values()].filter(
        (s) =>
          s.units.length > 0 &&
          s.exams[0]!.date > day &&
          (blocksToday.get(s.topic.id) ?? 0) < settings.maxBlocksPerTopicPerDay &&
          s.prerequisites.every((p) => states.get(p)!.units.length === 0),
      );
      if (candidates.length === 0) break;
      const key = (s: TopicState) => Math.min(pressure(s.exams[0]!.date, day, used), 2) + s.priority.score;
      candidates.sort((a, b) => key(b) - key(a));
      // Passt ein Block ganz, wird er genommen; sonst wird geteilt, aber nur ohne Kleinstreste.
      const pick =
        candidates.find((s) => s.units[0]! <= free) ??
        candidates.find((s) => s.units[0]! >= 2 * settings.minBlockMinutes);
      if (!pick) break;
      const unit = pick.units[0]!;
      const minutes = unit <= free ? unit : Math.min(free, unit - settings.minBlockMinutes);
      const part = pick.doneParts + 1;
      if (minutes < unit) {
        // Restzeit füllen: Block teilen, der Rest bleibt als eigener Block stehen.
        pick.units[0] = unit - minutes;
      } else {
        pick.units.shift();
        pick.doneParts = part;
      }
      blocks.push({
        kind: 'erarbeiten',
        topicId: pick.topic.id,
        examId: pick.exams[0]!.id,
        minutes,
        label: `Erarbeiten: ${pick.topic.name}`,
        part,
        parts: pick.totalParts,
      });
      used += minutes;
      blocksToday.set(pick.topic.id, (blocksToday.get(pick.topic.id) ?? 0) + 1);
      if (pick.units.length === 0 && pick.reviewDue === undefined) {
        pick.reviewDue = capDue(pick, addDays(day, 1), day);
      }
    }

    days.push({
      date: day,
      capacityMinutes: capacity,
      plannedMinutes: used,
      pauseMinutes: Math.max(0, blocks.length - 1) * settings.breakMinutes,
      blocks,
    });
  }

  const unscheduled: UnscheduledWork[] = [];
  const missingByExam = new Map<ID, number>();
  for (const s of states.values()) {
    const minutes = remainingMinutes(s);
    if (minutes === 0) continue;
    const examId = s.exams[0]!.id;
    unscheduled.push({ topicId: s.topic.id, examId, minutes });
    missingByExam.set(examId, (missingByExam.get(examId) ?? 0) + minutes);
  }
  for (const [examId, minutes] of missingByExam) {
    const exam = upcoming.find((e) => e.id === examId)!;
    warnings.push({
      kind: 'zeitmangel',
      examId,
      minutes,
      message: `Bis „${exam.name}“ (${exam.date}, in ${daysBetween(today, exam.date)} Tagen) fehlen ca. ${minutes} Minuten Lernzeit. Mehr Zeit einplanen oder Themen priorisieren.`,
    });
  }

  return {
    today,
    days,
    warnings,
    unscheduled,
    progress: Object.fromEntries(progress),
    priorities,
  };
}
