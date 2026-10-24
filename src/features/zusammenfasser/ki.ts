// Gemeinsame KI-Aufrufe des Zusammenfassers: Client, Streaming mit finalMessage, stop_reason-Prüfung,
// strukturierte Ausgabe. Einstellungen laut docs/ZUSAMMENFASSER.md, Abschnitt 2 („KI-Aufrufe und Einstellungen“).
import Anthropic from '@anthropic-ai/sdk';
import type { Document, SourceChunk } from '../../core/types';

export const MODEL = 'claude-opus-5-5';
export type Effort = 'low' | 'medium' | 'high';

export interface KiNachricht { role: 'user' | 'assistant'; content: unknown }

export function client(apiKey: string) {
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

export interface KiAntwort { content: Array<{ type: string; text?: string; citations?: unknown[] }>; stop_reason: string | null; usage?: unknown }

/** Ein Aufruf mit Streaming. Liefert die fertige Nachricht, wirft bei Ablehnung oder Abbruch. */
export async function rufe(apiKey: string, opts: {
  system: string; messages: KiNachricht[]; effort?: Effort; schema?: object; maxTokens?: number;
}): Promise<KiAntwort> {
  const response = await client(apiKey).beta.messages.stream({
    model: MODEL,
    max_tokens: opts.maxTokens ?? 64000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: opts.effort ?? 'high', ...(opts.schema ? { format: { type: 'json_schema', schema: opts.schema } } : {}) },
    system: opts.system,
    messages: opts.messages,
  } as unknown as Anthropic.Beta.MessageCreateParamsStreaming).finalMessage() as unknown as KiAntwort;
  if (response.stop_reason === 'refusal') throw new Error('Die KI hat die Anfrage abgelehnt.');
  if (response.stop_reason === 'max_tokens') throw new Error('Die Antwort wurde abgeschnitten. Bitte weniger Material oder eine kürzere Fassung wählen.');
  return response;
}

export const textAus = (r: KiAntwort) => r.content.filter((b) => b.type === 'text').map((b) => b.text ?? '').join('');

/** Strukturierte Ausgabe einlesen. Die API garantiert das Schema, trotzdem robust gegen Text drumherum. */
export function leseJson<T>(text: string): T {
  const start = text.search(/[[{]/);
  const ende = Math.max(text.lastIndexOf('}'), text.lastIndexOf(']'));
  if (start < 0 || ende < start) throw new Error('Die Antwort der KI war nicht lesbar.');
  return JSON.parse(text.slice(start, ende + 1)) as T;
}

export async function rufeJson<T>(apiKey: string, opts: { system: string; messages: KiNachricht[]; schema: object; effort?: Effort; maxTokens?: number }): Promise<T> {
  return leseJson<T>(textAus(await rufe(apiKey, opts)));
}

/** Prompt-Datei ohne HTML-Kommentare (Versionskopf, Notizen). */
export const ohneKommentare = (s: string) => s.replace(/<!--[\s\S]*?-->/g, '').trim();

const seite = (c: SourceChunk) => c.printedPage ?? String(c.page);

/**
 * Abschnitte als Text mit sichtbarer chunkId, für Aufrufe mit strukturierter Ausgabe
 * (die Citations-Funktion lässt sich nicht mit strukturierter Ausgabe kombinieren).
 */
export function abschnitteAlsText(docs: Document[], chunks: SourceChunk[]): string {
  return docs.map((d) => {
    const eigene = chunks.filter((c) => c.documentId === d.id).sort((a, b) => a.page - b.page);
    const inhalt = eigene.map((c) => `<abschnitt id="${c.id}" seite="${seite(c)}"${c.chapter ? ` kapitel="${c.chapter.replaceAll('"', "'")}"` : ''}>\n${c.text}\n</abschnitt>`).join('\n');
    return `<dokument id="${d.id}" titel="${d.title.replaceAll('"', "'")}">\n${inhalt}\n</dokument>`;
  }).join('\n\n');
}
