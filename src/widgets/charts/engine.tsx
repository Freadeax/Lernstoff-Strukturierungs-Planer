// Kleine SVG-Diagramm-Engine: gestapelte Balken und Linie mit gemeinsamem Fadenkreuz.
// Liegt im Code-Chunk des Diagramm-Moduls und wird erst geladen, wenn es sichtbar wird.

import { useRef } from 'react';
import { createStore, useStore, type Store } from '../../ui/lib/store';

export interface Series { key: string; label: string; color: string; values: Array<number | null> }

export type Crosshair = Store<{ index: number | null }>;
export const createCrosshair = (): Crosshair => createStore({ index: null as number | null });

const W = 600;
const H = 160;
const PAD_TOP = 8;

interface ChartProps {
  label: string;
  days: string[];
  crosshair: Crosshair;
  onDrill?: (index: number) => void;
  format?: (v: number) => string;
  formatDay: (d: string) => string;
}

function useInteraction(n: number, crosshair: Crosshair, onDrill?: (i: number) => void) {
  const ref = useRef<HTMLDivElement>(null);
  // Auf Touch zeigt der erste Tipp den Tooltip, ein zweiter Tipp auf denselben Tag filtert.
  const tap = useRef<{ type: string; before: number | null }>({ type: 'mouse', before: null });
  const indexAt = (clientX: number) => {
    const r = ref.current!.getBoundingClientRect();
    return Math.min(n - 1, Math.max(0, Math.floor(((clientX - r.left) / r.width) * n)));
  };
  return {
    ref,
    handlers: {
      onPointerMove: (e: React.PointerEvent) => crosshair.set({ index: indexAt(e.clientX) }),
      onPointerDown: (e: React.PointerEvent) => {
        tap.current = { type: e.pointerType, before: crosshair.get().index };
        crosshair.set({ index: indexAt(e.clientX) });
      },
      onPointerLeave: (e: React.PointerEvent) => { if (e.pointerType === 'mouse') crosshair.set({ index: null }); },
      onClick: (e: React.MouseEvent) => {
        const i = indexAt(e.clientX);
        if (tap.current.type !== 'mouse' && tap.current.before !== i) return;
        onDrill?.(i);
      },
      onBlur: () => crosshair.set({ index: null }),
      onKeyDown: (e: React.KeyboardEvent) => {
        const i = crosshair.get().index;
        if (e.key === 'ArrowRight') { e.preventDefault(); crosshair.set({ index: i === null ? 0 : Math.min(n - 1, i + 1) }); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); crosshair.set({ index: i === null ? n - 1 : Math.max(0, i - 1) }); }
        else if ((e.key === 'Enter' || e.key === ' ') && i !== null) { e.preventDefault(); onDrill?.(i); }
        else if (e.key === 'Escape') crosshair.set({ index: null });
      },
    },
  };
}

function Tooltip({ index, days, series, formatDay, format }: { index: number; days: string[]; series: Series[]; formatDay: (d: string) => string; format: (v: number) => string }) {
  const left = ((index + 0.5) / days.length) * 100;
  return (
    <div className={`chart__tip${left > 60 ? ' chart__tip--left' : ''}`} style={{ left: `${left}%` }} role="status">
      <strong>{formatDay(days[index]!)}</strong>
      {series.map((s) => (
        <div key={s.key} className="chart__tip-row">
          <span className="chart__swatch" style={{ background: s.color }} aria-hidden="true" />
          {s.label}: {s.values[index] === null || s.values[index] === undefined ? '–' : format(s.values[index]!)}
        </div>
      ))}
    </div>
  );
}

function AxisLabels({ days, formatDay }: { days: string[]; formatDay: (d: string) => string }) {
  const marks = days.length <= 7 ? days.map((_, i) => i) : [0, Math.floor((days.length - 1) / 2), days.length - 1];
  return (
    <div className="chart__axis" aria-hidden="true">
      {marks.map((i) => <span key={i} style={{ left: `${((i + 0.5) / days.length) * 100}%` }}>{formatDay(days[i]!)}</span>)}
    </div>
  );
}

function SrTable({ label, days, series, formatDay, format }: { label: string; days: string[]; series: Series[]; formatDay: (d: string) => string; format: (v: number) => string }) {
  return (
    <table className="visually-hidden">
      <caption>{label}</caption>
      <thead><tr><th scope="col">Tag</th>{series.map((s) => <th key={s.key} scope="col">{s.label}</th>)}</tr></thead>
      <tbody>{days.map((d, i) => <tr key={d}><th scope="row">{formatDay(d)}</th>{series.map((s) => <td key={s.key}>{s.values[i] === null ? '–' : format(s.values[i]!)}</td>)}</tr>)}</tbody>
    </table>
  );
}

