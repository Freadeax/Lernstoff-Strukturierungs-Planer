// Dubletten- und Versionserkennung.
// Stufe 1: fileHash (Bytes identisch). Stufe 2: contentHash (normalisierter Text identisch).
// Stufe 3: MinHash über Wort-5-Gramme schätzt die Jaccard-Ähnlichkeit, auch zwischen Formaten (docx vs. pdf).
// Stufe 4: Absatz-Hashes zeigen, was hinzugekommen oder weggefallen ist.
// Enthaltensein: Eine Stichprobe der Wort-3-Gramme (Hash mod 2 = 0) schätzt, welcher Anteil des neuen Textes im
// bestehenden vorkommt, unabhängig vom Größenverhältnis. So fällt auf, dass ein Handyfoto einer Buchseite Teil eines
// schon importierten Buchs ist (MinHash-Jaccard wäre dafür viel zu klein). 3-Gramme statt 5-Gramme, weil einzelne
// OCR-Fehler sonst zu viele Treffer zerstören.
// Nichts wird automatisch gelöscht: das Ergebnis ist ein Vorschlag, den der Nutzer bestätigt.
import type { DuplicateMatch, FileMeta, Fingerprint, ImportChunk } from './types';
import { editionRank } from './extract/hints';

const NUM_HASHES = 128;
const SHINGLE = 5;
const SAMPLE_SHINGLE = 3;
const SAMPLE_MOD = 2;
/** Mindestanteil des kleineren Textes, der im größeren vorkommen muss. */
export const CONTAINMENT_MIN = 0.6;
/** Unter so vielen Stichproben-Hashes ist die Schätzung zu unsicher (ca. 25 Wörter). */
const SAMPLE_MIN = 12;

export function normalize(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/­/g, '')                    // weiche Trennstriche
    .replace(/([a-zäöüß])-\s*\n\s*([a-zäöüß])/g, '$1$2')
    .toLowerCase()
    .replace(/[„“”"‚‘’'«»]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function sha256(data: Uint8Array | string): Promise<string> {
  const buf = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const h = await crypto.subtle.digest('SHA-256', buf as BufferSource);
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// FNV-1a 32 bit, schnell und deterministisch; für MinHash genügt das.
function fnv(s: string, seed: number): number {
  let h = (0x811c9dc5 ^ seed) >>> 0;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193) >>> 0;
  return h;
}

export function minhash(text: string): number[] {
  const words = normalize(text).replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean);
  const sig = new Array<number>(NUM_HASHES).fill(0xffffffff);
  const n = Math.max(1, words.length - SHINGLE + 1);
  for (let i = 0; i < n; i++) {
    const sh = words.slice(i, i + SHINGLE).join(' ');
    const base = fnv(sh, 0);
    for (let k = 0; k < NUM_HASHES; k++) {
      // h_k(x) = (a_k * base + b_k) mod 2^32, a_k/b_k aus dem Index abgeleitet
      const v = (Math.imul(base, (2 * k + 1) * 0x9e3779b1) + fnv(String(k), base)) >>> 0;
      if (v < sig[k]) sig[k] = v;
    }
  }
  return sig;
}

/** Sortierte, eindeutige Stichprobe der Wort-3-Gramm-Hashes (siehe Kopf). */
export function containmentSample(text: string): number[] {
  const words = normalize(text).replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean);
  const set = new Set<number>();
  for (let i = 0; i + SAMPLE_SHINGLE <= words.length; i++) {
    const h = fnv(words.slice(i, i + SAMPLE_SHINGLE).join(' '), 7);
    if (h % SAMPLE_MOD === 0) set.add(h);
  }
  return [...set].sort((a, b) => a - b);
}

/** Anteil von a, der in b vorkommt (beide sortiert). */
export function containment(a: number[], b: number[]): number {
  if (!a.length) return 0;
  let i = 0, j = 0, hit = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { hit++; i++; j++; } else if (a[i] < b[j]) i++; else j++;
  }
  return hit / a.length;
}

/** Text eines Dokuments für den Fingerabdruck: ohne Sprechernotizen. */
export function fingerprintText(chunks: Array<Pick<ImportChunk, 'origin' | 'text'>>): string {
  return chunks.filter((c) => c.origin !== 'notes').map((c) => c.text).join('\n\n');
}

export function similarity(a: number[], b: number[]): number {
  let eq = 0;
  for (let i = 0; i < a.length; i++) if (a[i] === b[i]) eq++;
  return eq / a.length;
}

/** Fingerabdruck plus Zuordnung Absatz-Hash -> Originaltext (für die Anzeige von Änderungen). */
export async function fingerprint(documentId: string, title: string, bytes: Uint8Array, chunks: ImportChunk[], meta: FileMeta): Promise<{ fingerprint: Fingerprint; paragraphTexts: Map<string, string> }> {
  const full = fingerprintText(chunks);
  const paragraphs = full.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => normalize(p).length > 20);
  const paragraphTexts = new Map<string, string>();
  const paragraphHashes: string[] = [];
  for (const p of paragraphs) {
    const h = (await sha256(normalize(p))).slice(0, 16);
    paragraphHashes.push(h);
    paragraphTexts.set(h, p);
  }
  return {
    fingerprint: {
      documentId,
      title,
      fileHash: await sha256(bytes),
      contentHash: await sha256(normalize(full)),
      minhash: minhash(full),
      paragraphHashes,
      sample: containmentSample(full),
      meta,
      importedAt: new Date().toISOString(),
    },
    paragraphTexts,
  };
}

