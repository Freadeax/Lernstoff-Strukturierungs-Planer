import { describe, expect, it } from 'vitest';
import { DEMO_SZENARIO, demoAbschluss, demoZug, istDemo } from './demo';
import { neuerFall, type Fall } from './simulator';
import { szenenBild } from './szene';

function spiele(wahl: (optionen: string[]) => string): Fall {
  let f = neuerFall(DEMO_SZENARIO, 1);
  f = { ...f, runden: [{ zug: demoZug(f) }] };
  for (let i = 0; i < 10 && !f.runden.at(-1)!.zug.beendet; i++) {
    const eingabe = wahl(f.runden.at(-1)!.zug.optionen);
    f = { ...f, runden: [...f.runden, { eingabe, zug: demoZug(f, eingabe) }] };
  }
  return f;
}
const beste = (o: string[]) => o.find((x) => /messe Blutdruck|Herzbettlage|SBAR|Bilanz/.test(x))!;

describe('Probefall ohne KI', () => {
  it('läuft mit den besten Entscheidungen bis zum guten Ende', () => {
    const f = spiele(beste);
    expect(istDemo(f)).toBe(true);
    expect(f.runden).toHaveLength(5);
    expect(f.runden.at(-1)!.zug.beendet).toBe(true);
    expect(f.runden.at(-1)!.zug.zustand).toBe('verbessert');
    expect(demoAbschluss(f).note).toBe('sicher');
  });

  it('wertet gefährliche Entscheidungen ab', () => {
    const f = spiele((o) => o[0]!);
    const a = demoAbschluss(f);
    expect(a.note).toBe('unsicher');
    expect(a.verbesserungen.length).toBeGreaterThan(0);
    expect(a.schritte).toHaveLength(6);
  });

  it('nimmt Freitext nicht an', () => {
    let f = neuerFall(DEMO_SZENARIO, 1);
    f = { ...f, runden: [{ zug: demoZug(f) }] };
    expect(demoZug(f, 'irgendwas').rueckmeldung.text).toContain('Vorschläge');
  });

  it('zeigt in der Szene Monitor, Herzbettlage, Ärztin und Telefon', () => {
    const f = spiele(beste);
    const nachMessen = szenenBild({ ...f, runden: f.runden.slice(0, 2) });
    expect(nachMessen.monitorAn).toBe(true);
    expect(nachMessen.ziel).toBe('monitor');
    const visite = szenenBild({ ...f, runden: f.runden.slice(0, 4) });
    expect(visite.oberkoerperHoch).toBe(true);
    expect(visite.personen).toContain('aerztin');
    expect(visite.telefon).toBe(true);
    expect(visite.fokus).toBe('telefon');
  });
});
