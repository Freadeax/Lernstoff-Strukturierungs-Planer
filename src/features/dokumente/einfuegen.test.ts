import { describe, expect, it } from 'vitest';
import { aufraeumen, dateiName, titelAus } from './einfuegen';

describe('Text einfügen', () => {
  it('räumt Leerzeilen auf und hält Listen zusammen', () => {
    expect(aufraeumen('# A\n\n\n\n- x\n\n- y\n\nText  \n')).toBe('# A\n\n- x\n- y\n\nText');
  });
  it('nimmt die erste Überschrift als Titel und kürzt lange Zeilen', () => {
    expect(titelAus('\n## Dekubitusprophylaxe\nText')).toBe('Dekubitusprophylaxe');
    expect(titelAus('x'.repeat(100))).toHaveLength(78);
  });
  it('baut einen sicheren Dateinamen mit .md', () => {
    expect(dateiName('CE 05: Herz/Kreislauf?')).toBe('CE 05 Herz Kreislauf.md');
    expect(dateiName('  ')).toBe('Eingefügter Text.md');
  });
});
