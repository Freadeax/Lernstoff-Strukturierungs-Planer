// Testphase: Einstieg für neue Testerinnen und Tester, geführte Testaufträge und Rückmeldungen.
// Kein Server: Eine Rückmeldung wird wie eine Klassenmodus-Abgabe als Code verschickt
// (Teilen-Menü, Mail, Kopieren). Wer die Tests betreut, fügt die Codes ein und sammelt sie hier.
// Speicher nur localStorage (lernstoff.testphase.*), keine DB-Version.

import { packe, entpacke } from '../klasse/kodierung';
import { GRENZEN } from '../dokumente/import/grenzen';

export type Art = 'fehler' | 'unklar' | 'idee' | 'lob';
export const ART_LABEL: Record<Art, string> = { fehler: 'Fehler', unklar: 'Unklar', idee: 'Idee', lob: 'Lob' };
export const ART_HILFE: Record<Art, string> = {
  fehler: 'Etwas funktioniert nicht oder zeigt Falsches an.',
  unklar: 'Ich wusste nicht, was ich tun soll oder was gemeint ist.',
  idee: 'Das fehlt mir oder ginge besser.',
  lob: 'Das hat mir geholfen.',
};

export interface Geraet {
  /** iPhone, iPad, Android, Rechner */
  art: string;
  browser: string;
  breite: number;
  /** Als App vom Home-Bildschirm gestartet */
  app: boolean;
  version: string;
}

export interface Rueckmeldung {
  v: 1;
  id: string;
  art: Art;
  /** Seitenpfad, z. B. /lernen/karten */
  seite?: string;
  text: string;
  /** 1 bis 5, optional */
  sterne?: number;
  /** Kürzel oder Vorname, optional */
  name?: string;
  geraet?: Geraet;
  /** Erledigte Testaufträge (IDs), optional */
  auftraege?: string[];
  /** Technische Fehlermeldung, nur bei „Fehler melden“ von der Fehlerseite */
  technik?: string;
  /** Gemeldete Aufgabe (seit 13.11.2026, optional): landet bei der betreuenden Person in der Überarbeitungsliste. */
  frage?: GemeldeteFrage;
  erstellt: string;
}

/** Kurzform einer gemeldeten Aufgabe (siehe qm/meldungen.ts). */
export interface GemeldeteFrage { quelle: string; aufgabeId: string; fp: string; titel: string; frage: string; grund: string; antwort?: string }

// ---------- Testaufträge ----------

export interface Auftrag { id: string; titel: string; ziel: string; pfad: string; schritte: string; minuten: number }

