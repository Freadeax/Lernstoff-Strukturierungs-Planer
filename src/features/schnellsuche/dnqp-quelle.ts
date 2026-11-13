// Anschluss an die DNQP-Fachdaten des Expertenstandards-Lernmoduls (src/features/dnqp/standards.ts).
// Die Daten werden dort gepflegt und hier nur gelesen und auf die Form des Suchers abgebildet.

import { STANDARDS } from '../dnqp/standards';
import type { Teil } from '../dnqp/typen';
import type { DnqpStandard } from './quellen';

const texte = (t: Teil[]) => t.map((x) => `${x.id}: ${x.text}`);

export const DNQP_STANDARDS: DnqpStandard[] = STANDARDS.map((s) => ({
  id: s.id,
  titel: s.titel,
  kurztitel: s.kurztitel,
  synonyme: s.synonyme,
  fassungen: s.fassungen.map(({ jahr, art }) => ({ jahr, art })),
  zielsetzung: s.zielsetzung,
  begruendung: s.begruendung,
  kriterien: s.kriterien.map((k) => ({
    id: k.id, nr: k.ebene, thema: k.thema,
    struktur: texte(k.struktur), prozess: texte(k.prozess), ergebnis: texte(k.ergebnis),
    stichworte: k.stichworte,
  })),
  kernaussagen: s.merke,
  praeambel: s.praeambel,
  geltung: s.geltung,
  fehlvorstellungen: s.fehlvorstellungen.map(({ id, falsch, richtig, beleg }) => ({ id, falsch, richtig, beleg })),
  status: s.status,
  themaIds: s.themaIds,
}));
