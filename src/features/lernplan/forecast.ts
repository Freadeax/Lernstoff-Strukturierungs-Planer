// Vorsichtige Lernprognose je Prüfung. Bewusst keine Bestehenswahrscheinlichkeit:
// ausgewiesen werden belegter Wissensstand, Datenbasis, Zeitbedarf und konkrete Empfehlungen.

import { daysBetween, eachDay } from './dates';
import { retrievability } from './fsrs';
import { computeAllProgress, type TopicProgress } from './progress';
import { dayCapacity } from './scheduler';
import { resolveSettings, type ID, type MasteryStatus, type PlannerInput } from './types';

export type Confidence = 'niedrig' | 'mittel' | 'hoch';

export interface ExamForecast {
  examId: ID;
  examName: string;
  daysLeft: number;
  topicCount: number;
  byStatus: Record<MasteryStatus, number>;
  /** Anteil der Themen mit mindestens einer echten Abfrage. */
  testedShare: number;
  /**
   * Mittlere erwartete Abrufwahrscheinlichkeit am Prüfungstag, nur über abgefragte Themen,
   * ohne weitere Wiederholungen gerechnet (also eher zu niedrig als zu hoch).
   */
  expectedRecallTested?: number;
  /** Untergrenze über alle Themen: nicht abgefragte Themen zählen mit 0. */
  expectedRecallLowerBound: number;
  requiredMinutes: number;
  availableMinutes: number;
  timeFeasible: boolean;
  confidence: Confidence;
  assessment: string;
  recommendations: string[];
}

export function forecastExams(input: PlannerInput): ExamForecast[] {
  const settings = resolveSettings(input);
  const progress = computeAllProgress(input.topics, input.studyLogs, input.reviewLogs, input.today, settings);
  const names = new Map(input.topics.map((t) => [t.id, t.name]));

  return input.exams
    .filter((e) => e.date > input.today)
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map((exam) => {
      const items = exam.topicIds
        .map((id) => progress.get(id))
        .filter((p): p is TopicProgress => p !== undefined);
      const byStatus: Record<MasteryStatus, number> = { offen: 0, bearbeitet: 0, unsicher: 0, sicher: 0 };
      for (const p of items) byStatus[p.status]++;

      const recallAtExam = (p: TopicProgress) =>
        p.memory ? retrievability(daysBetween(p.memory.lastReview, exam.date), p.memory.stability) : undefined;
      const tested = items.filter((p) => p.memory);
      const recalls = tested.map((p) => recallAtExam(p)!);
      const sum = recalls.reduce((a, b) => a + b, 0);
      const testedShare = items.length ? tested.length / items.length : 0;
      const expectedRecallTested = recalls.length ? sum / recalls.length : undefined;
      const expectedRecallLowerBound = items.length ? sum / items.length : 0;

      const notSure = items.filter((p) => p.status !== 'sicher').length;
      const requiredMinutes =
        items.reduce((a, p) => a + p.remainingStudyMinutes, 0) + notSure * settings.reviewMinutes * 2;
      const availableMinutes = eachDay(input.today, exam.date).reduce(
        (a, d) => a + dayCapacity(input.availability, d, settings),
        0,
      );
      const timeFeasible = requiredMinutes <= availableMinutes;

      const avgTests = tested.length ? tested.reduce((a, p) => a + p.testCount, 0) / tested.length : 0;
      const confidence: Confidence =
        testedShare >= 0.8 && avgTests >= 3 ? 'hoch' : testedShare >= 0.5 ? 'mittel' : 'niedrig';

      const recommendations: string[] = [];
      if (!timeFeasible)
        recommendations.push(
          `Zeitbedarf (ca. ${requiredMinutes} Min.) übersteigt die verfügbare Lernzeit (ca. ${availableMinutes} Min.). Lernzeit erhöhen oder Themen mit hoher Prüfungsrelevanz vorziehen.`,
        );
      const open = items.filter((p) => p.status === 'offen');
      if (open.length)
        recommendations.push(`Noch nicht begonnen: ${open.map((p) => names.get(p.topicId)).join(', ')}.`);
      const untested = items.filter((p) => p.status === 'bearbeitet');
      if (untested.length)
        recommendations.push(
          `Bearbeitet, aber noch nie abgefragt: ${untested.map((p) => names.get(p.topicId)).join(', ')}. Mit Quiz oder Karteikarten prüfen.`,
        );
      const weak = items
        .filter((p) => p.status === 'unsicher')
        .sort((a, b) => (recallAtExam(a) ?? 0) - (recallAtExam(b) ?? 0))
        .slice(0, 5);
      if (weak.length)
        recommendations.push(`Gezielt wiederholen (am unsichersten zuerst): ${weak.map((p) => names.get(p.topicId)).join(', ')}.`);

      let assessment: string;
      if (testedShare < 0.5) {
        assessment =
          'Noch zu wenige Testergebnisse für eine belastbare Einschätzung. Gelesener Stoff wird nicht als Wissen gewertet.';
      } else if (!timeFeasible) {
        assessment = 'Der Stoff passt nach aktueller Planung nicht vollständig in die verbleibende Zeit.';
      } else if (byStatus.sicher / Math.max(1, items.length) >= 0.8) {
        assessment = 'Gute Ausgangslage: Die meisten Themen wurden mehrfach erfolgreich abgefragt.';
      } else {
        assessment =
          'Auf gutem Weg, aber mehrere Themen sind noch unsicher oder ungeprüft. Der Plan sieht dafür Wiederholungen vor.';
      }

      return {
        examId: exam.id,
        examName: exam.name,
        daysLeft: daysBetween(input.today, exam.date),
        topicCount: items.length,
        byStatus,
        testedShare,
        expectedRecallTested,
        expectedRecallLowerBound,
        requiredMinutes,
        availableMinutes,
        timeFeasible,
        confidence,
        assessment,
        recommendations,
      };
    });
}
