// Prüfungsfragen beantworten: Multiple Choice wird lokal ausgewertet, offene und Fallfragen bewertet Claude
// nach den Bewertungskriterien. Musterlösung und Belege erst nach der Antwort.
import { useState } from 'react';
import type { SourceChunk } from '../../../core/types';
import { getApiKey } from '../../../core/settings';
import { pflegeModule } from '../../../modules/pflege';
import { logActivity } from '../../../core/activity';
import { belegStelle } from '../belege';
import { bewerteAntwort, bewerteMc, type AntwortBewertung } from '../pruefung';
import type { BelegJson, FragenSatz, Pruefungsfrage } from '../typen';
import { Belegstelle } from './Belegstelle';

const TYP = { offen: 'Offene Frage', mc_einfach: 'Multiple Choice (eine richtig)', mc_mehrfach: 'Multiple Choice (mehrere richtig)', fall: 'Fallfrage' };
const FEHLERART = { begriff: 'Fachbegriff', zahl: 'Zahl/Einheit', ablauf: 'Ablauf', begruendung: 'Begründung', operator: 'Operator', inhalt: 'Inhalt' };

function Beleg({ b, chunkMap, titles }: { b: BelegJson; chunkMap: Map<string, SourceChunk>; titles: Map<string, string> }) {
  const s = belegStelle(b, chunkMap);
  return <Belegstelle titel={s ? titles.get(s.chunk.documentId) : undefined} chunk={s?.chunk} seite={s?.seite ?? '?'} start={s?.start} end={s?.end} zitat={b.zitat} />;
}

function Frage({ f, nr, chunkMap, titles, onErgebnis }: { f: Pruefungsfrage; nr: number; chunkMap: Map<string, SourceChunk>; titles: Map<string, string>; onErgebnis: (p: number, max: number) => void }) {
  const [gewaehlt, setGewaehlt] = useState<number[]>([]);
  const [text, setText] = useState('');
  const [mc, setMc] = useState<ReturnType<typeof bewerteMc> | null>(null);
  const [bewertung, setBewertung] = useState<AntwortBewertung | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const istMc = f.typ === 'mc_einfach' || f.typ === 'mc_mehrfach';
  const fertig = !!mc || !!bewertung;

  async function bewerte() {
    if (istMc) { const r = bewerteMc(f, gewaehlt); setMc(r); onErgebnis(r.punkte, r.max); return; }
    const apiKey = getApiKey();
    if (!apiKey) { setError('Für die Bewertung bitte in den Einstellungen den API-Schlüssel eintragen.'); return; }
    setBusy(true); setError('');
    try {
      const r = await bewerteAntwort({ apiKey, modul: pflegeModule, frage: f, antwort: text, chunks: chunkMap });
      setBewertung(r); onErgebnis(r.gesamt, r.max);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); }
  }

  return (
    <div className="frage card">
      <div className="muted">Frage {nr} · {TYP[f.typ]} · {f.operator} · {'●'.repeat(f.schwierigkeit)}{'○'.repeat(3 - f.schwierigkeit)}{f.pruefungsrelevanzBeleg ? ' · laut Material prüfungsrelevant' : ''}</div>
      <p className="pre"><strong>{f.frage}</strong></p>
      {istMc ? (
        <div>
          {(f.optionen ?? []).map((o, i) => (
            <label key={i} className={`check option ${mc ? (o.richtig ? 'richtig' : gewaehlt.includes(i) ? 'falsch' : '') : ''}`}>
              <input type={f.typ === 'mc_einfach' ? 'radio' : 'checkbox'} name={f.id} disabled={fertig} checked={gewaehlt.includes(i)}
                onChange={() => setGewaehlt(f.typ === 'mc_einfach' ? [i] : gewaehlt.includes(i) ? gewaehlt.filter((x) => x !== i) : [...gewaehlt, i])} />
              <span>{o.text}{mc && <span className="muted"> · {o.begruendung}</span>}</span>
            </label>
          ))}
        </div>
      ) : (
        <textarea className="wide" rows={5} value={text} disabled={fertig || busy} onChange={(e) => setText(e.target.value)} placeholder="Deine Antwort" />
      )}
      {!fertig && (
        <div className="row">
          <span className="muted">{f.bewertungskriterien.reduce((s, k) => s + k.punkte, 0)} Punkte</span>
          <button className="primary" disabled={busy || (istMc ? !gewaehlt.length : !text.trim())} onClick={bewerte}>{busy ? 'Wird bewertet …' : 'Antwort prüfen'}</button>
        </div>
      )}
      {error && <div className="note warn">{error}</div>}
      {mc && <div className={`note ${mc.richtig ? 'ok' : 'warn'}`}>{mc.richtig ? 'Richtig.' : 'Nicht ganz.'} {mc.punkte} von {mc.max} Punkten.</div>}
      {bewertung && (
        <div className={`note ${bewertung.gesamt >= bewertung.max * 0.75 ? 'ok' : 'warn'}`}>
          <strong>{bewertung.gesamt} von {bewertung.max} Punkten.</strong> {bewertung.rueckmeldung}
          <ul>{bewertung.punkte_je_kriterium.map((k, i) => <li key={i}>{k.kriterium}: {k.punkte}/{k.max}</li>)}</ul>
          {bewertung.fehlt.length > 0 && <div>Es fehlt: {bewertung.fehlt.join('; ')}</div>}
          {bewertung.fehler.map((e, i) => (
            <div key={i}><strong>{FEHLERART[e.art]}:</strong> {e.beschreibung}
              {e.richtig_laut_quelle && <Beleg b={e.richtig_laut_quelle} chunkMap={chunkMap} titles={titles} />}</div>
          ))}
        </div>
      )}
      {fertig && (
        <details>
          <summary>Musterlösung und Belege</summary>
          <p className="pre">{f.musterloesung}</p>
          {f.belege.map((b, i) => <Beleg key={i} b={b} chunkMap={chunkMap} titles={titles} />)}
          {f.pruefungsrelevanzBeleg && <><div className="muted">Prüfungsrelevanz laut Material:</div><Beleg b={f.pruefungsrelevanzBeleg} chunkMap={chunkMap} titles={titles} /></>}
        </details>
      )}
    </div>
  );
}

