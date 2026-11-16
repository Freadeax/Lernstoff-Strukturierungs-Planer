import { describe, expect, it } from 'vitest';
import { FAELLE } from './faelle';
import { fuehreAus, starte } from './lauf';
import { diagnostikAuswertung } from './auswertung';
import { formFehler } from '../../ui/sim/auswertung';

describe('Diagnostik-Auswertung (gemeinsame Form)', () => {
  it('ohne Meldung ist der Fall kritisch, jeder Punkt hat eine Begründung', () => {
    for (const fall of FAELLE) {
      const l = fuehreAus(starte(fall), fall, { typ: 'beenden' });
      const a = diagnostikAuswertung(l, fall);
      expect(formFehler(a), fall.id).toEqual([]);
      expect(a.ergebnis.stufe, fall.id).toBe('kritisch');
      expect(a.punkte.find((p) => p.titel === 'SBAR-Übergabe')?.urteil).toBe('fehler');
      for (const p of a.punkte) expect(p.warum.length, `${fall.id}/${p.titel}`).toBeGreaterThan(30);
    }
  });
});
