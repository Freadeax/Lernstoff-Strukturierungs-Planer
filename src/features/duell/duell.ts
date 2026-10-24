// Fachbegriff-Duell: Fragen aus dem Glossar eines Fachmoduls, ohne KI und ohne Netz.
// Alles hier ist rein (kein React, keine DB), damit Fragenbau und Punktwertung testbar sind.

import type { DomainModule, ID } from '../../core/types';
import type { CatalogGlossaryEntry } from '../../modules/catalog-types';
import { rng } from '../rechnen/aufgaben';

export type FrageArt = 'definition' | 'abkuerzung' | 'begriff';

export const ARTEN: { art: FrageArt; label: string; hinweis: string }[] = [
  { art: 'definition', label: 'Definition → Begriff', hinweis: 'Welcher Fachbegriff ist gemeint?' },
  { art: 'abkuerzung', label: 'Abkürzung → Bedeutung', hinweis: 'Wofür steht die Abkürzung?' },
  { art: 'begriff', label: 'Begriff → Definition', hinweis: 'Welche Erklärung passt?' },
];

/** Ein Glossareintrag, aufbereitet fürs Spiel. */
export interface Karte {
  id: ID;
  begriff: string;
  abkuerzung?: string;
  definition: string;        // eigener Begriff, Abkürzung und Synonyme sind ausgeblendet
  erklaerung: string;        // ungekürzt, für Auflösung und Nacharbeiten
  faecher: ID[];
}

export interface Frage {
  id: string;                // art:kartenId
  art: FrageArt;
  karte: Karte;
  frage: string;             // was beide lesen
  optionen: string[];        // immer vier (oder weniger, wenn der Pool kleiner ist)
  richtig: number;           // Index in optionen
}

const LUECKE = '…';

function escape(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

/** Blendet Begriff, Abkürzung und Synonyme in der Definition aus, damit sie die Lösung nicht verrät. */
export function maskiere(definition: string, woerter: (string | undefined)[]): string {
  let out = definition;
  const liste = woerter.filter((w): w is string => !!w && w.length >= 2).sort((a, b) => b.length - a.length);
  for (const w of liste) {
    // Wortgrenzen per Lookaround, weil \b keine Umlaute kennt
    out = out.replace(new RegExp(`(?<![\\p{L}\\p{N}])${escape(w)}(?![\\p{L}\\p{N}])`, 'giu'), LUECKE);
  }
  return out.replace(/…\./g, '…');
}

/** Glossar eines Fachmoduls in Spielkarten umwandeln; Fächer ergeben sich über die Themen. */
export function karten(modul: Pick<DomainModule, 'glossary' | 'topics'>): Karte[] {
  const fachVonThema = new Map(modul.topics.map((t) => [t.id, t.subjectId]));
  return (modul.glossary as CatalogGlossaryEntry[]).map((g, i) => ({
    id: g.id ?? `gl.${i}`,
    begriff: g.term,
    abkuerzung: g.abbreviation,
    definition: maskiere(g.definition, [g.term, g.abbreviation, ...(g.synonyms ?? [])]),
    erklaerung: g.definition,
    faecher: [...new Set((g.topicIds ?? []).map((t) => fachVonThema.get(t)).filter((f): f is ID => !!f))],
  }));
}

/** Karten, die zu einer Frageart passen (Abkürzungsfragen nur mit Abkürzung, die nicht schon der Begriff ist). */
export function passt(k: Karte, art: FrageArt) {
  return art !== 'abkuerzung' || (!!k.abkuerzung && k.abkuerzung !== k.begriff);
}

export function filtere(alle: Karte[], faecher: ID[]): Karte[] {
  return faecher.length ? alle.filter((k) => k.faecher.some((f) => faecher.includes(f))) : alle;
}

function antwort(k: Karte, art: FrageArt) {
  return art === 'begriff' ? k.definition : k.begriff;
}

function mische<T>(xs: T[], next: () => number): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/**
 * Baut eine Runde. Gefragt wird nur aus `auswahl` (gefilterte Karten), Ablenker kommen
 * bevorzugt aus demselben Fach und notfalls aus dem ganzen Glossar (`alle`), damit es
 * auch bei kleinen Fächern vier Antworten gibt. Kein Begriff kommt in einer Runde doppelt.
 */
export function erzeugeRunde(alle: Karte[], auswahl: Karte[], arten: FrageArt[], anzahl: number, seed: number): Frage[] {
  const r = rng(seed);
  const genutzt = new Set<ID>();
  const fragen: Frage[] = [];
  const reihenfolge = mische(auswahl, r.next);
  for (const karte of reihenfolge) {
    if (fragen.length >= anzahl) break;
    if (genutzt.has(karte.id)) continue;
    const moeglich = arten.filter((a) => passt(karte, a));
    if (!moeglich.length) continue;
    const art = r.pick(moeglich);
    const richtigeAntwort = antwort(karte, art);
    const kandidaten = alle.filter((k) => k.id !== karte.id && passt(k, art) && antwort(k, art) !== richtigeAntwort);
    const gleichesFach = kandidaten.filter((k) => k.faecher.some((f) => karte.faecher.includes(f)));
    const rest = kandidaten.filter((k) => !gleichesFach.includes(k));
    const ablenker: string[] = [];
    for (const k of [...mische(gleichesFach, r.next), ...mische(rest, r.next)]) {
      const a = antwort(k, art);
      if (!ablenker.includes(a)) ablenker.push(a);
      if (ablenker.length === 3) break;
    }
    if (!ablenker.length) continue;
    const optionen = mische([richtigeAntwort, ...ablenker], r.next);
    genutzt.add(karte.id);
    fragen.push({
      id: `${art}:${karte.id}`,
      art,
      karte,
      frage: art === 'definition' ? karte.definition : art === 'abkuerzung' ? karte.abkuerzung! : karte.begriff,
      optionen,
      richtig: optionen.indexOf(richtigeAntwort),
    });
  }
  return fragen;
}

// ---------- Wertung ----------

export type Spieler = 0 | 1;
export interface Antwort { wahl: number; ms: number }   // ms seit Anzeige der Frage

/**
 * Richtig = 1 Punkt, wer als Schnellere oder Schnellerer richtig liegt, bekommt 1 Bonuspunkt.
 * Falsch oder keine Antwort = 0. So lohnt sich Tempo, Raten aber nicht.
 */
export function punkte(frage: Pick<Frage, 'richtig'>, antworten: [Antwort | null, Antwort | null]): [number, number] {
  const ok = antworten.map((a) => !!a && a.wahl === frage.richtig);
  const p: [number, number] = [ok[0] ? 1 : 0, ok[1] ? 1 : 0];
  if (ok[0] && ok[1]) {
    const [a, b] = [antworten[0]!.ms, antworten[1]!.ms];
    if (a < b) p[0]++; else if (b < a) p[1]++;
  } else if (ok[0]) p[0]++;
  else if (ok[1]) p[1]++;
  return p;
}

export interface Zug { frage: Frage; antworten: [Antwort | null, Antwort | null]; punkte: [number, number] }

export function stand(zuege: Zug[]): [number, number] {
  return zuege.reduce<[number, number]>((s, z) => [s[0] + z.punkte[0], s[1] + z.punkte[1]], [0, 0]);
}

/** Begriffe, bei denen mindestens eine Person falsch lag oder nicht geantwortet hat. */
export function nacharbeiten(zuege: Zug[]): Zug[] {
  return zuege.filter((z) => z.antworten.some((a) => !a || a.wahl !== z.frage.richtig));
}
