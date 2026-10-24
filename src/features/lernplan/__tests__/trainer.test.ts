import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db, deleteAll } from '../../../core/db';
import type { Topic } from '../../../core/types';
import { evidenceRating } from '../fsrs';
import { inLernplan, planeUebernahme, proThema } from '../trainer';

const topics: Topic[] = [
  { id: 'a', subjectId: 's', name: 'Anatomie', prerequisites: [] },
  { id: 'a.herz', subjectId: 's', parentId: 'a', name: 'Herz', prerequisites: [] },
  { id: 'a.lunge', subjectId: 's', parentId: 'a', name: 'Lunge', prerequisites: [] },
];
const TODAY = '2026-10-26';

describe('Trainer-Ergebnisse je Thema', () => {
  it('fasst Aufgaben je Thema zusammen und lässt Themen mit zu wenigen Aufgaben weg', () => {
    const r = proThema([
      { topicIds: ['a.herz'], punkte: 1, max: 1 },
      { topicIds: ['a.herz'], punkte: 0, max: 1 },
      { topicIds: ['a.herz', 'a.lunge'], punkte: 1, max: 1 },
    ], 2);
    expect(r).toEqual([{ topicId: 'a.herz', scorePercent: 67, anzahl: 3 }]);
  });

  it('zählt ein Thema pro Aufgabe nur einmal und kappt Punkte auf das Maximum', () => {
    expect(proThema([{ topicIds: ['a.herz', 'a.herz'], punkte: 140, max: 100 }])).toEqual([{ topicId: 'a.herz', scorePercent: 100, anzahl: 1 }]);
  });

  it('übernimmt nur lernbare Themen und bei Wiederholung am selben Tag nur den ersten Versuch', () => {
    const plan = planeUebernahme([
      { topicId: 'a', scorePercent: 80, anzahl: 3 },
      { topicId: 'a.herz', scorePercent: 80, anzahl: 3 },
      { topicId: 'a.lunge', scorePercent: 50, anzahl: 3 },
    ], topics, new Set(['a.lunge']));
    expect(plan.map((u) => [u.topicId, u.status])).toEqual([['a', 'kein_thema'], ['a.herz', 'gespeichert'], ['a.lunge', 'heute_schon']]);
  });
});

describe('Trainer-Ergebnisse in der Datenbank', () => {
  beforeEach(async () => { await deleteAll(); });

  it('speichert Abfragen mit Herkunft, die als Wissensnachweis zählen', async () => {
    const r = await inLernplan('rechnen', [{ topicId: 'a.herz', scorePercent: 90, anzahl: 5 }], topics, TODAY);
    expect(r[0]!.status).toBe('gespeichert');
    const logs = await db.reviewLogs.toArray();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ topicId: 'a.herz', date: TODAY, source: 'trainer', scorePercent: 90, trainer: 'rechnen' });
    expect(evidenceRating(logs[0]!)).toBe(4);
  });

  it('zählt je Trainer, Thema und Tag nur den ersten Versuch, andere Trainer und Tage aber schon', async () => {
    await inLernplan('uebergabe', [{ topicId: 'a.herz', scorePercent: 40, anzahl: 1 }], topics, TODAY);
    const zweiter = await inLernplan('uebergabe', [{ topicId: 'a.herz', scorePercent: 100, anzahl: 1 }], topics, TODAY);
    expect(zweiter[0]!.status).toBe('heute_schon');
    await inLernplan('fall', [{ topicId: 'a.herz', scorePercent: 80, anzahl: 1 }], topics, TODAY);
    await inLernplan('uebergabe', [{ topicId: 'a.herz', scorePercent: 90, anzahl: 1 }], topics, '2026-10-27');
    const logs = await db.reviewLogs.orderBy('id').toArray();
    expect(logs.map((l) => [l.trainer, l.date, l.scorePercent])).toEqual([
      ['uebergabe', TODAY, 40], ['fall', TODAY, 80], ['uebergabe', '2026-10-27', 90],
    ]);
  });
});
