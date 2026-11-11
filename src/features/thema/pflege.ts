// Themenpflege: falsche Zuordnungen lösen oder umhängen, eigene Themen umbenennen, löschen, zusammenführen.
// Grundsatz: IDs bleiben stabil. Umbenennen ändert nur den Namen, alle Verweise bleiben gültig.
// Zusammenführen hängt jeden Verweis (Quellen, Prüfungen, Karten, Lernverlauf, Board, Fehlerheft) auf das Zielthema um
// und verliert dabei nichts. Löschen entfernt Verweise und, nur wenn ausdrücklich gewählt, den Lernverlauf.
// Katalogthemen sind fest: Sie lassen sich nicht umbenennen oder löschen, nur als Ziel einer Zusammenführung wählen.

import { logActivity } from '../../core/activity';
import { db } from '../../core/db';
import { normalisiereThema } from '../../core/topics';
import type { ID, Topic } from '../../core/types';
import { modules } from '../../modules/registry';
import { ladeFehler, speichereFehler } from '../fehlerheft/fehlerheft';

export const istEigenesThema = (id: ID) => id.startsWith('thema.eigen.');

export interface Bezuege {
  dokumente: number;
  zusammenfassungen: number;
  skripte: number;
  pruefungen: number;
  karten: number;
  abfragen: number;
  lernzeiten: number;
  board: boolean;
  unterthemen: number;
  fehler: number;
}

export const hatVerlauf = (b: Bezuege) => b.abfragen > 0 || b.lernzeiten > 0 || b.board;

const RANG = { pool: 0, woche: 1, arbeit: 2, erarbeitet: 3 } as const;

async function alleThemen(): Promise<Topic[]> {
  return [...modules.flatMap((m) => m.topics), ...await db.topics.toArray()];
}

/** Wo ein Thema überall vorkommt; Grundlage für die Rückfrage vor Löschen oder Zusammenführen. */
export async function bezuegeVon(topicId: ID): Promise<Bezuege> {
  const [dokumente, zusammenfassungen, skripte, exams, karten, abfragen, lernzeiten, board, eigene] = await Promise.all([
    db.documents.where('topicIds').equals(topicId).count(),
    db.summaries.where('topicIds').equals(topicId).count(),
    db.skripte.where('topicIds').equals(topicId).count(),
    db.exams.toArray(),
    db.karten.where('topicIds').equals(topicId).count(),
    db.reviewLogs.where('topicId').equals(topicId).count(),
    db.studyLogs.where('topicId').equals(topicId).count(),
    db.board.get(topicId),
    alleThemen(),
  ]);
  return {
    dokumente, zusammenfassungen, skripte, karten, abfragen, lernzeiten, board: !!board,
    pruefungen: exams.filter((e) => e.topicIds.includes(topicId)).length,
    unterthemen: eigene.filter((t) => t.parentId === topicId).length,
    fehler: ladeFehler().filter((f) => f.topicIds.includes(topicId)).length,
  };
}

export function bezuegeText(b: Bezuege): string {
  const z = (n: number, eins: string, viele: string) => (n ? `${n} ${n === 1 ? eins : viele}` : '');
  return [
    z(b.dokumente, 'Dokument', 'Dokumente'), z(b.zusammenfassungen, 'Zusammenfassung', 'Zusammenfassungen'), z(b.skripte, 'Skript', 'Skripte'),
    z(b.pruefungen, 'Prüfung', 'Prüfungen'), z(b.karten, 'Karteikarte', 'Karteikarten'), z(b.abfragen, 'Abfrage', 'Abfragen'),
    z(b.lernzeiten, 'Lernzeit-Eintrag', 'Lernzeit-Einträge'), b.board ? 'Platz im Themenboard' : '', z(b.unterthemen, 'Unterthema', 'Unterthemen'),
    z(b.fehler, 'Fehlerheft-Eintrag', 'Fehlerheft-Einträge'),
  ].filter(Boolean).join(', ') || 'keine Verweise';
}

