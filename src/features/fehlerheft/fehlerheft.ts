// Fehlerheft: falsch beantwortete Aufgaben aus Rechentrainer, Fachbegriff-Duell,
// Prüfungssimulation und Krankheitsbild-Fällen an einer Stelle sammeln und gezielt wiederholen.
// Oben reine Funktionen (testbar), unten das Speichern (localStorage, wird mitgesichert).
//
// Regeln:
// - Gleiche Aufgabe = gleicher Eintrag. Beim Rechnen ist das der Aufgabentyp mit Stufe, denn
//   die Zahlen sind jedes Mal neu: Wiederholt wird eine „Zwillingsaufgabe“ mit neuen Werten.
// - „Behoben“ wie im Lernplan: zwei richtige Wiederholungen an verschiedenen Tagen nach dem
//   letzten Fehler. Ein neuer Fehler setzt den Eintrag zurück (Rückfall).
// - Das Fehlerheft zählt nicht als Abfrage im Lernplan: es fragt nur Schwächen ab und würde
//   den Wissensstand sonst verzerren.

import type { ID } from '../../core/types';
import type { AufgabenTyp, Stufe } from '../rechnen/aufgaben';
import { istObjekt, storage } from '../../ui/lib/store';

export type FehlerQuelle = 'rechnen' | 'duell' | 'simulation' | 'krankheitsbilder';

export const QUELLE_LABEL: Record<FehlerQuelle, string> = {
  rechnen: 'Rechentrainer', duell: 'Fachbegriff-Duell', simulation: 'Prüfungssimulation', krankheitsbilder: 'Krankheitsbilder',
};

/** Wie ein Eintrag wiederholt wird. */
export type Wiederholung =
  | { art: 'rechnen'; typ: AufgabenTyp; stufe: Stufe }
  | { art: 'auswahl'; optionen: string[]; richtig: number[]; mehrfach: boolean };

export interface Fehler {
  id: string;
  quelle: FehlerQuelle;
  topicIds: ID[];
  titel: string;               // kurze Einordnung, z. B. „Dosis nach Gewicht · Station“
  frage: string;               // das letzte falsch beantwortete Beispiel
  deineAntwort: string;
  loesung: string;
  erklaerung: string[];        // Lösungsweg oder Begründung
  wiederholung: Wiederholung;
  erfasst: string;             // Tag des ersten Fehlers (JJJJ-MM-TT)
  letzterFehler: string;       // Tag des letzten Fehlers
  fehlerAnzahl: number;
  treffer: string[];           // Tage mit richtiger Wiederholung seit dem letzten Fehler
  behoben?: string;            // Tag, an dem der Eintrag als behoben gilt
  aktualisiert: string;        // ISO-Zeit, für das Zusammenführen von Sicherungen
}

/** Was ein Trainer beim Fehler meldet. Zähler und Daten setzt das Fehlerheft selbst. */
export type NeuerFehler = Pick<Fehler, 'id' | 'quelle' | 'topicIds' | 'titel' | 'frage' | 'deineAntwort' | 'loesung' | 'erklaerung' | 'wiederholung'>;

export const BEHOBEN_NACH = 2;
/** Obergrenze, damit localStorage klein bleibt. Behobene Einträge fallen zuerst weg. */
export const MAX_EINTRAEGE = 300;

const tag = (d = new Date()) => {
  const z = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
};
export { tag as heutigerTag };

/** Neue Fehler eintragen. Schon bekannte Aufgaben zählen hoch und verlieren den Status „behoben“. */
export function merke(liste: Fehler[], neue: NeuerFehler[], jetzt = new Date()): Fehler[] {
  const t = tag(jetzt);
  const iso = jetzt.toISOString();
  const map = new Map(liste.map((f) => [f.id, f]));
  for (const n of neue) {
    const alt = map.get(n.id);
    map.set(n.id, alt
      ? { ...alt, ...n, topicIds: [...new Set([...alt.topicIds, ...n.topicIds])], fehlerAnzahl: alt.fehlerAnzahl + 1, letzterFehler: t, treffer: [], behoben: undefined, aktualisiert: iso }
      : { ...n, erfasst: t, letzterFehler: t, fehlerAnzahl: 1, treffer: [], aktualisiert: iso });
  }
  return begrenze([...map.values()]);
}

function begrenze(liste: Fehler[]): Fehler[] {
  if (liste.length <= MAX_EINTRAEGE) return liste;
  // Behobene zuerst, dann die ältesten offenen
  const sortiert = [...liste].sort((a, b) => Number(!!b.behoben) - Number(!!a.behoben) || a.aktualisiert.localeCompare(b.aktualisiert));
  const weg = new Set(sortiert.slice(0, liste.length - MAX_EINTRAEGE).map((f) => f.id));
  return liste.filter((f) => !weg.has(f.id));
}

