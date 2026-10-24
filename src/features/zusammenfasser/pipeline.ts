// Ablauf für die Text-Modi (originalgetreu, Lernen, Arbeitsauftrag): Quellen als Citations-Dokumente an Claude,
// Antwort in Aussagen zerlegen, deterministische Prüfung [5], KI-Prüfer [6], Gate mit höchstens einer
// Reparaturrunde [7], Ergebnis als Summary mit Gliederung. Schritte aus docs/ZUSAMMENFASSER.md, Abschnitt 2 und 7.
import type { Befund, Claim, ClaimStatus, Document, MasteryStatus, SourceChunk, Summary, SummaryBlock, SummaryLength } from '../../core/types';
import type { CatalogModule } from '../../modules/catalog-types';
import { ampel, pruefeAlles, type AufgabeSoll, type PruefBefund } from '../qualitaet/deterministisch';
import { zerlegeAntwort, type ApiTextBlock, type ZerlegtClaim } from './zerlegen';
import { kiPruefung } from './pruefer';
import { ohneKommentare, rufe, textAus, type KiNachricht } from './ki';
import type { Aufgabe } from './typen';
import basisPrompt from './prompts/00-basis.md?raw';
import originalgetreuPrompt from './prompts/01-originalgetreu.md?raw';
import lernPrompt from './prompts/02-lernmodus.md?raw';
import auftragPrompt from './prompts/03-arbeitsauftrag.md?raw';
import reparaturPrompt from './prompts/30-reparatur.md?raw';

export { MODEL } from './ki';

export type TextModus = 'originalgetreu' | 'lernen' | 'arbeitsauftrag';

export interface Wissensstand { status: MasteryStatus; haeufigeFehler: string[] }

export interface ModusOptionen {
  modus?: TextModus;
  thema?: string;
  verwandteThemen?: string[];      // Lernmodus: Namen echter Themen aus dem Katalog
  wissensstand?: Wissensstand;     // Lernmodus
  aufgaben?: Aufgabe[];            // Arbeitsauftrag, nach Bestätigung
  blattText?: string;              // Arbeitsauftrag: eingefügter Text des Arbeitsblatts (Fallangaben), falls nicht als Dokument importiert
}

const AFB = ['', 'I', 'II', 'III'];

export function operatorenKatalog(modul: CatalogModule): string {
  return (modul.operators ?? []).map((o) => `- ${o.name} (AFB ${AFB[o.afb]}): ${o.expects}`).join('\n') || '(keiner hinterlegt)';
}

export function aufgabenformateText(modul: CatalogModule, aufgaben: Aufgabe[]): string {
  const ids = new Set(aufgaben.map((a) => a.aufgabenformatId).filter(Boolean));
  const formate = modul.taskFormats.filter((f) => ids.has(f.id));
  return formate.map((f) => `- ${f.id}: ${f.name}. Bestandteile: ${f.requiredParts.join(', ')}. ${f.description}`).join('\n') || '(keine verlangt)';
}

function modusAnweisung(modul: CatalogModule, length: SummaryLength, o: ModusOptionen): string {
  switch (o.modus ?? 'originalgetreu') {
    case 'lernen':
      return ohneKommentare(lernPrompt)
        .replaceAll('{{length}}', length)
        .replace('{{verwandte_themen}}', o.verwandteThemen?.length ? o.verwandteThemen.join(', ') : '(keine angegeben)')
        .replace('{{wissensstand.status}}', o.wissensstand?.status ?? 'offen')
        .replace('{{wissensstand.haeufigeFehler}}', o.wissensstand?.haeufigeFehler.length ? o.wissensstand.haeufigeFehler.join('; ') : '(keine bekannt)');
    case 'arbeitsauftrag': {
      const aufgaben = o.aufgaben ?? [];
      const json = JSON.stringify(aufgaben.map(({ unsicher: _u, unsicherGrund: _g, ...a }) => a), null, 1);
      return ohneKommentare(auftragPrompt)
        .replace('{{aufgaben_json}}', json)
        .replace('{{operatoren_katalog}}', operatorenKatalog(modul))
        .replace('{{aufgabenformate}}', aufgabenformateText(modul, aufgaben))
        .replaceAll('{{nr}}', '<nr>');
    }
    default:
      return ohneKommentare(originalgetreuPrompt).replaceAll('{{length}}', length);
  }
}

export function systemPrompt(modul: CatalogModule, length: SummaryLength, o: ModusOptionen = {}): string {
  return ohneKommentare(basisPrompt).replaceAll('{{fachmodul.name}}', modul.name).replace('{{modus_anweisung}}', modusAnweisung(modul, length, o));
}

