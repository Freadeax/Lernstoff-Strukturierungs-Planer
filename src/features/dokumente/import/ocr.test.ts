/// <reference types="node" />
// Echte OCR mit Tesseract.js und dem deutschen Sprachmodell aus @tesseract.js-data/deu (dauert einige Sekunden).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { importFile } from './pipeline';
import { createTesseractEngine } from './ocr/tesseract';
import type { Fingerprint } from './types';

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

  it('liest Text in Folienbildern, jedes Bild nur einmal je Dokument', async () => {
    const bytes = new Uint8Array(readFileSync(new URL('./__fixtures__/folie_mit_bild.pptx', import.meta.url)));
    const r = await importFile({ name: 'folie_mit_bild.pptx', bytes }, { ocr: await engine });
    const bild = r.chunks.filter((c) => c.origin === 'ocr');
    expect(bild.map((c) => c.page)).toEqual([1]);
    expect(bild[0].text).toMatch(/alle zwei Stunden/);
    expect(bild[0].ocrConfidence).toBeGreaterThan(0.7);
    expect(r.report.imageTextPages).toBe(1);
  }, 60_000);

  it('ergänzt im PDF mit Textebene nur den Text der Abbildung, nicht die Textebene doppelt', async () => {
    const bytes = new Uint8Array(readFileSync(new URL('./__fixtures__/skript_mit_abbildung.pdf', import.meta.url)));
    const r = await importFile({ name: 'skript_mit_abbildung.pdf', bytes }, { ocr: await engine });
    expect(r.report.ocrPages).toBe(0);
    const bild = r.chunks.filter((c) => c.origin === 'ocr').map((c) => c.text).join(' ');
    expect(bild).toMatch(/Fersen frei/);
    expect(bild).not.toMatch(/Einschätzung des Risikos/);
    expect(r.chunks.filter((c) => c.origin !== 'ocr').map((c) => c.text).join(' ')).toMatch(/Einschätzung des Risikos/);
  }, 60_000);
});

describe('A-04 · Quellen (Website-Audit)', () => {
  const engine = createTesseractEngine({ langPath, cache: false });
  afterAll(async () => (await engine).terminate());
  const datei = (name: string) => ({ name, bytes: new Uint8Array(readFileSync(new URL(`./__fixtures__/${name}`, import.meta.url))) });

  it('Scan, natives PDF, neue Fassung und dieselbe Datei erneut: Bericht, Dublette, Fassung, Seiten und Leselücken stimmen', async () => {
    const vorhanden: Array<Fingerprint & { kind?: string }> = [];
    const merke = (r: Awaited<ReturnType<typeof importFile>>) => { vorhanden.push({ ...r.fingerprint, kind: r.document.kind }); return r; };

    // natives PDF: Textebene, gedruckte Seitenzahlen, keine OCR
    const nativ = merke(await importFile(datei('skript_v1.pdf'), { ocr: await engine, existing: vorhanden }));
    expect(nativ.report).toMatchObject({ pages: 3, ocrPages: 0, printedPagesFound: 3, matches: [] });
    expect(nativ.chunks.find((c) => c.text.includes('Atemfrequenz'))).toMatchObject({ page: 3, printedPage: '3' });

    // fiktiver Scan: per OCR gelesen, Seitenposition und Sicherheit je Seite; unsichere Seiten wären als Leselücken gelistet
    const scan = merke(await importFile(datei('scan.pdf'), { ocr: await engine, existing: vorhanden }));
    expect(scan.report.ocrPages).toBe(1);
    expect(scan.chunks[0]).toMatchObject({ page: 1 });
    expect(scan.chunks[0]!.ocrConfidence).toBeGreaterThan(0.6);
    expect(scan.report.lowConfidencePages).toEqual(scan.chunks.filter((c) => (c.ocrConfidence ?? 1) < 0.6).map((c) => c.page).filter((p, i, a) => a.indexOf(p) === i));

    // neue Fassung desselben Skripts (Word, Auflage 2): als neue Version des PDFs erkannt, mit Unterschied
    const v2 = await importFile(datei('skript_v2.docx'), { ocr: await engine, existing: vorhanden });
    const m = v2.report.matches.find((x) => x.otherDocumentId === nativ.document.id)!;
    expect(m.kind).toBe('neue-version');
    expect(m.added?.join(' ')).toContain('Hautinspektion');
    expect(v2.document.previousVersionId).toBe(nativ.document.id);

    // dieselbe Datei noch einmal: Dublette, keine zweite Kopie
    const nochmal = await importFile(datei('skript_v1.pdf'), { ocr: await engine, existing: vorhanden });
    expect(nochmal.report.matches[0]).toMatchObject({ kind: 'gleiche-datei', otherDocumentId: nativ.document.id });
  }, 90_000);
});
