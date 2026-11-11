// Lernplan im Ausbildungsalltag: Dienstplan-Vorlagen, erklärte Verschiebungen und die
// Übersicht nach Kompetenzbereichen vor einer Prüfung. Nur reine Funktionen (testbar).

import { addDays, eachDay, type ISODate } from './dates';
import { comparePlans, type PlanDiff } from './replan';
import type { BlockKind, StudyPlan } from './scheduler';
import type { TopicProgress } from './progress';
import { MASTERY_RULES } from './progress';
import type { Availability, ID, ReviewLog, StudyLog } from './types';

// ---------------------------------------------------------------- Dienstplan-Vorlagen

export type SchichtId = 'frueh' | 'spaet' | 'nacht' | 'schule' | 'frei';

export interface SchichtVorlage {
  id: SchichtId;
  label: string;
  /** Vorgeschlagene Netto-Lernzeit an so einem Tag. */
  minuten: number;
  hinweis: string;
}

export const SCHICHT_VORLAGEN: SchichtVorlage[] = [
  { id: 'frueh', label: 'Frühdienst', minuten: 45, hinweis: 'Nach dem Dienst bleibt meist ein ruhiger Nachmittag.' },
  { id: 'spaet', label: 'Spätdienst', minuten: 30, hinweis: 'Kurzer Block am Vormittag vor dem Dienst.' },
  { id: 'nacht', label: 'Nachtdienst', minuten: 0, hinweis: 'Schlaf geht vor. Kein Lernblock eingeplant.' },
  { id: 'schule', label: 'Schultag', minuten: 60, hinweis: 'Unterrichtsstoff am selben Tag wiederholen.' },
  { id: 'frei', label: 'Freier Tag', minuten: 120, hinweis: 'Zeit für längere Erarbeitung.' },
];

export const istSchichtId = (x: unknown): x is SchichtId => SCHICHT_VORLAGEN.some((v) => v.id === x);

/** Vorlage mit eigenen Minuten (aus den Einstellungen), sonst mit dem Vorschlag. */
export function schichtMinuten(id: SchichtId, eigene?: Partial<Record<SchichtId, number>>): number {
  const m = eigene?.[id];
  return typeof m === 'number' && Number.isFinite(m) && m >= 0 ? Math.round(m) : SCHICHT_VORLAGEN.find((v) => v.id === id)!.minuten;
}

/** Vorgeschlagener Lernbeginn je Vorlage für den Kalender (Nachtdienst: kein Lernblock). */
export const BEGINN_VORSCHLAG: Partial<Record<SchichtId | 'normal', string>> = { frueh: '15:30', spaet: '09:00', schule: '17:00', frei: '10:00' };

/** Lernbeginn eines Tages: Vorlage aus der Notiz (z. B. „Frühdienst“), sonst der normale Beginn; leer = ganztägig. */
export function beginnAm(notiz: string | undefined, eigene: Partial<Record<SchichtId | 'normal', string>> | undefined): string | undefined {
  const id = schichtAusNotiz(notiz) ?? 'normal';
  const wert = eigene && id in eigene ? eigene[id] : undefined;
  return wert && /^([01]\d|2[0-3]):[0-5]\d$/.test(wert) ? wert : undefined;
}

/** Welche Vorlage passt zu einem eingetragenen Ausnahmetag? Erkennt die Notiz (z. B. „Frühdienst“). */
export function schichtAusNotiz(notiz: string | undefined): SchichtId | undefined {
  if (!notiz) return undefined;
  return SCHICHT_VORLAGEN.find((v) => v.label === notiz)?.id;
}

/**
 * Dienstplan auf die Verfügbarkeit anwenden. `null` setzt einen Tag auf den normalen Wochentag zurück
 * (Ausnahme und Notiz werden entfernt).
 */
export function wendeDienstplanAn(
  availability: Availability,
  notes: Record<ISODate, string>,
  plan: Record<ISODate, SchichtId | null>,
  eigene?: Partial<Record<SchichtId, number>>,
): { availability: Availability; notes: Record<ISODate, string> } {
  const exceptions = { ...availability.exceptions };
  const next = { ...notes };
  for (const [day, id] of Object.entries(plan)) {
    if (id === null) { delete exceptions[day]; delete next[day]; continue; }
    exceptions[day] = schichtMinuten(id, eigene);
    next[day] = SCHICHT_VORLAGEN.find((v) => v.id === id)!.label;
  }
  return { availability: { ...availability, exceptions }, notes: next };
}

