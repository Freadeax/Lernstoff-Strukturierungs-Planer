import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { describe, expect, it } from 'vitest';
import { LernstoffDB } from './db';
import { BEISPIEL } from './db-beispiele';

// Eingefrorene Schemata aller veröffentlichten Datenbank-Versionen, so wie sie auf den Geräten
// liegen. Diese Liste wird nie geändert, nur ergänzt: Eine neue Version in db.ts braucht hier
// einen neuen Eintrag. So prüft der Test, dass ein Gerät von JEDER alten Version auf die
// aktuelle wechseln kann, ohne dass Daten verloren gehen.
const VERSIONEN: Record<number, Record<string, string>> = {
  1: {
    subjects: 'id, moduleId, name', topics: 'id, subjectId, parentId', documents: 'id, contentHash, *subjectIds, *topicIds',
    chunks: 'id, documentId, [documentId+page]', summaries: 'id, mode, *topicIds, *sourceDocumentIds', exams: 'id, date, *subjectIds',
  },
  2: { fingerprints: 'documentId, fileHash, contentHash', paragraphs: 'hash' },
  3: { activity: '++id, at, kind, severity', board: 'topicId, column' },
  4: { studyLogs: '++id, topicId, date', reviewLogs: '++id, topicId, date', planner: 'id' },
  5: { karten: 'id, quelle, ref, *topicIds', kartenStand: 'cardId, due', kartenLogs: '++id, cardId, date', kartenConfig: 'id' },
  6: { pipelineRuns: 'id, startedAt, ergebnisSummaryId' },
  7: { skripte: 'id, gruppe, *topicIds' },
};
const LETZTE = Math.max(...Object.keys(VERSIONEN).map(Number));

/** Tabellen, die bis einschließlich Version v existieren. */
const tabellenBis = (v: number) => Object.entries(VERSIONEN).filter(([n]) => Number(n) <= v).flatMap(([, s]) => Object.keys(s));

let n = 0;
async function alteDb(v: number) {
  const name = `migration-${v}-${++n}`;
  const alt = new Dexie(name);
  for (let i = 1; i <= v; i++) alt.version(i).stores(VERSIONEN[i]);
  await alt.open();
  for (const t of tabellenBis(v)) await alt.table(t).add({ ...BEISPIEL[t] });
  alt.close();
  return name;
}

describe('Datenbank-Migration', () => {
  it('kennt jede Version aus db.ts (neue Version → hier eingefrorenes Schema ergänzen)', () => {
    const db = new LernstoffDB('migration-verno');
    expect(db.verno).toBe(LETZTE);
    expect(db.tables.map((t) => t.name).sort()).toEqual(tabellenBis(LETZTE).sort());
    expect(Object.keys(BEISPIEL).sort()).toEqual(tabellenBis(LETZTE).sort());
  });

  it('das eingefrorene Schema stimmt mit db.ts überein (alte Versionen nie nachträglich ändern)', () => {
    const db = new LernstoffDB('migration-schema');
    const neu = Object.assign({}, ...Object.values(VERSIONEN)) as Record<string, string>;
    for (const t of db.tables) {
      const erwartet = neu[t.name].split(',').map((s) => s.trim());
      const ist = [t.schema.primKey.src, ...t.schema.indexes.map((i) => i.src)];
      expect(ist, t.name).toEqual(erwartet);
    }
  });

  for (let v = 1; v <= LETZTE; v++) {
    it(`übernimmt alle Daten von Version ${v}`, async () => {
      const db = new LernstoffDB(await alteDb(v));
      await db.open();
      expect(db.verno).toBe(LETZTE);
      for (const t of tabellenBis(v)) {
        const zeilen = await db.table(t).toArray();
        // activity bekommt bei v3 zusätzlich die übernommenen Importe und Zusammenfassungen
        if (t === 'activity') expect(zeilen.length, t).toBeGreaterThanOrEqual(1);
        else expect(zeilen, t).toEqual([expect.objectContaining(BEISPIEL[t])]);
      }
      // Tabellen, die erst später dazukamen, sind leer und benutzbar
      for (const t of tabellenBis(LETZTE).filter((x) => !tabellenBis(v).includes(x))) {
        if (t === 'activity') continue; // v3 füllt das Protokoll aus Dokumenten und Zusammenfassungen
        expect(await db.table(t).count(), t).toBe(0);
      }
      db.close();
    });
  }

  it('v3 übernimmt Dokumente und Zusammenfassungen genau einmal ins Aktivitätsprotokoll', async () => {
    const db = new LernstoffDB(await alteDb(2));
    const a = await db.activity.toArray();
    expect(a.map((x) => x.kind).sort()).toEqual(['import', 'zusammenfassung']);
    db.close();
    const nochmal = new LernstoffDB(db.name);
    expect(await nochmal.activity.count()).toBe(2);
    nochmal.close();
  });
});
