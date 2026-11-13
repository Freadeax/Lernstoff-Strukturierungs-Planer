import { describe, expect, it } from 'vitest';
import { erstelleExport, leseExport, pruefeEintraege, verwendungZiel } from './pruefung';

describe('Bildprüfung: Export und Eingabeprüfung', () => {
  it('Rundlauf über die Exportdatei', () => {
    const e = { 'raeume/12_station_kardiologie_monitoring.webp': { status: 'freigegeben' as const, am: '2026-11-13', von: 'Praxisanleitung', pruefpunkte: ['kabel'] } };
    expect(leseExport(JSON.stringify(erstelleExport(e)))).toEqual(e);
  });
  it('verwirft ungültige Einträge', () => {
    const r = pruefeEintraege({
      '../geheim': { status: 'freigegeben', am: '2026-11-13', von: 'x' },
      'raeume/a.webp': { status: 'mangel', am: '2026-11-13', von: 'x' },
      'raeume/b.webp': { status: 'ok', am: '2026-11-13', von: 'x' },
      'raeume/c.webp': { status: 'freigegeben', am: '13.11.2026', von: 'x' },
      'bildgebung/lungenembolie-ct': { status: 'mangel', am: '2026-11-13', von: 'x', hinweis: ' Befund kaum sichtbar ' },
    });
    expect(Object.keys(r)).toEqual(['bildgebung/lungenembolie-ct']);
    expect(r['bildgebung/lungenembolie-ct']!.hinweis).toBe('Befund kaum sichtbar');
  });
  it('lehnt fremde Formate ab', () => {
    expect(() => leseExport('{"format":"lernstoff-ablage/1"}')).toThrow(/Format/);
  });
  it('springt in den Fall', () => {
    expect(verwendungZiel('praxis:asthma (Maßnahme orders)')).toBe('#/lernen/praxis?fall=asthma');
    expect(verwendungZiel('diagnostik:asthma-kind')).toBe('#/lernen/diagnostik?fall=asthma-kind');
    expect(verwendungZiel('hygiene:isolierung')).toBe('#/lernen/hygiene');
    expect(verwendungZiel('bereich:heute')).toBeUndefined();
  });
});
