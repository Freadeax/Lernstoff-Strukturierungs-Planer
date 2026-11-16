// Praxiseinsatz: Zeitraum, Phase, Lernplan-Kopplung und Bereit-Check. Rein (kein React, keine DB),
// damit Regeln und Schwellen testbar bleiben.
//
// Lernplan-Kopplung: Ein Einsatz wird im Lernplan als normale Prüfung mit fester ID `einsatz:<id>` geführt
// (wie die CE-Prüfungen). Vor dem Einsatz liegt ihr Termin auf dem ersten Einsatztag, damit die Themen
// vorher drankommen; während des Einsatzes auf dem letzten Tag. Gewicht 0,6: eine echte Klausur geht vor.

import type { Exam, ID, MasteryStatus } from '../../core/types';
import { addDays, daysBetween } from '../../ui/lib/time';
import { ART, istEinsatzArt, type CheckUebung, type EinsatzArt } from './arten';

export interface Einsatz {
  id: string;
  art: EinsatzArt;
  /** Freier Name, z. B. „Station 4B Kinderchirurgie“. */
  bereich: string;
  von: string;
  bis: string;
  /** Gewählte Themen (Blatt-Themen). Standard: die Themen der Einsatzart. */
  themen: ID[];
  /** Eigene Lernziele für den Einsatz, je eine Zeile. */
  ziele: string[];
  /** Themen im Lernplan vorziehen. */
  imLernplan: boolean;
  angelegt: string;
}

export type Phase = 'spaeter' | 'vorbereitung' | 'laeuft' | 'vorbei';

/** So viele Tage vor dem Start beginnt die Vorbereitung (Hinweis auf Heute, Bereit-Check). */
export const VORLAUF_TAGE = 21;
/** Gewicht der Einsatz-„Prüfung“ im Lernplan (Klausuren haben 1, Abschlussprüfung meist 2). */
export const EINSATZ_GEWICHT = 0.6;

const PRAEFIX = 'einsatz:';
export const einsatzPruefungsId = (id: string) => `${PRAEFIX}${id}`;
export const istEinsatzPruefung = (examId: string) => examId.startsWith(PRAEFIX);

const DATUM = /^\d{4}-\d{2}-\d{2}$/;
const text = (v: unknown, max = 200): v is string => typeof v === 'string' && v.length <= max;

/** Prüft einen gespeicherten Einsatz (localStorage kann alles enthalten). */
export function istEinsatz(v: unknown): v is Einsatz {
  if (typeof v !== 'object' || v === null) return false;
  const e = v as Record<string, unknown>;
  return text(e.id, 80) && istEinsatzArt(e.art) && text(e.bereich) && text(e.von) && DATUM.test(e.von) && text(e.bis) && DATUM.test(e.bis) && e.von <= e.bis
    && Array.isArray(e.themen) && e.themen.length <= 100 && e.themen.every((t) => text(t, 120))
    && Array.isArray(e.ziele) && e.ziele.length <= 30 && e.ziele.every((z) => text(z, 500))
    && typeof e.imLernplan === 'boolean' && text(e.angelegt, 40);
}

export function neuerEinsatz(art: EinsatzArt, von: string, bis: string, jetzt = new Date(), id: string = crypto.randomUUID()): Einsatz {
  return { id, art, bereich: '', von, bis, themen: [...(ART.get(art)?.themen ?? [])], ziele: [], imLernplan: true, angelegt: jetzt.toISOString() };
}

export function phase(e: Pick<Einsatz, 'von' | 'bis'>, heute: string): Phase {
  if (heute > e.bis) return 'vorbei';
  if (heute >= e.von) return 'laeuft';
  return daysBetween(heute, e.von) <= VORLAUF_TAGE ? 'vorbereitung' : 'spaeter';
}

export const dauerTage = (e: Pick<Einsatz, 'von' | 'bis'>) => daysBetween(e.von, e.bis) + 1;
/** Laufender Einsatztag (1 = erster Tag). */
export const einsatzTag = (e: Pick<Einsatz, 'von'>, heute: string) => daysBetween(e.von, heute) + 1;

export function einsatzName(e: Pick<Einsatz, 'art' | 'bereich'>): string {
  const art = ART.get(e.art)?.kurz ?? e.art;
  return e.bereich.trim() ? `${art}: ${e.bereich.trim()}` : art;
}

/** Sortiert nach Beginn. */
export const sortiert = (liste: Einsatz[]) => [...liste].sort((a, b) => a.von.localeCompare(b.von) || a.angelegt.localeCompare(b.angelegt));

