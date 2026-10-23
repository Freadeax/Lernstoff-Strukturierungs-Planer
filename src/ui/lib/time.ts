// Datums- und Zeitfunktionen mit Zeitzonen-Unterstützung.

export const DEFAULT_TZ = 'Europe/Berlin';

/** Kalendertag (YYYY-MM-DD) eines Zeitpunkts in einer Zeitzone. */
export function dayKey(instant: string | Date, timeZone = DEFAULT_TZ): string {
  const d = typeof instant === 'string' ? new Date(instant) : instant;
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000);
}

/** Alle Tage von `from` bis einschließlich `to`. */
export function eachDay(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to && out.length < 3700; d = addDays(d, 1)) out.push(d);
  return out;
}

/** „gerade eben“, „vor 2 Min.“, „vor 3 Std.“, „vor 4 Tagen“. */
export function relativeTime(instant: Date | string | number, now = Date.now()): string {
  const t = typeof instant === 'number' ? instant : new Date(instant).getTime();
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 45) return 'gerade eben';
  const m = Math.round(s / 60);
  if (m < 60) return `vor ${m} Min.`;
  const h = Math.round(m / 60);
  if (h < 24) return `vor ${h} Std.`;
  const d = Math.round(h / 24);
  return d === 1 ? 'vor 1 Tag' : `vor ${d} Tagen`;
}

export function formatDay(day: string): string {
  const d = new Date(`${day}T12:00:00Z`);
  return d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'UTC' });
}

export function timeZones(): string[] {
  const intl = Intl as unknown as { supportedValuesOf?: (k: string) => string[] };
  const list = intl.supportedValuesOf?.('timeZone') ?? [];
  return list.length ? list : [DEFAULT_TZ, 'UTC', 'Europe/Vienna', 'Europe/Zurich'];
}
