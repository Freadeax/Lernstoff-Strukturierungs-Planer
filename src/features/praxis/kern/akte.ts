// Praxissimulator neu – Patientenakte im Kern (Paket P13). Rein und deterministisch.
// 1. Medikationsprüfung gegen den Plan (fall.akte.medikation): Doppelgabe, Bedarfs-Abstand, Höchstmenge pro Tag.
//    Einträge mit `ab` (Anordnungs-ID) gelten erst nach dieser Anordnung im Fall.
// 2. Bausteine für den Pflegebericht (Eingabe `dokumentieren`): Messwerte, Befunde, Maßnahmen, Anordnungen, SBAR-Einschätzungen.
// Kein Import aus kern.ts (keine Ringabhängigkeit): kern.ts übergibt, was gebraucht wird.

import type { Akte, Anordnung, Anzeige, Bedingung, FallV2, KurvenWert, MassnahmeDefinition, MedPlanEintrag, SbarBaustein } from './typen';

/* ─────────────────────────── Zeit ─────────────────────────── */

/** „08:15“ → Sekunden seit Mitternacht */
export function uhrSek(uhr: string): number {
  const [h, m] = uhr.split(':').map(Number);
  return (h || 0) * 3600 + (m || 0) * 60;
}

/**
 * Letzte Gabe vor Fallbeginn als Spielzeit (negativ): „07:30“ = heute, „gestern 20:00“ = Vortag.
 * Liegt eine Uhrzeit ohne „gestern“ nach der Startzeit, ist sie vom Vortag.
 */
export function zuletztSek(zuletzt: string | undefined, startUhrzeit: string): number | undefined {
  if (!zuletzt) return undefined;
  const treffer = /(\d{1,2}):(\d{2})/.exec(zuletzt);
  if (!treffer) return undefined;
  const sek = uhrSek(`${treffer[1]}:${treffer[2]}`);
  const start = uhrSek(startUhrzeit);
  const tage = /vorgestern/i.test(zuletzt) ? 2 : /gestern/i.test(zuletzt) || sek > start ? 1 : 0;
  return sek - start - tage * 86400;
}

/* ─────────────────────── Medikationsplan ─────────────────────── */

/** Einträge im Plan, die über diese Maßnahme gegeben werden */
export const planEintraege = (fall: FallV2, massnahmeId: string): MedPlanEintrag[] =>
  (fall.akte?.medikation ?? []).filter((e) => e.massnahme === massnahmeId);

/** Eintrag ist durch eine erhaltene Anordnung geändert (z. B. pausiert) */
export const istGeaendert = (e: MedPlanEintrag, anordnungen: Readonly<Record<string, unknown>>, zurueckgezogen: readonly string[] = []) =>
  !!e.geaendertDurch && !!anordnungen[e.geaendertDurch] && !zurueckgezogen.includes(e.geaendertDurch);

/** Spielzeit, ab der der Eintrag gilt: 0 ohne `ab`, sonst Zeitpunkt der Anordnung; undefined = noch nicht angeordnet. */
export function giltAb(e: MedPlanEintrag, anordnungen: Readonly<Record<string, unknown>>): number | undefined {
  if (!e.ab) return 0;
  const a = anordnungen[e.ab] as { t?: number } | undefined;
  return a ? a.t ?? 0 : undefined;
}

/** Eintrag gilt jetzt: ohne `ab` immer, sonst nach erhaltener und nicht zurückgezogener Anordnung. */
export const istAktiv = (e: MedPlanEintrag, anordnungen: Readonly<Record<string, unknown>>, zurueckgezogen: readonly string[] = []) =>
  giltAb(e, anordnungen) !== undefined && !(e.ab && zurueckgezogen.includes(e.ab));

/** Gaben pro Tag aus dem Schema („1-0-1-0“ → 2) */
export function gabenProTag(schema: string | undefined): number {
  if (!schema) return 0;
  return schema.split(/[-–/]/).map((s) => Number(s.replace(',', '.').trim())).filter((n) => Number.isFinite(n) && n > 0).length;
}

/** Mindestabstand zwischen zwei Gaben in Stunden: Bedarf nach Plan, Dauermedikation aus dem Schema. */
export function mindestAbstandH(e: MedPlanEintrag): number {
  if (e.bedarf) return e.bedarf.abstandH ?? 0;
  const n = gabenProTag(e.schema);
  return n <= 1 ? 12 : n === 2 ? 6 : 3;
}

