// Lernplan als Kalenderdatei (iCalendar, RFC 5545) für Apple-Kalender, Google oder Outlook.
// Ein ganztägiger Termin je Lerntag mit den Blöcken in der Beschreibung, dazu die Prüfungen.
// Uhrzeiten gibt es bewusst nicht: Der Plan kennt nur Minuten pro Tag, wann gelernt wird, entscheidet man selbst.

import { addDays, type ISODate } from './dates';
import type { PlanBlock, StudyPlan } from './scheduler';
import type { Exam, ID } from './types';

/** Text für ICS maskieren (Backslash, Semikolon, Komma, Zeilenumbruch). */
export function icsText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Zeilen nach 75 Bytes (UTF-8) falten, Folgezeilen beginnen mit einem Leerzeichen. */
export function faltZeile(line: string): string {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const teile: string[] = [];
  let cur = '';
  let bytes = 0;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    const limit = teile.length ? 74 : 75; // Folgezeilen verlieren ein Byte an das Leerzeichen
    if (bytes + n > limit) { teile.push(cur); cur = ''; bytes = 0; }
    cur += ch;
    bytes += n;
  }
  teile.push(cur);
  return teile.join('\r\n ');
}

const datum = (d: ISODate) => d.replace(/-/g, '');

function minutenText(min: number) {
  if (min < 60) return `${min} Min.`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h} Std. ${m} Min.` : `${h} Std.`;
}

const ART: Record<PlanBlock['kind'], string> = { erarbeiten: 'Erarbeiten', wiederholen: 'Wiederholen', pruefungsvorbereitung: 'Letzte Abfrage' };

export interface IcsOptionen {
  /** Zeitpunkt der Erzeugung (DTSTAMP), Standard: jetzt. */
  jetzt?: Date;
  /** Nur Tage bis einschließlich dieses Datums. */
  bis?: ISODate;
}

export function planAlsIcs(plan: StudyPlan, exams: Exam[], name: (id: ID) => string, opt: IcsOptionen = {}): string {
  const stamp = (opt.jetzt ?? new Date()).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Lernstoff-Planer//Lernplan//DE', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Lernplan'];
  const event = (uid: string, day: ISODate, summary: string, description: string) => {
    lines.push('BEGIN:VEVENT', `UID:${uid}@lernstoff-planer`, `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${datum(day)}`, `DTEND;VALUE=DATE:${datum(addDays(day, 1))}`,
      `SUMMARY:${icsText(summary)}`, `DESCRIPTION:${icsText(description)}`, 'TRANSP:TRANSPARENT', 'END:VEVENT');
  };
  for (const d of plan.days) {
    if (!d.blocks.length || (opt.bis && d.date > opt.bis)) continue;
    const text = d.blocks.map((b) => `• ${ART[b.kind]}: ${name(b.topicId)} (${minutenText(b.minutes)})`).join('\n');
    event(`plan-${d.date}`, d.date, `Lernplan: ${d.blocks.length === 1 ? '1 Block' : `${d.blocks.length} Blöcke`}, ${minutenText(d.plannedMinutes)}`,
      `${text}${d.pauseMinutes ? `\nDazu ${minutenText(d.pauseMinutes)} Pausen.` : ''}\n\nDer Plan wird in der App täglich neu berechnet. Für den aktuellen Stand neu exportieren.`);
  }
  for (const e of exams) {
    if (e.date < plan.today || (opt.bis && e.date > opt.bis)) continue;
    event(`pruefung-${e.id}`, e.date, `Prüfung: ${e.name}`, `${e.topicIds.length} Themen`);
  }
  lines.push('END:VCALENDAR');
  return lines.map(faltZeile).join('\r\n') + '\r\n';
}
