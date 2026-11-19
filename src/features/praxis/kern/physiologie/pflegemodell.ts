// Pflege-Physiologiemodell v2 (Paket P1, KONZEPT 4.1–4.4, 4.6). Rein, deterministisch, ohne Zufall.
// LERNMODELL: plausibel und lehrreich, keine Messwerte eines Menschen. Der Hinweis „Lernmodell“ bleibt in der Oberfläche Pflicht.
//
// Aufbau
// - Bestände ändern sich nur durch Treiber und Wirkkurven: volumen, hydratation, gefaesstonus, pumpleistung, blutzucker,
//   delir, angst, schmerz, sauerstoff, krampf.
// - Abgeleitete Größen regelt das Modell zu einem Ziel = Basis (Ausgangslage des Falls) + Treiber-Effekt + laufende
//   Wirkkurven (kontext.wirkung): vigilanz, orientierung, unruhe, uebelkeit, atemantrieb, atemarbeit, gasaustausch, temperatur.
//   So bleibt eine Wirkkurve (z. B. Lorazepam senkt die Vigilanz) erhalten, und Ursachen (Hypoglykämie, Hypoxie, CO₂)
//   wirken trotzdem sofort mit.
// - Anzeige: Kreislauf über das Herzmodell der Lernseite (Frank-Starling, Mitteldruck) mit Barorezeptor-Reflex;
//   Atmung über alveoläre Gasgleichung, Shunt und Sauerstoffbindungskurve (O₂ hilft bei Hypoventilation, kaum bei Shunt,
//   und verdeckt eine Hypoventilation: CO₂ steigt, die Vigilanz sinkt).
//
// Treiber (Parameter)
// - blutung {mlProMin}: Blutvolumen nach Gewicht und Altersprofil.
// - bronchospasmus {staerke 0..1}: Atemarbeit +2·s, Gasaustausch −0,3·s, Giemen.
// - pneumonie {staerke 0..1}: Gasaustausch-Verlust nach dem Shunt des Lungenmodells, Fieber, Rasseln.
// - hypoglykaemie {abfallProStunde}: Blutzucker sinkt linear.
// - sepsis_verlauf {tempo}: tempo 1 = typischer Verlauf über Stunden (Gefäßtonus −0,25/h, Kapillarleck, Fieber).
// - opioid_ueberhang {spiegel, halbwertMin}: Spiegel klingt mit der Halbwertszeit ab (ab `seit`), dämpft Atemantrieb und Vigilanz.
// - naloxon {halbwertMin}: hebt die Opioidwirkung auf, wirkt aber kürzer (Renarkotisierung).
// - insulin {ie, gipfelMin?}, kohlenhydrate {gramm, schnell?}: Wirkkurven wie im Blutzuckermodell der Lernseite.
// - exsikkose_progressiv {verlustProStunde}: Hydratation sinkt, Volumen zu 80 % mit; Fieber verstärkt den Verlust.
// - delir_trigger {ausloeser}: Delir steigt, solange Auslöser wirken (Exsikkose, Schmerz ≥ 4, Infekt/Fieber,
//   Medikamente/Opioid, fremde Umgebung bei Angst, Harnverhalt-Treiber), sonst klingt es langsam ab.
// - harnverhalt: Schmerz und Unruhe steigen; endet über MassnahmeDefinition.beendet (z. B. Einmalkatheter nach Anordnung).
// - panik_eskaliert {tempo}: Angst steigt, Hyperventilation (CO₂ sinkt).
// - fieberkrampf_kind {temperaturSchwelle}: Fieber steigt über die Schwelle → ein Anfall (krampf 1 → 3 Min. → postiktal).

import type { Altersgruppe, Anzeige, AktiverTreiber, Grundgroessen, Rhythmus, Treiber } from '../typen';
import { NORMAL, type ModellKontext, type PhysiologieModell } from '../modell';
import { profil, type Altersprofil } from './altersprofile';
import { herz, HERZ_START, klemme, lunge, wirkAnteil, ZUCKER_FAUSTWERTE, type Befund, type Lage } from './organe';
import { pharmaEffekte, type PharmaEffekte } from './wirkstoffe';
import { hautSchritt } from './haut-mobilitaet';
import { blaseNaechste, kaliumNachDiurese, stundenurin, urinFarbe } from './niere';

/* ───────────────────────── Hilfen ───────────────────────── */

const REF = herz(HERZ_START);
/** Zusätzlicher Shunt einer Pneumonie (Stärke 1) im Lungenmodell der Lernseite, flache Rückenlage */
const PNEUMONIE_SHUNT = lunge('rueckenlage', 'pneumonie-rechts').shunt - lunge('rueckenlage', 'gesund').shunt;
/** Umrechnung Shunt des Lungenmodells → Verlust an Gasaustausch (kalibriert: Pneumonie Stärke 1 ≈ SpO₂ 88–90 % unter Raumluft) */
const SHUNT_ZU_GAS = 1.6;
const PNEUMONIE_VERLUST = SHUNT_ZU_GAS * PNEUMONIE_SHUNT;

/**
 * Wirkung einer Lagerung auf den Gasaustausch nach dem Lungenmodell der Lernseite (für Wirkkurven im Katalog, P3):
 * Differenz zur flachen Rückenlage, z. B. Pneumonie rechts → Seitenlage links („gesunde Seite nach unten“) ist positiv.
 */
