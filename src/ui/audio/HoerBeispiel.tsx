import { useEffect, useRef, useState } from 'react';
import './audio.css';
import { Icon } from '../icons';
import { KLANG, type KlangId, type KlangParameter } from './klaenge';
import { entsperre } from './motor';
import { spiele, starteSchleife, type Schleife } from './spieler';

/**
 * Abspielknopf für ein einzelnes Hörbeispiel (z. B. „Befund anhören“ im Praxissimulator).
 * Spielt auch bei ausgeschalteten automatischen Tönen, weil ausdrücklich angetippt. Stoppt nach `maxSek`.
 */
export function HoerBeispiel({ id, label = 'Anhören', p = {}, maxSek = 20, className = 'small ghost' }: {
  id: KlangId; label?: string; p?: KlangParameter; maxSek?: number; className?: string;
}) {
  const [an, setAn] = useState(false);
  const lauf = useRef<Schleife | null>(null);
  const stopp = () => { lauf.current?.stopp(); lauf.current = null; setAn(false); };
  useEffect(() => () => lauf.current?.stopp(), []);
  useEffect(() => {
    if (!an) return;
    const t = window.setTimeout(stopp, maxSek * 1000);
    return () => clearTimeout(t);
  }, [an, maxSek]);
  const k = KLANG[id];
  if (!k) return null;
  function umschalten() {
    if (an) { stopp(); return; }
    entsperre();
    if (!k!.schleife) { spiele(id, p, { erzwingen: true }); return; }
    lauf.current = starteSchleife(id, p, { erzwingen: true });
    setAn(!!lauf.current);
  }
  return (
    <button type="button" className={`audio-knopf ${className}`} aria-pressed={k.schleife ? an : undefined} onClick={umschalten}
      title={`${k.titel} (synthetische Nachbildung)`}>
      <Icon name={an ? 'tonAus' : 'ton'} size={16} /> {an ? 'Stopp' : label}
    </button>
  );
}

export default HoerBeispiel;
