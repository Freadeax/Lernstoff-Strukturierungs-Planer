// Wiederholungsplanung je Karte mit FSRS-5 (dieselben Formeln wie der Lernplan, src/features/lernplan/fsrs.ts).
// Rein, ohne DB: Sitzung zusammenstellen, Antwort verbuchen, Ergebnisse je Thema für den Lernplan bündeln.

import type { ID } from '../../core/types';
import { addDays, daysBetween } from '../lernplan/dates';
import { initState, nextIntervalDays, retrievability, updateState } from '../lernplan/fsrs';
import type { Rating } from '../lernplan/types';
import type { Karte, KartenConfig, KartenLog, KartenStand } from './typen';

/** Neuer Lernstand nach einer Antwort. Fällig wird die Karte frühestens morgen. */
export function bewerte(stand: KartenStand | undefined, cardId: ID, rating: Rating, heute: string, retention: number): KartenStand {
  // Eine Uhr, die zurückgestellt wurde, darf den Stand nicht zerstören: dann zählt der letzte Abfragetag.
  const tag = stand && heute < stand.lastReview ? stand.lastReview : heute;
  const mem = stand
    ? updateState({ stability: stand.stability, difficulty: stand.difficulty, lastReview: stand.lastReview }, rating, tag)
    : initState(rating, tag);
  return {
    cardId,
    stability: mem.stability,
    difficulty: mem.difficulty,
    lastReview: tag,
    due: addDays(tag, nextIntervalDays(mem.stability, retention)),
    reps: (stand?.reps ?? 0) + 1,
    lapses: (stand?.lapses ?? 0) + (stand && rating === 1 ? 1 : 0),
    erstmals: stand?.erstmals ?? tag,
    ausgesetzt: stand?.ausgesetzt,
  };
}

/** Intervall in Tagen je Bewertung, für die Beschriftung der vier Knöpfe. */
export function vorschau(stand: KartenStand | undefined, heute: string, retention: number): Record<Rating, number> {
  const out = {} as Record<Rating, number>;
  for (const r of [1, 2, 3, 4] as Rating[]) {
    const n = bewerte(stand, '', r, heute, retention);
    out[r] = daysBetween(heute, n.due);
  }
  return out;
}

export function intervallText(tage: number): string {
  if (tage <= 1) return 'morgen';
  if (tage < 30) return `${tage} T`;
  if (tage < 365) return `${Math.round(tage / 30)} Mon`;
  return `${(tage / 365).toFixed(1).replace('.', ',')} J`;
}

/** Abrufwahrscheinlichkeit heute (für Sortierung und Statistik). */
export function abruf(stand: KartenStand, heute: string): number {
  return retrievability(daysBetween(stand.lastReview, heute), stand.stability);
}

export const istFaellig = (s: KartenStand, heute: string) => !s.ausgesetzt && s.due <= heute;
/** „Gefestigt“: hält voraussichtlich drei Wochen. Nur Statistik, kein Nachweis für ein ganzes Thema. */
export const istGefestigt = (s: KartenStand) => s.stability >= 21;

export interface SitzungsOptionen {
  heute: string;
  config: Pick<KartenConfig, 'neueProTag' | 'sitzungsGroesse'>;
  /** Wie viele Karten heute schon zum ersten Mal abgefragt wurden. */
  neueHeuteSchon: number;
  /** Nur Karten dieser Themen (z. B. aus dem Lernplan aufgerufen). */
  themen?: ID[];
  /** Auch noch nicht fällige Karten nehmen, wenn sonst nichts da ist (vorgezogene Wiederholung). */
  vorziehen?: boolean;
}

export interface Sitzung { karten: Karte[]; faellig: number; neu: number; vorgezogen: number }

/**
 * Stellt eine Sitzung zusammen: zuerst fällige Karten (am stärksten vergessene vorne),
 * dann neue Karten bis zum Tageslimit. Neue Karten werden in die fälligen eingestreut,
 * damit eine lange Wiederholungsliste nicht nur aus Altem besteht.
 */
