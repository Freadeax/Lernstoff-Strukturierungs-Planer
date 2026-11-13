// Welche Simulationsfälle ein Krankheitsbild zeigen. Von Hand gepflegt statt aus Themen
// abgeleitet: Über breite Themen wie Vitalzeichen würde sonst jede Hypertonie zur Nachblutung passen.
// Nur Fälle, in denen die Krankheit tatsächlich vorkommt (Vorgeschichte oder Kernproblem).
// Test prüft, dass alle Fall- und Steckbrief-IDs existieren.

/** Praxissimulator (offline): Fall-ID → Krankheitsbild-IDs (kh.*). */
export const PRAXIS_KRANKHEITEN: Record<string, string[]> = {
  hausbesuch: ['kh.exsikkose'],
  pflegeheim: ['kh.diabetes-typ2'],
  nachtwache: ['kh.herzinsuffizienz'],
  zna: ['kh.herzinfarkt', 'kh.hypertonie'],
  kind: ['kh.gastroenteritis', 'kh.exsikkose'],
  reha: ['kh.schlaganfall'],
  sepsis: ['kh.sepsis', 'kh.hwi'],
  schlaganfall: ['kh.schlaganfall'],
  lungenembolie: ['kh.lungenembolie', 'kh.tvt'],
  delir: ['kh.delir'],
  asthma: ['kh.asthma'],
  demenz: ['kh.demenz', 'kh.pneumonie'],
  bronchiolitis: ['kh.bronchiolitis'],
  herzschwaeche: ['kh.herzinsuffizienz'],
  rausch: ['kh.alkohol'],
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
