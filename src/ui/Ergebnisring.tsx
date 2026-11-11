import './ergebnisring.css';

/**
 * Ergebnisring für Auswertungen (Übungstrainer, Karteikarten, Prüfungen): zeichnet sich bis zum Prozentwert.
 * Bei reduzierter Bewegung steht er sofort fertig da. Farbe ab 80 % gut, ab 50 % mittel, sonst schwach.
 */
export function Ergebnisring({ prozent, label }: { prozent: number; label?: string }) {
  const p = Math.max(0, Math.min(100, Math.round(prozent)));
  return (
    <svg className="ergebnisring" viewBox="0 0 120 120" role="img" aria-label={label ?? `${p} Prozent richtig`}>
      <circle className="ergebnisring__spur" cx="60" cy="60" r="50" pathLength={100} />
      <circle className={`ergebnisring__wert ${p >= 80 ? 'is-gut' : p >= 50 ? 'is-mittel' : 'is-schwach'}`} cx="60" cy="60" r="50" pathLength={100} strokeDasharray={`${p} 100`} />
      <text x="60" y="60" dy="0.35em" textAnchor="middle">{p} %</text>
    </svg>
  );
}
