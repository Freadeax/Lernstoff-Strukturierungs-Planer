// Prüfungssimulation: schriftliche Probeprüfung mit Zeitlimit aus drei Quellen (Glossar, Rechentrainer,
// Prüfungsfragen des Zusammenfassers), gefiltert nach Kompetenzbereichen (PflAPrV Anlage 2) und
// Anforderungsbereichen der Operatoren. Alles hier ist rein (kein React, keine DB), damit Zusammenstellung,
// Wertung und Auswertung testbar sind.

import type { ID } from '../../core/types';
import type { CatalogModule, CatalogTopic, Operator } from '../../modules/catalog-types';
import { erzeugeRunde, karten, type FrageArt } from '../duell/duell';
import { bewerte as bewerteZahl, erzeuge, rng, TYPEN, type AufgabenTyp, type Stufe } from '../rechnen/aufgaben';
import type { FragenSatz, Pruefungsfrage } from '../zusammenfasser/typen';

export type Quelle = 'glossar' | 'rechnen' | 'material';
export type Afb = 1 | 2 | 3;

export const QUELLEN: { id: Quelle; label: string; hinweis: string }[] = [
  { id: 'glossar', label: 'Fachbegriffe', hinweis: 'Multiple Choice aus dem Glossar, offline' },
  { id: 'rechnen', label: 'Pflegerisches Rechnen', hinweis: 'Rechenaufgaben mit Lösungsweg, offline' },
  { id: 'material', label: 'Fragen aus deinem Material', hinweis: 'Prüfungsfragen des Zusammenfassers mit Belegen' },
];
export const QUELLE_LABEL = Object.fromEntries(QUELLEN.map((q) => [q.id, q.label])) as Record<Quelle, string>;
export const AFB_LABEL: Record<Afb, string> = { 1: 'AFB I · Reproduktion', 2: 'AFB II · Transfer', 3: 'AFB III · Reflexion' };

/** Rechentypen gehören zu Arzneimitteln bzw. Infusionen; beide Themen hängen an Kompetenzbereich III.2. */
export const RECHEN_THEMA: Record<AufgabenTyp, ID> = {
  einheiten: 'thema.ph.medikamente', dosis: 'thema.ph.medikamente', mgkg: 'thema.ph.medikamente', prozent: 'thema.ph.medikamente',
  perfusor: 'thema.ph.medikamente', laufrate: 'thema.ph.injektion', tropfen: 'thema.ph.injektion', laufzeit: 'thema.ph.injektion',
};

const GLOSSAR_OPERATOR: Record<FrageArt, string> = { definition: 'benennen', abkuerzung: 'benennen', begriff: 'definieren' };

// ---------- Fragen ----------

interface Basis {
  id: string;
  quelle: Quelle;
  topicId: ID;            // '' = keinem Thema zugeordnet
  operator: string;       // Name wie im Katalog, z. B. „benennen“
  afb: Afb;
  punkte: number;         // erreichbare Punkte
  minuten: number;        // empfohlene Bearbeitungszeit
  frage: string;
  hinweis?: string;
}

export interface AuswahlFrage extends Basis {
  art: 'auswahl';
  optionen: string[];
  richtig: number[];
  mehrfach: boolean;
  begruendungen?: string[];
  erklaerung?: string;
  material?: MaterialBezug;
}

export interface ZahlFrage extends Basis {
  art: 'zahl';
  einheit: string;
  loesung: number;
  toleranz: number;
  schritte: string[];
}

export interface OffeneFrage extends Basis {
  art: 'offen';
  musterloesung: string;
  kriterien: Array<{ kriterium: string; punkte: number }>;
  material: MaterialBezug;
}

/** Herkunft einer Materialfrage: nötig für Belege und die KI-Bewertung. */
export interface MaterialBezug { satzId: ID; satzName: string; dokumentIds: ID[]; frage: Pruefungsfrage }

export type SimFrage = AuswahlFrage | ZahlFrage | OffeneFrage;

export interface Antwort { wahl?: number[]; text?: string }

// ---------- Katalog-Hilfen ----------

