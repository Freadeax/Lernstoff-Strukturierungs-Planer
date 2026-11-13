import { pruefeAntwort, quote } from '../klasse/auswertung';
import type { Abgabe, Aufgabe, KlassenFall, Rueckmeldung } from '../klasse/typen';
import { istWahl } from '../klasse/typen';
import { pruefeWahl } from '../klasse/wahl';
import { noteFuer, prozent } from './noten';
import type { Bewertung, Notenstufe } from './typen';

// Rechnen rund um eine Bewertung. Vorschläge kommen aus dem Code (Auswahl richtig/falsch,
// Kernpunkte gefunden), die Entscheidung trifft immer die Lehrkraft.

/** Auf halbe Punkte runden, wie es in Klausuren üblich ist. */
export const halbe = (n: number) => Math.round(n * 2) / 2;

export interface Vorschlag { punkte: number; grund: string }

export function vorschlag(aufgabe: Aufgabe, antwort: string | undefined): Vorschlag | null {
  const max = aufgabe.punkte;
  if (!max) return null;
  if (istWahl(aufgabe)) {
    const w = pruefeWahl(aufgabe, antwort);
    if (!w) return null;
    return { punkte: halbe(w.teil * max), grund: w.richtig ? 'Auswahl richtig' : aufgabe.mehrfach ? `${Math.round(w.teil * 100)} % der Optionen richtig` : 'Auswahl falsch' };
  }
  const t = pruefeAntwort(aufgabe, antwort ?? '');
  const q = quote(t);
  if (q === null) return null;
  return { punkte: halbe((q / 100) * max), grund: `${t.filter((x) => x.ok).length} von ${t.length} Kernpunkten gefunden` };
}

export function leereBewertung(fall: KlassenFall, abgabe: Abgabe): Bewertung {
  return { fallId: fall.id, name: abgabe.name, punkte: {}, kommentare: {}, kommentar: '', abgabeVom: abgabe.abgegeben, bewertet: '' };
}

/** Alle Vorschläge eintragen, ohne schon vergebene Punkte zu überschreiben. */
export function mitVorschlaegen(fall: KlassenFall, abgabe: Abgabe, b: Bewertung): Bewertung {
  const punkte = { ...b.punkte };
  for (const a of fall.aufgaben) {
    if (punkte[a.id] !== undefined) continue;
    const v = vorschlag(a, abgabe.antworten[a.id]);
    if (v) punkte[a.id] = v.punkte;
  }
  return { ...b, punkte };
}

export interface Ergebnis { punkte: number; max: number; prozent: number | null; note: string | null; vollstaendig: boolean }

/** Summe über alle Aufgaben mit Punkten. Note nur, wenn jede Aufgabe mit Punkten bewertet ist. */
export function ergebnis(fall: KlassenFall, b: Bewertung | null, schluessel: Notenstufe[]): Ergebnis {
  const mit = fall.aufgaben.filter((a) => a.punkte && a.punkte > 0);
  const max = mit.reduce((s, a) => s + a.punkte!, 0);
  const punkte = mit.reduce((s, a) => s + Math.min(a.punkte!, Math.max(0, b?.punkte[a.id] ?? 0)), 0);
  const vollstaendig = !!b && mit.length > 0 && mit.every((a) => typeof b.punkte[a.id] === 'number');
  const p = max > 0 && b ? prozent(punkte, max) : null;
  return { punkte, max, prozent: p, note: vollstaendig && p !== null ? noteFuer(p, schluessel) : null, vollstaendig };
}

/** Was die Person zurückbekommt. Keine Antworten anderer, keine Lösung (die kommt über den Lösungslink). */
export function rueckmeldungAus(fall: KlassenFall, b: Bewertung, schluessel: Notenstufe[], mitNote: boolean): Rueckmeldung {
  const e = ergebnis(fall, b, schluessel);
  return {
    v: 1, fallId: fall.id, titel: fall.titel, name: b.name, von: fall.von,
    aufgaben: fall.aufgaben.map((a) => ({
      id: a.id, frage: a.frage.length > 160 ? a.frage.slice(0, 157) + '…' : a.frage,
      punkte: a.punkte ? b.punkte[a.id] : undefined, max: a.punkte || undefined,
      kommentar: b.kommentare[a.id]?.trim() || undefined,
    })),
    punkte: e.max ? e.punkte : undefined, max: e.max || undefined,
    note: mitNote && e.note ? e.note : undefined,
    kommentar: b.kommentar.trim() || undefined,
    bewertet: b.bewertet || new Date().toISOString(),
  };
}

/** Text zum Teilen, mit Link. */
export function rueckmeldungText(r: Rueckmeldung, link: string): string {
  const kopf = [`Rückmeldung zu „${r.titel}“ für ${r.name}`];
  if (r.max) kopf.push(`${r.punkte ?? 0} von ${r.max} Punkten${r.note ? `, Note ${r.note}` : ''}`);
  if (r.kommentar) kopf.push('', r.kommentar);
  kopf.push('', 'Im Lernstoff-Planer neben deinen Antworten öffnen:', link);
  return kopf.join('\n');
}
