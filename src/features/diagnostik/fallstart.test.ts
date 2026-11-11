import { describe, expect, it } from 'vitest';
import { FAELLE, FALL_NACH_ID } from './faelle';
import { dauerMinuten, fallSchritte, fallTyp, fallZustand, ortBeschreibung, ortTitel, ZUSTAND_KNOPF } from './fallstart';
import { freigabeFuer, FREIGABE_FAELLE } from './freigaben';
import { freigabeFehler, automatischeWertung } from '../../ui/sim/freigabe';
import { fuehreAus, starte } from './lauf';

describe('Fallstart (SIM-03, Live-Funde 1 und 3)', () => {
  it('Zustände: neu, läuft, beendet mit eigenem Knopf', () => {
    const f = FALL_NACH_ID['sepsis-pneumonie'];
    expect(fallZustand(undefined)).toBe('neu');
    const l = starte(f);
    expect(fallZustand(l)).toBe('laeuft');
    const fertig = fuehreAus(l, f, { typ: 'beenden' });
    expect(fallZustand(fertig)).toBe('beendet');
    expect(ZUSTAND_KNOPF.beendet).toBe('Auswertung ansehen');
    expect(ZUSTAND_KNOPF.laeuft).toBe('Fortsetzen');
  });
  it('jeder Versuch hat eine eigene Kennung und zählt hoch', () => {
    const f = FALL_NACH_ID['hyperkaliaemie'];
    const a = starte(f), b = starte(f, 2);
    expect(a.id).toBeTruthy(); expect(b.id).not.toBe(a.id);
    expect(a.versuch).toBe(1); expect(b.versuch).toBe(2);
  });
  it('Fälle ohne Bildgebung kündigen keine Bildgebung an', () => {
    for (const f of FAELLE) {
      const s = fallSchritte(f).join(' ');
      expect(/Bildgebung/.test(s)).toBe(f.bildgebung.length > 0);
      expect(fallTyp(f)).toContain(f.bildgebung.length ? 'Labor und Bildgebung' : 'ohne Bildgebung');
      expect(dauerMinuten(f)).toBeGreaterThanOrEqual(10);
    }
  });
  it('Ort nach der Station des Falls: Sepsis auf der Inneren heißt nicht Kardiologie', () => {
    const f = FALL_NACH_ID['sepsis-pneumonie'];
    expect(ortTitel(f)).toBe('Innere Station · Monitoring am Bett');
    expect(ortBeschreibung(f)).not.toMatch(/Kardiologie/);
    for (const x of FAELLE) expect(ortTitel(x).startsWith(x.bereich.split(',')[0])).toBe(true);
  });
});

describe('Freigaben der Diagnostik-Fälle (SIM-02)', () => {
  it('jeder Fall hat einen vollständigen Eintrag', () => {
    expect(new Set(FREIGABE_FAELLE)).toEqual(new Set(FAELLE.map((f) => f.id)));
    for (const f of FAELLE) expect(freigabeFehler(freigabeFuer(f)!), f.id).toEqual([]);
  });
  it('Kinderfälle sind als Kinder markiert und ohne Prüfung nicht automatisch gewertet', () => {
    for (const f of FAELLE.filter((x) => x.patient.alter < 18)) {
      const fr = freigabeFuer(f)!;
      expect(fr.zielgruppe).toBe('kinder');
      expect(automatischeWertung(fr)).toBe(false);
    }
  });
});
