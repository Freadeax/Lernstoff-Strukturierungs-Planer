import { useEffect, useId, useRef, useState } from 'react';
import { Icon } from '../icons';
import { Menu } from '../Menu';
import { relativeTime } from '../lib/time';
import { useNow } from '../lib/hooks';
import { ErrorBoundary } from './ErrorBoundary';
import { EmptyState, ErrorState } from './states';
import { exportRows } from './export';
import type { FooterZone, MenuAction, Pagination, SyncBadge, WidgetFrameProps } from './types';

const BADGE: Record<SyncBadge, string> = { live: 'Aktuell', syncing: 'Lädt', stalled: 'Gestört', offline: 'Offline', demo: 'Beispiel' };

export function StatusBadge({ badge }: { badge: SyncBadge }) {
  return <span className={`badge badge--${badge}`}><span className="badge__dot" aria-hidden="true" />{BADGE[badge]}</span>;
}

function PaginationControls({ p, labelId }: { p: Pagination; labelId: string }) {
  const pages = p.pageSize ? Math.max(1, Math.ceil(p.total / p.pageSize)) : 1;
  return (
    <div className="pager" role="group" aria-labelledby={labelId}>
      {p.onPageSizeChange && (
        <label className="pager__size">
          <span className="visually-hidden">Einträge pro Seite</span>
          <select value={p.pageSize} onChange={(e) => p.onPageSizeChange!(Number(e.target.value))}>
            {(p.pageSizes ?? [25, 50, 100, 0]).map((s) => <option key={s} value={s}>{s ? `${s} pro Seite` : 'Alle'}</option>)}
          </select>
        </label>
      )}
      <button type="button" className="icon small" aria-label="Vorherige Seite" disabled={p.page <= 1} onClick={() => p.onPageChange(p.page - 1)}>
        <Icon name="chevronLeft" size={16} />
      </button>
      <span className="pager__pos" aria-live="polite">Seite {p.page} von {pages}</span>
      <button type="button" className="icon small" aria-label="Nächste Seite" disabled={p.page >= pages} onClick={() => p.onPageChange(p.page + 1)}>
        <Icon name="chevronRight" size={16} />
      </button>
    </div>
  );
}

function Footer({ footer, labelId }: { footer: FooterZone; labelId: string }) {
  const now = useNow(30_000);
  return (
    <footer className="widget__footer">
      {footer.pagination && <PaginationControls p={footer.pagination} labelId={labelId} />}
      {footer.lastSynced && (
        <time className="widget__synced" dateTime={footer.lastSynced.toISOString()} title={footer.lastSynced.toLocaleString('de-DE')}>
          Stand: {relativeTime(footer.lastSynced, now)}
        </time>
      )}
      {footer.secondary && <div className="widget__secondary">{footer.secondary}</div>}
    </footer>
  );
}

/**
 * Rahmen jedes Moduls mit Kopf-, Körper- und Fußzone. Rendert je nach `state` Skelett,
 * Leer-, Fehler-, Teil- oder Idealzustand. Renderfehler im Inhalt bleiben im Modul.
 */
export function Widget<T, K extends string = string>(props: WidgetFrameProps<T, K>) {
  const { id, header, state, skeleton, empty, onRetry, body, footer, lifecycle, children } = props;
  const titleId = useId();
  const descId = useId();
  const [maximized, setMaximized] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    lifecycle?.onMount?.(id);
    return () => lifecycle?.onDestroy?.(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  useEffect(() => {
    lifecycle?.onUpdate?.(id, state.status);
    if (state.status === 'error') lifecycle?.onError?.(id, state.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, state.status]);
  useEffect(() => {
    if (!maximized) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMaximized(false); };
    window.addEventListener('keydown', onKey);
    root.current?.focus();
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [maximized]);

  const actions: MenuAction[] = [];
  if (header.exportRows) {
    actions.push({ id: 'csv', label: 'Als CSV exportieren', onSelect: () => exportRows(id, header.exportRows!(), 'csv') });
    actions.push({ id: 'json', label: 'Als JSON exportieren', onSelect: () => exportRows(id, header.exportRows!(), 'json') });
  }
  if (header.allowMaximize !== false) actions.push({ id: 'max', label: maximized ? 'Verkleinern' : 'Vollbild', onSelect: () => setMaximized(!maximized) });
  actions.push(...(header.extraActions ?? []));
  if (header.onHide) actions.push({ id: 'hide', label: 'Modul ausblenden', onSelect: header.onHide });

  const retry = () => { setResetKey((k) => k + 1); onRetry(); };
  const status = state.status;
  const bodyStyle = { '--body-min': body?.minHeight, '--body-max': body?.maxHeight } as React.CSSProperties;

  return (
    <section ref={root} className={`widget widget--${status}${maximized ? ' widget--max' : ''}`} aria-labelledby={titleId}
      aria-describedby={header.subtitle ? descId : undefined} aria-busy={status === 'loading'} data-widget={id}
      tabIndex={maximized ? -1 : undefined} role={maximized ? 'dialog' : undefined} aria-modal={maximized || undefined}>
      <header className="widget__header">
        <div className="widget__titles">
          <h3 id={titleId} className="widget__title">{header.title}</h3>
          {header.subtitle && <p id={descId} className="widget__subtitle">{header.subtitle}</p>}
        </div>
        <div className="widget__tools">
          {header.badge && <StatusBadge badge={status === 'error' ? 'stalled' : header.badge} />}
          {maximized && (
            <button type="button" className="icon small ghost" aria-label="Vollbild schließen" onClick={() => setMaximized(false)}>
              <Icon name="close" size={18} />
            </button>
          )}
          {actions.length > 0 && <Menu label={`Aktionen für ${header.title}`} trigger={<Icon name="more" />} items={actions} />}
        </div>
        {header.filters && header.filters.length > 0 && (
          <div className="pills" role="group" aria-label={`Filter für ${header.title}`}>
            {header.filters.map((f) => (
              <button key={f.key} type="button" className="pill" aria-pressed={header.activeFilter === f.key}
                onClick={() => header.onFilterChange?.(f.key)} disabled={status === 'loading'}>
                {f.label}{f.count !== undefined && <span className="pill__count">{f.count}</span>}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="widget__body" style={bodyStyle} data-scroll-root="">
        {status === 'loading' && <div className="widget__skeleton" aria-hidden="true">{skeleton}</div>}
        {status === 'loading' && <span className="visually-hidden" role="status">{header.title} wird geladen</span>}
        {status === 'empty' && <EmptyState spec={empty} />}
        {status === 'error' && <ErrorState error={state.error} onRetry={retry} />}
        {(status === 'ideal' || status === 'partial') && (
          <ErrorBoundary resetKey={resetKey} onError={(e) => lifecycle?.onError?.(id, e)}
            fallback={(e, reset) => <ErrorState error={e} onRetry={() => { reset(); retry(); }} />}>
            {status === 'partial' && state.reason && <p className="widget__partial-note">{state.reason}</p>}
            {children(state.data, { partial: status === 'partial', reason: status === 'partial' ? state.reason : undefined })}
          </ErrorBoundary>
        )}
      </div>

      {footer && <Footer footer={footer} labelId={titleId} />}
    </section>
  );
}
