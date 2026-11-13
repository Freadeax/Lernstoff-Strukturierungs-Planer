// Nach dem Fall: dieselbe Situation dokumentieren. Übergabe, Pflegebericht und Pflegeplanung
// übernehmen den gespielten Verlauf und erwarten nur, was wirklich passiert ist (siehe weitergabe.ts).
import type { Session } from './types';
import { weiterLink } from './weitergabe';

export function Weiterbearbeiten({ s }: { s: Session }) {
  if (s.phase !== 'finished') return null;
  return <div className="praxis-weiter praxis-doku">
    <h4>Diesen Fall dokumentieren</h4>
    <p className="muted">Die Trainer übernehmen deinen Verlauf: Werte, die du gemessen hast, was du getan hast und was noch aussteht. Geprüft wird nur, was in deinem Spiel vorkam.</p>
    <ul>
      <li><a href={weiterLink('uebergabe', s)}>Übergabe an den Folgedienst</a><span className="praxis-weiter__links">SBAR am Bett, mit Prüfung</span></li>
      <li><a href={weiterLink('bericht', s)}>Pflegebericht schreiben</a><span className="praxis-weiter__links">Beobachtung, Maßnahme, Wirkung</span></li>
      <li><a href={weiterLink('pflegeplanung', s)}>Pflegeplanung zu diesem Fall</a><span className="praxis-weiter__links">als eigener Fall</span></li>
    </ul>
  </div>;
}
