// Volltextsuche über alle Skripte. Klein genug (einige hundert KB), um bei jeder Eingabe linear zu suchen.

import type { Abschnitt, Skript } from './typen';
import { norm } from './themen';

export interface Treffer {
  skript: Skript;
  abschnitt: Abschnitt;
  punkte: number;
  /** Ausschnitt um den ersten Treffer, Markdown-Zeichen entfernt. */
  ausschnitt: string;
}

/** Markdown in lesbaren Klartext (für Ausschnitte). */
export function klartext(md: string): string {
  return md
    .replace(/^\s*\|?[-:| ]+\|\s*$/gm, ' ')
    .replace(/\*\*|__|`/g, '')
    .replace(/^\s*(?:[-*+]|\d+\.)\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^#+\s+/gm, '')
    .replace(/\|/g, ' · ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Suchbegriffe: Wörter ab 2 Zeichen, „in Anführungszeichen“ als Phrase. */
export function begriffe(q: string): string[] {
  const out: string[] = [];
  const rest = q.replace(/"([^"]+)"|„([^“”"]+)[“”"]/g, (_, a: string, b: string) => { out.push(norm(a ?? b)); return ' '; });
  for (const w of norm(rest).split(' ')) if (w.length >= 2) out.push(w);
  return out.filter(Boolean);
}

function ausschnitt(text: string, begriff: string, laenge = 160): string {
  const n = norm(text);
  // Position im normalisierten Text grob auf den Klartext übertragen (gleiche Länge bis auf Umlaute)
  const pos = n.indexOf(begriff);
  const verh = text.length / Math.max(1, n.length);
  const start = Math.max(0, Math.round(pos * verh) - laenge / 3);
  const roh = text.slice(start, start + laenge);
  return `${start > 0 ? '… ' : ''}${roh.replace(/^\S*\s/, start > 0 ? '' : '$&')}${start + laenge < text.length ? ' …' : ''}`;
}

/**
 * Alle Abschnitte, in denen jeder Begriff vorkommt (Titel, Überschrift oder Text).
 * Treffer in Überschriften wiegen mehr, genauso Treffer am Wortanfang.
 */
export function suche(skripte: Skript[], q: string, max = 50): Treffer[] {
  const bs = begriffe(q);
  if (!bs.length) return [];
  const out: Treffer[] = [];
  for (const skript of skripte) {
    const kopf = norm(`${skript.gruppe} ${skript.titel}`);
    for (const a of skript.abschnitte) {
      const titel = norm(a.titel);
      const text = klartext(a.markdown);
      const body = norm(text);
      let punkte = 0;
      let alle = true;
      for (const b of bs) {
        const inTitel = titel.includes(b), inKopf = kopf.includes(b);
        const anzahl = body.split(b).length - 1;
        if (!inTitel && !inKopf && !anzahl) { alle = false; break; }
        punkte += (inTitel ? 10 : 0) + (inKopf ? 4 : 0) + Math.min(anzahl, 5) + (new RegExp(`(^| )${b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(body) ? 2 : 0);
      }
      if (!alle) continue;
      const erster = bs.find((b) => body.includes(b));
      out.push({ skript, abschnitt: a, punkte, ausschnitt: erster ? ausschnitt(text, erster) : text.slice(0, 160) });
    }
  }
  return out.sort((x, y) => y.punkte - x.punkte).slice(0, max);
}

/** Textstellen für die Hervorhebung: Bereiche [start, ende) im Originaltext, die einem Begriff entsprechen. */
export function markiere(text: string, bs: string[]): Array<[number, number]> {
  if (!bs.length) return [];
  const bereiche: Array<[number, number]> = [];
  // Zeichenweise normalisieren und Positionen merken, damit Umlaute (ä → ae) richtig zurückfallen
  let n = '';
  const pos: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const c = norm(text[i]!) || ' ';
    for (const ch of c) { n += ch; pos.push(i); }
  }
  for (const b of bs) {
    for (let i = n.indexOf(b); i >= 0; i = n.indexOf(b, i + b.length)) {
      bereiche.push([pos[i]!, pos[i + b.length - 1]! + 1]);
    }
  }
  return bereiche.sort((a, b) => a[0] - b[0]).reduce<Array<[number, number]>>((acc, r) => {
    const last = acc[acc.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]); else acc.push([...r]);
    return acc;
  }, []);
}
