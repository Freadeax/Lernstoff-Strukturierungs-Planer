// Praxissimulator neu – Patientenakte (Paket P13): reine Ansichtslogik über dem Kern.
// Stellt zusammen, was die Akte zeigt: Stammdaten, Kurvenblatt-Spalten, Medikationsplan mit Gaben im Fall,
// Anordnungen (frühere und mündliche im Fall), Pflegebericht, Befunde, Assessments, Pflegeplanung.
// Keine Fachlogik: Prüfungen (Doppelgabe usw.) macht kern/akte.ts.

import { akteVon, giltAb, istGeaendert, kurvenwerte, medName, zuletztSek, type DokuBaustein, type DokuGruppe } from '../kern/akte';
import { dokuBausteine, massnahme, type SimZustand } from '../kern/kern';
import type { Akte, AkteEintrag, KurvenWert, MedPlanEintrag } from '../kern/typen';
import { uhrzeit } from './ansicht';

export type AkteReiter = 'ueberblick' | 'kurve' | 'medikation' | 'anordnungen' | 'bericht' | 'befunde' | 'assessments' | 'planung';

export const AKTE_REITER: ReadonlyArray<{ id: AkteReiter; titel: string }> = [
  { id: 'ueberblick', titel: 'Überblick' },
  { id: 'kurve', titel: 'Kurve' },
  { id: 'medikation', titel: 'Medikation' },
  { id: 'anordnungen', titel: 'Anordnungen' },
  { id: 'bericht', titel: 'Pflegebericht' },
  { id: 'befunde', titel: 'Labor & Befunde' },
  { id: 'assessments', titel: 'Assessments' },
  { id: 'planung', titel: 'Pflegeplanung' },
];

export const akte = (z: SimZustand): Akte => akteVon(z.fall);
/** Minimal-Akte (aus den Personendaten), wenn der Fall keine eigene hat */
export const istMinimal = (z: SimZustand) => !z.fall.akte;

/** Eigenes Kürzel in der Akte */
export const eigenesKuerzel = (z: SimZustand) => (z.rolle === 'pflegefachperson' ? 'PFP (du)' : `Azubi ${z.rolle}. Dr. (du)`);
const mitPa = (z: SimZustand, id: string, t: number) =>
  z.log.some((e) => e.art === 'pa-eingriff' && e.typ === 'unterstuetzt' && e.massnahmeId === id && e.t === t);

/* ─────────────────────────── Kurvenblatt ─────────────────────────── */

export interface KurvenSpalte {
  /** Spielzeit (negativ = vor dem Fall) */
  t: number;
  label: string;
  quelle: 'vorwert' | 'messung';
  kuerzel?: string;
  werte: Partial<Record<KurvenWert, number>>;
}

/** Spalten des Kurvenblatts: Vorwerte aus der Akte, dann eigene Messungen und dokumentierte Werte im Fall (gleiche Minute = eine Spalte). */
export function kurvenSpalten(z: SimZustand): KurvenSpalte[] {
  const vor: KurvenSpalte[] = (akte(z).vorwerte ?? []).map((v) => ({ t: -v.vorH * 3600, label: v.zeit, quelle: 'vorwert', ...(v.kuerzel ? { kuerzel: v.kuerzel } : {}), werte: { ...v.werte } }));
  vor.sort((a, b) => a.t - b.t);
  const eigene: KurvenSpalte[] = [];
  for (const m of z.meldungen) {
    if (!m.werte || (m.art !== 'befund' && m.art !== 'doku')) continue;
    const label = uhrzeit(z.fall.startUhrzeit, m.t);
    const letzte = eigene.at(-1);
    const w = kurvenwerte(m.werte);
    if (letzte && letzte.label === label) Object.assign(letzte.werte, w);
    else eigene.push({ t: m.t, label, quelle: 'messung', kuerzel: 'du', werte: w });
  }
  return [...vor, ...eigene];
}

