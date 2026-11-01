// Gemeinsamer Kern für offline-Übungsrunden (Hygiene-Trainer, Anatomie-Trainer).
// Drei Aufgabenarten: Auswahl, Reihenfolge, Abbildung beschriften.
// Alles hier ist rein und testbar; Speichern und Oberfläche liegen in Runde.tsx und den Seiten.
//
// Regeln:
// - Eine Runde ist eine echte Abfrage: keine Tipps vor dem Prüfen. Deshalb darf sie in den Lernplan.
// - Jede Aufgabe zählt für den Lernplan gleich viel (0 bis 1), egal wie viele Teilpunkte sie hat.
//   Sonst würde eine Abbildung mit 14 Markierungen eine ganze Runde überstimmen.
// - Fehler landen im Fehlerheft als Auswahlfrage, die ohne Abbildung verständlich ist.

import type { NeuerFehler, FehlerQuelle } from '../fehlerheft/fehlerheft';
import type { Treffer } from '../lernplan/trainer';

interface Basis {
  id: string;
  topicIds: string[];
  /** Kurze Einordnung, z. B. „5 Momente“ oder „Herz beschriften“. */
  titel: string;
  frage: string;
  /** Begründung, wird nach dem Prüfen gezeigt. */
  erklaerung: string[];
}

export interface AuswahlAufgabe extends Basis {
  art: 'auswahl';
  optionen: string[];
  richtig: number[];
  mehrfach: boolean;
}

export interface ReihenfolgeAufgabe extends Basis {
  art: 'reihenfolge';
  /** In der richtigen Reihenfolge. Jeder Schritt nur einmal. */
  schritte: string[];
}

export interface Marke {
  nr: number;
  x: number;
  y: number;
  label: string;
  /** Beschreibung ohne den Namen: macht die Fehlerheft-Frage ohne Bild lösbar. */
  hinweis: string;
}

export interface BeschriftenAufgabe extends Basis {
  art: 'beschriften';
  figur: string;
  marken: Marke[];
}

export type Aufgabe = AuswahlAufgabe | ReihenfolgeAufgabe | BeschriftenAufgabe;

export type Antwort =
  | { art: 'auswahl'; wahl: number[] }
  | { art: 'reihenfolge'; folge: string[] }
  | { art: 'beschriften'; zuordnung: Record<number, string> };

export interface Bewertung {
  punkte: number;
  max: number;
  richtig: boolean;
  /** Je Option, Position oder Marke: stimmt es? */
  teile: boolean[];
}

// ---------------------------------------------------------------- Zufall

