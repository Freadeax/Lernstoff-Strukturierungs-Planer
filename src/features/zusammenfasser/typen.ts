// Typen des Zusammenfassers, die nicht in den Kernvertrag gehören.
// Belege, Claim-Arten, Gliederungsblöcke und Prüfbefunde liegen in src/core/types.ts,
// Operatoren und Glossar-Synonyme in src/modules/catalog-types.ts.

import type {
  ID, Befund, SummaryLength, SummaryMode, SourceChunk, MasteryStatus, Summary,
} from '../../core/types';

// ---------- Prüf-IDs ----------

export type PruefungId =
  | 'Q1a' | 'Q1b' | 'Q1c' | 'Q1d' | 'Q2' | 'Q2b' | 'Q3a' | 'Q3b'
  | 'Q4a' | 'Q4b' | 'Q4c' | 'Q4d' | 'Q5' | 'Q6a' | 'Q6b' | 'Q6c' | 'Q6d'
  | 'K1' | 'K2' | 'K3' | 'K4' | 'K5';

// ---------- Arbeitsauftrag ----------

export interface Aufgabe {
  nr: string;                           // '1', '2a', …
  wortlaut: string;
  operatoren: string[];                 // Operator.name aus dem Fachmodul
  geforderteAnzahl?: number;            // „Nennen Sie fünf …“ → 5
  bestandteile: string[];               // „mit Begründung“, „Tabelle“, „PESR“
  aufgabenformatId?: string;            // TaskFormat-ID aus dem Fachmodul
  quellenvorgabe?: string;              // „anhand S. 40–45“
  fallbezug?: string;
  unsicher: boolean;                    // OCR/Lesung unsicher → Nachfrage
  unsicherGrund?: string;
}

// ---------- Prüfungsmodus ----------

export interface BelegJson { chunkId: ID; zitat: string; }   // von der KI im JSON, vom Code geprüft

export interface Pruefungsfrage {
  id: ID;
  typ: 'offen' | 'mc_einfach' | 'mc_mehrfach' | 'fall';
  topicId: ID;
  operator: string;
  schwierigkeit: 1 | 2 | 3;
  frage: string;
  optionen?: Array<{ text: string; richtig: boolean; begruendung: string }>;
  musterloesung: string;
  bewertungskriterien: Array<{ kriterium: string; punkte: number }>;
  belege: BelegJson[];
  pruefungsrelevanzBeleg?: BelegJson;   // nur wenn das Material die Relevanz nennt
}

// ---------- Vergleichsmodus ----------

export type VergleichsArt =
  | 'uebereinstimmend' | 'ergaenzend' | 'abweichend' | 'widerspruechlich' | 'definition_unterschiedlich';

export interface VergleichsZeile {
  unterthema: string;
  art: VergleichsArt;
  jeQuelle: Array<{ documentId: ID; aussage: string | null; belege: BelegJson[] }>;
  erlaeuterung: string;
}

// ---------- Pipeline ----------

export interface PipelineEingabe {
  mode: SummaryMode;
  length?: SummaryLength;
  topicIds: ID[];
  documentIds: ID[];
  chunks: SourceChunk[];                 // nach Auswahl [1]
  wissensstand?: Record<ID, { status: MasteryStatus; haeufigeFehler: string[] }>;  // Lernmodus
  aufgaben?: Aufgabe[];                  // Arbeitsauftrag, nach Bestätigung
  examId?: ID;                           // Prüfungsmodus
  nurPflichtliteratur?: boolean;         // Schulbuch- und Quellenmodus
}

export interface PipelineRun {
  id: ID;
  startedAt: string;
  eingabe: Omit<PipelineEingabe, 'chunks'> & { chunkIds: ID[] };
  promptVersionen: Record<string, string>;   // Dateiname → Version
  modelle: Record<string, { model: string; effort: string }>;
  rohantworten: unknown[];                   // API-Antworten zum Nachvollziehen
  befunde: Befund[];
  ergebnisSummaryId?: ID;
  kosten?: { inputTokens: number; outputTokens: number; cacheReadTokens: number };
}

// ---------- Gespeicherte Ergebnisse der JSON-Modi ----------
// Liegen in der Tabelle summaries (Felder außerhalb des Index stört Dexie nicht), claims bleibt leer.

export interface FragenSatz extends Summary {
  mode: 'pruefung';
  pruefungName: string;
  fragen: Pruefungsfrage[];
  verworfen: number;                    // Fragen ohne gültigen Beleg
}

export interface VergleichsErgebnis extends Summary {
  mode: 'vergleich';
  thema: string;
  zeilen: VergleichsZeile[];
  verworfen: number;                    // Zeilen ohne gültige Belege
}
