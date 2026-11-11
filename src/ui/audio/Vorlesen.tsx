import { useEffect, useId } from 'react';
import './audio.css';
import { Icon } from '../icons';
import { useStore } from '../lib/store';
import { kannVorlesen, lies, stoppeVorlesen, vorleseStatus } from './vorlesen';

/**
 * Knopf „Vorlesen“: liest den Text mit der Stimme des Geräts vor, zweiter Tipp stoppt.
 * `text` darf eine Funktion sein, damit langer Text erst beim Tippen zusammengesetzt wird.
 */
export function Vorlesen({ text, label = 'Vorlesen', className = 'small ghost' }: { text: string | (() => string); label?: string; className?: string }) {
  const quelle = useId();
  const laeuft = useStore(vorleseStatus, (s) => s.laeuft && s.quelle === quelle);
  // Seite verlassen = nicht weiterreden
  useEffect(() => () => { if (vorleseStatus.get().quelle === quelle) stoppeVorlesen(); }, [quelle]);
  if (!kannVorlesen()) return null;
  return (
    <button type="button" className={`audio-knopf ${className}`} aria-pressed={laeuft}
      onClick={() => lies(typeof text === 'function' ? text() : text, quelle)}>
      <Icon name={laeuft ? 'tonAus' : 'ton'} size={16} /> {laeuft ? 'Stopp' : label}
    </button>
  );
}

export default Vorlesen;
