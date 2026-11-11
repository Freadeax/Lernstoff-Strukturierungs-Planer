// Fotoansicht des Praxissimulators: welcher Raum aus dem Bildpaket zu welchem Fall gehört
// und wo im Bild Patient, Monitor/Messgeräte, Material und Telefon liegen.
// Koordinaten in Prozent der Bildbreite/-höhe (Bilder 16:9). Bilder, Monitorflächen und die
// Bühne liegen gemeinsam für alle Simulatoren unter src/ui/sim/raeume (siehe docs/RAEUME.md).

import type { RaumId } from '../../ui/sim/raeume/katalog';
import type { RaumElement } from './raum';

export type Punkt = { x: number; y: number };
export type Detail = { id: 'insulingabe' | 'kompressionsstrumpf'; label: string; punkt: Punkt };

export type RaumFoto = {
  /** Raum aus dem gemeinsamen Katalog; die Variante ohne Monitor (12a) wählt die Bühne selbst. */
  id: RaumId;
  nacht?: boolean;
  orte: Record<RaumElement, Punkt>;
  /** Bezeichnungen, die im Foto genauer passen als die allgemeinen (z. B. Rufanlage statt Telefon). */
  namen?: Partial<Record<RaumElement, string>>;
  /** Zusätzliche Detailansichten (Lernclip, verändert den Fall nicht). */
  details?: Detail[];
  /** Bildvariante, solange eine Maßnahme läuft (z. B. 21b Inhalation, nachdem die Anordnung vorliegt). */
  waehrend?: { id: RaumId; flag: string; minuten: number };
};

