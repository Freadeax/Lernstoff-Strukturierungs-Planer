import { useSyncExternalStore } from 'react';

// Hash-Routing (#/lernen/themen?q=…): funktioniert auf GitHub Pages ohne Server-Regeln
// und als installierte PWA. Bis zu drei Pfadebenen, Abfrageparameter für Filter.

/** `depth`: wie viele Schritte innerhalb der App zurückgegangen werden kann (0 = Einstieg). */
export interface Route { path: string; segments: string[]; params: URLSearchParams; depth: number }

// Tiefe im Verlaufseintrag merken: Die installierte App auf iPhone/iPad hat keine
// Zurück-Taste des Browsers, die Kopfzeile zeigt dann eine eigene (nur wenn es ein
// „Zurück“ innerhalb der App gibt, nie aus der App hinaus).
const KEY = 'lernstoffTiefe';
const stateDepth = (): number | undefined => {
  const v = (history.state as Record<string, unknown> | null)?.[KEY];
  return typeof v === 'number' && v >= 0 ? v : undefined;
};
function stamp(depth: number) {
  try { history.replaceState({ ...(history.state as object | null), [KEY]: depth }, ''); } catch { /* z. B. Sandbox */ }
  return depth;
}

function parse(depth = 0): Route {
  const raw = typeof location === 'undefined' ? '' : location.hash.replace(/^#/, '');
  const [p = '/', q = ''] = raw.split('?');
  const path = '/' + p.split('/').filter(Boolean).slice(0, 3).join('/');
  return { path, segments: path.split('/').filter(Boolean), params: new URLSearchParams(q), depth };
}

let current = parse(typeof history === 'undefined' ? 0 : stateDepth() ?? stamp(0));
const listeners = new Set<() => void>();
if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    // Zurück/Vor: Eintrag kennt seine Tiefe. Neuer Eintrag (Link, navigate): eine Ebene tiefer.
    current = parse(stateDepth() ?? stamp(current.depth + 1));
    listeners.forEach((l) => l());
  });
}

/** Einen Schritt zurück, aber nur innerhalb der App. */
export function goBack() {
  if (current.depth > 0) history.back();
  else navigate('/');
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
