// Deterministische Prüfungen Q1–Q6 der Qualitätskontrolle (siehe docs/ZUSAMMENFASSER.md, Abschnitt 6).
// Laufen per Code, nicht per KI, damit die Kontrolle nicht auf dem Modell beruht, das den Text geschrieben hat.

import type { Citation, ClaimKind, SourceChunk, SummaryMode } from '../../core/types';
import type { CatalogGlossaryEntry } from '../../modules/catalog-types';

export type Chunk = SourceChunk;
export type Beleg = Citation;
export type Modus = SummaryMode;
/** Aussage in der Form, die die Prüfungen brauchen (Teilmenge von ClaimExt). */
export interface PruefClaim { id: string; text: string; kind: ClaimKind; citations: Beleg[]; aufgabeNr?: string; }
export type Schwere = 'blocker' | 'warnung' | 'hinweis';
/** PruefBefund ohne ID; die Pipeline vergibt IDs beim Speichern (siehe PruefBefund in zusammenfasser/typen.ts). */
export interface PruefBefund { pruefung: string; schwere: Schwere; claimId?: string; aufgabeNr?: string; meldung: string; }

// ---------------------------------------------------------------------------
// Normalisierung (muss beim Import und bei der Prüfung identisch sein)
// ---------------------------------------------------------------------------

const ERSETZUNGEN: Array<[RegExp, string]> = [
  [/ﬀ/g, 'ff'], [/ﬁ/g, 'fi'], [/ﬂ/g, 'fl'], [/ﬃ/g, 'ffi'], [/ﬄ/g, 'ffl'],
  [/[“”„«»"]/g, '"'], [/[‘’‚‹›']/g, "'"],
  [/[‐‑‒–—−]/g, '-'], [/ /g, ' '], [/­/g, ''],
];

/** Liefert normalisierten Text plus Abbildung Index(normalisiert) → Index(original). */
export function normalisiereMitIndex(text: string): { norm: string; map: number[] } {
  let out = '';
  const map: number[] = [];
  let i = 0;
  while (i < text.length) {
    // Silbentrennung am Zeilenende: "Dekubitus-\nprophylaxe" → "Dekubitusprophylaxe"
    // (Bindestrich vor Kleinbuchstaben nach Zeilenumbruch; "Dekubitus-\nProphylaxe" bleibt als Kompositum mit Bindestrich)
    const trenn = /^[-­‐]\s*\n\s*(?=\p{Ll})/u.exec(text.slice(i, i + 12));
    if (trenn && i > 0 && /\p{L}/u.test(text[i - 1])) { i += trenn[0].length; continue; }
    let ch = text[i];
    for (const [re, rep] of ERSETZUNGEN) { re.lastIndex = 0; if (re.test(ch)) { ch = ch.replace(re, rep); break; } }
    if (/\s/.test(ch)) {
      if (out.length > 0 && out[out.length - 1] !== ' ') { out += ' '; map.push(i); }
      i++; continue;
    }
    for (const c of ch.toLowerCase()) { out += c; map.push(i); }
    i++;
  }
  if (out.endsWith(' ')) { out = out.slice(0, -1); map.pop(); }
  return { norm: out, map };
}
export const normalisiere = (t: string) => normalisiereMitIndex(t).norm;

/** Entfernt die Kopfzeile "[S. 412 | …]" am Chunk-Anfang. */
export const ohneKopfzeile = (t: string) => t.replace(/^\s*\[S\.[^\]]*\]\s*/, '');

// ---------------------------------------------------------------------------
// Q1a: Zitat im Chunk finden
// ---------------------------------------------------------------------------

export interface ZitatTreffer { art: 'exakt' | 'unscharf' | 'nein'; aehnlichkeit: number; start?: number; end?: number; }

