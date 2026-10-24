import { useEffect, useMemo, useState } from 'react';
import { db } from '../core/db';
import type { Document, MasteryStatus, SourceChunk, Summary, SummaryLength } from '../core/types';
import { getApiKey } from '../core/settings';
import { pflegeModule } from '../modules/pflege';
import { fasseZusammen, SCHRITT_TEXT, type TextModus } from './zusammenfasser/pipeline';
import { erkenneAufgaben } from './zusammenfasser/aufgaben';
import { erstelleFragen } from './zusammenfasser/pruefung';
import { vergleiche } from './zusammenfasser/vergleich';
import type { Aufgabe, FragenSatz, VergleichsErgebnis } from './zusammenfasser/typen';
import { SummaryAnsicht, MODUS_TEXT } from './zusammenfasser/ui/SummaryAnsicht';
import { AufgabenEditor } from './zusammenfasser/ui/AufgabenEditor';
import { FragenAnsicht } from './zusammenfasser/ui/FragenAnsicht';
import { VergleichsAnsicht } from './zusammenfasser/ui/VergleichsAnsicht';
import { logActivity } from '../core/activity';
import { topicKnowledge } from './lernplan/store';

type Modus = TextModus | 'pruefung' | 'vergleich';

const MODI: Array<{ id: Modus; label: string; text: string }> = [
  { id: 'originalgetreu', label: 'Originalgetreu', text: 'Nur Inhalte aus den gewählten Quellen. Jede Aussage wird gegen den Originaltext geprüft.' },
  { id: 'lernen', label: 'Lernen', text: 'Belegter Kerninhalt plus Erklärungen, Beispiele und Eselsbrücken, sichtbar als Lernhilfe markiert und vom KI-Prüfer gegengelesen.' },
  { id: 'arbeitsauftrag', label: 'Arbeitsauftrag', text: 'Aufgaben aus dem Arbeitsblatt erkennen, bestätigen und dann mit Belegen bearbeiten. Anzahl und Bestandteile werden per Code geprüft.' },
  { id: 'pruefung', label: 'Prüfung', text: 'Prüfungsfragen mit Musterlösung aus deinem Material. Fragen ohne gültigen Beleg werden verworfen.' },
  { id: 'vergleich', label: 'Vergleich', text: 'Was sagen zwei oder mehr Quellen zum selben Thema? Übereinstimmungen, Ergänzungen und Widersprüche, jeweils mit Belegen.' },
];
const WISSEN: Array<{ id: MasteryStatus; label: string }> = [
  { id: 'offen', label: 'offen (neu für mich)' }, { id: 'bearbeitet', label: 'bearbeitet' }, { id: 'unsicher', label: 'unsicher' }, { id: 'sicher', label: 'sicher' },
];

const topicByName = new Map(pflegeModule.topics.map((t) => [t.name.toLowerCase(), t]));
function verwandteThemen(topicId: string): string[] {
  const t = pflegeModule.topics.find((x) => x.id === topicId);
  if (!t) return [];
  const ids = new Set([...t.prerequisites, ...(t.parentId ? [t.parentId] : []), ...pflegeModule.topics.filter((x) => x.prerequisites.includes(topicId)).map((x) => x.id)]);
  return pflegeModule.topics.filter((x) => ids.has(x.id)).map((x) => x.name);
}

