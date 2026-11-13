import { describe, expect, it } from 'vitest';
import { formFehler } from '../../../ui/sim/zustand';
import { staender, SZENARIEN, VERWURF } from './entnahme';
import { ENTNAHME_SCHRITTE, entnahmeZustand, type EntnahmeStand } from './zustand';

const basis = (i = 0): EntnahmeStand => {
  const sz = SZENARIEN[i]!;
  return { sz, schritt: 'identitaet', stauSek: 0, stauAngelegt: false, stauGeloest: false, regal: staender(sz, () => 0.3), folge: [] };
};

describe('Zustandstafel an der Blutentnahme-Station', () => {
  it('ist für jede Situation und jeden Schritt gültig', () => {
    SZENARIEN.forEach((_, i) => {
      for (const schritt of ENTNAHME_SCHRITTE) {
        const z = entnahmeZustand({ ...basis(i), schritt, identitaet: 'offen', arm: 'rechts', stauAngelegt: true, stauSek: 30 });
        expect(formFehler(z)).toEqual([]);
        expect(z.aufgaben).toHaveLength(6);
      }
    });
  });

  it('warnt erst, wenn der Stau länger als 60 Sekunden liegt', () => {
    const b = { ...basis(), schritt: 'roehrchen' as const, stauAngelegt: true };
    expect(entnahmeZustand({ ...b, stauSek: 45 }).alarme).toEqual([]);
    expect(entnahmeZustand({ ...b, stauSek: 75 }).alarme[0]!.stufe).toBe('achtung');
    expect(entnahmeZustand({ ...b, stauSek: 75, stauGeloest: true }).alarme).toEqual([]);
  });

  it('zeigt gefüllte Röhrchen mit Nummer, bewertet die Reihenfolge aber nicht', () => {
    const b = basis();
    const [erstes, zweites] = b.regal.filter((p) => p !== VERWURF);
    const z = entnahmeZustand({ ...b, schritt: 'roehrchen', stauAngelegt: true, folge: [erstes!], aktiv: zweites ? { platz: zweites, stand: 0.4 } : undefined });
    expect(z.material.find((m) => m.id === `roehrchen:${erstes}`)!.wert).toBe('gefüllt als 1.');
    if (zweites) expect(z.geraete.find((g) => g.id === 'halter')!.wert).toContain('40 %');
    expect(z.aufgaben.find((a) => a.id === 'roehrchen')!.hinweis).toMatch(/^1 von \d+ gefüllt$/);
    expect(z.material.every((m) => m.stufe !== 'kritisch' && m.stufe !== 'achtung')).toBe(true);
  });
});