export function lagerungsWirkung(befund: Befund, lage: Lage): number {
  return Math.round(SHUNT_ZU_GAS * (lunge('rueckenlage', befund).shunt - lunge(lage, befund).shunt) * 100) / 100;
}

/** Exponentielle Annäherung, unabhängig von der Schrittweite */
const hin = (ist: number, ziel: number, tauSek: number, dt: number) => ist + (ziel - ist) * (1 - Math.exp(-dt / tauSek));
const hill = (x: number, ec50: number, n = 2) => (x <= 0 ? 0 : x ** n / (x ** n + ec50 ** n));
const halb = (min: number, hwzMin: number) => 0.5 ** (Math.max(0, min) / Math.max(1, hwzMin));

/** Severinghaus: Sauerstoffsättigung (0..1) aus dem Partialdruck (mmHg) */
export function saettigung(po2: number): number {
  const p = Math.max(1, po2);
  return 1 / (23400 / (p ** 3 + 150 * p) + 1);
}

/** FiO₂ aus O₂-Fluss in l/min (Brille bis 6 l: etwa +4 % je Liter; Maske darüber, höchstens 0,8) */
export function fio2AusFluss(lMin: number): number {
  const l = Math.max(0, lMin);
  return Math.min(0.8, 0.21 + 0.04 * Math.min(l, 6) + 0.025 * Math.max(0, l - 6));
}

function seitMin(tr: Treiber, k: ModellKontext): number {
  return ((k.t ?? 0) - ((tr as AktiverTreiber).seit ?? 0)) / 60;
}

/** Wirksamer Opioidspiegel (nach Halbwertszeit und Naloxon) */
export function opioidWirkung(treiber: readonly Treiber[], k: ModellKontext): number {
  return pharma(treiber, k).opioid;
}

/** Arzneimittelwirkung gesamt: Treiber opioid_ueberhang/naloxon (P1) und Wirkstoff-Treiber (G1) gemeinsam verrechnet */
export function pharma(treiber: readonly Treiber[], k: ModellKontext): PharmaEffekte {
  let spiegel = 0;
  let block = 0;
  for (const tr of treiber) {
    if (tr.art === 'opioid_ueberhang') spiegel += tr.spiegel * halb(seitMin(tr, k), tr.halbwertMin);
    if (tr.art === 'naloxon') block = Math.max(block, 0.95 * halb(seitMin(tr, k), tr.halbwertMin));
  }
  return pharmaEffekte(treiber, k, gewicht(k, profil(k.altersgruppe)), spiegel, block);
}

/**
 * Angewandter Arzneimittelanteil auf einen Bestand: Der Bestand trägt den Anteil, solange der Wirkstoff wirkt, und
 * bekommt ihn zurück, wenn er abflutet (Schmerz kehrt zurück). Rückgabe: [neuer Bestand, neuer Anteil].
 */
function anteilAnwenden(bestand: number, alterAnteil: number, neuerAnteil: number, min: number): [number, number] {
  const ohne = bestand - alterAnteil;
  const anteil = Math.max(neuerAnteil, min - ohne);   // nicht unter das Minimum drücken
  return [ohne + anteil, anteil];
}

const hat = (treiber: readonly Treiber[], art: Treiber['art']) => treiber.some((t) => t.art === art);
const staerke = (treiber: readonly Treiber[], art: 'bronchospasmus' | 'pneumonie') =>
  treiber.reduce((s, t) => (t.art === art ? Math.max(s, t.staerke) : s), 0);
const sepsisTempo = (treiber: readonly Treiber[]) => treiber.reduce((s, t) => (t.art === 'sepsis_verlauf' ? Math.max(s, t.tempo) : s), 0);

/** Panik: Angst oberhalb 0,6 wirkt überproportional (Hyperventilation, Tachykardie) 0..1 */
const panik = (g: Grundgroessen) => klemme((g.angst - 0.6) / 0.4, 0, 1);

const basisVon = (k: ModellKontext) => k.basis ?? NORMAL;
const off = (k: ModellKontext, g: keyof Grundgroessen) => k.wirkung?.[g] ?? 0;
const gewicht = (k: ModellKontext, p: Altersprofil) => k.gewichtKg ?? p.gewichtKg;

/* ───────────────────────── Atmung ───────────────────────── */

export interface AtmungDetail {
  fio2: number;
  /** alveolärer pO₂ (mmHg) */
  pAO2: number;
  /** arterieller pO₂ (mmHg, aus der Mischsättigung zurückgerechnet) */
  paO2: number;
  paCO2: number;
  /** Shunt-Anteil 0..1 */
  shunt: number;
  saO2: number;
  spo2: number;
  af: number;
  /** alveoläre Ventilation relativ (1 = normal) */
  va: number;
  /** Atemnotgefühl 0..1 */
  dyspnoe: number;
}

