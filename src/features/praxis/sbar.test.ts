import { describe, expect, it } from 'vitest';
import { SCENARIOS } from './catalog';
import { start, storyTime } from './engine';
import { dispatch } from './testhilfe';
import { praxisEreignisse, praxisSbar } from './sbar';

const byId = (id: string) => SCENARIOS.find(s => s.id === id)!;

describe('Praxissimulator – SBAR mit gemeinsamen Grundkriterien', () => {
  it('leitet den Rufanlass aus einer eingetretenen Komplikation ab (sofort)', () => {
    const scenario = byId('nachtwache');
    const ev = scenario.storyline!.find(e => e.id === 'lungenoedem')!;
    let s = dispatch(start(scenario, 2), { type: 'advance', seconds: storyTime(ev.at, 2) });
    expect(praxisEreignisse(s).some(e => e.stufe === 'kritisch' && e.text === ev.title)).toBe(true);
    s = dispatch(s, { type: 'sbar', fields: [`Ich rufe sofort an: ${ev.title}`, 'Herzinsuffizienz bekannt, Furosemid', 'SpO2 85 %, AF 30, ich vermute ein Lungenödem', 'Bitte kommen Sie sofort. Soll ich Sauerstoff geben?'] });
    const g = praxisSbar(s);
    expect(g.anlass!.prioritaet).toBe('sofort');
    expect(g.ergebnis!.find(x => x.id === 'prioritaet')!.status).toBe('ok');
    expect(g.ergebnis!.find(x => x.id === 'rueckfrage')!.status).toBe('ok');
    expect(g.ergebnis!.find(x => x.id === 'rufgrund')!.status).toBe('ok');
  });
  it('ohne SBAR: Anlass vorhanden, keine Bewertung', () => {
    const s = start(byId('nachtwache'), 2);
    const g = praxisSbar(s);
    expect(g.ergebnis).toBeNull();
  });
  it('jeder Fall liefert nach Ablauf aller Ereignisse einen Rufanlass', () => {
    for (const sc of SCENARIOS) {
      const ende = Math.max(...sc.storyline!.map(e => storyTime(e.at, 2)));
      const s = dispatch(start(sc, 2), { type: 'advance', seconds: ende + 60 });
      expect(praxisSbar(s).anlass, sc.id).not.toBeNull();
    }
  });
});
