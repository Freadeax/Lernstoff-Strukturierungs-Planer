// Welche Praxisfälle auf diesem Gerät abgeschlossen sind (P10): ersetzt das Archiv des alten Simulators für
// Bereit-Check, CE-Lernpfad und Fallauswahl. Je Fall ein Eintrag (id = Fall-ID), in der Datensicherung enthalten.
// Alte Archiv-Einträge zählen über ihren Nachfolgefall mit.
import { ALT_ZU_NEU, altesArchiv } from './altfaelle';

export const ERLEDIGT_KEY = 'lernstoff.praxis.erledigt';

export interface Erledigt { id: string; am: string; art: 'frei' | 'gefuehrt' }

function lies(): Erledigt[] {
  try {
    const roh = JSON.parse(localStorage.getItem(ERLEDIGT_KEY) ?? '[]') as unknown;
    return Array.isArray(roh) ? roh.filter((x): x is Erledigt => !!x && typeof (x as Erledigt).id === 'string' && typeof (x as Erledigt).am === 'string') : [];
  } catch { return []; }
}

/** Fall als abgeschlossen merken (frei im Arbeitsplatz oder geführt in Stufe 1). */
export function merkeErledigt(fall: string, art: Erledigt['art'], am = new Date().toISOString()) {
  try {
    const liste = lies().filter((x) => x.id !== fall);
    localStorage.setItem(ERLEDIGT_KEY, JSON.stringify([{ id: fall, am, art }, ...liste]));
  } catch { /* nur Komfort */ }
}

/** IDs abgeschlossener Kernfälle, alte Abschlüsse auf den Nachfolger übersetzt. */
export function erledigteFaelle(): Set<string> {
  const ids = new Set(lies().map((x) => x.id));
  for (const a of altesArchiv()) if (a.fertig) ids.add(ALT_ZU_NEU[a.fall] ?? a.fall);
  return ids;
}
