// Anbindung der Lernplan-Logik an die lokale Datenbank und das Lernstand-Board.
// Oben reine Funktionen (testbar), unten Lesen und Schreiben über Dexie.

import { db } from '../../core/db';
import { logActivity } from '../../core/activity';
import { moveTopics, type BoardEntry } from '../../core/board';
import type { Exam, Topic } from '../../core/types';
import { dayKey } from '../../ui/lib/time';
import { computeProgress } from './progress';
import { availableMinutes } from './scheduler';
import {
  DEFAULT_SETTINGS,
  resolveSettings,
  topicMinutes,
  type Availability,
  type EvidenceSource,
  type PlannerInput,
  type PlannerSettings,
  type Rating,
  type Relevance,
  type ReviewLog,
  type StudyLog,
} from './types';

export interface StoredStudyLog extends StudyLog { id?: number; at: string }
/** `trainer`: aus welchem Übungstrainer das Ergebnis stammt (siehe trainer.ts), sonst leer. */
export interface StoredReviewLog extends ReviewLog { id?: number; at: string; trainer?: string }

/** Einstellungen des Planers, eine Zeile mit id 'standard'. */
export interface PlannerConfig {
  id: 'standard';
  availability: Availability;
  settings: Partial<PlannerSettings>;
  /** Gewichtung je Prüfung (1 = normale Klausur, 2 = wichtig, 3 = Abschlussprüfung). */
  examWeights: Record<string, number>;
  /** Freitext je Ausnahmetag, z. B. „Spätdienst“ oder „krank“. */
  exceptionNotes?: Record<string, string>;
}

export const DEFAULT_CONFIG: PlannerConfig = {
  id: 'standard',
  // So, Mo … Sa: werktags eine Stunde, samstags anderthalb, sonntags eine halbe.
  availability: { minutesByWeekday: [30, 60, 60, 60, 60, 60, 90], exceptions: {} },
  settings: {},
  examWeights: {},
};

export const WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'] as const;

export const SOURCE_LABEL: Record<EvidenceSource, string> = {
  quiz: 'Quiz',
  karteikarten: 'Karteikarten',
  offene_frage: 'Offene Fragen',
  pruefungssimulation: 'Prüfungssimulation',
  trainer: 'Übungstrainer',
  selbsteinschaetzung: 'Nur eingeschätzt',
};

/** Anzeigenamen der Übungstrainer (Schlüssel wie TrainerId in trainer.ts). */
export const TRAINER_NAME: Record<string, string> = {
  rechnen: 'Rechentrainer', duell: 'Fachbegriff-Duell', fall: 'Fallsimulator', uebergabe: 'Übergabe-Trainer', pflegeplanung: 'Pflegeplanung', sis: 'SIS-Trainer', mindmap: 'Mindmap', bericht: 'Pflegebericht-Trainer', assessment: 'Assessment-Rechner',
};

export const RATING_LABEL: Record<Rating, string> = { 1: 'Vergessen', 2: 'Schwer', 3: 'Gut', 4: 'Leicht' };

/** Heutiger Kalendertag in deutscher Zeit. */
export const heute = () => dayKey(new Date());

/** Themen ohne Unterthemen: nur diese werden erarbeitet und abgefragt. */
export function leafTopics(topics: Topic[]): Topic[] {
  const parents = new Set(topics.map((t) => t.parentId).filter(Boolean));
  return topics.filter((t) => !parents.has(t.id));
}

export interface PlannerData {
  today: string;
  topics: Topic[];
  exams: Exam[];
  studyLogs: StoredStudyLog[];
  reviewLogs: StoredReviewLog[];
  board: BoardEntry[];
  config: PlannerConfig;
}

/**
 * Baut die Planer-Eingabe aus gespeicherten Fakten und dem Lernstand-Board:
 * - „Erarbeitet“ auf dem Board heißt: Erarbeitung fertig, als Nächstes kommt die erste Abfrage.
 *   Fehlende Lernzeit wird dafür rechnerisch ergänzt (nicht gespeichert). Sicher wird ein Thema
 *   trotzdem erst durch echte Abfragen.
 * - „Diese Woche“ und „In Arbeit“ heben die Prüfungsrelevanz auf „hoch“, damit der Plan
 *   diese Themen zuerst einplant.
 */
export function assembleInput(d: PlannerData): PlannerInput {
  const settings = resolveSettings({ settings: d.config.settings });
  const studied = new Map<string, number>();
  for (const l of d.studyLogs) studied.set(l.topicId, (studied.get(l.topicId) ?? 0) + l.minutes);
  const byId = new Map(d.topics.map((t) => [t.id, t]));

  const synthetic: StudyLog[] = [];
  const relevance: Record<string, Relevance> = {};
  for (const e of d.board) {
    const t = byId.get(e.topicId);
    if (!t) continue;
    if (e.column === 'erarbeitet') {
      const rest = topicMinutes(t, settings) - (studied.get(t.id) ?? 0);
      if (rest > 0) synthetic.push({ topicId: t.id, date: dayKey(e.updatedAt) > d.today ? d.today : dayKey(e.updatedAt), minutes: rest });
    }
    if (e.column === 'woche' || e.column === 'arbeit') relevance[t.id] = 'hoch';
  }

  // Was heute schon gelernt oder abgefragt wurde, verbraucht heutige Zeit. Sonst würde der Plan
  // nach jedem erledigten Block den Tag erneut vollständig füllen.
  const doneToday = d.studyLogs.filter((l) => l.date === d.today).reduce((s, l) => s + l.minutes, 0)
    + d.reviewLogs.filter((l) => l.date === d.today).length * settings.reviewMinutes;
  const availability: Availability = doneToday > 0
    ? { ...d.config.availability, exceptions: { ...d.config.availability.exceptions, [d.today]: Math.max(0, availableMinutes(d.config.availability, d.today) - doneToday) } }
    : d.config.availability;

  return {
    today: d.today,
    topics: d.topics,
    exams: d.exams,
    studyLogs: [...d.studyLogs.map(({ topicId, date, minutes }) => ({ topicId, date, minutes })), ...synthetic],
    reviewLogs: d.reviewLogs.map(({ topicId, date, source, rating, scorePercent }) => ({ topicId, date, source, rating, scorePercent })),
    availability,
    relevance,
    examWeights: d.config.examWeights,
    settings: d.config.settings,
  };
}

