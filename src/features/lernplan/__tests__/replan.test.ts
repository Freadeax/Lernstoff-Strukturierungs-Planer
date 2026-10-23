import { describe, expect, it } from 'vitest';
import { applyEvent, buildPlan, comparePlans, replan } from '..';
import { baseInput, examA } from './fixtures';

describe('Neuplanung', () => {
  it('bei Krankheit wird an den Ausfalltagen nichts geplant und der Stoff verschoben', () => {
    const input = baseInput();
    const before = buildPlan(input);
    const { plan } = replan(input, [{ type: 'ausfall', from: '2026-10-26', to: '2026-10-30', reason: 'Krankheit' }]);
    for (const d of plan.days.filter((d) => d.date <= '2026-10-30')) expect(d.blocks).toEqual([]);
    const diff = comparePlans(before, plan);
    expect(diff.shifted.length).toBeGreaterThan(0);
    expect(diff.shifted.every((s) => !s.before || !s.after || s.after >= s.before)).toBe(true);
  });

  it('erledigte Erarbeitung verschwindet aus dem Plan, verpasste Blöcke werden neu verteilt', () => {
    const input = baseInput();
    const first = buildPlan(input);
    const done = first.days[0]!.blocks.filter((b) => b.kind === 'erarbeiten');
    // Tag 1 erledigt, Tag 2 verpasst: am Tag 3 neu planen.
    const next = buildPlan({
      ...input,
      today: '2026-10-28',
      studyLogs: done.map((b) => ({ topicId: b.topicId, date: '2026-10-26', minutes: b.minutes })),
    });
    const studied = next.days.flatMap((d) => d.blocks).filter((b) => b.kind === 'erarbeiten');
    const total = studied.reduce((a, b) => a + b.minutes, 0);
    const doneMinutes = done.reduce((a, b) => a + b.minutes, 0);
    expect(total).toBe(465 - doneMinutes);
    expect(next.days[0]!.date).toBe('2026-10-28');
  });

  it('weniger Zeit an einem Tag wird respektiert', () => {
    const input = applyEvent(baseInput(), { type: 'zeit_aendern', date: '2026-10-27', minutes: 30 });
    const plan = buildPlan(input);
    expect(plan.days.find((d) => d.date === '2026-10-27')!.plannedMinutes).toBeLessThanOrEqual(27);
  });

  it('neue, frühere Prüfung wird eingeplant und verdrängt spätere Themen', () => {
    const input = baseInput();
    const { plan } = replan(input, [
      {
        type: 'neue_pruefung',
        exam: { id: 'test-recht', name: 'Kurztest Recht', date: '2026-10-31', subjectIds: ['recht'], topicIds: ['sgb'] },
      },
    ]);
    const sgb = plan.days.flatMap((d) => d.blocks.map((b) => ({ ...b, date: d.date }))).filter((b) => b.topicId === 'sgb' && b.kind === 'erarbeiten');
    expect(sgb.every((b) => b.date < '2026-10-31')).toBe(true);
    expect(sgb.reduce((a, b) => a + b.minutes, 0)).toBe(120);
  });

  it('verschobene Prüfung ändert den Plan', () => {
    const { input } = replan(baseInput(), [{ type: 'pruefung_verschoben', examId: examA.id, date: '2026-11-20' }]);
    expect(input.exams.find((e) => e.id === examA.id)!.date).toBe('2026-11-20');
    expect(buildPlan(input).warnings.filter((w) => w.kind === 'zeitmangel')).toEqual([]);
  });

  it('Eingaben werden nicht verändert (reine Funktionen)', () => {
    const input = baseInput({ availability: { minutesByWeekday: [0, 90, 90, 90, 90, 90, 120], exceptions: {} } });
    const snapshot = JSON.stringify(input);
    replan(input, [{ type: 'ausfall', from: '2026-10-26', to: '2026-10-27' }]);
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});
