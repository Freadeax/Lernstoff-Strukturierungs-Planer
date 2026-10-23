// Einstieg: importFile(Datei, Kontext) -> Document + SourceChunks + Fingerabdruck + Bericht.
// Ablauf: Format erkennen -> extrahieren -> Scan-Seiten per OCR -> in Chunks schneiden -> Dubletten/Versionen prüfen.
import type { Document } from '../../../core/types';
import type { Extracted, FileKind, Fingerprint, ImportResult, InputFile, RawPage } from './types';
import type { OcrEngine } from './ocr/engine';
import { PAGE_CONFIDENCE_MIN } from './ocr/engine';
import { extractDocx } from './extract/docx';
import { extractPptx } from './extract/pptx';
import { extractPdf } from './extract/pdf';
import { chunkPages } from './chunk';
import { findMatches, fingerprint } from './dedupe';
import JSZip from 'jszip';

export interface ImportContext {
  /** Fingerabdrücke bereits importierter Dokumente (mit kind), für Dubletten-/Versionsprüfung. */
  existing?: Array<Fingerprint & { kind?: string }>;
  /** Liefert den Text eines Absatzes eines bestehenden Dokuments zu seinem Hash (für "entfallen"-Anzeige). */
  existingParagraphText?: (hash: string) => string | undefined;
  /** Offline-OCR für Druckschrift (Tesseract). */
  ocr?: OcrEngine;
  /** Cloud-OCR für Handschrift/schwache Scans. Nur setzen, wenn der Nutzer dem Hochladen zugestimmt hat. */
  handwritingOcr?: OcrEngine;
  /** Erhält die Absatz-Hashes des neuen Dokuments mit Text, z. B. zum Speichern. */
  onParagraphs?: (texts: Map<string, string>) => void;
  subjectIds?: string[];
  topicIds?: string[];
  newId?: () => string;
}

export async function detectKind(bytes: Uint8Array, name: string): Promise<{ kind: FileKind; mediaType?: string } | { error: string }> {
  const sig = (s: number[]) => s.every((b, i) => bytes[i] === b);
  if (sig([0x25, 0x50, 0x44, 0x46])) return { kind: 'pdf' };
  if (sig([0x89, 0x50, 0x4e, 0x47])) return { kind: 'image', mediaType: 'image/png' };
  if (sig([0xff, 0xd8, 0xff])) return { kind: 'image', mediaType: 'image/jpeg' };
  if (sig([0x52, 0x49, 0x46, 0x46]) && String.fromCharCode(...bytes.subarray(8, 12)) === 'WEBP') return { kind: 'image', mediaType: 'image/webp' };
  if (sig([0x49, 0x49, 0x2a, 0x00]) || sig([0x4d, 0x4d, 0x00, 0x2a])) return { error: 'TIFF wird im Prototyp nicht unterstützt; bitte als PDF oder PNG scannen.' };
  if (String.fromCharCode(...bytes.subarray(4, 12)).includes('ftyphei')) return { error: 'HEIC-Fotos (iPhone) bitte als JPEG exportieren oder in den Kamera-Einstellungen "Maximale Kompatibilität" wählen.' };
  if (sig([0xd0, 0xcf, 0x11, 0xe0])) return { error: 'Altes Office-Format (.doc/.ppt). Bitte in Word/PowerPoint als .docx/.pptx oder PDF speichern.' };
  if (sig([0x50, 0x4b, 0x03, 0x04])) {
    const zip = await JSZip.loadAsync(bytes);
    if (zip.file('word/document.xml')) return { kind: 'docx' };
    if (zip.file('ppt/presentation.xml')) return { kind: 'pptx' };
    if (zip.file('content.xml')) return { error: 'OpenDocument (.odt/.odp) bitte als .docx/.pptx oder PDF exportieren.' };
    return { error: 'ZIP-Datei ohne erkennbares Office-Dokument.' };
  }
  if (/\.(txt|md)$/i.test(name)) return { kind: 'text' };
  return { error: `Dateiformat von "${name}" nicht erkannt.` };
}