/** Ergebnis einer Wiederholung eintragen. Falsch = wie ein neuer Fehler. */
export function wiederholt(liste: Fehler[], id: string, richtig: boolean, eingabe: string, jetzt = new Date()): Fehler[] {
  const t = tag(jetzt);
  const iso = jetzt.toISOString();
  return liste.map((f) => {
    if (f.id !== id) return f;
    if (!richtig) return { ...f, deineAntwort: eingabe, fehlerAnzahl: f.fehlerAnzahl + 1, letzterFehler: t, treffer: [], behoben: undefined, aktualisiert: iso };
    const treffer = f.treffer.includes(t) ? f.treffer : [...f.treffer, t];
    return { ...f, treffer, behoben: f.behoben ?? (treffer.length >= BEHOBEN_NACH ? t : undefined), aktualisiert: iso };
  });
}

export const istOffen = (f: Fehler) => !f.behoben;

/**
 * Was heute zur Wiederholung dran ist: offene Einträge, die heute noch nicht richtig waren
 * und nicht erst heute falsch waren (sonst würde man die Lösung nur aus dem Kurzzeitgedächtnis abrufen).
 * Häufige Fehler zuerst, dann die ältesten.
 */
export function faellig(liste: Fehler[], jetzt = new Date(), auchHeutige = false): Fehler[] {
  const t = tag(jetzt);
  return liste
    .filter((f) => istOffen(f) && !f.treffer.includes(t) && (auchHeutige || f.letzterFehler !== t))
    .sort((a, b) => b.fehlerAnzahl - a.fehlerAnzahl || a.letzterFehler.localeCompare(b.letzterFehler));
}

export interface Ueberblick { offen: number; faellig: number; heuteNeu: number; behoben: number; nachQuelle: Record<FehlerQuelle, number> }

export function ueberblick(liste: Fehler[], jetzt = new Date()): Ueberblick {
  const t = tag(jetzt);
  const offen = liste.filter(istOffen);
  const nachQuelle: Record<FehlerQuelle, number> = { rechnen: 0, duell: 0, simulation: 0, krankheitsbilder: 0 };
  for (const f of offen) nachQuelle[f.quelle] = (nachQuelle[f.quelle] ?? 0) + 1;
  return {
    offen: offen.length,
    faellig: faellig(liste, jetzt).length,
    heuteNeu: offen.filter((f) => f.letzterFehler === t).length,
    behoben: liste.length - offen.length,
    nachQuelle,
  };
}

/** Offene Fehler je Thema, meiste zuerst. Einträge ohne Thema landen unter ''. */
export function nachThema(liste: Fehler[]): Array<{ topicId: ID; fehler: Fehler[] }> {
  const m = new Map<ID, Fehler[]>();
  for (const f of liste.filter(istOffen)) {
    for (const id of f.topicIds.length ? f.topicIds : ['']) m.set(id, [...(m.get(id) ?? []), f]);
  }
  return [...m].map(([topicId, fehler]) => ({ topicId, fehler })).sort((a, b) => b.fehler.length - a.fehler.length || a.topicId.localeCompare(b.topicId));
}

/** Auswahl-Antwort prüfen: genau die richtigen Optionen. */
export function auswahlRichtig(w: Extract<Wiederholung, { art: 'auswahl' }>, gewaehlt: number[]): boolean {
  const a = [...new Set(gewaehlt)].sort();
  const b = [...w.richtig].sort();
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

/** Optionen mischen und die Lösung mitnehmen (für die Wiederholung, damit nicht die Position gelernt wird). */
export function mischeAuswahl(w: Extract<Wiederholung, { art: 'auswahl' }>, zufall: () => number = Math.random): Extract<Wiederholung, { art: 'auswahl' }> {
  const idx = w.optionen.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(zufall() * (i + 1));
    [idx[i], idx[j]] = [idx[j]!, idx[i]!];
  }
  return { ...w, optionen: idx.map((i) => w.optionen[i]!), richtig: w.richtig.map((r) => idx.indexOf(r)) };
}

// ---------------------------------------------------------------- Speichern

const KEY = 'lernstoff.fehlerheft';

const istFehler = (v: unknown): boolean =>
  istObjekt(v) && typeof v.id === 'string' && typeof v.frage === 'string' && Array.isArray(v.treffer)
  && Array.isArray(v.topicIds) && Array.isArray(v.erklaerung) && istObjekt(v.wiederholung) && typeof v.letzterFehler === 'string';

export function ladeFehler(): Fehler[] {
  return storage.list<Fehler>(KEY, istFehler);
}

export function speichereFehler(liste: Fehler[]): boolean {
  const ok = storage.write(KEY, liste);
  try { window.dispatchEvent(new Event('fehlerheft')); } catch { /* ohne Fenster (Tests) */ }
  return ok;
}

/** Für Trainer: Fehler melden. Fehler beim Speichern brechen die Übung nicht ab. */
export function notiereFehler(neue: NeuerFehler[]): void {
  if (!neue.length) return;
  speichereFehler(merke(ladeFehler(), neue));
}