export const KURVEN_ZEILEN: ReadonlyArray<{ id: KurvenWert | 'rr'; label: string; einheit: string }> = [
  { id: 'rr', label: 'RR', einheit: 'mmHg' },
  { id: 'hf', label: 'Puls', einheit: '/min' },
  { id: 'temp', label: 'Temp', einheit: '°C' },
  { id: 'spo2', label: 'SpO₂', einheit: '%' },
  { id: 'af', label: 'AF', einheit: '/min' },
  { id: 'bz', label: 'BZ', einheit: 'mg/dl' },
  { id: 'schmerz', label: 'Schmerz', einheit: 'NRS' },
  { id: 'gewicht', label: 'Gewicht', einheit: 'kg' },
];

const ganz = (n: number) => Math.round(n).toLocaleString('de-DE');
const eins = (n: number) => n.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function zellText(s: KurvenSpalte, id: KurvenWert | 'rr'): string {
  const w = s.werte;
  if (id === 'rr') return w.rrSys !== undefined ? `${ganz(w.rrSys)}/${w.rrDia !== undefined ? ganz(w.rrDia) : '–'}` : '';
  const v = w[id];
  if (v === undefined) return '';
  return id === 'temp' || id === 'gewicht' ? eins(v) : ganz(v);
}

/** Zeilen ohne einen einzigen Wert weglassen (z. B. BZ bei Frau Lindner) */
export const kurvenZeilen = (spalten: readonly KurvenSpalte[]) =>
  KURVEN_ZEILEN.filter((r) => spalten.some((s) => zellText(s, r.id) !== ''));

/** Bilanz als Text: Vortag aus der Akte, im Fall nur, wenn das Bilanz-Modul läuft (Spur B). */
export function bilanzText(z: SimZustand, bilanzMl: number | undefined): string[] {
  const r: string[] = [];
  const v = akte(z).bilanzVortag;
  if (v) r.push(`Vortag: Einfuhr ${ganz(v.einfuhrMl)} ml, Ausfuhr ${ganz(v.ausfuhrMl)} ml, Bilanz ${v.einfuhrMl - v.ausfuhrMl >= 0 ? '+' : ''}${ganz(v.einfuhrMl - v.ausfuhrMl)} ml`);
  if (bilanzMl !== undefined && z.module?.bilanz) r.push(`Seit Fallbeginn: Bilanz ${bilanzMl >= 0 ? '+' : ''}${ganz(bilanzMl)} ml`);
  return r;
}

/* ─────────────────────────── Medikation ─────────────────────────── */

export interface Gabe { t: number; uhr: string; kuerzel: string; fehler?: string }

export interface MedZeile {
  eintrag: MedPlanEintrag;
  name: string;
  art: 'dauer' | 'bedarf';
  /** Schema in vier Spalten morgens/mittags/abends/nachts */
  schema: [string, string, string, string];
  /** Schema, das nicht in vier Spalten passt (z. B. „8-16-24 Uhr“, „alle 6 h“): als Text über alle Spalten */
  schemaText?: string;
  zuletztVorFall?: string;
  gaben: Gabe[];
  /** Durch Anordnung im Fall geändert (z. B. pausiert) */
  geaendert?: { text: string; uhr: string };
  zurueckgehalten?: string;
  priscus: boolean;
}

/** Nur „1-0-1-0“-artige Schemata (1 bis 4 Zahlen/Brüche) gehen in Spalten; alles andere bleibt Text. */
export const istSpaltenSchema = (schema: string | undefined) => !schema || /^\s*[\d½¼¾.,/]+(\s*[-–]\s*[\d½¼¾.,/]+){0,3}\s*$/.test(schema);

function schemaSpalten(schema: string | undefined): MedZeile['schema'] {
  const teile = (schema ?? '').split(/[-–]/).map((x) => x.trim());
  return [0, 1, 2, 3].map((i) => teile[i] ?? (schema ? '0' : '')) as MedZeile['schema'];
}

