// Hör-Trainer: Herz-, Lungen- und Darmgeräusche, Monitoralarme und Geräte erkennen,
// dazu Blutdruck nach Gehör messen (Korotkow-Geräusche). Alle Klänge synthetisch, offline.

import { useEffect, useMemo, useRef, useState } from 'react';
import './hoeren.css';
import '../quiz/quiz.css';
import { logActivity } from '../../core/activity';
import { PageHeading } from '../../ui/PageHeading';
import { Icon } from '../../ui/icons';
import { storage, useStore } from '../../ui/lib/store';
import { navigate, useRoute } from '../../ui/shell/router';
import { GRUPPEN, KLANG, type Gruppe } from '../../ui/audio/klaenge';
import { ausgang, audioMoeglich, entsperre } from '../../ui/audio/motor';
import { audioEinstellungen, setzeAudio } from '../../ui/audio/einstellungen';
import { spiele, starteSchleife, type Schleife } from '../../ui/audio/spieler';
import { dauerRauschen, rauschen, ton, type Werkzeug } from '../../ui/audio/synth';
import {
  ablesen, ABLASS_MMHG_PRO_S, ohneNamen, druckNach, genauigkeit, HOER_GRUPPEN, HOER_KEY, hoerKlaenge, hoerRunde, korotkow, neuerBlutdruckFall,
  type BlutdruckFall, type Genauigkeit, type HoerFrage, type HoerStand,
} from './hoeren';

type Reiter = 'beispiele' | 'quiz' | 'blutdruck';
const REITER: Array<[Reiter, string]> = [['beispiele', 'Hörbeispiele'], ['quiz', 'Was hörst du?'], ['blutdruck', 'Blutdruck nach Gehör']];

/** Alle laufenden Klänge der Seite, damit „Alles stoppen“ jederzeit greift (Audit: Stop jederzeit erreichbar). */
const STOPPER = new Set<() => void>();
const allesStoppen = () => { for (const s of [...STOPPER]) s(); };

/** Ein Klang zur Zeit: Abspielen stoppt den vorherigen. Beim Verlassen der Seite ist Ruhe. */
function useEinKlang() {
  const [aktiv, setAktiv] = useState<string | null>(null);
  const lauf = useRef<Schleife | null>(null);
  const stopp = () => { lauf.current?.stopp(); lauf.current = null; setAktiv(null); };
  const stoppRef = useRef(stopp);
  stoppRef.current = stopp;
  useEffect(() => { const s = () => stoppRef.current(); STOPPER.add(s); return () => { STOPPER.delete(s); }; }, []);
  const spiel = (id: string, p: { spo2?: number } = {}) => {
    lauf.current?.stopp(); lauf.current = null;
    entsperre();
    const k = KLANG[id];
    if (!k) return;
    if (!k.schleife) { spiele(id, p, { erzwingen: true }); setAktiv(null); return; }
    lauf.current = starteSchleife(id, { puls: id === 'herz-tachy' ? 132 : undefined, ...p }, { erzwingen: true });
    setAktiv(lauf.current ? id : null);
  };
  useEffect(() => () => lauf.current?.stopp(), []);
  return { aktiv, spiel, stopp, setze: (p: { spo2?: number }) => lauf.current?.setze(p) };
}

function Abspielen({ an, onClick, label }: { an: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" className={`audio-knopf hoe__play${an ? ' is-an' : ''}`} aria-pressed={an} onClick={onClick} aria-label={`${label} ${an ? 'stoppen' : 'abspielen'}`}>
      <Icon name={an ? 'tonAus' : 'ton'} size={18} /> {an ? 'Stopp' : 'Anhören'}
    </button>
  );
}

// ---------------------------------------------------------------- Hörbeispiele

