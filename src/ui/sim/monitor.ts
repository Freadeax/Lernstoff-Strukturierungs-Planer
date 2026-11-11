// Rechenteil des animierten Patientenmonitors: Kurvenformen und Alarmstufen.
// Rein und ohne DOM, damit Praxis- und Fallsimulator dieselben Regeln teilen und sie testbar bleiben.

import { vitalNormal } from './vitalnormen';

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

/** Altersgruppe wie bei den Laborwerten (Typ aus labor/parameter, hier gespiegelt, damit der Monitor ohne Laborteil auskommt). */
export type MonitorGruppe = 'erwachsen' | 'saeugling' | 'kleinkind' | 'schulkind';

/** Grenzen je Wert: Werte < rotUnter oder > rotUeber = rot, < gelbUnter oder > gelbUeber = gelb. */
interface Grenzen { rotUnter?: number; gelbUnter?: number; gelbUeber?: number; rotUeber?: number }

/**
 * Kinder-Alarmprofile (didaktisch): Puls, Atemfrequenz und systolischer Druck nach Altersband, angelehnt an
 * gängige pädiatrische Normwerttabellen und PEWS-Logik. SpO₂ und Temperatur wie bei Erwachsenen.
 */
/** Rote Grenzen je Kindergruppe; gelb heißt außerhalb des Normalbereichs aus dem gemeinsamen Vertrag (vitalnormen.ts). */
const KIND_ROT: Record<'kleinkind' | 'schulkind', Partial<Record<MonitorParameter, { rotUnter?: number; rotUeber?: number }>>> = {
  kleinkind: { puls: { rotUnter: 70, rotUeber: 170 }, af: { rotUnter: 15, rotUeber: 50 }, sys: { rotUnter: 70 } },
  schulkind: { puls: { rotUnter: 60, rotUeber: 150 }, af: { rotUnter: 12, rotUeber: 40 }, sys: { rotUnter: 80 } },
};
const kindGrenzen = (g: 'kleinkind' | 'schulkind', p: MonitorParameter): Grenzen | undefined => {
  const rot = KIND_ROT[g][p];
  if (!rot) return undefined;
  const n = vitalNormal(p, g);
  return { ...rot, gelbUnter: n?.min, gelbUeber: n?.max };
};

export interface AlarmProfil {
  gruppe: MonitorGruppe;
  /** false: kein freigegebenes Profil, der Monitor färbt nicht und wertet nicht automatisch. */
  bewertet: boolean;
  /** Kurzlabel am Monitor, z. B. „Alarmgrenzen Kind 6–13 J.“ */
  label: string;
  /** Herkunft und Messkontext für die Anzeige am Entscheidungspunkt. */
  quelle: string;
}

const QUELLE_ERW = 'Angelehnt an die NEWS2-Bänder (Royal College of Physicians 2017). Didaktische Anzeige, keine Gerätelogik; lokale Alarmgrenzen gehen vor.';
const QUELLE_KIND = 'Puls, Atemfrequenz und systolischer Druck nach Altersband, angelehnt an pädiatrische Normwerttabellen und PEWS-Logik; SpO₂ und Temperatur wie bei Erwachsenen. Ruhewerte im Wachzustand, fachlich ungeprüft; lokale Alarmgrenzen und ärztliche Vorgaben gehen vor.';

export function alarmProfil(gruppe: MonitorGruppe = 'erwachsen'): AlarmProfil {
  switch (gruppe) {
    case 'erwachsen': return { gruppe, bewertet: true, label: 'Alarmgrenzen Erwachsene (NEWS2)', quelle: QUELLE_ERW };
    case 'schulkind': return { gruppe, bewertet: true, label: 'Alarmgrenzen Kind 6–13 J.', quelle: QUELLE_KIND };
    case 'kleinkind': return { gruppe, bewertet: true, label: 'Alarmgrenzen Kind 1–5 J.', quelle: QUELLE_KIND };
    case 'saeugling': return { gruppe, bewertet: false, label: 'Kein Alarmprofil für Säuglinge', quelle: 'Für Säuglinge gibt es hier kein freigegebenes Profil. Der Monitor färbt die Werte nicht; beurteile sie nach den Vorgaben deiner Station.' };
  }
}

const stufe = (n: number, g: Grenzen): Alarm =>
  (g.rotUnter !== undefined && n < g.rotUnter) || (g.rotUeber !== undefined && n > g.rotUeber) ? 'rot'
    : (g.gelbUnter !== undefined && n < g.gelbUnter) || (g.gelbUeber !== undefined && n > g.gelbUeber) ? 'gelb' : 'ok';

/**
 * Alarmstufe je Wert. Erwachsene: angelehnt an die NEWS2-Bänder (3 Punkte = rot, 1–2 Punkte = gelb).
 * Kinder: eigenes Profil je Altersgruppe; Säuglinge ohne Profil bleiben ungefärbt ('ok').
 * Didaktische Anzeige, keine Gerätelogik; lokale Alarmgrenzen gehen vor.
 */
export function alarmStufe(p: MonitorParameter, n: number | null | undefined, gruppe: MonitorGruppe = 'erwachsen'): Alarm {
  if (!da(n)) return 'ok';
  if (gruppe === 'saeugling') return 'ok';
  if (gruppe !== 'erwachsen') {
    const g = kindGrenzen(gruppe, p);
    if (g) return stufe(n, g);
  }
  switch (p) {
    case 'puls': return n <= 40 || n > 130 ? 'rot' : n <= 50 || n > 90 ? 'gelb' : 'ok';
    case 'af': return n <= 8 || n >= 25 ? 'rot' : n <= 11 || n >= 21 ? 'gelb' : 'ok';
    case 'spo2': return n <= 91 ? 'rot' : n <= 95 ? 'gelb' : 'ok';
    case 'sys': return n <= 90 || n >= 220 ? 'rot' : n <= 110 ? 'gelb' : 'ok';
    case 'temp': return n <= 35 ? 'rot' : n <= 36 || n > 38 ? 'gelb' : 'ok';
  }
}

/** Normalbereich je Wert und Altersgruppe aus dem gemeinsamen Vertrag (für Kurvenbänder); undefined ohne Profil. */
export function normBand(p: MonitorParameter, gruppe: MonitorGruppe = 'erwachsen'): { min?: number; max?: number } | undefined {
  return vitalNormal(p, gruppe);
}

/** Höchste Alarmstufe über alle gemessenen Werte; Bewusstsein ungleich A ist immer rot. */
export function gesamtAlarm(w: MonitorWerte, gruppe: MonitorGruppe = 'erwachsen'): Alarm {
  const stufen: Alarm[] = (['puls', 'af', 'spo2', 'sys', 'temp'] as const).map((p) => alarmStufe(p, w[p], gruppe));
  const avpu = w.avpu?.trim().toUpperCase().charAt(0);
  if (avpu && avpu !== 'A') stufen.push('rot');
  return stufen.includes('rot') ? 'rot' : stufen.includes('gelb') ? 'gelb' : 'ok';
}

/** Altersgruppe aus dem Alter in Jahren (wie labor/parameter.altersgruppe). */
export function monitorGruppe(alter: number | null | undefined): MonitorGruppe {
  if (!da(alter)) return 'erwachsen';
  return alter < 1 ? 'saeugling' : alter < 6 ? 'kleinkind' : alter < 14 ? 'schulkind' : 'erwachsen';
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
