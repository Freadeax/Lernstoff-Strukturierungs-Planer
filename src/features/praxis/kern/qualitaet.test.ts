import { writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { WEITERLERNEN_V2 } from '../arbeitsplatz/weiterlernen';
import { FAELLE_V2 } from './faelle';
import { qualitaetsraster, rasterBericht } from './qualitaet';

const WL = new Set(Object.keys(WEITERLERNEN_V2));

/** Bekannte Lücken je Fall (Audit P20, 19.11.2026). Wird ein Punkt erfüllt, hier streichen; neue Lücken sind verboten. */
const BEKANNT: Record<string, string[]> = {
  // Nur Angehörige als Gegenüber; zweite Person (Kollegin/Nachtdienst-Ärztin vor Ort oder Seelsorge) fehlt noch (P18).
  'kh-sterbephase-nacht': ['gegenueber'],
};

describe('Qualitätsraster je Fall (P20)', () => {
  for (const f of FAELLE_V2) {
    it(`${f.id}: keine neuen Lücken`, () => {
      const offen = qualitaetsraster(f, WL).filter((p) => !p.ok).map((p) => p.id);
      expect(offen.filter((id) => !(BEKANNT[f.id] ?? []).includes(id)), JSON.stringify(qualitaetsraster(f, WL).filter((p) => !p.ok))).toEqual([]);
    });
  }

  it('Bericht als Markdown', () => {
    const md = rasterBericht(FAELLE_V2, WL, '2026-11-19');
    for (const f of FAELLE_V2) expect(md).toContain(f.id);
    const ziel = process.env.RASTER_BERICHT;
    if (ziel) writeFileSync(ziel, md);
  });
});
