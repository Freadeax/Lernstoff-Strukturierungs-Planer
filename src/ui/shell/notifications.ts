import { createStore, storage } from '../lib/store';
import type { Severity } from '../../core/activity';

// Mitteilungen. Quelle sind lokale Ereignisse (Import fertig, Modulfehler) und das
// Aktivitätsprotokoll in IndexedDB. Erweiterungspunkt: ein NotificationTransport für
// Server-Push (z. B. WebSocket) kann später dieselbe Warteschlange füllen.

export interface Toast { id: number; severity: Severity; title: string; detail?: string; at: number }

export interface NotificationTransport {
  connect(push: (t: Omit<Toast, 'id' | 'at'>) => void): () => void;
}

const RANK: Record<Severity, number> = { critical: 0, warning: 1, info: 2 };

/** Prioritätswarteschlange: kritisch vor Warnung vor Info, innerhalb gleicher Stufe älteste zuerst. */
export function enqueue(queue: Toast[], t: Toast): Toast[] {
  const next = [...queue, t];
  next.sort((a, b) => RANK[a.severity] - RANK[b.severity] || a.at - b.at);
  return next;
}

interface NotificationState { queue: Toast[]; current: Toast | null; lastSeen: string }

let seq = 0;
export const notifications = createStore<NotificationState>({
  queue: [], current: null, lastSeen: storage.read('lernstoff.lastSeen', ''),
});

export function notify(severity: Severity, title: string, detail?: string) {
  const t: Toast = { id: ++seq, severity, title, detail, at: Date.now() };
  notifications.set((s) => (s.current ? { ...s, queue: enqueue(s.queue, t) } : { ...s, current: t }));
}

export function dismissToast() {
  notifications.set((s) => ({ ...s, current: s.queue[0] ?? null, queue: s.queue.slice(1) }));
}

export function markAllSeen() {
  const lastSeen = new Date().toISOString();
  storage.write('lernstoff.lastSeen', lastSeen);
  notifications.set({ lastSeen });
}

export function connectTransport(t: NotificationTransport) {
  return t.connect((n) => notify(n.severity, n.title, n.detail));
}
