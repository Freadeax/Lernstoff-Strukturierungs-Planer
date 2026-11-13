import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TRAINER_POOLS } from '../simulation/trainerpool';
import { modules } from '../../modules/registry';
import type { CatalogModule } from '../../modules/catalog-types';
import type { AuswahlAufgabe, FallAufgabe } from '../quiz/quiz';
import { bewerte } from '../quiz/quiz';
import { TRAINER_REGISTER } from './register';
import { freigabeFehler } from '../../ui/sim/freigabe';
import { abdeckung, aufgabenAnOberthemen, klassifiziere, mitStufe, summiere } from './abdeckung';
import { gesperrteAufgaben, ladeMeldungen, melde, meldeZiel, seitherGeaendert, setzeStatus, uebernimmMeldungen } from './meldungen';
import { analysiere, zaehle, type Statistik } from './statistik';
import { laengenQuote, pruefeAlle, pruefeAufgabe, zaehleRegeln } from './pruefregeln';
import { veralteteQuellen } from './aktualitaet';
import { veralteteSaetze, verwurfQuote } from './ki';
import { ueberarbeitungsliste } from './ueberarbeitung';
import { fingerabdruck } from './fingerabdruck';
import { pruefeRueckmeldung } from '../testphase/testphase';

const modul = modules[0] as CatalogModule;
const POOLS = TRAINER_POOLS.map((p) => ({ ...p, pfad: TRAINER_REGISTER.find((r) => r.quelle === p.quelle)!.pfad }));
const auswahl = (x: Partial<AuswahlAufgabe> = {}): AuswahlAufgabe => ({
  id: 'a1', art: 'auswahl', topicIds: ['thema.x'], titel: 'Titel', frage: 'Welche Maßnahme ist angezeigt?', optionen: ['Eins', 'Zwei', 'Drei', 'Vier'], richtig: [0], mehrfach: false,
  erklaerung: ['Eine ausreichend lange Begründung, die erklärt, warum die Lösung stimmt und die anderen nicht.'], ...x,
});

beforeEach(() => {
  const m = new Map<string, string>();
  vi.stubGlobal('localStorage', { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) });
});

describe('Inhaltsregister und Quellen', () => {
  it('jeder Trainer hat eine vollständige Freigabe mit Quellen und Stand', () => {
    for (const r of TRAINER_REGISTER) expect(freigabeFehler(r.freigabe), r.quelle).toEqual([]);
  });

  it('jede Trainerfrage nennt nach dem Prüfen eine Quelle oder Norm', () => {
    const QUELLE = /^(Quelle|Norm|Normen|Standard|Leitlinie|Referenz)$/;
    for (const p of TRAINER_POOLS) {
      const g = TRAINER_REGISTER.find((r) => r.quelle === p.quelle)!.grundlage;
      for (const a of p.aufgaben) expect(g(a).some((z) => QUELLE.test(z.label)), `${p.quelle}:${a.id}`).toBe(true);
    }
  });

  it('erkennt Quellen mit neuerer Leitlinienfassung (ERC 2021 → 2025)', () => {
    expect(veralteteQuellen([{ titel: 'ERC Guidelines: Basic Life Support', stand: '2021' }])).toHaveLength(1);
    expect(veralteteQuellen([{ titel: 'ERC Guidelines: Basic Life Support', stand: '2025' }])).toHaveLength(0);
    expect(veralteteQuellen([{ titel: 'KRINKO', stand: '2016' }])).toHaveLength(0);
  });
});

describe('Formale Prüfregeln', () => {
  it('findet „alle der genannten“, Verneinung, Längenhinweis, absolute Ablenker und Wortecho', () => {
    const regeln = (x: Partial<AuswahlAufgabe>) => pruefeAufgabe(auswahl(x)).map((b) => b.regel);
    expect(regeln({ optionen: ['Eins', 'Zwei', 'Drei', 'Alle der genannten'] })).toContain('alle-keine');
    expect(regeln({ frage: 'Was tust du nicht?' })).toContain('verneinung');
    expect(regeln({ frage: 'Was tust du NICHT?' })).not.toContain('verneinung');
    expect(regeln({ optionen: ['Eine sehr ausführliche, besonders genaue und vollständige Antwort mit Begründung', 'kurz', 'knapp', 'klein'] })).toContain('laenge');
    expect(regeln({ optionen: ['Lagern', 'Immer sofort', 'Nie mehr', 'Pause'] })).toContain('absolut');
    expect(regeln({ frage: 'Welche Dekubitusprophylaxe?', optionen: ['Dekubitusprophylaxe durch Lagerung', 'Waschen', 'Essen', 'Trinken'] })).toContain('wortecho');
    expect(regeln({ erklaerung: ['Kurz.'] })).toContain('begruendung-knapp');
    expect(regeln({})).toEqual([]);
  });

  it('kein Trainer nutzt „alle/keine der genannten“ (harte Regel)', () => {
    for (const p of TRAINER_POOLS) expect(zaehleRegeln(pruefeAlle(p.aufgaben))['alle-keine'], p.quelle).toBe(0);
  });

  it('Längenquote: Anteil, in dem die Lösung die längste Option ist', () => {
    const q = laengenQuote([auswahl({ optionen: ['lang lang lang', 'a', 'b', 'c'] }), auswahl({ id: 'a2', optionen: ['a', 'lang lang lang', 'b', 'c'] })]);
    expect(q).toMatchObject({ n: 2, laengste: 1, quote: 0.5, zufall: 0.25 });
  });
});

