import { describe, expect, it } from 'vitest';
import { herzThoraxQuotient, huDeutung, roiStatistik, streckeMm, streckePx } from './messen';
import { ctSchicht, roentgenThorax } from './phantom';

describe('Messwerkzeuge', () => {
  it('Strecke in Pixeln und mm', () => {
    const bild = { breite: 200, hoehe: 100 };
    expect(streckePx(bild, { x: 0, y: 0 }, { x: 0.5, y: 0 })).toBe(100);
    expect(streckePx(bild, { x: 0, y: 0 }, { x: 0, y: 1 })).toBe(100);
    expect(streckeMm(bild, { x: 0, y: 0 }, { x: 0.5, y: 0 }, 0.7)).toBeCloseTo(70);
    expect(streckeMm(bild, { x: 0, y: 0 }, { x: 0.5, y: 0 })).toBeUndefined();
  });
  it('ROI misst Luft außen, Lunge und Knochen im CT-Phantom', () => {
    const b = ctSchicht(0.6, 'normal', 160);
    const luft = roiStatistik(b, 'ct', 0.04, 0.04, 0.025);
    expect(luft.mittel).toBeLessThan(-900);
    expect(luft.pixel).toBeGreaterThan(5);
    expect(roiStatistik(b, 'ct', 0.28, 0.45, 0.04).mittel).toBeLessThan(-600);
    const knochen = roiStatistik(b, 'ct', 0.5, 0.73, 0.02);
    expect(knochen.mittel).toBeGreaterThan(200);
    expect(knochen.max).toBeGreaterThanOrEqual(knochen.mittel);
    expect(roiStatistik(b, 'ct', 0.5, 0.5, 0.05, 1).flaecheMm2).toBeGreaterThan(0);
  });
  it('Herz-Thorax-Quotient: Stauung über 0,5, normal darunter', () => {
    expect(herzThoraxQuotient([{ a: { x: 0.1 }, b: { x: 0.9 } }, { a: { x: 0.36 }, b: { x: 0.64 } }])).toBeCloseTo(0.35);
    expect(herzThoraxQuotient([{ a: { x: 0.1 } , b: { x: 0.9 } }])).toBeUndefined();
  });
  it('Röntgen-Phantom: Herz bei Stauung breiter', () => {
    // waagrechte Profilzeile auf Herzhöhe: helle Pixel im Mittelfeld zählen
    const breite = (v: 'normal' | 'stauung') => {
      const b = roentgenThorax(v, 120), y = Math.round(0.62 * 120);
      let n = 0;
      for (let x = 20; x < 100; x++) if (b.werte[y * 120 + x]! > 0.55 * 4095) n++;
      return n;
    };
    expect(breite('stauung')).toBeGreaterThan(breite('normal'));
  });
  it('HU-Deutung', () => {
    expect(huDeutung(-1000)).toBe('Luft');
    expect(huDeutung(5)).toMatch(/Wasser/);
    expect(huDeutung(250)).toMatch(/Kontrast/);
  });
});
