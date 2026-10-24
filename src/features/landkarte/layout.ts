// Layout der Themen-Landkarte. Fachneutral: arbeitet auf Topic aus dem Kernvertrag.
// Spalten = Lernstufe (längster Voraussetzungspfad), Bänder = Fach. Rein und deterministisch,
// damit sich die Karte bei gleichem Katalog nie umsortiert.

import type { Topic } from '../../core/types';
import type { BoardColumn } from '../../core/board';

export type EdgeKind = 'voraussetzung' | 'teil';

export interface MapNode { id: string; topic: Topic; x: number; y: number; w: number; h: number; rank: number; lane: number }
export interface MapEdge { from: string; to: string; kind: EdgeKind }
export interface MapLane { subjectId: string; label: string; y: number; h: number }
export interface MapLayout { nodes: MapNode[]; edges: MapEdge[]; lanes: MapLane[]; width: number; height: number; ranks: number }

export const GEOM = {
  nodeW: 184, nodeH: 72, gapX: 12, gapY: 12,
  colGap: 64,           // Platz für Pfeile zwischen zwei Stufen
  laneHead: 36,         // Fachname oben im Band
  lanePad: 16, laneGap: 8, margin: 24,
  maxRows: 4,           // mehr Themen in einer Zelle werden auf Unterspalten verteilt
} as const;

/** Knoten der Karte: alle Themen außer Oberthemen ohne Elternteil, die nur gruppieren (die zeigt das Fachband). */
export function mapTopics(topics: Topic[]): Topic[] {
  const hasChildren = new Set(topics.map((t) => t.parentId).filter(Boolean));
  return topics.filter((t) => t.parentId || !hasChildren.has(t.id));
}

/** Kanten: Voraussetzung → Thema, sowie Oberthema → Unterthema („teil“, gilt als stillschweigende Voraussetzung). */
export function mapEdges(nodes: Topic[]): MapEdge[] {
  const ids = new Set(nodes.map((t) => t.id));
  const edges: MapEdge[] = [];
  for (const t of nodes) {
    if (t.parentId && ids.has(t.parentId)) edges.push({ from: t.parentId, to: t.id, kind: 'teil' });
    for (const p of t.prerequisites) if (ids.has(p) && p !== t.id) edges.push({ from: p, to: t.id, kind: 'voraussetzung' });
  }
  return edges;
}

export function predecessors(edges: MapEdge[]): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const e of edges) m.set(e.to, [...(m.get(e.to) ?? []), e.from]);
  return m;
}

export function successors(edges: MapEdge[]): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const e of edges) m.set(e.from, [...(m.get(e.from) ?? []), e.to]);
  return m;
}

/** Stufe = Länge des längsten Voraussetzungspfads. Zyklen im Katalog brechen ab statt zu hängen. */
export function ranks(ids: string[], preds: Map<string, string[]>): Map<string, number> {
  const rank = new Map<string, number>();
  const visiting = new Set<string>();
  const visit = (id: string): number => {
    const known = rank.get(id);
    if (known !== undefined) return known;
    if (visiting.has(id)) return 0;
    visiting.add(id);
    const r = Math.max(0, ...(preds.get(id) ?? []).map((p) => visit(p) + 1));
    visiting.delete(id);
    rank.set(id, r);
    return r;
  };
  ids.forEach(visit);
  return rank;
}

/** Alle direkten und indirekten Voraussetzungen eines Themas (ohne das Thema selbst). */
export function ancestors(id: string, preds: Map<string, string[]>): Set<string> {
  const out = new Set<string>();
  const stack = [...(preds.get(id) ?? [])];
  while (stack.length) {
    const p = stack.pop()!;
    if (out.has(p) || p === id) continue;
    out.add(p);
    stack.push(...(preds.get(p) ?? []));
  }
  return out;
}

/**
 * Themen eines Fachs plus alle Voraussetzungen aus anderen Fächern, damit der Lernpfad vollständig bleibt.
 * `subjectId` leer = alle Themen.
 */
export function selectSubject(topics: Topic[], subjectId?: string): Topic[] {
  const nodes = mapTopics(topics);
  if (!subjectId) return nodes;
  const preds = predecessors(mapEdges(nodes));
  const keep = new Set<string>();
  for (const t of nodes) if (t.subjectId === subjectId) { keep.add(t.id); ancestors(t.id, preds).forEach((a) => keep.add(a)); }
  return nodes.filter((t) => keep.has(t.id));
}

