import { createStore, istObjekt, storage } from '../lib/store';

// Favoriten und zuletzt genutzte Seiten. Bei rund 45 Menüpunkten kürzt das die Wege:
// Favoriten stehen oben im Menü, „Zuletzt“ auf „Heute“ und in der leeren Suche.

export interface Merkliste { favoriten: string[]; zuletzt: string[] }

const KEY = 'lernstoff.merkliste';
export const MAX_FAVORITEN = 8;
export const MAX_ZULETZT = 6;

const pfade = (v: unknown, max: number): string[] =>
  Array.isArray(v) ? [...new Set(v.filter((p): p is string => typeof p === 'string' && p.startsWith('/') && p !== '/'))].slice(0, max) : [];

/** Gespeicherten Stand prüfen: nur Pfade, keine Dubletten, begrenzte Länge. */
export function bereinigt(v: unknown): Merkliste {
  const o = istObjekt(v) ? v : {};
  return { favoriten: pfade(o.favoriten, MAX_FAVORITEN), zuletzt: pfade(o.zuletzt, MAX_ZULETZT) };
}

/** Favorit setzen oder lösen. Ist die Liste voll, fällt der älteste Favorit heraus. */
export function mitFavorit(m: Merkliste, path: string): Merkliste {
  if (path === '/') return m;
  const favoriten = m.favoriten.includes(path) ? m.favoriten.filter((p) => p !== path) : [...m.favoriten, path].slice(-MAX_FAVORITEN);
  return { ...m, favoriten };
}

/** Besuch vermerken: neueste Seite zuerst, „Heute“ zählt nicht. */
export function mitBesuch(m: Merkliste, path: string): Merkliste {
  if (path === '/' || m.zuletzt[0] === path) return m;
  return { ...m, zuletzt: [path, ...m.zuletzt.filter((p) => p !== path)].slice(0, MAX_ZULETZT) };
}

export const merkliste = createStore<Merkliste>(bereinigt(storage.read<unknown>(KEY, {})), (m) => { storage.write(KEY, m); });

export const toggleFavorit = (path: string) => merkliste.set((m) => mitFavorit(m, path));
export const besucht = (path: string) => merkliste.set((m) => mitBesuch(m, path));
