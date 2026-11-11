import { describe, expect, it } from 'vitest';
import { formFehler } from '../../ui/sim/zustand';
import { FAELLE } from './faelle';
import { fuehreAus, starte } from './lauf';
import { diagnostikZustand } from './zustand';

describe('Diagnostik – einheitlicher Zustand (SIM-07)', () => {
  it('jeder Fall: gültige Form, SBAR wird bei kritischem Alarm dringend, Anordnungen erst nach SBAR', () => {
    for (const fall of FAELLE) {
      const l = starte(fall);
      const z = diagnostikZustand(l, fall);
      expect(formFehler(z), fall.id).toEqual([]);
      const sbar = z.aufgaben.find((a) => a.id === 'sbar')!;
      expect(sbar.status, fall.id).toBe(z.alarme.some((a) => a.stufe === 'kritisch') ? 'dringend' : 'offen');
      expect(z.aufgaben.some((a) => a.id.startsWith('anordnung:')), fall.id).toBe(false);
      const nach = diagnostikZustand(fuehreAus(l, fall, { typ: 'sbar', fakten: [fall.sbar[0]!.id] }), fall);
      expect(nach.aufgaben.find((a) => a.id === 'sbar')!.status).toBe('erledigt');
      expect(nach.aufgaben.filter((a) => a.id.startsWith('anordnung:')).length, fall.id).toBe(fall.anordnungen.length);
    }
  });
  it('nicht angeschlossener Monitor zeigt keine Vitalalarme', () => {
    const fall = FAELLE.find((f) => f.monitor?.start === 'abwesend');
    if (!fall) return;
    const z = diagnostikZustand(starte(fall), fall);
    expect(z.geraete.find((g) => g.id === 'monitor')!.stufe).toBe('aus');
    expect(z.alarme.filter((a) => a.id.startsWith('vital:'))).toEqual([]);
  });
});
