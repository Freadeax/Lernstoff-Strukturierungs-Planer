// Themenbaum: Fach › Bereich › Thema mit Wissensstand je Blatt und Summen je Bereich und Fach.
// Wissensstand = Lernplan-Logik (echte Abfragen), Arbeitsstand = Board. Beide werden getrennt gezeigt.

import type { BoardColumn } from '../../core/board';
import type { ID, MasteryStatus, Subject, Topic } from '../../core/types';
import type { TopicProgress } from '../lernplan/progress';
import type { BaumKnoten, BaumSegment, BaumTon } from '../../ui/baum/baum';
import { istEigenesThema } from './pflege';

export const STATUS_TON: Record<MasteryStatus, BaumTon> = { sicher: 'sicher', unsicher: 'unsicher', bearbeitet: 'arbeit', offen: 'offen' };
export const STATUS_NAME: Record<MasteryStatus, string> = { sicher: 'Sicher', unsicher: 'Unsicher', bearbeitet: 'Bearbeitet', offen: 'Offen' };
const REIHE: MasteryStatus[] = ['sicher', 'unsicher', 'bearbeitet', 'offen'];

export interface BlattDaten {
  [k: string]: unknown;
  topicId: ID;
  status: MasteryStatus;
  stand: BoardColumn;
  faellig: boolean;
  eigen: boolean;
  subjectId: ID;
  minuten?: number;
}

export interface BaumEingabe {
  subjects: Subject[];
  topics: Topic[];
  progress: Map<ID, TopicProgress>;
  board: Map<ID, BoardColumn>;
  heute: string;
}

const segmenteFuer = (status: MasteryStatus): BaumSegment[] =>
  REIHE.map((s) => ({ key: s, label: STATUS_NAME[s], wert: s === status ? 1 : 0, ton: STATUS_TON[s] }));

const STAND_HINWEIS: Partial<Record<BoardColumn, string>> = { woche: 'diese Woche', arbeit: 'in Arbeit', erarbeitet: 'erarbeitet' };

/** Fach-Knoten-ID (Fächer und Themen teilen sich den Baum). */
export const fachKnoten = (subjectId: ID) => `fach:${subjectId}`;

/** Baut den Baum. Reihenfolge: Katalogreihenfolge, eigene Themen danach alphabetisch. */
export function baueThemenbaum(e: BaumEingabe): BaumKnoten[] {
  const kinderVon = new Map<string, Topic[]>();
  for (const t of e.topics) {
    const k = t.parentId && e.topics.some((x) => x.id === t.parentId) ? t.parentId : fachKnoten(t.subjectId);
    kinderVon.set(k, [...(kinderVon.get(k) ?? []), t]);
  }
  const sortiere = (ts: Topic[]) => [...ts.filter((t) => !istEigenesThema(t.id)), ...ts.filter((t) => istEigenesThema(t.id)).sort((a, b) => a.name.localeCompare(b.name, 'de'))];
  const knoten = (t: Topic, besucht: Set<ID>): BaumKnoten => {
    const kinder = besucht.has(t.id) ? [] : sortiere(kinderVon.get(t.id) ?? []).map((c) => knoten(c, new Set([...besucht, t.id])));
    const eigen = istEigenesThema(t.id);
    const href = `/lernen/thema?id=${encodeURIComponent(t.id)}`;
    if (kinder.length) return { id: t.id, label: t.name, href, kinder, ablage: true, ziehbar: eigen, daten: { eigen, subjectId: t.subjectId } };
    const p = e.progress.get(t.id);
    const status = p?.status ?? 'offen';
    const stand = e.board.get(t.id) ?? 'pool';
    const faellig = !!p && p.testCount > 0 && !!p.nextReview && p.nextReview <= e.heute && status !== 'offen';
    const hinweise = [faellig ? 'fällig' : '', STAND_HINWEIS[stand] ?? '', eigen ? 'eigenes' : ''].filter(Boolean);
    const daten: BlattDaten = { topicId: t.id, status, stand, faellig, eigen, subjectId: t.subjectId, minuten: t.estimatedMinutes };
    return { id: t.id, label: t.name, href, segmente: segmenteFuer(status), hinweis: hinweise.join(' · ') || undefined, ziehbar: eigen, ablage: eigen, daten };
  };
  return e.subjects
    .map((s): BaumKnoten => {
      let kinder = sortiere(kinderVon.get(fachKnoten(s.id)) ?? []).map((t) => knoten(t, new Set()));
      // Ein Fach mit genau einem Bereich: Ebene überspringen (sonst steht derselbe Name zweimal untereinander).
      const einzig = kinder.length === 1 && kinder[0]!.kinder?.length && !istEigenesThema(kinder[0]!.id) ? kinder[0]! : undefined;
      if (einzig) kinder = einzig.kinder!;
      return { id: fachKnoten(s.id), label: s.code ? `${s.code} · ${s.name}` : s.name, href: einzig?.href, kinder, ablage: true, daten: { fach: true, subjectId: s.id, ...(einzig ? { bereich: einzig.id } : {}) } };
    })
    .filter((k) => k.kinder?.length);
}

