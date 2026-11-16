// Kompetenz-Radar für Fortschritt und Heute: Stärke je Kompetenzbereich I bis V, heute und vor vier Wochen.
// Rein und ohne Fachmodul-Import, damit es auf der Startseite klein bleibt. Gewichte wie im Examen-Radar
// (examen/radar.ts, STATUS_GEWICHT): ein Test hält beide gleich.

import type { ID, MasteryStatus } from '../../core/types';
import type { Bereich } from './statistik';

export const RADAR_GEWICHT: Record<MasteryStatus, number> = { sicher: 1, unsicher: 0.5, bearbeitet: 0.2, offen: 0 };
/** Vergleichszeitpunkt für den Verlauf. */
export const VERGLEICH_TAGE = 28;

export interface RadarAchse {
  id: ID;
  code: string;
  name: string;
  themen: number;
  /** 0 … 100 */
  jetzt: number;
  /** 0 … 100, fehlt ohne Vergleich. */
  vorher?: number;
}

const staerke = (ids: ID[], status: (id: ID) => MasteryStatus) =>
  ids.length ? Math.round((ids.reduce((s, id) => s + RADAR_GEWICHT[status(id)], 0) / ids.length) * 100) : 0;

export function radarAchsen(bereiche: Bereich[], jetzt: (id: ID) => MasteryStatus, vorher?: (id: ID) => MasteryStatus): RadarAchse[] {
  return bereiche.map((b) => ({
    id: b.id, code: b.code, name: b.name, themen: b.topicIds.length,
    jetzt: staerke(b.topicIds, jetzt),
    ...(vorher ? { vorher: staerke(b.topicIds, vorher) } : {}),
  }));
}

/** Schwächster Bereich mit Themen, aber nur, wenn überhaupt schon etwas gemessen wurde. */
export function schwaechsteAchse(achsen: RadarAchse[]): RadarAchse | undefined {
  if (!achsen.some((a) => a.jetzt > 0)) return undefined;
  return [...achsen].filter((a) => a.themen).sort((a, b) => a.jetzt - b.jetzt || a.code.localeCompare(b.code))[0];
}

/** Ecken eines Radar-Polygons: Wert 0 … 100 je Achse, erste Achse oben, im Uhrzeigersinn. */
export function radarPunkte(werte: number[], radius: number, mitte: number): Array<[number, number]> {
  const n = werte.length;
  return werte.map((w, i) => {
    const winkel = -Math.PI / 2 + (2 * Math.PI * i) / n;
    const r = (Math.max(0, Math.min(100, w)) / 100) * radius;
    return [Math.round((mitte + r * Math.cos(winkel)) * 10) / 10, Math.round((mitte + r * Math.sin(winkel)) * 10) / 10];
  });
}

export function veraenderung(a: RadarAchse): string {
  if (a.vorher === undefined) return '';
  const d = a.jetzt - a.vorher;
  return d === 0 ? '±0' : d > 0 ? `+${d}` : `−${-d}`;
}
