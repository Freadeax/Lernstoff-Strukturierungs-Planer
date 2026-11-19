import { describe, expect, it } from 'vitest';
import { NORMAL, type ModellKontext } from '../modell';
import type { Grundgroessen, Treiber } from '../typen';
import { anzeige, start, sende } from '../kern';
import { KH_PNEUMONIE_SEPSIS } from '../faelle/kh-pneumonie-sepsis';
import { anzeigeEinschaetzungen, besd, braden, einschaetzungen, nuDesc, qsofa, schockindex } from './einschaetzungen';
import { PFLEGE_MODELL, ruheAnzeige } from './pflegemodell';

const k = (altersgruppe: ModellKontext['altersgruppe'], basis: Grundgroessen = NORMAL): ModellKontext => ({ altersgruppe, basis });
const ein = (g: Grundgroessen, kx: ModellKontext) => anzeigeEinschaetzungen(PFLEGE_MODELL.anzeige(g, kx), g, kx);

describe('G4 Einschätzungen aus dem Modell', () => {
  it('Ruhe: unauffällig in jedem Instrument', () => {
    const e = ein(NORMAL, k('erwachsen'));
    expect(e).toMatchObject({ qsofa: 0, nuDesc: 0, besd: 0, news2: 0 });
    expect(e.schockindex!).toBeLessThan(0.8);
    expect(e.pews).toBeUndefined();
    expect(ein(NORMAL, k('kleinkind')).pews).toBe(0);
    expect(ein(NORMAL, k('kleinkind')).news2).toBeUndefined();
  });

  it('Schockindex und qSOFA aus den Anzeigewerten', () => {
    expect(schockindex({ hf: 120, rrSys: 90 })).toBe(1.3);
    expect(qsofa({ af: 24, rrSys: 98, gcs: 14, avpu: 'A' })).toBe(3);
    expect(qsofa({ af: 18, rrSys: 120, gcs: 15, avpu: 'A' })).toBe(0);
  });

  it('Sepsis-Fall ohne Maßnahme: qSOFA ≥ 2, NEWS2 hoch, Nu-DESC positiv als Platzhalter im Kern', () => {
    let z = start(KH_PNEUMONIE_SEPSIS, 'pflegefachperson', 3, 1);
    z = sende(z, { art: 'warten', sek: 600 });
    const a = anzeige(z);
    expect(a.qsofa!).toBeGreaterThanOrEqual(2);
    expect(a.news2!).toBeGreaterThanOrEqual(5);
    expect(a.nuDesc!).toBeGreaterThanOrEqual(2);
    expect(a.schockindex!).toBeGreaterThan(1);
  });

  it('Nu-DESC folgt dem Delir, BESD dem Schmerz', () => {
    expect(nuDesc({ ...NORMAL, delir: 0.7, orientierung: 0.4, unruhe: 0.5 }).punkte).toBeGreaterThanOrEqual(5);
    expect(besd({ ...NORMAL, schmerz: 2 }).punkte).toBe(0);
    expect(besd({ ...NORMAL, schmerz: 6 }).punkte).toBeGreaterThanOrEqual(4);
    expect(besd({ ...NORMAL, schmerz: 9 }).punkte).toBe(10);
  });

  it('PEWS bei einem Kleinkind mit Fieber und Atemnot steigt', () => {
    const krank = ein({ ...NORMAL, atemarbeit: 2.2, gasaustausch: 0.6, temperatur: 39.5, unruhe: 0.5 }, k('kleinkind'));
    expect(krank.pews!).toBeGreaterThanOrEqual(4);
  });

  it('Braden: gesund 22–23, immobil mit Feuchte und Scherkräften Risiko', () => {
    expect(braden(NORMAL, []).punkte).toBeGreaterThanOrEqual(22);
    const im: Treiber[] = [{ art: 'immobil', druckMmHg: 70, feucht: true, scherkraefte: true }];
    const b = braden({ ...NORMAL, hydratation: 0.85 }, im);
    expect(b.risiko).toBe(true);
    expect(b.punkte).toBeLessThanOrEqual(13);
  });

  it('einschaetzungen(): Sturzrisiko: Hochbetagte, verwirrt, mit Lorazepam → hoch', () => {
    const tr = [{ art: 'wirkstoff', id: 'lorazepam', dosisMg: 1, weg: 'oral', seit: 0 }] as const;
    const kx: ModellKontext = { altersgruppe: 'hochbetagt', basis: NORMAL, t: 3600 };
    const g = { ...NORMAL, orientierung: 0.5 };
    const e = einschaetzungen(ruheAnzeige('hochbetagt'), g, tr as unknown as Treiber[], kx);
    expect(e.sturz.gruende.join(' ')).toMatch(/Sedierung/);
    expect(e.sturz.stufe).toBe('hoch');
    expect(e.braden.punkte).toBeGreaterThan(18);
  });

  it('kostet im Takt kaum Zeit (10 000 Berechnungen unter 500 ms)', () => {
    const a = ruheAnzeige('erwachsen');
    const t0 = performance.now();
    for (let i = 0; i < 10000; i++) anzeigeEinschaetzungen(a, NORMAL, k('erwachsen'));
    expect(performance.now() - t0).toBeLessThan(500);
  });
});
