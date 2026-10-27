// Gemeinsame KI-Aufrufe des Zusammenfassers: Client, Streaming mit finalMessage, stop_reason-Prüfung,
// strukturierte Ausgabe. Einstellungen laut docs/ZUSAMMENFASSER.md, Abschnitt 2 („KI-Aufrufe und Einstellungen“).
import Anthropic from '@anthropic-ai/sdk';
import type { Befund, Document, SourceChunk } from '../../core/types';
import type { PipelineRun } from './typen';

export const MODEL = 'claude-opus-5-5';
export type Effort = 'low' | 'medium' | 'high';

export interface KiNachricht { role: 'user' | 'assistant'; content: unknown }

export function client(apiKey: string) {
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

export interface KiAntwort {
  content: Array<{ type: string; text?: string; citations?: unknown[] }>; stop_reason: string | null; model?: string;
  usage?: { input_tokens?: number; output_tokens?: number; cache_read_input_tokens?: number; cache_creation_input_tokens?: number };
}

/** Versionsangabe aus dem Kopf einer Prompt-Datei, z. B. „0.1“. */
export const promptVersion = (raw: string) => /version\s+([\d.]+)/.exec(raw)?.[1] ?? '?';

/**
 * Sammelt alle Aufrufe eines Laufs für den PipelineRun (docs/ZUSAMMENFASSER.md, Abschnitt 2 und 6.6):
 * welche Prompt-Version, welches Modell, was kam zurück, wie viele Tokens.
 */
export class Protokoll {
  readonly startedAt = new Date().toISOString();
  readonly promptVersionen: Record<string, string> = {};
  readonly modelle: Record<string, { model: string; effort: string }> = {};
  readonly rohantworten: Array<{ schritt: string; stop_reason: string | null; text: string }> = [];
  readonly kosten = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0 };

  prompts(dateien: Record<string, string>) {
    for (const [name, raw] of Object.entries(dateien)) this.promptVersionen[name] = promptVersion(raw);
    return this;
  }

  erfasse(schritt: string, effort: string, r: KiAntwort) {
    // derselbe Schritt kann mehrfach laufen (Reparatur, Nachforderung): Nummer anhängen
    let name = schritt;
    for (let i = 2; this.modelle[name]; i++) name = `${schritt} ${i}`;
    this.modelle[name] = { model: r.model ?? MODEL, effort };
    this.rohantworten.push({ schritt: name, stop_reason: r.stop_reason, text: textAus(r) });
    this.kosten.inputTokens += (r.usage?.input_tokens ?? 0) + (r.usage?.cache_creation_input_tokens ?? 0);
    this.kosten.outputTokens += r.usage?.output_tokens ?? 0;
    this.kosten.cacheReadTokens += r.usage?.cache_read_input_tokens ?? 0;
  }

  alsRun(eingabe: PipelineRun['eingabe'], befunde: Befund[], ergebnisSummaryId?: string): PipelineRun {
    return {
      id: crypto.randomUUID(), startedAt: this.startedAt, eingabe, promptVersionen: { ...this.promptVersionen },
      modelle: { ...this.modelle }, rohantworten: [...this.rohantworten], befunde, ergebnisSummaryId, kosten: { ...this.kosten },
    };
  }
}

/** Ein Aufruf mit Streaming. Liefert die fertige Nachricht, wirft bei Ablehnung oder Abbruch. */
export async function rufe(apiKey: string, opts: {
  system: string; messages: KiNachricht[]; effort?: Effort; schema?: object; maxTokens?: number;
  protokoll?: Protokoll; schritt?: string;
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
  opts.protokoll?.erfasse(opts.schritt ?? 'aufruf', opts.effort ?? 'high', response);
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

export async function rufeJson<T>(apiKey: string, opts: { system: string; messages: KiNachricht[]; schema: object; effort?: Effort; maxTokens?: number; protokoll?: Protokoll; schritt?: string }): Promise<T> {
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
