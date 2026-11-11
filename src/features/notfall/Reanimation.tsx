// Reanimationsübung: Erkennen, Thoraxkompressionen im Takt (Tippen), 30:2, Rhythmusanalyse am
// Defibrillator, Schock mit kurzer Unterbrechung, Auswertung von Rate, Kompressionsanteil und Pausen.

import { useEffect, useRef, useState } from 'react';
import { logActivity } from '../../core/activity';
import { RaumBuehne } from '../../ui/sim/raeume/RaumBuehne';
import { spiele } from '../../ui/audio/spieler';
import { useReducedMotion } from '../praxis/MiniMonitor';
import {
  ABLENKER, auswerten, ERKENNEN, hinweise, medikamentHinweis, rate, RHYTHMUS_NAME, richtigeEntscheidung, SZENARIEN, ZIEL,
  type Entscheidung, type ReaSzenario, type Rhythmus,
} from './rea';
import { artefakt, kurve } from './rhythmus';
import './notfall.css';

type Phase = 'start' | 'erkennen' | 'cpr' | 'analyse' | 'laden' | 'ende';
/** Brustmitte des Patienten auf der Trage im Schockraumfoto (Prozent). */
const BRUST = { x: 44, y: 41 };
const ENTSCHEIDUNG_LABEL: Record<Entscheidung, string> = {
  schockbar: 'Schockbar (Kammerflimmern / pulslose VT)', 'nicht-schockbar': 'Nicht schockbar (Asystolie)', organisiert: 'Organisierter Rhythmus: Puls tasten',
};

function mischen<T>(a: T[]): T[] { return a.map(x => [Math.random(), x] as const).sort((p, q) => p[0] - q[0]).map(p => p[1]); }

