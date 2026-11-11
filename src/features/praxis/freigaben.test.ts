import { describe, expect, it } from 'vitest';
import { gesamtAlarm, monitorGruppe } from '../../ui/sim/monitor';
import { automatischeWertung, freigabeFehler, istGeprueft, kennzeichnung, pruefReihenfolge, type Freigabe } from '../../ui/sim/freigabe';
import { SCENARIOS } from './catalog';
import { FREIGABE_FAELLE, freigabeFuer } from './freigaben';
import { szene } from './szene';
import { start } from './engine';
import { dispatch } from './testhilfe';

describe('Fachliche Freigabe je Praxisfall (SIM-02)', () => {
  it('jeder Fall hat vollständige Freigabefelder', () => {
    for (const s of SCENARIOS) {
      const f = freigabeFuer(s);
      expect(f, s.id).toBeDefined();
      expect(freigabeFehler(f!), s.id).toEqual([]);
    }
    for (const id of FREIGABE_FAELLE) expect(SCENARIOS.some(s => s.id === id), id).toBe(true);
  });
  it('nichts ist als geprüft markiert, solange keine Prüfung eingetragen ist', () => {
    for (const s of SCENARIOS) { expect(istGeprueft(freigabeFuer(s))).toBe(false); expect(kennzeichnung(freigabeFuer(s))).toMatch(/ungeprüft/); }
  });
  it('Kinderfälle: keine automatische Erwachsenen-Wertung; Alarm nach Kinderprofil statt NEWS2', () => {
    for (const id of ['kind', 'asthma']) {
      const sc = SCENARIOS.find(s => s.id === id)!;
      const f = freigabeFuer(sc)!;
      expect(f.zielgruppe).toBe('kinder');
      expect(automatischeWertung(f)).toBe(false);
      const s = dispatch(start(sc, 2), { type: 'action', id: 'monitor' });
      const v = s.vitals;
      const erwartet = gesamtAlarm({ puls: v.pulse, af: v.resp, spo2: v.spo2, sys: v.sys, dia: v.dia, temp: v.temp }, monitorGruppe(sc.age));
      expect(szene(s).alarm, id).toBe(erwartet === 'ok' ? 'kein' : erwartet);
    }
    // Ein 4-jähriges Kind mit Puls 130 ist nach Kinderprofil nicht rot, nach Erwachsenengrenzen schon.
    expect(gesamtAlarm({ puls: 130, af: 26, spo2: 97, sys: 95, temp: 37 }, 'kleinkind')).not.toBe('rot');
    expect(automatischeWertung(freigabeFuer(SCENARIOS.find(s => s.id === 'nachtwache')!))).toBe(true);
  });
  it('Prüfreihenfolge: Medikamente und Notfall vor Fällen ohne Risiko', () => {
    const liste = SCENARIOS.map(s => ({ id: s.id, freigabe: freigabeFuer(s)! }));
    const r = pruefReihenfolge(liste).map(x => x.id);
    expect(r.indexOf('anaphylaxie')).toBeLessThan(r.indexOf('reha'));
    expect(r.indexOf('asthma')).toBeLessThan(r.indexOf('delir'));
  });
  it('ein geprüfter Kinderfall darf automatisch werten', () => {
    const f: Freigabe = { ...freigabeFuer(SCENARIOS.find(s => s.id === 'kind')!)!, status: 'geprueft', pruefung: { rolle: 'Pflegefachperson Pädiatrie', datum: '2026-12-01' } };
    expect(automatischeWertung(f)).toBe(true);
    expect(kennzeichnung(f)).toMatch(/geprüft am 01.12.2026/);
  });
});
