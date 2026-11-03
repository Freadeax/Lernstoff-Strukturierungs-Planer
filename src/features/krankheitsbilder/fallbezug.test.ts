import { describe, expect, it } from 'vitest';
import { pflegeModule } from '../../modules/pflege';
import { SCENARIOS } from '../praxis/catalog';
import { SZENARIEN } from '../fall/faelle';
import { faelleZuKrankheit, KI_KRANKHEITEN, krankheitenZuFall, PRAXIS_KRANKHEITEN } from './fallbezug';

const PROFILE = new Set((pflegeModule.diseaseProfiles ?? []).map((p) => p.id));

describe('Fallbezug der Krankheitsbilder', () => {
  it('nennt nur vorhandene Praxisfälle, KI-Szenarien und Steckbriefe', () => {
    const praxis = new Set(SCENARIOS.map((s) => s.id));
    const ki = new Set(SZENARIEN.map((s) => s.id));
    for (const [id, kh] of Object.entries(PRAXIS_KRANKHEITEN)) {
      expect(praxis.has(id), id).toBe(true);
      for (const k of kh) expect(PROFILE.has(k), `${id} → ${k}`).toBe(true);
    }
    for (const [id, kh] of Object.entries(KI_KRANKHEITEN)) {
      expect(ki.has(id), id).toBe(true);
      for (const k of kh) expect(PROFILE.has(k), `${id} → ${k}`).toBe(true);
    }
  });

  it('findet Fälle in beide Richtungen', () => {
    expect(faelleZuKrankheit(PRAXIS_KRANKHEITEN, 'kh.schlaganfall')).toEqual(['reha', 'schlaganfall']);
    expect(faelleZuKrankheit(KI_KRANKHEITEN, 'kh.delir')).toEqual(['hueft-tep', 'delir-nacht']);
    expect(krankheitenZuFall(PRAXIS_KRANKHEITEN, 'demenz')).toEqual(['kh.demenz', 'kh.pneumonie']);
    expect(krankheitenZuFall(PRAXIS_KRANKHEITEN, 'palliativ')).toEqual([]);
  });
});
