import { useMemo, useState, type ReactNode } from 'react';
import './quiz.css';
import {
  alsFehler, alsTreffer, bewerte, startFolge,
  type Antwort, type Aufgabe, type AuswahlAufgabe, type BeschriftenAufgabe, type Bewertung, type ReihenfolgeAufgabe,
} from './quiz';
import { notiereFehler, type FehlerQuelle } from '../fehlerheft/fehlerheft';
import { proThema, type TrainerId } from '../lernplan/trainer';
import { LernplanHinweis, useLernplanUebernahme } from '../lernplan/ui/LernplanHinweis';

/** Eine Abbildung zum Beschriften: Zeichnung ohne Nummern, die Marken legt die Runde darüber. */
export interface Figur { viewBox: string; beschreibung: string; zeichnung: ReactNode }

export interface RundenErgebnis { punkte: number; max: number; prozent: number; richtig: number; anzahl: number }

interface Props {
  aufgaben: Aufgabe[];
  quelle: FehlerQuelle;
  trainer: TrainerId;
  figuren?: Record<string, Figur>;
  /** Ab so vielen Aufgaben je Thema zählt die Runde im Lernplan. */
  minProThema?: number;
  onFertig?: (e: RundenErgebnis) => void;
  onNeu: () => void;
  onEnde: () => void;
}

// ---------------------------------------------------------------- Auswahl

function Auswahl({ a, wahl, setWahl, b }: { a: AuswahlAufgabe; wahl: number[]; setWahl: (w: number[]) => void; b: Bewertung | null }) {
  return (
    <fieldset className="qz__optionen" disabled={!!b}>
      <legend className="visually-hidden">{a.mehrfach ? 'Alle zutreffenden Antworten wählen' : 'Eine Antwort wählen'}</legend>
      {a.optionen.map((o, i) => {
        const an = wahl.includes(i);
        const status = b ? (a.richtig.includes(i) ? ' is-ok' : an ? ' is-falsch' : '') : '';
        return (
          <label key={o} className={`qz__option${an ? ' is-gewaehlt' : ''}${status}`}>
            <input
              type={a.mehrfach ? 'checkbox' : 'radio'} name={`qz-${a.id}`} checked={an}
              onChange={() => setWahl(a.mehrfach ? (an ? wahl.filter((x) => x !== i) : [...wahl, i]) : [i])}
            />
            <span>{o}</span>
            {b && a.richtig.includes(i) && <span className="qz__marke-text">richtig</span>}
          </label>
        );
      })}
    </fieldset>
  );
}

// ---------------------------------------------------------------- Reihenfolge

