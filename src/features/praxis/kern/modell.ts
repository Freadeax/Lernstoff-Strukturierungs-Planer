// Praxissimulator neu – Modell-Schnittstelle. Das gekoppelte Pflege-Physiologiemodell (Paket P1) liegt in
// physiologie/pflegemodell.ts und ist der Standard im Kern; Paket P1b legt die Spur-B-Module als Hülle darum.
// Der Kern kennt nur diese Schnittstelle. Wirkkurven von Maßnahmen rechnet der Kern selbst (kern.ts).

import type { Altersgruppe, Anzeige, Grundgroessen, ModellModule, Sek, Treiber } from './typen';

export interface ModellKontext {
  altersgruppe: Altersgruppe;
  module?: ModellModule;
  /** Spielzeit (für Halbwertszeiten von Treibern mit `seit`). */
  t?: Sek;
  /** Ausgangslage des Falls (NORMAL + fall.start.grund): Basis für abgeleitete Größen. */
  basis?: Grundgroessen;
  /** Summe der gerade laufenden Wirkkurven je Grundgröße. Das Modell regelt abgeleitete Größen
   *  zum Ziel „Basis + Treiber-Effekt + wirkung“, damit Wirkkurven nicht weggeregelt werden. */
  wirkung?: Partial<Record<keyof Grundgroessen, number>>;
  /** Körpergewicht in kg (sonst Altersprofil) */
  gewichtKg?: number;
  /** Uhrzeit bei Fallstart in Minuten seit Mitternacht (G7 Schlaf/Tageszeit; vom Kern aus fall.startUhrzeit) */
  uhrzeitMin?: number;
}

export interface PhysiologieModell {
  /** Ein Logik-Schritt (dt ≤ 5 s): Treiber verändern die Grundgrößen. Rein, ohne Zufall. */
  naechster(grund: Grundgroessen, treiber: readonly Treiber[], dtSek: number, kontext: ModellKontext): Grundgroessen;
  /** Zielwerte für Monitor und Messungen. Rein. */
  anzeige(grund: Grundgroessen, kontext: ModellKontext): Anzeige;
}

/** Optionale Grundgrößen, auf die Wirkkurven zeigen dürfen (fehlen in NORMAL; ohne Wert bleibt die Wirkkurve wirkungslos). */
export const OPTIONALE_WIRKGROESSEN: ReadonlyArray<keyof Grundgroessen> = ['druckLast', 'blaseMl', 'kostAngepasst', 'schlafSchutz'];

export const NORMAL: Grundgroessen = {
  volumen: 1, pumpleistung: 1, gefaesstonus: 1,
  atemantrieb: 1, atemarbeit: 1, gasaustausch: 1,
  blutzucker: 100, temperatur: 36.8, hydratation: 1,
  vigilanz: 1, orientierung: 1, delir: 0, unruhe: 0, schmerz: 0, angst: 0, uebelkeit: 0,
  sauerstoff: 0, krampf: 0,
};