/** Atmung aus den Grundgrößen. Spur B: module.beatmung setzt FiO₂, Ventilation (af·vt) und PEEP. */
export function atmung(g: Grundgroessen, k: ModellKontext): AtmungDetail {
  const p = profil(k.altersgruppe);
  const beatmung = k.module?.beatmung;
  const fio2 = beatmung ? klemme(beatmung.fio2, 0.21, 1) : fio2AusFluss(g.sauerstoff);
  // Erschöpfung: sehr hohe Atemarbeit kann nicht dauerhaft kompensiert werden
  const erschoepfung = g.atemarbeit <= 2 ? 1 : klemme(1 - 0.35 * (g.atemarbeit - 2), 0.3, 1);
  const fieber = Math.max(0, g.temperatur - 37);
  const wach = klemme(g.vigilanz * 1.2, 0, 1);
  const pan = panik(g);
  const va = beatmung
    ? klemme((beatmung.af * beatmung.vt) / (14 * 500), 0.1, 3)
    : klemme(g.atemantrieb * (1 + 0.3 * g.angst * wach + 0.4 * pan * wach + 0.06 * fieber + 0.2 * Math.max(0, 1 - g.gasaustausch)) * erschoepfung
      // Krampfanfall: Atempausen und unkoordinierte Atmung → Hypoventilation, SpO₂ fällt ohne O₂
      * (g.krampf > 0 ? 0.45 : 1), 0.15, 3);
  const paCO2 = klemme(40 / va, 18, 130);
  const pAO2 = Math.max(0, fio2 * 713 - paCO2 / 0.8);
  const verlust = Math.max(0, 1 - g.gasaustausch);
  const pc = Math.max(1, pAO2 - (2 + 80 * verlust));
  let shunt = 0.35 * verlust;
  if (beatmung) shunt *= 1 - Math.min(0.5, Math.max(0, beatmung.peep - 5) * 0.05);
  const perf = kreislaufRoh(g, k).perfusion;
  const sv = klemme(0.75 * perf ** 0.3, 0.3, 0.8);
  const saO2 = (1 - shunt) * saettigung(pc) + shunt * sv;
  const spo2 = klemme(Math.round(saO2 * 100), 40, 100);
  const paO2 = pcAusSaettigung(saO2);
  // Atemfrequenz: Antrieb (Opioid → Bradypnoe), Atemarbeit, Hypoxie, Angst, Fieber, Schock
  const hypox = Math.max(0, 0.95 - saO2);
  const kr0 = kreislaufRoh(g, k);
  const schock = Math.max(0, 1 - perf) + kr0.defizit;
  let af = p.ruheAF * g.atemantrieb ** 1.4 * (1 + 0.45 * (g.atemarbeit - 1)) * (1 + 4 * hypox * Math.min(1, g.atemantrieb) ** 2)
    + p.ruheAF * (0.5 * g.angst * wach + 0.9 * pan * wach + 0.1 * fieber + 0.8 * schock);
  if (g.krampf > 0) af *= 0.5;
  if (beatmung) af = beatmung.af;
  const dyspnoe = klemme(0.5 * (g.atemarbeit - 1) + 3 * hypox + 0.3 * schock, 0, 1);
  return {
    fio2: Math.round(fio2 * 100) / 100, pAO2: Math.round(pAO2), paO2: Math.round(paO2), paCO2: Math.round(paCO2),
    shunt: Math.round(shunt * 100) / 100, saO2, spo2, af: klemme(Math.round(af), 2, p.maxAF), va, dyspnoe,
  };
}

/** Umkehrung der Bindungskurve (Bisektion), für paO₂ */
function pcAusSaettigung(s: number): number {
  let lo = 1, hi = 700;
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    if (saettigung(m) < s) lo = m; else hi = m;
  }
  return (lo + hi) / 2;
}

/* ───────────────────────── Kreislauf ───────────────────────── */

export interface KreislaufDetail {
  hf: number; sys: number; dia: number; map: number;
  /** Herzzeitvolumen l/min (Erwachsenen-Skala des Herzmodells) */
  hzv: number;
  sv: number;
  /** HZV relativ zu Ruhe (1 = normal) */
  perfusion: number;
  rekapSek: number;
  /** Kreislaufstillstand im Modell */
  stillstand: boolean;
  /** Druckdefizit vor Kompensation 0..1 (treibt Barorezeptor-Reflex, Zentralisation, Atemfrequenz) */
  defizit: number;
}

/** Atemnot treibt den Puls (Sympathikus), ohne Rückgriff auf die Atmungsrechnung */
const dyspnoeKreislauf = (g: Grundgroessen) => klemme(0.5 * (g.atemarbeit - 1), 0, 1) * klemme(g.vigilanz * 1.2, 0, 1);

