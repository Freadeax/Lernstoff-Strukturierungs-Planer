import { createStore, storage } from '../lib/store';
import type { Role } from './nav';
import { modules } from '../../modules/registry';

// Sitzungs- und Arbeitsbereich-Zustand der Shell.
// „Mandant“ heißt hier Fachmodul (z. B. Pflege). Weitere Fachmodule erscheinen automatisch
// im Wechsler. Die Auswahl wird per BroadcastChannel an andere offene Tabs weitergegeben.

export type Theme = 'system' | 'hell' | 'dunkel';
/** Schriftgröße der ganzen App (alle Schriftgrößen sind in rem). */
export type Schrift = 'normal' | 'gross' | 'sehrgross';
export const SCHRIFTEN: Array<[Schrift, string]> = [['normal', 'normal'], ['gross', 'groß'], ['sehrgross', 'sehr groß']];

/** Bewegung: wie das System (prefers-reduced-motion) oder in der App abgeschaltet. */
export type Bewegung = 'system' | 'reduziert';
export const BEWEGUNGEN: Array<[Bewegung, string]> = [['system', 'an (wie System)'], ['reduziert', 'reduziert']];

export interface SessionState {
  roles: Role[];
  moduleId: string;
  theme: Theme;
  schrift: Schrift;
  bewegung: Bewegung;
  sidebarCollapsed: boolean;
  drawerOpen: boolean;
}

const KEY = 'lernstoff.shell';
const saved = storage.read<Partial<SessionState>>(KEY, {});

export const session = createStore<SessionState>({
  roles: ['lernende'],
  moduleId: saved.moduleId && modules.some((m) => m.id === saved.moduleId) ? saved.moduleId : modules[0]?.id ?? '',
  theme: saved.theme === 'hell' || saved.theme === 'dunkel' ? saved.theme : 'system',
  schrift: saved.schrift === 'gross' || saved.schrift === 'sehrgross' ? saved.schrift : 'normal',
  bewegung: saved.bewegung === 'reduziert' ? 'reduziert' : 'system',
  sidebarCollapsed: saved.sidebarCollapsed === true,
  drawerOpen: false,
}, (s) => {
  storage.write(KEY, { moduleId: s.moduleId, theme: s.theme, schrift: s.schrift, bewegung: s.bewegung, sidebarCollapsed: s.sidebarCollapsed });
  applyTheme(s.theme);
  applySchrift(s.schrift);
  applyBewegung(s.bewegung);
});

export function applySchrift(schrift: Schrift) {
  if (typeof document === 'undefined') return;
  if (schrift === 'normal') document.documentElement.removeAttribute('data-schrift');
  else document.documentElement.setAttribute('data-schrift', schrift);
}
applySchrift(session.get().schrift);

export function applyBewegung(bewegung: Bewegung) {
  if (typeof document === 'undefined') return;
  if (bewegung === 'system') document.documentElement.removeAttribute('data-motion');
  else document.documentElement.setAttribute('data-motion', 'reduce');
}
applyBewegung(session.get().bewegung);

/** Soll gerade auf Bewegung verzichtet werden (System oder App-Einstellung)? */
export function wenigBewegung(): boolean {
  if (typeof document === 'undefined') return true;
  return document.documentElement.dataset.motion === 'reduce'
    || (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);
}

export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  const el = document.documentElement;
  if (theme === 'system') el.removeAttribute('data-theme');
  else el.setAttribute('data-theme', theme === 'dunkel' ? 'dark' : 'light');
  // iPhone/iPad: Statusleiste folgt der gewählten Darstellung, nicht nur der Systemeinstellung.
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((m) => {
    if (!m.dataset.media) m.dataset.media = m.media;
    m.media = theme === 'system' ? m.dataset.media : (m.dataset.media.includes('dark') === (theme === 'dunkel') ? 'all' : 'not all');
  });
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
export function setWorkspace(patch: Partial<Pick<SessionState, 'moduleId' | 'theme' | 'schrift' | 'bewegung'>>) {
  session.set(patch);
  if (!fromChannel) channel?.postMessage(patch);
}
