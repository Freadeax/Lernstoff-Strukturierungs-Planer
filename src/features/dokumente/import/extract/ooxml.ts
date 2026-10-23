// Gemeinsame Helfer für docx/pptx (Office Open XML = ZIP mit XML-Teilen).
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';
import type { FileMeta } from '../types';

export type El = Element;

export async function openZip(bytes: Uint8Array) {
  const zip = await JSZip.loadAsync(bytes);
  const xml = async (path: string): Promise<globalThis.Document | undefined> => {
    const f = zip.file(path);
    if (!f) return undefined;
    return new DOMParser().parseFromString(await f.async('string'), 'text/xml') as unknown as globalThis.Document;
  };
  return { zip, xml };
}

/** Kind-Elemente mit lokalem Namen (ohne Namespace-Präfix). */
export function kids(el: Node, local: string): El[] {
  const out: El[] = [];
  for (let n = el.firstChild; n; n = n.nextSibling) if (n.nodeType === 1 && (n as El).localName === local) out.push(n as El);
  return out;
}

export function kid(el: Node, local: string): El | undefined {
  return kids(el, local)[0];
}

/** Alle Nachfahren mit lokalem Namen, in Dokumentreihenfolge. */
export function desc(el: Node, local: string): El[] {
  const out: El[] = [];
  const walk = (n: Node) => {
    for (let c = n.firstChild; c; c = c.nextSibling) {
      if (c.nodeType !== 1) continue;
      if ((c as El).localName === local) out.push(c as El);
      walk(c);
    }
  };
  walk(el);
  return out;
}

export function attr(el: El | undefined, local: string): string | undefined {
  if (!el) return undefined;
  for (let i = 0; i < el.attributes.length; i++) {
    const a = el.attributes[i];
    if (a.localName === local || a.name === local) return a.value;
  }
  return undefined;
}

/** Titel und Änderungsdatum aus docProps/core.xml. */
export async function coreMeta(xml: (p: string) => Promise<globalThis.Document | undefined>): Promise<FileMeta> {
  const core = await xml('docProps/core.xml');
  if (!core) return {};
  const t = desc(core, 'title')[0]?.textContent?.trim() || undefined;
  const m = desc(core, 'modified')[0]?.textContent?.trim() || undefined;
  return { title: t, modified: m };
}

/** Relationship-Ziele einer .rels-Datei: Id -> Pfad relativ zum ZIP-Wurzelverzeichnis. */
export async function rels(xml: (p: string) => Promise<globalThis.Document | undefined>, relsPath: string, baseDir: string): Promise<Map<string, string>> {
  const doc = await xml(relsPath);
  const map = new Map<string, string>();
  if (!doc) return map;
  for (const r of desc(doc, 'Relationship')) {
    const id = attr(r, 'Id')!;
    const target = attr(r, 'Target')!;
    map.set(id, normalizePath(target.startsWith('/') ? target.slice(1) : baseDir + target));
  }
  return map;
}

function normalizePath(p: string): string {
  const out: string[] = [];
  for (const part of p.split('/')) {
    if (part === '..') out.pop();
    else if (part && part !== '.') out.push(part);
  }
  return out.join('/');
}
