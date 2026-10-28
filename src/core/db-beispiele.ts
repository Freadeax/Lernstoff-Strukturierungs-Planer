// Nur für Tests: eine gültige Beispielzeile je Tabelle der lokalen Datenbank.
// Neue Tabelle in db.ts → hier eine Zeile ergänzen (db-migration.test.ts erinnert daran).

/** Eine Beispielzeile je Tabelle; Schlüssel und Indexfelder reichen für den Test. */
export const BEISPIEL: Record<string, Record<string, unknown>> = {
  subjects: { id: 's1', moduleId: 'pflege', name: 'Recht' },
  topics: { id: 't1', subjectId: 's1', name: 'Haftung', prerequisites: [] },
  documents: { id: 'd1', title: 'Skript', kind: 'pdf', subjectIds: ['s1'], topicIds: ['t1'], version: 1, contentHash: 'h1', importedAt: '2026-10-01T10:00:00Z' },
  chunks: { id: 'c1', documentId: 'd1', page: 1, text: 'Absatz' },
  summaries: { id: 'z1', mode: 'lernmodus', topicIds: ['t1'], sourceDocumentIds: ['d1'], createdAt: '2026-10-02T10:00:00Z' },
  exams: { id: 'e1', date: '2026-12-01', subjectIds: ['s1'], title: 'Klausur' },
  fingerprints: { documentId: 'd1', fileHash: 'f1', contentHash: 'h1' },
  paragraphs: { hash: 'p1', text: 'Absatz' },
  activity: { at: '2026-10-03T10:00:00Z', kind: 'import', severity: 'info', title: 'Test' },
  board: { topicId: 't1', column: 'arbeit', order: 1, updatedAt: '2026-10-03T10:00:00Z' },
  studyLogs: { topicId: 't1', date: '2026-10-04', minutes: 30, at: '2026-10-04T10:00:00Z' },
  reviewLogs: { topicId: 't1', date: '2026-10-04', source: 'trainer', scorePercent: 80, at: '2026-10-04T11:00:00Z' },
  planner: { id: 'config', minutesPerDay: 60 },
  karten: { id: 'k1', quelle: 'eigen', ref: 'x', topicIds: ['t1'], vorne: 'A', hinten: 'B' },
  kartenStand: { cardId: 'k1', due: '2026-10-05' },
  kartenLogs: { cardId: 'k1', date: '2026-10-05', rating: 3 },
  kartenConfig: { id: 'config', neuProTag: 20 },
  pipelineRuns: { id: 'r1', startedAt: '2026-10-06T10:00:00Z', ergebnisSummaryId: 'z1' },
  skripte: { id: 'sk1', gruppe: 'CE01', topicIds: ['t1'], titel: 'Recht' },
};

