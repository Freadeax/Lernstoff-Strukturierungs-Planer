// Klassenmodus: Eine Lehrkraft verteilt einen Fall per Link, alle bearbeiten ihn auf ihrem Gerät
// und schicken die Abgabe als Text zurück. Es gibt keinen Server: Der ganze Fall steckt im Link,
// die ganze Abgabe im Abgabe-Code. Alles Weitere bleibt im Browser (localStorage).

export type FallArt = 'fallbeispiel' | 'sis' | 'pflegeplanung' | 'uebergabe' | 'bericht' | 'krankheitsbild' | 'assessment';

/** Erwarteter Punkt für die Rückmeldung per Code (Muster wie im Übergabe-Trainer). */
export interface Kernpunkt { text: string; muster: string[] }

/** Freitext (Standard) oder Auswahl aus Antworten (A, B, C …). Fehlt = Freitext, so bleiben alte Links gültig. */
export type AufgabeTyp = 'text' | 'wahl';

export interface Aufgabe {
  id: string;
  frage: string;
  hinweis?: string;
  /** Erwartungshorizont, Musterlösung in Worten. */
  erwartung?: string;
  kernpunkte?: Kernpunkt[];
  typ?: AufgabeTyp;
  /** Antwortmöglichkeiten einer Auswahlaufgabe, angezeigt als A, B, C … */
  optionen?: string[];
  /** Mehrere Antworten richtig (Kästchen statt Kreise). Steht im Klassenlink, damit die Bedienung stimmt. */
  mehrfach?: boolean;
  /** Indizes der richtigen Optionen. Lösung: nie im Klassenlink. */
  richtig?: number[];
  /** Erreichbare Punkte. Steht im Klassenlink, die Klasse sieht die Gewichtung. */
  punkte?: number;
}

/** Fallmaterial, z. B. Erstgespräch, Beobachtungen, Unterlagen. */
export interface Abschnitt { titel: string; text: string }

export type LoesungZeigen = 'nach-abgabe' | 'nie';

export interface KlassenFall {
  v: 1;
  id: string;
  art: FallArt;
  titel: string;
  situation: string;
  material: Abschnitt[];
  aufgaben: Aufgabe[];
  von?: string;        // Lehrkraft, wird angezeigt
  abgabeAn?: string;   // E-Mail-Adresse für die Abgabe
  frist?: string;      // JJJJ-MM-TT
  loesung: LoesungZeigen;
  erstellt: string;    // ISO
}

export interface Abgabe {
  v: 1;
  fallId: string;
  titel: string;
  name: string;
  antworten: Record<string, string>;
  abgegeben: string;   // ISO
}

export const ART_LABEL: Record<FallArt, string> = {
  fallbeispiel: 'Fallbeispiel', sis: 'SIS', pflegeplanung: 'Pflegeplanung', uebergabe: 'Übergabe (SBAR)', bericht: 'Pflegebericht',
  krankheitsbild: 'Krankheitsbild-Fall', assessment: 'Assessment',
};

/**
 * Fassung für die Klasse: immer ohne Lösung. Ein Link ist nur kodiert, nicht verschlüsselt;
 * eine eingebettete Lösung könnte jeder vor der Abgabe auslesen. Die Lösung geht deshalb
 * getrennt über den Lösungslink (loesungsFassung), den die Lehrkraft nach der Frist verteilt.
 */
export function klassenFassung(fall: KlassenFall): KlassenFall {
  return { ...fall, aufgaben: fall.aufgaben.map(({ erwartung: _e, kernpunkte: _k, richtig: _r, ...a }) => a) };
}

/** Fassung mit Lösung, die nach der Abgabe erscheint. Erst nach der Frist an die Klasse geben. */
export function loesungsFassung(fall: KlassenFall): KlassenFall {
  return { ...fall, loesung: 'nach-abgabe' };
}

