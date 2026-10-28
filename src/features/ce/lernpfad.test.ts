import { describe, expect, it } from 'vitest';
import { pflegeModule } from '../../modules/pflege';
import type { Karte } from '../karteikarten/typen';
import type { DayPlan } from '../lernplan/scheduler';
import { cePfad, ceWoche, themaPfad, type ThemaFakten } from './lernpfad';
import { ceListe } from './modell';
import { baueCePruefung, ceVonPruefung, cePruefungsId, findeCePruefung, istCePruefung, themenAbgleich } from './pruefung';
import { FRAGEN_JE_THEMA, stelleTestZusammen, testbareThemen, werteAus } from './selbsttest';

const basis = (p: Partial<ThemaFakten> = {}): ThemaFakten => ({
  topicId: 't1', skripte: [], erarbeitet: false, karten: { gesamt: 0, gesehen: 0 }, steckbriefe: [],
  faelle: { anzahl: 0, geuebt: false }, status: 'offen', tests: 0, ...p,
});

describe('Lernpfad je Thema', () => {
  it('ohne Material: nur Lesen und Selbsttest, Lesen ist der nächste Schritt', () => {
    const p = themaPfad(basis({ testZiel: '/lernen/mindmap?thema=t1' }));
    expect(p.schritte.map((s) => s.zustand)).toEqual(['offen', 'entfaellt', 'entfaellt', 'entfaellt', 'offen']);
    expect(p.gesamt).toBe(2);
    expect(p.naechster?.art).toBe('lesen');
    expect(p.naechster?.ziel).toBe('/lernen/skript?thema=t1');
  });

  it('Lesestand aus dem Skript: angefangen, dann erledigt; weiter im angefangenen Skript', () => {
    const halb = themaPfad(basis({ skripte: [{ id: 'a', titel: 'A', abschnitte: 4, gelesen: 4 }, { id: 'b', titel: 'B', abschnitte: 4, gelesen: 1 }] }));
    expect(halb.schritte[0]).toMatchObject({ zustand: 'teilweise', text: '5 von 8 Abschnitten gelesen', ziel: '/lernen/skript?id=b' });
    const ganz = themaPfad(basis({ skripte: [{ id: 'a', titel: 'A', abschnitte: 4, gelesen: 4 }] }));
    expect(ganz.schritte[0]!.zustand).toBe('erledigt');
  });

  it('erfasste Lernzeit zählt als gelesen, wenn kein Lesestand da ist', () => {
    expect(themaPfad(basis({ erarbeitet: true })).schritte[0]!.zustand).toBe('erledigt');
  });

  it('folgt der Reihenfolge Lesen → Karten → Steckbrief → Fall → Selbsttest', () => {
    const f = basis({
      erarbeitet: true,
      karten: { gesamt: 5, gesehen: 5 },
      steckbriefe: [{ id: 'kb1', name: 'Pneumonie', gelesen: false }],
      faelle: { anzahl: 1, geuebt: false, ziel: '/lernen/fall?thema=t1' },
      testZiel: '/x',
    });
    expect(themaPfad(f).naechster?.art).toBe('steckbrief');
    expect(themaPfad({ ...f, steckbriefe: [{ id: 'kb1', name: 'Pneumonie', gelesen: true }] }).naechster?.art).toBe('fall');
    const bisTest = themaPfad({ ...f, steckbriefe: [{ id: 'kb1', name: 'Pneumonie', gelesen: true }], faelle: { anzahl: 1, geuebt: true } });
    expect(bisTest.naechster?.art).toBe('selbsttest');
    expect(bisTest.erledigt).toBe(4);
  });

  it('Selbsttest erst mit „sicher“ erledigt, Abfragen ohne Sicherheit heißen wiederholen', () => {
    expect(themaPfad(basis({ tests: 2, status: 'unsicher', testZiel: '/x' })).schritte[4]!.zustand).toBe('teilweise');
    expect(themaPfad(basis({ tests: 3, status: 'sicher' })).schritte[4]!.zustand).toBe('erledigt');
  });

  it('CE-Pfad: angefangene Themen zuerst fertig machen', () => {
    const neu = themaPfad(basis({ topicId: 'neu', testZiel: '/x' }));
    const angefangen = themaPfad(basis({ topicId: 'halb', erarbeitet: true, testZiel: '/x' }));
    const fertig = themaPfad(basis({ topicId: 'fertig', erarbeitet: true, status: 'sicher', tests: 2 }));
    const c = cePfad([neu, angefangen, fertig]);
    expect(c.weiter?.topicId).toBe('halb');
    expect(c.weiter?.schritt.art).toBe('selbsttest');
    expect(c).toMatchObject({ erledigt: 3, gesamt: 6, fertig: 1 });
    expect(cePfad([fertig]).weiter).toBeUndefined();
  });
});

