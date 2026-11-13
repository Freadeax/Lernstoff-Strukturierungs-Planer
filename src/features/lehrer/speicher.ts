import { istObjekt, storage } from '../../ui/lib/store';
import { alleAbgaben, benenneAbgabeUm, eigeneFaelle, entferneAbgabe, loescheAbgaben, loescheEigenen } from '../klasse/speicher';
import { neueId } from '../klasse/typen';
import { ordneSchluessel, STANDARD_SCHLUESSEL } from './noten';
import { nameSchluessel, type Bewertung, type Klasse, type Notenstufe } from './typen';

// Alles nur in diesem Browser, wie der Klassenmodus. Keine DB-Tabelle, kein Schemawechsel.
const KLASSEN = 'lernstoff.lehrer.klassen';
const BEWERTUNGEN = 'lernstoff.lehrer.bewertungen';   // fallId → nameSchluessel → Bewertung
const SCHLUESSEL = 'lernstoff.lehrer.schluessel';
const BAUSTEINE = 'lernstoff.lehrer.bausteine';

const istKlasse = (v: unknown) => istObjekt(v) && typeof v.id === 'string' && typeof v.name === 'string' && Array.isArray(v.lernende) && Array.isArray(v.faelle);
const istBewertung = (v: unknown) => istObjekt(v) && typeof v.fallId === 'string' && typeof v.name === 'string' && istObjekt(v.punkte) && istObjekt(v.kommentare);

// ---------- Klassen ----------

export const klassen = (): Klasse[] => storage.list<Klasse>(KLASSEN, istKlasse).map((k) => ({
  ...k, lernende: k.lernende.filter((n) => typeof n === 'string'), faelle: k.faelle.filter((f) => typeof f === 'string'),
}));

export const klasseMitId = (id: string) => klassen().find((k) => k.id === id) ?? null;

export function neueKlasse(name: string): Klasse {
  return { id: neueId(), name: name.trim() || 'Neue Klasse', lernende: [], faelle: [], erstellt: new Date().toISOString() };
}

export function speichereKlasse(k: Klasse): boolean {
  const lernende: string[] = [];
  for (const n of k.lernende.map((x) => x.trim()).filter(Boolean)) if (!lernende.some((x) => nameSchluessel(x) === nameSchluessel(n))) lernende.push(n);
  const sauber = { ...k, name: k.name.trim() || 'Klasse', lernende, faelle: [...new Set(k.faelle)] };
  return storage.write(KLASSEN, [sauber, ...klassen().filter((x) => x.id !== k.id)]);
}

/** Nur die Klasse (Name, Liste). Fälle und Abgaben bleiben, außer `mitDaten`. */
export function loescheKlasse(id: string, mitDaten = false) {
  const k = klasseMitId(id);
  storage.write(KLASSEN, klassen().filter((x) => x.id !== id));
  if (mitDaten && k) for (const f of k.faelle) if (!klassen().some((x) => x.faelle.includes(f))) loescheFallKomplett(f);
}

export const klassenVonFall = (fallId: string) => klassen().filter((k) => k.faelle.includes(fallId));

/** Fall einer Klasse zuordnen oder (klasseId leer) aus allen Klassen lösen. Mehrere Klassen sind möglich. */
export function ordneFallZu(fallId: string, klasseId: string, an = true) {
  const k = klasseMitId(klasseId);
  if (!k) return;
  const faelle = an ? [...new Set([...k.faelle, fallId])] : k.faelle.filter((f) => f !== fallId);
  speichereKlasse({ ...k, faelle });
}

export function nimmInListeAuf(klasseId: string, name: string) {
  const k = klasseMitId(klasseId);
  if (k) speichereKlasse({ ...k, lernende: [...k.lernende, name] });
}

// ---------- Bewertungen ----------

function leseBewertungen(): Record<string, Record<string, Bewertung>> {
  const roh = storage.read<Record<string, unknown>>(BEWERTUNGEN, {});
  const out: Record<string, Record<string, Bewertung>> = {};
  for (const [fallId, je] of Object.entries(roh)) {
    if (!istObjekt(je)) continue;
    const gut: Record<string, Bewertung> = {};
    for (const [k, b] of Object.entries(je)) if (istBewertung(b)) gut[k] = b as unknown as Bewertung;
    out[fallId] = gut;
  }
  return out;
}

export const bewertungenZu = (fallId: string): Record<string, Bewertung> => leseBewertungen()[fallId] ?? {};
export const bewertungVon = (fallId: string, name: string): Bewertung | null => bewertungenZu(fallId)[nameSchluessel(name)] ?? null;
export const alleBewertungen = () => leseBewertungen();

