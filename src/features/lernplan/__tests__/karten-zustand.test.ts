import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { buildPlan, computeProgress, DEFAULT_SETTINGS, summarizeCards, type CardEvidence, type PlannerInput, type ReviewLog } from '..';
import { cardsByTopic, loadCardEvidence } from '../store';
import { db } from '../../../core/db';
import { topics } from './fixtures';

const haut = topics[0]!;
const study = [{ topicId: 'haut', date: '2026-10-20', minutes: 90 }];
const TODAY = '2026-10-26';
// Zwei erfolgreiche Abfragen an verschiedenen Tagen: ohne Karten ist das Thema „sicher“.
const logs: ReviewLog[] = [
  { topicId: 'haut', date: '2026-10-21', source: 'karteikarten', rating: 3 },
  { topicId: 'haut', date: '2026-10-24', source: 'quiz', scorePercent: 85 },
];
const gut: CardEvidence = { stability: 30, lastReview: '2026-10-24' };
const wackelig: CardEvidence = { stability: 0.5, lastReview: '2026-10-20' };

describe('Thema erbt den Zustand seiner Karteikarten', () => {
  it('ohne genug Karten bleibt alles wie bisher', () => {
    expect(computeProgress(haut, study, logs, TODAY, DEFAULT_SETTINGS).status).toBe('sicher');
    const p = computeProgress(haut, study, logs, TODAY, DEFAULT_SETTINGS, [wackelig, wackelig]);
    expect(p.status).toBe('sicher');
    expect(p.cards).toBeUndefined();
  });

  it('gut abrufbare Karten bestätigen „sicher“ und werden angezeigt', () => {
    const p = computeProgress(haut, study, logs, TODAY, DEFAULT_SETTINGS, [gut, gut, gut, gut, gut]);
    expect(p.status).toBe('sicher');
    expect(p.cards).toMatchObject({ total: 5, weak: 0 });
  });

  it('zu viele wackelige Karten machen ein sicheres Thema unsicher und heute fällig', () => {
    const p = computeProgress(haut, study, logs, TODAY, DEFAULT_SETTINGS, [gut, gut, gut, wackelig, wackelig]);
    expect(p.status).toBe('unsicher');
    expect(p.nextReview).toBe(TODAY);
    expect(p.reasons.join(' ')).toMatch(/2 von 5 Karteikarten/);
    expect(p.reasons.join(' ')).not.toMatch(/Mehrfach erfolgreich/);
  });

  it('Karten werten nie auf: ohne echte Abfrage bleibt das Thema „bearbeitet“', () => {
    const p = computeProgress(haut, study, [], TODAY, DEFAULT_SETTINGS, [gut, gut, gut]);
    expect(p.status).toBe('bearbeitet');
  });

  it('künftige Kartenstände zählen an früheren Tagen nicht', () => {
    expect(summarizeCards([gut, gut, gut], '2026-10-23')).toBeUndefined();
  });

  it('der Plan setzt das abgewertete Thema heute als Abfrage an', () => {
    const base: PlannerInput = {
      today: TODAY, topics: [haut], exams: [{ id: 'k', name: 'Klausur', date: '2026-11-20', subjectIds: [], topicIds: ['haut'] }],
      studyLogs: study, reviewLogs: logs, availability: { minutesByWeekday: [60, 60, 60, 60, 60, 60, 60], exceptions: {} },
    };
    const ohne = buildPlan(base);
    const mit = buildPlan({ ...base, cardEvidence: { haut: [gut, wackelig, wackelig, wackelig] } });
    expect(ohne.progress.haut!.status).toBe('sicher');
    expect(mit.progress.haut!.status).toBe('unsicher');
    const heute = (p: typeof mit) => p.days.find((d) => d.date === TODAY)?.blocks.filter((b) => b.topicId === 'haut' && b.kind !== 'erarbeiten').length ?? 0;
    expect(heute(mit)).toBeGreaterThan(heute(ohne));
  });
});

describe('Kartenstand aus der Datenbank', () => {
  it('ordnet Karten über ihren jüngsten Protokolleintrag Themen zu und lässt pausierte und neue weg', async () => {
    await db.kartenStand.bulkPut([
      { cardId: 'a', stability: 10, difficulty: 5, lastReview: '2026-10-24', due: '2026-11-03', reps: 2, lapses: 0, erstmals: '2026-10-20' },
      { cardId: 'b', stability: 10, difficulty: 5, lastReview: '2026-10-24', due: '2026-11-03', reps: 2, lapses: 0, erstmals: '2026-10-20', ausgesetzt: true },
      { cardId: 'c', stability: 0, difficulty: 5, lastReview: '', due: '9999-12-31', reps: 0, lapses: 0, erstmals: '' },
    ]);
    await db.kartenLogs.bulkAdd([
      { cardId: 'a', date: '2026-10-20', at: '2026-10-20T08:00:00Z', rating: 3, topicIds: ['alt'] },
      { cardId: 'a', date: '2026-10-24', at: '2026-10-24T08:00:00Z', rating: 3, topicIds: ['haut', 'dekubitus'] },
      { cardId: 'b', date: '2026-10-24', at: '2026-10-24T08:00:00Z', rating: 1, topicIds: ['haut'] },
    ]);
    const cards = await loadCardEvidence();
    expect(cards).toEqual([{ stability: 10, lastReview: '2026-10-24', topicIds: ['haut', 'dekubitus'] }]);
    expect(Object.keys(cardsByTopic(cards))).toEqual(['haut', 'dekubitus']);
    expect(await loadCardEvidence('alt')).toEqual([]);
  });
});
