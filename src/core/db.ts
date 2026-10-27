import Dexie, { type EntityTable } from 'dexie';
import type { Document, Exam, SourceChunk, Subject, Summary, Topic } from './types';
import type { Fingerprint } from '../features/dokumente/import/types';
import type { ActivityEntry } from './activity';
import type { BoardEntry } from './board';
import type { PipelineRun } from '../features/zusammenfasser/typen';
import type { PlannerConfig, StoredReviewLog, StoredStudyLog } from '../features/lernplan/store';
import type { Karte, KartenConfig, KartenLog, KartenStand } from '../features/karteikarten/typen';
import type { Skript } from '../features/skript/typen';

/** Absatztext zu einem Absatz-Hash, für die Anzeige entfallener Absätze beim Versionsvergleich. */
export interface ParagraphText { hash: string; text: string; }

/** Lokale Datenbank (IndexedDB). Alle Daten bleiben auf dem Gerät. */
export class LernstoffDB extends Dexie {
  subjects!: EntityTable<Subject, 'id'>;
  topics!: EntityTable<Topic, 'id'>;
  documents!: EntityTable<Document, 'id'>;
  chunks!: EntityTable<SourceChunk, 'id'>;
  summaries!: EntityTable<Summary, 'id'>;
  exams!: EntityTable<Exam, 'id'>;
  fingerprints!: EntityTable<Fingerprint, 'documentId'>;
  paragraphs!: EntityTable<ParagraphText, 'hash'>;
  activity!: EntityTable<ActivityEntry, 'id'>;
  pipelineRuns!: EntityTable<PipelineRun, 'id'>;
  board!: EntityTable<BoardEntry, 'topicId'>;
  studyLogs!: EntityTable<StoredStudyLog, 'id'>;
  reviewLogs!: EntityTable<StoredReviewLog, 'id'>;
  planner!: EntityTable<PlannerConfig, 'id'>;
  karten!: EntityTable<Karte, 'id'>;
  kartenStand!: EntityTable<KartenStand, 'cardId'>;
  kartenLogs!: EntityTable<KartenLog, 'id'>;
  kartenConfig!: EntityTable<KartenConfig, 'id'>;
  skripte!: EntityTable<Skript, 'id'>;

  constructor(name = 'lernstoff-planer') {
    super(name);
    this.version(1).stores({
      subjects: 'id, moduleId, name',
      topics: 'id, subjectId, parentId',
      documents: 'id, contentHash, *subjectIds, *topicIds',
      chunks: 'id, documentId, [documentId+page]',
      summaries: 'id, mode, *topicIds, *sourceDocumentIds',
      exams: 'id, date, *subjectIds',
    });
    this.version(2).stores({
      fingerprints: 'documentId, fileHash, contentHash',
      paragraphs: 'hash',
    });
    // v3: Oberfläche (Aktivitäts-Feed, Lernstand-Board). Bestehende Dokumente und
    // Zusammenfassungen werden einmalig ins Aktivitätsprotokoll übernommen.
    this.version(3).stores({
      activity: '++id, at, kind, severity',
      board: 'topicId, column',
    }).upgrade(async (tx) => {
      const docs = await tx.table<Document>('documents').toArray();
      const sums = await tx.table<Summary>('summaries').toArray();
      await tx.table<ActivityEntry>('activity').bulkAdd([
        ...docs.map((d): ActivityEntry => ({ at: d.importedAt, kind: 'import', severity: 'info', title: `${d.title} importiert`, subjectIds: d.subjectIds, ref: d.id })),
        ...sums.map((s): ActivityEntry => ({
          at: s.createdAt, kind: 'zusammenfassung', ref: s.id,
          severity: s.qa?.ampel === 'rot' ? 'critical' : s.qa?.ampel === 'gelb' ? 'warning' : 'info',
          title: 'Zusammenfassung erstellt', detail: s.qa ? `${s.qa.statistik.belegt} von ${s.qa.statistik.claims} Aussagen belegt` : undefined,
        })),
      ]);
    });
    // v4: Lernplan. Nur Fakten (Lernzeit, echte Abfragen, verfügbare Zeit), der Plan selbst
    // wird nie gespeichert, sondern bei jedem Öffnen neu berechnet.
    this.version(4).stores({
      studyLogs: '++id, topicId, date',
      reviewLogs: '++id, topicId, date',
      planner: 'id',
    });
    // v5: Karteikarten. Gespeichert werden nur eigene und übernommene Karten; Glossar- und
    // Katalogkarten entstehen bei jedem Öffnen neu aus dem Fachmodul, ihr Lernstand liegt in kartenStand.
    this.version(5).stores({
      karten: 'id, quelle, ref, *topicIds',
      kartenStand: 'cardId, due',
      kartenLogs: '++id, cardId, date',
      kartenConfig: 'id',
    });
    // v6: Zusammenfasser-Läufe (PipelineRun) zum Nachvollziehen: Prompt-Versionen, Modell, Rohantworten, Befunde, Tokens.
    this.version(6).stores({
      pipelineRuns: 'id, startedAt, ergebnisSummaryId',
    });
    // v7: Skript (belegte Lernzusammenfassungen zum Lesen). Inhalte kommen nur vom Gerät
    // (privates Material-Repo oder Datei), nie aus dem App-Bundle.
    this.version(7).stores({
      skripte: 'id, gruppe, *topicIds',
    });
  }
}

export const db = new LernstoffDB();

/** Alle Daten als JSON exportieren (Datensicherung, Datenschutz). */
export async function exportAll(database: LernstoffDB = db) {
  const out: Record<string, unknown[]> = {};
  for (const table of database.tables) out[table.name] = await table.toArray();
  return { app: 'lernstoff-planer', schema: database.verno, exportedAt: new Date().toISOString(), data: out };
}

/** Alle lokal gespeicherten Daten unwiderruflich löschen. */
export async function deleteAll(database: LernstoffDB = db) {
  await database.transaction('rw', database.tables, async () => {
    await Promise.all(database.tables.map((t) => t.clear()));
  });
}

/** Ein Dokument mit Chunks, Fingerabdruck und davon abgeleiteten Zusammenfassungen löschen. */
export async function deleteDocument(documentId: string, database: LernstoffDB = db) {
  await database.transaction('rw', [database.documents, database.chunks, database.fingerprints, database.summaries], async () => {
    await database.chunks.where('documentId').equals(documentId).delete();
    await database.fingerprints.delete(documentId);
    await database.summaries.where('sourceDocumentIds').equals(documentId).modify({ needsReview: true });
    await database.documents.delete(documentId);
  });
}
