import { useEffect, useState } from 'react';
import { navigate } from '../../../ui/shell/router';
import { pflegeModule } from '../../../modules/pflege';
import { zaehleHeute } from '../store';

/** Eine Zeile für Übersicht und Lernplan: wie viele Karteikarten heute anstehen. */
export function KartenHinweis({ className = 'note' }: { className?: string }) {
  const [z, setZ] = useState<{ faellig: number; neu: number } | null>(null);
  useEffect(() => { zaehleHeute(pflegeModule).then(setZ).catch(() => setZ(null)); }, []);
  if (!z || (!z.faellig && !z.neu)) return null;
  const teile = [z.faellig && `${z.faellig} fällig`, z.neu && `${z.neu} neu`].filter(Boolean).join(', ');
  return (
    <p className={`${className} karten-hinweis`}>
      Karteikarten heute: {teile}.{' '}
      <button type="button" className="link" onClick={() => navigate('/lernen/karten')}>Jetzt lernen</button>
    </p>
  );
}
