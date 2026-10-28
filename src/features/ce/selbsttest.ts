// CE-Selbsttest: gemischte Abfrage über mehrere Themen einer CE aus den vorhandenen Karteikarten.
// Ergebnis je Thema geht als Trainer-Abfrage an den Lernplan (nur der erste Versuch am Tag zählt,
// mindestens drei Fragen je Thema, siehe lernplan/trainer.ts). Der Kartenstand bleibt unberührt.

import type { ID, MasteryStatus } from '../../core/types';
import type { Karte } from '../karteikarten/typen';
import { proThema, type ThemenErgebnis, type Treffer } from '../lernplan/trainer';

/** So viele Fragen je Thema; weniger reicht dem Lernplan nicht als Nachweis. */
export const FRAGEN_JE_THEMA = 3;

export type Antwort = 'gewusst' | 'teilweise' | 'nicht';
export const ANTWORT_PUNKTE: Record<Antwort, number> = { gewusst: 1, teilweise: 0.5, nicht: 0 };
export const ANTWORT_LABEL: Record<Antwort, string> = { gewusst: 'Gewusst', teilweise: 'Teilweise', nicht: 'Nicht gewusst' };

export interface Frage { karte: Karte; topicId: ID }

/**
 * Welche Themen zuerst drankommen: erarbeitet, aber noch nie abgefragt; dann unsicher;
 * dann sicher (zum Auffrischen); noch gar nicht erarbeitete Themen zuletzt.
 */
const RANG: Record<MasteryStatus, number> = { bearbeitet: 0, unsicher: 1, sicher: 2, offen: 3 };

function mische<T>(xs: T[], zufall: () => number): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(zufall() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Themen der CE, zu denen es genug Karten für einen Selbsttest gibt. */
export function testbareThemen(karten: Karte[], themen: ID[]): Map<ID, Karte[]> {
  const erlaubt = new Set(themen);
  const je = new Map<ID, Karte[]>();
  for (const k of karten) for (const t of new Set(k.topicIds)) if (erlaubt.has(t)) je.set(t, [...(je.get(t) ?? []), k]);
  return new Map([...je].filter(([, ks]) => ks.length >= FRAGEN_JE_THEMA));
}

/**
 * Stellt den Test zusammen: bis zu `maxThemen` Themen mit je drei Karten, jede Karte nur einmal,
 * Fragen verschiedener Themen gemischt. `nurThema` testet gezielt ein einzelnes Thema.
 */
export function stelleTestZusammen(
  karten: Karte[], themen: ID[], status: (id: ID) => MasteryStatus,
  o: { maxThemen?: number; nurThema?: ID; zufall?: () => number } = {},
): Frage[] {
  const zufall = o.zufall ?? Math.random;
  const pool = testbareThemen(karten, o.nurThema ? [o.nurThema] : themen);
  const reihe = mische([...pool.keys()], zufall).sort((a, b) => RANG[status(a)] - RANG[status(b)]);
  const benutzt = new Set<ID>();
  const fragen: Frage[] = [];
  let themenZahl = 0;
  for (const t of reihe) {
    if (themenZahl >= (o.maxThemen ?? 5)) break;
    const frei = mische(pool.get(t)!.filter((k) => !benutzt.has(k.id)), zufall).slice(0, FRAGEN_JE_THEMA);
    if (frei.length < FRAGEN_JE_THEMA) continue;
    for (const k of frei) { benutzt.add(k.id); fragen.push({ karte: k, topicId: t }); }
    themenZahl++;
  }
  return mische(fragen, zufall);
}

/** Antworten je Thema auswerten; jede Frage zählt nur für das Thema, für das sie gestellt wurde. */
export function werteAus(fragen: Frage[], antworten: Antwort[]): ThemenErgebnis[] {
  const treffer: Treffer[] = fragen.slice(0, antworten.length).map((f, i) => ({ topicIds: [f.topicId], punkte: ANTWORT_PUNKTE[antworten[i]!], max: 1 }));
  return proThema(treffer, FRAGEN_JE_THEMA);
}
