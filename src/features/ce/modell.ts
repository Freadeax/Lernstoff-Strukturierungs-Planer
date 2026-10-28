// Curriculare Einheiten (CE 01–11): welche Themen zu einer CE gehören und was es dazu gibt.
// Reine Funktionen ohne Datenbank, damit die Zuordnung testbar bleibt.
//
// Zwei Quellen für die Zuordnung, beide sichtbar gemacht:
// - Katalog: ce.* in competencyIds am Thema selbst oder an einem Oberthema (dann gilt sie für alle Unterthemen).
// - Skript: die themen:-Angabe eines Skripts der Gruppe „CE 09“ zeigt, was die eigene Schule in der CE behandelt.
// Die Katalog-Zuordnung ist eine fachliche Einschätzung, keine Vorgabe der Rahmenpläne.

import type { ID } from '../../core/types';
import type { CatalogModule, CatalogTopic, DiseaseProfile } from '../../modules/catalog-types';
import type { Szenario } from '../fall/faelle';
import type { Skript } from '../skript/typen';

export interface CeTeil { id: ID; code: string; name: string }
export interface Ce extends CeTeil { teile: CeTeil[] }

export type Herkunft = 'katalog' | 'oberthema' | 'skript';

export const HERKUNFT_LABEL: Record<Herkunft, string> = {
  katalog: 'Katalog',
  oberthema: 'Katalog (Oberthema)',
  skript: 'Skript',
};

export interface CeThema {
  topic: CatalogTopic;
  herkunft: Herkunft[];
  /** Teil-CE (z. B. „CE 02A“), wenn die Katalog-Zuordnung auf einen Teil zeigt. */
  teil?: string;
  /** IDs der Skripte dieser CE, die das Thema behandeln. */
  skriptIds: ID[];
}

export type SkriptKopf = Pick<Skript, 'id' | 'gruppe' | 'titel' | 'topicIds'>;

/** CE-Liste aus dem Curriculum-Rahmen des Moduls; Teil-CEs (02A, 02B) hängen an ihrer CE. */
export function ceListe(modul: CatalogModule): Ce[] {
  const items = modul.frameworks?.find((f) => f.kind === 'curriculum')?.items ?? [];
  return items.filter((i) => !i.parentId).map((i) => ({
    id: i.id, code: i.code, name: i.name,
    teile: items.filter((t) => t.parentId === i.id).map(({ id, code, name }) => ({ id, code, name })),
  }));
}

/** Skript-Gruppe „CE 09“ oder „CE 02A“ → ID der CE (ce.09 bzw. ce.02). Andere Gruppen (LEB 5) gehören zu keiner CE. */
export function gruppeZuCe(gruppe: string, liste: Ce[]): ID | undefined {
  const m = gruppe.trim().match(/^CE\s*0?(\d{1,2})\s*([A-Z])?$/i);
  if (!m) return undefined;
  const code = `CE ${m[1]!.padStart(2, '0')}`;
  return liste.find((c) => c.code === code)?.id;
}

export function skripteZuCe<S extends SkriptKopf>(skripte: S[], ceId: ID, liste: Ce[]): S[] {
  return skripte.filter((s) => gruppeZuCe(s.gruppe, liste) === ceId);
}

function kinderIndex(modul: CatalogModule) {
  const kinder = new Map<ID, CatalogTopic[]>();
  for (const t of modul.topics) if (t.parentId) kinder.set(t.parentId, [...(kinder.get(t.parentId) ?? []), t]);
  return kinder;
}

function blaetterUnter(t: CatalogTopic, kinder: Map<ID, CatalogTopic[]>): CatalogTopic[] {
  const k = kinder.get(t.id);
  return k?.length ? k.flatMap((c) => blaetterUnter(c, kinder)) : [t];
}

/**
 * Alle lernbaren Themen (Blätter des Themenbaums) einer CE, sortiert nach Fach und Katalogreihenfolge.
 * Ein Thema kann aus mehreren Quellen kommen; die Herkunft steht in der Reihenfolge Katalog, Oberthema, Skript.
 */
