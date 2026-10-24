import type { Abgabe, KlassenFall } from './typen';

// Fall und Abgabe werden als JSON gepackt (deflate, wenn der Browser es kann) und base64url-kodiert.
// Erstes Zeichen: „z“ = komprimiert, „j“ = reines JSON. Kein Server, keine Bibliothek.

const hatKompression = () => typeof CompressionStream !== 'undefined' && typeof Response !== 'undefined';

async function durch(bytes: Uint8Array, strom: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(strom));
  return new Uint8Array(await out.arrayBuffer());
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
  const c = code.replace(/\s+/g, '');
  const art = c[0];
  let bytes: Uint8Array;
  try { bytes = ausBase64url(c.slice(1)); } catch { throw new Error('Der Code ist beschädigt oder unvollständig.'); }
  if (art === 'z') {
    if (typeof DecompressionStream === 'undefined') throw new Error('Dieser Browser ist zu alt. Bitte Safari ab iOS 16.4 oder einen aktuellen Browser verwenden.');
    try { bytes = await durch(bytes, new DecompressionStream('deflate-raw')); } catch { throw new Error('Der Code ist beschädigt oder unvollständig.'); }
  } else if (art !== 'j') throw new Error('Unbekanntes Format.');
  try { return JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new Error('Der Code ist beschädigt oder unvollständig.'); }
}

// ---------- Fall ----------

const istText = (x: unknown): x is string => typeof x === 'string';

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
    loesung: f.loesung === 'nach-abgabe' ? 'nach-abgabe' : 'nie',
    art: f.art === 'sis' || f.art === 'pflegeplanung' ? f.art : 'fallbeispiel',
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
    teile.push(`${i + 1}. ${auf.frage}`, (a.antworten[auf.id] ?? '').trim() || '(keine Antwort)', '');
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
  for (const m of text.matchAll(re)) {
    // „>“ = Zitatzeichen aus Mail-Antworten
    try { abgaben.push(pruefeAbgabe(await entpacke(m[1]!.replace(/[\s>]+/g, '')))); } catch (e) { fehler.push((e as Error).message); }
  }
  return { abgaben, fehler };
}
