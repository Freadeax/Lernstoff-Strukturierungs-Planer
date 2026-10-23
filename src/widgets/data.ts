// Gemeinsame Datenaufbereitung für Übersichts-Widgets (Kennzahlen, Diagramme).
// Reine Funktionen oben, Lader aus der lokalen Datenbank unten.

import { db } from '../core/db';
import type { ActivityEntry } from '../core/activity';
import type { BoardEntry } from '../core/board';
import type { Document, Summary } from '../core/types';
import { dayKey, eachDay } from '../ui/lib/time';
import { previousPeriod, type GlobalFilter } from './filter/filterStore';
import { getModule } from '../modules/registry';

/** Relative Veränderung zur Vorperiode. null = keine Vergleichsbasis. */
export function trend(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return (current - previous) / previous;
}

export function formatTrend(t: number | null): string {
  if (t === null) return 'neu';
  const pct = Math.round(t * 100);
  return `${pct > 0 ? '+' : pct < 0 ? '−' : '±'}${Math.abs(pct)} %`;
}

/** Zählt Ereignisse je Tag im Zeitraum (Tage in der gewählten Zeitzone). */
export function countByDay<T>(items: T[], at: (t: T) => string, days: string[], tz: string): number[] {
  const index = new Map(days.map((d, i) => [d, i]));
  const out = days.map(() => 0);
  for (const it of items) {
    const i = index.get(dayKey(at(it), tz));
    if (i !== undefined) out[i]! += 1;
  }
  return out;
}

export function inRange(instant: string, from: string, to: string, tz: string): boolean {
  const d = dayKey(instant, tz);
  return d >= from && d <= to;
}

export const belegquote = (s: Summary) => (s.qa && s.qa.statistik.claims ? s.qa.statistik.belegt / s.qa.statistik.claims : undefined);

/** Durchschnitt je Tag, null an Tagen ohne Werte (Lücke im Liniendiagramm). */
export function averageByDay<T>(items: T[], at: (t: T) => string, value: (t: T) => number | undefined, days: string[], tz: string): Array<number | null> {
  const sums = days.map(() => ({ s: 0, n: 0 }));
  const index = new Map(days.map((d, i) => [d, i]));
  for (const it of items) {
    const v = value(it);
    const i = index.get(dayKey(at(it), tz));
    if (v === undefined || i === undefined) continue;
    sums[i]!.s += v; sums[i]!.n += 1;
  }
  return sums.map((x) => (x.n ? x.s / x.n : null));
}

export interface Snapshot {
  activity: ActivityEntry[];
  documents: Document[];
  summaries: Summary[];
  board: BoardEntry[];
}

/** Liest alles, was die Übersicht braucht, gefiltert nach Fach. Wird live beobachtet. */
export async function loadSnapshot(f: Pick<GlobalFilter, 'subjectId'>, moduleId: string): Promise<Snapshot> {
  const [activity, documents, summaries, board] = await Promise.all([
    db.activity.toArray(), db.documents.toArray(), db.summaries.toArray(), db.board.toArray(),
  ]);
  if (!f.subjectId) return { activity, documents, summaries, board };
  const docs = documents.filter((d) => d.subjectIds.includes(f.subjectId));
  const docIds = new Set(docs.map((d) => d.id));
  const topicSubject = new Map(getModule(moduleId)?.topics.map((t) => [t.id, t.subjectId]) ?? []);
  return {
    documents: docs,
    summaries: summaries.filter((s) => s.sourceDocumentIds.some((id) => docIds.has(id))),
    board: board.filter((b) => topicSubject.get(b.topicId) === f.subjectId),
    activity: activity.filter((a) =>
      a.subjectIds ? a.subjectIds.includes(f.subjectId)
        : a.kind === 'lernstand' ? topicSubject.get(a.ref ?? '') === f.subjectId
          : a.ref ? docIds.has(a.ref) : true),
  };
}

export interface KpiCard {
  id: string;
  label: string;
  value: string;
  current: number;
  previous: number;
  trend: number | null;
  series: Array<number | null>;
  hint: string;
}

