import { describe, expect, it } from 'vitest';
import { SCENARIOS } from './catalog';
import { clinicalDebrief, debrief, dispatch as roh, ketten, replay, sbarPruefung, start } from './engine';
import { dispatch } from './testhilfe';
import { parseScenario } from './storage';
import { blick, elementVon, handlungenFuer, RAUM_ELEMENTE } from './raum';
import type { Scenario, Session } from './types';

const byId = (id: string) => SCENARIOS.find(s => s.id === id)!;
const act = (s: Session, id: string) => dispatch(s, { type: 'action', id });
const wait = (s: Session, seconds: number) => dispatch(s, { type: 'advance', seconds });
const run = (id: string, steps: (string | number)[]) => steps.reduce<Session>((s, x) => typeof x === 'number' ? wait(s, x) : act(s, x), start(byId(id), 2));
const status = (s: Session) => Object.fromEntries(ketten(s).map(k => [k.id, k.status]));
const KERN = { station: 'nachtwache', zna: 'zna', ambulant: 'hausbesuch' } as const;

describe('Kernfälle im Praxissimulator', () => {
  it('hat je einen Kernfall für Normalstation, Notaufnahme und ambulante Pflege', () => {
    const kern = SCENARIOS.filter(s => s.kern);
    expect(kern.map(s => s.id).sort()).toEqual(Object.values(KERN).sort());
    for (const [setting, id] of Object.entries(KERN)) expect(byId(id).setting).toBe(setting);
  });

  it('jeder Kernfall ist vollständig ausgearbeitet und wartet auf menschliche Freigabe', () => {
    for (const s of SCENARIOS.filter(x => x.kern)) {
      expect(s.kern!.freigabe, s.id).toBe('ausstehend');
      expect(s.kern!.pruefpunkte.length, s.id).toBeGreaterThanOrEqual(5);
      expect(s.model.review, s.id).toBe('unreviewed');
      const arten = new Set(s.chains!.map(k => k.art));
      expect([...arten].sort(), `${s.id}: Entscheidung, Reevaluation und Eskalation`).toEqual(['entscheidung', 'eskalation', 'reevaluation']);
      expect(s.chains!.filter(k => k.ways.length > 1).length, `${s.id}: alternative richtige Wege`).toBeGreaterThanOrEqual(2);
      expect(s.sbarCheck!.map(c => c.field).sort(), s.id).toEqual([0, 1, 2, 3]);
      expect(s.storyline!.filter(e => e.choices).length, `${s.id}: mindestens zwei Entscheidungsmomente`).toBeGreaterThanOrEqual(2);
      expect(s.actions.filter(a => a.harm).length, `${s.id}: mindestens eine Fehlhandlung`).toBeGreaterThanOrEqual(1);
      expect(parseScenario(JSON.stringify(s))).toEqual(s);
    }
  });

  it('Normalstation: guter Verlauf schließt alle Ketten, über das Notfallteam als alternativen Weg', () => {
    const s = run('nachtwache', ['assessment', 'care', 'vitals', 'met', 'orders', 'inspect', 'urine', 'reassess', 600]);
    const k = ketten(s);
    expect(k.filter(x => !x.ok).map(x => x.id)).toEqual([]);
    expect(k.find(x => x.id === 'eskalation')!.taken!.label).toBe('Notfallteam alarmiert');
    expect(k.find(x => x.id === 'nach_furosemid')!.status).toBe('kein Anlass');
    expect(debrief(s).find(c => c.flag === 'help')!.met).toBe(true);
    expect(clinicalDebrief(s).escalation).not.toBe('nicht eskaliert');
  });

  it('Normalstation: gemessen, aber nicht eskaliert und nicht neu beurteilt, wird als Lücke gezeigt', () => {
    const s = run('nachtwache', ['vitals', 'care', 1200]);
    const st = status(s);
    expect(st.eskalation).toBe('fehlt');
    expect(st.nach_lagerung).toBe('fehlt');
    expect(st.lagerung).toBe('vorausschauend');
    const verspaetet = run('nachtwache', ['vitals', 600, 'help']);
    expect(status(verspaetet).eskalation).toBe('verspätet');
    expect(ketten(verspaetet).find(k => k.id === 'eskalation')!.minutes).toBe(11);
  });

  it('Notaufnahme: Trage statt Lagerung ist ein gleichwertiger Weg, EKG vorlegen ist inhaltlich bewertet', () => {
    const s = run('zna', ['patient', 'help', 'cubicle', 'ekg', 'monitor', 'defi', 'vitals']);
    const k = ketten(s);
    expect(k.find(x => x.id === 'belastung')!.taken!.label).toBe('Liegend zum Überwachungsplatz');
    expect(k.find(x => x.id === 'ekg_kette')!.status).toBe('erfüllt');
    const d = debrief(s);
    expect(d.find(c => c.flag === 'care')!.met).toBe(true);
    expect(d.find(c => c.flag === 'ekg_vorgelegt')).toMatchObject({ met: true, bewertet: 'inhalt' });
    expect(d.find(c => c.flag === 'documented')!.bewertet).toBe('vorliegen');
    expect(d.find(c => c.flag === 'ekg')!.bewertet).toBe('zeitpunkt');
    // Abgelegtes EKG: Kette offen, Folge dokumentiert.
    let x = roh(act(act(start(byId('zna'), 2), 'help'), 'ekg'), { type: 'advance', seconds: 10 });
    x = roh(x, { type: 'choose', event: 'ekg_befund', choice: 'ablegen' });
    expect(status(x).ekg_kette).toBe('fehlt');
    expect(x.harms!.some(h => h.id === 'ekg_befund:ablegen')).toBe(true);
  });

  it('Notaufnahme: eigene Nitro-Kapseln sind eine Fehlhandlung mit Blutdruckabfall', () => {
    const s = act(start(byId('zna'), 2), 'nitro_self');
    expect(s.harms!.map(h => h.id)).toContain('nitro_self');
    expect(s.vitals.sys).toBeLessThan(byId('zna').initial.sys - 20);
  });

  it('Ambulant: Trinkplan und Bereitschaftsdienst sind richtige Alternativen, Sturz verlangt Eskalation', () => {
    const s = run('hausbesuch', ['patient', 'hydration', 'fallsafe', 'trinkplan', 'medplan', 'bereitschaft', 'vitals', 1200]);
    const k = ketten(s);
    expect(k.find(x => x.id === 'trinken')!.taken!.label).toBe('Trinkplan mit Lieblingsgetränken');
    expect(k.find(x => x.id === 'medikation')!.taken!.label).toBe('Ärztlicher Bereitschaftsdienst');
    expect(s.story?.delir).toBe('prevented');
    expect(k.find(x => x.id === 'nach_sturz')!.status).toBe('kein Anlass');
    const gestuerzt = run('hausbesuch', ['unsupervised', 60]);
    expect(status(gestuerzt).nach_sturz).toBe('fehlt');
    expect(clinicalDebrief(gestuerzt).final.unstable).toBe(true);
    const versorgt = act(gestuerzt, 'ems');
    expect(status(versorgt).nach_sturz).toBe('erfüllt');
    expect(clinicalDebrief(versorgt).activeComplications).not.toContain('Sturz im Flur');
  });

  it('prüft SBAR in Kernfällen nur über Stichworte', () => {
    const leer = sbarPruefung(start(byId('nachtwache')));
    expect(leer.vorhanden).toBe(false);
    const s = dispatch(start(byId('nachtwache')), { type: 'sbar', fields: ['Akute Atemnot im Liegen', 'Bekannte Herzinsuffizienz', 'SpO2 89 %, AF 29/min', 'Bitte sofort ärztlich beurteilen'] });
    expect(sbarPruefung(s).checks.every(c => c.met)).toBe(true);
    const duenn = dispatch(start(byId('nachtwache')), { type: 'sbar', fields: ['Patient klingelt', 'Keine Angabe', 'Geht ihm nicht gut', 'Bitte melden'] });
    expect(sbarPruefung(duenn).checks.filter(c => c.met).length).toBe(0);
    expect(sbarPruefung(start(byId('sepsis'))).checks).toEqual([]);
  });

  it('Spur und Ketten sind exakt wiederholbar', () => {
    let s = run('zna', ['patient', 'walked', 30, 'help', 'ekg']);
    s = roh(s, { type: 'choose', event: 'ekg_befund', choice: 'selbst' });
    s = wait(s, 900);
    const r = replay(s);
    expect(r).toEqual(s);
    expect(ketten(r)).toEqual(ketten(s));
  });

  it('wertet ältere Spielstände ohne Spur über die Flags aus', () => {
    const s = run('nachtwache', ['vitals', 'help']);
    const alt = structuredClone(s); delete alt.trail;
    expect(status(alt).eskalation).toBe(status(s).eskalation);
  });

  it('weist ungültige Ketten, Prüfarten und Freigaben im JSON zurück', () => {
    const base = byId('nachtwache');
    const broken: ((s: Scenario) => void)[] = [
      s => { s.chains![0]!.seenBy = ['gibtsnicht']; },
      s => { s.chains![0]!.ways = []; },
      s => { s.chains![0]!.ways[0]!.ids = ['wahl:nachbar:gibtsnicht']; },
      s => { s.chains![1]!.id = s.chains![0]!.id; },
      s => { (s.chains![0] as { art: string }).art = 'bauchgefuehl'; },
      s => { s.criteria[0]!.anyOf = ['gibtsnicht']; },
      s => { (s.criteria[0] as { bewertet: string }).bewertet = 'gefuehlt'; },
      s => { s.sbarCheck![0]!.any = []; },
      s => { s.kern!.freigabe = 'erteilt'; },
    ];
    for (const mutate of broken) { const s = structuredClone(base); mutate(s); expect(() => parseScenario(JSON.stringify(s))).toThrow(); }
    const freigegeben = structuredClone(base); freigegeben.kern!.freigabe = 'erteilt'; freigegeben.kern!.pruefer = 'Praxisanleitung Muster';
    expect(parseScenario(JSON.stringify(freigegeben)).kern!.freigabe).toBe('erteilt');
  });
});

