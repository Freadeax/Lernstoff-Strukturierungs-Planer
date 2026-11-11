// „Dein Auftrag“: vier Arbeitsschritte eines Falls (nach der Gestaltungsvorlage Praxissimulator),
// abgeleitet aus dem Spielstand. Rein und testbar; zeigt Orientierung, keine Bewertung.

import type { Session } from './types';

export type AuftragsSchritt = { id: 'blick' | 'handeln' | 'verlauf' | 'uebergabe'; titel: string; hinweis: string; erledigt: boolean };

/** Wahrnehmen statt Eingreifen: zählen zum ersten Blick. */
const BEOBACHTEN = new Set(['vitals', 'monitor', 'reassess', 'hygiene']);
const istBeobachtung = (id: string, kategorie?: string) => BEOBACHTEN.has(id) || kategorie === 'untersuchung' || kategorie === 'gespraech';

export function auftragsSchritte(s: Session): AuftragsSchritt[] {
  const kategorie = new Map(s.scenario.actions.map(a => [a.id, a.category as string]));
  const spur = s.trail ?? [];
  const beobachtet = s.measuredAt !== null || s.done.some(id => istBeobachtung(id, kategorie.get(id)));
  // Maßnahmen: Handlungen außerhalb von Untersuchung/Gespräch, Medikamente und Entscheidungen.
  const massnahmen = spur.filter(t => t.id.startsWith('med:') || t.id.startsWith('wahl:') || (kategorie.has(t.id) && !istBeobachtung(t.id, kategorie.get(t.id))));
  const gehandelt = massnahmen.length > 0 || s.done.some(id => id.startsWith('med:') || (kategorie.has(id) && !istBeobachtung(id, kategorie.get(id))));
  const erste = massnahmen.length ? Math.min(...massnahmen.map(t => t.at)) : Infinity;
  // Verlauf geprüft: nach der ersten Maßnahme erneut gemessen oder beurteilt, oder Monitoring läuft.
  const verlauf = gehandelt && (s.monitoring || spur.some(t => (t.id === 'vitals' || t.id === 'reassess') && t.at >= erste));
  const uebergabe = s.flags.documented !== undefined && s.flags.sbar !== undefined;
  return [
    { id: 'blick', titel: 'Erster Blick', hinweis: 'Patient ansehen, ansprechen, Vitalzeichen messen.', erledigt: beobachtet },
    { id: 'handeln', titel: 'Handlung auswählen', hinweis: 'Lagern, Hilfe holen, Anordnung einholen oder Medikation.', erledigt: gehandelt },
    { id: 'verlauf', titel: 'Verlauf prüfen', hinweis: 'Nach der Maßnahme erneut messen oder Monitoring anschließen.', erledigt: verlauf },
    { id: 'uebergabe', titel: 'Dokumentation und SBAR', hinweis: 'Pflegebericht schreiben und nach SBAR übergeben.', erledigt: uebergabe },
  ];
}
