// Gerätebezogene Zugangsdaten (Claude-API-Schlüssel). Nie in der exportierten Datensicherung.
// Standard: nur für die laufende Sitzung (sessionStorage, weg nach Schließen des Tabs bzw. der App).
// Nur wer „auf diesem Gerät merken“ wählt, bekommt den Schlüssel dauerhaft in localStorage.
const KEY = 'lernstoff.apiKey';

function lies(s: () => Storage): string {
  try { return s().getItem(KEY) ?? ''; } catch { return ''; }
}

export function getApiKey(): string {
  return lies(() => sessionStorage) || lies(() => localStorage);
}

/** Liegt der Schlüssel dauerhaft auf dem Gerät (statt nur in dieser Sitzung)? */
export function apiKeyDauerhaft(): boolean {
  return !!lies(() => localStorage);
}

export function setApiKey(value: string, dauerhaft = false) {
  const v = value.trim();
  try { localStorage.removeItem(KEY); } catch { /* privater Modus */ }
  try { sessionStorage.removeItem(KEY); } catch { /* privater Modus */ }
  if (!v) return;
  try { (dauerhaft ? localStorage : sessionStorage).setItem(KEY, v); } catch { /* Speicher gesperrt */ }
}

/** Wo liegt der Schlüssel gerade? Für die Anzeige in den Einstellungen. */
export function apiKeyOrt(): 'keiner' | 'sitzung' | 'dauerhaft' {
  if (lies(() => localStorage)) return 'dauerhaft';
  return lies(() => sessionStorage) ? 'sitzung' : 'keiner';
}
