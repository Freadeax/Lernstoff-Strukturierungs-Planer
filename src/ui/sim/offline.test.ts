import { describe, expect, it } from 'vitest';
import { cacheFuer, groesse, offlineStatus, raumDateien, stufeVon, videoDateien } from './offline';

describe('Offline-Paket', () => {
  it('Stufe aus Bedarf und Zählung', () => {
    expect(stufeVon({ ersatz: true, online: false }, 3, 3)).toBe('vollstaendig');
    expect(stufeVon({ ersatz: true, online: false }, 1, 3)).toBe('ersatzansicht');
    expect(stufeVon({ ersatz: false, online: false }, 1, 3)).toBe('online');
    expect(stufeVon({ ersatz: true, online: true }, 3, 3)).toBe('online');
    expect(stufeVon({ ersatz: false, online: false }, 0, 0)).toBe('vollstaendig');
  });
  it('Raum samt Varianten', () => {
    const d = raumDateien('20_paediatrie_kleinkind');
    for (const v of ['20_paediatrie_kleinkind', '20a_', '20m_', '20n_']) expect(d.some((x) => x.includes(v)), v).toBe(true);
    expect(raumDateien('12_station_kardiologie_monitoring').some((x) => x.includes('12a_'))).toBe(true);
  });
  it('Cache je Ordner und Videodateien', () => {
    expect(cacheFuer('raeume/13_station_postop.webp')).toBe('raeume');
    expect(cacheFuer('personen/x.webp')).toBe('personen');
    expect(cacheFuer('assets/index.js')).toBeNull();
    expect(videoDateien('insulingabe')).toHaveLength(5);
    expect(groesse(1_500_000)).toBe('1,5 MB');
  });
  it('ohne Cache-Speicher zählt alles als fehlend', async () => {
    const s = await offlineStatus({ dateien: ['raeume/a.webp', 'raeume/a.webp', 'raeume/b.webp'], ersatz: true, online: false });
    expect(s).toMatchObject({ stufe: 'ersatzansicht', geladen: 0, gesamt: 2 });
  });
});
