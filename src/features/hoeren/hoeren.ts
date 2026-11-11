// Hör-Trainer: Logik ohne Ton (getestet). Klänge kommen aus src/ui/audio/klaenge.ts.

import { KLAENGE, type Gruppe, type Klang } from '../../ui/audio/klaenge';

/** Gruppen, die im Hör-Trainer vorkommen (Rückmeldetöne und Raumklang nicht). */
export const HOER_GRUPPEN: Gruppe[] = ['herz', 'lunge', 'darm', 'alarm', 'geraet'];

export const hoerKlaenge = (g?: Gruppe): Klang[] =>
  KLAENGE.filter((k) => (g ? k.gruppe === g : HOER_GRUPPEN.includes(k.gruppe)) && k.id !== 'nibp' && k.id !== 'defi');

export interface HoerFrage { klang: string; optionen: string[]; richtig: number }

function mische<T>(liste: T[], zufall: () => number): T[] {
  const a = [...liste];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(zufall() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!]; }
  return a;
}

/**
 * Eine Runde „Was hörst du?“. Ablenker kommen bevorzugt aus derselben Gruppe
 * (Herzton gegen Herzton), damit man die Merkmale vergleicht und nicht nur die Gruppe rät.
 */
export function hoerRunde(anzahl = 8, gruppe?: Gruppe, zufall: () => number = Math.random): HoerFrage[] {
  const pool = hoerKlaenge(gruppe);
  const auswahl = mische(pool, zufall).slice(0, Math.min(anzahl, pool.length));
  return auswahl.map((k) => {
    const gleich = mische(KLAENGE.filter((x) => x.gruppe === k.gruppe && x.id !== k.id && hoerKlaenge().includes(x)), zufall);
    const andere = mische(hoerKlaenge().filter((x) => x.gruppe !== k.gruppe), zufall);
    const ablenker = [...gleich, ...andere].slice(0, 3).map((x) => x.id);
    const optionen = mische([k.id, ...ablenker], zufall);
    return { klang: k.id, optionen, richtig: optionen.indexOf(k.id) };
  });
}

// ---------- Blutdruck nach Gehör (Korotkow-Geräusche) ----------

export interface BlutdruckFall { sys: number; dia: number; puls: number; start: number }
/** Ablassgeschwindigkeit wie empfohlen: 2–3 mmHg pro Sekunde */
export const ABLASS_MMHG_PRO_S = 3;

export function neuerBlutdruckFall(zufall: () => number = Math.random): BlutdruckFall {
  const sys = 95 + Math.round(zufall() * 16) * 5;           // 95–175
  const dia = Math.max(50, Math.min(sys - 30, 55 + Math.round(zufall() * 9) * 5)); // 55–100, Abstand ≥ 30
  const puls = 56 + Math.round(zufall() * 40);
  return { sys, dia, puls, start: sys + 30 };
}

/** Manschettendruck nach t Sekunden Ablassen */
export const druckNach = (f: BlutdruckFall, t: number) => Math.max(0, f.start - ABLASS_MMHG_PRO_S * t);

/**
 * Lautstärke des Korotkow-Geräuschs bei Manschettendruck p (0 = still).
 * Phase I klares Klopfen, II leiser mit Rauschen, III laut und hart, IV gedämpft, V Stille (= diastolisch).
 */
export function korotkow(p: number, f: Pick<BlutdruckFall, 'sys' | 'dia'>): { pegel: number; phase: 0 | 1 | 2 | 3 | 4 } {
  if (p > f.sys || p <= f.dia) return { pegel: 0, phase: 0 };
  const x = (f.sys - p) / (f.sys - f.dia);
  if (x < 0.12) return { pegel: 0.65, phase: 1 };
  if (x < 0.35) return { pegel: 0.45, phase: 2 };
  if (x < 0.8) return { pegel: 1, phase: 3 };
  return { pegel: 0.4, phase: 4 };
}

export type Genauigkeit = 'genau' | 'knapp' | 'daneben';
export function genauigkeit(abweichung: number): Genauigkeit {
  const a = Math.abs(abweichung);
  return a <= 4 ? 'genau' : a <= 8 ? 'knapp' : 'daneben';
}

/** Gemessene Werte werden wie am Manometer auf gerade Zahlen gerundet. */
export const ablesen = (p: number) => Math.round(p / 2) * 2;

// ---------- Stand ----------

export const HOER_KEY = 'lernstoff.hoeren.stand';
export interface HoerStand { quiz?: { datum: string; prozent: number }; blutdruck?: { datum: string; genau: number; versuche: number } }

/** Textalternative ohne Lösung: Namen der Antwortmöglichkeiten werden verdeckt. */
export function ohneNamen(text: string, namen: string[]): string {
  let out = text;
  for (const n of namen.filter((x) => x.length >= 4).sort((a, b) => b.length - a.length)) {
    out = out.replace(new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '[…]');
  }
  return out;
}