/** Mischt eine Kopie (Fisher-Yates). */
export function mische<T>(liste: readonly T[], zufall: () => number = Math.random): T[] {
  const a = [...liste];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(zufall() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Startreihenfolge für eine Reihenfolge-Aufgabe: gemischt, aber nie schon richtig. */
export function startFolge(schritte: readonly string[], zufall: () => number = Math.random): string[] {
  if (schritte.length < 2) return [...schritte];
  for (let i = 0; i < 20; i++) {
    const f = mische(schritte, zufall);
    if (f.some((s, k) => s !== schritte[k])) return f;
  }
  return [...schritte].reverse();
}

/** Mischt die Optionen einer Auswahlaufgabe, ohne die Lösung zu verlieren. */
export function mischeOptionen(a: Aufgabe, zufall: () => number = Math.random): Aufgabe {
  if (a.art !== 'auswahl') return a;
  const reihe = mische(a.optionen.map((_, k) => k), zufall);
  return { ...a, optionen: reihe.map((k) => a.optionen[k]!), richtig: reihe.flatMap((k, neu) => (a.richtig.includes(k) ? [neu] : [])) };
}

/**
 * Eine Runde: bis zu `anzahl` Aufgaben in zufälliger Reihenfolge.
 * Abbildungen kommen immer mit hinein (sie sind das, wofür man den Trainer öffnet), höchstens aber die Hälfte
 * der Runde, damit gemischte Runden nicht nur aus Beschriften bestehen. Der Rest wird zufällig gezogen.
 */
export function runde(aufgaben: readonly Aufgabe[], anzahl: number, zufall: () => number = Math.random): Aufgabe[] {
  const bilder = mische(aufgaben.filter((a) => a.art === 'beschriften'), zufall).slice(0, Math.max(1, Math.floor(anzahl / 2)));
  const rest = mische(aufgaben.filter((a) => a.art !== 'beschriften'), zufall);
  const auswahl = [...bilder, ...rest].slice(0, Math.max(0, anzahl));
  return mische(auswahl, zufall).map((a) => mischeOptionen(a, zufall));
}

// ---------------------------------------------------------------- Bewerten

export function bewerte(a: Aufgabe, antwort: Antwort): Bewertung {
  if (a.art === 'auswahl') {
    const wahl = new Set(antwort.art === 'auswahl' ? antwort.wahl : []);
    const soll = new Set(a.richtig);
    const teile = a.optionen.map((_, i) => wahl.has(i) === soll.has(i));
    const richtig = teile.every(Boolean);
    if (!a.mehrfach) return { punkte: richtig ? 1 : 0, max: 1, richtig, teile };
    // Mehrfachauswahl: je Option ein Punkt für die richtige Entscheidung (ankreuzen oder nicht)
    const punkte = teile.filter(Boolean).length;
    return { punkte, max: a.optionen.length, richtig, teile };
  }
  if (a.art === 'reihenfolge') {
    const folge = antwort.art === 'reihenfolge' ? antwort.folge : [];
    const teile = a.schritte.map((s, i) => folge[i] === s);
    // Teilpunkte für richtige Nachbarn: ein verrutschter Schritt kostet nicht die ganze Aufgabe
    let punkte = 0;
    for (let i = 0; i + 1 < folge.length; i++) {
      const k = a.schritte.indexOf(folge[i]!);
      if (k >= 0 && a.schritte[k + 1] === folge[i + 1]) punkte++;
    }
    return { punkte, max: Math.max(1, a.schritte.length - 1), richtig: teile.every(Boolean) && folge.length === a.schritte.length, teile };
  }
  const zu = antwort.art === 'beschriften' ? antwort.zuordnung : {};
  const teile = a.marken.map((m) => zu[m.nr] === m.label);
  return { punkte: teile.filter(Boolean).length, max: a.marken.length, richtig: teile.every(Boolean), teile };
}

/** Für den Lernplan: jede Aufgabe zählt einmal, mit ihrem Anteil richtiger Teile. */
export function alsTreffer(a: Aufgabe, b: Bewertung): Treffer {
  return { topicIds: a.topicIds, punkte: b.max > 0 ? b.punkte / b.max : 0, max: 1 };
}

// ---------------------------------------------------------------- Fehlerheft

/** Bis zu drei andere Antworten neben der richtigen, ohne Doppelte. Reihenfolge mischt das Fehlerheft. */
function ablenker(richtig: string, pool: readonly string[], n = 3): string[] {
  const andere = [...new Set(pool)].filter((p) => p !== richtig);
  // Feste Auswahl (die nächsten Nachbarn im Pool), damit derselbe Fehler dieselbe Frage ergibt
  const start = Math.max(0, pool.indexOf(richtig));
  const sortiert = [...andere].sort((x, y) => Math.abs(pool.indexOf(x) - start) - Math.abs(pool.indexOf(y) - start));
  return sortiert.slice(0, n);
}

/**
 * Übersetzt eine falsch gelöste Aufgabe in Fehlerheft-Einträge.
 * Auswahl: die Frage selbst. Reihenfolge: der erste falsche Schritt als „Was kommt nach …?“.
 * Beschriften: je falscher Marke eine Frage mit dem Hinweis statt der Abbildung.
 */
export function alsFehler(a: Aufgabe, antwort: Antwort, quelle: FehlerQuelle): NeuerFehler[] {
  const b = bewerte(a, antwort);
  if (b.richtig) return [];
  const id = `${quelle}:${a.id}`;
  if (a.art === 'auswahl') {
    const wahl = antwort.art === 'auswahl' ? antwort.wahl : [];
    return [{
      id, quelle, topicIds: a.topicIds, titel: a.titel, frage: a.frage,
      deineAntwort: wahl.length ? wahl.map((i) => a.optionen[i]).join(' · ') : 'keine Antwort',
      loesung: a.richtig.map((i) => a.optionen[i]).join(' · '),
      erklaerung: a.erklaerung,
      wiederholung: { art: 'auswahl', optionen: a.optionen, richtig: a.richtig, mehrfach: a.mehrfach },
    }];
  }
  if (a.art === 'reihenfolge') {
    const folge = antwort.art === 'reihenfolge' ? antwort.folge : [];
    const i = Math.max(0, b.teile.findIndex((t) => !t));
    const soll = a.schritte[i]!;
    const frage = i === 0
      ? `${a.frage} Womit beginnt die Reihenfolge?`
      : `${a.frage} Was kommt direkt nach „${a.schritte[i - 1]}“?`;
    const optionen = [soll, ...ablenker(soll, a.schritte.filter((_, k) => k !== i - 1))];
    return [{
      id, quelle, topicIds: a.topicIds, titel: a.titel, frage,
      deineAntwort: folge.join(' → ') || '–',
      loesung: a.schritte.join(' → '),
      erklaerung: a.erklaerung,
      wiederholung: { art: 'auswahl', optionen, richtig: [0], mehrfach: false },
    }];
  }
  const zu = antwort.art === 'beschriften' ? antwort.zuordnung : {};
  const labels = a.marken.map((m) => m.label);
  return a.marken.filter((_, k) => !b.teile[k]).map((m) => ({
    id: `${id}:${m.nr}`, quelle, topicIds: a.topicIds, titel: a.titel,
    frage: `${a.titel}: Wie heißt die Struktur? ${m.hinweis}`,
    deineAntwort: zu[m.nr] ?? 'nicht zugeordnet',
    loesung: m.label,
    erklaerung: [`Nummer ${m.nr} in der Abbildung: ${m.label}. ${m.hinweis}`],
    wiederholung: { art: 'auswahl', optionen: [m.label, ...ablenker(m.label, labels)], richtig: [0], mehrfach: false },
  }));
}

// ---------------------------------------------------------------- Prüfen der Inhalte (für Tests)

/** Findet Baufehler in einer Aufgabensammlung. Leere Liste = in Ordnung. */
export function pruefeAufgaben(aufgaben: readonly Aufgabe[], gueltigeThemen?: ReadonlySet<string>): string[] {
  const out: string[] = [];
  const ids = new Set<string>();
  for (const a of aufgaben) {
    if (ids.has(a.id)) out.push(`${a.id}: ID doppelt`);
    ids.add(a.id);
    if (!a.topicIds.length) out.push(`${a.id}: kein Thema`);
    if (gueltigeThemen) for (const t of a.topicIds) if (!gueltigeThemen.has(t)) out.push(`${a.id}: unbekanntes Thema ${t}`);
    if (!a.erklaerung.length) out.push(`${a.id}: keine Erklärung`);
    if (a.art === 'auswahl') {
      if (a.optionen.length < 2) out.push(`${a.id}: zu wenig Optionen`);
      if (new Set(a.optionen).size !== a.optionen.length) out.push(`${a.id}: Option doppelt`);
      if (!a.richtig.length || a.richtig.some((i) => i < 0 || i >= a.optionen.length)) out.push(`${a.id}: richtige Antwort fehlt`);
      if (!a.mehrfach && a.richtig.length !== 1) out.push(`${a.id}: Einfachauswahl braucht genau eine richtige Antwort`);
    } else if (a.art === 'reihenfolge') {
      if (a.schritte.length < 3) out.push(`${a.id}: zu wenig Schritte`);
      if (new Set(a.schritte).size !== a.schritte.length) out.push(`${a.id}: Schritt doppelt`);
    } else {
      if (a.marken.length < 3) out.push(`${a.id}: zu wenig Marken`);
      if (new Set(a.marken.map((m) => m.label)).size !== a.marken.length) out.push(`${a.id}: Beschriftung doppelt`);
      if (new Set(a.marken.map((m) => m.nr)).size !== a.marken.length) out.push(`${a.id}: Nummer doppelt`);
      for (const m of a.marken) if (!m.hinweis || m.hinweis.toLowerCase().includes(m.label.toLowerCase())) out.push(`${a.id}: Hinweis zu Nummer ${m.nr} fehlt oder verrät den Namen`);
    }
  }
  return out;
}
