/// <reference types="node" />
// Fußnoten, Merkkästen und Enthaltensein. Die Word-Dateien entstehen hier im Test, damit das XML sichtbar bleibt.
import { readFileSync } from 'node:fs';
import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { importFile } from './pipeline';
import { markiereMerkkaesten } from './extract/merkkasten';
import { containment, containmentSample } from './dedupe';
import type { Fingerprint, RawPage } from './types';

const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" xmlns:v="urn:schemas-microsoft-com:vml"';
const p = (inner: string, pPr = '') => `<w:p>${pPr ? `<w:pPr>${pPr}</w:pPr>` : ''}${inner}</w:p>`;
const r = (t: string) => `<w:r><w:t xml:space="preserve">${t}</w:t></w:r>`;
const fn = (id: number) => `<w:r><w:footnoteReference w:id="${id}"/></w:r>`;
const en = (id: number) => `<w:r><w:endnoteReference w:id="${id}"/></w:r>`;
const pageBreak = '<w:r><w:lastRenderedPageBreak/></w:r>';

async function docx(body: string, extra: { footnotes?: string; endnotes?: string; styles?: string } = {}): Promise<Uint8Array> {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>');
  zip.file('word/document.xml', `<?xml version="1.0"?><w:document ${W}><w:body>${body}<w:sectPr/></w:body></w:document>`);
  const notes = (tag: string, list: string) => `<?xml version="1.0"?><w:${tag}s ${W}>`
    + `<w:${tag} w:type="separator" w:id="-1"><w:p><w:r><w:separator/></w:r></w:p></w:${tag}>`
    + `<w:${tag} w:type="continuationSeparator" w:id="0"><w:p><w:r><w:continuationSeparator/></w:r></w:p></w:${tag}>${list}</w:${tag}s>`;
  if (extra.footnotes) zip.file('word/footnotes.xml', notes('footnote', extra.footnotes));
  if (extra.endnotes) zip.file('word/endnotes.xml', notes('endnote', extra.endnotes));
  if (extra.styles) zip.file('word/styles.xml', `<?xml version="1.0"?><w:styles ${W}>${extra.styles}</w:styles>`);
  return zip.generateAsync({ type: 'uint8array' });
}
const note = (tag: string, id: number, text: string) => `<w:${tag} w:id="${id}"><w:p><w:r><w:${tag}Ref/></w:r>${r(' ' + text)}</w:p></w:${tag}>`;

describe('Word-Fußnoten', () => {
  it('setzt [n] in den Text und hängt die Fußnoten als eigenen Chunk an die Seite des Verweises', async () => {
    const bytes = await docx(
      p(r('Die Braden-Skala gilt ab 18 Punkten als Risiko') + fn(2) + r('.'))
      + p(pageBreak + r('Die Norton-Skala ist älter') + fn(5) + r(' und kürzer') + fn(2) + r('.')),
      { footnotes: note('footnote', 2, 'Expertenstandard Dekubitusprophylaxe, 2. Aktualisierung.') + note('footnote', 5, 'Norton 1962.') },
    );
    const res = await importFile({ name: 'fussnoten.docx', bytes });
    expect(res.chunks.map((c) => [c.page, c.origin, c.text])).toEqual([
      [1, undefined, 'Die Braden-Skala gilt ab 18 Punkten als Risiko[1].'],
      [1, 'footnote', '[1] Expertenstandard Dekubitusprophylaxe, 2. Aktualisierung.'],
      [2, undefined, 'Die Norton-Skala ist älter[2] und kürzer[1].'],
      [2, 'footnote', '[2] Norton 1962.'],
    ]);
  });

  it('sammelt Endnoten am Dokumentende und überspringt Trenner', async () => {
    const bytes = await docx(p(r('Satz mit Endnote') + en(3) + r('.')), { endnotes: note('endnote', 3, 'Quelle A.') });
    const res = await importFile({ name: 'endnoten.docx', bytes });
    expect(res.chunks.map((c) => [c.origin, c.text])).toEqual([[undefined, 'Satz mit Endnote[i].'], ['footnote', '[i] Quelle A.']]);
  });
});