describe('Raumelemente', () => {
  it('ordnet jede Handlung genau einem Element zu, Raum und Liste zeigen dieselben Handlungen', () => {
    for (const s of SCENARIOS) {
      const alle = RAUM_ELEMENTE.flatMap(e => handlungenFuer(s, e).map(a => a.id));
      expect(alle.sort(), s.id).toEqual(s.actions.map(a => a.id).sort());
    }
    for (const id of Object.values(KERN)) for (const e of RAUM_ELEMENTE) expect(handlungenFuer(byId(id), e).length, `${id}/${e}`).toBeGreaterThan(0);
    expect(elementVon({ id: 'vitals', category: 'untersuchung' })).toBe('monitor');
    expect(elementVon({ id: 'help', category: 'kommunikation' })).toBe('telefon');
  });

  it('der erste Blick kostet keine Zeit und verrät keine Zahlen', () => {
    const s = start(byId('nachtwache'));
    const text = blick(s, 'patient');
    expect(text).toMatch(/atmet sichtbar schnell/);
    expect(text).not.toMatch(/\d/);
    expect(s.time).toBe(0);
    expect(blick(s, 'monitor')).toMatch(/nicht angeschlossen/);
    expect(blick(start(byId('hausbesuch')), 'monitor')).toMatch(/Blutdruckgerät/);
    expect(blick(act(s, 'help'), 'telefon')).toMatch(/Hilfe ist angefordert/);
  });
});
