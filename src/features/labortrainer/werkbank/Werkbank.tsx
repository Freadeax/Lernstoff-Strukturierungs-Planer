// Labor-Werkbank: drei interaktive Stationen neben den Quizrunden des Labor-Trainers.
// Wird nur bei Bedarf geladen (eigener Chunk), damit das Startpaket nicht wächst.

import { useState } from 'react';
import './werkbank.css';
import { storage } from '../../../ui/lib/store';
import { navigate, useRoute } from '../../../ui/shell/router';
import type { Farbsystem } from '../../../ui/sim/labor/praeanalytik';
import { Entnahme } from './Entnahme';
import { Verlauf } from './Verlauf';
import { Meldung } from './Meldung';

const STATIONEN = [
  { id: 'entnahme', label: 'Blutentnahme', kurz: 'Röhrchen, Reihenfolge, Stauzeit' },
  { id: 'verlauf', label: 'Kumulativbefund', kurz: 'Verläufe lesen und handeln' },
  { id: 'meldung', label: 'Kritischer Wert', kurz: 'Anruf, Notiz, SBAR' },
] as const;
type Station = (typeof STATIONEN)[number]['id'];
const FARB_KEY = 'lernstoff.labor.farbsystem';

export default function Werkbank() {
  const { params } = useRoute();
  const p = params.get('station');
  const station: Station = STATIONEN.some((s) => s.id === p) ? (p as Station) : 'entnahme';
  const [farbsystem, setFarbsystem] = useState<Farbsystem>(() => storage.read<Farbsystem>(FARB_KEY, 'eu'));
  function farbe(f: Farbsystem) { setFarbsystem(f); storage.write(FARB_KEY, f); }

  return (
    <div className="wb">
      <div className="wb-reiter" role="tablist" aria-label="Station wählen">
        {STATIONEN.map((s) => (
          <button key={s.id} type="button" role="tab" aria-selected={station === s.id} className={station === s.id ? 'is-aktiv' : ''}
            onClick={() => navigate(`/lernen/labor?modus=werkbank&station=${s.id}`)}>
            <strong>{s.label}</strong><span className="muted wb-klein">{s.kurz}</span>
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {station === 'entnahme' && <Entnahme farbsystem={farbsystem} setFarbsystem={farbe} />}
        {station === 'verlauf' && <Verlauf />}
        {station === 'meldung' && <Meldung />}
      </div>
    </div>
  );
}
