import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { bestellteIds, bildMasse, pruefeLieferung, type LieferDatei } from '../../../scripts/lieferung-lib.mjs';

const masse = (p: string) => bildMasse(readFileSync(`public/${p}`));

describe('Lieferprüfung', () => {
  it('liest Bildmaße aus WebP, PNG und JPEG', () => {
    expect(masse('raeume/12_station_kardiologie_monitoring.webp')).toMatchObject({ breite: 1280, hoehe: 720 });
    expect(masse('bildgebung/lungenembolie-ct/schicht-01.png')?.typ).toBe('png');
    expect(masse('bildgebung/erguss-rx/rontgen-pa.jpg')?.typ).toBe('jpeg');
    expect(masse('personen/praxis-kind_stabil.webp')).toMatchObject({ breite: 512, hoehe: 512 });
  });

  it('meldet Fehler und Hinweise je Datei', () => {
    const d = (pfad: string, breite: number, hoehe: number): LieferDatei => ({ pfad, groesse: 1000, masse: { breite, hoehe, typ: 'png' } });
    const katalog = [
      { id: '42_station_bewusstlos', datei: 'raeume/42_station_bewusstlos.png', lizenz: 'eigene KI-Erzeugung', urheber: 'P', beschreibung: 'x', faelle: ['notfall:reanimation'] },
      { id: '43_x', datei: 'raeume/43_x.png', faelle: ['Reanimation'] },
      { id: 'fehlt', datei: 'raeume/99_fehlt.png', lizenz: 'x', urheber: 'y' },
    ];
    const r = pruefeLieferung([
      d('raeume/42_station_bewusstlos.png', 1672, 941),
      d('raeume/43_x.png', 1000, 1000),
      d('personen/fall-copd_kritisch.png', 512, 512),
      { pfad: 'animationen/haendedesinfektion.mp4', groesse: 2e6, masse: null },
      d('animationen/haendedesinfektion-1.png', 836, 470),
    ], { katalog, vorhandeneIds: ['12_station_kardiologie_monitoring'], bestellteIds: ['42_station_bewusstlos'] });
    const von = (n: string) => r.find((e) => e.datei.endsWith(n))!;
    expect(von('42_station_bewusstlos.png').stufe).toBe('ok');
    expect(von('43_x.png').meldungen.join()).toMatch(/16:9.*zu klein.*Lizenz fehlt.*Urheber fehlt.*Format/);
    expect(von('haendedesinfektion.mp4').meldungen.join()).toMatch(/Phasenbild haendedesinfektion-2 fehlt/);
    expect(von('fall-copd_kritisch.png').meldungen.join()).toMatch(/fehlt im ASSET_KATALOG/);
    expect(von('99_fehlt.png').meldungen).toEqual(['im Katalog, aber Datei fehlt']);
  });

  it('kennt die Bestellliste', () => {
    const ids = bestellteIds(readFileSync('docs/MATERIAL-BEDARF.md', 'utf8') + readFileSync('docs/BESTELLUNG.md', 'utf8'));
    expect(ids).toContain('42_station_bewusstlos');
    expect(ids).toContain('21_paediatrie_schulkind_sensor_ab');
  });
});
