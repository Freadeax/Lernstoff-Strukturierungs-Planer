import type { Availability, Exam, PlannerInput, Topic } from '..';

export const topics: Topic[] = [
  { id: 'haut', subjectId: 'anatomie', name: 'Anatomie der Haut', prerequisites: [], difficulty: 2, estimatedMinutes: 90 },
  { id: 'dekubitus', subjectId: 'pflege', name: 'Dekubitusprophylaxe', prerequisites: ['haut'], difficulty: 3, estimatedMinutes: 120 },
  { id: 'pflegeprozess', subjectId: 'pflege', name: 'Pflegeprozess', prerequisites: [], difficulty: 3, estimatedMinutes: 90 },
  { id: 'smart', subjectId: 'pflege', name: 'Pflegeziele nach SMART', prerequisites: ['pflegeprozess'], difficulty: 2, estimatedMinutes: 45 },
  { id: 'sgb', subjectId: 'recht', name: 'SGB XI und Pflegegrade', prerequisites: [], difficulty: 4, estimatedMinutes: 120 },
];

export const examA: Exam = {
  id: 'klausur-pflege',
  name: 'Klausur Pflege',
  date: '2026-11-13',
  subjectIds: ['pflege', 'anatomie'],
  topicIds: ['haut', 'dekubitus', 'pflegeprozess', 'smart'],
};

export const examB: Exam = {
  id: 'klausur-recht',
  name: 'Klausur Recht',
  date: '2026-11-27',
  subjectIds: ['recht'],
  topicIds: ['sgb'],
};

/** Mo–Fr 90 Minuten, Sa 120, So frei. */
export const availability: Availability = { minutesByWeekday: [0, 90, 90, 90, 90, 90, 120] };

export function baseInput(overrides: Partial<PlannerInput> = {}): PlannerInput {
  return {
    today: '2026-10-26', // Montag
    topics,
    exams: [examA, examB],
    studyLogs: [],
    reviewLogs: [],
    availability,
    ...overrides,
  };
}
