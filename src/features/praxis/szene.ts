// Animierte Zimmerszene des Praxissimulators: reine Ableitung aus dem Spielstand.
// Die Szene zeigt, was man im Zimmer sieht (Atmung, Hautfarbe, Bewusstsein, Lage,
// Sauerstoff, wer im Raum ist), ohne Zahlen zu verraten. Zahlen gibt es weiterhin
// nur über Messen bzw. Monitoring. Keine Seiteneffekte, damit die Szene testbar bleibt.

import { RESOURCES } from './catalog';
import { consciousness, news2Of } from './engine';
import { elementVon, type RaumElement } from './raum';
import type { Avpu } from './news2';
import type { Event, Session, StoryKind } from './types';

export type Hautton = 'rosig' | 'blass' | 'grau' | 'zyanotisch' | 'geroetet';
export type Lage = 'normal' | 'erhoeht' | 'flach' | 'sitzend';
export type FigurArt = 'arzt' | 'kollege' | 'angehoerige' | 'rettung';
export type Figur = { art: FigurArt; label: string; seit: number; grund: string };
export type BlasenQuelle = 'patient' | 'telefon' | 'tuer' | 'pflege' | 'monitor' | 'wagen';
export type Sprechblase = { id: number; quelle: BlasenQuelle; titel: string; text: string; ton: 'info' | 'warn' | 'story' | 'rede' };
export type Alarm = 'kein' | 'gelb' | 'rot';

export type SzenenZustand = {
  zuhause: boolean; monitorVorhanden: boolean; monitoring: boolean; nacht: boolean;
  /** Dauer eines Atemzugs bzw. Herzschlags in Sekunden (Echtzeit, unabhängig vom Zeitraffer). */
  atemSek: number; herzSek: number;
  haut: Hautton; schwitzen: boolean;
  avpu: Avpu; augenZu: boolean; verwirrt: boolean;
  /** 0 = keine, 1 = mäßig, 2 = stark */
  schmerz: 0 | 1 | 2; atemnot: 0 | 1 | 2;
  sauerstoff: boolean; lage: Lage; infusion: boolean; zugang: boolean;
  alarm: Alarm; figuren: Figur[]; telefonKlingelt: boolean; komplikation: boolean;
  /** Wo die Pflegekraft gerade arbeitet (letzte Handlung). */
  pflegeBei: RaumElement | 'tuer';
  /** Zuletzt ausgeführte Handlung (für die kurze Arbeitsanimation). */
  handlung?: { id: number; element: RaumElement; art: HandlungsArt };
  blase?: Sprechblase;
  /** Uhrzeit an der Wanduhr in Sekunden seit Mitternacht. */
  wanduhr: number;
};
export type HandlungsArt = 'messen' | 'hoeren' | 'reden' | 'tasten' | 'telefonieren' | 'material' | 'schreiben';

/** Wie lange (Simulationssekunden) eine Person nach einem Ereignis im Zimmer bleibt. */
export const VERWEILDAUER = 6 * 60;
const FLACH = new Set(['flat', 'lie_flat', 'legs', 'feed_flat']);
const ERHOEHT = /oberkörper|aufrecht|herzbett|hochlagern|hoch lagern|sitzend lagern|kutschersitz/i;
const FIGUR_ZU_STORY: Partial<Record<StoryKind, FigurArt>> = { angehoerige: 'angehoerige', visite: 'arzt', team: 'kollege' };
const FIGUR_LABEL: Record<FigurArt, string> = { arzt: 'Ärztin/Arzt', kollege: 'Pflegefachkraft aus dem Team', angehoerige: 'Angehörige/r', rettung: 'Rettungsdienst' };

export const atemDauer = (af: number) => 60 / Math.min(45, Math.max(6, af));
export const herzDauer = (puls: number) => 60 / Math.min(180, Math.max(30, puls));

