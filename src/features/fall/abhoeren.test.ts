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
    expect(abhoerBefund('thema:thema.kl.atmung')).toBeNull();
  });
});

describe('Abhörbefund im KI-Systemprompt', () => {
  it('gibt den festen Befund an Claude weiter, damit Text und Klang zusammenpassen', async () => {
    const { systemPrompt } = await import('./simulator');
    const { SZENARIEN } = await import('./faelle');
    const { pflegeModule } = await import('../../modules/pflege');
    const s = SZENARIEN.find((x) => x.id === 'palliativ')!;
    expect(systemPrompt(s, 1, pflegeModule)).toContain(abhoerBefund('palliativ')!.text);
  });
});
