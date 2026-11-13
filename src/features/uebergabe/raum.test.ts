import { describe, expect, it } from 'vitest';
import { RAEUME } from '../../ui/sim/raeume/katalog';
import { FAELLE } from './faelle';
import { raumFuer, UEBERGABE_RAUM, vorlesetext } from './raum';

describe('Übergabe am Bett', () => {
  it('jeder eingetragene Raum existiert im Bildpaket', () => {
    for (const id of Object.values(UEBERGABE_RAUM)) expect(RAEUME[id], id).toBeDefined();
  });
  it('die eigenen Übungsfälle haben ein Raumfoto', () => {
    for (const f of FAELLE.filter((x) => x.id in UEBERGABE_RAUM)) expect(raumFuer(f)).toBeDefined();
    expect(Object.keys(UEBERGABE_RAUM).every((id) => FAELLE.some((f) => f.id === id))).toBe(true);
  });
  it('liest Lage und Daten vor', () => {
    const f = FAELLE.find((x) => x.id === 'sepsis')!;
    const t = vorlesetext(f);
    expect(t).toContain(f.lage);
    expect(t).toContain('Penicillin');
    expect(t).not.toMatch(/\.\./);
  });
});
