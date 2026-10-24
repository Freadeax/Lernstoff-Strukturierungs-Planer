// Auswertung einer Fallvignette: reine Funktion, damit sie ohne Oberfläche testbar ist.

import type { Treffer } from '../lernplan/trainer';
import { INSTRUMENTE, kategorie, type InstrumentId, type Item, type Kategorie, type Werte } from './instrumente';
import type { Vignette } from './vignetten';

export interface Eingabe {
  werte: Werte;
  /** Die Einstufung, die die lernende Person gewählt hat (Kategorie-ID). */
  kategorie: string | null;
  /** Nur bei Schmerzfällen: das zuerst gewählte Instrument. */
  instrument?: InstrumentId;
}

export interface Zeile { item: Item; soll: number; ist: number | undefined; richtig: boolean; begruendung: string }

export interface VignettenErgebnis {
  zeilen: Zeile[];
  instrumentRichtig: boolean | null;
  summeSoll: number;
  summeIst: number;
  kategorieSoll: Kategorie | undefined;
  kategorieRichtig: boolean;
  punkte: number;
  max: number;
  treffer: Treffer[];
}

/** Items der Musterlösung in der Reihenfolge des Instruments. */
export function loesungsItems(v: Vignette): Item[] {
  return INSTRUMENTE[v.instrument].items.filter((i) => v.loesung[i.id] !== undefined);
}

export function bewerteVignette(v: Vignette, e: Eingabe): VignettenErgebnis {
  const instr = INSTRUMENTE[v.instrument];
  const topicIds = v.topicIds ?? instr.topicIds;
  const zeilen = loesungsItems(v).map((item) => {
    const soll = v.loesung[item.id];
    const ist = e.werte[item.id];
    return { item, soll, ist, richtig: ist === soll, begruendung: v.begruendung[item.id] ?? '' };
  });
  const summeSoll = zeilen.reduce((s, z) => s + z.soll, 0);
  // Punkte aus Items, die nicht zur Lösung gehören (z. B. F1 statt F2), zählen in der eigenen Summe mit
  const summeIst = Object.values(e.werte).reduce<number>((s, w) => s + (w ?? 0), 0);
  const kategorieSoll = kategorie(instr, summeSoll);
  const kategorieRichtig = !!kategorieSoll && e.kategorie === kategorieSoll.id;
  const instrumentRichtig = v.instrumentWahl ? e.instrument === v.instrument : null;

  const treffer: Treffer[] = [
    ...zeilen.map((z) => ({ topicIds, punkte: z.richtig ? 1 : 0, max: 1 })),
    { topicIds, punkte: kategorieRichtig ? 1 : 0, max: 1 },
    ...(instrumentRichtig === null ? [] : [{ topicIds, punkte: instrumentRichtig ? 1 : 0, max: 1 }]),
  ];
  return {
    zeilen, instrumentRichtig, summeSoll, summeIst, kategorieSoll, kategorieRichtig, treffer,
    punkte: treffer.reduce((s, t) => s + t.punkte, 0), max: treffer.length,
  };
}
