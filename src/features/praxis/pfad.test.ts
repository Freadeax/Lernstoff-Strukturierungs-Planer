import { describe, expect, it } from 'vitest';
import { fallArtVon, fallWeiterleitung, kurzfallPfad } from './pfad';
import { menueSeiteVon, teilVon } from '../ueben/menue';

describe('Kurzfälle im Praxissimulator (früher Fallsimulator)', () => {
  const q = (s: string) => new URLSearchParams(s);
  it('leitet alte Adressen mit allen Angaben weiter', () => {
    expect(fallWeiterleitung('/lernen/fall', q(''))).toBe('/lernen/praxis?art=kurz');
    expect(fallWeiterleitung('/lernen/fall', q('thema=t.1&kb=kh.x'))).toBe('/lernen/praxis?art=kurz&thema=t.1&kb=kh.x');
    expect(fallWeiterleitung('/lernen/praxis', q('art=kurz'))).toBeUndefined();
    expect(fallWeiterleitung('/lernen/fallakte', q(''))).toBeUndefined();
  });
  it('baut Sprungadressen und erkennt die Fallart', () => {
    expect(kurzfallPfad({ thema: 'a b' })).toBe('/lernen/praxis?art=kurz&thema=a+b');
    expect(fallArtVon(q('art=kurz'))).toBe('kurz');
    expect(fallArtVon(q('neu=x'))).toBe('praxis');
  });
  it('Lernplan-Trainer „fall“ zeigt auf den Praxissimulator', () => {
    expect(menueSeiteVon('fall')).toBe('praxis');
    expect(teilVon('fall')).toEqual({ name: 'Kurzfälle', path: '/lernen/praxis?art=kurz' });
  });
});