/** Die nächsten `n` Tage ab heute (inklusive). */
export const naechsteTage = (today: ISODate, n: number) => eachDay(today, addDays(today, n));

// ---------------------------------------------------------------- Erklärte Verschiebung

export interface Verschiebung {
  topicId: ID;
  text: string;
  /** spaeter = rutscht nach hinten, frueher = wird früher fertig, raus = passt nicht mehr, rein = passt wieder. */
  art: 'spaeter' | 'frueher' | 'raus' | 'rein';
}

const kurz = (d: ISODate) => d.split('-').reverse().slice(0, 2).join('.') + '.';

/** Was ändert sich am Plan, wenn sich die Eingaben ändern? Sätze für die Anzeige, wichtigste zuerst. */
export function erklaereAenderung(vorher: StudyPlan, nachher: StudyPlan, name: (id: ID) => string, diff: PlanDiff = comparePlans(vorher, nachher)): Verschiebung[] {
  const out: Verschiebung[] = [];
  for (const id of diff.newlyUnscheduled) out.push({ topicId: id, art: 'raus', text: `${name(id)} passt nicht mehr vollständig vor die Prüfung.` });
  for (const s of diff.shifted) {
    if (!s.before || !s.after) continue;
    if (s.after > s.before) out.push({ topicId: s.topicId, art: 'spaeter', text: `${name(s.topicId)}: Erarbeitung fertig am ${kurz(s.after)} statt ${kurz(s.before)}.` });
    else out.push({ topicId: s.topicId, art: 'frueher', text: `${name(s.topicId)}: schon am ${kurz(s.after)} fertig statt ${kurz(s.before)}.` });
  }
  for (const id of diff.resolvedUnscheduled) out.push({ topicId: id, art: 'rein', text: `${name(id)} passt jetzt wieder in den Plan.` });
  const rang = { raus: 0, spaeter: 1, rein: 2, frueher: 3 } as const;
  return out.sort((a, b) => rang[a.art] - rang[b.art]);
}

// ---------------------------------------------------------------- Verpasste Tage

/** Gemerkter Plan eines Tages, damit am nächsten Tag erklärt werden kann, was liegen blieb. */
export interface PlanStand {
  date: ISODate;
  bloecke: Array<{ topicId: ID; kind: BlockKind; minutes: number }>;
  /** Letzter Erarbeitungstag je Thema im damaligen Plan. */
  fertig: Record<ID, ISODate>;
}

export function planStand(plan: StudyPlan): PlanStand {
  const fertig: Record<ID, ISODate> = {};
  for (const d of plan.days) for (const b of d.blocks) if (b.kind === 'erarbeiten') fertig[b.topicId] = d.date;
  const heute = plan.days.find((d) => d.date === plan.today);
  return { date: plan.today, bloecke: (heute?.blocks ?? []).map(({ topicId, kind, minutes }) => ({ topicId, kind, minutes })), fertig };
}

export function istPlanStand(x: unknown): x is PlanStand {
  if (!x || typeof x !== 'object') return false;
  const s = x as PlanStand;
  return typeof s.date === 'string' && Array.isArray(s.bloecke) && !!s.fertig && typeof s.fertig === 'object';
}

export interface VerpassterBlock {
  topicId: ID;
  kind: BlockKind;
  minutes: number;
  /** Neuer Termin im aktuellen Plan, falls es einen gibt. */
  neu?: ISODate;
  warum: string;
}

/**
 * Blöcke eines früheren Tages, zu denen an diesem Tag nichts erfasst wurde, mit neuem Termin und Begründung.
 * Erarbeitung gilt als erledigt, wenn an dem Tag Lernzeit zum Thema erfasst ist; Abfragen, wenn ein Ergebnis da ist.
 */
