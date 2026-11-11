// Fotoräume aus Philipps Komplettpaket v2 für den KI-Fallsimulator: welcher Fall in welchem
// Raum spielt und wo die nummerierten Marker im Foto sitzen (relativ 0…1). Die Bilder und
// die Bühne liegen im gemeinsamen Baustein src/ui/sim/raeume; hier steckt nur die Zuordnung.

import type { RaumId } from '../../ui/sim/raeume/katalog';
import type { Setting } from './faelle';
import type { Marker } from './raeume';
import type { Fokus } from './szene';

export type FotoRaumId = Extract<RaumId,
  | '07_ambulant_wohnzimmer_kompression' | '08_ambulant_pflegebad' | '09_ambulant_kueche_diabetes'
  | '10_pflegeheim_nacht' | '11_pflegeheim_speiseraum'
  | '12_station_kardiologie_monitoring' | '13_station_postop'
  | '20f_paediatrie_kleinkind_fieberkrampf' | '21_paediatrie_schulkind'
  | '26b_pflegeheim_zimmer_fruehstueck_unberuehrt' | '26h_pflegeheim_zimmer_hypoglykaemie' | '26p_pflegeheim_zimmer_pneumonie'
  | '27_station_zweibett_nacht' | '30_station_zimmer_frau' | '30b_station_zimmer_frau_sepsis'>;

export interface FotoMarker extends Marker { x: number; y: number }
export type Geschlecht = 'mann' | 'frau' | 'kind';
export interface FotoRaum {
  id: FotoRaumId; titel: string; marker: FotoMarker[];
  /** Wer im Foto die Hauptperson ist (für den Abgleich mit dem Fall) */
  person: Geschlecht;
  /** Foto zeigt schon Nacht */ nacht?: boolean;
  /** Raum hat einen Monitor im Bild */ monitor?: boolean;
}

/** Person aus der Fallbeschreibung: „Herr K., 78 Jahre …“ oder „Lina, 2 Jahre …“. */
export function personAus(kurz: string): { name: string; geschlecht: Geschlecht } | null {
  const erw = /^(Herr|Frau) ([A-ZÄÖÜ][a-zäöüß]*)\./.exec(kurz);
  if (erw) return { name: `${erw[1]} ${erw[2]}.`, geschlecht: erw[1] === 'Herr' ? 'mann' : 'frau' };
  const vor = /^([A-ZÄÖÜ][a-zäöüß]+), (\d+) Jahre/.exec(kurz);
  if (vor) return { name: vor[1]!, geschlecht: Number(vor[2]) < 18 ? 'kind' : 'frau' };
  return null;
}


