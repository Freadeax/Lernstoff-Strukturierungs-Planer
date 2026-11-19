import { describe, expect, it } from 'vitest';
import { NORMAL, type ModellKontext } from '../modell';
import type { AktiverTreiber, Grundgroessen, Treiber } from '../typen';
import { KATALOG } from '../katalog';
import { PFLEGE_MODELL } from './pflegemodell';
import { istNacht, uhrzeitMin } from './schlaf';

/** Hochbetagte ab Uhrzeit `startMin` für `stunden` Stunden */
function nacht(startMin: number, stunden: number, treiber: Treiber[], start: Partial<Grundgroessen> = {}) {
  const basis = { ...NORMAL, ...start };
  let g = { ...basis };
  const tr: AktiverTreiber[] = treiber.map((t) => ({ ...t, seit: 0 }));
  const k = (t: number): ModellKontext => ({ altersgruppe: 'hochbetagt', basis, t, uhrzeitMin: startMin });
  let t = 0;
  for (; t < stunden * 3600; t += 5) g = PFLEGE_MODELL.naechster(g, tr, 5, k(t));
  return { g, a: PFLEGE_MODELL.anzeige(g, k(t)) };
}

const LAERM: Treiber = { art: 'schlafstoerung', staerke: 0.8 };

describe('G7 Schlaf und Tageszeit', () => {
  it('Uhrzeit läuft mit der Spielzeit über Mitternacht', () => {
    expect(uhrzeitMin({ altersgruppe: 'erwachsen', uhrzeitMin: 23 * 60 + 30, t: 3600 })).toBe(30);
    expect(istNacht(2 * 60)).toBe(true);
    expect(istNacht(14 * 60)).toBe(false);
  });
  it('gestörte Nacht baut Schlafdefizit und Delir auf, ruhige Nacht baut ab', () => {
    const gestoert = nacht(22 * 60, 6, [LAERM], { schlafdefizit: 0.2 });
    const ruhig = nacht(22 * 60, 6, [], { schlafdefizit: 0.2 });
    expect(gestoert.g.schlafdefizit!).toBeGreaterThan(0.4);
    expect(ruhig.g.schlafdefizit!).toBeLessThan(0.2);
    expect(gestoert.g.delir).toBeGreaterThan(ruhig.g.delir + 0.1);
    expect(ruhig.a.schlaf).toBe('schläft');
  });
  it('Reize verringern schützt den Schlaf (Wirkkurve schlafSchutz)', () => {
    const geschuetzt = nacht(22 * 60, 4, [LAERM], { schlafdefizit: 0.2, schlafSchutz: 1 });
    const ungeschuetzt = nacht(22 * 60, 4, [LAERM], { schlafdefizit: 0.2 });
    expect(geschuetzt.g.schlafdefizit!).toBeLessThan(ungeschuetzt.g.schlafdefizit!);
    expect(KATALOG['reizarm-gestalten'].wirkung?.some((w) => w.groesse === 'schlafSchutz')).toBe(true);
  });
  it('Sundowning: bei Delir abends schlechter orientiert als am Vormittag', () => {
    const start = { schlafdefizit: 0.3, delir: 0.5, orientierung: 0.5 };
    const abends = nacht(19 * 60, 1, [], start);
    const morgens = nacht(9 * 60, 1, [], start);
    expect(abends.g.orientierung).toBeLessThan(morgens.g.orientierung - 0.05);
  });
  it('ohne Schlaf-Thema ändert die Uhrzeit nichts (bestehende Fälle unverändert)', () => {
    const tag = nacht(10 * 60, 1, [], { delir: 0.3 });
    const nachts = nacht(2 * 60, 1, [], { delir: 0.3 });
    expect(nachts.g).toEqual(tag.g);
    expect(nachts.a.schlaf).toBeUndefined();
  });
});
