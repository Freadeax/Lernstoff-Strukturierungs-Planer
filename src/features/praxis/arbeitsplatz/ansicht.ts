// Praxissimulator neu – Arbeitsplatz (Paket P2): reine Ansichtslogik über dem Kern.
// Keine Fachlogik: Freigabe, Verfügbarkeit, Zeit und Verlauf kommen ausschließlich aus kern.ts.
// Hier wird nur zusammengestellt, was die Oberfläche zeigt (Reiter, Abzeichen, Werteleiste, Team, SBAR).

import {
  angeboteneMassnahmen, anzeige, freigabe, gilt, sende, start, verfuegbar, vorspulen,
  type Meldung, type SimZustand,
} from '../kern/kern';
import { alarmFuer } from '../kern/physiologie/altersprofile';
import type {
  Anzeige, Bildzustand, Freigabe, FallV2, MassnahmeDefinition, Reiter, Rolle, SbarBaustein, SbarTeil,
  SimEventEingabe, Stufe,
} from '../kern/typen';

/* ─────────────────────────── Stand ─────────────────────────── */

export type Messgroesse = 'hf' | 'spo2' | 'rr' | 'af' | 'temp' | 'bz';

export interface Messung { wert: number; wert2?: number; t: number; live: boolean }

/** Kernzustand + was zuletzt gemessen wurde (Messungen sind Momentaufnahmen, Monitor/Pulsoxy laufen live). */
export interface Arbeitsstand {
  z: SimZustand;
  messungen: Partial<Record<Messgroesse, Messung>>;
}

/** Geräte, deren Werte nach dem Anlegen laufend angezeigt werden. */
const LIVE_GERAETE = new Set(['pulsoxy', 'monitor']);

const ZU_MESSGROESSE: Partial<Record<keyof Anzeige, Messgroesse>> = {
  hf: 'hf', spo2: 'spo2', rrSys: 'rr', rrDia: 'rr', af: 'af', temp: 'temp', bz: 'bz',
};

function wertAus(a: Anzeige, g: Messgroesse): Pick<Messung, 'wert' | 'wert2'> {
  switch (g) {
    case 'rr': return { wert: a.rrSys, wert2: a.rrDia };
    case 'bz': return { wert: a.bz ?? NaN };
    default: return { wert: a[g] };
  }
}

function startMessungen(z: SimZustand): Arbeitsstand['messungen'] {
  const m: Arbeitsstand['messungen'] = {};
  const a = anzeige(z);
  for (const k of z.sichtbar) {
    const g = ZU_MESSGROESSE[k];
    if (g) m[g] = { ...wertAus(a, g), t: 0, live: true };
  }
  return m;
}

export function beginne(fall: FallV2, rolle: Rolle, stufe: Stufe, seed = 1): Arbeitsstand {
  const z = start(fall, rolle, stufe, seed);
  return { z, messungen: startMessungen(z) };
}

/** Eine Eingabe an den Kern schicken und neue Messwerte festhalten. */
export function wende(stand: Arbeitsstand, e: SimEventEingabe): Arbeitsstand {
  const z = sende(stand.z, e);
  if (z === stand.z) return stand;
  const messungen = { ...stand.messungen };
  if (e.art === 'massnahme') {
    const neu = z.meldungen.slice(stand.z.meldungen.length).filter((m) => m.art === 'befund' && m.quelle === e.id);
    const befund = z.fall.befunde.find((b) => b.massnahme === e.id);
    const def = angeboteneMassnahmen(z.fall).find((m) => m.id === e.id);
    const live = !!def?.geraet && LIVE_GERAETE.has(def.geraet);
    const a = anzeige(z);
    for (const meldung of neu) {
      const variante = befund?.varianten.find((v) => v.text === meldung.text);
      for (const k of variante?.zeigt ?? []) {
        const g = ZU_MESSGROESSE[k];
        if (g) messungen[g] = { ...wertAus(a, g), t: z.t, live: live || !!messungen[g]?.live };
      }
    }
  }
  return { z, messungen };
}

/** „5 Min. vorspulen“ (stoppt im Kern bei Ereignis, rotem Alarm, Entscheidung, Ende). */
export function spule(stand: Arbeitsstand, sek = 300): Arbeitsstand {
  const z = vorspulen(stand.z, sek);
  return z === stand.z ? stand : { ...stand, z };
}

