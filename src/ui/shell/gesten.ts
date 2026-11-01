import { useEffect } from 'react';
import { session } from './session';

// Wischgesten fürs Menü auf dem Handy:
//   • vom linken Rand nach rechts ziehen öffnet das Menü (nur installierte App; in Safari
//     gehört der Rand der Zurück-Geste des Browsers),
//   • bei offenem Menü nach links wischen schließt es.
// Nur waagerechte Bewegungen zählen, damit normales Scrollen nichts auslöst.

const RAND = 24, WEG = 60;

/** Reine Entscheidung, getrennt testbar. */
export function wischAktion(start: { x: number; y: number }, ende: { x: number; y: number }, offen: boolean, randErlaubt: boolean): 'oeffnen' | 'schliessen' | null {
  const dx = ende.x - start.x, dy = ende.y - start.y;
  if (Math.abs(dx) < WEG || Math.abs(dx) < Math.abs(dy) * 1.5) return null;
  if (!offen && dx > 0 && randErlaubt && start.x <= RAND) return 'oeffnen';
  if (offen && dx < 0) return 'schliessen';
  return null;
}

export function useMenueGesten() {
  useEffect(() => {
    const schmal = matchMedia('(max-width: 767px)');
    const app = matchMedia('(display-mode: standalone)');
    let start: { x: number; y: number } | null = null;
    const down = (e: TouchEvent) => {
      start = schmal.matches && e.touches.length === 1 ? { x: e.touches[0]!.clientX, y: e.touches[0]!.clientY } : null;
    };
    const up = (e: TouchEvent) => {
      if (!start) return;
      const t = e.changedTouches[0];
      const a = t && wischAktion(start, { x: t.clientX, y: t.clientY }, session.get().drawerOpen, app.matches);
      start = null;
      if (a === 'oeffnen') session.set({ drawerOpen: true });
      if (a === 'schliessen') session.set({ drawerOpen: false });
    };
    const cancel = () => { start = null; };
    document.addEventListener('touchstart', down, { passive: true });
    document.addEventListener('touchend', up, { passive: true });
    document.addEventListener('touchcancel', cancel, { passive: true });
    return () => {
      document.removeEventListener('touchstart', down);
      document.removeEventListener('touchend', up);
      document.removeEventListener('touchcancel', cancel);
    };
  }, []);
}