export interface Katalog {
  modul: CatalogModule;
  topics: Map<ID, CatalogTopic>;
  operatoren: Map<string, Operator>;     // Name klein → Operator
  kbOberbereich: Map<ID, ID>;            // kb.I.4 → kb.I
  kbName: Map<ID, string>;
}

export function katalog(modul: CatalogModule): Katalog {
  const items = (modul.frameworks ?? []).filter((f) => f.kind === 'kompetenzen').flatMap((f) => f.items);
  const byId = new Map(items.map((i) => [i.id, i]));
  const ober = (id: ID): ID => { let cur = byId.get(id); while (cur?.parentId && byId.has(cur.parentId)) cur = byId.get(cur.parentId); return cur?.id ?? id; };
  return {
    modul,
    topics: new Map(modul.topics.map((t) => [t.id, t])),
    operatoren: new Map((modul.operators ?? []).map((o) => [o.name.toLowerCase(), o])),
    kbOberbereich: new Map(items.map((i) => [i.id, ober(i.id)])),
    kbName: new Map(items.filter((i) => !i.parentId).map((i) => [i.id, `${i.code} · ${i.name}`])),
  };
}

/** Thema und alle Oberthemen, vom Thema aufwärts. */
export function vorfahren(k: Katalog, topicId: ID): CatalogTopic[] {
  const out: CatalogTopic[] = [];
  const seen = new Set<ID>();
  for (let t = k.topics.get(topicId); t && !seen.has(t.id); t = t.parentId ? k.topics.get(t.parentId) : undefined) { seen.add(t.id); out.push(t); }
  return out;
}

/** Kompetenzbereiche (oberste Ebene, z. B. kb.I) eines Themas, geerbt von den Oberthemen. */
export function kompetenzbereiche(k: Katalog, topicId: ID): ID[] {
  const ids = vorfahren(k, topicId).flatMap((t) => t.competencyIds ?? []).filter((c) => k.kbOberbereich.has(c));
  return [...new Set(ids.map((c) => k.kbOberbereich.get(c)!))].sort();
}

export function operatorAfb(k: Katalog, name: string, fallback: Afb): Afb {
  return k.operatoren.get(name.trim().toLowerCase())?.afb ?? fallback;
}

// ---------- Zusammenstellung ----------

export interface Auswahl {
  quellen: Quelle[];
  kb: ID[];               // leer = alle Kompetenzbereiche (auch ohne Zuordnung)
  afb: Afb[];             // leer = alle
  topicIds: ID[];         // leer = alle Themen; sonst Thema oder ein Oberthema muss enthalten sein
  anzahl: number;
  stufe: Stufe;           // für Rechenaufgaben
  satzIds: ID[];          // leer = alle gespeicherten Fragensätze
  seed: number;
}

function mische<T>(xs: T[], next: () => number): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!]; }
  return a;
}

/** Prüft, ob eine Frage zu Thema, Kompetenzbereich und Anforderungsbereich der Auswahl passt. */
export function passtZurAuswahl(k: Katalog, a: Pick<Auswahl, 'kb' | 'afb' | 'topicIds'>, f: Pick<SimFrage, 'topicId' | 'afb'>): boolean {
  if (a.afb.length && !a.afb.includes(f.afb)) return false;
  if (a.topicIds.length && !vorfahren(k, f.topicId).some((t) => a.topicIds.includes(t.id))) return false;
  if (a.kb.length && !kompetenzbereiche(k, f.topicId).some((b) => a.kb.includes(b))) return false;
  return true;
}

