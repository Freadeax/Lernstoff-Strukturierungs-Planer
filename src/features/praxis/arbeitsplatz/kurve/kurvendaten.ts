// Praxissimulator neu – Daten für Verlaufskurve (P12) und Kurvenblatt der Akte (P13). Rein, ohne React.
// Grundsatz: nur Gemessenes und Sichtbares. Messpunkte kommen aus `Meldung.werte` (Momentaufnahme zum
// Messzeitpunkt), die Monitorlinie nur für Größen, die gerade an einem laufenden Gerät hängen
// (Monitor ab Fallbeginn oder angelegtes Pulsoxymeter/Monitor). Versteckte Modellwerte erscheinen nie.

import { eingabeText, zeitleiste } from '../../kern/auswertung';
import { massnahme, type Meldung, type SimZustand } from '../../kern/kern';
import type { Anzeige, FallV2, KurvenWert, Vorwert } from '../../kern/typen';

export type KurvenQuelle = 'vorwert' | 'messung' | 'monitor';

export interface KurvenPunkt {
  /** Sekunden ab Fallbeginn; Vorwerte negativ (−vorH · 3600) */
  t: number;
  werte: Partial<Record<KurvenWert, number>>;
  quelle: KurvenQuelle;
  /** Anzeige statt Uhrzeit, z. B. „gestern 18:00“ (Vorwerte) */
  label?: string;
  kuerzel?: string;
}

export type MarkenArt = 'handlung' | 'anordnung' | 'ereignis' | 'alarm' | 'verlauf' | 'nachricht' | 'doku';

export interface KurvenMarke {
  t: number;
  art: MarkenArt;
  text: string;
  /** wichtige Verschlechterung oder roter Alarm */
  wichtig?: boolean;
  /** false: Handlung kam nicht zustande (PA hat gestoppt, Gerät fehlte …) */
  ausgefuehrt?: boolean;
}

export interface KurvenDaten {
  /** Vorwerte und eigene Messungen (Momentaufnahmen), zeitlich sortiert */
  punkte: KurvenPunkt[];
  /** laufende Gerätewerte im 5-s-Raster (nur sichtbare Größen) */
  monitor: KurvenPunkt[];
  marken: KurvenMarke[];
  /** Spielzeit jetzt */
  ende: number;
}

/** Geräte, deren Werte nach dem Anlegen laufend angezeigt werden (wie in der Werteleiste). */
export const LIVE_GERAETE: ReadonlySet<string> = new Set(['pulsoxy', 'monitor']);

const KURVEN_WERTE: ReadonlySet<string> = new Set<KurvenWert>(['rrSys', 'rrDia', 'hf', 'af', 'spo2', 'temp', 'bz', 'schmerz', 'gewicht']);
const MONITOR_WERTE = ['hf', 'rrSys', 'rrDia', 'spo2', 'af', 'temp'] as const;

function nurKurvenwerte(w: Meldung['werte']): KurvenPunkt['werte'] {
  const r: KurvenPunkt['werte'] = {};
  for (const [k, v] of Object.entries(w ?? {})) if (KURVEN_WERTE.has(k) && typeof v === 'number' && Number.isFinite(v)) r[k as KurvenWert] = v;
  return r;
}

/** Eigene Messungen aus den Meldungen (Befunde, Schmerzeinschätzung, Doku mit Werten). */
export function messpunkte(meldungen: readonly Meldung[]): KurvenPunkt[] {
  const out: KurvenPunkt[] = [];
  for (const m of meldungen) {
    if (!m.werte) continue;
    const werte = nurKurvenwerte(m.werte);
    if (Object.keys(werte).length) out.push({ t: m.t, werte, quelle: 'messung' });
  }
  return out;
}

/** Vorwerte aus der Akte als Kurvenpunkte (t = −vorH · 3600, Label = Zeitangabe der Akte). */
export function vorwertPunkte(vorwerte: readonly Vorwert[] | undefined): KurvenPunkt[] {
  return (vorwerte ?? []).map((v) => ({ t: -Math.round(v.vorH * 3600), werte: { ...v.werte }, quelle: 'vorwert' as const, label: v.zeit, ...(v.kuerzel ? { kuerzel: v.kuerzel } : {}) }))
    .sort((a, b) => a.t - b.t);
}

/** Ab wann welche Größe live an einem Gerät hängt: Monitor ab Fallbeginn, sonst ab Anlegen von Pulsoxy/Monitor. */
export function liveAb(z: SimZustand): Partial<Record<keyof Anzeige, number>> {
  const ab: Partial<Record<keyof Anzeige, number>> = {};
  for (const k of z.fall.start.sichtbar ?? []) ab[k] = 0;
  for (const m of z.meldungen) {
    if (m.art !== 'befund' || !m.quelle || !m.zeigt) continue;
    const g = massnahme(z.fall, m.quelle)?.geraet;
    if (!g || !LIVE_GERAETE.has(g)) continue;
    for (const k of m.zeigt) ab[k] ??= m.t;
  }
  return ab;
}

/** Monitorlinie per Replay im 5-s-Raster, gefiltert auf die zu jedem Zeitpunkt sichtbaren Live-Größen. */
export function monitorPunkte(z: SimZustand): KurvenPunkt[] {
  const ab = liveAb(z);
  if (!Object.keys(ab).length) return [];
  const out: KurvenPunkt[] = [];
  for (const p of zeitleiste(z).punkte) {
    const werte: KurvenPunkt['werte'] = {};
    for (const k of MONITOR_WERTE) {
      const seit = ab[k];
      if (seit !== undefined && p.t >= seit) werte[k] = p[k];
    }
    if (Object.keys(werte).length) out.push({ t: p.t, werte, quelle: 'monitor' });
  }
  return out;
}

