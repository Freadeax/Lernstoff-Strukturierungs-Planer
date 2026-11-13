// Baut den Suchindex aus allen Quellen. Wird von der Seite einmal je Fachmodul aufgerufen.

import type { CatalogModule } from '../../modules/catalog-types';
import { AUFGABEN, BEREICHE } from '../expertenstandards/aufgaben';
import * as hygiene from '../hygiene/aufgaben';
import * as notfall from '../notfall/aufgaben';
import * as recht from '../recht/aufgaben';
import * as arznei from '../arzneimittel/aufgaben';
import type { Aufgabe } from '../quiz/quiz';
import { INSTRUMENTE } from '../assessment/instrumente';
import { STECKBRIEFE } from '../assessment/steckbriefe';
import { GRUPPEN } from '../assessment/vignetten';
import { DNQP_STANDARDS } from './dnqp-quelle';
import {
  ausDnqp, ausGlossar, ausInstrumenten, ausKatalogStandards, ausKurzwissen, ausTrainer, esStandardsVon, glossarSynonyme, standardsAus, themaZuStandards,
  type DnqpStandard, type StandardInfo,
} from './quellen';
import { ausNormen, REGELWERKE } from './regelwerke';
import { baueIndex, type Index, type SuchDok } from './suchkern';
import { SYNONYME } from './synonyme';

export interface Suchbestand { index: Index; standards: StandardInfo[] }

const flach = (a: Record<string, Aufgabe[]>) => Object.entries(a).flatMap(([bereich, liste]) => liste.map((aufgabe) => ({ bereich, aufgabe })));

/** Trainer der weiteren Regelwerke: Aufgaben und Kurzwissen, alle dem Regelwerk zugeordnet. */
const WEITERE: Array<{ id: string; aufgaben: Record<string, Aufgabe[]>; bereiche: Array<{ id: string; label: string; wissen: string[] }> }> = [
  { id: 'rw.hygiene', aufgaben: hygiene.AUFGABEN, bereiche: hygiene.BEREICHE },
  { id: 'rw.notfall', aufgaben: notfall.AUFGABEN, bereiche: notfall.BEREICHE },
  { id: 'rw.arzneimittel', aufgaben: arznei.AUFGABEN, bereiche: arznei.BEREICHE },
  { id: 'rw.recht', aufgaben: recht.AUFGABEN, bereiche: recht.BEREICHE },
];

export function baueBestand(modul: CatalogModule, dnqp: DnqpStandard[] = DNQP_STANDARDS): Suchbestand {
  const standards = [...standardsAus(modul, dnqp), ...REGELWERKE];
  const themen = themaZuStandards(modul);
  const mitDnqp = new Set(dnqp.map((s) => s.id));
  const doks: SuchDok[] = [
    ...ausDnqp(dnqp),
    ...ausKatalogStandards(modul, mitDnqp),
    ...ausKurzwissen(BEREICHE, standards),
    ...ausInstrumenten(Object.values(INSTRUMENTE), themen,
      (id) => GRUPPEN.find((g) => g.instrumente.includes(id as never))?.id,
      (id) => STECKBRIEFE[id as keyof typeof STECKBRIEFE]?.grenzen),
    ...ausGlossar(modul),
    ...ausTrainer(flach(AUFGABEN), { pfad: '/lernen/expertenstandards', name: 'Trainer', standardsVon: esStandardsVon(themen) }),
    ...ausNormen(modul),
    ...WEITERE.flatMap((w) => {
      const rw = REGELWERKE.find((r) => r.id === w.id)!;
      return [
        ...ausKurzwissen(w.bereiche, standards, { pfad: rw.pfad, name: rw.kurz, fest: rw.id }),
        ...ausTrainer(flach(w.aufgaben), { pfad: rw.pfad, name: rw.kurz, standardsVon: () => [rw.id] }),
      ];
    }),
  ];
  // Standardnamen und DNQP-Synonyme sind selbst Synonymgruppen: „Dekubitusprophylaxe“ ↔ eigene Alias-Namen
  const ausStandards = dnqp.filter((s) => s.synonyme?.length).map((s) => [s.kurztitel, ...s.synonyme!]);
  return { index: baueIndex(doks, [...SYNONYME, ...glossarSynonyme(modul), ...ausStandards]), standards };
}
