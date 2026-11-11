import { describe, expect, it } from 'vitest';
import { DEMO_SZENARIO, demoAbschluss, demoZug, istDemo, PROBEFAELLE, probeWeg, type Probefall } from './demo';
import { fotoRaumFuer } from './fotoraeume';
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

describe('alle Probefälle', () => {
  function spieleP(p: Probefall, wahl: (optionen: string[], f: Fall) => string): Fall {
    let f = neuerFall(p.szenario, 1);
    f = { ...f, runden: [{ zug: demoZug(f) }] };
    for (let i = 0; i < 12 && !f.runden.at(-1)!.zug.beendet; i++) {
      const eingabe = wahl(f.runden.at(-1)!.zug.optionen, f);
      f = { ...f, runden: [...f.runden, { eingabe, zug: demoZug(f, eingabe) }] };
    }
    return f;
  }
  /** Beste Option über die Daten: die mit Wertung „gut“ in der aktuellen Etappe */
  const gutIn = (p: Probefall) => (o: string[]) => o.find((t) => Object.values(p.etappen).some((e) => e.optionen.some((x) => x.text === t && x.wertung === 'gut')))!;
  const schlimmstIn = (p: Probefall) => (o: string[]) => o.find((t) => Object.values(p.etappen).some((e) => e.optionen.some((x) => x.text === t && x.wertung === 'gefaehrlich'))) ?? o[0]!;

  it('jeder Probefall hat einen Fotoraum, gültige Verweise und genau eine beste Option je Etappe', () => {
    expect(PROBEFAELLE.length).toBeGreaterThanOrEqual(4);
    for (const p of PROBEFAELLE) {
      expect(istDemo({ szenario: p.szenario })).toBe(true);
      expect(fotoRaumFuer(p.szenario.id, p.szenario.setting, p.szenario.kurz)?.personPasst, p.szenario.id).toBe(true);
      for (const id of p.reihe) expect(p.etappen[id], id).toBeDefined();
      for (const [id, e] of Object.entries(p.etappen)) {
        expect(e.optionen.filter((o) => o.wertung === 'gut'), `${p.szenario.id}/${id}`).toHaveLength(1);
        for (const ziel of [e.weiter, ...e.optionen.map((o) => o.weiter)].filter(Boolean)) expect(p.etappen[ziel!], `${id} → ${ziel}`).toBeDefined();
      }
    }
  });

  it('beste Wege enden gut und „sicher“, gefährliche Wege verzweigen und enden „unsicher“', () => {
    for (const p of PROBEFAELLE) {
      const gut = spieleP(p, gutIn(p));
      expect(gut.runden.at(-1)!.zug.beendet, p.szenario.id).toBe(true);
      expect(gut.runden.at(-1)!.zug.zustand, p.szenario.id).toBe('verbessert');
      expect(demoAbschluss(gut).note, p.szenario.id).toBe('sicher');
      const schlecht = spieleP(p, schlimmstIn(p));
      expect(schlecht.runden.at(-1)!.zug.beendet, p.szenario.id).toBe(true);
      expect(demoAbschluss(schlecht).note, p.szenario.id).toBe('unsicher');
      expect(demoAbschluss(schlecht).gesamt).toContain('Wendung');
      // Der Abzweig führt in eine Etappe, die auf dem besten Weg nicht vorkommt
      const wegGut = probeWeg(p, gut.runden.slice(1).map((r) => r.eingabe)).map((w) => w.id);
      const wegSchlecht = probeWeg(p, schlecht.runden.slice(1).map((r) => r.eingabe)).map((w) => w.id);
      expect(wegSchlecht.some((id) => !wegGut.includes(id)), p.szenario.id).toBe(true);
    }
  });
});

describe('Rückblick', () => {
  it('liefert je Szene NEWS2 und Wertung', async () => {
    const { rueckblickPunkte } = await import('./Rueckblick');
    const f = spiele(beste);
    const p = rueckblickPunkte(f);
    expect(p).toHaveLength(f.runden.length);
    expect(p[0]!.news).toBeNull();
    expect(p[1]!.news).toBeGreaterThanOrEqual(7);
    expect(p.at(-1)!.news!).toBeLessThan(p[1]!.news!);
    expect(p.slice(1).every((x) => x.wertung === 'gut')).toBe(true);
  });
});

describe('Rückblick-Maßstab', () => {
  it('nimmt bei Kindern ohne Blutdruck die Sättigung', async () => {
    const { rueckblickPunkte, massstabFuer } = await import('./Rueckblick');
    const p = PROBEFAELLE.find((x) => x.szenario.id === 'demo-asthma')!;
    let f = neuerFall(p.szenario, 1);
    f = { ...f, runden: [{ zug: demoZug(f) }] };
    const e = f.runden[0]!.zug.optionen[0]!;
    f = { ...f, runden: [...f.runden, { eingabe: e, zug: demoZug(f, e) }] };
    expect(massstabFuer(rueckblickPunkte(f)).name).toBe('SpO₂');
    expect(massstabFuer(rueckblickPunkte(spiele(beste))).name).toBe('NEWS2');
  });
});
