// Herkunft jeder Zahl auf der Fortschrittsseite (Audit 11/2026): Datenquelle, Zeitraum und Definition,
// dazu die Unterscheidung „noch keine Daten“ gegen „echte Null“ und ein Hinweis bei kleiner Datenbasis.
// Reine Funktionen, damit Texte und Grenzen ohne Browser testbar sind.

import { evidenceRating } from '../lernplan/fsrs';
import { ersterTag, type Fakten } from './statistik';

export type KennzahlId =
  | 'lernzeit' | 'lerntage' | 'abfragen' | 'karten' | 'sicher'
  | 'serie' | 'wochenziele' | 'stufen' | 'verlauf' | 'bereiche';

export interface KennzahlInfo {
  label: string;
  /** Woher die Zahl kommt (Speicherort und welche Einträge). */
  quelle: string;
  /** Welcher Zeitraum gezählt wird. */
  zeitraum: string;
  /** Was genau gezählt wird. */
  definition: string;
}

const ABFRAGEN = 'Abfragen aus Quiz, Trainern, Fällen, CE-Selbsttest und Prüfungen (Lernplan-Protokoll auf diesem Gerät); Selbsteinschätzungen ausgenommen';

export const KENNZAHLEN: Record<KennzahlId, KennzahlInfo> = {
  lernzeit: {
    label: 'Lernzeit',
    quelle: 'Erfasste Lernzeiten (Timer und Nachtrag im Lernplan) auf diesem Gerät.',
    zeitraum: 'Vom ersten Eintrag bis heute.',
    definition: 'Summe der erfassten Minuten. Geplante, aber nicht erfasste Zeit zählt nicht.',
  },
  lerntage: {
    label: 'Lerntage',
    quelle: 'Lernzeiten, Abfragen und Karteikarten-Bewertungen auf diesem Gerät.',
    zeitraum: 'Vom ersten Eintrag bis heute.',
    definition: 'Kalendertage mit mindestens einer erfassten Minute, einer Abfrage oder einer gelernten Karteikarte.',
  },
  abfragen: {
    label: 'Abfragen',
    quelle: `${ABFRAGEN}.`,
    zeitraum: 'Vom ersten Eintrag bis heute.',
    definition: 'Anzahl der Abfragen mit Ergebnis. Dieselbe Abfrage zählt einmal.',
  },
  karten: {
    label: 'Karteikarten',
    quelle: 'Bewertungen im Karteikarten-Modul auf diesem Gerät.',
    zeitraum: 'Vom ersten Eintrag bis heute.',
    definition: 'Anzahl der Kartenbewertungen (Nochmal, Schwer, Gut, Leicht). Eine Karte, die du dreimal lernst, zählt dreimal.',
  },
  sicher: {
    label: 'Themen sicher',
    quelle: `Lernplan-Bewertung je Thema aus ${ABFRAGEN.charAt(0).toLowerCase()}${ABFRAGEN.slice(1)}, dazu Karteikarten.`,
    zeitraum: 'Stand heute; ältere Abfragen zählen mit, verblassen aber über die Zeit.',
    definition: 'Mehrfach an verschiedenen Tagen erfolgreich abgefragt und laut Wiederholungsmodell (FSRS) heute gut abrufbar. Lesen allein zählt nicht. Gezählt werden nur Einzelthemen ohne Unterthemen.',
  },
  serie: {
    label: 'Lernserie',
    quelle: 'Lerntage wie oben; Ruhetage aus deiner verfügbaren Zeit im Lernplan.',
    zeitraum: 'Rückwärts ab heute bis zum ersten Tag ohne Lernen.',
    definition: 'Lerntage in Folge. Ein Tag mit 0 geplanten Minuten (Dienst, Urlaub) unterbricht die Serie nicht und zählt nicht mit. Heute zählt, sobald du etwas gelernt hast.',
  },
  wochenziele: {
    label: 'Wochenziele',
    quelle: 'Lernzeiten, Lerntage, Abfragen und Karteikarten dieser Woche; Ziele aus deinen Einstellungen oder dem Vorschlag des Lernplans.',
    zeitraum: 'Montag bis Sonntag der laufenden Woche.',
    definition: 'Erreichte Menge gegen dein Ziel. Eine 0 heißt: in dieser Woche noch nichts erfasst.',
  },
  stufen: {
    label: 'Lernstufen',
    quelle: 'Lesestand der Skripte, Lernzeiten und Abfragen auf diesem Gerät, Bewertung aus dem Lernplan.',
    zeitraum: 'Alles bis heute.',
    definition: 'Gelesen: Lernzeit erfasst oder mindestens ein Skriptabschnitt als gelesen markiert. Abgerufen: mindestens eine Abfrage mit Ergebnis aus Karteikarten, Quiz, offener Frage oder Prüfungssimulation. Angewendet: mindestens ein Ergebnis aus einem Trainer. Bestätigt: laut Lernplan sicher. Jede Stufe wird für sich gezählt.',
  },
  verlauf: {
    label: 'Wissensverlauf',
    quelle: 'Lernplan-Bewertung je Thema, für jede Woche neu berechnet aus den Abfragen bis zu deren Ende.',
    zeitraum: 'Die letzten zwölf Wochen, Stand jeweils Sonntag, in der laufenden Woche heute.',
    definition: 'Anzahl der Themen je Status (sicher, unsicher, bearbeitet) am Wochenende. Offene Themen sind nicht dargestellt.',
  },
  bereiche: {
    label: 'CE und Kompetenzbereiche',
    quelle: 'Lernplan-Bewertung je Thema; Zuordnung zu CE und Kompetenzbereich aus dem Katalog und deinen Skripten.',
    zeitraum: 'Stand heute.',
    definition: 'Prozent = Anteil der sicheren Themen am Bereich. Begonnen = nicht mehr offen.',
  },
};

