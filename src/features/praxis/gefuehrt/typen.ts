// Praxissimulator Stufe 1 (geführt): Datenform der Leitfälle.
// Ein Leitfall führt Schritt für Schritt durch einen bestehenden Praxisfall (scenarios.json).
// Jede Option ist fachlich bewertet und begründet; sie steuert über `aktionen` die gemeinsame
// Engine (Zeit, Verlauf, Komplikationen), damit Stufe 1 und Stufe 2 denselben Patienten zeigen.

import type { Vital, Vitals } from '../types';

export const PHASEN = {
  ersteindruck: 'Ersteindruck',
  a: 'A · Atemweg',
  b: 'B · Atmung',
  c: 'C · Kreislauf',
  d: 'D · Bewusstsein',
  e: 'E · Erweiterte Einschätzung',
  massnahme: 'Sofortmaßnahme',
  hilfe: 'Hilfe holen',
  uebergabe: 'Übergabe (SBAR)',
  anordnung: 'Anordnung umsetzen',
  verlauf: 'Verlauf und Wirkung',
  doku: 'Dokumentation',
} as const;
export type Phase = keyof typeof PHASEN;

/** gut: fachlich richtig · vertretbar: nicht falsch, aber nicht das Wichtigste · falsch: hilft nicht oder verzögert · gefaehrlich: schadet */
export type Wertung = 'gut' | 'vertretbar' | 'falsch' | 'gefaehrlich';
export const WERTUNG_LABEL: Record<Wertung, string> = { gut: 'Richtig', vertretbar: 'Vertretbar', falsch: 'Nicht zielführend', gefaehrlich: 'Gefährlich' };

export interface GOption {
  id: string;
  text: string;
  wertung: Wertung;
  /** Begründung, sofort nach der Wahl sichtbar. Pflicht. */
  warum: string;
  /** Was man sieht, hört oder erfährt. Ohne Angabe: Ergebnistext der ersten Engine-Handlung. */
  befund?: string;
  /** Engine-Handlungen (IDs aus dem Fall), in dieser Reihenfolge. Fehlende Voraussetzungen werden übersprungen. */
  aktionen?: string[];
  /** Zeitbedarf, wenn keine Engine-Handlung Zeit verbraucht (Standard 30 s). */
  sekunden?: number;
  /** Welche Werte die Wahl sichtbar macht (aktueller Zustand des Patienten). */
  zeigt?: Vital[];
  /** Folge einer ungünstigen Wahl ohne eigene Engine-Handlung (wird als Fehlhandlung festgehalten). */
  folge?: { text: string; effekt?: Partial<Vitals> };
  /** SBAR-Übergabe, die mit dieser Wahl abgegeben wird. */
  sbar?: [string, string, string, string];
  /** Pflegebericht, der mit dieser Wahl gespeichert wird. */
  notiz?: string;
  /** Angeordnetes Medikament, das mit dieser Wahl korrekt geprüft gegeben wird. */
  medikation?: string;
}

export interface GSchritt {
  id: string;
  phase: Phase;
  /** Was gerade passiert (kurz). */
  lage?: string;
  frage: string;
  /** Wie viele Optionen nacheinander gewählt werden dürfen (Standard 1). */
  mehrfach?: number;
  /** Simulationszeit, die vor dem Schritt vergeht (z. B. „15 Minuten später“). */
  vorlauf?: number;
  /** Vor dem Schritt läuft die Zeit, bis dieses Flag gesetzt ist (z. B. Anordnung liegt vor), höchstens 20 Minuten. */
  wartenAuf?: string;
  optionen: GOption[];
}

export interface Leitfall {
  /** ID des Praxisfalls in scenarios.json */
  fall: string;
  /** Rolle und Rahmen in einem Satz. */
  rahmen: string;
  lernziele: string[];
  /** Engine-Handlungen, die beim Start schon laufen (z. B. Monitor im Aufwachraum). */
  start?: string[];
  schritte: GSchritt[];
  /** Fachquellen, an denen der Leitfall ausgerichtet ist. */
  quellen: string[];
}
