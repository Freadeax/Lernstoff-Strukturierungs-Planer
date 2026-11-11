import { describe, expect, it } from 'vitest';
import { alarmProfil, alarmStufe, anzeige, monitorGruppe, normBand, atmung, blutdruck, ekg, gesamtAlarm, pleth, proSekunde, zahl } from './monitor';

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

describe('Kinder-Alarmprofile (SIM-01)', () => {
  it('Puls 120 ist beim Erwachsenen gelb, beim Kleinkind unauffällig', () => {
    expect(alarmStufe('puls', 120)).toBe('gelb');
    expect(alarmStufe('puls', 120, 'kleinkind')).toBe('ok');
    expect(alarmStufe('puls', 156, 'kleinkind')).toBe('gelb');
    expect(alarmStufe('puls', 175, 'kleinkind')).toBe('rot');
    expect(alarmStufe('af', 28, 'kleinkind')).toBe('ok');
    expect(alarmStufe('af', 34, 'schulkind')).toBe('gelb');
    expect(alarmStufe('sys', 95, 'schulkind')).toBe('ok');
    expect(alarmStufe('sys', 95)).toBe('gelb');
    expect(alarmStufe('spo2', 90, 'schulkind')).toBe('rot');
  });
  it('Säuglinge: kein Profil, keine Färbung', () => {
    expect(alarmProfil('saeugling').bewertet).toBe(false);
    expect(gesamtAlarm({ puls: 200, af: 70, spo2: 80 }, 'saeugling')).toBe('ok');
    expect(normBand('puls', 'saeugling')).toBeUndefined();
  });
  it('Altersgruppe und Profiltexte', () => {
    expect(monitorGruppe(0.5)).toBe('saeugling'); expect(monitorGruppe(4)).toBe('kleinkind');
    expect(monitorGruppe(7)).toBe('schulkind'); expect(monitorGruppe(40)).toBe('erwachsen'); expect(monitorGruppe(undefined)).toBe('erwachsen');
    for (const g of ['erwachsen', 'kleinkind', 'schulkind', 'saeugling'] as const) expect(alarmProfil(g).quelle.length).toBeGreaterThan(40);
    expect(normBand('puls', 'schulkind')).toEqual({ min: 70, max: 130 });
  });
});
