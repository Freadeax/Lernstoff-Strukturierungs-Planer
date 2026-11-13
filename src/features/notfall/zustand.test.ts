import { describe, expect, it } from 'vitest';
import { formFehler } from '../../ui/sim/zustand';
import { befunden, BUCHSTABEN, beginne, handeln, NOTFAELLE } from './abcde';
import { PROFIL_IDS, PROFILE, szenarienFuer } from './rea';
import { abcdeZustand, reaZustand, type ReaStand } from './zustand';

describe('Zustandstafel im ABCDE-Trainer', () => {
  it('ist für jeden Notfall vom Start bis zum Ende gültig', () => {
    for (const fall of NOTFAELLE) {
      let s = beginne(fall);
      expect(formFehler(abcdeZustand(s))).toEqual([]);
      expect(abcdeZustand(s).alarme.filter((a) => a.id.startsWith('vital:'))).toEqual([]);
      for (const b of BUCHSTABEN) s = befunden(s, b);
      for (const m of fall.massnahmen.filter((x) => !x.falsch)) s = handeln(s, m.id);
      const z = abcdeZustand(s);
      expect(formFehler(z)).toEqual([]);
      for (const b of BUCHSTABEN) expect(z.aufgaben.find((a) => a.id === `befund:${b}`)!.status).toBe('erledigt');
    }
  });

  it('drängt nach zwei Befunden auf Hilfe, ohne Maßnahmen zu verraten', () => {
    const fall = NOTFAELLE[0]!;
    const z = abcdeZustand(befunden(befunden(beginne(fall), 'A'), 'B'));
    expect(z.aufgaben.find((a) => a.id === 'hilfe')!.status).toBe('dringend');
    const titel = z.aufgaben.map((a) => a.titel).join(' ');
    for (const m of fall.massnahmen.filter((x) => x.buchstabe !== 'Team')) expect(titel).not.toContain(m.label);
  });

  it('zeigt Bewusstsein erst nach D', () => {
    const s = befunden(beginne(NOTFAELLE[0]!), 'A');
    expect(abcdeZustand(s).patient.some((p) => p.id === 'bewusstsein')).toBe(false);
    expect(abcdeZustand(befunden(s, 'D')).patient.some((p) => p.id === 'bewusstsein')).toBe(true);
  });
});

describe('Zustandstafel im Reanimationstrainer', () => {
  const phasen: ReaStand['phase'][] = ['start', 'erkennen', 'cpr', 'analyse', 'laden', 'ende'];
  it('ist für jedes Profil und jede Phase gültig und nennt den Rhythmus nicht', () => {
    for (const id of PROFIL_IDS) {
      const profil = PROFILE[id];
      for (const szenario of szenarienFuer(id)) {
        for (const phase of phasen) {
          const z = reaZustand({ profil, szenario, phase, erledigt: [], defiDa: phase !== 'start', schocks: 1, medis: ['Adrenalin'], rate: 90, zyklus: 1 });
          expect(formFehler(z)).toEqual([]);
          expect(JSON.stringify([z.geraete, z.alarme, z.aufgaben])).not.toMatch(/kammerflimmern|asystolie|pulslose elektrische/i);
        }
      }
    }
  });

  it('warnt bei zu langsamem Drucktakt und bei der Analyse', () => {
    const profil = PROFILE.erwachsene, szenario = szenarienFuer('erwachsene')[0]!;
    const basis = { profil, szenario, erledigt: [], defiDa: true, schocks: 0, medis: [], zyklus: 0 };
    expect(reaZustand({ ...basis, phase: 'cpr', rate: 80 }).alarme.map((a) => a.id)).toContain('rate');
    expect(reaZustand({ ...basis, phase: 'cpr', rate: 110 }).alarme).toEqual([]);
    expect(reaZustand({ ...basis, phase: 'analyse', rate: null }).alarme[0]!.stufe).toBe('kritisch');
  });

  it('zeigt bei Neugeborenen Wärmebett statt Defibrillator', () => {
    const z = reaZustand({ profil: PROFILE.neugeborene, szenario: szenarienFuer('neugeborene')[0]!, phase: 'cpr', erledigt: [], defiDa: false, schocks: 0, medis: [], rate: null, zyklus: 0 });
    expect(z.geraete.map((g) => g.id)).toEqual(['waerme', 'beutel']);
  });
});
