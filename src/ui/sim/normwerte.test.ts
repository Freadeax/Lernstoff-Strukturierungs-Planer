import { describe, expect, it } from 'vitest';
import { normText, normwert, VITALWERTE, vitalNormal } from './normwerte';
import { alarmStufe, normBand } from './monitor';
import { ALLE_AUFGABEN } from '../../features/normwerte/aufgaben';

const richtigeAntwort = (id: string) => {
  const a = ALLE_AUFGABEN.find((x) => x.id === id);
  if (!a || a.art !== 'auswahl') throw new Error(id);
  return a.richtig.map((i) => a.optionen[i]).join(' ');
};

describe('Gemeinsamer Normwert-Vertrag', () => {
  it('liefert Labor- und Vitalbereiche aus einer Quelle', () => {
    expect(normText('k')).toBe('3,5 bis 5,0 mmol/l');
    expect(normText('leuko', { faktor: 1000, nachkomma: 0, einheit: '' })).toBe('4.000 bis 10.000');
    expect(normwert('puls').bereich).toEqual({ min: 60, max: 100 });
    expect(normwert('krea', { gruppe: 'kleinkind' }).bereich).toEqual({ min: 0.2, max: 0.5 });
    expect(normwert('trop', { gruppe: 'schulkind' }).bereich).toBeUndefined();
    expect(normwert('puls', { gruppe: 'saeugling' }).bereich).toBeUndefined();
  });
  it('Normwerte-Trainer nennt dieselben Bereiche', () => {
    expect(richtigeAntwort('vital.puls')).toContain('60 bis 100');
    expect(richtigeAntwort('vital.atmung')).toContain('12 bis 20');
    expect(richtigeAntwort('vital.spo2')).toContain('95 bis 100');
    expect(richtigeAntwort('labor.kalium')).toBe(normText('k'));
    expect(richtigeAntwort('labor.natrium')).toBe(normText('na'));
    expect(richtigeAntwort('labor.hb')).toContain('12 bis 16 g/dl');
    expect(richtigeAntwort('labor.leuko')).toContain('4.000 bis 10.000');
    expect(richtigeAntwort('labor.thrombo')).toContain('150.000 bis 400.000');
  });
  it('Monitor: Kurvenband ist der Normalbereich; bei Kindern färbt er genau außerhalb davon gelb', () => {
    for (const id of Object.keys(VITALWERTE) as (keyof typeof VITALWERTE)[]) {
      for (const g of ['erwachsen', 'kleinkind', 'schulkind'] as const) {
        expect(normBand(id, g)).toEqual(vitalNormal(id, g));
        const b = vitalNormal(id, g)!;
        // Werte im Normalbereich sind nie rot
        for (const n of [b.min, b.max].filter((x): x is number => x !== undefined)) expect(alarmStufe(id, n, g), `${id}/${g}/${n}`).not.toBe('rot');
      }
    }
    for (const g of ['kleinkind', 'schulkind'] as const) for (const id of ['puls', 'af'] as const) {
      const b = vitalNormal(id, g)!;
      expect(alarmStufe(id, b.min!, g)).toBe('ok');
      expect(alarmStufe(id, b.max!, g)).toBe('ok');
      expect(alarmStufe(id, b.max! + 1, g)).toBe('gelb');
      expect(alarmStufe(id, b.min! - 1, g)).toBe('gelb');
    }
  });
});
