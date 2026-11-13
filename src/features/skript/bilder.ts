// Abbildungen zu Skripten: liegen wie die Texte nur im privaten Material-Repo (unter skripte/,
// z. B. skripte/bilder/aml/abb-15-01.jpg) und werden beim Laden offline auf dem Gerät gespeichert.
// Gespeichert wird im Cache-Speicher des Browsers, nicht in IndexedDB: So bleiben Bilder aus der
// Datensicherung (JSON) heraus und lassen sich jederzeit neu aus dem Repo holen.
// Im Skript stehen sie als Markdown-Bild: ![Abb. 15.1 Wirkorte](bilder/aml/abb-15-01.jpg).

import { ladeZiel, type AblageZiel } from '../ablage/ablage';
import { REPO_ORDNER } from './konstanten';

/** Erlaubte Bildendungen. SVG bleibt draußen (könnte Skripte enthalten). */
const ENDUNG = /\.(png|jpe?g|webp|gif|avif)$/i;
const TYP: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', avif: 'image/avif' };

export const BILD_MUSTER = /!\[([^\]\n]{0,300})\]\(([^)\s]+)(?:\s+"([^"\n]{0,300})")?\)/g;

/**
 * Pfad eines Bildes im Material-Repo, aufgelöst gegen den Ordner skripte/.
 * Gibt undefined zurück für Web-Adressen, data:-Bilder, fremde Endungen und Pfade, die aus dem Repo führen.
 */
