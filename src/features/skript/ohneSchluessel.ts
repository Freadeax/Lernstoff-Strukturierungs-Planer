// Zusammenfassen ohne API-Schlüssel: Die App baut einen fertigen Auftrag mit dem Text des Dokuments
// und Seitenmarken. Man fügt ihn selbst in die Claude-App (oder einen anderen Chat) ein und kopiert die
// Antwort zurück. Die App übernimmt sie als Skript und prüft, ob jede Seitenangabe im Dokument vorkommt.
//
// So können auch Mitschülerinnen und Mitschüler ohne eigenen Schlüssel belegte Zusammenfassungen machen.
// Der Text verlässt das Gerät nur, wenn man ihn selbst kopiert und einfügt.

import type { Document, SourceChunk } from '../../core/types';
import { DOKUMENT_GRUPPE } from './ausDokument';
import { findeBelege, skriptId } from './parser';

/** Quellenarten, deren Zusammenfassungen privat bleiben (siehe weitergabe.ts). */
const GESCHUETZT = new Set(['fachbuch', 'leitlinie', 'expertenstandard', 'fachinformation']);

/** Höchstens so viele Zeichen Material in einem Auftrag (passt in einen Chat, ca. 40 Seiten Fließtext). */
export const AUFTRAG_MAX_ZEICHEN = 120_000;

const seiteVon = (c: Pick<SourceChunk, 'page' | 'printedPage'>) => c.printedPage?.trim() || String(c.page);

export interface Auftrag { text: string; seiten: number; gekuerzt: boolean; bisSeite?: string }

/** Auftrag für die Claude-App: Regeln, Format und das Material mit Seitenmarken ⟨S. x⟩. */
export function baueAuftrag(doc: Pick<Document, 'title' | 'kind'>, chunks: SourceChunk[], max = AUFTRAG_MAX_ZEICHEN): Auftrag {
  const teile = chunks.filter((c) => c.origin !== 'notes' && c.text.trim()).map((c, i) => ({ c, i })).sort((a, b) => a.c.page - b.c.page || a.i - b.i).map((x) => x.c);
  const einheit = doc.kind === 'pptx' ? 'Folie' : 'S.';
  const regeln = [
    'Du hilfst mir beim Lernen in der Pflegeausbildung. Schreibe aus dem Material unten eine Lernzusammenfassung als Markdown.',
    '',
    'Regeln:',
    '1. Verwende nur, was im Material steht. Erfinde nichts. Wenn du etwas Wichtiges ergänzt, das nicht im Material steht, beginne den Punkt mit ⚠.',
    `2. Jeder Aufzählungspunkt endet mit einem Beleg in eckigen Klammern, z. B. [D, ${einheit} 12]. Die Seite steht im Material jeweils als ⟨${einheit} …⟩ vor dem Text.`,
    '3. Gliedere in 3 bis 10 Abschnitte mit kurzen Aufzählungspunkten. Fachbegriffe als „**Begriff**: Erklärung [D, S. x]“.',
    '4. Antworte nur mit dem Markdown, ohne Vorwort und ohne Codeblock. Aufbau genau so:',
    '',
    '# Titel der Zusammenfassung',
    '',
    `- **[D]** ${doc.title}`,
    '',
    '## 1 · Erster Abschnitt',
    '',
    `- Kernaussage [D, ${einheit} 3]`,
    `- **Begriff**: Erklärung [D, ${einheit} 4]`,
    '',
    '## 2 · Zweiter Abschnitt',
    '',
    '…',
    '',
    `Material „${doc.title}“:`,
    '',
  ].join('\n');
  let text = regeln;
  let seite = '';
  let gekuerzt = false;
  let bisSeite: string | undefined;
  const seiten = new Set<string>();
  for (const c of teile) {
    const s = seiteVon(c);
    const stueck = `${s !== seite ? `\n⟨${einheit} ${s}⟩\n` : '\n'}${c.text.trim()}\n`;
    if (text.length + stueck.length > max) { gekuerzt = true; break; }
    text += stueck;
    seite = s;
    bisSeite = s;
    seiten.add(s);
  }
  return { text, seiten: seiten.size, gekuerzt, ...(gekuerzt ? { bisSeite } : {}) };
}

export interface AntwortErgebnis { name: string; text: string; hinweise: string[] }

/**
 * Antwort aus dem Chat als Skript-Datei aufbereiten: Codeblock und Vorwort entfernen, Kopf mit Themen,
 * Gruppe und Dokument setzen, Quellenverzeichnis ergänzen und Seitenangaben gegen das Dokument prüfen.
 */
export function uebernehmeAntwort(doc: Pick<Document, 'id' | 'title' | 'kind' | 'topicIds' | 'quelle'>, chunks: SourceChunk[], antwort: string): AntwortErgebnis {
  let md = antwort.replace(/\r\n?/g, '\n').trim();
  const block = md.match(/```(?:markdown|md)?\n([\s\S]*?)\n```/);
  if (block) md = block[1]!.trim();
  md = md.replace(/^---\n[\s\S]*?\n---\n/, '');
  const h1 = md.search(/^#\s+\S/m);
  if (h1 < 0) throw new Error('In der Antwort fehlt die Überschrift „# Titel“. Bitte die ganze Antwort kopieren.');
  md = md.slice(h1);
  if (!/^##\s+\S/m.test(md)) throw new Error('Die Antwort hat keine Abschnitte („## …“). Bitte den Auftrag noch einmal senden.');
  // Quellenverzeichnis sicherstellen, sonst zählen alle Belege als „Quelle fehlt“
  if (!/\*\*\[D\]\*\*/.test(md)) md = md.replace(/^(#\s+.*\n)/, `$1\n- **[D]** ${doc.title}\n`);

  const hinweise: string[] = [];
  const vorhanden = new Set(chunks.flatMap((c) => [String(c.page), c.printedPage?.trim()].filter((x): x is string => !!x)));
  const unbekannt = new Set<string>();
  let belege = 0;
  // Nur Belege in den Abschnitten zählen, nicht das Quellenverzeichnis „**[D]** …“
  for (const b of findeBelege(md.slice(md.search(/^##\s/m)), new Set(['D']))) {
    belege++;
    for (const n of b.stelle?.match(/\d+/g) ?? []) if (!vorhanden.has(n)) unbekannt.add(n);
  }
  if (!belege) hinweise.push('Die Antwort enthält keine Belege [D, S. x]. Alle Punkte gelten deshalb als unbelegt.');
  if (unbekannt.size) hinweise.push(`Seiten, die es im Dokument nicht gibt: ${[...unbekannt].sort((a, b) => Number(a) - Number(b)).slice(0, 12).join(', ')}. Diese Belege bitte im Original nachprüfen.`);

  const kopf = ['---', ...(doc.topicIds.length ? [`themen: [${doc.topicIds.join(', ')}]`] : []), `gruppe: ${DOKUMENT_GRUPPE}`, `dokument: ${doc.id}`,
    // Zusammenfassungen aus Fachbüchern, Leitlinien und Standards bleiben privat (siehe weitergabe.ts)
    ...(doc.quelle && GESCHUETZT.has(doc.quelle.art) ? ['weitergabe: nein'] : []), '---'];
  return { name: `ki-${skriptId(doc.title)}.md`, text: `${kopf.join('\n')}\n${md}\n`, hinweise };
}
