// Grundsystem G7: Schlaf und Tageszeit als Delir-Auslöser (Lernmodell, didaktisch gerundet, fachlich ungeprüft).
// Rein und deterministisch. Nur aktiv, wenn der Fall Schlaf führt: Treiber `schlafstoerung` oder Grundgröße `schlafdefizit`.
//
// - Uhrzeit aus ModellKontext.uhrzeitMin (Fallstart, vom Kern gesetzt) + Spielzeit. Nacht 22–6 Uhr.
// - Nachts stören Lärm/Licht/Pflegehandlungen (Treiber `schlafstoerung { staerke }`), Schmerz, Angst, volle Blase und
//   Harndrang (G2). Wer nachts wach liegt, baut ein Schlafdefizit auf; ungestörter Schlaf baut es ab.
//   Schutz: „reizarm-gestalten“ setzt die Grundgröße `schlafSchutz` (Wirkkurve, etwa 4 Stunden).
// - Folgen: Schlafdefizit und nächtliche Störung sind Delir-Auslöser (S3-Leitlinie Delir: Schlafförderung als nicht-
//   medikamentöse Prävention); bei bestehendem Delir verschlechtert sich die Orientierung abends und nachts
//   (Sundowning).

import type { ModellKontext } from '../modell';
import type { Grundgroessen, Treiber } from '../typen';
import { klemme } from './organe';

/** Minuten seit Mitternacht (oder undefined ohne Uhrzeit) */
export function uhrzeitMin(k: ModellKontext): number | undefined {
  if (k.uhrzeitMin === undefined) return undefined;
  return (((k.uhrzeitMin + (k.t ?? 0) / 60) % 1440) + 1440) % 1440;
}

export const istNacht = (min: number) => min >= 22 * 60 || min < 6 * 60;
/** Abend und Nacht (Sundowning ab 18 Uhr) */
export const istAbendOderNacht = (min: number) => min >= 18 * 60 || min < 6 * 60;

/** Führt der Fall Schlaf? */
export const schlafAktiv = (g: Grundgroessen, treiber: readonly Treiber[]) =>
  g.schlafdefizit !== undefined || treiber.some((t) => t.art === 'schlafstoerung');

/** Nächtliche Störung 0..~1,5 aus Umgebung und Befinden */
export function nachtStoerung(g: Grundgroessen, treiber: readonly Treiber[]): number {
  let s = 0;
  for (const t of treiber) if (t.art === 'schlafstoerung') s = Math.max(s, t.staerke);
  s *= 1 - 0.7 * klemme(g.schlafSchutz ?? 0, 0, 1);
  if (g.schmerz >= 5) s += 0.3;
  if (g.angst > 0.4) s += 0.2;
  if ((g.blaseMl ?? 0) > 400 || (g.wirkDiurese ?? 0) > 50) s += 0.3;
  return s;
}

/** Ein Schritt Schlaf: neues Schlafdefizit und ob die Person nachts wach liegt. */
export function schlafSchritt(alt: Grundgroessen, treiber: readonly Treiber[], dt: number, k: ModellKontext): Pick<Grundgroessen, 'schlafdefizit' | 'nachtWach'> | undefined {
  if (!schlafAktiv(alt, treiber)) return undefined;
  const uhr = uhrzeitMin(k);
  const std = dt / 3600;
  const d0 = alt.schlafdefizit ?? 0;
  if (uhr === undefined || !istNacht(uhr)) return { schlafdefizit: Math.max(0, d0 - 0.01 * std), nachtWach: 0 };
  const stoerung = nachtStoerung(alt, treiber);
  const wach = stoerung > 0.25 || alt.unruhe > 0.35 || alt.delir > 0.5;
  const schlafdefizit = klemme(wach ? d0 + 0.12 * (0.5 + stoerung) * std : d0 - 0.08 * std, 0, 1);
  return { schlafdefizit, nachtWach: wach ? 1 : 0 };
}

/** Delir-Last aus Schlaf (zusätzlich zu den Auslösern im Pflegemodell) */
export function schlafDelirLast(g: Grundgroessen, treiber: readonly Treiber[], k: ModellKontext): number {
  if (!schlafAktiv(g, treiber)) return 0;
  const uhr = uhrzeitMin(k);
  const nacht = uhr !== undefined && istNacht(uhr);
  return 0.8 * (g.schlafdefizit ?? 0) + (nacht ? 0.5 * nachtStoerung(g, treiber) : 0);
}

/** Sundowning: zusätzlicher Orientierungsverlust abends/nachts bei bestehendem Delir */
export function sundowning(g: Grundgroessen, treiber: readonly Treiber[], k: ModellKontext): number {
  if (!schlafAktiv(g, treiber)) return 0;
  const uhr = uhrzeitMin(k);
  return uhr !== undefined && istAbendOderNacht(uhr) ? 0.25 * g.delir : 0;
}

/** Anzeige: schläft / wach / wach und unruhig (nur wenn der Fall Schlaf führt) */
export function schlafZustand(g: Grundgroessen, k: ModellKontext): 'schläft' | 'wach' | 'wach, unruhig' | undefined {
  if (g.schlafdefizit === undefined) return undefined;
  const uhr = uhrzeitMin(k);
  if (uhr !== undefined && istNacht(uhr) && !g.nachtWach) return 'schläft';
  return g.unruhe > 0.35 ? 'wach, unruhig' : 'wach';
}
