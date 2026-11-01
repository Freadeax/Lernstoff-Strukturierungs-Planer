import { describe, expect, it } from 'vitest';
import { wischAktion } from './gesten';

describe('wischAktion', () => {
  it('öffnet vom linken Rand nach rechts, nur in der App', () => {
    expect(wischAktion({ x: 10, y: 300 }, { x: 120, y: 310 }, false, true)).toBe('oeffnen');
    expect(wischAktion({ x: 10, y: 300 }, { x: 120, y: 310 }, false, false)).toBeNull();
    expect(wischAktion({ x: 80, y: 300 }, { x: 200, y: 310 }, false, true)).toBeNull();
  });
  it('schließt bei offenem Menü nach links', () => {
    expect(wischAktion({ x: 250, y: 300 }, { x: 120, y: 300 }, true, false)).toBe('schliessen');
  });
  it('ignoriert Scrollen und kurze Bewegungen', () => {
    expect(wischAktion({ x: 10, y: 300 }, { x: 80, y: 500 }, false, true)).toBeNull();
    expect(wischAktion({ x: 250, y: 300 }, { x: 220, y: 300 }, true, true)).toBeNull();
  });
});
