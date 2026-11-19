import { describe, expect, it } from 'vitest';
import { NORMAL } from '../modell';
import type { AktiverTreiber, Altersgruppe, Grundgroessen, Treiber } from '../typen';
import { start, sende, uhrVon } from '../kern';
import { KH_PNEUMONIE_SEPSIS } from '../faelle/kh-pneumonie-sepsis';
import { LABOR_FELDER, laborBefunde, laborDauerSek } from '../labor-auftrag';
import { PFLEGE_MODELL } from './pflegemodell';
import type { FallV2 } from '../typen';

function lauf(ag: Altersgruppe, minuten: number, treiber: Treiber[] = [], startWerte: Partial<Grundgroessen> = {}) {
  const basis = { ...NORMAL, ...startWerte };
  let g = { ...basis };
  const tr: AktiverTreiber[] = treiber.map((t) => ({ ...t, seit: 0 }));
  let t = 0;
  for (; t < minuten * 60; t += 5) g = PFLEGE_MODELL.naechster(g, tr, 5, { altersgruppe: ag, t, basis });
  return { g, a: PFLEGE_MODELL.anzeige(g, { altersgruppe: ag, t, basis }) };
}

describe('G8 Labor aus dem Modell', () => {
  it('Ruhe: Werte im Referenzbereich', () => {
    const a = lauf('erwachsen', 10).a;
    expect(a.hb).toBeCloseTo(13.5, 0);
    expect(a.crp!).toBeLessThan(5);
    expect(a.leuko!).toBeGreaterThanOrEqual(4);
    expect(a.leuko!).toBeLessThanOrEqual(10);
    expect(a.natrium).toBe(140);
    expect(a.krea!).toBeLessThan(1.2);
    expect(a.egfr!).toBeGreaterThan(60);
    expect(a.inr).toBe(1);
  });
  it('bestehende Sepsis: CRP, Leukos, PCT hoch ab Fallbeginn; Gerinnung verbraucht', () => {
    const a = lauf('erwachsen', 5, [{ art: 'sepsis_verlauf', tempo: 1.4 }]).a;
    expect(a.crp!).toBeGreaterThan(150);
    expect(a.leuko!).toBeGreaterThan(12);
    expect(a.pct!).toBeGreaterThan(2);
    expect(a.thrombo!).toBeLessThan(200);
    expect(a.inr!).toBeGreaterThan(1.3);
  });
  it('neue Entzündung im Fall: CRP steigt langsam (Stunden), Leukos schneller', () => {
    const r2 = lauf('hochbetagt', 120, [], { aspirationsPneumonie: 0.8, crp: 3, leuko: 7, entzuendung: 0 });
    const r8 = lauf('hochbetagt', 480, [], { aspirationsPneumonie: 0.8, crp: 3, leuko: 7, entzuendung: 0 });
    expect(r2.a.crp!).toBeLessThan(30);
    expect(r8.a.crp!).toBeGreaterThan(r2.a.crp! + 20);
    expect(r2.a.leuko! - 7).toBeGreaterThan((r2.a.crp! - 3) / 50);
  });
  it('Blutung: Hb bleibt zunächst, fällt nach Volumengabe (später Wert)', () => {
    const blutung: Treiber = { art: 'blutung', mlProMin: 50 };
    const r = lauf('erwachsen', 20, [blutung]);
    expect(r.g.hbMasse!).toBeLessThan(0.85);
    expect(r.a.hb!).toBeGreaterThan(12.8);
    const aufgefuellt = PFLEGE_MODELL.anzeige({ ...r.g, volumen: 1 }, { altersgruppe: 'erwachsen' });
    expect(aufgefuellt.hb!).toBeLessThan(11.5);
  });
  it('Exsikkose: Natrium und Harnstoff steigen, Kreatinin langsam (prärenal)', () => {
    const r = lauf('hochbetagt', 360, [{ art: 'exsikkose_progressiv', verlustProStunde: 0.04 }]);
    expect(r.a.natrium!).toBeGreaterThan(146);
    const anfang = lauf('hochbetagt', 1, [{ art: 'exsikkose_progressiv', verlustProStunde: 0.04 }]).a;
    expect(r.a.harnstoff!).toBeGreaterThan(anfang.harnstoff! + 5);
    expect(r.a.krea!).toBeGreaterThan(anfang.krea!);
  });
  it('Blutentnahme im Fall: Werte zum Abnahmezeitpunkt, Ergebnis erst nach Laufzeit in der Akte', () => {
    const fall: FallV2 = { ...KH_PNEUMONIE_SEPSIS, massnahmen: [...KH_PNEUMONIE_SEPSIS.massnahmen, 'blutentnahme-venoes'] };
    let z = start(fall, 'pflegefachperson', 3, 1);
    z = sende(z, { art: 'massnahme', id: 'blutentnahme-venoes' });
    expect(z.laborProben?.length).toBe(1);
    expect(z.laborProben![0].werte.crp!).toBeGreaterThan(100);   // bestehende Pneumonie/Sepsis
    const sofort = laborBefunde(z, uhrVon(z));
    expect(sofort.zeilen).toHaveLength(0);
    expect(sofort.ausstehend).toHaveLength(1);
    const bis = Math.max(...Object.values(LABOR_FELDER).map(laborDauerSek)) + 60;
    while (z.t < bis && !z.ende) {
      if (z.offeneEntscheidung) {
        const ev = z.fall.ereignisse.find((e) => e.id === z.offeneEntscheidung)!;
        z = sende(z, { art: 'entscheidung', ereignis: ev.id, wahl: ev.entscheidung!.find((o) => o.wertung === 'gut')!.id });
      } else z = sende(z, { art: 'warten', sek: 300 });
    }
    // Fall endet ohne Behandlung vorher (Notfallteam); das Labor arbeitet trotzdem weiter
    const spaeter = laborBefunde({ ...z, t: Math.max(z.t, bis) }, uhrVon(z));
    const crp = spaeter.zeilen.find((l) => l.name === 'C-reaktives Protein');
    expect(crp?.auffaellig).toBe(true);
    expect(crp?.datum).toMatch(/^heute \d\d:\d\d$/);
    expect(spaeter.ausstehend).toHaveLength(0);
  });
});
