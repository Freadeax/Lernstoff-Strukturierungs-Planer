import { describe, expect, it } from 'vitest';
import { buildPlan, resolveSettings, splitIntoUnits, topicPriority, type StudyPlan } from '..';
import { baseInput, examA, examB, topics } from './fixtures';

const blocksOf = (plan: StudyPlan) => plan.days.flatMap((d) => d.blocks.map((b) => ({ ...b, date: d.date })));
const studyDates = (plan: StudyPlan, topicId: string) =>
  blocksOf(plan).filter((b) => b.kind === 'erarbeiten' && b.topicId === topicId).map((b) => b.date);

describe('Stoffverteilung', () => {
  it('teilt große Themen in gleich große Blöcke', () => {
    expect(splitIntoUnits(120, 45)).toEqual([40, 40, 40]);
    expect(splitIntoUnits(100, 45)).toEqual([34, 33, 33]);
    expect(splitIntoUnits(0, 45)).toEqual([]);
  });

  it('plant den gesamten Stoff ein, wenn die Zeit reicht', () => {
    const plan = buildPlan(baseInput());
    expect(plan.unscheduled).toEqual([]);
    expect(plan.warnings.filter((w) => w.kind === 'zeitmangel')).toEqual([]);
    for (const t of topics) {
      const minutes = blocksOf(plan)
        .filter((b) => b.kind === 'erarbeiten' && b.topicId === t.id)
        .reduce((a, b) => a + b.minutes, 0);
      expect(minutes).toBe(t.estimatedMinutes);
    }
  });

  it('überschreitet nie die Tageskapazität (inkl. Puffer) und plant sonntags nichts', () => {
    const plan = buildPlan(baseInput());
    for (const day of plan.days) {
      expect(day.plannedMinutes).toBeLessThanOrEqual(day.capacityMinutes);
      expect(day.blocks.reduce((a, b) => a + b.minutes, 0)).toBe(day.plannedMinutes);
    }
    expect(plan.days.find((d) => d.date === '2026-11-01')!.blocks).toEqual([]);
    expect(plan.days.find((d) => d.date === '2026-10-26')!.capacityMinutes).toBe(81);
  });

  it('beachtet Voraussetzungen: Haut vor Dekubitusprophylaxe, Pflegeprozess vor SMART', () => {
    const plan = buildPlan(baseInput());
    expect(studyDates(plan, 'haut').at(-1)! <= studyDates(plan, 'dekubitus')[0]!).toBe(true);
    expect(studyDates(plan, 'pflegeprozess').at(-1)! <= studyDates(plan, 'smart')[0]!).toBe(true);
  });

  it('plant nichts am oder nach dem Prüfungstag eines Themas', () => {
    const plan = buildPlan(baseInput());
    for (const b of blocksOf(plan)) {
      const exam = b.examId === examA.id ? examA : null;
      if (exam) expect(b.date < exam.date).toBe(true);
    }
    expect(plan.days.at(-1)!.date).toBe('2026-11-26');
  });

  it('verteilt Lernen: höchstens zwei Erarbeitungsblöcke pro Thema und Tag', () => {
    const plan = buildPlan(baseInput());
    for (const day of plan.days) {
      const counts = new Map<string, number>();
      for (const b of day.blocks.filter((b) => b.kind === 'erarbeiten'))
        counts.set(b.topicId, (counts.get(b.topicId) ?? 0) + 1);
      for (const c of counts.values()) expect(c).toBeLessThanOrEqual(2);
    }
  });

  it('erzeugt beim Teilen keine Kleinstblöcke', () => {
    const plan = buildPlan(baseInput());
    for (const b of blocksOf(plan)) expect(b.minutes).toBeGreaterThanOrEqual(resolveSettings({}).minBlockMinutes);
  });

  it('weist Pausen zwischen den Blöcken aus', () => {
    const plan = buildPlan(baseInput());
    const day = plan.days.find((d) => d.blocks.length >= 2)!;
    expect(day.pauseMinutes).toBe((day.blocks.length - 1) * resolveSettings({}).breakMinutes);
  });
});

