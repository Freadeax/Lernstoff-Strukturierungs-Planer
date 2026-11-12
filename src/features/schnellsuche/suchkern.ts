// Suchkern des Schnellsuchers: invertierter Index im Speicher, rein und testbar.
//
// Was er kann:
// - Umlaute egal (ü = ue = u), Groß/Klein egal, einfache deutsche Endungen (Schmerzen = Schmerz).
// - Wortteile in Komposita („prophylaxe“ findet „Dekubitusprophylaxe“), Wortanfänge beim Tippen.
// - Tippfehler: je nach Wortlänge 1 bis 2 Zeichen Abstand (Damerau-Levenshtein, Vertauschung zählt 1).
// - Synonyme und Abkürzungen (Druckgeschwür → Dekubitus, IAD → inkontinenzassoziierte Dermatitis).
// - „Phrase in Anführungszeichen“, -ausschließen, Filter im Suchtext (ebene:p, art:uebung, P3, k3).
// - Alle Begriffe müssen passen; sonst Rückfall auf Teiltreffer, deutlich gekennzeichnet.
// - Facetten mit Anzahlen je Standard, Ebene und Art.
//
// Der Index wird beim Öffnen der Seite einmal aufgebaut (wenige Millisekunden) und nicht gespeichert:
// keine Datenbanktabelle, keine DB-Version.

export type Ebene = 'S' | 'P' | 'E';
export type Art = 'standard' | 'kriterium' | 'kernaussage' | 'instrument' | 'begriff' | 'uebung';

export const EBENE_NAME: Record<Ebene, string> = { S: 'Struktur', P: 'Prozess', E: 'Ergebnis' };
export const ART_NAME: Record<Art, string> = {
  standard: 'Standard', kriterium: 'Kriterium', kernaussage: 'Kernaussage', instrument: 'Instrument', begriff: 'Fachbegriff', uebung: 'Übung',
};
export const ARTEN: Art[] = ['standard', 'kriterium', 'kernaussage', 'instrument', 'begriff', 'uebung'];

/** Ein durchsuchbarer Eintrag. Quellen (DNQP-Daten, Trainer, Glossar, Instrumente) werden darauf abgebildet. */
export interface SuchDok {
  id: string;
  art: Art;
  titel: string;
  text: string;
  /** Einordnung für die Anzeige, z. B. „Sturzprophylaxe · Kriterium 3“. */
  pfad?: string;
  standardIds: string[];
  ebene?: Ebene;
  /** Nummer des Kriteriums (Ebene 1..n im Standard). */
  kriterium?: number;
  stichworte?: string[];
  /** Ziel in der App (Hash-Pfad ohne #). */
  link?: string;
  /** Zusätzliche Zeilen für die Detailansicht (z. B. richtige Antwort, Begründung). */
  details?: Array<{ label: string; text: string }>;
}

// ---------------------------------------------------------------- Normalisieren

