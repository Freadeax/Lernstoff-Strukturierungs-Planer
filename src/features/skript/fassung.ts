// Fassungen eines Skripts: alte Gliederung aufheben, Abschnitte über Nummer/Titel wiederfinden.
// Eigenes kleines Modul, weil der Import (store.ts) zum Startpaket gehört.

import { abschnittSchluessel } from './parser';
import type { Abschnitt, Skript, SkriptFassung } from './typen';

export const MAX_FASSUNGEN = 10;

/** Gliederung der bisherigen Fassung festhalten, bevor eine neue sie ersetzt. */
export function fassungVon(s: Skript): SkriptFassung {
  return { hash: s.hash, stand: s.geaendert, abschnitte: s.abschnitte.map((a) => ({ id: a.id, ...(a.nummer ? { nummer: a.nummer } : {}), titel: a.titel })) };
}

/**
 * Neue Fassung übernehmen: frühere Gliederungen bleiben (neueste zuerst), Abschnitt-IDs der alten Fassung
 * werden über Nummer bzw. Titel auf die neuen abgebildet (für Lesestand und alte Links).
 */
export function neueFassung(alt: Skript, neu: Skript): { skript: Skript; idKarte: Map<string, string> } {
  const neuNach = new Map(neu.abschnitte.map((a) => [abschnittSchluessel(a), a.id]));
  const idKarte = new Map<string, string>();
  for (const a of alt.abschnitte) {
    const ziel = neuNach.get(abschnittSchluessel(a)) ?? neu.abschnitte.find((x) => x.titel === a.titel)?.id;
    if (ziel) idKarte.set(a.id, ziel);
  }
  const fassungen = [fassungVon(alt), ...(alt.fassungen ?? [])].slice(0, MAX_FASSUNGEN);
  return { skript: { ...neu, fassungen }, idKarte };
}

export interface Fundstelle {
  abschnitt?: Abschnitt;
  /** Hinweis, wenn der Link auf eine ältere Fassung zeigt. */
  hinweis?: string;
}

/**
 * Abschnitt zu einem Link finden. `nr` (Abschnittsnummer) ist stabil und hat Vorrang vor `a` (Reihenfolge-ID).
 * Gibt es die Nummer nicht mehr, sucht die Funktion in den älteren Fassungen und nennt, was dort stand.
 */
export function findeAbschnitt(s: Skript, link: { nr?: string; a?: string }): Fundstelle {
  if (link.nr) {
    const direkt = s.abschnitte.find((x) => x.nummer === link.nr);
    if (direkt) return { abschnitt: direkt };
    for (const f of s.fassungen ?? []) {
      const alt = f.abschnitte.find((x) => x.nummer === link.nr);
      if (!alt) continue;
      const jetzt = s.abschnitte.find((x) => x.titel === alt.titel);
      const datum = f.stand.slice(0, 10);
      return jetzt
        ? { abschnitt: jetzt, hinweis: `Der Link zeigt auf Abschnitt ${link.nr} der Fassung vom ${datum}. „${alt.titel}“ steht jetzt unter ${jetzt.nummer ? `Nummer ${jetzt.nummer}` : 'einer anderen Stelle'}.` }
        : { hinweis: `Abschnitt ${link.nr} „${alt.titel}“ gab es in der Fassung vom ${datum}. In der aktuellen Fassung ist er entfallen.` };
    }
    return { hinweis: `Abschnitt ${link.nr} gibt es in diesem Skript nicht.` };
  }
  if (link.a) {
    const x = s.abschnitte.find((y) => y.id === link.a);
    if (x) return { abschnitt: x };
  }
  return {};
}
