import { createStore, storage } from '../lib/store';
import type { Role } from './nav';
import { modules } from '../../modules/registry';

// Sitzungs- und Arbeitsbereich-Zustand der Shell.
// „Mandant“ heißt hier Fachmodul (z. B. Pflege). Weitere Fachmodule erscheinen automatisch
// im Wechsler. Die Auswahl wird per BroadcastChannel an andere offene Tabs weitergegeben.

export type Theme = 'system' | 'hell' | 'dunkel';

export interface SessionState {
  roles: Role[];
  moduleId: string;
  theme: Theme;
  sidebarCollapsed: boolean;
  drawerOpen: boolean;
}

const KEY = 'lernstoff.shell';
const saved = storage.read<Partial<SessionState>>(KEY, {});

export const session = createStore<SessionState>({
  roles: ['lernende'],
  moduleId: saved.moduleId && modules.some((m) => m.id === saved.moduleId) ? saved.moduleId : modules[0]?.id ?? '',
  theme: saved.theme ?? 'system',
  sidebarCollapsed: saved.sidebarCollapsed ?? false,
  drawerOpen: false,
}, (s) => {
  storage.write(KEY, { moduleId: s.moduleId, theme: s.theme, sidebarCollapsed: s.sidebarCollapsed });
  applyTheme(s.theme);
});

export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  const el = document.documentElement;
  if (theme === 'system') el.removeAttribute('data-theme');
  else el.setAttribute('data-theme', theme === 'dunkel' ? 'dark' : 'light');
}
applyTheme(session.get().theme);

const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('lernstoff-shell') : null;
let fromChannel = false;
channel?.addEventListener('message', (e: MessageEvent<Partial<SessionState>>) => {
  fromChannel = true;
  session.set(e.data);
  fromChannel = false;
});

/** Arbeitsbereich wechseln und andere Tabs informieren. */
export function setWorkspace(patch: Partial<Pick<SessionState, 'moduleId' | 'theme'>>) {
  session.set(patch);
  if (!fromChannel) channel?.postMessage(patch);
}
