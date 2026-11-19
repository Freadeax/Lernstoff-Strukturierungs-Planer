// Praxissimulator neu – Kommunikationsbereich (Paket P11): reine Ansichtslogik über dem Kern.
// Gesprächspartner mit Ungelesen-Zähler, Chatverlauf je Faden, Bausteine (SBAR + Messwerte + Zusage),
// offene Rückaufträge mit Frist und die Offline-Zuordnung von Freitext zu Bausteinen („verstanden als …“).
// Keine Fachlogik: Antworten, Fristen und Status kommen aus kern/kommunikation.ts.

import { gilt, type Meldung, type SimZustand } from '../kern/kern';
import {
  arztKanaele, auftragsListe, GEGENUEBER_NAME, wertBausteine, ZUSAGE_ID, ZUSAGE_TEXT, type AuftragZeile,
} from '../kern/kommunikation';
import type { Gegenueber, GespraechsEintrag, Kanal, SbarBaustein, SbarTeil } from '../kern/typen';
import { sbarBausteine } from './ansicht';

export interface Partner {
  id: Gegenueber;
  name: string;
  /** Rolle in einem Wort, z. B. „Hausärztin“, „Patientin“ */
  rolle: string;
  kuerzel: string;
  kanaele: Kanal[];
  /** Fragen/Sätze aus dem Fall, die jetzt angeboten werden */
  fragen: GespraechsEintrag[];
  /** Eingabe über Bausteine (Ärztin, Übergabe an Rettungsdienst/Station) */
  bausteine: boolean;
  ungelesen: number;
  telefonOffen: boolean;
}

const KUERZEL: Record<Gegenueber, string> = {
  patient: 'P', angehoerige: 'A', eltern: 'E', betreuer: 'B', aerztin: 'Ä', kollegin: 'K', pa: 'PA', rettungsdienst: 'RD', 'aufnehmende-station': 'St',
};
const REIHENFOLGE: Gegenueber[] = ['aerztin', 'patient', 'angehoerige', 'eltern', 'betreuer', 'kollegin', 'pa', 'rettungsdienst', 'aufnehmende-station'];

/** Meldungen dieses Fadens (PA: auch Hinweise der Praxisanleitung ohne Faden) */
export function fadenMeldungen(z: SimZustand, an: Gegenueber): Meldung[] {
  return z.meldungen.filter((m) => m.faden === an || (an === 'pa' && m.art === 'pa' && !m.faden));
}

/** Gesprächspartner dieses Falls: Ärztin, Patient und PA immer; die anderen, wenn der Fall sie vorsieht. */
export function partner(z: SimZustand, gelesen: Partial<Record<Gegenueber, number>> = {}): Partner[] {
  const f = z.fall;
  const fragenAn = (an: Gegenueber) => f.gespraech.filter((g) => g.an === an && (!g.nurWenn || gilt(z, g.nurWenn)));
  const imFall = (an: Gegenueber) => f.gespraech.some((g) => g.an === an) || !!f.team?.weitere?.[an] || (an === 'kollegin' && !!f.team?.kollegin);
  const name = (an: Gegenueber): string => {
    switch (an) {
      case 'aerztin': return f.arzt.name;
      case 'patient': return f.person.name;
      case 'pa': return f.pa.name;
      case 'kollegin': return f.team?.kollegin ?? f.team?.weitere?.kollegin ?? 'Kollegin';
      default: return f.team?.weitere?.[an] ?? GEGENUEBER_NAME[an];
    }
  };
  const rolle = (an: Gegenueber): string => an === 'patient'
    ? (f.altersgruppe === 'saeugling' || f.altersgruppe === 'kleinkind' ? 'Kind' : f.setting === 'langzeit' ? 'Bewohner/in' : f.person.geschlecht === 'w' ? 'Patientin' : 'Patient')
    : an === 'aerztin' ? (f.arzt.erreichbar === 'hausarzt-praxis' ? 'Hausarztpraxis' : 'Ärztlicher Dienst') : GEGENUEBER_NAME[an];
  return REIHENFOLGE.filter((an) => an === 'aerztin' || an === 'patient' || (an === 'pa' && z.stufe < 3) || imFall(an)).map((an) => {
    const ms = fadenMeldungen(z, an);
    const ab = gelesen[an] ?? 0;
    return {
      id: an, name: name(an), rolle: rolle(an), kuerzel: KUERZEL[an],
      kanaele: an === 'aerztin' ? arztKanaele(z) : an === 'rettungsdienst' || an === 'aufnehmende-station' ? ['telefon'] : ['vor-ort'],
      fragen: fragenAn(an),
      bausteine: an === 'aerztin' || an === 'rettungsdienst' || an === 'aufnehmende-station',
      ungelesen: ms.filter((m, i) => i >= ab && m.richtung === 'rein').length,
      telefonOffen: !!z.komm.faeden[an]?.telefonOffen,
    };
  });
}