/** Der Einsatz, um den es gerade geht: der laufende, sonst der nächste in Vorbereitung. */
export function aktuellerEinsatz(liste: Einsatz[], heute: string): Einsatz | undefined {
  const s = sortiert(liste);
  return s.find((e) => phase(e, heute) === 'laeuft') ?? s.find((e) => phase(e, heute) === 'vorbereitung');
}

/** Nächster Einsatz in der Zukunft (auch weiter als 3 Wochen entfernt). */
export const naechsterEinsatz = (liste: Einsatz[], heute: string) => sortiert(liste).find((e) => e.von > heute);

/** Termin der Lernplan-„Prüfung“: vor dem Einsatz der erste Tag, währenddessen der letzte. */
export function pruefungsTermin(e: Pick<Einsatz, 'von' | 'bis'>, heute: string): string {
  return e.von > heute ? e.von : e.bis;
}

/** Prüfung für den Lernplan. Fächer kommen aus den Themen. */
export function einsatzPruefung(e: Einsatz, heute: string, fachVon: (topicId: ID) => ID | undefined): Exam {
  const subjectIds = [...new Set(e.themen.map(fachVon).filter((x): x is ID => !!x))];
  return { id: einsatzPruefungsId(e.id), name: `Einsatz ${einsatzName(e)}`, date: pruefungsTermin(e, heute), topicIds: [...e.themen], subjectIds };
}

/**
 * Was im Lernplan zu tun ist, damit er zu den Einsätzen passt: anlegen/aktualisieren oder löschen.
 * Vergangene Einsätze und Einsätze ohne Lernplan-Haken werden entfernt.
 */
export function abgleich(liste: Einsatz[], exams: Exam[], heute: string, fachVon: (topicId: ID) => ID | undefined): { speichern: Exam[]; loeschen: Exam[] } {
  const soll = new Map(liste.filter((e) => e.imLernplan && phase(e, heute) !== 'vorbei' && e.themen.length).map((e) => [einsatzPruefungsId(e.id), einsatzPruefung(e, heute, fachVon)]));
  const ist = exams.filter((x) => istEinsatzPruefung(x.id));
  const gleich = (a: Exam, b: Exam) => a.name === b.name && a.date === b.date && a.topicIds.join() === b.topicIds.join();
  return {
    speichern: [...soll.values()].filter((x) => { const alt = ist.find((i) => i.id === x.id); return !alt || !gleich(alt, x); }),
    loeschen: ist.filter((x) => !soll.has(x.id)),
  };
}

// ---------------------------------------------------------------- Bereit-Check

export type Ampel = 'gruen' | 'gelb' | 'rot';
export const AMPEL_TEXT: Record<Ampel, string> = { gruen: 'sitzt', gelb: 'angefangen', rot: 'noch offen' };

export interface Station {
  id: 'wissen' | 'faelle' | 'notfall' | 'handgriffe';
  titel: string;
  ampel: Ampel;
  text: string;
  links: Array<{ label: string; path: string; erledigt?: boolean }>;
}

/** Ein Trainer-Ergebnis aus dem Lernplan (StoredReviewLog, gekürzt). */
export interface TrainerErgebnis { trainer?: string; date: string; scorePercent?: number; status?: string; aussagekraft?: string }

/** Ab diesem Ergebnis gilt eine Übung im Bereit-Check als geschafft. */
export const GUT_AB = 70;
/** Trainer-Ergebnisse zählen so viele Tage. */
export const FRISCH_TAGE = 60;

export interface CheckFakten {
  heute: string;
  status: (topicId: ID) => MasteryStatus;
  themaName: (topicId: ID) => string;
  /** Praxisfälle zum Setting: id, Titel und ob schon einmal abgeschlossen. */
  faelle: Array<{ id: string; titel: string; erledigt: boolean }>;
  ergebnisse: TrainerErgebnis[];
}

/** Bestes zählendes Ergebnis je Trainer in den letzten FRISCH_TAGE Tagen. */
export function besteErgebnisse(ergebnisse: TrainerErgebnis[], heute: string): Map<string, number> {
  const grenze = addDays(heute, -FRISCH_TAGE);
  const out = new Map<string, number>();
  for (const r of ergebnisse) {
    if (!r.trainer || r.date < grenze || r.date > heute) continue;
    if (r.status && r.status !== 'abgeschlossen') continue;
    if (r.aussagekraft === 'uebung') continue;
    out.set(r.trainer, Math.max(out.get(r.trainer) ?? 0, r.scorePercent ?? 0));
  }
  return out;
}

