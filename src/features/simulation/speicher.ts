// Laufende Simulation und Verlauf liegen in localStorage: klein, nur auf diesem Gerät, und eine laufende
// Prüfung übersteht so ein Neuladen oder das Wegwischen der App auf dem iPhone. Keine neue DB-Tabelle nötig.
import type { Antwort, Auswahl, SimFrage, Wertung } from './simulation';
import { istObjekt, storage } from '../../ui/lib/store';

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

const lies = <T,>(key: string, fallback: T, gueltig?: (v: unknown) => boolean) => storage.read<T>(key, fallback, 'local', gueltig);
// Privates Fenster oder voller Speicher: die Simulation läuft ohne Speichern weiter.
const schreib = (key: string, wert: unknown) => { storage.write(key, wert); };

/** Laufende Simulation mit der Form, die die Oberfläche braucht. Kaputte Stände gelten als „kein Lauf“. */
export const istLauf = (v: unknown): boolean =>
  istObjekt(v) && typeof v.id === 'string' && Array.isArray(v.fragen) && v.fragen.every(istObjekt) && istObjekt(v.antworten)
  && Array.isArray(v.markiert) && typeof v.i === 'number' && typeof v.deadline === 'number' && istObjekt(v.auswahl);
const istVerlauf = (v: unknown) => istObjekt(v) && typeof v.id === 'string' && typeof v.prozent === 'number' && Array.isArray(v.schwach);

export const ladeLauf = () => lies<Lauf | null>(LAUFEND, null, istLauf);
export const speichereLauf = (l: Lauf | null) => schreib(LAUFEND, l);

export const ladeVerlauf = () => storage.list<VerlaufEintrag>(VERLAUF, istVerlauf);
export function ergaenzeVerlauf(e: VerlaufEintrag): VerlaufEintrag[] {
  const neu = [e, ...ladeVerlauf().filter((x) => x.id !== e.id)].slice(0, 30);
  schreib(VERLAUF, neu);
  return neu;
}

export type Einstellungen = Omit<Auswahl, 'seed' | 'topicIds' | 'satzIds'> & { minuten: number | null; pruefungId: string };
export const ladeEinstellungen = (standard: Einstellungen) => ({ ...standard, ...lies<Partial<Einstellungen>>(EINSTELLUNGEN, {}) });
export const speichereEinstellungen = (e: Einstellungen) => schreib(EINSTELLUNGEN, e);
