// Laufende Simulation und Verlauf liegen in localStorage: klein, nur auf diesem Gerät, und eine laufende
// Prüfung übersteht so ein Neuladen oder das Wegwischen der App auf dem iPhone. Keine neue DB-Tabelle nötig.
import type { Antwort, Auswahl, SimFrage, Wertung } from './simulation';

const LAUFEND = 'lernstoff.simulation.laufend';
const VERLAUF = 'lernstoff.simulation.verlauf';
const EINSTELLUNGEN = 'lernstoff.simulation.einstellungen';

export interface Lauf {
  id: string;
  titel: string;
  auswahl: Auswahl;
  fragen: SimFrage[];
  antworten: Record<string, Antwort>;
  markiert: string[];
  start: number;
  deadline: number;
  i: number;
  abgegeben?: number;                    // Zeitpunkt der Abgabe
  automatisch?: boolean;                 // Zeit abgelaufen
  wertungen?: Record<string, Wertung>;
  uebergeben?: boolean;                  // an den Lernplan übergeben
}

export interface VerlaufEintrag {
  id: string; titel: string; at: string; minuten: number; gebraucht: number;
  fragen: number; punkte: number; max: number; prozent: number; schwach: string[];
}

function lies<T>(key: string, fallback: T): T {
  try { const s = localStorage.getItem(key); return s ? (JSON.parse(s) as T) : fallback; } catch { return fallback; }
}
function schreib(key: string, wert: unknown) {
  try { if (wert === null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(wert)); } catch { /* privates Fenster oder voll */ }
}

export const ladeLauf = () => lies<Lauf | null>(LAUFEND, null);
export const speichereLauf = (l: Lauf | null) => schreib(LAUFEND, l);

export const ladeVerlauf = () => lies<VerlaufEintrag[]>(VERLAUF, []);
export function ergaenzeVerlauf(e: VerlaufEintrag): VerlaufEintrag[] {
  const neu = [e, ...ladeVerlauf().filter((x) => x.id !== e.id)].slice(0, 30);
  schreib(VERLAUF, neu);
  return neu;
}

export type Einstellungen = Omit<Auswahl, 'seed' | 'topicIds' | 'satzIds'> & { minuten: number | null; pruefungId: string };
export const ladeEinstellungen = (standard: Einstellungen) => ({ ...standard, ...lies<Partial<Einstellungen>>(EINSTELLUNGEN, {}) });
export const speichereEinstellungen = (e: Einstellungen) => schreib(EINSTELLUNGEN, e);
