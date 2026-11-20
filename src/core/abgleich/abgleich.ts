// Antwort-Katalog: Freitext einer vorbereiteten Antwort zuordnen, ganz ohne KI-Dienst.
// Jede Katalog-Antwort hat mehrere Formulierungen. Verglichen wird Wort für Wort (Stamm, Synonyme,
// Tippfehler über Zeichen-Dreiergruppen), gewichtet nach Seltenheit (IDF). Ergebnis: geordnete
// Treffer und eine Einschätzung, ob die Zuordnung sicher ist.

import { trigramme, woerter, type Synonyme } from './normalisieren';

export interface KatalogEintrag {
  id: string;
  /** Formulierungen, die alle dasselbe meinen. */
  texte: string[];
}

interface Variante { eintrag: string; woerter: string[] }

export interface AbgleichIndex {
  varianten: Variante[];
  idf: Map<string, number>;
  tri: Map<string, string[]>;
  syn?: Synonyme;
}

export type Sicherheit = 'sicher' | 'unsicher' | 'keiner';

export interface Treffer { id: string; wert: number; text: string }

export interface AbgleichErgebnis {
  sicherheit: Sicherheit;
  /** absteigend nach Wert, je Eintrag höchstens einmal */
  treffer: Treffer[];
}

export const GRENZEN = { sicher: 0.42, abstand: 0.07, unsicher: 0.18 } as const;

export function erstelleIndex(eintraege: KatalogEintrag[], syn?: Synonyme): AbgleichIndex {
  const varianten: Variante[] = [];
  const df = new Map<string, number>();
  for (const e of eintraege) {
    for (const t of e.texte) {
      const w = woerter(t, syn);
      varianten.push({ eintrag: e.id, woerter: w });
      for (const x of new Set(w)) df.set(x, (df.get(x) ?? 0) + 1);
    }
  }
  const n = Math.max(1, varianten.length);
  const idf = new Map<string, number>();
  const tri = new Map<string, string[]>();
  for (const [w, d] of df) { idf.set(w, Math.log(1 + n / d)); tri.set(w, trigramme(w)); }
  return { varianten, idf, tri, syn };
}

function aehnlich(a: string, b: string, triB: string[] | undefined): number {
  if (a === b) return 1;
  if (a.length < 4 || b.length < 4) return 0;
  if (a.startsWith(b) || b.startsWith(a)) return Math.min(a.length, b.length) >= 5 ? 0.85 : 0;
  const ta = new Set(trigramme(a));
  const tb = triB ?? trigramme(b);
  let gemeinsam = 0;
  for (const t of tb) if (ta.has(t)) gemeinsam++;
  const j = gemeinsam / (ta.size + tb.length - gemeinsam);
  return j >= 0.45 ? j : 0;
}

/** Wert 0…1: wie gut deckt die Eingabe die Variante und umgekehrt (harmonisches Mittel). */
function vergleiche(ix: AbgleichIndex, ein: string[], variante: string[]): number {
  if (!ein.length || !variante.length) return 0;
  const gewicht = (w: string) => ix.idf.get(w) ?? Math.log(1 + ix.varianten.length);
  const best = (w: string, gegen: string[]) => {
    let m = 0;
    for (const v of gegen) { const s = aehnlich(w, v, ix.tri.get(v)); if (s > m) { m = s; if (m === 1) break; } }
    return m;
  };
  let p = 0, pg = 0;
  for (const w of ein) { const g = gewicht(w); pg += g; p += g * best(w, variante); }
  let r = 0, rg = 0;
  for (const w of variante) { const g = gewicht(w); rg += g; r += g * best(w, ein); }
  const P = pg ? p / pg : 0;
  const R = rg ? r / rg : 0;
  return P + R ? (2 * P * R) / (P + R) : 0;
}

export function suche(ix: AbgleichIndex, eingabe: string, opts: { originale?: Map<string, string>; grenzen?: Partial<typeof GRENZEN> } = {}): AbgleichErgebnis {
  const g = { ...GRENZEN, ...opts.grenzen };
  const ein = woerter(eingabe, ix.syn);
  const best = new Map<string, number>();
  for (const v of ix.varianten) {
    const s = vergleiche(ix, ein, v.woerter);
    if (s > (best.get(v.eintrag) ?? -1)) best.set(v.eintrag, s);
  }
  const namen = opts.originale ?? new Map<string, string>();
  const treffer = [...best].map(([id, wert]) => ({ id, wert: Math.round(wert * 1000) / 1000, text: namen.get(id) ?? id }))
    .sort((a, b) => b.wert - a.wert);
  const [eins, zwei] = treffer;
  const sicherheit: Sicherheit = !eins || eins.wert < g.unsicher ? 'keiner'
    : eins.wert >= g.sicher && eins.wert - (zwei?.wert ?? 0) >= g.abstand ? 'sicher' : 'unsicher';
  return { sicherheit, treffer };
}
