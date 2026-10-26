import { describe, expect, it } from 'vitest';
import { SCENARIOS, RESOURCES } from './catalog';
import { CHECKS, debrief, dispatch, replay, start } from './engine';
import { parseScenario } from './storage';
import type { Command, Scenario, Session } from './types';
import { xapiDraft } from './tracking';

const scenario = SCENARIOS.find(s => s.id === 'nachtwache')!;
const action = (s: Session, id: string) => dispatch(s, { type: 'action', id });
function ordered() {
  let s = action(start(scenario), 'help'); s = action(s, 'orders');
  return dispatch(s, { type: 'advance', seconds: RESOURCES.station.helpMinutes * 60 });
}
const correct: Extract<Command, { type: 'medication' }> = { type: 'medication', id: 'furosemide', dose: 40, volume: 4, route: 'i.v.', duration: 10, equipment: 'Spritze und i.v.-Zugang', checks: CHECKS.map(() => true) };

describe('Praxissimulator – autonome Engine', () => {
  it('validiert alle neun datengetriebenen Szenarien', () => {
    expect(new Set(SCENARIOS.map(s => s.setting)).size).toBe(9);
    for (const s of SCENARIOS) expect(parseScenario(JSON.stringify(s))).toEqual(s);
  });
  it('enthüllt ohne Messung keine Vitalwerte', () => {
    const s = dispatch(start(scenario), { type: 'advance', seconds: 60 });
    expect(s.measured).toEqual({}); expect(s.vitals.spo2).toBeLessThan(scenario.initial.spo2);
  });
  it('reagiert unabhängig von Timer-Bündelung identisch', () => {
    const s = start(scenario, 3);
    const large = dispatch(s, { type: 'advance', seconds: 120 });
    let small = s; for (let i = 0; i < 120; i++) small = dispatch(small, { type: 'advance', seconds: 1 });
    expect(large).toEqual(small);
    expect(s.time).toBe(0); expect(s.vitals).toEqual(scenario.initial);
  });
  it('lässt zeitabhängige Verschlechterung durch Versorgung im Modell stoppen', () => {
    const supplied = action(start(scenario), 'care');
    const later = dispatch(supplied, { type: 'advance', seconds: 60 });
    expect(later.vitals).toEqual(supplied.vitals);
  });
  it('unterscheidet Messmoment und kontinuierliches Monitoring', () => {
    const measured = action(start(scenario), 'vitals');
    const later = dispatch(measured, { type: 'advance', seconds: 60 });
    expect(later.measured).toEqual(measured.measured); expect(later.vitals).not.toEqual(measured.measured);
    const monitor = action(later, 'monitor'); const live = dispatch(monitor, { type: 'advance', seconds: 10 });
    expect(live.measured).toEqual(live.vitals); expect(live.measuredAt).toBe(live.time);
  });
  it('verhindert Diagnostik ohne Anordnung und wartet wirklich auf Rücksprache', () => {
    let s = action(start(scenario), 'lab'); expect(s.pending).toHaveLength(0); expect(s.events.at(-1)?.kind).toBe('warning');
    s = action(action(s, 'help'), 'orders'); expect(s.flags.orders).toBeUndefined();
    s = action(s, 'lab'); expect(s.done).not.toContain('lab');
    s = dispatch(s, { type: 'advance', seconds: 180 }); expect(s.flags.orders).toBeDefined();
  });
  it('liefert Labor erst nach Ablauf der Befundwartezeit', () => {
    let s = action(ordered(), 'lab'); const due = s.pending.find(p => p.id === 'lab')!.due;
    s = dispatch(s, { type: 'advance', seconds: due - s.time - 1 }); expect(s.flags.lab).toBeUndefined();
    s = dispatch(s, { type: 'advance', seconds: 1 }); expect(s.flags.lab).toBe(due);
    const count = s.events.filter(e => e.kind === 'result' && e.title.startsWith('Zentrallabor')).length;
    s = dispatch(s, { type: 'advance', seconds: 60 }); expect(s.events.filter(e => e.kind === 'result' && e.title.startsWith('Zentrallabor'))).toHaveLength(count);
  });
  it('verweigert Wiederholung einmaliger Maßnahmen', () => {
    const s = action(start(scenario), 'care'); expect(action(s, 'care')).toBe(s);
  });
  it('erlaubt erneute Messung ohne doppelte done-Einträge', () => {
    let s = action(start(scenario), 'vitals'); s = action(s, 'vitals');
    expect(s.done.filter(x => x === 'vitals')).toHaveLength(1); expect(s.flags.vitals).toBe(s.time);
  });
  it('sperrt Untersuchungen ohne Einwilligung', () => {
    let s = action(start(scenario), 'palpate'); expect(s.done).not.toContain('palpate');
    s = action(action(s, 'deescalate'), 'palpate'); expect(s.done).toContain('palpate');
  });
  it('verweigert Arzneimittel ohne Anordnung', () => {
    const s = dispatch(start(scenario), correct); expect(s.done).not.toContain('med:furosemide'); expect(s.events.at(-1)?.title).toBe('Keine ärztliche Anordnung');
  });
  it.each([
    { dose: 80 }, { volume: 40 }, { route: 'oral' }, { duration: 1 }, { equipment: 'Medikamentenbecher' },
    { checks: [] }, { checks: CHECKS.map(() => false) }, { dose: NaN }, { volume: Infinity },
  ])('fängt Medikationsfehler ab: %j', invalid => {
    const before = ordered(); const after = dispatch(before, { ...correct, ...invalid });
    expect(after.time).toBe(before.time); expect(after.vitals).toEqual(before.vitals); expect(after.pending).toEqual(before.pending);
    expect(after.events.at(-1)?.title).toBe('Medikationsfehler abgefangen');
  });
  it('blockiert eine im Datensatz dokumentierte Wirkstoffallergie', () => {
    const s = ordered(); s.scenario.allergies.push('Furosemid');
    expect(dispatch(s, correct).events.at(-1)?.detail).toContain('Wirkstoffallergie');
  });
  it('verzögert die Wirkung, verhindert Doppelgabe und fordert Nachkontrolle', () => {
    let s = action(ordered(), 'care'); s = dispatch(s, correct);
    expect(s.flags.medication_effect).toBeUndefined();
    const duplicate = dispatch(s, correct); expect(duplicate.pending).toEqual(s.pending); expect(duplicate.events.at(-1)?.title).toBe('Bereits verabreicht');
    s = dispatch(s, { type: 'advance', seconds: 900 }); expect(s.flags.medication_effect).toBeDefined();
    expect(debrief(s).find(c => c.flag === 'medication_reviewed')?.met).toBe(false);
    s = action(s, 'reassess'); expect(debrief(s).find(c => c.flag === 'medication_reviewed')?.met).toBe(true);
  });
  it('bewertet Vollständigkeit, ohne Freitextkompetenz zu behaupten', () => {
    let s = dispatch(start(scenario), { type: 'note', text: 'kurz' }); expect(s.flags.documented).toBeUndefined();
    s = dispatch(s, { type: 'sbar', fields: ['Situation', '', 'Einschätzung', 'Empfehlung'] }); expect(s.flags.sbar).toBeUndefined();
    s = dispatch(s, { type: 'note', text: 'Patient aufrecht positioniert. Atemarbeit erneut prüfen.' }); expect(s.flags.documented).toBeDefined();
    s = dispatch(s, { type: 'sbar', fields: ['Atemnot', 'Herzinsuffizienz', 'Tachypnoe beobachtet', 'Ärztliche Beurteilung erbeten'] }); expect(s.flags.sbar).toBeDefined();
  });
  it('sperrt sämtliche Veränderungen nach Abschluss', () => {
    const s = dispatch(start(scenario), { type: 'finish' });
    expect(action(s, 'vitals')).toBe(s); expect(dispatch(s, { type: 'advance', seconds: 60 })).toBe(s);
  });
  it('stellt Zustand, Warteschlangen, Zeit und Bewertung über Replay exakt wieder her', () => {
    let s = ordered(); s = action(s, 'care'); s = dispatch(s, correct); s = dispatch(s, { type: 'advance', seconds: 1200 });
    s = action(s, 'reassess'); s = dispatch(s, { type: 'finish' });
    const reconstructed = replay(s); expect(reconstructed).toEqual(s); expect(debrief(reconstructed)).toEqual(debrief(s));
  });
  it('verarbeitet erneut zugestellte Command-IDs nur einmal', () => {
    const s = dispatch(start(scenario), { type: 'action', id: 'vitals' }, 'request-1');
    expect(dispatch(s, { type: 'action', id: 'vitals' }, 'request-1')).toBe(s);
  });
  it('erzeugt mit gleichem Seed identische Hintergrundereignisse', () => {
    const scenario = SCENARIOS.find(x => x.setting === 'zna')!;
    let a = start(scenario, 2, 42); let b = { ...start(scenario, 2, 42), id: a.id };
    a = dispatch(a, { type: 'advance', seconds: 3600 });
    for (let i = 0; i < 60; i++) b = dispatch(b, { type: 'advance', seconds: 60 });
    expect(b).toEqual(a); expect(a.events.some(e => e.title === 'Hintergrundereignis')).toBe(true); expect(replay(a)).toEqual(a);
  });
  it('exportiert stabile Tracking-IDs ohne Berichtsinhalte oder KI-Daten', () => {
    const s = dispatch(start(scenario), { type: 'note', text: 'Fiktive private Reflexion zum Verlauf und Maßnahmen.' });
    const statements = xapiDraft(s);
    expect(statements).toEqual(xapiDraft(s)); expect(new Set(statements.map(x => x.id)).size).toBe(statements.length);
    for (const statement of statements) {
      expect(statement.id).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
      expect(statement.actor.account.name).toContain(s.id); expect(statement.object.objectType).toBe('Activity');
    }
    expect(JSON.stringify(statements)).not.toContain('Fiktive private Reflexion');
  });
  it('hält Modellgrenzen bei langer Versorgungsunterbrechung ein', () => {
    const s = dispatch(start(scenario, 3), { type: 'advance', seconds: 86400 });
    expect(s.vitals.spo2).toBeGreaterThanOrEqual(70); expect(s.vitals.pulse).toBeLessThanOrEqual(180);
  });
});

