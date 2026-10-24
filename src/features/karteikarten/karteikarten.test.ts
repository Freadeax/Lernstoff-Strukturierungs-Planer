import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import type { Summary } from '../../core/types';
import { pflegeModule } from '../../modules/pflege';
import { ratingFromScore } from '../lernplan/fsrs';
import { ausFragenSatz, ausGlossar, ausKatalog, ausZusammenfassung, definitionsBegriff, modulKarten, pruefeEingabe } from './erzeugen';
import {
  bewerte, einstreuen, ergebnisseJeThema, prognose, stelleSitzungZusammen, vorschau, wiedereinreihen,
} from './planung';
import type { Karte, KartenStand } from './typen';
import { STANDARD_CONFIG } from './typen';
import type { FragenSatz } from '../zusammenfasser/typen';

const karte = (id: string, topicIds = ['t1']): Karte => ({ id, quelle: 'eigen', art: '', vorne: id, hinten: id, topicIds, subjectIds: [] });

describe('FSRS je Karte', () => {
  it('plant eine neue, gut gewusste Karte in ein paar Tagen ein und verlängert danach', () => {
    const s1 = bewerte(undefined, 'k', 3, '2026-10-24', 0.9);
    expect(s1.reps).toBe(1);
    expect(s1.erstmals).toBe('2026-10-24');
    expect(s1.due > '2026-10-24').toBe(true);
    const s2 = bewerte(s1, 'k', 3, s1.due, 0.9);
    expect(s2.stability).toBeGreaterThan(s1.stability);
    expect(s2.due > s1.due).toBe(true);
    expect(s2.erstmals).toBe('2026-10-24');
  });

  it('zählt Vergessen nach einer erfolgreichen Abfrage als Lapse und holt die Karte bald zurück', () => {
    const s1 = bewerte(undefined, 'k', 4, '2026-10-01', 0.9);
    const s2 = bewerte(s1, 'k', 1, s1.due, 0.9);
    expect(s2.lapses).toBe(1);
    expect(s2.stability).toBeLessThan(s1.stability);
  });

  it('beschriftet die Knöpfe aufsteigend und nie mit weniger als einem Tag', () => {
    const v = vorschau(undefined, '2026-10-24', 0.9);
    expect(v[1]).toBeGreaterThanOrEqual(1);
    expect(v[1]).toBeLessThanOrEqual(v[2]);
    expect(v[2]).toBeLessThanOrEqual(v[3]);
    expect(v[3]).toBeLessThan(v[4]);
  });

  it('übersteht eine zurückgestellte Uhr', () => {
    const s1 = bewerte(undefined, 'k', 3, '2026-10-24', 0.9);
    expect(() => bewerte(s1, 'k', 3, '2026-10-20', 0.9)).not.toThrow();
  });
});

