import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ALT_ARCHIV_KEY, ALT_ZU_NEU, ALTFALL_TITEL, altesArchiv, neuerFall } from './altfaelle';
import { FAELLE_V2 } from './kern/faelle';

describe('Ablösung der alten Praxisfälle (P10)', () => {
  const kernIds = FAELLE_V2.map((f) => f.id);
  beforeEach(() => {
    const m = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) });
  });

  it('jeder alte Fall hat einen Nachfolger auf dem neuen Kern', () => {
    expect(Object.keys(ALTFALL_TITEL)).toHaveLength(21);
    for (const id of Object.keys(ALTFALL_TITEL)) expect(kernIds, id).toContain(ALT_ZU_NEU[id]);
    expect(Object.keys(ALT_ZU_NEU).sort()).toEqual(Object.keys(ALTFALL_TITEL).sort());
  });

  it('übersetzt alte IDs, lässt neue durch und verwirft Unbekanntes', () => {
    expect(neuerFall('asthma', kernIds)).toBe('paed-asthma-schulkind');
    expect(neuerFall('nachtwache', kernIds)).toBe('kh-pneumonie-sepsis');
    expect(neuerFall('kh-delir-nacht', kernIds)).toBe('kh-delir-nacht');
    expect(neuerFall('gibtsnicht', kernIds)).toBeUndefined();
    expect(neuerFall('', kernIds)).toBeUndefined();
  });

  it('liest das alte Archiv schreibgeschützt und robust', () => {
    expect(altesArchiv()).toEqual([]);
    localStorage.setItem(ALT_ARCHIV_KEY, JSON.stringify([{ id: 'a1', time: 754, phase: 'finished', scenario: { id: 'sepsis', title: 'Gestern war sie noch klar' } }, { kaputt: true }]));
    expect(altesArchiv()).toEqual([{ id: 'a1', fall: 'sepsis', titel: 'Gestern war sie noch klar', sekunden: 754, fertig: true }]);
    localStorage.setItem(ALT_ARCHIV_KEY, '{kein json');
    expect(altesArchiv()).toEqual([]);
  });
});
