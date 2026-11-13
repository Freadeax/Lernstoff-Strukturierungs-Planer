import { describe, expect, it } from 'vitest';
import { FREIGABEN, bildMangel } from './bildfreigaben';

describe('Bildmängel', () => {
  it('findet Mängel über die Prüfeinheit', () => {
    FREIGABEN['sim-videos/insulingabe.mp4'] = { status: 'mangel', am: '2026-11-13', von: 'Test', hinweis: 'Nadel zu lang' };
    FREIGABEN['bildgebung/lungenembolie-ct'] = { status: 'freigegeben', am: '2026-11-13', von: 'Test' };
    try {
      expect(bildMangel('sim-videos/insulingabe-2.webp')?.hinweis).toBe('Nadel zu lang');
      expect(bildMangel('sim-videos/insulingabe.mp4')?.hinweis).toBe('Nadel zu lang');
      expect(bildMangel('bildgebung/lungenembolie-ct/schicht-01.png')).toBeUndefined();
      expect(bildMangel('raeume/12_station_kardiologie_monitoring.webp')).toBeUndefined();
    } finally {
      delete FREIGABEN['sim-videos/insulingabe.mp4'];
      delete FREIGABEN['bildgebung/lungenembolie-ct'];
    }
  });
});
