import { useEffect, useMemo, useState } from 'react';
import { db } from '../core/db';
import type { Claim, Document, SourceChunk, Summary, SummaryLength } from '../core/types';
import { getApiKey } from '../core/settings';
import { pflegeModule } from '../modules/pflege';
import { fasseZusammen } from './zusammenfasser/pipeline';
import { logActivity } from '../core/activity';

const AMPEL = { gruen: 'Alle Aussagen belegt', gelb: 'Mit Hinweisen, bitte prüfen', rot: 'Nicht verlässlich: unbelegte oder falsch zitierte Aussagen' };
const STATUS_TEXT: Record<string, string> = {
  belegt: 'belegt', unbelegt: 'ohne Beleg', abweichend: 'weicht ab', widerspruch: 'Widerspruch', unleserlich: 'unleserlich', fehlt: 'fehlt in der Quelle', ungeprueft: 'ungeprüft',
};

export function Zusammenfassen() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [length, setLength] = useState<SummaryLength>('mittel');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [current, setCurrent] = useState<Summary | null>(null);
  const [chunkMap, setChunkMap] = useState<Map<string, SourceChunk>>(new Map());
  const [shown, setShown] = useState<Claim | null>(null);

  const reload = async () => {
    setDocs(await db.documents.toArray());
    setSummaries((await db.summaries.toArray()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  };
  useEffect(() => { reload(); }, []);
  useEffect(() => {
    if (!current) return;
    db.chunks.where('documentId').anyOf(current.sourceDocumentIds).toArray().then((cs) => setChunkMap(new Map(cs.map((c) => [c.id, c]))));
  }, [current]);
  const titles = useMemo(() => new Map(docs.map((d) => [d.id, d.title])), [docs]);

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  }

  async function run() {
    const apiKey = getApiKey();
    if (!apiKey) { setError('Bitte zuerst in den Einstellungen den API-Schlüssel eintragen.'); return; }
    setBusy(true); setError(''); setShown(null);
    try {
      const auswahl = docs.filter((d) => selected.has(d.id));
      const chunks = await db.chunks.where('documentId').anyOf([...selected]).toArray();
      const { summary } = await fasseZusammen({ apiKey, modul: pflegeModule, length, docs: auswahl, chunks });
      await db.summaries.add(summary);
      await logActivity({
        kind: 'zusammenfassung', ref: summary.id, subjectIds: [...new Set(auswahl.flatMap((d) => d.subjectIds))],
        severity: summary.qa?.ampel === 'rot' ? 'critical' : summary.qa?.ampel === 'gelb' ? 'warning' : 'info',
        title: `Zusammenfassung: ${auswahl.map((d) => d.title).join(', ')}`,
        detail: summary.qa ? `${summary.qa.statistik.belegt} von ${summary.qa.statistik.claims} Aussagen belegt` : undefined,
      });
      setCurrent(summary);
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="page">
      <h2>Zusammenfassen</h2>
      <div className="card">
        <h3>Originalgetreu</h3>
        <p className="muted">Nur Inhalte aus den gewählten Quellen. Jede Aussage wird gegen den Originaltext geprüft.</p>
        {docs.length === 0 && <p>Zuerst unter „Dokumente“ Material hochladen.</p>}
        {docs.map((d) => (
          <label key={d.id} className="check">
            <input type="checkbox" checked={selected.has(d.id)} onChange={() => toggle(d.id)} /> {d.title}
          </label>
        ))}
        <div className="row">
          <select value={length} onChange={(e) => setLength(e.target.value as SummaryLength)}>
            <option value="kurz">kurz</option><option value="mittel">mittel</option><option value="ausfuehrlich">ausführlich</option>
          </select>
          <button className="primary" disabled={busy || !selected.size} onClick={run}>{busy ? 'Wird erstellt … (1–3 Min.)' : 'Zusammenfassen'}</button>
        </div>
        {error && <div className="note warn">{error}</div>}
      </div>

      {current && (
        <div className="card">
          <div className={`ampel ${current.qa?.ampel}`}>{current.qa && AMPEL[current.qa.ampel]}</div>
          {current.qa && (
            <p className="muted">
              {current.qa.statistik.belegt} von {current.qa.statistik.claims} Aussagen belegt
              {current.qa.statistik.unbelegt ? `, ${current.qa.statistik.unbelegt} ohne Beleg` : ''}
              {current.qa.statistik.fehlt ? `, ${current.qa.statistik.fehlt} Lücken markiert` : ''}. Tippe auf eine Aussage für die Originalstelle.
            </p>
          )}
          <div className="summary">
            {current.claims.map((c) => {
              const h = /^(#{1,6})\s+(.*)$/.exec(c.text);
              if (h) return <h4 key={c.id} className={`h${h[1].length}`}>{h[2]}</h4>;
              return (
                <span key={c.id} className={`claim ${c.status} ${shown?.id === c.id ? 'active' : ''}`} onClick={() => setShown(shown?.id === c.id ? null : c)}>
                  {c.text}{' '}
                </span>
              );
            })}
          </div>
          {shown && (
            <div className="source">
              <div><strong>{STATUS_TEXT[shown.status]}</strong></div>
              {current.qa?.befunde.filter((b) => b.claimId === shown.id).map((b) => <div key={b.id} className="muted">{b.meldung}</div>)}
              {shown.citations.map((z, i) => {
                const ch = chunkMap.get(z.chunkId);
                return (
                  <div key={i} className="quote">
                    <div className="muted">{titles.get(z.documentId) ?? 'Quelle'}, S. {z.printedPage ?? z.page}{ch?.chapter ? ` · ${ch.chapter}` : ''}</div>
                    {ch && z.charStart !== undefined && z.charEnd !== undefined
                      ? <div className="pre">…{ch.text.slice(Math.max(0, z.charStart - 120), z.charStart)}<mark>{ch.text.slice(z.charStart, z.charEnd)}</mark>{ch.text.slice(z.charEnd, z.charEnd + 120)}…</div>
                      : <div className="pre">„{z.quote}“</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {summaries.length > 0 && (
        <div className="card">
          <h3>Gespeicherte Zusammenfassungen</h3>
          {summaries.map((s) => (
            <button key={s.id} className="link block" onClick={() => { setCurrent(s); setShown(null); }}>
              {new Date(s.createdAt).toLocaleString('de-DE')} · {s.length} · {s.sourceDocumentIds.map((id) => titles.get(id) ?? '?').join(', ')}
              {s.needsReview ? ' · bitte prüfen' : ''}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
