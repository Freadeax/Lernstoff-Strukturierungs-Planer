import { describe, expect, it } from 'vitest';
import { SZENARIEN } from './faelle';
import { DEMO_SZENARIO } from './demo';
import { FOTORAEUME, fotoFokus, fotoRaumFuer } from './fotoraeume';
import { objektInfo } from './raeume';
import { szenenBild } from './szene';

describe('Fotoräume', () => {
  it('ordnet jedem Fall außer Pädiatrie einen Raum zu', () => {
    for (const s of [...SZENARIEN, DEMO_SZENARIO]) {
      const r = fotoRaumFuer(s.id, s.setting);
      if (s.setting === 'paediatrie') expect(r).toBeNull();
      else expect(r, s.id).not.toBeNull();
    }
    expect(fotoRaumFuer('demo-atemnot', 'krankenhaus')?.monitor).toBe(true);
    expect(fotoRaumFuer('unbekannt', 'ambulant')?.id).toBe('07_ambulant_wohnzimmer_kompression');
  });

  it('Marker liegen im Bild, Nummern fortlaufend, Person zuerst', () => {
    for (const r of Object.values(FOTORAEUME)) {
      expect(r.marker[0]!.id).toBe('patient');
      r.marker.forEach((m, i) => {
        expect(m.nr).toBe(i + 1);
        expect(m.x).toBeGreaterThan(0); expect(m.x).toBeLessThan(1);
        expect(m.y).toBeGreaterThan(0); expect(m.y).toBeLessThan(1);
      });
    }
  });

  it('jedes Objekt hat eine Beschreibung', () => {
    const bild = szenenBild({ szenario: DEMO_SZENARIO, stufe: 'mittel', runden: [], abschluss: null } as never);
    for (const r of Object.values(FOTORAEUME)) for (const m of r.marker) {
      const info = objektInfo(m.id, 'krankenhaus', bild);
      expect(info.beobachtung.length, `${r.id}/${m.id}`).toBeGreaterThan(0);
    }
  });

  it('Kamera zoomt auf den Marker am Ort der Handlung', () => {
    const r = FOTORAEUME['12_station_kardiologie_monitoring'];
    expect(fotoFokus(r, 'monitor')).toEqual({ x: 0.73, y: 0.2, zoom: 1.6 });
    expect(fotoFokus(r, 'raum')).toBeUndefined();
    expect(fotoFokus(r, 'telefon')).toBeUndefined();
  });
});
