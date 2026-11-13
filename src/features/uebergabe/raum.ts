// Wo die Übergabe stattfindet: Raumfoto aus dem gemeinsamen Bildpaket (src/ui/sim/raeume).
// Fotos zeigen die Situation, nicht die Person aus dem Fall (Beispielbilder).
import type { RaumId } from '../../ui/sim/raeume/katalog';
import type { Fall } from './faelle';

export const UEBERGABE_RAUM: Record<string, RaumId> = {
  sepsis: '13_station_postop',
  hypo: '26h_pflegeheim_zimmer_hypoglykaemie',
  sturz: '27_station_zweibett_nacht',
  atemnot: '12_station_kardiologie_monitoring',
  kind: '20_paediatrie_kleinkind',
  schmerz: '13_station_postop',
  delir: '07_ambulant_wohnzimmer_kompression',
  schlaganfall: '30_station_zimmer_frau',
};

export const raumFuer = (f: Pick<Fall, 'id' | 'raum'>): RaumId | undefined => f.raum ?? UEBERGABE_RAUM[f.id];

/** Was die Vorlesefunktion sagt: Lage und Falldaten wie bei einer mündlichen Übernahme. */
export function vorlesetext(f: Fall): string {
  return [f.lage, ...f.daten.map((d) => `${d.label}: ${d.wert}.`)].join(' ').replace(/\.\./g, '.');
}
