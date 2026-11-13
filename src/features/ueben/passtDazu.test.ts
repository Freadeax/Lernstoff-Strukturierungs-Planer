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

import { passtDazuId, LERNSEITEN } from '../../ui/shell/nav';
import { letztesThema, merkeThema } from '../thema/letztesThema';
import { vi } from 'vitest';

describe('Passt dazu auf Lern- und Materialseiten', () => {
  it('jede Lernseite hat ein Ziel und einen Menüeintrag', () => {
    for (const id of LERNSEITEN) {
      const p = passtDazu(id);
      expect(p.weiter.length, id).toBeGreaterThanOrEqual(2);
    }
    expect(passtDazuId('/lernen/karten')).toBe('karten');
    expect(passtDazuId('/material/dokumente')).toBe('dokumente');
    expect(passtDazuId('/')).toBeUndefined();
    expect(passtDazuId('/lernen/plan')).toBeUndefined();
  });
});

describe('Zurück zum Thema', () => {
  it('merkt das Thema nur für kurze Zeit', () => {
    const m = new Map<string, string>();
    vi.stubGlobal('sessionStorage', { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) });
    expect(letztesThema()).toBeUndefined();
    merkeThema('t1', 'Diabetes', 1000);
    expect(letztesThema(2000)?.name).toBe('Diabetes');
    expect(letztesThema(1000 + 4 * 3600_000)).toBeUndefined();
    vi.unstubAllGlobals();
  });
});
