import { describe, expect, it } from 'vitest';
import { pruefeAufgaben } from '../quiz/quiz';
import { modules } from '../../modules/registry';
import type { CatalogModule } from '../../modules/catalog-types';
import { uebungenFuer } from '../lernplan/trainer';
import { ALLE_AUFGABEN, AUFGABEN, THEMEN } from './aufgaben';

const themen = new Set((modules[0] as CatalogModule).topics.map((t) => t.id));

describe('Labor-Trainer', () => {
  it('Aufgaben sind gültig und hängen an echten Themen', () => {
    expect(pruefeAufgaben(ALLE_AUFGABEN, themen)).toEqual([]);
    for (const t of Object.values(THEMEN)) expect(themen.has(t), t).toBe(true);
    for (const liste of Object.values(AUFGABEN)) expect(liste.length).toBeGreaterThanOrEqual(5);
  });
  it('ist von den Themen aus erreichbar', () => {
    expect(uebungenFuer(THEMEN.entnahme).map((u) => u.path)).toContain('/lernen/labor?bereich=praeanalytik');
    expect(uebungenFuer(THEMEN.atmung).map((u) => u.path)).toContain('/lernen/labor?bereich=bga');
  });
});
