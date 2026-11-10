import { describe, expect, it } from 'vitest';
import { alarmStufe, anzeige, atmung, blutdruck, ekg, gesamtAlarm, pleth, proSekunde, zahl } from './monitor';

describe('Monitor-Rechnung', () => {
  it('stuft Werte nach NEWS2-Bändern ein', () => {
    expect(alarmStufe('spo2', 97)).toBe('ok');
    expect(alarmStufe('spo2', 94)).toBe('gelb');
    expect(alarmStufe('spo2', 89)).toBe('rot');
    expect(alarmStufe('puls', 135)).toBe('rot');
    expect(alarmStufe('af', 22)).toBe('gelb');
    expect(alarmStufe('sys', 88)).toBe('rot');
    expect(alarmStufe('temp', 38.5)).toBe('gelb');
    expect(alarmStufe('puls', null)).toBe('ok');
  });

  it('nimmt die höchste Stufe und wertet Bewusstsein', () => {
    expect(gesamtAlarm({ puls: 80, spo2: 97 })).toBe('ok');
    expect(gesamtAlarm({ puls: 95, spo2: 97 })).toBe('gelb');
    expect(gesamtAlarm({ puls: 80, spo2: 97, avpu: 'V' })).toBe('rot');
  });

  it('liest Zahlen aus Text', () => {
    expect(zahl('38,4')).toBe(38.4);
    expect(zahl('92 %')).toBe(92);
    expect(zahl('')).toBeNull();
    expect(zahl('nicht gemessen')).toBeNull();
    expect(blutdruck('135/85')).toEqual([135, 85]);
    expect(blutdruck('')).toEqual([null, null]);
  });

  it('liefert begrenzte, periodische Kurven', () => {
    for (const f of [ekg, pleth, atmung]) {
      for (let i = 0; i <= 100; i++) {
        const y = f(i / 50);
        expect(Math.abs(y)).toBeLessThanOrEqual(1.05);
      }
      expect(f(0.3)).toBeCloseTo(f(1.3), 6);
    }
    expect(ekg(0.25)).toBeGreaterThan(0.8);
  });

  it('rechnet Frequenzen und Anzeige', () => {
    expect(proSekunde(60)).toBe(1);
    expect(proSekunde(null)).toBe(0);
    expect(proSekunde(900)).toBeCloseTo(220 / 60);
    expect(anzeige(null)).toBe('--');
    expect(anzeige(37.25, 1)).toBe('37,3');
  });
});
