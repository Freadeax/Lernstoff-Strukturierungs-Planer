import { describe, expect, it } from 'vitest';
import { BERICHT_FAELLE } from './faelle';
import { markiere, ohneZitate, pruefeBericht, sprachpruefung } from './pruefung';

const fall = (id: string) => BERICHT_FAELLE.find((f) => f.id === id)!;
const woerter = (text: string, art?: string) => sprachpruefung(text).filter((f) => !art || f.art === art).map((f) => f.wort);

describe('Musterberichte', () => {
  for (const f of BERICHT_FAELLE) {
    it(`${f.id}: Muster erfüllt alle Kernpunkte, ohne Sprachfunde`, () => {
      const e = pruefeBericht(f, f.muster);
      expect(e.bausteine.flatMap((b) => b.punkte).filter((p) => !p.ok).map((p) => p.punkt.id)).toEqual([]);
      expect(e.funde).toEqual([]);
      expect(e.prozent).toBe(100);
      expect(e.hinweise).toEqual([]);
    });
    if (f.vorlage) {
      it(`${f.id}: schlechte Vorlage fällt durch`, () => {
        const e = pruefeBericht(f, f.vorlage!);
        expect(e.wertfrei).toBe(false);
        expect(e.prozent).toBeLessThan(40);
      });
    }
    it(`${f.id}: Kernpunkt-IDs eindeutig`, () => {
      expect(new Set(f.kernpunkte.map((k) => k.id)).size).toBe(f.kernpunkte.length);
    });
  }
});

describe('Sprachprüfung', () => {
  it('findet Wertungen mit Endungen, aber nicht Sturz oder faulig', () => {
    expect(woerter('Sie war aggressive und sture Bewohnerin, verweigert das Essen.', 'wertend')).toEqual(['aggressive', 'sture', 'verweigert']);
    expect(woerter('Nach dem Sturz riecht die Wunde faulig.')).toEqual([]);
  });
  it('findet Vages und Vermutungen', () => {
    expect(woerter('Hat wahrscheinlich gut geschlafen, isst wenig.')).toEqual(['wahrscheinlich', 'gut', 'wenig']);
    expect(woerter('Vitalzeichen o. B., wie immer.', 'vage')).toEqual(['o. B.', 'wie immer']);
  });
  it('lässt wörtliche Rede aus', () => {
    expect(woerter('Sie sagt: „Das Essen ist schlecht, ich bin doch nicht stur.“')).toEqual([]);
    expect(ohneZitate('a „bc“ d')).toBe('a      d'.slice(0, 'a „bc“ d'.length));
  });
  it('markiert in Stücken', () => {
    const t = 'Er ist stur und isst wenig.';
    const teile = markiere(t, sprachpruefung(t));
    expect(teile.map((x) => x.text).join('')).toBe(t);
    expect(teile.filter((x) => x.fund).map((x) => x.text)).toEqual(['stur', 'wenig']);
  });
  it('leerer Text', () => {
    const e = pruefeBericht(fall('nacht'), '  ');
    expect(e.prozent).toBe(0);
    expect(e.wertfrei).toBe(false);
  });
});

describe('leseRueckmeldung', async () => {
  const { leseRueckmeldung } = await import('./claude');
  it('füllt fehlende Felder auf und begrenzt die Note', () => {
    const r = leseRueckmeldung('Antwort: {"note": 9, "umformulieren": [{"vorher": "stur", "nachher": "lehnt ab"}, {"vorher": 1}]}');
    expect(r.note).toBe(6);
    expect(r.umformulieren).toEqual([{ vorher: 'stur', nachher: 'lehnt ab' }]);
    expect(r.fehlt).toEqual([]);
    expect(() => leseRueckmeldung('kein json')).toThrow();
  });
});

describe('Lernplan-Verknüpfung', async () => {
  const { uebungenFuer } = await import('../lernplan/trainer');
  it('Pflegebericht-Thema führt zum Trainer', () => {
    expect(uebungenFuer('thema.pp.evaluation').map((u) => u.path)).toContain('/lernen/bericht');
  });
});