/** Aus gespeicherten Eingaben wiederherstellen (gleiche Eingaben → gleicher Stand). */
export function rekonstruiere(fall: FallV2, rolle: Rolle, stufe: Stufe, seed: number, eingaben: readonly SimEventEingabe[]): Arbeitsstand {
  return eingaben.reduce(wende, beginne(fall, rolle, stufe, seed));
}

/* ─────────────────────────── Uhr ─────────────────────────── */

/** Spielzeit als Uhrzeit ab Fallbeginn, z. B. „08:10“ + 95 s → „08:11“. */
export function uhrzeit(startUhrzeit: string, t: number, mitSekunden = false): string {
  const [h, m] = startUhrzeit.split(':').map(Number);
  const gesamt = ((h || 0) * 3600 + (m || 0) * 60 + Math.floor(t)) % 86400;
  const zwei = (n: number) => String(n).padStart(2, '0');
  const hh = zwei(Math.floor(gesamt / 3600)), mm = zwei(Math.floor((gesamt % 3600) / 60));
  return mitSekunden ? `${hh}:${mm}:${zwei(gesamt % 60)}` : `${hh}:${mm}`;
}

export function dauer(sek: number): string {
  if (sek < 60) return `${sek} s`;
  const m = Math.floor(sek / 60), s = sek % 60;
  return s ? `${m} min ${s} s` : `${m} min`;
}

/* ─────────────────────────── Reiter ─────────────────────────── */

export const REITER: ReadonlyArray<{ id: Reiter; kurz: string; titel: string; symbol: string }> = [
  { id: 'gespraech', kurz: 'Gespräch', titel: 'Gespräch & Beziehung', symbol: '💬' },
  { id: 'beobachten', kurz: 'Beobachten', titel: 'Beobachten & Einschätzen', symbol: '👁' },
  { id: 'akut', kurz: 'Akut', titel: 'Akut & Sicherheit', symbol: '⚠' },
  { id: 'messen', kurz: 'Messen', titel: 'Messen & Diagnostik', symbol: '📈' },
  { id: 'versorgen', kurz: 'Versorgen', titel: 'Pflegen & Versorgen', symbol: '🩹' },
  { id: 'melden', kurz: 'Melden', titel: 'Melden & Übergabe', symbol: '📞' },
];

export const FREIGABE_TEXT: Record<Freigabe, { kurz: string; lang: string }> = {
  frei: { kurz: 'selbst', lang: 'Darfst du selbst' },
  'mit-pa': { kurz: 'mit PA', lang: 'Nur mit deiner Praxisanleitung' },
  'braucht-anordnung': { kurz: 'braucht Anordnung', lang: 'Braucht eine ärztliche Anordnung' },
  grenze: { kurz: 'ärztlich', lang: 'Ärztliche Aufgabe, nicht deine' },
};

/** Settings, in denen Messgeräte erst aus der Pflegetasche kommen (E9, wie im Kern). */
export const hatPflegetasche = (fall: FallV2) => fall.setting === 'ambulant' || fall.setting === 'langzeit';

export const GERAET_NAME: Record<string, string> = {
  pulsoxy: 'Pulsoxymeter', 'rr-geraet': 'Blutdruckgerät', thermometer: 'Ohrthermometer', 'bz-geraet': 'Blutzuckergerät',
};
export const geraetName = (id: string) => GERAET_NAME[id] ?? id;

export interface Handlung {
  art: 'massnahme' | 'frage';
  id: string;
  name: string;
  reiter: Reiter;
  sek: number;
  freigabe?: Freigabe;
  /** Uhrzeiten (Spielzeit), zu denen die Handlung schon gemacht wurde */
  getan: number[];
  /** Warum sie gerade nicht geht (z. B. Gerät fehlt) */
  gesperrt?: string;
  /** Gerät, das erst aus der Pflegetasche geholt werden muss */
  fehlendesGeraet?: string;
  /** Stufe 3: PA muss vorher dazugeholt werden */
  anleitungDa?: boolean;
}

