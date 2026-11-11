import { describe, expect, it } from 'vitest';
import { formFehler } from '../../ui/sim/zustand';
import { SCENARIOS } from './catalog';
import { start, storyTime } from './engine';
import { dispatch } from './testhilfe';
import { praxisZustand } from './zustand';

describe('Praxissimulator – einheitlicher Zustand (SIM-07)', () => {
  it('liefert für jeden Fall alle fünf Bereiche in gültiger Form, am Anfang und am Ende', () => {
    for (const sc of SCENARIOS) {
      const s0 = start(sc, 2);
      const z0 = praxisZustand(s0);
      expect(formFehler(z0), sc.id).toEqual([]);
      expect(z0.patient.length, sc.id).toBeGreaterThan(3);
      expect(z0.geraete.length, sc.id).toBeGreaterThan(1);
      expect(z0.aufgaben.map(a => a.id), sc.id).toEqual(['blick', 'handeln', 'verlauf', 'uebergabe']);
      const ende = Math.max(...sc.storyline!.map(e => storyTime(e.at, 2)));
      expect(formFehler(praxisZustand(dispatch(s0, { type: 'advance', seconds: ende + 30 }))), sc.id).toEqual([]);
    }
  });
  it('Komplikation erscheint als kritischer Alarm und macht den nächsten Schritt dringend', () => {
    const sc = SCENARIOS.find(s => s.id === 'nachtwache')!;
    const ev = sc.storyline!.find(e => e.id === 'lungenoedem')!;
    const s = dispatch(start(sc, 2), { type: 'advance', seconds: storyTime(ev.at, 2) + 5 });
    const z = praxisZustand(s);
    expect(z.alarme.find(a => a.id === 'komplikation')?.stufe).toBe('kritisch');
    expect(z.aufgaben.some(a => a.status === 'dringend')).toBe(true);
  });
  it('Monitor anschließen ändert den Gerätezustand', () => {
    const sc = SCENARIOS.find(s => s.actions.some(a => a.id === 'monitor'))!;
    const vor = praxisZustand(start(sc, 2)).geraete.find(g => g.id === 'monitor');
    const nach = praxisZustand(dispatch(start(sc, 2), { type: 'action', id: 'monitor' })).geraete.find(g => g.id === 'monitor');
    expect(vor?.stufe).toBe('aus');
    expect(nach?.wert).toBe('läuft');
  });
});
