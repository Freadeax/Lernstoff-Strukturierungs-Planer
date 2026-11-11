// Reanimationsübung: Erkennen, Thoraxkompressionen im Takt (Tippen), Verhältnis je Profil (30:2, 15:2,
// 3:1), Rhythmusanalyse am Defibrillator bzw. Herzfrequenz beim Neugeborenen, Schock mit kurzer
// Unterbrechung, Auswertung von Takt, Kompressionsanteil und Pausen.

import { useEffect, useRef, useState } from 'react';
import { logActivity } from '../../core/activity';
import { FreigabeHinweis } from '../../ui/sim/FreigabeHinweis';
import { RaumBuehne } from '../../ui/sim/raeume/RaumBuehne';
import { spiele } from '../../ui/audio/spieler';
import { useReducedMotion } from '../praxis/MiniMonitor';
import { LEITLINIEN, PROFIL_FREIGABE } from './freigaben';
import {
  auswerten, beendetKompression, hinweise, medikamentHinweis, PROFIL_IDS, PROFILE, rate, RHYTHMUS_NAME, richtigeEntscheidung, schockEnergie, szenarienFuer,
  type Analyse, type Entscheidung, type ProfilId, type ReaSzenario, type Rhythmus,
} from './rea';
import { artefakt, kurve } from './rhythmus';
import './notfall.css';

type Phase = 'start' | 'erkennen' | 'cpr' | 'analyse' | 'laden' | 'ende';
/** Brustmitte des Patienten auf der Trage im Schockraumfoto bzw. des Neugeborenen in der Zeichnung (Prozent). */
const BRUST = { x: 44, y: 41 };
const BRUST_NEU = { x: 50, y: 58 };
const ENTSCHEIDUNG_LABEL: Record<Entscheidung, string> = {
  schockbar: 'Schockbar (Kammerflimmern / pulslose VT)', 'nicht-schockbar': 'Nicht schockbar (Asystolie)', organisiert: 'Organisierter Rhythmus: Puls tasten',
  'hf-unter-60': 'Unter 60/min: weiter 3:1', 'hf-60-100': '60–100/min: Kompressionen beenden, weiter beatmen', 'hf-ueber-100': 'Über 100/min: Beatmung fortsetzen, bis die Atmung reicht',
};
const PROFIL_SPEICHER = 'lernstoff.notfall.reaProfil';
function gespeichertesProfil(): ProfilId {
  try { const p = localStorage.getItem(PROFIL_SPEICHER); return PROFIL_IDS.includes(p as ProfilId) ? p as ProfilId : 'erwachsene'; } catch { return 'erwachsene'; }
}
const befundText = (a: Analyse) => typeof a === 'number' ? `Herzfrequenz ${a}/min` : RHYTHMUS_NAME[a];

/** Reanimationseinheit für Neugeborene als Zeichnung: es gibt kein passendes Foto (Wärmebett, Lampe, Monitor). */
function Waermebett({ children }: { children?: React.ReactNode }) {
  return <div className="rea-nls" role="img" aria-label="Reanimationseinheit für Neugeborene: Wärmebett mit Wärmelampe, darauf ein Neugeborenes, daneben Beatmungsbeutel und Monitor.">
    <svg viewBox="0 0 320 180" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <rect width="320" height="180" fill="#e9eef2" />
      <rect x="0" y="128" width="320" height="52" fill="#cfd8de" />
      <rect x="60" y="8" width="200" height="16" rx="6" fill="#56646f" />
      <rect x="150" y="24" width="20" height="14" fill="#56646f" />
      <path d="M90 40 L230 40 L210 52 L110 52 Z" fill="#ffcf73" opacity=".55" />
      <rect x="70" y="96" width="180" height="36" rx="8" fill="#9fb3c2" />
      <rect x="80" y="88" width="160" height="16" rx="6" fill="#ffffff" />
      <g className="rea-nls__kind">
        <ellipse cx="160" cy="100" rx="34" ry="10" fill="#f3c6b0" />
        <circle cx="122" cy="96" r="11" fill="#f3c6b0" />
        <path d="M140 100 q20 -6 40 0" stroke="#d99b86" strokeWidth="2" fill="none" />
      </g>
      <ellipse cx="108" cy="92" rx="10" ry="6" fill="#4d7ea8" opacity=".9" />
      <rect x="20" y="60" width="34" height="60" rx="4" fill="#3d4a55" />
      <rect x="256" y="58" width="52" height="40" rx="4" fill="#2b3640" />
      <rect x="282" y="98" width="4" height="34" fill="#56646f" />
    </svg>
    {children}
  </div>;
}

