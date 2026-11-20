// Adressen des Fertigkeiten-Trainers (Stufe 2 der Neuordnung, siehe docs/UEBUNGEN-STRUKTUR.md).
// Bewusst ohne Inhalte importiert. Die einzelnen Übungen behalten ihre internen Kennungen
// (Lernplan-Trainer rechnen/ablauf, Fehlerheft-Quelle rechnen, Speicherplätze), nur die Adresse ändert sich.

export const FERTIG_PFAD = '/lernen/fertigkeiten';

export const UEBUNG_IDS = ['rea', 'abcde', 'ablauf', 'rechnen', 'hoeren', 'werkbank', 'suchbilder'] as const;
export type UebungId = typeof UEBUNG_IDS[number];

export const UEBUNG_NAME: Record<UebungId, string> = {
  rea: 'Reanimation', abcde: 'ABCDE-Notfall', ablauf: 'Ablauf-Werkbank', rechnen: 'Rechentrainer',
  hoeren: 'Hör-Trainer', werkbank: 'Labor-Werkbank', suchbilder: 'Hygiene-Suchbilder',
};

export const istUebung = (x: string | null | undefined): x is UebungId => !!x && (UEBUNG_IDS as readonly string[]).includes(x);

/** Adresse einer Übung im Fertigkeiten-Trainer, optional mit weiteren Angaben (teil, ablauf, station …). */
export function fertigPfad(uebung?: UebungId, params: Record<string, string | number | undefined> = {}): string {
  const q = new URLSearchParams();
  if (uebung) q.set('uebung', uebung);
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') q.set(k, String(v));
  const s = q.toString();
  return s ? `${FERTIG_PFAD}?${s}` : FERTIG_PFAD;
}

/** Eigene Seiten bis November 2026. */
const ALTE_SEITEN: Record<string, UebungId> = { '/lernen/ablauf': 'ablauf', '/lernen/hoeren': 'hoeren', '/lernen/rechnen': 'rechnen' };

/**
 * Neue Adresse für alte Fertigkeiten-Adressen; alle übrigen Angaben bleiben erhalten:
 * /lernen/ablauf|hoeren|rechnen, Reanimation/ABCDE aus dem Notfall-Trainer und die Labor-Werkbank
 * (alte Einzeltrainer-Adressen und die Zwischenadressen im Wissenstrainer).
 */
export function fertigWeiterleitung(path: string, params: URLSearchParams): string | undefined {
  const q = new URLSearchParams(params);
  let uebung: UebungId | undefined = ALTE_SEITEN[path];
  const fach = path === '/lernen/wissen' ? q.get('fach') : path === '/lernen/notfall' ? 'notfall' : path === '/lernen/labor' ? 'labor' : null;
  const modus = q.get('modus');
  if (!uebung && fach === 'notfall' && (modus === 'rea' || modus === 'abcde')) { uebung = modus; q.delete('modus'); }
  if (!uebung && fach === 'labor' && modus === 'werkbank') { uebung = 'werkbank'; q.delete('modus'); }
  if (!uebung) return undefined;
  q.delete('fach');
  q.delete('uebung');
  const rest = q.toString();
  return `${FERTIG_PFAD}?uebung=${uebung}${rest ? `&${rest}` : ''}`;
}
