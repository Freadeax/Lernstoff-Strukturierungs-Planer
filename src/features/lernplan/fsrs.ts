// FSRS-5 (Free Spaced Repetition Scheduler) mit den veröffentlichten Standardparametern.
// Quelle der Formeln: open-spaced-repetition/fsrs4anki, Algorithmus-Beschreibung FSRS-5.
// Gerechnet wird auf Tagesebene; mehrere Abfragen am selben Tag nutzen die Kurzzeit-Formel.

import { daysBetween, type ISODate } from './dates';
import type { Rating, ReviewLog } from './types';

export const FSRS5_DEFAULT_WEIGHTS: readonly number[] = [
  0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575, 0.1192, 1.01925,
  1.9395, 0.11, 0.29605, 2.2698, 0.2315, 2.9898, 0.51655, 0.6621,
];

const DECAY = -0.5;
const FACTOR = 19 / 81;

export interface MemoryState {
  /** Tage, nach denen die Abrufwahrscheinlichkeit auf 90 % gefallen ist. */
  stability: number;
  /** 1 (leicht) … 10 (schwer). */
  difficulty: number;
  lastReview: ISODate;
}

const w = (weights: readonly number[], i: number): number => weights[i] as number;
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** Abrufwahrscheinlichkeit nach `elapsedDays` Tagen bei Stabilität `stability`. */
export function retrievability(elapsedDays: number, stability: number): number {
  return Math.pow(1 + (FACTOR * Math.max(0, elapsedDays)) / stability, DECAY);
}

/** Intervall in ganzen Tagen (mind. 1), nach dem die Abrufwahrscheinlichkeit `desiredRetention` erreicht. */
export function nextIntervalDays(stability: number, desiredRetention: number): number {
  const raw = (stability / FACTOR) * (Math.pow(desiredRetention, 1 / DECAY) - 1);
  return Math.max(1, Math.round(raw));
}

function initDifficulty(rating: Rating, weights: readonly number[]): number {
  return w(weights, 4) - Math.exp(w(weights, 5) * (rating - 1)) + 1;
}

export function initState(rating: Rating, date: ISODate, weights = FSRS5_DEFAULT_WEIGHTS): MemoryState {
  return {
    stability: Math.max(0.1, w(weights, rating - 1)),
    difficulty: clamp(initDifficulty(rating, weights), 1, 10),
    lastReview: date,
  };
}

function nextDifficulty(d: number, rating: Rating, weights: readonly number[]): number {
  const delta = -w(weights, 6) * (rating - 3);
  const damped = d + (delta * (10 - d)) / 9;
  const reverted = w(weights, 7) * initDifficulty(4, weights) + (1 - w(weights, 7)) * damped;
  return clamp(reverted, 1, 10);
}

function recallStability(s: number, d: number, r: number, rating: Rating, weights: readonly number[]): number {
  const hardPenalty = rating === 2 ? w(weights, 15) : 1;
  const easyBonus = rating === 4 ? w(weights, 16) : 1;
  return (
    s *
    (Math.exp(w(weights, 8)) *
      (11 - d) *
      Math.pow(s, -w(weights, 9)) *
      (Math.exp(w(weights, 10) * (1 - r)) - 1) *
      hardPenalty *
      easyBonus +
      1)
  );
}

function forgetStability(s: number, d: number, r: number, weights: readonly number[]): number {
  const sf =
    w(weights, 11) *
    Math.pow(d, -w(weights, 12)) *
    (Math.pow(s + 1, w(weights, 13)) - 1) *
    Math.exp(w(weights, 14) * (1 - r));
  return Math.min(sf, s);
}

function shortTermStability(s: number, rating: Rating, weights: readonly number[]): number {
  return s * Math.exp(w(weights, 17) * (rating - 3 + w(weights, 18)));
}

export function updateState(
  state: MemoryState,
  rating: Rating,
  date: ISODate,
  weights = FSRS5_DEFAULT_WEIGHTS,
): MemoryState {
  const elapsed = daysBetween(state.lastReview, date);
  if (elapsed < 0) throw new Error(`Abfrage am ${date} liegt vor der letzten Abfrage (${state.lastReview})`);
  const difficulty = nextDifficulty(state.difficulty, rating, weights);
  let stability: number;
  if (elapsed === 0) {
    stability = shortTermStability(state.stability, rating, weights);
  } else {
    const r = retrievability(elapsed, state.stability);
    stability =
      rating === 1
        ? forgetStability(state.stability, state.difficulty, r, weights)
        : recallStability(state.stability, state.difficulty, r, rating, weights);
  }
  return { stability: Math.max(0.1, stability), difficulty, lastReview: date };
}

/** Prozentwert eines Tests in eine FSRS-Bewertung übersetzen. */
export function ratingFromScore(scorePercent: number): Rating {
  if (scorePercent < 50) return 1;
  if (scorePercent < 70) return 2;
  if (scorePercent < 90) return 3;
  return 4;
}

/** Bewertung eines Logs oder `undefined`, wenn es kein Wissensnachweis ist. */
export function evidenceRating(log: ReviewLog): Rating | undefined {
  if (log.source === 'selbsteinschaetzung') return undefined;
  if (log.rating !== undefined) return log.rating;
  if (log.scorePercent !== undefined) return ratingFromScore(log.scorePercent);
  return undefined;
}

/** Gedächtniszustand aus allen echten Abfrageergebnissen eines Themas rekonstruieren. */
export function replay(logs: ReviewLog[], weights = FSRS5_DEFAULT_WEIGHTS): MemoryState | undefined {
  const sorted = [...logs].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  let state: MemoryState | undefined;
  for (const log of sorted) {
    const rating = evidenceRating(log);
    if (rating === undefined) continue;
    state = state ? updateState(state, rating, log.date, weights) : initState(rating, log.date, weights);
  }
  return state;
}
