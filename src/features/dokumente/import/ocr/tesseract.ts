// Tesseract.js (WASM) – läuft im Browser offline, sobald das Sprachmodell einmal geladen ist.
// Im Browser langPath auf die selbst gehosteten Sprachdaten zeigen lassen (z. B. /tessdata), nicht auf ein CDN.
import Tesseract from 'tesseract.js';
import type { Block } from '../types';
import { ILLEGIBLE, WORD_CONFIDENCE_DROP, WORD_CONFIDENCE_MIN, type OcrEngine, type OcrPage } from './engine';

export async function createTesseractEngine(opts: { langPath?: string; workerPath?: string; corePath?: string; langs?: string; cache?: boolean } = {}): Promise<OcrEngine & { terminate(): Promise<void> }> {
  const worker = await Tesseract.createWorker(opts.langs ?? 'deu', Tesseract.OEM.LSTM_ONLY, {
    langPath: opts.langPath,
    // Nur gesetzte Pfade übergeben: ein explizites undefined überschreibt die Standardpfade von tesseract.js.
    ...(opts.workerPath ? { workerPath: opts.workerPath } : {}),
    ...(opts.corePath ? { corePath: opts.corePath } : {}),
    gzip: true,
    // Im Browser landet das Sprachmodell in IndexedDB; in Node würde es ins Arbeitsverzeichnis geschrieben.
    cacheMethod: opts.cache === false ? 'none' : undefined,
  });
  return {
    name: 'tesseract',
    async recognize(image: Uint8Array): Promise<OcrPage> {
      const { data } = await worker.recognize(toImageLike(image), {}, { blocks: true, text: true });
      const blocks: Block[] = [];
      let wordConfSum = 0;
      let wordCount = 0;
      for (const b of data.blocks ?? []) {
        for (const para of b.paragraphs) {
          let text = '';
          const illegibleSpans: Block['illegibleSpans'] = [];
          for (const line of para.lines) {
            for (const w of line.words) {
              const c = w.confidence / 100;
              wordConfSum += c;
              wordCount++;
              if (text && !text.endsWith('\n')) text += ' ';
              const start = text.length;
              text += c < WORD_CONFIDENCE_DROP ? ILLEGIBLE : w.text;
              if (c < WORD_CONFIDENCE_MIN) illegibleSpans.push({ start, end: text.length });
            }
            text += '\n';
          }
          text = text.trim();
          if (text) blocks.push({ text, origin: 'ocr', illegibleSpans: illegibleSpans.length ? illegibleSpans : undefined });
        }
      }
      return { blocks, confidence: wordCount ? wordConfSum / wordCount : 0, engine: 'tesseract' };
    },
    terminate: () => worker.terminate().then(() => undefined),
  };
}

/** Node erwartet einen Buffer, der Browser einen Blob. */
function toImageLike(image: Uint8Array): Tesseract.ImageLike {
  const NodeBuffer = (globalThis as { Buffer?: { from(b: Uint8Array): Tesseract.ImageLike } }).Buffer;
  return NodeBuffer ? NodeBuffer.from(image) : new Blob([image as BlobPart]);
}
