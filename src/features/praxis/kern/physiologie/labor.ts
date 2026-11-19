// Grundsystem G8: Labor aus dem Modell (Lernmodell, didaktisch gerundet, fachlich ungeprüft; Referenzbereiche des
// eigenen Labors gehen vor). Rein und deterministisch. Parameter, Einheiten, Referenzen, Laufzeiten und Bewertung kommen
// aus dem Labor-Modell der Diagnostik-Seite (src/ui/sim/labor/parameter.ts), damit beide gleich rechnen.
//
// Modellwerte (Bestände mit Verzögerung, Startwert = Zielwert, weil die Krankheit vor Fallbeginn besteht):
// - Entzündung (`entzuendung` 0..1,2): Sepsis, Pneumonie, Aspirationspneumonie (G6), Wundinfekt (G9).
//   CRP steigt langsam (Zeitkonstante 12 h, fällt mit 24 h), Leukozyten schneller (3 h), PCT bei Sepsis (4 h).
// - Niere: Kreatinin und Harnstoff steigen, wenn der Stundenurin je kg (G2) fällt (prärenal); Harnstoff zusätzlich bei
//   Exsikkose. eGFR grob nach CKD-EPI aus Kreatinin und Altersgruppe.
// - Natrium steigt bei Exsikkose (Hypernatriämie), Kalium aus G2 plus Anstieg bei Nierenversagen.
// - Hb = Ausgangs-Hb × Erythrozytenmasse (`hbMasse`, sinkt bei Blutung) / Volumen: Bei akuter Blutung bleibt das Hb
//   zunächst gleich und fällt erst mit Infusion/Auffüllung („Hb ist ein später Wert“); Exsikkose konzentriert.
// - Gerinnung grob: Sepsis (Verbrauch) und Massivblutung (Verdünnung) senken Thrombozyten, verlängern INR und aPTT.
// - Glukose = Blutzucker, Laktat aus Spur B oder aus Kreislauf und Sepsis.

import type { ModellKontext } from '../modell';
import type { Altersgruppe, Grundgroessen, Treiber } from '../typen';
import { klemme } from './organe';
import { urinMlH } from './niere';

const naeher = (ist: number, ziel: number, tauAufSek: number, tauAbSek: number, dt: number) =>
  ist + (ziel - ist) * (1 - Math.exp(-dt / (ziel > ist ? tauAufSek : tauAbSek)));

const KIND = new Set<Altersgruppe>(['saeugling', 'kleinkind', 'schulkind']);

/** Ausgangswerte je Altersgruppe */
export function laborBasis(ag: Altersgruppe): { hb: number; krea: number; harnstoff: number; leuko: number; thrombo: number } {
  if (ag === 'saeugling') return { hb: 11.5, krea: 0.3, harnstoff: 15, leuko: 10, thrombo: 300 };
  if (ag === 'kleinkind') return { hb: 12, krea: 0.4, harnstoff: 18, leuko: 9, thrombo: 300 };
  if (ag === 'schulkind') return { hb: 13, krea: 0.55, harnstoff: 20, leuko: 7.5, thrombo: 280 };
  if (ag === 'hochbetagt') return { hb: 12.5, krea: 1.1, harnstoff: 40, leuko: 7, thrombo: 230 };
  return { hb: 13.5, krea: 0.9, harnstoff: 28, leuko: 7, thrombo: 250 };
}

/** Entzündungsgrad aus Treibern und Folgezuständen */
export function entzuendungZiel(g: Grundgroessen, treiber: readonly Treiber[]): { entzuendung: number; sepsis: number } {
  let e = 0, sepsis = 0;
  for (const t of treiber) {
    if (t.art === 'sepsis_verlauf') { sepsis = Math.max(sepsis, 0.8 * Math.min(1.5, t.tempo)); e = Math.max(e, sepsis); }
    if (t.art === 'pneumonie') e = Math.max(e, 0.6 * t.staerke);
  }
  e = Math.max(e, 0.6 * (g.aspirationsPneumonie ?? 0), 0.7 * (g.wundInfekt ?? 0));
  return { entzuendung: klemme(e, 0, 1.2), sepsis: klemme(sepsis, 0, 1.2) };
}

/** Relative Nierenleistung aus Stundenurin je kg (1 ≈ 1 ml/kg/h) */
const nierenleistung = (map: number, volumen: number, kg: number) => klemme(urinMlH(map, volumen, kg) / Math.max(1, kg), 0.1, 1.2);

