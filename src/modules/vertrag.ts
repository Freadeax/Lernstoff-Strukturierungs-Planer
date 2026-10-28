import type { DomainModule } from '../core/types';
import type { CatalogModule } from './catalog-types';

/**
 * Fachneutrale Mindestprüfung für jedes Fachmodul (Pflege und jedes künftige Fachgebiet).
 * Liefert verständliche Fehlertexte, leer heißt in Ordnung. registry.test.ts prüft damit
 * alle eingetragenen Module; die ausführliche Prüfung beim Bauen macht scripts/build-module.py.
 */
export function pruefeModul(modul: DomainModule): string[] {
  const m = modul as CatalogModule;
  const fehler: string[] = [];
  if (!/^[a-z0-9-]+$/.test(m.id)) fehler.push(`Modul-ID „${m.id}“: nur Kleinbuchstaben, Ziffern und Bindestrich`);
  if (!m.name?.trim()) fehler.push('Modul ohne Namen');
  if (!m.subjects.length) fehler.push('Modul ohne Fächer');
  if (!m.topics.length) fehler.push('Modul ohne Themen');

  const doppelt = (art: string, ids: string[]) => {
    const gesehen = new Set<string>();
    for (const id of ids) {
      if (gesehen.has(id)) fehler.push(`${art}: ID doppelt: ${id}`);
      gesehen.add(id);
    }
    return gesehen;
  };
  const faecher = doppelt('Fach', m.subjects.map((s) => s.id));
  const themen = doppelt('Thema', m.topics.map((t) => t.id));
  const formate = doppelt('Aufgabenformat', m.taskFormats.map((f) => f.id));
  const referenzen = new Set((m.references ?? []).map((r) => r.id));
  const kompetenzen = new Set((m.frameworks ?? []).flatMap((f) => f.items.map((i) => i.id)));

  for (const s of m.subjects) {
    if (s.moduleId && s.moduleId !== m.id) fehler.push(`Fach ${s.id}: gehört zu Modul ${s.moduleId}, nicht ${m.id}`);
  }
  const pruefe = (wer: string, ids: string[] | undefined, menge: Set<string>, art: string) => {
    for (const id of ids ?? []) if (!menge.has(id)) fehler.push(`${wer}: unbekannte(s) ${art} ${id}`);
  };
  for (const t of m.topics) {
    if (!t.name?.trim()) fehler.push(`Thema ${t.id}: ohne Namen`);
    pruefe(t.id, [t.subjectId], faecher, 'Fach');
    pruefe(t.id, t.parentId ? [t.parentId] : [], themen, 'Oberthema');
    pruefe(t.id, t.prerequisites, themen, 'Voraussetzung');
    pruefe(t.id, t.competencyIds, kompetenzen, 'Kompetenz');
    pruefe(t.id, t.referenceIds, referenzen, 'Referenz');
    pruefe(t.id, t.taskFormatIds, formate, 'Aufgabenformat');
  }
  for (const g of m.glossary) pruefe(`Glossar „${g.term}“`, g.topicIds, themen, 'Thema');

  // Zyklen im Themenbaum oder in den Voraussetzungen blockieren Lernplan und Landkarte.
  const kanten = new Map(m.topics.map((t) => [t.id, [...t.prerequisites, ...(t.parentId ? [t.parentId] : [])]]));
  const zustand = new Map<string, 'aktiv' | 'fertig'>();
  const besuche = (id: string, pfad: string[]) => {
    if (zustand.get(id) === 'fertig') return;
    if (zustand.get(id) === 'aktiv') { fehler.push(`Zyklus: ${[...pfad, id].join(' → ')}`); return; }
    zustand.set(id, 'aktiv');
    for (const n of kanten.get(id) ?? []) besuche(n, [...pfad, id]);
    zustand.set(id, 'fertig');
  };
  for (const id of kanten.keys()) besuche(id, []);
  return fehler;
}