/** Kreislauf ohne Rückkopplung der Sättigung (für die Atmung) */
function kreislaufRoh(g: Grundgroessen, k: ModellKontext, saO2 = 0.97): KreislaufDetail {
  const p = profil(k.altersgruppe);
  // Hochbetagte sind stark vorlastabhängig (steifer Ventrikel): Volumenmangel senkt den Druck deutlicher
  const vorlast = 50 * Math.max(0.05, g.volumen) ** p.vorlastExponent;
  const nachlast = 50 * Math.max(0.1, g.gefaesstonus);
  const kraft = 50 * Math.max(0.05, g.pumpleistung);
  const m0 = herz({ ...HERZ_START, hf: 70, vorlast, nachlast, kraft }).map;
  const defizit = Math.max(0, (REF.map - m0) / REF.map);
  const fieber = Math.max(0, g.temperatur - 37);
  const opioid = hill(1 - g.atemantrieb, 0.5); // gedämpfter Antrieb ≈ Sedierung
  const stress = 0.12 * fieber + (0.25 * g.angst + 0.45 * panik(g)) * klemme(g.vigilanz * 1.2, 0, 1) + 0.015 * g.schmerz + 0.1 * g.unruhe
    + (g.blutzucker < 60 ? 0.2 : 0) + (g.krampf > 0 ? 0.15 : 0);
  const daempfung = 0.15 * opioid - (g.wirkHf ?? 0) + (g.temperatur < 35 ? (35 - g.temperatur) * 0.08 : 0);
  let rel = 1 + p.baroGain * (2.6 * defizit + 6 * defizit * defizit) + stress + 0.35 * dyspnoeKreislauf(g) - daempfung;
  // Antriebe addieren sich nicht linear bis zur Höchstfrequenz: Sinustachykardie sättigt (Fieber, Schmerz und
  // Schock zusammen ergeben bei Erwachsenen eher 130–150/min, über 150 spricht für eine Rhythmusstörung).
  // Bis etwa +40 % linear, darüber flacht der Anstieg zur Höchstfrequenz hin ab.
  const knie = 1.4;
  const reserve = p.maxPuls / p.ruhePuls - knie;
  if (rel > knie) rel = knie + reserve * (1 - Math.exp(-(rel - knie) / reserve));
  // Hypoxie treibt den Puls zusätzlich (bis zur präfinalen Bradykardie unten)
  const hypoxTrieb = 2.5 * Math.max(0, 0.92 - saO2);
  rel += hypoxTrieb;
  // Schwere Hypoxie: präfinale Bradykardie (besonders bei Kindern)
  if (saO2 < 0.6) rel *= klemme((saO2 - 0.35) / 0.25, 0.25, 1);
  const hfRef = klemme(70 * rel, 25, (70 * p.maxPuls) / p.ruhePuls);
  const h = herz({ ...HERZ_START, hf: hfRef, vorlast, nachlast, kraft });
  // Der Reflex hebt den Druck höchstens bis zum Sollwert zurück; Stress (Fieber, Angst, Schmerz) darf ihn darüber heben.
  const nurStress = herz({ ...HERZ_START, hf: klemme(70 * (1 + stress + hypoxTrieb - daempfung), 25, 200), vorlast, nachlast, kraft }).map;
  // Hochbetagte: Der Reflex gleicht nur einen Teil des Defizits aus (orthostatische Hypotonie, steife Gefäße).
  const ausgleich = Math.min(1, p.baroGain);
  const mapGrenze = defizit > 0 ? Math.max(nurStress, m0 + ausgleich * (REF.map - m0)) : Infinity;
  const druckFaktor = h.map > mapGrenze ? mapGrenze / h.map : 1;
  const stillstand = g.pumpleistung < 0.1 || h.map < 20;
  const perfusion = stillstand ? 0 : h.hzv / REF.hzv;
  const sys = stillstand ? 0 : (h.sys * druckFaktor * p.rrSys) / REF.sys;
  // Weitgestellte Gefäße (Sepsis, Vasodilatation): Diastole fällt stärker als die Systole (große Druckamplitude)
  const diaFaktor = 1 - 0.5 * (1 - klemme(g.gefaesstonus, 0.2, 1));
  const dia = stillstand ? 0 : (h.dia * druckFaktor * diaFaktor * p.rrDia) / REF.dia;
  // Zentralisation: Der Barorezeptor-Reflex verengt die Hautgefäße, die Rekapillarisierung wird lang, bevor der Druck fällt
  const rekap = stillstand ? 8 : klemme(2 / Math.max(0.2, perfusion) ** 0.8 + 12 * defizit + 3 * Math.max(0, 0.9 - g.hydratation) + (g.temperatur < 35.5 ? 1 : 0), 1, 8);
  return {
    hf: stillstand ? 0 : Math.round((hfRef * p.ruhePuls) / 70), sys: Math.round(sys), dia: Math.round(dia), map: Math.round((sys + 2 * dia) / 3),
    hzv: Math.round(h.hzv * 10) / 10, sv: h.sv, perfusion, rekapSek: Math.round(rekap * 2) / 2, stillstand, defizit,
  };
}

/** Kreislauf aus den Grundgrößen; saO2 aus atmung() (Hypoxie → Tachykardie, schwer → Bradykardie). */
export function kreislauf(g: Grundgroessen, k: ModellKontext, saO2?: number): KreislaufDetail {
  return kreislaufRoh(g, k, saO2 ?? atmung(g, k).saO2);
}

/* ───────────────────────── Bewusstsein ───────────────────────── */

/** Faktor 0..1, um den Ursachen die Vigilanz senken (ohne Basis und Wirkkurven) */
function vigilanzFaktor(g: Grundgroessen, a: AtmungDetail, kr: KreislaufDetail, opioid: number): number {
  const bz = g.blutzucker < 70 ? klemme((g.blutzucker - 20) / 50, 0.08, 1) ** 0.8 : 1 - 0.4 * klemme((g.blutzucker - 350) / 400, 0, 1);
  const hypox = a.saO2 < 0.85 ? klemme((a.saO2 - 0.5) / 0.35, 0.1, 1) : 1;
  const co2 = 1 - klemme((a.paCO2 - 60) / 60, 0, 0.8);
  const perf = kr.stillstand ? 0.02 : kr.map < 60 ? klemme((kr.map - 25) / 35, 0.1, 1) : 1;
  const temp = g.temperatur > 40.5 ? 0.8 : g.temperatur < 34 ? klemme(1 - (34 - g.temperatur) * 0.15, 0.2, 1) : 1;
  const sed = 1 - 0.7 * hill(opioid, 0.7);
  const krampf = g.krampf > 0 ? 0.1 : g.krampf < 0 ? 1 + 0.6 * g.krampf : 1;
  return bz * hypox * co2 * perf * temp * sed * krampf;
}

