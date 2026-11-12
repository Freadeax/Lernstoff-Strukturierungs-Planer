import { describe, expect, it } from 'vitest';
import { adressArt, mussUmziehen } from './hosting';

describe('Umzugshinweis', () => {
  it('erscheint nur auf der alten Adresse und nur, wenn eine neue eingetragen ist', () => {
    expect(mussUmziehen('freadeax.github.io', '', true)).toBe(false);
    expect(mussUmziehen('freadeax.github.io', 'https://lernstoff.pages.dev/', true)).toBe(true);
    expect(mussUmziehen('lernstoff.pages.dev', 'https://lernstoff.pages.dev/', true)).toBe(false);
    expect(mussUmziehen('127.0.0.1', 'https://lernstoff.pages.dev/', true)).toBe(false);
    expect(mussUmziehen('freadeax.github.io', 'kaputt', true)).toBe(false);
  });

  it('bleibt aus, solange beide Adressen parallel laufen (UMZUG_HINWEIS_AKTIV = false)', () => {
    expect(mussUmziehen('freadeax.github.io', 'https://lernstoff.pages.dev/')).toBe(false);
  });

  it('ordnet die Adresse für die sichtbare Angabe ein', () => {
    expect(adressArt('lernstoff.pages.dev', 'https://lernstoff.pages.dev/')).toBe('offiziell');
    expect(adressArt('freadeax.github.io', 'https://lernstoff.pages.dev/')).toBe('alt');
    expect(adressArt('127.0.0.1', 'https://lernstoff.pages.dev/')).toBe('andere');
    expect(adressArt('127.0.0.1', '')).toBe('andere');
  });
});
