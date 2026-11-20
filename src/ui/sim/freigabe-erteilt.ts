// Erteilte Prüfungen (Audit F-1): Ergebnisse der Prüfbögen, die über einen Freigabe-Code in den Code
// übernommen wurden. Jede Prüfung gilt nur für die Fassung, die geprüft wurde: Ändert sich der Inhalt,
// passt der Fingerabdruck nicht mehr und die App zeigt „seit der Prüfung geändert“ statt „geprüft“.
// Bewusst ohne Abhängigkeiten, damit Simulatoren und Trainer diese Datei billig laden können.

import type { Freigabe, PruefArt } from './freigabe';

export type Urteil = 'freigegeben' | 'mit-aenderungen' | 'nicht-freigegeben';

export interface Erteilung {
  /** Inhalts-ID wie auf der Seite „Fachliche Freigabe“, z. B. `praxis:kh-pneumonie-sepsis`. */
  id: string;
  /** Fingerabdruck der geprüften Fassung. */
  fp: string;
  art: PruefArt;
  urteil: Urteil;
  datum: string;
  rolle: string;
  name?: string;
  bemerkung?: string;
}

/** Übernommene Prüfungen. Neue Einträge kommen aus dem Freigabe-Code der Seite #/system/freigabe. */
export const ERTEILT: Erteilung[] = [];

/** FNV-1a 32 Bit als 8 Hex-Zeichen (gleiches Verfahren wie der Prüfstand der Trainer). */
export function fnv(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

/** Fingerabdruck eines Inhalts (JSON-Form; Muster als Text, Funktionen ohne Wirkung). Aufrufer geben den
 *  Inhalt ohne Freigabe-Stand hinein, damit das Eintragen einer Prüfung den Fingerabdruck nicht ändert. */
export function inhaltsFingerabdruck(inhalt: unknown): string {
  return fnv(JSON.stringify(inhalt, (_k, v) => (v instanceof RegExp ? v.source : typeof v === 'function' ? undefined : v)));
}

/** Freigabe ohne Stand: Grundlage des Fingerabdrucks für Inhalte, die nur über ihre Freigabe beschrieben sind. */
export const freigabeKern = (f: Freigabe) => [f.lernziele, f.geltung, f.zielgruppe, f.quellen, f.prueferrolle, f.risiken, f.pruefpunkte];

export interface ErteilungsStand { erteilung: Erteilung; aktuell: boolean }

/** Neueste Prüfung zu einem Inhalt und ob sie noch zur aktuellen Fassung passt. */
export function erteilungFuer(id: string, fp: string, liste: readonly Erteilung[] = ERTEILT): ErteilungsStand | undefined {
  const e = liste.filter((x) => x.id === id).sort((a, b) => b.datum.localeCompare(a.datum))[0];
  return e ? { erteilung: e, aktuell: e.fp === fp } : undefined;
}

/**
 * Wendet eine übernommene Prüfung auf die Freigabe an. Nur „freigegeben“ durch eine Fachperson macht
 * den Inhalt „fachlich geprüft“. Ein Abgleich mit Unterrichtsmaterial wird sichtbar vermerkt, bleibt
 * aber „in fachlicher Prüfung“. Passt der Fingerabdruck nicht mehr, gilt die Prüfung nicht.
 */
export function mitErteilung(id: string, fp: string, f: Freigabe, liste: readonly Erteilung[] = ERTEILT): Freigabe {
  const st = erteilungFuer(id, fp, liste);
  if (!st) return f;
  const { erteilung: e } = st;
  const aenderungen = [...f.aenderungen, { datum: e.datum, text: `${e.art === 'fachperson' ? 'Fachliche Prüfung' : 'Abgleich mit Unterrichtsmaterial'}: ${URTEIL_TEXT[e.urteil]}` }];
  if (!st.aktuell) return { ...f, aenderungen: [...aenderungen, { datum: e.datum, text: 'Inhalt seit dieser Prüfung geändert, Prüfung erneut nötig' }] };
  if (e.urteil !== 'freigegeben') return { ...f, status: 'in-pruefung', aenderungen };
  const pruefung = { rolle: e.rolle, datum: e.datum, name: e.name, bemerkung: e.bemerkung, art: e.art };
  return { ...f, status: e.art === 'fachperson' ? 'geprueft' : 'in-pruefung', pruefung, aenderungen };
}

export const URTEIL_TEXT: Record<Urteil, string> = {
  freigegeben: 'freigegeben', 'mit-aenderungen': 'freigegeben nach Änderungen', 'nicht-freigegeben': 'nicht freigegeben',
};
