import { useEffect, useState } from 'react';
import { db, deleteDocument } from '../core/db';
import type { Document, SourceChunk } from '../core/types';
import { getApiKey } from '../core/settings';
import { modules } from '../modules/registry';
import { importFile } from './dokumente/import/pipeline';
import type { ImportReport } from './dokumente/import/types';
import type { OcrEngine } from './dokumente/import/ocr/engine';

const subjects = modules.flatMap((m) => m.subjects);

/** Tesseract erst laden, wenn wirklich eine Seite ohne Textebene erkannt werden muss. */
function lazyTesseract(): OcrEngine & { terminate(): Promise<void> } {
  let engine: Promise<OcrEngine & { terminate(): Promise<void> }> | undefined;
  const base = new URL('tesseract/', document.baseURI).href;
  const get = () => (engine ??= import('./dokumente/import/ocr/tesseract').then((m) =>
    m.createTesseractEngine({ workerPath: `${base}worker.min.js`, corePath: `${base}core`, langPath: `${base}lang` })));
  return {
    name: 'tesseract',
    recognize: async (image, mediaType) => (await get()).recognize(image, mediaType),
    terminate: async () => { if (engine) await (await engine).terminate(); },
  };
}

export function Dokumente() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? '');
  const [handwritten, setHandwritten] = useState(false);
  const [busy, setBusy] = useState('');
  const [reports, setReports] = useState<Array<{ name: string; report?: ImportReport; error?: string }>>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [chunks, setChunks] = useState<SourceChunk[]>([]);

  const reload = async () => setDocs(await db.documents.orderBy('importedAt').reverse().toArray().catch(() => db.documents.toArray()));
  useEffect(() => { reload(); }, []);
  useEffect(() => {
    if (open) db.chunks.where('documentId').equals(open).sortBy('page').then(setChunks);
  }, [open]);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const ergebnisse: typeof reports = [];
    let ocr: (OcrEngine & { terminate(): Promise<void> }) | undefined;
    let handwritingOcr: OcrEngine | undefined;
    try {
      for (const file of Array.from(files)) {
        setBusy(`Lese ${file.name} …`);
        try {
          const bytes = new Uint8Array(await file.arrayBuffer());
          const isImage = /^image\//.test(file.type) || /\.(png|jpe?g|webp)$/i.test(file.name);
          if ((isImage || file.type === 'application/pdf') && !ocr) ocr = lazyTesseract();
          if (handwritten && !handwritingOcr) {
            const key = getApiKey();
            if (!key) throw new Error('Für Handschrift bitte zuerst in den Einstellungen den API-Schlüssel eintragen.');
            const { createClaudeVisionEngine } = await import('./dokumente/import/ocr/claude');
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
          ergebnisse.push({ name: file.name, report: result.report });
        } catch (e) {
          ergebnisse.push({ name: file.name, error: e instanceof Error ? e.message : String(e) });
        }
      }
    } finally {
      await ocr?.terminate();
      setBusy('');
      setReports(ergebnisse);
      reload();
    }
  }

  async function remove(id: string) {
    if (!confirm('Dokument und seine Textabschnitte löschen?')) return;
    await deleteDocument(id);
    if (open === id) setOpen(null);
    reload();
  }

  return (
    <section>
      <h2>Dokumente</h2>
      <div className="card">
        <label className="field">Fach
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <label className="check">
          <input type="checkbox" checked={handwritten} onChange={(e) => setHandwritten(e.target.checked)} />
          Handschrift (Bild wird zur Texterkennung an Claude gesendet, keine Patientendaten!)
        </label>
        <label className="upload">
          <input type="file" multiple accept=".pdf,.docx,.pptx,.txt,.md,image/png,image/jpeg,image/webp"
            disabled={!!busy} onChange={(e) => { onFiles(e.target.files); e.target.value = ''; }} />
          <span>{busy || 'Dateien auswählen (PDF, Word, PowerPoint, Foto)'}</span>
        </label>
        {reports.map((r) => (
          <div key={r.name} className={r.error ? 'note warn' : 'note'}>
            <strong>{r.name}</strong>
            {r.error && <div>{r.error}</div>}
            {r.report && (
              <div>
                {r.report.pages} Seiten{r.report.ocrPages ? `, davon ${r.report.ocrPages} per Texterkennung` : ''}
                {r.report.chapters.length ? `, ${r.report.chapters.length} Kapitel` : ''}
                {r.report.warnings.map((w) => <div key={w}>⚠ {w}</div>)}
                {r.report.matches.map((m) => <div key={m.otherDocumentId}>↔ {m.otherTitle}: {m.recommendation}</div>)}
              </div>
            )}
          </div>
        ))}
      </div>

      {docs.length === 0 && <p className="muted">Noch keine Dokumente.</p>}
      {docs.map((d) => (
        <div key={d.id} className="card">
          <div className="row">
            <button className="link" onClick={() => setOpen(open === d.id ? null : d.id)}>
              <strong>{d.title}</strong> <span className="muted">{d.kind.toUpperCase()}</span>
            </button>
            <button className="danger small" onClick={() => remove(d.id)}>Löschen</button>
          </div>
          {open === d.id && (
            <div className="chunks">
              {chunks.map((c) => (
                <div key={c.id} className="chunk">
                  <div className="muted">S. {c.printedPage ?? c.page}{c.pageEstimated ? ' (geschätzt)' : ''}{c.chapter ? ` · ${c.chapter}` : ''}{c.ocrConfidence !== undefined ? ` · Lesbarkeit ${Math.round(c.ocrConfidence * 100)} %` : ''}</div>
                  <div className="pre">{c.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
