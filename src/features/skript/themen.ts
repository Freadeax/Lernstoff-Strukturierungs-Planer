// Skript ↔ Katalogthemen. Bevorzugt die Zuordnung aus dem Kopf der Datei (themen: …);
// fehlt sie, schlägt die App passende Themen anhand von Titeln und Überschriften vor.

import type { ID, Topic } from '../../core/types';
import type { CatalogTopic } from '../../modules/catalog-types';
import type { Abschnitt, Skript } from './typen';

/** Kleinschreibung, Umlaute ausgeschrieben, nur Buchstaben/Ziffern und einfache Leerzeichen. */
export function norm(s: string): string {
  return s.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim();
}

const STOPP = new Set(['und', 'oder', 'der', 'die', 'das', 'des', 'den', 'dem', 'mit', 'bei', 'von', 'fuer', 'im', 'in', 'zur', 'zum', 'eine', 'einer', 'ein',
  'teil', 'grundlagen', 'pflege', 'pflegerische', 'erkrankungen', 'allgemeine', 'unterstuetzung', 'systeme', 'system', 'menschen', 'gestalten']);

/** Schlagwörter eines Themas: Wörter aus dem Namen (ab 4 Buchstaben) und Tags. */
export function schlagwoerter(t: Topic & Partial<Pick<CatalogTopic, 'tags'>>): string[] {
  const woerter = norm(`${t.name} ${(t.tags ?? []).join(' ')}`).split(' ').filter((w) => w.length >= 4 && !STOPP.has(w));
  return [...new Set(woerter)];
}

/** Wortstamm grob: Endungen abschneiden, damit „Demenz“ auch „demenziell“ findet. */
const stamm = (w: string) => (w.length > 6 ? w.slice(0, Math.max(5, w.length - 3)) : w);

/**
 * Themenvorschläge für ein Skript. Überschriften zählen doppelt, Treffer im Titel dreifach.
 * Nur Blattthemen, höchstens `max` Stück, Mindestpunktzahl 3.
 */
export function schlageThemenVor(skript: Pick<Skript, 'titel' | 'abschnitte'>, topics: Topic[], max = 5): ID[] {
  const hatKinder = new Set(topics.map((t) => t.parentId).filter(Boolean));
  const titel = norm(skript.titel);
  const ueber = skript.abschnitte.map((a) => norm(a.titel)).join(' ');
  const text = skript.abschnitte.map((a) => norm(a.markdown)).join(' ');
  const punkte = topics.filter((t) => !hatKinder.has(t.id)).map((t) => {
    let p = 0, imText = 0;
    for (const w of schlagwoerter(t)) {
      const s = stamm(w);
      if (titel.includes(s)) p += 3;
      if (ueber.includes(s)) p += 2;
      imText += text.split(s).length - 1;
    }
    // Häufigkeit im Fließtext allein reicht nicht (sonst passt „Prophylaxe“ zu allem), sie verstärkt nur.
    return { id: t.id, p: p ? p + Math.min(2, imText / 6) : 0 };
  });
  return punkte.filter((x) => x.p >= 3).sort((a, b) => b.p - a.p).slice(0, max).map((x) => x.id);
}

/** Abschnitte eines Skripts, die zu einem Thema passen (für Sprünge aus dem Lernplan). */
export function abschnitteZuThema(skript: Skript, topic: Topic): Abschnitt[] {
  const woerter = schlagwoerter(topic).map(stamm);
  if (!woerter.length) return [];
  return skript.abschnitte.filter((a) => {
    const t = norm(`${a.titel} ${a.markdown}`);
    return woerter.some((w) => norm(a.titel).includes(w)) || woerter.filter((w) => t.includes(w)).length >= Math.min(2, woerter.length);
  });
}

/** Themen mit ihren Vorfahren, damit ein Skript zu „Demenz und Delir“ auch unter „Krankheitslehre“ auftaucht. */
export function mitOberthemen(ids: ID[], topics: Map<ID, Topic>): Set<ID> {
  const out = new Set<ID>();
  for (const id of ids) for (let cur = topics.get(id); cur; cur = cur.parentId ? topics.get(cur.parentId) : undefined) out.add(cur.id);
  return out;
}
