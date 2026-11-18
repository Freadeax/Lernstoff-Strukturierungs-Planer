// Praxissimulator neu – Simulationskern (Paket P0). Rein und deterministisch.
// Zustand = Fall + Eingaben. Jede Eingabe kostet Spielzeit; der Logik-Takt beträgt 5 s.
// Die Darstellung ruft nur start/sende/vorspulen auf und liest Zustand, Meldungen und anzeige().
// Konzept: KONZEPT.md 3, 3.1, 6.1–6.4 (Projektordner praxissimulator-neu).

import { pruefe, type BedingungsKontext } from './bedingung';
import { KATALOG } from './katalog';
import { NORMAL, type ModellKontext, type PhysiologieModell } from './modell';
import { alarmFuer } from './physiologie/altersprofile';
import { PFLEGE_MODELL } from './physiologie/pflegemodell';
import type {
  AktiverTreiber, Anzeige, Bedingung, Bildzustand, FallV2, Freigabe, Grundgroessen, MassnahmeDefinition, Rolle,
  SimEvent, SimEventEingabe, Stufe, Treiber, Wirkkurve,
} from './typen';

export const TAKT_SEK = 5;
/** Zusatzzeit, wenn die Praxisanleitung unterstützt */
export const PA_ZUSATZ_SEK = 30;

export interface Meldung {
  t: number;
  art: 'befund' | 'gespraech' | 'arzt' | 'pa' | 'ereignis' | 'hinweis' | 'fehler' | 'ende';
  text: string;
  quelle?: string;
}

interface AktiveWirkung { kurve: Wirkkurve; t0: number; delta: number }

export interface SimZustand {
  readonly fall: FallV2;
  rolle: Rolle;
  stufe: Stufe;
  seed: number;
  t: number;
  grund: Grundgroessen;
  /** laufende Treiber, mit Zeitstempel `seit` (nur aus z.t, damit Replay identisch bleibt) */
  treiber: AktiverTreiber[];
  wirkungen: AktiveWirkung[];
  flags: string[];
  /** Maßnahme-/Frage-ID → Zeitpunkte */
  getan: Record<string, number[]>;
  geraete: string[];
  sichtbar: Array<keyof Anzeige>;
  /** erhaltene Anordnungen */
  anordnungen: Record<string, { rueckgelesen: boolean; t: number }>;
  /** von der Ärztin genannt, noch nicht rückgemeldet */
  angeboten: string[];
  zurueckgezogen: string[];
  letzterAnruf: string[];
  anleitung: string[];
  paZaehler: Record<number, number>;
  ereignisseAus: string[];
  fehlerAus: string[];
  alarme: Partial<Record<keyof Anzeige, 'gelb' | 'rot'>>;
  offeneEntscheidung?: string;
  bild: Bildzustand;
  ende?: { text: string; ausgang: string; t: number };
  abschluss?: Extract<SimEventEingabe, { art: 'abschluss' }>;
  /** Eingaben in Reihenfolge: Grundlage für Replay */
  eingaben: SimEventEingabe[];
  log: SimEvent[];
  meldungen: Meldung[];
}

let modell: PhysiologieModell = PFLEGE_MODELL;
/** Standard ist das Pflege-Physiologiemodell (P1); P1b kann eine Hülle mit den Spur-B-Modulen setzen. */
export function setzeModell(m: PhysiologieModell) { modell = m; }
export const aktuellesModell = (): PhysiologieModell => modell;

/** Ausgangslage des Falls: Basis für abgeleitete Größen im Modell */
export const basisGrund = (fall: FallV2): Grundgroessen => ({ ...NORMAL, ...fall.start.grund });

/** Summe der gerade laufenden Wirkkurven je Grundgröße (Kontext für die Homöostase im Modell) */
export function laufendeWirkung(z: SimZustand): Partial<Record<keyof Grundgroessen, number>> {
  const summe: Partial<Record<keyof Grundgroessen, number>> = {};
  for (const w of z.wirkungen) {
    const a = anteil(w.kurve, z.t - w.t0);
    if (a !== 0) summe[w.kurve.groesse] = (summe[w.kurve.groesse] ?? 0) + w.delta * a;
  }
  return summe;
}

