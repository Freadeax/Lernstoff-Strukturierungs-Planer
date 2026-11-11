import { describe, expect, it } from 'vitest';
import { bewerte, formatReferenz, formatWert, parameter, PARAMETER } from './parameter';
import { benoetigteRoehrchen, fehlerAus, reihenfolgeFehler, STANDARD_ABNAHME } from './praeanalytik';
import { kumulativ, uhrzeit, wahrerWert, werteAuftrag } from './modell';
import { deuteBga } from './bga';

describe('Laborparameter', () => {
  it('haben eindeutige IDs und stimmige Grenzen', () => {
    expect(new Set(PARAMETER.map((p) => p.id)).size).toBe(PARAMETER.length);
    for (const p of PARAMETER) {
      const refs = 'w' in p.referenz ? [p.referenz.w, p.referenz.m] : [p.referenz];
      for (const r of refs) if (r.min !== undefined && r.max !== undefined) expect(r.min).toBeLessThan(r.max);
      if (p.kritisch?.min !== undefined) for (const r of refs) if (r.min !== undefined) expect(p.kritisch.min).toBeLessThan(r.min);
      if (p.kritisch?.max !== undefined) for (const r of refs) if (r.max !== undefined) expect(p.kritisch.max).toBeGreaterThan(r.max);
    }
  });
  it('bewertet Kennzeichen und formatiert deutsch', () => {
    expect(bewerte(parameter('k'), 6.5)).toBe('kritisch-hoch');
    expect(bewerte(parameter('k'), 5.4)).toBe('hoch');
    expect(bewerte(parameter('hb'), 12.5, 'm')).toBe('niedrig');
    expect(bewerte(parameter('hb'), 12.5, 'w')).toBe('normal');
    expect(formatWert(parameter('k'), 4.25)).toBe('4,3');
    expect(formatWert(parameter('u-keton'), 3)).toBe('++');
    expect(formatReferenz(parameter('crp'))).toBe('< 5');
  });
});

describe('Präanalytik', () => {
  it('sortiert Röhrchen in Abnahmereihenfolge', () => {
    expect(benoetigteRoehrchen(['leuko', 'k', 'inr', 'bk', 'glukose'])).toEqual(['blutkultur', 'citrat', 'serum', 'edta', 'fluorid']);
    expect(reihenfolgeFehler(['edta', 'serum']).falsch).toBe(true);
  });
  it('erkennt typische Fehler', () => {
    const m = benoetigteRoehrchen(['k', 'leuko', 'inr']);
    expect(fehlerAus({ ...STANDARD_ABNAHME, reihenfolge: m }, m)).toEqual([]);
    const arten = fehlerAus({ ...STANDARD_ABNAHME, stauzeit: 150, infusionsarm: true, citratVoll: false, reihenfolge: ['edta', 'citrat', 'serum'] }, m).map((f) => f.art);
    expect(arten).toEqual(expect.arrayContaining(['haemolyse', 'stauung', 'infusion', 'verschleppung', 'citrat']));
  });
});