function Reihenfolge({ a, folge, setFolge, b }: { a: ReihenfolgeAufgabe; folge: string[]; setFolge: (f: string[]) => void; b: Bewertung | null }) {
  function schiebe(i: number, d: -1 | 1) {
    const j = i + d;
    if (j < 0 || j >= folge.length) return;
    const n = [...folge];
    [n[i], n[j]] = [n[j]!, n[i]!];
    setFolge(n);
  }
  return (
    <ol className="qz__folge">
      {folge.map((s, i) => {
        const status = b ? (s === a.schritte[i] ? ' is-ok' : ' is-falsch') : '';
        return (
          <li key={s} className={`qz__schritt${status}`}>
            <span className="qz__nr" aria-hidden="true">{i + 1}</span>
            <span className="qz__schritt-text">
              {s}
              {b && s !== a.schritte[i] && <span className="muted qz__soll"> Richtig an Stelle {i + 1}: {a.schritte[i]}</span>}
            </span>
            {!b && (
              <span className="qz__pfeile">
                <button type="button" className="ghost small" disabled={i === 0} aria-label={`„${s}“ nach oben`} onClick={() => schiebe(i, -1)}>↑</button>
                <button type="button" className="ghost small" disabled={i === folge.length - 1} aria-label={`„${s}“ nach unten`} onClick={() => schiebe(i, 1)}>↓</button>
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

// ---------------------------------------------------------------- Beschriften

function Beschriften({ a, figur, zu, setZu, b }: {
  a: BeschriftenAufgabe; figur: Figur | undefined; zu: Record<number, string>; setZu: (z: Record<number, string>) => void; b: Bewertung | null;
}) {
  const [aktiv, setAktiv] = useState<number | null>(null);
  const labels = useMemo(() => [...a.marken.map((m) => m.label)].sort((x, y) => x.localeCompare(y, 'de')), [a]);
  const vergeben = new Set(Object.values(zu));
  return (
    <div className="qz__beschriften">
      {figur && (
        <svg className="qz__figur" viewBox={figur.viewBox} role="img" aria-label={figur.beschreibung}>
          {figur.zeichnung}
          {a.marken.map((m, k) => {
            const status = b ? (b.teile[k] ? 'ok' : 'falsch') : zu[m.nr] ? 'belegt' : 'offen';
            return (
              <g key={m.nr} className={`qz__pin qz__pin--${status}${aktiv === m.nr ? ' is-aktiv' : ''}`}>
                <circle cx={m.x} cy={m.y} r={9} />
                <text x={m.x} y={m.y} dy="0.35em" textAnchor="middle">{m.nr}</text>
              </g>
            );
          })}
        </svg>
      )}
      <ul className="qz__zuordnung">
        {a.marken.map((m, k) => (
          <li key={m.nr} className={b ? (b.teile[k] ? 'is-ok' : 'is-falsch') : ''}>
            <label onFocus={() => setAktiv(m.nr)} onBlur={() => setAktiv(null)}>
              <span className="qz__nr">{m.nr}</span>
              <select value={zu[m.nr] ?? ''} disabled={!!b} onChange={(e) => setZu({ ...zu, [m.nr]: e.target.value })} aria-label={`Nummer ${m.nr}`}>
                <option value="">– wählen –</option>
                {labels.map((l) => <option key={l} value={l}>{l}{vergeben.has(l) && zu[m.nr] !== l ? ' (vergeben)' : ''}</option>)}
              </select>
            </label>
            {b && !b.teile[k] && <span className="muted qz__soll">Richtig: {m.label}. {m.hinweis}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------- Runde

function leereAntwort(a: Aufgabe): Antwort {
  if (a.art === 'auswahl') return { art: 'auswahl', wahl: [] };
  if (a.art === 'reihenfolge') return { art: 'reihenfolge', folge: startFolge(a.schritte) };
  return { art: 'beschriften', zuordnung: {} };
}

function vollstaendig(a: Aufgabe, x: Antwort): boolean {
  if (x.art === 'auswahl') return x.wahl.length > 0;
  if (x.art === 'reihenfolge') return true;
  return a.art === 'beschriften' && a.marken.every((m) => !!x.zuordnung[m.nr]);
}

const ART_HINWEIS: Record<Aufgabe['art'], string> = {
  auswahl: '',
  reihenfolge: 'Mit den Pfeilen in die richtige Reihenfolge bringen.',
  beschriften: 'Jeder Nummer eine Bezeichnung zuordnen.',
};

export function Runde({ aufgaben, quelle, trainer, figuren = {}, minProThema = 3, onFertig, onNeu, onEnde }: Props) {
  const [i, setI] = useState(0);
  const [antwort, setAntwort] = useState<Antwort>(() => leereAntwort(aufgaben[0]!));
  const [ergebnisse, setErgebnisse] = useState<Array<{ a: Aufgabe; b: Bewertung }>>([]);
  const [geprueft, setGeprueft] = useState<Bewertung | null>(null);
  const lernplan = useLernplanUebernahme(trainer);
  const a = aufgaben[i];
  const fertig = ergebnisse.length === aufgaben.length && !geprueft;

  function pruefen() {
    if (!a) return;
    const b = bewerte(a, antwort);
    setGeprueft(b);
    setErgebnisse((e) => [...e, { a, b }]);
    const fehler = alsFehler(a, antwort, quelle);
    if (fehler.length) notiereFehler(fehler);
  }

  function weiter() {
    setGeprueft(null);
    const naechste = aufgaben[i + 1];
    if (naechste) { setAntwort(leereAntwort(naechste)); setI(i + 1); return; }
    const punkte = ergebnisse.reduce((s, e) => s + e.b.punkte / e.b.max, 0);
    const prozent = Math.round((punkte / Math.max(1, ergebnisse.length)) * 100);
    onFertig?.({ punkte: ergebnisse.reduce((s, e) => s + e.b.punkte, 0), max: ergebnisse.reduce((s, e) => s + e.b.max, 0), prozent, richtig: ergebnisse.filter((e) => e.b.richtig).length, anzahl: ergebnisse.length });
    lernplan.uebernimm(proThema(ergebnisse.map((e) => alsTreffer(e.a, e.b)), minProThema));
  }

  if (fertig) {
    const prozent = Math.round((ergebnisse.reduce((s, e) => s + e.b.punkte / e.b.max, 0) / ergebnisse.length) * 100);
    const falsch = ergebnisse.filter((e) => !e.b.richtig);
    return (
      <div className="card qz__ende" aria-live="polite">
        <h3>{prozent} % richtig</h3>
        <p className="muted">{ergebnisse.length - falsch.length} von {ergebnisse.length} Aufgaben ganz richtig. Teilpunkte zählen anteilig.</p>
        {falsch.length > 0 && (
          <>
            <h4>Noch einmal ansehen</h4>
            <ul className="qz__falsch">
              {falsch.map((e) => <li key={e.a.id}><strong>{e.a.titel}:</strong> {e.a.frage} <span className="muted">({e.b.punkte} von {e.b.max})</span></li>)}
            </ul>
            <p className="muted">Die Fehler stehen im <a href="#/lernen/fehler">Fehlerheft</a> und kommen dort wieder.</p>
          </>
        )}
        <LernplanHinweis uebernahme={lernplan.uebernahme} fehler={lernplan.fehler} leer={`Für den Lernplan braucht es mindestens ${minProThema} Aufgaben je Thema.`} />
        <div className="row">
          <button type="button" className="primary" onClick={onNeu}>Neue Runde</button>
          <button type="button" onClick={onEnde}>Zur Auswahl</button>
        </div>
      </div>
    );
  }
  if (!a) return null;

  const bereit = vollstaendig(a, antwort);
  return (
    <div className="card qz__aufgabe">
      <div className="qz__kopf">
        <span className="badge badge--demo">{a.titel}</span>
        <span className="muted" aria-live="polite">Aufgabe {i + 1} von {aufgaben.length}</span>
      </div>
      <progress className="qz__fortschritt" max={aufgaben.length} value={i + (geprueft ? 1 : 0)} aria-label="Fortschritt der Runde" />
      <h3 className="qz__frage">{a.frage}</h3>
      {(a.art !== 'auswahl' || a.mehrfach) && <p className="muted">{a.art === 'auswahl' ? 'Mehrere Antworten können stimmen.' : ART_HINWEIS[a.art]}</p>}

      {a.art === 'auswahl' && antwort.art === 'auswahl' && (
        <Auswahl a={a} wahl={antwort.wahl} setWahl={(wahl) => setAntwort({ art: 'auswahl', wahl })} b={geprueft} />
      )}
      {a.art === 'reihenfolge' && antwort.art === 'reihenfolge' && (
        <Reihenfolge a={a} folge={antwort.folge} setFolge={(folge) => setAntwort({ art: 'reihenfolge', folge })} b={geprueft} />
      )}
      {a.art === 'beschriften' && antwort.art === 'beschriften' && (
        <Beschriften a={a} figur={figuren[a.figur]} zu={antwort.zuordnung} setZu={(zuordnung) => setAntwort({ art: 'beschriften', zuordnung })} b={geprueft} />
      )}

      {geprueft ? (
        <>
          <div className={`note ${geprueft.richtig ? 'ok' : 'warn'}`} role="status">
            <strong>{geprueft.richtig ? 'Richtig.' : geprueft.punkte > 0 ? `Teilweise richtig: ${geprueft.punkte} von ${geprueft.max}.` : 'Leider falsch.'}</strong>
            <ul className="qz__erklaerung">{a.erklaerung.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
          <div className="row">
            <button type="button" className="primary" onClick={weiter}>{i + 1 < aufgaben.length ? 'Weiter' : 'Auswertung'}</button>
          </div>
        </>
      ) : (
        <div className="row">
          <button type="button" className="primary" disabled={!bereit} onClick={pruefen}>Prüfen</button>
          <button type="button" className="ghost" onClick={onEnde}>Abbrechen</button>
        </div>
      )}
    </div>
  );
}
