// Welche Simulationsfälle ein Krankheitsbild zeigen. Von Hand gepflegt statt aus Themen
// abgeleitet: Über breite Themen wie Vitalzeichen würde sonst jede Hypertonie zur Nachblutung passen.
// Nur Fälle, in denen die Krankheit tatsächlich vorkommt (Vorgeschichte oder Kernproblem).
// Test prüft, dass alle Fall- und Steckbrief-IDs existieren.

/** Praxissimulator (offline, Fälle auf dem neuen Kern): Fall-ID → Krankheitsbild-IDs (kh.*). Seit P10 nur noch neue Fälle. */
export const PRAXIS_KRANKHEITEN: Record<string, string[]> = {
  'amb-sturz-exsikkose': ['kh.exsikkose', 'kh.herzinsuffizienz'],
  'amb-hausbesuch-still': ['kh.exsikkose', 'kh.arthrose'],
  'amb-herzschwaeche': ['kh.herzinsuffizienz', 'kh.niereninsuffizienz'],
  'amb-hypoglykaemie': ['kh.diabetes-typ2'],
  'lz-unterzucker-mittag': ['kh.diabetes-typ2'],
  'kh-pneumonie-sepsis': ['kh.pneumonie', 'kh.sepsis'],
  'sr-septischer-schock': ['kh.sepsis', 'kh.hwi'],
  'kh-erster-tag': ['kh.hwi'],
  'na-acs-brustschmerz': ['kh.herzinfarkt', 'kh.hypertonie'],
  'kh-reanimation-bls': ['kh.herzinfarkt'],
  'kh-medikationsverwechslung': ['kh.herzinsuffizienz'],
  'paed-gastroenteritis-kleinkind': ['kh.gastroenteritis', 'kh.exsikkose'],
  'paed-fieberkrampf': ['kh.fieberkrampf'],
  'kh-reha-erster-weg': ['kh.arthrose'],
  'lz-schlaganfall-akut': ['kh.schlaganfall'],
  'lz-schlaganfall-reha': ['kh.schlaganfall'],
  'kh-lungenembolie': ['kh.lungenembolie', 'kh.tvt'],
  'kh-delir-nacht': ['kh.delir', 'kh.femurfraktur'],
  'paed-asthma-schulkind': ['kh.asthma'],
  'lz-demenz-aspiration': ['kh.demenz', 'kh.pneumonie'],
  'lz-demenz-schmerz': ['kh.demenz'],
  'lz-dekubitus-immobil': ['kh.dekubitus', 'kh.demenz'],
  'paed-bronchiolitis-saeugling': ['kh.bronchiolitis'],
  'paed-rausch-jugendliche': ['kh.alkohol'],
  'kh-alkoholentzug': ['kh.alkohol'],
  'its-beatmung-alarm': ['kh.copd'],
  'lz-palliativ-gespraech': ['kh.mammakarzinom'],
  'psy-panik-suizidalitaet': ['kh.depression', 'kh.angststoerung'],
  'psy-unruhe-deeskalation': ['kh.schizophrenie'],
};

/** KI-Fallsimulator: Szenario-ID → Krankheitsbild-IDs. */
export const KI_KRANKHEITEN: Record<string, string[]> = {
  herzinsuffizienz: ['kh.herzinsuffizienz'],
  'hueft-tep': ['kh.femurfraktur', 'kh.delir', 'kh.exsikkose'],
  hypoglykaemie: ['kh.diabetes-typ2'],
  pneumonie: ['kh.pneumonie'],
  schlaganfall: ['kh.schlaganfall'],
  dekubitus: ['kh.dekubitus'],
  fieberkrampf: ['kh.fieberkrampf'],
  sepsis: ['kh.sepsis'],
  copd: ['kh.copd'],
  lungenembolie: ['kh.lungenembolie', 'kh.tvt'],
  'delir-nacht': ['kh.delir'],
  'asthma-kind': ['kh.asthma'],
  'demenz-verfuegung': ['kh.demenz'],
};

/** Fall-IDs, die ein Krankheitsbild zeigen, in der Reihenfolge der Zuordnung. */
export function faelleZuKrankheit(zuordnung: Record<string, string[]>, krankheitId: string): string[] {
  return Object.entries(zuordnung).filter(([, kh]) => kh.includes(krankheitId)).map(([id]) => id);
}

/** Krankheitsbilder eines Falls (leer, wenn nicht zugeordnet). */
export function krankheitenZuFall(zuordnung: Record<string, string[]>, fallId: string): string[] {
  return zuordnung[fallId] ?? [];
}
