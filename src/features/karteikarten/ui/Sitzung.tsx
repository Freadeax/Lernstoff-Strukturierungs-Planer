import { useEffect, useMemo, useRef, useState } from 'react';
import type { ID, Topic } from '../../../core/types';
import { notify } from '../../../ui/shell/notifications';
import { navigate } from '../../../ui/shell/router';
import { RATING_LABEL } from '../../lernplan/store';
import type { Rating } from '../../lernplan/types';
import { pruefeEingabe, VORSCHLAG, type EingabeErgebnis } from '../erzeugen';
import { gewusstProzent, intervallText, laengsteSerie, vorschau, wiedereinreihen, type ThemenErgebnis } from '../planung';
import { antworte, merkeOffeneSitzung, schliesseOffeneSitzungAb, schliesseSitzungAb, setzeAus, vergissOffeneSitzung } from '../store';
import { QUELLE_LABEL, type Karte, type KartenLog, type KartenStand } from '../typen';
import { spiele } from '../../../ui/audio/spieler';
import { Vorlesen } from '../../../ui/audio/Vorlesen';
import { Ergebnisring } from '../../../ui/Ergebnisring';
import { BegriffListe } from '../../quiz/FachText';

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
          Quelle: {karte.belege.map((b) => (b.documentId.startsWith('skript:') ? `${titles.get(b.documentId) ?? 'Skript'} [${b.printedPage}]` : `${titles.get(b.documentId) ?? 'Dokument'}, S. ${b.printedPage ?? b.page}`)).filter((x, i, a) => a.indexOf(x) === i).join(' · ')}
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
      {karte.quelle === 'krankheitsbild' && (
        <p className="karte__belege muted">
          {karte.belegText ? `Aus deinem Unterrichtsmaterial belegt: ${karte.belegText}.` : 'Katalogwissen, noch nicht gegen dein Unterrichtsmaterial geprüft.'}
        </p>
      )}
      {karte.quelle === 'glossar' || karte.quelle === 'katalog'
        ? <p className="karte__belege muted">Katalogwissen des Fachmoduls. Bei Abweichungen gilt dein Unterrichtsmaterial.</p>
        : null}
      <BegriffListe aufklappbar titel="Fachbegriffe auf dieser Karte" texte={[karte.hinten ?? '', ...(karte.liste ?? [])]} ohne={[karte.vorne, karte.hinten ?? '']} />
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
  /** Unsichere Karten (beim ersten Versuch Vergessen oder Schwer) gleich noch einmal üben. */
  onNochmal?: (karten: Karte[]) => void;
}

