// Mikro-Einheit: ein Thema in etwa fünf Minuten. Kurz erklärt (Fachbegriffe aus dem Glossar, Krankheitsbild),
// drei Fragen aus einem passenden Übungstrainer, eine Karte zum Mitnehmen.
// Themen-Netz: Welche Themen hängen über ein Krankheitsbild oder als Voraussetzung mit diesem Thema zusammen?
// Alles hier ist rein und testbar; Laden der Aufgaben und Oberfläche liegen in MikroSeite.tsx.

import type { CatalogGlossaryEntry, CatalogModule, CatalogTopic } from '../../modules/catalog-types';
import type { FehlerQuelle } from '../fehlerheft/fehlerheft';
import type { TrainerId } from '../lernplan/trainer';
import { mische, stufeVon, type Aufgabe } from '../quiz/quiz';

/** Übungstrainer, deren Aufgaben in die Mikro-Einheit dürfen: Quelle im Fehlerheft und Trainer im Lernplan sind gleich. */
export type MikroQuelle = FehlerQuelle & TrainerId;

export interface Pool { quelle: MikroQuelle; aufgaben: readonly Aufgabe[] }

export const FRAGEN = 3;
export const BEGRIFFE = 3;

/** Kurze Aufgabenarten: Abbildungen brauchen Zeichnungen, Fälle mehrere Schritte. Beides sprengt fünf Minuten. */
export const kurz = (a: Aufgabe) => a.art === 'auswahl' || a.art === 'reihenfolge' || a.art === 'zuordnen';

/** Wie viele kurze Fragen je Trainer zu diesem Thema vorliegen. */
export function fragenJeTrainer(pools: readonly Pool[], topicId: string): Array<{ quelle: MikroQuelle; anzahl: number }> {
  return pools
    .map((p) => ({ quelle: p.quelle, anzahl: p.aufgaben.filter((a) => kurz(a) && a.topicIds.includes(topicId)).length }))
    .filter((x) => x.anzahl > 0)
    .sort((a, b) => b.anzahl - a.anzahl);
}

/**
 * Drei Fragen aus einem Trainer: Eine Quelle hält Fehlerheft, Statistik und Lernplan eindeutig.
 * Gewählt wird der Trainer mit den meisten Fragen zum Thema, bei Gleichstand der erste in der Liste.
 * Reihenfolge: Grundlagen vor Anwenden vor Transfer, damit die Einheit leicht beginnt.
 */
export function waehleFragen(pools: readonly Pool[], topicId: string, zufall: () => number = Math.random, anzahl = FRAGEN): { quelle: MikroQuelle; aufgaben: Aufgabe[] } | null {
  const best = fragenJeTrainer(pools, topicId)[0];
  if (!best || best.anzahl < anzahl) return null;
  const pool = pools.find((p) => p.quelle === best.quelle)!;
  const passend = pool.aufgaben.filter((a) => kurz(a) && a.topicIds.includes(topicId));
  const auswahl = mische(passend, zufall).slice(0, anzahl);
  return { quelle: best.quelle, aufgaben: auswahl.sort((a, b) => stufeVon(a) - stufeVon(b)) };
}

export interface KurzWissen {
  begriffe: Array<{ term: string; definition: string }>;
  krankheitsbilder: Array<{ id: string; name: string; definition: string; merksatz?: string }>;
}

/**
 * Kurz erklärt: bis zu drei Fachbegriffe zum Thema (kürzeste Definitionen zuerst, sie passen in fünf Minuten)
 * und die Krankheitsbilder, die dem Thema zugeordnet sind.
 */
export function kurzWissen(modul: Pick<CatalogModule, 'glossary'> & Partial<Pick<CatalogModule, 'diseaseProfiles'>>, topicId: string, anzahl = BEGRIFFE): KurzWissen {
  const begriffe = (modul.glossary as CatalogGlossaryEntry[])
    .filter((g) => g.topicIds?.includes(topicId) && g.definition)
    .sort((a, b) => a.definition.length - b.definition.length || a.term.localeCompare(b.term, 'de'))
    .slice(0, anzahl)
    .map((g) => ({ term: g.term, definition: g.definition }));
  const krankheitsbilder = (modul.diseaseProfiles ?? [])
    .filter((p) => p.topicIds.includes(topicId))
    .map((p) => ({ id: p.id, name: p.name, definition: p.definition, merksatz: p.merksatz }));
  return { begriffe, krankheitsbilder };
}

