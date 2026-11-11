// Animierter Patientenmonitor für Praxis- und Fallsimulator.
// EKG, Pleth und Atemkurve laufen als Canvas-Sweep im Takt von Puls und Atemfrequenz,
// Zahlen gleiten auf neue Werte, Grenzwerte färben und blinken. Bei "Bewegung reduzieren"
// steht die Kurve als Standbild. Die Kurven sind Schmuck (aria-hidden), die Werte stehen als Text daneben.

import { useEffect, useRef, useState } from 'react';
import './sim.css';
import { wenigBewegung } from '../shell/session';
import { alarmProfil, alarmStufe, anzeige, atmung, ekg, gesamtAlarm, pleth, proSekunde, type Alarm, type MonitorGruppe, type MonitorWerte } from './monitor';

export type { MonitorWerte } from './monitor';

export interface PatientenMonitorProps {
  werte: MonitorWerte;
  /** Nur EKG und Zahlen, z. B. für den kleinen Bildschirm in einer Zimmerszene. */
  kompakt?: boolean;
  /** false = Monitor aus/kein Signal: dunkel, Kurven stehen. */
  aktiv?: boolean;
  /** Zeile über den Kurven, z. B. Uhrzeit oder "Letzte Messung 14:05". */
  titel?: string;
  /** Text, wenn aktiv=false (Standard „Kein Signal“), z. B. „Standby“. */
  ausText?: string;
  className?: string;
  /** Altersgruppe für die Alarmgrenzen (Standard Erwachsene). Bei Kindern zeigt der Monitor das Profil an. */
  gruppe?: MonitorGruppe;
  /** false: Werte nicht automatisch einfärben und kein Alarm, z. B. Kinderfall ohne fachliche Freigabe. */
  bewerten?: boolean;
}

// Systemeinstellung oder App-Schalter „Bewegung reduzieren“ (data-motion="reduce")
const bewegungReduziert = () => wenigBewegung();

/** Zahl gleitet in ~0,6 s auf den neuen Wert (bei reduzierter Bewegung sofort). */
function useGleitend(ziel: number | null | undefined): number | null {
  const [wert, setWert] = useState<number | null>(ziel ?? null);
  const aktuell = useRef(wert);
  useEffect(() => {
    if (ziel === null || ziel === undefined || aktuell.current === null || bewegungReduziert()) {
      aktuell.current = ziel ?? null; setWert(ziel ?? null); return;
    }
    const start = aktuell.current, t0 = performance.now();
    let id = 0;
    const schritt = (t: number) => {
      const k = Math.min(1, (t - t0) / 600), e = 1 - (1 - k) ** 3;
      aktuell.current = start + (ziel - start) * e;
      setWert(aktuell.current);
      if (k < 1) id = requestAnimationFrame(schritt);
    };
    id = requestAnimationFrame(schritt);
    return () => cancelAnimationFrame(id);
  }, [ziel]);
  return wert;
}

type Kanal = { fn: (p: number) => number; rate: () => number; amp: () => number };