export function FragenAnsicht({ satz, chunkMap, titles }: { satz: FragenSatz; chunkMap: Map<string, SourceChunk>; titles: Map<string, string> }) {
  const [ergebnisse, setErgebnisse] = useState<Record<string, { p: number; max: number }>>({});
  const beantwortet = Object.keys(ergebnisse).length;
  const summe = Object.values(ergebnisse).reduce((s, e) => ({ p: s.p + e.p, max: s.max + e.max }), { p: 0, max: 0 });

  function ergebnis(id: string, p: number, max: number) {
    const neu = { ...ergebnisse, [id]: { p, max } };
    setErgebnisse(neu);
    if (Object.keys(neu).length === satz.fragen.length) {
      const s = Object.values(neu).reduce((a, e) => ({ p: a.p + e.p, max: a.max + e.max }), { p: 0, max: 0 });
      logActivity({ kind: 'uebung', ref: satz.id, severity: s.p >= s.max * 0.5 ? 'info' : 'warning', title: `Prüfungsfragen: ${satz.pruefungName}`, detail: `${s.p} von ${s.max} Punkten` });
    }
  }

  return (
    <>
      <div className="card">
        <h3>{satz.pruefungName}</h3>
        <p className="muted">
          {satz.fragen.length} Fragen, jede mit geprüftem Beleg aus deinem Material{satz.verworfen ? ` (${satz.verworfen} ohne gültigen Beleg verworfen)` : ''}.
          {beantwortet > 0 && ` Bisher ${summe.p} von ${summe.max} Punkten in ${beantwortet} Fragen.`}
        </p>
      </div>
      {satz.fragen.map((f, i) => <Frage key={f.id} f={f} nr={i + 1} chunkMap={chunkMap} titles={titles} onErgebnis={(p, max) => ergebnis(f.id, p, max)} />)}
    </>
  );
}