type LaborBestand = Pick<Grundgroessen, 'entzuendung' | 'sepsisGrad' | 'crp' | 'leuko' | 'pct' | 'krea' | 'harnstoff' | 'hbMasse'>;

/** Ziele der verzögerten Laborwerte */
function ziele(g: Grundgroessen, ag: Altersgruppe, entz: number, sepsis: number, map: number, kg: number) {
  const b = laborBasis(ag);
  const niere = nierenleistung(map, g.volumen, kg);
  return {
    crp: 3 + 180 * entz,
    leuko: b.leuko + 9 * entz,
    pct: 0.05 + 8 * sepsis,
    krea: b.krea / Math.max(0.15, niere) ** 0.8,
    harnstoff: b.harnstoff / Math.max(0.15, niere) + 60 * Math.max(0, 0.9 - g.hydratation),
  };
}

/** Ein Schritt Labor: verzögerte Werte nachführen. `map` aus dem Kreislauf des alten Zustands. */
export function laborSchritt(alt: Grundgroessen, treiber: readonly Treiber[], dt: number, k: ModellKontext, map: number, kg: number, blutungMlMin: number, blutvolumenMl: number): LaborBestand {
  const { entzuendung: ez, sepsis } = entzuendungZiel(alt, treiber);
  const z = ziele(alt, k.altersgruppe, ez, sepsis, map, kg);
  const r: LaborBestand = {
    entzuendung: alt.entzuendung === undefined ? ez : naeher(alt.entzuendung, ez, 3600, 7200, dt),
    sepsisGrad: sepsis,
    crp: alt.crp === undefined ? z.crp : naeher(alt.crp, z.crp, 12 * 3600, 24 * 3600, dt),
    leuko: alt.leuko === undefined ? z.leuko : naeher(alt.leuko, z.leuko, 3 * 3600, 12 * 3600, dt),
    pct: alt.pct === undefined ? z.pct : naeher(alt.pct, z.pct, 4 * 3600, 24 * 3600, dt),
    krea: alt.krea === undefined ? z.krea : naeher(alt.krea, z.krea, 12 * 3600, 24 * 3600, dt),
    harnstoff: alt.harnstoff === undefined ? z.harnstoff : naeher(alt.harnstoff, z.harnstoff, 8 * 3600, 24 * 3600, dt),
  };
  if (blutungMlMin > 0 || alt.hbMasse !== undefined) r.hbMasse = Math.max(0.2, (alt.hbMasse ?? 1) - (blutungMlMin * dt) / 60 / blutvolumenMl);
  return r;
}

/** Laborwerte zum jetzigen Zustand (Parameter-IDs wie in src/ui/sim/labor/parameter.ts) */
export type LaborWerte = Partial<Record<'leuko' | 'hb' | 'thrombo' | 'crp' | 'pct' | 'na' | 'k' | 'krea' | 'egfr' | 'harnstoff' | 'inr' | 'aptt' | 'glukose' | 'laktat', number>>;

export function laborWerte(g: Grundgroessen, k: ModellKontext, laktat: number): LaborWerte {
  const ag = k.altersgruppe;
  const b = laborBasis(ag);
  const sepsis = g.sepsisGrad ?? 0;
  const masse = g.hbMasse ?? 1;
  const verduennung = Math.max(0, 0.75 - masse);
  const krea = g.krea ?? b.krea;
  const alter = ag === 'hochbetagt' ? 85 : 50;
  const w: LaborWerte = {
    leuko: g.leuko ?? b.leuko,
    hb: (b.hb * masse) / Math.max(0.5, g.volumen),
    thrombo: Math.max(15, b.thrombo * (1 - 0.45 * Math.min(1, sepsis)) * (1 - 1.2 * verduennung)),
    crp: g.crp ?? 3,
    pct: g.pct ?? 0.05,
    na: Math.min(170, 140 + 45 * Math.max(0, 0.95 - g.hydratation)),
    k: Math.min(7.5, (g.kalium ?? 4.2) + 0.5 * Math.max(0, krea / b.krea - 1.5)),
    krea,
    harnstoff: g.harnstoff ?? b.harnstoff,
    inr: 1 + 0.6 * sepsis + 1.6 * verduennung,
    aptt: 30 + 10 * sepsis + 25 * verduennung,
    glukose: g.blutzucker,
    laktat,
  };
  if (!KIND.has(ag)) {
    const s = krea / 0.8;
    w.egfr = Math.min(130, 141 * Math.min(s, 1) ** -0.4 * Math.max(s, 1) ** -1.2 * 0.993 ** alter);
  }
  return w;
}