/** „3/12 sicher“ für Eltern, Statusname für Blätter. */
export function standText(segmente: BaumSegment[], k: BaumKnoten): string {
  if (!k.kinder?.length) return STATUS_NAME[(k.daten as BlattDaten | undefined)?.status ?? 'offen'];
  const g = segmente.reduce((a, s) => a + s.wert, 0);
  const sicher = segmente.find((s) => s.key === 'sicher')?.wert ?? 0;
  return `${sicher}/${g} sicher`;
}

export type BaumFilter = 'alle' | MasteryStatus | 'faellig' | 'eingeplant';
export const BAUM_FILTER: Array<{ id: BaumFilter; label: string }> = [
  { id: 'alle', label: 'Alle' },
  { id: 'eingeplant', label: 'Eingeplant' },
  { id: 'faellig', label: 'Fällig' },
  { id: 'offen', label: 'Offen' },
  { id: 'bearbeitet', label: 'Bearbeitet' },
  { id: 'unsicher', label: 'Unsicher' },
  { id: 'sicher', label: 'Sicher' },
];

export function passtFilter(k: BaumKnoten, f: BaumFilter): boolean {
  const d = k.daten as BlattDaten | undefined;
  if (!d?.topicId) return false;
  if (f === 'alle') return true;
  if (f === 'faellig') return d.faellig;
  if (f === 'eingeplant') return d.stand === 'woche' || d.stand === 'arbeit';
  return d.status === f;
}

/** Blätter in Baumreihenfolge. */
export function blaetter(knoten: BaumKnoten[]): BaumKnoten[] {
  return knoten.flatMap((k) => (k.kinder?.length ? blaetter(k.kinder) : (k.daten as BlattDaten | undefined)?.topicId ? [k] : []));
}

/**
 * Nächstes Thema zum Weiterlernen im Baum (wie „Weiter“ in Lernpfaden):
 * in Arbeit > fällige Wiederholung > diese Woche > unsicher > bearbeitet > erstes offenes.
 */
export function naechstesThema(knoten: BaumKnoten[]): { knoten: BaumKnoten; grund: string } | undefined {
  const alle = blaetter(knoten);
  const d = (k: BaumKnoten) => k.daten as BlattDaten;
  const regeln: Array<[(k: BaumKnoten) => boolean, string]> = [
    [(k) => d(k).stand === 'arbeit' && d(k).status !== 'sicher', 'Steht bei dir auf „In Arbeit“.'],
    [(k) => d(k).faellig, 'Die Wiederholung ist fällig.'],
    [(k) => d(k).stand === 'woche' && d(k).status !== 'sicher', 'Für diese Woche vorgenommen.'],
    [(k) => d(k).status === 'unsicher', 'Bei der letzten Abfrage noch unsicher.'],
    [(k) => d(k).status === 'bearbeitet', 'Begonnen, aber noch nicht abgefragt.'],
    [(k) => d(k).status === 'offen', 'Das nächste offene Thema in der Reihenfolge.'],
  ];
  for (const [passt, grund] of regeln) {
    const k = alle.find(passt);
    if (k) return { knoten: k, grund };
  }
  return undefined;
}
