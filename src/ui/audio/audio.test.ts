import { describe, expect, it } from 'vitest';
import { bereinige, hoerbar, STANDARD } from './einstellungen';
import { inAbschnitte, markdownAlsText, sprechbar } from './vorlesen';
import { ausgang } from './motor';
import { spiele, starteSchleife } from './spieler';

describe('Audio-Einstellungen', () => {
  it('kaputte oder fremde Stände fallen auf den Standard zurück', () => {
    expect(bereinige(null)).toEqual(STANDARD);
    expect(bereinige('x')).toEqual(STANDARD);
    const b = bereinige({ an: 'ja', lautstaerke: 7, kategorien: { ui: false, sim: 3 }, tempo: -1, stimme: 5 });
    expect(b.an).toBe(true);
    expect(b.lautstaerke).toBe(1);
    expect(b.kategorien).toEqual({ ui: false, sim: true, atmo: true });
    expect(b.tempo).toBe(0.6);
    expect(b.stimme).toBe('');
  });
  it('Hauptschalter aus macht alle Kategorien stumm', () => {
    const s = { ...STANDARD, an: false };
    expect(hoerbar('ui', s)).toBe(false);
    expect(hoerbar('sim', { ...STANDARD, kategorien: { ...STANDARD.kategorien, sim: false } })).toBe(false);
    expect(hoerbar('atmo', STANDARD)).toBe(true);
  });
});

describe('ohne Web Audio (z. B. alter Browser, Test)', () => {
  it('spielt still und wirft nicht', () => {
    expect(ausgang('ui')).toBeNull();
    expect(() => spiele('richtig')).not.toThrow();
    expect(starteSchleife('alarm-hoch')).toBeNull();
  });
});

describe('Vorlesen', () => {
  it('teilt lange Texte an Satzgrenzen, kein Teil zu lang', () => {
    const text = 'Erster Satz. '.repeat(40) + 'Ein sehr langer Satz ohne Punkt '.repeat(20);
    const teile = inAbschnitte(text, 220);
    expect(teile.length).toBeGreaterThan(3);
    for (const t of teile) expect(t.length).toBeLessThanOrEqual(220);
    expect(teile.join(' ').replace(/\s+/g, ' ')).toBe(text.trim().replace(/\s+/g, ' '));
  });
  it('macht Abkürzungen sprechbar', () => {
    expect(sprechbar('SpO₂ 94 %, AF 22/min, z. B. 37,5 °C, ggf. O₂')).toBe('S P O 2 94 %, AF 22 pro Minute, zum Beispiel 37,5  Grad, gegebenenfalls O₂');
  });
  it('wandelt Markdown in Sätze ohne Belegmarken', () => {
    const md = '## Definition\nHerzinsuffizienz ist **verminderte Pumpleistung** [L1 S. 4].\n\n- Atemnot\n- Ödeme\n\n| Stadium | Beschwerden |\n|---|---|\n| I | keine |\n\nSiehe [Leitlinie](https://x.de) ⚠';
    expect(markdownAlsText(md)).toBe('Definition. Herzinsuffizienz ist verminderte Pumpleistung. Atemnot. Ödeme. Stadium, Beschwerden. I, keine. Siehe Leitlinie.');
  });
});
