// Grundsystem G1: Wirkstoffe (Pharmakokinetik und -dynamik) für das Pflege-Physiologiemodell. Rein, deterministisch.
// LERNMODELL: didaktisch gerundete Werte aus Fachinformationen und Leitlinien, ersetzt keine Fachinformation.
// Doppelgabe, Abstand und Höchstmenge prüft die Akte (kern/akte.ts); hier entsteht nur die Wirkung im Körper.
//
// Kinetik: Ein-Kompartiment mit Anfluten erster Ordnung (Bateman-Funktion), je Weg auf Gipfel 1 normiert.
//   Spiegel L = Dosis / (Standarddosis · Gewicht/75 kg) · Wegfaktor · Bateman(t) · Altersempfindlichkeit.
//   L = 1 heißt: Gipfel nach einer üblichen Erwachsenendosis. Hochbetagte: Halbwertszeit × 1,5,
//   zentral dämpfende Wirkstoffe (Opioide, Benzodiazepine) wirken × 1,3 stärker.
// Dynamik: Kanäle (Opioid, Sedierung, Analgesie, Fiebersenkung, Anxiolyse, Bronchodilatation, Diurese …) addieren sich;
//   Opioid + Benzodiazepin wirken überadditiv auf den Atemantrieb (Wechselwirkung). Antagonisten heben auf, wirken aber
//   kürzer (Renarkotisierung, Resedierung).

import type { ModellKontext } from '../modell';
import type { AktiverTreiber, Altersgruppe, ArzneiWeg, Quelle, Treiber } from '../typen';

export type Weg = ArzneiWeg;

/** Wirkkanäle je Spiegel 1 (übliche Erwachsenendosis am Gipfel) */
export interface Wirkprofil {
  /** Opioid-Äquivalent für Atemantrieb/Vigilanz (1 = deutlicher Überhang) */
  opioid?: number;
  /** Sedierung (Benzodiazepine, Neuroleptika) 0..1 */
  sedativ?: number;
  /** Schmerzlinderung in NRS-Punkten */
  analgesieNrs?: number;
  /** Fiebersenkung in °C (wirkt nur, wenn Fieber da ist) */
  fiebersenkung?: number;
  /** Angstlösung (zieht Angst um diesen Anteil ab) */
  anxiolyse?: number;
  /** Beruhigung: Unruhe sinkt um diesen Anteil */
  unruheMinus?: number;
  /** Übelkeit sinkt um diesen Anteil */
  antiemese?: number;
  /** hebt einen Bronchospasmus um diesen Anteil auf */
  bronchodilatation?: number;
  /** Pulsanstieg relativ (0,15 = +15 %) */
  hfRel?: number;
  /** Gefäßtonus-Änderung (−0,1 = Vasodilatation, Blutdruckabfall) */
  tonus?: number;
  /** zusätzliche Urinmenge ml/h */
  diureseMlH?: number;
  /** Blutzuckeranstieg mg/dl je Stunde */
  bzProStunde?: number;
  /** beendet einen laufenden Krampfanfall ab diesem Spiegel */
  krampfStoppAb?: number;
  /** hebt eine Wirkstoffklasse auf (0..1 am Gipfel) */
  antagonist?: 'opioid' | 'sedativ';
  /** zählt als Delir-Auslöser „medikamente“ (anticholinerg, Benzodiazepin im Alter) */
  delirRisiko?: boolean;
}

export interface Wirkstoff {
  id: string;
  name: string;
  klasse: string;
  /** übliche Einzeldosis Erwachsene in mg (Spiegel 1) */
  standardMg: number;
  /** erlaubte Wege mit relativer Wirkstärke gegenüber dem Standardweg (1) */
  wege: Partial<Record<Weg, number>>;
  /** Wirk-Halbwertszeit in Minuten (Erwachsene) */
  hwzMin: number;
  /** Anflut-Halbwertszeit je Weg in Minuten (Standard aus ANFLUTEN) */
  anflutMin?: Partial<Record<Weg, number>>;
  zentral?: boolean;
  wirkung: Wirkprofil;
  /** Pflegerisch beobachten (für Befunde, Leitfaden) */
  beobachten: string[];
  quelle: Quelle;
}

