// Lernstatistik über alle Module: Lerntage, Serien, Wochenziele, Wochenrückblick, Fortschritt je Bereich
// und Meilensteine. Reine Funktionen ohne Datenbank, damit jede Zahl testbar und nachvollziehbar bleibt.
//
// Grundsätze (wie im Lernplan):
// - Gezählt wird nur, was wirklich passiert ist: erfasste Lernzeit, echte Abfragen, gelernte Karteikarten.
// - Selbsteinschätzungen zählen nie als Abfrage.
// - „Sicher“ kommt ausschließlich aus der Lernplan-Logik (computeProgress), hier wird nichts neu bewertet.
// - Tage ohne geplante Lernzeit (Lernplan: 0 Minuten, z. B. Dienst oder Urlaub) unterbrechen keine Serie.

import type { ID, MasteryStatus, Topic } from '../../core/types';
import { addDays } from '../../ui/lib/time';
import { evidenceRating } from '../lernplan/fsrs';
import { computeAllProgress, type TopicProgress } from '../lernplan/progress';
import { availableMinutes } from '../lernplan/scheduler';
import type { Availability, CardEvidence, EvidenceSource, PlannerSettings, ReviewLog, StudyLog } from '../lernplan/types';

export interface StatReview extends ReviewLog { trainer?: string }
export interface StatKarte { date: string; rating: number }

export interface Fakten {
  studyLogs: StudyLog[];
  reviewLogs: StatReview[];
  kartenLogs: StatKarte[];
  /** Verfügbare Lernzeit aus dem Lernplan: Tage mit 0 Minuten sind Ruhetage. */
  availability?: Availability;
}

export interface Tag {
  date: string;
  minuten: number;
  /** Echte Abfragen (Quiz, Trainer, Selbsttest …), ohne Selbsteinschätzung. */
  abfragen: number;
  /** Davon mit „gut“ oder „leicht“ bzw. ausreichend Prozent gelöst. */
  erfolgreich: number;
  karten: number;
  aktiv: boolean;
  ruhetag: boolean;
}

/** Montag der Woche eines Tages (Wochen beginnen wie im Stundenplan am Montag). */
export function wochenStart(day: string): string {
  const wd = new Date(`${day}T12:00:00Z`).getUTCDay(); // 0 = So
  return addDays(day, wd === 0 ? -6 : 1 - wd);
}

export function istRuhetag(day: string, availability?: Availability) {
  return !!availability && availableMinutes(availability, day) === 0;
}

/** Ein Eintrag je Tag von `from` bis `to` (einschließlich). */
export function tageswerte(f: Fakten, from: string, to: string): Tag[] {
  const tage = new Map<string, Tag>();
  if (from > to) return [];
  for (let d = from, n = 0; d <= to && n < 20000; d = addDays(d, 1), n++) {
    tage.set(d, { date: d, minuten: 0, abfragen: 0, erfolgreich: 0, karten: 0, aktiv: false, ruhetag: istRuhetag(d, f.availability) });
  }
  for (const l of f.studyLogs) {
    const t = tage.get(l.date);
    if (t && Number.isFinite(l.minutes) && l.minutes > 0) t.minuten += l.minutes;
  }
  for (const l of f.reviewLogs) {
    const t = tage.get(l.date);
    const r = evidenceRating(l);
    if (!t || r === undefined) continue;
    t.abfragen++;
    if (r >= 3) t.erfolgreich++;
  }
  for (const l of f.kartenLogs) {
    const t = tage.get(l.date);
    if (t) t.karten++;
  }
  for (const t of tage.values()) t.aktiv = t.minuten > 0 || t.abfragen > 0 || t.karten > 0;
  return [...tage.values()];
}

/** Frühester Tag mit irgendeinem Eintrag. */
export function ersterTag(f: Fakten): string | undefined {
  const alle = [...f.studyLogs.map((l) => l.date), ...f.reviewLogs.filter((l) => evidenceRating(l) !== undefined).map((l) => l.date), ...f.kartenLogs.map((l) => l.date)];
  return alle.length ? alle.reduce((a, b) => (b < a ? b : a)) : undefined;
}

