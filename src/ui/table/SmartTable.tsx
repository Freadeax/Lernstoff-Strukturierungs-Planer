import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { virtualWindow } from '../lib/virtual';
import { Icon } from '../icons';
import type { SortSpec } from './sort';

export interface Column<R> {
  key: string;
  label: string;
  width: number;          // Startbreite in px (veränderbar)
  minWidth?: number;
  align?: 'start' | 'end';
  value: (row: R) => string | number | undefined | null;
  render?: (row: R) => ReactNode;
  /** Inline-Bearbeitung über eine Auswahlliste. */
  editor?: { options: Array<{ value: string; label: string }>; commit: (row: R, value: string) => void | Promise<void> };
  sticky?: boolean;       // erste Spalte beim waagrechten Scrollen festhalten
}

export interface SmartTableProps<R> {
  label: string;
  rows: R[];
  columns: Column<R>[];
  rowKey: (row: R) => string;
  rowHeight?: number;
  sort: SortSpec[];
  onSortClick: (key: string) => void;
  widths: Record<string, number>;
  onWidthChange: (key: string, width: number) => void;
  selected?: Set<string>;
  onSelectedChange?: (next: Set<string>) => void;
  highlight?: string;
}

const CHECK_W = 44;

function EditableCell<R>({ row, col }: { row: R; col: Column<R> }) {
  const [editing, setEditing] = useState(false);
  const value = String(col.value(row) ?? '');
  const ref = useRef<HTMLSelectElement>(null);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);
  const label = col.editor!.options.find((o) => o.value === value)?.label ?? value;
  if (!editing) {
    return (
      <button type="button" className="cell-edit" onClick={() => setEditing(true)} aria-label={`${col.label}: ${label}, bearbeiten`}>
        {col.render ? col.render(row) : label}
      </button>
    );
  }
  return (
    <select ref={ref} className="cell-editor" value={value} aria-label={col.label}
      onChange={async (e) => { setEditing(false); await col.editor!.commit(row, e.target.value); }}
      onBlur={() => setEditing(false)} onKeyDown={(e) => { if (e.key === 'Escape') setEditing(false); }}>
      {col.editor!.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

/**
 * Tabelle mit virtuellem Scrollen (feste Zeilenhöhe), fixiertem Kopf, veränderbaren
 * Spaltenbreiten, Mehrfachsortierung, Inline-Bearbeitung und Mehrfachauswahl.
 */
export function SmartTable<R>(props: SmartTableProps<R>) {
  const { label, rows, columns, rowKey, rowHeight = 44, sort, onSortClick, widths, onWidthChange, selected, onSelectedChange, highlight } = props;
  const scroller = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState({ top: 0, height: 480 });
  const raf = useRef(0);

  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const measure = () => setScroll({ top: el.scrollTop, height: el.clientHeight });
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, []);
  useEffect(() => {
    if (!highlight) return;
    const i = rows.findIndex((r) => rowKey(r) === highlight);
    if (i >= 0 && scroller.current) scroller.current.scrollTop = Math.max(0, i * rowHeight - rowHeight * 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlight, rows.length]);

  const onScroll = () => {
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const el = scroller.current;
      if (el) setScroll({ top: el.scrollTop, height: el.clientHeight });
    });
  };

  const header = rowHeight;
  const win = virtualWindow(rows.length, rowHeight, scroll.top - header, scroll.height);
  const selectable = !!onSelectedChange && !!selected;
  const cols = columns.map((c) => `${widths[c.key] ?? c.width}px`);
  const template = { gridTemplateColumns: [...(selectable ? [`${CHECK_W}px`] : []), ...cols].join(' '), height: rowHeight } as CSSProperties;
  const allKeys = rows.map(rowKey);
  const allSelected = selectable && rows.length > 0 && allKeys.every((k) => selected!.has(k));
  const someSelected = selectable && !allSelected && allKeys.some((k) => selected!.has(k));

  function toggle(key: string) {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key); else next.add(key);
    onSelectedChange!(next);
  }

  function startResize(e: React.PointerEvent, col: Column<R>) {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const start = widths[col.key] ?? col.width;
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => onWidthChange(col.key, Math.max(col.minWidth ?? 64, start + ev.clientX - startX));
    const up = () => { target.removeEventListener('pointermove', move); target.removeEventListener('pointerup', up); };
    target.addEventListener('pointermove', move);
    target.addEventListener('pointerup', up);
  }

  return (
    <div ref={scroller} className="stable" onScroll={onScroll} role="table" aria-label={label} aria-rowcount={rows.length + 1}
      aria-multiselectable={selectable || undefined}>
      <div role="rowgroup" className="stable__head">
        <div role="row" className="stable__row" style={template} aria-rowindex={1}>
          {selectable && (
            <div role="columnheader" className="stable__cell stable__check stable__sticky">
              <input type="checkbox" aria-label="Alle auswählen" checked={allSelected}
                ref={(el) => { if (el) el.indeterminate = someSelected; }}
                onChange={() => onSelectedChange!(allSelected ? new Set() : new Set(allKeys))} />
            </div>
          )}
          {columns.map((c) => {
            const si = sort.findIndex((s) => s.key === c.key);
            const s = sort[si];
            return (
              <div key={c.key} role="columnheader" aria-sort={s ? (s.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                className={`stable__cell stable__th${c.sticky ? ' stable__sticky' : ''}${c.align === 'end' ? ' is-end' : ''}`}
                style={c.sticky ? { left: selectable ? CHECK_W : 0 } : undefined}>
                <button type="button" className="stable__sort" onClick={() => onSortClick(c.key)}
                  title="Tippen: aufsteigend, absteigend, aus. Mehrere Spalten werden nacheinander sortiert.">
                  <span>{c.label}</span>
                  {s ? <span className="stable__sortmark" aria-hidden="true">{s.dir === 'asc' ? '▲' : '▼'}{sort.length > 1 ? si + 1 : ''}</span>
                    : <span className="stable__sortmark is-off" aria-hidden="true"><Icon name="sort" size={14} /></span>}
                </button>
                <span role="separator" aria-orientation="vertical" aria-label={`Breite ${c.label}`} tabIndex={0}
                  aria-valuenow={widths[c.key] ?? c.width} aria-valuemin={c.minWidth ?? 64} className="stable__resize"
                  onPointerDown={(e) => startResize(e, c)}
                  onKeyDown={(e) => {
                    const w = widths[c.key] ?? c.width;
                    if (e.key === 'ArrowRight') { e.preventDefault(); onWidthChange(c.key, w + 16); }
                    if (e.key === 'ArrowLeft') { e.preventDefault(); onWidthChange(c.key, Math.max(c.minWidth ?? 64, w - 16)); }
                  }} />
              </div>
            );
          })}
        </div>
      </div>
      <div role="rowgroup" className="stable__body" style={{ height: win.totalHeight }}>
        <div style={{ transform: `translateY(${win.offsetTop}px)` }}>
          {rows.slice(win.start, win.end).map((r, i) => {
            const key = rowKey(r);
            const isSel = selectable && selected!.has(key);
            return (
              <div key={key} role="row" aria-rowindex={win.start + i + 2} aria-selected={selectable ? isSel : undefined}
                className={`stable__row${isSel ? ' is-selected' : ''}${highlight === key ? ' is-highlight' : ''}`} style={template}>
                {selectable && (
                  <div role="cell" className="stable__cell stable__check stable__sticky">
                    <input type="checkbox" aria-label="Zeile auswählen" checked={isSel} onChange={() => toggle(key)} />
                  </div>
                )}
                {columns.map((c) => (
                  <div key={c.key} role="cell" className={`stable__cell${c.sticky ? ' stable__sticky' : ''}${c.align === 'end' ? ' is-end' : ''}`}
                    style={c.sticky ? { left: selectable ? CHECK_W : 0 } : undefined}>
                    {c.editor ? <EditableCell row={r} col={c} /> : c.render ? c.render(r) : <span className="stable__text">{c.value(r) ?? '–'}</span>}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
