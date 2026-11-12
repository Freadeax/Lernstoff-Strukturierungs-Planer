// Anschluss an die DNQP-Fachdaten des Expertenstandards-Lernmoduls (src/features/dnqp/standards.ts).
// Die Daten werden dort gepflegt und hier nur gelesen. Solange sie noch nicht auf main sind, bleibt die Liste leer
// und der Sucher arbeitet mit Katalog, Trainer, Glossar und Instrumenten.

import type { DnqpStandard } from './quellen';

export const DNQP_STANDARDS: DnqpStandard[] = [];
