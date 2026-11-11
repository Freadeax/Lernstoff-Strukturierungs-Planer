// Raumfoto als Bühne für alle Simulatoren: Bild im festen Seitenverhältnis, Hotspots als echte
// Buttons, ein am Gerät verankerter Monitor (Live-Werte statt eingebrannter Zahlen) und eine
// Overlay-Ebene im selben Bezugsrahmen (Sprechblasen, Alarmrand, eigene Marker).
// Alles skaliert mit dem Bild; ein optionaler Kamerafokus zoomt per transform
// (bei „Bewegung reduzieren“ ohne Übergang).

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { PatientenMonitor } from '../PatientenMonitor';
import type { MonitorWerte } from '../monitor';
import { wenigBewegung } from '../../shell/session';
import { RAEUME, raumFuerZustand, raumUrl, type MonitorZustand, type RaumId, type Rechteck } from './katalog';
import './raeume.css';

export interface Hotspot {
  id: string;
  /** Vollständiger Name für Screenreader und Tooltip, z. B. „Monitor öffnen“. */
  label: string;
  /** Sichtbare Kurzbeschriftung im Punkt (Nummer oder kurzes Wort). Fehlt: Nummer in der Reihenfolge. */
  kurz?: string;
  /** Position relativ zum Bild (0…1). */
  x: number;
  y: number;
  /** Zustand für Umschalter (aria-pressed); fehlt = normaler Knopf. */
  gedrueckt?: boolean;
  /** Hervorheben, z. B. weil hier gerade etwas passiert. */
  aktiv?: boolean;
  onClick: () => void;
}

export type MonitorKanal = 'ekg' | 'spo2' | 'af';

export interface BuehnenMonitor {
  werte: MonitorWerte;
  zustand: MonitorZustand;
  /** Bei Signalausfall: welche Kanäle fehlen (Standard: SpO₂). EKG betrifft HF, SpO₂ betrifft Sättigung, AF die Atemkurve. */
  ausfall?: MonitorKanal[];
  titel?: string;
}

export interface RaumBuehneProps {
  raum: RaumId;
  hotspots?: Hotspot[];
  /** Live-Monitor auf der Bildschirmfläche des Raums. 'abwesend' zeigt (falls vorhanden) die Raumvariante ohne Monitor. */
  monitor?: BuehnenMonitor;
  /** Eigener Inhalt auf der Monitorfläche statt des Standardmonitors (wird ebenfalls ins Rechteck skaliert). */
  monitorInhalt?: ReactNode;
  /** Kamerafokus: Punkt (0…1) und Zoom (1 = ganzes Bild). */
  fokus?: { x: number; y: number; zoom: number };
  /** Wird gezeigt, wenn das Bild nicht lädt (z. B. offline beim ersten Aufruf). */
  fallback?: ReactNode;
  onError?: () => void;
  /** Overlay-Ebene im Bildrahmen (absolut positionieren, Prozentwerte). */
  children?: ReactNode;
  className?: string;
  /** Überschreibt die Bildbeschreibung aus dem Katalog. */
  beschreibung?: string;
}

/** Grundbreite, in der Monitorinhalt gezeichnet und dann ins Rechteck skaliert wird. */
const MONITOR_BASIS = 320;

/** Werte für den Monitor je Zustand und ausgefallenen Kanälen. */
export function monitorWerte(m: BuehnenMonitor): { werte: MonitorWerte; aktiv: boolean; ausText?: string; hinweis?: string } {
  if (m.zustand === 'standby' || m.zustand === 'abwesend') return { werte: {}, aktiv: false, ausText: m.zustand === 'standby' ? 'Standby' : 'Kein Gerät' };
  if (m.zustand === 'laeuft') return { werte: m.werte, aktiv: true };
  const aus: MonitorKanal[] = m.ausfall?.length ? m.ausfall : ['spo2'];
  const w: MonitorWerte = { ...m.werte };
  if (aus.includes('ekg')) w.puls = null;
  if (aus.includes('spo2')) w.spo2 = null;
  if (aus.includes('af')) w.af = null;
  const namen = { ekg: 'EKG', spo2: 'SpO₂', af: 'Atmung' } as const;
  return { werte: w, aktiv: true, hinweis: `Signal fehlt: ${aus.map((k) => namen[k]).join(', ')}` };
}

