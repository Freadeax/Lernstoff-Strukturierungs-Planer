// KI-Tor: kleiner Cloudflare Worker, über den der Lernstoff-Planer ohne eigenen Schlüssel KI nutzen kann.
// Nutzt das kostenlose Tageskontingent von Workers AI (offene Modelle). Schutz gegen Missbrauch:
// nur feste Aufgaben mit festen Systemanweisungen (kein freier Chatbot), erlaubte Herkunft, optional
// Turnstile, Limit je Gerät und Tag, Gesamtlimit je Tag, Längenbegrenzung. Inhalte werden nicht gespeichert,
// nur Zähler (Geräte-Kennung gehasht).

import { AUFGABEN, type AufgabeId } from './aufgaben';

// ---------------------------------------------------------------- minimale Cloudflare-Typen

export interface Ai { run(model: string, input: Record<string, unknown>): Promise<unknown> }
export interface DurableObjectStub { fetch(url: string, init?: RequestInit): Promise<Response> }
export interface DurableObjectNamespace { idFromName(name: string): unknown; get(id: unknown): DurableObjectStub }
interface DurableObjectState { storage: { sql: { exec(q: string, ...p: unknown[]): { toArray(): Record<string, unknown>[] } } } }

export interface Env {
  AI: Ai;
  KONTINGENT: DurableObjectNamespace;
  /** Komma-getrennt, z. B. https://lernstoff-planer.pages.dev,https://freadeax.github.io */
  ERLAUBTE_HERKUNFT: string;
  MODELL?: string;
  LIMIT_GERAET?: string;
  LIMIT_GESAMT?: string;
  /** gesetzt = Turnstile-Prüfung an */
  TURNSTILE_SECRET?: string;
  /** gesetzt = Klassen-Zugangscode nötig */
  ZUGANGSCODE?: string;
}

export const STANDARD = { modell: '@cf/mistralai/mistral-small-3.1-24b-instruct', limitGeraet: 20, limitGesamt: 300 } as const;
export const GRENZE = { kontext: 4000, nachricht: 800, nachrichten: 30, zeichenGesamt: 20000 } as const;

export interface Nachricht { rolle: 'nutzer' | 'ki'; text: string }
export interface Anfrage { aufgabe: AufgabeId; kontext: string; verlauf: Nachricht[] }

const json = (body: unknown, status: number, cors: Record<string, string>) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...cors } });

function corsFuer(req: Request, env: Env): Record<string, string> | null {
  const herkunft = req.headers.get('origin') ?? '';
  const erlaubt = env.ERLAUBTE_HERKUNFT.split(',').map((s) => s.trim()).filter(Boolean);
  if (!erlaubt.includes(herkunft)) return null;
  return {
    'access-control-allow-origin': herkunft,
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'content-type, x-geraet, x-turnstile, x-zugangscode',
    'access-control-max-age': '86400',
    vary: 'origin',
  };
}

/** Prüft Form und Längen. Gibt eine Fehlermeldung oder die bereinigte Anfrage zurück. */
export function pruefeAnfrage(roh: unknown): Anfrage | string {
  if (!roh || typeof roh !== 'object') return 'Anfrage fehlt.';
  const r = roh as Record<string, unknown>;
  if (typeof r.aufgabe !== 'string' || !(r.aufgabe in AUFGABEN)) return 'Unbekannte Aufgabe.';
  if (typeof r.kontext !== 'string' || r.kontext.length > GRENZE.kontext) return 'Kontext fehlt oder ist zu lang.';
  if (!Array.isArray(r.verlauf) || r.verlauf.length > GRENZE.nachrichten) return 'Verlauf fehlt oder ist zu lang.';
  const verlauf: Nachricht[] = [];
  let summe = r.kontext.length;
  for (const n of r.verlauf as unknown[]) {
    const m = n as Record<string, unknown>;
    if (!m || (m.rolle !== 'nutzer' && m.rolle !== 'ki') || typeof m.text !== 'string' || m.text.length > GRENZE.nachricht) return 'Nachricht ungültig.';
    summe += m.text.length;
    verlauf.push({ rolle: m.rolle, text: m.text });
  }
  if (summe > GRENZE.zeichenGesamt) return 'Anfrage ist zu lang.';
  return { aufgabe: r.aufgabe as AufgabeId, kontext: r.kontext, verlauf };
}