const ersetze = (ids: ID[] | undefined, von: ID, nach?: ID) => {
  if (!ids?.includes(von)) return ids;
  return [...new Set(ids.flatMap((x) => (x === von ? (nach ? [nach] : []) : [x])))];
};

// ---------------------------------------------------------------- Zuordnung korrigieren

export type QuellenArt = 'dokument' | 'skript' | 'zusammenfassung';

/**
 * Eine (oft automatisch erkannte) Zuordnung lösen oder auf ein anderes Thema umhängen.
 * Beim Dokument merkt sich die App das gelöste Thema, damit der nächste Textabgleich es nicht wieder setzt.
 * Beim Skript gelten die Themen danach als von Hand gesetzt (ein Neuimport überschreibt sie nicht).
 */
export async function korrigiereZuordnung(art: QuellenArt, quelleId: ID, von: ID, nach?: ID) {
  if (nach === von) return;
  await db.transaction('rw', [db.documents, db.skripte, db.summaries, db.activity], async () => {
    if (art === 'dokument') {
      const d = await db.documents.get(quelleId);
      if (!d) throw new Error('Dokument nicht gefunden.');
      await db.documents.update(quelleId, {
        topicIds: nach ? ersetze(d.topicIds, von, nach) ?? [...d.topicIds, nach] : d.topicIds.filter((x) => x !== von),
        excludedTopicIds: [...new Set([...(d.excludedTopicIds ?? []).filter((x) => x !== nach), von])],
      });
    } else if (art === 'skript') {
      const s = await db.skripte.get(quelleId);
      if (!s) throw new Error('Skript nicht gefunden.');
      await db.skripte.update(quelleId, { topicIds: ersetze(s.topicIds, von, nach) ?? s.topicIds, themenManuell: true, geaendert: new Date().toISOString() });
    } else {
      const s = await db.summaries.get(quelleId);
      if (!s) throw new Error('Zusammenfassung nicht gefunden.');
      await db.summaries.update(quelleId, { topicIds: ersetze(s.topicIds, von, nach) ?? s.topicIds });
    }
    await logActivity({ kind: 'lernstand', severity: 'info', ref: von, title: nach ? 'Zuordnung umgehängt' : 'Zuordnung gelöst', detail: `${art}: ${quelleId}${nach ? ` → ${nach}` : ''}` });
  });
}

// ---------------------------------------------------------------- Eigene Themen

function pruefeName(name: string) {
  const n = name.trim();
  if (n.length < 4 || n.length > 140) throw new Error('Der Name braucht 4 bis 140 Zeichen.');
  return n;
}

/** Name ändern. Die ID bleibt, deshalb bleiben alle Verweise gültig. Gleichnamige Geschwister → Zusammenführen anbieten. */
export async function benenneThemaUm(topicId: ID, name: string): Promise<{ dublette?: Topic }> {
  if (!istEigenesThema(topicId)) throw new Error('Katalogthemen lassen sich nicht umbenennen.');
  const neu = pruefeName(name);
  const t = await db.topics.get(topicId);
  if (!t) throw new Error('Thema nicht gefunden.');
  const dublette = (await alleThemen()).find((x) => x.id !== topicId && x.subjectId === t.subjectId && x.parentId === t.parentId && normalisiereThema(x.name) === normalisiereThema(neu));
  if (dublette) return { dublette };
  await db.topics.update(topicId, { name: neu });
  await logActivity({ kind: 'lernstand', severity: 'info', ref: topicId, title: 'Thema umbenannt', detail: `${t.name} → ${neu}` });
  return {};
}

/** Mögliche Dubletten: gleiches Fach und gleicher (normalisierter) Name, unabhängig vom Oberthema. */
export function findeDubletten(topic: Topic, alle: Topic[]): Topic[] {
  const n = normalisiereThema(topic.name);
  return alle.filter((x) => x.id !== topic.id && x.subjectId === topic.subjectId && normalisiereThema(x.name) === n);
}

