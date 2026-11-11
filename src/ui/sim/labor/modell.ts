// Labor als Modell: Werte entstehen aus dem Krankheitsverlauf (Drift über die Zeit) und aus Therapien,
// die ab einem Zeitpunkt wirken. Ein Auftrag friert den wahren Wert zum Abnahmezeitpunkt ein, die
// Präanalytik kann ihn verfälschen, und das Ergebnis liegt erst nach Transport und Laufzeit vor.
// Rein und deterministisch.

import { bewerte, istKritisch, parameter, referenz, type Flag, type Geschlecht } from './parameter';
import { benoetigteRoehrchen, fehlerAus, verfaelsche, type Abnahme, type PraeanalytikFehler } from './praeanalytik';

export interface Therapie { flag: string; ziel: number; /** Zeitkonstante in Minuten (nach ~3 τ fast am Ziel) */ tauMin: number }

export interface Verlauf {
  /** Wert bei Minute 0 (Fallbeginn). */
  basis: number;
  /** Änderung pro Stunde ohne Behandlung (Krankheit schreitet fort). */
  proStunde?: number;
  /** Drift hält hier an (z. B. Laktat steigt nicht unbegrenzt). */
  grenze?: number;
  /** Therapien, die den Wert ab dem Setzen des Flags in Richtung Ziel bewegen. */
  therapie?: Therapie[];
  /** Frühere Werte für den Kumulativbefund, Minuten negativ (z. B. -1440 = gestern). */
  vorwerte?: { minute: number; wert: number }[];
}

/** Flags mit dem Zeitpunkt (Minute), ab dem sie gelten. */
export type Flags = Record<string, number>;

function drift(v: Verlauf, von: number, bis: number, start: number): number {
  if (!v.proStunde) return start;
  const w = start + (v.proStunde * (bis - von)) / 60;
  if (v.grenze === undefined) return w;
  return v.proStunde > 0 ? Math.min(w, Math.max(start, v.grenze)) : Math.max(w, Math.min(start, v.grenze));
}

/** Wahrer Wert zur Minute t. */
export function wahrerWert(v: Verlauf, t: number, flags: Flags = {}): number {
  if (t < 0 && v.vorwerte?.length) {
    const vor = [...v.vorwerte].sort((a, b) => Math.abs(a.minute - t) - Math.abs(b.minute - t));
    return vor[0].wert;
  }
  const aktiv = (v.therapie ?? []).filter((th) => flags[th.flag] !== undefined && flags[th.flag] <= t).sort((a, b) => flags[a.flag] - flags[b.flag]);
  if (!aktiv.length) return drift(v, 0, t, v.basis);
  let zeit = flags[aktiv[0].flag];
  let wert = drift(v, 0, zeit, v.basis);
  aktiv.forEach((th, i) => {
    const ende = i + 1 < aktiv.length ? flags[aktiv[i + 1].flag] : t;
    wert = th.ziel + (wert - th.ziel) * Math.exp(-(ende - zeit) / Math.max(1, th.tauMin));
    zeit = ende;
  });
  return wert;
}

export type Prioritaet = 'routine' | 'notfall';

export interface Auftrag {
  id: string;
  parameter: string[];
  prioritaet: Prioritaet;
  /** Minute der Abnahme. */
  minute: number;
  abnahme: Abnahme;
}

export interface Ergebnis {
  parameter: string;
  /** undefined, wenn die Probe abgelehnt wurde. */
  wert?: number;
  /** Wahrer Wert (nur fürs Debriefing). */
  wahr: number;
  flag: Flag;
  fertig: number;
  kommentar?: string;
  /** Labor meldet sich telefonisch (kritischer Wert aus dem Zentrallabor). */
  anruf: boolean;
  /** Durch einen Präanalytikfehler verfälscht. */
  verfaelscht: boolean;
}

export interface AuftragsErgebnis { auftrag: Auftrag; fehler: PraeanalytikFehler[]; ergebnisse: Ergebnis[] }

/** Transportzeit ins Zentrallabor in Minuten. */
export const TRANSPORT = { sofort: 15, liegen: 150 };

