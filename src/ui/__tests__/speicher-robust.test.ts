// Alte oder kaputte Speicherstände dürfen keine Seite abstürzen lassen. Diese Tests legen
// absichtlich falsche Formen in localStorage und prüfen, dass jedes Modul auf „leer“ zurückfällt.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { gleicheForm, storage } from '../lib/store';
import { istLadefehler } from '../shell/PageBoundary';
import { ladeAktuell, ladeArchiv } from '../../features/fall/simulator';
import { ladeEinstellungen, ladeLauf, ladeVerlauf } from '../../features/simulation/speicher';
import { abgabenZu, alleAbgaben, arbeitZu, eigeneFaelle, erhalteneFaelle, meinName } from '../../features/klasse/speicher';
import { ladeStatistik } from '../../features/rechnen/statistik';

let data: Map<string, string>;
beforeEach(() => {
  data = new Map();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value); },
    removeItem: (key: string) => { data.delete(key); },
  });
});
afterEach(() => vi.unstubAllGlobals());

const KAPUTT = ['{}', '[]', '"x"', '5', 'null', '{defekt', '[{"x":1}]', '{"a":{"b":1}}'];

describe('storage', () => {
  it('liest nur Werte mit der Form des Ersatzwerts', () => {
    data.set('l', '{"a":1}'); expect(storage.read('l', [])).toEqual([]);
    data.set('o', '[1,2]'); expect(storage.read('o', {})).toEqual({});
    data.set('s', '5'); expect(storage.read('s', '')).toBe('');
    data.set('n', 'null'); expect(storage.read('n', { a: 1 })).toEqual({ a: 1 });
    data.set('ok', '{"a":2}'); expect(storage.read('ok', { a: 1 })).toEqual({ a: 2 });
    expect(storage.read('fehlt', 7)).toBe(7);
  });
  it('wendet eine zusätzliche Prüfung an', () => {
    data.set('k', '{"a":1}');
    expect(storage.read<{ a: number } | null>('k', null, 'local', (v) => (v as { a: unknown }).a === 2)).toBeNull();
  });
  it('filtert Listen auf brauchbare Einträge', () => {
    data.set('k', '[{"a":1}, 3, null, "x", {"b":2}]');
    expect(storage.list('k')).toEqual([{ a: 1 }, { b: 2 }]);
  });
  it('schreiben meldet Erfolg, null entfernt, voller Speicher wirft nicht', () => {
    expect(storage.write('k', { a: 1 })).toBe(true);
    expect(storage.write('k', null)).toBe(true);
    expect(data.has('k')).toBe(false);
    vi.stubGlobal('localStorage', { setItem: () => { throw new Error('quota'); } });
    expect(storage.write('k', 1)).toBe(false);
  });
  it('ohne localStorage (privater Modus) gilt der Ersatzwert', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(storage.read('k', [1])).toEqual([1]);
    expect(storage.write('k', 1)).toBe(false);
  });
  it('gleicheForm', () => {
    expect(gleicheForm([], [])).toBe(true);
    expect(gleicheForm({}, [])).toBe(false);
    expect(gleicheForm([], {})).toBe(false);
    expect(gleicheForm('x', null)).toBe(true);
  });
});

describe('Module überstehen kaputte Speicherstände', () => {
  it.each(KAPUTT)('Wert %s', (wert) => {
    for (const k of ['lernstoff.fall.aktuell', 'lernstoff.fall.archiv', 'lernstoff.simulation.laufend', 'lernstoff.simulation.verlauf',
      'lernstoff.simulation.einstellungen', 'lernstoff.klasse.eigene', 'lernstoff.klasse.erhalten', 'lernstoff.klasse.abgaben',
      'lernstoff.klasse.arbeit', 'lernstoff.klasse.name', 'lernstoff.rechnen.statistik']) data.set(k, wert);
    expect(ladeAktuell()).toBeNull();
    expect(ladeArchiv()).toEqual([]);
    expect(ladeLauf()).toBeNull();
    expect(ladeVerlauf()).toEqual([]);
    expect(ladeEinstellungen({ minuten: 30 } as never)).toMatchObject({ minuten: 30 });
    expect(eigeneFaelle()).toEqual([]);
    expect(erhalteneFaelle()).toEqual([]);
    expect(abgabenZu('f')).toEqual([]);
    expect(typeof alleAbgaben()).toBe('object');
    expect(arbeitZu('f')).toEqual({ antworten: {} });
    expect(typeof meinName()).toBe('string');
    expect(typeof ladeStatistik()).toBe('object');
  });

  it('Klassenmodus: kaputte Einträge fallen weg, gültige bleiben', () => {
    data.set('lernstoff.klasse.abgaben', JSON.stringify({
      f: [{ v: 1, fallId: 'f', titel: 't', name: 'A', antworten: {}, abgegeben: '2026-10-24' }, { name: 3 }, 'x'],
      g: 'kaputt',
    }));
    expect(abgabenZu('f').map((a) => a.name)).toEqual(['A']);
    expect(abgabenZu('g')).toEqual([]);
  });
});

it('erkennt Ladefehler nach einer neuen Veröffentlichung', () => {
  expect(istLadefehler(new TypeError('Failed to fetch dynamically imported module: https://x/assets/a.js'))).toBe(true);
  expect(istLadefehler(new TypeError('Importing a module script failed.'))).toBe(true);
  expect(istLadefehler(new TypeError('error loading dynamically imported module'))).toBe(true);
  expect(istLadefehler(new TypeError("Cannot read properties of undefined (reading 'length')"))).toBe(false);
});
