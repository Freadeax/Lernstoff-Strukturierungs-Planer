// Gemeinsamer KI-Baustein für Claude mit eigenem Schlüssel (Audit C-1).
// Ein Modell an einer Stelle, das Anthropic-SDK wird erst beim ersten Aufruf geladen (eigener Chunk,
// nicht im Startpaket), einheitliche Fehlermeldungen, Abbruch per AbortSignal, Kosten je Anfrage.
// Ohne eigenen Schlüssel: siehe ./tor.ts (KI-Tor) und den Offline-Katalog (core/abgleich).

import type AnthropicTyp from '@anthropic-ai/sdk';

export const KI_MODELL = 'claude-opus-5-5';
/** US-Dollar je Million Tokens für KI_MODELL (Anthropic-Preisliste, Stand November 2026). */
export const KI_PREISE = { eingabeJeMio: 4, ausgabeJeMio: 20, cacheLesenJeMio: 0.2 } as const;

export type Effort = 'low' | 'medium' | 'high';
export interface KiNachricht { role: 'user' | 'assistant'; content: unknown }
export interface KiUsage { input_tokens?: number; output_tokens?: number; cache_read_input_tokens?: number; cache_creation_input_tokens?: number }
export interface KiAntwort {
  content: Array<{ type: string; text?: string; citations?: unknown[] }>;
  stop_reason: string | null;
  model?: string;
  usage?: KiUsage;
}

export type KiFehlerArt = 'schluessel' | 'abgelehnt' | 'abgeschnitten' | 'ueberlastet' | 'netz' | 'unlesbar' | 'abgebrochen' | 'sonst';

/** Fehler mit Art, damit Seiten gezielt „Nochmal versuchen“ oder „Zu den Einstellungen“ anbieten können. */
export class KiFehler extends Error {
  constructor(message: string, readonly art: KiFehlerArt) { super(message); this.name = 'KiFehler'; }
  get wiederholbar(): boolean { return this.art === 'ueberlastet' || this.art === 'netz' || this.art === 'unlesbar' || this.art === 'abgeschnitten'; }
}

let sdk: Promise<typeof AnthropicTyp> | undefined;
const ladeSdk = () => (sdk ??= import('@anthropic-ai/sdk').then((m) => m.default).catch((e: unknown) => { sdk = undefined; throw e; }));

const clients = new Map<string, AnthropicTyp>();
async function client(apiKey: string): Promise<AnthropicTyp> {
  const Anthropic = await ladeSdk();
  let c = clients.get(apiKey);
  if (!c) { c = new Anthropic({ apiKey, dangerouslyAllowBrowser: true }); clients.set(apiKey, c); }
  return c;
}

export interface KiAnfrage {
  apiKey: string;
  /** Für Kostenübersicht und Fehlersuche, z. B. 'sis' oder 'zusammenfasser:pruefer'. */
  modul: string;
  system?: string;
  messages: KiNachricht[];
  maxTokens: number;
  effort?: Effort;
  /** JSON-Schema für strukturierte Ausgabe */
  schema?: object;
  /** Lange Antworten streamen (verhindert HTTP-Zeitüberschreitung) */
  stream?: boolean;
  model?: string;
  signal?: AbortSignal;
  /** Text bei abgeschnittener Antwort (je Modul passend) */
  abgeschnitten?: string;
  abgelehnt?: string;
  /** Wird mit jeder Antwort aufgerufen, auch bei Ablehnung oder Abbruch durch max_tokens (Protokoll). */
  beiAntwort?: (r: KiAntwort) => void;
}

function uebersetze(e: unknown, signal?: AbortSignal): KiFehler {
  if (e instanceof KiFehler) return e;
  if (signal?.aborted || (e instanceof Error && e.name === 'AbortError') || (e as { name?: string })?.name === 'APIUserAbortError') return new KiFehler('Abgebrochen.', 'abgebrochen');
  const status = (e as { status?: number })?.status;
  if (status === 401 || status === 403) return new KiFehler('Der API-Schlüssel wurde abgelehnt. Bitte in den Einstellungen prüfen.', 'schluessel');
  if (status === 429) return new KiFehler('Zu viele Anfragen in kurzer Zeit. Bitte einen Moment warten und noch einmal versuchen.', 'ueberlastet');
  if (status && status >= 500) return new KiFehler('Claude ist gerade überlastet. Bitte gleich noch einmal versuchen.', 'ueberlastet');
  if (status === 400) return new KiFehler(`Die Anfrage wurde nicht angenommen: ${e instanceof Error ? e.message.slice(0, 200) : ''}`, 'sonst');
  if ((e as { name?: string })?.name === 'APIConnectionError' || e instanceof TypeError) return new KiFehler('Keine Verbindung zu Claude. Bist du online?', 'netz');
  return new KiFehler(e instanceof Error ? e.message : String(e), 'sonst');
}