export function nutzerText(length: SummaryLength, o: ModusOptionen & { thema: string }): string {
  switch (o.modus ?? 'originalgetreu') {
    case 'lernen': return `Erkläre und fasse die Quellen zum Thema „${o.thema}“ für das Lernen zusammen. Länge: ${length}.`;
    case 'arbeitsauftrag': return `${o.blattText ? `<arbeitsblatt>\n${o.blattText}\n</arbeitsblatt>\n\n` : ''}Bearbeite den Arbeitsauftrag mit den Aufgaben oben anhand der Quellen.`;
    default: return `Fasse die Quellen zum Thema „${o.thema}“ zusammen. Länge: ${length}.`;
  }
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

/** Status je Aussage aus Markierung und Befunden. Unbelegtes wird nie grün (Q6c). */
export function statusFuer(c: Pick<ZerlegtClaim, 'id' | 'kind'>, befunde: PruefBefund[]): ClaimStatus {
  if (c.kind === 'fehlt') return 'fehlt';
  if (c.kind === 'widerspruch') return 'widerspruch';
  if (c.kind === 'unleserlich') return 'unleserlich';
  const eigene = befunde.filter((b) => b.claimId === c.id);
  if (eigene.some((b) => b.pruefung === 'Q1c' || b.pruefung === 'Q1d' || (b.pruefung === 'K1' && b.schwere === 'blocker'))) return 'unbelegt';
  if (eigene.some((b) => b.schwere === 'blocker' || b.schwere === 'warnung')) return 'abweichend';
  return 'belegt';
}

/** Gliederung aus der Lage der Aussagen: eine Zeile = ein Block. */
export function baueGliederung(claims: ZerlegtClaim[]): { blocks: SummaryBlock[]; blockVon: Map<string, string> } {
  const blocks: SummaryBlock[] = [];
  const blockVon = new Map<string, string>();
  let letzteZeile = -1;
  for (const c of claims) {
    if (c.zeile !== letzteZeile) {
      letzteZeile = c.zeile;
      const kasten = c.kasten && ['ergaenzung', 'lernhilfe', 'widerspruch', 'fehlt'].includes(c.kasten) ? c.kasten as SummaryBlock['kastenArt'] : undefined;
      const ueberschrift = c.zeilenart === 'ueberschrift' ? /^(#{1,6})\s+(.*)$/.exec(c.text) : null;
      blocks.push({
        id: `z${c.zeile}`,
        type: ueberschrift ? 'ueberschrift' : kasten ? 'kasten' : c.zeilenart === 'liste' ? 'liste' : c.zeilenart === 'tabelle' ? 'tabelle' : 'absatz',
        ...(ueberschrift ? { level: ueberschrift[1].length, title: ueberschrift[2] } : {}),
        ...(kasten ? { kastenArt: kasten } : {}),
        claimIds: [],
      });
    }
    const b = blocks[blocks.length - 1];
    b.claimIds.push(c.id);
    blockVon.set(c.id, b.id);
  }
  return { blocks, blockVon };
}

export function aufgabenSoll(modul: CatalogModule, aufgaben: Aufgabe[]): AufgabeSoll[] {
  return aufgaben.map((a) => ({
    nr: a.nr, geforderteAnzahl: a.geforderteAnzahl,
    pflichtUeberschriften: a.aufgabenformatId ? modul.taskFormats.find((f) => f.id === a.aufgabenformatId)?.requiredParts : undefined,
  }));
}

/** Befunde für den Reparatur-Prompt, mit Aussagetext, damit das Modell die Stelle findet. */
export function befundeListe(befunde: PruefBefund[], claims: ZerlegtClaim[]): string {
  const text = new Map(claims.map((c) => [c.id, c.text]));
  return befunde.filter((b) => b.schwere !== 'hinweis').map((b) => {
    const wo = b.claimId ? ` Aussage „${text.get(b.claimId) ?? b.claimId}“:` : b.aufgabeNr ? ` Aufgabe ${b.aufgabeNr}:` : '';
    return `- [${b.pruefung}, ${b.schwere}]${wo} ${b.meldung}`;
  }).join('\n');
}

export interface ZusammenfassungsErgebnis { summary: Summary; antwortText: string }

export type Schritt = 'generierung' | 'pruefung-code' | 'pruefung-ki' | 'reparatur' | 'fertig';
export const SCHRITT_TEXT: Record<Schritt, string> = {
  generierung: 'Zusammenfassung wird erstellt …', 'pruefung-code': 'Belege werden geprüft …',
  'pruefung-ki': 'KI-Prüfer liest gegen …', reparatur: 'Gefundene Fehler werden korrigiert …', fertig: 'Fertig',
};

export async function fasseZusammen(opts: ModusOptionen & {
  apiKey: string; modul: CatalogModule; length: SummaryLength;
  docs: Document[]; chunks: SourceChunk[]; topicIds?: string[];
  kiPruefer?: boolean;                 // Standard: an
  onSchritt?: (s: Schritt) => void;
}): Promise<ZusammenfassungsErgebnis> {
  const { apiKey, modul, length, docs, chunks } = opts;
  const modus = opts.modus ?? 'originalgetreu';
  if (!chunks.length) throw new Error('Die ausgewählten Dokumente enthalten keinen Text.');
  if (modus === 'arbeitsauftrag' && !opts.aufgaben?.length) throw new Error('Bitte zuerst die Aufgaben erfassen und bestätigen.');
  const melde = opts.onSchritt ?? (() => {});
  const { bloecke, blockZuChunk } = quellenBloecke(docs, chunks);
  const thema = opts.thema || docs.map((d) => d.title).join(', ');
  const system = systemPrompt(modul, length, opts);
  const chunkMap = new Map(chunks.map((c) => [c.id, c]));
  const soll = modus === 'arbeitsauftrag' ? aufgabenSoll(modul, opts.aufgaben!) : undefined;
  const ersteNachricht: KiNachricht = { role: 'user', content: [...bloecke, { type: 'text', text: nutzerText(length, { ...opts, thema }) }] };

  const auswerten = async (messages: KiNachricht[]) => {
    melde(messages.length > 1 ? 'reparatur' : 'generierung');
    const response = await rufe(apiKey, { system, messages, effort: 'high' });
    const textBloecke = response.content.filter((b) => b.type === 'text') as unknown as ApiTextBlock[];
    const antwortText = textAus(response);
    melde('pruefung-code');
    const claims = zerlegeAntwort(textBloecke, blockZuChunk, chunkMap);
    const befunde = pruefeAlles(claims, {
      modus, chunks: chunkMap, erlaubteDokumente: new Set(docs.map((d) => d.id)), glossar: modul.glossary, aufgaben: soll, antwortText,
    });
    if (opts.kiPruefer !== false) {
      melde('pruefung-ki');
      const ki = await kiPruefung({ apiKey, modul, modus, docs, chunks, claims, antwortText, aufgaben: opts.aufgaben });
      befunde.push(...ki.befunde);
    }
    return { claims, befunde, antwortText };
  };

  let lauf = await auswerten([ersteNachricht]);
  let reparaturVersucht = false;
  if (lauf.befunde.some((b) => b.schwere === 'blocker')) {
    // Gate [7]: genau eine Reparaturrunde, gleiche Dokumente aus dem Cache, danach erneut prüfen.
    reparaturVersucht = true;
    const anweisung = ohneKommentare(reparaturPrompt).replace('{{befunde_liste}}', befundeListe(lauf.befunde, lauf.claims));
    const vorher = lauf;
    try {
      lauf = await auswerten([ersteNachricht, { role: 'assistant', content: vorher.antwortText }, { role: 'user', content: anweisung }]);
    } catch {
      lauf = vorher;   // Reparatur gescheitert: erste Fassung mit ihren Befunden anzeigen
    }
  }
  melde('fertig');

  const { blocks, blockVon } = baueGliederung(lauf.claims);
  const claims: Claim[] = lauf.claims.map((c) => ({
    id: c.id, text: c.text, citations: c.citations, kind: c.kind, blockId: blockVon.get(c.id),
    status: statusFuer(c, lauf.befunde), isSupplementary: c.kind === 'ergaenzung' || c.kind === 'lernhilfe',
  }));
  const befunde: Befund[] = lauf.befunde.map((b, i) => ({ id: `b${i + 1}`, ...b }));
  const summary: Summary = {
    id: crypto.randomUUID(), mode: modus, length, topicIds: opts.topicIds ?? [], sourceDocumentIds: docs.map((d) => d.id),
    claims, blocks, rootBlockIds: blocks.map((b) => b.id), createdAt: new Date().toISOString(), needsReview: false,
    qa: {
      befunde, ampel: ampel(lauf.befunde), reparaturVersucht,
      statistik: {
        claims: claims.filter((c) => c.kind !== 'struktur').length,
        belegt: claims.filter((c) => c.kind !== 'struktur' && c.status === 'belegt' && c.citations.length).length,
        unbelegt: claims.filter((c) => c.status === 'unbelegt').length,
        ergaenzung: claims.filter((c) => c.isSupplementary).length,
        fehlt: claims.filter((c) => c.status === 'fehlt').length,
      },
    },
  };
  return { summary, antwortText: lauf.antwortText };
}

