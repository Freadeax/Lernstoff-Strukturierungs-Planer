import { describe, expect, it, vi } from 'vitest';
import { GRENZEN, holeSerien, pruefeSerie, verbindeMaterial } from './material';
import { ladeSchicht } from '../../ui/sim/bildgebung/serie';

const ziel = { owner: 'ich', repo: 'material', token: 't' };
const json = (v: unknown) => new Response(JSON.stringify(v), { status: 200 });
function fakeFetch(privat: boolean, extra: Record<string, () => Response> = {}) {
  return vi.fn(async (url: string) => {
    if (url.endsWith('/repos/ich/material')) return json({ private: privat });
    for (const [k, f] of Object.entries(extra)) if (url.endsWith(k)) return f();
    return new Response('', { status: 404 });
  }) as unknown as typeof fetch;
}

describe('Material-Lader (SEC-03)', () => {
  it('lehnt ein öffentliches Repo ab', async () => {
    await expect(holeSerien(ziel, fakeFetch(false))).rejects.toThrow(/nicht privat/);
  });
  it('prüft die Sichtbarkeit einmal je Verbindung, nicht je Bild', async () => {
    const bild = () => new Response(new Blob([new Uint8Array(10)]), { status: 200 });
    const f = fakeFetch(true, { 'a/1.png': bild, 'a/2.png': bild });
    verbindeMaterial(ziel, f, () => ziel);
    const serie = pruefeSerie({ id: 'a', titel: 'A', quelle: { herkunft: 'eigen', dateien: ['1.png', '2.png'] } }, 'a');
    await Promise.allSettled([ladeSchicht(serie, 0), ladeSchicht(serie, 1)]);
    const aufrufe = (f as unknown as { mock: { calls: string[][] } }).mock.calls.map((c) => c[0]);
    expect(aufrufe.filter((u) => u.endsWith('/repos/ich/material'))).toHaveLength(1);
    verbindeMaterial({ owner: '', repo: '', token: '' });
  });
  it('lädt nichts, wenn sich das Ziel geändert hat', async () => {
    const f = fakeFetch(true);
    verbindeMaterial(ziel, f, () => ({ ...ziel, repo: 'anderes' }));
    const serie = pruefeSerie({ id: 'b', titel: 'B', quelle: { herkunft: 'eigen', dateien: ['1.png'] } }, 'b');
    await expect(ladeSchicht(serie, 0)).rejects.toThrow(/geändert/);
    expect(f).not.toHaveBeenCalled();
    verbindeMaterial({ owner: '', repo: '', token: '' });
  });
  it('lehnt zu große Dateien ab', async () => {
    const gross = () => new Response(new Blob([new Uint8Array(GRENZEN.dateiBytes + 1)]), { status: 200 });
    verbindeMaterial(ziel, fakeFetch(true, { 'c/1.png': gross }), () => ziel);
    const serie = pruefeSerie({ id: 'c', titel: 'C', quelle: { herkunft: 'eigen', dateien: ['1.png'] } }, 'c');
    await expect(ladeSchicht(serie, 0)).rejects.toThrow(/zu groß/);
    verbindeMaterial({ owner: '', repo: '', token: '' });
  });
  it('begrenzt Bilderzahl und Wertebereiche der Befundmarken', () => {
    expect(() => pruefeSerie({ id: 'd', titel: 'D', quelle: { herkunft: 'x', dateien: Array.from({ length: GRENZEN.bilderJeSerie + 1 }, (_, i) => `${i}.png`) } }, 'd')).toThrow(/zu viele/);
    expect(() => pruefeSerie({ id: '../x', titel: 'D', quelle: { herkunft: 'x', dateien: ['1.png'] } }, 'd')).toThrow(/id/);
    const s = pruefeSerie({ id: 'e', titel: 'E', quelle: { herkunft: 'x', dateien: ['1.png', '2.png'] }, pixelMm: 99, befunde: [
      { id: 'ok', x: 0.5, y: 0.5, r: 0.1, titel: 'ok', text: '' },
      { id: 'aussen', x: 1.5, y: 0.5, r: 0.1 },
      { id: 'riesig', x: 0.5, y: 0.5, r: 3 },
      { id: 'schicht', x: 0.5, y: 0.5, r: 0.1, schichten: [0, 5] },
    ] }, 'e');
    expect(s.befunde.map((b) => b.id)).toEqual(['ok']);
    expect(s.pixelMm).toBeUndefined();
  });
});