/** Alle Handlungen des Falls (Maßnahmen und Gesprächsfragen), in Fall-Reihenfolge. */
export function handlungen(z: SimZustand): Handlung[] {
  const fragen: Handlung[] = z.fall.gespraech.map((g) => ({
    art: 'frage', id: g.id, name: g.frage, reiter: 'gespraech', sek: 30, getan: z.getan[`frage:${g.id}`] ?? [],
  }));
  const massnahmen: Handlung[] = angeboteneMassnahmen(z.fall).map((m: MassnahmeDefinition) => {
    const v = verfuegbar(z, m);
    const fehlt = !v.ok && m.geraet && hatPflegetasche(z.fall) && !z.geraete.includes(m.geraet) ? m.geraet : undefined;
    return {
      art: 'massnahme', id: m.id, name: m.name, reiter: m.reiter, sek: m.zeitbedarfSekunden,
      freigabe: freigabe(z, m), getan: z.getan[m.id] ?? [],
      gesperrt: v.ok ? undefined : v.grund, fehlendesGeraet: fehlt, anleitungDa: z.anleitung.includes(m.id),
    };
  });
  return [...fragen, ...massnahmen];
}

const norm = (s: string) => s.toLocaleLowerCase('de-DE').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');

/** Schnellsuche „Was willst du tun?“: alle Wörter müssen im Namen vorkommen. */
export function suche(liste: readonly Handlung[], text: string): Handlung[] {
  const woerter = norm(text).split(/\s+/).filter(Boolean);
  if (!woerter.length) return [...liste];
  return liste.filter((h) => { const n = norm(h.name); return woerter.every((w) => n.includes(w)); });
}

/* ─────────────────────────── Pflegetasche ─────────────────────────── */

export interface TaschenGeraet { id: string; name: string; dabei: boolean }

/** Geräte, die der Fall braucht (aus den angebotenen Maßnahmen), und ob sie schon angelegt sind. */
export function pflegetasche(z: SimZustand): TaschenGeraet[] {
  if (!hatPflegetasche(z.fall)) return [];
  const ids = [...new Set(angeboteneMassnahmen(z.fall).map((m) => m.geraet).filter((g): g is string => !!g))];
  return ids.map((id) => ({ id, name: geraetName(id), dabei: z.geraete.includes(id) }));
}

/* ─────────────────────────── Werteleiste ─────────────────────────── */

export interface Wert {
  id: Messgroesse;
  label: string;
  einheit: string;
  text: string;            // „124“, „92/54“, „38,9“ oder „—“
  stand: 'live' | 'gemessen' | 'offen';
  zeit?: string;           // Uhrzeit der Messung
  alarm: 'ok' | 'gelb' | 'rot';
}

const WERTE: ReadonlyArray<{ id: Messgroesse; label: string; einheit: string }> = [
  { id: 'hf', label: 'Puls', einheit: '/min' },
  { id: 'spo2', label: 'SpO₂', einheit: '%' },
  { id: 'rr', label: 'RR', einheit: 'mmHg' },
  { id: 'af', label: 'AF', einheit: '/min' },
  { id: 'temp', label: 'Temp', einheit: '°C' },
];

const ganz = (n: number) => Math.round(n).toLocaleString('de-DE');
const eins = (n: number) => n.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Alarmfarbe der Werteleiste: wie am Monitor und im Kern (alarmFuer, altersabhängig). BZ hat keinen Monitorwert. */
function alarmVon(g: Messgroesse, w: number, gruppe: FallV2['altersgruppe']): Wert['alarm'] {
  if (g === 'bz') return w < 60 ? 'rot' : w < 70 || w > 250 ? 'gelb' : 'ok';
  return alarmFuer(g === 'rr' ? 'rrSys' : g, w, gruppe);
}

