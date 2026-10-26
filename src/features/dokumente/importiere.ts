// Importablauf der Oberfläche: Datei → importFile → lokale Datenbank (documents, chunks,
// fingerprints, paragraphs) → Aktivitätsprotokoll. Genutzt von der Dokumente-Seite und vom Import-Assistenten.

import JSZip from 'jszip';
import { db } from '../../core/db';
import { logActivity } from '../../core/activity';
import { getApiKey } from '../../core/settings';
import { importFile } from './import/pipeline';
import type { ImportReport } from './import/types';
import type { OcrEngine } from './import/ocr/engine';
import { gleicheThemenAb, ladeThemen, ordneThemen } from '../../core/topics';
import { ladeHoch, ladeZiel, listeDateien, pruefeRepo } from '../ablage/ablage';
import type { Document } from '../../core/types';

export interface ImportErgebnis { name: string; report?: ImportReport; error?: string; documentId?: string; archive?: string; archiveError?: string }

export const ACCEPT = '.pdf,.docx,.pptx,.txt,.md,.zip,image/png,image/jpeg,image/webp';
export const SUPPORTED = /\.(pdf|docx|pptx|txt|md|zip|png|jpe?g|webp)$/i;

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
  opts: { subjectId: string; handwritten: boolean; archive?: boolean; repository?: Document['repository']; onProgress?: (name: string, index: number) => void },
): Promise<ImportErgebnis[]> {
  const ergebnisse: ImportErgebnis[] = [];
  let ocr: (OcrEngine & { terminate(): Promise<void> }) | undefined;
  let handwritingOcr: OcrEngine | undefined;
  const { subjectId, handwritten } = opts;
  try {
    for (const [i, file] of files.entries()) {
      opts.onProgress?.(file.name, i);
      let repository = opts.repository;
      let archive: string | undefined;
      let archiveError: string | undefined;
      try {
        const z = ladeZiel();
        if (repository) archive = 'Original liegt im privaten Material-Repo.';
        else if (opts.archive ?? !!(z.owner && z.repo && z.token)) {
          try {
            if (!z.owner || !z.repo || !z.token) throw new Error('Bitte unter „Große Dateien“ das private Material-Repo verbinden und die Datei danach erneut importieren.');
            opts.onProgress?.(`${file.name} – sichere Original im Material-Repo`, i);
            const info = await pruefeRepo(z);
            if (!info.privat) throw new Error('Das Material-Repository muss privat sein.');
            const upload = await ladeHoch(z, file, { branch: info.branch, vorhanden: await listeDateien(z) });
            repository = { owner: z.owner, repo: z.repo, ordner: upload.ordner };
            archive = 'Original im privaten Material-Repo gespeichert.';
          } catch (e) { archiveError = `Repo-Sicherung fehlgeschlagen: ${e instanceof Error ? e.message : String(e)}`; }
        }
        opts.onProgress?.(file.name, i);
        if (file.size > 512 * 1024 * 1024) throw new Error('Diese Datei ist für das Einlesen auf Handy/iPad zu groß (über 512 MB). Bitte benötigte Dokumente oder Kapitel einzeln bzw. als kleinere ZIP hochladen.');
        if (/\.zip$/i.test(file.name)) {
          const zip = await JSZip.loadAsync(await file.arrayBuffer());
          const entries = Object.values(zip.files).filter((e) => !e.dir && !e.name.startsWith('__MACOSX/') && SUPPORTED.test(e.name) && !/\.zip$/i.test(e.name));
          if (!entries.length) throw new Error('Das ZIP enthält keine unterstützten Dokumente. Verschachtelte ZIP bitte zuerst entpacken.');
          if (entries.length > 500) throw new Error('Das ZIP enthält mehr als 500 Dokumente. Bitte kleinere Sammlungen hochladen.');
          let total = 0;
          for (const entry of entries) {
            // ZIP-Metadaten vor dem Entpacken prüfen; schützt mobile Browser vor übergroßen Ausgaben.
            const size = (entry as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize;
            if (typeof size !== 'number' || size > 128 * 1024 * 1024 || (total += size) > 512 * 1024 * 1024) throw new Error('Die entpackten Dokumente sind zu groß. Bitte kleinere Sammlungen verwenden. Bereits eingelesene Dokumente bleiben erhalten.');
            const bytes = await entry.async('uint8array');
            const child = new File([bytes as BlobPart], entry.name, { lastModified: entry.date.getTime() });
            ergebnisse.push(...await importiereDateien([child], { ...opts, archive: false, repository, onProgress: (name) => opts.onProgress?.(name, i) }));
          }
          if (archiveError) ergebnisse.push({ name: file.name, archiveError });
          continue;
        }
        const bytes = new Uint8Array(await file.arrayBuffer());
        const isImage = /^image\//.test(file.type) || /\.(png|jpe?g|webp)$/i.test(file.name);
        if ((isImage || file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) && !ocr) ocr = lazyTesseract();
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
        const doppelt = result.report.matches.find((m) => m.kind === 'gleiche-datei');
        const documentId = doppelt?.otherDocumentId ?? result.document.id;
        Object.assign(result.document, ordneThemen(result.document, result.chunks, await ladeThemen()));
        if (repository) result.document.repository = repository;
        if (!doppelt) await db.transaction('rw', [db.documents, db.chunks, db.fingerprints, db.paragraphs], async () => {
          await db.documents.add(result.document);
          await db.chunks.bulkAdd(result.chunks);
          await db.fingerprints.add(result.fingerprint);
          await db.paragraphs.bulkPut([...neueAbsaetze].map(([hash, text]) => ({ hash, text })));
        });
        if (doppelt) {
          if (repository) await db.documents.update(documentId, { repository });
          await gleicheThemenAb(documentId);
        }
        const ergebnis: ImportErgebnis = { name: file.name, report: result.report, documentId, archive, archiveError };
        if (doppelt) result.report.warnings.push('Bereits als Dokument vorhanden. Es wurde keine zweite Kopie angelegt.');
        const r = result.report;
        await logActivity({
          kind: 'import', severity: r.warnings.length ? 'warning' : 'info', ref: documentId, subjectIds: result.document.subjectIds,
          title: `${result.document.title} importiert`,
          detail: [`${r.pages} Seiten`, r.ocrPages ? `${r.ocrPages} per Texterkennung` : '', ...r.warnings].filter(Boolean).join(' · '),
        });
        ergebnisse.push(ergebnis);
      } catch (e) {
        const error = e instanceof Error ? e.message : String(e);
        await logActivity({ kind: 'import', severity: 'critical', title: `${file.name} nicht importiert`, detail: error, subjectIds: subjectId ? [subjectId] : undefined });
        ergebnisse.push({ name: file.name, error, archive, archiveError });
      }
    }
  } finally {
    await ocr?.terminate();
  }
  return ergebnisse;
}
