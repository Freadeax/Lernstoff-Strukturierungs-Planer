import { describe, expect, it } from 'vitest';
import { AUFTRAEGE, blutzucker, haut, herz, HERZ_START, lunge, START, ZUCKER_START, type Zustand } from './modelle';

describe('Herzmodell', () => {
  it('Ruhewerte liegen im Normbereich', () => {
    const r = herz(HERZ_START);
    expect(r.sv).toBe(70);
    expect(r.hzv).toBeCloseTo(4.9, 1);
    expect(r.sys).toBeGreaterThanOrEqual(110); expect(r.sys).toBeLessThan(140);
    expect(r.hinweise).toEqual([]);
  });
  it('hohe Frequenz verkürzt die Füllung, das Schlagvolumen sinkt', () => {
    const r = herz({ ...HERZ_START, hf: 170 });
    expect(r.fuellung).toBeLessThan(0.85);
    expect(r.sv).toBeLessThan(45);
  });
  it('Volumenmangel senkt den Druck unter 65 mmHg', () => {
    expect(herz({ ...HERZ_START, vorlast: 15 }).map).toBeLessThan(65);
  });
  it('Nachlastsenkung hilft dem schwachen Herzen mehr als dem gesunden', () => {
    const schwach = herz({ ...HERZ_START, kraft: 25 }).hzv;
    const schwachAce = herz({ ...HERZ_START, kraft: 25, aceHemmer: true }).hzv;
    expect(schwachAce).toBeGreaterThan(schwach);
  });
  it('Betablocker senkt Frequenz und Druck', () => {
    const r = herz({ ...HERZ_START, betablocker: true });
    expect(r.hf).toBeLessThan(70);
    expect(r.map).toBeLessThan(herz(HERZ_START).map);
  });
});

describe('Hautmodell', () => {
  it('unter dem Kapillardruck entsteht kein Schaden, auch nach 8 Stunden', () => {
    expect(haut({ druck: 30, stunden: 8, scherkraefte: false, feuchtigkeit: false }).kategorie).toBe(0);
  });
  it('mehr Druck und Zeit, höhere Kategorie; Scherkräfte verstärken', () => {
    const k = (d: number, s: number, sch = false) => haut({ druck: d, stunden: s, scherkraefte: sch, feuchtigkeit: false }).kategorie;
    expect(k(60, 1)).toBeLessThanOrEqual(k(60, 4));
    expect(k(120, 4)).toBe(4);
    expect(k(50, 3, true)).toBeGreaterThan(k(50, 3));
  });
});

describe('Lungenmodell', () => {
  it('gesund in Oberkörperhochlage: guter Gasaustausch', () => {
    expect(lunge('oberkoerper', 'gesund').gasaustausch).toBe('gut');
  });
  it('Pneumonie rechts: gesunde Seite nach unten ist die beste Lage', () => {
    const lagen = ['rueckenlage', 'oberkoerper', 'seite-links', 'seite-rechts', 'bauchlage'] as const;
    const best = [...lagen].sort((a, b) => lunge(a, 'pneumonie-rechts').shunt - lunge(b, 'pneumonie-rechts').shunt)[0];
    expect(best).toBe('seite-links');
    expect(lunge('seite-rechts', 'pneumonie-rechts').shunt).toBeGreaterThan(lunge('seite-links', 'pneumonie-rechts').shunt);
  });
  it('Atelektasen hinten unten: Bauchlage verbessert den Gasaustausch', () => {
    expect(lunge('bauchlage', 'atelektase').shunt).toBeLessThan(lunge('rueckenlage', 'atelektase').shunt);
  });
});

describe('Blutzuckermodell', () => {
  it('Typ 1 ohne Insulin: Hyperglykämie, mit passender Dosis im Zielbereich', () => {
    expect(blutzucker({ ...ZUCKER_START, insulin: 0 }).hyper).toBe(true);
    const r = blutzucker({ ...ZUCKER_START, insulin: 6 });
    expect(r.hypo || r.hyper).toBe(false);
  });
  it('zu viel Insulin oder Bewegung führt zur Unterzuckerung', () => {
    expect(blutzucker({ ...ZUCKER_START, insulin: 12 }).hypo).toBe(true);
    expect(blutzucker({ ...ZUCKER_START, insulin: 8, bewegung: true }).hypo).toBe(true);
  });
  it('gesunder Stoffwechsel regelt selbst zurück', () => {
    const r = blutzucker({ ...ZUCKER_START, stoffwechsel: 'gesund', insulin: 0 });
    expect(r.max).toBeLessThan(140);
    expect(r.verlauf.at(-1)!).toBeLessThan(100);
  });
});

describe('Erkundungsaufträge', () => {
  it('kein Auftrag ist im Startzustand schon gelöst', () => {
    expect(AUFTRAEGE.filter((a) => a.geschafft(START)).map((a) => a.id)).toEqual([]);
  });
  it('jeder Auftrag ist mit den Reglern lösbar', () => {
    const loesung: Record<string, Partial<Zustand>> = {
      'herz-tachy': { herz: { ...HERZ_START, hf: 170 } },
      'herz-insuffizienz': { herz: { ...HERZ_START, kraft: 25, aceHemmer: true } },
      'haut-kategorie2': { haut: { druck: 60, stunden: 4, scherkraefte: true, feuchtigkeit: false } },
      'haut-schutz': { haut: { druck: 30, stunden: 8, scherkraefte: false, feuchtigkeit: false } },
      'lunge-pneumonie': { lage: 'seite-links', befund: 'pneumonie-rechts' },
      'lunge-atelektase': { lage: 'bauchlage', befund: 'atelektase' },
      'zucker-passend': { zucker: { ...ZUCKER_START, insulin: 6 } },
      'zucker-sport': { zucker: { ...ZUCKER_START, insulin: 8, bewegung: true } },
    };
    for (const a of AUFTRAEGE) expect(a.geschafft({ ...START, ...loesung[a.id] }), a.id).toBe(true);
  });
});