export function werteleiste(stand: Arbeitsstand): Wert[] {
  const { z } = stand;
  const a = anzeige(z);
  const liste = stand.messungen.bz ? [...WERTE, { id: 'bz' as const, label: 'BZ', einheit: 'mg/dl' }] : WERTE;
  return liste.map((d) => {
    const m = stand.messungen[d.id];
    if (!m) return { ...d, text: '—', stand: 'offen', alarm: 'ok' };
    const w = m.live ? wertAus(a, d.id) : m;
    if (!Number.isFinite(w.wert)) return { ...d, text: '—', stand: 'offen', alarm: 'ok' };
    const text = d.id === 'rr' ? `${ganz(w.wert)}/${ganz(w.wert2 ?? NaN)}` : d.id === 'temp' ? eins(w.wert) : ganz(w.wert);
    return {
      ...d, text, stand: m.live ? 'live' : 'gemessen',
      zeit: m.live ? undefined : uhrzeit(z.fall.startUhrzeit, m.t), alarm: alarmVon(d.id, w.wert, z.fall.altersgruppe),
    };
  });
}

/** Kleine Anzeige am Bett für angelegte Geräte mit Live-Werten (E9), z. B. „SpO₂ 93 · P 102“. */
export function bettAnzeige(stand: Arbeitsstand): string | undefined {
  const { z } = stand;
  if (!hatPflegetasche(z.fall) || !z.geraete.includes('pulsoxy') || !stand.messungen.spo2?.live) return undefined;
  const a = anzeige(z);
  return `SpO₂ ${ganz(a.spo2)} · P ${ganz(a.hf)}`;
}

/* ─────────────────────────── Team ─────────────────────────── */

export interface TeamZeile {
  wer: 'pa' | 'aerztin' | 'kollegin';
  name: string;
  kuerzel: string;
  text?: string;
  t?: number;
}

const letzte = (liste: readonly Meldung[], arten: Meldung['art'][]) => [...liste].reverse().find((m) => arten.includes(m.art));
/** „Dr. Sommer: „…““ → „…“, wenn der Name schon in der Zeile steht */
const ohneName = (text: string | undefined, name: string) => (text?.startsWith(`${name}: `) ? text.slice(name.length + 2) : text);

/** Team-Leiste: Praxisanleitung, Ärztin, Kollegin/Umfeld mit ihrer letzten Aussage. */
export function team(z: SimZustand): TeamZeile[] {
  const pa = letzte(z.meldungen, ['pa']);
  const arzt = letzte(z.meldungen, ['arzt']);
  const umfeld = letzte(z.meldungen, ['ereignis']);
  return [
    { wer: 'pa', name: z.fall.pa.name, kuerzel: 'PA', text: ohneName(pa?.text, z.fall.pa.name), t: pa?.t },
    { wer: 'aerztin', name: z.fall.arzt.name, kuerzel: 'Ä', text: ohneName(arzt?.text, z.fall.arzt.name), t: arzt?.t },
    { wer: 'kollegin', name: 'Umfeld und Team', kuerzel: 'K', text: umfeld?.text, t: umfeld?.t },
  ];
}

/* ─────────────────────────── Melden: SBAR + Anordnungen ─────────────────────────── */

export const SBAR_TEILE: ReadonlyArray<{ id: SbarTeil; titel: string; frage: string }> = [
  { id: 'S', titel: 'Situation', frage: 'Wer? Was ist jetzt los?' },
  { id: 'B', titel: 'Hintergrund', frage: 'Was ist bekannt (Diagnosen, Medikamente)?' },
  { id: 'A', titel: 'Einschätzung', frage: 'Was hast du erhoben, was vermutest du?' },
  { id: 'R', titel: 'Empfehlung', frage: 'Was brauchst du von der Ärztin?' },
];

/** SBAR-Bausteine, die man jetzt sagen kann (nur Bekanntes). Reihenfolge fest, nicht nach Art sortiert. */
export function sbarBausteine(z: SimZustand): Record<SbarTeil, SbarBaustein[]> {
  const r: Record<SbarTeil, SbarBaustein[]> = { S: [], B: [], A: [], R: [] };
  for (const b of z.fall.sbar) if (!b.bekanntWenn || gilt(z, b.bekanntWenn)) r[b.teil].push(b);
  return r;
}

export interface AnordnungZeile {
  id: string;
  text: string;
  stand: 'angeboten' | 'rueckgelesen' | 'uebernommen' | 'zurueckgezogen';
  /** schon zu Fallbeginn gültig (z. B. Medikamentenplan) */
  plan: boolean;
}