async function sha256(s: string): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

async function turnstileOk(env: Env, token: string, ip: string): Promise<boolean> {
  if (!env.TURNSTILE_SECRET) return true;
  if (!token) return false;
  const body = new FormData();
  body.append('secret', env.TURNSTILE_SECRET);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  const d = (await r.json()) as { success?: boolean };
  return !!d.success;
}

const zahl = (s: string | undefined, d: number) => { const n = Number(s); return Number.isFinite(n) && n > 0 ? n : d; };

async function kontingent(env: Env, aktion: 'stand' | 'buchen', geraet: string): Promise<{ ok: boolean; restGeraet: number; restGesamt: number }> {
  const stub = env.KONTINGENT.get(env.KONTINGENT.idFromName('global'));
  const r = await stub.fetch(`https://kontingent/${aktion}`, {
    method: 'POST',
    body: JSON.stringify({ geraet, limitGeraet: zahl(env.LIMIT_GERAET, STANDARD.limitGeraet), limitGesamt: zahl(env.LIMIT_GESAMT, STANDARD.limitGesamt) }),
  });
  return (await r.json()) as { ok: boolean; restGeraet: number; restGesamt: number };
}

function textAus(antwort: unknown): string {
  const a = antwort as { response?: unknown; choices?: Array<{ message?: { content?: unknown } }> };
  if (typeof a?.response === 'string') return a.response;
  if (a?.response && typeof a.response === 'object') return JSON.stringify(a.response);
  const c = a?.choices?.[0]?.message?.content;
  return typeof c === 'string' ? c : '';
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const cors = corsFuer(req, env);
    if (!cors) return new Response('Nicht erlaubt', { status: 403 });
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    const geraetRoh = req.headers.get('x-geraet') ?? '';
    if (!/^[a-zA-Z0-9-]{16,64}$/.test(geraetRoh)) return json({ fehler: 'Geräte-Kennung fehlt.' }, 400, cors);
    const geraet = await sha256(`${geraetRoh}|${req.headers.get('cf-connecting-ip') ?? ''}`);
    if (env.ZUGANGSCODE && req.headers.get('x-zugangscode') !== env.ZUGANGSCODE) return json({ fehler: 'Zugangscode fehlt oder ist falsch.', code: 'zugangscode' }, 401, cors);

    if (req.method === 'GET' && url.pathname === '/v1/status') {
      const k = await kontingent(env, 'stand', geraet);
      return json({ verfuegbar: k.restGeraet > 0 && k.restGesamt > 0, restGeraet: k.restGeraet, restGesamt: k.restGesamt, turnstile: !!env.TURNSTILE_SECRET, zugangscode: !!env.ZUGANGSCODE }, 200, cors);
    }
    if (req.method !== 'POST' || url.pathname !== '/v1/antwort') return json({ fehler: 'Nicht gefunden.' }, 404, cors);

    if (!(await turnstileOk(env, req.headers.get('x-turnstile') ?? '', req.headers.get('cf-connecting-ip') ?? ''))) return json({ fehler: 'Bot-Prüfung fehlgeschlagen.', code: 'turnstile' }, 403, cors);
    let roh: unknown;
    try { roh = await req.json(); } catch { return json({ fehler: 'Ungültiges JSON.' }, 400, cors); }
    const a = pruefeAnfrage(roh);
    if (typeof a === 'string') return json({ fehler: a }, 400, cors);

    const k = await kontingent(env, 'buchen', geraet);
    if (!k.ok) return json({ fehler: k.restGesamt <= 0 ? 'Das Kontingent für heute ist aufgebraucht. Morgen geht es wieder.' : 'Dein Tageslimit ist erreicht. Morgen geht es wieder.', code: 'kontingent', ...k }, 429, cors);

    const aufgabe = AUFGABEN[a.aufgabe];
    const messages = [
      { role: 'system', content: aufgabe.system(a.kontext) },
      ...(aufgabe.verlaufAlsText
        ? [{ role: 'user', content: a.verlauf.map((n) => `${n.rolle === 'nutzer' ? 'ICH' : 'GEGENÜBER'}: ${n.text}`).join('\n') }]
        : a.verlauf.map((n) => ({ role: n.rolle === 'nutzer' ? 'user' : 'assistant', content: n.text }))),
    ];
    // Manche Modelle verlangen nach der Systemanweisung zuerst eine Nutzer-Nachricht.
    if (messages.length === 1 || messages[1]!.role !== 'user') messages.splice(1, 0, { role: 'user', content: aufgabe.start ?? 'Beginne.' });
    try {
      const antwort = await env.AI.run(env.MODELL || STANDARD.modell, { messages, max_tokens: aufgabe.maxTokens, temperature: aufgabe.temperatur, ...(aufgabe.schema ? { response_format: { type: 'json_schema', json_schema: aufgabe.schema } } : {}) });
      const text = textAus(antwort).trim();
      if (!text) return json({ fehler: 'Leere Antwort vom Modell.' }, 502, cors);
      return json({ text, restGeraet: k.restGeraet, restGesamt: k.restGesamt, modell: env.MODELL || STANDARD.modell }, 200, cors);
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      // Auf dem Gratis-Tarif endet das Tageskontingent von Workers AI mit einem Fehler, nicht mit einer Rechnung.
      if (/neuron|quota|limit|4006|capacity/i.test(m)) return json({ fehler: 'Das Kontingent für heute ist aufgebraucht. Morgen geht es wieder.', code: 'kontingent' }, 429, cors);
      return json({ fehler: 'Die KI ist gerade nicht erreichbar.' }, 502, cors);
    }
  },
};

