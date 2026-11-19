// Grundsystem G5: Neurologie (Lernmodell, didaktisch gerundet, fachlich ungeprüft; lokale Vorgaben und SOP der Stroke Unit gehen vor).
// Rein und deterministisch.
//
// - Treiber `schlaganfall` { seite (betroffene Körperseite), schwere 0..1, blutung?, beginnVorMin? }:
//   Das neurologische Defizit (Grundgröße `neuroDefizit`) baut sich in Minuten auf und wächst unbehandelt langsam weiter
//   (Penumbra geht verloren). Rechte Körperseite betroffen = linke Hirnhälfte → Aphasie.
//   Blutung: Hirndruck steigt; eine Lyse verschlimmert ihn (deshalb Bildgebung vor Lyse).
// - Treiber `lyse` (ärztliche Anordnung, rtPA): senkt das Ziel-Defizit umso mehr, je früher sie kommt; nach 4,5 h kein Nutzen
//   (DGN-Leitlinie Akuttherapie des ischämischen Schlaganfalls 2021: Zeitfenster 4,5 h, „time is brain“).
// - Treiber `hirndruck` { tempo, seite? }: Raumforderung (Blutung, Schädel-Hirn-Trauma); Grundgröße `hirndruck` 0..1.
//   Zeichen: Vigilanz sinkt, Erbrechen, gleichseitige Pupille weit und träge, dann lichtstarr; spät Cushing (Puls ↓, RR ↑)
//   und unregelmäßige Atmung.
// - Pupillen für alle: Opioide eng, schwere Hypoxie/Kreislaufstillstand weit und lichtstarr.
// - GCS-Teilwerte (Augen, verbal, motorisch) passend zur Summe; Aphasie senkt den verbalen Wert.
// - FAST und NIHSS (grob) aus dem Defizit; Minuten seit Symptombeginn und verbleibendes Lysefenster für Zeitdruck.

import type { Anzeige, Grundgroessen, Treiber } from '../typen';
import { klemme } from './organe';

const hin = (ist: number, ziel: number, tauSek: number, dt: number) => ist + (ziel - ist) * (1 - Math.exp(-dt / tauSek));

/** Lysefenster in Minuten ab Symptombeginn */
export const LYSE_FENSTER_MIN = 270;

type Schlaganfall = Extract<Treiber, { art: 'schlaganfall' }>;
type Hirndruck = Extract<Treiber, { art: 'hirndruck' }>;

/** Nutzen der Lyse 0..0,6 je nach Zeitpunkt (Minuten nach Symptombeginn) */
export function lyseNutzen(minNachBeginn: number): number {
  return 0.6 * klemme(1 - minNachBeginn / LYSE_FENSTER_MIN, 0, 1);
}

/**
 * Ein Schritt Neuro. `seitMin(tr)` liefert die Minuten seit Start eines Treibers (aus dem Pflegemodell).
 * Gibt undefined zurück, wenn der Fall keine Neurologie führt.
 */
export function neuroSchritt(alt: Grundgroessen, treiber: readonly Treiber[], dt: number, seitMin: (tr: Treiber) => number):
  Pick<Grundgroessen, 'neuroDefizit' | 'hirndruck' | 'neuroSeite' | 'seitBeginnMin'> | undefined {
  const sa = treiber.find((t): t is Schlaganfall => t.art === 'schlaganfall');
  const hd = treiber.find((t): t is Hirndruck => t.art === 'hirndruck');
  if (!sa && !hd && alt.neuroDefizit === undefined && alt.hirndruck === undefined) return undefined;
  const r: Pick<Grundgroessen, 'neuroDefizit' | 'hirndruck' | 'neuroSeite' | 'seitBeginnMin'> = {};
  const std = dt / 3600;
  let icpRate = 0;
  if (sa) {
    const beginn = (sa.beginnVorMin ?? 0) + seitMin(sa);
    r.seitBeginnMin = beginn;
    r.neuroSeite = sa.seite === 'links' ? 1 : -1;
    const lyse = treiber.find((t) => t.art === 'lyse');
    let ziel = sa.schwere * (1 + 0.15 * klemme(beginn / 360, 0, 1));
    if (lyse && !sa.blutung) {
      const lyseBeiMin = beginn - seitMin(lyse);
      ziel = sa.schwere * (1 - lyseNutzen(lyseBeiMin));
    }
    const d0 = alt.neuroDefizit ?? 0;
    r.neuroDefizit = klemme(hin(d0, ziel, ziel < d0 ? 1800 : 600, dt), 0, 1);
    if (sa.blutung) icpRate += 0.25 * sa.schwere * (lyse ? 4 : 1);
  } else if (alt.neuroDefizit !== undefined) {
    r.neuroDefizit = alt.neuroDefizit;
    r.neuroSeite = alt.neuroSeite;
  }
  if (hd) icpRate += 0.5 * hd.tempo;
  if (icpRate > 0 || alt.hirndruck !== undefined) {
    r.hirndruck = klemme((alt.hirndruck ?? 0) + icpRate * std, 0, 1);
    if (hd && r.neuroSeite === undefined) r.neuroSeite = (hd.seite ?? 'rechts') === 'rechts' ? 1 : -1;
  }
  return r;
}

