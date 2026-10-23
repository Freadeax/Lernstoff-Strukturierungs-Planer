// OCR-Abstraktion. Zwei Implementierungen: Tesseract (offline, Druckschrift) und Claude (Handschrift, schwache Scans).
import type { Block } from '../types';

export interface OcrPage {
  blocks: Block[];       // Absätze, mit illegibleSpans relativ zum Blocktext
  confidence: number;    // 0..1
  engine: string;
}

export interface OcrEngine {
  name: string;
  recognize(image: Uint8Array, mediaType: string): Promise<OcrPage>;
}

/** Unleserliche Stelle im Chunk-Text (gemeinsame Konvention mit Zusammenfasser und Qualitätskontrolle). */
export const ILLEGIBLE = '⟦?⟧';
/** Wörter unter dieser Sicherheit werden als illegibleSpan markiert (Text bleibt, muss aber geprüft werden). */
export const WORD_CONFIDENCE_MIN = 0.6;
/** Wörter unter dieser Sicherheit werden durch ILLEGIBLE ersetzt. */
export const WORD_CONFIDENCE_DROP = 0.3;
/** Seiten unter dieser Durchschnittssicherheit gehen an die Handschrift-Engine (falls erlaubt) bzw. zur Prüfung. */
export const PAGE_CONFIDENCE_MIN = 0.75;
