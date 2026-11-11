// Werkbank-Ergebnisse an den Lernplan melden (Audit, Abschnitt 5): je Durchgang eine eigene Versuch-ID
// `werkbank:<station>:<szenario>:<lauf>`, Themen über die Labor-Themen, Kriterien getrennt.

import { bucheErgebnis, buchungsText } from '../../lernplan/ergebnis';
import { THEMEN } from '../aufgaben';

export type WerkbankStation = 'entnahme' | 'verlauf' | 'meldung';

/** Thema je Station; bei der Verlaufsstation hängt es vom gesuchten Wert ab. */
export function werkbankThema(station: WerkbankStation, gesucht?: string): string {
  if (station === 'entnahme') return THEMEN.entnahme;
  if (station === 'meldung') return 'thema.pp.uebergabe';
  if (gesucht === 'hb' || gesucht === 'leuko' || gesucht === 'thrombo') return THEMEN.blut;
  if (gesucht === 'glukose' || gesucht === 'bz') return THEMEN.diabetes;
  if (gesucht === 'trop' || gesucht === 'ntprobnp') return THEMEN.herz;
  return THEMEN.niere;
}

export const neueLaufId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export interface WerkbankBuchung {
  station: WerkbankStation; szenario: string; lauf: string; topicId: string;
  punkte: number; max: number; kriterien: { id: string; label: string; erfuellt: boolean }[];
}

export function werkbankErgebnis(b: WerkbankBuchung) {
  return {
    versuchId: `werkbank:${b.station}:${b.szenario}:${b.lauf}`,
    herkunft: { modul: 'labor', ref: `werkbank-${b.station}-${b.szenario}`, kriterien: b.kriterien },
    status: 'abgeschlossen' as const, aussagekraft: 'anwendung' as const,
    ergebnisse: [{ topicId: b.topicId, scorePercent: Math.round((Math.max(0, Math.min(b.punkte, b.max)) / b.max) * 100), anzahl: Math.max(1, b.max) }],
  };
}

/** Bucht und liefert einen Satz für die Anzeige. Dieselbe Versuch-ID zählt nur einmal. */
export async function bucheWerkbank(b: WerkbankBuchung): Promise<string> {
  try { return buchungsText(await bucheErgebnis(werkbankErgebnis(b))); }
  catch { return 'Lernplan gerade nicht erreichbar.'; }
}
