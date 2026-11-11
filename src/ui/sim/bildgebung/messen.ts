// Messwerkzeuge des Bildbetrachters: Strecke (mm) und Kreis-ROI (Mittelwert in HU bzw. Prozent).
// Reine Rechenfunktionen, damit Tests und Oberfläche dieselben Werte sehen.

import { vonRoh, type Modalitaet, type Rohbild } from './phantom';

/** Punkte normiert 0..1 (x nach rechts, y nach unten). */
export type Messung =
  | { id: string; art: 'strecke'; schicht: number; a: { x: number; y: number }; b: { x: number; y: number } }
  | { id: string; art: 'roi'; schicht: number; x: number; y: number; r: number };

/** Länge einer Strecke in Pixeln des Originalbildes. */
export function streckePx(bild: { breite: number; hoehe: number }, a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot((b.x - a.x) * bild.breite, (b.y - a.y) * bild.hoehe);
}

/** Länge in mm, wenn der Pixelabstand bekannt ist, sonst undefined. */
export function streckeMm(bild: { breite: number; hoehe: number }, a: { x: number; y: number }, b: { x: number; y: number }, mmProPixel?: number): number | undefined {
  return mmProPixel ? streckePx(bild, a, b) * mmProPixel : undefined;
}

export interface RoiWerte { mittel: number; sd: number; min: number; max: number; pixel: number; flaecheMm2?: number }

/** Statistik in einem Kreis (r als Anteil der Bildbreite) in HU (CT) bzw. Prozent Helligkeit (Röntgen). */
export function roiStatistik(bild: Rohbild, m: Modalitaet, x: number, y: number, r: number, mmProPixel?: number): RoiWerte {
  const N = bild.breite, M = bild.hoehe, rp = r * N;
  const cx = x * N, cy = y * M;
  let n = 0, s = 0, q = 0, min = Infinity, max = -Infinity;
  for (let yy = Math.max(0, Math.floor(cy - rp)); yy < Math.min(M, Math.ceil(cy + rp)); yy++) {
    for (let xx = Math.max(0, Math.floor(cx - rp)); xx < Math.min(N, Math.ceil(cx + rp)); xx++) {
      if (Math.hypot(xx + 0.5 - cx, yy + 0.5 - cy) > rp) continue;
      const v = vonRoh(m, bild.werte[yy * N + xx]!);
      n++; s += v; q += v * v;
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  if (!n) return { mittel: 0, sd: 0, min: 0, max: 0, pixel: 0 };
  const mittel = s / n;
  return { mittel, sd: Math.sqrt(Math.max(0, q / n - mittel * mittel)), min, max, pixel: n, flaecheMm2: mmProPixel ? n * mmProPixel * mmProPixel : undefined };
}

/** Herz-Thorax-Quotient aus zwei waagrechten Strecken: kürzere = Herz, längere = Thorax innen. */
export function herzThoraxQuotient(strecken: { a: { x: number }; b: { x: number } }[]): number | undefined {
  if (strecken.length < 2) return undefined;
  const breiten = strecken.slice(-2).map((s) => Math.abs(s.b.x - s.a.x)).sort((p, q) => p - q);
  return breiten[1]! > 0 ? breiten[0]! / breiten[1]! : undefined;
}

/** Was ein HU-Mittelwert grob bedeutet (Lernhilfe). */
export function huDeutung(hu: number): string {
  if (hu < -900) return 'Luft';
  if (hu < -500) return 'belüftete Lunge';
  if (hu < -150) return 'Lunge mit Verdichtung oder Teilvolumen';
  if (hu < -30) return 'Fett';
  if (hu < 20) return 'Wasser, Flüssigkeit (z. B. Erguss)';
  if (hu < 100) return 'Weichteil, Blut, Organ';
  if (hu < 300) return 'Gefäß mit Kontrastmittel oder Verkalkung';
  return 'Knochen oder dichter Kontrast';
}
