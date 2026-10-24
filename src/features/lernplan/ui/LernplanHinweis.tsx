import { useCallback, useState } from 'react';
import './lp-hinweis.css';
import { navigate } from '../../../ui/shell/router';
import { inLernplan, type ThemenErgebnis, type TrainerId, type Uebernahme } from '../trainer';

/**
 * Speichert Trainer-Ergebnisse im Lernplan und hält fest, was passiert ist.
 * `null` = noch nichts übergeben, `[]` = nichts Zählbares dabei.
 */
export function useLernplanUebernahme(trainer: TrainerId) {
  const [uebernahme, setUebernahme] = useState<Uebernahme[] | null>(null);
  const [fehler, setFehler] = useState('');
  const uebernimm = useCallback((ergebnisse: ThemenErgebnis[]) => {
    setFehler('');
    inLernplan(trainer, ergebnisse).then(setUebernahme).catch((e) => { setUebernahme(null); setFehler(e instanceof Error ? e.message : String(e)); });
  }, [trainer]);
  const zuruecksetzen = useCallback(() => { setUebernahme(null); setFehler(''); }, []);
  return { uebernahme, fehler, uebernimm, zuruecksetzen };
}

/** Kurzer Hinweis unter einer Auswertung: welche Themen als Abfrage im Lernplan gelandet sind. */
export function LernplanHinweis({ uebernahme, fehler, leer }: { uebernahme: Uebernahme[] | null; fehler?: string; leer?: string }) {
  if (fehler) return <div className="note warn lp-hinweis" role="status">Nicht im Lernplan gespeichert: {fehler}</div>;
  if (!uebernahme) return null;
  const zaehlbar = uebernahme.filter((u) => u.status !== 'kein_thema');
  if (!zaehlbar.length) {
    return leer ? <p className="muted lp-hinweis">{leer}</p> : null;
  }
  const gespeichert = zaehlbar.filter((u) => u.status === 'gespeichert');
  return (
    <div className={`note lp-hinweis${gespeichert.length ? ' ok' : ''}`} role="status">
      <strong>{gespeichert.length ? 'Im Lernplan als Abfrage gespeichert' : 'Heute schon im Lernplan gezählt'}</strong>
      <ul className="lp-hinweis__liste">
        {zaehlbar.map((u) => (
          <li key={u.topicId}>
            <span>{u.name}</span>
            <span className="muted">
              {u.status === 'gespeichert' ? `${u.scorePercent} %` : `${u.scorePercent} %, zählt nicht (erster Versuch des Tages zählt)`}
            </span>
          </li>
        ))}
      </ul>
      <button type="button" className="ghost small" onClick={() => navigate('/lernen/plan')}>Zum Lernplan</button>
    </div>
  );
}
