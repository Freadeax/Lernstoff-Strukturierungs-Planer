import { describe, expect, it } from 'vitest';
import { pruefeText } from '../dnqp/pruefung';
import { BEISPIEL } from './PruefAnsicht';
import { modules } from '../../modules/registry';
import type { CatalogModule } from '../../modules/catalog-types';
import { baueBestand } from './aufbau';
import { DNQP_STANDARDS } from './dnqp-quelle';
import { suche } from './suchkern';
import { PHASEN, phaseVon, vergleiche } from './vergleich';

describe('Kriterien-Vergleich', () => {
  const mitKriterien = DNQP_STANDARDS.filter((s) => s.kriterien.length);
  it('ordnet jedes Kriterium einer Phase des Pflegeprozesses zu', () => {
    for (const s of mitKriterien) for (const k of s.kriterien) expect(phaseVon(k), `${s.id}:${k.id} ${k.thema}`).toBeDefined();
  });
  it('hat für jede Phase in jedem Standard mit Kriterien einen Eintrag', () => {
    for (const p of PHASEN) expect(vergleiche(mitKriterien, { phase: p.id }).length, p.label).toBe(mitKriterien.length);
  });
  it('vergleicht auch nach Ebenen-Nummer', () => {
    const z = vergleiche(DNQP_STANDARDS, { ebene: 1 });
    expect(z.every((x) => x.kriterien.every((k) => k.nr === 1))).toBe(true);
  });
});

describe('Häufige Irrtümer und Aussagen prüfen', () => {
  const { index } = baueBestand(modules[0] as CatalogModule);
  it('macht jede Fehlvorstellung als eigenen Eintrag suchbar', () => {
    const anzahl = DNQP_STANDARDS.reduce((n, s) => n + (s.fehlvorstellungen?.length ?? 0), 0);
    expect(index.doks.filter((d) => d.art === 'irrtum')).toHaveLength(anzahl);
    expect(suche(index, 'Bettgitter').treffer.some((t) => t.dok.art === 'irrtum' && t.dok.standardIds.includes('es.sturz'))).toBe(true);
  });
  it('hat ein Beispiel mit zwei erkannten Irrtümern und einem richtigen Satz', () => {
    const zeilen = BEISPIEL.split('\n');
    expect(zeilen).toHaveLength(3);
    expect(pruefeText(BEISPIEL).filter((t) => !t.wirktRichtiggestellt).length).toBeGreaterThanOrEqual(2);
  });
});
