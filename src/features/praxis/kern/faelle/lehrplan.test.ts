import { describe, expect, it } from 'vitest';
import { LEHRPLAN } from '../../../ce/lehrplan';
import modul from '../../../../modules/pflege/pflege-generalistisch.json';
import { FAELLE_V2 } from './index';

const THEMEN = new Set((modul as { topics: Array<{ id: string }> }).topics.map((t) => t.id));
const KOMPETENZ = /^(I|II|III|IV|V)\.\d\.[a-z]$/;

describe('Fälle: Einordnung nach Landeslehrplan BW (P15)', () => {
  for (const f of FAELLE_V2) {
    it(`${f.id}: CE, Abschnitt, Themen gültig`, () => {
      expect(f.lehrplan, 'lehrplan fehlt').toBeDefined();
      const l = f.lehrplan!;
      expect(l.ce.length).toBeGreaterThan(0);
      for (const ce of l.ce) expect(LEHRPLAN[ce], ce).toBeDefined();
      expect(l.abschnitt.length).toBeGreaterThan(0);
      for (const a of l.abschnitt) for (const ce of l.ce.slice(0, 1)) expect(LEHRPLAN[ce]!.stunden[a], `${ce} hat keine Stunden in ${a}`).toBeDefined();
      for (const t of l.themen ?? []) expect(THEMEN.has(t), t).toBe(true);
      for (const k of l.kompetenzen ?? []) expect(k).toMatch(KOMPETENZ);
      // 3. Drittel nur, wenn die Rolle auch spielbar ist
      if (l.abschnitt.includes('ad3')) expect(f.geeignet.rollen.some((r) => r === 3 || r === 'pflegefachperson')).toBe(true);
    });
  }
});
