import { describe, expect, it } from 'vitest';
import { pflegeModule } from '../../modules/pflege';
import { DEFAULT_SETTINGS, type Availability } from '../lernplan/types';
import {
  bereichsStand, gesamtWerte, kalenderWochen, kompetenzBereiche, meilensteine, serie, standardZiele, stufe,
  tageswerte, woche, wochenMitAllenZielen, wochenrueckblick, wochenStart, wochenZiele, zieleAufloesen, type Fakten,
} from './statistik';

const leer: Fakten = { studyLogs: [], reviewLogs: [], kartenLogs: [] };
const lernen = (date: string, minutes = 30, topicId = 't1') => ({ topicId, date, minutes });
const abfrage = (date: string, rating: 1 | 2 | 3 | 4, topicId = 't1', trainer?: string) => ({ topicId, date, source: 'quiz' as const, rating, ...(trainer ? { trainer } : {}) });
// Sonntag frei, sonst eine Stunde
const avSonntagFrei: Availability = { minutesByWeekday: [0, 60, 60, 60, 60, 60, 60], exceptions: {} };

describe('Tageswerte', () => {
  it('zählt Lernzeit, echte Abfragen und Karteikarten, Selbsteinschätzung nicht', () => {
    const f: Fakten = {
      studyLogs: [lernen('2026-10-26', 20), lernen('2026-10-26', 15)],
      reviewLogs: [abfrage('2026-10-26', 3), abfrage('2026-10-26', 1), { topicId: 't1', date: '2026-10-27', source: 'selbsteinschaetzung', rating: 4 }],
      kartenLogs: [{ date: '2026-10-28', rating: 3 }],
    };
    const [mo, di, mi] = tageswerte(f, '2026-10-26', '2026-10-28');
    expect(mo).toMatchObject({ minuten: 35, abfragen: 2, erfolgreich: 1, aktiv: true });
    expect(di).toMatchObject({ abfragen: 0, aktiv: false });
    expect(mi).toMatchObject({ karten: 1, aktiv: true });
  });

  it('Wochen beginnen am Montag', () => {
    expect(wochenStart('2026-11-01')).toBe('2026-10-26'); // Sonntag
    expect(wochenStart('2026-10-26')).toBe('2026-10-26');
    expect(wochenStart('2026-10-29')).toBe('2026-10-26');
  });
});

describe('Lernserie', () => {
  it('ohne Daten keine Serie', () => {
    expect(serie(leer, '2026-11-01')).toMatchObject({ aktuell: 0, laengste: 0, gefaehrdet: false });
  });

  it('ein noch leerer heutiger Tag beendet die Serie nicht, ist aber gefährdet', () => {
    const f = { ...leer, studyLogs: [lernen('2026-10-28'), lernen('2026-10-29'), lernen('2026-10-30')] };
    expect(serie(f, '2026-10-31')).toMatchObject({ aktuell: 3, laengste: 3, heuteAktiv: false, gefaehrdet: true });
    expect(serie(f, '2026-10-30')).toMatchObject({ aktuell: 3, heuteAktiv: true, gefaehrdet: false });
  });

  it('ein verpasster Tag beendet die Serie, die längste bleibt', () => {
    const f = { ...leer, studyLogs: ['2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-25', '2026-10-26'].map((d) => lernen(d)) };
    expect(serie(f, '2026-10-26')).toMatchObject({ aktuell: 2, laengste: 4 });
  });

  it('Ruhetage laut Lernplan unterbrechen nicht und zählen nicht mit', () => {
    // Sa 31.10. gelernt, So 01.11. frei, Mo 02.11. gelernt
    const f = { ...leer, availability: avSonntagFrei, studyLogs: [lernen('2026-10-30'), lernen('2026-10-31'), lernen('2026-11-02')] };
    expect(serie(f, '2026-11-02').aktuell).toBe(3);
    expect(serie(f, '2026-11-01')).toMatchObject({ aktuell: 2, heuteRuhetag: true, gefaehrdet: false });
    // Ausnahme mit 0 Minuten (z. B. Nachtdienst) wirkt genauso
    const g = { ...leer, availability: { ...avSonntagFrei, exceptions: { '2026-10-28': 0 } }, studyLogs: [lernen('2026-10-27'), lernen('2026-10-29')] };
    expect(serie(g, '2026-10-29').aktuell).toBe(2);
  });

  it('Karteikarten allein machen einen Lerntag', () => {
    const f = { ...leer, kartenLogs: [{ date: '2026-10-31', rating: 3 }, { date: '2026-11-01', rating: 1 }] };
    expect(serie(f, '2026-11-01').aktuell).toBe(2);
  });
});