/** Geführter Rundgang: jede Hauptfunktion einmal, vom Einfachen zum Aufwendigen. Alles ohne KI-Schlüssel. */
export const AUFTRAEGE: Auftrag[] = [
  { id: 'heute', titel: 'Startseite verstehen', pfad: '/', minuten: 2, ziel: 'Weißt du nach einem Blick, was du heute tun kannst?', schritte: 'Startseite öffnen, die vorgeschlagene Aktion lesen, einen Schnellweg ausprobieren.' },
  { id: 'suche', titel: 'Etwas suchen', pfad: '/lernen/schnellsuche', minuten: 2, ziel: 'Findest du ein Thema oder einen Fachbegriff über die Suche?', schritte: 'Oben auf die Suche tippen, z. B. „Dekubitus“ eingeben und einem Treffer folgen.' },
  { id: 'thema', titel: 'Ein Thema durcharbeiten', pfad: '/lernen/ce', minuten: 5, ziel: 'Ist klar, was es zu einem Thema alles gibt?', schritte: 'Eine Curriculare Einheit öffnen, ein Thema wählen und auf der Themenseite einer Übung folgen.' },
  { id: 'karten', titel: 'Karteikarten lernen', pfad: '/lernen/karten', minuten: 5, ziel: 'Kommst du ohne Erklärung durch eine Lernrunde?', schritte: 'Eine Runde Karteikarten starten und jede Karte bewerten.' },
  { id: 'trainer', titel: 'Einen Trainer spielen', pfad: '/lernen/ueben?gruppe=fachwissen', minuten: 8, ziel: 'Sind Fragen, Erklärungen und Ergebnis verständlich?', schritte: 'Einen Fachwissen-Trainer wählen (z. B. Normwerte) und eine Runde zu Ende spielen.' },
  { id: 'praxis', titel: 'Eine Schicht übernehmen', pfad: '/lernen/praxis', minuten: 15, ziel: 'Fühlt sich die Simulation wie eine echte Situation an?', schritte: 'Im Praxissimulator einen Fall starten und bis zur Auswertung spielen.' },
  { id: 'fallakte', titel: 'Einen Fall durchgehend bearbeiten', pfad: '/lernen/fallakte', minuten: 15, ziel: 'Hängen SIS, Planung, Bericht und Übergabe für dich sinnvoll zusammen?', schritte: 'Eine Fallakte öffnen und mindestens zwei Schritte bearbeiten.' },
  { id: 'fehler', titel: 'Fehler wiederholen', pfad: '/lernen/fehler', minuten: 3, ziel: 'Findest du deine Fehler aus dem Trainer wieder?', schritte: 'Das Fehlerheft öffnen und einen Fehler neu versuchen.' },
  { id: 'plan', titel: 'Prüfung planen', pfad: '/lernen/plan?ansicht=pruefungen&neu=1', minuten: 4, ziel: 'Hilft dir der Lernplan bei einer echten Klausur?', schritte: 'Eine Prüfung mit Datum und Themen anlegen und den Plan ansehen.' },
  { id: 'simulation', titel: 'Probeklausur schreiben', pfad: '/lernen/simulation', minuten: 15, ziel: 'Ist die Prüfungssimulation fair und verständlich?', schritte: 'Eine kurze Simulation anlegen, beantworten und abgeben.' },
  { id: 'sicherung', titel: 'Daten sichern', pfad: '/system/sicherung', minuten: 3, ziel: 'Verstehst du, wo deine Daten liegen und wie du sie sicherst?', schritte: 'Eine Sicherung mit Passwort erstellen und in Dateien ablegen.' },
];

const K_ERLEDIGT = 'lernstoff.testphase.erledigt';
const K_GESENDET = 'lernstoff.testphase.gesendet';
const K_GESAMMELT = 'lernstoff.testphase.gesammelt';
const K_NAME = 'lernstoff.testphase.name';

function lies<T>(key: string, leer: T): T {
  try { const s = localStorage.getItem(key); return s ? (JSON.parse(s) as T) : leer; } catch { return leer; }
}
function schreib(key: string, wert: unknown) {
  try { localStorage.setItem(key, JSON.stringify(wert)); } catch { /* privater Modus: nur für diese Sitzung */ }
}

export const erledigte = (): string[] => lies<string[]>(K_ERLEDIGT, []).filter((id) => AUFTRAEGE.some((a) => a.id === id));
export function setzeErledigt(id: string, an: boolean): string[] {
  const neu = new Set(erledigte());
  if (an) neu.add(id); else neu.delete(id);
  const liste = AUFTRAEGE.map((a) => a.id).filter((x) => neu.has(x));
  schreib(K_ERLEDIGT, liste);
  return liste;
}

export const gemerkterName = (): string => lies<string>(K_NAME, '');
export const merkeName = (n: string) => schreib(K_NAME, n.trim().slice(0, 40));

/** Eigene, bereits verschickte Rückmeldungen (zum Nachsehen). Höchstens 50. */
export const gesendete = (): Rueckmeldung[] => lies<Rueckmeldung[]>(K_GESENDET, []);
export function merkeGesendet(r: Rueckmeldung) {
  schreib(K_GESENDET, [r, ...gesendete().filter((x) => x.id !== r.id)].slice(0, 50));
}

// ---------- Gerät ----------

/** Grobe Geräteangaben ohne Kennung: reicht, um Fehler nachzustellen, erlaubt keinen Rückschluss auf die Person. */
export function geraetAus(ua: string, breite: number, app: boolean, version: string, beruehrung = false): Geraet {
  const art = /iPhone|iPod/.test(ua) ? 'iPhone'
    : /iPad/.test(ua) || (/Macintosh/.test(ua) && beruehrung) ? 'iPad'
      : /Android/.test(ua) ? 'Android' : 'Rechner';
  const browser = /EdgA?\//.test(ua) ? 'Edge'
    : /Firefox|FxiOS/.test(ua) ? 'Firefox'
      : /CriOS|Chrome\//.test(ua) ? 'Chrome'
        : /Safari\//.test(ua) ? 'Safari' : 'anderer Browser';
  const ios = ua.match(/OS (\d+)[_.](\d+)/);
  return { art: ios && art !== 'Rechner' ? `${art} (iOS ${ios[1]}.${ios[2]})` : art, browser, breite: Math.round(breite), app, version };
}

