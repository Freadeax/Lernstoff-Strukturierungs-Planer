import { useEffect, useState } from 'react';
import { liveQuery } from 'dexie';
import type { SyncBadge, WidgetState } from './types';

export interface WidgetDataOptions<T> {
  /** Lädt die Daten. Bei `live` werden alle darin gelesenen Dexie-Tabellen beobachtet. */
  load: () => Promise<T> | T;
  deps: unknown[];
  live?: boolean;
  isEmpty?: (data: T) => boolean;
  /** Liefert einen Grund, wenn nur wenige Datensätze vorliegen. */
  isPartial?: (data: T) => string | false;
}

export interface WidgetData<T> {
  state: WidgetState<T>;
  retry: () => void;
  lastSynced?: Date;
  badge: SyncBadge;
}

export const toError = (e: unknown) => (e instanceof Error ? e : new Error(String(e)));

/** Zustandsautomat eines Widgets: loading → ideal | partial | empty | error, mit lokalem Retry. */
export function useWidgetData<T>({ load, deps, live = true, isEmpty, isPartial }: WidgetDataOptions<T>): WidgetData<T> {
  const [nonce, setNonce] = useState(0);
  const [result, setResult] = useState<{ data?: T; error?: Error; at?: Date; pending: boolean }>({ pending: true });

  useEffect(() => {
    let active = true;
    setResult((r) => ({ ...r, pending: true }));
    const ok = (data: T) => { if (active) setResult({ data, at: new Date(), pending: false }); };
    const fail = (e: unknown) => { if (active) setResult((r) => ({ ...r, error: toError(e), pending: false })); };
    if (live) {
      const sub = liveQuery(() => load()).subscribe({ next: ok, error: fail });
      return () => { active = false; sub.unsubscribe(); };
    }
    Promise.resolve().then(load).then(ok, fail);
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce, ...deps]);

  const retry = () => { setResult({ pending: true }); setNonce((n) => n + 1); };

  let state: WidgetState<T>;
  if (result.error && result.data === undefined) state = { status: 'error', error: result.error };
  else if (result.data === undefined) state = { status: 'loading' };
  else if (isEmpty?.(result.data)) state = { status: 'empty' };
  else {
    const reason = isPartial?.(result.data);
    state = reason ? { status: 'partial', data: result.data, reason } : { status: 'ideal', data: result.data };
  }
  const badge: SyncBadge = result.error ? 'stalled' : result.pending ? 'syncing' : 'live';
  return { state, retry, lastSynced: result.at, badge };
}