describe('Ziele', () => {
  it('Vorschlag aus verfügbarer Zeit, eigene Werte überschreiben, Unsinn fällt weg', () => {
    const z = standardZiele(avSonntagFrei);
    expect(z.minutenProWoche).toBe(300); // 360 * 0,8 = 288 → auf 30 gerundet
    expect(z.aktiveTage).toBe(5);
    const e = zieleAufloesen({ abfragen: 25, karten: -3, aktiveTage: 9, minutenProWoche: 'viel', sichereThemen: 40 }, avSonntagFrei);
    expect(e).toMatchObject({ abfragen: 25, karten: 70, aktiveTage: 5, minutenProWoche: 300, sichereThemen: 40 });
  });

  it('Wochenziele zeigen Stand und erreicht; Ziel 0 fällt weg', () => {
    const f = { ...leer, studyLogs: [lernen('2026-10-26', 200), lernen('2026-10-27', 120)], kartenLogs: Array.from({ length: 10 }, () => ({ date: '2026-10-27', rating: 3 })) };
    const zs = wochenZiele(woche(f, '2026-10-26'), { minutenProWoche: 300, aktiveTage: 3, abfragen: 0, karten: 20, sichereThemen: 0 });
    expect(zs.map((z) => z.id)).toEqual(['minutenProWoche', 'aktiveTage', 'karten']);
    expect(zs[0]).toMatchObject({ ist: 320, erreicht: true, anteil: 1 });
    expect(zs[1]).toMatchObject({ ist: 2, erreicht: false });
    expect(zs[2]!.anteil).toBe(0.5);
  });

  it('zählt Wochen, in denen alle Ziele erreicht wurden', () => {
    const f = { ...leer, studyLogs: [lernen('2026-10-19', 60), lernen('2026-10-26', 10)] };
    const z = { minutenProWoche: 60, aktiveTage: 1, abfragen: 0, karten: 0, sichereThemen: 0 };
    expect(wochenMitAllenZielen(f, z, '2026-11-01')).toBe(1);
  });
});

describe('Wochenrückblick', () => {
  const topics = [
    { id: 't1', subjectId: 's', name: 'Thema 1', prerequisites: [] },
    { id: 't2', subjectId: 's', name: 'Thema 2', prerequisites: [] },
  ];
  it('erkennt neu sichere Themen, schwierige Themen und Herkunft der Abfragen', () => {
    const study = [lernen('2026-10-01', 600, 't1'), lernen('2026-10-27', 40, 't2')];
    const reviews = [
      abfrage('2026-10-12', 4), abfrage('2026-10-26', 4, 't1', 'duell'),
      abfrage('2026-10-28', 1, 't2', 'rechnen'), abfrage('2026-10-29', 3, 't2', 'rechnen'),
    ];
    const f: Fakten = { studyLogs: study, reviewLogs: reviews, kartenLogs: [] };
    const r = wochenrueckblick(f, { leaves: topics, studyLogs: study, reviewLogs: reviews, settings: DEFAULT_SETTINGS }, '2026-10-26', '2026-11-01', standardZiele());
    expect(r.woche).toMatchObject({ minuten: 40, abfragen: 3, erfolgreich: 2 });
    expect(r.neuBegonnen).toEqual(['t2']);
    expect(r.schwierig).toEqual([{ topicId: 't2', fehl: 1, gesamt: 2 }]);
    expect(r.quellen).toEqual([{ quelle: 'rechnen', anzahl: 2 }, { quelle: 'duell', anzahl: 1 }]);
    expect(r.meisteZeit).toEqual([{ topicId: 't2', minuten: 40 }]);
    expect(r.saetze[0]).toContain('4 Lerntage');
    // t1: zweite erfolgreiche Abfrage an einem anderen Tag in dieser Woche macht es sicher
    expect(r.neuSicher).toEqual(['t1']);
    expect(r.nichtMehrSicher).toEqual([]);
    expect(r.saetze).toContain('1 Thema neu sicher.');
  });

  it('leere Woche sagt das ehrlich', () => {
    const r = wochenrueckblick(leer, { leaves: topics, studyLogs: [], reviewLogs: [], settings: DEFAULT_SETTINGS }, '2026-10-26', '2026-11-01', standardZiele());
    expect(r.saetze).toEqual(['In dieser Woche ist noch nichts erfasst.']);
  });
});

