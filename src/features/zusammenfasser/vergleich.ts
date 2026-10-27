// Vergleichsmodus in zwei KI-Schritten (docs/ZUSAMMENFASSER.md, 5.5):
// 1. Aussagen je Quelle mit Beleg (getrennt nach Dokument), 2. Abgleich nach Unterthemen (prompts/06-vergleich.md).
// Belege prüft der Code; eine Zeile, deren Aussagen nicht alle belegt sind, wird verworfen.
import type { Document, SourceChunk } from '../../core/types';
import type { CatalogModule } from '../../modules/catalog-types';
import { abschnitteAlsText, ohneKommentare, Protokoll, rufeJson } from './ki';
import { belegGueltig } from './belege';
import type { BelegJson, PipelineRun, VergleichsArt, VergleichsErgebnis, VergleichsZeile } from './typen';
import basisPrompt from './prompts/00-basis.md?raw';
import vergleichPrompt from './prompts/06-vergleich.md?raw';

const beleg = { type: 'object', additionalProperties: false, required: ['chunkId', 'zitat'], properties: { chunkId: { type: 'string' }, zitat: { type: 'string' } } };

export const AUSSAGEN_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['quellen'],
  properties: {
    quellen: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['documentId', 'aussagen'],
        properties: {
          documentId: { type: 'string' },
          aussagen: {
            type: 'array',
            items: { type: 'object', additionalProperties: false, required: ['aussage', 'belege'], properties: { aussage: { type: 'string' }, belege: { type: 'array', items: beleg } } },
          },
        },
      },
    },
  },
} as const;

export const VERGLEICH_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['zeilen'],
  properties: {
    zeilen: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['unterthema', 'art', 'jeQuelle', 'erlaeuterung'],
        properties: {
          unterthema: { type: 'string' },
          art: { type: 'string', enum: ['uebereinstimmend', 'ergaenzend', 'abweichend', 'widerspruechlich', 'definition_unterschiedlich'] },
          jeQuelle: {
            type: 'array',
            items: {
              type: 'object', additionalProperties: false, required: ['documentId', 'aussage', 'belege'],
              properties: { documentId: { type: 'string' }, aussage: { type: ['string', 'null'] }, belege: { type: 'array', items: beleg } },
            },
          },
          erlaeuterung: { type: 'string' },
        },
      },
    },
  },
} as const;

export type AussagenJeQuelle = Array<{ documentId: string; aussagen: Array<{ aussage: string; belege: BelegJson[] }> }>;

/** Nur Aussagen behalten, deren Belege alle aus dem eigenen Dokument stammen und wörtlich darin stehen. */
export function filtereAussagen(roh: AussagenJeQuelle, docs: Document[], chunks: Map<string, SourceChunk>): AussagenJeQuelle {
  return docs.map((d) => ({
    documentId: d.id,
    aussagen: (roh.find((q) => q.documentId === d.id)?.aussagen ?? [])
      .filter((a) => a.aussage?.trim() && a.belege?.length && a.belege.every((b) => belegGueltig(b, chunks, d.id))),
  }));
}

/** Zeilen verwerfen, in denen eine Quelle eine Aussage ohne gültigen Beleg hat oder nur eine Quelle etwas sagt, obwohl ein Unterschied behauptet wird. */
export function filtereZeilen(zeilen: VergleichsZeile[], docs: Document[], chunks: Map<string, SourceChunk>): { zeilen: VergleichsZeile[]; verworfen: number } {
  const ids = new Set(docs.map((d) => d.id));
  const ok = zeilen.filter((z) => {
    const mitAussage = z.jeQuelle.filter((q) => ids.has(q.documentId) && q.aussage);
    if (!mitAussage.length) return false;
    if (!mitAussage.every((q) => q.belege.length && q.belege.every((b) => belegGueltig(b, chunks, q.documentId)))) return false;
    if (z.art !== 'ergaenzend' && mitAussage.length < 2) return false;
    return true;
  }).map((z) => ({
    ...z,
    // je Dokument genau ein Eintrag, in der Reihenfolge der Auswahl
    jeQuelle: docs.map((d) => z.jeQuelle.find((q) => q.documentId === d.id) ?? { documentId: d.id, aussage: null, belege: [] }),
  }));
  return { zeilen: ok, verworfen: zeilen.length - ok.length };
}

/** Ein Abschnitt der zusammengeführten Fassung: Übereinstimmendes einmal, jeder Unterschied je Quelle sichtbar. */
export interface ZusammenAbschnitt {
  unterthema: string;
  art: VergleichsArt;
  erlaeuterung: string;
  /** übereinstimmend oder ergänzend: eine Aussage, belegt in allen genannten Quellen */
  einheitlich?: { aussage: string; quellen: Array<{ documentId: string; belege: BelegJson[] }> };
  /** abweichend, widersprüchlich, Definition unterschiedlich: jede Quelle mit ihrer eigenen Aussage */
  jeQuelle?: Array<{ documentId: string; aussage: string; belege: BelegJson[] }>;
}

/**
 * Zusammengeführte Fassung (docs/ZUSAMMENFASSER.md, 5.5, Schritt 3) rein aus den geprüften Vergleichszeilen,
 * ohne weiteren KI-Aufruf: Nichts kommt hinzu, was nicht schon belegt in der Matrix steht.
 * Reihenfolge: Übereinstimmendes, dann Ergänzungen, dann Unterschiede.
 */