export const FOTORAEUME: Record<FotoRaumId, FotoRaum> = {
  '12_station_kardiologie_monitoring': {
    id: '12_station_kardiologie_monitoring', person: 'mann', titel: 'Kardiologie, Monitoring am Bett', monitor: true,
    marker: [
      { id: 'patient', nr: 1, name: 'Patient', ort: 'bett', x: 0.3, y: 0.52 },
      { id: 'monitor', nr: 2, name: 'Monitor und Messgeräte', ort: 'monitor', x: 0.73, y: 0.34 },
      { id: 'infusion', nr: 3, name: 'Infusionsständer', ort: 'wagen', x: 0.5, y: 0.3 },
    ],
  },
  '13_station_postop': {
    id: '13_station_postop', person: 'mann', titel: 'Zimmer nach der Operation',
    marker: [
      { id: 'patient', nr: 1, name: 'Patient', ort: 'bett', x: 0.6, y: 0.52 },
      { id: 'monitor', nr: 2, name: 'Pumpe und Messgeräte', ort: 'monitor', x: 0.7, y: 0.3 },
      { id: 'infusion', nr: 3, name: 'Infusion', ort: 'wagen', x: 0.69, y: 0.1 },
      { id: 'rollstuhl', nr: 4, name: 'Rollstuhl', ort: 'tuer', x: 0.17, y: 0.46 },
    ],
  },
  '10_pflegeheim_nacht': {
    id: '10_pflegeheim_nacht', person: 'mann', titel: 'Bewohnerzimmer im Nachtdienst', nacht: true,
    marker: [
      { id: 'patient', nr: 1, name: 'Bewohner', ort: 'bett', x: 0.32, y: 0.44 },
      { id: 'nachttisch', nr: 2, name: 'Nachttisch mit Rufanlage', ort: 'monitor', x: 0.16, y: 0.53 },
      { id: 'rollator', nr: 3, name: 'Rollator', ort: 'wagen', x: 0.74, y: 0.55 },
    ],
  },
  '11_pflegeheim_speiseraum': {
    id: '11_pflegeheim_speiseraum', person: 'frau', titel: 'Speiseraum im Pflegeheim',
    marker: [
      { id: 'patient', nr: 1, name: 'Bewohnerin', ort: 'bett', x: 0.12, y: 0.42 },
      { id: 'essen', nr: 2, name: 'Mahlzeit und Trinkbecher', ort: 'monitor', x: 0.33, y: 0.64 },
      { id: 'rollstuhl', nr: 3, name: 'Rollstuhl', ort: 'wagen', x: 0.06, y: 0.82 },
    ],
  },
  '26b_pflegeheim_zimmer_fruehstueck_unberuehrt': {
    id: '26b_pflegeheim_zimmer_fruehstueck_unberuehrt', person: 'frau', titel: 'Bewohnerzimmer, Frühstück unberührt',
    marker: [
      { id: 'patient', nr: 1, name: 'Bewohnerin', ort: 'bett', x: 0.29, y: 0.38 },
      { id: 'nachttisch', nr: 2, name: 'Nachttisch mit Rufanlage', ort: 'monitor', x: 0.1, y: 0.56 },
      { id: 'essen', nr: 3, name: 'Frühstückstablett', ort: 'wagen', x: 0.38, y: 0.83 },
      { id: 'rollstuhl', nr: 4, name: 'Rollstuhl', ort: 'tuer', x: 0.9, y: 0.48 },
    ],
  },
  '26h_pflegeheim_zimmer_hypoglykaemie': {
    id: '26h_pflegeheim_zimmer_hypoglykaemie', person: 'frau', titel: 'Bewohnerzimmer am Vormittag',
    marker: [
      { id: 'patient', nr: 1, name: 'Bewohnerin', ort: 'bett', x: 0.29, y: 0.38 },
      { id: 'nachttisch', nr: 2, name: 'Nachttisch mit Rufanlage', ort: 'monitor', x: 0.1, y: 0.56 },
      { id: 'essen', nr: 3, name: 'Frühstückstablett', ort: 'wagen', x: 0.38, y: 0.83 },
      { id: 'rollstuhl', nr: 4, name: 'Rollstuhl', ort: 'tuer', x: 0.9, y: 0.48 },
    ],
  },
  '26p_pflegeheim_zimmer_pneumonie': {
    id: '26p_pflegeheim_zimmer_pneumonie', person: 'mann', titel: 'Bewohnerzimmer am Vormittag',
    marker: [
      { id: 'patient', nr: 1, name: 'Bewohner', ort: 'bett', x: 0.29, y: 0.38 },
      { id: 'nachttisch', nr: 2, name: 'Nachttisch mit Rufanlage', ort: 'monitor', x: 0.1, y: 0.56 },
      { id: 'essen', nr: 3, name: 'Frühstückstablett', ort: 'wagen', x: 0.38, y: 0.83 },
      { id: 'rollstuhl', nr: 4, name: 'Rollstuhl', ort: 'tuer', x: 0.9, y: 0.48 },
    ],
  },
  '27_station_zweibett_nacht': {
    id: '27_station_zweibett_nacht', person: 'mann', titel: 'Zweibettzimmer in der Nacht', nacht: true, monitor: true,
    marker: [
      { id: 'patient', nr: 1, name: 'Patient', ort: 'bett', x: 0.4, y: 0.34 },
      { id: 'monitor', nr: 2, name: 'Monitorwagen', ort: 'monitor', x: 0.75, y: 0.46 },
      { id: 'nachttisch', nr: 3, name: 'Bettgitter und Rufanlage', ort: 'wagen', x: 0.31, y: 0.53 },
    ],
  },
  '30_station_zimmer_frau': {
    id: '30_station_zimmer_frau', person: 'frau', titel: 'Internistisches Zimmer mit Infusion', monitor: true,
    marker: [
      { id: 'patient', nr: 1, name: 'Patientin', ort: 'bett', x: 0.46, y: 0.46 },
      { id: 'monitor', nr: 2, name: 'Monitor und Messgeräte', ort: 'monitor', x: 0.79, y: 0.48 },
      { id: 'infusion', nr: 3, name: 'Infusion', ort: 'wagen', x: 0.23, y: 0.24 },
    ],
  },
  '30b_station_zimmer_frau_sepsis': {
    id: '30b_station_zimmer_frau_sepsis', person: 'frau', titel: 'Internistisches Zimmer', monitor: true,
    marker: [
      { id: 'patient', nr: 1, name: 'Patientin', ort: 'bett', x: 0.46, y: 0.46 },
      { id: 'monitor', nr: 2, name: 'Monitor und Messgeräte', ort: 'monitor', x: 0.79, y: 0.48 },
      { id: 'infusion', nr: 3, name: 'Infusion', ort: 'wagen', x: 0.23, y: 0.24 },
    ],
  },
  '20f_paediatrie_kleinkind_fieberkrampf': {
    id: '20f_paediatrie_kleinkind_fieberkrampf', person: 'kind', titel: 'Kinderzimmer auf Station', monitor: true,
    marker: [
      { id: 'patient', nr: 1, name: 'Kind', ort: 'bett', x: 0.45, y: 0.4 },
      { id: 'monitor', nr: 2, name: 'Monitor und Messgeräte', ort: 'monitor', x: 0.86, y: 0.55 },
      { id: 'nachttisch', nr: 3, name: 'Nachttisch mit Trinkbecher und Thermometer', ort: 'wagen', x: 0.09, y: 0.62 },
    ],
  },
  '21_paediatrie_schulkind': {
    id: '21_paediatrie_schulkind', person: 'kind', titel: 'Kinderzimmer mit Sauerstoffanschluss', monitor: true,
    marker: [
      { id: 'patient', nr: 1, name: 'Kind', ort: 'bett', x: 0.42, y: 0.32 },
      { id: 'monitor', nr: 2, name: 'Monitor und Messgeräte', ort: 'monitor', x: 0.88, y: 0.53 },
      { id: 'nachttisch', nr: 3, name: 'Tisch mit Dosieraerosol und Spacer', ort: 'wagen', x: 0.24, y: 0.72 },
    ],
  },
  '09_ambulant_kueche_diabetes': {
    id: '09_ambulant_kueche_diabetes', person: 'mann', titel: 'Küche beim Hausbesuch',
    marker: [
      { id: 'patient', nr: 1, name: 'Klient', ort: 'bett', x: 0.8, y: 0.45 },
      { id: 'rucksack', nr: 2, name: 'Messgeräte auf dem Tablett', ort: 'monitor', x: 0.5, y: 0.8 },
      { id: 'doku', nr: 3, name: 'Pflegedokumentation', ort: 'wagen', x: 0.3, y: 0.74 },
    ],
  },
  '07_ambulant_wohnzimmer_kompression': {
    id: '07_ambulant_wohnzimmer_kompression', person: 'frau', titel: 'Wohnzimmer beim Hausbesuch',
    marker: [
      { id: 'patient', nr: 1, name: 'Klientin', ort: 'bett', x: 0.24, y: 0.36 },
      { id: 'rucksack', nr: 2, name: 'Pflegetasche', ort: 'monitor', x: 0.94, y: 0.75 },
      { id: 'rollator', nr: 3, name: 'Rollator', ort: 'wagen', x: 0.57, y: 0.4 },
    ],
  },
  '08_ambulant_pflegebad': {
    id: '08_ambulant_pflegebad', person: 'frau', titel: 'Bad beim Hausbesuch',
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
  anaphylaxie: '30_station_zimmer_frau',
  'hueft-tep': '13_station_postop',
  nachblutung: '13_station_postop',
  schlaganfall: '13_station_postop',
  sepsis: '30b_station_zimmer_frau_sepsis',
  'delir-nacht': '27_station_zweibett_nacht',
  hypoglykaemie: '26h_pflegeheim_zimmer_hypoglykaemie',
  'demenz-verfuegung': '26b_pflegeheim_zimmer_fruehstueck_unberuehrt',
  pneumonie: '26p_pflegeheim_zimmer_pneumonie',
  palliativ: '10_pflegeheim_nacht',
  'sturz-nacht': '10_pflegeheim_nacht',
  // Herr L. und Herr P.: die Küche zeigt einen älteren Mann, Wohnzimmer und Bad eine Frau
  dekubitus: '09_ambulant_kueche_diabetes',
  copd: '09_ambulant_kueche_diabetes',
  fieberkrampf: '20f_paediatrie_kleinkind_fieberkrampf',
  'asthma-kind': '21_paediatrie_schulkind',
};

const RAUM_FUER_SETTING: Partial<Record<Setting, FotoRaumId>> = {
  krankenhaus: '13_station_postop', langzeit: '10_pflegeheim_nacht', ambulant: '07_ambulant_wohnzimmer_kompression',
  paediatrie: '21_paediatrie_schulkind',
};

export interface FallFotoRaum extends FotoRaum {
  /** Name aus dem Fall, z. B. „Frau M.“ */
  personName?: string;
  /** false: Das Foto zeigt eine andere Person als im Fall (Beispielfoto). */
  personPasst: boolean;
}

/** Raum zum Fall; mit der Fallbeschreibung trägt Marker 1 den Namen aus dem Fall. */
export function fotoRaumFuer(szenarioId: string, setting: Setting, kurz = ''): FallFotoRaum | null {
  const id = RAUM_FUER_FALL[szenarioId] ?? RAUM_FUER_SETTING[setting];
  if (!id) return null;
  const raum = FOTORAEUME[id];
  const p = personAus(kurz);
  if (!p) return { ...raum, personPasst: true };
  return {
    ...raum, personName: p.name, personPasst: p.geschlecht === raum.person,
    marker: raum.marker.map((m) => (m.id === 'patient' ? { ...m, name: p.name } : m)),
  };
}

/** Kamerazoom zum Ort der Handlung: auf den Marker, der dort steht. */
export function fotoFokus(raum: FotoRaum, fokus: Fokus | null | undefined): { x: number; y: number; zoom: number } | undefined {
  if (!fokus || fokus === 'raum') return undefined;
  const m = raum.marker.find((k) => k.ort === fokus);
  return m ? { x: m.x, y: m.y, zoom: 1.45 } : undefined;
}