export function findeZitat(chunkText: string, zitat: string, schwelle = 0.9): ZitatTreffer {
  const { norm, map } = normalisiereMitIndex(chunkText);
  const z = normalisiere(ohneKopfzeile(zitat));
  if (!z) return { art: 'nein', aehnlichkeit: 0 };
  const pos = norm.indexOf(z);
  if (pos >= 0) return { art: 'exakt', aehnlichkeit: 1, start: map[pos], end: map[pos + z.length - 1] + 1 };

  // Unscharf: Wortfenster gleicher Länge (±2) mit Wort-Levenshtein vergleichen.
  // Wörter ohne Satzzeichen, Bindestrich trennt ("Braden-Skala" = "Braden Skala").
  const woerter = (s: string) => [...s.matchAll(/[\p{L}\p{N}°%≤≥<>]+/gu)].map(m => ({ w: m[0], von: m.index!, bis: m.index! + m[0].length }));
  const zw = woerter(z).map(x => x.w), cw = woerter(norm);
  const cwW = cw.map(x => x.w);
  let best = { sim: 0, from: 0, to: 0 };
  for (let len = Math.max(1, zw.length - 2); len <= zw.length + 2; len++) {
    for (let s = 0; s + len <= cw.length; s++) {
      const sim = 1 - levenshtein(zw, cwW.slice(s, s + len)) / Math.max(zw.length, len);
      if (sim > best.sim) best = { sim, from: s, to: s + len };
    }
  }
  if (best.sim >= schwelle && best.to > best.from) {
    return { art: 'unscharf', aehnlichkeit: best.sim, start: map[cw[best.from].von], end: map[cw[best.to - 1].bis - 1] + 1 };
  }
  return { art: 'nein', aehnlichkeit: best.sim };
}

function levenshtein<T>(a: T[], b: T[]): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

// ---------------------------------------------------------------------------
// Q2: Zahlen und Einheiten
// ---------------------------------------------------------------------------

const ZAHLWOERTER: Record<string, number> = {
  null: 0, ein: 1, eine: 1, einen: 1, eins: 1, zwei: 2, drei: 3, vier: 4, fünf: 5, sechs: 6, sieben: 7, acht: 8,
  neun: 9, zehn: 10, elf: 11, zwölf: 12, zwanzig: 20, dreißig: 30, vierzig: 40, fünfzig: 50, hundert: 100,
  halbe: 0.5, halben: 0.5, anderthalb: 1.5, eineinhalb: 1.5, zweimal: 2, dreimal: 3, viermal: 4,
};
// Reihenfolge: längere Schreibweisen zuerst. Wert = normalisierte Einheit.
const EINHEITEN: Array<[string, string]> = [
  ['mmhg', 'mmHg'], ['mg/dl', 'mg/dl'], ['mmol/l', 'mmol/l'], ['/min', '/min'], ['mg', 'mg'], ['µg', 'µg'], ['ml', 'ml'],
  ['kg', 'kg'], ['cm', 'cm'], ['mm', 'mm'], ['kcal', 'kcal'], ['°c', '°C'], ['grad celsius', '°C'], ['grad', '°'], ['°', '°'],
  ['prozent', '%'], ['%', '%'], ['stunden', 'h'], ['stunde', 'h'], ['std.', 'h'], ['std', 'h'], ['h', 'h'],
  ['minuten', 'min'], ['minute', 'min'], ['min.', 'min'], ['min', 'min'], ['sekunden', 's'], ['sek.', 's'],
  ['tagen', 'd'], ['tage', 'd'], ['tag', 'd'], ['wochen', 'Wo'], ['woche', 'Wo'], ['monaten', 'Mo'], ['monate', 'Mo'],
  ['jahren', 'J'], ['jahre', 'J'], ['jahr', 'J'], ['punkten', 'Pkt'], ['punkte', 'Pkt'], ['punkt', 'Pkt'],
  ['-mal', 'mal'], ['mal', 'mal'], ['x', 'mal'], ['liter', 'l'], ['l', 'l'], ['schläge', '/min'],
];
const VERGLEICH: Array<[RegExp, string]> = [
  [/(≥|>=|mindestens|ab)\s*$/, '≥'], [/(≤|<=|höchstens|maximal|max\.|bis zu)\s*$/, '≤'],
  [/(<|unter|weniger als)\s*$/, '<'], [/(>|über|mehr als)\s*$/, '>'],
];

export interface Zahl { wert: number; bis?: number; einheit?: string; vergleich?: string; roh: string; }

