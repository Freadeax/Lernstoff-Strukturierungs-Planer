// Belege aus JSON-Antworten (chunkId + wörtliches Zitat) per Code nachprüfen.
// Gleiche Zitat-Suche wie Q1a, damit die Regeln in allen Modi gleich sind.
import type { SourceChunk } from '../../core/types';
import { findeZitat } from '../qualitaet/deterministisch';
import type { BelegJson } from './typen';

/** Gültig, wenn der Abschnitt zu den gewählten gehört (und ggf. zum richtigen Dokument) und das Zitat darin steht. */
export function belegGueltig(b: BelegJson | null | undefined, chunks: Map<string, SourceChunk>, documentId?: string): boolean {
  if (!b?.chunkId || !b.zitat?.trim()) return false;
  const ch = chunks.get(b.chunkId);
  if (!ch || (documentId && ch.documentId !== documentId)) return false;
  return findeZitat(ch.text, b.zitat).art !== 'nein';
}

/** Stelle eines Belegs zur Anzeige: Seite und Hervorhebung im Abschnitt. */
export function belegStelle(b: BelegJson, chunks: Map<string, SourceChunk>) {
  const ch = chunks.get(b.chunkId);
  if (!ch) return undefined;
  const t = findeZitat(ch.text, b.zitat);
  return { chunk: ch, seite: ch.printedPage ?? String(ch.page), start: t.start, end: t.end };
}
