// Eine Lernfrage: Befund im Bild finden, Auswahl mit Begründung oder BGA in Schritten deuten.
// Wird im Fall (Auswertung) und im Lernmodus „Befund lesen“ genutzt.

import { useState } from 'react';
import { BildBetrachter, type Markierung } from '../../ui/sim/bildgebung/BildBetrachter';
import { trifft } from '../../ui/sim/bildgebung/serie';
import { deuteBga, type Kompensation, type Stoerung } from '../../ui/sim/labor/bga';
import type { DiagnostikFall, Frage } from './typen';

const STOERUNGEN: Stoerung[] = ['normal', 'respiratorische Azidose', 'metabolische Azidose', 'respiratorische Alkalose', 'metabolische Alkalose'];
const KOMPENSATIONEN: Kompensation[] = ['keine', 'teilweise', 'vollständig'];
const fmt = (n: number, d = 0) => new Intl.NumberFormat('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);

export function FrageKarte({ frage, fall, antwort, onAntwort }: { frage: Frage; fall: DiagnostikFall; antwort?: { richtig: boolean; wahl: string }; onAntwort: (richtig: boolean, wahl: string) => void }) {
  const [markierungen, setMarkierungen] = useState<Markierung[]>([]);
  const [stoerung, setStoerung] = useState<Stoerung | ''>('');
  const [kompensation, setKompensation] = useState<Kompensation | ''>('');

  if (frage.art === 'befund') {
    const serie = fall.bildgebung.find((u) => u.serie.id === frage.serie)!.serie;
    const versuche = markierungen.length;
    return (
      <div className="dx-frage">
        <p className="dx-frage__text">{frage.frage}</p>
        <BildBetrachter
          serie={serie}
          markierungen={markierungen}
          sichtbareBefunde={antwort ? [frage.befund] : []}
          onTipp={antwort ? undefined : (x, y, schicht) => {
            const t = trifft(serie, schicht, x, y);
            const richtig = t?.id === frage.befund;
            setMarkierungen((m) => [...m, { x, y, schicht, richtig }]);
            if (richtig) onAntwort(versuche === 0, `Treffer nach ${versuche + 1} Versuch${versuche ? 'en' : ''}`);
            else if (versuche >= 2) onAntwort(false, 'Nach drei Versuchen aufgedeckt');
          }}
        />
        {!antwort && versuche > 0 && <p className="dx-hinweis" role="status">Noch nicht. {serie.quelle.modalitaet === 'ct' ? 'Blättere durch die Schichten und vergleiche beide Seiten.' : 'Vergleiche rechts und links, nutze Lupe oder Kontrast.'} ({3 - versuche} Versuch{3 - versuche === 1 ? '' : 'e'} übrig)</p>}
        {antwort && <Rueckmeldung richtig={antwort.richtig} text={`${antwort.wahl}. ${frage.erklaerung}`} />}
      </div>
    );
  }

  if (frage.art === 'wahl') {
    return (
      <div className="dx-frage">
        <p className="dx-frage__text">{frage.frage}</p>
        <div className="dx-optionen">
          {frage.optionen.map((o) => {
            const gewaehlt = antwort?.wahl === o.text;
            return (
              <button key={o.text} type="button" className={`dx-option${antwort ? (o.richtig ? ' is-richtig' : gewaehlt ? ' is-falsch' : '') : ''}`} disabled={!!antwort} aria-pressed={gewaehlt} onClick={() => onAntwort(o.richtig, o.text)}>
                <span>{o.text}</span>
                {antwort && (o.richtig || gewaehlt) && <small>{o.warum}</small>}
              </button>
            );
          })}
        </div>
        {antwort && <Rueckmeldung richtig={antwort.richtig} text={antwort.richtig ? 'Richtig.' : 'Nicht ganz, die passende Antwort ist markiert.'} />}
      </div>
    );
  }

  const w = frage.werte;
  const deutung = deuteBga(w);
  return (
    <div className="dx-frage">
      <p className="dx-frage__text">{frage.frage}</p>
      <dl className="dx-bga">
        <div><dt>pH</dt><dd>{fmt(w.ph, 2)}</dd></div>
        <div><dt>pCO₂</dt><dd>{fmt(w.pco2)} mmHg</dd></div>
        <div><dt>HCO₃⁻</dt><dd>{fmt(w.hco3, 1)} mmol/l</dd></div>
        {w.po2 !== undefined && <div><dt>pO₂</dt><dd>{fmt(w.po2)} mmHg</dd></div>}
        {w.be !== undefined && <div><dt>BE</dt><dd>{fmt(w.be, 1)}</dd></div>}
        {w.laktat !== undefined && <div><dt>Laktat</dt><dd>{fmt(w.laktat, 1)} mmol/l</dd></div>}
      </dl>
      <div className="dx-bga-wahl">
        <label>Störung
          <select value={stoerung} disabled={!!antwort} onChange={(e) => setStoerung(e.target.value as Stoerung)}>
            <option value="">bitte wählen</option>
            {STOERUNGEN.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label>Kompensation
          <select value={kompensation} disabled={!!antwort} onChange={(e) => setKompensation(e.target.value as Kompensation)}>
            <option value="">bitte wählen</option>
            {KOMPENSATIONEN.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </label>
        {!antwort && <button type="button" className="primary" disabled={!stoerung || !kompensation} onClick={() => onAntwort(stoerung === frage.stoerung && kompensation === frage.kompensation, `${stoerung}, Kompensation ${kompensation}`)}>Prüfen</button>}
      </div>
      {antwort && (
        <>
          <Rueckmeldung richtig={antwort.richtig} text={`Deine Deutung: ${antwort.wahl}. Lösung: ${frage.stoerung}, Kompensation ${frage.kompensation}. ${frage.erklaerung}`} />
          <ol className="dx-schritte">{deutung.schritte.map((s) => <li key={s}>{s.replace(/^\d+\.\s*/, '')}</li>)}</ol>
        </>
      )}
    </div>
  );
}

export function Rueckmeldung({ richtig, text }: { richtig: boolean | null; text: string }) {
  return <p className={`dx-rueck ${richtig === null ? 'is-info' : richtig ? 'is-richtig' : 'is-falsch'}`} role="status"><strong>{richtig === null ? 'Hinweis' : richtig ? '✓ Richtig' : '✗ Noch nicht'}</strong> {text}</p>;
}
