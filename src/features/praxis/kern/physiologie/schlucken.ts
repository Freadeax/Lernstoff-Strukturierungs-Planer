// Grundsystem G6: Schlucken, Aspiration, Ernährung (Lernmodell, didaktisch gerundet, fachlich ungeprüft;
// Logopädie/Schluckdiagnostik und lokale Standards gehen vor). Rein und deterministisch.
//
// - Dysphagie 0..1 (Grundgröße `dysphagie`, vom Modell geschrieben): Treiber `schluckstoerung` { schwere },
//   Schlaganfall (G5: 0,8 × Defizit) oder eingetrübtes Bewusstsein (Vigilanz < 0,55).
// - Treiber `nahrung` { form: 'essen' | 'trinken' }: eine Mahlzeit bzw. ein Getränk (15 Minuten). Bei Dysphagie wird
//   aspiriert: dünne Flüssigkeit mehr als Brei; angepasste Kost (Grundgröße `kostAngepasst`, Katalog „kost-anpassen“),
//   wache aufrechte Person weniger. Ohne Dysphagie keine Wirkung.
// - Akut (`aspirationAkut`): Husten, Atemnot, Sättigungsabfall, klingt in etwa 20 Minuten ab.
// - Folge (`aspirationsPneumonie`): Nach genügend Aspiration entsteht über Stunden eine Pneumonie (wirkt wie der
//   Treiber `pneumonie`: Fieber, Rasselgeräusche, Gasaustausch).
// - GUSS (Gugging Swallowing Screen, Trapl 2007) 0–20 als Anzeige: 20 unauffällig, 15–19 leicht, 10–14 mittel, ≤ 9 schwer.
//   Bei eingetrübtem Bewusstsein endet der Test im Vorversuch (≤ 4).

import type { Grundgroessen, Treiber } from '../typen';
import { klemme } from './organe';

/** Dauer einer Mahlzeit/eines Getränks im Modell (Minuten) */
export const MAHLZEIT_MIN = 15;

type SchluckWerte = Pick<Grundgroessen, 'dysphagie' | 'aspiration' | 'aspirationAkut' | 'aspirationsPneumonie'>;

/** Dysphagie aus Treiber, Schlaganfall und Bewusstsein */
export function dysphagie(g: Grundgroessen, treiber: readonly Treiber[]): number {
  let d = 0;
  for (const t of treiber) if (t.art === 'schluckstoerung') d = Math.max(d, t.schwere);
  if (g.neuroDefizit !== undefined) d = Math.max(d, 0.8 * g.neuroDefizit);
  if (g.vigilanz < 0.55) d = Math.max(d, 0.8);
  return klemme(d, 0, 1);
}

/** Aspiration je Minute während einer Mahlzeit */
export function aspirationsRate(dys: number, form: 'essen' | 'trinken', kostAngepasst: number, vigilanz: number): number {
  if (dys <= 0.05) return 0;
  const konsistenz = form === 'trinken' ? 1.4 : 1;
  const angepasst = 1 - 0.65 * klemme(kostAngepasst, 0, 1);
  const wach = vigilanz < 0.8 ? 1.5 : 1;
  return 0.03 * dys * konsistenz * angepasst * wach;
}

/** Ein Schritt Schlucken/Aspiration; undefined, wenn der Fall nichts davon führt. */
export function schluckSchritt(alt: Grundgroessen, treiber: readonly Treiber[], dt: number, seitMin: (tr: Treiber) => number): SchluckWerte | undefined {
  const dys = dysphagie(alt, treiber);
  const mahlzeiten = treiber.filter((t): t is Extract<Treiber, { art: 'nahrung' }> => t.art === 'nahrung' && seitMin(t) < MAHLZEIT_MIN);
  // Nur wenn der Fall Schlucken betrifft (Störung, Schlaganfall, Mahlzeit); Eintrübung allein legt nichts an.
  const gefuehrt = alt.dysphagie !== undefined || alt.neuroDefizit !== undefined || mahlzeiten.length > 0
    || treiber.some((t) => t.art === 'schluckstoerung');
  if (!gefuehrt) return undefined;
  const min = dt / 60;
  let zuwachs = 0;
  for (const m of mahlzeiten) zuwachs += aspirationsRate(dys, m.form, alt.kostAngepasst ?? 0, alt.vigilanz) * min;
  // stille Aspiration von Speichel bei schwerer Dysphagie und Eintrübung
  if (dys > 0.5 && alt.vigilanz < 0.55) zuwachs += (0.05 / 60) * min;
  const aspiration = (alt.aspiration ?? 0) + zuwachs;
  const akut0 = alt.aspirationAkut ?? 0;
  const aspirationAkut = akut0 * Math.exp(-dt / 1200) + 3 * zuwachs;
  // Folge-Pneumonie: über Stunden, sobald genügend aspiriert wurde
  // Schwere folgt der aspirierten Menge, entwickelt sich mit einer Zeitkonstante von etwa 4 Stunden
  const pn0 = alt.aspirationsPneumonie ?? 0;
  const pnZiel = klemme((aspiration - 0.1) * 1.5, 0, 1.2);
  const aspirationsPneumonie = pnZiel > pn0 ? pn0 + (pnZiel - pn0) * (1 - Math.exp(-dt / 14400)) : pn0;
  return { dysphagie: dys, aspiration, aspirationAkut: klemme(aspirationAkut, 0, 1), aspirationsPneumonie };
}

/** GUSS 0–20 aus Dysphagie und Bewusstsein */
export function guss(g: Grundgroessen): number | undefined {
  if (g.dysphagie === undefined) return undefined;
  if (g.vigilanz < 0.8) return Math.min(4, Math.round(5 - 5 * g.dysphagie));
  return Math.round(20 - 20 * g.dysphagie);
}
