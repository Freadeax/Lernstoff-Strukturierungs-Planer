import { describe, expect, it } from 'vitest';
import { pruefeBericht } from '../bericht/pruefung';
import { pruefe } from '../uebergabe/pruefung';
import { SCENARIOS } from './catalog';
import { start } from './engine';
import { dispatch } from './testhilfe';
import type { Session } from './types';
import { berichtFall, messwerte, planVorlage, schluessel, stamm, uebergabeFall } from './weitergabe';

/** Spielt einen Fall mit typischen Schritten: Gespräch, Einschätzung, Messen, Pflege, Arzt. */
function gespielt(id: string, schritte = ['patient', 'assessment', 'inspect', 'vitals', 'care', 'orders', 'lab'], sek = 120): Session {
  const sc = SCENARIOS.find((x) => x.id === id)!;
  let s = start(sc, 1);
  for (const a of schritte) if (sc.actions.some((x) => x.id === a)) s = dispatch(s, { type: 'action', id: a });
  return dispatch(s, { type: 'advance', seconds: sek });
}

describe('Praxisfall weiterbearbeiten', () => {
  it('Stämme und Schlüsselwörter', () => {
    expect(stamm('Nachblutung')).toBe('nachblutu');
    expect(stamm('Wendt')).toBe('wendt');
    expect(schluessel('Ärztliche Rücksprache und Anordnung', 2)).toEqual(['ruecksprac', 'aerztlic']);
  });

  it.each(SCENARIOS.map((s) => s.id))('Übergabe aus %s: Musterübergabe erfüllt alle Punkte', (id) => {
    const s = gespielt(id);
    const f = uebergabeFall(s);
    expect(f.kernpunkte.length).toBeGreaterThanOrEqual(3);
    expect(f.raum, 'Raumfoto').toBeDefined();
    for (const k of f.kernpunkte) expect(k.muster.length, k.id).toBeGreaterThan(0);
    const e = pruefe(f, f.muster);
    expect(e.pflichtFehlend.map((p) => p.id)).toEqual([]);
    expect(e.prozent).toBe(100);
    expect(pruefe(f, '').prozent).toBe(0);
  });

  it.each(SCENARIOS.map((s) => s.id))('Pflegebericht aus %s: Mustereintrag erfüllt alle Pflichtpunkte', (id) => {
    const f = berichtFall(gespielt(id));
    const e = pruefeBericht(f, f.muster);
    expect(e.pflichtFehlend.map((p) => p.id)).toEqual([]);
    expect(e.bausteine.filter((b) => b.status === 'fehlt').map((b) => b.baustein)).toEqual([]);
  });

  it('erwartet nur, was gespielt wurde', () => {
    const nichts = gespielt('nachblutung', [], 30);
    const f = uebergabeFall(nichts);
    expect(f.kernpunkte.map((k) => k.id)).toContain('ungemessen');
    expect(f.kernpunkte.map((k) => k.id)).not.toContain('getan');
    expect(berichtFall(nichts).kernpunkte.map((k) => k.id)).not.toContain('weitergabe');
    const voll = gespielt('nachblutung');
    expect(messwerte(voll).some((w) => w.key === 'pulse' && w.auffaellig)).toBe(true);
    expect(uebergabeFall(voll).kernpunkte.map((k) => k.id)).toEqual(expect.arrayContaining(['patient', 'problem', 'wert-pulse', 'getan']));
  });

  it('Pflegeplanung bekommt Fallbeschreibung und Verlauf', () => {
    const v = planVorlage(gespielt('nachblutung'));
    expect(v.text).toContain('Jonas Wendt');
    expect(v.text).toContain('Knie-Totalendoprothese');
    expect(v.verlauf.split('\n').length).toBeGreaterThan(3);
  });
});
