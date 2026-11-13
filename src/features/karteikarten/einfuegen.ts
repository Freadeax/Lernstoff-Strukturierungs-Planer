// Viele Karteikarten auf einmal aus eingefügtem Text, wie beim Import in Quizlet oder Anki:
// eine Karte je Zeile, Vorder- und Rückseite durch ein Trennzeichen getrennt.
// Erkennt Tabulator (Excel, Quizlet-Export), „::“ (RemNote), Semikolon (Anki-CSV), Pfeil, Gedankenstrich und Doppelpunkt.
// Zeilen ohne Trennzeichen direkt unter einer Karte gehören zur Rückseite (Aufzählungen), Zeilen mit [[Lücken]] werden Lückentexte.

import { luecken } from './erzeugen';

export type Trenner = 'tab' | 'doppelpunkt2' | 'semikolon' | 'pfeil' | 'strich' | 'doppelpunkt';

export const TRENNER: Array<{ id: Trenner; label: string; muster: RegExp }> = [
  { id: 'tab', label: 'Tabulator (aus Excel, Quizlet, Anki)', muster: /\t+/ },
  { id: 'doppelpunkt2', label: 'Zwei Doppelpunkte  Begriff :: Erklärung', muster: /\s*::\s*/ },
  { id: 'semikolon', label: 'Semikolon  Begriff; Erklärung', muster: /\s*;\s*/ },
  { id: 'pfeil', label: 'Pfeil  Begriff -> Erklärung', muster: /\s*(?:->|→|=>)\s*/ },
  { id: 'strich', label: 'Gedankenstrich  Begriff – Erklärung', muster: /\s+[–—-]\s+/ },
  { id: 'doppelpunkt', label: 'Doppelpunkt  Begriff: Erklärung', muster: /:\s+/ },
];

export interface EingefuegteKarte { vorne: string; hinten: string; luecken?: boolean; zeile: number }

export interface Einfuegung {
  karten: EingefuegteKarte[];
  /** Zeilennummern (ab 1), die keine Karte ergeben haben. */
  uebersprungen: number[];
  trenner?: Trenner;
}

/** Trenner, die in Fließtext kaum zufällig vorkommen. */
const STARK = new Set<Trenner>(['tab', 'doppelpunkt2', 'pfeil']);

const AUFZAEHLUNG = /^\s*(?:[-*•]|\d+[.)])\s+/;
const UEBERSCHRIFT = /^\s*#{1,6}\s/;

/** Trennzeichen, das in den meisten Zeilen vorkommt (bei Gleichstand gewinnt das eindeutigere weiter oben). */
export function erkenneTrenner(text: string): Trenner | undefined {
  const zeilen = text.split(/\r?\n/).map((z) => z.replace(AUFZAEHLUNG, '')).filter((z) => z.trim() && !UEBERSCHRIFT.test(z));
  let best: { id: Trenner; n: number } | undefined;
  for (const t of TRENNER) {
    const n = zeilen.filter((z) => teile(z, t.muster)).length;
    if (n > 0 && (!best || n > best.n)) best = { id: t.id, n };
  }
  return best?.id;
}

/** Teilt am ersten Vorkommen; nur wenn beide Seiten Text haben. */
function teile(zeile: string, muster: RegExp): [string, string] | undefined {
  const m = muster.exec(zeile);
  if (!m || m.index === 0) return undefined;
  const vorne = zeile.slice(0, m.index).trim();
  const hinten = zeile.slice(m.index + m[0].length).trim();
  return vorne && hinten ? [vorne, hinten] : undefined;
}

export function zerlegeEinfuegung(text: string, wahl: Trenner | 'auto' = 'auto'): Einfuegung {
  const trenner = wahl === 'auto' ? erkenneTrenner(text) : wahl;
  const muster = TRENNER.find((t) => t.id === trenner)?.muster;
  // Automatisch: Eindeutige Trenner gelten zusätzlich je Zeile, damit gemischt eingefügte Listen funktionieren.
  const weitere = wahl === 'auto' ? TRENNER.filter((t) => t.id !== trenner && STARK.has(t.id)).map((t) => t.muster) : [];
  const karten: EingefuegteKarte[] = [];
  const uebersprungen: number[] = [];
  let letzte: EingefuegteKarte | undefined;
  text.split(/\r?\n/).forEach((roh, i) => {
    const nr = i + 1;
    if (!roh.trim()) { letzte = undefined; return; }
    if (UEBERSCHRIFT.test(roh)) { letzte = undefined; return; }
    const istPunkt = AUFZAEHLUNG.test(roh);
    const zeile = roh.replace(AUFZAEHLUNG, '').trim();
    const paar = (muster ? teile(zeile, muster) : undefined) ?? weitere.reduce<[string, string] | undefined>((f, m) => f ?? teile(zeile, m), undefined);
    // Zeile mit [[Lücken]] und ohne Trenner: eigener Lückentext.
    if (!paar && luecken(zeile).length) {
      letzte = { vorne: zeile.slice(0, 4000), hinten: '', luecken: true, zeile: nr };
      karten.push(letzte);
      return;
    }
    // Eingerückte Aufzählung oder Zeile ohne Trenner direkt unter einer Karte: Fortsetzung der Rückseite.
    if (letzte && !letzte.luecken && (!paar || (istPunkt && /^\s+/.test(roh)))) {
      letzte.hinten = `${letzte.hinten}\n${istPunkt ? '• ' : ''}${zeile}`;
      return;
    }
    if (paar) {
      letzte = { vorne: paar[0].slice(0, 2000), hinten: paar[1].slice(0, 4000), zeile: nr };
      karten.push(letzte);
      return;
    }
    uebersprungen.push(nr);
  });
  return { karten, uebersprungen, trenner };
}

/** Vergleichsform, um schon vorhandene Karten nicht doppelt anzulegen. */
export const kartenSchluessel = (vorne: string) => vorne.normalize('NFKC').toLocaleLowerCase('de').replace(/\s+/g, ' ').trim();
