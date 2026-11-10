import { describe, expect, it } from 'vitest';
import { ctSchicht, grauTabelle, mittelwert, rohZuHu, roentgenThorax } from './phantom';

describe('Phantome', () => {
  it('CT liefert plausible Dichten (Luft, Lunge, Weichteil, Knochen)', () => {
    const b = ctSchicht(0.6, 'normal', 160);
    expect(rohZuHu(mittelwert(b, 0.03, 0.03, 0.02))).toBeLessThan(-900); // Luft außerhalb
    expect(rohZuHu(mittelwert(b, 0.28, 0.45, 0.04))).toBeLessThan(-600); // rechte Lunge
    expect(rohZuHu(mittelwert(b, 0.5, 0.73, 0.03))).toBeGreaterThan(200); // Wirbelkörper
  });
  it('ist deterministisch', () => {
    expect(ctSchicht(0.5, 'pneumonie', 64).werte).toEqual(ctSchicht(0.5, 'pneumonie', 64).werte);
    expect(roentgenThorax('stauung', 64).werte).toEqual(roentgenThorax('stauung', 64).werte);
  });
  it('Fensterung bildet Grenzen auf Schwarz und Weiß ab', () => {
    const lut = grauTabelle('ct', { mitte: 40, breite: 400 });
    expect(lut[-160 + 1024 - 1]).toBe(0);
    expect(lut[240 + 1024 + 1]).toBe(255);
  });
});
