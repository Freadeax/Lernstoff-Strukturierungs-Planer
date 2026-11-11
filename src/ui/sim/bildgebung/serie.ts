// Bildserien für den Betrachter: synthetische Phantome oder frei lizenzierte Bilddateien.
// Echte Bilder nur mit Lizenz, Urheber und Quell-URL (Test prüft das). Keine Daten aus
// zugangsbeschränkten Datensätzen (z. B. MIMIC) und keine Bilder mit unklarer Lizenz.

import { ctSchicht, roentgenThorax, ROH_MAX, type CtVariante, type Fenster, type Modalitaet, type Rohbild, type RoentgenVariante } from './phantom';

export type BildQuelle =
  | { art: 'phantom'; modalitaet: 'ct'; variante: CtVariante; schichten: number; kontrast?: boolean }
  | { art: 'phantom'; modalitaet: 'roentgen'; variante: RoentgenVariante }
  | {
    art: 'bilder'; modalitaet: Modalitaet;
    /** Pfad relativ zur App (public/) oder absolute https-URL. */
    basis: string; dateien: string[];
    lizenz: string; urheber: string; quelleUrl: string;
    /** Was am Original verändert wurde (Lizenzhinweis). Fehlt: „zugeschnitten und verkleinert“. */
    bearbeitung?: string;
  }
  | {
    /** Bilder aus dem privaten Material-Repo (nur mit Zugang auf diesem Gerät, nie im öffentlichen Build). */
    art: 'material'; modalitaet: Modalitaet;
    ordner: string; dateien: string[];
    /** Woher die Bilder stammen (Pflichtangabe, z. B. „eigene Unterrichtsfolie“ oder Datensatz mit Lizenz). */
    herkunft: string; lizenz?: string; quelleUrl?: string;
  };

/** Markierter Befund. Koordinaten normiert 0..1 (x nach rechts, y nach unten), r als Anteil der Bildbreite. */
export interface Befundmarke {
  id: string;
  /** Schichtbereich (inklusive, 0-basiert). Fehlt bei Röntgen. */
  schichten?: [number, number];
  x: number; y: number; r: number;
  titel: string;
  text: string;
}

export interface FensterVorgabe extends Fenster { id: string; name: string }

export interface Bildserie {
  id: string;
  titel: string;
  /** z. B. „CT-Thorax mit Kontrastmittel (CT-Angiographie)“ */
  untersuchung: string;
  quelle: BildQuelle;
  befunde: Befundmarke[];
  /** Kurzbefund der Radiologie, erscheint nach der Auswertung. */
  befundtext: string;
  /** Schichtdicke in mm (CT). */
  schichtdicke?: number;
  /** Pixelabstand in mm bezogen auf die gespeicherte Bildbreite. Fehlt bei echten Bildern ohne bekannten Maßstab. */
  pixelMm?: number;
}

export const FENSTER: Record<Modalitaet, FensterVorgabe[]> = {
  ct: [
    { id: 'lunge', name: 'Lunge', mitte: -600, breite: 1500 },
    { id: 'weichteil', name: 'Weichteil', mitte: 40, breite: 400 },
    { id: 'knochen', name: 'Knochen', mitte: 500, breite: 2000 },
  ],
  roentgen: [
    { id: 'standard', name: 'Standard', mitte: 50, breite: 100 },
    { id: 'kontrast', name: 'Kontrast', mitte: 42, breite: 55 },
    { id: 'hell', name: 'Weichteil', mitte: 62, breite: 70 },
  ],
};

export const modalitaetVon = (s: Bildserie): Modalitaet => s.quelle.modalitaet;

/** Bildfeld der Phantome in mm (Breite), daraus der ungefähre Pixelabstand. */
const PHANTOM_FELD_MM: Record<Modalitaet, number> = { ct: 360, roentgen: 430 };

