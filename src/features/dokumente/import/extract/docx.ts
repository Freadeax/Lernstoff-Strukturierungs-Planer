// Word (.docx) direkt aus dem OOXML lesen. mammoth.js verwirft Seitenumbrüche, deshalb hier JSZip + XML.
// Seitenzahlen: Word schreibt beim Speichern <w:lastRenderedPageBreak/> an jede Stelle, an der beim letzten
// Rendern eine Seite begann. Das ist die beste verfügbare Seitenzuordnung ohne eigenes Layout.
// Fehlen diese Marker (Datei nie in Word gespeichert, z. B. aus Google Docs oder generiert), zählen nur harte
// Umbrüche, und die Seiten werden zusätzlich grob über die Textmenge geschätzt (pageEstimated = true).
// Fußnoten stehen als [1] im Text und als eigener Block (origin 'footnote') am Ende der Seite, auf der sie
// verwiesen werden; Endnoten ([i]) am Dokumentende. Textfelder und umrahmte/schattierte Absätze sowie
// Absätze mit Formatvorlagen wie „Merke“ oder „Kasten“ werden zu Merkkästen (origin 'box').
import type { Block, Extracted, RawPage } from '../types';
import { attr, coreMeta, desc, embeddedImages, kid, kids, openZip, rels, type El } from './ooxml';
import { editionHint } from './hints';

const CHARS_PER_PAGE_ESTIMATE = 3000;

export async function extractDocx(bytes: Uint8Array): Promise<Extracted> {
  const { xml, zip } = await openZip(bytes);
  const docRels = await rels(xml, 'word/_rels/document.xml.rels', 'word/');
  const seenImages = new Set<string>();
  const doc = await xml('word/document.xml');
  if (!doc) throw new Error('Keine word/document.xml – beschädigte oder keine Word-Datei');
  const warnings: string[] = [];
  const { headingLevels, boxStyles } = await styleInfo(xml);
  const footnotes = await noteTexts(xml, 'word/footnotes.xml', 'footnote');
  const endnotes = await noteTexts(xml, 'word/endnotes.xml', 'endnote');
  const body = desc(doc, 'body')[0];

  const rendered = desc(body, 'lastRenderedPageBreak').length > 0;
  if (!rendered) warnings.push('Word-Datei enthält keine gespeicherten Seitenumbrüche; Seitenzahlen sind geschätzt. Für exakte Seitenangaben das PDF der Datei importieren.');
  const bodySect = kid(body, 'sectPr');
  const pageOffset = Number(attr(kid(bodySect ?? body, 'pgNumType'), 'start') ?? 1) - 1;
  if (desc(body, 'pgNumType').length > 1) warnings.push('Mehrere Abschnitte mit eigener Seitennummerierung; gedruckte Seitenzahlen können abweichen.');

  const pages: RawPage[] = [];
  let page = 1;
  let charsOnPage = 0;
  const cur = (): RawPage => {
    let p = pages[pages.length - 1];
    if (!p || p.page !== page) {
      p = { page, blocks: [], pageEstimated: !rendered || undefined, printedPage: rendered ? String(page + pageOffset) : undefined };
      pages.push(p);
    }
    return p;
  };
  // Fußnoten der aktuellen Seite; sie werden beim Seitenwechsel als eigener Block an die Seite gehängt.
  let pendingFootnotes: string[] = [];
  const pendingEndnotes: string[] = [];
  const noteNumbers = new Map<string, number>();
  const flushFootnotes = () => {
    if (!pendingFootnotes.length) return;
    cur().blocks.push({ text: pendingFootnotes.join('\n'), origin: 'footnote' });
    pendingFootnotes = [];
  };
  const newPage = () => { flushFootnotes(); page++; charsOnPage = 0; };
  const noteRef = (kind: 'footnote' | 'endnote', id: string): string => {
    const notes = kind === 'footnote' ? footnotes : endnotes;
    const text = notes.get(id);
    if (text === undefined) return '';
    const key = `${kind}:${id}`;
    let n = noteNumbers.get(key);
    if (n === undefined) {
      n = [...noteNumbers.keys()].filter((k) => k.startsWith(kind)).length + 1;
      noteNumbers.set(key, n);
      const mark = kind === 'footnote' ? String(n) : roman(n);
      if (text) (kind === 'footnote' ? pendingFootnotes : pendingEndnotes).push(`[${mark}] ${text}`);
    }
    return `[${kind === 'footnote' ? n : roman(n)}]`;
  };
  const push = (b: Block) => {
    if (!b.text.trim()) return;
    if (!rendered && charsOnPage > CHARS_PER_PAGE_ESTIMATE) newPage();
    cur().blocks.push(b);
    charsOnPage += b.text.length;
  };

  for (const node of childrenInOrder(body)) {
    if (node.localName === 'tbl') {
      const rows = desc(node, 'tr').map((tr) => kids(tr, 'tc').map((tc) => desc(tc, 't').map((t) => t.textContent).join('').trim()).join(' | '));
      push({ text: rows.join('\n'), origin: 'table' });
      if (rendered) for (let i = 0; i < desc(node, 'lastRenderedPageBreak').length; i++) newPage();
      continue;
    }
    if (node.localName !== 'p') continue;
    const pPr = kid(node, 'pPr');
    const level = headingLevel(pPr, headingLevels);
    const box = !level && isBoxParagraph(pPr, boxStyles);
    if (!rendered && kid(pPr ?? node, 'pageBreakBefore') && charsOnPage > 0) newPage();

    let text = '';
    const flush = () => {
      if (text.trim()) push({ text: text.trim(), headingLevel: level, ...(box ? { origin: 'box' as const } : {}) });
      text = '';
    };
    walkRuns(node, (ev) => {
      if (ev === 'render-break') { if (rendered) { flush(); newPage(); } }
      else if (ev === 'hard-break') { if (!rendered) { flush(); newPage(); } }
      else if (typeof ev === 'string') text += ev;
      else text += noteRef(ev.note, ev.id);
    });
    flush();
    // Textfelder (Merkkästen, Randnotizen) nach dem Absatz, an dem sie verankert sind.
    for (const t of textBoxes(node)) push({ text: t, origin: 'box' });
    // Bilder (Schaubilder, eingefügte Scans) zur Texterkennung an die Seite hängen, auf der sie verankert sind.
    const imgs = await embeddedImages(zip, node, docRels, seenImages);
    if (imgs.length) { const pg = cur(); pg.images = [...(pg.images ?? []), ...imgs]; }
    // Abschnittswechsel "nächste Seite" steht im pPr des letzten Absatzes des Abschnitts.
    const sect = kid(pPr ?? node, 'sectPr');
    if (!rendered && sect && attr(kid(sect, 'type'), 'val') !== 'continuous') newPage();
  }

  flushFootnotes();
  if (pendingEndnotes.length) cur().blocks.push({ text: pendingEndnotes.join('\n'), origin: 'footnote' });

  const meta = await coreMeta(xml);
  meta.editionHint = editionHint(pages.flatMap((p) => p.blocks.map((b) => b.text)).join('\n'), meta.title);
  return { kind: 'docx', pages, meta, warnings };
}

