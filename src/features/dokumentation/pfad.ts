// Adressen des Dokumentations-Trainers (Stufe 3 der Neuordnung, siehe docs/UEBUNGEN-STRUKTUR.md).
// Bewusst ohne Inhalte importiert. Die Trainer behalten ihre internen Kennungen (Lernplan, Fehlerheft,
// Speicherplätze, Fallakten-Stand), nur die Adresse ändert sich.

export const DOKU_PFAD = '/lernen/dokumentation';

/** In der Reihenfolge des Pflegeprozesses, die Fallakte als durchgehender Fall zuletzt. */
export const DOKU_IDS = ['sis', 'assessment', 'pflegeplanung', 'bericht', 'uebergabe', 'fallakte'] as const;
export type DokuId = typeof DOKU_IDS[number];

export const DOKU_NAME: Record<DokuId, string> = {
  sis: 'SIS', assessment: 'Assessments', pflegeplanung: 'Pflegeplanung', bericht: 'Pflegebericht', uebergabe: 'Übergabe', fallakte: 'Fallakte',
};

export const istDoku = (x: string | null | undefined): x is DokuId => !!x && (DOKU_IDS as readonly string[]).includes(x);

/** Adresse eines Trainers im Dokumentations-Trainer, optional mit weiteren Angaben (fall, akte, modus …). */
export function dokuPfad(teil?: DokuId, params: Record<string, string | number | undefined> = {}): string {
  const q = new URLSearchParams();
  if (teil) q.set('teil', teil);
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') q.set(k, String(v));
  const s = q.toString();
  return s ? `${DOKU_PFAD}?${s}` : DOKU_PFAD;
}

/** Hängt Angaben an eine Adresse an, die schon welche haben kann. */
export const mitAngaben = (pfad: string, angaben: string) => `${pfad}${pfad.includes('?') ? '&' : '?'}${angaben}`;

/** Alte Adressen /lernen/sis, /lernen/fallakte … → Dokumentations-Trainer, alle Angaben bleiben. */
export function dokuWeiterleitung(path: string, params: URLSearchParams): string | undefined {
  const teil = path.startsWith('/lernen/') ? path.slice('/lernen/'.length) : '';
  if (!istDoku(teil)) return undefined;
  const q = new URLSearchParams(params);
  q.delete('teil');
  const rest = q.toString();
  return `${DOKU_PFAD}?teil=${teil}${rest ? `&${rest}` : ''}`;
}
