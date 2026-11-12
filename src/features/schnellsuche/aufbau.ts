// Baut den Suchindex aus allen Quellen. Wird von der Seite einmal je Fachmodul aufgerufen.

import type { CatalogModule } from '../../modules/catalog-types';
import { AUFGABEN, BEREICHE } from '../expertenstandards/aufgaben';
import { INSTRUMENTE } from '../assessment/instrumente';
import { STECKBRIEFE } from '../assessment/steckbriefe';
import { GRUPPEN } from '../assessment/vignetten';
import { DNQP_STANDARDS } from './dnqp-quelle';
import {
  ausDnqp, ausGlossar, ausInstrumenten, ausKatalogStandards, ausKurzwissen, ausTrainer, glossarSynonyme, standardsAus, themaZuStandards,
  type DnqpStandard, type StandardInfo,
} from './quellen';
import { baueIndex, type Index, type SuchDok } from './suchkern';
import { SYNONYME } from './synonyme';

export interface Suchbestand { index: Index; standards: StandardInfo[] }

export function baueBestand(modul: CatalogModule, dnqp: DnqpStandard[] = DNQP_STANDARDS): Suchbestand {
  const standards = standardsAus(modul, dnqp);
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
    ...ausTrainer(Object.entries(AUFGABEN).flatMap(([bereich, liste]) => liste.map((aufgabe) => ({ bereich, aufgabe }))), themen),
  ];
  // Standardnamen und DNQP-Synonyme sind selbst Synonymgruppen: „Dekubitusprophylaxe“ ↔ eigene Alias-Namen
  const ausStandards = dnqp.filter((s) => s.synonyme?.length).map((s) => [s.kurztitel, ...s.synonyme!]);
  return { index: baueIndex(doks, [...SYNONYME, ...glossarSynonyme(modul), ...ausStandards]), standards };
}
