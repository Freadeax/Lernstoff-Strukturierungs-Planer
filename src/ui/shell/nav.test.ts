import { describe, expect, it } from 'vitest';
import { bereichVon, flatNav, gruppenPfad, NAV, seitenName, uebenGruppen } from './nav';

describe('Navigation', () => {
  it('nennt den Platz einer Seite im Menü', () => {
    expect(gruppenPfad('/lernen/hygiene')).toBe('Üben · Fachwissen');
    expect(gruppenPfad('/lernen/plan')).toBe('Lernen');
    expect(gruppenPfad('/system/design')).toBe('System');
  });
  it('führt das Designsystem nicht im Menü, kennt die Seite aber weiter', () => {
    expect(flatNav(NAV).some((i) => i.path === '/system/design')).toBe(false);
    expect(seitenName('/system/design')).toBe('Designsystem');
    expect(bereichVon('/system/design')).toBe('system');
  });
  it('hat genau die drei Übungsbündel, die „Heute“ direkt öffnet', () => {
    expect(uebenGruppen().map((g) => g.id)).toEqual(['fachwissen', 'praxis-gruppe', 'pruefung-gruppe']);
  });
});
