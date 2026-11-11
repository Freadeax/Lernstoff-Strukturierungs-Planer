// Umzug von GitHub Pages zu Cloudflare Pages (eigene Adresse, Sicherheitsheader aus public/_headers).
// Solange NEUE_ADRESSE leer ist, passiert nichts. Sobald die neue Seite läuft, hier die Adresse eintragen:
// dann zeigt die alte Adresse (ALTE_HOSTS) oben einen Umzugshinweis mit Anleitung.
export const NEUE_ADRESSE = 'https://lernstoff-planer.pages.dev/';
export const ALTE_HOSTS = ['freadeax.github.io'];

export function mussUmziehen(host = typeof location !== 'undefined' ? location.hostname : '', neu: string = NEUE_ADRESSE): boolean {
  if (!neu) return false;
  try { return ALTE_HOSTS.includes(host) && new URL(neu).hostname !== host; } catch { return false; }
}
