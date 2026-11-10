import { describe, expect, it } from 'vitest';
import { SETTING_LABEL, SZENARIEN, type Setting } from './faelle';
import { LEISTE, leistenVorschlaege, MARKER, objektInfo, RAUM_FUER, sbarEntwurf } from './raeume';
import { neuerFall } from './simulator';
import { szenenBild } from './szene';
import { DEMO_SZENARIO, demoZug } from './demo';

describe('Räume der Fallszene', () => {
  it('hat für jedes Setting einen Raum mit drei Markern, Person zuerst', () => {
    for (const s of Object.keys(SETTING_LABEL) as Setting[]) {
      const m = MARKER[RAUM_FUER[s]];
      expect(m.map((x) => x.nr)).toEqual([1, 2, 3]);
      expect(m[0]!.id).toBe('patient');
    }
  });

  it('beschreibt jedes Objekt mit Beobachtung und Handlung', () => {
    const f = neuerFall(SZENARIEN[0]!, 1);
    const bild = szenenBild(f);
    for (const raum of ['krankenhaus', 'heim', 'wohnung'] as const) {
      for (const m of MARKER[raum]) {
        const info = objektInfo(m.id, raum, bild);
        expect(info.beobachtung.length).toBeGreaterThan(0);
        expect(info.handlungen.length).toBeGreaterThan(0);
      }
      for (const l of LEISTE) expect(leistenVorschlaege(l.id, raum, bild, f).length).toBeGreaterThan(0);
    }
  });

  it('schreibt eine SBAR-Übergabe mit den aktuellen Werten', () => {
    let f = neuerFall(DEMO_SZENARIO, 1);
    f = { ...f, runden: [{ zug: demoZug(f) }] };
    const e = 'Ich messe Blutdruck, Puls, Atemfrequenz, Sättigung und Temperatur und prüfe das Bewusstsein.';
    f = { ...f, runden: [...f.runden, { eingabe: e, zug: demoZug(f, e) }] };
    const text = sbarEntwurf(f, szenenBild(f));
    expect(text).toMatch(/^Ich übergebe nach SBAR\. S: /);
    expect(text).toContain('SpO₂ 89');
    expect(text).toContain('NEWS2 8');
  });
});
