import { findeMuster, suchtext, vereinfache } from '../uebergabe/pruefung';
import type { Aufgabe, Kernpunkt } from './typen';

// Rückmeldung per Code: Welche Kernpunkte kommen in der Antwort vor? Gleiche Regeln wie in den
// Trainern (Alternativen, „ + “ = alle Teile, Wortteile genügen). Ersetzt keine Bewertung durch die Lehrkraft.

export interface Treffer { punkt: Kernpunkt; ok: boolean }

export function pruefeAntwort(aufgabe: Aufgabe, antwort: string): Treffer[] {
  const t = suchtext(vereinfache(antwort));
  return (aufgabe.kernpunkte ?? []).map((punkt) => ({ punkt, ok: findeMuster(t, punkt.muster) >= 0 }));
}

export function quote(treffer: Treffer[]): number | null {
  return treffer.length ? Math.round((treffer.filter((x) => x.ok).length / treffer.length) * 100) : null;
}

/** Gesamtquote über alle Aufgaben mit Kernpunkten. */
export function gesamtQuote(aufgaben: Aufgabe[], antworten: Record<string, string>): number | null {
  const alle = aufgaben.flatMap((a) => pruefeAntwort(a, antworten[a.id] ?? ''));
  return quote(alle);
}

/**
 * Kernpunkte aus der Eingabe der Lehrkraft: eine Zeile je Punkt. Vor einem „:“ steht der angezeigte
 * Text, danach die Suchbegriffe (durch Komma getrennt). Ohne „:“ gelten die Begriffe der Zeile.
 * Beispiel: „Sturzgefahr: sturz, gestuerzt“ oder „Dekubitus, Druckgeschwür“.
 */
export function leseKernpunkte(eingabe: string): Kernpunkt[] {
  return eingabe.split('\n').map((z) => z.trim()).filter(Boolean).map((zeile) => {
    const i = zeile.indexOf(':');
    const text = (i > 0 ? zeile.slice(0, i) : zeile).trim();
    const begriffe = (i > 0 ? zeile.slice(i + 1) : zeile).split(/[,;]/).map((b) => vereinfache(b).replace(/[^a-z0-9%,/+ ]/g, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean);
    return { text, muster: begriffe.length ? begriffe : [vereinfache(text)] };
  });
}

export function kernpunkteAlsText(punkte: Kernpunkt[] = []): string {
  return punkte.map((p) => `${p.text}: ${p.muster.join(', ')}`).join('\n');
}
