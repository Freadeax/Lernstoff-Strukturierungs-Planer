import { useEffect, useState } from 'react';
import { faellig, ladeFehler } from './fehlerheft';

/** Kleiner Hinweis für die Übersicht: nur sichtbar, wenn heute Fehler zur Wiederholung dran sind. */
export function FehlerheftHinweis() {
  const [n, setN] = useState(() => faellig(ladeFehler()).length);
  useEffect(() => {
    const neu = () => setN(faellig(ladeFehler()).length);
    window.addEventListener('fehlerheft', neu);
    return () => window.removeEventListener('fehlerheft', neu);
  }, []);
  if (!n) return null;
  return (
    <p className="note" role="status">
      <strong>Fehlerheft:</strong> {n === 1 ? '1 Fehler ist' : `${n} Fehler sind`} heute zur Wiederholung dran.{' '}
      <a href="#/lernen/fehler">Jetzt wiederholen</a>
    </p>
  );
}
