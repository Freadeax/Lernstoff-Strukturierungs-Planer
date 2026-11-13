// „Alle Wege dieses Falls“: nach einem Probefall jede besuchte Szene mit allen Möglichkeiten,
// deiner Wahl, ihrer Bewertung und dem Hinweis, welche Entscheidung den Fall in eine andere
// Richtung geführt hätte. Darüber eine Karte: Hauptlinie mit Abzweigen, dein Weg hervorgehoben.

import { probefallVon, probeWeg, type Probefall } from './demo';
import { WERTUNG_LABEL, type Fall } from './simulator';

export interface KartenKnoten { id: string; uhrzeit: string; besucht: boolean; abzweige: Array<{ id: string; uhrzeit: string; besucht: boolean }> }

/** Hauptlinie mit den Abzweigen, die von ihren Etappen ausgehen. */
export function wegeKarte(p: Probefall, besucht: Set<string>): KartenKnoten[] {
  return p.reihe.map((id) => {
    const e = p.etappen[id]!;
    const ziele = [...new Set(e.optionen.flatMap((o) => (o.weiter ? [o.weiter] : [])))];
    return {
      id, uhrzeit: e.uhrzeit, besucht: besucht.has(id),
      abzweige: ziele.map((z) => ({ id: z, uhrzeit: p.etappen[z]!.uhrzeit, besucht: besucht.has(z) })),
    };
  });
}

export function Entscheidungswege({ fall }: { fall: Fall }) {
  const p = probefallVon(fall);
  if (!p) return null;
  const weg = probeWeg(p, fall.runden.slice(1).map((r) => r.eingabe)).filter((w) => w.option);
  if (!weg.length) return null;
  const besucht = new Set(weg.map((w) => w.id));
  const karte = wegeKarte(p, besucht);
  const nummer = new Map(karte.map((k, i) => [k.id, i + 1]));
  return (
    <section className="fall__wege" aria-labelledby="fall-wege-titel">
      <h4 id="fall-wege-titel">Alle Wege dieses Falls</h4>
      <p className="muted">Jede Szene mit allen Möglichkeiten. Deine Wahl ist markiert. „Führt in eine Wendung“ heißt: Diese Entscheidung hätte den Fall in eine schwierigere Richtung gelenkt.</p>
      <ol className="fall__wege-karte" aria-label="Verlauf des Falls">
        {karte.map((k, i) => (
          <li key={k.id}>
            <span className={`fall__wege-knoten ${k.besucht ? 'is-besucht' : ''}`}>Szene {i + 1} · {k.uhrzeit}</span>
            {k.abzweige.map((a) => (
              <span key={a.id} className={`fall__wege-knoten is-abzweig ${a.besucht ? 'is-besucht' : ''}`}>↳ Wendung · {a.uhrzeit}{a.besucht ? ' (dein Weg)' : ''}</span>
            ))}
          </li>
        ))}
      </ol>
      <ol className="fall__wege-liste">
        {weg.map((w) => {
          const e = p.etappen[w.id]!;
          const nr = nummer.get(w.id);
          return (
            <li key={w.id}>
              <details open={w.option!.wertung !== 'gut'}>
                <summary>
                  {nr ? `Szene ${nr}` : 'Wendung'} · {e.uhrzeit} Uhr · deine Wahl: <strong>{WERTUNG_LABEL[w.option!.wertung]}</strong>
                </summary>
                <p className="fall__wege-situation">{e.situation}</p>
                <ul>
                  {e.optionen.map((o) => (
                    <li key={o.text} className={`fall__rb-wertung fall__rb-wertung--${o.wertung} ${o === w.option ? 'is-gewaehlt' : ''}`}>
                      <p>
                        <strong>{WERTUNG_LABEL[o.wertung]}</strong>
                        {o === w.option && <span className="badge fall__wege-marke">Deine Wahl</span>}
                        {o.weiter && <span className="badge">führt in eine Wendung</span>}
                      </p>
                      <p>{o.text}</p>
                      <p className="muted">{o.rueck}</p>
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