describe('Merkkästen', () => {
  it('liest Textfelder getrennt und nur einmal (Choice, nicht Fallback)', async () => {
    const box = (t: string) => `<w:txbxContent>${p(r(t))}</w:txbxContent>`;
    const bytes = await docx(p(r('Fließtext zur Mobilisation.')
      + `<w:r><mc:AlternateContent><mc:Choice Requires="wps"><w:drawing><wps:txbx>${box('Merke: Vor dem Aufstehen Blutdruck messen.')}</wps:txbx></w:drawing></mc:Choice>`
      + `<mc:Fallback><w:pict><v:textbox>${box('Merke: Vor dem Aufstehen Blutdruck messen.')}</v:textbox></w:pict></mc:Fallback></mc:AlternateContent></w:r>`));
    const res = await importFile({ name: 'textfeld.docx', bytes });
    expect(res.chunks.map((c) => [c.origin, c.text])).toEqual([
      [undefined, 'Fließtext zur Mobilisation.'],
      ['box', 'Merke: Vor dem Aufstehen Blutdruck messen.'],
    ]);
  });

  it('erkennt umrahmte, schattierte und als Merkkasten formatierte Absätze', async () => {
    const bytes = await docx(
      p(r('Normaler Absatz.'))
      + p(r('Umrahmt.'), '<w:pBdr><w:top w:val="single"/></w:pBdr>')
      + p(r('Weiß hinterlegt bleibt Fließtext.'), '<w:shd w:val="clear" w:fill="FFFFFF"/>')
      + p(r('Grau hinterlegt.'), '<w:shd w:val="clear" w:fill="D9D9D9"/>')
      + p(r('Mit Formatvorlage.'), '<w:pStyle w:val="Merkkasten"/>'),
      { styles: '<w:style w:type="paragraph" w:styleId="Merkkasten"><w:name w:val="Merkkasten"/></w:style>' },
    );
    const res = await importFile({ name: 'rahmen.docx', bytes });
    expect(res.chunks.map((c) => [c.origin, c.text])).toEqual([
      [undefined, 'Normaler Absatz.'],
      ['box', 'Umrahmt.'],
      [undefined, 'Weiß hinterlegt bleibt Fließtext.'],
      ['box', 'Grau hinterlegt.\n\nMit Formatvorlage.'],
    ]);
  });

  it('erkennt Signalwörter im Text, auch als einzelne Überschrift vor dem Absatz', () => {
    const pages: RawPage[] = [{ page: 1, blocks: [
      { text: 'Pneumonieprophylaxe', headingLevel: 1 },
      { text: 'Atemübungen fördern die Belüftung.' },
      { text: 'Merke', headingLevel: 2 },
      { text: 'Atemfrequenz in Ruhe 12 bis 18 pro Minute.', illegibleSpans: [{ start: 0, end: 4 }] },
      { text: 'Wichtig! Nie bei Atemnot flach lagern.' },
      { text: 'Merke: als Tabelle', origin: 'table' },
      { text: 'Bemerkenswert ist das kein Kasten.' },
    ] }];
    expect(markiereMerkkaesten(pages)).toBe(2);
    expect(pages[0].blocks.map((b) => [b.origin, b.text])).toEqual([
      [undefined, 'Pneumonieprophylaxe'],
      [undefined, 'Atemübungen fördern die Belüftung.'],
      ['box', 'Merke: Atemfrequenz in Ruhe 12 bis 18 pro Minute.'],
      ['box', 'Wichtig! Nie bei Atemnot flach lagern.'],
      ['table', 'Merke: als Tabelle'],
      [undefined, 'Bemerkenswert ist das kein Kasten.'],
    ]);
    const b = pages[0].blocks[2];
    expect(b.text.slice(b.illegibleSpans![0].start, b.illegibleSpans![0].end)).toBe('Atem');
  });
});

