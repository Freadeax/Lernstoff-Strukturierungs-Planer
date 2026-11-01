import { describe, expect, it } from 'vitest';
import { pflegeModule } from '../../modules/pflege';
import { SCENARIOS } from './catalog';
import { PRAXIS_THEMEN, praxisZuThema } from './themen';

describe('Praxisfälle und Lernthemen', () => {
  const eltern = new Set(pflegeModule.topics.map((t) => t.parentId));
  const ids = new Set(pflegeModule.topics.map((t) => t.id));

  it('ordnet jedem Fall mindestens zwei Blatt-Themen zu', () => {
    for (const s of SCENARIOS) {
      const themen = PRAXIS_THEMEN[s.id];
      expect(themen?.length, s.id).toBeGreaterThanOrEqual(2);
      for (const t of themen!) {
        expect(ids.has(t), `${s.id}: ${t}`).toBe(true);
        expect(eltern.has(t), `${s.id}: ${t} ist kein Blatt`).toBe(false);
      }
    }
    expect(Object.keys(PRAXIS_THEMEN).every((id) => SCENARIOS.some((s) => s.id === id))).toBe(true);
  });

  it('findet Fälle zu einem Thema', () => {
    expect(praxisZuThema('thema.pro.thrombose', SCENARIOS).map((s) => s.id)).toEqual(['lungenembolie']);
    expect(praxisZuThema('thema.gibt.es.nicht', SCENARIOS)).toEqual([]);
  });
});
