import { describe, expect, it } from 'vitest';
import { mussUmziehen } from './hosting';

describe('Umzugshinweis', () => {
  it('erscheint nur auf der alten Adresse und nur, wenn eine neue eingetragen ist', () => {
    expect(mussUmziehen('freadeax.github.io', '')).toBe(false);
    expect(mussUmziehen('freadeax.github.io', 'https://lernstoff.pages.dev/')).toBe(true);
    expect(mussUmziehen('lernstoff.pages.dev', 'https://lernstoff.pages.dev/')).toBe(false);
    expect(mussUmziehen('127.0.0.1', 'https://lernstoff.pages.dev/')).toBe(false);
    expect(mussUmziehen('freadeax.github.io', 'kaputt')).toBe(false);
  });
});
