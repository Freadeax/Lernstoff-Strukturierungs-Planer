import { describe, expect, it } from 'vitest';
import { SCENARIOS, RESOURCES } from './catalog';
import { clinicalDebrief, consciousness, dispatch, news2Of, replay, start, storyTime } from './engine';
import { news2Punkte } from './news2';
import { parseScenario } from './storage';
import type { Scenario, Session } from './types';

const byId = (id: string) => SCENARIOS.find(s => s.id === id)!;
const act = (s: Session, id: string) => dispatch(s, { type: 'action', id });
const wait = (s: Session, seconds: number) => dispatch(s, { type: 'advance', seconds });

describe('Praxissimulator – klinischer Verlauf', () => {
  it('gibt jedem Fall Verlauf, Lernimpulse und Fallausgang', () => {
    expect(SCENARIOS.length).toBeGreaterThanOrEqual(12);
    for (const s of SCENARIOS) {
      expect(s.storyline?.length, s.id).toBeGreaterThanOrEqual(3);
      expect(s.storyline!.some(e => e.kind === 'komplikation'), s.id).toBe(true);
      expect(s.teaching?.length, s.id).toBeGreaterThanOrEqual(2);
      expect(s.outcome, s.id).toBeDefined();
      expect(s.actions.some(a => a.harm), `${s.id}: mindestens eine Fehlhandlung`).toBe(true);
    }
  });

  it('löst eine Komplikation aus, wenn niemand eingreift', () => {
    const scenario = byId('nachtwache');
    const event = scenario.storyline!.find(e => e.id === 'lungenoedem')!;
    const s = wait(start(scenario, 2), storyTime(event.at, 2));
    expect(s.story?.lungenoedem).toBe('fired');
    expect(s.events.some(e => e.kind === 'story' && e.title.includes('schaumiger Auswurf'))).toBe(true);
    expect(s.drifts?.map(d => d.id)).toContain('lungenoedem');
    expect(clinicalDebrief(s).complications.map(c => c.id)).toContain('lungenoedem');
  });

  it('verhindert die Komplikation durch rechtzeitiges Handeln und nennt das im Debriefing', () => {
    const scenario = byId('nachtwache');
    const s = wait(act(start(scenario, 2), 'care'), 1200);
    expect(s.story?.lungenoedem).toBe('prevented');
    expect(clinicalDebrief(s).prevented.map(p => p.id)).toContain('lungenoedem');
  });

  it('meldet einen unbehandelten Verlauf als nicht stabil', () => {
    const scenario = byId('sepsis');
    expect(clinicalDebrief(wait(start(scenario, 2), 600)).final.unstable).toBe(true);
    const behandelt = wait(act(act(start(scenario, 2), 'help'), 'orders'), 600);
    expect(behandelt.flags.orders).toBeDefined();
    expect(clinicalDebrief(behandelt).final.unstable).toBe(false);
  });

  it('rechnet Folgeereignisse ab der auslösenden Handlung', () => {
    const scenario = byId('pflegeheim');
    let s = act(wait(start(scenario, 2), 2400), 'care');
    s = wait(s, 60); expect(s.story?.rebound).toBeUndefined();
    s = wait(s, 2400); expect(s.story?.rebound).toBe('fired');
    const mitMahlzeit = wait(act(act(wait(start(scenario, 2), 2400), 'care'), 'meal'), 2500);
    expect(mitMahlzeit.story?.rebound).toBe('prevented');
  });

  it('zählt den Notruf als Eskalation', () => {
    const scenario = byId('schlaganfall');
    const s = act(act(wait(start(scenario, 2), 1200), 'vitals'), 'ems');
    expect(clinicalDebrief(s).escalation).toBe('zeitnah');
  });

  it('meldet eine unversorgte Sturzfolge als nicht stabil', () => {
    const scenario = byId('reha');
    const gestuerzt = wait(act(start(scenario, 2), 'alone'), 60);
    expect(gestuerzt.story?.sturz).toBe('fired');
    expect(clinicalDebrief(gestuerzt).final.unstable).toBe(true);
    expect(clinicalDebrief(act(gestuerzt, 'fall_care')).final.unstable).toBe(false);
  });

  it('verschiebt Ereignisse nach Ausbildungsstufe', () => {
    expect(storyTime(600, 1)).toBe(900); expect(storyTime(600, 2)).toBe(600); expect(storyTime(600, 3)).toBe(450);
  });

  it('löst Fehlhandlungsfolgen nur nach der Fehlhandlung aus', () => {
    const scenario = byId('hausbesuch');
    const ruhig = wait(start(scenario), 120);
    expect(ruhig.story?.sturz).toBeUndefined();
    const s = wait(act(start(scenario), 'unsupervised'), 60);
    expect(s.harms?.[0]?.id).toBe('unsupervised');
    expect(s.events.some(e => e.kind === 'warning' && e.title.startsWith('Folge:'))).toBe(true);
    expect(s.story?.sturz).toBe('fired'); expect(s.flags.fallen).toBeDefined();
  });

  it('fängt eine Fehlhandlung durch vorherige Prophylaxe ab', () => {
    const scenario = byId('hausbesuch');
    const s = wait(act(act(start(scenario), 'fallsafe'), 'unsupervised'), 60);
    expect(s.story?.sturz).toBe('prevented'); expect(s.flags.fallen).toBeUndefined();
  });

  it('beendet eine anhaltende Verschlechterung über stoppedBy', () => {
    const scenario = byId('its');
    let s = wait(start(scenario, 2), storyTime(240, 2));
    expect(s.drifts?.some(d => d.id === 'bradykardie')).toBe(true);
    s = wait(act(s, 'care'), 2);
    expect(s.drifts?.some(d => d.id === 'bradykardie')).toBe(false);
  });

  it('trübt bei Unterzuckerung physiologisch ein und erholt sich nach Versorgung', () => {
    const scenario = byId('pflegeheim');
    const s = wait(start(scenario, 2), 300);
    expect(['V', 'P']).toContain(consciousness(s));
    const versorgt = act(start(scenario, 2), 'care');
    expect(consciousness(versorgt)).toBe('A');
  });

  it('zeichnet Messungen als Kurve auf und rechnet NEWS2 mit Bewusstsein und Sauerstoff', () => {
    const scenario = byId('sepsis');
    let s = act(start(scenario, 2), 'vitals');
    expect(s.chart).toHaveLength(1);
    const first = news2Of(s.chart![0]);
    expect(s.chart![0].avpu).toBe('C');
    expect(first.punkte).toBeGreaterThanOrEqual(5);
    s = act(wait(s, 600), 'vitals');
    expect(s.chart).toHaveLength(2);
    expect(s.chart![1].vitals.sys).toBeLessThan(s.chart![0].vitals.sys);
  });

  it('bewertet die Eskalation nach dem ersten auffälligen NEWS2', () => {
    const scenario = byId('sepsis');
    let s = act(start(scenario, 2), 'vitals');
    expect(clinicalDebrief(s).escalation).toBe('nicht eskaliert');
    s = act(wait(s, 120), 'help');
    const d = clinicalDebrief(s);
    expect(d.escalation).toBe('zeitnah'); expect(d.escalationMinutes).toBe(3);
    const vorher = act(act(start(scenario, 2), 'help'), 'vitals');
    expect(clinicalDebrief(vorher).escalation).toBe('vorausschauend');
  });

  it('beschleunigt die ärztliche Rückmeldung nach strukturierter SBAR', () => {
    const scenario = byId('sepsis');
    const sbar = dispatch(start(scenario), { type: 'sbar', fields: ['Neue Verwirrtheit', 'Harnwegsinfekt', 'NEWS2 hoch', 'Bitte sofort ansehen'] });
    const mit = act(act(sbar, 'help'), 'orders'); const ohne = act(act(start(scenario), 'help'), 'orders');
    const due = (s: Session) => s.pending.find(p => p.id === 'orders')!.due - s.time;
    expect(due(mit)).toBe(Math.ceil(RESOURCES.station.helpMinutes * 60 / 2)); expect(due(ohne)).toBe(RESOURCES.station.helpMinutes * 60);
  });

  it('zählt Sauerstoffgabe im NEWS2', () => {
    const scenario = byId('nachtwache');
    let s = act(act(start(scenario), 'help'), 'orders'); s = wait(s, 300);
    s = act(act(s, 'oxygen'), 'vitals');
    expect(s.oxygen).toBe(true); expect(s.chart!.at(-1)!.oxygen).toBe(true);
    expect(news2Of(s.chart!.at(-1)!).teil[2]).toBe(2);
  });

  it('bleibt mit Verlauf, Fehlhandlungen und Kurve exakt wiederholbar', () => {
    for (const scenario of SCENARIOS) {
      let s = act(start(scenario, 3, 7), 'vitals');
      const harm = scenario.actions.find(a => a.harm && !a.requires)!;
      s = act(s, harm.id); s = wait(s, 1800); s = act(s, 'monitor'); s = wait(s, 900); s = act(s, 'vitals');
      s = dispatch(s, { type: 'finish' });
      expect(replay(s), scenario.id).toEqual(s);
    }
  });

  it('nimmt ältere Spielstände ohne klinische Felder an', () => {
    const scenario = byId('nachtwache');
    const alt = start(scenario) as Partial<Session>;
    delete alt.chart; delete alt.story; delete alt.drifts; delete alt.harms; delete alt.avpu; delete alt.oxygen;
    const s = act(alt as Session, 'vitals');
    expect(s.chart).toHaveLength(1); expect(clinicalDebrief(s).harms).toEqual([]);
  });

  it('prüft importierte Verlaufsereignisse', () => {
    const base = byId('nachtwache');
    const broken: ((s: Scenario) => void)[] = [
      s => { s.storyline![0].kind = 'zauberei' as 'team'; },
      s => { s.storyline![0].unless = ['unbekannt']; },
      s => { s.storyline![0].drift = { spo2: -1 }; delete s.storyline![0].stoppedBy; },
      s => { s.storyline!.push({ ...s.storyline![0] }); },
      s => { s.initialAvpu = 'X' as 'A'; },
      s => { s.actions[0].avpu = 'Z' as 'A'; },
      s => { s.storyline![0].at = 0; },
    ];
    for (const mutate of broken) { const s = structuredClone(base); mutate(s); expect(() => parseScenario(JSON.stringify(s))).toThrow(); }
  });
});

describe('NEWS2', () => {
  it('rechnet die Punktetabelle', () => {
    expect(news2Punkte({ af: 16, spo2: 97, sauerstoff: false, sys: 120, puls: 70, avpu: 'A', temp: 37 })).toMatchObject({ punkte: 0, risiko: 'niedrig' });
    expect(news2Punkte({ af: 16, spo2: 97, sauerstoff: false, sys: 120, puls: 70, avpu: 'C', temp: 37 })).toMatchObject({ punkte: 3, risiko: 'niedrig-mittel' });
    expect(news2Punkte({ af: 23, spo2: 94, sauerstoff: false, sys: 104, puls: 108, avpu: 'A', temp: 38.7 }).punkte).toBe(2 + 1 + 1 + 1 + 1);
    expect(news2Punkte({ af: 26, spo2: 89, sauerstoff: true, sys: 105, puls: 115, avpu: 'A', temp: 37.2 })).toMatchObject({ punkte: 11, risiko: 'hoch' });
  });
});
