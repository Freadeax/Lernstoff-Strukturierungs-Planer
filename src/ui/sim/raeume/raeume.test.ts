import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { RAEUME, RAUM_IDS, raumFuerZustand } from './katalog';
import { monitorWerte } from './RaumBuehne';

const imBild = (n: number) => n >= 0 && n <= 1;

describe('Raumkatalog', () => {
  it('jedes Bild existiert, hat Beschreibung und gültige Koordinaten', () => {
    expect(RAUM_IDS.length).toBe(34);
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

  it('Kinderzimmer: ohne Wagen, Wagen in Bereitschaft, Sensor am Kind', () => {
    expect(raumFuerZustand('20_paediatrie_kleinkind', 'abwesend')).toBe('20a_paediatrie_kleinkind_ohne_monitor');
    expect(raumFuerZustand('20_paediatrie_kleinkind', 'standby')).toBe('20_paediatrie_kleinkind');
    expect(raumFuerZustand('20_paediatrie_kleinkind', 'laeuft')).toBe('20m_paediatrie_kleinkind_monitor_verbunden');
    expect(raumFuerZustand('20a_paediatrie_kleinkind_ohne_monitor', 'laeuft')).toBe('20m_paediatrie_kleinkind_monitor_verbunden');
    expect(raumFuerZustand('21_paediatrie_schulkind', 'abwesend')).toBe('21a_paediatrie_schulkind_ohne_monitor');
    expect(raumFuerZustand('21_paediatrie_schulkind', 'laeuft')).toBe('21m_paediatrie_schulkind_monitor_verbunden');
    expect(raumFuerZustand('20f_paediatrie_kleinkind_fieberkrampf', 'laeuft')).toBe('20f_paediatrie_kleinkind_fieberkrampf');
    expect(raumFuerZustand('30_station_zimmer_frau', 'abwesend')).toBe('30a_station_zimmer_frau_ohne_monitor');
    expect(raumFuerZustand('30a_station_zimmer_frau_ohne_monitor', 'laeuft')).toBe('30m_station_zimmer_frau_monitor_verbunden');
    expect(raumFuerZustand('30b_station_zimmer_frau_sepsis', 'abwesend')).toBe('30b_station_zimmer_frau_sepsis');
  });

  it('Varianten verweisen auf vorhandene Räume, Hotspots liegen nicht auf dem Bildschirm', () => {
    for (const id of RAUM_IDS) {
      const r = RAEUME[id];
      for (const v of [r.ohneMonitor, r.mitMonitor, r.verbunden, r.nacht]) if (v) expect(RAEUME[v], `${id} → ${v}`).toBeDefined();
      if (!r.monitor) continue;
      const m = r.monitor;
      for (const h of r.hotspots) expect(h.x > m.x && h.x < m.x + m.width && h.y > m.y && h.y < m.y + m.height, `${id}/${h.id}`).toBe(false);
    }
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
