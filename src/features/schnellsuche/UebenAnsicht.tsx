import { useMemo, useState } from 'react';
import { STANDARDS } from '../dnqp/standards';
import { Runde } from '../quiz/Runde';
import { runde } from '../quiz/quiz';
import { trainingsAufgaben, TYP_LABEL, type TrainingsTyp } from './training';

const ANZAHL = [10, 15, 20];
const TYPEN: TrainingsTyp[] = ['zuordnen', 'ebene', 'irrtum'];

/** Kriterien üben: Runden direkt aus den DNQP-Daten, Fehler gehen ins Fehlerheft, Ergebnisse in den Lernplan. */
export function UebenAnsicht() {
  const [standardId, setStandardId] = useState<string>('');
  const [typen, setTypen] = useState<TrainingsTyp[]>(TYPEN);
  const [anzahl, setAnzahl] = useState(10);
  const [nr, setNr] = useState(0);
  const [laeuft, setLaeuft] = useState(false);
  const pool = useMemo(() => trainingsAufgaben(STANDARDS, { standardId: standardId || undefined, typen }), [standardId, typen]);
  const aufgaben = useMemo(() => runde(pool, anzahl), [pool, anzahl, nr]);

  if (laeuft && aufgaben.length) {
    return <Runde key={nr} aufgaben={aufgaben} quelle="expertenstandards" trainer="expertenstandards"
      onNeu={() => setNr((n) => n + 1)} onEnde={() => setLaeuft(false)} />;
  }

  function typUmschalten(t: TrainingsTyp) {
    setTypen((alt) => (alt.includes(t) ? (alt.length > 1 ? alt.filter((x) => x !== t) : alt) : [...alt, t]));
  }

  return (
    <div className="card sus__suche">
      <h2 className="sus__h2">Kriterien üben</h2>
      <p className="sus__klein">
        Jede Runde wird neu aus den Kriterien und häufigen Irrtümern der Expertenstandards gemischt.
        Falsche Antworten landen im Fehlerheft, Ergebnisse zählen im Lernplan.
      </p>
      <label className="field">Standard
        <select value={standardId} onChange={(e) => setStandardId(e.target.value)}>
          <option value="">Alle Expertenstandards</option>
          {STANDARDS.map((s) => <option key={s.id} value={s.id}>{s.kurztitel}</option>)}
        </select>
      </label>
      <div className="pills" role="group" aria-label="Aufgabentypen">
        {TYPEN.map((t) => <button type="button" key={t} className="pill" aria-pressed={typen.includes(t)} onClick={() => typUmschalten(t)}>{TYP_LABEL[t]}</button>)}
      </div>
      <div className="pills" role="group" aria-label="Aufgaben pro Runde">
        {ANZAHL.map((n) => <button type="button" key={n} className="pill" aria-pressed={anzahl === n} onClick={() => setAnzahl(n)}>{n} Aufgaben</button>)}
      </div>
      <p className="muted sus__klein" role="status">{pool.length} mögliche Aufgaben{pool.length < anzahl ? `, die Runde wird kürzer` : ''}.</p>
      <div><button type="button" className="primary" disabled={!pool.length} onClick={() => { setNr((n) => n + 1); setLaeuft(true); }}>Runde starten</button></div>
    </div>
  );
}
