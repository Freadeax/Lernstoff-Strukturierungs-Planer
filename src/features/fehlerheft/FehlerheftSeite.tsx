import { useEffect, useMemo, useRef, useState } from 'react';
import './fehlerheft.css';
import { logActivity } from '../../core/activity';
import { pflegeModule } from '../../modules/pflege';
import { bewerte, erzeuge, zahl, type Aufgabe } from '../rechnen/aufgaben';
import { uebungenFuer } from '../lernplan/trainer';
import {
  auswahlRichtig, BEHOBEN_NACH, faellig, heutigerTag, istOffen, ladeFehler, mischeAuswahl, nachThema, QUELLE_LABEL,
  speichereFehler, ueberblick, wiederholt, type Fehler, type FehlerQuelle, type Wiederholung,
} from './fehlerheft';

const SITZUNG_MAX = 10;
const THEMEN = new Map(pflegeModule.topics.map((t) => [t.id, t.name]));
const neuerSeed = () => Math.floor(Math.random() * 2 ** 31);

/** Eine Wiederholungsaufgabe: Rechnen als Zwilling mit neuen Zahlen, Auswahl mit neu gemischten Antworten. */
type Aufgabe2 =
  | { fehler: Fehler; art: 'rechnen'; aufgabe: Aufgabe }
  | { fehler: Fehler; art: 'auswahl'; w: Extract<Wiederholung, { art: 'auswahl' }> };

function baue(f: Fehler): Aufgabe2 {
  const w = f.wiederholung;
  return w.art === 'rechnen'
    ? { fehler: f, art: 'rechnen', aufgabe: erzeuge(w.typ, w.stufe, neuerSeed()) }
    : { fehler: f, art: 'auswahl', w: mischeAuswahl(w) };
}

/** Wo man eine Aufgabe außerhalb des Fehlerhefts weiter üben kann. */
function trainerLink(f: Fehler): { label: string; path: string } | null {
  const w = f.wiederholung;
  if (w.art === 'rechnen') return { label: 'Im Rechentrainer üben', path: `/lernen/rechnen?typen=${w.typ}` };
  // kh:<fallId>:<aufgabeId>
  if (f.quelle === 'krankheitsbilder') return { label: 'Fall noch einmal bearbeiten', path: `/lernen/krankheitsbilder?fall=${encodeURIComponent(f.id.split(':')[1] ?? '')}` };
  // as:<vignettenId>:<itemId>
  if (f.quelle === 'assessment') return { label: 'Fall noch einmal einschätzen', path: `/lernen/assessment?modus=faelle&fall=${encodeURIComponent(f.id.split(':')[1] ?? '')}` };
  const u = f.topicIds.flatMap((t) => uebungenFuer(t)).find((x) => x.trainer !== 'mindmap');
  return u ? { label: u.label, path: u.path } : null;
}

function Punkte({ f }: { f: Fehler }) {
  const n = Math.min(f.treffer.length, BEHOBEN_NACH);
  return <span className="fehlerheft__punkte" aria-label={`${n} von ${BEHOBEN_NACH} richtigen Wiederholungen`}>{'●'.repeat(n)}{'○'.repeat(BEHOBEN_NACH - n)}</span>;
}

function Eintrag({ f, onEntfernen }: { f: Fehler; onEntfernen: () => void }) {
  const link = trainerLink(f);
  const klasse = f.behoben ? 'is-behoben' : f.treffer.length ? 'is-auf-dem-weg' : '';
  return (
    <li className={`fehlerheft__eintrag ${klasse}`}>
      <div className="fehlerheft__zeile">
        <strong>{f.titel}</strong>
        <span className="fehlerheft__meta">{QUELLE_LABEL[f.quelle]} · {f.fehlerAnzahl}× falsch · {f.behoben ? `behoben am ${datum(f.behoben)}` : <Punkte f={f} />}</span>
      </div>
      <details>
        <summary>Letztes Beispiel und Lösung</summary>
        <p>{f.frage}</p>
        <p className="muted">Deine Antwort: {f.deineAntwort}</p>
        <p>Richtig: <strong>{f.loesung}</strong></p>
        {f.erklaerung.length > 0 && <ol className="fehlerheft__weg">{f.erklaerung.map((s, i) => <li key={i}>{s}</li>)}</ol>}
        <div className="row">
          {link && <a className="button" href={`#${link.path}`}>{link.label}</a>}
          <button type="button" className="ghost" onClick={onEntfernen}>Aus dem Fehlerheft entfernen</button>
        </div>
      </details>
    </li>
  );
}