export function werteAuftrag(auftrag: Auftrag, labor: Record<string, Verlauf>, flags: Flags, geschlecht: Geschlecht = 'w', kind = false): AuftragsErgebnis {
  const materialien = benoetigteRoehrchen(auftrag.parameter);
  const fehler = fehlerAus(auftrag.abnahme, materialien);
  const abgelehnt = fehler.some((f) => f.abgelehnt);
  const ergebnisse = auftrag.parameter.map((id): Ergebnis => {
    const p = parameter(id);
    const verlauf = labor[id];
    const wahr = verlauf ? wahrerWert(verlauf, auftrag.minute, flags) : mitteDerReferenz(id, geschlecht, kind);
    const betroffen = fehler.filter((f) => f.wirkung.some((w) => w.id === id));
    let wert: number | undefined = p.ort === 'poct' ? wahr : verfaelsche(id, wahr, betroffen);
    if (p.stufen) wert = Math.max(0, Math.min(p.stufen.length - 1, Math.round(wert)));
    const transport = p.ort === 'poct' ? 0 : auftrag.abnahme.sofortTransport ? TRANSPORT.sofort : TRANSPORT.liegen;
    const fertig = auftrag.minute + transport + p.laufzeit[auftrag.prioritaet];
    const citratAbgelehnt = p.material === 'citrat' && fehler.some((f) => f.art === 'citrat');
    const nichtVerwertbar = p.ort !== 'poct' && (abgelehnt || citratAbgelehnt);
    const kommentar = p.ort === 'poct' ? undefined : (nichtVerwertbar ? fehler.find((f) => f.abgelehnt || (citratAbgelehnt && f.art === 'citrat'))?.laborKommentar : betroffen.map((f) => f.laborKommentar).filter(Boolean).join(' ') || undefined);
    if (nichtVerwertbar) return { parameter: id, wahr, flag: 'normal', fertig, kommentar, anruf: false, verfaelscht: false };
    const flag = bewerte(p, wert, geschlecht, kind);
    return { parameter: id, wert, wahr, flag, fertig, kommentar, anruf: p.ort === 'labor' && istKritisch(flag), verfaelscht: betroffen.length > 0 && Math.abs(wert - wahr) > 1e-9 };
  });
  return { auftrag, fehler: abgelehnt ? fehler.filter((f) => f.abgelehnt) : fehler, ergebnisse };
}

function mitteDerReferenz(id: string, g: Geschlecht, kind: boolean): number {
  const p = parameter(id);
  if (p.stufen) return 0;
  const r = referenz(p, g, kind);
  if (r.min !== undefined && r.max !== undefined) return (r.min + r.max) / 2;
  return r.max !== undefined ? r.max * 0.4 : (r.min ?? 0) * 1.3;
}

/** Kumulativbefund: alle fertigen Werte je Parameter, zeitlich sortiert, inkl. Vorwerte. */
export function kumulativ(ergebnisse: AuftragsErgebnis[], labor: Record<string, Verlauf>, jetzt: number): Record<string, { minute: number; wert: number; ergebnis?: Ergebnis }[]> {
  const out: Record<string, { minute: number; wert: number; ergebnis?: Ergebnis }[]> = {};
  for (const [id, v] of Object.entries(labor)) for (const vw of v.vorwerte ?? []) (out[id] ??= []).push({ minute: vw.minute, wert: vw.wert });
  for (const a of ergebnisse) for (const e of a.ergebnisse) {
    if (e.fertig > jetzt || e.wert === undefined) continue;
    (out[e.parameter] ??= []).push({ minute: a.auftrag.minute, wert: e.wert, ergebnis: e });
  }
  for (const k of Object.keys(out)) out[k].sort((a, b) => a.minute - b.minute);
  return out;
}

/** Uhrzeit im Fall: Minute 0 = Startzeit. */
export function uhrzeit(start: string, minute: number): string {
  const [h, m] = start.split(':').map(Number);
  const gesamt = ((h * 60 + m + Math.round(minute)) % 1440 + 1440) % 1440;
  return `${String(Math.floor(gesamt / 60)).padStart(2, '0')}:${String(gesamt % 60).padStart(2, '0')}`;
}

export function vorZeit(minute: number): string {
  const m = -minute;
  if (m >= 1440) { const d = Math.round(m / 1440); return d === 1 ? 'gestern' : `vor ${d} Tagen`; }
  if (m >= 60) return `vor ${Math.round(m / 60)} h`;
  return `vor ${m} min`;
}
