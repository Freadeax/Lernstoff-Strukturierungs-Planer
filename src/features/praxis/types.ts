import type { Avpu } from './news2';
export type { Avpu };

export const SETTINGS = {
  ambulant: 'Ambulante Pflege', heim: 'Stationäre Langzeitpflege', station: 'Krankenhaus · Normalstation',
  zna: 'Notaufnahme', its: 'Intensivstation', paediatrie: 'Pädiatrie', psychiatrie: 'Psychiatrie',
  reha: 'Rehabilitation', palliativ: 'Palliativversorgung',
} as const;
export type Setting = keyof typeof SETTINGS;
/** Alter lesbar: Säuglinge (Alter unter 1, in Jahren als Bruch) in Monaten, sonst in Jahren. */
export function alterText(age: number): string {
  if (age >= 1) return `${Math.floor(age)} Jahre`;
  const m = Math.max(0, Math.round(age * 12));
  return m < 1 ? 'Neugeborenes' : `${m} ${m === 1 ? 'Monat' : 'Monate'}`;
}
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
  /** Folge bleibt bis zu einer dieser Handlungen offen (z. B. Sturzversorgung) und gilt sonst im Debriefing als ungelöst. */
  resolvedBy?: string[];
  /** Was im Debriefing steht, wenn das Ereignis verhindert wurde. */
  prevented?: string;
  /** Entscheidungsmoment: Die Uhr hält an, bis eine Option gewählt ist. Optionen setzen Flags und verzweigen so den Verlauf. */
  choices?: Choice[];
};
/** Eine Option in einem Entscheidungsmoment. */
export type Choice = {
  id: string; label: string;
  /** Was sofort passiert (im Verlauf sichtbar). */
  result: string;
  /** Begründung fürs Debriefing. */
  why: string;
  /** Fachlich beste Option (im Debriefing markiert). */
  best?: boolean;
  flag?: string; effect?: Partial<Vitals>; avpu?: Avpu; oxygen?: boolean; harm?: string;
  /** Zeitbedarf in Sekunden (Standard 30). */
  seconds?: number;
};
export type Medication = {
  id: string; name: string; atc: string; dose: number; unit: string; concentration: number; route: string;
  duration: number; onset: number; effect: Partial<Vitals>; result: string; equipment: string;
  targets: Partial<Vitals>;
};
/** Was ein Kriterium tatsächlich prüft: nur ob etwas vorliegt, auch den Zeitpunkt oder auch den Inhalt. */
export const BEWERTET = {
  vorliegen: 'Geprüft: nur Vorliegen',
  zeitpunkt: 'Geprüft: Vorliegen und Zeitpunkt',
  inhalt: 'Geprüft: auch Inhalt',
} as const;
export type Bewertet = keyof typeof BEWERTET;
export type Criterion = {
  flag: string; label: string; why: string; before?: number; after?: string; source: 'abcde' | 'sbar' | 'scenario' | 'drug';
  /** Alternative richtige Wege: Das Kriterium ist auch erfüllt, wenn eines dieser Flags gesetzt ist. */
  anyOf?: string[];
  /** Ohne Angabe: Zeitbedingung → zeitpunkt, sonst vorliegen. */
  bewertet?: Bewertet;
};
/** Art einer Kette Beobachtung → Entscheidung. */
export const KETTEN = { entscheidung: 'Entscheidung', reevaluation: 'Erneute Beurteilung', eskalation: 'Eskalation' } as const;
export type KettenArt = keyof typeof KETTEN;
/**
 * Kette Beobachtung → Entscheidung (Kernfälle). Beobachtet ist sie, sobald eine der Kennungen aus
 * `seenBy` in der Spur steht (Handlung, Flag, `ereignis:<id>` oder `wahl:<ereignis>:<option>`).
 * Entschieden ist sie, wenn ein Weg aus `ways` vollständig vorliegt (alle Kennungen eines Wegs).
 */
export type Chain = {
  id: string; art: KettenArt;
  observation: string; decision: string; why: string;
  seenBy: string[];
  ways: { label: string; ids: string[] }[];
  /** Zeitfenster in Sekunden ab der Beobachtung. */
  within?: number;
  /** true: Entscheidung zählt nur nach der Beobachtung (z. B. Reevaluation nach Maßnahme). */
  after?: boolean;
};
/** Stichwortprüfung für ein SBAR-Feld (0 = S … 3 = R). Keine Sinnprüfung. */
export type SbarCheck = { field: 0 | 1 | 2 | 3; label: string; any: string[] };
/** Kernfall: vollständig ausgearbeitet, wartet auf fachliche Freigabe durch einen Menschen. */
export type Kernfall = { stand: string; freigabe: 'ausstehend' | 'erteilt'; pruefer?: string; pruefpunkte: string[] };
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
  /** Kernfälle: Ketten Beobachtung → Entscheidung, SBAR-Stichworte, Eskalationswege, Freigabestatus. */
  chains?: Chain[]; sbarCheck?: SbarCheck[]; escalation?: string[]; kern?: Kernfall;
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
  /** Offene Entscheidungsmomente (Ereignis-IDs) und getroffene Entscheidungen. */
  open?: string[];
  decisions?: { at: number; event: string; choice: string }[];
  /** Spur aller Handlungen, Flags, Ereignisse und Wahlen mit Zeitpunkt (für Ketten Beobachtung → Entscheidung). */
  trail?: { at: number; id: string }[];
};
export type Command = { type: 'action'; id: string } | { type: 'advance'; seconds: number }
  | { type: 'note'; text: string } | { type: 'sbar'; fields: string[] }
  | { type: 'medication'; id: string; dose: number; volume: number; route: string; duration: number; equipment: string; checks: boolean[] }
  | { type: 'choose'; event: string; choice: string }
  | { type: 'finish' };
