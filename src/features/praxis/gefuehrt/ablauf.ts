// Ablauf des geführten Modus (rein, ohne React): wählt Optionen, schickt sie an die Engine,
// lässt Zeit zwischen Schritten vergehen und reicht Unterbrechungen (Entscheidungsmomente) durch.

import { CHECKS, dispatch, start } from '../engine';
import type { Session, StoryEvent, Vital, Vitals } from '../types';
import { SCENARIOS } from '../catalog';
import type { GOption, GSchritt, Leitfall } from './typen';

export interface GStand {
  version: 1;
  fall: string;
  session: Session;
  /** Index des aktuellen Schritts; gleich Anzahl der Schritte = fertig. */
  schritt: number;
  /** Gewählte Optionen je Schritt-ID in Reihenfolge. */
  picks: Record<string, string[]>;
  /** Zuletzt sichtbare Werte und wann sie erhoben wurden. */
  werte: Partial<Vitals>;
  werteZeit: number | null;
  /** Bis zu welcher Simulationszeit der Vorlauf des aktuellen Schritts läuft (wenn eine Unterbrechung ihn angehalten hat). */
  bis?: number;
}

export const szenarioVon = (l: Leitfall) => {
  const s = SCENARIOS.find((x) => x.id === l.fall);
  if (!s) throw new Error(`Leitfall ohne Praxisfall: ${l.fall}`);
  return s;
};

const MAX_WARTEN = 20 * 60;

export function beginne(l: Leitfall): GStand {
  let session = start(szenarioVon(l), 1);
  for (const id of l.start ?? []) session = dispatch(session, { type: 'action', id });
  return bereite(l, { version: 1, fall: l.fall, session, schritt: 0, picks: {}, werte: {}, werteZeit: null });
}

export const aktuellerSchritt = (l: Leitfall, st: GStand): GSchritt | undefined => l.schritte[st.schritt];
export const fertig = (l: Leitfall, st: GStand) => st.schritt >= l.schritte.length;

/** Offener Entscheidungsmoment der Engine (Anruf, Kollegin, Komplikation mit Wahl). */
export function unterbrechung(st: GStand): StoryEvent | undefined {
  const id = st.session.open?.[0];
  return id ? st.session.scenario.storyline?.find((e) => e.id === id) : undefined;
}

/** Darf diese Option jetzt noch gewählt werden? */
export function waehlbar(l: Leitfall, st: GStand, optionId: string): boolean {
  const schritt = aktuellerSchritt(l, st);
  if (!schritt || unterbrechung(st) || st.session.phase !== 'active') return false;
  const picks = st.picks[schritt.id];
  if (!picks || picks.includes(optionId) || picks.length >= (schritt.mehrfach ?? 1)) return false;
  // Nach einer gefährlichen Wahl geht es mit dem nächsten Schritt weiter.
  return !picks.some((p) => schritt.optionen.find((o) => o.id === p)?.wertung === 'gefaehrlich');
}

const gerundet = (v: Vitals, keys: Vital[]): Partial<Vitals> =>
  Object.fromEntries(keys.map((k) => [k, k === 'temp' ? Math.round(v[k] * 10) / 10 : Math.round(v[k])]));

function fuehreAus(s: Session, o: GOption): Session {
  const vorher = s.time;
  let n = s;
  for (const id of o.aktionen ?? []) {
    const a = n.scenario.actions.find((x) => x.id === id);
    if (!a || (a.requires && n.flags[a.requires] === undefined) || (n.done.includes(a.id) && !a.repeatable)) continue;
    n = dispatch(n, { type: 'action', id });
  }
  if (o.sbar) n = dispatch(n, { type: 'sbar', fields: [...o.sbar] });
  if (o.notiz) n = dispatch(n, { type: 'note', text: o.notiz });
  if (o.medikation) {
    const m = n.scenario.medications.find((x) => x.id === o.medikation);
    if (m) n = dispatch(n, { type: 'medication', id: m.id, dose: m.dose, volume: Math.round((m.dose / m.concentration) * 100) / 100, route: m.route, duration: m.duration, equipment: m.equipment, checks: CHECKS.map(() => true) });
  }
  if (o.folge) n = dispatch(n, { type: 'folge', id: `gefuehrt:${o.id}`, label: o.text, text: o.folge.text, effect: o.folge.effekt, seconds: o.sekunden ?? 30 });
  else if (n.time === vorher && !n.open?.length) n = dispatch(n, { type: 'advance', seconds: o.sekunden ?? 30 });
  return n;
}

export function waehle(l: Leitfall, st: GStand, optionId: string): GStand {
  if (!waehlbar(l, st, optionId)) return st;
  const schritt = aktuellerSchritt(l, st)!;
  const o = schritt.optionen.find((x) => x.id === optionId);
  if (!o) return st;
  const session = fuehreAus(st.session, o);
  const neu: GStand = { ...st, session, picks: { ...st.picks, [schritt.id]: [...(st.picks[schritt.id] ?? []), o.id] } };
  if (o.zeigt?.length) { neu.werte = { ...st.werte, ...gerundet(session.vitals, o.zeigt) }; neu.werteZeit = session.time; }
  return neu;
}

/** Lässt Zeit vergehen, bis der Schritt beginnen kann (Vorlauf, Warten auf Anordnung). Hält bei Unterbrechungen an. */
export function bereite(l: Leitfall, st: GStand): GStand {
  const schritt = aktuellerSchritt(l, st);
  if (!schritt || unterbrechung(st) || st.session.phase !== 'active') return st;
  if (st.picks[schritt.id] !== undefined) return st;
  let s = st.session;
  const bis = st.bis ?? s.time + (schritt.vorlauf ?? 0);
  if (bis > s.time) s = dispatch(s, { type: 'advance', seconds: bis - s.time });
  if (schritt.wartenAuf && !s.open?.length) {
    const grenze = s.time + MAX_WARTEN;
    while (s.flags[schritt.wartenAuf] === undefined && !s.open?.length && s.time < grenze && s.phase === 'active') s = dispatch(s, { type: 'advance', seconds: 30 });
  }
  if (s.open?.length) return { ...st, session: s, bis };
  const { bis: _fertig, ...rest } = st;
  return { ...rest, session: s, picks: { ...st.picks, [schritt.id]: [] } };
}

export function weiter(l: Leitfall, st: GStand): GStand {
  const schritt = aktuellerSchritt(l, st);
  if (!schritt || !(st.picks[schritt.id]?.length) || unterbrechung(st)) return st;
  const neu = { ...st, schritt: st.schritt + 1 };
  if (fertig(l, neu)) return { ...neu, session: dispatch(neu.session, { type: 'finish' }) };
  return bereite(l, neu);
}

export function entscheide(l: Leitfall, st: GStand, choice: string): GStand {
  const e = unterbrechung(st);
  if (!e) return st;
  const neu = { ...st, session: dispatch(st.session, { type: 'choose', event: e.id, choice }) };
  return bereite(l, neu);
}

/** Läuft gerade ein Vorlauf, der durch eine Unterbrechung angehalten wurde? */
export const wartet = (l: Leitfall, st: GStand) => { const s = aktuellerSchritt(l, st); return !!s && st.picks[s.id] === undefined; };