export function zusammenfuehren(zeilen: VergleichsZeile[]): ZusammenAbschnitt[] {
  const rang: Record<VergleichsArt, number> = { uebereinstimmend: 0, ergaenzend: 1, abweichend: 2, definition_unterschiedlich: 3, widerspruechlich: 4 };
  return [...zeilen].sort((a, b) => rang[a.art] - rang[b.art]).map((z) => {
    const mit = z.jeQuelle.filter((q): q is typeof q & { aussage: string } => !!q.aussage);
    const basis = { unterthema: z.unterthema, art: z.art, erlaeuterung: z.erlaeuterung };
    return z.art === 'uebereinstimmend' || z.art === 'ergaenzend'
      ? { ...basis, einheitlich: { aussage: mit[0]?.aussage ?? '', quellen: mit.map((q) => ({ documentId: q.documentId, belege: q.belege })) } }
      : { ...basis, jeQuelle: mit.map((q) => ({ documentId: q.documentId, aussage: q.aussage, belege: q.belege })) };
  });
}

const metadaten = (docs: Document[]) => docs.map((d) => `${d.title}: Version ${d.version}, importiert ${d.importedAt.slice(0, 10)}`).join('; ');

export async function vergleiche(opts: { apiKey: string; modul: CatalogModule; docs: Document[]; chunks: SourceChunk[]; thema: string; topicIds?: string[]; onSchritt?: (t: string) => void }): Promise<{ ergebnis: VergleichsErgebnis; run: PipelineRun }> {
  if (opts.docs.length < 2) throw new Error('Für einen Vergleich bitte mindestens zwei Dokumente auswählen.');
  const chunkMap = new Map(opts.chunks.map((c) => [c.id, c]));
  const protokoll = new Protokoll().prompts({ '00-basis': basisPrompt, '06-vergleich': vergleichPrompt });
  const thema = opts.thema || opts.docs.map((d) => d.title).join(' / ');
  const basis = ohneKommentare(basisPrompt).replaceAll('{{fachmodul.name}}', opts.modul.name);

  opts.onSchritt?.('Aussagen je Quelle werden gesammelt …');
  const roh = await rufeJson<{ quellen: AussagenJeQuelle }>(opts.apiKey, {
    system: basis.replace('{{modus_anweisung}}', `## Modus: Vergleich, Schritt 1 (Aussagen je Quelle)

Sammle für jedes Dokument getrennt die fachlichen Aussagen zum Thema „${thema}“, kurz und wie im originalgetreuen Modus: nur, was im Dokument steht, Fachbegriffe, Zahlen und Definitionen wörtlich. Die Abschnitte stehen als \`<abschnitt id="…">\` in \`<dokument id="…">\`. Gib zu jeder Aussage unter \`belege\` die \`chunkId\` und ein **wörtliches** Zitat aus einem Abschnitt **desselben** Dokuments an. Vermische keine Dokumente. Gib für jedes Dokument einen Eintrag mit seiner \`documentId\`, auch wenn es nichts zum Thema enthält (dann leere Liste).`),
    schema: AUSSAGEN_SCHEMA, effort: 'high', maxTokens: 32000, protokoll, schritt: 'aussagen-je-quelle',
    messages: [{ role: 'user', content: `${abschnitteAlsText(opts.docs, opts.chunks)}\n\nSammle die Aussagen je Quelle als JSON.` }],
  });
  const aussagen = filtereAussagen(roh.quellen ?? [], opts.docs, chunkMap);
  if (aussagen.filter((q) => q.aussagen.length).length < 2) throw new Error('In weniger als zwei Quellen wurden belegte Aussagen zum Thema gefunden. Ein Vergleich ist so nicht möglich.');

  opts.onSchritt?.('Quellen werden abgeglichen …');
  const titel = new Map(opts.docs.map((d) => [d.id, d.title]));
  const modus = ohneKommentare(vergleichPrompt)
    .replace('{{thema.name}}', thema)
    .replace('{{aussagen_json}}', JSON.stringify(aussagen.map((q) => ({ ...q, titel: titel.get(q.documentId) })), null, 1))
    .replace('{{dokument_metadaten}}', metadaten(opts.docs));
  const abgleich = await rufeJson<{ zeilen: VergleichsZeile[] }>(opts.apiKey, {
    system: basis.replace('{{modus_anweisung}}', modus),
    schema: VERGLEICH_SCHEMA, effort: 'high', maxTokens: 32000, protokoll, schritt: 'abgleich',
    messages: [{ role: 'user', content: 'Gleiche die Aussagen ab und gib die Vergleichszeilen als JSON aus.' }],
  });
  const { zeilen, verworfen } = filtereZeilen(abgleich.zeilen ?? [], opts.docs, chunkMap);
  const id = crypto.randomUUID();
  const run = protokoll.alsRun({ mode: 'vergleich', topicIds: opts.topicIds ?? [], documentIds: opts.docs.map((d) => d.id), chunkIds: opts.chunks.map((c) => c.id) },
    verworfen ? [{ id: 'b1', pruefung: 'Vergleich', schwere: 'warnung', meldung: `${verworfen} Vergleichszeilen ohne vollständige Belege verworfen.` }] : [], id);
  const ergebnis: VergleichsErgebnis = {
    id, mode: 'vergleich', length: 'kurz', topicIds: opts.topicIds ?? [], sourceDocumentIds: opts.docs.map((d) => d.id), pipelineRunId: run.id,
    claims: [], createdAt: new Date().toISOString(), needsReview: false, thema, zeilen, verworfen,
  };
  return { ergebnis, run };
}
