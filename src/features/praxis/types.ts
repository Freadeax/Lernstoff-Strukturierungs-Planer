import type { Avpu } from './news2';
export type { Avpu };

export const SETTINGS = {
  ambulant: 'Ambulante Pflege', heim: 'Stationäre Langzeitpflege', station: 'Krankenhaus · Normalstation',
  zna: 'Notaufnahme', its: 'Intensivstation', paediatrie: 'Pädiatrie', psychiatrie: 'Psychiatrie',
  reha: 'Rehabilitation', palliativ: 'Palliativversorgung',
} as const;
export type Setting = keyof typeof SETTINGS;
export type Vitals = { pulse: number; sys: number; dia: number; spo2: number; resp: number; temp: number; glucose: number; pain: number };
export type Vital = keyof Vitals;
export type Category = 'gespraech' | 'untersuchung' | 'pflege' | 'diagnostik' | 'kommunikation' | 'geraete';
export type Action = {
  id: string; label: string; category: Category; seconds: number; result: string;
  effect?: Partial<Vitals>; flag?: string; requires?: string; delay?: number; repeatable?: boolean;
  loinc?: string;
  /** Fehlhandlung: wird ausgeführt, löst aber eine dokumentierte Folge aus. */
  harm?: string;
  /** Neue Bewusstseinslage (ACVPU) nach der Handlung. */
  avpu?: Avpu;
  /** true: Sauerstoffgabe beginnt (zählt im NEWS2), false: endet. */
  oxygen?: boolean;
};
/** Ereignis im Fallverlauf: Komplikation, Angehörige, Visite, Telefon … */
export const STORY_KINDS = { komplikation: 'Komplikation', angehoerige: 'Angehörige', visite: 'Visite', telefon: 'Telefon', team: 'Team', patient: 'Patient/in' } as const;
export type StoryKind = keyof typeof STORY_KINDS;
export type StoryEvent = {
  id: string; at: number; kind: StoryKind; title: string; detail: string;
  /** Ist eines dieser Flags vor dem Zeitpunkt gesetzt, bleibt das Ereignis aus (Komplikation verhindert). */
  unless?: string[];
  /** Ereignis tritt nur ein, wenn dieses Flag gesetzt ist (z. B. Folge einer Fehlhandlung). */
  when?: string;
  effect?: Partial<Vitals>; avpu?: Avpu; flag?: string;
  /** Zusätzliche Verschlechterung pro Minute, bis eines der Flags aus stoppedBy gesetzt wird. */
  drift?: Partial<Vitals>; stoppedBy?: string[];
  /** Was im Debriefing steht, wenn das Ereignis verhindert wurde. */
  prevented?: string;
};
export type Medication = {
  id: string; name: string; atc: string; dose: number; unit: string; concentration: number; route: string;
  duration: number; onset: number; effect: Partial<Vitals>; result: string; equipment: string;
  targets: Partial<Vitals>;
};
export type Criterion = { flag: string; label: string; why: string; before?: number; after?: string; source: 'abcde' | 'sbar' | 'scenario' | 'drug' };
export type Scenario = {
  version: 1; id: string; title: string; setting: Setting; focus: string; patient: string; age: number;
  model: { id: string; version: string; accuracy: 'didactic'; review: 'unreviewed'; sources: string[] };
  distraction?: { interval: number; probability: number; text: string };
  background: string; situation: string; assessment: string; recommendation: string; environment: string;
  allergies: string[]; weight: number; renal: string; initial: Vitals; drift: Partial<Vitals>;
  stabilizers: string[]; findings: { inspect: string; palpate: string; listen: string; percuss: string };
  dialogue: { patient: string; family: string }; actions: Action[]; medications: Medication[]; criteria: Criterion[];
  /** Optional: klinischer Verlauf, Startbewusstsein und Lernimpulse fürs Debriefing. */
  storyline?: StoryEvent[]; initialAvpu?: Avpu; initialOxygen?: boolean; teaching?: string[];
  outcome?: { stable: string; unstable: string };
};
export type ChartPoint = { at: number; vitals: Vitals; avpu: Avpu; oxygen: boolean };
export type Event = { id: number; at: number; kind: 'action' | 'result' | 'warning' | 'note' | 'state' | 'medication' | 'story'; title: string; detail: string };
export type Pending = { id: string; due: number; title: string; result: string; effect?: Partial<Vitals>; flag?: string; medicationId?: string; sample?: Vitals; requestedBy?: number };
export type Session = {
  version: 1; id: string; scenario: Scenario; level: 1 | 2 | 3; time: number; phase: 'active' | 'finished';
  vitals: Vitals; measured: Partial<Vitals>; measuredAt: number | null; monitoring: boolean;
  flags: Record<string, number>; events: Event[]; pending: Pending[]; done: string[];
  deterioration: number; critical: boolean; snapshotRemainder: number;
  seed: number; rng: number; commands: { id: string; command: Command }[];
  /** Klinische Erweiterung; fehlt in älteren Spielständen. */
  avpu?: Avpu; oxygen?: boolean; chart?: ChartPoint[];
  story?: Record<string, 'fired' | 'prevented' | 'skipped'>;
  drifts?: { id: string; drift: Partial<Vitals>; stoppedBy: string[] }[];
  harms?: { at: number; id: string; text: string }[];
};
export type Command = { type: 'action'; id: string } | { type: 'advance'; seconds: number }
  | { type: 'note'; text: string } | { type: 'sbar'; fields: string[] }
  | { type: 'medication'; id: string; dose: number; volume: number; route: string; duration: number; equipment: string; checks: boolean[] }
  | { type: 'finish' };