export const kontextModell = (z: SimZustand): ModellKontext => ({
  altersgruppe: z.fall.altersgruppe, module: z.fall.start.module, t: z.t, basis: basisGrund(z.fall),
  wirkung: laufendeWirkung(z), gewichtKg: z.fall.person.gewichtKg,
});

/** Treiber mit Zeitstempel hinzufügen */
function neueTreiber(z: SimZustand, liste: readonly Treiber[] | undefined) {
  for (const tr of liste ?? []) z.treiber.push({ ...tr, seit: z.t });
}

export function anzeige(z: SimZustand): Anzeige {
  return modell.anzeige(z.grund, kontextModell(z));
}

function bk(z: SimZustand): BedingungsKontext {
  return {
    t: z.t, getan: z.getan, flags: z.flags, grund: z.grund, anzeige: () => anzeige(z),
    letzterAnruf: z.letzterAnruf, anordnungen: z.anordnungen,
  };
}
export const gilt = (z: SimZustand, b: Bedingung) => pruefe(b, bk(z));

/* ─────────────── Maßnahmen, Verfügbarkeit, Befugnis ─────────────── */

export function massnahme(fall: FallV2, id: string): MassnahmeDefinition | undefined {
  return fall.massnahmenZusatz?.find((m) => m.id === id) ?? KATALOG[id];
}

/** Maßnahmen, die der Fall anbietet (in Fall-Reihenfolge) */
export function angeboteneMassnahmen(fall: FallV2): MassnahmeDefinition[] {
  return fall.massnahmen.map((id) => massnahme(fall, id)).filter((m): m is MassnahmeDefinition => !!m);
}

const MIT_PFLEGETASCHE = new Set(['ambulant', 'langzeit']);

export function verfuegbar(z: SimZustand, m: MassnahmeDefinition): { ok: true } | { ok: false; grund: string } {
  if (m.geraet && MIT_PFLEGETASCHE.has(z.fall.setting) && !z.geraete.includes(m.geraet)) {
    return { ok: false, grund: `Dafür brauchst du erst das Gerät aus der Pflegetasche (${m.geraet}).` };
  }
  if (m.voraussetzung && !gilt(z, m.voraussetzung)) return { ok: false, grund: 'Das geht in dieser Lage noch nicht.' };
  return { ok: true };
}

function hatAnordnung(z: SimZustand, massnahmeId: string): boolean {
  return z.fall.anordnungen.some((a) => a.massnahme === massnahmeId && !!z.anordnungen[a.id] && !z.zurueckgezogen.includes(a.id));
}

/** Rein: Befugnis + Rolle + Anordnungen → Freigabe (KONZEPT 6.1) */
export function freigabe(z: SimZustand, m: MassnahmeDefinition, rolle: Rolle = z.rolle): Freigabe {
  const level = z.fall.befugnisUeberschreibung?.[m.id]?.[rolle] ?? m.befugnis[rolle];
  if (level === 'nur-aerztlich') return 'grenze';
  if ((m.anordnungspflichtig || level === 'nach-anordnung') && !hatAnordnung(z, m.id)) return 'braucht-anordnung';
  if (level === 'mit-anleitung') return 'mit-pa';
  return 'frei';
}

/* ─────────────────────────── Start ─────────────────────────── */

export function start(fall: FallV2, rolle: Rolle, stufe: Stufe, seed = 1): SimZustand {
  const anordnungen: SimZustand['anordnungen'] = {};
  for (const id of fall.start.anordnungen ?? []) anordnungen[id] = { rueckgelesen: true, t: 0 };
  return {
    fall, rolle, stufe, seed, t: 0,
    grund: basisGrund(fall),
    treiber: fall.start.treiber.map((tr) => ({ ...tr, seit: 0 })),
    wirkungen: [], flags: [...(fall.start.flags ?? [])], getan: {}, geraete: [],
    sichtbar: [...(fall.start.sichtbar ?? [])], anordnungen, angeboten: [], zurueckgezogen: [],
    letzterAnruf: [], anleitung: [], paZaehler: {}, ereignisseAus: [], fehlerAus: [], alarme: {},
    bild: { ...fall.start.bild }, eingaben: [], log: [], meldungen: [],
  };
}

