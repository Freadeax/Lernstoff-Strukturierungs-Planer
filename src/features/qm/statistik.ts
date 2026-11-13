// Aufgaben-Statistik auf diesem Gerät (Vorbild: Fragenanalyse in Moodle und die psychometrische
// Itemanalyse großer Fragenbanken). Je Aufgabe und Fassung: Versuche, Lösungsquote und welche
// Antworten gewählt wurden. Daraus entstehen Hinweise für die Überarbeitung:
// - Ein Ablenker wird häufiger gewählt als die Lösung → Lösungsschlüssel prüfen (häufigster Grund: falsch markiert).
// - Sehr niedrige Lösungsquote → Frage unklar, zu schwer oder Lösung falsch.
// - Ein Ablenker wird nie gewählt → wirkt nicht, die Frage ist leichter als gedacht.
// Mit einer Person sind das Hinweise, keine Kennzahlen; sie werden erst ab einer Mindestzahl gezeigt.
// Speicher: localStorage lernstoff.qm.statistik (wandert mit der Datensicherung).

import type { Antwort, Aufgabe, Bewertung } from '../quiz/quiz';
import { storage, istObjekt } from '../../ui/lib/store';
import { fingerabdruck } from './fingerabdruck';

export interface AufgabenWerte {
  fp: string;
  versuche: number;
  /** Ganz richtig gelöst. */
  richtig: number;
  /** Summe der Anteile richtiger Teile (0 bis 1 je Versuch). */
  anteil: number;
  /** Nur Einfach- und Mehrfachauswahl: wie oft jede Option (Text) gewählt wurde. */
  wahl?: Record<string, number>;
  zuletzt: string;
}

export type Statistik = Record<string, AufgabenWerte>;

const K = 'lernstoff.qm.statistik';
export const ladeStatistik = (): Statistik => storage.read<Statistik>(K, {}, 'local', istObjekt);

/** Rein: trägt einen Versuch ein. Neue Fassung (anderer Fingerabdruck) beginnt bei null. */
export function zaehle(st: Statistik, schluessel: string, a: Aufgabe, antwort: Antwort, b: Bewertung, heute: string): Statistik {
  const fp = fingerabdruck(a);
  const alt = st[schluessel]?.fp === fp ? st[schluessel]! : { fp, versuche: 0, richtig: 0, anteil: 0, zuletzt: heute };
  const neu: AufgabenWerte = {
    ...alt, versuche: alt.versuche + 1, richtig: alt.richtig + (b.richtig ? 1 : 0), anteil: alt.anteil + (b.max ? b.punkte / b.max : 0), zuletzt: heute,
  };
  if (a.art === 'auswahl' && antwort.art === 'auswahl') {
    const wahl = { ...(alt.wahl ?? {}) };
    for (const i of antwort.wahl) { const o = a.optionen[i]; if (o !== undefined) wahl[o] = (wahl[o] ?? 0) + 1; }
    neu.wahl = wahl;
  }
  return { ...st, [schluessel]: neu };
}

export function notiereVersuch(quelle: string, a: Aufgabe, antwort: Antwort, b: Bewertung): void {
  storage.write(K, zaehle(ladeStatistik(), `${quelle}:${a.id}`, a, antwort, b, new Date().toISOString().slice(0, 10)));
}

export const MIN_VERSUCHE = 5;

export type Auffaelligkeit = 'ablenker-staerker' | 'sehr-schwer' | 'ablenker-tot' | 'sehr-leicht';
export const AUFFAELLIG_LABEL: Record<Auffaelligkeit, { titel: string; tun: string }> = {
  'ablenker-staerker': { titel: 'Ein Ablenker wird häufiger gewählt als die Lösung', tun: 'Lösungsschlüssel prüfen: Ist die markierte Antwort wirklich richtig, oder ist der Ablenker vertretbar?' },
  'sehr-schwer': { titel: 'Sehr niedrige Lösungsquote', tun: 'Frage auf Verständlichkeit und Lösung prüfen; passt sie zur Stufe?' },
  'ablenker-tot': { titel: 'Ein Ablenker wird nie gewählt', tun: 'Ablenker durch eine plausible Alternative ersetzen.' },
  'sehr-leicht': { titel: 'Wird fast immer richtig gelöst', tun: 'Für Grundlagen in Ordnung; als Anwenden- oder Transferaufgabe zu leicht.' },
};

export interface Analyse { quote: number; versuche: number; befunde: Array<{ art: Auffaelligkeit; detail: string }> }

/** Lösungsquote und Auffälligkeiten einer Aufgabe; null unter der Mindestzahl Versuche oder bei alter Fassung. */
export function analysiere(a: Aufgabe, w: AufgabenWerte | undefined): Analyse | null {
  if (!w || w.fp !== fingerabdruck(a) || w.versuche < MIN_VERSUCHE) return null;
  const quote = w.anteil / w.versuche;
  const befunde: Analyse['befunde'] = [];
  if (a.art === 'auswahl' && w.wahl) {
    const richtigText = a.richtig.map((i) => a.optionen[i]!);
    const maxRichtig = Math.min(...richtigText.map((t) => w.wahl![t] ?? 0));
    for (const [k, o] of a.optionen.entries()) {
      if (a.richtig.includes(k)) continue;
      const n = w.wahl[o] ?? 0;
      if (!a.mehrfach && n > maxRichtig) befunde.push({ art: 'ablenker-staerker', detail: `„${o}“ ${n}× gewählt, Lösung ${maxRichtig}×` });
      if (w.versuche >= 2 * MIN_VERSUCHE && n === 0) befunde.push({ art: 'ablenker-tot', detail: `„${o}“ in ${w.versuche} Versuchen nie gewählt` });
    }
  }
  if (quote < 0.3) befunde.push({ art: 'sehr-schwer', detail: `${Math.round(quote * 100)} % in ${w.versuche} Versuchen` });
  if (quote > 0.95 && w.versuche >= 2 * MIN_VERSUCHE) befunde.push({ art: 'sehr-leicht', detail: `${Math.round(quote * 100)} % in ${w.versuche} Versuchen` });
  return { quote, versuche: w.versuche, befunde };
}
