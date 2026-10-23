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

/** localStorage mit Schutz für privaten Modus und fehlenden Speicher. */
export const storage = {
  read<T>(key: string, fallback: T, area: 'local' | 'session' = 'local'): T {
    try {
      const raw = (area === 'local' ? localStorage : sessionStorage).getItem(key);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch { return fallback; }
  },
  write(key: string, value: unknown, area: 'local' | 'session' = 'local') {
    try { (area === 'local' ? localStorage : sessionStorage).setItem(key, JSON.stringify(value)); } catch { /* ohne Speicher weiter */ }
  },
  remove(key: string, area: 'local' | 'session' = 'local') {
    try { (area === 'local' ? localStorage : sessionStorage).removeItem(key); } catch { /* ohne Speicher weiter */ }
  },
};
