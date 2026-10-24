import type { ID, Summary } from '../../../core/types';
import { pflegeModule } from '../../../modules/pflege';
import { leafTopics } from '../../lernplan/store';
import type { KartenDaten } from '../store';

export interface KartenCtx {
  daten: KartenDaten;
  heute: string;
  summaries: Summary[];
  titles: Map<ID, string>;
  neuLaden: () => Promise<void>;
}

export const modul = pflegeModule;
export const alleThemen = new Map(modul.topics.map((t) => [t.id, t]));
/** Nur Themen ohne Unterthemen bekommen Ergebnisse im Lernplan. */
export const blaetter = new Map(leafTopics(modul.topics).map((t) => [t.id, t]));
export const fachVon = (ids: ID[]) => [...new Set(ids.map((t) => alleThemen.get(t)?.subjectId).filter((x): x is ID => !!x))];
