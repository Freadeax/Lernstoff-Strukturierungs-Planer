import { describe, expect, it } from 'vitest';
import { NORMAL } from '../modell';
import type { AktiverTreiber, Altersgruppe, Grundgroessen, Treiber } from '../typen';
import { PFLEGE_MODELL, ruheAnzeige } from './pflegemodell';

function lauf(ag: Altersgruppe, minuten: number, treiber: Treiber[], start: Partial<Grundgroessen> = {}) {
  const basis = { ...NORMAL };
  let g: Grundgroessen = { ...NORMAL, ...start };
  const tr: AktiverTreiber[] = treiber.map((t) => ({ ...t, seit: 0 }));
  const verlauf: Array<{ min: number; af: number; hf: number; spo2: number; e: number }> = [];
  for (let t = 0; t < minuten * 60; t += 5) {
    g = PFLEGE_MODELL.naechster(g, tr, 5, { altersgruppe: ag, t, basis });
    if (t % 600 === 0) { const a = PFLEGE_MODELL.anzeige(g, { altersgruppe: ag, t, basis }); verlauf.push({ min: t / 60, af: a.af, hf: a.hf, spo2: a.spo2, e: g.erschoepfung ?? 0 }); }
  }
  return { g, a: PFLEGE_MODELL.anzeige(g, { altersgruppe: ag, t: minuten * 60, basis }), verlauf };
}

const bronchiolitis: Treiber[] = [{ art: 'bronchospasmus', staerke: 0.55 }];

describe('Atemerschöpfung', () => {
  it('ohne Treiber unverändert (kein Feld, keine Anzeige)', () => {
    const r = lauf('saeugling', 60, bronchiolitis);
    expect(r.g.erschoepfung).toBeUndefined();
    expect(r.a.atemerschoepfung).toBeUndefined();
  });
  it('Säugling: erst schnelle Atmung, dann langsamer, Apnoen, SpO₂ fällt, Bradykardie', () => {
    const ruhe = ruheAnzeige('saeugling');
    const r = lauf('saeugling', 240, [...bronchiolitis, { art: 'atemerschoepfung', tempo: 1.5 }]);
    const frueh = r.verlauf[1];
    expect(frueh.af).toBeGreaterThan(ruhe.af + 10);           // kompensiert: Tachypnoe
    expect(r.a.atemerschoepfung).toBe('dekompensiert');
    expect(r.a.apnoen).toBe(true);
    expect(r.a.af).toBeLessThan(frueh.af - 15);                // „ruhiger“ = Alarmzeichen
    expect(r.a.spo2).toBeLessThan(88);
    expect(r.a.hf).toBeLessThan(ruhe.hf);                      // präfinale Bradykardie
  });
  it('Säugling erschöpft schneller als Schulkind bei gleicher Atemarbeit', () => {
    const s = lauf('saeugling', 90, [...bronchiolitis, { art: 'atemerschoepfung' }]);
    const k = lauf('schulkind', 90, [...bronchiolitis, { art: 'atemerschoepfung' }]);
    expect(s.g.erschoepfung!).toBeGreaterThan(2 * k.g.erschoepfung!);
  });
  it('erholt sich, wenn die Atemarbeit sinkt (z. B. nach Absaugen)', () => {
    const r = lauf('saeugling', 120, [{ art: 'atemerschoepfung' }], { erschoepfung: 0.3 });
    expect(r.g.erschoepfung!).toBeLessThan(0.3);
  });
});