/** Höchstzahl Gaben pro Tag bei Bedarf: „3 Gaben“, „3×“, sonst Menge/Einzeldosis bei gleicher Einheit („4 g“ / „1 g“). */
export function hoechstGaben(e: MedPlanEintrag): number | undefined {
  if (!e.bedarf) return undefined;
  const max = e.bedarf.maxProTag.replace(',', '.');
  const anzahl = /(\d+)\s*(?:x|×|mal|gaben?|stück|tbl)/i.exec(max);
  if (anzahl) return Number(anzahl[1]);
  const m = /([\d.]+)\s*([a-zµμ]+)/i.exec(max);
  const d = /([\d.]+)\s*([a-zµμ]+)/i.exec(e.bedarf.einzeldosis.replace(',', '.'));
  if (m && d && m[2]!.toLowerCase() === d[2]!.toLowerCase() && Number(d[1]) > 0) return Math.floor(Number(m[1]) / Number(d[1]));
  return undefined;
}

export type MedFehlerArt = 'med-doppelt' | 'med-abstand' | 'med-max';
export interface MedFehler { id: `${MedFehlerArt}:${string}`; art: MedFehlerArt; eintrag: string; text: string }

const zeitText = (startUhrzeit: string, t: number) => {
  const s = ((uhrSek(startUhrzeit) + Math.floor(t)) % 86400 + 86400) % 86400;
  const zwei = (n: number) => String(n).padStart(2, '0');
  return `${t < -uhrSek(startUhrzeit) ? 'gestern ' : ''}${zwei(Math.floor(s / 3600))}:${zwei(Math.floor((s % 3600) / 60))}`;
};

export const medName = (e: MedPlanEintrag) => `${e.wirkstoff}${e.handelsname ? ` (${e.handelsname})` : ''} ${e.staerke}`;

/**
 * Prüft eine gerade ausgeführte Gabe gegen den Medikationsplan.
 * `zeiten` = alle Zeitpunkte dieser Maßnahme im Fall, die letzte ist die aktuelle Gabe.
 */
export function medPruefung(fall: FallV2, massnahmeId: string, zeiten: readonly number[],
  anordnungen: Readonly<Record<string, unknown>>, zurueckgezogen: readonly string[] = []): MedFehler[] {
  const jetzt = zeiten.at(-1);
  if (jetzt === undefined) return [];
  const frueher = zeiten.slice(0, -1);
  const fehler: MedFehler[] = [];
  const tagBeginn = -uhrSek(fall.startUhrzeit);          // Mitternacht als Spielzeit
  for (const e of planEintraege(fall, massnahmeId)) {
    if (istGeaendert(e, anordnungen, zurueckgezogen) || !istAktiv(e, anordnungen, zurueckgezogen)) continue;
    const ab = giltAb(e, anordnungen)!;
    const vorher = [zuletztSek(e.zuletzt, fall.startUhrzeit), ...frueher.filter((t) => !e.ab || t >= ab)].filter((x): x is number => x !== undefined);
    const letzte = vorher.length ? Math.max(...vorher) : undefined;
    const abstandH = mindestAbstandH(e);
    if (letzte !== undefined && abstandH > 0 && jetzt - letzte < abstandH * 3600) {
      const art: MedFehlerArt = e.bedarf ? 'med-abstand' : 'med-doppelt';
      fehler.push({
        id: `${art}:${e.id}`, art, eintrag: e.id,
        text: e.bedarf
          ? `Abstand nicht eingehalten: ${medName(e)} zuletzt ${zeitText(fall.startUhrzeit, letzte)}, frühestens nach ${abstandH} h wieder (Plan: ${e.bedarf.einzeldosis}, max. ${e.bedarf.maxProTag}).`
          : `Doppelgabe: ${medName(e)} (${e.schema ?? 'Dauermedikation'}) wurde schon ${zeitText(fall.startUhrzeit, letzte)} gegeben.`,
      });
    }
    const max = hoechstGaben(e);
    if (max !== undefined) {
      const heute = [...vorher, jetzt].filter((x) => x >= tagBeginn).length;
      if (heute > max) {
        fehler.push({ id: `med-max:${e.id}`, art: 'med-max', eintrag: e.id, text: `Tageshöchstmenge überschritten: ${medName(e)} heute ${heute}× gegeben, erlaubt ${e.bedarf!.maxProTag}.` });
      }
    }
  }
  return fehler;
}

/** Text für einen Medikationsfehler aus dem Log (Auswertung, Zeitleiste) */
export function medFehlerText(fall: FallV2, id: string): string | undefined {
  const [art, eintrag] = id.split(':');
  const e = fall.akte?.medikation.find((x) => x.id === eintrag);
  if (!e) return undefined;
  if (art === 'med-doppelt') return `Doppelgabe ${medName(e)}`;
  if (art === 'med-abstand') return `Bedarfsmedikation ${medName(e)} zu früh wiederholt`;
  if (art === 'med-max') return `Tageshöchstmenge ${medName(e)} überschritten`;
  return undefined;
}
export const istMedFehler = (id: string) => /^med-(doppelt|abstand|max):/.test(id);

