import { storage } from '../../ui/lib/store';
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { notiereFehler } from '../fehlerheft/fehlerheft';
import { ausDuell } from '../fehlerheft/quellen';
import './duell.css';
import { logActivity } from '../../core/activity';
import { modules } from '../../modules/registry';
import { useRoute } from '../../ui/shell/router';
import { inLernplan, proThema } from '../lernplan/trainer';
import { LernplanHinweis, useLernplanUebernahme } from '../lernplan/ui/LernplanHinweis';
import {
  ARTEN, erzeugeRunde, filtere, karten, nacharbeiten, passt, punkte, stand, trefferVon,
  type Antwort, type Frage, type FrageArt, type Spieler, type Zug,
} from './duell';

// ---------- Einstellungen ----------

type Sitz = 'gegenueber' | 'nebeneinander';
interface Einstellungen {
  namen: [string, string];
  faecher: string[];
  arten: FrageArt[];
  anzahl: number;
  sekunden: number;     // 0 = ohne Zeitlimit
  sitz: Sitz;
  lernplan: Spieler | null;   // wessen Antworten als Abfrage in den Lernplan gehen
}

const SPEICHER = 'duell.einstellungen';
const STANDARD: Einstellungen = {
  namen: ['Spieler 1', 'Spieler 2'], faecher: [], arten: ['definition', 'abkuerzung'], anzahl: 10, sekunden: 20, sitz: 'gegenueber', lernplan: 0,
};
/** Ein Thema zählt im Lernplan erst ab so vielen Begriffen in der Runde. */
const MIN_PRO_THEMA = 2;

function lade(): Einstellungen {
  return { ...STANDARD, ...storage.read<Partial<Einstellungen>>(SPEICHER, {}) };
}
function speichere(e: Einstellungen) {
  storage.write(SPEICHER, e);
}

const neuerSeed = () => Math.floor(Math.random() * 2 ** 31);
const name = (e: Einstellungen, s: Spieler) => e.namen[s].trim() || `Spieler ${s + 1}`;

// ---------- Spielablauf ----------

interface Spiel {
  phase: 'bereit' | 'frage' | 'ende';
  fragen: Frage[];
  i: number;
  t0: number;
  bereit: [boolean, boolean];
  antworten: [Antwort | null, Antwort | null];
  aufgedeckt: boolean;
  zuege: Zug[];
}

type Aktion =
  | { typ: 'bereit'; s: Spieler; jetzt: number }
  | { typ: 'antwort'; s: Spieler; wahl: number; jetzt: number }
  | { typ: 'zeitAus' }
  | { typ: 'weiter'; jetzt: number };

function aufdecken(z: Spiel, antworten: Spiel['antworten']): Spiel {
  const frage = z.fragen[z.i]!;
  return { ...z, antworten, aufgedeckt: true, zuege: [...z.zuege, { frage, antworten, punkte: punkte(frage, antworten) }] };
}

function ablauf(z: Spiel, a: Aktion): Spiel {
  switch (a.typ) {
    case 'bereit': {
      if (z.phase !== 'bereit') return z;
      const bereit: Spiel['bereit'] = [...z.bereit];
      bereit[a.s] = true;
      return bereit[0] && bereit[1] ? { ...z, bereit, phase: 'frage', t0: a.jetzt } : { ...z, bereit };
    }
    case 'antwort': {
      if (z.phase !== 'frage' || z.aufgedeckt || z.antworten[a.s]) return z;
      const antworten: Spiel['antworten'] = [...z.antworten];
      antworten[a.s] = { wahl: a.wahl, ms: Math.round(a.jetzt - z.t0) };
      return antworten[0] && antworten[1] ? aufdecken(z, antworten) : { ...z, antworten };
    }
    case 'zeitAus':
      return z.phase === 'frage' && !z.aufgedeckt ? aufdecken(z, z.antworten) : z;
    case 'weiter':
      if (!z.aufgedeckt) return z;
      if (z.i + 1 >= z.fragen.length) return { ...z, phase: 'ende' };
      return { ...z, i: z.i + 1, t0: a.jetzt, antworten: [null, null], aufgedeckt: false };
  }
}

const neuesSpiel = (fragen: Frage[]): Spiel => ({
  phase: 'bereit', fragen, i: 0, t0: 0, bereit: [false, false], antworten: [null, null], aufgedeckt: false, zuege: [],
});

// ---------- Eine Spielhälfte ----------

const ART_HINWEIS = Object.fromEntries(ARTEN.map((a) => [a.art, a.hinweis])) as Record<FrageArt, string>;

