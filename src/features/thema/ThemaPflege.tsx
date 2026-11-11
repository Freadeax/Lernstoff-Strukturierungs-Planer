import { useEffect, useMemo, useRef, useState } from 'react';
import { ladeThemen } from '../../core/topics';
import type { ID, Topic } from '../../core/types';
import { navigate } from '../../ui/shell/router';
import {
  benenneThemaUm, bezuegeText, bezuegeVon, findeDubletten, fuehreThemenZusammen, hatVerlauf, istEigenesThema,
  korrigiereZuordnung, loescheThema, type Bezuege, type QuellenArt,
} from './pflege';

const enc = encodeURIComponent;

function useThemen() {
  const [themen, setThemen] = useState<Topic[]>([]);
  useEffect(() => { let a = true; ladeThemen().then((t) => { if (a) setThemen(t); }).catch(() => undefined); return () => { a = false; }; }, []);
  return themen;
}

/** Auswahl eines anderen Themas desselben Fachs (Oberthema › Thema), alphabetisch. */
function ThemaAuswahl({ label, themen, fachId, ohne, wert, setWert }: { label: string; themen: Topic[]; fachId?: ID; ohne: ID; wert: ID; setWert: (id: ID) => void }) {
  const namen = new Map(themen.map((t) => [t.id, t.name]));
  const liste = themen.filter((t) => t.id !== ohne && (!fachId || t.subjectId === fachId))
    .map((t) => ({ id: t.id, text: `${t.parentId ? `${namen.get(t.parentId) ?? ''} › ` : ''}${t.name}${istEigenesThema(t.id) ? ' (eigenes)' : ''}` }))
    .sort((a, b) => a.text.localeCompare(b.text, 'de'));
  return (
    <label className="field">{label}
      <select value={wert} onChange={(e) => setWert(e.target.value)}>
        <option value="">Bitte wählen</option>
        {liste.map((t) => <option key={t.id} value={t.id}>{t.text}</option>)}
      </select>
    </label>
  );
}

/**
 * „Falsch zugeordnet?“ an einer Quelle: in einem Schritt lösen oder auf ein anderes Thema umhängen.
 * Gelöste Themen merkt sich die App, damit der nächste automatische Abgleich sie nicht wieder setzt.
 */
export function ZuordnungKorrigieren({ art, quelleId, topicId, fachId, onFertig }: { art: QuellenArt; quelleId: ID; topicId: ID; fachId?: ID; onFertig: () => void }) {
  const themen = useThemen();
  const [ziel, setZiel] = useState('');
  const [busy, setBusy] = useState(false);
  const [fehler, setFehler] = useState('');
  const run = async (nach?: ID) => {
    setBusy(true); setFehler('');
    try { await korrigiereZuordnung(art, quelleId, topicId, nach); onFertig(); } catch (e) { setFehler(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); }
  };
  return (
    <details className="thema__korrektur">
      <summary>Falsch zugeordnet?</summary>
      <div className="thema__korrektur-inhalt">
        <button type="button" className="small" disabled={busy} onClick={() => void run()}>Nicht zu diesem Thema</button>
        <ThemaAuswahl label="Stattdessen zuordnen zu" themen={themen} fachId={fachId} ohne={topicId} wert={ziel} setWert={setZiel} />
        <button type="button" className="small" disabled={busy || !ziel} onClick={() => void run(ziel)}>Umhängen</button>
        {fehler && <p role="alert" className="note warn">{fehler}</p>}
      </div>
    </details>
  );
}

