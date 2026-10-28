// Datensicherung: alles, was nur in diesem Browser liegt (IndexedDB und die localStorage-Einträge
// der Trainer), als eine JSON-Datei. Damit lässt sich der Lernstand sichern und auf ein anderes
// Gerät übertragen (iPhone ↔ iPad ↔ Rechner). Kein Server, die Datei gibt man selbst weiter.
import type { Table } from 'dexie';
import { db, type LernstoffDB } from './db';

export const SICHERUNG_FORMAT = 1;

/** Geräteeinträge mit Geheimnissen oder reinem Bildschirmzustand gehören nicht in die Sicherung. */
const NICHT_SICHERN = new Set([
  'lernstoff.apiKey',          // API-Schlüssel bleibt auf dem Gerät
  'lernstoff.ablage',          // enthält GitHub-Token
  'lernstoff.shell',           // Seitenleiste, Darstellung: je Gerät
  'lernstoff.lastSeen',
  'lernstoff.sicherung',       // Merker dieses Moduls
  'lernstoff.karten.offeneSitzung', // wird auf dem Gerät selbst nachgemeldet
]);
const PRAEFIXE = ['lernstoff.', 'duell.'];

export function gehoertInSicherung(key: string) {
  return PRAEFIXE.some((p) => key.startsWith(p)) && !NICHT_SICHERN.has(key);
}

export interface Sicherung {
  app: 'lernstoff-planer';
  format?: number;
  schema: number;
  exportedAt: string;
  geraet?: string;
  data: Record<string, unknown[]>;
  /** Rohtexte der localStorage-Einträge (Mindmaps, Fallsimulator, Prüfungssimulation, …). */
  local?: Record<string, string>;
}

// ---------------------------------------------------------------- Kodierung

// JSON kennt keine Bytes und kein Datum. Beides wird markiert und beim Einspielen zurückverwandelt.
type Markiert = { $typ: 'bytes'; b64: string } | { $typ: 'datum'; iso: string };

function zuBase64(b: Uint8Array) {
  let s = '';
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(s);
}
function ausBase64(s: string) {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Wandelt Datum und Bytes in JSON-taugliche Markierungen um (Blobs speichert die App nicht). */
export function kodiere(v: unknown): unknown {
  if (v instanceof Date) return { $typ: 'datum', iso: v.toISOString() } satisfies Markiert;
  if (v instanceof Uint8Array) return { $typ: 'bytes', b64: zuBase64(v) } satisfies Markiert;
  if (v instanceof ArrayBuffer) return { $typ: 'bytes', b64: zuBase64(new Uint8Array(v)) } satisfies Markiert;
  if (Array.isArray(v)) return v.map(kodiere);
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) if (x !== undefined) out[k] = kodiere(x);
    return out;
  }
  return v;
}

export function dekodiere(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(dekodiere);
  if (v && typeof v === 'object') {
    const m = v as Partial<Markiert> & Record<string, unknown>;
    if (m.$typ === 'datum' && typeof m.iso === 'string') return new Date(m.iso);
    if (m.$typ === 'bytes' && typeof m.b64 === 'string') return ausBase64(m.b64);
    return Object.fromEntries(Object.entries(m).map(([k, x]) => [k, dekodiere(x)]));
  }
  return v;
}

// ---------------------------------------------------------------- Erstellen

function geraetName() {
  if (typeof navigator === 'undefined') return undefined;
  const ua = navigator.userAgent;
  if (/iPad|Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return 'iPad';
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/Android/.test(ua)) return 'Android';
  if (/Windows/.test(ua)) return 'Windows';
  if (/Macintosh/.test(ua)) return 'Mac';
  return undefined;
}

function lokaleEintraege(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && gehoertInSicherung(k)) out[k] = localStorage.getItem(k) ?? '';
    }
  } catch { /* privater Modus */ }
  return out;
}

/** Komplette Sicherung: alle Tabellen und die Trainer-Einträge aus localStorage. */
export async function erstelleSicherung(database: LernstoffDB = db): Promise<Sicherung> {
  const data: Record<string, unknown[]> = {};
  for (const table of database.tables) data[table.name] = kodiere(await table.toArray()) as unknown[];
  return {
    app: 'lernstoff-planer', format: SICHERUNG_FORMAT, schema: database.verno,
    exportedAt: new Date().toISOString(), geraet: geraetName(), data, local: lokaleEintraege(),
  };
}

