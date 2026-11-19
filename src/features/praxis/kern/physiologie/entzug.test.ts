import { describe, expect, it } from 'vitest';
import { NORMAL } from '../modell';
import type { AktiverTreiber, Grundgroessen, Treiber } from '../typen';
import { PFLEGE_MODELL } from './pflegemodell';
import { anzeigeEinschaetzungen } from './einschaetzungen';
import { ciwaAr, entzugsVerlauf } from './entzug';

const K = { altersgruppe: 'erwachsen' as const, basis: NORMAL };

/** Läuft `minuten`; `gaben` = Treiber, die zur Minute m dazukommen */
function lauf(minuten: number, treiber: Treiber[], gaben: Array<[number, Treiber]> = []) {
  let g: Grundgroessen = { ...NORMAL };
  const tr: AktiverTreiber[] = treiber.map((t) => ({ ...t, seit: 0 }));
  let maxHf = 0, maxSys = 0, krampf = false;
  for (let t = 0; t < minuten * 60; t += 5) {
    for (const [m, x] of gaben) if (m * 60 === t) tr.push({ ...x, seit: t });
    g = PFLEGE_MODELL.naechster(g, tr, 5, { ...K, t });
    const a = PFLEGE_MODELL.anzeige(g, { ...K, t });
    maxHf = Math.max(maxHf, a.hf); maxSys = Math.max(maxSys, a.rrSys);
    if (g.krampf > 0) krampf = true;
  }
  const a = PFLEGE_MODELL.anzeige(g, { ...K, t: minuten * 60 });
  return { g, a: { ...a, ...anzeigeEinschaetzungen(a, g, K) }, maxHf, maxSys, krampf };
}

const entzug = (schwere: number, vorStd: number): Treiber => ({ art: 'alkoholentzug', schwere, letzterKonsumVorStd: vorStd });
const lorazepam: Treiber = { art: 'wirkstoff', id: 'lorazepam', dosisMg: 2, weg: 'oral' };
const diazepam: Treiber = { art: 'wirkstoff', id: 'diazepam', dosisMg: 10, weg: 'oral' };

describe('Alkoholentzug', () => {
  it('Verlauf: Beginn nach 6 h, Gipfel 24–72 h, Abklingen', () => {
    expect(entzugsVerlauf(4)).toBe(0);
    expect(entzugsVerlauf(15)).toBeCloseTo(0.5, 1);
    expect(entzugsVerlauf(48)).toBe(1);
    expect(entzugsVerlauf(130)).toBe(0);
  });
  it('vegetativ: Tremor, Schwitzen, Tachykardie, Hypertonie, Unruhe; CIWA-Ar mittel bis schwer', () => {
    const ruhe = PFLEGE_MODELL.anzeige(NORMAL, K);
    const r = lauf(60, [entzug(0.6, 20)]);
    expect(r.a.tremor === 'deutlich' || r.a.tremor === 'grob').toBe(true);
    expect(r.a.schwitzen).toBe(true);
    expect(r.a.hf).toBeGreaterThan(ruhe.hf + 20);
    expect(r.a.hf).toBeLessThan(140);
    expect(r.a.rrSys).toBeGreaterThan(ruhe.rrSys + 15);
    expect(r.g.unruhe).toBeGreaterThan(0.3);
    expect(r.a.ciwa!).toBeGreaterThanOrEqual(10);
  });
  it('früh (2 h nach Konsum) noch ruhig, CIWA-Ar niedrig', () => {
    const r = lauf(30, [entzug(0.8, 2)]);
    expect(r.a.tremor).toBe('kein');
    expect(r.a.ciwa!).toBeLessThan(8);
  });
  it('Krampfanfall im Fenster 12–48 h bei schwerem Entzug, nur einmal; Benzodiazepin verhindert ihn', () => {
    const ohne = lauf(120, [entzug(0.9, 20)]);
    expect(ohne.krampf).toBe(true);
    expect(ohne.g.entzugKrampf).toBe(1);
    const mit = lauf(120, [entzug(0.9, 20), diazepam]);
    expect(mit.krampf).toBe(false);
  });
  it('Delirium tremens ab 48 h: Halluzinationen, Delir, Desorientierung; Lorazepam dämpft', () => {
    const dt = lauf(180, [entzug(0.9, 50)]);
    expect(dt.a.halluzinationen).toBe(true);
    expect(dt.g.delir).toBeGreaterThan(0.6);
    expect(dt.g.orientierung).toBeLessThan(0.6);
    const behandelt = lauf(180, [entzug(0.9, 50)], [[0, lorazepam], [60, lorazepam], [120, lorazepam]]);
    expect(behandelt.g.entzug!).toBeLessThan(dt.g.entzug! - 0.3);
    expect(behandelt.g.delir).toBeLessThan(dt.g.delir);
    expect(behandelt.a.ciwa!).toBeLessThan(dt.a.ciwa!);
  });
  it('Thiamin verhindert die langsame Wernicke-Verwirrtheit', () => {
    const ohne = lauf(720, [entzug(0.3, 2)]);
    const mit = lauf(720, [entzug(0.3, 2), { art: 'wirkstoff', id: 'thiamin', dosisMg: 100, weg: 'iv' }]);
    expect(ohne.g.wernicke!).toBeGreaterThan(0.05);
    expect(mit.g.wernicke!).toBe(0);
    expect(mit.g.thiamin).toBe(1);
  });
  it('CIWA-Ar: 10 Bereiche, Summe 0–67', () => {
    const c = ciwaAr({ ...NORMAL, entzug: 1.2, halluzination: 1, unruhe: 1, angst: 1, uebelkeit: 1, orientierung: 0 });
    expect(Object.keys(c.items)).toHaveLength(10);
    expect(c.punkte).toBeLessThanOrEqual(67);
    expect(c.stufe).toBe('schwer');
  });
});
