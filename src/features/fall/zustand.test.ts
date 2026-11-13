import { describe, expect, it } from 'vitest';
import { formFehler } from '../../ui/sim/zustand';
import { demoZug, PROBEFAELLE } from './demo';
import { neuerFall, type Fall } from './simulator';
import { fallZustand } from './zustand';

function spiele(i: number, wahl: (o: string[]) => string, zuege = 10): Fall {
  let f = neuerFall(PROBEFAELLE[i]!.szenario, 1);
  f = { ...f, runden: [{ zug: demoZug(f) }] };
  for (let n = 0; n < zuege && !f.runden.at(-1)!.zug.beendet; n++) {
    const eingabe = wahl(f.runden.at(-1)!.zug.optionen);
    f = { ...f, runden: [...f.runden, { eingabe, zug: demoZug(f, eingabe) }] };
  }
  return f;
}

describe('Zustandstafel im Fallsimulator', () => {
  it('liefert für jeden Probefall in jedem Schritt eine gültige Tafel', () => {
    PROBEFAELLE.forEach((_, i) => {
      for (const zuege of [0, 1, 2, 10]) {
        const z = fallZustand(spiele(i, (o) => o[0]!, zuege));
        expect(formFehler(z)).toEqual([]);
        expect(z.patient.length).toBeGreaterThan(1);
        expect(z.aufgaben).toHaveLength(6);
      }
    });
  });

  it('markiert bereits erreichte Schritte als erledigt, den aktuellen nicht', () => {
    const f = spiele(0, (o) => o.at(-1)!, 2);
    const z = fallZustand(f);
    const aktuell = f.runden.at(-1)!.zug.schritt;
    expect(z.aufgaben.find((a) => a.id === aktuell)!.status).not.toBe('erledigt');
  });

  it('zeigt Vitalalarme nur bei gemessenen Werten und nach Kinderprofil', () => {
    const f = spiele(0, (o) => o[0]!, 10);
    const z = fallZustand(f);
    for (const a of z.alarme.filter((x) => x.id.startsWith('vital:'))) expect(['achtung', 'kritisch']).toContain(a.stufe);
    expect(formFehler(fallZustand(f, 'kleinkind'))).toEqual([]);
  });
});
