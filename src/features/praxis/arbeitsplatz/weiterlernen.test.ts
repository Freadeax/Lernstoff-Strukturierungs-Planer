import { describe, expect, it } from 'vitest';
import { pflegeModule } from '../../../modules/pflege';
import { FAELLE_V2 } from '../kern/faelle';
import { WEITERLERNEN_V2 } from './weiterlernen';

describe('Weiterlernen nach Fällen des neuen Arbeitsplatzes', () => {
  const eltern = new Set(pflegeModule.topics.map((t) => t.parentId));
  const ids = new Set(pflegeModule.topics.map((t) => t.id));
  it('jeder Fall hat mindestens zwei Blatt-Themen und gültige Verweise', () => {
    for (const f of FAELLE_V2) {
      const e = WEITERLERNEN_V2[f.id];
      expect(e, f.id).toBeDefined();
      expect(e!.themen.length).toBeGreaterThanOrEqual(2);
      for (const t of e!.themen) { expect(ids.has(t), t).toBe(true); expect(eltern.has(t), `${t} ist kein Blatt`).toBe(false); }
      for (const k of e!.krankheiten) expect(k.startsWith('kh.')).toBe(true);
    }
    expect(Object.keys(WEITERLERNEN_V2).every((id) => FAELLE_V2.some((f) => f.id === id))).toBe(true);
  });
});
