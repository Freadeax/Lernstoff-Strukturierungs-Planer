import { describe, expect, it } from 'vitest';
import { forecastExams, type ReviewLog } from '..';
import { baseInput, examA, topics } from './fixtures';

describe('Lernprognose', () => {
  it('ohne Testergebnisse: niedrige Zuverlässigkeit, keine Wissensannahme', () => {
    const studyLogs = topics.map((t) => ({ topicId: t.id, date: '2026-10-20', minutes: t.estimatedMinutes! }));
    const [f] = forecastExams(baseInput({ studyLogs }));
    expect(f!.examId).toBe(examA.id);
    expect(f!.confidence).toBe('niedrig');
    expect(f!.expectedRecallLowerBound).toBe(0);
    expect(f!.byStatus.bearbeitet).toBe(4);
    expect(f!.assessment).toMatch(/zu wenige Testergebnisse/);
    expect(f!.recommendations.join(' ')).toMatch(/noch nie abgefragt/);
  });

  it('erkennt Zeitprobleme frühzeitig', () => {
    const [f] = forecastExams(baseInput({ availability: { minutesByWeekday: [0, 15, 15, 15, 15, 15, 0] } }));
    expect(f!.timeFeasible).toBe(false);
    expect(f!.recommendations[0]).toMatch(/übersteigt/);
  });

  it('mit guten, wiederholten Testergebnissen: gute Ausgangslage und vorsichtige Werte', () => {
    const studyLogs = topics.map((t) => ({ topicId: t.id, date: '2026-10-01', minutes: t.estimatedMinutes! }));
    const reviewLogs: ReviewLog[] = examA.topicIds.flatMap((id) =>
      ['2026-10-05', '2026-10-12', '2026-10-24'].map((date) => ({ topicId: id, date, source: 'quiz' as const, rating: 3 as const })),
    );
    const [f] = forecastExams(baseInput({ studyLogs, reviewLogs }));
    expect(f!.byStatus.sicher).toBe(4);
    expect(f!.confidence).toBe('hoch');
    expect(f!.assessment).toMatch(/Gute Ausgangslage/);
    expect(f!.expectedRecallTested!).toBeLessThan(1);
    expect(f!.expectedRecallTested!).toBeGreaterThan(0.7);
  });

  it('nennt die unsichersten Themen zur gezielten Wiederholung', () => {
    const reviewLogs: ReviewLog[] = [
      { topicId: 'haut', date: '2026-10-25', source: 'quiz', scorePercent: 40 },
      { topicId: 'dekubitus', date: '2026-10-25', source: 'quiz', scorePercent: 75 },
    ];
    const [f] = forecastExams(baseInput({ reviewLogs }));
    const rec = f!.recommendations.find((r) => r.startsWith('Gezielt'))!;
    expect(rec.indexOf('Anatomie der Haut')).toBeLessThan(rec.indexOf('Dekubitusprophylaxe'));
  });
});
