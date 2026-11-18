// Freiwilliger Radar-Stand für die Lehrkraft (Paket I, Klassen-Radar): Lernende schicken ihren Stand je
// Kompetenzbereich und ihre unsicheren Themen als Code, ohne Server. Der Lehrermodus liest viele Codes ein
// und zeigt daraus ein Klassen-Radar und die häufigsten Lücken. Rein, ohne Oberfläche und ohne Speicher.
import type { RadarAchse } from './radar';

export interface RadarStand {
  t: 'radar';
  v: 1;
  /** Freiwillig, leer = ohne Namen. */
  name: string;
  /** Tag der Erstellung (JJJJ-MM-TT). */
  datum: string;
  achsen: { code: string; name: string; wert: number }[];
  /** Unsichere Themen (höchstens MAX_LUECKEN), mit Namen, damit die Lehrkraft keinen Katalog braucht. */
  luecken: { id: string; name: string }[];
}

export const MAX_LUECKEN = 8;
const MAX_NAME = 40;
const MAX_TEXT = 120;

const text = (x: unknown, max: number) => (typeof x === 'string' ? x.trim().slice(0, max) : '');
const prozent = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) ? Math.max(0, Math.min(100, Math.round(x))) : null);

export function baueRadarStand(achsen: RadarAchse[], luecken: { id: string; name: string }[], name: string, datum: string): RadarStand {
  return {
    t: 'radar', v: 1, name: text(name, MAX_NAME), datum,
    achsen: achsen.filter((a) => a.themen).map((a) => ({ code: a.code, name: a.name, wert: a.jetzt })),
    luecken: luecken.slice(0, MAX_LUECKEN).map((l) => ({ id: text(l.id, MAX_TEXT), name: text(l.name, MAX_TEXT) })),
  };
}

/** Prüft einen entpackten Code. Was nicht passt, fällt weg; ohne gültige Achsen gibt es null. */
export function pruefeRadarStand(x: unknown): RadarStand | null {
  if (!x || typeof x !== 'object') return null;
  const o = x as Record<string, unknown>;
  if (o.t !== 'radar' || o.v !== 1 || !Array.isArray(o.achsen)) return null;
  const achsen = o.achsen.slice(0, 12).flatMap((a) => {
    const r = (a ?? {}) as Record<string, unknown>;
    const wert = prozent(r.wert);
    const code = text(r.code, 8);
    return code && wert !== null ? [{ code, name: text(r.name, MAX_TEXT), wert }] : [];
  });
  if (!achsen.length) return null;
  const luecken = (Array.isArray(o.luecken) ? o.luecken : []).slice(0, MAX_LUECKEN).flatMap((l) => {
    const r = (l ?? {}) as Record<string, unknown>;
    const id = text(r.id, MAX_TEXT);
    return id ? [{ id, name: text(r.name, MAX_TEXT) || id }] : [];
  });
  const datum = /^\d{4}-\d{2}-\d{2}$/.test(String(o.datum)) ? String(o.datum) : '';
  return { t: 'radar', v: 1, name: text(o.name, MAX_NAME), datum, achsen, luecken };
}

export interface KlassenAchse { code: string; name: string; mittel: number; min: number; max: number; n: number }
export interface KlassenRadar { n: number; achsen: KlassenAchse[]; luecken: { id: string; name: string; anzahl: number }[] }

/** Mittel, Spannweite je Bereich und die häufigsten unsicheren Themen über alle eingelesenen Stände. */
export function klassenRadar(staende: RadarStand[]): KlassenRadar {
  const codes = [...new Set(staende.flatMap((s) => s.achsen.map((a) => a.code)))].sort((a, b) => a.localeCompare(b, 'de', { numeric: true }));
  const achsen = codes.map((code) => {
    const werte = staende.flatMap((s) => s.achsen.filter((a) => a.code === code).map((a) => a.wert));
    const name = staende.flatMap((s) => s.achsen).find((a) => a.code === code && a.name)?.name ?? code;
    return { code, name, n: werte.length, mittel: Math.round(werte.reduce((s, w) => s + w, 0) / werte.length), min: Math.min(...werte), max: Math.max(...werte) };
  });
  const zaehler = new Map<string, { id: string; name: string; anzahl: number }>();
  for (const s of staende) {
    for (const l of new Map(s.luecken.map((x) => [x.id, x])).values()) {
      const z = zaehler.get(l.id) ?? { id: l.id, name: l.name, anzahl: 0 };
      z.anzahl += 1;
      zaehler.set(l.id, z);
    }
  }
  const luecken = [...zaehler.values()].sort((a, b) => b.anzahl - a.anzahl || a.name.localeCompare(b.name, 'de')).slice(0, 10);
  return { n: staende.length, achsen, luecken };
}

/** Schlüssel zum Ersetzen älterer Stände derselben Person; ohne Namen zählt jeder verschiedene Code für sich. */
export const standSchluessel = (s: RadarStand) => (s.name ? `name:${s.name.toLocaleLowerCase('de')}` : `anonym:${JSON.stringify([s.datum, s.achsen, s.luecken])}`);

/** Neue Stände einfügen: gleicher Name ersetzt den älteren Stand, gleicher Code ohne Namen wird nicht doppelt gezählt. */
export function fuegeEin(alt: RadarStand[], neu: RadarStand[]): { liste: RadarStand[]; neu: number; ersetzt: number } {
  const map = new Map(alt.map((s) => [standSchluessel(s), s]));
  let n = 0, ersetzt = 0;
  for (const s of neu) {
    const k = standSchluessel(s);
    const vorher = map.get(k);
    if (!vorher) { n++; map.set(k, s); } else if (s.datum >= vorher.datum && JSON.stringify(s) !== JSON.stringify(vorher)) { ersetzt++; map.set(k, s); }
  }
  return { liste: [...map.values()], neu: n, ersetzt };
}

/** Codes aus eingefügtem Text: jedes Wort, das wie ein Code aussieht (z… oder j… mit base64url). */
export function codesImText(t: string): string[] {
  return [...new Set(t.split(/[\s,;]+/).filter((w) => /^[zj][A-Za-z0-9_-]{20,}$/.test(w)))];
}
