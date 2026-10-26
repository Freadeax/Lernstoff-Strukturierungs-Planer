import { db } from './db';
import type { Document, SourceChunk, Topic } from './types';
import { modules, getModule } from '../modules/registry';

export const normalisiereThema = (s: string) => s.normalize('NFKC').toLocaleLowerCase('de').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

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
  const text = ` ${normalisiereThema(chunks.map((c) => c.text).join(' '))} `;
  const kapitel = [...new Set(chunks.map((c) => c.chapter).filter((s): s is string => !!s))];
  const topicIds = passend.filter((t) => {
    const name = normalisiereThema(t.name);
    return name.length >= 4 && text.includes(` ${name} `);
  }).map((t) => t.id);
  const topicSuggestions: NonNullable<Document['topicSuggestions']> = [];
  const bekannt = new Set(passend.map((t) => normalisiereThema(t.name)));
  for (const pfad of kapitel) {
    const teile = pfad.split(' > ').map((s) => s.trim());
    const name = teile.at(-1)!;
    const norm = normalisiereThema(name);
    if (norm.length < 4 || name.length > 140 || bekannt.has(norm)) continue;
    const parent = passend.find((t) => teile.slice(0, -1).some((s) => normalisiereThema(s) === normalisiereThema(t.name)));
    topicSuggestions.push({ name, parentId: parent?.id, subjectId: parent?.subjectId ?? document.subjectIds[0]! });
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
    const topics = [...modules.flatMap((m) => m.topics), ...await db.topics.toArray()];
    const vorhanden = topics.find((t) => t.subjectId === vorschlag.subjectId && normalisiereThema(t.name) === normalisiereThema(vorschlag.name));
    const id = vorhanden?.id ?? `thema.eigen.${crypto.randomUUID()}`;
    if (!vorhanden) await db.topics.add({ ...vorschlag, id, prerequisites: [] });
    await db.documents.update(documentId, {
      topicIds: [...new Set([...document.topicIds, id])],
      topicSuggestions: document.topicSuggestions?.filter((s) => normalisiereThema(s.name) !== normalisiereThema(vorschlag.name)),
    });
  });
}
