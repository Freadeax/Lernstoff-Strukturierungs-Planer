import { ART_LABEL, type Abgabe, type Aufgabe, type KlassenFall, type Rueckmeldung } from './typen';
import { wahlText } from './wahl';
import { GRENZEN, leseBegrenzt } from '../dokumente/import/grenzen';

// Fall und Abgabe werden als JSON gepackt (deflate, wenn der Browser es kann) und base64url-kodiert.
// Erstes Zeichen: „z“ = komprimiert, „j“ = reines JSON. Kein Server, keine Bibliothek.

const hatKompression = () => typeof CompressionStream !== 'undefined' && typeof Response !== 'undefined';

async function durch(bytes: Uint8Array, strom: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(strom));
  return new Uint8Array(await out.arrayBuffer());
}

/** Entpacken mit Obergrenze: ein präparierter Code (wenige KB) könnte sonst Hunderte MB erzeugen. */
async function entpackeBegrenzt(bytes: Uint8Array): Promise<Uint8Array> {
  const strom = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw')) as ReadableStream<Uint8Array>;
  return leseBegrenzt(strom, GRENZEN.codeEntpacktBytes, 'Der Code ist entpackt zu groß und wird nicht geöffnet.');
}

export function zuBase64url(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function ausBase64url(text: string): Uint8Array {
  const b = text.replace(/-/g, '+').replace(/_/g, '/');
  const s = atob(b + '='.repeat((4 - (b.length % 4)) % 4));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}

export async function packe(wert: unknown): Promise<string> {
  const roh = new TextEncoder().encode(JSON.stringify(wert));
  if (!hatKompression()) return 'j' + zuBase64url(roh);
  return 'z' + zuBase64url(await durch(roh, new CompressionStream('deflate-raw')));
}

export async function entpacke(code: string): Promise<unknown> {
  if (code.length > GRENZEN.codeZeichen) throw new Error('Der Code ist zu lang und wird nicht geöffnet.');
  const c = code.replace(/\s+/g, '');
  const art = c[0];
  let bytes: Uint8Array;
  try { bytes = ausBase64url(c.slice(1)); } catch { throw new Error('Der Code ist beschädigt oder unvollständig.'); }
  if (art === 'z') {
    if (typeof DecompressionStream === 'undefined') throw new Error('Dieser Browser ist zu alt. Bitte Safari ab iOS 16.4 oder einen aktuellen Browser verwenden.');
    try { bytes = await entpackeBegrenzt(bytes); } catch (e) { throw new Error((e as Error)?.name === 'GrenzFehler' ? (e as Error).message : 'Der Code ist beschädigt oder unvollständig.'); }
  } else if (art !== 'j') throw new Error('Unbekanntes Format.');
  else if (bytes.length > GRENZEN.codeEntpacktBytes) throw new Error('Der Code ist entpackt zu groß und wird nicht geöffnet.');
  try { return JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new Error('Der Code ist beschädigt oder unvollständig.'); }
}

// ---------- Fall ----------

const istText = (x: unknown): x is string => typeof x === 'string';
const istZahl = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);

/** Neue, freiwillige Felder einer Aufgabe prüfen; was nicht passt, fällt weg (alte Links bleiben gültig). */
function pruefeAufgabe(a: Aufgabe): Aufgabe {
  const { typ: _t, optionen: _o, mehrfach: _m, richtig: _r, punkte: _p, ...rest } = a;
  const out: Aufgabe = rest;
  if (istZahl(a.punkte) && a.punkte > 0 && a.punkte <= 1000) out.punkte = a.punkte;
  const optionen = Array.isArray(a.optionen) ? a.optionen.filter(istText).slice(0, 26) : [];
  if (a.typ === 'wahl' && optionen.length >= 2) {
    out.typ = 'wahl';
    out.optionen = optionen;
    if (a.mehrfach === true) out.mehrfach = true;
    const richtig = Array.isArray(a.richtig) ? [...new Set(a.richtig.filter((i) => Number.isInteger(i) && i >= 0 && i < optionen.length))] : [];
    if (richtig.length) out.richtig = richtig.sort((x, y) => x - y);
  }
  return out;
}