export function repoPfad(src: string): string | undefined {
  let s = src.trim();
  try { s = decodeURIComponent(s); } catch { /* bleibt roh */ }
  if (/^[a-z][a-z0-9+.-]*:/i.test(s) || s.startsWith('//') || !ENDUNG.test(s.replace(/[?#].*$/, ''))) return undefined;
  s = s.replace(/[?#].*$/, '');
  const teile = s.startsWith('/') ? [] : [REPO_ORDNER];
  for (const t of s.split('/')) {
    if (!t || t === '.') continue;
    if (t === '..') { if (!teile.length) return undefined; teile.pop(); continue; }
    teile.push(t);
  }
  return teile.length ? teile.join('/') : undefined;
}

/** Alle Repo-Bildpfade, auf die ein Markdown-Text verweist (ohne Doppelte). */
export function bildVerweise(markdown: string): string[] {
  const out = new Set<string>();
  for (const m of markdown.matchAll(BILD_MUSTER)) {
    const p = repoPfad(m[2]!);
    if (p) out.add(p);
  }
  return [...out];
}

// ---------------------------------------------------------------- Speicher

export interface BildSpeicher {
  hole(pfad: string): Promise<{ blob: Blob; sha?: string } | undefined>;
  lege(pfad: string, blob: Blob, sha?: string): Promise<void>;
  pfade(): Promise<string[]>;
  loesche(pfad: string): Promise<void>;
}

const CACHE = 'lernstoff-skript-bilder';
const SCHLUESSEL = '/__skript-bilder/';
const url = (pfad: string) => new URL(SCHLUESSEL + pfad.split('/').map(encodeURIComponent).join('/'), location.origin).href;

/** Cache-Speicher des Browsers. Ohne Cache-API (alte Browser, Tests) bleibt ein Speicher im Arbeitsspeicher. */
export function cacheSpeicher(): BildSpeicher {
  if (typeof caches === 'undefined') return speicherImArbeitsspeicher();
  const offen = () => caches.open(CACHE);
  return {
    async hole(pfad) {
      const r = await (await offen()).match(url(pfad));
      if (!r) return undefined;
      return { blob: await r.blob(), sha: r.headers.get('x-sha') ?? undefined };
    },
    async lege(pfad, blob, sha) {
      await (await offen()).put(url(pfad), new Response(blob, { headers: { 'Content-Type': blob.type || 'application/octet-stream', ...(sha ? { 'x-sha': sha } : {}) } }));
    },
    async pfade() {
      const keys = await (await offen()).keys();
      return keys.map((k) => new URL(k.url).pathname).filter((p) => p.startsWith(SCHLUESSEL)).map((p) => p.slice(SCHLUESSEL.length).split('/').map(decodeURIComponent).join('/'));
    },
    async loesche(pfad) { await (await offen()).delete(url(pfad)); },
  };
}

export function speicherImArbeitsspeicher(): BildSpeicher {
  const m = new Map<string, { blob: Blob; sha?: string }>();
  return {
    hole: async (p) => m.get(p),
    lege: async (p, blob, sha) => void m.set(p, sha ? { blob, sha } : { blob }),
    pfade: async () => [...m.keys()],
    loesche: async (p) => void m.delete(p),
  };
}

let standard: BildSpeicher | undefined;
export const bildSpeicher = (): BildSpeicher => (standard ??= cacheSpeicher());

// ---------------------------------------------------------------- Laden aus dem Repo

export interface BildErgebnis { neu: number; aktualisiert: number; unveraendert: number; fehlend: string[] }

const bytesAusBase64 = (b64: string) => Uint8Array.from(atob(b64.replace(/\s+/g, '')), (c) => c.charCodeAt(0));

/**
 * Fehlende oder geänderte Bilder aus dem Material-Repo holen. Geändert heißt: anderer Git-SHA.
 * Ein fehlendes Bild bricht das Laden nicht ab, es wird nur gemeldet.
 */
export async function holeBilder(pfade: string[], z: AblageZiel = ladeZiel(), speicher: BildSpeicher = bildSpeicher(), f: typeof fetch = fetch): Promise<BildErgebnis> {
  const erg: BildErgebnis = { neu: 0, aktualisiert: 0, unveraendert: 0, fehlend: [] };
  const kopf = (raw: boolean) => ({ Accept: raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json', Authorization: `Bearer ${z.token}`, 'X-GitHub-Api-Version': '2022-11-28' });
  const adresse = (p: string) => `https://api.github.com/repos/${z.owner}/${z.repo}/contents/${p.split('/').map(encodeURIComponent).join('/')}`;
  // Nacheinander in kleinen Gruppen, damit ein langsames Netz (iPhone unterwegs) nicht überläuft
  for (let i = 0; i < pfade.length; i += 6) {
    await Promise.all(pfade.slice(i, i + 6).map(async (pfad) => {
      try {
        const meta = await f(adresse(pfad), { headers: kopf(false) });
        if (meta.status === 401) throw Object.assign(new Error('Der Token ist ungültig oder abgelaufen. Unter Material → Große Dateien neu eintragen.'), { abbruch: true });
        if (!meta.ok) { erg.fehlend.push(pfad); return; }
        const info = (await meta.json()) as { type?: string; sha?: string; content?: string; encoding?: string };
        if (info.type && info.type !== 'file') { erg.fehlend.push(pfad); return; }
        const alt = await speicher.hole(pfad);
        if (alt && info.sha && alt.sha === info.sha) { erg.unveraendert++; return; }
        let daten: BlobPart;
        if (info.content && info.encoding === 'base64') daten = bytesAusBase64(info.content);
        else {
          const roh = await f(adresse(pfad), { headers: kopf(true) });
          if (!roh.ok) { erg.fehlend.push(pfad); return; }
          daten = await roh.arrayBuffer();
        }
        const endung = pfad.match(ENDUNG)?.[1]!.toLowerCase() ?? '';
        await speicher.lege(pfad, new Blob([daten], { type: TYP[endung] ?? 'application/octet-stream' }), info.sha);
        if (alt) erg.aktualisiert++; else erg.neu++;
      } catch (e) {
        if ((e as { abbruch?: boolean }).abbruch) throw e;
        erg.fehlend.push(pfad);
      }
    }));
  }
  if ((erg.neu || erg.aktualisiert) && typeof window !== 'undefined') window.dispatchEvent(new Event(BILDER_GEAENDERT));
  return erg;
}

/** Ereignis, nach dem angezeigte Abbildungen sich neu aus dem Speicher holen. */
export const BILDER_GEAENDERT = 'lernstoff:skript-bilder';

/** Bilder entfernen, auf die kein Skript mehr verweist. */
export async function raeumeBilderAuf(behalten: Set<string>, speicher: BildSpeicher = bildSpeicher()): Promise<number> {
  let n = 0;
  for (const p of await speicher.pfade()) if (!behalten.has(p)) { await speicher.loesche(p); n++; }
  return n;
}
