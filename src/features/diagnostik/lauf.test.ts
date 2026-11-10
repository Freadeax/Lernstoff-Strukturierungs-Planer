import { describe, expect, it } from 'vitest';
import { FAELLE } from './faelle';
import { auswertung, ergebnisse, fuehreAus, offeneAnrufe, offeneMeldungen, starte, type Lauf } from './lauf';
import { STANDARD_ABNAHME } from '../../ui/sim/labor/praeanalytik';
import type { DiagnostikFall } from './typen';

const sbarFakten = (f: DiagnostikFall) => f.sbar.filter((s) => s.relevant).map((s) => s.id);

describe('Diagnostik-Lauf', () => {
  it('Blutkulturen als Anordnung erzeugen einen Laborauftrag mit Befund vor Antibiose', () => {
    const fall = FAELLE.find((f) => f.anordnungen.some((a) => a.flag === 'bk-abgenommen'))!;
    const bk = fall.anordnungen.find((a) => a.flag === 'bk-abgenommen')!;
    let l = fuehreAus(starte(fall), fall, { typ: 'sbar', fakten: sbarFakten(fall) });
    l = fuehreAus(l, fall, { typ: 'massnahme', id: bk.id });
    expect(l.auftraege.some((a) => a.parameter.includes('bk') && a.abnahme.vorAntibiose)).toBe(true);
    l = fuehreAus(l, fall, { typ: 'warten', minuten: 3000 });
    const bkErg = ergebnisse(l, fall).flatMap((a) => a.ergebnisse).find((e) => e.parameter === 'bk');
    expect(bkErg?.wert).toBeDefined();
  });

  it('kritischer Wert nach dem SBAR-Gespräch zählt erst nach eigener Nachmeldung', () => {
    // Fall und Parameter suchen, die einen Laboranruf auslösen.
    for (const fall of FAELLE) {
      let l: Lauf = fuehreAus(starte(fall), fall, { typ: 'sbar', fakten: sbarFakten(fall) });
      l = fuehreAus(l, fall, { typ: 'labor', parameter: Object.keys(fall.labor).filter((id) => id !== 'bk'), prioritaet: 'notfall', abnahme: STANDARD_ABNAHME });
      l = fuehreAus(l, fall, { typ: 'warten', minuten: 240 });
      const anrufe = offeneAnrufe(l, fall);
      if (!anrufe.length) continue;
      const { schluessel } = anrufe[0];
      l = fuehreAus(l, fall, { typ: 'quittieren', schluessel });
      const punkt = () => auswertung(l, fall).filter((p) => p.titel === 'Kritischer Wert')[0];
      expect(punkt().ok).toBe(false);
      expect(offeneMeldungen(l, fall).map((m) => m.schluessel)).toContain(schluessel);
      l = fuehreAus(l, fall, { typ: 'melden', schluessel });
      expect(offeneMeldungen(l, fall).map((m) => m.schluessel)).not.toContain(schluessel);
      expect(auswertung(l, fall).find((p) => p.titel === 'Kritischer Wert' && p.ok)).toBeDefined();
      return;
    }
    throw new Error('kein Fall mit kritischem Laborwert gefunden');
  });
});
