import { describe, expect, it } from 'vitest';
import { freigabeFehler } from './freigabe';
import { HANDLUNGSVIDEOS, phasenBild, videoPfad } from './handlungsvideos';

describe('Handlungsvideos (Audit Live-Fund 2)', () => {
  for (const info of Object.values(HANDLUNGSVIDEOS)) {
    it(`${info.id}: vier Schritte mit Titel und Text`, () => {
      expect(info.schritte).toHaveLength(4);
      for (const s of info.schritte) { expect(s.titel.length).toBeGreaterThan(3); expect(s.text.length).toBeGreaterThan(30); }
      expect(new Set(info.schritte.map(s => s.titel)).size).toBe(4);
    });
    it(`${info.id}: vollständige Freigabe, sichtbar ungeprüft`, () => {
      expect(freigabeFehler(info.freigabe)).toEqual([]);
      expect(info.freigabe.status).toBe('ungeprueft');
    });
    it(`${info.id}: relative Pfade für Video und Ersatzbilder`, () => {
      expect(videoPfad(info.id)).toBe(`sim-videos/${info.id}.mp4`);
      expect([0, 1, 2, 3].map(i => phasenBild(info.id, i))).toEqual([1, 2, 3, 4].map(n => `sim-videos/${info.id}-${n}.webp`));
    });
  }
  it('Insulin: Video-Zeitachse ausdrücklich keine Haltezeit', () => {
    expect(HANDLUNGSVIDEOS.insulingabe.schritte[2].text).toMatch(/keine Haltezeit/);
  });
});