function kopie(z: SimZustand): SimZustand {
  const { fall, ...rest } = z;
  return { fall, ...structuredClone(rest) };
}

/* ─────────────────────────── Takt ─────────────────────────── */

/** Anteil einer Wirkkurve zum Zeitpunkt tRel: 0 → 1 (Beginn bis Spitze), hält bis Dauer, dann zurück. */
export function anteil(k: Wirkkurve, tRel: number): number {
  const rampe = Math.max(1, k.spitzeSek - k.beginnSek);
  if (tRel <= k.beginnSek) return 0;
  if (tRel < k.spitzeSek) return (tRel - k.beginnSek) / rampe;
  if (k.dauerSek === 'dauerhaft' || tRel <= k.dauerSek) return 1;
  return Math.max(0, 1 - (tRel - k.dauerSek) / rampe);
}

function aktiviere(z: SimZustand, kurven: Wirkkurve[] | undefined) {
  for (const k of kurven ?? []) {
    const delta = k.delta ?? (k.faktor !== undefined ? z.grund[k.groesse] * (k.faktor - 1) : 0);
    z.wirkungen.push({ kurve: k, t0: z.t, delta });
  }
}

/** Alarmfarbe wie am Monitor: Erwachsene NEWS2-Bänder (3 Punkte = rot), Kinder Altersprofil, Säuglinge keine. */
const ALARM_GROESSEN = new Set<keyof Anzeige>(['spo2', 'hf', 'rrSys', 'af', 'temp']);
function alarmVon(z: SimZustand, key: keyof Anzeige, wert: number): 'gelb' | 'rot' | undefined {
  if (!ALARM_GROESSEN.has(key)) return undefined;
  const a = alarmFuer(key, wert, z.fall.altersgruppe);
  return a === 'ok' ? undefined : a;
}

type Stopp = 'zeit' | 'ereignis' | 'alarm' | 'ende';

function schritt(z: SimZustand, dt: number): Stopp | undefined {
  const t0 = z.t;
  z.grund = modell.naechster(z.grund, z.treiber, dt, kontextModell(z));
  // Hinweis: Wirkkurven-Zuwachs nach dem Modellschritt; das Modell kennt die bis t0 laufende Summe (kontext.wirkung).
  for (const w of z.wirkungen) {
    const d = w.delta * (anteil(w.kurve, t0 + dt - w.t0) - anteil(w.kurve, t0 - w.t0));
    if (d !== 0) z.grund[w.kurve.groesse] += d;
  }
  z.t = t0 + dt;
  let stopp: Stopp | undefined;
  if (pruefeEreignisse(z)) stopp = 'ereignis';
  // Alarme nur für sichtbare Werte
  const a = anzeige(z);
  for (const key of z.sichtbar) {
    const stufe = alarmVon(z, key, a[key] as number);
    if (stufe !== z.alarme[key]) {
      if (stufe) { z.log.push({ t: z.t, art: 'alarm', groesse: key, stufe }); if (stufe === 'rot') stopp ??= 'alarm'; }
      if (stufe) z.alarme[key] = stufe; else delete z.alarme[key];
    }
  }
  pruefeFehler(z);
  if (pruefeEnde(z)) stopp = 'ende';
  return stopp;
}

/** Lässt Spielzeit laufen. Stoppt bei offener Entscheidung oder Ende; optional auch bei Ereignis/rotem Alarm. */
function lauf(z: SimZustand, sek: number, stoppBeiSignal = false): number {
  let rest = sek;
  while (rest > 0 && !z.offeneEntscheidung && !z.ende) {
    const dt = Math.min(TAKT_SEK, rest);
    const s = schritt(z, dt);
    rest -= dt;
    if (stoppBeiSignal && (s === 'ereignis' || s === 'alarm')) break;
  }
  return sek - rest;
}

/* ─────────────────── Ereignisse, Fehler, Ende ─────────────────── */

