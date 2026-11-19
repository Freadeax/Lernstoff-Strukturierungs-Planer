// Grundsystem: Alkoholentzug (Lernmodell, didaktisch gerundet, fachlich ungeprüft; S3-Leitlinie „Screening, Diagnose und
// Behandlung alkoholbezogener Störungen“, AWMF 076-001). Rein und deterministisch.
//
// Treiber `alkoholentzug { schwere 0..1, letzterKonsumVorStd }`; Stunden seit dem letzten Konsum laufen mit der Spielzeit.
// - Verlauf (ohne Behandlung): vegetatives Entzugssyndrom ab etwa 6 h, Gipfel 24–72 h, klingt bis etwa 5 Tage ab.
//   Tremor, Schwitzen, Tachykardie, Hypertonie, Unruhe/Angst, Übelkeit, leichtes Fieber, Flüssigkeitsverlust.
// - Halluzinationen ab 12 h bei ausgeprägtem Entzug.
// - Krampfanfall: Fenster 12–48 h; die Krampfbereitschaft (`entzugKrampf` 0..1) wächst, solange der wirksame Entzug
//   über 0,55 liegt (bei 0,75 etwa 1 h); bei 1 ein Anfall (nur einmal).
// - Delirium tremens: ab 48 h bei schwerem, unbehandeltem Entzug (Delir-Last im Pflegemodell).
// - Benzodiazepine (G1, Kanal `entzugsschutz`: Lorazepam, Diazepam, Midazolam) dämpfen den wirksamen Entzug, solange sie
//   wirken (symptomgesteuerte Gabe nach CIWA-Ar). Der zugrunde liegende Entzug läuft weiter.
// - Thiamin (G1) verhindert die Wernicke-Enzephalopathie: Ohne Thiamin baut sich bei Mangelernährung langsam eine
//   Verwirrtheit auf (Grundgröße `wernicke`), mit Thiamin steigt sie nicht weiter und bildet sich langsam zurück.

import type { Grundgroessen, Treiber } from '../typen';
import { klemme } from './organe';

export type EntzugTreiber = Extract<Treiber, { art: 'alkoholentzug' }>;

const hin = (ist: number, ziel: number, tauSek: number, dt: number) => ist + (ziel - ist) * (1 - Math.exp(-dt / tauSek));

/** Vegetativer Entzug 0..1 nach Stunden seit dem letzten Konsum (ohne Behandlung) */
export function entzugsVerlauf(std: number): number {
  if (std < 6) return 0;
  if (std < 24) return (std - 6) / 18;
  if (std <= 72) return 1;
  return klemme(1 - (std - 72) / 48, 0, 1);
}

/** Anteil Delirium tremens 0..1 (nur bei schwerem Entzug ab 48 h) */
export function deliriumTremensFenster(std: number): number {
  if (std < 48) return 0;
  return std <= 96 ? 1 : klemme(1 - (std - 96) / 48, 0, 1);
}

export interface EntzugSchritt extends Pick<Grundgroessen, 'entzug' | 'entzugStd' | 'halluzination' | 'entzugKrampf' | 'wernicke' | 'thiamin'> {
  /** löst in diesem Takt einen Krampfanfall aus */
  krampfJetzt: boolean;
  /** zusätzliche Delir-Last (Delirium tremens, Halluzinationen) */
  delirLast: number;
}

/**
 * Ein Schritt Entzug. `seitStd`: Stunden seit dem Treiberbeginn; `schutz` 0..0,95 aus G1 (Benzodiazepine),
 * `thiaminGegeben` aus G1 (Spiegel > 0).
 */
export function entzugSchritt(alt: Grundgroessen, tr: EntzugTreiber, seitStd: number, dt: number, schutz: number, thiaminGegeben: boolean): EntzugSchritt {
  const std = tr.letzterKonsumVorStd + seitStd;
  const s = klemme(tr.schwere, 0, 1);
  const roh = s * entzugsVerlauf(std) + (s >= 0.6 ? 0.3 * s * deliriumTremensFenster(std) : 0);
  const ziel = klemme(roh * (1 - schutz), 0, 1.2);
  const entzug = hin(alt.entzug ?? ziel, ziel, 600, dt);
  const halluzination = std >= 12 ? klemme((entzug - 0.45) / 0.35, 0, 1) : 0;
  // Krampfbereitschaft baut sich auf, solange der wirksame Entzug im Fenster hoch ist (bei 1: Anfall, danach bleibt 1)
  const kb0 = alt.entzugKrampf ?? 0;
  const kb = kb0 >= 1 ? 1 : std >= 12 && std <= 48 ? Math.min(1, kb0 + 5 * Math.max(0, entzug - 0.55) * (dt / 3600)) : kb0;
  const krampfJetzt = kb0 < 1 && kb >= 1 && (alt.krampf ?? 0) === 0;
  const dtAnteil = std >= 48 ? klemme((entzug - 0.5) / 0.4, 0, 1) : 0;
  const delirLast = 2.5 * dtAnteil + 0.5 * halluzination;
  const thiamin = thiaminGegeben || alt.thiamin === 1 ? 1 : 0;
  const w0 = alt.wernicke ?? 0;
  const wernicke = thiamin ? Math.max(0, w0 - 0.01 * (dt / 3600)) : klemme(w0 + 0.02 * s * (dt / 3600), 0, 1);
  return { entzug, entzugStd: std, halluzination, entzugKrampf: kb, wernicke, thiamin, krampfJetzt, delirLast };
}

/** Grobes Zittern der ausgestreckten Hände (CIWA-Ar „Tremor“) */
export const tremorAus = (entzug: number): 'kein' | 'leicht' | 'deutlich' | 'grob' =>
  entzug < 0.15 ? 'kein' : entzug < 0.4 ? 'leicht' : entzug < 0.7 ? 'deutlich' : 'grob';

export interface CiwaAr {
  punkte: number;
  items: { uebelkeit: number; tremor: number; schwitzen: number; angst: number; agitation: number; taktil: number; akustisch: number; visuell: number; kopfschmerz: number; orientierung: number };
  stufe: 'leicht' | 'mittel' | 'schwer';
}

/**
 * CIWA-Ar (Clinical Institute Withdrawal Assessment for Alcohol, revised; Sullivan et al. 1989): 10 Bereiche,
 * 9 × 0–7 und Orientierung 0–4, Summe 0–67. Unter 10 leicht, 10–15 mittel, über 15 schwer (Benzodiazepin nach Anordnung).
 * Aus dem Modell geschätzt; im Fall erhebt die Pflege den Bogen selbst.
 */
export function ciwaAr(g: Grundgroessen): CiwaAr {
  const e = g.entzug ?? 0;
  const h = g.halluzination ?? 0;
  const r7 = (x: number) => Math.round(klemme(x, 0, 1) * 7);
  const items = {
    uebelkeit: r7(Math.max(g.uebelkeit, 0.6 * e)),
    tremor: r7(e),
    schwitzen: r7(0.9 * e),
    angst: r7(Math.max(g.angst, 0.7 * e)),
    agitation: r7(g.unruhe),
    taktil: r7(0.8 * h),
    akustisch: r7(0.6 * h),
    visuell: r7(0.9 * h),
    kopfschmerz: Math.round(klemme(0.6 * e, 0, 1) * 7),
    orientierung: Math.round(klemme((0.95 - g.orientierung) / 0.7, 0, 1) * 4),
  };
  const punkte = Object.values(items).reduce((x, y) => x + y, 0);
  return { punkte, items, stufe: punkte < 10 ? 'leicht' : punkte <= 15 ? 'mittel' : 'schwer' };
}
