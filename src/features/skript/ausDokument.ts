// Eigenes Dokument (PDF, Word, PowerPoint, Text) → Skript, ganz ohne KI und ohne Material-Repo.
// Damit können auch Mitschülerinnen und Mitschüler ohne API-Schlüssel und ohne GitHub ihre eigenen
// Unterlagen im Skript-Leser lesen, mit Themen verbinden und Karteikarten daraus machen.
//
// Es wird nichts umformuliert: Jeder Absatz bleibt wörtlich und bekommt seine Seite als Beleg [D, S. x].
// Kurze Absätze (Folienpunkte, Stichpunkte) werden zu Aufzählungspunkten, damit Karteikarten entstehen.
// Unleserliches (⟦?⟧ aus der Texterkennung) wird mit ⚠ markiert und bleibt so aus den Karten heraus.

import type { Document, SourceChunk } from '../../core/types';
import { skriptId } from './parser';

/** Gruppe in der Skript-Übersicht für Skripte aus eigenen Dokumenten. */
export const DOKUMENT_GRUPPE = 'Eigene Unterlagen';
/** Dateiname des Skripts zu einem Dokument. Gleicher Titel = gleiches Skript, ein neuer Import ersetzt es als neue Fassung. */
export const dokumentDatei = (doc: Pick<Document, 'title'>) => `dok-${skriptId(doc.title)}.md`;
/** Skript-ID zu einem Dokument (wie parseSkript sie aus dem Dateinamen bildet). */
export const dokumentSkriptId = (doc: Pick<Document, 'title'>) => skriptId(dokumentDatei(doc));

/** Bis zu dieser Länge wird ein Absatz zum Aufzählungspunkt (Folienpunkt, Stichpunkt). */
const PUNKT_MAX_WOERTER = 30;
const AUFZAEHLUNG = /^\s*(?:[•▪◦‣●○■□➢➤►▶✓✔–—*-]|\d{1,2}[.)])\s+/;

const woerter = (s: string) => s.split(/\s+/).filter(Boolean).length;

