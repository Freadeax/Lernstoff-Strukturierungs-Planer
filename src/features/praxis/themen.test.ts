import { describe, expect, it } from 'vitest';
import { pflegeModule } from '../../modules/pflege';
import { FAELLE_V2 } from './kern/faelle';
import { KERN_THEMEN, kernZuThema } from './themen';

describe('Praxisfälle und Lernthemen', () => {
  const eltern = new Set(pflegeModule.topics.map((t) => t.parentId));
  const ids = new Set(pflegeModule.topics.map((t) => t.id));

  it('ordnet jedem Kernfall mindestens zwei Blatt-Themen zu', () => {
    for (const f of FAELLE_V2) {
      const themen = KERN_THEMEN[f.id];
      expect(themen?.length, f.id).toBeGreaterThanOrEqual(2);
      for (const t of themen!) {
        expect(ids.has(t), `${f.id}: ${t}`).toBe(true);
        expect(eltern.has(t), `${f.id}: ${t} ist kein Blatt`).toBe(false);
      }
    }
  });

  it('findet Fälle zu einem Thema', () => {
    expect(kernZuThema('thema.pro.thrombose')).toContain('kh-lungenembolie');
    expect(kernZuThema('thema.gibt.es.nicht')).toEqual([]);
  });
});