function MonitorFlaeche({ rechteck, children }: { rechteck: Rechteck; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [skala, setSkala] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const messen = () => setSkala(el.clientWidth / MONITOR_BASIS);
    messen();
    const ro = new ResizeObserver(messen);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // Seitenverhältnis des Rechtecks in Pixeln (Bild ist 16:9)
  const hoeheBasis = MONITOR_BASIS * (rechteck.height * 9) / (rechteck.width * 16);
  return (
    <div ref={ref} className="raum-monitor" style={{ left: `${rechteck.x * 100}%`, top: `${rechteck.y * 100}%`, width: `${rechteck.width * 100}%`, height: `${rechteck.height * 100}%` }}>
      <div className="raum-monitor__inhalt" style={{ width: MONITOR_BASIS, height: hoeheBasis, transform: `scale(${skala})`, visibility: skala ? 'visible' : 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

export function RaumBuehne({ raum, hotspots = [], monitor, monitorInhalt, fokus, fallback, onError, children, className = '', beschreibung }: RaumBuehneProps) {
  const id = raumFuerZustand(raum, monitor?.zustand);
  const r = RAEUME[id];
  const [fehler, setFehler] = useState<string | null>(null);
  useEffect(() => setFehler(null), [id]);
  const ruhig = wenigBewegung();
  const zeigeMonitor = r.monitor && (monitorInhalt || (monitor && monitor.zustand !== 'abwesend'));
  const mw = monitor && !monitorInhalt ? monitorWerte(monitor) : undefined;

  const zoom = fokus && fokus.zoom > 1 ? fokus : undefined;
  // --raum-zoom hält die Hotspots beim Hineinzoomen gleich groß (Gegenskalierung im CSS).
  const kamera = {
    transform: zoom ? `scale(${zoom.zoom})` : undefined,
    transformOrigin: zoom ? `${zoom.x * 100}% ${zoom.y * 100}%` : undefined,
    '--raum-zoom': zoom?.zoom ?? 1,
  } as CSSProperties;

  return (
    <figure className={`raum-buehne ${ruhig ? 'is-ruhig' : ''} ${className}`.trim()}>
      <div className="raum-buehne__rahmen">
        <div className="raum-buehne__kamera" style={kamera}>
          {fehler === id && fallback ? <div className="raum-buehne__fallback">{fallback}</div> : (
            <img
              className="raum-buehne__bild" src={raumUrl(id)} alt={beschreibung ?? r.beschreibung}
              width={r.breite} height={r.hoehe} loading="lazy" decoding="async"
              onError={() => { setFehler(id); onError?.(); }}
            />
          )}
          {zeigeMonitor && r.monitor && (
            <MonitorFlaeche rechteck={r.monitor}>
              {monitorInhalt ?? (mw && <PatientenMonitor werte={mw.werte} aktiv={mw.aktiv} ausText={mw.ausText} titel={mw.hinweis ?? monitor?.titel} className="raum-monitor__geraet" />)}
            </MonitorFlaeche>
          )}
          <div className="raum-buehne__overlay">{children}</div>
          {hotspots.map((h, i) => (
            <button
              key={h.id} type="button" className={`raum-hotspot ${h.aktiv ? 'is-aktiv' : ''}`}
              style={{ left: `${h.x * 100}%`, top: `${h.y * 100}%` }}
              aria-label={h.label} title={h.label} aria-pressed={h.gedrueckt}
              onClick={h.onClick}
            >
              <span aria-hidden="true">{h.kurz ?? i + 1}</span>
            </button>
          ))}
        </div>
      </div>
      <figcaption className="visually-hidden">{r.titel}</figcaption>
    </figure>
  );
}
