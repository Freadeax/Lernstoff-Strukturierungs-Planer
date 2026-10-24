import { describe, expect, it } from 'vitest';
import { bewerte, erzeuge, leseZahl, naechste, runde, TYPEN, zahl, type Stufe } from './aufgaben';

describe('leseZahl', () => {
  it('liest deutsche und englische Schreibweisen', () => {
    expect(leseZahl('2,5')).toBe(2.5);
    expect(leseZahl('2.5')).toBe(2.5);
    expect(leseZahl(' 1.000 ')).toBe(1000);
    expect(leseZahl('1.500,5')).toBe(1500.5);
    expect(leseZahl('0,25 ml')).toBe(0.25);
    expect(leseZahl(',5')).toBe(0.5);
    expect(leseZahl('')).toBeNaN();
    expect(leseZahl('abc')).toBeNaN();
    expect(leseZahl('1,2,3')).toBeNaN();
  });
});

describe('Aufgaben', () => {
  const stufen: Stufe[] = [1, 2, 3];
  for (const { typ } of TYPEN) {
    for (const stufe of stufen) {
      it(`${typ} Stufe ${stufe}: Lösung plausibel und als angezeigte Zahl richtig`, () => {
        for (let seed = 1; seed <= 300; seed++) {
          const a = erzeuge(typ, stufe, seed);
          expect(Number.isFinite(a.loesung), a.id).toBe(true);
          expect(a.loesung, a.id).toBeGreaterThan(0);
          expect(a.schritte.length, a.id).toBeGreaterThan(0);
          expect(a.frage, a.id).not.toMatch(/NaN|undefined|Infinity/);
          // Die im Lösungsweg angezeigte Zahl muss als Antwort akzeptiert werden
          expect(bewerte(a, zahl(a.loesung)), a.id).toBe('richtig');
          // Deutlich daneben ist falsch
          expect(bewerte(a, String(a.loesung * 2 + 1)), a.id).toBe('falsch');
        }
      });
    }
  }

  it('ist reproduzierbar', () => {
    expect(erzeuge('perfusor', 3, 42)).toEqual(erzeuge('perfusor', 3, 42));
  });

  it('Tropfen Stufe 1 ergibt glatte Werte (ml/h ÷ 3)', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const a = erzeuge('tropfen', 1, seed);
      expect(a.toleranz).toBe(0);
      expect(a.schritte.at(-1)).not.toContain('≈');
    }
  });

  it('rechnet Beispiele richtig nach', () => {
    // 1000 ml in 8 h, 20 Tropfen/ml: 20000 / 480 = 41,67 → 42
    const t = Array.from({ length: 500 }, (_, i) => erzeuge('tropfen', 2, i + 1)).find((a) => a.frage.startsWith('1.000 ml sollen über 8 Stunden mit einem Standard'));
    expect(t?.loesung).toBe(42);
    expect(bewerte(t!, '41')).toBe('gerundet');
    expect(bewerte(t!, '40')).toBe('falsch');
    expect(runde(0.1 + 0.2)).toBe(0.3);
  });

  it('naechste wählt nur aus den gewählten Typen und wiederholt den Typ nicht direkt', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const a = naechste(['dosis', 'prozent'], 2, seed, 'dosis');
      expect(a.typ).toBe('prozent');
    }
    expect(naechste(['laufzeit'], 1, 7, 'laufzeit').typ).toBe('laufzeit');
  });
});