/** Kleinbuchstaben, ß → ss, Akzente und Umlautpunkte weg (ä = a). */
export function falte(s: string): string {
  return s.toLowerCase().replace(/ß/g, 'ss').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Umschrift ohne Umlaut-Tasten (ae, oe, ue) auf den Grundvokal. Nur für Suchwörter als zweite Lesart:
 * im Index würde es Wortfugen zerstören („Risikoeinschätzung“).
 */
export function ohneUmschrift(s: string): string {
  return s.replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u');
}

const ENDUNGEN = ['ungen', 'innen', 'ern', 'en', 'er', 'es', 'em', 'e', 'n', 's'];

/** Sehr leichte Stammform: nur häufige Flexionsendungen, Wortkern bleibt mindestens 4 Zeichen. */
export function stamm(wort: string): string {
  if (wort.length <= 4 || /\d/.test(wort)) return wort;
  for (const e of ENDUNGEN) if (wort.endsWith(e) && wort.length - e.length >= 4) return wort.slice(0, -e.length);
  return wort;
}

export const STOPP = new Set(['der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einer', 'eines', 'einem', 'einen', 'und', 'oder', 'mit', 'bei', 'von', 'vom',
  'fur', 'im', 'in', 'zu', 'zur', 'zum', 'auf', 'an', 'am', 'ist', 'sind', 'wird', 'werden', 'als', 'auch', 'nicht', 'wie', 'was', 'so', 'es', 'sie', 'er', 'sich', 'aus', 'nach', 'um', 'uber', 'dass', 'wenn', 'nur']);

/** Wörter eines Textes: Originalform (klein) und Suchschlüssel. */
export function woerter(text: string): Array<{ form: string; schluessel: string }> {
  const out: Array<{ form: string; schluessel: string }> = [];
  for (const w of text.split(/[^\p{L}\p{N}]+/u)) {
    if (!w) continue;
    const form = w.toLowerCase();
    const f = falte(w);
    if (!f || STOPP.has(f)) continue;
    out.push({ form, schluessel: stamm(f) });
  }
  return out;
}

/** Ganzer Text als eine gefaltete Zeichenkette mit einfachen Leerzeichen (für Phrasen). */
export function flach(text: string): string {
  return ' ' + falte(text).replace(/[^a-z0-9]+/g, ' ').trim() + ' ';
}

// ---------------------------------------------------------------- Tippfehlerabstand

/** Damerau-Levenshtein (eingeschränkt) mit Abbruch, sobald `max` sicher überschritten ist. */
export function abstand(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const n = a.length, m = b.length;
  let vorvor: number[] = [];
  let vor = Array.from({ length: m + 1 }, (_, j) => j);
  for (let i = 1; i <= n; i++) {
    const akt = [i];
    let zeileMin = i;
    for (let j = 1; j <= m; j++) {
      const kosten = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(vor[j]! + 1, akt[j - 1]! + 1, vor[j - 1]! + kosten);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, vorvor[j - 2]! + 1);
      akt[j] = v;
      if (v < zeileMin) zeileMin = v;
    }
    if (zeileMin > max) return max + 1;
    vorvor = vor;
    vor = akt;
  }
  return vor[m]!;
}

/** Erlaubte Tippfehler je Wortlänge. */
export function toleranz(laenge: number): number {
  return laenge <= 4 ? 0 : laenge <= 7 ? 1 : 2;
}

// ---------------------------------------------------------------- Index

type Feld = 'titel' | 'stichwort' | 'pfad' | 'text';
const GEWICHT: Record<Feld, number> = { titel: 4, stichwort: 3, pfad: 1.5, text: 1 };
const ART_GEWICHT: Record<Art, number> = { standard: 1.4, kriterium: 1.3, kernaussage: 1.15, instrument: 1.1, begriff: 1, uebung: 0.85 };

export interface Index {
  doks: SuchDok[];
  /** Schlüssel → (Dok-Nummer → Gewicht im Dok). */
  terme: Map<string, Map<number, number>>;
  /** Schlüssel → Originalformen (für Hervorhebung und Anzeige). */
  formen: Map<string, Map<string, number>>;
  vokabel: string[];
  /** Gefalteter Volltext je Dok (Phrasen, Ausschluss). */
  flach: string[];
  /** Synonymgruppen: Schlüssel → Alternativen (je eine Folge von Schlüsseln). */
  synonyme: Map<string, string[][]>;
}

/** Synonymgruppen: jede Zeile sind gleichwertige Ausdrücke (ein- oder mehrteilig). */
export type SynonymGruppen = string[][];

