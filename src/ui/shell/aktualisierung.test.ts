import { describe, expect, it } from 'vitest';
import { aktualisierung, istNeuer, melde, neuLadenBeimWechsel } from './aktualisierung';

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
  it('erkennt eine neue Veröffentlichung nur bei echter anderer Build-ID', () => {
    expect(istNeuer('abc1234 · 2026-11-13', 'abc1234 · 2026-11-13')).toBe(false);
    expect(istNeuer('abc1234 · 2026-11-13\n', 'abc1234 · 2026-11-13')).toBe(false);
    expect(istNeuer('def5678 · 2026-11-14', 'abc1234 · 2026-11-13')).toBe(true);
    expect(istNeuer(null, 'abc1234 · 2026-11-13')).toBe(false);
    expect(istNeuer('def5678 · 2026-11-14', 'Entwicklung')).toBe(false);
  });
});
