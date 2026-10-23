// Ablauf für den originalgetreuen Modus: Quellen als Citations-Dokumente an Claude, Antwort in Aussagen zerlegen,
// deterministische Prüfung, Ergebnis als Summary. Schritte [1] bis [5] aus docs/ZUSAMMENFASSER.md.
// Noch nicht enthalten: KI-Prüfer [6] und die eine Reparaturrunde [7].
import Anthropic from '@anthropic-ai/sdk';
import type { Befund, Claim, ClaimStatus, Document, SourceChunk, Summary, SummaryLength } from '../../core/types';
import type { CatalogModule } from '../../modules/catalog-types';
import { ampel, pruefeAlles, type PruefBefund, type PruefClaim } from '../qualitaet/deterministisch';
import { zerlegeAntwort, type ApiTextBlock } from './zerlegen';
import basisPrompt from './prompts/00-basis.md?raw';
import originalgetreuPrompt from './prompts/01-originalgetreu.md?raw';

export const MODEL = 'claude-opus-5-5';

const ohneKommentare = (s: string) => s.replace(/<!--[\s\S]*?-->/g, '').trim();

export function systemPrompt(modul: CatalogModule, length: SummaryLength): string {
  const modus = ohneKommentare(originalgetreuPrompt).replaceAll('{{length}}', length);
  return ohneKommentare(basisPrompt).replaceAll('{{fachmodul.name}}', modul.name).replace('{{modus_anweisung}}', modus);
}

const kopfzeile = (c: SourceChunk) => `[S. ${c.printedPage ?? c.page}${c.chapter ? ` | ${c.chapter}` : ''}]`;

/** Ein document-Block pro Dokument, ein Text-Block pro Chunk. blockZuChunk übersetzt die Citations zurück. */
export function quellenBloecke(docs: Document[], chunks: SourceChunk[]) {
  const blockZuChunk: string[][] = [];
  const bloecke = docs.map((d, i) => {
    const eigene = chunks.filter((c) => c.documentId === d.id).sort((a, b) => a.page - b.page);
    blockZuChunk[i] = eigene.map((c) => c.id);
    const seiten = eigene.map((c) => c.printedPage ?? String(c.page));
    return {
      type: 'document' as const,
      source: { type: 'content' as const, content: eigene.map((c) => ({ type: 'text' as const, text: `${kopfzeile(c)}\n${c.text}` })) },
      title: d.title,
      context: seiten.length ? `Seiten ${seiten[0]} bis ${seiten.at(-1)}.` : undefined,
      citations: { enabled: true },
      ...(i === docs.length - 1 ? { cache_control: { type: 'ephemeral' as const } } : {}),
    };
  });
  return { bloecke, blockZuChunk };
}

function statusFuer(c: PruefClaim, befunde: PruefBefund[]): ClaimStatus {
  if (c.kind === 'fehlt') return 'fehlt';
  if (c.kind === 'widerspruch') return 'widerspruch';
  if (c.kind === 'unleserlich') return 'unleserlich';
  const eigene = befunde.filter((b) => b.claimId === c.id);
  if (eigene.some((b) => b.pruefung === 'Q1c' || b.pruefung === 'Q1d')) return 'unbelegt';
  if (eigene.some((b) => b.schwere === 'blocker' || b.schwere === 'warnung')) return 'abweichend';
  return 'belegt';
}

export interface ZusammenfassungsErgebnis { summary: Summary; antwortText: string; }

export async function fasseZusammen(opts: {
  apiKey: string; modul: CatalogModule; length: SummaryLength;
  docs: Document[]; chunks: SourceChunk[]; thema?: string;
}): Promise<ZusammenfassungsErgebnis> {
  const { apiKey, modul, length, docs, chunks } = opts;
  if (!chunks.length) throw new Error('Die ausgewählten Dokumente enthalten keinen Text.');
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  const { bloecke, blockZuChunk } = quellenBloecke(docs, chunks);
  const thema = opts.thema || docs.map((d) => d.title).join(', ');

  const response = await client.beta.messages.stream({
    model: MODEL,
    max_tokens: 64000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'high' },
    system: systemPrompt(modul, length),
    messages: [{
      role: 'user',
      content: [...bloecke, { type: 'text', text: `Fasse die Quellen zum Thema „${thema}“ zusammen. Länge: ${length}.` }],
    }],
  } as unknown as Anthropic.Beta.MessageCreateParamsStreaming).finalMessage();

  if (response.stop_reason === 'refusal') throw new Error('Die KI hat die Anfrage abgelehnt.');
  if (response.stop_reason === 'max_tokens') throw new Error('Die Antwort wurde abgeschnitten. Bitte weniger Material oder eine kürzere Fassung wählen.');

  const textBloecke = response.content.filter((b) => b.type === 'text') as unknown as ApiTextBlock[];
  const antwortText = textBloecke.map((b) => b.text).join('');
  const chunkMap = new Map(chunks.map((c) => [c.id, c]));
  const pruefClaims = zerlegeAntwort(textBloecke, blockZuChunk, chunkMap);
  const pruefBefunde = pruefeAlles(pruefClaims, {
    modus: 'originalgetreu', chunks: chunkMap, erlaubteDokumente: new Set(docs.map((d) => d.id)),
    glossar: modul.glossary, antwortText,
  });

  const claims: Claim[] = pruefClaims.map((c) => ({
    id: c.id, text: c.text, citations: c.citations, kind: c.kind,
    status: statusFuer(c, pruefBefunde), isSupplementary: c.kind === 'ergaenzung' || c.kind === 'lernhilfe',
  }));
  const befunde: Befund[] = pruefBefunde.map((b, i) => ({ id: `b${i + 1}`, ...b }));
  const summary: Summary = {
    id: crypto.randomUUID(), mode: 'originalgetreu', length, topicIds: [], sourceDocumentIds: docs.map((d) => d.id),
    claims, createdAt: new Date().toISOString(), needsReview: false,
    qa: {
      befunde, ampel: ampel(pruefBefunde), reparaturVersucht: false,
      statistik: {
        claims: claims.filter((c) => c.kind !== 'struktur').length,
        belegt: claims.filter((c) => c.status === 'belegt' && c.citations.length).length,
        unbelegt: claims.filter((c) => c.status === 'unbelegt').length,
        ergaenzung: claims.filter((c) => c.isSupplementary).length,
        fehlt: claims.filter((c) => c.status === 'fehlt').length,
      },
    },
  };
  return { summary, antwortText };
}
