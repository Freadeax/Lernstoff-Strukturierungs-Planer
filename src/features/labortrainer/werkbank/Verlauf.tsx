// Kumulativbefund lesen: Welcher Wert trägt die Botschaft? Nach der Antwort zeichnet sich der
// Verlauf als Kurve mit Referenzband (animiert, bei „Bewegung reduzieren“ sofort vollständig).

import { useMemo, useState } from 'react';
import { LaborTafel, type LaborReihen } from '../../../ui/sim/labor/LaborTafel';
import { formatWert, parameter, referenz } from '../../../ui/sim/labor/parameter';
import { wenigBewegung } from '../../../ui/shell/session';
import { VERLAEUFE, type VerlaufSzenario } from './verlauf';

export function Verlauf() {
  const [i, setI] = useState(0);
  const sz = VERLAEUFE[i]!;
  return <VerlaufLauf key={sz.id} sz={sz} weiter={() => setI((i + 1) % VERLAEUFE.length)} nr={i + 1} />;
}

function VerlaufLauf({ sz, weiter, nr }: { sz: VerlaufSzenario; weiter: () => void; nr: number }) {
  const [wahl, setWahl] = useState<string>();
  const [handeln, setHandeln] = useState<number>();
  const reihen: LaborReihen = useMemo(() => Object.fromEntries(Object.entries(sz.werte).map(([id, w]) => [id, w.map((wert, k) => ({ minute: sz.zeiten[k]!, wert }))])), [sz]);
  const optionen = useMemo(() => {
    // feste, aber nicht immer gleiche Reihenfolge der Handlungsoptionen
    const o = sz.handeln.optionen.map((x, k) => ({ ...x, richtig: k === 0 }));
    return o.sort((a, b) => (a.text.length % 3) - (b.text.length % 3));
  }, [sz]);
  const ids = Object.keys(sz.werte);
  return (
    <section className="card wb-station" aria-labelledby="wb-verlauf">
      <div className="wb-kopf">
        <h3 id="wb-verlauf">Kumulativbefund lesen</h3>
        <span className="muted wb-klein">Fall {nr} von {VERLAEUFE.length}</span>
      </div>
      <p><strong>{sz.titel}.</strong> {sz.kontext}</p>
      <LaborTafel reihen={reihen} geschlecht={sz.geschlecht} startzeit="08:00" />
      <p>Welcher Wert macht dir am meisten Sorgen?</p>
      <div className="wb-knoepfe" role="group" aria-label="Wert wählen">
        {ids.map((id) => (
          <button key={id} type="button" disabled={!!wahl} aria-pressed={wahl === id}
            className={wahl ? (id === sz.gesucht ? 'is-richtig' : id === wahl ? 'is-falsch' : '') : ''}
            onClick={() => setWahl(id)}>{parameter(id).name}</button>
        ))}
      </div>
      {wahl && (
        <div className="wb-feld" aria-live="polite">
          <p className={wahl === sz.gesucht ? 'wb-gut' : 'wb-hinweis'}>{wahl === sz.gesucht ? 'Richtig. ' : `Nicht ganz: entscheidend ist ${parameter(sz.gesucht).name}. `}{sz.warum}</p>
          <Kurve id={sz.gesucht} werte={sz.werte[sz.gesucht]!} zeiten={sz.zeiten} geschlecht={sz.geschlecht} />
          <p>{sz.handeln.frage}</p>
          <div className="wb-optionen">
            {optionen.map((o, k) => (
              <button key={o.text} type="button" disabled={handeln !== undefined} className={handeln !== undefined ? (o.richtig ? 'is-richtig' : k === handeln ? 'is-falsch' : '') : ''} onClick={() => setHandeln(k)}>
                {o.text}
                {handeln !== undefined && (o.richtig || k === handeln) && <span className="wb-warum">{o.warum}</span>}
              </button>
            ))}
          </div>
          {handeln !== undefined && <button type="button" className="primary" onClick={weiter}>Nächster Verlauf</button>}
        </div>
      )}
    </section>
  );
}

/** Verlaufskurve eines Parameters mit Referenzband; die Linie zeichnet sich einmal von links nach rechts. */
export function Kurve({ id, werte, zeiten, geschlecht }: { id: string; werte: number[]; zeiten: number[]; geschlecht: 'w' | 'm' }) {
  const p = parameter(id);
  const r = referenz(p, geschlecht);
  const W = 320, H = 150, L = 44, R = 24, O = 14, U = 26;
  const alle = [...werte, ...(r.min !== undefined ? [r.min] : []), ...(r.max !== undefined ? [r.max] : [])];
  const lo = Math.min(...alle), hi = Math.max(...alle), pad = (hi - lo) * 0.12 || 1;
  const y = (v: number) => O + (1 - (v - (lo - pad)) / (hi - lo + 2 * pad)) * (H - O - U);
  const t0 = zeiten[0]!, t1 = zeiten[zeiten.length - 1]!;
  const x = (t: number) => L + ((t - t0) / (t1 - t0 || 1)) * (W - L - R);
  const pfad = werte.map((v, k) => `${k ? 'L' : 'M'}${x(zeiten[k]!).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const ruhig = wenigBewegung();
  const tag = (t: number) => (t === 0 ? 'heute' : `${Math.round(t / 1440)} d`);
  return (
    <figure className="wb-kurve">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${p.name}: ${werte.map((v) => formatWert(p, v)).join(', ')} ${p.einheit}`}>
        {(r.min !== undefined || r.max !== undefined) && (
          <rect x={L} width={W - L - R} y={y(r.max ?? hi + pad)} height={Math.max(0, y(r.min ?? lo - pad) - y(r.max ?? hi + pad))} className="wb-kurve__band" />
        )}
        <line x1={L} x2={L} y1={O} y2={H - U} className="wb-kurve__achse" />
        <line x1={L} x2={W - R} y1={H - U} y2={H - U} className="wb-kurve__achse" />
        {zeiten.map((t) => <text key={t} x={x(t)} y={H - 8} textAnchor="middle" className="wb-kurve__text">{tag(t)}</text>)}
        <text x={L - 6} y={y(hi) + 4} textAnchor="end" className="wb-kurve__text">{formatWert(p, hi)}</text>
        <text x={L - 6} y={y(lo) + 4} textAnchor="end" className="wb-kurve__text">{formatWert(p, lo)}</text>
        <path d={pfad} className={`wb-kurve__linie ${ruhig ? '' : 'is-zeichnen'}`} pathLength={1} />
        {werte.map((v, k) => <circle key={k} cx={x(zeiten[k]!)} cy={y(v)} r={3.5} className="wb-kurve__punkt" style={{ animationDelay: ruhig ? undefined : `${(k / Math.max(1, werte.length - 1)) * 1.1}s` }} />)}
      </svg>
      <figcaption className="muted wb-klein">{p.name} ({p.einheit || 'ohne Einheit'}), grün hinterlegt: Referenzbereich</figcaption>
    </figure>
  );
}