/** Eine Lernsitzung: Vorderseite, aufdecken (oder eintippen), bewerten. Vergessene Karten kommen kurz danach noch einmal. */
export function Sitzung({ karten, staende: start, retention, heute, topics, titles, titel, onEnde, onNochmal }: SitzungProps) {
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
  const bewertet = useRef('');
  /** Kennung dieser Sitzung: Ihr Ergebnis wird je Thema nur einmal an den Lernplan gemeldet. */
  const sitzungId = useRef(`karteikarten:sitzung:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`);
  const gesamt = karten.length;
  const fertigeKarten = new Set(antworten.map((a) => a.cardId)).size;
  const karte = queue[0];
  const v = useMemo(() => (karte ? vorschau(staende.get(karte.id)?.reps ? staende.get(karte.id) : undefined, heute, retention) : null), [karte, staende, heute, retention]);
  const vorschlag = geprueft && geprueft !== 'leer' ? VORSCHLAG[geprueft] : undefined;
  // Aktuelle Serie gewusster Karten (Gut oder Leicht hintereinander)
  let serie = 0;
  for (let j = antworten.length - 1; j >= 0 && antworten[j]!.rating >= 3; j--) serie++;

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
      setErgebnis(await schliesseSitzungAb(liste, topics, heute, sitzungId.current));
      if (liste.length) spiele('fertig');
    } catch (e) {
      merkeOffeneSitzung(liste, heute, sitzungId.current);
      notify('critical', 'Ergebnis nicht an den Lernplan übertragen', e instanceof Error ? e.message : String(e));
      setErgebnis([]);
    } finally { setBusy(false); }
  }

  async function bewerte(r: Rating) {
    // Ref statt State: zwei schnelle Klicks im selben Takt dürfen nur eine Antwort buchen
    if (!karte || busy || bewertet.current === `${karte.id}:${antworten.length}`) return;
    bewertet.current = `${karte.id}:${antworten.length}`;
    setBusy(true);
    spiele(r === 1 ? 'falsch' : r === 2 ? 'teilweise' : 'richtig');
    try {
      const s = await antworte(karte, r, retention, heute);
      setStaende((m) => new Map(m).set(karte.id, s));
      const neu = [...antworten, { cardId: karte.id, rating: r, topicIds: karte.topicIds }];
      setAntworten(neu);
      merkeOffeneSitzung(neu, heute, sitzungId.current);
      const rest = queue.slice(1);
      const naechste = r === 1 ? wiedereinreihen(rest, karte) : rest;
      setQueue(naechste);
      setOffen(false); setEingabe(''); setGeprueft(null);
      setBusy(false);
      if (!naechste.length) await beende(neu);
    } catch (e) {
      bewertet.current = '';
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
    spiele('umdrehen');
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
    const prozent = gewusstProzent([...erste.values()]);
    const beste = laengsteSerie(antworten.map((a) => a.rating));
    const unsicher = karten.filter((k) => (erste.get(k.id) ?? 4) <= 2);
    return (
      <div className="card karten__auswertung m-pop" aria-live="polite">
        <div className="karten__ende-kopf">
          <Ergebnisring prozent={prozent} label={`${prozent} Prozent beim ersten Versuch gewusst`} />
          <div>
            <h3>{prozent >= 80 ? 'Stark' : prozent >= 50 ? 'Gut dabei' : 'Dranbleiben lohnt sich'}: {erste.size} {erste.size === 1 ? 'Karte' : 'Karten'}</h3>
            <p className="muted">{prozent} % beim ersten Versuch gewusst{beste >= 3 ? ` · längste Serie ${beste} Karten` : ''}</p>
          </div>
        </div>
        <ul className="karten__verteilung m-stagger">
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
        {unsicher.length > 0 && (
          <details className="karten__unsicher">
            <summary>Noch unsicher: {unsicher.length} {unsicher.length === 1 ? 'Karte' : 'Karten'}</summary>
            <ul>{unsicher.slice(0, 12).map((k) => <li key={k.id}>{k.vorne}</li>)}</ul>
            {unsicher.length > 12 && <p className="muted">und {unsicher.length - 12} weitere</p>}
          </details>
        )}
        <div className="row">
          <button type="button" className="primary" onClick={onEnde}>Fertig</button>
          {onNochmal && unsicher.length > 0 && !busy && <button type="button" onClick={() => onNochmal(unsicher)}>Unsichere noch einmal üben</button>}
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
        {serie >= 3 && <span key={serie} className="badge karten__serie m-pop" aria-label={`${serie} Karten in Folge gewusst`}>{serie}× in Folge</span>}
        <button type="button" className="small ghost" disabled={busy} onClick={() => (antworten.length ? beende() : onEnde())}>Beenden</button>
      </div>
      <div className="rechnen__fortschritt" role="progressbar" aria-valuemin={0} aria-valuemax={gesamt} aria-valuenow={fertigeKarten}>
        <span style={{ width: `${(fertigeKarten / Math.max(1, gesamt)) * 100}%` }} />
      </div>

      <article key={`${karte.id}-${antworten.length}`} className={`card karte m-rise${offen ? ' is-offen' : ''}`} aria-live="polite">
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
            <div className="karte__aufgedeckt"><Rueckseite karte={karte} titles={titles} /></div>
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
          <Vorlesen key={`${karte.id}-${offen}`} label={offen ? 'Karte vorlesen' : 'Frage vorlesen'}
            text={() => [karte.vorne, offen ? karte.hinten ?? '' : '', offen && karte.liste ? karte.liste.join('. ') : ''].filter(Boolean).join('. ')} />
          {offen && <span className="muted karten__tasten">Tasten 1–4</span>}
          {offen && (
            <details className="karten__bewerthilfe">
              <summary>Wie bewerte ich?</summary>
              <ul>
                <li><strong>{RATING_LABEL[1]}:</strong> nicht gewusst oder falsch. Die Karte kommt gleich noch einmal.</li>
                <li><strong>{RATING_LABEL[2]}:</strong> nur teilweise oder mit langem Überlegen.</li>
                <li><strong>{RATING_LABEL[3]}:</strong> richtig gewusst. Der Normalfall.</li>
                <li><strong>{RATING_LABEL[4]}:</strong> sofort und ohne Zweifel.</li>
              </ul>
              <p>Bewerte lieber zu streng als zu gut: Eine zu gute Bewertung schiebt die Karte zu weit nach hinten, und dein Wissensstand wirkt besser, als er ist.</p>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