function Haelfte({ s, e, spiel, dispatch }: { s: Spieler; e: Einstellungen; spiel: Spiel; dispatch: (a: Aktion) => void }) {
  const ich = name(e, s);
  const gegner = name(e, (1 - s) as Spieler);
  const [meine, deine] = s === 0 ? stand(spiel.zuege) : (stand(spiel.zuege).reverse() as [number, number]);
  const klasse = `duell__haelfte duell__haelfte--${s === 0 ? 'a' : 'b'}`;
  // Kleine Bildschirme: nach dem Aufdecken Auflösung und „Weiter“ ins Bild holen
  const fuss = useRef<HTMLDivElement>(null);
  useEffect(() => { if (spiel.aufgedeckt) fuss.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [spiel.aufgedeckt, spiel.i]);

  if (spiel.phase === 'bereit') {
    return (
      <div className={klasse}>
        <div className="duell__mitte">
          <p className="duell__name">{ich}</p>
          {spiel.bereit[s]
            ? <p className="muted" role="status">Warte auf {gegner} …</p>
            : <button type="button" className="primary duell__gross" onClick={() => dispatch({ typ: 'bereit', s, jetzt: performance.now() })}>Bereit</button>}
          <p className="muted">Richtig = 1 Punkt, wer schneller richtig liegt, bekommt 1 Bonuspunkt.</p>
        </div>
      </div>
    );
  }

  if (spiel.phase === 'ende') {
    const ergebnis = meine > deine ? 'Gewonnen!' : meine < deine ? `${gegner} gewinnt` : 'Unentschieden';
    return (
      <div className={klasse}>
        <div className="duell__mitte">
          <p className="duell__name">{ich}</p>
          <p className="duell__ergebnis">{ergebnis}</p>
          <p className="duell__stand-gross">{meine} : {deine}</p>
        </div>
      </div>
    );
  }

  const frage = spiel.fragen[spiel.i]!;
  const meineAntwort = spiel.antworten[s];
  const zug = spiel.aufgedeckt ? spiel.zuege[spiel.zuege.length - 1] : undefined;
  const wahl = (i: number) => dispatch({ typ: 'antwort', s, wahl: i, jetzt: performance.now() });

  return (
    <div className={klasse}>
      <div className="duell__kopf">
        <span className="duell__name">{ich}</span>
        <span className="duell__punkte" aria-label={`${meine} zu ${deine} Punkte`}>{meine} : {deine}</span>
      </div>
      <p className="muted duell__hinweis">{ART_HINWEIS[frage.art]}</p>
      <p className={`duell__frage duell__frage--${frage.art}`}>{frage.frage}</p>
      <div className={`duell__optionen duell__optionen--${frage.art}`} role="group" aria-label={`Antworten für ${ich}`}>
        {frage.optionen.map((o, i) => {
          const zustand = !zug ? (meineAntwort?.wahl === i ? 'is-gewaehlt' : '')
            : i === frage.richtig ? 'is-richtig' : meineAntwort?.wahl === i ? 'is-falsch' : 'is-aus';
          return (
            <button key={i} type="button" className={`duell__option ${zustand}`}
              disabled={!!meineAntwort || spiel.aufgedeckt} aria-pressed={meineAntwort?.wahl === i}
              // Finger: sofort beim Antippen werten (fair und multitouchfest); Maus/Tastatur über click
              onPointerDown={(ev) => { if (ev.pointerType !== 'mouse') { ev.preventDefault(); wahl(i); } }}
              onClick={() => wahl(i)}>
              <span>{o}</span>
            </button>
          );
        })}
      </div>
      <div className="duell__fuss" role="status" ref={fuss}>
        {zug ? (
          <>
            <p className={`duell__urteil ${zug.punkte[s] ? 'ok' : 'nein'}`}>
              {zug.punkte[s] === 2 ? '+2 · richtig und schneller' : zug.punkte[s] === 1 ? '+1 · richtig' : meineAntwort ? 'Leider falsch' : 'Zeit abgelaufen'}
            </p>
            <p className="duell__aufloesung">
              <strong>{frage.karte.begriff}{frage.karte.abkuerzung && frage.karte.abkuerzung !== frage.karte.begriff ? ` (${frage.karte.abkuerzung})` : ''}</strong>
              {frage.art !== 'begriff' && <>: {frage.karte.erklaerung}</>}
            </p>
            <button type="button" className="primary" onClick={() => dispatch({ typ: 'weiter', jetzt: performance.now() })}>
              {spiel.i + 1 >= spiel.fragen.length ? 'Ergebnis' : 'Nächste Frage'}
            </button>
          </>
        ) : meineAntwort ? <p className="muted">Eingeloggt. Warte auf {gegner} …</p> : null}
      </div>
    </div>
  );
}

// ---------- Spielfeld (Vollbild über der Shell) ----------

function Arena({ e, fragen, onEnde, onRevanche }: {
  e: Einstellungen; fragen: Frage[]; onEnde: (zuege: Zug[]) => void; onRevanche: (zuege: Zug[]) => void;
}) {
  const [spiel, dispatch] = useReducer(ablauf, fragen, neuesSpiel);
  const [jetzt, setJetzt] = useState(() => performance.now());
  const laeuft = spiel.phase === 'frage' && !spiel.aufgedeckt && e.sekunden > 0;
  const rest = laeuft ? Math.max(0, e.sekunden * 1000 - (jetzt - spiel.t0)) : 0;

  useEffect(() => {
    if (!laeuft) return;
    const id = setInterval(() => setJetzt(performance.now()), 100);
    return () => clearInterval(id);
  }, [laeuft, spiel.i]);
  useEffect(() => { if (laeuft && rest <= 0) dispatch({ typ: 'zeitAus' }); }, [laeuft, rest]);

  // Seite darunter nicht scrollen lassen, Bildschirm wach halten
  useEffect(() => {
    const vorher = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    let sperre: { release: () => Promise<void> } | undefined;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } };
    nav.wakeLock?.request('screen').then((w) => { sperre = w; }).catch(() => {});
    return () => { document.body.style.overflow = vorher; void sperre?.release().catch(() => {}); };
  }, []);

  // Runde fertig: einmal ins Aktivitätsprotokoll
  useEffect(() => {
    if (spiel.phase !== 'ende') return;
    const [a, b] = stand(spiel.zuege);
    void logActivity({
      kind: 'uebung', severity: 'info',
      title: `Fachbegriff-Duell: ${name(e, 0)} ${a} : ${b} ${name(e, 1)}`,
      detail: `${spiel.zuege.length} Begriffe, ${nacharbeiten(spiel.zuege).length} zum Nacharbeiten`,
    });
  }, [spiel.phase]);

  const [a, b] = stand(spiel.zuege);
  const abbrechen = () => {
    if (spiel.phase === 'ende' || !spiel.zuege.length || window.confirm('Duell abbrechen? Der Spielstand geht verloren.')) onEnde(spiel.zuege);
  };

  return (
    <div className={`duell-arena duell-arena--${e.sitz}`} role="dialog" aria-modal="true" aria-label="Fachbegriff-Duell">
      <Haelfte s={0} e={e} spiel={spiel} dispatch={dispatch} />
      <div className="duell__leiste">
        {spiel.phase === 'ende' ? (
          <>
            <button type="button" className="primary" onClick={() => onRevanche(spiel.zuege)}>Revanche</button>
            <button type="button" onClick={() => onEnde(spiel.zuege)}>Auswertung</button>
          </>
        ) : (
          <>
            <span className="duell__info">{spiel.phase === 'bereit' ? `${fragen.length} Fragen` : `Frage ${spiel.i + 1}/${fragen.length}`}</span>
            <span className="duell__info duell__stand">{a} : {b}</span>
            {e.sekunden > 0 && spiel.phase === 'frage' && (
              <div className="duell__zeit" role="timer" aria-label={`${Math.ceil(rest / 1000)} Sekunden`}>
                <span style={{ transform: `scaleX(${spiel.aufgedeckt ? 0 : rest / (e.sekunden * 1000)})` }} />
              </div>
            )}
            <button type="button" className="ghost small" onClick={abbrechen}>Beenden</button>
          </>
        )}
      </div>
      <Haelfte s={1} e={e} spiel={spiel} dispatch={dispatch} />
    </div>
  );
}

