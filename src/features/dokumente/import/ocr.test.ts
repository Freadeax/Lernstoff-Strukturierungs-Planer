/// <reference types="node" />
// Echte OCR mit Tesseract.js und dem deutschen Sprachmodell aus @tesseract.js-data/deu (dauert einige Sekunden).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { importFile } from './pipeline';
import { createTesseractEngine } from './ocr/tesseract';

const langPath = fileURLToPath(new URL('../../../../node_modules/@tesseract.js-data/deu/4.0.0_best_int', import.meta.url));

describe('OCR', () => {
  const engine = createTesseractEngine({ langPath, cache: false });
  afterAll(async () => (await engine).terminate());

  it('liest einen gescannten Lehrtext mit hoher Sicherheit', async () => {
    const bytes = new Uint8Array(readFileSync(new URL('./__fixtures__/scan_seite1.png', import.meta.url)));
    const r = await importFile({ name: 'scan_seite1.png', bytes }, { ocr: await engine });
    expect(r.document.kind).toBe('image');
    expect(r.report.ocrPages).toBe(1);
    const text = r.chunks.map((c) => c.text).join(' ').replace(/\s+/g, ' ');
    expect(text).toContain('Braden-Skala');
    expect(text).toContain('18 Punkten');
    expect(r.chunks[0].ocrConfidence).toBeGreaterThan(0.85);
  }, 60_000);

  it('erkennt ein PDF ohne Textebene als Scan und liest es per OCR', async () => {
    const bytes = new Uint8Array(readFileSync(new URL('./__fixtures__/scan.pdf', import.meta.url)));
    const r = await importFile({ name: 'scan.pdf', bytes }, { ocr: await engine });
    expect(r.document.kind).toBe('pdf');
    expect(r.report.ocrPages).toBe(1);
    expect(r.chunks[0]).toMatchObject({ page: 1 });
    expect(r.chunks.map((c) => c.text).join(' ')).toContain('Dekubitus');
  }, 60_000);
});
