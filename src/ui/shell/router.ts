import { useSyncExternalStore } from 'react';

// Hash-Routing (#/lernen/themen?q=…): funktioniert auf GitHub Pages ohne Server-Regeln
// und als installierte PWA. Bis zu drei Pfadebenen, Abfrageparameter für Filter.

export interface Route { path: string; segments: string[]; params: URLSearchParams }

function parse(): Route {
  const raw = typeof location === 'undefined' ? '' : location.hash.replace(/^#/, '');
  const [p = '/', q = ''] = raw.split('?');
  const path = '/' + p.split('/').filter(Boolean).slice(0, 3).join('/');
  return { path, segments: path.split('/').filter(Boolean), params: new URLSearchParams(q) };
}

let current = parse();
const listeners = new Set<() => void>();
if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => { current = parse(); listeners.forEach((l) => l()); });
}

export function navigate(to: string) {
  const target = to.startsWith('#') ? to : `#${to.startsWith('/') ? to : '/' + to}`;
  if (location.hash === target) return;
  location.hash = target;
}

export function useRoute(): Route {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => current,
    () => current,
  );
}

/** Aktiver Menüpunkt: exakte Übereinstimmung oder Elternpfad. */
export function isActive(itemPath: string, path: string): boolean {
  if (itemPath === '/') return path === '/';
  return path === itemPath || path.startsWith(itemPath + '/');
}