function childrenInOrder(el: El): El[] {
  const out: El[] = [];
  for (let n = el.firstChild; n; n = n.nextSibling) {
    if (n.nodeType !== 1) continue;
    const e = n as El;
    // Inhaltssteuerelemente (w:sdt) enthalten ihrerseits Absätze, z. B. Inhaltsverzeichnisse.
    if (e.localName === 'sdt') out.push(...childrenInOrder(kid(e, 'sdtContent') ?? e));
    else out.push(e);
  }
  return out;
}

type RunEvent = string | { note: 'footnote' | 'endnote'; id: string };

/**
 * Läuft in Dokumentreihenfolge über den Absatz und meldet Text, Umbruch-Ereignisse und Fußnotenverweise.
 * Textfelder (txbxContent) werden übersprungen und getrennt gelesen; von mc:AlternateContent nur die erste
 * Variante (Choice), sonst stünde der Text doppelt da.
 */
function walkRuns(p: El, emit: (ev: RunEvent) => void) {
  const walk = (n: Node) => {
    for (let c = n.firstChild; c; c = c.nextSibling) {
      if (c.nodeType !== 1) continue;
      const e = c as El;
      switch (e.localName) {
        case 'del': case 'instrText': case 'delText': case 'pPr': case 'rPr': case 'txbxContent': case 'Fallback':
        case 'footnoteRef': case 'endnoteRef': case 'separator': case 'continuationSeparator': continue;
        case 'footnoteReference': case 'endnoteReference': {
          const id = attr(e, 'id');
          if (id !== undefined) emit({ note: e.localName === 'footnoteReference' ? 'footnote' : 'endnote', id });
          break;
        }
        case 't': emit(e.textContent ?? ''); break;
        case 'tab': emit('\t'); break;
        case 'cr': emit('\n'); break;
        case 'br': emit(attr(e, 'type') === 'page' ? 'hard-break' : '\n'); break;
        case 'lastRenderedPageBreak': emit('render-break'); break;
        default: walk(e);
      }
    }
  };
  walk(p);
}

function headingLevel(pPr: El | undefined, styleLevels: Map<string, number>): number | undefined {
  if (!pPr) return undefined;
  const direct = attr(kid(pPr, 'outlineLvl'), 'val');
  if (direct !== undefined && Number(direct) < 9) return Number(direct) + 1;
  const style = attr(kid(pPr, 'pStyle'), 'val');
  return style ? styleLevels.get(style) : undefined;
}