/** Summen über alles, was bis heute erfasst ist. */
export function gesamtWerte(f: Fakten, today: string) {
  const start = ersterTag(f);
  const tage = start && start <= today ? tageswerte(f, start, today) : [];
  return {
    minuten: tage.reduce((a, t) => a + t.minuten, 0),
    abfragen: tage.reduce((a, t) => a + t.abfragen, 0),
    karten: tage.reduce((a, t) => a + t.karten, 0),
    lerntage: tage.filter((t) => t.aktiv).length,
  };
}

// ---------------------------------------------------------------- Serien

export interface Serie {
  /** Lerntage in Folge bis heute; Ruhetage zählen nicht mit, unterbrechen aber auch nicht. */
  aktuell: number;
  laengste: number;
  heuteAktiv: boolean;
  heuteRuhetag: boolean;
  /** Serie läuft, heute ist noch nichts gelernt und kein Ruhetag: heute etwas tun, sonst endet sie. */
  gefaehrdet: boolean;
}

export function serie(f: Fakten, today: string): Serie {
  const start = ersterTag(f);
  const leer = { aktuell: 0, laengste: 0, heuteAktiv: false, heuteRuhetag: istRuhetag(today, f.availability), gefaehrdet: false };
  if (!start || start > today) return leer;
  const tage = tageswerte(f, start, today);
  let laengste = 0, lauf = 0;
  for (const t of tage) {
    if (t.aktiv) { lauf++; laengste = Math.max(laengste, lauf); }
    else if (!t.ruhetag && t.date !== today) lauf = 0;
  }
  // Heute ist noch nicht vorbei: ein noch leerer Tag beendet die Serie nicht.
  const heuteT = tage[tage.length - 1]!;
  return {
    aktuell: lauf, laengste, heuteAktiv: heuteT.aktiv, heuteRuhetag: heuteT.ruhetag,
    gefaehrdet: lauf > 0 && !heuteT.aktiv && !heuteT.ruhetag,
  };
}

// ---------------------------------------------------------------- Ziele

export interface Ziele {
  minutenProWoche: number;
  aktiveTage: number;
  abfragen: number;
  karten: number;
  /** Gesamtziel: so viele Themen sicher (0 = kein Ziel). */
  sichereThemen: number;
}

export const ZIEL_GRENZEN: Record<keyof Ziele, [number, number]> = {
  minutenProWoche: [0, 6000], aktiveTage: [0, 7], abfragen: [0, 1000], karten: [0, 5000], sichereThemen: [0, 2000],
};

/** Vorschlag aus der verfügbaren Zeit im Lernplan, solange nichts Eigenes eingestellt ist. */
export function standardZiele(availability?: Availability): Ziele {
  const min = availability?.minutesByWeekday ?? [30, 60, 60, 60, 60, 60, 90];
  const summe = min.reduce((s, m) => s + Math.max(0, m), 0);
  const tage = min.filter((m) => m > 0).length;
  return {
    minutenProWoche: Math.round((summe * 0.8) / 30) * 30 || 120,
    aktiveTage: Math.max(1, Math.min(5, tage)),
    abfragen: 10,
    karten: 70,
    sichereThemen: 0,
  };
}

/** Eigene Ziele über den Vorschlag legen; Unbrauchbares fällt weg. */
export function zieleAufloesen(eigene: Partial<Record<keyof Ziele, unknown>>, availability?: Availability): Ziele {
  const out = standardZiele(availability);
  for (const k of Object.keys(ZIEL_GRENZEN) as (keyof Ziele)[]) {
    const v = eigene[k];
    const [lo, hi] = ZIEL_GRENZEN[k];
    if (typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi) out[k] = Math.round(v);
  }
  return out;
}

export interface ZielStand { id: keyof Ziele; label: string; ist: number; soll: number; anteil: number; erreicht: boolean; einheit: string }

export interface Woche {
  start: string;
  ende: string;
  tage: Tag[];
  minuten: number;
  aktiveTage: number;
  abfragen: number;
  erfolgreich: number;
  karten: number;
  /** Anteil erfolgreicher Abfragen, ohne Abfragen leer. */
  trefferquote?: number;
}