export function ceThemen(modul: CatalogModule, ce: Ce, skripte: SkriptKopf[] = [], liste: Ce[] = ceListe(modul)): CeThema[] {
  const ids = new Map<ID, string | undefined>([[ce.id, undefined], ...ce.teile.map((t) => [t.id, t.code] as [ID, string])]);
  const byId = new Map(modul.topics.map((t) => [t.id, t]));
  const kinder = kinderIndex(modul);
  const treffer = new Map<ID, CeThema>();
  const merke = (t: CatalogTopic, h: Herkunft, teil?: string, skriptId?: ID) => {
    const e = treffer.get(t.id) ?? { topic: t, herkunft: [], skriptIds: [] };
    if (!e.herkunft.includes(h)) e.herkunft.push(h);
    if (teil && !e.teil) e.teil = teil;
    if (skriptId && !e.skriptIds.includes(skriptId)) e.skriptIds.push(skriptId);
    treffer.set(t.id, e);
  };

  for (const t of modul.topics) {
    const direkt = (t.competencyIds ?? []).filter((c) => ids.has(c));
    if (!direkt.length) continue;
    const teil = direkt.map((c) => ids.get(c)).find(Boolean);
    for (const b of blaetterUnter(t, kinder)) merke(b, b.id === t.id ? 'katalog' : 'oberthema', teil);
  }
  for (const s of skripteZuCe(skripte, ce.id, liste)) {
    for (const id of s.topicIds) {
      const t = byId.get(id);
      if (t) for (const b of blaetterUnter(t, kinder)) merke(b, 'skript', undefined, s.id);
    }
  }

  const rang = new Map(modul.topics.map((t, i) => [t.id, i]));
  const fachRang = new Map(modul.subjects.map((s, i) => [s.id, i]));
  const ordnung: Herkunft[] = ['katalog', 'oberthema', 'skript'];
  return [...treffer.values()]
    .map((e) => ({ ...e, herkunft: ordnung.filter((h) => e.herkunft.includes(h)) }))
    .sort((a, b) => (fachRang.get(a.topic.subjectId) ?? 99) - (fachRang.get(b.topic.subjectId) ?? 99)
      || (rang.get(a.topic.id) ?? 0) - (rang.get(b.topic.id) ?? 0));
}

/** Themen einer CE nach Fach gruppiert, in der Reihenfolge der Fächer im Modul. */
export function nachFach(themen: CeThema[], modul: CatalogModule): Array<{ fachId: ID; fach: string; themen: CeThema[] }> {
  const gruppen = new Map<ID, CeThema[]>();
  for (const t of themen) gruppen.set(t.topic.subjectId, [...(gruppen.get(t.topic.subjectId) ?? []), t]);
  const namen = new Map(modul.subjects.map((s) => [s.id, s.name]));
  return [...gruppen].map(([fachId, th]) => ({ fachId, fach: namen.get(fachId) ?? fachId, themen: th }));
}

/** Krankheitsbild-Steckbriefe zu einem Thema (auch über eine dort genannte Prophylaxe). */
export function steckbriefeZuThema(topicId: ID, profile: DiseaseProfile[]): DiseaseProfile[] {
  return profile.filter((p) => p.topicIds.includes(topicId) || (p.prophylaxen ?? []).some((x) => x.topicId === topicId));
}

export function szenarienZuThema(topicId: ID, szenarien: Szenario[]): Szenario[] {
  return szenarien.filter((s) => s.topicIds.includes(topicId));
}

/** Anzahl Karteikarten je Thema; eine Karte mit mehreren Themen zählt bei jedem. */
export function kartenProThema(karten: Array<{ topicIds: ID[] }>): Map<ID, number> {
  const n = new Map<ID, number>();
  for (const k of karten) for (const id of new Set(k.topicIds)) n.set(id, (n.get(id) ?? 0) + 1);
  return n;
}