// ---------- Seite ----------

const ANZAHLEN = [10, 15, 20];
const ZEITEN = [{ s: 10, label: '10 s' }, { s: 20, label: '20 s' }, { s: 30, label: '30 s' }, { s: 0, label: 'ohne' }];

export default function Duell() {
  const modul = modules[0]!;
  const alle = useMemo(() => karten(modul), [modul]);
  const [e, setE] = useState<Einstellungen>(lade);
  const [fragen, setFragen] = useState<Frage[] | null>(null);
  const [runde, setRunde] = useState(0);      // erzwingt frischen Spielzustand bei Revanche
  const [letzte, setLetzte] = useState<Zug[] | null>(null);
  const lernplan = useLernplanUebernahme('duell');

  const setze = (teil: Partial<Einstellungen>) => setE((x) => { const n = { ...x, ...teil }; speichere(n); return n; });
  // Sprung aus dem Lernplan: #/lernen/duell?fach=… wählt das Fach vor
  const { params } = useRoute();
  const fachAusAdresse = params.get('fach');
  useEffect(() => {
    if (fachAusAdresse && modul.subjects.some((f) => f.id === fachAusAdresse)) setze({ faecher: [fachAusAdresse] });
  }, [fachAusAdresse]);

  const faecher = useMemo(
    () => modul.subjects.filter((f) => alle.some((k) => k.faecher.includes(f.id) && e.arten.some((a) => passt(k, a)))),
    [modul, alle, e.arten],
  );
  const pool = filtere(alle, e.faecher).filter((k) => e.arten.some((a) => passt(k, a)));
  const anzahl = Math.min(e.anzahl, pool.length);

  const starte = () => { setFragen(erzeugeRunde(alle, pool, e.arten, anzahl, neuerSeed())); setRunde((r) => r + 1); setLetzte(null); lernplan.zuruecksetzen(); };
  // Abgebrochene Runden zählen nicht: nur wenn alle Fragen gespielt sind
  const beende = (zuege: Zug[]) => {
    setFragen(null); setLetzte(zuege);
    if (e.lernplan !== null && fragen && zuege.length === fragen.length) lernplan.uebernimm(proThema(trefferVon(zuege, e.lernplan), MIN_PRO_THEMA));
    notiereFehler(duellFehler(zuege, e.lernplan));
  };
  const toggle = <T,>(xs: T[], x: T) => (xs.includes(x) ? xs.filter((y) => y !== x) : [...xs, x]);
  const [pa, pb] = letzte ? stand(letzte) : [0, 0];
  const offen = letzte ? nacharbeiten(letzte) : [];

  return (
    <section className="page duell">
      <div className="page__head">
        <h2>Fachbegriff-Duell</h2>
        <p className="muted">Zwei Personen, ein Gerät: iPad flach zwischen euch legen, jede Hälfte zeigt zu einer Person. Fragen kommen aus dem Glossar des Fachmoduls, funktioniert offline.</p>
      </div>

      {letzte && letzte.length > 0 && (
        <div className="card duell__auswertung" aria-live="polite">
          <h3>{pa === pb ? 'Unentschieden' : `${name(e, pa > pb ? 0 : 1)} gewinnt`} · {pa} : {pb}</h3>
          {offen.length ? (
            <>
              <p className="muted">Diese Begriffe lohnen sich zum Nacharbeiten:</p>
              <ul className="duell__liste">
                {offen.map((z) => (
                  <li key={z.frage.id}>
                    <strong>{z.frage.karte.begriff}{z.frage.karte.abkuerzung && z.frage.karte.abkuerzung !== z.frage.karte.begriff ? ` (${z.frage.karte.abkuerzung})` : ''}</strong>
                    <span>{z.frage.karte.erklaerung}</span>
                    <span className="muted">
                      {([0, 1] as Spieler[]).map((s) => {
                        const an = z.antworten[s];
                        return `${name(e, s)}: ${!an ? 'keine Antwort' : an.wahl === z.frage.richtig ? 'richtig' : `„${z.frage.optionen[an.wahl]!.slice(0, 60)}${z.frage.optionen[an.wahl]!.length > 60 ? '…' : ''}“`}`;
                      }).join(' · ')}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : <p className="muted">Alles von beiden richtig beantwortet. Stark!</p>}
          <LernplanHinweis uebernahme={lernplan.uebernahme} fehler={lernplan.fehler}
            leer={e.lernplan === null ? undefined : `Für den Lernplan zählt ein Thema ab ${MIN_PRO_THEMA} Begriffen in der Runde. Tipp: ein Fach auswählen, dann kommen mehr Begriffe je Thema.`} />
        </div>
      )}

      <form className="card duell__einstellungen" onSubmit={(ev) => { ev.preventDefault(); if (anzahl) starte(); }}>
        <div className="duell__namen">
          {([0, 1] as Spieler[]).map((s) => (
            <label key={s} className="field">
              <span>{e.sitz === 'gegenueber' ? (s === 0 ? 'Seite oben' : 'Seite unten') : (s === 0 ? 'Links' : 'Rechts')}</span>
              <input value={e.namen[s]} maxLength={20} autoComplete="off"
                onChange={(ev) => { const n: [string, string] = [...e.namen]; n[s] = ev.target.value; setze({ namen: n }); }} />
            </label>
          ))}
        </div>

        <div className="duell__zeile">
          <span className="muted">Fragen</span>
          <div className="pills" role="group" aria-label="Fragearten">
            {ARTEN.map((a) => (
              <button key={a.art} type="button" className="pill" aria-pressed={e.arten.includes(a.art)}
                onClick={() => { const n = toggle(e.arten, a.art); setze({ arten: n.length ? n : [a.art] }); }}>{a.label}</button>
            ))}
          </div>
        </div>
        <div className="duell__zeile">
          <span className="muted">Fächer</span>
          <div className="pills" role="group" aria-label="Fächer">
            <button type="button" className="pill" aria-pressed={!e.faecher.length} onClick={() => setze({ faecher: [] })}>Alle</button>
            {faecher.map((f) => (
              <button key={f.id} type="button" className="pill" aria-pressed={e.faecher.includes(f.id)} title={f.name}
                onClick={() => setze({ faecher: toggle(e.faecher, f.id) })}>{f.name.split(/[,(]/)[0]!.trim()}</button>
            ))}
          </div>
        </div>
        <div className="duell__zeile">
          <span className="muted">Länge</span>
          <div className="pills" role="group" aria-label="Anzahl Fragen">
            {ANZAHLEN.map((n) => <button key={n} type="button" className="pill" aria-pressed={e.anzahl === n} onClick={() => setze({ anzahl: n })}>{n}</button>)}
          </div>
        </div>
        <div className="duell__zeile">
          <span className="muted">Zeit</span>
          <div className="pills" role="group" aria-label="Zeit pro Frage">
            {ZEITEN.map((z) => <button key={z.s} type="button" className="pill" aria-pressed={e.sekunden === z.s} onClick={() => setze({ sekunden: z.s })}>{z.label}</button>)}
          </div>
        </div>
        <div className="duell__zeile">
          <span className="muted">Lernplan</span>
          <div className="pills" role="group" aria-label="Wessen Ergebnis zählt im Lernplan">
            {([0, 1] as Spieler[]).map((s) => (
              <button key={s} type="button" className="pill" aria-pressed={e.lernplan === s} onClick={() => setze({ lernplan: s })}>{name(e, s)} zählt</button>
            ))}
            <button type="button" className="pill" aria-pressed={e.lernplan === null} onClick={() => setze({ lernplan: null })}>Nur Spaß</button>
          </div>
        </div>
        <div className="duell__zeile">
          <span className="muted">Sitzen</span>
          <div className="pills" role="group" aria-label="Sitzordnung">
            <button type="button" className="pill" aria-pressed={e.sitz === 'gegenueber'} onClick={() => setze({ sitz: 'gegenueber' })}>Gegenüber (iPad flach)</button>
            <button type="button" className="pill" aria-pressed={e.sitz === 'nebeneinander'} onClick={() => setze({ sitz: 'nebeneinander' })}>Nebeneinander (quer)</button>
          </div>
        </div>

        <div className="row">
          <span className="muted">
            {pool.length ? `${pool.length} Begriffe passen, ${anzahl} kommen dran.` : 'Für diese Auswahl gibt es keine Begriffe.'}
          </span>
          <button type="submit" className="primary" disabled={!anzahl}>Duell starten</button>
        </div>
      </form>

      <p className="muted duell__quelle">
        Die Erklärungen stammen aus dem Katalog des Fachmoduls und sind ergänzendes Wissen, keine Quelle. Maßgeblich sind eure Lehrbücher und der Unterricht.
      </p>

      {fragen && (
        <Arena key={runde} e={e} fragen={fragen}
          onEnde={beende}
          onRevanche={(zuege) => { notiereFehler(duellFehler(zuege, e.lernplan)); if (e.lernplan !== null) void inLernplan('duell', proThema(trefferVon(zuege, e.lernplan), MIN_PRO_THEMA)).catch(() => {}); starte(); }} />
      )}
    </section>
  );
}

/** Fehler fürs Fehlerheft: von der Person, die im Lernplan zählt, sonst von allen, die danebenlagen. */
function duellFehler(zuege: Zug[], wer: 0 | 1 | null) {
  return zuege.flatMap((z) => {
    const falsch = ([0, 1] as const).filter((s) => (wer === null || s === wer) && z.antworten[s]?.wahl !== z.frage.richtig);
    if (!falsch.length) return [];
    return [ausDuell(z.frage, z.antworten[falsch[0]!]?.wahl ?? null)];
  });
}
