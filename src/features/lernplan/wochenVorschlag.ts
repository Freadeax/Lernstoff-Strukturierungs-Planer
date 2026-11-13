// „Woche planen“: schlägt Themen aus dem Themenpool für die Spalte „Diese Woche“ vor.
// Rein: bekommt Themen mit Board-Spalte und Wissensstand, kommende Prüfungen und die Lernzeit der nächsten 7 Tage.
// Regeln (in dieser Reihenfolge):
//  1. Nur Themen aus dem Pool, die nicht sicher sind.
//  2. Themen einer kommenden Prüfung zuerst, die nächste Prüfung vor der späteren.
//  3. Themen, deren Voraussetzungen erarbeitet sind („bereit“), vor solchen mit offenen Voraussetzungen.
//  4. Unsichere Themen (schon einmal abgefragt, aber wackelig) vor ganz neuen, weil sie weniger Zeit brauchen.
//  5. Es kommt nur so viel in die Woche, wie in die freie Lernzeit passt (abzüglich dessen, was schon in
//     „Diese Woche“ und „In Arbeit“ liegt), höchstens MAX_VORSCHLAEGE.

import type { BoardColumn } from '../../core/board';
import type { Exam, ID, MasteryStatus } from '../../core/types';
import { daysBetween, type ISODate } from './dates';

export const MAX_VORSCHLAEGE = 8;
/** Für Themen ohne Zeitangabe. */
export const STANDARD_MINUTEN = 45;

export interface WochenThema {
  id: ID;
  name: string;
  column: BoardColumn;
  wissen?: MasteryStatus;
  /** Noch nötige Erarbeitungszeit (Minuten). */
  restMinuten?: number;
  prerequisites: ID[];
}

export interface Vorschlag { id: ID; name: string; minuten: number; grund: string }

export interface WochenVorschlag {
  vorschlaege: Vorschlag[];
  /** Freie Lernzeit der nächsten 7 Tage. */
  kapazitaet: number;
  /** Davon schon belegt durch „Diese Woche“ und „In Arbeit“. */
  belegt: number;
  hinweis?: string;
}

const erledigtFuerVoraussetzung = (t?: WochenThema) =>
  !!t && (t.column === 'erarbeitet' || t.wissen === 'unsicher' || t.wissen === 'sicher');

export function wochenVorschlag(themen: WochenThema[], exams: Exam[], heute: ISODate, kapazitaet: number): WochenVorschlag {
  const byId = new Map(themen.map((t) => [t.id, t]));
  const minuten = (t: WochenThema) => Math.max(15, t.restMinuten ?? STANDARD_MINUTEN);
  const belegt = themen.filter((t) => t.column === 'woche' || t.column === 'arbeit').reduce((s, t) => s + (t.wissen === 'sicher' ? 0 : minuten(t)), 0);
  const frei = kapazitaet - belegt;

  const kommend = exams.filter((e) => e.date >= heute).sort((a, b) => (a.date < b.date ? -1 : 1));
  const naechstePruefung = (id: ID) => kommend.find((e) => e.topicIds.includes(id));

  const kandidaten = themen
    .filter((t) => t.column === 'pool' && t.wissen !== 'sicher')
    .map((t) => {
      const exam = naechstePruefung(t.id);
      const offen = t.prerequisites.filter((p) => byId.has(p) && !erledigtFuerVoraussetzung(byId.get(p)));
      const tage = exam ? daysBetween(heute, exam.date) : undefined;
      const teile: string[] = [];
      if (exam) teile.push(`für „${exam.name}“ ${tage === 0 ? 'heute' : tage === 1 ? 'morgen' : `in ${tage} Tagen`}`);
      if (t.wissen === 'unsicher') teile.push('schon abgefragt, aber noch unsicher');
      else if (t.prerequisites.length && !offen.length) teile.push('Voraussetzungen erarbeitet');
      if (offen.length) teile.push(`erst ${offen.map((p) => byId.get(p)!.name).slice(0, 2).join(', ')} erarbeiten`);
      return { t, exam, tage, offen: offen.length, grund: teile.join(', ') || 'noch nicht erarbeitet' };
    })
    .sort((a, b) =>
      (a.exam ? 0 : 1) - (b.exam ? 0 : 1)
      || (a.tage ?? 1e9) - (b.tage ?? 1e9)
      || (a.offen ? 1 : 0) - (b.offen ? 1 : 0)
      || (a.t.wissen === 'unsicher' ? 0 : 1) - (b.t.wissen === 'unsicher' ? 0 : 1));

  const vorschlaege: Vorschlag[] = [];
  let summe = 0;
  for (const k of kandidaten) {
    if (vorschlaege.length >= MAX_VORSCHLAEGE) break;
    const m = minuten(k.t);
    // Ein Thema darf die Woche allein füllen, wenn noch gar nichts vorgeschlagen ist (große Themen sonst nie).
    if (summe + m > frei && vorschlaege.length) continue;
    if (frei <= 0) break;
    vorschlaege.push({ id: k.t.id, name: k.t.name, minuten: m, grund: k.grund });
    summe += m;
  }

  let hinweis: string | undefined;
  if (kapazitaet <= 0) hinweis = 'Für die nächsten 7 Tage ist keine Lernzeit eingetragen. Trag zuerst deine Lernzeit im Lernplan ein.';
  else if (frei <= 0) hinweis = '„Diese Woche“ und „In Arbeit“ füllen deine Lernzeit schon. Schließ erst etwas ab, bevor du Neues dazunimmst.';
  else if (!kandidaten.length) hinweis = 'Im Themenpool liegt nichts mehr, das noch nicht sicher ist.';
  return { vorschlaege, kapazitaet, belegt, hinweis };
}
