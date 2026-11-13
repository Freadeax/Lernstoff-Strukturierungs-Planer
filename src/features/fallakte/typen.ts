// Fallakte: eine erfundene Person, die nacheinander durch mehrere Trainer geht
// (SIS, Assessment, Pflegeplanung, Pflegebericht, Übergabe). Jeder Schritt verweist auf einen
// Fall in der Liste des jeweiligen Trainers; geprüft wird dort wie bei jedem anderen Fall.

export type SchrittArt = 'sis' | 'assessment' | 'pflegeplanung' | 'bericht' | 'uebergabe';

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
}

export const ART_LABEL: Record<SchrittArt, string> = {
  sis: 'SIS', assessment: 'Assessment', pflegeplanung: 'Pflegeplanung', bericht: 'Pflegebericht', uebergabe: 'Übergabe',
};

export const ART_PFAD: Record<SchrittArt, string> = {
  sis: '/lernen/sis', assessment: '/lernen/assessment', pflegeplanung: '/lernen/pflegeplanung', bericht: '/lernen/bericht', uebergabe: '/lernen/uebergabe',
};

/** Adresse eines Schritts im Trainer, mit Rückweg zur Fallakte. */
export const schrittPfad = (akteId: string, s: AktenSchritt) => `${ART_PFAD[s.art]}?fall=${encodeURIComponent(s.fallId)}&akte=${encodeURIComponent(akteId)}`;
