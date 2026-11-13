// Zwischenstand einer laufenden Übungsrunde: übersteht Neuladen, App-Wechsel auf dem iPhone und
// Verbindungsabbrüche (Vorbild: Fragenbanken setzen begonnene Sitzungen genau dort fort).
// Ein Eintrag je Trainer in localStorage. Bleibt auf dem Gerät (nicht in der Datensicherung),
// denn eine halbe Runde auf ein anderes Gerät zu übertragen bringt nichts. Nach einem Tag verfällt er.
import type { Aufgabe, Bewertung } from './quiz';
import { istObjekt, storage } from '../../ui/lib/store';
import type { Sicherheit } from '../fehlerheft/fehlerheft';

export const ZWISCHENSTAND_KEY = 'lernstoff.quiz.laufend';
export const ZWISCHENSTAND_GUELTIG_MS = 24 * 60 * 60 * 1000;

export interface RundenErgebnisEintrag { id: string; b: Bewertung; sicherheit?: Sicherheit }

export interface Zwischenstand {
  rundeId: string;
  /** Bereich und Stufe der Runde, damit „Fortsetzen“ an die richtige Stelle führt. */
  bereich: string;
  stufe: number;
  aufgaben: Aufgabe[];
  /** Ergebnisse in Reihenfolge der Aufgaben; Länge = Anzahl geprüfter Aufgaben. */
  ergebnisse: RundenErgebnisEintrag[];
  serie: number;
  besteSerie: number;
  /** Nur Wiederholung falscher Aufgaben (zählt nicht im Lernplan). */
  nachuebung?: boolean;
  gespeichert: number;
}

type Alle = Record<string, Zwischenstand>;

const istStand = (v: unknown): v is Zwischenstand => istObjekt(v) && typeof v.rundeId === 'string' && Array.isArray(v.aufgaben) && v.aufgaben.length > 0
  && Array.isArray(v.ergebnisse) && typeof v.gespeichert === 'number' && typeof v.bereich === 'string';

function alle(): Alle {
  const roh = storage.read<unknown>(ZWISCHENSTAND_KEY, {});
  if (!istObjekt(roh)) return {};
  return Object.fromEntries(Object.entries(roh).filter(([, v]) => istStand(v))) as Alle;
}

/** Gültiger, noch nicht fertiger Zwischenstand eines Trainers. */
export function ladeZwischenstand(quelle: string, jetzt = Date.now()): Zwischenstand | null {
  const z = alle()[quelle];
  if (!z) return null;
  if (jetzt - z.gespeichert > ZWISCHENSTAND_GUELTIG_MS || z.ergebnisse.length >= z.aufgaben.length || z.ergebnisse.length === 0) return null;
  return z;
}

export function speichereZwischenstand(quelle: string, z: Zwischenstand | null): void {
  const a = alle();
  if (z) a[quelle] = z; else delete a[quelle];
  storage.write(ZWISCHENSTAND_KEY, a);
}
