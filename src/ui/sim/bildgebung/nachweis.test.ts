import { describe, expect, it } from 'vitest';
import { FAELLE } from '../../../features/diagnostik/faelle';
import { bildNachweis, hatHu, istKalibriert, nachweisText, trifft, type Bildserie } from './serie';

const serien: Bildserie[] = FAELLE.flatMap((f) => f.bildgebung.flatMap((u) => [u.serie, ...(u.echt ? [u.echt] : [])]));
const echt = serien.filter((s) => s.quelle.art === 'bilder');
const synthetisch = serien.filter((s) => s.quelle.art === 'phantom');

describe('Bildnachweis und Messgrenzen (SIM-08)', () => {
  it('jede Serie nennt Bildart, Quelle, Lizenz und Bearbeitung', () => {
    for (const s of serien) {
      const n = bildNachweis(s);
      for (const v of [n.bildart, n.quelle, n.lizenz, n.bearbeitung]) expect(v.length, s.id).toBeGreaterThan(2);
      expect(nachweisText(s)).toContain('Lizenz:');
    }
    for (const s of echt) expect(bildNachweis(s).url).toMatch(/^https:\/\//);
  });
  it('HU nur bei CT mit Rohdaten, nie beim 8-Bit-Bild', () => {
    const ctPhantom = synthetisch.find((s) => s.quelle.modalitaet === 'ct')!;
    expect(hatHu(ctPhantom, null)).toBe(true);
    const ctEcht = echt.find((s) => s.quelle.modalitaet === 'ct')!;
    expect(hatHu(ctEcht, { skala: 'hu' })).toBe(true);
    expect(hatHu(ctEcht, { skala: 'grau' })).toBe(false);
    expect(hatHu(ctEcht, null)).toBe(false);
    for (const s of serien.filter((x) => x.quelle.modalitaet === 'roentgen')) expect(hatHu(s, { skala: 'hu' })).toBe(false);
  });
  it('mm nur mit Maßstab: Phantome ja, echte Bilder nur mit pixelMm', () => {
    for (const s of synthetisch) expect(istKalibriert(s)).toBe(true);
    for (const s of echt) expect(istKalibriert(s)).toBe(!!s.pixelMm);
  });
  it('Befundmarken treffen getrennt in echten und synthetischen Bildern', () => {
    for (const gruppe of [echt, synthetisch]) {
      expect(gruppe.length).toBeGreaterThan(0);
      for (const s of gruppe) for (const b of s.befunde) {
        const i = b.schichten ? b.schichten[0] : 0;
        expect(trifft(s, i, b.x, b.y)?.id, `${s.id}/${b.id}`).toBe(b.id);
        // weit daneben trifft nicht
        expect(trifft(s, i, b.x > 0.5 ? 0.02 : 0.98, b.y > 0.5 ? 0.02 : 0.98)?.id).not.toBe(b.id);
      }
    }
  });
});