/** Übliche Anflut-Halbwertszeit (Minuten) je Weg */
export const ANFLUTEN: Record<Weg, number> = { iv: 1, im: 6, sc: 8, sublingual: 6, bukkal: 5, inhalativ: 2, oral: 25, rektal: 20 };

const fi = (wirkstoff: string, fundstelle = 'Abschnitte 4.2, 4.8, 5.2'): Quelle => ({
  id: `fi-${wirkstoff.toLowerCase()}`, titel: `Fachinformation ${wirkstoff} (Rote Liste / Fachinfo-Service)`, fundstelle,
});

const LISTE: Wirkstoff[] = [
  { id: 'morphin', name: 'Morphin', klasse: 'Opioid', standardMg: 10, wege: { sc: 1, iv: 1, oral: 0.33 }, hwzMin: 180, zentral: true,
    wirkung: { opioid: 0.3, analgesieNrs: 4, tonus: -0.04 },
    beobachten: ['Atemfrequenz und Vigilanz (Atemdepression)', 'Schmerz nach 30 min neu einschätzen', 'Übelkeit, Obstipation, Harnverhalt'],
    quelle: fi('Morphin') },
  { id: 'piritramid', name: 'Piritramid', klasse: 'Opioid', standardMg: 7.5, wege: { iv: 1, sc: 0.8 }, hwzMin: 240, zentral: true,
    wirkung: { opioid: 0.3, analgesieNrs: 4 },
    beobachten: ['Atemfrequenz, SpO₂ und Vigilanz im Aufwachraum', 'Schmerz nach 15 min neu einschätzen'], quelle: fi('Piritramid') },
  { id: 'lorazepam', name: 'Lorazepam', klasse: 'Benzodiazepin', standardMg: 1, wege: { oral: 1, sublingual: 1, iv: 1 }, hwzMin: 720, zentral: true,
    wirkung: { sedativ: 0.35, anxiolyse: 0.55, unruheMinus: 0.3, delirRisiko: true },
    beobachten: ['Vigilanz und Atmung, besonders zusammen mit Opioiden', 'Sturzgefahr (Muskelentspannung, Schläfrigkeit)', 'bei Hochbetagten paradoxe Unruhe, Delir'],
    quelle: fi('Lorazepam') },
  { id: 'midazolam', name: 'Midazolam', klasse: 'Benzodiazepin', standardMg: 5, wege: { bukkal: 1, iv: 1, im: 1 }, hwzMin: 120, zentral: true,
    wirkung: { sedativ: 0.7, anxiolyse: 0.5, krampfStoppAb: 0.35 },
    beobachten: ['Krampfdauer und -ende dokumentieren', 'Atmung und SpO₂ nach Gabe', 'Seitenlage, nicht allein lassen'],
    quelle: fi('Midazolam (bukkal)', 'Abschnitte 4.2, 4.4, 4.8; DGN/GNP S2k Status epilepticus') },
  { id: 'flumazenil', name: 'Flumazenil', klasse: 'Benzodiazepin-Antagonist', standardMg: 0.5, wege: { iv: 1 }, hwzMin: 50,
    wirkung: { antagonist: 'sedativ' },
    beobachten: ['Resedierung nach etwa 1 h möglich: weiter überwachen'], quelle: fi('Flumazenil') },
  { id: 'naloxon', name: 'Naloxon', klasse: 'Opioid-Antagonist', standardMg: 0.4, wege: { iv: 1, im: 0.9, sc: 0.8 }, hwzMin: 60,
    wirkung: { antagonist: 'opioid' },
    beobachten: ['Renarkotisierung: wirkt kürzer als viele Opioide', 'Schmerz und Entzugszeichen nach Gabe'], quelle: fi('Naloxon') },
  { id: 'haloperidol', name: 'Haloperidol', klasse: 'Neuroleptikum', standardMg: 1, wege: { oral: 1, iv: 1, im: 1 }, hwzMin: 1200, zentral: true,
    wirkung: { sedativ: 0.15, unruheMinus: 0.5 },
    beobachten: ['Ursachen des Delirs bleiben: Haloperidol lindert nur Symptome', 'Bewegungsstörungen, QT-Zeit (EKG)', 'Sturzgefahr'],
    quelle: fi('Haloperidol', 'Abschnitte 4.2, 4.4, 4.8; S3-LL Delir (DGAI/DIVI)') },
  { id: 'paracetamol', name: 'Paracetamol', klasse: 'Nicht-Opioid-Analgetikum', standardMg: 1000, wege: { oral: 1, iv: 1, rektal: 0.7 }, hwzMin: 150,
    wirkung: { analgesieNrs: 2, fiebersenkung: 1 },
    beobachten: ['Tageshöchstdosis (Leber), bei Kindern nach kg', 'Temperatur nach 1 h kontrollieren'], quelle: fi('Paracetamol') },
  { id: 'metamizol', name: 'Metamizol', klasse: 'Nicht-Opioid-Analgetikum', standardMg: 1000, wege: { oral: 1, iv: 1 }, hwzMin: 180,
    wirkung: { analgesieNrs: 3, fiebersenkung: 1.2, tonus: -0.15 },
    beobachten: ['i. v. langsam: Blutdruckabfall möglich', 'Agranulozytose: bei Fieber/Halsschmerz unter Therapie melden'], quelle: fi('Metamizol') },
  { id: 'ibuprofen', name: 'Ibuprofen', klasse: 'NSAR', standardMg: 400, wege: { oral: 1, rektal: 0.8 }, hwzMin: 150,
    wirkung: { analgesieNrs: 2.5, fiebersenkung: 1 },
    beobachten: ['Magenbeschwerden, Nierenfunktion bei Exsikkose', 'bei Kindern nach kg dosieren'], quelle: fi('Ibuprofen') },
  { id: 'salbutamol', name: 'Salbutamol', klasse: 'Beta-2-Sympathomimetikum', standardMg: 0.2, wege: { inhalativ: 1 }, hwzMin: 240,
    wirkung: { bronchodilatation: 0.75, hfRel: 0.15, unruheMinus: -0.1 },
    beobachten: ['Atemfrequenz, Atemgeräusch, SpO₂ nach 10 min', 'Puls (Tachykardie), Zittern'],
    quelle: fi('Salbutamol', 'Abschnitte 4.2, 4.8; NVL Asthma, 5. Auflage') },
  { id: 'prednisolon', name: 'Prednisolon', klasse: 'Glukokortikoid', standardMg: 50, wege: { oral: 1, iv: 1, rektal: 0.8 }, hwzMin: 720,
    anflutMin: { oral: 120, iv: 90, rektal: 120 },
    wirkung: { bronchodilatation: 0.4, bzProStunde: 12 },
    beobachten: ['Wirkt erst nach Stunden', 'Blutzucker (Steroid-Hyperglykämie)'], quelle: fi('Prednisolon', 'Abschnitte 4.2, 4.8; NVL Asthma') },
  { id: 'furosemid', name: 'Furosemid', klasse: 'Schleifendiuretikum', standardMg: 40, wege: { iv: 1, oral: 0.5 }, hwzMin: 60,
    wirkung: { diureseMlH: 700 },
    beobachten: ['Ausfuhr und Gewicht (Bilanz)', 'Kalium, Blutdruck, Schwindel beim Aufstehen', 'Toilettengang ermöglichen (Sturzgefahr)'],
    quelle: fi('Furosemid') },
  { id: 'torasemid', name: 'Torasemid', klasse: 'Schleifendiuretikum', standardMg: 10, wege: { oral: 1 }, hwzMin: 240,
    wirkung: { diureseMlH: 200 },
    beobachten: ['Trinkmenge und Ausfuhr', 'Blutdruck, Exsikkosezeichen bei Hochbetagten'], quelle: fi('Torasemid') },
  { id: 'ondansetron', name: 'Ondansetron', klasse: 'Antiemetikum', standardMg: 4, wege: { iv: 1, oral: 1 }, hwzMin: 240,
    wirkung: { antiemese: 0.6 }, beobachten: ['Übelkeit nach 30 min neu einschätzen', 'Obstipation'], quelle: fi('Ondansetron') },
  { id: 'metoclopramid', name: 'Metoclopramid', klasse: 'Antiemetikum', standardMg: 10, wege: { iv: 1, oral: 1 }, hwzMin: 300,
    wirkung: { antiemese: 0.5, unruheMinus: -0.1 }, beobachten: ['Bewegungsstörungen (besonders bei Jüngeren)'], quelle: fi('Metoclopramid') },
];