/** Eine Kurvenzeile: zeichnet als Sweep von links nach rechts mit Lücke vor dem Schreibkopf. */
function Kurve({ kanal, aktiv, klasse }: { kanal: Kanal; aktiv: boolean; klasse: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const kanalRef = useRef(kanal);
  kanalRef.current = kanal;
  // Bei reduzierter Bewegung wird das Standbild neu gezeichnet, wenn sich die Frequenz ändert;
  // die laufende Animation liest die Frequenz selbst und startet dafür nicht neu.
  const standRate = bewegungReduziert() ? Math.round(kanal.rate() * 100) : -1;

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    let breite = 0, hoehe = 0, dpr = 1, farbe = '#3c3', x = 0, phase = 0, letzteY = 0, letzteZeit = 0, id = 0, frames = 0;
    const SEKUNDEN_PRO_BREITE = 4;

    const y = (wert: number) => hoehe / 2 - wert * (hoehe / 2 - 3) * kanalRef.current.amp();
    const farbeLesen = () => { farbe = getComputedStyle(canvas).color || farbe; };
    const groesse = () => {
      // Layoutgröße statt getBoundingClientRect: in einer skalierten Raumszene (transform: scale)
      // wäre die sichtbare Größe beim ersten Messen 0 und der ResizeObserver meldet keine Änderung.
      dpr = Math.min(2, window.devicePixelRatio || 1);
      breite = Math.max(1, canvas.clientWidth); hoehe = Math.max(1, canvas.clientHeight);
      canvas.width = breite * dpr; canvas.height = hoehe * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineWidth = 1.6; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      farbeLesen();
      x = 0; letzteY = y(0);
    };
    const standbild = () => {
      ctx.clearRect(0, 0, breite, hoehe);
      if (!aktiv) return;
      ctx.strokeStyle = farbe; ctx.beginPath();
      const rate = kanalRef.current.rate();
      for (let px = 0; px <= breite; px++) {
        const p = rate * (px / breite) * SEKUNDEN_PRO_BREITE;
        const yy = rate ? y(kanalRef.current.fn(p)) : hoehe / 2;
        if (px === 0) ctx.moveTo(px, yy); else ctx.lineTo(px, yy);
      }
      ctx.stroke();
    };
    const zeichne = (t: number) => {
      if (!letzteZeit) letzteZeit = t;
      const dt = Math.min(0.1, (t - letzteZeit) / 1000); letzteZeit = t;
      if (++frames % 90 === 0) farbeLesen();
      const pxProSek = breite / SEKUNDEN_PRO_BREITE;
      const rate = kanalRef.current.rate();
      const schritte = Math.max(1, Math.round(dt * pxProSek));
      ctx.strokeStyle = farbe;
      for (let i = 0; i < schritte; i++) {
        const nx = x + 1;
        phase += rate / pxProSek;
        const ny = rate ? y(kanalRef.current.fn(phase)) : hoehe / 2;
        ctx.clearRect(nx, 0, 14, hoehe);
        if (nx >= breite) { x = 0; letzteY = ny; ctx.clearRect(0, 0, 14, hoehe); continue; }
        ctx.beginPath(); ctx.moveTo(x, letzteY); ctx.lineTo(nx, ny); ctx.stroke();
        x = nx; letzteY = ny;
      }
      id = requestAnimationFrame(zeichne);
    };

    groesse();
    const reduziert = bewegungReduziert();
    if (!aktiv || reduziert) standbild(); else id = requestAnimationFrame(zeichne);
    const ro = typeof ResizeObserver === 'function'
      ? new ResizeObserver(() => { groesse(); if (!aktiv || reduziert) standbild(); else ctx.clearRect(0, 0, breite, hoehe); })
      : null;
    ro?.observe(canvas);
    return () => { cancelAnimationFrame(id); ro?.disconnect(); };
  }, [aktiv, standRate]);

  return <canvas ref={ref} className={`sim-monitor__kurve ${klasse}`} aria-hidden="true" />;
}

function Wert({ label, wert, einheit, alarm, nachkomma = 0, klasse, klein }: {
  label: string; wert: number | null | undefined; einheit?: string; alarm: Alarm; nachkomma?: number; klasse: string; klein?: string;
}) {
  const gleitend = useGleitend(wert);
  return (
    <div className={`sim-monitor__wert ${klasse} is-${alarm}`}>
      <span className="sim-monitor__label">{label}</span>
      <strong>{anzeige(gleitend, nachkomma)}</strong>
      {einheit && <small>{einheit}</small>}
      {klein && <span className="sim-monitor__klein">{klein}</span>}
    </div>
  );
}

