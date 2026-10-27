import { istObjekt, storage } from '../../ui/lib/store';
import { pruefeFall } from './kodierung';
import type { Abgabe, KlassenFall } from './typen';

// Alles nur in diesem Browser. Keine DB-Tabelle, damit der Klassenmodus ohne Schemawechsel auskommt.
const EIGENE = 'lernstoff.klasse.eigene';       // Fälle, die ich als Lehrkraft verteile (mit Lösung)
const ABGABEN = 'lernstoff.klasse.abgaben';     // fallId → eingelesene Abgaben
const ERHALTEN = 'lernstoff.klasse.erhalten';   // Fälle, die ich bearbeite
const ARBEIT = 'lernstoff.klasse.arbeit';       // fallId → meine Antworten
const NAME = 'lernstoff.klasse.name';

const lese = storage.read;
const schreibe = (key: string, wert: unknown) => storage.write(key, wert);

/** Ein gespeicherter Fall, der die Prüfung der Link-Fälle besteht. Kaputte Einträge fallen weg. */
function istFall(v: unknown): boolean {
  try { pruefeFall(v); return true; } catch { return false; }
}
const istAbgabe = (v: unknown) => istObjekt(v) && typeof v.name === 'string' && typeof v.abgegeben === 'string' && istObjekt(v.antworten);
const istArbeit = (v: unknown) => istObjekt(v) && istObjekt(v.antworten);

/** fallId → Einträge; Einträge mit falscher Form fallen weg, statt die Seite abstürzen zu lassen. */
function leseJeFall<T>(key: string, gueltig: (v: unknown) => boolean): Record<string, T> {
  const roh = lese<Record<string, unknown>>(key, {});
  const out: Record<string, T> = {};
  for (const [id, wert] of Object.entries(roh)) {
    if (Array.isArray(wert)) out[id] = wert.filter(gueltig) as T;
    else if (gueltig(wert)) out[id] = wert as T;
  }
  return out;
}
const leseAbgaben = () => leseJeFall<Abgabe[]>(ABGABEN, istAbgabe);
const leseArbeit = () => leseJeFall<Arbeit>(ARBEIT, istArbeit);

// ---------- Lehrkraft ----------

export const eigeneFaelle = () => storage.list<KlassenFall>(EIGENE, istFall);
export function speichereEigenen(f: KlassenFall) {
  const alle = eigeneFaelle().filter((x) => x.id !== f.id);
  return schreibe(EIGENE, [f, ...alle]);
}
export function loescheEigenen(id: string) {
  schreibe(EIGENE, eigeneFaelle().filter((x) => x.id !== id));
  const ab = leseAbgaben();
  delete ab[id];
  schreibe(ABGABEN, ab);
}

export const abgabenZu = (fallId: string) => leseAbgaben()[fallId] ?? [];
export const alleAbgaben = () => leseAbgaben();

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

export const erhalteneFaelle = () => storage.list<KlassenFall>(ERHALTEN, istFall);
export function merkeErhalten(f: KlassenFall) {
  const alle = erhalteneFaelle().filter((x) => x.id !== f.id);
  schreibe(ERHALTEN, [f, ...alle].slice(0, 30));
}
export function vergiss(id: string) {
  schreibe(ERHALTEN, erhalteneFaelle().filter((x) => x.id !== id));
  const a = leseArbeit();
  delete a[id];
  schreibe(ARBEIT, a);
}
export const arbeitZu = (fallId: string): Arbeit => leseArbeit()[fallId] ?? { antworten: {} };
export function speichereArbeit(fallId: string, a: Arbeit) {
  const alle = leseArbeit();
  alle[fallId] = a;
  return schreibe(ARBEIT, alle);
}

export const meinName = () => lese<string>(NAME, '');
export const merkeName = (n: string) => schreibe(NAME, n);
