import type { Notenstufe } from './typen';

/**
 * Standard: Notenschlüssel nach dem verbreiteten IHK-/Kammer-Raster (100–92 % = 1, unter 30 % = 6).
 * Pflegeschulen nutzen oft eigene Raster; die Lehrkraft kann ihn unter „Einstellungen“ ändern.
 */
export const STANDARD_SCHLUESSEL: Notenstufe[] = [
  { note: '1', ab: 92 },
  { note: '2', ab: 81 },
  { note: '3', ab: 67 },
  { note: '4', ab: 50 },
  { note: '5', ab: 30 },
  { note: '6', ab: 0 },
];

export const NOTE_TEXT: Record<string, string> = { 1: 'sehr gut', 2: 'gut', 3: 'befriedigend', 4: 'ausreichend', 5: 'mangelhaft', 6: 'ungenügend' };

/** Absteigend sortiert, Prozent 0–100, unterste Stufe beginnt bei 0. Leere oder unsinnige Zeilen fallen weg. */
export function ordneSchluessel(stufen: Notenstufe[]): Notenstufe[] {
  const ok = stufen
    .filter((s) => s && typeof s.note === 'string' && s.note.trim() && Number.isFinite(s.ab))
    .map((s) => ({ note: s.note.trim().slice(0, 30), ab: Math.min(100, Math.max(0, Math.round(s.ab * 10) / 10)) }))
    .sort((a, b) => b.ab - a.ab);
  if (!ok.length) return STANDARD_SCHLUESSEL;
  ok[ok.length - 1] = { ...ok[ok.length - 1]!, ab: 0 };
  return ok;
}

export function noteFuer(prozent: number, schluessel: Notenstufe[] = STANDARD_SCHLUESSEL): string {
  const s = ordneSchluessel(schluessel);
  return (s.find((x) => prozent >= x.ab) ?? s[s.length - 1]!).note;
}

/** Prozent mit einer Nachkommastelle, ohne Rundung nach oben über eine Notengrenze. */
export function prozent(punkte: number, max: number): number {
  if (max <= 0) return 0;
  return Math.floor((punkte / max) * 1000) / 10;
}

export const zahl = (n: number) => n.toLocaleString('de-DE', { maximumFractionDigits: 1 });
