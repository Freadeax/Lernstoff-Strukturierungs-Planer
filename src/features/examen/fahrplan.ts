// Prüfungsfahrplan über alle CE: Aus dem Termin der schriftlichen Prüfung und dem echten Wissensstand je Thema
// wird die aktuelle Phase, ein Wochenpensum und je CE genau ein nächster Schritt. Rein (kein React, keine DB),
// damit die Regeln testbar sind und sich mit dem Wegweiser decken (gleiche Phasen wie PRUEFUNGSPHASEN).

import type { ID, MasteryStatus } from '../../core/types';
import { STATUS_GEWICHT } from './radar';

export type Phase = 'ohne_termin' | 'mitlernen' | 'ueberblick' | 'luecken' | 'festigen' | 'vorbei';

/** Grenzen in Tagen vor der schriftlichen Prüfung. */
export const PHASE_AB = { ueberblick: 183, luecken: 42, festigen: 7 } as const;

export const PHASE_TEXT: Record<Phase, { titel: string; text: string }> = {
  ohne_termin: { titel: 'Noch kein Examenstermin', text: 'Trag oben den Termin der schriftlichen Prüfung ein. Dann zeigt der Fahrplan, was du bis wann schaffen solltest.' },
  mitlernen: { titel: 'Laufend mitlernen', text: 'Bis zum Examen ist noch viel Zeit. Lerne die CE aus dem Unterricht mit und halte die Wiederholungen ein, dann bleibt am Ende wenig nachzuholen.' },
  ueberblick: { titel: 'Überblick über alle CE', text: 'Jetzt lohnt sich der Blick auf die ganze Ausbildung: Welche CE sind noch offen oder nie abgefragt worden? Diese kommen zuerst.' },
  luecken: { titel: 'Lücken schließen', text: 'Die heiße Phase. Konzentriere dich auf die schwächsten CE, mach jede Woche eine Prüfungssimulation und arbeite das Fehlerheft ab.' },
  festigen: { titel: 'Festigen statt Neues', text: 'Keine neuen Themen mehr. Wiederhole nur, was fällig ist, und arbeite das Fehlerheft ab.' },
  vorbei: { titel: 'Termin vorbei', text: 'Der eingetragene Termin liegt in der Vergangenheit. Trag den nächsten Termin ein, wenn noch eine Prüfung ansteht.' },
};

export function phaseFuer(tage: number | null): Phase {
  if (tage === null) return 'ohne_termin';
  if (tage < 0) return 'vorbei';
  if (tage <= PHASE_AB.festigen) return 'festigen';
  if (tage <= PHASE_AB.luecken) return 'luecken';
  if (tage <= PHASE_AB.ueberblick) return 'ueberblick';
  return 'mitlernen';
}

export interface CeEingabe { id: ID; code: string; name: string; topicIds: ID[] }

export interface FahrplanFakten {
  status: Map<ID, MasteryStatus>;
  faellig: Set<ID>;
  fehler: Map<ID, number>;
}

export type SchrittArt = 'erarbeiten' | 'abfragen' | 'wiederholen' | 'fehler' | 'halten';

export interface CeZeile {
  id: ID; code: string; name: string;
  themen: number;
  zahl: Record<MasteryStatus, number>;
  faellig: number;
  fehler: number;
  /** 0–100, gewichtet wie im Schwächen-Radar. */
  staerke: number;
  schritt: { art: SchrittArt; text: string };
}

export interface Fahrplan {
  phase: Phase;
  tage: number | null;
  zeilen: CeZeile[];
  /** Die CE, auf die du dich diese Woche konzentrierst (höchstens drei). */
  fokus: CeZeile[];
  /** Themen, die noch nicht sicher sind (über alle CE, ohne Doppelte). */
  offenGesamt: number;
  themenGesamt: number;
  /** Wochen bis zum Beginn der Festigungsphase. */
  wochenBisFestigen: number | null;
  /** Themen, die du pro Woche voranbringen solltest, damit bis zur Festigungsphase alles mindestens einmal abgefragt ist. */
  proWoche: number | null;
}

const LEER = (): Record<MasteryStatus, number> => ({ offen: 0, bearbeitet: 0, unsicher: 0, sicher: 0 });