export function woche(f: Fakten, start: string): Woche {
  const tage = tageswerte(f, start, addDays(start, 6));
  const sum = (k: 'minuten' | 'abfragen' | 'erfolgreich' | 'karten') => tage.reduce((s, t) => s + t[k], 0);
  const abfragen = sum('abfragen'), erfolgreich = sum('erfolgreich');
  return {
    start, ende: addDays(start, 6), tage,
    minuten: sum('minuten'), aktiveTage: tage.filter((t) => t.aktiv).length,
    abfragen, erfolgreich, karten: sum('karten'),
    trefferquote: abfragen ? erfolgreich / abfragen : undefined,
  };
}

export function wochenZiele(w: Woche, z: Ziele): ZielStand[] {
  const eintrag = (id: keyof Ziele, label: string, ist: number, einheit: string): ZielStand => {
    const soll = z[id];
    return { id, label, ist, soll, einheit, anteil: soll > 0 ? Math.min(1, ist / soll) : 1, erreicht: soll > 0 && ist >= soll };
  };
  return [
    eintrag('minutenProWoche', 'Lernzeit', w.minuten, 'Min.'),
    eintrag('aktiveTage', 'Lerntage', w.aktiveTage, 'Tage'),
    eintrag('abfragen', 'Abfragen', w.abfragen, ''),
    eintrag('karten', 'Karteikarten', w.karten, ''),
  ].filter((s) => s.soll > 0);
}

// ---------------------------------------------------------------- Wochenrückblick

export interface Rueckblick {
  woche: Woche;
  vorwoche: Woche;
  ziele: ZielStand[];
  /** Themen, die in dieser Woche sicher geworden sind bzw. es nicht mehr sind. */
  neuSicher: ID[];
  nichtMehrSicher: ID[];
  /** Erstmals bearbeitet (vorher offen). */
  neuBegonnen: ID[];
  /** Themen mit der meisten Lernzeit. */
  meisteZeit: Array<{ topicId: ID; minuten: number }>;
  /** Themen mit nicht bestandenen Abfragen in dieser Woche. */
  schwierig: Array<{ topicId: ID; fehl: number; gesamt: number }>;
  /** Abfragen nach Herkunft (Trainer bzw. Quelle). */
  quellen: Array<{ quelle: string; anzahl: number }>;
  saetze: string[];
}

export interface Lernstand {
  leaves: Topic[];
  /** Logs wie im Lernplan (inkl. rechnerisch ergänzter Lernzeit für „Erarbeitet“ auf dem Board). */
  studyLogs: StudyLog[];
  reviewLogs: ReviewLog[];
  settings: PlannerSettings;
  /** Heutiger Kartenstand je Thema wie im Lernplan; gilt nur für heute und später (frühere Tage lassen sich nicht rekonstruieren). */
  cardEvidence?: Record<ID, CardEvidence[]>;
  heute?: string;
}

export function statusAm(s: Lernstand, day: string): Map<ID, TopicProgress> {
  const karten = s.cardEvidence && s.heute && day >= s.heute ? s.cardEvidence : undefined;
  return computeAllProgress(s.leaves, s.studyLogs, s.reviewLogs, day, s.settings, karten);
}

const plural = (n: number, eins: string, viele: string) => `${n} ${n === 1 ? eins : viele}`;

