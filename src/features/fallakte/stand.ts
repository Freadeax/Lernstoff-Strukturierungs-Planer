// Stand einer Fallakte: liest die Bestwerte, die die Trainer ohnehin je Fall speichern.
// Keine eigene Speicherung, damit Fallakte und Trainer nie auseinanderlaufen.
import { storage } from '../../ui/lib/store';
import type { AktenSchritt, Fallakte, SchrittArt } from './typen';

/** Speicherorte der Trainer (siehe jeweilige *Trainer.tsx): Bestwert in Prozent je Fall-ID. */
export const BESTE_KEYS: Record<Exclude<SchrittArt, 'assessment'>, string> = {
  sis: 'lernstoff.sis.beste',
  pflegeplanung: 'lernstoff.pflegeplanung.beste',
  bericht: 'lernstoff.bericht.beste',
  uebergabe: 'lernstoff.uebergabe.beste',
};
/** Assessment speichert je Vignette { datum, prozent }. */
export const ASSESSMENT_KEY = 'lernstoff.assessment.erledigt';

/** Ab hier gilt ein Schritt als gut gelöst (wie die grüne Stufe in den Trainern). */
export const GUT_AB = 85;

export type Leser = (key: string) => Record<string, unknown>;
const ausSpeicher: Leser = (key) => storage.read<Record<string, unknown>>(key, {});

/** Bestes Ergebnis eines Schritts in Prozent, undefined = noch nicht geprüft. */
export function schrittProzent(s: AktenSchritt, lies: Leser = ausSpeicher): number | undefined {
  const wert = s.art === 'assessment' ? (lies(ASSESSMENT_KEY)[s.fallId] as { prozent?: unknown } | undefined)?.prozent : lies(BESTE_KEYS[s.art])[s.fallId];
  return typeof wert === 'number' && Number.isFinite(wert) ? Math.max(0, Math.min(100, Math.round(wert))) : undefined;
}

export interface AktenStand {
  prozente: (number | undefined)[];
  bearbeitet: number;
  gut: number;
  /** Erster Schritt ohne Ergebnis, sonst der erste unter GUT_AB, sonst undefined (alles gut). */
  naechster?: AktenSchritt;
  /** Mittel über alle Schritte, nicht bearbeitete zählen 0. */
  gesamt: number;
}

export function aktenStand(akte: Fallakte, lies: Leser = ausSpeicher): AktenStand {
  const prozente = akte.schritte.map((s) => schrittProzent(s, lies));
  const offen = akte.schritte.find((_, i) => prozente[i] === undefined);
  const schwach = akte.schritte.find((_, i) => (prozente[i] ?? 0) < GUT_AB);
  return {
    prozente,
    bearbeitet: prozente.filter((p) => p !== undefined).length,
    gut: prozente.filter((p) => p !== undefined && p >= GUT_AB).length,
    naechster: offen ?? schwach,
    gesamt: Math.round(prozente.reduce<number>((s, p) => s + (p ?? 0), 0) / akte.schritte.length),
  };
}
