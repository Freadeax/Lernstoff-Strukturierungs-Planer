// Schichtmodus: mehrere Patientinnen und Patienten auf einer gemeinsamen Uhr.
// Jeder Patient bleibt eine eigene, deterministische Session der Engine; die Schicht hält sie
// zeitgleich. Wer gerade nicht versorgt wird, verschlechtert sich weiter. Der Weg zwischen
// den Zimmern kostet Zeit. Reine Logik ohne React, Netzwerk oder Speicher.
import { clinicalDebrief, dispatch, news2Of, start } from './engine';
import { pruefeSession } from './storage';
import type { Command, Scenario, Session } from './types';

/** Wegezeit beim Wechsel ins andere Zimmer (Sekunden). */
export const WEGEZEIT = 45;

export type SchichtVorlage = { id: string; title: string; setting: string; text: string; faelle: string[] };
export const SCHICHTEN: SchichtVorlage[] = [
  { id: 'frueh', title: 'Frühdienst auf der Allgemeinstation', setting: 'Krankenhaus · Normalstation', text: 'Drei frisch übergebene Patienten, zwei Hände. Wer braucht dich zuerst?', faelle: ['sepsis', 'nachblutung', 'lungenembolie'] },
  { id: 'nacht', title: 'Nachtdienst allein auf Station', setting: 'Krankenhaus · Normalstation', text: 'Atemnot, ein verwirrter Patient und eine Infusion, die gerade läuft. Hilfe ist nur per Telefon da.', faelle: ['nachtwache', 'delir', 'anaphylaxie'] },
  { id: 'heim', title: 'Spätdienst im Wohnbereich', setting: 'Stationäre Langzeitpflege', text: 'Drei Bewohner verändern sich gleichzeitig. Der Hausarzt ist nur telefonisch erreichbar.', faelle: ['pflegeheim', 'schlaganfall', 'demenz'] },
  { id: 'kinder', title: 'Kinderstation am Nachmittag', setting: 'Pädiatrie', text: 'Zwei Kinder, zwei Mütter, beide brauchen dich jetzt.', faelle: ['kind', 'asthma'] },
];

export type Schicht = {
  version: 1; id: string; vorlage: string; title: string; level: 1 | 2 | 3;
  time: number; active: number; phase: 'active' | 'finished'; switches: number;
  sessions: Session[];
  /** Zeitpunkt des ersten Kontakts je Patient (erste Handlung), sonst null. */
  first: (number | null)[];
  /** Wie viele Verlaufseinträge je Patient schon gesehen wurden. */
  seen: number[];
};

export function beginneSchicht(vorlage: SchichtVorlage, scenarios: Scenario[], level: 1 | 2 | 3 = 1, seed = 2026): Schicht {
  const faelle = vorlage.faelle.map(id => scenarios.find(s => s.id === id)).filter((s): s is Scenario => !!s);
  if (faelle.length < 2) throw new Error('Für diese Schicht fehlen Fälle.');
  const sessions = faelle.map((s, i) => start(s, level, seed + i));
  return { version: 1, id: crypto.randomUUID(), vorlage: vorlage.id, title: vorlage.title, level, time: 0, active: 0, phase: 'active', switches: 0, sessions, first: sessions.map(() => null), seen: sessions.map(s => s.events.length) };
}

/** Alle Patienten auf die gemeinsame Uhr bringen. Ein offener Entscheidungsmoment hält nur diesen Patienten an; nach der Wahl holt er auf. */
function sync(x: Schicht) {
  x.sessions = x.sessions.map(s => s.phase === 'active' && s.time < x.time ? dispatch(s, { type: 'advance', seconds: x.time - s.time }) : s);
  x.seen[x.active] = x.sessions[x.active].events.length;
}
const copy = (x: Schicht): Schicht => ({ ...x, sessions: [...x.sessions], first: [...x.first], seen: [...x.seen] });

/** Ins andere Zimmer gehen: kostet Wegezeit, alle anderen laufen weiter. */
export function wechsle(x: Schicht, index: number): Schicht {
  if (x.phase !== 'active' || index === x.active || !x.sessions[index]) return x;
  const y = copy(x); y.active = index; y.switches++; y.time += WEGEZEIT; sync(y); return y;
}

