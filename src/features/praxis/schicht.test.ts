import { describe, expect, it } from 'vitest';
import { SCENARIOS } from './catalog';
import { beendeSchicht, beginneSchicht, handle, leseSchicht, neuBei, SCHICHT_KEY, SCHICHTEN, schichtAuswertung, speichereSchicht, startNews2, WEGEZEIT, warte, wechsle } from './schicht';

const vorlage = (id: string) => SCHICHTEN.find(v => v.id === id)!;

describe('Schichtmodus', () => {
  it('jede Vorlage hat vorhandene Fälle derselben Einrichtung', () => {
    for (const v of SCHICHTEN) {
      const faelle = v.faelle.map(id => SCENARIOS.find(s => s.id === id));
      expect(faelle.every(Boolean), v.id).toBe(true);
      expect(new Set(faelle.map(f => f!.setting)).size, v.id).toBe(1);
    }
  });

  it('hält alle Patienten auf einer Uhr: Handlungen beim einen kosten Zeit für alle', () => {
    let x = beginneSchicht(vorlage('frueh'), SCENARIOS, 2);
    x = handle(x, { type: 'action', id: 'vitals' });
    expect(x.time).toBe(60);
    expect(x.sessions.map(s => s.time)).toEqual([60, 60, 60]);
    expect(x.sessions[1].vitals.sys).toBeLessThan(SCENARIOS.find(s => s.id === 'nachblutung')!.initial.sys);
    x = wechsle(x, 2);
    expect(x.time).toBe(60 + WEGEZEIT); expect(x.switches).toBe(1);
    expect(x.sessions.every(s => s.time === x.time)).toBe(true);
    expect(wechsle(x, 2)).toBe(x);
  });

  it('merkt sich den ersten Kontakt und bewertet die Priorisierung', () => {
    const faelle = vorlage('frueh').faelle.map(id => SCENARIOS.find(s => s.id === id)!);
    const kritischster = faelle.map(startNews2).indexOf(Math.max(...faelle.map(startNews2)));
    let x = beginneSchicht(vorlage('frueh'), SCENARIOS, 2);
    const anders = kritischster === 0 ? 1 : 0;
    let falsch = wechsle(x, anders); falsch = handle(falsch, { type: 'action', id: 'assessment' });
    expect(schichtAuswertung(falsch).priorisiert).toBe(false);
    x = wechsle(x, kritischster); x = handle(x, { type: 'action', id: 'assessment' });
    const a = schichtAuswertung(x);
    expect(a.priorisiert).toBe(true); expect(a.unbesucht).toHaveLength(2);
  });

  it('zeigt Ereignisse bei anderen Patienten als neu an und lässt Entscheidungen warten', () => {
    let x = beginneSchicht(vorlage('frueh'), SCENARIOS, 2);
    x = warte(x, 1000);
    const sohn = x.sessions.findIndex(s => s.scenario.id === 'sepsis');
    expect(x.sessions[sohn].open).toEqual(['sohn']);
    expect(x.sessions[sohn].time).toBeLessThan(x.time);
    const andere = x.sessions.findIndex(s => s.scenario.id === 'nachblutung');
    x = wechsle(x, andere);
    expect(neuBei(x, sohn).entscheidung).toBe(true);
    x = wechsle(x, sohn);
    x = handle(x, { type: 'choose', event: 'sohn', choice: 'ernst' });
    expect(x.sessions[sohn].open).toEqual([]);
    expect(x.sessions[sohn].time).toBe(x.time);
    expect(neuBei(x, sohn).ereignisse).toBe(0);
  });

  it('beendet alle Fälle, wertet aus und überlebt Speichern und Laden', () => {
    let x = beginneSchicht(vorlage('kinder'), SCENARIOS, 1);
    x = handle(x, { type: 'action', id: 'help' });
    x = handle(x, { type: 'sbar', fields: ['Fieber, trinkt nicht', 'Infekt', 'Dehydratation droht', 'Bitte ansehen'] });
    x = beendeSchicht(x);
    expect(x.sessions.every(s => s.phase === 'finished')).toBe(true);
    expect(schichtAuswertung(x).uebergaben).toBe(1);
    expect(handle(x, { type: 'action', id: 'vitals' })).toBe(x);
    const store = new Map<string, string>();
    globalThis.localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) } as Storage;
    expect(speichereSchicht(x)).toBe('');
    expect(leseSchicht()).toEqual(x);
    store.set(SCHICHT_KEY, JSON.stringify({ ...x, active: 9 }));
    expect(leseSchicht()).toBeNull();
  });
});
