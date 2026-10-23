// PDF über pdf.js. Liefert pro physischer Seite Textblöcke mit Überschriftenebene, die gedruckte Seitenzahl
// und markiert Seiten ohne Textebene (Scans) für die OCR.
// Kapitel: zuerst Lesezeichen (Outline) des PDFs, sonst Schriftgrößen-Heuristik.
// Gedruckte Seitenzahl: zuerst PDF-Seitenlabels, sonst eine Zahl in Kopf-/Fußzeile.
// Legacy-Build: enthält Polyfills (z. B. Promise.try), die ältere iOS-Safari-Versionen und Node 22 nicht haben.
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { Block, Extracted, RawPage } from '../types';
import { editionHint } from './hints';

type PDFDoc = Awaited<ReturnType<typeof pdfjs.getDocument>['promise']>;
type PDFPage = Awaited<ReturnType<PDFDoc['getPage']>>;

interface Item { str: string; x: number; y: number; w: number; size: number; eol: boolean }
interface Line { text: string; y: number; size: number }

const MARGIN = 0.08;           // obere/untere 8 % der Seite = Kopf-/Fußzeile
const MIN_TEXT_CHARS = 25;     // darunter gilt eine Seite als Scan
const PAGE_NUMBER = /^(?:(?:Seite|S\.)\s*)?(\d{1,4}|[ivxlcdm]{1,7})(?:\s*(?:von|\/)\s*\d{1,4})?$/i;

export interface PdfExtractOptions {
  /** Rendert Scan-Seiten als PNG für die OCR. Fehlt sie, werden Scan-Seiten nur markiert. */
  render?: boolean;
  renderScale?: number;
}

export interface PdfExtracted extends Extracted {
  /** PNG je Scan-Seite (Seitenindex 1-basiert), nur wenn render = true. */
  pageImages: Map<number, Uint8Array>;
}

export async function extractPdf(bytes: Uint8Array, opts: PdfExtractOptions = {}): Promise<PdfExtracted> {
  // pdf.js übernimmt den Puffer; Kopie, damit der Aufrufer die Bytes weiter nutzen kann (Hash, Speicherung).
  const task = pdfjs.getDocument({ data: bytes.slice(), useSystemFonts: true });
  const doc = await task.promise;
  const warnings: string[] = [];
  const labels = await doc.getPageLabels().catch(() => null);
  const outline = await outlineByPage(doc);

  const pages: RawPage[] = [];
  const lineSets: Line[][] = [];
  const margins: Array<{ top: string[]; bottom: string[] }> = [];
  const pageImages = new Map<number, Uint8Array>();

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const { height } = page.getViewport({ scale: 1 });
    const lines = await pageLines(page);
    const body: Line[] = [];
    const m = { top: [] as string[], bottom: [] as string[] };
    for (const l of lines) {
      if (l.y > height * (1 - MARGIN)) m.top.push(l.text);
      else if (l.y < height * MARGIN) m.bottom.push(l.text);
      else body.push(l);
    }
    lineSets.push(body);
    margins.push(m);
    const chars = lines.reduce((n, l) => n + l.text.replace(/\s/g, '').length, 0);
    const p: RawPage = { page: i, blocks: [] };
    if (chars < MIN_TEXT_CHARS) {
      p.needsOcr = true;
      if (opts.render) pageImages.set(i, await renderPng(doc, page, opts.renderScale ?? 2.5));
    }
    pages.push(p);
    page.cleanup();
  }

  // Wiederkehrende Kopf-/Fußzeilen (z. B. Buchtitel) nicht in den Lerntext übernehmen.
  const running = runningLines(margins);
  const bodySize = mode(lineSets.flat().map((l) => round(l.size)));
  const headingSizes = [...new Set(lineSets.flat().map((l) => round(l.size)).filter((s) => s > bodySize * 1.15))].sort((a, b) => b - a).slice(0, 3);

  let printedFound = 0;
  for (const [idx, p] of pages.entries()) {
    const label = labels?.[idx];
    const fromMargin = [...margins[idx].bottom, ...margins[idx].top].map((t) => PAGE_NUMBER.exec(t.trim())).find(Boolean)?.[1];
    if (label && label !== String(idx + 1)) p.printedPage = label;
    else if (fromMargin) p.printedPage = fromMargin;
    else if (label) p.printedPage = label;
    if (fromMargin || (label && label !== String(idx + 1))) printedFound++;

    const extra = [...margins[idx].top, ...margins[idx].bottom].filter((t) => !running.has(norm(t)) && !PAGE_NUMBER.test(t.trim()));
    const blocks = linesToBlocks(lineSets[idx], headingSizes);
    if (outline.size) applyOutline(blocks, outline.get(idx + 1) ?? []);
    if (extra.length) blocks.push(...extra.map((text) => ({ text })));
    p.blocks = blocks;
  }
  if (!printedFound) warnings.push('Keine gedruckten Seitenzahlen erkannt; Quellenangaben nutzen die PDF-Seite.');
  const ocrNeeded = pages.filter((p) => p.needsOcr).length;
  if (ocrNeeded) warnings.push(`${ocrNeeded} Seite(n) ohne Textebene (Scan) – OCR nötig.`);

  const info = (await doc.getMetadata().catch(() => null))?.info as Record<string, string> | undefined;
  const meta = {
    title: info?.Title || undefined,
    modified: pdfDate(info?.ModDate),
    editionHint: editionHint(pages.slice(0, 3).flatMap((p) => p.blocks.map((b) => b.text)).join('\n'), info?.Title),
  };
  await task.destroy();
  return { kind: 'pdf', pages, meta, warnings, outlineUsed: outline.size > 0, pageImages };
}