/* ─────────────────────── Minimal-Akte ─────────────────────── */

/** Fehlt `fall.akte`, wird sie aus `person` gebaut (Diagnosen, Plan als Text, Allergien). */
export function akteVon(fall: FallV2): Akte {
  if (fall.akte) return fall.akte;
  return {
    diagnosen: fall.person.diagnosenBekannt.map((text) => ({ text })),
    medikation: fall.person.medikamentePlan.map((zeile, i): MedPlanEintrag => {
      const schema = /\b(\d(?:[,.]\d)?(?:\s*-\s*\d(?:[,.]\d)?){2,3})\b/.exec(zeile)?.[1]?.replace(/\s/g, '');
      const ohne = schema ? zeile.replace(/\s*\d(?:[,.]\d)?(?:\s*-\s*\d(?:[,.]\d)?){2,3}\s*/, ' ').trim() : zeile;
      const staerke = /\d+(?:[,.]\d+)?\s*(?:mg|µg|g|ml|IE|I\.E\.|%)/i.exec(ohne)?.[0] ?? '';
      return { id: `plan-${i + 1}`, wirkstoff: staerke ? ohne.replace(staerke, '').trim() : ohne, staerke, form: '', ...(schema ? { schema } : {}) };
    }),
  };
}

/* ─────────────────────── Pflegebericht: Bausteine ─────────────────────── */

export type DokuGruppe = 'werte' | 'beobachtung' | 'massnahme' | 'anordnung' | 'einschaetzung';
export interface DokuBaustein { id: string; gruppe: DokuGruppe; text: string; t?: number }

/** Messwert-Snapshot einer Meldung: Anzeige-Schlüssel und Schmerz (NRS) */
export type Messwerte = Partial<Record<keyof Anzeige | 'schmerz', number>>;

/** Was der Kern für die Bausteine braucht (ohne SimZustand, damit keine Ringabhängigkeit entsteht). */
export interface DokuKontext {
  fall: FallV2;
  t: number;
  meldungen: ReadonlyArray<{ t: number; art: string; text: string; quelle?: string; werte?: Messwerte }>;
  getan: Readonly<Record<string, readonly number[]>>;
  anordnungen: Readonly<Record<string, { rueckgelesen: boolean; t: number }>>;
  zurueckgezogen: readonly string[];
  massnahme: (id: string) => MassnahmeDefinition | undefined;
  gilt: (b: Bedingung) => boolean;
}

const ganz = (n: number) => Math.round(n).toLocaleString('de-DE');
const eins = (n: number) => n.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Kurvenwerte und Anzeige-Schlüssel, die als Wert-Baustein taugen (in Reihenfolge des Kurvenblatts). */
export const WERT_TEXT: ReadonlyArray<{ k: keyof Anzeige | 'schmerz'; label: string; fmt: (w: Messwerte) => string | undefined }> = [
  { k: 'rrSys', label: 'RR', fmt: (w) => (w.rrSys !== undefined ? `${ganz(w.rrSys)}/${w.rrDia !== undefined ? ganz(w.rrDia) : '–'} mmHg` : undefined) },
  { k: 'hf', label: 'Puls', fmt: (w) => (w.hf !== undefined ? `${ganz(w.hf)}/min` : undefined) },
  { k: 'af', label: 'AF', fmt: (w) => (w.af !== undefined ? `${ganz(w.af)}/min` : undefined) },
  { k: 'spo2', label: 'SpO₂', fmt: (w) => (w.spo2 !== undefined ? `${ganz(w.spo2)} %` : undefined) },
  { k: 'temp', label: 'Temp', fmt: (w) => (w.temp !== undefined ? `${eins(w.temp)} °C` : undefined) },
  { k: 'bz', label: 'BZ', fmt: (w) => (w.bz !== undefined ? `${ganz(w.bz)} mg/dl` : undefined) },
  { k: 'schmerz', label: 'Schmerz', fmt: (w) => (w.schmerz !== undefined ? `${ganz(w.schmerz)}/10` : undefined) },
  { k: 'besd', label: 'BESD', fmt: (w) => (w.besd !== undefined ? `${ganz(w.besd)}/10` : undefined) },
  { k: 'blaseMl', label: 'Blasenfüllung', fmt: (w) => (w.blaseMl !== undefined ? `${ganz(w.blaseMl)} ml` : undefined) },
];

