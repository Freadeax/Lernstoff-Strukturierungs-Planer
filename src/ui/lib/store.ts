import { useSyncExternalStore } from 'react';

/**
 * Minimaler Zustandsspeicher mit Selektoren. Eine Komponente rendert nur neu, wenn sich
 * der von ihr gewählte Ausschnitt ändert (Zustandstrennung zwischen Modulen).
 */
export interface Store<T> {
  get(): T;
  set(next: Partial<T> | ((prev: T) => T)): void;
  subscribe(listener: () => void): () => void;
}

export function createStore<T extends object>(initial: T, onChange?: (state: T) => void): Store<T> {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set(next) {
      const value = typeof next === 'function' ? next(state) : { ...state, ...next };
      if (value === state) return;
      state = value;
      onChange?.(state);
      listeners.forEach((l) => l());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/** Selektor muss einen stabilen Wert liefern (Primitiv oder unveränderte Referenz). */
export function useStore<T, S>(store: Store<T>, selector: (state: T) => S): S {
  return useSyncExternalStore(store.subscribe, () => selector(store.get()), () => selector(store.get()));
}

/** Gleiche Grundform wie der Ersatzwert: Liste zu Liste, Objekt zu Objekt, Text zu Text. */
export function gleicheForm(wert: unknown, ersatz: unknown): boolean {
  if (ersatz === null || ersatz === undefined) return true;
  if (Array.isArray(ersatz)) return Array.isArray(wert);
  if (typeof ersatz === 'object') return typeof wert === 'object' && wert !== null && !Array.isArray(wert);
  return typeof wert === typeof ersatz;
}

/** Ein Objekt (keine Liste, nicht null). Für Prüfungen gespeicherter Stände. */
export const istObjekt = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

type Bereich = 'local' | 'session';
const bereich = (area: Bereich) => (area === 'local' ? localStorage : sessionStorage);

/**
 * localStorage mit Schutz für privaten Modus, vollen Speicher und kaputte oder veraltete Einträge.
 * Ein gespeicherter Wert, der nicht zur Form des Ersatzwerts (oder zur Prüfung `gueltig`) passt,
 * wird wie ein fehlender Eintrag behandelt. So kann ein alter Speicherstand eine Seite nicht abstürzen lassen.
 */
export const storage = {
  read<T>(key: string, fallback: T, area: Bereich = 'local', gueltig?: (v: unknown) => boolean): T {
    try {
      const raw = bereich(area).getItem(key);
      if (raw === null) return fallback;
      const wert: unknown = JSON.parse(raw);
      if (wert === null || !gleicheForm(wert, fallback) || (gueltig && !gueltig(wert))) return fallback;
      return wert as T;
    } catch { return fallback; }
  },
  /** Liste lesen, unbrauchbare Einträge fallen weg. */
  list<T>(key: string, gueltig: (v: unknown) => boolean = istObjekt, area: Bereich = 'local'): T[] {
    return storage.read<unknown[]>(key, [], area).filter(gueltig) as T[];
  },
  /** Schreibt den Wert; `null` entfernt den Eintrag. Gibt zurück, ob es geklappt hat. */
  write(key: string, value: unknown, area: Bereich = 'local'): boolean {
    try {
      if (value === null) bereich(area).removeItem(key);
      else bereich(area).setItem(key, JSON.stringify(value));
      return true;
    } catch { return false; /* privater Modus oder voller Speicher: ohne Speicher weiter */ }
  },
  remove(key: string, area: Bereich = 'local') {
    try { bereich(area).removeItem(key); } catch { /* ohne Speicher weiter */ }
  },
};
