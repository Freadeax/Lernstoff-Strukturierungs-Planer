import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { LernstoffDB } from './db';
import { brauchtErinnerung } from '../features/sicherung/erinnerung';
import { dekodiere, erstelleSicherung, fuehreWertZusammen, kodiere, lesePruefe, spieleEin } from './sicherung';

// Node hat kein localStorage: einfacher Ersatz im Speicher.
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

let n = 0;
const neueDb = () => new LernstoffDB(`sicherung-${++n}`);

beforeEach(() => ls.clear());

describe('Datensicherung', () => {
  it('sichert Tabellen und Trainer-Einträge, aber keine Geheimnisse', async () => {
    const db = neueDb();
    await db.subjects.add({ id: 's1', name: 'Recht' });
    await db.reviewLogs.add({ topicId: 't1', date: '2026-10-20', source: 'karteikarten', scorePercent: 80, at: '2026-10-20T10:00:00Z' } as never);
    ls.setItem('lernstoff.mindmaps', JSON.stringify([{ id: 'm1', geaendert: '2026-10-20' }]));
    ls.setItem('lernstoff.apiKey', 'sk-ant-geheim');
    ls.setItem('lernstoff.ablage', '{"token":"ghp_x"}');
    ls.setItem('anderes', 'x');
    const s = await erstelleSicherung(db);
    expect(s.data.subjects).toHaveLength(1);
    expect(Object.keys(s.local!)).toEqual(['lernstoff.mindmaps']);
    expect(JSON.stringify(s)).not.toContain('sk-ant');
    const { uebersicht } = lesePruefe(JSON.stringify(s), db);
    expect(uebersicht.zeilen).toContainEqual({ label: 'Mindmaps', anzahl: 1 });
    expect(uebersicht.zeilen).toContainEqual({ label: 'Abfrageergebnisse im Lernplan', anzahl: 1 });
  });

  it('überträgt auf ein leeres Gerät (ersetzen)', async () => {
    const a = neueDb();
    await a.board.put({ topicId: 't1', column: 'arbeit', order: 1, updatedAt: '2026-10-20T10:00:00Z' });
    await a.studyLogs.add({ topicId: 't1', date: '2026-10-20', minutes: 30, at: '2026-10-20T10:00:00Z' } as never);
    ls.setItem('lernstoff.fall.archiv', '[{"id":"f1","begonnen":"2026-10-20"}]');
    const text = JSON.stringify(await erstelleSicherung(a));
    ls.clear();
    ls.setItem('lernstoff.sis.beste', '{"x":1}');
    const b = neueDb();
    await b.subjects.add({ id: 'alt', name: 'Weg' });
    await spieleEin(lesePruefe(text, b).sicherung, 'ersetzen', b);
    expect(await b.subjects.count()).toBe(0);
    expect(await b.board.get('t1')).toMatchObject({ column: 'arbeit' });
    expect(await b.studyLogs.count()).toBe(1);
    expect(ls.getItem('lernstoff.fall.archiv')).toContain('f1');
    expect(ls.getItem('lernstoff.sis.beste')).toBeNull();
  });

  it('führt zwei Geräte zusammen ohne Dubletten, neuerer Stand gewinnt', async () => {
    const iphone = neueDb();
    await iphone.board.put({ topicId: 't1', column: 'erarbeitet', order: 1, updatedAt: '2026-10-22T10:00:00Z' });
    await iphone.board.put({ topicId: 't2', column: 'woche', order: 2, updatedAt: '2026-10-19T10:00:00Z' });
    await iphone.reviewLogs.add({ topicId: 't1', date: '2026-10-22', source: 'trainer', scorePercent: 90, at: '2026-10-22T10:00:00Z' } as never);
    await iphone.reviewLogs.add({ topicId: 't2', date: '2026-10-21', source: 'trainer', scorePercent: 70, at: '2026-10-21T10:00:00Z' } as never);
    ls.setItem('lernstoff.mindmaps', JSON.stringify([{ id: 'm1', geaendert: '2026-10-22', t: 'neu' }]));
    ls.setItem('lernstoff.uebergabe.beste', '{"a":80}');
    const sicherung = lesePruefe(JSON.stringify(await erstelleSicherung(iphone)), iphone).sicherung;

    ls.clear();
    const ipad = neueDb();
    await ipad.board.put({ topicId: 't1', column: 'arbeit', order: 1, updatedAt: '2026-10-20T10:00:00Z' });
    await ipad.board.put({ topicId: 't2', column: 'arbeit', order: 2, updatedAt: '2026-10-23T10:00:00Z' });
    // dieselbe Abfrage wie auf dem iPhone (doppelt eingespielt) und eine eigene
    await ipad.reviewLogs.add({ topicId: 't2', date: '2026-10-21', source: 'trainer', scorePercent: 70, at: '2026-10-21T10:00:00Z' } as never);
    await ipad.reviewLogs.add({ topicId: 't3', date: '2026-10-23', source: 'karteikarten', scorePercent: 60, at: '2026-10-23T10:00:00Z' } as never);
    ls.setItem('lernstoff.mindmaps', JSON.stringify([{ id: 'm1', geaendert: '2026-10-20', t: 'alt' }, { id: 'm2', geaendert: '2026-10-21' }]));
    ls.setItem('lernstoff.uebergabe.beste', '{"a":90,"b":50}');

    const e = await spieleEin(sicherung, 'zusammenfuehren', ipad);
    expect(e.neu).toBe(1);          // eine Abfrage vom iPhone fehlte
    expect(e.aktualisiert).toBe(1); // t1 auf dem iPhone neuer
    expect((await ipad.board.get('t1'))!.column).toBe('erarbeitet');
    expect((await ipad.board.get('t2'))!.column).toBe('arbeit');
    expect(await ipad.reviewLogs.count()).toBe(3);
    const maps = JSON.parse(ls.getItem('lernstoff.mindmaps')!) as { id: string; t?: string }[];
    expect(maps.map((m) => m.id).sort()).toEqual(['m1', 'm2']);
    expect(maps.find((m) => m.id === 'm1')!.t).toBe('neu');
    expect(JSON.parse(ls.getItem('lernstoff.uebergabe.beste')!)).toEqual({ a: 90, b: 50 });

    // zweimal einspielen ändert nichts mehr
    const nochmal = await spieleEin(sicherung, 'zusammenfuehren', ipad);
    expect(nochmal).toMatchObject({ neu: 0, aktualisiert: 0 });
  });

  it('lehnt fremde, beschädigte und zu neue Dateien verständlich ab', () => {
    const db = neueDb();
    expect(() => lesePruefe('kein json', db)).toThrow(/kein JSON/);
    expect(() => lesePruefe('{"app":"andere"}', db)).toThrow(/nicht aus dem Lernstoff-Planer/);
    expect(() => lesePruefe(JSON.stringify({ app: 'lernstoff-planer', schema: 99, data: {} }), db)).toThrow(/neueren App-Version/);
    expect(() => lesePruefe(JSON.stringify({ app: 'lernstoff-planer', schema: 1, data: { subjects: [1] } }), db)).toThrow(/beschädigt/);
    // alter Export aus „Alle Daten exportieren“ (ohne format und local) wird angenommen
    expect(lesePruefe(JSON.stringify({ app: 'lernstoff-planer', schema: 5, exportedAt: 'x', data: { subjects: [{ id: 's' }] } }), db).sicherung.data.subjects).toHaveLength(1);
  });

  it('bewahrt Bytes und Datum', () => {
    const v = { b: new Uint8Array([0, 1, 255]), d: new Date('2026-10-24T12:00:00Z') };
    const zurueck = dekodiere(JSON.parse(JSON.stringify(kodiere(v)))) as typeof v;
    expect([...zurueck.b]).toEqual([0, 1, 255]);
    expect(zurueck.d.toISOString()).toBe('2026-10-24T12:00:00.000Z');
  });

  it('führt einfache Werte vorsichtig zusammen', () => {
    expect(fuehreWertZusammen({ x: 1 }, { x: 3, y: 2 })).toEqual({ x: 3, y: 2 });
    expect(fuehreWertZusammen([1, 2], [2, 3])).toEqual([1, 2, 3]);
    expect(fuehreWertZusammen('lokal', 'fremd')).toBe('lokal');
    expect(fuehreWertZusammen(undefined, 'fremd')).toBe('fremd');
  });

  it('mischt laufende Sitzungen zweier Geräte nicht', () => {
    const hier = { id: 'a', time: 120, vitals: { pulse: 90 }, commands: [{ id: 'local:1' }] };
    const dort = { id: 'b', time: 900, vitals: { pulse: 130 }, commands: [{ id: 'local:1' }, { id: 'local:2' }] };
    expect(fuehreWertZusammen(hier, dort)).toBe(hier);
    // gleicher Durchlauf: der mit dem neueren Zeitstempel gewinnt als Ganzes, sonst bleibt der vorhandene
    const alt = { id: 'f', begonnen: '2026-10-27T08:00:00Z', schritt: 2 };
    const neu = { id: 'f', begonnen: '2026-10-27T09:00:00Z', schritt: 5 };
    expect(fuehreWertZusammen(alt, neu)).toBe(neu);
    expect(fuehreWertZusammen({ ...hier, id: 'b' }, dort)).toEqual({ ...hier, id: 'b' });
  });
});

describe('Erinnerung an die Sicherung', () => {
  const jetzt = Date.parse('2026-10-24T12:00:00Z');
  it('erinnert erst bei echtem Lernstand und höchstens wöchentlich', () => {
    expect(brauchtErinnerung({}, 2, jetzt)).toBe(false);
    expect(brauchtErinnerung({}, 10, jetzt)).toBe(true);
    expect(brauchtErinnerung({ zuletzt: '2026-10-20T12:00:00Z' }, 10, jetzt)).toBe(false);
    expect(brauchtErinnerung({ zuletzt: '2026-10-01T12:00:00Z', erinnertAm: '2026-10-23T12:00:00Z' }, 10, jetzt)).toBe(false);
    expect(brauchtErinnerung({ zuletzt: '2026-10-01T12:00:00Z', erinnertAm: '2026-10-10T12:00:00Z' }, 10, jetzt)).toBe(true);
  });
});
