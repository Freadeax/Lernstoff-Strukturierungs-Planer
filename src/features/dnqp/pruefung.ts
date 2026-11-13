// Expertenstandard-Prüfung: findet in Texten Aussagen, die einer bekannten Fehlvorstellung
// (veraltet oder falsch) zu einem DNQP-Standard entsprechen. Rein, ohne React, getestet.
// Ein Treffer ist ein Prüfhinweis, kein Urteil: Der Satz kann die Fehlvorstellung auch gerade richtigstellen.

import { STANDARDS } from './standards';
import type { Expertenstandard, Fehlvorstellung } from './typen';

export interface Treffer {
  standardId: string;
  standard: string;
  fehlvorstellung: Fehlvorstellung;
  /** Der Satz, in dem das Muster gefunden wurde. */
  satz: string;
  /** Satz enthält eine Verneinung oder Richtigstellung (nicht, kein, veraltet, früher …). */
  wirktRichtiggestellt: boolean;
}

const VERNEINUNG = /(^|[^a-zäöüß])(nicht|kein|nie\b|veraltet|früher|ehemal|bis 20\d\d|überholt|abgelöst|statt|alte[nr]? fassung|vorher)/i;

interface Regel { s: Expertenstandard; f: Fehlvorstellung; re: RegExp[] }

const REGELN: Regel[] = STANDARDS.flatMap((s) => s.fehlvorstellungen
  .filter((f) => f.muster?.length)
  .map((f) => ({ s, f, re: f.muster!.map((m) => new RegExp(m, 'i')) })));

/** Zerlegt einen Text in Sätze (auch Listenpunkte und Zeilen). */
export function saetze(text: string): string[] {
  return text
    .replace(/\r/g, '')
    .split(/\n+|(?<=[^\d\s][.!?])\s+(?=[A-ZÄÖÜ„"(])/)
    .map((x) => x.replace(/^[\s>*\-–•#|]+/, '').trim())
    .filter((x) => x.length > 3);
}

export function pruefeText(text: string): Treffer[] {
  const treffer: Treffer[] = [];
  for (const satz of saetze(text)) {
    for (const { s, f, re } of REGELN) {
      if (re.some((r) => r.test(satz))) {
        treffer.push({ standardId: s.id, standard: s.kurztitel, fehlvorstellung: f, satz, wirktRichtiggestellt: VERNEINUNG.test(satz) });
      }
    }
  }
  return treffer;
}

/** Alle Fehlvorstellungen mit Suchmuster (für Tests und die Übersicht). */
export const PRUEFREGELN = REGELN.map(({ s, f }) => ({ standardId: s.id, id: f.id }));
