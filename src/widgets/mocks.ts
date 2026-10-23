// Beispieldaten für die Designsystem-Seite (Zustands-Labor). Keine echten Lerndaten.

import type { ActivityEntry } from '../core/activity';
import type { BoardEntry } from '../core/board';
import { addDays, dayKey, eachDay } from '../ui/lib/time';
import type { KpiCard, ChartData } from './data';
import type { FeedData } from './feed/FeedWidget';
import type { ThemaRow } from './themen/ThemenWidget';
import type { BoardData } from './board/BoardWidget';
import type { WizardData } from './wizard/ImportWizard';
import { pflegeModule } from '../modules/pflege';

// Deterministischer Zufall, damit die Beispiele stabil aussehen.
function rng(seed: number) { return () => ((seed = (seed * 16807) % 2147483647) / 2147483647); }

const today = dayKey(new Date());
const days = eachDay(addDays(today, -13), today);

export function mockKpis(partial = false): KpiCard[] {
  const r = rng(7);
  const series = () => days.map((_, i) => (partial && i < 12 ? 0 : Math.round(r() * 4)));
  return [
    { id: 'material', label: 'Material importiert', value: partial ? '1' : '9', current: 9, previous: 6, trend: partial ? null : 0.5, series: series(), hint: '23 Dokumente insgesamt' },
    { id: 'zusammenfassungen', label: 'Zusammenfassungen', value: partial ? '0' : '5', current: 5, previous: 7, trend: partial ? 0 : -0.29, series: series(), hint: '14 gespeichert' },
    { id: 'belegquote', label: 'Belegte Aussagen', value: partial ? '–' : '94 %', current: 0.94, previous: 0.9, trend: partial ? null : 0.04, series: days.map(() => (partial ? null : 0.85 + r() * 0.15)), hint: 'Anteil mit Zitat aus der Quelle' },
    { id: 'erarbeitet', label: 'Themen erarbeitet', value: partial ? '0 / 98' : '17 / 98', current: 6, previous: 4, trend: partial ? 0 : 0.5, series: series(), hint: 'Zählt erst nach einer Abfrage als sicher' },
  ];
}

export function mockChart(partial = false): ChartData {
  const r = rng(11);
  const v = (i: number) => (partial && i !== days.length - 1 ? 0 : Math.round(r() * 3));
  return {
    days,
    stacks: { import: days.map((_, i) => v(i)), zusammenfassung: days.map((_, i) => v(i)), lernstand: days.map((_, i) => v(i) * 2) },
    quote: days.map((_, i) => (partial && i !== days.length - 1 ? null : r() > 0.3 ? 0.8 + r() * 0.2 : null)),
  };
}

export function mockFeed(partial = false): FeedData {
  const kinds: ActivityEntry['kind'][] = ['import', 'zusammenfassung', 'lernstand', 'dokument'];
  const r = rng(3);
  const n = partial ? 2 : 60;
  const items: ActivityEntry[] = Array.from({ length: n }, (_, i) => {
    const sev = r() > 0.85 ? 'critical' : r() > 0.7 ? 'warning' : 'info';
    const kind = kinds[i % kinds.length]!;
    return {
      id: i + 1, at: new Date(Date.now() - i * 3.7 * 3600_000).toISOString(), kind, severity: sev,
      title: kind === 'import' ? `Skript Pflegeprozess Teil ${i + 1} importiert` : kind === 'zusammenfassung' ? 'Zusammenfassung erstellt' : kind === 'lernstand' ? 'Dekubitusprophylaxe → In Arbeit' : 'Altes Skript gelöscht',
      detail: sev === 'critical' ? '3 Aussagen ohne Beleg' : sev === 'warning' ? 'Seite 4 schlecht lesbar' : undefined,
    };
  });
  const counts = { info: 0, warning: 0, critical: 0 };
  items.forEach((e) => { counts[e.severity] += 1; });
  return { items: items.slice(0, 30), total: items.length, counts, timeZone: 'Europe/Berlin' };
}

const subjects = pflegeModule.subjects;
const leaf = pflegeModule.topics.filter((t) => t.parentId);

export function mockThemen(count = leaf.length): { rows: ThemaRow[]; subjects: typeof subjects } {
  const r = rng(5);
  const cols = ['pool', 'woche', 'arbeit', 'erarbeitet'] as const;
  const rows = Array.from({ length: count }, (_, i): ThemaRow => {
    const t = leaf[i % leaf.length]!;
    const s = subjects.find((x) => x.id === t.subjectId);
    return {
      id: count > leaf.length ? `${t.id}#${i}` : t.id, name: count > leaf.length ? `${t.name} (${i + 1})` : t.name,
      bereich: pflegeModule.topics.find((p) => p.id === t.parentId)?.name ?? '', fachId: t.subjectId, fach: s?.code ?? s?.name ?? '',
      schwierigkeit: t.difficulty, minuten: t.estimatedMinutes, voraussetzungen: t.prerequisites.length,
      dokumente: Math.floor(r() * 4), stand: cols[Math.floor(r() * 4)]!,
    };
  });
  return { rows, subjects };
}

export function mockBoard(partial = false): BoardData {
  const r = rng(9);
  const cards = leaf.map((t) => {
    const s = subjects.find((x) => x.id === t.subjectId);
    return { id: t.id, name: t.name, fachId: t.subjectId, fach: s?.code ?? s?.name ?? '', difficulty: t.difficulty, minutes: t.estimatedMinutes };
  });
  const cols = ['woche', 'arbeit', 'erarbeitet'] as const;
  const entries: BoardEntry[] = partial ? [] : cards.filter(() => r() > 0.6).map((c, i) => ({ topicId: c.id, column: cols[i % 3]!, order: i * 1000, updatedAt: new Date().toISOString() }));
  return { cards, entries, subjects };
}

export function mockWizard(partial = false): WizardData {
  return { subjects, hasKey: false, draft: partial ? { subjectId: subjects[2]?.id ?? '', handwritten: false, step: 1, savedAt: new Date(Date.now() - 120_000).toISOString() } : null };
}
