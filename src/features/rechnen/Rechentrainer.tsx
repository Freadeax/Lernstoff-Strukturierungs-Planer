import { useEffect, useMemo, useRef, useState } from 'react';
import './rechnen.css';
import { logActivity } from '../../core/activity';
import {
  bewerte, naechste, TYP_LABEL, TYPEN, zahl,
  type Aufgabe, type AufgabenTyp, type Bewertung, type Stufe,
} from './aufgaben';
import { ladeStatistik, quote, schwaechen, zaehle, type Statistik } from './statistik';
import { proThema } from '../lernplan/trainer';
import { LernplanHinweis, useLernplanUebernahme } from '../lernplan/ui/LernplanHinweis';

type Modus = 'training' | 'pruefung';
const PRUEFUNG_LAENGE = 10;
const STUFEN: { stufe: Stufe; label: string }[] = [
  { stufe: 1, label: 'Einstieg' }, { stufe: 2, label: 'Station' }, { stufe: 3, label: 'Profi' },
];
const ALLE = TYPEN.map((t) => t.typ);

const neuerSeed = () => Math.floor(Math.random() * 2 ** 31);
const ok = (b: Bewertung) => b === 'richtig' || b === 'gerundet';
const THEMA = Object.fromEntries(TYPEN.map((t) => [t.typ, t.thema])) as Record<AufgabenTyp, string>;
/** Mindestens so viele Aufgaben eines Themas in der Prüfungsrunde, bevor sie im Lernplan zählt. */
const MIN_PRO_THEMA = 3;

interface Ergebnis { aufgabe: Aufgabe; eingabe: string; bewertung: Bewertung }

function Loesungsweg({ a }: { a: Aufgabe }) {
  return (
    <ol className="rechnen__weg">
      {a.schritte.map((s, i) => <li key={i}>{s}</li>)}
      <li className="rechnen__loesung">Ergebnis: <strong>{zahl(a.loesung)} {a.einheit}</strong></li>
    </ol>
  );
}

const MELDUNG: Record<Bewertung, string> = {
  richtig: 'Richtig!',
  gerundet: 'Richtig (im Rahmen der Rundung).',
  falsch: 'Leider nicht.',
  leer: 'Bitte eine Zahl eingeben.',
};

