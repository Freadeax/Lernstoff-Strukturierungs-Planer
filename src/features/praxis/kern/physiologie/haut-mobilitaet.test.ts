import { describe, expect, it } from 'vitest';
import { NORMAL } from '../modell';
import type { AktiverTreiber, Altersgruppe, Grundgroessen, Treiber } from '../typen';
import { haut as hautLernseite } from '../../../physiologie/modelle';
import { haut } from './organe';
import { druckRate, sturzrisiko } from './haut-mobilitaet';
import { PFLEGE_MODELL } from './pflegemodell';
import { KATALOG } from '../katalog';
import type { Wirkkurve } from '../typen';

function lauf(ag: Altersgruppe, minuten: number, treiber: Treiber[] = [], start: Partial<Grundgroessen> = {}) {
  const basis = { ...NORMAL, ...start };
  let g = { ...basis };
  const tr: AktiverTreiber[] = treiber.map((t) => ({ ...t, seit: 0 }));
  for (let t = 0; t < minuten * 60; t += 5) g = PFLEGE_MODELL.naechster(g, tr, 5, { altersgruppe: ag, t, basis });
  return { g, a: PFLEGE_MODELL.anzeige(g, { altersgruppe: ag, t: minuten * 60, basis }) };
}

const SEHR_ALT = { hochbetagt: true, rrSys: 130, schwindel: false, sedierung: 0, diureseMlH: 0, immobil: false };

describe('G3 Haut, Mobilität, Sturz', () => {
  it('Lernseite und Simulator rechnen mit demselben Hautmodell', () => {
    expect(hautLernseite).toBe(haut);
  });
  it('Druck mal Zeit wie auf der Lernseite: 70 mmHg 4 h → Kategorie wie haut()', () => {
    const r = lauf('erwachsen', 240, [{ art: 'immobil', druckMmHg: 70 }]);
    expect(r.g.dekubitusKat).toBe(haut({ druck: 70, stunden: 4, scherkraefte: false, feuchtigkeit: false }).kategorie);
  });
  it('Weichlagerung unter dem Kapillardruck schadet auch nach 8 h nicht', () => {
    expect(lauf('hochbetagt', 480, [{ art: 'immobil', druckMmHg: 30 }]).g.dekubitusKat).toBe(0);
  });
  it('Schock und Exsikkose beschleunigen, Scherkräfte und Feuchte verstärken', () => {
    expect(druckRate(70, false, false, 55, 0.8)).toBeGreaterThan(druckRate(70, false, false, 80, 1));
    expect(druckRate(70, true, true, 80, 1)).toBeCloseTo(38 * 1.5 * 1.3, 5);
  });
  it('Kategorie geht im Fall nicht zurück, die Belastung erholt sich ohne Druck', () => {
    const r = lauf('erwachsen', 120, [], { druckLast: 120, dekubitusKat: 2 });
    expect(r.g.dekubitusKat).toBe(2);
    expect(r.g.druckLast!).toBeLessThan(120);
  });
  it('ohne Treiber immobil führt das Modell keine Haut', () => {
    expect(lauf('erwachsen', 10).g.druckLast).toBeUndefined();
    expect(lauf('erwachsen', 10).a.dekubitusKat).toBeUndefined();
  });
  it('Positionieren und Mobilisieren entlasten (Wirkkurve druckLast → 0)', () => {
    for (const id of ['positionieren-druckentlastung', 'mobilisieren-transfer']) {
      const w: readonly Wirkkurve[] = KATALOG[id].wirkung ?? [];
      expect(w.some((k) => k.groesse === 'druckLast' && k.faktor === 0), id).toBe(true);
    }
  });
  it('Sturzrisiko: Gründe aus dem Zustand, Stufe nach Anzahl und Schwere', () => {
    expect(sturzrisiko(NORMAL, { ...SEHR_ALT, hochbetagt: false }).stufe).toBe('gering');
    expect(sturzrisiko(NORMAL, SEHR_ALT).stufe).toBe('erhöht');
    const delir = sturzrisiko({ ...NORMAL, delir: 0.6, orientierung: 0.5 }, SEHR_ALT);
    expect(delir.stufe).toBe('hoch');
    const lorazepam = sturzrisiko(NORMAL, { ...SEHR_ALT, sedierung: 0.3, diureseMlH: 200 });
    expect(lorazepam.gruende.join(' ')).toMatch(/Sedierung.*Harndrang/);
    expect(lorazepam.stufe).toBe('hoch');
  });
});
