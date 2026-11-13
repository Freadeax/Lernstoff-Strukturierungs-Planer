// KI-Fragen und Aktualität: Prüfungsfragen des Zusammenfassers sind schon beim Erzeugen doppelt geprüft
// (wörtliche Belege per Code, Musterlösung und Eindeutigkeit durch einen zweiten KI-Aufruf, siehe
// zusammenfasser/pruefung.ts). Hier kommt die Zeitachse dazu: Wurde ein Quelldokument seither durch eine
// neue Fassung ersetzt, beruhen die Fragen auf altem Stand und gehören in die Überarbeitungsliste.

import type { Document } from '../../core/types';

export interface Fragensatz { id: string; pruefungName?: string; sourceDocumentIds: string[]; createdAt: string; fragen?: unknown[]; verworfen?: number }

export interface VeralteterSatz { satzId: string; name: string; erstellt: string; ersetzt: Array<{ alt: string; neu: string; titel: string }> }

/** Fragensätze, deren Quelldokument eine neuere Fassung hat (neues Dokument mit previousVersionId). */
export function veralteteSaetze(saetze: readonly Fragensatz[], docs: readonly Pick<Document, 'id' | 'title' | 'previousVersionId'>[]): VeralteterSatz[] {
  const nachfolger = new Map<string, Pick<Document, 'id' | 'title'>>();
  for (const d of docs) if (d.previousVersionId) nachfolger.set(d.previousVersionId, d);
  // Kette bis zur neuesten Fassung verfolgen
  const neueste = (id: string) => { let n = nachfolger.get(id); let guard = 0; while (n && nachfolger.get(n.id) && guard++ < 20) n = nachfolger.get(n.id)!; return n; };
  const out: VeralteterSatz[] = [];
  for (const s of saetze) {
    if (!s.fragen?.length) continue;
    const ersetzt = s.sourceDocumentIds.flatMap((alt) => { const n = neueste(alt); return n ? [{ alt, neu: n.id, titel: n.title }] : []; });
    if (ersetzt.length) out.push({ satzId: s.id, name: s.pruefungName ?? 'Fragensatz', erstellt: s.createdAt, ersetzt });
  }
  return out;
}

/** Anteil verworfener KI-Fragen: hoch heißt, das Material trägt die gewünschten Fragen kaum. */
export function verwurfQuote(saetze: readonly Fragensatz[]): { erzeugt: number; verworfen: number } {
  return saetze.reduce((s, x) => ({ erzeugt: s.erzeugt + (x.fragen?.length ?? 0), verworfen: s.verworfen + (x.verworfen ?? 0) }), { erzeugt: 0, verworfen: 0 });
}
