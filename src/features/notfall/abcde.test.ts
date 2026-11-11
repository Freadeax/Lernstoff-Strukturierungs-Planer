import { describe, expect, it } from 'vitest';
import { freigabeFehler } from '../../ui/sim/freigabe';
import { RAEUME } from '../../ui/sim/raeume/katalog';
import { befunden, beginne, bewerte, BUCHSTABEN, handeln, NOTFAELLE, reihenfolgeFehler, uebergeben, type Stand } from './abcde';
import { NOTFALL_FREIGABE } from './freigaben';

const fall = (id: string) => NOTFAELLE.find(f => f.id === id)!;
const alleBefunde = (s: Stand) => BUCHSTABEN.reduce(befunden, s);

describe('ABCDE-Notfallübung', () => {
  it('jeder Notfall: alle fünf Befunde, Raum vorhanden, vollständige Freigabe, Hilfe als Schlüsselmaßnahme', () => {
    for (const f of NOTFAELLE) {
      expect(f.befunde.map(b => b.buchstabe), f.id).toEqual(BUCHSTABEN);
      expect(RAEUME[f.raum], f.id).toBeTruthy();
      expect(freigabeFehler(NOTFALL_FREIGABE[f.id]!), f.id).toEqual([]);
      expect(f.massnahmen.some(m => m.buchstabe === 'Team' && m.schluessel), f.id).toBe(true);
      expect(f.massnahmen.some(m => m.falsch), f.id).toBe(true);
    }
  });
  it('ist deterministisch: gleiche Handlungen, gleicher Verlauf', () => {
    for (const f of NOTFAELLE) {
      const lauf = () => f.massnahmen.reduce((s, m) => handeln(s, m.id), alleBefunde(beginne(f)));
      expect(lauf()).toEqual(lauf());
    }
  });
  it('ohne Maßnahmen wird jeder Notfall irgendwann kritisch', () => {
    for (const f of NOTFAELLE) {
      let s = beginne(f);
      for (let i = 0; i < 60 && !s.ende; i++) s = befunden(s, BUCHSTABEN[i % 5]!);
      expect(s.ende, f.id).toBe('kritisch');
      expect(bewerte(s).zeilen.at(-1)!.ok).toBe(false);
    }
  });
  it('mit Hilfe, Schlüsselmaßnahmen und erneuter Einschätzung: stabil und volle Punktzahl', () => {
    for (const f of NOTFAELLE) {
      let s = beginne(f);
      s = befunden(befunden(s, 'A'), 'B');
      s = handeln(s, f.massnahmen.find(m => m.buchstabe === 'Team')!.id);
      s = befunden(befunden(befunden(s, 'C'), 'D'), 'E');
      // Schlüsselmaßnahmen in einer Reihenfolge, die Voraussetzungen erfüllt
      for (let runde = 0; runde < 3; runde++) for (const m of f.massnahmen.filter(x => x.schluessel)) if (!s.massnahmen.includes(m.id)) s = handeln(s, m.id);
      expect(s.ende, f.id).toBe('stabil');
      s = befunden(s, 'A');
      const b = bewerte(s);
      expect(b.zeilen.filter(z => !z.ok).map(z => z.text), f.id).toEqual([]);
    }
  });
  it('Voraussetzungen: Adrenalin erst nach Alarm, Antibiose erst nach Kulturen', () => {
    const s = handeln(beginne(fall('anaphylaxie')), 'adrenalin');
    expect(s.massnahmen).not.toContain('adrenalin');
    expect(s.verlauf.at(-1)!.titel).toBe('Noch nicht möglich');
    const t = handeln(handeln(beginne(fall('sepsis')), 'hilfe'), 'antibiose');
    expect(t.massnahmen).not.toContain('antibiose');
  });
  it('gefährliche Handlung wird erklärt und in der Bewertung genannt', () => {
    const s = uebergeben(handeln(beginne(fall('hypoglykaemie')), 'saft'));
    expect(s.verlauf.some(e => e.art === 'falsch' && e.text.includes('Aspiration'))).toBe(true);
    expect(bewerte(s).zeilen.some(z => !z.ok && z.text.startsWith('Ungünstig'))).toBe(true);
    expect(s.ende).toBe('uebergabe');
  });
  it('Unterzucker: Bewusstsein folgt dem Blutzucker, Glukagon hebt ihn', () => {
    let s = beginne(fall('hypoglykaemie'));
    expect(s.werte.avpu).toBe('V');
    s = handeln(s, 'glukagon');
    expect(s.werte.bz).toBeGreaterThan(70);
    expect(s.werte.avpu).toBe('A');
  });
  it('Reihenfolgefehler zählt nur echte Rücksprünge', () => {
    expect(reihenfolgeFehler(['A', 'B', 'C', 'D', 'E', 'A'])).toBe(0);
    expect(reihenfolgeFehler(['C', 'A', 'B'])).toBe(2);
  });
});
