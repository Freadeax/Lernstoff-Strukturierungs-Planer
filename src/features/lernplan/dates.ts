// Kalenderrechnung auf reinen Datumsangaben ('YYYY-MM-DD'), immer in UTC,
// damit Zeitzonen und Sommerzeit die Tageszählung nicht verfälschen.

export type ISODate = string;

const DAY_MS = 86_400_000;

export function toEpochDay(date: ISODate): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new Error(`Ungültiges Datum: "${date}" (erwartet YYYY-MM-DD)`);
  return Math.round(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / DAY_MS);
}

export function fromEpochDay(day: number): ISODate {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

export function addDays(date: ISODate, days: number): ISODate {
  return fromEpochDay(toEpochDay(date) + days);
}

/** Anzahl Tage von `from` bis `to` (negativ, wenn `to` vor `from` liegt). */
export function daysBetween(from: ISODate, to: ISODate): number {
  return toEpochDay(to) - toEpochDay(from);
}

/** 0 = Sonntag … 6 = Samstag. */
export function weekday(date: ISODate): number {
  return new Date(toEpochDay(date) * DAY_MS).getUTCDay();
}

/** Alle Tage von `from` (inklusive) bis `to` (exklusive). */
export function eachDay(from: ISODate, toExclusive: ISODate): ISODate[] {
  const days: ISODate[] = [];
  for (let d = toEpochDay(from); d < toEpochDay(toExclusive); d++) days.push(fromEpochDay(d));
  return days;
}

export function minDate(a: ISODate, b: ISODate): ISODate {
  return a <= b ? a : b;
}

export function maxDate(a: ISODate, b: ISODate): ISODate {
  return a >= b ? a : b;
}
