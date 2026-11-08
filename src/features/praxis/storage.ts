import type { Scenario, Session } from './types';
import { BEWERTET, KETTEN, SETTINGS, STORY_KINDS } from './types';
import { AVPU } from './news2';
import { notiereFehler } from '../fehlerheft/fehlerheft';
import { ausPraxis } from '../fehlerheft/quellen';

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
    if ((e.resolvedBy !== undefined && (!Array.isArray(e.resolvedBy) || !e.resolvedBy.length || !e.resolvedBy.every(identifier))) || (e.unless !== undefined && (!Array.isArray(e.unless) || !e.unless.every(identifier))) || (e.when !== undefined && !identifier(e.when))) throw new Error('Verlaufsereignis: Bedingung ungültig.');
    if (e.choices !== undefined) {
      if (!Array.isArray(e.choices) || e.choices.length < 2 || e.choices.length > 4) throw new Error('Entscheidungsmoment braucht 2 bis 4 Optionen.');
      const choiceIds = new Set<string>();
      for (const c of e.choices as unknown[]) {
        if (!object(c) || !identifier(c.id) || choiceIds.has(c.id) || !text(c.label) || !c.label.trim() || !text(c.result) || !text(c.why) || (c.best !== undefined && typeof c.best !== 'boolean') || (c.flag !== undefined && !identifier(c.flag)) || (c.effect !== undefined && !deltas(c.effect)) || (c.avpu !== undefined && !avpu(c.avpu)) || (c.oxygen !== undefined && typeof c.oxygen !== 'boolean') || (c.harm !== undefined && (!text(c.harm) || !c.harm.trim())) || (c.seconds !== undefined && (!positive(c.seconds) || (c.seconds as number) > 3600))) throw new Error('Option im Entscheidungsmoment ungültig oder Kennung doppelt.');
        choiceIds.add(c.id); if (c.flag) flags.add(c.flag as string);
      }
      if (!(e.choices as Record<string, unknown>[]).some(c => c.best === true)) throw new Error('Entscheidungsmoment braucht mindestens eine beste Option.');
    }
    storyIds.add(e.id); if (e.flag) flags.add(e.flag as string);
  }
  for (const e of (d.storyline ?? []) as Record<string, unknown>[]) if ([...((e.unless as string[]) ?? []), ...((e.stoppedBy as string[]) ?? []), ...((e.resolvedBy as string[]) ?? []), ...(e.when ? [e.when as string] : [])].some(f => !flags.has(f))) throw new Error('Verlaufsereignis verweist auf unbekannte Handlung.');
  const medIds = new Set<string>();
  for (const m of d.medications) {
    if (!object(m) || !identifier(m.id) || medIds.has(m.id) || !['name', 'atc', 'unit', 'route', 'equipment', 'result'].every(k => text(m[k]) && !!m[k]) || !positive(m.dose) || (m.dose as number) === 0 || !positive(m.concentration) || (m.concentration as number) === 0 || !positive(m.duration) || !positive(m.onset) || !deltas(m.effect) || !deltas(m.targets)) throw new Error('Medikationsmodell ungültig.');
    medIds.add(m.id as string);
  }
  for (const c of d.criteria) if (!object(c) || !identifier(c.flag) || !flags.has(c.flag) || (c.after !== undefined && (!identifier(c.after) || !flags.has(c.after))) || !text(c.label) || !text(c.why) || !['abcde', 'sbar', 'scenario', 'drug'].includes(String(c.source)) || (c.before !== undefined && !positive(c.before))) throw new Error('Bewertungskriterium ungültig.');
  if (d.actions.some(a => a.requires && !flags.has(a.requires)) || d.stabilizers.some(f => !flags.has(f))) throw new Error('Voraussetzung oder Stabilisierungsregel verweist auf unbekannte Aktion.');
  const reachable = new Set(['documented', 'sbar', ...((d.storyline ?? []) as Record<string, unknown>[]).flatMap(e => [...(e.flag ? [e.flag as string] : []), ...((e.choices as Record<string, unknown>[] | undefined) ?? []).flatMap(c => c.flag ? [c.flag as string] : [])])]);
  for (let i = 0; i <= d.actions.length; i++) for (const a of d.actions) if (!a.requires || reachable.has(a.requires)) { if (a.flag) reachable.add(a.flag); }
  if (d.actions.some(a => a.requires && !reachable.has(a.requires))) throw new Error('Unerreichbare Aktion: zyklische oder nicht erfüllbare Voraussetzungen.');
  if (new Set(d.criteria.map(c => c.flag)).size !== d.criteria.length) throw new Error('Bewertungskriterium doppelt.');
  for (const c of d.criteria as Record<string, unknown>[]) if ((c.anyOf !== undefined && (!Array.isArray(c.anyOf) || !c.anyOf.length || c.anyOf.length > 6 || !c.anyOf.every(f => identifier(f) && flags.has(f)))) || (c.bewertet !== undefined && !Object.hasOwn(BEWERTET, String(c.bewertet)))) throw new Error('Bewertungskriterium: alternativer Weg oder Prüfart ungültig.');
  if (d.escalation !== undefined && (!Array.isArray(d.escalation) || d.escalation.length > 6 || !d.escalation.every(f => identifier(f) && flags.has(f)))) throw new Error('Eskalationsweg verweist auf unbekannte Handlung.');
  // Kennungen in Ketten: Handlung, Flag, ereignis:<id>, wahl:<ereignis>:<option> oder med:<id>.
  const known = (id: unknown) => {
    if (typeof id !== 'string' || id.length > 130) return false;
    const [kind, a, b] = id.split(':');
    if (id.startsWith('ereignis:')) return storyIds.has(a!);
    if (id.startsWith('med:')) return medIds.has(a!);
    if (id.startsWith('wahl:')) return ((d.storyline ?? []) as Record<string, unknown>[]).some(e => e.id === a && ((e.choices as Record<string, unknown>[] | undefined) ?? []).some(c => c.id === b));
    return identifier(kind) && (ids.has(id) || flags.has(id));
  };
  if (d.chains !== undefined) {
    if (!Array.isArray(d.chains) || d.chains.length > 30) throw new Error('Ketten ungültig oder zu viele.');
    const chainIds = new Set<string>();
    for (const k of d.chains as unknown[]) {
      if (!object(k) || !identifier(k.id) || chainIds.has(k.id) || !Object.hasOwn(KETTEN, String(k.art)) || !['observation', 'decision', 'why'].every(f => text(k[f]) && !!(k[f] as string).trim())) throw new Error('Kette Beobachtung → Entscheidung ungültig oder Kennung doppelt.');
      if (!Array.isArray(k.seenBy) || !k.seenBy.length || k.seenBy.length > 10 || !k.seenBy.every(known)) throw new Error(`Kette ${k.id}: Beobachtung verweist auf Unbekanntes.`);
      if (!Array.isArray(k.ways) || !k.ways.length || k.ways.length > 5 || !k.ways.every(w => object(w) && text(w.label) && !!w.label.trim() && Array.isArray(w.ids) && w.ids.length > 0 && w.ids.length <= 6 && w.ids.every(known))) throw new Error(`Kette ${k.id}: Handlungswege ungültig.`);
      if ((k.within !== undefined && (!positive(k.within) || (k.within as number) < 1)) || (k.after !== undefined && typeof k.after !== 'boolean')) throw new Error(`Kette ${k.id}: Zeitfenster ungültig.`);
      chainIds.add(k.id);
    }
  }
  if (d.sbarCheck !== undefined && (!Array.isArray(d.sbarCheck) || d.sbarCheck.length > 20 || !d.sbarCheck.every(c => object(c) && [0, 1, 2, 3].includes(c.field as number) && text(c.label) && !!c.label.trim() && strings(c.any) && c.any.length > 0 && c.any.every(w => w.trim().length >= 2)))) throw new Error('SBAR-Stichwortprüfung ungültig.');
  if (d.kern !== undefined && (!object(d.kern) || !text(d.kern.stand) || !['ausstehend', 'erteilt'].includes(String(d.kern.freigabe)) || (d.kern.pruefer !== undefined && !text(d.kern.pruefer)) || !strings(d.kern.pruefpunkte))) throw new Error('Kernfall-Angaben ungültig.');
  // Eine fachliche Freigabe braucht immer eine namentlich prüfende Person.
  if (object(d.kern) && d.kern.freigabe === 'erteilt' && !d.kern.pruefer) throw new Error('Freigabe ohne prüfende Person ist nicht zulässig.');
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
/** Prüft einen gespeicherten Übungsstand (auch innerhalb einer Schicht). Wirft bei falscher Form. */
export function pruefeSession(value: unknown): Session {
  const s = value as Session;
  if (!object(s) || s.version !== 1 || !text(s.id) || ![1, 2, 3].includes(s.level) || !(number(s.time) && s.time <= 31536000 && s.time >= 0) || !['active', 'finished'].includes(s.phase) || !Array.isArray(s.events) || !Array.isArray(s.pending) || !strings(s.done) || !object(s.flags) || !deltas(s.vitals) || !object(s.measured) || typeof s.monitoring !== 'boolean' || !number(s.deterioration) || !number(s.snapshotRemainder) || !number(s.seed) || !number(s.rng) || !Array.isArray(s.commands)) throw new Error();
  s.scenario = parseScenario(JSON.stringify(s.scenario));
  if (!s.pending.every(p => object(p) && text(p.id) && number(p.due) && text(p.title) && text(p.result) && (p.effect === undefined || deltas(p.effect))) || !s.events.every(e => object(e) && number(e.id) && number(e.at) && text(e.title) && text(e.detail)) || !Object.values(s.flags).every(number)) throw new Error();
  // Klinische Felder sind optional (ältere Stände); wenn vorhanden, muss ihre Form stimmen.
  if ((s.chart !== undefined && (!Array.isArray(s.chart) || s.chart.length > 300 || !s.chart.every(p => object(p) && number(p.at) && deltas(p.vitals) && avpu(p.avpu) && typeof p.oxygen === 'boolean'))) || (s.avpu !== undefined && !avpu(s.avpu)) || (s.oxygen !== undefined && typeof s.oxygen !== 'boolean') || (s.story !== undefined && (!object(s.story) || !Object.values(s.story).every(v => ['fired', 'prevented', 'skipped'].includes(v)))) || (s.drifts !== undefined && (!Array.isArray(s.drifts) || !s.drifts.every(d => object(d) && text(d.id) && deltas(d.drift) && strings(d.stoppedBy)))) || (s.harms !== undefined && (!Array.isArray(s.harms) || !s.harms.every(h => object(h) && number(h.at) && text(h.id) && text(h.text)))) || (s.open !== undefined && !strings(s.open)) || (s.decisions !== undefined && (!Array.isArray(s.decisions) || !s.decisions.every(x => object(x) && number(x.at) && text(x.event) && text(x.choice)))) || (s.trail !== undefined && (!Array.isArray(s.trail) || s.trail.length > 2000 || !s.trail.every(t => object(t) && number(t.at) && text(t.id))))) throw new Error();
  if (!s.commands.every(c => object(c) && text(c.id) && object(c.command) && ['advance', 'action', 'medication', 'sbar', 'note', 'choose', 'finish'].includes(String(c.command.type))) || new Set(s.commands.map(c => c.id)).size !== s.commands.length) throw new Error();
  return s;
}
export function readSession(): { session: Session | null; error: string } {
  try {
    const raw = localStorage.getItem(CURRENT);
    if (!raw) return { session: null, error: '' };
    return { session: pruefeSession(JSON.parse(raw)), error: '' };
  } catch { return { session: null, error: 'Gespeicherter Übungsstand konnte nicht gelesen werden. Er bleibt für eine Datensicherung erhalten; ein neuer Fall überschreibt ihn.' }; }
}
export function saveSession(s: Session | null) {
  try { if (s) localStorage.setItem(CURRENT, JSON.stringify(s)); else localStorage.removeItem(CURRENT); return ''; }
  catch { return 'Speichern auf diesem Gerät nicht möglich. Bitte den Verlauf als JSON exportieren.'; }
}
/**
 * Legt einen abgeschlossenen Fall ins Archiv. Beim ersten Archivieren gehen Entscheidungen,
 * bei denen nicht die beste Option gewählt wurde, ins Fehlerheft (nicht noch einmal nach einem Neuladen).
 */
export function archive(s: Session) {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(ARCHIVE) ?? '[]');
    const old = Array.isArray(raw) ? raw as Session[] : [];
    const neu = !old.some(x => x?.id === s.id);
    localStorage.setItem(ARCHIVE, JSON.stringify([s, ...old.filter(x => x?.id !== s.id)].slice(0, 10)));
    if (neu) notiereFehler(ausPraxis(s.scenario, s.decisions ?? []));
    return '';
  } catch { return 'Archiv konnte nicht gespeichert werden. Bitte Verlauf exportieren.'; }
}
export function download(name: string, data: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
