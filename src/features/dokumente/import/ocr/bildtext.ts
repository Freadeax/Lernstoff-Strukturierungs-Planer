// Text in eingebetteten Bildern (Folien-Grafiken, Schaubilder im Word-Skript, Abbildungen im PDF) per OCR ergänzen.
// Nur die Offline-Engine (Tesseract): Bilder verlassen das Gerät nie ohne ausdrückliche Zustimmung.
// Fotos ohne Schrift liefern bei Tesseract Zeichensalat mit niedriger Sicherheit, darum strenge Filter:
// Seiten-/Bildsicherheit, Mindestzahl echter Wörter und, bei PDF-Seiten mit Textebene, kein Text, der ohnehin
// schon in der Textebene steht (die ganze Seite wird gerendert und erkannt).
import type { Block, RawPage } from '../types';
import type { OcrEngine } from './engine';
import { normalize } from '../dedupe';

/** Darunter gilt das Ergebnis eines Bildes als Rauschen. */
export const BILD_SICHERHEIT_MIN = 0.7;
/** Höchstens so viele Bilder bzw. gerenderte PDF-Seiten je Dokument (Rechenzeit auf dem Handy). */
export const BILDER_MAX = 40;
/** Ab diesem Anteil bekannter Wörter steht der OCR-Absatz schon in der Textebene. */
const SCHON_DA = 0.6;

const woerter = (t: string) => normalize(t).replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter((w) => w.length > 1);
const echteWoerter = (t: string) => woerter(t).filter((w) => /\p{L}{3,}/u.test(w)).length;

/**
 * Behält nur neue, plausible OCR-Absätze; markiert sie mit der Sicherheit des Bildes. Tesseract fasst eine
 * gerenderte PDF-Seite oft zu einem Absatz zusammen, darum wird zeilenweise gegen die Textebene geprüft.
 */
export function filtereBildtext(blocks: Block[], confidence: number, vorhanden: string): Block[] {
  if (confidence < BILD_SICHERHEIT_MIN) return [];
  const bekannt = new Set(woerter(vorhanden));
  const out: Block[] = [];
  for (const b of blocks) {
    let text = '';
    const spans: Array<{ start: number; end: number }> = [];
    let pos = 0;
    for (const line of b.text.split('\n')) {
      const start = pos;
      pos += line.length + 1;
      const ws = woerter(line);
      if (!ws.length) continue;
      if (bekannt.size && ws.filter((w) => bekannt.has(w)).length / ws.length >= SCHON_DA) continue;
      const shift = (text ? text.length + 1 : 0) - start;
      for (const s of b.illegibleSpans ?? []) if (s.start >= start && s.end <= start + line.length) spans.push({ start: s.start + shift, end: s.end + shift });
      text = text ? `${text}\n${line}` : line;
    }
    if (echteWoerter(text) < 2) continue;
    out.push({ text, origin: 'ocr', illegibleSpans: spans.length ? spans : undefined, ocrConfidence: Math.round(confidence * 100) / 100 });
  }
  return out;
}

/**
 * Ergänzt Seiten um Text aus Bildern. pdfPageImages: gerenderte PDF-Seiten mit imageText.
 * Gibt die Zahl der Seiten mit ergänztem Text zurück.
 */
export async function leseBildtext(pages: RawPage[], ocr: OcrEngine | undefined, pdfPageImages: Map<number, Uint8Array>, warnings: string[]): Promise<number> {
  const offen = pages.filter((p) => p.images?.length || (p.imageText && pdfPageImages.has(p.page)));
  if (!offen.length) return 0;
  if (!ocr) {
    warnings.push(`${offen.length} Seite(n) mit Bildern: Text darin wurde nicht gelesen (Texterkennung nicht verfügbar).`);
    return 0;
  }
  let bilder = 0, uebersprungen = 0, ergaenzt = 0;
  for (const p of offen) {
    const quellen = p.imageText ? [{ bytes: pdfPageImages.get(p.page)!, mediaType: 'image/png' }] : p.images!;
    const vorhanden = p.blocks.map((b) => b.text).join('\n');
    const neu: Block[] = [];
    for (const img of quellen) {
      if (bilder >= BILDER_MAX) { uebersprungen++; continue; }
      bilder++;
      try {
        const r = await ocr.recognize(img.bytes, img.mediaType);
        neu.push(...filtereBildtext(r.blocks, r.confidence, vorhanden + '\n' + neu.map((b) => b.text).join('\n')));
      } catch { /* defektes oder nicht lesbares Bild: überspringen */ }
    }
    if (neu.length) { p.blocks.push(...neu); ergaenzt++; }
    delete p.images;
  }
  if (uebersprungen) warnings.push(`${uebersprungen} weitere Bild(er) nicht per Texterkennung gelesen (Grenze ${BILDER_MAX} je Dokument).`);
  if (ergaenzt) warnings.push(`Text aus Bildern auf ${ergaenzt} Seite(n) per Texterkennung ergänzt – bitte gegenlesen.`);
  return ergaenzt;
}
