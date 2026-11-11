import { describe, expect, it } from 'vitest';
import { SCENARIOS } from './catalog';
import { start } from './engine';
import { auftragsSchritte } from './auftrag';
import { dispatch } from './testhilfe';

const fall = () => start(SCENARIOS.find(s => s.id === 'nachtwache')!, 1, 7);
const erledigt = (s: ReturnType<typeof fall>) => auftragsSchritte(s).map(x => x.erledigt);

describe('Dein Auftrag', () => {
  it('Schritte folgen dem Spielstand', () => {
    let s = fall();
    expect(erledigt(s)).toEqual([false, false, false, false]);
    s = dispatch(s, { type: 'action', id: 'vitals' });
    expect(erledigt(s)).toEqual([true, false, false, false]);
    s = dispatch(s, { type: 'action', id: 'care' });
    expect(erledigt(s)).toEqual([true, true, false, false]);
    s = dispatch(s, { type: 'action', id: 'vitals' });
    expect(erledigt(s)).toEqual([true, true, true, false]);
    s = dispatch(s, { type: 'note', text: 'Atemnot, Oberkörper hoch gelagert, Wirkung kontrolliert.' });
    s = dispatch(s, { type: 'sbar', fields: ['Akute Atemnot', 'Herzinsuffizienz', 'Tachypnoe', 'Ärztliche Beurteilung'] });
    expect(erledigt(s)).toEqual([true, true, true, true]);
  });
  it('Messen vor der Maßnahme zählt nicht als Verlaufskontrolle', () => {
    let s = dispatch(fall(), { type: 'action', id: 'vitals' });
    s = dispatch(s, { type: 'action', id: 'help' });
    expect(auftragsSchritte(s)[2]!.erledigt).toBe(false);
  });
});
