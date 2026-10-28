import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getModule, modules } from './registry';
import { pruefeModul } from './vertrag';

describe('Fachmodul-Registry', () => {
  it('hat eindeutige Modul-IDs und findet jedes Modul', () => {
    expect(new Set(modules.map((m) => m.id)).size).toBe(modules.length);
    for (const m of modules) expect(getModule(m.id)).toBe(m);
  });

  for (const m of modules) {
    it(`${m.id} erfüllt den fachneutralen Modulvertrag`, () => {
      expect(pruefeModul(m)).toEqual([]);
    });
  }

  it('der Vertrag erkennt kaputte Module', () => {
    const kaputt = {
      id: 'Test Modul', name: '', version: '1',
      subjects: [{ id: 'f1', moduleId: 'anderes' }],
      topics: [
        { id: 't1', subjectId: 'f1', name: 'A', prerequisites: ['t2'] },
        { id: 't2', subjectId: 'fx', name: 'B', prerequisites: ['t1', 'tx'] },
        { id: 't3', subjectId: 'f1', name: 'C', prerequisites: [] },
        { id: 't3', subjectId: 'f1', name: 'D', prerequisites: [] },
      ],
      glossary: [{ term: 'X', definition: '', topicIds: ['ty'] }], taskFormats: [], checkRules: [],
    };
    const f = pruefeModul(kaputt as never).join('\n');
    for (const teil of ['Modul-ID', 'ohne Namen', 'ID doppelt: t3', 'gehört zu Modul anderes', 'unbekannte(s) Fach fx', 'Voraussetzung tx', 'Thema ty', 'Zyklus']) {
      expect(f).toContain(teil);
    }
  });
});

// Neue Funktionen sollen Fachinhalte über die Registry holen (getModule(moduleId)), damit ein
// weiteres Fachgebiet ohne Codeänderung andocken kann. Bestehende Pflege-spezifische Seiten
// dürfen das Pflege-Modul direkt laden; die Liste darf nur kleiner werden.
const DIREKT_ERLAUBT = [
  'features/Zusammenfassen.tsx',
  'features/ce/CeSeite.tsx',
  'features/fall/Fallsimulator.tsx',
  'features/fehlerheft/FehlerheftSeite.tsx',
  'features/karteikarten/ui/KartenHinweis.tsx',
  'features/karteikarten/ui/kontext.ts',
  'features/klasse/vorlagen.ts',
  'features/krankheitsbilder/Krankheitsbilder.tsx',
  'features/lernplan/trainer.ts',
  'features/mindmap/Mindmaps.tsx',
  'features/pflegeplanung/Pflegeplanung.tsx',
  'features/simulation/SimulationSeite.tsx',
  'features/skript/store.ts',
  'features/skript/ui/Skript.tsx',
  'features/zusammenfasser/ui/FragenAnsicht.tsx',
  'widgets/mocks.ts',
];

function dateien(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? dateien(p) : /\.tsx?$/.test(n) && !/\.test\.tsx?$/.test(n) ? [p] : [];
  });
}

describe('Kopplung an das Pflege-Modul', () => {
  it('nur bekannte Dateien laden das Pflege-Modul direkt (neue Dateien: getModule aus registry.ts)', () => {
    const src = join(__dirname, '..');
    const direkt = dateien(src)
      .filter((p) => !p.includes(`${join('src', 'modules')}`))
      .filter((p) => /from\s+['"][./]*(?:\.\.\/)*modules\/pflege(?:\/index)?['"]/.test(readFileSync(p, 'utf8')))
      .map((p) => relative(src, p).split('\\').join('/'))
      .sort();
    expect(direkt.filter((p) => !DIREKT_ERLAUBT.includes(p))).toEqual([]);
    // Wurde eine Datei auf die Registry umgestellt, hier austragen, damit die Liste ehrlich bleibt.
    expect(DIREKT_ERLAUBT.filter((p) => !direkt.includes(p))).toEqual([]);
  });
});
