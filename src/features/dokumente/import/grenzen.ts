// Durchgängige Grenzen für fremde Dateien: ZIP-Sammlungen, Office-Dateien (selbst ZIP mit XML),
// Bilder, Textdateien, PDF-Seiten. Alles wird geprüft, BEVOR der Inhalt entpackt oder gerendert wird,
// damit eine präparierte oder einfach riesige Datei Handy und iPad nicht zum Absturz bringt.
// Dazu der Abbruch: ein AbortSignal stoppt Einlesen und Texterkennung zwischen zwei Schritten.
import type JSZip from 'jszip';
import type { OcrEngine } from './ocr/engine';

const MB = 1024 * 1024;

export const GRENZEN = {
  /** Eine einzelne Datei (auch ein ZIP) beim Einlesen. */
  dateiBytes: 512 * MB,
  /** Einträge in einem ZIP-Sammelimport. */
  zipDokumente: 500,
  /** Einträge in irgendeinem ZIP (Office-Dateien haben Dutzende, präparierte Dateien Millionen). */
  zipEintraege: 10_000,
  /** Entpackte Größe eines einzelnen Eintrags. */
  eintragBytes: 128 * MB,
  /** Entpackte Größe aller Einträge zusammen. */
  entpacktBytes: 512 * MB,
  /** Höchstes Verhältnis entpackt : gepackt je Eintrag ab 1 MB („ZIP-Bombe“). Normale XML-Teile liegen unter 30. */
  kompression: 200,
  /** Ein einzelner XML-Teil einer Office-Datei. */
  xmlBytes: 64 * MB,
  /** Verschachtelungstiefe der XML-Elemente. Word kommt selten über 40. */
  xmlTiefe: 256,
  /** PDF-Seiten je Dokument. */
  pdfSeiten: 3000,
  /** Bildpunkte eines Fotos oder Bildes (Breite × Höhe), vor der Texterkennung. */
  bildPixel: 60_000_000,
  /** Textdateien (.txt/.md). */
  textBytes: 32 * MB,
  /** Länge eines Klassen- oder Abgabecodes (Zeichen) und seine entpackte Größe. */
  codeZeichen: 3 * MB,
  codeEntpacktBytes: 8 * MB,
} as const;

export class GrenzFehler extends Error {
  constructor(message: string) { super(message); this.name = 'GrenzFehler'; }
}

export class ImportAbgebrochen extends Error {
  constructor() { super('Import abgebrochen.'); this.name = 'ImportAbgebrochen'; }
}

export function pruefeAbbruch(signal?: AbortSignal) {
  if (signal?.aborted) throw new ImportAbgebrochen();
}

/** Versprechen, das beim Abbruch mit ImportAbgebrochen scheitert (für Promise.race). */
function abbruchVersprechen(signal: AbortSignal): Promise<never> {
  return new Promise((_, reject) => {
    if (signal.aborted) reject(new ImportAbgebrochen());
    else signal.addEventListener('abort', () => reject(new ImportAbgebrochen()), { once: true });
  });
}

/** Wartet auf p, bricht aber sofort ab, wenn das Signal kommt (die Arbeit selbst endet erst mit terminate()). */
export function mitAbbruch<T>(p: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return p;
  return Promise.race([p, abbruchVersprechen(signal)]);
}

/** OCR-Engine, die vor jeder Seite auf Abbruch prüft und eine laufende Erkennung nicht abwartet. */
export function abbrechbar(engine: OcrEngine | undefined, signal?: AbortSignal): OcrEngine | undefined {
  if (!engine || !signal) return engine;
  return {
    name: engine.name,
    recognize: (image, mediaType) => { pruefeAbbruch(signal); return mitAbbruch(engine.recognize(image, mediaType), signal); },
  };
}

// ---------------------------------------------------------------- ZIP

interface ZipMeta { uncompressedSize?: number; compressedSize?: number }
const meta = (e: JSZip.JSZipObject): ZipMeta => (e as unknown as { _data?: ZipMeta })._data ?? {};

/** Entpackte Größe laut ZIP-Verzeichnis (vor dem Entpacken), undefined wenn unbekannt. */
export function entpackteGroesse(e: JSZip.JSZipObject): number | undefined {
  const n = meta(e).uncompressedSize;
  return typeof n === 'number' && n >= 0 ? n : undefined;
}

/**
 * Prüft ein geöffnetes ZIP anhand seines Inhaltsverzeichnisses: Zahl der Einträge, Größe je Eintrag und gesamt,
 * Kompressionsrate. Entpackt dabei nichts. `was` steht in der Fehlermeldung („Das ZIP“, „Die Word-Datei“).
 */
export function pruefeZip(zip: JSZip, was = 'Das ZIP'): void {
  const eintraege = Object.values(zip.files).filter((e) => !e.dir);
  if (eintraege.length > GRENZEN.zipEintraege) throw new GrenzFehler(`${was} enthält über ${GRENZEN.zipEintraege.toLocaleString('de-DE')} Einträge und wird nicht geöffnet.`);
  let gesamt = 0;
  for (const e of eintraege) {
    const groesse = entpackteGroesse(e);
    if (groesse === undefined) throw new GrenzFehler(`${was} ist beschädigt (Größe eines Eintrags unbekannt).`);
    if (groesse > GRENZEN.eintragBytes) throw new GrenzFehler(`${was} enthält einen Teil, der entpackt über ${GRENZEN.eintragBytes / MB} MB groß wäre.`);
    gesamt += groesse;
    if (gesamt > GRENZEN.entpacktBytes) throw new GrenzFehler(`${was} wäre entpackt über ${GRENZEN.entpacktBytes / MB} MB groß. Bitte kleinere Sammlungen verwenden.`);
    const gepackt = meta(e).compressedSize ?? 0;
    if (groesse >= MB && gepackt > 0 && groesse / gepackt > GRENZEN.kompression) throw new GrenzFehler(`${was} ist ungewöhnlich stark gepackt und wird zum Schutz des Geräts nicht entpackt.`);
  }
}