/** Medikationsplan mit Gaben im Fall (automatisch abgezeichnet mit Uhrzeit und Kürzel) und Änderungen durch Anordnungen. */
export function medikation(z: SimZustand): MedZeile[] {
  // Einträge mit `ab` erscheinen erst, wenn die Anordnung da ist (auch zurückgezogen bleiben die Gaben sichtbar)
  const plan = akte(z).medikation.filter((e) => giltAb(e, z.anordnungen) !== undefined);
  return plan.map((e) => {
    const geaendert = istGeaendert(e, z.anordnungen, z.zurueckgezogen) ? z.anordnungen[e.geaendertDurch!] : undefined;
    const anordnung = geaendert ? z.fall.anordnungen.find((a) => a.id === e.geaendertDurch) : undefined;
    const zeiten = e.massnahme ? z.getan[e.massnahme] ?? [] : [];
    const gaben: Gabe[] = zeiten
      .filter((t) => (!geaendert || t < geaendert.t) && t >= (giltAb(e, z.anordnungen) ?? 0))
      .map((t) => {
        const fehler = z.meldungen.find((m) => m.art === 'fehler' && m.t === t && !!m.quelle?.startsWith('med-') && m.quelle.endsWith(`:${e.id}`));
        return { t, uhr: uhrzeit(z.fall.startUhrzeit, t), kuerzel: `${eigenesKuerzel(z)}${e.massnahme && mitPa(z, e.massnahme, t) ? ' mit PA' : ''}`, ...(fehler ? { fehler: fehler.text } : {}) };
      });
    const zurueck = e.wirkstoff ? Object.keys(z.getan).find((id) => id.endsWith('-zurueckhalten') && id.startsWith(e.wirkstoff.toLowerCase())) : undefined;
    return {
      eintrag: e, name: medName(e), art: e.bedarf ? 'bedarf' : 'dauer', schema: schemaSpalten(istSpaltenSchema(e.schema) ? e.schema : undefined),
      ...(istSpaltenSchema(e.schema) ? {} : { schemaText: e.schema }),
      ...(e.zuletzt ? { zuletztVorFall: e.zuletzt } : {}),
      gaben,
      ...(geaendert && anordnung ? { geaendert: { text: anordnung.text, uhr: uhrzeit(z.fall.startUhrzeit, geaendert.t) } } : {}),
      ...(zurueck ? { zurueckgehalten: uhrzeit(z.fall.startUhrzeit, z.getan[zurueck]!.at(-1)!) } : {}),
      priscus: /priscus/i.test(e.hinweis ?? ''),
    } satisfies MedZeile;
  });
}

/** Im Fall neu angeordnete Medikamente, die nicht im Plan stehen (z. B. Lorazepam), mit Gaben */
export function neuAngeordnet(z: SimZustand): Array<{ id: string; text: string; uhr: string; gaben: Gabe[]; zurueckgezogen: boolean }> {
  const planMassnahmen = new Set(akte(z).medikation.map((e) => e.massnahme).filter(Boolean));
  return z.fall.anordnungen.flatMap((a) => {
    const erhalten = z.anordnungen[a.id];
    const def = massnahme(z.fall, a.massnahme);
    if (!erhalten || erhalten.t === 0 || !def?.anordnungspflichtig || def.reiter !== 'versorgen' || planMassnahmen.has(a.massnahme) || a.massnahme.endsWith('-zurueckhalten')) return [];
    const gaben = (z.getan[a.massnahme] ?? []).map((t) => ({ t, uhr: uhrzeit(z.fall.startUhrzeit, t), kuerzel: eigenesKuerzel(z) }));
    return [{ id: a.id, text: a.text, uhr: uhrzeit(z.fall.startUhrzeit, erhalten.t), gaben, zurueckgezogen: z.zurueckgezogen.includes(a.id) }];
  });
}

/** Letzte Gabe vor dem Fall als lesbarer Text mit Abstand („gestern 08:10, vor 24 h“) */
export function zuletztText(z: SimZustand, zuletzt: string | undefined): string | undefined {
  const s = zuletztSek(zuletzt, z.fall.startUhrzeit);
  if (!zuletzt || s === undefined) return zuletzt;
  const h = Math.round((z.t - s) / 360) / 10;
  return `${zuletzt} (vor ${h.toLocaleString('de-DE')} h)`;
}

/* ─────────────────────────── Anordnungen ─────────────────────────── */

export interface AnordnungsZeile {
  zeit: string;
  wer: string;
  text: string;
  art: 'frueher' | 'plan' | 'muendlich' | 'offen' | 'zurueckgezogen';
  vermerk?: string;
}