export function baueIndex(doks: SuchDok[], gruppen: SynonymGruppen = []): Index {
  const terme = new Map<string, Map<number, number>>();
  const formen = new Map<string, Map<string, number>>();
  const textLaengen = doks.map((d) => woerter(d.text).length);
  const mittel = Math.max(1, textLaengen.reduce((a, b) => a + b, 0) / Math.max(1, doks.length));

  doks.forEach((d, nr) => {
    const felder: Array<[Feld, string]> = [['titel', d.titel], ['stichwort', (d.stichworte ?? []).join(' · ')], ['pfad', d.pfad ?? ''], ['text', d.text]];
    const jeTerm = new Map<string, number>();
    for (const [feld, inhalt] of felder) {
      const zaehler = new Map<string, number>();
      for (const w of woerter(inhalt)) {
        zaehler.set(w.schluessel, (zaehler.get(w.schluessel) ?? 0) + 1);
        let f = formen.get(w.schluessel);
        if (!f) formen.set(w.schluessel, (f = new Map()));
        f.set(w.form, (f.get(w.form) ?? 0) + 1);
      }
      const norm = feld === 'text' ? Math.sqrt(Math.max(1, textLaengen[nr]!) / mittel) : 1;
      for (const [s, tf] of zaehler) jeTerm.set(s, (jeTerm.get(s) ?? 0) + GEWICHT[feld] * (1 + Math.log(tf)) / Math.max(1, norm));
    }
    for (const [s, g] of jeTerm) {
      let p = terme.get(s);
      if (!p) terme.set(s, (p = new Map()));
      p.set(nr, g);
    }
  });

  const synonyme = new Map<string, string[][]>();
  for (const gruppe of gruppen) {
    const folgen = gruppe.map((a) => woerter(a).map((w) => w.schluessel)).filter((f) => f.length);
    for (const f of folgen) {
      if (f.length !== 1) continue; // nur einteilige Ausdrücke lösen eine Erweiterung aus
      const liste = synonyme.get(f[0]!) ?? [];
      for (const anders of folgen) if (anders.join(' ') !== f[0] && !liste.some((x) => x.join(' ') === anders.join(' '))) liste.push(anders);
      synonyme.set(f[0]!, liste);
    }
  }

  return { doks, terme, formen, vokabel: [...terme.keys()], flach: doks.map((d) => flach(`${d.titel} ${(d.stichworte ?? []).join(' ')} ${d.text}`)), synonyme };
}

/** Häufigste Originalform eines Schlüssels (für „Meintest du“ und Vorschläge). */
export function anzeigeForm(index: Index, schluessel: string): string {
  const f = index.formen.get(schluessel);
  if (!f) return schluessel;
  return [...f.entries()].sort((a, b) => b[1] - a[1])[0]![0];
}

// ---------------------------------------------------------------- Anfrage zerlegen

export interface Anfrage {
  /** Einzelne Suchbegriffe (Originaltext). */
  begriffe: string[];
  phrasen: string[];
  ohne: string[];
  ebene?: Ebene;
  kriterium?: number;
  art?: Art;
  /** Rohtext hinter standard:… (die Oberfläche löst ihn zu einer ID auf). */
  standard?: string;
}

const ART_ALIAS: Record<string, Art> = {
  standard: 'standard', standards: 'standard', kriterium: 'kriterium', kriterien: 'kriterium', kernaussage: 'kernaussage', kernaussagen: 'kernaussage',
  instrument: 'instrument', instrumente: 'instrument', skala: 'instrument', assessment: 'instrument', begriff: 'begriff', glossar: 'begriff', fachbegriff: 'begriff',
  uebung: 'uebung', ubung: 'uebung', übung: 'uebung', aufgabe: 'uebung', aufgaben: 'uebung', quiz: 'uebung',
};
const EBENE_ALIAS: Record<string, Ebene> = { s: 'S', struktur: 'S', p: 'P', prozess: 'P', e: 'E', ergebnis: 'E' };

