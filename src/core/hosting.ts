// Umzug von GitHub Pages zu Cloudflare Pages (eigene Adresse, Sicherheitsheader aus public/_headers).
// Solange NEUE_ADRESSE leer ist, passiert nichts. Sobald die neue Seite läuft, hier die Adresse eintragen:
// dann zeigt die alte Adresse (ALTE_HOSTS) oben einen Umzugshinweis mit Anleitung.
export const NEUE_ADRESSE = 'https://lernstoff-planer.pages.dev/';
export const ALTE_HOSTS = ['freadeax.github.io'];
// Philipp, 2026-11-12: vorerst laufen beide Adressen gleichberechtigt weiter (beide bekommen jeden Stand von main).
// Deshalb kein Umzugshinweis. Für den späteren Umzug hier wieder auf true stellen.
export const UMZUG_HINWEIS_AKTIV = false;

export function mussUmziehen(host = typeof location !== 'undefined' ? location.hostname : '', neu: string = NEUE_ADRESSE, aktiv: boolean = UMZUG_HINWEIS_AKTIV): boolean {
  if (!aktiv || !neu) return false;
  try { return ALTE_HOSTS.includes(host) && new URL(neu).hostname !== host; } catch { return false; }
}

/** Welche Adresse ist das? Für die sichtbare Angabe in Einstellungen und Datensicherung (Daten gelten je Adresse). */
export function adressArt(host = typeof location !== 'undefined' ? location.hostname : '', neu: string = NEUE_ADRESSE): 'offiziell' | 'alt' | 'andere' {
  try { if (neu && new URL(neu).hostname === host) return 'offiziell'; } catch { /* leer */ }
  return ALTE_HOSTS.includes(host) ? 'alt' : 'andere';
}

export function adressText(host = typeof location !== 'undefined' ? location.hostname : ''): string {
  const art = adressArt(host);
  return `${host || 'unbekannt'} · ${art === 'offiziell' ? 'Cloudflare Pages, Hauptadresse' : art === 'alt' ? 'GitHub Pages, zweite Adresse' : 'Test- oder Entwicklungsadresse'}`;
}

/**
 * Dürfen Zugangsdaten (Claude-Schlüssel, GitHub-Token) dauerhaft gemerkt werden? Nicht auf GitHub Pages
 * (Audit D-1): Alle Projektseiten unter freadeax.github.io teilen sich denselben Browser-Speicher, und dort
 * gelten die Sicherheitsheader aus public/_headers nicht. Dann nur für die Sitzung.
 */
export function darfZugangMerken(host = typeof location !== 'undefined' ? location.hostname : ''): boolean {
  return adressArt(host) !== 'alt';
}

export const MERKEN_GESPERRT_TEXT = 'Auf dieser Adresse (GitHub Pages) nicht möglich: Sie teilt den Browser-Speicher mit allen anderen Seiten unter freadeax.github.io und hat keine Sicherheitsheader. Dauerhaft merken geht auf lernstoff-planer.pages.dev.';
