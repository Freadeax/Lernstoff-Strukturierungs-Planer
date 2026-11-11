// Steckbrief je Assessment-Instrument (Audit: „Skalenfassung, Zielgruppe, Rechte, fehlende Angaben und
// Bewertung klar ausweisen. Score von der folgenden pflegerischen Beurteilung unterscheiden.“)
// Rechte sind nicht juristisch geprüft: Der Steckbrief nennt Urheber bzw. Rechteinhaber, soweit bekannt,
// und den Prüfstand. Vor einer Veröffentlichung über den Unterricht hinaus Rechte klären.

import type { InstrumentId } from './instrumente';

export type RechteStatus = 'nicht-geprueft' | 'geklaert';

export interface Steckbrief {
  /** Welche Fassung hier abgebildet ist. */
  fassung: string;
  /** Originalquelle mit Jahr. */
  original: { titel: string; stand: string };
  zielgruppe: string;
  /** Wofür das Instrument nicht gedacht ist. */
  nichtFuer: string;
  rechte: string;
  rechteStatus: RechteStatus;
  /** Was der Score nicht beantwortet: dafür braucht es die pflegerische Beurteilung. */
  grenzen: string;
}

const LEHRFASSUNG = 'Gekürzte deutsche Lehrfassung zum Üben, nicht das Originalformular';

