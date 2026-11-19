import { describe, expect, it } from 'vitest';
import { NORMAL } from '../modell';
import type { AktiverTreiber, Altersgruppe, Grundgroessen, Treiber } from '../typen';
import { gcsAus, PFLEGE_MODELL, ruheAnzeige } from './pflegemodell';
import { gcsTeile, lyseNutzen, LYSE_FENSTER_MIN } from './neuro';

function lauf(ag: Altersgruppe, minuten: number, treiber: Treiber[] = [], start: Partial<Grundgroessen> = {}, seit: number[] = []) {
  const basis = { ...NORMAL, ...start };
  let g = { ...basis };
  const tr: AktiverTreiber[] = treiber.map((t, i) => ({ ...t, seit: seit[i] ?? 0 }));
  let t = 0;
  for (; t < minuten * 60; t += 5) {
    const aktiv = tr.filter((x) => (x.seit ?? 0) <= t);
    g = PFLEGE_MODELL.naechster(g, aktiv, 5, { altersgruppe: ag, t, basis });
  }
  return { g, a: PFLEGE_MODELL.anzeige(g, { altersgruppe: ag, t, basis }) };
}

const SA: Treiber = { art: 'schlaganfall', seite: 'links', schwere: 0.6, beginnVorMin: 30 };

describe('G5 Neuro', () => {
  it('Ruhe: Pupillen mittelweit und prompt, GCS-Teilwerte 4/5/6, keine Schlaganfallzeichen', () => {
    const a = ruheAnzeige('erwachsen');
    expect(a).toMatchObject({ pupilleRechtsMm: 3.5, pupilleLinksMm: 3.5, pupilleRechtsLicht: 'prompt', gcsAugen: 4, gcsVerbal: 5, gcsMotorik: 6, gcs: 15 });
    expect(a.fast).toBeUndefined();
  });
  it('GCS-Teilwerte ergeben ohne Neuro dieselbe Summe wie bisher', () => {
    for (const v of [0.02, 0.1, 0.25, 0.4, 0.6, 0.9]) for (const o of [0.2, 0.5, 0.9]) {
      const t = gcsTeile(v, o);
      expect(t.augen + t.verbal + t.motorik).toBe(gcsAus(v, o));
    }
  });
  it('Opioide machen die Pupillen eng', () => {
    const r = lauf('erwachsen', 30, [{ art: 'wirkstoff', id: 'morphin', dosisMg: 10, weg: 'iv' }]);
    expect(r.a.pupilleRechtsMm!).toBeLessThanOrEqual(2.5);
  });
  it('Lyse: je früher, desto mehr Nutzen; nach 4,5 h keiner', () => {
    expect(lyseNutzen(60)).toBeGreaterThan(lyseNutzen(200));
    expect(lyseNutzen(LYSE_FENSTER_MIN + 10)).toBe(0);
    const frueh = lauf('erwachsen', 180, [SA, { art: 'lyse' }], {}, [0, 20 * 60]).g.neuroDefizit!;
    const spaet = lauf('erwachsen', 180, [SA, { art: 'lyse' }], {}, [0, 150 * 60]).g.neuroDefizit!;
    const ohne = lauf('erwachsen', 180, [SA]).g.neuroDefizit!;
    expect(frueh).toBeLessThan(spaet);
    expect(spaet).toBeLessThan(ohne);
  });
  it('unbehandelt wächst das Defizit langsam weiter, das Lysefenster läuft ab', () => {
    const r30 = lauf('erwachsen', 30, [SA]);
    const r240 = lauf('erwachsen', 240, [SA]);
    expect(r240.g.neuroDefizit!).toBeGreaterThan(r30.g.neuroDefizit!);
    expect(r240.a.lyseFensterMin).toBe(0);
    expect(r30.a.seitBeginnMin).toBe(60);
  });
  it('Blutung: Hirndruck steigt, mit Lyse deutlich schneller', () => {
    const blutung: Treiber = { ...SA, blutung: true } as Treiber;
    const ohne = lauf('erwachsen', 60, [blutung]).g.hirndruck!;
    const mit = lauf('erwachsen', 60, [blutung, { art: 'lyse' }]).g.hirndruck!;
    expect(mit).toBeGreaterThan(ohne * 3);
  });
  it('Hirndruck: gleichseitige Pupille weit, später lichtstarr, Cushing (Puls ↓, RR ↑), Vigilanz ↓', () => {
    const frueh = lauf('erwachsen', 80, [{ art: 'hirndruck', tempo: 1, seite: 'rechts' }]);
    const spaet = lauf('erwachsen', 120, [{ art: 'hirndruck', tempo: 1, seite: 'rechts' }]);
    expect(frueh.a.pupilleRechtsMm!).toBeGreaterThan(frueh.a.pupilleLinksMm!);
    expect(spaet.a.pupilleRechtsLicht).toBe('lichtstarr');
    expect(spaet.a.hf).toBeLessThan(ruheAnzeige('erwachsen').hf);
    expect(spaet.a.rrSys).toBeGreaterThan(ruheAnzeige('erwachsen').rrSys + 15);
    expect(spaet.a.gcs!).toBeLessThan(frueh.a.gcs!);
  });
  it('Schlaganfall rechts (linke Hirnhälfte): Aphasie senkt den verbalen GCS, nicht die Augen', () => {
    const r = lauf('erwachsen', 30, [{ art: 'schlaganfall', seite: 'rechts', schwere: 0.7 }]);
    expect(r.a.gcsVerbal).toBeLessThanOrEqual(2);
    expect(r.a.gcsAugen).toBe(4);
    expect(r.a.fast).toBe(3);
  });
});
