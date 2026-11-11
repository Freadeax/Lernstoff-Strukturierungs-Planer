import { describe, expect, it } from 'vitest';
import { SZENARIEN } from './faelle';
import { DEMO_SZENARIO } from './demo';
import { FOTORAEUME, fotoFokus, fotoRaumFuer, personAus } from './fotoraeume';
import { objektInfo } from './raeume';
import { szenenBild } from './szene';

describe('Fotoräume', () => {
  it('ordnet jedem Fall einen Raum zu, Kinderfälle bekommen die Kinderzimmer', () => {
    for (const s of [...SZENARIEN, DEMO_SZENARIO]) expect(fotoRaumFuer(s.id, s.setting), s.id).not.toBeNull();
    expect(fotoRaumFuer('fieberkrampf', 'paediatrie')?.id).toBe('20f_paediatrie_kleinkind_fieberkrampf');
    expect(fotoRaumFuer('asthma-kind', 'paediatrie')?.id).toBe('21_paediatrie_schulkind');
    expect(fotoRaumFuer('demo-atemnot', 'krankenhaus')?.monitor).toBe(true);
    expect(fotoRaumFuer('unbekannt', 'ambulant')?.id).toBe('07_ambulant_wohnzimmer_kompression');
    expect(fotoRaumFuer('copd', 'ambulant')?.id).toBe('09_ambulant_kueche_diabetes');
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
    expect(fotoFokus(r, 'monitor')).toEqual({ x: 0.73, y: 0.34, zoom: 1.45 });
    expect(fotoFokus(r, 'raum')).toBeUndefined();
    expect(fotoFokus(r, 'telefon')).toBeUndefined();
  });

  it('liest die Person aus dem Fall und benennt Marker 1', () => {
    expect(personAus('Herr K., 78 Jahre, internistische Station')).toEqual({ name: 'Herr K.', geschlecht: 'mann' });
    expect(personAus('Lina, 2 Jahre, Kinderstation')).toEqual({ name: 'Lina', geschlecht: 'kind' });
    expect(personAus('Ein Patient')).toBeNull();
    for (const s of SZENARIEN) expect(personAus(s.kurz), s.id).not.toBeNull();
    const herz = SZENARIEN.find((s) => s.id === 'herzinsuffizienz')!;
    const r = fotoRaumFuer(herz.id, herz.setting, herz.kurz)!;
    expect(r.marker[0]!.name).toBe('Herr K.');
    expect(r.personPasst).toBe(true);
    const hueft = SZENARIEN.find((s) => s.id === 'hueft-tep')!;
    expect(fotoRaumFuer(hueft.id, hueft.setting, hueft.kurz)!.personPasst).toBe(false);
  });
});

describe('Offline-Bedarf je Fall', () => {
  it('Probefälle laufen offline, KI-Fälle brauchen Netz; Raumvarianten sind dabei', async () => {
    const { fallOfflineBedarf } = await import('./offlinebedarf');
    const { PROBEFAELLE } = await import('./demo');
    const herz = fallOfflineBedarf(PROBEFAELLE[0]!.szenario);
    expect(herz.online).toBe(false);
    expect(herz.ersatz).toBe(true);
    expect(herz.dateien.some((d) => d.includes('12a_'))).toBe(true);
    expect(herz.dateien.some((d) => d.includes('19_krankenhaus_materialraum'))).toBe(true);
    const asthma = fallOfflineBedarf(PROBEFAELLE.find((p) => p.szenario.id === 'demo-asthma')!.szenario);
    expect(asthma.dateien.some((d) => d.includes('personen/'))).toBe(true);
    expect(fallOfflineBedarf(SZENARIEN[0]!).online).toBe(true);
  });
});
