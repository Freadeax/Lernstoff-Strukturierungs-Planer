import type { ReactNode } from 'react';
import { Titelbild, type Motiv } from './Titelbild';

export function PageHeading({ eyebrow, title, description, action, bild }: {
  eyebrow?: string; title: string; description: string; action?: ReactNode;
  /** Titelbild des Bereichs rechts neben der Überschrift (Handy: schmales Band darunter). */
  bild?: Motiv;
}) {
  const aktion = action && <div className="page-heading__action">{action}</div>;
  return <header className={`page-heading${bild ? ' page-heading--bild' : ''}`}>
    <div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p className="page-heading__description">{description}</p>}{bild && aktion}</div>
    {bild ? <Titelbild motiv={bild} sofort className="page-heading__bild" /> : aktion}
  </header>;
}
