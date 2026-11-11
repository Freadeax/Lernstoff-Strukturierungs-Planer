import { describe, expect, it } from 'vitest';
import { SCENARIOS } from './catalog';
import { falltiefe, falltiefeText } from './falltiefe';

describe('Falltiefe vor dem Start', () => {
  it('zählt jeden Fall aus seinen Daten', () => {
    for (const sc of SCENARIOS) {
      const t = falltiefe(sc);
      expect(t.handlungen, sc.id).toBe(sc.actions.length);
      expect(t.kriterien, sc.id).toBe(sc.criteria.length);
      expect(t.entscheidungen, sc.id).toBeLessThanOrEqual(t.ereignisse);
      expect(falltiefeText(t), sc.id).toMatch(/Bewertungskriteri/);
    }
  });
  it('Kernfälle mit Ketten heißen Kernfall', () => {
    const kern = SCENARIOS.filter(sc => sc.chains?.length);
    expect(kern.length).toBeGreaterThan(0);
    for (const sc of kern) expect(falltiefe(sc).stufe).toBe('kernfall');
  });
  it('Singular und Plural', () => {
    expect(falltiefeText({ stufe: 'verlaufsfall', handlungen: 3, medikamente: 1, ereignisse: 1, entscheidungen: 1, ketten: 0, kriterien: 1, ablenkung: true }))
      .toBe('Verlaufsfall · 1 Ereignis, 1 Entscheidung · 1 Bewertungskriterium · 1 Medikament · mit Störungen');
  });
});