/** Zähler je Tag (UTC): ein einziges Durable Object mit SQLite. Speichert keine Inhalte. */
export class Kontingent {
  constructor(private state: DurableObjectState) {
    this.state.storage.sql.exec('CREATE TABLE IF NOT EXISTS zaehler (tag TEXT, schluessel TEXT, n INTEGER, PRIMARY KEY (tag, schluessel))');
  }
  private n(tag: string, s: string): number {
    const r = this.state.storage.sql.exec('SELECT n FROM zaehler WHERE tag = ? AND schluessel = ?', tag, s).toArray()[0];
    return Number(r?.n ?? 0);
  }
  async fetch(req: Request): Promise<Response> {
    const { geraet, limitGeraet, limitGesamt } = (await req.json()) as { geraet: string; limitGeraet: number; limitGesamt: number };
    const tag = new Date().toISOString().slice(0, 10);
    const sql = this.state.storage.sql;
    let g = this.n(tag, `g:${geraet}`);
    let alle = this.n(tag, '*');
    let ok = g < limitGeraet && alle < limitGesamt;
    if (new URL(req.url).pathname === '/buchen' && ok) {
      sql.exec('INSERT INTO zaehler (tag, schluessel, n) VALUES (?, ?, 1) ON CONFLICT (tag, schluessel) DO UPDATE SET n = n + 1', tag, `g:${geraet}`);
      sql.exec('INSERT INTO zaehler (tag, schluessel, n) VALUES (?, ?, 1) ON CONFLICT (tag, schluessel) DO UPDATE SET n = n + 1', tag, '*');
      g++; alle++;
      sql.exec('DELETE FROM zaehler WHERE tag < ?', tag);
    } else if (new URL(req.url).pathname === '/buchen') ok = false;
    return new Response(JSON.stringify({ ok, restGeraet: Math.max(0, limitGeraet - g), restGesamt: Math.max(0, limitGesamt - alle) }));
  }
}
