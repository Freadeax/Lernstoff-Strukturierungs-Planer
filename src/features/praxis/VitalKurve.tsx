import { clock, news2Of } from './engine';
import { AVPU_LABEL, NEWS2_REAKTION } from './news2';
import type { ChartPoint, Vital } from './types';

type Row = { key: Vital | 'news2'; label: string; unit: string; min: number; max: number; span: number; warn?: (n: number) => boolean };
const ROWS: Row[] = [
  { key: 'news2', label: 'NEWS2', unit: 'Punkte', min: 0, max: 15, span: 6, warn: n => n >= 5 },
  { key: 'spo2', label: 'SpO₂', unit: '%', min: 75, max: 100, span: 8, warn: n => n <= 91 },
  { key: 'resp', label: 'Atemfrequenz', unit: '/min', min: 5, max: 40, span: 10, warn: n => n <= 8 || n >= 25 },
  { key: 'pulse', label: 'Puls', unit: '/min', min: 30, max: 170, span: 30, warn: n => n <= 40 || n >= 131 },
  { key: 'sys', label: 'RR syst.', unit: 'mmHg', min: 60, max: 220, span: 40, warn: n => n <= 90 },
  { key: 'temp', label: 'Temperatur', unit: '°C', min: 34, max: 41, span: 2, warn: n => n <= 35 || n >= 39.1 },
];
const value = (p: ChartPoint, key: Row['key']) => key === 'news2' ? news2Of(p).punkte : p.vitals[key];
const de = (n: number) => new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(n);

/** NEWS2 der letzten Messung: Zahl, Risiko und übliche Reaktion. */
export function News2Badge({ point }: { point?: ChartPoint }) {
  if (!point) return <div className="praxis-news2 is-empty"><strong>NEWS2 —</strong><span>Erst nach vollständiger Messung</span></div>;
  const n = news2Of(point);
  return <div className={`praxis-news2 is-${n.risiko}`}>
    <strong>NEWS2 {n.punkte}</strong>
    <span>Risiko {n.risiko} · {AVPU_LABEL[point.avpu]}{point.oxygen ? ' · mit O₂' : ''}</span>
    <small>{NEWS2_REAKTION[n.risiko]}</small>
  </div>;
}

/** Verlaufskurve aller Messungen. Die Tabelle ist die zugängliche Fassung, die Linien sind Lesehilfe. */
export function VitalKurve({ chart, compact = false }: { chart: ChartPoint[]; compact?: boolean }) {
  if (!chart.length) return <p>Noch keine Messung im Verlauf. Jede Messung, Nachkontrolle und jede Monitor-Minute erscheint hier.</p>;
  const start = chart[0].at, end = Math.max(chart.at(-1)!.at, start + 60);
  const x = (at: number) => 4 + ((at - start) / (end - start)) * 292;
  const rows = compact ? ROWS.slice(0, 1) : ROWS;
  return <div className="praxis-kurve">
    {rows.map(r => {
      // Skala folgt den Messwerten (mit Mindestspanne), damit auch kleine Trends sichtbar werden.
      const values = chart.map(p => value(p, r.key));
      const mid = (Math.min(...values) + Math.max(...values)) / 2, half = Math.max(r.span, Math.max(...values) - Math.min(...values)) / 2 * 1.2;
      const lo = Math.max(r.min, mid - half), hi = Math.min(r.max, Math.max(lo + r.span, mid + half));
      const y = (n: number) => 34 - ((Math.min(hi, Math.max(lo, n)) - lo) / (hi - lo)) * 30;
      const last = value(chart.at(-1)!, r.key);
      return <div className="praxis-kurve__row" key={r.key}>
        <span className="praxis-kurve__label">{r.label}<strong className={r.warn?.(last) ? 'is-warn' : ''}>{de(last)} <small>{r.unit}</small></strong></span>
        <svg viewBox="0 0 300 38" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          {r.key === 'news2' && hi > 5 && <rect x="0" y={y(hi)} width="300" height={y(Math.max(5, lo)) - y(hi)} className="praxis-kurve__zone" />}
          <polyline points={chart.map(p => `${x(p.at)},${y(value(p, r.key))}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
          {chart.map((p, i) => <circle key={i} cx={x(p.at)} cy={y(value(p, r.key))} r="2.2" className={r.warn?.(value(p, r.key)) ? 'is-warn' : ''} />)}
        </svg>
      </div>;
    })}
    {!compact && <details><summary>Messwerte als Tabelle ({chart.length})</summary><div className="praxis-kurve__table"><table>
      <thead><tr><th scope="col">Zeit</th><th scope="col">NEWS2</th><th scope="col">ACVPU</th><th scope="col">O₂</th><th scope="col">SpO₂</th><th scope="col">AF</th><th scope="col">Puls</th><th scope="col">RR</th><th scope="col">Temp.</th><th scope="col">BZ</th></tr></thead>
      <tbody>{[...chart].reverse().map((p, i) => <tr key={i}><td>{clock(p.at)}</td><td>{news2Of(p).punkte}</td><td>{p.avpu}</td><td>{p.oxygen ? 'ja' : 'nein'}</td><td>{p.vitals.spo2}</td><td>{p.vitals.resp}</td><td>{p.vitals.pulse}</td><td>{p.vitals.sys}/{p.vitals.dia}</td><td>{de(p.vitals.temp)}</td><td>{p.vitals.glucose}</td></tr>)}</tbody>
    </table></div></details>}
  </div>;
}
