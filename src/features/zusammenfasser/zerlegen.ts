// Schritt [4]: Antwort der Citations-API (Dokumente mit source.type "content", 1 Block = 1 Chunk)
// in Aussagen zerlegen. Markierungen wie <ergaenzung> bestimmen die Art der Aussage.

import type { Beleg, Chunk, PruefClaim } from '../qualitaet/deterministisch';
import type { ClaimKind } from '../../core/types';

// ---------------------------------------------------------------------------

/** Minimal-Form eines Antwort-Textblocks mit Citations (content_block_location bei source.type "content"). */
export interface ApiTextBlock {
  type: 'text'; text: string;
  citations?: Array<{ type: 'content_block_location'; cited_text: string; document_index: number; start_block_index: number; end_block_index: number }>;
}

/** Aussage mit Lage im Antworttext, damit die Anzeige Zeilen, Listen, Tabellen und Kästen wieder aufbauen kann. */
export interface ZerlegtClaim extends PruefClaim {
  zeile: number;
  zeilenart: 'ueberschrift' | 'liste' | 'tabelle' | 'absatz';
  kasten?: string;           // innerste Markierung (ergaenzung, lernhilfe, fehlt, …)
}

export function zerlegeAntwort(bloecke: ApiTextBlock[], blockZuChunk: string[][], chunks: Map<string, Chunk>): ZerlegtClaim[] {
  // 1. Volltext zusammensetzen, Beleg-Spannen merken
  let voll = '';
  const spannen: Array<{ von: number; bis: number; belege: Beleg[] }> = [];
  for (const b of bloecke) {
    const von = voll.length;
    voll += b.text;
    if (b.citations?.length) {
      const belege: Beleg[] = [];
      for (const c of b.citations) for (let k = c.start_block_index; k < c.end_block_index; k++) {
        const chunkId = blockZuChunk[c.document_index]?.[k];
        const ch = chunkId ? chunks.get(chunkId) : undefined;
        belege.push({ chunkId: chunkId ?? `unbekannt:${c.document_index}/${k}`, documentId: ch?.documentId ?? '', page: ch?.page ?? 0,
          printedPage: ch?.printedPage, quote: c.cited_text });
      }
      spannen.push({ von, bis: voll.length, belege });
    }
  }
  // 2. In Segmente teilen: Zeilen, dann Sätze; Markierungen bestimmen die Art
  const claims: ZerlegtClaim[] = [];
  const kontext: string[] = [];
  let aufgabeNr: string | undefined;
  let pos = 0;
  let zeile = 0;
  let zeilenart: ZerlegtClaim['zeilenart'] | undefined;
  const segmentRe = /<(\/?)([a-z]+)(?:\s+nr="([^"]+)")?[^>]*>|[^<\n]+|\n/g;
  let m: RegExpExecArray | null;
  while ((m = segmentRe.exec(voll))) {
    pos = m.index;
    if (m[2]) {
      if (m[2] === 'aufgabe') aufgabeNr = m[1] ? undefined : m[3];
      else if (m[1]) kontext.pop(); else kontext.push(m[2]);
      continue;
    }
    if (m[0] === '\n') { zeile++; zeilenart = undefined; continue; }
    zeilenart ??= /^\s*#{1,6}\s/.test(m[0]) ? 'ueberschrift' : /^\s*([-*•]|\d+[.)])\s+\S/.test(m[0]) ? 'liste'
      : /^\s*\|/.test(m[0]) ? 'tabelle' : m[0].trim() ? 'absatz' : undefined;
    // Sätze innerhalb der Zeile
    for (const s of m[0].matchAll(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g)) {
      const satz = s[0].trim();
      if (!satz || /^[-*•\s|:]+$/.test(satz) || /^\d+[.)]$/.test(satz)) continue;   // Aufzählungsnummer allein ist keine Aussage
      const sVon = pos + s.index!, sBis = sVon + s[0].length;
      const belege = spannen.filter(sp => sp.von < sBis && sp.bis > sVon).flatMap(sp => sp.belege);
      const tag = kontext[kontext.length - 1];
      const istUeberschrift = /^#{1,6}\s/.test(satz) || /^\|?\s*-{3,}/.test(satz);
      const kind: ClaimKind = istUeberschrift ? 'struktur'
        : tag === 'lernhilfe' ? 'lernhilfe' : tag === 'ergaenzung' ? 'ergaenzung' : tag === 'fehlt' ? 'fehlt'
        : tag === 'rueckfrage' ? 'rueckfrage' : tag === 'widerspruch' ? 'widerspruch' : tag === 'unleserlich' ? 'unleserlich'
        : /\b(versteht man|bezeichnet man|wird definiert|definiert als|Definition)\b/i.test(satz)
          || /^\S+(\s\S+)?\s+(ist|sind)\s+(ein|eine|der|die|das)?\s*["„“]/.test(satz) ? 'definition' : 'fakt';
      claims.push({ id: `c${claims.length + 1}`, text: satz.replace(/^([-*•]|\d+[.)])\s+/, ''), kind, citations: dedupe(belege), aufgabeNr,
        zeile, zeilenart: zeilenart ?? 'absatz', kasten: tag });
    }
  }
  return claims;
}
const dedupe = (b: Beleg[]) => b.filter((x, i) => b.findIndex(y => y.chunkId === x.chunkId && y.quote === x.quote) === i);

