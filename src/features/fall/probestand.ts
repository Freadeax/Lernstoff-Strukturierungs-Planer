// Fortschritt je Probefall aus den gespeicherten Fällen (Archiv im Browser, keine DB-Änderung):
// wie oft gespielt, bestes Ergebnis, welche Wendungen und Möglichkeiten schon entdeckt sind.

import { probeWeg, type Probefall } from './demo';
import type { Fall, Note } from './simulator';

const RANG: Record<Note, number> = { sicher: 3, ueberwiegend_sicher: 2, teilweise: 1, unsicher: 0 };

export interface ProbeStand {
  gespielt: number;
  beste: Note | null;
  wendungen: { gesehen: number; gesamt: number };
  optionen: { gesehen: number; gesamt: number };
}

/** Ziele aller Abzweige (Wendungen) eines Probefalls. */
export const wendungenVon = (p: Probefall) => [...new Set(Object.values(p.etappen).flatMap((e) => e.optionen.flatMap((o) => (o.weiter ? [o.weiter] : []))))];

export function probeStand(p: Probefall, archiv: Fall[]): ProbeStand {
  const faelle = archiv.filter((f) => f.szenario.id === p.szenario.id && f.abschluss);
  const etappen = new Set<string>();
  const gewaehlt = new Set<string>();
  let beste: Note | null = null;
  for (const f of faelle) {
    for (const w of probeWeg(p, f.runden.slice(1).map((r) => r.eingabe))) {
      etappen.add(w.id);
      if (w.option) gewaehlt.add(`${w.id}|${w.option.text}`);
    }
    const n = f.abschluss!.note;
    if (!beste || RANG[n] > RANG[beste]) beste = n;
  }
  const wend = wendungenVon(p);
  const alleOptionen = Object.values(p.etappen).reduce((s, e) => s + e.optionen.length, 0);
  return {
    gespielt: faelle.length, beste,
    wendungen: { gesehen: wend.filter((id) => etappen.has(id)).length, gesamt: wend.length },
    optionen: { gesehen: gewaehlt.size, gesamt: alleOptionen },
  };
}
