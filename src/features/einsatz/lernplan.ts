// Hält die Lernplan-„Prüfungen“ der Einsätze aktuell (siehe einsatz.ts). Läuft beim Öffnen der
// Einsatzseite, nach jeder Änderung und still im Hinweis auf Heute; schreibt nur, wenn sich etwas ändert.

import { db } from '../../core/db';
import type { CatalogModule } from '../../modules/catalog-types';
import { deleteExam, heute, saveExam } from '../lernplan/store';
import { abgleich, EINSATZ_GEWICHT, type Einsatz } from './einsatz';

export async function synchronisiere(liste: Einsatz[], modul: Pick<CatalogModule, 'topics'>, tag = heute()): Promise<{ gespeichert: number; geloescht: number }> {
  const fach = new Map(modul.topics.map((t) => [t.id, t.subjectId]));
  const { speichern, loeschen } = abgleich(liste, await db.exams.toArray(), tag, (id) => fach.get(id));
  for (const exam of speichern) await saveExam(exam, EINSATZ_GEWICHT);
  for (const exam of loeschen) await deleteExam(exam);
  return { gespeichert: speichern.length, geloescht: loeschen.length };
}