describe('Abdeckung (Curriculum-Mapping)', () => {
  it('klassifiziert Themen nach Lücken', () => {
    expect(klassifiziere(0, { 1: 0, 2: 0, 3: 0 }, 0)).toBe('keine');
    expect(klassifiziere(0, { 1: 0, 2: 0, 3: 0 }, 2)).toBe('nur-uebungen');
    expect(klassifiziere(2, { 1: 1, 2: 1, 3: 0 }, 0)).toBe('duenn');
    expect(klassifiziere(5, { 1: 3, 2: 2, 3: 0 }, 0)).toBe('ohne-transfer');
    expect(klassifiziere(5, { 1: 0, 2: 2, 3: 3 }, 0)).toBe('ohne-grundlagen');
    expect(klassifiziere(5, { 1: 2, 2: 2, 3: 1 }, 0)).toBe('gut');
  });

  it('zählt alle Trainerfragen, die an einem Blatt-Thema hängen', () => {
    const liste = abdeckung(modul, POOLS);
    const s = summiere(liste);
    const blaetter = new Set(liste.map((t) => t.topicId));
    const anBlatt = POOLS.flatMap((p) => p.aufgaben.flatMap((a) => [...new Set(a.topicIds)].filter((t) => blaetter.has(t)))).length;
    expect(s.aufgaben).toBe(anBlatt);
    // Fragen an Oberthemen zählen für kein Blatt; die Liste macht sie sichtbar
    for (const x of aufgabenAnOberthemen(modul, POOLS)) expect(blaetter.has(x.topicId)).toBe(false);
    expect(s.themen).toBeGreaterThan(50);
    expect(s.mitFragen).toBeGreaterThan(30);
    // jedes Thema mit Fragen bietet einen Startlink je Trainer
    for (const t of liste) for (const tr of t.trainer) expect(tr.pfad.startsWith('/lernen/'), `${t.topicId} ${tr.quelle}`).toBe(true);
  });

  it('Stufenfilter wird an den Pfad gehängt', () => {
    expect(mitStufe('/lernen/recht', 3)).toBe('/lernen/recht?stufe=3');
    expect(mitStufe('/lernen/recht?bereich=fem', 1)).toBe('/lernen/recht?bereich=fem&stufe=1');
  });
});

describe('Meldungen', () => {
  it('meldet, ersetzt doppelte offene Meldung derselben Fassung und sperrt „falsch“ für den Lernstand', () => {
    melde({ quelle: 'notfall', aufgabeId: 'bls.frequenz', fp: 'abc', titel: 'T', frage: 'F', grund: 'unklar' });
    melde({ quelle: 'notfall', aufgabeId: 'bls.frequenz', fp: 'abc', titel: 'T', frage: 'F', grund: 'falsch' });
    const l = ladeMeldungen();
    expect(l).toHaveLength(1);
    expect(gesperrteAufgaben(l).has('notfall:bls.frequenz')).toBe(true);
    const erledigt = setzeStatus(l[0]!.id, 'erledigt', 'korrigiert');
    expect(erledigt[0]).toMatchObject({ status: 'erledigt', bearbeitung: 'korrigiert' });
    expect(gesperrteAufgaben(erledigt).size).toBe(0);
  });

  it('gesammelte Meldungen anderer sperren nichts und zählen nicht doppelt', () => {
    const m = { id: 'r-1', quelle: 'recht', aufgabeId: 'x', fp: '', titel: 'T', frage: 'F', grund: 'falsch' as const, erstellt: '2026-11-13', status: 'offen' as const, von: 'Mia' };
    expect(uebernimmMeldungen([m])).toBe(1);
    expect(uebernimmMeldungen([m])).toBe(0);
    expect(gesperrteAufgaben().size).toBe(0);
  });

  it('erkennt „seither geändert“ und ordnet Simulationsfragen ihrem Trainer zu', () => {
    const m = melde({ quelle: 'q', aufgabeId: 'a1', fp: fingerabdruck(auswahl()), titel: 'T', frage: 'F', grund: 'falsch' });
    expect(seitherGeaendert(m, fingerabdruck(auswahl()))).toBe(false);
    expect(seitherGeaendert(m, fingerabdruck(auswahl({ richtig: [1] })))).toBe(true);
    expect(meldeZiel('trainer:notfall:bls.ablauf')).toEqual({ quelle: 'notfall', aufgabeId: 'bls.ablauf' });
    expect(meldeZiel('trainer:notfall:fall.x:2')).toEqual({ quelle: 'notfall', aufgabeId: 'fall.x' });
    expect(meldeZiel('glossar:gl.x')).toEqual({ quelle: 'simulation', aufgabeId: 'glossar:gl.x' });
  });

  it('Rückmeldungs-Code trägt die gemeldete Frage, alte Codes ohne Frage bleiben gültig', () => {
    const basis = { v: 1, id: 'abc12345', art: 'fehler', text: 'Lösung falsch', erstellt: '2026-11-13T10:00:00Z' };
    expect(pruefeRueckmeldung(basis).frage).toBeUndefined();
    const r = pruefeRueckmeldung({ ...basis, frage: { quelle: 'notfall', aufgabeId: 'bls.ablauf', fp: 'abcd1234', titel: 'BLS', frage: 'Reihenfolge?', grund: 'falsch' } });
    expect(r.frage).toMatchObject({ quelle: 'notfall', aufgabeId: 'bls.ablauf', grund: 'falsch' });
    expect(pruefeRueckmeldung({ ...basis, frage: { quelle: 'x' } }).frage).toBeUndefined();
  });
});