export function zerlege(q: string): Anfrage {
  const a: Anfrage = { begriffe: [], phrasen: [], ohne: [] };
  const rest = q.replace(/"([^"]+)"|„([^“”"]+)[“”"]?/g, (_, x?: string, y?: string) => { const p = (x ?? y ?? '').trim(); if (p) a.phrasen.push(p); return ' '; });
  for (const roh of rest.split(/\s+/).filter(Boolean)) {
    const t = roh.trim();
    const filter = /^(ebene|e|art|a|standard|st|kriterium|k):(.+)$/i.exec(t);
    if (filter) {
      const [, schl, wert] = filter;
      const w = wert!.toLowerCase();
      const k = schl!.toLowerCase();
      if (k === 'ebene' || k === 'e') { if (EBENE_ALIAS[w]) a.ebene = EBENE_ALIAS[w]; continue; }
      if (k === 'art' || k === 'a') { if (ART_ALIAS[w]) a.art = ART_ALIAS[w]; continue; }
      if (k === 'standard' || k === 'st') { a.standard = wert; continue; }
      if (/^\d+$/.test(w)) { a.kriterium = Number(w); continue; }
    }
    // Schreibweise der Standards: S1, P3, E2 (Ebene + Kriterium) oder k3 (nur Kriterium)
    const kurz = /^([spek])(\d{1,2})$/i.exec(t);
    if (kurz) {
      const b = kurz[1]!.toLowerCase();
      a.kriterium = Number(kurz[2]);
      if (b !== 'k') a.ebene = b.toUpperCase() as Ebene;
      continue;
    }
    if (t.startsWith('-') && t.length > 2) { a.ohne.push(t.slice(1)); continue; }
    a.begriffe.push(t);
  }
  return a;
}

// ---------------------------------------------------------------- Suchen

export type TrefferArt = 'exakt' | 'synonym' | 'anfang' | 'wortteil' | 'unscharf';

interface Kandidat { schluessel: string; faktor: number; wie: TrefferArt }

/** Welche Schlüssel des Index ein Suchwort trifft, mit Abschlag je nach Art des Treffers. */
export function kandidaten(index: Index, wort: string): Kandidat[] {
  const fw = woerter(wort)[0];
  if (!fw) return [];
  const gefaltet = falte(wort).replace(/[^a-z0-9]/g, '');
  const alt = ohneUmschrift(gefaltet);
  if (alt === gefaltet) return kandidatenFuer(index, fw.schluessel, gefaltet);
  // „mangelernaehrung“: beide Lesarten prüfen, je Schlüssel die bessere behalten
  const beste = new Map<string, Kandidat>();
  for (const k of [...kandidatenFuer(index, fw.schluessel, gefaltet), ...kandidatenFuer(index, stamm(alt), alt)]) {
    const da = beste.get(k.schluessel);
    if (!da || k.faktor > da.faktor) beste.set(k.schluessel, k);
  }
  return [...beste.values()];
}

function kandidatenFuer(index: Index, q: string, roh: string): Kandidat[] {
  const tol = toleranz(roh.length);
  const out: Kandidat[] = [];
  if (index.terme.has(q)) out.push({ schluessel: q, faktor: 1, wie: 'exakt' });
  for (const t of index.vokabel) {
    if (t === q) continue;
    if (q.length >= 3 && (t.startsWith(q) || (roh.length >= 3 && t.startsWith(roh)))) { out.push({ schluessel: t, faktor: q.length >= 5 ? 0.8 : 0.65, wie: 'anfang' }); continue; }
    if (q.length >= 4 && t.includes(q)) { out.push({ schluessel: t, faktor: 0.55, wie: 'wortteil' }); continue; }
    if (tol === 0) continue;
    const d = abstand(q, t, tol);
    if (d <= tol) { out.push({ schluessel: t, faktor: d === 1 ? 0.6 : 0.42, wie: 'unscharf' }); continue; }
    // Tippfehler im vorderen Teil eines Kompositums: „dekubitis“ → „dekubitusprophylaxe“
    if (t.length > q.length + 2 && abstand(q, t.slice(0, q.length), tol) <= tol) out.push({ schluessel: t, faktor: 0.38, wie: 'unscharf' });
  }
  return out;
}

export interface Treffer {
  dok: SuchDok;
  punkte: number;
  /** Originalformen, die hervorgehoben werden. */
  woerter: string[];
  /** Wie gut die Begriffe getroffen wurden (schlechteste Art). */
  guete: TrefferArt;
}

export interface Facetten {
  standard: Map<string, number>;
  ebene: Map<Ebene, number>;
  art: Map<Art, number>;
}

export interface Filter { standardIds?: string[]; ebene?: Ebene; art?: Art; kriterium?: number }

