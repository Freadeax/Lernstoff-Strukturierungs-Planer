// Auswertung der Fallaufgaben und Belegstatus der Steckbriefe: reine Funktionen, ohne Oberfläche testbar.

import type { CatalogModule, DiseaseEvidence, DiseaseProfile, DiseaseSection } from '../../modules/catalog-types';
import type { Treffer } from '../lernplan/trainer';
import type { Aufgabe, Fallaufgabe } from './faelle';

/** Antworten je Aufgabe: Indizes der gewählten Optionen. */
export type Antworten = Record<string, number[]>;

export interface AufgabenErgebnis { aufgabe: Aufgabe; gewaehlt: number[]; punkte: number; max: number; richtig: boolean }

export interface FallErgebnis { zeilen: AufgabenErgebnis[]; punkte: number; max: number; treffer: Treffer[] }

/**
 * Einfachauswahl: 1 Punkt für die richtige Option. Mehrfachauswahl: je richtig gewählter Option
 * ein Punkt, je falsch gewählter einer weniger (nicht unter 0). Wer alles ankreuzt, gewinnt nichts.
 */
export function bewerteAufgabe(a: Aufgabe, gewaehlt: number[]): AufgabenErgebnis {
  const wahl = new Set(gewaehlt);
  const richtigeIdx = a.optionen.flatMap((o, i) => (o.richtig ? [i] : []));
  if (a.art === 'einfach') {
    const punkte = wahl.size === 1 && wahl.has(richtigeIdx[0]) ? 1 : 0;
    return { aufgabe: a, gewaehlt: [...wahl], punkte, max: 1, richtig: punkte === 1 };
  }
  let treffer = 0;
  let fehler = 0;
  for (const i of wahl) {
    if (a.optionen[i]?.richtig) treffer++; else fehler++;
  }
  const max = richtigeIdx.length;
  const punkte = Math.max(0, treffer - fehler);
  return { aufgabe: a, gewaehlt: [...wahl], punkte, max, richtig: punkte === max };
}

/** Lernplan-Themen einer Aufgabe: die des Krankheitsbilds plus ggf. die Prophylaxe. */
export function aufgabenThemen(a: Aufgabe, profil: Pick<DiseaseProfile, 'topicIds'> | undefined): string[] {
  return [...new Set([...(profil?.topicIds ?? []), ...(a.extraTopicIds ?? [])])];
}

export function bewerteFall(fall: Fallaufgabe, antworten: Antworten, profil: Pick<DiseaseProfile, 'topicIds'> | undefined): FallErgebnis {
  const zeilen = fall.aufgaben.map((a) => bewerteAufgabe(a, antworten[a.id] ?? []));
  return {
    zeilen,
    punkte: zeilen.reduce((s, z) => s + z.punkte, 0),
    max: zeilen.reduce((s, z) => s + z.max, 0),
    treffer: zeilen.map((z) => ({ topicIds: aufgabenThemen(z.aufgabe, profil), punkte: z.punkte, max: z.max })),
  };
}

/** Alle Aufgaben beantwortet? (Einfachauswahl genau eine, Mehrfachauswahl mindestens eine Option.) */
export function vollstaendig(fall: Fallaufgabe, antworten: Antworten): boolean {
  return fall.aufgaben.every((a) => (antworten[a.id]?.length ?? 0) >= 1);
}

// ---------------------------------------------------------------- Belege und Verknüpfungen

/** Belege eines Abschnitts. Leer = Abschnitt ist ungeprüftes Katalogwissen. */
export function belegeFuer(p: DiseaseProfile, abschnitt: DiseaseSection): DiseaseEvidence[] {
  return (p.belege ?? []).filter((b) => b.abschnitt === abschnitt);
}

export const ABSCHNITTE: { id: DiseaseSection; label: string }[] = [
  { id: 'definition', label: 'Definition' },
  { id: 'formen', label: 'Formen und Einteilung' },
  { id: 'ursachen', label: 'Ursachen' },
  { id: 'risikofaktoren', label: 'Risikofaktoren' },
  { id: 'symptome', label: 'Symptome' },
  { id: 'komplikationen', label: 'Komplikationen und Warnzeichen' },
  { id: 'diagnostik', label: 'Diagnostik' },
  { id: 'therapie', label: 'Therapie' },
  { id: 'pflege', label: 'Pflegeschwerpunkte' },
  { id: 'beratung', label: 'Beratung und Anleitung' },
  { id: 'prophylaxen', label: 'Prophylaxen' },
];

/** Anteil der vorhandenen Abschnitte, die aus dem Unterrichtsmaterial belegt sind. */
export function belegQuote(p: DiseaseProfile): { belegt: number; gesamt: number } {
  const vorhanden = ABSCHNITTE.filter((a) => p[a.id] !== undefined);
  return { belegt: vorhanden.filter((a) => belegeFuer(p, a.id).length).length, gesamt: vorhanden.length };
}

/** Assessments mit Übungsfällen im Assessment-Rechner: Katalog-ID → Gruppe dort. */
export const ASSESSMENT_GRUPPE: Record<string, string> = {
  'as.braden': 'braden', 'as.norton': 'norton', 'as.barthel': 'barthel', 'as.nrs': 'schmerz', 'as.besd': 'schmerz', 'as.mna': 'mna', 'as.gcs': 'gcs',
};

/** Mindestzahl Aufgaben je Thema, ab der ein Fall im Lernplan zählt (wie im Assessment-Rechner). */
export const MIN_PRO_THEMA = 3;

/**
 * Fallaufgaben, die ein Lernplan-Thema wirklich abfragen: über das Krankheitsbild (alle Aufgaben)
 * oder mit mindestens MIN_PRO_THEMA Aufgaben zum Zusatzthema. Sonst würde der Lernplan einen Fall
 * empfehlen, der für dieses Thema nie gespeichert wird.
 */
export function faelleZuThema(topicId: string, faelle: Fallaufgabe[], modul: Pick<CatalogModule, 'diseaseProfiles'>): Fallaufgabe[] {
  const profile = new Map((modul.diseaseProfiles ?? []).map((p) => [p.id, p]));
  return faelle.filter((f) => {
    const themen = profile.get(f.krankheitId)?.topicIds ?? [];
    return f.aufgaben.filter((a) => aufgabenThemen(a, { topicIds: themen }).includes(topicId)).length >= MIN_PRO_THEMA;
  });
}

/**
 * Zufällige Reihenfolge der Antwortoptionen (Fisher-Yates) als Liste der Original-Indizes.
 * Die Antworten bleiben Original-Indizes, nur die Anzeige wird gemischt, damit die richtige
 * Antwort nicht immer an derselben Stelle steht.
 */
export function mischung(anzahl: number, zufall: () => number = Math.random): number[] {
  const out = Array.from({ length: anzahl }, (_, i) => i);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(zufall() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Suche über Name, Synonyme, Symptome und Ursachen; ohne Umlaut- und Großschreibungsunterschiede. */
export function normalisiere(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');
}

export function passtZurSuche(p: DiseaseProfile, q: string): boolean {
  const n = normalisiere(q.trim());
  if (!n) return true;
  return [p.name, ...(p.synonyms ?? []), ...p.symptome, ...p.ursachen].some((x) => normalisiere(x).includes(n));
}
