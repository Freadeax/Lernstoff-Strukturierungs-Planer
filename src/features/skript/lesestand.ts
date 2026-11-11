// Lesestand je Skript (localStorage, wandert mit der Datensicherung). Eigenes kleines Modul,
// damit Fortschritt und CE-Seite den Lesestand lesen können, ohne den ganzen Skript-Import ins Startpaket zu ziehen.

import type { Lesestand } from './typen';

// ---------------------------------------------------------------- Lesestand (localStorage)

const KEY = 'lernstoff.skript.lesestand';

/** Gelesene Abschnitte einer alten Fassung auf die neue abbilden; entfallene fallen weg. */
export function verschiebeLesestand(skriptId: string, idKarte: Map<string, string>) {
  const alle = ladeLesestaende();
  const st = alle[skriptId];
  if (!st) return;
  alle[skriptId] = {
    ...st,
    gelesen: [...new Set(st.gelesen.map((id) => idKarte.get(id)).filter((x): x is string => !!x))],
    ...(st.zuletzt ? { zuletzt: idKarte.get(st.zuletzt) } : {}),
  };
  speichereLesestaende(alle);
}

export function ladeLesestaende(): Record<string, Lesestand> {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, Lesestand>; } catch { return {}; }
}

export function speichereLesestaende(s: Record<string, Lesestand>) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* privater Modus */ }
}

export function markiereGelesen(skriptId: string, abschnittId: string, gelesen: boolean): Record<string, Lesestand> {
  const alle = ladeLesestaende();
  const st = alle[skriptId] ?? { gelesen: [], geaendert: '' };
  const set = new Set(st.gelesen);
  if (gelesen) set.add(abschnittId); else set.delete(abschnittId);
  alle[skriptId] = { ...st, gelesen: [...set], geaendert: new Date().toISOString() };
  speichereLesestaende(alle);
  return alle;
}

export function merkeZuletzt(skriptId: string, abschnittId: string): Record<string, Lesestand> {
  const alle = ladeLesestaende();
  const st = alle[skriptId] ?? { gelesen: [], geaendert: '' };
  alle[skriptId] = { ...st, zuletzt: abschnittId, geaendert: new Date().toISOString() };
  speichereLesestaende(alle);
  return alle;
}