export function wochenrueckblick(f: Fakten, s: Lernstand, start: string, today: string, z: Ziele): Rueckblick {
  const w = woche(f, start);
  const vw = woche(f, addDays(start, -7));
  const bis = w.ende < today ? w.ende : today;
  const vorher = statusAm(s, addDays(start, -1));
  const nachher = statusAm(s, bis);
  const neuSicher: ID[] = [], nichtMehrSicher: ID[] = [], neuBegonnen: ID[] = [];
  for (const [id, p] of nachher) {
    const alt = vorher.get(id)?.status ?? 'offen';
    if (p.status === 'sicher' && alt !== 'sicher') neuSicher.push(id);
    if (p.status !== 'sicher' && alt === 'sicher') nichtMehrSicher.push(id);
    if (alt === 'offen' && p.status !== 'offen') neuBegonnen.push(id);
  }
  const inWoche = (d: string) => d >= start && d <= w.ende;
  const zeit = new Map<ID, number>();
  for (const l of f.studyLogs) if (inWoche(l.date) && l.minutes > 0) zeit.set(l.topicId, (zeit.get(l.topicId) ?? 0) + l.minutes);
  const meisteZeit = [...zeit].map(([topicId, minuten]) => ({ topicId, minuten })).sort((a, b) => b.minuten - a.minuten).slice(0, 5);

  const proThema = new Map<ID, { fehl: number; gesamt: number }>();
  const quellen = new Map<string, number>();
  for (const l of f.reviewLogs) {
    const r = evidenceRating(l);
    if (!inWoche(l.date) || r === undefined) continue;
    const e = proThema.get(l.topicId) ?? { fehl: 0, gesamt: 0 };
    proThema.set(l.topicId, { fehl: e.fehl + (r < 3 ? 1 : 0), gesamt: e.gesamt + 1 });
    const q = l.trainer ?? l.source;
    quellen.set(q, (quellen.get(q) ?? 0) + 1);
  }
  const schwierig = [...proThema].filter(([, v]) => v.fehl > 0).map(([topicId, v]) => ({ topicId, ...v }))
    .sort((a, b) => b.fehl - a.fehl || b.gesamt - a.gesamt).slice(0, 5);

  const ziele = wochenZiele(w, z);
  const saetze: string[] = [];
  if (!w.tage.some((t) => t.aktiv)) {
    saetze.push(w.start > today ? 'Diese Woche hat noch nicht begonnen.' : 'In dieser Woche ist noch nichts erfasst.');
  } else {
    saetze.push(`${plural(w.aktiveTage, 'Lerntag', 'Lerntage')}, ${w.minuten} Min. Lernzeit, ${plural(w.abfragen, 'Abfrage', 'Abfragen')} und ${plural(w.karten, 'Karteikarte', 'Karteikarten')}.`);
    if (vw.minuten > 0 && w.minuten !== vw.minuten) {
      const diff = w.minuten - vw.minuten;
      saetze.push(diff > 0 ? `${diff} Min. mehr Lernzeit als in der Vorwoche.` : `${-diff} Min. weniger Lernzeit als in der Vorwoche.`);
    }
    if (w.trefferquote !== undefined) saetze.push(`${Math.round(w.trefferquote * 100)} % der Abfragen gelöst.`);
    const erreicht = ziele.filter((x) => x.erreicht).length;
    if (ziele.length) saetze.push(erreicht === ziele.length ? 'Alle Wochenziele erreicht.' : `${erreicht} von ${ziele.length} Wochenzielen erreicht.`);
    if (neuSicher.length) saetze.push(`${plural(neuSicher.length, 'Thema', 'Themen')} neu sicher.`);
    if (nichtMehrSicher.length) saetze.push(`${plural(nichtMehrSicher.length, 'Thema braucht', 'Themen brauchen')} wieder eine Wiederholung.`);
  }
  return {
    woche: w, vorwoche: vw, ziele, neuSicher, nichtMehrSicher, neuBegonnen, meisteZeit, schwierig,
    quellen: [...quellen].map(([quelle, anzahl]) => ({ quelle, anzahl })).sort((a, b) => b.anzahl - a.anzahl),
    saetze,
  };
}

// ---------------------------------------------------------------- Fortschritt je Bereich

export interface Bereich { id: ID; code: string; name: string; topicIds: ID[] }

export const STATUS_REIHE: MasteryStatus[] = ['sicher', 'unsicher', 'bearbeitet', 'offen'];

export interface BereichStand extends Bereich {
  zahl: Record<MasteryStatus, number>;
  gesamt: number;
  /** Anteil sicherer Themen. */
  sicher: number;
  /** Anteil begonnener Themen (nicht mehr offen). */
  begonnen: number;
}

export function bereichsStand(bereiche: Bereich[], status: (id: ID) => MasteryStatus): BereichStand[] {
  return bereiche.map((b) => {
    const zahl = Object.fromEntries(STATUS_REIHE.map((s) => [s, 0])) as Record<MasteryStatus, number>;
    for (const id of b.topicIds) zahl[status(id)]++;
    const gesamt = b.topicIds.length;
    return { ...b, zahl, gesamt, sicher: gesamt ? zahl.sicher / gesamt : 0, begonnen: gesamt ? (gesamt - zahl.offen) / gesamt : 0 };
  });
}

