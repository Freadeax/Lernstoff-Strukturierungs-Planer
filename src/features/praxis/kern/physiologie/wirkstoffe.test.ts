import { describe, expect, it } from 'vitest';
import { NORMAL, type ModellKontext } from '../modell';
import type { AktiverTreiber, Altersgruppe, Anzeige, Grundgroessen, Treiber } from '../typen';
import { atmung, PFLEGE_MODELL } from './pflegemodell';
import { bateman, spiegel, WIRKSTOFFE } from './wirkstoffe';

interface Lauf { g: Grundgroessen; a: Anzeige; k: ModellKontext }
/** Läuft wie der Kern: Treiber `seit` in Minuten, Basis = Start */
function lauf(ag: Altersgruppe, minuten: number, treiber: Array<[Treiber, number]>, start: Partial<Grundgroessen> = {}, gewichtKg?: number): Lauf {
  const basis = { ...NORMAL, ...start };
  let g = { ...basis };
  let t = 0;
  const aktiv = (): AktiverTreiber[] => treiber.filter(([, s]) => s * 60 <= t).map(([tr, s]) => ({ ...tr, seit: s * 60 }));
  while (t < minuten * 60) { g = PFLEGE_MODELL.naechster(g, aktiv(), 5, { altersgruppe: ag, t, basis, gewichtKg }); t += 5; }
  const k: ModellKontext = { altersgruppe: ag, t, basis, gewichtKg };
  return { g, a: PFLEGE_MODELL.anzeige(g, k), k };
}
const ws = (id: string, dosisMg: number, weg?: Extract<Treiber, { art: 'wirkstoff' }>['weg']): Treiber => ({ art: 'wirkstoff', id, dosisMg, weg });

describe('G1 Wirkstoffe: Register und Kinetik', () => {
  it('jeder Wirkstoff hat Quelle, Wege, Halbwertszeit und Beobachtungshinweise', () => {
    for (const w of Object.values(WIRKSTOFFE)) {
      expect(w.quelle.titel, w.id).toMatch(/Fachinformation/);
      expect(Object.keys(w.wege).length, w.id).toBeGreaterThan(0);
      expect(w.hwzMin, w.id).toBeGreaterThan(0);
      expect(w.beobachten.length, w.id).toBeGreaterThan(0);
    }
  });
  it('Bateman: Gipfel 1, i. v. sofort, oral später, danach Abfall mit der Halbwertszeit', () => {
    expect(bateman(0, 25, 180)).toBe(0);
    expect(bateman(3, 1, 180)).toBeGreaterThan(0.85);
    expect(bateman(10, 25, 180)).toBeLessThan(bateman(60, 25, 180));
    const spaet = bateman(600, 1, 180);
    expect(spaet / bateman(420, 1, 180)).toBeCloseTo(0.5, 1);
  });
  it('Dosis nach Gewicht: Kind mit 15 mg/kg Paracetamol erreicht etwa den Erwachsenenspiegel', () => {
    const k = { altersgruppe: 'kleinkind' as const, t: 3600 };
    const kind = spiegel({ art: 'wirkstoff', id: 'paracetamol', dosisMg: 15 * 14, seit: 0 } as never, k, 'kleinkind', 14);
    const erw = spiegel({ art: 'wirkstoff', id: 'paracetamol', dosisMg: 1000, seit: 0 } as never, { altersgruppe: 'erwachsen', t: 3600 }, 'erwachsen', 75);
    expect(Math.abs(kind - erw)).toBeLessThan(0.15);
  });
  it('Hochbetagte: längere Halbwertszeit, stärkere zentrale Wirkung', () => {
    const tr = { art: 'wirkstoff', id: 'lorazepam', dosisMg: 1, seit: 0 } as never;
    expect(spiegel(tr, { altersgruppe: 'hochbetagt', t: 24 * 3600 })).toBeGreaterThan(spiegel(tr, { altersgruppe: 'erwachsen', t: 24 * 3600 }) * 1.5);
  });
});

