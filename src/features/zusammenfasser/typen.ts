// Erweiterungstypen des Zusammenfassers. Bauen auf dem Kernvertrag auf.
// Felder, die als Änderungswunsch an den Kern gehen, sind mit [KERN?] markiert (siehe SPEZIFIKATION.md, Abschnitt 10).

import type {
  ID, Citation, Claim, ClaimStatus, Summary, SummaryMode, SummaryLength, SourceChunk, MasteryStatus,
} from '../../core/types';

// ---------- Belege und Aussagen ----------

export interface CitationExt extends Citation {
  printedPage?: string;   // [KERN?] gedruckte Seite für Anzeige/Export
  charStart?: number;     // [KERN?] vom Code gesetzt, Position des Zitats im Chunk-Text
  charEnd?: number;
}

export type ClaimKind =
  | 'fakt' | 'definition' | 'ablauf'
  | 'lernhilfe' | 'ergaenzung' | 'struktur'
  | 'fehlt' | 'rueckfrage' | 'widerspruch' | 'unleserlich';

export type ClaimStatusExt = ClaimStatus | 'fehlt' | 'ungeprueft';   // [KERN?]

export interface ClaimExt extends Omit<Claim, 'citations' | 'status'> {
  citations: CitationExt[];
  status: ClaimStatusExt;
  kind: ClaimKind;          // [KERN?]
  blockId: ID;              // [KERN?] zu welchem Gliederungsblock die Aussage gehört
  aufgabeNr?: string;       // nur Arbeitsauftragsmodus
  befundIds: ID[];
}

/** Gliederung: Überschriften, Absätze, Listen, Tabellen. Claims hängen an Blöcken. */
export interface SummaryBlock {
  id: ID;
  type: 'ueberschrift' | 'absatz' | 'liste' | 'tabelle' | 'kasten' | 'aufgabe';
  level?: number;           // Überschriftenebene
  title?: string;
  kastenArt?: 'ergaenzung' | 'lernhilfe' | 'widerspruch' | 'fehlt' | 'merke';
  claimIds: ID[];
  children?: ID[];
}

export interface SummaryExt extends Omit<Summary, 'claims'> {
  claims: ClaimExt[];
  blocks: SummaryBlock[];   // [KERN?]
  rootBlockIds: ID[];
  qa: QaBericht;            // [KERN?]
  pipelineRunId: ID;        // [KERN?]
  vorlaeufig: boolean;      // offene Rückfragen
}

// ---------- Prüfbefunde ----------

export type PruefungId =
  | 'Q1a' | 'Q1b' | 'Q1c' | 'Q1d' | 'Q2' | 'Q2b' | 'Q3a' | 'Q3b'
  | 'Q4a' | 'Q4b' | 'Q4c' | 'Q4d' | 'Q5' | 'Q6a' | 'Q6b' | 'Q6c' | 'Q6d'
  | 'K1' | 'K2' | 'K3' | 'K4' | 'K5';

export type Schwere = 'blocker' | 'warnung' | 'hinweis';

export interface Befund {
  id: ID;
  pruefung: PruefungId;
  schwere: Schwere;
  claimId?: ID;
  chunkId?: ID;
  aufgabeNr?: string;
  meldung: string;          // für dich lesbar, z. B. „Zahl ‚2 Stunden‘ steht nicht in der Quelle (S. 412)“
  details?: Record<string, unknown>;
}

export interface QaBericht {
  befunde: Befund[];
  ampel: 'gruen' | 'gelb' | 'rot';
  reparaturVersucht: boolean;
  statistik: { claims: number; belegt: number; unbelegt: number; ergaenzung: number; fehlt: number };
}

// ---------- Arbeitsauftrag ----------

export interface Operator {
  verb: string;                         // 'nennen', 'erläutern', …
  anforderungsbereich: 1 | 2 | 3;
  erwartung: string;                    // was eine Antwort leisten muss
}

export interface Aufgabe {
  nr: string;                           // '1', '2a', …
  wortlaut: string;
  operatoren: string[];
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
