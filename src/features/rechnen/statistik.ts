// Trefferquote je Aufgabentyp. Nur auf diesem Gerät (localStorage), reine Übungsstatistik.
import type { AufgabenTyp } from './aufgaben';

const KEY = 'lernstoff.rechnen.statistik';

export type Statistik = Partial<Record<AufgabenTyp, { richtig: number; gesamt: number }>>;

export function ladeStatistik(): Statistik {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Statistik; } catch { return {}; }
}

export function zaehle(stat: Statistik, typ: AufgabenTyp, richtig: boolean): Statistik {
  const alt = stat[typ] ?? { richtig: 0, gesamt: 0 };
  const neu = { ...stat, [typ]: { richtig: alt.richtig + (richtig ? 1 : 0), gesamt: alt.gesamt + 1 } };
  try { localStorage.setItem(KEY, JSON.stringify(neu)); } catch { /* privater Modus */ }
  return neu;
}

export function quote(stat: Statistik, typ: AufgabenTyp): number | null {
  const s = stat[typ];
  return s && s.gesamt ? s.richtig / s.gesamt : null;
}

/** Typen mit der schwächsten Quote (mind. 3 Versuche, unter 80 %). */
export function schwaechen(stat: Statistik): AufgabenTyp[] {
  return (Object.keys(stat) as AufgabenTyp[])
    .filter((t) => (stat[t]?.gesamt ?? 0) >= 3 && (quote(stat, t) ?? 1) < 0.8)
    .sort((a, b) => (quote(stat, a) ?? 1) - (quote(stat, b) ?? 1));
}
