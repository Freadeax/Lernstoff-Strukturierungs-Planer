import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db, deleteAll } from '../../../core/db';
import type { Topic } from '../../../core/types';
import { evidenceRating } from '../fsrs';
import { inLernplan, planeUebernahme, proThema, uebungenFuer } from '../trainer';

const topics: Topic[] = [
  { id: 'a', subjectId: 's', name: 'Anatomie', prerequisites: [] },
  { id: 'a.herz', subjectId: 's', parentId: 'a', name: 'Herz', prerequisites: [] },
  { id: 'a.lunge', subjectId: 's', parentId: 'a', name: 'Lunge', prerequisites: [] },
];
const TODAY = '2026-10-26';

describe('Trainer-Ergebnisse je Thema', () => {
  it('fasst Aufgaben je Thema zusammen und lässt Themen mit zu wenigen Aufgaben weg', () => {
    const r = proThema([
      { topicIds: ['a.herz'], punkte: 1, max: 1 },
      { topicIds: ['a.herz'], punkte: 0, max: 1 },
      { topicIds: ['a.herz', 'a.lunge'], punkte: 1, max: 1 },
    ], 2);
    expect(r).toEqual([{ topicId: 'a.herz', scorePercent: 67, anzahl: 3 }]);
  });

  it('zählt ein Thema pro Aufgabe nur einmal und kappt Punkte auf das Maximum', () => {
    expect(proThema([{ topicIds: ['a.herz', 'a.herz'], punkte: 140, max: 100 }])).toEqual([{ topicId: 'a.herz', scorePercent: 100, anzahl: 1 }]);
  });

  it('ignoriert unvollständig oder ungültig bewertete Aufgaben', () => {
    expect(proThema([
      { topicIds: ['a.herz'], punkte: NaN, max: 1 },
      { topicIds: ['a.herz'], punkte: 1, max: Infinity },
      { topicIds: ['a.herz'], punkte: 1, max: 0 },
    ])).toEqual([]);
  });

  it('übernimmt nur lernbare Themen und bei Wiederholung am selben Tag nur den ersten Versuch', () => {
    const plan = planeUebernahme([
      { topicId: 'a', scorePercent: 80, anzahl: 3 },
      { topicId: 'a.herz', scorePercent: 80, anzahl: 3 },
      { topicId: 'a.lunge', scorePercent: 50, anzahl: 3 },
    ], topics, new Set(['a.lunge']));
    expect(plan.map((u) => [u.topicId, u.status])).toEqual([['a', 'kein_thema'], ['a.herz', 'gespeichert'], ['a.lunge', 'heute_schon']]);
  });
});

describe('Trainer-Ergebnisse in der Datenbank', () => {
  beforeEach(async () => { await deleteAll(); });

  it('speichert bei gleichzeitigen Übernahmen nur den ersten Versuch', async () => {
    const result = [{ topicId: 'a.herz', scorePercent: 40, anzahl: 3 }];
    const uebernahmen = await Promise.all([inLernplan('rechnen', result, topics, TODAY), inLernplan('rechnen', result, topics, TODAY)]);
    expect(uebernahmen.flat().map((u) => u.status).sort()).toEqual(['gespeichert', 'heute_schon']);
    expect(await db.reviewLogs.count()).toBe(1);
    expect(await db.activity.count()).toBe(1);
  });

  it('übernimmt doppelte Themen innerhalb einer Übergabe nur einmal', async () => {
    const first = { topicId: 'a.herz', scorePercent: 40, anzahl: 3 };
    const r = await inLernplan('rechnen', [first, { ...first, scorePercent: 100 }], topics, TODAY);
    expect(r.map((u) => u.status)).toEqual(['gespeichert', 'heute_schon']);
    expect((await db.reviewLogs.toArray()).map((l) => l.scorePercent)).toEqual([40]);
  });

  it('lehnt ungültige Übernahmen vollständig ab', async () => {
    await expect(inLernplan('rechnen', [
      { topicId: 'a.herz', scorePercent: 80, anzahl: 3 },
      { topicId: 'a.lunge', scorePercent: NaN, anzahl: 3 },
    ], topics, TODAY)).rejects.toThrow();
    expect(await db.reviewLogs.count()).toBe(0);
  });

  it('speichert Abfragen mit Herkunft, die als Wissensnachweis zählen', async () => {
    const r = await inLernplan('rechnen', [{ topicId: 'a.herz', scorePercent: 90, anzahl: 5 }], topics, TODAY);
    expect(r[0]!.status).toBe('gespeichert');
    const logs = await db.reviewLogs.toArray();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ topicId: 'a.herz', date: TODAY, source: 'trainer', scorePercent: 90, trainer: 'rechnen' });
    expect(evidenceRating(logs[0]!)).toBe(4);
  });

  it('zählt je Trainer, Thema und Tag nur den ersten Versuch, andere Trainer und Tage aber schon', async () => {
    await inLernplan('uebergabe', [{ topicId: 'a.herz', scorePercent: 40, anzahl: 1 }], topics, TODAY);
    const zweiter = await inLernplan('uebergabe', [{ topicId: 'a.herz', scorePercent: 100, anzahl: 1 }], topics, TODAY);
    expect(zweiter[0]!.status).toBe('heute_schon');
    await inLernplan('fall', [{ topicId: 'a.herz', scorePercent: 80, anzahl: 1 }], topics, TODAY);
    await inLernplan('uebergabe', [{ topicId: 'a.herz', scorePercent: 90, anzahl: 1 }], topics, '2026-10-27');
    const logs = await db.reviewLogs.orderBy('id').toArray();
    expect(logs.map((l) => [l.trainer, l.date, l.scorePercent])).toEqual([
      ['uebergabe', TODAY, 40], ['fall', TODAY, 80], ['uebergabe', '2026-10-27', 90],
    ]);
  });
});

describe('Passende Übung zu einem Thema', () => {
  it('schickt Arzneimittel in die Prüfungsrunde des Rechentrainers mit den passenden Aufgabentypen', () => {
    const u = uebungenFuer('thema.ph.medikamente');
    expect(u[0]).toMatchObject({ trainer: 'rechnen', path: '/lernen/rechnen?modus=pruefung&typen=einheiten,dosis,mgkg,prozent' });
  });

  it('kennt Übergabe, Fallsimulator und Duell', () => {
    expect(uebungenFuer('thema.pp.uebergabe').map((u) => u.trainer)).toContain('uebergabe');
    expect(uebungenFuer('thema.pro.sturz').map((u) => u.trainer)).toContain('fall');
    expect(uebungenFuer('thema.fs.abkuerzungen').map((u) => u.trainer)).toContain('duell');
    expect(uebungenFuer('thema.gibtsnicht')).toEqual([]);
  });

  it('kennt den Pflegeplanung-Trainer für Pflegeprozess- und Fallthemen', () => {
    expect(uebungenFuer('thema.pp.ziele').map((u) => u.path)).toContain('/lernen/pflegeplanung');
    expect(uebungenFuer('thema.pro.aspiration').map((u) => u.path)).toContain('/lernen/pflegeplanung?fall=schlaganfall');
  });
});