const datum = (t: string) => new Date(`${t}T12:00:00`).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });

function Wiederholen({ aufgaben, onAntwort, onEnde }: {
  aufgaben: Aufgabe2[];
  onAntwort: (f: Fehler, richtig: boolean, eingabe: string) => void;
  onEnde: (richtig: number) => void;
}) {
  const [i, setI] = useState(0);
  const [eingabe, setEingabe] = useState('');
  const [wahl, setWahl] = useState<number[]>([]);
  const [ergebnis, setErgebnis] = useState<boolean | null>(null);
  const [richtig, setRichtig] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const a = aufgaben[i]!;

  useEffect(() => { requestAnimationFrame(() => inputRef.current?.focus()); }, [i]);

  function pruefe() {
    if (ergebnis !== null) {
      if (i + 1 >= aufgaben.length) { onEnde(richtig); return; }
      setI(i + 1); setEingabe(''); setWahl([]); setErgebnis(null);
      return;
    }
    let ok: boolean; let text: string;
    if (a.art === 'rechnen') {
      const b = bewerte(a.aufgabe, eingabe);
      if (b === 'leer') return;
      ok = b === 'richtig' || b === 'gerundet';
      text = `${eingabe} ${a.aufgabe.einheit}`;
    } else {
      if (!wahl.length) return;
      ok = auswahlRichtig(a.w, wahl);
      text = wahl.map((x) => a.w.optionen[x]).join(' · ');
    }
    setErgebnis(ok);
    if (ok) setRichtig((r) => r + 1);
    onAntwort(a.fehler, ok, text);
  }

  const waehle = (x: number) => {
    if (ergebnis !== null || a.art !== 'auswahl') return;
    setWahl((w) => (a.w.mehrfach ? (w.includes(x) ? w.filter((y) => y !== x) : [...w, x]) : [x]));
  };

  return (
    <form className="card fehlerheft__ueben" onSubmit={(e) => { e.preventDefault(); pruefe(); }}>
      <div className="fehlerheft__kopf">
        <span className="badge badge--demo">{a.fehler.titel}</span>
        <span className="muted">Aufgabe {i + 1} von {aufgaben.length} · {richtig} richtig</span>
      </div>
      <div className="rechnen__fortschritt" role="progressbar" aria-valuemin={0} aria-valuemax={aufgaben.length} aria-valuenow={i}>
        <span style={{ width: `${(i / aufgaben.length) * 100}%` }} />
      </div>
      {a.art === 'rechnen' ? (
        <>
          <p className="muted">Zwillingsaufgabe: gleicher Aufgabentyp, neue Zahlen.</p>
          <p className="fehlerheft__frage">{a.aufgabe.frage}</p>
          <label className="fehlerheft__eingabe">
            <span className="visually-hidden">Antwort in {a.aufgabe.einheit}</span>
            <input ref={inputRef} inputMode="decimal" autoComplete="off" enterKeyHint="done" placeholder="Antwort"
              value={eingabe} readOnly={ergebnis !== null} onChange={(e) => setEingabe(e.target.value)} />
            <span className="rechnen__einheit">{a.aufgabe.einheit}</span>
          </label>
        </>
      ) : (
        <>
          <p className="fehlerheft__frage">{a.fehler.frage}</p>
          <fieldset className="fehlerheft__optionen">
            <legend className="visually-hidden">{a.w.mehrfach ? 'Mehrere Antworten möglich' : 'Eine Antwort wählen'}</legend>
            {a.w.mehrfach && <p className="muted">Mehrere Antworten können richtig sein.</p>}
            {a.w.optionen.map((o, x) => {
              const zustand = ergebnis === null ? '' : a.w.richtig.includes(x) ? 'is-richtig' : wahl.includes(x) ? 'is-falsch' : '';
              return (
                <label key={x} className={`fehlerheft__option ${zustand}`}>
                  <input type={a.w.mehrfach ? 'checkbox' : 'radio'} name="fehlerheft-wahl" checked={wahl.includes(x)}
                    disabled={ergebnis !== null} onChange={() => waehle(x)} />
                  <span>{o}</span>
                </label>
              );
            })}
          </fieldset>
        </>
      )}

      {ergebnis !== null && (
        <div className={`note ${ergebnis ? 'ok' : 'warn'}`} role="status">
          <strong>{ergebnis ? 'Richtig!' : 'Noch nicht.'}</strong>
          {ergebnis && (a.fehler.treffer.length + (a.fehler.treffer.includes(heutigerTag()) ? 0 : 1) >= BEHOBEN_NACH
            ? ' Damit ist der Fehler behoben.'
            : ' Klappt es an einem anderen Tag noch einmal, ist der Fehler behoben.')}
          {a.art === 'rechnen'
            ? <ol className="fehlerheft__weg">{a.aufgabe.schritte.map((s, k) => <li key={k}>{s}</li>)}<li>Ergebnis: <strong>{zahl(a.aufgabe.loesung)} {a.aufgabe.einheit}</strong></li></ol>
            : a.fehler.erklaerung.length > 0 && <ol className="fehlerheft__weg">{a.fehler.erklaerung.map((s, k) => <li key={k}>{s}</li>)}</ol>}
        </div>
      )}

      <div className="row">
        <button type="submit" className="primary" disabled={ergebnis === null && (a.art === 'rechnen' ? !eingabe.trim() : !wahl.length)}>
          {ergebnis === null ? 'Prüfen' : i + 1 >= aufgaben.length ? 'Fertig' : 'Weiter'}
        </button>
        {ergebnis === null && <button type="button" className="ghost" onClick={() => onEnde(richtig)}>Beenden</button>}
      </div>
    </form>
  );
}