async function pageLines(page: PDFPage): Promise<Line[]> {
  const content = await page.getTextContent();
  const items: Item[] = [];
  for (const it of content.items) {
    if (!('str' in it)) continue;
    const [a, b, , , x, y] = it.transform as number[];
    items.push({ str: it.str, x, y, w: it.width, size: Math.hypot(a, b) || it.height, eol: it.hasEOL });
  }
  // Zeilen: gleiche Grundlinie (Toleranz relativ zur Schriftgröße), dann von links nach rechts.
  items.sort((p, q) => q.y - p.y || p.x - q.x);
  const lines: Line[] = [];
  let cur: Item[] = [];
  const flush = () => {
    if (!cur.length) return;
    cur.sort((p, q) => p.x - q.x);
    let text = '';
    let end = -Infinity;
    for (const it of cur) {
      if (text && !text.endsWith(' ') && !it.str.startsWith(' ') && it.x - end > it.size * 0.2) text += ' ';
      text += it.str;
      end = it.x + it.w;
    }
    const size = Math.max(...cur.filter((i) => i.str.trim()).map((i) => i.size), 0);
    if (text.trim()) lines.push({ text: text.replace(/\s+/g, ' ').trim(), y: cur[0].y, size });
    cur = [];
  };
  for (const it of items) {
    if (cur.length && Math.abs(cur[0].y - it.y) > Math.max(2, cur[0].size * 0.4)) flush();
    if (it.str.trim() || cur.length) cur.push(it);
  }
  flush();
  return lines;
}

/** Zeilen zu Absätzen: neuer Absatz bei größerem Zeilenabstand oder Größenwechsel; Silbentrennung auflösen. */
function linesToBlocks(lines: Line[], headingSizes: number[]): Block[] {
  const blocks: Block[] = [];
  let buf: Line[] = [];
  const level = (l: Line) => {
    const i = headingSizes.indexOf(round(l.size));
    return i >= 0 && l.text.length < 140 ? i + 1 : undefined;
  };
  const flush = () => {
    if (!buf.length) return;
    let text = '';
    for (const l of buf) text = /[a-zäöüß]-$/.test(text) && /^[a-zäöüß]/.test(l.text) ? text.slice(0, -1) + l.text : text ? `${text} ${l.text}` : l.text;
    blocks.push({ text, headingLevel: level(buf[0]) });
    buf = [];
  };
  for (const [i, l] of lines.entries()) {
    const prev = lines[i - 1];
    if (prev) {
      const gap = prev.y - l.y;
      const sizeChange = round(prev.size) !== round(l.size);
      if (gap > prev.size * 1.6 || sizeChange || level(l) !== undefined) flush();
    }
    buf.push(l);
    if (level(l) !== undefined) flush();
  }
  flush();
  return blocks;
}

