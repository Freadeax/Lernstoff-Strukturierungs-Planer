import { describe, expect, it } from 'vitest';
import { aktualisierung, melde, neuLadenBeimWechsel } from './aktualisierung';

describe('Aktualisierung', () => {
  it('lädt nur beim echten Seitenwechsel neu und nur, wenn etwas ansteht', () => {
    expect(neuLadenBeimWechsel(null, '/', '/lernen/plan')).toBe(false);
    expect(neuLadenBeimWechsel('version', '/', '/')).toBe(false);
    expect(neuLadenBeimWechsel('version', '/', '/lernen/plan')).toBe(true);
    expect(neuLadenBeimWechsel('datenbank', '/a', '/b')).toBe(true);
  });
  it('Datenbank-Hinweis bleibt, auch wenn danach eine neue Version gemeldet wird', () => {
    melde('datenbank');
    melde('version');
    expect(aktualisierung.get().grund).toBe('datenbank');
  });
});
