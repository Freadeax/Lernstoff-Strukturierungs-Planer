import { describe, expect, it } from 'vitest';
import {
  FSRS5_DEFAULT_WEIGHTS,
  evidenceRating,
  initState,
  nextIntervalDays,
  ratingFromScore,
  replay,
  retrievability,
  updateState,
} from '..';

describe('FSRS-5', () => {
  it('Abrufwahrscheinlichkeit ist 90 % nach genau S Tagen', () => {
    expect(retrievability(0, 5)).toBe(1);
    expect(retrievability(5, 5)).toBeCloseTo(0.9, 10);
    expect(nextIntervalDays(10, 0.9)).toBe(10);
  });

  it('nutzt die Startstabilitäten der Standardparameter', () => {
    expect(initState(3, '2026-10-26').stability).toBeCloseTo(FSRS5_DEFAULT_WEIGHTS[2]!);
    expect(initState(1, '2026-10-26').difficulty).toBeGreaterThan(initState(4, '2026-10-26').difficulty);
  });

  it('erfolgreiche Wiederholungen verlängern, Vergessen verkürzt die Stabilität', () => {
    const s0 = initState(3, '2026-10-26');
    const good = updateState(s0, 3, '2026-10-29');
    const again = updateState(good, 1, '2026-11-15');
    expect(good.stability).toBeGreaterThan(s0.stability * 2);
    expect(again.stability).toBeLessThan(good.stability);
    expect(updateState(s0, 4, '2026-10-29').stability).toBeGreaterThan(good.stability);
    expect(updateState(s0, 2, '2026-10-29').stability).toBeLessThan(good.stability);
  });

  it('lehnt Abfragen vor der letzten Abfrage ab', () => {
    expect(() => updateState(initState(3, '2026-10-26'), 3, '2026-10-20')).toThrow();
  });

  it('übersetzt Testergebnisse in Bewertungen', () => {
    expect([30, 55, 80, 95].map(ratingFromScore)).toEqual([1, 2, 3, 4]);
  });

  it('wertet ungültige Prozentwerte und Bewertungen nicht als Erfolg', () => {
    const log = { topicId: 't', date: '2026-10-26', source: 'quiz' as const };
    for (const scorePercent of [NaN, Infinity, -1, 101]) {
      expect(evidenceRating({ ...log, scorePercent })).toBeUndefined();
      expect(replay([{ ...log, scorePercent }])).toBeUndefined();
    }
    expect(evidenceRating({ ...log, rating: 0 as 1 })).toBeUndefined();
    expect(evidenceRating({ ...log, rating: 2.5 as 1 })).toBeUndefined();
    expect(evidenceRating({ ...log, scorePercent: 0 })).toBe(1);
  });

  it('ignoriert Selbsteinschätzungen beim Nachspielen', () => {
    expect(replay([{ topicId: 't', date: '2026-10-26', source: 'selbsteinschaetzung', rating: 4 }])).toBeUndefined();
    const state = replay([
      { topicId: 't', date: '2026-10-29', source: 'quiz', scorePercent: 80 },
      { topicId: 't', date: '2026-10-26', source: 'karteikarten', rating: 3 },
    ]);
    expect(state?.lastReview).toBe('2026-10-29');
  });
});
