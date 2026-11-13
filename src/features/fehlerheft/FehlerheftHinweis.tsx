import { useEffect, useState } from 'react';
import { heuteDran, ladeFehler } from './fehlerheft';

/** Kleiner Hinweis für die Übersicht: nur sichtbar, wenn heute Fehler zur Wiederholung dran sind. */
export function FehlerheftHinweis() {
  const [n, setN] = useState(() => heuteDran(ladeFehler()));
  useEffect(() => {
    const neu = () => setN(heuteDran(ladeFehler()));
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