export function extrahiereZahlen(text: string): Zahl[] {
  const t = normalisiere(text);
  const out: Zahl[] = [];
  const wortMuster = Object.keys(ZAHLWOERTER).sort((a, b) => b.length - a.length).join('|');
  const re = new RegExp(
    `(\\d+(?:[.,]\\d+)?|\\b(?:${wortMuster})\\b)(?:\\s*(?:-|bis)\\s*(\\d+(?:[.,]\\d+)?))?`, 'gu');
  let m: RegExpExecArray | null;
  while ((m = re.exec(t))) {
    const roh0 = m[1];
    const istWort = !/\d/.test(roh0);
    let wert = istWort ? ZAHLWOERTER[roh0] : parseFloat(roh0.replace(',', '.'));
    const bis = m[2] ? parseFloat(m[2].replace(',', '.')) : undefined;
    const rest = t.slice(re.lastIndex);
    let einheit: string | undefined;
    for (const [s, n] of EINHEITEN) {
      if (rest.startsWith(' ' + s) || rest.startsWith(s)) {
        const after = rest.slice(rest.startsWith(' ') ? s.length + 1 : s.length)[0];
        if (after === undefined || !/\p{L}/u.test(after) || s.endsWith('.')) { einheit = n; break; }
      }
    }
    if (/mal$/.test(roh0)) einheit = 'mal';
    // "ein/eine" ohne Einheit ist fast immer ein Artikel, kein Zahlwert
    if (istWort && wert === 1 && !einheit && roh0 !== 'eins') continue;
    const davor = t.slice(Math.max(0, m.index - 15), m.index);
    const vergleich = VERGLEICH.find(([r]) => r.test(davor))?.[1];
    out.push({ wert, bis, einheit, vergleich, roh: m[0] + (einheit ? ' ' + einheit : '') });
  }
  return out;
}

const gleicheZahl = (a: Zahl, b: Zahl) =>
  a.wert === b.wert && (a.bis ?? null) === (b.bis ?? null) && (a.vergleich ?? '') === (b.vergleich ?? '');

export function pruefeZahlen(claim: PruefClaim, belegTexte: string[], modus: Modus): PruefBefund[] {
  if (claim.kind === 'lernhilfe' || claim.kind === 'ergaenzung' || claim.kind === 'struktur') return [];
  const quelle = belegTexte.flatMap(extrahiereZahlen);
  const befunde: PruefBefund[] = [];
  for (const z of extrahiereZahlen(claim.text)) {
    const treffer = quelle.filter(q => gleicheZahl(q, z));
    const mitEinheit = treffer.find(q => (q.einheit ?? '') === (z.einheit ?? '') || !z.einheit || !q.einheit);
    if (mitEinheit) continue;
    if (treffer.length) {
      befunde.push({ pruefung: 'Q2', schwere: 'blocker', claimId: claim.id,
        meldung: `Einheit weicht ab: „${z.roh}“, Quelle hat „${treffer[0].roh}“.` });
    } else {
      befunde.push({ pruefung: 'Q2', schwere: modus === 'originalgetreu' ? 'blocker' : 'warnung', claimId: claim.id,
        meldung: `Zahl „${z.roh}“ steht in keinem Beleg.` });
    }
  }
  return befunde;
}

/** Q2b: gleiche Einheit, anderer Wert in Belegen verschiedener Dokumente (grober Hinweis auf Widerspruch). */
export function pruefeZahlenwiderspruch(claim: PruefClaim): PruefBefund[] {
  const jeDok = new Map<string, Zahl[]>();
  for (const c of claim.citations) {
    const arr = jeDok.get(c.documentId) ?? [];
    arr.push(...extrahiereZahlen(c.quote).filter(z => z.einheit && z.einheit !== 'mal'));
    jeDok.set(c.documentId, arr);
  }
  if (jeDok.size < 2) return [];
  const [a, ...rest] = [...jeDok.values()];
  for (const za of a) for (const other of rest) {
    const gleicheEinheit = other.filter(zb => zb.einheit === za.einheit);
    if (gleicheEinheit.length && !gleicheEinheit.some(zb => gleicheZahl(za, zb)))
      return [{ pruefung: 'Q2b', schwere: 'warnung', claimId: claim.id,
        meldung: `Quellen nennen unterschiedliche Werte (${za.roh} vs. ${gleicheEinheit[0].roh}). Als Widerspruch kennzeichnen?` }];
  }
  return [];
}

// ---------------------------------------------------------------------------
// Q3: Fachbegriffe
// ---------------------------------------------------------------------------

export type Begriff = Pick<CatalogGlossaryEntry, 'term' | 'abbreviation' | 'synonyms'>;