export function layoutMap(nodes: Topic[], subjects: Array<{ id: string; name: string; code?: string }>): MapLayout {
  const g = GEOM;
  const edges = mapEdges(nodes);
  const preds = predecessors(edges);
  const rank = ranks(nodes.map((t) => t.id), preds);
  const order = new Map(nodes.map((t, i) => [t.id, i]));

  // Bänder in Katalogreihenfolge der Fächer, unbekannte Fächer zuletzt
  const laneIds = [
    ...subjects.map((s) => s.id).filter((id) => nodes.some((t) => t.subjectId === id)),
    ...[...new Set(nodes.map((t) => t.subjectId))].filter((id) => !subjects.some((s) => s.id === id)),
  ];
  const laneOf = new Map(laneIds.map((id, i) => [id, i]));
  const maxRank = Math.max(0, ...rank.values());

  // Zellen (Band × Stufe) und deren Unterspalten
  const cell = (lane: number, r: number) => `${lane}|${r}`;
  const cells = new Map<string, Topic[]>();
  for (const t of nodes) {
    const key = cell(laneOf.get(t.subjectId)!, rank.get(t.id)!);
    cells.set(key, [...(cells.get(key) ?? []), t]);
  }
  const subCols = (n: number) => Math.max(1, Math.ceil(n / g.maxRows));
  const rowsOf = (n: number) => Math.ceil(n / subCols(n));

  const colK = Array.from({ length: maxRank + 1 }, (_, r) =>
    Math.max(1, ...laneIds.map((_, l) => subCols(cells.get(cell(l, r))?.length ?? 0))));
  const colX: number[] = [];
  let x = g.margin;
  for (let r = 0; r <= maxRank; r++) { colX.push(x); x += colK[r]! * g.nodeW + (colK[r]! - 1) * g.gapX + g.colGap; }
  const width = x - g.colGap + g.margin;

  const lanes: MapLane[] = [];
  let y = g.margin;
  laneIds.forEach((id, l) => {
    const rows = Math.max(1, ...Array.from({ length: maxRank + 1 }, (_, r) => rowsOf(cells.get(cell(l, r))?.length ?? 0)));
    const h = g.laneHead + rows * g.nodeH + (rows - 1) * g.gapY + g.lanePad;
    const s = subjects.find((x) => x.id === id);
    lanes.push({ subjectId: id, label: s ? (s.code ? `${s.code} · ${s.name}` : s.name) : 'Ohne Fach', y, h });
    y += h + g.laneGap;
  });
  const height = y - g.laneGap + g.margin;

  // Stufe für Stufe platzieren; innerhalb einer Zelle nach mittlerer Höhe der Voraussetzungen sortieren (weniger Kreuzungen)
  const pos = new Map<string, MapNode>();
  for (let r = 0; r <= maxRank; r++) {
    laneIds.forEach((_, l) => {
      const list = cells.get(cell(l, r));
      if (!list) return;
      const bary = (t: Topic) => {
        const ys = (preds.get(t.id) ?? []).map((p) => pos.get(p)).filter(Boolean).map((n) => n!.y);
        return ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : Infinity;
      };
      const sorted = [...list].sort((a, b) => (bary(a) - bary(b)) || (order.get(a.id)! - order.get(b.id)!));
      const k = subCols(sorted.length);
      sorted.forEach((t, i) => {
        const row = Math.floor(i / k), col = i % k;
        pos.set(t.id, {
          id: t.id, topic: t, rank: r, lane: l, w: g.nodeW, h: g.nodeH,
          x: colX[r]! + col * (g.nodeW + g.gapX),
          y: lanes[l]!.y + g.laneHead + row * (g.nodeH + g.gapY),
        });
      });
    });
  }

  return { nodes: nodes.map((t) => pos.get(t.id)!), edges, lanes, width, height, ranks: maxRank + 1 };
}

/** Kurve vom rechten Rand der Voraussetzung zum linken Rand des Themas. */
export function edgePath(a: MapNode, b: MapNode): string {
  const x1 = a.x + a.w, y1 = a.y + a.h / 2, x2 = b.x, y2 = b.y + b.h / 2;
  const c = Math.max(32, (x2 - x1) / 2);
  return `M${x1},${y1} C${x1 + c},${y1} ${x2 - c},${y2} ${x2},${y2}`;
}

export type Stand = BoardColumn;

/** „Bereit“: noch nicht erarbeitet, hat Voraussetzungen und alle davon sind erarbeitet. */
export function isReady(id: string, preds: Map<string, string[]>, stand: (id: string) => Stand): boolean {
  const p = preds.get(id) ?? [];
  return stand(id) !== 'erarbeitet' && p.length > 0 && p.every((x) => stand(x) === 'erarbeitet');
}

/** Offene Voraussetzungen auf dem Weg zu einem Thema, in sinnvoller Lernreihenfolge (Stufe aufsteigend). */
export function openPath(id: string, preds: Map<string, string[]>, stand: (id: string) => Stand, rankOf: (id: string) => number): string[] {
  return [...ancestors(id, preds)].filter((a) => stand(a) !== 'erarbeitet').sort((a, b) => rankOf(a) - rankOf(b) || a.localeCompare(b));
}
