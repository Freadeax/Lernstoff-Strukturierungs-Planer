// Markdown-Zusammenfassung → Skript. Reine Funktionen, damit sie ohne Browser testbar sind.
//
// Erwartetes Format (so sind die Lernzusammenfassungen aus dem Material geschrieben):
//   ---                         optionaler Kopf, z. B. themen: [thema.kl.demenz, thema.ap.nerven]
//   # CE 09 · Titel
//   Einleitung …
//   **Quellen …**  /  - **[D]** Datei.pdf (118 S.)  /  **Quelle:** **[K]** Datei.pdf
//   ## 1 · Abschnitt [D, S. 17]
// Belege stehen in eckigen Klammern: [D, S. 18], [D, S. 23–25, 38–41], [SM, S. 28; D, S. 5], [N-1].

import type { Abschnitt, Skript, SkriptBeleg, SkriptQuelle } from './typen';

/** Skript-ID aus dem Dateinamen: klein, ohne Umlaute und Endung. */
export function skriptId(datei: string): string {
  return datei.replace(/^.*[\\/]/, '').replace(/\.(md|markdown|txt)$/i, '').normalize('NFC').toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'skript';
}

/** Einfacher, stabiler Inhalts-Hash (FNV-1a, 32 bit) für „hat sich geändert?“. */
export function inhaltsHash(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16).padStart(8, '0');
}

// ---------------------------------------------------------------- Belege

const KUERZEL = /^[A-ZÄÖÜ][A-Za-z0-9ÄÖÜäöü/-]{0,11}$/;

/**
 * Inhalt einer eckigen Klammer als Belegliste lesen. Gibt null zurück, wenn es kein Beleg ist
 * (z. B. Markdown-Link-Text oder [x] in einer Aufzählung).
 */
export function leseBelegKlammer(inhalt: string, bekannte?: Set<string>): SkriptBeleg[] | null {
  const teile = inhalt.split(';').map((t) => t.trim()).filter(Boolean);
  if (!teile.length) return null;
  const out: SkriptBeleg[] = [];
  for (const t of teile) {
    const m = t.match(/^([^,\s]+)(?:,\s*(.+))?$/);
    if (!m || !KUERZEL.test(m[1]!)) return null;
    if (bekannte && bekannte.size && !bekannte.has(m[1]!)) return null;
    out.push(m[2] ? { kuerzel: m[1]!, stelle: m[2].trim() } : { kuerzel: m[1]! });
  }
  return out;
}

/** Alle Belege eines Textes (ohne Markdown-Links [Text](url)). */
export function findeBelege(text: string, bekannte?: Set<string>): SkriptBeleg[] {
  const out: SkriptBeleg[] = [];
  for (const m of text.matchAll(/\[([^\]\n]{1,80})\](?!\()/g)) {
    const b = leseBelegKlammer(m[1]!, bekannte);
    if (b) out.push(...b);
  }
  return out;
}

export const belegText = (b: SkriptBeleg) => (b.stelle ? `${b.kuerzel}, ${b.stelle}` : b.kuerzel);

/** Doppelte Belege entfernen, Reihenfolge bleibt. */
export function eindeutig(belege: SkriptBeleg[]): SkriptBeleg[] {
  const seen = new Set<string>();
  return belege.filter((b) => { const k = belegText(b); if (seen.has(k)) return false; seen.add(k); return true; });
}

// ---------------------------------------------------------------- Kopf

interface Kopf { themen: string[]; gruppe?: string; titel?: string }

