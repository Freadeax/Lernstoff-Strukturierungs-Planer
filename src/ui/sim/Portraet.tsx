// Rundes Patientenporträt mit Namen. Lädt erst beim Ansehen; fällt bei Ladefehler auf die
// Initiale zurück. Zustand („angestrengt“, „kritisch“) wählt das passende Bild, sobald geliefert.

import { useState } from 'react';
import { portraetUrl, type Person, type PortraetZustand } from './personen';
import './portraet.css';

export function Portraet({ person, zustand = 'stabil', groesse = 56, mitName = false, className = '' }: {
  person: Person;
  zustand?: PortraetZustand;
  /** Durchmesser in px */
  groesse?: number;
  /** Name und Alter neben dem Bild anzeigen */
  mitName?: boolean;
  className?: string;
}) {
  const [fehler, setFehler] = useState(false);
  return (
    <span className={`portraet ${className}`.trim()}>
      <span className="portraet__bild" style={{ width: groesse, height: groesse }}>
        {fehler ? <span aria-hidden="true">{person.name.charAt(0)}</span> : (
          <img src={portraetUrl(person, zustand)} alt={mitName ? '' : person.beschreibung} width={groesse} height={groesse}
            loading="lazy" decoding="async" onError={() => setFehler(true)} />
        )}
      </span>
      {mitName && <span className="portraet__name"><strong>{person.name}</strong> <span className="muted">{person.alter} Jahre</span></span>}
    </span>
  );
}
