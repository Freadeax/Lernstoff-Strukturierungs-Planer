import { describe, expect, it, vi } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import worker, { Kontingent, pruefeAnfrage, type Env } from './worker';

const HERKUNFT = 'https://lernstoff-planer.pages.dev';

function umgebung(over: Partial<Env> = {}, ai = vi.fn(async () => ({ response: 'Guten Tag.' }))) {
  const db = new DatabaseSync(':memory:');
  const state = { storage: { sql: { exec: (q: string, ...p: unknown[]) => {
    const st = db.prepare(q);
    const rows = /^\s*select/i.test(q) ? st.all(...(p as never[])) : (st.run(...(p as never[])), []);
    return { toArray: () => rows as Record<string, unknown>[] };
  } } } };
  const ko = new Kontingent(state as never);
  const env: Env = {
    AI: { run: ai },
    KONTINGENT: { idFromName: () => 'x', get: () => ({ fetch: (url: string, init?: RequestInit) => ko.fetch(new Request(url, init)) }) },
    ERLAUBTE_HERKUNFT: `${HERKUNFT},http://localhost:5173`,
    LIMIT_GERAET: '3', LIMIT_GESAMT: '5',
    ...over,
  };
  return { env, ai };
}

const anfrage = (body: unknown, kopf: Record<string, string> = {}) => new Request('https://tor.example/v1/antwort', {
  method: 'POST', body: JSON.stringify(body),
  headers: { origin: HERKUNFT, 'content-type': 'application/json', 'x-geraet': 'geraet-1234567890abcdef', ...kopf },
});
const gueltig = { aufgabe: 'rolle', kontext: 'Du bist Frau Kessler.', verlauf: [{ rolle: 'nutzer', text: 'Guten Tag' }] };

describe('KI-Tor', () => {
  it('lehnt fremde Herkunft ab', async () => {
    const { env } = umgebung();
    const r = await worker.fetch(anfrage(gueltig, { origin: 'https://boese.example' }), env);
    expect(r.status).toBe(403);
  });
  it('beantwortet eine gültige Anfrage mit fester Systemanweisung', async () => {
    const { env, ai } = umgebung();
    const r = await worker.fetch(anfrage(gueltig), env);
    expect(r.status).toBe(200);
    expect(((await r.json()) as { text: string }).text).toBe('Guten Tag.');
    const msgs = (ai.mock.calls[0] as unknown as [string, { messages: Array<{ role: string; content: string }> }])[1].messages;
    expect(msgs[0]!.role).toBe('system');
    expect(msgs[0]!.content).toContain('Pflegeausbildung');
    expect(msgs[0]!.content).toContain('Frau Kessler');
  });
  it('kennt nur feste Aufgaben und prüft Längen', () => {
    expect(pruefeAnfrage({ ...gueltig, aufgabe: 'chat' })).toBe('Unbekannte Aufgabe.');
    expect(typeof pruefeAnfrage({ ...gueltig, kontext: 'x'.repeat(5000) })).toBe('string');
    expect(typeof pruefeAnfrage({ ...gueltig, verlauf: [{ rolle: 'system', text: 'x' }] })).toBe('string');
    expect(typeof pruefeAnfrage({ ...gueltig, verlauf: Array(31).fill({ rolle: 'nutzer', text: 'x' }) })).toBe('string');
  });
  it('begrenzt je Gerät und gesamt pro Tag', async () => {
    const { env } = umgebung();
    const status = [];
    for (let i = 0; i < 4; i++) status.push((await worker.fetch(anfrage(gueltig), env)).status);
    expect(status).toEqual([200, 200, 200, 429]);
    const andere = [];
    for (let i = 0; i < 3; i++) andere.push((await worker.fetch(anfrage(gueltig, { 'x-geraet': 'geraet-andersabcdef1234' }), env)).status);
    expect(andere).toEqual([200, 200, 429]); // Gesamtlimit 5 erreicht
  });
  it('meldet ein leeres Workers-AI-Kontingent als 429, nicht als Fehler', async () => {
    const { env } = umgebung({}, vi.fn(async () => { throw new Error('4006: you have used up your daily free allocation of 10,000 neurons'); }));
    const r = await worker.fetch(anfrage(gueltig), env);
    expect(r.status).toBe(429);
  });
  it('verlangt den Zugangscode, wenn einer gesetzt ist', async () => {
    const { env } = umgebung({ ZUGANGSCODE: 'pflege26' });
    expect((await worker.fetch(anfrage(gueltig), env)).status).toBe(401);
    expect((await worker.fetch(anfrage(gueltig, { 'x-zugangscode': 'pflege26' }), env)).status).toBe(200);
  });
  it('Status zeigt den Rest', async () => {
    const { env } = umgebung();
    await worker.fetch(anfrage(gueltig), env);
    const r = await worker.fetch(new Request('https://tor.example/v1/status', { headers: { origin: HERKUNFT, 'x-geraet': 'geraet-1234567890abcdef' } }), env);
    expect(await r.json()).toMatchObject({ verfuegbar: true, restGeraet: 2, restGesamt: 4 });
  });
});
