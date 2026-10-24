import { describe, expect, it } from 'vitest';
import { pflegeModule } from '../../modules/pflege';
import { erzeugeRunde, filtere, karten, maskiere, nacharbeiten, passt, punkte, stand, type FrageArt, type Zug } from './duell';

const alle = karten(pflegeModule);
const ARTEN: FrageArt[] = ['definition', 'abkuerzung', 'begriff'];

describe('maskiere', () => {
  it('blendet Begriff, Abkürzung und Synonyme als ganze Wörter aus', () => {
    expect(maskiere('Dienst der Kassen; früher MDK.', ['Medizinischer Dienst', 'MD', 'MDK'])).toBe('Dienst der Kassen; früher …');
    expect(maskiere('Die Ödemprophylaxe hilft. Ödem!', ['Ödem'])).toBe('Die Ödemprophylaxe hilft. …!');
    expect(maskiere('SMART-Ziele nach smart', ['SMART'])).toBe('…-Ziele nach …');
  });
});

describe('karten aus dem Pflege-Glossar', () => {
  it('übernimmt alle Einträge mit Fach und ohne verratene Lösung', () => {
    expect(alle.length).toBe(pflegeModule.glossary.length);
    for (const k of alle) {
      expect(k.faecher.length, k.id).toBeGreaterThan(0);
      expect(k.definition.toLowerCase(), k.id).not.toMatch(new RegExp(`(?<![\\p{L}])${k.begriff.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}])`, 'u'));
    }
  });

  it('filtert nach Fach', () => {
    const fs = filtere(alle, ['fach.fachsprache']);
    expect(fs.length).toBeGreaterThan(5);
    expect(fs.every((k) => k.faecher.includes('fach.fachsprache'))).toBe(true);
    expect(filtere(alle, [])).toBe(alle);
  });
});

describe('erzeugeRunde', () => {
  it('ist reproduzierbar und ohne doppelte Begriffe', () => {
    const a = erzeugeRunde(alle, alle, ARTEN, 15, 42);
    const b = erzeugeRunde(alle, alle, ARTEN, 15, 42);
    expect(a.map((f) => f.id)).toEqual(b.map((f) => f.id));
    expect(a).toHaveLength(15);
    expect(new Set(a.map((f) => f.karte.id)).size).toBe(15);
  });

  it('hat vier verschiedene Antworten mit genau einer richtigen', () => {
    for (let seed = 1; seed <= 30; seed++) {
      for (const f of erzeugeRunde(alle, alle, ARTEN, 20, seed)) {
        expect(f.optionen).toHaveLength(4);
        expect(new Set(f.optionen).size).toBe(4);
        const soll = f.art === 'begriff' ? f.karte.definition : f.karte.begriff;
        expect(f.optionen[f.richtig]).toBe(soll);
        expect(passt(f.karte, f.art)).toBe(true);
      }
    }
  });

  it('fragt bei Abkürzungen nur Einträge mit Abkürzung', () => {
    const mitAbk = alle.filter((k) => passt(k, 'abkuerzung')).length;
    const r = erzeugeRunde(alle, alle, ['abkuerzung'], alle.length, 7);
    expect(r.length).toBe(mitAbk);
    expect(r.every((f) => f.frage === f.karte.abkuerzung)).toBe(true);
  });

  it('füllt Ablenker bei kleinen Fächern aus dem ganzen Glossar auf', () => {
    const klein = filtere(alle, ['fach.recht']).slice(0, 2);
    const r = erzeugeRunde(alle, klein, ['definition'], 10, 3);
    expect(r).toHaveLength(2);
    expect(r.every((f) => f.optionen.length === 4)).toBe(true);
  });
});

describe('punkte', () => {
  const f = { richtig: 2 };
  it('gibt der schnelleren richtigen Antwort den Bonus', () => {
    expect(punkte(f, [{ wahl: 2, ms: 900 }, { wahl: 2, ms: 1500 }])).toEqual([2, 1]);
    expect(punkte(f, [{ wahl: 2, ms: 1500 }, { wahl: 2, ms: 900 }])).toEqual([1, 2]);
    expect(punkte(f, [{ wahl: 2, ms: 1000 }, { wahl: 2, ms: 1000 }])).toEqual([1, 1]);
  });
  it('wertet falsche und fehlende Antworten mit null', () => {
    expect(punkte(f, [{ wahl: 1, ms: 300 }, { wahl: 2, ms: 4000 }])).toEqual([0, 2]);
    expect(punkte(f, [null, { wahl: 0, ms: 4000 }])).toEqual([0, 0]);
    expect(punkte(f, [{ wahl: 2, ms: 8000 }, null])).toEqual([2, 0]);
  });
  it('summiert den Stand und findet Begriffe zum Nacharbeiten', () => {
    const [q1, q2] = erzeugeRunde(alle, alle, ['definition'], 2, 5);
    const zuege: Zug[] = [
      { frage: q1!, antworten: [{ wahl: q1!.richtig, ms: 1 }, { wahl: q1!.richtig, ms: 2 }], punkte: [2, 1] },
      { frage: q2!, antworten: [null, { wahl: q2!.richtig, ms: 2 }], punkte: [0, 2] },
    ];
    expect(stand(zuege)).toEqual([2, 3]);
    expect(nacharbeiten(zuege).map((z) => z.frage.id)).toEqual([q2!.id]);
  });
});