/** Zuletzt gemessene Werte je Schlüssel (mit Zeit), aus Befund- und Doku-Meldungen. */
export function letzteWerte(meldungen: DokuKontext['meldungen']): Partial<Record<keyof Anzeige | 'schmerz', { wert: number; t: number; werte: Messwerte }>> {
  const r: ReturnType<typeof letzteWerte> = {};
  for (const m of meldungen) {
    if (!m.werte) continue;
    for (const [k, w] of Object.entries(m.werte) as Array<[keyof Messwerte, number]>) r[k] = { wert: w, t: m.t, werte: m.werte };
  }
  return r;
}

const MELDE_ART = new Set(['befund']);
const IST_SBAR_EINSCHAETZUNG = (b: SbarBaustein) => b.teil === 'A';

/** Bausteine, die jetzt in den Pflegebericht passen (nur Bekanntes, in fester Reihenfolge). */
export function dokuBausteine(k: DokuKontext, uhr: (t: number) => string): DokuBaustein[] {
  const r: DokuBaustein[] = [];
  const werte = letzteWerte(k.meldungen);
  for (const d of WERT_TEXT) {
    const w = werte[d.k];
    if (!w) continue;
    const text = d.fmt(w.werte);
    if (text) r.push({ id: `wert:${d.k}`, gruppe: 'werte', text: `${d.label} ${text} (${uhr(w.t)})`, t: w.t });
  }
  const befundGesehen = new Set<string>();
  for (const m of [...k.meldungen].reverse()) {
    if (!MELDE_ART.has(m.art) || !m.quelle || m.werte || befundGesehen.has(m.quelle)) continue;
    befundGesehen.add(m.quelle);
    const name = k.massnahme(m.quelle)?.name ?? m.quelle;
    r.push({ id: `befund:${m.quelle}`, gruppe: 'beobachtung', text: `${name}: ${m.text}`, t: m.t });
  }
  r.sort((a, b) => (a.gruppe === b.gruppe && a.gruppe === 'beobachtung' ? (a.t ?? 0) - (b.t ?? 0) : 0));
  for (const id of k.fall.massnahmen) {
    const zeiten = k.getan[id];
    const m = k.massnahme(id);
    if (!zeiten?.length || !m || befundGesehen.has(id) || m.reiter === 'melden' || m.reiter === 'messen') continue;
    r.push({ id: `massnahme:${id}`, gruppe: 'massnahme', text: `${m.name} (${zeiten.map(uhr).join(', ')})`, t: zeiten.at(-1) });
  }
  for (const a of k.fall.anordnungen) {
    const erhalten = k.anordnungen[a.id];
    if (!erhalten || erhalten.t === 0) continue;
    r.push({ id: `anordnung:${a.id}`, gruppe: 'anordnung', text: anordnungsText(k.fall, a, erhalten, k.zurueckgezogen, uhr), t: erhalten.t });
  }
  for (const a of k.fall.anordnungen) {
    if (!k.zurueckgezogen.includes(a.id)) continue;
    r.push({ id: `anordnung:${a.id}`, gruppe: 'anordnung', text: `Anordnung „${a.text}“ hinterfragt, von ${k.fall.arzt.name} zurückgenommen.` });
  }
  for (const b of k.fall.sbar) {
    if (!IST_SBAR_EINSCHAETZUNG(b) || (b.bekanntWenn && !k.gilt(b.bekanntWenn))) continue;
    r.push({ id: b.id, gruppe: 'einschaetzung', text: b.text });
  }
  return r;
}

function anordnungsText(fall: FallV2, a: Anordnung, e: { rueckgelesen: boolean; t: number }, zurueck: readonly string[], uhr: (t: number) => string) {
  const stand = zurueck.includes(a.id) ? ', später zurückgenommen' : e.rueckgelesen ? ', rückgelesen und bestätigt' : ', nicht rückgelesen';
  return `${uhr(e.t)} mündliche Anordnung ${fall.arzt.name}: ${a.text}${stand}.`;
}

/** Text eines Bausteins (für die Doku-Meldung); unbekannte IDs liefern undefined. */
export function bausteinText(k: DokuKontext, id: string, uhr: (t: number) => string): string | undefined {
  return dokuBausteine(k, uhr).find((b) => b.id === id)?.text;
}

/** Kurvenwerte einer Messwert-Momentaufnahme (für das Kurvenblatt) */
export function kurvenwerte(w: Messwerte): Partial<Record<KurvenWert, number>> {
  const r: Partial<Record<KurvenWert, number>> = {};
  for (const k of ['rrSys', 'rrDia', 'hf', 'af', 'spo2', 'temp', 'bz', 'schmerz'] as const) if (w[k] !== undefined) r[k] = w[k];
  return r;
}
