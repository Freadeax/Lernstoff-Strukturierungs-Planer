import { describe, expect, it } from 'vitest';
import { zaehlText, zerlegeZahl } from '../motion/Zaehler';
import { bereichVon, flatNav, NAV, UNTERSEITEN } from '../shell/nav';

describe('Zähler', () => {
  it('zerlegt Zahl, Vorsatz und Rest', () => {
    expect(zerlegeZahl('85 %')).toEqual({ vor: '', zahl: 85, stellen: 0, komma: false, nach: ' %' });
    expect(zerlegeZahl('ca. 1,5 Std.')).toEqual({ vor: 'ca. ', zahl: 1.5, stellen: 1, komma: true, nach: ' Std.' });
    expect(zerlegeZahl('keine Angabe')).toBeNull();
  });
  it('zählt im Format des Zielwerts und endet exakt beim Zielwert', () => {
    expect(zaehlText('80 %', 0)).toBe('0 %');
    expect(zaehlText('80 %', 0.5)).toBe('40 %');
    expect(zaehlText('1,5 Std.', 0.5)).toBe('0,8 Std.');
    expect(zaehlText('1.234 Karten', 1)).toBe('1.234 Karten');
    expect(zaehlText('–', 0.3)).toBe('–');
  });
});

describe('Bereich einer Seite', () => {
  it('ordnet jede Menüseite ihrer obersten Gruppe zu', () => {
    expect(bereichVon('/')).toBe('heute');
    expect(bereichVon('/lernen/plan')).toBe('lernen');
    expect(bereichVon('/lernen/praxis')).toBe('ueben');
    expect(bereichVon('/lernen/klasse/abgabe')).toBe('ueben');
    expect(bereichVon('/material/import')).toBe('material');
    expect(bereichVon('/einstellungen')).toBe('system');
    expect(bereichVon('/lernen/thema')).toBe('lernen');
    expect(bereichVon('/gibt-es-nicht')).toBe('system');
  });
  it('kennt für alle Pfade einen der fünf Bereiche', () => {
    for (const i of [...flatNav(NAV), ...UNTERSEITEN]) expect(['heute', 'lernen', 'ueben', 'material', 'system']).toContain(bereichVon(i.path!));
  });
});
