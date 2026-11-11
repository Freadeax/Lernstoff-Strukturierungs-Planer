import { describe, expect, it } from 'vitest';
import { KLANG } from '../../ui/audio/klaenge';
import { abhoerBefund } from './abhoeren';
import { PROBEFAELLE } from './demo';

describe('Abhören', () => {
  it('jeder Probefall hat einen Befund mit vorhandenen Klängen', () => {
    for (const p of PROBEFAELLE) {
      const b = abhoerBefund(p.szenario.id)!;
      expect(b, p.szenario.id).not.toBeNull();
      expect(KLANG[b.lunge], b.lunge).toBeDefined();
      expect(KLANG[b.herz], b.herz).toBeDefined();
    }
  });
  it('ohne festen Befund kein Abhörknopf', () => {
    expect(abhoerBefund('palliativ')).toBeNull();
  });
});
