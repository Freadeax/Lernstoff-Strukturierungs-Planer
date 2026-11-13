import type { Kriterium, Quelle, Teil } from '../typen';

type Paar = [id: string, text: string];

const teile = (p: Paar[]): Teil[] => p.map(([id, text]) => ({ id, text }));

/** Kriterium einer Ebene: S-, P- und E-Teile als [Kennung, Text]. */
export function ebene(nr: number, thema: string, s: Paar[], p: Paar[], e: Paar[], stichworte: string[] = []): Kriterium {
  return { id: `k${nr}`, ebene: nr, thema, struktur: teile(s), prozess: teile(p), ergebnis: teile(e), stichworte };
}

const DNQP = 'https://www.dnqp.de/fileadmin/HSOS/Homepages/DNQP/Dateien/Expertenstandards/';

/** Frei zugänglicher DNQP-Auszug (Präambel, Standardaussage, Begründung, Kriterientabelle). */
export function auszug(pfad: string, titel: string, geprueftAm = '2026-11-12'): Quelle {
  return { titel, url: DNQP + pfad, geprueftAm, art: 'auszug' };
}

export const UEBERSICHT_URL = 'https://www.dnqp.de/fileadmin/HSOS/Homepages/DNQP/Dateien/Weitere/Uebersicht_Expertenstandards.pdf';
