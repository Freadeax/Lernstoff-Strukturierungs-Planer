// Themenpflege: Umbenennen, Löschen, Dublette auflösen, falsche Zuordnung korrigieren.
// Geprüft wird, dass Links, Prüfungen, Karten und Lernverlauf danach stimmen (Audit 11.11.2026).
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db, deleteAll } from '../../core/db';
import type { Document, Topic } from '../../core/types';
import { modules } from '../../modules/registry';
import { ladeFehler, speichereFehler, type Fehler } from '../fehlerheft/fehlerheft';
import { buildPlan } from '../lernplan';
import { assembleInput, loadPlannerData } from '../lernplan/store';
import { benenneThemaUm, bezuegeVon, findeDubletten, fuehreThemenZusammen, korrigiereZuordnung, loescheThema } from './pflege';

const modul = modules[0]!;
const fach = modul.subjects[0]!.id;
const katalog = modul.topics.find((t) => t.subjectId === fach && t.parentId)!;
const A: Topic = { id: 'thema.eigen.a', subjectId: fach, name: 'Wundversorgung Kapitel', prerequisites: [] };
const B: Topic = { id: 'thema.eigen.b', subjectId: fach, name: 'wundversorgung: kapitel', prerequisites: [] };
const KIND: Topic = { id: 'thema.eigen.kind', subjectId: fach, parentId: A.id, name: 'Unterpunkt Verband', prerequisites: [A.id] };
const doc = (over: Partial<Document> = {}): Document => ({ id: 'd1', title: 'Skript Wunde', kind: 'pdf', subjectIds: [fach], topicIds: [A.id, katalog.id], version: 1, contentHash: 'h', importedAt: '2026-11-01T00:00:00Z', ...over } as Document);
const fehler = (topicIds: string[]): Fehler => ({ id: 'f1', quelle: 'karten', topicIds, titel: 'x', frage: 'q', deineAntwort: 'a', loesung: 'l', erklaerung: [], wiederholung: { stufe: 0, faellig: '2026-11-11' }, erfasst: '2026-11-10', letzterFehler: '2026-11-10', fehlerAnzahl: 1, treffer: [], aktualisiert: '2026-11-10T00:00:00Z' } as unknown as Fehler);
const store = new Map<string, string>();
globalThis.localStorage ??= { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k), clear: () => store.clear(), key: () => null, length: 0 } as Storage;

async function grunddaten() {
  await db.topics.bulkPut([A, B, KIND]);
  await db.documents.put(doc());
  await db.exams.put({ id: 'e1', name: 'Klausur', date: '2026-12-01', subjectIds: [], topicIds: [A.id, B.id] });
  await db.karten.put({ id: 'k1', quelle: 'eigen', art: 'Frage', vorne: 'v', hinten: 'h', topicIds: [A.id], subjectIds: [], erstellt: 'x', geaendert: 'x' } as never);
  await db.kartenLogs.add({ cardId: 'k1', date: '2026-11-10', rating: 3, topicIds: [A.id] } as never);
  await db.board.bulkPut([{ topicId: A.id, column: 'erarbeitet', order: 1, updatedAt: '2026-11-10T10:00:00Z' }, { topicId: B.id, column: 'woche', order: 1, updatedAt: '2026-11-10T10:00:00Z' }]);
  await db.studyLogs.add({ topicId: A.id, date: '2026-11-10', minutes: 30, at: '2026-11-10T10:00:00Z' });
  // Direkt gespeichert: A ist ein Oberthema, bucheErgebnis nimmt nur Blattthemen an
  const log = (topicId: string, versuchId: string, date: string) => ({ topicId, date, source: 'trainer' as const, scorePercent: 80, at: `${date}T10:00:00Z`, versuchId, status: 'abgeschlossen' as const, aussagekraft: 'abruf' as const });
  await db.reviewLogs.bulkAdd([log(A.id, 'quiz:1', '2026-11-10'), log(B.id, 'quiz:1', '2026-11-10'), log(A.id, 'quiz:2', '2026-11-11')]);
  speichereFehler([fehler([A.id])]);
}

