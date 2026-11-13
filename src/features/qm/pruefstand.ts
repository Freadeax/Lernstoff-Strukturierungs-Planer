// Prüfstand und Versionierung der Übungsaufgaben (Vorbild: Fragenversionen und Status in Moodle 4).
// pruefstand.json hält je Trainer den Fingerabdruck jeder Aufgabe zum Zeitpunkt der letzten Erfassung
// oder fachlichen Prüfung. Weicht der aktuelle Fingerabdruck ab, gilt die Aufgabe als „geändert seit
// Prüfung“; neue Aufgaben gelten als ungeprüft. Eine Fachperson kann auf dem Gerät einen Prüfvermerk
// setzen (lokal, wandert mit der Datensicherung); als Text kopiert, wird er dauerhaft eingetragen.
// Neu erfassen: QM_PRUEFSTAND_SCHREIBEN=1 npx vitest run src/features/qm/pruefstand.test.ts
// (optional QM_TRAINER=notfall,recht und QM_GEPRUEFT="JJJJ-MM-TT|Name|Rolle").

import type { Aufgabe } from '../quiz/quiz';
import { storage, istObjekt } from '../../ui/lib/store';
import { fingerabdruck } from './fingerabdruck';
import basis from './pruefstand.json';

export interface Pruefvermerk { am: string; von: string; rolle: string; bemerkung?: string }

export interface TrainerStand {
  /** Wann die Fingerabdrücke zuletzt erfasst wurden. */
  erfasstAm: string;
  /** Letzte fachliche Prüfung dieser Fassung, falls es eine gab. */
  geprueft: Pruefvermerk | null;
  fps: Record<string, string>;
}

export interface Pruefstand { trainer: Record<string, TrainerStand> }

export const PRUEFSTAND = basis as Pruefstand;

/** Nach so vielen Tagen ist eine Prüfung fällig, auch ohne Änderung (jährliche Durchsicht). */
export const FAELLIG_NACH_TAGEN = 365;

export interface Vergleich { neu: string[]; geaendert: string[]; entfernt: string[]; gleich: number }

export function vergleiche(aufgaben: readonly Aufgabe[], fps: Readonly<Record<string, string>>): Vergleich {
  const out: Vergleich = { neu: [], geaendert: [], entfernt: [], gleich: 0 };
  const ids = new Set<string>();
  for (const a of aufgaben) {
    ids.add(a.id);
    const alt = fps[a.id];
    if (!alt) out.neu.push(a.id);
    else if (alt !== fingerabdruck(a)) out.geaendert.push(a.id);
    else out.gleich++;
  }
  for (const id of Object.keys(fps)) if (!ids.has(id)) out.entfernt.push(id);
  return out;
}

export const fingerabdruecke = (aufgaben: readonly Aufgabe[]): Record<string, string> =>
  Object.fromEntries([...aufgaben].sort((x, y) => x.id.localeCompare(y.id)).map((a) => [a.id, fingerabdruck(a)]));

// ---------- Lokale Prüfvermerke ----------

const K_VERMERKE = 'lernstoff.qm.pruefvermerke';
export interface LokalerVermerk extends Pruefvermerk { quelle: string; fps: Record<string, string> }

const istVermerk = (v: unknown): boolean => istObjekt(v) && typeof v.quelle === 'string' && typeof v.am === 'string' && istObjekt(v.fps);
export const ladeVermerke = (): LokalerVermerk[] => storage.list<LokalerVermerk>(K_VERMERKE, istVermerk);

export function setzeVermerk(quelle: string, aufgaben: readonly Aufgabe[], v: Pruefvermerk): LokalerVermerk[] {
  const neu: LokalerVermerk = { ...v, quelle, fps: fingerabdruecke(aufgaben) };
  const liste = [neu, ...ladeVermerke().filter((x) => x.quelle !== quelle)];
  storage.write(K_VERMERKE, liste);
  return liste;
}
export function entferneVermerk(quelle: string): LokalerVermerk[] {
  const liste = ladeVermerke().filter((x) => x.quelle !== quelle);
  storage.write(K_VERMERKE, liste);
  return liste;
}

