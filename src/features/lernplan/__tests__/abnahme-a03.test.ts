// Abnahmefall A-03 aus dem Audit vom 11.11.2026 · Lernorganisation:
// Zwei Prüfungen mit überschneidenden Themen planen, Dienstzeiten ändern, Abfrage protokollieren.
// Erwartung: Plan begründet die Änderungen. Ein Ergebnis erzeugt einen Abruf, die nächste Fälligkeit
// und einen konsistenten Fortschrittswert (Lernplan, Wissensstand und Fortschrittsseite gleich).
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db, deleteAll } from '../../../core/db';
import type { Exam } from '../../../core/types';
import { buildPlan, computeProgress } from '..';
import { erklaereAenderung, wendeDienstplanAn } from '../alltag';
import { bucheErgebnis } from '../ergebnis';
import { assembleInput, loadPlannerData, saveConfig, saveExam } from '../store';
import { lernstufen, statusAm } from '../../fortschritt/statistik';
import { resolveSettings } from '../types';
import { topics } from './fixtures';

const HEUTE = '2026-10-26';
const klausur: Exam = { id: 'k1', name: 'Klausur Pflege', date: '2026-11-06', subjectIds: [], topicIds: ['haut', 'dekubitus', 'pflegeprozess'] };
const praxis: Exam = { id: 'k2', name: 'Praxisprüfung', date: '2026-11-20', subjectIds: [], topicIds: ['dekubitus', 'pflegeprozess', 'smart', 'sgb'] };
const name = (id: string) => topics.find((t) => t.id === id)?.name ?? id;

async function plan() {
  const data = await loadPlannerData(topics, HEUTE);
  const input = assembleInput(data);
  return { data, input, plan: buildPlan(input) };
}

describe('A-03 Lernorganisation', () => {
  beforeEach(async () => {
    await deleteAll();
    await saveConfig({ availability: { minutesByWeekday: [0, 90, 90, 90, 90, 90, 120], exceptions: {} } });
    await saveExam(klausur, 1);
    await saveExam(praxis, 2);
  });

  it('überschneidende Themen werden einmal erarbeitet, rechtzeitig vor der früheren Prüfung, beide Prüfungen werden abgefragt', async () => {
    const { plan: p } = await plan();
    for (const id of ['dekubitus', 'pflegeprozess']) {
      const erarbeiten = p.days.flatMap((d) => d.blocks.filter((b) => b.kind === 'erarbeiten' && b.topicId === id).map((b) => ({ ...b, date: d.date })));
      const gesamt = erarbeiten.reduce((s, b) => s + b.minutes, 0);
      expect(gesamt).toBe(topics.find((t) => t.id === id)!.estimatedMinutes);
      expect(erarbeiten.every((b) => b.date < klausur.date)).toBe(true);
      const vorK2 = p.days.filter((d) => d.date > klausur.date && d.date < praxis.date).flatMap((d) => d.blocks).filter((b) => b.topicId === id && b.kind !== 'erarbeiten');
      expect(vorK2.length).toBeGreaterThan(0);
    }
    expect(p.unscheduled).toEqual([]);
  });

  it('geänderte Dienstzeiten verschieben den Plan mit Begründung', async () => {
    const { data, input, plan: vorher } = await plan();
    const dienst = Object.fromEntries(['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29'].map((d) => [d, 'nacht' as const]));
    const neu = wendeDienstplanAn(data.config.availability, {}, dienst);
    const nachher = buildPlan({ ...input, availability: neu.availability });
    const saetze = erklaereAenderung(vorher, nachher, name);
    expect(saetze.length).toBeGreaterThan(0);
    for (const s of saetze) expect(s.text).toMatch(/fertig am|passt nicht mehr|passt jetzt wieder|schon am/);
    for (const d of nachher.days.filter((x) => x.date in dienst)) expect(d.blocks).toEqual([]);
  });

  it('eine Abfrage erzeugt genau einen Abruf, die nächste Fälligkeit und überall denselben Stand', async () => {
    await db.studyLogs.add({ topicId: 'haut', date: '2026-10-20', minutes: 90, at: '2026-10-20T10:00:00Z' });
    const r = await bucheErgebnis({ versuchId: 'karteikarten:haut:1', herkunft: { modul: 'karteikarten' }, status: 'abgeschlossen', aussagekraft: 'abruf', quelle: 'karteikarten', ergebnisse: [{ topicId: 'haut', scorePercent: 90, anzahl: 10 }], date: HEUTE }, topics);
    await bucheErgebnis({ versuchId: 'karteikarten:haut:1', herkunft: { modul: 'karteikarten' }, status: 'abgeschlossen', aussagekraft: 'abruf', quelle: 'karteikarten', ergebnisse: [{ topicId: 'haut', scorePercent: 90, anzahl: 10 }], date: HEUTE }, topics);
    expect(r[0]!.zaehlt).toBe(true);
    expect(await db.reviewLogs.count()).toBe(1);

    const { input, plan: p } = await plan();
    const imPlan = p.progress.haut!;
    expect(imPlan.testCount).toBe(1);
    expect(imPlan.nextReview! > HEUTE).toBe(true);
    // Heute steht keine weitere Abfrage zu „haut“ mehr im Plan
    expect(p.days.find((d) => d.date === HEUTE)?.blocks.some((b) => b.topicId === 'haut' && b.kind !== 'erarbeiten') ?? false).toBe(false);
    // Die nächste Abfrage liegt im Plan am oder nach dem Fälligkeitstag
    const naechste = p.days.find((d) => d.date > HEUTE && d.blocks.some((b) => b.topicId === 'haut' && b.kind !== 'erarbeiten'));
    if (naechste) expect(naechste.date >= imPlan.nextReview! || naechste.date === addDaysVor(klausur.date)).toBe(true);

    // Wissensstand-Ansicht und Fortschrittsseite rechnen mit denselben Daten dasselbe
    const einzeln = computeProgress(topics[0]!, input.studyLogs, input.reviewLogs, HEUTE, resolveSettings(input));
    const fortschritt = statusAm({ leaves: topics, studyLogs: input.studyLogs, reviewLogs: input.reviewLogs, settings: resolveSettings(input), heute: HEUTE }, HEUTE).get('haut')!;
    expect(einzeln.status).toBe(imPlan.status);
    expect(fortschritt.status).toBe(imPlan.status);
    expect(fortschritt.nextReview).toBe(imPlan.nextReview);
    const stufen = lernstufen(topics.map((t) => t.id), input.studyLogs, input.reviewLogs, (id) => p.progress[id]?.status ?? 'offen');
    expect(stufen.gelesen).toContain('haut');
    expect(stufen.abgerufen).toEqual(['haut']);
    expect(stufen.bestaetigt).toEqual([]);
  });
});

function addDaysVor(iso: string) {
  const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() - 1); return d.toISOString().slice(0, 10);
}
