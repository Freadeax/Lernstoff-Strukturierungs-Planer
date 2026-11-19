import { describe, expect, it } from 'vitest';
import { istSpaltenSchema } from './akte-ansicht';

describe('Medikationsplan: Schema in Spalten oder als Text', () => {
  it('erkennt Spalten-Schemata', () => {
    for (const s of ['1-0-1-0', '1-0-0', '½-0-½-0', '1 – 0 – 1 – 0', '2', undefined]) expect(istSpaltenSchema(s)).toBe(true);
  });
  it('lässt Uhrzeit- und Intervall-Schemata als Text', () => {
    for (const s of ['8-16-24 Uhr', 'alle 6 h', '1-1-1-1-1', 'morgens 1']) expect(istSpaltenSchema(s)).toBe(false);
  });
});