describe('Themenpflege', () => {
  beforeEach(async () => { await deleteAll(); store.clear(); localStorage.clear?.(); await grunddaten(); });

  it('Bezüge zählen alles, was am Thema hängt', async () => {
    expect(await bezuegeVon(A.id)).toEqual({ dokumente: 1, zusammenfassungen: 0, skripte: 0, pruefungen: 1, karten: 1, abfragen: 2, lernzeiten: 1, board: true, unterthemen: 1, fehler: 1 });
  });

  it('Umbenennen behält die ID, Verweise bleiben; gleichnamiges Geschwister wird als Dublette gemeldet', async () => {
    expect(await benenneThemaUm(A.id, 'Wundversorgung')).toEqual({});
    expect((await db.topics.get(A.id))!.name).toBe('Wundversorgung');
    expect((await db.documents.get('d1'))!.topicIds).toContain(A.id);
    expect((await bezuegeVon(A.id)).abfragen).toBe(2);
    const r = await benenneThemaUm(A.id, 'Wundversorgung, Kapitel');
    expect(r.dublette?.id).toBe(B.id);
    expect((await db.topics.get(A.id))!.name).toBe('Wundversorgung');
    await expect(benenneThemaUm(katalog.id, 'Neu')).rejects.toThrow(/Katalog/);
  });

  it('Dubletten finden: gleiches Fach, gleicher Name nach Normalisierung', () => {
    expect(findeDubletten(A, [A, B, KIND]).map((t) => t.id)).toEqual([B.id]);
  });

  it('Zusammenführen: Links, Prüfung, Karten, Lernverlauf, Board, Unterthemen und Fehlerheft hängen danach am Ziel', async () => {
    await fuehreThemenZusammen(A.id, B.id);
    expect(await db.topics.get(A.id)).toBeUndefined();
    expect((await db.documents.get('d1'))!.topicIds).toEqual([B.id, katalog.id]);
    expect((await db.exams.get('e1'))!.topicIds).toEqual([B.id]);
    expect((await db.karten.get('k1'))!.topicIds).toEqual([B.id]);
    expect((await db.kartenLogs.toArray())[0]!.topicIds).toEqual([B.id]);
    // quiz:1 war an beiden Themen gebucht: bleibt einmal, quiz:2 kommt dazu
    const logs = await db.reviewLogs.where('topicId').equals(B.id).toArray();
    expect(logs.map((l) => l.versuchId).sort()).toEqual(['quiz:1', 'quiz:2']);
    expect(await db.reviewLogs.where('topicId').equals(A.id).count()).toBe(0);
    expect(await db.studyLogs.where('topicId').equals(B.id).count()).toBe(1);
    expect((await db.board.get(B.id))!.column).toBe('erarbeitet');
    expect(await db.board.get(A.id)).toBeUndefined();
    const kind = (await db.topics.get(KIND.id))!;
    expect(kind.parentId).toBe(B.id);
    expect(kind.prerequisites).toEqual([B.id]);
    expect(ladeFehler()[0]!.topicIds).toEqual([B.id]);
    // Lernplan sieht nur noch das Ziel, mit beiden Abfragen
    const data = await loadPlannerData([...modul.topics, ...await db.topics.toArray()], '2026-11-11');
    const p = buildPlan(assembleInput(data));
    expect(p.progress[B.id]!.testCount).toBe(2);
    expect(p.progress[A.id]).toBeUndefined();
  });

  it('Zusammenführen in ein eigenes Unterthema wird abgelehnt (sonst Kreis im Baum)', async () => {
    await expect(fuehreThemenZusammen(A.id, KIND.id)).rejects.toThrow(/Unterthema/);
  });

  it('Löschen mit Lernverlauf nur ausdrücklich; Verweise weg, Dinge bleiben, Unterthemen rücken hoch', async () => {
    await expect(loescheThema(A.id)).rejects.toThrow(/Lernverlauf/);
    await loescheThema(A.id, { verlauf: true });
    expect(await db.topics.get(A.id)).toBeUndefined();
    expect((await db.documents.get('d1'))!.topicIds).toEqual([katalog.id]);
    expect((await db.exams.get('e1'))!.topicIds).toEqual([B.id]);
    expect((await db.karten.get('k1'))!.topicIds).toEqual([]);
    expect(await db.reviewLogs.where('topicId').equals(A.id).count()).toBe(0);
    expect(await db.reviewLogs.where('topicId').equals(B.id).count()).toBe(1);
    expect(await db.board.get(A.id)).toBeUndefined();
    const kind = (await db.topics.get(KIND.id))!;
    expect(kind.parentId).toBeUndefined();
    expect(kind.prerequisites).toEqual([]);
    expect(ladeFehler()[0]!.topicIds).toEqual([]);
  });

  it('Thema ohne Verlauf lässt sich direkt löschen; Katalogthemen nicht', async () => {
    await db.reviewLogs.clear(); await db.studyLogs.clear(); await db.board.clear();
    await loescheThema(B.id);
    expect(await db.topics.get(B.id)).toBeUndefined();
    await expect(loescheThema(katalog.id)).rejects.toThrow(/Katalog/);
  });

  it('Falsche automatische Zuordnung: lösen merkt sich den Ausschluss, umhängen ersetzt, Skript wird manuell', async () => {
    await korrigiereZuordnung('dokument', 'd1', katalog.id);
    let d = (await db.documents.get('d1'))!;
    expect(d.topicIds).toEqual([A.id]);
    expect(d.excludedTopicIds).toEqual([katalog.id]);
    await korrigiereZuordnung('dokument', 'd1', A.id, katalog.id);
    d = (await db.documents.get('d1'))!;
    expect(d.topicIds).toEqual([katalog.id]);
    expect(d.excludedTopicIds).toEqual([A.id]);
    await db.skripte.put({ id: 's1', datei: 's.md', gruppe: 'CE 01', titel: 'S', einleitung: '', quellen: [], abschnitte: [], topicIds: [A.id], hash: 'h', herkunft: 'datei', importiert: 'x', geaendert: 'x' });
    await korrigiereZuordnung('skript', 's1', A.id, B.id);
    expect(await db.skripte.get('s1')).toMatchObject({ topicIds: [B.id], themenManuell: true });
  });
});
