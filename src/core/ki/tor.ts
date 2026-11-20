// KI-Tor: KI ohne eigenen Schlüssel über den Cloudflare Worker in ki-tor/ (Gratis-Kontingent von Workers AI).
// Das Tor kennt nur feste Aufgaben; die App liefert Kontext und Verlauf. Gespeichert wird dort nichts außer
// Zählern. Die Geräte-Kennung ist eine Zufallszahl dieses Geräts, ohne Bezug zur Person.

/** Adresse des Workers. Leer = KI-Tor aus (dann nur eigener Schlüssel oder Offline-Katalog). */
export const KI_TOR_ADRESSE = 'https://lernstoff-ki-tor.team-room.workers.dev';
/** Wird erst true, wenn das Tor veröffentlicht ist (siehe ki-tor/README.md). */
export const KI_TOR_AKTIV = false;

export type TorAufgabe = 'rolle' | 'zuordnen' | 'rueckmeldung';
export interface TorNachricht { rolle: 'nutzer' | 'ki'; text: string }
export interface TorStand { verfuegbar: boolean; restGeraet: number; restGesamt: number; zugangscode: boolean }

const GERAET = 'lernstoff.kitor.geraet';
const CODE = 'lernstoff.kitor.zugangscode';

export class TorFehler extends Error {
  constructor(message: string, readonly code: 'kontingent' | 'zugangscode' | 'turnstile' | 'netz' | 'sonst') { super(message); }
}

export const torVerfuegbar = (): boolean => KI_TOR_AKTIV && !!KI_TOR_ADRESSE;

function geraet(): string {
  try {
    let g = localStorage.getItem(GERAET);
    if (!g) { g = crypto.randomUUID(); localStorage.setItem(GERAET, g); }
    return g;
  } catch { return crypto.randomUUID(); }
}

export function setzeZugangscode(code: string) { try { if (code) localStorage.setItem(CODE, code); else localStorage.removeItem(CODE); } catch { /* privat */ } }
const zugangscode = () => { try { return localStorage.getItem(CODE) ?? ''; } catch { return ''; } };

function kopf(): Record<string, string> {
  const c = zugangscode();
  return { 'x-geraet': geraet(), ...(c ? { 'x-zugangscode': c } : {}) };
}

async function lies<T>(r: Response): Promise<T> {
  const d = (await r.json().catch(() => ({}))) as { fehler?: string; code?: string } & T;
  if (!r.ok) {
    const code = d.code === 'kontingent' || d.code === 'zugangscode' || d.code === 'turnstile' ? d.code : 'sonst';
    throw new TorFehler(d.fehler || `Die KI ist gerade nicht erreichbar (${r.status}).`, code);
  }
  return d;
}

export async function torStand(signal?: AbortSignal): Promise<TorStand> {
  if (!torVerfuegbar()) throw new TorFehler('Die eingebaute KI ist noch nicht eingerichtet.', 'sonst');
  try { return await lies<TorStand>(await fetch(`${KI_TOR_ADRESSE}/v1/status`, { headers: kopf(), signal })); }
  catch (e) { throw e instanceof TorFehler ? e : new TorFehler('Keine Verbindung zur eingebauten KI. Bist du online?', 'netz'); }
}

export async function torAntwort(opts: { aufgabe: TorAufgabe; kontext: string; verlauf: TorNachricht[]; signal?: AbortSignal }): Promise<{ text: string; restGeraet: number }> {
  if (!torVerfuegbar()) throw new TorFehler('Die eingebaute KI ist noch nicht eingerichtet.', 'sonst');
  try {
    const r = await fetch(`${KI_TOR_ADRESSE}/v1/antwort`, {
      method: 'POST', signal: opts.signal,
      headers: { 'content-type': 'application/json', ...kopf() },
      body: JSON.stringify({ aufgabe: opts.aufgabe, kontext: opts.kontext.slice(0, 4000), verlauf: opts.verlauf.slice(-30).map((n) => ({ rolle: n.rolle, text: n.text.slice(0, 800) })) }),
    });
    return await lies<{ text: string; restGeraet: number }>(r);
  } catch (e) { throw e instanceof TorFehler ? e : new TorFehler('Keine Verbindung zur eingebauten KI. Bist du online?', 'netz'); }
}
