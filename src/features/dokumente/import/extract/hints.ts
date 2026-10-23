// Hinweise auf Auflage/Version/Stand im Titel oder auf den ersten Seiten.
const PATTERNS: RegExp[] = [
  /\b(\d{1,2})\.\s*(?:überarbeitete\s+)?Auflage\b/i,
  /\bAuflage\s*(\d{1,2})\b/i,
  /\bStand:?\s*((?:\d{1,2}[./])?\d{1,2}[./]\d{2,4}|\d{4})\b/i,
  /\b[Vv](?:ersion)?\s?(\d+(?:\.\d+)*)\b/,
];

export function editionHint(text: string, title?: string): string | undefined {
  const head = `${title ?? ''}\n${text.slice(0, 4000)}`;
  for (const re of PATTERNS) {
    const m = re.exec(head);
    if (m) return m[0].trim();
  }
  return undefined;
}

/** Vergleichbarer Zahlenwert eines Hinweises (höher = neuer), sonst undefined. */
export function editionRank(hint?: string): number | undefined {
  if (!hint) return undefined;
  const date = /(?:(\d{1,2})[./])?(\d{1,2})[./](\d{2,4})|\b(\d{4})\b/.exec(hint);
  if (/Stand/i.test(hint) && date) {
    if (date[4]) return Number(date[4]) * 10000;
    const y = Number(date[3].length === 2 ? '20' + date[3] : date[3]);
    return y * 10000 + Number(date[2]) * 100 + Number(date[1] ?? 0);
  }
  const n = /(\d+(?:\.\d+)?)/.exec(hint);
  return n ? Number(n[1]) : undefined;
}
