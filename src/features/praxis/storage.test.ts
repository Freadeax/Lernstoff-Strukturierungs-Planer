import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { SCENARIOS } from './catalog';
import { dispatch, replay, start } from './engine';
import { archive, CURRENT, readArchive, readSession, saveSession } from './storage';

let data: Map<string, string>;
beforeEach(() => {
  data = new Map();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
    removeItem: (key: string) => data.delete(key),
  });
});
afterEach(() => vi.unstubAllGlobals());
it('erhält Patient, Befunde, Zeit, Aufträge und Journal bei Wiederaufnahme', () => {
  let s = start(SCENARIOS[2]); s = dispatch(s, { type: 'action', id: 'vitals' });
  s = dispatch(s, { type: 'action', id: 'help' }); s = dispatch(s, { type: 'action', id: 'orders' });
  expect(saveSession(s)).toBe(''); const loaded = readSession(); expect(loaded.error).toBe(''); expect(loaded.session).toEqual(s);
  expect(replay(loaded.session!)).toEqual(s);
});
it('erhält unlesbare Daten für manuelle Datensicherung', () => {
  data.set(CURRENT, '{defekt'); expect(readSession().session).toBeNull(); expect(readSession().error).toContain('nicht gelesen'); expect(data.get(CURRENT)).toBe('{defekt');
});
it('meldet Speicherfehler und begrenzt das Abschlussarchiv', () => {
  for (let i = 0; i < 12; i++) expect(archive(dispatch(start(SCENARIOS[0]), { type: 'finish' }))).toBe('');
  expect(readArchive()).toHaveLength(10);
  vi.stubGlobal('localStorage', { setItem: () => { throw new Error('quota'); } });
  expect(saveSession(start(SCENARIOS[0]))).toContain('nicht möglich');
});
