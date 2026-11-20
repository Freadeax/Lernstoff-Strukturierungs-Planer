// Handschrift und schwierige Scans über die Bilderkennung von Claude.
// Datenschutz: Das Bild verlässt das Gerät. Nur mit ausdrücklicher Zustimmung pro Dokument aufrufen
// (Praxisnotizen können Patientendaten enthalten). Schlüsselverwaltung entscheidet der Architektur-Thread.
import { frageClaude, textAus } from '../../../../core/ki/claude';
import type { Block } from '../types';
import { ILLEGIBLE, type OcrEngine, type OcrPage } from './engine';

const PROMPT = `Transkribiere den Text auf diesem Bild wortgetreu (deutsch, Pflegeausbildung).
Regeln:
- Nichts ergänzen, nichts korrigieren, keine Abkürzungen auflösen, Rechtschreibfehler beibehalten.
- Absätze durch eine Leerzeile trennen, Zeilenumbrüche innerhalb eines Absatzes beibehalten.
- Überschriften mit "# " (Ebene 1) bzw. "## " (Ebene 2) beginnen.
- Unsicher gelesene Wörter so markieren: ⟦wort?⟧
- Völlig unleserliche Stellen so markieren: ⟦?⟧
- Durchgestrichenes weglassen.
Gib ausschließlich die Transkription aus.`;

export function createClaudeVisionEngine(opts: { apiKey?: string; model?: string } = {}): OcrEngine {
  return {
    name: 'claude',
    async recognize(image: Uint8Array, mediaType: string): Promise<OcrPage> {
      const response = await frageClaude({
        apiKey: opts.apiKey ?? '', modul: 'ocr', model: opts.model, maxTokens: 16000, effort: 'low',
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: toBase64(image) } },
            { type: 'text', text: PROMPT },
          ],
        }],
        abgelehnt: 'Transkription abgelehnt',
      });
      const text = textAus(response, '\n');
      return parseTranscript(text);
    },
  };
}

/** Wandelt die markierte Transkription in Blöcke mit illegibleSpans um. Exportiert für Tests. */
export function parseTranscript(raw: string): OcrPage {
  const blocks: Block[] = [];
  let words = 0;
  let unsure = 0;
  for (const para of raw.split(/\n\s*\n/)) {
    let src = para.trim();
    if (!src) continue;
    let headingLevel: number | undefined;
    const h = /^(#{1,3})\s+/.exec(src);
    if (h) { headingLevel = h[1].length; src = src.slice(h[0].length); }
    let text = '';
    const illegibleSpans: Block['illegibleSpans'] = [];
    const re = /⟦([^⟧]*)⟧/g;
    let last = 0;
    for (let m; (m = re.exec(src)); ) {
      text += src.slice(last, m.index);
      const inner = m[1] === '?' ? ILLEGIBLE : m[1].replace(/\?$/, '');
      const start = text.length;
      text += inner;
      illegibleSpans.push({ start, end: text.length });
      unsure++;
      last = re.lastIndex;
    }
    text += src.slice(last);
    words += text.split(/\s+/).filter(Boolean).length;
    blocks.push({ text, headingLevel, origin: 'ocr', illegibleSpans: illegibleSpans.length ? illegibleSpans : undefined });
  }
  // Claude liefert keine Wortsicherheiten; Schätzung über den Anteil markierter Wörter.
  const confidence = words ? Math.max(0, 1 - unsure / words) : 0;
  return { blocks, confidence, engine: 'claude' };
}

function toBase64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
