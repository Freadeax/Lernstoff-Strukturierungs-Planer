// Import-spezifische Typen. Der gemeinsame Vertrag liegt in contract/types.ts (Kopie von
// /mnt/project-files/core-contract/types.ts); hier nur, was die Import-Pipeline zusätzlich braucht.
import type { Document, SourceChunk } from '../../../core/types';

export type FileKind = Document['kind'];

/** Eingabe: eine Datei, wie sie im Browser aus <input type=file> oder Drag & Drop kommt. */
export interface InputFile {
  name: string;
  bytes: Uint8Array;
  lastModified?: number;   // File.lastModified (ms)
  handwritten?: boolean;   // Nutzer hat "handschriftlich" angekreuzt
}

/** Textblock innerhalb einer Seite. headingLevel gesetzt = Überschrift (1 = oberste Ebene). */
export interface Block {
  text: string;
  headingLevel?: number;
  origin?: 'text' | 'ocr' | 'notes' | 'table';
  illegibleSpans?: Array<{ start: number; end: number }>;
}

/** Zwischenformat aller Extraktoren: eine physische Seite / Folie / ein Bild. */
export interface RawPage {
  page: number;              // 1-basiert, physische Reihenfolge
  printedPage?: string;      // gedruckte Seitenzahl ("17", "xii"), falls erkennbar
  pageEstimated?: boolean;   // true bei docx ohne gerenderte Seitenumbrüche
  blocks: Block[];
  ocrConfidence?: number;    // 0..1, nur bei OCR
  needsOcr?: boolean;        // PDF-Seite ohne Textebene
}

/** Metadaten aus der Datei selbst, für Versionserkennung. */
export interface FileMeta {
  title?: string;
  modified?: string;   // ISO
  editionHint?: string; // "Auflage 2", "v3", "Stand 03/2025"
}

export interface Extracted {
  kind: FileKind;
  pages: RawPage[];
  meta: FileMeta;
  outlineUsed?: boolean;
  warnings: string[];
}

/** Erweiterung von SourceChunk, abzustimmen mit dem Architektur-Thread. */
export interface ImportChunk extends SourceChunk {
  pageEstimated?: boolean;
  origin?: Block['origin'];
}

/** Fingerabdruck eines Dokuments, wird mit dem Dokument gespeichert. */
export interface Fingerprint {
  documentId: string;
  title: string;
  fileHash: string;        // SHA-256 der Rohbytes
  contentHash: string;     // SHA-256 des normalisierten Textes
  minhash: number[];       // 128 Werte über Wort-5-Gramme
  paragraphHashes: string[];
  meta: FileMeta;
  importedAt: string;
}

export type MatchKind =
  | 'gleiche-datei'        // byte-identisch
  | 'gleicher-inhalt'      // Text identisch, z. B. erneut exportiert
  | 'anderes-format'       // gleicher Inhalt als docx und pdf
  | 'neue-version'         // überwiegend gleich, Teile geändert
  | 'teilweise-ueberlappend';

export interface DuplicateMatch {
  kind: MatchKind;
  otherDocumentId: string;
  otherTitle: string;
  similarity: number;       // geschätzte Jaccard-Ähnlichkeit 0..1
  newerIs?: 'neu' | 'bestehend' | 'unklar';
  added: string[];          // Absätze nur im neuen Dokument (gekürzt)
  removed: string[];        // Absätze nur im bestehenden Dokument
  recommendation: string;
}

export interface ImportReport {
  pages: number;
  ocrPages: number;
  printedPagesFound: number;
  chapters: string[];
  lowConfidencePages: number[];
  warnings: string[];
  matches: DuplicateMatch[];
}

export interface ImportResult {
  document: Document;
  chunks: ImportChunk[];
  fingerprint: Fingerprint;
  report: ImportReport;
}
