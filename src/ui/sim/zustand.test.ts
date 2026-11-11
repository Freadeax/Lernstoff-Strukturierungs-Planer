import { describe, expect, it } from 'vitest';
import { formFehler, hoechsteStufe, sortiereAlarme, zusammenfassung, type SimZustand } from './zustand';

const leer: SimZustand = { patient: [], geraete: [], material: [], alarme: [], aufgaben: [] };

describe('einheitliche Zustandskomponenten', () => {
  it('Zusammenfassung zählt Alarme und offene Aufgaben', () => {
    expect(zusammenfassung(leer)).toBe('kein Alarm, alle Aufgaben erledigt');
    const z: SimZustand = { ...leer,
      alarme: [{ id: 'a', label: 'Telefon', wert: 'klingelt', stufe: 'achtung' }, { id: 'b', label: 'Monitor', wert: 'SpO₂ 84 %', stufe: 'kritisch' }],
      aufgaben: [{ id: 'x', titel: 'SBAR', status: 'dringend' }, { id: 'y', titel: 'Doku', status: 'offen' }, { id: 'z', titel: 'Blick', status: 'erledigt' }] };
    expect(zusammenfassung(z)).toBe('1 kritischer Alarm, 1 Meldung, 2 Aufgaben offen, davon 1 dringend');
    expect(sortiereAlarme(z.alarme).map((a) => a.id)).toEqual(['b', 'a']);
    expect(hoechsteStufe(z.alarme)).toBe('kritisch');
    expect(hoechsteStufe([])).toBe('aus');
  });
  it('Formprüfung findet doppelte IDs und leere Einträge', () => {
    expect(formFehler({ ...leer, geraete: [{ id: 'm', label: 'Monitor', wert: 'läuft', stufe: 'normal' }, { id: 'm', label: '', wert: '', stufe: 'aus' }] })).toEqual(['geraete: doppelte IDs', 'geraete/m: leer']);
  });
});