export function pruefeFall(x: unknown): KlassenFall {
  const f = x as KlassenFall;
  if (!f || f.v !== 1 || !istText(f.id) || !istText(f.titel) || !Array.isArray(f.aufgaben) || !f.aufgaben.length
    || !f.aufgaben.every((a) => a && istText(a.id) && istText(a.frage))) {
    throw new Error('Das ist kein gültiger Klassenfall.');
  }
  return {
    ...f,
    situation: istText(f.situation) ? f.situation : '',
    material: Array.isArray(f.material) ? f.material.filter((m) => m && istText(m.titel) && istText(m.text)) : [],
    aufgaben: f.aufgaben.map(pruefeAufgabe),
    loesung: f.loesung === 'nach-abgabe' ? 'nach-abgabe' : 'nie',
    art: f.art in ART_LABEL ? f.art : 'fallbeispiel',
  };
}

/** Link auf diese App mit dem gepackten Fall. `basis` = Adresse ohne „#…“. */
export async function fallLink(fall: KlassenFall, basis: string, ziel: 'fall' | 'lehrkraft' = 'fall'): Promise<string> {
  return `${basis}#/lernen/klasse/${ziel}?d=${await packe(fall)}`;
}

export async function leseFall(code: string): Promise<KlassenFall> {
  return pruefeFall(await entpacke(code));
}

// ---------- Abgabe ----------

const START = 'LSP-ABGABE[';
const ENDE = ']';

export async function abgabeCode(a: Abgabe): Promise<string> {
  return START + (await packe(a)) + ENDE;
}

const datum = (iso: string) => new Date(iso).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' });

/** Lesbarer Text mit Abgabe-Code am Ende; so wird er geteilt oder gemailt. */
export async function abgabeText(fall: KlassenFall, a: Abgabe): Promise<string> {
  const teile = [`Abgabe: ${fall.titel}`, `Name: ${a.name}`, `Abgegeben: ${datum(a.abgegeben)}`, ''];
  fall.aufgaben.forEach((auf, i) => {
    const roh = (a.antworten[auf.id] ?? '').trim();
    const lesbar = auf.typ === 'wahl' ? wahlText(auf, roh) : roh;
    teile.push(`${i + 1}. ${auf.frage}`, lesbar || '(keine Antwort)', '');
  });
  teile.push('Code für den Lernstoff-Planer (bitte nicht ändern):', await abgabeCode(a));
  return teile.join('\n');
}

function pruefeAbgabe(x: unknown): Abgabe {
  const a = x as Abgabe;
  if (!a || a.v !== 1 || !istText(a.fallId) || !istText(a.name) || !a.antworten || typeof a.antworten !== 'object') {
    throw new Error('Das ist keine gültige Abgabe.');
  }
  const antworten: Record<string, string> = {};
  for (const [k, w] of Object.entries(a.antworten)) if (istText(w)) antworten[k] = w;
  return { v: 1, fallId: a.fallId, titel: istText(a.titel) ? a.titel : '', name: a.name.trim() || 'Ohne Namen', antworten, abgegeben: istText(a.abgegeben) ? a.abgegeben : new Date().toISOString() };
}

/**
 * Sucht alle Abgabe-Codes in einem Text (eingefügte Nachrichten, Mails, Dateien).
 * Zeilenumbrüche im Code (z. B. von Mailprogrammen) werden ignoriert.
 */