/**
 * Lesezeichen sind verlässlicher als Schriftgrößen: Ebenen kommen aus dem Outline, die Position auf der Seite
 * aus dem passenden Textblock. Nicht gefundene Lesezeichen werden am Seitenanfang eingefügt.
 */
function applyOutline(blocks: Block[], entries: Array<{ title: string; level: number }>) {
  for (const b of blocks) b.headingLevel = undefined;
  let insertAt = 0;
  for (const e of entries) {
    const t = norm(e.title);
    const i = blocks.findIndex((b, j) => j >= insertAt && norm(b.text).startsWith(t));
    if (i >= 0) {
      if (norm(blocks[i].text) === t) blocks[i].headingLevel = e.level;
      else {
        blocks.splice(i, 1, { text: e.title, headingLevel: e.level }, { text: blocks[i].text.slice(e.title.length).trim() });
      }
      insertAt = i + 1;
    } else {
      blocks.splice(insertAt, 0, { text: e.title, headingLevel: e.level });
      insertAt++;
    }
  }
}

async function outlineByPage(doc: PDFDoc): Promise<Map<number, Array<{ title: string; level: number }>>> {
  const map = new Map<number, Array<{ title: string; level: number }>>();
  const outline = await doc.getOutline().catch(() => null);
  if (!outline) return map;
  const walk = async (items: typeof outline, level: number) => {
    for (const it of items) {
      try {
        const dest = typeof it.dest === 'string' ? await doc.getDestination(it.dest) : it.dest;
        if (dest?.[0]) {
          const page = (await doc.getPageIndex(dest[0] as never)) + 1;
          map.set(page, [...(map.get(page) ?? []), { title: it.title.trim(), level: Math.min(level, 4) }]);
        }
      } catch { /* Lesezeichen ohne gültiges Ziel ignorieren */ }
      if (it.items?.length) await walk(it.items, level + 1);
    }
  };
  await walk(outline, 1);
  return map;
}

async function renderPng(doc: PDFDoc, page: PDFPage, scale: number): Promise<Uint8Array> {
  const viewport = page.getViewport({ scale });
  const factory = doc.canvasFactory as { create(w: number, h: number): { canvas: any; context: any } };
  const { canvas, context } = factory.create(Math.ceil(viewport.width), Math.ceil(viewport.height));
  await page.render({ canvasContext: context, canvas, viewport }).promise;
  if (typeof canvas.toBuffer === 'function') return new Uint8Array(canvas.toBuffer('image/png'));   // Node (@napi-rs/canvas)
  const blob: Blob = canvas.convertToBlob ? await canvas.convertToBlob({ type: 'image/png' }) : await new Promise((r) => canvas.toBlob(r, 'image/png'));
  return new Uint8Array(await blob.arrayBuffer());
}

function runningLines(margins: Array<{ top: string[]; bottom: string[] }>): Set<string> {
  const count = new Map<string, number>();
  for (const m of margins) for (const t of new Set([...m.top, ...m.bottom].map(norm))) count.set(t, (count.get(t) ?? 0) + 1);
  const min = Math.max(2, Math.ceil(margins.length * 0.5));
  return new Set([...count].filter(([, n]) => n >= min).map(([t]) => t));
}

const norm = (t: string) => t.toLowerCase().replace(/\d+/g, '#').replace(/\s+/g, ' ').trim();
const round = (n: number) => Math.round(n * 2) / 2;
function mode(xs: number[]): number {
  const c = new Map<number, number>();
  for (const x of xs) c.set(x, (c.get(x) ?? 0) + 1);
  return [...c].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 10;
}
function pdfDate(d?: string): string | undefined {
  const m = d && /D:(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?/.exec(d);
  return m ? new Date(Date.UTC(+m[1], +(m[2] ?? 1) - 1, +(m[3] ?? 1), +(m[4] ?? 0), +(m[5] ?? 0))).toISOString() : undefined;
}