export function anordnungen(z: SimZustand): AnordnungZeile[] {
  const plan = new Set(z.fall.start.anordnungen ?? []);
  return z.fall.anordnungen.flatMap((a): AnordnungZeile[] => {
    if (z.zurueckgezogen.includes(a.id)) return [{ id: a.id, text: a.text, stand: 'zurueckgezogen', plan: plan.has(a.id) }];
    if (z.angeboten.includes(a.id)) return [{ id: a.id, text: a.text, stand: 'angeboten', plan: false }];
    const erhalten = z.anordnungen[a.id];
    if (erhalten) return [{ id: a.id, text: a.text, stand: erhalten.rueckgelesen ? 'rueckgelesen' : 'uebernommen', plan: plan.has(a.id) }];
    return [];
  });
}

/* ─────────────────────────── Bild & Entscheidung ─────────────────────────── */

const HALTUNG: Record<NonNullable<Bildzustand['haltung']>, string> = {
  liegt: 'liegt', 'oberkoerper-hoch': 'liegt mit erhöhtem Oberkörper', sitzt: 'sitzt', 'sitzt-ringt': 'sitzt und ringt nach Luft',
  'am-boden': 'sitzt am Boden', unruhig: 'ist unruhig und will aufstehen',
};
const HAUT: Record<NonNullable<Bildzustand['haut']>, string> = {
  rosig: 'Haut rosig', blass: 'Haut blass', 'blass-kaltschweissig': 'Haut blass und kaltschweißig', zyanotisch: 'Lippen bläulich',
  'gerötet-heiss': 'Haut gerötet und heiß', trocken: 'Haut trocken',
};
const MIMIK: Record<NonNullable<Bildzustand['mimik']>, string> = {
  ruhig: 'wirkt ruhig', schmerz: 'verzieht vor Schmerz das Gesicht', angst: 'wirkt ängstlich', verwirrt: 'wirkt verwirrt', schlaefrig: 'wirkt schläfrig',
};

/** Was man gerade sieht, als Satz (das Foto ist ein Beispielbild und zeigt den Zustand nicht immer). */
export function lageText(z: SimZustand): string {
  const b = z.bild;
  const teile = [b.haltung && HALTUNG[b.haltung], b.mimik && MIMIK[b.mimik], b.haut && HAUT[b.haut]].filter(Boolean);
  const geraete = (b.geraete ?? []).map(geraetName);
  return `${z.fall.person.name} ${teile.join(', ') || 'ist da'}${geraete.length ? `. Angelegt: ${geraete.join(', ')}` : ''}.`;
}

export function offeneEntscheidung(z: SimZustand) {
  return z.offeneEntscheidung ? z.fall.ereignisse.find((e) => e.id === z.offeneEntscheidung) : undefined;
}

/* ─────────────────────────── Übersicht am Ende (bis P5) ─────────────────────────── */

export interface Uebersicht {
  pflicht: Array<{ id: string; text: string; erfuellt: boolean; gewicht: 1 | 2 | 3; warum: string }>;
  fehler: Array<{ id: string; text: string; schwere: string; warum: string }>;
  grenzen: Array<{ t: number; name: string }>;
  paHilfen: number;
}

export function uebersicht(z: SimZustand): Uebersicht {
  const name = (id: string) => angeboteneMassnahmen(z.fall).find((m) => m.id === id)?.name ?? id;
  return {
    pflicht: z.fall.bewertung.pflicht.map((p) => ({ id: p.id, text: p.text, erfuellt: gilt(z, p.erfuellt), gewicht: p.gewicht, warum: p.warum })),
    fehler: z.fall.bewertung.fehler.filter((f) => z.fehlerAus.includes(f.id)).map((f) => ({ id: f.id, text: f.text, schwere: f.schwere, warum: f.warum })),
    grenzen: z.log.flatMap((e) => (e.art === 'grenzueberschreitung' ? [{ t: e.t, name: name(e.massnahmeId) }] : [])),
    paHilfen: z.log.filter((e) => e.art === 'pa-hilfe').length,
  };
}

export const ROLLE_TEXT = (r: Rolle) => (r === 'pflegefachperson' ? 'Pflegefachperson' : `${r}. Drittel`);
export const STUFE_TEXT: Record<Stufe, string> = { 1: 'Stufe 1 geführt', 2: 'Stufe 2', 3: 'Stufe 3 Prüfung' };
