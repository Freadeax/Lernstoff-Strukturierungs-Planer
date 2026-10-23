import { describe, expect, it } from 'vitest';
import { countConditions, describe as describeQuery, emptyGroup, evaluate, updateNode, type Group, type QueryField } from '../themen/query';
import { activeDays, averageByDay, countByDay, formatTrend, trend } from '../data';
import { sparkPath } from '../kpi/sparkline';
import { arrange, orderForDrop } from '../board/board-model';
import { previousPeriod } from '../filter/filterStore';
import { validateStep } from '../wizard/ImportWizard';

const fields: QueryField[] = [
  { key: 'name', label: 'Thema', type: 'text' },
  { key: 'd', label: 'Schwierigkeit', type: 'number' },
  { key: 'fach', label: 'Fach', type: 'enum', options: [{ value: 'kl', label: 'KL' }, { value: 'ap', label: 'AP' }] },
];

describe('Abfrage-Baukasten', () => {
  const q: Group = {
    kind: 'group', id: 'root', combinator: 'and', children: [
      { kind: 'cond', id: 'c1', field: 'd', op: 'gte', value: '3' },
      { kind: 'group', id: 'g1', combinator: 'or', children: [
        { kind: 'cond', id: 'c2', field: 'fach', op: 'equals', value: 'kl' },
        { kind: 'cond', id: 'c3', field: 'name', op: 'contains', value: 'prophylaxe', not: true },
      ] },
    ],
  };
  it('wertet verschachtelte UND/ODER/NICHT aus', () => {
    expect(evaluate(q, { name: 'Herzinsuffizienz', d: 4, fach: 'kl' })).toBe(true);
    expect(evaluate(q, { name: 'Dekubitusprophylaxe', d: 4, fach: 'ap' })).toBe(false);
    expect(evaluate(q, { name: 'Pflegeprozess', d: 4, fach: 'ap' })).toBe(true);
    expect(evaluate(q, { name: 'Herz', d: 2, fach: 'kl' })).toBe(false);
    expect(evaluate({ ...q, not: true }, { name: 'Herz', d: 2, fach: 'kl' })).toBe(true);
  });
  it('behandelt leere Gruppen, unvollständige und fehlende Werte', () => {
    expect(evaluate(emptyGroup(), { name: 'x' })).toBe(true);
    expect(evaluate({ kind: 'cond', id: 'x', field: 'd', op: 'gt', value: '' }, { d: 1 })).toBe(true);
    expect(evaluate({ kind: 'cond', id: 'x', field: 'd', op: 'gt', value: '1' }, { d: undefined })).toBe(false);
    expect(evaluate({ kind: 'cond', id: 'x', field: 'd', op: 'empty', value: '' }, { d: undefined })).toBe(true);
  });
  it('beschreibt die Abfrage lesbar', () => {
    expect(describeQuery(q, fields)).toBe('Schwierigkeit mindestens „3“ UND (Fach ist „KL“ ODER NICHT Thema enthält „prophylaxe“)');
  });
  it('ändert und entfernt Knoten unveränderlich', () => {
    const removed = updateNode(q, 'c3', () => null);
    expect(countConditions(removed)).toBe(2);
    expect(countConditions(q)).toBe(3);
  });
});

describe('Kennzahlen', () => {
  it('berechnet Trends zur Vorperiode', () => {
    expect(trend(6, 4)).toBe(0.5);
    expect(trend(0, 0)).toBe(0);
    expect(trend(3, 0)).toBeNull();
    expect(formatTrend(0.5)).toBe('+50 %');
    expect(formatTrend(-0.25)).toBe('−25 %');
    expect(formatTrend(null)).toBe('neu');
  });
  it('zählt und mittelt je Tag in der Zeitzone', () => {
    const days = ['2026-10-22', '2026-10-23', '2026-10-24'];
    const at = ['2026-10-22T10:00:00Z', '2026-10-23T22:30:00Z', '2026-10-24T08:00:00Z'];
    expect(countByDay(at, (x) => x, days, 'Europe/Berlin')).toEqual([1, 0, 2]);
    expect(averageByDay([{ at: at[0]!, v: 0.5 }, { at: at[0]!, v: 1 }], (x) => x.at, (x) => x.v, days, 'UTC')).toEqual([0.75, null, null]);
    expect(activeDays([[0, 1, 0], [0, 0, 2]])).toBe(2);
  });
  it('liefert gleich lange Vorperiode', () => {
    expect(previousPeriod('2026-10-10', '2026-10-23')).toEqual({ from: '2026-09-26', to: '2026-10-09' });
  });
  it('zeichnet Sparklines mit Lücken', () => {
    expect(sparkPath([])).toBe('');
    const d = sparkPath([1, null, 3, 4], 100, 32);
    expect(d.match(/M/g)).toHaveLength(2);
    expect(d.startsWith('M2.0 ')).toBe(true);
  });
});

describe('Lernstand-Board', () => {
  const topics = [{ id: 'a', name: 'A', fach: 'AP', fachId: 'f' }, { id: 'b', name: 'B', fach: 'AP', fachId: 'f' }, { id: 'c', name: 'C', fach: 'AP', fachId: 'f' }];
  it('legt Themen ohne Eintrag in den Pool und sortiert nach Reihenfolge', () => {
    const cols = arrange(topics, [{ topicId: 'c', column: 'woche', order: 5, updatedAt: '' }, { topicId: 'b', column: 'woche', order: 1, updatedAt: '' }]);
    expect(cols.pool.map((c) => c.id)).toEqual(['a']);
    expect(cols.woche.map((c) => c.id)).toEqual(['b', 'c']);
  });
  it('wendet optimistische Änderungen sofort an', () => {
    const cols = arrange(topics, [], new Map([['a', { column: 'erarbeitet' as const, order: 1 }]]));
    expect(cols.erarbeitet.map((c) => c.id)).toEqual(['a']);
  });
  it('berechnet Reihenfolge zwischen Nachbarn', () => {
    const cols = arrange(topics, [{ topicId: 'b', column: 'woche', order: 1000, updatedAt: '' }, { topicId: 'c', column: 'woche', order: 2000, updatedAt: '' }]);
    expect(orderForDrop(cols, 'a', 'woche', 1)).toBe(1500);
    expect(orderForDrop(cols, 'a', 'woche', 0)).toBe(0);
    expect(orderForDrop(cols, 'a', 'woche', 9)).toBe(3000);
    expect(orderForDrop(cols, 'a', 'arbeit', 0)).toBe(1000);
  });
});

describe('Import-Assistent', () => {
  const file = (name: string) => ({ name, size: 1 }) as File;
  it('prüft jeden Abschnitt', () => {
    expect(validateStep(0, { subjectId: '', handwritten: false, hasKey: false, files: [] })).toHaveLength(1);
    expect(validateStep(0, { subjectId: 'x', handwritten: true, hasKey: false, files: [] })[0]).toMatch(/API-Schlüssel/);
    expect(validateStep(0, { subjectId: 'x', handwritten: true, hasKey: true, files: [] })).toEqual([]);
    expect(validateStep(1, { subjectId: 'x', handwritten: false, hasKey: false, files: [] })).toHaveLength(1);
    expect(validateStep(1, { subjectId: 'x', handwritten: false, hasKey: false, files: [file('a.pdf'), file('b.exe')] })[0]).toMatch(/b\.exe/);
  });
});
