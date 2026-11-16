import { describe, expect, it } from 'vitest';
import type { CatalogModule } from '../../modules/catalog-types';
import { getModule } from '../../modules/registry';
import { fragenJeTrainer, karteZumThema, kurzWissen, ladePools, themenNetz, waehleFragen, FRAGEN } from './mikro';

const modul = getModule('pflege-generalistisch') as CatalogModule;

describe('Mikro-Einheit', () => {
  it('wählt drei kurze Fragen aus einem Trainer, Grundlagen zuerst', async () => {
    const pools = await ladePools();
    let n = 0;
    for (const t of modul.topics) {
      const w = waehleFragen(pools, t.id, () => 0.3);
      if (!w) continue;
      n++;
      expect(w.aufgaben).toHaveLength(FRAGEN);
      expect(w.aufgaben.every((a) => a.topicIds.includes(t.id) && a.art !== 'beschriften' && a.art !== 'fall')).toBe(true);
      expect(new Set(w.aufgaben.map((a) => a.id)).size).toBe(FRAGEN);
    }
    // Ein guter Teil der Katalogthemen hat genug Fragen für eine Einheit.
    expect(n).toBeGreaterThan(20);
    // Diese Einheit nutzt der Oberflächentest (scripts/check-lernalltag.mjs).
    expect(waehleFragen(pools, 'thema.ph.hygiene')).not.toBeNull();
  });

  it('nimmt ohne genug Fragen keine Runde', () => {
    expect(waehleFragen([], 'thema.x')).toBeNull();
    expect(fragenJeTrainer([], 'thema.x')).toEqual([]);
  });

  it('kurz erklärt: höchstens drei Begriffe, kürzeste zuerst; Karte wiederholt keinen Begriff', () => {
    const t = modul.topics.find((x) => modul.glossary.filter((g) => g.topicIds?.includes(x.id)).length > 4)!;
    const k = kurzWissen(modul, t.id);
    expect(k.begriffe).toHaveLength(3);
    expect(k.begriffe[0]!.definition.length).toBeLessThanOrEqual(k.begriffe[2]!.definition.length);
    const karte = karteZumThema(modul, t.id, k.begriffe.map((b) => b.term), '2026-11-16');
    expect(karte).not.toBeNull();
    expect(k.begriffe.map((b) => b.term)).not.toContain(karte!.term);
    expect(karteZumThema(modul, t.id, [], '2026-11-16')).toEqual(karteZumThema(modul, t.id, [], '2026-11-16'));
  });

  it('Themen-Netz verbindet Themen über gemeinsame Krankheitsbilder', () => {
    const p = modul.diseaseProfiles!.find((d) => d.topicIds.length > 1)!;
    const netz = themenNetz(modul, p.topicIds[0]!);
    const nachbar = netz.find((k) => k.topic.id === p.topicIds[1]);
    expect(nachbar?.gruende.some((g) => g.art === 'krankheitsbild' && g.id === p.id)).toBe(true);
    expect(netz.some((k) => k.topic.id === p.topicIds[0])).toBe(false);
  });

  it('Themen-Netz zeigt Voraussetzungen in beide Richtungen', () => {
    const t = modul.topics.find((x) => x.prerequisites.length > 0);
    if (!t) return;
    const v = t.prerequisites[0]!;
    expect(themenNetz(modul, t.id).find((k) => k.topic.id === v)?.gruende.some((g) => g.art === 'voraussetzung')).toBe(true);
    expect(themenNetz(modul, v).find((k) => k.topic.id === t.id)?.gruende.some((g) => g.art === 'baut-auf')).toBe(true);
  });
});
