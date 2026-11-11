// Mehrfachverschieben mit Rückgängig (Audit 11.11.2026): Reihenfolge, Persistenz und Wiederherstellung.
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { moveTopics, moveTopicsMitStand, stelleBoardWiederHer } from './board';
import { db, deleteAll } from './db';

describe('Board: mehrere Themen verschieben und zurücknehmen', () => {
  beforeEach(async () => {
    await deleteAll();
    await moveTopics([{ topicId: 'a', column: 'arbeit', order: 500 }, { topicId: 'b', column: 'woche', order: 100 }, { topicId: 'x', column: 'woche', order: 900 }]);
  });

  it('verschiebt in Auswahlreihenfolge ans Ende der Zielspalte und speichert dauerhaft', async () => {
    const stand = await moveTopicsMitStand([{ topicId: 'a' }, { topicId: 'b' }, { topicId: 'c' }], 'woche');
    expect(stand).toEqual([
      { topicId: 'a', entry: expect.objectContaining({ column: 'arbeit', order: 500 }) },
      { topicId: 'b', entry: expect.objectContaining({ column: 'woche', order: 100 }) },
      { topicId: 'c' },
    ]);
    const woche = (await db.board.where('column').equals('woche').toArray()).sort((p, q) => p.order - q.order).map((e) => e.topicId);
    expect(woche).toEqual(['x', 'a', 'b', 'c']);
    expect(await db.activity.count()).toBeGreaterThan(0);
  });

  it('Rückgängig stellt Spalte und Reihenfolge wieder her; vorher fehlende Themen verschwinden wieder vom Board', async () => {
    const vorher = (await db.board.toArray()).sort((p, q) => p.topicId.localeCompare(q.topicId));
    const stand = await moveTopicsMitStand([{ topicId: 'a' }, { topicId: 'b' }, { topicId: 'c' }], 'erarbeitet');
    await stelleBoardWiederHer(stand);
    const nachher = (await db.board.toArray()).sort((p, q) => p.topicId.localeCompare(q.topicId));
    expect(nachher).toEqual(vorher);
    expect(await db.board.get('c')).toBeUndefined();
  });
});