describe('Sitzung', () => {
  const heute = '2026-10-24';
  const stand = (cardId: string, due: string, stability = 3): KartenStand => ({ cardId, stability, difficulty: 5, lastReview: '2026-10-20', due, reps: 1, lapses: 0, erstmals: '2026-10-20' });

  it('nimmt fällige zuerst, die am stärksten vergessene vorne, und neue nur bis zum Tageslimit', () => {
    const karten = ['a', 'b', 'c', 'n1', 'n2', 'n3', 'z'].map((id) => karte(id));
    const staende = new Map([
      ['a', stand('a', '2026-10-23', 10)], ['b', stand('b', '2026-10-22', 1)], ['c', stand('c', '2026-10-24', 5)],
      ['z', stand('z', '2026-11-30')],
    ]);
    const s = stelleSitzungZusammen(karten, staende, { heute, config: { neueProTag: 3, sitzungsGroesse: 40 }, neueHeuteSchon: 1 });
    expect(s.faellig).toBe(3);
    expect(s.neu).toBe(2);
    expect(s.karten.map((k) => k.id)).toEqual(['b', 'c', 'a', 'n1', 'n2']);
  });

  it('lässt ausgesetzte Karten weg und zieht auf Wunsch Karten vor, wenn nichts fällig ist', () => {
    const karten = [karte('a'), karte('b')];
    const staende = new Map([['a', { ...stand('a', '2026-10-01'), ausgesetzt: true }], ['b', stand('b', '2026-11-01')]]);
    expect(stelleSitzungZusammen(karten, staende, { heute, config: STANDARD_CONFIG, neueHeuteSchon: 0 }).karten).toEqual([]);
    const v = stelleSitzungZusammen(karten, staende, { heute, config: STANDARD_CONFIG, neueHeuteSchon: 0, vorziehen: true });
    expect(v.karten.map((k) => k.id)).toEqual(['b']);
    expect(v.vorgezogen).toBe(1);
  });

  it('filtert nach Thema und hebt dabei das Tageslimit für neue Karten auf', () => {
    const karten = [karte('a', ['t1']), karte('b', ['t2']), karte('c', ['t2'])];
    const s = stelleSitzungZusammen(karten, new Map(), { heute, config: { neueProTag: 0, sitzungsGroesse: 40 }, neueHeuteSchon: 0, themen: ['t2'] });
    expect(s.karten.map((k) => k.id)).toEqual(['b', 'c']);
  });

  it('streut neue Karten ein und reiht vergessene Karten kurz danach wieder ein', () => {
    expect(einstreuen<number | string>([1, 2, 3, 4, 5, 6, 7], ['a', 'b', 'c'])).toEqual([1, 2, 3, 'a', 4, 5, 6, 'b', 7, 'c']);
    expect(wiedereinreihen(['x', 'y', 'z', 'w'], 'k')).toEqual(['x', 'y', 'z', 'k', 'w']);
    expect(wiedereinreihen(['x'], 'k')).toEqual(['x', 'k']);
  });

  it('zeigt die fälligen Karten der nächsten Tage, Überfälliges zählt für heute', () => {
    const p = prognose([stand('a', '2026-10-20'), stand('b', '2026-10-25'), stand('c', '2026-12-01')], heute, 3);
    expect(p.map((x) => x.anzahl)).toEqual([1, 1, 0]);
  });
});

describe('Ergebnis an den Lernplan', () => {
  it('meldet je Thema ab drei Karten, nur die erste Antwort je Karte zählt', () => {
    const e = ergebnisseJeThema([
      { cardId: 'a', rating: 1, topicIds: ['t1'] },
      { cardId: 'a', rating: 4, topicIds: ['t1'] },
      { cardId: 'b', rating: 3, topicIds: ['t1', 't2'] },
      { cardId: 'c', rating: 4, topicIds: ['t1'] },
      { cardId: 'd', rating: 3, topicIds: ['t2'] },
    ]);
    expect(e).toEqual([{ topicId: 't1', karten: 3, scorePercent: 62 }]);
    expect(ratingFromScore(62)).toBe(2);
  });

  it('übersetzt durchgehend „Gut“ in „Gut“ und „Leicht“ in „Leicht“', () => {
    const gut = ergebnisseJeThema(['a', 'b', 'c'].map((cardId) => ({ cardId, rating: 3 as const, topicIds: ['t'] })));
    const leicht = ergebnisseJeThema(['a', 'b', 'c'].map((cardId) => ({ cardId, rating: 4 as const, topicIds: ['t'] })));
    expect(ratingFromScore(gut[0]!.scorePercent)).toBe(3);
    expect(ratingFromScore(leicht[0]!.scorePercent)).toBe(4);
  });

  it('lässt unbekannte Themen weg', () => {
    const e = ergebnisseJeThema(['a', 'b', 'c'].map((cardId) => ({ cardId, rating: 3 as const, topicIds: ['x'] })), new Set(['t']));
    expect(e).toEqual([]);
  });
});

