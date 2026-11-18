// Fall „Sie schläft so tief“ (Aufwachraum): guter Weg stabilisiert, Opioid und frühe Verlegung werden als Fehlhandlung erkannt.
import { describe, expect, it } from 'vitest';
import { SCENARIOS } from './catalog';
import { clinicalDebrief, consciousness, start } from './engine';
import { dispatch } from './testhilfe';
import type { Command, Session } from './types';

const fall = SCENARIOS.find((s) => s.id === 'aufwachraum')!;
const spiele = (cmds: Command[]): Session => cmds.reduce((s, c) => dispatch(s, c), start(fall));
const act = (id: string): Command => ({ type: 'action', id });

describe('Praxisfall Aufwachraum', () => {
  it('startet schläfrig mit Sauerstoff und langsamer Atmung', () => {
    const s = start(fall);
    expect(fall.setting).toBe('aufwachraum');
    expect(consciousness(s)).toBe('V');
    expect(s.oxygen).toBe(true);
    expect(fall.initial.resp).toBeLessThanOrEqual(8);
  });

  it('guter Weg: Atemweg, Anästhesie, Naloxon-Wirkung prüfen, CPAP, Kriterien: keine Atempause, wach', () => {
    const s = spiele([act('assessment'), act('vitals'), act('care'), act('help'), { type: 'advance', seconds: 60 }, act('orders'), { type: 'advance', seconds: 90 },
      act('wach'), act('cpap'), act('aldrete'), act('reassess'), { type: 'advance', seconds: 1200 }]);
    expect(s.story?.apnoe).toBe('prevented');
    expect(consciousness(s)).toBe('A');
    expect(s.harms ?? []).toEqual([]);
    expect(s.vitals.spo2).toBeGreaterThanOrEqual(92);
    expect(s.flags.kriterien_abgewartet).toBeDefined();
  });

  it('weiteres Opioid und Verlegung ohne Kriterien sind Fehlhandlungen', () => {
    const s = spiele([act('piri'), act('verlegen'), { type: 'advance', seconds: 400 }]);
    expect((s.harms ?? []).map((h) => h.id)).toEqual(expect.arrayContaining(['piri', 'verlegen']));
    expect(s.story?.tiefer).toBe('fired');
    expect(s.story?.apnoe).toBe('fired');
    expect(clinicalDebrief(s)).toBeTruthy();
  });
});