const enthaelt = (text: string, wort: string) =>
  new RegExp(`(^|[^\\p{L}])${normalisiere(wort).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'u').test(normalisiere(text));

export function pruefeBegriffe(claim: PruefClaim, belegTexte: string[], glossar: Begriff[]): PruefBefund[] {
  if (claim.kind === 'struktur') return [];
  const quelle = belegTexte.join(' ');
  const befunde: PruefBefund[] = [];
  for (const b of glossar) {
    const inQuelle = enthaelt(quelle, b.term) || (b.abbreviation && enthaelt(quelle, b.abbreviation));
    const inClaim = enthaelt(claim.text, b.term) || (b.abbreviation && enthaelt(claim.text, b.abbreviation));
    if (!inQuelle || inClaim) continue;
    const ersatz = (b.synonyms ?? []).find(s => enthaelt(claim.text, s));
    if (ersatz) befunde.push({ pruefung: 'Q3a', schwere: 'warnung', claimId: claim.id,
      meldung: `Fachbegriff „${b.term}“ der Quelle wurde durch „${ersatz}“ ersetzt.` });
  }
  if (claim.kind === 'definition' && !/["„“]/.test(claim.text))
    befunde.push({ pruefung: 'Q3b', schwere: 'warnung', claimId: claim.id,
      meldung: 'Definition ist nicht als wörtliches Zitat wiedergegeben.' });
  return befunde;
}

// ---------------------------------------------------------------------------
// Q4: Vollständigkeit im Arbeitsauftragsmodus
// ---------------------------------------------------------------------------

export interface AufgabeSoll { nr: string; geforderteAnzahl?: number; pflichtUeberschriften?: string[]; }

/** Zählt Aufzählungspunkte der obersten Ebene (Unterpunkte mit Einrückung zählen nicht). */
export function zaehlePunkte(abschnitt: string): number {
  const zeilen = abschnitt.split('\n').filter(z => /^([-*•]|\d+[.)])\s+\S/.test(z));
  return zeilen.length;
}

export function pruefeAufgaben(antwort: string, soll: AufgabeSoll[]): PruefBefund[] {
  const befunde: PruefBefund[] = [];
  const ist = [...antwort.matchAll(/<aufgabe nr="([^"]+)">([\s\S]*?)<\/aufgabe>/g)].map(m => ({ nr: m[1], text: m[2] }));
  const istNr = ist.map(a => a.nr);
  for (const a of soll) {
    const gefunden = ist.find(x => x.nr === a.nr);
    if (!gefunden) { befunde.push({ pruefung: 'Q4a', schwere: 'blocker', aufgabeNr: a.nr, meldung: `Aufgabe ${a.nr} wurde nicht bearbeitet.` }); continue; }
    if (a.geforderteAnzahl !== undefined) {
      const n = zaehlePunkte(gefunden.text);
      if (n !== a.geforderteAnzahl) befunde.push({ pruefung: 'Q4b', schwere: 'blocker', aufgabeNr: a.nr,
        meldung: `Aufgabe ${a.nr}: ${n} Punkte statt der geforderten ${a.geforderteAnzahl}.` });
    }
    for (const teil of a.pflichtUeberschriften ?? []) {
      if (!new RegExp(`(^|\\n)\\s*(#+\\s*|\\*\\*)?${teil}\\b`, 'i').test(gefunden.text))
        befunde.push({ pruefung: 'Q4c', schwere: 'blocker', aufgabeNr: a.nr, meldung: `Aufgabe ${a.nr}: Bestandteil „${teil}“ fehlt.` });
    }
  }
  const sollNr = soll.map(a => a.nr).filter(n => istNr.includes(n));
  if (istNr.filter(n => sollNr.includes(n)).join() !== sollNr.join())
    befunde.push({ pruefung: 'Q4a', schwere: 'warnung', meldung: 'Aufgaben stehen nicht in der vorgegebenen Reihenfolge.' });
  for (const n of istNr) if (!soll.some(a => a.nr === n))
    befunde.push({ pruefung: 'Q4a', schwere: 'hinweis', aufgabeNr: n, meldung: `Abschnitt für unbekannte Aufgabe ${n}.` });
  return befunde;
}

// ---------------------------------------------------------------------------
// Q6: Markierungen
// ---------------------------------------------------------------------------

const TAGS = ['ergaenzung', 'lernhilfe', 'fehlt', 'unleserlich', 'widerspruch', 'rueckfrage', 'aufgabe'] as const;
const ERLAUBT: Record<Modus, string[]> = {
  originalgetreu: ['fehlt', 'unleserlich', 'widerspruch', 'rueckfrage'],
  lernen: ['ergaenzung', 'lernhilfe', 'fehlt', 'unleserlich', 'widerspruch', 'rueckfrage'],
  arbeitsauftrag: ['ergaenzung', 'fehlt', 'unleserlich', 'widerspruch', 'rueckfrage', 'aufgabe'],
  pruefung: ['ergaenzung', 'lernhilfe', 'fehlt', 'unleserlich', 'widerspruch', 'rueckfrage'],
  vergleich: ['fehlt', 'unleserlich', 'widerspruch', 'rueckfrage'],
};

