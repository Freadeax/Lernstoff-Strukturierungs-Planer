// Gemeinsame Datenquelle aller DNQP-Expertenstandards.
// Gelesen von: Lernmodul (#/lernen/dnqp), Schnellsucher (src/features/schnellsuche), Expertenstandard-Prüfung.
// Inhalte sinngemäß nach frei zugänglichen DNQP-Auszügen, kein Originalwortlaut.

import type { Expertenstandard } from './typen';
import { DEKUBITUS, HAUT, KONTINENZ, MUND, STURZ } from './standards/prophylaxen';
import { DEMENZ, ENTLASSUNG, ERNAEHRUNG, MOBILITAET, SCHMERZ, WUNDEN } from './standards/versorgung';

export type { Expertenstandard, Kriterium, Teil, Fehlvorstellung, Fassung, Quelle } from './typen';
export { aktuelleFassung, ankerKriterium, pfadZu } from './typen';

/** Reihenfolge: wie in der DNQP-Übersicht, danach der nicht eingeführte Mobilitätsstandard. */
export const STANDARDS: Expertenstandard[] = [
  DEKUBITUS, WUNDEN, ENTLASSUNG, ERNAEHRUNG, SCHMERZ, DEMENZ, STURZ, MUND, KONTINENZ, HAUT, MOBILITAET,
];

const NACH_ID = new Map(STANDARDS.map((s) => [s.id, s]));

export function standardVon(id: string): Expertenstandard | undefined {
  return NACH_ID.get(id);
}

/** Datum, an dem die Standardliste zuletzt gegen die DNQP-Übersicht geprüft wurde. */
export const STAND_UEBERSICHT = '2026-11-12';
