import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../lernplan/types';
import { empfehlungen, type EmpfehlungsEingabe } from './empfehlung';
import {
  brauchtSerienErinnerung, bereichsStand, meilensteine, neueMeilensteine, rueckblickText, standardZiele,
  wissensVerlauf, wochenrueckblick, type Serie,
} from './statistik';

const thema = (id: string) => ({ id, subjectId: 's', name: `Thema ${id}`, prerequisites: [] });
const quiz = (topicId: string, date: string, rating: 1 | 2 | 3 | 4) => ({ topicId, date, source: 'quiz' as const, rating });

describe('Wissensverlauf', () => {
  it('zählt den Status je Wochenende, sicher kommt erst mit Abfragen', () => {
    const study = [{ topicId: 'a', date: '2026-10-01', minutes: 600 }];
    const reviews = [quiz('a', '2026-10-12', 4), quiz('a', '2026-10-26', 4)];
    const v = wissensVerlauf({ leaves: [thema('a'), thema('b')], studyLogs: study, reviewLogs: reviews, settings: DEFAULT_SETTINGS }, '2026-11-01', 6);
    expect(v).toHaveLength(6);
    expect(v[0]!.ende).toBe('2026-09-27');
    expect(v[0]!.zahl).toMatchObject({ offen: 2 });
    expect(v[5]!).toMatchObject({ ende: '2026-11-01', zahl: { sicher: 1, offen: 1 } });
    expect(v[4]!.zahl.sicher).toBe(0);
  });

  it('laufende Woche endet heute, nicht am Sonntag', () => {
    const v = wissensVerlauf({ leaves: [], studyLogs: [], reviewLogs: [], settings: DEFAULT_SETTINGS }, '2026-10-28', 2);
    expect(v.map((p) => p.ende)).toEqual(['2026-10-25', '2026-10-28']);
  });
});

describe('Erinnerung und Meilenstein-Meldungen', () => {
  const s = (x: Partial<Serie>): Serie => ({ aktuell: 4, laengste: 4, heuteAktiv: false, heuteRuhetag: false, gefaehrdet: true, ...x });
  it('erinnert nur nachmittags, einmal am Tag, ab zwei Tagen Serie', () => {
    expect(brauchtSerienErinnerung(s({}), '2026-11-01', 17, undefined)).toBe(true);
    expect(brauchtSerienErinnerung(s({}), '2026-11-01', 9, undefined)).toBe(false);
    expect(brauchtSerienErinnerung(s({}), '2026-11-01', 17, '2026-11-01')).toBe(false);
    expect(brauchtSerienErinnerung(s({ aktuell: 1 }), '2026-11-01', 17, undefined)).toBe(false);
    expect(brauchtSerienErinnerung(s({ gefaehrdet: false }), '2026-11-01', 20, '2026-10-31')).toBe(false);
  });

  it('meldet nur neu erreichte Meilensteine', () => {
    const liste = meilensteine({ laengsteSerie: 3, minutenGesamt: 0, abfragenGesamt: 1, kartenGesamt: 0, sicher: 0, themenGesamt: 10, bereicheBegonnen: 0, wochenMitZiel: 0 });
    expect(neueMeilensteine(liste, ['abfrage-1']).map((m) => m.id)).toEqual(['serie-3']);
  });
});

describe('Rückblick als Text', () => {
  it('enthält Zeitraum, Sätze, Ziele und Themen', () => {
    const study = [{ topicId: 'a', date: '2026-10-27', minutes: 45 }];
    const reviews = [quiz('a', '2026-10-28', 1)];
    const r = wochenrueckblick({ studyLogs: study, reviewLogs: reviews, kartenLogs: [] }, { leaves: [thema('a')], studyLogs: study, reviewLogs: reviews, settings: DEFAULT_SETTINGS }, '2026-10-26', '2026-11-01', standardZiele());
    const t = rueckblickText(r, (id) => `Thema ${id}`);
    expect(t.split('\n')[0]).toBe('Lernwoche 26.10.2026 bis 01.11.2026');
    expect(t).toContain('- Lernzeit: 45 von');
    expect(t).toContain('Meiste Lernzeit:\n- Thema a (45 Min.)');
    expect(t).toContain('Noch schwierig:\n- Thema a (1 von 1 nicht gelöst)');
  });
});

describe('Nächster Schritt', () => {
  const basis = (x: Partial<EmpfehlungsEingabe> = {}): EmpfehlungsEingabe => ({
    today: '2026-11-01', status: new Map(), name: (id) => `Thema ${id}`, reviewLogs: [], ce: [], exams: [], ziele: [],
    uebung: () => undefined, ceVonPruefung: (id) => (id.startsWith('ce-pruefung:') ? id.slice(12) : undefined), ...x,
  });

  it('ohne Daten: eine kleine Runde', () => {
    expect(empfehlungen(basis()).map((e) => e.id)).toEqual(['start']);
  });

  it('fällige Wiederholungen zuerst, dann schwierige Themen mit passender Übung', () => {
    const e = empfehlungen(basis({
      status: new Map([['a', { status: 'unsicher', nextReview: '2026-10-30' }], ['b', { status: 'sicher', nextReview: '2026-11-20' }]]),
      reviewLogs: [quiz('c', '2026-10-25', 1), quiz('c', '2026-10-30', 2), quiz('d', '2026-10-31', 1), quiz('d', '2026-11-01', 4), quiz('e', '2026-10-01', 1)],
      uebung: (id) => (id === 'c' ? { label: 'Fachbegriff-Duell', path: '/lernen/duell' } : undefined),
    }));
    expect(e.map((x) => x.id)).toEqual(['wiederholen', 'schwierig']);
    expect(e[0]!.grund).toContain('Thema a');
    expect(e[1]).toMatchObject({ titel: 'Thema c gezielt üben', pfad: '/lernen/duell' });
  });

  it('CE mit der nächsten Prüfung vor der schwächsten CE; Wochenziel im Rückstand', () => {
    const ce = bereichsStand([
      { id: 'ce.01', code: 'CE 01', name: 'Eins', topicIds: ['a', 'b'] },
      { id: 'ce.05', code: 'CE 05', name: 'Fünf', topicIds: ['c'] },
    ], (id) => (id === 'a' ? 'bearbeitet' : 'offen'));
    const e = empfehlungen(basis({
      ce,
      exams: [{ id: 'ce-pruefung:ce.05', name: 'CE 05', date: '2026-11-10', subjectIds: [], topicIds: ['c'] }],
      ziele: [{ id: 'karten', label: 'Karteikarten', ist: 10, soll: 70, anteil: 10 / 70, erreicht: false, einheit: '' }],
    }));
    expect(e.map((x) => x.id)).toEqual(['ce', 'ziel']);
    expect(e[0]).toMatchObject({ titel: 'CE 05 vorbereiten', pfad: '/lernen/ce?ce=ce.05' });
    expect(e[0]!.grund).toContain('in 9 Tagen');
    expect(e[1]!.titel).toBe('Noch 60 Karteikarten diese Woche');
    // ohne Prüfung: die schwächste begonnene CE
    expect(empfehlungen(basis({ ce }))[0]!.titel).toBe('CE 01 weiterführen');
  });
});
