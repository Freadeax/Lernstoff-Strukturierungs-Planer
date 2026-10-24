import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db, deleteAll } from '../../../core/db';
import type { Topic } from '../../../core/types';
import { buildPlan } from '../scheduler';
import { computeProgress } from '../progress';
import { DEFAULT_SETTINGS } from '../types';
import {
  assembleInput, boardColumnAfterStudy, DEFAULT_CONFIG, leafTopics, loadPlannerData, logReview, logStudy, saveConfig, saveExam,
  type PlannerData,
} from '../store';

const topics: Topic[] = [
  { id: 'a', subjectId: 's', name: 'Anatomie', prerequisites: [] },
  { id: 'a.herz', subjectId: 's', parentId: 'a', name: 'Herz', prerequisites: [], estimatedMinutes: 90 },
  { id: 'a.lunge', subjectId: 's', parentId: 'a', name: 'Lunge', prerequisites: ['a.herz'], estimatedMinutes: 60 },
];
const TODAY = '2026-10-26'; // Montag

const base = (patch: Partial<PlannerData> = {}): PlannerData => ({
  today: TODAY, topics, exams: [{ id: 'k', name: 'Klausur', date: '2026-11-09', subjectIds: ['s'], topicIds: ['a.herz', 'a.lunge'] }],
  studyLogs: [], reviewLogs: [], board: [], config: DEFAULT_CONFIG, ...patch,
});

describe('Planer-Eingabe aus Datenbank und Board', () => {
  it('nimmt nur Themen ohne Unterthemen als lernbare Themen', () => {
    expect(leafTopics(topics).map((t) => t.id)).toEqual(['a.herz', 'a.lunge']);
  });

  it('behandelt „Erarbeitet“ auf dem Board als fertige Erarbeitung, aber nicht als sicher', () => {
    const input = assembleInput(base({ board: [{ topicId: 'a.herz', column: 'erarbeitet', order: 1, updatedAt: '2026-10-25T08:00:00Z' }] }));
    const p = computeProgress(topics[1]!, input.studyLogs, input.reviewLogs, TODAY, DEFAULT_SETTINGS);
    expect(p.remainingStudyMinutes).toBe(0);
    expect(p.status).toBe('bearbeitet');
    expect(p.nextReview).toBe(TODAY);
  });

  it('hebt Themen aus „Diese Woche“ in der Relevanz an', () => {
    const input = assembleInput(base({ board: [{ topicId: 'a.lunge', column: 'woche', order: 1, updatedAt: '2026-10-25T08:00:00Z' }] }));
    expect(input.relevance).toEqual({ 'a.lunge': 'hoch' });
  });

  it('zieht heute bereits Gelerntes von der heutigen Zeit ab', () => {
    const studyLogs = [{ topicId: 'a.herz', date: TODAY, minutes: 45, at: `${TODAY}T08:00:00Z` }];
    const input = assembleInput(base({ studyLogs }));
    expect(input.availability.exceptions?.[TODAY]).toBe(15); // Montag 60 Min. minus 45
    const plan = buildPlan(input);
    expect(plan.days[0]!.plannedMinutes).toBeLessThanOrEqual(15);
  });

  it('ordnet erfasste Lernzeit der richtigen Board-Spalte zu', () => {
    expect(boardColumnAfterStudy(topics[1]!, 45)).toBe('arbeit');
    expect(boardColumnAfterStudy(topics[1]!, 90)).toBe('erarbeitet');
  });
});

describe('Lernplan in der lokalen Datenbank', () => {
  beforeEach(() => deleteAll(db));

  it('speichert Prüfung, Lernzeit und Abfrage und zieht das Board nach', async () => {
    await saveExam({ id: 'k', name: 'Klausur', date: '2026-11-09', subjectIds: ['s'], topicIds: ['a.herz', 'a.lunge'] }, 2);
    await saveConfig({ availability: { minutesByWeekday: [0, 90, 90, 90, 90, 90, 0], exceptions: {} } });

    await logStudy(topics[1]!, 45, TODAY);
    expect((await db.board.get('a.herz'))?.column).toBe('arbeit');
    await logStudy(topics[1]!, 45, TODAY);
    expect((await db.board.get('a.herz'))?.column).toBe('erarbeitet');

    await logReview(topics[1]!, 'quiz', { scorePercent: 80 }, TODAY);
    const data = await loadPlannerData(topics, TODAY);
    expect(data.config.examWeights).toEqual({ k: 2 });
    expect(data.reviewLogs).toHaveLength(1);

    const plan = buildPlan(assembleInput(data));
    expect(plan.progress['a.herz']!.status).toBe('unsicher');
    // 90 Min. gelernt + 1 Abfrage verbrauchen die Zeit von heute
    expect(plan.days[0]!.capacityMinutes).toBe(0);
    const kinds = plan.days.flatMap((d) => d.blocks.filter((b) => b.topicId === 'a.lunge').map((b) => b.kind));
    expect(kinds).toContain('erarbeiten');

    const log = await db.activity.where('kind').equals('lernplan').count();
    expect(log).toBe(4);
  });

  it('zählt Selbsteinschätzung nicht als Abfrage', async () => {
    await logStudy(topics[2]!, 60, TODAY);
    await logReview(topics[2]!, 'selbsteinschaetzung', { rating: 4 }, TODAY);
    const data = await loadPlannerData(topics, TODAY);
    const input = assembleInput(data);
    const p = computeProgress(topics[2]!, input.studyLogs, input.reviewLogs, TODAY, DEFAULT_SETTINGS);
    expect(p.status).toBe('bearbeitet');
    expect(p.testCount).toBe(0);
  });
});