export default function FehlerheftSeite() {
  const [liste, setListe] = useState<Fehler[]>(ladeFehler);
  const [sitzung, setSitzung] = useState<Aufgabe2[] | null>(null);
  const [fazit, setFazit] = useState<string | null>(null);
  const [quelle, setQuelle] = useState<FehlerQuelle | null>(null);
  const [behobeneZeigen, setBehobeneZeigen] = useState(false);

  // Andere Tabs oder Trainer haben neue Fehler eingetragen
  useEffect(() => {
    const neu = () => setListe(ladeFehler());
    window.addEventListener('fehlerheft', neu);
    window.addEventListener('storage', neu);
    return () => { window.removeEventListener('fehlerheft', neu); window.removeEventListener('storage', neu); };
  }, []);

  const ue = useMemo(() => ueberblick(liste), [liste]);
  const gefiltert = useMemo(() => liste.filter((f) => !quelle || f.quelle === quelle), [liste, quelle]);
  const gruppen = useMemo(() => nachThema(gefiltert), [gefiltert]);
  const behobene = gefiltert.filter((f) => !istOffen(f));

  const aendere = (n: Fehler[]) => { setListe(n); speichereFehler(n); };

  function starte(auchHeutige: boolean) {
    const auswahl = faellig(gefiltert, new Date(), auchHeutige).slice(0, SITZUNG_MAX);
    if (!auswahl.length) return;
    setFazit(null);
    setSitzung(auswahl.map(baue));
  }

  function antwort(f: Fehler, richtig: boolean, eingabe: string) {
    // Immer vom aktuellen Speicher aus, damit parallel eingetragene Fehler nicht verloren gehen
    aendere(wiederholt(ladeFehler(), f.id, richtig, eingabe));
  }

  function ende(richtig: number) {
    const n = sitzung?.length ?? 0;
    const behobenJetzt = ladeFehler().filter((f) => f.behoben && sitzung?.some((a) => a.fehler.id === f.id && !a.fehler.behoben)).length;
    setSitzung(null);
    setListe(ladeFehler());
    setFazit(`${richtig} von ${n} richtig.${behobenJetzt ? ` ${behobenJetzt} ${behobenJetzt === 1 ? 'Fehler ist' : 'Fehler sind'} jetzt behoben.` : ''}`);
    void logActivity({ kind: 'uebung', severity: 'info', title: `Fehlerheft: ${richtig} von ${n} richtig`, detail: behobenJetzt ? `${behobenJetzt} behoben` : undefined });
  }

  const heuteDran = faellig(gefiltert).length;
  const nurHeutige = faellig(gefiltert, new Date(), true).length - heuteDran;

  return (
    <section className="page fehlerheft">
      <div className="page__head">
        <h2>Fehlerheft</h2>
        <p className="muted">
          Falsche Antworten aus Rechentrainer, Fachbegriff-Duell, Prüfungssimulation und Krankheitsbild-Fällen landen automatisch hier.
          Ein Fehler gilt als behoben, wenn du ihn an {BEHOBEN_NACH} verschiedenen Tagen richtig löst. Heute gemachte Fehler kommen ab morgen dran,
          damit du nicht nur die eben gesehene Lösung wiederholst. Das Fehlerheft zählt nicht als Abfrage im Lernplan.
        </p>
      </div>

      <div className="kpi-grid fehlerheft__kpis">
        <div className="kpi"><p className="kpi__label">Offen</p><div className="kpi__value">{ue.offen}</div></div>
        <div className="kpi"><p className="kpi__label">Heute dran</p><div className="kpi__value">{ue.faellig}</div></div>
        <div className="kpi"><p className="kpi__label">Heute neu</p><div className="kpi__value">{ue.heuteNeu}</div></div>
        <div className="kpi"><p className="kpi__label">Behoben</p><div className="kpi__value">{ue.behoben}</div></div>
      </div>

      {sitzung ? (
        <Wiederholen aufgaben={sitzung} onAntwort={antwort} onEnde={ende} />
      ) : (
        <div className="card fehlerheft__start">
          {fazit && <p className="note ok" role="status">{fazit}</p>}
          {liste.length === 0 ? (
            <p className="muted">
              Noch keine Fehler gesammelt. Übe im <a href="#/lernen/rechnen">Rechentrainer</a>, im <a href="#/lernen/duell">Fachbegriff-Duell</a>,
              in der <a href="#/lernen/simulation">Prüfungssimulation</a>, mit den <a href="#/lernen/krankheitsbilder">Krankheitsbild-Fällen</a> oder den <a href="#/lernen/assessment?modus=faelle">Assessment-Fällen</a>: was danebengeht, steht danach hier.
            </p>
          ) : (
            <>
              <div className="pills" role="group" aria-label="Herkunft">
                <button type="button" className="pill" aria-pressed={quelle === null} onClick={() => setQuelle(null)}>Alle</button>
                {(Object.keys(QUELLE_LABEL) as FehlerQuelle[]).map((q) => (
                  <button key={q} type="button" className="pill" aria-pressed={quelle === q} onClick={() => setQuelle(q)}>
                    {QUELLE_LABEL[q]}<span className="pill__count">{ue.nachQuelle[q]}</span>
                  </button>
                ))}
              </div>
              <div className="row">
                {heuteDran > 0
                  ? <button type="button" className="primary" onClick={() => starte(false)}>Wiederholen ({Math.min(heuteDran, SITZUNG_MAX)})</button>
                  : <p className="muted">Für heute ist nichts mehr zur Wiederholung dran.</p>}
                {nurHeutige > 0 && <button type="button" onClick={() => starte(true)}>Heutige Fehler sofort üben ({nurHeutige})</button>}
              </div>
            </>
          )}
        </div>
      )}

      {!sitzung && gruppen.map((g) => {
        const thema = g.topicId ? THEMEN.get(g.topicId) ?? g.topicId : 'Ohne Thema';
        return (
          <div key={g.topicId || 'ohne'} className="card fehlerheft__thema">
            <div className="fehlerheft__thema-kopf">
              <h3>{thema}</h3>
              <span className="muted">{g.fehler.length} offen{g.topicId && <> · <a href={`#/lernen/themen?thema=${encodeURIComponent(g.topicId)}`}>Thema ansehen</a></>}</span>
            </div>
            <ul className="fehlerheft__liste">
              {g.fehler.map((f) => <Eintrag key={f.id} f={f} onEntfernen={() => aendere(ladeFehler().filter((x) => x.id !== f.id))} />)}
            </ul>
          </div>
        );
      })}

      {!sitzung && behobene.length > 0 && (
        <div className="card fehlerheft__thema">
          <div className="fehlerheft__thema-kopf">
            <h3>Behoben</h3>
            <button type="button" className="ghost" onClick={() => setBehobeneZeigen((x) => !x)}>{behobeneZeigen ? 'Ausblenden' : `Zeigen (${behobene.length})`}</button>
          </div>
          {behobeneZeigen && (
            <ul className="fehlerheft__liste">
              {behobene.map((f) => <Eintrag key={f.id} f={f} onEntfernen={() => aendere(ladeFehler().filter((x) => x.id !== f.id))} />)}
            </ul>
          )}
        </div>
      )}

      <p className="muted">Rechenwerte sind fiktive Übungswerte, keine Dosierungsempfehlung.</p>
    </section>
  );
}
