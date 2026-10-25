import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pflegeModule } from '../../modules/pflege';
import { SZENARIEN } from './faelle';
import { AntwortUnlesbar, neuerFall, spieleZug } from './simulator';

const create = vi.fn();
vi.mock('@anthropic-ai/sdk', () => ({
  default: class { beta = { messages: { create } }; },
}));

const antwort = (text: string) => ({ stop_reason: 'end_turn', content: [{ type: 'text', text }] });
const gut = JSON.stringify({ situation: 'Herr K. atmet schwer.', optionen: ['Ich messe die Sättigung.'] });

describe('spieleZug', () => {
  beforeEach(() => create.mockReset());

  it('wiederholt eine unlesbare Antwort einmal still', async () => {
    create.mockResolvedValueOnce(antwort('{"situation": "abgebr')).mockResolvedValueOnce(antwort(gut));
    const z = await spieleZug('sk-test', neuerFall(SZENARIEN[0]!, 1), pflegeModule);
    expect(z.situation).toBe('Herr K. atmet schwer.');
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('gibt nach dem zweiten Fehlversuch auf', async () => {
    create.mockResolvedValue(antwort('kein json'));
    await expect(spieleZug('sk-test', neuerFall(SZENARIEN[0]!, 1), pflegeModule)).rejects.toBeInstanceOf(AntwortUnlesbar);
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('wiederholt Ablehnungen nicht', async () => {
    create.mockResolvedValue({ stop_reason: 'refusal', content: [] });
    await expect(spieleZug('sk-test', neuerFall(SZENARIEN[0]!, 1), pflegeModule)).rejects.toThrow('abgelehnt');
    expect(create).toHaveBeenCalledTimes(1);
  });
});
