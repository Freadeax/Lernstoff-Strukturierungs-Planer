// Praxissimulator neu – Verlauf sichtbar machen (P12): Blatt mit Verlaufskurve und Journal.
// Aufruf aus der Werteleiste („Verlauf“); auf dem iPhone als Vollbild-Blatt, breit als großer Dialog.
// Nur Anzeige: Daten kommen aus kurve/kurvendaten.ts und journal.ts (rein, über den Kern).

import { useEffect, useMemo, useRef, useState } from 'react';
import type { SimZustand } from '../kern/kern';
import type { KurvenWert } from '../kern/typen';
import { uhrzeit } from './ansicht';
import { filtere, journal, JOURNAL_FILTER, type JournalEintrag, type JournalFilter } from './journal';
import { kurvendaten, type Vergleich } from './kurve/kurvendaten';
import { Kurvenblatt } from './kurve/Kurvenblatt';

const SYMBOL: Record<JournalEintrag['art'], string> = {
  handlung: '▸', befund: '🔎', gespraech: '💬', arzt: '🩺', pa: '🧑‍🏫', nachricht: '✉', verlauf: '👁', ereignis: '⚡', alarm: '🔔', hinweis: 'ℹ', doku: '📝', fehler: '⚠', ende: '■',
};
const ART_TEXT: Record<JournalEintrag['art'], string> = {
  handlung: 'Du', befund: 'Befund', gespraech: 'Antwort', arzt: 'Ärztin/Arzt', pa: 'Praxisanleitung', nachricht: 'Nachricht', verlauf: 'Beobachtung',
  ereignis: 'Ereignis', alarm: 'Alarm', hinweis: 'Hinweis', doku: 'Dokumentation', fehler: 'Folge', ende: 'Ende',
};
const GROESSE: Record<KurvenWert, string> = {
  rrSys: 'RR', rrDia: 'RR diast.', hf: 'Puls', af: 'AF', spo2: 'SpO₂', temp: 'Temp', bz: 'BZ', schmerz: 'Schmerz', gewicht: 'Gewicht',
};

const zahl = (k: KurvenWert, n: number) => n.toLocaleString('de-DE', { minimumFractionDigits: k === 'temp' ? 1 : 0, maximumFractionDigits: k === 'temp' ? 1 : 0 });
const wert = (k: KurvenWert, w: { wert: number; wert2?: number }) => (k === 'rrSys' && w.wert2 !== undefined ? `${zahl(k, w.wert)}/${zahl(k, w.wert2)}` : zahl(k, w.wert));

export function VergleichZeile({ v, start }: { v: readonly Vergleich[]; start: string }) {
  return <p className="vl-vergleich">
    <span className="vl-vergleich__titel">Vorher → nachher:</span>{' '}
    {v.map((x, i) => {
      const d = x.nachher.wert - x.vorher.wert;
      const richtung = Math.abs(d) < (x.groesse === 'temp' ? 0.2 : 2) ? '≈' : d > 0 ? '↑' : '↓';
      return <span key={x.groesse} className="vl-vergleich__wert">{i > 0 && ' · '}{GROESSE[x.groesse]} {wert(x.groesse, x.vorher)} → <strong>{wert(x.groesse, x.nachher)}</strong> <span aria-hidden="true">{richtung}</span>
        <span className="muted"> ({uhrzeit(start, x.vorher.t)} / {uhrzeit(start, x.nachher.t)})</span></span>;
    })}
  </p>;
}

export function Journal({ eintraege, start, kompakt }: { eintraege: readonly JournalEintrag[]; start: string; kompakt?: boolean }) {
  if (!eintraege.length) return <p className="muted">Noch nichts passiert.</p>;
  return <ol className={`vl-journal${kompakt ? ' is-kompakt' : ''}`}>
    {eintraege.map((e, i) => <li key={`${e.t}-${e.n}-${i}`} className={`is-${e.art}${e.wichtig ? ' is-wichtig' : ''}`}>
      <time>{uhrzeit(start, e.t)}</time>
      <span className="vl-journal__symbol" aria-hidden="true">{SYMBOL[e.art]}</span>
      <div className="vl-journal__text">
        <span className="visually-hidden">{ART_TEXT[e.art]}: </span>{e.text}
        {e.vergleich && !kompakt && <VergleichZeile v={e.vergleich} start={start} />}
      </div>
    </li>)}
  </ol>;
}

/** Vollbild-Blatt (iPhone) bzw. großer Dialog (breit) mit Kurve und Journal. */
export function VerlaufBlatt({ z, onSchliessen }: { z: SimZustand; onSchliessen: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [filter, setFilter] = useState<JournalFilter>('alle');
  const [neueste, setNeueste] = useState(true);
  const start = z.fall.startUhrzeit;
  const daten = useMemo(() => kurvendaten(z), [z]);
  const liste = useMemo(() => journal(z, daten), [z, daten]);
  const gefiltert = filtere(liste, filter);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) { try { d.showModal(); } catch { d.setAttribute('open', ''); } }
    return () => { if (d?.open) d.close(); };
  }, []);
  return <dialog ref={ref} className="vl-blatt" aria-labelledby="vl-titel" onClose={onSchliessen} onCancel={onSchliessen}>
    <header className="vl-blatt__kopf">
      <h2 id="vl-titel">Verlauf · {z.fall.person.name}</h2>
      <span className="vl-blatt__zeit">{uhrzeit(start, z.t)}</span>
      <button type="button" onClick={() => ref.current?.close()}>Schließen</button>
    </header>
    <p className="muted vl-blatt__hinweis">Die Uhr steht, solange der Verlauf offen ist. Nur was du gemessen, gesehen oder gehört hast. Lernmodell: Werte und Verlauf sind vereinfacht.</p>
    <section aria-labelledby="vl-kurve">
      <h3 id="vl-kurve">Kurve</h3>
      <Kurvenblatt daten={daten} startUhrzeit={start} titel={`Verlaufskurve ${z.fall.person.name}`} />
    </section>
    <section aria-labelledby="vl-journal">
      <div className="vl-journal__kopf">
        <h3 id="vl-journal">Was ist passiert</h3>
        <button type="button" className="small ghost" onClick={() => setNeueste((n) => !n)}>{neueste ? 'Älteste zuerst' : 'Neueste zuerst'}</button>
      </div>
      <div className="vl-filter" role="group" aria-label="Filter">
        {JOURNAL_FILTER.map((f) => <button key={f.id} type="button" className="small" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
          {f.text} <span className="vl-filter__zahl">{filtere(liste, f.id).length}</span>
        </button>)}
      </div>
      <Journal eintraege={neueste ? [...gefiltert].reverse() : gefiltert} start={start} />
    </section>
  </dialog>;
}
