import { describe, expect, it } from 'vitest';
import type { Document, SourceChunk } from '../../core/types';
import { pflegeModule } from '../../modules/pflege';
import { normalisiereAufgaben } from './aufgaben';
import { belegGueltig } from './belege';
import { abschnitteAlsText, leseJson } from './ki';
import { bewerteMc, frageGueltig, normalisiereBewertung, pruefungsAnweisung } from './pruefung';
import { filtereAussagen, filtereZeilen } from './vergleich';
import type { Pruefungsfrage } from './typen';

const chunk = (id: string, documentId: string, text: string): SourceChunk => ({ id, documentId, page: 1, printedPage: '12', text });
const chunks = new Map([
  ['k1', chunk('k1', 'a', 'Die Braden-Skala erfasst das Dekubitusrisiko. Ab 18 Punkten besteht ein Risiko.')],
  ['k2', chunk('k2', 'b', 'Die Norton-Skala erfasst das Dekubitusrisiko. Ab 25 Punkten besteht ein Risiko.')],
]);
const doc = (id: string): Document => ({ id, title: `Dok ${id}`, kind: 'pdf', subjectIds: [], topicIds: [], version: 1, contentHash: id, importedAt: '2026-10-01T00:00:00Z' });

describe('Belege aus JSON-Antworten', () => {
  it('prüft Abschnitt, Dokument und wörtliches Zitat', () => {
    expect(belegGueltig({ chunkId: 'k1', zitat: 'Ab 18 Punkten besteht ein Risiko' }, chunks)).toBe(true);
    expect(belegGueltig({ chunkId: 'k1', zitat: 'Die Norton-Skala ist veraltet' }, chunks)).toBe(false);
    expect(belegGueltig({ chunkId: 'k1', zitat: 'Ab 18 Punkten besteht ein Risiko' }, chunks, 'b')).toBe(false);
    expect(belegGueltig({ chunkId: 'k9', zitat: 'x' }, chunks)).toBe(false);
    expect(belegGueltig(null, chunks)).toBe(false);
  });

  it('gibt Abschnitte mit sichtbarer chunkId aus und liest JSON robust', () => {
    const t = abschnitteAlsText([doc('a')], [...chunks.values()]);
    expect(t).toContain('<dokument id="a" titel="Dok a">');
    expect(t).toContain('<abschnitt id="k1" seite="12">');
    expect(t).not.toContain('k2');
    expect(leseJson<{ x: number }>('Hier: {"x": 1} fertig')).toEqual({ x: 1 });
  });
});

describe('Arbeitsauftrag: Aufgaben normalisieren', () => {
  it('macht null zu undefined, verwirft leere Aufgaben und unbekannte Formate', () => {
    const a = normalisiereAufgaben([
      { nr: '1', wortlaut: ' Nennen Sie fünf Risikofaktoren. ', operatoren: ['Nennen'], geforderteAnzahl: 5, bestandteile: [], aufgabenformatId: null, quellenvorgabe: null, fallbezug: null, unsicher: false, unsicherGrund: null },
      { nr: '2', wortlaut: 'PESR', operatoren: [], geforderteAnzahl: null, bestandteile: [], aufgabenformatId: 'format.pesr', quellenvorgabe: 'S. 40', fallbezug: null, unsicher: true, unsicherGrund: 'Wort unleserlich' },
      { nr: '3', wortlaut: 'x', operatoren: [], geforderteAnzahl: 0, bestandteile: [], aufgabenformatId: 'format.gibtesnicht', quellenvorgabe: null, fallbezug: null, unsicher: false, unsicherGrund: null },
      { nr: '', wortlaut: 'ohne Nummer' },
    ], pflegeModule);
    expect(a).toHaveLength(3);
    expect(a[0]).toEqual({ nr: '1', wortlaut: 'Nennen Sie fünf Risikofaktoren.', operatoren: ['nennen'], geforderteAnzahl: 5, bestandteile: [], aufgabenformatId: undefined, quellenvorgabe: undefined, fallbezug: undefined, unsicher: false, unsicherGrund: undefined });
    expect(a[1]).toMatchObject({ aufgabenformatId: 'format.pesr', quellenvorgabe: 'S. 40', unsicher: true });
    expect(a[2]).toMatchObject({ geforderteAnzahl: undefined, aufgabenformatId: undefined });
  });
});

