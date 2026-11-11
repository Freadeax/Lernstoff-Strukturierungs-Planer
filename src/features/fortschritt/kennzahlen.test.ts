import { describe, expect, it } from 'vitest';
import { datenbasis, GRENZEN, KENNZAHLEN, kleineBasis, wochenOhneDaten, zeitraumText } from './kennzahlen';
import type { Fakten } from './statistik';

const leer: Fakten = { studyLogs: [], reviewLogs: [], kartenLogs: [] };
const abfrage = (date: string, rating: 1 | 2 | 3 | 4 = 3) => ({ topicId: 't1', date, source: 'quiz' as const, rating });
const datum = (d: string) => d.split('-').reverse().join('.');

describe('Herkunft der Kennzahlen', () => {
  it('jede Kennzahl hat Quelle, Zeitraum und Definition', () => {
    for (const k of Object.values(KENNZAHLEN)) {
      expect(k.quelle.length).toBeGreaterThan(10);
      expect(k.zeitraum.length).toBeGreaterThan(5);
      expect(k.definition.length).toBeGreaterThan(10);
    }
  });
});

describe('Datenbasis', () => {
  it('ohne Einträge: keine Daten statt Null', () => {
    const b = datenbasis(leer, '2026-11-11');
    expect(b).toMatchObject({ tage: 0, abfragen: 0, lernzeiten: 0, karten: 0 });
    expect(b.ersterTag).toBeUndefined();
    expect(zeitraumText(b, datum)).toBe('noch keine Einträge');
    expect(kleineBasis(b)?.lang).toMatch(/noch keine Daten/);
  });

  it('Selbsteinschätzung zählt nicht, Lernzeit ohne Minuten auch nicht', () => {
    const b = datenbasis({
      studyLogs: [{ topicId: 't1', date: '2026-11-10', minutes: 0 }],
      reviewLogs: [{ topicId: 't1', date: '2026-11-10', source: 'selbsteinschaetzung', rating: 4 }],
      kartenLogs: [],
    }, '2026-11-11');
    expect(b.abfragen).toBe(0);
    expect(b.lernzeiten).toBe(0);
  });

  it('nennt Zeitraum ab dem ersten Eintrag und erklärt kleine Datenbasis', () => {
    const b = datenbasis({ ...leer, reviewLogs: [abfrage('2026-11-09'), abfrage('2026-11-10')] }, '2026-11-11');
    expect(b).toMatchObject({ ersterTag: '2026-11-09', tage: 3, abfragen: 2, abfrageTage: 2 });
    expect(zeitraumText(b, datum)).toBe('seit 09.11.2026 (3 Tage)');
    const k = kleineBasis(b)!;
    expect(k.kurz).toContain('erst 2 Abfragen');
    expect(k.kurz).toContain('Daten über erst 3 Tage');
    expect(k.lang).toMatch(/vorläufig/);
  });

  it('reicht die Basis, gibt es keinen Hinweis', () => {
    const tage = Array.from({ length: GRENZEN.tage + 2 }, (_, i) => `2026-10-${String(10 + i).padStart(2, '0')}`);
    const b = datenbasis({ ...leer, reviewLogs: tage.map((d) => abfrage(d)) }, '2026-11-11');
    expect(b.abfragen).toBeGreaterThanOrEqual(GRENZEN.abfragen);
    expect(kleineBasis(b)).toBeUndefined();
  });

  it('viele Abfragen an einem Tag bleiben vorläufig', () => {
    const b = datenbasis({ ...leer, studyLogs: [{ topicId: 't1', date: '2026-10-01', minutes: 20 }], reviewLogs: Array.from({ length: 12 }, () => abfrage('2026-11-10')) }, '2026-11-11');
    expect(kleineBasis(b)?.kurz).toContain('Abfragen an erst einem Tag');
  });

  it('Wochen vor dem ersten Eintrag gelten als ohne Daten', () => {
    const b = datenbasis({ ...leer, kartenLogs: [{ date: '2026-11-04', rating: 3 }] }, '2026-11-11');
    expect(wochenOhneDaten(b, ['2026-10-25', '2026-11-01', '2026-11-08', '2026-11-11'])).toBe(2);
    expect(wochenOhneDaten(datenbasis(leer, '2026-11-11'), ['2026-11-01'])).toBe(1);
  });
});