export interface Ergebnis {
  treffer: Treffer[];
  /** Anzahl aller Treffer vor dem Abschneiden auf `max`. */
  gesamt: number;
  /** Nicht alle Begriffe gefunden: Teiltreffer. */
  teilweise: boolean;
  /** Begriffe ohne einen einzigen Treffer. */
  ohneTreffer: string[];
  /** Tippfehler-Korrekturen für „Meintest du …“. */
  korrekturen: Array<{ von: string; zu: string }>;
  facetten: Facetten;
  anfrage: Anfrage;
  filter: Filter;
}

const RANG: Record<TrefferArt, number> = { exakt: 0, synonym: 1, anfang: 2, wortteil: 3, unscharf: 4 };

interface Slot { wort: string; punkte: Map<number, number>; formen: Map<number, Set<string>>; wie: Map<number, TrefferArt>; korrektur?: string }

function idf(index: Index, s: string): number {
  const df = index.terme.get(s)?.size ?? 0;
  return Math.log(1 + index.doks.length / Math.max(1, df));
}

function formenVon(index: Index, s: string): string[] {
  return [...(index.formen.get(s)?.keys() ?? [])];
}

function slotFuer(index: Index, wort: string): Slot {
  const slot: Slot = { wort, punkte: new Map(), formen: new Map(), wie: new Map() };
  const merke = (nr: number, p: number, s: string[], wie: TrefferArt) => {
    if (p > (slot.punkte.get(nr) ?? 0)) { slot.punkte.set(nr, p); }
    const alt = slot.wie.get(nr);
    if (alt === undefined || RANG[wie] < RANG[alt]) slot.wie.set(nr, wie);
    let f = slot.formen.get(nr);
    if (!f) slot.formen.set(nr, (f = new Set()));
    for (const x of s) f.add(x);
  };
  const ks = kandidaten(index, wort);
  for (const k of ks) {
    const w = idf(index, k.schluessel) * k.faktor;
    const fs = formenVon(index, k.schluessel);
    for (const [nr, g] of index.terme.get(k.schluessel) ?? []) merke(nr, g * w, fs, k.wie);
  }
  // Synonyme: exakter Schlüssel oder Wortanfang; mehrteilige Synonyme müssen ganz vorkommen.
  const q = woerter(wort)[0]?.schluessel;
  for (const folge of (q && index.synonyme.get(q)) || []) {
    const teile = folge.map((s) => {
      const treffer = new Map<number, number>();
      const fs: string[] = [];
      for (const t of index.vokabel) {
        if (t !== s && !(s.length >= 5 && t.startsWith(s))) continue;
        fs.push(...formenVon(index, t));
        for (const [nr, g] of index.terme.get(t) ?? []) treffer.set(nr, Math.max(treffer.get(nr) ?? 0, g * idf(index, t) * (t === s ? 0.85 : 0.65)));
      }
      return { treffer, fs };
    });
    const [erstes, ...rest] = teile;
    for (const [nr, p] of erstes?.treffer ?? []) {
      if (!rest.every((r) => r.treffer.has(nr))) continue;
      const summe = rest.reduce((acc, r) => Math.min(acc, r.treffer.get(nr)!), p);
      merke(nr, summe, teile.flatMap((t) => t.fs), 'synonym');
    }
  }
  if (!ks.some((k) => k.wie !== 'unscharf') && ks.length) {
    const beste = ks.slice().sort((a, b) => (index.terme.get(b.schluessel)!.size * b.faktor) - (index.terme.get(a.schluessel)!.size * a.faktor))[0]!;
    slot.korrektur = anzeigeForm(index, beste.schluessel);
  }
  return slot;
}

function passtFilter(d: SuchDok, f: Filter, ohne?: keyof Filter): boolean {
  if (ohne !== 'standardIds' && f.standardIds?.length && !d.standardIds.some((s) => f.standardIds!.includes(s))) return false;
  if (ohne !== 'ebene' && f.ebene && d.ebene !== f.ebene) return false;
  if (ohne !== 'art' && f.art && d.art !== f.art) return false;
  if (ohne !== 'kriterium' && f.kriterium !== undefined && d.kriterium !== f.kriterium) return false;
  return true;
}

