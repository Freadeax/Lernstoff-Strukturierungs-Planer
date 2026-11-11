// Verlaufskurve eines Wertes (Labor oder Vitalzeichen) mit Referenzband und Ereignismarken.
// Die Linie zeichnet sich einmal von links nach rechts (bei „Bewegung reduzieren“ sofort fertig).

import { wenigBewegung } from '../../shell/session';
import './labor.css';

export interface KurvenPunkt { minute: number; wert: number }
export interface KurvenMarke { minute: number; text: string }

export interface VerlaufKurveProps {
  name: string;
  einheit: string;
  punkte: KurvenPunkt[];
  /** Referenz- bzw. Zielbereich als grünes Band. */
  band?: { min?: number; max?: number };
  format?: (v: number) => string;
  /** Beschriftung der Zeitachse. */
  zeitText: (minute: number) => string;
  /** Senkrechte Marken, z. B. Maßnahmen. */
  marken?: KurvenMarke[];
  breite?: number;
}

const standard = (v: number) => new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(v);

export function VerlaufKurve({ name, einheit, punkte, band, format = standard, zeitText, marken = [], breite = 340 }: VerlaufKurveProps) {
  if (!punkte.length) return null;
  const W = breite, H = 160, L = 46, R = 26, O = 14, U = 28;
  const werte = punkte.map((p) => p.wert);
  const alle = [...werte, ...(band?.min !== undefined ? [band.min] : []), ...(band?.max !== undefined ? [band.max] : [])];
  const lo = Math.min(...alle), hi = Math.max(...alle), pad = (hi - lo) * 0.12 || Math.abs(hi) * 0.1 || 1;
  const y = (v: number) => O + (1 - (v - (lo - pad)) / (hi - lo + 2 * pad)) * (H - O - U);
  const t0 = punkte[0]!.minute, t1 = punkte[punkte.length - 1]!.minute;
  const x = (t: number) => L + ((t - t0) / (t1 - t0 || 1)) * (W - L - R);
  const pfad = punkte.map((p, k) => `${k ? 'L' : 'M'}${x(p.minute).toFixed(1)},${y(p.wert).toFixed(1)}`).join(' ');
  const ruhig = wenigBewegung();
  // höchstens 5 Zeitbeschriftungen
  const schritt = Math.max(1, Math.ceil(punkte.length / 5));
  const achse = punkte.filter((_, k) => k % schritt === 0 || k === punkte.length - 1);
  const sichtbareMarken = marken.filter((m) => m.minute >= t0 && m.minute <= t1);
  return (
    <figure className="vk">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${name}: ${punkte.map((p) => `${zeitText(p.minute)} ${format(p.wert)}`).join(', ')} ${einheit}${sichtbareMarken.length ? `. Ereignisse: ${sichtbareMarken.map((m) => `${zeitText(m.minute)} ${m.text}`).join(', ')}` : ''}`}>
        {band && (band.min !== undefined || band.max !== undefined) && (
          <rect x={L} width={W - L - R} y={y(band.max ?? hi + pad)} height={Math.max(0, y(band.min ?? lo - pad) - y(band.max ?? hi + pad))} className="vk__band" />
        )}
        <line x1={L} x2={L} y1={O} y2={H - U} className="vk__achse" />
        <line x1={L} x2={W - R} y1={H - U} y2={H - U} className="vk__achse" />
        {sichtbareMarken.map((m, k) => (
          <g key={`${m.minute}-${k}`} className="vk__marke">
            <line x1={x(m.minute)} x2={x(m.minute)} y1={O} y2={H - U} />
            <text x={x(m.minute) + 3} y={O + 9 + (k % 3) * 11}>{k + 1}</text>
          </g>
        ))}
        {achse.map((p) => <text key={p.minute} x={x(p.minute)} y={H - 9} textAnchor="middle" className="vk__text">{zeitText(p.minute)}</text>)}
        <text x={L - 6} y={y(hi) + 4} textAnchor="end" className="vk__text">{format(hi)}</text>
        <text x={L - 6} y={y(lo) + 4} textAnchor="end" className="vk__text">{format(lo)}</text>
        <path d={pfad} className={`vk__linie ${ruhig ? '' : 'is-zeichnen'}`} pathLength={1} />
        {punkte.map((p, k) => <circle key={k} cx={x(p.minute)} cy={y(p.wert)} r={3.2} className={`vk__punkt ${ruhig ? '' : 'is-zeichnen'}`} style={ruhig ? undefined : { animationDelay: `${(k / Math.max(1, punkte.length - 1)) * 1.1}s` }} />)}
      </svg>
      <figcaption className="vk__titel">
        {name}{einheit ? ` (${einheit})` : ''}{band ? ', grün: Referenz- bzw. Zielbereich' : ''}
        {sichtbareMarken.length > 0 && <ol className="vk__marken">{sichtbareMarken.map((m, k) => <li key={k}>{k + 1}: {zeitText(m.minute)} {m.text}</li>)}</ol>}
      </figcaption>
    </figure>
  );
}

export default VerlaufKurve;
