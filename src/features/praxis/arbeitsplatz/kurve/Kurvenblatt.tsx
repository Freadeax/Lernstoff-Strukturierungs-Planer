// Praxissimulator neu – Kurvenblatt (P12 Verlaufskurve im Spiel, P13 Kurvenblatt der Akte).
// Spuren wie im Papier-Kurvenblatt: RR als Pfeile ↕ (Systole oben, Diastole unten) mit Puls als Punkte,
// Temperatur, SpO₂, Atemfrequenz, BZ, Schmerz. Eigene Messungen als Punkte, Vorwerte hohl,
// Gerätewerte (Monitor/Pulsoxy) als dünne Linie, darüber Markierungen (Handlungen, Anordnungen, Ereignisse …).
// Achse 'zeit': linear über die Spielzeit. Achse 'blatt': gleich breite Spalten je Zeitpunkt (Vorwerte mit Label).
// Die Grafik ist für Sehende; dieselben Daten stehen als Tabelle und Liste darunter (barrierefrei).

import { useEffect, useMemo, useRef, useState } from 'react';
import type { KurvenWert } from '../../kern/typen';
import { uhrzeit } from '../ansicht';
import type { KurvenDaten, KurvenMarke, KurvenPunkt } from './kurvendaten';
import './kurve.css';

export type SpurId = 'kreislauf' | 'temp' | 'spo2' | 'af' | 'bz' | 'schmerz';

interface Spur { id: SpurId; titel: string; einheit: string; werte: KurvenWert[]; min: number; max: number; hoehe: number; raster: number[] }

export const SPUREN: readonly Spur[] = [
  { id: 'kreislauf', titel: 'RR ↕ / Puls ●', einheit: 'mmHg · /min', werte: ['rrSys', 'rrDia', 'hf'], min: 40, max: 200, hoehe: 150, raster: [60, 100, 140, 180] },
  { id: 'temp', titel: 'Temperatur', einheit: '°C', werte: ['temp'], min: 35.5, max: 40.5, hoehe: 84, raster: [36, 37, 38, 39, 40] },
  { id: 'spo2', titel: 'SpO₂', einheit: '%', werte: ['spo2'], min: 84, max: 100, hoehe: 52, raster: [90, 95] },
  { id: 'af', titel: 'Atemfrequenz', einheit: '/min', werte: ['af'], min: 4, max: 36, hoehe: 52, raster: [12, 20, 30] },
  { id: 'bz', titel: 'Blutzucker', einheit: 'mg/dl', werte: ['bz'], min: 40, max: 300, hoehe: 52, raster: [70, 140, 200] },
  { id: 'schmerz', titel: 'Schmerz', einheit: 'NRS 0–10', werte: ['schmerz'], min: 0, max: 10, hoehe: 44, raster: [3, 6] },
];

const MARKE_TEXT: Record<KurvenMarke['art'], string> = {
  handlung: 'Handlung', anordnung: 'Anordnung', ereignis: 'Ereignis', alarm: 'Alarm', verlauf: 'Zustand', nachricht: 'Nachricht', doku: 'Dokumentation',
};

const de = (n: number, stellen = 0) => n.toLocaleString('de-DE', { minimumFractionDigits: stellen, maximumFractionDigits: stellen });
const fmt = (k: KurvenWert, n: number) => de(n, k === 'temp' ? 1 : 0);

export interface KurvenblattProps {
  daten: KurvenDaten;
  startUhrzeit: string;
  /** feste Spurenauswahl (sonst: alle Spuren mit Daten) */
  spuren?: readonly SpurId[];
  achse?: 'zeit' | 'blatt';
  /** Überschrift der Grafik für Screenreader */
  titel?: string;
  /** Marken-Leiste ausblenden (z. B. Akte) */
  ohneMarken?: boolean;
}

