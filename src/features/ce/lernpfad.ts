// Geführter Lernpfad je Thema einer CE: Skript lesen → Karteikarten → Steckbrief → Fall → Selbsttest.
// Reine Funktionen: Die Seite sammelt die Fakten (Lesestand, Kartenstand, Abfragen), hier wird
// nur entschieden, welcher Schritt erledigt ist und was als Nächstes dran ist.
//
// Grundsatz wie im Lernplan: Ein Schritt gilt nur als erledigt, wenn es dafür eine Spur gibt
// (gelesene Abschnitte, gesehene Karten, gespeicherte Abfrage). „Sicher“ kommt nur über echte Abfragen.

import type { ID, MasteryStatus } from '../../core/types';
import type { DayPlan, PlanBlock } from '../lernplan/scheduler';

export type SchrittArt = 'lesen' | 'karten' | 'steckbrief' | 'fall' | 'selbsttest';
export type SchrittZustand = 'erledigt' | 'teilweise' | 'offen' | 'entfaellt';

export const SCHRITTE: SchrittArt[] = ['lesen', 'karten', 'steckbrief', 'fall', 'selbsttest'];

export const SCHRITT_LABEL: Record<SchrittArt, string> = {
  lesen: 'Lesen', karten: 'Karteikarten', steckbrief: 'Steckbrief', fall: 'Fall', selbsttest: 'Selbsttest',
};

export interface Schritt {
  art: SchrittArt;
  zustand: SchrittZustand;
  /** Was genau zu tun ist bzw. wie weit es ist, z. B. „3 von 5 Abschnitten gelesen“. */
  text: string;
  /** Sprungziel (Hash-Pfad ohne #). */
  ziel?: string;
  /** Lässt sich von Hand abhaken (nur Steckbrief, weil Lesen dort keine Spur hinterlässt). */
  abhakbar?: boolean;
}

/** Was über ein Thema bekannt ist. Alles optional zählbar, damit fehlende Gerätedaten nur „offen“ bedeuten. */
export interface ThemaFakten {
  topicId: ID;
  skripte: Array<{ id: ID; titel: string; abschnitte: number; gelesen: number }>;
  /** Lernzeit erfasst oder vom Board als erarbeitet gemeldet (Lernplan-Status nicht „offen“). */
  erarbeitet: boolean;
  karten: { gesamt: number; gesehen: number };
  steckbriefe: Array<{ id: ID; name: string; gelesen: boolean }>;
  faelle: { anzahl: number; geuebt: boolean; ziel?: string };
  status: MasteryStatus;
  /** Anzahl echter Abfragen (ohne Selbsteinschätzung). */
  tests: number;
  /** Sprungziel für den Selbsttest; fehlt, wenn es zum Thema keine Abfrage gibt. */
  testZiel?: string;
}

export interface ThemaPfad {
  topicId: ID;
  schritte: Schritt[];
  /** Erster Schritt, der noch offen oder angefangen ist. */
  naechster?: Schritt;
  erledigt: number;
  /** Schritte, die für dieses Thema gelten (ohne „entfällt“). */
  gesamt: number;
}

const zaehl = (n: number, eins: string, viele: string) => `${n} ${n === 1 ? eins : viele}`;
const enc = encodeURIComponent;

function lesen(f: ThemaFakten): Schritt {
  const abschnitte = f.skripte.reduce((s, x) => s + x.abschnitte, 0);
  const gelesen = f.skripte.reduce((s, x) => s + Math.min(x.gelesen, x.abschnitte), 0);
  // Zuerst das Skript, in dem schon gelesen wurde, sonst das erste
  const weiter = f.skripte.find((s) => s.gelesen > 0 && s.gelesen < s.abschnitte) ?? f.skripte.find((s) => s.gelesen < s.abschnitte) ?? f.skripte[0];
  // Das Skript öffnet von selbst beim zuletzt gelesenen Abschnitt.
  const ziel = weiter ? `/lernen/skript?id=${enc(weiter.id)}` : `/lernen/skript?thema=${enc(f.topicId)}`;
  if (abschnitte > 0 && gelesen >= abschnitte) return { art: 'lesen', zustand: 'erledigt', text: `${zaehl(f.skripte.length, 'Skript', 'Skripte')} gelesen`, ziel };
  if (gelesen > 0) return { art: 'lesen', zustand: 'teilweise', text: `${gelesen} von ${zaehl(abschnitte, 'Abschnitt', 'Abschnitten')} gelesen`, ziel };
  // Ohne Lesestand zählt erfasste Lernzeit: auch Unterricht oder Lehrbuch sind Erarbeitung.
  if (f.erarbeitet) return { art: 'lesen', zustand: 'erledigt', text: 'Lernzeit erfasst', ziel };
  return {
    art: 'lesen', zustand: 'offen', ziel,
    text: weiter ? `„${weiter.titel}“ lesen` : 'Kein Skript zum Thema auf diesem Gerät: Material suchen oder Lernzeit eintragen',
  };
}

function karten(f: ThemaFakten): Schritt {
  const { gesamt, gesehen } = f.karten;
  const ziel = `/lernen/karten?thema=${enc(f.topicId)}`;
  if (!gesamt) return { art: 'karten', zustand: 'entfaellt', text: 'Keine Karteikarten zum Thema' };
  if (gesehen >= gesamt) return { art: 'karten', zustand: 'erledigt', text: `Alle ${gesamt} Karten gelernt`, ziel };
  if (gesehen > 0) return { art: 'karten', zustand: 'teilweise', text: `${gesehen} von ${zaehl(gesamt, 'Karte', 'Karten')} gelernt`, ziel };
  return { art: 'karten', zustand: 'offen', text: `${zaehl(gesamt, 'Karte', 'Karten')} lernen`, ziel };
}

