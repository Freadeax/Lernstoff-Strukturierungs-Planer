import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { LernstoffDB, deleteDocument } from './db';

async function befuelle(name: string) {
  const db = new LernstoffDB(name);
  const doc = (id: string) => ({ id, title: id, kind: 'pdf' as const, subjectIds: [], topicIds: [], version: 1, contentHash: id, importedAt: '2026-11-08T07:00:00Z' });
  const fp = (documentId: string, paragraphHashes: string[]) => ({ documentId, title: documentId, fileHash: documentId, contentHash: documentId, minhash: [], paragraphHashes, meta: {} as never, importedAt: '' });
  await db.documents.bulkAdd([doc('d1'), doc('d2')]);
  await db.chunks.bulkAdd([{ id: 'c1', documentId: 'd1', page: 1, text: 'Quelltext' }, { id: 'c2', documentId: 'd2', page: 1, text: 'Anderes' }]);
  await db.fingerprints.bulkAdd([fp('d1', ['nur-d1', 'geteilt']), fp('d2', ['geteilt'])]);
  await db.paragraphs.bulkAdd([{ hash: 'nur-d1', text: 'Absatz aus d1' }, { hash: 'geteilt', text: 'In beiden' }]);
  const sum = (id: string, sourceDocumentIds: string[], pipelineRunId?: string) => ({ id, mode: 'originalgetreu', length: 'kurz', topicIds: [], sourceDocumentIds, claims: [], createdAt: '', pipelineRunId } as never);
  await db.summaries.bulkAdd([sum('s1', ['d1'], 'r1'), sum('s2', ['d2'])]);
  await db.pipelineRuns.bulkAdd([
    { id: 'r1', startedAt: '', eingabe: { mode: 'originalgetreu', topicIds: [], documentIds: ['d1'], chunkIds: ['c1'] }, promptVersionen: {}, modelle: {}, rohantworten: ['Antwort mit Quelltext'], befunde: [], ergebnisSummaryId: 's1' } as never,
    { id: 'r2', startedAt: '', eingabe: { mode: 'originalgetreu', topicIds: [], documentIds: ['d2'], chunkIds: ['c2'] }, promptVersionen: {}, modelle: {}, rohantworten: [], befunde: [] } as never,
  ]);
  await db.karten.bulkAdd([{ id: 'sum:s1:b1', quelle: 'zusammenfassung', art: '', vorne: 'v', hinten: 'h', topicIds: [] } as never, { id: 'sum:s2:b1', quelle: 'zusammenfassung', art: '', vorne: 'v', hinten: 'h', topicIds: [] } as never]);
  await db.kartenStand.bulkAdd([{ cardId: 'sum:s1:b1', due: '' } as never, { cardId: 'def:s1:k1', due: '' } as never, { cardId: 'sum:s2:b1', due: '' } as never]);
  await db.activity.bulkAdd([{ at: '', kind: 'import', severity: 'info', title: 'd1 importiert', ref: 'd1' }, { at: '', kind: 'import', severity: 'info', title: 'd2 importiert', ref: 'd2' }]);
  return db;
}

describe('Dokument löschen', () => {
  it('nur Quelle: Text und eigene Absätze weg, Abgeleitetes bleibt markiert', async () => {
    const db = await befuelle('loeschen-quelle');
    const r = await deleteDocument('d1', db);
    expect(r).toEqual({ zusammenfassungen: 0, protokolle: 0, karten: 0 });
    expect(await db.documents.get('d1')).toBeUndefined();
    expect(await db.chunks.where('documentId').equals('d1').count()).toBe(0);
    expect((await db.paragraphs.toArray()).map((p) => p.hash)).toEqual(['geteilt']);
    expect((await db.summaries.get('s1'))?.needsReview).toBe(true);
    expect(await db.pipelineRuns.count()).toBe(2);
    expect(await db.kartenStand.count()).toBe(3);
  });

  it('auch abgeleitete Inhalte: Zusammenfassung, KI-Protokoll, Karten und Aktivität der Quelle weg', async () => {
    const db = await befuelle('loeschen-alles');
    const r = await deleteDocument('d1', db, { abgeleitete: true });
    expect(r).toEqual({ zusammenfassungen: 1, protokolle: 1, karten: 2 });
    expect((await db.summaries.toArray()).map((s) => s.id)).toEqual(['s2']);
    expect((await db.pipelineRuns.toArray()).map((x) => x.id)).toEqual(['r2']);
    expect((await db.karten.toArray()).map((k) => k.id)).toEqual(['sum:s2:b1']);
    expect((await db.kartenStand.toArray()).map((k) => k.cardId)).toEqual(['sum:s2:b1']);
    expect((await db.activity.toArray()).map((a) => a.ref)).toEqual(['d2']);
    expect(await db.documents.get('d2')).toBeDefined();
  });
});
