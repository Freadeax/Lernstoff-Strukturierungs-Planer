import { describe, expect, it } from 'vitest';
import type { Topic } from '../../core/types';
import { pflegeModule } from '../../modules/pflege';
import { ancestors, edgePath, isReady, layoutMap, mapEdges, mapTopics, openPath, predecessors, ranks, selectSubject } from './layout';

const t = (id: string, prerequisites: string[] = [], extra: Partial<Topic> = {}): Topic =>
  ({ id, name: id, subjectId: 'f', prerequisites, ...extra });

describe('Themen-Landkarte: Layout', () => {
  const { topics, subjects } = pflegeModule;
  const nodes = mapTopics(topics);
  const map = layoutMap(nodes, subjects);

  it('zeigt alle Themen außer den reinen Gruppen-Oberthemen', () => {
    expect(nodes.length).toBe(topics.length - 11);
    expect(nodes.some((n) => n.id === 'thema.ap')).toBe(false);
    expect(nodes.some((n) => n.id === 'thema.kl.herz')).toBe(true);
  });

  it('jede Kante läuft von links nach rechts', () => {
    const byId = new Map(map.nodes.map((n) => [n.id, n]));
    expect(map.edges.length).toBeGreaterThan(60);
    for (const e of map.edges) expect(byId.get(e.from)!.x + byId.get(e.from)!.w).toBeLessThan(byId.get(e.to)!.x);
  });

  it('Knoten überlappen nicht und liegen in ihrem Fachband', () => {
    for (const a of map.nodes) {
      const lane = map.lanes[a.lane]!;
      expect(lane.subjectId).toBe(a.topic.subjectId);
      expect(a.y).toBeGreaterThanOrEqual(lane.y);
      expect(a.y + a.h).toBeLessThanOrEqual(lane.y + lane.h);
      for (const b of map.nodes) {
        if (a === b) continue;
        const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
        expect(overlap, `${a.id} / ${b.id}`).toBe(false);
      }
    }
    expect(Math.max(...map.nodes.map((n) => n.x + n.w))).toBeLessThanOrEqual(map.width);
    expect(Math.max(...map.nodes.map((n) => n.y + n.h))).toBeLessThanOrEqual(map.height);
  });

  it('ist deterministisch', () => {
    expect(layoutMap(mapTopics(topics), subjects)).toEqual(map);
  });

  it('Fachfilter behält alle Voraussetzungen aus anderen Fächern', () => {
    const fa = selectSubject(topics, 'fach.fallarbeit');
    const ids = new Set(fa.map((x) => x.id));
    const preds = predecessors(mapEdges(nodes));
    for (const x of fa.filter((x) => x.subjectId === 'fach.fallarbeit')) for (const a of ancestors(x.id, preds)) expect(ids.has(a)).toBe(true);
    expect(fa.some((x) => x.subjectId !== 'fach.fallarbeit')).toBe(true);
    expect(fa.length).toBeLessThan(nodes.length);
  });
});

describe('Themen-Landkarte: Lernpfad', () => {
  const nodes = [t('a'), t('b', ['a']), t('c', ['b']), t('d', ['a', 'c'])];
  const preds = predecessors(mapEdges(nodes));

  it('Stufe = längster Pfad', () => {
    const r = ranks(nodes.map((n) => n.id), preds);
    expect([...r.entries()]).toEqual([['a', 0], ['b', 1], ['c', 2], ['d', 3]]);
  });

  it('übersteht Zyklen im Katalog', () => {
    const cyc = [t('x', ['y']), t('y', ['x'])];
    const m = layoutMap(cyc, [{ id: 'f', name: 'F' }]);
    expect(m.nodes).toHaveLength(2);
    expect(edgePath(m.nodes[0]!, m.nodes[1]!)).toMatch(/^M/);
  });

  it('Unterthemen hängen am Oberthema', () => {
    const e = mapEdges([t('p'), t('p.1', [], { parentId: 'p' })]);
    expect(e).toEqual([{ from: 'p', to: 'p.1', kind: 'teil' }]);
  });

  it('bereit und offener Pfad', () => {
    const stand = (s: Record<string, 'erarbeitet' | 'pool'>) => (id: string) => s[id] ?? 'pool';
    expect(isReady('b', preds, stand({ a: 'erarbeitet' }))).toBe(true);
    expect(isReady('a', preds, stand({}))).toBe(false); // ohne Voraussetzungen nie „bereit“
    expect(isReady('d', preds, stand({ a: 'erarbeitet' }))).toBe(false);
    const r = ranks(nodes.map((n) => n.id), preds);
    expect(openPath('d', preds, stand({ a: 'erarbeitet' }), (id) => r.get(id)!)).toEqual(['b', 'c']);
  });
});