/** Karte zum Mitnehmen: ein Fachbegriff, der nicht schon unter „Kurz erklärt“ stand. Wechselt mit dem Tag. */
export function karteZumThema(modul: Pick<CatalogModule, 'glossary'>, topicId: string, schonGezeigt: readonly string[], tag: string): { term: string; definition: string } | null {
  const alle = (modul.glossary as CatalogGlossaryEntry[]).filter((g) => g.topicIds?.includes(topicId) && g.definition);
  const rest = alle.filter((g) => !schonGezeigt.includes(g.term));
  const liste = rest.length ? rest : alle;
  if (!liste.length) return null;
  let h = 0;
  for (const c of tag) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const g = liste[h % liste.length]!;
  return { term: g.term, definition: g.definition };
}

export type NetzGrund = { art: 'krankheitsbild'; id: string; name: string } | { art: 'voraussetzung' } | { art: 'baut-auf' };

export interface NetzKnoten { topic: CatalogTopic; gruende: NetzGrund[] }

/**
 * Themen-Netz: Nachbarn eines Themas.
 * - Krankheitsbild: Das Krankheitsbild ist beiden Themen zugeordnet (z. B. Herzinsuffizienz verbindet Herz-Kreislauf und Ernährung).
 * - Voraussetzung: Dieses Thema setzt das andere voraus. Baut auf: Das andere setzt dieses voraus.
 * Sortiert nach Zahl der Verbindungen, dann nach Name.
 */
export function themenNetz(modul: Pick<CatalogModule, 'topics'> & Partial<Pick<CatalogModule, 'diseaseProfiles'>>, topicId: string): NetzKnoten[] {
  const topics = modul.topics as CatalogTopic[];
  const eigenes = topics.find((t) => t.id === topicId);
  const netz = new Map<string, NetzGrund[]>();
  const add = (id: string, g: NetzGrund) => {
    if (id === topicId || !topics.some((t) => t.id === id)) return;
    const liste = netz.get(id) ?? [];
    if (!liste.some((x) => x.art === g.art && (x.art !== 'krankheitsbild' || (g.art === 'krankheitsbild' && x.id === g.id)))) liste.push(g);
    netz.set(id, liste);
  };
  for (const p of modul.diseaseProfiles ?? []) {
    if (!p.topicIds.includes(topicId)) continue;
    for (const t of p.topicIds) add(t, { art: 'krankheitsbild', id: p.id, name: p.name });
  }
  for (const v of eigenes?.prerequisites ?? []) add(v, { art: 'voraussetzung' });
  for (const t of topics) if (t.prerequisites?.includes(topicId)) add(t.id, { art: 'baut-auf' });
  return [...netz.entries()]
    .map(([id, gruende]) => ({ topic: topics.find((t) => t.id === id)!, gruende }))
    .sort((a, b) => b.gruende.length - a.gruende.length || a.topic.name.localeCompare(b.topic.name, 'de'));
}

export function grundText(g: NetzGrund): string {
  if (g.art === 'krankheitsbild') return g.name;
  return g.art === 'voraussetzung' ? 'Voraussetzung' : 'baut darauf auf';
}

/** Alle Aufgaben der Übungstrainer, nur bei Bedarf geladen (eigene Pakete, nicht im Startpaket). */
export async function ladePools(): Promise<Pool[]> {
  const flach = (r: Record<string, Aufgabe[]>) => Object.values(r).flat();
  const [hygiene, anatomie, expertenstandards, normwerte, notfall, arzneimittel, recht, labor, grundlagen] = await Promise.all([
    import('../hygiene/aufgaben'), import('../anatomie/aufgaben'), import('../expertenstandards/aufgaben'), import('../normwerte/aufgaben'),
    import('../notfall/aufgaben'), import('../arzneimittel/aufgaben'), import('../recht/aufgaben'), import('../labortrainer/aufgaben'), import('../grundlagen/aufgaben'),
  ]);
  return [
    { quelle: 'hygiene', aufgaben: flach(hygiene.AUFGABEN) },
    { quelle: 'anatomie', aufgaben: flach(anatomie.AUFGABEN) },
    { quelle: 'expertenstandards', aufgaben: flach(expertenstandards.AUFGABEN) },
    { quelle: 'normwerte', aufgaben: flach(normwerte.AUFGABEN) },
    { quelle: 'notfall', aufgaben: flach(notfall.AUFGABEN) },
    { quelle: 'arzneimittel', aufgaben: flach(arzneimittel.AUFGABEN) },
    { quelle: 'recht', aufgaben: flach(recht.AUFGABEN) },
    { quelle: 'labor', aufgaben: flach(labor.AUFGABEN) },
    { quelle: 'grundlagen', aufgaben: flach(grundlagen.AUFGABEN) },
  ];
}
