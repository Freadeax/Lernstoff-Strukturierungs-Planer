// Dienstplan einlesen und schonend verplanen. Rein und testbar.
// - Kalenderdatei (.ics) aus der Dienstplan-App lokal lesen: Schicht je Tag aus Titel oder Uhrzeit.
// - Kürzelfolge („F F S S N N X X“) ab einem Starttag, für abgetippte oder kopierte Pläne.
// - Schonregeln: nach Nachtdiensten erst ausschlafen, nach Spät- auf Frühdienst (zu kurze Ruhezeit) wenig,
//   ab dem sechsten Arbeitstag in Folge weniger Lernzeit.

import { addDays, type ISODate } from './dates';
import type { SchichtId } from './alltag';

// ---------------------------------------------------------------- Schicht aus Text oder Uhrzeit

// Ganze Wörter, auch mit Umlauten (\b kennt kein ä/ö/ü).
const wort = (w: string) => new RegExp(`(?:^|[^a-zäöüß])(?:${w})(?![a-zäöüß])`, 'i');
const WOERTER: Array<[RegExp, SchichtId]> = [
  [wort('nacht|nd|night|nachtdienst|nachtwache'), 'nacht'],
  [wort('spät|spaet|sd|late|spätdienst|spaetdienst|spätschicht'), 'spaet'],
  [wort('früh|frueh|fd|early|frühdienst|fruehdienst|frühschicht'), 'frueh'],
  [wort('schule|unterricht|theorie|schulblock|seminar|berufsschule|schultag|praxisbegleitung'), 'schule'],
  [wort('frei|urlaub|off|ausgleich|zeitausgleich|wunschfrei|krank|feiertag|fz|frei-tag'), 'frei'],
];

/** Kürzel aus Dienstplänen. X/U/K/- = frei. Groß- und Kleinschreibung egal. */
const KUERZEL: Record<string, SchichtId> = {
  f: 'frueh', fd: 'frueh', f1: 'frueh', f2: 'frueh',
  s: 'spaet', sd: 'spaet', s1: 'spaet', s2: 'spaet', sp: 'spaet',
  n: 'nacht', nd: 'nacht', n1: 'nacht',
  sch: 'schule', bs: 'schule', th: 'schule',
  x: 'frei', '-': 'frei', u: 'frei', ur: 'frei', k: 'frei', fr: 'frei', az: 'frei',
};

/** Schicht aus einem Termintitel; ohne Treffer bei Dienst-Terminen aus der Anfangszeit (Stunde 0–23). */
export function schichtAusTitel(titel: string, stunde?: number): SchichtId | undefined {
  const t = titel.trim();
  const k = KUERZEL[t.toLowerCase()];
  if (k) return k;
  for (const [re, id] of WOERTER) if (re.test(t)) return id;
  // Uhrzeit nur bei Terminen, die nach Dienst aussehen: private Termine (Zahnarzt um 10 Uhr) sind keine Schicht.
  if (stunde === undefined || (t && !/dienst|schicht|arbeit|station|wohnbereich|einsatz/i.test(t))) return undefined;
  if (stunde >= 4 && stunde < 10) return 'frueh';
  if (stunde >= 10 && stunde < 17) return 'spaet';
  if (stunde >= 17 || stunde < 2) return 'nacht';
  return undefined;
}

// ---------------------------------------------------------------- Kürzelfolge

export interface KuerzelErgebnis { tage: Record<ISODate, SchichtId>; unbekannt: string[] }

/** „F F S S N N X X“ (auch mit Komma, Semikolon, Zeilen) ab `start`, ein Kürzel je Tag. Höchstens 62 Tage. */
export function kuerzelFolge(text: string, start: ISODate): KuerzelErgebnis {
  const tage: Record<ISODate, SchichtId> = {};
  const unbekannt: string[] = [];
  const teile = text.split(/[\s,;|/]+/).filter(Boolean).slice(0, 62);
  teile.forEach((roh, i) => {
    const id = schichtAusTitel(roh);
    if (id) tage[addDays(start, i)] = id;
    else unbekannt.push(roh);
  });
  return { tage, unbekannt };
}

// ---------------------------------------------------------------- Kalenderdatei

export interface IcsErgebnis { tage: Record<ISODate, SchichtId>; termine: number; erkannt: number; unbekannt: string[] }

const MAX_ICS = 2_000_000;

function entfalte(text: string): string[] {
  return text.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '').split(/\r?\n/);
}

function icsUnmask(s: string): string {
  return s.replace(/\\n/gi, ' ').replace(/\\([,;\\])/g, '$1');
}

/** Ortszeit Europe/Berlin aus einer UTC-Zeit. */
function berlin(utc: Date): { tag: ISODate; stunde: number } {
  const teile = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' }).formatToParts(utc);
  const g = (t: string) => teile.find((p) => p.type === t)?.value ?? '00';
  return { tag: `${g('year')}-${g('month')}-${g('day')}`, stunde: Number(g('hour')) };
}

interface Zeitpunkt { tag: ISODate; stunde?: number }

