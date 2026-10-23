// Seiten -> SourceChunks. Ein Chunk überschreitet nie eine Seitengrenze und nie einen Kapitelwechsel,
// damit jede Quellenangabe genau eine Seite und ein Kapitel hat. Tabellen und Sprechernotizen bilden eigene Chunks.
// Unter 80 Wörter wird es nur, wenn Seite oder Kapitel enden. chapter = Pfad 'Kapitel > Unterkapitel'.
import type { ImportChunk, RawPage } from './types';

// Vorgabe des Zusammenfassers: 80–350 Wörter je Chunk, Schnitt nur an Absatz-, Listen- oder Tabellenende.
const MAX_WORDS = 350;
const words = (t: string) => t.split(/\s+/).filter(Boolean).length;

export function chunkPages(documentId: string, pages: RawPage[], newId: () => string = () => crypto.randomUUID()): { chunks: ImportChunk[]; chapters: string[] } {
  const chunks: ImportChunk[] = [];
  const chapters: string[] = [];
  const path: string[] = [];   // path[level-1] = aktuelle Überschrift dieser Ebene

  for (const p of pages) {
    let text = '';
    let spans: Array<{ start: number; end: number }> = [];
    let origin: ImportChunk['origin'];
    const flush = () => {
      if (!text.trim()) return;
      chunks.push({
        id: newId(),
        documentId,
        page: p.page,
        printedPage: p.printedPage,
        chapter: path.filter(Boolean).join(' > ') || undefined,
        text,
        ocrConfidence: p.ocrConfidence,
        illegibleSpans: spans.length ? spans : undefined,
        pageEstimated: p.pageEstimated,
        origin,
      });
      text = '';
      spans = [];
      origin = undefined;
    };
    for (const b of p.blocks) {
      if (b.headingLevel) {
        flush();
        path.length = b.headingLevel - 1;
        path[b.headingLevel - 1] = b.text.replace(/\s+/g, ' ').trim();
        const c = path.filter(Boolean).join(' > ');
        if (chapters[chapters.length - 1] !== c) chapters.push(c);
        continue;
      }
      // Sprechernotizen und Tabellen als eigene Chunks, damit Zitate ihre Herkunft behalten.
      const blockOrigin = b.origin === 'text' ? undefined : b.origin;
      if (blockOrigin !== origin || (text && words(text) + words(b.text) > MAX_WORDS)) flush();
      origin = blockOrigin;
      const offset = text ? text.length + 2 : 0;
      text = text ? `${text}\n\n${b.text}` : b.text;
      for (const s of b.illegibleSpans ?? []) spans.push({ start: s.start + offset, end: s.end + offset });
    }
    flush();
  }
  return { chunks, chapters };
}
