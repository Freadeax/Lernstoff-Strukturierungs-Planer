import { useEffect, useMemo, useRef, useState } from 'react';
import type { ID, Topic } from '../../../core/types';
import { notify } from '../../../ui/shell/notifications';
import { navigate } from '../../../ui/shell/router';
import { RATING_LABEL } from '../../lernplan/store';
import type { Rating } from '../../lernplan/types';
import { pruefeEingabe, VORSCHLAG, type EingabeErgebnis } from '../erzeugen';
import { intervallText, vorschau, wiedereinreihen, type ThemenErgebnis } from '../planung';
import { antworte, merkeOffeneSitzung, schliesseOffeneSitzungAb, schliesseSitzungAb, setzeAus, vergissOffeneSitzung } from '../store';
import { QUELLE_LABEL, type Karte, type KartenLog, type KartenStand } from '../typen';

type Antwort = Pick<KartenLog, 'cardId' | 'rating' | 'topicIds'>;

const EINGABE_TEXT: Record<Exclude<EingabeErgebnis, 'leer'>, string> = {
  richtig: 'Richtig!',
  tippfehler: 'Fast: ein kleiner Tippfehler. Achte auf die Schreibweise.',
  falsch: 'Leider nicht.',
};

export function Rueckseite({ karte, titles }: { karte: Karte; titles: Map<ID, string> }) {
  return (
    <div className="karte__hinten">
      {karte.hinten && <p className="karte__text">{karte.hinten}</p>}
      {karte.liste && <ul className="karte__liste">{karte.liste.map((x, i) => <li key={i}>{x}</li>)}</ul>}
      {!!karte.belege?.length && (
        <p className="karte__belege muted">
          Quelle: {karte.belege.map((b) => `${titles.get(b.documentId) ?? 'Dokument'}, S. ${b.printedPage ?? b.page}`).filter((x, i, a) => a.indexOf(x) === i).join(' · ')}
        </p>
      )}
      {!!karte.quellen?.length && (
        <p className="karte__belege muted">
          Quelle: {karte.quellen.map((q, i) => <span key={q.url}>{i > 0 && ' · '}<a href={q.url} target="_blank" rel="noopener noreferrer">{q.title}</a></span>)}
        </p>
      )}
      {karte.quelle === 'arzneimittel' && (
        <p className="karte__belege muted">
          {karte.ungeprueft ? 'Noch ungeprüft. ' : ''}Lernhilfe, keine Dosierungsanweisung: Es gelten ärztliche Anordnung, Fachinformation und dein Unterrichtsmaterial.
        </p>
      )}
      {karte.quelle === 'glossar' || karte.quelle === 'katalog'
        ? <p className="karte__belege muted">Katalogwissen des Fachmoduls. Bei Abweichungen gilt dein Unterrichtsmaterial.</p>
        : null}
    </div>
  );
}

export interface SitzungProps {
  karten: Karte[];
  staende: Map<ID, KartenStand>;
  retention: number;
  heute: string;
  topics: Map<ID, Topic>;
  titles: Map<ID, string>;
  /** Name des Themas, wenn die Sitzung aus dem Lernplan für ein Thema gestartet wurde. */
  titel?: string;
  onEnde: () => void;
}

