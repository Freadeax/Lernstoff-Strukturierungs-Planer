// Aktualität der Quellen: bekannte neuere Fassungen von Leitlinien, auf denen Inhalte beruhen.
// Von Hand gepflegt und nur mit überprüfter Fundstelle eingetragen. Trifft ein Eintrag auf eine Quelle
// mit älterem Stand, erscheint der Inhalt in der Überarbeitungsliste („Quelle hat neuere Fassung“).

import type { Quelle } from '../../ui/sim/freigabe';

export interface NeuereFassung {
  /** Erkennt die Quelle am Titel. */
  muster: RegExp;
  stand: string;
  erschienen: string;
  fundstelle: string;
  /** Was sich für die Lerninhalte ändert, in einem Satz. */
  kern: string;
}

export const NEUERE_FASSUNGEN: NeuereFassung[] = [
  {
    muster: /^ERC Guidelines/i, stand: '2025', erschienen: '2025-10-27',
    fundstelle: 'https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/adult-basic-life-support-guidelines',
    kern: 'Basismaßnahmen: Bei fehlender Reaktion sofort Hilfe rufen, die Atmung während des Notrufs prüfen; im Zweifel mit der Reanimation beginnen. Frequenz 100–120/min, Tiefe 5–6 cm und 30:2 bleiben.',
  },
];

const jahr = (stand: string) => Number(stand.match(/\d{4}/)?.[0] ?? NaN);

/** Quellen, für die eine neuere Fassung bekannt ist. */
export function veralteteQuellen(quellen: readonly Quelle[]): Array<{ quelle: Quelle; neu: NeuereFassung }> {
  const out: Array<{ quelle: Quelle; neu: NeuereFassung }> = [];
  for (const q of quellen) {
    const neu = NEUERE_FASSUNGEN.find((n) => n.muster.test(q.titel));
    if (neu && jahr(q.stand) < jahr(neu.stand)) out.push({ quelle: q, neu });
  }
  return out;
}
