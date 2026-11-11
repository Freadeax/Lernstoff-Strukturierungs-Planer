// Röntgen-Thorax systematisch befunden: Schritt für Schritt (Technik, A bis E, Gesamtbild).
// Der Betrachter betont den Bereich des aktuellen Schritts, beim Herz wird selbst gemessen.

import { useMemo, useState } from 'react';
import { BildBetrachter, type Gemessen } from '../../ui/sim/bildgebung/BildBetrachter';
import { befundSchritte, htqBewertung } from '../../ui/sim/bildgebung/befundung';
import { herzThoraxQuotient } from '../../ui/sim/bildgebung/messen';
import type { RoentgenVariante } from '../../ui/sim/bildgebung/phantom';
import type { Bildserie } from '../../ui/sim/bildgebung/serie';

// Reihenfolge gemischt, damit der Name nicht die Lösung verrät
const BILDER: { nr: number; variante: RoentgenVariante }[] = [
  { nr: 1, variante: 'pneumonie' }, { nr: 2, variante: 'stauung' }, { nr: 3, variante: 'normal' }, { nr: 4, variante: 'pneumothorax' },
];
const serieFuer = (v: RoentgenVariante, nr: number): Bildserie => ({
  id: `befundung-${v}`, titel: `Übungsbild ${nr}`, untersuchung: `Röntgen-Thorax p.a., Übungsbild ${nr}`,
  quelle: { art: 'phantom', modalitaet: 'roentgen', variante: v }, befunde: [], befundtext: '',
});
const fmt2 = (n: number) => new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

export function Befundung() {
  const [nr, setNr] = useState(1);
  const bild = BILDER.find((b) => b.nr === nr)!;
  return (
    <section className="card dx-karte" aria-labelledby="dx-befundung">
      <h3 id="dx-befundung">Röntgen-Thorax systematisch befunden</h3>
      <p className="muted">Immer in derselben Reihenfolge: erst die Technik, dann A wie Atemweg, B wie Lunge und Pleura, C wie Herz, D wie Zwerchfell, E wie alles andere. Der gelbe Rahmen zeigt, wohin du gerade schaust.</p>
      <div className="pills" role="group" aria-label="Übungsbild wählen">
        {BILDER.map((b) => <button key={b.nr} type="button" className="pill" aria-pressed={b.nr === nr} onClick={() => setNr(b.nr)}>Übungsbild {b.nr}</button>)}
      </div>
      <Lauf key={bild.variante} variante={bild.variante} nr={nr} weiter={() => setNr((nr % BILDER.length) + 1)} />
    </section>
  );
}

function Lauf({ variante, nr, weiter }: { variante: RoentgenVariante; nr: number; weiter: () => void }) {
  const schritte = useMemo(() => befundSchritte(variante), [variante]);
  const serie = useMemo(() => serieFuer(variante, nr), [variante, nr]);
  const [i, setI] = useState(0);
  const [antworten, setAntworten] = useState<Record<string, number>>({});
  const [strecken, setStrecken] = useState<Gemessen[]>([]);
  const fertig = i >= schritte.length;
  const s = schritte[Math.min(i, schritte.length - 1)]!;
  const gewaehlt = antworten[s.id];
  const htq = herzThoraxQuotient(strecken.filter((m): m is Extract<Gemessen, { art: 'strecke' }> => m.art === 'strecke'));
  const richtig = schritte.filter((x) => antworten[x.id] !== undefined && x.optionen[antworten[x.id]!]!.richtig).length;

  return (
    <div className="dx-bildlayout">
      <BildBetrachter
        serie={serie}
        hervorhebung={fertig ? null : s.bereich}
        werkzeugVorschlag={!fertig && s.art === 'htq' ? 'strecke' : 'lupe'}
        onMessungen={setStrecken}
      />
      <aside className="dx-befundspalte" aria-label="Befundschritt">
        <ol className="dx-befundschritte" aria-label="Schritte">
          {schritte.map((x, k) => (
            <li key={x.id} className={k === i ? 'is-jetzt' : antworten[x.id] === undefined ? '' : x.optionen[antworten[x.id]!]!.richtig ? 'is-richtig' : 'is-falsch'} aria-current={k === i ? 'step' : undefined} title={x.titel}>{x.buchstabe}</li>
          ))}
        </ol>
        {!fertig ? (
          <div className="dx-befundfrage" aria-live="polite">
            <h4>{s.buchstabe !== '0' && s.buchstabe !== '✓' ? `${s.buchstabe}: ` : ''}{s.titel}</h4>
            <p className="muted">{s.merksatz}</p>
            <p><strong>{s.frage}</strong></p>
            {s.art === 'htq' && (
              <p className="dx-htq" role="status">
                {htq === undefined ? 'Noch keine zwei Strecken gemessen.' : <>Dein Herz-Thorax-Quotient: <strong>{fmt2(htq)}</strong>{gewaehlt !== undefined && (htqBewertung(htq, s.soll) === 'gut' ? ' (gut gemessen)' : ` (Sollwert etwa ${fmt2(s.soll)}: miss an den äußersten Rändern)`)}</>}
              </p>
            )}
            <div className="dx-optionen">
              {s.optionen.map((o, k) => (
                <button key={o.text} type="button" disabled={gewaehlt !== undefined || (s.art === 'htq' && htq === undefined)}
                  className={gewaehlt === undefined ? '' : o.richtig ? 'is-richtig' : k === gewaehlt ? 'is-falsch' : ''}
                  onClick={() => setAntworten((a) => ({ ...a, [s.id]: k }))}>
                  {o.text}
                  {gewaehlt !== undefined && (o.richtig || k === gewaehlt) && <span className="dx-warum">{o.warum}</span>}
                </button>
              ))}
            </div>
            <div className="dx-zeile">
              <button type="button" disabled={i === 0} onClick={() => setI(i - 1)}>Zurück</button>
              <button type="button" className="primary" disabled={gewaehlt === undefined} onClick={() => setI(i + 1)}>{i === schritte.length - 1 ? 'Auswerten' : 'Nächster Schritt'}</button>
            </div>
          </div>
        ) : (
          <div className="dx-befundfrage">
            <h4>Ergebnis</h4>
            <p><strong>{richtig} von {schritte.length}</strong> Schritten richtig eingeordnet.</p>
            <p className="muted">Lösung: {schritte.find((x) => x.id === 'gesamt')!.optionen.find((o) => o.richtig)!.text}. Übe die Reihenfolge, bis sie automatisch sitzt: sie verhindert, dass ein zweiter Befund übersehen wird, wenn der erste ins Auge springt.</p>
            <div className="dx-zeile">
              <button type="button" onClick={() => { setI(0); setAntworten({}); }}>Noch einmal</button>
              <button type="button" className="primary" onClick={weiter}>Nächstes Übungsbild</button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
