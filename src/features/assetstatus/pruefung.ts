// Bildprüfung auf dem Gerät: Prüfergebnisse liegen bis zum Export im Browser (localStorage) und
// werden als Datei an Claude gegeben, der sie mit `npm run assets:freigaben -- <datei>` in
// src/ui/sim/bildfreigaben.ts übernimmt. Erst dort gelten sie für alle Geräte und den Asset-Bericht.

import type { BildFreigabe } from './freigaben';

export const PRUEF_FORMAT = 'lernstoff-bildpruefung/1';
const KEY = 'lernstoff.bildpruefung';
const KEY_VON = 'lernstoff.bildpruefung.von';

export interface PruefExport { format: typeof PRUEF_FORMAT; erstellt: string; eintraege: Record<string, BildFreigabe> }

export function leseLokal(): Record<string, BildFreigabe> {
  try {
    const roh = localStorage.getItem(KEY);
    if (!roh) return {};
    return pruefeEintraege(JSON.parse(roh));
  } catch { return {}; }
}

export function speichereLokal(e: Record<string, BildFreigabe>): boolean {
  try { localStorage.setItem(KEY, JSON.stringify(e)); return true; } catch { return false; }
}

export function leseVon(): string { try { return localStorage.getItem(KEY_VON) ?? ''; } catch { return ''; } }
export function speichereVon(v: string) { try { localStorage.setItem(KEY_VON, v); } catch { /* nur Komfort */ } }

const DATUM = /^\d{4}-\d{2}-\d{2}$/;
const SCHLUESSEL = /^(raeume|personen|sim-videos|bildgebung|titelbilder)\/[\w.\-]+(\.(webp|png|jpe?g|mp4))?$/;

/** Nimmt nur gültige Einträge an (Schlüssel unter public/, Status, Datum, Person, Hinweis bei Mangel). */
export function pruefeEintraege(wert: unknown): Record<string, BildFreigabe> {
  const aus: Record<string, BildFreigabe> = {};
  if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return aus;
  for (const [k, v] of Object.entries(wert as Record<string, unknown>)) {
    if (!SCHLUESSEL.test(k) || k.includes('..') || !v || typeof v !== 'object') continue;
    const f = v as Record<string, unknown>;
    if (f.status !== 'freigegeben' && f.status !== 'mangel') continue;
    if (typeof f.am !== 'string' || !DATUM.test(f.am) || typeof f.von !== 'string' || !f.von.trim()) continue;
    const hinweis = typeof f.hinweis === 'string' && f.hinweis.trim() ? f.hinweis.trim().slice(0, 500) : undefined;
    if (f.status === 'mangel' && !hinweis) continue;
    const pruefpunkte = Array.isArray(f.pruefpunkte) ? f.pruefpunkte.filter((p): p is string => typeof p === 'string' && /^[a-z]+$/.test(p)) : undefined;
    aus[k] = { status: f.status, am: f.am, von: f.von.trim().slice(0, 80), ...(hinweis ? { hinweis } : {}), ...(pruefpunkte?.length ? { pruefpunkte } : {}) };
  }
  return aus;
}

export function erstelleExport(eintraege: Record<string, BildFreigabe>, jetzt = new Date()): PruefExport {
  return { format: PRUEF_FORMAT, erstellt: jetzt.toISOString(), eintraege };
}

/** Liest eine Exportdatei; wirft bei falschem Format. */
export function leseExport(text: string): Record<string, BildFreigabe> {
  const d = JSON.parse(text) as Partial<PruefExport>;
  if (d.format !== PRUEF_FORMAT) throw new Error(`Unbekanntes Format (erwartet ${PRUEF_FORMAT})`);
  return pruefeEintraege(d.eintraege);
}

export const heute = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Sprungziel in die App, in der das Bild erscheint (Fall direkt, wo der Simulator das kann). */
export function verwendungZiel(w: string): string | undefined {
  const m = /^([a-z]+):([a-z0-9-]+)/.exec(w);
  if (!m) return undefined;
  const [, sim, id] = m;
  if (sim === 'praxis' && id !== 'lernclips') return `#/lernen/praxis?fall=${id}`;
  if (sim === 'praxis') return '#/lernen/praxis';
  if (sim === 'diagnostik') return `#/lernen/diagnostik?fall=${id}`;
  if (sim === 'fall') return '#/lernen/fall';
  if (sim === 'hygiene') return '#/lernen/hygiene';
  if (sim === 'notfall') return '#/lernen/notfall';
  return undefined;
}
