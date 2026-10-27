// NEWS2 (Royal College of Physicians 2017, SpO₂-Skala 1) als reine Rechnung.
// Der Text-Fallsimulator und der Praxissimulator nutzen dieselbe Punktetabelle.

export type Avpu = 'A' | 'C' | 'V' | 'P' | 'U';
export const AVPU: readonly Avpu[] = ['A', 'C', 'V', 'P', 'U'];
export const AVPU_LABEL: Record<Avpu, string> = { A: 'wach', C: 'neu verwirrt', V: 'reagiert auf Ansprache', P: 'reagiert auf Schmerz', U: 'reaktionslos' };
export type News2Risiko = 'niedrig' | 'niedrig-mittel' | 'mittel' | 'hoch';
export const NEWS2_QUELLE = { title: 'Royal College of Physicians · NEWS2', url: 'https://www.rcp.ac.uk/improving-care/resources/national-early-warning-score-news-2/' };

export interface News2Werte { af: number; spo2: number; sauerstoff: boolean; sys: number; puls: number; avpu: Avpu; temp: number }

export function news2Punkte(w: News2Werte): { punkte: number; risiko: News2Risiko; teil: number[] } {
  const teil = [
    w.af <= 8 ? 3 : w.af <= 11 ? 1 : w.af <= 20 ? 0 : w.af <= 24 ? 2 : 3,
    w.spo2 <= 91 ? 3 : w.spo2 <= 93 ? 2 : w.spo2 <= 95 ? 1 : 0,
    w.sauerstoff ? 2 : 0,
    w.sys <= 90 ? 3 : w.sys <= 100 ? 2 : w.sys <= 110 ? 1 : w.sys <= 219 ? 0 : 3,
    w.puls <= 40 ? 3 : w.puls <= 50 ? 1 : w.puls <= 90 ? 0 : w.puls <= 110 ? 1 : w.puls <= 130 ? 2 : 3,
    w.avpu === 'A' ? 0 : 3,
    w.temp <= 35 ? 3 : w.temp <= 36 ? 1 : w.temp <= 38 ? 0 : w.temp <= 39 ? 1 : 2,
  ];
  const punkte = teil.reduce((a, b) => a + b, 0);
  const risiko: News2Risiko = punkte >= 7 ? 'hoch' : punkte >= 5 ? 'mittel' : teil.includes(3) ? 'niedrig-mittel' : 'niedrig';
  return { punkte, risiko, teil };
}

/** Übliche Reaktion je Risikostufe (RCP-Empfehlung, lokale Eskalationsregeln gehen vor). */
export const NEWS2_REAKTION: Record<News2Risiko, string> = {
  niedrig: 'Beobachtung nach Plan fortsetzen.',
  'niedrig-mittel': 'Ein Einzelwert mit 3 Punkten: zeitnah ärztlich beurteilen lassen.',
  mittel: 'Dringende ärztliche Beurteilung, Messintervall mindestens stündlich.',
  hoch: 'Notfallreaktion: sofort qualifiziertes Team hinzuziehen, kontinuierlich überwachen.',
};