export default function Rechentrainer() {
  const [typen, setTypen] = useState<AufgabenTyp[]>(ALLE);
  const [stufe, setStufe] = useState<Stufe>(1);
  const [modus, setModus] = useState<Modus>('training');
  const [aufgabe, setAufgabe] = useState(() => naechste(ALLE, 1, neuerSeed()));
  const [eingabe, setEingabe] = useState('');
  const [bewertung, setBewertung] = useState<Bewertung | null>(null);
  const [tipp, setTipp] = useState(false);
  const [serie, setSerie] = useState(0);
  const [beste, setBeste] = useState(0);
  const [stat, setStat] = useState<Statistik>(ladeStatistik);
  const [runde, setRunde] = useState<Ergebnis[]>([]);
  const [start, setStart] = useState(() => Date.now());
  const inputRef = useRef<HTMLInputElement>(null);
  const lernplan = useLernplanUebernahme('rechnen');

  const fertig = modus === 'pruefung' && runde.length >= PRUEFUNG_LAENGE;
  const info = TYPEN.find((t) => t.typ === aufgabe.typ)!;
  const schwach = useMemo(() => schwaechen(stat), [stat]);

  function neu(opts: { typen?: AufgabenTyp[]; stufe?: Stufe } = {}) {
    setAufgabe(naechste(opts.typen ?? typen, opts.stufe ?? stufe, neuerSeed(), aufgabe.typ));
    setEingabe(''); setBewertung(null); setTipp(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function neueRunde(m: Modus, t = typen, s = stufe) {
    setModus(m); setRunde([]); setSerie(0); setStart(Date.now()); lernplan.zuruecksetzen();
    neu({ typen: t, stufe: s });
  }

  function toggleTyp(t: AufgabenTyp) {
    const next = typen.includes(t) ? typen.filter((x) => x !== t) : [...typen, t];
    const gueltig = next.length ? next : [t];
    setTypen(gueltig);
    if (!gueltig.includes(aufgabe.typ)) neu({ typen: gueltig });
  }

  function pruefe() {
    if (bewertung && bewertung !== 'leer') { neu(); return; }
    const b = bewerte(aufgabe, eingabe);
    if (b === 'leer') { setBewertung(b); return; }
    setStat((s) => zaehle(s, aufgabe.typ, ok(b)));
    if (modus === 'pruefung') {
      setRunde((r) => [...r, { aufgabe, eingabe, bewertung: b }]);
      neu();
      return;
    }
    setBewertung(b);
    setRunde((r) => [...r, { aufgabe, eingabe, bewertung: b }]);
    const s = ok(b) ? serie + 1 : 0;
    setSerie(s); setBeste((x) => Math.max(x, s));
  }

  // Prüfungsrunde abgeschlossen: einmal ins Aktivitätsprotokoll
  useEffect(() => {
    if (!fertig) return;
    const richtig = runde.filter((e) => ok(e.bewertung)).length;
    void logActivity({
      kind: 'uebung', severity: richtig >= 8 ? 'info' : 'warning',
      title: `Rechentrainer: ${richtig} von ${runde.length} richtig`,
      detail: `Prüfungsrunde, Stufe ${STUFEN.find((x) => x.stufe === stufe)?.label}, ${Math.round((Date.now() - start) / 60000)} min`,
    });
    // Nur die Prüfungsrunde zählt als Abfrage, Training mit Tipp und Lösungsweg nicht
    lernplan.uebernimm(proThema(runde.map((e) => ({ topicIds: [THEMA[e.aufgabe.typ]], punkte: ok(e.bewertung) ? 1 : 0, max: 1 })), MIN_PRO_THEMA));
  }, [fertig]);

  const richtigInRunde = runde.filter((e) => ok(e.bewertung)).length;

  return (
    <section className="page rechnen">
      <div className="page__head">
        <h2>Rechentrainer</h2>
        <p className="muted">Pflegerisches Rechnen mit unendlich vielen Aufgaben und Lösungsweg. Funktioniert offline. Die Werte sind fiktive Übungswerte, keine Dosierungsempfehlung.</p>
      </div>

      <div className="card rechnen__einstellungen">
        <div className="rechnen__zeile">
          <span className="muted">Modus</span>
          <div className="pills" role="group" aria-label="Modus">
            <button type="button" className="pill" aria-pressed={modus === 'training'} onClick={() => neueRunde('training')}>Training</button>
            <button type="button" className="pill" aria-pressed={modus === 'pruefung'} onClick={() => neueRunde('pruefung')}>Prüfungsrunde ({PRUEFUNG_LAENGE})</button>
          </div>
        </div>
        <div className="rechnen__zeile">
          <span className="muted">Stufe</span>
          <div className="pills" role="group" aria-label="Schwierigkeit">
            {STUFEN.map((s) => (
              <button key={s.stufe} type="button" className="pill" aria-pressed={stufe === s.stufe}
                onClick={() => { setStufe(s.stufe); if (modus === 'pruefung') neueRunde('pruefung', typen, s.stufe); else neu({ stufe: s.stufe }); }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="rechnen__zeile">
          <span className="muted">Themen</span>
          <div className="pills" role="group" aria-label="Aufgabentypen">
            {TYPEN.map((t) => (
              <button key={t.typ} type="button" className="pill" aria-pressed={typen.includes(t.typ)} onClick={() => toggleTyp(t.typ)}>{t.label}</button>
            ))}
            {typen.length < ALLE.length && <button type="button" className="pill pill--accent" onClick={() => { setTypen(ALLE); neu({ typen: ALLE }); }}>Alle</button>}
            {schwach.length > 0 && (
              <button type="button" className="pill pill--accent" onClick={() => { setTypen(schwach); neu({ typen: schwach }); }}>Schwächen üben</button>
            )}
          </div>
        </div>
      </div>

      <div className="rechnen__layout">
        {fertig ? (
          <div className="card rechnen__auswertung" aria-live="polite">
            <h3>{richtigInRunde} von {runde.length} richtig</h3>
            <p className="muted">
              {richtigInRunde === runde.length ? 'Fehlerfrei. Stark!' : richtigInRunde >= 8 ? 'Gut, schau dir die Fehler kurz an.' : 'Lies die Lösungswege und versuch es gleich noch einmal.'}
              {' '}Zeit: {Math.max(1, Math.round((Date.now() - start) / 60000))} min.
            </p>
            <ol className="rechnen__liste">
              {runde.map((e, i) => (
                <li key={i} className={ok(e.bewertung) ? 'is-ok' : 'is-falsch'}>
                  <p>{e.aufgabe.frage}</p>
                  <p className="muted">Deine Antwort: {e.eingabe || '–'} {e.aufgabe.einheit} · {ok(e.bewertung) ? 'richtig' : `richtig wäre ${zahl(e.aufgabe.loesung)} ${e.aufgabe.einheit}`}</p>
                  {!ok(e.bewertung) && <details><summary>Lösungsweg</summary><Loesungsweg a={e.aufgabe} /></details>}
                </li>
              ))}
            </ol>
            <LernplanHinweis uebernahme={lernplan.uebernahme} fehler={lernplan.fehler}
              leer={`Für den Lernplan zählt ein Thema ab ${MIN_PRO_THEMA} Aufgaben in der Runde.`} />
            <div className="row">
              <button type="button" className="primary" onClick={() => neueRunde('pruefung')}>Neue Prüfungsrunde</button>
              <button type="button" onClick={() => neueRunde('training')}>Zum Training</button>
            </div>
          </div>
        ) : (
          <form className="card rechnen__aufgabe" onSubmit={(e) => { e.preventDefault(); pruefe(); }}>
            <div className="rechnen__kopf">
              <span className="badge badge--demo">{TYP_LABEL[aufgabe.typ]}</span>
              {modus === 'pruefung'
                ? <span className="muted">Aufgabe {runde.length + 1} von {PRUEFUNG_LAENGE}</span>
                : <span className="muted" aria-live="polite">Serie {serie}{beste > 1 ? ` · Bestwert ${beste}` : ''} · {richtigInRunde}/{runde.length} richtig</span>}
            </div>
            {modus === 'pruefung' && (
              <div className="rechnen__fortschritt" role="progressbar" aria-valuemin={0} aria-valuemax={PRUEFUNG_LAENGE} aria-valuenow={runde.length}>
                <span style={{ width: `${(runde.length / PRUEFUNG_LAENGE) * 100}%` }} />
              </div>
            )}
            <p className="rechnen__frage">{aufgabe.frage}</p>
            <label className="rechnen__eingabe">
              <span className="visually-hidden">Antwort in {aufgabe.einheit}</span>
              <input ref={inputRef} inputMode="decimal" autoComplete="off" enterKeyHint="done" placeholder="Antwort"
                value={eingabe} readOnly={!!bewertung && bewertung !== 'leer'}
                onChange={(e) => { setEingabe(e.target.value); if (bewertung === 'leer') setBewertung(null); }} />
              <span className="rechnen__einheit">{aufgabe.einheit}</span>
            </label>

            {bewertung && (
              <div className={`note ${bewertung === 'falsch' ? 'warn' : bewertung === 'leer' ? '' : 'ok'}`} role="status">
                <strong>{MELDUNG[bewertung]}</strong>
                {bewertung !== 'leer' && <Loesungsweg a={aufgabe} />}
              </div>
            )}
            {tipp && !bewertung && <div className="note" role="status"><strong>Formel:</strong> {info.formel}{info.merke && <><br />{info.merke}</>}</div>}

            <div className="row">
              <button type="submit" className="primary">{bewertung && bewertung !== 'leer' ? 'Nächste Aufgabe' : modus === 'pruefung' ? 'Weiter' : 'Prüfen'}</button>
              {modus === 'training' && !bewertung && <button type="button" className="ghost" onClick={() => setTipp((x) => !x)}>{tipp ? 'Tipp ausblenden' : 'Tipp'}</button>}
              {modus === 'training' && !bewertung && <button type="button" className="ghost" onClick={() => neu()}>Überspringen</button>}
            </div>
          </form>
        )}

        <aside className="card rechnen__formeln" aria-label="Formelkarte">
          <h3>Formelkarte</h3>
          <dl>
            {TYPEN.map((t) => {
              const q = quote(stat, t.typ);
              return (
                <div key={t.typ} className={t.typ === aufgabe.typ && !fertig ? 'is-aktiv' : undefined}>
                  <dt>
                    {t.label}
                    {q !== null && <span className={`rechnen__quote ${q >= 0.8 ? 'gut' : q >= 0.5 ? 'mittel' : 'schwach'}`}>{Math.round(q * 100)} %</span>}
                  </dt>
                  <dd>{t.formel}</dd>
                  {t.merke && <dd className="muted">{t.merke}</dd>}
                </div>
              );
            })}
          </dl>
          <p className="muted">Prozentwerte: deine Trefferquote auf diesem Gerät. Maßgeblich sind immer ärztliche Anordnung, Fachinformation und Hausstandard.</p>
        </aside>
      </div>
    </section>
  );
}