describe('Bereiche', () => {
  it('Kompetenzbereiche I–V mit Themen aus dem Pflege-Katalog, nur Blätter', () => {
    const kb = kompetenzBereiche(pflegeModule);
    expect(kb.map((b) => b.code)).toEqual(['I', 'II', 'III', 'IV', 'V']);
    const blaetter = new Set(pflegeModule.topics.filter((t) => !pflegeModule.topics.some((k) => k.parentId === t.id)).map((t) => t.id));
    expect(kb.every((b) => b.topicIds.every((id) => blaetter.has(id)))).toBe(true);
    expect(kb.filter((b) => b.topicIds.length > 0).length).toBeGreaterThanOrEqual(4);
  });

  it('erbt die Zuordnung vom Oberthema', () => {
    const modul = {
      topics: [{ id: 'o', competencyIds: ['kb.I.2'] }, { id: 'k', parentId: 'o' }, { id: 'x', competencyIds: ['kb.II'] }],
      frameworks: [{ kind: 'kompetenzen', items: [{ id: 'kb.I', code: 'I', name: 'Eins' }, { id: 'kb.I.2', parentId: 'kb.I', code: 'I.2', name: 'Eins Zwei' }, { id: 'kb.II', code: 'II', name: 'Zwei' }] }],
    };
    expect(kompetenzBereiche(modul)).toEqual([
      { id: 'kb.I', code: 'I', name: 'Eins', topicIds: ['k'] },
      { id: 'kb.II', code: 'II', name: 'Zwei', topicIds: ['x'] },
    ]);
  });

  it('zählt Status je Bereich', () => {
    const [b] = bereichsStand([{ id: 'b', code: 'B', name: 'B', topicIds: ['a', 'b', 'c', 'd'] }], (id) => (id === 'a' ? 'sicher' : id === 'b' ? 'bearbeitet' : 'offen'));
    expect(b).toMatchObject({ gesamt: 4, sicher: 0.25, begonnen: 0.5, zahl: { sicher: 1, bearbeitet: 1, offen: 2, unsicher: 0 } });
  });
});

describe('Meilensteine und Kalender', () => {
  it('Meilensteine aus echten Zahlen, Fortschritt gedeckelt', () => {
    const m = meilensteine({ laengsteSerie: 8, minutenGesamt: 700, abfragenGesamt: 0, kartenGesamt: 150, sicher: 2, themenGesamt: 100, bereicheBegonnen: 0, wochenMitZiel: 0 });
    const by = Object.fromEntries(m.map((x) => [x.id, x]));
    expect(by['serie-7']!.erreicht).toBe(true);
    expect(by['serie-30']).toMatchObject({ erreicht: false, ist: 8 });
    expect(by['zeit-10']!.erreicht).toBe(true);
    expect(by['abfrage-1']!.erreicht).toBe(false);
    expect(by['karten-100']).toMatchObject({ erreicht: true, ist: 100 });
    expect(by['sicher-viertel']!.soll).toBe(25);
  });

  it('Kalender: ganze Wochen Mo–So, Stufen nach Menge', () => {
    const w = kalenderWochen({ ...leer, studyLogs: [lernen('2026-11-01', 90)] }, '2026-11-01', 4);
    expect(w).toHaveLength(4);
    expect(w.every((x) => x.length === 7)).toBe(true);
    expect(w[3]![0]!.date).toBe('2026-10-26');
    expect(stufe(w[3]![6]!)).toBe(4);
    expect(stufe(w[3]![0]!)).toBe(0);
  });

  it('Gesamtwerte über alle Tage seit dem ersten Eintrag', () => {
    const f = { ...leer, studyLogs: [lernen('2015-03-01', 10), lernen('2026-11-01', 20)] };
    expect(gesamtWerte(f, '2026-11-01')).toEqual({ minuten: 30, abfragen: 0, karten: 0, lerntage: 2 });
  });
});