export const dateiName = (d = new Date()) => `lernstoff-sicherung-${d.toISOString().slice(0, 10)}.json`;

// ---------------------------------------------------------------- Prüfen

export interface Uebersicht {
  zeilen: Array<{ label: string; anzahl: number }>;
  exportedAt: string;
  geraet?: string;
  unbekannteTabellen: string[];
}

const LABEL: Record<string, string> = {
  documents: 'Dokumente', summaries: 'Zusammenfassungen', exams: 'Prüfungstermine', board: 'Themen auf dem Lernstand-Board',
  studyLogs: 'erfasste Lernzeiten', reviewLogs: 'Abfrageergebnisse im Lernplan', karten: 'eigene Karteikarten',
  kartenStand: 'Karteikarten mit Lernstand', kartenLogs: 'Karteikarten-Antworten', activity: 'Einträge im Verlauf',
  pipelineRuns: 'protokollierte Zusammenfasser-Läufe',
  skripte: 'Skripte (Lernzusammenfassungen)',
};
const LOKAL_LABEL: Record<string, string> = {
  'lernstoff.mindmaps': 'Mindmaps', 'lernstoff.fall.archiv': 'abgeschlossene Fälle', 'lernstoff.simulation.verlauf': 'Prüfungssimulationen',
  'lernstoff.skript.lesestand': 'Lesestand im Skript',
  'lernstoff.praxis.archiv': 'abgeschlossene Praxisfälle',
  'lernstoff.lernpfad': 'abgehakte Schritte im CE-Lernpfad',
};

/** Liest eine Sicherungsdatei. Wirft mit verständlicher Meldung, wenn sie nicht passt. */
export function lesePruefe(text: string, database: LernstoffDB = db): { sicherung: Sicherung; uebersicht: Uebersicht } {
  let roh: unknown;
  try { roh = JSON.parse(text); } catch { throw new Error('Die Datei ist keine gültige Sicherung (kein JSON).'); }
  const s = roh as Partial<Sicherung>;
  if (!s || s.app !== 'lernstoff-planer' || !s.data || typeof s.data !== 'object') throw new Error('Die Datei stammt nicht aus dem Lernstoff-Planer.');
  if (typeof s.schema !== 'number') throw new Error('In der Sicherung fehlt die Datenbank-Version.');
  if (s.schema > database.verno) throw new Error('Die Sicherung stammt aus einer neueren App-Version. Bitte die App neu laden (aktualisieren) und dann noch einmal einspielen.');
  if ((s.format ?? 0) > SICHERUNG_FORMAT) throw new Error('Das Sicherungsformat ist neuer als diese App. Bitte die App aktualisieren.');
  const bekannt = new Set(database.tables.map((t) => t.name));
  const unbekannteTabellen: string[] = [];
  for (const [name, rows] of Object.entries(s.data)) {
    if (!bekannt.has(name)) { unbekannteTabellen.push(name); continue; }
    if (!Array.isArray(rows) || rows.some((r) => !r || typeof r !== 'object')) throw new Error(`Die Tabelle „${name}“ in der Sicherung ist beschädigt.`);
  }
  if (s.local && (typeof s.local !== 'object' || Object.values(s.local).some((v) => typeof v !== 'string'))) throw new Error('Die Geräteeinträge in der Sicherung sind beschädigt.');
  const zeilen = Object.entries(LABEL).map(([t, label]) => ({ label, anzahl: (s.data![t] as unknown[] | undefined)?.length ?? 0 }));
  for (const [k, label] of Object.entries(LOKAL_LABEL)) {
    const v = s.local?.[k];
    let n = 0;
    try { const a = v ? JSON.parse(v) : []; n = Array.isArray(a) ? a.length : 0; } catch { /* zählt nicht */ }
    zeilen.push({ label, anzahl: n });
  }
  return {
    sicherung: s as Sicherung,
    uebersicht: { zeilen: zeilen.filter((z) => z.anzahl > 0), exportedAt: s.exportedAt ?? '', geraet: s.geraet, unbekannteTabellen },
  };
}

// ---------------------------------------------------------------- Einspielen

export type Modus = 'zusammenfuehren' | 'ersetzen';

const ZEIT_FELDER = ['geaendert', 'updatedAt', 'lastReview', 'aktualisiert', 'at', 'createdAt', 'importedAt', 'begonnen', 'erstellt'];

