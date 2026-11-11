// Fachliche Freigabe für Simulator-Inhalte (Audit SIM-02): gemeinsames Modell für Praxissimulator,
// Notfall-Trainer, Fallsimulator und Diagnostik. Je Fall: Lernziele, Quellenstand, Prüferrolle,
// Datum, Geltungsbereich und Änderungsverlauf. Solange nichts freigegeben ist, steht das sichtbar am
// Start und am Entscheidungsort. Code-Tests prüfen nur Konsistenz, nie die fachliche Richtigkeit.

export type PruefStatus = 'ungeprueft' | 'in-pruefung' | 'geprueft' | 'zurueckgezogen';
/** Altersgruppe: bestimmt, welche Referenzen, Alarmgrenzen und Scores gelten dürfen. */
export type Zielgruppe = 'erwachsene' | 'kinder' | 'neugeborene';
/** Inhalte mit erhöhtem Risiko werden zuerst geprüft (Reihenfolge laut Audit). */
export type Risiko = 'medikament' | 'notfall' | 'kinder' | 'geraet';

export interface Quelle { titel: string; stand: string }
export interface Pruefung { rolle: string; datum: string; name?: string; bemerkung?: string }
export interface Aenderung { datum: string; text: string }

export interface Freigabe {
  status: PruefStatus;
  lernziele: string[];
  /** Für wen und wo der Fall gilt, z. B. „Erwachsene, Normalstation, ab 2. Ausbildungsjahr“. */
  geltung: string;
  zielgruppe: Zielgruppe;
  quellen: Quelle[];
  /** Erforderliche Prüferrolle, z. B. „Pflegefachperson mit Praxisanleitung“. */
  prueferrolle: string;
  pruefung?: Pruefung;
  aenderungen: Aenderung[];
  risiken: Risiko[];
  /** Was die Prüfung ausdrücklich ansehen muss. */
  pruefpunkte: string[];
}

export const STATUS_TEXT: Record<PruefStatus, string> = {
  ungeprueft: 'Fachlich ungeprüft', 'in-pruefung': 'In fachlicher Prüfung', geprueft: 'Fachlich geprüft', zurueckgezogen: 'Zurückgezogen',
};
export const ZIELGRUPPE_TEXT: Record<Zielgruppe, string> = { erwachsene: 'Erwachsene', kinder: 'Kinder', neugeborene: 'Neugeborene' };
export const RISIKO_TEXT: Record<Risiko, string> = { medikament: 'Medikamente', notfall: 'Notfall', kinder: 'Kinder', geraet: 'Geräte' };

export function istGeprueft(f: Freigabe | undefined): boolean { return f?.status === 'geprueft' && !!f.pruefung?.datum; }

/**
 * Darf der Simulator eine definitive automatische Wertung zeigen (Score, Alarmfarbe, „richtig/falsch“
 * bei Grenzwerten)? Für Kinder und Neugeborene nur mit geprüftem Fall, weil Erwachsenen-Referenzen
 * und -Alarmgrenzen dort nicht gelten.
 */
export function automatischeWertung(f: Freigabe | undefined): boolean {
  if (!f) return false;
  return f.zielgruppe === 'erwachsene' || istGeprueft(f);
}

/** Kurztext für Chips am Entscheidungsort. */
export function kennzeichnung(f: Freigabe | undefined): string {
  if (!f) return 'Fachlich ungeprüft';
  if (istGeprueft(f)) return `Fachlich geprüft am ${datum(f.pruefung!.datum)} (${f.pruefung!.rolle})`;
  return `${STATUS_TEXT[f.status]} · Lernmodell, keine Handlungsanweisung`;
}

/** Reihenfolge für die fachliche Prüfung: Medikamente, Notfall, Kinder, Geräte zuerst. */
export function pruefReihenfolge<T extends { freigabe: Freigabe }>(faelle: T[]): T[] {
  const gewicht = (f: Freigabe) => (['medikament', 'notfall', 'kinder', 'geraet'] as Risiko[]).reduce((s, r, i) => s + (f.risiken.includes(r) ? 2 ** (3 - i) : 0), 0);
  return [...faelle].filter(x => !istGeprueft(x.freigabe)).sort((a, b) => gewicht(b.freigabe) - gewicht(a.freigabe));
}

/** Prüft, ob eine Freigabe vollständig erfasst ist (für Tests der Kataloge). */
export function freigabeFehler(f: Freigabe): string[] {
  const e: string[] = [];
  if (f.lernziele.length < 2) e.push('mindestens zwei Lernziele');
  if (!f.geltung) e.push('Geltungsbereich');
  if (!f.quellen.length || f.quellen.some(q => !q.stand)) e.push('Quellen mit Stand');
  if (!f.prueferrolle) e.push('Prüferrolle');
  if (!f.aenderungen.length) e.push('Änderungsverlauf');
  if (f.status === 'geprueft' && !f.pruefung?.datum) e.push('Prüfdatum bei geprüftem Fall');
  if (f.zielgruppe !== 'erwachsene' && !f.risiken.includes('kinder')) e.push('Risiko „kinder“ bei Kinderfall');
  return e;
}

function datum(iso: string): string {
  const [j, m, t] = iso.split('-'); return t && m && j ? `${t}.${m}.${j}` : iso;
}
export { datum as freigabeDatum };
