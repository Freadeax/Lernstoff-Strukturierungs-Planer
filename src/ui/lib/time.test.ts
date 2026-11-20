import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_TZ, heuteTag, setzeTagesZone } from './time';

describe('heuteTag (Audit R-4)', () => {
  afterEach(() => setzeTagesZone(DEFAULT_TZ));
  it('zählt 00:30 Uhr deutscher Zeit zum neuen Tag, nicht zum Vortag wie UTC', () => {
    // 20.11.2026 00:30 Berlin = 19.11.2026 23:30 UTC (Winterzeit)
    expect(heuteTag(new Date('2026-11-19T23:30:00Z'))).toBe('2026-11-20');
    // Sommerzeit: 15.07.2026 01:30 Berlin = 14.07.2026 23:30 UTC
    expect(heuteTag(new Date('2026-07-14T23:30:00Z'))).toBe('2026-07-15');
  });
  it('folgt der eingestellten Zeitzone', () => {
    setzeTagesZone('America/New_York');
    expect(heuteTag(new Date('2026-11-20T03:00:00Z'))).toBe('2026-11-19');
    setzeTagesZone('');
    expect(heuteTag(new Date('2026-11-19T23:30:00Z'))).toBe('2026-11-20');
  });
});