export function PatientenMonitor({ werte, kompakt = false, aktiv = true, titel, ausText = 'Kein Signal', className = '', gruppe = 'erwachsen', bewerten = true }: PatientenMonitorProps) {
  const w = werte;
  const profil = alarmProfil(gruppe);
  const st = (p: Parameters<typeof alarmStufe>[0], n: number | null | undefined): Alarm => (aktiv && bewerten ? alarmStufe(p, n, gruppe) : 'ok');
  const alarm = aktiv && bewerten ? gesamtAlarm(w, gruppe) : 'ok';
  const spo2Amp = typeof w.spo2 === 'number' && w.spo2 < 90 ? 0.6 : 0.9;
  const kanalEkg: Kanal = { fn: ekg, rate: () => proSekunde(w.puls, 20), amp: () => 0.9 };
  const kanalPleth: Kanal = { fn: pleth, rate: () => (typeof w.spo2 === 'number' ? proSekunde(w.puls ?? 75, 20) : 0), amp: () => spo2Amp };
  const kanalAtmung: Kanal = { fn: atmung, rate: () => proSekunde(w.af, 3, 60), amp: () => 0.7 };
  const bd = typeof w.sys === 'number' ? `${anzeige(w.sys)}/${anzeige(w.dia)}` : '--/--';
  const avpu = w.avpu?.trim().toUpperCase().charAt(0) || '';

  const zusammenfassung = [
    `Herzfrequenz ${anzeige(w.puls)}`, `SpO₂ ${anzeige(w.spo2)} %`, `Atemfrequenz ${anzeige(w.af)}`,
    !kompakt && `Blutdruck ${bd}`, !kompakt && `Temperatur ${anzeige(w.temp, 1)} °C`,
    alarm === 'rot' ? 'Alarm: kritischer Wert' : alarm === 'gelb' ? 'Hinweis: auffälliger Wert' : '',
    gruppe !== 'erwachsen' && (bewerten ? profil.label : 'ohne automatische Alarmwertung'),
  ].filter(Boolean).join(', ');

  return (
    <div className={`sim-monitor ${kompakt ? 'is-kompakt' : ''} ${aktiv ? '' : 'is-aus'} is-alarm-${alarm} ${className}`.trim()} role="group" aria-label="Patientenmonitor">
      <span className="sim-sr">{aktiv ? zusammenfassung : `Monitor: ${ausText}`}</span>
      {(titel || alarm !== 'ok' || !aktiv || gruppe !== 'erwachsen') && (
        <div className="sim-monitor__kopf" aria-hidden="true">
          <span>{titel}</span>
          {gruppe !== 'erwachsen' && <span className={`sim-monitor__profil ${profil.bewertet && bewerten ? '' : 'is-offen'}`} title={profil.quelle}>{!bewerten ? 'ohne Alarmwertung' : profil.bewertet ? profil.label.replace('Alarmgrenzen ', '') : 'kein Profil'}</span>}
          {!aktiv ? <span className="sim-monitor__status">{ausText}</span>
            : alarm === 'rot' ? <span className="sim-monitor__status is-rot">Alarm</span>
              : alarm === 'gelb' ? <span className="sim-monitor__status is-gelb">Hinweis</span> : null}
        </div>
      )}
      <div className="sim-monitor__raster" aria-hidden="true">
        <div className="sim-monitor__zeile">
          <Kurve kanal={kanalEkg} aktiv={aktiv} klasse="is-ekg" />
          <Wert label="HF" wert={aktiv ? w.puls : null} einheit="/min" alarm={st('puls', w.puls)} klasse="is-ekg" />
        </div>
        {kompakt ? (
          <div className="sim-monitor__unten">
            <Wert label="SpO₂" wert={aktiv ? w.spo2 : null} einheit="%" alarm={st('spo2', w.spo2)} klasse="is-pleth" />
            <Wert label="AF" wert={aktiv ? w.af : null} einheit="/min" alarm={st('af', w.af)} klasse="is-atmung" />
          </div>
        ) : (
          <>
            <div className="sim-monitor__zeile">
              <Kurve kanal={kanalPleth} aktiv={aktiv} klasse="is-pleth" />
              <Wert label="SpO₂" wert={aktiv ? w.spo2 : null} einheit="%" alarm={st('spo2', w.spo2)} klasse="is-pleth" klein={aktiv && w.sauerstoff ? 'mit O₂' : undefined} />
            </div>
            <div className="sim-monitor__zeile">
              <Kurve kanal={kanalAtmung} aktiv={aktiv} klasse="is-atmung" />
              <Wert label="AF" wert={aktiv ? w.af : null} einheit="/min" alarm={st('af', w.af)} klasse="is-atmung" />
            </div>
            <div className="sim-monitor__unten">
              <div className={`sim-monitor__wert is-nibp is-${st('sys', w.sys)}`}>
                <span className="sim-monitor__label">NIBP</span><strong>{aktiv ? bd : '--/--'}</strong><small>mmHg</small>
              </div>
              <Wert label="Temp." wert={aktiv ? w.temp : null} einheit="°C" nachkomma={1} alarm={st('temp', w.temp)} klasse="is-temp" />
              <div className={`sim-monitor__wert is-avpu is-${aktiv && avpu && avpu !== 'A' ? 'rot' : 'ok'}`}>
                <span className="sim-monitor__label">ACVPU</span><strong>{aktiv && avpu ? avpu : '-'}</strong>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PatientenMonitor;