/** Eine Lernsitzung: Vorderseite, aufdecken (oder eintippen), bewerten. Vergessene Karten kommen kurz danach noch einmal. */
export function Sitzung({ karten, staende: start, retention, heute, topics, titles, titel, onEnde }: SitzungProps) {
  const [queue, setQueue] = useState(karten);
  const [staende, setStaende] = useState(start);
  const [offen, setOffen] = useState(false);
  const [eingabe, setEingabe] = useState('');
  const [geprueft, setGeprueft] = useState<EingabeErgebnis | null>(null);
  const [antworten, setAntworten] = useState<Antwort[]>([]);
  const [ergebnis, setErgebnis] = useState<ThemenErgebnis[] | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const aufdeckenRef = useRef<HTMLButtonElement>(null);
  const abgeschlossen = useRef(false);
  const gesamt = karten.length;
  const fertigeKarten = new Set(antworten.map((a) => a.cardId)).size;
  const karte = queue[0];
  const v = useMemo(() => (karte ? vorschau(staende.get(karte.id)?.reps ? staende.get(karte.id) : undefined, heute, retention) : null), [karte, staende, heute, retention]);
  const vorschlag = geprueft && geprueft !== 'leer' ? VORSCHLAG[geprueft] : undefined;

  useEffect(() => {
    if (!karte) return;
    if (karte.eingabe) inputRef.current?.focus();
    else aufdeckenRef.current?.focus({ preventScroll: true });
  }, [karte?.id, queue.length]);

  // Verlassen ohne Abschluss (Menü, Zurück, anderer Tab): Ergebnis trotzdem an den Lernplan
  useEffect(() => () => {
    if (abgeschlossen.current) return;
    schliesseOffeneSitzungAb(topics)
      .then((e) => { if (e?.length) notify('info', 'Karteikarten-Sitzung beendet', `${e.length} ${e.length === 1 ? 'Thema' : 'Themen'} an den Lernplan gemeldet.`); })
      .catch((e) => notify('warning', 'Ergebnis noch nicht im Lernplan', `Wird beim nächsten Öffnen der Karteikarten nachgeholt. ${e instanceof Error ? e.message : ''}`));
  }, []);

  async function beende(liste = antworten) {
    if (ergebnis || abgeschlossen.current) return;
    abgeschlossen.current = true;
    vergissOffeneSitzung();
    setBusy(true);
    try {
      setErgebnis(await schliesseSitzungAb(liste, topics, heute));
    } catch (e) {
      merkeOffeneSitzung(liste, heute);
      notify('critical', 'Ergebnis nicht an den Lernplan übertragen', e instanceof Error ? e.message : String(e));
      setErgebnis([]);
    } finally { setBusy(false); }
  }

  async function bewerte(r: Rating) {
    if (!karte || busy) return;
    setBusy(true);
    try {
      const s = await antworte(karte, r, retention, heute);
      setStaende((m) => new Map(m).set(karte.id, s));
      const neu = [...antworten, { cardId: karte.id, rating: r, topicIds: karte.topicIds }];
      setAntworten(neu);
      merkeOffeneSitzung(neu, heute);
      const rest = queue.slice(1);
      const naechste = r === 1 ? wiedereinreihen(rest, karte) : rest;
      setQueue(naechste);
      setOffen(false); setEingabe(''); setGeprueft(null);
      setBusy(false);
      if (!naechste.length) await beende(neu);
    } catch (e) {
      setBusy(false);
      notify('critical', 'Antwort nicht gespeichert', e instanceof Error ? e.message : String(e));
    }
  }

  async function aussetzen() {
    if (!karte) return;
    await setzeAus(karte.id, true);
    notify('info', 'Karte ausgesetzt', 'Unter „Statistik“ kannst du sie wieder aufnehmen.');
    const rest = queue.filter((k) => k.id !== karte.id);
    setQueue(rest); setOffen(false); setEingabe(''); setGeprueft(null);
    if (!rest.length) await beende();
  }

  function aufdecken() {
    if (karte?.eingabe && !geprueft) {
      const g = pruefeEingabe(eingabe, karte);
      setGeprueft(g === 'leer' ? 'falsch' : g);
    }
    setOffen(true);
  }

  // Tastatur (iPad mit Tastatur, Rechner): Leertaste/Enter deckt auf, 1–4 bewertet
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (ergebnis || !karte || e.metaKey || e.ctrlKey || e.altKey) return;
      const tippt = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      if (offen && ['1', '2', '3', '4'].includes(e.key) && !tippt) { e.preventDefault(); void bewerte(Number(e.key) as Rating); }
      else if (!offen && !tippt && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); aufdecken(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (ergebnis || (!karte && antworten.length)) {
    const erste = new Map<ID, Rating>();
    for (const a of antworten) if (!erste.has(a.cardId)) erste.set(a.cardId, a.rating);
    const zaehl = [1, 2, 3, 4].map((r) => [...erste.values()].filter((x) => x === r).length);
    return (
      <div className="card karten__auswertung" aria-live="polite">
        <h3>Geschafft: {erste.size} {erste.size === 1 ? 'Karte' : 'Karten'}</h3>
        <ul className="karten__verteilung">
          {([1, 2, 3, 4] as Rating[]).map((r) => <li key={r} className={`bew--${r}`}><strong>{zaehl[r - 1]}</strong> {RATING_LABEL[r]}</li>)}
        </ul>
        {busy && <p className="muted">Ergebnis wird an den Lernplan übertragen …</p>}
        {ergebnis && ergebnis.length > 0 && (
          <>
            <p>An den Lernplan gemeldet (als Abfrage mit Karteikarten):</p>
            <ul className="karten__themen">
              {ergebnis.map((e) => <li key={e.topicId}><span>{topics.get(e.topicId)?.name ?? e.topicId}</span><span className="muted">{e.karten} Karten, {e.scorePercent} %</span></li>)}
            </ul>
          </>
        )}
        {ergebnis && !ergebnis.length && <p className="muted">Für den Lernplan zählt ein Thema ab drei Karten in einer Sitzung. Diesmal war kein Thema so oft dabei.</p>}
        <div className="row">
          <button type="button" className="primary" onClick={onEnde}>Fertig</button>
          {ergebnis && ergebnis.length > 0 && <button type="button" onClick={() => navigate('/lernen/plan')}>Zum Lernplan</button>}
        </div>
      </div>
    );
  }
  if (!karte) return null;
  const thema = karte.topicIds.map((t) => topics.get(t)?.name).find(Boolean);

  return (
    <div className="karten__sitzung">
      <div className="karten__kopf">
        <span className="muted">{titel ? `${titel} · ` : ''}{Math.min(fertigeKarten + 1, gesamt)} von {gesamt}{queue.length > gesamt - fertigeKarten ? ` · ${queue.length - (gesamt - fertigeKarten)} zur Wiederholung` : ''}</span>
        <button type="button" className="small ghost" disabled={busy} onClick={() => (antworten.length ? beende() : onEnde())}>Beenden</button>
      </div>
      <div className="rechnen__fortschritt" role="progressbar" aria-valuemin={0} aria-valuemax={gesamt} aria-valuenow={fertigeKarten}>
        <span style={{ width: `${(fertigeKarten / Math.max(1, gesamt)) * 100}%` }} />
      </div>

      <article className={`card karte${offen ? ' is-offen' : ''}`} aria-live="polite">
        <div className="karte__meta">
          <span className="badge badge--demo">{QUELLE_LABEL[karte.quelle]}</span>
          <span className="muted">{karte.art}{thema ? ` · ${thema}` : ''}</span>
          {!staende.get(karte.id)?.reps && <span className="badge karte__neu">neu</span>}
        </div>
        <p className="karte__vorne">{karte.vorne}</p>

        {karte.eingabe && (
          <form className="karte__eingabe" onSubmit={(e) => { e.preventDefault(); if (!offen) aufdecken(); }}>
            <label className="visually-hidden" htmlFor="karte-eingabe">Deine Antwort</label>
            <input id="karte-eingabe" ref={inputRef} autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false} enterKeyHint="done"
              placeholder="Fachbegriff eintippen" value={eingabe} readOnly={offen} onChange={(e) => setEingabe(e.target.value)} />
          </form>
        )}

        {offen && (
          <>
            {geprueft && geprueft !== 'leer' && (
              <p className={`note ${geprueft === 'richtig' ? 'ok' : 'warn'}`} role="status"><strong>{EINGABE_TEXT[geprueft]}</strong>{eingabe.trim() ? '' : ' (keine Eingabe)'}</p>
            )}
            <Rueckseite karte={karte} titles={titles} />
          </>
        )}
      </article>

      <div className="karten__aktionen">
        {!offen ? (
          <button ref={aufdeckenRef} type="button" className="primary karten__aufdecken" onClick={aufdecken}>
            {karte.eingabe ? (eingabe.trim() ? 'Prüfen' : 'Weiß nicht, Antwort zeigen') : 'Antwort zeigen'}
          </button>
        ) : (
          <div className="karten__bewertung" role="group" aria-label="Wie gut wusstest du es?">
            {([1, 2, 3, 4] as Rating[]).map((r) => (
              <button key={r} type="button" disabled={busy}
                className={`bew bew--${r}${vorschlag === r ? ' is-vorschlag' : ''}`} onClick={() => bewerte(r)}
                aria-keyshortcuts={String(r)}>
                <span>{RATING_LABEL[r]}</span>
                <small>{r === 1 ? 'gleich noch mal' : v ? intervallText(v[r]) : ''}</small>
              </button>
            ))}
          </div>
        )}
        <div className="karten__nebenaktionen">
          <button type="button" className="small ghost" onClick={aussetzen} disabled={busy}>Karte aussetzen</button>
          {offen && <span className="muted karten__tasten">Tasten 1–4</span>}
        </div>
      </div>
    </div>
  );
}
