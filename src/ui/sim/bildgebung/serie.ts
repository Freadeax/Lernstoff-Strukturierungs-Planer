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

/** Lädt eine Bilddatei und wandelt sie in Grauwerte (0..4095). */
async function ladeDatei(url: string): Promise<Rohbild> {
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
    return merke(key, await ladeDatei(URL.createObjectURL(blob)));
  }
  const url = /^https:\/\//.test(q.basis) ? `${q.basis.replace(/\/$/, '')}/${datei}` : `${import.meta.env.BASE_URL}${q.basis.replace(/^\/|\/$/g, '')}/${datei}`;
  return merke(key, await ladeDatei(url));
}

/** Befunde, die auf Schicht i sichtbar sind. */
export const befundeAuf = (s: Bildserie, i: number) => s.befunde.filter((b) => !b.schichten || (i >= b.schichten[0] && i <= b.schichten[1]));

/** Trifft ein Tipp (normiert) einen Befund auf dieser Schicht? Etwas Toleranz für Finger. */
export function trifft(s: Bildserie, i: number, x: number, y: number, toleranz = 0.04): Befundmarke | undefined {
  return befundeAuf(s, i).find((b) => Math.hypot(b.x - x, b.y - y) <= b.r + toleranz);
}
