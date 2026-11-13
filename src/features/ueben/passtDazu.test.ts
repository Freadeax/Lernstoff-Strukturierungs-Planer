import { describe, expect, it } from 'vitest';
import { passtDazu, uebungsSeiten } from './passtDazu';
import { uebungsId } from '../../ui/shell/nav';

describe('Passt dazu', () => {
  it('erscheint auf jeder Übungsseite, nicht auf der Übersicht', () => {
    expect(uebungsId('/lernen/ueben')).toBeUndefined();
    expect(uebungsId('/lernen/normwerte')).toBe('normwerte');
    expect(uebungsId('/lernen/karten')).toBeUndefined();
  });
  it('führt von jeder Übung irgendwohin weiter, nie auf sich selbst', () => {
    for (const [pfad, id] of uebungsSeiten()) {
      const p = passtDazu(id);
      const ziele = [...p.verwandt, ...p.weiter];
      expect(ziele.length, id).toBeGreaterThan(0);
      expect(ziele.length, id).toBeLessThanOrEqual(5);
      for (const z of ziele) expect(z.path.split('?')[0], id).not.toBe(pfad);
      expect(new Set(ziele.map((z) => z.path)).size, id).toBe(ziele.length);
    }
  });
  it('leitet verwandte Übungen und Themen aus gemeinsamen Themen ab', () => {
    const p = passtDazu('normwerte');
    expect(p.themen.length).toBeGreaterThan(0);
    expect(p.verwandt.length).toBeGreaterThan(0);
    expect(p.weiter.map((w) => w.path)).toContain('/lernen/fehler');
  });
});
