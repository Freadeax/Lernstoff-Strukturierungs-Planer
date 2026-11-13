// Gemeinsame Auswertung für alle Simulatoren und Praxistrainer (Ausbau 2026-11-13: „einheitliche
// Bedienung, Auswertung mit Begründung“). Jede Simulation liefert über einen eigenen Adapter dieselbe
// Form; AuswertungsKarte zeigt sie überall gleich: Ergebnis, Entscheidungen mit Begründung, Merksätze.
// Die ausführlichen Ansichten der einzelnen Simulatoren (Verlauf, Kurven, Ketten) bleiben darunter.

/** gut: fachlich passend · teilweise: vertretbar, aber nicht der beste Weg · fehler: ungünstig oder gefährlich */
export type Urteil = 'gut' | 'teilweise' | 'fehler';
export const URTEIL_LABEL: Record<Urteil, string> = { gut: 'Gut', teilweise: 'Teilweise', fehler: 'Verbessern' };
export const URTEIL_ZEICHEN: Record<Urteil, string> = { gut: '✓', teilweise: '◐', fehler: '✗' };

export interface AuswertungsPunkt {
  id: string;
  /** Worum es ging, z. B. „Die Mutter will noch einmal sprühen“ oder „Hilfe geholt“. */
  titel: string;
  urteil: Urteil;
  /** Was du getan bzw. gewählt hast (fehlt, wenn nur Vorliegen geprüft wurde). */
  deine?: string;
  /** Der fachlich bessere Weg, wenn deine Wahl nicht passte. */
  besser?: string;
  /** Begründung: warum das so ist. Pflicht, damit jede Rückmeldung erklärt ist. */
  warum: string;
  /** Simulationszeit oder Uhrzeit, wenn bekannt. */
  wann?: string;
}

/** stabil: gut ausgegangen · unsicher: Lücken, Lage aber beherrscht · kritisch: Lage nicht stabil oder gefährliche Fehler */
export type ErgebnisStufe = 'stabil' | 'unsicher' | 'kritisch';
export const ERGEBNIS_LABEL: Record<ErgebnisStufe, string> = { stabil: 'Gut gelungen', unsicher: 'Mit Lücken', kritisch: 'Kritisch' };

export interface SimAuswertung {
  /** Name der Übung für Überschrift und Screenreader, z. B. „Praxissimulator“. */
  quelle: string;
  ergebnis: { stufe: ErgebnisStufe; text: string };
  punkte: AuswertungsPunkt[];
  /** Was man aus diesem Fall mitnehmen soll (Lernimpulse, Musterlösung). */
  merksaetze: string[];
  /** Grenzen der automatischen Wertung, z. B. „Freitexte werden nicht inhaltlich bewertet“. */
  grenzen?: string;
}

const RANG: Record<Urteil, number> = { fehler: 0, teilweise: 1, gut: 2 };

/** Zuerst das, was zu verbessern ist, dann Teilweises, dann Gelungenes; sonst stabil in Quellreihenfolge. */
export function sortierePunkte(p: AuswertungsPunkt[]): AuswertungsPunkt[] {
  return p.map((x, i) => ({ x, i })).sort((a, b) => RANG[a.x.urteil] - RANG[b.x.urteil] || a.i - b.i).map((a) => a.x);
}

export function zaehle(a: SimAuswertung): Record<Urteil, number> {
  const z: Record<Urteil, number> = { gut: 0, teilweise: 0, fehler: 0 };
  for (const p of a.punkte) z[p.urteil]++;
  return z;
}

/** Kurzzeile, z. B. „5 gut, 1 teilweise, 2 zu verbessern“. */
export function kurzfassung(a: SimAuswertung): string {
  const z = zaehle(a);
  const teile = [`${z.gut} gut`];
  if (z.teilweise) teile.push(`${z.teilweise} teilweise`);
  teile.push(z.fehler ? `${z.fehler} zu verbessern` : 'nichts Gefährliches');
  return `${ERGEBNIS_LABEL[a.ergebnis.stufe]}: ${teile.join(', ')}`;
}

/** Prüft die Form (für Adapter-Tests): eindeutige IDs, jede Rückmeldung begründet, kein „besser“ bei „gut“. */
export function formFehler(a: SimAuswertung): string[] {
  const f: string[] = [];
  const ids = a.punkte.map((p) => p.id);
  if (new Set(ids).size !== ids.length) f.push('doppelte IDs');
  if (!a.ergebnis.text.trim()) f.push('Ergebnis ohne Text');
  for (const p of a.punkte) {
    if (!p.titel.trim()) f.push(`${p.id}: ohne Titel`);
    if (!p.warum.trim()) f.push(`${p.id}: ohne Begründung`);
    if (p.urteil === 'gut' && p.besser) f.push(`${p.id}: „besser“ bei gutem Urteil`);
  }
  return f;
}