describe('Prüfungsmodus', () => {
  const mc = (optionen: Array<[string, boolean]>, typ: Pruefungsfrage['typ'] = 'mc_einfach') => ({
    typ, operator: 'nennen', schwierigkeit: 1 as const, frage: 'Ab wie vielen Punkten?', musterloesung: '18',
    bewertungskriterien: [{ kriterium: 'Wert', punkte: 2 }], belege: [{ chunkId: 'k1', zitat: 'Ab 18 Punkten besteht ein Risiko' }],
    optionen: optionen.map(([text, richtig]) => ({ text, richtig, begruendung: '' })), pruefungsrelevanzBeleg: null,
  });

  it('verwirft Fragen ohne gültigen Beleg und falsch gebaute MC-Fragen', () => {
    expect(frageGueltig(mc([['18', true], ['20', false], ['25', false], ['10', false]]), chunks)).toBe(true);
    expect(frageGueltig(mc([['18', true], ['20', true], ['25', false], ['10', false]]), chunks)).toBe(false);
    expect(frageGueltig(mc([['18', true], ['20', true], ['25', false], ['10', false]], 'mc_mehrfach'), chunks)).toBe(true);
    expect(frageGueltig(mc([['18', true], ['20', false]]), chunks)).toBe(false);
    expect(frageGueltig({ ...mc([]), typ: 'offen', optionen: null, belege: [{ chunkId: 'k1', zitat: 'erfundenes Zitat ohne Bezug' }] }, chunks)).toBe(false);
    expect(frageGueltig({ ...mc([]), typ: 'offen', optionen: null, belege: [] }, chunks)).toBe(false);
  });

  it('wertet Multiple Choice lokal aus', () => {
    const f = { ...mc([['18', true], ['20', true], ['25', false], ['10', false]], 'mc_mehrfach'), id: 'f', topicId: '', optionen: undefined } as unknown as Pruefungsfrage;
    f.optionen = [{ text: 'a', richtig: true, begruendung: '' }, { text: 'b', richtig: true, begruendung: '' }, { text: 'c', richtig: false, begruendung: '' }, { text: 'd', richtig: false, begruendung: '' }];
    expect(bewerteMc(f, [1, 0])).toEqual({ richtig: true, punkte: 2, max: 2 });
    expect(bewerteMc(f, [0])).toEqual({ richtig: false, punkte: 0, max: 2 });
  });

  it('begrenzt Punkte auf die Kriterien und streicht ungültige Belege', () => {
    const f = { ...mc([]), id: 'f', topicId: '', typ: 'offen', bewertungskriterien: [{ kriterium: 'Skala genannt', punkte: 1 }, { kriterium: 'Grenzwert', punkte: 2 }] } as unknown as Pruefungsfrage;
    const b = normalisiereBewertung({
      punkte_je_kriterium: [{ kriterium: 'Skala genannt', punkte: 5 }, { kriterium: 'Grenzwert', punkte: -1 }], gesamt: 4, fehlt: [], rueckmeldung: 'ok',
      fehler: [
        { art: 'zahl', beschreibung: '20 statt 18', richtig_laut_quelle: { chunkId: 'k1', zitat: 'Ab 18 Punkten besteht ein Risiko' } },
        { art: 'begriff', beschreibung: 'x', richtig_laut_quelle: { chunkId: 'k1', zitat: 'steht nirgends im Text so drin' } },
      ],
    }, f, chunks);
    expect(b.punkte_je_kriterium).toEqual([{ kriterium: 'Skala genannt', punkte: 1, max: 1 }, { kriterium: 'Grenzwert', punkte: 0, max: 2 }]);
    expect(b).toMatchObject({ gesamt: 1, max: 3 });
    expect(b.fehler[0].richtig_laut_quelle).not.toBeNull();
    expect(b.fehler[1].richtig_laut_quelle).toBeNull();
  });

  it('füllt den Prüfungsprompt vollständig', () => {
    const p = pruefungsAnweisung(pflegeModule, { name: 'Klausur LF 4', datum: '2026-11-20', lernziele: '', anzahl: 10, schwacheThemen: '' });
    expect(p).toContain('„Klausur LF 4“ am 2026-11-20');
    expect(p).toContain('etwa 4 offen, 4 Multiple Choice, 2 Fallfragen');
    expect(p).not.toMatch(/\{\{|<!--/);
  });
});

describe('Vergleichsmodus', () => {
  const docs = [doc('a'), doc('b')];
  it('behält nur Aussagen mit Belegen aus dem eigenen Dokument', () => {
    const r = filtereAussagen([
      { documentId: 'a', aussagen: [
        { aussage: 'Braden ab 18', belege: [{ chunkId: 'k1', zitat: 'Ab 18 Punkten besteht ein Risiko' }] },
        { aussage: 'fremd belegt', belege: [{ chunkId: 'k2', zitat: 'Ab 25 Punkten besteht ein Risiko' }] },
      ] },
    ], docs, chunks);
    expect(r).toEqual([{ documentId: 'a', aussagen: [{ aussage: 'Braden ab 18', belege: [{ chunkId: 'k1', zitat: 'Ab 18 Punkten besteht ein Risiko' }] }] }, { documentId: 'b', aussagen: [] }]);
  });

  it('verwirft Unterschiede ohne Belege auf beiden Seiten und ordnet Spalten', () => {
    const r = filtereZeilen([
      { unterthema: 'Grenzwert', art: 'widerspruechlich', erlaeuterung: '', jeQuelle: [
        { documentId: 'b', aussage: 'ab 25', belege: [{ chunkId: 'k2', zitat: 'Ab 25 Punkten besteht ein Risiko' }] },
        { documentId: 'a', aussage: 'ab 18', belege: [{ chunkId: 'k1', zitat: 'Ab 18 Punkten besteht ein Risiko' }] },
      ] },
      { unterthema: 'nur eine Seite', art: 'abweichend', erlaeuterung: '', jeQuelle: [
        { documentId: 'a', aussage: 'ab 18', belege: [{ chunkId: 'k1', zitat: 'Ab 18 Punkten besteht ein Risiko' }] },
        { documentId: 'b', aussage: null, belege: [] },
      ] },
      { unterthema: 'falsch belegt', art: 'uebereinstimmend', erlaeuterung: '', jeQuelle: [
        { documentId: 'a', aussage: 'x', belege: [{ chunkId: 'k1', zitat: 'Ab 18 Punkten besteht ein Risiko' }] },
        { documentId: 'b', aussage: 'y', belege: [{ chunkId: 'k1', zitat: 'Ab 18 Punkten besteht ein Risiko' }] },
      ] },
      { unterthema: 'Ergänzung', art: 'ergaenzend', erlaeuterung: '', jeQuelle: [
        { documentId: 'a', aussage: 'Braden erfasst Risiko', belege: [{ chunkId: 'k1', zitat: 'Die Braden-Skala erfasst das Dekubitusrisiko' }] },
      ] },
    ], docs, chunks);
    expect(r.verworfen).toBe(2);
    expect(r.zeilen.map((z) => z.unterthema)).toEqual(['Grenzwert', 'Ergänzung']);
    expect(r.zeilen[0].jeQuelle.map((q) => q.documentId)).toEqual(['a', 'b']);
    expect(r.zeilen[1].jeQuelle[1]).toEqual({ documentId: 'b', aussage: null, belege: [] });
  });
});
