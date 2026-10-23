/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { importFile, type ImportContext } from './pipeline';
import { parseTranscript } from './ocr/claude';
import { chunkPages } from './chunk';
import type { Fingerprint } from './types';

const fixture = (name: string) => new Uint8Array(readFileSync(new URL(`./__fixtures__/${name}`, import.meta.url)));
const load = (name: string, ctx?: ImportContext) => importFile({ name, bytes: fixture(name) }, ctx);

describe('Word', () => {
  it('erkennt Überschriften als Kapitelpfad und markiert geschätzte Seiten', async () => {
    const r = await load('skript_v1.docx');
    expect(r.document.kind).toBe('docx');
    expect(r.report.chapters).toContain('Kapitel 1: Dekubitusprophylaxe > 1.1 Risikoeinschätzung');
    const braden = r.chunks.find((c) => c.text.includes('Braden-Skala'))!;
    expect(braden.chapter).toBe('Kapitel 1: Dekubitusprophylaxe > 1.1 Risikoeinschätzung');
    expect(braden.text).toContain('18 Punkten oder weniger');
    expect(r.chunks.map((c) => c.page)).toEqual([1, 1, 2, 3]);
    expect(r.chunks.every((c) => c.pageEstimated)).toBe(true);
    expect(r.report.warnings.join()).toMatch(/geschätzt/);
  });

  it('nutzt gespeicherte Seitenumbrüche und die Startseitenzahl', async () => {
    const r = await load('skript_word_gespeichert.docx');
    expect(r.chunks.map((c) => [c.page, c.printedPage])).toEqual([[1, '17'], [1, '17'], [2, '18'], [3, '19']]);
    expect(r.chunks.some((c) => c.pageEstimated)).toBe(false);
  });
});

describe('PDF', () => {
  it('liest Lesezeichen, gedruckte Seitenzahlen und entfernt Fußzeilen aus dem Text', async () => {
    const r = await load('skript_v1.pdf');
    expect(r.report.pages).toBe(3);
    expect(r.report.printedPagesFound).toBe(3);
    const atem = r.chunks.find((c) => c.text.includes('Atemfrequenz'))!;
    expect(atem).toMatchObject({ page: 3, printedPage: '3', chapter: 'Kapitel 2: Pneumonieprophylaxe' });
    expect(atem.text).toContain('12 bis 18 Atemzügen pro Minute');
    expect(r.chunks.every((c) => !/^\d+$/.test(c.text.trim()))).toBe(true);
  });

  it('erkennt Überschriften ohne Lesezeichen über die Schriftgröße', async () => {
    const r = await load('skript_v1_ohne_lesezeichen.pdf');
    expect(r.report.chapters).toEqual([
      'Kapitel 1: Dekubitusprophylaxe',
      'Kapitel 1: Dekubitusprophylaxe > 1.1 Risikoeinschätzung',
      'Kapitel 1: Dekubitusprophylaxe > 1.2 Maßnahmen',
      'Kapitel 2: Pneumonieprophylaxe',
    ]);
  });
});

describe('PowerPoint', () => {
  it('macht jede Folie zur Seite, Titel zum Kapitel, Notizen zu eigenen Chunks', async () => {
    const r = await load('pflegeprozess.pptx');
    expect(r.report.chapters).toEqual(['Pflegeprozess', 'PESR-Format', 'SMART-Ziele']);
    const pesr = r.chunks.filter((c) => c.page === 2);
    expect(pesr.map((c) => c.origin)).toEqual([undefined, 'notes']);
    expect(pesr[0].text).toBe('Problem, Ätiologie, Symptome, Ressourcen');
  });
});

describe('Chunks', () => {
  it('bleiben auf einer Seite und unter 350 Wörtern', () => {
    const para = (n: number) => Array.from({ length: n }, (_, i) => `wort${i}`).join(' ');
    const { chunks } = chunkPages('d', [
      { page: 1, blocks: [{ text: 'Kapitel', headingLevel: 1 }, { text: para(200) }, { text: para(200) }, { text: para(50) }] },
      { page: 2, blocks: [{ text: para(30) }] },
    ], (() => { let i = 0; return () => `c${i++}`; })());
    expect(chunks.map((c) => [c.page, c.text.split(/\s+/).length])).toEqual([[1, 200], [1, 250], [2, 30]]);
    expect(chunks[2].chapter).toBe('Kapitel');
  });
});

describe('Dubletten und Versionen', () => {
  it('erkennt gleiche Datei, gleiches Dokument in anderem Format und neue Fassung', async () => {
    const existing: Array<Fingerprint & { kind?: string }> = [];
    const add = async (name: string) => {
      const r = await load(name, { existing });
      existing.push({ ...r.fingerprint, kind: r.document.kind });
      return r;
    };
    const v1 = await add('skript_v1.docx');
    expect(v1.report.matches).toEqual([]);

    const again = await load('skript_v1.docx', { existing });
    expect(again.report.matches[0].kind).toBe('gleiche-datei');

    const pdf = await add('skript_v1.pdf');
    expect(pdf.report.matches[0]).toMatchObject({ kind: 'anderes-format', otherDocumentId: v1.document.id });

    const v2 = await load('skript_v2.docx', { existing });
    const m = v2.report.matches.find((x) => x.otherDocumentId === v1.document.id)!;
    expect(m.kind).toBe('neue-version');
    expect(m.added).toEqual(['Neu in Auflage 2: Hautinspektion bei jedem Positionswechsel dokumentieren.']);
    expect(m.removed).toEqual([]);
    expect(v2.document.previousVersionId).toBe(v1.document.id);
  });
});

describe('Handschrift-Transkript', () => {
  it('übersetzt Unsicherheits-Markierungen in illegibleSpans', () => {
    const r = parseTranscript('# Vitalzeichen\n\nPuls ⟦82?⟧ /min, RR ⟦?⟧ mmHg');
    expect(r.blocks[0]).toMatchObject({ text: 'Vitalzeichen', headingLevel: 1 });
    const b = r.blocks[1];
    expect(b.text).toBe('Puls 82 /min, RR ⟦?⟧ mmHg');
    expect(b.illegibleSpans!.map((s) => b.text.slice(s.start, s.end))).toEqual(['82', '⟦?⟧']);
    expect(r.confidence).toBeLessThan(1);
  });
});
