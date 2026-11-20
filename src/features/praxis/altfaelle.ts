// Ablösung des alten Praxissimulators (P10, 2026-11-19). Der alte Simulator (engine.ts, scenarios.json, geführte
// Leitfälle) ist entfernt; jeder alte Fall hat einen Nachfolger auf dem neuen Kern (FALLPLAN, Feld `alt`).
// Hier stehen nur noch die Titel der alten Fälle, damit alte Links, Fehlerheft-Einträge, Klassen-Abgaben und das
// lokale Archiv lesbar bleiben und auf den neuen Fall zeigen. Rein, ohne Kern-Import.

import { geraet } from '../../core/geraetestand';
import { FALLPLAN } from './fallplan';

/** Titel der 21 alten Fälle (Stand scenarios.json vor der Ablösung). */
export const ALTFALL_TITEL: Readonly<Record<string, string>> = {
  hausbesuch: 'Die Wohnung ist heute ungewohnt still',
  pflegeheim: 'Unruhe vor dem Mittagessen',
  nachtwache: 'Atemnot in der Nacht',
  zna: 'Brustdruck am Empfang',
  its: 'Ein Alarm während der Übergabe',
  kind: 'Ein Kind möchte nicht mehr trinken',
  psychiatrie: 'Unruhe im Aufenthaltsraum',
  reha: 'Der erste Weg zum Bad',
  palliativ: 'Zeit für ein schwieriges Gespräch',
  sepsis: 'Gestern war sie noch klar',
  nachblutung: 'Der Verband wird rot',
  aufwachraum: 'Sie schläft so tief',
  schlaganfall: 'Der Kaffee läuft aus dem Mundwinkel',
  anaphylaxie: 'Juckreiz nach der ersten Infusion',
  lungenembolie: 'Plötzlich keine Luft beim ersten Aufstehen',
  delir: 'Er will mitten in der Nacht nach Hause',
  asthma: 'Das Spray hilft heute nicht',
  demenz: 'Frau Kühn isst seit gestern nichts',
  bronchiolitis: 'Sie trinkt nur noch die Hälfte',
  herzschwaeche: 'Die Schuhe passen nicht mehr',
  rausch: 'Nach der Party nicht richtig wach',
};

/** Alte Fall-ID → Fall auf dem neuen Kern (aus dem Fallplan abgeleitet). */
export const ALT_ZU_NEU: Readonly<Record<string, string>> = Object.fromEntries(
  FALLPLAN.flatMap((p) => (p.fall ? (p.alt ?? []).map((a) => [a, p.fall!] as const) : [])),
);

/** Nachfolger eines alten Falls; eine ID auf dem neuen Kern kommt unverändert zurück, Unbekanntes als undefined. */
export function neuerFall(id: string | null | undefined, kernIds?: readonly string[]): string | undefined {
  if (!id) return undefined;
  if (ALT_ZU_NEU[id]) return ALT_ZU_NEU[id];
  if (kernIds?.includes(id)) return id;
  return undefined;
}

/** Eintrag im alten Archiv (`lernstoff.praxis.archiv`), nur die Teile, die noch angezeigt werden. */
export interface AltArchivEintrag { id: string; fall: string; titel: string; sekunden: number; fertig: boolean }

export const ALT_ARCHIV_KEY = 'lernstoff.praxis.archiv';

/** Altes Archiv schreibgeschützt lesen. Bleibt in der Datensicherung; neue Einträge entstehen nicht mehr. */
export function altesArchiv(): AltArchivEintrag[] {
  try {
    const roh = JSON.parse(geraet.getItem(ALT_ARCHIV_KEY) ?? '[]') as unknown;
    if (!Array.isArray(roh)) return [];
    return roh.flatMap((x) => {
      const s = x as { id?: unknown; time?: unknown; phase?: unknown; scenario?: { id?: unknown; title?: unknown } };
      if (typeof s?.id !== 'string' || typeof s.scenario?.id !== 'string') return [];
      const fall = s.scenario.id;
      const titel = typeof s.scenario.title === 'string' ? s.scenario.title : ALTFALL_TITEL[fall] ?? fall;
      return [{ id: s.id, fall, titel, sekunden: typeof s.time === 'number' ? s.time : 0, fertig: s.phase === 'finished' }];
    });
  } catch { return []; }
}

const ALT_AKTUELL_KEY = 'lernstoff.praxis.aktuell';

/** Alte Sitzung (Weitergabe-Link „aus=praxis&sitzung=<id>“ ohne neu:-Präfix): Titel und Nachfolger, sonst null. */
export function altSitzung(id: string | null | undefined): { titel: string; neu?: string } | null {
  if (!id || id.startsWith('neu:')) return null;
  const treffer = altesArchiv().find((x) => x.id === id) ?? (() => {
    try {
      const s = JSON.parse(geraet.getItem(ALT_AKTUELL_KEY) ?? 'null') as { id?: unknown; scenario?: { id?: unknown; title?: unknown } } | null;
      if (s?.id !== id || typeof s.scenario?.id !== 'string') return undefined;
      return { fall: s.scenario.id, titel: typeof s.scenario.title === 'string' ? s.scenario.title : ALTFALL_TITEL[s.scenario.id] ?? s.scenario.id };
    } catch { return undefined; }
  })();
  return treffer ? { titel: treffer.titel, neu: ALT_ZU_NEU[treffer.fall] } : null;
}

export const dauerText = (sekunden: number) => `${Math.floor(sekunden / 60)}:${String(Math.floor(sekunden % 60)).padStart(2, '0')} min`;
