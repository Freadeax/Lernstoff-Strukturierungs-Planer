import { readFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { dekodierePng16 } from './serie';

function crc32(b: Uint8Array) {
  let c = ~0;
  for (const x of b) { c ^= x; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)); }
  return ~c >>> 0;
}
function chunk(typ: string, daten: Uint8Array) {
  const out = new Uint8Array(12 + daten.length); const dv = new DataView(out.buffer);
  dv.setUint32(0, daten.length); out.set([...typ].map((c) => c.charCodeAt(0)), 4); out.set(daten, 8);
  dv.setUint32(8 + daten.length, crc32(out.subarray(4, 8 + daten.length)));
  return out;
}
/** Kleines 16-Bit-Graustufen-PNG mit wechselnden Zeilenfiltern. */
function png16(breite: number, hoehe: number, wert: (x: number, y: number) => number) {
  const roh = new Uint8Array(hoehe * (breite * 2 + 1));
  for (let y = 0; y < hoehe; y++) {
    const s = y * (breite * 2 + 1), filter = y % 2 ? 1 : 0; roh[s] = filter;
    const zeile = new Uint8Array(breite * 2);
    for (let x = 0; x < breite; x++) { const v = wert(x, y); zeile[x * 2] = v >> 8; zeile[x * 2 + 1] = v & 255; }
    for (let i = 0; i < zeile.length; i++) roh[s + 1 + i] = filter === 1 ? (zeile[i] - (i >= 2 ? zeile[i - 2] : 0)) & 255 : zeile[i];
  }
  const ihdr = new Uint8Array(13); const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, breite); dv.setUint32(4, hoehe); ihdr.set([16, 0, 0, 0, 0], 8);
  const teile = [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(roh)), chunk('IEND', new Uint8Array())];
  const out = new Uint8Array(teile.reduce((n, t) => n + t.length, 0)); let p = 0;
  for (const t of teile) { out.set(t, p); p += t.length; }
  return out.buffer;
}

describe('16-Bit-PNG (CT in HU)', () => {
  it('liest Werte verlustfrei, auch mit Zeilenfiltern', async () => {
    const f = (x: number, y: number) => (x * 300 + y * 977) % 4096;
    const bild = await dekodierePng16(png16(7, 5, f));
    expect(bild).not.toBeNull();
    expect(bild!.breite).toBe(7); expect(bild!.hoehe).toBe(5);
    for (let y = 0; y < 5; y++) for (let x = 0; x < 7; x++) expect(bild!.werte[y * 7 + x]).toBe(f(x, y));
  });

  it('lehnt andere Formate ab', async () => {
    expect(await dekodierePng16(new Uint8Array([1, 2, 3]).buffer)).toBeNull();
    const jpg = readFileSync('public/bildgebung/pneumothorax-rx/rontgen-pa.jpg');
    expect(await dekodierePng16(jpg.buffer.slice(jpg.byteOffset, jpg.byteOffset + jpg.byteLength))).toBeNull();
  });

  it('echte CT-Schicht der Lungenembolie: Luft, Kontrastmittel im Gefäß', async () => {
    const d = readFileSync('public/bildgebung/lungenembolie-ct/schicht-13.png');
    const bild = (await dekodierePng16(d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength)))!;
    expect(bild.breite).toBe(512); expect(bild.hoehe).toBe(384);
    const hu = (x: number, y: number) => bild.werte[Math.round(y * bild.hoehe) * bild.breite + Math.round(x * bild.breite)] - 1024;
    expect(hu(0.02, 0.02)).toBeLessThan(-900);
    expect(bild.werte[200 * 512 + 300]).toBe(1148); // Referenzwert aus der Originaldatei
    expect(bild.werte.reduce((m, v) => Math.max(m, v), 0) - 1024).toBeGreaterThan(200);
  });
});