const themenWort = (n: number) => (n === 1 ? '1 Thema' : `${n} Themen`);

/** Genau ein nächster Schritt je CE. In der Festigungsphase nie „erarbeiten“. */
export function naechsterSchritt(z: Pick<CeZeile, 'zahl' | 'faellig' | 'fehler'>, phase: Phase): CeZeile['schritt'] {
  const neuErlaubt = phase !== 'festigen';
  if (z.faellig > 0 && (phase === 'festigen' || phase === 'luecken')) return { art: 'wiederholen', text: `${themenWort(z.faellig)} heute fällig: wiederholen` };
  if (z.fehler > 0 && phase === 'festigen') return { art: 'fehler', text: `${z.fehler} offene Fehler im Fehlerheft` };
  if (z.zahl.offen > 0 && neuErlaubt) return { art: 'erarbeiten', text: `${themenWort(z.zahl.offen)} noch nicht erarbeitet` };
  if (z.zahl.bearbeitet > 0) return { art: 'abfragen', text: `${themenWort(z.zahl.bearbeitet)} erarbeitet, aber nie abgefragt` };
  if (z.zahl.unsicher > 0) return { art: 'wiederholen', text: `${themenWort(z.zahl.unsicher)} noch unsicher` };
  if (z.fehler > 0) return { art: 'fehler', text: `${z.fehler} offene Fehler im Fehlerheft` };
  if (z.faellig > 0) return { art: 'wiederholen', text: `${themenWort(z.faellig)} heute fällig: wiederholen` };
  return { art: 'halten', text: 'Alles sicher. Nur die fälligen Wiederholungen machen.' };
}

export function baueFahrplan(ces: CeEingabe[], f: FahrplanFakten, tage: number | null): Fahrplan {
  const phase = phaseFuer(tage);
  const zeilen: CeZeile[] = ces.map((c) => {
    const ids = [...new Set(c.topicIds)].filter((id) => f.status.has(id));
    const zahl = LEER();
    let fehler = 0, faellig = 0, summe = 0;
    for (const id of ids) {
      const s = f.status.get(id)!;
      zahl[s]++;
      summe += STATUS_GEWICHT[s];
      if (f.faellig.has(id)) faellig++;
      fehler += f.fehler.get(id) ?? 0;
    }
    const staerke = ids.length ? Math.round((summe / ids.length) * 100) : 0;
    const basis = { zahl, faellig, fehler };
    return { id: c.id, code: c.code, name: c.name, themen: ids.length, zahl, faellig, fehler, staerke, schritt: naechsterSchritt(basis, phase) };
  }).filter((z) => z.themen > 0);

  // Reihenfolge: In der Festigungsphase zählt, was heute fällig ist; sonst zuerst die schwächste CE.
  const sortiert = [...zeilen].sort((a, b) => (phase === 'festigen' ? b.faellig - a.faellig || b.fehler - a.fehler : 0)
    || a.staerke - b.staerke || b.fehler - a.fehler || a.code.localeCompare(b.code, 'de', { numeric: true }));
  const fokus = sortiert.filter((z) => z.schritt.art !== 'halten').slice(0, 3);

  const alle = new Set(zeilen.length ? ces.flatMap((c) => c.topicIds).filter((id) => f.status.has(id)) : []);
  const offenGesamt = [...alle].filter((id) => f.status.get(id) !== 'sicher').length;
  // Bis zur Festigungsphase soll jedes Thema mindestens einmal abgefragt sein (bearbeitet → unsicher/sicher).
  const nieAbgefragt = [...alle].filter((id) => { const s = f.status.get(id); return s === 'offen' || s === 'bearbeitet'; }).length;
  const wochenBisFestigen = tage === null || tage < 0 ? null : Math.max(0, Math.floor((tage - PHASE_AB.festigen) / 7));
  const proWoche = wochenBisFestigen === null || phase === 'festigen' || phase === 'vorbei' ? null
    : nieAbgefragt === 0 ? 0 : Math.ceil(nieAbgefragt / Math.max(1, wochenBisFestigen));

  return { phase, tage, zeilen: sortiert, fokus, offenGesamt, themenGesamt: alle.size, wochenBisFestigen, proWoche };
}