// ---------------------------------------------------------------- XML

/**
 * Prüft einen XML-Teil vor dem Parsen: Größe, keine DOCTYPE-/ENTITY-Deklarationen (Office braucht sie nie,
 * sie sind der Weg für Entitäten-Bomben) und begrenzte Verschachtelungstiefe. Läuft linear über den Text.
 */
export function pruefeXml(text: string, teil = 'XML-Teil'): void {
  if (text.length > GRENZEN.xmlBytes) throw new GrenzFehler(`${teil} ist zu groß.`);
  if (/<!DOCTYPE|<!ENTITY/i.test(text)) throw new GrenzFehler(`${teil} enthält eine DOCTYPE- oder ENTITY-Deklaration und wird nicht gelesen.`);
  let tiefe = 0, max = 0;
  const re = /<(\/?)[A-Za-z_][^>]*?(\/?)>/g;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (m[1]) tiefe--;
    else if (!m[2]) { tiefe++; if (tiefe > max) max = tiefe; if (max > GRENZEN.xmlTiefe) throw new GrenzFehler(`${teil} ist zu tief verschachtelt.`); }
  }
}

// ---------------------------------------------------------------- Bilder

const u16be = (b: Uint8Array, i: number) => (b[i]! << 8) | b[i + 1]!;
const u16le = (b: Uint8Array, i: number) => b[i]! | (b[i + 1]! << 8);
const u24le = (b: Uint8Array, i: number) => b[i]! | (b[i + 1]! << 8) | (b[i + 2]! << 16);
const u32be = (b: Uint8Array, i: number) => ((b[i]! << 24) >>> 0) + (b[i + 1]! << 16) + (b[i + 2]! << 8) + b[i + 3]!;

/** Breite und Höhe aus dem Dateikopf (PNG, JPEG, WebP), ohne das Bild zu dekodieren. */
export function bildMasse(b: Uint8Array): { breite: number; hoehe: number } | undefined {
  if (b.length >= 24 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { breite: u32be(b, 16), hoehe: u32be(b, 20) };
  if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const marker = b[i + 1]!;
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
      const len = u16be(b, i + 2);
      // SOF0…SOF15 ohne DHT (C4), JPG (C8), DAC (CC)
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) return { hoehe: u16be(b, i + 5), breite: u16be(b, i + 7) };
      if (len < 2) return undefined;
      i += 2 + len;
    }
    return undefined;
  }
  if (b.length >= 30 && String.fromCharCode(...b.subarray(0, 4)) === 'RIFF' && String.fromCharCode(...b.subarray(8, 12)) === 'WEBP') {
    const art = String.fromCharCode(...b.subarray(12, 16));
    if (art === 'VP8X') return { breite: u24le(b, 24) + 1, hoehe: u24le(b, 27) + 1 };
    if (art === 'VP8 ') return { breite: u16le(b, 26) & 0x3fff, hoehe: u16le(b, 28) & 0x3fff };
    if (art === 'VP8L') {
      const bits = b[21]! | (b[22]! << 8) | (b[23]! << 16) | (b[24]! << 24);
      return { breite: (bits & 0x3fff) + 1, hoehe: ((bits >> 14) & 0x3fff) + 1 };
    }
  }
  return undefined;
}

export function pruefeBild(b: Uint8Array): void {
  const m = bildMasse(b);
  if (!m) throw new GrenzFehler('Die Bildgröße ließ sich nicht lesen. Das Bild ist beschädigt oder kein echtes PNG/JPEG/WebP.');
  if (!m.breite || !m.hoehe) throw new GrenzFehler('Das Bild hat keine gültige Größe.');
  if (m.breite * m.hoehe > GRENZEN.bildPixel) throw new GrenzFehler(`Das Bild ist mit ${m.breite} × ${m.hoehe} Bildpunkten zu groß für die Texterkennung. Bitte verkleinern oder zuschneiden.`);
}

// ---------------------------------------------------------------- Text

/** Textdateien müssen wirklich Text sein: keine Nullbytes (Binärdatei mit .txt-Endung), begrenzte Größe. */
export function pruefeText(b: Uint8Array): void {
  if (b.length > GRENZEN.textBytes) throw new GrenzFehler(`Die Textdatei ist über ${GRENZEN.textBytes / MB} MB groß.`);
  const probe = b.subarray(0, Math.min(b.length, 64 * 1024));
  if (probe.includes(0)) throw new GrenzFehler('Die Datei hat die Endung .txt/.md, enthält aber keinen Text (Binärdaten).');
}

// ---------------------------------------------------------------- Ströme mit Obergrenze

/** Liest einen Bytestrom bis höchstens `max` Bytes; darüber wird abgebrochen (entpackte Codes, Antworten). */
export async function leseBegrenzt(strom: ReadableStream<Uint8Array>, max: number, meldung: string): Promise<Uint8Array> {
  const reader = strom.getReader();
  const teile: Uint8Array[] = [];
  let n = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    n += value.length;
    if (n > max) { await reader.cancel().catch(() => undefined); throw new GrenzFehler(meldung); }
    teile.push(value);
  }
  const out = new Uint8Array(n);
  let pos = 0;
  for (const t of teile) { out.set(t, pos); pos += t.length; }
  return out;
}