export interface Datenbasis {
  /** Erster Tag mit irgendeinem Eintrag, sonst undefined. */
  ersterTag?: string;
  /** Kalendertage vom ersten Eintrag bis heute (einschließlich); 0 ohne Daten. */
  tage: number;
  lernzeiten: number;
  abfragen: number;
  /** Tage mit mindestens einer Abfrage. */
  abfrageTage: number;
  karten: number;
}

const tageZwischen = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000);

export function datenbasis(f: Fakten, today: string): Datenbasis {
  const start = ersterTag(f);
  const gezaehlt = f.reviewLogs.filter((l) => evidenceRating(l) !== undefined && l.date <= today);
  return {
    ...(start ? { ersterTag: start } : {}),
    tage: start && start <= today ? tageZwischen(start, today) + 1 : 0,
    lernzeiten: f.studyLogs.filter((l) => Number.isFinite(l.minutes) && l.minutes > 0 && l.date <= today).length,
    abfragen: gezaehlt.length,
    abfrageTage: new Set(gezaehlt.map((l) => l.date)).size,
    karten: f.kartenLogs.filter((l) => l.date <= today).length,
  };
}

/** Ab hier gilt die Datenbasis als tragfähig (Grenzen bewusst niedrig und offen genannt). */
export const GRENZEN = { abfragen: 10, abfrageTage: 3, tage: 14 } as const;

export interface Belastbarkeit {
  /** Ein Satz für Karten mit wenig Platz. */
  kurz: string;
  /** Erklärung mit Gründen und ab wann es belastbarer wird. */
  lang: string;
}

/** Wie belastbar sind Status, Lernstufen, Verlauf und Fälligkeiten? undefined, wenn die Basis reicht. */
export function kleineBasis(b: Datenbasis): Belastbarkeit | undefined {
  if (!b.tage) {
    return {
      kurz: 'Noch keine Lerndaten auf diesem Gerät.',
      lang: 'Noch keine Lerndaten auf diesem Gerät. Angezeigt wird deshalb „noch keine Daten“ statt einer Null, und es gibt noch keine Bewertung.',
    };
  }
  const gruende: string[] = [];
  if (b.abfragen < GRENZEN.abfragen) gruende.push(b.abfragen === 0 ? 'noch keine Abfrage' : `erst ${b.abfragen === 1 ? 'eine Abfrage' : `${b.abfragen} Abfragen`}`);
  else if (b.abfrageTage < GRENZEN.abfrageTage) gruende.push(`Abfragen an erst ${b.abfrageTage === 1 ? 'einem Tag' : `${b.abfrageTage} Tagen`}`);
  if (b.tage < GRENZEN.tage) gruende.push(`Daten über erst ${b.tage === 1 ? 'einen Tag' : `${b.tage} Tage`}`);
  if (!gruende.length) return undefined;
  const warum = gruende.join(', ');
  return {
    kurz: `Vorläufig: kleine Datenbasis (${warum}).`,
    lang: `Kleine Datenbasis (${warum}). „Sicher“, die Lernstufen, der Verlauf und die fälligen Wiederholungen sind deshalb vorläufig: `
      + 'Das Wiederholungsmodell schätzt aus wenigen Ergebnissen, wie gut du ein Thema abrufen kannst, und wird mit jeder Abfrage an einem weiteren Tag genauer. '
      + `Belastbarer wird es ab etwa ${GRENZEN.abfragen} Abfragen an ${GRENZEN.abfrageTage} verschiedenen Tagen und ${GRENZEN.tage} Tagen Verlauf. Diese Grenzen sind eine Faustregel der App, kein Prüfungsmaßstab.`,
  };
}

/** „seit 3. Nov. (9 Tage)“ für Gesamtwerte; ohne Daten ein klarer Hinweis statt eines Datums. */
export function zeitraumText(b: Datenbasis, datum: (d: string) => string): string {
  if (!b.ersterTag || !b.tage) return 'noch keine Einträge';
  return `seit ${datum(b.ersterTag)} (${b.tage === 1 ? '1 Tag' : `${b.tage} Tage`})`;
}

/** Wochen des Verlaufs, die vor dem ersten Eintrag enden: dort gab es noch keine Daten (keine echte Null). */
export function wochenOhneDaten(b: Datenbasis, enden: string[]): number {
  return enden.filter((e) => !b.ersterTag || e < b.ersterTag).length;
}
