import { describe, expect, it } from 'vitest';
import { auswerten, hinweise, medikamentHinweis, rate, richtigeEntscheidung, SZENARIEN } from './rea';
import { kurve } from './rhythmus';

const serie = (start: number, n: number, abstand: number) => Array.from({ length: n }, (_, i) => start + i * abstand);

describe('Reanimationsübung', () => {
  it('misst die Rate aus den letzten Kompressionen', () => {
    expect(rate(serie(0, 10, 545))).toBe(110);
    expect(rate(serie(0, 2, 545))).toBeNull();
    // nach einer Pause zählt nur die neue Serie
    expect(rate([...serie(0, 10, 1000), ...serie(20000, 5, 500)])).toBe(120);
  });
  it('wertet Takt, Kompressionsanteil und Pausen aus', () => {
    const taps = [...serie(5000, 30, 545), ...serie(5000 + 29 * 545 + 6000, 30, 545)];
    const a = auswerten({ start: 0, ende: taps.at(-1)! + 500, taps, entscheidungen: [true, false], falscheSchritte: 1 });
    expect(a.bisDruck).toBe(5);
    expect(a.mittel).toBe(110);
    expect(a.imZiel).toBe(1);
    expect(a.laengstePause).toBe(6);
    expect(a.ccf).toBeGreaterThan(0.75); expect(a.ccf).toBeLessThan(0.85);
    const h = hinweise(a);
    expect(h.some(x => x.includes('Rhythmusanalysen'))).toBe(true);
    expect(h.some(x => x.includes('Umweg'))).toBe(true);
  });
  it('zu langsames Drücken wird erkannt', () => {
    const a = auswerten({ start: 0, ende: 20000, taps: serie(1000, 20, 800), entscheidungen: [], falscheSchritte: 0 });
    expect(a.mittel).toBe(75);
    expect(hinweise(a)[0]).toMatch(/zu langsam/);
  });
  it('Rhythmen: nur Kammerflimmern ist schockbar, PEA und Sinus sind organisiert', () => {
    expect(richtigeEntscheidung('kammerflimmern')).toBe('schockbar');
    expect(richtigeEntscheidung('asystolie')).toBe('nicht-schockbar');
    expect(richtigeEntscheidung('pea')).toBe('organisiert');
    for (const s of SZENARIEN) expect(s.analysen.at(-1)).toBe('sinus');
  });
  it('Medikamente nach ERC: Adrenalin früh bei nicht schockbar, nach dem 3. Schock Adrenalin und Amiodaron', () => {
    expect(medikamentHinweis(['asystolie'], 0)).toMatch(/Adrenalin 1 mg/);
    expect(medikamentHinweis(['kammerflimmern'], 2)).toBeNull();
    expect(medikamentHinweis(['kammerflimmern'], 3)).toMatch(/Amiodaron 300 mg/);
  });
  it('Kurven bleiben im Bildbereich', () => {
    for (const r of ['kammerflimmern', 'asystolie', 'pea', 'sinus'] as const) for (let t = 0; t < 10; t += 0.013) expect(Math.abs(kurve(r, t))).toBeLessThan(1.3);
  });
});
