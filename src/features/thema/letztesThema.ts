// Zuletzt geöffnetes Thema (nur für diese Sitzung): Wer von einer Themenseite in eine Übung springt,
// findet über „Passt dazu“ zurück. sessionStorage, damit nichts dauerhaft gespeichert wird.

const KEY = 'lernstoff.letztesThema';
/** Nach drei Stunden gilt der Sprung nicht mehr als Teil desselben Lernwegs. */
const GUELTIG_MS = 3 * 60 * 60 * 1000;

export interface LetztesThema { id: string; name: string; zeit: number }

export function merkeThema(id: string, name: string, jetzt = Date.now()) {
  try { sessionStorage.setItem(KEY, JSON.stringify({ id, name, zeit: jetzt })); } catch { /* privater Modus */ }
}

export function letztesThema(jetzt = Date.now()): LetztesThema | undefined {
  try {
    const t = JSON.parse(sessionStorage.getItem(KEY) ?? 'null') as LetztesThema | null;
    if (!t || typeof t.id !== 'string' || typeof t.name !== 'string' || typeof t.zeit !== 'number') return undefined;
    return jetzt - t.zeit <= GUELTIG_MS && t.zeit <= jetzt ? t : undefined;
  } catch { return undefined; }
}
