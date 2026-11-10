import { describe, expect, it } from 'vitest';
import { SCENARIOS } from './catalog';
import { start } from './engine';
import { atemDauer, hautton, lage, lageVon, sprechblase, szene, VERWEILDAUER } from './szene';
import { dispatch } from './testhilfe';
import type { Session } from './types';

const byId = (id: string) => SCENARIOS.find(s => s.id === id)!;
const act = (s: Session, id: string) => dispatch(s, { type: 'action', id });
const wait = (s: Session, seconds: number) => dispatch(s, { type: 'advance', seconds });

describe('Zimmerszene', () => {
  it('leitet für jeden Fall eine Szene ab, ohne Zahlen zu verraten', () => {
    for (const sc of SCENARIOS) {
      const z = szene(start(sc, 2));
      expect(z.atemSek, sc.id).toBeGreaterThan(0);
      expect(z.herzSek, sc.id).toBeGreaterThan(0);
      expect(z.pflegeBei, sc.id).toBe('tuer');
      expect(z.monitoring, sc.id).toBe(false);
      expect(z.alarm, sc.id).toBe('kein');
    }
  });
  it('Atmung folgt der Atemfrequenz', () => {
    expect(atemDauer(30)).toBeCloseTo(2);
    expect(atemDauer(12)).toBeCloseTo(5);
    expect(atemDauer(200)).toBeCloseTo(60 / 45);
  });
  it('Hautfarbe folgt Sauerstoff, Kreislauf und Fieber', () => {
    const v = { pulse: 80, sys: 120, dia: 80, spo2: 97, resp: 16, temp: 36.8, glucose: 100, pain: 0 };
    expect(hautton(v)).toBe('rosig');
    expect(hautton({ ...v, spo2: 85 })).toBe('zyanotisch');
    expect(hautton({ ...v, sys: 82 })).toBe('grau');
    expect(hautton({ ...v, temp: 39.2 })).toBe('geroetet');
  });
  it('Pflegekraft geht zum Ort der letzten Handlung, Messen zeigt die Manschette', () => {
    let s = act(start(byId('nachtwache'), 2), 'vitals');
    expect(szene(s).pflegeBei).toBe('monitor');
    expect(szene(s).handlung?.art).toBe('messen');
    s = act(s, 'help');
    expect(szene(s).pflegeBei).toBe('telefon');
  });
  it('Monitoring schaltet den Schirm ein und Alarm nach NEWS2', () => {
    const s = act(start(byId('nachtwache'), 2), 'monitor');
    const z = szene(s);
    expect(z.monitoring).toBe(true);
    expect(['kein', 'gelb', 'rot']).toContain(z.alarm);
  });
  it('Hilfe kommt nach der Anfahrtszeit ins Zimmer und geht wieder', () => {
    let s = act(start(byId('nachtwache'), 2), 'help');
    expect(szene(s).figuren.some(f => f.art === 'kollege')).toBe(false);
    s = wait(s, 5 * 60);
    expect(szene(s).figuren.some(f => f.art === 'kollege')).toBe(true);
    expect(szene(s).figuren.length).toBeLessThanOrEqual(3);
    expect(VERWEILDAUER).toBeGreaterThan(0);
  });
  it('Gespräche erscheinen als Rede der Patientin/des Patienten', () => {
    const s = act(start(byId('nachtwache'), 2), 'patient');
    const b = sprechblase(s, s.events.at(-1));
    expect(b?.quelle).toBe('patient');
    expect(b?.ton).toBe('rede');
  });
  it('Flachlagern ändert die Lage im Bett', () => {
    const sc = SCENARIOS.find(x => x.actions.some(a => a.id === 'lie_flat' || a.id === 'flat'))!;
    const id = sc.actions.find(a => a.id === 'lie_flat' || a.id === 'flat')!.id;
    const s = act(start(sc, 2), id);
    expect(['flach', 'sitzend']).toContain(szene(s).lage);
  });
  it('Lagerung: Oberkörper, Schocklage und Bein werden unterschieden', () => {
    const l = (label: string) => lageVon({ id: 'x', label });
    expect(l('Sofort flach hinlegen, Beine hoch')).toBe('schock');
    expect(l('Flach lagern, Beine hoch, wenn sie schwindelig wird')).toBe('schock');
    expect(l('Verband und Drainage kontrollieren, Bein hochlagern, Druckverband nach Standard')).toBe('bein');
    expect(l('Atemerleichternde Position unterstützen und Flüssigkeitsbilanz beginnen')).toBe('erhoeht');
    expect(l('Zum Schlafen flach hinlegen und beruhigen')).toBe('flach');
    expect(l('Demenz heim: Oberkörper hoch lagern, Mund pflegen')).toBe('erhoeht');
    expect(l('Beine vergleichen: Umfang, Farbe, Schmerz')).toBeUndefined();
  });
  it('Korrektur nach Flachlagerung hebt den Oberkörper wieder', () => {
    let s = act(start(byId('nachtwache'), 2), 'flat');
    expect(lage(s, false)).toBe('flach');
    s = act(s, 'care');
    expect(lage(s, false)).toBe('erhoeht');
  });
});
