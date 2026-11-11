import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { RAEUME, RAUM_IDS, raumFuerZustand } from './katalog';
import { monitorWerte } from './RaumBuehne';

const imBild = (n: number) => n >= 0 && n <= 1;

describe('Raumkatalog', () => {
  it('jedes Bild existiert, hat Beschreibung und gültige Koordinaten', () => {
    expect(RAUM_IDS.length).toBe(14);
    for (const id of RAUM_IDS) {
      const r = RAEUME[id];
      expect(existsSync(`public/${r.datei}`), r.datei).toBe(true);
      expect(r.beschreibung.length).toBeGreaterThan(30);
      expect(new Set(r.hotspots.map((h) => h.id)).size).toBe(r.hotspots.length);
      for (const h of r.hotspots) expect(imBild(h.x) && imBild(h.y), `${id}/${h.id}`).toBe(true);
      if (r.monitor) {
        const m = r.monitor;
        expect(imBild(m.x) && imBild(m.y) && imBild(m.x + m.width) && imBild(m.y + m.height), id).toBe(true);
      }
    }
  });

  it('Raum 12 hat die Monitorfläche aus dem Paket und die Variante ohne Monitor', () => {
    expect(RAEUME['12_station_kardiologie_monitoring'].monitor).toEqual({ x: 0.628, y: 0.0965, width: 0.201, height: 0.2 });
    expect(raumFuerZustand('12_station_kardiologie_monitoring', 'abwesend')).toBe('12a_station_kardiologie_ohne_monitor');
    expect(raumFuerZustand('12a_station_kardiologie_ohne_monitor', 'laeuft')).toBe('12_station_kardiologie_monitoring');
    expect(raumFuerZustand('17_notaufnahme_untersuchung', 'abwesend')).toBe('17_notaufnahme_untersuchung');
  });
});

describe('Monitorzustände', () => {
  const werte = { puls: 110, spo2: 91, af: 24, sys: 100, dia: 60 };
  it('Standby zeigt keine Werte', () => {
    expect(monitorWerte({ werte, zustand: 'standby' })).toMatchObject({ aktiv: false, ausText: 'Standby', werte: {} });
  });
  it('Signalausfall betrifft nur die zugeordneten Kanäle', () => {
    const m = monitorWerte({ werte, zustand: 'signalausfall', ausfall: ['spo2'] });
    expect(m.werte).toMatchObject({ puls: 110, spo2: null, af: 24, sys: 100 });
    expect(m.hinweis).toContain('SpO₂');
    expect(monitorWerte({ werte, zustand: 'signalausfall', ausfall: ['ekg'] }).werte).toMatchObject({ puls: null, spo2: 91 });
  });
  it('läuft zeigt alle Werte', () => {
    expect(monitorWerte({ werte, zustand: 'laeuft' })).toEqual({ werte, aktiv: true });
  });
});
