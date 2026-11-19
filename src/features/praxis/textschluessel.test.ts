import { describe, expect, it } from 'vitest';
import { schluessel, stamm } from './textschluessel';

describe('Schlüsselwörter für Übergabe und Bericht', () => {
  it('Stämme und Schlüsselwörter', () => {
    expect(stamm('Nachblutung')).toBe('nachblutu');
    expect(stamm('Wendt')).toBe('wendt');
    expect(schluessel('Ärztliche Rücksprache und Anordnung', 2)).toEqual(['ruecksprac', 'aerztlic']);
  });
});