export async function leseAbgaben(text: string): Promise<{ abgaben: Abgabe[]; fehler: string[] }> {
  const abgaben: Abgabe[] = [];
  const fehler: string[] = [];
  const re = /LSP-ABGABE\s*\[([A-Za-z0-9_\-\s>]+)\]/g;
  if (text.length > GRENZEN.codeZeichen * 20) return { abgaben, fehler: ['Der eingefügte Text ist zu lang. Bitte Abgaben in kleineren Teilen einfügen.'] };
  // Auch Abgabe-Links (…#/lernen/klasse/abgabe?d=…), wenn jemand den Link statt des Texts schickt
  const links = [...text.matchAll(/klasse\/abgabe\?d=([A-Za-z0-9_-]+)/g)];
  for (const m of [...text.matchAll(re), ...links]) {
    if (abgaben.length + fehler.length >= 500) { fehler.push('Mehr als 500 Abgabe-Codes, der Rest wurde nicht gelesen.'); break; }
    // „>“ = Zitatzeichen aus Mail-Antworten
    try { abgaben.push(pruefeAbgabe(await entpacke(m[1]!.replace(/[\s>]+/g, '')))); } catch (e) { fehler.push((e as Error).message); }
  }
  return { abgaben, fehler };
}

/** Abgabe als Link: öffnet sich auf dem Gerät der Lehrkraft und wird dort direkt eingelesen. */
export async function abgabeLink(a: Abgabe, basis: string): Promise<string> {
  return `${basis}#/lernen/klasse/abgabe?d=${await packe(a)}`;
}

export async function leseAbgabeCode(code: string): Promise<Abgabe> {
  return pruefeAbgabe(await entpacke(code));
}

// ---------- Rückmeldung der Lehrkraft ----------

const R_START = 'LSP-BEWERTUNG[';

export function pruefeRueckmeldung(x: unknown): Rueckmeldung {
  const r = x as Rueckmeldung;
  if (!r || r.v !== 1 || !istText(r.fallId) || !istText(r.name) || !Array.isArray(r.aufgaben)) throw new Error('Das ist keine gültige Rückmeldung.');
  const zahl = (v: unknown) => (istZahl(v) && v >= 0 && v <= 10000 ? v : undefined);
  const text = (v: unknown, max = 4000) => (istText(v) && v.trim() ? v.slice(0, max) : undefined);
  return {
    v: 1, fallId: r.fallId, titel: istText(r.titel) ? r.titel : '', name: r.name.trim() || 'Ohne Namen', von: text(r.von, 120),
    aufgaben: r.aufgaben.filter((a) => a && istText(a.id)).slice(0, 200).map((a) => ({
      id: a.id, frage: istText(a.frage) ? a.frage.slice(0, 300) : '', punkte: zahl(a.punkte), max: zahl(a.max), kommentar: text(a.kommentar),
    })),
    punkte: zahl(r.punkte), max: zahl(r.max), note: text(r.note, 30), kommentar: text(r.kommentar),
    bewertet: istText(r.bewertet) ? r.bewertet : new Date().toISOString(),
  };
}

export async function rueckmeldungLink(r: Rueckmeldung, basis: string): Promise<string> {
  return `${basis}#/lernen/klasse/rueckmeldung?d=${await packe(r)}`;
}

export async function rueckmeldungCode(r: Rueckmeldung): Promise<string> {
  return R_START + (await packe(r)) + ENDE;
}

export async function leseRueckmeldung(code: string): Promise<Rueckmeldung> {
  return pruefeRueckmeldung(await entpacke(code));
}

/** Sucht einen Rückmelde-Code oder -Link in eingefügtem Text. */
export async function findeRueckmeldung(text: string): Promise<Rueckmeldung | null> {
  const m = /LSP-BEWERTUNG\s*\[([A-Za-z0-9_\-\s>]+)\]/.exec(text) ?? /klasse\/rueckmeldung\?d=([A-Za-z0-9_-]+)/.exec(text);
  if (!m) return null;
  return leseRueckmeldung(m[1]!.replace(/[\s>]+/g, ''));
}