export const WIRKSTOFFE: Readonly<Record<string, Wirkstoff>> = Object.fromEntries(LISTE.map((w) => [w.id, w]));

/** Bateman-Kurve, auf Gipfel 1 normiert. t, Halbwertszeiten in Minuten. */
export function bateman(tMin: number, anflutMin: number, hwzMin: number): number {
  if (tMin <= 0) return 0;
  const ke = Math.LN2 / hwzMin;
  const ka = Math.LN2 / Math.max(0.2, anflutMin);
  if (Math.abs(ka - ke) < 1e-9) return Math.min(1, (tMin * ke * Math.E) * Math.exp(-ke * tMin));
  const f = (t: number) => Math.exp(-ke * t) - Math.exp(-ka * t);
  const tmax = Math.log(ka / ke) / (ka - ke);
  return Math.max(0, f(tMin) / f(tmax));
}

const HOCHBETAGT_HWZ = 1.5;
const HOCHBETAGT_ZENTRAL = 1.3;

/** Standardweg eines Wirkstoffs (erster Eintrag) */
export const standardWeg = (w: Wirkstoff): Weg => Object.keys(w.wege)[0] as Weg;

/** Spiegel (1 = Gipfel nach üblicher Erwachsenendosis) eines Wirkstoff-Treibers zur Zeit k.t */
export function spiegel(tr: Extract<Treiber, { art: 'wirkstoff' }>, k: ModellKontext, gruppe: Altersgruppe = k.altersgruppe, gewichtKg = 75): number {
  const w = WIRKSTOFFE[tr.id];
  if (!w) return 0;
  const weg = tr.weg ?? standardWeg(w);
  const wegFaktor = w.wege[weg] ?? 0;
  const alt = gruppe === 'hochbetagt';
  const hwz = w.hwzMin * (alt ? HOCHBETAGT_HWZ : 1);
  const anflut = w.anflutMin?.[weg] ?? ANFLUTEN[weg];
  const tMin = ((k.t ?? 0) - ((tr as AktiverTreiber).seit ?? 0)) / 60;
  const dosisRel = tr.dosisMg / (w.standardMg * (gewichtKg / 75));
  return dosisRel * wegFaktor * bateman(tMin, anflut, hwz) * (alt && w.zentral ? HOCHBETAGT_ZENTRAL : 1);
}

