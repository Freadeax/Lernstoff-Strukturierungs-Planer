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

  it('ordnet jedes Thema direkt oder über ein Oberthema einem Kompetenzbereich zu', () => {
    const kb = new Set((m.frameworks ?? []).filter((f) => f.kind === 'kompetenzen').flatMap((f) => f.items.map((i) => i.id)));
    const topics = new Map(m.topics.map((t) => [t.id, t]));
    const hatKb = (id: string | undefined): boolean => {
      const t = id ? topics.get(id) : undefined;
      return !!t && ((t.competencyIds ?? []).some((c) => kb.has(c)) || hatKb(t.parentId));
    };
    expect(m.topics.filter((t) => !hatKb(t.id)).map((t) => t.id)).toEqual([]);
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

  it('hat Medikamenten-Steckbriefe mit Quelle, Prüfstatus und gültigen Themen', () => {
    const d = m.drugProfiles ?? [];
    expect(d.length).toBeGreaterThanOrEqual(40);
    expect(new Set(d.map((x) => x.id)).size).toBe(d.length);
    expect(new Set(d.map((x) => x.substance.toLowerCase())).size).toBe(d.length);
    const themen = new Set(m.topics.map((t) => t.id));
    expect(d.flatMap((x) => x.topicIds.filter((t) => !themen.has(t)).map((t) => `${x.id} -> ${t}`))).toEqual([]);
    expect(d.filter((x) => !x.topicIds.includes('thema.ph.medikamente')).map((x) => x.id)).toEqual([]);
    expect(d.filter((x) => !x.sources.length || x.sources.some((q) => !q.url.startsWith('https://'))).map((x) => x.id)).toEqual([]);
    expect(d.every((x) => x.pruefstatus === 'ungeprueft')).toBe(true);
    // Handelsnamen nur einmal, sonst ist die Karte „Handelsname → Wirkstoff“ mehrdeutig
    const handel = d.flatMap((x) => x.brandNames ?? []).map((n) => n.toLowerCase());
    expect(new Set(handel).size).toBe(handel.length);
  });

  it('kennzeichnet Katalogdefinitionen als ergänzendes Wissen', () => {
    expect(m.glossary.every((g) => g.origin === 'katalog' || g.citation)).toBe(true);
  });
});
