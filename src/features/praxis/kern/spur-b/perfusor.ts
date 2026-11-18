// Spur B – Perfusoren: Laufrate (ml/h) ↔ Dosis und Wirkung je Wirkstoff (Lernmodell, fachlich ungeprüft).
// Rechenweg wie im Rechentrainer: Dosis = Laufrate · Konzentration / Gewicht / Zeit.

import type { ModellModule } from '../typen';

export type Perfusor = NonNullable<ModellModule['perfusoren']>[number];
export type DosisEinheit = 'µg/kg/min' | 'mg/kg/h' | 'µg/kg/h';

interface Wirkstoff {
  name: string;
  einheit: DosisEinheit;
  /** übliche Spanne (Lernhilfe, keine Dosierempfehlung) */
  spanne: [number, number];
  /** Wirkung als Sättigungskurve: maximal · d / (d + halb) */
  tonus?: [number, number];
  pumpe?: [number, number];
  sedierung?: [number, number];
  analgesie?: [number, number];
}

/** Wirkstoffe, die der Simulator kennt. Unbekannte Wirkstoffe laufen ohne Wirkung (nur Anzeige). */
export const WIRKSTOFFE: Readonly<Record<string, Wirkstoff>> = {
  noradrenalin: { name: 'Noradrenalin', einheit: 'µg/kg/min', spanne: [0.05, 0.5], tonus: [1.5, 0.3] },
  adrenalin: { name: 'Adrenalin', einheit: 'µg/kg/min', spanne: [0.05, 0.5], tonus: [0.6, 0.3], pumpe: [0.5, 0.2] },
  dobutamin: { name: 'Dobutamin', einheit: 'µg/kg/min', spanne: [2, 20], pumpe: [0.5, 5] },
  propofol: { name: 'Propofol', einheit: 'mg/kg/h', spanne: [1, 4], sedierung: [1, 1.5], tonus: [-0.15, 1.5] },
  midazolam: { name: 'Midazolam', einheit: 'mg/kg/h', spanne: [0.03, 0.2], sedierung: [1, 0.08] },
  sufentanil: { name: 'Sufentanil', einheit: 'µg/kg/h', spanne: [0.15, 0.7], analgesie: [1, 0.3], sedierung: [0.25, 0.3] },
};

const MIKRO = (e: DosisEinheit) => (e === 'mg/kg/h' ? 1 : 1000);
const PRO_MIN = (e: DosisEinheit) => (e === 'µg/kg/min' ? 60 : 1);

/** Dosis aus Laufrate: ml/h · mg/ml → mg/h → Einheit je kg. */
export function dosis(mlProH: number, mgProMl: number, gewichtKg: number, einheit: DosisEinheit): number {
  if (gewichtKg <= 0) return 0;
  return (mlProH * mgProMl * MIKRO(einheit)) / gewichtKg / PRO_MIN(einheit);
}

/** Laufrate aus Zieldosis (Umkehrung von dosis). */
export function laufrate(zielDosis: number, mgProMl: number, gewichtKg: number, einheit: DosisEinheit): number {
  if (mgProMl <= 0) return 0;
  return (zielDosis * gewichtKg * PRO_MIN(einheit)) / (mgProMl * MIKRO(einheit));
}

/** Dosis eines laufenden Perfusors in der Einheit seines Wirkstoffs (undefined: unbekannt oder ohne Konzentration). */
export function perfusorDosis(p: Perfusor, gewichtKg: number): { wert: number; einheit: DosisEinheit } | undefined {
  const w = WIRKSTOFFE[p.wirkstoff];
  if (!w || p.mgProMl === undefined) return undefined;
  return { wert: dosis(p.mlProH, p.mgProMl, gewichtKg, w.einheit), einheit: w.einheit };
}

const saettigung = (k: [number, number] | undefined, d: number) => (k ? (k[0] * d) / (d + k[1]) : 0);

export interface PerfusorEffekt { tonus: number; pumpe: number; sedierung: number; analgesie: number }

/** Summe der Wirkungen aller laufenden Perfusoren (rein). */
export function perfusorEffekt(perfusoren: readonly Perfusor[] | undefined, gewichtKg: number): PerfusorEffekt {
  const e: PerfusorEffekt = { tonus: 0, pumpe: 0, sedierung: 0, analgesie: 0 };
  for (const p of perfusoren ?? []) {
    const w = WIRKSTOFFE[p.wirkstoff];
    const d = perfusorDosis(p, gewichtKg);
    if (!w || !d || d.wert <= 0) continue;
    e.tonus += saettigung(w.tonus, d.wert);
    e.pumpe += saettigung(w.pumpe, d.wert);
    e.sedierung += saettigung(w.sedierung, d.wert);
    e.analgesie += saettigung(w.analgesie, d.wert);
  }
  e.sedierung = Math.min(1, e.sedierung);
  e.analgesie = Math.min(1, e.analgesie);
  return e;
}
