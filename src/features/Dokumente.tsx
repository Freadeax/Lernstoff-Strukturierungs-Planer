import { ladeZiel } from './ablage/ablage';
import { useEffect, useState } from 'react';
import { liveQuery } from 'dexie';
import { ThemenZuordnung } from './dokumente/ThemenZuordnung';
import { db, deleteDocument } from '../core/db';
import type { Document, SourceChunk } from '../core/types';
import { logActivity } from '../core/activity';
import { modules } from '../modules/registry';
import { ACCEPT, importiereDateien, type ImportErgebnis } from './dokumente/importiere';
import { Field } from '../ui/form/Field';
import { PageHeading } from '../ui/PageHeading';
import { Icon } from '../ui/icons';

const subjects = modules.flatMap((m) => m.subjects);

export function Dokumente() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? '');
  const [archive, setArchive] = useState(() => !!ladeZiel().token);
  const [handwritten, setHandwritten] = useState(false);
  const [busy, setBusy] = useState('');
  const [reports, setReports] = useState<ImportErgebnis[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [chunks, setChunks] = useState<SourceChunk[]>([]);

  const reload = async () => setDocs(await db.documents.orderBy('importedAt').reverse().toArray().catch(() => db.documents.toArray()));
  useEffect(() => { const sub = liveQuery(async () => (await db.documents.toArray()).sort((a, b) => b.importedAt.localeCompare(a.importedAt))).subscribe(setDocs); return () => sub.unsubscribe(); }, []);
  useEffect(() => {
    let active = true; setChunks([]);
    if (open) db.chunks.where('documentId').equals(open).sortBy('page').then((rows) => { if (active) setChunks(rows); });
    return () => { active = false; };
  }, [open]);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    try {
      setReports(await importiereDateien(Array.from(files), { subjectId, handwritten, archive, onProgress: (name) => setBusy(`Lese ${name} …`) }));
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
      <PageHeading eyebrow="Deine Wissensbasis" title="Alles beginnt mit guten Quellen."
        description="Sammle Skripte, Arbeitsblätter und Notizen an einem Ort. Seiten und Textstellen bleiben nachvollziehbar."
        action={<a className="button-link" href="#/material/import"><Icon name="upload" size={18} /> Geführter Import</a>} />
      <div className="card form-card" aria-busy={!!busy}>
        <h2>Material direkt hinzufügen</h2>
        <p className="form-section__description">Wähle ein Fach und danach deine Dateien. Für eine schrittweise Auswahl nutze den geführten Import.</p>
        <Field label="Fach für dein Material" name="subject" required hint="Alle ausgewählten Dateien werden diesem Fach zugeordnet.">
          {(props) => <select {...props} disabled={!!busy} value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>}
        </Field>
        <label className="check">
          <input type="checkbox" disabled={!!busy} checked={handwritten} onChange={(e) => setHandwritten(e.target.checked)} />
          <span><strong>Handschrift erkennen</strong><br />Bilder werden dafür an Claude gesendet. Verwende keine Patientendaten.</span>
        </label>
        <label className="check"><input type="checkbox" checked={archive} disabled={!!busy} onChange={(e) => setArchive(e.target.checked)} /><span>Originale zusätzlich im privaten Material-Repo speichern · <a href="#/material/ablage">Verbindung verwalten</a></span></label>
        <label className="upload">
          <input type="file" multiple accept={ACCEPT}
            disabled={!!busy || !subjectId} onChange={(e) => { onFiles(e.target.files); e.target.value = ''; }} />
          <Icon name="upload" size={28} />
          <strong>{busy || 'Dateien auswählen und importieren'}</strong>
          <small>PDF, Word, PowerPoint, Text, Foto oder ZIP</small>
        </label>
        {busy && <p className="note" role="status" aria-live="polite">{busy}</p>}
        {reports.map((r) => (
          <div key={r.name} className={r.error || r.archiveError ? 'note warn' : 'note'}>
            <strong>{r.name}</strong>
            {r.error && <div>{r.error}</div>}
            {r.archive && <div>{r.archive}</div>}
            {r.archiveError && <div role="alert">{r.archiveError}</div>}
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

      <div className="section-heading"><h2>Deine Dokumente</h2><span className="muted">{docs.length} {docs.length === 1 ? 'Dokument' : 'Dokumente'}</span></div>
      {docs.length === 0 && <div className="import-empty"><Icon name="folder" size={30} /><h3>Platz für deinen Lernstoff.</h3><p className="muted">Sobald du Material importierst, findest du es hier mit seinen erkannten Textstellen.</p></div>}
      {docs.map((d) => (
        <div key={d.id} className="card">
          <div className="row">
            <button className="link" aria-expanded={open === d.id} aria-controls={`document-${d.id}`} onClick={() => setOpen(open === d.id ? null : d.id)}>
              <strong>{d.title}</strong> <span className="muted">{d.kind.toUpperCase()}</span>
            </button>
            <a className="button-link" href={`#/material/zusammenfassen?dokument=${encodeURIComponent(d.id)}`}>Wichtigste Inhalte zusammenfassen</a>
            <button className="danger small" onClick={() => remove(d.id)}>Löschen</button>
          </div>
          <ThemenZuordnung document={d} />
          {open === d.id && (
            <div id={`document-${d.id}`} className="chunks">
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
