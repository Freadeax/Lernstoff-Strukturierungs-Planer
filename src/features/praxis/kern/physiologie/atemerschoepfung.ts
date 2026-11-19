// Atemerschöpfung (respiratorische Erschöpfung; Lernmodell, didaktisch gerundet, fachlich ungeprüft; AWMF S2k
// Bronchiolitis 048-014). Rein und deterministisch. Nur aktiv mit Treiber `atemerschoepfung` oder Grundgröße `erschoepfung`.
//
// Hohe Atemarbeit (Einziehungen, Nasenflügeln, Stöhnen) über Zeit erschöpft die Atemmuskulatur. Säuglinge haben wenig
// Reserve (weicher Brustkorb, flaches Zwerchfell, kleine Glykogenspeicher), Kleinkinder etwas mehr.
// - Erschöpfung (`erschoepfung` 0..1) wächst, solange die Atemarbeit über 1,6 liegt; erholt sich langsam darunter
//   (Absaugen, High-Flow/CPAP, Sauerstoff, Ruhe).
// - Ab 0,4: Der Atemantrieb fällt, das Kind wird „ruhiger“ und atmet langsamer (Alarmzeichen, nicht Besserung).
//   Ab 0,6 bei Säuglingen und Kleinkindern Apnoen. Folge: CO₂ steigt, SpO₂ fällt, Vigilanz sinkt, dann
//   präfinale Bradykardie (über die Hypoxie im Kreislauf).

import type { Altersgruppe, Grundgroessen, Treiber } from '../typen';
import { klemme } from './organe';

/** Erschöpfung je Stunde und Einheit Atemarbeit über der Schwelle */
const RATE: Record<Altersgruppe, number> = {
  saeugling: 0.6, kleinkind: 0.4, schulkind: 0.25, jugendlich: 0.15, erwachsen: 0.15, hochbetagt: 0.25,
};

export const ERSCHOEPFUNG_SCHWELLE = 1.6;

/** Ein Schritt; `undefined`, wenn der Fall keine Atemerschöpfung führt */
export function erschoepfungSchritt(alt: Grundgroessen, treiber: readonly Treiber[], dt: number, ag: Altersgruppe): number | undefined {
  const tr = treiber.find((t): t is Extract<Treiber, { art: 'atemerschoepfung' }> => t.art === 'atemerschoepfung');
  if (!tr && alt.erschoepfung === undefined) return undefined;
  const e0 = alt.erschoepfung ?? 0;
  const std = dt / 3600;
  const ueber = alt.atemarbeit - ERSCHOEPFUNG_SCHWELLE;
  if (ueber > 0) return klemme(e0 + (RATE[ag] ?? 0.15) * (tr?.tempo ?? 1) * ueber * std, 0, 1);
  return Math.max(0, e0 - 0.3 * std);
}

/** Faktor auf den Atemantrieb: bis 0,4 voll, dann Abfall bis auf 0,2 */
export const erschoepfungAntrieb = (e: number) => 1 - 0.8 * klemme((e - 0.4) / 0.5, 0, 1);

/** Faktor auf die sichtbare Atemarbeit: Das erschöpfte Kind zieht weniger ein */
export const erschoepfungArbeit = (e: number) => 1 - 0.4 * klemme((e - 0.4) / 0.5, 0, 1);

export function erschoepfungAnzeige(g: Grundgroessen, ag: Altersgruppe): { atemerschoepfung: 'keine' | 'droht' | 'dekompensiert'; apnoen: boolean } | undefined {
  if (g.erschoepfung === undefined) return undefined;
  const e = g.erschoepfung;
  return {
    atemerschoepfung: e < 0.25 ? 'keine' : e < 0.5 ? 'droht' : 'dekompensiert',
    apnoen: (ag === 'saeugling' || ag === 'kleinkind') && e > 0.6,
  };
}