export function hautton(v: Session['vitals']): Hautton {
  if (v.spo2 < 88) return 'zyanotisch';
  if (v.sys < 90) return 'grau';
  if (v.spo2 < 92 || v.sys < 100 || v.glucose < 60) return 'blass';
  if (v.temp >= 38.5) return 'geroetet';
  return 'rosig';
}

/** Lage im Bett: die zuletzt ausgeführte Lagerungs-Handlung zählt. */
export function lage(s: Session, zuhause: boolean): Lage {
  let l: Lage = zuhause ? 'sitzend' : 'normal';
  const trail = [...(s.trail ?? [])].sort((a, b) => a.at - b.at);
  for (const t of trail) {
    const a = s.scenario.actions.find(x => x.id === t.id);
    if (!a) continue;
    if (FLACH.has(a.id) || /flach/i.test(a.label)) l = 'flach';
    else if (ERHOEHT.test(a.label)) l = zuhause ? 'sitzend' : 'erhoeht';
  }
  return l;
}

function handlungsArt(id: string, kategorie: string): HandlungsArt {
  if (['vitals', 'reassess', 'monitor', 'orthostase', 'ekg', 'bga', 'crt', 'weight', 'shockindex', 'drain'].includes(id)) return 'messen';
  if (id === 'listen') return 'hoeren';
  if (['palpate', 'percuss', 'leg_check', 'dekubitus', 'bladder'].includes(id)) return 'tasten';
  if (kategorie === 'gespraech') return 'reden';
  if (kategorie === 'kommunikation' || kategorie === 'diagnostik') return 'telefonieren';
  if (kategorie === 'pflege' || kategorie === 'geraete') return 'material';
  return 'messen';
}

const kurz = (text: string, max = 190) => text.length <= max ? text : `${text.slice(0, max - 1).replace(/\s+\S*$/, '')} …`;

/** Sprechblase zum jüngsten Ereignis: wer spricht oder wo es passiert. */
export function sprechblase(s: Session, e: Event | undefined): Sprechblase | undefined {
  if (!e || e.kind === 'state') return undefined;
  const base = { id: e.id, titel: e.title, text: kurz(e.detail || e.title) };
  if (e.kind === 'warning') return { ...base, quelle: 'pflege', ton: 'warn' };
  if (e.kind === 'result') return { ...base, quelle: 'telefon', ton: 'info' };
  if (e.kind === 'medication') return { ...base, quelle: 'wagen', ton: 'info' };
  if (e.kind === 'note') return { ...base, text: kurz(e.detail, 120), quelle: 'pflege', ton: 'info' };
  if (e.kind === 'story') {
    const ev = s.scenario.storyline?.find(x => e.title.endsWith(`: ${x.title}`));
    const quelle: BlasenQuelle = ev?.kind === 'telefon' ? 'telefon' : ev?.kind === 'patient' || ev?.kind === 'komplikation' ? 'patient' : 'tuer';
    return { ...base, quelle, ton: 'story' };
  }
  const a = s.scenario.actions.find(x => x.label === e.title);
  if (!a) return { ...base, quelle: 'pflege', ton: 'info' };
  const el = elementVon(a);
  if (a.category === 'gespraech') return { ...base, quelle: 'patient', ton: 'rede' };
  return { ...base, quelle: el === 'patient' ? 'pflege' : el, ton: 'info' };
}

