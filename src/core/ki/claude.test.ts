import { beforeEach, describe, expect, it, vi } from 'vitest';

const create = vi.fn();
vi.mock('@anthropic-ai/sdk', () => ({ default: class { beta = { messages: { create } }; } }));

const speicher = new Map<string, string>();
vi.stubGlobal('localStorage', { getItem: (k: string) => speicher.get(k) ?? null, setItem: (k: string, v: string) => speicher.set(k, v), removeItem: (k: string) => speicher.delete(k), clear: () => speicher.clear() });
vi.stubGlobal('window', { dispatchEvent: () => true });

const { frageClaude, KiFehler, kiKosten, kostenVon, noteAus, textAus } = await import('./claude');

const basis = { apiKey: 'sk-test', modul: 'test', maxTokens: 100, messages: [{ role: 'user' as const, content: 'Hallo' }] };

describe('KI-Baustein (Claude)', () => {
  beforeEach(() => { create.mockReset(); localStorage.clear(); });

  it('ein Modell, feste Grundeinstellungen, Text heraus', async () => {
    create.mockResolvedValue({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'Hi' }], usage: { input_tokens: 1000, output_tokens: 100 } });
    const r = await frageClaude({ ...basis, schema: { type: 'object' } });
    expect(textAus(r)).toBe('Hi');
    const p = create.mock.calls[0]![0];
    expect(p.model).toBe('claude-opus-5-5');
    expect(p.fallbacks).toBe('default');
    expect(p.output_config.format.schema).toEqual({ type: 'object' });
  });

  it('Ablehnung und Abschneiden werden zu KiFehler', async () => {
    create.mockResolvedValueOnce({ stop_reason: 'refusal', content: [] });
    await expect(frageClaude(basis)).rejects.toMatchObject({ art: 'abgelehnt' });
    create.mockResolvedValueOnce({ stop_reason: 'max_tokens', content: [] });
    await expect(frageClaude(basis)).rejects.toMatchObject({ art: 'abgeschnitten' });
  });

  it('übersetzt Schlüssel-, Last- und Netzfehler', async () => {
    create.mockRejectedValueOnce(Object.assign(new Error('x'), { status: 401 }));
    await expect(frageClaude(basis)).rejects.toMatchObject({ art: 'schluessel' });
    create.mockRejectedValueOnce(Object.assign(new Error('x'), { status: 529 }));
    const e = await frageClaude(basis).catch((x: unknown) => x);
    expect(e).toBeInstanceOf(KiFehler);
    expect((e as InstanceType<typeof KiFehler>).wiederholbar).toBe(true);
    create.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(frageClaude(basis)).rejects.toMatchObject({ art: 'netz' });
  });

  it('merkt Kosten je Anfrage', async () => {
    create.mockResolvedValue({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'ok' }], usage: { input_tokens: 1_000_000, output_tokens: 0 } });
    await frageClaude({ ...basis, modul: 'sis' });
    expect(kiKosten()[0]).toMatchObject({ modul: 'sis', dollar: 4 });
    expect(kostenVon({ output_tokens: 1_000_000 }).dollar).toBe(20);
  });

  it('keine stille Note 6: fehlende Note ist ein Fehler (Audit C-2)', () => {
    expect(() => noteAus(undefined)).toThrow(/keine gültige Note/);
    expect(() => noteAus('gut')).toThrow(KiFehler);
    expect(noteAus(2.4)).toBe(2);
    expect(noteAus('3,6')).toBe(4);
    expect(noteAus(9)).toBe(6);
  });
});

describe('Trainer werfen ohne Note', () => {
  it('SIS, Übergabe, Bericht, Pflegeplanung, Examen', async () => {
    const sis = await import('../../features/sis/claude');
    expect(() => sis.leseRueckmeldung('{"felder": []}')).toThrow(/keine gültige Note/);
    const ueb = await import('../../features/uebergabe/claude');
    expect(() => ueb.leseRueckmeldung('{"teile": []}')).toThrow(/keine gültige Note/);
    const ber = await import('../../features/bericht/claude');
    expect(() => ber.leseRueckmeldung('{"umformulieren": []}')).toThrow(/keine gültige Note/);
    const pp = await import('../../features/pflegeplanung/claude');
    expect(() => pp.leseRueckmeldung('{"prozent": 50}', [])).toThrow(/keine gültige Note/);
  });
});
