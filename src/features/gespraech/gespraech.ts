// Gesprächssimulator, reine Logik für die festen Dialoge: Verlauf, Vertrauen, Auswertung.

import { DIALOG, ENDE, TECHNIK, type Antwort, type Dialog, type Knoten, type Urteil } from './dialoge';
import type { SimAuswertung } from '../../ui/sim/auswertung';

export interface Nachricht { von: 'ich' | 'gegenueber'; text: string }
export const MAX_ZUEGE = 14;
export const MAX_ZEICHEN = 800;

export const START_VERTRAUEN = 30;
export interface Zug { knoten: string; antwort: number }
export interface Lauf { dialog: string; aktuell: string; vertrauen: number; zuege: Zug[] }

export const knotenVon = (d: Dialog, id: string): Knoten | undefined => d.knoten.find((k) => k.id === id);

export function starte(d: Dialog): Lauf {
  return { dialog: d.id, aktuell: d.start, vertrauen: START_VERTRAUEN, zuege: [] };
}

const klemme = (x: number) => Math.max(0, Math.min(100, x));

export function antworte(l: Lauf, index: number): Lauf {
  const d = DIALOG[l.dialog]!;
  const k = knotenVon(d, l.aktuell);
  const a = k?.antworten[index];
  if (!k || !a) throw new Error('Ungültige Antwort');
  return { ...l, aktuell: a.weiter, vertrauen: klemme(l.vertrauen + a.vertrauen), zuege: [...l.zuege, { knoten: k.id, antwort: index }] };
}

export const fertig = (l: Lauf) => l.aktuell === ENDE;

/** Reihenfolge der Antworten je Knoten mischen, damit die gute nicht immer oben steht (stabil je Lauf-Seed). */
export function reihenfolge(n: number, seed: number, knoten: string): number[] {
  let h = seed;
  for (const c of knoten) h = (Math.imul(h ^ c.charCodeAt(0), 2654435761) >>> 0);
  const idx = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) { h = (Math.imul(h ^ (h >>> 13), 1597334677) >>> 0); const j = h % (i + 1); [idx[i], idx[j]] = [idx[j]!, idx[i]!]; }
  return idx;
}

const PUNKTE: Record<Urteil, number> = { gut: 2, teilweise: 1, fehler: 0 };

export interface GespraechErgebnis { punkte: number; max: number; prozent: number; vertrauen: number; schritte: Array<{ knoten: Knoten; antwort: Antwort }> }

export function ergebnis(l: Lauf): GespraechErgebnis {
  const d = DIALOG[l.dialog]!;
  const schritte = l.zuege.map((z) => { const knoten = knotenVon(d, z.knoten)!; return { knoten, antwort: knoten.antworten[z.antwort]! }; });
  const punkte = schritte.reduce((s, x) => s + PUNKTE[x.antwort.urteil], 0);
  const max = schritte.length * 2;
  return { punkte, max, prozent: max ? Math.round((punkte / max) * 100) : 0, vertrauen: l.vertrauen, schritte };
}

export function auswertung(d: Dialog, e: GespraechErgebnis): SimAuswertung {
  const fehler = e.schritte.filter((s) => s.antwort.urteil === 'fehler').length;
  const stufe = e.vertrauen >= 70 && fehler === 0 ? 'stabil' : e.vertrauen < 40 ? 'kritisch' : 'unsicher';
  const text = stufe === 'stabil' ? `${d.gegenueber.split(',')[0]} fühlt sich ernst genommen, das Gespräch endet mit einer klaren Absprache.`
    : stufe === 'kritisch' ? 'Das Gespräch endet angespannt: Das Gegenüber fühlt sich nicht verstanden.'
    : 'Das Gespräch ist gelungen, aber mit Umwegen: An einzelnen Stellen hat eine Kommunikationssperre Vertrauen gekostet.';
  return {
    quelle: 'Gesprächssimulator',
    ergebnis: { stufe, text: `${text} Vertrauen am Ende: ${e.vertrauen} von 100.` },
    punkte: e.schritte.map((s, i) => {
      const gut = s.knoten.antworten.find((a) => a.urteil === 'gut');
      return {
        id: `z${i}`, titel: `„${s.knoten.sagt.length > 70 ? `${s.knoten.sagt.slice(0, 70)} …` : s.knoten.sagt}“`, urteil: s.antwort.urteil,
        deine: `${s.antwort.text} (${TECHNIK[s.antwort.technik].name})`,
        ...(s.antwort.urteil !== 'gut' && gut ? { besser: `${gut.text} (${TECHNIK[gut.technik].name})` } : {}),
        warum: s.antwort.warum,
      };
    }),
    merksaetze: d.merksaetze,
    grenzen: 'Feste Antworten zeigen typische Muster. Im echten Gespräch zählen auch Tonfall, Blickkontakt und Pausen.',
  };
}
