// Praxistagebuch: Schnellnotizen von Station (Pocket-Modus) und Reflexionen nach Gibbs. Rein.
// Alles bleibt auf dem Gerät (localStorage, damit in der Datensicherung). Notizen sollen keine
// echten Personendaten enthalten; die Seite warnt dabei mit personenbezug().

import type { ID } from '../../core/types';
import { STICHWORTE } from './arten';

export type NotizArt = 'beobachtung' | 'begriff' | 'wert' | 'frage' | 'notiz';

export const NOTIZ_ARTEN: Array<{ id: NotizArt; label: string; hilfe: string }> = [
  { id: 'beobachtung', label: 'Beobachtung', hilfe: 'Was ist dir aufgefallen? Ohne Namen, z. B. „Bewohnerin, 84 J.“' },
  { id: 'begriff', label: 'Begriff', hilfe: 'Ein Wort oder eine Abkürzung, die du nachschlagen willst.' },
  { id: 'wert', label: 'Wert', hilfe: 'Ein Messwert mit Einheit, z. B. „RR 168/95 nach Mobilisation“.' },
  { id: 'frage', label: 'Frage an Anleitung', hilfe: 'Was du deine Praxisanleitung fragen willst.' },
  { id: 'notiz', label: 'Sonstiges', hilfe: 'Alles andere.' },
];
export const NOTIZ_LABEL = Object.fromEntries(NOTIZ_ARTEN.map((a) => [a.id, a.label])) as Record<NotizArt, string>;

export interface Notiz {
  id: string;
  at: string;
  /** Kalendertag (YYYY-MM-DD) in deutscher Zeit. */
  tag: string;
  art: NotizArt;
  text: string;
  einsatzId?: string;
  themen: ID[];
  erledigt: boolean;
}

/** Reflexion nach dem Kreislauf von Gibbs, verkürzt auf vier Fragen. */
export interface Reflexion {
  id: string;
  at: string;
  tag: string;
  einsatzId?: string;
  themen: ID[];
  situation: string;
  gedanken: string;
  gut: string;
  lernen: string;
}

export const GIBBS: Array<{ feld: 'situation' | 'gedanken' | 'gut' | 'lernen'; frage: string; hilfe: string }> = [
  { feld: 'situation', frage: 'Was ist passiert?', hilfe: 'Kurz beschreiben, ohne zu bewerten und ohne Namen.' },
  { feld: 'gedanken', frage: 'Was hast du gedacht und gefühlt?', hilfe: 'Auch Unsicherheit oder Ärger gehören dazu.' },
  { feld: 'gut', frage: 'Was lief gut, was nicht?', hilfe: 'Beides benennen. Woran lag es?' },
  { feld: 'lernen', frage: 'Was nimmst du mit, was machst du nächstes Mal?', hilfe: 'Ein konkreter Vorsatz oder eine Wissenslücke.' },
];

export interface Tagebuch { v: 1; notizen: Notiz[]; reflexionen: Reflexion[] }
export const LEER: Tagebuch = { v: 1, notizen: [], reflexionen: [] };
export const MAX_NOTIZEN = 500;
export const MAX_REFLEXIONEN = 200;
export const MAX_TEXT = 2000;

const text = (v: unknown, max = MAX_TEXT): v is string => typeof v === 'string' && v.length <= max;
const ids = (v: unknown) => Array.isArray(v) && v.length <= 20 && v.every((x) => text(x, 120));
const TAG = /^\d{4}-\d{2}-\d{2}$/;
const ARTEN = new Set(NOTIZ_ARTEN.map((a) => a.id));

export function istNotiz(v: unknown): v is Notiz {
  if (typeof v !== 'object' || v === null) return false;
  const n = v as Record<string, unknown>;
  return text(n.id, 80) && text(n.at, 40) && text(n.tag, 10) && TAG.test(n.tag) && ARTEN.has(n.art as NotizArt) && text(n.text)
    && (n.einsatzId === undefined || text(n.einsatzId, 80)) && ids(n.themen) && typeof n.erledigt === 'boolean';
}

export function istReflexion(v: unknown): v is Reflexion {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  return text(r.id, 80) && text(r.at, 40) && text(r.tag, 10) && TAG.test(r.tag) && (r.einsatzId === undefined || text(r.einsatzId, 80)) && ids(r.themen)
    && GIBBS.every((g) => text(r[g.feld]));
}

/** Liest ein gespeichertes Tagebuch und verwirft kaputte Einträge einzeln statt alles. */
export function pruefeTagebuch(v: unknown): Tagebuch {
  if (typeof v !== 'object' || v === null) return LEER;
  const t = v as Record<string, unknown>;
  return {
    v: 1,
    notizen: Array.isArray(t.notizen) ? t.notizen.filter(istNotiz).slice(0, MAX_NOTIZEN) : [],
    reflexionen: Array.isArray(t.reflexionen) ? t.reflexionen.filter(istReflexion).slice(0, MAX_REFLEXIONEN) : [],
  };
}

