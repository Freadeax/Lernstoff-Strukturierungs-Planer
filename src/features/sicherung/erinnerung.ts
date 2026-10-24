import type { SicherungsMerker } from '../../core/sicherung';

const WOCHE = 7 * 24 * 60 * 60 * 1000;

/** Erinnern, wenn es Lernstand gibt, die letzte Sicherung über eine Woche her ist und die letzte Erinnerung auch. */
export function brauchtErinnerung(m: SicherungsMerker, eintraege: number, jetzt = Date.now()): boolean {
  if (eintraege < 5) return false;
  const alt = (iso?: string) => !iso || jetzt - Date.parse(iso) > WOCHE;
  return alt(m.zuletzt) && alt(m.erinnertAm);
}