export function findMatches(
  fp: Fingerprint,
  kind: string,
  existing: Array<Fingerprint & { kind?: string }>,
  paragraphTexts: Map<string, string>,
  existingParagraphText: (hash: string) => string | undefined = () => undefined,
): DuplicateMatch[] {
  const out: DuplicateMatch[] = [];
  for (const other of existing) {
    if (other.documentId === fp.documentId) continue;
    const sim = similarity(fp.minhash, other.minhash);
    const base = { otherDocumentId: other.documentId, otherTitle: other.title, similarity: round2(sim), added: [] as string[], removed: [] as string[] };
    if (other.fileHash === fp.fileHash) {
      out.push({ ...base, kind: 'gleiche-datei', similarity: 1, recommendation: 'Datei ist bereits importiert. Nicht erneut anlegen, nur ggf. Fach/Thema ergänzen.' });
      continue;
    }
    const crossFormat = !!other.kind && other.kind !== kind;
    if (other.contentHash === fp.contentHash || sim >= (crossFormat ? 0.9 : 0.97)) {
      out.push({
        ...base,
        kind: crossFormat ? 'anderes-format' : 'gleicher-inhalt',
        recommendation: crossFormat
          ? 'Gleicher Inhalt in anderem Format. Für Quellenangaben die PDF-Fassung behalten (feste Seitenzahlen), die andere als Duplikat verknüpfen.'
          : 'Inhalt ist identisch mit einem vorhandenen Dokument. Als Duplikat verknüpfen statt doppelt zu lernen.',
      });
      continue;
    }
    const part = partOf(fp, other, sim);
    if (part) { out.push({ ...base, ...part }); continue; }
    if (sim < 0.3) continue;
    const mine = new Set(fp.paragraphHashes);
    const theirs = new Set(other.paragraphHashes);
    const added = fp.paragraphHashes.filter((h) => !theirs.has(h)).map((h) => paragraphTexts.get(h) ?? h);
    const removed = other.paragraphHashes.filter((h) => !mine.has(h)).map((h) => existingParagraphText(h) ?? `(Absatz ${h})`);
    const newer = whichIsNewer(fp.meta, other.meta);
    const isVersion = sim >= 0.6 || titleSimilar(fp.title, other.title);
    out.push({
      ...base,
      kind: isVersion ? 'neue-version' : 'teilweise-ueberlappend',
      newerIs: newer,
      added: added.slice(0, 20).map(short),
      removed: removed.slice(0, 20).map(short),
      recommendation: isVersion
        ? `${newer === 'bestehend' ? 'Das vorhandene Dokument scheint neuer zu sein; dieses ggf. als veraltet markieren.' : newer === 'neu' ? 'Dieses Dokument scheint die neuere Fassung zu sein: vorhandenes als veraltet markieren, Zusammenfassungen daraus zur Prüfung vorlegen.' : 'Reihenfolge der Fassungen unklar – bitte bestätigen, welche aktuell ist.'} ${added.length} Absätze neu, ${removed.length} entfallen.`
        : 'Inhalte überschneiden sich teilweise; beim Zusammenfassen im Vergleichsmodus zusammenführen.',
    });
  }
  return out.sort((a, b) => b.similarity - a.similarity);
}

/** Enthaltensein in eine Richtung, wenn ein Text deutlich kleiner ist und fast vollständig im anderen steckt. */
function partOf(fp: Fingerprint, other: Fingerprint, sim: number): Pick<DuplicateMatch, 'kind' | 'recommendation' | 'similarity'> | undefined {
  const a = fp.sample, b = other.sample;
  if (!a || !b || sim >= 0.6) return undefined;
  if (a.length >= SAMPLE_MIN && b.length >= a.length * 1.5) {
    const c = containment(a, b);
    if (c >= CONTAINMENT_MIN) return {
      kind: 'teil-von', similarity: round2(c),
      recommendation: `Etwa ${Math.round(c * 100)} % dieses Textes stehen schon in „${other.title}“. Wahrscheinlich ein Ausschnitt (z. B. Foto oder Scan einzelner Seiten): für Quellenangaben das vollständige Dokument nutzen, diesen Import nur behalten, wenn er eigene Notizen enthält.`,
    };
  }
  if (b.length >= SAMPLE_MIN && a.length >= b.length * 1.5) {
    const c = containment(b, a);
    if (c >= CONTAINMENT_MIN) return {
      kind: 'enthaelt', similarity: round2(c),
      recommendation: `„${other.title}“ ist zu etwa ${Math.round(c * 100)} % in diesem Dokument enthalten. Das vorhandene ist wohl ein Ausschnitt; Zusammenfassungen künftig aus diesem vollständigen Dokument erstellen.`,
    };
  }
  return undefined;
}

function whichIsNewer(a: FileMeta, b: FileMeta): 'neu' | 'bestehend' | 'unklar' {
  const ra = editionRank(a.editionHint), rb = editionRank(b.editionHint);
  if (ra !== undefined && rb !== undefined && ra !== rb) return ra > rb ? 'neu' : 'bestehend';
  if (a.modified && b.modified && a.modified !== b.modified) return a.modified > b.modified ? 'neu' : 'bestehend';
  return 'unklar';
}

function titleSimilar(a: string, b: string): boolean {
  const strip = (s: string) => normalize(s).replace(/\.(pdf|docx|pptx)$/, '').replace(/[_\-.]?(v|version|kopie|final|neu|alt)?\s*\d*$/g, '').replace(/[^a-z0-9äöüß]/g, '');
  return strip(a) === strip(b) && strip(a).length > 2;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const short = (s: string) => (s.length > 160 ? s.slice(0, 157) + '…' : s);
