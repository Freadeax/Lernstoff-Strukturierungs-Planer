// Abfrage-Baukasten: verschachtelte UND/ODER-Gruppen mit NICHT, ausgewertet im Browser.

import { normalize } from '../../ui/lib/trie';

export type FieldType = 'text' | 'number' | 'enum';
export interface QueryField { key: string; label: string; type: FieldType; options?: Array<{ value: string; label: string }> }

export type Operator = 'contains' | 'equals' | 'gt' | 'lt' | 'gte' | 'lte' | 'empty';
export const OPERATORS: Record<Operator, { label: string; types: FieldType[] }> = {
  contains: { label: 'enthält', types: ['text'] },
  equals: { label: 'ist', types: ['text', 'number', 'enum'] },
  gt: { label: 'größer als', types: ['number'] },
  gte: { label: 'mindestens', types: ['number'] },
  lt: { label: 'kleiner als', types: ['number'] },
  lte: { label: 'höchstens', types: ['number'] },
  empty: { label: 'ist leer', types: ['text', 'number', 'enum'] },
};

export interface Condition { kind: 'cond'; id: string; field: string; op: Operator; value: string; not?: boolean }
export interface Group { kind: 'group'; id: string; combinator: 'and' | 'or'; not?: boolean; children: Array<Condition | Group> }
export type QueryNode = Condition | Group;

export const MAX_DEPTH = 3;

let n = 0;
export const newId = () => `q${Date.now().toString(36)}${(n++).toString(36)}`;
export const emptyGroup = (): Group => ({ kind: 'group', id: newId(), combinator: 'and', children: [] });
export const newCondition = (field: QueryField): Condition => ({
  kind: 'cond', id: newId(), field: field.key, op: field.type === 'text' ? 'contains' : 'equals', value: field.options?.[0]?.value ?? '',
});

export type Row = Record<string, string | number | undefined | null>;

function test(c: Condition, row: Row): boolean {
  const v = row[c.field];
  let ok: boolean;
  if (c.op === 'empty') ok = v === undefined || v === null || v === '';
  else if (c.value === '') ok = true; // unvollständige Bedingung filtert nicht
  else if (c.op === 'contains') ok = normalize(String(v ?? '')).includes(normalize(c.value));
  else if (c.op === 'equals') ok = typeof v === 'number' ? v === Number(c.value) : normalize(String(v ?? '')) === normalize(c.value);
  else {
    const a = Number(v); const b = Number(c.value);
    if (v === undefined || v === null || Number.isNaN(a) || Number.isNaN(b)) ok = false;
    else ok = c.op === 'gt' ? a > b : c.op === 'gte' ? a >= b : c.op === 'lt' ? a < b : a <= b;
  }
  return c.not ? !ok : ok;
}

export function evaluate(node: QueryNode, row: Row): boolean {
  if (node.kind === 'cond') return test(node, row);
  const res = node.children.length === 0 ? true
    : node.combinator === 'and' ? node.children.every((c) => evaluate(c, row)) : node.children.some((c) => evaluate(c, row));
  return node.not ? !res : res;
}

export function describe(node: QueryNode, fields: QueryField[], top = true): string {
  if (node.kind === 'cond') {
    const f = fields.find((x) => x.key === node.field);
    const value = f?.options?.find((o) => o.value === node.value)?.label ?? node.value;
    const text = node.op === 'empty' ? `${f?.label ?? node.field} ist leer` : `${f?.label ?? node.field} ${OPERATORS[node.op].label} „${value}“`;
    return node.not ? `NICHT ${text}` : text;
  }
  if (!node.children.length) return top ? 'alle Einträge' : '(leer)';
  const inner = node.children.map((c) => describe(c, fields, false)).join(node.combinator === 'and' ? ' UND ' : ' ODER ');
  const wrapped = top && !node.not ? inner : `(${inner})`;
  return node.not ? `NICHT ${wrapped}` : wrapped;
}

/** Unveränderliche Bearbeitung eines Knotens im Baum. */
export function updateNode(root: Group, id: string, fn: (n: QueryNode) => QueryNode | null): Group {
  const walk = (node: QueryNode): QueryNode | null => {
    if (node.id === id) return fn(node);
    if (node.kind === 'cond') return node;
    return { ...node, children: node.children.map(walk).filter((x): x is QueryNode => x !== null) };
  };
  return (walk(root) as Group | null) ?? emptyGroup();
}

export function countConditions(node: QueryNode): number {
  return node.kind === 'cond' ? 1 : node.children.reduce((s, c) => s + countConditions(c), 0);
}
