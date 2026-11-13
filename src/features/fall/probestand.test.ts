import { describe, expect, it } from 'vitest';
import { demoAbschluss, demoZug, PROBEFAELLE, type Probefall } from './demo';
import { probeStand, wendungenVon } from './probestand';
import { neuerFall, type Fall } from './simulator';

function spiele(p: Probefall, wahl: (o: string[]) => string): Fall {
  let f = neuerFall(p.szenario, 1);
  f = { ...f, runden: [{ zug: demoZug(f) }] };
  for (let i = 0; i < 12 && !f.runden.at(-1)!.zug.beendet; i++) {
    const e = wahl(f.runden.at(-1)!.zug.optionen);
    f = { ...f, runden: [...f.runden, { eingabe: e, zug: demoZug(f, e) }] };
  }
  return { ...f, abschluss: demoAbschluss(f) };
}

describe('Fortschritt je Probefall', () => {
  const p = PROBEFAELLE.find((x) => x.szenario.id === 'demo-copd')!;
  const gut = (o: string[]) => o.find((t) => Object.values(p.etappen).some((e) => e.optionen.some((x) => x.text === t && x.wertung === 'gut')))!;
  const schlecht = (o: string[]) => o.find((t) => Object.values(p.etappen).some((e) => e.optionen.some((x) => x.text === t && x.wertung === 'gefaehrlich'))) ?? o[0]!;

  it('ohne gespielte Fälle ist nichts entdeckt', () => {
    const s = probeStand(p, []);
    expect(s).toMatchObject({ gespielt: 0, beste: null, wendungen: { gesehen: 0 } });
    expect(s.wendungen.gesamt).toBe(wendungenVon(p).length);
  });

  it('zählt bestes Ergebnis, Wendungen und Möglichkeiten über mehrere Durchgänge', () => {
    const a = spiele(p, schlecht), b = spiele(p, gut);
    const nur = probeStand(p, [a]);
    expect(nur.beste).toBe('unsicher');
    expect(nur.wendungen.gesehen).toBeGreaterThan(0);
    const beide = probeStand(p, [a, b, { ...b, szenario: PROBEFAELLE[0]!.szenario }]);
    expect(beide.gespielt).toBe(2);
    expect(beide.beste).toBe('sicher');
    expect(beide.optionen.gesehen).toBeGreaterThan(nur.optionen.gesehen);
    expect(beide.optionen.gesehen).toBeLessThanOrEqual(beide.optionen.gesamt);
  });
});