/** Emax-Kurve (Hill 1,5, EC50 0,4): 1 bei Spiegel 1, sättigt darüber, klingt bei kleinen Spiegeln deutlich ab */
const emax = (l: number) => (l <= 0 ? 0 : ((l ** 1.5) / (l ** 1.5 + 0.4 ** 1.5)) * (1 + 0.4 ** 1.5));

export interface PharmaEffekte {
  /** wirksames Opioid-Äquivalent (nach Antagonist) */
  opioid: number;
  /** wirksame Sedierung (nach Antagonist) */
  sedativ: number;
  /** Atemdepression aus Opioid + Sedierung inkl. Wechselwirkung */
  atemdepression: number;
  analgesieNrs: number;
  fiebersenkung: number;
  anxiolyse: number;
  unruheMinus: number;
  antiemese: number;
  bronchodilatation: number;
  hfRel: number;
  tonus: number;
  diureseMlH: number;
  bzProStunde: number;
  krampfStopp: boolean;
  delirRisiko: number;
  /** Spiegel je laufendem Wirkstoff (für Anzeige, Akte, Leitfaden) */
  spiegel: Record<string, number>;
}

export const KEINE_EFFEKTE: PharmaEffekte = {
  opioid: 0, sedativ: 0, atemdepression: 0, analgesieNrs: 0, fiebersenkung: 0, anxiolyse: 0, unruheMinus: 0, antiemese: 0,
  bronchodilatation: 0, hfRel: 0, tonus: 0, diureseMlH: 0, bzProStunde: 0, krampfStopp: false, delirRisiko: 0, spiegel: {},
};

