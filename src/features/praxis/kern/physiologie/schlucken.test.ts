import { describe, expect, it } from 'vitest';
import { NORMAL } from '../modell';
import type { AktiverTreiber, Altersgruppe, Grundgroessen, Treiber } from '../typen';
import { KATALOG } from '../katalog';
import { PFLEGE_MODELL, befinden } from './pflegemodell';
import { aspirationsRate } from './schlucken';

function lauf(ag: Altersgruppe, minuten: number, treiber: Treiber[] = [], start: Partial<Grundgroessen> = {}) {
  const basis = { ...NORMAL, ...start };
  let g = { ...basis };
  const tr: AktiverTreiber[] = treiber.map((t) => ({ ...t, seit: 0 }));
  let t = 0;
  for (; t < minuten * 60; t += 5) g = PFLEGE_MODELL.naechster(g, tr, 5, { altersgruppe: ag, t, basis });
  const k = { altersgruppe: ag, t, basis };
  return { g, a: PFLEGE_MODELL.anzeige(g, k), b: befinden(g, tr, k) };
}

const DYS: Treiber = { art: 'schluckstoerung', schwere: 0.7 };
const TRINKEN: Treiber = { art: 'nahrung', form: 'trinken' };

describe('G6 Schlucken, Aspiration', () => {
  it('dünne Flüssigkeit aspiriert mehr als angepasste Kost; wach weniger als eingetrübt', () => {
    expect(aspirationsRate(0.7, 'trinken', 0, 1)).toBeGreaterThan(aspirationsRate(0.7, 'essen', 0, 1));
    expect(aspirationsRate(0.7, 'trinken', 1, 1)).toBeLessThan(aspirationsRate(0.7, 'trinken', 0, 1) * 0.5);
    expect(aspirationsRate(0.7, 'essen', 0, 0.6)).toBeGreaterThan(aspirationsRate(0.7, 'essen', 0, 1));
    expect(aspirationsRate(0, 'trinken', 0, 1)).toBe(0);
  });
  it('akute Aspiration: Atemnot und Sättigungsabfall, die nach einer halben Stunde nachlassen', () => {
    const ruhig = lauf('hochbetagt', 10, [DYS]);
    const waehrend = lauf('hochbetagt', 18, [DYS, TRINKEN]);
    const spaeter = lauf('hochbetagt', 75, [DYS, TRINKEN]);
    expect(waehrend.a.spo2).toBeLessThan(ruhig.a.spo2 - 2);
    expect(waehrend.a.af).toBeGreaterThan(ruhig.a.af);
    expect(spaeter.a.spo2).toBeGreaterThan(waehrend.a.spo2);
  });
  it('Folge: Aspirationspneumonie über Stunden (Fieber, Rasselgeräusche)', () => {
    const r = lauf('hochbetagt', 480, [DYS, TRINKEN, { art: 'nahrung', form: 'essen' }]);
    expect(r.g.aspirationsPneumonie!).toBeGreaterThan(0.1);
    expect(r.a.temp).toBeGreaterThan(37.5);
    expect(r.b.atemgeraeusch).toBe('atem-rg');
  });
  it('angepasste Kost verhindert die Folge-Pneumonie weitgehend', () => {
    const mit = lauf('hochbetagt', 480, [DYS, TRINKEN], { kostAngepasst: 1 });
    const ohne = lauf('hochbetagt', 480, [DYS, TRINKEN]);
    expect(mit.g.aspiration!).toBeLessThan(ohne.g.aspiration! * 0.5);
  });
  it('Schlaganfall bringt Dysphagie mit (GUSS sinkt)', () => {
    const r = lauf('erwachsen', 30, [{ art: 'schlaganfall', seite: 'links', schwere: 0.6 }]);
    expect(r.g.dysphagie!).toBeGreaterThan(0.3);
    expect(r.a.guss!).toBeLessThanOrEqual(14);
  });
  it('ohne Schluckthema keine GUSS-Anzeige', () => {
    expect(lauf('erwachsen', 5).a.guss).toBeUndefined();
  });
  it('Katalog: Essen/Trinken lösen eine Mahlzeit aus, Kost anpassen schützt', () => {
    expect(KATALOG['essen-anreichen'].treiber).toContainEqual({ art: 'nahrung', form: 'essen' });
    expect(KATALOG['trinken-anbieten'].treiber).toContainEqual({ art: 'nahrung', form: 'trinken' });
    expect(KATALOG['kost-anpassen'].wirkung?.some((w) => w.groesse === 'kostAngepasst')).toBe(true);
  });
});
