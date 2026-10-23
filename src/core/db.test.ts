import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { LernstoffDB, deleteAll, exportAll } from './db';

describe('lokale Datenbank', () => {
  it('speichert, exportiert und löscht Daten', async () => {
    const db = new LernstoffDB('test-db');
    await db.subjects.add({ id: 's1', name: 'Recht' });
    const dump = await exportAll(db);
    expect(dump.data.subjects).toHaveLength(1);
    await deleteAll(db);
    expect(await db.subjects.count()).toBe(0);
  });
});

describe('Datenbank-Version 3', () => {
  it('übernimmt vorhandene Dokumente ins Aktivitätsprotokoll', async () => {
    const name = 'test-db-v3';
    const { default: Dexie } = await import('dexie');
    const old = new Dexie(name);
    old.version(2).stores({
      subjects: 'id, moduleId, name', topics: 'id, subjectId, parentId', documents: 'id, contentHash, *subjectIds, *topicIds',
      chunks: 'id, documentId, [documentId+page]', summaries: 'id, mode, *topicIds, *sourceDocumentIds', exams: 'id, date, *subjectIds',
      fingerprints: 'documentId, fileHash, contentHash', paragraphs: 'hash',
    });
    await old.table('documents').add({ id: 'd1', title: 'Skript', kind: 'pdf', subjectIds: ['s'], topicIds: [], version: 1, contentHash: 'h', importedAt: '2026-10-20T10:00:00Z' });
    old.close();
    const db = new LernstoffDB(name);
    const activity = await db.activity.toArray();
    expect(activity).toHaveLength(1);
    expect(activity[0]).toMatchObject({ kind: 'import', ref: 'd1', at: '2026-10-20T10:00:00Z' });
    expect(await db.board.count()).toBe(0);
  });
});
