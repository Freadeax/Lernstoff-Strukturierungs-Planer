import { useEffect, useState } from 'react';
import { liveQuery } from 'dexie';
import { db } from '../../core/db';
import { bestaetigeThema, gleicheThemenAb, ladeThemen, normalisiereThema } from '../../core/topics';
import type { Document, Topic } from '../../core/types';

export function ThemenZuordnung({ document }: { document: Document }) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [suche, setSuche] = useState('');
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { const sub = liveQuery(() => ladeThemen()).subscribe(setTopics); return () => sub.unsubscribe(); }, []);
  const passend = topics.filter((t) => document.subjectIds.includes(t.subjectId));
  async function run(f: () => Promise<unknown>) {
    setBusy(true); setError('');
    try { await f(); } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); }
  }
  return <details className="card">
    <summary>Themen zuordnen · {document.topicIds.length} verknüpft · {document.topicSuggestions?.length ?? 0} Vorschläge</summary>
    <p className="muted">Vorhandene Themen werden anhand ihrer Namen im Text erkannt. Prüfe die Zuordnung und ergänze fehlende Themen. Dein Lernstand bleibt erhalten.</p>
    <fieldset disabled={busy}>
      <legend>Vorhandene Themen</legend>
      <label className="field">Themen suchen<input type="search" value={suche} onChange={(e) => setSuche(e.target.value)} placeholder="Themen filtern" /></label>
      {passend.filter((t) => document.topicIds.includes(t.id) || (suche && t.name.toLocaleLowerCase('de').includes(suche.toLocaleLowerCase('de')))).slice(0, 40).map((t) => <label className="check" key={t.id}>
        <input type="checkbox" checked={document.topicIds.includes(t.id)} onChange={(e) => {
          const checked = e.target.checked;
          void run(() => db.transaction('rw', db.documents, async () => {
            const d = await db.documents.get(document.id);
            if (d) await db.documents.update(d.id, { topicIds: checked ? [...new Set([...d.topicIds, t.id])] : d.topicIds.filter((id) => id !== t.id), excludedTopicIds: checked ? d.excludedTopicIds?.filter((id) => id !== t.id) : [...new Set([...d.excludedTopicIds ?? [], t.id])] });
          }));
        }} />{t.parentId ? `${topics.find((p) => p.id === t.parentId)?.name ?? ''} › ` : ''}{t.name}
      </label>)}
    </fieldset>
    <button type="button" disabled={busy} onClick={() => void run(() => gleicheThemenAb(document.id))}>Text erneut mit Themen abgleichen</button>
    <p className="muted">Neue Themen aus Kapitelüberschriften erscheinen erst nach deiner Bestätigung im Themenpool.</p>
    {document.topicSuggestions?.map((s) => <div className="row" key={s.name}>
      <span>{[topics.find((t) => t.id === s.parentId)?.name, ...s.parentNames ?? [], s.name].filter(Boolean).join(' › ')}</span>
      <button type="button" disabled={busy} onClick={() => { setName(s.name); setParentId(s.parentId ?? ''); }}>Bearbeiten</button>
      <button type="button" disabled={busy} onClick={() => void run(() => bestaetigeThema(document.id, s))}>Übernehmen</button>
      <button type="button" disabled={busy} onClick={() => void run(() => db.documents.update(document.id, { topicSuggestions: document.topicSuggestions?.filter((v) => v.name !== s.name), ignoredTopicNames: [...new Set([...document.ignoredTopicNames ?? [], normalisiereThema(s.name)])] }))}>Verwerfen</button>
    </div>)}
    <label className="field">Neues Thema<input value={name} maxLength={140} onChange={(e) => setName(e.target.value)} placeholder="Themenname prüfen oder ergänzen" /></label>
    <label className="field">Einordnen unter<select value={parentId} onChange={(e) => setParentId(e.target.value)}>
      <option value="">Direkt im gewählten Fach</option>
      {passend.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
    </select></label>
    <button type="button" disabled={busy || name.trim().length < 4} onClick={() => void run(async () => {
      await bestaetigeThema(document.id, { name: name.trim(), parentId: parentId || undefined, subjectId: passend.find((t) => t.id === parentId)?.subjectId ?? document.subjectIds[0]! }); setName('');
    })}>Thema im Pool ergänzen</button>
    {error && <p role="alert" className="note warn">{error}</p>}
  </details>;
}