const GROESSE_NAME: Partial<Record<keyof Anzeige, string>> = { hf: 'Puls', spo2: 'SpO₂', rrSys: 'RR', af: 'Atemfrequenz', temp: 'Temperatur' };

/** Markierungen: eigene Handlungen, Anordnungen, Nachrichten, Ereignisse, Alarme, sichtbare Veränderungen. */
export function marken(z: SimZustand): KurvenMarke[] {
  const fall = z.fall;
  const out: KurvenMarke[] = [];
  const gewarnt = new Set(z.log.flatMap((l) => (l.art === 'pa-eingriff' && l.typ !== 'unterstuetzt' ? [`${l.t}:${l.massnahmeId}`] : [])));
  for (const l of z.log) {
    switch (l.art) {
      case 'massnahme': case 'frage': case 'pflegetasche': case 'entscheidung': case 'anleitung-anfordern': case 'pa-fragen':
        out.push({ t: l.t, art: 'handlung', text: eingabeText(fall, l), ...(l.art === 'massnahme' && gewarnt.has(`${l.t}:${l.id}`) ? { ausgefuehrt: false } : {}) });
        break;
      case 'anruf': case 'nachricht': case 'auflegen':
        out.push({ t: l.t, art: 'nachricht', text: eingabeText(fall, l) });
        break;
      case 'rueckmelden': case 'remonstrieren':
        out.push({ t: l.t, art: 'anordnung', text: eingabeText(fall, l) });
        break;
      case 'dokumentieren':
        out.push({ t: l.t, art: 'doku', text: eingabeText(fall, l) });
        break;
      case 'ereignis':
        out.push({ t: l.t, art: 'ereignis', text: fall.ereignisse.find((e) => e.id === l.id)?.text ?? l.id });
        break;
      case 'alarm':
        out.push({ t: l.t, art: 'alarm', text: `Alarm ${l.stufe === 'rot' ? 'rot' : 'gelb'}: ${GROESSE_NAME[l.groesse] ?? l.groesse}`, wichtig: l.stufe === 'rot' });
        break;
    }
  }
  for (const m of z.meldungen) if (m.art === 'verlauf') out.push({ t: m.t, art: 'verlauf', text: m.text, ...(m.wichtig ? { wichtig: true } : {}) });
  return out.sort((a, b) => a.t - b.t);
}

export function kurvendaten(z: SimZustand, opt: { vorwerte?: readonly Vorwert[]; monitor?: boolean } = {}): KurvenDaten {
  return {
    punkte: [...vorwertPunkte(opt.vorwerte), ...messpunkte(z.meldungen)],
    monitor: opt.monitor === false ? [] : monitorPunkte(z),
    marken: marken(z),
    ende: z.t,
  };
}

/* ─────────────────────────── Vorher / nachher ─────────────────────────── */

export interface Vergleich {
  groesse: KurvenWert;
  vorher: { wert: number; wert2?: number; t: number };
  nachher: { wert: number; wert2?: number; t: number };
}

const VERGLEICH_GROESSEN: readonly KurvenWert[] = ['rrSys', 'hf', 'spo2', 'af', 'temp', 'bz', 'schmerz'];

function letzter(liste: readonly KurvenPunkt[], k: KurvenWert, bis: number, nach = -Infinity): KurvenPunkt | undefined {
  let r: KurvenPunkt | undefined;
  for (const p of liste) if (p.t <= bis && p.t > nach && p.werte[k] !== undefined && (!r || p.t >= r.t)) r = p;
  return r;
}

/**
 * Vergleich vor und nach einer Handlung zum Zeitpunkt `t`: letzter Wert bis `t` gegen den jüngsten Wert danach.
 * Nur eigene Messungen und sichtbare Gerätewerte; ohne Messung danach kein Vergleich.
 */
export function vorherNachher(d: KurvenDaten, t: number, groessen: readonly KurvenWert[] = VERGLEICH_GROESSEN): Vergleich[] {
  const alle = [...d.punkte.filter((p) => p.quelle === 'messung'), ...d.monitor];
  const out: Vergleich[] = [];
  for (const k of groessen) {
    const v = letzter(alle, k, t);
    const n = letzter(alle, k, d.ende, t);
    if (!v || !n || n.t - t < 30) continue;
    const zwei = k === 'rrSys' ? { wert2: v.werte.rrDia } : {};
    const zweiN = k === 'rrSys' ? { wert2: n.werte.rrDia } : {};
    out.push({ groesse: k, vorher: { wert: v.werte[k]!, t: v.t, ...zwei }, nachher: { wert: n.werte[k]!, t: n.t, ...zweiN } });
  }
  return out;
}

/** Hat eine Maßnahme eine Wirkung, deren Verlauf sich zu vergleichen lohnt (Wirkkurve, Treiber, Gerät)? */
export function wirktAufWerte(fall: FallV2, id: string): boolean {
  const m = massnahme(fall, id);
  return !!m && !!(m.wirkung?.length || m.treiber?.length || m.beendet?.length || m.modul);
}