function pruefeEreignisse(z: SimZustand): boolean {
  let neu = false;
  for (const e of z.fall.ereignisse) {
    if (z.ereignisseAus.includes(e.id) || z.offeneEntscheidung) continue;
    if (!gilt(z, e.wann)) continue;
    if (e.verhindertDurch && gilt(z, e.verhindertDurch)) continue;
    z.ereignisseAus.push(e.id);
    z.log.push({ t: z.t, art: 'ereignis', id: e.id });
    z.meldungen.push({ t: z.t, art: 'ereignis', text: e.text, quelle: e.id });
    neueTreiber(z, e.treiber);
    if (e.bild) z.bild = { ...z.bild, ...e.bild };
    if (e.entscheidung?.length) z.offeneEntscheidung = e.id;
    neu = true;
  }
  return neu;
}

function pruefeFehler(z: SimZustand) {
  for (const f of z.fall.bewertung.fehler) {
    if (z.fehlerAus.includes(f.id) || !gilt(z, f.wenn)) continue;
    z.fehlerAus.push(f.id);
    z.log.push({ t: z.t, art: 'fehler', id: f.id });
    if (f.folge) {
      z.meldungen.push({ t: z.t, art: 'fehler', text: f.folge.text, quelle: f.id });
      neueTreiber(z, f.folge.treiber);
      aktiviere(z, f.folge.wirkung);
    }
  }
}

function pruefeEnde(z: SimZustand): boolean {
  if (z.ende) return true;
  const e = z.fall.bewertung.ende.find((x) => gilt(z, x.wenn));
  if (!e) return false;
  z.ende = { text: e.text, ausgang: e.ausgang, t: z.t };
  z.meldungen.push({ t: z.t, art: 'ende', text: e.text });
  return true;
}

/* ─────────────────────────── Arzt ─────────────────────────── */

function arztAntwort(z: SimZustand) {
  const r = z.fall.arzt.regeln.find((x) => gilt(z, x.wenn));
  if (!r) {
    z.meldungen.push({ t: z.t, art: 'arzt', text: `${z.fall.arzt.name}: „Ich habe Sie nicht ganz verstanden. Was genau ist los?“` });
    return;
  }
  z.meldungen.push({ t: z.t, art: 'arzt', text: `${z.fall.arzt.name}: ${r.antwort}` });
  for (const f of r.setzt ?? []) if (!z.flags.includes(f)) z.flags.push(f);
  for (const a of r.anordnungen ?? []) if (!z.angeboten.includes(a) && !z.anordnungen[a]) z.angeboten.push(a);
}

/* ─────────────────────────── Eingaben ─────────────────────────── */

/** Wartezeiten werden NICHT zusammengefasst: lauf(7)+lauf(3) rechnet andere Takte als lauf(10). */
function notiere(z: SimZustand, e: SimEventEingabe) {
  z.eingaben.push(e);
}

function markiere(z: SimZustand, id: string) {
  (z.getan[id] ??= []).push(z.t);
}

function befund(z: SimZustand, id: string) {
  const b = z.fall.befunde.find((x) => x.massnahme === id);
  const v = b?.varianten.find((x) => !x.wenn || gilt(z, x.wenn));
  if (v) {
    z.meldungen.push({ t: z.t, art: 'befund', text: v.text, quelle: id });
    for (const k of v.zeigt ?? []) if (!z.sichtbar.includes(k)) z.sichtbar.push(k);
  }
}

function fuehreAus(z: SimZustand, m: MassnahmeDefinition, zusatzSek = 0) {
  markiere(z, m.id);
  for (const f of m.setzt ?? []) if (!z.flags.includes(f)) z.flags.push(f);
  aktiviere(z, m.wirkung);
  if (m.beendet?.length) z.treiber = z.treiber.filter((tr) => !m.beendet!.includes(tr.art));
  neueTreiber(z, m.treiber);
  befund(z, m.id);
  pruefeFehler(z);
  lauf(z, m.zeitbedarfSekunden + zusatzSek);
}