export function glossarFragen(k: Katalog, anzahl: number, seed: number, filter: (f: Pick<SimFrage, 'topicId' | 'afb'>) => boolean): AuswahlFrage[] {
  const themaVon = new Map(k.modul.glossary.map((g, i) => [g.id ?? `gl.${i}`, g.topicIds?.[0] ?? '']));
  const alle = karten(k.modul);
  const auswahl = alle.filter((c) => filter({ topicId: themaVon.get(c.id) ?? '', afb: 1 }));
  return erzeugeRunde(alle, auswahl, ['definition', 'abkuerzung', 'begriff'], anzahl, seed).map((f) => ({
    id: `glossar:${f.id}`, quelle: 'glossar', art: 'auswahl', topicId: themaVon.get(f.karte.id) ?? '',
    operator: GLOSSAR_OPERATOR[f.art], afb: 1, punkte: 1, minuten: 1,
    frage: f.frage, hinweis: f.art === 'definition' ? 'Welcher Fachbegriff ist gemeint?' : f.art === 'abkuerzung' ? 'Wofür steht die Abkürzung?' : 'Welche Erklärung passt?',
    optionen: f.optionen, richtig: [f.richtig], mehrfach: false,
    erklaerung: `${f.karte.begriff}${f.karte.abkuerzung && f.karte.abkuerzung !== f.karte.begriff ? ` (${f.karte.abkuerzung})` : ''}: ${f.karte.erklaerung}`,
  }));
}

export function rechenFragen(k: Katalog, anzahl: number, stufe: Stufe, seed: number, filter: (f: Pick<SimFrage, 'topicId' | 'afb'>) => boolean): ZahlFrage[] {
  const afb = operatorAfb(k, 'berechnen', 2);
  const typen = TYPEN.map((t) => t.typ).filter((t) => filter({ topicId: RECHEN_THEMA[t], afb }));
  if (!typen.length) return [];
  const r = rng(seed ^ 0x51ed27);
  const out: ZahlFrage[] = [];
  const reihe = mische(typen, r.next);
  for (let i = 0; i < anzahl; i++) {
    const typ = reihe[i % reihe.length]!;
    const a = erzeuge(typ, stufe, Math.floor(r.next() * 2 ** 31));
    out.push({
      id: `rechnen:${a.id}`, quelle: 'rechnen', art: 'zahl', topicId: RECHEN_THEMA[typ], operator: 'berechnen', afb,
      punkte: 2, minuten: stufe === 3 ? 3 : 2, frage: a.frage, einheit: a.einheit, loesung: a.loesung, toleranz: a.toleranz, schritte: a.schritte,
      hinweis: TYPEN.find((t) => t.typ === typ)?.label,
    });
  }
  return out;
}

const MINUTEN_MATERIAL: Record<Pruefungsfrage['typ'], number> = { mc_einfach: 1.5, mc_mehrfach: 2, offen: 6, fall: 10 };

export function materialFragen(k: Katalog, saetze: FragenSatz[]): SimFrage[] {
  return saetze.flatMap((s) => s.fragen.map((f): SimFrage => {
    const bezug: MaterialBezug = { satzId: s.id, satzName: s.pruefungName, dokumentIds: s.sourceDocumentIds, frage: f };
    const topicId = k.topics.has(f.topicId) ? f.topicId : s.topicIds.find((t) => k.topics.has(t)) ?? '';
    const punkte = f.bewertungskriterien.reduce((sum, c) => sum + c.punkte, 0) || 1;
    const afb = operatorAfb(k, f.operator, f.schwierigkeit);
    const basis = { id: `material:${s.id}:${f.id}`, quelle: 'material' as const, topicId, operator: f.operator.trim().toLowerCase(), afb, punkte, minuten: MINUTEN_MATERIAL[f.typ], frage: f.frage };
    if ((f.typ === 'mc_einfach' || f.typ === 'mc_mehrfach') && f.optionen?.length) {
      return {
        ...basis, art: 'auswahl', mehrfach: f.typ === 'mc_mehrfach', optionen: f.optionen.map((o) => o.text),
        richtig: f.optionen.flatMap((o, i) => (o.richtig ? [i] : [])), begruendungen: f.optionen.map((o) => o.begruendung),
        erklaerung: f.musterloesung, material: bezug, hinweis: f.typ === 'mc_mehrfach' ? 'Mehrere Antworten können richtig sein.' : undefined,
      };
    }
    return { ...basis, art: 'offen', musterloesung: f.musterloesung, kriterien: f.bewertungskriterien, material: bezug, hinweis: f.typ === 'fall' ? 'Fallfrage' : undefined };
  }));
}