export async function importFile(file: InputFile, ctx: ImportContext = {}): Promise<ImportResult> {
  const newId = ctx.newId ?? (() => crypto.randomUUID());
  const detected = await detectKind(file.bytes, file.name);
  if ('error' in detected) throw new Error(detected.error);

  let ex: Extracted;
  let images = new Map<number, Uint8Array>();
  switch (detected.kind) {
    case 'pdf': {
      const r = await extractPdf(file.bytes, { render: !!(ctx.ocr || ctx.handwritingOcr) });
      ex = r;
      images = r.pageImages;
      break;
    }
    case 'docx': ex = await extractDocx(file.bytes); break;
    case 'pptx': ex = await extractPptx(file.bytes); break;
    case 'image':
      ex = { kind: 'image', pages: [{ page: 1, blocks: [], needsOcr: true }], meta: {}, warnings: [] };
      images.set(1, file.bytes);
      break;
    default: {
      const text = new TextDecoder().decode(file.bytes);
      ex = { kind: 'text', pages: [{ page: 1, blocks: text.split(/\n\s*\n/).map((t) => ({ text: t.trim() })).filter((b) => b.text) }], meta: {}, warnings: [] };
    }
  }

  const ocrPages = await runOcr(ex.pages, images, detected.mediaType ?? 'image/png', file.handwritten ?? false, ctx, ex.warnings);

  const documentId = newId();
  const title = ex.meta.title || file.name.replace(/\.[^.]+$/, '');
  if (!ex.meta.modified && file.lastModified) ex.meta.modified = new Date(file.lastModified).toISOString();
  const { chunks, chapters } = chunkPages(documentId, ex.pages, newId);
  const { fingerprint: fp, paragraphTexts } = await fingerprint(documentId, title, file.bytes, chunks, ex.meta);
  ctx.onParagraphs?.(paragraphTexts);
  const matches = findMatches(fp, ex.kind, ctx.existing ?? [], paragraphTexts, ctx.existingParagraphText);

  const version = matches.find((m) => m.kind === 'neue-version' && m.newerIs !== 'bestehend');
  const document: Document = {
    id: documentId,
    title,
    kind: ex.kind,
    subjectIds: ctx.subjectIds ?? [],
    topicIds: ctx.topicIds ?? [],
    version: 1,
    previousVersionId: version?.otherDocumentId, // Vorschlag; erst nach Bestätigung durch den Nutzer speichern
    contentHash: fp.contentHash,
    importedAt: fp.importedAt,
  };
  if (!chunks.length) ex.warnings.push('Kein Text gefunden.');

  return {
    document,
    chunks,
    fingerprint: fp,
    report: {
      pages: ex.pages.length,
      ocrPages,
      printedPagesFound: ex.pages.filter((p) => p.printedPage && !p.pageEstimated).length,
      chapters,
      lowConfidencePages: ex.pages.filter((p) => p.ocrConfidence !== undefined && p.ocrConfidence < PAGE_CONFIDENCE_MIN).map((p) => p.page),
      warnings: ex.warnings,
      matches,
    },
  };
}

/**
 * OCR-Routing pro Seite:
 * - handschriftlich markiert -> direkt Handschrift-Engine (falls erlaubt), sonst Tesseract mit Warnung
 * - sonst Tesseract; liegt die Sicherheit unter PAGE_CONFIDENCE_MIN und ist die Handschrift-Engine erlaubt, zweiter Versuch dort
 */
async function runOcr(pages: RawPage[], images: Map<number, Uint8Array>, mediaType: string, handwritten: boolean, ctx: ImportContext, warnings: string[]): Promise<number> {
  let count = 0;
  for (const p of pages) {
    if (!p.needsOcr) continue;
    const img = images.get(p.page);
    if (!img) { warnings.push(`Seite ${p.page}: Scan ohne OCR-Engine, Text fehlt.`); continue; }
    let result = undefined as Awaited<ReturnType<OcrEngine['recognize']>> | undefined;
    if (handwritten && ctx.handwritingOcr) result = await ctx.handwritingOcr.recognize(img, mediaType);
    else if (ctx.ocr) {
      result = await ctx.ocr.recognize(img, mediaType);
      if (result.confidence < PAGE_CONFIDENCE_MIN && ctx.handwritingOcr) {
        const second = await ctx.handwritingOcr.recognize(img, mediaType);
        if (second.confidence >= result.confidence) result = second;
      }
    } else if (ctx.handwritingOcr) result = await ctx.handwritingOcr.recognize(img, mediaType);
    if (!result) { warnings.push(`Seite ${p.page}: keine OCR-Engine verfügbar.`); continue; }
    if (handwritten && result.engine !== 'claude') warnings.push(`Seite ${p.page}: Handschrift nur mit Offline-OCR gelesen – Ergebnis unzuverlässig, bitte prüfen.`);
    p.blocks = result.blocks;
    p.ocrConfidence = Math.round(result.confidence * 100) / 100;
    if (result.confidence < PAGE_CONFIDENCE_MIN) warnings.push(`Seite ${p.page}: OCR-Sicherheit ${Math.round(result.confidence * 100)} % – bitte gegenlesen.`);
    count++;
  }
  return count;
}