/** Spalte für das Board nach erfasster Lernzeit: fertig erarbeitet oder noch in Arbeit. */
export function boardColumnAfterStudy(topic: Topic, studiedMinutes: number, settings: PlannerSettings = DEFAULT_SETTINGS) {
  return studiedMinutes >= topicMinutes(topic, settings) ? 'erarbeitet' as const : 'arbeit' as const;
}

// ---------------------------------------------------------------- Datenbank

export async function loadConfig(): Promise<PlannerConfig> {
  const c = await db.planner.get('standard');
  return c ? { ...DEFAULT_CONFIG, ...c, availability: { ...DEFAULT_CONFIG.availability, ...c.availability } } : DEFAULT_CONFIG;
}

export async function saveConfig(patch: Partial<Omit<PlannerConfig, 'id'>>) {
  const cur = await loadConfig();
  await db.planner.put({ ...cur, ...patch, id: 'standard' });
}

export async function loadPlannerData(topics: Topic[], today = heute()): Promise<PlannerData> {
  const [exams, studyLogs, reviewLogs, board, config] = await Promise.all([
    db.exams.toArray(), db.studyLogs.toArray(), db.reviewLogs.toArray(), db.board.toArray(), loadConfig(),
  ]);
  return { today, topics, exams, studyLogs, reviewLogs, board, config };
}

export async function saveExam(exam: Exam, weight: number) {
  const isNew = !(await db.exams.get(exam.id));
  await db.exams.put(exam);
  const cfg = await loadConfig();
  await saveConfig({ examWeights: { ...cfg.examWeights, [exam.id]: weight } });
  await logActivity({
    kind: 'lernplan', severity: 'info', ref: exam.id, subjectIds: exam.subjectIds,
    title: isNew ? `Prüfung „${exam.name}“ eingetragen` : `Prüfung „${exam.name}“ geändert`,
    detail: `${exam.date}, ${exam.topicIds.length} Themen`,
  });
}

export async function deleteExam(exam: Exam) {
  await db.exams.delete(exam.id);
  const cfg = await loadConfig();
  const { [exam.id]: _, ...rest } = cfg.examWeights;
  await saveConfig({ examWeights: rest });
  await logActivity({ kind: 'lernplan', severity: 'warning', ref: exam.id, title: `Prüfung „${exam.name}“ gelöscht` });
}

/** Lernzeit erfassen und das Board nachziehen (In Arbeit bzw. Erarbeitet). */
export async function logStudy(topic: Topic, minutes: number, date = heute()) {
  const cfg = await loadConfig();
  const settings = resolveSettings({ settings: cfg.settings });
  await db.studyLogs.add({ topicId: topic.id, date, minutes, at: new Date().toISOString() });
  const total = (await db.studyLogs.where('topicId').equals(topic.id).toArray()).reduce((s, l) => s + l.minutes, 0);
  const column = boardColumnAfterStudy(topic, total, settings);
  const prev = await db.board.get(topic.id);
  if (prev?.column !== column && prev?.column !== 'erarbeitet') await moveTopics([{ topicId: topic.id, column, name: topic.name }]);
  await logActivity({ kind: 'lernplan', severity: 'info', ref: topic.id, title: `${minutes} Min. gelernt: ${topic.name}` });
}

/** Abfrageergebnis speichern. Selbsteinschätzungen werden gespeichert, zählen aber nicht als Nachweis. */
export async function logReview(topic: Topic, source: EvidenceSource, result: { rating?: Rating; scorePercent?: number }, date = heute(), trainer?: string) {
  await db.reviewLogs.add({ topicId: topic.id, date, source, ...result, at: new Date().toISOString(), ...(trainer ? { trainer } : {}) });
  const was = result.rating ? RATING_LABEL[result.rating] : `${result.scorePercent} %`;
  await logActivity({
    kind: 'lernplan', ref: topic.id,
    severity: source !== 'selbsteinschaetzung' && (result.rating === 1 || (result.scorePercent ?? 100) < 50) ? 'warning' : 'info',
    title: `Abfrage ${topic.name}: ${was}`,
    detail: source === 'selbsteinschaetzung' ? 'Selbsteinschätzung, zählt nicht als Nachweis' : trainer ? `${SOURCE_LABEL[source]}: ${TRAINER_NAME[trainer] ?? trainer}` : SOURCE_LABEL[source],
  });
}

/** Wissensstand eines Themas aus den gespeicherten Fakten (für Landkarte und Board). */
export async function topicKnowledge(topic: Topic, today = heute()) {
  const [study, reviews, cfg, board] = await Promise.all([
    db.studyLogs.where('topicId').equals(topic.id).toArray(),
    db.reviewLogs.where('topicId').equals(topic.id).toArray(),
    loadConfig(),
    db.board.get(topic.id),
  ]);
  const input = assembleInput({ today, topics: [topic], exams: [], studyLogs: study, reviewLogs: reviews, board: board ? [board] : [], config: cfg });
  return computeProgress(topic, input.studyLogs, input.reviewLogs, today, resolveSettings(input));
}