export function szene(s: Session): SzenenZustand {
  const r = RESOURCES[s.scenario.setting];
  const zuhause = r.longVisits;
  const v = s.vitals;
  const avpu = consciousness(s);
  const text = `${s.scenario.title} ${s.scenario.environment} ${s.scenario.situation}`;
  const nacht = /nacht|nachts|nachtdienst|2 uhr|3 uhr|4 uhr/i.test(text);
  const trail = s.trail ?? [];
  const seit = (id: string) => trail.filter(t => t.id === id).map(t => t.at).sort((a, b) => b - a)[0];

  const figuren: Figur[] = [];
  const offen = new Set(s.open ?? []);
  for (const e of s.scenario.storyline ?? []) {
    const art = FIGUR_ZU_STORY[e.kind];
    const at = seit(`ereignis:${e.id}`);
    if (!art || at === undefined) continue;
    if (offen.has(e.id) || s.time - at <= VERWEILDAUER) figuren.push({ art, label: FIGUR_LABEL[art], seit: at, grund: e.title });
  }
  if (!zuhause && s.flags.help !== undefined) {
    const da = s.flags.help + r.helpMinutes * 60;
    if (s.time >= da) figuren.push({ art: 'kollege', label: FIGUR_LABEL.kollege, seit: da, grund: 'Unterstützung angefordert' });
  }
  if (s.flags.orders !== undefined && s.time - s.flags.orders <= VERWEILDAUER && !zuhause) figuren.push({ art: 'arzt', label: FIGUR_LABEL.arzt, seit: s.flags.orders, grund: 'Ärztliche Beurteilung' });
  if (s.flags.ems !== undefined && s.time >= s.flags.ems + 8 * 60) figuren.push({ art: 'rettung', label: FIGUR_LABEL.rettung, seit: s.flags.ems + 8 * 60, grund: 'Notruf' });
  // Jede Art nur einmal, die jüngste zählt.
  const eindeutig = [...new Map(figuren.sort((a, b) => a.seit - b.seit).map(f => [f.art, f])).values()].slice(-3);

  const telefonEvent = (s.scenario.storyline ?? []).some(e => e.kind === 'telefon' && (offen.has(e.id) || (seit(`ereignis:${e.id}`) !== undefined && s.time - seit(`ereignis:${e.id}`)! <= 60)));
  const ergebnisNeu = s.events.some(e => e.kind === 'result' && s.time - e.at <= 30);
  const komplikation = (s.scenario.storyline ?? []).some(e => e.kind === 'komplikation' && seit(`ereignis:${e.id}`) !== undefined && s.time - seit(`ereignis:${e.id}`)! <= 90);

  const letzteAktion = [...s.events].reverse().find(e => e.kind === 'action');
  const aktion = letzteAktion ? s.scenario.actions.find(a => a.label === letzteAktion.title) : undefined;
  const handlung = aktion && letzteAktion ? { id: letzteAktion.id, element: elementVon(aktion), art: handlungsArt(aktion.id, aktion.category) } : undefined;
  const letztes = [...s.events].reverse().find(e => e.kind !== 'state');

  const punkt = { vitals: v, avpu, oxygen: s.oxygen ?? false };
  const risiko = news2Of(punkt).risiko;
  const alarm: Alarm = !s.monitoring ? 'kein' : risiko === 'hoch' || risiko === 'mittel' ? 'rot' : risiko === 'niedrig-mittel' ? 'gelb' : 'kein';

  return {
    zuhause, monitorVorhanden: r.monitor, monitoring: s.monitoring, nacht,
    atemSek: atemDauer(v.resp), herzSek: herzDauer(v.pulse),
    haut: hautton(v), schwitzen: v.temp >= 38.5 || v.sys < 90 || v.glucose < 60,
    avpu, augenZu: avpu === 'V' || avpu === 'P' || avpu === 'U', verwirrt: avpu === 'C',
    schmerz: v.pain >= 7 ? 2 : v.pain >= 4 ? 1 : 0,
    atemnot: v.resp >= 25 || v.spo2 < 90 ? 2 : v.resp >= 21 || v.spo2 < 94 ? 1 : 0,
    sauerstoff: s.oxygen ?? false, lage: lage(s, zuhause),
    infusion: s.done.some(d => d.startsWith('med:')) && !s.done.includes('stop'),
    zugang: s.done.some(d => d.startsWith('med:') || d === 'iv_material' || d === 'zugang'),
    alarm, figuren: eindeutig, telefonKlingelt: telefonEvent || ergebnisNeu, komplikation,
    pflegeBei: handlung?.element ?? 'tuer', handlung,
    blase: sprechblase(s, letztes),
    wanduhr: ((nacht ? 2 * 3600 + 40 * 60 : 8 * 3600 + 15 * 60) + s.time) % 86400,
  };
}
