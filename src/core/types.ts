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
}

export interface Citation { chunkId: ID; documentId: ID; page: number; quote: string; }

export type ClaimStatus = 'belegt' | 'unbelegt' | 'abweichend' | 'widerspruch' | 'unleserlich';

export interface Claim {
  id: ID;
  text: string;
  citations: Citation[];
  status: ClaimStatus;
  isSupplementary: boolean;   // ergänzendes Wissen, nicht aus der Quelle
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
}

export interface Exam { id: ID; name: string; date: string; subjectIds: ID[]; topicIds: ID[]; }

export type MasteryStatus = 'offen' | 'bearbeitet' | 'unsicher' | 'sicher';

export interface GlossaryEntry { term: string; abbreviation?: string; definition: string; citation?: Citation; }
export interface TaskFormat { id: string; name: string; description: string; requiredParts: string[]; }
export interface CheckRule { id: string; description: string; }
