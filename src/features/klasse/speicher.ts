import type { Abgabe, KlassenFall } from './typen';

// Alles nur in diesem Browser. Keine DB-Tabelle, damit der Klassenmodus ohne Schemawechsel auskommt.
const EIGENE = 'lernstoff.klasse.eigene';       // Fälle, die ich als Lehrkraft verteile (mit Lösung)
const ABGABEN = 'lernstoff.klasse.abgaben';     // fallId → eingelesene Abgaben
const ERHALTEN = 'lernstoff.klasse.erhalten';   // Fälle, die ich bearbeite
const ARBEIT = 'lernstoff.klasse.arbeit';       // fallId → meine Antworten
const NAME = 'lernstoff.klasse.name';

function lese<T>(key: string, fallback: T): T {
  try { return (JSON.parse(localStorage.getItem(key) ?? 'null') as T) ?? fallback; } catch { return fallback; }
}
function schreibe(key: string, wert: unknown): boolean {
  try { localStorage.setItem(key, JSON.stringify(wert)); return true; } catch { return false; }
}

// ---------- Lehrkraft ----------

export const eigeneFaelle = () => lese<KlassenFall[]>(EIGENE, []);
export function speichereEigenen(f: KlassenFall) {
  const alle = eigeneFaelle().filter((x) => x.id !== f.id);
  return schreibe(EIGENE, [f, ...alle]);
}
export function loescheEigenen(id: string) {
  schreibe(EIGENE, eigeneFaelle().filter((x) => x.id !== id));
  const ab = lese<Record<string, Abgabe[]>>(ABGABEN, {});
  delete ab[id];
  schreibe(ABGABEN, ab);
}

export const abgabenZu = (fallId: string) => lese<Record<string, Abgabe[]>>(ABGABEN, {})[fallId] ?? [];
export const alleAbgaben = () => lese<Record<string, Abgabe[]>>(ABGABEN, {});

/** Fügt Abgaben hinzu. Gleicher Name im gleichen Fall: die neuere Abgabe ersetzt die ältere. */
export function nimmAbgabenAuf(neue: Abgabe[]): { neu: number; ersetzt: number; doppelt: number } {
  const alle = alleAbgaben();
  let neu = 0; let ersetzt = 0; let doppelt = 0;
  for (const a of neue) {
    const liste = alle[a.fallId] ?? [];
    const i = liste.findIndex((x) => x.name.trim().toLowerCase() === a.name.trim().toLowerCase());
    if (i < 0) { liste.push(a); neu++; }
    else if (liste[i]!.abgegeben === a.abgegeben) doppelt++;
    else if (liste[i]!.abgegeben < a.abgegeben) { liste[i] = a; ersetzt++; }
    else doppelt++;
    alle[a.fallId] = liste;
  }
  schreibe(ABGABEN, alle);
  return { neu, ersetzt, doppelt };
}
export function entferneAbgabe(fallId: string, name: string) {
  const alle = alleAbgaben();
  alle[fallId] = (alle[fallId] ?? []).filter((x) => x.name !== name);
  schreibe(ABGABEN, alle);
}

// ---------- Klasse ----------

export interface Arbeit { antworten: Record<string, string>; abgegeben?: string; abgabe?: Abgabe }

export const erhalteneFaelle = () => lese<KlassenFall[]>(ERHALTEN, []);
export function merkeErhalten(f: KlassenFall) {
  const alle = erhalteneFaelle().filter((x) => x.id !== f.id);
  schreibe(ERHALTEN, [f, ...alle].slice(0, 30));
}
export function vergiss(id: string) {
  schreibe(ERHALTEN, erhalteneFaelle().filter((x) => x.id !== id));
  const a = lese<Record<string, Arbeit>>(ARBEIT, {});
  delete a[id];
  schreibe(ARBEIT, a);
}
export const arbeitZu = (fallId: string): Arbeit => lese<Record<string, Arbeit>>(ARBEIT, {})[fallId] ?? { antworten: {} };
export function speichereArbeit(fallId: string, a: Arbeit) {
  const alle = lese<Record<string, Arbeit>>(ARBEIT, {});
  alle[fallId] = a;
  return schreibe(ARBEIT, alle);
}

export const meinName = () => lese<string>(NAME, '');
export const merkeName = (n: string) => schreibe(NAME, n);
