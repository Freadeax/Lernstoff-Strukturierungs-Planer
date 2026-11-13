// Aufgabe → passende Stelle im Skript. Nach dem Prüfen einer Aufgabe (Übungsrunde, Fehlerheft, Prüfungssimulation)
// zeigt die App den Abschnitt, in dem der Stoff steht, mit dem treffendsten Satz als Vorschau.
// Vorbild: Fragenbanken wie AMBOSS springen nach der Antwort in die Lernkarte an die passende Stelle.
//
// Rein und testbar. Gewertet wird nach Schlagwörtern aus Frage, Lösung und Erklärung:
// - Treffer in der Abschnittsüberschrift zählen dreifach, im Text einfach (je Wort höchstens einmal).
// - Skripte, die demselben Katalogthema zugeordnet sind, bekommen einen Vorsprung; fremde Skripte
//   brauchen mehr Treffer, damit kein zufälliges Wort in ein falsches Kapitel führt.
// - Quellen- und Literaturverzeichnisse sind kein Lernstoff und fallen weg.

import type { ID } from '../../core/types';
import { istQuellenAbschnitt } from './karten';
import { norm } from './themen';
import type { Abschnitt, Skript } from './typen';

export interface SkriptStelle {
  skriptId: ID;
  skriptTitel: string;
  gruppe: string;
  nr?: string;
  abschnittId: string;
  abschnittTitel: string;
  punkte: number;
  /** Treffendster Satz des Abschnitts, ohne Markdown und Belege (für die Vorschau). */
  ausschnitt?: string;
  /** Pfad ohne #, z. B. /lernen/skript?id=ce09-demenz&nr=3&q=validation */
  pfad: string;
  /** true, wenn das Skript einem der Themen der Aufgabe zugeordnet ist. */
  themaPasst: boolean;
}

export interface StellenZiel { topicIds: readonly ID[]; texte: readonly string[] }

/** Häufige Wörter in Fragen und Erklärungen, die nichts über den Stoff sagen. */
const STOPP = new Set([
  'welche', 'welcher', 'welches', 'warum', 'wann', 'woran', 'wodurch', 'wieso', 'weshalb', 'nicht', 'immer', 'keine', 'einer', 'einem', 'einen', 'eines',
  'diese', 'dieser', 'dieses', 'diesem', 'sollte', 'sollten', 'werden', 'wurde', 'wurden', 'worden', 'haben', 'hatte', 'kann', 'koennen', 'muss', 'muessen',
  'durch', 'unter', 'ueber', 'zwischen', 'gegen', 'nach', 'beim', 'damit', 'dabei', 'dann', 'denn', 'doch', 'auch', 'noch', 'schon', 'sowie', 'oder',
  'richtig', 'falsch', 'antwort', 'antworten', 'aussage', 'aussagen', 'trifft', 'zutreffend', 'zutreffende', 'passt', 'passende', 'folgende', 'folgenden',
  'pflege', 'pflegende', 'pflegefachperson', 'pflegefachkraft', 'patient', 'patientin', 'patienten', 'bewohner', 'bewohnerin', 'person', 'menschen',
  'zuerst', 'sofort', 'genau', 'meist', 'mehr', 'weniger', 'etwa', 'jeder', 'jede', 'jedes', 'ihrer', 'ihren', 'seine', 'seiner', 'seinen', 'deine', 'deiner',
  'heute', 'wichtig', 'wichtigste', 'beispiel', 'grund', 'gruende', 'schritt', 'erste', 'ersten', 'zweite', 'fall', 'frau', 'herr', 'jahre', 'jahren',
]);

/** Grober Wortstamm, damit „Dekubitus“ auch „Dekubitusprophylaxe“ und „Mobilisation“ auch „mobilisieren“ trifft. */
const stamm = (w: string) => (w.length > 7 ? w.slice(0, w.length - 3) : w.length > 5 ? w.slice(0, w.length - 1) : w);

/** Schlagwörter aus Texten: ab 5 Buchstaben (Abkürzungen ab 3 in Großbuchstaben), ohne Füllwörter, als Stämme. */
export function schlagwoerter(texte: readonly string[]): Array<{ stamm: string; wort: string }> {
  const out = new Map<string, string>();
  for (const t of texte) {
    for (const roh of t.split(/[^A-Za-zÄÖÜäöüß0-9-]+/)) {
      if (!roh) continue;
      const abk = /^[A-ZÄÖÜ0-9-]{3,8}$/.test(roh) && /[A-ZÄÖÜ]/.test(roh);
      const w = norm(roh).replace(/ /g, '');
      if (!w || (!abk && w.length < 5) || STOPP.has(w) || /^\d+$/.test(w)) continue;
      const s = abk ? w : stamm(w);
      if (!out.has(s)) out.set(s, roh);
    }
  }
  return [...out].map(([s, wort]) => ({ stamm: s, wort }));
}

