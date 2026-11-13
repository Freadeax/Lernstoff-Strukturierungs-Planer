import { describe, expect, it } from 'vitest';
import { MAX_VORSCHLAEGE, wochenVorschlag, type WochenThema } from '../wochenVorschlag';

const t = (id: string, p: Partial<WochenThema> = {}): WochenThema => ({ id, name: id.toUpperCase(), column: 'pool', restMinuten: 60, prerequisites: [], ...p });
const exam = (id: string, date: string, topicIds: string[]) => ({ id, name: `Prüfung ${id}`, date, topicIds, subjectIds: [] });

describe('Woche planen', () => {
  it('nimmt nur Pool-Themen, die nicht sicher sind', () => {
    const v = wochenVorschlag([t('a'), t('b', { wissen: 'sicher' }), t('c', { column: 'erarbeitet' })], [], '2026-11-13', 600);
    expect(v.vorschlaege.map((x) => x.id)).toEqual(['a']);
  });

  it('zieht Themen der nächsten Prüfung vor, dann bereite vor solchen mit offenen Voraussetzungen', () => {
    const themen = [t('frei'), t('spaet'), t('bald'), t('vor'), t('nach', { prerequisites: ['vor'] }), t('fertig', { column: 'erarbeitet' }), t('bereit', { prerequisites: ['fertig'] })];
    const exams = [exam('x', '2026-12-20', ['spaet']), exam('y', '2026-11-20', ['bald', 'nach', 'bereit'])];
    const v = wochenVorschlag(themen, exams, '2026-11-13', 10_000);
    expect(v.vorschlaege.map((x) => x.id)).toEqual(['bald', 'bereit', 'nach', 'spaet', 'frei', 'vor']);
    expect(v.vorschlaege.find((x) => x.id === 'nach')!.grund).toContain('erst VOR erarbeiten');
    expect(v.vorschlaege.find((x) => x.id === 'bald')!.grund).toContain('in 7 Tagen');
  });

  it('füllt nur die freie Lernzeit abzüglich „Diese Woche“ und „In Arbeit“', () => {
    const v = wochenVorschlag([t('w', { column: 'woche' }), t('a'), t('b'), t('c')], [], '2026-11-13', 180);
    expect(v.belegt).toBe(60);
    expect(v.vorschlaege).toHaveLength(2);
  });

  it('lässt ein großes Thema allein zu, begrenzt die Anzahl und erklärt leere Fälle', () => {
    expect(wochenVorschlag([t('gross', { restMinuten: 500 })], [], '2026-11-13', 120).vorschlaege).toHaveLength(1);
    const viele = Array.from({ length: 20 }, (_, i) => t(`t${i}`, { restMinuten: 15 }));
    expect(wochenVorschlag(viele, [], '2026-11-13', 10_000).vorschlaege).toHaveLength(MAX_VORSCHLAEGE);
    expect(wochenVorschlag([t('a')], [], '2026-11-13', 0).hinweis).toContain('keine Lernzeit');
    expect(wochenVorschlag([t('a'), t('w', { column: 'arbeit', restMinuten: 300 })], [], '2026-11-13', 120).hinweis).toContain('füllen deine Lernzeit');
  });
});
