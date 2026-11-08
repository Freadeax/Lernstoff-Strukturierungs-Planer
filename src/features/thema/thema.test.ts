import { describe, expect, it } from 'vitest';
import type { DayPlan } from '../lernplan/scheduler';
import type { KartenStand } from '../karteikarten/typen';
import { pflegeModule } from '../../modules/pflege';
import { ceListe, ceZuThema } from '../ce/modell';
import { NAV, TABS, flatNav, seitenName, uebenGruppen } from '../../ui/shell/nav';
import { heuteAktion, kartenLage, naechsterBlock, type HeuteEingabe } from './thema';

const tag = (date: string, topicIds: string[]): DayPlan => ({
  date, capacityMinutes: 60, plannedMinutes: 30, pauseMinutes: 0,
  blocks: topicIds.map((topicId) => ({ kind: 'erarbeiten', topicId, examId: 'e', minutes: 15, label: 'Erarbeiten' })),
});
const stand = (cardId: string, due: string, ausgesetzt = false): KartenStand => ({ cardId, due, stability: 3, difficulty: 5, lastReview: '2026-11-01', reps: 1, lapses: 0, erstmals: '2026-11-01', ausgesetzt });

describe('Themenseite', () => {
  it('findet den nächsten Block ab heute', () => {
    const days = [tag('2026-11-07', ['a']), tag('2026-11-08', ['b']), tag('2026-11-10', ['a'])];
    expect(naechsterBlock(days, 'a', '2026-11-08')?.date).toBe('2026-11-10');
    expect(naechsterBlock(days, 'c', '2026-11-08')).toBeUndefined();
  });
  it('zählt Karten je Thema ohne ausgesetzte', () => {
    const karten = [{ id: '1', topicIds: ['a'] }, { id: '2', topicIds: ['a'] }, { id: '3', topicIds: ['a', 'b'] }, { id: '4', topicIds: ['a'] }, { id: '5', topicIds: ['b'] }];
    const staende = new Map([['1', stand('1', '2026-11-08')], ['2', stand('2', '2026-11-12')], ['4', stand('4', '2026-11-01', true)]]);
    expect(kartenLage(karten, staende, 'a', '2026-11-08')).toEqual({ gesamt: 3, neu: 1, faellig: 1, naechsteFaelligkeit: '2026-11-12' });
  });
  it('ordnet Themen über Oberthemen einer CE zu', () => {
    const liste = ceListe(pflegeModule);
    const mitCe = pflegeModule.topics.find((t) => ceZuThema(pflegeModule, t.id, liste));
    expect(mitCe).toBeDefined();
    expect(ceZuThema(pflegeModule, 'gibt-es-nicht', liste)).toBeUndefined();
  });
});

const basis: HeuteEingabe = { kartenFaellig: 0, kartenNeu: 0, fehlerFaellig: 0, fallZumThema: false, hatPruefung: true, ersterBesuch: false };

describe('Heute lernen', () => {
  it('beim ersten Besuch keine Aktion (dafür drei Einstiege)', () => {
    expect(heuteAktion({ ...basis, ersterBesuch: true })).toBeUndefined();
  });
  it('Planblock mit Minuten, CE, Wiederholungen und Fallfrage', () => {
    const a = heuteAktion({ ...basis, block: { topicId: 't 1', minutes: 15, kind: 'erarbeiten' }, themaName: 'Neugeborenes', ceCode: 'CE 10', kartenFaellig: 3, fehlerFaellig: 2, fallZumThema: true })!;
    expect(a.titel).toBe('Neugeborenes erarbeiten');
    expect(a.teile).toEqual(['15 Min. CE 10', '5 Wiederholungen', '1 Fallfrage']);
    expect(a.ziel).toBe('/lernen/thema?id=t%201');
  });
  it('ohne Planblock: erst Karten, dann Fehler, dann Prüfung eintragen', () => {
    expect(heuteAktion({ ...basis, kartenNeu: 4 })!.ziel).toBe('/lernen/karten');
    expect(heuteAktion({ ...basis, fehlerFaellig: 1 })!.ziel).toBe('/lernen/fehler');
    expect(heuteAktion({ ...basis, hatPruefung: false })!.ziel).toContain('ansicht=pruefungen');
    expect(heuteAktion(basis)!.ziel).toBe('/lernen/ueben');
  });
});

describe('Navigation', () => {
  it('Handy: vier Ziele plus „Mehr“, alle Pfade existieren im Menü', () => {
    expect(TABS.map((t) => t.label)).toEqual(['Heute', 'Lernplan', 'Material', 'Üben']);
    const pfade = new Set(flatNav(NAV).map((i) => i.path));
    for (const t of TABS) expect(pfade.has(t.path)).toBe(true);
    expect(TABS.find((t) => t.id === 'ueben')!.bereich('/lernen/notfall')).toBe(true);
    expect(TABS.find((t) => t.id === 'material')!.bereich('/material/import')).toBe(true);
  });
  it('„Üben“ in drei Bündel, jedes mit höchstens zehn Einträgen', () => {
    const g = uebenGruppen();
    expect(g.map((x) => x.label)).toEqual(['Fachwissen', 'Praxis', 'Prüfung']);
    for (const x of g) expect(x.children!.length).toBeLessThanOrEqual(10);
  });
  it('Seitentitel auch für die Themenseite', () => {
    expect(seitenName('/lernen/thema')).toBe('Thema');
    expect(seitenName('/lernen/board')).toBe('Mein Themenboard');
  });
});