describe('Wiederholungen im Plan', () => {
  it('plant nach der Erarbeitung eine erste Abfrage und vor der Prüfung eine letzte', () => {
    const plan = buildPlan(baseInput());
    const lastStudy = studyDates(plan, 'haut').at(-1)!;
    const reviews = blocksOf(plan).filter((b) => b.topicId === 'haut' && b.kind !== 'erarbeiten');
    expect(reviews.length).toBeGreaterThanOrEqual(2);
    expect(reviews[0]!.date > lastStudy).toBe(true);
    expect(reviews[0]!.label).toMatch(/Erste Abfrage/);
    expect(reviews.at(-1)!.kind).toBe('pruefungsvorbereitung');
    expect(reviews.at(-1)!.date).toBe('2026-11-12');
  });

  it('bereits gelernte, aber ungeprüfte Themen werden sofort abgefragt', () => {
    const plan = buildPlan(
      baseInput({ studyLogs: [{ topicId: 'haut', date: '2026-10-20', minutes: 90 }] }),
    );
    expect(studyDates(plan, 'haut')).toEqual([]);
    const first = plan.days[0]!.blocks.find((b) => b.topicId === 'haut');
    expect(first?.kind).toBe('wiederholen');
  });

  it('Wiederholungsabstände wachsen bei planmäßigem Erfolg', () => {
    const plan = buildPlan(baseInput());
    const dates = blocksOf(plan)
      .filter((b) => b.topicId === 'sgb' && b.kind === 'wiederholen')
      .map((b) => b.date);
    const gaps = dates.slice(1).map((d, i) => (Date.parse(d) - Date.parse(dates[i]!)) / 86_400_000);
    for (let i = 1; i < gaps.length; i++) expect(gaps[i]!).toBeGreaterThanOrEqual(gaps[i - 1]!);
  });
});

describe('Priorisierung und Zeitmangel', () => {
  it('meldet Zeitmangel mit fehlenden Minuten statt Stoff stillschweigend zu streichen', () => {
    const plan = buildPlan(baseInput({ availability: { minutesByWeekday: [0, 20, 20, 20, 20, 20, 0] } }));
    const warning = plan.warnings.find((w) => w.kind === 'zeitmangel' && w.examId === examA.id);
    expect(warning).toBeDefined();
    const missing = plan.unscheduled.filter((u) => u.examId === examA.id).reduce((a, u) => a + u.minutes, 0);
    expect(warning!.minutes).toBe(missing);
    expect(missing).toBeGreaterThan(0);
  });

  it('bevorzugt bei knapper Zeit die frühere Prüfung', () => {
    const plan = buildPlan(baseInput());
    const firstWeek = blocksOf(plan).filter((b) => b.kind === 'erarbeiten' && b.date < '2026-11-02');
    const pflege = firstWeek.filter((b) => b.examId === examA.id).reduce((a, b) => a + b.minutes, 0);
    const recht = firstWeek.filter((b) => b.examId !== examA.id).reduce((a, b) => a + b.minutes, 0);
    expect(pflege).toBeGreaterThan(recht);
  });

  it('erkennt zirkuläre Voraussetzungen, ohne zu blockieren', () => {
    const cyclic = topics.map((t) => (t.id === 'haut' ? { ...t, prerequisites: ['dekubitus'] } : t));
    const plan = buildPlan(baseInput({ topics: cyclic }));
    expect(plan.warnings.some((w) => w.kind === 'zyklus')).toBe(true);
    expect(plan.unscheduled).toEqual([]);
  });

  it('meldet unbekannte Themen einer Prüfung', () => {
    const plan = buildPlan(baseInput({ exams: [{ ...examA, topicIds: [...examA.topicIds, 'gibtsnicht'] }] }));
    expect(plan.warnings.some((w) => w.kind === 'unbekanntes_thema')).toBe(true);
  });

  it('vergangene Prüfungen erzeugen keinen Plan', () => {
    const plan = buildPlan(baseInput({ today: '2026-12-01' }));
    expect(plan.days).toEqual([]);
  });

  it('liefert begründete Prioritäten', () => {
    const plan = buildPlan(baseInput());
    expect(plan.priorities['haut']!.reasons.join(' ')).toMatch(/Klausur Pflege/);
    const sgb = topics.find((t) => t.id === 'sgb')!;
    const progress = plan.progress['sgb']!;
    const settings = resolveSettings({});
    const soon = topicPriority(sgb, progress, examA, '2026-10-26', settings);
    const later = topicPriority(sgb, progress, examB, '2026-10-26', settings);
    const relevant = topicPriority(sgb, progress, examB, '2026-10-26', settings, 'hoch');
    expect(soon.score).toBeGreaterThan(later.score);
    expect(relevant.score).toBeGreaterThan(later.score);
    expect(relevant.reasons.join(' ')).toMatch(/prüfungsrelevant/);
  });
});