interface RahmenModul {
  topics: Array<{ id: ID; parentId?: ID; competencyIds?: ID[] }>;
  frameworks?: Array<{ kind: string; items: Array<{ id: ID; parentId?: ID; code: string; name: string }> }>;
}

/**
 * Kompetenzbereiche (Pflege: I–V nach PflAPrV Anlage 2) mit den lernbaren Themen darunter.
 * Ein Thema gehört zu einem Bereich, wenn es selbst oder ein Oberthema auf den Bereich
 * oder einen seiner Unterpunkte verweist.
 */
export function kompetenzBereiche(modul: RahmenModul): Bereich[] {
  const items = modul.frameworks?.find((fw) => fw.kind === 'kompetenzen')?.items ?? [];
  const byItem = new Map(items.map((i) => [i.id, i]));
  const wurzel = (id: ID) => {
    let i = byItem.get(id);
    for (let n = 0; i?.parentId && n < 20; n++) i = byItem.get(i.parentId);
    return i?.id;
  };
  const byTopic = new Map(modul.topics.map((t) => [t.id, t]));
  const eltern = new Set(modul.topics.map((t) => t.parentId).filter(Boolean));
  const zuordnung = new Map<ID, Set<ID>>();
  for (const t of modul.topics) {
    if (eltern.has(t.id)) continue;
    const ks = new Set<ID>();
    for (let x: typeof t | undefined = t, n = 0; x && n < 20; x = x.parentId ? byTopic.get(x.parentId) : undefined, n++) {
      for (const c of x.competencyIds ?? []) { const w = wurzel(c); if (w) ks.add(w); }
    }
    for (const k of ks) zuordnung.set(k, (zuordnung.get(k) ?? new Set()).add(t.id));
  }
  return items.filter((i) => !i.parentId).map((i) => ({ id: i.id, code: i.code, name: i.name, topicIds: [...(zuordnung.get(i.id) ?? [])] }));
}

// ---------------------------------------------------------------- Meilensteine

export interface Meilenstein { id: string; titel: string; text: string; ist: number; soll: number; erreicht: boolean }

export interface MeilensteinDaten {
  laengsteSerie: number;
  minutenGesamt: number;
  abfragenGesamt: number;
  kartenGesamt: number;
  sicher: number;
  themenGesamt: number;
  /** Bereiche (z. B. CE), in denen jedes Thema begonnen ist. */
  bereicheBegonnen: number;
  wochenMitZiel: number;
}

export function meilensteine(d: MeilensteinDaten): Meilenstein[] {
  const m = (id: string, titel: string, text: string, ist: number, soll: number): Meilenstein => ({ id, titel, text, ist: Math.min(ist, soll), soll, erreicht: ist >= soll });
  const viertel = Math.max(1, Math.ceil(d.themenGesamt / 4));
  return [
    m('abfrage-1', 'Erste Abfrage', 'Ein Thema zum ersten Mal echt abgefragt.', d.abfragenGesamt, 1),
    m('serie-3', 'Drei Tage am Stück', 'Drei Lerntage in Folge (Ruhetage zählen nicht dagegen).', d.laengsteSerie, 3),
    m('serie-7', 'Eine Woche dran', 'Sieben Lerntage in Folge.', d.laengsteSerie, 7),
    m('serie-30', 'Ein Monat dran', 'Dreißig Lerntage in Folge.', d.laengsteSerie, 30),
    m('zeit-10', '10 Stunden', 'Zehn Stunden Lernzeit erfasst.', Math.floor(d.minutenGesamt / 60), 10),
    m('zeit-50', '50 Stunden', 'Fünfzig Stunden Lernzeit erfasst.', Math.floor(d.minutenGesamt / 60), 50),
    m('karten-100', '100 Karteikarten', 'Hundert Karteikarten-Wiederholungen.', d.kartenGesamt, 100),
    m('karten-1000', '1000 Karteikarten', 'Tausend Karteikarten-Wiederholungen.', d.kartenGesamt, 1000),
    m('sicher-1', 'Erstes sicheres Thema', 'Ein Thema mehrfach erfolgreich abgefragt und gut abrufbar.', d.sicher, 1),
    m('sicher-10', 'Zehn sichere Themen', 'Zehn Themen sind sicher.', d.sicher, 10),
    m('sicher-viertel', 'Ein Viertel sicher', `Ein Viertel aller Themen (${viertel}) ist sicher.`, d.sicher, viertel),
    m('bereich-1', 'Eine CE komplett begonnen', 'Jedes Thema einer curricularen Einheit ist mindestens bearbeitet.', d.bereicheBegonnen, 1),
    m('woche-ziel', 'Wochenziel geschafft', 'Eine Woche, in der alle Wochenziele erreicht wurden.', d.wochenMitZiel, 1),
  ];
}