export function Kurvenblatt({ daten, startUhrzeit, spuren, achse = 'zeit', titel = 'Verlaufskurve', ohneMarken }: KurvenblattProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [breite, setBreite] = useState(560);
  const [wahl, setWahl] = useState<{ t: number; text: string } | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([e]) => { if (e) setBreite(Math.max(160, Math.round(e.contentRect.width))); });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const alle = useMemo(() => [...daten.punkte, ...daten.monitor], [daten]);
  const aktiv = useMemo(() => SPUREN.filter((s) => (spuren ? spuren.includes(s.id) : alle.some((p) => s.werte.some((k) => p.werte[k] !== undefined)))), [alle, spuren]);
  const x = useMemo(() => xAchse(daten, achse, breite), [daten, achse, breite]);
  const uhr = (p: { t: number; label?: string }) => p.label ?? uhrzeit(startUhrzeit, Math.max(0, p.t));
  const marken = ohneMarken ? [] : daten.marken;

  return <figure className="kb" aria-label={titel}>
    <div className="kb__raster" ref={ref}>
      {marken.length > 0 && <div className="kb__zeile">
        <span className="kb__label">Was geschah <small>{marken.length} Einträge · antippen für Details</small></span>
        <svg className="kb__marken" width={breite} height={26} aria-hidden="true" focusable="false">
          {marken.map((m, i) => <g key={i} className={`kb-marke is-${m.art}${m.wichtig ? ' is-wichtig' : ''}${m.ausgefuehrt === false ? ' is-nicht' : ''}`}
            onClick={() => setWahl({ t: m.t, text: `${MARKE_TEXT[m.art]}: ${m.text}` })}>
            <rect x={x.pos(m.t) - 6} y={0} width={12} height={26} fill="transparent" />
            {m.art === 'verlauf' || m.art === 'ereignis' || m.art === 'alarm'
              ? <path d={`M${x.pos(m.t)} 6 l5 9 h-10 z`} />
              : <line x1={x.pos(m.t)} x2={x.pos(m.t)} y1={6} y2={24} />}
          </g>)}
        </svg>
      </div>}
      {aktiv.map((s) => <SpurZeile key={s.id} spur={s} daten={daten} x={x} breite={breite}
        onWahl={(p, k) => setWahl({ t: p.t, text: `${s.titel.replace(/ ↕.*$/, '')}: ${k === 'rrSys' ? `${fmt('rrSys', p.werte.rrSys!)}/${p.werte.rrDia !== undefined ? fmt('rrDia', p.werte.rrDia) : '–'}` : fmt(k, p.werte[k]!)} ${s.einheit.split(' · ')[k === 'hf' ? 1 : 0] ?? ''} (${p.quelle === 'vorwert' ? 'Vorwert' : p.quelle === 'monitor' ? 'Gerät' : 'gemessen'})` })} />)}
      {!aktiv.length && <p className="kb__leer muted">Noch keine Werte. Miss etwas, dann erscheint es hier als Punkt.</p>}
      <div className="kb__achse" aria-hidden="true" style={{ width: breite }}>
        {x.ticks.map((tk, i) => <span key={i} style={{ left: tk.pos }}>{tk.label ?? uhrzeit(startUhrzeit, Math.max(0, tk.t))}</span>)}
      </div>
    </div>
    {wahl && <p className="kb__wahl" aria-live="polite"><time>{uhrzeit(startUhrzeit, Math.max(0, wahl.t))}</time> {wahl.text}</p>}
    <figcaption className="kb__legende">
      <span><i className="kb-sym kb-sym--punkt" aria-hidden="true" /> gemessen</span>
      {daten.punkte.some((p) => p.quelle === 'vorwert') && <span><i className="kb-sym kb-sym--hohl" aria-hidden="true" /> Vorwert</span>}
      {daten.monitor.length > 0 && <span><i className="kb-sym kb-sym--linie" aria-hidden="true" /> laufendes Gerät</span>}
      {marken.length > 0 && <span><i className="kb-sym kb-sym--marke" aria-hidden="true" /> eigene Handlung</span>}
      {marken.length > 0 && <span><i className="kb-sym kb-sym--dreieck" aria-hidden="true" /> Ereignis, Alarm, Zustand</span>}
    </figcaption>
    <details className="kb__tabelle">
      <summary>Werte als Tabelle ({daten.punkte.length})</summary>
      {daten.punkte.length ? <div className="kb__scroll"><table>
        <thead><tr><th scope="col">Zeit</th>{(['rrSys', 'hf', 'temp', 'spo2', 'af', 'bz', 'schmerz'] as const).map((k) => <th scope="col" key={k}>{SPALTE[k]}</th>)}</tr></thead>
        <tbody>{daten.punkte.map((p, i) => <tr key={i} className={`is-${p.quelle}`}>
          <th scope="row">{uhr(p)}{p.quelle === 'vorwert' ? ' (Vorwert)' : ''}{p.kuerzel ? ` · ${p.kuerzel}` : ''}</th>
          {(['rrSys', 'hf', 'temp', 'spo2', 'af', 'bz', 'schmerz'] as const).map((k) => <td key={k}>{p.werte[k] === undefined ? '–' : k === 'rrSys' ? `${fmt(k, p.werte.rrSys!)}/${p.werte.rrDia !== undefined ? fmt('rrDia', p.werte.rrDia) : '–'}` : fmt(k, p.werte[k]!)}</td>)}
        </tr>)}</tbody>
      </table></div> : <p className="muted">Noch keine eigenen Messungen.</p>}
    </details>
  </figure>;
}