describe('Wochenplan einer CE', () => {
  it('nimmt sieben Tage ab heute und nur Blöcke der CE-Themen', () => {
    const tag = (date: string, ids: string[]): DayPlan => ({
      date, capacityMinutes: 60, plannedMinutes: 0, pauseMinutes: 0,
      blocks: ids.map((topicId) => ({ kind: 'erarbeiten', topicId, examId: 'e', minutes: 30, label: '' })),
    });
    const days = ['2026-10-28', '2026-10-29', '2026-11-03', '2026-11-04'].map((d) => tag(d, ['a', 'x']));
    const w = ceWoche(days, new Set(['a']), '2026-10-28');
    expect(w.map((d) => d.date)).toEqual(['2026-10-28', '2026-10-29', '2026-11-03']);
    expect(w[0]!.blocks.map((b) => b.topicId)).toEqual(['a']);
    expect(w[0]!.minuten).toBe(30);
  });
});

describe('Prüfungstermin je CE', () => {
  const ce = ceListe(pflegeModule).find((c) => c.id === 'ce.09')!;
  const themen = pflegeModule.topics.filter((t) => ['thema.kl.demenz', 'thema.kl.geriatrie'].includes(t.id));

  it('feste ID, Name aus der CE, alle Themen mit ihren Fächern', () => {
    const e = baueCePruefung(ce, themen, '2026-12-01');
    expect(e.id).toBe(cePruefungsId('ce.09'));
    expect(istCePruefung(e.id)).toBe(true);
    expect(ceVonPruefung(e.id)).toBe('ce.09');
    expect(ceVonPruefung('abc')).toBeUndefined();
    expect(e.name).toBe(`${ce.code} ${ce.name}`);
    expect(e.topicIds.sort()).toEqual(['thema.kl.demenz', 'thema.kl.geriatrie']);
    expect(e.subjectIds.length).toBeGreaterThan(0);
    expect(findeCePruefung([e], 'ce.09')).toBe(e);
    expect(findeCePruefung([e], 'ce.01')).toBeUndefined();
  });

  it('beim Verschieben bleiben Name und Themenauswahl, Abgleich zeigt neue Themen', () => {
    const alt = { ...baueCePruefung(ce, themen.slice(0, 1), '2026-12-01'), name: 'Klausur Demenz' };
    const neu = baueCePruefung(ce, themen, '2026-12-08', alt);
    expect(neu).toMatchObject({ name: 'Klausur Demenz', date: '2026-12-08', topicIds: alt.topicIds });
    expect(themenAbgleich(neu, themen.map((t) => t.id)).fehlen).toHaveLength(1);
    const gesetzt = baueCePruefung(ce, themen, '2026-12-08', alt, true);
    expect(themenAbgleich(gesetzt, themen.map((t) => t.id))).toEqual({ fehlen: [], zuviel: [] });
  });
});

describe('CE-Selbsttest', () => {
  const karte = (id: string, topicIds: string[]): Karte => ({ id, quelle: 'eigen', art: 'Frage', vorne: id, hinten: '', topicIds, subjectIds: [] });
  const karten = [
    ...['a1', 'a2', 'a3', 'a4'].map((id) => karte(id, ['A'])),
    ...['b1', 'b2', 'b3'].map((id) => karte(id, ['B'])),
    karte('c1', ['C']), karte('c2', ['C']),
    karte('ab', ['A', 'B']),
    karte('fremd1', ['Z']), karte('fremd2', ['Z']), karte('fremd3', ['Z']),
  ];
  let seed = 1;
  const zufall = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

  it('nur Themen der CE mit genug Karten', () => {
    expect([...testbareThemen(karten, ['A', 'B', 'C']).keys()].sort()).toEqual(['A', 'B']);
  });

  it('je Thema drei verschiedene Karten, keine Karte doppelt, unsichere Themen zuerst', () => {
    const f = stelleTestZusammen(karten, ['A', 'B', 'C'], (id) => (id === 'B' ? 'bearbeitet' : 'sicher'), { maxThemen: 1, zufall });
    expect(f).toHaveLength(FRAGEN_JE_THEMA);
    expect(new Set(f.map((x) => x.topicId))).toEqual(new Set(['B']));
    const alle = stelleTestZusammen(karten, ['A', 'B', 'C'], () => 'offen', { zufall });
    expect(alle).toHaveLength(6);
    expect(new Set(alle.map((x) => x.karte.id)).size).toBe(6);
  });

  it('wertet je Thema aus und lässt halbe Tests weg', () => {
    const f = stelleTestZusammen(karten, ['A', 'B'], () => 'offen', { zufall });
    const antworten = f.map((x) => (x.topicId === 'A' ? 'gewusst' as const : 'teilweise' as const));
    const e = werteAus(f, antworten);
    expect(e.find((x) => x.topicId === 'A')?.scorePercent).toBe(100);
    expect(e.find((x) => x.topicId === 'B')?.scorePercent).toBe(50);
    expect(werteAus(f, antworten.slice(0, 2)).length).toBeLessThan(2);
  });

  it('gezielter Test zu einem Thema', () => {
    const f = stelleTestZusammen(karten, ['A', 'B'], () => 'offen', { nurThema: 'A', zufall });
    expect(f.every((x) => x.topicId === 'A')).toBe(true);
  });
});
