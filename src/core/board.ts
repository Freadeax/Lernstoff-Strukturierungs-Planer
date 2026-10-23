// Arbeitsstand je Thema für das Lernstand-Board. Bewusst getrennt vom Wissensstand
// (offen/bearbeitet/unsicher/sicher aus dem Lernplan): „Erarbeitet“ heißt nicht „sicher“.

import { db } from './db';
import { logActivity } from './activity';

export type BoardColumn = 'pool' | 'woche' | 'arbeit' | 'erarbeitet';

export const BOARD_COLUMNS: Array<{ id: BoardColumn; label: string; hint: string }> = [
  { id: 'pool', label: 'Themenpool', hint: 'Noch nicht eingeplant' },
  { id: 'woche', label: 'Diese Woche', hint: 'Fest vorgenommen' },
  { id: 'arbeit', label: 'In Arbeit', hint: 'Gerade dran' },
  { id: 'erarbeitet', label: 'Erarbeitet', hint: 'Bereit zur Abfrage, zählt erst nach einem Test als sicher' },
];
export const COLUMN_LABEL = Object.fromEntries(BOARD_COLUMNS.map((c) => [c.id, c.label])) as Record<BoardColumn, string>;

export interface BoardEntry { topicId: string; column: BoardColumn; order: number; updatedAt: string }

/** Reihenfolgewert zwischen zwei Nachbarn (Gleitkomma, kein Umnummerieren nötig). */
export function orderBetween(before?: number, after?: number): number {
  if (before === undefined && after === undefined) return 1000;
  if (before === undefined) return after! - 1000;
  if (after === undefined) return before + 1000;
  return (before + after) / 2;
}

export async function moveTopics(moves: Array<{ topicId: string; column: BoardColumn; order?: number; name?: string }>) {
  const now = new Date().toISOString();
  await db.transaction('rw', [db.board, db.activity], async () => {
    for (const m of moves) {
      const prev = await db.board.get(m.topicId);
      const order = m.order ?? (await maxOrder(m.column)) + 1000;
      await db.board.put({ topicId: m.topicId, column: m.column, order, updatedAt: now });
      if (prev?.column !== m.column && !(prev === undefined && m.column === 'pool')) {
        await logActivity({
          kind: 'lernstand', severity: 'info', ref: m.topicId,
          title: `${m.name ?? m.topicId} → ${COLUMN_LABEL[m.column]}`,
          detail: prev ? `vorher: ${COLUMN_LABEL[prev.column]}` : undefined,
        });
      }
    }
  });
}

async function maxOrder(column: BoardColumn): Promise<number> {
  const all = await db.board.where('column').equals(column).toArray();
  return all.reduce((m, e) => Math.max(m, e.order), 0);
}