export const avpuAus = (vigilanz: number): Anzeige['avpu'] => (vigilanz > 0.8 ? 'A' : vigilanz > 0.55 ? 'V' : vigilanz > 0.3 ? 'P' : 'U');

/** GCS (Erwachsenenskala) aus Vigilanz und Orientierung; bei Kindern unter 2 Jahren nur orientierend. */
export function gcsAus(vigilanz: number, orientierung: number): number {
  const e = vigilanz > 0.8 ? 4 : vigilanz > 0.55 ? 3 : vigilanz > 0.3 ? 2 : 1;
  const v = vigilanz <= 0.2 ? 1 : vigilanz <= 0.35 ? 2 : vigilanz <= 0.55 ? 3 : orientierung > 0.85 && vigilanz > 0.8 ? 5 : orientierung > 0.3 ? 4 : 3;
  const m = vigilanz > 0.55 ? 6 : vigilanz > 0.3 ? 5 : vigilanz > 0.2 ? 4 : vigilanz > 0.1 ? 3 : vigilanz > 0.05 ? 2 : 1;
  return e + v + m;
}

/* ───────────────────────── Modell ───────────────────────── */

function delirLast(g: Grundgroessen, treiber: readonly Treiber[], a: AtmungDetail, opioid: number): number {
  let last = 0;
  for (const tr of treiber) {
    if (tr.art !== 'delir_trigger') continue;
    for (const x of tr.ausloeser) {
      switch (x) {
        case 'exsikkose': last += klemme((0.9 - g.hydratation) / 0.15, 0, 1); break;
        case 'schmerz': last += klemme((g.schmerz - 3) / 4, 0, 1); break;
        case 'infekt': last += hat(treiber, 'sepsis_verlauf') || hat(treiber, 'pneumonie') ? 1 : klemme((g.temperatur - 37.8) / 1.2, 0, 1); break;
        case 'medikamente': last += klemme(opioid / 0.4, 0, 1); break;
        case 'umgebung': last += 0.3 * (0.5 + g.angst); break;
        case 'harnverhalt': last += hat(treiber, 'harnverhalt') ? 1 : 0; break;
      }
    }
  }
  // Hypoxie und Hypoglykämie wirken immer (akute Verwirrtheit), auch ohne delir_trigger
  if (a.saO2 < 0.88) last += 0.5;
  if (g.blutzucker < 60) last += 0.5;
  return Math.min(2.5, last);
}