/** Markdown und Belege grob entfernen, für eine lesbare Vorschau. */
export function klartext(md: string): string {
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\[[A-Za-zÄÖÜ0-9]{1,4}(,[^\]]*)?\]/g, '')
    .replace(/⚠/g, '')
    .replace(/[*_`>#|]/g, '')
    .replace(/^\s*[-+]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Satz bzw. Aufzählungspunkt mit den meisten Treffern, gekürzt auf etwa 220 Zeichen. */
export function besterAusschnitt(a: Pick<Abschnitt, 'markdown'>, stamme: readonly string[]): string | undefined {
  const teile = a.markdown.split(/\n+/).flatMap((z) => z.split(/(?<=[.!?])\s+(?=[A-ZÄÖÜ])/)).map(klartext).filter((x) => x.length >= 20);
  let best: { text: string; n: number } | undefined;
  for (const t of teile) {
    const n = norm(t);
    const k = stamme.filter((s) => n.includes(s)).length;
    if (k > 0 && (!best || k > best.n)) best = { text: t, n: k };
  }
  if (!best) return undefined;
  return best.text.length > 220 ? `${best.text.slice(0, 217).replace(/\s+\S*$/, '')} …` : best.text;
}

const skriptPfad = (s: Pick<Skript, 'id'>, a: Pick<Abschnitt, 'id' | 'nummer'>, q?: string) => {
  const p = new URLSearchParams({ id: s.id });
  if (a.nummer) p.set('nr', a.nummer); else p.set('a', a.id);
  if (q) p.set('q', q);
  return `/lernen/skript?${p}`;
};

/** Mindestpunkte: im Skript zum Thema reicht ein Treffer in der Überschrift, sonst braucht es mehr. */
export const MIN_PUNKTE_THEMA = 3;
export const MIN_PUNKTE_FREMD = 6;

/**
 * Passende Stellen für eine Aufgabe, beste zuerst, höchstens `max` (je Skript nur der beste Abschnitt,
 * damit verschiedene Skripte zur Wahl stehen).
 */
export function stellenFuer(skripte: readonly Skript[], ziel: StellenZiel, max = 2): SkriptStelle[] {
  const woerter = schlagwoerter(ziel.texte);
  if (!woerter.length) return [];
  const stamme = woerter.map((w) => w.stamm);
  const themen = new Set(ziel.topicIds);
  const out: SkriptStelle[] = [];
  for (const s of skripte) {
    const themaPasst = s.topicIds.some((t) => themen.has(t));
    let best: SkriptStelle | undefined;
    for (const a of s.abschnitte) {
      if (istQuellenAbschnitt(a)) continue;
      const titel = norm(a.titel);
      const text = norm(a.markdown);
      let punkte = 0;
      let bestesWort: string | undefined;
      let bestesGewicht = 0;
      for (const w of woerter) {
        const g = titel.includes(w.stamm) ? 3 : text.includes(w.stamm) ? 1 : 0;
        punkte += g;
        if (g > bestesGewicht || (g === bestesGewicht && g > 0 && w.wort.length > (bestesWort?.length ?? 0))) { bestesGewicht = g; bestesWort = w.wort; }
      }
      if (themaPasst) punkte += 2;
      if (punkte < (themaPasst ? MIN_PUNKTE_THEMA : MIN_PUNKTE_FREMD) || bestesGewicht === 0) continue;
      if (!best || punkte > best.punkte) {
        best = {
          skriptId: s.id, skriptTitel: s.titel, gruppe: s.gruppe, nr: a.nummer, abschnittId: a.id, abschnittTitel: a.titel,
          punkte, themaPasst, pfad: skriptPfad(s, a, bestesWort), ausschnitt: besterAusschnitt(a, stamme),
        };
      }
    }
    if (best) out.push(best);
  }
  return out.sort((x, y) => y.punkte - x.punkte || Number(y.themaPasst) - Number(x.themaPasst) || x.skriptTitel.localeCompare(y.skriptTitel, 'de')).slice(0, max);
}
