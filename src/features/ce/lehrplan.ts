// Curriculare Einheiten laut Landeslehrplan Baden-Württemberg für die Berufsfachschule für Pflege (3BFP),
// Az. 43 – 6512.-2243/102 vom 5. August 2020: Zeitrichtwerte je Ausbildungsabschnitt und die Kompetenzen
// aus Anlage 1 (1./2. Drittel) und Anlage 2 (3. Drittel) PflAPrV, die der Lehrplan der CE zuordnet.
// Nur Fakten (Stunden, Kompetenz-Kennungen), keine Lehrplantexte. Die Stunden entsprechen den Rahmenplänen
// der Fachkommission nach § 53 PflBG. Erzeugt aus dem Lehrplan-PDF, Stand 21.06.2023.

import type { ID } from '../../core/types';

export type Abschnitt = 'ad12' | 'ad3';
export interface LehrplanCe { stunden: Partial<Record<Abschnitt, number>>; kompetenzen: Record<Abschnitt, string[]> }

export const LEHRPLAN_QUELLE = 'Landeslehrplan Baden-Württemberg, Berufsfachschule für Pflege (2020)';
export const ABSCHNITT_LABEL: Record<Abschnitt, string> = { ad12: '1./2. Ausbildungsdrittel', ad3: '3. Ausbildungsdrittel' };

