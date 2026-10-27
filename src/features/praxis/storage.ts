import type { Scenario, Session } from './types';
import { SETTINGS, STORY_KINDS } from './types';
import { AVPU } from './news2';

const KEYS = ['pulse', 'sys', 'dia', 'spo2', 'resp', 'temp', 'glucose', 'pain'];
const text = (v: unknown): v is string => typeof v === 'string' && v.length <= 5000;
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const number = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const positive = (v: unknown) => number(v) && v >= 0 && v <= 86400;
const strings = (v: unknown): v is string[] => Array.isArray(v) && v.length <= 100 && v.every(text);
const deltas = (v: unknown) => object(v) && Object.entries(v).every(([k, n]) => KEYS.includes(k) && number(n) && Math.abs(n) <= 500);
const avpu = (v: unknown) => (AVPU as readonly unknown[]).includes(v);
const categories = ['gespraech', 'untersuchung', 'pflege', 'diagnostik', 'kommunikation', 'geraete'];

/** JSON editor boundary: reject executable content, invalid references and unbounded values. */
export function parseScenario(json: string): Scenario {
  if (json.length > 200000) throw new Error('Szenario ist zu groß (maximal 200 kB Text).');
  const d: unknown = JSON.parse(json);
  if (!object(d) || d.version !== 1 || !text(d.id) || !/^[a-z0-9-]{1,60}$/.test(d.id) || !Object.hasOwn(SETTINGS, String(d.setting))) throw new Error('Szenarioversion, Kennung oder Einrichtung ungültig.');
  if (!object(d.model) || !text(d.model.id) || !text(d.model.version) || d.model.accuracy !== 'didactic' || d.model.review !== 'unreviewed' || !strings(d.model.sources) || !d.model.sources.every(url => /^https:\/\//.test(url))) throw new Error('Modellkennung, Genauigkeitsgrad oder Prüfstatus ungültig. Lokale Szenarien sind fachlich ungeprüft.');
  if (d.distraction !== undefined && (!object(d.distraction) || !positive(d.distraction.interval) || (d.distraction.interval as number) < 60 || !number(d.distraction.probability) || d.distraction.probability < 0 || d.distraction.probability > 1 || !text(d.distraction.text))) throw new Error('Hintergrundereignis ungültig.');
  for (const k of ['title', 'focus', 'patient', 'background', 'situation', 'assessment', 'recommendation', 'environment', 'renal']) if (!text(d[k]) || !d[k].trim()) throw new Error(`Text fehlt: ${k}`);
  if (!positive(d.age) || (d.age as number) > 120 || !positive(d.weight) || (d.weight as number) < 1 || (d.weight as number) > 400 || !strings(d.allergies) || !strings(d.stabilizers)) throw new Error('Patientenangaben ungültig.');
  if (!object(d.initial) || !KEYS.every(k => number(d.initial && (d.initial as Record<string, unknown>)[k])) || !deltas(d.drift)) throw new Error('Vitalparameter oder zeitlicher Verlauf ungültig.');
  const limits: Record<string, [number, number]> = { pulse: [30, 180], sys: [60, 220], dia: [30, 130], spo2: [70, 100], resp: [6, 45], temp: [34, 41], glucose: [30, 500], pain: [0, 10] };
  for (const [k, [min, max]] of Object.entries(limits)) if ((d.initial[k] as number) < min || (d.initial[k] as number) > max) throw new Error(`Startwert außerhalb des Modells: ${k}`);
  if (!object(d.findings) || !['inspect', 'palpate', 'listen', 'percuss'].every(k => text((d.findings as Record<string, unknown>)[k])) || !object(d.dialogue) || !['patient', 'family'].every(k => text((d.dialogue as Record<string, unknown>)[k]))) throw new Error('Untersuchungs- oder Gesprächsbefunde fehlen.');
  if (!Array.isArray(d.actions) || !d.actions.length || d.actions.length > 60 || !Array.isArray(d.medications) || d.medications.length > 20 || !Array.isArray(d.criteria) || !d.criteria.length || d.criteria.length > 40) throw new Error('Module fehlen oder überschreiten die erlaubte Größe.');
  const ids = new Set<string>();
  const flags = new Set(['documented', 'sbar', 'medication', 'medication_effect', 'medication_reviewed']);
  const identifier = (v: unknown): v is string => typeof v === 'string' && /^[a-z][a-z0-9_-]{0,59}$/.test(v) && !['constructor', 'prototype', '__proto__', 'toString', 'hasOwnProperty', 'valueOf'].includes(v);
  for (const a of d.actions) {
    if (!object(a) || !identifier(a.id) || ids.has(a.id) || !text(a.label) || !text(a.result) || !categories.includes(String(a.category)) || !positive(a.seconds) || (a.delay !== undefined && !positive(a.delay)) || (a.effect !== undefined && !deltas(a.effect)) || (a.flag !== undefined && !identifier(a.flag)) || (a.requires !== undefined && !identifier(a.requires)) || (a.repeatable !== undefined && typeof a.repeatable !== 'boolean') || (a.loinc !== undefined && !text(a.loinc))) throw new Error('Aktion ungültig oder Kennung doppelt.');
    if ((a.harm !== undefined && (!text(a.harm) || !a.harm.trim())) || (a.avpu !== undefined && !avpu(a.avpu)) || (a.oxygen !== undefined && typeof a.oxygen !== 'boolean')) throw new Error('Aktion: Folge, Bewusstsein oder Sauerstoffangabe ungültig.');
    ids.add(a.id); if (a.flag) flags.add(a.flag as string);
  }
  if (d.initialOxygen !== undefined && typeof d.initialOxygen !== 'boolean') throw new Error('Sauerstoff-Startwert ungültig.');
  if (d.initialAvpu !== undefined && !avpu(d.initialAvpu)) throw new Error('Start-Bewusstseinslage ungültig (A, C, V, P oder U).');
  if (d.teaching !== undefined && (!strings(d.teaching) || d.teaching.length > 12)) throw new Error('Lernimpulse ungültig.');
  if (d.outcome !== undefined && (!object(d.outcome) || !text(d.outcome.stable) || !text(d.outcome.unstable))) throw new Error('Fallausgang ungültig.');
  if (d.storyline !== undefined && (!Array.isArray(d.storyline) || d.storyline.length > 40)) throw new Error('Fallverlauf ungültig oder zu lang.');
  const storyIds = new Set<string>();
  for (const e of (d.storyline ?? []) as unknown[]) {
    if (!object(e) || !identifier(e.id) || storyIds.has(e.id) || !positive(e.at) || (e.at as number) < 1 || !Object.hasOwn(STORY_KINDS, String(e.kind)) || !text(e.title) || !e.title.trim() || !text(e.detail) || (e.effect !== undefined && !deltas(e.effect)) || (e.avpu !== undefined && !avpu(e.avpu)) || (e.flag !== undefined && !identifier(e.flag)) || (e.prevented !== undefined && !text(e.prevented))) throw new Error('Verlaufsereignis ungültig oder Kennung doppelt.');
    if (e.drift !== undefined && (!deltas(e.drift) || !Array.isArray(e.stoppedBy) || !e.stoppedBy.length || !e.stoppedBy.every(identifier))) throw new Error('Verlaufsereignis: anhaltende Verschlechterung braucht stoppedBy.');
    if ((e.unless !== undefined && (!Array.isArray(e.unless) || !e.unless.every(identifier))) || (e.when !== undefined && !identifier(e.when))) throw new Error('Verlaufsereignis: Bedingung ungültig.');
    storyIds.add(e.id); if (e.flag) flags.add(e.flag as string);
  }
  for (const e of (d.storyline ?? []) as Record<string, unknown>[]) if ([...((e.unless as string[]) ?? []), ...((e.stoppedBy as string[]) ?? []), ...(e.when ? [e.when as string] : [])].some(f => !flags.has(f))) throw new Error('Verlaufsereignis verweist auf unbekannte Handlung.');
  const medIds = new Set();
  for (const m of d.medications) {
    if (!object(m) || !identifier(m.id) || medIds.has(m.id) || !['name', 'atc', 'unit', 'route', 'equipment', 'result'].every(k => text(m[k]) && !!m[k]) || !positive(m.dose) || (m.dose as number) === 0 || !positive(m.concentration) || (m.concentration as number) === 0 || !positive(m.duration) || !positive(m.onset) || !deltas(m.effect) || !deltas(m.targets)) throw new Error('Medikationsmodell ungültig.');
    medIds.add(m.id);
  }
  for (const c of d.criteria) if (!object(c) || !identifier(c.flag) || !flags.has(c.flag) || (c.after !== undefined && (!identifier(c.after) || !flags.has(c.after))) || !text(c.label) || !text(c.why) || !['abcde', 'sbar', 'scenario', 'drug'].includes(String(c.source)) || (c.before !== undefined && !positive(c.before))) throw new Error('Bewertungskriterium ungültig.');
  if (d.actions.some(a => a.requires && !flags.has(a.requires)) || d.stabilizers.some(f => !flags.has(f))) throw new Error('Voraussetzung oder Stabilisierungsregel verweist auf unbekannte Aktion.');
  const reachable = new Set(['documented', 'sbar', ...((d.storyline ?? []) as Record<string, unknown>[]).flatMap(e => e.flag ? [e.flag as string] : [])]);
  for (let i = 0; i <= d.actions.length; i++) for (const a of d.actions) if (!a.requires || reachable.has(a.requires)) { if (a.flag) reachable.add(a.flag); }
  if (d.actions.some(a => a.requires && !reachable.has(a.requires))) throw new Error('Unerreichbare Aktion: zyklische oder nicht erfüllbare Voraussetzungen.');
  if (new Set(d.criteria.map(c => c.flag)).size !== d.criteria.length) throw new Error('Bewertungskriterium doppelt.');
  // Return only JSON data; rendering uses React text nodes, never HTML.
  return d as unknown as Scenario;
}
export const CURRENT = 'lernstoff.praxis.aktuell';
const ARCHIVE = 'lernstoff.praxis.archiv';
export function readArchive(): Session[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(ARCHIVE) ?? '[]');
    if (!Array.isArray(data)) return [];
    return data.slice(0, 10).filter(s => s && s.version === 1 && s.phase === 'finished' && typeof s.id === 'string' && Array.isArray(s.events) && s.events.every((e: Record<string, unknown>) => object(e) && text(e.title) && text(e.detail) && number(e.at) && number(e.id)) && object(s.flags) && Object.values(s.flags).every(number)).flatMap(s => {
      try { return [{ ...s, scenario: parseScenario(JSON.stringify(s.scenario)) } as Session]; } catch { return []; }
    });
  } catch { return []; }
}
export function readSession(): { session: Session | null; error: string } {
  try {
    const raw = localStorage.getItem(CURRENT);
    if (!raw) return { session: null, error: '' };
    const s = JSON.parse(raw) as Session;
    if (s.version !== 1 || !text(s.id) || ![1, 2, 3].includes(s.level) || !(number(s.time) && s.time <= 31536000 && s.time >= 0) || !['active', 'finished'].includes(s.phase) || !Array.isArray(s.events) || !Array.isArray(s.pending) || !strings(s.done) || !object(s.flags) || !deltas(s.vitals) || !object(s.measured) || typeof s.monitoring !== 'boolean' || !number(s.deterioration) || !number(s.snapshotRemainder) || !number(s.seed) || !number(s.rng) || !Array.isArray(s.commands)) throw new Error();
    s.scenario = parseScenario(JSON.stringify(s.scenario));
    if (!s.pending.every(p => object(p) && text(p.id) && number(p.due) && text(p.title) && text(p.result) && (p.effect === undefined || deltas(p.effect))) || !s.events.every(e => object(e) && number(e.id) && number(e.at) && text(e.title) && text(e.detail)) || !Object.values(s.flags).every(number)) throw new Error();
    // Klinische Felder sind optional (ältere Stände); wenn vorhanden, muss ihre Form stimmen.
    if ((s.chart !== undefined && (!Array.isArray(s.chart) || s.chart.length > 300 || !s.chart.every(p => object(p) && number(p.at) && deltas(p.vitals) && avpu(p.avpu) && typeof p.oxygen === 'boolean'))) || (s.avpu !== undefined && !avpu(s.avpu)) || (s.oxygen !== undefined && typeof s.oxygen !== 'boolean') || (s.story !== undefined && (!object(s.story) || !Object.values(s.story).every(v => ['fired', 'prevented', 'skipped'].includes(v)))) || (s.drifts !== undefined && (!Array.isArray(s.drifts) || !s.drifts.every(d => object(d) && text(d.id) && deltas(d.drift) && strings(d.stoppedBy)))) || (s.harms !== undefined && (!Array.isArray(s.harms) || !s.harms.every(h => object(h) && number(h.at) && text(h.id) && text(h.text))))) throw new Error();
    if (!s.commands.every(c => object(c) && text(c.id) && object(c.command) && ['advance', 'action', 'medication', 'sbar', 'note', 'finish'].includes(String(c.command.type))) || new Set(s.commands.map(c => c.id)).size !== s.commands.length) throw new Error();
    return { session: s, error: '' };
  } catch { return { session: null, error: 'Gespeicherter Übungsstand konnte nicht gelesen werden. Er bleibt für eine Datensicherung erhalten; ein neuer Fall überschreibt ihn.' }; }
}
export function saveSession(s: Session | null) {
  try { if (s) localStorage.setItem(CURRENT, JSON.stringify(s)); else localStorage.removeItem(CURRENT); return ''; }
  catch { return 'Speichern auf diesem Gerät nicht möglich. Bitte den Verlauf als JSON exportieren.'; }
}
export function archive(s: Session) {
  try {
    const old: Session[] = JSON.parse(localStorage.getItem(ARCHIVE) ?? '[]');
    localStorage.setItem(ARCHIVE, JSON.stringify([s, ...(Array.isArray(old) ? old : []).filter(x => x.id !== s.id)].slice(0, 10)));
    return '';
  } catch { return 'Archiv konnte nicht gespeichert werden. Bitte Verlauf exportieren.'; }
}
export function download(name: string, data: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