/** Simulationszeit für alle Patienten vergehen lassen. */
export function warte(x: Schicht, seconds: number): Schicht {
  if (x.phase !== 'active' || !Number.isFinite(seconds) || seconds <= 0) return x;
  const y = copy(x); y.time += Math.floor(seconds); sync(y); return y;
}

/** Befehl beim aktuellen Patienten. Die Zeit, die er kostet, vergeht für alle. */
export function handle(x: Schicht, command: Command): Schicht {
  if (x.phase !== 'active' || command.type === 'finish') return x;
  if (command.type === 'advance') return warte(x, command.seconds);
  const before = x.sessions[x.active];
  const next = dispatch(before, command);
  if (next === before) return x;
  const y = copy(x); y.sessions[y.active] = next;
  y.first[y.active] ??= y.time;
  y.time = Math.max(y.time, next.time); sync(y); return y;
}

export function beendeSchicht(x: Schicht): Schicht {
  if (x.phase !== 'active') return x;
  const y = copy(x); y.sessions = y.sessions.map(s => dispatch(s, { type: 'finish' })); y.phase = 'finished'; return y;
}

/** Neue Verlaufsereignisse (Komplikation, Warnung, Entscheidung) bei einem Patienten, den du gerade nicht siehst. */
export function neuBei(x: Schicht, index: number) {
  const s = x.sessions[index];
  return { ereignisse: s.events.slice(x.seen[index]).filter(e => e.kind === 'story' || e.kind === 'warning').length, entscheidung: !!s.open?.length };
}

export const startNews2 = (s: Scenario) => news2Of({ vitals: s.initial, avpu: s.initialAvpu ?? 'A', oxygen: s.initialOxygen ?? false }).punkte;

/** Schichtauswertung: Priorisierung, Eskalation, Übergabe je Patient. */
export function schichtAuswertung(x: Schicht) {
  const rows = x.sessions.map((s, i) => ({ i, title: s.scenario.title, patient: s.scenario.patient, startNews2: startNews2(s.scenario), first: x.first[i], klinik: clinicalDebrief(s), sbar: s.flags.sbar !== undefined, documented: s.flags.documented !== undefined }));
  const max = Math.max(...rows.map(r => r.startNews2));
  const kritisch = rows.filter(r => r.startNews2 === max);
  const reihenfolge = rows.filter(r => r.first !== null).sort((a, b) => a.first! - b.first!);
  return {
    rows, kritisch, reihenfolge,
    priorisiert: !!reihenfolge[0] && kritisch.some(r => r.i === reihenfolge[0].i),
    unbesucht: rows.filter(r => r.first === null),
    uebergaben: rows.filter(r => r.sbar).length,
    stabil: rows.filter(r => !r.klinik.final.unstable).length,
    switches: x.switches, dauer: x.time,
  };
}

export const SCHICHT_KEY = 'lernstoff.praxis.schicht';
export function leseSchicht(): Schicht | null {
  try {
    const raw = localStorage.getItem(SCHICHT_KEY); if (!raw) return null;
    const x = JSON.parse(raw) as Schicht;
    if (!x || x.version !== 1 || typeof x.id !== 'string' || typeof x.title !== 'string' || typeof x.vorlage !== 'string' || ![1, 2, 3].includes(x.level) || !Number.isFinite(x.time) || !['active', 'finished'].includes(x.phase) || !Number.isInteger(x.switches) || !Array.isArray(x.sessions) || x.sessions.length < 2 || x.sessions.length > 4 || !Number.isInteger(x.active) || x.active < 0 || x.active >= x.sessions.length) return null;
    if (!Array.isArray(x.first) || x.first.length !== x.sessions.length || !x.first.every(f => f === null || Number.isFinite(f)) || !Array.isArray(x.seen) || x.seen.length !== x.sessions.length || !x.seen.every(Number.isInteger)) return null;
    x.sessions = x.sessions.map(pruefeSession);
    return x;
  } catch { return null; }
}
export function speichereSchicht(x: Schicht | null) {
  try { if (x) localStorage.setItem(SCHICHT_KEY, JSON.stringify(x)); else localStorage.removeItem(SCHICHT_KEY); return ''; }
  catch { return 'Die Schicht konnte auf diesem Gerät nicht gespeichert werden.'; }
}
