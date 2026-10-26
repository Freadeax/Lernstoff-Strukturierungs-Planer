// Gemeinsamer Datenvertrag des Lernstoff-Planers (Kern, fachneutral).
// Alle Threads richten ihre Typen hieran aus. Änderungen bitte mit dem Architektur-Thread abstimmen.
// Konventionen: TypeScript. IDs = string: Katalogdaten aus Fachmodulen nutzen stabile Präfix-IDs
// (z. B. 'thema.pflege.prophylaxe.dekubitus'), vom Nutzer erzeugte Daten UUID v4. Zeitpunkte = ISO-8601-Strings, Datumsangaben = 'YYYY-MM-DD'.

export type ID = string;

/** Fachmodul (z. B. 'pflege'). Liefert Taxonomie, Begriffe, Prüfformate und Prüfregeln als Daten. */
export interface DomainModule {
  id: string;            // z. B. 'pflege-generalistisch'
  name: string;
  version: string;
  subjects: Subject[];   // vordefinierte Fächer/Lernfelder
  topics: Topic[];       // vordefinierter Themenbaum
  glossary: GlossaryEntry[];
  taskFormats: TaskFormat[];   // z. B. PESR, SMART, SIS
  checkRules: CheckRule[];     // zusätzliche Prüfregeln für die Qualitätskontrolle
}

export interface Subject { id: ID; moduleId?: string; name: string; code?: string; }

export interface Topic {
  id: ID;
  subjectId: ID;
  parentId?: ID;          // Themenbaum
  name: string;
  prerequisites: ID[];    // Topic-IDs, die vorher gelernt sein sollten
  difficulty?: 1 | 2 | 3 | 4 | 5;
  estimatedMinutes?: number;
}

export interface Document {
  id: ID;
  title: string;
  kind: 'pdf' | 'docx' | 'pptx' | 'image' | 'text';
  subjectIds: ID[];
  topicIds: ID[];
  version: number;
  previousVersionId?: ID;
  contentHash: string;    // für Dubletten- und Versionserkennung
  importedAt: string;
  repository?: { owner: string; repo: string; ordner: string };
  topicSuggestions?: Array<{ name: string; parentId?: ID; subjectId: ID }>;
}

/** Kleinste belegbare Texteinheit. Jede Quellenangabe zeigt auf einen Chunk. */
export interface SourceChunk {
  id: ID;
  documentId: ID;
  page: number;           // 1-basiert, gedruckte Seitenzahl falls erkennbar in printedPage
  printedPage?: string;
  chapter?: string;
  text: string;
  ocrConfidence?: number; // 0..1, nur bei OCR
  illegibleSpans?: Array<{ start: number; end: number }>;
  pageEstimated?: boolean; // Seite nur geschätzt (z. B. docx ohne gespeicherte Seitenumbrüche)
  origin?: 'text' | 'ocr' | 'notes' | 'table';
}

export interface Citation {
  chunkId: ID; documentId: ID; page: number; quote: string;
  printedPage?: string;   // gedruckte Seite für Anzeige und Export
  charStart?: number;     // vom Code beim Zitatabgleich gesetzt, Position im Chunk-Text (für Hervorhebung)
  charEnd?: number;
}

/** 'ungeprueft' ist der Startwert vor der Qualitätskontrolle; 'fehlt' = ausdrücklich gekennzeichnete Lücke. */
export type ClaimStatus = 'belegt' | 'unbelegt' | 'abweichend' | 'widerspruch' | 'unleserlich' | 'fehlt' | 'ungeprueft';

export type ClaimKind =
  | 'fakt' | 'definition' | 'ablauf'
  | 'lernhilfe' | 'ergaenzung' | 'struktur'
  | 'fehlt' | 'rueckfrage' | 'widerspruch' | 'unleserlich';

export interface Claim {
  id: ID;
  text: string;
  citations: Citation[];
  status: ClaimStatus;
  isSupplementary: boolean;   // ergänzendes Wissen, nicht aus der Quelle
  kind?: ClaimKind;
  blockId?: ID;               // Gliederungsblock in Summary.blocks
}

export type SummaryMode = 'originalgetreu' | 'lernen' | 'arbeitsauftrag' | 'pruefung' | 'vergleich';
export type SummaryLength = 'kurz' | 'mittel' | 'ausfuehrlich';

export interface Summary {
  id: ID;
  mode: SummaryMode;
  length: SummaryLength;
  topicIds: ID[];
  sourceDocumentIds: ID[];
  claims: Claim[];
  createdAt: string;
  needsReview: boolean;       // z. B. nach neuer Dokumentversion
  blocks?: SummaryBlock[];    // Gliederung (Überschriften, Listen, Tabellen); Claims hängen über blockId daran
  rootBlockIds?: ID[];
  qa?: QaBericht;             // Ergebnis der Qualitätskontrolle
  pipelineRunId?: ID;
}

/** Gliederungsblock einer Zusammenfassung. */
export interface SummaryBlock {
  id: ID;
  type: 'ueberschrift' | 'absatz' | 'liste' | 'tabelle' | 'kasten' | 'aufgabe';
  level?: number;
  title?: string;
  kastenArt?: 'ergaenzung' | 'lernhilfe' | 'widerspruch' | 'fehlt' | 'merke';
  claimIds: ID[];
  children?: ID[];
}

/** Prüf-IDs siehe docs/ZUSAMMENFASSER.md, Abschnitt 6 (Q = Code, K = KI-Prüfer). */
export type Schwere = 'blocker' | 'warnung' | 'hinweis';

export interface Befund {
  id: ID;
  pruefung: string;           // z. B. 'Q1a', 'K1'
  schwere: Schwere;
  claimId?: ID;
  chunkId?: ID;
  aufgabeNr?: string;
  meldung: string;
}

export interface QaBericht {
  befunde: Befund[];
  ampel: 'gruen' | 'gelb' | 'rot';
  reparaturVersucht: boolean;
  statistik: { claims: number; belegt: number; unbelegt: number; ergaenzung: number; fehlt: number };
}

export interface Exam { id: ID; name: string; date: string; subjectIds: ID[]; topicIds: ID[]; }

export type MasteryStatus = 'offen' | 'bearbeitet' | 'unsicher' | 'sicher';

export interface GlossaryEntry { term: string; abbreviation?: string; definition: string; citation?: Citation; }
export interface TaskFormat { id: string; name: string; description: string; requiredParts: string[]; }
export interface CheckRule { id: string; description: string; }
