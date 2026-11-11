import { describe, expect, it } from 'vitest';
import { automatischeWertung, freigabeFehler, istGeprueft, kennzeichnung } from '../../ui/sim/freigabe';
import { pflegeModule } from '../../modules/pflege';
import { PROBEFAELLE } from './demo';
import { fallThemen, SZENARIEN, szenarioAusThema } from './faelle';
import { alterAus, FREIGABE_FAELLE, freigabeFuerFall, monitorGruppeVon } from './freigaben';
import { szenenBild } from './szene';
import { neuerFall } from './simulator';

const alle = [...SZENARIEN, ...PROBEFAELLE.map((p) => p.szenario)];

describe('Fachliche Freigabe je Fall im Fallsimulator (SIM-02)', () => {
  it('jeder Fall hat einen eigenen, vollständigen Eintrag', () => {
    for (const s of alle) {
      expect(FREIGABE_FAELLE, s.id).toContain(s.id);
      expect(freigabeFehler(freigabeFuerFall(s)), s.id).toEqual([]);
    }
    for (const id of FREIGABE_FAELLE) expect(alle.some((s) => s.id === id), id).toBe(true);
  });
  it('freie Fälle zu Lernplan-Themen bekommen eine vollständige, ungeprüfte Freigabe', () => {
    const t = fallThemen(pflegeModule)[0]!;
    for (const setting of ['krankenhaus', 'paediatrie'] as const) {
      const f = freigabeFuerFall(szenarioAusThema(t, setting));
      expect(freigabeFehler(f)).toEqual([]);
      expect(f.zielgruppe).toBe(setting === 'paediatrie' ? 'kinder' : 'erwachsene');
    }
  });
  it('nichts ist als geprüft markiert', () => {
    for (const s of alle) expect(kennzeichnung(freigabeFuerFall(s)), s.id).toMatch(/ungeprüft/);
    expect(alle.some((s) => istGeprueft(freigabeFuerFall(s)))).toBe(false);
  });
  it('Kinderfälle: Alter erkannt, Freigabe offen, Alarm nach Kinderprofil statt Erwachsenen-Grenzen', () => {
    expect(alterAus('Ben, 7 Jahre, Kinderstation')).toBe(7);
    for (const id of ['demo-asthma', 'asthma-kind', 'fieberkrampf']) {
      const s = alle.find((x) => x.id === id)!;
      const f = freigabeFuerFall(s);
      expect(f.zielgruppe, id).toBe('kinder');
      expect(automatischeWertung(f), id).toBe(false);
      expect(monitorGruppeVon(s), id).not.toBe('erwachsen');
    }
    expect(automatischeWertung(freigabeFuerFall(SZENARIEN.find((s) => s.id === 'sepsis')!))).toBe(true);
    // Puls 128 und AF 28 sind beim Erwachsenen rot, beim Schulkind (Kinderprofil) nicht.
    const fall = neuerFall(PROBEFAELLE.find((p) => p.szenario.id === 'demo-asthma')!.szenario, 1);
    fall.runden.push({ zug: { uhrzeit: '15:00', situation: 'Ben atmet schnell.', zustand: 'verschlechtert', vitalwerte: { rr: '', puls: '128', af: '28', spo2: '97', sauerstoff: '', temp: '', bz: '', schmerz: '', bewusstsein: '' },
      optionen: [], schritt: 'einschaetzung', rueckmeldung: { wertung: 'keine', text: '' }, beendet: false } as never });
    expect(szenenBild(fall).alarm).toBe(true);
    expect(szenenBild(fall, { gruppe: monitorGruppeVon(fall.szenario) }).alarm).toBe(false);
  });
});