export const RAUMFOTOS: Record<string, RaumFoto> = {
  wohnzimmer: { id: '07_ambulant_wohnzimmer_kompression', orte: { patient: { x: 22, y: 32 }, monitor: { x: 86, y: 70 }, wagen: { x: 95, y: 84 }, telefon: { x: 72, y: 26 } },
    namen: { telefon: 'Diensthandy' }, details: [{ id: 'kompressionsstrumpf', label: 'Kompressionsstrumpf anziehen (Ablauf ansehen)', punkt: { x: 36, y: 74 } }] },
  bad: { id: '08_ambulant_pflegebad', orte: { patient: { x: 88, y: 42 }, monitor: { x: 13, y: 74 }, wagen: { x: 49, y: 56 }, telefon: { x: 6, y: 90 } }, namen: { telefon: 'Diensthandy' } },
  kueche: { id: '09_ambulant_kueche_diabetes', orte: { patient: { x: 73, y: 36 }, monitor: { x: 60, y: 84 }, wagen: { x: 43, y: 80 }, telefon: { x: 30, y: 78 } },
    namen: { telefon: 'Diensthandy' }, details: [{ id: 'insulingabe', label: 'Insulin-Pen am Übungspad (Ablauf ansehen)', punkt: { x: 51, y: 79 } }] },
  heimNacht: { id: '10_pflegeheim_nacht', nacht: true, orte: { patient: { x: 31, y: 40 }, monitor: { x: 10, y: 54 }, wagen: { x: 75, y: 57 }, telefon: { x: 21, y: 60 } }, namen: { telefon: 'Rufanlage und Diensttelefon' } },
  speiseraum: { id: '11_pflegeheim_speiseraum', orte: { patient: { x: 16, y: 40 }, monitor: { x: 33, y: 72 }, wagen: { x: 50, y: 60 }, telefon: { x: 54, y: 34 } } },
  kardiologie: { id: '12_station_kardiologie_monitoring', orte: { patient: { x: 28, y: 34 }, monitor: { x: 73, y: 44 }, wagen: { x: 74, y: 66 }, telefon: { x: 21, y: 24 } },
    namen: { telefon: 'Rufanlage und Stationstelefon' } },
  postop: { id: '13_station_postop', orte: { patient: { x: 77, y: 38 }, monitor: { x: 69, y: 30 }, wagen: { x: 92, y: 62 }, telefon: { x: 5, y: 40 } } },
  isolation: { id: '14_station_isolation', orte: { patient: { x: 15, y: 40 }, monitor: { x: 39, y: 44 }, wagen: { x: 79, y: 38 }, telefon: { x: 94, y: 52 } } },
  intensiv: { id: '15_intensiv_beatmung', orte: { patient: { x: 54, y: 40 }, monitor: { x: 90, y: 42 }, wagen: { x: 19, y: 34 }, telefon: { x: 72, y: 12 } } },
  triage: { id: '16_notaufnahme_triage', orte: { patient: { x: 40, y: 58 }, monitor: { x: 67, y: 44 }, wagen: { x: 36, y: 14 }, telefon: { x: 5, y: 46 } }, namen: { telefon: 'Arbeitsplatz und Telefon' } },
  untersuchung: { id: '17_notaufnahme_untersuchung', orte: { patient: { x: 28, y: 40 }, monitor: { x: 43, y: 38 }, wagen: { x: 93, y: 62 }, telefon: { x: 76, y: 40 } } },
  kleinkind: { id: '20_paediatrie_kleinkind', orte: { patient: { x: 45, y: 40 }, monitor: { x: 86, y: 56 }, wagen: { x: 9, y: 62 }, telefon: { x: 55, y: 86 } },
    namen: { wagen: 'Nachttisch mit Trinkbecher und Thermometer', telefon: 'Rufanlage' } },
  schulkind: { id: '21_paediatrie_schulkind', orte: { patient: { x: 42, y: 32 }, monitor: { x: 88, y: 54 }, wagen: { x: 24, y: 72 }, telefon: { x: 52, y: 88 } },
    namen: { wagen: 'Tisch mit Dosieraerosol und Spacer', telefon: 'Rufanlage' },
    waehrend: { id: '21b_paediatrie_schulkind_spacer', flag: 'orders', minuten: 15 } },
  heimTag: { id: '26b_pflegeheim_zimmer_fruehstueck_unberuehrt', orte: { patient: { x: 29, y: 38 }, monitor: { x: 6, y: 68 }, wagen: { x: 38, y: 83 }, telefon: { x: 13, y: 58 } },
    namen: { monitor: 'Nachttisch mit Trinkglas', wagen: 'Frühstückstablett', telefon: 'Rufanlage' } },
  heimSessel: { id: '26a_pflegeheim_zimmer_schlaganfall', orte: { patient: { x: 70, y: 34 }, monitor: { x: 6, y: 68 }, wagen: { x: 38, y: 83 }, telefon: { x: 13, y: 58 } },
    namen: { monitor: 'Nachttisch mit Trinkglas', wagen: 'Frühstückstablett', telefon: 'Rufanlage' } },
  zweibettNacht: { id: '27_station_zweibett_nacht', nacht: true, orte: { patient: { x: 40, y: 34 }, monitor: { x: 75, y: 46 }, wagen: { x: 59, y: 40 }, telefon: { x: 31, y: 53 } },
    namen: { wagen: 'Tür zum Flur (Material im Lager)', telefon: 'Rufanlage' },
    waehrend: { id: '27a_station_zweibett_nacht_niedrigbett_sturzmatte', flag: 'niedrigbett', minuten: 600 } },
  innere: { id: '30_station_zimmer_frau', orte: { patient: { x: 46, y: 46 }, monitor: { x: 79, y: 48 }, wagen: { x: 23, y: 24 }, telefon: { x: 51, y: 87 } },
    namen: { wagen: 'Infusion', telefon: 'Rufanlage' } },
  innereSepsis: { id: '30b_station_zimmer_frau_sepsis', orte: { patient: { x: 46, y: 46 }, monitor: { x: 79, y: 48 }, wagen: { x: 23, y: 24 }, telefon: { x: 51, y: 87 } },
    namen: { wagen: 'Infusion', telefon: 'Rufanlage' } },
  schockraum: { id: '18_notaufnahme_schockraum_nacht', nacht: true, orte: { patient: { x: 42, y: 45 }, monitor: { x: 9, y: 40 }, wagen: { x: 90, y: 64 }, telefon: { x: 63, y: 30 } } },
};

/** Fall → Raum. Fälle ohne Eintrag zeigen nur die Zeichnung. Neue Fälle hier eintragen (Test prüft das). */
export const FALL_RAUM: Record<string, keyof typeof RAUMFOTOS> = {
  hausbesuch: 'wohnzimmer', pflegeheim: 'speiseraum', nachtwache: 'kardiologie', zna: 'triage', its: 'intensiv',
  kind: 'kleinkind', psychiatrie: 'speiseraum', reha: 'bad', palliativ: 'heimNacht', sepsis: 'innereSepsis',
  nachblutung: 'postop', schlaganfall: 'heimSessel', anaphylaxie: 'innere', lungenembolie: 'kardiologie',
  delir: 'zweibettNacht', asthma: 'schulkind', demenz: 'heimTag',
};

export function raumFotoFuer(fallId: string): RaumFoto | undefined {
  const key = FALL_RAUM[fallId];
  return key ? RAUMFOTOS[key] : undefined;
}

/** Gilt gerade eine Bildvariante für eine laufende Maßnahme? Liefert deren Raum. */
export function laufendeVariante(raum: RaumFoto, flags: Record<string, number>, zeit: number): RaumId | undefined {
  const w = raum.waehrend; if (!w) return undefined;
  const seit = flags[w.flag];
  return seit !== undefined && zeit >= seit && zeit - seit < w.minuten * 60 ? w.id : undefined;
}