export function speichereBewertung(b: Bewertung): boolean {
  const alle = leseBewertungen();
  alle[b.fallId] = { ...(alle[b.fallId] ?? {}), [nameSchluessel(b.name)]: b };
  return storage.write(BEWERTUNGEN, alle);
}

export function markiereGesendet(fallId: string, name: string) {
  const b = bewertungVon(fallId, name);
  if (b) speichereBewertung({ ...b, gesendet: new Date().toISOString() });
}

export function loescheBewertung(fallId: string, name: string) {
  const alle = leseBewertungen();
  if (alle[fallId]) delete alle[fallId][nameSchluessel(name)];
  storage.write(BEWERTUNGEN, alle);
}

function loescheBewertungenZu(fallId: string) {
  const alle = leseBewertungen();
  delete alle[fallId];
  storage.write(BEWERTUNGEN, alle);
}

// ---------- Fälle und Abgaben, mit Bewertungen zusammen ----------

/** Fall, Abgaben, Bewertungen und Zuordnungen löschen. */
export function loescheFallKomplett(fallId: string) {
  loescheEigenen(fallId);
  loescheBewertungenZu(fallId);
  const ks = klassen();
  if (ks.some((k) => k.faelle.includes(fallId))) storage.write(KLASSEN, ks.map((k) => ({ ...k, faelle: k.faelle.filter((f) => f !== fallId) })));
}

/** Alle Abgaben und Bewertungen eines Falls löschen (nach Notenvergabe), der Fall selbst bleibt. */
export function loescheAbgabenUndBewertungen(fallId: string) {
  loescheAbgaben(fallId);
  loescheBewertungenZu(fallId);
}

export function entferneAbgabeUndBewertung(fallId: string, name: string) {
  entferneAbgabe(fallId, name);
  loescheBewertung(fallId, name);
}

/** Abgabe (und eine vorhandene Bewertung) einem anderen Namen zuordnen. */
export function ordneAbgabeZu(fallId: string, alt: string, neu: string): boolean {
  if (!benenneAbgabeUm(fallId, alt, neu)) return false;
  const b = bewertungVon(fallId, alt);
  if (b && !bewertungVon(fallId, neu)) {
    loescheBewertung(fallId, alt);
    speichereBewertung({ ...b, name: neu.trim() });
  }
  return true;
}

/** Was an personenbezogenen Daten auf diesem Gerät liegt (Hinweis im Datenschutz-Bereich). */
export function datenbestand() {
  const abgaben = Object.values(alleAbgaben()).reduce((s, l) => s + l.length, 0);
  const bewertungen = Object.values(leseBewertungen()).reduce((s, je) => s + Object.keys(je).length, 0);
  const lernende = klassen().reduce((s, k) => s + k.lernende.length, 0);
  return { faelle: eigeneFaelle().length, klassen: klassen().length, lernende, abgaben, bewertungen };
}

/** Alles aus dem Lehrermodus löschen: Klassen, Bewertungen, verteilte Fälle mit Abgaben. */
export function loescheAllesLehrer() {
  for (const f of eigeneFaelle()) loescheEigenen(f.id);
  for (const id of Object.keys(alleAbgaben())) loescheAbgaben(id);
  storage.write(KLASSEN, null);
  storage.write(BEWERTUNGEN, null);
}

// ---------- Einstellungen ----------

export const notenschluessel = (): Notenstufe[] => ordneSchluessel(storage.list<Notenstufe>(SCHLUESSEL, (v) => istObjekt(v) && typeof v.note === 'string' && typeof v.ab === 'number'));
export const speichereSchluessel = (s: Notenstufe[] | null) => storage.write(SCHLUESSEL, s ? ordneSchluessel(s) : null);
export const istStandardSchluessel = (s: Notenstufe[]) => JSON.stringify(s) === JSON.stringify(STANDARD_SCHLUESSEL);

export const STANDARD_BAUSTEINE = [
  'Sehr gut begründet.',
  'Fachbegriffe korrekt verwendet.',
  'Begründung fehlt.',
  'Bitte konkreter auf die Person im Fall beziehen.',
  'Pflegeprobleme bitte im PESR-Format.',
  'Ressourcen nicht vergessen.',
];
export const bausteine = (): string[] => {
  const l = storage.read<unknown[]>(BAUSTEINE, []).filter((x): x is string => typeof x === 'string' && !!x.trim());
  return l.length ? l : STANDARD_BAUSTEINE;
};
export const speichereBausteine = (l: string[] | null) => storage.write(BAUSTEINE, l ? l.map((x) => x.trim()).filter(Boolean) : null);