const SPALTE: Record<'rrSys' | 'hf' | 'temp' | 'spo2' | 'af' | 'bz' | 'schmerz', string> = {
  rrSys: 'RR', hf: 'Puls', temp: 'Temp', spo2: 'SpO₂', af: 'AF', bz: 'BZ', schmerz: 'Schmerz',
};

/* ─────────────────────────── Achse ─────────────────────────── */

interface XAchse { pos: (t: number) => number; ticks: Array<{ t: number; pos: number; label?: string }> }

const RAND = 10;

function xAchse(d: KurvenDaten, art: 'zeit' | 'blatt', breite: number): XAchse {
  const innen = Math.max(40, breite - 2 * RAND);
  if (art === 'blatt') {
    // Spalten: jeder Zeitpunkt mit Messung/Vorwert, dazu „jetzt“
    const ts = [...new Set([...d.punkte.map((p) => p.t), d.ende])].sort((a, b) => a - b);
    const labels = new Map(d.punkte.filter((p) => p.label).map((p) => [p.t, p.label!]));
    const n = ts.length;
    const sp = innen / Math.max(1, n);
    const mitte = (i: number) => RAND + sp * (i + 0.5);
    const pos = (t: number) => {
      if (t <= ts[0]!) return mitte(0);
      for (let i = 1; i < n; i++) {
        if (t <= ts[i]!) return mitte(i - 1) + ((t - ts[i - 1]!) / Math.max(1, ts[i]! - ts[i - 1]!)) * sp;
      }
      return mitte(n - 1);
    };
    const jeder = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(innen / 64))));
    return { pos, ticks: ts.flatMap((t, i) => (i % jeder === 0 || i === n - 1 ? [{ t, pos: mitte(i), label: labels.get(t) }] : [])) };
  }
  const t0 = Math.min(0, ...d.punkte.map((p) => p.t));
  const t1 = Math.max(d.ende, 60);
  const pos = (t: number) => RAND + ((t - t0) / Math.max(1, t1 - t0)) * innen;
  const minuten = (t1 - t0) / 60;
  const schritt = [1, 2, 5, 10, 15, 30, 60, 120].find((s) => minuten / s <= Math.max(2, Math.floor(innen / 70))) ?? 240;
  const ticks: XAchse['ticks'] = [];
  for (let m = Math.ceil(t0 / 60 / schritt) * schritt; m * 60 <= t1; m += schritt) ticks.push({ t: m * 60, pos: pos(m * 60) });
  return { pos, ticks };
}

/* ─────────────────────────── Spur ─────────────────────────── */

function bereich(s: Spur, punkte: readonly KurvenPunkt[]): [number, number] {
  let lo = s.min, hi = s.max;
  for (const p of punkte) for (const k of s.werte) { const w = p.werte[k]; if (w !== undefined) { lo = Math.min(lo, w); hi = Math.max(hi, w); } }
  const pad = (hi - lo) * 0.04;
  return lo === s.min && hi === s.max ? [lo, hi] : [lo - pad, hi + pad];
}

