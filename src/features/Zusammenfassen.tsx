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
import { Field, useFormFeedback } from '../ui/form/Field';
import { PageHeading } from '../ui/PageHeading';
import { Icon } from '../ui/icons';

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

  const feedback = useFormFeedback({
    sources: selected.size === 0 ? 'Wähle mindestens ein Dokument als Quelle aus.' : modus === 'vergleich' && selected.size < 2 ? 'Wähle mindestens zwei Dokumente, damit ihre Inhalte verglichen werden können.' : '',
    assignment: modus === 'arbeitsauftrag' && !aufgaben?.length ? 'Lass die Aufgaben erkennen und prüfe die Aufgabenliste, bevor du die Bearbeitung startest.' : '',
  });
  const hasKey = !!getApiKey();

  return (
    <section className="page summary-workspace">
      <PageHeading eyebrow="Material verstehen" title="Aus Quellen wird Lernstoff."
        description="Wähle dein Ziel, lege die Quellen fest und passe das Ergebnis an deinen Lernbedarf an." />
      {!hasKey && <div className="note">Für die Erstellung benötigst du deinen Claude-API-Schlüssel. <a href="#/einstellungen">KI-Unterstützung einrichten</a></div>}
      <form className="card form-card" noValidate aria-busy={!!busy} onSubmit={(e) => { e.preventDefault(); if (feedback.validate(e.currentTarget) && !busy) run(); }}>
        <p className="required-note">Mit <span className="required-mark">*</span> markierte Angaben sind erforderlich.</p>
        <fieldset className="form-section" disabled={!!busy}>
          <legend><span className="summary-stage-label">01</span>Was möchtest du erstellen?</legend>
          <p className="form-section__description">Jeder Modus hat eigene Regeln. Ergänzungen werden klar von deinen Originalquellen getrennt.</p>
          <div className="modi" role="group" aria-label="Arbeitsmodus">
            {MODI.map((m) => <button key={m.id} type="button" aria-pressed={modus === m.id} onClick={() => { setModus(m.id); setError(''); }}>
              <Icon name={m.id === 'pruefung' ? 'timer' : m.id === 'vergleich' ? 'layers' : m.id === 'arbeitsauftrag' ? 'clipboard' : m.id === 'lernen' ? 'book' : 'form'} size={20} />
              <span><strong>{m.label}</strong><small>{m.text}</small></span>
            </button>)}
          </div>
        </fieldset>
        <fieldset className="form-section" disabled={!!busy} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) feedback.touch('sources'); }} aria-describedby={feedback.error('sources') ? 'zf-sources-error' : 'zf-sources-hint'}>
          <legend><span className="summary-stage-label">02</span>Welche Quellen gehören dazu? <span className="required-mark" aria-hidden="true">*</span></legend>
          <p id="zf-sources-hint" className="form-section__description">{modus === 'vergleich' ? 'Wähle mindestens zwei Dokumente zum Vergleichen.' : 'Wähle die Dokumente, auf denen das Ergebnis beruhen soll.'} {selected.size > 0 && `${selected.size} ausgewählt.`}</p>
          {docs.length === 0 ? <div className="import-empty"><Icon name="folder" size={30} /><h3>Deine Quellen fehlen noch.</h3><p className="muted">Importiere zuerst ein Skript, Arbeitsblatt oder Lehrbuchauszug.</p><a className="button-link" href="#/material/import">Material importieren</a></div>
            : <div className="choice-list summary-sources">{docs.map((d) => <label key={d.id} className="check"><input type="checkbox" name="sources" checked={selected.has(d.id)} onChange={() => toggle(d.id)} /><span>{d.title}</span><small className="muted">{d.kind.toUpperCase()}</small></label>)}</div>}
          {feedback.error('sources') && <p id="zf-sources-error" className="field-error" aria-live="polite">{feedback.error('sources')}</p>}
        </fieldset>
        <fieldset className="form-section" disabled={!!busy}>
          <legend><span className="summary-stage-label">03</span>Das Ergebnis auf dich abstimmen</legend>
          <p className="form-section__description">Die Voreinstellungen passen für den Einstieg. Weitere Angaben sind optional.</p>
          <Field label="Thema" name="topic" hint="Optional. Wähle ein Katalogthema, um das Ergebnis mit deinem Lernstand zu verbinden.">
            {(props) => <input {...props} list="zf-themen" value={thema} onChange={(e) => setThema(e.target.value)} placeholder="z. B. Dekubitusprophylaxe" />}
          </Field>
          <datalist id="zf-themen">{pflegeModule.topics.map((t) => <option key={t.id} value={t.name} />)}</datalist>
          {topic && modus === 'lernen' && verwandteThemen(topic.id).length > 0 && <p className="muted">Verknüpft mit: {verwandteThemen(topic.id).join(', ')}</p>}
          {modus === 'lernen' && <>
            <Field label="Mein Wissensstand" name="knowledge" hint={wissenAusPlan ? 'Aus deinem Lernplan übernommen. Du kannst die Auswahl für diese Zusammenfassung anpassen.' : 'Die Erklärungstiefe richtet sich nach deiner Auswahl.'}>
              {(props) => <select {...props} value={wissen} onChange={(e) => { setWissen(e.target.value as MasteryStatus); setWissenAusPlan(false); }}>{WISSEN.map((w) => <option key={w.id} value={w.id}>{w.label}</option>)}</select>}
            </Field>
            <Field label="Was verwechsle ich oft?" name="mistakes" hint="Optional. Eine Unsicherheit pro Zeile hilft, die Erklärung gezielt anzupassen.">
              {(props) => <textarea {...props} rows={3} value={fehler} onChange={(e) => setFehler(e.target.value)} placeholder="z. B. Unterschied zwischen Dekubitus und Intertrigo" />}
            </Field>
          </>}
          {modus === 'arbeitsauftrag' && <div className="schritt">
            <Field label="Arbeitsblatt" name="worksheet" hint="Wähle ein importiertes Arbeitsblatt oder füge den Aufgabentext selbst ein.">
              {(props) => <select {...props} value={blattDoc} onChange={(e) => { setBlattDoc(e.target.value); setAufgaben(null); }}><option value="">Text selbst einfügen</option>{docs.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}</select>}
            </Field>
            {!blattDoc && <Field label="Aufgabentext" name="assignment" error={feedback.error('assignment')}>
              {(props) => <textarea {...props} rows={5} value={blattText} onChange={(e) => { setBlattText(e.target.value); setAufgaben(null); }} placeholder="Füge hier die Aufgaben und gegebenenfalls den Falltext ein." />}
            </Field>}
            <button type="button" disabled={!!busy || (!blattDoc && !blattText.trim())} onClick={aufgabenErkennen}>{aufgaben ? 'Aufgaben neu erkennen' : 'Aufgaben erkennen'}</button>
            <p className="field-hint">{aufgaben ? `${aufgaben.length} Aufgaben erkannt. Prüfe und korrigiere die Liste vor der Bearbeitung.` : 'Zuerst werden die Aufgaben gelesen. Die Bearbeitung startest du anschließend selbst.'}</p>
            {blattDoc && feedback.error('assignment') && <p className="field-error" aria-live="polite">{feedback.error('assignment')}</p>}
            {hinweise.length > 0 && <div className="note">{hinweise.map((h, i) => <div key={i}>{h}</div>)}</div>}
            {aufgaben && <><h3>Erkannte Aufgaben prüfen</h3><AufgabenEditor aufgaben={aufgaben} onChange={setAufgaben} modul={pflegeModule} /></>}
          </div>}
          {modus === 'pruefung' && <>
            <Field label="Name der Prüfung" name="examName" hint="Optional. Ohne Namen heißt dein Fragensatz „Übungsprüfung“.">{(props) => <input {...props} value={pruefName} onChange={(e) => setPruefName(e.target.value)} placeholder="z. B. Klausur LF 4" />}</Field>
            <Field label="Prüfungstermin" name="examDate" hint="Optional. Der Termin wird beim Fragensatz hinterlegt.">{(props) => <input {...props} type="date" value={pruefDatum} onChange={(e) => setPruefDatum(e.target.value)} />}</Field>
            <Field label="Anzahl der Fragen" name="questionCount" hint="Zwischen 3 und 20 Fragen. Für den Einstieg sind 8 Fragen vorausgewählt.">{(props) => <input {...props} type="number" min={3} max={20} value={anzahl} onChange={(e) => setAnzahl(Math.min(20, Math.max(3, Number(e.target.value) || 8)))} />}</Field>
            <Field label="Lernziele oder Hinweise der Lehrkraft" name="objectives" hint="Optional. Zum Beispiel vorgegebene Schwerpunkte oder Prüfungsinhalte.">{(props) => <textarea {...props} rows={3} value={lernziele} onChange={(e) => setLernziele(e.target.value)} />}</Field>
          </>}
          {(modus === 'originalgetreu' || modus === 'lernen') && <Field label="Umfang der Zusammenfassung" name="length" hint="Mittel bietet einen ausgewogenen Überblick mit den wichtigsten Details.">
            {(props) => <select {...props} value={length} onChange={(e) => setLength(e.target.value as SummaryLength)}><option value="kurz">Kurz · die Kernaussagen</option><option value="mittel">Mittel · ein guter Überblick</option><option value="ausfuehrlich">Ausführlich · mit mehr Details</option></select>}
          </Field>}
          {(modus === 'originalgetreu' || modus === 'lernen' || modus === 'arbeitsauftrag') && <label className="check"><input type="checkbox" checked={kiPruefer} onChange={(e) => setKiPruefer(e.target.checked)} /><span><strong>KI-Prüfer aktivieren</strong><br /><span className="muted">Liest Aussagen gegen die Quelle. Ein zusätzlicher Aufruf und bei Bedarf eine Korrekturrunde.</span></span></label>}
        </fieldset>
        <div className="form-actions"><p>{selected.size ? `${selected.size} ${selected.size === 1 ? 'Quelle ausgewählt' : 'Quellen ausgewählt'} · ${info.label}` : 'Wähle deine Quellen, um mit der Erstellung zu starten.'}</p><button className="primary" type="submit" disabled={!!busy || !hasKey}>{busy ? 'Wird erstellt …' : modus === 'pruefung' ? 'Fragen erstellen' : modus === 'vergleich' ? 'Quellen vergleichen' : modus === 'arbeitsauftrag' ? 'Aufgaben bearbeiten' : 'Zusammenfassung erstellen'}</button></div>
        {busy && <p className="note" role="status" aria-live="polite">{busy}</p>}
        {error && <div className="note warn" role="alert">{error}</div>}
      </form>

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
