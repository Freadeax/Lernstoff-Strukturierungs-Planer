import { describe, expect, it } from 'vitest';
import { buildPlan } from '..';
import {
  beginnAm, erklaereAenderung, istPlanStand, kompetenzUebersicht, planStand, schichtAusNotiz, schichtMinuten, verpassteBloecke, wendeDienstplanAn,
} from '../alltag';
import { faltZeile, icsText, planAlsIcs, planAlsIcsMitUids, zeitfenster } from '../ics';
import type { TopicProgress } from '../progress';
import { availability, baseInput, examA, topics } from './fixtures';

const name = (id: string) => topics.find((t) => t.id === id)?.name ?? id;

describe('Dienstplan-Vorlagen', () => {
  it('setzt Lernzeit und Notiz je Tag und nimmt eigene Minuten', () => {
    const r = wendeDienstplanAn(availability, {}, { '2026-10-27': 'spaet', '2026-10-28': 'nacht', '2026-10-29': 'frueh' }, { frueh: 20 });
    expect(r.availability.exceptions).toEqual({ '2026-10-27': 30, '2026-10-28': 0, '2026-10-29': 20 });
    expect(r.notes['2026-10-27']).toBe('Spätdienst');
    expect(schichtAusNotiz(r.notes['2026-10-28'])).toBe('nacht');
  });

  it('„Normal“ entfernt Ausnahme und Notiz wieder', () => {
    const r = wendeDienstplanAn({ ...availability, exceptions: { '2026-10-27': 30 } }, { '2026-10-27': 'Spätdienst' }, { '2026-10-27': null });
    expect(r.availability.exceptions).toEqual({});
    expect(r.notes).toEqual({});
  });

  it('ungültige eigene Minuten fallen auf den Vorschlag zurück', () => {
    expect(schichtMinuten('frei', { frei: -5 })).toBe(120);
    expect(schichtMinuten('frei', { frei: Number.NaN })).toBe(120);
    expect(schichtAusNotiz('krank')).toBeUndefined();
  });
});

describe('Erklärte Verschiebung', () => {
  it('nennt bei einer Ausfallwoche, welche Themen später fertig werden', () => {
    const input = baseInput();
    const vorher = buildPlan(input);
    const exceptions = Object.fromEntries(['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30'].map((d) => [d, 0]));
    const nachher = buildPlan({ ...input, availability: { ...availability, exceptions } });
    const saetze = erklaereAenderung(vorher, nachher, name);
    expect(saetze.length).toBeGreaterThan(0);
    expect(saetze.some((s) => s.art === 'spaeter' || s.art === 'raus')).toBe(true);
    // Wichtigstes zuerst: was nicht mehr passt, steht vor späteren Terminen
    const raus = saetze.findIndex((s) => s.art === 'raus');
    const spaeter = saetze.findIndex((s) => s.art === 'spaeter');
    if (raus >= 0 && spaeter >= 0) expect(raus).toBeLessThan(spaeter);
  });

  it('ohne Änderung keine Sätze', () => {
    const plan = buildPlan(baseInput());
    expect(erklaereAenderung(plan, plan, name)).toEqual([]);
  });
});

describe('Verpasste Blöcke', () => {
  it('meldet am nächsten Tag liegen gebliebene Erarbeitung mit neuem Termin und Grund', () => {
    const gestern = buildPlan(baseInput());
    const stand = planStand(gestern);
    expect(istPlanStand(stand)).toBe(true);
    expect(stand.bloecke.length).toBeGreaterThan(0);
    const heute = buildPlan(baseInput({ today: '2026-10-27' }));
    const liste = verpassteBloecke(stand, heute, [], []);
    expect(liste.length).toBeGreaterThan(0);
    for (const b of liste) {
      expect(b.warum).toMatch(/Nicht erledigt|Abfrage/);
      if (b.neu) expect(b.neu >= '2026-10-27').toBe(true);
    }
  });

  it('erfasste Lernzeit am Tag gilt als erledigt', () => {
    const gestern = buildPlan(baseInput());
    const stand = planStand(gestern);
    const logs = stand.bloecke.map((b) => ({ topicId: b.topicId, date: stand.date, minutes: b.minutes }));
    const heute = buildPlan(baseInput({ today: '2026-10-27', studyLogs: logs }));
    expect(verpassteBloecke(stand, heute, logs, [])).toEqual([]);
  });

  it('am selben Tag wird nichts gemeldet', () => {
    const plan = buildPlan(baseInput());
    expect(verpassteBloecke(planStand(plan), plan, [], [])).toEqual([]);
  });

  it('erkennt kaputte gespeicherte Stände', () => {
    expect(istPlanStand(null)).toBe(false);
    expect(istPlanStand({ date: 1 })).toBe(false);
  });
});

describe('Kompetenzbereiche vor der Prüfung', () => {
  const p = (topicId: string, status: TopicProgress['status'], testCount: number): TopicProgress =>
    ({ topicId, status, testCount, studiedMinutes: 0, remainingStudyMinutes: 0, reasons: [] });
  it('teilt Themen in belastbar, wackelig und zu wenig abgefragt, Rest ohne Zuordnung', () => {
    const progress = { haut: p('haut', 'sicher', 3), dekubitus: p('dekubitus', 'unsicher', 2), pflegeprozess: p('pflegeprozess', 'bearbeitet', 1) };
    const z = kompetenzUebersicht([
      { id: 'kb.1', code: 'I', name: 'Pflegeprozesse', topicIds: ['haut', 'dekubitus', 'pflegeprozess', 'sgb'] },
      { id: 'kb.2', code: 'II', name: 'Kommunikation', topicIds: ['sgb'] },
    ], examA.topicIds, progress);
    expect(z).toHaveLength(2);
    expect(z[0]).toMatchObject({ code: 'I', themen: 3, belastbar: 1, wackelig: 1, zuWenig: 1 });
    expect(z[1]).toMatchObject({ name: 'Ohne Zuordnung', themen: 1, zuWenig: 1 });
    expect(z[1]!.topicIds.zuWenig).toEqual(['smart']);
  });
});