describe('Aufgaben-Statistik', () => {
  it('erkennt einen Ablenker, der häufiger gewählt wird als die Lösung (Schlüssel prüfen)', () => {
    const a = auswahl();
    let st: Statistik = {};
    for (let i = 0; i < 6; i++) { const w = i < 4 ? [1] : [0]; st = zaehle(st, 'q:a1', a, { art: 'auswahl', wahl: w }, bewerte(a, { art: 'auswahl', wahl: w }), '2026-11-13'); }
    const an = analysiere(a, st['q:a1']);
    expect(an?.versuche).toBe(6);
    expect(an?.befunde.map((b) => b.art)).toContain('ablenker-staerker');
  });

  it('beginnt bei einer neuen Fassung von vorn und zeigt unter der Mindestzahl nichts', () => {
    const a = auswahl();
    let st: Statistik = {};
    for (let i = 0; i < 6; i++) st = zaehle(st, 'q:a1', a, { art: 'auswahl', wahl: [0] }, bewerte(a, { art: 'auswahl', wahl: [0] }), '2026-11-13');
    const neu = auswahl({ frage: 'Geänderte Frage?' });
    expect(analysiere(neu, st['q:a1'])).toBeNull();
    st = zaehle(st, 'q:a1', neu, { art: 'auswahl', wahl: [0] }, bewerte(neu, { art: 'auswahl', wahl: [0] }), '2026-11-14');
    expect(st['q:a1']!.versuche).toBe(1);
  });

  it('zählt Fälle über den Anteil richtiger Schritte', () => {
    const f: FallAufgabe = { id: 'f', art: 'fall', topicIds: ['t'], titel: 'Fall', frage: 'F', einstieg: 'E', erklaerung: ['x'], schritte: [
      { lage: 'L1', frage: 'F1', optionen: ['a', 'b'], richtig: [0], mehrfach: false, warum: 'w' },
      { lage: 'L2 mit neuer Lage', frage: 'F2', optionen: ['a', 'b'], richtig: [1], mehrfach: false, warum: 'w' },
    ] };
    const st = zaehle({}, 'q:f', f, { art: 'fall', wahl: [[0], [0]] }, bewerte(f, { art: 'fall', wahl: [[0], [0]] }), '2026-11-13');
    expect(st['q:f']).toMatchObject({ versuche: 1, richtig: 0, anteil: 0.5 });
  });
});

describe('KI-Fragensätze und Überarbeitungsliste', () => {
  it('Fragensatz auf ersetzter Dokumentfassung gilt als veraltet', () => {
    const saetze = [{ id: 's', pruefungName: 'CE 05', sourceDocumentIds: ['d1'], createdAt: '2026-11-01', fragen: [{}, {}], verworfen: 1 }];
    expect(veralteteSaetze(saetze, [{ id: 'd1', title: 'Alt' }])).toEqual([]);
    const v = veralteteSaetze(saetze, [{ id: 'd1', title: 'Alt' }, { id: 'd2', title: 'Neu', previousVersionId: 'd1' }, { id: 'd3', title: 'Neuer', previousVersionId: 'd2' }]);
    expect(v[0]?.ersetzt[0]).toMatchObject({ alt: 'd1', neu: 'd3' });
    expect(verwurfQuote(saetze)).toEqual({ erzeugt: 2, verworfen: 1 });
  });

  it('sortiert Meldungen „falsch“ und veraltete Notfall-Leitlinie nach oben', () => {
    const m = melde({ quelle: 'notfall', aufgabeId: 'bls.frequenz', fp: '', titel: 'T', frage: 'F', grund: 'falsch' });
    const liste = ueberarbeitungsliste({ pools: POOLS, register: TRAINER_REGISTER, meldungen: [m], statistik: {}, heute: '2026-11-13' });
    expect(liste[0]?.art).toBe('meldung');
    expect(liste.filter((e) => e.prio === 1).map((e) => e.art)).toContain('quelle');
    expect(liste.some((e) => e.art === 'geaendert')).toBe(false);   // ohne Prüfvermerk gibt es nichts „seit Prüfung“
    expect(new Set(liste.map((e) => e.key)).size).toBe(liste.length);
  });
});
