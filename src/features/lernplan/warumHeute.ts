// „Warum heute?“: ein bis zwei Sätze zu jedem Block im Tagesplan, damit Neue verstehen, warum der Plan
// genau dieses Thema heute vorschlägt. Rein und nur aus Fakten, die der Plan ohnehin hat (Block, Fortschritt, Prüfung).

import type { Exam } from '../../core/types';
import { daysBetween, type ISODate } from './dates';
import type { TopicProgress } from './progress';
import type { PlanBlock } from './scheduler';

const tageText = (n: number) => (n === 0 ? 'heute' : n === 1 ? 'morgen' : `in ${n} Tagen`);
const min = (m: number) => (m < 60 ? `${m} Min.` : `${Math.floor(m / 60)} Std.${m % 60 ? ` ${m % 60} Min.` : ''}`);

export function warumHeute(block: PlanBlock, prog: TopicProgress | undefined, exam: Exam | undefined, heute: ISODate): string {
  const bis = exam ? daysBetween(heute, exam.date) : undefined;
  const pruefung = exam && bis !== undefined && bis >= 0 ? `„${exam.name}“ ist ${tageText(bis)}` : undefined;

  if (block.kind === 'pruefungsvorbereitung') {
    return `${pruefung ?? 'Die Prüfung steht an'}. Eine letzte kurze Abfrage holt das Thema frisch ins Gedächtnis.`;
  }

  if (block.kind === 'erarbeiten') {
    const rest = prog?.remainingStudyMinutes;
    const teil = block.parts && block.parts > 1 ? ` Der Plan teilt es auf ${block.parts} Einheiten auf, damit keine zu lang wird.` : '';
    const anfang = prog && prog.studiedMinutes > 0
      ? `Du hast schon ${min(prog.studiedMinutes)} daran gelernt${rest ? `, etwa ${min(rest)} fehlen noch` : ''}.`
      : 'Du hast das Thema noch nicht erarbeitet.';
    return `${anfang}${pruefung ? ` ${pruefung}, also kommt es jetzt dran.` : ''}${teil}`;
  }

  // Abfrage oder Wiederholung
  if (!prog || prog.testCount === 0) {
    return 'Du hast das Thema erarbeitet, aber noch nie abgefragt. Erst eine Abfrage zeigt, ob es sitzt. Am besten kurz nach dem Lernen.';
  }
  const abruf = prog.retrievabilityToday;
  const vergessen = abruf !== undefined
    ? `Laut deinen bisherigen Abfragen erinnerst du dich heute nur noch mit etwa ${Math.round(abruf * 100)} % Wahrscheinlichkeit daran.`
    : 'Seit der letzten Abfrage ist so viel Zeit vergangen, dass das Wissen zu verblassen beginnt.';
  const nutzen = prog.status === 'sicher'
    ? 'Eine Wiederholung jetzt hält es sicher, danach wird der Abstand länger.'
    : 'Wiederholst du jetzt, bleibt es länger hängen als beim ersten Mal.';
  return `${vergessen} ${nutzen}`;
}
