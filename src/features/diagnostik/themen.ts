// Lernplan-Themen je Diagnostik-Fall und je Kriterium (Audit SIM-05). Klein und ohne Falldaten,
// damit der Lernplan (trainer.ts) passende Fälle verlinken kann, ohne den Fallkatalog zu laden.

/** Krankheitsbild-Themen je Fall (Befundverständnis). */
export const FALL_THEMEN: Record<string, string[]> = {
  'sepsis-pneumonie': ['thema.kl.infektion', 'thema.kl.atmung'],
  lungenembolie: ['thema.kl.herz.pavk'],
  herzinsuffizienz: ['thema.kl.herz.insuffizienz'],
  pneumothorax: ['thema.kl.atmung'],
  ketoazidose: ['thema.kl.diabetes'],
  'asthma-kind': ['thema.kl.paediatrie', 'thema.kl.atmung'],
  'gastroenteritis-kind': ['thema.kl.paediatrie'],
  'gi-blutung': ['thema.kl.verdauung'],
  hyperkaliaemie: ['thema.kl.niere'],
  'akutes-nierenversagen': ['thema.kl.niere'],
};

/** Getrennt bewertete Kriterien eines Falls. */
export type KriteriumId = 'praeanalytik' | 'kritische-meldung' | 'sbar' | 'vorbereitung' | 'befundverstaendnis';

export const KRITERIUM_LABEL: Record<KriteriumId, string> = {
  praeanalytik: 'Präanalytik', 'kritische-meldung': 'Kritische Werte melden', sbar: 'SBAR-Übergabe',
  vorbereitung: 'Vorbereitung der Bildgebung', befundverstaendnis: 'Befundverständnis',
};

/** Thema je Kriterium; null = Thema des Falls (FALL_THEMEN). */
export const KRITERIUM_THEMA: Record<KriteriumId, string | null> = {
  praeanalytik: 'thema.ph.injektion', 'kritische-meldung': 'thema.pp.uebergabe', sbar: 'thema.pp.uebergabe',
  vorbereitung: 'thema.ph.periop', befundverstaendnis: null,
};

/** Diagnostik-Fälle zu einem Lernplan-Thema (für „Passende Übung“). */
export function diagnostikFaelleZuThema(topicId: string): string[] {
  return Object.entries(FALL_THEMEN).filter(([, t]) => t.includes(topicId)).map(([id]) => id);
}
