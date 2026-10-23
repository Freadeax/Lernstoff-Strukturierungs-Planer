// Gerätebezogene Einstellungen (API-Schlüssel). Bewusst nur im localStorage dieses Geräts,
// nie in der exportierten Datensicherung.
const KEY = 'lernstoff.apiKey';

export function getApiKey(): string {
  try { return localStorage.getItem(KEY) ?? ''; } catch { return ''; }
}

export function setApiKey(value: string) {
  try {
    if (value) localStorage.setItem(KEY, value.trim());
    else localStorage.removeItem(KEY);
  } catch { /* privater Modus: Schlüssel gilt nur für diese Sitzung nicht */ }
}
