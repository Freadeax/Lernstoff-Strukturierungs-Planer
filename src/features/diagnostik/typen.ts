// Datenformat eines Diagnostik-Falls: Patient, Verlauf von Vitalwerten und Laborwerten,
// Bildgebung mit Vorbereitung, SBAR-Fakten, ärztliche Anordnungen und Lernfragen.
// Inhalte sind fiktiv und didaktisch vereinfacht (fachlich ungeprüft).

import type { Bildserie } from '../../ui/sim/bildgebung/serie';
import type { Verlauf } from '../../ui/sim/labor/modell';
import type { Geschlecht } from '../../ui/sim/labor/parameter';
import type { Stoerung, Kompensation } from '../../ui/sim/labor/bga';

export type VitalKey = 'puls' | 'af' | 'spo2' | 'sys' | 'dia' | 'temp';

export interface Pruefpunkt {
  id: string;
  text: string;
  /** Gehört in diesem Fall zur Vorbereitung. */
  noetig: boolean;
  warum: string;
}

export interface Untersuchung {
  serie: Bildserie;
  /** Echtes, frei lizenziertes Vergleichsbild zur selben Fragestellung (optional). */
  echt?: Bildserie;
  /** Dauer inkl. Transport in Minuten. */
  dauer: number;
  /** Befund liegt nach so vielen Minuten nach der Untersuchung vor. */
  befundNach: number;
  /** Jodhaltiges Kontrastmittel: dann zählen Nierenwerte/TSH/Allergie. */
  kontrastmittel: boolean;
  vorbereitung: Pruefpunkt[];
}

export interface Anordnung {
  id: string;
  /** Knopftext für die Durchführung */
  label: string;
  /** Text der ärztlichen Anordnung (fiktiv) */
  text: string;
  flag: string;
  /** Dauer der Durchführung in Minuten */
  dauer: number;
}

export interface SbarFakt { id: string; text: string; relevant: boolean }

export type Frage =
  | { id: string; art: 'befund'; frage: string; serie: string; befund: string; erklaerung: string }
  | { id: string; art: 'wahl'; frage: string; optionen: { text: string; richtig: boolean; warum: string }[] }
  | { id: string; art: 'bga'; frage: string; werte: { ph: number; pco2: number; hco3: number; po2?: number; be?: number; laktat?: number }; stoerung: Stoerung; kompensation: Kompensation; erklaerung: string };

export interface DiagnostikFall {
  id: string;
  titel: string;
  /** Eine Zeile für die Fallauswahl. */
  kurz: string;
  bereich: string;
  startzeit: string;
  patient: {
    name: string; alter: number; geschlecht: Geschlecht; gewicht: number;
    anlass: string; vorgeschichte: string[]; medikamente: string[]; allergien: string;
    /** Läuft eine Infusion (dann gibt es einen „Infusionsarm“)? */
    infusion?: string;
  };
  vital: Record<VitalKey, Verlauf>;
  labor: Record<string, Verlauf>;
  /** Sinnvolle Erstanforderung (für das Debriefing). */
  empfohlen: string[];
  bildgebung: Untersuchung[];
  sbar: SbarFakt[];
  /** Ärztliche Anordnungen, die nach dem SBAR-Telefonat kommen. */
  anordnungen: Anordnung[];
  /** Flags, die vor einer anderen Anordnung erledigt sein sollten: [zuerst, danach, warum]. */
  reihenfolge?: [string, string, string][];
  fragen: Frage[];
  aufloesung: { diagnose: string; kernaussage: string; pflege: string[] };
  /** Themen-/Krankheitsbezug für spätere Verknüpfung (frei). */
  bezug?: string[];
}
