// Fallkatalog (Audit L-3): katalog.ts ist ein erzeugter Spiegel von FAELLE_V2 (Kopfdaten + ein Lader je Fall),
// damit Fallliste, Einsatz und Dokumentations-Trainer nicht alle Fälle (über 1 MB) laden müssen.
// Neu erzeugen nach neuen Fällen oder geänderten Titeln: `npm run faelle:katalog`.
import { readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { FallV2 } from '../typen';
import { FAELLE_V2 } from './index';
import { FALL_KOEPFE, FALL_LADER, type FallKopf } from './katalog';
import { ladeFall } from './laden';

const DATEI = 'src/features/praxis/kern/faelle/katalog.ts';
const module = import.meta.glob<Record<string, unknown>>(['./*.ts', '!./index.ts', '!./katalog.ts', '!./laden.ts', '!./*.test.ts'], { eager: true });

function kopf(f: FallV2): FallKopf {
  return {
    id: f.id, titel: f.titel, kurz: f.kurz, setting: f.setting, spur: f.spur,
    person: { name: f.person.name, alter: { ...f.person.alter } },
    ...(f.lehrplan ? { lehrplan: { ce: [...f.lehrplan.ce], abschnitt: [...f.lehrplan.abschnitt] } } : {}),
  };
}

/** Wo liegt welcher Fall (Datei und Exportname)? */
function fundorte(): Map<string, { datei: string; name: string }> {
  const orte = new Map<string, { datei: string; name: string }>();
  for (const [pfad, m] of Object.entries(module)) {
    for (const [name, wert] of Object.entries(m)) {
      const f = wert as Partial<FallV2> | null;
      if (f && typeof f === 'object' && f.schema === 2 && typeof f.id === 'string' && FAELLE_V2.includes(f as FallV2)) {
        orte.set(f.id, { datei: pfad.replace(/\.ts$/, ''), name });
      }
    }
  }
  return orte;
}

function erzeuge(): string {
  const orte = fundorte();
  const koepfe = FAELLE_V2.map((f) => `  ${JSON.stringify(kopf(f))},`).join('\n');
  const lader = FAELLE_V2.map((f) => {
    const o = orte.get(f.id)!;
    return `  ${JSON.stringify(f.id)}: () => import('${o.datei}').then((m) => m.${o.name}),`;
  }).join('\n');
  return `// Erzeugt von katalog.test.ts aus FAELLE_V2 – nicht von Hand ändern, sondern \`npm run faelle:katalog\` ausführen.
// Kopfdaten für Listen und ein Lader je Fall, damit nur der geöffnete Fall geladen wird (Audit L-3).
import type { FallV2 } from '../typen';

export interface FallKopf {
  id: string; titel: string; kurz: string; setting: FallV2['setting']; spur: FallV2['spur'];
  person: { name: string; alter: { jahre?: number; monate?: number } };
  lehrplan?: { ce: string[]; abschnitt: Array<'ad12' | 'ad3'> };
}

export const FALL_KOEPFE: readonly FallKopf[] = [
${koepfe}
];

export const FALL_LADER: Readonly<Record<string, () => Promise<FallV2>>> = {
${lader}
};
`;
}

describe('Fallkatalog (katalog.ts)', () => {
  it('passt zu FAELLE_V2', () => {
    const soll = erzeuge();
    if (process.env.FAELLE_KATALOG_SCHREIBEN) writeFileSync(DATEI, soll);
    expect(readFileSync(DATEI, 'utf8'), 'katalog.ts ist veraltet: npm run faelle:katalog ausführen').toBe(soll);
  });

  it('jeder Fall hat genau einen Fundort und einen Lader', () => {
    expect(fundorte().size).toBe(FAELLE_V2.length);
    expect(FALL_KOEPFE.map((k) => k.id)).toEqual(FAELLE_V2.map((f) => f.id));
    expect(Object.keys(FALL_LADER).sort()).toEqual(FAELLE_V2.map((f) => f.id).sort());
  });

  it('ladeFall liefert denselben Fall wie FAELLE_V2', async () => {
    for (const f of FAELLE_V2) expect(await ladeFall(f.id)).toBe(f);
    expect(await ladeFall('gibt-es-nicht')).toBeUndefined();
    expect(await ladeFall(undefined)).toBeUndefined();
  });
});
