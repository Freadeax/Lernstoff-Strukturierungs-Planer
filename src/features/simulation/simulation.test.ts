import { describe, expect, it } from 'vitest';
import { pflegeModule } from '../../modules/pflege';
import type { FragenSatz, Pruefungsfrage } from '../zusammenfasser/typen';
import {
  auswerten, empfohleneMinuten, katalog, kompetenzbereiche, lernplanEintraege, materialFragen, note,
  selbstWertung, stelleZusammen, uhr, verteile, werteAus, type Auswahl, type OffeneFrage, type SimFrage, type Wertung,
} from './simulation';

const k = katalog(pflegeModule);
const basis: Auswahl = { quellen: ['glossar', 'rechnen'], kb: [], afb: [], topicIds: [], anzahl: 20, stufe: 2, satzIds: [], seed: 42 };

function frage(p: Partial<Pruefungsfrage> = {}): Pruefungsfrage {
  return {
    id: 'f1', typ: 'offen', topicId: 'thema.pro.dekubitus', operator: 'Begründen', schwierigkeit: 3, frage: 'Begründen Sie …',
    musterloesung: 'Weil …', bewertungskriterien: [{ kriterium: 'Druck', punkte: 2 }, { kriterium: 'Scherkräfte', punkte: 2 }], belege: [{ chunkId: 'c', zitat: 'x' }], ...p,
  };
}
function satz(fragen: Pruefungsfrage[]): FragenSatz {
  return { id: 's1', mode: 'pruefung', length: 'mittel', topicIds: ['thema.pro.dekubitus'], sourceDocumentIds: ['d1'], claims: [], createdAt: '', needsReview: false, pruefungName: 'Klausur', fragen, verworfen: 0 };
}

describe('Katalog', () => {
  it('erbt Kompetenzbereiche von Oberthemen und fasst sie auf die oberste Ebene zusammen', () => {
    expect(kompetenzbereiche(k, 'thema.pro.dekubitus')).toEqual(['kb.I']);          // von thema.pro (kb.I.2)
    expect(kompetenzbereiche(k, 'thema.ph.medikamente')).toEqual(['kb.I', 'kb.III']); // kb.III.2, von thema.ph kb.I.1
    expect(kompetenzbereiche(k, 'thema.kom.ethik')).toEqual(['kb.II', 'kb.IV']);
    expect(kompetenzbereiche(k, 'thema.ap.herz')).toEqual(['kb.I']);                // von thema.ap (kb.I.2)
    expect(kompetenzbereiche(k, 'thema.fs.abkuerzungen')).toEqual(['kb.III']);      // von thema.fs (kb.III.3)
    expect(kompetenzbereiche(k, 'thema.ph.hygiene')).toEqual(['kb.I', 'kb.III']);
    expect(k.operatoren.get('berechnen')?.afb).toBe(2);
  });
});

describe('Zusammenstellung', () => {
  it('ist reproduzierbar, mischt die Quellen und sortiert nach Anforderungsbereich', () => {
    const a = stelleZusammen(k, basis, []);
    const b = stelleZusammen(k, basis, []);
    expect(a.fragen.map((f) => f.id)).toEqual(b.fragen.map((f) => f.id));
    expect(a.fragen).toHaveLength(20);
    expect(a.fragen.filter((f) => f.quelle === 'rechnen')).toHaveLength(10);
    expect(a.fragen.map((f) => f.afb)).toEqual([...a.fragen.map((f) => f.afb)].sort());
    expect(new Set(a.fragen.map((f) => f.id)).size).toBe(20);
  });

  it('filtert nach Kompetenzbereich: Rechnen gehört zu III, Glossarfragen nur aus passenden Themen', () => {
    const z = stelleZusammen(k, { ...basis, kb: ['kb.III'] }, []);
    expect(z.fragen.length).toBeGreaterThan(0);
    for (const f of z.fragen) expect(kompetenzbereiche(k, f.topicId)).toContain('kb.III');
    const ohneIII = stelleZusammen(k, { ...basis, kb: ['kb.II'] }, []);
    expect(ohneIII.fragen.some((f) => f.quelle === 'rechnen')).toBe(false);
  });

  it('filtert nach Anforderungsbereich und Thema', () => {
    expect(stelleZusammen(k, { ...basis, afb: [2] }, []).fragen.every((f) => f.quelle === 'rechnen')).toBe(true);
    const z = stelleZusammen(k, { ...basis, quellen: ['glossar'], topicIds: ['thema.fs'] }, []);
    expect(z.fragen.length).toBe(20);
    expect(z.fragen.every((f) => f.topicId.startsWith('thema.fs'))).toBe(true);
  });

  it('gibt Plätze einer knappen Quelle an die anderen ab', () => {
    expect(verteile(10, [2, 50, 50])).toEqual([2, 4, 4]);
    expect(verteile(10, [0, 3, 0])).toEqual([0, 3, 0]);
    const z = stelleZusammen(k, { ...basis, quellen: ['glossar', 'material'] }, [satz([frage()])]);
    expect(z.fragen.filter((f) => f.quelle === 'material')).toHaveLength(1);
    expect(z.fragen).toHaveLength(20);
  });

  it('übernimmt Materialfragen mit Operator, AFB aus dem Katalog und Punkten aus den Kriterien', () => {
    const [offen, mc] = materialFragen(k, [satz([frage(), frage({
      id: 'f2', typ: 'mc_mehrfach', operator: 'nennen', optionen: [
        { text: 'a', richtig: true, begruendung: '' }, { text: 'b', richtig: false, begruendung: '' },
        { text: 'c', richtig: true, begruendung: '' }, { text: 'd', richtig: false, begruendung: '' }],
      bewertungskriterien: [{ kriterium: 'alle', punkte: 1 }],
    })])]);
    expect(offen).toMatchObject({ art: 'offen', operator: 'begründen', afb: 3, punkte: 4, topicId: 'thema.pro.dekubitus' });
    expect(mc).toMatchObject({ art: 'auswahl', mehrfach: true, richtig: [0, 2], afb: 1 });
  });

  it('empfiehlt eine Dauer in 5-Minuten-Schritten', () => {
    expect(empfohleneMinuten([{ minuten: 1 }, { minuten: 2 }])).toBe(5);
    expect(empfohleneMinuten([{ minuten: 6 }, { minuten: 10 }, { minuten: 1.5 }])).toBe(20);
  });
});

