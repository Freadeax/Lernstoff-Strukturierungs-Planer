import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db, deleteAll } from '../../../core/db';
import type { Topic } from '../../../core/types';
import { bucheErgebnis, buchungsText, pruefeErgebnis, type Lernergebnis } from '../ergebnis';
import { evidenceRating } from '../fsrs';
import { computeProgress } from '../progress';
import { DEFAULT_SETTINGS } from '../types';

const topics: Topic[] = [
  { id: 'a', subjectId: 's', name: 'Anatomie', prerequisites: [] },
  { id: 'a.herz', subjectId: 's', parentId: 'a', name: 'Herz', prerequisites: [] },
  { id: 'a.lunge', subjectId: 's', parentId: 'a', name: 'Lunge', prerequisites: [] },
];
const TAG = '2026-11-11';
const basis = (over: Partial<Lernergebnis> = {}): Lernergebnis => ({
  versuchId: 'diagnostik:sepsis:1', herkunft: { modul: 'diagnostik', ref: 'sepsis', kriterien: [{ id: 'sbar', erfuellt: true }] },
  status: 'abgeschlossen', aussagekraft: 'anwendung', ergebnisse: [{ topicId: 'a.herz', scorePercent: 80, anzahl: 5 }], date: TAG, ...over,
});

describe('Einheitliches Ergebnisformat', () => {
  beforeEach(async () => { await deleteAll(); });

  it('bucht einen Versuch je Thema genau einmal, auch beim Wiederöffnen', async () => {
    const a = await bucheErgebnis(basis(), topics);
    const b = await bucheErgebnis(basis(), topics);
    expect(a.map((x) => [x.status, x.zaehlt])).toEqual([['gespeichert', true]]);
    expect(b.map((x) => [x.status, x.zaehlt])).toEqual([['schon_gebucht', false]]);
    const logs = await db.reviewLogs.toArray();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ versuchId: 'diagnostik:sepsis:1', trainer: 'diagnostik', source: 'trainer', status: 'abgeschlossen', aussagekraft: 'anwendung', herkunft: { ref: 'sepsis' } });
  });

  it('zwei Tabs gleichzeitig buchen denselben Versuch nur einmal', async () => {
    await Promise.all([bucheErgebnis(basis(), topics), bucheErgebnis(basis(), topics)]);
    expect(await db.reviewLogs.count()).toBe(1);
  });

  it('offener Versuch zählt nicht und wird beim Abschluss aktualisiert statt verdoppelt', async () => {
    const offen = await bucheErgebnis(basis({ status: 'offen', ergebnisse: [{ topicId: 'a.herz', scorePercent: 40, anzahl: 2 }] }), topics);
    expect(offen[0]!.zaehlt).toBe(false);
    expect(evidenceRating((await db.reviewLogs.toArray())[0]!)).toBeUndefined();
    const fertig = await bucheErgebnis(basis(), topics);
    expect(fertig[0]!.status).toBe('aktualisiert');
    const logs = await db.reviewLogs.toArray();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ status: 'abgeschlossen', scorePercent: 80 });
    expect(evidenceRating(logs[0]!)).toBe(3);
  });

  it('abgebrochen und Übung werden protokolliert, zählen aber nicht im Wissensstand', async () => {
    await bucheErgebnis(basis({ versuchId: 'x:1', status: 'abgebrochen' }), topics);
    await bucheErgebnis(basis({ versuchId: 'x:2', aussagekraft: 'uebung' }), topics);
    const logs = await db.reviewLogs.toArray();
    expect(logs).toHaveLength(2);
    const p = computeProgress(topics[1]!, [], logs, TAG, DEFAULT_SETTINGS);
    expect(p.testCount).toBe(0);
  });

  it('zweiter Versuch desselben Moduls am selben Tag wird zur Übung', async () => {
    await bucheErgebnis(basis(), topics);
    const zwei = await bucheErgebnis(basis({ versuchId: 'diagnostik:sepsis:2', ergebnisse: [{ topicId: 'a.herz', scorePercent: 100, anzahl: 5 }] }), topics);
    expect(zwei[0]).toMatchObject({ status: 'als_uebung', zaehlt: false });
    expect(buchungsText(zwei)).toMatch(/als Übung protokolliert/);
    const p = computeProgress(topics[1]!, [], await db.reviewLogs.toArray(), TAG, DEFAULT_SETTINGS);
    expect(p.testCount).toBe(1);
  });

  it('Oberthemen und unbekannte Themen fallen weg, Eingaben werden geprüft', async () => {
    const r = await bucheErgebnis(basis({ ergebnisse: [{ topicId: 'a', scorePercent: 50, anzahl: 1 }, { topicId: 'zz', scorePercent: 50, anzahl: 1 }] }), topics);
    expect(r.map((x) => x.status)).toEqual(['kein_thema', 'kein_thema']);
    expect(pruefeErgebnis(basis({ versuchId: '' }))).toMatch(/versuchId/);
    expect(pruefeErgebnis(basis({ ergebnisse: [{ topicId: 'a.herz', scorePercent: 120, anzahl: 1 }] }))).toMatch(/Prozent/);
    await expect(bucheErgebnis(basis({ herkunft: { modul: '' } }), topics)).rejects.toThrow(/Herkunft/);
  });
});
