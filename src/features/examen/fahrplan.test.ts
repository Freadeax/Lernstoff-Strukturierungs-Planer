import { describe, expect, it } from 'vitest';
import type { MasteryStatus } from '../../core/types';
import { baueFahrplan, naechsterSchritt, phaseFuer, PHASE_AB } from './fahrplan';

const fakten = (s: Record<string, MasteryStatus>, faellig: string[] = [], fehler: Record<string, number> = {}) => ({
  status: new Map(Object.entries(s)), faellig: new Set(faellig), fehler: new Map(Object.entries(fehler)),
});
const CES = [
  { id: 'ce.01', code: 'CE 01', name: 'Eins', topicIds: ['a', 'b'] },
  { id: 'ce.02', code: 'CE 02', name: 'Zwei', topicIds: ['b', 'c', 'd'] },
  { id: 'ce.03', code: 'CE 03', name: 'Leer', topicIds: ['x'] },
];

describe('Prüfungsfahrplan', () => {
  it('ordnet Phasen nach Tagen bis zur schriftlichen Prüfung', () => {
    expect(phaseFuer(null)).toBe('ohne_termin');
    expect(phaseFuer(-1)).toBe('vorbei');
    expect(phaseFuer(0)).toBe('festigen');
    expect(phaseFuer(PHASE_AB.festigen)).toBe('festigen');
    expect(phaseFuer(PHASE_AB.festigen + 1)).toBe('luecken');
    expect(phaseFuer(PHASE_AB.luecken + 1)).toBe('ueberblick');
    expect(phaseFuer(PHASE_AB.ueberblick + 1)).toBe('mitlernen');
  });

  it('zählt je CE, lässt CE ohne bekannte Themen weg und sortiert die schwächste zuerst', () => {
    const p = baueFahrplan(CES, fakten({ a: 'sicher', b: 'sicher', c: 'offen', d: 'bearbeitet' }), 100);
    expect(p.zeilen.map((z) => z.code)).toEqual(['CE 02', 'CE 01']);
    expect(p.zeilen[0]!.zahl).toEqual({ offen: 1, bearbeitet: 1, unsicher: 0, sicher: 1 });
    expect(p.zeilen[1]!.staerke).toBe(100);
    expect(p.fokus.map((z) => z.code)).toEqual(['CE 02']);
    expect(p.themenGesamt).toBe(4);
    expect(p.offenGesamt).toBe(2);
  });

  it('rechnet das Wochenpensum bis zur Festigungsphase', () => {
    const p = baueFahrplan(CES, fakten({ a: 'offen', b: 'bearbeitet', c: 'offen', d: 'unsicher' }), PHASE_AB.festigen + 14);
    expect(p.wochenBisFestigen).toBe(2);
    expect(p.proWoche).toBe(2); // 3 nie abgefragt / 2 Wochen
    expect(baueFahrplan(CES, fakten({ a: 'offen' }), null).proWoche).toBeNull();
  });

  it('schlägt in der Festigungsphase nie Neues vor', () => {
    const z = { zahl: { offen: 3, bearbeitet: 0, unsicher: 0, sicher: 0 }, faellig: 0, fehler: 0 };
    expect(naechsterSchritt(z, 'luecken').art).toBe('erarbeiten');
    expect(naechsterSchritt(z, 'festigen').art).toBe('halten');
    expect(naechsterSchritt({ ...z, faellig: 2 }, 'festigen').art).toBe('wiederholen');
    expect(naechsterSchritt({ ...z, fehler: 1 }, 'festigen').art).toBe('fehler');
  });

  it('meldet „halten“, wenn alles sicher ist', () => {
    const p = baueFahrplan(CES, fakten({ a: 'sicher', b: 'sicher', c: 'sicher', d: 'sicher' }), 30);
    expect(p.zeilen.every((z) => z.schritt.art === 'halten')).toBe(true);
    expect(p.fokus).toEqual([]);
    expect(p.proWoche).toBe(0);
  });
});