export function hatLoesung(fall: KlassenFall): boolean {
  return fall.aufgaben.some((a) => !!a.erwartung?.trim() || !!a.kernpunkte?.length || !!a.richtig?.length);
}

export const istWahl = (a: Aufgabe) => a.typ === 'wahl' && !!a.optionen?.length;

/** Summe der erreichbaren Punkte; null, wenn keine Aufgabe Punkte hat. */
export function maxPunkte(fall: KlassenFall): number | null {
  const mit = fall.aufgaben.filter((a) => typeof a.punkte === 'number' && a.punkte > 0);
  return mit.length ? mit.reduce((s, a) => s + a.punkte!, 0) : null;
}

export function neueId(laenge = 8): string {
  const z = 'abcdefghijkmnpqrstuvwxyz23456789';
  const r = crypto.getRandomValues(new Uint8Array(laenge));
  return Array.from(r, (b) => z[b % z.length]).join('');
}

export type LinkZiel = 'klasse' | 'loesung' | 'lehrkraft';

export const LINK_LABEL: Record<LinkZiel, string> = {
  klasse: 'Klassenlink (für Lernende)',
  loesung: 'Lösungslink (für Lernende, erst nach der Frist)',
  lehrkraft: 'Lehrkraft-Link (nur für Lehrkräfte)',
};

/**
 * Welche Felder ein Link enthält und welche nicht, vor dem Teilen angezeigt (Audit SEC-06).
 * Muss zu klassenFassung/loesungsFassung passen; der Test „A-06“ prüft das am kodierten Link.
 */
export function linkInhalt(fall: KlassenFall, ziel: LinkZiel): { enthaelt: string[]; ohne: string[] } {
  const enthaelt = [
    `Titel, Ausgangssituation${fall.material.length ? ` und ${fall.material.length} Abschnitt${fall.material.length === 1 ? '' : 'e'} Fallmaterial` : ''}`,
    `${fall.aufgaben.length} Aufgabe${fall.aufgaben.length === 1 ? '' : 'n'}${fall.aufgaben.some((a) => a.hinweis) ? ' mit Hinweisen' : ''}`,
  ];
  if (fall.von) enthaelt.push(`Name der Lehrkraft (${fall.von})`);
  if (fall.abgabeAn) enthaelt.push(`Abgabe-Adresse (${fall.abgabeAn})`);
  if (fall.frist) enthaelt.push('Frist');
  const loesung = hatLoesung(fall);
  if (fall.aufgaben.some(istWahl)) enthaelt.push('Antwortmöglichkeiten der Auswahlaufgaben');
  if (maxPunkte(fall) !== null) enthaelt.push('Punkte je Aufgabe');
  if (ziel === 'klasse') {
    const ohne = loesung ? ['Erwartungshorizont', 'Kernpunkte (Checkliste)'] : [];
    if (fall.aufgaben.some((a) => a.richtig?.length)) ohne.push('richtige Antworten der Auswahlaufgaben');
    return { enthaelt, ohne };
  }
  if (loesung) enthaelt.push('Erwartungshorizont und Kernpunkte (Musterlösung)');
  return { enthaelt, ohne: [] };
}

/**
 * Rückmeldung der Lehrkraft an eine Person: Punkte, Kommentare, Note. Kommt als eigener Link
 * zurück (#/lernen/klasse/rueckmeldung?d=…) oder als Code „LSP-BEWERTUNG[…]“. Nicht unterschrieben:
 * ein Lernangebot, kein Zeugnis.
 */
export interface RueckmeldungAufgabe { id: string; frage: string; punkte?: number; max?: number; kommentar?: string }
export interface Rueckmeldung {
  v: 1;
  fallId: string;
  titel: string;
  name: string;
  von?: string;
  aufgaben: RueckmeldungAufgabe[];
  punkte?: number;
  max?: number;
  note?: string;
  kommentar?: string;
  bewertet: string; // ISO
}
