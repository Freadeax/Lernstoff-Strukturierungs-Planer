import { describe, expect, it } from 'vitest';
import { RAEUME } from '../../ui/sim/raeume/katalog';
import { SUCHBILDER } from './suchbilder';

describe('Hygiene-Suchbilder', () => {
  it('jede Fundstelle hat einen Hotspot im Raumfoto', () => {
    for (const s of SUCHBILDER) for (const f of s.funde) {
      expect(RAEUME[s.raum].hotspots.some((h) => h.id === f.id), `${s.id}/${f.id}`).toBe(true);
      expect(f.text.length).toBeGreaterThan(40);
    }
  });
});