function massnahmeEingabe(z: SimZustand, id: string) {
  const m = massnahme(z.fall, id);
  if (!m || !z.fall.massnahmen.includes(id)) {
    z.meldungen.push({ t: z.t, art: 'hinweis', text: 'Diese Handlung gibt es in diesem Fall nicht.' });
    return;
  }
  const v = verfuegbar(z, m);
  if (!v.ok) { z.meldungen.push({ t: z.t, art: 'hinweis', text: v.grund, quelle: id }); return; }
  const f = freigabe(z, m);
  const pa = z.fall.pa.name;

  if (z.stufe < 3) {
    if (f === 'frei') return fuehreAus(z, m);
    if (f === 'mit-pa') {
      z.log.push({ t: z.t, art: 'pa-eingriff', massnahmeId: id, typ: 'unterstuetzt' });
      z.meldungen.push({ t: z.t, art: 'pa', text: `${pa} kommt dazu: „Das machen wir zusammen.“`, quelle: id });
      return fuehreAus(z, m, PA_ZUSATZ_SEK);
    }
    z.log.push({ t: z.t, art: 'pa-eingriff', massnahmeId: id, typ: 'warnt' });
    z.meldungen.push({
      t: z.t, art: 'pa', quelle: id,
      text: f === 'braucht-anordnung'
        ? `${pa}: „Stopp. Dafür brauchen wir eine ärztliche Anordnung. Wen rufst du an?“`
        : `${pa}: „Das ist eine ärztliche Aufgabe. Du trägst die Durchführungsverantwortung und darfst das ablehnen. Ruf die Ärztin an.“`,
    });
    return;
  }

  // Stufe 3: Knopf bleibt klickbar, Grenzüberschreitung wird festgehalten (KONZEPT 6.2)
  if (f === 'frei') return fuehreAus(z, m);
  if (f === 'mit-pa' && z.anleitung.includes(id)) return fuehreAus(z, m, PA_ZUSATZ_SEK);
  const level = z.fall.befugnisUeberschreibung?.[id]?.[z.rolle] ?? m.befugnis[z.rolle];
  z.log.push({ t: z.t, art: 'grenzueberschreitung', massnahmeId: id, rolle: z.rolle, befugnis: level });
  if (m.risikoBeiUeberschreitung === 'abbruch-durch-pa') {
    z.log.push({ t: z.t, art: 'pa-eingriff', massnahmeId: id, typ: 'bricht-ab' });
    z.meldungen.push({ t: z.t, art: 'pa', text: `${pa} hält dich zurück: „Halt, das darfst du so nicht.“`, quelle: id });
    lauf(z, 15);
    return;
  }
  fuehreAus(z, m);
}

