// Lernziel-Abdeckung (Curriculum-Mapping): Hat jedes Thema des Katalogs genug Fragen, und zwar auf
// allen Stufen (Grundlagen, Anwenden, Transfer)? Vorbild ist der Prüfungs-Blueprint: Themen × Stufen,
// jede Zelle soll belegt sein. Gezählt werden die Aufgaben der Übungstrainer (echte Abfragen mit
// Lösung); weitere Übungen (Fälle, Duell, Schreibtrainer) werden daneben genannt, weil auch sie den
// Lernstand belegen, aber keine einzelnen Fragen haben. Rein und testbar.

import type { CatalogModule, CatalogTopic } from '../../modules/catalog-types';
import type { Aufgabe, Stufe } from '../quiz/quiz';
import { stufeVon } from '../quiz/quiz';
import { leafTopics } from '../lernplan/store';
import { uebungenFuer, type Uebung } from '../lernplan/trainer';
import { ceListe, ceThemen } from '../ce/modell';

export interface Pool { quelle: string; name: string; pfad: string; aufgaben: readonly Aufgabe[] }

/** Ab so vielen Aufgaben je Thema zählt eine Trainer-Runde im Lernplan (siehe TrainerSeite, minProThema). */
export const MIN_AUFGABEN = 3;

export type Luecke = 'keine' | 'nur-uebungen' | 'duenn' | 'ohne-transfer' | 'ohne-grundlagen' | 'gut';
export const LUECKE_LABEL: Record<Luecke, string> = {
  keine: 'Keine Abfrage',
  'nur-uebungen': 'Keine Fragen, nur andere Übungen',
  duenn: `Weniger als ${MIN_AUFGABEN} Fragen`,
  'ohne-transfer': 'Keine Transferaufgabe',
  'ohne-grundlagen': 'Keine Grundlagenfrage',
  gut: 'Abgedeckt',
};
/** Reihenfolge nach Dringlichkeit (für Sortierung und Filter). */
export const LUECKE_RANG: Record<Luecke, number> = { keine: 0, 'nur-uebungen': 1, duenn: 2, 'ohne-transfer': 3, 'ohne-grundlagen': 4, gut: 5 };

export interface ThemaAbdeckung {
  topicId: string;
  name: string;
  fachId?: string;
  ceIds: string[];
  aufgaben: number;
  stufen: Record<Stufe, number>;
  /** Je Trainer: Zahl der Aufgaben und Startpfad (Bereich passend zum Thema). */
  trainer: Array<{ quelle: string; name: string; n: number; pfad: string }>;
  /** Weitere Übungen ohne Einzelfragen (Fälle, Duell, Schreibtrainer, Praxis). */
  weitere: Uebung[];
  luecke: Luecke;
}

/** Trainer, deren Fragen als Pool gezählt werden: die tauchen bei „weitere“ nicht noch einmal auf. */
const ALLGEMEIN = new Set(['mindmap']);

export function klassifiziere(aufgaben: number, stufen: Record<Stufe, number>, weitere: number): Luecke {
  if (!aufgaben) return weitere ? 'nur-uebungen' : 'keine';
  if (aufgaben < MIN_AUFGABEN) return 'duenn';
  if (!stufen[3]) return 'ohne-transfer';
  if (!stufen[1]) return 'ohne-grundlagen';
  return 'gut';
}

/** Hängt den Stufenfilter an einen Trainerpfad (TrainerSeite liest ?stufe=). */
export function mitStufe(pfad: string, stufe: Stufe): string {
  return `${pfad}${pfad.includes('?') ? '&' : '?'}stufe=${stufe}`;
}

export function abdeckung(modul: CatalogModule, pools: readonly Pool[]): ThemaAbdeckung[] {
  const blaetter = leafTopics(modul.topics) as CatalogTopic[];
  const ceJeThema = new Map<string, string[]>();
  for (const ce of ceListe(modul)) for (const t of ceThemen(modul, ce)) ceJeThema.set(t.topic.id, [...(ceJeThema.get(t.topic.id) ?? []), ce.id]);
  const poolIds = new Set(pools.map((p) => p.quelle));
  // Index Thema → Aufgaben je Pool
  const jeThema = new Map<string, Map<string, Aufgabe[]>>();
  for (const p of pools) for (const a of p.aufgaben) for (const t of new Set(a.topicIds)) {
    const m = jeThema.get(t) ?? new Map<string, Aufgabe[]>();
    m.set(p.quelle, [...(m.get(p.quelle) ?? []), a]);
    jeThema.set(t, m);
  }
  return blaetter.map((t) => {
    const ueb = uebungenFuer(t.id, modul);
    const m = jeThema.get(t.id) ?? new Map<string, Aufgabe[]>();
    const alle = [...m.values()].flat();
    const stufen: Record<Stufe, number> = { 1: 0, 2: 0, 3: 0 };
    for (const a of alle) stufen[stufeVon(a)]++;
    const trainer = pools.filter((p) => m.has(p.quelle)).map((p) => ({
      quelle: p.quelle, name: p.name, n: m.get(p.quelle)!.length,
      pfad: ueb.find((u) => u.trainer === p.quelle && !u.path.includes('modus=werkbank'))?.path ?? p.pfad,
    }));
    const weitere = ueb.filter((u) => !ALLGEMEIN.has(u.trainer) && !poolIds.has(u.trainer));
    return {
      topicId: t.id, name: t.name, fachId: t.subjectId, ceIds: ceJeThema.get(t.id) ?? [],
      aufgaben: alle.length, stufen, trainer, weitere, luecke: klassifiziere(alle.length, stufen, weitere.length),
    };
  });
}

export interface Summe { themen: number; mitFragen: number; jeLuecke: Record<Luecke, number>; aufgaben: number; stufen: Record<Stufe, number> }

export function summiere(liste: readonly ThemaAbdeckung[]): Summe {
  const jeLuecke = Object.fromEntries(Object.keys(LUECKE_LABEL).map((k) => [k, 0])) as Record<Luecke, number>;
  const stufen: Record<Stufe, number> = { 1: 0, 2: 0, 3: 0 };
  let aufgaben = 0;
  for (const t of liste) {
    jeLuecke[t.luecke]++;
    aufgaben += t.aufgaben;
    for (const s of [1, 2, 3] as const) stufen[s] += t.stufen[s];
  }
  return { themen: liste.length, mitFragen: liste.filter((t) => t.aufgaben > 0).length, jeLuecke, aufgaben, stufen };
}

/** Aufgaben, die an einem Oberthema statt an einem Blatt hängen (zählen für kein einzelnes Thema). */
export function aufgabenAnOberthemen(modul: CatalogModule, pools: readonly Pool[]): Array<{ quelle: string; aufgabeId: string; topicId: string }> {
  const blatt = new Set(leafTopics(modul.topics).map((t) => t.id));
  const bekannt = new Set(modul.topics.map((t) => t.id));
  return pools.flatMap((p) => p.aufgaben.flatMap((a) => a.topicIds.filter((t) => bekannt.has(t) && !blatt.has(t)).map((topicId) => ({ quelle: p.quelle, aufgabeId: a.id, topicId }))));
}
