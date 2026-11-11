import { describe, expect, it } from 'vitest';
import { befundSchritte, HTQ, htqBewertung } from './befundung';
import type { RoentgenVariante } from './phantom';

const VARIANTEN: RoentgenVariante[] = ['normal', 'pneumonie', 'pneumothorax', 'stauung'];

describe('Geführte Befundung', () => {
  it('jeder Schritt hat genau eine richtige Antwort und einen Bereich im Bild', () => {
    for (const v of VARIANTEN) {
      const s = befundSchritte(v);
      expect(s.length).toBeGreaterThanOrEqual(7);
      for (const x of s) {
        expect(x.optionen.filter((o) => o.richtig).length, `${v}/${x.id}`).toBe(1);
        expect(x.bereich.x + x.bereich.w).toBeLessThanOrEqual(1);
        expect(x.bereich.y + x.bereich.h).toBeLessThanOrEqual(1);
      }
    }
  });
  it('Gesamtbild unterscheidet alle Varianten', () => {
    const richtige = VARIANTEN.map((v) => befundSchritte(v).find((s) => s.id === 'gesamt')!.optionen.findIndex((o) => o.richtig));
    expect(new Set(richtige).size).toBe(VARIANTEN.length);
  });
  it('HTQ: nur bei Stauung über 0,5; Messung mit Toleranz', () => {
    expect(VARIANTEN.filter((v) => HTQ[v] > 0.5)).toEqual(['stauung']);
    expect(htqBewertung(undefined, 0.35)).toBe('fehlt');
    expect(htqBewertung(0.4, 0.35)).toBe('gut');
    expect(htqBewertung(0.55, 0.35)).toBe('ungenau');
  });
});