describe('Karten aus dem Fachmodul Pflege', () => {
  it('baut aus jedem Glossareintrag eine Karte mit stabiler ID und Fach', () => {
    const k = ausGlossar(pflegeModule, ['vorwaerts']);
    expect(k).toHaveLength(pflegeModule.glossary.length);
    expect(new Set(k.map((x) => x.id)).size).toBe(k.length);
    const myokard = k.find((x) => x.id === 'gl:gl.myokard')!;
    expect(myokard.hinten).toMatch(/Herzmuskelschicht/);
    expect(myokard.subjectIds).toEqual(['fach.anatomie']);
  });

  it('verrät bei Rückwärtskarten den Begriff nicht und akzeptiert Synonyme', () => {
    const k = ausGlossar(pflegeModule, ['rueckwaerts']).find((x) => x.id === 'glr:gl.perikard')!;
    expect(k.vorne).not.toMatch(/Herzbeutel|Perikard/);
    expect(k.eingabe).toBe(true);
    expect(pruefeEingabe('perikard', k)).toBe('richtig');
    expect(pruefeEingabe('Herzbeutel', k)).toBe('richtig');
    expect(pruefeEingabe('Perikad', k)).toBe('tippfehler');
    expect(pruefeEingabe('Pleura', k)).toBe('falsch');
    expect(pruefeEingabe('  ', k)).toBe('leer');
  });

  it('nimmt Abkürzungen ernst: HZV → Herzzeitvolumen, Eingabe der Abkürzung zählt', () => {
    const abk = ausGlossar(pflegeModule, ['abkuerzung']).find((x) => x.id === 'gla:gl.herzzeitvolumen')!;
    expect(abk).toMatchObject({ vorne: 'HZV', hinten: 'Herzzeitvolumen' });
    const r = ausGlossar(pflegeModule, ['rueckwaerts']).find((x) => x.id === 'glr:gl.herzzeitvolumen')!;
    expect(pruefeEingabe('HZV', r)).toBe('richtig');
    expect(pruefeEingabe('Herzzeitvolumen', r)).toBe('richtig');
  });

  it('macht Katalogkarten für Assessments, Aufgabenformate und Operatoren', () => {
    const k = ausKatalog(pflegeModule);
    const pesr = k.find((x) => x.id === 'kat:format.pesr')!;
    expect(pesr.liste?.[0]).toMatch(/^P: Problem/);
    expect(k.some((x) => x.id === 'kat:op.nennen')).toBe(true);
    expect(k.every((x) => x.vorne && (x.hinten || x.liste?.length))).toBe(true);
  });

  it('filtert nach Fach, fachlose Karten bleiben', () => {
    const alle = modulKarten(pflegeModule, { faecher: [], richtungen: ['vorwaerts'], katalog: true });
    const nurAp = modulKarten(pflegeModule, { faecher: ['fach.anatomie'], richtungen: ['vorwaerts'], katalog: true });
    expect(nurAp.length).toBeLessThan(alle.length);
    expect(nurAp.every((k) => !k.subjectIds.length || k.subjectIds.includes('fach.anatomie'))).toBe(true);
    expect(nurAp.some((k) => k.id === 'kat:op.nennen')).toBe(true);
  });
});