function istNachfahre(id: ID, vorfahr: ID, alle: Map<ID, Topic>) {
  for (let t = alle.get(id), i = 0; t && i < 50; t = t.parentId ? alle.get(t.parentId) : undefined, i++) if (t.parentId === vorfahr) return true;
  return false;
}

/**
 * Dublette auflösen: Alles vom eigenen Thema `quelleId` geht auf `zielId` über, danach wird `quelleId` gelöscht.
 * Lernverlauf bleibt vollständig erhalten; dieselbe Versuch-ID wird dabei nicht doppelt gezählt.
 */
export async function fuehreThemenZusammen(quelleId: ID, zielId: ID): Promise<Bezuege> {
  if (!istEigenesThema(quelleId)) throw new Error('Nur eigene Themen lassen sich in ein anderes überführen.');
  if (quelleId === zielId) throw new Error('Quelle und Ziel sind dasselbe Thema.');
  const alle = new Map((await alleThemen()).map((t) => [t.id, t]));
  const quelle = alle.get(quelleId), ziel = alle.get(zielId);
  if (!quelle || !ziel) throw new Error('Thema nicht gefunden.');
  if (istNachfahre(zielId, quelleId, alle)) throw new Error('Das Ziel ist ein Unterthema der Dublette. Bitte das Oberthema als Ziel wählen oder umgekehrt.');
  const vorher = await bezuegeVon(quelleId);

  await db.transaction('rw', [db.topics, db.documents, db.summaries, db.skripte, db.exams, db.karten, db.kartenLogs, db.reviewLogs, db.studyLogs, db.board, db.activity], async () => {
    for (const d of await db.documents.where('topicIds').equals(quelleId).toArray()) {
      await db.documents.update(d.id, { topicIds: ersetze(d.topicIds, quelleId, zielId)!, excludedTopicIds: d.excludedTopicIds?.filter((x) => x !== zielId) });
    }
    for (const d of await db.documents.toArray()) {
      if (d.excludedTopicIds?.includes(quelleId)) await db.documents.update(d.id, { excludedTopicIds: ersetze(d.excludedTopicIds, quelleId, zielId) });
    }
    for (const s of await db.summaries.where('topicIds').equals(quelleId).toArray()) await db.summaries.update(s.id, { topicIds: ersetze(s.topicIds, quelleId, zielId)! });
    for (const s of await db.skripte.where('topicIds').equals(quelleId).toArray()) await db.skripte.update(s.id, { topicIds: ersetze(s.topicIds, quelleId, zielId)!, themenManuell: true });
    for (const e of await db.exams.toArray()) if (e.topicIds.includes(quelleId)) await db.exams.update(e.id, { topicIds: ersetze(e.topicIds, quelleId, zielId)! });
    for (const k of await db.karten.where('topicIds').equals(quelleId).toArray()) await db.karten.update(k.id, { topicIds: ersetze(k.topicIds, quelleId, zielId)! });
    await db.kartenLogs.toCollection().modify((l) => { const n = ersetze(l.topicIds, quelleId, zielId); if (n) l.topicIds = n; });

    // Lernverlauf: umhängen; derselbe Versuch, der schon am Ziel gebucht ist, wird nicht doppelt gezählt
    const amZiel = new Set((await db.reviewLogs.where('topicId').equals(zielId).toArray()).map((l) => l.versuchId).filter(Boolean));
    for (const l of await db.reviewLogs.where('topicId').equals(quelleId).toArray()) {
      if (l.versuchId && amZiel.has(l.versuchId)) await db.reviewLogs.delete(l.id!);
      else await db.reviewLogs.update(l.id!, { topicId: zielId });
    }
    await db.studyLogs.where('topicId').equals(quelleId).modify({ topicId: zielId });
    const [bq, bz] = await Promise.all([db.board.get(quelleId), db.board.get(zielId)]);
    if (bq) {
      if (!bz || RANG[bq.column] > RANG[bz.column]) await db.board.put({ ...bq, topicId: zielId });
      await db.board.delete(quelleId);
    }

    // Unterthemen und Voraussetzungen eigener Themen
    for (const t of await db.topics.toArray()) {
      const patch: Partial<Topic> = {};
      if (t.parentId === quelleId) patch.parentId = zielId;
      if (t.prerequisites.includes(quelleId)) patch.prerequisites = ersetze(t.prerequisites, quelleId, zielId)!.filter((x) => x !== t.id);
      if (Object.keys(patch).length) await db.topics.update(t.id, patch);
    }
    await db.topics.delete(quelleId);
    await logActivity({ kind: 'lernstand', severity: 'info', ref: zielId, title: 'Themen zusammengeführt', detail: `${quelle.name} → ${ziel.name}: ${bezuegeText(vorher)}` });
  });
  const fehler = ladeFehler();
  if (fehler.some((f) => f.topicIds.includes(quelleId))) speichereFehler(fehler.map((f) => ({ ...f, topicIds: ersetze(f.topicIds, quelleId, zielId) ?? f.topicIds })));
  return vorher;
}