/** Wochen seit dem ersten Eintrag, in denen alle Wochenziele erreicht wurden (laufende Woche zählt mit, wenn schon erreicht). */
export function wochenMitAllenZielen(f: Fakten, z: Ziele, today: string): number {
  const start = ersterTag(f);
  if (!start) return 0;
  let n = 0;
  for (let w = wochenStart(start), i = 0; w <= today && i < 530; w = addDays(w, 7), i++) {
    const ziele = wochenZiele(woche(f, w), z);
    if (ziele.length && ziele.every((x) => x.erreicht)) n++;
  }
  return n;
}

// ---------------------------------------------------------------- Kalender

/** Stufe 0–4 für die Kalenderansicht: Lernzeit plus Abfragen und Karten als Minuten-Gegenwert. */
export function stufe(t: Tag): 0 | 1 | 2 | 3 | 4 {
  const wert = t.minuten + t.abfragen * 3 + t.karten * 0.5;
  if (!t.aktiv) return 0;
  return wert < 15 ? 1 : wert < 30 ? 2 : wert < 60 ? 3 : 4;
}

/** Ganze Wochen (Mo–So) bis zur Woche von `today`, älteste zuerst. */
export function kalenderWochen(f: Fakten, today: string, anzahl = 12): Tag[][] {
  const letzte = wochenStart(today);
  const erste = addDays(letzte, -7 * (anzahl - 1));
  const tage = tageswerte(f, erste, addDays(letzte, 6));
  return Array.from({ length: anzahl }, (_, i) => tage.slice(i * 7, i * 7 + 7));
}

// ---------------------------------------------------------------- Wissensverlauf

export interface VerlaufPunkt { ende: string; zahl: Record<MasteryStatus, number> }

/** Status aller Themen jeweils am Sonntag der letzten Wochen (laufende Woche: heute). Älteste zuerst. */
export function wissensVerlauf(s: Lernstand, today: string, anzahl = 12): VerlaufPunkt[] {
  const letzte = wochenStart(today);
  return Array.from({ length: anzahl }, (_, i) => {
    const start = addDays(letzte, -7 * (anzahl - 1 - i));
    const ende = addDays(start, 6) < today ? addDays(start, 6) : today;
    const zahl = Object.fromEntries(STATUS_REIHE.map((x) => [x, 0])) as Record<MasteryStatus, number>;
    for (const p of statusAm(s, ende).values()) zahl[p.status]++;
    return { ende, zahl };
  });
}

// ---------------------------------------------------------------- Erinnerung und Meilenstein-Meldungen

/**
 * Erinnerung an eine gefährdete Serie: höchstens einmal am Tag und erst ab dem Nachmittag,
 * damit sie nicht schon morgens drängelt.
 */
export function brauchtSerienErinnerung(s: Serie, today: string, stunde: number, zuletzt: string | undefined, abStunde = 16) {
  return s.gefaehrdet && s.aktuell >= 2 && stunde >= abStunde && zuletzt !== today;
}

/** Meilensteine, die erreicht sind, aber noch nicht gemeldet wurden. */
export function neueMeilensteine(liste: Meilenstein[], gemeldet: string[]): Meilenstein[] {
  const schon = new Set(gemeldet);
  return liste.filter((m) => m.erreicht && !schon.has(m.id));
}

// ---------------------------------------------------------------- Rückblick als Text