/** DTSTART/DTEND lesen: ganztägig (VALUE=DATE), Ortszeit (TZID oder ohne) oder UTC (Z). */
function zeitpunkt(zeile: string): Zeitpunkt | undefined {
  const wert = zeile.slice(zeile.indexOf(':') + 1).trim();
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec(wert);
  if (!m) return undefined;
  const tag = `${m[1]}-${m[2]}-${m[3]}`;
  if (!m[4]) return { tag };
  if (m[7]) return berlin(new Date(Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!, +m[4], +m[5]!)));
  return { tag, stunde: Number(m[4]) };
}

/**
 * Schichten aus einer Kalenderdatei. Ganztägige Mehrtagestermine (Urlaub) gelten für jeden Tag.
 * Mehrere Termine an einem Tag: Schicht vor Schule vor frei. Nur Tage ab `ab` (inklusive) und höchstens 120 Tage.
 */
export function leseIcs(text: string, ab: ISODate): IcsErgebnis {
  const tage: Record<ISODate, SchichtId> = {};
  const unbekannt = new Set<string>();
  let termine = 0, erkannt = 0;
  if (text.length > MAX_ICS || !/BEGIN:VCALENDAR/i.test(text)) return { tage, termine, erkannt, unbekannt: [] };
  const bis = addDays(ab, 120);
  const rang: Record<SchichtId, number> = { nacht: 4, spaet: 4, frueh: 4, schule: 3, frei: 1 };
  let ev: { titel: string; start?: Zeitpunkt; ende?: Zeitpunkt } | undefined;
  for (const zeile of entfalte(text)) {
    const kopf = zeile.split(/[;:]/, 1)[0]!.toUpperCase();
    if (zeile.toUpperCase() === 'BEGIN:VEVENT') { ev = { titel: '' }; continue; }
    if (!ev) continue;
    if (kopf === 'SUMMARY') ev.titel = icsUnmask(zeile.slice(zeile.indexOf(':') + 1)).slice(0, 120);
    else if (kopf === 'DTSTART') ev.start = zeitpunkt(zeile);
    else if (kopf === 'DTEND') ev.ende = zeitpunkt(zeile);
    else if (zeile.toUpperCase() === 'END:VEVENT') {
      termine++;
      const e = ev; ev = undefined;
      if (!e.start) continue;
      const id = schichtAusTitel(e.titel, e.start.stunde);
      if (!id) { if (e.titel) unbekannt.add(e.titel); continue; }
      erkannt++;
      // Ganztägig über mehrere Tage: DTEND ist exklusiv.
      const letzte = e.start.stunde === undefined && e.ende && e.ende.stunde === undefined && e.ende.tag > e.start.tag ? addDays(e.ende.tag, -1) : e.start.tag;
      for (let d = e.start.tag, n = 0; d <= letzte && n < 60; d = addDays(d, 1), n++) {
        if (d < ab || d > bis) continue;
        const alt = tage[d];
        if (!alt || rang[id] > rang[alt]) tage[d] = id;
      }
    }
  }
  return { tage, termine, erkannt, unbekannt: [...unbekannt].slice(0, 8) };
}

// ---------------------------------------------------------------- Schonregeln

export interface Schonung { max: number; grund: string }

const ARBEIT: ReadonlySet<SchichtId> = new Set(['frueh', 'spaet', 'nacht']);
/** Lernzeit am ersten Tag nach Nachtdiensten: ausschlafen, höchstens eine kurze Wiederholung. */
export const NACH_NACHT_MAX = 20;
/** Spät- auf Frühdienst: unter 11 Stunden Ruhe (§ 5 ArbZG), am Frühdienst-Tag nur kurz. */
export const WECHSEL_MAX = 15;
/** Ab dem 6. Arbeitstag in Folge höchstens so viel. */
export const SERIE_MAX = 20;
export const SERIE_AB = 6;

/**
 * Obergrenzen der Lernzeit je Tag aus der Schichtfolge. `schicht(d)` liefert die Schicht eines Tages
 * (auch vor dem betrachteten Zeitraum, damit eine Nachtserie davor mitzählt).
 */
export function schonregeln(tage: ISODate[], schicht: (d: ISODate) => SchichtId | undefined): Record<ISODate, Schonung> {
  const out: Record<ISODate, Schonung> = {};
  for (const d of tage) {
    const heute = schicht(d), gestern = schicht(addDays(d, -1));
    if (heute === 'nacht') continue; // Nachtdienst: Vorlage hat ohnehin 0 Minuten.
    if (gestern === 'nacht') { out[d] = { max: NACH_NACHT_MAX, grund: 'Erster Tag nach dem Nachtdienst: erst ausschlafen.' }; continue; }
    if (gestern === 'spaet' && heute === 'frueh') { out[d] = { max: WECHSEL_MAX, grund: 'Spät- auf Frühdienst: weniger als 11 Stunden Ruhe.' }; continue; }
    if (heute && ARBEIT.has(heute)) {
      let n = 1;
      for (let x = addDays(d, -1); n < 14 && ARBEIT.has(schicht(x) as SchichtId); x = addDays(x, -1)) n++;
      if (n >= SERIE_AB) out[d] = { max: SERIE_MAX, grund: `${n}. Arbeitstag in Folge: Kräfte schonen.` };
    }
  }
  return out;
}
