import { describe, expect, it } from 'vitest';
import { packe, entpacke } from '../klasse/kodierung';
import { baueRadarStand, codesImText, fuegeEin, klassenRadar, MAX_LUECKEN, pruefeRadarStand, type RadarStand } from './radarcode';
import type { RadarAchse } from './radar';

const achse = (code: string, jetzt: number, themen = 3): RadarAchse => ({ id: `kb.${code}`, code, name: `Bereich ${code}`, themen, jetzt });
const luecken = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `thema.t${i}`, name: `Thema ${i}` }));

describe('Radar-Code', () => {
  it('baut einen schlanken Stand: nur Bereiche mit Themen, höchstens acht Lücken, Name gekürzt', () => {
    const s = baueRadarStand([achse('I', 40), achse('II', 0, 0)], luecken(12), '  Lena K. ', '2026-11-18');
    expect(s.achsen).toEqual([{ code: 'I', name: 'Bereich I', wert: 40 }]);
    expect(s.luecken).toHaveLength(MAX_LUECKEN);
    expect(s.name).toBe('Lena K.');
  });

  it('übersteht Packen und Entpacken und prüft fremde Eingaben', async () => {
    const s = baueRadarStand([achse('I', 40), achse('II', 75)], luecken(2), '', '2026-11-18');
    const zurueck = pruefeRadarStand(await entpacke(await packe(s)));
    expect(zurueck).toEqual(s);
    expect(pruefeRadarStand({ t: 'abgabe' })).toBeNull();
    expect(pruefeRadarStand({ t: 'radar', v: 1, achsen: [{ code: 'I', wert: 'viel' }] })).toBeNull();
    expect(pruefeRadarStand({ t: 'radar', v: 1, name: 'x'.repeat(500), datum: 'gestern', achsen: [{ code: 'I', wert: 180 }], luecken: 'nein' }))
      .toMatchObject({ name: 'x'.repeat(40), datum: '', achsen: [{ code: 'I', wert: 100 }], luecken: [] });
  });

  it('Klassen-Radar: Mittel, Spanne und häufigste Lücken', () => {
    const a = baueRadarStand([achse('I', 20), achse('II', 60)], [{ id: 'thema.sturz', name: 'Sturz' }, { id: 'thema.herz', name: 'Herz' }], 'A', '2026-11-18');
    const b = baueRadarStand([achse('I', 60), achse('II', 80)], [{ id: 'thema.sturz', name: 'Sturz' }], 'B', '2026-11-18');
    const k = klassenRadar([a, b]);
    expect(k.n).toBe(2);
    expect(k.achsen.find((x) => x.code === 'I')).toMatchObject({ mittel: 40, min: 20, max: 60, n: 2 });
    expect(k.luecken[0]).toEqual({ id: 'thema.sturz', name: 'Sturz', anzahl: 2 });
  });

  it('gleicher Name ersetzt den älteren Stand, gleicher anonymer Code zählt einmal', () => {
    const alt = baueRadarStand([achse('I', 20)], [], 'Lena', '2026-11-01');
    const neu = baueRadarStand([achse('I', 50)], [], 'lena', '2026-11-18');
    const anonym = baueRadarStand([achse('I', 30)], [], '', '2026-11-18');
    let r = fuegeEin([], [alt, anonym, anonym]);
    expect(r.liste).toHaveLength(2);
    r = fuegeEin(r.liste, [neu]);
    expect(r).toMatchObject({ neu: 0, ersetzt: 1 });
    expect(r.liste.find((s: RadarStand) => s.name.toLowerCase() === 'lena')?.achsen[0]?.wert).toBe(50);
  });

  it('findet Codes in eingefügten Nachrichten', () => {
    const c = 'z' + 'A'.repeat(30);
    expect(codesImText(`Mein Kompetenz-Radar:\n${c}\n\nGruß`)).toEqual([c]);
    expect(codesImText('zu kurz zebra')).toEqual([]);
  });
});
