// Prüfungstermin je CE: eine normale Prüfung im Lernplan mit fester ID, damit die CE-Seite sie
// wiederfindet. Der Lernplan behandelt sie wie jede andere Prüfung (Wochenplan, Prognose).

import type { Exam, ID } from '../../core/types';
import type { CatalogTopic } from '../../modules/catalog-types';
import type { Ce } from './modell';

const PRAEFIX = 'ce-pruefung:';

export const cePruefungsId = (ceId: ID) => `${PRAEFIX}${ceId}`;
export const istCePruefung = (examId: ID) => examId.startsWith(PRAEFIX);
export const ceVonPruefung = (examId: ID) => (istCePruefung(examId) ? examId.slice(PRAEFIX.length) : undefined);

export function findeCePruefung(exams: Exam[], ceId: ID): Exam | undefined {
  return exams.find((e) => e.id === cePruefungsId(ceId));
}

/** Prüfung mit allen Themen der CE. Name und Themen einer vorhandenen Prüfung bleiben, wenn nicht anders gewünscht. */
export function baueCePruefung(ce: Ce, themen: CatalogTopic[], datum: string, alt?: Exam, themenNeu = !alt): Exam {
  const topicIds = themenNeu || !alt ? themen.map((t) => t.id) : alt.topicIds;
  const fach = new Map(themen.map((t) => [t.id, t.subjectId]));
  const subjectIds = themenNeu || !alt ? [...new Set(topicIds.map((id) => fach.get(id)).filter((x): x is string => !!x))] : alt.subjectIds;
  return { id: cePruefungsId(ce.id), name: alt?.name ?? `${ce.code} ${ce.name}`, date: datum, topicIds, subjectIds };
}

/** Unterschied zwischen den Themen der Prüfung und den aktuellen Themen der CE (z. B. nach neuem Skript). */
export function themenAbgleich(exam: Exam, themen: ID[]): { fehlen: ID[]; zuviel: ID[] } {
  const inExam = new Set(exam.topicIds);
  const inCe = new Set(themen);
  return { fehlen: themen.filter((id) => !inExam.has(id)), zuviel: exam.topicIds.filter((id) => !inCe.has(id)) };
}