/** Eigenes Thema umbenennen, zusammenführen (Dublette auflösen) oder löschen, mit Folgen vorab. */
export function ThemaVerwalten({ topic, onGeaendert }: { topic: Topic; onGeaendert: () => void }) {
  const themen = useThemen();
  const [name, setName] = useState(topic.name);
  const [ziel, setZiel] = useState('');
  const [bezuege, setBezuege] = useState<Bezuege | null>(null);
  const [verlauf, setVerlauf] = useState(false);
  const [busy, setBusy] = useState(false);
  const [meldung, setMeldung] = useState<{ text: string; warn?: boolean } | null>(null);
  const [dublette, setDublette] = useState<Topic | undefined>();
  // Neuer Name von außen (z. B. nach dem Umbenennen) übernehmen, aber nie mitten ins Tippen hinein überschreiben.
  const bisher = useRef({ id: topic.id, name: topic.name });
  useEffect(() => {
    const alt = bisher.current;
    bisher.current = { id: topic.id, name: topic.name };
    setName((n) => (alt.id !== topic.id || n.trim() === alt.name || n.trim() === topic.name ? topic.name : n));
  }, [topic.id, topic.name]);
  useEffect(() => { bezuegeVon(topic.id).then(setBezuege).catch(() => undefined); }, [topic.id, topic.name]);
  const dubletten = useMemo(() => findeDubletten(topic, themen), [topic, themen]);
  if (!istEigenesThema(topic.id)) return null;

  const run = async (f: () => Promise<void>) => {
    setBusy(true); setMeldung(null);
    try { await f(); } catch (e) { setMeldung({ text: e instanceof Error ? e.message : String(e), warn: true }); } finally { setBusy(false); }
  };
  const zielName = themen.find((t) => t.id === ziel)?.name;

  return (
    <section className="card thema__abschnitt thema__verwalten" aria-labelledby="thema-verwalten">
      <div className="thema__kopf"><h2 id="thema-verwalten">Eigenes Thema verwalten</h2></div>
      <p className="muted">Verknüpft: {bezuege ? bezuegeText(bezuege) : '…'}. Die ID bleibt beim Umbenennen gleich, alle Verweise bleiben gültig.</p>
      {!!dubletten.length && (
        <div className="note" role="note">
          Mögliche Dublette: {dubletten.map((d) => (
            <button key={d.id} type="button" className="link" onClick={() => setZiel(d.id)}>{d.name}</button>
          ))}. Wähle sie unten als Ziel, um beide zusammenzuführen.
        </div>
      )}

      <form className="thema__zeile" onSubmit={(e) => { e.preventDefault(); void run(async () => {
        const r = await benenneThemaUm(topic.id, name);
        if (r.dublette) { setDublette(r.dublette); setZiel(r.dublette.id); setMeldung({ text: `„${r.dublette.name}“ gibt es schon an derselben Stelle. Unten zusammenführen statt umbenennen.`, warn: true }); }
        else { setDublette(undefined); setMeldung({ text: 'Umbenannt.' }); onGeaendert(); }
      }); }}>
        <label className="field">Name<input value={name} maxLength={140} onChange={(e) => setName(e.target.value)} /></label>
        <button type="submit" className="small" disabled={busy || name.trim() === topic.name || name.trim().length < 4}>Umbenennen</button>
      </form>

      <div className="thema__zeile">
        <ThemaAuswahl label="Zusammenführen mit" themen={themen} fachId={topic.subjectId} ohne={topic.id} wert={ziel} setWert={setZiel} />
        <button type="button" className="small" disabled={busy || !ziel} onClick={() => void run(async () => {
          await fuehreThemenZusammen(topic.id, ziel);
          onGeaendert();
          navigate(`/lernen/thema?id=${enc(ziel)}`);
        })}>Zusammenführen</button>
      </div>
      {ziel && <p className="muted">Alles von „{topic.name}“ geht auf „{zielName ?? dublette?.name}“ über: {bezuege ? bezuegeText(bezuege) : '…'}. Danach ist „{topic.name}“ weg. Dieselbe Abfrage wird nicht doppelt gezählt.</p>}

      <div className="thema__zeile">
        {bezuege && hatVerlauf(bezuege) && (
          <label className="check"><input type="checkbox" checked={verlauf} onChange={(e) => setVerlauf(e.target.checked)} /> Lernverlauf mitlöschen ({bezuege.abfragen} Abfragen, {bezuege.lernzeiten} Lernzeiten)</label>
        )}
        <button type="button" className="small danger" disabled={busy || (!!bezuege && hatVerlauf(bezuege) && !verlauf)} onClick={() => {
          if (!window.confirm(`„${topic.name}“ löschen? Verweise werden entfernt: ${bezuege ? bezuegeText(bezuege) : ''}.`)) return;
          void run(async () => { await loescheThema(topic.id, { verlauf }); onGeaendert(); navigate('/lernen/themen'); });
        }}>Thema löschen</button>
      </div>
      {bezuege && hatVerlauf(bezuege) && !verlauf && <p className="muted">Mit Lernverlauf ist Zusammenführen meist besser: Dann bleibt dein Stand erhalten.</p>}
      {meldung && <p role={meldung.warn ? 'alert' : 'status'} className={meldung.warn ? 'note warn' : 'muted'}>{meldung.text}</p>}
    </section>
  );
}
