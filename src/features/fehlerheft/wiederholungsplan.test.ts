import { describe, expect, it } from 'vitest';
import { erzeuge } from '../rechnen/aufgaben';
import { ausRechentrainer } from './quellen';
import {
  auffrischen, faellig, HARTNAECKIG_AB, INTERVALLE, istGefestigt, istHartnaeckig, merke, plusTage, ueberblick, vorschau, wiederholt,
  type Fehler, type NeuerFehler,
} from './fehlerheft';

const tag = (t: string) => new Date(`${t}T10:00:00`);
const fehler = (seed = 1): NeuerFehler => ausRechentrainer(erzeuge('mgkg', 2, seed), '7');

describe('Wiederholungsplan im Fehlerheft', () => {
  it('rechnet Tage über Monatsgrenzen', () => {
    expect(plusTage('2026-10-30', 3)).toBe('2026-11-02');
    expect(plusTage('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('wachsende Abstände: morgen, dann 3, dann 7 Tage', () => {
    let l = merke([], [fehler()], tag('2026-10-01'));
    const id = l[0]!.id;
    expect(l[0]).toMatchObject({ stufe: 0, faelligAm: '2026-10-02' });
    l = wiederholt(l, id, true, '1', tag('2026-10-02'));
    expect(l[0]).toMatchObject({ stufe: 1, faelligAm: '2026-10-05' });
    expect(faellig(l, tag('2026-10-04'))).toHaveLength(0);
    expect(faellig(l, tag('2026-10-05'))).toHaveLength(1);
    l = wiederholt(l, id, true, '1', tag('2026-10-05'));
    expect(l[0]).toMatchObject({ stufe: 2, faelligAm: '2026-10-12', behoben: '2026-10-05' });
    // Behoben, aber zum Auffrischen wieder dran
    expect(faellig(l, tag('2026-10-12'))).toHaveLength(0);
    expect(auffrischen(l, tag('2026-10-11'))).toHaveLength(0);
    expect(auffrischen(l, tag('2026-10-12'))).toHaveLength(1);
    l = wiederholt(l, id, true, '1', tag('2026-10-12'));
    expect(l[0]).toMatchObject({ stufe: 3, faelligAm: '2026-10-26', auffrischungen: 1 });
  });

  it('mehrfach richtig am selben Tag springt nicht über Stufen', () => {
    let l = merke([], [fehler()], tag('2026-10-01'));
    const id = l[0]!.id;
    l = wiederholt(l, id, true, '1', tag('2026-10-02'));
    l = wiederholt(l, id, true, '1', tag('2026-10-02'));
    expect(l[0]!.stufe).toBe(1);
  });

  it('nach der letzten Stufe gilt der Eintrag als gefestigt und kommt nicht mehr', () => {
    let l = merke([], [fehler()], tag('2026-01-01'));
    const id = l[0]!.id;
    let t = '2026-01-01';
    for (let i = 0; i < INTERVALLE.length; i++) {
      t = l[0]!.faelligAm!;
      l = wiederholt(l, id, true, '1', tag(t));
    }
    expect(istGefestigt(l[0]!)).toBe(true);
    expect(l[0]!.faelligAm).toBeUndefined();
    expect(auffrischen(l, tag('2027-12-31'))).toHaveLength(0);
    expect(ueberblick(l, tag('2027-01-01'))).toMatchObject({ gefestigt: 1, auffrischen: 0 });
  });

  it('ein Fehler beim Auffrischen ist ein Rückfall auf Stufe 0', () => {
    let l = merke([], [fehler()], tag('2026-10-01'));
    const id = l[0]!.id;
    l = wiederholt(l, id, true, '1', tag('2026-10-02'));
    l = wiederholt(l, id, true, '1', tag('2026-10-05'));
    l = wiederholt(l, id, false, '9', tag('2026-10-12'));
    expect(l[0]).toMatchObject({ stufe: 0, faelligAm: '2026-10-13', behoben: undefined, treffer: [] });
  });

  it('alte Einträge ohne Plan bleiben wie bisher jeden Tag dran', () => {
    const alt: Fehler = { ...merke([], [fehler()], tag('2026-10-01'))[0]!, stufe: undefined, faelligAm: undefined };
    expect(faellig([alt], tag('2026-10-02'))).toHaveLength(1);
    const l = wiederholt([alt], alt.id, true, '1', tag('2026-10-02'));
    expect(l[0]).toMatchObject({ stufe: 1, faelligAm: '2026-10-05' });
  });

  it('hartnäckige Fehler und sichere Irrtümer stehen vorn', () => {
    let l = merke([], [fehler()], tag('2026-10-01'));
    const id = l[0]!.id;
    for (let i = 1; i < HARTNAECKIG_AB; i++) l = merke(l, [fehler(i + 1)], tag('2026-10-01'));
    expect(istHartnaeckig(l[0]!)).toBe(true);
    l = merke(l, [{ ...fehler(), id: 'x:1', sicherheit: 'sicherer-irrtum' }, { ...fehler(), id: 'x:2' }], tag('2026-10-01'));
    const reihe = faellig(l, tag('2026-10-02')).map((f) => f.id);
    expect(reihe).toEqual(['x:1', id, 'x:2']);
    expect(ueberblick(l, tag('2026-10-02')).hartnaeckig).toBe(1);
  });

  it('Vorschau verteilt Termine auf die nächsten Tage', () => {
    let l = merke([], [fehler(), { ...fehler(), id: 'y' }], tag('2026-10-01'));
    l = wiederholt(l, 'y', true, '1', tag('2026-10-02'));
    const v = vorschau(l, tag('2026-10-02'), 7);
    expect(v[0]).toMatchObject({ tag: '2026-10-02', offen: 1 });
    expect(v[3]).toMatchObject({ tag: '2026-10-05', offen: 1 });
    expect(v.reduce((s, x) => s + x.offen + x.auffrischen, 0)).toBe(2);
  });
});
