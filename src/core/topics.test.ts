import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { db, deleteAll } from './db';
import { bestaetigeThema, gleicheThemenAb, ladeThemen, ordneThemen } from './topics';
import type { Document, Topic } from './types';
import { modules } from '../modules/registry';

const subjectId = modules[0]!.subjects[0]!.id;
const doc: Document = { id: 'd', title: 'Skript', kind: 'text', subjectIds: [subjectId], topicIds: [], version: 1, contentHash: 'h', importedAt: '' };
const topics: Topic[] = [{ id: 'root', name: 'Grundlagen', subjectId, prerequisites: [] }, { id: 't', name: 'Dekubitus', subjectId, parentId: 'root', prerequisites: [] }];
afterEach(() => deleteAll());

describe('Material und Themenpool', () => {
  it('ordnet ganze Begriffe fachbezogen zu und schlägt Kapitel ohne Dubletten vor', () => {
    const r = ordneThemen(doc, [{ id: 'c', documentId: 'd', page: 1, chapter: 'Grundlagen > Mobilität', text: 'Dekubitus wird vermieden.' }], [...topics, { ...topics[1]!, id: 'anderes-fach', subjectId: 'anders' }]);
    expect(r.topicIds).toEqual(['root', 't']);
    expect(r.topicSuggestions).toEqual([{ name: 'Mobilität', subjectId, parentId: 'root' }]);
    expect(ordneThemen(doc, [{ id: 'c', documentId: 'd', page: 1, chapter: 'Kapitel 1: Dekubitus', text: 'Dekubitus' }], topics).topicSuggestions).toEqual([]);
  });
  it('erhält abgewählte Zuordnungen und verworfene Vorschläge beim erneuten Abgleich', () => {
    const r = ordneThemen({ ...doc, excludedTopicIds: ['t'], ignoredTopicNames: ['mobilität'] }, [{ id: 'c', documentId: 'd', page: 1, chapter: 'Mobilität', text: 'Dekubitus' }], topics);
    expect(r.topicIds).toEqual([]);
    expect(r.topicSuggestions).toEqual([]);
  });
  it('bestätigt neue Themen idempotent und erhält den Lernstand', async () => {
    await db.documents.add(doc);
    await db.board.add({ topicId: 'bestehend', column: 'erarbeitet', order: 5, updatedAt: '' });
    const v = { name: 'Neues Lernthema', subjectId };
    await bestaetigeThema('d', v);
    await bestaetigeThema('d', v);
    expect(await db.topics.count()).toBe(1);
    const d = await db.documents.get('d');
    expect(d!.topicIds).toHaveLength(1);
    expect((await ladeThemen()).some((t) => t.id === d!.topicIds[0])).toBe(true);
    expect((await db.board.get('bestehend'))!.column).toBe('erarbeitet');
    await db.chunks.add({ id: 'c', documentId: 'd', page: 1, text: 'Neues Lernthema' });
    await gleicheThemenAb('d');
    expect((await db.documents.get('d'))!.topicIds).toEqual(d!.topicIds);
  });
});