/** Wochenrückblick als schlichter Text zum Kopieren (Notizen, Praxisanleitung, Lerngruppe). */
export function rueckblickText(r: Rueckblick, name: (id: ID) => string): string {
  const datum = (d: string) => `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(0, 4)}`;
  const zeilen = [`Lernwoche ${datum(r.woche.start)} bis ${datum(r.woche.ende)}`, '', ...r.saetze.map((s) => `- ${s}`)];
  if (r.ziele.length) {
    zeilen.push('', 'Wochenziele:');
    for (const z of r.ziele) zeilen.push(`- ${z.label}: ${z.ist} von ${z.soll}${z.einheit ? ` ${z.einheit}` : ''}${z.erreicht ? ' (erreicht)' : ''}`);
  }
  if (r.neuSicher.length) zeilen.push('', 'Neu sicher:', ...r.neuSicher.map((id) => `- ${name(id)}`));
  if (r.meisteZeit.length) zeilen.push('', 'Meiste Lernzeit:', ...r.meisteZeit.map((x) => `- ${name(x.topicId)} (${x.minuten} Min.)`));
  if (r.schwierig.length) zeilen.push('', 'Noch schwierig:', ...r.schwierig.map((x) => `- ${name(x.topicId)} (${x.fehl} von ${x.gesamt} nicht gelöst)`));
  return zeilen.join('\n');
}

// ---------------------------------------------------------------- Lernstufen je Thema

/**
 * Vier Stufen vom Lesen bis zum Nachweis. Sie bauen aufeinander auf, werden aber unabhängig gezählt:
 * - gelesen: Lernzeit erfasst, auf dem Board erarbeitet oder im Skript Abschnitte als gelesen markiert
 * - abgerufen: echte Abfrage aus dem Gedächtnis (Karteikarten, Quiz, offene Frage, Prüfungssimulation)
 * - angewendet: in einem Übungstrainer, Fall oder Praxissimulator genutzt
 * - bestätigt: sicher nach den Lernplan-Regeln (mehrfach an verschiedenen Tagen erfolgreich, gut abrufbar)
 * Selbsteinschätzungen zählen auf keiner Stufe.
 */
export type Lernstufe = 'gelesen' | 'abgerufen' | 'angewendet' | 'bestaetigt';
export const LERNSTUFEN: Array<{ id: Lernstufe; label: string; text: string }> = [
  { id: 'gelesen', label: 'Gelesen', text: 'Lernzeit erfasst oder im Skript gelesen' },
  { id: 'abgerufen', label: 'Abgerufen', text: 'aus dem Gedächtnis abgefragt' },
  { id: 'angewendet', label: 'Angewendet', text: 'in Trainer, Fall oder Praxis genutzt' },
  { id: 'bestaetigt', label: 'Bestätigt', text: 'sicher nach mehreren Abfragen' },
];

const ABRUF: EvidenceSource[] = ['karteikarten', 'quiz', 'offene_frage', 'pruefungssimulation'];

export function lernstufen(
  topicIds: ID[],
  studyLogs: StudyLog[],
  reviewLogs: ReviewLog[],
  status: (id: ID) => MasteryStatus,
  skriptGelesen: Iterable<ID> = [],
): Record<Lernstufe, ID[]> {
  const ids = new Set(topicIds);
  const gelesen = new Set<ID>([...skriptGelesen].filter((id) => ids.has(id)));
  for (const l of studyLogs) if (l.minutes > 0 && ids.has(l.topicId)) gelesen.add(l.topicId);
  const abgerufen = new Set<ID>(), angewendet = new Set<ID>();
  for (const l of reviewLogs) {
    if (!ids.has(l.topicId) || evidenceRating(l) === undefined) continue;
    if (l.source === 'trainer') angewendet.add(l.topicId);
    else if (ABRUF.includes(l.source)) abgerufen.add(l.topicId);
  }
  const bestaetigt = topicIds.filter((id) => status(id) === 'sicher');
  return { gelesen: topicIds.filter((id) => gelesen.has(id)), abgerufen: topicIds.filter((id) => abgerufen.has(id)), angewendet: topicIds.filter((id) => angewendet.has(id)), bestaetigt };
}