function naechster(alt: Grundgroessen, treiber: readonly Treiber[], dt: number, k: ModellKontext): Grundgroessen {
  const p = profil(k.altersgruppe);
  const b = basisVon(k);
  const g: Grundgroessen = { ...alt };
  const std = dt / 3600;
  const min = dt / 60;
  const a = atmung(alt, k);
  const kr = kreislauf(alt, k, a.saO2);
  const pe = pharma(treiber, k);
  const opioid = pe.opioid;
  const blutvolumenMl = gewicht(k, p) * p.blutvolumenMlKg;
  const kgFaktor = 75 / gewicht(k, p);

  // ── Bestände durch Treiber
  let fieberZiel = -Infinity;
  for (const tr of treiber) {
    const tm = seitMin(tr, k);
    switch (tr.art) {
      case 'blutung': g.volumen -= (tr.mlProMin * min) / blutvolumenMl; break;
      case 'exsikkose_progressiv': {
        const v = tr.verlustProStunde * std * (1 + 0.3 * Math.max(0, alt.temperatur - 37.5));
        g.hydratation -= v; g.volumen -= 0.8 * v; break;
      }
      case 'hypoglykaemie': g.blutzucker -= tr.abfallProStunde * std; break;
      case 'insulin': {
        const gipfel = tr.gipfelMin ?? ZUCKER_FAUSTWERTE.gipfelInsulinMin;
        g.blutzucker -= tr.ie * ZUCKER_FAUSTWERTE.mgDlJeIeInsulin * kgFaktor * (wirkAnteil(tm, gipfel) - wirkAnteil(tm - min, gipfel));
        break;
      }
      case 'kohlenhydrate': {
        const gipfel = tr.schnell ? ZUCKER_FAUSTWERTE.gipfelSchnellMin : ZUCKER_FAUSTWERTE.gipfelMahlzeitMin;
        g.blutzucker += tr.gramm * ZUCKER_FAUSTWERTE.mgDlJeGrammKh * kgFaktor * (wirkAnteil(tm, gipfel) - wirkAnteil(tm - min, gipfel));
        break;
      }
      case 'sepsis_verlauf':
        g.gefaesstonus = Math.max(0.35, g.gefaesstonus - 0.25 * tr.tempo * std);
        g.volumen -= 0.04 * tr.tempo * std;
        fieberZiel = Math.max(fieberZiel, 37 + 2.2 * Math.min(1.2, tr.tempo) * p.fieberAntwort);
        break;
      case 'pneumonie': fieberZiel = Math.max(fieberZiel, 37 + 1.8 * tr.staerke * p.fieberAntwort); break;
      case 'fieberkrampf_kind': fieberZiel = Math.max(fieberZiel, tr.temperaturSchwelle + 0.4); break;
      case 'panik_eskaliert': g.angst += 0.02 * tr.tempo * min; break;
      case 'harnverhalt':
        g.schmerz = Math.min(7, g.schmerz + 0.05 * min);
        break;
      default: break;
    }
  }

  // ── G1 Wirkstoffe: Bestände mit angewandtem Anteil (kehrt beim Abfluten zurück), Raten
  const mitPharma = Object.keys(pe.spiegel).length > 0;
  if (mitPharma || alt.wirkSchmerz !== undefined) {
    [g.schmerz, g.wirkSchmerz] = anteilAnwenden(g.schmerz, alt.wirkSchmerz ?? 0, -pe.analgesieNrs, 0);
    [g.angst, g.wirkAngst] = anteilAnwenden(g.angst, alt.wirkAngst ?? 0, -pe.anxiolyse * Math.max(0, g.angst - (alt.wirkAngst ?? 0)), 0);
    [g.gefaesstonus, g.wirkTonus] = anteilAnwenden(g.gefaesstonus, alt.wirkTonus ?? 0, pe.tonus, 0.3);
    g.wirkHf = pe.hfRel;
  }
  if (pe.diureseMlH > 0) {
    const ml = pe.diureseMlH * std;
    g.volumen -= ml / (blutvolumenMl * 2.5);            // Diurese zieht aus dem ganzen Extrazellulärraum
    g.hydratation -= ml / (gewicht(k, p) * 200);
    g.kalium = kaliumNachDiurese(alt.kalium, ml);         // Schleifendiuretika: Kaliumverlust
  }
  if (mitPharma || alt.wirkDiurese !== undefined) g.wirkDiurese = pe.diureseMlH;
  // G2 Blase: nur, wenn der Fall eine Füllung vorgibt oder ein Harnverhalt läuft
  const harnverhalt = hat(treiber, 'harnverhalt');
  if (alt.blaseMl !== undefined || harnverhalt) {
    const mlH = kr.stillstand ? 0 : stundenurin(kr.map, alt.volumen, alt.hydratation, gewicht(k, p), pe.diureseMlH);
    g.blaseMl = blaseNaechste(alt.blaseMl ?? 150, mlH, dt, harnverhalt);
  }
  // G3 Haut: Druckbelastung und Dekubitus-Kategorie (nur mit Treiber immobil oder vorgegebener Druckbelastung)
  const hs = hautSchritt(alt, treiber, dt, kr.stillstand ? 0 : kr.map);
  if (hs) Object.assign(g, hs);
  if (pe.bzProStunde) g.blutzucker += pe.bzProStunde * std;

  // Delir: steigt mit Auslösern (Altersprofil), klingt sonst langsam ab
  // Benzodiazepine/anticholinerge Wirkstoffe lösen bei Hochbetagten auch ohne angelegten Auslöser ein Delir aus (S3-LL Delir)
  const last = delirLast(alt, treiber, a, opioid) + pe.delirRisiko * (k.altersgruppe === 'hochbetagt' ? 0.8 : 0.2);
  g.delir += last > 0 ? 0.006 * last * p.delirAnfaellig * min : -0.003 * min;

  // Angst: Atemnot und starker Schmerz steigern, sonst langsames Abklingen
  // Die Angst steigt nur bis zu einer Decke, die zur Stärke der Auslöser passt (sonst schaukelt sie sich über Puls und
  // Unruhe allein hoch); eine Panik entsteht über den Treiber panik_eskaliert.
  const wach = klemme(alt.vigilanz * 1.2, 0, 1);
  const angstTrieb = (0.03 * a.dyspnoe + (alt.schmerz >= 7 ? 0.01 : 0)) * wach;
  const angstDecke = Math.max(b.angst, (0.15 + 0.4 * a.dyspnoe + (alt.schmerz >= 7 ? 0.15 : 0)) * wach);
  if (angstTrieb > 0.002 && alt.angst < angstDecke) g.angst = Math.min(angstDecke, g.angst + angstTrieb * min);
  else if (!hat(treiber, 'panik_eskaliert')) g.angst -= Math.min(0.004 * min, Math.max(0, g.angst - Math.max(b.angst, angstDecke)));

  // Pumpleistung: anhaltende schwere Hypoxie oder Minderperfusion schädigen das Herz
  if (a.saO2 < 0.7) g.pumpleistung -= 0.03 * ((0.7 - a.saO2) / 0.2) * min;
  if (!kr.stillstand && kr.map < 45) g.pumpleistung -= 0.02 * min;

  // Fieberkrampf: ein Anfall je Fall (krampf 1 → 0 in 3 Min., dann postiktal −1 → nähert sich 0, erreicht es nie)
  const fk = treiber.find((t) => t.art === 'fieberkrampf_kind');
  // Antipyretika verhindern Fieberkrämpfe nicht (Cochrane-Review Offringa 2021): Die Schwelle gilt für den Fieberverlauf ohne Senkung.
  if (fk && fk.art === 'fieberkrampf_kind' && alt.krampf === 0 && alt.temperatur + pe.fiebersenkung >= fk.temperaturSchwelle) g.krampf = 1;
  else if (alt.krampf > 0) g.krampf = alt.krampf - dt / 180 <= 0 ? -1 : alt.krampf - dt / 180;
  else if (alt.krampf < 0) g.krampf = Math.min(-0.001, hin(alt.krampf, 0, 600, dt));
  if (alt.krampf > 0 && pe.krampfStopp) g.krampf = -1;   // z. B. Midazolam bukkal beendet den Anfall

  // ── Abgeleitete Größen: Ziel = Basis + Treiber-Effekt + Wirkkurven
  const bs = staerke(treiber, 'bronchospasmus') * (1 - pe.bronchodilatation);
  const pn = staerke(treiber, 'pneumonie');
  const sep = sepsisTempo(treiber);
  const atemarbeitZiel = b.atemarbeit + 2 * bs + 0.6 * pn + off(k, 'atemarbeit');
  const gasZiel = b.gasaustausch - 0.3 * bs - PNEUMONIE_VERLUST * pn - (sep > 0 ? 0.1 * (1 - g.gefaesstonus) : 0) + off(k, 'gasaustausch');
  g.atemarbeit = hin(alt.atemarbeit, atemarbeitZiel, bs > 0 ? 120 : 300, dt);
  g.gasaustausch = hin(alt.gasaustausch, gasZiel, pn > 0 && bs === 0 ? 900 : 180, dt);

  const antriebZiel = b.atemantrieb * (1 - 0.75 * hill(pe.atemdepression, 0.7)) + off(k, 'atemantrieb');
  g.atemantrieb = hin(alt.atemantrieb, antriebZiel, 60, dt);

  const tempZiel = Math.max(b.temperatur, fieberZiel - pe.fiebersenkung) + off(k, 'temperatur');
  g.temperatur = hin(alt.temperatur, tempZiel, 1800, dt);

  const vf = vigilanzFaktor(alt, a, kr, opioid + pe.sedativ);
  g.vigilanz = hin(alt.vigilanz, b.vigilanz * vf + off(k, 'vigilanz'), 60, dt);

  const orientZiel = b.orientierung - 0.9 * Math.max(0, g.delir - b.delir) - 0.8 * Math.max(0, b.vigilanz - g.vigilanz)
    - (g.blutzucker < 60 ? 0.3 : 0) + off(k, 'orientierung');
  g.orientierung = hin(alt.orientierung, orientZiel, 60, dt);

  const unruheZiel = (b.unruhe + 0.8 * Math.max(0, g.delir - b.delir) + 0.5 * Math.max(0, g.angst - b.angst)
    + 0.03 * Math.max(0, g.schmerz - b.schmerz) + (g.blutzucker < 60 ? 0.4 : 0) + (a.saO2 < 0.88 ? 0.4 : 0)
    + (hat(treiber, 'harnverhalt') ? 0.3 : 0)) * klemme(g.vigilanz * 1.2, 0, 1) * (1 - pe.unruheMinus) + off(k, 'unruhe');
  g.unruhe = hin(alt.unruhe, unruheZiel, 60, dt);

  const uebelZiel = (b.uebelkeit + 0.5 * hill(opioid, 0.5) + (g.blutzucker < 60 ? 0.3 : 0)) * (1 - pe.antiemese) + off(k, 'uebelkeit');
  g.uebelkeit = hin(alt.uebelkeit, uebelZiel, 120, dt);

  return begrenzen(g);
}

