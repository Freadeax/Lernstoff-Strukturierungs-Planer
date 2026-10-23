// Neuplanung: Ereignisse (Krankheit, weniger Zeit, neue Prüfung) verändern nur die Eingaben.
// Der neue Plan entsteht durch buildPlan; comparePlans erklärt, was sich verschoben hat.

import { eachDay, addDays, type ISODate } from './dates';
import { buildPlan, type StudyPlan } from './scheduler';
import type { Availability, Exam, ID, PlannerInput } from './types';

export type PlanEvent =
  | { type: 'ausfall'; from: ISODate; to: ISODate; reason?: string } // z. B. Krankheit, inklusive `to`
  | { type: 'zeit_aendern'; date: ISODate; minutes: number }
  | { type: 'neue_pruefung'; exam: Exam }
  | { type: 'pruefung_verschoben'; examId: ID; date: ISODate };

export function applyEvent(input: PlannerInput, event: PlanEvent): PlannerInput {
  switch (event.type) {
    case 'ausfall': {
      const exceptions = { ...input.availability.exceptions };
      for (const day of eachDay(event.from, addDays(event.to, 1))) exceptions[day] = 0;
      return { ...input, availability: { ...input.availability, exceptions } };
    }
    case 'zeit_aendern': {
      const availability: Availability = {
        ...input.availability,
        exceptions: { ...input.availability.exceptions, [event.date]: event.minutes },
      };
      return { ...input, availability };
    }
    case 'neue_pruefung':
      return { ...input, exams: [...input.exams.filter((e) => e.id !== event.exam.id), event.exam] };
    case 'pruefung_verschoben':
      return {
        ...input,
        exams: input.exams.map((e) => (e.id === event.examId ? { ...e, date: event.date } : e)),
      };
  }
}

export function replan(input: PlannerInput, events: PlanEvent[]): { input: PlannerInput; plan: StudyPlan } {
  const next = events.reduce(applyEvent, input);
  return { input: next, plan: buildPlan(next) };
}

export interface TopicShift {
  topicId: ID;
  /** Letzter Erarbeitungstag (Abschluss der Erarbeitung) im alten bzw. neuen Plan. */
  before?: ISODate;
  after?: ISODate;
}

export interface PlanDiff {
  shifted: TopicShift[];
  newlyUnscheduled: ID[];
  resolvedUnscheduled: ID[];
}

function finishDates(plan: StudyPlan): Map<ID, ISODate> {
  const result = new Map<ID, ISODate>();
  for (const day of plan.days)
    for (const block of day.blocks) if (block.kind === 'erarbeiten') result.set(block.topicId, day.date);
  return result;
}

/** Welche Themen werden später/früher fertig, welche passen nicht mehr in die Zeit? */
export function comparePlans(before: StudyPlan, after: StudyPlan): PlanDiff {
  const a = finishDates(before);
  const b = finishDates(after);
  const shifted: TopicShift[] = [];
  for (const id of new Set([...a.keys(), ...b.keys()])) {
    if (a.get(id) !== b.get(id)) shifted.push({ topicId: id, before: a.get(id), after: b.get(id) });
  }
  const oldUnscheduled = new Set(before.unscheduled.map((u) => u.topicId));
  const newUnscheduled = new Set(after.unscheduled.map((u) => u.topicId));
  return {
    shifted,
    newlyUnscheduled: [...newUnscheduled].filter((id) => !oldUnscheduled.has(id)),
    resolvedUnscheduled: [...oldUnscheduled].filter((id) => !newUnscheduled.has(id)),
  };
}
