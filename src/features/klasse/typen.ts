// Klassenmodus: Eine Lehrkraft verteilt einen Fall per Link, alle bearbeiten ihn auf ihrem Gerät
// und schicken die Abgabe als Text zurück. Es gibt keinen Server: Der ganze Fall steckt im Link,
// die ganze Abgabe im Abgabe-Code. Alles Weitere bleibt im Browser (localStorage).

export type FallArt = 'fallbeispiel' | 'sis' | 'pflegeplanung' | 'uebergabe' | 'bericht';

/** Erwarteter Punkt für die Rückmeldung per Code (Muster wie im Übergabe-Trainer). */
export interface Kernpunkt { text: string; muster: string[] }

export interface Aufgabe {
  id: string;
  frage: string;
  hinweis?: string;
  /** Erwartungshorizont, Musterlösung in Worten. */
  erwartung?: string;
  kernpunkte?: Kernpunkt[];
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
};

/** Fassung für die Klasse: ohne Lösung, wenn sie nie gezeigt werden soll. */
export function klassenFassung(fall: KlassenFall): KlassenFall {
  if (fall.loesung === 'nach-abgabe') return fall;
  return { ...fall, aufgaben: fall.aufgaben.map(({ erwartung: _e, kernpunkte: _k, ...a }) => a) };
}

export function hatLoesung(fall: KlassenFall): boolean {
  return fall.aufgaben.some((a) => !!a.erwartung?.trim() || !!a.kernpunkte?.length);
}

export function neueId(laenge = 8): string {
  const z = 'abcdefghijkmnpqrstuvwxyz23456789';
  const r = crypto.getRandomValues(new Uint8Array(laenge));
  return Array.from(r, (b) => z[b % z.length]).join('');
}
