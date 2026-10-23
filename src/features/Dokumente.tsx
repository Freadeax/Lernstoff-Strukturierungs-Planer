import { useEffect, useState } from 'react';
import { db, deleteDocument } from '../core/db';
import type { Document, SourceChunk } from '../core/types';
import { logActivity } from '../core/activity';
import { modules } from '../modules/registry';
import { ACCEPT, importiereDateien, type ImportErgebnis } from './dokumente/importiere';

const subjects = modules.flatMap((m) => m.subjects);

export function Dokumente() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? '');
  const [handwritten, setHandwritten] = useState(false);
  const [busy, setBusy] = useState('');
  const [reports, setReports] = useState<ImportErgebnis[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [chunks, setChunks] = useState<SourceChunk[]>([]);

  const reload = async () => setDocs(await db.documents.orderBy('importedAt').reverse().toArray().catch(() => db.documents.toArray()));
  useEffect(() => { reload(); }, []);
  useEffect(() => {
    if (open) db.chunks.where('documentId').equals(open).sortBy('page').then(setChunks);
  }, [open]);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    try {
      setReports(await importiereDateien(Array.from(files), { subjectId, handwritten, onProgress: (name) => setBusy(`Lese ${name} …`) }));
    } finally {
      setBusy('');
      reload();
    }
  }

  async function remove(id: string) {
    if (!confirm('Dokument und seine Textabschnitte löschen?')) return;
    const title = docs.find((d) => d.id === id)?.title ?? 'Dokument';
    await deleteDocument(id);
    await logActivity({ kind: 'dokument', severity: 'warning', ref: id, title: `${title} gelöscht`, detail: 'Abgeleitete Zusammenfassungen sind zur Prüfung markiert.' });
    if (open === id) setOpen(null);
    reload();
  }

  return (
    <section className="page">
      <div className="page__head">
        <h2>Dokumente</h2>
        <a className="button-link" href="#/material/import">Import-Assistent</a>
      </div>
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
          <input type="file" multiple accept={ACCEPT}
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
