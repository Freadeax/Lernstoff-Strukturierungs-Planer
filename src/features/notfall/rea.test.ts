import { describe, expect, it } from 'vitest';
import { freigabeFehler } from '../../ui/sim/freigabe';
import { KLANG } from '../../ui/audio/klaenge';
import { LEITLINIEN, PROFIL_FREIGABE } from './freigaben';
import { auswerten, beendetKompression, hinweise, medikamentHinweis, PROFIL_IDS, PROFILE, rate, richtigeEntscheidung, schockEnergie, szenarienFuer, SZENARIEN } from './rea';
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
    for (const s of SZENARIEN) expect(beendetKompression(s.analysen.at(-1)!), s.id).toBe(true);
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

describe('Getrennte Profile Erwachsene, Kinder, Neugeborene (Audit Notfall-Trainer)', () => {
  it('jedes Profil hat Szenarien, eigenen Ablauf, vollständige Freigabe und Leitlinienstand', () => {
    for (const p of PROFIL_IDS) {
      expect(szenarienFuer(p).length, p).toBeGreaterThan(0);
      expect(PROFILE[p].erkennen.at(-1)!.id, p).toBe('druecken');
      expect(freigabeFehler(PROFIL_FREIGABE[p]), p).toEqual([]);
      expect(PROFIL_FREIGABE[p].zielgruppe).toBe(p);
      expect(LEITLINIEN[p].every(q => q.stand), p).toBe(true);
      expect(PROFIL_FREIGABE[p].pruefpunkte.some(x => x.includes('2025')), p).toBe(true);
    }
  });
  it('Verhältnisse: 30:2, 15:2 mit 5 Initialbeatmungen, 3:1 nach Blähbeatmung', () => {
    expect([PROFILE.erwachsene.druck, PROFILE.erwachsene.beatmung]).toEqual([30, 2]);
    expect([PROFILE.kinder.druck, PROFILE.kinder.beatmung]).toEqual([15, 2]);
    expect(PROFILE.kinder.erkennen.findIndex(s => s.id === 'initial')).toBeLessThan(PROFILE.kinder.erkennen.findIndex(s => s.id === 'druecken'));
    expect([PROFILE.neugeborene.druck, PROFILE.neugeborene.beatmung]).toEqual([3, 1]);
    expect(PROFILE.neugeborene.erkennen.map(s => s.id)).toEqual(['waerme', 'beurteilen', 'atemweg', 'blaehen', 'beatmen', 'druecken']);
    expect(PROFILE.neugeborene.defi).toBe(false);
    expect(PROFILE.neugeborene.zyklusSek).toBe(30);
  });
  it('Ablenker unterscheiden sich von den richtigen Schritten', () => {
    for (const p of PROFIL_IDS) for (const a of PROFILE[p].ablenker) expect(PROFILE[p].erkennen.some(e => e.id === a.id || e.label === a.label), `${p}:${a.id}`).toBe(false);
  });
  it('Neugeborene: Herzfrequenz-Bänder und Ende der Kompressionen ab 60/min', () => {
    expect(richtigeEntscheidung(40)).toBe('hf-unter-60');
    expect(richtigeEntscheidung(60)).toBe('hf-60-100');
    expect(richtigeEntscheidung(100)).toBe('hf-60-100');
    expect(richtigeEntscheidung(101)).toBe('hf-ueber-100');
    expect(beendetKompression(59)).toBe(false); expect(beendetKompression(60)).toBe(true);
    for (const s of szenarienFuer('neugeborene')) for (const a of s.analysen) expect(typeof a).toBe('number');
  });
  it('3:1 im Takt: Kompressionen und Beatmungen mit etwa 120/min liegen im Ziel, 30:2-Ziel nicht', () => {
    const taps = serie(1000, 60, 500);
    expect(auswerten({ start: 0, ende: taps.at(-1)! + 400, taps, entscheidungen: [true], falscheSchritte: 0, ziel: PROFILE.neugeborene.ziel }).imZiel).toBe(1);
    expect(auswerten({ start: 0, ende: taps.at(-1)! + 400, taps, entscheidungen: [true], falscheSchritte: 0 }).imZiel).toBe(1);
    const schnell = serie(1000, 40, 420); // ~143/min
    const a = auswerten({ start: 0, ende: schnell.at(-1)! + 400, taps: schnell, entscheidungen: [false], falscheSchritte: 1, ziel: PROFILE.neugeborene.ziel });
    const h = hinweise(a, PROFILE.neugeborene);
    expect(h.some(x => x.includes('zu schnell') && x.includes('Ereignisse/min'))).toBe(true);
    expect(h.some(x => x.includes('Herzfrequenzen falsch'))).toBe(true);
    expect(h.some(x => x.includes('Blähbeatmungen'))).toBe(true);
  });
  it('Kinder: Dosen und Energie nach Gewicht', () => {
    expect(medikamentHinweis(['asystolie'], 0, 'kinder', 22)).toMatch(/10 µg\/kg.*220 µg/);
    expect(medikamentHinweis(['kammerflimmern'], 3, 'kinder', 30)).toMatch(/Amiodaron 5 mg\/kg \(bei 30 kg 150 mg\)/);
    expect(schockEnergie('kinder', 30)).toMatch(/120 J/);
    expect(medikamentHinweis([40, 50], 0, 'neugeborene', 3)).toMatch(/20 µg\/kg.*60 µg/);
    expect(medikamentHinweis([40], 0, 'neugeborene', 3)).toBeNull();
  });
  it('Timer und Töne: Zykluszeiten sinnvoll, verwendete Klänge existieren im Audio-Baustein', () => {
    for (const p of PROFIL_IDS) { expect(PROFILE[p].kurzSek).toBeLessThanOrEqual(PROFILE[p].zyklusSek); expect(PROFILE[p].kurzSek).toBeGreaterThanOrEqual(20); }
    for (const id of ['klick', 'rea-alarm', 'defi', 'richtig']) expect(KLANG, id).toHaveProperty(id);
  });
});
