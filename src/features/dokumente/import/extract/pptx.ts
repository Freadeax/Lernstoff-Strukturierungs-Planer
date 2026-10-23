// PowerPoint (.pptx): jede Folie ist eine Seite. Kapitel = PowerPoint-Abschnitt (falls angelegt) > Folientitel.
// Sprechernotizen werden als eigener Block (origin 'notes') übernommen, weil Lehrkräfte dort oft Erklärungen ablegen.
import type { Block, Extracted, RawPage } from '../types';
import { attr, coreMeta, desc, kid, kids, openZip, rels, type El } from './ooxml';
import { editionHint } from './hints';

export async function extractPptx(bytes: Uint8Array): Promise<Extracted> {
  const { xml } = await openZip(bytes);
  const pres = await xml('ppt/presentation.xml');
  if (!pres) throw new Error('Keine ppt/presentation.xml – beschädigte oder keine PowerPoint-Datei');
  const presRels = await rels(xml, 'ppt/_rels/presentation.xml.rels', 'ppt/');
  const warnings: string[] = [];

  // Abschnitte (p14:section) ordnen Folien-IDs einem Abschnittsnamen zu.
  const sectionOf = new Map<string, string>();
  for (const s of desc(pres, 'section')) for (const id of desc(s, 'sldId')) sectionOf.set(id.getAttribute('id')!, attr(s, 'name')!);

  const sldIds = desc(kid(pres.documentElement, 'sldIdLst') ?? pres.documentElement, 'sldId');
  const pages: RawPage[] = [];
  let pictureOnlySlides = 0;
  for (const [i, sld] of sldIds.entries()) {
    const path = presRels.get(attrNs(sld, 'id') ?? '');
    const slide = path ? await xml(path) : undefined;
    if (!slide) continue;
    const blocks: Block[] = [];
    const section = sectionOf.get(sld.getAttribute('id')!);
    if (section) blocks.push({ text: section, headingLevel: 1 });
    let title: string | undefined;
    const body: string[] = [];
    for (const sp of desc(slide, 'sp')) {
      const ph = desc(kid(sp, 'nvSpPr') ?? sp, 'ph')[0];
      const phType = attr(ph, 'type');
      if (phType === 'sldNum' || phType === 'dt' || phType === 'ftr') continue;
      const paras = desc(kid(sp, 'txBody') ?? sp, 'p').map(paraText).filter(Boolean);
      if (!paras.length) continue;
      if (!title && (phType === 'title' || phType === 'ctrTitle')) title = paras.join(' ');
      else body.push(paras.join('\n'));
    }
    for (const tbl of desc(slide, 'tbl')) {
      body.push(desc(tbl, 'tr').map((tr) => kids(tr, 'tc').map((tc) => desc(tc, 'p').map(paraText).join(' ')).join(' | ')).join('\n'));
    }
    if (title) blocks.push({ text: title, headingLevel: section ? 2 : 1 });
    for (const b of body) blocks.push({ text: b });
    if (!title && !body.length && desc(slide, 'pic').length) pictureOnlySlides++;

    const slideRels = await rels(xml, path!.replace(/slides\/(slide\d+\.xml)$/, 'slides/_rels/$1.rels'), 'ppt/slides/');
    const notesPath = [...slideRels.values()].find((t) => t.includes('notesSlide'));
    const notes = notesPath ? await xml(notesPath) : undefined;
    if (notes) {
      const text = desc(notes, 'sp')
        .filter((sp) => attr(desc(sp, 'ph')[0], 'type') === 'body')
        .flatMap((sp) => desc(sp, 'p').map(paraText))
        .filter(Boolean)
        .join('\n');
      if (text) blocks.push({ text, origin: 'notes' });
    }
    pages.push({ page: i + 1, printedPage: String(i + 1), blocks });
  }
  if (pictureOnlySlides) warnings.push(`${pictureOnlySlides} Folie(n) enthalten nur Bilder; Text darin wird im Prototyp nicht per OCR gelesen.`);
  const meta = await coreMeta(xml);
  meta.editionHint = editionHint(pages.flatMap((p) => p.blocks.map((b) => b.text)).join('\n'), meta.title);
  return { kind: 'pptx', pages, meta, warnings };
}

function paraText(p: El): string {
  let s = '';
  for (let n = p.firstChild; n; n = n.nextSibling) {
    if (n.nodeType !== 1) continue;
    const e = n as El;
    if (e.localName === 'r' || e.localName === 'fld') s += desc(e, 't').map((t) => t.textContent).join('');
    else if (e.localName === 'br') s += '\n';
  }
  return s.trim();
}

/** r:id (Namespace "relationships") von p:sldId; das unpräfixierte "id" ist die numerische Folien-ID. */
function attrNs(el: El, local: string): string | undefined {
  for (let i = 0; i < el.attributes.length; i++) {
    const a = el.attributes[i];
    if (a.localName === local && a.prefix) return a.value;
  }
  return undefined;
}