/**
 * Summe aller Wirkstoff-Treiber. `opioidExtra`: Spiegel aus dem älteren Treiber opioid_ueberhang (wird mit verrechnet),
 * `opioidBlockExtra`: Block aus dem älteren Treiber naloxon.
 */
export function pharmaEffekte(treiber: readonly Treiber[], k: ModellKontext, gewichtKg = 75, opioidExtra = 0, opioidBlockExtra = 0): PharmaEffekte {
  const e: PharmaEffekte = { ...KEINE_EFFEKTE, spiegel: {} };
  let opioid = opioidExtra;
  let sedativ = 0;
  let blockOpioid = opioidBlockExtra;
  let blockSedativ = 0;
  for (const tr of treiber) {
    if (tr.art !== 'wirkstoff') continue;
    const w = WIRKSTOFFE[tr.id];
    if (!w) continue;
    const l = spiegel(tr, k, k.altersgruppe, gewichtKg);
    if (l <= 0) continue;
    e.spiegel[w.id] = (e.spiegel[w.id] ?? 0) + l;
    const p = w.wirkung;
    const el = emax(l);
    opioid += (p.opioid ?? 0) * l;
    sedativ += (p.sedativ ?? 0) * l;
    e.analgesieNrs += (p.analgesieNrs ?? 0) * el;
    e.fiebersenkung += (p.fiebersenkung ?? 0) * el;
    e.anxiolyse += (p.anxiolyse ?? 0) * el;
    e.unruheMinus += (p.unruheMinus ?? 0) * el;
    e.antiemese += (p.antiemese ?? 0) * el;
    e.bronchodilatation = 1 - (1 - e.bronchodilatation) * (1 - Math.min(0.95, (p.bronchodilatation ?? 0) * el));
    e.hfRel += (p.hfRel ?? 0) * el;
    e.tonus += (p.tonus ?? 0) * l;
    e.diureseMlH += (p.diureseMlH ?? 0) * l;
    e.bzProStunde += (p.bzProStunde ?? 0) * l;
    if (p.krampfStoppAb !== undefined && l >= p.krampfStoppAb) e.krampfStopp = true;
    if (p.delirRisiko) e.delirRisiko += Math.min(1, l);
    if (p.antagonist === 'opioid') blockOpioid = Math.max(blockOpioid, 0.95 * Math.min(1, l));
    if (p.antagonist === 'sedativ') blockSedativ = Math.max(blockSedativ, 0.95 * Math.min(1, l));
  }
  e.opioid = opioid * (1 - blockOpioid);
  e.sedativ = sedativ * (1 - blockSedativ);
  // Wechselwirkung: Benzodiazepin allein dämpft den Atemantrieb wenig, zusammen mit Opioid deutlich mehr
  e.atemdepression = e.opioid + 0.3 * e.sedativ + 0.8 * e.opioid * e.sedativ;
  e.analgesieNrs = Math.min(8, e.analgesieNrs);
  e.anxiolyse = Math.min(0.9, e.anxiolyse);
  e.unruheMinus = Math.min(0.9, e.unruheMinus);
  e.antiemese = Math.min(0.9, e.antiemese);
  e.fiebersenkung = Math.min(2, e.fiebersenkung);
  return e;
}