function uebungsStation(id: 'notfall' | 'handgriffe', titel: string, uebungen: CheckUebung[], beste: Map<string, number>): Station {
  const gut = uebungen.filter((u) => (beste.get(u.trainer) ?? -1) >= GUT_AB).length;
  const versucht = uebungen.filter((u) => beste.has(u.trainer)).length;
  const ampel: Ampel = uebungen.length && gut === uebungen.length ? 'gruen' : versucht ? 'gelb' : 'rot';
  const text = ampel === 'gruen' ? `Alle ${uebungen.length} Übungen mit mindestens ${GUT_AB} % in den letzten ${FRISCH_TAGE} Tagen.`
    : versucht ? `${gut} von ${uebungen.length} Übungen mit mindestens ${GUT_AB} %.` : 'Noch keine Übung dazu in den letzten Wochen.';
  return { id, titel, ampel, text, links: uebungen.map((u) => ({ label: u.label, path: u.path, erledigt: (beste.get(u.trainer) ?? -1) >= GUT_AB })) };
}

/**
 * Vier Stationen vor dem Einsatz. Die Ampel ist kein Urteil über dich, sondern zeigt, wofür es schon
 * echte Abfragen gibt. Selbsteinschätzung zählt nirgends.
 */
export function bereitCheck(e: Einsatz, f: CheckFakten): Station[] {
  const info = ART.get(e.art)!;
  // 1. Wissen: Anteil der Einsatzthemen, die schon abgefragt wurden und sicher sind.
  const zahl = { sicher: 0, unsicher: 0, bearbeitet: 0, offen: 0 } as Record<MasteryStatus, number>;
  for (const t of e.themen) zahl[f.status(t)]++;
  const n = e.themen.length || 1;
  const abgefragt = (zahl.sicher + zahl.unsicher) / n;
  const wissenAmpel: Ampel = abgefragt >= 0.7 && zahl.sicher / n >= 0.4 ? 'gruen' : abgefragt >= 0.3 || zahl.sicher > 0 ? 'gelb' : 'rot';
  const schwach = e.themen.filter((t) => f.status(t) !== 'sicher').slice(0, 3);
  const wissen: Station = {
    id: 'wissen', titel: 'Wissen zu den Einsatzthemen', ampel: wissenAmpel,
    text: `${zahl.sicher} von ${e.themen.length} Themen sicher, ${zahl.unsicher} unsicher, ${zahl.offen + zahl.bearbeitet} noch nie abgefragt.`,
    links: [
      { label: 'Karteikarten zu allen Einsatzthemen', path: `/lernen/karten?thema=${encodeURIComponent(e.themen.join(','))}&titel=${encodeURIComponent(einsatzName(e))}` },
      ...schwach.map((t) => ({ label: f.themaName(t), path: `/lernen/thema?id=${encodeURIComponent(t)}` })),
    ],
  };
  // 2. Praxisfälle im passenden Setting.
  const fertig = f.faelle.filter((x) => x.erledigt).length;
  const ziel = Math.min(2, f.faelle.length);
  const faelle: Station = {
    id: 'faelle', titel: 'Typische Situationen im Simulator', ampel: !f.faelle.length ? 'gelb' : fertig >= ziel ? 'gruen' : fertig ? 'gelb' : 'rot',
    text: f.faelle.length ? `${fertig} von ${f.faelle.length} passenden Praxisfällen abgeschlossen (Ziel: ${ziel}).` : 'Für dieses Setting gibt es noch keinen eigenen Praxisfall. Nimm einen Fall aus einem ähnlichen Bereich.',
    links: f.faelle.length ? f.faelle.map((x) => ({ label: x.titel, path: `/lernen/praxis?fall=${encodeURIComponent(x.id)}`, erledigt: x.erledigt })) : [{ label: 'Praxissimulator', path: '/lernen/praxis' }],
  };
  const beste = besteErgebnisse(f.ergebnisse, f.heute);
  return [wissen, faelle, uebungsStation('notfall', 'Notfall erkennen und handeln', info.notfall, beste), uebungsStation('handgriffe', 'Typische Aufgaben im Einsatz', info.handgriffe, beste)];
}

/** Kurzfassung für Heute: wie viele Stationen grün sind. */
export const gruenZahl = (s: Station[]) => s.filter((x) => x.ampel === 'gruen').length;