/** Verteilt n Plätze möglichst gleichmäßig auf Töpfe mit begrenztem Vorrat. */
export function verteile(n: number, vorrat: number[]): number[] {
  const out = vorrat.map(() => 0);
  let rest = n;
  while (rest > 0) {
    const offen = vorrat.map((v, i) => (out[i]! < v ? i : -1)).filter((i) => i >= 0);
    if (!offen.length) break;
    const je = Math.max(1, Math.floor(rest / offen.length));
    for (const i of offen) {
      if (rest <= 0) break;
      const dazu = Math.min(je, vorrat[i]! - out[i]!, rest);
      out[i]! += dazu; rest -= dazu;
    }
  }
  return out;
}

/** Wählt k Fragen so, dass möglichst viele verschiedene Themen vorkommen (reihum je Thema). */
function streueUeberThemen<T extends SimFrage>(fragen: T[], k: number, next: () => number): T[] {
  const gruppen = new Map<string, T[]>();
  for (const f of mische(fragen, next)) gruppen.set(f.topicId, [...(gruppen.get(f.topicId) ?? []), f]);
  const reihen = mische([...gruppen.values()], next);
  const out: T[] = [];
  for (let runde = 0; out.length < k && reihen.some((r) => r.length > runde); runde++) {
    for (const r of reihen) { if (out.length >= k) break; if (r[runde]) out.push(r[runde]!); }
  }
  return out;
}

export interface Zusammenstellung { fragen: SimFrage[]; vorrat: Record<Quelle, number>; minuten: number; punkte: number }

/**
 * Stellt eine Prüfung zusammen: Quellen bekommen gleich viele Plätze (eine Quelle mit wenig Vorrat gibt
 * ihre Plätze an die anderen ab), innerhalb einer Quelle reihum über die Themen gestreut.
 * Reihenfolge wie in einer Klausur: erst AFB I, dann II, dann III.
 */
export function stelleZusammen(k: Katalog, a: Auswahl, saetze: FragenSatz[]): Zusammenstellung {
  const filter = (f: Pick<SimFrage, 'topicId' | 'afb'>) => passtZurAuswahl(k, a, f);
  const r = rng(a.seed);
  const vorratFragen: Record<Quelle, SimFrage[]> = {
    glossar: a.quellen.includes('glossar') ? glossarFragen(k, a.anzahl, a.seed, filter) : [],
    rechnen: a.quellen.includes('rechnen') ? rechenFragen(k, a.anzahl, a.stufe, a.seed, filter) : [],
    material: a.quellen.includes('material')
      ? materialFragen(k, saetze.filter((s) => !a.satzIds.length || a.satzIds.includes(s.id))).filter(filter)
      : [],
  };
  const reihe: Quelle[] = ['material', 'rechnen', 'glossar'];
  const plaetze = verteile(a.anzahl, reihe.map((q) => vorratFragen[q].length));
  const gewaehlt = reihe.flatMap((q, i) => streueUeberThemen(vorratFragen[q], plaetze[i]!, r.next));
  const fragen = mische(gewaehlt, r.next).sort((x, y) => x.afb - y.afb);
  return {
    fragen,
    vorrat: { glossar: vorratFragen.glossar.length, rechnen: vorratFragen.rechnen.length, material: vorratFragen.material.length },
    minuten: empfohleneMinuten(fragen),
    punkte: fragen.reduce((s, f) => s + f.punkte, 0),
  };
}

/** Empfohlene Dauer, auf 5 Minuten aufgerundet. */
export function empfohleneMinuten(fragen: Pick<SimFrage, 'minuten'>[]): number {
  const m = fragen.reduce((s, f) => s + f.minuten, 0);
  return Math.max(5, Math.ceil(m / 5) * 5);
}

// ---------- Wertung ----------

/** auto = vom Code ausgewertet, ki = von Claude nach Kriterien, selbst = Selbstbewertung nach Kriterien, offen = noch nicht bewertet. */
export type Bewertungsart = 'auto' | 'ki' | 'selbst' | 'offen';

