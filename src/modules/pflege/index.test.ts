import { describe, expect, it } from 'vitest';
import { pflegeModule as m } from './index';

const ids = new Set<string>([
  ...m.subjects.map((s) => s.id),
  ...m.topics.map((t) => t.id),
  ...m.taskFormats.map((f) => f.id),
  ...m.checkRules.map((r) => r.id),
  ...(m.references ?? []).map((r) => r.id),
  ...(m.frameworks ?? []).flatMap((f) => f.items.map((i) => i.id)),
]);

describe('Pflege-Fachmodul', () => {
  it('hat eindeutige Themen-IDs', () => {
    expect(new Set(m.topics.map((t) => t.id)).size).toBe(m.topics.length);
  });

  it('verweist nur auf vorhandene IDs', () => {
    const missing = m.topics.flatMap((t) =>
      [t.subjectId, t.parentId, ...t.prerequisites, ...(t.competencyIds ?? []), ...(t.referenceIds ?? []), ...(t.taskFormatIds ?? [])]
        .filter((ref): ref is string => !!ref && !ids.has(ref))
        .map((ref) => `${t.id} -> ${ref}`),
    );
    expect(missing).toEqual([]);
  });

  it('hat keine Zyklen in den Voraussetzungen', () => {
    const prereqs = new Map(m.topics.map((t) => [t.id, t.prerequisites]));
    const done = new Set<string>();
    const visit = (id: string, path: string[]): void => {
      if (path.includes(id)) throw new Error(`Zyklus: ${[...path, id].join(' -> ')}`);
      if (done.has(id)) return;
      prereqs.get(id)?.forEach((p) => visit(p, [...path, id]));
      done.add(id);
    };
    expect(() => m.topics.forEach((t) => visit(t.id, []))).not.toThrow();
  });

  it('leitet requiredParts aus den Pflichtteilen ab', () => {
    const pesr = m.taskFormats.find((f) => f.id === 'format.pesr');
    expect(pesr?.requiredParts).toEqual(['P', 'E', 'S', 'R']);
  });

  it('kennzeichnet Katalogdefinitionen als ergänzendes Wissen', () => {
    expect(m.glossary.every((g) => g.origin === 'katalog' || g.citation)).toBe(true);
  });
});
