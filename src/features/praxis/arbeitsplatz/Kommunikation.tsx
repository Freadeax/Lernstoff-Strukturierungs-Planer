// Praxissimulator neu – Kommunikationsbereich (Paket P11): ersetzt die Reiter „Gespräch“ und „Melden“.
// Links bzw. oben die Gesprächspartner mit Ungelesen-Punkt, rechts bzw. unten der Faden als Chatverlauf.
// Ärztin: Telefon (bleibt offen bis „Auflegen“) oder, nach dem ersten Kontakt, Messenger mit verzögerter Antwort.
// Offene Rückaufträge stehen als Leiste oben, mit Frist und „Melden“ direkt am erledigten Auftrag.
// Nur Anzeige und Eingaben: Antworten, Fristen und Status rechnet der Kern (kern/kommunikation.ts).

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { wenigBewegung } from '../../../ui/shell/session';
import type { SimZustand } from '../kern/kern';
import type { Gegenueber, Kanal, SimEventEingabe } from '../kern/typen';
import { anordnungen, uhrzeit } from './ansicht';
import {
  antwortKommtIn, auftraege, bausteinGruppen, fadenLaenge, fadenMeldungen, partner, rueckfrage, verstehe, type Partner,
} from './gespraeche';
import './kommunikation.css';

export function Kommunikation({ z, eingabe, an, setAn, gelesen, setGelesen, weitere, onAbschluss }: {
  z: SimZustand;
  eingabe: (e: SimEventEingabe) => void;
  an: Gegenueber;
  setAn: (an: Gegenueber) => void;
  gelesen: Partial<Record<Gegenueber, number>>;
  setGelesen: (f: (g: Partial<Record<Gegenueber, number>>) => Partial<Record<Gegenueber, number>>) => void;
  weitere: ReactNode;
  onAbschluss: () => void;
}) {
  const liste = partner(z, gelesen);
  const p = liste.find((x) => x.id === an) ?? liste[0]!;
  const laenge = fadenLaenge(z, p.id);
  // Geöffneter Faden gilt als gelesen
  useEffect(() => { setGelesen((g) => (g[p.id] === laenge ? g : { ...g, [p.id]: laenge })); }, [p.id, laenge, setGelesen]);
  const offen = auftraege(z).filter((a) => a.status !== 'gemeldet');
  const erledigt = auftraege(z).filter((a) => a.status === 'gemeldet');
  const kanalMelden: Kanal = liste.find((x) => x.id === 'aerztin')?.kanaele.includes('messenger') ? 'messenger' : 'telefon';

  return <div className="kom">
    {(offen.length > 0 || erledigt.length > 0) && <section className="kom-auftraege" aria-labelledby="kom-auftraege">
      <h4 id="kom-auftraege">Rückaufträge der Ärztin</h4>
      <ul>
        {offen.map((a) => <li key={a.id} className={`is-${a.status}`}>
          <span className="kom-auftraege__text">{a.text}</span>
          <span className="kom-auftraege__frist">{a.status === 'erledigt' ? 'erledigt · ' : a.status === 'verspaetet' ? '⚠ ' : ''}{a.frist}</span>
          {a.meldbar && <button type="button" className="small primary" onClick={() => { setAn('aerztin'); eingabe({ art: 'nachricht', an: 'aerztin', kanal: kanalMelden, bausteine: a.meldung, auftrag: a.id }); }}>
            {kanalMelden === 'messenger' ? '✉' : '📞'} Melden</button>}
        </li>)}
        {erledigt.map((a) => <li key={a.id} className="is-gemeldet"><span className="kom-auftraege__text">✓ {a.text}</span><span className="kom-auftraege__frist">gemeldet</span></li>)}
      </ul>
    </section>}

    <div className="kom__raster">
      <nav className="kom-partner" aria-label="Gesprächspartner">
        <ul>{liste.map((x) => <li key={x.id}>
          <button type="button" aria-current={x.id === p.id ? 'true' : undefined} onClick={() => setAn(x.id)} className={x.id === p.id ? 'is-aktiv' : ''}>
            <span className={`kom-partner__kuerzel is-${x.id}`} aria-hidden="true">{x.kuerzel}</span>
            <span className="kom-partner__name">{x.name}<small>{x.rolle}{x.telefonOffen ? ' · 📞 am Telefon' : ''}</small></span>
            {x.ungelesen > 0 && x.id !== p.id && <span className="kom-partner__neu"><span aria-hidden="true">{x.ungelesen}</span><span className="visually-hidden">{x.ungelesen} neue Nachricht{x.ungelesen === 1 ? '' : 'en'}</span></span>}
          </button>
        </li>)}</ul>
      </nav>
      <Faden key={p.id} z={z} p={p} eingabe={eingabe} />
    </div>

    {weitere}
    <button type="button" className="ap-abschluss-knopf" onClick={onAbschluss}>Fall abschließen: Pflegebedarf und Übergabe</button>
  </div>;
}

