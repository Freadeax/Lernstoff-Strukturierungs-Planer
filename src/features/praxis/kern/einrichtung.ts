// Praxissimulator neu – Einrichtungsprofil (Paket P3): Befugnis-Grundwerte einstellbar machen (E4, KONZEPT 6.1).
// Eine Einrichtung (Schule, Klinik, Pflegedienst) darf Grundwerte strenger oder lockerer setzen. Ausnahmen:
// - Ärztliche Vorbehalte (AERZTLICH_VORBEHALTEN) lassen sich nicht lockern.
// - `anordnungspflichtig` ist Teil der Maßnahme und bleibt immer bestehen (ohne Anordnung keine Medikamentengabe).
// Anwendung rein und replay-fest: mitEinrichtung(fall, profil) liefert einen Fall mit ergänzter befugnisUeberschreibung,
// den die Darstellung an start() übergibt. Überschreibungen im Fall selbst haben Vorrang (der Fall ist darauf getestet).

import { KATALOG } from './katalog';
import type { BefugnisLevel, FallV2, Rolle } from './typen';

export const ROLLEN: readonly Rolle[] = [1, 2, 3, 'pflegefachperson'];
const LEVEL: readonly BefugnisLevel[] = ['selbst', 'mit-anleitung', 'nach-anordnung', 'gesperrt', 'nur-aerztlich'];

/** Ärztliche Aufgaben, die keine Einrichtung an Pflegende (oder Auszubildende) gibt. */
export const AERZTLICH_VORBEHALTEN: ReadonlySet<string> = new Set(['intubation-durchfuehren', 'zvk-legen']);

export type Befugnisabweichungen = Record<string, Partial<Record<Rolle, BefugnisLevel>>>;

export interface EinrichtungsProfil {
  id: string;
  name: string;
  /** Datum JJJJ-MM-TT, an dem die Einrichtung die Regeln bestätigt hat */
  stand?: string;
  abweichungen: Befugnisabweichungen;
  anmerkung?: string;
}

export interface ProfilFehler { massnahme: string; rolle?: Rolle; text: string }

/** Prüft ein Profil; mitEinrichtung() übernimmt nur fehlerfreie Einträge. */
export function pruefeProfil(p: EinrichtungsProfil): ProfilFehler[] {
  const fehler: ProfilFehler[] = [];
  for (const [id, je] of Object.entries(p.abweichungen)) {
    const m = KATALOG[id];
    if (!m) { fehler.push({ massnahme: id, text: 'Unbekannte Maßnahme' }); continue; }
    for (const [r, level] of Object.entries(je) as Array<[string, BefugnisLevel]>) {
      const rolle: Rolle = r === 'pflegefachperson' ? r : (Number(r) as Rolle);
      if (!ROLLEN.includes(rolle)) { fehler.push({ massnahme: id, text: `Unbekannte Rolle ${r}` }); continue; }
      if (!LEVEL.includes(level)) { fehler.push({ massnahme: id, rolle, text: `Unbekannte Befugnis ${String(level)}` }); continue; }
      if (AERZTLICH_VORBEHALTEN.has(id) && level !== 'nur-aerztlich') {
        fehler.push({ massnahme: id, rolle, text: 'Ärztlicher Vorbehalt, nicht änderbar' });
      }
    }
  }
  return fehler;
}

function gueltig(p: EinrichtungsProfil): Befugnisabweichungen {
  const schlecht = new Set(pruefeProfil(p).map((f) => `${f.massnahme}|${f.rolle ?? '*'}`));
  const out: Befugnisabweichungen = {};
  for (const [id, je] of Object.entries(p.abweichungen)) {
    if (schlecht.has(`${id}|*`)) continue;
    for (const rolle of ROLLEN) {
      const level = je[rolle];
      if (level && !schlecht.has(`${id}|${rolle}`)) (out[id] ??= {})[rolle] = level;
    }
  }
  return out;
}

/** Grundwert einer Rolle mit Einrichtungsprofil (ohne Fall). */
export function grundBefugnis(id: string, rolle: Rolle, p?: EinrichtungsProfil): BefugnisLevel | undefined {
  const m = KATALOG[id];
  if (!m) return undefined;
  return (p ? gueltig(p)[id]?.[rolle] : undefined) ?? m.befugnis[rolle];
}

/** Fall mit Einrichtungsprofil. Der Fall selbst bleibt unverändert; Fall-Überschreibungen gehen vor. */
export function mitEinrichtung(fall: FallV2, p?: EinrichtungsProfil): FallV2 {
  if (!p) return fall;
  const ab = gueltig(p);
  const ueber: Befugnisabweichungen = {};
  for (const id of new Set([...Object.keys(ab), ...Object.keys(fall.befugnisUeberschreibung ?? {})])) {
    if (fall.massnahmenZusatz?.some((m) => m.id === id) && !fall.befugnisUeberschreibung?.[id]) continue; // fallspezifisch definiert
    const merged = { ...ab[id], ...fall.befugnisUeberschreibung?.[id] };
    if (Object.keys(merged).length) ueber[id] = merged;
  }
  return { ...fall, befugnisUeberschreibung: ueber };
}