describe('Szenario-Import', () => {
  it.each([
    (s: Scenario) => { s.version = 2 as 1; },
    (s: Scenario) => { s.initial.pulse = -1; },
    (s: Scenario) => { s.actions.push({ ...s.actions[0] }); },
    (s: Scenario) => { s.actions[0].requires = 'unbekannt'; },
    (s: Scenario) => { s.actions[0].flag = 'constructor'; },
    (s: Scenario) => { s.drift = { invalid: 1 } as Scenario['drift']; },
    (s: Scenario) => { s.criteria[0].after = 'unbekannt'; },
    (s: Scenario) => { s.actions[0].flag = 'cyclea'; s.actions[0].requires = 'cycleb'; s.actions[1].flag = 'cycleb'; s.actions[1].requires = 'cyclea'; },
    (s: Scenario) => { s.model.review = 'approved' as 'unreviewed'; },
  ])('verwirft ungültige Daten und Referenzen', mutate => {
    const s = structuredClone(scenario); mutate(s); expect(() => parseScenario(JSON.stringify(s))).toThrow();
  });
  it('verwirft nicht interpretierbare und übergroße Eingaben', () => {
    expect(() => parseScenario('{}')).toThrow(); expect(() => parseScenario('x'.repeat(200001))).toThrow();
  });
});