/** Ein Aufruf an Claude. Wirft KiFehler bei Ablehnung, Abbruch, Schlüssel- oder Netzproblemen. */
export async function frageClaude(a: KiAnfrage): Promise<KiAntwort> {
  const params = {
    model: a.model ?? KI_MODELL,
    max_tokens: a.maxTokens,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: a.effort ?? 'low', ...(a.schema ? { format: { type: 'json_schema', schema: a.schema } } : {}) },
    ...(a.system ? { system: a.system } : {}),
    messages: a.messages,
  };
  let r: KiAntwort;
  try {
    const c = await client(a.apiKey);
    // Einzige Stelle mit losem Parametertyp: `fallbacks` und Beta-Felder fehlen in den SDK-Typen dieser Version.
    type Params = Parameters<typeof c.beta.messages.create>[0];
    r = a.stream
      ? await c.beta.messages.stream(params as Params, { signal: a.signal }).finalMessage() as KiAntwort
      : await c.beta.messages.create({ ...params, stream: false } as Params, { signal: a.signal }) as KiAntwort;
  } catch (e) { throw uebersetze(e, a.signal); }
  merkeKosten(a.modul, r);
  a.beiAntwort?.(r);
  if (r.stop_reason === 'refusal') throw new KiFehler(a.abgelehnt ?? 'Die KI hat die Anfrage abgelehnt.', 'abgelehnt');
  if (r.stop_reason === 'max_tokens') throw new KiFehler(a.abgeschnitten ?? 'Die Antwort wurde abgeschnitten. Bitte noch einmal versuchen.', 'abgeschnitten');
  return r;
}

export const textAus = (r: KiAntwort, trenner = '') => r.content.filter((b) => b.type === 'text').map((b) => b.text ?? '').join(trenner);

/** Erstes JSON-Objekt bzw. -Array aus einer Antwort, robust gegen Text drumherum. */
export function leseJson<T>(text: string): T {
  const start = text.search(/[[{]/);
  const ende = Math.max(text.lastIndexOf('}'), text.lastIndexOf(']'));
  if (start < 0 || ende < start) throw new KiFehler('Die Antwort der KI war nicht lesbar. Bitte noch einmal versuchen.', 'unlesbar');
  try { return JSON.parse(text.slice(start, ende + 1)) as T; }
  catch { throw new KiFehler('Die Antwort der KI war nicht lesbar. Bitte noch einmal versuchen.', 'unlesbar'); }
}

/** Schulnote aus einer KI-Antwort: fehlt sie, gibt es einen Fehler statt still einer 6 (Audit C-2). */
export function noteAus(x: unknown): number {
  const n = typeof x === 'string' ? Number(x.replace(',', '.')) : typeof x === 'number' ? x : NaN;
  if (!Number.isFinite(n)) throw new KiFehler('Die KI hat keine gültige Note geliefert. Die Bewertung ist fehlgeschlagen, bitte noch einmal versuchen.', 'unlesbar');
  return Math.min(6, Math.max(1, Math.round(n)));
}

// ---------------------------------------------------------------- Kosten je Anfrage

export interface KostenEintrag { zeit: string; modul: string; eingabe: number; ausgabe: number; cacheLesen: number; dollar: number }
const KOSTEN = 'lernstoff.ki.kosten';

export function kostenVon(u: KiUsage | undefined): Omit<KostenEintrag, 'zeit' | 'modul'> {
  const eingabe = (u?.input_tokens ?? 0) + (u?.cache_creation_input_tokens ?? 0);
  const ausgabe = u?.output_tokens ?? 0;
  const cacheLesen = u?.cache_read_input_tokens ?? 0;
  const dollar = (eingabe * KI_PREISE.eingabeJeMio + ausgabe * KI_PREISE.ausgabeJeMio + cacheLesen * KI_PREISE.cacheLesenJeMio) / 1e6;
  return { eingabe, ausgabe, cacheLesen, dollar: Math.round(dollar * 10000) / 10000 };
}

function merkeKosten(modul: string, r: KiAntwort) {
  if (!r.usage) return;
  try {
    const liste = kiKosten();
    liste.unshift({ zeit: new Date().toISOString(), modul, ...kostenVon(r.usage) });
    localStorage.setItem(KOSTEN, JSON.stringify(liste.slice(0, 50)));
    window.dispatchEvent(new CustomEvent('lernstoff:ki-kosten'));
  } catch { /* Speicher voll oder privat: Kostenanzeige ist nur eine Hilfe */ }
}

/** Letzte KI-Anfragen mit Kosten (neueste zuerst, höchstens 50, nur auf diesem Gerät). */
export function kiKosten(): KostenEintrag[] {
  try {
    const roh = JSON.parse(localStorage.getItem(KOSTEN) ?? '[]') as unknown;
    return Array.isArray(roh) ? roh.filter((x): x is KostenEintrag => !!x && typeof (x as KostenEintrag).dollar === 'number') : [];
  } catch { return []; }
}

export const dollarText = (d: number) => (d < 0.01 ? 'unter 1 Cent' : `ca. ${(d * 100).toLocaleString('de-DE', { maximumFractionDigits: 1 })} Cent`);
