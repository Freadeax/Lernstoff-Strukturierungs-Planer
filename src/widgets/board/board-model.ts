import { BOARD_COLUMNS, orderBetween, type BoardColumn, type BoardEntry } from '../../core/board';

export interface Card { id: string; name: string; fach: string; fachId: string; difficulty?: number; minutes?: number; column: BoardColumn; order: number }
export type Columns = Record<BoardColumn, Card[]>;

const IMPLICIT = 1_000_000;

/** Verteilt Themen auf Spalten. Themen ohne Eintrag liegen im Pool in Katalogreihenfolge. */
export function arrange(topics: Array<Omit<Card, 'column' | 'order'>>, entries: BoardEntry[], overrides = new Map<string, { column: BoardColumn; order: number }>()): Columns {
  const byTopic = new Map(entries.map((e) => [e.topicId, e]));
  const cols = Object.fromEntries(BOARD_COLUMNS.map((c) => [c.id, [] as Card[]])) as Columns;
  topics.forEach((t, i) => {
    const o = overrides.get(t.id) ?? byTopic.get(t.id);
    cols[o?.column ?? 'pool'].push({ ...t, column: o?.column ?? 'pool', order: o?.order ?? IMPLICIT + i * 1000 });
  });
  for (const c of BOARD_COLUMNS) cols[c.id].sort((a, b) => a.order - b.order);
  return cols;
}

/** Neuer Reihenfolgewert, wenn `cardId` an Position `index` der Spalte `column` landet. */
export function orderForDrop(cols: Columns, cardId: string, column: BoardColumn, index: number): number {
  const list = cols[column].filter((c) => c.id !== cardId);
  const i = Math.max(0, Math.min(index, list.length));
  return orderBetween(list[i - 1]?.order, list[i]?.order);
}
