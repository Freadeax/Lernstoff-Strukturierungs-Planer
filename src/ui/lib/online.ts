import { useSyncExternalStore } from 'react';

// Verbindungsstatus des Geräts. Offline läuft fast alles weiter (Daten liegen lokal),
// nur Funktionen mit Claude oder GitHub brauchen Netz.

function subscribe(l: () => void) {
  window.addEventListener('online', l);
  window.addEventListener('offline', l);
  return () => { window.removeEventListener('online', l); window.removeEventListener('offline', l); };
}

export function useOnline(): boolean {
  return useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
}