/** Wertebereiche aller Grundgrößen */
export function begrenzen(g: Grundgroessen): Grundgroessen {
  const r = { ...g };
  for (const x of ['volumen', 'pumpleistung', 'gefaesstonus', 'atemantrieb', 'gasaustausch', 'hydratation'] as const) r[x] = klemme(r[x], 0, 1.5);
  for (const x of ['vigilanz', 'orientierung', 'delir', 'unruhe', 'angst', 'uebelkeit'] as const) r[x] = klemme(r[x], 0, 1);
  r.atemarbeit = klemme(r.atemarbeit, 0.5, 4);
  r.schmerz = klemme(r.schmerz, 0, 10);
  r.blutzucker = klemme(r.blutzucker, 15, 800);
  r.temperatur = klemme(r.temperatur, 30, 42.5);
  r.sauerstoff = klemme(r.sauerstoff, 0, 15);
  r.krampf = klemme(r.krampf, -1, 1);
  return r;
}

function rhythmusAus(g: Grundgroessen, p: Altersprofil, kr: KreislaufDetail, k: ModellKontext): Rhythmus {
  if (k.module?.rhythmus) return k.module.rhythmus;
  // Grob: Pumpversagen → Asystolie, sonst (z. B. Volumenmangel, Hypoxie) pulslose elektrische Aktivität
  if (kr.stillstand) return g.pumpleistung < 0.1 ? 'asystolie' : 'pea';
  const hf = kr.hf;
  return hf > p.pulsNormal[1] ? 'sinustachykardie' : hf < p.pulsNormal[0] ? 'sinusbradykardie' : 'sinus';
}

function anzeige(g: Grundgroessen, k: ModellKontext): Anzeige {
  const p = profil(k.altersgruppe);
  const a = atmung(g, k);
  const kr = kreislauf(g, k, a.saO2);
  const still = kr.stillstand;
  return {
    hf: kr.hf, rrSys: kr.sys, rrDia: kr.dia, map: kr.map, rekapSek: kr.rekapSek,
    af: still ? 0 : a.af, spo2: still ? 0 : a.spo2,
    temp: Math.round(g.temperatur * 10) / 10, bz: Math.round(g.blutzucker),
    rhythmus: rhythmusAus(g, p, kr, k),
    avpu: avpuAus(g.vigilanz), gcs: gcsAus(g.vigilanz, g.orientierung),
    ...ausscheidung(g, k, p, kr),
  };
}