export const LEHRPLAN: Record<ID, LehrplanCe> = {
  'ce.01': { stunden: { ad12: 70 }, kompetenzen: { ad12: ['I.1.h', 'I.6.a', 'II.1.d', 'II.3.a', 'II.3.b', 'III.1.e', 'IV.2.a', 'V.2.a', 'V.2.c', 'V.2.d', 'V.2.e', 'V.2.g'], ad3: [] } },
  'ce.02': { stunden: { ad12: 180 }, kompetenzen: { ad12: ['I.1.a', 'I.1.b', 'I.1.c', 'I.1.d', 'I.1.e', 'I.1.f', 'I.2.a', 'I.2.b', 'I.2.f', 'I.2.g', 'I.6.a', 'I.6.e', 'II.1.a', 'II.1.b', 'II.1.c', 'II.1.e', 'II.2.a', 'II.3.a', 'III.1.a', 'III.1.d', 'III.2.a', 'IV.1.b', 'IV.2.a', 'V.2.b', 'V.2.c'], ad3: [] } },
  'ce.03': { stunden: { ad12: 80 }, kompetenzen: { ad12: ['I.1.h', 'II.1.a', 'II.1.b', 'II.1.c', 'II.1.d', 'II.1.e', 'II.1.g', 'III.1.b', 'V.2.b', 'V.2.c', 'V.2.d'], ad3: [] } },
  'ce.04': { stunden: { ad12: 80, ad3: 80 }, kompetenzen: { ad12: ['I.6.a', 'I.6.d', 'II.1.a', 'II.1.b', 'II.1.d', 'II.2.a', 'II.2.b', 'II.2.c', 'III.1.b', 'III.1.c', 'III.3.c', 'IV.2.b', 'IV.2.c', 'IV.2.e', 'V.1.b', 'V.1.c', 'V.2.a', 'V.2.b', 'V.2.c', 'V.2.d', 'V.2.e'], ad3: ['I.6.a', 'I.6.d', 'II.1.a', 'II.1.b', 'II.1.d', 'II.2.a', 'II.2.b', 'II.2.c', 'II.2.d', 'III.1.c', 'III.1.f', 'III.3.c', 'IV.2.b', 'IV.2.c', 'IV.2.e', 'V.1.b', 'V.1.c', 'V.2.a', 'V.2.b', 'V.2.c', 'V.2.e', 'V.2.f'] } },
  'ce.05': { stunden: { ad12: 200, ad3: 140 }, kompetenzen: { ad12: ['I.2.a', 'I.2.b', 'I.2.c', 'I.2.f', 'II.1.d', 'II.1.e', 'II.2.b', 'III.2.a', 'III.2.b', 'III.2.c', 'III.2.d', 'III.2.e', 'III.3.d', 'III.3.f', 'IV.1.a', 'IV.1.b', 'IV.2.e', 'V.1.b'], ad3: ['I.2.a', 'I.2.b', 'I.2.e', 'I.3.c', 'II.1.d', 'II.2.a', 'II.2.b', 'II.2.c', 'II.2.d', 'II.3.b', 'III.1.b', 'III.1.c', 'III.2.a', 'III.2.b', 'III.2.c', 'III.2.d', 'III.2.e', 'III.2.f', 'III.3.e', 'III.3.f', 'IV.1.a', 'IV.1.b', 'IV.2.a', 'IV.2.e', 'V.1.a', 'V.1.b', 'V.1.c', 'V.2.e'] } },
  'ce.06': { stunden: { ad12: 60, ad3: 60 }, kompetenzen: { ad12: ['I.1.d', 'I.4.a', 'I.4.b', 'I.4.c', 'I.6.a', 'II.1.b', 'II.1.c', 'II.3.c', 'III.2.b', 'V.2.b', 'V.2.c'], ad3: ['I.1.d', 'I.4.a', 'I.4.b', 'I.4.c', 'I.6.a', 'II.1.b', 'II.1.c', 'II.3.b', 'II.3.c', 'III.2.b', 'V.2.b', 'V.2.c'] } },
  'ce.07': { stunden: { ad12: 80, ad3: 80 }, kompetenzen: { ad12: ['I.1.b', 'I.1.c', 'I.1.e', 'I.2.a', 'I.2.b', 'I.2.c', 'I.6.a', 'I.6.b', 'I.6.c', 'II.1.a', 'II.2.a', 'II.2.b', 'II.3.b', 'III.1.a', 'III.1.b', 'III.2.b', 'III.3.a', 'III.3.b', 'III.3.c', 'III.3.d', 'III.3.f', 'IV.1.b', 'V.1.b'], ad3: ['I.5.a', 'I.5.b', 'I.5.d', 'I.6.b', 'I.6.c', 'I.6.d', 'II.1.e', 'II.2.a', 'II.2.c', 'II.2.d', 'II.3.a', 'III.2.f', 'III.3.a', 'III.3.b', 'III.3.c', 'III.3.d', 'III.3.e', 'III.3.f', 'IV.1.a', 'IV.2.b', 'IV.2.d', 'V.2.d', 'V.2.e', 'V.2.g'] } },
  'ce.08': { stunden: { ad12: 160, ad3: 90 }, kompetenzen: { ad12: ['I.3.a', 'I.3.b', 'I.3.c', 'I.3.d', 'I.3.e', 'I.6.a', 'II.1.a', 'II.1.d', 'II.3.a', 'II.3.c', 'III.1.a', 'III.1.b', 'III.2.b', 'III.2.d', 'III.3.e', 'IV.1.b', 'IV.2.b', 'IV.2.e', 'V.1.b', 'V.1.c', 'V.2.b', 'V.2.c'], ad3: ['I.3.a', 'I.3.b', 'I.3.c', 'I.3.d', 'I.3.e', 'I.3.f', 'I.6.a', 'II.1.a', 'II.2.c', 'II.3.a', 'II.3.c', 'III.1.a', 'III.1.e', 'III.2.b', 'III.2.d', 'III.2.f', 'III.3.e', 'IV.1.b', 'IV.1.d', 'IV.2.b', 'IV.2.e', 'V.1.b', 'V.1.c', 'V.1.d', 'V.2.b', 'V.2.c'] } },
  'ce.09': { stunden: { ad12: 150, ad3: 50 }, kompetenzen: { ad12: ['I.5.a', 'I.5.b', 'I.5.c', 'I.5.d', 'I.6.a', 'I.6.d', 'II.1.b', 'II.1.e', 'III.1.d', 'III.3.a', 'IV.2.d', 'V.1.c', 'V.2.f'], ad3: ['I.1.g', 'I.5.a', 'I.5.b', 'I.5.c', 'I.5.d', 'I.6.d', 'I.6.e', 'II.1.b', 'II.1.e', 'II.3.b', 'III.1.a', 'III.1.b', 'III.1.c', 'III.1.d', 'III.1.e', 'III.3.a', 'IV.1.c', 'V.1.c', 'V.2.a'] } },
  'ce.10': { stunden: { ad12: 120, ad3: 60 }, kompetenzen: { ad12: ['I.1.d', 'I.1.e', 'I.5.a', 'I.6.d', 'I.6.e', 'II.1.a', 'II.1.b', 'II.2.a', 'III.1.b', 'III.2.a', 'V.1.a', 'IV.1.b', 'V.1.c'], ad3: ['I.1.b', 'I.1.c', 'I.1.e', 'I.2.c', 'I.3.b', 'I.6.e', 'II.1.c', 'II.1.f', 'II.1.g', 'II.2.a', 'II.2.b', 'II.2.c', 'II.3.a', 'II.3.c', 'III.2.a', 'III.2.d', 'III.2.f', 'III.3.a', 'III.3.b', 'IV.1.b', 'IV.1.d', 'IV.2.a', 'V.1.c', 'V.2.a', 'V.2.b', 'V.2.d'] } },
  'ce.11': { stunden: { ad12: 80, ad3: 80 }, kompetenzen: { ad12: ['I.2.a', 'I.2.b', 'I.2.e', 'I.2.f', 'I.3.a', 'I.3.b', 'I.6.a', 'II.1.a', 'II.1.b', 'II.1.c', 'II.1.d', 'II.1.e', 'II.1.f', 'II.1.g', 'II.2.a', 'III.2.c', 'III.2.d', 'III.3.c', 'IV.2.c', 'V.2.b', 'V.2.c'], ad3: ['I.2.a', 'I.2.b', 'I.3.a', 'I.6.a', 'I.6.d', 'II.1.a', 'II.1.b', 'II.1.c', 'II.1.d', 'II.1.e', 'II.1.f', 'II.1.g', 'II.2.a', 'II.2.b', 'II.3.c', 'III.2.f', 'III.3.b', 'III.3.c', 'III.3.d', 'IV.1.c', 'IV.2.b', 'V.1.d', 'V.2.c', 'V.2.d'] } },
};

export const GESAMT: Record<Abschnitt, number> = {
  ad12: Object.values(LEHRPLAN).reduce((s, c) => s + (c.stunden.ad12 ?? 0), 0),
  ad3: Object.values(LEHRPLAN).reduce((s, c) => s + (c.stunden.ad3 ?? 0), 0),
};

/** „II.1.d“ → Schwerpunkt „II.1“ mit Buchstaben, sortiert. */
export function schwerpunkte(codes: string[]): Array<{ code: string; buchstaben: string[] }> {
  const m = new Map<string, Set<string>>();
  for (const c of codes) {
    const t = /^([IV]+\.\d)\.([a-z])$/.exec(c);
    if (!t) continue;
    m.set(t[1]!, (m.get(t[1]!) ?? new Set()).add(t[2]!));
  }
  const rom: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5 };
  const key = (s: string) => { const [r, n] = s.split('.'); return rom[r!]! * 10 + Number(n); };
  return [...m].sort((a, b) => key(a[0]) - key(b[0])).map(([code, b]) => ({ code, buchstaben: [...b].sort() }));
}
