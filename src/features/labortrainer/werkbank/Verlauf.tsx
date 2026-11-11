// Kumulativbefund lesen: Welcher Wert trägt die Botschaft? Nach der Antwort zeichnet sich der
// Verlauf als Kurve mit Referenzband (animiert, bei „Bewegung reduzieren“ sofort vollständig).

import { useMemo, useState } from 'react';
import { LaborTafel, type LaborReihen } from '../../../ui/sim/labor/LaborTafel';
import { formatWert, parameter, referenz } from '../../../ui/sim/labor/parameter';
import { VerlaufKurve } from '../../../ui/sim/labor/VerlaufKurve';
import { VERLAEUFE, type VerlaufSzenario } from './verlauf';
import { bucheWerkbank, neueLaufId, werkbankThema } from './lernplan';

export function Verlauf() {
  const [i, setI] = useState(0);
  const sz = VERLAEUFE[i]!;
  return <VerlaufLauf key={sz.id} sz={sz} weiter={() => setI((i + 1) % VERLAEUFE.length)} nr={i + 1} />;
}

function VerlaufLauf({ sz, weiter, nr }: { sz: VerlaufSzenario; weiter: () => void; nr: number }) {
  const [wahl, setWahl] = useState<string>();
  const [handeln, setHandeln] = useState<number>();
  const [laufId] = useState(neueLaufId);
  const [buchung, setBuchung] = useState<string>();
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
              <button key={o.text} type="button" disabled={handeln !== undefined} className={handeln !== undefined ? (o.richtig ? 'is-richtig' : k === handeln ? 'is-falsch' : '') : ''} onClick={() => {
                setHandeln(k);
                const wertOk = wahl === sz.gesucht;
                void bucheWerkbank({ station: 'verlauf', szenario: sz.id, lauf: laufId, topicId: werkbankThema('verlauf', sz.gesucht), punkte: (wertOk ? 1 : 0) + (o.richtig ? 1 : 0), max: 2,
                  kriterien: [{ id: 'trend', label: 'Entscheidenden Wert erkannt', erfuellt: wertOk }, { id: 'handeln', label: 'Richtig gehandelt', erfuellt: o.richtig }] }).then(setBuchung);
              }}>
                {o.text}
                {handeln !== undefined && (o.richtig || k === handeln) && <span className="wb-warum">{o.warum}</span>}
              </button>
            ))}
          </div>
          {buchung && <p className="muted wb-klein">Lernplan: {buchung}</p>}
          {handeln !== undefined && <button type="button" className="primary" onClick={weiter}>Nächster Verlauf</button>}
        </div>
      )}
    </section>
  );
}

/** Verlaufskurve eines Laborparameters (gemeinsamer Baustein VerlaufKurve). */
export function Kurve({ id, werte, zeiten, geschlecht }: { id: string; werte: number[]; zeiten: number[]; geschlecht: 'w' | 'm' }) {
  const p = parameter(id);
  return <VerlaufKurve name={p.name} einheit={p.einheit} punkte={werte.map((wert, k) => ({ minute: zeiten[k]!, wert }))} band={referenz(p, geschlecht)} format={(v) => formatWert(p, v)} zeitText={(t) => (t === 0 ? 'heute' : `${Math.round(t / 1440)} d`)} />;
}
