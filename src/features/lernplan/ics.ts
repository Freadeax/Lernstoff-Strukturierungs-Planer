// Lernplan als Kalenderdatei (iCalendar, RFC 5545) für Apple-Kalender, Google oder Outlook.
// Ein ganztägiger Termin je Lerntag mit den Blöcken in der Beschreibung, dazu die Prüfungen.
// Ohne Lernbeginn ganztägig; mit Lernbeginn je Tag als Termin mit Uhrzeit in Europe/Berlin (Sommerzeit über VTIMEZONE).
// Neuimport: gleiche UIDs mit steigender SEQUENCE, weggefallene künftige Lerntage werden abgesagt.

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
  /** Zeitpunkt der Erzeugung (DTSTAMP und SEQUENCE), Standard: jetzt. */
  jetzt?: Date;
  /** Nur Tage bis einschließlich dieses Datums. */
  bis?: ISODate;
  /**
   * Lernbeginn je Tag als „HH:MM“ (Ortszeit Europe/Berlin). Fehlt er für einen Tag, wird der Lerntag ganztägig
   * eingetragen. Ende = Beginn + geplante Lernzeit + Pausen. Sommer- und Winterzeit regelt die Zeitzone im Kalender.
   */
  beginn?: (day: ISODate) => string | undefined;
  /** UIDs aus einem früheren Export. Was davon nicht mehr im Plan steht, wird beim Neuimport als abgesagt gemeldet. */
  frueher?: string[];
}

/** Zeitzone Europe/Berlin mit den EU-Regeln (letzter Sonntag im März bzw. Oktober), damit Kalender DST richtig rechnen. */
export const VTIMEZONE_BERLIN = [
  'BEGIN:VTIMEZONE', 'TZID:Europe/Berlin',
  'BEGIN:DAYLIGHT', 'TZOFFSETFROM:+0100', 'TZOFFSETTO:+0200', 'TZNAME:CEST', 'DTSTART:19700329T020000', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU', 'END:DAYLIGHT',
  'BEGIN:STANDARD', 'TZOFFSETFROM:+0200', 'TZOFFSETTO:+0100', 'TZNAME:CET', 'DTSTART:19701025T030000', 'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU', 'END:STANDARD',
  'END:VTIMEZONE',
];

const UHRZEIT = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Lokale Start- und Endzeit; das Ende darf über Mitternacht in den nächsten Tag laufen. */
export function zeitfenster(day: ISODate, beginn: string, minuten: number): { start: string; ende: string } | undefined {
  const m = UHRZEIT.exec(beginn);
  if (!m) return undefined;
  const startMin = Number(m[1]) * 60 + Number(m[2]);
  const endMin = startMin + Math.max(1, Math.round(minuten));
  const endTag = addDays(day, Math.floor(endMin / 1440));
  const hhmm = (x: number) => `${String(Math.floor((x % 1440) / 60)).padStart(2, '0')}${String(x % 60).padStart(2, '0')}00`;
  return { start: `${datum(day)}T${hhmm(startMin)}`, ende: `${datum(endTag)}T${hhmm(endMin)}` };
}

export const uidFuer = (art: 'plan' | 'pruefung', id: string) => `${art}-${id}@lernstoff-planer`;

/** Erzeugt die Kalenderdatei und nennt die enthaltenen UIDs (für den nächsten Export merken). */
export function planAlsIcsMitUids(plan: StudyPlan, exams: Exam[], name: (id: ID) => string, opt: IcsOptionen = {}): { ics: string; uids: string[] } {
  const jetzt = opt.jetzt ?? new Date();
  const stamp = jetzt.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  // Steigt mit jedem Export, damit Kalender eine neue Fassung desselben Termins übernehmen.
  const sequence = Math.max(0, Math.floor(jetzt.getTime() / 60000) - 29_000_000);
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Lernstoff-Planer//Lernplan//DE', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Lernplan', 'X-WR-TIMEZONE:Europe/Berlin'];
  const uids: string[] = [];
  let mitZeit = false;
  const events: string[][] = [];
  const event = (uid: string, day: ISODate, summary: string, description: string, fenster?: { start: string; ende: string }, abgesagt = false) => {
    uids.push(uid);
    if (fenster) mitZeit = true;
    events.push(['BEGIN:VEVENT', `UID:${uid}`, `DTSTAMP:${stamp}`, `SEQUENCE:${sequence}`,
      ...(fenster ? [`DTSTART;TZID=Europe/Berlin:${fenster.start}`, `DTEND;TZID=Europe/Berlin:${fenster.ende}`]
        : [`DTSTART;VALUE=DATE:${datum(day)}`, `DTEND;VALUE=DATE:${datum(addDays(day, 1))}`]),
      `SUMMARY:${icsText(summary)}`, `DESCRIPTION:${icsText(description)}`,
      ...(abgesagt ? ['STATUS:CANCELLED'] : []), fenster && !abgesagt ? 'TRANSP:OPAQUE' : 'TRANSP:TRANSPARENT', 'END:VEVENT']);
  };
  for (const d of plan.days) {
    if (!d.blocks.length || (opt.bis && d.date > opt.bis)) continue;
    const text = d.blocks.map((b) => `• ${ART[b.kind]}: ${name(b.topicId)} (${minutenText(b.minutes)})`).join('\n');
    const b = opt.beginn?.(d.date);
    const fenster = b ? zeitfenster(d.date, b, d.plannedMinutes + d.pauseMinutes) : undefined;
    event(uidFuer('plan', d.date), d.date, `Lernplan: ${d.blocks.length === 1 ? '1 Block' : `${d.blocks.length} Blöcke`}, ${minutenText(d.plannedMinutes)}`,
      `${text}${d.pauseMinutes ? `\nDazu ${minutenText(d.pauseMinutes)} Pausen.` : ''}\n\nDer Plan wird in der App täglich neu berechnet. Für den aktuellen Stand neu exportieren, frühere Termine werden dabei ersetzt.`, fenster);
  }
  for (const e of exams) {
    if (e.date < plan.today || (opt.bis && e.date > opt.bis)) continue;
    event(uidFuer('pruefung', e.id), e.date, `Prüfung: ${e.name}`, `${e.topicIds.length} Themen`);
  }
  // Früher exportierte, inzwischen weggefallene Lerntage absagen (nur künftige; Vergangenes bleibt stehen).
  const jetztUids = new Set(uids);
  for (const uid of opt.frueher ?? []) {
    const m = /^plan-(\d{4}-\d{2}-\d{2})@lernstoff-planer$/.exec(uid);
    if (jetztUids.has(uid) || !m || m[1]! < plan.today) continue;
    event(uid, m[1]!, 'Lernplan: entfällt', 'An diesem Tag ist nach dem aktuellen Plan nichts mehr geplant.', undefined, true);
    uids.pop();
  }
  if (mitZeit) lines.push(...VTIMEZONE_BERLIN);
  for (const e of events) lines.push(...e);
  lines.push('END:VCALENDAR');
  return { ics: lines.map(faltZeile).join('\r\n') + '\r\n', uids };
}

export function planAlsIcs(plan: StudyPlan, exams: Exam[], name: (id: ID) => string, opt: IcsOptionen = {}): string {
  return planAlsIcsMitUids(plan, exams, name, opt).ics;
}