describe('Wertung und Auswertung', () => {
  const [offen, mc] = materialFragen(k, [satz([frage(), frage({
    id: 'f2', typ: 'mc_einfach', topicId: 'thema.ph.medikamente', operator: 'nennen',
    optionen: [{ text: 'a', richtig: false, begruendung: '' }, { text: 'b', richtig: true, begruendung: '' }, { text: 'c', richtig: false, begruendung: '' }, { text: 'd', richtig: false, begruendung: '' }],
    bewertungskriterien: [{ kriterium: 'richtig', punkte: 2 }],
  })])]) as [OffeneFrage, SimFrage];
  const zahl = stelleZusammen(k, { ...basis, quellen: ['rechnen'], anzahl: 1 }, []).fragen[0]!;

  it('wertet Auswahl und Zahlen aus, leere offene Antworten zählen 0, sonst bleibt die Frage offen', () => {
    expect(werteAus(mc, { wahl: [1] })).toMatchObject({ punkte: 2, art: 'auto', richtig: true });
    expect(werteAus(mc, { wahl: [0, 1] })).toMatchObject({ punkte: 0, richtig: false });
    if (zahl.art !== 'zahl') throw new Error('Rechenfrage erwartet');
    expect(werteAus(zahl, { text: String(zahl.loesung).replace('.', ',') })).toMatchObject({ punkte: 2, richtig: true });
    expect(werteAus(zahl, { text: '' })).toMatchObject({ punkte: 0, richtig: false });
    expect(werteAus(offen, { text: '  ' })).toMatchObject({ punkte: 0, art: 'auto' });
    expect(werteAus(offen, { text: 'Druck' }).art).toBe('offen');
    expect(selbstWertung(offen, [1])).toEqual({ punkte: 2, max: 4, art: 'selbst' });
  });

  it('wertet je Thema, Kompetenzbereich und AFB aus und rechnet offene Fragen nicht mit', () => {
    const w: Record<string, Wertung> = { [mc.id]: { punkte: 0, max: 2, art: 'auto' }, [offen.id]: { punkte: 0, max: 4, art: 'offen' } };
    const a = auswerten(k, [offen, mc], w);
    expect(a).toMatchObject({ punkte: 0, max: 2, offen: 1, schwach: ['thema.ph.medikamente'] });
    expect(a.jeKb.map((g) => g.key)).toEqual(['kb.I', 'kb.III']);
    expect(a.jeAfb.find((g) => g.key === '3')).toMatchObject({ offen: 1, max: 0 });
  });

  it('übergibt je Thema ein Ergebnis, Selbstbewertung getrennt als Selbsteinschätzung', () => {
    const w: Record<string, Wertung> = { [mc.id]: { punkte: 2, max: 2, art: 'auto' }, [offen.id]: { punkte: 1, max: 4, art: 'selbst' } };
    expect(lernplanEintraege(k, [offen, mc], w)).toEqual([
      { topicId: 'thema.pro.dekubitus', source: 'selbsteinschaetzung', scorePercent: 25, fragen: 1 },
      { topicId: 'thema.ph.medikamente', source: 'pruefungssimulation', scorePercent: 100, fragen: 1 },
    ]);
  });

  it('Notenschlüssel und Uhr', () => {
    expect([100, 92, 91, 67, 50, 49, 10].map((p) => note(p).note)).toEqual([1, 1, 2, 3, 4, 5, 6]);
    expect(uhr(65_000)).toBe('01:05');
    expect(uhr(2 * 3600_000)).toBe('2:00:00');
    expect(uhr(400)).toBe('00:01');
  });
});
