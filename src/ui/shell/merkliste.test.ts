import { describe, expect, it } from 'vitest';
import { bereinigt, MAX_FAVORITEN, MAX_ZULETZT, mitBesuch, mitFavorit, type Merkliste } from './merkliste';

const leer: Merkliste = { favoriten: [], zuletzt: [] };

describe('Merkliste', () => {
  it('setzt und löst Favoriten, „Heute“ nie', () => {
    const a = mitFavorit(leer, '/lernen/karten');
    expect(a.favoriten).toEqual(['/lernen/karten']);
    expect(mitFavorit(a, '/lernen/karten').favoriten).toEqual([]);
    expect(mitFavorit(leer, '/')).toBe(leer);
  });
  it('begrenzt Favoriten, der älteste fällt heraus', () => {
    let m = leer;
    for (let i = 0; i <= MAX_FAVORITEN; i++) m = mitFavorit(m, `/s/${i}`);
    expect(m.favoriten).toHaveLength(MAX_FAVORITEN);
    expect(m.favoriten[0]).toBe('/s/1');
  });
  it('führt „Zuletzt“ ohne Dubletten, neueste zuerst', () => {
    let m = mitBesuch(mitBesuch(mitBesuch(leer, '/a'), '/b'), '/a');
    expect(m.zuletzt).toEqual(['/a', '/b']);
    expect(mitBesuch(m, '/a')).toBe(m);
    expect(mitBesuch(m, '/')).toBe(m);
    for (let i = 0; i < 10; i++) m = mitBesuch(m, `/s/${i}`);
    expect(m.zuletzt).toHaveLength(MAX_ZULETZT);
  });
  it('verwirft kaputte gespeicherte Stände', () => {
    expect(bereinigt(null)).toEqual(leer);
    expect(bereinigt({ favoriten: ['/a', 3, 'x', '/a', '/'], zuletzt: 'nein' })).toEqual({ favoriten: ['/a'], zuletzt: [] });
  });
});