/**
 * Sucht im Index. `filter` kommt aus der Oberfläche (Knöpfe); Filter im Suchtext (P3, ebene:p, art:…)
 * werden damit zusammengeführt, die Oberfläche hat Vorrang.
 */
export function suche(index: Index, q: string, filter: Filter = {}, max = 60): Ergebnis {
  const anfrage = zerlege(q);
  const f: Filter = {
    standardIds: filter.standardIds,
    ebene: filter.ebene ?? anfrage.ebene,
    art: filter.art ?? anfrage.art,
    kriterium: filter.kriterium ?? anfrage.kriterium,
  };
  const leer: Ergebnis = { treffer: [], gesamt: 0, teilweise: false, ohneTreffer: [], korrekturen: [], facetten: { standard: new Map(), ebene: new Map(), art: new Map() }, anfrage, filter: f };

  const slots = anfrage.begriffe.filter((b) => woerter(b).length).map((b) => slotFuer(index, b));
  const phrasen = anfrage.phrasen.map(flach).map((p) => p.trim()).filter(Boolean);
  const ohne = anfrage.ohne.map((o) => woerter(o)[0]?.schluessel).filter((x): x is string => !!x);
  const nurFilter = !slots.length && !phrasen.length;
  if (nurFilter && !f.standardIds?.length && !f.ebene && !f.art && f.kriterium === undefined) return leer;

  const ohneTreffer = slots.filter((s) => !s.punkte.size).map((s) => s.wort);
  const aktive = slots.filter((s) => s.punkte.size);

  // Kandidaten: alle Begriffe (UND); wenn das nichts ergibt, Teiltreffer (ODER) mit Abstufung.
  const sammle = (und: boolean): Map<number, number> => {
    const out = new Map<number, number>();
    const basis = nurFilter || (!aktive.length && phrasen.length) ? index.doks.map((_, i) => i) : [...new Set(aktive.flatMap((s) => [...s.punkte.keys()]))];
    for (const nr of basis) {
      const fl = index.flach[nr]!;
      if (phrasen.some((p) => !fl.includes(` ${p} `) && !fl.includes(` ${p}`))) continue;
      if (ohne.length && woerter(fl).some((w) => ohne.includes(w.schluessel))) continue;
      let p = 0, anzahl = 0;
      for (const s of aktive) { const x = s.punkte.get(nr); if (x) { p += x; anzahl++; } }
      if (und && anzahl < aktive.length) continue;
      if (!und && anzahl === 0) continue;
      if (!und) p *= anzahl / aktive.length;
      const d = index.doks[nr]!;
      p = (p || 1) * ART_GEWICHT[d.art] * (phrasen.length ? 1.5 : 1);
      // Alle Begriffe im Titel: deutlich nach oben
      if (aktive.length && aktive.every((s) => [...(s.formen.get(nr) ?? [])].some((fo) => d.titel.toLowerCase().includes(fo)))) p *= 1.6;
      out.set(nr, p);
    }
    return out;
  };
  let roh = sammle(true);
  let teilweise = false;
  if (!roh.size && aktive.length > 1) { roh = sammle(false); teilweise = roh.size > 0; }
  if (ohneTreffer.length && aktive.length) teilweise = true;

  const facetten: Facetten = { standard: new Map(), ebene: new Map(), art: new Map() };
  for (const nr of roh.keys()) {
    const d = index.doks[nr]!;
    if (passtFilter(d, f, 'standardIds')) for (const s of new Set(d.standardIds)) facetten.standard.set(s, (facetten.standard.get(s) ?? 0) + 1);
    if (d.ebene && passtFilter(d, f, 'ebene')) facetten.ebene.set(d.ebene, (facetten.ebene.get(d.ebene) ?? 0) + 1);
    if (passtFilter(d, f, 'art')) facetten.art.set(d.art, (facetten.art.get(d.art) ?? 0) + 1);
  }

  const treffer: Treffer[] = [];
  for (const [nr, punkte] of roh) {
    const dok = index.doks[nr]!;
    if (!passtFilter(dok, f)) continue;
    const ws = new Set<string>();
    let guete: TrefferArt = 'exakt';
    for (const s of aktive) {
      for (const x of s.formen.get(nr) ?? []) ws.add(x);
      const w = s.wie.get(nr);
      if (w && RANG[w] > RANG[guete]) guete = w;
    }
    for (const p of anfrage.phrasen) ws.add(p.toLowerCase());
    treffer.push({ dok, punkte, woerter: [...ws], guete });
  }
  // Gleichstand: Kriterien in Standard-Reihenfolge, dann alphabetisch
  treffer.sort((a, b) => b.punkte - a.punkte || (a.dok.kriterium ?? 99) - (b.dok.kriterium ?? 99) || a.dok.titel.localeCompare(b.dok.titel, 'de'));

  const korrekturen = slots.filter((s) => s.korrektur && falte(s.korrektur) !== falte(s.wort)).map((s) => ({ von: s.wort, zu: s.korrektur! }));
  return { treffer: treffer.slice(0, max), gesamt: treffer.length, teilweise, ohneTreffer, korrekturen, facetten, anfrage, filter: f };
}