export function verpassteBloecke(stand: PlanStand, plan: StudyPlan, studyLogs: StudyLog[], reviewLogs: ReviewLog[]): VerpassterBlock[] {
  if (stand.date >= plan.today) return [];
  const gelernt = new Set(studyLogs.filter((l) => l.date === stand.date).map((l) => l.topicId));
  const abgefragt = new Set(reviewLogs.filter((l) => l.date === stand.date).map((l) => l.topicId));
  const now = planStand(plan).fertig;
  const out: VerpassterBlock[] = [];
  const gesehen = new Set<string>();
  for (const b of stand.bloecke) {
    const key = `${b.kind}:${b.topicId}`;
    if (gesehen.has(key)) continue;
    gesehen.add(key);
    const erledigt = b.kind === 'erarbeiten' ? gelernt.has(b.topicId) : abgefragt.has(b.topicId);
    if (erledigt) continue;
    const neu = plan.days.find((d) => d.blocks.some((x) => x.topicId === b.topicId && (b.kind === 'erarbeiten' ? x.kind === 'erarbeiten' : x.kind !== 'erarbeiten')))?.date;
    let warum: string;
    if (b.kind === 'erarbeiten') {
      const alt = stand.fertig[b.topicId], jetzt = now[b.topicId];
      if (!neu) warum = plan.unscheduled.some((u) => u.topicId === b.topicId)
        ? 'Nicht erledigt und bis zur Prüfung reicht die Zeit nicht mehr. Mehr Lernzeit eintragen oder priorisieren.'
        : 'Nicht erledigt. Das Thema ist nicht mehr im Plan, zum Beispiel weil die Prüfung vorbei ist.';
      else if (alt && jetzt && jetzt > alt) warum = `Nicht erledigt. Die restliche Erarbeitung rückt nach, fertig jetzt am ${kurz(jetzt)} statt ${kurz(alt)}.`;
      else warum = 'Nicht erledigt. Der Block wurde in freie Zeit verschoben, das Ende der Erarbeitung bleibt gleich.';
    } else {
      warum = neu
        ? 'Abfrage war fällig und ist es weiter. Wiederholungen haben Vorrang, darum steht sie früh im Plan.'
        : 'Abfrage war fällig. Im Plan ist gerade keine Zeit dafür frei.';
    }
    out.push({ ...b, ...(neu ? { neu } : {}), warum });
  }
  return out;
}

// ---------------------------------------------------------------- Kompetenzbereiche vor der Prüfung

export interface KompetenzZeile {
  id: ID;
  code: string;
  name: string;
  themen: number;
  /** Sicher: mehrfach erfolgreich an verschiedenen Tagen abgefragt. */
  belastbar: number;
  /** Abgefragt, aber noch nicht sicher (wackelig oder zu wenige gute Ergebnisse). */
  wackelig: number;
  /** Höchstens eine echte Abfrage: Aussage über das Wissen noch nicht möglich. */
  zuWenig: number;
  topicIds: { belastbar: ID[]; wackelig: ID[]; zuWenig: ID[] };
}

export interface Bereichsquelle { id: ID; code: string; name: string; topicIds: ID[] }

/**
 * Für die Themen einer Prüfung je Kompetenzbereich: wo liegen belastbare Antworten vor, wo zu wenige Abfragen?
 * Themen ohne Bereich landen in einer eigenen Zeile „Ohne Zuordnung“.
 */
export function kompetenzUebersicht(bereiche: Bereichsquelle[], examTopicIds: ID[], progress: Record<ID, TopicProgress>): KompetenzZeile[] {
  const pruefung = new Set(examTopicIds);
  const zugeordnet = new Set<ID>();
  const zeile = (b: Bereichsquelle, ids: ID[]): KompetenzZeile => {
    const t = { belastbar: [] as ID[], wackelig: [] as ID[], zuWenig: [] as ID[] };
    for (const id of ids) {
      const p = progress[id];
      if (p?.status === 'sicher') t.belastbar.push(id);
      else if ((p?.testCount ?? 0) >= MASTERY_RULES.minSuccessfulDays) t.wackelig.push(id);
      else t.zuWenig.push(id);
    }
    return { id: b.id, code: b.code, name: b.name, themen: ids.length, belastbar: t.belastbar.length, wackelig: t.wackelig.length, zuWenig: t.zuWenig.length, topicIds: t };
  };
  const out: KompetenzZeile[] = [];
  for (const b of bereiche) {
    const ids = b.topicIds.filter((id) => pruefung.has(id));
    ids.forEach((id) => zugeordnet.add(id));
    if (ids.length) out.push(zeile(b, ids));
  }
  const rest = examTopicIds.filter((id) => !zugeordnet.has(id));
  if (rest.length) out.push(zeile({ id: 'ohne', code: '–', name: 'Ohne Zuordnung', topicIds: rest }, rest));
  return out;
}
