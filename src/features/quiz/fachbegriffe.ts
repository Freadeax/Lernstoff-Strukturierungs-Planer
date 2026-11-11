// Fachbegriffe im Fließtext erkennen, damit Trainer sie antippbar machen können.
// Quelle ist das Glossar des Fachmoduls (getModule, kein direkter Import aus modules/pflege).
// Rein und testbar: baueIndex() einmal je Modul, zerlege() je Textabschnitt.
//
// Regeln:
// - Abkürzungen (RR, COPD, i.v.) nur in genau dieser Schreibweise, sonst träfe „MS“ jedes „ms“.
// - Begriffe ohne Rücksicht auf Groß- und Kleinschreibung, mit üblichen Endungen (Ödem → Ödeme, Vene → Venen).
// - Nur ganze Wörter: „Thrombose“ trifft nicht in „Thromboseprophylaxe“. Gibt es den längeren Begriff, gewinnt er.
// - Wortbausteine aus dem Glossar („dys-“, „-ose“) und sehr kurze Begriffe werden nicht markiert.
// - Je Textabschnitt wird ein Begriff nur beim ersten Vorkommen markiert, damit der Text lesbar bleibt.

import type { CatalogGlossaryEntry } from '../../modules/catalog-types';

export interface Begriff {
  /** Name, unter dem der Eintrag erscheint (Fachbegriff, nicht die Fundstelle). */
  term: string;
  abbreviation?: string;
  definition: string;
  note?: string;
  topicIds: string[];
  /** true = Katalogwissen ohne Beleg aus eigenem Material (Belegregel: Lehrbuch hat Vorrang). */
  katalog: boolean;
  quelle?: string;
}

export type Abschnitt = string | { text: string; begriff: Begriff };

export interface BegriffIndex {
  begriffe: RegExp | null;
  abkuerzungen: RegExp | null;
  nachWort: Map<string, Begriff>;
  nachAbk: Map<string, Begriff>;
}

const ENDUNG = '(?:e|en|n|s|es|er|ern)?';
const RAND_VOR = '(?<![\\p{L}\\p{N}])';
const RAND_NACH = '(?![\\p{L}\\p{N}])';
const MIN_LAENGE = 4;

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
const schluessel = (s: string) => s.toLocaleLowerCase('de-DE');

function alsBegriff(g: CatalogGlossaryEntry): Begriff {
  const c = g.citation;
  return {
    term: g.term, abbreviation: g.abbreviation, definition: g.definition, note: g.note,
    topicIds: g.topicIds ?? [],
    katalog: !c && (g.origin ?? 'katalog') === 'katalog',
    quelle: c ? `Beleg aus deinem Material, Seite ${c.printedPage ?? c.page}` : undefined,
  };
}

/** Wortbaustein wie „dys-“ oder „-ose“: kein eigenständiger Fachbegriff im Text. */
const istBaustein = (t: string) => /^-|-$/.test(t.trim());

export function baueIndex(glossar: readonly CatalogGlossaryEntry[]): BegriffIndex {
  const nachWort = new Map<string, Begriff>();
  const nachAbk = new Map<string, Begriff>();
  const eintraege = glossar.filter((g) => g.term && g.definition).map((g) => ({ g, b: alsBegriff(g) }));
  const merke = (w: string, b: Begriff) => {
    const t = w.trim();
    if (t.length >= MIN_LAENGE && !istBaustein(t) && !nachWort.has(schluessel(t))) nachWort.set(schluessel(t), b);
  };
  // Erst alle Fachbegriffe, dann Synonyme: ein Synonym verdrängt nie einen echten Eintrag
  for (const { g, b } of eintraege) merke(g.term, b);
  for (const { g, b } of eintraege) for (const s of g.synonyms ?? []) merke(s, b);
  for (const { g, b } of eintraege) {
    const abk = g.abbreviation?.trim();
    if (abk && abk.length >= 2 && !istBaustein(abk) && !nachAbk.has(abk)) nachAbk.set(abk, b);
  }
  // Längere zuerst, damit „tiefe Beinvenenthrombose“ vor „Thrombose“ greift
  const alt = (xs: Iterable<string>) => [...xs].sort((a, b) => b.length - a.length).map(escape).join('|');
  const w = alt(nachWort.keys());
  const a = alt(nachAbk.keys());
  return {
    begriffe: w ? new RegExp(`${RAND_VOR}(${w})${ENDUNG}${RAND_NACH}`, 'giu') : null,
    abkuerzungen: a ? new RegExp(`${RAND_VOR}(${a})${RAND_NACH}`, 'gu') : null,
    nachWort, nachAbk,
  };
}

interface Treffer { start: number; ende: number; begriff: Begriff }

function finde(text: string, re: RegExp | null, nach: (m: string) => Begriff | undefined, ganz: boolean): Treffer[] {
  if (!re) return [];
  const out: Treffer[] = [];
  re.lastIndex = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    const begriff = nach(m[1]!);
    if (begriff) out.push({ start: m.index, ende: m.index + (ganz ? m[0] : m[1]!).length, begriff });
  }
  return out;
}

/**
 * Zerlegt einen Text in Klartext und Fachbegriffe. `schon` sammelt bereits markierte Begriffe
 * über mehrere Abschnitte hinweg (z. B. alle Sätze einer Erklärung), damit jeder nur einmal erscheint.
 */
export function zerlege(text: string, index: BegriffIndex, schon: Set<string> = new Set()): Abschnitt[] {
  const alle = [
    ...finde(text, index.begriffe, (m) => index.nachWort.get(schluessel(m)), true),
    ...finde(text, index.abkuerzungen, (m) => index.nachAbk.get(m), false),
  ].sort((x, y) => x.start - y.start || (y.ende - y.start) - (x.ende - x.start));
  const out: Abschnitt[] = [];
  let pos = 0;
  for (const t of alle) {
    if (t.start < pos || schon.has(t.begriff.term)) continue;
    schon.add(t.begriff.term);
    if (t.start > pos) out.push(text.slice(pos, t.start));
    out.push({ text: text.slice(t.start, t.ende), begriff: t.begriff });
    pos = t.ende;
  }
  if (pos < text.length) out.push(text.slice(pos));
  return out;
}

/** Alle Fachbegriffe, die in den Texten vorkommen, in Reihenfolge des ersten Auftretens. */
export function begriffeIn(texte: readonly string[], index: BegriffIndex): Begriff[] {
  const schon = new Set<string>();
  return texte.flatMap((t) => zerlege(t, index, schon)).flatMap((a) => (typeof a === 'string' ? [] : [a.begriff]));
}
