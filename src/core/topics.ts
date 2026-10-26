import { db } from './db';
import type { Document, SourceChunk, Topic } from './types';
import { modules, getModule } from '../modules/registry';

export const normalisiereThema = (s: string) => s.normalize('NFKC').toLocaleLowerCase('de').replace(/^(?:kapitel\s+)?\d+(?:\.\d+)*[.:\s]+/u, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

/** Katalog und bestätigte eigene Themen teilen stabile IDs mit Board und Lernplan. */
export async function ladeThemen(moduleId?: string): Promise<Topic[]> {
  const katalog = moduleId ? getModule(moduleId)?.topics ?? [] : modules.flatMap((m) => m.topics);
  const faecher = new Set((moduleId ? getModule(moduleId)?.subjects ?? [] : modules.flatMap((m) => m.subjects)).map((s) => s.id));
  const eigene = (await db.topics.toArray()).filter((t) => faecher.has(t.subjectId));
  return [...new Map([...eigene, ...katalog].map((t) => [t.id, t])).values()];
}

/** Nachvollziehbarer lokaler Abgleich: ganze Themennamen im Text, neue Themen nur aus Kapitelüberschriften. */
export function ordneThemen(document: Document, chunks: SourceChunk[], topics: Topic[]) {
  const passend = topics.filter((t) => document.subjectIds.includes(t.subjectId));
  const text = ` ${normalisiereThema([document.title, ...chunks.map((c) => `${c.chapter ?? ''} ${c.text}`)].join(' '))} `;
  const kapitel = [...new Set(chunks.map((c) => c.chapter).filter((s): s is string => !!s))];
  const topicIds = passend.filter((t) => {
    const name = normalisiereThema(t.name);
    const tags = (t as Topic & { tags?: string[] }).tags ?? [];
    const signals = [name, normalisiereThema(t.name.replace(/\([^)]*\)/g, '')), ...tags.map(normalisiereThema)];
    return !document.excludedTopicIds?.includes(t.id) && signals.some((s) => s.length >= 4 && text.includes(` ${s} `));
  }).map((t) => t.id);
  const topicSuggestions: NonNullable<Document['topicSuggestions']> = [];
  const bekannt = new Set([...passend.map((t) => normalisiereThema(t.name)), ...document.ignoredTopicNames ?? []]);
  const pfade = kapitel.length ? kapitel : topicIds.length ? [] : [document.title];
  for (const pfad of pfade) {
    const teile = pfad.split(' > ').map((s) => s.trim());
    const name = teile.at(-1)!;
    const norm = normalisiereThema(name);
    if (norm.length < 4 || name.length > 140 || bekannt.has(norm)) continue;
    let parent = passend.find((t) => !t.parentId);
    let start = 0;
    for (let i = 0; i < teile.length - 1; i++) {
      const treffer = passend.find((t) => normalisiereThema(teile[i]!) === normalisiereThema(t.name));
      if (treffer) { parent = treffer; start = i + 1; }
    }
    const parentNames = teile.slice(start, -1).filter((s) => normalisiereThema(s).length >= 4 && s.length <= 140);
    topicSuggestions.push({ name, parentId: parent?.id, ...(parentNames.length ? { parentNames } : {}), subjectId: parent?.subjectId ?? document.subjectIds[0]! });
    bekannt.add(norm);
  }
  return { topicIds: [...new Set([...document.topicIds, ...topicIds])], topicSuggestions };
}

export async function gleicheThemenAb(documentId: string) {
  const topics = await ladeThemen();
  await db.transaction('rw', [db.documents, db.chunks], async () => {
    const document = await db.documents.get(documentId);
    if (!document) return;
    const chunks = await db.chunks.where('documentId').equals(documentId).toArray();
    await db.documents.update(documentId, ordneThemen(document, chunks, topics));
  });
}

export async function bestaetigeThema(documentId: string, vorschlag: NonNullable<Document['topicSuggestions']>[number]) {
  await db.transaction('rw', [db.topics, db.documents], async () => {
    const document = await db.documents.get(documentId);
    if (!document) return;
    if (!document.subjectIds.includes(vorschlag.subjectId) || vorschlag.name.trim().length < 4 || vorschlag.name.length > 140) throw new Error('Bitte Fach und Themenname prüfen.');
    const topics = [...modules.flatMap((m) => m.topics), ...await db.topics.toArray()];
    if (vorschlag.parentId && !topics.some((t) => t.id === vorschlag.parentId && t.subjectId === vorschlag.subjectId)) throw new Error('Das Oberthema gehört nicht zum gewählten Fach.');
    let parentId = vorschlag.parentId;
    for (const name of vorschlag.parentNames ?? []) {
      if (name.trim().length < 4 || name.length > 140) throw new Error('Bitte die Kapitelstruktur prüfen.');
      let parent = topics.find((t) => t.subjectId === vorschlag.subjectId && t.parentId === parentId && normalisiereThema(t.name) === normalisiereThema(name));
      if (!parent) {
        parent = { id: `thema.eigen.${crypto.randomUUID()}`, name, subjectId: vorschlag.subjectId, parentId, prerequisites: [] };
        await db.topics.add(parent); topics.push(parent);
      }
      parentId = parent.id;
    }
    const vorhanden = topics.find((t) => t.subjectId === vorschlag.subjectId && t.parentId === parentId && normalisiereThema(t.name) === normalisiereThema(vorschlag.name));
    const id = vorhanden?.id ?? `thema.eigen.${crypto.randomUUID()}`;
    if (!vorhanden) await db.topics.add({ name: vorschlag.name, subjectId: vorschlag.subjectId, parentId, id, prerequisites: [] });
    await db.documents.update(documentId, {
      topicIds: [...new Set([...document.topicIds, id])],
      topicSuggestions: document.topicSuggestions?.filter((s) => normalisiereThema(s.name) !== normalisiereThema(vorschlag.name)),
    });
  });
}
