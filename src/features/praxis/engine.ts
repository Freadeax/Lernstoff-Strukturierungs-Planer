import type { Command, Event, Session, Scenario, Vitals, Vital } from './types';
import { correctVolume, decimalEqual } from './quantity';

export const SOURCES = {
  abcde: { title: 'Resuscitation Council UK · ABCDE', url: 'https://www.resus.org.uk/library/abcde-approach' },
  sbar: { title: 'AHRQ · TeamSTEPPS', url: 'https://www.ahrq.gov/teamstepps-program/resources/modules/index.html' },
  drug: { title: 'Furosemid · Fachinformation (emc)', url: 'https://www.medicines.org.uk/emc/product/14419/smpc' },
  scenario: { title: 'Didaktische Szenarioregel · kein Leitlinienstandard', url: '' },
};
const BOUNDS: Record<Vital, [number, number]> = { pulse: [30, 180], sys: [60, 220], dia: [30, 130], spo2: [70, 100], resp: [6, 45], temp: [34, 41], glucose: [30, 500], pain: [0, 10] };
const effect = (v: Vitals, delta: Partial<Vitals>, factor = 1): Vitals => Object.fromEntries(Object.entries(v).map(([k, n]) => {
  const key = k as Vital;
  return [k, Math.min(BOUNDS[key][1], Math.max(BOUNDS[key][0], n + (delta[key] ?? 0) * factor))];
})) as Vitals;
const add = (s: Session, kind: Event['kind'], title: string, detail = '') => {
  s.events.push({ id: (s.events.at(-1)?.id ?? 0) + 1, at: s.time, kind, title, detail });
};
export const clock = (seconds: number) => `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor(seconds / 60) % 60).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
export function start(scenario: Scenario, level: 1 | 2 | 3 = 1, seed = 2026): Session {
  return {
    version: 1, id: crypto.randomUUID(), scenario: structuredClone(scenario), level, time: 0, phase: 'active',
    vitals: { ...scenario.initial }, measured: {}, measuredAt: null, monitoring: false, flags: {}, pending: [], done: [],
    deterioration: 0, critical: false, snapshotRemainder: 0,
    seed: seed >>> 0, rng: seed >>> 0, commands: [],
    events: [{ id: 1, at: 0, kind: 'state', title: 'Übernahme', detail: scenario.situation }],
  };
}
function observe(s: Session) { s.measured = { ...s.vitals }; s.measuredAt = s.time; }

// A fixed one-second step makes the result independent of timer/UI batching.
function advance(s: Session, seconds: number) {
  for (let second = 0; second < Math.min(86400, Math.max(0, Math.floor(seconds))); second++) {
    s.time++;
    if (s.scenario.distraction && s.time % s.scenario.distraction.interval === 0) {
      s.rng = (Math.imul(s.rng, 1664525) + 1013904223) >>> 0;
      if (s.rng / 4294967296 < s.scenario.distraction.probability) add(s, 'state', 'Hintergrundereignis', s.scenario.distraction.text);
    }
    const supported = s.scenario.stabilizers.some(f => s.flags[f] !== undefined);
    const factor = supported ? 0 : [0, 0.6, 1, 1.4][s.level];
    s.vitals = effect(s.vitals, s.scenario.drift, factor / 60);
    s.deterioration += factor / 60;
    const ready = s.pending.filter(p => p.due <= s.time);
    s.pending = s.pending.filter(p => p.due > s.time);
    for (const p of ready) {
      const med = p.medicationId ? s.scenario.medications.find(m => m.id === p.medicationId) : undefined;
      if (med) {
        // A scenario-limited response envelope, not a universal drug effect or PK model.
        const delta = Object.fromEntries(Object.entries(med.targets).map(([key, target]) => {
          const k = key as Vital; const distance = target - s.vitals[k]; const limit = med.effect[k] ?? 0;
          return [k, Math.sign(distance) === Math.sign(limit) ? Math.sign(distance) * Math.min(Math.abs(limit), Math.abs(distance) * 0.3) : 0];
        }));
        s.vitals = effect(s.vitals, delta);
      } else s.vitals = effect(s.vitals, p.effect ?? {});
      if (p.flag) s.flags[p.flag] = s.time;
      add(s, 'result', p.title, p.result);
    }
    const critical = s.vitals.spo2 < 85 || s.vitals.sys < 80 || s.vitals.pulse > 150 || s.vitals.glucose < 40;
    if (critical && !s.critical) add(s, 'warning', 'Kritische Veränderung', 'Erneut beurteilen und frühzeitig Unterstützung organisieren.');
    s.critical = critical;
    if (s.monitoring) observe(s);
    // Keep a bounded visible timeline instead of recording every render or timer tick.
    if (++s.snapshotRemainder >= 60) { s.snapshotRemainder = 0; if (s.monitoring) add(s, 'state', 'Monitorverlauf', `Puls ${Math.round(s.vitals.pulse)}/min · SpO₂ ${Math.round(s.vitals.spo2)} % · AF ${Math.round(s.vitals.resp)}/min`); }
  }
}
export const CHECKS = ['Patient identifiziert', 'Wirkstoff und Allergien geprüft', 'Dosis und Konzentration geprüft', 'Applikationsweg geprüft', 'Zeitpunkt und Anordnung geprüft', 'Dokumentation vorbereitet', 'Aufklärung und Einwilligung geklärt', 'Wirkungskontrolle geplant'];

/** Sole command boundary. Engine and data have no React, network or storage dependencies. */
function execute(previous: Session, command: Command): Session {
  if (previous.phase !== 'active') return previous;
  const s = structuredClone(previous);
  if (command.type === 'advance') { advance(s, Number.isFinite(command.seconds) ? command.seconds : 0); return s; }
  if (command.type === 'finish') { s.phase = 'finished'; add(s, 'state', 'Debriefing begonnen'); return s; }
  if (command.type === 'note') {
    if (command.text.trim().length < 20) { add(s, 'warning', 'Dokumentation unvollständig', 'Mindestens 20 Zeichen: Beobachtung, Handlung und Wirkung festhalten.'); return s; }
    add(s, 'note', 'Pflegebericht', command.text.trim().slice(0, 4000)); s.flags.documented ??= s.time; advance(s, 60); return s;
  }
  if (command.type === 'sbar') {
    if (command.fields.length !== 4 || command.fields.some(f => f.trim().length < 5)) { add(s, 'warning', 'SBAR unvollständig', 'Alle vier Felder mit konkretem Inhalt ausfüllen.'); return s; }
    add(s, 'note', 'SBAR-Übergabe', command.fields.map((f, i) => `${['S', 'B', 'A', 'R'][i]}: ${f.trim().slice(0, 1000)}`).join('\n'));
    s.flags.sbar ??= s.time; advance(s, 60); return s;
  }
  if (command.type === 'action') {
    const action = s.scenario.actions.find(a => a.id === command.id);
    if (!action || (s.done.includes(action.id) && !action.repeatable)) return previous;
    if (action.requires && s.flags[action.requires] === undefined) { add(s, 'warning', 'Freigabe fehlt', 'Zuerst ärztliche Anordnung bzw. angezeigte Voraussetzung einholen.'); return s; }
    advance(s, action.seconds);
    if (!s.done.includes(action.id)) s.done.push(action.id);
    add(s, 'action', action.label, action.delay ? `Ergebnis in ${action.delay / 60} Simulationsminuten.` : action.result);
    if (action.delay) s.pending.push({ id: action.id, title: action.label, result: action.result, due: s.time + action.delay, effect: action.effect, flag: action.flag, sample: { ...s.vitals }, requestedBy: s.events.at(-1)?.id });
    else { s.vitals = effect(s.vitals, action.effect ?? {}); if (action.flag) { if (action.repeatable || s.flags[action.flag] === undefined) s.flags[action.flag] = s.time; } }
    if (action.id === 'vitals' || action.id === 'reassess') observe(s);
    if (action.id === 'reassess' && s.flags.medication_effect !== undefined) s.flags.medication_reviewed = s.time;
    if (action.id === 'monitor') { s.monitoring = true; observe(s); }
    return s;
  }
  const med = s.scenario.medications.find(m => m.id === command.id);
  if (!med) return previous;
  if (s.flags.orders === undefined) { add(s, 'warning', 'Keine ärztliche Anordnung', 'Zuerst Rücksprache halten. Die Ausbildungssituation erlaubt keine eigenständige Verordnung.'); return s; }
  if (s.done.includes(`med:${med.id}`)) { add(s, 'warning', 'Bereits verabreicht', 'Eine erneute Gabe erfordert eine neue Anordnung.'); return s; }
  const errors = [
    command.checks.length !== CHECKS.length || !command.checks.every(x => x === true) ? '8-R-Prüfung unvollständig' : '',
    !decimalEqual(command.dose, med.dose) ? 'Dosis weicht von der Anordnung ab' : '',
    !correctVolume(command.volume, med.dose, med.concentration) ? 'Volumen passt nicht zur Konzentration (Rechenrundung: 0,01 ml)' : '',
    command.route !== med.route ? 'Falscher Applikationsweg' : '',
    !Number.isFinite(command.duration) || command.duration < med.duration ? 'Applikation zu schnell' : '',
    command.equipment !== med.equipment ? 'Unpassendes Zubehör' : '',
    s.scenario.allergies.some(a => a.toLowerCase() === med.name.toLowerCase()) ? 'Dokumentierte Wirkstoffallergie' : '',
  ].filter(Boolean);
  if (errors.length) {
    // A training safety gate: modelled errors are logged, unsafe doses are not administered.
    add(s, 'warning', 'Medikationsfehler abgefangen', errors.join(' · '));
    return s;
  }
  advance(s, command.duration * 60);
  s.done.push(`med:${med.id}`); s.flags.medication ??= s.time;
  add(s, 'medication', `${med.name} verabreicht`, `${med.dose} ${med.unit} · ${med.route} · ${command.volume} ml. Simulationswirkung nach ${med.onset} Minuten.`);
  s.pending.push({ id: `med:${med.id}`, medicationId: med.id, title: `Wirkungskontrolle: ${med.name}`, due: s.time + med.onset * 60, result: med.result, flag: 'medication_effect', requestedBy: s.events.at(-1)?.id });
  return s;
}
/** Version-1 command contract: optional caller ID enables idempotent delivery. */
export function dispatch(previous: Session, command: Command, commandId?: string): Session {
  if (commandId && previous.commands.some(c => c.id === commandId)) return previous;
  const next = execute(previous, command);
  if (next === previous) return previous;
  const last = next.commands.at(-1);
  // Timer ticks are compacted; simulated time, queued events and order stay reproducible.
  if (!commandId && command.type === 'advance' && Number.isFinite(command.seconds) && command.seconds > 0 && last?.id.startsWith('local:') && last.command.type === 'advance' && last.command.seconds + Math.floor(command.seconds) <= 86400) last.command.seconds += Math.floor(command.seconds);
  else next.commands.push({ id: commandId ?? `local:${next.commands.length + 1}`, command: JSON.parse(JSON.stringify(command)) as Command });
  return next;
}
export function replay(session: Session): Session {
  let result = { ...start(session.scenario, session.level, session.seed), id: session.id };
  for (const entry of session.commands) result = dispatch(result, entry.command, entry.id);
  return result;
}
export function debrief(s: Session) {
  return s.scenario.criteria.map(c => ({ ...c, at: s.flags[c.flag], met: s.flags[c.flag] !== undefined && (c.before === undefined || s.flags[c.flag] <= c.before) && (c.after === undefined || s.flags[c.after] !== undefined && s.flags[c.flag] >= s.flags[c.after]), late: s.flags[c.flag] !== undefined && c.before !== undefined && s.flags[c.flag] > c.before }));
}
