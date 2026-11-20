import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { LernstoffDB } from './db';
import { Geraetestand, UMGEZOGEN } from './geraetestand';

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
(globalThis as { localStorage?: unknown }).localStorage = new Speicher();

let n = 0;
const neueDb = () => new LernstoffDB(`geraetestand-${++n}`);

describe('Gerätestand (DB v8, Audit C-3/C-4)', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('ohne Start bleibt alles im localStorage', () => {
    const g = new Geraetestand(neueDb());
    g.setItem('lernstoff.mindmaps', '[1]');
    expect(localStorage.getItem('lernstoff.mindmaps')).toBe('[1]');
    expect(g.getItem('lernstoff.mindmaps')).toBe('[1]');
  });

  it('zieht beim Start um, entfernt erst danach aus dem localStorage und lässt andere Schlüssel liegen', async () => {
    const database = neueDb();
    localStorage.setItem('lernstoff.mindmaps', '[{"id":"a"}]');
    localStorage.setItem('lernstoff.lehrer.klassen', '[{"id":"k"}]');
    localStorage.setItem('lernstoff.shell', '{"x":1}');
    const g = new Geraetestand(database);
    await g.starte();
    expect(localStorage.getItem('lernstoff.mindmaps')).toBeNull();
    expect(localStorage.getItem('lernstoff.lehrer.klassen')).toBeNull();
    expect(localStorage.getItem('lernstoff.shell')).toBe('{"x":1}');
    expect(g.getItem('lernstoff.mindmaps')).toBe('[{"id":"a"}]');
    expect((await database.geraetestand.get('lernstoff.lehrer.klassen'))?.wert).toBe('[{"id":"k"}]');
    expect(g.schluessel().sort()).toEqual(['lernstoff.lehrer.klassen', 'lernstoff.mindmaps', 'lernstoff.shell']);
  });

  it('schreibt im Hintergrund in die Datenbank, ein neuer Start liest es wieder', async () => {
    const database = neueDb();
    const g = new Geraetestand(database);
    await g.starte();
    g.setItem('lernstoff.tagebuch', '[{"id":"t1"}]');
    g.setItem('lernstoff.mindmaps', '[]');
    g.removeItem('lernstoff.mindmaps');
    await g.gespeichert();
    expect(localStorage.getItem('lernstoff.tagebuch')).toBeNull();
    const g2 = new Geraetestand(database);
    await g2.starte();
    expect(g2.getItem('lernstoff.tagebuch')).toBe('[{"id":"t1"}]');
    expect(g2.getItem('lernstoff.mindmaps')).toBeNull();
  });

  it('führt zusammen, wenn nach dem Umzug noch etwas im localStorage landet (altes Fenster): nichts geht verloren', async () => {
    const database = neueDb();
    const g = new Geraetestand(database);
    await g.starte();
    g.setItem('lernstoff.tagebuch', JSON.stringify([{ id: 'a', at: '2026-11-01' }]));
    await g.gespeichert();
    localStorage.setItem('lernstoff.tagebuch', JSON.stringify([{ id: 'b', at: '2026-11-02' }]));
    const g2 = new Geraetestand(database);
    await g2.starte();
    const ids = (JSON.parse(g2.getItem('lernstoff.tagebuch')!) as Array<{ id: string }>).map((x) => x.id).sort();
    expect(ids).toEqual(['a', 'b']);
    expect(localStorage.getItem('lernstoff.tagebuch')).toBeNull();
  });

  it('meldet Änderungen aus einem anderen Fenster und übernimmt sie in den Zwischenspeicher', async () => {
    const database = neueDb();
    const a = new Geraetestand(database), b = new Geraetestand(database);
    await a.starte(); await b.starte();
    const gesehen = new Promise<string>((r) => b.beiFremderAenderung(r));
    a.setItem('lernstoff.mindmaps', '[{"id":"x"}]');
    expect(await gesehen).toBe('lernstoff.mindmaps');
    expect(b.getItem('lernstoff.mindmaps')).toBe('[{"id":"x"}]');
  });

  it('kein Modul greift für umgezogene Lernstände am Gerätestand vorbei direkt auf localStorage zu', () => {
    const dateien: string[] = [];
    const gehe = (d: string) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) gehe(p); else if (/\.tsx?$/.test(f) && !/\.test\./.test(f)) dateien.push(p); } };
    gehe('src');
    const verstoesse = dateien.filter((p) => {
      if (p.endsWith('geraetestand.ts')) return false;
      const text = readFileSync(p, 'utf8');
      return [...UMGEZOGEN].some((k) => text.includes(`'${k}'`)) && /localStorage\.(getItem|setItem|removeItem)\(/.test(text.replace(/\/\/.*$/gm, ''));
    });
    // sicherung.ts liest nur den eigenen Merker direkt (nicht umgezogen).
    expect(verstoesse.filter((p) => !p.endsWith('sicherung.ts'))).toEqual([]);
  });
});