/** Text so entschärfen, dass er die Skript-Gliederung nicht stört: keine #-Zeilen, keine Kopf-Trenner, keine falschen Belege. */
function sauber(text: string): string {
  return text
    .replace(/⟦\?⟧/g, '⚠ (unleserlich)')
    .replace(/\[([^\]\n]{1,80})\](?!\()/g, '($1)')       // eckige Klammern könnten wie Belege aussehen
    .replace(/!\[/g, '[')
    .replace(/\s+/g, ' ')
    .trim();
}

const seitenText = (c: Pick<SourceChunk, 'page' | 'printedPage'>, kind: Document['kind']) =>
  kind === 'pptx' ? `Folie ${c.page}` : `S. ${c.printedPage?.trim() || c.page}`;

/** Ein Absatz als Markdown: kurz → Aufzählungspunkt, lang → Absatz. Beleg immer am Ende. */
function absatz(roh: string, beleg: string, origin: SourceChunk['origin']): string {
  const zeilen = roh.split('\n').map((z) => z.trim()).filter(Boolean);
  // Mehrzeiliger Block mit Aufzählungszeichen: jede Zeile ein Punkt
  if (zeilen.length > 1 && zeilen.filter((z) => AUFZAEHLUNG.test(z)).length >= Math.ceil(zeilen.length / 2)) {
    return zeilen.map((z) => `- ${sauber(z.replace(AUFZAEHLUNG, ''))} ${beleg}`).join('\n');
  }
  const text = sauber(roh.replace(AUFZAEHLUNG, ''));
  if (!text) return '';
  if (origin === 'box') return `> **Merke:** ${text} ${beleg}`;
  if (origin === 'table') return `${text} ${beleg}`;
  return woerter(text) <= PUNKT_MAX_WOERTER || AUFZAEHLUNG.test(roh) ? `- ${text} ${beleg}` : `${text} ${beleg}`;
}

interface Abschnitt { titel: string; unter: Array<{ titel?: string; teile: string[] }> }

/** Überschrift ohne Zeichen, die als Nummer, Beleg oder Markdown gelesen würden. */
const ueberschrift = (s: string) => sauber(s).replace(/^\d+(?:\.\d+)*\s*[·.:)–-]\s*/, '').replace(/[#*_`]/g, '').slice(0, 120) || 'Ohne Titel';

/**
 * Markdown-Skript aus einem importierten Dokument. Gliederung nach den erkannten Kapiteln
 * (erste Ebene = Abschnitt, tiefere Ebenen = Zwischenüberschriften). Ohne Kapitel: je Folie
 * bzw. je drei Seiten ein Abschnitt. Sprechernotizen und Fußnoten bleiben draußen.
 */
export function skriptAusDokument(doc: Document, chunks: SourceChunk[]): { name: string; text: string } {
  const teile = chunks
    .filter((c) => c.documentId === doc.id && c.origin !== 'notes' && c.origin !== 'footnote' && c.text.trim())
    .map((c, i) => ({ c, i }))
    .sort((a, b) => a.c.page - b.c.page || a.i - b.i)
    .map((x) => x.c);
  const mitKapitel = teile.some((c) => c.chapter);
  const abschnitte: Abschnitt[] = [];
  let schluessel = '';
  for (const c of teile) {
    const pfad = (c.chapter ?? '').split(' > ').map((s) => s.trim()).filter(Boolean);
    let key: string, titel: string, unter: string | undefined;
    if (mitKapitel) {
      key = pfad[0] ?? '';
      titel = pfad[0] ? ueberschrift(pfad[0]) : 'Einstieg';
      unter = pfad.length > 1 ? ueberschrift(pfad.slice(1).join(' › ')) : undefined;
    } else if (doc.kind === 'pptx') {
      key = `f${c.page}`;
      const erste = c.text.split(/\n+/)[0]?.trim() ?? '';
      titel = erste && woerter(erste) <= 10 && key !== schluessel ? ueberschrift(erste) : `Folie ${c.page}`;
    } else {
      const von = Math.floor((c.page - 1) / 3) * 3 + 1;
      key = `s${von}`;
      const bis = Math.min(von + 2, Math.max(...teile.map((t) => t.page)));
      titel = von === bis ? `Seite ${von}` : `Seiten ${von}–${bis}`;
    }
    if (key !== schluessel || !abschnitte.length) { abschnitte.push({ titel, unter: [] }); schluessel = key; }
    const a = abschnitte[abschnitte.length - 1]!;
    let u = a.unter[a.unter.length - 1];
    if (!u || u.titel !== unter) { u = { titel: unter, teile: [] }; a.unter.push(u); }
    const beleg = `[D, ${seitenText(c, doc.kind)}]`;
    let bloecke = c.text.split(/\n{2,}/);
    // Folientitel ohne Kapitel steht schon in der Überschrift
    if (!mitKapitel && doc.kind === 'pptx' && u.teile.length === 0 && a.titel !== `Folie ${c.page}` && sauber(bloecke[0] ?? '') && ueberschrift(bloecke[0]!) === a.titel) bloecke = bloecke.slice(1);
    for (const b of bloecke) {
      const md = absatz(b, beleg, c.origin);
      if (md) u.teile.push(md);
    }
  }

  const seiten = new Set(teile.map((c) => c.page)).size;
  const art = doc.kind === 'pptx' ? `${seiten} Folien` : `${seiten} S.`;
  const themen = doc.topicIds.length ? `themen: [${doc.topicIds.join(', ')}]\n` : '';
  const zeilen = [
    '---', `${themen}gruppe: ${DOKUMENT_GRUPPE}`, `dokument: ${doc.id}`, '---',
    `# ${ueberschrift(doc.title)}`, '',
    `Wörtlich aus deinem Dokument übernommen, ohne KI. Jeder Punkt nennt seine ${doc.kind === 'pptx' ? 'Folie' : 'Seite'}, ⚠ markiert unleserliche Stellen.`, '',
    `- **[D]** ${sauber(doc.title)} (${doc.kind.toUpperCase()}, ${art})`, '',
  ];
  abschnitte.forEach((a, i) => {
    const inhalt = a.unter.filter((u) => u.teile.length);
    if (!inhalt.length) return;
    zeilen.push(`## ${i + 1} · ${a.titel}`, '');
    for (const u of inhalt) {
      if (u.titel) zeilen.push(`### ${u.titel}`, '');
      zeilen.push(...u.teile.flatMap((t) => [t, ...(t.startsWith('- ') ? [] : [''])]), '');
    }
  });
  return { name: dokumentDatei(doc), text: `${zeilen.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n` };
}
