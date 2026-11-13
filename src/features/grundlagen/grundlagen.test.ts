import { describe, expect, it } from 'vitest';
import { pruefeAufgaben, stufeVon } from '../quiz/quiz';
import { ALLE_AUFGABEN, AUFGABEN, BEREICHE, BEREICH_ZU_THEMA } from './aufgaben';
import { modules } from '../../modules/registry';
import { uebungenFuer } from '../lernplan/trainer';
import { TRAINER_POOLS } from '../simulation/trainerpool';
import type { CatalogModule } from '../../modules/catalog-types';

const modul = modules[0] as CatalogModule;
const themen = new Set(modul.topics.map((t) => t.id));

describe('Grundlagen-Trainer', () => {
  it('Aufgaben ohne Baufehler, nur bekannte Themen', () => {
    expect(pruefeAufgaben(ALLE_AUFGABEN, themen)).toEqual([]);
  });

  it('jeder Bereich hat Aufgaben aller drei Stufen, jedes Thema mindestens drei Aufgaben', () => {
    for (const b of BEREICHE) {
      const stufen = new Set(AUFGABEN[b.id].map(stufeVon));
      expect([...stufen].sort(), b.id).toEqual([1, 2, 3]);
    }
    for (const thema of Object.keys(BEREICH_ZU_THEMA)) {
      expect(ALLE_AUFGABEN.filter((a) => a.topicIds.includes(thema)).length, thema).toBeGreaterThanOrEqual(3);
    }
  });

  it('der Lernplan führt jedes Thema in seinen Bereich', () => {
    for (const [thema, bereich] of Object.entries(BEREICH_ZU_THEMA)) {
      expect(uebungenFuer(thema).map((u) => u.path), thema).toContain(`/lernen/grundlagen?bereich=${bereich}`);
    }
  });

  it('ist Fragenquelle der Prüfungssimulation', () => {
    expect(TRAINER_POOLS.find((p) => p.quelle === 'grundlagen')?.aufgaben.length).toBe(ALLE_AUFGABEN.length);
  });
});
