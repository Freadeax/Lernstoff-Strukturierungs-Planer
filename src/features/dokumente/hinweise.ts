// Hinweise zu importierten Dokumenten, die beim Lernen wichtig sind: schwer lesbare Seiten aus der
// Texterkennung, unleserliche Stellen, geschätzte Seitenzahlen und Dubletten zwischen Dokumenten.
// Reine Funktionen; die Seite Dokumente zeigt sie dauerhaft an, nicht nur direkt nach dem Import.

import type { SourceChunk } from '../../core/types';
import { findMatches } from './import/dedupe';
import type { DuplicateMatch, Fingerprint, MatchKind } from './import/types';

/** Unter dieser OCR-Sicherheit lohnt der Blick ins Original. */
export const LESBAR_MIN = 0.7;

export interface LeseHinweise {
  /** Seiten mit niedriger OCR-Sicherheit, je Seite der erste betroffene Abschnitt (zum Hinspringen). */
  schwerLesbar: Array<{ chunkId: string; seite: string; sicherheit: number }>;
  /** Anzahl unleserlicher Stellen (⟦?⟧ bzw. illegibleSpans). */
  unleserlich: number;
  /** Erster Abschnitt mit unleserlicher Stelle. */
  ersteUnleserlich?: string;
  /** Seitenzahlen nur geschätzt (Word ohne gespeicherte Seitenumbrüche). */
  geschaetzt: boolean;
  /** Anteil per Texterkennung gelesener Abschnitte. */
  ocrAnteil: number;
}

export function leseHinweise(chunks: SourceChunk[]): LeseHinweise {
  const seiten = new Map<string, { chunkId: string; seite: string; sicherheit: number }>();
  let unleserlich = 0;
  let ersteUnleserlich: string | undefined;
  for (const c of chunks) {
    const seite = c.printedPage ?? String(c.page);
    if (c.ocrConfidence !== undefined && c.ocrConfidence < LESBAR_MIN) {
      const alt = seiten.get(seite);
      if (!alt || c.ocrConfidence < alt.sicherheit) seiten.set(seite, { chunkId: alt?.chunkId ?? c.id, seite, sicherheit: c.ocrConfidence });
    }
    const n = c.illegibleSpans?.length || (c.text.match(/⟦\?⟧/g) ?? []).length;
    if (n && !ersteUnleserlich) ersteUnleserlich = c.id;
    unleserlich += n;
  }
  const ocr = chunks.filter((c) => c.ocrConfidence !== undefined || c.origin === 'ocr').length;
  return {
    schwerLesbar: [...seiten.values()],
    unleserlich,
    ...(ersteUnleserlich ? { ersteUnleserlich } : {}),
    geschaetzt: chunks.some((c) => c.pageEstimated),
    ocrAnteil: chunks.length ? ocr / chunks.length : 0,
  };
}

const WICHTIG: MatchKind[] = ['gleiche-datei', 'gleicher-inhalt', 'anderes-format', 'teil-von', 'enthaelt', 'neue-version'];

export const DUBLETTE_TEXT: Record<MatchKind, string> = {
  'gleiche-datei': 'gleiche Datei wie',
  'gleicher-inhalt': 'gleicher Inhalt wie',
  'anderes-format': 'gleicher Inhalt in anderem Format wie',
  'neue-version': 'andere Fassung von',
  'teilweise-ueberlappend': 'überschneidet sich mit',
  'teil-von': 'steckt fast vollständig in',
  'enthaelt': 'enthält fast vollständig',
};

/**
 * Dubletten je Dokument aus den gespeicherten Fingerabdrücken. Jedes Paar wird einmal verglichen und bei beiden
 * Dokumenten eingetragen (mit umgedrehter Richtung bei teil-von/enthaelt). Nur Treffer, die beim Lernen zählen.
 */
export function dubletten(fps: Array<Fingerprint & { kind?: string }>): Map<string, DuplicateMatch[]> {
  const out = new Map<string, DuplicateMatch[]>();
  const add = (id: string, m: DuplicateMatch) => out.set(id, [...(out.get(id) ?? []), m]);
  const umgedreht: Partial<Record<MatchKind, MatchKind>> = { 'teil-von': 'enthaelt', 'enthaelt': 'teil-von' };
  for (let i = 0; i < fps.length; i++) {
    const a = fps[i]!;
    const spaetere = fps.slice(i + 1);
    for (const m of findMatches(a, a.kind ?? '', spaetere, new Map())) {
      if (!WICHTIG.includes(m.kind)) continue;
      add(a.documentId, m);
      add(m.otherDocumentId, { ...m, kind: umgedreht[m.kind] ?? m.kind, otherDocumentId: a.documentId, otherTitle: a.title, added: [], removed: [] });
    }
  }
  return out;
}
