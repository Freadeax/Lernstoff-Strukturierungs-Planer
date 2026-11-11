// Umzug von GitHub Pages zu Cloudflare Pages (eigene Adresse, Sicherheitsheader aus public/_headers).
// Solange NEUE_ADRESSE leer ist, passiert nichts. Sobald die neue Seite läuft, hier die Adresse eintragen:
// dann zeigt die alte Adresse (ALTE_HOSTS) oben einen Umzugshinweis mit Anleitung.
export const NEUE_ADRESSE = 'https://lernstoff-planer.pages.dev/';
export const ALTE_HOSTS = ['freadeax.github.io'];

export function mussUmziehen(host = typeof location !== 'undefined' ? location.hostname : '', neu: string = NEUE_ADRESSE): boolean {
  if (!neu) return false;
  try { return ALTE_HOSTS.includes(host) && new URL(neu).hostname !== host; } catch { return false; }
}

/** Welche Adresse ist das? Für die sichtbare Angabe in Einstellungen und Datensicherung (Daten gelten je Adresse). */
export function adressArt(host = typeof location !== 'undefined' ? location.hostname : '', neu: string = NEUE_ADRESSE): 'offiziell' | 'alt' | 'andere' {
  try { if (neu && new URL(neu).hostname === host) return 'offiziell'; } catch { /* leer */ }
  return ALTE_HOSTS.includes(host) ? 'alt' : 'andere';
}

export function adressText(host = typeof location !== 'undefined' ? location.hostname : ''): string {
  const art = adressArt(host);
  return `${host || 'unbekannt'} · ${art === 'offiziell' ? 'offizielle Adresse' : art === 'alt' ? 'alte Adresse, bitte umziehen' : 'Test- oder Entwicklungsadresse'}`;
}