function mischen<T>(a: T[]): T[] { return a.map(x => [Math.random(), x] as const).sort((p, q) => p[0] - q[0]).map(p => p[1]); }

/** Bildschirm des Defibrillators: Rhythmus als Sweep, Kompressionsartefakte beim Drücken. */
function DefiSchirm({ befund, letzterDruck, laedt }: { befund: Analyse | null; letzterDruck: React.RefObject<number | null>; laedt: boolean }) {
  // Neugeborene: EKG-Monitor mit Herzfrequenz statt Defibrillator. Die Kurve nutzt den Sinusschlag, verlangsamt auf die HF.
  const hf = typeof befund === 'number' ? befund : null;
  const rhythmus: Rhythmus | null = befund === null ? null : hf !== null ? 'sinus' : befund as Rhythmus;
  const zeitfaktor = hf ? hf / 80 : 1;
  const canvas = useRef<HTMLCanvasElement>(null);
  const reduziert = useReducedMotion();
  useEffect(() => {
    const c = canvas.current; const ctx = c?.getContext('2d'); if (!c || !ctx) return;
    const b = 320, h = 120; c.width = b * 2; c.height = h * 2; ctx.setTransform(2, 0, 0, 2, 0, 0);
    ctx.fillStyle = '#05100e'; ctx.fillRect(0, 0, b, h);
    const y = (v: number) => h * 0.55 - v * h * 0.33;
    const zeichneStill = () => {
      ctx.fillStyle = '#05100e'; ctx.fillRect(0, 0, b, h); ctx.strokeStyle = '#7dff9b'; ctx.lineWidth = 1.6; ctx.beginPath();
      for (let x = 0; x <= b; x++) { const v = rhythmus ? kurve(rhythmus, x / 80 * zeitfaktor) : 0; x ? ctx.lineTo(x, y(v)) : ctx.moveTo(x, y(v)); }
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
        const d = letzterDruck.current; const v = kurve(rhythmus, t * zeitfaktor) + artefakt(t, d === null ? null : d / 1000);
        ctx.fillStyle = '#05100e'; ctx.fillRect(x, 0, 10, h);
        ctx.strokeStyle = '#7dff9b'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x, alt); ctx.lineTo(x + 1, y(v)); ctx.stroke();
        alt = y(v); x = (x + 1) % b; if (x === 0) alt = y(v);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [rhythmus, reduziert, letzterDruck, zeitfaktor]);
  return <div className={`rea-defi ${laedt ? 'is-laedt' : ''} ${hf !== null ? 'is-monitor' : ''}`} aria-hidden="true">
    <div className="rea-defi__kopf">{hf !== null ? <><span>EKG</span><span>HF {hf}/min</span></> : <><span>DEFI</span><span>{laedt ? 'LADEN …' : rhythmus ? 'ANALYSE' : 'PADS'}</span></>}</div>
    <canvas ref={canvas} className="rea-defi__schirm" />
  </div>;
}

export function Reanimation() {
  const [phase, setPhase] = useState<Phase>('start');
  const [profilId, setProfilId] = useState<ProfilId>(gespeichertesProfil);
  const profil = PROFILE[profilId];
  const [szenario, setSzenario] = useState<ReaSzenario>(() => szenarienFuer(profilId)[0]!);
  const [kurz, setKurz] = useState(true);
  const [takt, setTakt] = useState(false);
  const [erledigt, setErledigt] = useState<string[]>([]);
  const [optionen, setOptionen] = useState(() => mischen([...profil.erkennen, ...profil.ablenker]));
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
  const sp = PROFILE[szenario.profil];
  const zyklusMs = (kurz ? sp.kurzSek : sp.zyklusSek) * 1000;
  const befund: Analyse | null = defiDa ? szenario.analysen[Math.min(analyse, szenario.analysen.length - 1)]! : null;
  const ZIEL = sp.ziel;

  // Countdown bis zur nächsten Rhythmusanalyse
  useEffect(() => {
    if (phase !== 'cpr') return;
    const t = window.setInterval(() => {
      const r = zyklusMs - (performance.now() - zyklus.current); setRest(Math.max(0, Math.ceil(r / 1000)));
      if (r <= 0) {
        setDefiDa(true); setPhase('analyse'); setBeatmen(false); setZaehler(0);
        setMeldung({ text: !sp.defi
          ? `${sp.zyklusSek} Sekunden um: Herzfrequenz prüfen (Stethoskop oder EKG). Wie geht es weiter?`
          : analyse === 0 ? 'Der Defibrillator ist da, die Pads kleben. „Analyse: Patient nicht berühren!“' : 'Zyklus um: Rhythmusanalyse. Hände weg vom Patienten.', art: 'info' });
      }
    }, 250);
    return () => clearInterval(t);
  }, [phase, zyklusMs, analyse, sp]);

  // Metronom 110/min (nur nach bewusstem Einschalten)
  useEffect(() => {
    if (!takt || (phase !== 'cpr' && phase !== 'laden')) return;
    const t = window.setInterval(() => spiele('klick', {}, { erzwingen: true }), 60000 / (PROFILE[szenario.profil].beatmungImTakt ? 120 : 110));
    return () => clearInterval(t);
  }, [takt, phase, szenario.profil]);

  function waehleProfil(p: ProfilId) {
    setProfilId(p); setSzenario(szenarienFuer(p)[0]!);
    try { localStorage.setItem(PROFIL_SPEICHER, p); } catch { /* nur Komfort */ }
  }

  function neu(s = szenario) {
    const pr = PROFILE[s.profil];
    setSzenario(s); setPhase('erkennen'); setErledigt([]); setOptionen(mischen([...pr.erkennen, ...pr.ablenker])); setFalsche(0); setZaehler(0); setBeatmen(false);
    setAnalyse(0); setDefiDa(false); setEntscheidungen([]); setSchocks(0); setMedis([]); setErgebnis(null); setAktuelleRate(null);
    taps.current = []; letzterDruck.current = null; start.current = performance.now();
    setMeldung({ text: s.lage, art: 'info' });
  }

  function schritt(id: string) {
    const naechster = sp.erkennen[erledigt.length]!;
    const ablenker = sp.ablenker.find(a => a.id === id);
    if (ablenker) { setFalsche(f => f + 1); setMeldung({ text: ablenker.folge, art: 'falsch' }); return; }
    if (id !== naechster.id) { setFalsche(f => f + 1); setMeldung({ text: `Noch nicht. Als Nächstes: ${naechster.label.toLowerCase()}.`, art: 'falsch' }); return; }
    const s = sp.erkennen.find(e => e.id === id)!;
    setErledigt(e => [...e, id]); setMeldung({ text: s.folge, art: 'ok' });
    if (id === 'alarm' || (id === 'hilfe' && sp.id === 'kinder')) spiele('rea-alarm');
    if (id === 'druecken') { zyklus.current = performance.now(); setRest(zyklusMs / 1000); setPhase('cpr'); }
  }

  function druecken() {
    if (beatmen || (phase !== 'cpr' && phase !== 'laden')) return;
    const jetzt = performance.now();
    taps.current.push(jetzt); letzterDruck.current = jetzt; setDruckNr(n => n + 1);
    setAktuelleRate(rate(taps.current));
    if (phase === 'laden') return; // während des Ladens weiterdrücken, ohne 30:2
    setZaehler(z => { const n = z + 1; if (n >= sp.druck) setBeatmen(true); return n; });
  }

  function beatmet() {
    setBeatmen(false); setZaehler(0);
    if (sp.beatmungImTakt) {
      // 3:1: die Beatmung gehört zum Takt (etwa 120 Ereignisse/min), keine Unterbrechung.
      const jetzt = performance.now(); taps.current.push(jetzt); setAktuelleRate(rate(taps.current));
      return;
    }
    setMeldung({ text: `2 Beatmungen mit Beutel und Maske, je etwa 1 Sekunde, Brustkorb hebt sich. Sofort weiterdrücken (${sp.druck}:2).`, art: 'ok' });
  }

  function entscheide(e: Entscheidung) {
    const r = befund!; const richtig = richtigeEntscheidung(r) === e;
    setEntscheidungen(x => [...x, richtig]);
    const letzte = analyse >= szenario.analysen.length - 1;
    const vorher = richtig ? 'Richtig.' : `Nicht richtig: Das ist ${befundText(r)}.`;
    if (r === 'kammerflimmern') {
      setPhase('laden'); spiele('defi');
      setMeldung({ text: `${vorher} Schockbarer Rhythmus. Der Defi lädt (${schockEnergie(sp.id, szenario.gewichtKg)}): weiterdrücken, bis er bereit ist.`, art: richtig ? 'ok' : 'falsch' });
      return;
    }
    if (beendetKompression(r) || letzte) {
      abschliessen(typeof r === 'number'
        ? `${vorher} Herzfrequenz ${r}/min: Kompressionen beenden, Beatmung fortsetzen, bis die Herzfrequenz über 100/min liegt und das Kind ausreichend atmet. Das Neonatologieteam übernimmt.`
        : `${vorher} Organisierter Rhythmus, Puls tastbar, Atmung setzt ein: Wiederkehr des Spontankreislaufs (ROSC). Weiter nach ABCDE, Team übernimmt.`, richtig);
      return;
    }
    const hinweis = medikamentHinweis(szenario.analysen.slice(0, analyse + 1), schocks, sp.id, szenario.gewichtKg);
    if (hinweis) setMedis(m => [...m, hinweis]);
    setMeldung({ text: typeof r === 'number' ? `${vorher} Herzfrequenz ${r}/min, weiter unter 60: Kompressionen 3:1 fortsetzen, Sauerstoff 100 %.`
      : r === 'pea' ? `${vorher} Organisierter Rhythmus, aber kein Puls tastbar: PEA. Sofort weiterdrücken.` : `${vorher} Nicht schockbar. Sofort weiterdrücken.`, art: richtig ? 'ok' : 'falsch' });
    weiterNachAnalyse();
  }

  function weiterNachAnalyse() { setAnalyse(a => a + 1); zyklus.current = performance.now(); setRest(zyklusMs / 1000); setZaehler(0); setPhase('cpr'); }

  function schock() {
    spiele('richtig', {}, {});
    const n = schocks + 1; setSchocks(n);
    const hinweis = medikamentHinweis(['kammerflimmern'], n, sp.id, szenario.gewichtKg); if (hinweis) setMedis(m => [...m, hinweis]);
    setMeldung({ text: `Schock ${n} abgegeben. Ohne Pulskontrolle sofort mit Thoraxkompressionen weiter.`, art: 'ok' });
    weiterNachAnalyse();
  }

  function abschliessen(text: string, richtig?: boolean) {
    const a = auswerten({ start: start.current, ende: performance.now(), taps: taps.current, entscheidungen: richtig === undefined ? entscheidungen : [...entscheidungen, richtig], falscheSchritte: falsche, ziel: sp.ziel });
    setErgebnis(a); setPhase('ende'); setMeldung({ text, art: 'ok' });
    void logActivity({ kind: 'uebung', severity: a.ccf >= 0.8 && a.imZiel >= 0.6 ? 'info' : 'warning', title: `Reanimationsübung (${sp.titel}): ${szenario.titel}`, detail: `Takt ${a.mittel ?? '–'}/min, ${Math.round(a.imZiel * 100)} % im Ziel, Kompressionsanteil ${Math.round(a.ccf * 100)} %` });
  }

  // Der Schockknopf wird erst nach der Ladezeit aktiv.
  const [bereit, setBereit] = useState(false);
  useEffect(() => { if (phase !== 'laden') { setBereit(false); return; } const t = window.setTimeout(() => setBereit(true), 3000); return () => clearTimeout(t); }, [phase]);

  const rateKlasse = aktuelleRate === null ? '' : aktuelleRate < ZIEL.min ? 'is-langsam' : aktuelleRate > ZIEL.max ? 'is-schnell' : 'is-gut';
  const mitte = (ZIEL.min + ZIEL.max) / 2;
  const zeiger = aktuelleRate === null ? 0 : Math.max(-60, Math.min(60, (aktuelleRate - mitte) * 2));

  if (phase === 'start') return <div className="rea card">
    <h3>Reanimation üben</h3>
    <p>Du findest eine Person, die nicht reagiert. Erkenne den Kreislaufstillstand, drücke im richtigen Takt und entscheide, wie es weitergeht. Getippt wird auf den großen Knopf (oder mit der Leertaste).</p>
    <fieldset className="rea__wahl rea__profile"><legend>Profil</legend>
      {PROFIL_IDS.map(p => <label key={p}><input type="radio" name="rea-profil" checked={profilId === p} onChange={() => waehleProfil(p)} /> <strong>{PROFILE[p].titel}</strong> <small className="muted">{PROFILE[p].kurz}</small></label>)}
    </fieldset>
    <FreigabeHinweis freigabe={PROFIL_FREIGABE[profilId]} ort="start" />
    <fieldset className="rea__wahl"><legend>Szenario</legend>
      {szenarienFuer(profilId).map(s => <label key={s.id}><input type="radio" name="rea-szenario" checked={szenario.id === s.id} onChange={() => setSzenario(s)} /> {s.titel}</label>)}
    </fieldset>
    {profil.zyklusSek !== profil.kurzSek && <label className="rea__kurz"><input type="checkbox" checked={kurz} onChange={e => setKurz(e.target.checked)} /> Kurze Zyklen ({profil.kurzSek} Sekunden statt {profil.zyklusSek / 60} Minuten bis zur Analyse)</label>}
    <button type="button" className="primary" onClick={() => neu()}>Übung starten</button>
    <p className="muted rea__leitlinie">Leitlinienstand: {LEITLINIEN[profilId].map(q => `${q.titel} (${q.stand})`).join('; ')}. Technik: {profil.technik} Die Übung trainiert Ablauf und Takt, nicht Drucktiefe oder Handposition. Praktisches Training am Phantom bleibt nötig.</p>
  </div>;

  function buehnenInhalt(brust: { x: number; y: number }, klein: boolean) {
    return <>
      {(phase === 'cpr' || phase === 'laden') && <span key={reduziert ? 0 : druckNr} className={`rea__haende ${klein ? 'is-daumen' : ''} ${beatmen ? 'is-pause' : ''}`} style={{ left: `${brust.x}%`, top: `${brust.y}%` }} aria-hidden="true" />}
      {defiDa && <DefiSchirm befund={befund} letzterDruck={letzterDruck} laedt={phase === 'laden' && !bereit} />}
      {phase === 'analyse' && sp.defi && <span className="rea__warnung" aria-hidden="true">Nicht berühren</span>}
    </>;
  }

  return <div className="rea">
    <div className="rea__buehne">
      {sp.id === 'neugeborene'
        ? <Waermebett>{buehnenInhalt(BRUST_NEU, true)}</Waermebett>
        : <RaumBuehne raum="18_notaufnahme_schockraum_nacht" beschreibung="Schockraum bei Nacht: die Person liegt zugedeckt auf der Trage, das Team steht daneben.">{buehnenInhalt(BRUST, false)}</RaumBuehne>}
    </div>

    <aside className="rea__steuerung" aria-label="Reanimation">
      <div className="rea__status">
        <span className="rea__chip">{sp.titel}</span>
        <span className="rea__chip">{phase === 'erkennen' ? 'Erkennen' : phase === 'ende' ? 'Beendet' : `Zyklus ${analyse + 1}`}</span>
        {(phase === 'cpr') && <span className="rea__chip">{sp.defi ? 'Analyse' : 'HF-Kontrolle'} in {rest} s</span>}
        {schocks > 0 && <span className="rea__chip">Schocks: {schocks}</span>}
      </div>
      {meldung && <p className={`rea__meldung is-${meldung.art}`} role="status" aria-live="polite">{meldung.text}</p>}

      {phase === 'erkennen' && <div className="rea__schritte" role="group" aria-label="Was tust du als Nächstes?">
        <ol className="rea__erledigt">{erledigt.map(id => <li key={id}>{sp.erkennen.find(e => e.id === id)!.label}</li>)}</ol>
        {optionen.filter(o => !erledigt.includes(o.id)).map(o => <button key={o.id} type="button" onClick={() => schritt(o.id)}>{o.label}</button>)}
      </div>}

      {(phase === 'cpr' || phase === 'laden') && <>
        <div className={`rea__rate ${rateKlasse}`} aria-live="off">
          <div className="rea__skala" aria-hidden="true"><span className="rea__zeiger" style={{ transform: `rotate(${zeiger}deg)` }} /></div>
          <strong>{aktuelleRate ?? '–'}<small>/min</small></strong>
          <span>{aktuelleRate === null ? `Ziel ${sp.zielText}` : rateKlasse === 'is-gut' ? 'im Ziel' : rateKlasse === 'is-langsam' ? 'schneller drücken' : 'langsamer drücken'}</span>
        </div>
        {beatmen
          ? <button type="button" className="primary rea__gross" onClick={beatmet} onKeyDown={e => { if (sp.beatmungImTakt && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); if (!e.repeat) beatmet(); } }}>{sp.beatmung === 1 ? 'Beatmen' : `${sp.beatmung} Beatmungen geben`}</button>
          : <button type="button" className="primary rea__gross" onClick={druecken} onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!e.repeat) druecken(); } }}>
            Drücken {phase === 'cpr' && <small>{zaehler} / {sp.druck}</small>}
          </button>}
        {phase === 'laden' && <button type="button" className="rea__schock" disabled={!bereit} onClick={schock}>{bereit ? '„Alle weg!“ Schock auslösen' : 'Defi lädt …'}</button>}
        <label className="rea__takt"><input type="checkbox" checked={takt} onChange={e => setTakt(e.target.checked)} /> Taktgeber {sp.beatmungImTakt ? 120 : 110}/min (Ton)</label>
      </>}

      {phase === 'analyse' && <div className="rea__schritte" role="group" aria-label={sp.defi ? 'Rhythmus einordnen' : 'Herzfrequenz einordnen'}>
        <FreigabeHinweis freigabe={PROFIL_FREIGABE[sp.id]} ort="entscheidung" />
        {sp.entscheidungen.map(e => <button key={e} type="button" onClick={() => entscheide(e)}>{ENTSCHEIDUNG_LABEL[e]}</button>)}
        <p className="muted">{typeof befund === 'number'
          ? `Am Monitor im Bild: Herzfrequenz ${befund}/min.`
          : <>Der Rhythmus läuft am Defibrillator im Bild.{befund && ` Beschreibung für Screenreader: ${befund === 'kammerflimmern' ? 'unregelmäßige, chaotische Wellen ohne erkennbare Komplexe' : befund === 'asystolie' ? 'nahezu flache Linie' : 'regelmäßige Kammerkomplexe'}.`}</>}</p>
      </div>}

      {medis.length > 0 && phase !== 'ende' && <ul className="rea__medis">{medis.map(m => <li key={m}>{m}</li>)}</ul>}

      {phase === 'ende' && ergebnis && <div className="rea__ergebnis">
        <h4>Auswertung</h4>
        <dl>
          <div><dt>Bis zur 1. Kompression</dt><dd>{ergebnis.bisDruck ?? '–'} s</dd></div>
          <div><dt>{sp.beatmungImTakt ? 'Mittlerer Takt' : 'Mittlere Rate'}</dt><dd>{ergebnis.mittel ?? '–'}/min</dd></div>
          <div><dt>Im Zielbereich</dt><dd>{Math.round(ergebnis.imZiel * 100)} %</dd></div>
          <div><dt>Kompressionsanteil</dt><dd>{Math.round(ergebnis.ccf * 100)} %</dd></div>
          <div><dt>Längste Pause</dt><dd>{ergebnis.laengstePause.toLocaleString('de-DE')} s</dd></div>
          <div><dt>{sp.defi ? 'Rhythmen richtig' : 'Herzfrequenz richtig eingeordnet'}</dt><dd>{ergebnis.richtigeAnalysen} / {ergebnis.analysen}</dd></div>
        </dl>
        <ul>{hinweise(ergebnis, sp).map(h => <li key={h}>{h}</li>)}</ul>
        <div className="rea__knoepfe"><button type="button" className="primary" onClick={() => neu()}>Noch einmal</button><button type="button" onClick={() => setPhase('start')}>Anderes Szenario</button></div>
      </div>}
      {phase !== 'ende' && <button type="button" className="ghost small" onClick={() => abschliessen('Übung abgebrochen. Die Auswertung bezieht sich auf den bisherigen Verlauf.')}>Übung beenden</button>}
    </aside>
  </div>;
}
