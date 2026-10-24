import { describe, expect, it } from 'vitest';
import { FAELLE } from './faelle';
import { findeMuster, gliedere, pruefe, vereinfache } from './pruefung';

const fall = (id: string) => FAELLE.find((f) => f.id === id)!;

describe('vereinfache', () => {
  it('vereinheitlicht Umlaute, Diktat-Zahlen und Blutdruck', () => {
    expect(vereinfache('Temperatur 38 Komma 9, RR 92 zu 55, Hüfte')).toBe('temperatur 38,9, rr 92/55, huefte');
    expect(vereinfache('SpO₂ 93.5')).toBe('spo2 93,5');
  });
});

describe('findeMuster', () => {
  const t = ' puls 118 rr 92/55 temperatur 38,9 145/85 um 14:20 ';
  it('trifft Zahlen nur als ganze Zahl', () => {
    expect(findeMuster(t, ['118'])).toBeGreaterThan(0);
    expect(findeMuster(t, ['18'])).toBe(-1);
    expect(findeMuster(t, ['38'])).toBe(-1);
    expect(findeMuster(t, ['92'])).toBeGreaterThan(0);
    expect(findeMuster(t, ['55'])).toBe(-1);
    expect(findeMuster(t, ['145'])).toBeGreaterThan(0);
    expect(findeMuster(t, ['14:20'])).toBeGreaterThan(0);
  });
  it('verlangt bei „ + “ alle Teile', () => {
    expect(findeMuster(t, ['puls + 118'])).toBeGreaterThan(0);
    expect(findeMuster(t, ['puls + 120'])).toBe(-1);
  });
});

describe('gliedere', () => {
  it('erkennt Kurz- und Langform', () => {
    const g = gliedere(vereinfache('Situation: a\nHintergrund: b\nA: c\nEmpfehlung: d'));
    expect(g.map((x) => x.teil)).toEqual(['S', 'B', 'A', 'R']);
    expect(g[0]!.text.trim()).toBe('a');
  });
  it('ignoriert ein einzelnes „Bitte:“', () => {
    expect(gliedere(vereinfache('Ich rufe an. Bitte: kommen Sie.'))).toEqual([]);
  });
});

describe('Musterübergaben', () => {
  for (const f of FAELLE) {
    it(`${f.id}: Muster erfüllt alle Kernpunkte im richtigen Teil`, () => {
      const e = pruefe(f, f.muster);
      const nichtOk = e.teile.flatMap((t) => t.punkte).filter((p) => p.status !== 'ok').map((p) => `${p.punkt.teil}/${p.punkt.id}: ${p.status}`);
      expect(nichtOk).toEqual([]);
      expect(e.prozent).toBe(100);
      expect(e.gegliedert).toBe(true);
      expect(e.reihenfolgeOk).toBe(true);
    });
    it(`${f.id}: Muster ohne Überschriften wird ebenfalls erkannt`, () => {
      const ohne = f.muster.replace(/^[SBAR]: /gm, '');
      const e = pruefe(f, ohne);
      expect(e.gegliedert).toBe(false);
      expect(e.pflichtFehlend).toEqual([]);
      expect(e.reihenfolgeOk).toBe(true);
    });
  }
  it('Kernpunkte haben eindeutige IDs je Fall', () => {
    for (const f of FAELLE) expect(new Set(f.kernpunkte.map((k) => k.id)).size).toBe(f.kernpunkte.length);
  });
});

describe('pruefe', () => {
  it('leerer Text: nichts erfüllt', () => {
    const e = pruefe(fall('sepsis'), '');
    expect(e.prozent).toBe(0);
    expect(e.teile.every((t) => t.status === 'fehlt')).toBe(true);
  });
  it('markiert Angaben im falschen Teil', () => {
    const e = pruefe(fall('sepsis'), 'S: Hier ist Mara, Herr Berger ist verwirrt. Temperatur 38,9.\nB: Hemikolektomie, Penicillin-Allergie.\nA: Puls 118, RR 92/55, ich vermute eine Sepsis.\nR: Bitte kommen Sie sofort.');
    const temp = e.teile.find((t) => t.teil === 'A')!.punkte.find((p) => p.punkt.id === 'temp')!;
    expect(temp.status).toBe('falscher-teil');
    expect(temp.gefundenIn).toBe('S');
    expect(e.prozent).toBeLessThan(100);
  });
  it('erkennt falsche Reihenfolge', () => {
    const e = pruefe(fall('sepsis'), 'R: Bitte kommen Sie.\nS: Hier ist Mara wegen Herrn Berger.');
    expect(e.reihenfolgeOk).toBe(false);
  });
  it('lange Telefonübergabe bekommt einen Hinweis', () => {
    const e = pruefe(fall('sepsis'), Array(200).fill('wort').join(' '));
    expect(e.hinweise.some((h) => h.includes('unter einer Minute'))).toBe(true);
  });
});

describe('leseRueckmeldung', () => {
  it('liest JSON und füllt fehlende Teile auf', async () => {
    const { leseRueckmeldung } = await import('./claude');
    const r = leseRueckmeldung('```json\n{"note": 2.4, "teile": [{"teil": "S", "bewertung": "vollstaendig", "kommentar": "Klar."}], "staerken": ["knapp"], "fehlt": [], "fehler": [1], "verbessert": "S: …"}\n```');
    expect(r.note).toBe(2);
    expect(r.teile.map((t) => t.bewertung)).toEqual(['vollstaendig', 'fehlt', 'fehlt', 'fehlt']);
    expect(r.fehler).toEqual([]);
    expect(() => leseRueckmeldung('kein json')).toThrow();
  });
});