describe('Enthaltensein', () => {
  const satz = (i: number) => `Absatz ${i}: Die Pflegefachperson beobachtet Haut, Atmung und Bewusstsein und dokumentiert Veränderung Nummer ${i} sorgfältig im Bericht.`;
  const buch = Array.from({ length: 60 }, (_, i) => satz(i)).join('\n\n');
  const seite = [satz(10), satz(11), satz(12)].join('\n\n');

  it('schätzt den Anteil eines Ausschnitts im ganzen Text, auch mit einzelnen OCR-Fehlern', () => {
    const ocr = seite.replace(/Bewusstsein/g, 'Bewusstsem');
    expect(containment(containmentSample(seite), containmentSample(buch))).toBe(1);
    expect(containment(containmentSample(ocr), containmentSample(buch))).toBeGreaterThan(0.6);
    expect(containment(containmentSample('Ganz anderer Text über Ernährung und Flüssigkeitsbilanz bei Exsikkose im Alter, mit Trinkprotokoll, Hautturgor und Laborwerten wie Natrium und Hämatokrit.'), containmentSample(buch))).toBeLessThan(0.2);
  });

  it('meldet einen Scan als Teil eines vorhandenen Dokuments und umgekehrt', async () => {
    const enc = (t: string) => new TextEncoder().encode(t);
    const ganz = await importFile({ name: 'Lehrbuch.txt', bytes: enc(buch) });
    const existing: Array<Fingerprint & { kind?: string }> = [{ ...ganz.fingerprint, kind: 'text' }];
    const teil = await importFile({ name: 'Foto Seite 12.txt', bytes: enc(seite) }, { existing });
    expect(teil.report.matches[0]).toMatchObject({ kind: 'teil-von', otherDocumentId: ganz.document.id });
    expect(teil.report.matches[0].recommendation).toMatch(/Lehrbuch/);

    const rueck = await importFile({ name: 'Lehrbuch komplett.txt', bytes: enc(buch + '\n\nNachwort.') }, { existing: [{ ...teil.fingerprint, kind: 'text' }] });
    expect(rueck.report.matches[0].kind).toBe('enthaelt');
  });

  it('ohne Stichprobe (alte Fingerabdrücke) bleibt alles wie bisher', async () => {
    const pdf = new Uint8Array(readFileSync(new URL('./__fixtures__/skript_v1.pdf', import.meta.url)));
    const a = await importFile({ name: 'skript_v1.pdf', bytes: pdf });
    const { sample: _ignored, ...alt } = a.fingerprint;
    const b = await importFile({ name: 'auszug.txt', bytes: new TextEncoder().encode('Kurzer Text ohne Bezug.') }, { existing: [{ ...alt, kind: 'pdf' }] });
    expect(b.report.matches).toEqual([]);
  });
});

describe('Text aus Bildern', () => {
  it('verwirft unsichere Ergebnisse, Zeichensalat und schon vorhandenen Text', async () => {
    const { filtereBildtext } = await import('./ocr/bildtext');
    const blocks = [{ text: 'Fersen frei lagern' }, { text: '| ~ ii' }, { text: 'Die Haut wird beurteilt.' }];
    expect(filtereBildtext(blocks, 0.5, '')).toEqual([]);
    expect(filtereBildtext(blocks, 0.9, 'Nach jeder Positionierung wird die Haut beurteilt.').map((b) => [b.text, b.origin, b.ocrConfidence]))
      .toEqual([['Fersen frei lagern', 'ocr', 0.9]]);
  });

  it('ohne Texterkennung bleibt nur ein Hinweis, Bilder werden nicht gespeichert', async () => {
    const bytes = new Uint8Array(readFileSync(new URL('./__fixtures__/folie_mit_bild.pptx', import.meta.url)));
    const r = await importFile({ name: 'folie_mit_bild.pptx', bytes });
    expect(r.chunks.some((c) => c.origin === 'ocr')).toBe(false);
    expect(r.report.warnings.join()).toMatch(/Bildern/);
  });
});