/** Wie viele Meldungen des Fadens es gibt (Stand „gelesen“ nach dem Öffnen) */
export const fadenLaenge = (z: SimZustand, an: Gegenueber) => fadenMeldungen(z, an).length;

/* ─────────────────────────── Bausteine ─────────────────────────── */

export interface BausteinGruppe { teil: SbarTeil | 'W' | 'Z'; titel: string; frage: string; liste: SbarBaustein[] }

/** SBAR-Teile (nur Bekanntes), Messwerte als eigene Gruppe, Zusage „melde mich“ nur bei offener Rückfrage. */
export function bausteinGruppen(z: SimZustand, an: Gegenueber): BausteinGruppe[] {
  const sbar = sbarBausteine(z);
  const g: BausteinGruppe[] = [
    { teil: 'S', titel: 'Situation', frage: 'Wer? Was ist jetzt los?', liste: sbar.S },
    { teil: 'B', titel: 'Hintergrund', frage: 'Was ist bekannt?', liste: sbar.B },
    { teil: 'A', titel: 'Einschätzung', frage: 'Was hast du erhoben, was vermutest du?', liste: sbar.A },
    { teil: 'W', titel: 'Messwerte', frage: 'zuletzt gemessen', liste: wertBausteine(z) },
    { teil: 'R', titel: 'Empfehlung', frage: an === 'aerztin' ? 'Was brauchst du von der Ärztin?' : 'Worauf soll geachtet werden?', liste: sbar.R },
  ];
  if (an === 'aerztin' && rueckfrage(z)) g.unshift({ teil: 'Z', titel: 'Antwort auf die Rückfrage', frage: 'Wert noch nicht da?', liste: [{ id: ZUSAGE_ID, teil: 'R', text: ZUSAGE_TEXT, art: 'hilfreich' }] });
  return g.filter((x) => x.liste.length > 0);
}

export function rueckfrage(z: SimZustand) {
  return z.komm.faeden.aerztin?.rueckfrage;
}

/** Wartende Messenger-Antwort: Sekunden bis zur Antwort (kleinste) */
export function antwortKommtIn(z: SimZustand): number | undefined {
  const a = z.komm.ausstehend;
  return a.length ? Math.max(0, Math.min(...a.map((x) => x.faellig)) - z.t) : undefined;
}

/* ─────────────────────────── Rückaufträge ─────────────────────────── */

export interface AuftragAnzeige extends AuftragZeile {
  /** „noch 8 Min.“, „seit 2 Min. überfällig“, „gemeldet“ */
  frist: string;
  /** Melden geht jetzt (erledigt, nicht gemeldet, alle Meldebausteine verfügbar) */
  meldbar: boolean;
}

const minuten = (sek: number) => Math.max(1, Math.round(Math.abs(sek) / 60));

