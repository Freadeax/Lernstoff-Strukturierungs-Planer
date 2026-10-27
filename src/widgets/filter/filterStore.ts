import { createStore, istObjekt, storage } from '../../ui/lib/store';
import { addDays, dayKey, daysBetween, DEFAULT_TZ } from '../../ui/lib/time';

// Globale Filter (Zeitraum, Zeitzone, Fach). Module, die davon abhängen, abonnieren nur
// die Felder, die sie brauchen. „Dauerhaft“ speichert im Gerät, sonst nur für diese Sitzung.

export interface GlobalFilter {
  from: string;          // YYYY-MM-DD, einschließlich
  to: string;            // YYYY-MM-DD, einschließlich
  timeZone: string;
  subjectId: string;     // '' = alle Fächer
  persist: boolean;
  /** Vorheriger Zeitraum vor einem Drill-down, für „Zurück“. */
  previous?: { from: string; to: string };
}

const KEY = 'lernstoff.filter';

export function defaultFilter(now = new Date(), timeZone = DEFAULT_TZ): GlobalFilter {
  const to = dayKey(now, timeZone);
  return { from: addDays(to, -13), to, timeZone, subjectId: '', persist: false };
}

function initial(): GlobalFilter {
  const passt = (v: unknown) => istObjekt(v) && typeof v.from === 'string' && typeof v.to === 'string';
  const saved = storage.read<GlobalFilter | null>(KEY, null, 'local', passt) ?? storage.read<GlobalFilter | null>(KEY, null, 'session', passt);
  return saved ? { ...defaultFilter(), ...saved, previous: undefined } : defaultFilter();
}

export const filterStore = createStore<GlobalFilter>(initial(), (f) => {
  const { previous: _, ...rest } = f;
  if (f.persist) { storage.write(KEY, rest); storage.remove(KEY, 'session'); }
  else { storage.write(KEY, rest, 'session'); storage.remove(KEY); }
});

export function presetRange(days: number, f = filterStore.get()): Pick<GlobalFilter, 'from' | 'to'> {
  const to = dayKey(new Date(), f.timeZone);
  return { from: addDays(to, -(days - 1)), to };
}

/** Gleich langer Zeitraum direkt davor, für Trendvergleiche. */
export function previousPeriod(from: string, to: string): { from: string; to: string } {
  const len = daysBetween(from, to) + 1;
  return { from: addDays(from, -len), to: addDays(from, -1) };
}

export function drillDown(day: string) {
  filterStore.set((f) => ({ ...f, previous: f.previous ?? { from: f.from, to: f.to }, from: day, to: day }));
}

export function drillUp() {
  filterStore.set((f) => (f.previous ? { ...f, ...f.previous, previous: undefined } : f));
}