describe('Kalenderexport (.ics)', () => {
  it('erzeugt ganztägige Lerntage und Prüfungen mit CRLF und gefalteten Zeilen', () => {
    const plan = buildPlan(baseInput());
    const ics = planAlsIcs(plan, [examA], name, { jetzt: new Date('2026-10-26T08:00:00Z') });
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics).toContain('DTSTART;VALUE=DATE:20261026');
    expect(ics).toContain('UID:pruefung-klausur-pflege@lernstoff-planer');
    expect(ics).toContain('SUMMARY:Prüfung: Klausur Pflege');
    expect(ics).toContain('DTSTAMP:20261026T080000Z');
    const enc = new TextEncoder();
    for (const line of ics.split('\r\n')) expect(enc.encode(line).length).toBeLessThanOrEqual(75);
    expect((ics.match(/BEGIN:VEVENT/g) ?? []).length).toBe(plan.days.filter((d) => d.blocks.length).length + 1);
  });

  it('maskiert Sonderzeichen und faltet Umlaute nicht mitten im Zeichen', () => {
    expect(icsText('a,b;c\\d\ne')).toBe('a\\,b\\;c\\\\d\\ne');
    const lang = 'DESCRIPTION:' + 'Ü'.repeat(60);
    const gefaltet = faltZeile(lang);
    expect(gefaltet.replace(/\r\n /g, '')).toBe(lang);
    for (const l of gefaltet.split('\r\n')) expect(new TextEncoder().encode(l).length).toBeLessThanOrEqual(75);
  });
});

describe('Kalenderexport mit Uhrzeit, Sommerzeit und Neuimport', () => {
  it('trägt Lerntage mit Uhrzeit in Europe/Berlin ein, Ende = Lernzeit + Pausen, mit VTIMEZONE', () => {
    const plan = buildPlan(baseInput());
    const tag = plan.days.find((d) => d.blocks.length)!;
    const ics = planAlsIcs(plan, [], name, { beginn: (d) => (d === tag.date ? '18:00' : undefined), jetzt: new Date('2026-10-26T08:00:00Z') });
    const ende = zeitfenster(tag.date, '18:00', tag.plannedMinutes + tag.pauseMinutes)!;
    expect(ics).toContain(`DTSTART;TZID=Europe/Berlin:${tag.date.replace(/-/g, '')}T180000`);
    expect(ics).toContain(`DTEND;TZID=Europe/Berlin:${ende.ende}`);
    expect(ics).toContain('BEGIN:VTIMEZONE\r\nTZID:Europe/Berlin');
    expect(ics).toContain('RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU');
    // Andere Tage bleiben ganztägig
    expect(ics).toMatch(/DTSTART;VALUE=DATE:/);
  });

  it('Lokalzeit bleibt am Tag der Zeitumstellung gleich, über Mitternacht geht es in den nächsten Tag', () => {
    expect(zeitfenster('2026-10-25', '09:00', 90)).toEqual({ start: '20261025T090000', ende: '20261025T103000' });
    expect(zeitfenster('2026-03-29', '01:30', 60)).toEqual({ start: '20260329T013000', ende: '20260329T023000' });
    expect(zeitfenster('2026-11-01', '23:30', 45)).toEqual({ start: '20261101T233000', ende: '20261102T001500' });
    expect(zeitfenster('2026-11-01', '25:00', 45)).toBeUndefined();
  });

  it('Neuimport: gleiche UIDs mit höherer SEQUENCE, weggefallene künftige Lerntage werden abgesagt', () => {
    const plan = buildPlan(baseInput());
    const a = planAlsIcsMitUids(plan, [examA], name, { jetzt: new Date('2026-10-26T08:00:00Z') });
    const b = planAlsIcsMitUids(plan, [examA], name, { jetzt: new Date('2026-10-26T09:00:00Z'), frueher: [...a.uids, 'plan-2026-12-24@lernstoff-planer', 'plan-2026-01-01@lernstoff-planer'] });
    const seq = (ics: string) => Number(/SEQUENCE:(\d+)/.exec(ics)![1]);
    expect(seq(b.ics)).toBeGreaterThan(seq(a.ics));
    expect(b.uids).toEqual(a.uids);
    expect(b.ics).toContain('UID:plan-2026-12-24@lernstoff-planer');
    expect(b.ics).toMatch(/UID:plan-2026-12-24@lernstoff-planer[\s\S]*?STATUS:CANCELLED/);
    expect(b.ics).not.toContain('plan-2026-01-01');
  });

  it('Lernbeginn kommt aus der Vorlage des Tages, sonst aus dem normalen Tag', () => {
    expect(beginnAm('Frühdienst', { frueh: '15:30', normal: '18:00' })).toBe('15:30');
    expect(beginnAm(undefined, { normal: '18:00' })).toBe('18:00');
    expect(beginnAm('Nachtdienst', { normal: '18:00' })).toBeUndefined();
    expect(beginnAm(undefined, { normal: 'abc' })).toBeUndefined();
  });
});
