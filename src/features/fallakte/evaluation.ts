// Schlussschritt „Evaluation“ einer Fallakte: Ziele aus der Musterplanung am späteren Verlauf prüfen
// und die Planung fortschreiben. Prüfung rein per Code, ohne KI: je Ziel ein Punkt für die richtige
// Einschätzung (erreicht, teilweise, nicht) und ein Punkt für die passende Anpassung.
import type { AktenEvaluation, ZielStand } from './typen';

export const EVALUATION_KEY = 'lernstoff.fallakte.evaluation.beste';

export const STAND_LABEL: Record<ZielStand, string> = { ja: 'erreicht', teilweise: 'teilweise erreicht', nein: 'nicht erreicht' };

export interface ZielAntwort { stand?: ZielStand; anpassung?: number }
export type Antworten = Record<string, ZielAntwort>;

export interface ZielErgebnis { zielId: string; standOk: boolean; anpassungOk: boolean }
export interface EvalErgebnis { ziele: ZielErgebnis[]; punkte: number; max: number; prozent: number; vollstaendig: boolean }

export function pruefeEvaluation(ev: AktenEvaluation, antworten: Antworten): EvalErgebnis {
  const ziele = ev.ziele.map((z) => {
    const a = antworten[z.id] ?? {};
    const gewaehlt = a.anpassung === undefined ? undefined : z.anpassungen[a.anpassung];
    return { zielId: z.id, standOk: a.stand === z.erwartet, anpassungOk: !!gewaehlt?.richtig };
  });
  const punkte = ziele.reduce((s, z) => s + Number(z.standOk) + Number(z.anpassungOk), 0);
  const max = ev.ziele.length * 2;
  return {
    ziele, punkte, max,
    prozent: max ? Math.round((punkte / max) * 100) : 0,
    vollstaendig: ev.ziele.every((z) => antworten[z.id]?.stand !== undefined && antworten[z.id]?.anpassung !== undefined),
  };
}
