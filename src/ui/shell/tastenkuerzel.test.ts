import { describe, expect, it } from 'vitest';
import { sprungZiel } from './Tastenkuerzel';

const k = (code: string, mod: Partial<{ altKey: boolean; ctrlKey: boolean; metaKey: boolean }> = {}) =>
  ({ altKey: false, ctrlKey: false, metaKey: false, code, ...mod });

describe('sprungZiel', () => {
  it('Alt/Wahltaste + Ziffer springt zu den Hauptseiten', () => {
    expect(sprungZiel(k('Digit1', { altKey: true }))).toBe('/');
    expect(sprungZiel(k('Digit4', { altKey: true }))).toBe('/lernen/karten');
  });
  it('ohne Alt, mit weiteren Tasten oder unbekannte Ziffer: nichts', () => {
    expect(sprungZiel(k('Digit1'))).toBeNull();
    expect(sprungZiel(k('Digit1', { altKey: true, metaKey: true }))).toBeNull();
    expect(sprungZiel(k('Digit9', { altKey: true }))).toBeNull();
  });
});