/* ─────────────────────────── Faden ─────────────────────────── */

function Faden({ z, p, eingabe }: { z: SimZustand; p: Partner; eingabe: (e: SimEventEingabe) => void }) {
  const meldungen = fadenMeldungen(z, p.id);
  const chatRef = useRef<HTMLOListElement>(null);
  const kommt = p.id === 'aerztin' ? antwortKommtIn(z) : undefined;
  const rf = p.id === 'aerztin' ? rueckfrage(z) : undefined;
  const start = z.fall.startUhrzeit;
  const fadenRef = useRef<HTMLElement>(null);
  const ersterLauf = useRef(true);
  useEffect(() => {
    const el = chatRef.current;
    const sanft = wenigBewegung() ? 'auto' : 'smooth';
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: sanft });
    // Nach einer neuen Nachricht den Verlauf ins Bild holen (nicht beim ersten Öffnen)
    if (ersterLauf.current) { ersterLauf.current = false; return; }
    fadenRef.current?.scrollIntoView({ block: 'start', behavior: sanft });
  }, [meldungen.length]);

  return <section ref={fadenRef} className="kom-faden" aria-labelledby="kom-faden-titel">
    <header className="kom-faden__kopf">
      <h4 id="kom-faden-titel">{p.name} <small>{p.rolle}</small></h4>
      {p.telefonOffen && <span className="kom-faden__tel">📞 Im Gespräch</span>}
      {p.telefonOffen && <button type="button" className="small" onClick={() => eingabe({ art: 'auflegen', an: p.id })}>Auflegen</button>}
    </header>
    <ol className="kom-chat" ref={chatRef} tabIndex={0} aria-label={`Verlauf mit ${p.name}`}>
      {meldungen.length === 0 && <li className="kom-chat__leer">Noch kein Gespräch.</li>}
      {meldungen.map((m, i) => <li key={i} className={`kom-msg is-${m.richtung ?? 'rein'} is-${m.art}`}>
        <span className="visually-hidden">{m.richtung === 'raus' ? 'Du' : p.name}: </span>
        <p>{m.richtung !== 'raus' && m.text.startsWith(`${p.name}: `) ? m.text.slice(p.name.length + 2) : m.text}</p>
        <time>{uhrzeit(start, m.t)}{m.richtung === 'raus' && m.quelle === 'messenger' ? ' · Messenger' : m.richtung === 'raus' && m.quelle === 'telefon' ? ' · Telefon' : ''}</time>
      </li>)}
      {kommt !== undefined && <li className="kom-msg is-rein is-schreibt"><p>{z.fall.arzt.name} hat die Nachricht gelesen und antwortet {kommt <= 60 ? 'gleich' : `in etwa ${Math.round(kommt / 60)} Min.`} …</p></li>}
    </ol>
    {rf && <p className="kom-rueckfrage" role="note"><strong>Rückfrage:</strong> {rf.text} <span className="muted">Antworte mit dem Messwert oder sag zu, dass du misst und dich meldest.</span></p>}
    {p.id === 'pa' && z.stufe < 3 && <button type="button" className="small" onClick={() => eingabe({ art: 'pa-fragen' })}>Praxisanleitung um einen Hinweis bitten</button>}
    {p.fragen.length > 0 && <ul className="kom-fragen" aria-label={`Was du ${p.name} fragen oder sagen kannst`}>
      {p.fragen.map((g) => {
        const zuletzt = z.getan[`frage:${g.id}`]?.at(-1);
        return <li key={g.id}><button type="button" onClick={() => eingabe({ art: 'frage', id: g.id })}>
          {g.kanal === 'telefon' && <span aria-hidden="true">📞 </span>}{g.frage}{zuletzt !== undefined && <span className="ap-zeile__getan"> ✓ {uhrzeit(start, zuletzt)}</span>}
        </button></li>;
      })}
    </ul>}
    {p.bausteine && <Eingabe z={z} p={p} eingabe={eingabe} />}
    {p.id === 'aerztin' && <Anordnungen z={z} eingabe={eingabe} />}
  </section>;
}

/* ─────────────────────────── Bausteine + Freitext ─────────────────────────── */