/** mm je Pixel für Messungen, falls bekannt (Phantome: festes Bildfeld). */
export function mmProPixel(s: Bildserie, bild: { breite: number }): number | undefined {
  if (s.pixelMm) return s.pixelMm;
  return s.quelle.art === 'phantom' ? PHANTOM_FELD_MM[s.quelle.modalitaet] / bild.breite : undefined;
}

export function anzahlSchichten(s: Bildserie): number {
  const q = s.quelle;
  if (q.art === 'phantom') return q.modalitaet === 'ct' ? q.schichten : 1;
  return q.dateien.length;
}

/** Schicht-Index -> Lage im Phantom (0 = Lungenspitze, 1 = Oberbauch). */
export const zVonIndex = (i: number, n: number) => (n <= 1 ? 0.5 : 0.04 + (0.96 - 0.04) * (i / (n - 1)));

const cache = new Map<string, Rohbild>();
const MAX_CACHE = 160;

function merke(key: string, bild: Rohbild): Rohbild {
  cache.set(key, bild);
  if (cache.size > MAX_CACHE) cache.delete(cache.keys().next().value as string);
  return bild;
}

/** Synchron berechnete Phantom-Schicht (für Tests und den Betrachter). */
export function phantomSchicht(s: Bildserie, i: number): Rohbild {
  const q = s.quelle;
  if (q.art !== 'phantom') throw new Error('Keine Phantom-Serie');
  const key = `${s.id}:${i}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const bild = q.modalitaet === 'ct' ? ctSchicht(zVonIndex(i, q.schichten), q.variante, 320, q.kontrast) : roentgenThorax(q.variante);
  return merke(key, bild);
}

type MaterialLader = (pfad: string) => Promise<Blob>;
let materialLader: MaterialLader | null = null;
/** Die App meldet hier, wie Dateien aus dem privaten Material-Repo geholt werden. */
export function setzeMaterialLader(f: MaterialLader | null) { materialLader = f; }

/**
 * Liest ein 16-Bit-Graustufen-PNG (CT-Schichten mit Pixelwert = HU + 1024) verlustfrei.
 * Der Browser würde beim Zeichnen auf ein Canvas auf 8 Bit reduzieren, dann ginge die
 * HU-Fensterung verloren. Gibt null zurück, wenn die Datei kein solches PNG ist.
 */
export async function dekodierePng16(daten: ArrayBuffer): Promise<Rohbild | null> {
  const b = new Uint8Array(daten);
  const SIGNATUR = [137, 80, 78, 71, 13, 10, 26, 10];
  if (b.length < 33 || SIGNATUR.some((v, i) => b[i] !== v)) return null;
  const dv = new DataView(daten);
  const breite = dv.getUint32(16), hoehe = dv.getUint32(20);
  // Bittiefe 16, Farbtyp 0 (Graustufen), ohne Interlace
  if (b[24] !== 16 || b[25] !== 0 || b[28] !== 0) return null;
  const teile: Uint8Array[] = [];
  for (let pos = 8; pos + 8 <= b.length;) {
    const laenge = dv.getUint32(pos);
    const typ = String.fromCharCode(b[pos + 4], b[pos + 5], b[pos + 6], b[pos + 7]);
    if (typ === 'IDAT') teile.push(b.subarray(pos + 8, pos + 8 + laenge));
    if (typ === 'IEND') break;
    pos += 12 + laenge;
  }
  const strom = new Blob(teile as BlobPart[]).stream().pipeThrough(new DecompressionStream('deflate'));
  const roh = new Uint8Array(await new Response(strom).arrayBuffer());
  const zeile = breite * 2;
  if (roh.length < hoehe * (zeile + 1)) throw new Error('PNG unvollständig');
  const bpp = 2;
  const akt = new Uint8Array(zeile), vor = new Uint8Array(zeile);
  const werte = new Uint16Array(breite * hoehe);
  for (let y = 0; y < hoehe; y++) {
    const start = y * (zeile + 1), filter = roh[start];
    for (let i = 0; i < zeile; i++) {
      const x = roh[start + 1 + i];
      const a = i >= bpp ? akt[i - bpp] : 0, o = vor[i], c = i >= bpp ? vor[i - bpp] : 0;
      let v = x;
      if (filter === 1) v = x + a;
      else if (filter === 2) v = x + o;
      else if (filter === 3) v = x + ((a + o) >> 1);
      else if (filter === 4) {
        const p = a + o - c, pa = Math.abs(p - a), pb = Math.abs(p - o), pc = Math.abs(p - c);
        v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? o : c);
      }
      akt[i] = v & 255;
    }
    for (let xx = 0; xx < breite; xx++) werte[y * breite + xx] = Math.min(ROH_MAX, (akt[xx * 2] << 8) | akt[xx * 2 + 1]);
    vor.set(akt);
  }
  return { breite, hoehe, werte };
}

/** Lädt eine Bilddatei und wandelt sie in Grauwerte (0..4095). CT als 16-Bit-PNG bleibt in HU. */
async function ladeDatei(url: string, modalitaet?: Modalitaet): Promise<Rohbild> {
  if (modalitaet === 'ct' && typeof DecompressionStream === 'function') {
    try {
      const antwort = await fetch(url);
      if (antwort.ok) {
        const bild = await dekodierePng16(await antwort.arrayBuffer());
        if (bild) { if (url.startsWith('blob:')) URL.revokeObjectURL(url); return bild; }
      }
    } catch { /* weiter mit dem normalen Bildpfad */ }
  }
  const img = new Image();
  img.decoding = 'async';
  if (!url.startsWith('blob:')) img.crossOrigin = 'anonymous';
  img.src = url;
  try { await img.decode(); } finally { if (url.startsWith('blob:')) setTimeout(() => URL.revokeObjectURL(url), 0); }
  const c = document.createElement('canvas');
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas nicht verfügbar');
  ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  const werte = new Uint16Array(c.width * c.height);
  for (let i = 0, j = 0; i < werte.length; i++, j += 4) werte[i] = Math.round(((d[j] * 0.299 + d[j + 1] * 0.587 + d[j + 2] * 0.114) / 255) * ROH_MAX);
  return { breite: c.width, hoehe: c.height, werte };
}

export async function ladeSchicht(s: Bildserie, i: number): Promise<Rohbild> {
  const q = s.quelle;
  if (q.art === 'phantom') return phantomSchicht(s, i);
  const key = `${s.id}:${i}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const datei = q.dateien[i];
  if (q.art === 'material') {
    if (!materialLader) throw new Error('Material-Repo ist auf diesem Gerät nicht verbunden (Material → Große Dateien).');
    const blob = await materialLader(`${q.ordner.replace(/\/$/, '')}/${datei}`);
    return merke(key, await ladeDatei(URL.createObjectURL(blob), q.modalitaet));
  }
  const url = /^https:\/\//.test(q.basis) ? `${q.basis.replace(/\/$/, '')}/${datei}` : `${import.meta.env.BASE_URL}${q.basis.replace(/^\/|\/$/g, '')}/${datei}`;
  return merke(key, await ladeDatei(url, q.modalitaet));
}

/** Befunde, die auf Schicht i sichtbar sind. */
export const befundeAuf = (s: Bildserie, i: number) => s.befunde.filter((b) => !b.schichten || (i >= b.schichten[0] && i <= b.schichten[1]));

/** Trifft ein Tipp (normiert) einen Befund auf dieser Schicht? Etwas Toleranz für Finger. */
export function trifft(s: Bildserie, i: number, x: number, y: number, toleranz = 0.04): Befundmarke | undefined {
  return befundeAuf(s, i).find((b) => Math.hypot(b.x - x, b.y - y) <= b.r + toleranz);
}
