// Ergebnisse der Übungstrainer (Rechentrainer, Duell, Fallsimulator, Übergabe-Trainer) als
// Abfragen an den Lernplan geben. Oben reine Funktionen (testbar), unten das Speichern.
//
// Regeln, damit Übungen nichts vortäuschen:
// - Nur echte Abfragen zählen: Training mit Tipps, Selbsteinschätzung oder eine Hilfe-Ansicht nicht.
// - Pro Thema braucht es eine Mindestzahl an Aufgaben, sonst ist der Prozentwert Zufall.
// - Je Trainer, Thema und Tag zählt nur der erste Versuch. Wer dieselbe Übergabe so lange
//   nachbessert, bis sie 100 % hat, beweist damit nicht, dass er sie morgen noch kann.

import { db } from '../../core/db';
import type { Topic } from '../../core/types';
import { pflegeModule } from '../../modules/pflege';
import { heute, leafTopics, logReview, TRAINER_NAME } from './store';

export type TrainerId = 'rechnen' | 'duell' | 'fall' | 'uebergabe';

export const TRAINER_LABEL = TRAINER_NAME as Record<TrainerId, string>;

/** Eine bewertete Aufgabe: zu welchen Themen sie gehört und wie viel davon richtig war. */
export interface Treffer { topicIds: string[]; punkte: number; max: number }

export interface ThemenErgebnis { topicId: string; scorePercent: number; anzahl: number }

/** Fasst bewertete Aufgaben je Thema zusammen. Themen mit weniger als `minAnzahl` Aufgaben fallen weg. */
export function proThema(treffer: Treffer[], minAnzahl = 1): ThemenErgebnis[] {
  const sum = new Map<string, { p: number; max: number; n: number }>();
  for (const t of treffer) {
    if (t.max <= 0) continue;
    for (const id of new Set(t.topicIds)) {
      const s = sum.get(id) ?? { p: 0, max: 0, n: 0 };
      sum.set(id, { p: s.p + Math.max(0, Math.min(t.punkte, t.max)), max: s.max + t.max, n: s.n + 1 });
    }
  }
  return [...sum].filter(([, s]) => s.n >= minAnzahl)
    .map(([topicId, s]) => ({ topicId, scorePercent: Math.round((s.p / s.max) * 100), anzahl: s.n }))
    .sort((a, b) => a.topicId.localeCompare(b.topicId));
}

export type UebernahmeStatus = 'gespeichert' | 'heute_schon' | 'kein_thema';
export interface Uebernahme { topicId: string; name: string; scorePercent: number; anzahl: number; status: UebernahmeStatus }

/**
 * Entscheidet ohne Datenbank, was gespeichert wird: unbekannte Themen und Oberthemen
 * (die der Plan nicht abfragt) fallen weg, heute schon gezählte Themen bleiben beim ersten Versuch.
 */
export function planeUebernahme(ergebnisse: ThemenErgebnis[], topics: Topic[], heuteSchon: Set<string>): Uebernahme[] {
  const leaves = new Map(leafTopics(topics).map((t) => [t.id, t]));
  const alle = new Map(topics.map((t) => [t.id, t]));
  return ergebnisse.map((e) => {
    const t = leaves.get(e.topicId);
    const name = alle.get(e.topicId)?.name ?? e.topicId;
    const status: UebernahmeStatus = !t ? 'kein_thema' : heuteSchon.has(e.topicId) ? 'heute_schon' : 'gespeichert';
    return { ...e, name, status };
  });
}

/** Speichert Trainer-Ergebnisse als Abfragen im Lernplan und sagt, was mit jedem Thema passiert ist. */
export async function inLernplan(trainer: TrainerId, ergebnisse: ThemenErgebnis[], topics: Topic[] = pflegeModule.topics, date = heute()): Promise<Uebernahme[]> {
  if (!ergebnisse.length) return [];
  const ids = ergebnisse.map((e) => e.topicId);
  const vorhanden = await db.reviewLogs.where('topicId').anyOf(ids).filter((l) => l.date === date && l.trainer === trainer).toArray();
  const plan = planeUebernahme(ergebnisse, topics, new Set(vorhanden.map((l) => l.topicId)));
  const byId = new Map(topics.map((t) => [t.id, t]));
  for (const u of plan) {
    if (u.status !== 'gespeichert') continue;
    await logReview(byId.get(u.topicId)!, 'trainer', { scorePercent: u.scorePercent }, date, trainer);
  }
  return plan;
}