function Eingabe({ z, p, eingabe }: { z: SimZustand; p: Partner; eingabe: (e: SimEventEingabe) => void }) {
  const [wahl, setWahl] = useState<string[]>([]);
  const [frei, setFrei] = useState('');
  const gruppen = bausteinGruppen(z, p.id);
  const angebot = useMemo(() => gruppen.flatMap((g) => g.liste), [gruppen]);
  const verstanden = useMemo(() => verstehe(frei, angebot).filter((id) => !wahl.includes(id)), [frei, angebot, wahl]);
  const text = (id: string) => angebot.find((b) => b.id === id)?.text ?? id;
  const umschalten = (id: string) => setWahl((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]));
  const leer = !wahl.length && !verstanden.length && !frei.trim();
  const sende = (kanal: Kanal) => {
    eingabe({ art: 'nachricht', an: p.id, kanal, bausteine: [...wahl, ...verstanden], ...(frei.trim() ? { freitext: frei.trim() } : {}) });
    setWahl([]); setFrei('');
  };
  const uebergabe = p.id !== 'aerztin';
  const titel = uebergabe ? `Übergabe an ${p.name}` : p.telefonOffen ? 'Am Telefon weitersprechen' : p.kanaele.includes('messenger') ? 'Nachricht oder Anruf' : 'Anrufen: SBAR zusammenstellen';
  return <div className="ap-sbar kom-eingabe">
    <h5>{titel}</h5>
    <p className="muted">{uebergabe ? 'Wähle, was du übergibst.' : 'Wähle, was du sagst. Die Ärztin reagiert nur auf das, was du meldest. Messwerte erscheinen erst, wenn du sie erhoben hast.'}</p>
    {gruppen.map((g) => {
      const n = g.liste.filter((b) => wahl.includes(b.id)).length;
      return <details key={g.teil} className={`kom-gruppe is-${g.teil}`} open>
        <summary><b>{g.teil === 'W' ? '№' : g.teil === 'Z' ? '↩' : g.teil}</b> {g.titel} <span className="muted">· {g.frage}{n ? ` · ${n} gewählt` : ''}</span></summary>
        <div role="group" aria-label={g.titel}>
          {g.liste.map((b) => <label key={b.id}><input type="checkbox" checked={wahl.includes(b.id)} onChange={() => umschalten(b.id)} /> {b.text}</label>)}
        </div>
      </details>;
    })}
    <label className="kom-frei" htmlFor={`kom-frei-${p.id}`}>Eigene Worte (optional)</label>
    <textarea id={`kom-frei-${p.id}`} rows={2} value={frei} onChange={(e) => setFrei(e.target.value)} placeholder="z. B. „Der Zucker liegt bei 128.“" />
    {frei.trim() && <p className="kom-verstanden" aria-live="polite">{verstanden.length
      ? <>Verstanden als: {verstanden.map((id) => <span key={id} className="kom-chip">{text(id)}</span>)}</>
      : <span className="muted">Ohne KI erkenne ich darin keinen Baustein. Der Text wird trotzdem mitgeschickt.</span>}</p>}
    <div className="kom-senden">
      {p.kanaele.includes('telefon') && <button type="button" className={p.kanaele.includes('messenger') ? '' : 'primary'} disabled={leer} onClick={() => sende('telefon')}>
        📞 {p.telefonOffen ? 'Sagen' : uebergabe ? 'Übergeben' : `${z.fall.arzt.name} anrufen`}</button>}
      {p.kanaele.includes('messenger') && <button type="button" className="primary" disabled={leer} onClick={() => sende('messenger')}>✉ Per Messenger senden</button>}
    </div>
    {!uebergabe && p.kanaele.includes('messenger') && <p className="muted kom-hinweis">Messenger: Die Antwort kommt nach einer Weile, die Zeit läuft weiter. Für Dringendes anrufen.</p>}
  </div>;
}

/* ─────────────────────────── Anordnungen im Arzt-Faden ─────────────────────────── */

function Anordnungen({ z, eingabe }: { z: SimZustand; eingabe: (e: SimEventEingabe) => void }) {
  const liste = anordnungen(z);
  if (!liste.length) return null;
  return <section className="ap-anordnungen" aria-labelledby="ap-anordnungen">
    <h4 id="ap-anordnungen">Anordnungen</h4>
    <ul>{liste.map((a) => <li key={a.id} className={`is-${a.stand}`}>
      <p>{a.text}{a.plan && <span className="muted"> (Medikamentenplan)</span>}</p>
      {a.stand === 'angeboten' ? <div className="ap-anordnungen__knoepfe">
        <button type="button" className="small primary" onClick={() => eingabe({ art: 'rueckmelden', anordnung: a.id, rueckgelesen: true })}>Rücklesen und bestätigen</button>
        <button type="button" className="small" onClick={() => eingabe({ art: 'rueckmelden', anordnung: a.id, rueckgelesen: false })}>Ohne Rücklesen übernehmen</button>
        <button type="button" className="small" onClick={() => eingabe({ art: 'remonstrieren', anordnung: a.id })}>Hinterfragen (remonstrieren)</button>
      </div> : <p className="ap-anordnungen__stand">{a.stand === 'rueckgelesen' ? '✓ rückgelesen' : a.stand === 'uebernommen' ? 'übernommen, nicht rückgelesen' : 'zurückgezogen'}
        {!a.plan && a.stand !== 'zurueckgezogen' && <button type="button" className="small ghost" onClick={() => eingabe({ art: 'remonstrieren', anordnung: a.id })}>Hinterfragen</button>}</p>}
    </li>)}</ul>
  </section>;
}