/**
 * Eigenes Thema löschen. Verweise in Quellen, Prüfungen und Karten werden entfernt (die Dinge selbst bleiben),
 * Unterthemen rücken eine Ebene nach oben. Mit Lernverlauf nur, wenn `verlauf: true` ausdrücklich gewählt ist.
 */
export async function loescheThema(topicId: ID, opt: { verlauf?: boolean } = {}): Promise<Bezuege> {
  if (!istEigenesThema(topicId)) throw new Error('Katalogthemen lassen sich nicht löschen.');
  const t = await db.topics.get(topicId);
  if (!t) throw new Error('Thema nicht gefunden.');
  const vorher = await bezuegeVon(topicId);
  if (hatVerlauf(vorher) && !opt.verlauf) {
    throw new Error('Zu diesem Thema gibt es Lernverlauf. Führe es mit einem anderen Thema zusammen oder lösche den Verlauf ausdrücklich mit.');
  }
  await db.transaction('rw', [db.topics, db.documents, db.summaries, db.skripte, db.exams, db.karten, db.reviewLogs, db.studyLogs, db.board, db.activity], async () => {
    for (const d of await db.documents.where('topicIds').equals(topicId).toArray()) await db.documents.update(d.id, { topicIds: ersetze(d.topicIds, topicId)! });
    for (const s of await db.summaries.where('topicIds').equals(topicId).toArray()) await db.summaries.update(s.id, { topicIds: ersetze(s.topicIds, topicId)! });
    for (const s of await db.skripte.where('topicIds').equals(topicId).toArray()) await db.skripte.update(s.id, { topicIds: ersetze(s.topicIds, topicId)!, themenManuell: true });
    for (const e of await db.exams.toArray()) if (e.topicIds.includes(topicId)) await db.exams.update(e.id, { topicIds: ersetze(e.topicIds, topicId)! });
    for (const k of await db.karten.where('topicIds').equals(topicId).toArray()) await db.karten.update(k.id, { topicIds: ersetze(k.topicIds, topicId)! });
    if (opt.verlauf) {
      await db.reviewLogs.where('topicId').equals(topicId).delete();
      await db.studyLogs.where('topicId').equals(topicId).delete();
      await db.board.delete(topicId);
    }
    for (const x of await db.topics.toArray()) {
      const patch: Partial<Topic> = {};
      if (x.parentId === topicId) patch.parentId = t.parentId;
      if (x.prerequisites.includes(topicId)) patch.prerequisites = ersetze(x.prerequisites, topicId)!;
      if (Object.keys(patch).length) await db.topics.update(x.id, patch);
    }
    await db.topics.delete(topicId);
    await logActivity({ kind: 'lernstand', severity: 'warning', ref: topicId, title: 'Thema gelöscht', detail: `${t.name}: ${bezuegeText(vorher)}${opt.verlauf ? ', Lernverlauf mitgelöscht' : ''}` });
  });
  const fehler = ladeFehler();
  if (fehler.some((f) => f.topicIds.includes(topicId))) speichereFehler(fehler.map((f) => ({ ...f, topicIds: ersetze(f.topicIds, topicId) ?? f.topicIds })));
  return vorher;
}