export function pruefeMarkierungen(text: string, modus: Modus): PruefBefund[] {
  const befunde: PruefBefund[] = [];
  const stack: string[] = [];
  for (const m of text.matchAll(/<(\/?)([a-z]+)(?:\s[^>]*)?>/g)) {
    const [, zu, name] = m;
    if (!(TAGS as readonly string[]).includes(name)) continue;
    if (!zu) {
      if (!ERLAUBT[modus].includes(name))
        befunde.push({ pruefung: 'Q6a', schwere: 'blocker', meldung: `Markierung <${name}> ist im Modus „${modus}“ nicht erlaubt.` });
      if (stack.length && name !== 'aufgabe' && stack[stack.length - 1] !== 'aufgabe')
        befunde.push({ pruefung: 'Q6b', schwere: 'warnung', meldung: `<${name}> ist in <${stack[stack.length - 1]}> verschachtelt.` });
      stack.push(name);
    } else if (stack[stack.length - 1] === name) stack.pop();
    else befunde.push({ pruefung: 'Q6b', schwere: 'warnung', meldung: `</${name}> ohne passende öffnende Markierung.` });
  }
  for (const offen of stack) befunde.push({ pruefung: 'Q6b', schwere: 'warnung', meldung: `<${offen}> wird nicht geschlossen.` });
  return befunde;
}

// ---------------------------------------------------------------------------
// Alle Code-Prüfungen zusammen
// ---------------------------------------------------------------------------

export interface PruefKontext {
  modus: Modus; chunks: Map<string, Chunk>; erlaubteDokumente: Set<string>; glossar: Begriff[];
  aufgaben?: AufgabeSoll[]; antwortText: string;
}

export function pruefeAlles(claims: PruefClaim[], k: PruefKontext): PruefBefund[] {
  const befunde: PruefBefund[] = [...pruefeMarkierungen(k.antwortText, k.modus)];
  if (k.aufgaben) befunde.push(...pruefeAufgaben(k.antwortText, k.aufgaben));
  for (const c of claims) {
    const ohneBelegErlaubt = ['struktur', 'lernhilfe', 'ergaenzung', 'fehlt', 'rueckfrage'].includes(c.kind);
    if (!c.citations.length && !ohneBelegErlaubt) {
      befunde.push({ pruefung: 'Q1c', schwere: k.modus === 'originalgetreu' ? 'blocker' : 'warnung', claimId: c.id,
        meldung: `Aussage ohne Beleg: „${kurz(c.text)}“` });
      continue;
    }
    const belegTexte: string[] = [];
    for (const b of c.citations) {
      const ch = k.chunks.get(b.chunkId);
      if (!ch || !k.erlaubteDokumente.has(ch.documentId)) {
        befunde.push({ pruefung: 'Q1d', schwere: 'blocker', claimId: c.id, meldung: `Beleg zeigt auf keine ausgewählte Quelle (${b.chunkId}).` });
        continue;
      }
      const t = findeZitat(ch.text, b.quote);
      if (t.art === 'nein') {
        befunde.push({ pruefung: 'Q1a', schwere: 'blocker', claimId: c.id, meldung: `Zitat steht nicht auf S. ${ch.printedPage ?? ch.page}: „${kurz(b.quote)}“` });
        continue;
      }
      if (t.art === 'unscharf')
        befunde.push({ pruefung: 'Q1a', schwere: 'warnung', claimId: c.id, meldung: `Zitat nur ähnlich (${Math.round(t.aehnlichkeit * 100)} %) auf S. ${ch.printedPage ?? ch.page}.` });
      b.charStart = t.start; b.charEnd = t.end; b.page = ch.page; b.printedPage = ch.printedPage; b.documentId = ch.documentId;
      if ((ch.ocrConfidence ?? 1) < 0.75 || ch.illegibleSpans?.some(s => t.start! < s.end && t.end! > s.start))
        befunde.push({ pruefung: 'Q5', schwere: 'warnung', claimId: c.id, meldung: `Quelle auf S. ${ch.printedPage ?? ch.page} ist schlecht lesbar.` });
      belegTexte.push(b.quote);
    }
    if (belegTexte.length) {
      befunde.push(...pruefeZahlen(c, belegTexte, k.modus));
      befunde.push(...pruefeBegriffe(c, belegTexte, k.glossar));
      befunde.push(...pruefeZahlenwiderspruch(c));
    }
  }
  return befunde;
}

export function ampel(befunde: PruefBefund[]): 'gruen' | 'gelb' | 'rot' {
  if (befunde.some(b => b.schwere === 'blocker')) return 'rot';
  if (befunde.some(b => b.schwere === 'warnung')) return 'gelb';
  return 'gruen';
}

const kurz = (s: string, n = 80) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