/** Text zum Weitergeben: so kann der Vermerk dauerhaft in pruefstand.json eingetragen werden. */
export const vermerkText = (v: LokalerVermerk, name: string) =>
  `Prüfvermerk Lernstoff-Planer: Trainer ${name} (${v.quelle}) fachlich geprüft am ${v.am} von ${v.von} (${v.rolle})` +
  `${v.bemerkung ? `. Bemerkung: ${v.bemerkung}` : ''}. ${Object.keys(v.fps).length} Aufgaben, Prüfsumme ${pruefsumme(v.fps)}.`;

/** Kurze Prüfsumme über alle Fingerabdrücke, damit ein Vermerk eindeutig einer Fassung zugeordnet ist. */
export function pruefsumme(fps: Readonly<Record<string, string>>): string {
  let h = 0;
  for (const [id, fp] of Object.entries(fps).sort(([x], [y]) => x.localeCompare(y))) for (const c of id + fp) h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0;
  return h.toString(16).padStart(8, '0');
}

// ---------- Status je Trainer ----------

export type Status = 'geprueft' | 'geaendert' | 'faellig' | 'ungeprueft';
export const STATUS_LABEL: Record<Status, string> = {
  geprueft: 'Fachlich geprüft', geaendert: 'Geändert seit Prüfung', faellig: 'Prüfung fällig', ungeprueft: 'Fachlich ungeprüft',
};

export interface StandErgebnis {
  status: Status;
  /** Letzte Prüfung (dauerhaft oder auf diesem Gerät). */
  pruefung?: Pruefvermerk & { lokal: boolean };
  /** Vergleich gegen die Fassung der letzten Prüfung oder, ohne Prüfung, der letzten Erfassung. */
  vergleich: Vergleich;
  erfasstAm?: string;
  tageSeitPruefung?: number;
}

const tage = (von: string, bis: string) => Math.floor((Date.parse(bis) - Date.parse(von)) / 86_400_000);

export function trainerStand(quelle: string, aufgaben: readonly Aufgabe[], heute: string, stand: Pruefstand = PRUEFSTAND, lokal: LokalerVermerk[] = []): StandErgebnis {
  const b = stand.trainer[quelle];
  const l = lokal.find((v) => v.quelle === quelle);
  // Der jüngere Prüfvermerk gilt
  const nimmLokal = !!l && (!b?.geprueft || l.am >= b.geprueft.am);
  const pruefung = nimmLokal ? { am: l!.am, von: l!.von, rolle: l!.rolle, bemerkung: l!.bemerkung, lokal: true } : b?.geprueft ? { ...b.geprueft, lokal: false } : undefined;
  const fps = nimmLokal ? l!.fps : b?.fps ?? {};
  const vergleich = vergleiche(aufgaben, fps);
  const geaendert = vergleich.neu.length + vergleich.geaendert.length > 0;
  if (!pruefung) return { status: 'ungeprueft', vergleich, erfasstAm: b?.erfasstAm };
  const t = tage(pruefung.am, heute);
  const status: Status = geaendert ? 'geaendert' : t > FAELLIG_NACH_TAGEN ? 'faellig' : 'geprueft';
  return { status, pruefung, vergleich, erfasstAm: b?.erfasstAm, tageSeitPruefung: t };
}

/** Für eine einzelne Aufgabe: Stand ihrer Fassung. */
export type AufgabenStand = 'geprueft' | 'geaendert' | 'neu' | 'ungeprueft';
export function aufgabenStand(a: Aufgabe, e: StandErgebnis): AufgabenStand {
  if (e.vergleich.neu.includes(a.id)) return e.pruefung ? 'neu' : 'ungeprueft';
  if (e.vergleich.geaendert.includes(a.id)) return 'geaendert';
  return e.pruefung ? 'geprueft' : 'ungeprueft';
}
