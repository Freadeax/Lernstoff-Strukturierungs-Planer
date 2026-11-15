// Aktualität der Quellen für die Überarbeitungsliste. Datenquelle ist das Quellenregister
// (src/features/quellen/register.ts): Trifft eine neuere Fassung auf eine Quellenangabe mit älterem
// Stand, erscheint der Inhalt in der Überarbeitungsliste („Quelle hat neuere Fassung“).

import type { Quelle } from '../../ui/sim/freigabe';
import { eintraegeFuer, jahr, QUELLEN, type QuellenEintrag } from '../quellen/register';

export interface NeuereFassung {
  /** Erkennt die Quelle am Titel. */
  muster: RegExp;
  titel: string;
  stand: string;
  erschienen: string;
  fundstelle: string;
  /** Was sich für die Lerninhalte ändert, in einem Satz. */
  kern: string;
}

const alsFassung = (e: QuellenEintrag): NeuereFassung => ({
  muster: e.muster, titel: e.titel, stand: e.aktuell.stand, erschienen: e.aktuell.erschienen ?? '', fundstelle: e.aktuell.fundstelle, kern: e.kern ?? '',
});

/** Neuere Fassungen mit belegtem Erscheinungsdatum und Kernaussage. */
export const NEUERE_FASSUNGEN: NeuereFassung[] = QUELLEN.filter((e) => e.kern && e.aktuell.erschienen && e.geprueftAm).map(alsFassung);

/** Quellen, für die eine neuere Fassung bekannt ist. */
export function veralteteQuellen(quellen: readonly Quelle[]): Array<{ quelle: Quelle; neu: NeuereFassung }> {
  const out: Array<{ quelle: Quelle; neu: NeuereFassung }> = [];
  for (const q of quellen) {
    const e = eintraegeFuer(q.titel).find((x) => jahr(q.stand) < jahr(x.aktuell.stand));
    if (e) out.push({ quelle: q, neu: alsFassung(e) });
  }
  return out;
}
