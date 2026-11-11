import { describe, expect, it } from 'vitest';
import { RAEUME } from '../../ui/sim/raeume/katalog';
import { SCENARIOS } from './catalog';
import { RAUM_ELEMENTE } from './raum';
import { FALL_RAUM, RAUMFOTOS, raumFotoFuer } from './raumfotos';

describe('Raumfotos', () => {
  it('jeder Fall hat einen Raum aus dem gemeinsamen Katalog', () => {
    for (const s of SCENARIOS) expect(raumFotoFuer(s.id), s.id).toBeDefined();
    for (const id of Object.keys(FALL_RAUM)) expect(SCENARIOS.some(s => s.id === id), id).toBe(true);
    for (const r of Object.values(RAUMFOTOS)) expect(RAEUME[r.id], r.id).toBeDefined();
  });
  it('alle Orte und Details liegen im Bild', () => {
    for (const [k, r] of Object.entries(RAUMFOTOS)) {
      for (const e of RAUM_ELEMENTE) {
        const p = r.orte[e];
        expect(p.x, `${k}/${e}`).toBeGreaterThanOrEqual(0); expect(p.x).toBeLessThanOrEqual(100);
        expect(p.y, `${k}/${e}`).toBeGreaterThanOrEqual(0); expect(p.y).toBeLessThanOrEqual(100);
      }
    }
  });
  it('kein Punkt verdeckt den Live-Monitor', () => {
    for (const [k, r] of Object.entries(RAUMFOTOS)) {
      const m = RAEUME[r.id].monitor; if (!m) continue;
      for (const p of [...Object.values(r.orte), ...(r.details ?? []).map(d => d.punkt)]) {
        const drin = p.x / 100 > m.x && p.x / 100 < m.x + m.width && p.y / 100 > m.y && p.y / 100 < m.y + m.height;
        expect(drin, `${k} ${p.x}/${p.y}`).toBe(false);
      }
    }
  });
});