describe('Karten aus eigenem Material', () => {
  const summary: Summary = {
    id: 's1', mode: 'lernen', length: 'mittel', topicIds: ['thema.ap.herz'], sourceDocumentIds: ['d1'], createdAt: '2026-10-24T08:00:00Z', needsReview: false,
    blocks: [
      { id: 'b0', type: 'ueberschrift', title: 'Herz', claimIds: [], children: ['b1'] },
      { id: 'b1', type: 'liste', title: 'Erregungsleitung', claimIds: ['c1', 'c2', 'c3'] },
    ],
    rootBlockIds: ['b0'],
    claims: [
      { id: 'c1', text: 'Der Sinusknoten ist der primäre Schrittmacher.', citations: [{ chunkId: 'k1', documentId: 'd1', page: 12, quote: 'Sinusknoten' }], status: 'belegt', isSupplementary: false, kind: 'definition', blockId: 'b1' },
      { id: 'c2', text: 'Der AV-Knoten verzögert die Erregung.', citations: [{ chunkId: 'k1', documentId: 'd1', page: 12, quote: 'AV' }], status: 'belegt', isSupplementary: false, kind: 'fakt', blockId: 'b1' },
      { id: 'c3', text: 'Hier fehlt im Skript die Seite.', citations: [], status: 'fehlt', isSupplementary: false, kind: 'fehlt', blockId: 'b1' },
    ],
  };

  it('macht je Abschnitt eine Karte mit Pfad und Belegen, Lücken bleiben draußen', () => {
    const k = ausZusammenfassung(summary, () => ['fach.anatomie']);
    const abschnitt = k.find((x) => x.id === 'sum:s1:b1')!;
    expect(abschnitt.vorne).toBe('Herz › Erregungsleitung: Was sind die Kernaussagen?');
    expect(abschnitt.liste).toEqual(['Der Sinusknoten ist der primäre Schrittmacher.', 'Der AV-Knoten verzögert die Erregung.']);
    expect(abschnitt.belege).toEqual([{ documentId: 'd1', page: 12, printedPage: undefined, quote: 'Sinusknoten' }]);
    expect(abschnitt.subjectIds).toEqual(['fach.anatomie']);
    expect(k.find((x) => x.id === 'def:s1:c1')?.vorne).toBe('Was ist Sinusknoten?');
  });

  it('erkennt Definitionsbegriffe', () => {
    expect(definitionsBegriff('Unter Dekubitus versteht man eine lokal begrenzte Schädigung.')).toBe('Dekubitus');
    expect(definitionsBegriff('Die Pneumonie ist eine Entzündung des Lungengewebes.')).toBe('Pneumonie');
    expect(definitionsBegriff('Bei Fieber, Schüttelfrost und Husten ist an eine Pneumonie zu denken.')).toBeUndefined();
  });

  it('macht aus Prüfungsfragen Karten mit Musterlösung', () => {
    const satz = {
      ...summary, id: 'p1', mode: 'pruefung', claims: [], pruefungName: 'Klausur', verworfen: 0,
      fragen: [{ id: 'f1', typ: 'mc_einfach', topicId: 'thema.ap.herz', operator: 'nennen', schwierigkeit: 1, frage: 'Wo liegt der Sinusknoten?', optionen: [{ text: 'Rechter Vorhof', richtig: true, begruendung: 'So steht es im Skript.' }, { text: 'Linke Kammer', richtig: false, begruendung: 'Nein.' }], musterloesung: 'Im rechten Vorhof.', bewertungskriterien: [], belege: [{ chunkId: 'k1', zitat: 'rechter Vorhof' }] }],
    } as unknown as FragenSatz;
    const [k] = ausFragenSatz(satz, new Map([['k1', { id: 'k1', documentId: 'd1', page: 3, text: '' }]]));
    expect(k!.vorne).toMatch(/A\) Rechter Vorhof\nB\) Linke Kammer/);
    expect(k!.hinten).toBe('Im rechten Vorhof.');
    expect(k!.belege).toEqual([{ documentId: 'd1', page: 3, printedPage: undefined, quote: 'rechter Vorhof' }]);
  });
});

describe('Datenbank-Version 5', () => {
  it('verbucht Antworten und meldet Themen an den Lernplan', async () => {
    const { db } = await import('../../core/db');
    const { antworte, schliesseSitzungAb } = await import('./store');
    const k = karte('eigen:1', ['thema.ap.herz']);
    const s = await antworte(k, 3, 0.9, '2026-10-24');
    expect(await db.kartenStand.get('eigen:1')).toEqual(s);
    expect(await db.kartenLogs.count()).toBe(1);
    const topic = pflegeModule.topics.find((t) => t.id === 'thema.ap.herz')!;
    const e = await schliesseSitzungAb(['a', 'b', 'c'].map((cardId) => ({ cardId, rating: 4 as const, topicIds: [topic.id] })), new Map([[topic.id, topic]]), '2026-10-24');
    expect(e).toEqual([{ topicId: topic.id, karten: 3, scorePercent: 100 }]);
    const logs = await db.reviewLogs.toArray();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ topicId: topic.id, source: 'karteikarten', scorePercent: 100, date: '2026-10-24' });
  });
});