function SpurZeile({ spur, daten, x, breite, onWahl }: {
  spur: Spur; daten: KurvenDaten; x: XAchse; breite: number;
  onWahl: (p: KurvenPunkt, k: KurvenWert) => void;
}) {
  const h = spur.hoehe;
  const [lo, hi] = bereich(spur, [...daten.punkte, ...daten.monitor]);
  const y = (w: number) => 4 + (1 - (w - lo) / (hi - lo)) * (h - 8);
  const linie = (liste: readonly KurvenPunkt[], k: KurvenWert) => liste.flatMap((p) => (p.werte[k] === undefined ? [] : [`${x.pos(p.t).toFixed(1)},${y(p.werte[k]!).toFixed(1)}`])).join(' ');
  const gemessen = daten.punkte.filter((p) => spur.werte.some((k) => p.werte[k] !== undefined));
  const letzter = [...gemessen, ...daten.monitor].filter((p) => p.werte[spur.werte[0]!] !== undefined).sort((a, b) => a.t - b.t).at(-1);
  return <div className="kb__zeile">
    <span className="kb__label">
      {spur.titel}
      {letzter && <strong>{spur.id === 'kreislauf' && letzter.werte.rrSys !== undefined ? `${fmt('rrSys', letzter.werte.rrSys)}/${letzter.werte.rrDia !== undefined ? fmt('rrDia', letzter.werte.rrDia) : '–'}` : fmt(spur.werte[0]!, letzter.werte[spur.werte[0]!]!)}</strong>}
      <small>{spur.einheit}</small>
    </span>
    <svg width={breite} height={h} aria-hidden="true" focusable="false" className={`kb-spur is-${spur.id}`}>
        {spur.raster.filter((r) => r > lo && r < hi).map((r) => <g key={r} className="kb-raster">
          <line x1={0} x2={breite} y1={y(r)} y2={y(r)} /><text x={2} y={y(r) - 2}>{de(r)}</text>
        </g>)}
        <line className="kb-jetzt" x1={x.pos(daten.ende)} x2={x.pos(daten.ende)} y1={0} y2={h} />
        {/* Gerätewerte als Linie */}
        {spur.werte.map((k) => daten.monitor.some((p) => p.werte[k] !== undefined) &&
          <polyline key={`m-${k}`} className={`kb-monitor is-${k}`} points={linie(daten.monitor, k)} />)}
        {/* Messungen verbunden */}
        {spur.werte.filter((k) => k !== 'rrDia' && k !== 'rrSys').map((k) => <polyline key={`l-${k}`} className={`kb-verbindung is-${k}`} points={linie(gemessen, k)} />)}
        {gemessen.map((p, i) => <g key={i} className={`kb-punkt is-${p.quelle}`}>
          {spur.id === 'kreislauf' && p.werte.rrSys !== undefined && <RrPfeil x={x.pos(p.t)} ys={y(p.werte.rrSys)} yd={p.werte.rrDia !== undefined ? y(p.werte.rrDia) : undefined} onClick={() => onWahl(p, 'rrSys')} />}
          {spur.werte.filter((k) => k !== 'rrSys' && k !== 'rrDia' && p.werte[k] !== undefined).map((k) =>
            <circle key={k} className={`is-${k}`} cx={x.pos(p.t)} cy={y(p.werte[k]!)} r={4} onClick={() => onWahl(p, k)} />)}
        </g>)}
      </svg>
  </div>;
}

/** RR wie im Kurvenblatt: Pfeilspitze nach unten an der Systole, nach oben an der Diastole, dazwischen ein Strich. */
function RrPfeil({ x, ys, yd, onClick }: { x: number; ys: number; yd?: number; onClick: () => void }) {
  return <g className="kb-rr" onClick={onClick}>
    <rect x={x - 7} y={ys - 6} width={14} height={(yd ?? ys) - ys + 12} fill="transparent" />
    {yd !== undefined && <line x1={x} x2={x} y1={ys} y2={yd} />}
    <path d={`M${x - 5} ${ys - 6} L${x} ${ys} L${x + 5} ${ys - 6}`} />
    {yd !== undefined && <path d={`M${x - 5} ${yd + 6} L${x} ${yd} L${x + 5} ${yd + 6}`} />}
  </g>;
}
