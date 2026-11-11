import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { assetBericht, assetInventar, raumVerwendungen, zustandsLuecken } from './inventar';
import { RAEUME, raumFuerZustand, raumVarianten } from '../../ui/sim/raeume/katalog';
import { FREIGABEN } from './freigaben';

const ORDNER = ['raeume', 'personen', 'sim-videos', 'bildgebung', 'titelbilder'];
function dateienUnter(dir: string): string[] {
  return readdirSync(join('public', dir), { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? dateienUnter(`${dir}/${d.name}`) : [`${dir}/${d.name}`]);
}

describe('Asset-Status (SIM-06)', () => {
  const inv = assetInventar();

  it('jede Datei unter public/ steht im Inventar und umgekehrt', () => {
    const vorhanden = ORDNER.flatMap(dateienUnter).filter((d) => !d.endsWith('.json') && !d.endsWith('.md')).sort();
    const erfasst = inv.map((e) => e.datei).sort();
    expect(vorhanden.filter((d) => !erfasst.includes(d)), 'Datei ohne Katalogeintrag').toEqual([]);
    expect(erfasst.filter((d) => !existsSync(join('public', d))), 'Katalogeintrag ohne Datei').toEqual([]);
  });

  it('jede Datei hat Lizenzangabe und Offline-Weg; Freigaben nennen nur vorhandene Dateien', () => {
    for (const e of inv) { expect(e.lizenz, e.datei).not.toBe(''); expect(e.offline).toBeTruthy(); }
    for (const [datei, f] of Object.entries(FREIGABEN)) {
      expect(inv.some((e) => e.datei === datei), datei).toBe(true);
      expect(f.am).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('Zustandsregeln: Nacht, Gerät aus/an, Sensor', () => {
    expect(raumFuerZustand('20_paediatrie_kleinkind', { nacht: true })).toBe('20n_paediatrie_kleinkind_nacht');
    expect(raumFuerZustand('20_paediatrie_kleinkind', { monitor: 'abwesend' })).toBe('20a_paediatrie_kleinkind_ohne_monitor');
    expect(raumFuerZustand('20a_paediatrie_kleinkind_ohne_monitor', { monitor: 'laeuft' })).toBe('20m_paediatrie_kleinkind_monitor_verbunden');
    // Ohne gelieferte Sensor-ab-Variante bleibt das Bild mit Sensor (der Monitor zeigt den Ausfall)
    expect(raumFuerZustand('21_paediatrie_schulkind', 'signalausfall')).toBe('21m_paediatrie_schulkind_monitor_verbunden');
    expect(raumVarianten('12_station_kardiologie_monitoring')).toContain('12a_station_kardiologie_ohne_monitor');
    for (const r of Object.values(RAEUME)) if (r.sensorAb) expect(RAEUME[r.sensorAb]).toBeDefined();
  });

  it('Varianten mit Fall werden erreicht (keine toten Zustandsbilder)', () => {
    const v = raumVerwendungen();
    for (const id of ['12a_station_kardiologie_ohne_monitor', '20n_paediatrie_kleinkind_nacht', '21b_paediatrie_schulkind_spacer', '27a_station_zweibett_nacht_niedrigbett_sturzmatte'] as const) {
      expect(v.get(id)?.length, id).toBeGreaterThan(0);
    }
    expect(zustandsLuecken().length).toBeGreaterThan(0);
  });

  it('docs/ASSET-STATUS.md ist aktuell', () => {
    const bericht = assetBericht();
    if (process.env.ASSET_STATUS_SCHREIBEN) writeFileSync('docs/ASSET-STATUS.md', bericht);
    expect(readFileSync('docs/ASSET-STATUS.md', 'utf8'), 'npm run assets:status ausführen').toBe(bericht);
  });
});