function steckbrief(f: ThemaFakten): Schritt {
  const s = f.steckbriefe;
  if (!s.length) return { art: 'steckbrief', zustand: 'entfaellt', text: 'Kein Krankheitsbild zum Thema' };
  const offen = s.filter((x) => !x.gelesen);
  const ziel = `/lernen/krankheitsbilder?kb=${enc((offen[0] ?? s[0]!).id)}`;
  if (!offen.length) return { art: 'steckbrief', zustand: 'erledigt', text: s.map((x) => x.name).join(', '), ziel, abhakbar: true };
  return {
    art: 'steckbrief', zustand: offen.length < s.length ? 'teilweise' : 'offen', ziel, abhakbar: true,
    text: `${offen.map((x) => x.name).join(', ')} lesen`,
  };
}

function fall(f: ThemaFakten): Schritt {
  if (!f.faelle.anzahl) return { art: 'fall', zustand: 'entfaellt', text: 'Kein Fall zum Thema' };
  if (f.faelle.geuebt) return { art: 'fall', zustand: 'erledigt', text: 'Fall bearbeitet', ziel: f.faelle.ziel };
  return { art: 'fall', zustand: 'offen', text: `${zaehl(f.faelle.anzahl, 'Fall', 'Fälle')} zum Üben`, ziel: f.faelle.ziel };
}

function selbsttest(f: ThemaFakten): Schritt {
  if (f.status === 'sicher') return { art: 'selbsttest', zustand: 'erledigt', text: 'Sicher (durch Abfragen belegt)', ziel: f.testZiel };
  if (!f.testZiel && !f.tests) return { art: 'selbsttest', zustand: 'entfaellt', text: 'Noch keine Abfrage zu diesem Thema' };
  if (f.tests > 0) return { art: 'selbsttest', zustand: 'teilweise', text: `${zaehl(f.tests, 'Abfrage', 'Abfragen')}, noch nicht sicher: wiederholen`, ziel: f.testZiel };
  return { art: 'selbsttest', zustand: 'offen', text: 'Wissen abfragen', ziel: f.testZiel };
}

export function themaPfad(f: ThemaFakten): ThemaPfad {
  const schritte = [lesen(f), karten(f), steckbrief(f), fall(f), selbsttest(f)];
  const gilt = schritte.filter((s) => s.zustand !== 'entfaellt');
  return {
    topicId: f.topicId,
    schritte,
    naechster: gilt.find((s) => s.zustand !== 'erledigt'),
    erledigt: gilt.filter((s) => s.zustand === 'erledigt').length,
    gesamt: gilt.length,
  };
}

export interface CePfad {
  erledigt: number;
  gesamt: number;
  /** Themen, deren Pfad komplett erledigt ist. */
  fertig: number;
  /** Nächster Schritt in Pfadreihenfolge: erst angefangene Themen fertig machen, dann das nächste beginnen. */
  weiter?: { topicId: ID; schritt: Schritt };
}

export function cePfad(pfade: ThemaPfad[]): CePfad {
  const angefangen = pfade.find((p) => p.naechster && p.erledigt > 0);
  const naechstes = angefangen ?? pfade.find((p) => p.naechster);
  return {
    erledigt: pfade.reduce((s, p) => s + p.erledigt, 0),
    gesamt: pfade.reduce((s, p) => s + p.gesamt, 0),
    fertig: pfade.filter((p) => !p.naechster).length,
    weiter: naechstes?.naechster ? { topicId: naechstes.topicId, schritt: naechstes.naechster } : undefined,
  };
}

// ---------------------------------------------------------------- Wochenplan einer CE

export interface CeTag { date: string; capacityMinutes: number; blocks: PlanBlock[]; minuten: number }

/** Die Tage ab `von` (Standard: 7) mit den Lernplan-Blöcken, die Themen dieser CE betreffen. */
export function ceWoche(days: DayPlan[], themen: Set<ID>, von: string, tage = 7): CeTag[] {
  const bis = new Date(Date.parse(`${von}T12:00:00Z`) + (tage - 1) * 864e5).toISOString().slice(0, 10);
  return days.filter((d) => d.date >= von && d.date <= bis).map((d) => {
    const blocks = d.blocks.filter((b) => themen.has(b.topicId));
    return { date: d.date, capacityMinutes: d.capacityMinutes, blocks, minuten: blocks.reduce((s, b) => s + b.minutes, 0) };
  });
}

// ---------------------------------------------------------------- Abgehakte Steckbriefe (localStorage)

const KEY = 'lernstoff.lernpfad';

/** Von Hand abgehakte Schritte: Schlüssel „steckbrief:<profilId>“ → Datum. Wandert mit der Datensicherung. */
export type Haken = Record<string, { datum: string }>;

export function ladeHaken(): Haken {
  try { return (JSON.parse(localStorage.getItem(KEY) ?? 'null') as Haken) ?? {}; } catch { return {}; }
}

export function setzeHaken(schluessel: string, an: boolean, datum: string): Haken {
  const alle = ladeHaken();
  if (an) alle[schluessel] = { datum }; else delete alle[schluessel];
  try { localStorage.setItem(KEY, JSON.stringify(alle)); } catch { /* privater Modus */ }
  return alle;
}

export const steckbriefHaken = (profilId: ID) => `steckbrief:${profilId}`;
