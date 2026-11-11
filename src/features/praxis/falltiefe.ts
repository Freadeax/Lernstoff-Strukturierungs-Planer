// Falltiefe vor dem Start (Audit, Praxissimulator-Zeile): was der Fall tatsächlich enthält, aus den
// Falldaten gezählt statt behauptet. Stufen: Kernfall (Ketten Beobachtung → Entscheidung),
// Verlaufsfall (Ereignisse mit Entscheidungen), Grundfall (nur Handlungen und Kriterien).

import type { Scenario } from './types';

export type Tiefe = 'kernfall' | 'verlaufsfall' | 'grundfall';
export const TIEFE_TEXT: Record<Tiefe, string> = { kernfall: 'Kernfall', verlaufsfall: 'Verlaufsfall', grundfall: 'Grundfall' };

export type Falltiefe = {
  stufe: Tiefe; handlungen: number; medikamente: number; ereignisse: number; entscheidungen: number;
  ketten: number; kriterien: number; ablenkung: boolean;
};

export function falltiefe(sc: Scenario): Falltiefe {
  const entscheidungen = (sc.storyline ?? []).filter(e => e.choices?.length).length;
  return {
    stufe: sc.chains?.length ? 'kernfall' : entscheidungen ? 'verlaufsfall' : 'grundfall',
    handlungen: sc.actions.length, medikamente: sc.medications.length, ereignisse: sc.storyline?.length ?? 0,
    entscheidungen, ketten: sc.chains?.length ?? 0, kriterien: sc.criteria.length, ablenkung: !!sc.distraction,
  };
}

/** Kurzzeile für die Fallkarte, z. B. „Verlaufsfall · 4 Ereignisse, 2 Entscheidungen · 9 Bewertungskriterien“. */
export function falltiefeText(t: Falltiefe): string {
  const n = (x: number, eins: string, viele: string) => `${x} ${x === 1 ? eins : viele}`;
  return [
    TIEFE_TEXT[t.stufe],
    t.ereignisse ? `${n(t.ereignisse, 'Ereignis', 'Ereignisse')}, ${n(t.entscheidungen, 'Entscheidung', 'Entscheidungen')}` : 'kein Verlauf mit Ereignissen',
    t.ketten ? n(t.ketten, 'Prüfkette', 'Prüfketten') : '',
    n(t.kriterien, 'Bewertungskriterium', 'Bewertungskriterien'),
    t.medikamente ? n(t.medikamente, 'Medikament', 'Medikamente') : '',
    t.ablenkung ? 'mit Störungen' : '',
  ].filter(Boolean).join(' · ');
}
