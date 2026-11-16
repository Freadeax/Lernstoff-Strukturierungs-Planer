import { describe, expect, it } from 'vitest';
import { getModule } from '../../modules/registry';
import { leafTopics } from '../lernplan/store';
import { formFehler } from '../../ui/sim/auswertung';
import { DIALOGE, ENDE, TECHNIK } from './dialoge';
import { antworte, auswertung, ergebnis, fertig, reihenfolge, starte } from './gespraech';

describe('Gesprächssimulator: Dialoge', () => {
  it('Verweise gültig, je Knoten eine gute Antwort, keine Schleifen, Themen sind Blätter', () => {
    const blaetter = new Set(leafTopics(getModule('pflege-generalistisch')!.topics).map((t) => t.id));
    for (const d of DIALOGE) {
      const ids = new Set(d.knoten.map((k) => k.id));
      expect(ids.size, d.id).toBe(d.knoten.length);
      expect(ids.has(d.start)).toBe(true);
      for (const t of d.topicIds) expect(blaetter.has(t), `${d.id}: ${t}`).toBe(true);
      for (const k of d.knoten) {
        expect(k.antworten.length, k.id).toBe(3);
        expect(k.antworten.some((a) => a.urteil === 'gut'), k.id).toBe(true);
        for (const a of k.antworten) {
          expect(a.weiter === ENDE || ids.has(a.weiter), `${d.id}/${k.id} → ${a.weiter}`).toBe(true);
          expect(TECHNIK[a.technik]).toBeDefined();
          expect(a.warum.length).toBeGreaterThan(20);
        }
      }
      // alle Wege enden nach höchstens 8 Zügen
      const tiefe = (id: string, n: number): number => (id === ENDE ? n : Math.max(...d.knoten.find((k) => k.id === id)!.antworten.map((a) => tiefe(a.weiter, n + 1))));
      expect(tiefe(d.start, 0), d.id).toBeLessThanOrEqual(8);
    }
  });

  it('bester Weg ist stabil, schlechtester kritisch', () => {
    for (const d of DIALOGE) {
      let gut = starte(d), schlecht = starte(d);
      while (!fertig(gut)) gut = antworte(gut, d.knoten.find((k) => k.id === gut.aktuell)!.antworten.findIndex((a) => a.urteil === 'gut'));
      while (!fertig(schlecht)) { const k = d.knoten.find((x) => x.id === schlecht.aktuell)!; const i = k.antworten.reduce((m, a, j) => (a.vertrauen < k.antworten[m]!.vertrauen ? j : m), 0); schlecht = antworte(schlecht, i); }
      const eg = ergebnis(gut), es = ergebnis(schlecht);
      expect(eg.prozent, d.id).toBe(100);
      expect(auswertung(d, eg).ergebnis.stufe, d.id).toBe('stabil');
      expect(auswertung(d, es).ergebnis.stufe, d.id).toBe('kritisch');
      expect(formFehler(auswertung(d, es))).toEqual([]);
    }
  });

  it('Reihenfolge ist eine stabile Permutation', () => {
    const r = reihenfolge(3, 42, 'a1');
    expect([...r].sort()).toEqual([0, 1, 2]);
    expect(reihenfolge(3, 42, 'a1')).toEqual(r);
  });
});

describe('KI-Rückmeldung einlesen', () => {
  it('nimmt nur Zitate aus eigenen Äußerungen und bekannte Urteile', async () => {
    const { leseRueckmeldung } = await import('./claude');
    const verlauf = [{ von: 'gegenueber' as const, text: 'Ich will nach Hause!' }, { von: 'ich' as const, text: 'Sie machen sich Sorgen um Ihre Kinder.' }];
    const a = leseRueckmeldung(JSON.stringify({ stufe: 'stabil', zusammenfassung: 'Gut.', merksaetze: ['A'], punkte: [
      { zitat: 'Sie machen sich Sorgen', urteil: 'gut', technik: 'validation', warum: 'Gefühl aufgegriffen.', besser: 'x' },
      { zitat: 'Ich will nach Hause', urteil: 'fehler', technik: 'korrigieren', warum: 'Zitat der Rolle.', besser: '' },
      { zitat: 'Sie machen sich Sorgen', urteil: 'super', technik: 'validation', warum: 'kaputt', besser: '' },
    ] }), verlauf);
    expect(a.punkte).toHaveLength(1);
    expect(a.punkte[0]).toMatchObject({ urteil: 'gut', titel: 'Validation' });
    expect(a.punkte[0]!.besser).toBeUndefined();
    expect(formFehler(a)).toEqual([]);
  });
});
