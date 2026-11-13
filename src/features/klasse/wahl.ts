import type { Aufgabe } from './typen';

// Auswahlaufgaben: Die Antwort steht als Buchstaben im Abgabe-Code („A, C“), damit das Abgabeformat
// (Text je Aufgabe) gleich bleibt und auch ältere Lehrkraft-Geräte die Abgabe lesen können.

export const buchstabe = (i: number) => String.fromCharCode(65 + i);

/** „A, C“ → [0, 2]. Unbekannte Zeichen fallen weg, Reihenfolge sortiert, ohne Doppelte. */
export function leseWahl(antwort: string | undefined, anzahl: number): number[] {
  const out = new Set<number>();
  for (const m of (antwort ?? '').toUpperCase().matchAll(/\b([A-Z])\b/g)) {
    const i = m[1]!.charCodeAt(0) - 65;
    if (i >= 0 && i < anzahl) out.add(i);
  }
  return [...out].sort((a, b) => a - b);
}

export const wahlAntwort = (indizes: number[]) => [...new Set(indizes)].sort((a, b) => a - b).map(buchstabe).join(', ');

/** Lesbarer Text für Abgabe und Vergleich: „A) Text“ je gewählter Option. */
export function wahlText(aufgabe: Aufgabe, antwort: string | undefined): string {
  const opt = aufgabe.optionen ?? [];
  const gewaehlt = leseWahl(antwort, opt.length);
  return gewaehlt.map((i) => `${buchstabe(i)}) ${opt[i]}`).join('\n');
}

export interface WahlErgebnis { richtig: boolean; teil: number }

/**
 * Auswertung einer Auswahlaufgabe. `teil` = Anteil 0…1: bei einer richtigen Antwort ganz oder gar nicht,
 * bei mehreren richtigen je Option (richtig gewählt oder richtig weggelassen), wie bei Kprim-Aufgaben üblich.
 * null, wenn die Aufgabe keine Lösung hat (z. B. im Klassenlink).
 */
export function pruefeWahl(aufgabe: Aufgabe, antwort: string | undefined): WahlErgebnis | null {
  const opt = aufgabe.optionen ?? [];
  const soll = new Set(aufgabe.richtig ?? []);
  if (!opt.length || !soll.size) return null;
  const ist = new Set(leseWahl(antwort, opt.length));
  const richtig = soll.size === ist.size && [...soll].every((i) => ist.has(i));
  if (!aufgabe.mehrfach) return { richtig, teil: richtig ? 1 : 0 };
  if (!ist.size) return { richtig: false, teil: 0 };
  const stimmt = opt.filter((_, i) => soll.has(i) === ist.has(i)).length;
  return { richtig, teil: stimmt / opt.length };
}
