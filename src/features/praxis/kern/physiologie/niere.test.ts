import { describe, expect, it } from 'vitest';
import { NORMAL } from '../modell';
import type { AktiverTreiber, Altersgruppe, Grundgroessen, Treiber } from '../typen';
import * as spurB from '../spur-b/modul';
import { antidiurese, BLASE_ENTLEERUNG_ML, blaseNaechste, laktatZiel, stundenurin, urinFarbe, urinMlH } from './niere';
import { PFLEGE_MODELL, ruheAnzeige } from './pflegemodell';

function lauf(ag: Altersgruppe, minuten: number, treiber: Treiber[] = [], start: Partial<Grundgroessen> = {}) {
  const basis = { ...NORMAL, ...start };
  let g = { ...basis };
  const tr: AktiverTreiber[] = treiber.map((t) => ({ ...t, seit: 0 }));
  for (let t = 0; t < minuten * 60; t += 5) g = PFLEGE_MODELL.naechster(g, tr, 5, { altersgruppe: ag, t, basis });
  return { g, a: PFLEGE_MODELL.anzeige(g, { altersgruppe: ag, t: minuten * 60, basis }) };
}

describe('G2 Niere und Ausscheidung', () => {
  it('Spur B rechnet mit dem Re-Export exakt wie vorher (gleiche Funktion, gleiche Werte)', () => {
    expect(spurB.urinMlH).toBe(urinMlH);
    expect(spurB.laktatZiel).toBe(laktatZiel);
    // frühere Formel aus spur-b/modul.ts (bis PR G2), Wert für Wert
    const begrenze = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
    const alt = (map: number, vol: number, kg: number) => Math.round(kg * begrenze((map - 50) / 25, 0, 1.2) * begrenze((vol - 0.6) / 0.4, 0, 1.2) * 10) / 10;
    const altLaktat = (map: number, perf: number, spo2: number, sepsis = 0) =>
      1 + 0.12 * Math.max(0, 65 - map) + 4 * Math.max(0, 0.85 - perf) + 0.15 * Math.max(0, 88 - spo2) + 1.2 * Math.min(1.5, sepsis) * begrenze((75 - map) / 15, 0, 1.5);
    for (const map of [0, 40, 55, 65, 80, 110]) for (const vol of [0.5, 0.8, 1, 1.3]) for (const kg of [6, 30, 75]) {
      expect(spurB.urinMlH(map, vol, kg)).toBe(alt(map, vol, kg));
      expect(spurB.laktatZiel(map, vol, 90, 1)).toBe(altLaktat(map, vol, 90, 1));
    }
  });

  it('Ruhe: etwa 1 ml/kg/h, heller Urin', () => {
    const a = ruheAnzeige('erwachsen');
    expect(a.urinMlH).toBeGreaterThanOrEqual(60);
    expect(a.urinMlH).toBeLessThanOrEqual(110);
    expect(a.urinFarbe).toBeLessThanOrEqual(3);
  });

  it('Exsikkose: wenig, dunkler Urin (ADH), bevor der Blutdruck fällt', () => {
    const r = lauf('hochbetagt', 120, [{ art: 'exsikkose_progressiv', verlustProStunde: 0.06 }]);
    expect(r.g.hydratation).toBeLessThan(0.9);
    expect(r.a.urinMlH!).toBeLessThan(ruheAnzeige('hochbetagt').urinMlH! * 0.6);
    expect(r.a.urinFarbe!).toBeGreaterThanOrEqual(5);
    expect(antidiurese(0.75)).toBeLessThan(antidiurese(1));
  });

  it('Schock: Oligurie unter 0,5 ml/kg/h', () => {
    expect(stundenurin(55, 0.75, 0.9, 75)).toBeLessThan(0.5 * 75);
  });

  it('Furosemid: mehr Urin, hellere Farbe, Kalium sinkt', () => {
    const ohne = lauf('erwachsen', 60);
    const mit = lauf('erwachsen', 60, [{ art: 'wirkstoff', id: 'furosemid', dosisMg: 40, weg: 'iv' }]);
    expect(mit.a.urinMlH!).toBeGreaterThan(ohne.a.urinMlH! + 150);
    expect(mit.a.urinFarbe!).toBeLessThanOrEqual(ohne.a.urinFarbe!);
    expect(mit.a.kalium!).toBeLessThan(4.2);
  });

  it('Urinfarbe 1–8 nach Konzentration', () => {
    expect(urinFarbe(1.05, 150, 75)).toBe(1);
    expect(urinFarbe(0.7, 10, 75)).toBe(8);
  });

  it('Blase: entleert sich ohne Hindernis, füllt sich bei Harnverhalt; Katheter beendet den Harnverhalt', () => {
    expect(blaseNaechste(BLASE_ENTLEERUNG_ML - 1, 3600, 5, false)).toBe(30);
    expect(blaseNaechste(BLASE_ENTLEERUNG_ML - 1, 3600, 5, true)).toBeGreaterThan(BLASE_ENTLEERUNG_ML);
    const verhalt = lauf('hochbetagt', 120, [{ art: 'harnverhalt' }], { blaseMl: 300 });
    expect(verhalt.a.blaseMl!).toBeGreaterThan(400);
    const frei = lauf('hochbetagt', 120, [], { blaseMl: 300 });
    expect(frei.a.blaseMl!).toBeLessThan(BLASE_ENTLEERUNG_ML);
  });

  it('ohne Blasen-Vorgabe und ohne Harnverhalt führt das Modell keine Blasenfüllung', () => {
    expect(lauf('erwachsen', 10).a.blaseMl).toBeUndefined();
  });
});