function Beispiele() {
  const { aktiv, spiel, stopp, setze } = useEinKlang();
  const [spo2, setSpo2] = useState(98);
  return (
    <div className="hoe__gruppen">
      {HOER_GRUPPEN.map((g) => (
        <section key={g} className="card hoe__gruppe" aria-labelledby={`hoe-${g}`}>
          <h2 id={`hoe-${g}`}>{GRUPPEN[g]}</h2>
          {g === 'herz' && <p className="muted">Am besten mit Kopfhörern. Die Töne sind hörbar gemachte Modelle, echte Herztöne sind leiser und vielschichtiger.</p>}
          <ul className="hoe__liste">
            {[...hoerKlaenge(g), ...(g === 'geraet' ? [KLANG['nibp']!, KLANG['defi']!] : [])].map((k) => (
              <li key={k.id} className={`hoe__klang${aktiv === k.id ? ' is-an' : ''}`}>
                <div>
                  <h3>{k.titel} <span className="tag hoe__synth" title="Am Gerät erzeugte Nachbildung, keine Aufnahme">synthetisch</span></h3>
                  <p>{k.text}</p>
                  {k.merkmal && <p className="hoe__merkmal"><strong>Woran erkennen:</strong> {k.merkmal}</p>}
                  {k.id === 'monitor-piep' && (
                    <label className="hoe__spo2">SpO₂
                      <select value={spo2} onChange={(e) => { const v = Number(e.target.value); setSpo2(v); setze({ spo2: v }); }}>
                        {[100, 96, 92, 88, 84, 80].map((v) => <option key={v} value={v}>{v} %</option>)}
                      </select>
                    </label>
                  )}
                </div>
                <Abspielen an={aktiv === k.id} label={k.titel} onClick={() => (aktiv === k.id ? stopp() : spiel(k.id, { spo2 }))} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- Quiz


function Quiz({ onFertig }: { onFertig: (prozent: number) => void }) {
  const [gruppe, setGruppe] = useState<Gruppe | ''>('');
  const [nr, setNr] = useState(0);
  const fragen = useMemo<HoerFrage[]>(() => hoerRunde(8, gruppe || undefined), [gruppe, nr]); // eslint-disable-line react-hooks/exhaustive-deps
  const [i, setI] = useState(-1);
  const [wahl, setWahl] = useState<number | null>(null);
  const [punkte, setPunkte] = useState(0);
  const { aktiv, spiel, stopp } = useEinKlang();
  const f = fragen[i];

  function starte() { entsperre(); setNr((n) => n + 1); setPunkte(0); setWahl(null); setI(0); }
  // Neue Frage: sofort abspielen (der Tipp auf „Start“/„Weiter“ ist die nötige Geste fürs iPhone)
  useEffect(() => { if (f) spiel(f.klang); }, [i, nr]); // eslint-disable-line react-hooks/exhaustive-deps

  function antworte(n: number) {
    if (!f || wahl !== null) return;
    stopp();
    setWahl(n);
    const ok = n === f.richtig;
    if (ok) setPunkte((p) => p + 1);
    spiele(ok ? 'richtig' : 'falsch');
  }
  function weiter() {
    entsperre();
    stopp();
    if (i + 1 < fragen.length) { setWahl(null); setI(i + 1); return; }
    const prozent = Math.round((punkte / fragen.length) * 100);
    spiele(prozent >= 90 ? 'erfolg' : 'fertig');
    onFertig(prozent);
    setI(fragen.length);
  }

  if (i < 0) {
    return (
      <div className="card">
        <h2>Was hörst du?</h2>
        <p>Du hörst ein Geräusch und wählst, was es ist. Ablenker kommen aus derselben Gruppe, damit du die Merkmale vergleichst.</p>
        <label className="field"><span>Gruppe</span>
          <select value={gruppe} onChange={(e) => setGruppe(e.target.value as Gruppe | '')}>
            <option value="">Gemischt</option>
            {HOER_GRUPPEN.map((g) => <option key={g} value={g}>{GRUPPEN[g]}</option>)}
          </select>
        </label>
        <div className="row"><button type="button" className="primary" onClick={starte}>Runde starten</button></div>
      </div>
    );
  }
  if (!f) {
    const prozent = Math.round((punkte / Math.max(1, fragen.length)) * 100);
    return (
      <div className="card qz__ende" aria-live="polite">
        <h3>{prozent} % richtig</h3>
        <p className="muted">{punkte} von {fragen.length} Geräuschen erkannt.</p>
        <div className="row">
          <button type="button" className="primary" onClick={starte}>Neue Runde</button>
          <button type="button" onClick={() => setI(-1)}>Zur Auswahl</button>
        </div>
      </div>
    );
  }
  const k = KLANG[f.klang]!;
  return (
    <div className="card qz__aufgabe">
      <div className="qz__kopf">
        <span className="badge badge--demo">{GRUPPEN[k.gruppe]}</span>
        <span className="tag hoe__synth">synthetisch</span>
        <span className="muted">Geräusch {i + 1} von {fragen.length}</span>
      </div>
      <progress className="qz__fortschritt" max={fragen.length} value={i + (wahl !== null ? 1 : 0)} aria-label="Fortschritt der Runde" />
      <div className="row">
        <Abspielen an={aktiv === f.klang} label="Geräusch" onClick={() => (aktiv === f.klang ? stopp() : spiel(f.klang))} />
      </div>
      {wahl === null && k.merkmal && (
        <details className="hoe__textalt">
          <summary>Ohne Ton: Beschreibung lesen</summary>
          <p>{ohneNamen(k.merkmal, [k.titel, ...f.optionen.map((o) => KLANG[o]?.titel ?? '')])}</p>
        </details>
      )}
      <fieldset className="qz__optionen" disabled={wahl !== null}>
        <legend className="qz__frage">Was hörst du?</legend>
        {f.optionen.map((o, n) => {
          const status = wahl === null ? '' : n === f.richtig ? ' is-ok' : n === wahl ? ' is-falsch' : '';
          return (
            <label key={o} className={`qz__option${wahl === n ? ' is-gewaehlt' : ''}${status}`}>
              <input type="radio" name={`hoe-${i}`} checked={wahl === n} onChange={() => antworte(n)} />
              <span>{KLANG[o]?.titel}</span>
              {wahl !== null && n === f.richtig && <span className="qz__marke-text">richtig</span>}
            </label>
          );
        })}
      </fieldset>
      {wahl !== null && (
        <>
          <div className={`note ${wahl === f.richtig ? 'ok' : 'warn'}`} role="status">
            <strong>{wahl === f.richtig ? 'Richtig.' : `Das war: ${k.titel}.`}</strong>
            <p>{k.text}</p>
            {k.merkmal && <p><strong>Woran erkennen:</strong> {k.merkmal}</p>}
          </div>
          <div className="row">
            <button type="button" className="primary" onClick={weiter}>{i + 1 < fragen.length ? 'Weiter' : 'Auswertung'}</button>
            {wahl !== f.richtig && <button type="button" onClick={() => spiel(f.optionen[wahl]!)}>Deine Wahl zum Vergleich anhören</button>}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Blutdruck nach Gehör

function klopfen(w: Werkzeug, t: number, phase: number, pegel: number) {
  const dumpf = phase === 4;
  ton(w, t, { f: dumpf ? 40 : 52, fEnde: dumpf ? 32 : 38, dauer: dumpf ? 0.08 : 0.055, pegel: 0.7 * pegel, attack: 0.004 });
  rauschen(w, t, { dauer: 0.05, filter: 'lowpass', f: dumpf ? 110 : phase === 3 ? 320 : 220, pegel: 0.6 * pegel, attack: 0.003 });
  if (phase === 2) rauschen(w, t + 0.02, { dauer: 0.16, filter: 'bandpass', f: 300, q: 1.2, pegel: 0.25, attack: 0.04, release: 0.1 });
}

type Messung = { fall: BlutdruckFall; sys: number | null; dia: number | null; fertig: boolean };

function Blutdruck({ onErgebnis }: { onErgebnis: (g: Genauigkeit) => void }) {
  const [m, setM] = useState<Messung | null>(null);
  const [druck, setDruck] = useState(0);
  const [fehler, setFehler] = useState('');
  const lauf = useRef<{ stopp: () => void; druck: () => number } | null>(null);

  function stoppe() { lauf.current?.stopp(); lauf.current = null; }
  useEffect(() => { STOPPER.add(stoppe); return () => { STOPPER.delete(stoppe); stoppe(); }; }, []);

  function starte() {
    stoppe();
    entsperre();
    const a = ausgang('sim', true);
    if (!a) { setFehler('Dieser Browser kann keine Töne erzeugen.'); return; }
    setFehler('');
    const fall = neuerBlutdruckFall();
    const { ctx } = a;
    const regler = ctx.createGain(); regler.connect(a.ziel);
    const w: Werkzeug = { ctx, aus: regler, zufall: Math.random, dauerquellen: [] };
    dauerRauschen(w, { filter: 'lowpass', f: 260, pegel: 0.02 }); // Stethoskop
    dauerRauschen(w, { filter: 'highpass', f: 3500, pegel: 0.006 }); // Ventil lässt Luft ab
    const t0 = ctx.currentTime + 0.3;
    let schlag = t0 + 0.2;
    const periode = 60 / fall.puls;
    const id = window.setInterval(() => {
      while (schlag < ctx.currentTime + 0.25) {
        const k = korotkow(druckNach(fall, schlag - t0), fall);
        if (k.pegel) klopfen(w, schlag, k.phase, k.pegel);
        schlag += periode;
      }
      const p = druckNach(fall, Math.max(0, ctx.currentTime - t0));
      setDruck(p);
      if (p < fall.dia - 25) { // weit genug abgelassen, ohne Angabe: Messung endet
        stoppe();
        setM((x) => (x && !x.fertig ? { ...x, fertig: true } : x));
      }
    }, 50);
    lauf.current = {
      druck: () => druckNach(fall, Math.max(0, ctx.currentTime - t0)),
      stopp: () => {
        clearInterval(id);
        regler.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
        window.setTimeout(() => { for (const q of w.dauerquellen ?? []) { try { q.stop(); } catch { /* */ } } regler.disconnect(); }, 300);
      },
    };
    setDruck(fall.start);
    setM({ fall, sys: null, dia: null, fertig: false });
  }

  function erster() { if (m && lauf.current) setM({ ...m, sys: ablesen(lauf.current.druck()) }); }
  function weg() {
    if (!m || !lauf.current) return;
    const dia = ablesen(lauf.current.druck());
    stoppe();
    const fertig = { ...m, dia, fertig: true };
    setM(fertig);
    if (fertig.sys !== null) {
      const g = [genauigkeit(fertig.sys - m.fall.sys), genauigkeit(dia - m.fall.dia)];
      const gesamt: Genauigkeit = g.includes('daneben') ? 'daneben' : g.includes('knapp') ? 'knapp' : 'genau';
      spiele(gesamt === 'genau' ? 'richtig' : gesamt === 'knapp' ? 'teilweise' : 'falsch');
      onErgebnis(gesamt);
    }
  }

  const ende = m?.fertig;
  return (
    <div className="card hoe__bd">
      <h2>Blutdruck nach Gehör</h2>
      <p>Die Manschette ist aufgepumpt. Der Druck sinkt um {ABLASS_MMHG_PRO_S} mmHg pro Sekunde. Tippe beim <strong>ersten Klopfen</strong> (systolisch) und wenn das Klopfen <strong>ganz verschwindet</strong> (diastolisch).</p>
      {fehler && <p className="field-error" role="alert">{fehler}</p>}
      {m && (
        <div className="hoe__manometer" aria-hidden={!ende}>
          <span className="hoe__druck">{ende ? '–' : Math.round(druck)}</span><small>mmHg</small>
          <div className="hoe__skala"><span style={{ transform: `scaleX(${Math.min(1, druck / 260)})` }} /></div>
        </div>
      )}
      {!ende && m && (
        <div className="row hoe__bd-knoepfe">
          <button type="button" className="primary" disabled={m.sys !== null} onClick={erster}>{m.sys !== null ? `Erster Ton bei ${m.sys}` : 'Erster Ton'}</button>
          <button type="button" className="primary" disabled={m.sys === null} onClick={weg}>Ton verschwunden</button>
          <button type="button" className="ghost" onClick={() => { stoppe(); setM(null); }}>Abbrechen</button>
        </div>
      )}
      {ende && m && (
        <div className={`note ${m.sys !== null && m.dia !== null && genauigkeit(m.sys - m.fall.sys) !== 'daneben' && genauigkeit(m.dia - m.fall.dia) !== 'daneben' ? 'ok' : 'warn'}`} role="status">
          {m.sys === null || m.dia === null
            ? <p><strong>Keine vollständige Messung.</strong> Der Wert war {m.fall.sys}/{m.fall.dia} mmHg.</p>
            : <p><strong>Dein Wert: {m.sys}/{m.dia} mmHg.</strong> Tatsächlich: {m.fall.sys}/{m.fall.dia} mmHg (Puls {m.fall.puls}/min). Systolisch {genauigkeit(m.sys - m.fall.sys)}, diastolisch {genauigkeit(m.dia - m.fall.dia)}.</p>}
          <p className="muted">Genau = höchstens 4 mmHg daneben. Diastolisch ist der Punkt, an dem das Klopfen ganz verschwindet (Phase V), nicht schon das leiser werden (Phase IV).</p>
        </div>
      )}
      <div className="row">
        {(!m || ende) && <button type="button" className="primary" onClick={starte}>{m ? 'Nächste Messung' : 'Messung starten'}</button>}
      </div>
      <details>
        <summary>So klingen die Phasen</summary>
        <ul>
          <li><strong>Phase I:</strong> erstes klares Klopfen = systolischer Wert.</li>
          <li><strong>Phase II:</strong> leiser, mit Rauschen.</li>
          <li><strong>Phase III:</strong> laut und hart.</li>
          <li><strong>Phase IV:</strong> plötzlich dumpf und leise.</li>
          <li><strong>Phase V:</strong> Stille = diastolischer Wert. Noch 10–20 mmHg weiter hören, dann ganz ablassen.</li>
        </ul>
      </details>
    </div>
  );
}

// ---------------------------------------------------------------- Seite

/** Lautstärke und Stopp, immer oben sichtbar (klebt beim Scrollen). */
function Steuerung() {
  const s = useStore(audioEinstellungen, (x) => x);
  return (
    <div className="hoe__steuerung" role="group" aria-label="Wiedergabe">
      <label>Lautstärke
        <input type="range" min={0} max={1} step={0.05} value={s.lautstaerke} aria-valuetext={`${Math.round(s.lautstaerke * 100)} %`}
          onChange={(e) => setzeAudio({ lautstaerke: Number(e.target.value) })} />
      </label>
      <button type="button" className="small" onClick={allesStoppen}><Icon name="tonAus" size={16} /> Alles stoppen</button>
    </div>
  );
}

export default function HoerTrainer() {
  const { params } = useRoute();
  const reiter = (REITER.find(([r]) => r === params.get('teil'))?.[0] ?? 'beispiele') as Reiter;
  const [stand, setStand] = useState<HoerStand>(() => storage.read<HoerStand>(HOER_KEY, {}));
  const heute = () => new Date().toISOString().slice(0, 10);
  const speichere = (s: HoerStand) => { setStand(s); storage.write(HOER_KEY, s); };

  return (
    <section className="page hoe">
      <PageHeading eyebrow="Üben · Prüfung" title="Hör-Trainer"
        description="Herztöne, Atem- und Darmgeräusche, Monitoralarme und Blutdruck nach Gehör. Alles offline." />
      {!audioMoeglich() && <p className="note warn">Dieser Browser kann keine Töne erzeugen. Die Beschreibungen unter jedem Klang und „Ohne Ton: Beschreibung lesen“ im Quiz gehen trotzdem.</p>}
      <Steuerung />
      <p className="note hoe__grenzen">Alle Klänge sind <strong>synthetisch</strong>: am Gerät erzeugte, vereinfachte Nachbildungen, keine Originalaufnahmen von Patientinnen und Patienten. Grenzen stehen unten auf der Seite.</p>
      <div className="hoe__reiter" role="tablist" aria-label="Teil wählen">
        {REITER.map(([r, label]) => (
          <button key={r} type="button" role="tab" className="pill" aria-selected={reiter === r} onClick={() => navigate(`/lernen/hoeren?teil=${r}`)}>{label}</button>
        ))}
      </div>
      <p className="muted hoe__stand">
        {stand.quiz ? `Zuletzt „Was hörst du?“: ${stand.quiz.prozent} %. ` : ''}
        {stand.blutdruck ? `Blutdruck: ${stand.blutdruck.genau} von ${stand.blutdruck.versuche} Messungen genau.` : ''}
      </p>

      {reiter === 'beispiele' && <Beispiele />}
      {reiter === 'quiz' && <Quiz onFertig={(prozent) => {
        speichere({ ...stand, quiz: { datum: heute(), prozent } });
        void logActivity({ kind: 'uebung', severity: prozent >= 80 ? 'info' : 'warning', title: 'Hör-Trainer: Was hörst du?', detail: `${prozent} % der Geräusche erkannt` });
      }} />}
      {reiter === 'blutdruck' && <Blutdruck onErgebnis={(g) => {
        const b = stand.blutdruck ?? { datum: heute(), genau: 0, versuche: 0 };
        speichere({ ...stand, blutdruck: { datum: heute(), genau: b.genau + (g === 'genau' ? 1 : 0), versuche: b.versuche + 1 } });
      }} />}

      <div className="muted hoe__hinweis">
        <p><strong>Grenzen:</strong> Die Geräusche sind am Gerät erzeugte, vereinfachte Nachbildungen typischer Merkmale. Sie ersetzen keine echten Auskultationsaufnahmen und kein Üben am Menschen.</p>
        <p>Echte Befunde sind leiser, überlagert (Atmung, Bewegung, Umgebung) und hängen von Stethoskop, Abhörstelle und Körperbau ab. Lautsprecher am Handy geben tiefe Töne (Herz, Korotkow) nur schwach wieder: Kopfhörer nutzen.</p>
        <p>Alarmrhythmen sind an die Norm IEC 60601-1-8 angelehnt; die Geräte deiner Einrichtung können anders klingen. Eine Diagnose stellt die Ärztin oder der Arzt.</p>
      </div>
    </section>
  );
}