export function diesesGeraet(version: string): Geraet {
  const app = typeof matchMedia === 'function' && matchMedia('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return geraetAus(navigator.userAgent, window.innerWidth, app, version, navigator.maxTouchPoints > 1);
}

export const geraetText = (g: Geraet) => `${g.art}, ${g.browser}, ${g.breite} px breit${g.app ? ', als App' : ''}, Version ${g.version}`;

// ---------- Code ----------

const START = 'LSP-RUECKMELDUNG[';

export const neueId = () => Math.random().toString(36).slice(2, 10);

export async function rueckmeldungCode(r: Rueckmeldung): Promise<string> {
  return START + (await packe(r)) + ']';
}

/** Lesbarer Text mit Code am Ende: so landet die Rückmeldung in WhatsApp, Mail oder Notizen. */
export async function rueckmeldungText(r: Rueckmeldung, seitenName?: string): Promise<string> {
  const zeilen = [
    `Rückmeldung zum Lernstoff-Planer: ${ART_LABEL[r.art]}${r.sterne ? ` (${r.sterne} von 5 Sternen)` : ''}`,
    ...(r.seite ? [`Seite: ${seitenName ?? r.seite}`] : []),
    ...(r.name ? [`Von: ${r.name}`] : []),
    '', r.text.trim(), '',
  ];
  if (r.technik) zeilen.push(`Fehlermeldung: ${r.technik}`);
  if (r.frage) zeilen.push(`Gemeldete Frage: ${r.frage.titel} („${r.frage.frage.slice(0, 120)}“)`);
  if (r.geraet) zeilen.push(`Gerät: ${geraetText(r.geraet)}`);
  if (r.auftraege?.length) zeilen.push(`Testaufträge erledigt: ${r.auftraege.length} von ${AUFTRAEGE.length}`);
  zeilen.push('', 'Code für den Lernstoff-Planer (bitte nicht ändern):', await rueckmeldungCode(r));
  return zeilen.join('\n');
}

const text = (x: unknown, max: number): string | undefined => (typeof x === 'string' && x.trim() ? x.trim().slice(0, max) : undefined);

function pruefeFrage(f: unknown): GemeldeteFrage | undefined {
  const g = f as GemeldeteFrage | undefined;
  if (!g || typeof g !== 'object' || !text(g.quelle, 40) || !text(g.aufgabeId, 120) || !text(g.grund, 20)) return undefined;
  return {
    quelle: text(g.quelle, 40)!, aufgabeId: text(g.aufgabeId, 120)!, fp: text(g.fp, 16) ?? '', titel: text(g.titel, 120) ?? '',
    frage: text(g.frage, 600) ?? '', grund: text(g.grund, 20)!, antwort: text(g.antwort, 400),
  };
}

export function pruefeRueckmeldung(x: unknown): Rueckmeldung {
  const r = x as Rueckmeldung;
  if (!r || r.v !== 1 || !text(r.id, 20) || !(r.art in ART_LABEL) || typeof r.text !== 'string') throw new Error('Das ist keine gültige Rückmeldung.');
  const g = r.geraet;
  const geraet = g && typeof g === 'object' && text(g.art, 40)
    ? { art: text(g.art, 40)!, browser: text(g.browser, 30) ?? '', breite: Number(g.breite) || 0, app: g.app === true, version: text(g.version, 60) ?? '' }
    : undefined;
  const sterne = Number.isInteger(r.sterne) && r.sterne! >= 1 && r.sterne! <= 5 ? r.sterne : undefined;
  return {
    v: 1, id: text(r.id, 20)!, art: r.art, seite: text(r.seite, 200)?.startsWith('/') ? text(r.seite, 200) : undefined,
    text: r.text.trim().slice(0, 4000), sterne, name: text(r.name, 40), geraet,
    auftraege: Array.isArray(r.auftraege) ? r.auftraege.filter((a) => typeof a === 'string').slice(0, 30) : undefined,
    technik: text(r.technik, 500), frage: pruefeFrage(r.frage), erstellt: text(r.erstellt, 40) ?? new Date().toISOString(),
  };
}

/** Alle Rückmeldungs-Codes in einem eingefügten Text (mehrere, umbrochen, Mail-Zitat ok). */
export async function leseRueckmeldungen(eingabe: string): Promise<{ neu: Rueckmeldung[]; fehler: string[] }> {
  const neu: Rueckmeldung[] = [];
  const fehler: string[] = [];
  if (eingabe.length > GRENZEN.codeZeichen * 20) return { neu, fehler: ['Der eingefügte Text ist zu lang. Bitte in kleineren Teilen einfügen.'] };
  for (const m of eingabe.matchAll(/LSP-RUECKMELDUNG\s*\[([A-Za-z0-9_\-\s>]+)\]/g)) {
    if (neu.length + fehler.length >= 500) { fehler.push('Mehr als 500 Codes, der Rest wurde nicht gelesen.'); break; }
    try { neu.push(pruefeRueckmeldung(await entpacke(m[1]!.replace(/[\s>]+/g, '')))); } catch (e) { fehler.push((e as Error).message); }
  }
  return { neu, fehler };
}

// ---------- Sammlung (für die Person, die den Test betreut) ----------

export const gesammelte = (): Rueckmeldung[] => lies<Rueckmeldung[]>(K_GESAMMELT, []);

/** Nimmt neue Rückmeldungen auf; gleiche ID wird nicht doppelt gezählt. */
export function sammle(neu: Rueckmeldung[]): { neu: number; doppelt: number; liste: Rueckmeldung[] } {
  const alt = gesammelte();
  const ids = new Set(alt.map((r) => r.id));
  let n = 0; let d = 0;
  for (const r of neu) { if (ids.has(r.id)) d++; else { ids.add(r.id); alt.push(r); n++; } }
  alt.sort((a, b) => b.erstellt.localeCompare(a.erstellt));
  schreib(K_GESAMMELT, alt);
  return { neu: n, doppelt: d, liste: alt };
}

export function entferneGesammelt(id?: string): Rueckmeldung[] {
  const liste = id ? gesammelte().filter((r) => r.id !== id) : [];
  const stand = bearbeitungen();
  if (id) delete stand[id];
  schreib(K_STAND, id ? stand : {});
  schreib(K_GESAMMELT, liste);
  return liste;
}

// ---------- Bearbeitungsstand (nur bei der Testleitung) ----------

export type Stand = 'neu' | 'in-arbeit' | 'erledigt' | 'verworfen';
export const STAND_LABEL: Record<Stand, string> = { neu: 'Neu', 'in-arbeit': 'In Arbeit', erledigt: 'Erledigt', verworfen: 'Verworfen' };
export interface Bearbeitung { stand: Stand; notiz?: string }

const K_STAND = 'lernstoff.testphase.stand';
export const bearbeitungen = (): Record<string, Bearbeitung> => {
  const roh = lies<Record<string, Bearbeitung>>(K_STAND, {});
  const out: Record<string, Bearbeitung> = {};
  for (const [id, b] of Object.entries(roh ?? {})) if (b && b.stand in STAND_LABEL) out[id] = { stand: b.stand, notiz: typeof b.notiz === 'string' ? b.notiz.slice(0, 500) : undefined };
  return out;
};
export function setzeBearbeitung(id: string, b: Bearbeitung): Record<string, Bearbeitung> {
  const alle = bearbeitungen();
  if (b.stand === 'neu' && !b.notiz?.trim()) delete alle[id]; else alle[id] = { stand: b.stand, notiz: b.notiz?.trim() || undefined };
  schreib(K_STAND, alle);
  return alle;
}
export const standVon = (alle: Record<string, Bearbeitung>, id: string): Stand => alle[id]?.stand ?? 'neu';

// ---------- Sammlung als Datei (zweites Gerät, Sicherung) ----------

export interface SammelDatei { art: 'lernstoff-rueckmeldungen'; v: 1; erstellt: string; rueckmeldungen: Rueckmeldung[]; bearbeitung: Record<string, Bearbeitung> }

export function sammelDatei(jetzt = new Date()): string {
  const d: SammelDatei = { art: 'lernstoff-rueckmeldungen', v: 1, erstellt: jetzt.toISOString(), rueckmeldungen: gesammelte(), bearbeitung: bearbeitungen() };
  return JSON.stringify(d, null, 1);
}

/** Liest eine Sammel-Datei ein: Rückmeldungen ergänzen, Bearbeitungsstand nur übernehmen, wo hier noch keiner ist. */
export function leseSammelDatei(text: string): { neu: number; doppelt: number; fehler: number; liste: Rueckmeldung[] } {
  if (text.length > GRENZEN.codeEntpacktBytes) throw new Error('Die Datei ist zu groß.');
  let d: SammelDatei;
  try { d = JSON.parse(text) as SammelDatei; } catch { throw new Error('Das ist keine Rückmeldungs-Datei.'); }
  if (!d || d.art !== 'lernstoff-rueckmeldungen' || d.v !== 1 || !Array.isArray(d.rueckmeldungen)) throw new Error('Das ist keine Rückmeldungs-Datei.');
  const gut: Rueckmeldung[] = [];
  let fehler = 0;
  for (const x of d.rueckmeldungen.slice(0, 5000)) { try { gut.push(pruefeRueckmeldung(x)); } catch { fehler++; } }
  const r = sammle(gut);
  const hier = bearbeitungen();
  for (const [id, b] of Object.entries(d.bearbeitung ?? {})) {
    if (!hier[id] && b && (b as Bearbeitung).stand in STAND_LABEL) hier[id] = { stand: (b as Bearbeitung).stand, notiz: typeof (b as Bearbeitung).notiz === 'string' ? (b as Bearbeitung).notiz!.slice(0, 500) : undefined };
  }
  schreib(K_STAND, hier);
  return { ...r, fehler };
}

export interface Ueberblick { gesamt: number; jeArt: Record<Art, number>; sterneSchnitt?: number; jeSeite: Array<{ seite: string; anzahl: number; fehler: number }> }

export function ueberblick(liste: Rueckmeldung[]): Ueberblick {
  const jeArt: Record<Art, number> = { fehler: 0, unklar: 0, idee: 0, lob: 0 };
  const seiten = new Map<string, { anzahl: number; fehler: number }>();
  let summe = 0; let mitSternen = 0;
  for (const r of liste) {
    jeArt[r.art]++;
    if (r.sterne) { summe += r.sterne; mitSternen++; }
    const s = seiten.get(r.seite ?? '') ?? { anzahl: 0, fehler: 0 };
    s.anzahl++; if (r.art === 'fehler') s.fehler++;
    seiten.set(r.seite ?? '', s);
  }
  return {
    gesamt: liste.length, jeArt,
    sterneSchnitt: mitSternen ? Math.round((summe / mitSternen) * 10) / 10 : undefined,
    jeSeite: [...seiten].map(([seite, s]) => ({ seite, ...s })).sort((a, b) => b.fehler - a.fehler || b.anzahl - a.anzahl),
  };
}

const zelle = (s: string | number | undefined) => {
  const t = String(s ?? '');
  // Formel-Einschleusung in Tabellenprogrammen verhindern (=, +, -, @ am Anfang).
  const sicher = /^[=+\-@\t\r]/.test(t) ? `'${t}` : t;
  return /[";\n\r]/.test(sicher) ? `"${sicher.replace(/"/g, '""')}"` : sicher;
};

/** CSV mit Semikolon (öffnet in deutschem Excel/Numbers ohne Umweg). */
export function alsCsv(liste: Rueckmeldung[], seitenName: (p: string) => string | undefined = () => undefined, stand: Record<string, Bearbeitung> = {}): string {
  const kopf = ['Datum', 'Art', 'Sterne', 'Seite', 'Name', 'Text', 'Gerät', 'Browser', 'Breite', 'Als App', 'Version', 'Testaufträge', 'Fehlermeldung', 'Stand', 'Notiz'];
  const zeilen = liste.map((r) => [
    r.erstellt.slice(0, 16).replace('T', ' '), ART_LABEL[r.art], r.sterne, r.seite ? (seitenName(r.seite) ?? r.seite) : '', r.name, r.text,
    r.geraet?.art, r.geraet?.browser, r.geraet?.breite, r.geraet ? (r.geraet.app ? 'ja' : 'nein') : '', r.geraet?.version,
    r.auftraege?.length ?? '', r.technik, STAND_LABEL[standVon(stand, r.id)], stand[r.id]?.notiz,
  ].map(zelle).join(';'));
  return '﻿' + [kopf.join(';'), ...zeilen].join('\r\n');
}
