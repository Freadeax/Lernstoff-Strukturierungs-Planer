// Word (.docx) direkt aus dem OOXML lesen. mammoth.js verwirft Seitenumbrüche, deshalb hier JSZip + XML.
// Seitenzahlen: Word schreibt beim Speichern <w:lastRenderedPageBreak/> an jede Stelle, an der beim letzten
// Rendern eine Seite begann. Das ist die beste verfügbare Seitenzuordnung ohne eigenes Layout.
// Fehlen diese Marker (Datei nie in Word gespeichert, z. B. aus Google Docs oder generiert), zählen nur harte
// Umbrüche, und die Seiten werden zusätzlich grob über die Textmenge geschätzt (pageEstimated = true).
import type { Block, Extracted, RawPage } from '../types';
import { attr, coreMeta, desc, kid, kids, openZip, type El } from './ooxml';
import { editionHint } from './hints';

const CHARS_PER_PAGE_ESTIMATE = 3000;

export async function extractDocx(bytes: Uint8Array): Promise<Extracted> {
  const { xml } = await openZip(bytes);
  const doc = await xml('word/document.xml');
  if (!doc) throw new Error('Keine word/document.xml – beschädigte oder keine Word-Datei');
  const warnings: string[] = [];
  const headingLevels = await styleHeadingLevels(xml);
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
  const newPage = () => { page++; charsOnPage = 0; };
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
    if (!rendered && kid(pPr ?? node, 'pageBreakBefore') && charsOnPage > 0) newPage();

    let text = '';
    const flush = () => {
      if (text.trim()) push({ text: text.trim(), headingLevel: level });
      text = '';
    };
    walkRuns(node, (ev) => {
      if (ev === 'render-break') { if (rendered) { flush(); newPage(); } }
      else if (ev === 'hard-break') { if (!rendered) { flush(); newPage(); } }
      else text += ev;
    });
    flush();
    // Abschnittswechsel "nächste Seite" steht im pPr des letzten Absatzes des Abschnitts.
    const sect = kid(pPr ?? node, 'sectPr');
    if (!rendered && sect && attr(kid(sect, 'type'), 'val') !== 'continuous') newPage();
  }

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

/** Läuft in Dokumentreihenfolge über den Absatz und meldet Text bzw. Umbruch-Ereignisse. */
function walkRuns(p: El, emit: (ev: string) => void) {
  const walk = (n: Node) => {
    for (let c = n.firstChild; c; c = c.nextSibling) {
      if (c.nodeType !== 1) continue;
      const e = c as El;
      switch (e.localName) {
        case 'del': case 'instrText': case 'delText': case 'pPr': case 'rPr': case 'footnoteReference': continue;
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

/** styleId -> Überschriftenebene, aus styles.xml (Name "heading 1"/"Überschrift 1" oder outlineLvl). */
async function styleHeadingLevels(xml: (p: string) => Promise<globalThis.Document | undefined>): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  const styles = await xml('word/styles.xml');
  if (!styles) return map;
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
  for (const [id, s] of byId) {
    const l = levelOf(s);
    if (l) map.set(id, l);
  }
  return map;
}
