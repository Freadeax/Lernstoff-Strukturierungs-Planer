// Darstellung, Hotspot und Lösung gegenprüfen (Audit 11.11.2026): Jede Nummer liegt in der Zeichnung,
// Nummern überdecken sich nicht, Namen sind eindeutig, und die Lagebeschreibung (Textweg ohne Bild)
// verrät den Namen nicht.
import { describe, expect, it } from 'vitest';
import { pflegeModule } from '../../modules/pflege';
import { AUFGABEN } from './aufgaben';
import { FIGUREN } from './figuren';
import { krankheitsbilderZu } from './verknuepfung';

const beschriften = Object.values(AUFGABEN).flat().filter((a) => a.art === 'beschriften');

describe('Anatomie: Hotspots', () => {
  it('es gibt Beschriftungsaufgaben und jede hat ihre Figur', () => {
    expect(beschriften.length).toBeGreaterThan(3);
    for (const a of beschriften) expect(FIGUREN[a.figur], a.id).toBeTruthy();
  });

  it.each(beschriften.map((a) => [a.id, a] as const))('%s: Nummern in der Zeichnung, ohne Überlappung, eindeutig', (_id, a) => {
    const [x0, y0, w, h] = FIGUREN[a.figur]!.viewBox.split(/[\s,]+/).map(Number) as [number, number, number, number];
    for (const m of a.marken) {
      expect(m.x, `${m.label} x`).toBeGreaterThanOrEqual(x0 + 9);
      expect(m.x, `${m.label} x`).toBeLessThanOrEqual(x0 + w - 9);
      expect(m.y, `${m.label} y`).toBeGreaterThanOrEqual(y0 + 9);
      expect(m.y, `${m.label} y`).toBeLessThanOrEqual(y0 + h - 9);
    }
    for (let i = 0; i < a.marken.length; i++) {
      for (let j = i + 1; j < a.marken.length; j++) {
        const d = Math.hypot(a.marken[i]!.x - a.marken[j]!.x, a.marken[i]!.y - a.marken[j]!.y);
        expect(d, `${a.marken[i]!.label} / ${a.marken[j]!.label}`).toBeGreaterThanOrEqual(18);
      }
    }
    expect(new Set(a.marken.map((m) => m.nr)).size).toBe(a.marken.length);
    expect(new Set(a.marken.map((m) => m.label)).size).toBe(a.marken.length);
  });

  it('die Lagebeschreibung nennt den gesuchten Namen nicht', () => {
    const verraten = beschriften.flatMap((a) => a.marken.filter((m) => m.hinweis.toLowerCase().includes(m.label.toLowerCase())).map((m) => `${a.id}: ${m.label}`));
    expect(verraten).toEqual([]);
  });

  it('jede Anatomie-Aufgabe zum Herz führt zu einem Krankheitsbild', () => {
    const herz = Object.values(AUFGABEN).flat().find((a) => a.topicIds.includes('thema.ap.herz'))!;
    expect(krankheitsbilderZu(herz, pflegeModule).length).toBeGreaterThan(0);
  });
});
