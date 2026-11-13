import { describe, expect, it } from 'vitest';
import type { Topic } from '../../core/types';
import type { TopicProgress } from '../lernplan/progress';
import { filtereBlaetter, summiere, anteil, pfadZu, liegtUnter, elternIds } from '../../ui/baum/baum';
import { baueThemenbaum, blaetter, naechstesThema, passtFilter, standText } from './themenbaum';
import { umhaengenVerboten } from './pflege';

const t = (id: string, parentId?: string, subjectId = 'f1'): Topic => ({ id, name: id.toUpperCase(), subjectId, parentId, prerequisites: [] });
const topics = [t('b1'), t('a', 'b1'), t('b', 'b1'), t('b2'), t('c', 'b2'), t('thema.eigen.x', 'b2'), t('d', undefined, 'f2')];
const p = (topicId: string, status: TopicProgress['status'], extra: Partial<TopicProgress> = {}): TopicProgress =>
  ({ topicId, status, studiedMinutes: 0, remainingStudyMinutes: 0, testCount: status === 'offen' ? 0 : 1, reasons: [], ...extra });

const baum = baueThemenbaum({
  subjects: [{ id: 'f1', name: 'Fach eins', code: 'CE01' }, { id: 'f2', name: 'Fach zwei' }, { id: 'leer', name: 'Leer' }],
  topics,
  progress: new Map([['a', p('a', 'sicher', { nextReview: '2026-12-01' })], ['b', p('b', 'unsicher', { nextReview: '2026-11-01' })], ['c', p('c', 'offen')]]),
  board: new Map([['c', 'arbeit' as const]]),
  heute: '2026-11-13',
});

describe('Themenbaum', () => {
  it('gliedert Fach › Bereich › Thema und lässt leere Fächer weg', () => {
    expect(baum.map((k) => k.label)).toEqual(['CE01 · Fach eins', 'Fach zwei']);
    expect(baum[0]!.kinder!.map((k) => k.id)).toEqual(['b1', 'b2']);
    expect(baum[0]!.kinder![1]!.kinder!.map((k) => k.id)).toEqual(['c', 'thema.eigen.x']);
  });

  it('summiert den Wissensstand je Bereich und Fach', () => {
    const fach = summiere(baum[0]!);
    expect(Object.fromEntries(fach.map((s) => [s.key, s.wert]))).toEqual({ sicher: 1, unsicher: 1, bearbeitet: 0, offen: 2 });
    expect(anteil(fach, 'sicher')).toBe(25);
    expect(standText(summiere(baum[0]!.kinder![0]!), baum[0]!.kinder![0]!)).toBe('1/2 sicher');
  });

  it('markiert fällige Wiederholungen und Arbeitsstand', () => {
    const b = blaetter(baum).find((k) => k.id === 'b')!;
    expect(b.hinweis).toContain('fällig');
    expect(blaetter(baum).find((k) => k.id === 'c')!.hinweis).toBe('in Arbeit');
    expect(passtFilter(b, 'faellig')).toBe(true);
    expect(passtFilter(blaetter(baum).find((k) => k.id === 'a')!, 'faellig')).toBe(false);
  });

  it('filtert Blätter und behält die Oberthemen samt Gesamtsumme', () => {
    const nurOffen = filtereBlaetter(baum, (k) => passtFilter(k, 'offen'));
    expect(blaetter(nurOffen).map((k) => k.id)).toEqual(['c', 'thema.eigen.x', 'd']);
    expect(summiere(nurOffen[0]!).find((s) => s.key === 'sicher')!.wert).toBe(1);
  });

  it('schlägt zuerst „In Arbeit“, dann Fälliges vor', () => {
    expect(naechstesThema(baum)!.knoten.id).toBe('c');
    const ohneArbeit = baueThemenbaum({ subjects: [{ id: 'f1', name: 'F' }], topics, progress: new Map([['b', p('b', 'unsicher', { nextReview: '2026-11-01' })]]), board: new Map(), heute: '2026-11-13' });
    expect(naechstesThema(ohneArbeit)!.knoten.id).toBe('b');
  });

  it('findet Pfade und verhindert Ablegen unter sich selbst', () => {
    expect(pfadZu(baum, 'c')).toEqual(['fach:f1', 'b2']);
    expect(liegtUnter(baum, 'b2', 'c')).toBe(true);
    expect(liegtUnter(baum, 'b1', 'c')).toBe(false);
    expect(elternIds(baum)).toEqual(['fach:f1', 'b1', 'b2', 'fach:f2']);
  });
});

describe('Eigene Themen umhängen', () => {
  const eigen = t('thema.eigen.x', 'b2');
  const alle = [...topics, t('thema.eigen.y', 'thema.eigen.x')];
  it('erlaubt Bereiche desselben Fachs und die oberste Ebene', () => {
    expect(umhaengenVerboten(eigen, 'b1', alle)).toBeUndefined();
    expect(umhaengenVerboten(eigen, undefined, alle)).toBeUndefined();
  });
  it('verbietet Katalogthemen, fremde Fächer, Kreise und einzelne Katalogthemen als Ziel', () => {
    expect(umhaengenVerboten(t('a', 'b1'), 'b2', alle)).toMatch(/Katalog/);
    expect(umhaengenVerboten(eigen, 'd', alle)).toMatch(/Fach/);
    expect(umhaengenVerboten(eigen, 'thema.eigen.y', alle)).toMatch(/selbst/);
    expect(umhaengenVerboten(eigen, 'a', alle)).toMatch(/einzelnes/);
    expect(umhaengenVerboten(eigen, 'b2', alle)).toMatch(/schon/);
  });
});
