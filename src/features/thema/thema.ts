// Themenseite und „Heute lernen“: reine Funktionen, damit Auswahl und Texte testbar bleiben.
// Grundsatz wie überall: Nur echte Spuren zählen (Plan-Blöcke, Kartenstände, Fehlerheft).

import type { ID } from '../../core/types';
import type { DayPlan, PlanBlock } from '../lernplan/scheduler';
import type { KartenStand } from '../karteikarten/typen';

const zaehl = (n: number, eins: string, viele: string) => `${n} ${n === 1 ? eins : viele}`;
const minuten = (n: number) => (n < 60 ? `${n} Min.` : n % 60 ? `${Math.floor(n / 60)} Std. ${n % 60} Min.` : `${n / 60} Std.`);

/** Nächster geplanter Block zu einem Thema ab heute (einschließlich). */
export function naechsterBlock(days: DayPlan[], topicId: ID, heute: string): { date: string; block: PlanBlock } | undefined {
  for (const d of days) {
    if (d.date < heute) continue;
    const block = d.blocks.find((b) => b.topicId === topicId);
    if (block) return { date: d.date, block };
  }
  return undefined;
}

export interface KartenLage { gesamt: number; neu: number; faellig: number; naechsteFaelligkeit?: string }

/** Kartenstand eines Themas: wie viele heute dran sind und wann die nächste Wiederholung kommt. */
export function kartenLage(karten: Array<{ id: ID; topicIds: ID[] }>, staende: Map<ID, KartenStand>, topicId: ID, heute: string): KartenLage {
  let gesamt = 0, neu = 0, faellig = 0;
  let naechste: string | undefined;
  for (const k of karten) {
    if (!k.topicIds.includes(topicId)) continue;
    const s = staende.get(k.id);
    if (s?.ausgesetzt) continue;
    gesamt++;
    if (!s) { neu++; continue; }
    if (s.due <= heute) faellig++;
    else if (!naechste || s.due < naechste) naechste = s.due;
  }
  return { gesamt, neu, faellig, naechsteFaelligkeit: naechste };
}

// ---------------------------------------------------------------- Heute lernen (Startseite)

export interface HeuteEingabe {
  /** Erster offener Block des Tages aus dem Lernplan. */
  block?: Pick<PlanBlock, 'topicId' | 'minutes' | 'kind'>;
  themaName?: string;
  ceCode?: string;
  kartenFaellig: number;
  kartenNeu: number;
  fehlerFaellig: number;
  /** Zum Thema gibt es einen Fall, der offline läuft. */
  fallZumThema: boolean;
  hatPruefung: boolean;
  /** Es gibt überhaupt Lernspuren oder Material (sonst: erster Besuch). */
  ersterBesuch: boolean;
}

export interface HeuteAktion {
  /** Was zu tun ist, in einer Zeile. */
  titel: string;
  /** Bausteine, z. B. „15 Min. CE 10“, „5 Wiederholungen“, „1 Fallfrage“. */
  teile: string[];
  ziel: string;
  knopf: string;
}

/** Die eine nächste Aktion für heute. Reihenfolge: Planblock, fällige Wiederholungen, Fehler, Prüfung anlegen. */
export function heuteAktion(e: HeuteEingabe): HeuteAktion | undefined {
  if (e.ersterBesuch) return undefined;
  const wiederholungen = e.kartenFaellig + e.fehlerFaellig;
  const wdh = wiederholungen ? [zaehl(wiederholungen, 'Wiederholung', 'Wiederholungen')] : [];
  if (e.block) {
    const art = e.block.kind === 'erarbeiten' ? 'erarbeiten' : e.block.kind === 'pruefungsvorbereitung' ? 'vor der Prüfung abfragen' : 'wiederholen';
    return {
      titel: `${e.themaName ?? 'Nächstes Thema'} ${art}`,
      teile: [[minuten(e.block.minutes), e.ceCode].filter(Boolean).join(' '), ...wdh, ...(e.fallZumThema ? ['1 Fallfrage'] : [])],
      ziel: `/lernen/thema?id=${encodeURIComponent(e.block.topicId)}`,
      knopf: 'Jetzt starten',
    };
  }
  if (e.kartenFaellig || e.kartenNeu) {
    return {
      titel: 'Karteikarten wiederholen',
      teile: [...(e.kartenFaellig ? [zaehl(e.kartenFaellig, 'fällige Karte', 'fällige Karten')] : []), ...(e.kartenNeu ? [zaehl(e.kartenNeu, 'neue Karte', 'neue Karten')] : []), ...(e.fehlerFaellig ? [zaehl(e.fehlerFaellig, 'Fehler', 'Fehler')] : [])],
      ziel: '/lernen/karten',
      knopf: 'Karten lernen',
    };
  }
  if (e.fehlerFaellig) return { titel: 'Fehler aus dem Fehlerheft wiederholen', teile: [zaehl(e.fehlerFaellig, 'Fehler', 'Fehler')], ziel: '/lernen/fehler', knopf: 'Jetzt wiederholen' };
  if (!e.hatPruefung) return { titel: 'Nächste Prüfung eintragen', teile: [], ziel: '/lernen/plan?ansicht=pruefungen&neu=1', knopf: 'Prüfung eintragen' };
  return { titel: 'Für heute ist alles geschafft', teile: ['Freiwillig: ein Fall oder eine Übung'], ziel: '/lernen/ueben', knopf: 'Zu den Übungen' };
}
