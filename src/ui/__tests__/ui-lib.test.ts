import { describe, expect, it } from 'vitest';
import { Trie, normalize } from '../lib/trie';
import { virtualWindow } from '../lib/virtual';
import { addDays, dayKey, eachDay, relativeTime } from '../lib/time';
import { createStore } from '../lib/store';
import { multiSort, toggleSort } from '../table/sort';
import { toCsv } from '../widget/export';
import { enqueue, type Toast } from '../shell/notifications';
import { isActive } from '../shell/router';
import { NAV, flatNav, visibleNav } from '../shell/nav';

describe('Präfixsuche', () => {
  const trie = new Trie([
    { label: 'Dekubitusprophylaxe' }, { label: 'Pflegeprozess nach Fiechter/Meier' }, { label: 'Herz und Blutkreislauf' },
    { label: 'Sturzprophylaxe' }, { label: 'Übergabe', keywords: ['SBAR'] },
  ]);
  it('findet Wortanfänge, Wortteile in Komposita und mehrere Suchwörter', () => {
    expect(trie.search('prophyl').map((x) => x.label)).toEqual(['Sturzprophylaxe', 'Dekubitusprophylaxe']);
    expect(trie.search('dek pro').map((x) => x.label)).toEqual(['Dekubitusprophylaxe']);
    expect(trie.search('sturz')[0]?.label).toBe('Sturzprophylaxe');
    expect(trie.search('pfl pro').map((x) => x.label)).toEqual(['Pflegeprozess nach Fiechter/Meier']);
    expect(trie.search('blut herz')).toHaveLength(1);
  });
  it('ignoriert Umlaute und Groß-/Kleinschreibung, nutzt Schlagwörter', () => {
    expect(trie.search('uebergabe')).toHaveLength(1);
    expect(trie.search('sbar')[0]?.label).toBe('Übergabe');
    expect(normalize('Größe')).toBe('groesse');
  });
  it('liefert nichts für leere Eingabe oder fehlende Treffer', () => {
    expect(trie.search('  ')).toEqual([]);
    expect(trie.search('xyz')).toEqual([]);
  });
});

describe('virtuelles Scrollen', () => {
  it('berechnet nur das sichtbare Fenster plus Überhang', () => {
    const w = virtualWindow(10_000, 44, 44 * 500, 440, 8);
    expect(w.start).toBe(492);
    expect(w.end).toBe(518);
    expect(w.offsetTop).toBe(492 * 44);
    expect(w.totalHeight).toBe(440_000);
  });
  it('bleibt am Anfang und Ende in den Grenzen', () => {
    expect(virtualWindow(5, 44, -100, 440).start).toBe(0);
    expect(virtualWindow(5, 44, 0, 440).end).toBe(5);
    expect(virtualWindow(0, 44, 0, 440).totalHeight).toBe(0);
  });
});

describe('Zeit', () => {
  it('ordnet Zeitpunkte dem Kalendertag der Zeitzone zu', () => {
    expect(dayKey('2026-10-23T22:30:00Z', 'Europe/Berlin')).toBe('2026-10-24');
    expect(dayKey('2026-10-23T22:30:00Z', 'UTC')).toBe('2026-10-23');
    expect(dayKey('2026-10-24T03:00:00Z', 'America/New_York')).toBe('2026-10-23');
  });
  it('rechnet mit Tagen und Zeitumstellung', () => {
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26');
    expect(eachDay('2026-10-24', '2026-10-27')).toHaveLength(4);
  });
  it('formuliert relative Zeit', () => {
    const now = Date.parse('2026-10-23T12:00:00Z');
    expect(relativeTime(now - 10_000, now)).toBe('gerade eben');
    expect(relativeTime(now - 120_000, now)).toBe('vor 2 Min.');
    expect(relativeTime(now - 3 * 3600_000, now)).toBe('vor 3 Std.');
    expect(relativeTime(now - 2 * 86400_000, now)).toBe('vor 2 Tagen');
  });
});

describe('Zustandsspeicher', () => {
  it('benachrichtigt nur bei Änderungen', () => {
    const s = createStore({ a: 1, b: 2 });
    let calls = 0;
    s.subscribe(() => calls++);
    s.set({ a: 3 });
    s.set((p) => p);
    expect(calls).toBe(1);
    expect(s.get()).toEqual({ a: 3, b: 2 });
  });
});

describe('Mehrfachsortierung', () => {
  const rows = [{ f: 'KL', d: 3, n: 'b' }, { f: 'AP', d: 3, n: 'a' }, { f: 'KL', d: 1, n: 'c' }, { f: 'AP', d: undefined, n: 'd' }];
  it('sortiert nach Priorität der Spalten und stellt Leere ans Ende', () => {
    const out = multiSort(rows, [{ key: 'f', dir: 'asc' }, { key: 'd', dir: 'desc' }], (r, k) => r[k as keyof typeof r]);
    expect(out.map((r) => r.n)).toEqual(['a', 'd', 'b', 'c']);
  });
  it('schaltet auf, ab, aus', () => {
    let s = toggleSort([], 'f');
    expect(s).toEqual([{ key: 'f', dir: 'asc' }]);
    s = toggleSort(toggleSort(s, 'd'), 'f');
    expect(s).toEqual([{ key: 'f', dir: 'desc' }, { key: 'd', dir: 'asc' }]);
    expect(toggleSort(s, 'f')).toEqual([{ key: 'd', dir: 'asc' }]);
  });
});

describe('Export', () => {
  it('erzeugt CSV mit Semikolon und Maskierung', () => {
    expect(toCsv([{ a: 'x;y', b: 'say "hi"' }, { a: 1, c: true }])).toBe('a;b;c\r\n"x;y";"say ""hi""";\r\n1;;true');
  });
});

describe('Mitteilungen', () => {
  it('ordnet die Warteschlange nach Priorität', () => {
    const t = (id: number, severity: Toast['severity'], at: number): Toast => ({ id, severity, at, title: '' });
    let q: Toast[] = [];
    q = enqueue(q, t(1, 'info', 1));
    q = enqueue(q, t(2, 'critical', 2));
    q = enqueue(q, t(3, 'warning', 3));
    q = enqueue(q, t(4, 'critical', 4));
    expect(q.map((x) => x.id)).toEqual([2, 4, 3, 1]);
  });
});

describe('Navigation', () => {
  it('erkennt aktive Pfade und Elternpfade', () => {
    expect(isActive('/', '/')).toBe(true);
    expect(isActive('/', '/lernen')).toBe(false);
    expect(isActive('/lernen/themen', '/lernen/themen')).toBe(true);
    expect(isActive('/lernen', '/lernen/themen')).toBe(true);
    expect(isActive('/lernen/the', '/lernen/themen')).toBe(false);
  });
  it('blendet Einträge nach Rolle aus', () => {
    const items = [{ id: 'a', label: 'A', path: '/a' }, { id: 'b', label: 'B', path: '/b', roles: ['admin' as const] }];
    expect(visibleNav(items, ['lernende']).map((i) => i.id)).toEqual(['a']);
    expect(flatNav(visibleNav(NAV, ['lernende'])).every((i) => i.path)).toBe(true);
  });
});