export const STECKBRIEFE: Record<InstrumentId, Steckbrief> = {
  braden: {
    fassung: LEHRFASSUNG, original: { titel: 'Bergstrom, Braden et al.: The Braden Scale for Predicting Pressure Sore Risk', stand: '1987' },
    zielgruppe: 'Erwachsene in Klinik und Langzeitpflege', nichtFuer: 'Kinder (dafür gibt es eigene Instrumente wie die Braden-Q-Skala)',
    rechte: 'Urheberinnen: Barbara Braden und Nancy Bergstrom', rechteStatus: 'nicht-geprueft',
    grenzen: 'Der Score sagt nichts über den aktuellen Hautzustand. Hautinspektion, Schmerzen und individuelle Risiken (z. B. lange OP) gehören in die pflegerische Beurteilung.',
  },
  norton: {
    fassung: `${LEHRFASSUNG}; Erweiterung nach Bienstein`, original: { titel: 'Norton, McLaren, Exton-Smith: An investigation of geriatric nursing problems in hospital', stand: '1962' },
    zielgruppe: 'Ältere Menschen in der stationären Pflege', nichtFuer: 'Kinder und Intensivpatienten',
    rechte: 'Original: Doreen Norton; Erweiterung: Christel Bienstein (Lehrbuchfassung)', rechteStatus: 'nicht-geprueft',
    grenzen: 'Die Skala bildet das Risiko grob ab. Hautbefund, Druckstellen und die Situation der Person gehören in die pflegerische Beurteilung.',
  },
  barthel: {
    fassung: 'Hamburger Einstufungsmanual zum Barthel-Index, gekürzte Lehrfassung', original: { titel: 'Lübke, Meinck, von Renteln-Kruse: Der Barthel-Index in der Geriatrie (Hamburger Manual)', stand: '2004' },
    zielgruppe: 'Erwachsene, vor allem Geriatrie und Rehabilitation', nichtFuer: 'Kinder; feine Veränderungen bei sehr selbstständigen Personen (Deckeneffekt)',
    rechte: 'Original: Mahoney und Barthel (1965); Manual: Lübke et al.', rechteStatus: 'nicht-geprueft',
    grenzen: 'Der Index misst, was die Person tatsächlich tut, nicht was sie könnte. Ressourcen, Wünsche und Ziele gehören in die pflegerische Beurteilung.',
  },
  nrs: {
    fassung: 'Numerische Rating-Skala 0 bis 10', original: { titel: 'DNQP: Expertenstandard Schmerzmanagement in der Pflege', stand: '2020' },
    zielgruppe: 'Menschen, die Schmerzen selbst einschätzen und mitteilen können', nichtFuer: 'Menschen ohne verlässliche Selbstauskunft, z. B. bei fortgeschrittener Demenz (dafür BESD)',
    rechte: 'Allgemein verbreitete Skala, kein Rechteinhaber bekannt', rechteStatus: 'nicht-geprueft',
    grenzen: 'Die Zahl ist die Selbstauskunft. Was sie für die Person bedeutet (Schlaf, Bewegung, Ziel), klärt erst das Gespräch und die pflegerische Beurteilung.',
  },
  besd: {
    fassung: 'BESD, deutsche Fassung der PAINAD, gekürzte Lehrfassung', original: { titel: 'Basler et al.: Beurteilung von Schmerz bei Demenz (BESD)', stand: '2006' },
    zielgruppe: 'Menschen mit Demenz, die Schmerzen nicht verlässlich mitteilen können', nichtFuer: 'Menschen mit verlässlicher Selbstauskunft (dann zuerst NRS)',
    rechte: 'Original PAINAD: Warden, Hurley, Volicer (2003); deutsche Fassung: Basler et al.', rechteStatus: 'nicht-geprueft',
    grenzen: 'Verhalten kann auch andere Ursachen haben (Angst, Hunger, Harndrang). Die pflegerische Beurteilung prüft Ursachen und Wirkung einer Maßnahme.',
  },
  mna: {
    fassung: 'MNA-SF (Kurzform), gekürzte Lehrfassung', original: { titel: 'Kaiser et al.: Validation of the Mini Nutritional Assessment Short-Form (MNA-SF)', stand: '2009' },
    zielgruppe: 'Menschen ab 65 Jahren', nichtFuer: 'Kinder und jüngere Erwachsene; akute Diagnostik einer Mangelernährung',
    rechte: 'Rechteinhaber: Société des Produits Nestlé (Marke MNA)', rechteStatus: 'nicht-geprueft',
    grenzen: 'Der Score ist ein Screening. Essgewohnheiten, Kauen, Schlucken, Vorlieben und Ursachen klärt die pflegerische Beurteilung.',
  },
  gcs: {
    fassung: 'Glasgow Coma Scale für Erwachsene', original: { titel: 'Teasdale, Jennett: Assessment of coma and impaired consciousness', stand: '1974' },
    zielgruppe: 'Erwachsene und ältere Kinder mit Bewusstseinsstörung', nichtFuer: 'Säuglinge und Kleinkinder (dafür pädiatrische GCS)',
    rechte: 'Urheber: Graham Teasdale und Bryan Jennett', rechteStatus: 'nicht-geprueft',
    grenzen: 'Die Summe verdeckt, welcher Teil fehlt. Augen, Sprache und Motorik einzeln dokumentieren; Pupillen, Vitalzeichen und Verlauf gehören in die Beurteilung.',
  },
  tinetti: {
    fassung: 'Mobilitätstest nach Tinetti (POMA), gekürzte Lehrfassung', original: { titel: 'Tinetti: Performance-oriented assessment of mobility problems in elderly patients', stand: '1986' },
    zielgruppe: 'Ältere, gehfähige Menschen', nichtFuer: 'Menschen, die nicht stehen oder gehen können',
    rechte: 'Urheberin: Mary Tinetti', rechteStatus: 'nicht-geprueft',
    grenzen: 'Der Test zeigt Gleichgewicht und Gang im Moment. Sturzangst, Medikamente, Umgebung und frühere Stürze gehören in die pflegerische Beurteilung.',
  },
  tug: {
    fassung: 'Timed Up and Go', original: { titel: 'Podsiadlo, Richardson: The timed Up & Go', stand: '1991' },
    zielgruppe: 'Ältere, gehfähige Menschen', nichtFuer: 'Menschen, die nicht sicher aufstehen oder gehen können',
    rechte: 'Urheberinnen: Diane Podsiadlo und Sandra Richardson', rechteStatus: 'nicht-geprueft',
    grenzen: 'Die Zeit allein sagt nichts über die Ursache. Wie die Person geht, was sie unsicher macht und was sie will, klärt die pflegerische Beurteilung.',
  },
};

export const RECHTE_TEXT: Record<RechteStatus, string> = { 'nicht-geprueft': 'Rechte nicht geprüft', geklaert: 'Rechte geklärt' };

/** Wie eine Fallvignette bewertet wird: nur der Score-Teil, nie die freie pflegerische Beurteilung. */
export const BEWERTUNG_TEXT = 'Bewertet wird je Bereich ein Punkt, die Einstufung ein Punkt und bei Schmerzfällen die Wahl des Instruments ein Punkt. Deine pflegerische Beurteilung wird nicht automatisch bewertet; vergleiche sie mit der Musterbeurteilung.';
