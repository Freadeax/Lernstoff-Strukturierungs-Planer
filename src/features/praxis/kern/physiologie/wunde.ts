// Grundsystem G9: Wunde (Lernmodell, didaktisch gerundet, fachlich ungeprüft; ICW-Wundkonsens, KRINKO
// „Prävention postoperativer Wundinfektionen“, DNQP Expertenstandard „Pflege von Menschen mit chronischen Wunden“).
// Rein und deterministisch. Nur aktiv mit Treiber `wunde` oder `wundblutung`.
//
// - Wundheilungsphase aus dem Tag nach der OP (exsudativ bis Tag 3, proliferativ bis Tag 14, danach reparativ);
//   eine Infektion hält die Wunde in der Entzündungsphase.
// - Wundinfekt (`wundInfekt` 0..1): wächst mit `infektTempo` je Stunde (Fall setzt es oder einen Startwert).
//   Zeichen nach Celsus/Galen: Rötung, Überwärmung, Schwellung, Schmerz, dazu eitriges Sekret. Speist die Entzündung
//   im Labor (G8: CRP, Leukos), Fieber und Wundschmerz.
// - Nachblutung (Treiber `wundblutung { mlProMin }`): Blut geht aus dem Kreislauf (wie `blutung`, G8 Hb-Masse) und
//   in den Verband (`verbandBlutMl`). Druckverband („blutung-stillen“, Grundgröße `blutstillung`) senkt die
//   Blutung um 80 %; eine chirurgische Blutung hört davon nicht ganz auf (Ärztin, Revision).
//   Verbandwechsel setzt den Verband zurück (Wirkkurve `verbandBlutMl` Faktor 0).

import type { Grundgroessen, Treiber } from '../typen';
import { klemme } from './organe';

export type WundTreiber = Extract<Treiber, { art: 'wunde' }>;

/** wirksame Nachblutung ml/min (nach Druckverband) */
export function wundblutungMlMin(g: Grundgroessen, treiber: readonly Treiber[]): number {
  let ml = 0;
  for (const t of treiber) if (t.art === 'wundblutung') ml += t.mlProMin;
  return ml * (1 - 0.8 * klemme(g.blutstillung ?? 0, 0, 1));
}

export type WundSchritt = Pick<Grundgroessen, 'wundInfekt' | 'verbandBlutMl' | 'wundTag' | 'wundBlutungMlMin'>;

/** Ein Schritt; `undefined` ohne Wunde. `seitStd`: Stunden seit dem Treiber `wunde`. */
export function wundSchritt(alt: Grundgroessen, treiber: readonly Treiber[], dt: number, seitStd: (t: WundTreiber) => number): WundSchritt | undefined {
  const w = treiber.find((t): t is WundTreiber => t.art === 'wunde');
  const blutet = treiber.some((t) => t.art === 'wundblutung');
  if (!w && !blutet && alt.verbandBlutMl === undefined) return undefined;
  const r: WundSchritt = {};
  if (w) {
    r.wundTag = (w.tagPostOp ?? 0) + seitStd(w) / 24;
    r.wundInfekt = klemme((alt.wundInfekt ?? 0) + (w.infektTempo ?? 0) * (dt / 3600), 0, 1);
  }
  const ml = wundblutungMlMin(alt, treiber);
  r.wundBlutungMlMin = ml;
  r.verbandBlutMl = (alt.verbandBlutMl ?? 0) + (ml * dt) / 60;
  return r;
}

export type WundPhase = 'exsudativ' | 'proliferativ' | 'reparativ';
export type Wundsekret = 'keins' | 'serös' | 'blutig' | 'eitrig';
export type Verband = 'trocken' | 'leicht durchgeblutet' | 'durchgeblutet' | 'durchnässt';

export interface WundZustand {
  wundPhase?: WundPhase;
  wundsekret: Wundsekret;
  /** Rötung, Überwärmung, Schwellung, Schmerz, Eiter: Anzahl 0–5 */
  wundInfektZeichen: number;
  verband: Verband;
  verbandBlutMl: number;
}

export function wundZustand(g: Grundgroessen): WundZustand | undefined {
  if (g.wundTag === undefined && g.verbandBlutMl === undefined) return undefined;
  const inf = g.wundInfekt ?? 0;
  const tag = g.wundTag;
  const blut = g.verbandBlutMl ?? 0;
  const blutetJetzt = (g.wundBlutungMlMin ?? 0) > 0.05;
  const zeichen = [inf > 0.2, inf > 0.3, inf > 0.35, inf > 0.4, inf > 0.5].filter(Boolean).length;
  return {
    wundPhase: tag === undefined ? undefined : inf > 0.3 || tag < 3 ? 'exsudativ' : tag < 14 ? 'proliferativ' : 'reparativ',
    wundsekret: inf > 0.5 ? 'eitrig' : blutetJetzt ? 'blutig' : tag !== undefined && tag < 3 ? 'serös' : inf > 0.25 ? 'serös' : 'keins',
    wundInfektZeichen: zeichen,
    verband: blut < 2 ? 'trocken' : blut < 15 ? 'leicht durchgeblutet' : blut < 60 ? 'durchgeblutet' : 'durchnässt',
    verbandBlutMl: Math.round(blut),
  };
}