export function auftraege(z: SimZustand): AuftragAnzeige[] {
  const werte = new Set(wertBausteine(z).map((b) => b.id));
  const sbar = new Set(z.fall.sbar.filter((b) => !b.bekanntWenn || gilt(z, b.bekanntWenn)).map((b) => b.id));
  return auftragsListe(z).map((a) => {
    const frist = a.status === 'gemeldet' ? 'gemeldet'
      : a.restSek === undefined ? (a.status === 'erledigt' ? 'erledigt, noch melden' : 'offen')
        : a.restSek >= 0 ? `noch ${minuten(a.restSek)} Min.` : `seit ${minuten(a.restSek)} Min. überfällig`;
    const meldbar = (a.status === 'erledigt' || (a.status === 'verspaetet' && !!z.komm.auftraege[a.id]?.erledigtT))
      && a.meldung.every((id) => werte.has(id) || sbar.has(id));
    return { ...a, frist, meldbar };
  });
}

/* ─────────────────────────── Freitext offline ─────────────────────────── */

const norm = (s: string) => s.toLocaleLowerCase('de-DE').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');

const STOPP = new Set(['heute', 'seit', 'sonst', 'bitte', 'werte', 'einer', 'eine', 'einem', 'einen', 'nicht', 'keine', 'kein', 'unter', 'ueber',
  'ihren', 'ihrer', 'ihre', 'laut', 'gestern', 'morgen', 'wohl', 'einfach', 'sollen', 'soll', 'haben', 'habe', 'sind', 'wird', 'worden', 'deutlich',
  'zeichen', 'vermute', 'verdacht', 'frau', 'herr', 'jahre', 'jahren', 'immer', 'noch', 'schon', 'etwas', 'wenig', 'sehr', 'kaum']);

/** Stichwörter für Messwerte (Wert-Bausteine) */
const WERT_WORTE: Record<string, string[]> = {
  'wert:bz': ['blutzucker', 'zucker', 'bz'], 'wert:rrSys': ['blutdruck', 'rr', 'druck'], 'wert:hf': ['puls', 'herzfrequenz', 'hf'],
  'wert:spo2': ['sattigung', 'spo2', 'sauerstoffsatt'], 'wert:af': ['atemfrequenz', 'atmet', 'af'], 'wert:temp': ['temperatur', 'fieber', 'temp'],
  'wert:schmerz': ['schmerz', 'nrs'], 'wert:map': ['mitteldruck', 'map'], 'wert:laktat': ['laktat'],
};

const woerter = (t: string) => norm(t).split(/[^a-z0-9]+/).filter((w) => w.length >= 4 && !STOPP.has(w));

/**
 * Freitext ohne KI den angebotenen Bausteinen zuordnen. Ein Baustein gilt als gemeint, wenn mindestens zwei seiner
 * Stichwörter (bei kurzen Bausteinen eines) im Text stehen; Messwerte über feste Stichwörter, die Zusage über „melde“.
 * Ergebnis wird angezeigt („verstanden als …“); die Lernenden sehen so, was bei der Ärztin ankommt.
 */
export function verstehe(text: string, angebot: readonly SbarBaustein[]): string[] {
  const t = norm(text);
  if (!t.trim()) return [];
  const imText = new Set(t.split(/[^a-z0-9]+/).filter(Boolean));
  const passt = (w: string) => imText.has(w) || (w.length >= 6 && t.includes(w.slice(0, Math.max(6, w.length - 2))));
  const treffer: string[] = [];
  for (const b of angebot) {
    if (b.id === ZUSAGE_ID) { if (/\bmelde\b|melde mich|messe (gleich|nach)|noch nicht gemessen/.test(t)) treffer.push(b.id); continue; }
    if (b.id.startsWith('wert:')) { if ((WERT_WORTE[b.id] ?? []).some((w) => imText.has(w) || (w.length >= 6 && t.includes(w)))) treffer.push(b.id); continue; }
    const ws = [...new Set(woerter(b.text))];
    const n = ws.filter(passt).length;
    if (n >= 2 || (n >= 1 && ws.length <= 2)) treffer.push(b.id);
  }
  return treffer;
}
