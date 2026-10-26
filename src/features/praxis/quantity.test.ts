import { describe, expect, it } from 'vitest';
import { correctVolume, decimalEqual, requiredVolume } from './quantity';
describe('Einheitengebundene Dosis-/Volumen-Rechenprüfung', () => {
  it.each([[40, 10, '4.00'], [0.1, 0.2, '0.50'], [1, 3, '0.33'], [1, 8, '0.13'], [500, 100, '5.00']])('berechnet %s mg bei %s mg/ml exakt und rundet ausdrücklich', (dose, concentration, ml) => {
    expect(requiredVolume(dose, concentration)).toBe(ml);
  });
  it('akzeptiert Dezimalkomma und gleichwertige dezimale Darstellung', () => {
    expect(decimalEqual('0,10', '0.1')).toBe(true); expect(requiredVolume('0,1', '0,2')).toBe('0.50');
  });
  it('verweigert Nullkonzentration, Vorzeichen, NaN und unkontrollierte Präzision', () => {
    for (const value of [0, -1, NaN, Infinity, 0.00000001]) expect(() => requiredVolume(40, value)).toThrow();
    expect(decimalEqual(NaN, 0)).toBe(false); expect(correctVolume(4.01, 40, 10)).toBe(false);
    expect(correctVolume(0, 40, 10)).toBe(false); expect(correctVolume(4, 40, 10)).toBe(true);
  });
});
