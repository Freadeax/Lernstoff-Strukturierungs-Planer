// Datenvertrag des DNQP-Lernmoduls (#/lernen/dnqp).
// Reine Daten ohne React. Der Schnellsucher (src/features/schnellsuche) liest STANDARDS nur.
//
// Stabile Anker:
//   Standard     es.dekubitus                  (= Katalog-ID in 20-referenzen.yaml)
//   Kriterium    es.dekubitus:k3               (kriterien[].id = 'k3' = Ebene 3 laut DNQP)
//   Einzelteil   es.dekubitus:k3:P3a           (teil.id = Kennung wie im Standard: S1a, P3, E4b …)
//   Seite        #/lernen/dnqp?standard=es.dekubitus&kriterium=k3

/** Ein Struktur-, Prozess- oder Ergebniskriterium, sinngemäß wiedergegeben (kein Originalwortlaut). */
export interface Teil {
  /** Kennung wie im Standard, z. B. 'S1a', 'P2', 'E4b'. */
  id: string;
  text: string;
}

export interface Kriterium {
  /** 'k1' … 'kn', entspricht der Ebene im Standard. */
  id: string;
  ebene: number;
  /** Worum es auf dieser Ebene geht (eigene Überschrift, z. B. „Einschätzung“). */
  thema: string;
  struktur: Teil[];
  prozess: Teil[];
  ergebnis: Teil[];
  /** Suchbegriffe, Instrumente, Abkürzungen für den Schnellsucher. */
  stichworte?: string[];
}

export type FassungArt = 'Entwicklung' | '1. Aktualisierung' | '2. Aktualisierung' | 'Aktualisierung' | 'Abschlussbericht';

export interface Fassung {
  jahr: number;
  art: FassungArt;
  /** z. B. Vorgängertitel oder Zusammenlegung. */
  hinweis?: string;
}

/** Eine Aussage, die in Lehrbüchern oder Mitschriften oft noch steht, aber nicht (mehr) stimmt. */
export interface Fehlvorstellung {
  id: string;
  /** Wie die falsche oder veraltete Aussage typischerweise lautet. */
  falsch: string;
  /** Was nach der aktuellen Fassung gilt. */
  richtig: string;
  /** Kriterium oder Präambel, auf das sich die Richtigstellung stützt. */
  beleg: string;
  /** Kleingeschriebene Suchmuster (RegExp-Quelltext), mit denen die automatische Prüfung Texte findet. */
  muster?: string[];
}

export interface Quelle {
  titel: string;
  url: string;
  /** Datum, an dem der Inhalt gegen die Quelle gelesen wurde (JJJJ-MM-TT). */
  geprueftAm: string;
  /** 'auszug' = frei zugänglicher DNQP-Auszug mit Kriterientabelle; 'sekundaer' = nur Pressemitteilung/Fachpresse. */
  art: 'auszug' | 'sekundaer';
}

export type StandardStatus = 'aktuell' | 'nicht-eingefuehrt';

export interface Expertenstandard {
  id: string;
  titel: string;
  kurztitel: string;
  synonyme: string[];
  status: StandardStatus;
  /** Chronologisch, die letzte ist die aktuell gültige. */
  fassungen: Fassung[];
  /** Für wen der Standard gilt (Zielgruppe, Settings, Anwender). */
  geltung: string[];
  /** Standardaussage, sinngemäß. */
  zielsetzung: string;
  /** Begründung, sinngemäß. */
  begruendung: string;
  /** Wichtige Aussagen der Präambel, sinngemäß. */
  praeambel: string[];
  kriterien: Kriterium[];
  /** Eigene Lernhinweise: das Wichtigste für Prüfung und Praxis. */
  merke: string[];
  fehlvorstellungen: Fehlvorstellung[];
  /** Curriculare Einheiten (ce.*) aus dem Kompetenzrahmen. */
  ceIds: string[];
  /** Katalogthemen (thema.*). */
  themaIds: string[];
  quelle: Quelle;
}

export interface GrundlagenAbschnitt {
  id: string;
  titel: string;
  punkte: string[];
  quelle?: Quelle;
}

export const EBENE_LABEL = { S: 'Struktur', P: 'Prozess', E: 'Ergebnis' } as const;

/** Aktuelle Fassung als Text, z. B. „2. Aktualisierung 2017“. */
export function aktuelleFassung(s: Expertenstandard): string {
  const f = s.fassungen[s.fassungen.length - 1];
  return f ? `${f.art} ${f.jahr}` : '';
}

export function ankerKriterium(standardId: string, kriteriumId: string): string {
  return `${standardId}:${kriteriumId}`;
}

export function pfadZu(standardId?: string, kriteriumId?: string): string {
  const q = new URLSearchParams();
  if (standardId) q.set('standard', standardId);
  if (kriteriumId) q.set('kriterium', kriteriumId);
  const s = q.toString();
  return `/lernen/dnqp${s ? `?${s}` : ''}`;
}
