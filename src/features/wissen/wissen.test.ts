import { describe, expect, it } from 'vitest';
import { aufgabenAus, FACH_VON_AUFGABE, FAECHER, gemischteGrundlage } from './faecher';
import { ALTE_PFADE, FACH_IDS, weiterleitungFuer, wissenPfad } from './pfad';
import { flatNav, NAV } from '../../ui/shell/nav';

describe('Wissenstrainer', () => {
  it('führt alle neun Fachgebiete mit Aufgaben', () => {
    expect(FAECHER.map((f) => f.id)).toEqual([...FACH_IDS]);
    for (const f of FAECHER) {
      expect(f.bereiche.length, f.id).toBeGreaterThan(0);
      for (const b of f.bereiche) expect(f.aufgaben[b.id]?.length ?? 0, `${f.id}.${b.id}`).toBeGreaterThan(0);
    }
  });
  it('Aufgaben-Kennungen sind über alle Fachgebiete eindeutig (gemischte Runden ordnen danach zu)', () => {
    const alle = FAECHER.flatMap((f) => Object.values(f.aufgaben).flat());
    expect(FACH_VON_AUFGABE.size).toBe(alle.length);
  });
  it('stellt eigene Runden aus Fachgebieten und Bereichen zusammen, ohne Doppelte', () => {
    const herz = aufgabenAus(['anatomie.herz']);
    expect(herz.length).toBeGreaterThan(0);
    expect(herz.every((a) => FACH_VON_AUFGABE.get(a.id) === 'anatomie')).toBe(true);
    const mix = aufgabenAus(['anatomie', 'anatomie.herz', 'normwerte.vital', 'gibtsnicht.x']);
    expect(new Set(mix.map((a) => a.id)).size).toBe(mix.length);
    expect(new Set(mix.map((a) => FACH_VON_AUFGABE.get(a.id)))).toEqual(new Set(['anatomie', 'normwerte']));
  });
  it('gemischte Runden zeigen die Grundlage des jeweiligen Fachgebiets', () => {
    const [a] = aufgabenAus(['recht']);
    expect(gemischteGrundlage(a!).length).toBeGreaterThan(0);
  });
  it('alte Trainer-Adressen leiten mit allen Angaben weiter', () => {
    expect(Object.keys(ALTE_PFADE)).toHaveLength(9);
    expect(weiterleitungFuer('/lernen/hygiene', new URLSearchParams(''))).toBe('/lernen/wissen?fach=hygiene');
    expect(weiterleitungFuer('/lernen/anatomie', new URLSearchParams('bereich=herz&runde=1'))).toBe('/lernen/wissen?fach=anatomie&bereich=herz&runde=1');
    expect(weiterleitungFuer('/lernen/notfall', new URLSearchParams('modus=rea'))).toBe('/lernen/wissen?fach=notfall&modus=rea');
    expect(weiterleitungFuer('/lernen/rechnen', new URLSearchParams(''))).toBeUndefined();
    expect(wissenPfad('labor', { modus: 'werkbank', leer: '' })).toBe('/lernen/wissen?fach=labor&modus=werkbank');
  });
  it('alte Einzeltrainer stehen nicht mehr im Menü, der Wissenstrainer schon', () => {
    const pfade = flatNav(NAV).map((n) => n.path);
    expect(pfade).toContain('/lernen/wissen');
    for (const alt of Object.keys(ALTE_PFADE)) expect(pfade).not.toContain(alt);
  });
});