export function buildKpis(s: Snapshot, f: Pick<GlobalFilter, 'from' | 'to' | 'timeZone' | 'subjectId'>, moduleId: string): KpiCard[] {
  const tz = f.timeZone;
  const days = eachDay(f.from, f.to);
  const prev = previousPeriod(f.from, f.to);
  const cur = <T,>(xs: T[], at: (t: T) => string) => xs.filter((x) => inRange(at(x), f.from, f.to, tz));
  const old = <T,>(xs: T[], at: (t: T) => string) => xs.filter((x) => inRange(at(x), prev.from, prev.to, tz));
  const docAt = (d: Document) => d.importedAt;
  const sumAt = (x: Summary) => x.createdAt;

  const quote = (xs: Summary[]) => {
    const v = xs.map(belegquote).filter((x): x is number => x !== undefined);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
  };
  const sumsNow = cur(s.summaries, sumAt);
  const sumsPrev = old(s.summaries, sumAt);
  const qNow = quote(sumsNow);
  const qPrev = quote(sumsPrev);

  const topics = (getModule(moduleId)?.topics ?? []).filter((t) => t.parentId && (!f.subjectId || t.subjectId === f.subjectId));
  const done = s.board.filter((b) => b.column === 'erarbeitet');
  const doneAt = (b: BoardEntry) => b.updatedAt;

  return [
    {
      id: 'material', label: 'Material importiert', current: cur(s.documents, docAt).length, previous: old(s.documents, docAt).length,
      value: String(cur(s.documents, docAt).length), trend: trend(cur(s.documents, docAt).length, old(s.documents, docAt).length),
      series: countByDay(s.documents, docAt, days, tz), hint: `${s.documents.length} Dokumente insgesamt`,
    },
    {
      id: 'zusammenfassungen', label: 'Zusammenfassungen', current: sumsNow.length, previous: sumsPrev.length,
      value: String(sumsNow.length), trend: trend(sumsNow.length, sumsPrev.length),
      series: countByDay(s.summaries, sumAt, days, tz), hint: `${s.summaries.length} gespeichert`,
    },
    {
      id: 'belegquote', label: 'Belegte Aussagen', current: qNow, previous: qPrev,
      value: sumsNow.length ? `${Math.round(qNow * 100)} %` : '–', trend: sumsNow.length && sumsPrev.length ? trend(qNow, qPrev) : null,
      series: averageByDay(s.summaries, sumAt, belegquote, days, tz), hint: 'Anteil mit Zitat aus der Quelle',
    },
    {
      id: 'erarbeitet', label: 'Themen erarbeitet', current: cur(done, doneAt).length, previous: old(done, doneAt).length,
      value: `${done.length} / ${topics.length}`, trend: trend(cur(done, doneAt).length, old(done, doneAt).length),
      series: countByDay(done, doneAt, days, tz), hint: 'Zählt erst nach einer Abfrage als sicher',
    },
  ];
}

export type ChartKind = 'import' | 'zusammenfassung' | 'lernstand';
export interface ChartData { days: string[]; stacks: Record<ChartKind, number[]>; quote: Array<number | null> }

export function buildChart(s: Snapshot, f: Pick<GlobalFilter, 'from' | 'to' | 'timeZone'>): ChartData {
  const days = eachDay(f.from, f.to);
  const by = (k: ChartKind) => countByDay(s.activity.filter((a) => a.kind === k), (a) => a.at, days, f.timeZone);
  return {
    days,
    stacks: { import: by('import'), zusammenfassung: by('zusammenfassung'), lernstand: by('lernstand') },
    quote: averageByDay(s.summaries, (x) => x.createdAt, belegquote, days, f.timeZone),
  };
}

/** Anzahl Tage mit irgendeiner Aktivität, Grundlage für den Teilzustand. */
export function activeDays(series: Array<Array<number | null>>): number {
  const n = series[0]?.length ?? 0;
  let count = 0;
  for (let i = 0; i < n; i++) if (series.some((s) => (s[i] ?? 0) > 0)) count++;
  return count;
}
