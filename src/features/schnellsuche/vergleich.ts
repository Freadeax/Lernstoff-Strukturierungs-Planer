// Kriterien-Vergleich: gleiche Phase des Pflegeprozesses (oder gleiche Ebene) über alle Expertenstandards.
// Die Standards sind ähnlich gebaut (Einschätzung, Planung, Beratung, Durchführung, Evaluation);
// nebeneinander gelesen wird das Muster sichtbar und Unterschiede fallen auf.

import { falte, type Ebene } from './suchkern';
import type { DnqpKriterium, DnqpStandard } from './quellen';

export type Phase = 'einschaetzung' | 'planung' | 'beratung' | 'durchfuehrung' | 'evaluation';

export const PHASEN: Array<{ id: Phase; label: string; muster: RegExp }> = [
  { id: 'einschaetzung', label: 'Einschätzung', muster: /einschatz|screening|assessment/ },
  { id: 'planung', label: 'Planung', muster: /plan/ },
  { id: 'beratung', label: 'Information und Beratung', muster: /information|beratung|schulung|anleitung/ },
  { id: 'durchfuehrung', label: 'Durchführung', muster: /durchfuhr|umsetz|steuerung|koordination|unterstutz|bewegung|hilfsmittel|mahlzeit/ },
  { id: 'evaluation', label: 'Evaluation', muster: /evaluation|uberprufung|verlauf|wirksam/ },
];

/** Phase eines Kriteriums nach seiner Überschrift; erste passende Phase gewinnt (Reihenfolge des Pflegeprozesses). */
export function phaseVon(k: Pick<DnqpKriterium, 'thema'>): Phase | undefined {
  const t = falte(k.thema);
  return PHASEN.find((p) => p.muster.test(t))?.id;
}

export interface VergleichsZeile { standard: DnqpStandard; kriterien: DnqpKriterium[] }

/** Je Standard die Kriterien zur Wahl: Phase oder Ebenen-Nummer. Standards ohne Treffer fallen weg. */
export function vergleiche(standards: DnqpStandard[], wahl: { phase?: Phase; ebene?: number }): VergleichsZeile[] {
  return standards
    .map((s) => ({
      standard: s,
      kriterien: s.kriterien.filter((k) => (wahl.phase ? phaseVon(k) === wahl.phase : k.nr === wahl.ebene)),
    }))
    .filter((z) => z.kriterien.length);
}

export const SPALTEN: Array<{ ebene: Ebene; feld: 'struktur' | 'prozess' | 'ergebnis'; label: string }> = [
  { ebene: 'S', feld: 'struktur', label: 'Struktur' },
  { ebene: 'P', feld: 'prozess', label: 'Prozess' },
  { ebene: 'E', feld: 'ergebnis', label: 'Ergebnis' },
];
