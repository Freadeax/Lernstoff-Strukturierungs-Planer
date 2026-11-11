// Fotoräume aus Philipps Komplettpaket v2 für den KI-Fallsimulator: welcher Fall in welchem
// Raum spielt und wo die nummerierten Marker im Foto sitzen (relativ 0…1). Die Bilder und
// die Bühne liegen im gemeinsamen Baustein src/ui/sim/raeume; hier steckt nur die Zuordnung.

import type { Setting } from './faelle';
import type { Marker } from './raeume';
import type { Fokus } from './szene';

export type FotoRaumId =
  | '07_ambulant_wohnzimmer_kompression' | '08_ambulant_pflegebad'
  | '10_pflegeheim_nacht' | '11_pflegeheim_speiseraum'
  | '12_station_kardiologie_monitoring' | '13_station_postop';

export interface FotoMarker extends Marker { x: number; y: number }
export interface FotoRaum { id: FotoRaumId; titel: string; marker: FotoMarker[]; /** Foto zeigt schon Nacht */ nacht?: boolean; /** Raum hat einen Monitor im Bild */ monitor?: boolean }

export const FOTORAEUME: Record<FotoRaumId, FotoRaum> = {
  '12_station_kardiologie_monitoring': {
    id: '12_station_kardiologie_monitoring', titel: 'Kardiologie, Monitoring am Bett', monitor: true,
    marker: [
      { id: 'patient', nr: 1, name: 'Patient', ort: 'bett', x: 0.3, y: 0.52 },
      { id: 'monitor', nr: 2, name: 'Monitor und Messgeräte', ort: 'monitor', x: 0.73, y: 0.2 },
      { id: 'infusion', nr: 3, name: 'Infusionsständer', ort: 'wagen', x: 0.5, y: 0.3 },
    ],
  },
  '13_station_postop': {
    id: '13_station_postop', titel: 'Zimmer nach der Operation',
    marker: [
      { id: 'patient', nr: 1, name: 'Patient', ort: 'bett', x: 0.6, y: 0.52 },
      { id: 'monitor', nr: 2, name: 'Pumpe und Messgeräte', ort: 'monitor', x: 0.7, y: 0.3 },
      { id: 'infusion', nr: 3, name: 'Infusion', ort: 'wagen', x: 0.69, y: 0.1 },
      { id: 'rollstuhl', nr: 4, name: 'Rollstuhl', ort: 'tuer', x: 0.17, y: 0.46 },
    ],
  },
  '10_pflegeheim_nacht': {
    id: '10_pflegeheim_nacht', titel: 'Bewohnerzimmer im Nachtdienst', nacht: true,
    marker: [
      { id: 'patient', nr: 1, name: 'Bewohner', ort: 'bett', x: 0.32, y: 0.44 },
      { id: 'nachttisch', nr: 2, name: 'Nachttisch mit Rufanlage', ort: 'monitor', x: 0.16, y: 0.53 },
      { id: 'rollator', nr: 3, name: 'Rollator', ort: 'wagen', x: 0.74, y: 0.55 },
    ],
  },
  '11_pflegeheim_speiseraum': {
    id: '11_pflegeheim_speiseraum', titel: 'Speiseraum im Pflegeheim',
    marker: [
      { id: 'patient', nr: 1, name: 'Bewohnerin', ort: 'bett', x: 0.12, y: 0.42 },
      { id: 'essen', nr: 2, name: 'Mahlzeit und Trinkbecher', ort: 'monitor', x: 0.33, y: 0.64 },
      { id: 'rollstuhl', nr: 3, name: 'Rollstuhl', ort: 'wagen', x: 0.06, y: 0.82 },
    ],
  },
  '07_ambulant_wohnzimmer_kompression': {
    id: '07_ambulant_wohnzimmer_kompression', titel: 'Wohnzimmer beim Hausbesuch',
    marker: [
      { id: 'patient', nr: 1, name: 'Klientin', ort: 'bett', x: 0.24, y: 0.36 },
      { id: 'rucksack', nr: 2, name: 'Pflegetasche', ort: 'monitor', x: 0.94, y: 0.75 },
      { id: 'rollator', nr: 3, name: 'Rollator', ort: 'wagen', x: 0.57, y: 0.4 },
    ],
  },
  '08_ambulant_pflegebad': {
    id: '08_ambulant_pflegebad', titel: 'Bad beim Hausbesuch',
    marker: [
      { id: 'patient', nr: 1, name: 'Klientin', ort: 'bett', x: 0.88, y: 0.44 },
      { id: 'rucksack', nr: 2, name: 'Pflegetasche', ort: 'monitor', x: 0.11, y: 0.78 },
      { id: 'duschstuhl', nr: 3, name: 'Duschstuhl', ort: 'wagen', x: 0.47, y: 0.55 },
    ],
  },
};

/** Fester Raum je Fall; Fälle ohne Eintrag bekommen den Raum ihres Settings. */
const RAUM_FUER_FALL: Record<string, FotoRaumId> = {
  'demo-atemnot': '12_station_kardiologie_monitoring',
  herzinsuffizienz: '12_station_kardiologie_monitoring',
  lungenembolie: '12_station_kardiologie_monitoring',
  anaphylaxie: '12_station_kardiologie_monitoring',
  'hueft-tep': '13_station_postop',
  nachblutung: '13_station_postop',
  schlaganfall: '13_station_postop',
  sepsis: '13_station_postop',
  'delir-nacht': '13_station_postop',
  hypoglykaemie: '11_pflegeheim_speiseraum',
  'demenz-verfuegung': '11_pflegeheim_speiseraum',
  pneumonie: '10_pflegeheim_nacht',
  palliativ: '10_pflegeheim_nacht',
  'sturz-nacht': '10_pflegeheim_nacht',
  dekubitus: '08_ambulant_pflegebad',
  copd: '07_ambulant_wohnzimmer_kompression',
};

const RAUM_FUER_SETTING: Partial<Record<Setting, FotoRaumId>> = {
  krankenhaus: '13_station_postop', langzeit: '10_pflegeheim_nacht', ambulant: '07_ambulant_wohnzimmer_kompression',
  // Pädiatrie: die Fotos zeigen Erwachsene, dort bleibt die gezeichnete Szene.
};

export function fotoRaumFuer(szenarioId: string, setting: Setting): FotoRaum | null {
  if (setting === 'paediatrie') return null;
  const id = RAUM_FUER_FALL[szenarioId] ?? RAUM_FUER_SETTING[setting];
  return id ? FOTORAEUME[id] : null;
}

/** Kamerazoom zum Ort der Handlung: auf den Marker, der dort steht. */
export function fotoFokus(raum: FotoRaum, fokus: Fokus | null | undefined): { x: number; y: number; zoom: number } | undefined {
  if (!fokus || fokus === 'raum') return undefined;
  const m = raum.marker.find((k) => k.ort === fokus);
  return m ? { x: m.x, y: m.y, zoom: 1.6 } : undefined;
}
