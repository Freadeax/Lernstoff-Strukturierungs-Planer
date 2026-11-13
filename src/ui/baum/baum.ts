// Allgemeiner Baum (Fach › Bereich › Thema …) mit Fortschrittssegmenten.
// Vorbild: Stapelliste in Anki (Zahlen der Unterstapel summieren sich im Oberstapel) und
// Brainscape (ein Balken je Stapel zeigt die Verteilung der Sicherheit).
// Reine Funktionen, damit Themenbaum, Inhaltsqualität und weitere Ansichten sie teilen können.

import type { ReactNode } from 'react';

/** Farbton eines Segments; die Farben entsprechen dem Wissensstand im Lernplan. */
export type BaumTon = 'offen' | 'arbeit' | 'unsicher' | 'sicher' | 'luecke' | 'neutral';

export interface BaumSegment { key: string; label: string; wert: number; ton: BaumTon }

export interface BaumKnoten {
  id: string;
  label: string;
  /** Ziel beim Antippen des Namens (Hash-Pfad ohne #). */
  href?: string;
  kinder?: BaumKnoten[];
  /** Nur an Blättern nötig; Eltern summieren ihre Blätter. Hat ein Elternknoten eigene, gelten diese. */
  segmente?: BaumSegment[];
  /** Kurzer Text rechts (z. B. „fällig“, „eigenes Thema“). */
  hinweis?: string;
  /** Beliebiger Zusatz rechts neben dem Balken (Knöpfe, Marken). */
  zusatz?: ReactNode;
  /** Darf per Ziehen umgehängt werden. */
  ziehbar?: boolean;
  /** Darf andere Knoten als Kinder aufnehmen. */
  ablage?: boolean;
  /** Freie Daten für Filter und Aktionen. */
  daten?: Record<string, unknown>;
}

/** Summe der Segmente aller Blätter unter einem Knoten (gleiche key werden addiert, Reihenfolge bleibt). */
export function summiere(k: BaumKnoten): BaumSegment[] {
  if (k.segmente) return k.segmente;
  const summe = new Map<string, BaumSegment>();
  for (const kind of k.kinder ?? []) {
    for (const s of summiere(kind)) {
      const alt = summe.get(s.key);
      summe.set(s.key, alt ? { ...alt, wert: alt.wert + s.wert } : { ...s });
    }
  }
  return [...summe.values()];
}

export const gesamt = (segmente: BaumSegment[]) => segmente.reduce((a, s) => a + s.wert, 0);

/** Anteil eines Tons in Prozent (gerundet), z. B. „62 % sicher“. */
export function anteil(segmente: BaumSegment[], ton: BaumTon): number {
  const g = gesamt(segmente);
  return g ? Math.round((segmente.filter((s) => s.ton === ton).reduce((a, s) => a + s.wert, 0) / g) * 100) : 0;
}

/** Text für Screenreader und Tooltip: „Sicher 3, Unsicher 1, Offen 8“. */
export const segmentText = (segmente: BaumSegment[]) => segmente.filter((s) => s.wert > 0).map((s) => `${s.label} ${s.wert}`).join(', ') || 'keine Einträge';

/**
 * Behält nur Knoten, auf die `passt` zutrifft, und deren Vorfahren.
 * Passt ein Elternknoten selbst, bleiben alle seine Kinder erhalten.
 */
export function filtere(knoten: BaumKnoten[], passt: (k: BaumKnoten) => boolean): BaumKnoten[] {
  const out: BaumKnoten[] = [];
  for (const k of knoten) {
    if (passt(k)) { out.push(k); continue; }
    const kinder = filtere(k.kinder ?? [], passt);
    // Summen bleiben die des ganzen Bereichs, auch wenn nur ein Teil passt (Orientierung).
    if (kinder.length) out.push({ ...k, kinder, segmente: summiere(k) });
  }
  return out;
}

/** Wie `filtere`, aber nur Blätter werden geprüft (Eltern bleiben, wenn ein Blatt passt). */
export function filtereBlaetter(knoten: BaumKnoten[], passt: (k: BaumKnoten) => boolean): BaumKnoten[] {
  const out: BaumKnoten[] = [];
  for (const k of knoten) {
    if (!k.kinder?.length) { if (passt(k)) out.push(k); continue; }
    const kinder = filtereBlaetter(k.kinder, passt);
    if (kinder.length) out.push({ ...k, kinder, segmente: summiere(k) });
  }
  return out;
}

export interface SichtbareZeile { knoten: BaumKnoten; tiefe: number; elternId?: string; offen: boolean; position: number; geschwister: number }

/** Flache Liste der sichtbaren Zeilen für Tastatursteuerung und Darstellung. */
export function sichtbar(knoten: BaumKnoten[], offen: ReadonlySet<string>, tiefe = 0, elternId?: string): SichtbareZeile[] {
  return knoten.flatMap((k, i) => {
    const istOffen = !!k.kinder?.length && offen.has(k.id);
    const zeile: SichtbareZeile = { knoten: k, tiefe, elternId, offen: istOffen, position: i + 1, geschwister: knoten.length };
    return [zeile, ...(istOffen ? sichtbar(k.kinder!, offen, tiefe + 1, k.id) : [])];
  });
}

/** IDs aller Knoten mit Kindern (für „Alle aufklappen“). */
export function elternIds(knoten: BaumKnoten[]): string[] {
  return knoten.flatMap((k) => (k.kinder?.length ? [k.id, ...elternIds(k.kinder)] : []));
}

/** Pfad (IDs der Vorfahren) zu einem Knoten, damit er beim Springen aufgeklappt sichtbar wird. */
export function pfadZu(knoten: BaumKnoten[], id: string, spur: string[] = []): string[] | undefined {
  for (const k of knoten) {
    if (k.id === id) return spur;
    const tiefer = k.kinder && pfadZu(k.kinder, id, [...spur, k.id]);
    if (tiefer) return tiefer;
  }
  return undefined;
}

/** Ist `id` gleich `vorfahr` oder liegt darunter? (Ziehen auf sich selbst oder eigene Kinder verhindern.) */
export function liegtUnter(knoten: BaumKnoten[], vorfahr: string, id: string): boolean {
  const finde = (ks: BaumKnoten[]): BaumKnoten | undefined => ks.reduce<BaumKnoten | undefined>((f, k) => f ?? (k.id === vorfahr ? k : finde(k.kinder ?? [])), undefined);
  const start = finde(knoten);
  if (!start) return false;
  const enthaelt = (k: BaumKnoten): boolean => k.id === id || (k.kinder ?? []).some(enthaelt);
  return enthaelt(start);
}