export function StackedBarChart({ label, days, series, crosshair, onDrill, formatDay, format = String }: ChartProps & { series: Series[] }) {
  const index = useStore(crosshair, (s) => s.index);
  const { ref, handlers } = useInteraction(days.length, crosshair, onDrill);
  const totals = days.map((_, i) => series.reduce((sum, s) => sum + (s.values[i] ?? 0), 0));
  const max = Math.max(1, ...totals);
  const bw = W / days.length;
  return (
    <div className="chart">
      <div ref={ref} className="chart__plot" tabIndex={0} role="img" aria-roledescription="Diagramm"
        aria-label={`${label}. Pfeiltasten wählen einen Tag, Eingabe filtert auf diesen Tag.`} {...handlers}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
          {[0.25, 0.5, 0.75].map((g) => <line key={g} className="chart__grid" x1={0} x2={W} y1={H * g} y2={H * g} vectorEffect="non-scaling-stroke" />)}
          {days.map((_, i) => {
            let y = H;
            return (
              <g key={i} className={index === i ? 'is-hot' : undefined}>
                {series.map((s) => {
                  const v = s.values[i] ?? 0;
                  const h = (v / max) * (H - PAD_TOP);
                  y -= h;
                  return v ? <rect key={s.key} x={i * bw + bw * 0.15} y={y} width={bw * 0.7} height={h} fill={s.color} /> : null;
                })}
              </g>
            );
          })}
          {index !== null && <line className="chart__cross" x1={(index + 0.5) * bw} x2={(index + 0.5) * bw} y1={0} y2={H} vectorEffect="non-scaling-stroke" />}
        </svg>
        {index !== null && <Tooltip index={index} days={days} series={series} formatDay={formatDay} format={format} />}
      </div>
      <AxisLabels days={days} formatDay={formatDay} />
      <SrTable label={label} days={days} series={series} formatDay={formatDay} format={format} />
    </div>
  );
}

export function LineChart({ label, days, series, crosshair, onDrill, formatDay, format = String, max: fixedMax }: ChartProps & { series: Series[]; max?: number }) {
  const index = useStore(crosshair, (s) => s.index);
  const { ref, handlers } = useInteraction(days.length, crosshair, onDrill);
  const max = fixedMax ?? Math.max(1, ...series.flatMap((s) => s.values.filter((v): v is number => v !== null)));
  const bw = W / days.length;
  const pt = (v: number, i: number) => `${((i + 0.5) * bw).toFixed(1)} ${(H - (v / max) * (H - PAD_TOP)).toFixed(1)}`;
  return (
    <div className="chart">
      <div ref={ref} className="chart__plot" tabIndex={0} role="img" aria-roledescription="Diagramm"
        aria-label={`${label}. Pfeiltasten wählen einen Tag, Eingabe filtert auf diesen Tag.`} {...handlers}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
          {[0.25, 0.5, 0.75].map((g) => <line key={g} className="chart__grid" x1={0} x2={W} y1={H * g} y2={H * g} vectorEffect="non-scaling-stroke" />)}
          {series.map((s) => {
            let d = ''; let pen = false;
            s.values.forEach((v, i) => { if (v === null) { pen = false; return; } d += `${pen ? 'L' : 'M'}${pt(v, i)}`; pen = true; });
            return (
              <g key={s.key}>
                <path d={d} fill="none" stroke={s.color} strokeWidth={2} vectorEffect="non-scaling-stroke" />
                {s.values.map((v, i) => v === null ? null : (
                  <line key={i} x1={(i + 0.5) * bw} x2={(i + 0.5) * bw} y1={H - (v / max) * (H - PAD_TOP)} y2={H - (v / max) * (H - PAD_TOP)}
                    stroke={s.color} strokeWidth={index === i ? 10 : 6} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                ))}
              </g>
            );
          })}
          {index !== null && <line className="chart__cross" x1={(index + 0.5) * bw} x2={(index + 0.5) * bw} y1={0} y2={H} vectorEffect="non-scaling-stroke" />}
        </svg>
        {index !== null && <Tooltip index={index} days={days} series={series} formatDay={formatDay} format={format} />}
      </div>
      <AxisLabels days={days} formatDay={formatDay} />
      <SrTable label={label} days={days} series={series} formatDay={formatDay} format={format} />
    </div>
  );
}