export function Zusammenfassen() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modus, setModus] = useState<Modus>('originalgetreu');
  const [length, setLength] = useState<SummaryLength>('mittel');
  const [thema, setThema] = useState('');
  const [kiPruefer, setKiPruefer] = useState(true);
  // Lernmodus
  const [wissen, setWissen] = useState<MasteryStatus>('offen');
  const [fehler, setFehler] = useState('');
  // Arbeitsauftrag
  const [blattDoc, setBlattDoc] = useState('');
  const [blattText, setBlattText] = useState('');
  const [aufgaben, setAufgaben] = useState<Aufgabe[] | null>(null);
  const [hinweise, setHinweise] = useState<string[]>([]);
  // Prüfung
  const [pruefName, setPruefName] = useState('');
  const [pruefDatum, setPruefDatum] = useState('');
  const [anzahl, setAnzahl] = useState(8);
  const [lernziele, setLernziele] = useState('');

  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [current, setCurrent] = useState<Summary | null>(null);
  const [chunkMap, setChunkMap] = useState<Map<string, SourceChunk>>(new Map());

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
  const topic = topicByName.get(thema.trim().toLowerCase());
  const info = MODI.find((m) => m.id === modus)!;
  const [wissenAusPlan, setWissenAusPlan] = useState(false);
  // Lernmodus: Wissensstand aus dem Lernplan übernehmen, solange die Person ihn nicht selbst ändert
  useEffect(() => {
    setWissenAusPlan(false);
    if (!topic || modus !== 'lernen') return;
    let aktiv = true;
    topicKnowledge(topic).then((p) => { if (aktiv) { setWissen(p.status); setWissenAusPlan(true); } }).catch(() => {});
    return () => { aktiv = false; };
  }, [topic?.id, modus]);

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  }

  async function mitSchluessel(f: (apiKey: string) => Promise<void>) {
    const apiKey = getApiKey();
    if (!apiKey) { setError('Bitte zuerst in den Einstellungen den API-Schlüssel eintragen.'); return; }
    setBusy('Bitte warten …'); setError('');
    try { await f(apiKey); } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(''); }
  }

  async function quellen() {
    const ids = new Set(selected);
    if (modus === 'arbeitsauftrag' && blattDoc) ids.add(blattDoc);   // Fallangaben des Blatts sind belegbar
    const auswahl = docs.filter((d) => ids.has(d.id));
    const chunks = await db.chunks.where('documentId').anyOf([...ids]).toArray();
    return { auswahl, chunks };
  }

  async function speichere(summary: Summary, titel: string, detail?: string, severity: 'info' | 'warning' | 'critical' = 'info') {
    await db.summaries.add(summary);
    await logActivity({ kind: 'zusammenfassung', ref: summary.id, severity, title: titel, detail,
      subjectIds: [...new Set(docs.filter((d) => summary.sourceDocumentIds.includes(d.id)).flatMap((d) => d.subjectIds))] });
    setCurrent(summary);
    reload();
  }

  const aufgabenErkennen = () => mitSchluessel(async (apiKey) => {
    setBusy('Aufgaben werden gelesen …');
    let text = blattText;
    if (blattDoc) text = (await db.chunks.where('documentId').equals(blattDoc).sortBy('page')).map((c) => c.text).join('\n\n');
    const r = await erkenneAufgaben({ apiKey, modul: pflegeModule, blattText: text });
    if (!r.aufgaben.length) throw new Error('Auf dem Blatt wurden keine Aufgaben gefunden.');
    setAufgaben(r.aufgaben); setHinweise(r.hinweise);
  });

  const run = () => mitSchluessel(async (apiKey) => {
    const { auswahl, chunks } = await quellen();
    const topicIds = topic ? [topic.id] : [];
    if (modus === 'pruefung') {
      setBusy('Fragen werden erstellt und Belege geprüft … (1–3 Min.)');
      const satz = await erstelleFragen({ apiKey, modul: pflegeModule, docs: auswahl, chunks, name: pruefName, datum: pruefDatum, lernziele: [thema, lernziele].filter(Boolean).join('\n'), anzahl, schwacheThemen: '', topicIds });
      await speichere(satz, `Prüfungsfragen: ${satz.pruefungName}`, `${satz.fragen.length} Fragen`);
      return;
    }
    if (modus === 'vergleich') {
      const erg = await vergleiche({ apiKey, modul: pflegeModule, docs: auswahl, chunks, thema, topicIds, onSchritt: setBusy });
      await speichere(erg, `Vergleich: ${erg.thema}`, `${erg.zeilen.length} Unterthemen`);
      return;
    }
    const { summary } = await fasseZusammen({
      apiKey, modul: pflegeModule, length, docs: auswahl, chunks, modus, thema, topicIds, kiPruefer,
      verwandteThemen: topic ? verwandteThemen(topic.id) : undefined,
      wissensstand: { status: wissen, haeufigeFehler: fehler.split('\n').map((s) => s.trim()).filter(Boolean) },
      aufgaben: aufgaben ?? undefined, blattText: blattDoc ? undefined : blattText || undefined,
      onSchritt: (s) => setBusy(SCHRITT_TEXT[s]),
    });
    await speichere(summary, `${MODUS_TEXT[modus]}: ${thema || auswahl.map((d) => d.title).join(', ')}`,
      summary.qa ? `${summary.qa.statistik.belegt} von ${summary.qa.statistik.claims} Aussagen belegt` : undefined,
      summary.qa?.ampel === 'rot' ? 'critical' : summary.qa?.ampel === 'gelb' ? 'warning' : 'info');
  });

  const bereit = !busy && selected.size > 0 && (modus !== 'arbeitsauftrag' || !!aufgaben?.length) && (modus !== 'vergleich' || selected.size >= 2);

  return (
    <section className="page">
      <h2>Zusammenfassen</h2>
      <div className="card">
        <div className="modi" role="group" aria-label="Modus">
          {MODI.map((m) => <button key={m.id} className="small" aria-pressed={modus === m.id} onClick={() => { setModus(m.id); setError(''); }}>{m.label}</button>)}
        </div>
        <p className="muted">{info.text}</p>

        <h3>Quellen</h3>
        {docs.length === 0 && <p>Zuerst unter „Dokumente“ Material hochladen.</p>}
        {docs.map((d) => (
          <label key={d.id} className="check">
            <input type="checkbox" checked={selected.has(d.id)} onChange={() => toggle(d.id)} /> {d.title}
          </label>
        ))}

        <label className="field">
          <span>Thema {modus === 'vergleich' ? '' : '(optional)'}</span>
          <input className="wide" list="zf-themen" value={thema} onChange={(e) => setThema(e.target.value)} placeholder="z. B. Dekubitusprophylaxe" />
          <datalist id="zf-themen">{pflegeModule.topics.map((t) => <option key={t.id} value={t.name} />)}</datalist>
          {topic && modus === 'lernen' && verwandteThemen(topic.id).length > 0 && <span className="muted">Verknüpft mit: {verwandteThemen(topic.id).join(', ')}</span>}
        </label>

        {modus === 'lernen' && (
          <>
            <label className="field"><span>Mein Wissensstand</span>
              <select value={wissen} onChange={(e) => { setWissen(e.target.value as MasteryStatus); setWissenAusPlan(false); }}>{WISSEN.map((w) => <option key={w.id} value={w.id}>{w.label}</option>)}</select>
              {wissenAusPlan && <span className="muted">aus deinem Lernplan übernommen</span>}
            </label>
            <label className="field"><span>Was verwechsle ich oft? (optional, eine Zeile je Punkt)</span>
              <textarea className="wide" rows={2} value={fehler} onChange={(e) => setFehler(e.target.value)} />
            </label>
          </>
        )}

        {modus === 'arbeitsauftrag' && (
          <div className="schritt">
            <h3>1. Arbeitsblatt</h3>
            <label className="field"><span>Arbeitsblatt aus deinen Dokumenten</span>
              <select value={blattDoc} onChange={(e) => { setBlattDoc(e.target.value); setAufgaben(null); }}>
                <option value="">Text selbst einfügen</option>
                {docs.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
              </select>
            </label>
            {!blattDoc && <textarea className="wide" rows={5} value={blattText} onChange={(e) => { setBlattText(e.target.value); setAufgaben(null); }} placeholder="Aufgabentext hier einfügen" />}
            <div className="row">
              <span className="muted">{aufgaben ? `${aufgaben.length} Aufgaben erkannt. Bitte prüfen und korrigieren.` : 'Claude liest die Aufgaben aus, bearbeitet sie aber noch nicht.'}</span>
              <button disabled={!!busy || (!blattDoc && !blattText.trim())} onClick={aufgabenErkennen}>{aufgaben ? 'Neu erkennen' : 'Aufgaben erkennen'}</button>
            </div>
            {hinweise.length > 0 && <div className="note">{hinweise.map((h, i) => <div key={i}>{h}</div>)}</div>}
            {aufgaben && <><h3>2. Aufgaben bestätigen</h3><AufgabenEditor aufgaben={aufgaben} onChange={setAufgaben} modul={pflegeModule} /></>}
          </div>
        )}

        {modus === 'pruefung' && (
          <>
            <div className="row" style={{ justifyContent: 'flex-start' }}>
              <label className="field"><span>Prüfung</span><input value={pruefName} onChange={(e) => setPruefName(e.target.value)} placeholder="z. B. Klausur LF 4" /></label>
              <label className="field"><span>Datum</span><input type="date" value={pruefDatum} onChange={(e) => setPruefDatum(e.target.value)} /></label>
              <label className="field"><span>Fragen</span><input type="number" min={3} max={20} value={anzahl} onChange={(e) => setAnzahl(Math.min(20, Math.max(3, Number(e.target.value) || 8)))} style={{ width: '5em' }} /></label>
            </div>
            <label className="field"><span>Lernziele oder Hinweise der Lehrkraft (optional)</span>
              <textarea className="wide" rows={2} value={lernziele} onChange={(e) => setLernziele(e.target.value)} />
            </label>
          </>
        )}

        <div className="row">
          {(modus === 'originalgetreu' || modus === 'lernen') ? (
            <select value={length} onChange={(e) => setLength(e.target.value as SummaryLength)} aria-label="Länge">
              <option value="kurz">kurz</option><option value="mittel">mittel</option><option value="ausfuehrlich">ausführlich</option>
            </select>
          ) : <span />}
          <button className="primary" disabled={!bereit} onClick={run}>
            {busy || (modus === 'pruefung' ? 'Fragen erstellen' : modus === 'vergleich' ? 'Vergleichen' : modus === 'arbeitsauftrag' ? '3. Bearbeiten' : 'Zusammenfassen')}
          </button>
        </div>
        {(modus === 'originalgetreu' || modus === 'lernen' || modus === 'arbeitsauftrag') && (
          <label className="check">
            <input type="checkbox" checked={kiPruefer} onChange={(e) => setKiPruefer(e.target.checked)} />
            <span>KI-Prüfer und automatische Korrektur <span className="muted">(liest jede Aussage gegen die Quelle, ein zusätzlicher Aufruf, bei Fehlern eine Korrekturrunde)</span></span>
          </label>
        )}
        {modus === 'vergleich' && selected.size === 1 && <div className="note">Bitte mindestens zwei Dokumente auswählen.</div>}
        {error && <div className="note warn">{error}</div>}
      </div>

      {current && current.mode === 'pruefung' && <FragenAnsicht key={current.id} satz={current as FragenSatz} chunkMap={chunkMap} titles={titles} />}
      {current && current.mode === 'vergleich' && <VergleichsAnsicht key={current.id} ergebnis={current as VergleichsErgebnis} chunkMap={chunkMap} titles={titles} />}
      {current && current.mode !== 'pruefung' && current.mode !== 'vergleich' && (
        <div className="card"><SummaryAnsicht key={current.id} summary={current} chunkMap={chunkMap} titles={titles} /></div>
      )}

      {summaries.length > 0 && (
        <div className="card">
          <h3>Gespeichert</h3>
          {summaries.map((s) => (
            <button key={s.id} className="link block" onClick={() => setCurrent(s)}>
              {new Date(s.createdAt).toLocaleString('de-DE')} · {MODUS_TEXT[s.mode] ?? s.mode}
              {s.mode === 'pruefung' ? ` · ${(s as FragenSatz).pruefungName}` : s.mode === 'vergleich' ? ` · ${(s as VergleichsErgebnis).thema}` : ` · ${s.length}`}
              {' · '}{s.sourceDocumentIds.map((id) => titles.get(id) ?? '?').join(', ')}
              {s.qa ? ` · ${s.qa.ampel === 'gruen' ? 'grün' : s.qa.ampel}` : ''}
              {s.needsReview ? ' · bitte prüfen' : ''}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