// ---------------------------------------------------------------- Anzeige-Hilfen

/** Wortvorschläge zum zuletzt getippten Wort (Autovervollständigung), häufige zuerst. */
export function vorschlaege(index: Index, anfang: string, n = 6): string[] {
  const roh = falte(anfang).replace(/[^a-z0-9]/g, '');
  if (roh.length < 2) return [];
  const treffer = index.vokabel.filter((t) => t.startsWith(roh) && t !== roh);
  return treffer
    .sort((a, b) => (index.terme.get(b)!.size - index.terme.get(a)!.size) || a.length - b.length)
    .slice(0, n * 2)
    .map((t) => anzeigeForm(index, t))
    .filter((x, i, arr) => arr.indexOf(x) === i && x.length > anfang.length)
    .slice(0, n);
}

/** Bereiche [start, ende) im Originaltext, an denen ein hervorzuhebendes Wort steht (ganze Wörter). */
export function markierungen(text: string, formen: string[]): Array<[number, number]> {
  if (!formen.length) return [];
  const gesucht = new Set(formen.map((f) => f.toLowerCase()));
  const phrasen = formen.filter((f) => /\s/.test(f)).map((f) => f.toLowerCase());
  const out: Array<[number, number]> = [];
  const re = /[\p{L}\p{N}]+/gu;
  for (let m = re.exec(text); m; m = re.exec(text)) if (gesucht.has(m[0].toLowerCase())) out.push([m.index, m.index + m[0].length]);
  const klein = text.toLowerCase();
  for (const p of phrasen) for (let i = klein.indexOf(p); i >= 0; i = klein.indexOf(p, i + p.length)) out.push([i, i + p.length]);
  return out.sort((a, b) => a[0] - b[0]).reduce<Array<[number, number]>>((acc, r) => {
    const last = acc[acc.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]); else acc.push([...r]);
    return acc;
  }, []);
}

/** Kurzer Ausschnitt um die dichteste Stelle der Treffer (ganze Sätze, sonst gekürzt). */
export function ausschnitt(text: string, formen: string[], laenge = 220): string {
  if (text.length <= laenge) return text;
  const saetze = text.match(/[^.!?]+[.!?]*/g) ?? [text];
  const marks = (s: string) => markierungen(s, formen).length;
  let best = 0, bestWert = -1;
  saetze.forEach((s, i) => { const w = marks(s); if (w > bestWert) { bestWert = w; best = i; } });
  let out = saetze[best]!.trim();
  for (let i = best + 1; i < saetze.length && out.length + saetze[i]!.length <= laenge; i++) out += ' ' + saetze[i]!.trim();
  if (out.length > laenge) {
    const m = markierungen(out, formen)[0];
    const start = m ? Math.max(0, m[0] - Math.round(laenge / 3)) : 0;
    out = (start > 0 ? '… ' : '') + out.slice(start, start + laenge).replace(/\s\S*$/, '') + ' …';
  } else {
    if (best > 0) out = '… ' + out;
    if (out.length < text.length && !text.trim().endsWith(out.replace(/^… /, ''))) out += ' …';
  }
  return out;
}