describe('Labormodell', () => {
  it('Drift, Grenze und Therapie', () => {
    const v = { basis: 2.9, proStunde: 0.5, grenze: 6, therapie: [{ flag: 'volumen', ziel: 1.5, tauMin: 90 }] };
    expect(wahrerWert(v, 120)).toBeCloseTo(3.9);
    expect(wahrerWert(v, 6000)).toBe(6);
    const mitTherapie = wahrerWert(v, 60 + 270, { volumen: 60 });
    expect(mitTherapie).toBeLessThan(2);
    expect(mitTherapie).toBeGreaterThan(1.5);
  });
  it('Hämolyse verfälscht Kalium, das Labor meldet es; kritische Werte lösen Anruf aus', () => {
    const labor = { k: { basis: 4.4 }, laktat: { basis: 5 }, leuko: { basis: 9 } };
    const a = werteAuftrag({ id: 'a', parameter: ['k', 'leuko', 'laktat'], prioritaet: 'notfall', minute: 10, abnahme: { ...STANDARD_ABNAHME, stauzeit: 180, reihenfolge: ['serum', 'edta'] } }, labor, {});
    const k = a.ergebnisse.find((e) => e.parameter === 'k')!;
    expect(k.wert).toBeCloseTo(5.8);
    expect(k.verfaelscht).toBe(true);
    expect(k.kommentar).toMatch(/hämolytisch/);
    expect(k.fertig).toBe(10 + 15 + 30);
    const lak = a.ergebnisse.find((e) => e.parameter === 'laktat')!;
    expect(lak.fertig).toBe(13); // patientennah
    expect(lak.anruf).toBe(false); // POCT: sieht man selbst
    const b = werteAuftrag({ id: 'b', parameter: ['k'], prioritaet: 'routine', minute: 0, abnahme: { ...STANDARD_ABNAHME, reihenfolge: ['serum'] } }, { k: { basis: 6.8 } }, {});
    expect(b.ergebnisse[0].anruf).toBe(true);
  });
  it('ohne Identitätsprüfung lehnt das Labor ab', () => {
    const a = werteAuftrag({ id: 'a', parameter: ['k'], prioritaet: 'notfall', minute: 0, abnahme: { ...STANDARD_ABNAHME, identitaetGeprueft: false, reihenfolge: ['serum'] } }, { k: { basis: 4 } }, {});
    expect(a.ergebnisse[0].wert).toBeUndefined();
  });
  it('Kumulativbefund zeigt nur fertige Werte, mit Vorwerten', () => {
    const labor = { crp: { basis: 100, vorwerte: [{ minute: -1440, wert: 20 }] } };
    const a = werteAuftrag({ id: 'a', parameter: ['crp'], prioritaet: 'routine', minute: 0, abnahme: { ...STANDARD_ABNAHME, reihenfolge: ['serum'] } }, labor, {});
    expect(kumulativ([a], labor, 10).crp).toHaveLength(1);
    expect(kumulativ([a], labor, 200).crp.map((r) => r.wert)).toEqual([20, 100]);
    expect(uhrzeit('23:30', 45)).toBe('00:15');
  });
});

describe('BGA-Deutung', () => {
  it.each([
    [{ ph: 7.12, pco2: 22, hco3: 8.5 }, 'metabolische Azidose', 'teilweise'],
    [{ ph: 7.48, pco2: 30, hco3: 22.4 }, 'respiratorische Alkalose', 'keine'],
    [{ ph: 7.28, pco2: 62, hco3: 28 }, 'respiratorische Azidose', 'teilweise'],
    [{ ph: 7.37, pco2: 58, hco3: 32 }, 'respiratorische Azidose', 'vollständig'],
    [{ ph: 7.4, pco2: 40, hco3: 24 }, 'normal', 'keine'],
    [{ ph: 7.2, pco2: 55, hco3: 18 }, 'gemischte Azidose', 'keine'],
  ] as const)('%o', (werte, stoerung, kompensation) => {
    const d = deuteBga(werte);
    expect(d.stoerung).toBe(stoerung);
    expect(d.kompensation).toBe(kompensation);
  });
});

describe('Kinder-Referenzbereiche', () => {
  it('Kreatinin 0,7 mg/dl ist beim Erwachsenen normal, beim Kind erhöht', async () => {
    const { bewerte, formatReferenz, parameter, istKind } = await import('./parameter');
    const krea = parameter('krea');
    expect(bewerte(krea, 0.7, 'w')).toBe('normal');
    expect(bewerte(krea, 0.7, 'w', true)).toBe('hoch');
    expect(formatReferenz(krea, 'w', true)).toBe('0,2–0,6');
    // Ohne eigenen Kinderbereich gilt der Erwachsenenbereich
    expect(bewerte(parameter('na'), 133, 'w', true)).toBe('niedrig');
    expect(istKind(8)).toBe(true); expect(istKind(19)).toBe(false);
  });
});
