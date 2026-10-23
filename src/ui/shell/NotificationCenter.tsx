import { useEffect, useId, useRef, useState } from 'react';
import { liveQuery } from 'dexie';
import { db } from '../../core/db';
import { KIND_LABEL, SEVERITY_LABEL, type ActivityEntry } from '../../core/activity';
import { Icon } from '../icons';
import { relativeTime } from '../lib/time';
import { useStore } from '../lib/store';
import { dismissToast, markAllSeen, notifications } from './notifications';
import { navigate } from './router';

/** Glocke im Kopf: zeigt die letzten Ereignisse aus dem Aktivitätsprotokoll. */
export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ActivityEntry[]>([]);
  const lastSeen = useStore(notifications, (s) => s.lastSeen);
  const root = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    const sub = liveQuery(() => db.activity.orderBy('at').reverse().limit(8).toArray()).subscribe({ next: setItems, error: () => setItems([]) });
    return () => sub.unsubscribe();
  }, []);
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  const unread = items.filter((i) => i.at > lastSeen).length;
  const toggle = () => { if (open) markAllSeen(); setOpen(!open); };

  return (
    <div className="notif" ref={root} onKeyDown={(e) => { if (e.key === 'Escape') { setOpen(false); markAllSeen(); } }}>
      <button type="button" className="icon ghost notif__btn" aria-expanded={open} aria-controls={id} onClick={toggle}
        aria-label={unread ? `Mitteilungen, ${unread} neu` : 'Mitteilungen'} title="Mitteilungen">
        <Icon name="bell" />
        {unread > 0 && <span className="notif__dot" aria-hidden="true">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="popover notif__panel" id={id} role="region" aria-label="Mitteilungen">
          <div className="popover__head"><strong>Mitteilungen</strong>
            <button type="button" className="small ghost" onClick={() => { setOpen(false); markAllSeen(); navigate('/'); }}>Alle im Feed</button>
          </div>
          {items.length === 0 && <p className="muted">Noch keine Ereignisse.</p>}
          <ul className="notif__list" role="list">
            {items.map((i) => (
              <li key={i.id} className={`notif__item sev-${i.severity}${i.at > lastSeen ? ' is-new' : ''}`}>
                <span className="sev-dot" aria-hidden="true" />
                <div>
                  <div>{i.title}</div>
                  <div className="muted">{KIND_LABEL[i.kind]} · {SEVERITY_LABEL[i.severity]} · {relativeTime(i.at)}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Toast-Ausgabe: eine Mitteilung nach der anderen, nach Priorität. */
export function Toaster() {
  const current = useStore(notifications, (s) => s.current);
  useEffect(() => {
    if (!current) return;
    const t = setTimeout(dismissToast, current.severity === 'critical' ? 10_000 : 5000);
    return () => clearTimeout(t);
  }, [current]);
  return (
    <div className="toaster" aria-live="polite" aria-atomic="true">
      {current && (
        <div className={`toast sev-${current.severity}`} role={current.severity === 'critical' ? 'alert' : 'status'}>
          <div><strong>{current.title}</strong>{current.detail && <div className="muted">{current.detail}</div>}</div>
          <button type="button" className="icon small ghost" aria-label="Mitteilung schließen" onClick={dismissToast}><Icon name="close" size={16} /></button>
        </div>
      )}
    </div>
  );
}