/** G2: Stundenurin, Urinfarbe, Blasenfüllung und Kalium für Befundtexte ({urinMlH}, {urinFarbe}, {blaseMl}, {kalium}). */
function ausscheidung(g: Grundgroessen, k: ModellKontext, p: Altersprofil, kr: KreislaufDetail): Partial<Anzeige> {
  const kg = gewicht(k, p);
  const mlH = kr.stillstand ? 0 : stundenurin(kr.map, g.volumen, g.hydratation, kg, g.wirkDiurese ?? 0);
  const a: Partial<Anzeige> = { urinMlH: Math.round(mlH), urinFarbe: urinFarbe(g.hydratation, mlH, kg) };
  if (g.blaseMl !== undefined) a.blaseMl = Math.round(g.blaseMl);
  if (g.kalium !== undefined) a.kalium = Math.round(g.kalium * 10) / 10;
  if (g.dekubitusKat !== undefined) a.dekubitusKat = g.dekubitusKat;
  return a;
}

/** Das gekoppelte Pflege-Physiologiemodell (Standard im Kern). */
export const PFLEGE_MODELL: PhysiologieModell = { naechster, anzeige };

/* ───────────────────────── Befinden & Beobachtung ───────────────────────── */

export type Atemgeraeusch = 'atem-vesikulaer' | 'atem-giemen' | 'atem-rg' | 'atem-stridor' | 'abgeschwaecht' | 'schnarchend';
export type Haut = 'rosig' | 'blass' | 'blass-kaltschweissig' | 'zyanotisch' | 'gerötet-heiss' | 'trocken';

export interface Befinden {
  nrs: number;
  angst: 'keine' | 'leicht' | 'deutlich' | 'panisch';
  /** Orientierung je Qualität (verloren in dieser Reihenfolge) */
  orientiert: { zeitlich: boolean; oertlich: boolean; situativ: boolean; person: boolean };
  /** Nu-DESC-ähnlicher Wert 0..10 (≥ 2 = Delir wahrscheinlich) */
  delirWert: number;
  /** neu verwirrt gegenüber der Ausgangslage (NEWS2: „C“) */
  neuVerwirrt: boolean;
  unruhe: 'ruhig' | 'nestelnd' | 'unruhig' | 'agitiert';
  uebelkeit: boolean;
  /** Atemnot 0..10 */
  atemnot: number;
  /** Ton-ID aus src/ui/audio/klaenge.ts, wo vorhanden */
  atemgeraeusch: Atemgeraeusch;
  haut: Haut;
  schwindelBeimAufstehen: boolean;
  krampfanfall: boolean;
}

/** Was Pflegende sehen, hören und erfragen können (für Befunde, SBAR und Bildzustand). */
export function befinden(g: Grundgroessen, treiber: readonly Treiber[], k: ModellKontext): Befinden {
  const b = basisVon(k);
  const a = atmung(g, k);
  const kr = kreislauf(g, k, a.saO2);
  const bs = staerke(treiber, 'bronchospasmus');
  const pn = staerke(treiber, 'pneumonie');
  const atemgeraeusch: Atemgeraeusch =
    bs >= 0.8 && g.atemarbeit > 2.5 ? 'abgeschwaecht'          // „stille Lunge“
      : bs > 0.1 ? 'atem-giemen'
        : pn > 0.1 ? 'atem-rg'
          : g.vigilanz < 0.4 ? 'schnarchend'
            : 'atem-vesikulaer';
  const haut: Haut =
    a.saO2 < 0.85 ? 'zyanotisch'
      : kr.perfusion < 0.7 || (kr.map < 65 && g.gefaesstonus > 0.7) || g.blutzucker < 60 ? 'blass-kaltschweissig'
        : g.temperatur >= 38.5 && g.gefaesstonus <= 1 ? 'gerötet-heiss'
          : g.hydratation < 0.85 ? 'trocken'
            : kr.perfusion < 0.85 ? 'blass' : 'rosig';
  const o = g.orientierung;
  const delirWert = Math.round(klemme(g.delir * 8 + g.unruhe * 2, 0, 10));
  return {
    nrs: Math.round(g.schmerz),
    angst: g.angst < 0.15 ? 'keine' : g.angst < 0.45 ? 'leicht' : g.angst < 0.8 ? 'deutlich' : 'panisch',
    orientiert: { zeitlich: o > 0.85, oertlich: o > 0.65, situativ: o > 0.45, person: o > 0.2 },
    delirWert,
    neuVerwirrt: b.orientierung - o > 0.25 || g.delir - b.delir > 0.25,
    unruhe: g.unruhe < 0.15 ? 'ruhig' : g.unruhe < 0.4 ? 'nestelnd' : g.unruhe < 0.7 ? 'unruhig' : 'agitiert',
    uebelkeit: g.uebelkeit >= 0.4,
    atemnot: Math.round(a.dyspnoe * 10),
    atemgeraeusch,
    haut,
    schwindelBeimAufstehen: g.volumen < 0.88 || g.hydratation < 0.85 || kr.sys < 100,
    krampfanfall: g.krampf > 0,
  };
}

/** Für die Altersgruppe gültige Ruhewerte (Monitor beim Start eines gesunden Menschen). */
export function ruheAnzeige(altersgruppe: Altersgruppe): Anzeige {
  return anzeige(NORMAL, { altersgruppe });
}
