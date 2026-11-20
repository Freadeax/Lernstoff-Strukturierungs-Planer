// Fallakte: eine erfundene Person, die nacheinander durch mehrere Trainer geht
// (SIS, Assessment, Pflegeplanung, Pflegebericht, Übergabe). Jeder Schritt verweist auf einen
// Fall in der Liste des jeweiligen Trainers; geprüft wird dort wie bei jedem anderen Fall.
// Ausnahme ist der Schlussschritt Evaluation: Er steht in der Akte selbst (Daten unten, Prüfung in evaluation.ts).

export type SchrittArt = 'sis' | 'assessment' | 'pflegeplanung' | 'bericht' | 'uebergabe' | 'evaluation';

/** Einschätzung eines Ziels bei der Evaluation (wie im Pflegeplanungs-Trainer). */
export type ZielStand = 'ja' | 'teilweise' | 'nein';

export interface EvalAnpassung {
  text: string;
  richtig: boolean;
  /** Warum die Anpassung passt oder nicht passt; wird nach dem Prüfen gezeigt. */
  warum: string;
}

/** Ein Ziel aus der Musterplanung, das im Verlauf überprüft wird. */
export interface EvalZiel {
  id: string;
  problem: string;
  ziel: string;
  erwartet: ZielStand;
  /** Woran man den Stand im Verlauf erkennt (Werte, Aussagen). */
  beleg: string;
  /** Drei Möglichkeiten, die Planung fortzuschreiben, genau eine ist fachlich richtig. */
  anpassungen: EvalAnpassung[];
}

/** Schlussschritt einer Fallakte: einige Zeit später Ziele prüfen und die Planung anpassen. */
export interface AktenEvaluation {
  /** Kennung des Schritts (fallId), eindeutig über alle Akten. */
  id: string;
  /** Neuer Verlauf seit dem letzten Schritt, Absätze. */
  verlauf: string[];
  ziele: EvalZiel[];
  /** Abschlussgedanke nach dem Prüfen. */
  fazit: string;
}

export interface AktenSchritt {
  id: string;
  art: SchrittArt;
  /** ID des Falls in der Liste des Trainers. */
  fallId: string;
  /** Zeitpunkt in der Geschichte, z. B. „Tag 5, Nachtdienst“. */
  wann: string;
  titel: string;
  /** Was in diesem Schritt zu tun ist, ein bis zwei Sätze. */
  auftrag: string;
}

export interface Fallakte {
  id: string;
  titel: string;
  person: string;
  setting: string;
  kurz: string;
  einstieg: string[];
  schritte: AktenSchritt[];
  /** Fragen für den Rückblick nach dem letzten Schritt: Was hängt über die Schritte hinweg zusammen? */
  rueckblick: { frage: string; antwort: string }[];
  /** Daten für den Schritt der Art 'evaluation'. */
  evaluation: AktenEvaluation;
}

export const ART_LABEL: Record<SchrittArt, string> = {
  sis: 'SIS', assessment: 'Assessment', pflegeplanung: 'Pflegeplanung', bericht: 'Pflegebericht', uebergabe: 'Übergabe', evaluation: 'Evaluation',
};

export const ART_PFAD: Record<SchrittArt, string> = {
  sis: '/lernen/dokumentation?teil=sis', assessment: '/lernen/dokumentation?teil=assessment', pflegeplanung: '/lernen/dokumentation?teil=pflegeplanung', bericht: '/lernen/dokumentation?teil=bericht', uebergabe: '/lernen/dokumentation?teil=uebergabe',
  evaluation: '/lernen/dokumentation?teil=fallakte',
};

/** Adresse eines Schritts im Trainer, mit Rückweg zur Fallakte. */
export const schrittPfad = (akteId: string, s: AktenSchritt) => `${ART_PFAD[s.art]}${ART_PFAD[s.art].includes('?') ? '&' : '?'}fall=${encodeURIComponent(s.fallId)}&akte=${encodeURIComponent(akteId)}`;
