// Merkkästen über den Text erkennen, für alle Formate (PDF, PowerPoint, Text; Word erkennt Rahmen und
// Textfelder zusätzlich im Extraktor). Lehrbücher leiten Kästen fast immer mit einem Signalwort ein:
// „Merke:“, „Wichtig!“, „Praxistipp“ … Ein solcher Block wird zum eigenen Chunk (origin 'box'), damit
// Zusammenfasser und Karteikarten Merksätze gezielt finden und Zitate ihre Herkunft behalten.
// Steht das Signalwort allein als Überschrift (große Schrift im PDF), gehört es zum folgenden Absatz.
import type { RawPage } from '../types';

const SIGNAL = '(?:Merke|Merksatz|Merkkasten|Merksätze|Wichtig|Achtung|Cave|Vorsicht|Praxistipp|Pflegetipp|Pflegepraxis|Tipp|Hinweis|Info|Definition|Gut zu wissen|Fallbeispiel)';
const START = new RegExp(`^${SIGNAL}\\s*[:!]`, 'i');
const ALONE = new RegExp(`^${SIGNAL}\\s*[:!.]?$`, 'i');

/** Markiert Merkkästen in place. Blöcke mit eigener Herkunft (Tabelle, Notiz, OCR, Fußnote) bleiben unverändert. */
export function markiereMerkkaesten(pages: RawPage[]): number {
  let count = 0;
  for (const p of pages) {
    const out: RawPage['blocks'] = [];
    for (let i = 0; i < p.blocks.length; i++) {
      const b = p.blocks[i];
      const plain = !b.origin || b.origin === 'text';
      if (!plain) { out.push(b); continue; }
      const text = b.text.trim();
      const next = p.blocks[i + 1];
      if (ALONE.test(text) && next && !next.headingLevel && (!next.origin || next.origin === 'text' || next.origin === 'box')) {
        // Signalwort als eigene Zeile/Überschrift: mit dem folgenden Absatz zu einem Kasten verbinden.
        const label = text.replace(/[:!.]$/, '');
        const shift = label.length + 2;
        out.push({
          text: `${label}: ${next.text}`,
          origin: 'box',
          illegibleSpans: next.illegibleSpans?.map((s) => ({ start: s.start + shift, end: s.end + shift })),
        });
        i++;
        count++;
        continue;
      }
      if (!b.headingLevel && START.test(text)) { out.push({ ...b, origin: 'box' }); count++; continue; }
      out.push(b);
    }
    p.blocks = out;
  }
  return count;
}
