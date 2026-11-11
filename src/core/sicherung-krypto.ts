// Verschlüsselte Sicherung: dieselbe JSON-Sicherung, mit einem Passwort verschlüsselt (WebCrypto, kein Server).
// AES-256-GCM, Schlüssel aus dem Passwort per PBKDF2-SHA-256 mit 600 000 Runden und zufälligem Salz.
// Ohne Passwort lässt sich die Datei nicht öffnen, auch nicht von uns. Das Passwort wird nirgends gespeichert.

export const KRYPTO_FORMAT = 1;
const RUNDEN = 600_000;

export interface VerschluesselteSicherung {
  app: 'lernstoff-planer';
  verschluesselt: {
    v: number; verfahren: 'AES-256-GCM'; kdf: 'PBKDF2-SHA-256'; runden: number;
    salz: string; iv: string; komprimiert: boolean; daten: string;
  };
  exportedAt: string;
}

export class FalschesPasswort extends Error {
  constructor() { super('Das Passwort stimmt nicht, oder die Datei ist beschädigt.'); this.name = 'FalschesPasswort'; }
}

const b64 = (b: Uint8Array) => { let s = ''; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000)); return btoa(s); };
const aus64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

const kannPacken = () => typeof CompressionStream !== 'undefined' && typeof Response !== 'undefined';
async function strom(bytes: Uint8Array, t: CompressionStream | DecompressionStream) {
  return new Uint8Array(await new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(t)).arrayBuffer());
}

/** Obergrenze für den entpackten Inhalt (Schutz vor „GZIP-Bomben“ in fremden Dateien). */
export const ENTPACKT_MAX = 384 * 1024 * 1024;

export class EntpacktZuGross extends Error {
  constructor(max: number) { super(`Die Sicherung wäre entpackt über ${Math.round(max / 1024 / 1024)} MB groß und wird zum Schutz des Geräts nicht geöffnet. Es wurde nichts verändert.`); this.name = 'EntpacktZuGross'; }
}

/** Entpackt GZIP, liest aber höchstens `max` Bytes; darüber wird abgebrochen, ohne den Rest zu puffern. */
async function entpackeBegrenzt(bytes: Uint8Array, max: number): Promise<Uint8Array> {
  const reader = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream('gzip')).getReader();
  const teile: Uint8Array[] = [];
  let n = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    n += value.length;
    if (n > max) { await reader.cancel().catch(() => undefined); throw new EntpacktZuGross(max); }
    teile.push(value);
  }
  const out = new Uint8Array(n);
  let pos = 0;
  for (const t of teile) { out.set(t, pos); pos += t.length; }
  return out;
}

async function schluessel(passwort: string, salz: Uint8Array, runden: number) {
  const basis = await crypto.subtle.importKey('raw', new TextEncoder().encode(passwort.normalize('NFC')), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: salz as BufferSource, iterations: runden }, basis, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

/** Mindestanforderung, damit niemand aus Versehen „1234“ nimmt. */
export function passwortProblem(p: string): string | undefined {
  if (p.length < 10) return 'Bitte mindestens 10 Zeichen verwenden, gern einen ganzen Satz.';
  return undefined;
}

export function istVerschluesselt(text: string): boolean {
  // Schnelltest ohne vollständiges Parsen großer Dateien
  if (!text.slice(0, 200).includes('"verschluesselt"')) return false;
  try { return !!(JSON.parse(text) as Partial<VerschluesselteSicherung>).verschluesselt; } catch { return false; }
}

export async function verschluessele(klartext: string, passwort: string, runden = RUNDEN): Promise<string> {
  const salz = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  let bytes = new TextEncoder().encode(klartext);
  const komprimiert = kannPacken();
  if (komprimiert) bytes = await strom(bytes, new CompressionStream('gzip'));
  const key = await schluessel(passwort, salz, runden);
  const chiffre = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, bytes as BufferSource));
  const out: VerschluesselteSicherung = {
    app: 'lernstoff-planer',
    verschluesselt: { v: KRYPTO_FORMAT, verfahren: 'AES-256-GCM', kdf: 'PBKDF2-SHA-256', runden, salz: b64(salz), iv: b64(iv), komprimiert, daten: b64(chiffre) },
    exportedAt: new Date().toISOString(),
  };
  // Reihenfolge: „verschluesselt“ steht vorn, damit istVerschluesselt es in den ersten Zeichen findet.
  return JSON.stringify({ verschluesselt: out.verschluesselt, app: out.app, exportedAt: out.exportedAt });
}

export async function entschluessele(text: string, passwort: string, max = ENTPACKT_MAX): Promise<string> {
  let s: VerschluesselteSicherung;
  try { s = JSON.parse(text) as VerschluesselteSicherung; } catch { throw new Error('Die Datei ist keine gültige Sicherung (kein JSON).'); }
  const v = s?.verschluesselt;
  if (!v || s.app !== 'lernstoff-planer') throw new Error('Die Datei ist keine verschlüsselte Sicherung des Lernstoff-Planers.');
  if (v.v > KRYPTO_FORMAT) throw new Error('Das Verschlüsselungsformat ist neuer als diese App. Bitte die App aktualisieren.');
  if (v.verfahren !== 'AES-256-GCM' || v.kdf !== 'PBKDF2-SHA-256' || !(v.runden >= 100_000 && v.runden <= 10_000_000)) throw new Error('Unbekanntes Verschlüsselungsverfahren.');
  let bytes: Uint8Array;
  try {
    const key = await schluessel(passwort, aus64(v.salz), v.runden);
    bytes = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: aus64(v.iv) as BufferSource }, key, aus64(v.daten) as BufferSource));
  } catch { throw new FalschesPasswort(); }
  if (v.komprimiert) {
    if (typeof DecompressionStream === 'undefined') throw new Error('Dieser Browser kann die Sicherung nicht entpacken. Bitte Safari ab iOS 16.4 oder einen aktuellen Browser verwenden.');
    try { bytes = await entpackeBegrenzt(bytes, max); }
    catch (e) { if (e instanceof EntpacktZuGross) throw e; throw new Error('Die Sicherung ließ sich nicht entpacken (beschädigt).'); }
  } else if (bytes.length > max) throw new EntpacktZuGross(max);
  return new TextDecoder().decode(bytes);
}
