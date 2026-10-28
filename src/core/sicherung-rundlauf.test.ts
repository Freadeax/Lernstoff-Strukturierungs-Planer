import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { LernstoffDB } from './db';
import { BEISPIEL } from './db-beispiele';
import { erstelleSicherung, lesePruefe, spieleEin } from './sicherung';

// Rundlauf über ALLE Tabellen: Was eine neue Tabelle speichert, muss eine Sicherung überstehen,
// ohne dass jemand daran denken muss. Ergänzt sicherung.test.ts, das Einzelfälle prüft.

class Speicher {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
}
const ls = new Speicher();
(globalThis as { localStorage?: unknown }).localStorage = ls;
beforeEach(() => ls.clear());

let n = 0;
async function gefuellt() {
  const db = new LernstoffDB(`rundlauf-${++n}`);
  for (const t of db.tables) await t.add({ ...BEISPIEL[t.name] });
  // Bytes und Datum müssen die JSON-Kodierung überstehen
  await db.paragraphs.put({ hash: 'bytes', text: 'x', roh: new Uint8Array([1, 2, 255]), am: new Date('2026-10-01T10:00:00Z') } as never);
  return db;
}
const ohneId = (rows: Record<string, unknown>[]) => rows.map(({ id: _id, ...r }) => r);
async function inhalt(db: LernstoffDB, auto: boolean) {
  const out: Record<string, unknown[]> = {};
  for (const t of db.tables) {
    const rows = (await t.toArray()) as Record<string, unknown>[];
    out[t.name] = auto && t.schema.primKey.auto ? ohneId(rows) : rows;
  }
  return out;
}

describe('Sicherung: Rundlauf über alle Tabellen', () => {
  it('jede Tabelle hat eine Beispielzeile', async () => {
    const db = new LernstoffDB('rundlauf-tabellen');
    expect(db.tables.map((t) => t.name).filter((t) => !BEISPIEL[t])).toEqual([]);
  });

  it('ersetzen: das Zielgerät hat danach exakt denselben Inhalt', async () => {
    const a = await gefuellt();
    const text = JSON.stringify(await erstelleSicherung(a));
    const b = new LernstoffDB(`rundlauf-${++n}`);
    await b.subjects.add({ id: 'alt', name: 'verschwindet' });
    await spieleEin(lesePruefe(text, b).sicherung, 'ersetzen', b);
    expect(await inhalt(b, false)).toEqual(await inhalt(a, false));
    const roh = (await b.paragraphs.get('bytes')) as unknown as { roh: Uint8Array; am: Date };
    expect(roh.roh).toBeInstanceOf(Uint8Array);
    expect([...roh.roh]).toEqual([1, 2, 255]);
    expect(roh.am).toBeInstanceOf(Date);
  });

  it('zusammenführen ist wiederholbar: zweimal einspielen ändert nichts mehr', async () => {
    const a = await gefuellt();
    const s = lesePruefe(JSON.stringify(await erstelleSicherung(a)), a).sicherung;
    const b = new LernstoffDB(`rundlauf-${++n}`);
    const erst = await spieleEin(s, 'zusammenfuehren', b);
    expect(erst.neu).toBeGreaterThan(0);
    const vorher = await inhalt(b, true);
    expect(await spieleEin(s, 'zusammenfuehren', b)).toMatchObject({ neu: 0, aktualisiert: 0 });
    expect(await inhalt(b, true)).toEqual(vorher);
    expect(vorher).toEqual(await inhalt(a, true));
  });

  it('in sich selbst einspielen ändert nichts', async () => {
    const a = await gefuellt();
    const vorher = await inhalt(a, false);
    const s = lesePruefe(JSON.stringify(await erstelleSicherung(a)), a).sicherung;
    expect(await spieleEin(s, 'zusammenfuehren', a)).toMatchObject({ neu: 0, aktualisiert: 0 });
    expect(await inhalt(a, false)).toEqual(vorher);
  });
});
