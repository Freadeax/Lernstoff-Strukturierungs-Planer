import { describe, expect, it } from 'vitest';
import { fertigPfad, fertigWeiterleitung, UEBUNG_IDS } from './pfad';
import { weiterleitungFuer } from '../wissen/pfad';
import { flatNav, NAV } from '../../ui/shell/nav';
import { UEBUNG_INFO_FERTIG } from './FertigkeitenSeite';

const weiter = (pfad: string, q = '') => fertigWeiterleitung(pfad, new URLSearchParams(q));

describe('Fertigkeiten-Trainer', () => {
  it('leitet alte Seiten mit allen Angaben weiter', () => {
    expect(weiter('/lernen/rechnen', 'modus=pruefung&typen=dosis')).toBe('/lernen/fertigkeiten?uebung=rechnen&modus=pruefung&typen=dosis');
    expect(weiter('/lernen/hoeren', 'teil=quiz')).toBe('/lernen/fertigkeiten?uebung=hoeren&teil=quiz');
    expect(weiter('/lernen/ablauf', 'ablauf=sc-injektion&modus=fehler')).toBe('/lernen/fertigkeiten?uebung=ablauf&ablauf=sc-injektion&modus=fehler');
  });
  it('holt Reanimation, ABCDE und Labor-Werkbank aus alten und Zwischen-Adressen', () => {
    expect(weiter('/lernen/notfall', 'modus=rea')).toBe('/lernen/fertigkeiten?uebung=rea');
    expect(weiter('/lernen/wissen', 'fach=notfall&modus=abcde')).toBe('/lernen/fertigkeiten?uebung=abcde');
    expect(weiter('/lernen/labor', 'modus=werkbank&station=meldung')).toBe('/lernen/fertigkeiten?uebung=werkbank&station=meldung');
    expect(weiter('/lernen/wissen', 'fach=labor&modus=werkbank')).toBe('/lernen/fertigkeiten?uebung=werkbank');
    // Wissensfragen bleiben im Wissenstrainer
    expect(weiter('/lernen/notfall', 'bereich=bls')).toBeUndefined();
    expect(weiter('/lernen/wissen', 'fach=notfall')).toBeUndefined();
    expect(weiterleitungFuer('/lernen/notfall', new URLSearchParams('bereich=bls'))).toBe('/lernen/wissen?fach=notfall&bereich=bls');
  });
  it('jede Übung hat einen Steckbrief, das Menü einen Eintrag statt sieben', () => {
    for (const u of UEBUNG_IDS) expect(UEBUNG_INFO_FERTIG[u], u).toBeDefined();
    const pfade = flatNav(NAV).map((n) => n.path);
    expect(pfade).toContain('/lernen/fertigkeiten');
    for (const alt of ['/lernen/rechnen', '/lernen/hoeren', '/lernen/ablauf']) expect(pfade).not.toContain(alt);
    expect(fertigPfad('ablauf', { ablauf: 'x' })).toBe('/lernen/fertigkeiten?uebung=ablauf&ablauf=x');
  });
});
