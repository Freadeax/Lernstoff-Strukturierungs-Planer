import { describe, expect, it } from 'vitest';
import { kuerzelFolge, leseIcs, NACH_NACHT_MAX, schichtAusTitel, schonregeln, SERIE_MAX, WECHSEL_MAX } from '../dienstplan';
import type { SchichtId } from '../alltag';

describe('Schicht erkennen', () => {
  it('aus Titel, Kürzel und Uhrzeit', () => {
    expect(schichtAusTitel('Spät')).toBe('spaet');
    expect(schichtAusTitel('Frühdienst Station 3')).toBe('frueh');
    expect(schichtAusTitel('ND')).toBe('nacht');
    expect(schichtAusTitel('Urlaub')).toBe('frei');
    expect(schichtAusTitel('Schulblock CE 05')).toBe('schule');
    expect(schichtAusTitel('Dienst', 6)).toBe('frueh');
    expect(schichtAusTitel('Dienst', 13)).toBe('spaet');
    expect(schichtAusTitel('Dienst', 21)).toBe('nacht');
    expect(schichtAusTitel('Geburtstag Oma')).toBeUndefined();
    expect(schichtAusTitel('Frühstück')).toBeUndefined();
  });

  it('Kürzelfolge ab Starttag', () => {
    const r = kuerzelFolge('F F, S; N N\nX ? U', '2026-11-30');
    expect(r.tage).toEqual({ '2026-11-30': 'frueh', '2026-12-01': 'frueh', '2026-12-02': 'spaet', '2026-12-03': 'nacht', '2026-12-04': 'nacht', '2026-12-05': 'frei', '2026-12-07': 'frei' });
    expect(r.unbekannt).toEqual(['?']);
  });
});

describe('Kalenderdatei', () => {
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0',
    'BEGIN:VEVENT', 'SUMMARY:Frühdienst', 'DTSTART;TZID=Europe/Berlin:20261201T060000', 'DTEND;TZID=Europe/Berlin:20261201T141500', 'END:VEVENT',
    'BEGIN:VEVENT', 'SUMMARY:Dienst', 'DTSTART:20261202T200000Z', 'DTEND:20261203T060000Z', 'END:VEVENT',
    'BEGIN:VEVENT', 'SUMMARY:Ur', ' laub', 'DTSTART;VALUE=DATE:20261205', 'DTEND;VALUE=DATE:20261208', 'END:VEVENT',
    'BEGIN:VEVENT', 'SUMMARY:Zahnarzt', 'DTSTART:20261206T100000', 'END:VEVENT',
    'BEGIN:VEVENT', 'SUMMARY:Spät', 'DTSTART:20261110T120000', 'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  it('liest Schichten, gefaltete Zeilen, UTC und Mehrtagestermine', () => {
    const r = leseIcs(ics, '2026-11-16');
    expect(r.tage).toEqual({ '2026-12-01': 'frueh', '2026-12-02': 'nacht', '2026-12-05': 'frei', '2026-12-06': 'frei', '2026-12-07': 'frei' });
    expect(r.termine).toBe(5);
    expect(r.erkannt).toBe(4);
    expect(r.unbekannt).toEqual(['Zahnarzt']);
  });
  it('lehnt anderes ab', () => {
    expect(leseIcs('kein Kalender', '2026-11-16').termine).toBe(0);
  });
});

describe('Schonregeln', () => {
  const plan = (p: Record<string, SchichtId>) => (d: string) => p[d];
  it('nach Nacht, Spät auf Früh, lange Serie', () => {
    const p: Record<string, SchichtId> = {
      '2026-12-01': 'nacht', '2026-12-02': 'nacht', '2026-12-03': 'frei', '2026-12-04': 'spaet', '2026-12-05': 'frueh',
      '2026-12-06': 'frueh', '2026-12-07': 'frueh', '2026-12-08': 'frueh', '2026-12-09': 'spaet', '2026-12-10': 'frei',
    };
    const tage = Object.keys(p);
    const s = schonregeln(tage, plan(p));
    expect(s['2026-12-02']).toBeUndefined();
    expect(s['2026-12-03']!.max).toBe(NACH_NACHT_MAX);
    expect(s['2026-12-05']!.max).toBe(WECHSEL_MAX);
    expect(s['2026-12-06']).toBeUndefined();
    expect(s['2026-12-09']!.max).toBe(SERIE_MAX);
    expect(s['2026-12-10']).toBeUndefined();
  });
  it('zählt die Nacht vor dem Zeitraum mit', () => {
    expect(schonregeln(['2026-12-03'], plan({ '2026-12-02': 'nacht' }))['2026-12-03']!.max).toBe(NACH_NACHT_MAX);
  });
});