function zeit(x: unknown): string | undefined {
  if (!x || typeof x !== 'object') return undefined;
  for (const f of ZEIT_FELDER) {
    const v = (x as Record<string, unknown>)[f];
    if (typeof v === 'string') return v;
    if (v instanceof Date) return v.toISOString();
  }
  return undefined;
}

/** Bei gleichem Schlüssel gewinnt der neuere Eintrag. Ohne Zeitangabe bleibt der vorhandene. */
export function neuerer<T>(lokal: T, fremd: T): T {
  const a = zeit(lokal), b = zeit(fremd);
  return a && b && b > a ? fremd : lokal;
}

const signatur = (x: unknown) => JSON.stringify(x, (_k, v) => (v instanceof Uint8Array ? zuBase64(v) : v));
const ohneId = (r: Record<string, unknown>) => { const { id: _id, ...rest } = r; return rest; };
const istObjekt = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/**
 * Zwei Gerätestände eines localStorage-Werts zusammenführen:
 * Listen mit id werden vereinigt (neuer gewinnt), andere Listen ohne Dubletten vereinigt,
 * Bestwerte (Zahlen) als Maximum, fehlende Schlüssel ergänzt. Sonst bleibt der vorhandene Wert.
 */
export function fuehreWertZusammen(lokal: unknown, fremd: unknown): unknown {
  if (lokal === undefined || lokal === null) return fremd;
  if (Array.isArray(lokal) && Array.isArray(fremd)) {
    const mitId = [...lokal, ...fremd].every((x) => istObjekt(x) && typeof x.id === 'string');
    if (mitId) {
      const m = new Map<string, Record<string, unknown>>();
      for (const x of lokal as Record<string, unknown>[]) m.set(x.id as string, x);
      for (const x of fremd as Record<string, unknown>[]) m.set(x.id as string, m.has(x.id as string) ? neuerer(m.get(x.id as string)!, x) : x);
      return [...m.values()].sort((a, b) => (zeit(b) ?? '').localeCompare(zeit(a) ?? ''));
    }
    const gesehen = new Set(lokal.map(signatur));
    return [...lokal, ...fremd.filter((x) => !gesehen.has(signatur(x)))];
  }
  if (istObjekt(lokal) && istObjekt(fremd)) {
    // Laufende Sitzungen (Fall, Prüfungssimulation, Praxissimulator) sind ein Ganzes: Felder zweier
    // Durchläufe zu mischen (Maximum der Zahlen, vereinigte Befehle) ergäbe einen Stand, den es nie gab.
    if (typeof lokal.id === 'string' && typeof fremd.id === 'string') return lokal.id === fremd.id ? neuerer(lokal, fremd) : lokal;
    const out: Record<string, unknown> = { ...lokal };
    for (const [k, v] of Object.entries(fremd)) {
      if (!(k in out)) out[k] = v;
      else if (typeof out[k] === 'number' && typeof v === 'number') out[k] = Math.max(out[k] as number, v);
      else if (Array.isArray(out[k]) && Array.isArray(v)) out[k] = fuehreWertZusammen(out[k], v);
      else if (istObjekt(out[k]) && istObjekt(v) && zeit(out[k]) && zeit(v)) out[k] = neuerer(out[k], v);
    }
    return out;
  }
  return lokal;
}

export interface Ergebnis { neu: number; aktualisiert: number; tabellen: number }

async function fuehreTabelleZusammen(table: Table, rows: Record<string, unknown>[]): Promise<{ neu: number; aktualisiert: number }> {
  const pk = table.schema.primKey;
  let neu = 0, aktualisiert = 0;
  if (pk.auto) {
    // Protokolle mit fortlaufender Nummer: die Nummern beider Geräte überschneiden sich,
    // deshalb nach Inhalt vergleichen und nur fehlende Einträge neu anlegen.
    const vorhanden = new Set((await table.toArray()).map((r) => signatur(ohneId(r as Record<string, unknown>))));
    const fehlend = rows.map(ohneId).filter((r) => !vorhanden.has(signatur(r)));
    await table.bulkAdd(fehlend);
    return { neu: fehlend.length, aktualisiert: 0 };
  }
  const key = pk.keyPath as string;
  const lokal = (await table.bulkGet(rows.map((r) => r[key] as never))) as Array<Record<string, unknown> | undefined>;
  const schreiben: Record<string, unknown>[] = [];
  rows.forEach((r, i) => {
    const l = lokal[i];
    if (!l) { schreiben.push(r); neu++; return; }
    const w = neuerer(l, r);
    if (w === r && signatur(l) !== signatur(r)) { schreiben.push(r); aktualisiert++; }
  });
  await table.bulkPut(schreiben);
  return { neu, aktualisiert };
}

