// Lädt die Fakten für die Fortschrittsseite (nur lesen) und hält die eigenen Ziele.
// Ziele liegen im localStorage unter `lernstoff.ziele` und kommen damit in die Datensicherung.

import { useMemo } from 'react';
import { db } from '../../core/db';
import type { Exam } from '../../core/types';
import { ladeThemen } from '../../core/topics';
import type { CatalogModule } from '../../modules/catalog-types';
import { getModule, modules } from '../../modules/registry';
import { istObjekt, storage, useStore } from '../../ui/lib/store';
import { session } from '../../ui/shell/session';
import { useWidgetData } from '../../ui/widget/useWidgetData';
import { assembleInput, heute, leafTopics, loadPlannerData } from '../lernplan/store';
import { resolveSettings } from '../lernplan/types';
import { ladeLesestaende } from '../skript/lesestand';
import { zieleAufloesen, type Fakten, type Lernstand, type StatKarte, type Ziele } from './statistik';

export const ZIELE_KEY = 'lernstoff.ziele';

export function ladeEigeneZiele(): Partial<Record<keyof Ziele, unknown>> {
  return storage.read<Record<string, unknown>>(ZIELE_KEY, {}, 'local', istObjekt);
}

/** Speichert nur Abweichungen; `null` für ein Feld nimmt wieder den Vorschlag. */
export function speichereZiel(id: keyof Ziele, wert: number | null) {
  const eigene = { ...ladeEigeneZiele() };
  if (wert === null) delete eigene[id]; else eigene[id] = wert;
  return storage.write(ZIELE_KEY, Object.keys(eigene).length ? eigene : null);
}

export interface FortschrittDaten {
  today: string;
  modul: CatalogModule;
  fakten: Fakten;
  lernstand: Lernstand;
  exams: Exam[];
  skripte: Array<{ id: string; gruppe: string; titel: string; topicIds: string[] }>;
  /** Themen von Skripten, in denen mindestens ein Abschnitt als gelesen markiert ist. */
  skriptGelesen: string[];
}

async function lade(moduleId: string): Promise<FortschrittDaten> {
  const today = heute();
  const modul = (getModule(moduleId) ?? modules[0]!) as CatalogModule;
  const [data, karten, skripte] = await Promise.all([
    loadPlannerData(await ladeThemen(moduleId), today),
    db.kartenLogs.toArray().then((l) => l.map(({ date, rating }): StatKarte => ({ date, rating }))).catch(() => [] as StatKarte[]),
    db.skripte.toArray().then((s) => s.map(({ id, gruppe, titel, topicIds }) => ({ id, gruppe, titel, topicIds }))).catch(() => []),
  ]);
  const input = assembleInput(data);
  const lesestaende = ladeLesestaende();
  return {
    today, modul, skripte, exams: data.exams,
    skriptGelesen: [...new Set(skripte.filter((s) => (lesestaende[s.id]?.gelesen.length ?? 0) > 0).flatMap((s) => s.topicIds))],
    fakten: {
      studyLogs: data.studyLogs.map(({ topicId, date, minutes }) => ({ topicId, date, minutes })),
      reviewLogs: data.reviewLogs.map(({ topicId, date, source, rating, scorePercent, trainer, status, aussagekraft }) => ({ topicId, date, source, rating, scorePercent, trainer, ...(status ? { status } : {}), ...(aussagekraft ? { aussagekraft } : {}) })),
      kartenLogs: karten,
      availability: data.config.availability,
    },
    lernstand: { leaves: leafTopics(data.topics), studyLogs: input.studyLogs, reviewLogs: input.reviewLogs, settings: resolveSettings(input), cardEvidence: input.cardEvidence, heute: today },
  };
}

export function useFortschritt(zielStand = 0) {
  const moduleId = useStore(session, (s) => s.moduleId);
  const { state, retry } = useWidgetData({ deps: [moduleId], load: () => lade(moduleId) });
  const daten = state.status === 'ideal' || state.status === 'partial' ? state.data : undefined;
  const ziele = useMemo(() => zieleAufloesen(ladeEigeneZiele(), daten?.fakten.availability), [daten, zielStand]);
  return { daten, ziele, error: state.status === 'error' ? state.error : undefined, retry };
}

const ERINNERT_KEY = 'lernstoff.fortschritt.erinnert';
export const MEILENSTEINE_KEY = 'lernstoff.meilensteine';

export const letzteErinnerung = () => storage.read<string>(ERINNERT_KEY, '') || undefined;
export const merkeErinnerung = (tag: string) => storage.write(ERINNERT_KEY, tag);
export const gemeldeteMeilensteine = () => storage.read<unknown[]>(MEILENSTEINE_KEY, []).filter((x): x is string => typeof x === 'string');
export const merkeMeilensteine = (ids: string[]) => storage.write(MEILENSTEINE_KEY, [...new Set(ids)]);
/** Merker „Meilensteine schon einmal geprüft“, unabhängig davon, ob dabei etwas erreicht war. */
const MEILENSTEINE_START_KEY = 'lernstoff.meilensteine.start';
export const meilensteineGestartet = () => storage.read<boolean>(MEILENSTEINE_START_KEY, false) || gemeldeteMeilensteine().length > 0;
export const merkeMeilensteineGestartet = () => storage.write(MEILENSTEINE_START_KEY, true);
