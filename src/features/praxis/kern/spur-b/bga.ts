// Spur B – Blutgasanalyse aus dem Modell (Lernmodell, fachlich ungeprüft).
// pCO₂ und pO₂ kommen aus der Atmung des Basismodells, die metabolische Seite aus Laktat.
// Gedeutet wird mit derselben Lernhilfe wie im Labor-Trainer (src/ui/sim/labor/bga.ts).

export interface BgaWerte { ph: number; paco2: number; pao2: number; hco3: number; be: number; laktat: number; kalium: number }

const runde = (x: number, n: number) => Math.round(x * 10 ** n) / 10 ** n;

/**
 * Metabolisch: Laktat puffert etwa 1:1 Bikarbonat ab (vereinfacht 0,9).
 * Respiratorisch akut: HCO₃⁻ steigt um 0,1 mmol/l je mmHg pCO₂ über 40 (fällt entsprechend darunter).
 * pH nach Henderson-Hasselbalch, BE nach Van Slyke (vereinfacht).
 */
export function bgaAusModell(e: { paco2: number; pao2: number; laktat: number; kalium?: number }): BgaWerte {
  const paco2 = Math.max(10, e.paco2);
  const hco3 = Math.max(4, 24 - 0.9 * Math.max(0, e.laktat - 1) + 0.1 * (paco2 - 40));
  const ph = 6.1 + Math.log10(hco3 / (0.0307 * paco2));
  const be = 0.93 * (hco3 - 24.4 + 14.8 * (ph - 7.4));
  return {
    ph: runde(ph, 2), paco2: Math.round(paco2), pao2: Math.round(e.pao2), hco3: runde(hco3, 1), be: runde(be, 1),
    laktat: runde(e.laktat, 1), kalium: runde(e.kalium ?? 4.2, 1),
  };
}

/** pO₂ aus SpO₂ (Umkehrung der Sauerstoffbindungskurve nach Severinghaus, nur Schätzung). */
export function po2AusSpo2(spo2: number): number {
  const s = Math.min(0.995, Math.max(0.3, spo2 / 100));
  // Severinghaus: S = 1 / (23400 / (p³ + 150 p) + 1) → numerisch lösen
  let lo = 10, hi = 600;
  for (let i = 0; i < 40; i++) {
    const p = (lo + hi) / 2;
    const sp = 1 / (23400 / (p ** 3 + 150 * p) + 1);
    if (sp < s) lo = p; else hi = p;
  }
  return (lo + hi) / 2;
}

/** Für die Lernhilfe deuteBga() im Labor-Trainer (Feldnamen pco2/po2). */
export function alsLaborBga(b: BgaWerte): { ph: number; pco2: number; hco3: number; po2: number; be: number; laktat: number } {
  return { ph: b.ph, pco2: b.paco2, hco3: b.hco3, po2: b.pao2, be: b.be, laktat: b.laktat };
}