const BOX_STYLE = /merk|kasten|box|info|hinweis|wichtig|achtung|tipp|cave|definition/i;

/** Umrahmt oder farbig hinterlegt (nicht weiß/automatisch) oder Formatvorlage eines Merkkastens. */
function isBoxParagraph(pPr: El | undefined, boxStyles: Set<string>): boolean {
  if (!pPr) return false;
  const style = attr(kid(pPr, 'pStyle'), 'val');
  if (style && boxStyles.has(style)) return true;
  return hasBoxFormat(pPr);
}

function hasBoxFormat(pPr: El): boolean {
  const bdr = kid(pPr, 'pBdr');
  if (bdr && kids(bdr, 'top').concat(kids(bdr, 'left'), kids(bdr, 'bottom'), kids(bdr, 'right')).some((b) => !['nil', 'none'].includes(attr(b, 'val') ?? 'none'))) return true;
  const fill = attr(kid(pPr, 'shd'), 'fill')?.toLowerCase();
  return !!fill && !['auto', 'ffffff', 'none'].includes(fill);
}

/** Reiner Text eines Absatzes ohne Umbruch-Ereignisse und Verweise (für Textfelder und Fußnoten). */
function plainText(p: El): string {
  let t = '';
  walkRuns(p, (ev) => { if (typeof ev === 'string' && ev !== 'render-break' && ev !== 'hard-break') t += ev; });
  return t.trim();
}

/** Text je Textfeld des Absatzes, Absätze darin mit Zeilenumbruch getrennt. */
function textBoxes(p: El): string[] {
  const out: string[] = [];
  const walk = (n: Node) => {
    for (let c = n.firstChild; c; c = c.nextSibling) {
      if (c.nodeType !== 1) continue;
      const e = c as El;
      if (e.localName === 'Fallback') continue;
      if (e.localName === 'txbxContent') {
        const text = desc(e, 'p').map(plainText).filter(Boolean).join('\n');
        if (text) out.push(text);
        continue;
      }
      walk(e);
    }
  };
  walk(p);
  return out;
}

/** Fuß- oder Endnoten: id -> Text (ohne Trenner-Einträge). */
async function noteTexts(xml: (p: string) => Promise<globalThis.Document | undefined>, path: string, local: string): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const doc = await xml(path);
  if (!doc) return map;
  for (const n of desc(doc, local)) {
    const type = attr(n, 'type');
    if (type && type !== 'normal') continue;
    const text = kids(n, 'p').map(plainText).filter(Boolean).join(' ');
    map.set(attr(n, 'id') ?? '', text.replace(/\s+/g, ' ').trim());
  }
  return map;
}

function roman(n: number): string {
  const r: Array<[number, string]> = [[1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'], [100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'], [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']];
  let out = '';
  for (const [v, s] of r) while (n >= v) { out += s; n -= v; }
  return out;
}

/** styleId -> Überschriftenebene und Formatvorlagen für Merkkästen, aus styles.xml. */
async function styleInfo(xml: (p: string) => Promise<globalThis.Document | undefined>): Promise<{ headingLevels: Map<string, number>; boxStyles: Set<string> }> {
  const map = new Map<string, number>();
  const boxStyles = new Set<string>();
  const styles = await xml('word/styles.xml');
  if (!styles) return { headingLevels: map, boxStyles };
  const byId = new Map<string, El>();
  for (const s of desc(styles, 'style')) byId.set(attr(s, 'styleId') ?? '', s);
  const levelOf = (s: El | undefined, depth = 0): number | undefined => {
    if (!s || depth > 5) return undefined;
    const name = attr(kid(s, 'name'), 'val') ?? '';
    const m = /^(?:heading|überschrift)\s*(\d)$/i.exec(name);
    if (m) return Number(m[1]);
    const ol = attr(kid(kid(s, 'pPr') ?? s, 'outlineLvl'), 'val');
    if (ol !== undefined && Number(ol) < 9) return Number(ol) + 1;
    return levelOf(byId.get(attr(kid(s, 'basedOn'), 'val') ?? ''), depth + 1);
  };
  const isBox = (s: El | undefined, depth = 0): boolean => {
    if (!s || depth > 5 || attr(s, 'type') === 'character') return false;
    const name = attr(kid(s, 'name'), 'val') ?? '';
    if (BOX_STYLE.test(name)) return true;
    const pPr = kid(s, 'pPr');
    if (pPr && hasBoxFormat(pPr)) return true;
    return isBox(byId.get(attr(kid(s, 'basedOn'), 'val') ?? ''), depth + 1);
  };
  for (const [id, s] of byId) {
    const l = levelOf(s);
    if (l) map.set(id, l);
    else if (attr(s, 'type') !== 'table' && isBox(s)) boxStyles.add(id);
  }
  return { headingLevels: map, boxStyles };
}