export interface Wertung { punkte: number; max: number; art: Bewertungsart; richtig?: boolean; detail?: string }

export function istBeantwortet(f: SimFrage, a: Antwort | undefined): boolean {
  if (!a) return false;
  return f.art === 'auswahl' ? !!a.wahl?.length : !!a.text?.trim();
}

/** Wertet alles aus, was ohne KI geht. Offene Fragen mit Text bleiben „offen“, leere zählen 0. */
export function werteAus(f: SimFrage, a: Antwort | undefined): Wertung {
  if (f.art === 'auswahl') {
    const wahl = a?.wahl ?? [];
    const richtig = wahl.length === f.richtig.length && f.richtig.every((i) => wahl.includes(i));
    return { punkte: richtig ? f.punkte : 0, max: f.punkte, art: 'auto', richtig };
  }
  if (f.art === 'zahl') {
    const b = bewerteZahl({ loesung: f.loesung, toleranz: f.toleranz } as Parameters<typeof bewerteZahl>[0], a?.text ?? '');
    const richtig = b === 'richtig' || b === 'gerundet';
    return { punkte: richtig ? f.punkte : 0, max: f.punkte, art: 'auto', richtig, detail: b === 'gerundet' ? 'Gerundet, innerhalb der Toleranz' : undefined };
  }
  if (!a?.text?.trim()) return { punkte: 0, max: f.punkte, art: 'auto', richtig: false, detail: 'Nicht bearbeitet' };
  return { punkte: 0, max: f.punkte, art: 'offen' };
}

/** Selbstbewertung: Punkte der Kriterien, die man nach Vergleich mit der Musterlösung als erfüllt ankreuzt. */
export function selbstWertung(f: OffeneFrage, erfuellt: number[]): Wertung {
  const punkte = f.kriterien.reduce((s, c, i) => s + (erfuellt.includes(i) ? c.punkte : 0), 0);
  return { punkte, max: f.punkte, art: 'selbst' };
}

// ---------- Auswertung ----------

export interface Gruppe { key: string; label: string; punkte: number; max: number; fragen: number; offen: number }

export interface Auswertung {
  punkte: number;
  max: number;
  prozent: number;
  offen: number;                 // noch nicht bewertete offene Fragen
  note: { note: number; label: string };
  jeThema: Gruppe[];
  jeKb: Gruppe[];
  jeAfb: Gruppe[];
  jeQuelle: Gruppe[];
  jeOperator: Gruppe[];
  schwach: ID[];                 // Themen unter 60 %, schwächste zuerst
}

/**
 * Orientierung nach dem verbreiteten 100-Punkte-Schlüssel (IHK). Pflegeschulen legen ihren
 * Notenschlüssel selbst fest; die App zeigt ihn deshalb nur als Orientierung.
 */
export function note(prozent: number): { note: number; label: string } {
  const p = Math.round(prozent);
  if (p >= 92) return { note: 1, label: 'sehr gut' };
  if (p >= 81) return { note: 2, label: 'gut' };
  if (p >= 67) return { note: 3, label: 'befriedigend' };
  if (p >= 50) return { note: 4, label: 'ausreichend' };
  if (p >= 30) return { note: 5, label: 'mangelhaft' };
  return { note: 6, label: 'ungenügend' };
}

export const SCHWACH_AB = 0.6;

function gruppiere(fragen: SimFrage[], w: Record<string, Wertung>, schluessel: (f: SimFrage) => string[], label: (key: string) => string): Gruppe[] {
  const m = new Map<string, Gruppe>();
  for (const f of fragen) {
    const x = w[f.id] ?? { punkte: 0, max: f.punkte, art: 'offen' as const };
    for (const key of schluessel(f)) {
      const g = m.get(key) ?? { key, label: label(key), punkte: 0, max: 0, fragen: 0, offen: 0 };
      if (x.art === 'offen') g.offen++;
      else { g.punkte += x.punkte; g.max += x.max; }
      g.fragen++;
      m.set(key, g);
    }
  }
  return [...m.values()];
}

