// Kompetenz-Radar freiwillig an die Lehrkraft schicken: Code mit Stand je Bereich und unsicheren Themen.
// Nichts geht automatisch weg; die Person entscheidet über Name, Themen und Weg (Teilen-Menü oder Kopieren).
import { useState } from 'react';
import { DatenHinweis } from '../../ui/DatenHinweis';
import { storage } from '../../ui/lib/store';
import { packe } from '../klasse/kodierung';
import { teile } from '../klasse/teilen';
import type { RadarAchse } from './radar';
import { baueRadarStand, MAX_LUECKEN } from './radarcode';

const NAME_KEY = 'lernstoff.radar.name';

export function RadarSenden({ achsen, unsicher, heute }: { achsen: RadarAchse[]; unsicher: { id: string; name: string }[]; heute: string }) {
  const [name, setName] = useState(() => storage.read<string>(NAME_KEY, ''));
  const [mitThemen, setMitThemen] = useState(true);
  const [code, setCode] = useState('');

  async function erstellen() {
    storage.write(NAME_KEY, name.trim());
    const stand = baueRadarStand(achsen, mitThemen ? unsicher : [], name, heute);
    setCode(await packe(stand));
  }

  const text = code ? `Mein Kompetenz-Radar (Lernstoff-Planer, Lehrermodus → Klassen-Radar einfügen):\n${code}` : '';

  return (
    <details className="fs-radar-senden">
      <summary>Freiwillig an die Lehrkraft schicken</summary>
      <div className="stack-2">
        <label className="field">
          <span>Name oder Kürzel (freiwillig, leer = ohne Namen)</span>
          <input value={name} maxLength={40} onChange={(e) => { setName(e.target.value); setCode(''); }} autoComplete="off" />
        </label>
        <label className="row">
          <input type="checkbox" checked={mitThemen} onChange={(e) => { setMitThemen(e.target.checked); setCode(''); }} />
          Unsichere Themen mitschicken ({Math.min(unsicher.length, MAX_LUECKEN)} von {unsicher.length})
        </label>
        <DatenHinweis art="abgabe" fiktiv={false} detail="Der Radar-Code enthält nur den Stand je Kompetenzbereich, die angehakten Themen und den Namen, wenn du einen einträgst." />
        {!code
          ? <div className="row"><button type="button" onClick={() => void erstellen()}>Code erstellen</button></div>
          : (
            <>
              <textarea className="fs-radar-code" readOnly rows={3} value={code} aria-label="Radar-Code" onFocus={(e) => e.currentTarget.select()} />
              <div className="row">
                <button type="button" onClick={() => void teile({ title: 'Mein Kompetenz-Radar', text }, 'Radar-Code')}>Teilen oder kopieren</button>
              </div>
              <p className="muted">Die Lehrkraft fügt den Code im Lehrermodus unter „Klassen-Radar“ ein. Später neu geschickt, ersetzt er deinen alten Stand, wenn der Name gleich ist.</p>
            </>
          )}
      </div>
    </details>
  );
}
