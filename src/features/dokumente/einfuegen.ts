// Text einfügen statt abtippen: Inhalt aus der Zwischenablage (Webseite, Word, PDF-Betrachter, OneNote)
// wird zu Markdown. Überschriften, Listen und Tabellen bleiben erhalten, damit der Import Kapitel und
// Themen erkennt (wie beim Einfügen in Notion oder Obsidian).

const BLOCK = new Set(['P', 'DIV', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'BLOCKQUOTE', 'PRE', 'FIGURE', 'MAIN', 'ASIDE', 'NAV']);

function inline(el: Node): string {
  if (el.nodeType === 3) return (el.textContent ?? '').replace(/\s+/g, ' ');
  if (el.nodeType !== 1) return '';
  const e = el as Element;
  if (e.tagName === 'BR') return '\n';
  if (/^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|svg)$/i.test(e.tagName)) return '';
  const inner = [...e.childNodes].map(inline).join('');
  if ((e.tagName === 'STRONG' || e.tagName === 'B') && inner.trim()) return `**${inner.trim()}**`;
  if ((e.tagName === 'EM' || e.tagName === 'I') && inner.trim()) return `*${inner.trim()}*`;
  return inner;
}

function bloecke(el: Element, out: string[], tiefe = 0) {
  for (const n of [...el.childNodes]) {
    if (n.nodeType === 3) { const t = (n.textContent ?? '').replace(/\s+/g, ' ').trim(); if (t) out.push(t); continue; }
    if (n.nodeType !== 1) continue;
    const e = n as Element;
    const tag = e.tagName.toUpperCase();
    const h = /^H([1-6])$/.exec(tag);
    if (h) { const t = inline(e).trim(); if (t) out.push(`${'#'.repeat(+h[1]!)} ${t}`); continue; }
    if (tag === 'UL' || tag === 'OL') {
      [...e.children].filter((c) => c.tagName === 'LI').forEach((li, i) => {
        const eigen = [...li.childNodes].filter((c) => !(c.nodeType === 1 && /^(UL|OL)$/.test((c as Element).tagName))).map(inline).join('').trim();
        if (eigen) out.push(`${'  '.repeat(tiefe)}${tag === 'OL' ? `${i + 1}.` : '-'} ${eigen}`);
        [...li.children].filter((c) => /^(UL|OL)$/.test(c.tagName)).forEach((sub) => bloecke({ childNodes: [sub] } as unknown as Element, out, tiefe + 1));
      });
      continue;
    }
    if (tag === 'TABLE') {
      // Tabellen als Tabulator-Zeilen: so lassen sie sich auch direkt als Karteikarten weiterverwenden.
      for (const tr of e.querySelectorAll('tr')) {
        const zellen = [...tr.children].map((c) => inline(c).trim().replace(/\t/g, ' '));
        if (zellen.some(Boolean)) out.push(zellen.join('\t'));
      }
      continue;
    }
    if (tag === 'HR') { out.push('---'); continue; }
    if (BLOCK.has(tag)) {
      const hatBloecke = [...e.children].some((c) => BLOCK.has(c.tagName) || /^(H[1-6]|UL|OL|TABLE)$/.test(c.tagName));
      if (hatBloecke) bloecke(e, out, tiefe);
      else { const t = inline(e).replace(/ *\n */g, '\n').trim(); if (t) out.push(t); }
      continue;
    }
    if (tag === 'BODY' || tag === 'HTML' || tag === 'SPAN' || tag === 'FONT' || tag === 'A') { bloecke(e, out, tiefe); continue; }
    const t = inline(e).trim();
    if (t) out.push(t);
  }
}

/** HTML aus der Zwischenablage → Markdown (Überschriften, Listen, Tabellen). */
export function htmlZuMarkdown(html: string): string {
  if (typeof DOMParser === 'undefined') return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const out: string[] = [];
  bloecke(doc.body, out);
  return aufraeumen(out.join('\n\n'));
}

/** Leerzeilen begrenzen, Listenpunkte zusammenhalten, Leerraum am Rand entfernen. */
export function aufraeumen(md: string): string {
  return md
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^(\s*(?:-|\d+\.) .*)\n\n(?=\s*(?:-|\d+\.) )/gm, '$1\n')
    .trim();
}

/** Titel aus der ersten Überschrift oder ersten Zeile. */
export function titelAus(text: string): string {
  const zeile = text.split('\n').map((z) => z.replace(/^#+\s*/, '').trim()).find(Boolean) ?? '';
  return zeile.length > 80 ? `${zeile.slice(0, 77).trimEnd()}…` : zeile;
}

/** Dateiname ohne verbotene Zeichen; Endung .md, damit der Import Markdown-Überschriften als Kapitel nimmt. */
export function dateiName(titel: string): string {
  const n = titel.replace(/[\\/:*?"<>|#\n\r\t]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80) || 'Eingefügter Text';
  return `${n}.md`;
}
