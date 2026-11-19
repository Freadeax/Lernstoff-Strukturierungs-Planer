import { describe, expect, it } from 'vitest';
import { NORMAL } from '../modell';
import type { AktiverTreiber, Grundgroessen, Treiber } from '../typen';
import { start, sende } from '../kern';
import { KH_PNEUMONIE_SEPSIS } from '../faelle/kh-pneumonie-sepsis';
import type { FallV2 } from '../typen';
import { PFLEGE_MODELL } from './pflegemodell';

const K = { altersgruppe: 'hochbetagt' as const, basis: NORMAL };
function lauf(minuten: number, treiber: Treiber[], startWerte: Partial<Grundgroessen> = {}) {
  let g: Grundgroessen = { ...NORMAL, ...startWerte };
  const tr: AktiverTreiber[] = treiber.map((t) => ({ ...t, seit: 0 }));
  for (let t = 0; t < minuten * 60; t += 5) g = PFLEGE_MODELL.naechster(g, tr, 5, { ...K, t });
  return { g, a: PFLEGE_MODELL.anzeige(g, { ...K, t: minuten * 60 }) };
}
const hueft = (extra: Partial<Extract<Treiber, { art: 'wunde' }>> = {}): Treiber => ({ art: 'wunde', ort: 'Hüfte links', tagPostOp: 1, ...extra });

describe('G9 Wunde', () => {
  it('reizlose OP-Wunde Tag 1: exsudativ, serös, Verband trocken, keine Infektzeichen', () => {
    const a = lauf(30, [hueft()]).a;
    expect(a.wundPhase).toBe('exsudativ');
    expect(a.wundsekret).toBe('serös');
    expect(a.verband).toBe('trocken');
    expect(a.wundInfektZeichen).toBe(0);
  });
  it('Tag 5 ohne Infekt: proliferativ, kein Sekret', () => {
    const a = lauf(10, [hueft({ tagPostOp: 5 })]).a;
    expect(a.wundPhase).toBe('proliferativ');
    expect(a.wundsekret).toBe('keins');
  });
  it('Wundinfekt: Zeichen nehmen zu, Fieber, Schmerz, CRP steigt (G8), Phase bleibt exsudativ', () => {
    const r = lauf(360, [hueft({ tagPostOp: 4, infektTempo: 0.12 })]);
    expect(r.a.wundInfektZeichen).toBeGreaterThanOrEqual(4);
    expect(r.a.wundsekret).toBe('eitrig');
    expect(r.a.wundPhase).toBe('exsudativ');
    expect(r.a.temp).toBeGreaterThan(37.3);                      // Hochbetagte fiebern abgeschwächt
    expect(r.g.schmerz).toBeGreaterThan(3);
    expect(r.a.crp!).toBeGreaterThan(20);
  });
  it('Nachblutung: Verband füllt sich, Volumen sinkt, Hb erst später; Druckverband senkt um 80 %', () => {
    const r = lauf(20, [hueft(), { art: 'wundblutung', mlProMin: 2 }]);
    expect(r.a.verband).toBe('durchgeblutet');
    expect(r.a.verbandBlutMl).toBeCloseTo(40, -1);
    expect(r.a.wundsekret).toBe('blutig');
    expect(r.g.volumen).toBeLessThan(1);
    expect(r.g.hbMasse!).toBeLessThan(1);
    const mitDruck = lauf(20, [hueft(), { art: 'wundblutung', mlProMin: 2 }], { blutstillung: 1 });
    expect(mitDruck.a.verbandBlutMl!).toBeLessThan(r.a.verbandBlutMl! / 4);
  });
  it('ohne Wunde keine Felder', () => {
    const a = lauf(10, []).a;
    expect(a.verband).toBeUndefined();
    expect(a.wundPhase).toBeUndefined();
  });
  it('im Fall: Verbandwechsel setzt den Verband zurück, Druckverband (blutung-stillen) bremst die Nachblutung', () => {
    const fall: FallV2 = {
      ...KH_PNEUMONIE_SEPSIS,
      start: { ...KH_PNEUMONIE_SEPSIS.start, treiber: [hueft(), { art: 'wundblutung', mlProMin: 1.5 }] },
      massnahmen: [...KH_PNEUMONIE_SEPSIS.massnahmen, 'verband-unkompliziert', 'blutung-stillen'],
    };
    let z = start(fall, 'pflegefachperson', 3, 1);
    z = sende(z, { art: 'warten', sek: 600 });
    while (z.offeneEntscheidung) {
      const ev = z.fall.ereignisse.find((e) => e.id === z.offeneEntscheidung)!;
      z = sende(z, { art: 'entscheidung', ereignis: ev.id, wahl: ev.entscheidung!.find((o) => o.wertung === 'gut')!.id });
    }
    const vorher = z.grund.verbandBlutMl!;
    expect(vorher).toBeGreaterThan(10);
    z = sende(z, { art: 'massnahme', id: 'blutung-stillen' });
    expect(z.grund.blutstillung).toBeCloseTo(1, 5);
    z = sende(z, { art: 'massnahme', id: 'verband-unkompliziert' });
    expect(z.grund.verbandBlutMl!).toBeLessThan(5);
    expect(z.grund.wundBlutungMlMin!).toBeCloseTo(0.3, 2);
  });
});