function leseKopf(text: string): { kopf: Kopf; rest: string } {
  const kopf: Kopf = { themen: [] };
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { kopf, rest: text };
  for (const zeile of m[1]!.split(/\r?\n/)) {
    const z = zeile.match(/^(\w+)\s*:\s*(.*)$/);
    if (!z) continue;
    const wert = z[2]!.trim();
    if (z[1] === 'themen') kopf.themen = wert.replace(/^\[|\]$/g, '').split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    if (z[1] === 'gruppe') kopf.gruppe = wert.replace(/^["']|["']$/g, '');
    if (z[1] === 'titel') kopf.titel = wert.replace(/^["']|["']$/g, '');
  }
  return { kopf, rest: text.slice(m[0].length) };
}

/** „CE 09 · Titel“ → Gruppe + Titel. Ohne Präfix wird die Gruppe aus dem Dateinamen geraten. */
export function teileTitel(h1: string, datei: string): { gruppe: string; titel: string } {
  const m = h1.match(/^((?:CE|LEB|LE|LF|TUE)\s*[\d.]+[A-Z]?)\s*[·:|–-]\s*(.+)$/i);
  if (m) return { gruppe: normalisiereGruppe(m[1]!), titel: m[2]!.trim() };
  const d = datei.match(/^(CE|LEB|LE|LF)\s*-?\s*(\d+)/i);
  return { gruppe: d ? normalisiereGruppe(`${d[1]} ${d[2]}`) : 'Weitere', titel: h1.trim() };
}

function normalisiereGruppe(g: string): string {
  const m = g.match(/^([A-Za-z]+)\s*([\d.]+[A-Z]?)$/);
  if (!m) return g.trim();
  const art = m[1]!.toUpperCase();
  const nr = art === 'CE' && /^\d$/.test(m[2]!) ? `0${m[2]}` : m[2]!;
  return `${art} ${nr}`;
}

/** Sortierschlüssel für Gruppen: CE 01 … CE 11, dann LEB 1 …, dann Weitere. */
export function gruppenRang(g: string): string {
  const m = g.match(/^([A-Z]+)\s*(\d+)/);
  if (!m) return `9${g}`;
  const art = { CE: 1, LEB: 2, LE: 3, LF: 4, TUE: 5 }[m[1]!] ?? 8;
  return `${art}${m[2]!.padStart(3, '0')}`;
}

// ---------------------------------------------------------------- Abschnitte

/** „1 · Expertenstandard [D, S. 17]“ → Nummer, Titel ohne Beleg, Belege der Überschrift. */
export function leseUeberschrift(text: string, bekannte?: Set<string>): { nummer?: string; titel: string; belege: SkriptBeleg[] } {
  const belege = findeBelege(text, bekannte);
  let titel = text.replace(/\s*\[([^\]\n]{1,80})\](?!\()/g, (ganz, inhalt: string) => (leseBelegKlammer(inhalt, bekannte) ? '' : ganz)).trim();
  let nummer: string | undefined;
  const m = titel.match(/^(\d+(?:\.\d+)*)\s*[·.:)–-]\s*(.+)$/);
  if (m) { nummer = m[1]; titel = m[2]!.trim(); }
  return { nummer, titel, belege };
}

const woerter = (s: string) => (s.match(/[A-Za-zÄÖÜäöüß0-9]+/g) ?? []).length;
const lueckenIn = (s: string) => (s.match(/⚠/g) ?? []).length;

/** Quellenliste aus dem Einleitungsteil lesen und den Rest der Einleitung zurückgeben. */
function leseQuellen(einleitung: string): { quellen: SkriptQuelle[]; text: string } {
  const quellen: SkriptQuelle[] = [];
  const behalten: string[] = [];
  let inListe = false;
  for (const zeile of einleitung.split('\n')) {
    const q = [...zeile.matchAll(/\*\*\[([^\]]+)\]\*\*\s*([^*]*?)(?=\s*\*\*\[|$)/g)];
    if (q.length && /^\s*(?:[-*]\s+)?(?:\*\*Quellen?[^*]*\*\*\s*:?\s*)?\*\*\[/.test(zeile)) {
      for (const x of q) quellen.push({ kuerzel: x[1]!.trim(), text: x[2]!.trim().replace(/^[:–-]\s*/, '') });
      inListe = true;
      continue;
    }
    // Überschrift der Quellenliste („**Quellen** (Seite = PDF-Seite):“) zählt mit zur Liste
    if (/^\s*\*\*Quellen?\b/.test(zeile) && !q.length) { inListe = true; continue; }
    if (inListe && /^\s+\S/.test(zeile) && quellen.length) { quellen[quellen.length - 1]!.text += ` ${zeile.trim()}`; continue; }
    inListe = false;
    behalten.push(zeile);
  }
  return { quellen, text: behalten.join('\n').replace(/\n{3,}/g, '\n\n').trim() };
}

export interface ParseOptionen { herkunft: Skript['herkunft']; jetzt?: string }

/** Eine Markdown-Zusammenfassung lesen. Wirft, wenn die Datei keine Überschrift hat. */
export function parseSkript(datei: string, markdown: string, o: ParseOptionen): Skript {
  const text = markdown.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const { kopf, rest } = leseKopf(text);
  const zeilen = rest.split('\n');
  const h1Index = zeilen.findIndex((z) => /^#\s+\S/.test(z));
  if (h1Index < 0) throw new Error(`${datei}: keine Überschrift (# Titel) gefunden.`);
  const h1 = zeilen[h1Index]!.replace(/^#\s+/, '').trim();
  const { gruppe, titel } = teileTitel(kopf.titel ? `${kopf.gruppe ?? ''} · ${kopf.titel}` : h1, datei);

  // In Abschnitte an ## teilen; ## innerhalb von Codeblöcken zählt nicht
  const bloecke: { kopf?: string; zeilen: string[] }[] = [{ zeilen: [] }];
  let imCode = false;
  for (const z of zeilen.slice(h1Index + 1)) {
    if (/^(```|~~~)/.test(z)) imCode = !imCode;
    if (!imCode && /^##\s+\S/.test(z)) { bloecke.push({ kopf: z.replace(/^##\s+/, '').trim(), zeilen: [] }); continue; }
    bloecke[bloecke.length - 1]!.zeilen.push(z);
  }
  const { quellen, text: einleitung } = leseQuellen(bloecke[0]!.zeilen.join('\n'));
  const bekannte = new Set(quellen.map((q) => q.kuerzel));

  const abschnitte: Abschnitt[] = bloecke.slice(1).map((b, i) => {
    const u = leseUeberschrift(b.kopf!, bekannte);
    const md = b.zeilen.join('\n').trim();
    return {
      id: `a${i + 1}`, titel: u.titel, ...(u.nummer ? { nummer: u.nummer } : {}), markdown: md,
      belege: eindeutig([...u.belege, ...findeBelege(md, bekannte)]),
      luecken: lueckenIn(md) + lueckenIn(b.kopf!), woerter: woerter(md),
    };
  });

  const jetzt = o.jetzt ?? new Date().toISOString();
  return {
    id: skriptId(datei), datei, gruppe: kopf.gruppe ? normalisiereGruppe(kopf.gruppe) : gruppe, titel,
    einleitung, quellen, abschnitte, topicIds: kopf.themen, hash: inhaltsHash(text),
    herkunft: o.herkunft, importiert: jetzt, geaendert: jetzt,
  };
}

/** Lesezeit in Minuten (≈ 150 Wörter/Minute für Lerntext). */
export const leseMinuten = (w: number) => Math.max(1, Math.round(w / 150));
