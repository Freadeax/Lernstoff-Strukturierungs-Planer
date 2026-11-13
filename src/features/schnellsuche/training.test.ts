import { describe, expect, it } from 'vitest';
import { STANDARDS } from '../dnqp/standards';
import { pruefeAufgaben } from '../quiz/quiz';
import { trainingsAufgaben, verdecke } from './training';
import { lernzettel } from './lernzettel';
import type { SuchDok } from './suchkern';

describe('Kriterien-Training', () => {
  const alle = trainingsAufgaben(STANDARDS, { typen: ['zuordnen', 'ebene', 'irrtum'] });

  it('erzeugt gültige, eindeutige Aufgaben aus allen Standards', () => {
    expect(alle.length).toBeGreaterThan(300);
    expect(new Set(alle.map((a) => a.id)).size).toBe(alle.length);
    expect(pruefeAufgaben(alle)).toEqual([]);
    for (const a of alle) {
      expect(new Set(a.optionen).size, a.id).toBe(a.optionen.length);
      expect(a.topicIds).toContain('thema.qw.expertenstandards');
    }
  });
  it('verdeckt den Standardnamen in der Zuordnungsfrage', () => {
    const sturz = STANDARDS.find((s) => s.id === 'es.sturz')!;
    expect(verdecke('Das Sturzrisiko wird eingeschätzt.', sturz)).toBe('Das … wird eingeschätzt.');
    for (const a of alle.filter((x) => x.id.startsWith('sus.zuordnen.es.sturz'))) expect(a.frage).not.toMatch(/sturz/i);
  });
  it('filtert nach Standard und Typ', () => {
    const nur = trainingsAufgaben(STANDARDS, { standardId: 'es.schmerz', typen: ['irrtum'] });
    expect(nur.length).toBe(STANDARDS.find((s) => s.id === 'es.schmerz')!.fehlvorstellungen.length);
    expect(nur.every((a) => a.id.startsWith('sus.irrtum.es.schmerz'))).toBe(true);
  });
});

describe('Lernzettel', () => {
  it('gruppiert die Merkliste nach Standard und nennt Ebene und Details', () => {
    const doks: SuchDok[] = [
      { id: 'a', art: 'kriterium', titel: 'P1 · Einschätzung', text: 'Schätzt das Risiko ein.', standardIds: ['es.sturz'], ebene: 'P', kriterium: 1, details: [{ label: 'Ergebnis (E1)', text: 'Einschätzung liegt vor.' }] },
      { id: 'b', art: 'instrument', titel: 'Braden-Skala', text: 'Dekubitusrisiko.', standardIds: ['es.dekubitus'] },
    ];
    const z = lernzettel(doks, (id) => ({ 'es.sturz': 'Sturzprophylaxe', 'es.dekubitus': 'Dekubitusprophylaxe' })[id] ?? id, new Date(2026, 10, 13));
    expect(z).toContain('Lernzettel Standards (13.11.2026)');
    expect(z).toContain('## Sturzprophylaxe\n- [Prozess P1] P1 · Einschätzung');
    expect(z).toContain('  Ergebnis (E1): Einschätzung liegt vor.');
    expect(z).toContain('## Dekubitusprophylaxe\n- [Instrument] Braden-Skala');
  });
});
