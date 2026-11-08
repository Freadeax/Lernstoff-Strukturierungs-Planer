// Erkennt in importiertem Text Stellen, die wie Anweisungen an eine KI aussehen („Ignoriere alle vorherigen
// Anweisungen …“). Solcher Text kann aus Versehen (Arbeitsblatt über KI) oder absichtlich in einem Dokument stehen.
// Er wird nicht entfernt (er ist Teil der Quelle), sondern beim Import gemeldet. Die KI-Aufrufe behandeln
// Dokumentinhalt ohnehin als fremde Daten (siehe zusammenfasser/ki.ts, FREMDE_DATEN).
import type { SourceChunk } from '../../../core/types';

const MUSTER: RegExp[] = [
  /\b(ignorier|vergiss|missacht)\w*\s+(\w+\s+){0,3}(vorherig|obig|bisherig|vorangegangen|früher)\w*\s+(anweisung|instruktion|regel|vorgab|prompt)/i,
  /\bignore\s+(all\s+|any\s+)?(the\s+)?(previous|prior|above|earlier)\s+(instructions|prompts?|rules)/i,
  /\bdisregard\s+(all\s+|any\s+)?(the\s+)?(previous|prior|above)\b/i,
  /\b(neue|geänderte)\s+(system)?anweisung(en)?\s*:/i,
  /\bnew\s+(system\s+)?instructions?\s*:/i,
  /\b(du\s+bist\s+(ab\s+)?jetzt|ab\s+sofort\s+bist\s+du|you\s+are\s+now)\s+(ein|eine|a|an|der|die|the)\b/i,
  /\b(system\s*prompt|systemprompt|developer\s+message)\b/i,
  /<\/?\s*(dokument|abschnitt|document|system|instructions?)\b[^>]*>/i,
  /\b(gib|schreibe|antworte)\s+(\w+\s+){0,3}(ausschließlich|nur)\s+(folgendes|mit\s+["„]?)/i,
  /\b(bewerte|markiere)\s+(\w+\s+){0,4}(immer|alle)\s+(als\s+)?(richtig|korrekt|belegt|100)/i,
];

/** Liefert die Fundstellen als kurze Textauszüge. */
export function findeAnweisungen(text: string): string[] {
  const out: string[] = [];
  for (const re of MUSTER) {
    const m = re.exec(text);
    if (m) out.push(text.slice(Math.max(0, m.index - 20), m.index + m[0].length + 20).replace(/\s+/g, ' ').trim());
  }
  return out;
}

/** Warnungen für den Importbericht, höchstens eine je Seite und insgesamt fünf. */
export function pruefeAufAnweisungen(chunks: Pick<SourceChunk, 'text' | 'page' | 'printedPage'>[]): string[] {
  const seiten = new Map<string, string>();
  for (const c of chunks) {
    const s = c.printedPage ?? String(c.page);
    if (seiten.has(s)) continue;
    const f = findeAnweisungen(c.text)[0];
    if (f) seiten.set(s, f);
  }
  if (!seiten.size) return [];
  const liste = [...seiten].slice(0, 5).map(([s, f]) => `S. ${s}: „${f.length > 90 ? f.slice(0, 90) + ' …' : f}“`).join('; ');
  return [`Text, der wie eine Anweisung an eine KI aussieht (${liste}). Die KI behandelt ihn nur als Quellentext; prüfe KI-Ergebnisse zu diesem Dokument besonders genau.`];
}
