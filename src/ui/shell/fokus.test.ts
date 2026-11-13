import { describe, expect, it } from 'vitest';
import { fokus, pausiereTimer, restzeit, setzeFokus, setzeFort, starteTimer, stoppeTimer, uhr } from './fokus';

describe('Fokus-Modus', () => {
  it('schaltet an und aus (auch ohne Browser-Dokument)', () => {
    setzeFokus(true);
    expect(fokus.get().an).toBe(true);
    setzeFokus(false);
    expect(fokus.get().an).toBe(false);
  });

  it('zählt die Lernzeit herunter, hält an und setzt fort', () => {
    starteTimer(25, 'lernen', 0);
    expect(restzeit(fokus.get(), 60_000)).toBe(24 * 60_000);
    pausiereTimer(60_000);
    expect(restzeit(fokus.get(), 600_000)).toBe(24 * 60_000);
    setzeFort(600_000);
    expect(restzeit(fokus.get(), 600_000 + 24 * 60_000 + 5)).toBe(0);
    stoppeTimer();
    expect(restzeit(fokus.get())).toBeUndefined();
  });

  it('Pause ändert die gewählte Lernzeit nicht', () => {
    starteTimer(45, 'lernen', 0);
    starteTimer(5, 'pause', 0);
    expect(fokus.get().minuten).toBe(45);
    expect(fokus.get().phase).toBe('pause');
    stoppeTimer();
  });

  it('formatiert Minuten und Sekunden', () => {
    expect(uhr(25 * 60_000)).toBe('25:00');
    expect(uhr(61_500)).toBe('1:02');
  });
});
