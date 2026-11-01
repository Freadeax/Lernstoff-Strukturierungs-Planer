// Auswertungen, die Fachdaten brauchen (CE-Zuordnung, Übungen): von Seite und Hintergrundprüfung gemeinsam genutzt.

import type { ID, MasteryStatus } from '../../core/types';
import { ceListe, ceThemen } from '../ce/modell';
import { ceVonPruefung } from '../ce/pruefung';
import { uebungenFuer } from '../lernplan/trainer';
import type { TopicProgress } from '../lernplan/progress';
import type { FortschrittDaten } from './daten';
import { empfehlungen } from './empfehlung';
import {
  bereichsStand, gesamtWerte, kompetenzBereiche, meilensteine, serie, statusAm, woche, wochenMitAllenZielen,
  wochenStart, wochenZiele, type Bereich, type BereichStand, type Ziele,
} from './statistik';

export interface Auswertung {
  status: Map<ID, TopicProgress>;
  name: (id: ID) => string;
  ce: BereichStand[];
  kb: BereichStand[];
}

export function werteAus(d: FortschrittDaten): Auswertung {
  const status = statusAm(d.lernstand, d.today);
  const namen = new Map(d.lernstand.leaves.map((t) => [t.id, t.name]));
  const st = (id: ID): MasteryStatus => status.get(id)?.status ?? 'offen';
  const liste = ceListe(d.modul);
  const ce: Bereich[] = liste.map((c) => ({ id: c.id, code: c.code, name: c.name, topicIds: ceThemen(d.modul, c, d.skripte, liste).map((t) => t.topic.id) }));
  return {
    status, name: (id) => namen.get(id) ?? id,
    ce: bereichsStand(ce, st),
    kb: bereichsStand(kompetenzBereiche(d.modul), st),
  };
}

export function alleMeilensteine(d: FortschrittDaten, a: Auswertung, ziele: Ziele) {
  const g = gesamtWerte(d.fakten, d.today);
  return meilensteine({
    laengsteSerie: serie(d.fakten, d.today).laengste,
    minutenGesamt: g.minuten,
    abfragenGesamt: g.abfragen,
    kartenGesamt: g.karten,
    sicher: [...a.status.values()].filter((p) => p.status === 'sicher').length,
    themenGesamt: d.lernstand.leaves.length,
    bereicheBegonnen: a.ce.filter((b) => b.gesamt > 0 && b.zahl.offen === 0).length,
    wochenMitZiel: wochenMitAllenZielen(d.fakten, ziele, d.today),
  });
}

export function naechsteSchritte(d: FortschrittDaten, a: Auswertung, ziele: Ziele) {
  return empfehlungen({
    today: d.today, status: a.status, name: a.name, reviewLogs: d.fakten.reviewLogs, ce: a.ce, exams: d.exams,
    ziele: wochenZiele(woche(d.fakten, wochenStart(d.today)), ziele),
    uebung: (id) => uebungenFuer(id, d.modul)[0],
    ceVonPruefung,
  });
}
