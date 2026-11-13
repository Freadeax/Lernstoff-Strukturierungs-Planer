// Gemeldete Fragen: Lernende markieren unklare oder falsche Aufgaben direkt in der Runde mit einem Klick.
// Die Meldung hält den Fingerabdruck der Fassung fest. Ändert sich die Aufgabe danach, zeigt die
// Überarbeitungsliste „seither geändert“. Solange eine Meldung „fachlich falsch“ oder „mehrere richtig“
// offen ist, zählt die Aufgabe nicht für den Lernstand (wie ein zurückgezogenes Item in einer Prüfung).
// Speicher: localStorage lernstoff.qm.meldungen (wandert mit der Datensicherung). Weitergabe an die
// betreuende Person über den Rückmeldungs-Code der Testphase (Feld `frage`).

import { storage, istObjekt } from '../../ui/lib/store';

export type Grund = 'falsch' | 'mehrdeutig' | 'unklar' | 'veraltet' | 'tippfehler' | 'sonstiges';
export const GRUND_LABEL: Record<Grund, string> = {
  falsch: 'Lösung ist fachlich falsch',
  mehrdeutig: 'Mehrere Antworten sind richtig',
  unklar: 'Frage ist unklar formuliert',
  veraltet: 'Inhalt ist veraltet',
  tippfehler: 'Tipp- oder Darstellungsfehler',
  sonstiges: 'Etwas anderes',
};
/** Gründe, bei denen die Aufgabe bis zur Klärung nicht für den Lernstand zählt. */
export const ZAEHLT_NICHT: readonly Grund[] = ['falsch', 'mehrdeutig'];

export type MeldeStatus = 'offen' | 'in-arbeit' | 'erledigt' | 'abgelehnt';
export const STATUS_LABEL: Record<MeldeStatus, string> = { offen: 'Offen', 'in-arbeit': 'In Arbeit', erledigt: 'Erledigt', abgelehnt: 'Abgelehnt' };

export interface Meldung {
  id: string;
  /** Trainer oder andere Quelle (FehlerQuelle), z. B. „notfall“ oder „simulation“. */
  quelle: string;
  aufgabeId: string;
  /** Fingerabdruck der gemeldeten Fassung (leer, wenn die Quelle keinen kennt). */
  fp: string;
  titel: string;
  frage: string;
  grund: Grund;
  notiz?: string;
  /** Was die meldende Person geantwortet hatte (hilft beim Nachvollziehen). */
  antwort?: string;
  erstellt: string;
  status: MeldeStatus;
  /** Antwort der betreuenden Person, z. B. „korrigiert in PR #…“. */
  bearbeitung?: string;
  /** Von wem (bei gesammelten Meldungen aus Rückmeldungs-Codes). */
  von?: string;
}

const K = 'lernstoff.qm.meldungen';
const GRUENDE = Object.keys(GRUND_LABEL);
const STATI = Object.keys(STATUS_LABEL);
export const istMeldung = (v: unknown): v is Meldung => istObjekt(v) && typeof v.id === 'string' && typeof v.quelle === 'string'
  && typeof v.aufgabeId === 'string' && GRUENDE.includes(v.grund as string) && STATI.includes(v.status as string);

export const ladeMeldungen = (): Meldung[] => storage.list<Meldung>(K, istMeldung);
const speichere = (l: Meldung[]) => { storage.write(K, l.slice(0, 500)); return l; };

export const neueMeldungsId = () => `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Neue Meldung. Eine offene Meldung derselben Aufgabe und Fassung wird ersetzt statt verdoppelt. */
export function melde(m: Omit<Meldung, 'id' | 'erstellt' | 'status'> & Partial<Pick<Meldung, 'id' | 'erstellt' | 'status'>>): Meldung {
  const neu: Meldung = { id: m.id ?? neueMeldungsId(), erstellt: m.erstellt ?? new Date().toISOString(), status: m.status ?? 'offen', ...m, frage: m.frage.slice(0, 600), notiz: m.notiz?.trim().slice(0, 1000) || undefined };
  const alt = ladeMeldungen().filter((x) => !(x.quelle === neu.quelle && x.aufgabeId === neu.aufgabeId && x.fp === neu.fp && x.status === 'offen' && x.id !== neu.id && !x.von));
  speichere([neu, ...alt.filter((x) => x.id !== neu.id)]);
  return neu;
}

export function setzeStatus(id: string, status: MeldeStatus, bearbeitung?: string): Meldung[] {
  return speichere(ladeMeldungen().map((m) => (m.id === id ? { ...m, status, bearbeitung: bearbeitung?.trim() || m.bearbeitung } : m)));
}
export const loescheMeldung = (id: string): Meldung[] => speichere(ladeMeldungen().filter((m) => m.id !== id));

/** Übernimmt gesammelte Meldungen (aus Rückmeldungs-Codes); gleiche ID zählt nicht doppelt. */
export function uebernimmMeldungen(neu: Meldung[]): number {
  const alt = ladeMeldungen();
  const ids = new Set(alt.map((m) => m.id));
  const dazu = neu.filter((m) => !ids.has(m.id));
  if (dazu.length) speichere([...dazu, ...alt]);
  return dazu.length;
}

export const istOffen = (m: Meldung) => m.status === 'offen' || m.status === 'in-arbeit';

/** Schlüssel „quelle:aufgabeId“ der Aufgaben, die gerade nicht für den Lernstand zählen. */
export function gesperrteAufgaben(liste: readonly Meldung[] = ladeMeldungen()): Set<string> {
  return new Set(liste.filter((m) => istOffen(m) && ZAEHLT_NICHT.includes(m.grund) && !m.von).map((m) => `${m.quelle}:${m.aufgabeId}`));
}

/** Wurde die gemeldete Aufgabe seit der Meldung geändert? (Hinweis: vielleicht schon behoben.) */
export const seitherGeaendert = (m: Meldung, aktuellerFp: string | undefined) => !!m.fp && !!aktuellerFp && m.fp !== aktuellerFp;

/** Meldeziel einer Frage der Prüfungssimulation: Trainerfragen werden ihrem Trainer zugeordnet. */
export function meldeZiel(simId: string): { quelle: string; aufgabeId: string } {
  const m = simId.match(/^trainer:([^:]+):([^:]+)/);
  return m ? { quelle: m[1]!, aufgabeId: m[2]! } : { quelle: 'simulation', aufgabeId: simId };
}
