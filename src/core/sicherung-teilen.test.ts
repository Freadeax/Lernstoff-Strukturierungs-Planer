import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { sichereUndGibWeiter, teileSicherungsDatei } from './sicherung';

// Safari öffnet das Teilen-Menü nur kurz nach dem Tipp. Dauert das Erstellen länger, kommt NotAllowedError:
// dann soll die fertige Datei zurückkommen (zweiter Tipp), statt still in einen Download auszuweichen.
const speicher = new Map<string, string>();
(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: (k: string) => speicher.get(k) ?? null, setItem: (k: string, v: string) => void speicher.set(k, v), removeItem: (k: string) => void speicher.delete(k),
};
const original = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
function setzeNavigator(share: (d: ShareData) => Promise<void>) {
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { canShare: () => true, share } });
}
afterEach(() => { if (original) Object.defineProperty(globalThis, 'navigator', original); speicher.clear(); });

describe('Sicherung teilen (Safari)', () => {
  it('gibt nach NotAllowedError die fertige Datei für einen zweiten Tipp zurück', async () => {
    setzeNavigator(() => Promise.reject(new DOMException('zu spät', 'NotAllowedError')));
    const r = await sichereUndGibWeiter('teilen');
    expect(typeof r).toBe('object');
    const datei = (r as { nochmalTeilen: File }).nochmalTeilen;
    expect(datei.name).toMatch(/\.json$/);
    expect(JSON.parse(await datei.text())).toHaveProperty('format');

    const share = vi.fn(() => Promise.resolve());
    setzeNavigator(share);
    expect(await teileSicherungsDatei(datei)).toBe('geteilt');
    expect(share).toHaveBeenCalledWith({ files: [datei], title: 'Lernstoff-Planer Sicherung' });
  });

  it('Abbrechen im Teilen-Menü bleibt „abgebrochen“', async () => {
    setzeNavigator(() => Promise.reject(new DOMException('abgebrochen', 'AbortError')));
    expect(await sichereUndGibWeiter('teilen')).toBe('abgebrochen');
  });
});
