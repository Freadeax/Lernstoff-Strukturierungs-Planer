// Laufender Fall im neuen Arbeitsplatz: nur Eingaben speichern, Zustand per Replay wiederherstellen.
import { geraet } from '../../../core/geraetestand';
import type { FallV2, Rolle, SimEventEingabe, Stufe } from '../kern/typen';

export const ARBEITSPLATZ_KEY = 'lernstoff.praxis.arbeitsplatz';

export interface Gespeichert {
  version: 1;
  fall: string;
  fallVersion: string;
  rolle: Rolle;
  stufe: Stufe;
  seed: number;
  eingaben: SimEventEingabe[];
}

const ROLLEN: readonly Rolle[] = [1, 2, 3, 'pflegefachperson'];

export function lies(fall: FallV2): Gespeichert | null {
  try {
    const raw = geraet.getItem(ARBEITSPLATZ_KEY);
    if (!raw) return null;
    const g = JSON.parse(raw) as Gespeichert;
    if (g?.version !== 1 || g.fall !== fall.id || g.fallVersion !== fall.version) return null;
    if (!ROLLEN.includes(g.rolle) || ![1, 2, 3].includes(g.stufe) || !Array.isArray(g.eingaben) || typeof g.seed !== 'number') return null;
    return g;
  } catch { return null; }
}

export function schreibe(g: Gespeichert | null) {
  try {
    if (g) geraet.setItem(ARBEITSPLATZ_KEY, JSON.stringify(g));
    else geraet.removeItem(ARBEITSPLATZ_KEY);
  } catch { /* nur Komfort: ohne Speicher läuft der Fall trotzdem */ }
}