export function stelleSitzungZusammen(alle: Karte[], staende: Map<ID, KartenStand>, o: SitzungsOptionen): Sitzung {
  const themen = o.themen?.length ? new Set(o.themen) : undefined;
  const pool = themen ? alle.filter((k) => k.topicIds.some((t) => themen.has(t))) : alle;
  const faellig: { k: Karte; r: number }[] = [];
  const neu: Karte[] = [];
  const spaeter: { k: Karte; due: string }[] = [];
  for (const k of pool) {
    const s = staende.get(k.id);
    if (!s) neu.push(k);
    else if (s.ausgesetzt) continue;
    else if (s.due <= o.heute) faellig.push({ k, r: abruf(s, o.heute) });
    else spaeter.push({ k, due: s.due });
  }
  faellig.sort((a, b) => a.r - b.r);
  const max = Math.max(1, o.config.sitzungsGroesse);
  // Im Themenmodus gilt das Tageslimit nicht: wer gezielt ein Thema übt, will alle Karten sehen.
  const neuErlaubt = themen ? max : Math.max(0, o.config.neueProTag - o.neueHeuteSchon);
  const alt = faellig.slice(0, max).map((x) => x.k);
  const frisch = neu.slice(0, Math.min(neuErlaubt, max - alt.length));
  const karten = einstreuen(alt, frisch);
  let vorgezogen = 0;
  if (!karten.length && o.vorziehen) {
    spaeter.sort((a, b) => (a.due < b.due ? -1 : 1));
    const v = spaeter.slice(0, max).map((x) => x.k);
    vorgezogen = v.length;
    karten.push(...v);
  }
  return { karten, faellig: alt.length, neu: frisch.length, vorgezogen };
}

/** Nach jeweils drei alten eine neue Karte, Reste hinten an. */
export function einstreuen<T>(alt: T[], neu: T[]): T[] {
  const out: T[] = [];
  let n = 0;
  alt.forEach((k, i) => {
    out.push(k);
    if ((i + 1) % 3 === 0 && n < neu.length) out.push(neu[n++]!);
  });
  return [...out, ...neu.slice(n)];
}

/** Bei „Vergessen“ kommt die Karte in derselben Sitzung nach ein paar anderen noch einmal. */
export const WIEDERHOLEN_NACH = 3;

export function wiedereinreihen<T>(rest: T[], karte: T, abstand = WIEDERHOLEN_NACH): T[] {
  const i = Math.min(abstand, rest.length);
  return [...rest.slice(0, i), karte, ...rest.slice(i)];
}

// ---------------------------------------------------------------- Lernplan

/** Punktwert je Bewertung; ratingFromScore im Lernplan bildet ihn wieder auf 1–4 ab. */
const PUNKTE: Record<Rating, number> = { 1: 0, 2: 60, 3: 85, 4: 100 };
/** Erst ab so vielen Karten eines Themas in einer Sitzung gibt es ein Ergebnis an den Lernplan. */
export const MIN_KARTEN_JE_THEMA = 3;

export interface ThemenErgebnis { topicId: ID; karten: number; scorePercent: number }

/**
 * Bündelt die ersten Antworten je Karte einer Sitzung zu einem Ergebnis je Thema.
 * Wiederholungen nach „Vergessen“ zählen nicht noch einmal, sonst würde ein Thema
 * durch Nachlernen in derselben Sitzung besser aussehen, als es ist.
 */
export function ergebnisseJeThema(antworten: Pick<KartenLog, 'cardId' | 'rating' | 'topicIds'>[], erlaubt?: Set<ID>): ThemenErgebnis[] {
  const erste = new Map<ID, Pick<KartenLog, 'rating' | 'topicIds'>>();
  for (const a of antworten) if (!erste.has(a.cardId)) erste.set(a.cardId, a);
  const je = new Map<ID, number[]>();
  for (const a of erste.values()) {
    for (const t of a.topicIds) {
      if (erlaubt && !erlaubt.has(t)) continue;
      je.set(t, [...(je.get(t) ?? []), PUNKTE[a.rating]]);
    }
  }
  return [...je.entries()]
    .filter(([, p]) => p.length >= MIN_KARTEN_JE_THEMA)
    .map(([topicId, p]) => ({ topicId, karten: p.length, scorePercent: Math.round(p.reduce((s, x) => s + x, 0) / p.length) }))
    .sort((a, b) => a.scorePercent - b.scorePercent);
}

// ---------------------------------------------------------------- Statistik

/** Fällige Karten je Tag ab heute (Tag 0 enthält alles Überfällige). */
export function prognose(staende: Iterable<KartenStand>, heute: string, tage = 7): { date: string; anzahl: number }[] {
  const out = Array.from({ length: tage }, (_, i) => ({ date: addDays(heute, i), anzahl: 0 }));
  for (const s of staende) {
    if (s.ausgesetzt) continue;
    const i = Math.max(0, daysBetween(heute, s.due));
    if (i < tage) out[i]!.anzahl++;
  }
  return out;
}

export function trefferquote(logs: Pick<KartenLog, 'rating'>[]): number | null {
  if (!logs.length) return null;
  return logs.filter((l) => l.rating >= 3).length / logs.length;
}