describe('G1 Wirkstoffe: Wirkung im Modell', () => {
  it('Morphin s. c.: Schmerz sinkt, kehrt nach Stunden zurück; Atemfrequenz bleibt bei üblicher Dosis ≥ 10', () => {
    const start = { schmerz: 7 };
    const m30 = lauf('erwachsen', 40, [[ws('morphin', 10, 'sc'), 0]], start);
    expect(m30.g.schmerz).toBeLessThanOrEqual(4);
    expect(m30.a.af).toBeGreaterThanOrEqual(10);
    expect(lauf('erwachsen', 600, [[ws('morphin', 10, 'sc'), 0]], start).g.schmerz).toBeGreaterThan(6);
  });
  it('Wechselwirkung: Morphin + Lorazepam bei Hochbetagten dämpft Atmung und Vigilanz stärker als jedes allein', () => {
    const m = lauf('hochbetagt', 60, [[ws('morphin', 10, 'sc'), 0]]);
    const l = lauf('hochbetagt', 60, [[ws('lorazepam', 1, 'oral'), 0]]);
    const b = lauf('hochbetagt', 60, [[ws('morphin', 10, 'sc'), 0], [ws('lorazepam', 1, 'oral'), 0]]);
    expect(b.a.af).toBeLessThan(Math.min(m.a.af, l.a.af));
    expect(b.g.vigilanz).toBeLessThan(Math.min(m.g.vigilanz, l.g.vigilanz));
    expect(atmung(b.g, b.k).paCO2).toBeGreaterThan(atmung(m.g, m.k).paCO2);
  });
  it('Lorazepam: Angst und Unruhe sinken', () => {
    const start = { angst: 0.8, unruhe: 0.5 };
    const r = lauf('erwachsen', 60, [[ws('lorazepam', 1, 'sublingual'), 0]], start);
    const o = lauf('erwachsen', 60, [], start);
    expect(r.g.angst).toBeLessThan(o.g.angst - 0.3);
  });
  it('Naloxon und Flumazenil heben auf, wirken aber kürzer (Renarkotisierung, Resedierung)', () => {
    const op: Array<[Treiber, number]> = [[ws('morphin', 25, 'iv'), 0]];
    const ohne = lauf('erwachsen', 20, op);
    const mit = (min: number) => lauf('erwachsen', min, [...op, [ws('naloxon', 0.4, 'iv'), 10]]);
    expect(mit(20).a.af).toBeGreaterThan(ohne.a.af + 3);
    expect(mit(150).g.vigilanz).toBeLessThan(mit(20).g.vigilanz);
    const bz: Array<[Treiber, number]> = [[ws('midazolam', 10, 'iv'), 0]];
    const fl = (min: number) => lauf('erwachsen', min, [...bz, [ws('flumazenil', 0.5, 'iv'), 5]]);
    expect(fl(10).g.vigilanz).toBeGreaterThan(lauf('erwachsen', 10, bz).g.vigilanz + 0.2);
  });
  it('Paracetamol senkt Fieber, Metamizol i. v. zusätzlich den Blutdruck', () => {
    const fieber: Array<[Treiber, number]> = [[{ art: 'pneumonie', staerke: 0.8 }, 0]];
    const ohne = lauf('erwachsen', 240, fieber);
    const para = lauf('erwachsen', 240, [...fieber, [ws('paracetamol', 1000, 'oral'), 150]]);
    expect(para.a.temp).toBeLessThan(ohne.a.temp - 0.4);
    // Hochbetagte gleichen die Vasodilatation kaum aus (schwacher Reflex)
    const meta = lauf('hochbetagt', 20, [[ws('metamizol', 1000, 'iv'), 0]]);
    expect(meta.a.map!).toBeLessThan(lauf('hochbetagt', 20, []).a.map! - 3);
  });
  it('Salbutamol inhalativ: Bronchospasmus löst sich, SpO₂ steigt, Puls steigt', () => {
    const asthma: Array<[Treiber, number]> = [[{ art: 'bronchospasmus', staerke: 0.9 }, 0]];
    const ohne = lauf('schulkind', 30, asthma, {}, 30);
    const mit = lauf('schulkind', 30, [...asthma, [ws('salbutamol', 0.2, 'inhalativ'), 10]], {}, 30);
    expect(mit.a.spo2).toBeGreaterThan(ohne.a.spo2);
    expect(mit.a.af).toBeLessThan(ohne.a.af);
    expect(mit.g.atemarbeit).toBeLessThan(ohne.g.atemarbeit - 0.5);
  });
  it('Furosemid i. v.: Volumen, Hydratation und Kalium sinken', () => {
    const r = lauf('erwachsen', 120, [[ws('furosemid', 40, 'iv'), 0]]);
    expect(r.g.volumen).toBeLessThan(0.97);
    expect(r.g.hydratation).toBeLessThan(0.97);
    expect(r.g.kalium!).toBeLessThan(4.0);
  });
  it('Midazolam bukkal beendet einen Fieberkrampf', () => {
    const fk: Array<[Treiber, number]> = [[{ art: 'fieberkrampf_kind', temperaturSchwelle: 39 }, 0]];
    const start = { temperatur: 39.2 };
    const ohne = lauf('kleinkind', 1.5, fk, start, 14);
    expect(ohne.g.krampf).toBeGreaterThan(0);
    const mit = lauf('kleinkind', 1.5, [...fk, [ws('midazolam', 5, 'bukkal'), 0.5]], start, 14);
    expect(mit.g.krampf).toBeLessThan(0);
  });
  it('Haloperidol senkt Unruhe, Ondansetron Übelkeit, Prednisolon hebt den Blutzucker langsam', () => {
    const start = { delir: 0.6, unruhe: 0.6, uebelkeit: 0.6 };
    expect(lauf('hochbetagt', 90, [[ws('haloperidol', 1, 'oral'), 0]], start).g.unruhe).toBeLessThan(lauf('hochbetagt', 90, [], start).g.unruhe - 0.15);
    expect(lauf('erwachsen', 60, [[ws('ondansetron', 4, 'iv'), 0]], start).g.uebelkeit).toBeLessThan(0.35);
    const bz = (min: number) => lauf('erwachsen', min, [[ws('prednisolon', 50, 'oral'), 0]]).a.bz!;
    expect(bz(60)).toBeLessThan(bz(360));
    expect(bz(360)).toBeGreaterThan(130);
  });
  it('ohne Wirkstoff ändert sich nichts gegenüber dem bisherigen Modell (keine wirk-Felder)', () => {
    const r = lauf('erwachsen', 30, [[{ art: 'pneumonie', staerke: 1 }, 0]]);
    expect(r.g.wirkSchmerz).toBeUndefined();
    expect(r.g.wirkHf).toBeUndefined();
  });
});
