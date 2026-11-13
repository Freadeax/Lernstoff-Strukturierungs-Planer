// Einheitliche Auswertung (siehe auswertung.ts): Ergebnis, Entscheidungen mit Begründung, Merksätze.
// Farbe nie allein: Jeder Punkt trägt Zeichen und Wort (✓ Gut, ◐ Teilweise, ✗ Verbessern).

import { ERGEBNIS_LABEL, kurzfassung, sortierePunkte, URTEIL_LABEL, URTEIL_ZEICHEN, zaehle, type SimAuswertung } from './auswertung';
import './auswertung.css';

export function AuswertungsKarte({ a, titel = 'Auf einen Blick' }: { a: SimAuswertung; titel?: string }) {
  const z = zaehle(a);
  const punkte = sortierePunkte(a.punkte);
  return <section className={`sim-auswertung is-${a.ergebnis.stufe}`} aria-label={`Auswertung ${a.quelle}`}>
    <header className="sim-auswertung__kopf">
      <span className="eyebrow">{a.quelle} · Auswertung</span>
      <h3>{titel}</h3>
      <p className="sim-auswertung__ergebnis"><strong>{ERGEBNIS_LABEL[a.ergebnis.stufe]}.</strong> {a.ergebnis.text}</p>
      <p className="sim-auswertung__zahlen" aria-label={kurzfassung(a)}>
        <span className="is-gut">{URTEIL_ZEICHEN.gut} {z.gut} gut</span>
        {z.teilweise > 0 && <span className="is-teilweise">{URTEIL_ZEICHEN.teilweise} {z.teilweise} teilweise</span>}
        <span className="is-fehler">{URTEIL_ZEICHEN.fehler} {z.fehler} zu verbessern</span>
      </p>
    </header>
    {punkte.length > 0 && <ol className="sim-auswertung__punkte">
      {punkte.map((p) => <li key={p.id} className={`is-${p.urteil}`}>
        <span className="sim-auswertung__marke" aria-hidden="true">{URTEIL_ZEICHEN[p.urteil]}</span>
        <div>
          <p className="sim-auswertung__titel"><strong>{p.titel}</strong> <span className="sim-auswertung__urteil">{URTEIL_LABEL[p.urteil]}</span>{p.wann && <span className="muted"> · {p.wann}</span>}</p>
          {p.deine && <p><span className="muted">Du:</span> {p.deine}</p>}
          {p.besser && <p><span className="muted">Besser:</span> {p.besser}</p>}
          <p className="sim-auswertung__warum"><span className="muted">Warum:</span> {p.warum}</p>
        </div>
      </li>)}
    </ol>}
    {a.merksaetze.length > 0 && <div className="sim-auswertung__merk"><h4>Zum Mitnehmen</h4><ul>{a.merksaetze.map((m) => <li key={m}>{m}</li>)}</ul></div>}
    {a.grenzen && <p className="muted sim-auswertung__grenzen">{a.grenzen}</p>}
  </section>;
}
