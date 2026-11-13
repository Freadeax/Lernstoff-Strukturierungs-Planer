import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  alsCsv, AUFTRAEGE, entferneGesammelt, erledigte, geraetAus, leseRueckmeldungen, pruefeRueckmeldung, rueckmeldungText, sammle, setzeErledigt, ueberblick, type Rueckmeldung,
} from './testphase';
import { flatNav, NAV } from '../../ui/shell/nav';

const basis = (p: Partial<Rueckmeldung> = {}): Rueckmeldung => ({ v: 1, id: 'abc123', art: 'fehler', text: 'Knopf reagiert nicht', erstellt: '2026-11-13T10:00:00.000Z', ...p });

beforeEach(() => {
  const m = new Map<string, string>();
  vi.stubGlobal('localStorage', { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) });
});

describe('Testaufträge', () => {
  it('verweisen alle auf vorhandene Seiten', () => {
    const pfade = new Set(flatNav(NAV).map((n) => n.path));
    for (const a of AUFTRAEGE) expect(pfade.has(a.pfad.split('?')[0]), a.id).toBe(true);
  });
  it('merken Erledigtes in fester Reihenfolge', () => {
    setzeErledigt('karten', true); setzeErledigt('heute', true); setzeErledigt('unbekannt', true);
    expect(erledigte()).toEqual(['heute', 'karten']);
    expect(setzeErledigt('heute', false)).toEqual(['karten']);
  });
});

describe('Rückmeldung als Code', () => {
  it('übersteht Text, Teilen und Einlesen, auch mehrfach und mit Mail-Zitat', async () => {
    const a = basis({ seite: '/lernen/karten', sterne: 4, name: 'Mia', geraet: geraetAus('Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) Version/18.1 Safari/604.1', 390, true, 'abc') });
    const b = basis({ id: 'zweite', art: 'idee', text: 'Mehr Fälle' });
    const text = `${await rueckmeldungText(a, 'Karteikarten')}\n\n> ${(await rueckmeldungText(b)).replace(/\n/g, '\n> ')}`;
    expect(text).toContain('Seite: Karteikarten');
    const { neu, fehler } = await leseRueckmeldungen(text);
    expect(fehler).toEqual([]);
    expect(neu.map((r) => r.id)).toEqual(['abc123', 'zweite']);
    expect(neu[0]!.geraet).toMatchObject({ art: 'iPhone (iOS 18.1)', browser: 'Safari', app: true });
  });
  it('verwechselt keine Abgabe-Codes aus dem Klassenmodus', async () => {
    expect((await leseRueckmeldungen('LSP-ABGABE[jabc]')).neu).toEqual([]);
  });
  it('weist ungültige oder fremde Inhalte ab und bereinigt Felder', () => {
    expect(() => pruefeRueckmeldung({ v: 2 })).toThrow();
    expect(() => pruefeRueckmeldung({ ...basis(), art: 'quatsch' })).toThrow();
    const r = pruefeRueckmeldung({ ...basis(), sterne: 9, seite: 'https://boese.example', name: '  ' });
    expect(r.sterne).toBeUndefined();
    expect(r.seite).toBeUndefined();
    expect(r.name).toBeUndefined();
  });
});

describe('Auswertung', () => {
  it('sammelt ohne Doppelte und zählt je Art und Seite', () => {
    sammle([basis(), basis({ id: 'b', art: 'lob', sterne: 5, seite: '/' }), basis({ id: 'c', sterne: 2, seite: '/' })]);
    const r = sammle([basis()]);
    expect(r).toMatchObject({ neu: 0, doppelt: 1 });
    const u = ueberblick(r.liste);
    expect(u.gesamt).toBe(3);
    expect(u.jeArt).toMatchObject({ fehler: 2, lob: 1 });
    expect(u.sterneSchnitt).toBe(3.5);
    expect(u.jeSeite[0]).toMatchObject({ seite: '/', anzahl: 2, fehler: 1 });
    expect(entferneGesammelt('b')).toHaveLength(2);
  });
  it('schreibt CSV mit Semikolon und ohne Formel-Einschleusung', () => {
    const csv = alsCsv([basis({ text: '=HYPERLINK("x");2' })]);
    expect(csv.startsWith('﻿Datum;Art')).toBe(true);
    expect(csv).toContain(`"'=HYPERLINK(""x"");2"`);
  });
});

describe('Geräteangaben', () => {
  it('erkennt Gerät und Browser grob', () => {
    expect(geraetAus('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Version/18.0 Safari/605.1.15', 1180, false, 'x', true).art).toBe('iPad');
    expect(geraetAus('Mozilla/5.0 (Linux; Android 14) Chrome/130.0 Mobile Safari/537.36', 412, false, 'x').art).toBe('Android');
    expect(geraetAus('Mozilla/5.0 (Windows NT 10.0) Chrome/130.0 Safari/537.36 Edg/130.0', 1440, false, 'x')).toMatchObject({ art: 'Rechner', browser: 'Edge' });
  });
});
