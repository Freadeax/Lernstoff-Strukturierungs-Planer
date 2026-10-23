import { describe, expect, it } from 'vitest';
import { addDays, daysBetween, eachDay, weekday } from '..';

describe('Datumsrechnung', () => {
  it('rechnet über Monats- und Sommerzeitgrenzen hinweg', () => {
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26'); // Zeitumstellung am 25.10.
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(daysBetween('2026-10-01', '2026-11-01')).toBe(31);
  });
  it('liefert Wochentage und Tagesbereiche', () => {
    expect(weekday('2026-10-26')).toBe(1); // Montag
    expect(eachDay('2026-10-26', '2026-10-29')).toEqual(['2026-10-26', '2026-10-27', '2026-10-28']);
  });
  it('lehnt ungültige Formate ab', () => {
    expect(() => addDays('26.10.2026', 1)).toThrow();
  });
});
