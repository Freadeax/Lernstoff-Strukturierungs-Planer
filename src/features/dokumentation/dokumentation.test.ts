import { describe, expect, it } from 'vitest';
import { dokuPfad, dokuWeiterleitung, DOKU_IDS } from './pfad';
import { DOKU_INFO } from './DokumentationSeite';
import { schrittPfad } from '../fallakte/typen';
import { flatNav, NAV } from '../../ui/shell/nav';

const weiter = (pfad: string, q = '') => dokuWeiterleitung(pfad, new URLSearchParams(q));

describe('Dokumentations-Trainer', () => {
  it('leitet alte Adressen mit allen Angaben weiter', () => {
    expect(weiter('/lernen/sis', 'fall=herr-albers&akte=a1')).toBe('/lernen/dokumentation?teil=sis&fall=herr-albers&akte=a1');
    expect(weiter('/lernen/assessment', 'gruppe=braden&modus=faelle')).toBe('/lernen/dokumentation?teil=assessment&gruppe=braden&modus=faelle');
    expect(weiter('/lernen/fallakte')).toBe('/lernen/dokumentation?teil=fallakte');
    expect(weiter('/lernen/bericht', 'aus=praxis&sitzung=neu%3Ax')).toBe('/lernen/dokumentation?teil=bericht&aus=praxis&sitzung=neu%3Ax');
    expect(weiter('/lernen/dokumentation', 'teil=sis')).toBeUndefined();
    expect(weiter('/lernen/praxis')).toBeUndefined();
  });
  it('Fallakten-Schritte führen mit Fall und Akte in den richtigen Teil', () => {
    expect(schrittPfad('a1', { art: 'sis', fallId: 'f1' } as never)).toBe('/lernen/dokumentation?teil=sis&fall=f1&akte=a1');
  });
  it('jeder Teil hat einen Steckbrief, das Menü einen Eintrag statt sechs', () => {
    for (const d of DOKU_IDS) expect(DOKU_INFO[d], d).toBeDefined();
    const pfade = flatNav(NAV).map((n) => n.path);
    expect(pfade).toContain('/lernen/dokumentation');
    for (const d of DOKU_IDS) expect(pfade).not.toContain(`/lernen/${d}`);
    expect(dokuPfad('pflegeplanung', { fall: 'x' })).toBe('/lernen/dokumentation?teil=pflegeplanung&fall=x');
  });
});