/** Eine Eingabe verarbeiten. Gibt einen neuen Zustand zurück (der alte bleibt unverändert). */
export function sende(alt: SimZustand, e: SimEventEingabe): SimZustand {
  if (alt.ende && e.art !== 'abschluss') return alt;
  if (alt.offeneEntscheidung && e.art !== 'entscheidung') return alt;
  const z = kopie(alt);
  notiere(z, e);
  if (e.art !== 'warten') z.log.push({ ...e, t: z.t } as SimEvent);

  switch (e.art) {
    case 'warten':
      lauf(z, e.sek);
      break;
    case 'massnahme':
      massnahmeEingabe(z, e.id);
      break;
    case 'frage': {
      const g = z.fall.gespraech.find((x) => x.id === e.id);
      if (!g) break;
      markiere(z, `frage:${g.id}`);
      const a = g.antwort.find((x) => !x.wenn || gilt(z, x.wenn));
      if (a) z.meldungen.push({ t: z.t, art: 'gespraech', text: a.text, quelle: g.id });
      aktiviere(z, g.wirkung);
      lauf(z, 30);
      break;
    }
    case 'pflegetasche':
      if (!z.geraete.includes(e.geraet)) z.geraete.push(e.geraet);
      markiere(z, `pflegetasche:${e.geraet}`);
      z.bild = { ...z.bild, geraete: [...(z.bild.geraete ?? []), e.geraet] };
      lauf(z, 20);
      break;
    case 'anleitung-anfordern':
      if (!z.anleitung.includes(e.massnahme)) z.anleitung.push(e.massnahme);
      z.meldungen.push({ t: z.t, art: 'pa', text: `${z.fall.pa.name} kommt dazu.` });
      lauf(z, 15);
      break;
    case 'anruf':
      z.letzterAnruf = [...e.sbar];
      markiere(z, 'anruf-aerztin');
      arztAntwort(z);
      pruefeFehler(z);
      lauf(z, 90);
      break;
    case 'rueckmelden':
      if (z.angeboten.includes(e.anordnung)) {
        z.angeboten = z.angeboten.filter((a) => a !== e.anordnung);
        z.anordnungen[e.anordnung] = { rueckgelesen: e.rueckgelesen, t: z.t };
        const a = z.fall.anordnungen.find((x) => x.id === e.anordnung);
        z.log.push({ t: z.t, art: 'anordnung-erhalten', massnahmeId: a?.massnahme ?? '', anordnung: e.anordnung, rueckgelesen: e.rueckgelesen });
        lauf(z, e.rueckgelesen ? 15 : 5);
      }
      break;
    case 'remonstrieren': {
      const a = z.fall.anordnungen.find((x) => x.id === e.anordnung);
      if (!a) break;
      if (a.fehlerhaft) {
        z.angeboten = z.angeboten.filter((x) => x !== a.id);
        if (!z.zurueckgezogen.includes(a.id)) z.zurueckgezogen.push(a.id);
        z.flags.push(`remonstriert:${a.id}`);
        z.meldungen.push({ t: z.t, art: 'arzt', text: `${z.fall.arzt.name}: „Sie haben recht. ${a.fehlerhaft.korrektur}“`, quelle: a.id });
      } else {
        z.meldungen.push({ t: z.t, art: 'arzt', text: `${z.fall.arzt.name}: „Doch, das ist so richtig. Bitte umsetzen.“`, quelle: a.id });
      }
      lauf(z, 60);
      break;
    }
    case 'pa-fragen': {
      if (z.stufe === 3) { z.meldungen.push({ t: z.t, art: 'hinweis', text: 'In der Prüfung gibt es keine Hilfe der Praxisanleitung.' }); break; }
      const i = z.fall.pa.hilfen.findIndex((h) => !h.wenn || gilt(z, h.wenn));
      if (i < 0) { z.meldungen.push({ t: z.t, art: 'pa', text: `${z.fall.pa.name}: „Du bist auf einem guten Weg.“` }); break; }
      const n = z.paZaehler[i] ?? 0;
      z.paZaehler[i] = n + 1;
      const stufe = n === 0 ? 'impuls' : 'tipp';
      z.log.push({ t: z.t, art: 'pa-hilfe', stufe });
      const h = z.fall.pa.hilfen[i];
      z.meldungen.push({ t: z.t, art: 'pa', text: `${z.fall.pa.name}: „${stufe === 'impuls' ? h.impuls : h.tipp}“` });
      lauf(z, 10);
      break;
    }
    case 'entscheidung': {
      if (z.offeneEntscheidung !== e.ereignis) break;
      const ev = z.fall.ereignisse.find((x) => x.id === e.ereignis);
      const o = ev?.entscheidung?.find((x) => x.id === e.wahl);
      if (!o) break;
      z.offeneEntscheidung = undefined;
      for (const f of o.setzt ?? []) if (!z.flags.includes(f)) z.flags.push(f);
      markiere(z, `wahl:${e.ereignis}:${o.id}`);
      if (o.loestAnrufAus) { z.letzterAnruf = []; markiere(z, 'anruf-aerztin'); arztAntwort(z); }
      pruefeFehler(z);
      lauf(z, 30);
      break;
    }
    case 'abschluss':
      z.abschluss = e;
      z.ende ??= { text: 'Fall abgeschlossen.', ausgang: 'abgeschlossen', t: z.t };
      break;
  }
  pruefeFehler(z);
  pruefeEnde(z);
  return z;
}

/** „5 Min. vorspulen“: läuft schneller, stoppt bei Ereignis, rotem Alarm, Entscheidung oder Ende (KONZEPT 3.1). */
export function vorspulen(alt: SimZustand, sek = 300): SimZustand {
  if (alt.ende || alt.offeneEntscheidung) return alt;
  const z = kopie(alt);
  const vergangen = lauf(z, sek, true);
  if (vergangen > 0) notiere(z, { art: 'warten', sek: vergangen });
  return z;
}

/** Replay: gleiche Eingaben → gleicher Zustand. */
export function replay(fall: FallV2, rolle: Rolle, stufe: Stufe, seed: number, eingaben: readonly SimEventEingabe[]): SimZustand {
  return eingaben.reduce(sende, start(fall, rolle, stufe, seed));
}