/** Faktor auf die Vigilanz durch Hirndruck und schweren Schlaganfall */
export function neuroVigilanz(g: Grundgroessen): number {
  const icp = g.hirndruck ?? 0;
  const d = g.neuroDefizit ?? 0;
  return (1 - 0.85 * klemme((icp - 0.3) / 0.6, 0, 1)) * (1 - 0.3 * klemme((d - 0.7) / 0.3, 0, 1));
}

/** Cushing-Reaktion 0..1 (später Hirndruck): Puls langsamer, Blutdruck höher, Atmung unregelmäßig */
export const cushing = (g: Grundgroessen) => klemme(((g.hirndruck ?? 0) - 0.65) / 0.3, 0, 1);

/** Nachlastfaktor: Erfordernishochdruck beim Schlaganfall */
export const neuroNachlast = (g: Grundgroessen) => 1 + 0.15 * (g.neuroDefizit ?? 0);

/** Cushing-Druckanstieg in mmHg (systolisch, diastolisch): Das Gehirn erzwingt Durchblutung gegen den Hirndruck */
export const cushingDruck = (g: Grundgroessen): [number, number] => [45 * cushing(g), 20 * cushing(g)];

/** Aphasie: rechte Körperseite betroffen (linke Hirnhälfte) */
export const aphasie = (g: Grundgroessen) => (g.neuroSeite ?? 0) < 0 && (g.neuroDefizit ?? 0) > 0.25;

export type Lichtreaktion = 'prompt' | 'träge' | 'lichtstarr';

/** Pupillen: Größe in mm und Lichtreaktion je Seite */
export function pupillen(g: Grundgroessen, kind: boolean, saO2: number, stillstand: boolean, opioid: number): Pick<Anzeige, 'pupilleRechtsMm' | 'pupilleLinksMm' | 'pupilleRechtsLicht' | 'pupilleLinksLicht'> {
  const basis = kind ? 4 : 3.5;
  const eng = basis - (basis - 1.5) * klemme(opioid / (opioid + 0.35), 0, 1);
  let re = eng, li = eng;
  let lRe: Lichtreaktion = 'prompt', lLi: Lichtreaktion = 'prompt';
  const icp = g.hirndruck ?? 0;
  if (icp > 0.5) {
    // gleichseitig zur Raumforderung: neuroSeite 1 = linke Körperseite betroffen = rechte Hirnhälfte
    const weit = icp > 0.95 ? 7 : 4 + 3 * klemme((icp - 0.5) / 0.3, 0, 1);
    const licht: Lichtreaktion = icp > 0.8 ? 'lichtstarr' : 'träge';
    if ((g.neuroSeite ?? 1) > 0) { re = weit; lRe = licht; } else { li = weit; lLi = licht; }
    if (icp > 0.95) { re = li = 7; lRe = lLi = 'lichtstarr'; }
  }
  if (stillstand || saO2 < 0.5) { re = li = 7; lRe = lLi = 'lichtstarr'; }
  const r1 = (x: number) => Math.round(x * 2) / 2;
  return { pupilleRechtsMm: r1(re), pupilleLinksMm: r1(li), pupilleRechtsLicht: lRe, pupilleLinksLicht: lLi };
}

/** GCS-Teilwerte aus Vigilanz und Orientierung (Summe = bisherige GCS); Aphasie senkt den verbalen Wert. */
export function gcsTeile(vigilanz: number, orientierung: number, g?: Grundgroessen): { augen: number; verbal: number; motorik: number } {
  const augen = vigilanz > 0.8 ? 4 : vigilanz > 0.55 ? 3 : vigilanz > 0.3 ? 2 : 1;
  let verbal = vigilanz <= 0.2 ? 1 : vigilanz <= 0.35 ? 2 : vigilanz <= 0.55 ? 3 : orientierung > 0.85 && vigilanz > 0.8 ? 5 : orientierung > 0.3 ? 4 : 3;
  const motorik = vigilanz > 0.55 ? 6 : vigilanz > 0.3 ? 5 : vigilanz > 0.2 ? 4 : vigilanz > 0.1 ? 3 : vigilanz > 0.05 ? 2 : 1;
  if (g && aphasie(g)) verbal = Math.min(verbal, (g.neuroDefizit ?? 0) > 0.6 ? 2 : 4);
  return { augen, verbal, motorik };
}

/** FAST (Face, Arm, Speech) 0–3 und NIHSS grob 0–42 aus dem Defizit */
export function schlaganfallZeichen(g: Grundgroessen): Pick<Anzeige, 'fast' | 'nihss' | 'seitBeginnMin' | 'lyseFensterMin'> | undefined {
  if (g.neuroDefizit === undefined) return undefined;
  const d = g.neuroDefizit;
  const fast = (d > 0.15 ? 1 : 0) + (d > 0.25 ? 1 : 0) + (aphasie(g) || d > 0.35 ? 1 : 0);
  const r: Pick<Anzeige, 'fast' | 'nihss' | 'seitBeginnMin' | 'lyseFensterMin'> = { fast, nihss: Math.round(d * 24 + (aphasie(g) ? 3 : 0)) };
  if (g.seitBeginnMin !== undefined) {
    r.seitBeginnMin = Math.round(g.seitBeginnMin);
    r.lyseFensterMin = Math.max(0, Math.round(LYSE_FENSTER_MIN - g.seitBeginnMin));
  }
  return r;
}