/**
 * Sicherung einspielen. „zusammenfuehren“ behält alles Vorhandene und ergänzt, was fehlt
 * (für iPhone ↔ iPad). „ersetzen“ löscht vorher alle Daten auf diesem Gerät.
 */
export async function spieleEin(s: Sicherung, modus: Modus, database: LernstoffDB = db): Promise<Ergebnis> {
  const tabellen = database.tables.filter((t) => Array.isArray(s.data[t.name]));
  let neu = 0, aktualisiert = 0;
  await database.transaction('rw', database.tables, async () => {
    if (modus === 'ersetzen') await Promise.all(database.tables.map((t) => t.clear()));
    for (const t of tabellen) {
      const rows = dekodiere(s.data[t.name]) as Record<string, unknown>[];
      if (!rows.length) continue;
      if (modus === 'ersetzen') { await t.bulkAdd(rows); neu += rows.length; continue; }
      const e = await fuehreTabelleZusammen(t, rows);
      neu += e.neu; aktualisiert += e.aktualisiert;
    }
  });
  spieleLokalEin(s.local ?? {}, modus);
  return { neu, aktualisiert, tabellen: tabellen.length };
}

function spieleLokalEin(local: Record<string, string>, modus: Modus) {
  try {
    if (modus === 'ersetzen') loescheLokaleEintraege();
    for (const [k, v] of Object.entries(local)) {
      if (!gehoertInSicherung(k)) continue;
      const alt = localStorage.getItem(k);
      if (modus === 'ersetzen' || alt === null) { localStorage.setItem(k, v); continue; }
      try { localStorage.setItem(k, JSON.stringify(fuehreWertZusammen(JSON.parse(alt), JSON.parse(v)))); }
      catch { /* kein JSON: vorhandenen Wert behalten */ }
    }
  } catch { /* privater Modus oder Speicher voll */ }
}

/** Für „Alle Daten löschen“: die Trainer-Einträge in localStorage gleich mit entfernen. */
export function loescheLokaleEintraege() {
  try {
    const weg: string[] = [];
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && gehoertInSicherung(k)) weg.push(k); }
    weg.forEach((k) => localStorage.removeItem(k));
  } catch { /* privater Modus */ }
}

// ---------------------------------------------------------------- Merker und Weitergabe

export interface SicherungsMerker { zuletzt?: string; hinweisGesehen?: boolean; erinnertAm?: string }
const MERKER = 'lernstoff.sicherung';

export function leseMerker(): SicherungsMerker {
  try { return JSON.parse(localStorage.getItem(MERKER) ?? '{}') as SicherungsMerker; } catch { return {}; }
}
export function setzeMerker(m: Partial<SicherungsMerker>) {
  try { localStorage.setItem(MERKER, JSON.stringify({ ...leseMerker(), ...m })); } catch { /* privater Modus */ }
}

/** Den Browser bitten, die Daten nicht bei Speicherknappheit zu löschen (Safari räumt sonst auf). */
export async function bitteUmDauerhaftenSpeicher(): Promise<boolean> {
  try { return (await navigator.storage?.persist?.()) ?? false; } catch { return false; }
}

/** Sicherung erstellen und weitergeben: Teilen-Menü (AirDrop, „In Dateien sichern“) oder Download. */
export async function sichereUndGibWeiter(art: 'teilen' | 'datei' = 'datei'): Promise<'geteilt' | 'gespeichert' | 'abgebrochen'> {
  const text = JSON.stringify(await erstelleSicherung());
  const name = dateiName();
  if (art === 'teilen') {
    const file = new File([text], name, { type: 'application/json' });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Lernstoff-Planer Sicherung' });
        setzeMerker({ zuletzt: new Date().toISOString() });
        return 'geteilt';
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return 'abgebrochen';
        // sonst unten als Datei
      }
    }
  }
  const blob = new Blob([text], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  setzeMerker({ zuletzt: new Date().toISOString() });
  return 'gespeichert';
}

export const kannTeilen = () => {
  try { return typeof navigator !== 'undefined' && !!navigator.canShare?.({ files: [new File(['{}'], 'x.json', { type: 'application/json' })] }); }
  catch { return false; }
};