export function anordnungsZeilen(z: SimZustand): AnordnungsZeile[] {
  const frueher: AnordnungsZeile[] = (akte(z).aerztlicheAnordnungen ?? []).map((a) => ({ zeit: a.zeit, wer: a.wer, text: a.text, art: 'frueher' }));
  const arzt = z.fall.arzt.name;
  const imFall = z.fall.anordnungen.flatMap((a): AnordnungsZeile[] => {
    const e = z.anordnungen[a.id];
    if (z.zurueckgezogen.includes(a.id)) return [{ zeit: e ? uhrzeit(z.fall.startUhrzeit, e.t) : '', wer: arzt, text: a.text, art: 'zurueckgezogen', vermerk: 'Hinterfragt (remonstriert), von der Ärztin zurückgenommen.' }];
    if (z.angeboten.includes(a.id)) return [{ zeit: 'jetzt', wer: arzt, text: a.text, art: 'offen', vermerk: 'Noch nicht bestätigt: im Reiter Melden rücklesen oder hinterfragen.' }];
    if (!e) return [];
    if (e.t === 0) return [{ zeit: 'gilt', wer: arzt, text: a.text, art: 'plan' }];
    return [{ zeit: uhrzeit(z.fall.startUhrzeit, e.t), wer: arzt, text: a.text, art: 'muendlich',
      vermerk: e.rueckgelesen ? 'Telefonisch angeordnet, vorgelesen und bestätigt (VuG).' : 'Telefonisch angeordnet, NICHT rückgelesen.' }];
  });
  return [...frueher, ...imFall];
}

/* ─────────────────────────── Pflegebericht ─────────────────────────── */

export interface BerichtZeile extends AkteEintrag { eigen: boolean }

export function bericht(z: SimZustand): BerichtZeile[] {
  const frueher = (akte(z).pflegebericht ?? []).map((e) => ({ ...e, eigen: false }));
  const eigene = z.meldungen.filter((m) => m.art === 'doku').map((m) => ({ zeit: uhrzeit(z.fall.startUhrzeit, m.t), wer: eigenesKuerzel(z), text: m.text, eigen: true }));
  return [...frueher, ...eigene];
}

export const DOKU_GRUPPEN: ReadonlyArray<{ id: DokuGruppe; titel: string }> = [
  { id: 'werte', titel: 'Messwerte' },
  { id: 'beobachtung', titel: 'Beobachtungen und Befunde' },
  { id: 'massnahme', titel: 'Durchgeführte Maßnahmen' },
  { id: 'anordnung', titel: 'Ärztliche Anordnungen' },
  { id: 'einschaetzung', titel: 'Einschätzung' },
];

export function dokuGruppen(z: SimZustand): Array<{ id: DokuGruppe; titel: string; bausteine: DokuBaustein[] }> {
  const alle = dokuBausteine(z);
  return DOKU_GRUPPEN.map((g) => ({ ...g, bausteine: alle.filter((b) => b.gruppe === g.id) })).filter((g) => g.bausteine.length > 0);
}

/* ─────────────────────────── Befunde & Assessments ─────────────────────────── */

const IST_ASSESSMENT = /screening|4at|besd|braden|nrs|skala|bps|gcs|avpu|news|barthel|mna|cam|nu-desc|rass|einschaetz/i;

export interface EigenerBefund { uhr: string; name: string; text: string; assessment: boolean }

export function eigeneBefunde(z: SimZustand): EigenerBefund[] {
  return z.meldungen.filter((m) => m.art === 'befund' && m.quelle).map((m) => ({
    uhr: uhrzeit(z.fall.startUhrzeit, m.t), name: massnahme(z.fall, m.quelle!)?.name ?? m.quelle!, text: m.text, assessment: IST_ASSESSMENT.test(m.quelle!),
  }));
}

/* ─────────────────────────── Überblick ─────────────────────────── */

export function alterText(z: SimZustand): string {
  const a = z.fall.person.alter;
  return a.jahre !== undefined ? `${a.jahre} Jahre` : `${a.monate ?? 0} Monate`;
}

export const allergieBekannt = (allergien: readonly string[]) => allergien.some((a) => !/keine/i.test(a));