/** Neue Notiz vorne einfügen; die älteste erledigte fällt zuerst weg, wenn das Tagebuch voll ist. */
export function mitNotiz(t: Tagebuch, n: Notiz): Tagebuch {
  let notizen = [n, ...t.notizen.filter((x) => x.id !== n.id)];
  while (notizen.length > MAX_NOTIZEN) {
    const i = notizen.map((x) => x.erledigt).lastIndexOf(true);
    notizen = notizen.filter((_, k) => k !== (i >= 0 ? i : notizen.length - 1));
  }
  return { ...t, notizen };
}

export const mitReflexion = (t: Tagebuch, r: Reflexion): Tagebuch => ({ ...t, reflexionen: [r, ...t.reflexionen.filter((x) => x.id !== r.id)].slice(0, MAX_REFLEXIONEN) });
export const ohneNotiz = (t: Tagebuch, id: string): Tagebuch => ({ ...t, notizen: t.notizen.filter((x) => x.id !== id) });
export const ohneReflexion = (t: Tagebuch, id: string): Tagebuch => ({ ...t, reflexionen: t.reflexionen.filter((x) => x.id !== id) });
export const aendereNotiz = (t: Tagebuch, id: string, patch: Partial<Pick<Notiz, 'themen' | 'erledigt' | 'text' | 'art'>>): Tagebuch =>
  ({ ...t, notizen: t.notizen.map((x) => (x.id === id ? { ...x, ...patch } : x)) });

/** Offene Notizen = Eingang, neueste zuerst. */
export const eingang = (t: Tagebuch) => t.notizen.filter((n) => !n.erledigt);

export interface TagEintrag { tag: string; notizen: Notiz[]; reflexionen: Reflexion[]; themen: ID[] }

/** Tage mit Einträgen, neueste zuerst; Themen des Tages aus allen Einträgen (Reihenfolge nach Häufigkeit). */
export function tage(t: Tagebuch, einsatzId?: string): TagEintrag[] {
  const passt = (x: { einsatzId?: string }) => !einsatzId || x.einsatzId === einsatzId;
  const map = new Map<string, TagEintrag>();
  const hol = (tag: string) => { let e = map.get(tag); if (!e) map.set(tag, (e = { tag, notizen: [], reflexionen: [], themen: [] })); return e; };
  for (const n of t.notizen.filter(passt)) hol(n.tag).notizen.push(n);
  for (const r of t.reflexionen.filter(passt)) hol(r.tag).reflexionen.push(r);
  for (const e of map.values()) {
    const zahl = new Map<ID, number>();
    for (const x of [...e.notizen, ...e.reflexionen]) for (const id of x.themen) zahl.set(id, (zahl.get(id) ?? 0) + 1);
    e.themen = [...zahl].sort((a, b) => b[1] - a[1]).map(([id]) => id);
  }
  return [...map.values()].sort((a, b) => b.tag.localeCompare(a.tag));
}

// ---------------------------------------------------------------- Themenvorschläge

export interface VorschlagQuelle {
  /** Lernbare Themen (Blätter). */
  themen: Array<{ id: ID; name: string }>;
  glossar: Array<{ term: string; abbreviation?: string; topicIds?: ID[] }>;
}

const klein = (s: string) => s.toLocaleLowerCase('de');
/** Wörter eines Texts (Buchstaben, Ziffern, Punkte in Abkürzungen wie „s.c.“). */
const woerter = (s: string) => klein(s).match(/[\p{L}\d][\p{L}\d.]*/gu)?.map((w) => w.replace(/\.$/, '')) ?? [];
const RAUSCHEN = new Set(['und', 'oder', 'der', 'die', 'das', 'bei', 'mit', 'von', 'pflege', 'pflegerische', 'erkrankungen', 'grundlagen', 'system', 'systems']);

/**
 * Schlägt bis zu `max` Themen zu einem Notiztext vor: Stichwörter von Station, Glossarbegriffe
 * (ab 4 Buchstaben, Abkürzungen exakt) und Wörter aus Themennamen (ab 6 Buchstaben, Wortanfang).
 * Treffer aus Stichwörtern und Glossar wiegen mehr als ein Wort aus dem Themennamen.
 */
export function themenVorschlag(text: string, q: VorschlagQuelle, max = 4): ID[] {
  const erlaubt = new Set(q.themen.map((t) => t.id));
  const punkte = new Map<ID, number>();
  const gib = (ids: ID[] | undefined, p: number) => { for (const id of ids ?? []) if (erlaubt.has(id)) punkte.set(id, (punkte.get(id) ?? 0) + p); };
  const w = woerter(text);
  if (!w.length) return [];
  const satz = ` ${w.join(' ')} `;
  for (const x of w) gib(STICHWORTE[x], 3);
  for (const g of q.glossar) {
    const term = klein(g.term);
    if (term.length >= 4 && satz.includes(` ${term}`)) gib(g.topicIds, 2);
    if (g.abbreviation && g.abbreviation.length >= 2 && new RegExp(`(^|[^\\p{L}])${g.abbreviation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^\\p{L}])`, 'u').test(text)) gib(g.topicIds, 2);
  }
  for (const t of q.themen) {
    const teile = woerter(t.name).filter((x) => x.length >= 6 && !RAUSCHEN.has(x));
    if (teile.some((teil) => w.some((x) => x.startsWith(teil) || (x.length >= 6 && teil.startsWith(x))))) gib([t.id], 1);
  }
  return [...punkte].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, max).map(([id]) => id);
}
