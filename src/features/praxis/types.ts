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
};
export type Event = { id: number; at: number; kind: 'action' | 'result' | 'warning' | 'note' | 'state' | 'medication'; title: string; detail: string };
export type Pending = { id: string; due: number; title: string; result: string; effect?: Partial<Vitals>; flag?: string; medicationId?: string; sample?: Vitals; requestedBy?: number };
export type Session = {
  version: 1; id: string; scenario: Scenario; level: 1 | 2 | 3; time: number; phase: 'active' | 'finished';
  vitals: Vitals; measured: Partial<Vitals>; measuredAt: number | null; monitoring: boolean;
  flags: Record<string, number>; events: Event[]; pending: Pending[]; done: string[];
  deterioration: number; critical: boolean; snapshotRemainder: number;
  seed: number; rng: number; commands: { id: string; command: Command }[];
};
export type Command = { type: 'action'; id: string } | { type: 'advance'; seconds: number }
  | { type: 'note'; text: string } | { type: 'sbar'; fields: string[] }
  | { type: 'medication'; id: string; dose: number; volume: number; route: string; duration: number; equipment: string; checks: boolean[] }
  | { type: 'finish' };
