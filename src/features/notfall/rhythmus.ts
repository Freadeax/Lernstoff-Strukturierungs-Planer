// Didaktische EKG-Kurven für den Defibrillator-Bildschirm (keine echten Aufnahmen).
// t in Sekunden, Rückgabe etwa -1…1.

import type { Rhythmus } from './rea';

/** Ein Herzschlag: P-Welle, QRS, T-Welle (Phase 0…1). */
function schlag(p: number, breit = 1): number {
  const g = (mu: number, s: number, a: number) => a * Math.exp(-((p - mu) ** 2) / (2 * (s * breit) ** 2));
  return g(0.18, 0.025, 0.12) + g(0.3, 0.008, -0.12) + g(0.32, 0.01, 1) + g(0.345, 0.01, -0.25) + g(0.58, 0.05, 0.25);
}

export function kurve(r: Rhythmus, t: number): number {
  switch (r) {
    case 'kammerflimmern': {
      // unregelmäßige, wechselnd hohe Wellen um 5 Hz
      const huelle = 0.55 + 0.35 * Math.sin(t * 0.9) * Math.sin(t * 0.37 + 1);
      return huelle * (Math.sin(t * 2 * Math.PI * 4.6) * 0.6 + Math.sin(t * 2 * Math.PI * 6.3 + 1.3) * 0.3 + Math.sin(t * 2 * Math.PI * 3.1 + 0.4) * 0.25);
    }
    case 'asystolie': return 0.025 * Math.sin(t * 7.3) + 0.015 * Math.sin(t * 23.1);
    case 'pea': return schlag((t / 1.1) % 1, 1.6) * 0.8; // organisiert, etwa 55/min, breitere Komplexe
    case 'sinus': return schlag((t / 0.75) % 1); // etwa 80/min
  }
}

/** Kompressionsartefakte überlagern die Kurve, solange gedrückt wird. */
export function artefakt(t: number, letzterDruck: number | null): number {
  if (letzterDruck === null || t - letzterDruck > 0.8) return 0;
  const d = t - letzterDruck;
  return 0.9 * Math.exp(-((d - 0.12) ** 2) / 0.004);
}
