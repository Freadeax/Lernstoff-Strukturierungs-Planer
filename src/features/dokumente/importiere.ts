// Importablauf der Oberfläche: Datei → importFile → lokale Datenbank (documents, chunks,
// fingerprints, paragraphs) → Aktivitätsprotokoll. Genutzt von der Dokumente-Seite und vom Import-Assistenten.

import { db } from '../../core/db';
import { logActivity } from '../../core/activity';
import { getApiKey } from '../../core/settings';
import { importFile } from './import/pipeline';
import type { ImportReport } from './import/types';
import type { OcrEngine } from './import/ocr/engine';

export interface ImportErgebnis { name: string; report?: ImportReport; error?: string; documentId?: string }

export const ACCEPT = '.pdf,.docx,.pptx,.txt,.md,image/png,image/jpeg,image/webp';
export const SUPPORTED = /\.(pdf|docx|pptx|txt|md|png|jpe?g|webp)$/i;

/** Tesseract erst laden, wenn wirklich eine Seite ohne Textebene erkannt werden muss. */
function lazyTesseract(): OcrEngine & { terminate(): Promise<void> } {
  let engine: Promise<OcrEngine & { terminate(): Promise<void> }> | undefined;
  const base = new URL('tesseract/', document.baseURI).href;
  const get = () => (engine ??= import('./import/ocr/tesseract').then((m) =>
    m.createTesseractEngine({ workerPath: `${base}worker.min.js`, corePath: `${base}core`, langPath: `${base}lang` })));
  return {
    name: 'tesseract',
    recognize: async (image, mediaType) => (await get()).recognize(image, mediaType),
    terminate: async () => { if (engine) await (await engine).terminate(); },
  };
}

export async function importiereDateien(
  files: File[],
  opts: { subjectId: string; handwritten: boolean; onProgress?: (name: string, index: number) => void },
): Promise<ImportErgebnis[]> {
  const ergebnisse: ImportErgebnis[] = [];
  let ocr: (OcrEngine & { terminate(): Promise<void> }) | undefined;
  let handwritingOcr: OcrEngine | undefined;
  const { subjectId, handwritten } = opts;
  try {
    for (const [i, file] of files.entries()) {
      opts.onProgress?.(file.name, i);
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const isImage = /^image\//.test(file.type) || /\.(png|jpe?g|webp)$/i.test(file.name);
        if ((isImage || file.type === 'application/pdf') && !ocr) ocr = lazyTesseract();
        if (handwritten && !handwritingOcr) {
          const key = getApiKey();
          if (!key) throw new Error('Für Handschrift bitte zuerst in den Einstellungen den API-Schlüssel eintragen.');
          const { createClaudeVisionEngine } = await import('./import/ocr/claude');
          handwritingOcr = createClaudeVisionEngine({ apiKey: key });
        }
        const existing = await db.fingerprints.toArray();
        const kinds = new Map((await db.documents.toArray()).map((d) => [d.id, d.kind]));
        const paragraphTexts = new Map((await db.paragraphs.toArray()).map((p) => [p.hash, p.text]));
        let neueAbsaetze = new Map<string, string>();
        const result = await importFile(
          { name: file.name, bytes, lastModified: file.lastModified, handwritten },
          {
            existing: existing.map((f) => ({ ...f, kind: kinds.get(f.documentId) })),
            existingParagraphText: (h) => paragraphTexts.get(h),
            ocr, handwritingOcr, subjectIds: subjectId ? [subjectId] : [],
            onParagraphs: (m) => { neueAbsaetze = m; },
          },
        );
        if (result.report.matches.some((m) => m.kind === 'gleiche-datei')) {
          ergebnisse.push({ name: file.name, report: result.report, error: 'Diese Datei ist schon vorhanden und wurde nicht erneut gespeichert.' });
          continue;
        }
        await db.transaction('rw', [db.documents, db.chunks, db.fingerprints, db.paragraphs], async () => {
          await db.documents.add(result.document);
          await db.chunks.bulkAdd(result.chunks);
          await db.fingerprints.add(result.fingerprint);
          await db.paragraphs.bulkPut([...neueAbsaetze].map(([hash, text]) => ({ hash, text })));
        });
        const r = result.report;
        await logActivity({
          kind: 'import', severity: r.warnings.length ? 'warning' : 'info', ref: result.document.id, subjectIds: result.document.subjectIds,
          title: `${result.document.title} importiert`,
          detail: [`${r.pages} Seiten`, r.ocrPages ? `${r.ocrPages} per Texterkennung` : '', ...r.warnings].filter(Boolean).join(' · '),
        });
        ergebnisse.push({ name: file.name, report: r, documentId: result.document.id });
      } catch (e) {
        const error = e instanceof Error ? e.message : String(e);
        await logActivity({ kind: 'import', severity: 'critical', title: `${file.name} nicht importiert`, detail: error, subjectIds: subjectId ? [subjectId] : undefined });
        ergebnisse.push({ name: file.name, error });
      }
    }
  } finally {
    await ocr?.terminate();
  }
  return ergebnisse;
}
