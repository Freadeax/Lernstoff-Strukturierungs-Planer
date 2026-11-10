// Rechenteil des animierten Patientenmonitors: Kurvenformen und Alarmstufen.
// Rein und ohne DOM, damit Praxis- und Fallsimulator dieselben Regeln teilen und sie testbar bleiben.

/** Werte für den Monitor. null/undefined = nicht gemessen, dann zeigt der Monitor "--". */
export interface MonitorWerte {
  puls?: number | null;
  af?: number | null;
  spo2?: number | null;
  sys?: number | null;
  dia?: number | null;
  temp?: number | null;
  /** ACVPU-Buchstabe */
  avpu?: string | null;
  sauerstoff?: boolean | null;
}

export type Alarm = 'ok' | 'gelb' | 'rot';
export type MonitorParameter = 'puls' | 'af' | 'spo2' | 'sys' | 'temp';

const da = (n: number | null | undefined): n is number => typeof n === 'number' && Number.isFinite(n);

/**
 * Alarmstufe je Wert, angelehnt an die NEWS2-Bänder: 3 Punkte = rot, 1–2 Punkte = gelb.
 * Didaktische Anzeige, keine Gerätelogik; lokale Alarmgrenzen gehen vor.
 */
export function alarmStufe(p: MonitorParameter, n: number | null | undefined): Alarm {
  if (!da(n)) return 'ok';
  switch (p) {
    case 'puls': return n <= 40 || n > 130 ? 'rot' : n <= 50 || n > 90 ? 'gelb' : 'ok';
    case 'af': return n <= 8 || n >= 25 ? 'rot' : n <= 11 || n >= 21 ? 'gelb' : 'ok';
    case 'spo2': return n <= 91 ? 'rot' : n <= 95 ? 'gelb' : 'ok';
    case 'sys': return n <= 90 || n >= 220 ? 'rot' : n <= 110 ? 'gelb' : 'ok';
    case 'temp': return n <= 35 ? 'rot' : n <= 36 || n > 38 ? 'gelb' : 'ok';
  }
}

/** Höchste Alarmstufe über alle gemessenen Werte; Bewusstsein ungleich A ist immer rot. */
export function gesamtAlarm(w: MonitorWerte): Alarm {
  const stufen: Alarm[] = (['puls', 'af', 'spo2', 'sys', 'temp'] as const).map((p) => alarmStufe(p, w[p]));
  const avpu = w.avpu?.trim().toUpperCase().charAt(0);
  if (avpu && avpu !== 'A') stufen.push('rot');
  return stufen.includes('rot') ? 'rot' : stufen.includes('gelb') ? 'gelb' : 'ok';
}

/** Zahl aus Text wie "135/85", "38,4" oder "92 %". */
export function zahl(s: string | null | undefined): number | null {
  if (!s || !s.trim()) return null;
  const n = Number(s.replace(',', '.').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) && /\d/.test(s) ? n : null;
}

/** Blutdruck "135/85" → [135, 85]. */
export function blutdruck(s: string | null | undefined): [number | null, number | null] {
  const [a, b] = (s ?? '').split('/');
  return [zahl(a), zahl(b)];
}

// ---------- Kurvenformen, Phase 0..1 je Schlag/Atemzug, Ausschlag -1..1 ----------

const glocke = (x: number, mitte: number, breite: number) => Math.exp(-(((x - mitte) / breite) ** 2));

/** Vereinfachtes EKG (P, QRS, T) für einen Herzschlag. */
export function ekg(phase: number): number {
  const x = phase - Math.floor(phase);
  return 0.12 * glocke(x, 0.12, 0.03)
    - 0.12 * glocke(x, 0.235, 0.008)
    + 1.0 * glocke(x, 0.25, 0.012)
    - 0.25 * glocke(x, 0.27, 0.01)
    + 0.28 * glocke(x, 0.48, 0.06);
}

/** Pulsoxymetrie-Kurve mit dikroter Kerbe. */
export function pleth(phase: number): number {
  const x = phase - Math.floor(phase);
  return 0.95 * glocke(x, 0.28, 0.09) + 0.35 * glocke(x, 0.52, 0.08) - 0.4;
}

/** Atemkurve (Impedanz): Einatmen etwas kürzer als Ausatmen. */
export function atmung(phase: number): number {
  const x = phase - Math.floor(phase);
  return x < 0.4 ? -Math.cos((x / 0.4) * Math.PI) : Math.cos(((x - 0.4) / 0.6) * Math.PI);
}

/** Frequenz pro Minute → Schläge pro Sekunde; begrenzt, damit Unsinnswerte die Anzeige nicht sprengen. */
export const proSekunde = (n: number | null | undefined, min = 4, max = 220) => (da(n) && n > 0 ? Math.min(max, Math.max(min, n)) / 60 : 0);

/** Text für die große Zahl. */
export function anzeige(n: number | null | undefined, nachkomma = 0): string {
  if (!da(n)) return '--';
  return new Intl.NumberFormat('de-DE', { minimumFractionDigits: nachkomma, maximumFractionDigits: nachkomma }).format(n);
}
