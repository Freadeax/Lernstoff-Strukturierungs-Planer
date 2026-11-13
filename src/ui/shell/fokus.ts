import { createStore } from '../lib/store';

// Fokus-Modus: blendet Menü, Kopf- und Handy-Leiste aus, damit nur der Lernblock oder Test bleibt.
// Vorbilder: Lesemodus in Notion/iA Writer (nur Text), Lernzeit-Timer wie bei Pomodoro-Apps (25 + 5 Minuten).
// Der Zustand bleibt bewusst nur im Speicher: Nach einem Neustart ist die App wieder vollständig da.

export interface FokusZustand {
  an: boolean;
  /** Ende der laufenden Lernzeit (ms seit 1970), wenn der Timer läuft. */
  ende?: number;
  /** Restzeit in ms, wenn pausiert. */
  rest?: number;
  /** Gewählte Länge in Minuten. */
  minuten: number;
  /** 'lernen' oder 'pause' (nach Ablauf schlägt die App eine kurze Pause vor). */
  phase: 'lernen' | 'pause';
}

export const FOKUS_MINUTEN = [15, 25, 45] as const;
export const PAUSE_MINUTEN = 5;

export const fokus = createStore<FokusZustand>({ an: false, minuten: 25, phase: 'lernen' });

export function setzeFokus(an: boolean) {
  fokus.set({ an });
  if (typeof document !== 'undefined') {
    if (an) document.documentElement.setAttribute('data-fokus', '');
    else document.documentElement.removeAttribute('data-fokus');
  }
}

export const schalteFokus = () => setzeFokus(!fokus.get().an);

/** Restzeit in ms (0 = abgelaufen, undefined = kein Timer). */
export function restzeit(z: Pick<FokusZustand, 'ende' | 'rest'>, jetzt = Date.now()): number | undefined {
  if (z.rest !== undefined) return z.rest;
  if (z.ende === undefined) return undefined;
  return Math.max(0, z.ende - jetzt);
}

export function starteTimer(minuten = fokus.get().minuten, phase: FokusZustand['phase'] = 'lernen', jetzt = Date.now()) {
  fokus.set({ ende: jetzt + minuten * 60_000, rest: undefined, phase, ...(phase === 'lernen' ? { minuten } : {}) });
}

export function pausiereTimer(jetzt = Date.now()) {
  const z = fokus.get();
  if (z.ende === undefined || z.rest !== undefined) return;
  fokus.set({ rest: Math.max(0, z.ende - jetzt), ende: undefined });
}

export function setzeFort(jetzt = Date.now()) {
  const z = fokus.get();
  if (z.rest === undefined) return;
  fokus.set({ ende: jetzt + z.rest, rest: undefined });
}

export const stoppeTimer = () => fokus.set({ ende: undefined, rest: undefined, phase: 'lernen' });

/** „12:05“ */
export function uhr(ms: number): string {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