const quote = (g: Pick<Gruppe, 'punkte' | 'max'>) => (g.max ? g.punkte / g.max : 0);

export function auswerten(k: Katalog, fragen: SimFrage[], w: Record<string, Wertung>): Auswertung {
  const bewertet = fragen.map((f) => w[f.id]).filter((x): x is Wertung => !!x && x.art !== 'offen');
  const punkte = bewertet.reduce((s, x) => s + x.punkte, 0);
  const max = bewertet.reduce((s, x) => s + x.max, 0);
  const prozent = max ? (punkte / max) * 100 : 0;
  const themaLabel = (id: string) => k.topics.get(id)?.name ?? 'Ohne Thema';
  const jeThema = gruppiere(fragen, w, (f) => [f.topicId], themaLabel).sort((a, b) => quote(a) - quote(b) || b.max - a.max);
  const jeKb = gruppiere(fragen, w, (f) => { const kb = kompetenzbereiche(k, f.topicId); return kb.length ? kb : ['ohne']; },
    (key) => (key === 'ohne' ? 'Ohne Zuordnung im Katalog' : k.kbName.get(key) ?? key)).sort((a, b) => a.key.localeCompare(b.key, 'de', { numeric: true }));
  const jeAfb = gruppiere(fragen, w, (f) => [String(f.afb)], (key) => AFB_LABEL[Number(key) as Afb]).sort((a, b) => a.key.localeCompare(b.key));
  const jeQuelle = gruppiere(fragen, w, (f) => [f.quelle], (key) => QUELLE_LABEL[key as Quelle]);
  const jeOperator = gruppiere(fragen, w, (f) => [f.operator], (key) => key).sort((a, b) => quote(a) - quote(b));
  const schwach = jeThema.filter((g) => g.key && g.max > 0 && quote(g) < SCHWACH_AB).map((g) => g.key);
  return { punkte, max, prozent, offen: fragen.length - bewertet.length, note: note(prozent), jeThema, jeKb, jeAfb, jeQuelle, jeOperator, schwach };
}

// ---------- Übergabe an den Lernplan ----------

export interface LernplanEintrag { topicId: ID; source: 'pruefungssimulation' | 'selbsteinschaetzung'; scorePercent: number; fragen: number }

/**
 * Ein Abfrageergebnis je Thema. Vom Code oder von Claude bewertete Fragen zählen als Prüfungssimulation.
 * Selbst bewertete Antworten gehen getrennt als Selbsteinschätzung an den Lernplan, die dort bewusst nicht
 * als Nachweis zählt.
 */
export function lernplanEintraege(k: Katalog, fragen: SimFrage[], w: Record<string, Wertung>): LernplanEintrag[] {
  const sammel = new Map<string, { punkte: number; max: number; fragen: number }>();
  for (const f of fragen) {
    const x = w[f.id];
    if (!x || x.art === 'offen' || !k.topics.has(f.topicId)) continue;
    const source = x.art === 'selbst' ? 'selbsteinschaetzung' : 'pruefungssimulation';
    const key = `${f.topicId}|${source}`;
    const s = sammel.get(key) ?? { punkte: 0, max: 0, fragen: 0 };
    s.punkte += x.punkte; s.max += x.max; s.fragen++;
    sammel.set(key, s);
  }
  return [...sammel.entries()].filter(([, s]) => s.max > 0).map(([key, s]) => {
    const [topicId, source] = key.split('|') as [ID, LernplanEintrag['source']];
    return { topicId, source, scorePercent: Math.round((s.punkte / s.max) * 100), fragen: s.fragen };
  });
}

// ---------- Zeit ----------

export function restzeit(deadline: number, jetzt: number): number { return Math.max(0, deadline - jetzt); }

export function uhr(ms: number): string {
  const s = Math.ceil(ms / 1000);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sek = s % 60;
  const zwei = (x: number) => String(x).padStart(2, '0');
  return h ? `${h}:${zwei(m)}:${zwei(sek)}` : `${zwei(m)}:${zwei(sek)}`;
}