/** Bildschirm des Defibrillators: Rhythmus als Sweep, Kompressionsartefakte beim Drücken. */
function DefiSchirm({ rhythmus, letzterDruck, laedt }: { rhythmus: Rhythmus | null; letzterDruck: React.RefObject<number | null>; laedt: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const reduziert = useReducedMotion();
  useEffect(() => {
    const c = canvas.current; const ctx = c?.getContext('2d'); if (!c || !ctx) return;
    const b = 320, h = 120; c.width = b * 2; c.height = h * 2; ctx.setTransform(2, 0, 0, 2, 0, 0);
    ctx.fillStyle = '#05100e'; ctx.fillRect(0, 0, b, h);
    const y = (v: number) => h * 0.55 - v * h * 0.33;
    const zeichneStill = () => {
      ctx.fillStyle = '#05100e'; ctx.fillRect(0, 0, b, h); ctx.strokeStyle = '#7dff9b'; ctx.lineWidth = 1.6; ctx.beginPath();
      for (let x = 0; x <= b; x++) { const v = rhythmus ? kurve(rhythmus, x / 80) : 0; x ? ctx.lineTo(x, y(v)) : ctx.moveTo(x, y(v)); }
      ctx.stroke();
    };
    if (reduziert || !rhythmus) { zeichneStill(); return; }
    let x = 0, frame = 0, alt = y(0), letzte = 0;
    const tick = (zeit: number) => {
      frame = requestAnimationFrame(tick);
      const dt = letzte ? Math.min(0.1, (zeit - letzte) / 1000) : 0; letzte = zeit;
      const schritte = Math.max(1, Math.round(dt * 80));
      for (let i = 0; i < schritte; i++) {
        const t = zeit / 1000 - (schritte - i) / 80;
        const d = letzterDruck.current; const v = kurve(rhythmus, t) + artefakt(t, d === null ? null : d / 1000);
        ctx.fillStyle = '#05100e'; ctx.fillRect(x, 0, 10, h);
        ctx.strokeStyle = '#7dff9b'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x, alt); ctx.lineTo(x + 1, y(v)); ctx.stroke();
        alt = y(v); x = (x + 1) % b; if (x === 0) alt = y(v);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [rhythmus, reduziert, letzterDruck]);
  return <div className={`rea-defi ${laedt ? 'is-laedt' : ''}`} aria-hidden="true">
    <div className="rea-defi__kopf"><span>DEFI</span><span>{laedt ? 'LADEN …' : rhythmus ? 'ANALYSE' : 'PADS'}</span></div>
    <canvas ref={canvas} className="rea-defi__schirm" />
  </div>;
}

export function Reanimation() {
  const [phase, setPhase] = useState<Phase>('start');
  const [szenario, setSzenario] = useState<ReaSzenario>(SZENARIEN[0]!);
  const [kurz, setKurz] = useState(true);
  const [takt, setTakt] = useState(false);
  const [erledigt, setErledigt] = useState<string[]>([]);
  const [optionen, setOptionen] = useState(() => mischen([...ERKENNEN, ...ABLENKER]));
  const [meldung, setMeldung] = useState<{ text: string; art: 'ok' | 'falsch' | 'info' } | null>(null);
  const [falsche, setFalsche] = useState(0);
  const [zaehler, setZaehler] = useState(0);
  const [beatmen, setBeatmen] = useState(false);
  const [analyse, setAnalyse] = useState(0);
  const [defiDa, setDefiDa] = useState(false);
  const [entscheidungen, setEntscheidungen] = useState<boolean[]>([]);
  const [schocks, setSchocks] = useState(0);
  const [medis, setMedis] = useState<string[]>([]);
  const [rest, setRest] = useState(0);
  const [aktuelleRate, setAktuelleRate] = useState<number | null>(null);
  const [druckNr, setDruckNr] = useState(0);
  const [ergebnis, setErgebnis] = useState<ReturnType<typeof auswerten> | null>(null);
  const start = useRef(0); const taps = useRef<number[]>([]); const zyklus = useRef(0); const letzterDruck = useRef<number | null>(null);
  const reduziert = useReducedMotion();
  const zyklusMs = (kurz ? 30 : 120) * 1000;
  const rhythmus = defiDa ? szenario.analysen[Math.min(analyse, szenario.analysen.length - 1)]! : null;

  // Countdown bis zur nächsten Rhythmusanalyse
  useEffect(() => {
    if (phase !== 'cpr') return;
    const t = window.setInterval(() => {
      const r = zyklusMs - (performance.now() - zyklus.current); setRest(Math.max(0, Math.ceil(r / 1000)));
      if (r <= 0) {
        setDefiDa(true); setPhase('analyse'); setBeatmen(false); setZaehler(0);
        setMeldung({ text: analyse === 0 ? 'Der Defibrillator ist da, die Pads kleben. „Analyse: Patient nicht berühren!“' : '2 Minuten um: Rhythmusanalyse. Hände weg vom Patienten.', art: 'info' });
      }
    }, 250);
    return () => clearInterval(t);
  }, [phase, zyklusMs, analyse]);

  // Metronom 110/min (nur nach bewusstem Einschalten)
  useEffect(() => {
    if (!takt || (phase !== 'cpr' && phase !== 'laden')) return;
    const t = window.setInterval(() => spiele('klick', {}, { erzwingen: true }), 60000 / 110);
    return () => clearInterval(t);
  }, [takt, phase]);

  function neu(s = szenario) {
    setSzenario(s); setPhase('erkennen'); setErledigt([]); setOptionen(mischen([...ERKENNEN, ...ABLENKER])); setFalsche(0); setZaehler(0); setBeatmen(false);
    setAnalyse(0); setDefiDa(false); setEntscheidungen([]); setSchocks(0); setMedis([]); setErgebnis(null); setAktuelleRate(null);
    taps.current = []; letzterDruck.current = null; start.current = performance.now();
    setMeldung({ text: s.lage, art: 'info' });
  }

  function schritt(id: string) {
    const naechster = ERKENNEN[erledigt.length]!;
    const ablenker = ABLENKER.find(a => a.id === id);
    if (ablenker) { setFalsche(f => f + 1); setMeldung({ text: ablenker.folge, art: 'falsch' }); return; }
    if (id !== naechster.id) { setFalsche(f => f + 1); setMeldung({ text: `Noch nicht. Als Nächstes: ${naechster.label.toLowerCase()}.`, art: 'falsch' }); return; }
    const s = ERKENNEN.find(e => e.id === id)!;
    setErledigt(e => [...e, id]); setMeldung({ text: s.folge, art: 'ok' });
    if (id === 'alarm') spiele('rea-alarm');
    if (id === 'druecken') { zyklus.current = performance.now(); setRest(zyklusMs / 1000); setPhase('cpr'); }
  }

  function druecken() {
    if (beatmen || (phase !== 'cpr' && phase !== 'laden')) return;
    const jetzt = performance.now();
    taps.current.push(jetzt); letzterDruck.current = jetzt; setDruckNr(n => n + 1);
    setAktuelleRate(rate(taps.current));
    if (phase === 'laden') return; // während des Ladens weiterdrücken, ohne 30:2
    setZaehler(z => { const n = z + 1; if (n >= 30) setBeatmen(true); return n; });
  }

  function beatmet() { setBeatmen(false); setZaehler(0); setMeldung({ text: '2 Beatmungen mit Beutel und Maske, je etwa 1 Sekunde, Brustkorb hebt sich. Sofort weiterdrücken.', art: 'ok' }); }

  function entscheide(e: Entscheidung) {
    const r = rhythmus!; const richtig = richtigeEntscheidung(r) === e;
    setEntscheidungen(x => [...x, richtig]);
    const letzte = analyse >= szenario.analysen.length - 1;
    const vorher = richtig ? 'Richtig.' : `Nicht richtig: Das ist ${RHYTHMUS_NAME[r]}.`;
    if (r === 'kammerflimmern') {
      setPhase('laden'); spiele('defi');
      setMeldung({ text: `${vorher} Schockbarer Rhythmus. Der Defi lädt: weiterdrücken, bis er bereit ist.`, art: richtig ? 'ok' : 'falsch' });
      return;
    }
    if (r === 'sinus' || letzte) { abschliessen(`${vorher} Organisierter Rhythmus, Puls tastbar, Atmung setzt ein: Wiederkehr des Spontankreislaufs (ROSC). Weiter nach ABCDE, Team übernimmt.`, richtig); return; }
    const hinweis = medikamentHinweis(szenario.analysen.slice(0, analyse + 1), schocks);
    if (hinweis) setMedis(m => [...m, hinweis]);
    setMeldung({ text: r === 'pea' ? `${vorher} Organisierter Rhythmus, aber kein Puls tastbar: PEA. Sofort weiterdrücken.` : `${vorher} Nicht schockbar. Sofort weiterdrücken.`, art: richtig ? 'ok' : 'falsch' });
    weiterNachAnalyse();
  }

  function weiterNachAnalyse() { setAnalyse(a => a + 1); zyklus.current = performance.now(); setRest(zyklusMs / 1000); setZaehler(0); setPhase('cpr'); }

  function schock() {
    spiele('richtig', {}, {});
    const n = schocks + 1; setSchocks(n);
    const hinweis = medikamentHinweis(['kammerflimmern'], n); if (hinweis) setMedis(m => [...m, hinweis]);
    setMeldung({ text: `Schock ${n} abgegeben. Ohne Pulskontrolle sofort mit Thoraxkompressionen weiter.`, art: 'ok' });
    weiterNachAnalyse();
  }

  function abschliessen(text: string, richtig?: boolean) {
    const a = auswerten({ start: start.current, ende: performance.now(), taps: taps.current, entscheidungen: richtig === undefined ? entscheidungen : [...entscheidungen, richtig], falscheSchritte: falsche });
    setErgebnis(a); setPhase('ende'); setMeldung({ text, art: 'ok' });
    void logActivity({ kind: 'uebung', severity: a.ccf >= 0.8 && a.imZiel >= 0.6 ? 'info' : 'warning', title: `Reanimationsübung: ${szenario.titel}`, detail: `Rate ${a.mittel ?? '–'}/min, ${Math.round(a.imZiel * 100)} % im Ziel, Kompressionsanteil ${Math.round(a.ccf * 100)} %` });
  }

  // Der Schockknopf wird erst nach der Ladezeit aktiv.
  const [bereit, setBereit] = useState(false);
  useEffect(() => { if (phase !== 'laden') { setBereit(false); return; } const t = window.setTimeout(() => setBereit(true), 3000); return () => clearTimeout(t); }, [phase]);

  const rateKlasse = aktuelleRate === null ? '' : aktuelleRate < ZIEL.min ? 'is-langsam' : aktuelleRate > ZIEL.max ? 'is-schnell' : 'is-gut';
  const zeiger = aktuelleRate === null ? 0 : Math.max(-60, Math.min(60, (aktuelleRate - 110) * 2));

  if (phase === 'start') return <div className="rea card">
    <h3>Reanimation üben</h3>
    <p>Du findest eine Person, die nicht reagiert. Erkenne den Kreislaufstillstand, drücke im richtigen Takt und entscheide am Defibrillator. Getippt wird auf den großen Knopf (oder mit der Leertaste): etwa zwei Kompressionen pro Sekunde.</p>
    <fieldset className="rea__wahl"><legend>Szenario</legend>
      {SZENARIEN.map(s => <label key={s.id}><input type="radio" name="rea-szenario" checked={szenario.id === s.id} onChange={() => setSzenario(s)} /> {s.titel}</label>)}
    </fieldset>
    <label className="rea__kurz"><input type="checkbox" checked={kurz} onChange={e => setKurz(e.target.checked)} /> Kurze Zyklen (30 Sekunden statt 2 Minuten bis zur Analyse)</label>
    <button type="button" className="primary" onClick={() => neu()}>Übung starten</button>
    <p className="muted">Grundlage: ERC-Leitlinien 2021 (Basismaßnahmen und erweiterte Maßnahmen, Erwachsene). Die Übung trainiert Ablauf und Takt, nicht Drucktiefe oder Handposition. Praktisches Training am Phantom bleibt nötig.</p>
  </div>;

  return <div className="rea">
    <div className="rea__buehne">
      <RaumBuehne raum="18_notaufnahme_schockraum_nacht" beschreibung="Schockraum bei Nacht: die Person liegt zugedeckt auf der Trage, das Team steht daneben.">
        {(phase === 'cpr' || phase === 'laden') && <span key={reduziert ? 0 : druckNr} className={`rea__haende ${beatmen ? 'is-pause' : ''}`} style={{ left: `${BRUST.x}%`, top: `${BRUST.y}%` }} aria-hidden="true" />}
        {defiDa && <DefiSchirm rhythmus={rhythmus} letzterDruck={letzterDruck} laedt={phase === 'laden' && !bereit} />}
        {phase === 'analyse' && <span className="rea__warnung" aria-hidden="true">Nicht berühren</span>}
      </RaumBuehne>
    </div>

    <aside className="rea__steuerung" aria-label="Reanimation">
      <div className="rea__status">
        <span className="rea__chip">{phase === 'erkennen' ? 'Erkennen' : phase === 'ende' ? 'Beendet' : `Zyklus ${analyse + 1}`}</span>
        {(phase === 'cpr') && <span className="rea__chip">Analyse in {rest} s</span>}
        {schocks > 0 && <span className="rea__chip">Schocks: {schocks}</span>}
      </div>
      {meldung && <p className={`rea__meldung is-${meldung.art}`} role="status" aria-live="polite">{meldung.text}</p>}

      {phase === 'erkennen' && <div className="rea__schritte" role="group" aria-label="Was tust du als Nächstes?">
        <ol className="rea__erledigt">{erledigt.map(id => <li key={id}>{ERKENNEN.find(e => e.id === id)!.label}</li>)}</ol>
        {optionen.filter(o => !erledigt.includes(o.id)).map(o => <button key={o.id} type="button" onClick={() => schritt(o.id)}>{o.label}</button>)}
      </div>}

      {(phase === 'cpr' || phase === 'laden') && <>
        <div className={`rea__rate ${rateKlasse}`} aria-live="off">
          <div className="rea__skala" aria-hidden="true"><span className="rea__zeiger" style={{ transform: `rotate(${zeiger}deg)` }} /></div>
          <strong>{aktuelleRate ?? '–'}<small>/min</small></strong>
          <span>{aktuelleRate === null ? 'Ziel 100–120/min' : rateKlasse === 'is-gut' ? 'im Ziel' : rateKlasse === 'is-langsam' ? 'schneller drücken' : 'langsamer drücken'}</span>
        </div>
        {beatmen
          ? <button type="button" className="primary rea__gross" onClick={beatmet}>2 Beatmungen geben</button>
          : <button type="button" className="primary rea__gross" onClick={druecken} onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!e.repeat) druecken(); } }}>
            Drücken {phase === 'cpr' && <small>{zaehler} / 30</small>}
          </button>}
        {phase === 'laden' && <button type="button" className="rea__schock" disabled={!bereit} onClick={schock}>{bereit ? '„Alle weg!“ Schock auslösen' : 'Defi lädt …'}</button>}
        <label className="rea__takt"><input type="checkbox" checked={takt} onChange={e => setTakt(e.target.checked)} /> Taktgeber 110/min (Ton)</label>
      </>}

      {phase === 'analyse' && <div className="rea__schritte" role="group" aria-label="Rhythmus einordnen">
        {(['schockbar', 'nicht-schockbar', 'organisiert'] as Entscheidung[]).map(e => <button key={e} type="button" onClick={() => entscheide(e)}>{ENTSCHEIDUNG_LABEL[e]}</button>)}
        <p className="muted">Der Rhythmus läuft am Defibrillator im Bild.{rhythmus && ` Beschreibung für Screenreader: ${rhythmus === 'kammerflimmern' ? 'unregelmäßige, chaotische Wellen ohne erkennbare Komplexe' : rhythmus === 'asystolie' ? 'nahezu flache Linie' : 'regelmäßige Kammerkomplexe'}.`}</p>
      </div>}

      {medis.length > 0 && phase !== 'ende' && <ul className="rea__medis">{medis.map(m => <li key={m}>{m}</li>)}</ul>}

      {phase === 'ende' && ergebnis && <div className="rea__ergebnis">
        <h4>Auswertung</h4>
        <dl>
          <div><dt>Bis zur 1. Kompression</dt><dd>{ergebnis.bisDruck ?? '–'} s</dd></div>
          <div><dt>Mittlere Rate</dt><dd>{ergebnis.mittel ?? '–'}/min</dd></div>
          <div><dt>Im Zielbereich</dt><dd>{Math.round(ergebnis.imZiel * 100)} %</dd></div>
          <div><dt>Kompressionsanteil</dt><dd>{Math.round(ergebnis.ccf * 100)} %</dd></div>
          <div><dt>Längste Pause</dt><dd>{ergebnis.laengstePause.toLocaleString('de-DE')} s</dd></div>
          <div><dt>Rhythmen richtig</dt><dd>{ergebnis.richtigeAnalysen} / {ergebnis.analysen}</dd></div>
        </dl>
        <ul>{hinweise(ergebnis).map(h => <li key={h}>{h}</li>)}</ul>
        <div className="rea__knoepfe"><button type="button" className="primary" onClick={() => neu()}>Noch einmal</button><button type="button" onClick={() => setPhase('start')}>Anderes Szenario</button></div>
      </div>}
      {phase !== 'ende' && <button type="button" className="ghost small" onClick={() => abschliessen('Übung abgebrochen. Die Auswertung bezieht sich auf den bisherigen Verlauf.')}>Übung beenden</button>}
    </aside>
  </div>;
}
