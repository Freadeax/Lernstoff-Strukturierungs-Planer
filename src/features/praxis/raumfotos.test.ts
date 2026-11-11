import { describe, expect, it } from 'vitest';
import { SCENARIOS } from './catalog';
import { RAUM_ELEMENTE } from './raum';
import { bildFuer, FALL_RAUM, RAUMFOTOS, raumFotoFuer } from './raumfotos';

describe('Raumfotos', () => {
  it('jeder Fall hat einen Raum', () => {
    for (const s of SCENARIOS) expect(raumFotoFuer(s.id), s.id).toBeDefined();
    for (const id of Object.keys(FALL_RAUM)) expect(SCENARIOS.some(s => s.id === id), id).toBe(true);
  });
  it('alle Orte und Details liegen im Bild', () => {
    for (const [k, r] of Object.entries(RAUMFOTOS)) {
      for (const e of RAUM_ELEMENTE) {
        const p = r.orte[e];
        expect(p.x, `${k}/${e}`).toBeGreaterThanOrEqual(0); expect(p.x).toBeLessThanOrEqual(100);
        expect(p.y, `${k}/${e}`).toBeGreaterThanOrEqual(0); expect(p.y).toBeLessThanOrEqual(100);
      }
      if (r.bildschirm) { expect(r.bildschirm.x + r.bildschirm.width).toBeLessThanOrEqual(1); expect(r.bildschirm.y + r.bildschirm.height).toBeLessThanOrEqual(1); }
    }
  });
  it('Kardiologie zeigt ohne Monitoring die Variante ohne Gerät', () => {
    expect(bildFuer(RAUMFOTOS.kardiologie!, false)).toBe('12a_station_kardiologie_ohne_monitor');
    expect(bildFuer(RAUMFOTOS.kardiologie!, true)).toBe('12_station_kardiologie_monitoring');
    expect(bildFuer(RAUMFOTOS.intensiv!, false)).toBe('15_intensiv_beatmung');
  });
});
